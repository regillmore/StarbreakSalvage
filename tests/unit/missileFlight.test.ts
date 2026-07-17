import { describe, expect, it } from 'vitest';

import {
  MISSILE_BOOST_END_SECONDS,
  MISSILE_CRUISE_SPEED_SCALE,
  MISSILE_EJECTION_SECONDS,
  MISSILE_EJECTION_SPEED_SCALE,
  getMissileFlightPhase,
  getMissileThrustScale,
  getMissileTravelSeconds,
  getProjectileTravelDeltaSeconds,
  getProjectileTravelSeconds,
  getProjectileTravelTimeForDistance
} from '../../src/game/MissileFlight';

describe('missile flight', () => {
  it('moves through a distinct ejection, boost, and cruise motor profile', () => {
    const boostMiddle = (MISSILE_EJECTION_SECONDS + MISSILE_BOOST_END_SECONDS) / 2;

    expect(getMissileFlightPhase(0)).toBe('ejection');
    expect(getMissileFlightPhase(boostMiddle)).toBe('boost');
    expect(getMissileFlightPhase(MISSILE_BOOST_END_SECONDS)).toBe('cruise');
    expect(getMissileThrustScale(0)).toBe(MISSILE_EJECTION_SPEED_SCALE);
    expect(getMissileThrustScale(boostMiddle)).toBeCloseTo(
      (MISSILE_EJECTION_SPEED_SCALE + MISSILE_CRUISE_SPEED_SCALE) / 2
    );
    expect(getMissileThrustScale(2)).toBe(MISSILE_CRUISE_SPEED_SCALE);
  });

  it('integrates travel without depending on simulation step size', () => {
    const totalAge = 1.1;
    const splitAge = 0.23;
    const splitTravel =
      getProjectileTravelDeltaSeconds(0, splitAge, ['missile']) +
      getProjectileTravelDeltaSeconds(splitAge, totalAge, ['missile']);

    expect(splitTravel).toBeCloseTo(getMissileTravelSeconds(totalAge), 10);
    expect(getProjectileTravelSeconds(totalAge, ['plasma'])).toBe(totalAge);
    expect(getMissileTravelSeconds(0.05)).toBeLessThan(0.05);
    expect(getMissileTravelSeconds(totalAge)).toBeGreaterThan(totalAge);
  });

  it('solves preview flight time against the same motor integral', () => {
    const distance = 250;
    const authoredSpeed = 500;
    const missileSeconds = getProjectileTravelTimeForDistance(distance, authoredSpeed, ['missile']);

    expect(getMissileTravelSeconds(missileSeconds) * authoredSpeed).toBeCloseTo(distance, 6);
    expect(missileSeconds).toBeGreaterThan(distance / authoredSpeed);
    expect(getProjectileTravelTimeForDistance(distance, authoredSpeed, ['laser'])).toBe(0.5);
  });
});
