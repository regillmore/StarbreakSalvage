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
          "length": 1672,
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
          "length": 2061,
          "sectorId": "sector_trade_war_corridor",
          "startOffset": 40804,
        },
        {
          "baseSpeed": 101,
          "length": 2446,
          "sectorId": "sector_bio_machine_bloom",
          "startOffset": 50895,
        },
        {
          "baseSpeed": 103,
          "length": 2623,
          "sectorId": "sector_lunar_surface",
          "startOffset": 60370,
        },
        {
          "baseSpeed": 115,
          "length": 2580,
          "sectorId": "sector_trade_war_corridor",
          "startOffset": 70594,
        },
        {
          "baseSpeed": 118,
          "length": 3315,
          "sectorId": "sector_corporate_kill_grid",
          "startOffset": 80856,
        },
        {
          "baseSpeed": 124,
          "length": 3099,
          "sectorId": "sector_trade_war_corridor",
          "startOffset": 90870,
        },
        {
          "baseSpeed": 119,
          "length": 3715,
          "sectorId": "sector_corporate_kill_grid",
          "startOffset": 100284,
        },
        {
          "baseSpeed": 128,
          "length": 3804,
          "sectorId": "sector_corporate_kill_grid",
          "startOffset": 110009,
        },
        {
          "baseSpeed": 126,
          "length": 3714,
          "sectorId": "sector_bio_machine_bloom",
          "startOffset": 120460,
        },
        {
          "baseSpeed": 128,
          "length": 3831,
          "sectorId": "sector_trade_war_corridor",
          "startOffset": 130785,
        },
        {
          "baseSpeed": 128,
          "length": 4021,
          "sectorId": "sector_trade_war_corridor",
          "startOffset": 140488,
        },
        {
          "baseSpeed": 128,
          "length": 4165,
          "sectorId": "sector_bio_machine_bloom",
          "startOffset": 150896,
        },
        {
          "baseSpeed": 128,
          "length": 4422,
          "sectorId": "sector_lunar_surface",
          "startOffset": 160417,
        },
        {
          "baseSpeed": 128,
          "length": 4965,
          "sectorId": "sector_core_wreck",
          "startOffset": 170579,
        },
        {
          "baseSpeed": 128,
          "length": 4627,
          "sectorId": "sector_nullglass_expanse",
          "startOffset": 180367,
        },
        {
          "baseSpeed": 128,
          "length": 4930,
          "sectorId": "sector_dead_signal_reef",
          "startOffset": 190312,
        },
        {
          "baseSpeed": 128,
          "length": 5084,
          "sectorId": "sector_parallax_foundry",
          "startOffset": 200062,
        },
        {
          "baseSpeed": 128,
          "length": 5675,
          "sectorId": "sector_gravity_choir",
          "startOffset": 210235,
        },
        {
          "baseSpeed": 128,
          "length": 5473,
          "sectorId": "sector_parallax_foundry",
          "startOffset": 220528,
        },
        {
          "baseSpeed": 128,
          "length": 5699,
          "sectorId": "sector_dead_signal_reef",
          "startOffset": 230400,
        },
        {
          "baseSpeed": 128,
          "length": 6242,
          "sectorId": "sector_gravity_choir",
          "startOffset": 240948,
        },
        {
          "baseSpeed": 128,
          "length": 6209,
          "sectorId": "sector_parallax_foundry",
          "startOffset": 250999,
        },
        {
          "baseSpeed": 128,
          "length": 6590,
          "sectorId": "sector_horizon_scar",
          "startOffset": 260048,
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
