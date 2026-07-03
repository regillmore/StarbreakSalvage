import { describe, expect, it } from 'vitest';

import {
  advanceScreenShake,
  getScreenShakeOffset,
  IDLE_SCREEN_SHAKE,
  triggerScreenShake
} from '../../src/core/screenShake';

describe('screenShake', () => {
  it('creates and decays deterministic camera offsets', () => {
    const triggered = triggerScreenShake(
      IDLE_SCREEN_SHAKE,
      { reducedMotion: false, screenShake: 0.5 },
      0.75
    );

    expect(triggered.secondsRemaining).toBeGreaterThan(0);
    expect(triggered.magnitude).toBeGreaterThan(0);

    const firstOffset = getScreenShakeOffset(triggered);
    const advanced = advanceScreenShake(triggered, 1 / 60);
    const secondOffset = getScreenShakeOffset(advanced);

    expect(firstOffset).not.toEqual(secondOffset);
    expect(advanced.secondsRemaining).toBeLessThan(triggered.secondsRemaining);
  });

  it('respects reduced motion and zero strength settings', () => {
    expect(
      triggerScreenShake(IDLE_SCREEN_SHAKE, { reducedMotion: true, screenShake: 1 }, 1)
    ).toEqual(IDLE_SCREEN_SHAKE);
    expect(
      triggerScreenShake(IDLE_SCREEN_SHAKE, { reducedMotion: false, screenShake: 0 }, 1)
    ).toEqual(IDLE_SCREEN_SHAKE);
  });
});
