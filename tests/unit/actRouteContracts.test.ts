import { describe, expect, it } from 'vitest';

import { ACT_ROUTE_CONTRACTS } from '../../src/content/actRouteContracts';
import { getEligibleActRouteContracts } from '../../src/game/ActRouteContracts';
import { generateRunSkeleton, type RunSkeleton } from '../../src/game/Generation';

describe('Act II route contracts', () => {
  it('keeps fresh and progressed save eligibility deterministic', () => {
    const context = {
      actId: 'act_core_descent' as const,
      sectorId: 'sector_bio_machine_bloom' as const,
      backgroundId: 'background_bio_machine_bloom' as const,
      bossFactionId: 'faction_bloom_hive' as const,
      objectiveKind: 'clearWaves' as const
    };
    const fresh = getEligibleActRouteContracts({
      ...context,
      unlockedIds: []
    });
    const progressed = getEligibleActRouteContracts({
      ...context,
      unlockedIds: ['unlock_faction_bloom_hive']
    });

    expect(fresh.map((contract) => contract.id)).not.toContain('act2_bloom_graft_cache');
    expect(progressed.map((contract) => contract.id)).toContain('act2_bloom_graft_cache');
    expect(new Set(ACT_ROUTE_CONTRACTS.map((contract) => contract.kind))).toEqual(
      new Set(['shop', 'elite', 'vault', 'repair', 'glitch', 'factionAmbush'])
    );
  });

  it('generates distinct Act II route-card copy across all nine route nodes', () => {
    const run = generateRunSkeleton('ACT2-ROUTE-COPY-SMOKE');
    const repeated = generateRunSkeleton('ACT2-ROUTE-COPY-SMOKE');
    const actOne = run.acts[0]!;
    const actOneRoutes = run.sectors
      .slice(actOne.startSectorIndex, actOne.endSectorIndex + 1)
      .flatMap((sector) => sector.routeOptions);
    const actTwoRoutes = projectActTwoRoutes(run);

    expect(actOneRoutes.every((route) => route.actRouteId === undefined)).toBe(true);
    expect(actTwoRoutes).toEqual(projectActTwoRoutes(repeated));
    expect(actTwoRoutes).toHaveLength(9);
    expect(actTwoRoutes.every((sector) => sector.routes.length === 3)).toBe(true);
    expect(
      actTwoRoutes.flatMap((sector) => sector.routes).every(
        (route) =>
          route.actRouteId &&
          route.tags.length > 0 &&
          route.pressureHint &&
          route.rewardTierHint &&
          route.environmentalHint
      )
    ).toBe(true);
    expect(
      new Set(actTwoRoutes.flatMap((sector) => sector.routes.map((route) => route.actRouteId))).size
    ).toBeGreaterThanOrEqual(6);
  });
});

function projectActTwoRoutes(run: RunSkeleton) {
  const actTwo = run.acts[1]!;
  return run.sectors
    .slice(actTwo.startSectorIndex, actTwo.endSectorIndex + 1)
    .map((sector) => ({
      sector: sector.sectorId,
      routes: sector.routeOptions.map((route) => ({
        kind: route.kind,
        label: route.label,
        actRouteId: route.actRouteId,
        tags: route.routeTags ?? [],
        pressureHint: route.pressureHint,
        rewardTierHint: route.rewardTierHint,
        environmentalHint: route.environmentalHint
      }))
    }));
}
