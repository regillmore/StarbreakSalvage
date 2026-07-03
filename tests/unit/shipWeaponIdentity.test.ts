import { describe, expect, it } from 'vitest';

import { SHIPS, type ShipId, type WeaponId } from '../../src/content/ships';
import {
  createCombatState,
  updateCombatState,
  type CombatBounds
} from '../../src/game/CombatState';
import { generateRunSkeleton } from '../../src/game/Generation';
import { createRunSession } from '../../src/game/RunSession';

const bounds: CombatBounds = {
  width: 640,
  height: 720,
  padding: 24
};

describe('ship stats and weapon identity', () => {
  it('turns at least three generated contracts into distinct combat state and economy', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const states = run.contracts.map((contract) =>
      createCombatState(bounds, `CONTRACT-${contract.shipId}`, {
        weaponId: contract.startingWeaponId,
        shipStats: contract.shipStats,
        skipEnemyWaves: true
      })
    );

    expect(run.contracts).toHaveLength(3);
    expect(new Set(states.map((state) => state.player.speed)).size).toBeGreaterThan(1);
    expect(new Set(states.map((state) => state.player.radius)).size).toBeGreaterThan(1);
    expect(new Set(states.map((state) => state.player.maxHull)).size).toBeGreaterThan(1);
    expect(new Set(states.map((state) => state.player.maxBombs)).size).toBeGreaterThan(1);

    for (const contract of run.contracts) {
      const session = createRunSession(run, contract);

      expect(session.credits).toBe(contract.startingCredits);
      expect(session.salvage).toBe(contract.startingSalvage);
    }
  });

  it('uses ship pickup pull range during pickup attraction', () => {
    const debtRunner = createShipCombatState('ship_debt_runner');
    const shieldBruiser = createShipCombatState('ship_shield_bruiser');

    for (const state of [debtRunner, shieldBruiser]) {
      state.pickups.push({
        id: 900,
        kind: 'credit',
        x: state.player.x + 300,
        y: state.player.y,
        vx: 0,
        vy: 0,
        radius: 8,
        value: 1
      });
    }

    updateCombatState(debtRunner, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);
    updateCombatState(shieldBruiser, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);

    expect(debtRunner.pickups[0]?.vx).toBeLessThan(0);
    expect(shieldBruiser.pickups[0]?.vx).toBe(0);
  });

  it('creates distinct projectile families from weapon patterns', () => {
    const splitShots = fireOnce('weapon_needle_splitter');
    const spreadShots = fireOnce('weapon_short_range_spread');
    const missileShots = fireOnce('weapon_dumbfire_missile_rack');
    const basicShots = fireOnce('weapon_basic_blaster');

    expect(splitShots).toHaveLength(3);
    expect(splitShots.map((projectile) => projectile.vx)).toEqual([-115, 0, 115]);
    expect(spreadShots).toHaveLength(3);
    expect(spreadShots[0]?.damage).toBeLessThan(spreadShots[1]?.damage ?? 0);
    expect(missileShots).toHaveLength(1);
    expect(missileShots[0]?.tags).toContain('missile');
    expect(missileShots[0]?.radius).toBeGreaterThan(basicShots[0]?.radius ?? 0);
  });

  it('builds heat and blocks fire during prototype overheat reload', () => {
    const state = createCombatState(bounds, 'PROTOTYPE-HEAT', {
      weaponId: 'weapon_prototype_beam',
      shipStats: getShip('ship_corporate_test_pilot').stats,
      skipEnemyWaves: true
    });

    for (let frame = 0; frame < 40 && state.player.weaponOverheatSeconds <= 0; frame += 1) {
      updateCombatState(state, { movement: { x: 0, y: 0 }, fire: true }, 1 / 10, bounds);
    }

    expect(state.player.weaponHeat).toBeGreaterThan(0);
    expect(state.player.weaponOverheatSeconds).toBeGreaterThan(0);

    const shotsBefore = state.stats.shotsFired;
    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: true }, 1 / 60, bounds);

    expect(state.stats.shotsFired).toBe(shotsBefore);
  });
});

function fireOnce(weaponId: WeaponId) {
  const state = createCombatState(bounds, `WEAPON-${weaponId}`, {
    weaponId,
    skipEnemyWaves: true
  });

  updateCombatState(state, { movement: { x: 0, y: 0 }, fire: true }, 1 / 60, bounds);

  return state.projectiles.filter((projectile) => projectile.owner === 'player');
}

function createShipCombatState(shipId: ShipId) {
  const ship = getShip(shipId);

  return createCombatState(bounds, `SHIP-${shipId}`, {
    weaponId: ship.weapon,
    shipStats: ship.stats,
    skipEnemyWaves: true
  });
}

function getShip(shipId: ShipId) {
  const ship = SHIPS.find((candidate) => candidate.id === shipId);

  if (!ship) {
    throw new Error(`Missing ship ${shipId}.`);
  }

  return ship;
}
