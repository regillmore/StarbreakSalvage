import type { SectorId } from '../content/sectors';
import {
  DEFAULT_HAZARD_ZONE_PACING_CHOICES,
  HAZARD_ZONE_PACING_CHOICES,
  getHazardZoneDefinition,
  getHazardZoneMetrics
} from '../content/hazardZones';
import { clamp } from '../core/math';
import type { BossArenaPlan } from './BossArena';
import {
  applySectorConditionsToBossArena,
  applySectorConditionsToFeatures,
  applySectorConditionsToScroll,
  createSectorConditionPlan,
  type SectorConditionPlan
} from './SectorConditions';
import type { RunSkeleton } from './Generation';
import {
  applySectorPacingToBossArena,
  applySectorPacingToFeatures,
  applySectorPacingToScroll,
  createSectorPacingPlan,
  type SectorPacingPlan,
  type SectorPacingReliefWindow
} from './SectorPacing';
import type { SectorFeaturePlan, SectorHazardKind, SectorHazardPlan } from './SectorFeatures';
import type { AppliedRouteOutcome } from './RouteEvents';
import type { SectorScrollPlan } from './ScrollState';

export type HazardZoneDirectorPressureKind =
  | 'sector'
  | 'pacingBeat'
  | 'routePressure'
  | 'formationCluster'
  | 'lunarContext'
  | 'bossApproach'
  | 'reliefAdjusted';

export type HazardZoneDirectorEntrySource = 'sector' | 'condition' | 'director';

export type HazardZoneScheduleEventPhase = 'telegraph' | 'active' | 'clear';

export interface HazardZoneScheduleEntry {
  readonly id: string;
  readonly hazard: SectorHazardPlan;
  readonly source: HazardZoneDirectorEntrySource;
  readonly pressureKind: HazardZoneDirectorPressureKind;
  readonly distanceRatio: number;
  readonly deferredForBossLock: boolean;
}

export interface HazardZoneScheduleEvent {
  readonly id: string;
  readonly entryId: string;
  readonly hazardId: string;
  readonly phase: HazardZoneScheduleEventPhase;
  readonly distance: number;
}

export interface HazardZoneScheduleRuntimeState {
  nextEventIndex: number;
}

export interface HazardZoneDirectorPlan {
  readonly sectorIndex: number;
  readonly sectorId: SectorId;
  readonly backgroundId: string | null;
  readonly existingHazardCount: number;
  readonly scheduledHazardCount: number;
  readonly totalHazardCount: number;
  readonly pressureLevel: number;
  readonly reliefWindowCount: number;
  readonly bossDeferralCount: number;
  readonly debugLabel: string;
  readonly entries: readonly HazardZoneScheduleEntry[];
  readonly events: readonly HazardZoneScheduleEvent[];
}

export interface HazardZoneDirectorOptions {
  readonly runSeed: string;
  readonly saveStateKey?: string;
  readonly features: SectorFeaturePlan;
  readonly scroll: SectorScrollPlan;
  readonly conditions: SectorConditionPlan;
  readonly pacing: SectorPacingPlan;
  readonly bossArena: BossArenaPlan | null;
  readonly backgroundId?: string | null;
}

interface HazardZoneDirectorCandidate {
  readonly ratio: number;
  readonly pressureKind: HazardZoneDirectorPressureKind;
  readonly priority: number;
  readonly kindOverride?: SectorHazardKind;
}

const MAX_DIRECTOR_TOTAL_HAZARDS = 4;
const MIN_DIRECTOR_DISTANCE = 190;
const HAZARD_START_GAP = 120;
const RELIEF_PADDING_RATIO = 0.02;
const RELIEF_EXIT_RATIO = 0.04;

const DIRECTOR_HAZARD_LABELS: Readonly<Record<SectorHazardKind, string>> = {
  debris_lane: 'PACED DEBRIS',
  warning_beam: 'PACED BEAM',
  mine_belt: 'PACED MINES',
  salvage_storm: 'PACED STORM',
  crush_gate: 'PACED GATE',
  dust_plume: 'PACED DUST',
  mining_laser: 'PACED LASER',
  surface_defense_arc: 'PACED ARC'
};

