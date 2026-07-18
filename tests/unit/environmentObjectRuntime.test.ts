import { describe, expect, it } from 'vitest';

import { getEnvironmentObjectById, type EnvironmentObjectId } from '../../src/content/environmentObjects';
import {
  createCombatState,
  damageEnvironmentObjectsInRadius,
  damageEnvironmentObjectsInRect,
  getActiveEnvironmentObjects,
  getEnvironmentObjectScreenState,
  getEnvironmentObjectScreenY,
  updateCombatState,
  type CombatBounds,
  type CombatState,
  type PickupState
} from '../../src/game/CombatState';
import type {
  EnvironmentObjectPlacement,
  EnvironmentObjectPlacementPlan
} from '../../src/game/EnvironmentObjectPlacement';

const bounds: CombatBounds = {
  width: 640,
  height: 720,
  padding: 24
};

describe('environment object runtime', () => {
  it('destroys destructibles without advancing enemy objective counts', () => {
    const plan = createPlan([{ definitionId: 'salvage_cache', x: 320, y: 260 }]);
    const first = createState('ENV-REWARD-SEED', plan);
    const second = createState('ENV-REWARD-SEED', plan);

    destroyWithProjectile(first, 320, 260, 'weapon', 12);
    destroyWithProjectile(second, 320, 260, 'weapon', 12);

    expect(first.stats.environmentObjectsDestroyed).toBe(1);
    expect(first.stats.enemiesDestroyed).toBe(0);
    expect(first.stats.environmentRewardsDropped).toBe(first.pickups.length);
    expect(first.pickups.length).toBeGreaterThan(0);
    expect(first.pickups.length).toBeLessThanOrEqual(3);
    expect(getActiveEnvironmentObjects(first)).toHaveLength(0);
    expect(getPickupSignature(first.pickups)).toEqual(getPickupSignature(second.pickups));
  });

  it('lets a phase shot traverse one obstacle before the next distinct obstacle consumes it', () => {
    const plan = createPlan([
      { definitionId: 'salvage_cache', x: 320, y: 260 },
      { definitionId: 'salvage_cache', x: 320, y: 260 }
    ]);
    const state = createState('ENV-PHASE-PIERCE-SEED', plan);
    state.scrollDistance = 40;
    state.projectiles.push({
      id: 9001,
      owner: 'player',
      x: 320,
      y: 260,
      vx: 0,
      vy: 0,
      radius: 8,
      damage: 1,
      ttl: 1,
      tags: ['phase'],
      procDepth: 0
    });

    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: 40 },
      0,
      bounds
    );

    expect(state.environmentObjects.map((object) => object.hull)).toEqual([3, 4]);
    expect(state.projectiles[0]).toMatchObject({
      tags: [],
      phasePiercedTargetKey: 'environment:1'
    });
    expect(state.effects.some((effect) => effect.kind === 'phaseCollapse')).toBe(true);

    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: 40 },
      0,
      bounds
    );

    expect(state.environmentObjects.map((object) => object.hull)).toEqual([3, 3]);
    expect(state.projectiles).toHaveLength(0);
  });

  it('dispatches explicit environment destruction hooks through item payloads', () => {
    const plan = createPlan([{ definitionId: 'salvage_cache', x: 320, y: 260 }]);
    const withoutDividend = createState('ENV-HOOK-SEED', plan);
    const withDividend = createState('ENV-HOOK-SEED', plan, [
      { itemId: 'item_salvage_dividend_chip', acquisitionOrder: 0 }
    ]);

    destroyWithProjectile(withoutDividend, 320, 260, 'weapon', 12);
    destroyWithProjectile(withDividend, 320, 260, 'weapon', 12);

    expect(withDividend.stats.itemTriggers).toBe(1);
    expect(sumPickupValue(withDividend.pickups, 'salvage')).toBe(
      sumPickupValue(withoutDividend.pickups, 'salvage') + 1
    );
    expect(withDividend.stats.enemiesDestroyed).toBe(0);
  });

  it('keeps chain reactions bounded while allowing secondary destruction', () => {
    const plan = createPlan([
      { definitionId: 'volatile_canister', x: 320, y: 260 },
      { definitionId: 'volatile_canister', x: 354, y: 260 },
      { definitionId: 'volatile_canister', x: 388, y: 260 },
      { definitionId: 'volatile_canister', x: 286, y: 260 },
      { definitionId: 'volatile_canister', x: 252, y: 260 },
      { definitionId: 'volatile_canister', x: 320, y: 304 },
      { definitionId: 'volatile_canister', x: 354, y: 304 },
      { definitionId: 'volatile_canister', x: 286, y: 304 }
    ]);
    const state = createState('ENV-CHAIN-SEED', plan);
    state.scrollDistance = 40;

    for (const object of state.environmentObjects.slice(1)) {
      object.hull = 1;
    }

    damageEnvironmentObjectsInRadius(state, 320, 260, 1, 'weapon', 12);

    expect(state.stats.environmentObjectsDestroyed).toBeGreaterThan(1);
    expect(state.stats.environmentChainReactions).toBeLessThanOrEqual(6);
    expect(state.stats.enemiesDestroyed).toBe(0);
  });

  it('uses scroll-world positions for active object collision and presentation', () => {
    const plan = createPlan([{ definitionId: 'salvage_cache', x: 320, y: 260, distance: 240 }]);
    const state = createState('ENV-SCROLL-WORLD-SEED', plan);
    const object = state.environmentObjects[0];

    if (!object) {
      throw new Error('Expected an environment object fixture.');
    }

    expect(getEnvironmentObjectScreenY(state, object)).toBe(20);
    expect(getEnvironmentObjectScreenState(state, object).y).toBe(20);
    expect(damageEnvironmentObjectsInRadius(state, 320, 260, 18, 'weapon', 12)).toBe(0);
    expect(damageEnvironmentObjectsInRadius(state, 320, 20, 18, 'weapon', 12)).toBe(1);
  });

  it('allows active hazard damage to clean up eligible obstacles safely', () => {
    const plan = createPlan([{ definitionId: 'wreck_plate', x: 320, y: 260 }]);
    const state = createState('ENV-HAZARD-SEED', plan);
    state.scrollDistance = 40;

    const damaged = damageEnvironmentObjectsInRect(
      state,
      { left: 240, top: 220, right: 400, bottom: 300 },
      'hazard',
      14
    );

    expect(damaged).toBe(1);
    expect(state.stats.environmentObjectsDestroyed).toBe(1);
    expect(state.stats.enemiesDestroyed).toBe(0);
  });

  it('pushes the player out of blocking obstacles and applies contact damage once', () => {
    const plan = createPlan([{ definitionId: 'wreck_plate', x: 320, y: 562 }]);
    const state = createState('ENV-CONTACT-SEED', plan);

    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: 40 },
      0,
      bounds
    );

    expect(state.stats.damageTaken).toBe(1);
    expect(playerOverlapsObject(state, state.environmentObjects[0])).toBe(false);
    expect(state.stats.enemiesDestroyed).toBe(0);
  });

  it('keeps side-wall obstacle contact escapable inside the safe frame', () => {
    const plan = createPlan([{ definitionId: 'lunar_rock_field', x: 92, y: 562 }]);
    const state = createState('ENV-SIDE-CONTACT-SEED', plan);
    state.player.x = 92;

    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: 40 },
      0,
      bounds
    );

    expect(state.player.x).toBeGreaterThanOrEqual(bounds.padding + state.player.radius);
    expect(state.player.x).toBeLessThanOrEqual(
      bounds.width - bounds.padding - state.player.radius
    );
    expect(state.player.y).toBeGreaterThanOrEqual(bounds.padding + state.player.radius);
    expect(state.player.y).toBeLessThanOrEqual(
      bounds.height - bounds.padding - state.player.radius
    );
    expect(playerOverlapsObject(state, state.environmentObjects[0])).toBe(false);
  });

  it('arms on proximity, telegraphs through a fixed-step fuse, and damages enemies', () => {
    const plan = createPlan([{ definitionId: 'proximity_mine', x: 320, y: 562 }]);
    const state = createState('MINE-PROXIMITY-SEED', plan);
    state.enemies.push(createEnemy(390, 562, 1));

    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: 40 },
      0,
      bounds
    );

    const mine = state.environmentObjects[0];
    expect(mine?.mineTriggerSource).toBe('proximity');
    expect(mine?.mineFuseSeconds).toBeCloseTo(0.8);
    expect(state.stats.proximityMinesTriggered).toBe(1);

    state.player.x = 600;
    advanceCombat(state, 9);

    expect(state.stats.proximityMinesDetonated).toBe(1);
    expect(state.stats.proximityMineEnemyHits).toBe(1);
    expect(state.stats.enemiesDestroyed).toBe(1);
    expect(state.enemies).toHaveLength(0);
    expect(state.effects.some((effect) => effect.kind === 'chainReaction')).toBe(true);
  });

  it('applies one standard player-damage unit per proximity mine blast', () => {
    const plan = createPlan([{ definitionId: 'proximity_mine', x: 320, y: 562 }]);
    const state = createState('MINE-PLAYER-DAMAGE-SEED', plan);
    const startingHull = state.player.hull;

    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: 40 },
      0,
      bounds
    );
    advanceCombat(state, 9);

    expect(state.stats.proximityMinesDetonated).toBe(1);
    expect(state.stats.damageTaken).toBe(1);
    expect(state.player.hull).toBe(startingHull - 1);
  });

  it('arms quickly from explosions while remaining tough against ordinary fire', () => {
    const plan = createPlan([{ definitionId: 'proximity_mine', x: 320, y: 260 }]);
    const state = createState('MINE-EXPLOSION-SEED', plan);
    state.scrollDistance = 40;
    const mine = state.environmentObjects[0];

    damageEnvironmentObjectsInRadius(state, 320, 260, 4, 'weapon', 1);
    expect(mine?.hull).toBeGreaterThan(6);
    expect(mine?.mineFuseSeconds).toBeNull();

    damageEnvironmentObjectsInRadius(state, 320, 260, 4, 'bomb', 1);
    expect(mine?.mineTriggerSource).toBe('damage');
    expect(mine?.mineFuseSeconds).toBeCloseTo(0.48);
  });

  it('chains nearby mines through shorter telegraphed fuses instead of instant removal', () => {
    const plan = createPlan([
      { definitionId: 'proximity_mine', x: 300, y: 562 },
      { definitionId: 'proximity_mine', x: 400, y: 562 }
    ]);
    const state = createState('MINE-CHAIN-SEED', plan);

    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: 40 },
      0,
      bounds
    );
    state.player.x = 600;
    advanceCombat(state, 9);

    const chainedMine = state.environmentObjects.find((object) => object.x === 400);
    expect(state.stats.proximityMinesDetonated).toBe(1);
    expect(chainedMine?.mineTriggerSource).toBe('chain');
    expect(chainedMine?.mineFuseSeconds).toBeGreaterThan(0);
    expect(chainedMine?.destroyed).toBe(false);

    advanceCombat(state, 3);
    expect(state.stats.proximityMinesTriggered).toBe(2);
    expect(state.stats.proximityMinesDetonated).toBe(2);
    expect(getActiveEnvironmentObjects(state)).toHaveLength(0);
  });
});

