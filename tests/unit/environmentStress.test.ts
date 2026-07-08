import { describe, expect, it } from 'vitest';

import { createEnvironmentStressDebugState } from '../../src/game/EnvironmentStress';
import type { CombatEntityCounts } from '../../src/game/CombatState';
import type { ActiveSectorHazard } from '../../src/game/SectorFeatures';

describe('createEnvironmentStressDebugState', () => {
  it('summarizes hazard labels, physical objects, loose currency, and budget status', () => {
    const summary = createEnvironmentStressDebugState(
      [
        createHazard('mine_belt'),
        createHazard('salvage_storm'),
        createHazard('mine_belt')
      ],
      createCounts({
        environmentObjects: 6,
        destructibles: 4,
        obstacles: 2,
        looseCurrencyPickups: 12,
        looseCurrencyValue: 32
      })
    );

    expect(summary).toEqual({
      activeHazards: 3,
      hazardBudget: 4,
      hazardLabels: ['mines', 'storm'],
      environmentObjects: 6,
      environmentObjectBudget: 16,
      destructibles: 4,
      obstacles: 2,
      loosePickups: 12,
      loosePickupCap: 48,
      looseValue: 32,
      looseValueCap: 120,
      withinBudget: true
    });
  });

  it('marks stress as watch when active counts exceed current budgets', () => {
    const summary = createEnvironmentStressDebugState(
      [
        createHazard('mine_belt'),
        createHazard('salvage_storm'),
        createHazard('warning_beam'),
        createHazard('debris_lane'),
        createHazard('crush_gate')
      ],
      createCounts({
        environmentObjects: 17,
        destructibles: 9,
        obstacles: 8,
        looseCurrencyPickups: 49,
        looseCurrencyValue: 121
      })
    );

    expect(summary.withinBudget).toBe(false);
  });
});

function createHazard(kind: ActiveSectorHazard['hazard']['kind']): ActiveSectorHazard {
  return {
    hazard: {
      id: `hazard-${kind}`,
      kind,
      telegraphDistance: 100,
      startDistance: 140,
      endDistance: 240,
      xRatio: 0.5,
      widthRatio: 0.2,
      damage: 1,
      label: kind
    },
    phase: 'active',
    progress: 0.5,
    phaseProgress: 0.5
  };
}

function createCounts(overrides: Partial<CombatEntityCounts>): CombatEntityCounts {
  return {
    total: 0,
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
    obstacles: 0,
    ...overrides
  };
}
