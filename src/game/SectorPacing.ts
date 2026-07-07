import type { SectorEncounterPacingDefinition } from '../content/sectors';
import { clamp } from '../core/math';
import type { BossArenaPlan } from './BossArena';
import {
  applySectorConditionsToScroll,
  createSectorConditionPlan,
  type SectorConditionPlan
} from './SectorConditions';
import type { RunSkeleton, SectorRoute } from './Generation';
import type {
  SectorFeaturePlan,
  SectorHazardKind,
  SectorHazardPlan,
  SectorLandmarkKind,
  SectorLandmarkPlan
} from './SectorFeatures';
import type { SectorScrollPlan } from './ScrollState';
import type { AppliedRouteOutcome } from './RouteEvents';

export type SectorPacingArcKind =
  | 'standard'
  | 'caravan'
  | 'intercept'
  | 'vaultTransit'
  | 'glitchShear'
  | 'bossApproach'
  | 'lunarTraverse';

export type SectorPacingBeatKind =
  'pressure' | 'relief' | 'formationCluster' | 'landmark' | 'hazard' | 'bossApproach';

export interface SectorPacingBeat {
  readonly kind: SectorPacingBeatKind;
  readonly label: string;
  readonly startRatio: number;
  readonly endRatio: number;
}

export interface SectorPacingReliefWindow {
  readonly label: string;
  readonly startRatio: number;
  readonly endRatio: number;
}

export interface SectorPacingPlan {
  readonly sectorIndex: number;
  readonly sectorId: string;
  readonly arcKind: SectorPacingArcKind;
  readonly label: string;
  readonly summary: string;
  readonly debugLabel: string;
  readonly lengthMultiplier: number;
  readonly spawnSpacingMultiplier: number;
  readonly waveDistanceRatios: readonly number[];
  readonly reliefWindows: readonly SectorPacingReliefWindow[];
  readonly formationClusterWaveIndexes: readonly number[];
  readonly landmarkBeatRatios: readonly number[];
  readonly hazardBeatRatios: readonly number[];
  readonly bossApproachMultiplier: number;
  readonly beats: readonly SectorPacingBeat[];
}

export interface SectorPacingPlanOptions {
  readonly runSeed: string;
  readonly sector: SectorRoute;
  readonly sectorIndex: number;
  readonly conditions: SectorConditionPlan;
  readonly scroll: SectorScrollPlan;
}

const DEFAULT_SPAWN_SPACING = 40;
const STANDARD_PACING_PLAN: Omit<
  SectorPacingPlan,
  'sectorIndex' | 'sectorId' | 'waveDistanceRatios'
> = {
  arcKind: 'standard',
  label: 'Standard drift',
  summary: 'standard pressure arc',
  debugLabel: 'standard',
  lengthMultiplier: 1,
  spawnSpacingMultiplier: 1,
  reliefWindows: [],
  formationClusterWaveIndexes: [],
  landmarkBeatRatios: [],
  hazardBeatRatios: [],
  bossApproachMultiplier: 1,
  beats: []
};

const ARC_LABELS: Readonly<Record<SectorPacingArcKind, string>> = {
  standard: 'Standard drift',
  caravan: 'Long caravan',
  intercept: 'Intercept run',
  vaultTransit: 'Vault transit',
  glitchShear: 'Shear corridor',
  bossApproach: 'Boss approach',
  lunarTraverse: 'Low-orbit traverse'
};

const SECTOR_LANDMARK_CHOICES: Readonly<Record<string, readonly SectorLandmarkKind[]>> = {
  sector_outer_debris_field: ['wreck_silhouette', 'beacon_line'],
  sector_trade_war_corridor: ['convoy_shadow', 'beacon_line'],
  sector_bio_machine_bloom: ['core_machinery', 'repair_platform'],
  sector_corporate_kill_grid: ['beacon_line', 'core_machinery'],
  sector_lunar_surface: ['crater_shadow_band', 'comm_array_flyby', 'surface_relay'],
  sector_core_wreck: ['core_machinery', 'wreck_silhouette']
};

