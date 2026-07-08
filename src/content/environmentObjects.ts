import type { FactionId } from './factions';
import type { SectorId } from './sectors';

export const ENVIRONMENT_OBJECT_IDS = [
  'debris_shard_cluster',
  'cargo_pod',
  'shield_gate',
  'lunar_rock_field',
  'surface_pylon',
  'wreck_plate',
  'salvage_cache',
  'volatile_canister'
] as const;
export type EnvironmentObjectId = (typeof ENVIRONMENT_OBJECT_IDS)[number];

export const ENVIRONMENT_OBJECT_KINDS = ['destructible', 'obstacle'] as const;
export type EnvironmentObjectKind = (typeof ENVIRONMENT_OBJECT_KINDS)[number];

export const ENVIRONMENT_OBJECT_FAMILIES = [
  'debris',
  'cargo',
  'shield',
  'rock',
  'pylon',
  'wreck',
  'cache',
  'volatile'
] as const;
export type EnvironmentObjectFamily = (typeof ENVIRONMENT_OBJECT_FAMILIES)[number];

export const ENVIRONMENT_OBJECT_COLLISION_SHAPES = ['circle', 'rect', 'gate'] as const;
export type EnvironmentObjectCollisionShape = (typeof ENVIRONMENT_OBJECT_COLLISION_SHAPES)[number];

export const ENVIRONMENT_OBJECT_DAMAGE_SOURCES = [
  'weapon',
  'special',
  'bomb',
  'hazard',
  'chainReaction'
] as const;
export type EnvironmentObjectDamageSource = (typeof ENVIRONMENT_OBJECT_DAMAGE_SOURCES)[number];

export const ENVIRONMENT_OBJECT_OBJECTIVE_POLICIES = [
  'ignore',
  'optionalBonus',
  'blocksRoute'
] as const;
export type EnvironmentObjectObjectivePolicy =
  (typeof ENVIRONMENT_OBJECT_OBJECTIVE_POLICIES)[number];

export const ENVIRONMENT_OBJECT_REWARD_POLICIES = [
  'none',
  'credits',
  'salvage',
  'mixed',
  'cache'
] as const;
export type EnvironmentObjectRewardPolicy = (typeof ENVIRONMENT_OBJECT_REWARD_POLICIES)[number];

export const ENVIRONMENT_OBJECT_CHAIN_BEHAVIORS = [
  'none',
  'shatter',
  'blast',
  'arcDisable'
] as const;
export type EnvironmentObjectChainBehavior = (typeof ENVIRONMENT_OBJECT_CHAIN_BEHAVIORS)[number];

export const ENVIRONMENT_OBJECT_RENDER_CUES = [
  'scrapShard',
  'cargoPod',
  'shieldGate',
  'rockField',
  'surfacePylon',
  'wreckPlate',
  'salvageCache',
  'volatileCanister'
] as const;
export type EnvironmentObjectRenderCue = (typeof ENVIRONMENT_OBJECT_RENDER_CUES)[number];

export const ENVIRONMENT_OBJECT_RENDER_LAYERS = ['underActors', 'midfield'] as const;
export type EnvironmentObjectRenderLayer = (typeof ENVIRONMENT_OBJECT_RENDER_LAYERS)[number];

export const ENVIRONMENT_OBJECT_ACCESSIBILITY_VARIANTS = [
  'standard',
  'simplified',
  'outlineOnly'
] as const;
export type EnvironmentObjectAccessibilityVariant =
  (typeof ENVIRONMENT_OBJECT_ACCESSIBILITY_VARIANTS)[number];

export interface EnvironmentObjectCollisionMetadata {
  readonly shape: EnvironmentObjectCollisionShape;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly blocksMovement: boolean;
}

export interface EnvironmentObjectDurabilityMetadata {
  readonly hull: number;
  readonly armor: number;
}

export interface EnvironmentObjectDamageInteractionMetadata {
  readonly destructible: boolean;
  readonly allowedSources: readonly EnvironmentObjectDamageSource[];
  readonly contactDamage: number;
}

export interface EnvironmentObjectRewardMetadata {
  readonly policy: EnvironmentObjectRewardPolicy;
  readonly minValue: number;
  readonly maxValue: number;
  readonly dropChance: number;
}

