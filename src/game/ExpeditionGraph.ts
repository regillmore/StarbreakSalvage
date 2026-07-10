import type { ActId } from '../content/acts';
import {
  EXPEDITION_OPPORTUNITIES,
  getExpeditionNodeProfile,
  type ExpeditionDurationBand,
  type ExpeditionEntryRule,
  type ExpeditionLegKind,
  type ExpeditionRewardHook,
  type ExpeditionTransitionPolicy
} from '../content/expeditions';
import type { Rng } from '../core/rng';
import type { RunActPlan } from './ActPlan';
import type {
  ExpeditionActPlan,
  ExpeditionBranch,
  ExpeditionCapacity,
  ExpeditionDebugState,
  ExpeditionDecisionRecord,
  ExpeditionEncounterNode,
  ExpeditionGate,
  ExpeditionGraph,
  ExpeditionGraphSourceSector,
  ExpeditionMissionLeg,
  ExpeditionNodeContentReferences,
  ExpeditionPathReadModel,
  ExpeditionProgressState,
  ExpeditionResolvedPath,
  ExpeditionSectorPlan
} from './ExpeditionTypes';
import { validateExpeditionGraph } from './ExpeditionValidation';

export type * from './ExpeditionTypes';
export { validateExpeditionGraph } from './ExpeditionValidation';

