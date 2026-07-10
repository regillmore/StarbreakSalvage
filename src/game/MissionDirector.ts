import {
  getMissionStageProfile,
  type MissionCarryPolicy,
  type MissionStageKind,
  type MissionWorldSetup
} from '../content/missions';
import type { SectorRoute } from './Generation';
import type {
  ExpeditionBranch,
  ExpeditionBranchOption,
  ExpeditionGraph,
  ExpeditionProgressState
} from './ExpeditionTypes';

export type MissionScheduleMode = 'expedition' | 'singleStageCompatibility';
export type MissionStatus = 'active' | 'suspended' | 'failed' | 'completed';

export interface MissionStageDefinition {
  readonly id: string;
  readonly profileId: string;
  readonly kind: MissionStageKind;
  readonly label: string;
  readonly nodeId: string | null;
  readonly optional: boolean;
  readonly carry: MissionCarryPolicy;
  readonly world: MissionWorldSetup | null;
}

export interface MissionSchedule {
  readonly id: string;
  readonly graphId: string;
  readonly mode: MissionScheduleMode;
  readonly sectorIndex: number;
  readonly sectorPlanId: string;
  readonly label: string;
  readonly startStageId: string;
  readonly operationStageId: string;
  readonly optionalStageId: string | null;
  readonly branchStageId: string | null;
  readonly reliefStageId: string | null;
  readonly extractionStageId: string | null;
  readonly failureStageId: string;
  readonly completionStageId: string;
  readonly branch: ExpeditionBranch | null;
  readonly branchConditions: Readonly<Record<string, MissionBranchCondition>>;
  readonly stages: readonly MissionStageDefinition[];
}

export type MissionBranchCondition =
  | { readonly kind: 'always' }
  | { readonly kind: 'checkpointHullAtLeast'; readonly minimumHull: number };

export interface MissionCheckpoint {
  readonly hull: number | null;
  readonly scrollDistance: number;
  readonly worldOffset: number;
  readonly credits: number;
  readonly salvage: number;
}

export interface MissionTransitionRecord {
  readonly eventId: string;
  readonly eventType: MissionEvent['type'];
  readonly fromStageId: string;
  readonly toStageId: string;
}

export interface MissionDirectorState {
  readonly scheduleId: string;
  readonly sectorIndex: number;
  readonly status: MissionStatus;
  readonly currentStageId: string;
  readonly suspendedStageId: string | null;
  readonly selectedBranchOptionId: string | null;
  readonly visitedStageIds: readonly string[];
  readonly processedEventIds: readonly string[];
  readonly transitions: readonly MissionTransitionRecord[];
  readonly checkpoint: MissionCheckpoint;
  readonly failureReason: string | null;
}

interface MissionEventBase {
  readonly id: string;
}

export type MissionEvent =
  | (MissionEventBase & { readonly type: 'confirmBriefing' })
  | (MissionEventBase & { readonly type: 'completeEntry' })
  | (MissionEventBase & {
      readonly type: 'completeCombat';
      readonly checkpoint: MissionCheckpoint;
    })
  | (MissionEventBase & {
      readonly type: 'selectBranch';
      readonly optionId: string;
    })
  | (MissionEventBase & { readonly type: 'completeRelief' })
  | (MissionEventBase & { readonly type: 'completeExtraction' })
  | (MissionEventBase & { readonly type: 'suspend' })
  | (MissionEventBase & { readonly type: 'resume' })
  | (MissionEventBase & { readonly type: 'fail'; readonly reason: string });

export interface MissionTransitionResult {
  readonly state: MissionDirectorState;
  readonly disposition: 'advanced' | 'duplicate' | 'rejected';
  readonly reason: string | null;
}

export interface MissionReadModel {
  readonly scheduleId: string;
  readonly status: MissionStatus;
  readonly stageId: string;
  readonly stageKind: MissionStageKind;
  readonly stageLabel: string;
  readonly nodeId: string | null;
  readonly stageNumber: number;
  readonly stageCount: number;
  readonly optional: boolean;
  readonly transitionCount: number;
  readonly summary: string;
}

export interface MissionDebugState {
  readonly scheduleId: string;
  readonly status: MissionStatus;
  readonly stage: string;
  readonly kind: MissionStageKind;
  readonly nodeId: string | null;
  readonly transitions: number;
  readonly branchOptionId: string | null;
  readonly checkpointHull: number | null;
  readonly checkpointWorldOffset: number;
}

