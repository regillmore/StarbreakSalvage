import { describe, expect, it } from 'vitest';

import {
  createActTwoDebugScenario,
  createDebugRouteHistoryThroughSector,
  createTwoActDebugSummaryResult,
  formatRouteTagSummary,
  getDistanceBeforeSector
} from '../../src/game/ActTwoDebug';
import { generateRunSkeleton } from '../../src/game/Generation';

describe('Act II debug helpers', () => {
  it('finds deterministic Act II entry, finale, and travel distances', () => {
    const run = generateRunSkeleton('ACT-II-DEBUG');
    const scenario = createActTwoDebugScenario(run);

    expect(scenario).toMatchObject({
      actOneFinalSectorIndex: 4,
      actTwoEntrySectorIndex: 5,
      finaleSectorIndex: 9
    });
    expect(scenario?.distanceBeforeActTwo).toBe(getDistanceBeforeSector(run, 5));
    expect(scenario?.distanceBeforeFinale).toBe(getDistanceBeforeSector(run, 9));
  });

  it('creates a two-act smoke route history with act labels and route tags', () => {
    const run = generateRunSkeleton('ACT-II-DEBUG');
    const history = createDebugRouteHistoryThroughSector(run, 9);

    expect(history).toHaveLength(9);
    expect(history[0]).toMatchObject({
      sectorIndex: 1,
      actShortLabel: 'Act I',
      outcomeTitle: 'debug routed'
    });
    expect(history.at(-1)).toMatchObject({
      sectorIndex: 9,
      actShortLabel: 'Act II',
      actSectorIndex: 4
    });
    expect(history.some((entry) => (entry.routeTags ?? []).length > 0)).toBe(true);
  });

  it('formats Act II route tags and summary results for smoke screens', () => {
    const run = generateRunSkeleton('ACT-II-DEBUG');
    const actTwoSector = run.sectors[5];

    expect(actTwoSector).toBeDefined();
    expect(formatRouteTagSummary(actTwoSector?.routeOptions ?? [])).toMatch(/core|hazard|economy/);

    expect(createTwoActDebugSummaryResult(run)).toMatchObject({
      reason: 'debug',
      bossesDefeated: 1,
      itemNames: ['Debug Act II smoke path']
    });
  });
});
