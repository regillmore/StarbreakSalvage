import {
  getBossById,
  type BossDefinition,
  type BossId,
  type BossPatternId
} from '../content/bosses';
import {
  getEnvironmentObjectById,
  type EnvironmentObjectCollisionShape,
  type EnvironmentObjectDamageSource,
  type EnvironmentObjectDefinition,
  type EnvironmentObjectId,
  type EnvironmentObjectKind
} from '../content/environmentObjects';
import { FACTIONS, getFactionById, type FactionId } from '../content/factions';
import { getEnemyFormationById, type EnemyFormationId } from '../content/enemyFormations';
import { getEnemyVariantById, type EnemyVariantId } from '../content/enemyVariants';
import type { ItemTag } from '../content/items';
import type { ShipStats, WeaponId } from '../content/ships';
import { getWeaponById, type WeaponDefinition } from '../content/weapons';
import { clamp, type Vector2 } from '../core/math';
import { createRng } from '../core/rng';
import { circlesOverlap } from '../systems/CollisionSystem';
import { applyDamage } from '../systems/DamageSystem';
import {
  createEnemyAttackProjectiles,
  createEnemyAttackTelegraphs,
  getEnemyAttackProfile
} from '../systems/EnemyAttack';
import { updateEnemyMovement } from '../systems/EnemyMovement';
import type { EnemyAttackFamily } from '../content/enemyRoles';
import {
  applyItemHooks,
  applyItemHooksWithReport,
  hasItem,
  type EnemyKilledPayload,
  type ProjectileBlueprint
} from './ItemHooks';
import type { EnvironmentObjectPlacementPlan } from './EnvironmentObjectPlacement';
import { getItemNames, type ItemInstance } from './Rewards';

export type ProjectileOwner = 'player' | 'enemy';
export type PickupKind = 'credit' | 'salvage';
export type CombatEndReason = 'destroyed' | 'abandoned' | 'debug' | 'sectorComplete' | 'victory';
export type TelegraphKind = 'fan' | 'lane' | 'ring';

export interface CombatBounds {
  readonly width: number;
  readonly height: number;
  readonly padding: number;
  readonly safeFrame?: CombatSafeFrame;
}

