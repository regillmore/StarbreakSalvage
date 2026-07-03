import { describe, expect, it } from 'vitest';

import { applyDamage } from '../../src/systems/DamageSystem';

describe('applyDamage', () => {
  it('subtracts hull and reports survival', () => {
    expect(applyDamage(3, 1)).toEqual({
      hull: 2,
      damageApplied: 1,
      destroyed: false
    });
  });

  it('clamps overkill damage to remaining hull', () => {
    expect(applyDamage(2, 99)).toEqual({
      hull: 0,
      damageApplied: 2,
      destroyed: true
    });
  });

  it('ignores negative damage', () => {
    expect(applyDamage(2, -4)).toEqual({
      hull: 2,
      damageApplied: 0,
      destroyed: false
    });
  });
});
