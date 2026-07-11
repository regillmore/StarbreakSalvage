import {
  getMissionStageProfile,
  type MissionCarryPolicy,
  type MissionStageKind,
  type MissionWorldSetup
} from '../content/missions';
import {
  MISSION_CONTRACTS,
  getMissionObjective,
  type MissionContractDefinition,
  type MissionObjectiveWorldDefinition
} from '../content/objectives';
import type { ActId } from '../content/acts';
import type { SectorRoute } from './Generation';
import {
  createMissionObjectivePlan,
  formatMissionObjectiveBrief,
  type MissionObjectivePlan,
  type MissionObjectiveResultSnapshot
} from './ObjectiveDirector';
import type {
  ExpeditionBranch,
  ExpeditionBranchOption,
  ExpeditionEncounterNode,
  ExpeditionGraph,
  ExpeditionOperationalRole,
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
  readonly objectiveId: string | null;
  readonly operationalRole: ExpeditionOperationalRole | null;
  readonly branchId: string | null;
  readonly nextStageId: string | null;
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
  readonly operationStageIds: readonly string[];
  readonly optionalStageId: string | null;
  readonly optionalStageIds: readonly string[];
  readonly branchStageId: string | null;
  readonly branchStageIds: readonly string[];
  readonly reliefStageId: string | null;
  readonly reliefStageIds: readonly string[];
  readonly extractionStageId: string | null;
  readonly failureStageId: string;
  readonly completionStageId: string;
  readonly branch: ExpeditionBranch | null;
  readonly branches: readonly ExpeditionBranch[];
  readonly branchConditions: Readonly<Record<string, MissionBranchCondition>>;
  readonly contract: MissionContractDefinition | null;
  readonly stages: readonly MissionStageDefinition[];
}

export type MissionBranchCondition =
  | { readonly kind: 'always' }
  | {
      readonly kind: 'checkpointAndOutcome';
      readonly minimumHull: number;
      readonly acceptedOutcomes: readonly MissionObjectiveResultSnapshot['outcome'][];
    };

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
  readonly selectedBranchOptionIds: readonly string[];
  readonly visitedStageIds: readonly string[];
  readonly processedEventIds: readonly string[];
  readonly transitions: readonly MissionTransitionRecord[];
  readonly checkpoint: MissionCheckpoint;
  readonly failureReason: string | null;
  readonly objectiveOutcomes: readonly MissionObjectiveResultSnapshot[];
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
      readonly objectiveOutcome?: MissionObjectiveResultSnapshot;
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
  readonly contractId: string | null;
  readonly contractTitle: string;
  readonly contractSummary: string;
  readonly objectiveId: string | null;
  readonly objectiveVerb: string | null;
  readonly objectiveBrief: string;
  readonly reliefCopy: string;
  readonly latestOutcome: MissionObjectiveResultSnapshot['outcome'] | null;
  readonly operationalRole: ExpeditionOperationalRole | null;
  readonly operationNumber: number;
  readonly operationCount: number;
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
  readonly contractId: string | null;
  readonly objectiveId: string | null;
  readonly objectiveVerb: string | null;
  readonly objectiveOutcome: MissionObjectiveResultSnapshot['outcome'] | null;
}

export interface MissionCombatProjection {
  readonly stageId: string;
  readonly stageLabel: string;
  readonly nodeId: string | null;
  readonly sector: SectorRoute;
  readonly combatSeedSuffix: string;
  readonly startingHull: number | null;
  readonly completionReason: 'sectorComplete';
  readonly missionObjective: MissionObjectivePlan | null;
  readonly objectiveWorld: MissionObjectiveWorldDefinition | null;
  readonly operationalRole: ExpeditionOperationalRole | null;
  readonly influenceLabel: string | null;
}

export interface MissionOperationalInfluence {
  readonly scrollLengthScale: number;
  readonly waveCountScale: number;
  readonly label: string;
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
  const nodeByRole = new Map(nodes.map((node) => [node.operationalRole, node]));
  const ingress = nodeByRole.get('ingress');
  const advance = nodeByRole.get('advance');
  const detour = nodeByRole.get('detour');
  const staging = nodeByRole.get('staging');
  const gateOperation = nodeByRole.get('gate');
  const pursuit = nodeByRole.get('pursuit');
  const extraction = nodeByRole.get('extraction');
  const branches = graph.branches.filter((candidate) => candidate.sectorPlanId === sectorPlan.id);

