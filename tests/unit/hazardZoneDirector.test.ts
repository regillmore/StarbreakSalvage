import { describe, expect, it } from 'vitest';

import { getHazardZoneDefinition } from '../../src/content/hazardZones';
import {
  applyHazardZoneDirectorToFeatures,
  consumeHazardZoneScheduleEvents,
  createHazardZoneDirectorPlan,
  createHazardZoneScheduleRuntimeState,
  formatHazardZoneDirectorReadout,
  getHazardSequenceOrdinal,
  summarizeHazardZoneDirectorPlan
} from '../../src/game/HazardZoneDirector';
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
  createSectorConditionPlan
} from '../../src/game/SectorConditions';
import {
  applySectorPacingToBossArena,
  applySectorPacingToFeatures,
  applySectorPacingToScroll,
  createSectorPacingPlan
} from '../../src/game/SectorPacing';
import { getActiveSectorHazards, validateSectorFeaturePlan } from '../../src/game/SectorFeatures';
import {
  getNextActRouteSectorIndices
} from '../../src/game/ActRouteGraph';

describe('HazardZoneDirector', () => {
  it('assigns every sector and bonus-operation hazard sequence a deterministic run-wide identity', () => {
    const fixture = getDirectedSectorAfterRoute('HAZARD-SEQUENCE-NONREUSE', 0, 'factionAmbush');
    const roles = ['advance', 'detour', 'gate', 'pursuit'] as const;
    const plans = Array.from({ length: 15 }, (_value, sectorIndex) =>
      roles.map((role) =>
        createHazardZoneDirectorPlan({
          runSeed: fixture.run.seed,
          saveStateKey: fixture.run.unlockedIds.join('|'),
          sequenceKey: `sector-${sectorIndex + 1}:${role}`,
          sequenceOrdinal: getHazardSequenceOrdinal(sectorIndex, role),
          features: fixture.pacedFeatures,
          scroll: fixture.scroll,
          conditions: fixture.conditions,
          pacing: fixture.pacing,
          bossArena: fixture.arena,
          backgroundId: fixture.sector.background.id
        })
      )
    ).flat();
    const fingerprints = plans.map((plan) =>
      plan.entries
        .map(
          (entry) =>
            `${entry.source}:${entry.hazard.kind}:${entry.hazard.startDistance}:${entry.hazard.xRatio}`
        )
        .join('|')
    );
    const repeated = createHazardZoneDirectorPlan({
      runSeed: fixture.run.seed,
      saveStateKey: fixture.run.unlockedIds.join('|'),
      sequenceKey: 'sector-1:advance',
      sequenceOrdinal: getHazardSequenceOrdinal(0, 'advance'),
      features: fixture.pacedFeatures,
      scroll: fixture.scroll,
      conditions: fixture.conditions,
      pacing: fixture.pacing,
      bossArena: fixture.arena,
      backgroundId: fixture.sector.background.id
    });
    const beams = plans.flatMap((plan) =>
      plan.entries.map((entry) => entry.hazard).filter((hazard) => hazard.kind === 'warning_beam')
    );

    expect(plans).toHaveLength(60);
    expect(new Set(plans.map((plan) => plan.sequenceOrdinal)).size).toBe(60);
    expect(new Set(fingerprints).size).toBe(60);
    expect(summarizeHazardZoneDirectorPlan(repeated)).toEqual(
      summarizeHazardZoneDirectorPlan(plans[0]!)
    );
    expect(beams.length).toBeGreaterThan(0);
    expect(beams.every((beam) => beam.beam !== undefined)).toBe(true);
    expect(new Set(beams.map((beam) => beam.beam?.sourceEdge)).size).toBeGreaterThan(1);

    const applied = applyHazardZoneDirectorToFeatures(fixture.pacedFeatures, plans[0]!);
    expect(validateSectorFeaturePlan(applied, fixture.scroll.length)).toEqual([]);
    expect(applied.hazards.map((hazard) => hazard.xRatio)).toEqual(
      plans[0]!.entries
        .map((entry) => entry.hazard)
        .sort((left, right) => left.startDistance - right.startDistance)
        .map((hazard) => hazard.xRatio)
    );
  });

  it('creates deterministic known-seed schedules from run and save context', () => {
    const first = getDirectedSectorWithAddition('LONG-SECTOR-CARAVAN', 'factionAmbush');
    const second = getDirectedSectorAfterRoute(
      'LONG-SECTOR-CARAVAN',
      first.routeSourceSectorIndex,
      'factionAmbush',
      first.session.currentSectorIndex
    );

    expect(summarizeHazardZoneDirectorPlan(first.director)).toEqual(
      summarizeHazardZoneDirectorPlan(second.director)
    );

    const progressedSaveDirector = createHazardZoneDirectorPlan({
      runSeed: first.run.seed,
      saveStateKey: 'unlock_phase_courier',
      features: first.pacedFeatures,
      scroll: first.scroll,
      conditions: first.conditions,
      pacing: first.pacing,
      bossArena: first.arena,
      backgroundId: first.sector.background.id
    });
    const firstDirectorHazard = first.director.entries.find((entry) => entry.source === 'director');
    const progressedDirectorHazard = progressedSaveDirector.entries.find(
      (entry) => entry.source === 'director'
    );

    expect(first.director.scheduledHazardCount).toBeGreaterThan(0);
    expect(firstDirectorHazard?.hazard.xRatio).not.toBe(progressedDirectorHazard?.hazard.xRatio);
    expect(first.director.entries.map((entry) => entry.hazard.kind)).toEqual(
      expect.arrayContaining(['mine_belt'])
    );
    expect(formatHazardZoneDirectorReadout(first.director)).toContain('Hazard zones:');
    expect(validateSectorFeaturePlan(first.features, first.scroll.length)).toEqual([]);
  });

  it('keeps director additions outside relief windows', () => {
    const directed = getDirectedSectorWithAddition('LONG-SECTOR-CARAVAN', 'factionAmbush');
    const additions = directed.director.entries.filter((entry) => entry.source === 'director');

    expect(directed.pacing.reliefWindows.length).toBeGreaterThan(0);
    expect(additions.length).toBeGreaterThan(0);

    for (const addition of additions) {
      for (const relief of directed.pacing.reliefWindows) {
        expect(
          addition.distanceRatio < relief.startRatio || addition.distanceRatio > relief.endRatio
        ).toBe(true);
      }
    }
  });

  it('responds to route-conditioned hazard pressure without filling quiet routes', () => {
    const [pressured, quiet] = getDirectedPressurePair('LONG-SECTOR-CARAVAN');

    expect(pressured.conditions.hazardDensityDelta).toBeGreaterThan(0);
    expect(quiet.conditions.hazardDensityDelta).toBeLessThan(0);
    expect(pressured.director.pressureLevel).toBeGreaterThan(quiet.director.pressureLevel);
  });

  it('consumes distance marker events in order under frame catchup without duplicates', () => {
    const directed = getDirectedSectorAfterRoute('LONG-SECTOR-CARAVAN', 1, 'factionAmbush');
    const state = createHazardZoneScheduleRuntimeState(directed.director);
    const events = consumeHazardZoneScheduleEvents(
      directed.director,
      state,
      directed.scroll.length
    );
    const duplicateAttempt = consumeHazardZoneScheduleEvents(
      directed.director,
      state,
      directed.scroll.length
    );

    expect(events).toHaveLength(directed.director.events.length);
    expect(duplicateAttempt).toEqual([]);

    for (let index = 1; index < events.length; index += 1) {
      expect(events[index]?.distance ?? 0).toBeGreaterThanOrEqual(events[index - 1]?.distance ?? 0);
    }
  });

  it('settles boss-lock hazard overlaps inside the approach instead of deferring them', () => {
    const directed = getDirectedBossSectorWithAdjustedHazard('BOSS-HAZARD-DIRECTOR');
    const adjusted = directed.director.entries.find(
      (entry) => entry.source === 'director' && entry.adjustedForBossApproach
    );

    expect(directed.arena).not.toBeNull();
    expect(adjusted).toBeDefined();

    if (!directed.arena || !adjusted) {
      throw new Error('Expected a boss arena and approach-adjusted director hazard.');
    }

    const definition = getHazardZoneDefinition(adjusted.hazard.kind);
    const activeAtLock = getActiveSectorHazards(directed.features, directed.arena.lockDistance);

    expect(adjusted.hazard.endDistance).toBeLessThan(directed.arena.lockDistance);
    expect(
      adjusted.hazard.startDistance - adjusted.hazard.telegraphDistance
    ).toBeGreaterThanOrEqual(definition.phase.minTelegraphLead);
    expect(activeAtLock.find((active) => active.hazard.id === adjusted.hazard.id)).toBeUndefined();
    expect(directed.director.bossApproachAdjustmentCount).toBeGreaterThan(0);
    expect(formatHazardZoneDirectorReadout(directed.director)).toContain(
      'boss-approach adjustment'
    );
  });

  it('leaves STARBREAK-SMOKE Act I sector 4 free of post-boss hazard debt', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const contract = run.contracts[0];
    if (!contract) throw new Error('Expected contract.');
    const session = createRunSession(run, contract);
    session.currentSectorIndex = 3;
    const directed = createDirectedCurrentSector(run, session);

    expect(directed.arena).not.toBeNull();
    if (!directed.arena) throw new Error('Expected Act I sector 4 boss arena.');

    expect(directed.features.hazards.length).toBeGreaterThan(0);
    expect(
      directed.features.hazards.every((hazard) => hazard.endDistance < directed.arena!.lockDistance)
    ).toBe(true);
    expect(getActiveSectorHazards(directed.features, directed.arena.lockDistance)).toEqual([]);
    expect(getActiveSectorHazards(directed.features, directed.arena.releaseDistance)).toEqual([]);
  });
});

