import { describe, expect, it } from 'vitest';

import {
  applyRunRecordToSave,
  createDefaultSaveData,
  exportSaveData,
  getSaveSummary,
  getUpgradeAffordability,
  importSaveData,
  LEGACY_SAVE_STORAGE_KEYS,
  loadSaveData,
  purchaseUpgrade,
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
    expect(save.purchasedUpgradeIds).toEqual([]);
    expect(save.discoveredItemIds).toEqual([]);
    expect(save.discoveredItemFamilyIds).toEqual([]);
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
    expect(migrated.stats.victories).toBe(0);
    expect(migrated.unlockedIds).toContain('unlock_ship_scrap_monk');
    expect(migrated.purchasedUpgradeIds).toEqual([]);
  });

  it('migrates legacy v2 saves with empty upgrade state', () => {
    const migrated = importSaveData(
      JSON.stringify({
        version: 2,
        salvageBank: 9,
        unlockedIds: ['unlock_ship_scrap_monk'],
        achievementIds: [],
        stats: {
          runsEnded: 2,
          salvageRecovered: 9
        },
        lastRun: {
          seed: 'OLD-V2',
          contractId: 'contract_1',
          contractName: 'Debt Runner',
          reason: 'sectorComplete',
          sectorsCleared: 1,
          survivedSeconds: 12,
          distanceTraveled: 1442,
          sectorLength: 1442,
          salvageRecovered: 4
        }
      })
    );

    expect(migrated.version).toBe(SAVE_SCHEMA_VERSION);
    expect(migrated.salvageBank).toBe(9);
    expect(migrated.stats.runsEnded).toBe(2);
    expect(migrated.lastRun?.seed).toBe('OLD-V2');
    expect(migrated.purchasedUpgradeIds).toEqual([]);
    expect(migrated.discoveredItemIds).toEqual([]);
    expect(migrated.discoveredItemFamilyIds).toEqual([]);
  });

  it('migrates v4 saves and normalizes missing expedition summary fields', () => {
    const migrated = importSaveData(
      JSON.stringify({
        version: 4,
        salvageBank: 11,
        unlockedIds: [],
        purchasedUpgradeIds: [],
        achievementIds: [],
        discoveredItemIds: [],
        discoveredItemFamilyIds: [],
        stats: { runsEnded: 1 },
        lastRun: {
          seed: 'PHASE9-LEGACY',
          contractId: 'contract_1',
          contractName: 'Debt Runner',
          reason: 'victory',
          sectorsCleared: 10,
          survivedSeconds: 360,
          salvageRecovered: 7
        }
      })
    );

    expect(migrated.version).toBe(SAVE_SCHEMA_VERSION);
    expect(migrated.salvageBank).toBe(11);
    expect(migrated.lastRun).toEqual(
      expect.objectContaining({
        seed: 'PHASE9-LEGACY',
        expeditionGraphId: null,
        expeditionVisitedNodeIds: [],
        expeditionDecisionIds: [],
        expeditionTargetSeconds: null
      })
    );
  });

  it('round-trips through export and import', () => {
    const runSave = applyRunRecordToSave(createDefaultSaveData(), {
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
      itemTriggers: 1,
      itemIds: ['item_split_prism', 'item_relic_ash_compass']
    }).data;
    const save = purchaseUpgrade(
      {
        ...runSave,
        salvageBank: 6
      },
      'upgrade_contract_survey_rig'
    ).data;

    expect(save.discoveredItemIds).toEqual(['item_split_prism', 'item_relic_ash_compass']);
    expect(save.discoveredItemFamilyIds).toEqual(['laser-split', 'curse-relic']);
    expect(importSaveData(exportSaveData(save))).toEqual(save);
  });

  it('normalizes imported discovery records and derives item families', () => {
    const imported = importSaveData(
      JSON.stringify({
        version: SAVE_SCHEMA_VERSION,
        salvageBank: 0,
        unlockedIds: [],
        purchasedUpgradeIds: [],
        achievementIds: [],
        discoveredItemIds: ['item_split_prism', 'missing_item', 'item_split_prism'],
        discoveredItemFamilyIds: ['route-economy', 'missing_family'],
        stats: {},
        lastRun: null
      })
    );

    expect(imported.discoveredItemIds).toEqual(['item_split_prism']);
    expect(imported.discoveredItemFamilyIds).toEqual(['route-economy', 'laser-split']);
  });

  it('preserves victory records through stats and import normalization', () => {
    const save = applyRunRecordToSave(createDefaultSaveData(), {
      seed: 'CORE-WRECK-VICTORY',
      contractId: 'contract_1',
      contractName: 'Debt Runner',
      reason: 'victory',
      actId: 'act_core_descent',
      actName: 'Core Descent',
      actShortLabel: 'Act II',
      actIndex: 2,
      actSectorIndex: 2,
      actSectorCount: 2,
      actsCompleted: 2,
      finaleVariantId: 'reactorBreach',
      finaleVariantName: 'Reactor Breach',
      finaleCleared: true,
      expeditionGraphId: 'expedition_core-wreck_091',
      expeditionVisitedNodeIds: ['expedition_s01_ingress', 'expedition_s01_operation'],
      expeditionDecisionIds: [
        'expedition_branch_s01_opportunity:expedition_branch_s01_opportunity_detour'
      ],
      expeditionTargetSeconds: 962,
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
    expect(save.lastRun?.actId).toBe('act_core_descent');
    expect(save.lastRun?.actName).toBe('Core Descent');
    expect(save.lastRun?.actShortLabel).toBe('Act II');
    expect(save.lastRun?.actIndex).toBe(2);
    expect(save.lastRun?.actSectorIndex).toBe(2);
    expect(save.lastRun?.actSectorCount).toBe(2);
    expect(save.lastRun?.actsCompleted).toBe(2);
    expect(save.lastRun?.finaleVariantId).toBe('reactorBreach');
    expect(save.lastRun?.finaleVariantName).toBe('Reactor Breach');
    expect(save.lastRun?.finaleCleared).toBe(true);
    expect(save.lastRun?.expeditionGraphId).toBe('expedition_core-wreck_091');
    expect(save.lastRun?.expeditionVisitedNodeIds).toEqual([
      'expedition_s01_ingress',
      'expedition_s01_operation'
    ]);
    expect(save.lastRun?.expeditionDecisionIds).toHaveLength(1);
    expect(save.lastRun?.expeditionTargetSeconds).toBe(962);
    expect(save.lastRun?.sectorsCleared).toBe(5);
    expect(save.lastRun?.distanceTraveled).toBe(2536);
    expect(save.lastRun?.sectorLength).toBe(2536);
    expect(save.stats.victories).toBe(1);
    expect(save.stats.bestSectorsCleared).toBe(5);
    expect(save.stats.bestDistanceTraveled).toBe(2536);
    expect(save.achievementIds).toContain('achievement_core_finale');
    expect(save.unlockedIds).toContain('unlock_music_core_descent');
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
        purchasedUpgradeIds: [],
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
    expect(normalized.lastRun?.actId).toBeNull();
    expect(normalized.lastRun?.actName).toBeNull();
    expect(normalized.lastRun?.actShortLabel).toBeNull();
    expect(normalized.lastRun?.actIndex).toBe(0);
    expect(normalized.lastRun?.actSectorIndex).toBe(0);
    expect(normalized.lastRun?.actSectorCount).toBeNull();
    expect(normalized.lastRun?.actsCompleted).toBe(0);
    expect(normalized.lastRun?.finaleVariantId).toBeNull();
    expect(normalized.lastRun?.finaleVariantName).toBeNull();
    expect(normalized.lastRun?.finaleCleared).toBe(false);
    expect(normalized.lastRun?.expeditionGraphId).toBeNull();
    expect(normalized.lastRun?.expeditionVisitedNodeIds).toEqual([]);
    expect(normalized.lastRun?.expeditionDecisionIds).toEqual([]);
    expect(normalized.lastRun?.expeditionTargetSeconds).toBeNull();
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
      itemTriggers: 2,
      bonusUnlockIds: ['unlock_music_apex_procession', 'unlock_music_apex_procession']
    });

    expect(update.salvageEarned).toBe(2);
    expect(update.data.salvageBank).toBe(2);
    expect(update.data.stats.runsEnded).toBe(1);
    expect(getSaveSummary(update.data)).toEqual(
      expect.objectContaining({
        salvageBank: 2,
        upgradeCount: 0,
        runsEnded: 1
      })
    );
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
    expect(update.newUnlockIds).toContain('unlock_music_apex_procession');
    expect(update.newUnlockIds.filter((id) => id === 'unlock_music_apex_procession')).toHaveLength(1);
  });

  it('evaluates upgrade affordability and purchases with banked scrap', () => {
    const baseSave = {
      ...createDefaultSaveData(),
      salvageBank: 6
    };
    const unaffordable = getUpgradeAffordability(baseSave, 'upgrade_market_decoder');
    const firstPurchase = purchaseUpgrade(baseSave, 'upgrade_contract_survey_rig');
    const duplicatePurchase = purchaseUpgrade(firstPurchase.data, 'upgrade_contract_survey_rig');
    const lockedPurchase = purchaseUpgrade(baseSave, 'upgrade_route_ledger_uplink');

    expect(unaffordable.state).toBe('locked');
    expect(unaffordable.missingPrerequisiteIds).toEqual(['upgrade_salvage_escrow_index']);
    expect(firstPurchase.ok).toBe(true);
    expect(firstPurchase.spent).toBe(4);
    expect(firstPurchase.remainingSalvageBank).toBe(2);
    expect(firstPurchase.data.purchasedUpgradeIds).toEqual(['upgrade_contract_survey_rig']);
    expect(duplicatePurchase.ok).toBe(false);
    expect(duplicatePurchase.state).toBe('purchased');
    expect(duplicatePurchase.data).toBe(firstPurchase.data);
    expect(lockedPurchase.ok).toBe(false);
    expect(lockedPurchase.state).toBe('locked');
    expect(lockedPurchase.missingPrerequisiteIds).toEqual(['upgrade_contract_survey_rig']);
  });

  it('blocks upgrade purchase when scrap is too low after prerequisites are met', () => {
    const save = {
      ...createDefaultSaveData(),
      salvageBank: 2,
      purchasedUpgradeIds: ['upgrade_contract_survey_rig'] as const
    };
    const affordability = getUpgradeAffordability(save, 'upgrade_route_ledger_uplink');
    const purchase = purchaseUpgrade(save, 'upgrade_route_ledger_uplink');

    expect(affordability.state).toBe('unaffordable');
    expect(purchase.ok).toBe(false);
    expect(purchase.state).toBe('unaffordable');
    expect(purchase.remainingSalvageBank).toBe(2);
  });

  it('writes and resets save data through storage', () => {
    const storage = new MemoryStorage();
    const save = {
      ...createDefaultSaveData(),
      salvageBank: 4,
      purchasedUpgradeIds: ['upgrade_salvage_escrow_index'] as const
    };

    writeSaveData(storage, save);
    expect(loadSaveData(storage).data.salvageBank).toBe(4);
    expect(loadSaveData(storage).data.purchasedUpgradeIds).toEqual([
      'upgrade_salvage_escrow_index'
    ]);

    storage.setItem(LEGACY_SAVE_STORAGE_KEYS[2], '{"version":2,"salvageBank":5}');
    expect(resetSaveData(storage)).toEqual(createDefaultSaveData());
    expect(storage.getItem(SAVE_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(LEGACY_SAVE_STORAGE_KEYS[2])).toBeNull();
  });

  it('loads legacy v2 storage and marks it for repair/write-forward', () => {
    const storage = new MemoryStorage();
    storage.setItem(LEGACY_SAVE_STORAGE_KEYS[2], '{"version":2,"salvageBank":7}');

    const loaded = loadSaveData(storage);

    expect(loaded.repaired).toBe(true);
    expect(loaded.error).toBeNull();
    expect(loaded.data.version).toBe(SAVE_SCHEMA_VERSION);
    expect(loaded.data.salvageBank).toBe(7);
    expect(loaded.data.purchasedUpgradeIds).toEqual([]);
  });

  it('loads legacy v3 storage and preserves discovery records when present', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      LEGACY_SAVE_STORAGE_KEYS[1],
      '{"version":3,"salvageBank":7,"discoveredItemIds":["item_split_prism"]}'
    );

    const loaded = loadSaveData(storage);

    expect(loaded.repaired).toBe(true);
    expect(loaded.error).toBeNull();
    expect(loaded.data.version).toBe(SAVE_SCHEMA_VERSION);
    expect(loaded.data.discoveredItemIds).toEqual(['item_split_prism']);
    expect(loaded.data.discoveredItemFamilyIds).toEqual(['laser-split']);
  });
});
