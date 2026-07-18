import { describe, expect, it, vi } from 'vitest';

import { CanvasRenderer, type RendererSettings } from '../../src/app/CanvasRenderer';
import {
  createConfinedEnvironmentPlan,
  summarizeConfinedEnvironmentPlan
} from '../../src/game/ConfinedEnvironment';
import { generateRunSkeleton } from '../../src/game/Generation';

describe('ConfinedEnvironment', () => {
  it('derives deterministic bounded environment plans from boarding layouts', () => {
    const run = generateRunSkeleton('CONFINED-ENVIRONMENT-SMOKE');

    for (const operation of run.boardingCampaign.operations) {
      const first = createConfinedEnvironmentPlan(operation);
      const second = createConfinedEnvironmentPlan(operation);

      expect(summarizeConfinedEnvironmentPlan(first)).toEqual(
        summarizeConfinedEnvironmentPlan(second)
      );
      expect(first.panels.length).toBeGreaterThanOrEqual(12);
      expect(first.panels.length).toBeLessThanOrEqual(16);
      expect(first.conduits.length).toBeGreaterThanOrEqual(5);
      expect(first.conduits.length).toBeLessThanOrEqual(8);
      expect(first.lamps.length).toBeGreaterThanOrEqual(8);
      expect(first.lamps.length).toBeLessThanOrEqual(12);
      expect(first.roomKinds).toEqual(operation.rooms.map((room) => room.kind));
    }
  });

  it('gives all four target families a distinct enclosed treatment', () => {
    const run = generateRunSkeleton('CONFINED-TARGET-FAMILIES');
    const plans = run.boardingCampaign.operations.map(createConfinedEnvironmentPlan);

    expect(new Set(plans.map((plan) => plan.targetKind))).toEqual(
      new Set(['capitalShip', 'station', 'wreck', 'derelict'])
    );
    expect(new Set(plans.map((plan) => plan.kind))).toEqual(
      new Set(['capitalHull', 'industrialStation', 'buriedWreck', 'abandonedDerelict'])
    );
    expect(plans.every((plan) => plan.label.toLowerCase().includes('interior'))).toBe(true);
  });

  it('paints an opaque structural background without invoking the space strata path', () => {
    const operation = generateRunSkeleton('CONFINED-RENDER-SMOKE').boardingCampaign.operations[0];
    if (!operation) throw new Error('Expected a boarding operation.');
    const plan = createConfinedEnvironmentPlan(operation);
    const context = createContext();
    const renderer = createRenderer(context);

    renderer.paintConfinedBackground(plan, 240);

    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 1280, 720);
    expect(context.createLinearGradient).toHaveBeenCalledTimes(3);
    expect(context.quadraticCurveTo.mock.calls.length).toBeGreaterThan(0);
    expect(context.stroke.mock.calls.length).toBeGreaterThan(12);
  });

  it('layers room-specific interior markings and bulkheads over the confined passage', () => {
    const operation = generateRunSkeleton(
      'CONFINED-ROOM-TREATMENT'
    ).boardingCampaign.operations.find((candidate) =>
      candidate.rooms.some((room) => room.kind === 'reactor')
    );
    if (!operation) throw new Error('Expected a boarding operation with a reactor room.');
    const reactor = operation.rooms.find((room) => room.kind === 'reactor');
    if (!reactor) throw new Error('Expected a reactor room.');
    const plan = createConfinedEnvironmentPlan(operation);
    const context = createContext();
    const renderer = createRenderer(context);

    renderer.paintBoardingInterior(operation, plan, reactor.startDistance + 1);

    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 640, 720);
    expect(context.arc.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(context.fillText).toHaveBeenCalledWith(
      expect.stringContaining(plan.label.toUpperCase()),
      expect.any(Number),
      18
    );
    expect(context.setLineDash).toHaveBeenCalledWith([16, 10]);
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
  Object.assign(renderer, {
    context,
    settings,
    size: { width: 1280, height: 720, dpr: 1 }
  });
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
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    setLineDash: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    shadowColor: '',
    shadowBlur: 0,
    lineWidth: 1,
    globalAlpha: 1,
    font: '',
    textAlign: 'start' as CanvasTextAlign
  };
}