export interface MissionCombatProjection {
  readonly stageId: string;
  readonly stageLabel: string;
  readonly nodeId: string | null;
  readonly sector: SectorRoute;
  readonly combatSeedSuffix: string;
  readonly startingHull: number | null;
  readonly completionReason: 'sectorComplete';
}

export function createMissionSchedule(
  graph: ExpeditionGraph,
  sectorIndex: number
): MissionSchedule {
  const sectorPlan = graph.sectors[sectorIndex];

  if (!sectorPlan) {
    throw new Error(`Cannot create mission schedule for sector ${sectorIndex}.`);
  }

  const nodes = sectorPlan.nodeIds.map((id) => getGraphNode(graph, id));
  const ingress = nodes.find((node) => node.kind === 'approach');
  const operation = nodes.find((node) => node.kind === 'operation');
  const opportunity = nodes.find((node) => node.kind === 'opportunity');
  const gate = nodes.find(
    (node) => node.kind === 'extraction' || node.kind === 'checkpoint' || node.kind === 'finale'
  );
  const branch = graph.branches.find((candidate) => candidate.sectorPlanId === sectorPlan.id);

  if (!ingress || !operation || !gate || !branch) {
    throw new Error(`Expedition sector ${sectorPlan.id} cannot produce a complete mission.`);
  }

  const prefix = `mission_s${String(sectorIndex + 1).padStart(2, '0')}`;
  const stages = [
    createStage(
      prefix,
      'briefing',
      'mission_briefing',
      `${sectorPlan.sectorName} briefing`,
      ingress.id
    ),
    createStage(prefix, 'entry', 'mission_entry', `${sectorPlan.sectorName} entry`, ingress.id),
    createStage(prefix, 'operation', 'mission_operation', operation.label, operation.id),
    createStage(prefix, 'branch', 'mission_branch', branch.label, operation.id),
    ...(opportunity
      ? [
          createStage(
            prefix,
            'optional',
            'mission_optional_operation',
            opportunity.label,
            opportunity.id,
            true
          )
        ]
      : []),
    createStage(prefix, 'relief', 'mission_relief', `${sectorPlan.sectorName} relief`, gate.id),
    createStage(prefix, 'extraction', 'mission_extraction', gate.label, gate.id),
    createStage(prefix, 'failure', 'mission_failure', `${sectorPlan.sectorName} failed`, gate.id),
    createStage(
      prefix,
      'completion',
      'mission_completion',
      `${sectorPlan.sectorName} complete`,
      gate.id
    )
  ];

  return {
    id: `${graph.id}:${sectorPlan.id}:mission-v1`,
    graphId: graph.id,
    mode: 'expedition',
    sectorIndex,
    sectorPlanId: sectorPlan.id,
    label: `${sectorPlan.sectorName} mission`,
    startStageId: `${prefix}:briefing`,
    operationStageId: `${prefix}:operation`,
    optionalStageId: opportunity ? `${prefix}:optional` : null,
    branchStageId: `${prefix}:branch`,
    reliefStageId: `${prefix}:relief`,
    extractionStageId: `${prefix}:extraction`,
    failureStageId: `${prefix}:failure`,
    completionStageId: `${prefix}:completion`,
    branch,
    branchConditions: Object.fromEntries(
      branch.options.map((option) => [
        option.id,
        option.default
          ? ({ kind: 'always' } as const)
          : ({ kind: 'checkpointHullAtLeast', minimumHull: 1 } as const)
      ])
    ),
    stages
  };
}

export function createSingleStageCompatibilityMissionSchedule(options: {
  readonly graphId: string;
  readonly sectorIndex: number;
  readonly sectorPlanId: string;
  readonly nodeId: string;
  readonly label: string;
}): MissionSchedule {
  const prefix = `compatibility_s${String(options.sectorIndex + 1).padStart(2, '0')}`;
  const operation = createStage(
    prefix,
    'operation',
    'mission_operation',
    options.label,
    options.nodeId
  );
  const failure = createStage(
    prefix,
    'failure',
    'mission_failure',
    `${options.label} failed`,
    options.nodeId
  );
  const completion = createStage(
    prefix,
    'completion',
    'mission_completion',
    `${options.label} complete`,
    options.nodeId
  );

  return {
    id: `${options.graphId}:${options.sectorPlanId}:compatibility-v1`,
    graphId: options.graphId,
    mode: 'singleStageCompatibility',
    sectorIndex: options.sectorIndex,
    sectorPlanId: options.sectorPlanId,
    label: options.label,
    startStageId: operation.id,
    operationStageId: operation.id,
    optionalStageId: null,
    branchStageId: null,
    reliefStageId: null,
    extractionStageId: null,
    failureStageId: failure.id,
    completionStageId: completion.id,
    branch: null,
    branchConditions: {},
    stages: [operation, failure, completion]
  };
}

