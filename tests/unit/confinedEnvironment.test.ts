import { describe, expect, it, vi } from 'vitest';

import { CanvasRenderer, type RendererSettings } from '../../src/app/CanvasRenderer';
import {
  createConfinedEnvironmentPlan,
  summarizeConfinedEnvironmentPlan
} from '../../src/game/ConfinedEnvironment';
import {
  BOARDING_WORLD_TO_CANVAS,
  createConfinedBackgroundFrame,
  createVisibleBoardingRoomBands
} from '../../src/game/ConfinedEnvironmentPresentation';
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

  it('keeps tall scrolling structures alive across their former viewport wrap seam', () => {
    const operation = generateRunSkeleton('CONFINED-STABLE-STRUCTURE').boardingCampaign
      .operations[0];
    if (!operation) throw new Error('Expected a boarding operation.');
    const plan = createConfinedEnvironmentPlan(operation);
    const viewportHeight = 3000;
    const wrapSpan = viewportHeight + 220;
    const panelIndex = plan.panels.reduce(
      (tallestIndex, panel, index) =>
        panel.height > (plan.panels[tallestIndex]?.height ?? 0) ? index : tallestIndex,
      0
    );
    const panel = plan.panels[panelIndex];
    if (!panel) throw new Error('Expected a confined panel.');
    const seamOffset = (wrapSpan - panel.y * wrapSpan) / plan.panelScrollRatio;
    const before = createConfinedBackgroundFrame({
      plan,
      scrollOffset: seamOffset - 0.25,
      parallaxScale: 1,
      viewportHeight,
      maxPriority: 3
    });
    const after = createConfinedBackgroundFrame({
      plan,
      scrollOffset: seamOffset + 0.25,
      parallaxScale: 1,
      viewportHeight,
      maxPriority: 3
    });
    const previousCopy = before.panels.find((instance) => instance.id === `${panelIndex}:0`);
    const enteringCopy = before.panels.find((instance) => instance.id === `${panelIndex}:-1`);
    const previousCopyAfter = after.panels.find((instance) => instance.id === previousCopy?.id);
    const enteringCopyAfter = after.panels.find((instance) => instance.id === enteringCopy?.id);

    expect(previousCopy).toBeDefined();
    expect(enteringCopy).toBeDefined();
    expect(previousCopyAfter?.panel).toBe(panel);
    expect(enteringCopyAfter?.panel).toBe(panel);
    expect((previousCopyAfter?.y ?? 0) - (previousCopy?.y ?? 0)).toBeCloseTo(
      plan.panelScrollRatio * 0.5
    );
    expect((enteringCopyAfter?.y ?? 0) - (enteringCopy?.y ?? 0)).toBeCloseTo(
      plan.panelScrollRatio * 0.5
    );
  });

  it('anchors rib identities and room treatments to continuous world positions', () => {
    const operation = generateRunSkeleton('CONFINED-WORLD-IDENTITY').boardingCampaign.operations[0];
    if (!operation) throw new Error('Expected a boarding operation.');
    const plan = createConfinedEnvironmentPlan(operation);
    const firstFrame = createConfinedBackgroundFrame({
      plan,
      scrollOffset: 480,
      parallaxScale: 1,
      viewportHeight: 720,
      maxPriority: 3
    });
    const secondFrame = createConfinedBackgroundFrame({
      plan,
      scrollOffset: 490,
      parallaxScale: 1,
      viewportHeight: 720,
      maxPriority: 3
    });
    const secondRibs = new Map(secondFrame.ribs.map((rib) => [rib.id, rib]));
    const persistentRibs = firstFrame.ribs.filter((rib) => secondRibs.has(rib.id));

    expect(persistentRibs.length).toBeGreaterThan(3);
    for (const rib of persistentRibs) {
      expect((secondRibs.get(rib.id)?.y ?? 0) - rib.y).toBeCloseTo(4.2);
    }

    const firstBands = createVisibleBoardingRoomBands(operation, 120, 720);
    const secondBands = new Map(
      createVisibleBoardingRoomBands(operation, 121, 720).map((band) => [band.id, band])
    );
    const persistentBands = firstBands.filter((band) => {
      const next = secondBands.get(band.id);
      return (
        next !== undefined &&
        band.top > 0 &&
        band.bottom < 720 &&
        next.top > 0 &&
        next.bottom < 720
      );
    });

    expect(new Set(firstBands.map((band) => band.kind)).size).toBeGreaterThan(1);
    expect(persistentBands.length).toBeGreaterThan(1);
    for (const band of persistentBands) {
      const next = secondBands.get(band.id);
      expect(next?.kind).toBe(band.kind);
      expect((next?.top ?? 0) - band.top).toBeCloseTo(BOARDING_WORLD_TO_CANVAS);
      expect((next?.bottom ?? 0) - band.bottom).toBeCloseTo(BOARDING_WORLD_TO_CANVAS);
    }
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
    expect(context.clip.mock.calls.length).toBeGreaterThan(1);
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
    rect: vi.fn(),
    clip: vi.fn(),
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