export interface EnvironmentObjectChainMetadata {
  readonly behavior: EnvironmentObjectChainBehavior;
  readonly radius: number;
  readonly damage: number;
  readonly maxTargets: number;
}

export interface EnvironmentObjectPlacementBand {
  readonly minXRatio: number;
  readonly maxXRatio: number;
}

export interface EnvironmentObjectPlacementConstraints {
  readonly weight: number;
  readonly maxPerSector: number;
  readonly minDistanceRatio: number;
  readonly maxDistanceRatio: number;
  readonly minSpacing: number;
  readonly safeLaneWidth: number;
  readonly avoidPlayerSpawnDistance: number;
  readonly avoidBossLockDistance: number;
  readonly xBands: readonly EnvironmentObjectPlacementBand[];
}

export interface EnvironmentObjectRenderingMetadata {
  readonly cue: EnvironmentObjectRenderCue;
  readonly layer: EnvironmentObjectRenderLayer;
  readonly normalColor: string;
  readonly highContrastColor: string;
  readonly fillAlpha: number;
  readonly strokeAlpha: number;
}

export interface EnvironmentObjectCueMetadata {
  readonly spawn: string;
  readonly hit: string;
  readonly destroy: string;
}

export interface EnvironmentObjectAccessibilityMetadata {
  readonly reducedMotionVariant: EnvironmentObjectAccessibilityVariant;
  readonly highContrastVariant: EnvironmentObjectAccessibilityVariant;
  readonly label: string;
}

export interface EnvironmentObjectDefinition {
  readonly id: EnvironmentObjectId;
  readonly kind: EnvironmentObjectKind;
  readonly family: EnvironmentObjectFamily;
  readonly name: string;
  readonly debugLabel: string;
  readonly summary: string;
  readonly sectorFit: readonly SectorId[];
  readonly factionFit: 'any' | readonly FactionId[];
  readonly collision: EnvironmentObjectCollisionMetadata;
  readonly durability: EnvironmentObjectDurabilityMetadata;
  readonly damageInteraction: EnvironmentObjectDamageInteractionMetadata;
  readonly objectivePolicy: EnvironmentObjectObjectivePolicy;
  readonly reward: EnvironmentObjectRewardMetadata;
  readonly chain: EnvironmentObjectChainMetadata;
  readonly placement: EnvironmentObjectPlacementConstraints;
  readonly rendering: EnvironmentObjectRenderingMetadata;
  readonly audioCues: EnvironmentObjectCueMetadata;
  readonly vfxCues: EnvironmentObjectCueMetadata;
  readonly accessibility: EnvironmentObjectAccessibilityMetadata;
}

const ALL_SECTOR_IDS: readonly SectorId[] = [
  'sector_outer_debris_field',
  'sector_trade_war_corridor',
  'sector_bio_machine_bloom',
  'sector_corporate_kill_grid',
  'sector_lunar_surface',
  'sector_core_wreck'
];

const SIDE_BANDS: readonly EnvironmentObjectPlacementBand[] = [
  { minXRatio: 0.14, maxXRatio: 0.28 },
  { minXRatio: 0.72, maxXRatio: 0.86 }
];

const WIDE_SIDE_BANDS: readonly EnvironmentObjectPlacementBand[] = [
  { minXRatio: 0.12, maxXRatio: 0.24 },
  { minXRatio: 0.76, maxXRatio: 0.88 }
];

