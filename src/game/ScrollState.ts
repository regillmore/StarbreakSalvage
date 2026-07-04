import type { SectorId } from '../content/sectors';
import { clamp } from '../core/math';
import type { Rng } from '../core/rng';
import type { SectorObjectivePlan } from './SectorObjectives';

export interface SectorScrollPlan {
  readonly sectorId: SectorId;
  readonly sectorIndex: number;
  readonly length: number;
  readonly baseSpeed: number;
  readonly minSpeed: number;
  readonly maxSpeed: number;
  readonly startOffset: number;
}

export interface ScrollState {
  readonly plan: SectorScrollPlan;
  distance: number;
  speed: number;
  cameraOffset: number;
  worldOffset: number;
  complete: boolean;
}

export interface ScrollProgress {
  readonly distance: number;
  readonly length: number;
  readonly remaining: number;
  readonly ratio: number;
  readonly speed: number;
  readonly cameraOffset: number;
  readonly worldOffset: number;
  readonly complete: boolean;
}

export interface ScrollAdvanceResult {
  readonly previousDistance: number;
  readonly distance: number;
  readonly delta: number;
  readonly crossedExit: boolean;
}

export interface SectorScrollPlanOptions {
  readonly sectorId: SectorId;
  readonly sectorIndex: number;
  readonly objective: SectorObjectivePlan;
  readonly rng: Rng;
}

const MIN_SECTOR_LENGTH = 900;
const BASE_LENGTH = 1120;
const INDEX_LENGTH_STEP = 185;
const WAVE_LENGTH = 115;
const BOSS_LENGTH = 360;
const MIN_SCROLL_SPEED = 58;
const MAX_SCROLL_SPEED = 128;
const BASE_SCROLL_SPEED = 82;

export function createSectorScrollPlan(options: SectorScrollPlanOptions): SectorScrollPlan {
  const sectorIndex = Math.max(1, Math.floor(options.sectorIndex));
  const waveDistance = options.objective.requiredWaves * WAVE_LENGTH;
  const bossDistance = options.objective.bossRequired ? BOSS_LENGTH : 0;
  const lengthJitter = options.rng.int(-90, 170);
  const speedJitter = options.rng.int(-8, 10);
  const length = roundScrollValue(
    Math.max(
      MIN_SECTOR_LENGTH,
      BASE_LENGTH +
        (sectorIndex - 1) * INDEX_LENGTH_STEP +
        waveDistance +
        bossDistance +
        lengthJitter
    )
  );
  const baseSpeed = roundScrollValue(
    clamp(
      BASE_SCROLL_SPEED + (sectorIndex - 1) * 4 + speedJitter,
      MIN_SCROLL_SPEED,
      MAX_SCROLL_SPEED
    )
  );

  return {
    sectorId: options.sectorId,
    sectorIndex,
    length,
    baseSpeed,
    minSpeed: MIN_SCROLL_SPEED,
    maxSpeed: MAX_SCROLL_SPEED,
    startOffset: roundScrollValue((sectorIndex - 1) * 10_000 + options.rng.int(0, 999))
  };
}

export function createScrollState(plan: SectorScrollPlan): ScrollState {
  return {
    plan,
    distance: 0,
    speed: clamp(plan.baseSpeed, plan.minSpeed, plan.maxSpeed),
    cameraOffset: plan.startOffset,
    worldOffset: plan.startOffset,
    complete: plan.length <= 0
  };
}

export function advanceScrollState(
  state: ScrollState,
  dt: number,
  speedOverride?: number
): ScrollAdvanceResult {
  const safeDt = clamp(dt, 0, 0.1);
  const previousDistance = state.distance;
  const wasComplete = state.complete;

  state.speed =
    speedOverride === 0
      ? 0
      : clamp(speedOverride ?? state.speed, state.plan.minSpeed, state.plan.maxSpeed);

  if (safeDt <= 0 || state.complete) {
    syncOffsets(state);
    return {
      previousDistance,
      distance: state.distance,
      delta: 0,
      crossedExit: false
    };
  }

  state.distance = roundScrollValue(
    clamp(state.distance + state.speed * safeDt, 0, state.plan.length)
  );
  state.complete = state.distance >= state.plan.length;
  syncOffsets(state);

  return {
    previousDistance,
    distance: state.distance,
    delta: roundScrollValue(state.distance - previousDistance),
    crossedExit: !wasComplete && state.complete
  };
}

export function setScrollDistance(
  state: ScrollState,
  distance: number,
  speedOverride?: number
): ScrollAdvanceResult {
  const previousDistance = state.distance;
  const wasComplete = state.complete;

  state.speed =
    speedOverride === undefined
      ? state.speed
      : speedOverride === 0
        ? 0
        : clamp(speedOverride, state.plan.minSpeed, state.plan.maxSpeed);
  state.distance = roundScrollValue(clamp(distance, 0, state.plan.length));
  state.complete = state.distance >= state.plan.length;
  syncOffsets(state);

  return {
    previousDistance,
    distance: state.distance,
    delta: roundScrollValue(state.distance - previousDistance),
    crossedExit: !wasComplete && state.complete
  };
}

export function getScrollProgress(state: ScrollState): ScrollProgress {
  return {
    distance: state.distance,
    length: state.plan.length,
    remaining: roundScrollValue(Math.max(0, state.plan.length - state.distance)),
    ratio: state.plan.length > 0 ? clamp(state.distance / state.plan.length, 0, 1) : 1,
    speed: state.speed,
    cameraOffset: state.cameraOffset,
    worldOffset: state.worldOffset,
    complete: state.complete
  };
}

export function formatScrollReadout(state: ScrollState): string {
  const progress = getScrollProgress(state);

  return `Distance ${Math.floor(progress.distance)}/${Math.floor(
    progress.length
  )}u | Speed ${Math.round(progress.speed)}u/s`;
}

function syncOffsets(state: ScrollState): void {
  state.worldOffset = roundScrollValue(state.plan.startOffset + state.distance);
  state.cameraOffset = state.worldOffset;
}

function roundScrollValue(value: number): number {
  return Math.round(value * 100) / 100;
}