  if (
    !ingress ||
    !advance ||
    !detour ||
    !staging ||
    !gateOperation ||
    !pursuit ||
    !extraction ||
    branches.length !== 2
  ) {
    throw new Error(`Expedition sector ${sectorPlan.id} cannot produce a complete mission.`);
  }

  const contract = selectMissionContract(graph, sectorIndex, sectorPlan.actId);
  const primaryObjective = getMissionObjective(contract.primaryObjectiveId);
  const optionalObjective = getMissionObjective(contract.optionalObjectiveId);
  const authoredBranches = branches.map((branch, branchIndex): ExpeditionBranch => ({
    ...branch,
    label:
      branchIndex === 0
        ? `${contract.title} approach decision`
        : `${contract.title} extraction decision`,
    options: branch.options.map((option) =>
      option.default
        ? option
        : {
            ...option,
            summary: `High-risk optional: ${optionalObjective.summary} ${option.summary}`
          }
    )
  }));
  const approachBranch = authoredBranches.find((branch) => branch.sourceNodeId === advance.id)!;
  const pursuitBranch = authoredBranches.find(
    (branch) => branch.sourceNodeId === gateOperation.id
  )!;

  const prefix = `mission_s${String(sectorIndex + 1).padStart(2, '0')}`;
  const ids = {
    briefing: `${prefix}:briefing`,
    entry: `${prefix}:entry`,
    advance: `${prefix}:advance`,
    approachBranch: `${prefix}:approach-map`,
    detour: `${prefix}:optional-detour`,
    staging: `${prefix}:staging`,
    gate: `${prefix}:gate`,
    pursuitBranch: `${prefix}:pursuit-map`,
    pursuit: `${prefix}:optional-pursuit`,
    relief: `${prefix}:relief`,
    extraction: `${prefix}:extraction`,
    failure: `${prefix}:failure`,
    completion: `${prefix}:completion`
  };
  const stages = [
    createStage(prefix, 'briefing', 'mission_briefing', `${contract.title} briefing`, ingress, {
      nextStageId: ids.entry
    }),
    createStage(prefix, 'entry', 'mission_entry', `${sectorPlan.sectorName} entry`, ingress, {
      nextStageId: ids.advance
    }),
    createStage(
      prefix,
      'advance',
      'mission_operation_advance',
      `${primaryObjective.label}: advance`,
      advance,
      { objectiveId: primaryObjective.id, nextStageId: ids.approachBranch }
    ),
    createStage(prefix, 'approach-map', 'mission_branch', approachBranch.label, advance, {
      branchId: approachBranch.id
    }),
    createStage(prefix, 'optional-detour', 'mission_detour_operation', detour.label, detour, {
      optional: true,
      objectiveId: optionalObjective.id,
      nextStageId: ids.staging
    }),
    createStage(prefix, 'staging', 'mission_relief', staging.label, staging, {
      nextStageId: ids.gate
    }),
    createStage(
      prefix,
      'gate',
      'mission_operation_gate',
      `${primaryObjective.label}: required gate`,
      gateOperation,
      { objectiveId: primaryObjective.id, nextStageId: ids.pursuitBranch }
    ),
    createStage(prefix, 'pursuit-map', 'mission_branch', pursuitBranch.label, gateOperation, {
      branchId: pursuitBranch.id
    }),
    createStage(prefix, 'optional-pursuit', 'mission_pursuit_operation', pursuit.label, pursuit, {
      optional: true,
      objectiveId: optionalObjective.id,
      nextStageId: ids.relief
    }),
    createStage(prefix, 'relief', 'mission_relief', `${sectorPlan.sectorName} relief`, extraction, {
      nextStageId: ids.extraction
    }),
    createStage(prefix, 'extraction', 'mission_extraction', extraction.label, extraction, {
      nextStageId: ids.completion
    }),
    createStage(
      prefix,
      'failure',
      'mission_failure',
      `${sectorPlan.sectorName} failed`,
      extraction
    ),
    createStage(
      prefix,
      'completion',
      'mission_completion',
      `${sectorPlan.sectorName} complete`,
      extraction
    )
  ];
  const operationStageIds = [ids.advance, ids.detour, ids.gate, ids.pursuit];
  const optionalStageIds = [ids.detour, ids.pursuit];
  const branchStageIds = [ids.approachBranch, ids.pursuitBranch];
  const reliefStageIds = [ids.staging, ids.relief];

