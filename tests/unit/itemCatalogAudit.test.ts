import { describe, expect, it } from 'vitest';

import {
  BRIDGE_EFFECT_AUDIT_NOTES,
  PHASE_6_TARGET_ITEM_FAMILIES,
  createItemCatalogAudit,
  getImplementedHookItemIds
} from '../../src/content/itemCatalogAudit';

describe('item catalog audit', () => {
  it('captures the current Phase 6 catalog by rarity, tag, and hook', () => {
    const audit = createItemCatalogAudit();

    expect(audit.itemCount).toBe(60);
    expect(audit.targetItemCount).toBe(60);
    expect(audit.rarityCounts).toEqual({
      common: 14,
      uncommon: 20,
      rare: 19,
      prototype: 4,
      cursed: 3
    });
    expect(audit.hookCounts).toEqual({
      onFire: 11,
      onProjectileSpawn: 8,
      onEnemyKilled: 11,
      onPlayerHit: 6,
      onPickupCollected: 5,
      onGraze: 2,
      onSpecialUsed: 1,
      onBombUsed: 1,
      onSectorStart: 3,
      onRouteChosen: 4,
      onShopEntered: 2,
      onRewardGenerated: 3,
      onBossPhaseChanged: 5
    });
    expect(audit.tagCounts).toMatchObject({
      credit: 16,
      phase: 12,
      plasma: 8,
      overkill: 4,
      relic: 2
    });
    expect(audit.familyCounts).toEqual({
      'laser-split': 6,
      'missile-overkill': 6,
      'drone-copy': 6,
      'shield-revenge': 5,
      'credit-shop': 6,
      'curse-relic': 6,
      'phase-graze': 5,
      'heat-prototype': 5,
      'lunar-surface': 5,
      'route-economy': 5,
      'boss-pressure': 5
    });
    expect(audit.implementationStatusCounts).toEqual({
      live: 56,
      bridge: 4,
      planned: 0
    });
    expect(audit.unlockTierCounts).toEqual({
      baseline: 52,
      advanced: 7,
      unlock: 1
    });
    expect(audit.stackingCounts).toEqual({
      unique: 60,
      stackable: 0
    });
  });

  it('summarizes reward pool breadth and current unlock gating', () => {
    const audit = createItemCatalogAudit();

    expect(
      audit.poolAudits.map((pool) => ({
        id: pool.id,
        itemCount: pool.itemCount,
        rarityCounts: pool.rarityCounts
      }))
    ).toEqual([
      {
        id: 'starter',
        itemCount: 27,
        rarityCounts: { common: 14, uncommon: 9, rare: 4, prototype: 0, cursed: 0 }
      },
      {
        id: 'combat',
        itemCount: 51,
        rarityCounts: { common: 14, uncommon: 18, rare: 17, prototype: 2, cursed: 0 }
      },
      {
        id: 'vault',
        itemCount: 20,
        rarityCounts: { common: 0, uncommon: 2, rare: 11, prototype: 4, cursed: 3 }
      }
    ]);
    expect(audit.sourceCounts).toMatchObject({
      starter: 27,
      combat: 51,
      vault: 20,
      unlock: 1,
      shop: 3,
      elite: 2,
      boss: 6,
      faction: 1,
      lunar: 5,
      route: 6
    });
    expect(audit.lockedItemIds).toEqual([
      'item_capital_wound_ledger',
      'item_curse_eater_gasket',
      'item_curse_interest_bond',
      'item_cursed_hull_plate',
      'item_overheat_oracle',
      'item_relic_ash_compass',
      'item_relic_index_codex',
      'item_vault_parasite'
    ]);
  });

  it('flags implementation gaps without changing item content', () => {
    const audit = createItemCatalogAudit();

    expect(audit.archetypeAudits).toHaveLength(8);
    expect(audit.archetypeAudits.every((archetype) => archetype.rewardedItemCount > 0)).toBe(true);
    expect(audit.underrepresentedArchetypeIds).toEqual([]);
    expect(audit.bridgeEffectNotes.map((note) => note.itemId)).toEqual([
      'item_ricochet_license',
      'item_cursed_hull_plate',
      'item_phase_grazer',
      'item_vault_parasite'
    ]);
    expect(BRIDGE_EFFECT_AUDIT_NOTES).toHaveLength(4);
  });

  it('records the target family set for the Phase 6 expansion plan', () => {
    expect(PHASE_6_TARGET_ITEM_FAMILIES).toEqual([
      'laser-split',
      'missile-overkill',
      'drone-copy',
      'shield-revenge',
      'credit-shop',
      'curse-relic',
      'phase-graze',
      'heat-prototype',
      'lunar-surface',
      'route-economy',
      'boss-pressure'
    ]);
    expect(getImplementedHookItemIds('onFire')).toContain('item_split_prism');
    expect(getImplementedHookItemIds('onGraze')).toContain('item_near_miss_tachometer');
    expect(getImplementedHookItemIds('onBossPhaseChanged')).toContain(
      'item_telegraph_rewrite_quill'
    );
  });
});
