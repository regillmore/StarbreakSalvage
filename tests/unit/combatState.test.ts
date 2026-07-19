import { describe, expect, it } from 'vitest';

import {
  createCombatState,
  forceCombatEnd,
  getCombatEntityCounts,
  getCombatEntityCount,
  prepareDebugEnvironmentStressScenario,
  prepareDebugEnemyRichScenario,
  prepareDebugLongScrollScenario,
  spawnDebugDenseCombatScenario,
  spawnBoss,
  updateCombatState,
  type CombatBounds,
  type CombatState,
  type EnemySpawn
} from '../../src/game/CombatState';
import { createWaveDirectorPlan, getObjectiveProgress } from '../../src/game/WaveDirector';

const bounds: CombatBounds = {
  width: 640,
  height: 720,
  padding: 24
};

describe('CombatState', () => {
  it('spends stored heat on a Vent shot and exhausts visibly when the reserve is cool', () => {
    const items = [
      {
        itemId: 'item_phase_grazer' as const,
        acquisitionOrder: 0,
        socket: { componentId: 'test', socketIndex: 0, circuitOrder: 0 }
      },
      {
        itemId: 'item_prototype_vent_script' as const,
        acquisitionOrder: 1,
        socket: { componentId: 'test', socketIndex: 1, circuitOrder: 1 }
      }
    ];
    const hot = createCombatState(bounds, 'HEAT-SHOT-HOT', { items, skipEnemyWaves: true });
    hot.volleyIndex = 4;
    hot.player.weaponHeat = 0.8;

    updateCombatState(hot, { movement: { x: 0, y: 0 }, fire: true }, 0, bounds);

    expect(hot.heatShotsFired).toBe(1);
    expect(hot.heatShotsExhausted).toBe(0);
    expect(hot.projectiles.filter((shot) => shot.visualKind === 'heatShot')).toHaveLength(1);
    expect(hot.player.weaponHeat).toBeCloseTo(0.452);

    const cool = createCombatState(bounds, 'HEAT-SHOT-COOL', { items, skipEnemyWaves: true });
    cool.volleyIndex = 4;
    cool.player.weaponHeat = 0.1;

    updateCombatState(cool, { movement: { x: 0, y: 0 }, fire: true }, 0, bounds);

    expect(cool.heatShotsFired).toBe(0);
    expect(cool.heatShotsExhausted).toBe(1);
    expect(cool.projectiles.filter((shot) => shot.visualKind === 'heatShot')).toHaveLength(0);
    expect(cool.effects).toContainEqual(
      expect.objectContaining({ kind: 'heatExhaust', x: cool.player.x - 7 })
    );
    expect(cool.player.weaponHeat).toBeCloseTo(0.2);
  });

  it('consumes a fitted ricochet charge when a player shot reaches a sidewall', () => {
    const state = createCombatState(bounds, 'RICOCHET-RUNTIME');
    state.projectiles.push({
      id: state.nextId++,
      owner: 'player',
      x: 6,
      y: 300,
      vx: -100,
      vy: -200,
      radius: 4,
      damage: 1,
      ttl: 2,
      tags: ['plasma', 'ricochet'],
      procDepth: 0,
      ricochetBounces: 1
    });

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 0.05, bounds);

    expect(state.projectiles[0]?.vx).toBeGreaterThan(0);
    expect(state.projectiles[0]?.ricochetBounces).toBe(0);
  });

  it('clamps player movement to a provided gameplay safe frame', () => {
    const safeFrame = {
      x: 78,
      y: 132,
      width: 486,
      height: 508
    };
    const safeBounds: CombatBounds = {
      width: 640,
      height: 720,
      padding: 24,
      safeFrame
    };
    const state = createCombatState(safeBounds, 'SAFE-FRAME-CLAMP');

    updateCombatState(state, { movement: { x: -100, y: -100 }, fire: false }, 1, safeBounds);

    expect(state.player.x).toBe(state.player.radius + safeFrame.x);
    expect(state.player.y).toBe(state.player.radius + safeFrame.y);

    updateCombatState(state, { movement: { x: 100, y: 100 }, fire: false }, 1, safeBounds);

    expect(state.player.x).toBe(safeFrame.x + safeFrame.width - state.player.radius);
    expect(state.player.y).toBe(safeFrame.y + safeFrame.height - state.player.radius);
  });

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

  it('lets enemy projectiles leave open arenas but keeps authored side walls solid', () => {
    const openState = createCombatState(bounds, 'OPEN-PROJECTILE-BOUNDARY', {
      skipEnemyWaves: true
    });
    openState.projectiles.push({
      id: 998,
      owner: 'enemy',
      x: bounds.padding + 1,
      y: 120,
      vx: -200,
      vy: 0,
      radius: 5,
      damage: 1,
      ttl: 1,
      tags: ['plasma'],
      procDepth: 0
    });
    openState.projectiles.push(
      {
        id: 997,
        owner: 'enemy',
        x: bounds.width - 1,
        y: 140,
        vx: 200,
        vy: 0,
        radius: 5,
        damage: 1,
        ttl: 1,
        tags: ['plasma'],
        procDepth: 0
      },
      {
        id: 996,
        owner: 'enemy',
        x: 220,
        y: 1,
        vx: 0,
        vy: -200,
        radius: 5,
        damage: 1,
        ttl: 1,
        tags: ['plasma'],
        procDepth: 0
      },
      {
        id: 995,
        owner: 'enemy',
        x: 420,
        y: bounds.height - 1,
        vx: 0,
        vy: 200,
        radius: 5,
        damage: 1,
        ttl: 1,
        tags: ['plasma'],
        procDepth: 0
      }
    );

    updateCombatState(openState, { movement: { x: 0, y: 0 }, fire: false }, 0.1, bounds);
    expect(openState.projectiles[0]?.x).toBe(5);
    expect(openState.projectiles[1]?.x).toBe(659);
    expect(openState.projectiles[2]?.y).toBe(-19);
    expect(openState.projectiles[3]?.y).toBe(739);

    const wallBounds: CombatBounds = {
      ...bounds,
      padding: 60,
      enemyProjectileBoundary: 'sideWalls'
    };
    const wallState = createCombatState(wallBounds, 'WALL-PROJECTILE-BOUNDARY', {
      skipEnemyWaves: true
    });
    wallState.projectiles.push({
      id: 999,
      owner: 'enemy',
      x: wallBounds.padding + 1,
      y: 120,
      vx: -200,
      vy: 0,
      radius: 5,
      damage: 1,
      ttl: 1,
      tags: ['plasma'],
      procDepth: 0
    });

    updateCombatState(wallState, { movement: { x: 0, y: 0 }, fire: false }, 0.1, wallBounds);
    expect(wallState.projectiles[0]?.x).toBe(wallBounds.padding);
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

  it('applies enemy variant stat modifiers when scheduled spawns enter', () => {
    const state = createCombatState(bounds, 'VARIANT-SPAWN-STATS', {
      enemyHullBonus: 1,
      enemyFireDelayMultiplier: 0.8,
      bossSpawnAtSeconds: null,
      spawnSchedule: [
        {
          atSeconds: 0,
          waveIndex: 0,
          waveLabel: 'variant_test',
          xRatio: 0.8,
          targetY: 120,
          hull: 2,
          fireDelay: 1,
          factionId: 'faction_scrap_court',
          variantId: 'variant_armored'
        }
      ]
    });

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);

    const enemy = state.enemies[0];
    expect(enemy?.variantId).toBe('variant_armored');
    expect(enemy?.maxHull).toBe(4);
    expect(enemy?.hull).toBe(4);
    expect(enemy?.radius).toBeCloseTo(18.36);
    expect(enemy?.drift).toBeCloseTo(9.216);
    expect(enemy?.fireCooldown).toBeCloseTo(0.84 - 1 / 60);
  });

  it('drops variant bonus salvage through the normal defeat path', () => {
    const state = createCombatState(bounds, 'VARIANT-SALVAGE-DROP', {
      bossSpawnAtSeconds: null,
      spawnSchedule: [
        {
          atSeconds: 0,
          waveIndex: 0,
          waveLabel: 'variant_salvage_test',
          xRatio: 0.5,
          targetY: 120,
          hull: 2,
          fireDelay: 1,
          factionId: 'faction_scrap_court',
          variantId: 'variant_salvage_rich'
        }
      ]
    });

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);

    const enemy = state.enemies[0];
    if (!enemy) {
      throw new Error('Expected variant enemy to spawn.');
    }

    enemy.x = state.player.x;
    enemy.y = state.player.y - 120;
    enemy.hull = 1;
    state.projectiles.push({
      id: 4401,
      owner: 'player',
      x: enemy.x,
      y: enemy.y,
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
    expect(state.stats.enemiesDestroyed).toBe(1);
    expect(
      state.pickups
        .filter((pickup) => pickup.kind === 'salvage')
        .reduce((total, pickup) => total + pickup.value, 0)
    ).toBe(3);
  });

  it('telegraphs then fires the void corsair phase skirmish pattern', () => {
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
      homeX: state.player.x,
      fireCooldown: 0.01
    });

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);

    expect(state.enemies[0]?.factionId).toBe('faction_void_corsairs');
    expect(state.telegraphs.map((telegraph) => telegraph.label)).toEqual(['PHASE TAP']);
    expect(state.projectiles.filter((projectile) => projectile.owner === 'enemy')).toHaveLength(0);

    for (let frame = 0; frame < 12; frame += 1) {
      updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);
    }

    const enemyProjectiles = state.projectiles.filter((projectile) => projectile.owner === 'enemy');
    expect(enemyProjectiles).toHaveLength(2);
    expect(enemyProjectiles.every((projectile) => projectile.tags.includes('phase'))).toBe(true);
    expect(enemyProjectiles[0]?.vx).toBeLessThan(enemyProjectiles[1]?.vx ?? 0);
    expect(enemyProjectiles.every((projectile) => projectile.vy > 250)).toBe(true);
  });

  it('keeps normal enemy attack cadence deterministic and bounded', () => {
    const first = createRoleAttackTestState();
    const second = createRoleAttackTestState();

    for (let frame = 0; frame < 40; frame += 1) {
      updateCombatState(first, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);
      updateCombatState(second, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);
    }

    const firstEnemyProjectiles = first.projectiles.filter(
      (projectile) => projectile.owner === 'enemy'
    );
    const secondEnemyProjectiles = second.projectiles.filter(
      (projectile) => projectile.owner === 'enemy'
    );

    expect(
      firstEnemyProjectiles.map((projectile) => [
        projectile.factionId,
        Math.round(projectile.x),
        Math.round(projectile.y),
        Math.round(projectile.vx),
        Math.round(projectile.vy),
        projectile.radius,
        projectile.tags.join('+')
      ])
    ).toEqual(
      secondEnemyProjectiles.map((projectile) => [
        projectile.factionId,
        Math.round(projectile.x),
        Math.round(projectile.y),
        Math.round(projectile.vx),
        Math.round(projectile.vy),
        projectile.radius,
        projectile.tags.join('+')
      ])
    );
    expect(firstEnemyProjectiles).toHaveLength(9);
    expect(first.telegraphs.length).toBeLessThanOrEqual(4);
    expect(getCombatEntityCount(first)).toBeLessThanOrEqual(80);
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

  it('applies persistent negative boss hull deltas without allowing zero hull', () => {
    const baseline = createCombatState(bounds, 'APEX-HULL-BASE', { skipEnemyWaves: true });
    const wounded = createCombatState(bounds, 'APEX-HULL-WOUNDED', {
      skipEnemyWaves: true,
      bossHullBonus: -6
    });
    const minimum = createCombatState(bounds, 'APEX-HULL-MIN', {
      skipEnemyWaves: true,
      bossHullBonus: -999
    });
    expect(spawnBoss(wounded, 'boss_grave_choir', bounds).maxHull).toBe(
      spawnBoss(baseline, 'boss_grave_choir', bounds).maxHull - 6
    );
    expect(spawnBoss(minimum, 'boss_grave_choir', bounds).maxHull).toBe(1);
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
    expect(getCombatEntityCounts(first)).toEqual({
      total: 59,
      player: 1,
      enemies: 12,
      boss: 0,
      projectiles: 42,
      playerProjectiles: 0,
      enemyProjectiles: 42,
      pickups: 0,
      looseCurrencyPickups: 0,
      looseCurrencyValue: 0,
      looseCurrencyCredits: 0,
      looseCurrencySalvage: 0,
      looseCurrencyPickupCap: 48,
      looseCurrencyValueCap: 120,
      effects: 1,
      pickupsAndEffects: 1,
      telegraphs: 3,
      environmentObjects: 0,
      destructibles: 0,
      obstacles: 0
    });
    expect(getCombatEntityCount(first)).toBeLessThanOrEqual(80);
  });

  it('prepares a quiet deterministic long-scroll debug scenario', () => {
    const state = createCombatState(bounds, 'LONG-SCROLL-DEBUG-TEST');

    spawnBoss(state, 'boss_core_wreck', bounds, { clearField: true });
    spawnDebugDenseCombatScenario(state, bounds);
    prepareDebugLongScrollScenario(state, 1200);

    expect(state.enemies).toHaveLength(0);
    expect(state.projectiles).toHaveLength(0);
    expect(state.telegraphs).toHaveLength(0);
    expect(state.effects).toHaveLength(0);
    expect(state.pickups).toHaveLength(0);
    expect(state.boss).toBeNull();
    expect(state.bossSpawned).toBe(false);
    expect(state.nextSpawnIndex).toBe(state.spawnSchedule.length);
    expect(state.scrollDistance).toBe(1200);
    expect(getCombatEntityCounts(state)).toEqual({
      total: 1,
      player: 1,
      enemies: 0,
      boss: 0,
      projectiles: 0,
      playerProjectiles: 0,
      enemyProjectiles: 0,
      pickups: 0,
      looseCurrencyPickups: 0,
      looseCurrencyValue: 0,
      looseCurrencyCredits: 0,
      looseCurrencySalvage: 0,
      looseCurrencyPickupCap: 48,
      looseCurrencyValueCap: 120,
      effects: 0,
      pickupsAndEffects: 0,
      telegraphs: 0,
      environmentObjects: 0,
      destructibles: 0,
      obstacles: 0
    });
  });

  it('creates a deterministic enemy-rich debug scenario with readable budgets', () => {
    const first = createCombatState(bounds, 'ENEMY-RICH-DEBUG-TEST', {
      skipEnemyWaves: true
    });
    const second = createCombatState(bounds, 'ENEMY-RICH-DEBUG-TEST', {
      skipEnemyWaves: true
    });

    prepareDebugEnemyRichScenario(first, bounds);
    prepareDebugEnemyRichScenario(second, bounds);

    expect(
      first.enemies.map((enemy) => [
        enemy.factionId,
        enemy.variantId,
        enemy.formationLabel,
        enemy.formationMemberIndex,
        enemy.x,
        enemy.y,
        enemy.hull
      ])
    ).toEqual(
      second.enemies.map((enemy) => [
        enemy.factionId,
        enemy.variantId,
        enemy.formationLabel,
        enemy.formationMemberIndex,
        enemy.x,
        enemy.y,
        enemy.hull
      ])
    );
    expect(first.enemies).toHaveLength(10);
    expect(first.enemies.filter((enemy) => enemy.variantId !== null)).toHaveLength(10);
    expect(first.enemies.filter((enemy) => enemy.formationId !== null)).toHaveLength(10);
    expect(first.projectiles.filter((projectile) => projectile.owner === 'enemy')).toHaveLength(36);
    expect(first.telegraphs.map((telegraph) => telegraph.label)).toEqual([
      'ENEMY RICH LANE',
      'ENEMY RICH FAN',
      'ENEMY RICH LANE',
      'ENEMY RICH LANE'
    ]);
    expect(getCombatEntityCounts(first)).toEqual({
      total: 53,
      player: 1,
      enemies: 10,
      boss: 0,
      projectiles: 36,
      playerProjectiles: 0,
      enemyProjectiles: 36,
      pickups: 0,
      looseCurrencyPickups: 0,
      looseCurrencyValue: 0,
      looseCurrencyCredits: 0,
      looseCurrencySalvage: 0,
      looseCurrencyPickupCap: 48,
      looseCurrencyValueCap: 120,
      effects: 2,
      pickupsAndEffects: 2,
      telegraphs: 4,
      environmentObjects: 0,
      destructibles: 0,
      obstacles: 0
    });
    expect(getCombatEntityCount(first)).toBeLessThanOrEqual(80);
  });

  it('creates a deterministic environmental stress debug scenario with capped currency', () => {
    const first = createCombatState(bounds, 'ENV-STRESS-DEBUG-TEST', {
      skipEnemyWaves: true
    });
    const second = createCombatState(bounds, 'ENV-STRESS-DEBUG-TEST', {
      skipEnemyWaves: true
    });
    first.scrollDistance = 460;
    second.scrollDistance = 460;

    prepareDebugEnvironmentStressScenario(first, bounds);
    prepareDebugEnvironmentStressScenario(second, bounds);

    expect(
      first.environmentObjects.map((object) => [
        object.definitionId,
        object.kind,
        object.x,
        object.y,
        object.distance
      ])
    ).toEqual(
      second.environmentObjects.map((object) => [
        object.definitionId,
        object.kind,
        object.x,
        object.y,
        object.distance
      ])
    );
    expect(first.pickups.map((pickup) => [pickup.kind, pickup.value, pickup.source])).toEqual(
      second.pickups.map((pickup) => [pickup.kind, pickup.value, pickup.source])
    );
    expect(getCombatEntityCounts(first)).toEqual({
      total: 19,
      player: 1,
      enemies: 0,
      boss: 0,
      projectiles: 0,
      playerProjectiles: 0,
      enemyProjectiles: 0,
      pickups: 10,
      looseCurrencyPickups: 10,
      looseCurrencyValue: 32,
      looseCurrencyCredits: 24,
      looseCurrencySalvage: 8,
      looseCurrencyPickupCap: 48,
      looseCurrencyValueCap: 120,
      effects: 2,
      pickupsAndEffects: 12,
      telegraphs: 0,
      environmentObjects: 6,
      destructibles: 4,
      obstacles: 2
    });
    expect(first.player.invulnerableSeconds).toBeGreaterThan(0);
    expect(first.stats.looseCurrencySpawned).toBe(32);
    expect(first.stats.looseCurrencySuppressedValue).toBe(0);
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

  it('counts simultaneous formation member kills and completes a distance sector', () => {
    const formationSpawns = createFormationSpawnSchedule('formation-objective-simultaneous', 3);
    const plan = createFormationTargetPlan(3, 900);
    const state = createCombatState(bounds, 'FORMATION-SIMULTANEOUS-CLEAR', {
      spawnSchedule: formationSpawns,
      bossSpawnAtSeconds: null
    });
    state.nextSpawnIndex = formationSpawns.length;
    state.scrollDistance = 900;
    addFormationEnemy(state, formationSpawns[0], 1201, 240, 180);
    addFormationEnemy(state, formationSpawns[1], 1202, 320, 180);
    addFormationEnemy(state, formationSpawns[2], 1203, 400, 180);
    state.projectiles.push(
      createPlayerProjectile(1301, 240, 180, ['laser']),
      createPlayerProjectile(1302, 320, 180, ['laser']),
      createPlayerProjectile(1303, 400, 180, ['laser'])
    );

    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: 900 },
      1 / 60,
      bounds
    );

    expect(state.enemies).toHaveLength(0);
    expect(state.stats.enemiesDestroyed).toBe(3);
    expect(sumPickupValue(state, 'salvage')).toBe(4);
    expect(getObjectiveProgress(plan, state).complete).toBe(true);
  });

  it('counts item side-effect clears across formation members once', () => {
    const formationSpawns = createFormationSpawnSchedule('formation-objective-arc', 2);
    const plan = createFormationTargetPlan(2);
    const state = createCombatState(bounds, 'FORMATION-ARC-CLEAR', {
      spawnSchedule: formationSpawns,
      bossSpawnAtSeconds: null,
      items: [
        { itemId: 'item_split_prism', acquisitionOrder: 0 },
        { itemId: 'item_chain_arc_capacitor', acquisitionOrder: 1 }
      ]
    });
    state.nextSpawnIndex = formationSpawns.length;
    addFormationEnemy(state, formationSpawns[0], 1401, 300, 180, 1);
    addFormationEnemy(state, formationSpawns[1], 1402, 328, 180, 0.5);
    state.projectiles.push(createPlayerProjectile(1403, 300, 180, ['laser']));

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);

    expect(state.enemies).toHaveLength(0);
    expect(state.stats.enemiesDestroyed).toBe(2);
    expect(sumPickupValue(state, 'salvage')).toBe(3);
    expect(getObjectiveProgress(plan, state).complete).toBe(true);
  });

  it('separates despawned formation members from defeated targets without rewards', () => {
    const formationSpawns = createFormationSpawnSchedule('formation-objective-despawn', 2);
    const plan = createFormationTargetPlan(2);
    const state = createCombatState(bounds, 'FORMATION-DESPAWN-CLEAR', {
      spawnSchedule: formationSpawns,
      bossSpawnAtSeconds: null
    });
    state.nextSpawnIndex = formationSpawns.length;
    addFormationEnemy(state, formationSpawns[0], 1501, 300, bounds.height + 50, 1, 1000);
    addFormationEnemy(state, formationSpawns[1], 1502, 340, bounds.height + 50, 1, 1000);

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);

    expect(state.enemies).toHaveLength(0);
    expect(state.stats.enemiesDestroyed).toBe(0);
    expect(state.stats.enemiesEscaped).toBe(2);
    expect(state.pickups).toHaveLength(0);
    expect(getObjectiveProgress(plan, state).complete).toBe(true);
  });

  it('counts body-collided formation members as objective clears', () => {
    const formationSpawns = createFormationSpawnSchedule('formation-objective-body', 2);
    const plan = createFormationTargetPlan(2);
    const state = createCombatState(bounds, 'FORMATION-BODY-CLEAR', {
      spawnSchedule: formationSpawns,
      bossSpawnAtSeconds: null
    });
    state.nextSpawnIndex = formationSpawns.length;
    addFormationEnemy(state, formationSpawns[0], 1601, state.player.x, state.player.y);
    addFormationEnemy(state, formationSpawns[1], 1602, state.player.x + 4, state.player.y);

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);

    expect(state.enemies).toHaveLength(0);
    expect(state.stats.enemiesDestroyed).toBe(2);
    expect(state.stats.damageTaken).toBe(1);
    expect(state.pickups).toHaveLength(0);
    expect(getObjectiveProgress(plan, state).complete).toBe(true);
  });
});