  return {
    id: `${graph.id}:${sectorPlan.id}:mission-v2`,
    graphId: graph.id,
    mode: 'expedition',
    sectorIndex,
    sectorPlanId: sectorPlan.id,
    label: `${sectorPlan.sectorName} mission`,
    startStageId: ids.briefing,
    operationStageId: ids.advance,
    operationStageIds,
    optionalStageId: ids.detour,
    optionalStageIds,
    branchStageId: ids.approachBranch,
    branchStageIds,
    reliefStageId: ids.staging,
    reliefStageIds,
    extractionStageId: ids.extraction,
    failureStageId: ids.failure,
    completionStageId: ids.completion,
    branch: approachBranch,
    branches: authoredBranches,
    branchConditions: Object.fromEntries(
      authoredBranches
        .flatMap((branch) => branch.options)
        .map((option) => [
          option.id,
          option.default
            ? ({ kind: 'always' } as const)
            : ({
                kind: 'checkpointAndOutcome',
                minimumHull: 1,
                acceptedOutcomes:
                  contract.branchPolicy === 'afterSuccess'
                    ? (['success'] as const)
                    : (['success', 'partialSuccess'] as const)
              } as const)
        ])
    ),
    contract,
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
    operationStageIds: [operation.id],
    optionalStageId: null,
    optionalStageIds: [],
    branchStageId: null,
    branchStageIds: [],
    reliefStageId: null,
    reliefStageIds: [],
    extractionStageId: null,
    failureStageId: failure.id,
    completionStageId: completion.id,
    branch: null,
    branches: [],
    branchConditions: {},
    contract: null,
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
    selectedBranchOptionIds: [],
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
    failureReason: null,
    objectiveOutcomes: []
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
    return advance(
      schedule,
      state,
      event,
      current.nextStageId ?? requireStageId(schedule, 'entry')
    );
  }

  if (event.type === 'completeEntry' && current.kind === 'entry') {
    return advance(schedule, state, event, current.nextStageId ?? schedule.operationStageId);
  }

  if (event.type === 'completeCombat' && current.kind === 'combat') {
    const objectiveOutcome = event.objectiveOutcome?.outcome ?? 'success';
    const outcomeExit = schedule.contract?.outcomeExits[objectiveOutcome] ?? 'branch';
    const nextStageId =
      schedule.mode === 'singleStageCompatibility'
        ? schedule.completionStageId
        : outcomeExit === 'failure'
          ? schedule.failureStageId
          : outcomeExit === 'relief'
            ? getNextStageByKind(schedule, current.id, 'relief')
            : (current.nextStageId ?? schedule.failureStageId);
    return advance(schedule, state, event, nextStageId, {
      status:
        schedule.mode === 'singleStageCompatibility'
          ? 'completed'
          : outcomeExit === 'failure'
            ? 'failed'
            : state.status,
      checkpoint: sanitizeCheckpoint(event.checkpoint),
      objectiveOutcomes: event.objectiveOutcome
        ? [
            ...state.objectiveOutcomes.filter(
              (outcome) => outcome.stageId !== event.objectiveOutcome?.stageId
            ),
            event.objectiveOutcome
          ]
        : state.objectiveOutcomes
    });
  }

  if (event.type === 'selectBranch' && current.kind === 'branch') {
    const option = getBranchOption(schedule, event.optionId, current.branchId);

    if (!option) {
      return reject(state, `Unknown mission branch option ${event.optionId}.`);
    }

    if (!isMissionBranchOptionAvailable(schedule, state, option.id)) {
      return reject(state, `Mission branch option ${event.optionId} is not currently available.`);
    }

    const nextStageId = schedule.stages.find(
      (stage) =>
        stage.nodeId === option.targetNodeId &&
        stage.kind !== 'failure' &&
        stage.kind !== 'completion'
    )?.id;
    if (!nextStageId) {
      return reject(state, `Mission branch option ${event.optionId} has no target stage.`);
    }
    const branch = current.branchId
      ? schedule.branches.find((candidate) => candidate.id === current.branchId)
      : null;
    const branchOptionIds = new Set(branch?.options.map((candidate) => candidate.id) ?? []);
    return advance(schedule, state, event, nextStageId, {
      selectedBranchOptionId: option.id,
      selectedBranchOptionIds: [
        ...state.selectedBranchOptionIds.filter((id) => !branchOptionIds.has(id)),
        option.id
      ]
    });
  }