const SECTOR_HAZARD_CHOICES: Readonly<Record<string, readonly SectorHazardKind[]>> = {
  sector_outer_debris_field: ['debris_lane', 'mine_belt'],
  sector_trade_war_corridor: ['warning_beam', 'mine_belt'],
  sector_bio_machine_bloom: ['salvage_storm', 'mine_belt'],
  sector_corporate_kill_grid: ['warning_beam', 'crush_gate'],
  sector_lunar_surface: ['dust_plume', 'mining_laser', 'surface_defense_arc'],
  sector_core_wreck: ['crush_gate', 'warning_beam']
};
const DEFAULT_LANDMARK_CHOICES: readonly SectorLandmarkKind[] = ['wreck_silhouette', 'beacon_line'];
const DEFAULT_HAZARD_CHOICES: readonly SectorHazardKind[] = ['debris_lane', 'mine_belt'];

const LANDMARK_LABELS: Readonly<Record<SectorLandmarkKind, string>> = {
  wreck_silhouette: 'pacing wreck silhouette',
  beacon_line: 'pacing beacon line',
  vault_door: 'pacing vault door',
  convoy_shadow: 'pacing convoy shadow',
  repair_platform: 'pacing repair platform',
  core_machinery: 'pacing core machinery',
  crater_shadow_band: 'pacing crater shadow',
  comm_array_flyby: 'pacing comm-array flyby',
  surface_relay: 'pacing surface relay'
};

const HAZARD_LABELS: Readonly<Record<SectorHazardKind, string>> = {
  debris_lane: 'PACING DEBRIS',
  warning_beam: 'PACING BEAM',
  mine_belt: 'PACING MINES',
  salvage_storm: 'PACING STORM',
  crush_gate: 'PACING GATE',
  dust_plume: 'PACING DUST',
  mining_laser: 'PACING LASER',
  surface_defense_arc: 'PACING ARC'
};

export function createSectorPacingPlan(options: SectorPacingPlanOptions): SectorPacingPlan {
  const arcKind = chooseArcKind(options);
  const requiredWaves = Math.max(1, options.sector.objective.requiredWaves);
  const waveDistanceRatios =
    arcKind === 'standard'
      ? []
      : createWaveDistanceRatios(requiredWaves, options.sector.objective.bossRequired, arcKind);

  if (arcKind === 'standard') {
    return {
      ...STANDARD_PACING_PLAN,
      sectorIndex: options.sectorIndex,
      sectorId: options.sector.sectorId,
      waveDistanceRatios
    };
  }

  const reliefWindows = createReliefWindows(waveDistanceRatios);
  const formationClusterWaveIndexes = createFormationClusterWaveIndexes(requiredWaves, arcKind);
  const landmarkBeatRatios = uniqueRatios([
    ...reliefWindows.map((window) => midpoint(window.startRatio, window.endRatio)),
    ...waveDistanceRatios.filter((_ratio, index) => index % 2 === 0)
  ]).slice(0, 3);
  const hazardBeatRatios =
    options.conditions.hazardDensityDelta >= 0
      ? uniqueRatios(waveDistanceRatios.map((ratio) => clamp(ratio + 0.07, 0.12, 0.88))).slice(0, 2)
      : [];
  const lengthMultiplier = getLengthMultiplier(options, arcKind);
  const spawnSpacingMultiplier = roundPacingValue(
    clamp(1.08 + reliefWindows.length * 0.06 + formationClusterWaveIndexes.length * 0.03, 1, 1.28)
  );
  const bossApproachMultiplier = getBossApproachMultiplier(options, arcKind);

  return {
    sectorIndex: options.sectorIndex,
    sectorId: options.sector.sectorId,
    arcKind,
    label: ARC_LABELS[arcKind],
    summary: createPacingSummary(arcKind, reliefWindows, formationClusterWaveIndexes),
    debugLabel: createDebugLabel(arcKind, reliefWindows, formationClusterWaveIndexes),
    lengthMultiplier,
    spawnSpacingMultiplier,
    waveDistanceRatios,
    reliefWindows,
    formationClusterWaveIndexes,
    landmarkBeatRatios,
    hazardBeatRatios,
    bossApproachMultiplier,
    beats: createPacingBeats({
      arcKind,
      waveDistanceRatios,
      reliefWindows,
      formationClusterWaveIndexes,
      landmarkBeatRatios,
      hazardBeatRatios,
      bossApproachMultiplier
    })
  };
}

