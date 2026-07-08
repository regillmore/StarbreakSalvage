import { describe, expect, it } from 'vitest';

import { getEnvironmentObjectById, type EnvironmentObjectId } from '../../src/content/environmentObjects';
import {
  createCombatState,
  damageEnvironmentObjectsInRadius,
  damageEnvironmentObjectsInRect,
  getActiveEnvironmentObjects,
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
        distance: 40,
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