export function createMissionDirectorState(
  schedule: MissionSchedule,
  resources: { readonly credits?: number; readonly salvage?: number } = {}
): MissionDirectorState {
  return {
    scheduleId: schedule.id,
    sectorIndex: schedule.sectorIndex,
    status: 'active',
    currentStageId: schedule.startStageId,
    suspendedStageId: null,
    selectedBranchOptionId: null,
    visitedStageIds: [schedule.startStageId],
    processedEventIds: [],
    transitions: [],
    checkpoint: {
      hull: null,
      scrollDistance: 0,
      worldOffset: 0,
      credits: Math.max(0, resources.credits ?? 0),
      salvage: Math.max(0, resources.salvage ?? 0)
    },
    failureReason: null
  };
}

export function transitionMission(
  schedule: MissionSchedule,
  state: MissionDirectorState,
  event: MissionEvent
): MissionTransitionResult {
  if (state.scheduleId !== schedule.id) {
    return reject(state, 'Mission state belongs to a different schedule.');
  }

  if (state.processedEventIds.includes(event.id)) {
    return { state, disposition: 'duplicate', reason: null };
  }

  const current = getMissionStage(schedule, state.currentStageId);

  if (event.type === 'fail') {
    if (state.status === 'failed' || state.status === 'completed') {
      return reject(state, 'A terminal mission cannot fail again.');
    }

    return advance(schedule, state, event, schedule.failureStageId, {
      status: 'failed',
      failureReason: event.reason,
      suspendedStageId: null
    });
  }

  if (event.type === 'suspend') {
    if (state.status !== 'active') {
      return reject(state, 'Only an active mission can suspend.');
    }

    return advance(schedule, state, event, current.id, {
      status: 'suspended',
      suspendedStageId: current.id
    });
  }

  if (event.type === 'resume') {
    if (state.status !== 'suspended' || !state.suspendedStageId) {
      return reject(state, 'Only a suspended mission can resume.');
    }

    return advance(schedule, state, event, state.suspendedStageId, {
      status: 'active',
      suspendedStageId: null
    });
  }

  if (state.status !== 'active') {
    return reject(state, `Mission is ${state.status}.`);
  }

  if (event.type === 'confirmBriefing' && current.kind === 'briefing') {
    return advance(schedule, state, event, requireStageId(schedule, 'entry'));
  }

  if (event.type === 'completeEntry' && current.kind === 'entry') {
    return advance(schedule, state, event, schedule.operationStageId);
  }

  if (event.type === 'completeCombat' && current.kind === 'combat') {
    const nextStageId =
      schedule.mode === 'singleStageCompatibility'
        ? schedule.completionStageId
        : current.id === schedule.optionalStageId
          ? requireStageId(schedule, 'relief')
          : requireStageId(schedule, 'branch');
    return advance(schedule, state, event, nextStageId, {
      status: schedule.mode === 'singleStageCompatibility' ? 'completed' : state.status,
      checkpoint: sanitizeCheckpoint(event.checkpoint)
    });
  }

  if (event.type === 'selectBranch' && current.kind === 'branch') {
    const option = getBranchOption(schedule, event.optionId);

    if (!option) {
      return reject(state, `Unknown mission branch option ${event.optionId}.`);
    }

    if (!isMissionBranchOptionAvailable(schedule, state, option.id)) {
      return reject(state, `Mission branch option ${event.optionId} is not currently available.`);
    }

    const nextStageId =
      schedule.optionalStageId &&
      getMissionStage(schedule, schedule.optionalStageId).nodeId === option.targetNodeId
        ? schedule.optionalStageId
        : requireStageId(schedule, 'relief');
    return advance(schedule, state, event, nextStageId, {
      selectedBranchOptionId: option.id
    });
  }

  if (event.type === 'completeRelief' && current.kind === 'relief') {
    return advance(schedule, state, event, requireStageId(schedule, 'extraction'));
  }

  if (event.type === 'completeExtraction' && current.kind === 'extraction') {
    return advance(schedule, state, event, schedule.completionStageId, {
      status: 'completed'
    });
  }

  return reject(state, `Event ${event.type} is invalid during ${current.kind}.`);
}

