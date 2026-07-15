import type { UnlockId } from '../content/unlocks';
import { getHazardZoneDefinition, getHazardZoneMetrics } from '../content/hazardZones';
import { clamp } from '../core/math';
import type { BossArenaPlan } from './BossArena';
import type { RouteKind, RunSkeleton } from './Generation';
import type { AppliedRouteOutcome } from './RouteEvents';
import type {
  SectorFeaturePlan,
  SectorHazardKind,
  SectorHazardPlan,
  SectorLandmarkKind,
  SectorLandmarkPlan
} from './SectorFeatures';
import type { SectorScrollPlan } from './ScrollState';
import type { FactionFrontInfluence } from './FactionFront';
import { getActRouteNode } from './ActRouteGraph';

export type SectorConditionSource =
  | RouteKind
  | 'challenge_debt_ceiling'
  | 'unlock_bloom_dossier'
  | 'frontierLaw'
  | 'factionFront'
  | 'actRouteGraph';

export interface SectorConditionModifier {
  readonly id: string;
  readonly targetSectorIndex: number;
  readonly sourceSectorIndex: number | null;
  readonly source: SectorConditionSource;
  readonly label: string;
  readonly summary: string;
  readonly scrollSpeedMultiplier: number;
  readonly lengthMultiplier: number;
  readonly hazardDensityDelta: number;
  readonly landmarkKind: SectorLandmarkKind | null;
  readonly hazardKind: SectorHazardKind | null;
  readonly bossApproachMultiplier: number;
}

export interface SectorConditionPlan {
  readonly sectorIndex: number;
  readonly sectorId: string;
  readonly modifiers: readonly SectorConditionModifier[];
  readonly scrollSpeedMultiplier: number;
  readonly lengthMultiplier: number;
  readonly hazardDensityDelta: number;
  readonly landmarkKinds: readonly SectorLandmarkKind[];
  readonly hazardKinds: readonly SectorHazardKind[];
  readonly bossApproachMultiplier: number;
}

export interface SectorConditionPlanOptions {
  readonly run: Pick<RunSkeleton, 'seed' | 'unlockedIds' | 'sectors' | 'actRouteGraph'>;
  readonly sectorIndex: number;
  readonly routeOutcomes?: readonly AppliedRouteOutcome[];
  readonly factionFront?: FactionFrontInfluence | null;
}

const ROUTE_CONDITION_CONFIGS: Readonly<
  Record<
    RouteKind,
    Omit<SectorConditionModifier, 'id' | 'targetSectorIndex' | 'sourceSectorIndex' | 'source'>
  >
> = {
  shop: {
    label: 'Market lanes',
    summary: 'Black-market traffic slows the next scroll lane and clears one hazard window.',
    scrollSpeedMultiplier: 0.94,
    lengthMultiplier: 0.98,
    hazardDensityDelta: -1,
    landmarkKind: 'convoy_shadow',
    hazardKind: null,
    bossApproachMultiplier: 1
  },
  elite: {
    label: 'Elite pursuit',
    summary: 'An ace wing accelerates the next sector and adds a pursuit hazard.',
    scrollSpeedMultiplier: 1.08,
    lengthMultiplier: 1,
    hazardDensityDelta: 1,
    landmarkKind: 'beacon_line',
    hazardKind: 'warning_beam',
    bossApproachMultiplier: 0.95
  },
  vault: {
    label: 'Vault signature',
    summary: 'Relic scanners extend the next sector and mark a sealed bulkhead.',
    scrollSpeedMultiplier: 0.99,
    lengthMultiplier: 1.04,
    hazardDensityDelta: 0,
    landmarkKind: 'vault_door',
    hazardKind: null,
    bossApproachMultiplier: 1.12
  },
  repair: {
    label: 'Repair relay',
    summary: 'Patch-bay traffic slows the next sector and opens a service platform.',
    scrollSpeedMultiplier: 0.96,
    lengthMultiplier: 0.99,
    hazardDensityDelta: -1,
    landmarkKind: 'repair_platform',
    hazardKind: null,
    bossApproachMultiplier: 1.04
  },
  glitch: {
    label: 'Glitch shear',
    summary: 'Seed distortion speeds the next sector and destabilizes an extra hazard lane.',
    scrollSpeedMultiplier: 1.12,
    lengthMultiplier: 1.02,
    hazardDensityDelta: 1,
    landmarkKind: 'beacon_line',
    hazardKind: 'salvage_storm',
    bossApproachMultiplier: 0.9
  },
  factionAmbush: {
    label: 'Ambush pressure',
    summary: 'Escort pursuit raises the next sector speed and seeds a mine-screen intercept.',
    scrollSpeedMultiplier: 1.06,
    lengthMultiplier: 1,
    hazardDensityDelta: 1,
    landmarkKind: 'beacon_line',
    hazardKind: 'mine_belt',
    bossApproachMultiplier: 0.94
  }
};

