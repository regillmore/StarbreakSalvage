import { describe, expect, it } from 'vitest';

import { buildSeedShareUrl, getOutcomeLabel, getSummaryTitle } from '../../src/ui/RunSummaryScene';
import type { CombatRunResult } from '../../src/game/CombatState';

describe('buildSeedShareUrl', () => {
  it('creates a clean share link for the active seed', () => {
    expect(
      buildSeedShareUrl(
        'https://example.test/StarbreakSalvage/?debug=1&mode=smoke#summary',
        'LASER-TAX-404'
      )
    ).toBe('https://example.test/StarbreakSalvage/?mode=smoke&seed=LASER-TAX-404');
  });

  it('replaces an existing seed parameter', () => {
    expect(
      buildSeedShareUrl('https://example.test/StarbreakSalvage/?seed=OLD-SEED', 'VOID-CORSAIR-7')
    ).toBe('https://example.test/StarbreakSalvage/?seed=VOID-CORSAIR-7');
  });
});

describe('run summary labels', () => {
  it('uses a distinct title and outcome for victory', () => {
    const result: CombatRunResult = {
      reason: 'victory',
      survivedSeconds: 182,
      credits: 24,
      salvage: 8,
      enemiesDestroyed: 32,
      bossesDefeated: 2,
      shotsFired: 140,
      pickupsCollected: 12,
      damageTaken: 1,
      itemTriggers: 4,
      itemNames: ['Split Prism']
    };

    expect(getSummaryTitle(result)).toBe('Victory Confirmed');
    expect(getOutcomeLabel(result)).toBe('final boss salvaged');
  });
});
