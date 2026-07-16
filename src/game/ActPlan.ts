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
import {
  ACT_ROUTE_DEPTH,
  ACT_ROUTE_NODE_COUNT,
  formatActRouteNodeLabel,
  type ActRouteDifficulty
} from './ActRouteGraph';

export interface RunActPlan {
  readonly id: ActId;
  readonly index: number;
  readonly label: string;
  readonly shortLabel: string;
  readonly summary: string;
  readonly startSectorIndex: number;
  readonly endSectorIndex: number;
  readonly sectorCount: number;
  readonly routeDepth: number;
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
  readonly actRouteNodeLabel: string;
  readonly actRouteLaneIndex: number;
  readonly actRouteDifficulty: ActRouteDifficulty;
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

export interface InterActTransitionHandoff {
  readonly sourceAct: RunActPlan;
  readonly targetAct: RunActPlan;
}

export interface FrontierChoiceHandoff {
  readonly sourceAct: RunActPlan;
  readonly targetAct: RunActPlan;
}

export interface ActBoundaryHandoff {
  readonly kind: 'interActJunction' | 'frontierChoice';
  readonly sourceAct: RunActPlan;
  readonly targetAct: RunActPlan;
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
      routeDepth: ACT_ROUTE_DEPTH,
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
      const route = getLocalRouteContext(offset);
      contexts[act.startSectorIndex + offset] = {
        actId: act.id,
        actIndex: act.index,
        actName: act.label,
        actShortLabel: act.shortLabel,
        actSummary: act.summary,
        actSectorIndex: route.layerIndex + 1,
        actSectorCount: act.routeDepth,
        actRouteNodeLabel: formatActRouteNodeLabel(route.layerIndex, route.laneIndex),
        actRouteLaneIndex: route.laneIndex,
        actRouteDifficulty: route.difficulty,
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

  const route = getLocalRouteContext(safeSectorIndex - act.startSectorIndex);
  const actSectorIndex = route.layerIndex + 1;

  return {
    actId: act.id,
    actIndex: act.index,
    actName: act.label,
    actShortLabel: act.shortLabel,
    actSummary: act.summary,
    actSectorIndex,
    actSectorCount: act.routeDepth,
    actRouteNodeLabel: formatActRouteNodeLabel(route.layerIndex, route.laneIndex),
    actRouteLaneIndex: route.laneIndex,
    actRouteDifficulty: route.difficulty,
    runSectorIndex: safeSectorIndex + 1,
    routeGrammar: act.routeGrammar,
    rewardTier: act.rewardTier,
    pressureTier: act.pressureTier,
    bossGate: act.bossGate,
    transition: act.transition
  };
}

export function getActPlanById(
  acts: readonly RunActPlan[],
  actId: ActId
): RunActPlan | null {
  return acts.find((act) => act.id === actId) ?? null;
}

export function getInterActTransitionHandoff(
  acts: readonly RunActPlan[],
  previousSectorIndex: number,
  nextSectorIndex: number
): InterActTransitionHandoff | null {
  const previousAct = acts.find(
    (act) =>
      previousSectorIndex >= act.startSectorIndex && previousSectorIndex <= act.endSectorIndex
  );
  const nextAct = acts.find(
    (act) => nextSectorIndex >= act.startSectorIndex && nextSectorIndex <= act.endSectorIndex
  );

  if (!previousAct || !nextAct || previousAct.id === nextAct.id) {
    return null;
  }

  if (
    previousAct.transition.kind !== 'interActJunction' ||
    previousAct.transition.nextActId !== nextAct.id
  ) {
    return null;
  }

  return {
    sourceAct: previousAct,
    targetAct: nextAct
  };
}

export function getInterActHandoffAfterSector(
  acts: readonly RunActPlan[],
  completedSectorIndex: number
): InterActTransitionHandoff | null {
  return getInterActTransitionHandoff(acts, completedSectorIndex, completedSectorIndex + 1);
}

export function getFrontierChoiceHandoff(
  acts: readonly RunActPlan[],
  currentSectorIndex: number
): FrontierChoiceHandoff | null {
  const sourceAct = acts.find(
    (act) => act.endSectorIndex === currentSectorIndex && act.transition.kind === 'frontierChoice'
  );
  const targetAct = sourceAct?.transition.nextActId
    ? acts.find((act) => act.id === sourceAct.transition.nextActId)
    : null;
  return sourceAct && targetAct ? { sourceAct, targetAct } : null;
}

export function getActBoundaryHandoffAfterSector(
  acts: readonly RunActPlan[],
  completedSectorIndex: number
): ActBoundaryHandoff | null {
  const interActHandoff = getInterActHandoffAfterSector(acts, completedSectorIndex);
  if (interActHandoff) {
    return {
      kind: 'interActJunction',
      ...interActHandoff
    };
  }

  const frontierHandoff = getFrontierChoiceHandoff(acts, completedSectorIndex);
  return frontierHandoff
    ? {
        kind: 'frontierChoice',
        ...frontierHandoff
      }
    : null;
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

  const totalSectors = acts.reduce((total, act) => total + act.routeDepth, 0);
  const safeSectorsCleared = Math.max(0, Math.floor(sectorsCleared));
  const reachedActIndex = Math.min(
    acts.length - 1,
    Math.floor(Math.min(safeSectorsCleared, totalSectors - 1) / ACT_ROUTE_DEPTH)
  );
  const act = acts[reachedActIndex]!;
  const actSectorIndex =
    safeSectorsCleared >= totalSectors
      ? act.routeDepth
      : (safeSectorsCleared % ACT_ROUTE_DEPTH) + 1;

  return {
    actId: act.id,
    actName: act.label,
    actShortLabel: act.shortLabel,
    actIndex: act.index,
    actSectorIndex,
    actSectorCount: act.routeDepth,
    actsCompleted: countCompletedActs(acts, safeSectorsCleared)
  };
}

export function countCompletedActs(
  acts: readonly RunActPlan[],
  sectorsCleared: number
): number {
  const safeSectorsCleared = Math.max(0, Math.floor(sectorsCleared));
  return Math.min(
    acts.length,
    Math.floor(safeSectorsCleared / Math.max(1, ACT_ROUTE_DEPTH))
  );
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
        `${act.shortLabel} ${act.label}: 5-layer route / nodes S${act.startSectorIndex + 1}-S${act.endSectorIndex + 1}`
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

function getLocalRouteContext(offset: number): {
  readonly layerIndex: number;
  readonly laneIndex: number;
  readonly difficulty: ActRouteDifficulty;
} {
  const safeOffset = Math.max(0, Math.min(ACT_ROUTE_NODE_COUNT - 1, Math.floor(offset)));
  const widths = [1, 2, 3, 2, 1] as const;
  let cursor = 0;
  for (let layerIndex = 0; layerIndex < widths.length; layerIndex += 1) {
    const width = widths[layerIndex]!;
    if (safeOffset < cursor + width) {
      const laneIndex = safeOffset - cursor;
      const difficulty: ActRouteDifficulty =
        layerIndex === 0
          ? 'entry'
          : layerIndex === widths.length - 1
            ? 'finale'
            : width === 3 && laneIndex === 1
              ? 'standard'
              : laneIndex === 0
                ? 'easier'
                : 'harder';
      return { layerIndex, laneIndex, difficulty };
    }
    cursor += width;
  }
  return { layerIndex: 4, laneIndex: 0, difficulty: 'finale' };
}