const EVENT_PHASE_ORDER: Readonly<Record<HazardZoneScheduleEventPhase, number>> = {
  telegraph: 0,
  active: 1,
  clear: 2
};

export function createHazardZoneDirectorPlan(
  options: HazardZoneDirectorOptions
): HazardZoneDirectorPlan {
  const maxAdditional =
    options.conditions.hazardDensityDelta < 0
      ? 0
      : Math.max(0, MAX_DIRECTOR_TOTAL_HAZARDS - options.features.hazards.length);
  const existingEntries = options.features.hazards.map((hazard) =>
    createExistingEntry(hazard, options.scroll.length)
  );
  const directorEntries = createDirectorEntries(options, maxAdditional);
  const entries = [...existingEntries, ...directorEntries].sort(compareEntries);
  const pressureLevel = calculatePressureLevel(options);
  const bossDeferralCount = directorEntries.filter((entry) => entry.deferredForBossLock).length;

  return {
    sectorIndex: options.features.sectorIndex,
    sectorId: options.features.sectorId,
    backgroundId: options.backgroundId ?? null,
    existingHazardCount: options.features.hazards.length,
    scheduledHazardCount: directorEntries.length,
    totalHazardCount: entries.length,
    pressureLevel,
    reliefWindowCount: options.pacing.reliefWindows.length,
    bossDeferralCount,
    debugLabel: createDebugLabel(
      pressureLevel,
      options.pacing.reliefWindows.length,
      bossDeferralCount
    ),
    entries,
    events: createScheduleEvents(entries)
  };
}

export function applyHazardZoneDirectorToFeatures(
  features: SectorFeaturePlan,
  plan: HazardZoneDirectorPlan
): SectorFeaturePlan {
  const hazards = [
    ...features.hazards,
    ...plan.entries.filter((entry) => entry.source === 'director').map((entry) => entry.hazard)
  ].sort((left, right) => left.startDistance - right.startDistance);

  return {
    ...features,
    hazards
  };
}

export function createHazardZoneScheduleRuntimeState(
  plan: HazardZoneDirectorPlan,
  startDistance = 0
): HazardZoneScheduleRuntimeState {
  const nextEventIndex = plan.events.findIndex((event) => event.distance > startDistance);

  return {
    nextEventIndex: nextEventIndex === -1 ? plan.events.length : nextEventIndex
  };
}

export function consumeHazardZoneScheduleEvents(
  plan: HazardZoneDirectorPlan,
  state: HazardZoneScheduleRuntimeState,
  nextDistance: number
): readonly HazardZoneScheduleEvent[] {
  const events: HazardZoneScheduleEvent[] = [];
  const safeDistance = Math.max(0, nextDistance);

  while (state.nextEventIndex < plan.events.length) {
    const event = plan.events[state.nextEventIndex];

    if (!event || event.distance > safeDistance) {
      break;
    }

    events.push(event);
    state.nextEventIndex += 1;
  }

  return events;
}

export function formatHazardZoneDirectorDebug(plan: HazardZoneDirectorPlan): string {
  const deferral = plan.bossDeferralCount > 0 ? ` D${plan.bossDeferralCount}` : '';
  return `${plan.totalHazardCount} zones +${plan.scheduledHazardCount} P${plan.pressureLevel}/R${plan.reliefWindowCount}${deferral}`;
}

export function formatHazardZoneDirectorReadout(plan: HazardZoneDirectorPlan): string {
  const deferral =
    plan.bossDeferralCount > 0 ? `, ${plan.bossDeferralCount} boss-safe deferral` : '';

  return `Hazard zones: ${plan.totalHazardCount} scheduled (+${plan.scheduledHazardCount} paced, pressure ${plan.pressureLevel}, ${plan.reliefWindowCount} relief${deferral}).`;
}

