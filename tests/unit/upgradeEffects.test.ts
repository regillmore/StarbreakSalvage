import { describe, expect, it } from 'vitest';

import type { UpgradeId } from '../../src/content/upgrades';
import {
  createRunGenerationSaveFingerprint,
  generateRunSkeleton,
  type RunSkeleton
} from '../../src/game/Generation';
import { createRunSession, getCurrentSector } from '../../src/game/RunSession';
import { generateSectorRewardChoices } from '../../src/game/SectorRewards';
import { generateShopInventory, SHOP_BASE_CIRCUIT_STOCK } from '../../src/game/Shops';
import {
  getCraterShadowLensSpecialChargeBonus,
  getAmbushInsuranceStampRewardBiasTags,
  getAmbushInsuranceStampSalvageClaim,
  getMarketEchoLocatorRewardBiasTags,
  getMarketEchoLocatorRewardChoiceBonus,
  getMiningLaserTransitRewardBiasTags,
  getRelicAshCompassRewardBiasTags,
  getSurfaceBeaconSectorStartBonus,
  resolveRunUpgradeEffects
} from '../../src/game/UpgradeEffects';

const UPGRADED_SAVE_IDS: readonly UpgradeId[] = [
  'upgrade_contract_survey_rig',
  'upgrade_route_ledger_uplink',
  'upgrade_market_decoder',
  'upgrade_relic_pattern_dossier',
  'upgrade_seed_cartographer'
];

