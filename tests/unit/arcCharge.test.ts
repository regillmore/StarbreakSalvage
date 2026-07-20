import { describe, expect, it } from 'vitest';

import {
  attachArcCharge,
  getArcChargeProfile,
  getArcDischargeDamage
} from '../../src/game/ArcCharge';

describe('projectile arc charges', () => {
  it('attaches a standard charge and preserves a later heavy upgrade', () => {
    const source = { tags: ['laser'] as const };
    const standard = attachArcCharge(source);
    const heavy = attachArcCharge(standard, 'heavy');
    const notDowngraded = attachArcCharge(heavy, 'standard');

    expect(standard).toMatchObject({ tags: ['laser', 'arc'], arcChargeKind: 'standard' });
    expect(getArcChargeProfile(standard)).toMatchObject({
      range: 180,
      damageMultiplier: 0.55
    });
    expect(notDowngraded.arcChargeKind).toBe('heavy');
    expect(getArcChargeProfile(notDowngraded)).toMatchObject({
      range: 240,
      damageMultiplier: 0.82
    });
  });

  it('treats restored arc tags as standard charges and derives only secondary damage', () => {
    const restored = getArcChargeProfile({ tags: ['arc'] });

    expect(restored?.kind).toBe('standard');
    expect(getArcDischargeDamage(2, restored!)).toBeCloseTo(1.1);
    expect(getArcDischargeDamage(0.1, restored!)).toBe(0.35);
    expect(getArcChargeProfile({ tags: ['laser'] })).toBeNull();
  });
});
