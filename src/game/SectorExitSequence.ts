import type { CombatEndReason } from './CombatState';

export type SectorExitSequenceReason = Extract<CombatEndReason, 'sectorComplete' | 'victory'>;
export type SectorExitPhase = 'rendezvous' | 'ignition' | 'boost' | 'clear' | 'transition';
export type SectorExitEscortKind = 'ally' | 'drone';

export interface SectorExitEscortOrigin {
  readonly id: string;
  readonly kind: SectorExitEscortKind;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

export interface SectorExitEscortPresentation {
  readonly id: string;
  readonly kind: SectorExitEscortKind;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly alpha: number;
  readonly thrust: number;
}

export interface SectorExitSequenceOptions {
  readonly sectorName: string;
  readonly sectorIndex: number;
  readonly sectorCount: number;
  readonly reason: SectorExitSequenceReason;
  readonly reducedMotion: boolean;
  readonly playerX?: number;
  readonly playerY?: number;
  readonly escorts?: readonly SectorExitEscortOrigin[];
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
  readonly stagingY: number;
  readonly escorts: readonly SectorExitEscortOrigin[];
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
  readonly rendezvousProgress: number;
  readonly escorts: readonly SectorExitEscortPresentation[];
}

const NORMAL_EXIT_SECONDS = 1.72;
const REDUCED_MOTION_EXIT_SECONDS = 0.96;
const DEBUG_EXIT_SECONDS = 0.6;
const ESCORTED_EXIT_SECONDS = 2.24;
const ESCORTED_REDUCED_MOTION_SECONDS = 1.28;
const ESCORTED_DEBUG_SECONDS = 0.78;
const COMBAT_CENTER_X = 320;
const DEFAULT_PLAYER_Y = 562;
const ESCORT_STAGING_Y = 500;
const MAX_EXIT_ESCORTS = 12;
const RENDEZVOUS_END = 0.3;
const ESCORTED_IGNITION_END = 0.43;
const ESCORTED_BOOST_END = 0.78;
const ESCORTED_TRANSITION_START = 0.74;
const IGNITION_END = 0.22;
const BOOST_END = 0.74;
const TRANSITION_START = 0.7;

const ESCORT_FORMATION_OFFSETS: readonly (readonly [number, number])[] = [
  [-30, 42],
  [30, 42],
  [-58, 76],
  [0, 82],
  [58, 76],
  [-86, 110],
  [-30, 118],
  [30, 118],
  [86, 110],
  [-60, 150],
  [0, 156],
  [60, 150]
];

export function createSectorExitSequence(
  options: SectorExitSequenceOptions
): SectorExitSequenceState {
  const sectorCount = Math.max(1, Math.floor(options.sectorCount));
  const sectorIndex = Math.max(0, Math.floor(options.sectorIndex));
  const debugFast = options.debugFast === true;
  const escorts = sanitizeEscorts(options.escorts);
  const escorted = escorts.length > 0;
  const durationSeconds = debugFast
    ? escorted
      ? ESCORTED_DEBUG_SECONDS
      : DEBUG_EXIT_SECONDS
    : options.reducedMotion
      ? escorted
        ? ESCORTED_REDUCED_MOTION_SECONDS
        : REDUCED_MOTION_EXIT_SECONDS
      : escorted
        ? ESCORTED_EXIT_SECONDS
        : NORMAL_EXIT_SECONDS;
  const originY = sanitizeCoordinate(options.playerY, DEFAULT_PLAYER_Y);

  return {
    sectorName: options.sectorName,
    sectorIndex,
    sectorCount,
    reason: options.reason,
    reducedMotion: options.reducedMotion,
    debugFast,
    finalSector: options.reason === 'victory' || sectorIndex >= sectorCount - 1,
    originX: sanitizeCoordinate(options.playerX, COMBAT_CENTER_X),
    originY,
    stagingY: escorted ? Math.min(originY, ESCORT_STAGING_Y) : originY,
    escorts,
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
  const escorted = state.escorts.length > 0;
  const ignitionEnd = escorted ? ESCORTED_IGNITION_END : IGNITION_END;
  const boostEnd = escorted ? ESCORTED_BOOST_END : BOOST_END;
  const transitionStart = escorted ? ESCORTED_TRANSITION_START : TRANSITION_START;
  const phase = getSectorExitPhase(progress, escorted);
  const rendezvousProgress = escorted
    ? smoothStep(clamp01(progress / RENDEZVOUS_END))
    : 1;
  const ignitionProgress = smoothStep(
    clamp01(
      escorted
        ? (progress - RENDEZVOUS_END) / (ignitionEnd - RENDEZVOUS_END)
        : progress / ignitionEnd
    )
  );
  const boostProgress = smoothStep(
    clamp01((progress - ignitionEnd) / (boostEnd - ignitionEnd))
  );
  const transitionProgress = smoothStep(
    clamp01((progress - transitionStart) / (1 - transitionStart))
  );
  const launchDistance = escorted
    ? state.stagingY + ESCORT_FORMATION_OFFSETS[MAX_EXIT_ESCORTS - 1]![1] + 170
    : state.originY + 168;
  const shipY =
    escorted && progress < RENDEZVOUS_END
      ? lerp(state.originY, state.stagingY, rendezvousProgress)
      : progress <= ignitionEnd
        ? state.stagingY - ignitionProgress * 18
        : state.stagingY - 18 - launchDistance * boostProgress * boostProgress;
  const shipAlpha = roundExitValue(1 - clamp01((progress - boostEnd) / 0.12));
  const finalTarget = state.finalSector ? 'run summary' : 'route selection';
  const shipX = lerp(
    state.originX,
    COMBAT_CENTER_X,
    escorted ? rendezvousProgress : ignitionProgress
  );
  const shipScale = 1 - boostProgress * 0.14;
  const escortThrust = clamp01(
    0.28 + rendezvousProgress * 0.28 + ignitionProgress * 0.24 + boostProgress * 0.42
  );

  return {
    phase,
    title:
      phase === 'rendezvous'
        ? 'Wing recall in progress'
        : phase === 'ignition'
          ? 'Departure burn armed'
          : 'Departure burn committed',
    announcement: formatDepartureAnnouncement(state, phase),
    hint:
      phase === 'transition'
        ? `Ship clear; opening ${finalTarget}.`
        : 'Camera holding sector position while the ship accelerates beyond visual range.',
    progress,
    shipX: roundExitValue(shipX),
    shipY: roundExitValue(shipY),
    shipScale: roundExitValue(shipScale),
    shipAlpha,
    thrust: roundExitValue(0.45 + ignitionProgress * 0.55),
    exhaustScale: roundExitValue(
      state.reducedMotion ? 1.35 : 1 + ignitionProgress * 0.9 + boostProgress * 2.4
    ),
    speedLineAlpha: state.reducedMotion
      ? 0
      : roundExitValue(Math.sin(boostProgress * Math.PI) * 0.48),
    transitionAlpha: roundExitValue(transitionProgress),
    rendezvousProgress: roundExitValue(rendezvousProgress),
    escorts: state.escorts.map((escort, index) => {
      const [offsetX, offsetY] = ESCORT_FORMATION_OFFSETS[index]!;
      const formationX = shipX + offsetX * (1 - boostProgress * 0.16);
      const formationY = shipY + offsetY;
      const joining = progress < RENDEZVOUS_END;

      return {
        id: escort.id,
        kind: escort.kind,
        x: roundExitValue(
          joining ? lerp(escort.x, formationX, rendezvousProgress) : formationX
        ),
        y: roundExitValue(
          joining ? lerp(escort.y, formationY, rendezvousProgress) : formationY
        ),
        scale: roundExitValue(shipScale),
        alpha: shipAlpha,
        thrust: roundExitValue(escortThrust)
      };
    })
  };
}

export function getSectorExitProgress(state: SectorExitSequenceState): number {
  if (state.durationSeconds <= 0) {
    return 1;
  }

  return roundExitValue(Math.min(1, Math.max(0, state.elapsedSeconds / state.durationSeconds)));
}

function getSectorExitPhase(progress: number, escorted: boolean): SectorExitPhase {
  if (escorted && progress < RENDEZVOUS_END) return 'rendezvous';
  if (progress < (escorted ? ESCORTED_IGNITION_END : IGNITION_END)) return 'ignition';
  if (progress < (escorted ? ESCORTED_BOOST_END : BOOST_END)) return 'boost';
  if (progress < 0.88) return 'clear';
  return 'transition';
}

function formatDepartureAnnouncement(
  state: SectorExitSequenceState,
  phase: SectorExitPhase
): string {
  if (phase === 'rendezvous') {
    return `${state.sectorName} clear. Recalling ${formatEscortCount(state.escorts)}.`;
  }

  if (phase === 'ignition') {
    return state.escorts.length > 0
      ? `${state.sectorName} clear. Wing collected; main thrusters igniting.`
      : `${state.sectorName} clear. Main thrusters igniting.`;
  }

  if (phase === 'boost') {
    return state.escorts.length > 0
      ? `${state.sectorName} clear. Ship and wing accelerating out of sector.`
      : `${state.sectorName} clear. Ship accelerating out of sector.`;
  }

  if (phase === 'clear') {
    return state.escorts.length > 0
      ? 'Ship and wing clear of local camera range.'
      : 'Ship clear of local camera range.';
  }

  return state.finalSector ? 'Opening run summary.' : 'Opening route selection.';
}

function sanitizeEscorts(
  escorts: readonly SectorExitEscortOrigin[] | undefined
): readonly SectorExitEscortOrigin[] {
  const sanitized: SectorExitEscortOrigin[] = [];
  const seenIds = new Set<string>();

  for (const escort of escorts ?? []) {
    const id = escort.id.trim();
    if (!id || seenIds.has(id) || sanitized.length >= MAX_EXIT_ESCORTS) continue;
    seenIds.add(id);
    sanitized.push({
      id,
      kind: escort.kind,
      x: sanitizeCoordinate(escort.x, COMBAT_CENTER_X),
      y: sanitizeCoordinate(escort.y, DEFAULT_PLAYER_Y),
      radius: Math.max(1, sanitizeCoordinate(escort.radius, 8))
    });
  }

  return sanitized;
}

function formatEscortCount(escorts: readonly SectorExitEscortOrigin[]): string {
  const allyCount = escorts.filter(({ kind }) => kind === 'ally').length;
  const droneCount = escorts.length - allyCount;
  const parts: string[] = [];
  if (allyCount > 0) parts.push(`${allyCount} ${allyCount === 1 ? 'ally' : 'allies'}`);
  if (droneCount > 0) parts.push(`${droneCount} ${droneCount === 1 ? 'drone' : 'drones'}`);
  return parts.join(' and ');
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