describe('run upgrade effects', () => {
  it('applies purchased upgrades to deterministic generation surfaces', () => {
    const first = projectUpgradedRun(
      generateRunSkeleton('UPGRADE-SEED-SNAPSHOT', {
        purchasedUpgradeIds: UPGRADED_SAVE_IDS
      })
    );
    const second = projectUpgradedRun(
      generateRunSkeleton('UPGRADE-SEED-SNAPSHOT', {
        purchasedUpgradeIds: UPGRADED_SAVE_IDS
      })
    );

    expect(first).toEqual(second);
    expect(first).toMatchInlineSnapshot(`
      {
        "activeUpgradeIds": [
          "upgrade_contract_survey_rig",
          "upgrade_route_ledger_uplink",
          "upgrade_market_decoder",
          "upgrade_relic_pattern_dossier",
          "upgrade_seed_cartographer",
        ],
        "contractCount": 4,
        "contractSurvey": [
          {
            "shipId": "ship_corporate_test_pilot",
            "surveyNote": "Survey: sturdy frame; favors prototype / heat.",
          },
          {
            "shipId": "ship_missile_accountant",
            "surveyNote": "Survey: sturdy frame; favors missile / overkill.",
          },
          {
            "shipId": "ship_phase_courier",
            "surveyNote": "Survey: fast frame; favors phase / graze.",
          },
          {
            "shipId": "ship_drone_chaplain",
            "surveyNote": "Survey: sturdy frame; favors drone / orbital.",
          },
        ],
        "openingRouteIntel": [
          {
            "intelHint": "Ledger: low pressure, market stop before the next sector.",
            "kind": "shop",
          },
          {
            "intelHint": "Ledger: low pressure, service lane can stabilize future hull.",
            "kind": "repair",
          },
          {
            "intelHint": "Ledger: medium pressure, relic pool and curse exposure likely.",
            "kind": "vault",
          },
        ],
        "seed": "UPGRADE-SEED-SNAPSHOT",
        "seedSurvey": "Seed Map: Act I Outer Debris Field | 1519u | Shop/Repair/Vault",
        "shop": {
          "discount": 1,
          "itemIds": [
            "item_magnetized_tithe_box",
            "item_gangue_compression_die",
            "item_laser_tax_stamp",
            "item_coastdown_capacitor",
          ],
          "prices": [
            4,
            3,
            5,
            8,
          ],
          "stockBonus": 1,
        },
        "vaultRewards": [
          "item_phase_grazer",
          "item_phase_wake_suture",
          "item_ashwake_reliquary",
          "item_cursed_hull_plate",
        ],
      }
    `);
  });

  it('keeps fresh saves on the baseline contract and route surfaces', () => {
    const freshRun = generateRunSkeleton('UPGRADE-SEED-SNAPSHOT', {
      unlockedIds: []
    });
    const contract = getFirstContract(freshRun);

    expect(freshRun.contracts).toHaveLength(3);
    expect(freshRun.upgradeEffects.activeUpgradeIds).toEqual([]);
    expect(freshRun.seedSurvey).toBeNull();
    expect(freshRun.sectors).toHaveLength(27);
    expect(freshRun.sectors[0]?.routeOptions.every((route) => !route.intelHint)).toBe(true);
    expect(createRunSession(freshRun, contract).itemInstances.length).toBeGreaterThan(0);
  });

  it('projects permanent boss counterplay without occupying a run circuit', () => {
    const warning = resolveRunUpgradeEffects(['upgrade_boss_warning_lattice']);
    const relief = resolveRunUpgradeEffects([
      'upgrade_boss_warning_lattice',
      'upgrade_capital_relief_protocol'
    ]);

    expect(warning.bossPhase).toEqual({
      attackCooldownSeconds: 0.15,
      telegraphSeconds: 0.2,
      specialChargeGain: 0,
      clearEnemyProjectilesAtPhase: null
    });
    expect(relief.bossPhase).toEqual({
      attackCooldownSeconds: 0.15,
      telegraphSeconds: 0.2,
      specialChargeGain: 0.12,
      clearEnemyProjectilesAtPhase: 2
    });
    expect(createRunGenerationSaveFingerprint([], relief)).toBe(
      createRunGenerationSaveFingerprint([], resolveRunUpgradeEffects())
    );
  });

  it('projects the Exit Toll refund as a non-generation permanent effect', () => {
    const toll = resolveRunUpgradeEffects(['upgrade_exit_toll_transponder']);

    expect(toll.sectorStart).toEqual({
      exitTollRefund: true,
      surfaceBeaconDrone: false,
      craterShadowLens: false
    });
    expect(createRunGenerationSaveFingerprint([], toll)).toBe(
      createRunGenerationSaveFingerprint([], resolveRunUpgradeEffects())
    );
  });

  it('projects Surface Beacon Drone as a lunar-only non-generation entry ping', () => {
    const beacon = resolveRunUpgradeEffects(['upgrade_surface_beacon_drone']);

    expect(beacon.sectorStart).toEqual({
      exitTollRefund: false,
      surfaceBeaconDrone: true,
      craterShadowLens: false
    });
    expect(getSurfaceBeaconSectorStartBonus(beacon.sectorStart, 'sector_lunar_surface')).toEqual({
      salvageBonus: 1,
      specialChargeBonus: 0.05
    });
    expect(getSurfaceBeaconSectorStartBonus(beacon.sectorStart, 'sector_trade_war')).toEqual({
      salvageBonus: 0,
      specialChargeBonus: 0
    });
    expect(
      getSurfaceBeaconSectorStartBonus(beacon.sectorStart, 'sector_lunar_surface', true)
    ).toEqual({ salvageBonus: 0, specialChargeBonus: 0 });
    expect(createRunGenerationSaveFingerprint([], beacon)).toBe(
      createRunGenerationSaveFingerprint([], resolveRunUpgradeEffects())
    );
  });

  it('projects Crater Shadow Lens as a non-generation sector reading with legacy precedence', () => {
    const lens = resolveRunUpgradeEffects(['upgrade_crater_shadow_lens']);

    expect(lens.sectorStart).toEqual({
      exitTollRefund: false,
      surfaceBeaconDrone: false,
      craterShadowLens: true
    });
    expect(getCraterShadowLensSpecialChargeBonus(lens.sectorStart, 'sector_lunar_surface')).toBe(
      0.08
    );
    expect(getCraterShadowLensSpecialChargeBonus(lens.sectorStart, 'sector_trade_war')).toBe(0.02);
    expect(
      getCraterShadowLensSpecialChargeBonus(lens.sectorStart, 'sector_lunar_surface', true)
    ).toBe(0);
    expect(createRunGenerationSaveFingerprint([], lens)).toBe(
      createRunGenerationSaveFingerprint([], resolveRunUpgradeEffects())
    );
  });

  it('projects Coupon Cascade without perturbing unrelated expedition generation', () => {
    const coupon = resolveRunUpgradeEffects(['upgrade_coupon_cascade_fuse']);

    expect(coupon.shopCouponCascade).toBe(true);
    expect(coupon.shopDiscount).toBe(0);
    expect(coupon.shopBiasTags).toEqual([]);
    expect(createRunGenerationSaveFingerprint([], coupon)).toBe(
      createRunGenerationSaveFingerprint([], resolveRunUpgradeEffects())
    );
  });

  it('projects Low-Orbit Ore Scrip without perturbing unrelated expedition generation', () => {
    const oreScrip = resolveRunUpgradeEffects(['upgrade_low_orbit_ore_scrip']);

    expect(oreScrip.routeChosen).toEqual({
      lowOrbitOreRefund: true,
      routeLedgerRewardCredit: false,
      ambushInsuranceStamp: false
    });
    expect(createRunGenerationSaveFingerprint([], oreScrip)).toBe(
      createRunGenerationSaveFingerprint([], resolveRunUpgradeEffects())
    );
  });

  it('projects Route Ledger Spool without perturbing unrelated expedition generation', () => {
    const routeLedger = resolveRunUpgradeEffects(['upgrade_route_ledger_spool']);

    expect(routeLedger.routeChosen).toEqual({
      lowOrbitOreRefund: false,
      routeLedgerRewardCredit: true,
      ambushInsuranceStamp: false
    });
    expect(createRunGenerationSaveFingerprint([], routeLedger)).toBe(
      createRunGenerationSaveFingerprint([], resolveRunUpgradeEffects())
    );
  });

  it('projects Market Echo Locator without doubling a restored fitted copy', () => {
    const marketEcho = resolveRunUpgradeEffects(['upgrade_market_echo_locator']);

    expect(marketEcho.marketEchoLocator).toBe(true);
    expect(getMarketEchoLocatorRewardChoiceBonus(marketEcho, 'shop')).toBe(1);
    expect(getMarketEchoLocatorRewardChoiceBonus(marketEcho, 'repair')).toBe(1);
    expect(getMarketEchoLocatorRewardBiasTags(marketEcho, 'shop')).toEqual(['credit', 'magnet']);
    expect(getMarketEchoLocatorRewardChoiceBonus(marketEcho, 'vault')).toBe(0);
    expect(getMarketEchoLocatorRewardChoiceBonus(marketEcho, 'shop', true)).toBe(1);
    expect(getMarketEchoLocatorRewardBiasTags(marketEcho, 'shop', true)).toEqual([]);
    expect(createRunGenerationSaveFingerprint([], marketEcho)).toBe(
      createRunGenerationSaveFingerprint([], resolveRunUpgradeEffects())
    );
  });

  it('projects Convoy Receipt Printer without perturbing unrelated expedition generation', () => {
    const receipts = resolveRunUpgradeEffects(['upgrade_convoy_receipt_printer']);

    expect(receipts.convoyReceiptPrinter).toBe(true);
    expect(receipts.shopStockBonus).toBe(0);
    expect(receipts.shopBiasTags).toEqual([]);
    expect(createRunGenerationSaveFingerprint([], receipts)).toBe(
      createRunGenerationSaveFingerprint([], resolveRunUpgradeEffects())
    );
  });

  it('projects Mining Laser Transit without doubling a restored fitted copy', () => {
    const transit = resolveRunUpgradeEffects(['upgrade_mining_laser_transit']);

    expect(transit.miningLaserTransit).toBe(true);
    expect(getMiningLaserTransitRewardBiasTags(transit, 'vault')).toEqual(['laser', 'plasma']);
    expect(getMiningLaserTransitRewardBiasTags(transit, 'factionAmbush')).toEqual([
      'laser',
      'plasma'
    ]);
    expect(getMiningLaserTransitRewardBiasTags(transit, 'shop')).toEqual([]);
    expect(getMiningLaserTransitRewardBiasTags(transit, 'vault', true)).toEqual([]);
    expect(createRunGenerationSaveFingerprint([], transit)).toBe(
      createRunGenerationSaveFingerprint([], resolveRunUpgradeEffects())
    );
  });

  it('projects Relic Ash Compass as a vault bias without doubling a restored fitted copy', () => {
    const compass = resolveRunUpgradeEffects(['upgrade_relic_ash_compass']);

    expect(compass.relicAshCompass).toBe(true);
    expect(getRelicAshCompassRewardBiasTags(compass, 'vault')).toEqual(['relic', 'phase']);
    expect(getRelicAshCompassRewardBiasTags(compass, 'combat')).toEqual([]);
    expect(getRelicAshCompassRewardBiasTags(compass, 'vault', true)).toEqual([]);
    expect(createRunGenerationSaveFingerprint([], compass)).toBe(
      createRunGenerationSaveFingerprint([], resolveRunUpgradeEffects())
    );
  });

  it('projects Ambush Insurance Stamp without perturbing unrelated expedition generation', () => {
    const insurance = resolveRunUpgradeEffects(['upgrade_ambush_insurance_stamp']);

    expect(insurance.routeChosen).toEqual({
      lowOrbitOreRefund: false,
      routeLedgerRewardCredit: false,
      ambushInsuranceStamp: true
    });
    expect(getAmbushInsuranceStampSalvageClaim(insurance.routeChosen, 'elite')).toBe(1);
    expect(getAmbushInsuranceStampSalvageClaim(insurance.routeChosen, 'factionAmbush')).toBe(1);
    expect(getAmbushInsuranceStampRewardBiasTags(insurance.routeChosen, 'elite')).toEqual([
      'armor',
      'credit'
    ]);
    expect(getAmbushInsuranceStampSalvageClaim(insurance.routeChosen, 'shop')).toBe(0);
    expect(getAmbushInsuranceStampSalvageClaim(insurance.routeChosen, 'elite', true)).toBe(0);
    expect(createRunGenerationSaveFingerprint([], insurance)).toBe(
      createRunGenerationSaveFingerprint([], resolveRunUpgradeEffects())
    );
  });
});

