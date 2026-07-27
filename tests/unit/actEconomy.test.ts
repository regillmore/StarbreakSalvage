import { describe, expect, it } from 'vitest';

import {
  applyRunRecordToSave,
  createDefaultSaveData,
  type SaveData
} from '../../src/core/saveData';
import { createActEconomyProfile, getActEconomyShopReadout } from '../../src/game/ActEconomy';
import { generateRunSkeleton, type RunSkeleton } from '../../src/game/Generation';
import {
  createInterActChoiceRecord,
  createInterActJunctionChoices
} from '../../src/game/InterActJunction';
import { createRunSession, getCurrentSector } from '../../src/game/RunSession';
import { generateRouteOutcome } from '../../src/game/RouteEvents';
import { generateSectorRewardChoices } from '../../src/game/SectorRewards';
import {
  generateShopInventory,
  getShopRerollCost,
  SHOP_BASE_CIRCUIT_STOCK
} from '../../src/game/Shops';
import { formatItemSourceSummary, formatRunEconomyBreakdown } from '../../src/ui/RunSummaryScene';
import { createRunSummaryProgressModel } from '../../src/ui/RunSummaryProgress';

describe('Act II economy tuning', () => {
  it('keeps Act I neutral and makes Act II economy stronger but pricier', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const actOne = createActEconomyProfile(getRequiredSector(run, 0));
    const actTwo = createActEconomyProfile(getRequiredSector(run, run.acts[1]!.startSectorIndex));
    const finale = createActEconomyProfile(getRequiredSector(run, run.acts[1]!.endSectorIndex));

    expect(actOne.escalated).toBe(false);
    expect(getActEconomyShopReadout(actOne)).toBeNull();

    expect(actTwo.escalated).toBe(true);
    expect(actTwo.shopPriceAdjustment).toBe(1);
    expect(actTwo.repairCreditSurcharge).toBe(2);
    expect(getActEconomyShopReadout(actTwo)).toBe('Act II market +1 prices, reroll +1');

    expect(finale.finale).toBe(true);
    expect(finale.rewardCreditBonus).toBeGreaterThan(actTwo.rewardCreditBonus);
    expect(finale.looseCurrencyValueBonus).toBeGreaterThan(actTwo.looseCurrencyValueBonus);
  });

  it('generates deterministic Act II reward, vault, and shop surfaces from fresh save context', () => {
    const snapshot = createActEconomySnapshot(createDefaultSaveData());
    const repeated = createActEconomySnapshot(createDefaultSaveData());

    expect(snapshot).toEqual(repeated);
    expect(snapshot).toMatchSnapshot('fresh act II economy');
    expect(snapshot.shop.count).toBe(SHOP_BASE_CIRCUIT_STOCK);
    expect(snapshot.eliteRewards).toHaveLength(3);
    expect(snapshot.vaultRewards).toHaveLength(3);
    expect(snapshot.rerollCosts).toEqual([3, 4]);
  });

  it('generates deterministic progressed-save Act II economy without changing upgrade accounting', () => {
    const progressedSave = createProgressedSave();
    const fresh = createActEconomySnapshot(createDefaultSaveData());
    const progressed = createActEconomySnapshot(progressedSave);

    expect(progressed).toMatchSnapshot('progressed act II economy');
    expect(progressed.shop.count).toBe(fresh.shop.count + 1);
    expect(progressed.vaultRewards).toHaveLength(fresh.vaultRewards.length + 1);

    const update = applyRunRecordToSave(progressedSave, {
      seed: 'STARBREAK-SMOKE',
      contractId: 'contract_test',
      contractName: 'Test Contract',
      reason: 'victory',
      actId: 'act_core_descent',
      actName: 'Core Descent',
      actShortLabel: 'Act II',
      actIndex: 2,
      actSectorIndex: 5,
      actSectorCount: 5,
      actsCompleted: 2,
      survivedSeconds: 190,
      distanceTraveled: 12000,
      sectorLength: 2800,
      sectorsCleared: 10,
      bossesDefeated: 2,
      enemiesDestroyed: 64,
      creditsRecovered: 31,
      salvageRecovered: 11,
      itemTriggers: 9,
      itemIds: []
    });
    const progressModel = createRunSummaryProgressModel(update.data, update);

    expect(update.salvageEarned).toBe(11);
    expect(update.data.salvageBank).toBe(progressedSave.salvageBank + 11);
    expect(progressModel.previousSalvageBank).toBe(progressedSave.salvageBank);
    expect(progressModel.economyScopeText).toContain('does not change upgrade costs');
  });

  it('keeps inter-act junction effects deterministic for fresh and progressed saves', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const sourceAct = run.acts[0];
    const targetAct = run.acts[1];

    if (!sourceAct || !targetAct) {
      throw new Error('Expected two-act run.');
    }

    const freshChoices = createJunctionSnapshot(run, createDefaultSaveData());
    const progressedChoices = createJunctionSnapshot(run, createProgressedSave());

    expect(freshChoices).toEqual(createJunctionSnapshot(run, createDefaultSaveData()));
    expect(progressedChoices).toEqual(createJunctionSnapshot(run, createProgressedSave()));
    expect(freshChoices).toMatchSnapshot('fresh junction economy effects');
    expect(progressedChoices).toMatchSnapshot('progressed junction economy effects');
  });

  it('summarizes Act I, junction, Act II, and item-source economy separately', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const actOneSector = getRequiredSector(run, 0);
    const actTwoSector = getRequiredSector(run, run.acts[1]!.startSectorIndex);
    const actOneRoute = { kind: 'shop' as const, label: 'Shop', risk: 1, rewardHint: 'test' };
    const actTwoRoute = {
      kind: 'elite' as const,
      label: 'Elite',
      risk: 4,
      rewardHint: 'test'
    };
    const actOneOutcome = generateRouteOutcome({
      run,
      sector: actOneSector,
      route: actOneRoute,
      availableCredits: 20
    });
    const actTwoOutcome = generateRouteOutcome({
      run,
      sector: actTwoSector,
      route: actTwoRoute,
      availableCredits: 20
    });
    const interActChoice = createInterActChoiceRecord(
      createInterActJunctionChoices({
        runSeed: run.seed,
        sourceAct: run.acts[0]!,
        targetAct: run.acts[1]!,
        credits: 18,
        salvage: 7,
        hullPatch: 1,
        curse: 0,
        saveFingerprint: createSaveFingerprint(createDefaultSaveData())
      })[0]!
    );
    const summary = formatRunEconomyBreakdown(
      run,
      [actOneOutcome, actTwoOutcome],
      [interActChoice],
      {
        reason: 'victory',
        survivedSeconds: 160,
        distanceTraveled: 9000,
        sectorLength: 2800,
        credits: 25,
        salvage: 12,
        enemiesDestroyed: 50,
        bossesDefeated: 2,
        shotsFired: 400,
        pickupsCollected: 22,
        damageTaken: 4,
        itemTriggers: 8,
        itemNames: []
      }
    );

    expect(summary).toContain('Act I:');
    expect(summary).toContain('Act II:');
    expect(summary).toContain('Junction: Patch Hull');
    expect(summary).not.toContain('standard reward bias | Recovered');
    expect(summary).toContain('Recovered: 25 credits/12 kg');
    expect(formatItemSourceSummary([{ itemId: 'item_vault_parasite', acquisitionOrder: 0 }])).toBe(
      'vault 1'
    );
  });
});