const CHALLENGE_DEBT_CEILING_CONFIG: Omit<
  SectorConditionModifier,
  'id' | 'targetSectorIndex' | 'sourceSectorIndex' | 'source'
> = {
  label: 'Debt ceiling',
  summary: 'The Debt Ceiling challenge tightens tax-beacon corridors across this sector.',
  scrollSpeedMultiplier: 1.04,
  lengthMultiplier: 0.98,
  hazardDensityDelta: 1,
  landmarkKind: 'beacon_line',
  hazardKind: 'warning_beam',
  bossApproachMultiplier: 0.96
};

const BLOOM_DOSSIER_CONFIG: Omit<
  SectorConditionModifier,
  'id' | 'targetSectorIndex' | 'sourceSectorIndex' | 'source'
> = {
  label: 'Bloom dossier',
  summary: 'Unlocked Bloom Hive charts add organic storm signatures to this sector.',
  scrollSpeedMultiplier: 1.02,
  lengthMultiplier: 1,
  hazardDensityDelta: 1,
  landmarkKind: 'core_machinery',
  hazardKind: 'salvage_storm',
  bossApproachMultiplier: 1.04
};

const CONDITION_LANDMARK_LABELS: Readonly<Record<SectorLandmarkKind, string>> = {
  wreck_silhouette: 'route-marked wreck',
  beacon_line: 'route beacon line',
  vault_door: 'vault signature',
  convoy_shadow: 'market convoy shadow',
  repair_platform: 'repair platform',
  core_machinery: 'bloom machinery',
  crater_shadow_band: 'route-marked crater shadow',
  comm_array_flyby: 'comm-array flyby',
  surface_relay: 'surface relay'
};

const CONDITION_HAZARD_LABELS: Readonly<Record<SectorHazardKind, string>> = {
  debris_lane: 'ROUTE DEBRIS',
  warning_beam: 'ROUTE BEAM',
  mine_belt: 'ROUTE MINES',
  salvage_storm: 'ROUTE STORM',
  crush_gate: 'ROUTE GATE',
  dust_plume: 'ROUTE DUST',
  mining_laser: 'ROUTE LASER',
  surface_defense_arc: 'ROUTE ARC'
};

export function createSectorConditionPlan(
  options: SectorConditionPlanOptions
): SectorConditionPlan {
  const sector = options.run.sectors[options.sectorIndex];

  if (!sector) {
    throw new Error(`No sector exists at index ${options.sectorIndex}.`);
  }

  const modifiers = [
    ...createActRouteDifficultyModifiers(options),
    ...createRouteConditionModifiers(options),
    ...createMetaConditionModifiers(options),
    ...createFrontierLawModifiers(options),
    ...createFactionFrontModifiers(options)
  ];

  return {
    sectorIndex: options.sectorIndex,
    sectorId: sector.sectorId,
    modifiers,
    scrollSpeedMultiplier: roundConditionValue(
      clamp(product(modifiers.map((modifier) => modifier.scrollSpeedMultiplier)), 0.82, 1.24)
    ),
    lengthMultiplier: roundConditionValue(
      clamp(product(modifiers.map((modifier) => modifier.lengthMultiplier)), 0.9, 1.16)
    ),
    hazardDensityDelta: modifiers.reduce(
      (total, modifier) => total + modifier.hazardDensityDelta,
      0
    ),
    landmarkKinds: modifiers
      .map((modifier) => modifier.landmarkKind)
      .filter((kind): kind is SectorLandmarkKind => kind !== null),
    hazardKinds: modifiers
      .map((modifier) => modifier.hazardKind)
      .filter((kind): kind is SectorHazardKind => kind !== null),
    bossApproachMultiplier: roundConditionValue(
      clamp(product(modifiers.map((modifier) => modifier.bossApproachMultiplier)), 0.78, 1.24)
    )
  };
}

