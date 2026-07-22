import { describe, expect, it } from 'vitest';

import {
  createCombatState,
  updateCombatState,
  type CombatBounds,
  type EnemySpawn
} from '../../src/game/CombatState';
import { generateRunSkeleton, type RouteKind, type RouteOption } from '../../src/game/Generation';
import {
  addItemToSession,
  advanceSector,
  applyRouteOutcome,
  createRunSession,
  getCombatModifiersForSector,
  getCurrentSector,
  getEffectiveShipStats,
  getIncomingRewardRouteKind,
  getRewardModifiersForSector,
  getShopModifiersForSector
} from '../../src/game/RunSession';
import { generateRouteOutcome } from '../../src/game/RouteEvents';
import { generateSectorRewardChoices } from '../../src/game/SectorRewards';
import { generateShopInventory } from '../../src/game/Shops';

const bounds: CombatBounds = {
  width: 640,
  height: 720,
  padding: 24
};

const routeKinds: readonly RouteKind[] = [
  'shop',
  'elite',
  'vault',
  'repair',
  'glitch',
  'factionAmbush'
];

describe('route events', () => {
  it.each(routeKinds)('generates deterministic %s outcomes for a known seed', (kind) => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const sector = getRequiredSector(run, 0);
    const route = makeRoute(kind);
    const first = generateRouteOutcome({
      run,
      sector,
      route,
      availableCredits: 18
    });
    const second = generateRouteOutcome({
      run,
      sector,
      route,
      availableCredits: 18
    });

    expect(first).toEqual(second);
    expect(first.id).toBe(`STARBREAK-SMOKE:s1:to-2:${sector.sectorId}:${kind}`);
    expect(first.details.length).toBeGreaterThan(0);
  });

  it('gives each route kind a meaningful effect surface', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const sector = getRequiredSector(run, 0);
    const outcomes = Object.fromEntries(
      routeKinds.map((kind) => [
        kind,
        generateRouteOutcome({
          run,
          sector,
          route: makeRoute(kind),
          availableCredits: 18
        })
      ])
    );

    expect(outcomes.shop?.effects.shop?.discount).toBeGreaterThan(0);
    expect(outcomes.elite?.effects.combat?.enemyHullBonus).toBe(1);
    expect(outcomes.elite?.effects.reward.choiceBonus).toBe(0);
    expect(outcomes.vault?.effects.curseDelta).toBe(1);
    expect(outcomes.vault?.effects.relicDelta).toBe(1);
    expect(outcomes.vault?.effects.reward.poolIdOverride).toBe('vault');
    expect(outcomes.repair?.effects.hullPatchDelta).toBe(1);
    expect(outcomes.glitch?.effects.reward.choiceBonus).toBe(0);
    expect(outcomes.glitch?.effects.combat?.bossHullBonus).toBe(1);
    expect(outcomes.factionAmbush?.effects.salvageDelta).toBeGreaterThan(0);
    expect(outcomes.factionAmbush?.effects.combat?.bossHullBonus).toBe(1);
  });

  it('applies repair outcomes to future ship hull and route history', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const contract = getFirstContract(run);
    const session = createRunSession(run, contract);
    const sector = getCurrentSector(run, session);
    const route = makeRoute('repair');
    const outcome = generateRouteOutcome({
      run,
      sector,
      route,
      availableCredits: session.credits
    });

    applyRouteOutcome(session, sector, route, outcome);

    expect(session.hullPatch).toBe(1);
    expect(getEffectiveShipStats(contract, session).maxHull).toBe(contract.shipStats.maxHull + 1);
    expect(session.routeHistory).toEqual([
      expect.objectContaining({
        sectorIndex: 1,
        targetSectorIndex: 2,
        routeKind: 'repair',
        outcomeTitle: 'Patch Bay Invoice'
      })
    ]);
  });

  it('uses shop outcomes to alter deterministic shop inventory', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const contract = getFirstContract(run);
    const session = createRunSession(run, contract);
    const sector = getCurrentSector(run, session);
    const route = makeRoute('shop');
    const outcome = generateRouteOutcome({
      run,
      sector,
      route,
      availableCredits: session.credits
    });

    applyRouteOutcome(session, sector, route, outcome);

    const shopModifiers = getShopModifiersForSector(session, sector.index);
    const discount = shopModifiers.reduce((total, modifier) => total + modifier.discount, 0);
    const stockBonus = shopModifiers.reduce((total, modifier) => total + modifier.stockBonus, 0);
    const inventory = generateShopInventory({
      seed: sector.shopSeed,
      sectorIndex: sector.index,
      rerollCount: 0,
      biasTags: shopModifiers.flatMap((modifier) => modifier.biasTags),
      priceDiscount: discount,
      count: 4 + stockBonus
    });

    expect(inventory).toHaveLength(5);
    expect(Math.min(...inventory.map((item) => item.price))).toBeGreaterThanOrEqual(2);
    expect(discount).toBeGreaterThan(0);
  });

  it('applies permanent Low-Orbit Ore Scrip refunds without doubling a restored item copy', () => {
    const run = generateRunSkeleton('ORE-SCRIP-ROUTE', {
      purchasedUpgradeIds: ['upgrade_low_orbit_ore_scrip']
    });
    const contract = getFirstContract(run);
    const sector = getCurrentSector(run, createRunSession(run, contract));
    const route = makeRoute('shop');
    const outcome = generateRouteOutcome({
      run,
      sector,
      route,
      availableCredits: contract.startingCredits
    });
    const upgraded = createRunSession(run, contract);
    const restored = createRunSession(run, contract);
    const stacked = createRunSession(run, contract);

    expect(addItemToSession(restored, 'item_low_orbit_ore_scrip').socket).not.toBeNull();
    expect(addItemToSession(stacked, 'item_low_orbit_ore_scrip').socket).not.toBeNull();

    applyRouteOutcome(
      upgraded,
      sector,
      route,
      outcome,
      undefined,
      undefined,
      run.upgradeEffects.routeChosen
    );
    applyRouteOutcome(restored, sector, route, outcome);
    applyRouteOutcome(
      stacked,
      sector,
      route,
      outcome,
      undefined,
      undefined,
      run.upgradeEffects.routeChosen
    );

    const expectedCreditsDelta = outcome.effects.creditsDelta + 1;
    expect(upgraded.routeOutcomes[0]?.effects.creditsDelta).toBe(expectedCreditsDelta);
    expect(restored.routeOutcomes[0]?.effects.creditsDelta).toBe(expectedCreditsDelta);
    expect(stacked.routeOutcomes[0]?.effects.creditsDelta).toBe(expectedCreditsDelta);
    expect(stacked.routeOutcomes[0]?.details).toContain('Low-Orbit Ore Scrip refunds 1 credit.');
  });

  it('applies permanent Route Ledger reward credit without doubling a restored item copy', () => {
    const run = generateRunSkeleton('ROUTE-LEDGER-CASHOUT', {
      purchasedUpgradeIds: ['upgrade_route_ledger_spool']
    });
    const contract = getFirstContract(run);
    const sector = getCurrentSector(run, createRunSession(run, contract));
    const route = makeRoute('vault');
    const outcome = generateRouteOutcome({
      run,
      sector,
      route,
      availableCredits: contract.startingCredits
    });
    const upgraded = createRunSession(run, contract);
    const restored = createRunSession(run, contract);
    const stacked = createRunSession(run, contract);

    expect(addItemToSession(restored, 'item_route_ledger_spool').socket).not.toBeNull();
    expect(addItemToSession(stacked, 'item_route_ledger_spool').socket).not.toBeNull();

    applyRouteOutcome(
      upgraded,
      sector,
      route,
      outcome,
      undefined,
      undefined,
      run.upgradeEffects.routeChosen
    );
    applyRouteOutcome(restored, sector, route, outcome);
    applyRouteOutcome(
      stacked,
      sector,
      route,
      outcome,
      undefined,
      undefined,
      run.upgradeEffects.routeChosen
    );

    const expectedRewardCredit = outcome.effects.reward.creditBonus + 1;
    expect(upgraded.routeOutcomes[0]?.effects.reward.creditBonus).toBe(expectedRewardCredit);
    expect(restored.routeOutcomes[0]?.effects.reward.creditBonus).toBe(expectedRewardCredit);
    expect(stacked.routeOutcomes[0]?.effects.reward.creditBonus).toBe(expectedRewardCredit);
    expect(stacked.routeOutcomes[0]?.details).toContain(
      'Route Ledger Spool adds 1 credit to the reward cash-out.'
    );
  });

  it('applies permanent Ambush Insurance claims without doubling a restored item copy', () => {
    const run = generateRunSkeleton('AMBUSH-INSURANCE-ROUTE', {
      purchasedUpgradeIds: ['upgrade_ambush_insurance_stamp']
    });
    const contract = getFirstContract(run);
    const sector = getCurrentSector(run, createRunSession(run, contract));
    const route = makeRoute('factionAmbush');
    const outcome = generateRouteOutcome({
      run,
      sector,
      route,
      availableCredits: contract.startingCredits
    });
    const upgraded = createRunSession(run, contract);
    const restored = createRunSession(run, contract);
    const stacked = createRunSession(run, contract);

    expect(addItemToSession(restored, 'item_ambush_insurance_stamp').socket).not.toBeNull();
    expect(addItemToSession(stacked, 'item_ambush_insurance_stamp').socket).not.toBeNull();

    applyRouteOutcome(
      upgraded,
      sector,
      route,
      outcome,
      undefined,
      undefined,
      run.upgradeEffects.routeChosen
    );
    applyRouteOutcome(restored, sector, route, outcome);
    applyRouteOutcome(
      stacked,
      sector,
      route,
      outcome,
      undefined,
      undefined,
      run.upgradeEffects.routeChosen
    );

    const expectedSalvage = outcome.effects.salvageDelta + 1;
    for (const session of [upgraded, restored, stacked]) {
      expect(session.routeOutcomes[0]?.effects.salvageDelta).toBe(expectedSalvage);
      expect(session.routeOutcomes[0]?.effects.reward.biasTags).toEqual(
        expect.arrayContaining(['armor', 'credit'])
      );
    }
    expect(stacked.routeOutcomes[0]?.details).toContain(
      'Ambush Insurance Stamp pays 1 salvage and favors armor / credit rewards.'
    );
  });

  it('uses route outcomes to alter rewards and next-sector combat', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const contract = getFirstContract(run);
    const session = createRunSession(run, contract);
    const sector = getCurrentSector(run, session);
    const route = makeRoute('factionAmbush');
    const outcome = generateRouteOutcome({
      run,
      sector,
      route,
      availableCredits: session.credits
    });

    applyRouteOutcome(session, sector, route, outcome);

    expect(getRewardModifiersForSector(session, session.currentSectorIndex)).toEqual([]);

    expect(advanceSector(run, session)).toBe(true);
    expect(getIncomingRewardRouteKind(session, session.currentSectorIndex)).toBe(route.kind);
    expect(getRewardModifiersForSector(session, session.currentSectorIndex)[0]?.creditBonus).toBe(
      3
    );
    expect(
      generateSectorRewardChoices({
        run,
        session,
        contract,
        routeKind: getIncomingRewardRouteKind(session, session.currentSectorIndex) ?? undefined
      }).length
    ).toBe(3);

    const combatModifiers = getCombatModifiersForSector(session, session.currentSectorIndex);
    const spawnSchedule: readonly EnemySpawn[] = [
      {
        atSeconds: 0,
        waveIndex: 0,
        waveLabel: 'route_pressure_test',
        xRatio: 0.5,
        targetY: 100,
        hull: 2,
        fireDelay: 1,
        factionId: 'faction_scrap_court'
      }
    ];
    const state = createCombatState(bounds, 'ROUTE-PRESSURE', {
      bossId: 'boss_auditor_drone_xl',
      bossSpawnAtSeconds: 0,
      spawnSchedule,
      enemyHullBonus: combatModifiers.reduce(
        (total, modifier) => total + modifier.enemyHullBonus,
        0
      ),
      enemyFireDelayMultiplier: combatModifiers.reduce(
        (multiplier, modifier) => multiplier * modifier.enemyFireDelayMultiplier,
        1
      ),
      bossHullBonus: combatModifiers.reduce((total, modifier) => total + modifier.bossHullBonus, 0)
    });

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);

    expect(state.enemies[0]?.maxHull).toBe(3);
    expect(state.enemies[0]?.fireCooldown).toBeCloseTo(0.88 - 1 / 60);
    expect(state.boss?.maxHull).toBeGreaterThan(18);
  });
});

function makeRoute(kind: RouteKind): RouteOption {
  return {
    kind,
    label: kind === 'factionAmbush' ? 'Faction Ambush' : titleCase(kind),
    risk: kind === 'shop' || kind === 'repair' ? 1 : 4,
    rewardHint: `${kind} test route`
  };
}

function getRequiredSector(run: ReturnType<typeof generateRunSkeleton>, index: number) {
  const sector = run.sectors[index];

  if (!sector) {
    throw new Error(`Expected sector ${index}.`);
  }

  return sector;
}

function getFirstContract(run: ReturnType<typeof generateRunSkeleton>) {
  const contract = run.contracts[0];

  if (!contract) {
    throw new Error('Expected generated contract.');
  }

  return contract;
}

function titleCase(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