export function formatHazardZoneDirectorSummary(plan: HazardZoneDirectorPlan): string | null {
  if (plan.scheduledHazardCount === 0 && plan.pressureLevel === 0) {
    return null;
  }

  const families = [
    ...new Set(
      plan.entries
        .filter((entry) => entry.source === 'director')
        .map((entry) => getHazardZoneDefinition(entry.hazard.kind).debugLabel)
    )
  ];
  const familyText = families.length > 0 ? ` ${families.join('/')}` : '';
  const bossText = plan.bossDeferralCount > 0 ? `, ${plan.bossDeferralCount} boss deferral` : '';

  return `S${plan.sectorIndex + 1} hazards: +${plan.scheduledHazardCount}${familyText}, pressure ${plan.pressureLevel}, ${plan.reliefWindowCount} relief${bossText}`;
}

export function formatHazardZoneDirectorTimeline(
  run: Pick<RunSkeleton, 'seed' | 'unlockedIds' | 'sectors'>,
  routeOutcomes: readonly AppliedRouteOutcome[]
): string {
  const entries = run.sectors
    .map((sector, sectorIndex) => {
      const conditions = createSectorConditionPlan({
        run,
        sectorIndex,
        routeOutcomes
      });
      const routeConditionedScroll = applySectorConditionsToScroll(sector.scroll, conditions);
      const routeConditionedFeatures = applySectorConditionsToFeatures(
        sector.features,
        sector.scroll,
        routeConditionedScroll,
        conditions
      );
      const pacing = createSectorPacingPlan({
        runSeed: run.seed,
        sector,
        sectorIndex,
        conditions,
        scroll: routeConditionedScroll
      });
      const scroll = applySectorPacingToScroll(routeConditionedScroll, pacing);
      const pacedFeatures = applySectorPacingToFeatures(routeConditionedFeatures, scroll, pacing);
      const routeConditionedArena = applySectorConditionsToBossArena(
        sector.arena,
        sector.scroll,
        routeConditionedScroll,
        conditions
      );
      const bossArena = applySectorPacingToBossArena(
        routeConditionedArena,
        routeConditionedScroll,
        scroll,
        pacing
      );

      return formatHazardZoneDirectorSummary(
        createHazardZoneDirectorPlan({
          runSeed: run.seed,
          saveStateKey: run.unlockedIds.join('|'),
          features: pacedFeatures,
          scroll,
          conditions,
          pacing,
          bossArena,
          backgroundId: sector.background.id
        })
      );
    })
    .filter((summary): summary is string => summary !== null);

  return entries.length > 0 ? entries.join(' | ') : 'standard hazard zoning';
}

export function summarizeHazardZoneDirectorPlan(plan: HazardZoneDirectorPlan): unknown {
  return {
    sectorIndex: plan.sectorIndex,
    sectorId: plan.sectorId,
    backgroundId: plan.backgroundId,
    existingHazardCount: plan.existingHazardCount,
    scheduledHazardCount: plan.scheduledHazardCount,
    totalHazardCount: plan.totalHazardCount,
    pressureLevel: plan.pressureLevel,
    reliefWindowCount: plan.reliefWindowCount,
    bossDeferralCount: plan.bossDeferralCount,
    entries: plan.entries.map((entry) => ({
      source: entry.source,
      pressureKind: entry.pressureKind,
      kind: entry.hazard.kind,
      distanceRatio: entry.distanceRatio,
      telegraphDistance: entry.hazard.telegraphDistance,
      startDistance: entry.hazard.startDistance,
      endDistance: entry.hazard.endDistance,
      xRatio: entry.hazard.xRatio,
      deferredForBossLock: entry.deferredForBossLock
    }))
  };
}

function createDirectorEntries(
  options: HazardZoneDirectorOptions,
  maxAdditional: number
): HazardZoneScheduleEntry[] {
  if (maxAdditional <= 0) {
    return [];
  }

  const entries: HazardZoneScheduleEntry[] = [];
  const occupiedStarts = options.features.hazards.map((hazard) => hazard.startDistance);
  const candidates = createCandidates(options);

  for (const candidate of candidates) {
    if (entries.length >= maxAdditional) {
      break;
    }

    const entry = createDirectorEntry(options, candidate, entries.length, occupiedStarts);

    if (!entry) {
      continue;
    }

    entries.push(entry);
    occupiedStarts.push(entry.hazard.startDistance);
  }

  return entries;
}