function getDirectedSectorAfterRoute(
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
  return { ...createDirectedCurrentSector(run, session), routeSourceSectorIndex: sourceSectorIndex };
}

function getDirectedSectorWithAddition(seed: string, kind: RouteKind) {
  const run = generateRunSkeleton(seed);
  for (const edge of run.actRouteGraph.edges) {
    const directed = getDirectedSectorAfterRoute(
      seed,
      edge.sourceSectorIndex,
      kind,
      edge.targetSectorIndex
    );
    if (directed.director.scheduledHazardCount > 0) return directed;
  }
  throw new Error(`Expected ${kind} to schedule a director hazard.`);
}

function getDirectedPressurePair(seed: string) {
  const run = generateRunSkeleton(seed);
  for (const edge of run.actRouteGraph.edges) {
    const pressured = getDirectedSectorAfterRoute(
      seed,
      edge.sourceSectorIndex,
      'factionAmbush',
      edge.targetSectorIndex
    );
    const quiet = getDirectedSectorAfterRoute(
      seed,
      edge.sourceSectorIndex,
      'repair',
      edge.targetSectorIndex
    );
    if (
      pressured.conditions.hazardDensityDelta > 0 &&
      quiet.conditions.hazardDensityDelta < 0 &&
      pressured.director.pressureLevel > quiet.director.pressureLevel
    ) {
      return [pressured, quiet] as const;
    }
  }
  throw new Error('Expected a route edge with distinct pressured and quiet hazard schedules.');
}