export function createExpeditionGraph(options: {
  readonly seed: string;
  readonly saveFingerprint: string;
  readonly acts: readonly RunActPlan[];
  readonly sectors: readonly ExpeditionGraphSourceSector[];
  readonly rng: Rng;
}): ExpeditionGraph {
  if (options.acts.length === 0 || options.sectors.length === 0) {
    throw new Error('Expedition graph requires at least one act and sector.');
  }

  const graphToken = options.rng.fork(`identity:${options.saveFingerprint}`).nextU32();
  const graphId = `expedition_${options.seed.toLowerCase()}_${graphToken
    .toString(16)
    .padStart(8, '0')}`;
  const nodes: ExpeditionEncounterNode[] = [];
  const missionLegs: ExpeditionMissionLeg[] = [];
  const branches: ExpeditionBranch[] = [];
  const sectors: ExpeditionSectorPlan[] = [];
  const gates: ExpeditionGate[] = [];

  for (const [offset, sector] of options.sectors.entries()) {
    const sectorNumber = offset + 1;
    const sectorPlanId = createSectorPlanId(sectorNumber);
    const nextSectorEntryNodeId =
      offset < options.sectors.length - 1 ? createNodeId(sectorNumber + 1, 'ingress') : null;
    const ingressNodeId = createNodeId(sectorNumber, 'ingress');
    const operationNodeId = createNodeId(sectorNumber, 'operation');
    const opportunityNodeId = createNodeId(sectorNumber, 'opportunity');
    const gateNodeId = createNodeId(sectorNumber, 'gate');
    const branchId = `expedition_branch_s${padSector(sectorNumber)}_opportunity`;
    const opportunity = options.rng
      .fork(`sector-${sectorNumber}-opportunity:${options.saveFingerprint}`)
      .choice(EXPEDITION_OPPORTUNITIES);
    const act = options.acts.find((candidate) => candidate.id === sector.act.actId);

    if (!act) {
      throw new Error(
        `Expedition sector ${sector.index} references missing act ${sector.act.actId}.`
      );
    }

    const isActEntry = offset === act.startSectorIndex && offset > 0;
    const isActExit = offset === act.endSectorIndex;
    const isFinale = sector.finale !== null || (isActExit && act.bossGate.kind === 'finale');
    const gateProfileId = isFinale
      ? 'expedition_profile_finale'
      : sector.objective.bossRequired
        ? 'expedition_profile_checkpoint'
        : 'expedition_profile_extraction';
    const operationProfileId =
      sector.act.pressureTier === 'elevated'
        ? 'expedition_profile_operation_escalated'
        : 'expedition_profile_operation_standard';
    const gateTransitionPolicy: ExpeditionTransitionPolicy = isFinale
      ? 'victory'
      : isActExit && act.transition.kind === 'interActJunction'
        ? 'interActJunction'
        : getExpeditionNodeProfile(gateProfileId).transitionPolicy;
    const commonContent = createContentReferences(sector, null);
    const ingress = createNode({
      id: ingressNodeId,
      profileId: 'expedition_profile_ingress',
      label: `${sector.sectorName} Ingress`,
      sectorPlanId,
      sectorIndex: sector.index,
      actId: sector.act.actId,
      optional: false,
      nextNodeIds: [operationNodeId],
      rewardHooks: [],
      content: commonContent,
      entryRule: isActEntry ? 'actHandoff' : undefined
    });
    const operation = createNode({
      id: operationNodeId,
      profileId: operationProfileId,
      label: `${sector.sectorName} Operation`,
      sectorPlanId,
      sectorIndex: sector.index,
      actId: sector.act.actId,
      optional: false,
      nextNodeIds: [gateNodeId, opportunityNodeId],
      rewardHooks: ['combatPayout'],
      content: commonContent
    });
    const opportunityNode = createNode({
      id: opportunityNodeId,
      profileId: 'expedition_profile_opportunity',
      label: opportunity.label,
      sectorPlanId,
      sectorIndex: sector.index,
      actId: sector.act.actId,
      optional: true,
      nextNodeIds: [gateNodeId],
      rewardHooks: opportunity.rewardHooks,
      content: createContentReferences(sector, opportunity.id)
    });
    const gateRewardHooks = createGateRewardHooks(sector, isActExit, isFinale);
    const gate = createNode({
      id: gateNodeId,
      profileId: gateProfileId,
      label: isFinale
        ? `${sector.sectorName} Finale`
        : sector.objective.bossRequired
          ? `${sector.sectorName} Checkpoint`
          : `${sector.sectorName} Extraction`,
      sectorPlanId,
      sectorIndex: sector.index,
      actId: sector.act.actId,
      optional: false,
      nextNodeIds: nextSectorEntryNodeId ? [nextSectorEntryNodeId] : [],
      rewardHooks: gateRewardHooks,
      content: commonContent,
      transitionPolicy: gateTransitionPolicy
    });

    nodes.push(ingress, operation, opportunityNode, gate);

    const legSpecs: readonly [ExpeditionLegKind, string, boolean, readonly string[]][] = [
      ['approach', `${sector.sectorName} approach`, false, [ingressNodeId]],
      ['operation', `${sector.sectorName} operation`, false, [operationNodeId]],
      ['opportunity', opportunity.label, true, [opportunityNodeId]],
      ['gate', gate.label, false, [gateNodeId]]
    ];
    const sectorMissionLegs = legSpecs.map(([kind, label, optional, nodeIds]) =>
      createMissionLeg(sectorPlanId, kind, label, optional, nodeIds)
    );
    missionLegs.push(...sectorMissionLegs);

    branches.push({
      id: branchId,
      sectorPlanId,
      sourceNodeId: operationNodeId,
      label: `${sector.sectorName} opportunity`,
      options: [
        {
          id: `${branchId}_press_on`,
          label: 'Press On',
          summary: 'Keep the contract line and proceed to the sector gate.',
          targetNodeId: gateNodeId,
          outcomeId: 'expedition_outcome_direct',
          default: true
        },
        {
          id: `${branchId}_detour`,
          label: opportunity.label,
          summary: opportunity.summary,
          targetNodeId: opportunityNodeId,
          outcomeId: opportunity.id,
          default: false
        }
      ]
    });

    sectors.push({
      id: sectorPlanId,
      sectorIndex: sector.index,
      sectorId: sector.sectorId,
      sectorName: sector.sectorName,
      actId: sector.act.actId,
      entryNodeId: ingressNodeId,
      exitNodeIds: [gateNodeId],
      missionLegIds: sectorMissionLegs.map((leg) => leg.id),
      nodeIds: [ingressNodeId, operationNodeId, opportunityNodeId, gateNodeId],
      requiredNodeIds: [ingressNodeId, operationNodeId, gateNodeId],
      optionalNodeIds: [opportunityNodeId],
      branchIds: [branchId]
    });

    if (isActExit) {
      gates.push({
        id: `expedition_gate_${act.id}`,
        actId: act.id,
        sectorPlanId,
        nodeId: gateNodeId,
        kind: act.bossGate.kind,
        required: act.bossGate.required,
        transitionKind: act.transition.kind
      });
    }
  }

  const expeditionActs: ExpeditionActPlan[] = options.acts.map((act) => {
    const actSectors = sectors.filter((sector) => sector.actId === act.id);
    const first = actSectors[0];
    const last = actSectors.at(-1);

    if (!first || !last) {
      throw new Error(`Expedition act ${act.id} has no generated sectors.`);
    }

    return {
      actId: act.id,
      actIndex: act.index,
      label: act.label,
      shortLabel: act.shortLabel,
      sectorPlanIds: actSectors.map((sector) => sector.id),
      entryNodeId: first.entryNodeId,
      exitNodeIds: last.exitNodeIds
    };
  });
  const startNodeId = sectors[0]?.entryNodeId;
  const terminalNodeIds = sectors.at(-1)?.exitNodeIds ?? [];

  if (!startNodeId || terminalNodeIds.length === 0) {
    throw new Error('Expedition graph could not determine start or terminal nodes.');
  }

  const partialGraph = {
    schemaVersion: 1 as const,
    id: graphId,
    seed: options.seed,
    saveFingerprint: options.saveFingerprint,
    acts: expeditionActs,
    sectors,
    missionLegs,
    nodes,
    branches,
    gates,
    startNodeId,
    terminalNodeIds
  };
  const graph: ExpeditionGraph = {
    ...partialGraph,
    capacity: createExpeditionCapacity(partialGraph)
  };
  const errors = validateExpeditionGraph(graph);

  if (errors.length > 0) {
    throw new Error(`Generated invalid expedition graph: ${errors.join('; ')}`);
  }

  return graph;
}