function createCandidates(
  options: HazardZoneDirectorOptions
): readonly HazardZoneDirectorCandidate[] {
  const candidates: HazardZoneDirectorCandidate[] = [];

  if (options.bossArena) {
    candidates.push({
      ratio: clamp(options.bossArena.lockDistance / options.scroll.length - 0.012, 0.58, 0.86),
      pressureKind: 'bossApproach',
      priority: 5
    });
  }

  for (const [index, kind] of options.conditions.hazardKinds.entries()) {
    candidates.push({
      ratio: clamp(0.5 + index * 0.13 + ratioFromKey(`${kind}:${index}`, 0, 0.06), 0.34, 0.84),
      pressureKind: 'routePressure',
      priority: 10,
      kindOverride: kind
    });
  }

  for (const waveIndex of options.pacing.formationClusterWaveIndexes) {
    const ratio = options.pacing.waveDistanceRatios[waveIndex];

    if (ratio !== undefined) {
      candidates.push({
        ratio: clamp(ratio + 0.13, 0.18, 0.86),
        pressureKind: 'formationCluster',
        priority: 20
      });
    }
  }

  for (const ratio of options.pacing.hazardBeatRatios) {
    candidates.push({
      ratio,
      pressureKind: 'pacingBeat',
      priority: 30
    });
  }

  if (isLunarContext(options)) {
    candidates.push({
      ratio: 0.68,
      pressureKind: 'lunarContext',
      priority: 40
    });
  }

  return [...uniqueCandidates(candidates)].sort(
    (left, right) => left.priority - right.priority || left.ratio - right.ratio
  );
}

function createDirectorEntry(
  options: HazardZoneDirectorOptions,
  candidate: HazardZoneDirectorCandidate,
  index: number,
  occupiedStarts: readonly number[]
): HazardZoneScheduleEntry | null {
  const kind = candidate.kindOverride ?? chooseHazardKind(options, candidate, index);
  const metrics = getHazardZoneMetrics(kind, 'pacing');
  const definition = getHazardZoneDefinition(kind);
  const id = `${options.features.sectorId}_director_hazard_${candidate.pressureKind}_${index + 1}`;
  const reliefAdjusted = moveOutsideReliefWindows(candidate.ratio, options.pacing.reliefWindows);
  const maximumStart = Math.max(
    MIN_DIRECTOR_DISTANCE,
    options.scroll.length - metrics.activeSpan - 35
  );
  const separatedStart = separateFromOccupiedStarts(
    clamp(options.scroll.length * reliefAdjusted.ratio, MIN_DIRECTOR_DISTANCE, maximumStart),
    occupiedStarts,
    maximumStart
  );

  if (separatedStart === null) {
    return null;
  }

  const baseWindow = createWindow(
    options.scroll.length,
    separatedStart,
    metrics.telegraphLead,
    metrics.activeSpan,
    definition.phase.minActiveSpan
  );

  if (!baseWindow) {
    return null;
  }

  const bossLockDistance = options.bossArena?.lockDistance ?? null;
  const requiresBossDeferral =
    bossLockDistance !== null && overlapsBossLock(baseWindow, bossLockDistance);
  let deferredWindow: SectorHazardWindow | null = null;

  if (requiresBossDeferral && bossLockDistance !== null) {
    deferredWindow = createDeferredBossWindow(
      options.scroll.length,
      bossLockDistance,
      metrics.telegraphLead,
      metrics.activeSpan,
      definition.phase.minActiveSpan
    );
  }

  if (requiresBossDeferral && !deferredWindow) {
    return null;
  }

  const window = deferredWindow ?? baseWindow;

  const pressureKind = reliefAdjusted.adjusted ? 'reliefAdjusted' : candidate.pressureKind;
  const hazard: SectorHazardPlan = {
    id,
    kind,
    telegraphDistance: window.telegraphDistance,
    startDistance: window.startDistance,
    endDistance: window.endDistance,
    xRatio: ratioFromKey(
      `${options.runSeed}:${options.saveStateKey ?? 'fresh'}:${id}:x`,
      0.18,
      0.82
    ),
    widthRatio: metrics.widthRatio,
    damage: definition.damage,
    label: DIRECTOR_HAZARD_LABELS[kind]
  };

  return {
    id,
    hazard,
    source: 'director',
    pressureKind,
    distanceRatio: roundDirectorValue(hazard.startDistance / options.scroll.length),
    deferredForBossLock: deferredWindow !== null
  };
}

