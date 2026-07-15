import { describe, expect, it } from 'vitest';

import {
  createActTwoDebugScenario,
  createDebugRouteHistoryBeforeSector,
  createTwoActDebugSummaryResult,
  formatRouteTagSummary,
  getDistanceBeforeSector
} from '../../src/game/ActTwoDebug';
import { generateRunSkeleton } from '../../src/game/Generation';

describe('Act II debug helpers', () => {
  it('finds deterministic Act II entry, finale, and travel distances', () => {
    const run = generateRunSkeleton('ACT-II-DEBUG');
    const scenario = createActTwoDebugScenario(run);
    const actOne = run.acts[0]!;
    const actTwo = run.acts[1]!;

    expect(scenario).toMatchObject({
      actOneFinalSectorIndex: actOne.endSectorIndex,
      actTwoEntrySectorIndex: actTwo.startSectorIndex,
      finaleSectorIndex: actTwo.endSectorIndex
    });
    expect(scenario?.distanceBeforeActTwo).toBe(
      getDistanceBeforeSector(run, actTwo.startSectorIndex)
    );
    expect(scenario?.distanceBeforeFinale).toBe(
      getDistanceBeforeSector(run, actTwo.endSectorIndex)
    );
  });

  it('creates a two-act smoke route history with act labels and route tags', () => {
    const run = generateRunSkeleton('ACT-II-DEBUG');
    const history = createDebugRouteHistoryBeforeSector(run, run.acts[1]!.endSectorIndex);

    expect(history).toHaveLength(9);
    expect(history[0]).toMatchObject({
      sectorIndex: 1,
      actShortLabel: 'Act I',
      outcomeTitle: 'debug routed'
    });
    expect(history.at(-1)).toMatchObject({
      sectorIndex: 16,
      targetSectorIndex: 18,
      actShortLabel: 'Act II',
      actSectorIndex: 4
    });
    expect(history.some((entry) => (entry.routeTags ?? []).length > 0)).toBe(true);
  });

  it('formats Act II route tags and summary results for smoke screens', () => {
    const run = generateRunSkeleton('ACT-II-DEBUG');
    const actTwoSector = run.sectors[run.acts[1]!.startSectorIndex];

    expect(actTwoSector).toBeDefined();
    expect(formatRouteTagSummary(actTwoSector?.routeOptions ?? [])).toMatch(/core|hazard|economy/);

    expect(createTwoActDebugSummaryResult(run)).toMatchObject({
      reason: 'debug',
      bossesDefeated: 1,
      itemNames: ['Debug Act II smoke path']
    });
  });
});
