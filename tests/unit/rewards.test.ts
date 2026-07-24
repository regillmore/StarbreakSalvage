import { describe, expect, it } from 'vitest';

import { getItemById, STARTER_CORE_ITEM_IDS } from '../../src/content/items';
import { SHIPS } from '../../src/content/ships';
import { generateRunSkeleton, type StartingContract } from '../../src/game/Generation';
import {
  generateRewardChoices,
  generateStartingItemLoadout,
  getStartingCoreAffinityTags,
  getItemPoolWeightProfile,
  getRewardWeight
} from '../../src/game/Rewards';
import { addItemToSession, createRunSession, getCurrentSector } from '../../src/game/RunSession';
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

  it('generates a deterministic sector-clear reward without an onward route', () => {
    const run = generateRunSkeleton('SECTOR-CLEAR-REWARD');
    const contract = getFirstContract(run);
    const session = createRunSession(run, contract);
    const first = generateSectorRewardChoices({ run, session, contract });
    const replay = generateSectorRewardChoices({ run, session, contract });

    expect(first).toEqual(replay);
    expect(first).toHaveLength(3);
    expect(first.every((choice) => choice.poolProfileId !== 'route')).toBe(true);
  });

  it('migrates Market Echo rewards without doubling a restored fitted copy', () => {
    const baselineRun = generateRunSkeleton('MARKET-ECHO-REWARD');
    const upgradedRun = generateRunSkeleton('MARKET-ECHO-REWARD', {
      purchasedUpgradeIds: ['upgrade_market_echo_locator']
    });
    const baselineContract = getFirstContract(baselineRun);
    const upgradedContract = getFirstContract(upgradedRun);
    const baseline = createRunSession(baselineRun, baselineContract);
    const permanent = createRunSession(upgradedRun, upgradedContract);
    const restored = createRunSession(baselineRun, baselineContract);
    const stacked = createRunSession(upgradedRun, upgradedContract);

    expect(addItemToSession(restored, 'item_market_echo_locator').socket).not.toBeNull();
    expect(addItemToSession(stacked, 'item_market_echo_locator').socket).not.toBeNull();

    const count = (run: typeof baselineRun, session: typeof baseline, contract: StartingContract) =>
      generateSectorRewardChoices({ run, session, contract, routeKind: 'shop' }).length;

    expect(count(baselineRun, baseline, baselineContract)).toBe(3);
    expect(count(upgradedRun, permanent, upgradedContract)).toBe(4);
    expect(count(baselineRun, restored, baselineContract)).toBe(3);
    expect(count(upgradedRun, stacked, upgradedContract)).toBe(4);
  });

  it('keeps late-run and fitted-circuit reward manifests at the permanent-upgrade budget', () => {
    const baselineRun = generateRunSkeleton('REWARD-MANIFEST-BUDGET');
    const upgradedRun = generateRunSkeleton('REWARD-MANIFEST-BUDGET', {
      purchasedUpgradeIds: ['upgrade_relic_pattern_dossier']
    });
    const baselineContract = getFirstContract(baselineRun);
    const upgradedContract = getFirstContract(upgradedRun);
    const baseline = createRunSession(baselineRun, baselineContract);
    const upgraded = createRunSession(upgradedRun, upgradedContract);
    const baselineFinale = baselineRun.acts.at(-1)?.endSectorIndex;
    const upgradedFinale = upgradedRun.acts.at(-1)?.endSectorIndex;

    if (baselineFinale === undefined || upgradedFinale === undefined) {
      throw new Error('Expected a generated finale sector.');
    }

    baseline.currentSectorIndex = baselineFinale;
    upgraded.currentSectorIndex = upgradedFinale;
    expect(addItemToSession(baseline, 'item_relic_ash_compass').socket).not.toBeNull();
    expect(addItemToSession(upgraded, 'item_relic_ash_compass').socket).not.toBeNull();

    expect(
      generateSectorRewardChoices({
        run: baselineRun,
        session: baseline,
        contract: baselineContract,
        routeKind: 'vault'
      })
    ).toHaveLength(3);
    expect(
      generateSectorRewardChoices({
        run: upgradedRun,
        session: upgraded,
        contract: upgradedContract,
        routeKind: 'vault'
      })
    ).toHaveLength(4);
  });

  it('migrates Mining Laser Transit reward bias without doubling a restored fitted copy', () => {
    let changedSeedCount = 0;

    for (let index = 0; index < 10; index += 1) {
      const seed = `MINING-TRANSIT-REWARD-${index}`;
      const baselineRun = generateRunSkeleton(seed);
      const upgradedRun = generateRunSkeleton(seed, {
        purchasedUpgradeIds: ['upgrade_mining_laser_transit']
      });
      const baselineContract = getFirstContract(baselineRun);
      const upgradedContract = getFirstContract(upgradedRun);
      const baseline = createRunSession(baselineRun, baselineContract);
      const permanent = createRunSession(upgradedRun, upgradedContract);
      const restored = createRunSession(baselineRun, baselineContract);
      const stacked = createRunSession(upgradedRun, upgradedContract);

      expect(addItemToSession(restored, 'item_mining_laser_transit').socket).not.toBeNull();
      expect(addItemToSession(stacked, 'item_mining_laser_transit').socket).not.toBeNull();

      const ids = (run: typeof baselineRun, session: typeof baseline, contract: StartingContract) =>
        generateSectorRewardChoices({ run, session, contract, routeKind: 'vault' }).map(
          (choice) => choice.item.id
        );
      const baselineIds = ids(baselineRun, baseline, baselineContract);
      const permanentIds = ids(upgradedRun, permanent, upgradedContract);

      expect(ids(baselineRun, restored, baselineContract)).toEqual(permanentIds);
      expect(ids(upgradedRun, stacked, upgradedContract)).toEqual(permanentIds);
      if (baselineIds.join('|') !== permanentIds.join('|')) changedSeedCount += 1;
    }

    expect(changedSeedCount).toBeGreaterThan(0);
  });

  it('creates one deterministic contract-biased ignition core', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const contract = run.contracts[0];

    if (!contract) {
      throw new Error('Expected generated contract for reward test.');
    }

    const loadout = generateStartingItemLoadout(run.seed, contract);
    const replay = generateStartingItemLoadout(run.seed, contract);

    expect(loadout).toEqual(replay);
    expect(loadout.map((item) => item.acquisitionOrder)).toEqual([0]);
    expect(STARTER_CORE_ITEM_IDS).toContain(loadout[0]?.itemId);
  });

  it('curates distinct, live, synergy-opening starter cores across item families', () => {
    const frequentHooks = new Set([
      'onFire',
      'onEnemyKilled',
      'onPlayerHit',
      'onPickupCollected',
      'onSpecialUsed'
    ]);
    const cores = STARTER_CORE_ITEM_IDS.map((itemId) => getItemById(itemId));

    expect(cores).toHaveLength(9);
    expect(new Set(cores.map((item) => item.metadata.family)).size).toBe(cores.length);
    expect(cores.every((item) => item.metadata.implementationStatus === 'live')).toBe(true);
    expect(cores.every((item) => item.hooks.some((hook) => frequentHooks.has(hook)))).toBe(true);
  });

  it('strongly biases the shared core pool without hard-locking classes', () => {
    for (const ship of SHIPS) {
      const contract = {
        id: `test_${ship.id}`,
        itemBias: ship.itemBias,
        startingWeaponId: ship.weapon
      } as StartingContract;
      const affinity = getStartingCoreAffinityTags(contract);
      const selections = Array.from({ length: 40 }, (_value, index) =>
        getItemById(generateStartingItemLoadout(`CORE-BIAS-${index}`, contract)[0]!.itemId)
      );
      const matching = selections.filter(
        (item) =>
          item.tags.some((tag) => affinity.includes(tag)) ||
          item.metadata.sources.some((source) => affinity.includes(source))
      );

      expect(
        STARTER_CORE_ITEM_IDS.map((itemId) => getItemById(itemId)).some(
          (item) =>
            item.tags.some((tag) => affinity.includes(tag)) ||
            item.metadata.sources.some((source) => affinity.includes(source))
        )
      ).toBe(true);
      expect(matching.length / selections.length).toBeGreaterThanOrEqual(0.65);
      expect(new Set(selections.map((item) => item.id)).size).toBeGreaterThan(1);
    }
  });

  it('weights source profiles by rarity, source, family, and context', () => {
    const shopProfile = getItemPoolWeightProfile('shop');
    const vaultProfile = getItemPoolWeightProfile('vault');
    const lunarProfile = getItemPoolWeightProfile('lunar');
    const shopItem = getItemById('item_convoy_receipt_printer');
    const baselineCombatItem = getItemById('item_split_prism');
    const cursedVaultItem = getItemById('item_cursed_hull_plate');
    const starterVaultItem = getItemById('item_revenge_beam');
    const lunarItem = getItemById('item_penumbra_crown_aperture');
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
          id: 'item_gangue_compression_die',
          sourceHint: 'route source',
          price: 4
        },
        {
          id: 'item_salvage_magnet',
          sourceHint: 'Shop pool',
          price: 5
        },
        {
          id: 'item_magnetized_tithe_box',
          sourceHint: 'Shop pool',
          price: 5
        }
      ],
      eliteRewards: [
        {
          id: 'item_boreline_crimper',
          profile: 'elite',
          sourceHint: 'Elite pool'
        },
        {
          id: 'item_drone_uplink',
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
          id: 'item_plasma_bloom_filter',
          profile: 'vault',
          sourceHint: 'vault source'
        },
        {
          id: 'item_arc_window_invoice',
          profile: 'vault',
          sourceHint: 'vault source'
        },
        {
          id: 'item_phase_anchor_spool',
          profile: 'vault',
          sourceHint: 'vault source'
        }
      ],
      lunarRewards: [
        {
          id: 'item_coastdown_capacitor',
          profile: 'lunar',
          sourceHint: 'route source'
        },
        {
          id: 'item_revenge_beam',
          profile: 'lunar',
          sourceHint: 'Lunar pool'
        },
        {
          id: 'item_penumbra_crown_aperture',
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
