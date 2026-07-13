import type {
  MissionCleanupPolicy,
  MissionContractDefinition,
  MissionCrewPolicy,
  MissionFactionPolicy,
  MissionFailurePolicy,
  MissionObjectiveClauseDefinition,
  MissionObjectiveDefinition,
  MissionObjectiveMetric,
  MissionObjectiveVerb
} from '../content/objectives';
import { clamp } from '../core/math';
import type { CombatState } from './CombatState';
import type { SectorObjectivePlan } from './SectorObjectives';

export type MissionObjectiveOutcome = 'active' | 'success' | 'partialSuccess' | 'failure';

export interface MissionObjectivePlan {
  readonly contractId: string;
  readonly contractTitle: string;
  readonly objectiveId: string;
  readonly verb: MissionObjectiveVerb;
  readonly label: string;
  readonly hudVerb: string;
  readonly summary: string;
  readonly clauses: readonly MissionObjectiveClauseDefinition[];
  readonly partialSuccessThreshold: number;
  readonly cleanupPolicy: MissionCleanupPolicy;
  readonly successCopy: string;
  readonly partialSuccessCopy: string;
  readonly failureCopy: string;
  readonly optional: boolean;
  readonly factionPolicy: MissionFactionPolicy;
  readonly crewPolicy: MissionCrewPolicy;
  readonly failurePolicy: MissionFailurePolicy;
}

export interface MissionObjectiveClauseProgress {
  readonly id: string;
  readonly metric: MissionObjectiveMetric;
  readonly label: string;
  readonly value: number;
  readonly target: number;
  readonly complete: boolean;
  readonly readout: string;
}

export interface MissionObjectiveProgress {
  readonly contractId: string;
  readonly objectiveId: string;
  readonly verb: MissionObjectiveVerb;
  readonly label: string;
  readonly hudVerb: string;
  readonly readout: string;
  readonly clauses: readonly MissionObjectiveClauseProgress[];
  readonly completedRequiredClauses: number;
  readonly requiredClauseCount: number;
  readonly completionRatio: number;
  readonly fieldResolved: boolean;
  readonly preBossResolved: boolean;
  readonly terminal: boolean;
  readonly outcome: MissionObjectiveOutcome;
  readonly outcomeCopy: string;
}

export interface MissionObjectiveResultSnapshot {
  readonly contractId: string;
  readonly contractTitle: string;
  readonly objectiveId: string;
  readonly objectiveLabel: string;
  readonly verb: MissionObjectiveVerb;
  readonly stageId: string;
  readonly optional: boolean;
  readonly outcome: Exclude<MissionObjectiveOutcome, 'active'>;
  readonly completedClauseIds: readonly string[];
  readonly requiredClauseCount: number;
  readonly completionRatio: number;
  readonly cleanupPolicy: MissionCleanupPolicy;
  readonly summary: string;
  readonly factionPolicy: MissionFactionPolicy;
  readonly crewPolicy: MissionCrewPolicy;
  readonly failurePolicy: MissionFailurePolicy;
}

export type MissionObjectiveProgressState = Pick<
  CombatState,
  'nextSpawnIndex' | 'spawnSchedule' | 'enemies' | 'boss' | 'bossSpawned' | 'stats'
> & {
  readonly scrollDistance?: number;
};

export function createMissionObjectivePlan(options: {
  readonly contract: MissionContractDefinition;
  readonly objective: MissionObjectiveDefinition;
  readonly optional: boolean;
}): MissionObjectivePlan {
  return {
    contractId: options.contract.id,
    contractTitle: options.contract.title,
    objectiveId: options.objective.id,
    verb: options.objective.verb,
    label: options.objective.label,
    hudVerb: options.objective.hudVerb,
    summary: options.objective.summary,
    clauses: options.objective.clauses,
    partialSuccessThreshold: options.objective.partialSuccessThreshold,
    cleanupPolicy: options.objective.cleanupPolicy,
    successCopy: options.objective.successCopy,
    partialSuccessCopy: options.objective.partialSuccessCopy,
    failureCopy: options.objective.failureCopy,
    optional: options.optional,
    factionPolicy: options.contract.factionPolicy,
    crewPolicy: options.contract.crewPolicy,
    failurePolicy: options.contract.failurePolicy
  };
}

