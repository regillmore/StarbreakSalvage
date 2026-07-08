import {
  ACT_DEFINITIONS,
  type ActBossGate,
  type ActDefinition,
  type ActId,
  type ActPressureTier,
  type ActRewardTier,
  type ActRouteGrammar,
  type ActTransition
} from '../content/acts';
import type { SectorDefinition, SectorId } from '../content/sectors';

export interface RunActPlan {
  readonly id: ActId;
  readonly index: number;
  readonly label: string;
  readonly shortLabel: string;
  readonly summary: string;
  readonly startSectorIndex: number;
  readonly endSectorIndex: number;
  readonly sectorCount: number;
  readonly sectorIds: readonly SectorId[];
  readonly routeGrammar: ActRouteGrammar;
  readonly rewardTier: ActRewardTier;
  readonly pressureTier: ActPressureTier;
  readonly bossGate: ActBossGate;
  readonly transition: ActTransition;
}

export interface ActSectorContext {
  readonly actId: ActId;
  readonly actIndex: number;
  readonly actName: string;
  readonly actShortLabel: string;
  readonly actSummary: string;
  readonly actSectorIndex: number;
  readonly actSectorCount: number;
  readonly runSectorIndex: number;
  readonly routeGrammar: ActRouteGrammar;
  readonly rewardTier: ActRewardTier;
  readonly pressureTier: ActPressureTier;
  readonly bossGate: ActBossGate;
  readonly transition: ActTransition;
}

export interface ActSaveContext {
  readonly actId: ActId | null;
  readonly actName: string | null;
  readonly actShortLabel: string | null;
  readonly actIndex: number;
  readonly actSectorIndex: number;
  readonly actSectorCount: number | null;
  readonly actsCompleted: number;
}

export interface ActDebugState {
  readonly id: ActId;
  readonly name: string;
  readonly shortLabel: string;
  readonly index: number;
  readonly sectorIndex: number;
  readonly sectorCount: number;
  readonly rewardTier: ActRewardTier;
  readonly pressureTier: ActPressureTier;
  readonly bossGate: string;
  readonly transition: string;
}

export function createRunActPlan(
  sectors: readonly SectorDefinition[],
  definitions: readonly ActDefinition[] = ACT_DEFINITIONS
): RunActPlan[] {
  if (sectors.length === 0) {
    throw new Error('Cannot create an act plan without sectors.');
  }

  const orderedDefinitions = [...definitions].sort((left, right) => left.order - right.order);
  const minimumSectorCount = orderedDefinitions.reduce(
    (total, act) => total + act.sectorBudget.minSectors,
    0
  );

  if (minimumSectorCount > sectors.length) {
    throw new Error(
      `Act plan requires ${minimumSectorCount} sectors but only ${sectors.length} were generated.`
    );
  }

  const plans: RunActPlan[] = [];
  let cursor = 0;

  for (let index = 0; index < orderedDefinitions.length; index += 1) {
    const definition = orderedDefinitions[index];
    if (!definition) {
      continue;
    }

    const remainingDefinitions = orderedDefinitions.slice(index + 1);
    const remainingMinimum = remainingDefinitions.reduce(
      (total, act) => total + act.sectorBudget.minSectors,
      0
    );
    const remainingSectors = sectors.length - cursor;
    const sectorCount =
      index === orderedDefinitions.length - 1
        ? remainingSectors
        : clampInteger(
            definition.sectorBudget.plannedSectors,
            definition.sectorBudget.minSectors,
            Math.min(definition.sectorBudget.maxSectors, remainingSectors - remainingMinimum)
          );
    const actSectors = sectors.slice(cursor, cursor + sectorCount);

    if (actSectors.length === 0) {
      continue;
    }

    plans.push({
      id: definition.id,
      index: plans.length + 1,
      label: definition.label,
      shortLabel: definition.shortLabel,
      summary: definition.summary,
      startSectorIndex: cursor,
      endSectorIndex: cursor + actSectors.length - 1,
      sectorCount: actSectors.length,
      sectorIds: actSectors.map((sector) => sector.id),
      routeGrammar: definition.routeGrammar,
      rewardTier: definition.rewardTier,
      pressureTier: definition.pressureTier,
      bossGate: definition.bossGate,
      transition: definition.transition
    });

    cursor += actSectors.length;
  }

  return plans;
}

