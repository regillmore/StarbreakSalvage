import { describe, expect, it } from 'vitest';

import { createDefaultSaveData, applyRunRecordToSave } from '../../src/core/saveData';
import {
  createCombatState,
  forceCombatEnd,
  updateCombatState,
  type CombatBounds
} from '../../src/game/CombatState';
import {
  LOOSE_CURRENCY_ACTIVE_VALUE_CAP,
  createLooseCurrencyPlan,
  createLooseCurrencyScatter,
  summarizeLooseCurrencyPickups,
  type LooseCurrencyPlan
} from '../../src/game/LooseCurrency';
import { createRunSummaryProgressModel } from '../../src/ui/RunSummaryProgress';

const bounds: CombatBounds = {
  width: 640,
  height: 720,
  padding: 24
};

describe('loose currency planning', () => {
  it('creates deterministic scatter specs from explicit event payloads', () => {
    const first = createLooseCurrencyScatter({
      seed: 'LOOSE-SCATTER',
      sourceId: 'enemy-7',
      source: 'enemy',
      x: 320,
      y: 160,
      credits: 5,
      salvage: 2,
      maxPickups: 4
    });
    const second = createLooseCurrencyScatter({
      seed: 'LOOSE-SCATTER',
      sourceId: 'enemy-7',
      source: 'enemy',
      x: 320,
      y: 160,
      credits: 5,
      salvage: 2,
      maxPickups: 4
    });

    expect(first).toEqual(second);
    expect(first.reduce((total, pickup) => total + pickup.value, 0)).toBe(7);
    expect(first.map((pickup) => pickup.source)).toEqual(['enemy', 'enemy', 'salvage'].map(() => 'enemy'));
    expect(first.every((pickup) => pickup.ttl > 0 && pickup.collectionRadius > pickup.radius)).toBe(
      true
    );
  });

  it('creates capped deterministic route, hazard, feature, and obstacle lanes', () => {
    const plan = createLooseCurrencyPlan({
      seed: 'LOOSE-PLAN',
      sectorId: 'sector_outer_debris_field',
      sectorIndex: 3,
      scrollLength: 1800,
      routeEventBias: 'hazard',
      hazards: [
        {
          id: 'storm-1',
          kind: 'salvage_storm',
          telegraphDistance: 520,
          startDistance: 600,
          endDistance: 760,
          xRatio: 0.42,
          widthRatio: 0.22,
          label: 'salvage storm'
        }
      ],
      landmarks: [
        {
          id: 'vault-1',
          kind: 'vault_door',
          distance: 900,
          xRatio: 0.66,
          label: 'vault door'
        }
      ],
      environmentObjects: [
        {
          id: 'gate-1',
          layoutRole: 'gate',
          distance: 1100,
          x: 404,
          debugLabel: 'gate wreck'
        }
      ]
    });
    const repeated = createLooseCurrencyPlan({
      seed: 'LOOSE-PLAN',
      sectorId: 'sector_outer_debris_field',
      sectorIndex: 3,
      scrollLength: 1800,
      routeEventBias: 'hazard',
      hazards: [
        {
          id: 'storm-1',
          kind: 'salvage_storm',
          telegraphDistance: 520,
          startDistance: 600,
          endDistance: 760,
          xRatio: 0.42,
          widthRatio: 0.22,
          label: 'salvage storm'
        }
      ],
      landmarks: [
        {
          id: 'vault-1',
          kind: 'vault_door',
          distance: 900,
          xRatio: 0.66,
          label: 'vault door'
        }
      ],
      environmentObjects: [
        {
          id: 'gate-1',
          layoutRole: 'gate',
          distance: 1100,
          x: 404,
          debugLabel: 'gate wreck'
        }
      ]
    });

    expect(plan).toEqual(repeated);
    expect(plan.events.map((event) => event.source)).toEqual([
      'routeEvent',
      'hazard',
      'sectorFeature',
      'obstacle'
    ]);
    expect(plan.events.every((event) => event.distance > 0 && event.distance < 1800)).toBe(true);
    expect(plan.events.reduce((total, event) => total + event.credits + event.salvage * 4, 0)).toBeLessThanOrEqual(
      24
    );
  });
});