  if (event.type === 'completeRelief' && current.kind === 'relief') {
    if (!current.nextStageId) {
      return reject(state, `Relief stage ${current.id} has no continuation.`);
    }
    return advance(schedule, state, event, current.nextStageId);
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
  const stage = state ? getMissionStage(schedule, state.currentStageId) : null;
  const branch = stage?.branchId
    ? schedule.branches.find((candidate) => candidate.id === stage.branchId)
    : schedule.branch;
  const options = branch?.options ?? [];
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

  const latestOutcome = state.objectiveOutcomes.at(-1)?.outcome ?? 'success';
  return (
    (state.checkpoint.hull ?? 0) >= condition.minimumHull &&
    condition.acceptedOutcomes.includes(latestOutcome)
  );
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
  const objectiveId =
    stage.objectiveId ??
    (stage.kind === 'briefing' || stage.kind === 'entry'
      ? (schedule.contract?.primaryObjectiveId ?? null)
      : null);
  const objective = objectiveId ? getMissionObjective(objectiveId) : null;
  const objectivePlan =
    objective && schedule.contract
      ? createMissionObjectivePlan({
          contract: schedule.contract,
          objective,
          optional: stage.optional
        })
      : null;
  const latestOutcome = state.objectiveOutcomes.at(-1) ?? null;
  const operationIndex = schedule.operationStageIds.indexOf(stage.id);
  const visitedOperationCount = schedule.operationStageIds.filter((id) =>
    state.visitedStageIds.includes(id)
  ).length;

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
    summary: `${stage.label} | ${state.status} | stage ${stageNumber}/${stageCount}`,
    contractId: schedule.contract?.id ?? null,
    contractTitle: schedule.contract?.title ?? schedule.label,
    contractSummary: schedule.contract?.summary ?? schedule.label,
    objectiveId,
    objectiveVerb: objective?.verb ?? null,
    objectiveBrief: objectivePlan ? formatMissionObjectiveBrief(objectivePlan) : '',
    reliefCopy: schedule.contract?.reliefCopy ?? 'Pressure clear; extraction is available.',
    latestOutcome: latestOutcome?.outcome ?? null,
    operationalRole: stage.operationalRole,
    operationNumber: operationIndex >= 0 ? operationIndex + 1 : visitedOperationCount,
    operationCount: schedule.operationStageIds.length
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
    checkpointWorldOffset: state.checkpoint.worldOffset,
    contractId: readModel.contractId,
    objectiveId: readModel.objectiveId,
    objectiveVerb: readModel.objectiveVerb,
    objectiveOutcome: readModel.latestOutcome
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
  sector: SectorRoute,
  influence?: MissionOperationalInfluence
): MissionCombatProjection {
  const stage = getMissionStage(schedule, state.currentStageId);

  if (stage.kind !== 'combat' || !stage.world) {
    throw new Error(`Mission stage ${stage.id} is not a combat stage.`);
  }

  const objective = stage.objectiveId ? getMissionObjective(stage.objectiveId) : null;
  const missionObjective =
    objective && schedule.contract
      ? createMissionObjectivePlan({
          contract: schedule.contract,
          objective,
          optional: stage.optional
        })
      : null;
  const projectedSector = objective
    ? projectObjectiveSector(sector, stage, state, objective.world, objective.label, influence)
    : sector;

  return {
    stageId: stage.id,
    stageLabel: stage.label,
    nodeId: stage.nodeId,
    sector: projectedSector,
    combatSeedSuffix: `${stage.world.seedNamespace}:${stage.id}`,
    startingHull: stage.carry.hull === 'carry' ? state.checkpoint.hull : null,
    completionReason: 'sectorComplete',
    missionObjective,
    objectiveWorld: objective?.world ?? null,
    operationalRole: stage.operationalRole,
    influenceLabel: influence?.label ?? null
  };
}

function projectObjectiveSector(
  sector: SectorRoute,
  stage: MissionStageDefinition,
  state: MissionDirectorState,
  objectiveWorld: MissionObjectiveWorldDefinition,
  objectiveLabel: string,
  influence?: MissionOperationalInfluence
): SectorRoute {
  const world = stage.world;

  if (!world) {
    return sector;
  }

  const requiredWaves = Math.max(
    1,
    Math.min(
      sector.majorWaves.length,
      Math.ceil(
        sector.objective.requiredWaves *
          world.waveCountScale *
          objectiveWorld.waveCountScale *
          (influence?.waveCountScale ?? 1)
      )
    )
  );
  const majorWaves = sector.majorWaves.slice(0, requiredWaves);
  const scrollLength = Math.max(
    640,
    Math.round(
      sector.scroll.length *
        world.scrollLengthScale *
        objectiveWorld.scrollLengthScale *
        (influence?.scrollLengthScale ?? 1)
    )
  );
  const continuedOffset = Math.max(
    sector.scroll.startOffset + sector.scroll.length,
    state.checkpoint.worldOffset
  );

  const isTerminalOperation = stage.operationalRole === 'gate';
  const continuesWorld = stage.carry.scrollWorld === 'continue';
  return {
    ...sector,
    sectorName: stage.optional ? stage.label : sector.sectorName,
    majorWaves,
    objective: {
      ...sector.objective,
      label: objectiveLabel,
      requiredWaves,
      requiredEnemyKills: requiredWaves * sector.objective.spawnsPerWave,
      bossRequired:
        isTerminalOperation && world.bossPolicy === 'inherit' && sector.objective.bossRequired,
      bossSpawnAtSeconds: isTerminalOperation ? sector.objective.bossSpawnAtSeconds : null,
      variantId: 'standardSweep',
      variantLabel: objectiveLabel,
      variantSummary: `${
        stage.optional ? 'Optional' : 'Required'
      } deterministic operation carried through the sector itinerary.${
        influence ? ` ${influence.label}` : ''
      }`,
      pressureBand: 'volatile',
      travelGateRatio: 1
    },
    scroll: {
      ...sector.scroll,
      length: scrollLength,
      startOffset: continuesWorld ? continuedOffset : sector.scroll.startOffset
    },
    arena: isTerminalOperation ? sector.arena : null,
    finale: isTerminalOperation ? sector.finale : null,
    setPiece: isTerminalOperation ? sector.setPiece : null
  };
}

function createStage(
  prefix: string,
  token: string,
  profileId: string,
  label: string,
  node: ExpeditionEncounterNode | string,
  options: {
    readonly optional?: boolean;
    readonly objectiveId?: string | null;
    readonly branchId?: string | null;
    readonly nextStageId?: string | null;
  } = {}
): MissionStageDefinition {
  const profile = getMissionStageProfile(profileId);
  const nodeId = typeof node === 'string' ? node : node.id;
  return {
    id: `${prefix}:${token}`,
    profileId,
    kind: profile.kind,
    label,
    nodeId,
    optional: options.optional ?? false,
    carry: profile.carry,
    world: profile.world,
    objectiveId: options.objectiveId ?? null,
    operationalRole: typeof node === 'string' ? null : node.operationalRole,
    branchId: options.branchId ?? null,
    nextStageId: options.nextStageId ?? null
  };
}

export function selectMissionContract(
  graph: ExpeditionGraph,
  sectorIndex: number,
  actId?: ActId
): MissionContractDefinition {
  const sector = graph.sectors[sectorIndex];
  const resolvedActId = actId ?? sector?.actId;
  if (!sector || !resolvedActId) {
    throw new Error(`Cannot select mission contract for sector ${sectorIndex}.`);
  }
  const actSectors = graph.sectors.filter((candidate) => candidate.actId === resolvedActId);
  const actSectorIndex = actSectors.findIndex((candidate) => candidate.id === sector.id);
  const candidates = MISSION_CONTRACTS.filter((contract) =>
    contract.eligibleActIds.includes(resolvedActId)
  );
  const contract = candidates[actSectorIndex % candidates.length];
  if (!contract) {
    throw new Error(`No mission contract is eligible for ${resolvedActId}.`);
  }
  return contract;
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
  optionId: string,
  branchId?: string | null
): ExpeditionBranchOption | null {
  const branches = branchId
    ? schedule.branches.filter((candidate) => candidate.id === branchId)
    : schedule.branches;
  return (
    branches.flatMap((branch) => branch.options).find((candidate) => candidate.id === optionId) ??
    null
  );
}

function requireStageId(schedule: MissionSchedule, token: string): string {
  const stage = schedule.stages.find((candidate) => candidate.id.endsWith(`:${token}`));
  if (!stage) {
    throw new Error(`Mission schedule ${schedule.id} is missing ${token}.`);
  }
  return stage.id;
}

function getNextStageByKind(
  schedule: MissionSchedule,
  currentStageId: string,
  kind: MissionStageKind
): string {
  const currentIndex = schedule.stages.findIndex((stage) => stage.id === currentStageId);
  const stage = schedule.stages
    .slice(currentIndex + 1)
    .find((candidate) => candidate.kind === kind);
  if (!stage) {
    throw new Error(
      `Mission schedule ${schedule.id} has no ${kind} stage after ${currentStageId}.`
    );
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