function createState(
  seed: string,
  environmentObjectPlan: EnvironmentObjectPlacementPlan,
  items: CombatState['items'] = []
): CombatState {
  return createCombatState(bounds, seed, {
    skipEnemyWaves: true,
    bossSpawnAtSeconds: null,
    environmentObjectPlan,
    items
  });
}

function destroyWithProjectile(
  state: CombatState,
  x: number,
  y: number,
  source: 'weapon' | 'special' | 'bomb',
  damage: number
): void {
  state.projectiles.push({
    id: 9000,
    owner: 'player',
    x,
    y,
    vx: 0,
    vy: 0,
    radius: 8,
    damage,
    ttl: 1,
    tags: source === 'bomb' ? ['bomb'] : source === 'special' ? ['phase'] : ['laser'],
    procDepth: 0,
    environmentDamageSource: source
  });

  updateCombatState(
    state,
    { movement: { x: 0, y: 0 }, fire: false, scrollDistance: 40 },
    0,
    bounds
  );
}

function createPlan(
  objects: ReadonlyArray<{
    readonly definitionId: EnvironmentObjectId;
    readonly x: number;
    readonly y: number;
    readonly distance?: number;
  }>
): EnvironmentObjectPlacementPlan {
  return {
    sectorId: 'sector_outer_debris_field',
    sectorIndex: 0,
    scrollLength: 1200,
    arenaWidth: bounds.width,
    arenaHeight: bounds.height,
    padding: bounds.padding,
    objects: objects.map((object, index): EnvironmentObjectPlacement => {
      const definition = getEnvironmentObjectById(object.definitionId);

      return {
        id: `test-env-${object.definitionId}-${index}`,
        definitionId: object.definitionId,
        collisionShape: definition.collision.shape,
        distance: object.distance ?? 40,
        x: object.x,
        y: object.y,
        width: definition.collision.width,
        height: definition.collision.height,
        radius: definition.collision.radius,
        safeLaneWidth: 300,
        debugLabel: definition.debugLabel
      };
    })
  };
}

