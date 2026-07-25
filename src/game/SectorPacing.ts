import type { SectorEncounterPacingDefinition } from '../content/sectors';
import { clamp } from '../core/math';
import type { BossArenaPlan } from './BossArena';
import type { SectorObjectiveVariantId } from './SectorObjectives';
import {
  applySectorConditionsToScroll,
  createSectorConditionPlan,
  type SectorConditionPlan
} from './SectorConditions';
import type { RunSkeleton, SectorRoute } from './Generation';
import type { SectorFeaturePlan, SectorLandmarkKind, SectorLandmarkPlan } from './SectorFeatures';
import type { SectorScrollPlan } from './ScrollState';
import type { AppliedRouteOutcome } from './RouteEvents';

export type SectorPacingArcKind =
  | 'standard'
  | 'wrecklineExpedition'
  | 'caravan'
  | 'intercept'
  | 'vaultTransit'
  | 'glitchShear'
  | 'bossApproach'
  | 'lunarTraverse'
  | 'act2Traverse'
  | 'act2Lockdown'
  | 'act2Finale';

export type SectorPacingLengthBand = 'standard' | 'extended' | 'deep' | 'finale';

export type SectorPacingPressureBand =
  'baseline' | 'sustained' | 'volatile' | 'bossApproach' | 'finale';

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
  readonly lengthBand: SectorPacingLengthBand;
  readonly pressureBand: SectorPacingPressureBand;
  readonly objectiveVariantId: SectorObjectiveVariantId | null;
  readonly objectiveVariantLabel: string | null;
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
  lengthBand: 'standard',
  pressureBand: 'baseline',
  objectiveVariantId: null,
  objectiveVariantLabel: null,
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
  wrecklineExpedition: 'Wreckline expedition',
  caravan: 'Long caravan',
  intercept: 'Intercept run',
  vaultTransit: 'Vault transit',
  glitchShear: 'Shear corridor',
  bossApproach: 'Boss approach',
  lunarTraverse: 'Low-orbit traverse',
  act2Traverse: 'Core-depth traverse',
  act2Lockdown: 'Core lockdown',
  act2Finale: 'Finale descent'
};

const SECTOR_LANDMARK_CHOICES: Readonly<Record<string, readonly SectorLandmarkKind[]>> = {
  sector_outer_debris_field: ['wreck_silhouette', 'beacon_line', 'repair_platform'],
  sector_trade_war_corridor: ['convoy_shadow', 'beacon_line'],
  sector_bio_machine_bloom: ['core_machinery', 'repair_platform'],
  sector_corporate_kill_grid: ['beacon_line', 'core_machinery'],
  sector_lunar_surface: ['crater_shadow_band', 'comm_array_flyby', 'surface_relay'],
  sector_core_wreck: ['core_machinery', 'wreck_silhouette']
};

const DEFAULT_LANDMARK_CHOICES: readonly SectorLandmarkKind[] = ['wreck_silhouette', 'beacon_line'];

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

