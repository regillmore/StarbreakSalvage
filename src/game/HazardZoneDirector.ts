import type { SectorId } from '../content/sectors';
import type { ExpeditionOperationalRole } from '../content/expeditions';
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
import { createBeamHazardGeometry, formatBeamHazardTrack } from './BeamHazard';
import {
  getActPressureHazardRatio,
  shouldScheduleActPressureHazard,
  type ActPressureModel
} from './ActPressure';

export type HazardZoneDirectorPressureKind =
  | 'sector'
  | 'pacingBeat'
  | 'routePressure'
  | 'actPressure'
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
  readonly adjustedForBossApproach: boolean;
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
  readonly sequenceOrdinal: number | null;
  readonly backgroundId: string | null;
  readonly existingHazardCount: number;
  readonly scheduledHazardCount: number;
  readonly totalHazardCount: number;
  readonly pressureLevel: number;
  readonly reliefWindowCount: number;
  readonly bossApproachAdjustmentCount: number;
  readonly debugLabel: string;
  readonly entries: readonly HazardZoneScheduleEntry[];
  readonly events: readonly HazardZoneScheduleEvent[];
}

export interface HazardZoneDirectorOptions {
  readonly runSeed: string;
  readonly saveStateKey?: string;
  readonly sequenceKey?: string;
  readonly sequenceOrdinal?: number;
  readonly features: SectorFeaturePlan;
  readonly scroll: SectorScrollPlan;
  readonly conditions: SectorConditionPlan;
  readonly pacing: SectorPacingPlan;
  readonly bossArena: BossArenaPlan | null;
  readonly backgroundId?: string | null;
  readonly actPressure?: ActPressureModel;
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
const HAZARD_SEQUENCE_ROLE_SLOTS = 8;
const HAZARD_SEQUENCE_LANE_SLOT_COUNT = 641;
const HAZARD_SEQUENCE_ORDINAL_STEP = 173;
const HAZARD_SEQUENCE_ENTRY_STEP = 97;
const BOSS_APPROACH_CLEARANCE = 18;
const BOSS_APPROACH_HAZARD_GAP = 12;

const HAZARD_SEQUENCE_ROLE_SLOT: Readonly<Record<ExpeditionOperationalRole, number>> = {
  ingress: 0,
  advance: 1,
  detour: 2,
  staging: 3,
  gate: 4,
  pursuit: 5,
  extraction: 6
};

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
  const existingEntries = options.features.hazards.map((hazard, index) =>
    createExistingEntry(diversifyExistingHazard(options, hazard, index), options.scroll.length)
  );
  const rawDirectorEntries = createDirectorEntries(options, maxAdditional);
  const entries = settleHazardsBeforeBossLock(
    [...existingEntries, ...rawDirectorEntries],
    options.bossArena,
    options.scroll.length
  ).sort(compareEntries);
  const directorEntries = entries.filter((entry) => entry.source === 'director');
  const pressureLevel = calculatePressureLevel(options);
  const bossApproachAdjustmentCount = entries.filter(
    (entry) => entry.adjustedForBossApproach
  ).length;

  return {
    sectorIndex: options.features.sectorIndex,
    sectorId: options.features.sectorId,
    sequenceOrdinal: options.sequenceOrdinal ?? null,
    backgroundId: options.backgroundId ?? null,
    existingHazardCount: entries.length - directorEntries.length,
    scheduledHazardCount: directorEntries.length,
    totalHazardCount: entries.length,
    pressureLevel,
    reliefWindowCount: options.pacing.reliefWindows.length,
    bossApproachAdjustmentCount,
    debugLabel: createDebugLabel(
      pressureLevel,
      options.pacing.reliefWindows.length,
      bossApproachAdjustmentCount
    ),
    entries,
    events: createScheduleEvents(entries)
  };
}

export function applyHazardZoneDirectorToFeatures(
  features: SectorFeaturePlan,
  plan: HazardZoneDirectorPlan
): SectorFeaturePlan {
  const hazards = plan.entries
    .map((entry) => entry.hazard)
    .sort((left, right) => left.startDistance - right.startDistance);

  return {
    ...features,
    hazards
  };
}

export function getHazardSequenceOrdinal(
  sectorIndex: number,
  operationalRole: ExpeditionOperationalRole | null
): number {
  const safeSectorIndex = Math.max(0, Math.floor(sectorIndex));
  const roleSlot = operationalRole === null ? 7 : HAZARD_SEQUENCE_ROLE_SLOT[operationalRole];
  return safeSectorIndex * HAZARD_SEQUENCE_ROLE_SLOTS + roleSlot;
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
  const deferral =
    plan.bossApproachAdjustmentCount > 0 ? ` A${plan.bossApproachAdjustmentCount}` : '';
  const sequence = plan.sequenceOrdinal === null ? '' : ` Q${plan.sequenceOrdinal}`;
  const beam = plan.entries.find((entry) => entry.hazard.kind === 'warning_beam')?.hazard.beam;
  const beamTrack = beam ? ` B[${formatBeamHazardTrack(beam)}]` : '';
  return `${plan.totalHazardCount} zones +${plan.scheduledHazardCount} P${plan.pressureLevel}/R${plan.reliefWindowCount}${sequence}${beamTrack}${deferral}`;
}

