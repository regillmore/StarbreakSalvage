import { describe, expect, it } from 'vitest';

import {
  applyRunRecordToSave,
  createDefaultSaveData,
  exportSaveData,
  importSaveData,
  loadSaveData,
  resetSaveData,
  SAVE_SCHEMA_VERSION,
  SAVE_STORAGE_KEY,
  writeSaveData,
  type StorageLike
} from '../../src/core/saveData';

class MemoryStorage implements StorageLike {
  private readonly entries = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }

  public removeItem(key: string): void {
    this.entries.delete(key);
  }
}

describe('saveData', () => {
  it('creates a versioned default save', () => {
    const save = createDefaultSaveData();

    expect(save.version).toBe(SAVE_SCHEMA_VERSION);
    expect(save.salvageBank).toBe(0);
    expect(save.unlockedIds).toEqual([]);
  });

  it('loads corrupted localStorage safely as a repaired default', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_STORAGE_KEY, '{not json');

    const loaded = loadSaveData(storage);

    expect(loaded.repaired).toBe(true);
    expect(loaded.data).toEqual(createDefaultSaveData());
    expect(loaded.error).toContain('JSON');
  });

  it('migrates v1 saves into the current schema', () => {
    const migrated = importSaveData(
      JSON.stringify({
        version: 1,
        salvage: 12,
        unlockedIds: ['unlock_ship_scrap_monk'],
        stats: {
          runs: 3,
          sectorsCleared: 2,
          bossesDefeated: 1
        }
      })
    );

    expect(migrated.version).toBe(SAVE_SCHEMA_VERSION);
    expect(migrated.salvageBank).toBe(12);
    expect(migrated.stats.runsEnded).toBe(3);
    expect(migrated.stats.bossesDefeated).toBe(1);
    expect(migrated.unlockedIds).toContain('unlock_ship_scrap_monk');
  });

  it('round-trips through export and import', () => {
    const save = applyRunRecordToSave(createDefaultSaveData(), {
      seed: 'STARBREAK-SMOKE',
      contractId: 'contract_1',
      contractName: 'Debt Runner',
      reason: 'sectorComplete',
      survivedSeconds: 9,
      distanceTraveled: 1442,
      sectorLength: 1442,
      sectorsCleared: 1,
      bossesDefeated: 0,
      enemiesDestroyed: 2,
      creditsRecovered: 14,
      salvageRecovered: 3,
      itemTriggers: 1
    }).data;

    expect(importSaveData(exportSaveData(save))).toEqual(save);
  });

  it('preserves victory records through stats and import normalization', () => {
    const save = applyRunRecordToSave(createDefaultSaveData(), {
      seed: 'CORE-WRECK-VICTORY',
      contractId: 'contract_1',
      contractName: 'Debt Runner',
      reason: 'victory',
      survivedSeconds: 184,
      distanceTraveled: 2536,
      sectorLength: 2536,
      sectorsCleared: 5,
      bossesDefeated: 2,
      enemiesDestroyed: 28,
      creditsRecovered: 42,
      salvageRecovered: 9,
      itemTriggers: 6
    }).data;

    expect(save.lastRun?.reason).toBe('victory');
    expect(save.lastRun?.sectorsCleared).toBe(5);
    expect(save.lastRun?.distanceTraveled).toBe(2536);
    expect(save.lastRun?.sectorLength).toBe(2536);
    expect(save.stats.bestSectorsCleared).toBe(5);
    expect(save.stats.bestDistanceTraveled).toBe(2536);
    expect(importSaveData(exportSaveData(save)).lastRun?.reason).toBe('victory');
  });

  it('preserves destroyed-run distance records and normalizes older v2 saves', () => {
    const save = applyRunRecordToSave(createDefaultSaveData(), {
      seed: 'STARBREAK-SCROLL-SMOKE',
      contractId: 'contract_1',
      contractName: 'Debt Runner',
      reason: 'destroyed',
      survivedSeconds: 22,
      distanceTraveled: 687.9,
      sectorLength: 1442,
      sectorsCleared: 0,
      bossesDefeated: 0,
      enemiesDestroyed: 3,
      creditsRecovered: 10,
      salvageRecovered: 1,
      itemTriggers: 0
    }).data;

    expect(save.stats.distanceTraveled).toBe(687);
    expect(save.stats.bestDistanceTraveled).toBe(687);
    expect(save.lastRun?.distanceTraveled).toBe(687);
    expect(save.lastRun?.sectorLength).toBe(1442);

    const normalized = importSaveData(
      JSON.stringify({
        version: SAVE_SCHEMA_VERSION,
        salvageBank: 0,
        unlockedIds: [],
        achievementIds: [],
        stats: {
          runsEnded: 1
        },
        lastRun: {
          seed: 'OLD-V2',
          contractId: 'contract_1',
          contractName: 'Debt Runner',
          reason: 'abandoned',
          sectorsCleared: 0,
          survivedSeconds: 4,
          salvageRecovered: 0
        }
      })
    );

    expect(normalized.stats.distanceTraveled).toBe(0);
    expect(normalized.lastRun?.distanceTraveled).toBe(0);
    expect(normalized.lastRun?.sectorLength).toBeNull();
  });

  it('applies run records to stats, salvage bank, achievements, and unlocks', () => {
    const update = applyRunRecordToSave(createDefaultSaveData(), {
      seed: 'LASER-TAX-404',
      contractId: 'contract_1',
      contractName: 'Missile Accountant',
      reason: 'debug',
      survivedSeconds: 6,
      distanceTraveled: 402,
      sectorLength: 1442,
      sectorsCleared: 1,
      bossesDefeated: 0,
      enemiesDestroyed: 1,
      creditsRecovered: 16,
      salvageRecovered: 2,
      itemTriggers: 2
    });

    expect(update.salvageEarned).toBe(2);
    expect(update.data.salvageBank).toBe(2);
    expect(update.data.stats.runsEnded).toBe(1);
    expect(update.data.achievementIds).toEqual([
      'achievement_first_contract',
      'achievement_salvage_receipt',
      'achievement_route_surveyor',
      'achievement_credit_float',
      'achievement_build_crafter'
    ]);
    expect(update.newUnlockIds).toContain('unlock_ship_phase_courier');
    expect(update.newUnlockIds).toContain('unlock_item_executive_override');
    expect(update.newUnlockIds).toContain('unlock_challenge_debt_ceiling');
    expect(update.newUnlockIds).toContain('unlock_music_outer_debris');
  });

  it('writes and resets save data through storage', () => {
    const storage = new MemoryStorage();
    const save = {
      ...createDefaultSaveData(),
      salvageBank: 4
    };

    writeSaveData(storage, save);
    expect(loadSaveData(storage).data.salvageBank).toBe(4);

    expect(resetSaveData(storage)).toEqual(createDefaultSaveData());
    expect(storage.getItem(SAVE_STORAGE_KEY)).toBeNull();
  });
});
