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
      onFire: 26,
      onProjectileSpawn: 14,
      onEnemyKilled: 10,
      onPlayerHit: 1,
      onPickupCollected: 6,
      onGraze: 2,
      onSpecialUsed: 0,
      onBombUsed: 1,
      onSectorStart: 0,
      onRouteChosen: 1,
      onShopEntered: 0,
      onRewardGenerated: 1,
      onBossPhaseChanged: 0,
      onEnvironmentObjectDestroyed: 1
    });
    expect(audit.tagCounts).toMatchObject({
      credit: 8,
      phase: 10,
      plasma: 10,
      overkill: 7,
      relic: 2
    });
    expect(audit.familyCounts).toEqual({
      'laser-split': 8,
      'missile-overkill': 9,
      'drone-copy': 7,
      'shield-revenge': 5,
      'credit-shop': 5,
      'curse-relic': 6,
      'phase-graze': 8,
      'heat-prototype': 6,
      'lunar-surface': 5,
      'route-economy': 1,
      'boss-pressure': 0
    });
    expect(audit.implementationStatusCounts).toEqual({
      live: 60,
      bridge: 0,
      planned: 0
    });
    expect(audit.unlockTierCounts).toEqual({
      baseline: 53,
      advanced: 6,
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
        id: 'starterCore',
        itemCount: 9,
        rarityCounts: { common: 1, uncommon: 4, rare: 3, prototype: 0, cursed: 1 }
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
      'lunar-surface',
      'route-economy'
    ]);
    expect(getImplementedHookItemIds('onFire')).toContain('item_split_prism');
    expect(getImplementedHookItemIds('onGraze')).toContain('item_near_miss_tachometer');
    expect(getImplementedHookItemIds('onProjectileSpawn')).toContain('item_plasma_seed_crucible');
    expect(getImplementedHookItemIds('onFire')).toContain('item_boreline_crimper');
    expect(getImplementedHookItemIds('onFire')).toContain('item_gangue_compression_die');
    expect(getImplementedHookItemIds('onFire')).toContain('item_forkline_dynamo');
    expect(getImplementedHookItemIds('onFire')).toContain('item_penumbra_crown_aperture');
    expect(getImplementedHookItemIds('onProjectileSpawn')).toContain('item_strata_bore_collimator');
    expect(getImplementedHookItemIds('onProjectileSpawn')).toContain('item_claimant_arc_seal');
  });
});
