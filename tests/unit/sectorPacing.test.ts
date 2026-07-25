import { describe, expect, it } from 'vitest';

import { createDefaultCombatBounds } from '../../src/game/CombatGeometry';
import { createCombatState, updateCombatState } from '../../src/game/CombatState';
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
import { formatSectorObjectiveVariantReadout } from '../../src/game/SectorObjectives';
import { validateSectorFeaturePlan } from '../../src/game/SectorFeatures';
import { getSetPieceEngagementDistance } from '../../src/game/SetPiece';
import { createWaveDirectorPlan } from '../../src/game/WaveDirector';
import { getNextActRouteSectorIndices } from '../../src/game/ActRouteGraph';

describe('SectorPacing', () => {
  it('stages the opening Wreckline Expedition around the Hecaton breach', () => {
    const paced = getUnroutedPacedSector('STARBREAK-SMOKE', 0);
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
      routePressure: false,
      formationClusterWaves: paced.pacing.formationClusterWaveIndexes
    });
    const setPiece = paced.baseSector.setPiece;

    expect(paced.baseSector.sectorId).toBe('sector_outer_debris_field');
    expect(paced.baseSector.objective).toMatchObject({
      variantId: 'openingWrecklineExpedition',
      requiredWaves: 4,
      spawnsPerWave: 2,
      requiredEnemyKills: 8
    });
    expect(paced.baseSector.majorWaves).toHaveLength(4);
    expect(paced.pacing).toMatchObject({
      arcKind: 'wrecklineExpedition',
      lengthBand: 'extended',
      pressureBand: 'baseline',
      waveDistanceRatios: [0.1, 0.22, 0.55, 0.82],
      formationClusterWaveIndexes: [],
      landmarkBeatRatios: [0.14, 0.42, 0.7],
      hazardBeatRatios: [0.5, 0.77]
    });
    expect(paced.pacing.lengthMultiplier).toBeGreaterThanOrEqual(1.32);
    expect(paced.scroll.length).toBeGreaterThanOrEqual(paced.routeScroll.length * 1.32);
    expect(paced.pacing.reliefWindows).toHaveLength(2);
    expect(formatSectorPacingReadout(paced.pacing)).toContain(
      'Sector pacing: Wreckline expedition'
    );
    expect(plan.waves).toHaveLength(4);
    expect(plan.spawnSchedule).toHaveLength(8);
    expect(
      plan.waves.every((wave, index) => wave.label === paced.baseSector.majorWaves[index])
    ).toBe(true);
    expect(plan.spawnSchedule.every((spawn) => !spawn.formationId)).toBe(true);
    expect(setPiece).not.toBeNull();

    const engagementDistance = getSetPieceEngagementDistance(setPiece!);
    const secondWaveSpawns = plan.spawnSchedule.filter((spawn) => spawn.waveIndex === 1);
    const thirdWaveSpawns = plan.spawnSchedule.filter((spawn) => spawn.waveIndex === 2);
    expect(Math.max(...secondWaveSpawns.map((spawn) => spawn.atDistance ?? 0))).toBeLessThan(
      engagementDistance
    );
    expect(Math.min(...thirdWaveSpawns.map((spawn) => spawn.atDistance ?? 0))).toBeGreaterThan(
      setPiece!.anchorDistance
    );
  });

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
    const paced = getPacedSectorAfterRoute('LONG-SECTOR-BOSS', 1, 'glitch');

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

  it('adds Act II length bands, pressure bands, objective variants, and relief windows', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const sectorIndex = run.sectors.findIndex(
      (sector) => sector.objective.variantId === 'act2DeepSweep'
    );
    const paced = getUnroutedPacedSector('STARBREAK-SMOKE', sectorIndex);

    expect(paced.baseSector.act.actShortLabel).toBe('Act II');
    expect(paced.baseSector.objective.variantId).toBe('act2DeepSweep');
    expect(formatSectorObjectiveVariantReadout(paced.baseSector.objective)).toContain(
      'Deep-sector sweep'
    );
    expect(paced.pacing.arcKind).toBe('act2Traverse');
    expect(paced.pacing.lengthBand).toBe('deep');
    expect(paced.pacing.pressureBand).toBe('sustained');
    expect(paced.pacing.objectiveVariantLabel).toBe('Deep-sector sweep');
    expect(paced.pacing.waveDistanceRatios).toEqual([0.16, 0.46, 0.8]);
    expect(paced.pacing.reliefWindows.length).toBeGreaterThanOrEqual(2);
    expect(paced.scroll.length).toBeGreaterThan(paced.routeScroll.length);

    for (let index = 1; index < paced.pacing.reliefWindows.length; index += 1) {
      expect(paced.pacing.reliefWindows[index]?.startRatio ?? 0).toBeGreaterThan(
        paced.pacing.reliefWindows[index - 1]?.endRatio ?? 0
      );
    }
  });

  it('applies route-conditioned pacing modifiers without flat Act II density spikes', () => {
    const run = generateRunSkeleton('ACT2-ROUTE-PACING');
    const actTwo = run.acts[1]!;
    const routeEdge = run.actRouteGraph.edges.find(
      (edge) =>
        edge.sourceSectorIndex >= actTwo.startSectorIndex &&
        edge.targetSectorIndex <= actTwo.endSectorIndex &&
        run.sectors[edge.targetSectorIndex]?.objective.pressureBand === 'sustained'
    );
    if (!routeEdge) {
      throw new Error('Expected an Act II route into a sustained-pressure node.');
    }
    const pressured = getPacedSectorAfterRoute(
      'ACT2-ROUTE-PACING',
      routeEdge.sourceSectorIndex,
      'glitch',
      routeEdge.targetSectorIndex
    );
    const quiet = getPacedSectorAfterRoute(
      'ACT2-ROUTE-PACING',
      routeEdge.sourceSectorIndex,
      'repair',
      routeEdge.targetSectorIndex
    );

    expect(pressured.baseSector.act.actShortLabel).toBe('Act II');
    expect(pressured.baseSector.sectorId).toBe(quiet.baseSector.sectorId);
    expect(pressured.pacing.arcKind).toBe('glitchShear');
    expect(pressured.pacing.pressureBand).toBe('volatile');
    expect(quiet.pacing.pressureBand).toBe('sustained');
    expect(pressured.pacing.lengthMultiplier).toBeGreaterThan(quiet.pacing.lengthMultiplier);
    expect(pressured.pacing.spawnSpacingMultiplier).toBeGreaterThanOrEqual(
      quiet.pacing.spawnSpacingMultiplier
    );
    expect(pressured.pacing.hazardBeatRatios.length).toBeGreaterThanOrEqual(1);
  });

  it('tunes Act II boss approach handoff while preserving arena lock and release ordering', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const paced = getUnroutedPacedSector('STARBREAK-SMOKE', run.acts[1]!.endSectorIndex);
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
    const routeApproachDistance =
      (routeArena?.lockDistance ?? 0) - (routeArena?.approachStartDistance ?? 0);
    const pacedApproachDistance =
      (pacedArena?.lockDistance ?? 0) - (pacedArena?.approachStartDistance ?? 0);

    expect(paced.pacing.arcKind).toBe('act2Finale');
    expect(paced.pacing.pressureBand).toBe('finale');
    expect(paced.pacing.bossApproachMultiplier).toBeGreaterThan(1);
    expect(pacedArena?.releaseDistance).toBe(paced.scroll.length);
    expect(pacedArena?.lockDistance ?? 0).toBeLessThan(pacedArena?.releaseDistance ?? 0);
    expect(pacedApproachDistance).toBeGreaterThan(routeApproachDistance);
  });

  it('keeps Act II distance-wave spawning catchup-safe under late-frame jumps', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const paced = getUnroutedPacedSector('STARBREAK-SMOKE', run.acts[1]!.startSectorIndex);
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
    const finalDistance = Math.max(...plan.spawnSchedule.map((spawn) => spawn.atDistance ?? 0));
    const bounds = createDefaultCombatBounds();
    const state = createCombatState(bounds, 'ACT2-CATCHUP-SAFETY', {
      spawnSchedule: plan.spawnSchedule,
      bossSpawnAtSeconds: null,
      sectorLength: paced.scroll.length
    });

    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: finalDistance + 120 },
      0.2,
      bounds
    );

    expect(state.nextSpawnIndex).toBe(plan.spawnSchedule.length);
    expect(state.enemies).toHaveLength(plan.spawnSchedule.length);

    const spawnedIds = state.enemies.map((enemy) => enemy.id);

    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: finalDistance + 120 },
      0.2,
      bounds
    );

    expect(state.nextSpawnIndex).toBe(plan.spawnSchedule.length);
    expect(state.enemies.map((enemy) => enemy.id)).toEqual(spawnedIds);
  });

  it('summarizes known-seed Act II pacing timelines with objective and pressure context', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const timeline = formatSectorPacingTimeline(run, []);

    expect(timeline).toContain('S10 Core-depth traverse');
    expect(timeline).toContain('Deep-sector sweep');
    expect(timeline).toContain('sustained pressure');
    expect(timeline).toContain('S18 Finale descent');
    expect(timeline).toContain('finale pressure');
  });
});

function getUnroutedPacedSector(seed: string, sectorIndex: number) {
  const run = generateRunSkeleton(seed);
  const contract = run.contracts[0];

  if (!contract) {
    throw new Error('Expected contract.');
  }

  const session = createRunSession(run, contract);
  session.currentSectorIndex = sectorIndex;
  const baseSector = getCurrentSector(run, session);
  const conditions = createSectorConditionPlan({
    run,
    sectorIndex: session.currentSectorIndex,
    routeOutcomes: session.routeOutcomes
  });
  const routeScroll = applySectorConditionsToScroll(baseSector.scroll, conditions);
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
    pacing,
    scroll
  };
}

function getPacedSectorAfterRoute(
  seed: string,
  sourceSectorIndex: number,
  kind: RouteKind,
  targetSectorIndex?: number
) {
  const { run, session } = selectRouteIntoSector(seed, sourceSectorIndex, kind, targetSectorIndex);
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
    getNextActRouteSectorIndices(run.actRouteGraph, sourceSectorIndex)[0];
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