export const ENVIRONMENT_OBJECT_DEFINITIONS: readonly EnvironmentObjectDefinition[] = [
  {
    id: 'debris_shard_cluster',
    kind: 'destructible',
    family: 'debris',
    name: 'Debris Shard Cluster',
    debugLabel: 'debris',
    summary: 'loose hull shards that can be cleared for a little breathing room',
    sectorFit: ['sector_outer_debris_field', 'sector_trade_war_corridor', 'sector_core_wreck'],
    factionFit: 'any',
    collision: createCollision('circle', 48, 48, 24, true),
    durability: { hull: 3, armor: 0 },
    damageInteraction: createDamageInteraction(
      true,
      ['weapon', 'special', 'bomb', 'hazard', 'chainReaction'],
      0
    ),
    objectivePolicy: 'ignore',
    reward: createReward('salvage', 1, 2, 0.55),
    chain: createChain('shatter', 54, 1, 2),
    placement: createPlacement(8, 3, 0.18, 0.82, 180, 250, SIDE_BANDS),
    rendering: createRendering('scrapShard', 'underActors', '#8aa4b8', '#f8fbff', 0.34, 0.82),
    audioCues: createCues('debris-spawn', 'debris-hit', 'debris-break'),
    vfxCues: createCues('debris-glint', 'debris-spark', 'debris-shatter'),
    accessibility: createAccessibility('simplified', 'outlineOnly', 'Debris cluster')
  },
  {
    id: 'cargo_pod',
    kind: 'destructible',
    family: 'cargo',
    name: 'Cargo Pod',
    debugLabel: 'cargo',
    summary: 'armored courier freight with a small credit payout',
    sectorFit: ['sector_trade_war_corridor', 'sector_corporate_kill_grid'],
    factionFit: 'any',
    collision: createCollision('rect', 72, 44, 0, true),
    durability: { hull: 5, armor: 1 },
    damageInteraction: createDamageInteraction(
      true,
      ['weapon', 'special', 'bomb', 'chainReaction'],
      0
    ),
    objectivePolicy: 'optionalBonus',
    reward: createReward('credits', 3, 7, 0.75),
    chain: createChain('none', 0, 0, 0),
    placement: createPlacement(5, 2, 0.22, 0.78, 220, 260, SIDE_BANDS),
    rendering: createRendering('cargoPod', 'underActors', '#ffd166', '#ffef5f', 0.28, 0.86),
    audioCues: createCues('cargo-spawn', 'cargo-hit', 'cargo-open'),
    vfxCues: createCues('cargo-signal', 'cargo-spark', 'cargo-pop'),
    accessibility: createAccessibility('simplified', 'outlineOnly', 'Cargo pod')
  },
  {
    id: 'shield_gate',
    kind: 'obstacle',
    family: 'shield',
    name: 'Shield Gate',
    debugLabel: 'gate',
    summary: 'a projected barrier segment that creates a short navigation squeeze',
    sectorFit: ['sector_trade_war_corridor', 'sector_corporate_kill_grid'],
    factionFit: 'any',
    collision: createCollision('gate', 118, 58, 0, true),
    durability: { hull: 8, armor: 2 },
    damageInteraction: createDamageInteraction(
      true,
      ['special', 'bomb', 'hazard', 'chainReaction'],
      1
    ),
    objectivePolicy: 'blocksRoute',
    reward: createReward('none', 0, 0, 0),
    chain: createChain('arcDisable', 86, 1, 2),
    placement: createPlacement(3, 1, 0.34, 0.74, 260, 250, WIDE_SIDE_BANDS),
    rendering: createRendering('shieldGate', 'midfield', '#7cf7ff', '#f8fbff', 0.22, 0.9),
    audioCues: createCues('gate-hum', 'gate-hit', 'gate-drop'),
    vfxCues: createCues('gate-line', 'gate-splash', 'gate-collapse'),
    accessibility: createAccessibility('simplified', 'outlineOnly', 'Shield gate')
  },
  {
    id: 'lunar_rock_field',
    kind: 'obstacle',
    family: 'rock',
    name: 'Lunar Rock Field',
    debugLabel: 'rocks',
    summary: 'low-altitude regolith fragments that shape lunar movement lanes',
    sectorFit: ['sector_lunar_surface'],
    factionFit: 'any',
    collision: createCollision('rect', 96, 52, 0, true),
    durability: { hull: 9, armor: 1 },
    damageInteraction: createDamageInteraction(
      true,
      ['weapon', 'bomb', 'hazard', 'chainReaction'],
      1
    ),
    objectivePolicy: 'ignore',
    reward: createReward('salvage', 1, 3, 0.45),
    chain: createChain('shatter', 68, 1, 2),
    placement: createPlacement(7, 3, 0.18, 0.84, 190, 260, WIDE_SIDE_BANDS),
    rendering: createRendering('rockField', 'underActors', '#c8d4e3', '#f8fbff', 0.32, 0.82),
    audioCues: createCues('rock-skid', 'rock-hit', 'rock-break'),
    vfxCues: createCues('dust-puff', 'rock-chip', 'dust-burst'),
    accessibility: createAccessibility('simplified', 'outlineOnly', 'Lunar rocks')
  },
  {
    id: 'surface_pylon',
    kind: 'obstacle',
    family: 'pylon',
    name: 'Surface Pylon',
    debugLabel: 'pylon',
    summary: 'a relay mast that blocks a compact lane and anchors surface silhouettes',
    sectorFit: ['sector_lunar_surface', 'sector_corporate_kill_grid'],
    factionFit: 'any',
    collision: createCollision('rect', 52, 112, 0, true),
    durability: { hull: 7, armor: 2 },
    damageInteraction: createDamageInteraction(
      true,
      ['weapon', 'special', 'bomb', 'chainReaction'],
      1
    ),
    objectivePolicy: 'ignore',
    reward: createReward('none', 0, 0, 0),
    chain: createChain('arcDisable', 72, 1, 2),
    placement: createPlacement(4, 2, 0.2, 0.76, 240, 260, SIDE_BANDS),
    rendering: createRendering('surfacePylon', 'underActors', '#ffd166', '#ffef5f', 0.26, 0.86),
    audioCues: createCues('pylon-whine', 'pylon-hit', 'pylon-fall'),
    vfxCues: createCues('pylon-blink', 'pylon-spark', 'pylon-flare'),
    accessibility: createAccessibility('simplified', 'outlineOnly', 'Surface pylon')
  },
  {
    id: 'wreck_plate',
    kind: 'obstacle',
    family: 'wreck',
    name: 'Wreck Plate',
    debugLabel: 'plate',
    summary: 'a broad hull plate that reads as terrain without sealing the arena',
    sectorFit: ['sector_outer_debris_field', 'sector_core_wreck', 'sector_bio_machine_bloom'],
    factionFit: 'any',
    collision: createCollision('rect', 136, 42, 0, true),
    durability: { hull: 10, armor: 2 },
    damageInteraction: createDamageInteraction(true, ['bomb', 'hazard', 'chainReaction'], 1),
    objectivePolicy: 'ignore',
    reward: createReward('salvage', 2, 4, 0.5),
    chain: createChain('shatter', 84, 1, 3),
    placement: createPlacement(4, 2, 0.24, 0.78, 250, 250, WIDE_SIDE_BANDS),
    rendering: createRendering('wreckPlate', 'underActors', '#8aa4b8', '#f8fbff', 0.3, 0.78),
    audioCues: createCues('plate-drift', 'plate-hit', 'plate-crack'),
    vfxCues: createCues('plate-shadow', 'plate-chip', 'plate-split'),
    accessibility: createAccessibility('simplified', 'outlineOnly', 'Wreck plate')
  },
  {
    id: 'salvage_cache',
    kind: 'destructible',
    family: 'cache',
    name: 'Salvage Cache',
    debugLabel: 'cache',
    summary: 'a fragile stash that rewards deliberate risk near the edge lanes',
    sectorFit: ALL_SECTOR_IDS,
    factionFit: 'any',
    collision: createCollision('circle', 56, 56, 28, true),
    durability: { hull: 4, armor: 0 },
    damageInteraction: createDamageInteraction(
      true,
      ['weapon', 'special', 'bomb', 'chainReaction'],
      0
    ),
    objectivePolicy: 'optionalBonus',
    reward: createReward('cache', 2, 6, 1),
    chain: createChain('none', 0, 0, 0),
    placement: createPlacement(2, 1, 0.32, 0.72, 280, 270, SIDE_BANDS),
    rendering: createRendering('salvageCache', 'underActors', '#7cf7ff', '#f8fbff', 0.32, 0.9),
    audioCues: createCues('cache-ping', 'cache-hit', 'cache-open'),
    vfxCues: createCues('cache-glow', 'cache-spark', 'cache-burst'),
    accessibility: createAccessibility('simplified', 'outlineOnly', 'Salvage cache')
  },
  {
    id: 'volatile_canister',
    kind: 'destructible',
    family: 'volatile',
    name: 'Volatile Canister',
    debugLabel: 'volatile',
    summary: 'a marked pressure tank that can seed bounded chain reactions later',
    sectorFit: ['sector_trade_war_corridor', 'sector_bio_machine_bloom', 'sector_core_wreck'],
    factionFit: 'any',
    collision: createCollision('circle', 46, 46, 23, true),
    durability: { hull: 3, armor: 0 },
    damageInteraction: createDamageInteraction(
      true,
      ['weapon', 'special', 'bomb', 'hazard', 'chainReaction'],
      1
    ),
    objectivePolicy: 'ignore',
    reward: createReward('none', 0, 0, 0),
    chain: createChain('blast', 112, 2, 4),
    placement: createPlacement(3, 2, 0.28, 0.8, 230, 270, SIDE_BANDS),
    rendering: createRendering('volatileCanister', 'underActors', '#ff6bd6', '#f8fbff', 0.3, 0.9),
    audioCues: createCues('canister-warning', 'canister-hit', 'canister-pop'),
    vfxCues: createCues('canister-pulse', 'canister-spark', 'canister-burst'),
    accessibility: createAccessibility('simplified', 'outlineOnly', 'Volatile canister')
  }
];