function createFactionFrontModifiers(
  options: SectorConditionPlanOptions
): SectorConditionModifier[] {
  const front = options.factionFront;
  if (!front || front.hazardDensityDelta === 0) return [];
  return [
    {
      id: `faction-front:${front.frontId}:${front.stance}`,
      targetSectorIndex: options.sectorIndex,
      sourceSectorIndex: options.sectorIndex,
      source: 'factionFront',
      label: `${front.mapCue} ${front.strategyLabel}`,
      summary: front.forecast,
      scrollSpeedMultiplier: front.stance === 'hostility' ? 1.04 : 0.98,
      lengthMultiplier: front.stance === 'hostility' ? 1.03 : 1,
      hazardDensityDelta: front.hazardDensityDelta,
      landmarkKind:
        front.kind === 'market'
          ? 'convoy_shadow'
          : front.kind === 'contestedSetPiece'
            ? 'core_machinery'
            : 'beacon_line',
      hazardKind:
        front.hazardDensityDelta > 0
          ? front.ownerFactionId === 'faction_bloom_hive'
            ? 'salvage_storm'
            : front.ownerFactionId === 'faction_void_corsairs'
              ? 'warning_beam'
              : 'mine_belt'
          : null,
      bossApproachMultiplier: front.stance === 'hostility' ? 0.94 : 1.04
    }
  ];
}

function createFrontierLawModifiers(
  options: SectorConditionPlanOptions
): SectorConditionModifier[] {
  const law = options.run.sectors[options.sectorIndex]?.frontierLaw;
  if (!law) return [];

  return [
    {
      id: `frontier-law:${options.sectorIndex}:${law.id}`,
      targetSectorIndex: options.sectorIndex,
      sourceSectorIndex: options.sectorIndex,
      source: 'frontierLaw',
      label: law.label,
      summary: law.summary,
      scrollSpeedMultiplier: law.scrollSpeedMultiplier,
      lengthMultiplier: law.lengthMultiplier,
      hazardDensityDelta: law.hazardDensityDelta,
      landmarkKind: law.id === 'law_thermal_inversion' ? 'core_machinery' : 'beacon_line',
      hazardKind:
        law.hazardDensityDelta > 0
          ? law.id === 'law_vector_debt'
            ? 'crush_gate'
            : 'salvage_storm'
          : null,
      bossApproachMultiplier: law.bossApproachMultiplier
    }
  ];
}

export function applySectorConditionsToScroll(
  scroll: SectorScrollPlan,
  conditions: SectorConditionPlan
): SectorScrollPlan {
  if (conditions.modifiers.length === 0) {
    return scroll;
  }

  return {
    ...scroll,
    length: roundConditionValue(
      clamp(scroll.length * conditions.lengthMultiplier, scroll.length * 0.9, scroll.length * 1.16)
    ),
    baseSpeed: roundConditionValue(
      clamp(scroll.baseSpeed * conditions.scrollSpeedMultiplier, scroll.minSpeed, scroll.maxSpeed)
    )
  };
}

export function applySectorConditionsToBossArena(
  arena: BossArenaPlan | null,
  baseScroll: SectorScrollPlan,
  conditionedScroll: SectorScrollPlan,
  conditions: SectorConditionPlan
): BossArenaPlan | null {
  if (!arena || conditions.modifiers.length === 0) {
    return arena;
  }

  const scale = getDistanceScale(baseScroll, conditionedScroll);
  const lockDistance = roundConditionValue(
    clamp(arena.lockDistance * scale, 0, conditionedScroll.length)
  );
  const releaseDistance = conditionedScroll.length;
  const baseApproachDistance = Math.max(
    80,
    (arena.lockDistance - arena.approachStartDistance) * scale
  );
  const approachDistance = roundConditionValue(
    clamp(baseApproachDistance * conditions.bossApproachMultiplier, 120, 320)
  );
  const approachStartDistance = roundConditionValue(
    clamp(lockDistance - approachDistance, 0, lockDistance)
  );

  return {
    ...arena,
    approachStartDistance,
    lockDistance,
    releaseDistance,
    approachSpeed: roundConditionValue(
      clamp(
        arena.approachSpeed * conditions.scrollSpeedMultiplier,
        conditionedScroll.minSpeed,
        conditionedScroll.maxSpeed
      )
    ),
    exitSpeed: conditionedScroll.baseSpeed
  };
}

