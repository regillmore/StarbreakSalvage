import { describe, expect, it } from 'vitest';

import type { CombatRunResult } from '../../src/game/CombatState';
import { generateRunSkeleton } from '../../src/game/Generation';
import {
  addItemToSession,
  createRunSession,
  getCurrentSector,
  getShopRerollCount,
  incrementShopRerollCount,
  recordRouteChoice,
  recordSectorCombatResult,
  spendCredits
} from '../../src/game/RunSession';
import { generateSectorRewardChoices } from '../../src/game/SectorRewards';
import { generateShopInventory, SHOP_REROLL_COST } from '../../src/game/Shops';

const TEST_SEEDS = ['LASER-TAX-404', 'ORBITAL-JUNK-PROPHET', 'STARBREAK-SMOKE'] as const;

describe('sector route, reward, and shop loop generation', () => {
  it.each(TEST_SEEDS)('keeps the opening shop route available for %s', (seed) => {
    const run = generateRunSkeleton(seed);

    expect(run.sectors[0]?.routeOptions.map((route) => route.kind)).toContain('shop');
  });

  it('generates repeatable reward and shop choices from the run seed', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const contract = getFirstContract(run);
    const firstSession = createRunSession(run, contract);
    const secondSession = createRunSession(run, contract);
    const sector = getCurrentSector(run, firstSession);
    const route = getShopRoute(run);

    const firstRewards = generateSectorRewardChoices({
      run,
      session: firstSession,
      contract,
      routeKind: route.kind
    }).map((choice) => choice.item.id);
    const secondRewards = generateSectorRewardChoices({
      run,
      session: secondSession,
      contract,
      routeKind: route.kind
    }).map((choice) => choice.item.id);

    expect(firstRewards).toEqual(secondRewards);

    const firstShop = generateShopInventory({
      seed: sector.shopSeed,
      sectorIndex: sector.index,
      rerollCount: 0,
      biasTags: contract.itemBias,
      excludeItemIds: []
    }).map((item) => [item.item.id, item.price]);
    const secondShop = generateShopInventory({
      seed: sector.shopSeed,
      sectorIndex: sector.index,
      rerollCount: 0,
      biasTags: contract.itemBias,
      excludeItemIds: []
    }).map((item) => [item.item.id, item.price]);

    expect(firstShop).toEqual(secondShop);
  });

  it('changes shop inventory after a deterministic reroll', () => {
    const run = generateRunSkeleton('LASER-TAX-404');
    const contract = getFirstContract(run);
    const session = createRunSession(run, contract);
    const sector = getCurrentSector(run, session);

    const initialInventory = generateShopInventory({
      seed: sector.shopSeed,
      sectorIndex: sector.index,
      rerollCount: getShopRerollCount(session, sector.index),
      biasTags: contract.itemBias,
      excludeItemIds: []
    }).map((item) => item.item.id);

    expect(spendCredits(session, SHOP_REROLL_COST)).toBe(true);
    incrementShopRerollCount(session, sector.index);

    const rerolledInventory = generateShopInventory({
      seed: sector.shopSeed,
      sectorIndex: sector.index,
      rerollCount: getShopRerollCount(session, sector.index),
      biasTags: contract.itemBias,
      excludeItemIds: []
    }).map((item) => item.item.id);

    expect(rerolledInventory).not.toEqual(initialInventory);
  });

  it('records route, combat payout, and shop purchases in the session', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const contract = getFirstContract(run);
    const session = createRunSession(run, contract);
    const sector = getCurrentSector(run, session);
    const route = getShopRoute(run);
    const result: CombatRunResult = {
      reason: 'sectorComplete',
      survivedSeconds: 4.2,
      distanceTraveled: 1442,
      sectorLength: 1442,
      credits: 2,
      salvage: 1,
      enemiesDestroyed: 1,
      bossesDefeated: 0,
      shotsFired: 12,
      pickupsCollected: 1,
      damageTaken: 0,
      itemTriggers: 2,
      itemNames: []
    };

    recordSectorCombatResult(session, result);
    recordRouteChoice(session, sector, route);

    const shopItem = generateShopInventory({
      seed: sector.shopSeed,
      sectorIndex: sector.index,
      rerollCount: 0,
      biasTags: contract.itemBias,
      excludeItemIds: []
    })[0];

    if (!shopItem) {
      throw new Error('Expected at least one shop item.');
    }

    const itemCount = session.itemInstances.length;
    expect(spendCredits(session, shopItem.price)).toBe(true);
    addItemToSession(session, shopItem.item.id);

    expect(session.routeHistory).toEqual([
      expect.objectContaining({ sectorIndex: sector.index, routeKind: 'shop' })
    ]);
    expect(session.credits).toBeGreaterThanOrEqual(0);
    expect(session.salvage).toBe(2);
    expect(session.itemInstances).toHaveLength(itemCount + 1);
  });
});

function getFirstContract(run: ReturnType<typeof generateRunSkeleton>) {
  const contract = run.contracts[0];

  if (!contract) {
    throw new Error('Expected generated contract.');
  }

  return contract;
}

function getShopRoute(run: ReturnType<typeof generateRunSkeleton>) {
  const route = run.sectors[0]?.routeOptions.find((option) => option.kind === 'shop');

  if (!route) {
    throw new Error('Expected opening sector to include a shop route.');
  }

  return route;
}
