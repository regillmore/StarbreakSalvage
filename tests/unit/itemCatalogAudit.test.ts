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

    expect(audit.itemCount).toBe(69);
    expect(audit.targetItemCount).toBe(69);
    expect(audit.rarityCounts).toEqual({
      common: 15,
      uncommon: 21,
      rare: 23,
      prototype: 7,
      cursed: 3
    });
    expect(audit.hookCounts).toEqual({
      onFire: 34,
      onProjectileSpawn: 17,
      onEnemyKilled: 10,
      onPlayerHit: 1,
      onPickupCollected: 6,
      onGraze: 2,
      onSpecialUsed: 0,
      onBombUsed: 1,
      onSectorStart: 0,
      onRouteChosen: 1,
      onShopEntered: 0,
      onRewardGenerated: 0,
      onBossPhaseChanged: 0,
      onEnvironmentObjectDestroyed: 1
    });
    expect(audit.tagCounts).toMatchObject({
      credit: 8,
      phase: 13,
      plasma: 12,
      overkill: 9,
      relic: 2
    });
    expect(audit.familyCounts).toEqual({
      'laser-split': 9,
      'missile-overkill': 9,
      'drone-copy': 9,
      'shield-revenge': 6,
      'credit-shop': 5,
      'curse-relic': 6,
      'phase-graze': 9,
      'heat-prototype': 7,
      'plain-focus': 3,
      'lunar-surface': 5,
      'route-economy': 1,
      'boss-pressure': 0
    });
    expect(audit.implementationStatusCounts).toEqual({
      live: 69,
      bridge: 0,
      planned: 0
    });
    expect(audit.unlockTierCounts).toEqual({
      baseline: 62,
      advanced: 6,
      unlock: 1
    });
    expect(audit.stackingCounts).toEqual({
      unique: 69,
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
        itemCount: 28,
        rarityCounts: { common: 15, uncommon: 9, rare: 4, prototype: 0, cursed: 0 }
      },
      {
        id: 'starterCore',
        itemCount: 10,
        rarityCounts: { common: 2, uncommon: 4, rare: 3, prototype: 0, cursed: 1 }
      },
      {
        id: 'combat',
        itemCount: 54,
        rarityCounts: { common: 15, uncommon: 19, rare: 18, prototype: 2, cursed: 0 }
      },
      {
        id: 'vault',
        itemCount: 21,
        rarityCounts: { common: 0, uncommon: 2, rare: 12, prototype: 4, cursed: 3 }
      },
      {
        id: 'apex',
        itemCount: 6,
        rarityCounts: { common: 0, uncommon: 0, rare: 3, prototype: 3, cursed: 0 }
      }
    ]);
    expect(audit.sourceCounts).toMatchObject({
      starter: 28,
      combat: 54,
      vault: 21,
      unlock: 1,
      shop: 5,
      elite: 2,
      boss: 7,
      apex: 6,
      faction: 1,
      lunar: 5,
      route: 6
    });
    expect(audit.lockedItemIds).toEqual([
      'item_ashwake_reliquary',
      'item_curse_eater_gasket',
      'item_curse_interest_bond',
      'item_cursed_hull_plate',
      'item_overheat_oracle',
      'item_relic_index_codex',
      'item_vault_parasite'
    ]);
  });

  it('flags implementation gaps without changing item content', () => {
    const audit = createItemCatalogAudit();

    expect(audit.archetypeAudits).toHaveLength(9);
    expect(audit.archetypeAudits.every((archetype) => archetype.rewardedItemCount > 0)).toBe(true);
    expect(audit.underrepresentedArchetypeIds).toEqual([]);
    expect(audit.bridgeEffectNotes).toEqual([]);
    expect(BRIDGE_EFFECT_AUDIT_NOTES).toHaveLength(0);
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
      'plain-focus',
      'lunar-surface',
      'route-economy'
    ]);
    expect(getImplementedHookItemIds('onFire')).toContain('item_split_prism');
    expect(getImplementedHookItemIds('onGraze')).toContain('item_near_miss_tachometer');
    expect(getImplementedHookItemIds('onProjectileSpawn')).toContain('item_plasma_seed_crucible');
    expect(getImplementedHookItemIds('onFire')).toContain('item_boreline_crimper');
    expect(getImplementedHookItemIds('onFire')).toContain('item_gangue_compression_die');
    expect(getImplementedHookItemIds('onFire')).toContain('item_stillpoint_flywheel');
    expect(getImplementedHookItemIds('onProjectileSpawn')).toContain('item_unadorned_bore');
    expect(getImplementedHookItemIds('onFire')).toContain('item_empty_hand_repeater');
    expect(getImplementedHookItemIds('onFire')).toContain('item_forkline_dynamo');
    expect(getImplementedHookItemIds('onFire')).toContain('item_penumbra_crown_aperture');
    expect(getImplementedHookItemIds('onFire')).toContain('item_ashwake_reliquary');
    expect(getImplementedHookItemIds('onProjectileSpawn')).toContain('item_strata_bore_collimator');
    expect(getImplementedHookItemIds('onProjectileSpawn')).toContain('item_claimant_arc_seal');
  });
});