export function applySectorConditionsToFeatures(
  features: SectorFeaturePlan,
  baseScroll: SectorScrollPlan,
  conditionedScroll: SectorScrollPlan,
  conditions: SectorConditionPlan
): SectorFeaturePlan {
  if (conditions.modifiers.length === 0) {
    return features;
  }

  const scale = getDistanceScale(baseScroll, conditionedScroll);
  const landmarks = [
    ...features.landmarks.map((landmark) =>
      scaleLandmark(landmark, scale, conditionedScroll.length)
    ),
    ...conditions.modifiers
      .filter((modifier) => modifier.landmarkKind !== null)
      .map((modifier, index) => createConditionLandmark(modifier, conditionedScroll, index))
  ].sort((left, right) => left.distance - right.distance);

  let hazards = features.hazards.map((hazard) =>
    scaleHazard(hazard, scale, conditionedScroll.length)
  );

  if (conditions.hazardDensityDelta < 0) {
    hazards = hazards.slice(0, Math.max(1, hazards.length + conditions.hazardDensityDelta));
  }

  if (conditions.hazardDensityDelta > 0) {
    hazards = [
      ...hazards,
      ...conditions.modifiers
        .filter((modifier) => modifier.hazardKind !== null && modifier.hazardDensityDelta > 0)
        .slice(0, conditions.hazardDensityDelta)
        .map((modifier, index) => createConditionHazard(modifier, conditionedScroll, index))
    ];
  }

  return {
    ...features,
    landmarks,
    hazards: hazards.sort((left, right) => left.startDistance - right.startDistance)
  };
}

export function formatSectorConditionReadout(conditions: SectorConditionPlan): string {
  if (conditions.modifiers.length === 0) {
    return 'Sector conditions: standard drift.';
  }

  return `Sector conditions: ${conditions.modifiers
    .map((modifier) => modifier.label)
    .join(' | ')} (${formatNetConditionEffects(conditions).join(', ')})`;
}

export function formatSectorConditionTimeline(
  run: Pick<RunSkeleton, 'seed' | 'unlockedIds' | 'sectors' | 'actRouteGraph'>,
  routeOutcomes: readonly AppliedRouteOutcome[]
): string {
  const lastReachedSectorIndex = routeOutcomes.reduce(
    (maximum, outcome) => Math.max(maximum, outcome.sectorIndex + 1),
    0
  );
  const entries = run.sectors
    .slice(0, lastReachedSectorIndex + 1)
    .map((_sector, sectorIndex) =>
      formatSectorConditionSummary(
        createSectorConditionPlan({
          run,
          sectorIndex,
          routeOutcomes
        })
      )
    )
    .filter((summary): summary is string => summary !== null);

  return entries.length > 0 ? entries.join(' | ') : 'standard conditions';
}

function createActRouteDifficultyModifiers(
  options: SectorConditionPlanOptions
): SectorConditionModifier[] {
  const node = getActRouteNode(options.run.actRouteGraph, options.sectorIndex);
  if (!node || (node.difficulty !== 'easier' && node.difficulty !== 'harder')) return [];
  const easier = node.difficulty === 'easier';
  return [
    {
      id: `${options.run.actRouteGraph.id}:difficulty:${options.sectorIndex}`,
      targetSectorIndex: options.sectorIndex,
      sourceSectorIndex: null,
      source: 'actRouteGraph',
      label: easier ? 'Sheltered vector' : 'Contested vector',
      summary: easier
        ? 'A quieter signal shortens the operation and suppresses one hazard window.'
        : 'A hostile signal extends the operation and adds an active hazard window.',
      scrollSpeedMultiplier: easier ? 0.95 : 1.07,
      lengthMultiplier: easier ? 0.94 : 1.08,
      hazardDensityDelta: easier ? -1 : 1,
      landmarkKind: easier ? 'convoy_shadow' : 'beacon_line',
      hazardKind: easier ? null : 'warning_beam',
      bossApproachMultiplier: easier ? 1.08 : 0.92
    }
  ];
}

