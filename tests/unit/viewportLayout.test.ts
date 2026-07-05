import { describe, expect, it } from 'vitest';

import { calculateViewportLayout } from '../../src/app/ViewportLayout';
import { COMBAT_ARENA_HEIGHT, COMBAT_ARENA_WIDTH } from '../../src/game/CombatGeometry';

describe('ViewportLayout', () => {
  it('derives a wide desktop safe frame with predictable HUD reserves', () => {
    const layout = calculateViewportLayout({ width: 1280, height: 720, dpr: 1 });

    expect(layout.viewportClass).toBe('wide');
    expect(layout.canvasScale).toBeCloseTo(0.81);
    expect(layout.combatPadding).toBe(24);
    expect(layout.viewportSafeFrame).toEqual({
      x: 52,
      y: 94,
      width: 1176,
      height: 584
    });
    expect(layout.gameplaySafeFrame).toEqual({
      x: 381,
      y: 94,
      width: 519,
      height: 584
    });
    expect(layout.hudSafeArea.top).toBe(94);
    expect(layout.hudSafeArea.bottom).toBe(42);
  });

  it('keeps a laptop/tablet-like window spacious without exceeding standard rails', () => {
    const layout = calculateViewportLayout({ width: 768, height: 1024, dpr: 1.5 });

    expect(layout.viewportClass).toBe('standard');
    expect(layout.canvasScale).toBeCloseTo(1.08);
    expect(layout.dpr).toBe(1.5);
    expect(layout.viewportSafeFrame).toEqual({
      x: 37,
      y: 122,
      width: 694,
      height: 843
    });
    expect(layout.gameplaySafeFrame).toEqual({
      x: 37,
      y: 153,
      width: 694,
      height: 781
    });
  });

  it('reserves enough vertical HUD space for a narrow mobile-like window', () => {
    const layout = calculateViewportLayout({ width: 390, height: 700, dpr: 3 });

    expect(layout.viewportClass).toBe('narrow');
    expect(layout.dpr).toBe(2);
    expect(layout.canvasScale).toBeCloseTo(0.57);
    expect(layout.combatPadding).toBe(24);
    expect(layout.viewportSafeFrame).toEqual({
      x: 14,
      y: 168,
      width: 362,
      height: 479
    });
    expect(layout.gameplaySafeFrame).toEqual({
      x: 14,
      y: 204,
      width: 362,
      height: 407
    });
  });

  it('preserves the fixed combat arena ratio inside each viewport frame', () => {
    const expectedRatio = COMBAT_ARENA_WIDTH / COMBAT_ARENA_HEIGHT;
    const layouts = [
      calculateViewportLayout({ width: 390, height: 700, dpr: 2 }),
      calculateViewportLayout({ width: 1280, height: 720, dpr: 1 }),
      calculateViewportLayout({ width: 1440, height: 1100, dpr: 1 })
    ];

    for (const layout of layouts) {
      expect(layout.gameplaySafeFrame.width / layout.gameplaySafeFrame.height).toBeCloseTo(
        expectedRatio,
        2
      );
    }
  });

  it('sanitizes invalid inputs to the minimum supported browser size', () => {
    const layout = calculateViewportLayout({ width: Number.NaN, height: -20, dpr: 0 });

    expect(layout.width).toBe(320);
    expect(layout.height).toBe(240);
    expect(layout.dpr).toBe(1);
    expect(layout.viewportSafeFrame.x).toBeGreaterThan(0);
    expect(layout.viewportSafeFrame.y).toBeGreaterThan(0);
    expect(layout.viewportSafeFrame.width).toBeGreaterThanOrEqual(260);
    expect(layout.viewportSafeFrame.height).toBeGreaterThanOrEqual(132);
    expect(layout.gameplaySafeFrame.width / layout.gameplaySafeFrame.height).toBeCloseTo(
      COMBAT_ARENA_WIDTH / COMBAT_ARENA_HEIGHT,
      2
    );
  });
});