function createActEconomySnapshot(saveData: SaveData) {
  const run = generateRunSkeleton('STARBREAK-SMOKE', {
    unlockedIds: saveData.unlockedIds,
    purchasedUpgradeIds: saveData.purchasedUpgradeIds
  });
  const contract = getFirstContract(run);
  const session = createRunSession(run, contract, { unlockedIds: saveData.unlockedIds });
  const sector = getRequiredSector(run, run.acts[1]!.startSectorIndex);

  session.currentSectorIndex = sector.index;

  const currentSector = getCurrentSector(run, session);
  const actEconomy = createActEconomyProfile(currentSector);
  const shop = generateShopInventory({
    seed: currentSector.shopSeed,
    sectorIndex: currentSector.index,
    rerollCount: 0,
    biasTags: [...contract.itemBias, ...run.upgradeEffects.shopBiasTags],
    excludeItemIds: [],
    priceDiscount: run.upgradeEffects.shopDiscount,
    count: SHOP_BASE_CIRCUIT_STOCK + run.upgradeEffects.shopStockBonus,
    unlockedIds: run.unlockedIds,
    itemInstances: session.itemInstances,
    sectorId: currentSector.sectorId,
    sectorRole: currentSector.sectorName,
    bossFactionId: currentSector.bossFactionId,
    bossGate: currentSector.objective.bossRequired,
    actEconomy
  });

  return {
    act: {
      id: actEconomy.actId,
      label: actEconomy.actShortLabel,
      rewardTier: actEconomy.rewardTier,
      priceAdjustment: actEconomy.shopPriceAdjustment
    },
    shop: {
      count: shop.length,
      items: shop.map((item) => [item.item.id, item.price, item.sourceHint])
    },
    eliteRewards: generateSectorRewardChoices({
      run,
      session,
      contract,
      routeKind: 'elite'
    }).map((choice) => [choice.item.id, choice.sourceHint]),
    vaultRewards: generateSectorRewardChoices({
      run,
      session,
      contract,
      routeKind: 'vault'
    }).map((choice) => [choice.item.id, choice.sourceHint]),
    rerollCosts: [getShopRerollCost(actEconomy, 0), getShopRerollCost(actEconomy, 1)]
  };
}

function createJunctionSnapshot(run: RunSkeleton, saveData: SaveData) {
  const sourceAct = run.acts[0];
  const targetAct = run.acts[1];

  if (!sourceAct || !targetAct) {
    throw new Error('Expected two-act run.');
  }

  return createInterActJunctionChoices({
    runSeed: run.seed,
    sourceAct,
    targetAct,
    credits: 18,
    salvage: 7,
    hullPatch: 1,
    curse: 0,
    saveFingerprint: createSaveFingerprint(saveData)
  }).map((choice) => ({
    id: choice.id,
    kind: choice.kind,
    effects: choice.effects
  }));
}

function createProgressedSave(): SaveData {
  return {
    ...createDefaultSaveData(),
    salvageBank: 9,
    purchasedUpgradeIds: [
      'upgrade_contract_survey_rig',
      'upgrade_salvage_escrow_index',
      'upgrade_route_ledger_uplink',
      'upgrade_market_decoder',
      'upgrade_relic_pattern_dossier'
    ]
  };
}

function createSaveFingerprint(saveData: SaveData): string {
  return [
    saveData.unlockedIds.join(','),
    saveData.purchasedUpgradeIds.join(','),
    saveData.achievementIds.join(',')
  ].join('|');
}

function getRequiredSector(run: RunSkeleton, index: number) {
  const sector = run.sectors[index];

  if (!sector) {
    throw new Error(`Expected sector ${index}.`);
  }

  return sector;
}

function getFirstContract(run: RunSkeleton) {
  const contract = run.contracts[0];

  if (!contract) {
    throw new Error('Expected generated contract.');
  }

  return contract;
}