export function formatSectorConditionSummary(conditions: SectorConditionPlan): string | null {
  if (conditions.modifiers.length === 0) {
    return null;
  }

  return `S${conditions.sectorIndex + 1} ${conditions.modifiers
    .map((modifier) => modifier.label)
    .join(' + ')}: ${formatNetConditionEffects(conditions).join(', ')}`;
}

export function summarizeSectorConditionPlan(conditions: SectorConditionPlan): unknown {
  return {
    sectorIndex: conditions.sectorIndex,
    sectorId: conditions.sectorId,
    labels: conditions.modifiers.map((modifier) => modifier.label),
    scrollSpeedMultiplier: conditions.scrollSpeedMultiplier,
    lengthMultiplier: conditions.lengthMultiplier,
    hazardDensityDelta: conditions.hazardDensityDelta,
    landmarkKinds: conditions.landmarkKinds,
    hazardKinds: conditions.hazardKinds,
    bossApproachMultiplier: conditions.bossApproachMultiplier
  };
}

function createRouteConditionModifiers(
  options: SectorConditionPlanOptions
): SectorConditionModifier[] {
  return (options.routeOutcomes ?? [])
    .filter((outcome) => outcome.sectorIndex === options.sectorIndex)
    .flatMap((outcome) => {
      const config = ROUTE_CONDITION_CONFIGS[outcome.routeKind];

      if (!config || options.sectorIndex >= options.run.sectors.length) {
        return [];
      }

      return [
        {
          id: `${outcome.id}:sector-condition:${options.sectorIndex + 1}`,
          targetSectorIndex: options.sectorIndex,
          sourceSectorIndex: outcome.sectorIndex,
          source: outcome.routeKind,
          ...config
        }
      ];
    });
}

function createMetaConditionModifiers(
  options: SectorConditionPlanOptions
): SectorConditionModifier[] {
  const sector = options.run.sectors[options.sectorIndex];

  if (!sector) {
    return [];
  }

  const modifiers: SectorConditionModifier[] = [];

  if (
    options.run.seed === 'DEBT-CEILING-404' &&
    hasUnlock(options.run.unlockedIds, 'unlock_challenge_debt_ceiling')
  ) {
    modifiers.push({
      id: `${options.run.seed}:debt-ceiling:${options.sectorIndex + 1}`,
      targetSectorIndex: options.sectorIndex,
      sourceSectorIndex: null,
      source: 'challenge_debt_ceiling',
      ...CHALLENGE_DEBT_CEILING_CONFIG
    });
  }

  if (
    sector.bossFactionId === 'faction_bloom_hive' &&
    hasUnlock(options.run.unlockedIds, 'unlock_faction_bloom_hive')
  ) {
    modifiers.push({
      id: `${options.run.seed}:${sector.sectorId}:bloom-dossier`,
      targetSectorIndex: options.sectorIndex,
      sourceSectorIndex: null,
      source: 'unlock_bloom_dossier',
      ...BLOOM_DOSSIER_CONFIG
    });
  }

  return modifiers;
}

function createConditionLandmark(
  modifier: SectorConditionModifier,
  scroll: SectorScrollPlan,
  index: number
): SectorLandmarkPlan {
  const kind = modifier.landmarkKind ?? 'beacon_line';
  const id = `${scroll.sectorId}_condition_landmark_${modifier.source}_${index + 1}`;
  const distanceRatio = clamp(
    0.24 + index * 0.18 + ratioFromKey(`${id}:distance`, 0, 0.1),
    0.2,
    0.82
  );

  return {
    id,
    kind,
    distance: roundConditionValue(
      clamp(scroll.length * distanceRatio, 140, Math.max(140, scroll.length - 95))
    ),
    xRatio: ratioFromKey(`${id}:x`, 0.16, 0.84),
    widthRatio: ratioFromKey(`${id}:width`, 0.2, 0.44),
    heightRatio: ratioFromKey(`${id}:height`, 0.12, 0.28),
    label: CONDITION_LANDMARK_LABELS[kind]
  };
}

