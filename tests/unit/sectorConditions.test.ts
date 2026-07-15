import { describe, expect, it } from 'vitest';

import { generateRunSkeleton, type RouteKind, type RouteOption } from '../../src/game/Generation';
import {
  advanceSector,
  applyRouteOutcome,
  createRunSession,
  getCurrentSector
} from '../../src/game/RunSession';
import { generateRouteOutcome } from '../../src/game/RouteEvents';
import { getNextActRouteSectorIndices } from '../../src/game/ActRouteGraph';
import {
  applySectorConditionsToBossArena,
  applySectorConditionsToFeatures,
  applySectorConditionsToScroll,
  createSectorConditionPlan,
  formatSectorConditionReadout,
  formatSectorConditionTimeline,
  summarizeSectorConditionPlan
} from '../../src/game/SectorConditions';
import {
  summarizeSectorFeaturePlan,
  validateSectorFeaturePlan
} from '../../src/game/SectorFeatures';

describe('SectorConditions', () => {
  it('reproduces route-selected sector conditions for the same seed and choice', () => {
    const first = summarizeConditionedNextSector('STARBREAK-SMOKE', 'glitch');
    const second = summarizeConditionedNextSector('STARBREAK-SMOKE', 'glitch');

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      conditions: {
        sectorIndex: 2,
        sectorId: 'sector_bio_machine_bloom',
        labels: ['Contested vector', 'Glitch shear'],
        scrollSpeedMultiplier: 1.2,
        lengthMultiplier: 1.1,
        hazardDensityDelta: 2,
        hazardKinds: ['warning_beam', 'salvage_storm'],
        bossApproachMultiplier: 0.83
      },
      features: {
        hazardKinds: expect.arrayContaining([
          'warning_beam',
          'salvage_storm',
          'mine_belt',
          'debris_lane'
        ])
      },
      readout: expect.stringContaining('Contested vector | Glitch shear'),
      scroll: { length: expect.any(Number) }
    });
  });

  it('changes future scroll speed and hazard density by route kind', () => {
    const market = getConditionedNextSector('STARBREAK-SMOKE', 'shop');
    const glitch = getConditionedNextSector('STARBREAK-SMOKE', 'glitch');

    expect(market.scroll.baseSpeed).toBeLessThan(glitch.scroll.baseSpeed);
    expect(market.features.hazards.length).toBeLessThan(glitch.features.hazards.length);
    expect(market.features.landmarks.map((landmark) => landmark.kind)).toContain('convoy_shadow');

    expect(glitch.scroll.baseSpeed).toBeGreaterThan(glitch.baseSector.scroll.baseSpeed);
    expect(glitch.features.hazards.map((hazard) => hazard.kind)).toContain('salvage_storm');
    expect(validateSectorFeaturePlan(glitch.features, glitch.scroll.length)).toEqual([]);
  });

  it('applies route-conditioned pressure to lunar features without losing lunar identity', () => {
    const conditioned = getConditionedSectorAfterRoute('LUNAR-SURFACE-LANE', 0, 'glitch', 2);

    expect(conditioned.baseSector.sectorId).toBe('sector_lunar_surface');
    expect(conditioned.conditions.hazardKinds).toEqual(['warning_beam', 'salvage_storm']);
    expect(conditioned.features.hazards.length).toBeGreaterThan(
      conditioned.baseSector.features.hazards.length
    );
    expect(conditioned.features.hazards.map((hazard) => hazard.kind)).toEqual(
      expect.arrayContaining([
        'dust_plume',
        'mining_laser',
        'surface_defense_arc',
        'salvage_storm'
      ])
    );
    expect(conditioned.features.landmarks.map((landmark) => landmark.kind)).toEqual(
      expect.arrayContaining(['crater_shadow_band', 'comm_array_flyby', 'surface_relay'])
    );
    expect(validateSectorFeaturePlan(conditioned.features, conditioned.scroll.length)).toEqual([]);
  });

  it('applies challenge and unlock condition modifiers deterministically', () => {
    const challengeRun = generateRunSkeleton('DEBT-CEILING-404', {
      unlockedIds: ['unlock_challenge_debt_ceiling']
    });
    const challengePlan = createSectorConditionPlan({
      run: challengeRun,
      sectorIndex: 0,
      routeOutcomes: []
    });

    expect(summarizeSectorConditionPlan(challengePlan)).toEqual({
      sectorIndex: 0,
      sectorId: 'sector_outer_debris_field',
      labels: ['Debt ceiling'],
      scrollSpeedMultiplier: 1.04,
      lengthMultiplier: 0.98,
      hazardDensityDelta: 1,
      landmarkKinds: ['beacon_line'],
      hazardKinds: ['warning_beam'],
      bossApproachMultiplier: 0.96
    });

    const baseRun = generateRunSkeleton('STARBREAK-SMOKE', {
      unlockedIds: ['unlock_faction_bloom_hive']
    });
    const firstSector = baseRun.sectors[0];

    if (!firstSector) {
      throw new Error('Expected opening sector.');
    }

    const bloomRun = {
      ...baseRun,
      sectors: [
        {
          ...firstSector,
          bossFactionId: 'faction_bloom_hive' as const
        },
        ...baseRun.sectors.slice(1)
      ]
    };
    const bloomPlan = createSectorConditionPlan({
      run: bloomRun,
      sectorIndex: 0,
      routeOutcomes: []
    });

    expect(summarizeSectorConditionPlan(bloomPlan)).toMatchObject({
      labels: ['Bloom dossier'],
      hazardKinds: ['salvage_storm'],
      landmarkKinds: ['core_machinery']
    });
  });

  it('adjusts boss arena approach timing for route-conditioned boss sectors', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const contract = run.contracts[0];

    if (!contract) {
      throw new Error('Expected contract.');
    }

    const session = createRunSession(run, contract);
    const edge = run.actRouteGraph.edges.find(
      (candidate) => run.sectors[candidate.targetSectorIndex]?.arena !== null
    );
    if (!edge) throw new Error('Expected a routed boss arena.');
    session.currentSectorIndex = edge.sourceSectorIndex;

    const sector = getCurrentSector(run, session);
    const route = makeRoute('vault');
    const outcome = generateRouteOutcome({
      run,
      sector,
      route,
      availableCredits: session.credits,
      targetSectorIndex: edge.targetSectorIndex
    });

    applyRouteOutcome(session, sector, route, outcome);
    expect(advanceSector(run, session, edge.targetSectorIndex)).toBe(true);

    const baseSector = getCurrentSector(run, session);
    const conditions = createSectorConditionPlan({
      run,
      sectorIndex: session.currentSectorIndex,
      routeOutcomes: session.routeOutcomes
    });
    const scroll = applySectorConditionsToScroll(baseSector.scroll, conditions);
    const arena = applySectorConditionsToBossArena(
      baseSector.arena,
      baseSector.scroll,
      scroll,
      conditions
    );

    expect(baseSector.arena).not.toBeNull();
    expect(arena?.releaseDistance).toBe(scroll.length);
    expect(arena?.approachStartDistance).not.toBe(baseSector.arena?.approachStartDistance);
    expect(arena?.approachSpeed).toBeLessThanOrEqual(scroll.maxSpeed);
  });

  it('formats summary text for notable physical route effects', () => {
    const { run, session } = selectRouteIntoSector('STARBREAK-SMOKE', 0, 'factionAmbush', 2);

    expect(formatSectorConditionTimeline(run, session.routeOutcomes)).toContain(
      'Ambush pressure'
    );
    expect(formatSectorConditionTimeline(run, session.routeOutcomes)).toContain('+2 hazard');
  });
});

