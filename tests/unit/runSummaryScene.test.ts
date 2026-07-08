import { describe, expect, it } from 'vitest';

import { createDefaultSaveData, type SaveUpdateResult } from '../../src/core/saveData';
import {
  buildSeedShareUrl,
  formatActRouteHistory,
  formatDistanceSummary,
  formatRouteHistory,
  formatUnlockReasons,
  formatUnlockSummary,
  getOutcomeDetail,
  getOutcomeLabel,
  getSummaryTitle
} from '../../src/ui/RunSummaryScene';
import type { CombatRunResult } from '../../src/game/CombatState';
import { generateRunSkeleton } from '../../src/game/Generation';
import {
  advanceSector,
  applyRouteOutcome,
  createRunSession,
  getCurrentSector
} from '../../src/game/RunSession';
import { generateRouteOutcome } from '../../src/game/RouteEvents';
import { formatSectorConditionTimeline } from '../../src/game/SectorConditions';

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
      distanceTraveled: 2536,
      sectorLength: 2536,
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
    expect(formatDistanceSummary(result)).toBe('2536/2536u');
  });

  it('formats death and abandon distance summaries', () => {
    expect(
      formatDistanceSummary({
        reason: 'destroyed',
        survivedSeconds: 12,
        distanceTraveled: 512.9,
        sectorLength: 1442,
        credits: 0,
        salvage: 0,
        enemiesDestroyed: 1,
        bossesDefeated: 0,
        shotsFired: 20,
        pickupsCollected: 0,
        damageTaken: 3,
        itemTriggers: 0,
        itemNames: []
      })
    ).toBe('512/1442u');
    expect(
      formatDistanceSummary({
        reason: 'abandoned',
        survivedSeconds: 4,
        distanceTraveled: 245.2,
        sectorLength: null,
        credits: 0,
        salvage: 0,
        enemiesDestroyed: 0,
        bossesDefeated: 0,
        shotsFired: 0,
        pickupsCollected: 0,
        damageTaken: 0,
        itemTriggers: 0,
        itemNames: []
      })
    ).toBe('245u');
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
    expect(
      formatActRouteHistory([
        {
          sectorIndex: 1,
          actId: 'act_outer_rim',
          actName: 'Outer Rim Contract',
          actShortLabel: 'Act I',
          actIndex: 1,
          actSectorIndex: 1,
          actSectorCount: 3,
          routeKind: 'shop',
          routeLabel: 'Shop',
          outcomeTitle: 'Coupon Ambush'
        }
      ])
    ).toBe('Act I 1/3 S1 Shop: Coupon Ambush');
  });

  it('records physical route effects for run summaries', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const contract = run.contracts[0];

    if (!contract) {
      throw new Error('Expected contract.');
    }

    const session = createRunSession(run, contract);
    const sector = getCurrentSector(run, session);
    const route = {
      kind: 'glitch' as const,
      label: 'Glitch',
      risk: 4,
      rewardHint: 'test route'
    };

    applyRouteOutcome(
      session,
      sector,
      route,
      generateRouteOutcome({
        run,
        sector,
        route,
        availableCredits: session.credits
      })
    );
    advanceSector(run, session);

    expect(formatSectorConditionTimeline(run, session.routeOutcomes)).toBe(
      'S2 Glitch shear: +12% scroll, +2% distance, +1 hazard, landmark beacon_line, -10% boss approach'
    );
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
