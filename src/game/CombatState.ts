import type { ItemTag } from '../content/items';
import { getWeaponById, type WeaponDefinition } from '../content/weapons';
import { clamp, type Vector2 } from '../core/math';
import { createRng } from '../core/rng';
import {
  applyItemHooks,
  hasItem,
  type EnemyKilledPayload,
  type ProjectileBlueprint
} from './ItemHooks';
import { getItemNames, type ItemInstance } from './Rewards';
import { applyDamage } from '../systems/DamageSystem';
import { circlesOverlap } from '../systems/CollisionSystem';
import type { WeaponId } from '../content/ships';

export type ProjectileOwner = 'player' | 'enemy';
export type PickupKind = 'credit' | 'salvage';
export type CombatEndReason = 'destroyed' | 'abandoned' | 'debug' | 'sectorComplete';

export interface CombatBounds {
  readonly width: number;
  readonly height: number;
  readonly padding: number;
}

export interface CombatInput {
  readonly movement: Vector2;
  readonly fire: boolean;
}

export interface PlayerState {
  x: number;
  y: number;
  readonly radius: number;
  hull: number;
  readonly maxHull: number;
  fireCooldown: number;
  invulnerableSeconds: number;
  fireRateMultiplier: number;
  fireRateBoostSeconds: number;
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
}