export function applySectorPacingToScroll(
  scroll: SectorScrollPlan,
  pacing: SectorPacingPlan
): SectorScrollPlan {
  if (pacing.arcKind === 'standard') {
    return scroll;
  }

  return {
    ...scroll,
    length: roundPacingValue(
      clamp(scroll.length * pacing.lengthMultiplier, scroll.length, scroll.length * 1.18)
    )
  };
}

export function applySectorPacingToEncounterPacing(
  pacing: SectorEncounterPacingDefinition | null,
  sectorPacing: SectorPacingPlan
): SectorEncounterPacingDefinition | null {
  if (sectorPacing.arcKind === 'standard') {
    return pacing;
  }

  const base = pacing ?? {
    waveWindowStartRatio: 0.12,
    waveWindowEndRatio: 0.58,
    spawnSpacing: DEFAULT_SPAWN_SPACING,
    firstSpawnXRatio: 0.5,
    flankXMinRatio: 0.2,
    flankXMaxRatio: 0.8,
    targetYMin: 86,
    targetYMax: 182
  };
  const firstRatio = sectorPacing.waveDistanceRatios[0] ?? base.waveWindowStartRatio;
  const lastRatio =
    sectorPacing.waveDistanceRatios[sectorPacing.waveDistanceRatios.length - 1] ??
    base.waveWindowEndRatio;

  return {
    ...base,
    waveWindowStartRatio: roundPacingValue(Math.min(base.waveWindowStartRatio, firstRatio)),
    waveWindowEndRatio: roundPacingValue(Math.max(base.waveWindowEndRatio, lastRatio)),
    waveDistanceRatios: sectorPacing.waveDistanceRatios,
    spawnSpacing: roundPacingValue(base.spawnSpacing * sectorPacing.spawnSpacingMultiplier)
  };
}

export function applySectorPacingToFeatures(
  features: SectorFeaturePlan,
  scroll: SectorScrollPlan,
  pacing: SectorPacingPlan
): SectorFeaturePlan {
  if (pacing.arcKind === 'standard') {
    return features;
  }

  const landmarks = [
    ...features.landmarks,
    ...pacing.landmarkBeatRatios.map((ratio, index) =>
      createPacingLandmark(features.sectorId, scroll, pacing, ratio, index)
    )
  ].sort((left, right) => left.distance - right.distance);
  const remainingHazardBudget = Math.max(0, 4 - features.hazards.length);
  const hazards = [
    ...features.hazards,
    ...pacing.hazardBeatRatios
      .slice(0, remainingHazardBudget)
      .map((ratio, index) => createPacingHazard(features.sectorId, scroll, pacing, ratio, index))
  ].sort((left, right) => left.startDistance - right.startDistance);

  return {
    ...features,
    landmarks,
    hazards
  };
}

export function applySectorPacingToBossArena(
  arena: BossArenaPlan | null,
  routeConditionedScroll: SectorScrollPlan,
  pacedScroll: SectorScrollPlan,
  pacing: SectorPacingPlan
): BossArenaPlan | null {
  if (!arena || pacing.arcKind === 'standard') {
    return arena;
  }

  const scale =
    routeConditionedScroll.length > 0 ? pacedScroll.length / routeConditionedScroll.length : 1;
  const lockDistance = roundPacingValue(clamp(arena.lockDistance * scale, 0, pacedScroll.length));
  const baseApproachDistance = Math.max(
    90,
    (arena.lockDistance - arena.approachStartDistance) * scale
  );
  const approachDistance = roundPacingValue(
    clamp(baseApproachDistance * pacing.bossApproachMultiplier, 120, 380)
  );
  const approachStartDistance = roundPacingValue(
    clamp(lockDistance - approachDistance, 0, lockDistance)
  );

  return {
    ...arena,
    approachStartDistance,
    lockDistance,
    releaseDistance: pacedScroll.length,
    exitSpeed: pacedScroll.baseSpeed
  };
}

export function formatSectorPacingReadout(pacing: SectorPacingPlan): string {
  if (pacing.arcKind === 'standard') {
    return 'Sector pacing: standard arc.';
  }

  return `Sector pacing: ${pacing.label} (${formatPacingEffects(pacing).join(', ')})`;
}