export function formatHazardZoneDirectorReadout(plan: HazardZoneDirectorPlan): string {
  const deferral =
    plan.bossApproachAdjustmentCount > 0
      ? `, ${plan.bossApproachAdjustmentCount} boss-approach adjustment`
      : '';

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
  const bossText =
    plan.bossApproachAdjustmentCount > 0
      ? `, ${plan.bossApproachAdjustmentCount} boss-approach adjustment`
      : '';

  return `S${plan.sectorIndex + 1} hazards: +${plan.scheduledHazardCount}${familyText}, pressure ${plan.pressureLevel}, ${plan.reliefWindowCount} relief${bossText}`;
}

export function formatHazardZoneDirectorTimeline(
  run: Pick<RunSkeleton, 'seed' | 'unlockedIds' | 'sectors' | 'actRouteGraph'>,
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
    sequenceOrdinal: plan.sequenceOrdinal,
    backgroundId: plan.backgroundId,
    existingHazardCount: plan.existingHazardCount,
    scheduledHazardCount: plan.scheduledHazardCount,
    totalHazardCount: plan.totalHazardCount,
    pressureLevel: plan.pressureLevel,
    reliefWindowCount: plan.reliefWindowCount,
    bossApproachAdjustmentCount: plan.bossApproachAdjustmentCount,
    entries: plan.entries.map((entry) => ({
      source: entry.source,
      pressureKind: entry.pressureKind,
      kind: entry.hazard.kind,
      distanceRatio: entry.distanceRatio,
      telegraphDistance: entry.hazard.telegraphDistance,
      startDistance: entry.hazard.startDistance,
      endDistance: entry.hazard.endDistance,
      xRatio: entry.hazard.xRatio,
      beam: entry.hazard.beam ?? null,
      adjustedForBossApproach: entry.adjustedForBossApproach
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

  if (options.actPressure && shouldScheduleActPressureHazard(options.actPressure)) {
    candidates.push({
      ratio: getActPressureHazardRatio(options.actPressure),
      pressureKind: 'actPressure',
      priority: 15
    });
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

  const window = baseWindow;

  const pressureKind = reliefAdjusted.adjusted ? 'reliefAdjusted' : candidate.pressureKind;
  const hazard: SectorHazardPlan = {
    id,
    kind,
    telegraphDistance: window.telegraphDistance,
    startDistance: window.startDistance,
    endDistance: window.endDistance,
    xRatio: getHazardSequenceLaneRatio(options, options.features.hazards.length + index, id),
    widthRatio: metrics.widthRatio,
    damage: definition.damage,
    label: DIRECTOR_HAZARD_LABELS[kind],
    ...(kind === 'warning_beam' ? { beam: createOperationBeamGeometry(options, id, index) } : {})
  };

  return {
    id,
    hazard,
    source: 'director',
    pressureKind,
    distanceRatio: roundDirectorValue(hazard.startDistance / options.scroll.length),
    adjustedForBossApproach: false
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

function settleHazardsBeforeBossLock(
  entries: readonly HazardZoneScheduleEntry[],
  bossArena: BossArenaPlan | null,
  scrollLength: number
): HazardZoneScheduleEntry[] {
  if (!bossArena) return [...entries];

  let latestEnd = roundDirectorValue(bossArena.lockDistance - BOSS_APPROACH_CLEARANCE);
  const settled: HazardZoneScheduleEntry[] = [];

  for (const entry of [...entries].sort(
    (left, right) => right.hazard.startDistance - left.hazard.startDistance
  )) {
    const hazard = entry.hazard;
    const telegraphLead = Math.max(1, hazard.startDistance - hazard.telegraphDistance);
    const activeSpan = Math.max(1, hazard.endDistance - hazard.startDistance);
    const endDistance = Math.min(hazard.endDistance, latestEnd);
    const startDistance = roundDirectorValue(endDistance - activeSpan);
    const telegraphDistance = roundDirectorValue(startDistance - telegraphLead);

    if (telegraphDistance < 0 || endDistance <= 0) continue;

    const adjusted = endDistance < hazard.endDistance;
    const settledHazard = adjusted
      ? {
          ...hazard,
          telegraphDistance,
          startDistance,
          endDistance: roundDirectorValue(endDistance)
        }
      : hazard;

    settled.push({
      ...entry,
      hazard: settledHazard,
      distanceRatio: roundDirectorValue(settledHazard.startDistance / scrollLength),
      adjustedForBossApproach: adjusted
    });
    latestEnd = roundDirectorValue(
      Math.min(latestEnd, settledHazard.telegraphDistance - BOSS_APPROACH_HAZARD_GAP)
    );
  }

  return settled;
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
    adjustedForBossApproach: false
  };
}

function diversifyExistingHazard(
  options: HazardZoneDirectorOptions,
  hazard: SectorHazardPlan,
  index: number
): SectorHazardPlan {
  if (options.sequenceKey === undefined && options.sequenceOrdinal === undefined) {
    return hazard;
  }

  const source = applyScheduleSource(hazard);
  const kind = source === 'sector' ? chooseExistingHazardKind(options, index) : hazard.kind;
  const definition = getHazardZoneDefinition(kind);
  const metrics = getHazardZoneMetrics(kind, 'sector');
  const { beam: previousBeam, ...baseHazard } = hazard;
  void previousBeam;
  const telegraphLead = Math.max(
    hazard.startDistance - hazard.telegraphDistance,
    definition.phase.minTelegraphLead
  );
  const activeSpan = Math.max(
    hazard.endDistance - hazard.startDistance,
    definition.phase.minActiveSpan
  );

  return {
    ...baseHazard,
    kind,
    telegraphDistance: roundDirectorValue(Math.max(0, hazard.startDistance - telegraphLead)),
    endDistance: roundDirectorValue(
      Math.min(options.scroll.length, hazard.startDistance + activeSpan)
    ),
    xRatio: getHazardSequenceLaneRatio(options, index, hazard.id),
    widthRatio: metrics.widthRatio,
    damage: definition.damage,
    label: source === 'sector' ? definition.label : hazard.label,
    ...(kind === 'warning_beam'
      ? { beam: createOperationBeamGeometry(options, hazard.id, index) }
      : {})
  };
}

function createOperationBeamGeometry(
  options: HazardZoneDirectorOptions,
  hazardId: string,
  entryIndex: number
) {
  return createBeamHazardGeometry(
    `${options.runSeed}:${options.saveStateKey ?? 'fresh'}:${options.sequenceKey ?? 'base'}:${options.sequenceOrdinal ?? options.features.sectorIndex}:${hazardId}:${entryIndex}`
  );
}

function chooseExistingHazardKind(
  options: HazardZoneDirectorOptions,
  index: number
): SectorHazardKind {
  const choices =
    HAZARD_ZONE_PACING_CHOICES[options.features.sectorId] ?? DEFAULT_HAZARD_ZONE_PACING_CHOICES;
  const offset =
    stableHash(
      `${options.runSeed}:${options.saveStateKey ?? 'fresh'}:${options.sequenceKey ?? 'base'}:sector-hazards`
    ) % choices.length;

  return choices[(offset + index) % choices.length] ?? 'debris_lane';
}

function getHazardSequenceLaneRatio(
  options: HazardZoneDirectorOptions,
  entryIndex: number,
  fallbackKey: string
): number {
  if (options.sequenceOrdinal === undefined) {
    return ratioFromKey(
      `${options.runSeed}:${options.saveStateKey ?? 'fresh'}:${options.sequenceKey ?? fallbackKey}:${fallbackKey}:x`,
      0.18,
      0.82
    );
  }

  const seedOffset =
    stableHash(`${options.runSeed}:${options.saveStateKey ?? 'fresh'}:hazard-lane-order`) %
    HAZARD_SEQUENCE_LANE_SLOT_COUNT;
  const ordinal = Math.max(0, Math.floor(options.sequenceOrdinal));
  const laneSlot =
    (seedOffset +
      ordinal * HAZARD_SEQUENCE_ORDINAL_STEP +
      entryIndex * HAZARD_SEQUENCE_ENTRY_STEP) %
    HAZARD_SEQUENCE_LANE_SLOT_COUNT;

  return roundSequenceRatio(0.18 + laneSlot / 1000);
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
  const key = `${options.runSeed}:${options.saveStateKey ?? 'fresh'}:${options.sequenceKey ?? 'base'}:${options.features.sectorId}:${candidate.pressureKind}:${index}`;

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

function calculatePressureLevel(options: HazardZoneDirectorOptions): number {
  const routePressure = Math.max(0, options.conditions.hazardDensityDelta);
  const pacingPressure = options.pacing.arcKind === 'standard' ? 0 : 1;
  const formationPressure = options.pacing.formationClusterWaveIndexes.length > 0 ? 1 : 0;
  const bossPressure = options.bossArena ? 1 : 0;
  const lunarPressure = isLunarContext(options) ? 1 : 0;
  const actPressure = options.actPressure?.hazardPressure ?? 0;

  return Math.min(
    4,
    routePressure + pacingPressure + formationPressure + bossPressure + lunarPressure + actPressure
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
  bossApproachAdjustmentCount: number
): string {
  const boss = bossApproachAdjustmentCount > 0 ? ` A${bossApproachAdjustmentCount}` : '';
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

function roundSequenceRatio(value: number): number {
  return Math.round(value * 1000) / 1000;
}

interface SectorHazardWindow {
  readonly telegraphDistance: number;
  readonly startDistance: number;
  readonly endDistance: number;
}