export interface EnemyState {
  readonly id: number;
  x: number;
  y: number;
  readonly radius: number;
  hull: number;
  readonly maxHull: number;
  readonly drift: number;
  readonly targetY: number;
  fireCooldown: number;
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

export interface CombatStats {
  readonly enemiesDestroyed: number;
  readonly shotsFired: number;
  readonly pickupsCollected: number;
  readonly damageTaken: number;
  readonly itemTriggers: number;
}

export interface CombatState {
  readonly seed: string;
  timeSeconds: number;
  nextId: number;
  nextSpawnIndex: number;
  player: PlayerState;
  projectiles: ProjectileState[];
  enemies: EnemyState[];
  pickups: PickupState[];
  spawnSchedule: readonly EnemySpawn[];
  readonly weapon: WeaponDefinition;
  readonly items: readonly ItemInstance[];
  volleyIndex: number;
  stats: CombatStats;
  ended: boolean;
}

export interface EnemySpawn {
  readonly atSeconds: number;
  readonly xRatio: number;
  readonly targetY: number;
  readonly hull: number;
  readonly fireDelay: number;
}

export interface CombatRunResult {
  readonly reason: CombatEndReason;
  readonly survivedSeconds: number;
  readonly credits: number;
  readonly salvage: number;
  readonly enemiesDestroyed: number;
  readonly shotsFired: number;
  readonly pickupsCollected: number;
  readonly damageTaken: number;
  readonly itemTriggers: number;
  readonly itemNames: readonly string[];
}

const PLAYER_RADIUS = 18;
const PLAYER_MAX_HULL = 3;
const PLAYER_SPEED = 360;
const ENEMY_PROJECTILE_SPEED = 285;
const PLAYER_DAMAGE_INVULNERABILITY_SECONDS = 0.55;

export interface CombatStateOptions {
  readonly weaponId?: WeaponId;
  readonly items?: readonly ItemInstance[];
}

export function createCombatState(
  bounds: CombatBounds,
  seed: string,
  options: CombatStateOptions = {}
): CombatState {
  const weapon = getWeaponById(options.weaponId ?? 'weapon_light_needle_laser');

  return {
    seed,
    timeSeconds: 0,
    nextId: 1,
    nextSpawnIndex: 0,
    player: {
      x: bounds.width / 2,
      y: bounds.height * 0.78,
      radius: PLAYER_RADIUS,
      hull: PLAYER_MAX_HULL,
      maxHull: PLAYER_MAX_HULL,
      fireCooldown: 0,
      invulnerableSeconds: 0,
      fireRateMultiplier: 1,
      fireRateBoostSeconds: 0,
      credits: 0,
      salvage: 0
    },
    projectiles: [],
    enemies: [],
    pickups: [],
    spawnSchedule: createEnemySpawnSchedule(seed),
    weapon,
    items: options.items ?? [],
    volleyIndex: 0,
    stats: {
      enemiesDestroyed: 0,
      shotsFired: 0,
      pickupsCollected: 0,
      damageTaken: 0,
      itemTriggers: 0
    },
    ended: false
  };
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
  updatePlayer(state, input, safeDt, bounds);
  spawnDueEnemies(state, bounds);
  updateEnemies(state, safeDt);
  updateProjectiles(state, safeDt, bounds);
  updatePickups(state, safeDt, bounds);
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

export function getCombatEntityCount(state: CombatState): number {
  return 1 + state.enemies.length + state.projectiles.length + state.pickups.length;
}

export function createCombatRunResult(
  state: CombatState,
  reason: CombatEndReason
): CombatRunResult {
  return {
    reason,
    survivedSeconds: state.timeSeconds,
    credits: state.player.credits,
    salvage: state.player.salvage,
    enemiesDestroyed: state.stats.enemiesDestroyed,
    shotsFired: state.stats.shotsFired,
    pickupsCollected: state.stats.pickupsCollected,
    damageTaken: state.stats.damageTaken,
    itemTriggers: state.stats.itemTriggers,
    itemNames: getItemNames(state.items)
  };
}

function updatePlayer(
  state: CombatState,
  input: CombatInput,
  dt: number,
  bounds: CombatBounds
): void {
  const { player } = state;

  player.x = clamp(
    player.x + input.movement.x * PLAYER_SPEED * dt,
    bounds.padding + player.radius,
    bounds.width - bounds.padding - player.radius
  );
  player.y = clamp(
    player.y + input.movement.y * PLAYER_SPEED * dt,
    bounds.padding + player.radius,
    bounds.height - bounds.padding - player.radius
  );
  player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  player.invulnerableSeconds = Math.max(0, player.invulnerableSeconds - dt);
  player.fireRateBoostSeconds = Math.max(0, player.fireRateBoostSeconds - dt);

  if (player.fireRateBoostSeconds <= 0) {
    player.fireRateMultiplier = 1;
  }

  if (input.fire && player.fireCooldown <= 0) {
    state.volleyIndex += 1;

    const baseProjectile: ProjectileBlueprint = {
      x: player.x,
      y: player.y - player.radius,
      vx: 0,
      vy: -state.weapon.projectileSpeed,
      radius: state.weapon.projectileRadius,
      damage: state.weapon.damage,
      ttl: 1.6,
      tags: state.weapon.tags,
      procDepth: 0
    };
    const firePayload = applyItemHooks('onFire', state.items, {
      volleyIndex: state.volleyIndex,
      projectiles: [baseProjectile]
    });

    for (const projectile of firePayload.projectiles) {
      const spawnPayload = applyItemHooks('onProjectileSpawn', state.items, { projectile });
      state.projectiles.push({
        id: getNextEntityId(state),
        owner: 'player',
        ...spawnPayload.projectile
      });
    }

    player.fireCooldown = state.weapon.fireCooldownSeconds * player.fireRateMultiplier;
    state.stats = {
      ...state.stats,
      shotsFired: state.stats.shotsFired + firePayload.projectiles.length,
      itemTriggers:
        state.stats.itemTriggers +
        Math.max(0, firePayload.projectiles.length - 1)
    };
  }
}

function spawnDueEnemies(state: CombatState, bounds: CombatBounds): void {
  while (state.nextSpawnIndex < state.spawnSchedule.length) {
    const spawn = state.spawnSchedule[state.nextSpawnIndex];

    if (!spawn || spawn.atSeconds > state.timeSeconds) {
      return;
    }

    state.enemies.push({
      id: getNextEntityId(state),
      x: clamp(spawn.xRatio, 0.1, 0.9) * bounds.width,
      y: -24,
      radius: 17,
      hull: spawn.hull,
      maxHull: spawn.hull,
      drift: (spawn.xRatio - 0.5) * 32,
      targetY: spawn.targetY,
      fireCooldown: spawn.fireDelay
    });
    state.nextSpawnIndex += 1;
  }
}

function updateEnemies(state: CombatState, dt: number): void {
  for (const enemy of state.enemies) {
    if (enemy.y < enemy.targetY) {
      enemy.y += 115 * dt;
    } else {
      enemy.x += enemy.drift * dt;
      enemy.y += Math.sin(state.timeSeconds * 2 + enemy.id) * 8 * dt;
    }

    enemy.fireCooldown -= dt;

    if (enemy.fireCooldown <= 0) {
      state.projectiles.push({
        id: getNextEntityId(state),
        owner: 'enemy',
        x: enemy.x,
        y: enemy.y + enemy.radius,
        vx: 0,
        vy: ENEMY_PROJECTILE_SPEED,
        radius: 6,
        damage: 1,
        ttl: 4,
        tags: ['plasma'],
        procDepth: 0
      });
      enemy.fireCooldown = 1.15;
    }
  }
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

function updatePickups(state: CombatState, dt: number, bounds: CombatBounds): void {
  for (const pickup of state.pickups) {
    const dx = state.player.x - pickup.x;
    const dy = state.player.y - pickup.y;
    const distance = Math.hypot(dx, dy);

    const attractionRange = hasItem(state.items, 'item_salvage_magnet') ? 760 : 240;

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

        const overkillDamage = Math.max(0, projectile.damage - enemy.hull);
        enemy.hull = applyDamage(enemy.hull, projectile.damage).hull;
        projectileIdsToRemove.add(projectile.id);

        if (enemy.hull <= 0) {
          enemyIdsToRemove.add(enemy.id);
          const killPayload = applyItemHooks('onEnemyKilled', state.items, {
            projectileTags: projectile.tags,
            overkillDamage,
            bonusSalvage: 0,
            blastDamage: 0,
            arcDamage: 0
          });
          spawnEnemyDefeatPickups(state, enemy, killPayload.bonusSalvage);
          applyKillSideEffects(state, enemy, killPayload, enemyIdsToRemove);
          state.stats = {
            ...state.stats,
            enemiesDestroyed: state.stats.enemiesDestroyed + 1,
            itemTriggers:
              state.stats.itemTriggers +
              Number(killPayload.bonusSalvage > 0) +
              Number(killPayload.blastDamage > 0) +
              Number(killPayload.arcDamage > 0)
          };
        }

        break;
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

    enemyIdsToRemove.add(enemy.id);
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
      itemTriggers:
        state.stats.itemTriggers + Number(pickupPayload.fireRateMultiplier < 1)
    };
  }

  state.projectiles = state.projectiles.filter((projectile) => !projectileIdsToRemove.has(projectile.id));
  state.enemies = state.enemies.filter((enemy) => !enemyIdsToRemove.has(enemy.id));
  state.pickups = state.pickups.filter((pickup) => !pickupIdsToRemove.has(pickup.id));
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
  state.enemies = state.enemies.filter((enemy) => enemy.y < bounds.height + enemy.radius * 2);
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

function applyKillSideEffects(
  state: CombatState,
  defeatedEnemy: EnemyState,
  payload: EnemyKilledPayload,
  enemyIdsToRemove: Set<number>
): void {
  if (payload.arcDamage > 0) {
    const nearest = state.enemies
      .filter((enemy) => enemy.id !== defeatedEnemy.id && !enemyIdsToRemove.has(enemy.id))
      .sort((a, b) => getDistanceSquared(defeatedEnemy, a) - getDistanceSquared(defeatedEnemy, b))[0];

    if (nearest) {
      nearest.hull = applyDamage(nearest.hull, payload.arcDamage).hull;
      if (nearest.hull <= 0) {
        enemyIdsToRemove.add(nearest.id);
        spawnEnemyDefeatPickups(state, nearest, 0);
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
        enemyIdsToRemove.add(enemy.id);
        spawnEnemyDefeatPickups(state, enemy, 0);
      }
    }
  }
}

function getDistanceSquared(a: { readonly x: number; readonly y: number }, b: { readonly x: number; readonly y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function getNextEntityId(state: CombatState): number {
  const id = state.nextId;
  state.nextId += 1;
  return id;
}

function createEnemySpawnSchedule(seed: string): EnemySpawn[] {
  const rng = createRng(seed).fork('combat-mvp-wave');
  const schedule: EnemySpawn[] = [
    {
      atSeconds: 0.45,
      xRatio: 0.5,
      targetY: 116,
      hull: 2,
      fireDelay: 1
    }
  ];

  for (let index = 1; index < 12; index += 1) {
    schedule.push({
      atSeconds: 0.45 + index * 1.35,
      xRatio: rng.int(18, 82) / 100,
      targetY: rng.int(86, 190),
      hull: index % 4 === 0 ? 3 : 2,
      fireDelay: rng.int(70, 140) / 100
    });
  }

  return schedule;
}
