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
  createSectorConditionPlan
} from '../../src/game/SectorConditions';
import {
  applySectorPacingToBossArena,
  applySectorPacingToEncounterPacing,
  applySectorPacingToFeatures,
  applySectorPacingToScroll,
  createSectorPacingPlan,
  formatSectorPacingBeatDebug,
  formatSectorPacingReadout,
  formatSectorPacingTimeline,
  summarizeSectorPacingPlan
} from '../../src/game/SectorPacing';
import { validateSectorFeaturePlan } from '../../src/game/SectorFeatures';
import { createWaveDirectorPlan } from '../../src/game/WaveDirector';

describe('SectorPacing', () => {
  it('adds deterministic pressure and relief arcs to route-conditioned longer sectors', () => {
    const first = getPacedSectorAfterRoute('LONG-SECTOR-CARAVAN', 0, 'factionAmbush');
    const second = getPacedSectorAfterRoute('LONG-SECTOR-CARAVAN', 0, 'factionAmbush');

    expect(summarizeSectorPacingPlan(first.pacing)).toEqual(
      summarizeSectorPacingPlan(second.pacing)
    );
    expect(first.pacing.arcKind).toBe('intercept');
    expect(first.pacing.lengthMultiplier).toBeGreaterThan(1);
    expect(first.scroll.length).toBeGreaterThan(first.routeScroll.length);
    expect(first.pacing.waveDistanceRatios).toHaveLength(first.baseSector.objective.requiredWaves);
    expect(first.pacing.reliefWindows).toHaveLength(1);
    expect(first.pacing.formationClusterWaveIndexes).toEqual([1]);
    expect(formatSectorPacingReadout(first.pacing)).toContain('Sector pacing: Intercept run');
    expect(
      formatSectorPacingBeatDebug(
        first.pacing,
        first.scroll.length * (first.pacing.waveDistanceRatios[0] ?? 0),
        first.scroll.length
      )
    ).toBe('Intercept run pressure:wave 1');
  });

  it('spaces waves with explicit long-sector ratios and forces formation-cluster waves', () => {
    const paced = getPacedSectorAfterRoute('LONG-SECTOR-CARAVAN', 0, 'factionAmbush');
    const encounterPacing = applySectorPacingToEncounterPacing(
      paced.baseSector.encounterPacing,
      paced.pacing
    );

    const plan = createWaveDirectorPlan({
      seed: `${paced.run.seed}:combat:${paced.baseSector.sectorId}`,
      objective: paced.baseSector.objective,
      majorWaves: paced.baseSector.majorWaves,
      preferredFactionId: paced.baseSector.bossFactionId,
      availableFactionIds: paced.run.availableFactionIds,
      scroll: paced.scroll,
      pacing: encounterPacing,
      sectorIndex: paced.session.currentSectorIndex,
      routePressure: true,
      formationClusterWaves: paced.pacing.formationClusterWaveIndexes
    });

    for (const [index, ratio] of paced.pacing.waveDistanceRatios.entries()) {
      expect(plan.waves[index]?.startsAtDistance).toBeCloseTo(paced.scroll.length * ratio, 2);
    }

    const clusterWaveIndex = paced.pacing.formationClusterWaveIndexes[0] ?? -1;
    const clusterSpawns = plan.spawnSchedule.filter(
      (spawn) => spawn.waveIndex === clusterWaveIndex
    );
    const regularSpawns = plan.spawnSchedule.filter(
      (spawn) => spawn.waveIndex !== clusterWaveIndex
    );

    expect(clusterSpawns).toHaveLength(paced.baseSector.objective.spawnsPerWave);
    expect(clusterSpawns.every((spawn) => Boolean(spawn.formationId))).toBe(true);
    expect(regularSpawns.length).toBeGreaterThan(0);
    expect(plan.waves[1]?.startsAtDistance ?? 0).toBeGreaterThan(
      (plan.waves[0]?.startsAtDistance ?? 0) + paced.scroll.length * 0.3
    );
  });

  it('adds pacing landmarks and stretches boss approaches without mutating route conditions', () => {
    const paced = getPacedSectorAfterRoute('LONG-SECTOR-BOSS', 2, 'glitch');

    expect(paced.baseSector.objective.bossRequired).toBe(true);
    expect(paced.pacing.arcKind).toBe('glitchShear');
    expect(paced.scroll.length).toBeGreaterThan(paced.routeScroll.length);

    const routeArena = applySectorConditionsToBossArena(
      paced.baseSector.arena,
      paced.baseSector.scroll,
      paced.routeScroll,
      paced.conditions
    );
    const pacedArena = applySectorPacingToBossArena(
      routeArena,
      paced.routeScroll,
      paced.scroll,
      paced.pacing
    );
    const pacedFeatures = applySectorPacingToFeatures(
      paced.routeFeatures,
      paced.scroll,
      paced.pacing
    );

    expect(routeArena).not.toBeNull();
    expect(pacedArena?.releaseDistance).toBe(paced.scroll.length);
    expect(pacedArena?.lockDistance).toBeGreaterThan(routeArena?.lockDistance ?? 0);
    expect(pacedArena?.approachStartDistance).toBeLessThan(pacedArena?.lockDistance ?? 0);
    expect(pacedArena?.approachStartDistance).not.toBe(routeArena?.approachStartDistance);
    expect(pacedFeatures.landmarks.length).toBeGreaterThan(paced.routeFeatures.landmarks.length);
    expect(validateSectorFeaturePlan(pacedFeatures, paced.scroll.length)).toEqual([]);
  });

  it('formats run-summary timelines with route-conditioned long-sector context', () => {
    const { run, session } = selectRouteIntoSector('LONG-SECTOR-CARAVAN', 0, 'factionAmbush');
    const timeline = formatSectorPacingTimeline(run, session.routeOutcomes);

    expect(timeline).toContain('S2 Intercept run');
    expect(timeline).toContain('formation W2');
    expect(timeline).toContain('relief');
  });
});

function getPacedSectorAfterRoute(seed: string, sourceSectorIndex: number, kind: RouteKind) {
  const { run, session } = selectRouteIntoSector(seed, sourceSectorIndex, kind);
  const baseSector = getCurrentSector(run, session);
  const conditions = createSectorConditionPlan({
    run,
    sectorIndex: session.currentSectorIndex,
    routeOutcomes: session.routeOutcomes
  });
  const routeScroll = applySectorConditionsToScroll(baseSector.scroll, conditions);
  const routeFeatures = applySectorConditionsToFeatures(
    baseSector.features,
    baseSector.scroll,
    routeScroll,
    conditions
  );
  const pacing = createSectorPacingPlan({
    runSeed: run.seed,
    sector: baseSector,
    sectorIndex: session.currentSectorIndex,
    conditions,
    scroll: routeScroll
  });
  const scroll = applySectorPacingToScroll(routeScroll, pacing);

  return {
    run,
    session,
    baseSector,
    conditions,
    routeScroll,
    routeFeatures,
    pacing,
    scroll
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
