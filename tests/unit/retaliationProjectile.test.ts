import { describe, expect, it } from 'vitest';

import {
  RETALIATION_PROJECTILE_CYCLE_SECONDS,
  getRetaliationProjectilePresentation,
  isRetaliationProjectile
} from '../../src/game/RetaliationProjectile';

describe('retaliation projectile identity', () => {
  it('derives a deterministic repeating shield-pressure presentation', () => {
    const first = getRetaliationProjectilePresentation({
      ageSeconds: 0.23,
      radius: 5,
      vx: 90,
      vy: -600
    });
    const repeated = getRetaliationProjectilePresentation({
      ageSeconds: 0.23 + RETALIATION_PROJECTILE_CYCLE_SECONDS,
      radius: 5,
      vx: 90,
      vy: -600
    });

    expect(first).toEqual(repeated);
    expect(first.headingRadians).toBeCloseTo(Math.atan2(90, 600));
    expect(first.shellRadius).toBeGreaterThan(5);
    expect(first.wakeLength).toBeGreaterThan(first.shellRadius);
    expect(first.pulse).toBeGreaterThanOrEqual(0.78);
    expect(first.pulse).toBeLessThanOrEqual(0.96);
    expect(isRetaliationProjectile(['shield', 'revenge'])).toBe(true);
    expect(isRetaliationProjectile(['shield'])).toBe(false);
  });
});