function createWindow(
  scrollLength: number,
  startDistance: number,
  telegraphLead: number,
  activeSpan: number,
  minActiveSpan: number
): SectorHazardWindow | null {
  const availableActiveSpan = scrollLength - 35 - startDistance;

  if (availableActiveSpan < minActiveSpan) {
    return null;
  }

  const safeActiveSpan = Math.min(activeSpan, availableActiveSpan);

  return {
    telegraphDistance: roundDirectorValue(Math.max(0, startDistance - telegraphLead)),
    startDistance: roundDirectorValue(startDistance),
    endDistance: roundDirectorValue(startDistance + safeActiveSpan)
  };
}

function createDeferredBossWindow(
  scrollLength: number,
  lockDistance: number,
  telegraphLead: number,
  activeSpan: number,
  minActiveSpan: number
): SectorHazardWindow | null {
  const startDistance = roundDirectorValue(lockDistance + telegraphLead);
  return createWindow(scrollLength, startDistance, telegraphLead, activeSpan, minActiveSpan);
}

function applyScheduleSource(hazard: SectorHazardPlan): HazardZoneDirectorEntrySource {
  return hazard.id.includes('_condition_hazard_') ? 'condition' : 'sector';
}

function createExistingEntry(
  hazard: SectorHazardPlan,
  scrollLength: number
): HazardZoneScheduleEntry {
  const source = applyScheduleSource(hazard);

  return {
    id: hazard.id,
    hazard,
    source,
    pressureKind: source === 'condition' ? 'routePressure' : 'sector',
    distanceRatio: roundDirectorValue(hazard.startDistance / scrollLength),
    deferredForBossLock: false
  };
}

function createScheduleEvents(
  entries: readonly HazardZoneScheduleEntry[]
): readonly HazardZoneScheduleEvent[] {
  return entries
    .flatMap((entry) => [
      createEvent(entry, 'telegraph', entry.hazard.telegraphDistance),
      createEvent(entry, 'active', entry.hazard.startDistance),
      createEvent(entry, 'clear', entry.hazard.endDistance)
    ])
    .sort(
      (left, right) =>
        left.distance - right.distance ||
        EVENT_PHASE_ORDER[left.phase] - EVENT_PHASE_ORDER[right.phase] ||
        left.id.localeCompare(right.id)
    );
}

function createEvent(
  entry: HazardZoneScheduleEntry,
  phase: HazardZoneScheduleEventPhase,
  distance: number
): HazardZoneScheduleEvent {
  return {
    id: `${entry.id}:${phase}`,
    entryId: entry.id,
    hazardId: entry.hazard.id,
    phase,
    distance
  };
}

function chooseHazardKind(
  options: HazardZoneDirectorOptions,
  candidate: HazardZoneDirectorCandidate,
  index: number
): SectorHazardKind {
  if (candidate.pressureKind === 'bossApproach') {
    return options.features.sectorId === 'sector_core_wreck' ? 'crush_gate' : 'warning_beam';
  }

  if (options.pacing.arcKind === 'glitchShear') {
    return 'salvage_storm';
  }

  const choices =
    HAZARD_ZONE_PACING_CHOICES[options.features.sectorId] ?? DEFAULT_HAZARD_ZONE_PACING_CHOICES;
  const key = `${options.runSeed}:${options.saveStateKey ?? 'fresh'}:${options.features.sectorId}:${candidate.pressureKind}:${index}`;

  return choices[stableHash(key) % choices.length] ?? 'debris_lane';
}