function createRoleAttackTestState() {
  const state = createCombatState(bounds, 'ROLE-ATTACK-CADENCE', {
    skipEnemyWaves: true
  });
  state.player.x = 320;
  state.player.y = 650;
  state.player.invulnerableSeconds = 10;
  state.enemies.push(
    {
      id: 701,
      factionId: 'faction_scrap_court',
      x: 176,
      y: 132,
      radius: 17,
      hull: 2,
      maxHull: 2,
      drift: -18,
      targetY: 132,
      homeX: 176,
      fireCooldown: 0.01
    },
    {
      id: 702,
      factionId: 'faction_corporate_ledger',
      x: 272,
      y: 132,
      radius: 17,
      hull: 2,
      maxHull: 2,
      drift: 0,
      targetY: 132,
      homeX: 272,
      fireCooldown: 0.01
    },
    {
      id: 703,
      factionId: 'faction_bloom_hive',
      x: 368,
      y: 132,
      radius: 17,
      hull: 2,
      maxHull: 2,
      drift: 0,
      targetY: 132,
      homeX: 368,
      fireCooldown: 0.01
    },
    {
      id: 704,
      factionId: 'faction_void_corsairs',
      x: 464,
      y: 132,
      radius: 17,
      hull: 2,
      maxHull: 2,
      drift: 18,
      targetY: 132,
      homeX: 464,
      fireCooldown: 0.01
    }
  );
  state.nextId = 1000;

  return state;
}

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