export function formatSectorPacingSummary(pacing: SectorPacingPlan): string | null {
  if (pacing.arcKind === 'standard') {
    return null;
  }

  return `S${pacing.sectorIndex + 1} ${pacing.label}: ${formatPacingEffects(pacing).join(', ')}`;
}

export function formatSectorPacingTimeline(
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
      const conditionedScroll = applySectorConditionsToScroll(sector.scroll, conditions);
      return formatSectorPacingSummary(
        createSectorPacingPlan({
          runSeed: run.seed,
          sector,
          sectorIndex,
          conditions,
          scroll: conditionedScroll
        })
      );
    })
    .filter((summary): summary is string => summary !== null);

  return entries.length > 0 ? entries.join(' | ') : 'standard pacing';
}

export function getActiveSectorPacingBeat(
  pacing: SectorPacingPlan,
  distance: number,
  sectorLength: number
): SectorPacingBeat | null {
  if (pacing.arcKind === 'standard' || sectorLength <= 0) {
    return null;
  }

  const progressRatio = clamp(distance / sectorLength, 0, 1);

  return (
    pacing.beats.find(
      (beat) => progressRatio >= beat.startRatio && progressRatio <= beat.endRatio
    ) ?? null
  );
}

export function formatSectorPacingBeatDebug(
  pacing: SectorPacingPlan,
  distance: number,
  sectorLength: number
): string | null {
  if (pacing.arcKind === 'standard') {
    return null;
  }

  const activeBeat = getActiveSectorPacingBeat(pacing, distance, sectorLength);

  return activeBeat
    ? `${pacing.label} ${activeBeat.kind}:${activeBeat.label}`
    : `${pacing.label} travel`;
}

export function summarizeSectorPacingPlan(pacing: SectorPacingPlan): unknown {
  return {
    sectorIndex: pacing.sectorIndex,
    sectorId: pacing.sectorId,
    arcKind: pacing.arcKind,
    label: pacing.label,
    lengthMultiplier: pacing.lengthMultiplier,
    spawnSpacingMultiplier: pacing.spawnSpacingMultiplier,
    waveDistanceRatios: pacing.waveDistanceRatios,
    reliefWindows: pacing.reliefWindows,
    formationClusterWaveIndexes: pacing.formationClusterWaveIndexes,
    landmarkBeatRatios: pacing.landmarkBeatRatios,
    hazardBeatRatios: pacing.hazardBeatRatios,
    bossApproachMultiplier: pacing.bossApproachMultiplier
  };
}

function chooseArcKind(options: SectorPacingPlanOptions): SectorPacingArcKind {
  const sources = new Set(options.conditions.modifiers.map((modifier) => modifier.source));
  const routePressure =
    options.conditions.lengthMultiplier > 1.01 ||
    options.conditions.hazardDensityDelta > 0 ||
    options.conditions.modifiers.some(
      (modifier) =>
        modifier.source === 'elite' ||
        modifier.source === 'factionAmbush' ||
        modifier.source === 'glitch' ||
        modifier.source === 'vault'
    );
  const naturalLongSector =
    options.sector.index >= 3 ||
    options.sector.sectorId === 'sector_lunar_surface' ||
    options.sector.sectorId === 'sector_core_wreck' ||
    options.sector.objective.bossRequired;

  if (!routePressure && !naturalLongSector) {
    return 'standard';
  }

  if (sources.has('glitch')) {
    return 'glitchShear';
  }

  if (sources.has('factionAmbush') || sources.has('elite')) {
    return 'intercept';
  }

  if (sources.has('vault')) {
    return 'vaultTransit';
  }

  if (options.sector.sectorId === 'sector_lunar_surface') {
    return 'lunarTraverse';
  }

  if (options.sector.objective.bossRequired) {
    return 'bossApproach';
  }

  return 'caravan';
}