function moveOutsideReliefWindows(
  ratio: number,
  reliefWindows: readonly SectorPacingReliefWindow[]
): { readonly ratio: number; readonly adjusted: boolean } {
  let nextRatio = roundDirectorValue(clamp(ratio, 0.1, 0.88));
  let adjusted = false;

  for (const window of reliefWindows) {
    if (
      nextRatio >= window.startRatio - RELIEF_PADDING_RATIO &&
      nextRatio <= window.endRatio + RELIEF_PADDING_RATIO
    ) {
      nextRatio = roundDirectorValue(clamp(window.endRatio + RELIEF_EXIT_RATIO, 0.1, 0.88));
      adjusted = true;
    }
  }

  return { ratio: nextRatio, adjusted };
}

function separateFromOccupiedStarts(
  startDistance: number,
  occupiedStarts: readonly number[],
  maximumStart: number
): number | null {
  let candidate = roundDirectorValue(startDistance);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const conflictingStart = occupiedStarts.find(
      (occupied) => Math.abs(candidate - occupied) < HAZARD_START_GAP
    );

    if (conflictingStart === undefined) {
      return candidate;
    }

    candidate = roundDirectorValue(conflictingStart + HAZARD_START_GAP);

    if (candidate > maximumStart) {
      return null;
    }
  }

  return null;
}

function overlapsBossLock(window: SectorHazardWindow, lockDistance: number): boolean {
  return window.telegraphDistance < lockDistance && window.endDistance > lockDistance;
}

function calculatePressureLevel(options: HazardZoneDirectorOptions): number {
  const routePressure = Math.max(0, options.conditions.hazardDensityDelta);
  const pacingPressure = options.pacing.arcKind === 'standard' ? 0 : 1;
  const formationPressure = options.pacing.formationClusterWaveIndexes.length > 0 ? 1 : 0;
  const bossPressure = options.bossArena ? 1 : 0;
  const lunarPressure = isLunarContext(options) ? 1 : 0;

  return Math.min(
    4,
    routePressure + pacingPressure + formationPressure + bossPressure + lunarPressure
  );
}

function isLunarContext(
  options: Pick<HazardZoneDirectorOptions, 'features' | 'backgroundId'>
): boolean {
  return (
    options.features.sectorId === 'sector_lunar_surface' ||
    (options.backgroundId?.toLowerCase().includes('lunar') ?? false)
  );
}

function uniqueCandidates(
  candidates: readonly HazardZoneDirectorCandidate[]
): readonly HazardZoneDirectorCandidate[] {
  const seen = new Set<string>();
  const unique: HazardZoneDirectorCandidate[] = [];

  for (const candidate of candidates) {
    const key = `${candidate.pressureKind}:${candidate.kindOverride ?? 'auto'}:${roundDirectorValue(candidate.ratio)}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(candidate);
  }

  return unique;
}

function compareEntries(left: HazardZoneScheduleEntry, right: HazardZoneScheduleEntry): number {
  return (
    left.hazard.telegraphDistance - right.hazard.telegraphDistance ||
    left.hazard.startDistance - right.hazard.startDistance ||
    left.id.localeCompare(right.id)
  );
}

function createDebugLabel(
  pressureLevel: number,
  reliefWindowCount: number,
  bossDeferralCount: number
): string {
  const boss = bossDeferralCount > 0 ? ` D${bossDeferralCount}` : '';
  return `HZ P${pressureLevel} R${reliefWindowCount}${boss}`;
}

function ratioFromKey(key: string, min: number, max: number): number {
  const ratio = (stableHash(key) % 1000) / 999;
  return roundDirectorValue(min + (max - min) * ratio);
}

function stableHash(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function roundDirectorValue(value: number): number {
  return Math.round(value * 100) / 100;
}

interface SectorHazardWindow {
  readonly telegraphDistance: number;
  readonly startDistance: number;
  readonly endDistance: number;
}
