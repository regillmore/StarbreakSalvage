import { clamp } from '../core/math';
import { createRng } from '../core/rng';

export type BeamHazardEdge = 'top' | 'right' | 'bottom' | 'left';

export interface BeamHazardGeometry {
  readonly sourceEdge: BeamHazardEdge;
  readonly sourceOffsetRatio: number;
  readonly targetEdge: BeamHazardEdge;
  readonly targetOffsetRatio: number;
}

export interface BeamHazardSegment {
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
  readonly radius: number;
  readonly angle: number;
  readonly length: number;
}

export interface BeamHazardRect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
  readonly centerX: number;
}

interface BeamBounds {
  readonly width: number;
  readonly height: number;
  readonly padding: number;
}

interface ActiveBeamHazard {
  readonly hazard: {
    readonly beam?: BeamHazardGeometry;
    readonly xRatio: number;
    readonly widthRatio: number;
    readonly telegraphDistance: number;
    readonly startDistance: number;
    readonly endDistance: number;
  };
  readonly phase: 'telegraph' | 'active';
  readonly progress: number;
  readonly phaseProgress: number;
  readonly worldProgress?: number;
}

export const BEAM_BOLT_LENGTH_RATIO = 0.42;
export const BEAM_WORLD_SCROLL_SCALE = 0.55;

const BEAM_ROUTES: readonly (readonly [BeamHazardEdge, BeamHazardEdge])[] = [
  ['top', 'bottom'],
  ['bottom', 'top'],
  ['left', 'right'],
  ['right', 'left'],
  ['top', 'right'],
  ['right', 'bottom'],
  ['bottom', 'left'],
  ['left', 'top'],
  ['top', 'left'],
  ['left', 'bottom'],
  ['bottom', 'right'],
  ['right', 'top']
];

export function createBeamHazardGeometry(seedKey: string): BeamHazardGeometry {
  const rng = createRng(seedKey).fork('beam-segment');
  const route = rng.choice(BEAM_ROUTES);

  return {
    sourceEdge: route[0],
    sourceOffsetRatio: rng.int(14, 86) / 100,
    targetEdge: route[1],
    targetOffsetRatio: rng.int(14, 86) / 100
  };
}

export function getBeamHazardSegment(
  hazard: {
    readonly beam?: BeamHazardGeometry;
    readonly xRatio: number;
    readonly widthRatio: number;
  },
  bounds: BeamBounds
): BeamHazardSegment {
  const geometry = hazard.beam ?? {
    sourceEdge: 'top' as const,
    sourceOffsetRatio: hazard.xRatio,
    targetEdge: 'bottom' as const,
    targetOffsetRatio: hazard.xRatio
  };
  const start = getEdgePoint(geometry.sourceEdge, geometry.sourceOffsetRatio, bounds);
  const end = getEdgePoint(geometry.targetEdge, geometry.targetOffsetRatio, bounds);
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  return {
    startX: start.x,
    startY: start.y,
    endX: end.x,
    endY: end.y,
    radius: roundBeamValue(clamp(bounds.width * hazard.widthRatio * 0.18, 8, 20)),
    angle: Math.atan2(dy, dx),
    length: Math.sqrt(dx * dx + dy * dy)
  };
}

export function getWorldAnchoredBeamTrack(
  activeHazard: ActiveBeamHazard,
  bounds: BeamBounds
): BeamHazardSegment {
  const segment = getBeamHazardSegment(activeHazard.hazard, bounds);
  const totalSpan = Math.max(
    1,
    activeHazard.hazard.endDistance - activeHazard.hazard.telegraphDistance
  );
  const telegraphLead = Math.max(
    0,
    activeHazard.hazard.startDistance - activeHazard.hazard.telegraphDistance
  );
  const distanceFromTelegraph =
    clamp(activeHazard.worldProgress ?? activeHazard.progress, 0, 1) * totalSpan;
  const worldOffsetY = roundBeamValue(
    (distanceFromTelegraph - telegraphLead) * BEAM_WORLD_SCROLL_SCALE
  );

  return translateBeamSegment(segment, 0, worldOffsetY);
}

export function getActiveBeamBoltSegment(
  activeHazard: ActiveBeamHazard,
  bounds: BeamBounds
): BeamHazardSegment | null {
  if (activeHazard.phase !== 'active') {
    return null;
  }

  const track = getWorldAnchoredBeamTrack(activeHazard, bounds);
  const travel = clamp(activeHazard.phaseProgress, 0, 1) * (1 + BEAM_BOLT_LENGTH_RATIO);
  const headProgress = clamp(travel, 0, 1);
  const tailProgress = clamp(travel - BEAM_BOLT_LENGTH_RATIO, 0, 1);

  if (headProgress - tailProgress <= 0.001) {
    return null;
  }

  return sliceBeamSegment(track, tailProgress, headProgress);
}