function getLengthMultiplier(
  options: SectorPacingPlanOptions,
  arcKind: SectorPacingArcKind
): number {
  const routeBonus = Math.min(0.07, Math.max(0, options.conditions.modifiers.length) * 0.018);
  const hazardBonus = Math.max(0, options.conditions.hazardDensityDelta) * 0.012;
  const sectorBonus = options.sector.index >= 4 ? 0.045 : options.sector.index >= 3 ? 0.03 : 0;
  const bossBonus = options.sector.objective.bossRequired ? 0.04 : 0;
  const arcBonus =
    arcKind === 'vaultTransit'
      ? 0.045
      : arcKind === 'glitchShear'
        ? 0.035
        : arcKind === 'intercept'
          ? 0.04
          : arcKind === 'lunarTraverse'
            ? 0.035
            : 0.025;

  return roundPacingValue(
    clamp(1 + routeBonus + hazardBonus + sectorBonus + bossBonus + arcBonus, 1, 1.16)
  );
}

function getBossApproachMultiplier(
  options: SectorPacingPlanOptions,
  arcKind: SectorPacingArcKind
): number {
  if (!options.sector.objective.bossRequired) {
    return arcKind === 'intercept' || arcKind === 'glitchShear' ? 0.96 : 1;
  }

  if (arcKind === 'glitchShear' || arcKind === 'intercept') {
    return 0.94;
  }

  return 1.12;
}

function createWaveDistanceRatios(
  requiredWaves: number,
  bossRequired: boolean,
  arcKind: SectorPacingArcKind
): readonly number[] {
  if (requiredWaves === 1) {
    return [bossRequired ? 0.34 : 0.48];
  }

  if (requiredWaves === 2) {
    return bossRequired ? [0.14, 0.42] : [0.2, 0.7];
  }

  if (bossRequired) {
    return arcKind === 'glitchShear' || arcKind === 'intercept'
      ? [0.1, 0.25, 0.48]
      : [0.12, 0.32, 0.55];
  }

  if (arcKind === 'vaultTransit') {
    return [0.2, 0.5, 0.82].slice(0, requiredWaves);
  }

  if (arcKind === 'intercept') {
    return [0.16, 0.38, 0.74].slice(0, requiredWaves);
  }

  if (arcKind === 'lunarTraverse') {
    return [0.18, 0.48, 0.78].slice(0, requiredWaves);
  }

  return [0.18, 0.44, 0.76].slice(0, requiredWaves);
}

function createReliefWindows(
  waveDistanceRatios: readonly number[]
): readonly SectorPacingReliefWindow[] {
  const windows: SectorPacingReliefWindow[] = [];

  for (let index = 0; index < waveDistanceRatios.length - 1; index += 1) {
    const left = waveDistanceRatios[index] ?? 0;
    const right = waveDistanceRatios[index + 1] ?? left;
    const startRatio = roundPacingValue(clamp(left + 0.09, 0.08, 0.88));
    const endRatio = roundPacingValue(clamp(right - 0.08, startRatio, 0.9));

    if (endRatio - startRatio >= 0.08) {
      windows.push({
        label: `relief ${index + 1}`,
        startRatio,
        endRatio
      });
    }
  }

  return windows;
}

function createFormationClusterWaveIndexes(
  requiredWaves: number,
  arcKind: SectorPacingArcKind
): readonly number[] {
  if (requiredWaves < 2) {
    return [];
  }

  if (arcKind === 'intercept') {
    return [Math.min(1, requiredWaves - 1)];
  }

  return [requiredWaves - 1];
}

