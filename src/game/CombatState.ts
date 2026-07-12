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
import type { RivalTactic } from '../content/factionCampaigns';
import type { CrewCommand } from '../content/crew';
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
  hasItem,
  type EnemyKilledPayload,
  type ItemHookName,
  type ItemHookPayloadByName,
  type ProjectileBlueprint
} from './ItemHooks';
import { applyCombinedHooksWithReport, type CombinedHookDispatchReport } from './CombinedHooks';
import { BASE_COMBINED_PROC_BUDGET, type EngineeringCombatProfile } from './Foundry';
import type { EnvironmentObjectPlacementPlan } from './EnvironmentObjectPlacement';
import { COMBAT_ARENA_HEIGHT } from './CombatGeometry';
import {
  LOOSE_CURRENCY_ACTIVE_PICKUP_CAP,
  LOOSE_CURRENCY_ACTIVE_VALUE_CAP,
  createLooseCurrencyScatter,
  summarizeLooseCurrencyPickups,
  type LooseCurrencyPlan,
  type LooseCurrencyPickupSpec,
  type LooseCurrencySource,
  type LooseCurrencyTier
} from './LooseCurrency';
import { getItemNames, type ItemInstance } from './Rewards';
import type { MissionObjectiveResultSnapshot } from './ObjectiveDirector';
import type { CrewCombatProfile } from './CrewCommand';
import {
  MAX_COMBINED_ALLIES,
  MAX_COMBINED_ALLY_PROJECTILES,
  type FleetCombatProfile
} from './Fleetcraft';
import {
  createSetPieceReinforcementSpawns,
  createSetPieceState,
  damageSetPieceComponent,
  damageSetPieceComponentsInRadius as damageActorComponentsInRadius,
  damageSetPieceComponentsInRect as damageActorComponentsInRect,
  getActiveSetPieceComponents,
  getSetPieceComponentRect,
  getSetPieceComponentScreenY,
  setPieceComponentOverlapsCircle,
  updateSetPieceState,
  type SetPiecePlan,
  type SetPieceRuntimeEvent,
  type SetPieceState
} from './SetPiece';

export type ProjectileOwner = 'player' | 'ally' | 'enemy';
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
  readonly setPieceSourceId?: string;
  readonly allyId?: string;
}

export interface AllyState {
  readonly source: 'crew' | 'fleet';
  readonly candidateId: string;
  readonly name: string;
  readonly callsign: string;
  readonly role: string;
  readonly trait: string;
  readonly preferredCommand: CrewCommand;
  readonly cue: {
    readonly glyph: string;
    readonly color: string;
    readonly highContrastGlyph: string;
  };
  x: number;
  y: number;
  readonly radius: number;
  hull: number;
  readonly maxHull: number;
  readonly moveSpeed: number;
  readonly fireCooldownSeconds: number;
  readonly projectileDamage: number;
  fireCooldown: number;
  screenCooldown: number;
  status: 'active' | 'injured' | 'retreated';
  enemiesDefeated: number;
  salvageRecovered: number;
  readonly fitLabel: string;
}

export interface CrewCommandState {
  active: CrewCommand;
  cooldownSeconds: number;
  issuedCount: number;
  rejectedCount: number;
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
  readonly countsForObjective?: boolean;
  readonly rivalId?: string | null;
  readonly rivalName?: string | null;
  readonly rivalTitle?: string | null;
  readonly rivalShipName?: string | null;
  readonly rivalTactic?: RivalTactic | null;
  readonly rivalRetreatAtHullRatio?: number;
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
  readonly worldDistance?: number;
  scrollDistanceLastFrame?: number;
  vx: number;
  vy: number;
  readonly radius: number;
  readonly value: number;
  ttl?: number;
  readonly collectionRadius?: number;
  readonly source?: LooseCurrencySource;
  readonly tier?: LooseCurrencyTier;
  readonly debugLabel?: string;
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
  mineFuseSeconds: number | null;
  mineFuseDurationSeconds: number;
  mineTriggerSource: 'proximity' | 'damage' | 'chain' | null;
  destroyed: boolean;
}

export type CombatEffectKind =
  'special' | 'bomb' | 'graze' | 'environmentHit' | 'environmentBreak' | 'chainReaction';

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
  readonly enemiesEscaped: number;
  readonly bossesDefeated: number;
  readonly shotsFired: number;
  readonly pickupsCollected: number;
  readonly looseCurrencySpawned: number;
  readonly looseCurrencyCollected: number;
  readonly looseCurrencyExpired: number;
  readonly looseCurrencySuppressedValue: number;
  readonly damageTaken: number;
  readonly itemTriggers: number;
  readonly specialsUsed: number;
  readonly bombsUsed: number;
  readonly grazes: number;
  readonly enemyProjectilesCancelled: number;
  readonly environmentObjectsDestroyed: number;
  readonly environmentRewardsDropped: number;
  readonly environmentChainReactions: number;
  readonly proximityMinesTriggered: number;
  readonly proximityMinesDetonated: number;
  readonly proximityMineEnemyHits: number;
  readonly setPieceComponentsDestroyed: number;
  readonly setPieceStagesCompleted: number;
  readonly setPiecesCompleted: number;
  readonly setPieceRewardsDropped: number;
  readonly setPieceProjectilesFired: number;
  readonly setPieceReinforcementsSpawned: number;
  readonly rivalsEscaped: number;
  readonly rivalsDestroyed: number;
  readonly alliesDeployed: number;
  readonly allyProjectilesFired: number;
  readonly allyEnemiesDestroyed: number;
  readonly allyProjectilesScreened: number;
  readonly allySalvageCollected: number;
  readonly allyInjuries: number;
  readonly allyRetreats: number;
}

export interface RivalCombatState {
  readonly rivalId: string;
  readonly name: string;
  readonly title: string;
  readonly shipName: string;
  readonly tactic: RivalTactic;
  outcome: 'engaged' | 'escaped' | 'destroyed';
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
  rivalEncounter: RivalCombatState | null;
  allies: AllyState[];
  crewCommand: CrewCommandState;
  telegraphs: TelegraphState[];
  pickups: PickupState[];
  environmentObjects: EnvironmentObjectState[];
  setPiece: SetPieceState | null;
  effects: CombatEffectState[];
  grazedProjectileIds: Set<number>;
  formationRewardsClaimed: Set<string>;
  spawnSchedule: readonly EnemySpawn[];
  readonly looseCurrencyPlan: LooseCurrencyPlan | null;
  nextLooseCurrencyIndex: number;
  readonly weapon: WeaponDefinition;
  items: readonly ItemInstance[];
  readonly engineering: EngineeringCombatProfile | null;
  procTelemetry: CombinedProcTelemetry;
  volleyIndex: number;
  stats: CombatStats;
  ended: boolean;
}

export interface CombinedProcTelemetry {
  readonly budget: number;
  readonly totalApplied: number;
  readonly totalSkipped: number;
  readonly peakHook: ItemHookName | null;
  readonly peakApplications: number;
  readonly lastOrder: readonly string[];
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
  readonly countsForObjective?: boolean;
  readonly rivalId?: string | null;
  readonly rivalName?: string | null;
  readonly rivalTitle?: string | null;
  readonly rivalShipName?: string | null;
  readonly rivalTactic?: RivalTactic | null;
  readonly rivalRetreatAtHullRatio?: number;
}

export interface CombatRunResult {
  readonly reason: CombatEndReason;
  readonly survivedSeconds: number;
  readonly distanceTraveled: number;
  readonly sectorLength: number | null;
  readonly credits: number;
  readonly salvage: number;
  readonly enemiesDestroyed: number;
  readonly enemiesEscaped?: number;
  readonly bossesDefeated: number;
  readonly shotsFired: number;
  readonly pickupsCollected: number;
  readonly damageTaken: number;
  readonly remainingHull?: number;
  readonly worldOffset?: number;
  readonly missionObjective?: MissionObjectiveResultSnapshot;
  readonly itemTriggers: number;
  readonly itemNames: readonly string[];
  readonly setPiece?: {
    readonly name: string;
    readonly completed: boolean;
    readonly destroyedComponents: number;
    readonly totalComponents: number;
    readonly stagesCompleted: number;
  };
  readonly rivalEncounter?: {
    readonly rivalId: string;
    readonly name: string;
    readonly title: string;
    readonly shipName: string;
    readonly tactic: RivalTactic;
    readonly outcome: 'escaped' | 'destroyed';
  };
  readonly crew?: {
    readonly command: CrewCommand;
    readonly issuedCommands: number;
    readonly members: readonly {
      readonly candidateId: string;
      readonly injured: boolean;
      readonly retreated: boolean;
      readonly enemiesDefeated: number;
      readonly salvageRecovered: number;
    }[];
  };
  readonly fleet?: {
    readonly doctrine: string;
    readonly issuedCommands: number;
    readonly craft: readonly {
      readonly craftId: string;
      readonly lost: boolean;
      readonly retreated: boolean;
      readonly remainingHull: number;
      readonly enemiesDefeated: number;
      readonly salvageRecovered: number;
    }[];
  };
}

