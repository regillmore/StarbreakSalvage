import { describe, expect, it } from 'vitest';
import { generateRunSkeleton } from '../../src/game/Generation';
import {
  createRouteNavigationReadModel,
  selectNodeRouteEffect
} from '../../src/game/RouteNavigation';

describe('route navigation presentation', () => {
  it('binds one concise deterministic effect from the destination node to its briefing', () => {
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
    expect(first.edgeLabel).toBe(`${run.sectors[0]!.sectorName} → ${run.sectors[1]!.sectorName}`);
    expect(first.difficultyLabel).toBe('EASIER SIGNAL');
    expect(first.effect).not.toBeNull();
    expect(run.sectors[1]!.routeOptions).toContain(first.effect!.route);
    expect(run.sectors[0]!.routeOptions).not.toContain(first.effect!.route);
    expect(Object.keys(first.effect!).sort()).toEqual(['riskLabel', 'route', 'summary']);
    expect(JSON.stringify(first)).not.toMatch(/Campaign:|Seed Exchange|Next mission:/);
  });

  it('gives a shared node the same base effect from either legal parent', () => {
    const run = generateRunSkeleton('SHARED-NODE-EFFECT');
    const fromTwoA = createRouteNavigationReadModel({
      run,
      sourceSectorIndex: 1,
      targetSectorIndex: 4
    });
    const fromTwoB = createRouteNavigationReadModel({
      run,
      sourceSectorIndex: 2,
      targetSectorIndex: 4
    });

    expect(run.sectors[4]!.act.actRouteNodeLabel).toBe('3B');
    expect(fromTwoA.effect).toEqual(fromTwoB.effect);
    expect(fromTwoA.edgeLabel).not.toBe(fromTwoB.edgeLabel);
  });

  it('projects the same terse route-effect shape throughout all three acts', () => {
    const run = generateRunSkeleton('TERSE-ROUTE-EFFECTS');
    const actIds = new Set<string>();

    for (
      let targetSectorIndex = 1;
      targetSectorIndex < run.sectors.length;
      targetSectorIndex += 1
    ) {
      const target = run.sectors[targetSectorIndex]!;
      if (target.routeOptions.length === 0) continue;
      const model = createRouteNavigationReadModel({
        run,
        sourceSectorIndex: targetSectorIndex - 1,
        targetSectorIndex
      });

      expect(Object.keys(model.effect!).sort()).toEqual(['riskLabel', 'route', 'summary']);
      expect(model.effect!.summary).not.toMatch(/^(?:Pressure|Yield|Terrain|Intel) ·/);
      actIds.add(target.act.actId);
    }

    expect(actIds).toEqual(new Set(['act_outer_rim', 'act_core_descent', 'act_null_frontier']));
  });

  it('biases harder destination nodes toward the harder end of their own effect pools', () => {
    let easierRiskPosition = 0;
    let harderRiskPosition = 0;
    const sampleCount = 256;

    for (let index = 0; index < sampleCount; index += 1) {
      const run = generateRunSkeleton(`NODE-EFFECT-BIAS-${index}`);
      easierRiskPosition += getRiskPosition(
        run.sectors[1]!.routeOptions,
        selectNodeRouteEffect(run, 1)
      );
      harderRiskPosition += getRiskPosition(
        run.sectors[2]!.routeOptions,
        selectNodeRouteEffect(run, 2)
      );
    }

    expect(harderRiskPosition / sampleCount).toBeGreaterThan(
      easierRiskPosition / sampleCount + 0.2
    );
  });

  it('does not invent a route effect when no later sector exists', () => {
    const run = generateRunSkeleton('ROUTE-NAV-FINALE');
    const crossAct = createRouteNavigationReadModel({
      run,
      sourceSectorIndex: 8,
      targetSectorIndex: 9
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
    expect(model.effect).toBeNull();
  });

  it('removes shop from every convergence-layer route effect pool', () => {
    for (let index = 0; index < 128; index += 1) {
      const run = generateRunSkeleton(`FINALE-ROUTE-EFFECT-${index}`);
      const finaleSectorIndices = run.sectors.flatMap((sector, sectorIndex) =>
        sector.act.actSectorIndex === sector.act.actSectorCount && sector.routeOptions.length > 0
          ? [sectorIndex]
          : []
      );

      expect(finaleSectorIndices.length).toBeGreaterThan(0);
      for (const sectorIndex of finaleSectorIndices) {
        expect(selectNodeRouteEffect(run, sectorIndex).kind).not.toBe('shop');
      }
    }
  });
});

function getRiskPosition(
  routes: readonly { readonly risk: number }[],
  selected: { readonly risk: number }
): number {
  const risks = routes.map((route) => route.risk);
  const minRisk = Math.min(...risks);
  const span = Math.max(...risks) - minRisk;
  return span === 0 ? 0.5 : (selected.risk - minRisk) / span;
}
