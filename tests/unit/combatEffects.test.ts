import { describe, expect, it } from 'vitest';

import {
  getCombatEffectRenderRadius,
  getVelocityCueState,
  type RendererSettings
} from '../../src/app/CanvasRenderer';

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

  it('derives velocity cues from accessibility and performance settings', () => {
    const standard = getVelocityCueState(makeRendererSettings());
    const reduced = getVelocityCueState(makeRendererSettings({ reducedMotion: true }));
    const performance = getVelocityCueState(makeRendererSettings({ performanceMode: true }));
    const highContrast = getVelocityCueState(makeRendererSettings({ bulletContrast: 'high' }));

    expect(standard.parallaxScale).toBeGreaterThan(1);
    expect(standard.streakCount).toBeGreaterThan(performance.streakCount);
    expect(standard.engineWakeAlpha).toBeGreaterThan(performance.engineWakeAlpha);

    expect(reduced.parallaxScale).toBe(0);
    expect(reduced.streakCount).toBe(0);
    expect(reduced.pickupTrailAlpha).toBe(0);
    expect(reduced.engineWakeAlpha).toBeLessThan(standard.engineWakeAlpha);

    expect(highContrast.highContrastProjectiles).toBe(true);
    expect(highContrast.streakAlpha).toBeLessThan(standard.streakAlpha);
  });
});

function makeRendererSettings(overrides: Partial<RendererSettings> = {}): RendererSettings {
  return {
    reducedMotion: false,
    screenShake: 0.35,
    bulletContrast: 'standard',
    performanceMode: false,
    ...overrides
  };
}