export function createActSectorContexts(acts: readonly RunActPlan[]): ActSectorContext[] {
  const contexts: ActSectorContext[] = [];

  for (const act of acts) {
    for (let offset = 0; offset < act.sectorCount; offset += 1) {
      contexts[act.startSectorIndex + offset] = {
        actId: act.id,
        actIndex: act.index,
        actName: act.label,
        actShortLabel: act.shortLabel,
        actSummary: act.summary,
        actSectorIndex: offset + 1,
        actSectorCount: act.sectorCount,
        runSectorIndex: act.startSectorIndex + offset + 1,
        routeGrammar: act.routeGrammar,
        rewardTier: act.rewardTier,
        pressureTier: act.pressureTier,
        bossGate: act.bossGate,
        transition: act.transition
      };
    }
  }

  return contexts;
}

export function getActContextForSector(
  acts: readonly RunActPlan[],
  sectorIndex: number
): ActSectorContext {
  const safeSectorIndex = Math.max(0, Math.floor(sectorIndex));
  const act =
    acts.find(
      (candidate) =>
        safeSectorIndex >= candidate.startSectorIndex &&
        safeSectorIndex <= candidate.endSectorIndex
    ) ?? acts[0];

  if (!act) {
    throw new Error('No act plan exists for the generated run.');
  }

  const actSectorIndex = Math.min(
    act.sectorCount,
    Math.max(1, safeSectorIndex - act.startSectorIndex + 1)
  );

  return {
    actId: act.id,
    actIndex: act.index,
    actName: act.label,
    actShortLabel: act.shortLabel,
    actSummary: act.summary,
    actSectorIndex,
    actSectorCount: act.sectorCount,
    runSectorIndex: safeSectorIndex + 1,
    routeGrammar: act.routeGrammar,
    rewardTier: act.rewardTier,
    pressureTier: act.pressureTier,
    bossGate: act.bossGate,
    transition: act.transition
  };
}

export function createRunActSaveContext(
  acts: readonly RunActPlan[],
  sectorsCleared: number
): ActSaveContext {
  if (acts.length === 0) {
    return {
      actId: null,
      actName: null,
      actShortLabel: null,
      actIndex: 0,
      actSectorIndex: 0,
      actSectorCount: null,
      actsCompleted: 0
    };
  }

  const totalSectors = acts.reduce((total, act) => total + act.sectorCount, 0);
  const safeSectorsCleared = Math.max(0, Math.floor(sectorsCleared));
  const reachedSectorIndex = Math.min(safeSectorsCleared, Math.max(0, totalSectors - 1));
  const context = getActContextForSector(acts, reachedSectorIndex);

  return {
    actId: context.actId,
    actName: context.actName,
    actShortLabel: context.actShortLabel,
    actIndex: context.actIndex,
    actSectorIndex: context.actSectorIndex,
    actSectorCount: context.actSectorCount,
    actsCompleted: countCompletedActs(acts, safeSectorsCleared)
  };
}

export function countCompletedActs(
  acts: readonly RunActPlan[],
  sectorsCleared: number
): number {
  const safeSectorsCleared = Math.max(0, Math.floor(sectorsCleared));
  return acts.filter((act) => safeSectorsCleared > act.endSectorIndex).length;
}

export function formatActSectorLabel(context: ActSectorContext): string {
  return `${context.actShortLabel} ${context.actSectorIndex}/${context.actSectorCount}`;
}

export function formatActDebugLabel(context: ActSectorContext): string {
  return `${context.actShortLabel} ${context.actName} ${context.actSectorIndex}/${context.actSectorCount}`;
}

export function formatRunActTimeline(acts: readonly RunActPlan[]): string {
  if (acts.length === 0) {
    return 'none';
  }

  return acts
    .map(
      (act) =>
        `${act.shortLabel} ${act.label}: S${act.startSectorIndex + 1}-S${act.endSectorIndex + 1}`
    )
    .join(' | ');
}

export function createActDebugState(context: ActSectorContext): ActDebugState {
  return {
    id: context.actId,
    name: context.actName,
    shortLabel: context.actShortLabel,
    index: context.actIndex,
    sectorIndex: context.actSectorIndex,
    sectorCount: context.actSectorCount,
    rewardTier: context.rewardTier,
    pressureTier: context.pressureTier,
    bossGate: context.bossGate.kind,
    transition: context.transition.kind
  };
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.floor(value)));
}