export function projectMissionObjectivePlan(
  plan: MissionObjectivePlan,
  sectorObjective: Pick<SectorObjectivePlan, 'bossRequired'>
): MissionObjectivePlan {
  if (sectorObjective.bossRequired) {
    return plan;
  }

  const clauses = plan.clauses.filter((clause) => clause.metric !== 'bossDefeats');
  if (clauses.length === plan.clauses.length) {
    return plan;
  }

  return {
    ...plan,
    label: `${plan.label} Screen`,
    hudVerb: 'CLEAR APPROACH',
    summary:
      'Clear the support field and cross this operation lane; the terminal target remains at the required gate.',
    clauses,
    cleanupPolicy: 'clearField',
    successCopy: 'Support field cleared; terminal contact remains ahead.',
    partialSuccessCopy: 'Support field crossed with unresolved approach losses.',
    failureCopy: 'The support field retained control of the approach.'
  };
}

export function getMissionObjectiveProgress(
  plan: MissionObjectivePlan,
  sectorObjective: SectorObjectivePlan,
  sectorLength: number | null,
  state: MissionObjectiveProgressState
): MissionObjectiveProgress {
  const clauses = plan.clauses.map((clause) =>
    evaluateClause(clause, sectorObjective, sectorLength, state)
  );
  const required = clauses.filter(
    (clause) => plan.clauses.find((definition) => definition.id === clause.id)?.required
  );
  const completedRequiredClauses = required.filter((clause) => clause.complete).length;
  const requiredClauseCount = required.length;
  const completionRatio =
    requiredClauseCount === 0 ? 1 : completedRequiredClauses / requiredClauseCount;
  const allSpawnsIssued = state.nextSpawnIndex >= state.spawnSchedule.length;
  const supportFieldClear = state.enemies.every((enemy) => enemy.countsForObjective === false);
  const preBossResolved = allSpawnsIssued && supportFieldClear;
  const needsBoss = plan.clauses.some((clause) => clause.metric === 'bossDefeats');
  const bossResolved = !needsBoss || (state.stats.bossesDefeated > 0 && state.boss === null);
  const travelResolved =
    sectorLength === null || Math.max(0, state.scrollDistance ?? 0) >= sectorLength;
  const fieldResolved = preBossResolved && state.boss === null;
  const terminal = travelResolved && fieldResolved && bossResolved;
  const outcome: MissionObjectiveOutcome = !terminal
    ? 'active'
    : completionRatio >= 1
      ? 'success'
      : completionRatio >= plan.partialSuccessThreshold
        ? 'partialSuccess'
        : 'failure';
  const outcomeCopy =
    outcome === 'success'
      ? plan.successCopy
      : outcome === 'partialSuccess'
        ? plan.partialSuccessCopy
        : outcome === 'failure'
          ? plan.failureCopy
          : plan.summary;

  return {
    contractId: plan.contractId,
    objectiveId: plan.objectiveId,
    verb: plan.verb,
    label: plan.label,
    hudVerb: plan.hudVerb,
    readout: formatObjectiveProgressReadout(plan, clauses, outcome),
    clauses,
    completedRequiredClauses,
    requiredClauseCount,
    completionRatio,
    fieldResolved,
    preBossResolved,
    terminal,
    outcome,
    outcomeCopy
  };
}

export function createMissionObjectiveResultSnapshot(
  plan: MissionObjectivePlan,
  progress: MissionObjectiveProgress,
  stageId: string,
  outcomeOverride?: Exclude<MissionObjectiveOutcome, 'active'>
): MissionObjectiveResultSnapshot {
  const outcome = outcomeOverride ?? (progress.outcome === 'active' ? 'failure' : progress.outcome);
  const outcomeCopy =
    outcome === 'success'
      ? plan.successCopy
      : outcome === 'partialSuccess'
        ? plan.partialSuccessCopy
        : plan.failureCopy;
  return {
    contractId: plan.contractId,
    contractTitle: plan.contractTitle,
    objectiveId: plan.objectiveId,
    objectiveLabel: plan.label,
    verb: plan.verb,
    stageId,
    optional: plan.optional,
    outcome,
    completedClauseIds: progress.clauses
      .filter((clause) => clause.complete)
      .map((clause) => clause.id),
    requiredClauseCount: progress.requiredClauseCount,
    completionRatio: outcomeOverride === 'success' ? 1 : progress.completionRatio,
    cleanupPolicy: plan.cleanupPolicy,
    summary: outcomeCopy,
    factionPolicy: plan.factionPolicy,
    crewPolicy: plan.crewPolicy,
    failurePolicy: plan.failurePolicy
  };
}