function projectUpgradedRun(run: RunSkeleton) {
  const contract = getFirstContract(run);
  const session = createRunSession(run, contract);
  const sector = getCurrentSector(run, session);
  const shopInventory = generateShopInventory({
    seed: sector.shopSeed,
    sectorIndex: sector.index,
    rerollCount: 0,
    biasTags: [...contract.itemBias, ...run.upgradeEffects.shopBiasTags],
    excludeItemIds: [],
    count: SHOP_BASE_CIRCUIT_STOCK + run.upgradeEffects.shopStockBonus,
    priceDiscount: run.upgradeEffects.shopDiscount,
    couponCascadeUpgrade: run.upgradeEffects.shopCouponCascade,
    unlockedIds: run.unlockedIds
  });
  const vaultRewards = generateSectorRewardChoices({
    run,
    session,
    contract,
    routeKind: 'vault'
  });

  return {
    seed: run.seed,
    activeUpgradeIds: run.upgradeEffects.activeUpgradeIds,
    seedSurvey: run.seedSurvey,
    contractCount: run.contracts.length,
    contractSurvey: run.contracts.map((candidate) => ({
      shipId: candidate.shipId,
      surveyNote: candidate.surveyNote
    })),
    openingRouteIntel: sector.routeOptions.map((route) => ({
      kind: route.kind,
      intelHint: route.intelHint
    })),
    shop: {
      stockBonus: run.upgradeEffects.shopStockBonus,
      discount: run.upgradeEffects.shopDiscount,
      itemIds: shopInventory.map((item) => item.item.id),
      prices: shopInventory.map((item) => item.price)
    },
    vaultRewards: vaultRewards.map((choice) => choice.item.id)
  };
}

function getFirstContract(run: RunSkeleton) {
  const contract = run.contracts[0];

  if (!contract) {
    throw new Error('Expected generated contract.');
  }

  return contract;
}
