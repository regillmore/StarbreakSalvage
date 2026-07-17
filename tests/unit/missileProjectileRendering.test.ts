import { describe, expect, it, vi } from 'vitest';

import { CanvasRenderer, type RendererSettings } from '../../src/app/CanvasRenderer';

describe('missile projectile rendering', () => {
  it('draws a directional body, fins, and powered exhaust instead of a bullet orb', () => {
    const context = createContext();
    const renderer = createRenderer(context);

    renderer.paintProjectile({
      x: 120,
      y: 240,
      vx: 115,
      vy: -500,
      radius: 8,
      owner: 'player',
      tags: ['missile', 'split'],
      ageSeconds: 0.6
    });

    expect(context.translate).toHaveBeenCalledWith(120, 240);
    expect(context.rotate).toHaveBeenCalledWith(Math.atan2(115, 500));
    expect(context.createLinearGradient).toHaveBeenCalledOnce();
    expect(context.quadraticCurveTo).toHaveBeenCalledTimes(2);
    expect(context.lineTo.mock.calls.length).toBeGreaterThanOrEqual(10);
    expect(context.arc).toHaveBeenCalledOnce();
  });

  it('keeps ordinary projectiles on the compact circular readability path', () => {
    const context = createContext();
    const renderer = createRenderer(context);

    renderer.paintProjectile({
      x: 80,
      y: 100,
      vx: 0,
      vy: -700,
      radius: 4,
      owner: 'player',
      tags: ['laser']
    });

    expect(context.rotate).not.toHaveBeenCalled();
    expect(context.createLinearGradient).not.toHaveBeenCalled();
    expect(context.quadraticCurveTo).not.toHaveBeenCalled();
    expect(context.arc).toHaveBeenCalledWith(0, 0, 4, 0, Math.PI * 2);
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
  const gradient = { addColorStop: vi.fn() };
  return {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
    beginPath: vi.fn(),
    arc: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    quadraticCurveTo: vi.fn(),
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