function getPickupSignature(pickups: readonly PickupState[]): readonly string[] {
  return pickups
    .map((pickup) => `${pickup.kind}:${pickup.value}:${Math.round(pickup.x)}:${Math.round(pickup.y)}`)
    .sort();
}

function sumPickupValue(pickups: readonly PickupState[], kind: PickupState['kind']): number {
  return pickups
    .filter((pickup) => pickup.kind === kind)
    .reduce((total, pickup) => total + pickup.value, 0);
}

function playerOverlapsObject(state: CombatState, object: CombatState['environmentObjects'][number] | undefined): boolean {
  if (!object) {
    return false;
  }

  const screenObject = getEnvironmentObjectScreenState(state, object);

  if (object.collisionShape === 'circle') {
    const dx = state.player.x - screenObject.x;
    const dy = state.player.y - screenObject.y;
    const radiusSum = state.player.radius + object.radius;

    return dx * dx + dy * dy <= radiusSum * radiusSum;
  }

  const left = screenObject.x - object.width / 2;
  const right = screenObject.x + object.width / 2;
  const top = screenObject.y - object.height / 2;
  const bottom = screenObject.y + object.height / 2;
  const nearestX = Math.min(Math.max(state.player.x, left), right);
  const nearestY = Math.min(Math.max(state.player.y, top), bottom);
  const dx = state.player.x - nearestX;
  const dy = state.player.y - nearestY;

  return dx * dx + dy * dy <= state.player.radius * state.player.radius;
}

function advanceCombat(state: CombatState, steps: number): void {
  for (let index = 0; index < steps; index += 1) {
    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: 40 },
      0.1,
      bounds
    );
  }
}

function createEnemy(x: number, y: number, hull: number): CombatState['enemies'][number] {
  return {
    id: 8000,
    factionId: 'faction_scrap_court',
    x,
    y,
    radius: 16,
    hull,
    maxHull: hull,
    drift: 0,
    targetY: y,
    fireCooldown: 10
  };
}