export function createExpeditionProgress(graph: ExpeditionGraph): ExpeditionProgressState {
  return {
    visitedNodeIds: [graph.startNodeId],
    decisions: []
  };
}

export function recordExpeditionDecision(
  graph: ExpeditionGraph,
  progress: ExpeditionProgressState,
  branchId: string,
  optionId: string
): ExpeditionProgressState {
  const branch = graph.branches.find((candidate) => candidate.id === branchId);
  const option = branch?.options.find((candidate) => candidate.id === optionId);

  if (!branch || !option) {
    throw new Error(`Unknown expedition decision ${branchId}/${optionId}.`);
  }

  return {
    ...progress,
    decisions: [
      ...progress.decisions.filter((decision) => decision.branchId !== branchId),
      { branchId, optionId }
    ]
  };
}

export function resolveExpeditionPath(
  graph: ExpeditionGraph,
  decisions: readonly ExpeditionDecisionRecord[] = []
): ExpeditionResolvedPath {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const branchBySource = new Map(graph.branches.map((branch) => [branch.sourceNodeId, branch]));
  const decisionByBranch = new Map(decisions.map((decision) => [decision.branchId, decision]));
  const nodeIds: string[] = [];
  const decisionOutcomeIds: string[] = [];
  const visited = new Set<string>();
  let currentNodeId: string | undefined = graph.startNodeId;

  while (currentNodeId) {
    if (visited.has(currentNodeId)) {
      throw new Error(`Expedition graph path contains a cycle at ${currentNodeId}.`);
    }

    const node = nodeById.get(currentNodeId);
    if (!node) {
      throw new Error(`Expedition graph path references missing node ${currentNodeId}.`);
    }

    visited.add(currentNodeId);
    nodeIds.push(currentNodeId);

    const branch = branchBySource.get(currentNodeId);
    if (branch) {
      const decision = decisionByBranch.get(branch.id);
      const option =
        branch.options.find((candidate) => candidate.id === decision?.optionId) ??
        branch.options.find((candidate) => candidate.default);

      if (!option) {
        throw new Error(`Expedition branch ${branch.id} has no selectable option.`);
      }

      decisionOutcomeIds.push(option.outcomeId);
      currentNodeId = option.targetNodeId;
      continue;
    }

    if (node.nextNodeIds.length > 1) {
      throw new Error(`Expedition node ${node.id} has multiple exits without a branch.`);
    }

    currentNodeId = node.nextNodeIds[0];
  }

  return {
    nodeIds,
    decisionOutcomeIds,
    targetSeconds: sumNodeDuration(graph, nodeIds, 'targetSeconds')
  };
}