function createFormationTargetPlan(requiredEnemyKills: number, sectorLength: number | null = null) {
  return createWaveDirectorPlan({
    seed: 'FORMATION-OBJECTIVE-PLAN',
    objective: {
      kind: 'clearWaves',
      label: 'Formation Objective Sweep',
      requiredWaves: 1,
      spawnsPerWave: requiredEnemyKills,
      requiredEnemyKills,
      bossRequired: false,
      bossSpawnAtSeconds: null
    },
    majorWaves: ['formation_objective'],
    preferredFactionId: 'faction_corporate_ledger',
    scroll:
      sectorLength === null
        ? undefined
        : {
            length: sectorLength,
            baseSpeed: 100
          },
    enableFormations: false
  });
}

function createFormationSpawnSchedule(
  formationInstanceId: string,
  spawnCount: number
): readonly EnemySpawn[] {
  return Array.from({ length: spawnCount }, (_, index) => ({
    atSeconds: 0,
    atDistance: null,
    waveIndex: 0,
    waveLabel: 'formation_objective',
    xRatio: 0.4 + index * 0.08,
    targetY: 140,
    hull: 1,
    fireDelay: 10,
    factionId: 'faction_corporate_ledger',
    formationId: 'formation_wedge',
    formationInstanceId,
    formationLabel: 'wedge',
    formationMemberIndex: index,
    formationMemberCount: spawnCount
  }));
}

