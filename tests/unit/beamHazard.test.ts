import { describe, expect, it } from 'vitest';

import {
  circleOverlapsBeamSegment,
  createBeamHazardGeometry,
  createBeamSegmentDamageRects,
  getActiveBeamBoltSegment,
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

    expect(segment.startX).toBe(bounds.padding);
    expect(segment.endX).toBe(bounds.width - bounds.padding);
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

    expect(atFireStart.startX).toBe(atTelegraphStart.startX);
    expect(atFireStart.endX).toBe(atTelegraphStart.endX);
    expect(atFireStart.startY).toBeGreaterThan(atTelegraphStart.startY);
    expect(atFireStart.endY - atTelegraphStart.endY).toBeCloseTo(170 * 0.55, 3);
    expect(atFireStart.length).toBe(atTelegraphStart.length);

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
    expect(whileScrollPaused.startY).toBe(atFireStart.startY);
    expect(whileScrollPaused.endY).toBe(atFireStart.endY);
  });

  it('advances a finite long bolt whose visible body defines collision', () => {
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
    const makeActive = (phaseProgress: number) => ({
      hazard,
      phase: 'active' as const,
      progress: (170 + phaseProgress * 140) / 310,
      phaseProgress
    });
    const early = getActiveBeamBoltSegment(makeActive(0.18), bounds);
    const middle = getActiveBeamBoltSegment(makeActive(0.55), bounds);
    const late = getActiveBeamBoltSegment(makeActive(0.86), bounds);
    const finished = getActiveBeamBoltSegment(makeActive(1), bounds);

    expect(early).not.toBeNull();
    expect(middle).not.toBeNull();
    expect(late).not.toBeNull();
    expect(finished).toBeNull();
    if (!early || !middle || !late) throw new Error('Expected finite beam bolt segments.');

    expect(middle.startX).toBeGreaterThan(early.startX);
    expect(late.startX).toBeGreaterThan(middle.startX);
    expect(middle.length).toBeGreaterThan(200);
    expect(middle.length).toBeLessThan(bounds.width / 2);
    expect(
      circleOverlapsBeamSegment(
        {
          x: (middle.startX + middle.endX) / 2,
          y: (middle.startY + middle.endY) / 2,
          radius: 8
        },
        middle
      )
    ).toBe(true);
    expect(
      circleOverlapsBeamSegment(
        { x: bounds.width - bounds.padding, y: middle.endY, radius: 8 },
        middle
      )
    ).toBe(false);
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
