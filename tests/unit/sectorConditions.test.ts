import { describe, expect, it } from 'vitest';

import { generateRunSkeleton, type RouteKind, type RouteOption } from '../../src/game/Generation';
import {
  advanceSector,
  applyRouteOutcome,
  createRunSession,
  getCurrentSector
} from '../../src/game/RunSession';
import { generateRouteOutcome } from '../../src/game/RouteEvents';
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
    expect(first).toMatchInlineSnapshot(`
      {
        "conditions": {
          "bossApproachMultiplier": 0.9,
          "hazardDensityDelta": 1,
          "hazardKinds": [
            "salvage_storm",
          ],
          "labels": [
            "Glitch shear",
          ],
          "landmarkKinds": [
            "beacon_line",
          ],
          "lengthMultiplier": 1.02,
          "scrollSpeedMultiplier": 1.12,
          "sectorId": "sector_trade_war_corridor",
          "sectorIndex": 1,
        },
        "features": {
          "hazardKinds": [
            "mine_belt",
            "salvage_storm",
            "warning_beam",
          ],
          "hazardWindows": [
            [
              409.53,
              544.17,
              736.95,
            ],
            [
              784.07,
              934.07,
              1139.07,
            ],
            [
              800.39,
              994.19,
              1166.57,
            ],
          ],
          "landmarkKinds": [
            "vault_door",
            "beacon_line",
            "convoy_shadow",
            "beacon_line",
          ],
        },
        "readout": "Sector conditions: Glitch shear (+12% scroll, +2% distance, +1 hazard, landmark beacon_line, -10% boss approach)",
        "scroll": {
          "baseSpeed": 103.04,
          "length": 1698.3,
        },
      }
    `);
  });

  it('changes future scroll speed and hazard density by route kind', () => {
    const market = getConditionedNextSector('STARBREAK-SMOKE', 'shop');
    const glitch = getConditionedNextSector('STARBREAK-SMOKE', 'glitch');

    expect(market.scroll.baseSpeed).toBeLessThan(market.baseSector.scroll.baseSpeed);
    expect(market.features.hazards.length).toBeLessThan(market.baseSector.features.hazards.length);
    expect(market.features.landmarks.map((landmark) => landmark.kind)).toContain('convoy_shadow');

    expect(glitch.scroll.baseSpeed).toBeGreaterThan(glitch.baseSector.scroll.baseSpeed);
    expect(glitch.features.hazards.length).toBeGreaterThan(
      glitch.baseSector.features.hazards.length
    );
    expect(glitch.features.hazards.map((hazard) => hazard.kind)).toContain('salvage_storm');
    expect(validateSectorFeaturePlan(glitch.features, glitch.scroll.length)).toEqual([]);
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
    session.currentSectorIndex = 2;

    const sector = getCurrentSector(run, session);
    const route = makeRoute('vault');
    const outcome = generateRouteOutcome({
      run,
      sector,
      route,
      availableCredits: session.credits
    });

    applyRouteOutcome(session, sector, route, outcome);
    expect(advanceSector(run, session)).toBe(true);

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
    const { run, session } = selectRouteIntoNextSector('STARBREAK-SMOKE', 'factionAmbush');

    expect(formatSectorConditionTimeline(run, session.routeOutcomes)).toContain(
      'S2 Ambush pressure'
    );
    expect(formatSectorConditionTimeline(run, session.routeOutcomes)).toContain('+1 hazard');
  });
});

function summarizeConditionedNextSector(seed: string, kind: RouteKind): unknown {
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
  const { run, session } = selectRouteIntoNextSector(seed, kind);
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

function selectRouteIntoNextSector(seed: string, kind: RouteKind) {
  const run = generateRunSkeleton(seed);
  const contract = run.contracts[0];

  if (!contract) {
    throw new Error('Expected contract.');
  }

  const session = createRunSession(run, contract);
  const sector = getCurrentSector(run, session);
  const route = makeRoute(kind);
  const outcome = generateRouteOutcome({
    run,
    sector,
    route,
    availableCredits: session.credits
  });

  applyRouteOutcome(session, sector, route, outcome);
  expect(advanceSector(run, session)).toBe(true);

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