export function advanceExpeditionCompatibilityProgress(
  graph: ExpeditionGraph,
  progress: ExpeditionProgressState,
  completedSectorIndex: number
): ExpeditionProgressState {
  const sector = graph.sectors[completedSectorIndex];

  if (!sector) {
    return progress;
  }

  const nextSector = graph.sectors[completedSectorIndex + 1];
  return {
    ...progress,
    visitedNodeIds: uniqueStrings([
      ...progress.visitedNodeIds,
      ...sector.requiredNodeIds,
      ...(nextSector ? [nextSector.entryNodeId] : [])
    ])
  };
}

export function enterExpeditionCompatibilitySector(
  graph: ExpeditionGraph,
  progress: ExpeditionProgressState,
  sectorIndex: number
): ExpeditionProgressState {
  const sector = graph.sectors[Math.max(0, Math.floor(sectorIndex))];

  if (!sector) {
    return progress;
  }

  return {
    ...progress,
    visitedNodeIds: uniqueStrings([
      ...progress.visitedNodeIds,
      ...sector.requiredNodeIds.slice(0, 2)
    ])
  };
}

export function synchronizeExpeditionCompatibilityProgress(
  graph: ExpeditionGraph,
  progress: ExpeditionProgressState,
  currentSectorIndex: number
): ExpeditionProgressState {
  let next = progress;
  const safeSectorIndex = Math.min(
    graph.sectors.length - 1,
    Math.max(0, Math.floor(currentSectorIndex))
  );

  for (let index = 0; index < safeSectorIndex; index += 1) {
    next = advanceExpeditionCompatibilityProgress(graph, next, index);
  }

  const currentSector = graph.sectors[safeSectorIndex];
  return currentSector
    ? {
        ...next,
        visitedNodeIds: uniqueStrings([...next.visitedNodeIds, currentSector.entryNodeId])
      }
    : next;
}

export function createExpeditionPathReadModel(
  graph: ExpeditionGraph,
  progress: ExpeditionProgressState
): ExpeditionPathReadModel {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const visitedNodeIds = uniqueStrings(progress.visitedNodeIds).filter((id) => nodeById.has(id));
  const currentNodeId = visitedNodeIds.at(-1) ?? graph.startNodeId;
  const currentNode = nodeById.get(currentNodeId) ?? nodeById.get(graph.startNodeId);
  const visitedSectorCount = new Set(
    visitedNodeIds.map((id) => nodeById.get(id)?.sectorIndex).filter((value) => value !== undefined)
  ).size;
  const currentNodeLabel = currentNode?.label ?? 'Unknown expedition node';

  return {
    graphId: graph.id,
    currentNodeId,
    currentNodeLabel,
    visitedNodeIds,
    visitedNodeCount: visitedNodeIds.length,
    totalNodeCount: graph.nodes.length,
    visitedSectorCount,
    totalSectorCount: graph.sectors.length,
    decisionCount: progress.decisions.length,
    baselineTargetSeconds: graph.capacity.baselineTargetSeconds,
    expandedTargetSeconds: graph.capacity.expandedTargetSeconds,
    summary: `${currentNodeLabel} | nodes ${visitedNodeIds.length}/${graph.nodes.length} | sectors ${visitedSectorCount}/${graph.sectors.length} | decisions ${progress.decisions.length}`
  };
}