const ENVIRONMENT_OBJECTS_BY_ID = new Map<EnvironmentObjectId, EnvironmentObjectDefinition>(
  ENVIRONMENT_OBJECT_DEFINITIONS.map((object) => [object.id, object])
);

export function getEnvironmentObjectById(id: EnvironmentObjectId): EnvironmentObjectDefinition {
  const object = ENVIRONMENT_OBJECTS_BY_ID.get(id);

  if (!object) {
    throw new Error(`Unknown environment object id: ${id}`);
  }

  return object;
}

export function getEnvironmentObjectsForSector(
  sectorId: SectorId,
  definitions: readonly EnvironmentObjectDefinition[] = ENVIRONMENT_OBJECT_DEFINITIONS
): readonly EnvironmentObjectDefinition[] {
  return definitions.filter((object) => object.sectorFit.includes(sectorId));
}

function createCollision(
  shape: EnvironmentObjectCollisionShape,
  width: number,
  height: number,
  radius: number,
  blocksMovement: boolean
): EnvironmentObjectCollisionMetadata {
  return { shape, width, height, radius, blocksMovement };
}

function createDamageInteraction(
  destructible: boolean,
  allowedSources: readonly EnvironmentObjectDamageSource[],
  contactDamage: number
): EnvironmentObjectDamageInteractionMetadata {
  return { destructible, allowedSources, contactDamage };
}