export interface CombatEntityCounts {
  readonly total: number;
  readonly player: number;
  readonly enemies: number;
  readonly allies?: number;
  readonly boss: number;
  readonly projectiles: number;
  readonly playerProjectiles: number;
  readonly enemyProjectiles: number;
  readonly allyProjectiles?: number;
  readonly pickups: number;
  readonly looseCurrencyPickups: number;
  readonly looseCurrencyValue: number;
  readonly looseCurrencyCredits: number;
  readonly looseCurrencySalvage: number;
  readonly looseCurrencyPickupCap: number;
  readonly looseCurrencyValueCap: number;
  readonly effects: number;
  readonly pickupsAndEffects: number;
  readonly telegraphs: number;
  readonly environmentObjects: number;
  readonly destructibles: number;
  readonly obstacles: number;
  readonly proximityMines?: number;
  readonly armedProximityMines?: number;
  readonly setPieceComponents?: number;
  readonly setPieceTargets?: number;
  readonly setPieceProjectiles?: number;
  readonly setPieceProjectileCap?: number;
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
const ENVIRONMENT_CONTACT_PUSH_EPSILON = 0.75;
const LOOSE_CURRENCY_SCROLL_SPAWN_LEAD_DISTANCE = 150;
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
  readonly startingHull?: number | null;
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
  readonly setPiecePlan?: SetPiecePlan | null;
  readonly setPieceOwnerFactionId?: FactionId;
  readonly looseCurrencyPlan?: LooseCurrencyPlan | null;
  readonly engineering?: EngineeringCombatProfile | null;
  readonly crew?: CrewCombatProfile | null;
  readonly fleet?: FleetCombatProfile | null;
}

