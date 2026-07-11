import type { CombatEndReason } from './CombatState';
import type { RunSkeleton } from './Generation';
import type { ObjectiveProgress } from './WaveDirector';

export type SectorCompletionReason = Extract<CombatEndReason, 'sectorComplete' | 'victory'>;

export function getSectorCompletionReason(
  run: Pick<RunSkeleton, 'sectors'>,
  sectorIndex: number,
  progress: Pick<ObjectiveProgress, 'complete'>
): SectorCompletionReason | null {
  if (!progress.complete) {
    return null;
  }

  return sectorIndex >= run.sectors.length - 1 ? 'victory' : 'sectorComplete';
}

export function getSaveRecordSectorCount(
  run: Pick<RunSkeleton, 'sectors'>,
  currentSectorIndex: number,
  routeHistoryLength: number,
  reason: CombatEndReason,
  completedVictorySectors: number = run.sectors.length
): number {
  if (reason === 'victory') {
    return Math.min(run.sectors.length, Math.max(0, completedVictorySectors));
  }

  return Math.max(0, currentSectorIndex, routeHistoryLength);
}
