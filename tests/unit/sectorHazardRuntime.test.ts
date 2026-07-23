import { describe, expect, it } from 'vitest';

import { getBeamHazardTiming } from '../../src/game/BeamHazard';
import {
  advanceSectorHazardRuntime,
  createSectorHazardRuntimeState,
  formatSectorHazardRuntimeDebug
} from '../../src/game/SectorHazardRuntime';
import {
  getActiveSectorHazards,
  type SectorFeaturePlan,
  type SectorHazardPlan
} from '../../src/game/SectorFeatures';

describe('SectorHazardRuntime', () => {
  it('advances visible hazards through telegraph, active, and expiry while scroll is held', () => {
    const hazard = makeHazard();
    const plan = makePlan([hazard]);
    const state = createSectorHazardRuntimeState(120);

    for (let step = 0; step < 4; step += 1) {
      advancePaused(state, plan, 120);
    }

    expect(state.effectiveDistances[hazard.id]).toBe(160);
    const heldHazard = getActiveSectorHazards(plan, 120, {
      distanceOverrides: state.effectiveDistances
    })[0];
    expect(heldHazard?.phase).toBe('active');
    expect(heldHazard?.progress).toBe(0.4);
    expect(heldHazard?.worldProgress).toBe(0.13);

    for (let step = 0; step < 10; step += 1) {
      advancePaused(state, plan, 120);
    }

    expect(state.effectiveDistances[hazard.id]).toBe(260);
    expect(
      getActiveSectorHazards(plan, 120, { distanceOverrides: state.effectiveDistances })
    ).toEqual([]);
    expect(formatSectorHazardRuntimeDebug(state)).toBe('tracked 1 pause 1.4s/140u');
  });

  it('does not activate future hazards merely because scrolling is paused', () => {
    const futureHazard = makeHazard({
      id: 'future-hazard',
      telegraphDistance: 300,
      startDistance: 350,
      endDistance: 450
    });
    const plan = makePlan([futureHazard]);
    const state = createSectorHazardRuntimeState(120);

    for (let step = 0; step < 30; step += 1) {
      advancePaused(state, plan, 120);
    }

    expect(state.effectiveDistances).toEqual({});
    expect(state.beamLaunchWorldDistances).toEqual({});
    expect(state.pausedAdvanceSeconds).toBe(0);
    expect(getActiveSectorHazards(plan, 120)).toEqual([]);
  });

  it('keeps expired hazards monotonic after scrolling resumes', () => {
    const hazard = makeHazard();
    const plan = makePlan([hazard]);
    const state = createSectorHazardRuntimeState(120);

    for (let step = 0; step < 14; step += 1) {
      advancePaused(state, plan, 120);
    }

    advanceSectorHazardRuntime(state, plan, {
      scrollDistance: 130,
      dt: 0.1,
      scrollingPaused: false,
      nominalScrollSpeed: 100
    });

    expect(state.effectiveDistances[hazard.id]).toBe(270);
    expect(
      getActiveSectorHazards(plan, 130, { distanceOverrides: state.effectiveDistances })
    ).toEqual([]);
  });

  it('resets runtime during boss-arena suspension and freezes zero-delta pause frames', () => {
    const hazard = makeHazard();
    const plan = makePlan([hazard]);
    const state = createSectorHazardRuntimeState(120);

    advancePaused(state, plan, 120);
    expect(state.effectiveDistances[hazard.id]).toBe(130);

    advanceSectorHazardRuntime(state, plan, {
      scrollDistance: 120,
      dt: 0.1,
      scrollingPaused: true,
      nominalScrollSpeed: 100,
      suspended: true
    });
    expect(state.effectiveDistances).toEqual({});

    advanceSectorHazardRuntime(state, plan, {
      scrollDistance: 120,
      dt: 0,
      scrollingPaused: true,
      nominalScrollSpeed: 100
    });

    expect(state.effectiveDistances[hazard.id]).toBe(120);
    expect(state.pausedAdvanceDistance).toBe(10);
  });

  it('honors coast allowlists while tracking already-visible hazards', () => {
    const settling = makeHazard({ id: 'settling-hazard' });
    const suppressed = makeHazard({ id: 'suppressed-hazard' });
    const plan = makePlan([settling, suppressed]);
    const state = createSectorHazardRuntimeState(120);

    advanceSectorHazardRuntime(state, plan, {
      scrollDistance: 120,
      dt: 0.1,
      scrollingPaused: true,
      nominalScrollSpeed: 100,
      activationOptions: { allowedHazardIds: [settling.id] }
    });

    expect(state.effectiveDistances).toEqual({ [settling.id]: 130 });
  });

  it('drives every beam from the same elapsed-time clock regardless of scroll speed', () => {
    const beam = makeHazard({
      id: 'timed-beam',
      kind: 'warning_beam',
      beam: {
        sourceEdge: 'left',
        sourceOffsetRatio: 0.5,
        targetEdge: 'right',
        targetOffsetRatio: 0.5
      }
    });
    const plan = makePlan([beam]);
    const slow = createSectorHazardRuntimeState(160);
    const fast = createSectorHazardRuntimeState(160);

    for (let step = 0; step < 10; step += 1) {
      advanceSectorHazardRuntime(slow, plan, {
        scrollDistance: 160,
        dt: 0.1,
        scrollingPaused: true,
        nominalScrollSpeed: 50
      });
      advanceSectorHazardRuntime(fast, plan, {
        scrollDistance: 160,
        dt: 0.1,
        scrollingPaused: true,
        nominalScrollSpeed: 200
      });
    }

    expect(slow.beamElapsedSeconds[beam.id]).toBe(1);
    expect(fast.beamElapsedSeconds[beam.id]).toBe(1);
    expect(slow.beamLaunchWorldDistances[beam.id]).toBe(160);
    expect(fast.beamLaunchWorldDistances[beam.id]).toBe(160);
    expect(slow.effectiveDistances[beam.id]).toBe(fast.effectiveDistances[beam.id]);

    const launched = getActiveSectorHazards(plan, 160, {
      distanceOverrides: slow.effectiveDistances,
      beamLaunchWorldDistanceOverrides: slow.beamLaunchWorldDistances,
      elapsedSecondsOverrides: slow.beamElapsedSeconds
    })[0];
    expect(launched?.launchWorldDistance).toBe(160);

    const timing = getBeamHazardTiming(beam);
    for (let step = 0; step < Math.ceil(timing.totalSeconds * 10); step += 1) {
      advancePaused(slow, plan, 160);
    }

    expect(slow.beamElapsedSeconds[beam.id]).toBe(timing.totalSeconds);
    expect(
      getActiveSectorHazards(plan, 160, {
        distanceOverrides: slow.effectiveDistances,
        elapsedSecondsOverrides: slow.beamElapsedSeconds
      })
    ).toEqual([]);
  });
});

function advancePaused(
  state: ReturnType<typeof createSectorHazardRuntimeState>,
  plan: SectorFeaturePlan,
  scrollDistance: number
): void {
  advanceSectorHazardRuntime(state, plan, {
    scrollDistance,
    dt: 0.1,
    scrollingPaused: true,
    nominalScrollSpeed: 100
  });
}

function makeHazard(overrides: Partial<SectorHazardPlan> = {}): SectorHazardPlan {
  return {
    id: 'held-hazard',
    kind: 'debris_lane',
    telegraphDistance: 100,
    startDistance: 150,
    endDistance: 250,
    xRatio: 0.5,
    widthRatio: 0.2,
    damage: 1,
    label: 'Held hazard',
    ...overrides
  };
}

function makePlan(hazards: readonly SectorHazardPlan[]): SectorFeaturePlan {
  return {
    sectorId: 'sector_outer_debris_field',
    sectorIndex: 1,
    landmarks: [],
    hazards
  };
}
