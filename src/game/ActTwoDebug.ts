import type { CombatRunResult } from './CombatState';
import type { RouteOption, RunSkeleton } from './Generation';
import type { RouteHistoryEntry } from './RunSession';
import { getDefaultActRoutePathSectorIndices } from './ActRouteGraph';

export interface ActTwoDebugScenario {
  readonly actOneFinalSectorIndex: number;
  readonly actTwoEntrySectorIndex: number;
  readonly finaleSectorIndex: number;
  readonly distanceBeforeActTwo: number;
  readonly distanceBeforeFinale: number;
}

export function createActTwoDebugScenario(
  run: Pick<RunSkeleton, 'acts' | 'sectors' | 'actRouteGraph'>
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
  run: Pick<RunSkeleton, 'sectors' | 'actRouteGraph'>,
  sectorIndex: number
): number {
  const route = getDefaultActRoutePathSectorIndices(run.actRouteGraph);
  const targetPosition = route.indexOf(Math.max(0, Math.floor(sectorIndex)));
  const preceding = targetPosition >= 0 ? route.slice(0, targetPosition) : [];
  return preceding.reduce((total, index) => total + (run.sectors[index]?.scroll.length ?? 0), 0);
}

export function createDebugRouteHistoryBeforeSector(
  run: Pick<RunSkeleton, 'sectors' | 'actRouteGraph'>,
  sectorIndex: number
): RouteHistoryEntry[] {
  const defaultRoute = getDefaultActRoutePathSectorIndices(run.actRouteGraph);
  const targetPosition = defaultRoute.indexOf(Math.max(0, Math.floor(sectorIndex)));
  const routeSectorIndices = targetPosition >= 0 ? defaultRoute.slice(0, targetPosition) : [];
  return routeSectorIndices.flatMap((sectorIndex, position) => {
    const sector = run.sectors[sectorIndex];
    if (!sector) return [];
    const route = sector.routeOptions[0];

    if (!route) {
      return [];
    }

    return [
      {
        sectorIndex: sector.index,
        targetSectorIndex: run.sectors[defaultRoute[position + 1] ?? -1]?.index,
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
  run: Pick<RunSkeleton, 'sectors' | 'actRouteGraph'>
): CombatRunResult {
  const finaleSector = run.sectors.find((sector) => sector.finale !== null) ?? run.sectors.at(-1);
  const sectorLength = finaleSector?.scroll.length ?? null;

  return {
    reason: 'debug',
    survivedSeconds: 420,
    distanceTraveled: finaleSector
      ? getDistanceBeforeSector(run, finaleSector.index - 1) + finaleSector.scroll.length
      : 0,
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
