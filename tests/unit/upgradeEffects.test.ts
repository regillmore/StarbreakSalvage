import { describe, expect, it } from 'vitest';

import type { UpgradeId } from '../../src/content/upgrades';
import { generateRunSkeleton, type RunSkeleton } from '../../src/game/Generation';
import { createRunSession, getCurrentSector } from '../../src/game/RunSession';
import { generateSectorRewardChoices } from '../../src/game/SectorRewards';
import { generateShopInventory } from '../../src/game/Shops';

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
        "seedSurvey": "Seed Map: Outer Debris Field | 1289u | Shop/Repair/Vault",
        "shop": {
          "discount": 1,
          "itemIds": [
            "item_ricochet_license",
            "item_salvage_magnet",
            "item_phase_grazer",
            "item_split_prism",
            "item_coin_operated_cannon",
          ],
          "prices": [
            6,
            3,
            8,
            5,
            7,
          ],
          "stockBonus": 1,
        },
        "vaultRewards": [
          "item_overkill_ledger",
          "item_phase_anchor_spool",
          "item_vault_parasite",
          "item_phase_grazer",
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
    expect(freshRun.sectors).toHaveLength(5);
    expect(freshRun.sectors[0]?.routeOptions.every((route) => !route.intelHint)).toBe(true);
    expect(createRunSession(freshRun, contract).itemInstances.length).toBeGreaterThan(0);
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
    count: 4 + run.upgradeEffects.shopStockBonus,
    priceDiscount: run.upgradeEffects.shopDiscount,
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
