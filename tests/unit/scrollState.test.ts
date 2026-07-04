import { describe, expect, it } from 'vitest';

import { generateRunSkeleton } from '../../src/game/Generation';
import {
  advanceScrollState,
  createScrollState,
  getScrollProgress,
  setScrollDistance,
  type SectorScrollPlan
} from '../../src/game/ScrollState';

describe('ScrollState', () => {
  it('generates known-seed sector length and speed snapshots', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const summary = run.sectors.map((sector) => ({
      sectorId: sector.sectorId,
      length: sector.scroll.length,
      baseSpeed: sector.scroll.baseSpeed,
      startOffset: sector.scroll.startOffset
    }));

    expect(summary).toMatchInlineSnapshot(`
      [
        {
          "baseSpeed": 85,
          "length": 1442,
          "sectorId": "sector_outer_debris_field",
          "startOffset": 299,
        },
        {
          "baseSpeed": 92,
          "length": 1665,
          "sectorId": "sector_trade_war_corridor",
          "startOffset": 10706,
        },
        {
          "baseSpeed": 84,
          "length": 1953,
          "sectorId": "sector_bio_machine_bloom",
          "startOffset": 20476,
        },
        {
          "baseSpeed": 100,
          "length": 2533,
          "sectorId": "sector_corporate_kill_grid",
          "startOffset": 30175,
        },
        {
          "baseSpeed": 96,
          "length": 2536,
          "sectorId": "sector_core_wreck",
          "startOffset": 40804,
        },
      ]
    `);
  });

  it('advances distance through fixed-step simulation', () => {
    const state = createScrollState(makePlan({ length: 120, baseSpeed: 60, startOffset: 250 }));

    for (let step = 0; step < 60; step += 1) {
      advanceScrollState(state, 1 / 60);
    }

    expect(getScrollProgress(state)).toEqual({
      distance: 60,
      length: 120,
      remaining: 60,
      ratio: 0.5,
      speed: 60,
      cameraOffset: 310,
      worldOffset: 310,
      complete: false
    });
  });

  it('does not advance when dt is zero', () => {
    const state = createScrollState(makePlan({ length: 120, baseSpeed: 60, startOffset: 250 }));

    advanceScrollState(state, 1 / 60);
    const beforePause = getScrollProgress(state);
    const pauseResult = advanceScrollState(state, 0);

    expect(pauseResult.delta).toBe(0);
    expect(getScrollProgress(state)).toEqual(beforePause);
  });

  it('seeks debug scroll distance while syncing offsets', () => {
    const state = createScrollState(
      makePlan({ length: 120, baseSpeed: 60, minSpeed: 40, maxSpeed: 80, startOffset: 250 })
    );

    const result = setScrollDistance(state, 96.234, 999);

    expect(result).toEqual({
      previousDistance: 0,
      distance: 96.23,
      delta: 96.23,
      crossedExit: false
    });
    expect(getScrollProgress(state)).toEqual({
      distance: 96.23,
      length: 120,
      remaining: 23.77,
      ratio: 0.8019166666666667,
      speed: 80,
      cameraOffset: 346.23,
      worldOffset: 346.23,
      complete: false
    });
  });

  it('accepts an explicit zero speed override for arena scroll locks', () => {
    const state = createScrollState(makePlan({ length: 120, baseSpeed: 60, startOffset: 250 }));

    advanceScrollState(state, 1 / 60);
    const beforeLock = getScrollProgress(state);
    const lockResult = advanceScrollState(state, 0.1, 0);

    expect(lockResult.delta).toBe(0);
    expect(state.speed).toBe(0);
    expect(getScrollProgress(state)).toEqual({
      ...beforeLock,
      speed: 0
    });

    advanceScrollState(state, 0.1, 60);
    expect(state.distance).toBeGreaterThan(beforeLock.distance);
  });

  it('clamps scroll speed and stops at the sector exit', () => {
    const state = createScrollState(
      makePlan({ length: 12, baseSpeed: 60, minSpeed: 40, maxSpeed: 80 })
    );

    advanceScrollState(state, 1 / 60, 999);
    expect(state.speed).toBe(80);

    advanceScrollState(state, 1 / 60, -999);
    expect(state.speed).toBe(40);

    let result = advanceScrollState(state, 0.1, 80);

    while (!state.complete) {
      result = advanceScrollState(state, 0.1, 80);
    }

    expect(state.distance).toBe(12);
    expect(result.crossedExit).toBe(true);
    expect(advanceScrollState(state, 0.1).delta).toBe(0);
  });
});

function makePlan(overrides: Partial<SectorScrollPlan> = {}): SectorScrollPlan {
  return {
    sectorId: 'sector_outer_debris_field',
    sectorIndex: 1,
    length: 100,
    baseSpeed: 60,
    minSpeed: 30,
    maxSpeed: 120,
    startOffset: 0,
    ...overrides
  };
}
