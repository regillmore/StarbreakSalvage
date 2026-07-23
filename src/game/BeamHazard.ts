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

export interface BeamHazardPoint {
  readonly x: number;
  readonly y: number;
}

export interface ActiveBeamHazardPresentation {
  readonly bolt: BeamHazardSegment | null;
  readonly leadingTelegraph: BeamHazardSegment | null;
  readonly head: BeamHazardPoint | null;
  readonly tail: BeamHazardPoint | null;
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
  readonly worldDistance?: number;
  readonly launchWorldDistance?: number;
  readonly elapsedSeconds?: number;
}

export interface BeamHazardTiming {
  readonly endTravelSeconds: number;
  readonly fullyLitSeconds: number;
  readonly totalSeconds: number;
}

export const BEAM_END_VELOCITY_UNITS_PER_SECOND = 960;
export const BEAM_FULLY_LIT_DURATION_SECONDS = 2;
export const BEAM_WORLD_OVERSCAN_RATIO = 0.22;
export const BEAM_WORLD_SCROLL_SCALE = 0.42;

const DEFAULT_BEAM_BOUNDS: BeamBounds = { width: 640, height: 720, padding: 0 };

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
): BeamHazardSegment | null {
  return clipBeamSegmentToArena(getDistantWorldBeamTrack(activeHazard, bounds), bounds);
}

function getDistantWorldBeamTrack(
  activeHazard: ActiveBeamHazard,
  bounds: BeamBounds
): BeamHazardSegment {
  const segment = createDistantBeamTrack(activeHazard.hazard, bounds);
  const totalSpan = Math.max(
    1,
    activeHazard.hazard.endDistance - activeHazard.hazard.telegraphDistance
  );
  const telegraphLead = Math.max(
    0,
    activeHazard.hazard.startDistance - activeHazard.hazard.telegraphDistance
  );
  const distanceFromTelegraph =
    activeHazard.worldDistance === undefined
      ? clamp(activeHazard.worldProgress ?? activeHazard.progress, 0, 1) * totalSpan
      : Math.max(0, activeHazard.worldDistance - activeHazard.hazard.telegraphDistance);
  const worldOffsetY = roundBeamValue(
    (distanceFromTelegraph - telegraphLead) * BEAM_WORLD_SCROLL_SCALE
  );

  return translateBeamSegment(segment, 0, worldOffsetY);
}

function getLaunchedBeamTrack(
  activeHazard: ActiveBeamHazard,
  bounds: BeamBounds
): BeamHazardSegment {
  const segment = createDistantBeamTrack(activeHazard.hazard, bounds);
  const launchWorldDistance = activeHazard.launchWorldDistance ?? activeHazard.hazard.startDistance;
  const launchOffsetY = roundBeamValue(
    (launchWorldDistance - activeHazard.hazard.startDistance) * BEAM_WORLD_SCROLL_SCALE
  );
  return translateBeamSegment(segment, 0, launchOffsetY);
}

export function getActiveBeamBoltSegment(
  activeHazard: ActiveBeamHazard,
  bounds: BeamBounds
): BeamHazardSegment | null {
  return getActiveBeamHazardPresentation(activeHazard, bounds).bolt;
}

export function getActiveBeamHazardPresentation(
  activeHazard: ActiveBeamHazard,
  bounds: BeamBounds
): ActiveBeamHazardPresentation {
  if (activeHazard.phase !== 'active') {
    return {
      bolt: null,
      leadingTelegraph: null,
      head: null,
      tail: null
    };
  }

  const worldTrack = getLaunchedBeamTrack(activeHazard, bounds);
  const timing = getBeamHazardTiming(activeHazard.hazard, bounds);
  const elapsedSeconds = clamp(
    activeHazard.elapsedSeconds ?? activeHazard.phaseProgress * timing.totalSeconds,
    0,
    timing.totalSeconds
  );
  const fullyLitEndsAt = timing.endTravelSeconds + timing.fullyLitSeconds;
  const headDistance = clamp(
    elapsedSeconds * BEAM_END_VELOCITY_UNITS_PER_SECOND,
    0,
    worldTrack.length
  );
  const tailDistance = clamp(
    (elapsedSeconds - fullyLitEndsAt) * BEAM_END_VELOCITY_UNITS_PER_SECOND,
    0,
    worldTrack.length
  );

  const headProgress = headDistance / worldTrack.length;
  const tailProgress = tailDistance / worldTrack.length;
  const head = getPointOnBeamSegment(worldTrack, headProgress);
  const tail = getPointOnBeamSegment(worldTrack, tailProgress);
  const worldBolt =
    headDistance - tailDistance <= 0.001
      ? null
      : sliceBeamSegment(worldTrack, tailProgress, headProgress);
  const leadingWorldSegment =
    headDistance >= worldTrack.length - 0.001
      ? null
      : sliceBeamSegment(worldTrack, headProgress, 1);

  return {
    bolt: worldBolt ? clipBeamSegmentToArena(worldBolt, bounds) : null,
    leadingTelegraph: leadingWorldSegment
      ? clipBeamSegmentToArena(leadingWorldSegment, bounds)
      : null,
    head: isBeamPointVisible(head, worldTrack.radius, bounds) ? head : null,
    tail: tailDistance > 0.001 && isBeamPointVisible(tail, worldTrack.radius, bounds) ? tail : null
  };
}

