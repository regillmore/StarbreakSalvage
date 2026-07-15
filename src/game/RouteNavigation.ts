import { getMissionObjective } from '../content/objectives';
import type { RouteOption, RunSkeleton } from './Generation';
import { selectMissionContract } from './MissionDirector';

export interface RouteNavigationOptionReadModel {
  readonly route: RouteOption;
  readonly riskLabel: 'LOW' | 'GUARDED' | 'SEVERE';
  readonly summary: string;
  readonly details: readonly string[];
}

export interface RouteNavigationReadModel {
  readonly sourceSectorIndex: number;
  readonly targetSectorIndex: number | null;
  readonly edgeLabel: string;
  readonly actLabel: string;
  readonly title: string;
  readonly summary: string;
  readonly objective: string;
  readonly difficultyLabel: string;
  readonly difficultySummary: string;
  readonly options: readonly RouteNavigationOptionReadModel[];
}

export function createRouteNavigationReadModel(options: {
  readonly run: RunSkeleton;
  readonly sourceSectorIndex: number;
  readonly targetSectorIndex: number | null;
}): RouteNavigationReadModel {
  const source = options.run.sectors[options.sourceSectorIndex];
  if (!source) {
    throw new Error(`Cannot create route navigation from sector ${options.sourceSectorIndex}.`);
  }
  const target =
    options.targetSectorIndex === null ? null : options.run.sectors[options.targetSectorIndex];
  if (options.targetSectorIndex !== null && !target) {
    throw new Error(`Cannot create route navigation to sector ${options.targetSectorIndex}.`);
  }

  const contract = target
    ? selectMissionContract(options.run.expedition, options.targetSectorIndex!)
    : null;
  const objective = contract ? getMissionObjective(contract.primaryObjectiveId) : null;

  return {
    sourceSectorIndex: options.sourceSectorIndex,
    targetSectorIndex: options.targetSectorIndex,
    edgeLabel: target
      ? `${source.sectorName} → ${target.sectorName}`
      : `${source.sectorName} → final extraction`,
    actLabel: target
      ? `${target.act.actShortLabel} ${target.act.actSectorIndex}/${target.act.actSectorCount}`
      : `${source.act.actShortLabel} COMPLETE`,
    title: contract ? `${contract.title} briefing` : `${source.sectorName} extraction`,
    summary: contract
      ? `${finishSentence(contract.summary)} ${finishSentence(contract.routePreview)}`
      : 'The final combat lane is settled. Choose the last outbound vector before closing the expedition ledger.',
    objective: objective ? `${objective.hudVerb} · ${objective.label}` : 'FINAL EXTRACTION',
    difficultyLabel: target ? formatDifficultyLabel(target.act.actRouteDifficulty) : 'FINAL',
    difficultySummary: target
      ? formatDifficultySummary(target.act.actRouteDifficulty)
      : 'The expedition closes beyond this signal.',
    options: source.routeOptions.map((route) => ({
      route,
      riskLabel: formatRouteRisk(route.risk),
      summary: finishSentence(route.rewardHint),
      details: [
        route.pressureHint ? `Pressure · ${route.pressureHint}` : null,
        route.rewardTierHint ? `Yield · ${route.rewardTierHint}` : null,
        route.environmentalHint ? `Terrain · ${route.environmentalHint}` : null,
        route.intelHint ? finishSentence(route.intelHint) : null
      ]
        .filter((detail): detail is string => detail !== null)
        .slice(0, 2)
    }))
  };
}

function formatDifficultyLabel(difficulty: string): string {
  if (difficulty === 'easier') return 'EASIER SIGNAL';
  if (difficulty === 'harder') return 'HARDER SIGNAL';
  if (difficulty === 'standard') return 'STANDARD SIGNAL';
  if (difficulty === 'finale') return 'CONVERGENCE';
  return 'ENTRY';
}

function formatDifficultySummary(difficulty: string): string {
  if (difficulty === 'easier') return 'Shorter operation · one fewer hazard window';
  if (difficulty === 'harder') return 'Longer operation · one added hazard window';
  if (difficulty === 'standard') return 'Baseline operation pressure';
  if (difficulty === 'finale') return 'All surviving paths converge here';
  return 'Act entry vector';
}

function formatRouteRisk(risk: number): RouteNavigationOptionReadModel['riskLabel'] {
  if (risk <= 2) return 'LOW';
  if (risk <= 4) return 'GUARDED';
  return 'SEVERE';
}

function finishSentence(value: string): string {
  const trimmed = value.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}