function createPacingBeats(options: {
  readonly arcKind: SectorPacingArcKind;
  readonly waveDistanceRatios: readonly number[];
  readonly reliefWindows: readonly SectorPacingReliefWindow[];
  readonly formationClusterWaveIndexes: readonly number[];
  readonly landmarkBeatRatios: readonly number[];
  readonly hazardBeatRatios: readonly number[];
  readonly bossApproachMultiplier: number;
}): readonly SectorPacingBeat[] {
  const pressure = options.waveDistanceRatios.map((ratio, index) => ({
    kind: 'pressure' as const,
    label: `wave ${index + 1}`,
    startRatio: roundPacingValue(clamp(ratio - 0.04, 0, 1)),
    endRatio: roundPacingValue(clamp(ratio + 0.08, 0, 1))
  }));
  const relief = options.reliefWindows.map((window) => ({
    kind: 'relief' as const,
    label: window.label,
    startRatio: window.startRatio,
    endRatio: window.endRatio
  }));
  const formations = options.formationClusterWaveIndexes.map((waveIndex) => {
    const ratio = options.waveDistanceRatios[waveIndex] ?? 0.5;
    return {
      kind: 'formationCluster' as const,
      label: `formation wave ${waveIndex + 1}`,
      startRatio: roundPacingValue(clamp(ratio - 0.03, 0, 1)),
      endRatio: roundPacingValue(clamp(ratio + 0.1, 0, 1))
    };
  });
  const landmarks = options.landmarkBeatRatios.map((ratio, index) => ({
    kind: 'landmark' as const,
    label: `landmark ${index + 1}`,
    startRatio: roundPacingValue(clamp(ratio - 0.04, 0, 1)),
    endRatio: roundPacingValue(clamp(ratio + 0.04, 0, 1))
  }));
  const hazards = options.hazardBeatRatios.map((ratio, index) => ({
    kind: 'hazard' as const,
    label: `hazard ${index + 1}`,
    startRatio: roundPacingValue(clamp(ratio - 0.05, 0, 1)),
    endRatio: roundPacingValue(clamp(ratio + 0.08, 0, 1))
  }));
  const boss =
    options.bossApproachMultiplier !== 1 || options.arcKind === 'bossApproach'
      ? [
          {
            kind: 'bossApproach' as const,
            label: 'boss approach',
            startRatio: 0.62,
            endRatio: 0.84
          }
        ]
      : [];

  return [...pressure, ...relief, ...formations, ...landmarks, ...hazards, ...boss].sort(
    (left, right) => left.startRatio - right.startRatio
  );
}

function createPacingLandmark(
  sectorId: string,
  scroll: SectorScrollPlan,
  pacing: SectorPacingPlan,
  ratio: number,
  index: number
): SectorLandmarkPlan {
  const kind = chooseLandmarkKind(sectorId, pacing, index);
  const id = `${sectorId}_pacing_landmark_${pacing.arcKind}_${index + 1}`;

  return {
    id,
    kind,
    distance: roundPacingValue(clamp(scroll.length * ratio, 120, scroll.length - 90)),
    xRatio: ratioFromKey(`${id}:x`, 0.16, 0.84),
    widthRatio: ratioFromKey(`${id}:width`, 0.2, 0.44),
    heightRatio: ratioFromKey(`${id}:height`, 0.12, 0.28),
    label: LANDMARK_LABELS[kind]
  };
}

function createPacingHazard(
  sectorId: string,
  scroll: SectorScrollPlan,
  pacing: SectorPacingPlan,
  ratio: number,
  index: number
): SectorHazardPlan {
  const kind = chooseHazardKind(sectorId, pacing, index);
  const id = `${sectorId}_pacing_hazard_${pacing.arcKind}_${index + 1}`;
  const metrics = getHazardMetrics(kind);
  const startDistance = roundPacingValue(clamp(scroll.length * ratio, 180, scroll.length - 180));
  const endDistance = roundPacingValue(
    clamp(startDistance + metrics.activeSpan, startDistance + 70, scroll.length - 35)
  );

  return {
    id,
    kind,
    telegraphDistance: roundPacingValue(Math.max(0, startDistance - metrics.telegraphLead)),
    startDistance,
    endDistance,
    xRatio: ratioFromKey(`${id}:x`, 0.18, 0.82),
    widthRatio: metrics.widthRatio,
    damage: 1,
    label: HAZARD_LABELS[kind]
  };
}

function chooseLandmarkKind(
  sectorId: string,
  pacing: SectorPacingPlan,
  index: number
): SectorLandmarkKind {
  if (pacing.arcKind === 'vaultTransit') {
    return 'vault_door';
  }

  if (pacing.arcKind === 'intercept') {
    return 'convoy_shadow';
  }

  const choices = SECTOR_LANDMARK_CHOICES[sectorId] ?? DEFAULT_LANDMARK_CHOICES;
  return choices[index % choices.length] ?? 'beacon_line';
}

function chooseHazardKind(
  sectorId: string,
  pacing: SectorPacingPlan,
  index: number
): SectorHazardKind {
  if (pacing.arcKind === 'glitchShear') {
    return 'salvage_storm';
  }

  if (pacing.arcKind === 'bossApproach') {
    return sectorId === 'sector_core_wreck' ? 'crush_gate' : 'warning_beam';
  }

  const choices = SECTOR_HAZARD_CHOICES[sectorId] ?? DEFAULT_HAZARD_CHOICES;
  return choices[index % choices.length] ?? 'debris_lane';
}

