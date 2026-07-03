import { describe, expect, it } from 'vitest';

import {
  createCombatState,
  forceCombatEnd,
  spawnBoss,
  updateCombatState,
  type CombatBounds
} from '../../src/game/CombatState';

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

  it('activates special with charge, burst shots, active time, and cooldown', () => {
    const state = createCombatState(bounds, 'SPECIAL-TEST', {
      skipEnemyWaves: true
    });

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false, special: true }, 1 / 60, bounds);

    expect(state.stats.specialsUsed).toBe(1);
    expect(state.player.specialCharge).toBe(0);
    expect(state.player.specialActiveSeconds).toBeGreaterThan(0);
    expect(state.player.specialCooldown).toBeGreaterThan(0);
    expect(state.projectiles.filter((projectile) => projectile.owner === 'player')).toHaveLength(3);
    expect(state.effects.some((effect) => effect.kind === 'special')).toBe(true);

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false, special: true }, 1 / 60, bounds);

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
});