function getDirectedBossSectorWithAdjustedHazard(seed: string) {
  const run = generateRunSkeleton(seed);
  const contract = run.contracts[0];

  if (!contract) {
    throw new Error('Expected contract.');
  }

  const session = createRunSession(run, contract);

  for (let index = 0; index < run.sectors.length; index += 1) {
    if (!run.sectors[index]?.arena) {
      continue;
    }

    session.currentSectorIndex = index;
    const directed = createDirectedCurrentSector(run, session);
    const adjusted = directed.director.entries.some(
      (entry) => entry.source === 'director' && entry.adjustedForBossApproach
    );

    if (adjusted) {
      return directed;
    }
  }

  throw new Error('Expected at least one boss sector with an approach-adjusted director hazard.');
}

function createDirectedCurrentSector(
  run: ReturnType<typeof generateRunSkeleton>,
  session: ReturnType<typeof createRunSession>
) {
  const sector = getCurrentSector(run, session);
  const conditions = createSectorConditionPlan({
    run,
    sectorIndex: session.currentSectorIndex,
    routeOutcomes: session.routeOutcomes
  });
  const routeScroll = applySectorConditionsToScroll(sector.scroll, conditions);
  const routeFeatures = applySectorConditionsToFeatures(
    sector.features,
    sector.scroll,
    routeScroll,
    conditions
  );
  const pacing = createSectorPacingPlan({
    runSeed: run.seed,
    sector,
    sectorIndex: session.currentSectorIndex,
    conditions,
    scroll: routeScroll
  });
  const scroll = applySectorPacingToScroll(routeScroll, pacing);
  const pacedFeatures = applySectorPacingToFeatures(routeFeatures, scroll, pacing);
  const routeArena = applySectorConditionsToBossArena(
    sector.arena,
    sector.scroll,
    routeScroll,
    conditions
  );
  const arena = applySectorPacingToBossArena(routeArena, routeScroll, scroll, pacing);
  const director = createHazardZoneDirectorPlan({
    runSeed: run.seed,
    saveStateKey: run.unlockedIds.join('|'),
    features: pacedFeatures,
    scroll,
    conditions,
    pacing,
    bossArena: arena,
    backgroundId: sector.background.id
  });
  const features = applyHazardZoneDirectorToFeatures(pacedFeatures, director);

  return {
    run,
    session,
    sector,
    conditions,
    pacing,
    scroll,
    arena,
    director,
    pacedFeatures,
    features
  };
}

function selectRouteIntoSector(
  seed: string,
  sourceSectorIndex: number,
  kind: RouteKind,
  requestedTargetSectorIndex?: number
) {
  const run = generateRunSkeleton(seed);
  const contract = run.contracts[0];

  if (!contract) {
    throw new Error('Expected contract.');
  }

  const session = createRunSession(run, contract);
  session.currentSectorIndex = sourceSectorIndex;
  const sector = getCurrentSector(run, session);
  const route = makeRoute(kind);
  const targetSectorIndex =
    requestedTargetSectorIndex ??
    getNextActRouteSectorIndices(run.actRouteGraph, sourceSectorIndex).at(-1);
  if (targetSectorIndex === undefined) {
    throw new Error(`Expected a route target after sector ${sourceSectorIndex}.`);
  }
  const outcome = generateRouteOutcome({
    run,
    sector,
    route,
    targetSectorIndex,
    availableCredits: session.credits
  });

  applyRouteOutcome(session, sector, route, outcome);
  expect(advanceSector(run, session, targetSectorIndex)).toBe(true);

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
