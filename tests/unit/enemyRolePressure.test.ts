import { describe, expect, it } from 'vitest';

import { createEnemyRolePressureSummaryFromEnemies } from '../../src/game/EnemyRolePressure';

describe('EnemyRolePressure', () => {
  it('summarizes active enemy roles from faction metadata', () => {
    const summary = createEnemyRolePressureSummaryFromEnemies([
      { factionId: 'faction_corporate_ledger' },
      { factionId: 'faction_corporate_ledger' },
      { factionId: 'faction_scrap_court' },
      { factionId: 'faction_void_corsairs' },
      { factionId: 'faction_bloom_hive' }
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
    expect(summary.variantCount).toBe(0);
    expect(summary.formationCount).toBe(0);
  });

  it('keeps empty fields quiet for non-combat debug states', () => {
    const summary = createEnemyRolePressureSummaryFromEnemies([]);

    expect(summary).toEqual({
      totalEnemies: 0,
      roleCounts: [],
      objectivePolicyCounts: [],
      variantCount: 0,
      formationCount: 0
    });
  });
});