export function getBeamHazardTiming(
  hazard: {
    readonly beam?: BeamHazardGeometry;
    readonly xRatio: number;
    readonly widthRatio: number;
  },
  bounds: BeamBounds = DEFAULT_BEAM_BOUNDS
): BeamHazardTiming {
  const arenaSegment = getBeamHazardSegment(hazard, bounds);
  const overscan = Math.max(bounds.width, bounds.height) * BEAM_WORLD_OVERSCAN_RATIO;
  const endTravelSeconds = roundBeamValue(
    (arenaSegment.length + overscan * 2) / BEAM_END_VELOCITY_UNITS_PER_SECOND
  );

  return {
    endTravelSeconds,
    fullyLitSeconds: BEAM_FULLY_LIT_DURATION_SECONDS,
    totalSeconds: roundBeamValue(endTravelSeconds * 2 + BEAM_FULLY_LIT_DURATION_SECONDS)
  };
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

  if (edge === 'top') return { x: bounds.width * ratio, y: 0 };
  if (edge === 'bottom') {
    return { x: bounds.width * ratio, y: bounds.height };
  }
  if (edge === 'left') return { x: 0, y: bounds.height * ratio };
  return { x: bounds.width, y: bounds.height * ratio };
}

function createDistantBeamTrack(
  hazard: ActiveBeamHazard['hazard'],
  bounds: BeamBounds
): BeamHazardSegment {
  const arenaSegment = getBeamHazardSegment(hazard, bounds);
  const overscan = Math.max(bounds.width, bounds.height) * BEAM_WORLD_OVERSCAN_RATIO;
  const directionX = Math.cos(arenaSegment.angle);
  const directionY = Math.sin(arenaSegment.angle);
  return createBeamSegment(
    arenaSegment.startX - directionX * overscan,
    arenaSegment.startY - directionY * overscan,
    arenaSegment.endX + directionX * overscan,
    arenaSegment.endY + directionY * overscan,
    arenaSegment.radius
  );
}

function getPointOnBeamSegment(segment: BeamHazardSegment, progress: number): BeamHazardPoint {
  return {
    x: roundBeamValue(segment.startX + (segment.endX - segment.startX) * progress),
    y: roundBeamValue(segment.startY + (segment.endY - segment.startY) * progress)
  };
}

function isBeamPointVisible(point: BeamHazardPoint, radius: number, bounds: BeamBounds): boolean {
  const margin = radius * 1.2;
  return (
    point.x >= -margin &&
    point.x <= bounds.width + margin &&
    point.y >= -margin &&
    point.y <= bounds.height + margin
  );
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

function clipBeamSegmentToArena(
  segment: BeamHazardSegment,
  bounds: BeamBounds
): BeamHazardSegment | null {
  const dx = segment.endX - segment.startX;
  const dy = segment.endY - segment.startY;
  const left = 0;
  const right = bounds.width;
  const top = 0;
  const bottom = bounds.height;
  const p = [-dx, dx, -dy, dy];
  const q = [
    segment.startX - left,
    right - segment.startX,
    segment.startY - top,
    bottom - segment.startY
  ];
  let startProgress = 0;
  let endProgress = 1;

  for (let index = 0; index < p.length; index += 1) {
    const direction = p[index] ?? 0;
    const distance = q[index] ?? 0;

    if (Math.abs(direction) <= 0.000001) {
      if (distance < 0) return null;
      continue;
    }

    const intersection = distance / direction;
    if (direction < 0) {
      startProgress = Math.max(startProgress, intersection);
    } else {
      endProgress = Math.min(endProgress, intersection);
    }

    if (startProgress > endProgress) return null;
  }

  if (endProgress - startProgress <= 0.000001) {
    return null;
  }

  return sliceBeamSegment(segment, startProgress, endProgress);
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
  return createBeamSegment(startX, startY, endX, endY, segment.radius);
}

function createBeamSegment(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  radius: number
): BeamHazardSegment {
  const dx = endX - startX;
  const dy = endY - startY;

  return {
    startX: roundBeamValue(startX),
    startY: roundBeamValue(startY),
    endX: roundBeamValue(endX),
    endY: roundBeamValue(endY),
    radius,
    angle: Math.atan2(dy, dx),
    length: roundBeamValue(Math.sqrt(dx * dx + dy * dy))
  };
}

function roundBeamValue(value: number): number {
  return Math.round(value * 1000) / 1000;
}