export function createCombatState(
  bounds: CombatBounds,
  seed: string,
  options: CombatStateOptions = {}
): CombatState {
  const weapon = getWeaponById(
    options.engineering?.weaponId ?? options.weaponId ?? 'weapon_light_needle_laser'
  );
  const bossDefinition = getBossById(options.bossId ?? DEFAULT_BOSS_ID);
  const shipStats = options.shipStats ?? DEFAULT_SHIP_STATS;
  const maxBombs = Math.max(0, Math.floor(shipStats.bombCapacity));
  const state: CombatState = {
    seed,
    bossId: bossDefinition.id,
    bossSpawnAtSeconds: options.bossSpawnAtSeconds ?? null,
    enemyHullBonus: Math.max(0, Math.floor(options.enemyHullBonus ?? 0)),
    enemyFireDelayMultiplier: clamp(options.enemyFireDelayMultiplier ?? 1, 0.5, 1.5),
    bossHullBonus: Math.floor(options.bossHullBonus ?? 0),
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
      hull: clamp(options.startingHull ?? shipStats.maxHull, 0, shipStats.maxHull),
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
    rivalEncounter: null,
    allies: [
      ...(options.crew?.members ?? []).map((member) => ({
        source: 'crew' as const,
        candidateId: member.candidateId,
        name: member.name,
        callsign: member.callsign,
        role: member.role,
        trait: member.trait,
        preferredCommand: member.preferredCommand,
        cue: member.cue,
        radius: 13,
        hull: member.maxHull,
        maxHull: member.maxHull,
        moveSpeed: member.moveSpeed,
        fireCooldownSeconds: member.fireCooldownSeconds,
        projectileDamage: member.projectileDamage,
        fitLabel: member.fitLabel
      })),
      ...(options.fleet?.members ?? []).map((member) => ({
        source: 'fleet' as const,
        candidateId: member.craftId,
        name: member.callsign,
        callsign: member.callsign,
        role: member.role,
        trait: member.trait,
        preferredCommand: member.preferredCommand,
        cue: member.cue,
        radius: 11,
        hull: member.maxHull,
        maxHull: member.maxHull,
        moveSpeed: member.moveSpeed,
        fireCooldownSeconds: member.fireCooldownSeconds,
        projectileDamage: member.projectileDamage,
        fitLabel: member.fitLabel
      }))
    ].slice(0, MAX_COMBINED_ALLIES).map((member, index) => ({
      ...member,
      x:
        bounds.width / 2 +
        (index -
          (Math.min(
            MAX_COMBINED_ALLIES,
            (options.crew?.members.length ?? 0) + (options.fleet?.members.length ?? 0)
          ) -
            1) /
            2) *
          54,
      y: bounds.height * 0.86,
      fireCooldown: index * 0.12,
      screenCooldown: index * 0.08,
      status: 'active',
      enemiesDefeated: 0,
      salvageRecovered: 0
    })),
    crewCommand: {
      active: 'focus',
      cooldownSeconds: 0,
      issuedCount: 0,
      rejectedCount: 0
    },
    telegraphs: [],
    pickups: [],
    environmentObjects: [],
    setPiece: createSetPieceState(options.setPiecePlan ?? null, options.setPieceOwnerFactionId),
    effects: [],
    grazedProjectileIds: new Set<number>(),
    formationRewardsClaimed: new Set<string>(),
    spawnSchedule:
      options.spawnSchedule ??
      (options.skipEnemyWaves ? [] : createEnemySpawnSchedule(seed, bossDefinition.factionId)),
    looseCurrencyPlan: options.looseCurrencyPlan ?? null,
    nextLooseCurrencyIndex: 0,
    weapon,
    items: options.items ?? [],
    engineering: options.engineering ?? null,
    procTelemetry: {
      budget: options.engineering?.procBudget ?? BASE_COMBINED_PROC_BUDGET,
      totalApplied: 0,
      totalSkipped: 0,
      peakHook: null,
      peakApplications: 0,
      lastOrder: []
    },
    volleyIndex: 0,
    stats: {
      enemiesDestroyed: 0,
      enemiesEscaped: 0,
      bossesDefeated: 0,
      shotsFired: 0,
      pickupsCollected: 0,
      looseCurrencySpawned: 0,
      looseCurrencyCollected: 0,
      looseCurrencyExpired: 0,
      looseCurrencySuppressedValue: 0,
      damageTaken: 0,
      itemTriggers: 0,
      specialsUsed: 0,
      bombsUsed: 0,
      grazes: 0,
      enemyProjectilesCancelled: 0,
      environmentObjectsDestroyed: 0,
      environmentRewardsDropped: 0,
      environmentChainReactions: 0,
      proximityMinesTriggered: 0,
      proximityMinesDetonated: 0,
      proximityMineEnemyHits: 0,
      setPieceComponentsDestroyed: 0,
      setPieceStagesCompleted: 0,
      setPiecesCompleted: 0,
      setPieceRewardsDropped: 0,
      setPieceProjectilesFired: 0,
      setPieceReinforcementsSpawned: 0,
      rivalsEscaped: 0,
      rivalsDestroyed: 0,
      alliesDeployed: Math.min(
        MAX_COMBINED_ALLIES,
        (options.crew?.members.length ?? 0) + (options.fleet?.members.length ?? 0)
      ),
      allyProjectilesFired: 0,
      allyEnemiesDestroyed: 0,
      allyProjectilesScreened: 0,
      allySalvageCollected: 0,
      allyInjuries: 0,
      allyRetreats: 0
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
  updateAllies(state, safeDt, bounds);
  updateBoss(state, safeDt, bounds);
  updateProjectiles(state, safeDt, bounds);
  updateTelegraphs(state, safeDt);
  updateCombatEffects(state, safeDt);
  updateEnvironmentObjects(state, safeDt);
  if (state.setPiece) {
    updateSetPieceState(state.setPiece, safeDt);
    updateSetPieceSubsystems(state, bounds);
  }
  spawnDueLooseCurrency(state, bounds);
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

export function issueCrewCommand(state: CombatState, command: CrewCommand): boolean {
  if (
    state.ended ||
    state.allies.every((ally) => ally.status !== 'active') ||
    state.crewCommand.cooldownSeconds > 0
  ) {
    state.crewCommand.rejectedCount += 1;
    return false;
  }

  state.crewCommand.active = command;
  state.crewCommand.cooldownSeconds = 0.35;
  state.crewCommand.issuedCount += 1;
  return true;
}

export function getActiveEnvironmentObjects(state: CombatState): EnvironmentObjectState[] {
  return state.environmentObjects.filter((object) => isEnvironmentObjectActive(state, object));
}

export function getEnvironmentObjectScreenY(
  state: Pick<CombatState, 'scrollDistance'>,
  object: EnvironmentObjectState
): number {
  return object.y + state.scrollDistance - object.distance;
}

export function getEnvironmentObjectScreenState(
  state: Pick<CombatState, 'scrollDistance'>,
  object: EnvironmentObjectState
): EnvironmentObjectState {
  return {
    ...object,
    y: getEnvironmentObjectScreenY(state, object)
  };
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
    if (!environmentObjectOverlapsCircle(state, object, x, y, radius)) {
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
  rect: {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
  },
  source: EnvironmentObjectDamageSource,
  damage: number
): number {
  let damaged = 0;

  for (const object of getActiveEnvironmentObjects(state)) {
    if (!environmentObjectOverlapsRect(state, object, rect)) {
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
    if (state.setPiece && !state.setPiece.completed) {
      state.setPiece = null;
    }
    state.nextSpawnIndex = state.spawnSchedule.length;
  }

  const maxHull = Math.max(1, bossDefinition.maxHull + state.bossHullBonus);
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

export function prepareDebugEnvironmentStressScenario(
  state: CombatState,
  bounds: CombatBounds
): void {
  state.enemies = [];
  state.projectiles = [];
  state.telegraphs = [];
  state.effects = [];
  state.pickups = [];
  state.environmentObjects = [];
  state.boss = null;
  state.bossSpawned = true;
  state.nextSpawnIndex = state.spawnSchedule.length;
  state.nextLooseCurrencyIndex = state.looseCurrencyPlan?.events.length ?? 0;
  state.grazedProjectileIds.clear();
  state.formationRewardsClaimed.clear();

  const centerX = bounds.width / 2;
  const distance = state.scrollDistance;
  state.player.x = centerX;
  state.player.y = bounds.height * 0.78;
  state.player.invulnerableSeconds = 1.2;
  state.player.fireCooldown = 0;
  state.player.weaponHeat = 0;
  state.player.weaponOverheatSeconds = 0;

  const objectPlacements: ReadonlyArray<{
    readonly definitionId: EnvironmentObjectId;
    readonly x: number;
    readonly y: number;
    readonly distanceOffset: number;
  }> = [
    { definitionId: 'salvage_cache', x: centerX - 184, y: 192, distanceOffset: -18 },
    { definitionId: 'volatile_canister', x: centerX - 114, y: 250, distanceOffset: -10 },
    { definitionId: 'cargo_pod', x: centerX + 128, y: 212, distanceOffset: -4 },
    { definitionId: 'debris_shard_cluster', x: centerX + 214, y: 306, distanceOffset: 8 },
    { definitionId: 'shield_gate', x: centerX - 220, y: 372, distanceOffset: 16 },
    { definitionId: 'wreck_plate', x: centerX + 76, y: 424, distanceOffset: 22 }
  ];

  state.environmentObjects = objectPlacements.map((placement) =>
    createDebugEnvironmentObjectState(
      state,
      placement.definitionId,
      placement.x,
      placement.y,
      distance + placement.distanceOffset
    )
  );

  const looseScatter = [
    { sourceId: 'debug-left-lane', x: centerX - 190, y: 140, credits: 9, salvage: 3 },
    { sourceId: 'debug-center-cache', x: centerX, y: 178, credits: 7, salvage: 2 },
    { sourceId: 'debug-right-lane', x: centerX + 190, y: 152, credits: 8, salvage: 3 }
  ] as const;

  for (const scatter of looseScatter) {
    spawnLooseCurrencySpecs(
      state,
      createLooseCurrencyScatter({
        seed: state.seed,
        sourceId: scatter.sourceId,
        source: 'debug',
        x: scatter.x,
        y: scatter.y,
        worldDistance: state.scrollDistance,
        credits: scatter.credits,
        salvage: scatter.salvage,
        maxPickups: 5,
        spread: 46,
        baseVy: 18,
        debugLabel: 'environment stress'
      })
    );
  }

  state.effects.push({
    id: getNextEntityId(state),
    kind: 'environmentHit',
    x: centerX - 114,
    y: 250,
    radius: 42,
    ttl: 0.5,
    maxTtl: 0.5
  });
  state.effects.push({
    id: getNextEntityId(state),
    kind: 'chainReaction',
    x: centerX - 184,
    y: 192,
    radius: 78,
    ttl: 0.52,
    maxTtl: 0.52
  });
}

export function prepareDebugCombinedPhaseTenScenario(
  state: CombatState,
  bounds: CombatBounds
): void {
  prepareDebugEnemyRichScenario(state, bounds);
  const enemies = [...state.enemies];
  const projectiles = [...state.projectiles];
  const telegraphs = [...state.telegraphs];
  const combatEffects = [...state.effects];
  prepareDebugEnvironmentStressScenario(state, bounds);
  state.enemies = enemies;
  state.projectiles = projectiles;
  state.telegraphs = telegraphs;
  state.effects = [...combatEffects, ...state.effects].slice(0, MAX_ENVIRONMENT_FEEDBACK_EFFECTS);
  state.player.invulnerableSeconds = 2;
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
  state.setPiece = null;
  state.boss = null;
  state.bossSpawned = false;
  state.nextSpawnIndex = state.spawnSchedule.length;
  state.nextLooseCurrencyIndex = state.looseCurrencyPlan?.events.length ?? 0;

  if (typeof scrollDistance === 'number' && Number.isFinite(scrollDistance)) {
    state.scrollDistance =
      state.sectorLength === null
        ? Math.max(0, scrollDistance)
        : clamp(scrollDistance, 0, state.sectorLength);
  }
}

export function getCombatEntityCounts(state: CombatState): CombatEntityCounts {
  let playerProjectiles = 0;
  let allyProjectiles = 0;
  let destructibles = 0;
  let proximityMines = 0;
  let armedProximityMines = 0;

  for (const projectile of state.projectiles) {
    if (projectile.owner === 'player') {
      playerProjectiles += 1;
    } else if (projectile.owner === 'ally') {
      allyProjectiles += 1;
    }
  }

  const environmentObjects = getActiveEnvironmentObjects(state);
  const setPieceComponents = getActiveSetPieceComponents(state.setPiece, state.scrollDistance);
  const looseCurrency = summarizeLooseCurrencyPickups(state.pickups);

  for (const object of environmentObjects) {
    if (object.kind === 'destructible') {
      destructibles += 1;
    }

    if (object.definitionId === 'proximity_mine') {
      proximityMines += 1;
      armedProximityMines += Number(object.mineFuseSeconds !== null);
    }
  }

  const obstacles = environmentObjects.length - destructibles;
  const enemyProjectiles = state.projectiles.length - playerProjectiles - allyProjectiles;
  const setPieceProjectiles = state.projectiles.filter(
    (projectile) => projectile.setPieceSourceId !== undefined
  ).length;
  const pickupsAndEffects = state.pickups.length + state.effects.length;
  const boss = Number(state.boss !== null);

  return {
    total:
      1 +
      boss +
      state.enemies.length +
      state.allies.length +
      state.projectiles.length +
      state.pickups.length +
      state.telegraphs.length +
      state.effects.length +
      environmentObjects.length +
      setPieceComponents.length,
    player: 1,
    enemies: state.enemies.length,
    ...(state.allies.length > 0 ? { allies: state.allies.length } : {}),
    boss,
    projectiles: state.projectiles.length,
    playerProjectiles,
    enemyProjectiles,
    ...(allyProjectiles > 0 ? { allyProjectiles } : {}),
    pickups: state.pickups.length,
    looseCurrencyPickups: looseCurrency.activePickups,
    looseCurrencyValue: looseCurrency.activeValue,
    looseCurrencyCredits: looseCurrency.creditValue,
    looseCurrencySalvage: looseCurrency.salvageValue,
    looseCurrencyPickupCap: LOOSE_CURRENCY_ACTIVE_PICKUP_CAP,
    looseCurrencyValueCap: LOOSE_CURRENCY_ACTIVE_VALUE_CAP,
    effects: state.effects.length,
    pickupsAndEffects,
    telegraphs: state.telegraphs.length,
    environmentObjects: environmentObjects.length,
    destructibles,
    obstacles,
    ...(proximityMines > 0 ? { proximityMines, armedProximityMines } : {}),
    ...(state.setPiece
      ? {
          setPieceComponents: setPieceComponents.length,
          setPieceTargets: setPieceComponents.filter((component) => component.targetable).length,
          setPieceProjectiles,
          setPieceProjectileCap: state.setPiece.plan.caps.projectiles
        }
      : {})
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
    enemiesEscaped: state.stats.enemiesEscaped,
    bossesDefeated: state.stats.bossesDefeated,
    shotsFired: state.stats.shotsFired,
    pickupsCollected: state.stats.pickupsCollected,
    damageTaken: state.stats.damageTaken,
    remainingHull: state.player.hull,
    itemTriggers: state.stats.itemTriggers,
    itemNames: getItemNames(state.items),
    ...(state.setPiece
      ? {
          setPiece: {
            name: state.setPiece.plan.name,
            completed: state.setPiece.completed,
            destroyedComponents: state.stats.setPieceComponentsDestroyed,
            totalComponents: state.setPiece.components.length,
            stagesCompleted: state.stats.setPieceStagesCompleted
          }
        }
      : {}),
    ...(state.allies.some((ally) => ally.source === 'crew')
      ? {
          crew: {
            command: state.crewCommand.active,
            issuedCommands: state.crewCommand.issuedCount,
            members: state.allies.filter((ally) => ally.source === 'crew').map((ally) => ({
              candidateId: ally.candidateId,
              injured: ally.status === 'injured',
              retreated: ally.status === 'retreated',
              enemiesDefeated: ally.enemiesDefeated,
              salvageRecovered: ally.salvageRecovered
            }))
          }
        }
      : {}),
    ...(state.allies.some((ally) => ally.source === 'fleet')
      ? {
          fleet: {
            doctrine: state.allies
              .filter((ally) => ally.source === 'fleet')
              .map((ally) => ally.preferredCommand)
              .join('+'),
            issuedCommands: state.crewCommand.issuedCount,
            craft: state.allies.filter((ally) => ally.source === 'fleet').map((ally) => ({
              craftId: ally.candidateId,
              lost: ally.status === 'injured',
              retreated: ally.status === 'retreated',
              remainingHull: Math.max(0, ally.hull),
              enemiesDefeated: ally.enemiesDefeated,
              salvageRecovered: ally.salvageRecovered
            }))
          }
        }
      : {}),
    ...(state.rivalEncounter
      ? {
          rivalEncounter: {
            rivalId: state.rivalEncounter.rivalId,
            name: state.rivalEncounter.name,
            title: state.rivalEncounter.title,
            shipName: state.rivalEncounter.shipName,
            tactic: state.rivalEncounter.tactic,
            outcome:
              state.rivalEncounter.outcome === 'destroyed'
                ? ('destroyed' as const)
                : ('escaped' as const)
          }
        }
      : {})
  };
}

export function damageSetPieceComponentsInRadius(
  state: CombatState,
  x: number,
  y: number,
  radius: number,
  source: EnvironmentObjectDamageSource,
  damage: number
): number {
  if (source === 'chainReaction') {
    return 0;
  }

  const events = damageActorComponentsInRadius(
    state.setPiece,
    state.scrollDistance,
    x,
    y,
    radius,
    source,
    damage
  );
  applySetPieceRuntimeEvents(state, events);
  return events.filter((event) => event.type === 'componentDestroyed').length;
}

export function damageSetPieceComponentsInRect(
  state: CombatState,
  rect: {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
  },
  source: EnvironmentObjectDamageSource,
  damage: number
): number {
  if (source === 'chainReaction') {
    return 0;
  }

  const events = damageActorComponentsInRect(
    state.setPiece,
    state.scrollDistance,
    rect,
    source,
    damage
  );
  applySetPieceRuntimeEvents(state, events);
  return events.filter((event) => event.type === 'componentDestroyed').length;
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
      mineFuseSeconds: null,
      mineFuseDurationSeconds: 0,
      mineTriggerSource: null,
      destroyed: false
    };
  });
}

function createDebugEnvironmentObjectState(
  state: CombatState,
  definitionId: EnvironmentObjectId,
  x: number,
  y: number,
  distance: number
): EnvironmentObjectState {
  const definition = getEnvironmentObjectById(definitionId);
  const id = getNextEntityId(state);

  return {
    id,
    placementId: `debug-environment-${definition.id}-${id}`,
    definitionId: definition.id,
    kind: definition.kind,
    collisionShape: definition.collision.shape,
    x,
    y,
    width: definition.collision.width,
    height: definition.collision.height,
    radius: definition.collision.radius,
    distance,
    debugLabel: definition.debugLabel,
    hull: definition.durability.hull,
    maxHull: definition.durability.hull,
    hitFlashSeconds: 0,
    hazardCooldownSeconds: 0,
    mineFuseSeconds: null,
    mineFuseDurationSeconds: 0,
    mineTriggerSource: null,
    destroyed: false
  };
}

function updateEnvironmentObjects(state: CombatState, dt: number): void {
  const minesToDetonate: EnvironmentObjectState[] = [];

  for (const object of state.environmentObjects) {
    object.hitFlashSeconds = Math.max(0, object.hitFlashSeconds - dt);
    object.hazardCooldownSeconds = Math.max(0, object.hazardCooldownSeconds - dt);

    if (object.definitionId !== 'proximity_mine' || !isEnvironmentObjectActive(state, object)) {
      continue;
    }

    if (object.mineFuseSeconds === null && isProximityMineTriggered(state, object)) {
      armProximityMine(state, object, 'proximity');
    }

    if (object.mineFuseSeconds !== null) {
      object.mineFuseSeconds = Math.max(0, object.mineFuseSeconds - dt);
      if (object.mineFuseSeconds <= 0) {
        minesToDetonate.push(object);
      }
    }
  }

  for (const mine of minesToDetonate) {
    detonateProximityMine(state, mine);
  }
}

function isProximityMineTriggered(state: CombatState, mine: EnvironmentObjectState): boolean {
  const definition = getEnvironmentObjectById(mine.definitionId);
  const proximity = definition.proximity;

  if (!proximity) {
    return false;
  }

  const y = getEnvironmentObjectScreenY(state, mine);
  const triggerRadiusSquared = proximity.triggerRadius * proximity.triggerRadius;
  const actors: readonly Pick<PlayerState, 'x' | 'y'>[] = [
    state.player,
    ...state.enemies,
    ...state.allies.filter((ally) => ally.status === 'active'),
    ...(state.boss ? [state.boss] : [])
  ];

  return actors.some((actor) => {
    const dx = actor.x - mine.x;
    const dy = actor.y - y;
    return dx * dx + dy * dy <= triggerRadiusSquared;
  });
}

function armProximityMine(
  state: CombatState,
  mine: EnvironmentObjectState,
  source: NonNullable<EnvironmentObjectState['mineTriggerSource']>
): void {
  const proximity = getEnvironmentObjectById(mine.definitionId).proximity;

  if (!proximity || mine.destroyed) {
    return;
  }

  const fuseSeconds =
    source === 'chain'
      ? proximity.chainFuseSeconds
      : source === 'damage'
        ? proximity.damagedFuseSeconds
        : proximity.fuseSeconds;

  if (mine.mineFuseSeconds === null) {
    mine.mineFuseSeconds = fuseSeconds;
    mine.mineFuseDurationSeconds = fuseSeconds;
    mine.mineTriggerSource = source;
    state.stats = {
      ...state.stats,
      proximityMinesTriggered: state.stats.proximityMinesTriggered + 1
    };
    return;
  }

  if (fuseSeconds < mine.mineFuseSeconds) {
    mine.mineFuseSeconds = fuseSeconds;
    mine.mineFuseDurationSeconds = fuseSeconds;
    mine.mineTriggerSource = source;
  }
}

function detonateProximityMine(state: CombatState, mine: EnvironmentObjectState): void {
  if (mine.destroyed || mine.definitionId !== 'proximity_mine') {
    return;
  }

  destroyEnvironmentObject(
    state,
    mine,
    getEnvironmentObjectById(mine.definitionId),
    'chainReaction',
    {
      visitedObjectIds: new Set<number>(),
      chainBudget: createEnvironmentChainBudget()
    }
  );
  state.stats = {
    ...state.stats,
    proximityMinesDetonated: state.stats.proximityMinesDetonated + 1
  };
}

function updateSetPieceSubsystems(state: CombatState, bounds: CombatBounds): void {
  const setPiece = state.setPiece;

  if (
    !setPiece ||
    setPiece.completed ||
    state.scrollDistance < setPiece.plan.anchorDistance - 100
  ) {
    return;
  }

  for (const component of getActiveSetPieceComponents(setPiece, state.scrollDistance)) {
    if (!component.targetable || component.destroyed || component.subsystemCooldownSeconds > 0) {
      continue;
    }

    if (component.kind === 'turret') {
      fireSetPieceTurret(state, component.id);
    } else if (component.kind === 'hangar' && !component.subsystemTriggered) {
      launchSetPieceReinforcements(state, bounds, component.id);
    }
  }
}

function fireSetPieceTurret(state: CombatState, componentId: string): void {
  const setPiece = state.setPiece;
  const component = setPiece?.components.find((candidate) => candidate.id === componentId);

  if (!setPiece || !component) {
    return;
  }

  const actorProjectileCount = state.projectiles.filter(
    (projectile) => projectile.setPieceSourceId === setPiece.plan.id
  ).length;

  if (actorProjectileCount >= setPiece.plan.caps.projectiles) {
    return;
  }

  const y = getSetPieceComponentScreenY(state.scrollDistance, component);
  const dx = state.player.x - component.x;
  const dy = state.player.y - y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const speed = 215;

  state.projectiles.push({
    id: getNextEntityId(state),
    owner: 'enemy',
    x: component.x,
    y,
    vx: (dx / distance) * speed,
    vy: (dy / distance) * speed,
    radius: 6,
    damage: 1,
    ttl: 4,
    tags: ['plasma'],
    procDepth: 0,
    factionId: setPiece.ownerFactionId,
    setPieceSourceId: setPiece.plan.id
  });
  component.subsystemCooldownSeconds = 1.3 + (component.x % 5) * 0.04;
  state.stats = {
    ...state.stats,
    setPieceProjectilesFired: state.stats.setPieceProjectilesFired + 1
  };
}

function launchSetPieceReinforcements(
  state: CombatState,
  bounds: CombatBounds,
  componentId: string
): void {
  const setPiece = state.setPiece;
  const component = setPiece?.components.find((candidate) => candidate.id === componentId);

  if (!setPiece || !component || component.subsystemTriggered) {
    return;
  }

  component.subsystemTriggered = true;
  const spawns = createSetPieceReinforcementSpawns(setPiece.plan).slice(
    0,
    setPiece.plan.caps.reinforcementEnemies
  );

  for (const spawn of spawns) {
    const x = clamp(spawn.xRatio, 0.1, 0.9) * bounds.width;
    const maxHull = spawn.hull + state.enemyHullBonus;
    state.enemies.push({
      id: getNextEntityId(state),
      factionId: setPiece.ownerFactionId,
      variantId: null,
      formationId: spawn.formationId ?? null,
      formationInstanceId: spawn.formationInstanceId ?? null,
      formationLabel: spawn.formationLabel ?? null,
      formationMemberIndex: spawn.formationMemberIndex ?? null,
      formationMemberCount: spawn.formationMemberCount ?? null,
      countsForObjective: spawn.countsForObjective ?? true,
      rivalId: spawn.rivalId ?? null,
      rivalName: spawn.rivalName ?? null,
      rivalTitle: spawn.rivalTitle ?? null,
      rivalShipName: spawn.rivalShipName ?? null,
      rivalTactic: spawn.rivalTactic ?? null,
      rivalRetreatAtHullRatio: spawn.rivalRetreatAtHullRatio ?? 0,
      x,
      y: -24,
      radius: 17,
      hull: maxHull,
      maxHull,
      drift: (spawn.xRatio - 0.5) * 32,
      targetY: spawn.targetY,
      homeX: x,
      fireCooldown: Math.max(0.35, spawn.fireDelay * state.enemyFireDelayMultiplier)
    });
  }

  state.stats = {
    ...state.stats,
    setPieceReinforcementsSpawned: state.stats.setPieceReinforcementsSpawned + spawns.length
  };
}

function isEnvironmentObjectActive(state: CombatState, object: EnvironmentObjectState): boolean {
  const y = getEnvironmentObjectScreenY(state, object);
  const extent = getEnvironmentObjectVerticalExtent(object);

  return (
    !object.destroyed &&
    object.hull > 0 &&
    y >= -extent - ENVIRONMENT_OBJECT_LEAD_DISTANCE &&
    y <= COMBAT_ARENA_HEIGHT + extent + ENVIRONMENT_OBJECT_TRAIL_DISTANCE
  );
}

function isEnvironmentObjectExpired(state: CombatState, object: EnvironmentObjectState): boolean {
  const y = getEnvironmentObjectScreenY(state, object);
  const extent = getEnvironmentObjectVerticalExtent(object);

  return (
    object.destroyed ||
    object.hull <= 0 ||
    y > COMBAT_ARENA_HEIGHT + extent + ENVIRONMENT_OBJECT_TRAIL_DISTANCE
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

  if (
    definition.proximity &&
    (source === 'bomb' || source === 'special' || source === 'chainReaction')
  ) {
    armProximityMine(state, object, source === 'chainReaction' ? 'chain' : 'damage');
  }

  if (object.hull > 0) {
    addEnvironmentEffect(state, 'environmentHit', object, getEnvironmentObjectEffectRadius(object));
    return true;
  }

  if (definition.proximity) {
    object.hull = 0.1;
    armProximityMine(state, object, source === 'chainReaction' ? 'chain' : 'damage');
    addEnvironmentEffect(state, 'environmentHit', object, definition.proximity.triggerRadius);
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
  const hookReport = applyCombatHooksWithReport(state, 'onEnvironmentObjectDestroyed', {
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
    salvage:
      hookReport.payload.rewardSalvage + Math.max(0, Math.floor(hookReport.payload.bonusSalvage))
  };
  const droppedPickups = spawnEnvironmentObjectRewardPickups(state, object, reward);

  addEnvironmentEffect(
    state,
    'environmentBreak',
    object,
    getEnvironmentObjectEffectRadius(object) * 1.45
  );
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
  return spawnLooseCurrencySpecs(
    state,
    createLooseCurrencyScatter({
      seed: state.seed,
      sourceId: object.placementId,
      source: 'destructible',
      x: object.x,
      y: getEnvironmentObjectScreenY(state, object),
      worldDistance: state.scrollDistance,
      credits: reward.credits,
      salvage: reward.salvage,
      maxPickups: MAX_ENVIRONMENT_REWARD_PICKUPS,
      debugLabel: object.debugLabel
    })
  );
}

function applySetPieceRuntimeEvents(
  state: CombatState,
  events: readonly SetPieceRuntimeEvent[]
): void {
  const setPiece = state.setPiece;

  if (!setPiece || events.length === 0) {
    return;
  }

  let droppedPickups = 0;

  for (const event of events) {
    const screenY = event.y + state.scrollDistance - setPiece.plan.anchorDistance;
    const rewards = [
      { kind: 'credits' as const, value: event.credits },
      { kind: 'salvage' as const, value: event.salvage }
    ];

    for (const reward of rewards) {
      const remainingPickupBudget = Math.max(
        0,
        setPiece.plan.caps.rewardPickups - state.stats.setPieceRewardsDropped - droppedPickups
      );

      if (reward.value <= 0 || remainingPickupBudget <= 0) {
        continue;
      }

      droppedPickups += spawnLooseCurrencySpecs(
        state,
        createLooseCurrencyScatter({
          seed: state.seed,
          sourceId: `${event.id}:${reward.kind}`,
          source: 'destructible',
          x: event.x,
          y: screenY,
          worldDistance: state.scrollDistance,
          credits: reward.kind === 'credits' ? reward.value : 0,
          salvage: reward.kind === 'salvage' ? reward.value : 0,
          maxPickups: 1,
          debugLabel: event.label
        })
      );
    }

    if (state.effects.length < MAX_ENVIRONMENT_FEEDBACK_EFFECTS) {
      state.effects.push({
        id: getNextEntityId(state),
        kind: event.type === 'componentDestroyed' ? 'environmentBreak' : 'chainReaction',
        x: event.x,
        y: screenY,
        radius:
          event.type === 'setPieceCompleted' ? 108 : event.type === 'stageCompleted' ? 72 : 48,
        ttl: event.type === 'setPieceCompleted' ? 0.58 : 0.3,
        maxTtl: event.type === 'setPieceCompleted' ? 0.58 : 0.3
      });
    }
  }

  state.stats = {
    ...state.stats,
    environmentObjectsDestroyed:
      state.stats.environmentObjectsDestroyed +
      events.filter((event) => event.type === 'componentDestroyed').length,
    setPieceComponentsDestroyed:
      state.stats.setPieceComponentsDestroyed +
      events.filter((event) => event.type === 'componentDestroyed').length,
    setPieceStagesCompleted:
      state.stats.setPieceStagesCompleted +
      events.filter((event) => event.type === 'stageCompleted').length,
    setPiecesCompleted:
      state.stats.setPiecesCompleted +
      events.filter((event) => event.type === 'setPieceCompleted').length,
    setPieceRewardsDropped: state.stats.setPieceRewardsDropped + droppedPickups
  };
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

  if (definition.proximity) {
    applyProximityMineBlast(state, object, definition);
  }

  const maxTargets = Math.max(0, Math.floor(definition.chain.maxTargets));
  const targets = getActiveEnvironmentObjects(state)
    .filter(
      (candidate) => candidate.id !== object.id && !options.visitedObjectIds.has(candidate.id)
    )
    .filter(
      (candidate) =>
        getEnvironmentObjectDistanceSquared(state, object, candidate) <=
        definition.chain.radius * definition.chain.radius
    )
    .sort(
      (left, right) =>
        getEnvironmentObjectDistanceSquared(state, object, left) -
        getEnvironmentObjectDistanceSquared(state, object, right)
    )
    .slice(0, maxTargets);

  for (const target of targets) {
    if (options.chainBudget.remaining <= 0) {
      break;
    }

    damageEnvironmentObject(state, target, 'chainReaction', definition.chain.damage, options);
  }
}

function applyProximityMineBlast(
  state: CombatState,
  mine: EnvironmentObjectState,
  definition: EnvironmentObjectDefinition
): void {
  const proximity = definition.proximity;

  if (!proximity) {
    return;
  }

  const center = { x: mine.x, y: getEnvironmentObjectScreenY(state, mine) };
  const radiusSquared = proximity.blastRadius * proximity.blastRadius;
  const overlapsBlast = (actor: { readonly x: number; readonly y: number }): boolean => {
    const dx = actor.x - center.x;
    const dy = actor.y - center.y;
    return dx * dx + dy * dy <= radiusSquared;
  };

  if (overlapsBlast(state.player)) {
    damagePlayer(state, proximity.blastDamage);
  }

  const enemyIdsToRemove = new Set<number>();
  let enemyHits = 0;

  for (const enemy of state.enemies) {
    if (!overlapsBlast(enemy)) {
      continue;
    }

    enemyHits += 1;
    enemy.hull = applyDamage(enemy.hull, proximity.blastDamage).hull;
    if (enemy.hull <= 0) {
      recordEnemyDefeat(state, enemy, enemyIdsToRemove);
    }
  }

  if (enemyIdsToRemove.size > 0) {
    state.enemies = state.enemies.filter((enemy) => !enemyIdsToRemove.has(enemy.id));
  }

  const boss = state.boss;
  if (boss && overlapsBlast(boss)) {
    enemyHits += 1;
    boss.hull = applyDamage(boss.hull, proximity.blastDamage).hull;
    if (boss.hull > 0) {
      refreshBossPhase(state, boss);
    } else {
      spawnBossDefeatPickups(state, boss, 0);
      state.boss = null;
      state.telegraphs = [];
      state.stats = {
        ...state.stats,
        enemiesDestroyed: state.stats.enemiesDestroyed + 1,
        bossesDefeated: state.stats.bossesDefeated + 1
      };
      gainSpecialCharge(state, SPECIAL_CHARGE_PER_BOSS);
    }
  }

  for (const ally of state.allies) {
    if (ally.status === 'active' && overlapsBlast(ally)) {
      damageAlly(state, ally, proximity.blastDamage);
    }
  }

  damageSetPieceComponentsInRadius(
    state,
    center.x,
    center.y,
    proximity.blastRadius,
    'hazard',
    proximity.blastDamage
  );
  state.stats = {
    ...state.stats,
    proximityMineEnemyHits: state.stats.proximityMineEnemyHits + enemyHits
  };
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
    y: getEnvironmentObjectScreenY(state, object),
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
  state: Pick<CombatState, 'scrollDistance'>,
  object: EnvironmentObjectState,
  x: number,
  y: number,
  radius: number
): boolean {
  const objectY = getEnvironmentObjectScreenY(state, object);

  if (object.collisionShape === 'circle') {
    return circlesOverlap({ x: object.x, y: objectY, radius: object.radius }, { x, y, radius });
  }

  const rect = getEnvironmentObjectRect(state, object);
  const nearestX = clamp(x, rect.left, rect.right);
  const nearestY = clamp(y, rect.top, rect.bottom);
  const dx = x - nearestX;
  const dy = y - nearestY;

  return dx * dx + dy * dy <= radius * radius;
}

function environmentObjectOverlapsRect(
  state: Pick<CombatState, 'scrollDistance'>,
  object: EnvironmentObjectState,
  rect: {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
  }
): boolean {
  const objectRect = getEnvironmentObjectRect(state, object);

  return (
    objectRect.left <= rect.right &&
    objectRect.right >= rect.left &&
    objectRect.top <= rect.bottom &&
    objectRect.bottom >= rect.top
  );
}

function getEnvironmentObjectRect(
  state: Pick<CombatState, 'scrollDistance'>,
  object: EnvironmentObjectState
): {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
} {
  const y = getEnvironmentObjectScreenY(state, object);

  if (object.collisionShape === 'circle') {
    return {
      left: object.x - object.radius,
      top: y - object.radius,
      right: object.x + object.radius,
      bottom: y + object.radius
    };
  }

  return {
    left: object.x - object.width / 2,
    top: y - object.height / 2,
    right: object.x + object.width / 2,
    bottom: y + object.height / 2
  };
}

function getEnvironmentObjectVerticalExtent(object: EnvironmentObjectState): number {
  return object.collisionShape === 'circle' ? object.radius : object.height / 2;
}

function getEnvironmentObjectDistanceSquared(
  state: Pick<CombatState, 'scrollDistance'>,
  left: EnvironmentObjectState,
  right: EnvironmentObjectState
): number {
  const dx = left.x - right.x;
  const dy = getEnvironmentObjectScreenY(state, left) - getEnvironmentObjectScreenY(state, right);

  return dx * dx + dy * dy;
}

function resolveEnvironmentObjectPlayerCollision(
  state: CombatState,
  safeFrame: CombatSafeFrame
): void {
  for (const object of getActiveEnvironmentObjects(state)) {
    const definition = getEnvironmentObjectById(object.definitionId);

    if (!definition.collision.blocksMovement) {
      continue;
    }

    const collided =
      object.collisionShape === 'circle'
        ? pushPlayerOutOfCircleObject(state, object, safeFrame)
        : pushPlayerOutOfRectObject(state, object, safeFrame);

    if (collided && definition.damageInteraction.contactDamage > 0) {
      damagePlayer(state, definition.damageInteraction.contactDamage);
    }
  }
}

function resolveSetPiecePlayerCollision(state: CombatState, safeFrame: CombatSafeFrame): void {
  const setPiece = state.setPiece;

  if (!setPiece) {
    return;
  }

  const safeLaneCenter = (setPiece.plan.safeLane.minX + setPiece.plan.safeLane.maxX) / 2;

  for (const component of getActiveSetPieceComponents(setPiece, state.scrollDistance)) {
    if (
      !component.blocksMovement ||
      !setPieceComponentOverlapsCircle(
        state.scrollDistance,
        component,
        state.player.x,
        state.player.y,
        state.player.radius
      )
    ) {
      continue;
    }

    const rect = getSetPieceComponentRect(state.scrollDistance, component);
    const pushX =
      safeLaneCenter < component.x
        ? rect.left - state.player.radius - ENVIRONMENT_CONTACT_PUSH_EPSILON
        : rect.right + state.player.radius + ENVIRONMENT_CONTACT_PUSH_EPSILON;
    state.player.x = clamp(
      pushX,
      safeFrame.x + state.player.radius,
      safeFrame.x + safeFrame.width - state.player.radius
    );

    if (component.contactDamage > 0) {
      damagePlayer(state, component.contactDamage);
    }
  }
}

function pushPlayerOutOfCircleObject(
  state: CombatState,
  object: EnvironmentObjectState,
  safeFrame: CombatSafeFrame
): boolean {
  const { player } = state;
  const radiusSum = player.radius + object.radius;
  const dx = player.x - object.x;
  const dy = player.y - getEnvironmentObjectScreenY(state, object);
  const distanceSquared = dx * dx + dy * dy;

  if (distanceSquared > radiusSum * radiusSum) {
    return false;
  }

  const distance = Math.sqrt(distanceSquared);
  const direction =
    distance > 0.001
      ? { x: dx / distance, y: dy / distance }
      : { x: player.x < safeFrame.x + safeFrame.width / 2 ? -1 : 1, y: 0 };
  const pushDistance =
    (distance > 0.001 ? radiusSum - distance : radiusSum) + ENVIRONMENT_CONTACT_PUSH_EPSILON;

  player.x = clamp(
    player.x + direction.x * pushDistance,
    safeFrame.x + player.radius,
    safeFrame.x + safeFrame.width - player.radius
  );
  player.y = clamp(
    player.y + direction.y * pushDistance,
    safeFrame.y + player.radius,
    safeFrame.y + safeFrame.height - player.radius
  );

  return true;
}

function pushPlayerOutOfRectObject(
  state: CombatState,
  object: EnvironmentObjectState,
  safeFrame: CombatSafeFrame
): boolean {
  const { player } = state;
  const rect = getEnvironmentObjectRect(state, object);
  const nearestX = clamp(player.x, rect.left, rect.right);
  const nearestY = clamp(player.y, rect.top, rect.bottom);
  const dx = player.x - nearestX;
  const dy = player.y - nearestY;
  const distanceSquared = dx * dx + dy * dy;

  if (distanceSquared > player.radius * player.radius) {
    return false;
  }

  if (distanceSquared > 0.001) {
    const distance = Math.sqrt(distanceSquared);
    const pushDistance = player.radius - distance + ENVIRONMENT_CONTACT_PUSH_EPSILON;

    player.x = clamp(
      player.x + (dx / distance) * pushDistance,
      safeFrame.x + player.radius,
      safeFrame.x + safeFrame.width - player.radius
    );
    player.y = clamp(
      player.y + (dy / distance) * pushDistance,
      safeFrame.y + player.radius,
      safeFrame.y + safeFrame.height - player.radius
    );

    return true;
  }

  const pushes = [
    { axis: 'x' as const, value: rect.left - player.radius - ENVIRONMENT_CONTACT_PUSH_EPSILON },
    { axis: 'x' as const, value: rect.right + player.radius + ENVIRONMENT_CONTACT_PUSH_EPSILON },
    { axis: 'y' as const, value: rect.top - player.radius - ENVIRONMENT_CONTACT_PUSH_EPSILON },
    { axis: 'y' as const, value: rect.bottom + player.radius + ENVIRONMENT_CONTACT_PUSH_EPSILON }
  ].sort(
    (left, right) =>
      getSafePushDistance(player, left, safeFrame) - getSafePushDistance(player, right, safeFrame)
  );
  const push = pushes.find((candidate) => canApplySafePush(player, candidate, safeFrame));

  if (!push) {
    return false;
  }

  if (push.axis === 'x') {
    player.x = clamp(
      push.value,
      safeFrame.x + player.radius,
      safeFrame.x + safeFrame.width - player.radius
    );
  } else {
    player.y = clamp(
      push.value,
      safeFrame.y + player.radius,
      safeFrame.y + safeFrame.height - player.radius
    );
  }

  return true;
}

function canApplySafePush(
  player: PlayerState,
  push: { readonly axis: 'x' | 'y'; readonly value: number },
  safeFrame: CombatSafeFrame
): boolean {
  if (push.axis === 'x') {
    return (
      push.value >= safeFrame.x + player.radius &&
      push.value <= safeFrame.x + safeFrame.width - player.radius
    );
  }

  return (
    push.value >= safeFrame.y + player.radius &&
    push.value <= safeFrame.y + safeFrame.height - player.radius
  );
}

function getSafePushDistance(
  player: PlayerState,
  push: { readonly axis: 'x' | 'y'; readonly value: number },
  safeFrame: CombatSafeFrame
): number {
  if (!canApplySafePush(player, push, safeFrame)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.abs((push.axis === 'x' ? player.x : player.y) - push.value);
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
  resolveEnvironmentObjectPlayerCollision(state, safeFrame);
  resolveSetPiecePlayerCollision(state, safeFrame);
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

    const firePayload = applyCombatHooks(state, 'onFire', {
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
  const payload = applyCombatHooks(state, 'onSectorStart', {
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
  const engineeringMultiplier = state.engineering?.effects.heatPerShotMultiplier ?? 1;
  state.player.weaponHeat = clamp(
    state.player.weaponHeat + state.weapon.heatPerShot * heatMultiplier * engineeringMultiplier,
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
  const engineeringMultiplier = state.engineering?.effects.heatVentMultiplier ?? 1;
  state.player.weaponHeat = Math.max(
    0,
    state.player.weaponHeat -
      state.weapon.heatVentPerSecond * ventMultiplier * engineeringMultiplier * dt
  );
}

function activateSpecial(state: CombatState): void {
  const { player } = state;

  if (player.specialCharge < player.maxSpecialCharge || player.specialCooldown > 0) {
    return;
  }

  const specialPayload = applyCombatHooks(state, 'onSpecialUsed', {
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
  const bombPayload = applyCombatHooks(state, 'onBombUsed', {
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
  damageSetPieceComponentsInRadius(
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
    const spawnPayload = applyCombatHooks(state, 'onProjectileSpawn', { projectile });
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
      countsForObjective: spawn.countsForObjective ?? true,
      rivalId: spawn.rivalId ?? null,
      rivalName: spawn.rivalName ?? null,
      rivalTitle: spawn.rivalTitle ?? null,
      rivalShipName: spawn.rivalShipName ?? null,
      rivalTactic: spawn.rivalTactic ?? null,
      rivalRetreatAtHullRatio: spawn.rivalRetreatAtHullRatio ?? 0,
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
    if (
      spawn.rivalId &&
      spawn.rivalName &&
      spawn.rivalTitle &&
      spawn.rivalShipName &&
      spawn.rivalTactic
    ) {
      state.rivalEncounter = {
        rivalId: spawn.rivalId,
        name: spawn.rivalName,
        title: spawn.rivalTitle,
        shipName: spawn.rivalShipName,
        tactic: spawn.rivalTactic,
        outcome: 'engaged'
      };
    }
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

function updateAllies(state: CombatState, dt: number, bounds: CombatBounds): void {
  state.crewCommand.cooldownSeconds = Math.max(0, state.crewCommand.cooldownSeconds - dt);
  const command = state.crewCommand.active;
  const activeAllies = state.allies.filter((ally) => ally.status === 'active');

  for (let index = 0; index < activeAllies.length; index += 1) {
    const ally = activeAllies[index]!;
    ally.fireCooldown = Math.max(0, ally.fireCooldown - dt);
    ally.screenCooldown = Math.max(0, ally.screenCooldown - dt);

    if (command === 'disengage') {
      ally.y += ally.moveSpeed * 1.3 * dt;
      if (ally.y > bounds.height + ally.radius) {
        ally.status = 'retreated';
        state.stats = {
          ...state.stats,
          allyRetreats: state.stats.allyRetreats + 1
        };
      }
      continue;
    }

    const desired = getAllyDesiredPosition(state, ally, index, activeAllies.length, bounds);
    moveAllyToward(ally, desired, dt, bounds);

    if (command === 'screen') {
      screenProjectileForAlly(state, ally);
      continue;
    }

    if (command === 'salvage') {
      collectPickupForAlly(state, ally);
      continue;
    }

    if (command === 'regroup') {
      if (ally.screenCooldown <= 0 && ally.hull < ally.maxHull) {
        ally.hull += 1;
        ally.screenCooldown = ally.preferredCommand === 'regroup' ? 1.4 : 2.2;
      }
      continue;
    }

    fireAllyAtTarget(state, ally);
  }
}

function getAllyDesiredPosition(
  state: CombatState,
  ally: AllyState,
  index: number,
  count: number,
  bounds: CombatBounds
): Vector2 {
  if (state.crewCommand.active === 'salvage') {
    const pickup = state.pickups.slice(0, 24).reduce<PickupState | null>((nearest, candidate) => {
      if (!nearest) return candidate;
      return getDistanceSquared(candidate, ally) < getDistanceSquared(nearest, ally)
        ? candidate
        : nearest;
    }, null);
    if (pickup) return pickup;
  }
  const spacing = state.crewCommand.active === 'regroup' ? 30 : 58;
  const yOffset = state.crewCommand.active === 'screen' ? -78 : 38;
  return {
    x: clamp(
      state.player.x + (index - (count - 1) / 2) * spacing,
      bounds.padding,
      bounds.width - bounds.padding
    ),
    y: clamp(state.player.y + yOffset, bounds.padding, bounds.height - bounds.padding)
  };
}

function moveAllyToward(ally: AllyState, target: Vector2, dt: number, bounds: CombatBounds): void {
  const dx = target.x - ally.x;
  const dy = target.y - ally.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= 0.5) return;
  const step = Math.min(distance, ally.moveSpeed * dt);
  ally.x = clamp(ally.x + (dx / distance) * step, bounds.padding, bounds.width - bounds.padding);
  ally.y = clamp(ally.y + (dy / distance) * step, bounds.padding, bounds.height - bounds.padding);
}

function screenProjectileForAlly(state: CombatState, ally: AllyState): void {
  if (ally.screenCooldown > 0) return;
  const radius = ally.preferredCommand === 'screen' ? 92 : 66;
  const projectile = state.projectiles
    .slice(0, 32)
    .find(
      (candidate) =>
        candidate.owner === 'enemy' && getDistanceSquared(candidate, ally) <= radius * radius
    );
  if (!projectile) return;
  state.projectiles = state.projectiles.filter((candidate) => candidate.id !== projectile.id);
  ally.screenCooldown = ally.preferredCommand === 'screen' ? 0.32 : 0.55;
  state.stats = {
    ...state.stats,
    enemyProjectilesCancelled: state.stats.enemyProjectilesCancelled + 1,
    allyProjectilesScreened: state.stats.allyProjectilesScreened + 1
  };
}

function collectPickupForAlly(state: CombatState, ally: AllyState): void {
  const range = ally.preferredCommand === 'salvage' ? 38 : 26;
  const pickup = state.pickups
    .slice(0, 24)
    .find((candidate) => getDistanceSquared(candidate, ally) <= range * range);
  if (!pickup) return;
  state.pickups = state.pickups.filter((candidate) => candidate.id !== pickup.id);
  if (pickup.kind === 'credit') state.player.credits += pickup.value;
  else state.player.salvage += pickup.value;
  ally.salvageRecovered += pickup.value;
  state.stats = {
    ...state.stats,
    pickupsCollected: state.stats.pickupsCollected + 1,
    looseCurrencyCollected: state.stats.looseCurrencyCollected + pickup.value,
    allySalvageCollected: state.stats.allySalvageCollected + pickup.value
  };
}

function fireAllyAtTarget(state: CombatState, ally: AllyState): void {
  if (ally.fireCooldown > 0) return;
  if (state.projectiles.filter((projectile) => projectile.owner === 'ally').length >= MAX_COMBINED_ALLY_PROJECTILES) return;
  const target =
    state.enemies.slice(0, 24).reduce<EnemyState | null>((nearest, candidate) => {
      if (!nearest) return candidate;
      return getDistanceSquared(candidate, ally) < getDistanceSquared(nearest, ally)
        ? candidate
        : nearest;
    }, null) ?? state.boss;
  if (!target) return;
  const dx = target.x - ally.x;
  const dy = target.y - ally.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  state.projectiles.push({
    id: getNextEntityId(state),
    owner: 'ally',
    allyId: ally.candidateId,
    x: ally.x,
    y: ally.y - ally.radius,
    vx: (dx / distance) * 430,
    vy: (dy / distance) * 430,
    radius: 3.5,
    damage: ally.projectileDamage,
    ttl: 2.2,
    tags: ['drone'],
    procDepth: 0,
    environmentDamageSource: 'weapon'
  });
  ally.fireCooldown = ally.fireCooldownSeconds * (ally.preferredCommand === 'focus' ? 0.72 : 1);
  state.stats = {
    ...state.stats,
    allyProjectilesFired: state.stats.allyProjectilesFired + 1
  };
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

  const phasePayload = applyCombatHooks(state, 'onBossPhaseChanged', {
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
    if (pickup.worldDistance !== undefined) {
      const scrollDelta =
        state.scrollDistance - (pickup.scrollDistanceLastFrame ?? state.scrollDistance);
      pickup.y += scrollDelta;
      pickup.scrollDistanceLastFrame = state.scrollDistance;
    }

    if (pickup.ttl !== undefined) {
      pickup.ttl -= dt;
    }

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
    const nextY = pickup.y + pickup.vy * dt;
    pickup.y =
      pickup.worldDistance === undefined
        ? clamp(nextY, bounds.padding, bounds.height - bounds.padding)
        : nextY;
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
    const grazePayload = applyCombatHooks(state, 'onGraze', {
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
    if (projectile.owner === 'ally') {
      for (const enemy of state.enemies) {
        if (enemyIdsToRemove.has(enemy.id) || !circlesOverlap(projectile, enemy)) continue;
        damageEnemyWithAllyProjectile(state, enemy, projectile, enemyIdsToRemove);
        projectileIdsToRemove.add(projectile.id);
        break;
      }
      const boss = state.boss;
      if (boss && !projectileIdsToRemove.has(projectile.id) && circlesOverlap(projectile, boss)) {
        damageBossWithAllyProjectile(state, boss, projectile);
        projectileIdsToRemove.add(projectile.id);
      }
    }

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
        for (const component of getActiveSetPieceComponents(state.setPiece, state.scrollDistance)) {
          if (
            !setPieceComponentOverlapsCircle(
              state.scrollDistance,
              component,
              projectile.x,
              projectile.y,
              projectile.radius
            )
          ) {
            continue;
          }

          if (state.setPiece) {
            applySetPieceRuntimeEvents(
              state,
              damageSetPieceComponent(
                state.setPiece,
                component.id,
                projectile.environmentDamageSource === 'special' ? 'special' : 'weapon',
                projectile.damage
              )
            );
          }
          projectileIdsToRemove.add(projectile.id);
          break;
        }
      }

      if (!projectileIdsToRemove.has(projectile.id)) {
        for (const object of getActiveEnvironmentObjects(state)) {
          if (
            !environmentObjectOverlapsCircle(
              state,
              object,
              projectile.x,
              projectile.y,
              projectile.radius
            )
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

    if (projectile.owner === 'enemy') {
      const ally = state.allies.find(
        (candidate) => candidate.status === 'active' && circlesOverlap(projectile, candidate)
      );
      if (ally) {
        projectileIdsToRemove.add(projectile.id);
        damageAlly(state, ally, projectile.damage);
      } else if (circlesOverlap(projectile, state.player)) {
        projectileIdsToRemove.add(projectile.id);
        damagePlayer(state, projectile.damage);
      }
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
    if (pickup.ttl !== undefined && pickup.ttl <= 0) {
      continue;
    }

    const collectionRadius = pickup.collectionRadius ?? pickup.radius;
    const collectionDistance = collectionRadius + state.player.radius;

    if (getDistanceSquared(pickup, state.player) > collectionDistance * collectionDistance) {
      continue;
    }

    pickupIdsToRemove.add(pickup.id);

    if (pickup.kind === 'credit') {
      state.player.credits += pickup.value;
    } else {
      state.player.salvage += pickup.value;
    }

    const pickupPayload = applyCombatHooks(state, 'onPickupCollected', {
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
      looseCurrencyCollected: state.stats.looseCurrencyCollected + pickup.value,
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

  if (
    enemy.rivalId &&
    (enemy.rivalRetreatAtHullRatio ?? 0) > 0 &&
    enemy.hull / Math.max(1, enemy.maxHull) <= (enemy.rivalRetreatAtHullRatio ?? 0)
  ) {
    recordRivalEscape(state, enemy, enemyIdsToRemove);
    return;
  }

  if (enemy.hull > 0) {
    return;
  }

  if (enemy.rivalId) {
    recordEnemyDefeat(state, enemy, enemyIdsToRemove, {
      dropPickups: false,
      grantSpecialCharge: false
    });
    return;
  }

  const killPayload = applyCombatHooks(state, 'onEnemyKilled', {
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

function damageEnemyWithAllyProjectile(
  state: CombatState,
  enemy: EnemyState,
  projectile: ProjectileState,
  enemyIdsToRemove: Set<number>
): void {
  enemy.hull = applyDamage(enemy.hull, projectile.damage).hull;
  if (enemy.hull > 0) return;
  recordEnemyDefeat(state, enemy, enemyIdsToRemove, {
    dropPickups: !enemy.rivalId,
    grantSpecialCharge: false
  });
  if (!enemy.rivalId) recordAllyDefeat(state, projectile.allyId);
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

  const killPayload = applyCombatHooks(state, 'onEnemyKilled', {
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

function damageBossWithAllyProjectile(
  state: CombatState,
  boss: BossState,
  projectile: ProjectileState
): void {
  boss.hull = applyDamage(boss.hull, projectile.damage).hull;
  if (boss.hull > 0) {
    refreshBossPhase(state, boss);
    return;
  }
  spawnBossDefeatPickups(state, boss, 0);
  state.boss = null;
  state.telegraphs = [];
  state.stats = {
    ...state.stats,
    enemiesDestroyed: state.stats.enemiesDestroyed + 1,
    bossesDefeated: state.stats.bossesDefeated + 1,
    allyEnemiesDestroyed: state.stats.allyEnemiesDestroyed + 1
  };
  const ally = state.allies.find((candidate) => candidate.candidateId === projectile.allyId);
  if (ally) ally.enemiesDefeated += 1;
  gainSpecialCharge(state, SPECIAL_CHARGE_PER_BOSS);
}

function damageAlly(state: CombatState, ally: AllyState, damage: number): void {
  ally.hull = applyDamage(ally.hull, Math.max(1, damage)).hull;
  if (ally.hull > 0 || ally.status !== 'active') return;
  ally.status = 'injured';
  state.stats = {
    ...state.stats,
    allyInjuries: state.stats.allyInjuries + 1
  };
}

function recordAllyDefeat(state: CombatState, allyId: string | undefined): void {
  if (!allyId) return;
  const ally = state.allies.find((candidate) => candidate.candidateId === allyId);
  if (!ally) return;
  ally.enemiesDefeated += 1;
  state.stats = {
    ...state.stats,
    allyEnemiesDestroyed: state.stats.allyEnemiesDestroyed + 1
  };
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
      recordEnemyEscape(state, enemy, despawnedEnemyIds);
    }
  }

  if (despawnedEnemyIds.size > 0) {
    state.enemies = state.enemies.filter((enemy) => !despawnedEnemyIds.has(enemy.id));
  }

  state.environmentObjects = state.environmentObjects.filter(
    (object) => !isEnvironmentObjectExpired(state, object)
  );
  expireLooseCurrencyPickups(state, bounds);
  state.telegraphs = state.telegraphs.filter((telegraph) => telegraph.ttl > 0);
  state.effects = state.effects.filter((effect) => effect.ttl > 0);

  const activeProjectileIds = new Set(state.projectiles.map((projectile) => projectile.id));

  for (const projectileId of state.grazedProjectileIds) {
    if (!activeProjectileIds.has(projectileId)) {
      state.grazedProjectileIds.delete(projectileId);
    }
  }
}

function spawnDueLooseCurrency(state: CombatState, bounds: CombatBounds): void {
  const plan = state.looseCurrencyPlan;

  if (!plan) {
    return;
  }

  while (state.nextLooseCurrencyIndex < plan.events.length) {
    const event = plan.events[state.nextLooseCurrencyIndex];

    if (
      !event ||
      event.distance - LOOSE_CURRENCY_SCROLL_SPAWN_LEAD_DISTANCE > state.scrollDistance
    ) {
      break;
    }

    state.nextLooseCurrencyIndex += 1;
    spawnLooseCurrencySpecs(
      state,
      createLooseCurrencyScatter({
        seed: plan.seed,
        sourceId: event.id,
        source: event.source,
        x: clamp(event.xRatio, 0, 1) * bounds.width,
        y: bounds.padding + 72,
        worldDistance: event.distance,
        credits: event.credits,
        salvage: event.salvage,
        maxPickups: 3,
        spread: event.spread,
        baseVy: event.baseVy,
        debugLabel: event.label
      })
    );
  }
}

function spawnLooseCurrencySpecs(
  state: CombatState,
  specs: readonly LooseCurrencyPickupSpec[]
): number {
  const activeSummary = summarizeLooseCurrencyPickups(state.pickups);
  let activePickups = activeSummary.activePickups;
  let activeValue = activeSummary.activeValue;
  let spawnedCount = 0;
  let spawnedValue = 0;
  let suppressedValue = 0;

  for (const spec of specs) {
    const value = Math.max(0, Math.floor(spec.value));

    if (value <= 0) {
      continue;
    }

    if (
      activePickups >= LOOSE_CURRENCY_ACTIVE_PICKUP_CAP ||
      activeValue + value > LOOSE_CURRENCY_ACTIVE_VALUE_CAP
    ) {
      suppressedValue += value;
      continue;
    }

    state.pickups.push({
      id: getNextEntityId(state),
      ...spec,
      y:
        spec.worldDistance === undefined
          ? spec.y
          : spec.y + state.scrollDistance - spec.worldDistance,
      scrollDistanceLastFrame: spec.worldDistance === undefined ? undefined : state.scrollDistance,
      value
    });
    activePickups += 1;
    activeValue += value;
    spawnedCount += 1;
    spawnedValue += value;
  }

  if (spawnedValue > 0 || suppressedValue > 0) {
    state.stats = {
      ...state.stats,
      looseCurrencySpawned: state.stats.looseCurrencySpawned + spawnedValue,
      looseCurrencySuppressedValue: state.stats.looseCurrencySuppressedValue + suppressedValue
    };
  }

  return spawnedCount;
}

function expireLooseCurrencyPickups(state: CombatState, bounds: CombatBounds): void {
  let expiredValue = 0;

  state.pickups = state.pickups.filter((pickup) => {
    const hasLifetimeRemaining = pickup.ttl === undefined || pickup.ttl > 0;
    const hasScrolledPastField =
      pickup.worldDistance !== undefined && pickup.y > bounds.height + pickup.radius + 96;

    if (hasLifetimeRemaining && !hasScrolledPastField) {
      return true;
    }

    expiredValue += Math.max(0, Math.floor(pickup.value));
    return false;
  });

  if (expiredValue > 0) {
    state.stats = {
      ...state.stats,
      looseCurrencyExpired: state.stats.looseCurrencyExpired + expiredValue
    };
  }
}

function damagePlayer(state: CombatState, damage: number): void {
  if (state.player.invulnerableSeconds > 0) {
    return;
  }

  const adjustedDamage = damage * (state.engineering?.effects.damageTakenMultiplier ?? 1);
  const outcome = applyDamage(state.player.hull, adjustedDamage);
  state.player.hull = outcome.hull;
  state.player.invulnerableSeconds = PLAYER_DAMAGE_INVULNERABILITY_SECONDS;

  const hitPayload = applyCombatHooks(state, 'onPlayerHit', {
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

function applyCombatHooks<THook extends ItemHookName>(
  state: CombatState,
  hook: THook,
  payload: ItemHookPayloadByName[THook]
): ItemHookPayloadByName[THook] {
  return applyCombatHooksWithReport(state, hook, payload).payload;
}

function applyCombatHooksWithReport<THook extends ItemHookName>(
  state: CombatState,
  hook: THook,
  payload: ItemHookPayloadByName[THook]
): CombinedHookDispatchReport<THook> {
  const report = applyCombinedHooksWithReport(
    hook,
    state.items,
    state.engineering?.hooks ?? [],
    payload,
    { maxApplications: state.engineering?.procBudget ?? BASE_COMBINED_PROC_BUDGET }
  );
  const applicationCount = report.appliedSources.length;
  state.procTelemetry = {
    budget: report.maxApplications,
    totalApplied: state.procTelemetry.totalApplied + applicationCount,
    totalSkipped: state.procTelemetry.totalSkipped + report.skippedSources.length,
    peakHook:
      applicationCount > state.procTelemetry.peakApplications ? hook : state.procTelemetry.peakHook,
    peakApplications: Math.max(state.procTelemetry.peakApplications, applicationCount),
    lastOrder:
      applicationCount > 0
        ? report.appliedSources.map((source) => `${source.kind}:${source.sourceId}`)
        : state.procTelemetry.lastOrder
  };
  return report;
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
  spawnLooseCurrencySpecs(
    state,
    createLooseCurrencyScatter({
      seed: state.seed,
      sourceId: `enemy-${enemy.factionId}-${enemy.variantId ?? 'base'}-${enemy.id}`,
      source: 'enemy',
      x: enemy.x,
      y: enemy.y,
      worldDistance: state.scrollDistance,
      credits: 2,
      salvage: 1 + Math.max(0, Math.floor(bonusSalvage)),
      maxPickups: bonusSalvage > 0 ? 3 : 2,
      debugLabel: enemy.formationLabel ?? enemy.variantId ?? enemy.factionId
    })
  );
}

function spawnBossDefeatPickups(state: CombatState, boss: BossState, bonusSalvage: number): void {
  spawnLooseCurrencySpecs(
    state,
    createLooseCurrencyScatter({
      seed: state.seed,
      sourceId: `boss-${boss.id}`,
      source: 'boss',
      x: boss.x,
      y: boss.y + boss.radius * 0.5,
      worldDistance: state.scrollDistance,
      credits: 12,
      salvage: 4 + Math.max(0, Math.floor(bonusSalvage)),
      maxPickups: 5,
      debugLabel: boss.name
    })
  );
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

  if (enemy.rivalId) {
    if (state.rivalEncounter?.rivalId === enemy.rivalId) {
      state.rivalEncounter.outcome = 'destroyed';
    }
    state.stats = {
      ...state.stats,
      rivalsDestroyed: state.stats.rivalsDestroyed + 1
    };
    return true;
  }

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

function recordEnemyEscape(
  state: CombatState,
  enemy: EnemyState,
  enemyIdsToRemove: Set<number>
): boolean {
  if (enemyIdsToRemove.has(enemy.id)) {
    return false;
  }
  if (enemy.rivalId) {
    return recordRivalEscape(state, enemy, enemyIdsToRemove);
  }
  enemyIdsToRemove.add(enemy.id);
  state.stats = {
    ...state.stats,
    enemiesEscaped: state.stats.enemiesEscaped + 1
  };
  return true;
}

function recordRivalEscape(
  state: CombatState,
  enemy: EnemyState,
  enemyIdsToRemove: Set<number>
): boolean {
  if (enemyIdsToRemove.has(enemy.id)) {
    return false;
  }
  enemyIdsToRemove.add(enemy.id);
  if (enemy.rivalId && state.rivalEncounter?.rivalId === enemy.rivalId) {
    state.rivalEncounter.outcome = 'escaped';
  }
  state.stats = {
    ...state.stats,
    rivalsEscaped: state.stats.rivalsEscaped + 1
  };
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
