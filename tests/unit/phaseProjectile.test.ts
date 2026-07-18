import { describe, expect, it, vi } from 'vitest';

import { CanvasRenderer, type RendererSettings } from '../../src/app/CanvasRenderer';
import {
  createCombatState,
  updateCombatState,
  type CombatBounds
} from '../../src/game/CombatState';
import {
  PHASE_PROJECTILE_CYCLE_SECONDS,
  getPhaseProjectilePresentation,
  isPhaseProjectile
} from '../../src/game/PhaseProjectile';

const bounds: CombatBounds = { width: 640, height: 720, padding: 24 };

describe('phase projectile identity', () => {
  it('derives a bounded repeating phase cycle without randomness', () => {
    const first = getPhaseProjectilePresentation({
      ageSeconds: 0.31,
      radius: 5,
      vx: 120,
      vy: -600
    });
    const repeated = getPhaseProjectilePresentation({
      ageSeconds: 0.31 + PHASE_PROJECTILE_CYCLE_SECONDS,
      radius: 5,
      vx: 120,
      vy: -600
    });

    expect(first).toEqual(repeated);
    expect(first.band).toBe('translated');
    expect(first.cycleProgress).toBeGreaterThanOrEqual(0);
    expect(first.cycleProgress).toBeLessThan(1);
    expect(first.visibility).toBeGreaterThanOrEqual(0.7);
    expect(first.apertureRadius).toBeGreaterThan(5);
    expect(first.wakeLength).toBeGreaterThan(first.echoDistance);
    expect(first.headingRadians).toBeCloseTo(Math.atan2(120, 600));
    expect(isPhaseProjectile(['laser', 'phase'])).toBe(true);
    expect(isPhaseProjectile(['laser'])).toBe(false);
  });

  it('tracks visual age for phase-tagged shots without changing linear travel', () => {
    const state = createCombatState(bounds, 'PHASE-AGE-SMOKE', { skipEnemyWaves: true });
    state.projectiles.push(
      {
        id: 9001,
        owner: 'player',
        x: 200,
        y: 300,
        vx: 40,
        vy: -200,
        radius: 5,
        damage: 1,
        ttl: 2,
        tags: ['phase'],
        procDepth: 0
      },
      {
        id: 9002,
        owner: 'player',
        x: 300,
        y: 300,
        vx: 40,
        vy: -200,
        radius: 5,
        damage: 1,
        ttl: 2,
        tags: ['laser'],
        procDepth: 0
      }
    );

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 0.1, bounds);

    expect(state.projectiles[0]).toMatchObject({ x: 204, y: 280, ageSeconds: 0.1 });
    expect(state.projectiles[1]).toMatchObject({ x: 304, y: 280 });
    expect(state.projectiles[1]?.ageSeconds).toBeUndefined();
  });

  it('renders a refracted shard, broken wake, aperture, and displaced echoes', () => {
    const context = createContext();
    const renderer = createRenderer(context);

    renderer.paintProjectile({
      x: 120,
      y: 240,
      vx: 80,
      vy: -600,
      radius: 5,
      owner: 'player',
      tags: ['laser', 'phase'],
      ageSeconds: 0.31
    });

    expect(context.translate).toHaveBeenCalledWith(120, 240);
    expect(context.rotate).toHaveBeenCalledWith(Math.atan2(80, 600));
    expect(context.setLineDash).toHaveBeenCalledWith(expect.arrayContaining([expect.any(Number)]));
    expect(context.lineTo.mock.calls.length).toBeGreaterThanOrEqual(20);
    expect(context.arc.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(context.fill.mock.calls.length).toBeGreaterThanOrEqual(4);
  });

  it('adds phase interference around missiles while retaining powered ordnance geometry', () => {
    const context = createContext();
    const renderer = createRenderer(context);

    renderer.paintProjectile({
      x: 180,
      y: 260,
      vx: 0,
      vy: -500,
      radius: 7,
      owner: 'player',
      tags: ['missile', 'phase'],
      ageSeconds: 0.6
    });

    expect(context.createLinearGradient).toHaveBeenCalledOnce();
    expect(context.setLineDash).toHaveBeenCalled();
    expect(context.quadraticCurveTo).toHaveBeenCalledTimes(2);
    expect(context.arc.mock.calls.length).toBeGreaterThanOrEqual(3);
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
    scale: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
    beginPath: vi.fn(),
    arc: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    quadraticCurveTo: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    setLineDash: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    shadowColor: '',
    shadowBlur: 0,
    lineWidth: 1,
    globalAlpha: 1
  };
}