export function createSectorPacingPlan(options: SectorPacingPlanOptions): SectorPacingPlan {
  const arcKind = chooseArcKind(options);
  const lengthBand = chooseLengthBand(options);
  const pressureBand = choosePressureBand(options, arcKind);
  const objectiveVariantId = options.sector.objective.variantId ?? null;
  const objectiveVariantLabel = options.sector.objective.variantLabel ?? null;
  const requiredWaves = Math.max(1, options.sector.objective.requiredWaves);
  const waveDistanceRatios =
    arcKind === 'standard'
      ? []
      : createWaveDistanceRatios({
          requiredWaves,
          bossRequired: options.sector.objective.bossRequired,
          arcKind,
          pressureBand
        });

  if (arcKind === 'standard') {
    return {
      ...STANDARD_PACING_PLAN,
      sectorIndex: options.sectorIndex,
      sectorId: options.sector.sectorId,
      objectiveVariantId,
      objectiveVariantLabel,
      waveDistanceRatios
    };
  }

  const reliefWindows = createReliefWindows(waveDistanceRatios, {
    bossRequired: options.sector.objective.bossRequired,
    pressureBand,
    isActTwo: options.sector.act.actId === 'act_core_descent'
  });
  const formationClusterWaveIndexes = createFormationClusterWaveIndexes(requiredWaves, arcKind);
  const landmarkBeatRatios = uniqueRatios([
    ...(arcKind === 'wrecklineExpedition'
      ? [0.14, 0.42, 0.7]
      : [
          ...reliefWindows.map((window) => midpoint(window.startRatio, window.endRatio)),
          ...waveDistanceRatios.filter((_ratio, index) => index % 2 === 0)
        ])
  ]).slice(0, 3);
  const hazardBeatRatios =
    options.conditions.hazardDensityDelta >= 0
      ? arcKind === 'wrecklineExpedition'
        ? [0.5, 0.77]
        : uniqueRatios(waveDistanceRatios.map((ratio) => clamp(ratio + 0.07, 0.12, 0.88))).slice(
            0,
            2
          )
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
    summary: createPacingSummary({
      arcKind,
      lengthBand,
      pressureBand,
      objectiveVariantLabel,
      reliefWindows,
      formationClusterWaveIndexes
    }),
    debugLabel: createDebugLabel({
      arcKind,
      lengthBand,
      pressureBand,
      objectiveVariantId,
      reliefWindows,
      formationClusterWaveIndexes
    }),
    lengthBand,
    pressureBand,
    objectiveVariantId,
    objectiveVariantLabel,
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
      bossApproachMultiplier,
      pressureBand
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
      clamp(
        scroll.length * pacing.lengthMultiplier,
        scroll.length,
        scroll.length * getScrollCap(pacing)
      )
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

  return {
    ...features,
    landmarks
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
    lengthBand: pacing.lengthBand,
    pressureBand: pacing.pressureBand,
    objectiveVariantId: pacing.objectiveVariantId,
    objectiveVariantLabel: pacing.objectiveVariantLabel,
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
  const isActTwo = options.sector.act.actId === 'act_core_descent';
  const isOpeningWreckline =
    options.sector.act.actId === 'act_outer_rim' &&
    options.sector.act.actSectorIndex === 1 &&
    options.sector.sectorId === 'sector_outer_debris_field';
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

  if (isOpeningWreckline) {
    return 'wrecklineExpedition';
  }

  if (!routePressure && !naturalLongSector && !isActTwo) {
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

  if (isActTwo && options.sector.objective.bossRequired) {
    return options.sector.act.actSectorIndex >= options.sector.act.actSectorCount
      ? 'act2Finale'
      : 'act2Lockdown';
  }

  if (options.sector.objective.bossRequired) {
    return 'bossApproach';
  }

  if (isActTwo) {
    return 'act2Traverse';
  }

  return 'caravan';
}

function chooseLengthBand(options: SectorPacingPlanOptions): SectorPacingLengthBand {
  if (
    options.sector.act.actId === 'act_outer_rim' &&
    options.sector.act.actSectorIndex === 1 &&
    options.sector.sectorId === 'sector_outer_debris_field'
  ) {
    return 'extended';
  }

  if (options.sector.act.actId !== 'act_core_descent') {
    return options.sector.index >= 4 || options.sector.objective.bossRequired
      ? 'extended'
      : 'standard';
  }

  if (
    options.sector.sectorId === 'sector_core_wreck' ||
    options.sector.act.actSectorIndex >= options.sector.act.actSectorCount
  ) {
    return 'finale';
  }

  return options.sector.act.actSectorIndex >= 3 || options.sector.objective.bossRequired
    ? 'deep'
    : 'extended';
}

function choosePressureBand(
  options: SectorPacingPlanOptions,
  arcKind: SectorPacingArcKind
): SectorPacingPressureBand {
  if (
    options.sector.act.actId === 'act_core_descent' &&
    (options.sector.sectorId === 'sector_core_wreck' ||
      options.sector.act.actSectorIndex >= options.sector.act.actSectorCount)
  ) {
    return 'finale';
  }

  if (options.sector.objective.bossRequired) {
    return 'bossApproach';
  }

  if (arcKind === 'glitchShear' || arcKind === 'intercept') {
    return 'volatile';
  }

  if (
    options.conditions.hazardDensityDelta > 0 ||
    options.conditions.scrollSpeedMultiplier > 1.05
  ) {
    return 'volatile';
  }

  if (options.sector.act.actId === 'act_core_descent') {
    return 'sustained';
  }

  return 'baseline';
}

function getLengthMultiplier(
  options: SectorPacingPlanOptions,
  arcKind: SectorPacingArcKind
): number {
  const routeBonus = Math.min(0.07, Math.max(0, options.conditions.modifiers.length) * 0.018);
  const hazardBonus = Math.max(0, options.conditions.hazardDensityDelta) * 0.012;
  const sectorBonus = options.sector.index >= 4 ? 0.045 : options.sector.index >= 3 ? 0.03 : 0;
  const bossBonus = options.sector.objective.bossRequired ? 0.04 : 0;
  const actBonus = getActTwoLengthBonus(options);
  const quietRouteOffset = getQuietRouteLengthOffset(options);

  if (arcKind === 'wrecklineExpedition') {
    return roundPacingValue(clamp(1.32 + routeBonus + hazardBonus, 1.32, 1.38));
  }

  const arcBonus =
    arcKind === 'vaultTransit'
      ? 0.045
      : arcKind === 'glitchShear'
        ? 0.035
        : arcKind === 'intercept'
          ? 0.04
          : arcKind === 'lunarTraverse'
            ? 0.035
            : arcKind === 'act2Finale'
              ? 0.05
              : arcKind === 'act2Lockdown'
                ? 0.04
                : arcKind === 'act2Traverse'
                  ? 0.035
                  : 0.025;
  const cap = options.sector.act.actId === 'act_core_descent' ? 1.2 : 1.16;

  return roundPacingValue(
    clamp(
      1 +
        routeBonus +
        hazardBonus +
        sectorBonus +
        bossBonus +
        actBonus +
        quietRouteOffset +
        arcBonus,
      1,
      cap
    )
  );
}

function getBossApproachMultiplier(
  options: SectorPacingPlanOptions,
  arcKind: SectorPacingArcKind
): number {
  if (!options.sector.objective.bossRequired) {
    return arcKind === 'intercept' || arcKind === 'glitchShear' ? 0.96 : 1;
  }

  if (options.sector.act.actId === 'act_core_descent') {
    if (arcKind === 'act2Finale') {
      return 1.24;
    }

    if (arcKind === 'glitchShear' || arcKind === 'intercept') {
      return 1.02;
    }

    return 1.16;
  }

  if (arcKind === 'glitchShear' || arcKind === 'intercept') {
    return 0.94;
  }

  return 1.12;
}

function createWaveDistanceRatios(options: {
  readonly requiredWaves: number;
  readonly bossRequired: boolean;
  readonly arcKind: SectorPacingArcKind;
  readonly pressureBand: SectorPacingPressureBand;
}): readonly number[] {
  const { requiredWaves, bossRequired, arcKind, pressureBand } = options;

  if (arcKind === 'wrecklineExpedition') {
    return [0.1, 0.22, 0.55, 0.82].slice(0, requiredWaves);
  }

  if (requiredWaves === 1) {
    return [bossRequired ? 0.34 : 0.48];
  }

  if (requiredWaves === 2) {
    if (pressureBand === 'sustained' || pressureBand === 'volatile') {
      return bossRequired ? [0.12, 0.4] : [0.16, 0.66];
    }

    return bossRequired ? [0.14, 0.42] : [0.2, 0.7];
  }

  if (bossRequired) {
    if (pressureBand === 'finale') {
      return [0.09, 0.28, 0.52].slice(0, requiredWaves);
    }

    if (pressureBand === 'bossApproach') {
      return [0.11, 0.31, 0.54].slice(0, requiredWaves);
    }

    return arcKind === 'glitchShear' || arcKind === 'intercept'
      ? [0.1, 0.25, 0.48]
      : [0.12, 0.32, 0.55];
  }

  if (pressureBand === 'volatile') {
    return [0.13, 0.4, 0.74].slice(0, requiredWaves);
  }

  if (pressureBand === 'sustained') {
    return [0.16, 0.46, 0.8].slice(0, requiredWaves);
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
  waveDistanceRatios: readonly number[],
  options: {
    readonly bossRequired: boolean;
    readonly pressureBand: SectorPacingPressureBand;
    readonly isActTwo: boolean;
  }
): readonly SectorPacingReliefWindow[] {
  const windows: SectorPacingReliefWindow[] = [];
  const minimumSpan = options.pressureBand === 'volatile' ? 0.07 : 0.08;

  for (let index = 0; index < waveDistanceRatios.length - 1; index += 1) {
    const left = waveDistanceRatios[index] ?? 0;
    const right = waveDistanceRatios[index + 1] ?? left;
    const startRatio = roundPacingValue(clamp(left + 0.09, 0.08, 0.88));
    const endRatio = roundPacingValue(clamp(right - 0.08, startRatio, 0.9));

    if (endRatio - startRatio >= minimumSpan) {
      windows.push({
        label: `relief ${index + 1}`,
        startRatio,
        endRatio
      });
    }
  }

  if (options.isActTwo && options.pressureBand !== 'baseline' && waveDistanceRatios.length > 0) {
    const finalWaveRatio = waveDistanceRatios[waveDistanceRatios.length - 1] ?? 0.5;
    const startRatio = roundPacingValue(clamp(finalWaveRatio + 0.07, 0.1, 0.86));
    const endRatio = roundPacingValue(clamp(options.bossRequired ? 0.66 : 0.9, startRatio, 0.92));

    if (endRatio - startRatio >= 0.07) {
      windows.push({
        label: options.bossRequired ? 'approach relief' : 'exit relief',
        startRatio,
        endRatio
      });
    }
  }

  return windows.sort((left, right) => left.startRatio - right.startRatio);
}

function createFormationClusterWaveIndexes(
  requiredWaves: number,
  arcKind: SectorPacingArcKind
): readonly number[] {
  if (requiredWaves < 2) {
    return [];
  }

  if (arcKind === 'wrecklineExpedition') {
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
  readonly pressureBand: SectorPacingPressureBand;
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
            startRatio: options.pressureBand === 'finale' ? 0.56 : 0.62,
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

function createPacingSummary(options: {
  readonly arcKind: SectorPacingArcKind;
  readonly lengthBand: SectorPacingLengthBand;
  readonly pressureBand: SectorPacingPressureBand;
  readonly objectiveVariantLabel: string | null;
  readonly reliefWindows: readonly SectorPacingReliefWindow[];
  readonly formationClusterWaveIndexes: readonly number[];
}): string {
  const relief = `${options.reliefWindows.length} relief window${
    options.reliefWindows.length === 1 ? '' : 's'
  }`;
  const formations =
    options.formationClusterWaveIndexes.length > 0
      ? `formation W${options.formationClusterWaveIndexes.map((index) => index + 1).join('/')}`
      : 'solo waves';
  const objective = options.objectiveVariantLabel
    ? `, ${options.objectiveVariantLabel.toLowerCase()}`
    : '';

  return `${ARC_LABELS[options.arcKind]} ${options.lengthBand}/${options.pressureBand} with ${relief} and ${formations}${objective}`;
}

function createDebugLabel(options: {
  readonly arcKind: SectorPacingArcKind;
  readonly lengthBand: SectorPacingLengthBand;
  readonly pressureBand: SectorPacingPressureBand;
  readonly objectiveVariantId: SectorObjectiveVariantId | null;
  readonly reliefWindows: readonly SectorPacingReliefWindow[];
  readonly formationClusterWaveIndexes: readonly number[];
}): string {
  const formationText =
    options.formationClusterWaveIndexes.length > 0
      ? `F${options.formationClusterWaveIndexes.map((index) => index + 1).join('/')}`
      : 'F0';
  const objectiveText =
    options.objectiveVariantId && options.objectiveVariantId !== 'standardSweep'
      ? ` ${options.objectiveVariantId}`
      : '';

  return `${options.arcKind} ${options.lengthBand}/${options.pressureBand} R${options.reliefWindows.length} ${formationText}${objectiveText}`;
}

function formatPacingEffects(pacing: SectorPacingPlan): string[] {
  const effects: string[] = [];

  if (pacing.lengthMultiplier !== 1) {
    effects.push(`${formatPercentDelta(pacing.lengthMultiplier)} arc distance`);
  }

  if (pacing.lengthBand !== 'standard') {
    effects.push(`${pacing.lengthBand} length band`);
  }

  if (pacing.pressureBand !== 'baseline') {
    effects.push(`${pacing.pressureBand} pressure`);
  }

  if (pacing.objectiveVariantLabel && pacing.objectiveVariantId !== 'standardSweep') {
    effects.push(pacing.objectiveVariantLabel);
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

function getScrollCap(pacing: SectorPacingPlan): number {
  if (pacing.arcKind === 'wrecklineExpedition') {
    return 1.38;
  }

  if (pacing.lengthBand === 'finale') {
    return 1.22;
  }

  if (pacing.lengthBand === 'deep') {
    return 1.2;
  }

  return 1.18;
}

function getActTwoLengthBonus(options: SectorPacingPlanOptions): number {
  if (options.sector.act.actId !== 'act_core_descent') {
    return 0;
  }

  const actDepthBonus = Math.max(0, options.sector.act.actSectorIndex - 1) * 0.012;
  const finaleBonus =
    options.sector.sectorId === 'sector_core_wreck' ||
    options.sector.act.actSectorIndex >= options.sector.act.actSectorCount
      ? 0.018
      : 0;

  return Math.min(0.07, 0.024 + actDepthBonus + finaleBonus);
}

function getQuietRouteLengthOffset(options: SectorPacingPlanOptions): number {
  const quietRouteCount = options.conditions.modifiers.filter(
    (modifier) => modifier.source === 'shop' || modifier.source === 'repair'
  ).length;

  return quietRouteCount > 0 ? -0.012 : 0;
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
