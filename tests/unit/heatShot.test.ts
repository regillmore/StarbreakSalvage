import { describe, expect, it, vi } from 'vitest';

import { CanvasRenderer, type RendererSettings } from '../../src/app/CanvasRenderer';
import {
  HEAT_EXHAUST_EFFECT_SECONDS,
  HEAT_SHOT_COST_RATIO,
  getHeatShotCost,
  getHeatShotPresentation
} from '../../src/game/HeatShot';

describe('heat shot identity', () => {
  it('derives a proportional spend and bounded velocity-aligned molten presentation', () => {
    const presentation = getHeatShotPresentation({
      ageSeconds: 0.2,
      radius: 6,
      vx: 80,
      vy: -520
    });

    expect(getHeatShotCost(1.4)).toBeCloseTo(1.4 * HEAT_SHOT_COST_RATIO);
    expect(getHeatShotCost(-2)).toBe(0);
    expect(presentation.headingRadians).toBeCloseTo(Math.atan2(80, 520));
    expect(presentation.coreLength).toBeGreaterThan(12);
    expect(presentation.shellRadius).toBeGreaterThan(6);
    expect(presentation.wakeLength).toBeGreaterThan(presentation.coreLength);
    expect(presentation.pulse).toBeGreaterThanOrEqual(0.62);
    expect(presentation.pulse).toBeLessThanOrEqual(0.94);
  });

  it('renders a bright slug with a bifurcated thermal wake', () => {
    const context = createContext();
    const renderer = createRenderer(context);

    renderer.paintProjectile({
      x: 190,
      y: 320,
      vx: 50,
      vy: -520,
      radius: 7,
      owner: 'player',
      tags: ['heat', 'plasma'],
      ageSeconds: 0.18,
      visualKind: 'heatShot'
    });

    expect(context.translate).toHaveBeenCalledWith(190, 320);
    expect(context.rotate).toHaveBeenCalledWith(Math.atan2(50, 520));
    expect(context.quadraticCurveTo).toHaveBeenCalledTimes(2);
    expect(context.ellipse).toHaveBeenCalled();
    expect(context.fill).toHaveBeenCalledTimes(2);
    expect(context.stroke).toHaveBeenCalledTimes(2);
  });

  it('renders an underfunded attempt as a downward exhaust plume', () => {
    const context = createContext();
    const renderer = createRenderer(context);

    renderer.paintCombatEffect({
      kind: 'heatExhaust',
      x: 240,
      y: 540,
      radius: 18,
      ttl: 0.3,
      maxTtl: HEAT_EXHAUST_EFFECT_SECONDS
    });

    expect(context.translate).toHaveBeenCalledWith(240, 540);
    expect(context.quadraticCurveTo).toHaveBeenCalledTimes(2);
    expect(context.ellipse).toHaveBeenCalled();
    expect(context.fill).toHaveBeenCalledTimes(2);
    expect(context.stroke).toHaveBeenCalledOnce();
  });
});

function createRenderer(context: ReturnType<typeof createContext>): CanvasRenderer {
  const renderer = Object.create(CanvasRenderer.prototype) as CanvasRenderer;
  const settings: RendererSettings = {
    reducedMotion: false,
    screenShake: 0.35,
    bulletContrast: 'standard',
    performanceMode: false
  };
  Object.assign(renderer, { context, settings });
  return renderer;
}

function createContext() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    quadraticCurveTo: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    shadowColor: '',
    shadowBlur: 0,
    lineWidth: 1,
    globalAlpha: 1
  };
}