function createConditionHazard(
  modifier: SectorConditionModifier,
  scroll: SectorScrollPlan,
  index: number
): SectorHazardPlan {
  const kind = modifier.hazardKind ?? 'debris_lane';
  const metrics = getHazardZoneMetrics(kind, 'condition');
  const definition = getHazardZoneDefinition(kind);
  const id = `${scroll.sectorId}_condition_hazard_${modifier.source}_${index + 1}`;
  const distanceRatio = clamp(
    0.46 + index * 0.16 + ratioFromKey(`${id}:distance`, 0, 0.12),
    0.32,
    0.84
  );
  const startDistance = roundConditionValue(
    clamp(scroll.length * distanceRatio, 190, Math.max(190, scroll.length - 220))
  );
  const endDistance = roundConditionValue(
    clamp(startDistance + metrics.activeSpan, startDistance + 70, scroll.length - 35)
  );

  return {
    id,
    kind,
    telegraphDistance: roundConditionValue(Math.max(0, startDistance - metrics.telegraphLead)),
    startDistance,
    endDistance,
    xRatio: ratioFromKey(`${id}:x`, 0.18, 0.82),
    widthRatio: metrics.widthRatio,
    damage: definition.damage,
    label: CONDITION_HAZARD_LABELS[kind]
  };
}

function scaleLandmark(
  landmark: SectorLandmarkPlan,
  scale: number,
  scrollLength: number
): SectorLandmarkPlan {
  return {
    ...landmark,
    distance: roundConditionValue(clamp(landmark.distance * scale, 0, scrollLength))
  };
}

function scaleHazard(
  hazard: SectorHazardPlan,
  scale: number,
  scrollLength: number
): SectorHazardPlan {
  const startDistance = roundConditionValue(
    clamp(hazard.startDistance * scale, 70, Math.max(70, scrollLength - 90))
  );
  const telegraphLead = Math.max(35, (hazard.startDistance - hazard.telegraphDistance) * scale);
  const activeSpan = Math.max(70, (hazard.endDistance - hazard.startDistance) * scale);
  const endDistance = roundConditionValue(
    clamp(startDistance + activeSpan, startDistance + 70, scrollLength - 20)
  );

  return {
    ...hazard,
    telegraphDistance: roundConditionValue(Math.max(0, startDistance - telegraphLead)),
    startDistance,
    endDistance
  };
}

function formatNetConditionEffects(conditions: SectorConditionPlan): string[] {
  const effects: string[] = [];

  if (conditions.scrollSpeedMultiplier !== 1) {
    effects.push(`${formatPercentDelta(conditions.scrollSpeedMultiplier)} scroll`);
  }

  if (conditions.lengthMultiplier !== 1) {
    effects.push(`${formatPercentDelta(conditions.lengthMultiplier)} distance`);
  }

  if (conditions.hazardDensityDelta !== 0) {
    effects.push(`${formatSigned(conditions.hazardDensityDelta)} hazard`);
  }

  if (conditions.landmarkKinds.length > 0) {
    effects.push(`landmark ${conditions.landmarkKinds.join('/')}`);
  }

  if (conditions.bossApproachMultiplier !== 1) {
    effects.push(`${formatPercentDelta(conditions.bossApproachMultiplier)} boss approach`);
  }

  return effects.length > 0 ? effects : ['standard physical conditions'];
}

function getDistanceScale(
  baseScroll: SectorScrollPlan,
  conditionedScroll: SectorScrollPlan
): number {
  return baseScroll.length > 0 ? conditionedScroll.length / baseScroll.length : 1;
}

function product(values: readonly number[]): number {
  return values.reduce((total, value) => total * value, 1);
}

function hasUnlock(unlockedIds: readonly UnlockId[], unlockId: UnlockId): boolean {
  return unlockedIds.includes(unlockId);
}

function formatPercentDelta(multiplier: number): string {
  const delta = Math.round((multiplier - 1) * 100);
  return `${formatSigned(delta)}%`;
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function ratioFromKey(key: string, min: number, max: number): number {
  const ratio = (stableHash(key) % 1000) / 999;
  return roundConditionValue(min + (max - min) * ratio);
}

function stableHash(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function roundConditionValue(value: number): number {
  return Math.round(value * 100) / 100;
}
