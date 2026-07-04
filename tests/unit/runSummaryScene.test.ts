import { describe, expect, it } from 'vitest';

import { createDefaultSaveData, type SaveUpdateResult } from '../../src/core/saveData';
import {
  buildSeedShareUrl,
  formatRouteHistory,
  formatUnlockReasons,
  formatUnlockSummary,
  getOutcomeDetail,
  getOutcomeLabel,
  getSummaryTitle
} from '../../src/ui/RunSummaryScene';
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
    expect(getOutcomeDetail(result)).toBe('Win: final boss salvaged.');
  });
});

describe('run summary details', () => {
  it('formats route history compactly', () => {
    expect(
      formatRouteHistory([
        {
          sectorIndex: 1,
          routeKind: 'shop',
          routeLabel: 'Shop',
          outcomeTitle: 'Coupon Ambush'
        }
      ])
    ).toBe('S1 Shop: Coupon Ambush');
  });

  it('explains achievement-backed unlock reasons', () => {
    const update: SaveUpdateResult = {
      data: createDefaultSaveData(),
      newUnlockIds: ['unlock_ship_phase_courier'],
      newAchievementIds: ['achievement_first_contract'],
      salvageEarned: 4
    };

    expect(formatUnlockReasons(update)).toContain('Liability Accepted');
    expect(formatUnlockSummary(update)).toContain('Unlocked: Phase Courier');
    expect(formatUnlockSummary(update)).toContain('complete any recorded contract outcome');
  });
});
