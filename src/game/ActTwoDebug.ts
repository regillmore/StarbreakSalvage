import type { CombatRunResult } from './CombatState';
import type { RouteOption, RunSkeleton } from './Generation';
import type { RouteHistoryEntry } from './RunSession';

export interface ActTwoDebugScenario {
  readonly actOneFinalSectorIndex: number;
  readonly actTwoEntrySectorIndex: number;
  readonly finaleSectorIndex: number;
  readonly distanceBeforeActTwo: number;
  readonly distanceBeforeFinale: number;
}

export function createActTwoDebugScenario(
  run: Pick<RunSkeleton, 'acts' | 'sectors'>
): ActTwoDebugScenario | null {
  const actTwo = run.acts.find((act) => act.id === 'act_core_descent');
  const actOne = run.acts.find((act) => act.index === 1);
  const finaleSectorIndex = run.sectors.findIndex((sector) => sector.finale !== null);

  if (!actOne || !actTwo || finaleSectorIndex < 0) {
    return null;
  }

  return {
    actOneFinalSectorIndex: actOne.endSectorIndex,
    actTwoEntrySectorIndex: actTwo.startSectorIndex,
    finaleSectorIndex,
    distanceBeforeActTwo: getDistanceBeforeSector(run, actTwo.startSectorIndex),
    distanceBeforeFinale: getDistanceBeforeSector(run, finaleSectorIndex)
  };
}

export function getDistanceBeforeSector(
  run: Pick<RunSkeleton, 'sectors'>,
  sectorIndex: number
): number {
  return run.sectors
    .slice(0, Math.max(0, Math.floor(sectorIndex)))
    .reduce((total, sector) => total + sector.scroll.length, 0);
}

export function createDebugRouteHistoryThroughSector(
  run: Pick<RunSkeleton, 'sectors'>,
  sectorsCleared: number
): RouteHistoryEntry[] {
  return run.sectors.slice(0, Math.max(0, sectorsCleared)).flatMap((sector) => {
    const route = sector.routeOptions[0];

    if (!route) {
      return [];
    }

    return [
      {
        sectorIndex: sector.index,
        actId: sector.act.actId,
        actName: sector.act.actName,
        actShortLabel: sector.act.actShortLabel,
        actIndex: sector.act.actIndex,
        actSectorIndex: sector.act.actSectorIndex,
        actSectorCount: sector.act.actSectorCount,
        routeKind: route.kind,
        routeLabel: route.label,
        routeTags: route.routeTags ?? [],
        outcomeTitle: 'debug routed',
        outcomeSummary: `Debug smoke path through ${sector.sectorName}.`
      }
    ];
  });
}

export function createTwoActDebugSummaryResult(
  run: Pick<RunSkeleton, 'sectors'>
): CombatRunResult {
  const finaleSector = run.sectors.find((sector) => sector.finale !== null) ?? run.sectors.at(-1);
  const sectorLength = finaleSector?.scroll.length ?? null;

  return {
    reason: 'debug',
    survivedSeconds: 420,
    distanceTraveled: getDistanceBeforeSector(run, run.sectors.length - 1),
    sectorLength,
    credits: 72,
    salvage: 18,
    enemiesDestroyed: 96,
    bossesDefeated: 1,
    shotsFired: 640,
    pickupsCollected: 24,
    damageTaken: 2,
    itemTriggers: 36,
    itemNames: ['Debug Act II smoke path']
  };
}

export function formatRouteTagSummary(routes: readonly RouteOption[]): string | null {
  const routeTags = routes.flatMap((route) => route.routeTags ?? []);
  const uniqueTags = [...new Set(routeTags)];

  return uniqueTags.length > 0 ? uniqueTags.join('/') : null;
}
