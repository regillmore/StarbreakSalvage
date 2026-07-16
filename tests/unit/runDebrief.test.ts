import { describe, expect, it } from 'vitest';

import { createDefaultSaveData, type SaveUpdateResult } from '../../src/core/saveData';
import { createEngineeringState, type EngineeringActionRecord } from '../../src/game/Foundry';
import { generateRunSkeleton } from '../../src/game/Generation';
import {
  createRunDebriefModel,
  formatRunDuration,
  getRunDebriefSectorsCleared
} from '../../src/game/RunDebrief';
import type { ItemInstance } from '../../src/game/Rewards';
import type { RouteHistoryEntry } from '../../src/game/RunSession';

describe('createRunDebriefModel', () => {
  it('projects a bounded player-facing debrief from a long hard-route run', () => {
    const run = generateRunSkeleton('DEBRIEF-147-HARD');
    const contract = run.contracts[0];
    if (!contract) throw new Error('Expected a generated contract.');

    const hardPath = [0, 2, 5, 7, 8] as const;
    const routeHistory: RouteHistoryEntry[] = hardPath.slice(0, -1).map((sectorIndex, index) => ({
      sectorIndex: sectorIndex + 1,
      targetSectorIndex: hardPath[index + 1]! + 1,
      routeKind: 'elite',
      routeLabel: 'Elite',
      outcomeTitle: `Hard turn ${index + 1}`
    }));
    const engineering = createEngineeringState(contract.loadout);
    const history: EngineeringActionRecord[] = Array.from({ length: 12 }, (_, index) => ({
      id: `engineering-${index}`,
      kind: 'install',
      sectorIndex: index,
      summary: `Installed a deterministic signal component ${index} ${'with a very long diagnostic suffix '.repeat(6)}`,
      componentIds: [],
      beforeSignature: `before-${index}`,
      afterSignature: `after-${index}`
    }));
    const items: ItemInstance[] = Array.from({ length: 9 }, (_, acquisitionOrder) => ({
      itemId: 'item_route_ledger_spool',
      acquisitionOrder
    }));
    const saveUpdate: SaveUpdateResult = {
      data: createDefaultSaveData(),
      newUnlockIds: ['unlock_ship_phase_courier'],
      newAchievementIds: ['achievement_first_contract'],
      salvageEarned: 12
    };

    const model = createRunDebriefModel({
      run,
      contract,
      result: {
        reason: 'destroyed',
        survivedSeconds: 725,
        distanceTraveled: 2410,
        sectorLength: 2800,
        credits: 91,
        salvage: 38,
        enemiesDestroyed: 77,
        bossesDefeated: 4,
        shotsFired: 1400,
        pickupsCollected: 32,
        damageTaken: 6,
        itemTriggers: 80,
        itemNames: []
      },
      currentSectorIndex: hardPath.at(-1)!,
      routeHistory,
      interActChoices: [],
      itemInstances: items,
      engineering: { ...engineering, history },
      saveUpdate
    });

    expect(model.metrics).toHaveLength(6);
    expect(model.metrics[0]).toEqual({ label: 'Run time', value: '12:05' });
    expect(model.routeActs[0]?.nodeLabels).toEqual(['1A', '2B', '3C', '4B', '5A']);
    expect(model.items).toHaveLength(3);
    expect(model.omittedItemCount).toBe(6);
    expect(model.highlights.length).toBeLessThanOrEqual(3);
    expect(model.highlights.every((highlight) => highlight.detail.length <= 112)).toBe(true);
    expect(model.highlights[0]?.title).toBe('Phase Courier');
    expect(model.reached).toBe(run.sectors[hardPath.at(-1)!]?.sectorName);
    expect(JSON.stringify(model)).not.toContain('Engineering History');
  });

  it('formats duration without allowing negative time', () => {
    expect(formatRunDuration(0)).toBe('0:00');
    expect(formatRunDuration(65.9)).toBe('1:05');
    expect(formatRunDuration(-4)).toBe('0:00');
  });

  it('counts route layers across direct act handoffs without relying on route-choice records', () => {
    const run = generateRunSkeleton('DEBRIEF-147-ACTS');
    const result = {
      reason: 'destroyed' as const,
      survivedSeconds: 0,
      distanceTraveled: 0,
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
    };

    expect(getRunDebriefSectorsCleared(run, 9, [], result)).toBe(5);
    expect(getRunDebriefSectorsCleared(run, 17, [], { ...result, reason: 'victory' })).toBe(10);
    expect(getRunDebriefSectorsCleared(run, 26, [], { ...result, reason: 'victory' })).toBe(15);
  });
});