function summarizeConditionedNextSector(seed: string, kind: RouteKind) {
  const conditioned = getConditionedNextSector(seed, kind);

  return {
    conditions: summarizeSectorConditionPlan(conditioned.conditions),
    readout: formatSectorConditionReadout(conditioned.conditions),
    scroll: {
      length: conditioned.scroll.length,
      baseSpeed: conditioned.scroll.baseSpeed
    },
    features: summarizeSectorFeaturePlan(conditioned.features)
  };
}

function getConditionedNextSector(seed: string, kind: RouteKind) {
  return getConditionedSectorAfterRoute(seed, 0, kind, 2);
}

function getConditionedSectorAfterRoute(
  seed: string,
  sourceSectorIndex: number,
  kind: RouteKind,
  targetSectorIndex?: number
) {
  const { run, session } = selectRouteIntoSector(
    seed,
    sourceSectorIndex,
    kind,
    targetSectorIndex
  );
  const baseSector = getCurrentSector(run, session);
  const conditions = createSectorConditionPlan({
    run,
    sectorIndex: session.currentSectorIndex,
    routeOutcomes: session.routeOutcomes
  });
  const scroll = applySectorConditionsToScroll(baseSector.scroll, conditions);
  const features = applySectorConditionsToFeatures(
    baseSector.features,
    baseSector.scroll,
    scroll,
    conditions
  );

  return {
    run,
    session,
    baseSector,
    conditions,
    scroll,
    features
  };
}

function selectRouteIntoSector(
  seed: string,
  sourceSectorIndex: number,
  kind: RouteKind,
  targetSectorIndex?: number
) {
  const run = generateRunSkeleton(seed);
  const contract = run.contracts[0];

  if (!contract) {
    throw new Error('Expected contract.');
  }

  const session = createRunSession(run, contract);
  session.currentSectorIndex = sourceSectorIndex;
  const sector = getCurrentSector(run, session);
  const target =
    targetSectorIndex ?? getNextActRouteSectorIndices(run.actRouteGraph, sourceSectorIndex)[0];
  if (target === undefined) throw new Error('Expected a routed target sector.');
  const route = makeRoute(kind);
  const outcome = generateRouteOutcome({
    run,
    sector,
    route,
    availableCredits: session.credits,
    targetSectorIndex: target
  });

  applyRouteOutcome(session, sector, route, outcome);
  expect(advanceSector(run, session, target)).toBe(true);

  return { run, session };
}

function makeRoute(kind: RouteKind): RouteOption {
  return {
    kind,
    label: kind === 'factionAmbush' ? 'Faction Ambush' : titleCase(kind),
    risk: kind === 'shop' || kind === 'repair' ? 1 : 4,
    rewardHint: `${kind} test route`
  };
}

function titleCase(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