export function createExpeditionDebugState(
  graph: ExpeditionGraph,
  progress: ExpeditionProgressState
): ExpeditionDebugState {
  const model = createExpeditionPathReadModel(graph, progress);

  return {
    graphId: model.graphId,
    currentNodeId: model.currentNodeId,
    currentNodeLabel: model.currentNodeLabel,
    visitedNodes: model.visitedNodeCount,
    totalNodes: model.totalNodeCount,
    decisions: model.decisionCount,
    baselineMinutes: model.baselineTargetSeconds / 60,
    expandedMinutes: model.expandedTargetSeconds / 60
  };
}

export function formatExpeditionCapacity(capacity: ExpeditionCapacity): string {
  return `${formatMinutes(capacity.baselineTargetSeconds)} baseline / ${formatMinutes(
    capacity.expandedTargetSeconds
  )} with optional branches (${capacity.requiredNodeCount}+${capacity.optionalNodeCount} nodes)`;
}

export function summarizeExpeditionGraph(graph: ExpeditionGraph): unknown {
  return {
    id: graph.id,
    schemaVersion: graph.schemaVersion,
    saveFingerprint: graph.saveFingerprint,
    startNodeId: graph.startNodeId,
    terminalNodeIds: graph.terminalNodeIds,
    capacity: graph.capacity,
    acts: graph.acts.map((act) => ({
      id: act.actId,
      sectors: act.sectorPlanIds,
      entryNodeId: act.entryNodeId,
      exitNodeIds: act.exitNodeIds
    })),
    sectors: graph.sectors.map((sector) => ({
      id: sector.id,
      sectorId: sector.sectorId,
      actId: sector.actId,
      requiredNodeIds: sector.requiredNodeIds,
      optionalNodeIds: sector.optionalNodeIds,
      branchIds: sector.branchIds
    })),
    nodes: graph.nodes.map((node) => ({
      id: node.id,
      profileId: node.profileId,
      kind: node.kind,
      pressureBand: node.pressureBand,
      duration: node.duration,
      optional: node.optional,
      nextNodeIds: node.nextNodeIds,
      rewardHooks: node.rewardHooks,
      content: node.content
    })),
    branches: graph.branches
  };
}

function createNode(options: {
  readonly id: string;
  readonly profileId: string;
  readonly label: string;
  readonly sectorPlanId: string;
  readonly sectorIndex: number;
  readonly actId: ActId;
  readonly optional: boolean;
  readonly nextNodeIds: readonly string[];
  readonly rewardHooks: readonly ExpeditionRewardHook[];
  readonly content: ExpeditionNodeContentReferences;
  readonly entryRule?: ExpeditionEntryRule;
  readonly transitionPolicy?: ExpeditionTransitionPolicy;
}): ExpeditionEncounterNode {
  const profile = getExpeditionNodeProfile(options.profileId);

  return {
    id: options.id,
    profileId: options.profileId,
    label: options.label,
    sectorPlanId: options.sectorPlanId,
    sectorIndex: options.sectorIndex,
    actId: options.actId,
    kind: profile.nodeKind,
    pressureBand: profile.pressureBand,
    duration: profile.duration,
    entryRule: options.entryRule ?? profile.entryRule,
    completionRule: profile.completionRule,
    transitionPolicy: options.transitionPolicy ?? profile.transitionPolicy,
    optional: options.optional,
    nextNodeIds: options.nextNodeIds,
    rewardHooks: options.rewardHooks,
    content: options.content
  };
}

