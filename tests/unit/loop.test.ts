import { describe, expect, it } from 'vitest';

import {
  advanceFixedStepAccumulator,
  FIXED_DT_SECONDS,
  MAX_FRAME_SECONDS
} from '../../src/app/Loop';

describe('advanceFixedStepAccumulator', () => {
  it('returns no simulation step for a partial frame', () => {
    const result = advanceFixedStepAccumulator(0, FIXED_DT_SECONDS / 2);

    expect(result.steps).toBe(0);
    expect(result.accumulatorSeconds).toBeCloseTo(FIXED_DT_SECONDS / 2);
    expect(result.alpha).toBeCloseTo(0.5);
  });

  it('emits fixed steps and preserves leftover frame time', () => {
    const result = advanceFixedStepAccumulator(0, FIXED_DT_SECONDS * 2.5);

    expect(result.steps).toBe(2);
    expect(result.accumulatorSeconds).toBeCloseTo(FIXED_DT_SECONDS * 0.5);
    expect(result.alpha).toBeCloseTo(0.5);
  });

  it('clamps long frames to prevent runaway catch-up', () => {
    const result = advanceFixedStepAccumulator(0, 5);

    expect(result.frameSeconds).toBe(MAX_FRAME_SECONDS);
    expect(result.steps).toBe(Math.floor(MAX_FRAME_SECONDS / FIXED_DT_SECONDS));
  });
});
