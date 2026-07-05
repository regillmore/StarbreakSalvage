import { describe, expect, it } from 'vitest';

import { UPGRADES, type UpgradeId } from '../../src/content/upgrades';
import {
  createDefaultSaveData,
  type SaveData,
  type SaveUpdateResult
} from '../../src/core/saveData';
import {
  createArchiveUpgradeProgressModel,
  createRunSummaryProgressModel
} from '../../src/ui/RunSummaryProgress';

describe('createRunSummaryProgressModel', () => {
  it('formats earned scrap and newly affordable upgrades after a run', () => {
    const saveData = makeSave({ salvageBank: 4 });
    const progress = createRunSummaryProgressModel(saveData, makeUpdate(saveData, 3));

    expect(progress.scrapBreakdownText).toBe('Earned +3 kg | Bank 1 -> 4 kg');
    expect(progress.previousSalvageBank).toBe(1);
    expect(progress.currentSalvageBank).toBe(4);
    expect(progress.newlyAffordableUpgrades.map((upgrade) => upgrade.id)).toEqual([
      'upgrade_salvage_escrow_index',
      'upgrade_contract_survey_rig'
    ]);
    expect(progress.upgradeProgressText).toBe(
      'Newly affordable: Salvage Escrow Index (3 kg), Contract Survey Rig (4 kg).'
    );
    expect(progress.calloutText).toBe(
      'New upgrades ready: Salvage Escrow Index (3 kg), Contract Survey Rig (4 kg). Visit Upgrade Bay from the menu.'
    );
    expect(progress.calloutKind).toBe('new');
  });

  it('keeps already-affordable upgrades separate from newly affordable ones', () => {
    const saveData = makeSave({ salvageBank: 5 });
    const progress = createRunSummaryProgressModel(saveData, makeUpdate(saveData, 1));

    expect(progress.scrapBreakdownText).toBe('Earned +1 kg | Bank 4 -> 5 kg');
    expect(progress.newlyAffordableUpgrades).toEqual([]);
    expect(progress.availableUpgrades.map((upgrade) => upgrade.id)).toEqual([
      'upgrade_salvage_escrow_index',
      'upgrade_contract_survey_rig'
    ]);
    expect(progress.upgradeProgressText).toBe(
      'Affordable now: Salvage Escrow Index (3 kg), Contract Survey Rig (4 kg).'
    );
    expect(progress.calloutKind).toBe('available');
  });

  it('surfaces the closest next upgrade when nothing is affordable', () => {
    const saveData = makeSave({ salvageBank: 2 });
    const progress = createRunSummaryProgressModel(saveData, null);

    expect(progress.scrapBreakdownText).toBe('Earned +0 kg | Bank 2 -> 2 kg');
    expect(progress.availableUpgrades).toEqual([]);
    expect(progress.nextUpgrade?.id).toBe('upgrade_salvage_escrow_index');
    expect(progress.upgradeProgressText).toBe('Next: Salvage Escrow Index needs 1 kg more.');
    expect(progress.calloutText).toBe('Next upgrade: Salvage Escrow Index needs 1 kg more.');
    expect(progress.calloutKind).toBe('next');
  });

  it('handles completed upgrade catalogs', () => {
    const saveData = makeSave({
      salvageBank: 0,
      purchasedUpgradeIds: UPGRADES.map((upgrade) => upgrade.id)
    });
    const progress = createRunSummaryProgressModel(saveData, null);

    expect(progress.installedUpgradeCount).toBe(UPGRADES.length);
    expect(progress.upgradeProgressText).toBe('All current upgrades installed.');
    expect(progress.calloutText).toBe('All current upgrades installed.');
    expect(progress.calloutKind).toBe('complete');
  });
});

describe('createArchiveUpgradeProgressModel', () => {
  it('summarizes archive upgrade readiness', () => {
    const progress = createArchiveUpgradeProgressModel(makeSave({ salvageBank: 4 }));

    expect(progress.availableUpgradeCount).toBe(2);
    expect(progress.statusText).toBe(
      'Ready: Salvage Escrow Index (3 kg), Contract Survey Rig (4 kg).'
    );
  });

  it('summarizes the archive next target when no upgrade is ready', () => {
    const progress = createArchiveUpgradeProgressModel(makeSave({ salvageBank: 1 }));

    expect(progress.availableUpgradeCount).toBe(0);
    expect(progress.nextUpgrade?.id).toBe('upgrade_salvage_escrow_index');
    expect(progress.statusText).toBe('Next: Salvage Escrow Index needs 2 kg more.');
  });
});

function makeSave(options: {
  readonly salvageBank: number;
  readonly purchasedUpgradeIds?: readonly UpgradeId[];
}): SaveData {
  return {
    ...createDefaultSaveData(),
    salvageBank: options.salvageBank,
    purchasedUpgradeIds: options.purchasedUpgradeIds ?? []
  };
}

function makeUpdate(data: SaveData, salvageEarned: number): SaveUpdateResult {
  return {
    data,
    newUnlockIds: [],
    newAchievementIds: [],
    salvageEarned
  };
}
