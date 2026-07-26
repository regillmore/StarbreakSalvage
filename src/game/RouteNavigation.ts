import { getMissionObjective } from '../content/objectives';
import { createRng } from '../core/rng';
import type { ActRouteDifficulty } from './ActRouteGraph';
import type { RouteOption, RunSkeleton } from './Generation';
import { selectMissionContract } from './MissionDirector';

export interface RouteNavigationOptionReadModel {
  readonly route: RouteOption;
  readonly riskLabel: 'LOW' | 'GUARDED' | 'SEVERE';
  readonly summary: string;
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
  readonly effect: RouteNavigationOptionReadModel | null;
}

export function selectNodeRouteEffect(run: RunSkeleton, targetSectorIndex: number): RouteOption {
  const target = run.sectors[targetSectorIndex];
  if (!target) {
    throw new Error(`Cannot select a route effect for sector ${targetSectorIndex}.`);
  }
  const routeOptions =
    target.act.actSectorIndex === target.act.actSectorCount
      ? target.routeOptions.filter((route) => route.kind !== 'shop')
      : target.routeOptions;
  if (routeOptions.length === 0) {
    throw new Error(`Sector ${targetSectorIndex} has no route effect candidates.`);
  }

  const risks = routeOptions.map((route) => route.risk);
  const minRisk = Math.min(...risks);
  const maxRisk = Math.max(...risks);
  const riskSpan = maxRisk - minRisk;
  const rng = createRng(`${run.seed}:node-route-effect:${targetSectorIndex}:${target.sectorId}`);

  return rng.weightedChoice(
    routeOptions.map((route) => {
      const riskPosition = riskSpan === 0 ? 0.5 : (route.risk - minRisk) / riskSpan;
      return {
        item: route,
        weight: getRouteEffectWeight(target.act.actRouteDifficulty, riskPosition)
      };
    })
  );
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
  const routeEffect = target
    ? selectNodeRouteEffect(options.run, options.targetSectorIndex!)
    : null;

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
    effect: routeEffect
      ? {
          route: routeEffect,
          riskLabel: formatRouteRisk(routeEffect.risk),
          summary:
            routeEffect.kind === 'shop'
              ? 'Reserve discounted, biased stock in the destination sector shop.'
              : finishSentence(routeEffect.rewardHint)
        }
      : null
  };
}

function getRouteEffectWeight(difficulty: ActRouteDifficulty, riskPosition: number): number {
  if (difficulty === 'easier') return 1 + (1 - riskPosition) * 8;
  if (difficulty === 'harder') return 1 + riskPosition * 8;
  return 1 + (1 - Math.abs(riskPosition - 0.5) * 2) * 4;
}

function formatDifficultyLabel(difficulty: string): string {
  if (difficulty === 'easier') return 'EASIER SIGNAL';
  if (difficulty === 'harder') return 'HARDER SIGNAL';
  if (difficulty === 'standard') return 'STANDARD SIGNAL';
  if (difficulty === 'finale') return 'CONVERGENCE';
  return 'ENTRY';
}

function formatDifficultySummary(difficulty: string): string {
  if (difficulty === 'easier') return 'Shorter operation · safer route effects favored';
  if (difficulty === 'harder') return 'Longer operation · severe route effects favored';
  if (difficulty === 'standard') return 'Baseline operation · balanced route effects';
  if (difficulty === 'finale') return 'All surviving paths converge · balanced route effect';
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
