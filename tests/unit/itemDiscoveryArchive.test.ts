import { describe, expect, it } from 'vitest';

import { createDefaultSaveData } from '../../src/core/saveData';
import { createItemDiscoveryArchiveModel } from '../../src/ui/ItemDiscoveryArchive';

describe('item discovery archive', () => {
  it('shows fresh-save family gates without spoiling locked item names', () => {
    const model = createItemDiscoveryArchiveModel(createDefaultSaveData());
    const curseRelic = model.entries.find((entry) => entry.family === 'curse-relic');
    const heatPrototype = model.entries.find((entry) => entry.family === 'heat-prototype');

    expect(model.discoveredItemCount).toBe(0);
    expect(curseRelic).toEqual(
      expect.objectContaining({
        state: 'locked',
        statusText: 'Locked | 0/6 discovered',
        gateLabel: 'Relic Theft Dossier',
        unlockName: 'Relic Thief'
      })
    );
    expect(curseRelic?.hintText).not.toContain('Ashwake Reliquary');
    expect(heatPrototype?.state).toBe('partial');
    expect(heatPrototype?.statusText).toBe(
      'Core available, classified tier locked | 0/7 discovered'
    );
    expect(model.totalFamilyCount).toBe(10);
    expect(model.entries.some((entry) => entry.family === 'boss-pressure')).toBe(false);
  });

  it('shows unlocked family progress from discovery records', () => {
    const model = createItemDiscoveryArchiveModel({
      ...createDefaultSaveData(),
      unlockedIds: [
        'unlock_ship_relic_thief',
        'unlock_item_executive_override',
        'unlock_boss_auditor_drill'
      ],
      discoveredItemIds: ['item_split_prism', 'item_ashwake_reliquary'],
      discoveredItemFamilyIds: ['laser-split', 'curse-relic']
    });
    const curseRelic = model.entries.find((entry) => entry.family === 'curse-relic');

    expect(model.discoveredItemCount).toBe(2);
    expect(model.discoveredFamilyCount).toBe(2);
    expect(curseRelic).toEqual(
      expect.objectContaining({
        state: 'unlocked',
        statusText: 'Unlocked | 1/6 discovered',
        discoveredItemNames: ['Ashwake Reliquary']
      })
    );
    expect(curseRelic?.hintText).toContain('Recorded: Ashwake Reliquary');
  });

  it('does not count retired boss-pressure records from legacy saves', () => {
    const model = createItemDiscoveryArchiveModel({
      ...createDefaultSaveData(),
      discoveredItemIds: ['item_phase_breaker_subpoena'],
      discoveredItemFamilyIds: ['boss-pressure']
    });

    expect(model.discoveredItemCount).toBe(0);
    expect(model.discoveredFamilyCount).toBe(0);
  });
});
