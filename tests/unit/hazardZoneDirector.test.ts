import { describe, expect, it } from 'vitest';

import { getHazardZoneDefinition } from '../../src/content/hazardZones';
import {
  applyHazardZoneDirectorToFeatures,
  consumeHazardZoneScheduleEvents,
  createHazardZoneDirectorPlan,
  createHazardZoneScheduleRuntimeState,
  formatHazardZoneDirectorReadout,
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

describe('HazardZoneDirector', () => {
  it('creates deterministic known-seed schedules from run and save context', () => {
    const first = getDirectedSectorAfterRoute('LONG-SECTOR-CARAVAN', 0, 'factionAmbush');
    const second = getDirectedSectorAfterRoute('LONG-SECTOR-CARAVAN', 0, 'factionAmbush');

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
    const directed = getDirectedSectorAfterRoute('LONG-SECTOR-CARAVAN', 0, 'factionAmbush');
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
    const pressured = getDirectedSectorAfterRoute('LONG-SECTOR-CARAVAN', 0, 'factionAmbush');
    const quiet = getDirectedSectorAfterRoute('LONG-SECTOR-CARAVAN', 0, 'repair');

    expect(pressured.conditions.hazardDensityDelta).toBeGreaterThan(0);
    expect(quiet.conditions.hazardDensityDelta).toBeLessThan(0);
    expect(pressured.director.scheduledHazardCount).toBeGreaterThan(
      quiet.director.scheduledHazardCount
    );
    expect(pressured.director.pressureLevel).toBeGreaterThan(quiet.director.pressureLevel);
  });

  it('consumes distance marker events in order under frame catchup without duplicates', () => {
    const directed = getDirectedSectorAfterRoute('LONG-SECTOR-CARAVAN', 0, 'factionAmbush');
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

  it('defers director hazards hidden by boss locks until a fresh post-lock telegraph', () => {
    const directed = getDirectedBossSectorWithDeferredHazard('BOSS-HAZARD-DIRECTOR');
    const deferred = directed.director.entries.find(
      (entry) => entry.source === 'director' && entry.deferredForBossLock
    );

    expect(directed.arena).not.toBeNull();
    expect(deferred).toBeDefined();

    if (!directed.arena || !deferred) {
      throw new Error('Expected a boss arena and deferred director hazard.');
    }

    const definition = getHazardZoneDefinition(deferred.hazard.kind);
    const activeAtLock = getActiveSectorHazards(directed.features, directed.arena.lockDistance);

    expect(deferred.hazard.telegraphDistance).toBe(directed.arena.lockDistance);
    expect(
      deferred.hazard.startDistance - deferred.hazard.telegraphDistance
    ).toBeGreaterThanOrEqual(definition.phase.minTelegraphLead);
    expect(activeAtLock.find((active) => active.hazard.id === deferred.hazard.id)?.phase).toBe(
      'telegraph'
    );
  });
});

function getDirectedSectorAfterRoute(seed: string, sourceSectorIndex: number, kind: RouteKind) {
  const { run, session } = selectRouteIntoSector(seed, sourceSectorIndex, kind);
  return createDirectedCurrentSector(run, session);
}

function getDirectedBossSectorWithDeferredHazard(seed: string) {
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
    const deferred = directed.director.entries.some(
      (entry) => entry.source === 'director' && entry.deferredForBossLock
    );

    if (deferred) {
      return directed;
    }
  }

  throw new Error('Expected at least one boss sector with a deferred director hazard.');
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

function selectRouteIntoSector(seed: string, sourceSectorIndex: number, kind: RouteKind) {
  const run = generateRunSkeleton(seed);
  const contract = run.contracts[0];

  if (!contract) {
    throw new Error('Expected contract.');
  }

  const session = createRunSession(run, contract);
  session.currentSectorIndex = sourceSectorIndex;
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
