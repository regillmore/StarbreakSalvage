import type { CombatEndReason } from './CombatState';

export type SectorExitSequenceReason = Extract<CombatEndReason, 'sectorComplete' | 'victory'>;
export type SectorExitMotion = 'corridor' | 'static';

export interface SectorExitSequenceOptions {
  readonly sectorName: string;
  readonly sectorIndex: number;
  readonly sectorCount: number;
  readonly reason: SectorExitSequenceReason;
  readonly reducedMotion: boolean;
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
  readonly durationSeconds: number;
  elapsedSeconds: number;
}

export interface SectorExitPresentation {
  readonly title: string;
  readonly toast: string;
  readonly hint: string;
  readonly progress: number;
  readonly motion: SectorExitMotion;
  readonly beaconAlpha: number;
  readonly corridorAlpha: number;
  readonly pulseScale: number;
}

const NORMAL_EXIT_SECONDS = 1.15;
const REDUCED_MOTION_EXIT_SECONDS = 0.72;
const DEBUG_EXIT_SECONDS = 0.55;

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
  const percent = Math.round(progress * 100);
  const motion: SectorExitMotion = state.reducedMotion ? 'static' : 'corridor';
  const title = state.finalSector ? 'Final exit beacon locked' : 'Sector exit beacon locked';
  const routeText = state.finalSector ? 'summary uplink' : 'route telemetry';

  return {
    title,
    toast: `${state.sectorName} clear | ${routeText} ${percent}%`,
    hint: state.finalSector
      ? 'Hint final corridor secured; preparing run summary.'
      : 'Hint sector exit secured; plotting route choices.',
    progress,
    motion,
    beaconAlpha: roundExitValue(0.5 + progress * 0.38),
    corridorAlpha: motion === 'static' ? 0 : roundExitValue(0.16 + progress * 0.24),
    pulseScale:
      motion === 'static' ? 1 : roundExitValue(0.94 + Math.sin(progress * Math.PI) * 0.08)
  };
}

export function getSectorExitProgress(state: SectorExitSequenceState): number {
  if (state.durationSeconds <= 0) {
    return 1;
  }

  return roundExitValue(Math.min(1, Math.max(0, state.elapsedSeconds / state.durationSeconds)));
}

function roundExitValue(value: number): number {
  return Math.round(value * 1000) / 1000;
}
