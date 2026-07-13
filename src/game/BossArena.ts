import type { SectorId } from '../content/sectors';
import { clamp } from '../core/math';
import type { SectorObjectivePlan } from './SectorObjectives';
import type { SectorScrollPlan } from './ScrollState';

export type BossArenaPhase = 'none' | 'travel' | 'approach' | 'locked' | 'released';

export interface BossArenaPlan {
  readonly sectorId: SectorId;
  readonly approachStartDistance: number;
  readonly lockDistance: number;
  readonly releaseDistance: number;
  readonly approachSpeed: number;
  readonly exitSpeed: number;
}

export interface BossArenaState {
  readonly plan: BossArenaPlan | null;
  phase: BossArenaPhase;
  bossSpawnRequested: boolean;
  released: boolean;
}

export interface BossArenaUpdateInput {
  readonly distance: number;
  readonly supportComplete: boolean;
  readonly bossActive: boolean;
  readonly bossAlreadySpawned: boolean;
  readonly bossDefeated: boolean;
}

export interface BossArenaUpdate {
  readonly phase: BossArenaPhase;
  readonly speedOverride: number | null;
  readonly shouldSpawnBoss: boolean;
}

const APPROACH_DISTANCE_RATIO = 0.08;
const EXIT_DISTANCE_RATIO = 0.13;
const MIN_APPROACH_DISTANCE = 170;
const MAX_APPROACH_DISTANCE = 230;
const MIN_EXIT_DISTANCE = 280;
const MAX_EXIT_DISTANCE = 360;
const APPROACH_SPEED_MULTIPLIER = 0.58;

export function createBossArenaPlan(options: {
  readonly sectorId: SectorId;
  readonly objective: SectorObjectivePlan;
  readonly scroll: SectorScrollPlan;
}): BossArenaPlan | null {
  if (!options.objective.bossRequired) {
    return null;
  }

  const exitDistance = roundArenaValue(
    clamp(options.scroll.length * EXIT_DISTANCE_RATIO, MIN_EXIT_DISTANCE, MAX_EXIT_DISTANCE)
  );
  const approachDistance = roundArenaValue(
    clamp(
      options.scroll.length * APPROACH_DISTANCE_RATIO,
      MIN_APPROACH_DISTANCE,
      MAX_APPROACH_DISTANCE
    )
  );
  const lockDistance = roundArenaValue(Math.max(0, options.scroll.length - exitDistance));
  const approachStartDistance = roundArenaValue(Math.max(0, lockDistance - approachDistance));

  return {
    sectorId: options.sectorId,
    approachStartDistance,
    lockDistance,
    releaseDistance: options.scroll.length,
    approachSpeed: roundArenaValue(
      clamp(
        options.scroll.baseSpeed * APPROACH_SPEED_MULTIPLIER,
        options.scroll.minSpeed,
        options.scroll.maxSpeed
      )
    ),
    exitSpeed: options.scroll.baseSpeed
  };
}

export function createBossArenaState(plan: BossArenaPlan | null): BossArenaState {
  return {
    plan,
    phase: plan ? 'travel' : 'none',
    bossSpawnRequested: false,
    released: false
  };
}

export function updateBossArenaState(
  state: BossArenaState,
  input: BossArenaUpdateInput
): BossArenaUpdate {
  const plan = state.plan;

  if (!plan) {
    state.phase = 'none';
    return { phase: 'none', speedOverride: null, shouldSpawnBoss: false };
  }

  const externallyBypassedBoss =
    input.bossAlreadySpawned &&
    !input.bossActive &&
    !input.bossDefeated &&
    !state.bossSpawnRequested;

  if (state.released || input.bossDefeated || externallyBypassedBoss) {
    state.released = true;
    state.phase = 'released';
    return { phase: 'released', speedOverride: plan.exitSpeed, shouldSpawnBoss: false };
  }

  if (input.distance >= plan.lockDistance) {
    state.phase = 'locked';

    const shouldSpawnBoss = input.supportComplete && !input.bossAlreadySpawned;

    if (shouldSpawnBoss) {
      state.bossSpawnRequested = true;
    }

    return { phase: 'locked', speedOverride: 0, shouldSpawnBoss };
  }

  if (input.distance >= plan.approachStartDistance) {
    state.phase = 'approach';
    return { phase: 'approach', speedOverride: plan.approachSpeed, shouldSpawnBoss: false };
  }

  state.phase = 'travel';
  return { phase: 'travel', speedOverride: null, shouldSpawnBoss: false };
}

export function formatBossArenaReadout(phase: BossArenaPhase): string | null {
  if (phase === 'approach') {
    return 'Arena approach';
  }

  if (phase === 'locked') {
    return 'Arena locked';
  }

  if (phase === 'released') {
    return 'Arena exit';
  }

  return null;
}

export function summarizeBossArenaPlan(plan: BossArenaPlan | null): unknown {
  if (!plan) {
    return null;
  }

  return {
    approachStartDistance: plan.approachStartDistance,
    lockDistance: plan.lockDistance,
    releaseDistance: plan.releaseDistance,
    approachSpeed: plan.approachSpeed
  };
}

function roundArenaValue(value: number): number {
  return Math.round(value * 100) / 100;
}
