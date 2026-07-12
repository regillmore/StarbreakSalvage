import type { CombatEndReason } from './CombatState';

export type SectorExitSequenceReason = Extract<CombatEndReason, 'sectorComplete' | 'victory'>;
export type SectorExitPhase = 'ignition' | 'boost' | 'clear' | 'transition';

export interface SectorExitSequenceOptions {
  readonly sectorName: string;
  readonly sectorIndex: number;
  readonly sectorCount: number;
  readonly reason: SectorExitSequenceReason;
  readonly reducedMotion: boolean;
  readonly playerX?: number;
  readonly playerY?: number;
  readonly debugFast?: boolean;
}

export interface SectorExitSequenceState {
  readonly sectorName: string;
  readonly sectorIndex: number;
  readonly sectorCount: number;
  readonly reason: SectorExitSequenceReason;
  readonly reducedMotion: boolean;
  readonly debugFast: boolean;
  readonly finalSector: boolean;
  readonly originX: number;
  readonly originY: number;
  readonly durationSeconds: number;
  elapsedSeconds: number;
}

export interface SectorExitPresentation {
  readonly phase: SectorExitPhase;
  readonly title: string;
  readonly announcement: string;
  readonly hint: string;
  readonly progress: number;
  readonly shipX: number;
  readonly shipY: number;
  readonly shipScale: number;
  readonly shipAlpha: number;
  readonly thrust: number;
  readonly exhaustScale: number;
  readonly speedLineAlpha: number;
  readonly transitionAlpha: number;
}

const NORMAL_EXIT_SECONDS = 1.72;
const REDUCED_MOTION_EXIT_SECONDS = 0.96;
const DEBUG_EXIT_SECONDS = 0.6;
const COMBAT_CENTER_X = 320;
const DEFAULT_PLAYER_Y = 562;
const IGNITION_END = 0.22;
const BOOST_END = 0.74;
const TRANSITION_START = 0.7;

export function createSectorExitSequence(
  options: SectorExitSequenceOptions
): SectorExitSequenceState {
  const sectorCount = Math.max(1, Math.floor(options.sectorCount));
  const sectorIndex = Math.max(0, Math.floor(options.sectorIndex));
  const debugFast = options.debugFast === true;
  const durationSeconds = debugFast
    ? DEBUG_EXIT_SECONDS
    : options.reducedMotion
      ? REDUCED_MOTION_EXIT_SECONDS
      : NORMAL_EXIT_SECONDS;

  return {
    sectorName: options.sectorName,
    sectorIndex,
    sectorCount,
    reason: options.reason,
    reducedMotion: options.reducedMotion,
    debugFast,
    finalSector: options.reason === 'victory' || sectorIndex >= sectorCount - 1,
    originX: sanitizeCoordinate(options.playerX, COMBAT_CENTER_X),
    originY: sanitizeCoordinate(options.playerY, DEFAULT_PLAYER_Y),
    durationSeconds,
    elapsedSeconds: 0
  };
}

export function advanceSectorExitSequence(
  state: SectorExitSequenceState,
  dt: number
): boolean {
  state.elapsedSeconds = Math.min(
    state.durationSeconds,
    Math.max(0, state.elapsedSeconds + Math.max(0, dt))
  );
  return state.elapsedSeconds >= state.durationSeconds;
}

export function getSectorExitPresentation(
  state: SectorExitSequenceState
): SectorExitPresentation {
  const progress = getSectorExitProgress(state);
  const phase = getSectorExitPhase(progress);
  const ignitionProgress = smoothStep(clamp01(progress / IGNITION_END));
  const boostProgress = smoothStep(
    clamp01((progress - IGNITION_END) / (BOOST_END - IGNITION_END))
  );
  const transitionProgress = smoothStep(
    clamp01((progress - TRANSITION_START) / (1 - TRANSITION_START))
  );
  const launchDistance = state.originY + 168;
  const shipY =
    progress <= IGNITION_END
      ? state.originY - ignitionProgress * 18
      : state.originY - 18 - launchDistance * boostProgress * boostProgress;
  const shipAlpha = roundExitValue(1 - clamp01((progress - BOOST_END) / 0.12));
  const finalTarget = state.finalSector ? 'run summary' : 'route selection';

  return {
    phase,
    title: phase === 'ignition' ? 'Departure burn armed' : 'Departure burn committed',
    announcement: formatDepartureAnnouncement(state, phase),
    hint:
      phase === 'transition'
        ? `Ship clear; opening ${finalTarget}.`
        : 'Camera holding sector position while the ship accelerates beyond visual range.',
    progress,
    shipX: roundExitValue(lerp(state.originX, COMBAT_CENTER_X, ignitionProgress)),
    shipY: roundExitValue(shipY),
    shipScale: roundExitValue(1 - boostProgress * 0.14),
    shipAlpha,
    thrust: roundExitValue(0.45 + ignitionProgress * 0.55),
    exhaustScale: roundExitValue(
      state.reducedMotion ? 1.35 : 1 + ignitionProgress * 0.9 + boostProgress * 2.4
    ),
    speedLineAlpha: state.reducedMotion
      ? 0
      : roundExitValue(Math.sin(boostProgress * Math.PI) * 0.48),
    transitionAlpha: roundExitValue(transitionProgress)
  };
}

export function getSectorExitProgress(state: SectorExitSequenceState): number {
  if (state.durationSeconds <= 0) {
    return 1;
  }

  return roundExitValue(Math.min(1, Math.max(0, state.elapsedSeconds / state.durationSeconds)));
}

function getSectorExitPhase(progress: number): SectorExitPhase {
  if (progress < IGNITION_END) return 'ignition';
  if (progress < BOOST_END) return 'boost';
  if (progress < 0.88) return 'clear';
  return 'transition';
}

function formatDepartureAnnouncement(
  state: SectorExitSequenceState,
  phase: SectorExitPhase
): string {
  if (phase === 'ignition') {
    return `${state.sectorName} clear. Main thrusters igniting.`;
  }

  if (phase === 'boost') {
    return `${state.sectorName} clear. Ship accelerating out of sector.`;
  }

  if (phase === 'clear') {
    return 'Ship clear of local camera range.';
  }

  return state.finalSector ? 'Opening run summary.' : 'Opening route selection.';
}

function sanitizeCoordinate(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function smoothStep(value: number): number {
  const progress = clamp01(value);
  return progress * progress * (3 - 2 * progress);
}

function roundExitValue(value: number): number {
  return Math.round(value * 1000) / 1000;
}
