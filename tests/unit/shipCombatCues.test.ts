import { describe, expect, it } from 'vitest';

import { SHIPS, type ShipDefinition } from '../../src/content/ships';
import {
  getPlayerShipCueState,
  type PlayerShipCueInput,
  type PlayerShipCueOptions
} from '../../src/app/ShipCombatCues';

const standardOptions: PlayerShipCueOptions = {
  reducedMotion: false,
  performanceMode: false,
  bulletContrast: 'standard'
};

describe('ship combat cue helpers', () => {
  it('derives contract-colored wake and readiness cues from ship appearance', () => {
    const debtRunner = getShip('ship_debt_runner');
    const missileAccountant = getShip('ship_missile_accountant');

    const debtCues = getPlayerShipCueState(makeCueInput(debtRunner), standardOptions);
    const missileCues = getPlayerShipCueState(makeCueInput(missileAccountant), standardOptions);

    expect(debtCues.wakeColor).toBe(debtRunner.appearance.engineColor);
    expect(missileCues.wakeColor).toBe(missileAccountant.appearance.engineColor);
    expect(debtCues.specialColor).toBe(debtRunner.appearance.cockpitAccent);
    expect(debtCues.bombColor).toBe(debtRunner.appearance.trimColor);
    expect(debtCues.specialReadyAlpha).toBeGreaterThan(0);
    expect(debtCues.bombReadyAlpha).toBeGreaterThan(0);
  });

  it('shows damage and invulnerability without changing cue color source', () => {
    const ship = getShip('ship_shield_bruiser');
    const cues = getPlayerShipCueState(
      makeCueInput(ship, {
        hull: 1,
        maxHull: 5,
        invulnerableSeconds: 0.55
      }),
      standardOptions
    );

    expect(cues.bodyAlpha).toBeLessThan(1);
    expect(cues.damageFlashAlpha).toBeGreaterThan(0.45);
    expect(cues.invulnerabilityRingAlpha).toBeGreaterThan(0.6);
    expect(cues.invulnerabilityColor).toBe(ship.appearance.trimColor);
  });

  it('surfaces weapon heat stress and stronger overheat cues', () => {
    const ship = getShip('ship_corporate_test_pilot');
    const hot = getPlayerShipCueState(
      makeCueInput(ship, {
        weaponHeat: 0.92,
        weaponOverheatLimit: 1,
        weaponOverheatSeconds: 0
      }),
      standardOptions
    );
    const overheated = getPlayerShipCueState(
      makeCueInput(ship, {
        weaponHeat: 1,
        weaponOverheatLimit: 1,
        weaponOverheatSeconds: 0.5
      }),
      standardOptions
    );

    expect(hot.heatStressAlpha).toBeGreaterThan(0);
    expect(overheated.overheatAlpha).toBeGreaterThan(hot.heatStressAlpha);
    expect(overheated.heatColor).toBe(ship.appearance.engineColor);
  });

  it('reduces decorative cue intensity for accessibility and performance modes', () => {
    const ship = getShip('ship_phase_courier');
    const standard = getPlayerShipCueState(makeCueInput(ship), standardOptions);
    const reduced = getPlayerShipCueState(makeCueInput(ship), {
      ...standardOptions,
      reducedMotion: true
    });
    const performance = getPlayerShipCueState(makeCueInput(ship), {
      ...standardOptions,
      performanceMode: true
    });
    const highContrast = getPlayerShipCueState(makeCueInput(ship), {
      ...standardOptions,
      bulletContrast: 'high'
    });

    expect(reduced.wakeAlpha).toBeLessThan(standard.wakeAlpha);
    expect(reduced.wakeLengthScale).toBeLessThan(standard.wakeLengthScale);
    expect(performance.specialReadyAlpha).toBeLessThan(standard.specialReadyAlpha);
    expect(highContrast.wakeAlpha).toBeLessThan(standard.wakeAlpha);
    expect(highContrast.specialColor).toBe('#ffef5f');
    expect(highContrast.hitRingColor).toBe('#f8fbff');
  });
});

function getShip(id: ShipDefinition['id']): ShipDefinition {
  const ship = SHIPS.find((candidate) => candidate.id === id);

  if (!ship) {
    throw new Error(`Missing ship fixture: ${id}`);
  }

  return ship;
}

function makeCueInput(
  ship: ShipDefinition,
  overrides: Partial<PlayerShipCueInput> = {}
): PlayerShipCueInput {
  return {
    appearance: ship.appearance,
    thrust: 0.7,
    hull: ship.stats.maxHull,
    maxHull: ship.stats.maxHull,
    invulnerableSeconds: 0,
    specialCharge: 1,
    maxSpecialCharge: 1,
    specialCooldown: 0,
    specialActiveSeconds: 0,
    bombs: ship.stats.bombCapacity,
    maxBombs: ship.stats.bombCapacity,
    bombCooldown: 0,
    weaponHeat: 0.2,
    weaponOverheatLimit: 1,
    weaponOverheatSeconds: 0,
    ...overrides
  };
}
