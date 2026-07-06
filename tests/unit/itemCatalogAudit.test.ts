import { describe, expect, it } from 'vitest';

import {
  BRIDGE_EFFECT_AUDIT_NOTES,
  PHASE_6_TARGET_ITEM_FAMILIES,
  createItemCatalogAudit,
  getImplementedHookItemIds
} from '../../src/content/itemCatalogAudit';

describe('item catalog audit', () => {
  it('captures the current Phase 6 baseline by rarity, tag, and hook', () => {
    const audit = createItemCatalogAudit();

    expect(audit.itemCount).toBe(30);
    expect(audit.targetItemCount).toBe(60);
    expect(audit.rarityCounts).toEqual({
      common: 5,
      uncommon: 11,
      rare: 9,
      prototype: 3,
      cursed: 2
    });
    expect(audit.hookCounts).toEqual({
      onFire: 8,
      onProjectileSpawn: 5,
      onEnemyKilled: 9,
      onPlayerHit: 5,
      onPickupCollected: 4
    });
    expect(audit.tagCounts).toMatchObject({
      credit: 6,
      phase: 4,
      plasma: 4,
      overkill: 1,
      relic: 1
    });
    expect(audit.familyCounts).toEqual({
      'laser-split': 4,
      'missile-overkill': 4,
      'drone-copy': 4,
      'shield-revenge': 3,
      'credit-shop': 4,
      'curse-relic': 4,
      'phase-graze': 3,
      'heat-prototype': 3,
      'lunar-surface': 0,
      'route-economy': 1,
      'boss-pressure': 0
    });
    expect(audit.implementationStatusCounts).toEqual({
      live: 26,
      bridge: 4,
      planned: 0
    });
    expect(audit.unlockTierCounts).toEqual({
      baseline: 25,
      advanced: 4,
      unlock: 1
    });
    expect(audit.stackingCounts).toEqual({
      unique: 30,
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
        itemCount: 17,
        rarityCounts: { common: 5, uncommon: 8, rare: 4, prototype: 0, cursed: 0 }
      },
      {
        id: 'combat',
        itemCount: 23,
        rarityCounts: { common: 5, uncommon: 9, rare: 8, prototype: 1, cursed: 0 }
      },
      {
        id: 'vault',
        itemCount: 11,
        rarityCounts: { common: 0, uncommon: 1, rare: 5, prototype: 3, cursed: 2 }
      }
    ]);
    expect(audit.sourceCounts).toMatchObject({
      starter: 17,
      combat: 23,
      vault: 11,
      unlock: 1,
      shop: 0,
      elite: 0,
      boss: 0,
      faction: 0,
      lunar: 0,
      route: 0
    });
    expect(audit.lockedItemIds).toEqual(['item_overheat_oracle']);
  });

  it('flags archetype and implementation gaps without changing item content', () => {
    const audit = createItemCatalogAudit();

    expect(audit.archetypeAudits).toHaveLength(8);
    expect(audit.archetypeAudits.every((archetype) => archetype.rewardedItemCount > 0)).toBe(
      true
    );
    expect(audit.underrepresentedArchetypeIds).toEqual([
      'missile-overkill',
      'shield-revenge',
      'curse-relic'
    ]);
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
  });
});
