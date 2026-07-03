import { describe, expect, it } from 'vitest';

import { getCombatEffectRenderRadius } from '../../src/app/CanvasRenderer';

describe('combat effect rendering helpers', () => {
  it('freezes effect expansion under reduced motion', () => {
    const effect = {
      radius: 120,
      ttl: 0.12,
      maxTtl: 0.4
    };

    expect(getCombatEffectRenderRadius(effect, true)).toBeCloseTo(86.4);
    expect(getCombatEffectRenderRadius(effect, false)).toBeGreaterThan(
      getCombatEffectRenderRadius(effect, true)
    );
  });
});
