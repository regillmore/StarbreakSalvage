import { describe, expect, it } from 'vitest';

import {
  BEAM_END_VELOCITY_UNITS_PER_SECOND,
  BEAM_FULLY_LIT_DURATION_SECONDS,
  circleOverlapsBeamSegment,
  createBeamHazardGeometry,
  createBeamSegmentDamageRects,
  getActiveBeamBoltSegment,
  getActiveBeamHazardPresentation,
  getBeamHazardTiming,
  getBeamHazardSegment,
  getWorldAnchoredBeamTrack
} from '../../src/game/BeamHazard';
import { getHazardZoneDefinition } from '../../src/content/hazardZones';
import { validateSectorFeaturePlan } from '../../src/game/SectorFeatures';

const bounds = { width: 640, height: 720, padding: 24 };

describe('BeamHazard', () => {
  it('declares beam-segment render and collision geometry in content metadata', () => {
    const definition = getHazardZoneDefinition('warning_beam');

    expect(definition.activeDamageShape).toBe('beamSegment');
    expect(definition.readability.collisionShape).toBe('beamSegment');
  });

  it('generates deterministic variable source directions and offsets', () => {
    const first = createBeamHazardGeometry('BEAM-GEOMETRY:OPERATION-4');
    const repeated = createBeamHazardGeometry('BEAM-GEOMETRY:OPERATION-4');
    const variants = Array.from({ length: 24 }, (_value, index) =>
      createBeamHazardGeometry(`BEAM-GEOMETRY:OPERATION-${index}`)
    );

    expect(repeated).toEqual(first);
    expect(new Set(variants.map((geometry) => geometry.sourceEdge)).size).toBeGreaterThanOrEqual(4);
    expect(
      new Set(
        variants.map(
          (geometry) =>
            `${geometry.sourceEdge}:${geometry.sourceOffsetRatio}:${geometry.targetEdge}:${geometry.targetOffsetRatio}`
        )
      ).size
    ).toBe(24);
    expect(variants.every((geometry) => geometry.sourceEdge !== geometry.targetEdge)).toBe(true);
  });

  it('uses one bounded segment for endpoint tracking, circle collision, and world samples', () => {
    const segment = getBeamHazardSegment(
      {
        xRatio: 0.5,
        widthRatio: 0.12,
        beam: {
          sourceEdge: 'left',
          sourceOffsetRatio: 0.4,
          targetEdge: 'right',
          targetOffsetRatio: 0.72
        }
      },
      bounds
    );
    const midpoint = {
      x: (segment.startX + segment.endX) / 2,
      y: (segment.startY + segment.endY) / 2,
      radius: 8
    };

    expect(segment.startX).toBe(0);
    expect(segment.endX).toBe(bounds.width);
    expect(segment.length).toBeGreaterThan(600);
    expect(circleOverlapsBeamSegment(midpoint, segment)).toBe(true);
    expect(
      circleOverlapsBeamSegment({ x: midpoint.x, y: midpoint.y + 180, radius: 8 }, segment)
    ).toBe(false);

    const damageRects = createBeamSegmentDamageRects(segment);
    expect(damageRects.length).toBeGreaterThan(10);
    expect(damageRects.length).toBeLessThanOrEqual(24);
    expect(damageRects[0]?.left).toBeLessThanOrEqual(segment.startX);
    expect(damageRects.at(-1)?.right).toBeGreaterThanOrEqual(segment.endX);
  });

  it('keeps the telegraph track anchored in the scrolling combat world', () => {
    const hazard = {
      id: 'world-track',
      kind: 'warning_beam' as const,
      telegraphDistance: 20,
      startDistance: 190,
      endDistance: 330,
      xRatio: 0.5,
      widthRatio: 0.12,
      damage: 1,
      label: 'WORLD TRACK',
      beam: {
        sourceEdge: 'left' as const,
        sourceOffsetRatio: 0.4,
        targetEdge: 'right' as const,
        targetOffsetRatio: 0.72
      }
    };
    const atTelegraphStart = getWorldAnchoredBeamTrack(
      { hazard, phase: 'telegraph', progress: 0, phaseProgress: 0 },
      bounds
    );
    const atFireStart = getWorldAnchoredBeamTrack(
      {
        hazard,
        phase: 'active',
        progress: (hazard.startDistance - hazard.telegraphDistance) / 310,
        phaseProgress: 0
      },
      bounds
    );

    expect(atTelegraphStart).not.toBeNull();
    expect(atFireStart).not.toBeNull();
    if (!atTelegraphStart || !atFireStart) {
      throw new Error('Expected world-anchored beam tracks in arena line of sight.');
    }

    expectBeamSegmentClippedToArena(atTelegraphStart);
    expectBeamSegmentClippedToArena(atFireStart);
    expect(atFireStart.startY).not.toBe(atTelegraphStart.startY);
    expect(atFireStart.endY).not.toBe(atTelegraphStart.endY);

    const whileScrollPaused = getWorldAnchoredBeamTrack(
      {
        hazard,
        phase: 'active',
        progress: (170 + 80) / 310,
        worldProgress: (hazard.startDistance - hazard.telegraphDistance) / 310,
        phaseProgress: 80 / 140
      },
      bounds
    );
    expect(whileScrollPaused).toEqual(atFireStart);

    const topSpawnedHazard = {
      ...hazard,
      beam: {
        sourceEdge: 'top' as const,
        sourceOffsetRatio: 0.3,
        targetEdge: 'bottom' as const,
        targetOffsetRatio: 0.7
      }
    };
    const topMarkerAtTelegraph = getWorldAnchoredBeamTrack(
      { hazard: topSpawnedHazard, phase: 'telegraph', progress: 0, phaseProgress: 0 },
      bounds
    );
    const topMarkerAtFire = getWorldAnchoredBeamTrack(
      {
        hazard: topSpawnedHazard,
        phase: 'active',
        progress: (hazard.startDistance - hazard.telegraphDistance) / 310,
        phaseProgress: 0
      },
      bounds
    );
    expect(topMarkerAtTelegraph).not.toBeNull();
    expect(topMarkerAtFire).not.toBeNull();
    if (!topMarkerAtTelegraph || !topMarkerAtFire) {
      throw new Error('Expected top-spawned beam markers to remain on arena edges.');
    }
    expectBeamSegmentClippedToArena(topMarkerAtTelegraph);
    expectBeamSegmentClippedToArena(topMarkerAtFire);
    expect(topMarkerAtTelegraph.startY).toBe(0);
    expect(topMarkerAtFire.startY).toBe(0);
    expect(topMarkerAtTelegraph.startX).not.toBe(topMarkerAtFire.startX);
  });

  it('uses shared end velocity around an exact two-second fully-lit dwell', () => {
    const hazard = {
      id: 'finite-bolt',
      kind: 'warning_beam' as const,
      telegraphDistance: 20,
      startDistance: 190,
      endDistance: 330,
      xRatio: 0.5,
      widthRatio: 0.12,
      damage: 1,
      label: 'FINITE BOLT',
      beam: {
        sourceEdge: 'left' as const,
        sourceOffsetRatio: 0.5,
        targetEdge: 'right' as const,
        targetOffsetRatio: 0.5
      }
    };
    const timing = getBeamHazardTiming(hazard, bounds);
    const makeActive = (elapsedSeconds: number) => ({
      hazard,
      phase: 'active' as const,
      progress: (170 + (elapsedSeconds / timing.totalSeconds) * 140) / 310,
      phaseProgress: elapsedSeconds / timing.totalSeconds,
      elapsedSeconds,
      worldDistance: hazard.startDistance
    });
    const ignitionElapsed = 0.5;
    const early = getActiveBeamBoltSegment(makeActive(ignitionElapsed), bounds);
    const fullyLitStart = getActiveBeamBoltSegment(makeActive(timing.endTravelSeconds), bounds);
    const fullyLitEnd = getActiveBeamBoltSegment(
      makeActive(timing.endTravelSeconds + BEAM_FULLY_LIT_DURATION_SECONDS),
      bounds
    );
    const late = getActiveBeamBoltSegment(
      makeActive(timing.endTravelSeconds + BEAM_FULLY_LIT_DURATION_SECONDS + 0.5),
      bounds
    );
    const finished = getActiveBeamBoltSegment(makeActive(timing.totalSeconds), bounds);

    expect(early).not.toBeNull();
    expect(fullyLitStart).not.toBeNull();
    expect(fullyLitEnd).not.toBeNull();
    expect(late).not.toBeNull();
    expect(finished).toBeNull();
    if (!early || !fullyLitStart || !fullyLitEnd || !late) {
      throw new Error('Expected timed beam lifecycle segments.');
    }

    expect(early.startX).toBe(0);
    expect(early.endX).toBeCloseTo(
      ignitionElapsed * BEAM_END_VELOCITY_UNITS_PER_SECOND - bounds.height * 0.22,
      2
    );
    expect(fullyLitStart.startX).toBe(0);
    expect(fullyLitStart.endX).toBe(bounds.width);
    expect(fullyLitEnd).toEqual(fullyLitStart);
    expect(late.startX).toBeCloseTo(early.endX, 2);
    expect(late.endX).toBe(bounds.width);

    const verticalHazard = {
      ...hazard,
      beam: {
        sourceEdge: 'top' as const,
        sourceOffsetRatio: 0.5,
        targetEdge: 'bottom' as const,
        targetOffsetRatio: 0.5
      }
    };
    const verticalTiming = getBeamHazardTiming(verticalHazard, bounds);
    const verticalEarly = getActiveBeamBoltSegment(
      {
        hazard: verticalHazard,
        phase: 'active',
        progress: 0.6,
        phaseProgress: ignitionElapsed / verticalTiming.totalSeconds,
        elapsedSeconds: ignitionElapsed,
        worldDistance: verticalHazard.startDistance
      },
      bounds
    );
    expect(verticalEarly?.length).toBeCloseTo(early.length, 2);
    expect(
      circleOverlapsBeamSegment(
        {
          x: (fullyLitStart.startX + fullyLitStart.endX) / 2,
          y: (fullyLitStart.startY + fullyLitStart.endY) / 2,
          radius: 8
        },
        fullyLitStart
      )
    ).toBe(true);
    expect(circleOverlapsBeamSegment({ x: bounds.width, y: early.endY, radius: 8 }, early)).toBe(
      false
    );
    expect(timing.fullyLitSeconds).toBe(2);
    expect(timing.totalSeconds).toBeCloseTo(timing.endTravelSeconds * 2 + 2, 3);
  });

  it('freezes the launched projectile track and exposes no telegraph behind its head', () => {
    const hazard = {
      id: 'top-launched-projectile',
      kind: 'warning_beam' as const,
      telegraphDistance: 20,
      startDistance: 190,
      endDistance: 330,
      xRatio: 0.5,
      widthRatio: 0.12,
      damage: 1,
      label: 'TOP LAUNCHED PROJECTILE',
      beam: {
        sourceEdge: 'top' as const,
        sourceOffsetRatio: 0.3,
        targetEdge: 'bottom' as const,
        targetOffsetRatio: 0.7
      }
    };
    const timing = getBeamHazardTiming(hazard, bounds);
    const makeActive = (elapsedSeconds: number, worldDistance: number) => ({
      hazard,
      phase: 'active' as const,
      progress: 0.8,
      phaseProgress: elapsedSeconds / timing.totalSeconds,
      elapsedSeconds,
      worldDistance,
      launchWorldDistance: hazard.startDistance
    });
    const entering = getActiveBeamHazardPresentation(makeActive(0.4, 210), bounds);
    const enteringAfterWorldScroll = getActiveBeamHazardPresentation(makeActive(0.4, 310), bounds);

    expect(enteringAfterWorldScroll).toEqual(entering);
    expect(entering.bolt).not.toBeNull();
    expect(entering.leadingTelegraph).not.toBeNull();
    expect(entering.head).not.toBeNull();
    expect(entering.tail).toBeNull();
    if (!entering.bolt || !entering.leadingTelegraph || !entering.head) {
      throw new Error('Expected an entering bolt with a forward-only telegraph.');
    }
    expect(entering.leadingTelegraph.startX).toBeCloseTo(entering.head.x, 3);
    expect(entering.leadingTelegraph.startY).toBeCloseTo(entering.head.y, 3);
    expect(entering.bolt.endX).toBeCloseTo(entering.head.x, 3);
    expect(entering.bolt.endY).toBeCloseTo(entering.head.y, 3);
    expect(entering.leadingTelegraph.endY).toBe(bounds.height);

    const clearingElapsed = timing.endTravelSeconds + BEAM_FULLY_LIT_DURATION_SECONDS + 0.4;
    const clearing = getActiveBeamHazardPresentation(makeActive(clearingElapsed, 230), bounds);
    const clearingAfterWorldScroll = getActiveBeamHazardPresentation(
      makeActive(clearingElapsed, 330),
      bounds
    );

    expect(clearingAfterWorldScroll).toEqual(clearing);
    expect(clearing.bolt).not.toBeNull();
    expect(clearing.leadingTelegraph).toBeNull();
    expect(clearing.head).toBeNull();
    expect(clearing.tail).not.toBeNull();
    expect(clearing.bolt?.endY).toBe(bounds.height);
    expect(clearing.bolt?.startY).toBeGreaterThan(0);
  });

  it('rejects malformed authored beam endpoints', () => {
    const errors = validateSectorFeaturePlan({
      sectorId: 'sector_outer_debris_field',
      sectorIndex: 0,
      landmarks: [
        {
          id: 'beam_test_landmark',
          kind: 'beacon_line',
          distance: 100,
          xRatio: 0.5,
          widthRatio: 0.2,
          heightRatio: 0.1,
          label: 'beam fixture'
        }
      ],
      hazards: [
        {
          id: 'beam_test_hazard',
          kind: 'warning_beam',
          telegraphDistance: 20,
          startDistance: 190,
          endDistance: 330,
          xRatio: 0.5,
          widthRatio: 0.12,
          damage: 1,
          label: 'WARNING BEAM',
          beam: {
            sourceEdge: 'top',
            sourceOffsetRatio: 0.5,
            targetEdge: 'top',
            targetOffsetRatio: 1.2
          }
        }
      ]
    });

    expect(errors).toContain(
      'Sector feature plan sector_outer_debris_field hazard beam_test_hazard beam edges must differ'
    );
    expect(errors).toContain(
      'Sector feature plan sector_outer_debris_field feature beam_test_hazard must have beam targetOffsetRatio between 0 and 1'
    );
  });
});

function expectBeamSegmentClippedToArena(segment: {
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
}): void {
  const left = 0;
  const right = bounds.width;
  const top = 0;
  const bottom = bounds.height;
  const isOnArenaEdge = (x: number, y: number) =>
    x === left || x === right || y === top || y === bottom;

  expect(segment.startX).toBeGreaterThanOrEqual(left);
  expect(segment.startX).toBeLessThanOrEqual(right);
  expect(segment.startY).toBeGreaterThanOrEqual(top);
  expect(segment.startY).toBeLessThanOrEqual(bottom);
  expect(segment.endX).toBeGreaterThanOrEqual(left);
  expect(segment.endX).toBeLessThanOrEqual(right);
  expect(segment.endY).toBeGreaterThanOrEqual(top);
  expect(segment.endY).toBeLessThanOrEqual(bottom);
  expect(isOnArenaEdge(segment.startX, segment.startY)).toBe(true);
  expect(isOnArenaEdge(segment.endX, segment.endY)).toBe(true);
}
