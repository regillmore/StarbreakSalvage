import { describe, expect, it } from 'vitest';

import { getWeaponById } from '../../src/content/weapons';
import { SHIPS } from '../../src/content/ships';
import {
  BASE_COMBINED_PROC_BUDGET,
  createEngineeringState,
  resolveEngineeringSnapshot
} from '../../src/game/Foundry';
import { createLegacyStartingLoadout } from '../../src/game/ShipLoadout';
import {
  applyShipThermalProfile,
  getWeaponHeatCapacityMultiplier
} from '../../src/game/ShipThermalProfile';
import { createFoundryDashboardModel } from '../../src/ui/FoundryPresentation';
import { createFoundryHeatSimulationModel } from '../../src/ui/FoundryHeatSimulation';

describe('ship thermal profile', () => {
  it('scales weapon capacity without mutating the authored weapon definition', () => {
    const weapon = getWeaponById('weapon_prototype_beam');
    const profiled = applyShipThermalProfile(weapon, {
      weaponHeatCapacityMultiplier: 0.7
    });

    expect(profiled).not.toBe(weapon);
    expect(profiled.overheatLimit).toBeCloseTo(weapon.overheatLimit * 0.7);
    expect(profiled.heatPerShot).toBe(weapon.heatPerShot);
    expect(weapon.overheatLimit).toBe(1);
  });

  it('defaults missing legacy thermal stats to the standard envelope', () => {
    const weapon = getWeaponById('weapon_prototype_beam');

    expect(getWeaponHeatCapacityMultiplier({})).toBe(1);
    expect(applyShipThermalProfile(weapon, {})).toBe(weapon);
  });

  it('uses the same compact envelope in Hardpoint Control', () => {
    const ship = SHIPS.find((candidate) => candidate.id === 'ship_corporate_test_pilot');
    if (!ship) throw new Error('Expected the Corporate Test Pilot.');
    const weapon = getWeaponById(ship.weapon);
    const engineering = createEngineeringState(createLegacyStartingLoadout(ship));
    const dashboard = createFoundryDashboardModel(engineering);

    expect(dashboard.heatSimulation.capacity).toBeCloseTo(
      weapon.overheatLimit * ship.stats.weaponHeatCapacityMultiplier
    );
    expect(dashboard.heatSimulation.heatPerVolley).toBeCloseTo(
      weapon.heatPerShot
    );

    const resolution = resolveEngineeringSnapshot(engineering.committed);
    const standardEnvelope = createFoundryHeatSimulationModel(
      {
        weapon,
        resolution,
        procBudget: BASE_COMBINED_PROC_BUDGET,
        items: []
      },
      {
        weapon,
        resolution,
        procBudget: BASE_COMBINED_PROC_BUDGET,
        items: []
      }
    );

    expect(dashboard.heatSimulation.overheatCount).toBe(7);
    expect(standardEnvelope.overheatCount).toBe(7);
    expect(dashboard.heatSimulation.samples[1]!.ratio).toBeGreaterThan(
      standardEnvelope.samples[1]!.ratio
    );
  });
});
