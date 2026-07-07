import { describe, expect, it } from 'vitest';

import { createEnemyRolePressureSummaryFromEnemies } from '../../src/game/EnemyRolePressure';

describe('EnemyRolePressure', () => {
  it('summarizes active enemy roles from faction metadata', () => {
    const summary = createEnemyRolePressureSummaryFromEnemies([
      { factionId: 'faction_corporate_ledger' },
      {
        factionId: 'faction_corporate_ledger',
        variantId: 'variant_armored',
        formationId: 'formation_screen'
      },
      { factionId: 'faction_scrap_court' },
      {
        factionId: 'faction_void_corsairs',
        variantId: 'variant_evasive',
        formationId: 'formation_pincer'
      },
      {
        factionId: 'faction_bloom_hive',
        variantId: 'variant_evasive',
        formationId: 'formation_staggered_lane'
      }
    ]);

    expect(summary.totalEnemies).toBe(5);
    expect(summary.roleCounts).toEqual([
      { role: 'scout', label: 'Scout', count: 1 },
      { role: 'bruiser', label: 'Bruiser', count: 1 },
      { role: 'screener', label: 'Screener', count: 2 },
      { role: 'disruptor', label: 'Disruptor', count: 1 }
    ]);
    expect(summary.objectivePolicyCounts).toEqual([
      { objectivePolicy: 'requiredTarget', count: 5 }
    ]);
    expect(summary.variantCounts).toEqual([
      { variantId: 'variant_armored', label: 'armored', count: 1 },
      { variantId: 'variant_evasive', label: 'evasive', count: 2 }
    ]);
    expect(summary.variantCount).toBe(3);
    expect(summary.formationCounts).toEqual([
      { formationId: 'formation_screen', label: 'screen', count: 1 },
      { formationId: 'formation_pincer', label: 'pincer', count: 1 },
      { formationId: 'formation_staggered_lane', label: 'stagger', count: 1 }
    ]);
    expect(summary.formationCount).toBe(3);
    expect(summary.enemyProjectiles).toBe(0);
    expect(summary.enemyProjectileBudget).toBe(54);
    expect(summary.telegraphs).toBe(0);
    expect(summary.telegraphBudget).toBe(6);
    expect(summary.withinStressBudget).toBe(true);
  });

  it('summarizes projectile and telegraph stress budgets', () => {
    const summary = createEnemyRolePressureSummaryFromEnemies(
      [{ factionId: 'faction_corporate_ledger' }],
      { enemyProjectiles: 36, telegraphs: 4 }
    );

    expect(summary.enemyProjectiles).toBe(36);
    expect(summary.enemyProjectileBudget).toBe(54);
    expect(summary.telegraphs).toBe(4);
    expect(summary.telegraphBudget).toBe(6);
    expect(summary.withinStressBudget).toBe(true);
  });

  it('keeps empty fields quiet for non-combat debug states', () => {
    const summary = createEnemyRolePressureSummaryFromEnemies([]);

    expect(summary).toEqual({
      totalEnemies: 0,
      roleCounts: [],
      objectivePolicyCounts: [],
      variantCounts: [],
      variantCount: 0,
      formationCounts: [],
      formationCount: 0,
      enemyProjectiles: 0,
      enemyProjectileBudget: 54,
      telegraphs: 0,
      telegraphBudget: 6,
      withinStressBudget: true
    });
  });
});
