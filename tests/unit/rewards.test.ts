import { describe, expect, it } from 'vitest';

import { getItemById } from '../../src/content/items';
import { generateRunSkeleton } from '../../src/game/Generation';
import {
  generateRewardChoices,
  generateStartingItemLoadout,
  getItemPoolWeightProfile,
  getRewardWeight
} from '../../src/game/Rewards';
import { createRunSession, getCurrentSector } from '../../src/game/RunSession';
import { generateSectorRewardChoices } from '../../src/game/SectorRewards';
import { generateShopInventory } from '../../src/game/Shops';

describe('reward generation', () => {
  it('returns deterministic reward choices for the same seed and pool', () => {
    const first = generateRewardChoices({
      seed: 'LASER-TAX-404',
      poolId: 'starter',
      count: 3,
      biasTags: ['credit']
    }).map((choice) => choice.item.id);
    const second = generateRewardChoices({
      seed: 'LASER-TAX-404',
      poolId: 'starter',
      count: 3,
      biasTags: ['credit']
    }).map((choice) => choice.item.id);

    expect(first).toEqual(second);
  });

  it('creates a starter loadout with acquisition order and visible split/arc kit', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const contract = run.contracts[0];

    if (!contract) {
      throw new Error('Expected generated contract for reward test.');
    }

    const loadout = generateStartingItemLoadout(run.seed, contract);

    expect(loadout).toEqual([
      expect.objectContaining({ itemId: 'item_split_prism', acquisitionOrder: 0 }),
      expect.objectContaining({ itemId: 'item_chain_arc_capacitor', acquisitionOrder: 1 }),
      expect.objectContaining({ acquisitionOrder: 2 })
    ]);
  });

  it('weights source profiles by rarity, source, family, and context', () => {
    const shopProfile = getItemPoolWeightProfile('shop');
    const vaultProfile = getItemPoolWeightProfile('vault');
    const lunarProfile = getItemPoolWeightProfile('lunar');
    const shopItem = getItemById('item_coupon_cascade_fuse');
    const baselineCombatItem = getItemById('item_split_prism');
    const cursedVaultItem = getItemById('item_cursed_hull_plate');
    const starterVaultItem = getItemById('item_revenge_beam');
    const lunarItem = getItemById('item_crater_shadow_lens');
    const nonLunarItem = getItemById('item_heat_sink_saint');
    const lunarContext = {
      routeKind: 'factionAmbush' as const,
      sectorId: 'sector_lunar_surface',
      bossFactionId: 'faction_void_corsairs' as const
    };

    expect(getRewardWeight(shopItem, [], shopProfile)).toBeGreaterThan(
      getRewardWeight(baselineCombatItem, [], shopProfile)
    );
    expect(getRewardWeight(cursedVaultItem, [], vaultProfile)).toBeGreaterThan(
      getRewardWeight(starterVaultItem, [], vaultProfile)
    );
    expect(getRewardWeight(lunarItem, [], lunarProfile, lunarContext)).toBeGreaterThan(
      getRewardWeight(nonLunarItem, [], lunarProfile, lunarContext)
    );
  });

  it('snapshots known-seed source-weighted reward surfaces', () => {
    const run = generateRunSkeleton('SHOP-VAULT-STACK');
    const contract = getFirstContract(run);
    const session = createRunSession(run, contract);
    const sector = getCurrentSector(run, session);
    const shop = generateShopInventory({
      seed: sector.shopSeed,
      sectorIndex: sector.index,
      rerollCount: 0,
      biasTags: contract.itemBias,
      excludeItemIds: [],
      unlockedIds: run.unlockedIds,
      sectorId: sector.sectorId,
      sectorRole: sector.sectorName,
      bossFactionId: sector.bossFactionId,
      bossGate: sector.objective.bossRequired
    });
    const eliteRewards = generateSectorRewardChoices({
      run,
      session,
      contract,
      routeKind: 'elite'
    });
    const vaultRewards = generateSectorRewardChoices({
      run,
      session,
      contract,
      routeKind: 'vault'
    });
    const lunarRun = generateRunSkeleton('LUNAR-SURFACE-LANE');
    const lunarContract = getFirstContract(lunarRun);
    const lunarSession = createRunSession(lunarRun, lunarContract);
    const lunarSectorIndex = lunarRun.sectors.findIndex(
      (candidate) => candidate.sectorId === 'sector_lunar_surface'
    );

    if (lunarSectorIndex < 0) {
      throw new Error('Expected LUNAR-SURFACE-LANE to include Lunar Surface.');
    }

    lunarSession.currentSectorIndex = lunarSectorIndex;

    const lunarRewards = generateSectorRewardChoices({
      run: lunarRun,
      session: lunarSession,
      contract: lunarContract,
      routeKind: 'repair'
    });

    expect({
      shop: shop.map((item) => ({
        id: item.item.id,
        sourceHint: item.sourceHint,
        price: item.price
      })),
      eliteRewards: projectChoices(eliteRewards),
      vaultRewards: projectChoices(vaultRewards),
      lunarRewards: projectChoices(lunarRewards)
    }).toEqual({
      shop: [
        {
          id: 'item_ambush_insurance_stamp',
          sourceHint: 'route source',
          price: 6
        },
        {
          id: 'item_laser_tax_stamp',
          sourceHint: 'Shop pool',
          price: 7
        },
        {
          id: 'item_sidecar_drone_bay',
          sourceHint: 'Shop pool',
          price: 5
        },
        {
          id: 'item_low_orbit_ore_scrip',
          sourceHint: 'route source',
          price: 4
        }
      ],
      eliteRewards: [
        {
          id: 'item_signal_clone_stamp',
          profile: 'elite',
          sourceHint: 'Elite pool'
        },
        {
          id: 'item_overkill_ledger',
          profile: 'elite',
          sourceHint: 'Elite pool'
        },
        {
          id: 'item_prototype_vent_script',
          profile: 'elite',
          sourceHint: 'Elite pool'
        }
      ],
      vaultRewards: [
        {
          id: 'item_arc_window_invoice',
          profile: 'vault',
          sourceHint: 'vault source'
        },
        {
          id: 'item_plasma_bloom_filter',
          profile: 'vault',
          sourceHint: 'vault source'
        },
        {
          id: 'item_curse_eater_gasket',
          profile: 'vault',
          sourceHint: 'vault source'
        }
      ],
      lunarRewards: [
        {
          id: 'item_exit_toll_transponder',
          profile: 'lunar',
          sourceHint: 'route source'
        },
        {
          id: 'item_revenge_beam',
          profile: 'lunar',
          sourceHint: 'Lunar pool'
        },
        {
          id: 'item_regolith_scoop_array',
          profile: 'lunar',
          sourceHint: 'lunar source'
        }
      ]
    });
  });
});

function projectChoices(choices: ReturnType<typeof generateRewardChoices>) {
  return choices.map((choice) => ({
    id: choice.item.id,
    profile: choice.poolProfileId,
    sourceHint: choice.sourceHint
  }));
}

function getFirstContract(run: ReturnType<typeof generateRunSkeleton>) {
  const contract = run.contracts[0];

  if (!contract) {
    throw new Error('Expected generated contract.');
  }

  return contract;
}