function addFormationEnemy(
  state: CombatState,
  spawn: EnemySpawn | undefined,
  id: number,
  x: number,
  y: number,
  hull = 1,
  targetY = y
): void {
  if (!spawn) {
    throw new Error('Missing formation spawn fixture');
  }

  state.enemies.push({
    id,
    factionId: spawn.factionId,
    variantId: spawn.variantId ?? null,
    formationId: spawn.formationId ?? null,
    formationInstanceId: spawn.formationInstanceId ?? null,
    formationLabel: spawn.formationLabel ?? null,
    formationMemberIndex: spawn.formationMemberIndex ?? null,
    formationMemberCount: spawn.formationMemberCount ?? null,
    x,
    y,
    radius: 17,
    hull,
    maxHull: hull,
    drift: 0,
    targetY,
    homeX: x,
    fireCooldown: 10
  });
}

function createPlayerProjectile(
  id: number,
  x: number,
  y: number,
  tags: readonly ('laser' | 'missile' | 'plasma')[]
) {
  return {
    id,
    owner: 'player' as const,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: 8,
    damage: 1,
    ttl: 1,
    tags,
    procDepth: 0
  };
}

function sumPickupValue(state: CombatState, kind: 'credit' | 'salvage'): number {
  return state.pickups
    .filter((pickup) => pickup.kind === kind)
    .reduce((total, pickup) => total + pickup.value, 0);
}
