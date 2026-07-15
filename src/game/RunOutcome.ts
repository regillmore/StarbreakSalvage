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
  run: Pick<RunSkeleton, 'sectors' | 'acts' | 'actRouteGraph'>,
  currentSectorIndex: number,
  routeHistoryLength: number,
  reason: CombatEndReason,
  completedVictorySectors: number = run.acts.reduce(
    (total, act) => total + act.routeDepth,
    0
  )
): number {
  const playableSectorCount = run.acts.reduce((total, act) => total + act.routeDepth, 0);
  if (reason === 'victory') {
    return Math.min(playableSectorCount, Math.max(0, completedVictorySectors));
  }
  const currentAct = run.acts.find(
    (act) =>
      currentSectorIndex >= act.startSectorIndex && currentSectorIndex <= act.endSectorIndex
  );
  const completedBeforeCurrent = routeHistoryLength + Math.max(0, (currentAct?.index ?? 1) - 1);
  return Math.min(
    playableSectorCount,
    Math.max(0, completedBeforeCurrent + (reason === 'sectorComplete' ? 1 : 0))
  );
}
