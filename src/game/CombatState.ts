import { clamp, type Vector2 } from '../core/math';
import { createRng } from '../core/rng';
import { applyDamage } from '../systems/DamageSystem';
import { circlesOverlap } from '../systems/CollisionSystem';

export type ProjectileOwner = 'player' | 'enemy';
export type PickupKind = 'credit' | 'salvage';
export type CombatEndReason = 'destroyed' | 'abandoned' | 'debug';

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
}

const PLAYER_RADIUS = 18;
const PLAYER_MAX_HULL = 3;
const PLAYER_SPEED = 360;
const PLAYER_FIRE_COOLDOWN_SECONDS = 0.16;
const PLAYER_PROJECTILE_SPEED = 740;
const ENEMY_PROJECTILE_SPEED = 285;
const PLAYER_DAMAGE_INVULNERABILITY_SECONDS = 0.55;

export function createCombatState(bounds: CombatBounds, seed: string): CombatState {
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
      credits: 0,
      salvage: 0
    },
    projectiles: [],
    enemies: [],
    pickups: [],
    spawnSchedule: createEnemySpawnSchedule(seed),
    stats: {
      enemiesDestroyed: 0,
      shotsFired: 0,
      pickupsCollected: 0,
      damageTaken: 0
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
    damageTaken: state.stats.damageTaken
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

  if (input.fire && player.fireCooldown <= 0) {
    state.projectiles.push({
      id: getNextEntityId(state),
      owner: 'player',
      x: player.x,
      y: player.y - player.radius,
      vx: 0,
      vy: -PLAYER_PROJECTILE_SPEED,
      radius: 4,
      damage: 1,
      ttl: 1.6
    });
    player.fireCooldown = PLAYER_FIRE_COOLDOWN_SECONDS;
    state.stats = {
      ...state.stats,
      shotsFired: state.stats.shotsFired + 1
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
        ttl: 4
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

    if (distance < 620 && distance > 0) {
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

        enemy.hull = applyDamage(enemy.hull, projectile.damage).hull;
        projectileIdsToRemove.add(projectile.id);

        if (enemy.hull <= 0) {
          enemyIdsToRemove.add(enemy.id);
          spawnEnemyDefeatPickups(state, enemy);
          state.stats = {
            ...state.stats,
            enemiesDestroyed: state.stats.enemiesDestroyed + 1
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

    state.stats = {
      ...state.stats,
      pickupsCollected: state.stats.pickupsCollected + 1
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
  state.stats = {
    ...state.stats,
    damageTaken: state.stats.damageTaken + outcome.damageApplied
  };
}

function spawnEnemyDefeatPickups(state: CombatState, enemy: EnemyState): void {
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