function createMissionLeg(
  sectorPlanId: string,
  kind: ExpeditionLegKind,
  label: string,
  optional: boolean,
  nodeIds: readonly string[]
): ExpeditionMissionLeg {
  const entryNodeId = nodeIds[0];
  const exitNodeId = nodeIds.at(-1);

  if (!entryNodeId || !exitNodeId) {
    throw new Error(`Expedition mission leg ${sectorPlanId}/${kind} requires nodes.`);
  }

  return {
    id: `${sectorPlanId}_leg_${kind}`,
    sectorPlanId,
    kind,
    label,
    optional,
    entryNodeId,
    exitNodeIds: [exitNodeId],
    nodeIds
  };
}

function createContentReferences(
  sector: ExpeditionGraphSourceSector,
  opportunityId: string | null
): ExpeditionNodeContentReferences {
  return {
    sectorId: sector.sectorId,
    objectiveKind: sector.objective.kind,
    majorWaveIds: sector.majorWaves,
    bossId: sector.objective.bossRequired ? sector.bossId : null,
    routeKinds: sector.routeOptions.map((route) => route.kind),
    rewardPoolSeed: sector.rewardPoolSeed,
    shopSeed: sector.shopSeed,
    opportunityId,
    finaleVariantId: sector.finale?.variantId ?? null
  };
}

function createGateRewardHooks(
  sector: ExpeditionGraphSourceSector,
  isActExit: boolean,
  isFinale: boolean
): ExpeditionRewardHook[] {
  return uniqueStrings([
    'routeChoice',
    'sectorReward',
    ...(sector.routeOptions.some((route) => route.kind === 'shop') ? ['shopAccess'] : []),
    ...(sector.objective.bossRequired ? ['bossSalvage'] : []),
    ...(isActExit && !isFinale ? ['interActRefit'] : []),
    ...(isFinale ? ['finaleReward'] : [])
  ]) as ExpeditionRewardHook[];
}

function createExpeditionCapacity(graph: Omit<ExpeditionGraph, 'capacity'>): ExpeditionCapacity {
  const baseline = resolveExpeditionPath({ ...graph, capacity: createEmptyCapacity() }, []);
  const optionalNodeIds = graph.nodes.filter((node) => node.optional).map((node) => node.id);

  return {
    requiredNodeCount: baseline.nodeIds.length,
    optionalNodeCount: optionalNodeIds.length,
    baselineMinSeconds: sumNodeDuration(graph, baseline.nodeIds, 'minSeconds'),
    baselineTargetSeconds: baseline.targetSeconds,
    baselineMaxSeconds: sumNodeDuration(graph, baseline.nodeIds, 'maxSeconds'),
    expandedTargetSeconds:
      baseline.targetSeconds + sumNodeDuration(graph, optionalNodeIds, 'targetSeconds')
  };
}

function createEmptyCapacity(): ExpeditionCapacity {
  return {
    requiredNodeCount: 0,
    optionalNodeCount: 0,
    baselineMinSeconds: 0,
    baselineTargetSeconds: 0,
    baselineMaxSeconds: 0,
    expandedTargetSeconds: 0
  };
}

function sumNodeDuration(
  graph: Pick<ExpeditionGraph, 'nodes'>,
  nodeIds: readonly string[],
  field: keyof ExpeditionDurationBand
): number {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  return nodeIds.reduce((total, nodeId) => total + (nodeById.get(nodeId)?.duration[field] ?? 0), 0);
}

function createSectorPlanId(sectorNumber: number): string {
  return `expedition_sector_${padSector(sectorNumber)}`;
}

function createNodeId(sectorNumber: number, suffix: string): string {
  return `expedition_s${padSector(sectorNumber)}_${suffix}`;
}

function padSector(sectorNumber: number): string {
  return Math.max(0, Math.floor(sectorNumber)).toString().padStart(2, '0');
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function formatMinutes(seconds: number): string {
  const minutes = seconds / 60;
  return `${minutes.toFixed(minutes >= 10 ? 0 : 1)}m`;
}
