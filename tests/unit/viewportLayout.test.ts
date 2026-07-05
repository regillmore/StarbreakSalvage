import { describe, expect, it } from 'vitest';

import { calculateViewportLayout } from '../../src/app/ViewportLayout';

describe('ViewportLayout', () => {
  it('derives a wide desktop safe frame with predictable HUD reserves', () => {
    const layout = calculateViewportLayout({ width: 1280, height: 720, dpr: 1 });

    expect(layout.viewportClass).toBe('wide');
    expect(layout.canvasScale).toBe(1);
    expect(layout.combatPadding).toBe(20);
    expect(layout.gameplaySafeFrame).toEqual({
      x: 52,
      y: 94,
      width: 1176,
      height: 584
    });
    expect(layout.hudSafeArea.top).toBe(94);
    expect(layout.hudSafeArea.bottom).toBe(42);
  });

  it('keeps a laptop/tablet-like window spacious without exceeding standard rails', () => {
    const layout = calculateViewportLayout({ width: 768, height: 1024, dpr: 1.5 });

    expect(layout.viewportClass).toBe('standard');
    expect(layout.canvasScale).toBe(0.8);
    expect(layout.dpr).toBe(1.5);
    expect(layout.gameplaySafeFrame).toEqual({
      x: 37,
      y: 122,
      width: 694,
      height: 843
    });
  });

  it('reserves enough vertical HUD space for a narrow mobile-like window', () => {
    const layout = calculateViewportLayout({ width: 390, height: 700, dpr: 3 });

    expect(layout.viewportClass).toBe('narrow');
    expect(layout.dpr).toBe(2);
    expect(layout.canvasScale).toBe(0.58);
    expect(layout.combatPadding).toBe(14);
    expect(layout.gameplaySafeFrame).toEqual({
      x: 14,
      y: 168,
      width: 362,
      height: 479
    });
  });

  it('sanitizes invalid inputs to the minimum supported browser size', () => {
    const layout = calculateViewportLayout({ width: Number.NaN, height: -20, dpr: 0 });

    expect(layout.width).toBe(320);
    expect(layout.height).toBe(240);
    expect(layout.dpr).toBe(1);
    expect(layout.gameplaySafeFrame.x).toBeGreaterThan(0);
    expect(layout.gameplaySafeFrame.y).toBeGreaterThan(0);
    expect(layout.gameplaySafeFrame.width).toBeGreaterThanOrEqual(260);
    expect(layout.gameplaySafeFrame.height).toBeGreaterThanOrEqual(132);
  });
});
