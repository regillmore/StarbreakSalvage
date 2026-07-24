import { describe, expect, it } from 'vitest';

import {
  createItemLoadoutStressModel,
  createItemStormLoadout,
  createItemStressPoolPreview,
  ITEM_STORM_ITEM_IDS
} from '../../src/game/ItemStress';

describe('item stress instrumentation', () => {
  it('creates a deterministic hook-heavy debug loadout', () => {
    const loadout = createItemStormLoadout();

    expect(loadout).toHaveLength(ITEM_STORM_ITEM_IDS.length);
    expect(loadout.map((instance) => instance.itemId)).toEqual(ITEM_STORM_ITEM_IDS);
    expect(loadout.map((instance) => instance.acquisitionOrder)).toEqual(
      ITEM_STORM_ITEM_IDS.map((_itemId, index) => index)
    );
  });

  it('summarizes active hook pressure and build identity', () => {
    const model = createItemLoadoutStressModel(createItemStormLoadout());
    const activeHookNames = model.topHooks.map((entry) => entry.hook);

    expect(model.itemCount).toBe(ITEM_STORM_ITEM_IDS.length);
    expect(model.uniqueItemCount).toBe(ITEM_STORM_ITEM_IDS.length);
    expect(model.activeHookTypes).toBe(model.totalHookTypes - 4);
    expect(model.hookApplications).toBeGreaterThan(model.itemCount);
    expect(model.peakHookApplications).toBeLessThanOrEqual(model.procBudget);
    expect(model.skippedHookApplications).toBe(0);
    expect(model.buildLabel).toMatch(/^Build .+ \| \d+ items$/);
    expect(activeHookNames).toContain('onFire');
    expect(activeHookNames).toContain('onEnemyKilled');
    expect(activeHookNames).toContain('onShopEntered');
    expect(activeHookNames).toContain('onRewardGenerated');
    expect(activeHookNames).not.toContain('onSpecialUsed');
    expect(activeHookNames).not.toContain('onSectorStart');
    expect(activeHookNames).not.toContain('onPlayerHit');
    expect(activeHookNames).not.toContain('onBossPhaseChanged');
  });

  it('reports skipped applications when duplicate pressure exceeds the proc budget', () => {
    const stackedLoadout = Array.from({ length: 52 }, (_value, acquisitionOrder) => ({
      itemId: 'item_split_prism' as const,
      acquisitionOrder
    }));
    const model = createItemLoadoutStressModel(stackedLoadout, 48);

    expect(model.itemCount).toBe(52);
    expect(model.uniqueItemCount).toBe(1);
    expect(model.peakHookName).toBe('onFire');
    expect(model.peakHookApplications).toBe(52);
    expect(model.skippedHookApplications).toBe(4);
  });

  it('previews fresh and unlocked item-heavy reward, shop, and vault pools', () => {
    const preview = createItemStressPoolPreview();

    expect(preview.seed).toBe('HOOK-STORM-SMOKE');
    expect(preview.fresh.combatCount).toBeGreaterThan(20);
    expect(preview.fresh.shopCount).toBeGreaterThan(20);
    expect(preview.fresh.vaultCount).toBeGreaterThan(0);
    expect(preview.unlocked.combatCount).toBeGreaterThanOrEqual(preview.fresh.combatCount);
    expect(preview.unlocked.shopCount).toBeGreaterThanOrEqual(preview.fresh.shopCount);
    expect(preview.unlocked.vaultCount).toBeGreaterThan(preview.fresh.vaultCount);
    expect(preview.unlockedOnlyItemIds).toContain('item_overheat_oracle');
    expect(preview.unlockedOnlyItemIds).toEqual([...preview.unlockedOnlyItemIds].sort());
  });
});