function createReward(
  policy: EnvironmentObjectRewardPolicy,
  minValue: number,
  maxValue: number,
  dropChance: number
): EnvironmentObjectRewardMetadata {
  return { policy, minValue, maxValue, dropChance };
}

function createChain(
  behavior: EnvironmentObjectChainBehavior,
  radius: number,
  damage: number,
  maxTargets: number
): EnvironmentObjectChainMetadata {
  return { behavior, radius, damage, maxTargets };
}

function createPlacement(
  weight: number,
  maxPerSector: number,
  minDistanceRatio: number,
  maxDistanceRatio: number,
  minSpacing: number,
  safeLaneWidth: number,
  xBands: readonly EnvironmentObjectPlacementBand[]
): EnvironmentObjectPlacementConstraints {
  return {
    weight,
    maxPerSector,
    minDistanceRatio,
    maxDistanceRatio,
    minSpacing,
    safeLaneWidth,
    avoidPlayerSpawnDistance: 180,
    avoidBossLockDistance: 220,
    xBands
  };
}

function createRendering(
  cue: EnvironmentObjectRenderCue,
  layer: EnvironmentObjectRenderLayer,
  normalColor: string,
  highContrastColor: string,
  fillAlpha: number,
  strokeAlpha: number
): EnvironmentObjectRenderingMetadata {
  return {
    cue,
    layer,
    normalColor,
    highContrastColor,
    fillAlpha,
    strokeAlpha
  };
}

function createCues(spawn: string, hit: string, destroy: string): EnvironmentObjectCueMetadata {
  return { spawn, hit, destroy };
}

function createAccessibility(
  reducedMotionVariant: EnvironmentObjectAccessibilityVariant,
  highContrastVariant: EnvironmentObjectAccessibilityVariant,
  label: string
): EnvironmentObjectAccessibilityMetadata {
  return { reducedMotionVariant, highContrastVariant, label };
}
