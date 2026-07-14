import { describe, expect, it } from 'vitest';
import { generateRunSkeleton } from '../../src/game/Generation';
import { createRouteNavigationReadModel } from '../../src/game/RouteNavigation';

describe('route navigation presentation', () => {
  it('projects three concise deterministic edge choices into the next mission briefing', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const first = createRouteNavigationReadModel({
      run,
      sourceSectorIndex: 0,
      targetSectorIndex: 1
    });
    const repeat = createRouteNavigationReadModel({
      run,
      sourceSectorIndex: 0,
      targetSectorIndex: 1
    });

    expect(repeat).toEqual(first);
    expect(first).toMatchObject({
      edgeLabel: 'Outer Debris Field → Trade War Corridor',
      title: 'Running Audit briefing',
      objective: 'PURSUE · Running Pursuit'
    });
    expect(first.options).toHaveLength(3);
    expect(first.options.map((option) => option.route.kind)).toEqual(
      run.sectors[0]!.routeOptions.map((route) => route.kind)
    );
    expect(first.options.every((option) => option.details.length <= 2)).toBe(true);
    expect(JSON.stringify(first)).not.toMatch(/Campaign:|Seed Exchange|Next mission:/);
  });

  it('keeps a compact final outbound choice when no later sector exists', () => {
    const run = generateRunSkeleton('ROUTE-NAV-FINALE');
    const crossAct = createRouteNavigationReadModel({
      run,
      sourceSectorIndex: 4,
      targetSectorIndex: 5
    });
    const sourceSectorIndex = run.sectors.length - 1;
    const model = createRouteNavigationReadModel({
      run,
      sourceSectorIndex,
      targetSectorIndex: null
    });

    expect(crossAct.actLabel).toBe('Act II 1/5');
    expect(crossAct.edgeLabel).toContain('→');
    expect(model.targetSectorIndex).toBeNull();
    expect(model.edgeLabel).toContain('final extraction');
    expect(model.objective).toBe('FINAL EXTRACTION');
    expect(model.options).toHaveLength(3);
  });
});