describe('loose currency runtime', () => {
  it('applies pickup magneting and collection in fixed arena units', () => {
    const state = createCombatState(bounds, 'LOOSE-MAGNET', {
      skipEnemyWaves: true,
      bossSpawnAtSeconds: null
    });
    state.pickups.push({
      id: 999,
      kind: 'credit',
      x: state.player.x + 140,
      y: state.player.y,
      vx: 0,
      vy: 0,
      radius: 7,
      value: 2,
      ttl: 8,
      collectionRadius: 18,
      source: 'routeEvent',
      tier: 'chip',
      debugLabel: 'test lane'
    });

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);

    expect(state.pickups[0]?.vx).toBeLessThan(0);
    expect(state.pickups[0]?.ttl).toBeLessThan(8);

    if (!state.pickups[0]) {
      throw new Error('Expected loose pickup to remain before collection.');
    }

    state.pickups[0].x = state.player.x;
    state.pickups[0].y = state.player.y;

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);

    expect(state.player.credits).toBe(2);
    expect(state.stats.pickupsCollected).toBe(1);
    expect(state.stats.looseCurrencyCollected).toBe(2);
    expect(state.pickups).toHaveLength(0);
  });

  it('enforces active loose currency value caps and exposes debug counts', () => {
    const state = createCombatState(bounds, 'LOOSE-CAP', {
      skipEnemyWaves: true,
      bossSpawnAtSeconds: null,
      looseCurrencyPlan: createManualPlan({
        credits: LOOSE_CURRENCY_ACTIVE_VALUE_CAP + 20,
        salvage: 0
      })
    });

    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: 1 },
      1 / 60,
      bounds
    );

    const summary = summarizeLooseCurrencyPickups(state.pickups);

    expect(summary.activeValue).toBeLessThanOrEqual(LOOSE_CURRENCY_ACTIVE_VALUE_CAP);
    expect(state.stats.looseCurrencySpawned).toBe(summary.activeValue);
    expect(state.stats.looseCurrencySuppressedValue).toBeGreaterThan(0);
  });

  it('keeps run result, fresh save, and progressed upgrade accounting accurate after collection', () => {
    const state = createCombatState(bounds, 'LOOSE-SAVE', {
      skipEnemyWaves: true,
      bossSpawnAtSeconds: null,
      looseCurrencyPlan: createManualPlan({ credits: 4, salvage: 3 })
    });

    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: 1 },
      1 / 60,
      bounds
    );

    for (const pickup of state.pickups) {
      pickup.x = state.player.x;
      pickup.y = state.player.y;
    }

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);

    const result = forceCombatEnd(state, 'debug');
    const freshUpdate = applyRunRecordToSave(createDefaultSaveData(), {
      seed: 'LOOSE-SAVE',
      contractId: 'contract_test',
      contractName: 'Test Contract',
      reason: result.reason,
      survivedSeconds: result.survivedSeconds,
      distanceTraveled: result.distanceTraveled,
      sectorLength: result.sectorLength,
      sectorsCleared: 0,
      bossesDefeated: result.bossesDefeated,
      enemiesDestroyed: result.enemiesDestroyed,
      creditsRecovered: result.credits,
      salvageRecovered: result.salvage,
      itemTriggers: result.itemTriggers
    });
    const progressedSave = {
      ...createDefaultSaveData(),
      salvageBank: 2
    };
    const progressedUpdate = applyRunRecordToSave(progressedSave, {
      seed: 'LOOSE-SAVE',
      contractId: 'contract_test',
      contractName: 'Test Contract',
      reason: result.reason,
      survivedSeconds: result.survivedSeconds,
      distanceTraveled: result.distanceTraveled,
      sectorLength: result.sectorLength,
      sectorsCleared: 0,
      bossesDefeated: result.bossesDefeated,
      enemiesDestroyed: result.enemiesDestroyed,
      creditsRecovered: result.credits,
      salvageRecovered: result.salvage,
      itemTriggers: result.itemTriggers
    });
    const progress = createRunSummaryProgressModel(progressedUpdate.data, progressedUpdate);

    expect(result.credits).toBe(4);
    expect(result.salvage).toBe(3);
    expect(state.stats.looseCurrencyCollected).toBe(7);
    expect(freshUpdate.data.salvageBank).toBe(3);
    expect(progress.previousSalvageBank).toBe(2);
    expect(progress.currentSalvageBank).toBe(5);
    expect(progress.newlyAffordableUpgrades.length).toBeGreaterThan(0);
  });
});

function createManualPlan(values: {
  readonly credits: number;
  readonly salvage: number;
}): LooseCurrencyPlan {
  return {
    seed: 'LOOSE-MANUAL',
    sectorId: 'sector_test',
    sectorIndex: 0,
    scrollLength: 1000,
    events: [
      {
        id: 'manual-lane',
        source: 'routeEvent',
        distance: 0,
        xRatio: 0.5,
        credits: values.credits,
        salvage: values.salvage,
        spread: 0,
        baseVy: 0,
        label: 'manual lane'
      }
    ]
  };
}
