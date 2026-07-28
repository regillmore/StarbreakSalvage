import { describe, expect, it } from 'vitest';

import { SHIPS, type ShipId, type WeaponId } from '../../src/content/ships';
import { WEAPON_ICON_KINDS, WEAPONS } from '../../src/content/weapons';
import {
  createCombatState,
  updateCombatState,
  type CombatBounds
} from '../../src/game/CombatState';
import { generateRunSkeleton } from '../../src/game/Generation';
import { createRunSession } from '../../src/game/RunSession';
import { getMissileTravelSeconds } from '../../src/game/MissileFlight';

const bounds: CombatBounds = {
  width: 640,
  height: 720,
  padding: 24
};

describe('ship stats and weapon identity', () => {
  it('assigns every primary weapon base a distinct authored icon silhouette', () => {
    expect(WEAPONS).toHaveLength(8);
    expect(new Set(WEAPONS.map((weapon) => weapon.iconKind)).size).toBe(WEAPONS.length);
    expect(new Set(WEAPONS.map((weapon) => weapon.iconKind))).toEqual(new Set(WEAPON_ICON_KINDS));
  });

  it('defines distinct baseline ship appearances without changing hit radius stats', () => {
    const baselineShips = [
      getShip('ship_debt_runner'),
      getShip('ship_drone_chaplain'),
      getShip('ship_missile_accountant')
    ];

    expect(new Set(baselineShips.map((ship) => ship.appearance.silhouette)).size).toBe(3);
    expect(new Set(baselineShips.map((ship) => ship.appearance.primaryColor)).size).toBe(3);

    for (const ship of baselineShips) {
      const state = createShipCombatState(ship.id);

      expect(state.player.radius).toBe(ship.stats.hitRadius);
      expect(ship.appearance.weaponMounts.length).toBeGreaterThan(0);
    }
  });

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
      const ship = getShip(contract.shipId);

      expect(session.credits).toBe(contract.startingCredits);
      expect(session.salvage).toBe(contract.startingSalvage);
      expect(contract.shipAppearance).toEqual(ship.appearance);
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

  it('gives player missiles a deterministic two-stage motor in combat', () => {
    const state = createCombatState(bounds, 'MISSILE-MOTOR', {
      weaponId: 'weapon_dumbfire_missile_rack',
      skipEnemyWaves: true
    });

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: true }, 0, bounds);
    const missile = state.projectiles.find((projectile) => projectile.owner === 'player');
    if (!missile) throw new Error('Expected a missile projectile.');
    const startY = missile.y;

    for (let frame = 0; frame < 10; frame += 1) {
      updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 0.1, bounds);
    }

    expect(missile.ageSeconds).toBeCloseTo(1, 8);
    expect(startY - missile.y).toBeCloseTo(Math.abs(missile.vy) * getMissileTravelSeconds(1), 6);
  });

  it('builds heat and blocks fire during prototype overheat reload', () => {
    const ship = getShip('ship_corporate_test_pilot');
    const baseWeapon = WEAPONS.find((weapon) => weapon.id === 'weapon_prototype_beam');
    if (!baseWeapon) throw new Error('Expected the prototype beam definition.');
    const state = createCombatState(bounds, 'PROTOTYPE-HEAT', {
      weaponId: 'weapon_prototype_beam',
      shipStats: ship.stats,
      skipEnemyWaves: true
    });

    expect(ship.stats.weaponHeatCapacityMultiplier).toBe(0.7);
    expect(ship.drawback).not.toContain('malfunction');
    expect(state.weapon.overheatLimit).toBeCloseTo(baseWeapon.overheatLimit * 0.7);
    expect(state.weapon.heatPerShot).toBe(baseWeapon.heatPerShot);

    for (let frame = 0; frame < 40 && state.player.weaponOverheatSeconds <= 0; frame += 1) {
      updateCombatState(state, { movement: { x: 0, y: 0 }, fire: true }, 1 / 10, bounds);
    }

    expect(state.player.weaponHeat).toBeGreaterThan(0);
    expect(state.player.weaponOverheatSeconds).toBeGreaterThan(0);

    const shotsBefore = state.stats.shotsFired;
    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: true }, 1 / 60, bounds);

    expect(state.stats.shotsFired).toBe(shotsBefore);
  });

  it('gives Scrap Monk a concrete plain-projectile edge and an explicit tradeoff', () => {
    const ship = getShip('ship_scrap_monk');

    expect(ship.stats.plainProjectileDamageMultiplier).toBe(1.3);
    expect(ship.perk).toContain('30%');
    expect(ship.drawback).toContain('break focus');
    expect(ship.itemBias).toContain('plain');
    expect(ship.perk).not.toContain('scrap motes');
    expect(ship.drawback).not.toContain('shops offer fewer');
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