function getHazardMetrics(kind: SectorHazardKind): {
  readonly widthRatio: number;
  readonly activeSpan: number;
  readonly telegraphLead: number;
} {
  switch (kind) {
    case 'warning_beam':
    case 'mining_laser':
      return { widthRatio: 0.11, activeSpan: 125, telegraphLead: 180 };
    case 'crush_gate':
      return { widthRatio: 0.28, activeSpan: 125, telegraphLead: 180 };
    case 'salvage_storm':
      return { widthRatio: 0.42, activeSpan: 200, telegraphLead: 150 };
    case 'dust_plume':
      return { widthRatio: 0.34, activeSpan: 170, telegraphLead: 165 };
    case 'surface_defense_arc':
      return { widthRatio: 0.24, activeSpan: 150, telegraphLead: 170 };
    case 'mine_belt':
      return { widthRatio: 0.32, activeSpan: 155, telegraphLead: 145 };
    default:
      return { widthRatio: 0.2, activeSpan: 170, telegraphLead: 145 };
  }
}

function createPacingSummary(
  arcKind: SectorPacingArcKind,
  reliefWindows: readonly SectorPacingReliefWindow[],
  formationClusterWaveIndexes: readonly number[]
): string {
  const relief = `${reliefWindows.length} relief window${reliefWindows.length === 1 ? '' : 's'}`;
  const formations =
    formationClusterWaveIndexes.length > 0
      ? `formation W${formationClusterWaveIndexes.map((index) => index + 1).join('/')}`
      : 'solo waves';

  return `${ARC_LABELS[arcKind]} with ${relief} and ${formations}`;
}

function createDebugLabel(
  arcKind: SectorPacingArcKind,
  reliefWindows: readonly SectorPacingReliefWindow[],
  formationClusterWaveIndexes: readonly number[]
): string {
  const formationText =
    formationClusterWaveIndexes.length > 0
      ? `F${formationClusterWaveIndexes.map((index) => index + 1).join('/')}`
      : 'F0';

  return `${arcKind} R${reliefWindows.length} ${formationText}`;
}

function formatPacingEffects(pacing: SectorPacingPlan): string[] {
  const effects: string[] = [];

  if (pacing.lengthMultiplier !== 1) {
    effects.push(`${formatPercentDelta(pacing.lengthMultiplier)} arc distance`);
  }

  if (pacing.spawnSpacingMultiplier !== 1) {
    effects.push(`${formatPercentDelta(pacing.spawnSpacingMultiplier)} wave spacing`);
  }

  if (pacing.reliefWindows.length > 0) {
    effects.push(`${pacing.reliefWindows.length} relief`);
  }

  if (pacing.formationClusterWaveIndexes.length > 0) {
    effects.push(
      `formation W${pacing.formationClusterWaveIndexes.map((index) => index + 1).join('/')}`
    );
  }

  if (pacing.landmarkBeatRatios.length > 0) {
    effects.push(`${pacing.landmarkBeatRatios.length} landmark beats`);
  }

  if (pacing.hazardBeatRatios.length > 0) {
    effects.push(`${pacing.hazardBeatRatios.length} hazard beats`);
  }

  if (pacing.bossApproachMultiplier !== 1) {
    effects.push(`${formatPercentDelta(pacing.bossApproachMultiplier)} boss approach`);
  }

  return effects.length > 0 ? effects : ['standard pacing'];
}

function midpoint(left: number, right: number): number {
  return roundPacingValue((left + right) / 2);
}

function uniqueRatios(ratios: readonly number[]): readonly number[] {
  return [...new Set(ratios.map((ratio) => roundPacingValue(clamp(ratio, 0.08, 0.9))))].sort(
    (left, right) => left - right
  );
}

function ratioFromKey(key: string, min: number, max: number): number {
  const ratio = (stableHash(key) % 1000) / 999;
  return roundPacingValue(min + (max - min) * ratio);
}

function stableHash(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function formatPercentDelta(multiplier: number): string {
  const delta = Math.round((multiplier - 1) * 100);
  return `${delta > 0 ? '+' : ''}${delta}%`;
}

function roundPacingValue(value: number): number {
  return Math.round(value * 100) / 100;
}