export function getMissionStage(
  schedule: MissionSchedule,
  stageId: string
): MissionStageDefinition {
  const stage = schedule.stages.find((candidate) => candidate.id === stageId);

  if (!stage) {
    throw new Error(`Mission schedule ${schedule.id} has no stage ${stageId}.`);
  }

  return stage;
}

export function getMissionBranchOptions(
  schedule: MissionSchedule,
  state?: MissionDirectorState
): readonly ExpeditionBranchOption[] {
  const options = schedule.branch?.options ?? [];
  return state
    ? options.filter((option) => isMissionBranchOptionAvailable(schedule, state, option.id))
    : options;
}

export function isMissionBranchOptionAvailable(
  schedule: MissionSchedule,
  state: MissionDirectorState,
  optionId: string
): boolean {
  const condition = schedule.branchConditions[optionId];

  if (!condition) {
    return false;
  }

  if (condition.kind === 'always') {
    return true;
  }

  return (state.checkpoint.hull ?? 0) >= condition.minimumHull;
}

export function createMissionReadModel(
  schedule: MissionSchedule,
  state: MissionDirectorState
): MissionReadModel {
  const stage = getMissionStage(schedule, state.currentStageId);
  const playableStages = schedule.stages.filter(
    (candidate) => candidate.kind !== 'failure' && candidate.kind !== 'completion'
  );
  const stageNumber = Math.max(
    1,
    playableStages.findIndex((candidate) => candidate.id === stage.id) + 1
  );
  const stageCount = playableStages.length;

  return {
    scheduleId: schedule.id,
    status: state.status,
    stageId: stage.id,
    stageKind: stage.kind,
    stageLabel: stage.label,
    nodeId: stage.nodeId,
    stageNumber,
    stageCount,
    optional: stage.optional,
    transitionCount: state.transitions.length,
    summary: `${stage.label} | ${state.status} | stage ${stageNumber}/${stageCount}`
  };
}

export function createMissionDebugState(
  schedule: MissionSchedule,
  state: MissionDirectorState
): MissionDebugState {
  const readModel = createMissionReadModel(schedule, state);
  return {
    scheduleId: schedule.id,
    status: state.status,
    stage: readModel.stageLabel,
    kind: readModel.stageKind,
    nodeId: readModel.nodeId,
    transitions: state.transitions.length,
    branchOptionId: state.selectedBranchOptionId,
    checkpointHull: state.checkpoint.hull,
    checkpointWorldOffset: state.checkpoint.worldOffset
  };
}

export function formatMissionTimeline(
  schedule: MissionSchedule,
  state: MissionDirectorState
): string {
  const labels = state.visitedStageIds.map((id) => getMissionStage(schedule, id).label);
  return `${labels.join(' > ')} | ${state.status}${
    state.failureReason ? ` (${state.failureReason})` : ''
  }`;
}

export function synchronizeExpeditionProgressWithMission(
  progress: ExpeditionProgressState,
  schedule: MissionSchedule,
  state: MissionDirectorState
): ExpeditionProgressState {
  const visitedNodeIds = state.visitedStageIds
    .map((stageId) => getMissionStage(schedule, stageId).nodeId)
    .filter((nodeId): nodeId is string => nodeId !== null);

  return {
    ...progress,
    visitedNodeIds: [...new Set([...progress.visitedNodeIds, ...visitedNodeIds])]
  };
}

export function createMissionCombatProjection(
  schedule: MissionSchedule,
  state: MissionDirectorState,
  sector: SectorRoute
): MissionCombatProjection {
  const stage = getMissionStage(schedule, state.currentStageId);

  if (stage.kind !== 'combat' || !stage.world) {
    throw new Error(`Mission stage ${stage.id} is not a combat stage.`);
  }

  const projectedSector = stage.optional ? projectOptionalSector(sector, stage, state) : sector;

  return {
    stageId: stage.id,
    stageLabel: stage.label,
    nodeId: stage.nodeId,
    sector: projectedSector,
    combatSeedSuffix: `${stage.world.seedNamespace}:${stage.id}`,
    startingHull: stage.carry.hull === 'carry' ? state.checkpoint.hull : null,
    completionReason: 'sectorComplete'
  };
}