export function formatMissionObjectiveBrief(plan: MissionObjectivePlan): string {
  return `${plan.hudVerb}: ${plan.summary} ${plan.clauses
    .filter((clause) => clause.required)
    .map((clause) => formatClauseTarget(clause))
    .join(' | ')}`;
}

export function formatMissionObjectiveHistory(
  history: readonly MissionObjectiveResultSnapshot[]
): string {
  if (history.length === 0) {
    return 'No objective outcomes recorded.';
  }
  return history
    .map(
      (record) =>
        `${record.contractTitle}/${record.objectiveLabel}: ${formatOutcome(record.outcome)}${
          record.optional ? ' (optional)' : ''
        } [${record.factionPolicy}/${record.crewPolicy}/${record.cleanupPolicy}]`
    )
    .join(' > ');
}

function evaluateClause(
  clause: MissionObjectiveClauseDefinition,
  sectorObjective: SectorObjectivePlan,
  sectorLength: number | null,
  state: MissionObjectiveProgressState
): MissionObjectiveClauseProgress {
  const value = getMetricValue(clause.metric, sectorObjective, sectorLength, state);
  const complete =
    clause.comparison === 'atLeast' ? value >= clause.target : value <= clause.target;
  return {
    id: clause.id,
    metric: clause.metric,
    label: clause.label,
    value,
    target: clause.target,
    complete,
    readout: formatClauseProgress(clause, value, complete)
  };
}

function getMetricValue(
  metric: MissionObjectiveMetric,
  sectorObjective: SectorObjectivePlan,
  sectorLength: number | null,
  state: MissionObjectiveProgressState
): number {
  const escapes = state.stats.enemiesEscaped;
  switch (metric) {
    case 'enemyDefeatRatio':
      return clamp(
        (state.stats.enemiesDestroyed - state.stats.bossesDefeated) /
          Math.max(1, sectorObjective.requiredEnemyKills),
        0,
        1
      );
    case 'enemyEscapes':
      return escapes;
    case 'travelRatio':
      return sectorLength === null
        ? 1
        : clamp(Math.max(0, state.scrollDistance ?? 0) / Math.max(1, sectorLength), 0, 1);
    case 'looseCurrencyValue':
      return state.stats.looseCurrencyCollected;
    case 'pickupsCollected':
      return state.stats.pickupsCollected;
    case 'damageTaken':
      return state.stats.damageTaken;
    case 'grazes':
      return state.stats.grazes;
    case 'projectilesCancelled':
      return state.stats.enemyProjectilesCancelled;
    case 'environmentBreaks':
      return state.stats.environmentObjectsDestroyed;
    case 'bossDefeats':
      return state.stats.bossesDefeated;
  }
}

function formatObjectiveProgressReadout(
  plan: MissionObjectivePlan,
  clauses: readonly MissionObjectiveClauseProgress[],
  outcome: MissionObjectiveOutcome
): string {
  const outcomeLabel = outcome === 'active' ? '' : ` | ${formatOutcome(outcome)}`;
  return `${plan.hudVerb} | ${clauses.map((clause) => clause.readout).join(' | ')}${outcomeLabel}`;
}

function formatClauseProgress(
  clause: MissionObjectiveClauseDefinition,
  value: number,
  complete: boolean
): string {
  const marker = complete ? 'OK' : '..';
  if (clause.metric === 'enemyDefeatRatio' || clause.metric === 'travelRatio') {
    return `${marker} ${clause.label} ${Math.round(value * 100)}/${Math.round(clause.target * 100)}%`;
  }
  const comparator = clause.comparison === 'atMost' ? '<=' : '';
  return `${marker} ${clause.label} ${formatMetricValue(value)}${comparator ? ` ${comparator}` : '/'}${formatMetricValue(clause.target)}`;
}

function formatClauseTarget(clause: MissionObjectiveClauseDefinition): string {
  if (clause.metric === 'enemyDefeatRatio' || clause.metric === 'travelRatio') {
    return `${clause.label} ${Math.round(clause.target * 100)}%`;
  }
  return `${clause.label} ${clause.comparison === 'atMost' ? '<= ' : ''}${clause.target}`;
}

function formatMetricValue(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function formatOutcome(outcome: MissionObjectiveOutcome): string {
  if (outcome === 'partialSuccess') return 'partial success';
  return outcome;
}