export interface CombatSafeFrame {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface CombatInput {
  readonly movement: Vector2;
  readonly fire: boolean;
  readonly special?: boolean;
  readonly bomb?: boolean;
  readonly scrollDistance?: number;
}

export interface PlayerState {
  x: number;
  y: number;
  readonly radius: number;
  readonly speed: number;
  readonly pickupPullRange: number;
  hull: number;
  readonly maxHull: number;
  fireCooldown: number;
  weaponHeat: number;
  weaponOverheatSeconds: number;
  invulnerableSeconds: number;
  fireRateMultiplier: number;
  fireRateBoostSeconds: number;
  specialCharge: number;
  readonly maxSpecialCharge: number;
  readonly specialChargeMultiplier: number;
  specialFireRateMultiplier: number;
  specialCooldown: number;
  specialActiveSeconds: number;
  bombs: number;
  readonly maxBombs: number;
  bombCooldown: number;
  credits: number;
  salvage: number;
}

export interface ProjectileState {
  readonly id: number;
  readonly owner: ProjectileOwner;
  x: number;
  y: number;
  readonly vx: number;
  readonly vy: number;
  readonly radius: number;
  readonly damage: number;
  ttl: number;
  readonly tags: readonly ItemTag[];
  readonly procDepth: number;
  readonly environmentDamageSource?: EnvironmentObjectDamageSource;
  readonly factionId?: FactionId;
}

export interface EnemyState {
  readonly id: number;
  readonly factionId: FactionId;
  readonly variantId?: EnemyVariantId | null;
  readonly formationId?: EnemyFormationId | null;
  readonly formationInstanceId?: string | null;
  readonly formationLabel?: string | null;
  readonly formationMemberIndex?: number | null;
  readonly formationMemberCount?: number | null;
  x: number;
  y: number;
  readonly radius: number;
  hull: number;
  readonly maxHull: number;
  readonly drift: number;
  readonly targetY: number;
  readonly homeX?: number;
  fireCooldown: number;
  pendingAttackFamily?: EnemyAttackFamily | null;
  attackWindupSeconds?: number;
  attackSequence?: number;
}

export interface BossState {
  readonly id: number;
  readonly bossId: BossId;
  readonly name: string;
  readonly factionId: FactionId;
  readonly patternId: BossPatternId;
  x: number;
  y: number;
  readonly radius: number;
  hull: number;
  readonly maxHull: number;
  readonly targetY: number;
  readonly telegraphDuration: number;
  readonly attackCadenceSeconds: number;
  readonly warningLabel: string;
  phaseIndex: number;
  phaseLabel: string;
  phaseStartedAtHullRatio: number;
  currentPatternId: BossPatternId;
  currentTelegraphDuration: number;
  currentAttackCadenceSeconds: number;
  currentWarningLabel: string;
  projectileBudgetMultiplier: number;
  attackCooldown: number;
  telegraphSeconds: number;
  pendingAttack: BossPatternId | null;
  attackSequence: number;
}

export interface TelegraphState {
  readonly id: number;
  readonly kind: TelegraphKind;
  readonly factionId: FactionId;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly width: number;
  readonly height: number;
  ttl: number;
  readonly maxTtl: number;
}

export interface PickupState {
  readonly id: number;
  readonly kind: PickupKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  readonly radius: number;
  readonly value: number;
}

export interface EnvironmentObjectState {
  readonly id: number;
  readonly placementId: string;
  readonly definitionId: EnvironmentObjectId;
  readonly kind: EnvironmentObjectKind;
  readonly collisionShape: EnvironmentObjectCollisionShape;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly distance: number;
  readonly debugLabel: string;
  hull: number;
  readonly maxHull: number;
  hitFlashSeconds: number;
  hazardCooldownSeconds: number;
  destroyed: boolean;
}

export type CombatEffectKind =
  | 'special'
  | 'bomb'
  | 'graze'
  | 'environmentHit'
  | 'environmentBreak'
  | 'chainReaction';

export interface CombatEffectState {
  readonly id: number;
  readonly kind: CombatEffectKind;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  ttl: number;
  readonly maxTtl: number;
}

export interface CombatStats {
  readonly enemiesDestroyed: number;
  readonly bossesDefeated: number;
  readonly shotsFired: number;
  readonly pickupsCollected: number;
  readonly damageTaken: number;
  readonly itemTriggers: number;
  readonly specialsUsed: number;
  readonly bombsUsed: number;
  readonly grazes: number;
  readonly enemyProjectilesCancelled: number;
  readonly environmentObjectsDestroyed: number;
  readonly environmentRewardsDropped: number;
  readonly environmentChainReactions: number;
}

export interface CombatState {
  readonly seed: string;
  readonly bossId: BossId;
  readonly bossSpawnAtSeconds: number | null;
  readonly enemyHullBonus: number;
  readonly enemyFireDelayMultiplier: number;
  readonly bossHullBonus: number;
  readonly sectorLength: number | null;
  timeSeconds: number;
  scrollDistance: number;
  nextId: number;
  nextSpawnIndex: number;
  bossSpawned: boolean;
  player: PlayerState;
  projectiles: ProjectileState[];
  enemies: EnemyState[];
  boss: BossState | null;
  telegraphs: TelegraphState[];
  pickups: PickupState[];
  environmentObjects: EnvironmentObjectState[];
  effects: CombatEffectState[];
  grazedProjectileIds: Set<number>;
  formationRewardsClaimed: Set<string>;
  spawnSchedule: readonly EnemySpawn[];
  readonly weapon: WeaponDefinition;
  items: readonly ItemInstance[];
  volleyIndex: number;
  stats: CombatStats;
  ended: boolean;
}

export interface EnemySpawn {
  readonly atSeconds: number;
  readonly atDistance?: number | null;
  readonly waveIndex: number;
  readonly waveLabel: string;
  readonly xRatio: number;
  readonly targetY: number;
  readonly hull: number;
  readonly fireDelay: number;
  readonly factionId: FactionId;
  readonly variantId?: EnemyVariantId | null;
  readonly formationId?: EnemyFormationId | null;
  readonly formationInstanceId?: string | null;
  readonly formationLabel?: string | null;
  readonly formationMemberIndex?: number | null;
  readonly formationMemberCount?: number | null;
}

export interface CombatRunResult {
  readonly reason: CombatEndReason;
  readonly survivedSeconds: number;
  readonly distanceTraveled: number;
  readonly sectorLength: number | null;
  readonly credits: number;
  readonly salvage: number;
  readonly enemiesDestroyed: number;
  readonly bossesDefeated: number;
  readonly shotsFired: number;
  readonly pickupsCollected: number;
  readonly damageTaken: number;
  readonly itemTriggers: number;
  readonly itemNames: readonly string[];
}

export interface CombatEntityCounts {
  readonly total: number;
  readonly player: number;
  readonly enemies: number;
  readonly boss: number;
  readonly projectiles: number;
  readonly playerProjectiles: number;
  readonly enemyProjectiles: number;
  readonly pickups: number;
  readonly effects: number;
  readonly pickupsAndEffects: number;
  readonly telegraphs: number;
  readonly environmentObjects: number;
  readonly destructibles: number;
  readonly obstacles: number;
}

const PLAYER_DAMAGE_INVULNERABILITY_SECONDS = 0.55;
const DEFAULT_BOSS_ID: BossId = 'boss_auditor_drone_xl';
const SPECIAL_MAX_CHARGE = 1;
const SPECIAL_ACTIVE_SECONDS = 2.4;
const SPECIAL_COOLDOWN_SECONDS = 1.1;
const SPECIAL_FIRE_RATE_MULTIPLIER = 0.58;
const SPECIAL_CHARGE_PER_KILL = 0.24;
const SPECIAL_CHARGE_PER_BOSS = 0.55;
const SPECIAL_CHARGE_PER_GRAZE = 0.09;
const BOMB_INITIAL_CHARGES = 2;
const BOMB_COOLDOWN_SECONDS = 0.8;
const BOMB_INVULNERABILITY_SECONDS = 0.35;
const BOMB_DAMAGE = 2.25;
const BOMB_BOSS_DAMAGE_RATIO = 0.08;
const GRAZE_MARGIN = 24;
const ENVIRONMENT_OBJECT_LEAD_DISTANCE = 180;
const ENVIRONMENT_OBJECT_TRAIL_DISTANCE = 180;
const ENVIRONMENT_OBJECT_HAZARD_COOLDOWN_SECONDS = 0.35;
const MAX_ENVIRONMENT_REWARD_PICKUPS = 3;
const MAX_ENVIRONMENT_CHAIN_REACTIONS_PER_EVENT = 6;
const MAX_ENVIRONMENT_FEEDBACK_EFFECTS = 80;
const DEFAULT_SHIP_STATS: ShipStats = {
  maxHull: 3,
  speed: 360,
  hitRadius: 18,
  pickupPullRange: 240,
  specialChargeMultiplier: 1,
  specialInitialCharge: 1,
  bombCapacity: BOMB_INITIAL_CHARGES,
  startingCredits: 16,
  startingSalvage: 0
};

export interface CombatStateOptions {
  readonly weaponId?: WeaponId;
  readonly shipStats?: ShipStats;
  readonly items?: readonly ItemInstance[];
  readonly bossId?: BossId;
  readonly bossSpawnAtSeconds?: number | null;
  readonly spawnSchedule?: readonly EnemySpawn[];
  readonly skipEnemyWaves?: boolean;
  readonly enemyHullBonus?: number;
  readonly enemyFireDelayMultiplier?: number;
  readonly bossHullBonus?: number;
  readonly sectorLength?: number | null;
  readonly sectorIndex?: number;
  readonly sectorId?: string;
  readonly environmentObjectPlan?: EnvironmentObjectPlacementPlan | null;
}

export function createCombatState(
  bounds: CombatBounds,
  seed: string,
  options: CombatStateOptions = {}
): CombatState {
  const weapon = getWeaponById(options.weaponId ?? 'weapon_light_needle_laser');
  const bossDefinition = getBossById(options.bossId ?? DEFAULT_BOSS_ID);
  const shipStats = options.shipStats ?? DEFAULT_SHIP_STATS;
  const maxBombs = Math.max(0, Math.floor(shipStats.bombCapacity));
  const state: CombatState = {
    seed,
    bossId: bossDefinition.id,
    bossSpawnAtSeconds: options.bossSpawnAtSeconds ?? null,
    enemyHullBonus: Math.max(0, Math.floor(options.enemyHullBonus ?? 0)),
    enemyFireDelayMultiplier: clamp(options.enemyFireDelayMultiplier ?? 1, 0.5, 1.5),
    bossHullBonus: Math.max(0, Math.floor(options.bossHullBonus ?? 0)),
    sectorLength: sanitizeSectorLength(options.sectorLength),
    timeSeconds: 0,
    scrollDistance: 0,
    nextId: 1,
    nextSpawnIndex: 0,
    bossSpawned: false,
    player: {
      x: bounds.width / 2,
      y: bounds.height * 0.78,
      radius: shipStats.hitRadius,
      speed: shipStats.speed,
      pickupPullRange: shipStats.pickupPullRange,
      hull: shipStats.maxHull,
      maxHull: shipStats.maxHull,
      fireCooldown: 0,
      weaponHeat: 0,
      weaponOverheatSeconds: 0,
      invulnerableSeconds: 0,
      fireRateMultiplier: 1,
      fireRateBoostSeconds: 0,
      specialCharge: clamp(shipStats.specialInitialCharge, 0, SPECIAL_MAX_CHARGE),
      maxSpecialCharge: SPECIAL_MAX_CHARGE,
      specialChargeMultiplier: shipStats.specialChargeMultiplier,
      specialFireRateMultiplier: SPECIAL_FIRE_RATE_MULTIPLIER,
      specialCooldown: 0,
      specialActiveSeconds: 0,
      bombs: maxBombs,
      maxBombs,
      bombCooldown: 0,
      credits: 0,
      salvage: 0
    },
    projectiles: [],
    enemies: [],
    boss: null,
    telegraphs: [],
    pickups: [],
    environmentObjects: [],
    effects: [],
    grazedProjectileIds: new Set<number>(),
    formationRewardsClaimed: new Set<string>(),
    spawnSchedule:
      options.spawnSchedule ??
      (options.skipEnemyWaves ? [] : createEnemySpawnSchedule(seed, bossDefinition.factionId)),
    weapon,
    items: options.items ?? [],
    volleyIndex: 0,
    stats: {
      enemiesDestroyed: 0,
      bossesDefeated: 0,
      shotsFired: 0,
      pickupsCollected: 0,
      damageTaken: 0,
      itemTriggers: 0,
      specialsUsed: 0,
      bombsUsed: 0,
      grazes: 0,
      enemyProjectilesCancelled: 0,
      environmentObjectsDestroyed: 0,
      environmentRewardsDropped: 0,
      environmentChainReactions: 0
    },
    ended: false
  };

  state.environmentObjects = createEnvironmentObjectStates(state, options.environmentObjectPlan);

  applySectorStartHooks(state, {
    sectorIndex: options.sectorIndex ?? 0,
    sectorId: options.sectorId ?? 'unknown-sector'
  });

  if (options.bossSpawnAtSeconds === 0) {
    spawnBoss(state, bossDefinition.id, bounds);
  }

  return state;
}

export function updateCombatState(
  state: CombatState,
  input: CombatInput,
  dt: number,
  bounds: CombatBounds
): CombatRunResult | null {
  if (state.ended) {
    return createCombatRunResult(state, 'destroyed');
  }

  const safeDt = clamp(dt, 0, 0.1);
  state.timeSeconds += safeDt;
  state.scrollDistance = Math.max(
    state.scrollDistance,
    input.scrollDistance ?? state.scrollDistance
  );
  updatePlayer(state, input, safeDt, bounds);
  spawnDueEnemies(state, bounds);
  spawnDueBoss(state, bounds);
  updateEnemies(state, safeDt, bounds);
  updateBoss(state, safeDt, bounds);
  updateProjectiles(state, safeDt, bounds);
  updateTelegraphs(state, safeDt);
  updateCombatEffects(state, safeDt);
  updateEnvironmentObjects(state, safeDt);
  updatePickups(state, safeDt, bounds);
  resolveGraze(state);
  resolveCombatCollisions(state);
  cleanupEntities(state, bounds);

  if (state.player.hull <= 0) {
    state.ended = true;
    return createCombatRunResult(state, 'destroyed');
  }

  return null;
}

export function forceCombatEnd(
  state: CombatState,
  reason: CombatEndReason = 'debug'
): CombatRunResult {
  state.ended = true;
  state.player.hull = reason === 'destroyed' ? 0 : state.player.hull;
  return createCombatRunResult(state, reason);
}

export function getActiveEnvironmentObjects(state: CombatState): EnvironmentObjectState[] {
  return state.environmentObjects.filter((object) => isEnvironmentObjectActive(state, object));
}

export function damageEnvironmentObjectsInRadius(
  state: CombatState,
  x: number,
  y: number,
  radius: number,
  source: EnvironmentObjectDamageSource,
  damage: number
): number {
  let damaged = 0;

  for (const object of getActiveEnvironmentObjects(state)) {
    if (!environmentObjectOverlapsCircle(object, x, y, radius)) {
      continue;
    }

    damaged += Number(
      damageEnvironmentObject(state, object, source, damage, {
        visitedObjectIds: new Set<number>(),
        chainBudget: createEnvironmentChainBudget()
      })
    );
  }

  return damaged;
}

export function damageEnvironmentObjectsInRect(
  state: CombatState,
  rect: { readonly left: number; readonly top: number; readonly right: number; readonly bottom: number },
  source: EnvironmentObjectDamageSource,
  damage: number
): number {
  let damaged = 0;

  for (const object of getActiveEnvironmentObjects(state)) {
    if (!environmentObjectOverlapsRect(object, rect)) {
      continue;
    }

    damaged += Number(
      damageEnvironmentObject(state, object, source, damage, {
        visitedObjectIds: new Set<number>(),
        chainBudget: createEnvironmentChainBudget()
      })
    );
  }

  return damaged;
}

export function spawnBoss(
  state: CombatState,
  bossId: BossId,
  bounds: CombatBounds,
  options: { readonly clearField?: boolean } = {}
): BossState {
  const bossDefinition = getBossById(bossId);

  if (options.clearField) {
    state.enemies = [];
    state.projectiles = [];
    state.telegraphs = [];
    state.environmentObjects = [];
    state.nextSpawnIndex = state.spawnSchedule.length;
  }

  const maxHull = bossDefinition.maxHull + state.bossHullBonus;
  const initialPhase = getBossPhaseForHull(bossDefinition, maxHull, maxHull).phase;
  const boss: BossState = {
    id: getNextEntityId(state),
    bossId: bossDefinition.id,
    name: bossDefinition.name,
    factionId: bossDefinition.factionId,
    patternId: bossDefinition.patternId,
    x: bounds.width / 2,
    y: -bossDefinition.radius,
    radius: bossDefinition.radius,
    hull: maxHull,
    maxHull,
    targetY: Math.max(92, bounds.height * 0.18),
    telegraphDuration: bossDefinition.telegraphSeconds,
    attackCadenceSeconds: bossDefinition.attackCadenceSeconds,
    warningLabel: bossDefinition.warningLabel,
    phaseIndex: 0,
    phaseLabel: initialPhase.label,
    phaseStartedAtHullRatio: initialPhase.startsAtHullRatio,
    currentPatternId: initialPhase.patternSequence[0] ?? bossDefinition.patternId,
    currentTelegraphDuration: bossDefinition.telegraphSeconds * initialPhase.telegraphMultiplier,
    currentAttackCadenceSeconds:
      bossDefinition.attackCadenceSeconds * initialPhase.attackCadenceMultiplier,
    currentWarningLabel: initialPhase.warningLabel,
    projectileBudgetMultiplier: initialPhase.projectileBudgetMultiplier,
    attackCooldown: 0.45,
    telegraphSeconds: 0,
    pendingAttack: null,
    attackSequence: 0
  };

  state.boss = boss;
  state.bossSpawned = true;
  return boss;
}

export function spawnDebugDenseCombatScenario(state: CombatState, bounds: CombatBounds): void {
  state.enemies = [];
  state.projectiles = [];
  state.telegraphs = [];
  state.effects = [];
  state.pickups = [];
  state.environmentObjects = [];
  state.boss = null;
  state.bossSpawned = true;
  state.nextSpawnIndex = state.spawnSchedule.length;

  const factionIds: readonly FactionId[] = [
    'faction_corporate_ledger',
    'faction_scrap_court',
    'faction_bloom_hive',
    'faction_void_corsairs'
  ];
  const centerX = bounds.width / 2;
  const topY = Math.max(86, bounds.height * 0.16);

  for (let index = 0; index < 12; index += 1) {
    const row = Math.floor(index / 4);
    const column = index % 4;
    const factionId = factionIds[index % factionIds.length] ?? 'faction_corporate_ledger';
    const x = centerX + (column - 1.5) * 88;
    state.enemies.push({
      id: getNextEntityId(state),
      factionId,
      x,
      y: topY + row * 48,
      radius: 17,
      hull: row === 2 ? 3 : 2,
      maxHull: row === 2 ? 3 : 2,
      drift: (column - 1.5) * 24,
      targetY: topY + row * 48,
      homeX: x,
      fireCooldown: 0.45 + index * 0.03
    });
  }

  for (let index = 0; index < 42; index += 1) {
    const column = index % 7;
    const row = Math.floor(index / 7);
    const factionId = factionIds[index % factionIds.length] ?? 'faction_corporate_ledger';
    state.projectiles.push({
      id: getNextEntityId(state),
      owner: 'enemy',
      x: centerX + (column - 3) * 54,
      y: topY + 120 + row * 28,
      vx: (column - 3) * 12,
      vy: 170 + row * 8,
      radius: 5 + (index % 3),
      damage: 1,
      ttl: 3.4,
      tags: factionId === 'faction_void_corsairs' ? ['phase'] : ['plasma'],
      procDepth: 0,
      factionId
    });
  }

  for (const offset of [-120, 0, 120]) {
    state.telegraphs.push({
      id: getNextEntityId(state),
      kind: 'lane',
      factionId: 'faction_corporate_ledger',
      label: 'DENSE PERF LANE',
      x: centerX + offset,
      y: topY + 80,
      radius: 0,
      width: 34,
      height: bounds.height,
      ttl: 1.2,
      maxTtl: 1.2
    });
  }

  state.effects.push({
    id: getNextEntityId(state),
    kind: 'special',
    x: state.player.x,
    y: state.player.y,
    radius: 82,
    ttl: 0.32,
    maxTtl: 0.32
  });
}

export function prepareDebugEnemyRichScenario(state: CombatState, bounds: CombatBounds): void {
  state.enemies = [];
  state.projectiles = [];
  state.telegraphs = [];
  state.effects = [];
  state.pickups = [];
  state.environmentObjects = [];
  state.boss = null;
  state.bossSpawned = true;
  state.nextSpawnIndex = state.spawnSchedule.length;
  state.formationRewardsClaimed.clear();

  const centerX = bounds.width / 2;
  const topY = Math.max(78, bounds.height * 0.12);
  state.player.x = centerX;
  state.player.y = bounds.height * 0.8;
  state.player.invulnerableSeconds = 0.75;

  const enemyBlueprints: ReadonlyArray<{
    readonly factionId: FactionId;
    readonly variantId: EnemyVariantId;
    readonly formationId: EnemyFormationId;
    readonly formationInstanceId: string;
    readonly formationLabel: string;
    readonly formationMemberIndex: number;
    readonly formationMemberCount: number;
    readonly x: number;
    readonly y: number;
    readonly hull: number;
    readonly fireCooldown: number;
  }> = [
    {
      factionId: 'faction_corporate_ledger',
      variantId: 'variant_armored',
      formationId: 'formation_screen',
      formationInstanceId: 'debug-screen',
      formationLabel: 'screen',
      formationMemberIndex: 0,
      formationMemberCount: 3,
      x: centerX - 160,
      y: topY,
      hull: 3,
      fireCooldown: 0.26
    },
    {
      factionId: 'faction_corporate_ledger',
      variantId: 'variant_shielded',
      formationId: 'formation_screen',
      formationInstanceId: 'debug-screen',
      formationLabel: 'screen',
      formationMemberIndex: 1,
      formationMemberCount: 3,
      x: centerX,
      y: topY + 8,
      hull: 3,
      fireCooldown: 0.3
    },
    {
      factionId: 'faction_bloom_hive',
      variantId: 'variant_volatile',
      formationId: 'formation_screen',
      formationInstanceId: 'debug-screen',
      formationLabel: 'screen',
      formationMemberIndex: 2,
      formationMemberCount: 3,
      x: centerX + 160,
      y: topY,
      hull: 2,
      fireCooldown: 0.34
    },
    {
      factionId: 'faction_void_corsairs',
      variantId: 'variant_evasive',
      formationId: 'formation_pincer',
      formationInstanceId: 'debug-pincer',
      formationLabel: 'pincer',
      formationMemberIndex: 0,
      formationMemberCount: 2,
      x: centerX - 210,
      y: topY + 72,
      hull: 2,
      fireCooldown: 0.28
    },
    {
      factionId: 'faction_scrap_court',
      variantId: 'variant_salvage_rich',
      formationId: 'formation_pincer',
      formationInstanceId: 'debug-pincer',
      formationLabel: 'pincer',
      formationMemberIndex: 1,
      formationMemberCount: 2,
      x: centerX + 210,
      y: topY + 72,
      hull: 3,
      fireCooldown: 0.36
    },
    {
      factionId: 'faction_scrap_court',
      variantId: 'variant_armored',
      formationId: 'formation_escort',
      formationInstanceId: 'debug-escort',
      formationLabel: 'escort',
      formationMemberIndex: 0,
      formationMemberCount: 2,
      x: centerX - 72,
      y: topY + 132,
      hull: 3,
      fireCooldown: 0.4
    },
    {
      factionId: 'faction_corporate_ledger',
      variantId: 'variant_overclocked',
      formationId: 'formation_escort',
      formationInstanceId: 'debug-escort',
      formationLabel: 'escort',
      formationMemberIndex: 1,
      formationMemberCount: 2,
      x: centerX + 72,
      y: topY + 132,
      hull: 2,
      fireCooldown: 0.24
    },
    {
      factionId: 'faction_bloom_hive',
      variantId: 'variant_volatile',
      formationId: 'formation_staggered_lane',
      formationInstanceId: 'debug-stagger',
      formationLabel: 'stagger',
      formationMemberIndex: 0,
      formationMemberCount: 3,
      x: centerX - 132,
      y: topY + 196,
      hull: 2,
      fireCooldown: 0.46
    },
    {
      factionId: 'faction_void_corsairs',
      variantId: 'variant_evasive',
      formationId: 'formation_staggered_lane',
      formationInstanceId: 'debug-stagger',
      formationLabel: 'stagger',
      formationMemberIndex: 1,
      formationMemberCount: 3,
      x: centerX + 12,
      y: topY + 210,
      hull: 2,
      fireCooldown: 0.32
    },
    {
      factionId: 'faction_corporate_ledger',
      variantId: 'variant_shielded',
      formationId: 'formation_staggered_lane',
      formationInstanceId: 'debug-stagger',
      formationLabel: 'stagger',
      formationMemberIndex: 2,
      formationMemberCount: 3,
      x: centerX + 156,
      y: topY + 224,
      hull: 3,
      fireCooldown: 0.38
    }
  ];

  for (const blueprint of enemyBlueprints) {
    const variant = getEnemyVariantById(blueprint.variantId);
    const maxHull = blueprint.hull + variant.hullBonus;

    state.enemies.push({
      id: getNextEntityId(state),
      factionId: blueprint.factionId,
      variantId: blueprint.variantId,
      formationId: blueprint.formationId,
      formationInstanceId: blueprint.formationInstanceId,
      formationLabel: blueprint.formationLabel,
      formationMemberIndex: blueprint.formationMemberIndex,
      formationMemberCount: blueprint.formationMemberCount,
      x: blueprint.x,
      y: blueprint.y,
      radius: 17 * variant.radiusScale,
      hull: maxHull,
      maxHull,
      drift: (blueprint.x - centerX) * 0.08 * variant.driftMultiplier,
      targetY: blueprint.y,
      homeX: blueprint.x,
      fireCooldown: blueprint.fireCooldown * variant.fireDelayMultiplier
    });
  }

  const factionIds: readonly FactionId[] = [
    'faction_corporate_ledger',
    'faction_scrap_court',
    'faction_bloom_hive',
    'faction_void_corsairs'
  ];

  for (let index = 0; index < 36; index += 1) {
    const column = index % 6;
    const row = Math.floor(index / 6);
    const factionId = factionIds[index % factionIds.length] ?? 'faction_corporate_ledger';
    state.projectiles.push({
      id: getNextEntityId(state),
      owner: 'enemy',
      x: centerX + (column - 2.5) * 62,
      y: topY + 280 + row * 26,
      vx: (column - 2.5) * 9,
      vy: 150 + row * 8,
      radius: 5 + (index % 3),
      damage: 1,
      ttl: 3.2,
      tags:
        factionId === 'faction_void_corsairs'
          ? ['phase']
          : index % 4 === 0
            ? ['missile']
            : ['plasma'],
      procDepth: 0,
      factionId
    });
  }

  for (const [index, offset] of [-168, -56, 56, 168].entries()) {
    state.telegraphs.push({
      id: getNextEntityId(state),
      kind: index === 1 ? 'fan' : 'lane',
      factionId: factionIds[index] ?? 'faction_corporate_ledger',
      label: index === 1 ? 'ENEMY RICH FAN' : 'ENEMY RICH LANE',
      x: centerX + offset,
      y: topY + 156,
      radius: index === 1 ? 132 : 0,
      width: index === 1 ? 0 : 32,
      height: bounds.height,
      ttl: 4,
      maxTtl: 4
    });
  }

  state.effects.push({
    id: getNextEntityId(state),
    kind: 'special',
    x: centerX,
    y: topY + 160,
    radius: 96,
    ttl: 0.34,
    maxTtl: 0.34
  });
  state.effects.push({
    id: getNextEntityId(state),
    kind: 'graze',
    x: centerX + 118,
    y: topY + 84,
    radius: 46,
    ttl: 0.28,
    maxTtl: 0.28
  });
}

export function prepareDebugItemStormScenario(
  state: CombatState,
  bounds: CombatBounds,
  items: readonly ItemInstance[]
): void {
  state.items = [...items];
  state.enemies = [];
  state.projectiles = [];
  state.telegraphs = [];
  state.effects = [];
  state.pickups = [];
  state.environmentObjects = [];
  state.boss = null;
  state.bossSpawned = true;
  state.nextSpawnIndex = state.spawnSchedule.length;
  state.grazedProjectileIds.clear();

  const centerX = bounds.width / 2;
  const topY = Math.max(78, bounds.height * 0.12);
  state.player.x = centerX;
  state.player.y = bounds.height * 0.78;
  state.player.fireCooldown = 0;
  state.player.weaponHeat = 0;
  state.player.weaponOverheatSeconds = 0;
  state.player.invulnerableSeconds = 0.85;
  state.player.specialCharge = state.player.maxSpecialCharge;
  state.player.specialCooldown = 0;
  state.player.specialActiveSeconds = 0;
  state.player.bombs = state.player.maxBombs;
  state.player.bombCooldown = 0;

  const factionIds: readonly FactionId[] = [
    'faction_corporate_ledger',
    'faction_scrap_court',
    'faction_bloom_hive',
    'faction_void_corsairs'
  ];

  for (let index = 0; index < 10; index += 1) {
    const row = Math.floor(index / 5);
    const column = index % 5;
    const factionId = factionIds[index % factionIds.length] ?? 'faction_corporate_ledger';
    const x = centerX + (column - 2) * 82;
    state.enemies.push({
      id: getNextEntityId(state),
      factionId,
      x,
      y: topY + row * 52,
      radius: 16,
      hull: column === 2 ? 3 : 2,
      maxHull: column === 2 ? 3 : 2,
      drift: (column - 2) * 18,
      targetY: topY + row * 52,
      homeX: x,
      fireCooldown: 1.2 + index * 0.04
    });
  }

  for (let index = 0; index < 30; index += 1) {
    const factionId = factionIds[index % factionIds.length] ?? 'faction_corporate_ledger';
    const nearGraze = index < 6;
    const column = index % 6;
    const row = Math.floor(index / 6);
    const side = index % 2 === 0 ? -1 : 1;
    state.projectiles.push({
      id: getNextEntityId(state),
      owner: 'enemy',
      x: nearGraze ? state.player.x + side * (40 + (index % 3) * 3) : centerX + (column - 2.5) * 62,
      y: nearGraze ? state.player.y - 14 + row * 10 : topY + 128 + row * 34,
      vx: nearGraze ? side * 4 : (column - 2.5) * 10,
      vy: nearGraze ? 126 : 164 + row * 9,
      radius: nearGraze ? 5 : 5 + (index % 2),
      damage: 1,
      ttl: nearGraze ? 2.6 : 3.6,
      tags:
        factionId === 'faction_void_corsairs'
          ? ['phase']
          : index % 5 === 0
            ? ['missile']
            : ['plasma'],
      procDepth: 0,
      factionId
    });
  }

  for (const offset of [-104, 104]) {
    state.telegraphs.push({
      id: getNextEntityId(state),
      kind: 'lane',
      factionId: 'faction_corporate_ledger',
      label: 'ITEM HOOK STORM',
      x: centerX + offset,
      y: topY + 64,
      radius: 0,
      width: 38,
      height: bounds.height,
      ttl: 1.4,
      maxTtl: 1.4
    });
  }

  state.pickups.push({
    id: getNextEntityId(state),
    kind: 'credit',
    x: state.player.x - 56,
    y: state.player.y - 80,
    vx: 0,
    vy: 18,
    radius: 7,
    value: 4
  });
  state.pickups.push({
    id: getNextEntityId(state),
    kind: 'salvage',
    x: state.player.x + 56,
    y: state.player.y - 78,
    vx: 0,
    vy: 18,
    radius: 7,
    value: 2
  });
  state.effects.push({
    id: getNextEntityId(state),
    kind: 'special',
    x: state.player.x,
    y: state.player.y,
    radius: 92,
    ttl: 0.36,
    maxTtl: 0.36
  });
}

export function prepareDebugLongScrollScenario(state: CombatState, scrollDistance?: number): void {
  state.enemies = [];
  state.projectiles = [];
  state.telegraphs = [];
  state.effects = [];
  state.pickups = [];
  state.environmentObjects = [];
  state.boss = null;
  state.bossSpawned = false;
  state.nextSpawnIndex = state.spawnSchedule.length;

  if (typeof scrollDistance === 'number' && Number.isFinite(scrollDistance)) {
    state.scrollDistance =
      state.sectorLength === null
        ? Math.max(0, scrollDistance)
        : clamp(scrollDistance, 0, state.sectorLength);
  }
}

export function getCombatEntityCounts(state: CombatState): CombatEntityCounts {
  let playerProjectiles = 0;
  let destructibles = 0;

  for (const projectile of state.projectiles) {
    if (projectile.owner === 'player') {
      playerProjectiles += 1;
    }
  }

  const environmentObjects = getActiveEnvironmentObjects(state);

  for (const object of environmentObjects) {
    if (object.kind === 'destructible') {
      destructibles += 1;
    }
  }

  const obstacles = environmentObjects.length - destructibles;
  const enemyProjectiles = state.projectiles.length - playerProjectiles;
  const pickupsAndEffects = state.pickups.length + state.effects.length;
  const boss = Number(state.boss !== null);

  return {
    total:
      1 +
      boss +
      state.enemies.length +
      state.projectiles.length +
      state.pickups.length +
      state.telegraphs.length +
      state.effects.length +
      environmentObjects.length,
    player: 1,
    enemies: state.enemies.length,
    boss,
    projectiles: state.projectiles.length,
    playerProjectiles,
    enemyProjectiles,
    pickups: state.pickups.length,
    effects: state.effects.length,
    pickupsAndEffects,
    telegraphs: state.telegraphs.length,
    environmentObjects: environmentObjects.length,
    destructibles,
    obstacles
  };
}

export function getCombatEntityCount(state: CombatState): number {
  return getCombatEntityCounts(state).total;
}

export function createCombatRunResult(
  state: CombatState,
  reason: CombatEndReason
): CombatRunResult {
  return {
    reason,
    survivedSeconds: state.timeSeconds,
    distanceTraveled:
      state.sectorLength === null
        ? Math.max(0, state.scrollDistance)
        : clamp(state.scrollDistance, 0, state.sectorLength),
    sectorLength: state.sectorLength,
    credits: state.player.credits,
    salvage: state.player.salvage,
    enemiesDestroyed: state.stats.enemiesDestroyed,
    bossesDefeated: state.stats.bossesDefeated,
    shotsFired: state.stats.shotsFired,
    pickupsCollected: state.stats.pickupsCollected,
    damageTaken: state.stats.damageTaken,
    itemTriggers: state.stats.itemTriggers,
    itemNames: getItemNames(state.items)
  };
}

export function applyPlayerDamage(state: CombatState, damage: number): void {
  damagePlayer(state, damage);
}

export function getCombatSafeFrame(bounds: CombatBounds): CombatSafeFrame {
  return (
    bounds.safeFrame ?? {
      x: bounds.padding,
      y: bounds.padding,
      width: Math.max(1, bounds.width - bounds.padding * 2),
      height: Math.max(1, bounds.height - bounds.padding * 2)
    }
  );
}

interface EnvironmentChainBudget {
  remaining: number;
}

interface EnvironmentDamageOptions {
  readonly visitedObjectIds: Set<number>;
  readonly chainBudget: EnvironmentChainBudget;
}

function createEnvironmentObjectStates(
  state: CombatState,
  plan: EnvironmentObjectPlacementPlan | null | undefined
): EnvironmentObjectState[] {
  if (!plan) {
    return [];
  }

  return plan.objects.map((placement) => {
    const definition = getEnvironmentObjectById(placement.definitionId);

    return {
      id: getNextEntityId(state),
      placementId: placement.id,
      definitionId: placement.definitionId,
      kind: definition.kind,
      collisionShape: placement.collisionShape,
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height,
      radius: placement.radius,
      distance: placement.distance,
      debugLabel: placement.debugLabel,
      hull: definition.durability.hull,
      maxHull: definition.durability.hull,
      hitFlashSeconds: 0,
      hazardCooldownSeconds: 0,
      destroyed: false
    };
  });
}

function updateEnvironmentObjects(state: CombatState, dt: number): void {
  for (const object of state.environmentObjects) {
    object.hitFlashSeconds = Math.max(0, object.hitFlashSeconds - dt);
    object.hazardCooldownSeconds = Math.max(0, object.hazardCooldownSeconds - dt);
  }
}

function isEnvironmentObjectActive(state: CombatState, object: EnvironmentObjectState): boolean {
  return (
    !object.destroyed &&
    object.hull > 0 &&
    state.scrollDistance >= object.distance - ENVIRONMENT_OBJECT_LEAD_DISTANCE &&
    state.scrollDistance <= object.distance + ENVIRONMENT_OBJECT_TRAIL_DISTANCE
  );
}

function isEnvironmentObjectExpired(state: CombatState, object: EnvironmentObjectState): boolean {
  return (
    object.destroyed ||
    object.hull <= 0 ||
    state.scrollDistance > object.distance + ENVIRONMENT_OBJECT_TRAIL_DISTANCE
  );
}

function damageEnvironmentObject(
  state: CombatState,
  object: EnvironmentObjectState,
  source: EnvironmentObjectDamageSource,
  rawDamage: number,
  options: EnvironmentDamageOptions
): boolean {
  if (object.destroyed || object.hull <= 0 || rawDamage <= 0) {
    return false;
  }

  const definition = getEnvironmentObjectById(object.definitionId);

  if (
    !definition.damageInteraction.destructible ||
    !definition.damageInteraction.allowedSources.includes(source)
  ) {
    return false;
  }

  if (source === 'hazard' && object.hazardCooldownSeconds > 0) {
    return false;
  }

  if (source === 'hazard') {
    object.hazardCooldownSeconds = ENVIRONMENT_OBJECT_HAZARD_COOLDOWN_SECONDS;
  }

  const armorReduction = source === 'bomb' || source === 'special' ? 0.2 : 0.35;
  const effectiveDamage = Math.max(0.1, rawDamage - definition.durability.armor * armorReduction);
  object.hull = applyDamage(object.hull, effectiveDamage).hull;
  object.hitFlashSeconds = 0.16;

  if (object.hull > 0) {
    addEnvironmentEffect(state, 'environmentHit', object, getEnvironmentObjectEffectRadius(object));
    return true;
  }

  destroyEnvironmentObject(state, object, definition, source, options);
  return true;
}

function destroyEnvironmentObject(
  state: CombatState,
  object: EnvironmentObjectState,
  definition: EnvironmentObjectDefinition,
  source: EnvironmentObjectDamageSource,
  options: EnvironmentDamageOptions
): void {
  if (object.destroyed) {
    return;
  }

  object.destroyed = true;
  object.hull = 0;
  options.visitedObjectIds.add(object.id);

  const baseReward = rollEnvironmentObjectReward(state, object, definition);
  const hookReport = applyItemHooksWithReport('onEnvironmentObjectDestroyed', state.items, {
    definitionId: definition.id,
    family: definition.family,
    kind: definition.kind,
    source,
    rewardCredits: baseReward.credits,
    rewardSalvage: baseReward.salvage,
    bonusSalvage: 0,
    chainDamage: definition.chain.damage,
    effectRadius: definition.chain.radius
  });
  const reward = {
    credits: hookReport.payload.rewardCredits,
    salvage: hookReport.payload.rewardSalvage + Math.max(0, Math.floor(hookReport.payload.bonusSalvage))
  };
  const droppedPickups = spawnEnvironmentObjectRewardPickups(state, object, reward);

  addEnvironmentEffect(state, 'environmentBreak', object, getEnvironmentObjectEffectRadius(object) * 1.45);
  state.stats = {
    ...state.stats,
    environmentObjectsDestroyed: state.stats.environmentObjectsDestroyed + 1,
    environmentRewardsDropped: state.stats.environmentRewardsDropped + droppedPickups,
    itemTriggers: state.stats.itemTriggers + hookReport.appliedItemIds.length
  };

  triggerEnvironmentChainReaction(state, object, definition, options);
}

function rollEnvironmentObjectReward(
  state: CombatState,
  object: EnvironmentObjectState,
  definition: EnvironmentObjectDefinition
): { readonly credits: number; readonly salvage: number } {
  const reward = definition.reward;

  if (reward.policy === 'none' || reward.maxValue <= 0 || reward.dropChance <= 0) {
    return { credits: 0, salvage: 0 };
  }

  const rng = createRng(`${state.seed}:environment-reward:${object.placementId}`);

  if (rng.nextFloat() > reward.dropChance) {
    return { credits: 0, salvage: 0 };
  }

  const value = rng.int(Math.floor(reward.minValue), Math.floor(reward.maxValue));

  if (reward.policy === 'credits') {
    return { credits: value, salvage: 0 };
  }

  if (reward.policy === 'salvage') {
    return { credits: 0, salvage: value };
  }

  if (reward.policy === 'mixed') {
    return { credits: Math.max(1, value), salvage: Math.max(1, Math.ceil(value / 2)) };
  }

  return { credits: Math.max(1, value), salvage: Math.max(1, Math.floor(value / 2)) };
}

function spawnEnvironmentObjectRewardPickups(
  state: CombatState,
  object: EnvironmentObjectState,
  reward: { readonly credits: number; readonly salvage: number }
): number {
  const pickups: Array<Omit<PickupState, 'id'>> = [];

  if (reward.credits > 0) {
    pickups.push({
      kind: 'credit',
      x: object.x - 9,
      y: object.y,
      vx: -28,
      vy: 38,
      radius: 7,
      value: reward.credits
    });
  }

  if (reward.salvage > 0) {
    pickups.push({
      kind: 'salvage',
      x: object.x + 9,
      y: object.y,
      vx: 28,
      vy: 42,
      radius: 7,
      value: reward.salvage
    });
  }

  for (const pickup of pickups.slice(0, MAX_ENVIRONMENT_REWARD_PICKUPS)) {
    state.pickups.push({
      id: getNextEntityId(state),
      ...pickup
    });
  }

  return Math.min(pickups.length, MAX_ENVIRONMENT_REWARD_PICKUPS);
}

function triggerEnvironmentChainReaction(
  state: CombatState,
  object: EnvironmentObjectState,
  definition: EnvironmentObjectDefinition,
  options: EnvironmentDamageOptions
): void {
  if (definition.chain.behavior === 'none' || definition.chain.radius <= 0) {
    return;
  }

  if (options.chainBudget.remaining <= 0) {
    return;
  }

  options.chainBudget.remaining -= 1;
  addEnvironmentEffect(state, 'chainReaction', object, definition.chain.radius);
  state.stats = {
    ...state.stats,
    environmentChainReactions: state.stats.environmentChainReactions + 1
  };

  const maxTargets = Math.max(0, Math.floor(definition.chain.maxTargets));
  const targets = getActiveEnvironmentObjects(state)
    .filter((candidate) => candidate.id !== object.id && !options.visitedObjectIds.has(candidate.id))
    .filter(
      (candidate) =>
        getDistanceSquared(object, candidate) <= definition.chain.radius * definition.chain.radius
    )
    .sort((left, right) => getDistanceSquared(object, left) - getDistanceSquared(object, right))
    .slice(0, maxTargets);

  for (const target of targets) {
    if (options.chainBudget.remaining <= 0) {
      break;
    }

    damageEnvironmentObject(state, target, 'chainReaction', definition.chain.damage, options);
  }
}

function createEnvironmentChainBudget(): EnvironmentChainBudget {
  return { remaining: MAX_ENVIRONMENT_CHAIN_REACTIONS_PER_EVENT };
}

function addEnvironmentEffect(
  state: CombatState,
  kind: Extract<CombatEffectKind, 'environmentHit' | 'environmentBreak' | 'chainReaction'>,
  object: EnvironmentObjectState,
  radius: number
): void {
  if (state.effects.length >= MAX_ENVIRONMENT_FEEDBACK_EFFECTS) {
    return;
  }

  state.effects.push({
    id: getNextEntityId(state),
    kind,
    x: object.x,
    y: object.y,
    radius: Math.max(6, radius),
    ttl: kind === 'environmentHit' ? 0.14 : kind === 'chainReaction' ? 0.28 : 0.24,
    maxTtl: kind === 'environmentHit' ? 0.14 : kind === 'chainReaction' ? 0.28 : 0.24
  });
}

function getEnvironmentObjectEffectRadius(object: EnvironmentObjectState): number {
  return object.collisionShape === 'circle'
    ? Math.max(8, object.radius)
    : Math.max(12, Math.min(object.width, object.height) * 0.55);
}

function environmentObjectOverlapsCircle(
  object: EnvironmentObjectState,
  x: number,
  y: number,
  radius: number
): boolean {
  if (object.collisionShape === 'circle') {
    return circlesOverlap(object, { x, y, radius });
  }

  const rect = getEnvironmentObjectRect(object);
  const nearestX = clamp(x, rect.left, rect.right);
  const nearestY = clamp(y, rect.top, rect.bottom);
  const dx = x - nearestX;
  const dy = y - nearestY;

  return dx * dx + dy * dy <= radius * radius;
}

function environmentObjectOverlapsRect(
  object: EnvironmentObjectState,
  rect: { readonly left: number; readonly top: number; readonly right: number; readonly bottom: number }
): boolean {
  const objectRect = getEnvironmentObjectRect(object);

  return (
    objectRect.left <= rect.right &&
    objectRect.right >= rect.left &&
    objectRect.top <= rect.bottom &&
    objectRect.bottom >= rect.top
  );
}

function getEnvironmentObjectRect(object: EnvironmentObjectState): {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
} {
  if (object.collisionShape === 'circle') {
    return {
      left: object.x - object.radius,
      top: object.y - object.radius,
      right: object.x + object.radius,
      bottom: object.y + object.radius
    };
  }

  return {
    left: object.x - object.width / 2,
    top: object.y - object.height / 2,
    right: object.x + object.width / 2,
    bottom: object.y + object.height / 2
  };
}

function sanitizeSectorLength(value: number | null | undefined): number | null {
  return Number.isFinite(value) && typeof value === 'number' && value > 0 ? value : null;
}

function updatePlayer(
  state: CombatState,
  input: CombatInput,
  dt: number,
  bounds: CombatBounds
): void {
  const { player } = state;
  const safeFrame = getCombatSafeFrame(bounds);

  player.x = clamp(
    player.x + input.movement.x * player.speed * dt,
    safeFrame.x + player.radius,
    safeFrame.x + safeFrame.width - player.radius
  );
  player.y = clamp(
    player.y + input.movement.y * player.speed * dt,
    safeFrame.y + player.radius,
    safeFrame.y + safeFrame.height - player.radius
  );
  player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  player.weaponOverheatSeconds = Math.max(0, player.weaponOverheatSeconds - dt);
  ventWeaponHeat(state, dt);
  player.invulnerableSeconds = Math.max(0, player.invulnerableSeconds - dt);
  player.fireRateBoostSeconds = Math.max(0, player.fireRateBoostSeconds - dt);
  player.specialCooldown = Math.max(0, player.specialCooldown - dt);
  player.specialActiveSeconds = Math.max(0, player.specialActiveSeconds - dt);
  player.bombCooldown = Math.max(0, player.bombCooldown - dt);

  if (player.fireRateBoostSeconds <= 0) {
    player.fireRateMultiplier = 1;
  }

  if (input.special) {
    activateSpecial(state);
  }

  if (input.bomb) {
    activateBomb(state, bounds);
  }

  if (input.fire && player.fireCooldown <= 0 && player.weaponOverheatSeconds <= 0) {
    state.volleyIndex += 1;

    const firePayload = applyItemHooks('onFire', state.items, {
      volleyIndex: state.volleyIndex,
      projectiles: createWeaponProjectiles(state)
    });

    spawnPlayerProjectiles(state, firePayload.projectiles);
    addWeaponHeat(state);

    const specialMultiplier =
      player.specialActiveSeconds > 0 ? player.specialFireRateMultiplier : 1;
    player.fireCooldown =
      state.weapon.fireCooldownSeconds * player.fireRateMultiplier * specialMultiplier;
    state.stats = {
      ...state.stats,
      shotsFired: state.stats.shotsFired + firePayload.projectiles.length,
      itemTriggers: state.stats.itemTriggers + Math.max(0, firePayload.projectiles.length - 1)
    };
  }
}

function applySectorStartHooks(
  state: CombatState,
  context: { readonly sectorIndex: number; readonly sectorId: string }
): void {
  const payload = applyItemHooks('onSectorStart', state.items, {
    sectorIndex: context.sectorIndex,
    sectorId: context.sectorId,
    creditsBonus: 0,
    salvageBonus: 0,
    specialChargeBonus: 0,
    fireRateMultiplier: state.player.fireRateMultiplier
  });

  if (payload.creditsBonus > 0) {
    state.player.credits += Math.floor(payload.creditsBonus);
  }

  if (payload.salvageBonus > 0) {
    state.player.salvage += Math.floor(payload.salvageBonus);
  }

  if (payload.specialChargeBonus > 0) {
    gainSpecialCharge(state, payload.specialChargeBonus);
  }

  if (payload.fireRateMultiplier < state.player.fireRateMultiplier) {
    state.player.fireRateMultiplier = payload.fireRateMultiplier;
    state.player.fireRateBoostSeconds = Math.max(state.player.fireRateBoostSeconds, 2);
  }
}

function createWeaponProjectiles(state: CombatState): ProjectileBlueprint[] {
  const { player, weapon } = state;
  const baseProjectile: ProjectileBlueprint = {
    x: player.x,
    y: player.y - player.radius,
    vx: 0,
    vy: -weapon.projectileSpeed,
    radius: weapon.projectileRadius,
    damage: weapon.damage,
    ttl: weapon.pattern === 'beam' ? 0.85 : weapon.pattern === 'spread' ? 1.05 : 1.6,
    tags: weapon.tags,
    procDepth: 0,
    environmentDamageSource: 'weapon'
  };

  if (weapon.pattern === 'dual') {
    return [-8, 8].map((offset) => ({
      ...baseProjectile,
      x: baseProjectile.x + offset,
      damage: baseProjectile.damage * 0.72,
      radius: Math.max(3, baseProjectile.radius * 0.82)
    }));
  }

  if (weapon.pattern === 'spread') {
    return [-150, 0, 150].map((vx) => ({
      ...baseProjectile,
      vx,
      vy: baseProjectile.vy * (vx === 0 ? 1 : 0.92),
      damage: baseProjectile.damage * (vx === 0 ? 0.95 : 0.72),
      radius: Math.max(3, baseProjectile.radius * 0.88)
    }));
  }

  if (weapon.pattern === 'split') {
    return [-115, 0, 115].map((vx) => ({
      ...baseProjectile,
      vx,
      damage: baseProjectile.damage * (vx === 0 ? 0.9 : 0.58),
      radius: Math.max(3, baseProjectile.radius * 0.78)
    }));
  }

  if (weapon.pattern === 'missile') {
    return [
      {
        ...baseProjectile,
        radius: baseProjectile.radius * 1.18,
        ttl: 2,
        damage: baseProjectile.damage * 1.05
      }
    ];
  }

  if (weapon.pattern === 'beam') {
    return [
      {
        ...baseProjectile,
        vy: -weapon.projectileSpeed * 1.18,
        radius: baseProjectile.radius * 1.4,
        damage: baseProjectile.damage * 1.1
      }
    ];
  }

  return [baseProjectile];
}

function addWeaponHeat(state: CombatState): void {
  const heatMultiplier = hasItem(state.items, 'item_heat_sink_saint') ? 0.7 : 1;
  state.player.weaponHeat = clamp(
    state.player.weaponHeat + state.weapon.heatPerShot * heatMultiplier,
    0,
    state.weapon.overheatLimit
  );

  if (state.player.weaponHeat >= state.weapon.overheatLimit) {
    state.player.weaponOverheatSeconds = state.weapon.overheatCooldownSeconds;
    state.player.fireCooldown = Math.max(
      state.player.fireCooldown,
      state.weapon.overheatCooldownSeconds
    );
  }
}

function ventWeaponHeat(state: CombatState, dt: number): void {
  const ventMultiplier = hasItem(state.items, 'item_heat_sink_saint') ? 1.35 : 1;
  state.player.weaponHeat = Math.max(
    0,
    state.player.weaponHeat - state.weapon.heatVentPerSecond * ventMultiplier * dt
  );
}

function activateSpecial(state: CombatState): void {
  const { player } = state;

  if (player.specialCharge < player.maxSpecialCharge || player.specialCooldown > 0) {
    return;
  }

  const specialPayload = applyItemHooks('onSpecialUsed', state.items, {
    projectiles: [-130, 0, 130].map((vx) => ({
      x: player.x,
      y: player.y - player.radius,
      vx,
      vy: -820,
      radius: 6,
      damage: 1.25,
      ttl: 1.35,
      tags: ['phase', 'laser'],
      procDepth: 1,
      environmentDamageSource: 'special'
    })),
    activeSeconds: SPECIAL_ACTIVE_SECONDS,
    cooldownSeconds: SPECIAL_COOLDOWN_SECONDS,
    fireRateMultiplier: SPECIAL_FIRE_RATE_MULTIPLIER
  });

  player.specialCharge = 0;
  player.specialCooldown = Math.max(0.1, specialPayload.cooldownSeconds);
  player.specialActiveSeconds = Math.max(0.1, specialPayload.activeSeconds);
  player.specialFireRateMultiplier = clamp(specialPayload.fireRateMultiplier, 0.2, 1);
  state.effects.push({
    id: getNextEntityId(state),
    kind: 'special',
    x: player.x,
    y: player.y,
    radius: 96,
    ttl: 0.42,
    maxTtl: 0.42
  });

  spawnPlayerProjectiles(state, specialPayload.projectiles);

  state.stats = {
    ...state.stats,
    shotsFired: state.stats.shotsFired + specialPayload.projectiles.length,
    specialsUsed: state.stats.specialsUsed + 1,
    itemTriggers: state.stats.itemTriggers + Math.max(0, specialPayload.projectiles.length - 3)
  };
}

function activateBomb(state: CombatState, bounds: CombatBounds): void {
  const { player } = state;

  if (player.bombs <= 0 || player.bombCooldown > 0) {
    return;
  }

  const cancelledProjectiles = state.projectiles.filter(
    (projectile) => projectile.owner === 'enemy'
  ).length;
  const bombPayload = applyItemHooks('onBombUsed', state.items, {
    damage: BOMB_DAMAGE,
    bossDamageRatio: BOMB_BOSS_DAMAGE_RATIO,
    invulnerabilitySeconds: BOMB_INVULNERABILITY_SECONDS,
    cooldownSeconds: BOMB_COOLDOWN_SECONDS,
    effectRadius: Math.max(bounds.width, bounds.height) * 0.55,
    cancelledProjectiles
  });
  const enemyIdsToRemove = new Set<number>();

  player.bombs -= 1;
  player.bombCooldown = Math.max(0.1, bombPayload.cooldownSeconds);
  player.invulnerableSeconds = Math.max(
    player.invulnerableSeconds,
    bombPayload.invulnerabilitySeconds
  );
  state.projectiles = state.projectiles.filter((projectile) => projectile.owner !== 'enemy');
  state.telegraphs = [];
  cancelPendingEnemyAttacks(state, 0.5);
  state.effects.push({
    id: getNextEntityId(state),
    kind: 'bomb',
    x: player.x,
    y: player.y,
    radius: Math.max(1, bombPayload.effectRadius),
    ttl: 0.58,
    maxTtl: 0.58
  });

  for (const enemy of state.enemies) {
    if (enemyIdsToRemove.has(enemy.id)) {
      continue;
    }

    damageEnemyWithProjectile(
      state,
      enemy,
      {
        id: 0,
        owner: 'player',
        x: enemy.x,
        y: enemy.y,
        vx: 0,
        vy: 0,
        radius: enemy.radius,
        damage: Math.max(0, bombPayload.damage),
        ttl: 0,
        tags: ['bomb', 'plasma'],
        procDepth: 1,
        environmentDamageSource: 'bomb'
      },
      enemyIdsToRemove
    );
  }

  const boss = state.boss;

  if (boss && boss.hull > 1) {
    const damage = Math.min(
      boss.hull - 1,
      Math.max(1, boss.maxHull * Math.max(0, bombPayload.bossDamageRatio))
    );
    boss.hull = applyDamage(boss.hull, damage).hull;
    refreshBossPhase(state, boss);
    boss.attackCooldown = Math.max(boss.attackCooldown, 0.75);
    boss.pendingAttack = null;
    boss.telegraphSeconds = 0;
  }

  damageEnvironmentObjectsInRadius(
    state,
    player.x,
    player.y,
    Math.max(1, bombPayload.effectRadius),
    'bomb',
    Math.max(0, bombPayload.damage)
  );

  state.enemies = state.enemies.filter((enemy) => !enemyIdsToRemove.has(enemy.id));
  state.stats = {
    ...state.stats,
    bombsUsed: state.stats.bombsUsed + 1,
    enemyProjectilesCancelled: state.stats.enemyProjectilesCancelled + cancelledProjectiles
  };
}

function cancelPendingEnemyAttacks(state: CombatState, cooldownFloorSeconds: number): void {
  for (const enemy of state.enemies) {
    if (!enemy.pendingAttackFamily) {
      continue;
    }

    enemy.pendingAttackFamily = null;
    enemy.attackWindupSeconds = 0;
    enemy.fireCooldown = Math.max(enemy.fireCooldown, cooldownFloorSeconds);
  }
}

function spawnPlayerProjectiles(
  state: CombatState,
  projectiles: readonly ProjectileBlueprint[]
): void {
  for (const projectile of projectiles) {
    const spawnPayload = applyItemHooks('onProjectileSpawn', state.items, { projectile });
    state.projectiles.push({
      id: getNextEntityId(state),
      owner: 'player',
      ...spawnPayload.projectile
    });
  }
}

function spawnDueEnemies(state: CombatState, bounds: CombatBounds): void {
  while (state.nextSpawnIndex < state.spawnSchedule.length) {
    const spawn = state.spawnSchedule[state.nextSpawnIndex];

    if (!spawn || !isSpawnDue(spawn, state)) {
      return;
    }

    const variant = spawn.variantId ? getEnemyVariantById(spawn.variantId) : null;
    const maxHull = spawn.hull + state.enemyHullBonus + (variant?.hullBonus ?? 0);

    const x = clamp(spawn.xRatio, 0.1, 0.9) * bounds.width;

    state.enemies.push({
      id: getNextEntityId(state),
      factionId: spawn.factionId,
      variantId: spawn.variantId ?? null,
      formationId: spawn.formationId ?? null,
      formationInstanceId: spawn.formationInstanceId ?? null,
      formationLabel: spawn.formationLabel ?? null,
      formationMemberIndex: spawn.formationMemberIndex ?? null,
      formationMemberCount: spawn.formationMemberCount ?? null,
      x,
      y: -24,
      radius: 17 * (variant?.radiusScale ?? 1),
      hull: maxHull,
      maxHull,
      drift: (spawn.xRatio - 0.5) * 32 * (variant?.driftMultiplier ?? 1),
      targetY: spawn.targetY,
      homeX: x,
      fireCooldown: Math.max(
        0.35,
        spawn.fireDelay * state.enemyFireDelayMultiplier * (variant?.fireDelayMultiplier ?? 1)
      )
    });
    state.nextSpawnIndex += 1;
  }
}

function isSpawnDue(spawn: EnemySpawn, state: CombatState): boolean {
  if (spawn.atDistance !== null && spawn.atDistance !== undefined) {
    return spawn.atDistance <= state.scrollDistance;
  }

  return spawn.atSeconds <= state.timeSeconds;
}

function spawnDueBoss(state: CombatState, bounds: CombatBounds): void {
  if (
    state.bossSpawnAtSeconds === null ||
    state.bossSpawned ||
    state.timeSeconds < state.bossSpawnAtSeconds
  ) {
    return;
  }

  spawnBoss(state, state.bossId, bounds);
}

function updateEnemies(state: CombatState, dt: number, bounds: CombatBounds): void {
  for (const enemy of state.enemies) {
    const faction = getFactionById(enemy.factionId);

    updateEnemyMovement(enemy, faction.enemyRole.movementFamily, state.timeSeconds, dt, bounds);
    updateEnemyAttack(state, enemy, faction.enemyRole.attackFamily, dt, bounds);
  }
}

function updateEnemyAttack(
  state: CombatState,
  enemy: EnemyState,
  attackFamily: EnemyAttackFamily,
  dt: number,
  bounds: CombatBounds
): void {
  if (enemy.pendingAttackFamily) {
    enemy.attackWindupSeconds = Math.max(0, (enemy.attackWindupSeconds ?? 0) - dt);

    if (enemy.attackWindupSeconds <= 0) {
      fireEnemyAttack(state, enemy, enemy.pendingAttackFamily);
      enemy.pendingAttackFamily = null;
      enemy.attackWindupSeconds = 0;
      enemy.fireCooldown =
        getEnemyAttackProfile(attackFamily).cooldownSeconds *
        state.enemyFireDelayMultiplier *
        getEnemyVariantFireDelayMultiplier(enemy);
    }

    return;
  }

  enemy.fireCooldown -= dt;

  if (enemy.fireCooldown <= 0 && enemy.y >= enemy.targetY - 1) {
    startEnemyAttackWindup(state, enemy, attackFamily, bounds);
  }
}

function startEnemyAttackWindup(
  state: CombatState,
  enemy: EnemyState,
  attackFamily: EnemyAttackFamily,
  bounds: CombatBounds
): void {
  const profile = getEnemyAttackProfile(attackFamily);
  const telegraphs = createEnemyAttackTelegraphs(enemy, attackFamily, state.player, bounds);

  for (const telegraph of telegraphs) {
    state.telegraphs.push({
      id: getNextEntityId(state),
      ...telegraph
    });
  }

  enemy.pendingAttackFamily = attackFamily;
  enemy.attackWindupSeconds = profile.telegraphSeconds;
  enemy.fireCooldown = 0;
}

function updateBoss(state: CombatState, dt: number, bounds: CombatBounds): void {
  const boss = state.boss;

  if (!boss) {
    return;
  }

  refreshBossPhase(state, boss);

  if (boss.y < boss.targetY) {
    boss.y = Math.min(boss.targetY, boss.y + 88 * dt);
  } else {
    const sway =
      boss.currentPatternId === 'sporeSpiral'
        ? 78
        : boss.currentPatternId === 'missileCurtain'
          ? 42
          : 58;
    const speed = boss.currentPatternId === 'missileCurtain' ? 0.72 : 0.9;
    boss.x = clamp(
      bounds.width / 2 + Math.sin(state.timeSeconds * speed + boss.id) * sway,
      bounds.padding + boss.radius,
      bounds.width - bounds.padding - boss.radius
    );
  }

  const pendingAttack = boss.pendingAttack;

  if (pendingAttack) {
    boss.telegraphSeconds = Math.max(0, boss.telegraphSeconds - dt);

    if (boss.telegraphSeconds <= 0) {
      fireBossAttack(state, boss, pendingAttack);
      boss.pendingAttack = null;
      boss.attackCooldown = boss.currentAttackCadenceSeconds;
    }

    return;
  }

  boss.attackCooldown -= dt;

  if (boss.attackCooldown <= 0) {
    const attackPattern = selectBossAttackPattern(boss);
    boss.currentPatternId = attackPattern;
    createBossTelegraphs(state, boss, bounds, attackPattern);
    boss.pendingAttack = attackPattern;
    boss.telegraphSeconds = boss.currentTelegraphDuration;
  }
}

function refreshBossPhase(state: CombatState, boss: BossState): void {
  const bossDefinition = getBossById(boss.bossId);
  const { phase, phaseIndex } = getBossPhaseForHull(bossDefinition, boss.hull, boss.maxHull);

  if (phaseIndex === boss.phaseIndex) {
    return;
  }

  const previousPhaseIndex = boss.phaseIndex;
  boss.phaseIndex = phaseIndex;
  boss.phaseLabel = phase.label;
  boss.phaseStartedAtHullRatio = phase.startsAtHullRatio;
  boss.currentPatternId = phase.patternSequence[0] ?? bossDefinition.patternId;
  boss.currentTelegraphDuration = boss.telegraphDuration * phase.telegraphMultiplier;
  boss.currentAttackCadenceSeconds = boss.attackCadenceSeconds * phase.attackCadenceMultiplier;
  boss.currentWarningLabel = phase.warningLabel;
  boss.projectileBudgetMultiplier = phase.projectileBudgetMultiplier;
  boss.pendingAttack = null;
  boss.telegraphSeconds = 0;
  boss.attackSequence = 0;
  boss.attackCooldown = Math.max(
    boss.attackCooldown,
    Math.min(0.65, boss.currentAttackCadenceSeconds * 0.5)
  );
  state.telegraphs = [];

  const phasePayload = applyItemHooks('onBossPhaseChanged', state.items, {
    bossId: boss.bossId,
    previousPhaseIndex,
    phaseIndex,
    phaseLabel: phase.label,
    attackCooldownSeconds: boss.attackCooldown,
    telegraphSeconds: boss.currentTelegraphDuration,
    specialChargeGain: 0,
    clearEnemyProjectiles: false
  });

  boss.attackCooldown = Math.max(0.1, phasePayload.attackCooldownSeconds);
  boss.currentTelegraphDuration = Math.max(0.1, phasePayload.telegraphSeconds);

  if (phasePayload.specialChargeGain > 0) {
    gainSpecialCharge(state, phasePayload.specialChargeGain);
  }

  if (phasePayload.clearEnemyProjectiles) {
    state.projectiles = state.projectiles.filter((projectile) => projectile.owner !== 'enemy');
  }
}

function getBossPhaseForHull(
  bossDefinition: BossDefinition,
  hull: number,
  maxHull: number
): { readonly phase: BossDefinition['phases'][number]; readonly phaseIndex: number } {
  const hullRatio = clamp(hull / maxHull, 0, 1);
  let phaseIndex = 0;
  let phase = bossDefinition.phases[0];

  for (let index = 0; index < bossDefinition.phases.length; index += 1) {
    const candidate = bossDefinition.phases[index];

    if (candidate && hullRatio <= candidate.startsAtHullRatio) {
      phaseIndex = index;
      phase = candidate;
    }
  }

  if (!phase) {
    throw new Error(`Boss ${bossDefinition.id} does not define any phases.`);
  }

  return { phase, phaseIndex };
}

function selectBossAttackPattern(boss: BossState): BossPatternId {
  const bossDefinition = getBossById(boss.bossId);
  const phase = bossDefinition.phases[boss.phaseIndex] ?? bossDefinition.phases[0];

  if (!phase || phase.patternSequence.length === 0) {
    return boss.patternId;
  }

  return (
    phase.patternSequence[boss.attackSequence % phase.patternSequence.length] ?? boss.patternId
  );
}

function updateProjectiles(state: CombatState, dt: number, bounds: CombatBounds): void {
  for (const projectile of state.projectiles) {
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.ttl -= dt;

    if (projectile.owner === 'enemy') {
      projectile.x = clamp(projectile.x, bounds.padding, bounds.width - bounds.padding);
    }
  }
}

function updateTelegraphs(state: CombatState, dt: number): void {
  for (const telegraph of state.telegraphs) {
    telegraph.ttl -= dt;
  }
}

function updateCombatEffects(state: CombatState, dt: number): void {
  for (const effect of state.effects) {
    effect.ttl -= dt;
  }
}

function updatePickups(state: CombatState, dt: number, bounds: CombatBounds): void {
  for (const pickup of state.pickups) {
    const dx = state.player.x - pickup.x;
    const dy = state.player.y - pickup.y;
    const distance = Math.hypot(dx, dy);

    const attractionRange = hasItem(state.items, 'item_salvage_magnet')
      ? Math.max(state.player.pickupPullRange, 760)
      : state.player.pickupPullRange;

    if (distance < attractionRange && distance > 0) {
      pickup.vx += (dx / distance) * 460 * dt;
      pickup.vy += (dy / distance) * 460 * dt;
    }

    pickup.x = clamp(pickup.x + pickup.vx * dt, bounds.padding, bounds.width - bounds.padding);
    pickup.y = clamp(pickup.y + pickup.vy * dt, bounds.padding, bounds.height - bounds.padding);
    pickup.vx *= 0.97;
    pickup.vy *= 0.97;
  }
}

function resolveGraze(state: CombatState): void {
  for (const projectile of state.projectiles) {
    if (projectile.owner !== 'enemy' || state.grazedProjectileIds.has(projectile.id)) {
      continue;
    }

    const hitDistance = state.player.radius + projectile.radius;
    const grazeDistance = hitDistance + GRAZE_MARGIN;
    const distanceSquared = getDistanceSquared(projectile, state.player);

    if (
      distanceSquared <= hitDistance * hitDistance ||
      distanceSquared > grazeDistance * grazeDistance
    ) {
      continue;
    }

    state.grazedProjectileIds.add(projectile.id);
    const grazePayload = applyItemHooks('onGraze', state.items, {
      projectileTags: projectile.tags,
      specialChargeGain: hasItem(state.items, 'item_phase_grazer')
        ? SPECIAL_CHARGE_PER_GRAZE * 1.55
        : SPECIAL_CHARGE_PER_GRAZE,
      bonusSalvage: 0,
      fireRateMultiplier: state.player.fireRateMultiplier,
      effectRadius: 34
    });

    gainSpecialCharge(state, grazePayload.specialChargeGain);

    if (grazePayload.bonusSalvage > 0) {
      state.player.salvage += Math.floor(grazePayload.bonusSalvage);
    }

    if (grazePayload.fireRateMultiplier < state.player.fireRateMultiplier) {
      state.player.fireRateMultiplier = grazePayload.fireRateMultiplier;
      state.player.fireRateBoostSeconds = Math.max(state.player.fireRateBoostSeconds, 1.2);
    }

    state.effects.push({
      id: getNextEntityId(state),
      kind: 'graze',
      x: projectile.x,
      y: projectile.y,
      radius: Math.max(1, grazePayload.effectRadius),
      ttl: 0.26,
      maxTtl: 0.26
    });
    state.stats = {
      ...state.stats,
      grazes: state.stats.grazes + 1,
      itemTriggers:
        state.stats.itemTriggers +
        Number(hasItem(state.items, 'item_phase_grazer')) +
        Number(grazePayload.bonusSalvage > 0) +
        Number(grazePayload.fireRateMultiplier < 1)
    };
  }
}

function resolveCombatCollisions(state: CombatState): void {
  const projectileIdsToRemove = new Set<number>();
  const enemyIdsToRemove = new Set<number>();
  const pickupIdsToRemove = new Set<number>();

  for (const projectile of state.projectiles) {
    if (projectile.owner === 'player') {
      for (const enemy of state.enemies) {
        if (enemyIdsToRemove.has(enemy.id) || !circlesOverlap(projectile, enemy)) {
          continue;
        }

        damageEnemyWithProjectile(state, enemy, projectile, enemyIdsToRemove);
        projectileIdsToRemove.add(projectile.id);
        break;
      }

      const boss = state.boss;
      if (boss && !projectileIdsToRemove.has(projectile.id) && circlesOverlap(projectile, boss)) {
        damageBossWithProjectile(state, boss, projectile);
        projectileIdsToRemove.add(projectile.id);
      }

      if (!projectileIdsToRemove.has(projectile.id)) {
        for (const object of getActiveEnvironmentObjects(state)) {
          if (
            !environmentObjectOverlapsCircle(object, projectile.x, projectile.y, projectile.radius)
          ) {
            continue;
          }

          const damaged = damageEnvironmentObject(
            state,
            object,
            projectile.environmentDamageSource ?? 'weapon',
            projectile.damage,
            {
              visitedObjectIds: new Set<number>(),
              chainBudget: createEnvironmentChainBudget()
            }
          );

          if (damaged) {
            projectileIdsToRemove.add(projectile.id);
            break;
          }
        }
      }
    }

    if (projectile.owner === 'enemy' && circlesOverlap(projectile, state.player)) {
      projectileIdsToRemove.add(projectile.id);
      damagePlayer(state, projectile.damage);
    }
  }

  for (const enemy of state.enemies) {
    if (enemyIdsToRemove.has(enemy.id) || !circlesOverlap(enemy, state.player)) {
      continue;
    }

    recordEnemyDefeat(state, enemy, enemyIdsToRemove, {
      dropPickups: false,
      grantSpecialCharge: false
    });
    damagePlayer(state, 1);
  }

  const boss = state.boss;
  if (boss && circlesOverlap(boss, state.player)) {
    damagePlayer(state, 1);
  }

  for (const pickup of state.pickups) {
    if (!circlesOverlap(pickup, state.player)) {
      continue;
    }

    pickupIdsToRemove.add(pickup.id);

    if (pickup.kind === 'credit') {
      state.player.credits += pickup.value;
    } else {
      state.player.salvage += pickup.value;
    }

    const pickupPayload = applyItemHooks('onPickupCollected', state.items, {
      kind: pickup.kind,
      fireRateMultiplier: state.player.fireRateMultiplier
    });
    if (pickupPayload.fireRateMultiplier < state.player.fireRateMultiplier) {
      state.player.fireRateMultiplier = pickupPayload.fireRateMultiplier;
      state.player.fireRateBoostSeconds = 2.2;
    }

    state.stats = {
      ...state.stats,
      pickupsCollected: state.stats.pickupsCollected + 1,
      itemTriggers: state.stats.itemTriggers + Number(pickupPayload.fireRateMultiplier < 1)
    };
  }

  state.projectiles = state.projectiles.filter(
    (projectile) => !projectileIdsToRemove.has(projectile.id)
  );
  state.enemies = state.enemies.filter((enemy) => !enemyIdsToRemove.has(enemy.id));
  state.pickups = state.pickups.filter((pickup) => !pickupIdsToRemove.has(pickup.id));
}

function damageEnemyWithProjectile(
  state: CombatState,
  enemy: EnemyState,
  projectile: ProjectileState,
  enemyIdsToRemove: Set<number>
): void {
  const overkillDamage = Math.max(0, projectile.damage - enemy.hull);
  enemy.hull = applyDamage(enemy.hull, projectile.damage).hull;

  if (enemy.hull > 0) {
    return;
  }

  const killPayload = applyItemHooks('onEnemyKilled', state.items, {
    projectileTags: projectile.tags,
    overkillDamage,
    bonusSalvage: 0,
    blastDamage: 0,
    arcDamage: 0
  });
  recordEnemyDefeat(state, enemy, enemyIdsToRemove, {
    bonusSalvage: killPayload.bonusSalvage,
    itemTriggers:
      Number(killPayload.bonusSalvage > 0) +
      Number(killPayload.blastDamage > 0) +
      Number(killPayload.arcDamage > 0)
  });
  applyKillSideEffects(state, enemy, killPayload, enemyIdsToRemove);
}

function damageBossWithProjectile(
  state: CombatState,
  boss: BossState,
  projectile: ProjectileState
): void {
  const overkillDamage = Math.max(0, projectile.damage - boss.hull);
  boss.hull = applyDamage(boss.hull, projectile.damage).hull;

  if (boss.hull > 0) {
    refreshBossPhase(state, boss);
    return;
  }

  const killPayload = applyItemHooks('onEnemyKilled', state.items, {
    projectileTags: projectile.tags,
    overkillDamage,
    bonusSalvage: 0,
    blastDamage: 0,
    arcDamage: 0
  });

  spawnBossDefeatPickups(state, boss, killPayload.bonusSalvage);
  state.boss = null;
  state.telegraphs = [];
  state.stats = {
    ...state.stats,
    enemiesDestroyed: state.stats.enemiesDestroyed + 1,
    bossesDefeated: state.stats.bossesDefeated + 1,
    itemTriggers: state.stats.itemTriggers + Number(killPayload.bonusSalvage > 0)
  };
  gainSpecialCharge(state, SPECIAL_CHARGE_PER_BOSS);
}

function gainSpecialCharge(state: CombatState, amount: number): void {
  state.player.specialCharge = clamp(
    state.player.specialCharge + Math.max(0, amount) * state.player.specialChargeMultiplier,
    0,
    state.player.maxSpecialCharge
  );
}

function cleanupEntities(state: CombatState, bounds: CombatBounds): void {
  state.projectiles = state.projectiles.filter(
    (projectile) =>
      projectile.ttl > 0 &&
      projectile.y > -80 &&
      projectile.y < bounds.height + 80 &&
      projectile.x > -80 &&
      projectile.x < bounds.width + 80
  );

  const despawnedEnemyIds = new Set<number>();

  for (const enemy of state.enemies) {
    if (enemy.y >= bounds.height + enemy.radius * 2) {
      recordEnemyDefeat(state, enemy, despawnedEnemyIds, {
        dropPickups: false,
        grantSpecialCharge: false
      });
    }
  }

  if (despawnedEnemyIds.size > 0) {
    state.enemies = state.enemies.filter((enemy) => !despawnedEnemyIds.has(enemy.id));
  }

  state.environmentObjects = state.environmentObjects.filter(
    (object) => !isEnvironmentObjectExpired(state, object)
  );
  state.telegraphs = state.telegraphs.filter((telegraph) => telegraph.ttl > 0);
  state.effects = state.effects.filter((effect) => effect.ttl > 0);

  const activeProjectileIds = new Set(state.projectiles.map((projectile) => projectile.id));

  for (const projectileId of state.grazedProjectileIds) {
    if (!activeProjectileIds.has(projectileId)) {
      state.grazedProjectileIds.delete(projectileId);
    }
  }
}

function damagePlayer(state: CombatState, damage: number): void {
  if (state.player.invulnerableSeconds > 0) {
    return;
  }

  const outcome = applyDamage(state.player.hull, damage);
  state.player.hull = outcome.hull;
  state.player.invulnerableSeconds = PLAYER_DAMAGE_INVULNERABILITY_SECONDS;

  const hitPayload = applyItemHooks('onPlayerHit', state.items, {
    damage: outcome.damageApplied,
    revengeProjectiles: []
  });

  for (const projectile of hitPayload.revengeProjectiles) {
    state.projectiles.push({
      id: getNextEntityId(state),
      owner: 'player',
      ...projectile,
      x: state.player.x + projectile.x,
      y: state.player.y + projectile.y
    });
  }

  state.stats = {
    ...state.stats,
    damageTaken: state.stats.damageTaken + outcome.damageApplied,
    itemTriggers: state.stats.itemTriggers + hitPayload.revengeProjectiles.length
  };
}

function fireEnemyAttack(
  state: CombatState,
  enemy: EnemyState,
  attackFamily: EnemyAttackFamily
): void {
  const attackSequence = enemy.attackSequence ?? 0;
  const projectiles = createEnemyAttackProjectiles(
    enemy,
    attackFamily,
    state.player,
    attackSequence
  );

  for (const projectile of projectiles) {
    spawnEnemyProjectile(state, projectile);
  }

  enemy.attackSequence = attackSequence + 1;
}

function getBossProjectileCount(baseCount: number, boss: BossState): number {
  return Math.min(12, Math.max(1, Math.round(baseCount * boss.projectileBudgetMultiplier)));
}

function getBossLaneOffsets(count: number): number[] {
  if (count <= 1) {
    return [0];
  }

  const spread = 144;
  return Array.from({ length: count }, (_value, index) => {
    const ratio = index / (count - 1);
    return (ratio - 0.5) * spread;
  });
}

function createBossTelegraphs(
  state: CombatState,
  boss: BossState,
  bounds: CombatBounds,
  patternId: BossPatternId
): void {
  if (patternId === 'missileCurtain') {
    for (const offset of getBossLaneOffsets(getBossProjectileCount(3, boss))) {
      state.telegraphs.push({
        id: getNextEntityId(state),
        kind: 'lane',
        factionId: boss.factionId,
        label: boss.currentWarningLabel,
        x: clamp(boss.x + offset, bounds.padding + 20, bounds.width - bounds.padding - 20),
        y: boss.y + boss.radius,
        radius: 0,
        width: 34,
        height: bounds.height,
        ttl: boss.currentTelegraphDuration,
        maxTtl: boss.currentTelegraphDuration
      });
    }
    return;
  }

  state.telegraphs.push({
    id: getNextEntityId(state),
    kind: patternId === 'sporeSpiral' ? 'ring' : 'fan',
    factionId: boss.factionId,
    label: boss.currentWarningLabel,
    x: boss.x,
    y: boss.y + boss.radius * 0.5,
    radius: patternId === 'sporeSpiral' ? 128 : 158,
    width: 0,
    height: 0,
    ttl: boss.currentTelegraphDuration,
    maxTtl: boss.currentTelegraphDuration
  });
}

function fireBossAttack(state: CombatState, boss: BossState, patternId: BossPatternId): void {
  if (patternId === 'auditFan') {
    const bulletCount = getBossProjectileCount(7, boss);
    const centerIndex = (bulletCount - 1) / 2;

    for (let index = 0; index < bulletCount; index += 1) {
      const angle = Math.PI / 2 + (index - centerIndex) * 0.18;
      spawnEnemyProjectile(state, {
        x: boss.x,
        y: boss.y + boss.radius,
        vx: Math.cos(angle) * 300,
        vy: Math.sin(angle) * 300,
        radius: 6,
        damage: 1,
        ttl: 3.8,
        tags: ['plasma'],
        factionId: boss.factionId
      });
    }
  } else if (patternId === 'missileCurtain') {
    const offsets = getBossLaneOffsets(getBossProjectileCount(3, boss));
    const centerIndex = (offsets.length - 1) / 2;

    for (const [index, offset] of offsets.entries()) {
      spawnEnemyProjectile(state, {
        x: boss.x + offset,
        y: boss.y + boss.radius,
        vx: (index - centerIndex) * 18,
        vy: 235,
        radius: 9,
        damage: 1,
        ttl: 4.6,
        tags: ['missile'],
        factionId: boss.factionId
      });
    }
  } else {
    const bulletCount = getBossProjectileCount(10, boss);
    const baseAngle = boss.attackSequence * 0.43;
    for (let index = 0; index < bulletCount; index += 1) {
      const angle = baseAngle + (Math.PI * 2 * index) / bulletCount;
      spawnEnemyProjectile(state, {
        x: boss.x,
        y: boss.y + boss.radius * 0.25,
        vx: Math.cos(angle) * 150,
        vy: Math.sin(angle) * 150 + 118,
        radius: 5,
        damage: 1,
        ttl: 4,
        tags: ['plasma'],
        factionId: boss.factionId
      });
    }
  }

  boss.attackSequence += 1;
}

function spawnEnemyProjectile(
  state: CombatState,
  projectile: Omit<ProjectileState, 'id' | 'owner' | 'procDepth'>
): void {
  state.projectiles.push({
    id: getNextEntityId(state),
    owner: 'enemy',
    procDepth: 0,
    ...projectile
  });
}

function spawnEnemyDefeatPickups(
  state: CombatState,
  enemy: EnemyState,
  bonusSalvage: number
): void {
  state.pickups.push({
    id: getNextEntityId(state),
    kind: 'credit',
    x: enemy.x - 8,
    y: enemy.y,
    vx: -34,
    vy: 36,
    radius: 7,
    value: 2
  });
  state.pickups.push({
    id: getNextEntityId(state),
    kind: 'salvage',
    x: enemy.x + 8,
    y: enemy.y,
    vx: 34,
    vy: 36,
    radius: 6,
    value: 1
  });

  if (bonusSalvage > 0) {
    state.pickups.push({
      id: getNextEntityId(state),
      kind: 'salvage',
      x: enemy.x,
      y: enemy.y + 12,
      vx: 0,
      vy: 54,
      radius: 7,
      value: bonusSalvage
    });
  }
}

function spawnBossDefeatPickups(state: CombatState, boss: BossState, bonusSalvage: number): void {
  for (const offset of [-28, 0, 28]) {
    state.pickups.push({
      id: getNextEntityId(state),
      kind: 'credit',
      x: boss.x + offset,
      y: boss.y + boss.radius * 0.4,
      vx: offset,
      vy: 58,
      radius: 8,
      value: 4
    });
  }

  state.pickups.push({
    id: getNextEntityId(state),
    kind: 'salvage',
    x: boss.x,
    y: boss.y + boss.radius * 0.7,
    vx: 0,
    vy: 72,
    radius: 9,
    value: 4 + bonusSalvage
  });
}

function applyKillSideEffects(
  state: CombatState,
  defeatedEnemy: EnemyState,
  payload: EnemyKilledPayload,
  enemyIdsToRemove: Set<number>
): void {
  if (payload.arcDamage > 0) {
    const nearest = state.enemies
      .filter((enemy) => enemy.id !== defeatedEnemy.id && !enemyIdsToRemove.has(enemy.id))
      .sort(
        (a, b) => getDistanceSquared(defeatedEnemy, a) - getDistanceSquared(defeatedEnemy, b)
      )[0];

    if (nearest) {
      nearest.hull = applyDamage(nearest.hull, payload.arcDamage).hull;
      if (nearest.hull <= 0) {
        recordEnemyDefeat(state, nearest, enemyIdsToRemove);
      }
    }
  }

  if (payload.blastDamage > 0) {
    for (const enemy of state.enemies) {
      if (enemy.id === defeatedEnemy.id || enemyIdsToRemove.has(enemy.id)) {
        continue;
      }

      if (getDistanceSquared(defeatedEnemy, enemy) > 150 * 150) {
        continue;
      }

      enemy.hull = applyDamage(enemy.hull, payload.blastDamage).hull;
      if (enemy.hull <= 0) {
        recordEnemyDefeat(state, enemy, enemyIdsToRemove);
      }
    }
  }
}

function recordEnemyDefeat(
  state: CombatState,
  enemy: EnemyState,
  enemyIdsToRemove: Set<number>,
  options: {
    readonly bonusSalvage?: number;
    readonly itemTriggers?: number;
    readonly dropPickups?: boolean;
    readonly grantSpecialCharge?: boolean;
  } = {}
): boolean {
  if (enemyIdsToRemove.has(enemy.id)) {
    return false;
  }

  enemyIdsToRemove.add(enemy.id);

  if (options.dropPickups ?? true) {
    spawnEnemyDefeatPickups(
      state,
      enemy,
      (options.bonusSalvage ?? 0) +
        getEnemyVariantBonusSalvage(enemy) +
        getEnemyFormationClearBonusSalvage(state, enemy, enemyIdsToRemove)
    );
  }

  state.stats = {
    ...state.stats,
    enemiesDestroyed: state.stats.enemiesDestroyed + 1,
    itemTriggers: state.stats.itemTriggers + Math.max(0, options.itemTriggers ?? 0)
  };

  if (options.grantSpecialCharge ?? true) {
    gainSpecialCharge(state, SPECIAL_CHARGE_PER_KILL);
  }

  return true;
}

function getEnemyVariantFireDelayMultiplier(enemy: EnemyState): number {
  return enemy.variantId ? getEnemyVariantById(enemy.variantId).fireDelayMultiplier : 1;
}

function getEnemyVariantBonusSalvage(enemy: EnemyState): number {
  return enemy.variantId ? getEnemyVariantById(enemy.variantId).bonusSalvage : 0;
}

function getEnemyFormationClearBonusSalvage(
  state: CombatState,
  enemy: EnemyState,
  enemyIdsToRemove: ReadonlySet<number>
): number {
  if (!enemy.formationId || !enemy.formationInstanceId) {
    return 0;
  }

  if (state.formationRewardsClaimed.has(enemy.formationInstanceId)) {
    return 0;
  }

  const allFormationSpawnsIssued = state.spawnSchedule.every(
    (spawn, index) =>
      spawn.formationInstanceId !== enemy.formationInstanceId || index < state.nextSpawnIndex
  );

  if (!allFormationSpawnsIssued) {
    return 0;
  }

  const hasActiveFormationMember = state.enemies.some(
    (other) =>
      other.formationInstanceId === enemy.formationInstanceId && !enemyIdsToRemove.has(other.id)
  );

  if (hasActiveFormationMember) {
    return 0;
  }

  const bonusSalvage = getEnemyFormationById(enemy.formationId).clearBonusSalvage;
  state.formationRewardsClaimed.add(enemy.formationInstanceId);

  return bonusSalvage;
}

function getDistanceSquared(
  a: { readonly x: number; readonly y: number },
  b: { readonly x: number; readonly y: number }
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function getNextEntityId(state: CombatState): number {
  const id = state.nextId;
  state.nextId += 1;
  return id;
}

function createEnemySpawnSchedule(seed: string, preferredFactionId: FactionId): EnemySpawn[] {
  const rng = createRng(seed).fork('combat-mvp-wave');
  const schedule: EnemySpawn[] = [
    {
      atSeconds: 0.45,
      waveIndex: 0,
      waveLabel: 'combat_mvp_open',
      xRatio: 0.5,
      targetY: 116,
      hull: 2,
      fireDelay: 1,
      factionId: preferredFactionId
    }
  ];

  for (let index = 1; index < 12; index += 1) {
    const factionId = rng.weightedChoice(
      FACTIONS.map((faction) => ({
        item: faction.id,
        weight: faction.id === preferredFactionId ? 4 : 2
      }))
    );

    schedule.push({
      atSeconds: 0.45 + index * 1.35,
      waveIndex: index,
      waveLabel: `combat_mvp_${index + 1}`,
      xRatio: rng.int(18, 82) / 100,
      targetY: rng.int(86, 190),
      hull: index % 4 === 0 ? 3 : 2,
      fireDelay: rng.int(70, 140) / 100,
      factionId
    });
  }

  return schedule;
}