function projectOptionalSector(
  sector: SectorRoute,
  stage: MissionStageDefinition,
  state: MissionDirectorState
): SectorRoute {
  const world = stage.world;

  if (!world) {
    return sector;
  }

  const requiredWaves = Math.max(
    1,
    Math.min(
      sector.majorWaves.length,
      Math.ceil(sector.objective.requiredWaves * world.waveCountScale)
    )
  );
  const majorWaves = sector.majorWaves.slice(0, requiredWaves);
  const scrollLength = Math.max(640, Math.round(sector.scroll.length * world.scrollLengthScale));
  const continuedOffset = Math.max(
    sector.scroll.startOffset + sector.scroll.length,
    state.checkpoint.worldOffset
  );

  return {
    ...sector,
    sectorName: stage.label,
    majorWaves,
    objective: {
      ...sector.objective,
      label: `${stage.label}: clear the diversion lane`,
      requiredWaves,
      requiredEnemyKills: requiredWaves * sector.objective.spawnsPerWave,
      bossRequired: world.bossPolicy === 'inherit' && sector.objective.bossRequired,
      bossSpawnAtSeconds: null,
      variantId: 'standardSweep',
      variantLabel: 'Optional diversion',
      variantSummary: 'A compact deterministic encounter carried from the operation checkpoint.',
      pressureBand: 'volatile',
      travelGateRatio: 1
    },
    scroll: {
      ...sector.scroll,
      length: scrollLength,
      startOffset: continuedOffset
    },
    arena: null,
    finale: null
  };
}

function createStage(
  prefix: string,
  token: string,
  profileId: string,
  label: string,
  nodeId: string,
  optional = false
): MissionStageDefinition {
  const profile = getMissionStageProfile(profileId);
  return {
    id: `${prefix}:${token}`,
    profileId,
    kind: profile.kind,
    label,
    nodeId,
    optional,
    carry: profile.carry,
    world: profile.world
  };
}

function getGraphNode(graph: ExpeditionGraph, nodeId: string) {
  const node = graph.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) {
    throw new Error(`Expedition graph ${graph.id} has no node ${nodeId}.`);
  }
  return node;
}

function getBranchOption(
  schedule: MissionSchedule,
  optionId: string
): ExpeditionBranchOption | null {
  return schedule.branch?.options.find((candidate) => candidate.id === optionId) ?? null;
}

function requireStageId(schedule: MissionSchedule, token: string): string {
  const stage = schedule.stages.find((candidate) => candidate.id.endsWith(`:${token}`));
  if (!stage) {
    throw new Error(`Mission schedule ${schedule.id} is missing ${token}.`);
  }
  return stage.id;
}

function sanitizeCheckpoint(checkpoint: MissionCheckpoint): MissionCheckpoint {
  return {
    hull: checkpoint.hull === null ? null : Math.max(0, checkpoint.hull),
    scrollDistance: Math.max(0, checkpoint.scrollDistance),
    worldOffset: Math.max(0, checkpoint.worldOffset),
    credits: Math.max(0, checkpoint.credits),
    salvage: Math.max(0, checkpoint.salvage)
  };
}

function advance(
  schedule: MissionSchedule,
  state: MissionDirectorState,
  event: MissionEvent,
  toStageId: string,
  patch: Partial<MissionDirectorState> = {}
): MissionTransitionResult {
  getMissionStage(schedule, toStageId);
  const transition: MissionTransitionRecord = {
    eventId: event.id,
    eventType: event.type,
    fromStageId: state.currentStageId,
    toStageId
  };
  return {
    disposition: 'advanced',
    reason: null,
    state: {
      ...state,
      ...patch,
      currentStageId: toStageId,
      visitedStageIds: [...new Set([...state.visitedStageIds, toStageId])],
      processedEventIds: [...state.processedEventIds, event.id],
      transitions: [...state.transitions, transition]
    }
  };
}

function reject(state: MissionDirectorState, reason: string): MissionTransitionResult {
  return { state, disposition: 'rejected', reason };
}
