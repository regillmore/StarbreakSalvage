import { describe, expect, it } from 'vitest';

import {
  createCombatState,
  forceCombatEnd,
  getCombatEntityCount,
  spawnDebugDenseCombatScenario,
  spawnBoss,
  updateCombatState,
  type CombatBounds
} from '../../src/game/CombatState';
import { createWaveDirectorPlan, getObjectiveProgress } from '../../src/game/WaveDirector';

const bounds: CombatBounds = {
  width: 640,
  height: 720,
  padding: 24
};

describe('CombatState', () => {
  it('lets player fire destroy enemies and produce pickups', () => {
    const state = createCombatState(bounds, 'STARBREAK-SMOKE');

    for (let frame = 0; frame < 150; frame += 1) {
      updateCombatState(state, { movement: { x: 0, y: 0 }, fire: true }, 1 / 60, bounds);
    }

    expect(state.stats.shotsFired).toBeGreaterThan(1);
    expect(state.stats.enemiesDestroyed).toBeGreaterThanOrEqual(1);
    expect(state.pickups.length + state.stats.pickupsCollected).toBeGreaterThan(0);
  });

  it('collects pickups when they overlap the player', () => {
    const state = createCombatState(bounds, 'STARBREAK-SMOKE');
    state.pickups.push({
      id: 999,
      kind: 'credit',
      x: state.player.x,
      y: state.player.y,
      vx: 0,
      vy: 0,
      radius: 8,
      value: 5
    });

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);

    expect(state.player.credits).toBe(5);
    expect(state.stats.pickupsCollected).toBe(1);
    expect(state.pickups).toHaveLength(0);
  });

  it('ends the run when enemy damage removes the final hull point', () => {
    const state = createCombatState(bounds, 'STARBREAK-SMOKE');
    state.player.hull = 1;
    state.projectiles.push({
      id: 777,
      owner: 'enemy',
      x: state.player.x,
      y: state.player.y,
      vx: 0,
      vy: 0,
      radius: 8,
      damage: 1,
      ttl: 1,
      tags: ['plasma'],
      procDepth: 0
    });

    const result = updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false },
      1 / 60,
      bounds
    );

    expect(result?.reason).toBe('destroyed');
    expect(result?.damageTaken).toBe(1);
    expect(state.ended).toBe(true);
  });

  it('can force a debug run result', () => {
    const state = createCombatState(bounds, 'LASER-TAX-404');
    const result = forceCombatEnd(state, 'debug');

    expect(result.reason).toBe('debug');
    expect(state.ended).toBe(true);
  });

  it('spawns faction-coded enemies in deterministic schedules', () => {
    const first = createCombatState(bounds, 'STARBREAK-SMOKE', {
      bossId: 'boss_bloom_engine'
    });
    const second = createCombatState(bounds, 'STARBREAK-SMOKE', {
      bossId: 'boss_bloom_engine'
    });

    expect(first.spawnSchedule.map((spawn) => spawn.factionId)).toEqual(
      second.spawnSchedule.map((spawn) => spawn.factionId)
    );
    expect(new Set(first.spawnSchedule.map((spawn) => spawn.factionId)).size).toBeGreaterThan(1);
  });

  it('spawns distance-marked waves once when scroll jumps across thresholds', () => {
    const plan = createWaveDirectorPlan({
      seed: 'DISTANCE-STUTTER-PLAN',
      objective: {
        kind: 'clearWaves',
        label: 'Stutter Sweep',
        requiredWaves: 2,
        spawnsPerWave: 2,
        requiredEnemyKills: 4,
        bossRequired: false,
        bossSpawnAtSeconds: null
      },
      majorWaves: ['stutter_one', 'stutter_two'],
      preferredFactionId: 'faction_corporate_ledger',
      scroll: {
        length: 1000,
        baseSpeed: 100
      }
    });
    const firstDistance = plan.spawnSchedule[0]?.atDistance ?? 0;
    const finalDistance = Math.max(...plan.spawnSchedule.map((spawn) => spawn.atDistance ?? 0));
    const state = createCombatState(bounds, 'DISTANCE-STUTTER-RUN', {
      spawnSchedule: plan.spawnSchedule,
      bossSpawnAtSeconds: null
    });

    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: firstDistance - 1 },
      1 / 60,
      bounds
    );

    expect(state.nextSpawnIndex).toBe(0);
    expect(state.enemies).toHaveLength(0);

    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: finalDistance + 1 },
      1 / 60,
      bounds
    );

    expect(state.nextSpawnIndex).toBe(plan.spawnSchedule.length);
    expect(state.enemies).toHaveLength(plan.spawnSchedule.length);

    const spawnedIds = state.enemies.map((enemy) => enemy.id);

    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: finalDistance + 1 },
      1 / 60,
      bounds
    );

    expect(state.nextSpawnIndex).toBe(plan.spawnSchedule.length);
    expect(state.enemies.map((enemy) => enemy.id)).toEqual(spawnedIds);
  });

  it('fires the void corsair phase skirmish pattern', () => {
    const state = createCombatState(bounds, 'VOID-CORSAIR-PATTERN', {
      skipEnemyWaves: true
    });
    state.enemies.push({
      id: 990,
      factionId: 'faction_void_corsairs',
      x: state.player.x,
      y: 120,
      radius: 17,
      hull: 2,
      maxHull: 2,
      drift: 0,
      targetY: 120,
      fireCooldown: 0.01
    });

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);

    const enemyProjectiles = state.projectiles.filter((projectile) => projectile.owner === 'enemy');
    expect(state.enemies[0]?.factionId).toBe('faction_void_corsairs');
    expect(enemyProjectiles).toHaveLength(2);
    expect(enemyProjectiles.every((projectile) => projectile.tags.includes('phase'))).toBe(true);
    expect(enemyProjectiles.map((projectile) => projectile.vx)).toEqual([-82, 82]);
  });

  it.each([
    ['boss_auditor_drone_xl', 'fan'],
    ['boss_unsold_missiles_carrier', 'lane'],
    ['boss_bloom_engine', 'ring']
  ] as const)('telegraphs and fires %s with a %s warning', (bossId, telegraphKind) => {
    const state = createCombatState(bounds, `BOSS-${bossId}`, {
      bossId,
      bossSpawnAtSeconds: 0,
      skipEnemyWaves: true
    });

    for (let frame = 0; frame < 35; frame += 1) {
      updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);
    }

    expect(state.boss?.bossId).toBe(bossId);
    expect(state.telegraphs.some((telegraph) => telegraph.kind === telegraphKind)).toBe(true);

    for (let frame = 0; frame < 55; frame += 1) {
      updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);
    }

    expect(state.projectiles.some((projectile) => projectile.owner === 'enemy')).toBe(true);
  });

  it('lets direct boss spawns be defeated by player projectiles', () => {
    const state = createCombatState(bounds, 'DEBUG-BOSS', {
      skipEnemyWaves: true
    });
    const boss = spawnBoss(state, 'boss_auditor_drone_xl', bounds);
    boss.hull = 1;

    state.projectiles.push({
      id: 9001,
      owner: 'player',
      x: boss.x,
      y: boss.y,
      vx: 0,
      vy: 0,
      radius: 8,
      damage: 1,
      ttl: 1,
      tags: ['laser'],
      procDepth: 0
    });

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);

    expect(state.boss).toBeNull();
    expect(state.stats.bossesDefeated).toBe(1);
    expect(state.stats.enemiesDestroyed).toBe(1);
    expect(state.pickups.length).toBeGreaterThan(0);
  });

  it('creates a capped deterministic dense debug scenario', () => {
    const first = createCombatState(bounds, 'DENSE-DEBUG-TEST', {
      skipEnemyWaves: true
    });
    const second = createCombatState(bounds, 'DENSE-DEBUG-TEST', {
      skipEnemyWaves: true
    });

    spawnDebugDenseCombatScenario(first, bounds);
    spawnDebugDenseCombatScenario(second, bounds);

    expect(first.enemies.map((enemy) => [enemy.factionId, enemy.x, enemy.y, enemy.hull])).toEqual(
      second.enemies.map((enemy) => [enemy.factionId, enemy.x, enemy.y, enemy.hull])
    );
    expect(
      first.projectiles
        .filter((projectile) => projectile.owner === 'enemy')
        .map((projectile) => [projectile.x, projectile.y, projectile.vx, projectile.vy])
    ).toEqual(
      second.projectiles
        .filter((projectile) => projectile.owner === 'enemy')
        .map((projectile) => [projectile.x, projectile.y, projectile.vx, projectile.vy])
    );
    expect(first.enemies).toHaveLength(12);
    expect(first.projectiles.filter((projectile) => projectile.owner === 'enemy')).toHaveLength(42);
    expect(first.telegraphs.map((telegraph) => telegraph.label)).toEqual([
      'DENSE PERF LANE',
      'DENSE PERF LANE',
      'DENSE PERF LANE'
    ]);
    expect(getCombatEntityCount(first)).toBeLessThanOrEqual(80);
  });

  it('activates special with charge, burst shots, active time, and cooldown', () => {
    const state = createCombatState(bounds, 'SPECIAL-TEST', {
      skipEnemyWaves: true
    });

    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, special: true },
      1 / 60,
      bounds
    );

    expect(state.stats.specialsUsed).toBe(1);
    expect(state.player.specialCharge).toBe(0);
    expect(state.player.specialActiveSeconds).toBeGreaterThan(0);
    expect(state.player.specialCooldown).toBeGreaterThan(0);
    expect(state.projectiles.filter((projectile) => projectile.owner === 'player')).toHaveLength(3);
    expect(state.effects.some((effect) => effect.kind === 'special')).toBe(true);

    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, special: true },
      1 / 60,
      bounds
    );

    expect(state.stats.specialsUsed).toBe(1);
  });

  it('uses bomb charges to clear danger and soften enemies without trivializing bosses', () => {
    const state = createCombatState(bounds, 'BOMB-TEST', {
      skipEnemyWaves: true
    });
    state.enemies.push({
      id: 100,
      factionId: 'faction_scrap_court',
      x: state.player.x,
      y: state.player.y - 160,
      radius: 17,
      hull: 3,
      maxHull: 3,
      drift: 0,
      targetY: 120,
      fireCooldown: 1
    });
    state.projectiles.push({
      id: 101,
      owner: 'enemy',
      x: state.player.x + 80,
      y: state.player.y - 80,
      vx: 0,
      vy: 0,
      radius: 7,
      damage: 1,
      ttl: 2,
      tags: ['missile'],
      procDepth: 0
    });
    state.telegraphs.push({
      id: 102,
      kind: 'lane',
      factionId: 'faction_scrap_court',
      label: 'TEST LANE',
      x: state.player.x,
      y: 120,
      radius: 0,
      width: 32,
      height: 400,
      ttl: 1,
      maxTtl: 1
    });
    const boss = spawnBoss(state, 'boss_auditor_drone_xl', bounds);
    boss.hull = 10;

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false, bomb: true }, 1 / 60, bounds);

    expect(state.player.bombs).toBe(1);
    expect(state.stats.bombsUsed).toBe(1);
    expect(state.stats.enemyProjectilesCancelled).toBe(1);
    expect(state.projectiles.some((projectile) => projectile.owner === 'enemy')).toBe(false);
    expect(state.telegraphs).toHaveLength(0);
    expect(state.enemies[0]?.hull).toBeLessThan(3);
    expect(state.boss?.hull).toBeLessThan(10);
    expect(state.boss?.hull).toBeGreaterThan(0);
    expect(state.effects.some((effect) => effect.kind === 'bomb')).toBe(true);
  });

  it('grants deterministic special charge for near-miss grazes once per projectile', () => {
    const state = createCombatState(bounds, 'GRAZE-TEST', {
      skipEnemyWaves: true
    });
    state.player.specialCharge = 0;
    state.projectiles.push({
      id: 501,
      owner: 'enemy',
      x: state.player.x + state.player.radius + 16,
      y: state.player.y,
      vx: 0,
      vy: 0,
      radius: 5,
      damage: 1,
      ttl: 2,
      tags: ['plasma'],
      procDepth: 0
    });

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);

    expect(state.stats.grazes).toBe(1);
    expect(state.player.specialCharge).toBeGreaterThan(0);
    expect(state.effects.some((effect) => effect.kind === 'graze')).toBe(true);

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);

    expect(state.stats.grazes).toBe(1);
  });

  it('charges special from enemy kills', () => {
    const state = createCombatState(bounds, 'KILL-CHARGE-TEST', {
      skipEnemyWaves: true
    });
    state.player.specialCharge = 0;
    state.enemies.push({
      id: 701,
      factionId: 'faction_corporate_ledger',
      x: state.player.x,
      y: state.player.y - 120,
      radius: 17,
      hull: 1,
      maxHull: 1,
      drift: 0,
      targetY: 120,
      fireCooldown: 1
    });
    state.projectiles.push({
      id: 702,
      owner: 'player',
      x: state.player.x,
      y: state.player.y - 120,
      vx: 0,
      vy: 0,
      radius: 8,
      damage: 1,
      ttl: 1,
      tags: ['laser'],
      procDepth: 0
    });

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);

    expect(state.stats.enemiesDestroyed).toBe(1);
    expect(state.player.specialCharge).toBeGreaterThan(0);
  });

  it('counts item side-effect defeats toward objective target progress', () => {
    const state = createCombatState(bounds, 'SIDE-EFFECT-TARGET-TEST', {
      skipEnemyWaves: true,
      items: [
        { itemId: 'item_split_prism', acquisitionOrder: 0 },
        { itemId: 'item_chain_arc_capacitor', acquisitionOrder: 1 }
      ]
    });
    const plan = createTwoTargetPlan();
    state.nextSpawnIndex = plan.spawnSchedule.length;
    state.player.specialCharge = 0;
    state.enemies.push(
      {
        id: 801,
        factionId: 'faction_corporate_ledger',
        x: state.player.x,
        y: state.player.y - 120,
        radius: 17,
        hull: 1,
        maxHull: 1,
        drift: 0,
        targetY: 120,
        fireCooldown: 1
      },
      {
        id: 802,
        factionId: 'faction_corporate_ledger',
        x: state.player.x + 24,
        y: state.player.y - 120,
        radius: 17,
        hull: 0.5,
        maxHull: 1,
        drift: 0,
        targetY: 120,
        fireCooldown: 1
      }
    );
    state.projectiles.push({
      id: 803,
      owner: 'player',
      x: state.player.x,
      y: state.player.y - 120,
      vx: 0,
      vy: 0,
      radius: 8,
      damage: 1,
      ttl: 1,
      tags: ['laser'],
      procDepth: 0
    });

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);

    expect(state.enemies).toHaveLength(0);
    expect(state.stats.enemiesDestroyed).toBe(2);
    expect(getObjectiveProgress(plan, state).complete).toBe(true);
  });

  it('counts enemy body collisions as cleared targets to avoid empty-field soft locks', () => {
    const state = createCombatState(bounds, 'BODY-COLLISION-TARGET-TEST', {
      skipEnemyWaves: true
    });
    const plan = createOneTargetPlan();
    state.nextSpawnIndex = plan.spawnSchedule.length;
    state.enemies.push({
      id: 901,
      factionId: 'faction_corporate_ledger',
      x: state.player.x,
      y: state.player.y,
      radius: 17,
      hull: 3,
      maxHull: 3,
      drift: 0,
      targetY: state.player.y,
      fireCooldown: 1
    });

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);

    expect(state.enemies).toHaveLength(0);
    expect(state.stats.enemiesDestroyed).toBe(1);
    expect(state.stats.damageTaken).toBe(1);
    expect(getObjectiveProgress(plan, state).complete).toBe(true);
  });
});

function createOneTargetPlan() {
  return createWaveDirectorPlan({
    seed: 'TARGET-COLLISION-PLAN',
    objective: {
      kind: 'clearWaves',
      label: 'Collision Sweep',
      requiredWaves: 1,
      spawnsPerWave: 1,
      requiredEnemyKills: 1,
      bossRequired: false,
      bossSpawnAtSeconds: null
    },
    majorWaves: ['collision_single'],
    preferredFactionId: 'faction_corporate_ledger'
  });
}

function createTwoTargetPlan() {
  return createWaveDirectorPlan({
    seed: 'TARGET-REGRESSION-PLAN',
    objective: {
      kind: 'clearWaves',
      label: 'Regression Sweep',
      requiredWaves: 1,
      spawnsPerWave: 2,
      requiredEnemyKills: 2,
      bossRequired: false,
      bossSpawnAtSeconds: null
    },
    majorWaves: ['regression_pair'],
    preferredFactionId: 'faction_corporate_ledger'
  });
}