export function formatBeamHazardTrack(geometry: BeamHazardGeometry | undefined): string {
  const beam = geometry ?? {
    sourceEdge: 'top' as const,
    sourceOffsetRatio: 0.5,
    targetEdge: 'bottom' as const,
    targetOffsetRatio: 0.5
  };
  return `${beam.sourceEdge.toUpperCase()} ${Math.round(beam.sourceOffsetRatio * 100)}% to ${beam.targetEdge.toUpperCase()} ${Math.round(beam.targetOffsetRatio * 100)}%`;
}

export function circleOverlapsBeamSegment(
  circle: { readonly x: number; readonly y: number; readonly radius: number },
  segment: BeamHazardSegment
): boolean {
  const dx = segment.endX - segment.startX;
  const dy = segment.endY - segment.startY;
  const lengthSquared = dx * dx + dy * dy;
  const progress =
    lengthSquared <= 0
      ? 0
      : clamp(
          ((circle.x - segment.startX) * dx + (circle.y - segment.startY) * dy) / lengthSquared,
          0,
          1
        );
  const nearestX = segment.startX + dx * progress;
  const nearestY = segment.startY + dy * progress;
  const distanceX = circle.x - nearestX;
  const distanceY = circle.y - nearestY;
  const collisionRadius = circle.radius + segment.radius;

  return distanceX * distanceX + distanceY * distanceY <= collisionRadius * collisionRadius;
}

export function createBeamSegmentDamageRects(
  segment: BeamHazardSegment
): readonly BeamHazardRect[] {
  const targetSpan = Math.max(28, segment.radius * 2.4);
  const segmentCount = Math.max(2, Math.min(24, Math.ceil(segment.length / targetSpan)));

  return Array.from({ length: segmentCount }, (_value, index) => {
    const startProgress = index / segmentCount;
    const endProgress = (index + 1) / segmentCount;
    const startX = segment.startX + (segment.endX - segment.startX) * startProgress;
    const startY = segment.startY + (segment.endY - segment.startY) * startProgress;
    const endX = segment.startX + (segment.endX - segment.startX) * endProgress;
    const endY = segment.startY + (segment.endY - segment.startY) * endProgress;
    const left = Math.min(startX, endX) - segment.radius;
    const top = Math.min(startY, endY) - segment.radius;
    const right = Math.max(startX, endX) + segment.radius;
    const bottom = Math.max(startY, endY) + segment.radius;

    return {
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top,
      centerX: (left + right) / 2
    };
  });
}

function getEdgePoint(
  edge: BeamHazardEdge,
  offsetRatio: number,
  bounds: BeamBounds
): { readonly x: number; readonly y: number } {
  const ratio = clamp(offsetRatio, 0.08, 0.92);

  if (edge === 'top') return { x: bounds.width * ratio, y: bounds.padding };
  if (edge === 'bottom') {
    return { x: bounds.width * ratio, y: bounds.height - bounds.padding };
  }
  if (edge === 'left') return { x: bounds.padding, y: bounds.height * ratio };
  return { x: bounds.width - bounds.padding, y: bounds.height * ratio };
}

function translateBeamSegment(
  segment: BeamHazardSegment,
  offsetX: number,
  offsetY: number
): BeamHazardSegment {
  return {
    ...segment,
    startX: roundBeamValue(segment.startX + offsetX),
    startY: roundBeamValue(segment.startY + offsetY),
    endX: roundBeamValue(segment.endX + offsetX),
    endY: roundBeamValue(segment.endY + offsetY)
  };
}

function sliceBeamSegment(
  segment: BeamHazardSegment,
  startProgress: number,
  endProgress: number
): BeamHazardSegment {
  const startX = segment.startX + (segment.endX - segment.startX) * startProgress;
  const startY = segment.startY + (segment.endY - segment.startY) * startProgress;
  const endX = segment.startX + (segment.endX - segment.startX) * endProgress;
  const endY = segment.startY + (segment.endY - segment.startY) * endProgress;
  const dx = endX - startX;
  const dy = endY - startY;

  return {
    startX: roundBeamValue(startX),
    startY: roundBeamValue(startY),
    endX: roundBeamValue(endX),
    endY: roundBeamValue(endY),
    radius: segment.radius,
    angle: Math.atan2(dy, dx),
    length: roundBeamValue(Math.sqrt(dx * dx + dy * dy))
  };
}

function roundBeamValue(value: number): number {
  return Math.round(value * 1000) / 1000;
}
