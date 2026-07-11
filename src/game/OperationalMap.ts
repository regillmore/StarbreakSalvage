import type {
  ExpeditionEncounterNode,
  ExpeditionGraph,
  ExpeditionOperationalRole,
  ExpeditionProgressState,
  ExpeditionRiskBand
} from './ExpeditionTypes';
import type { MissionCheckpoint, MissionOperationalInfluence } from './MissionDirector';
import type { FactionFrontInfluence } from './FactionFront';

export type OperationalOutcome = 'success' | 'partialSuccess' | 'failure';

export interface OperationBoundaryRecord {
  readonly id: string;
  readonly nodeId: string;
  readonly sectorIndex: number;
  readonly role: ExpeditionOperationalRole;
  readonly outcome: OperationalOutcome;
  readonly checkpoint: MissionCheckpoint;
  readonly salvageAwarded: number;
  readonly consequence: 'none' | 'gateSupport' | 'pursuitPressure';
  readonly cleanup: {
    readonly retainedActors: 0;
    readonly retainedProjectiles: 0;
    readonly retainedHooks: 0;
    readonly rewardSettled: true;
  };
}

export interface OperationalProgressState {
  readonly processedOperationIds: readonly string[];
  readonly history: readonly OperationBoundaryRecord[];
}

export interface OperationBoundaryResult {
  readonly state: OperationalProgressState;
  readonly disposition: 'applied' | 'duplicate';
  readonly salvageAwarded: number;
  readonly consequence: OperationBoundaryRecord['consequence'];
}

export interface OperationalMapNodeReadModel {
  readonly id: string;
  readonly label: string;
  readonly role: ExpeditionOperationalRole;
  readonly optional: boolean;
  readonly status: 'completed' | 'current' | 'available' | 'planned' | 'bypassed' | 'closed';
  readonly timeEstimate: string;
  readonly danger: ExpeditionRiskBand;
  readonly reward: string;
  readonly consequence: string;
  readonly risks: string;
  readonly frontDirective: 'created' | 'transformed' | 'closed' | null;
  readonly frontForecast: string | null;
}

export interface OperationalMapReadModel {
  readonly sectorPlanId: string;
  readonly sectorName: string;
  readonly operationRange: string;
  readonly completedOperations: number;
  readonly nodes: readonly OperationalMapNodeReadModel[];
  readonly summary: string;
}

const OPERATION_ROLES = new Set<ExpeditionOperationalRole>([
  'advance',
  'detour',
  'gate',
  'pursuit'
]);

export function createOperationalProgressState(): OperationalProgressState {
  return { processedOperationIds: [], history: [] };
}

export function recordOperationBoundary(
  state: OperationalProgressState,
  options: {
    readonly id: string;
    readonly node: ExpeditionEncounterNode;
    readonly outcome: OperationalOutcome;
    readonly checkpoint: MissionCheckpoint;
  }
): OperationBoundaryResult {
  if (state.processedOperationIds.includes(options.id)) {
    return { state, disposition: 'duplicate', salvageAwarded: 0, consequence: 'none' };
  }

  const salvageAwarded = getOperationSalvageAward(options.node.operationalRole, options.outcome);
  const consequence = getOperationConsequence(options.node.operationalRole, options.outcome);
  const record: OperationBoundaryRecord = {
    id: options.id,
    nodeId: options.node.id,
    sectorIndex: options.node.sectorIndex,
    role: options.node.operationalRole,
    outcome: options.outcome,
    checkpoint: sanitizeCheckpoint(options.checkpoint),
    salvageAwarded,
    consequence,
    cleanup: {
      retainedActors: 0,
      retainedProjectiles: 0,
      retainedHooks: 0,
      rewardSettled: true
    }
  };
  return {
    state: {
      processedOperationIds: [...state.processedOperationIds, options.id],
      history: [...state.history, record].slice(-64)
    },
    disposition: 'applied',
    salvageAwarded,
    consequence
  };
}

export function getOperationalInfluence(
  state: OperationalProgressState,
  sectorIndex: number,
  role: ExpeditionOperationalRole | null
): MissionOperationalInfluence | undefined {
  if (
    role === 'gate' &&
    state.history.some(
      (record) =>
        record.sectorIndex === sectorIndex &&
        record.consequence === 'gateSupport' &&
        record.outcome !== 'failure'
    )
  ) {
    return {
      scrollLengthScale: 0.9,
      waveCountScale: 0.8,
      label: 'Detour support shortens the gate approach and suppresses one pressure band.'
    };
  }

  if (
    role === 'advance' &&
    state.history.some(
      (record) =>
        record.sectorIndex === sectorIndex - 1 &&
        record.consequence === 'pursuitPressure' &&
        record.outcome !== 'failure'
    )
  ) {
    return {
      scrollLengthScale: 1.12,
      waveCountScale: 1.2,
      label: 'The previous pursuit wake lengthens this advance and raises contact pressure.'
    };
  }

  return undefined;
}

export function createOperationalMapReadModel(options: {
  readonly graph: ExpeditionGraph;
  readonly sectorIndex: number;
  readonly expedition: ExpeditionProgressState;
  readonly operational: OperationalProgressState;
  readonly currentNodeId: string | null;
  readonly factionFront?: FactionFrontInfluence | null;
}): OperationalMapReadModel {
  const sector = options.graph.sectors[options.sectorIndex];
  if (!sector) {
    throw new Error(`Operational map has no sector ${options.sectorIndex}.`);
  }
  const decisions = new Map(
    options.expedition.decisions.map((decision) => [decision.branchId, decision.optionId])
  );
  const completedNodeIds = new Set([
    ...options.expedition.visitedNodeIds,
    ...options.operational.history.map((record) => record.nodeId)
  ]);
  const nodes = sector.nodeIds.map((nodeId): OperationalMapNodeReadModel => {
    const node = getNode(options.graph, nodeId);
    const bypassed = node.optional && isOptionalNodeBypassed(options.graph, node, decisions);
    const frontApplies =
      node.optional && node.operationalRole === options.factionFront?.reserveRole;
    const status =
      node.id === options.currentNodeId
        ? 'current'
        : completedNodeIds.has(node.id)
          ? 'completed'
          : frontApplies && options.factionFront?.nodePolicy === 'close'
            ? 'closed'
          : bypassed
            ? 'bypassed'
            : isNodeAvailable(options.graph, node.id, completedNodeIds, decisions)
              ? 'available'
              : 'planned';
    return {
      id: node.id,
      label:
        frontApplies && options.factionFront
          ? `${options.factionFront.mapCue} ${options.factionFront.strategyLabel}`
          : node.label,
      role: node.operationalRole,
      optional: node.optional,
      status,
      timeEstimate: `${Math.ceil(node.duration.minSeconds / 10) * 10}-${
        Math.ceil(node.duration.maxSeconds / 10) * 10
      } sec`,
      danger: node.intel.danger,
      reward: node.intel.reward,
      consequence: node.intel.consequence,
      risks: `Faction ${node.intel.factionRisk} | Crew ${node.intel.crewRisk} | Ship ${node.intel.shipRisk}`,
      frontDirective: frontApplies
        ? options.factionFront?.nodePolicy === 'create'
          ? 'created'
          : options.factionFront?.nodePolicy === 'transform'
            ? 'transformed'
            : 'closed'
        : null,
      frontForecast: frontApplies
        ? `${options.factionFront?.mapCue} ${options.factionFront?.strategyLabel}: ${options.factionFront?.forecast}`
        : null
    };
  });
  const completedOperations = nodes.filter(
    (node) => OPERATION_ROLES.has(node.role) && node.status === 'completed'
  ).length;
  return {
    sectorPlanId: sector.id,
    sectorName: sector.sectorName,
    operationRange: '2 required / up to 4 with detour and pursuit',
    completedOperations,
    nodes,
    summary: `${sector.sectorName} | ${completedOperations} operations settled | 2-4 operation itinerary${options.factionFront ? ` | ${options.factionFront.mapCue} ${options.factionFront.ownerFactionName} ${options.factionFront.stance}` : ''}`
  };
}

export function validateOperationalProgressState(
  graph: ExpeditionGraph,
  state: OperationalProgressState
): string[] {
  const errors: string[] = [];
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  if (
    !Array.isArray(state.processedOperationIds) ||
    state.processedOperationIds.length > 64 ||
    new Set(state.processedOperationIds).size !== state.processedOperationIds.length
  ) {
    errors.push('Operational processed ids are invalid.');
  }
  if (!Array.isArray(state.history) || state.history.length > 64) {
    errors.push('Operational history is invalid.');
  } else {
    for (const record of state.history) {
      if (
        !nodeIds.has(record.nodeId) ||
        !state.processedOperationIds.includes(record.id) ||
        record.cleanup.retainedActors !== 0 ||
        record.cleanup.retainedProjectiles !== 0 ||
        record.cleanup.retainedHooks !== 0 ||
        record.cleanup.rewardSettled !== true
      ) {
        errors.push(`Operational boundary ${record.id} is invalid.`);
      }
    }
  }
  return errors;
}

function getOperationSalvageAward(
  role: ExpeditionOperationalRole,
  outcome: OperationalOutcome
): number {
  if (outcome === 'failure') return 0;
  if (role === 'pursuit') return outcome === 'success' ? 2 : 1;
  if (role === 'detour' && outcome === 'success') return 1;
  return 0;
}

function getOperationConsequence(
  role: ExpeditionOperationalRole,
  outcome: OperationalOutcome
): OperationBoundaryRecord['consequence'] {
  if (outcome === 'failure') return 'none';
  if (role === 'detour') return 'gateSupport';
  if (role === 'pursuit') return 'pursuitPressure';
  return 'none';
}

function isOptionalNodeBypassed(
  graph: ExpeditionGraph,
  node: ExpeditionEncounterNode,
  decisions: ReadonlyMap<string, string>
): boolean {
  const branch = graph.branches.find((candidate) =>
    candidate.options.some((option) => option.targetNodeId === node.id)
  );
  const decision = branch ? decisions.get(branch.id) : undefined;
  return Boolean(
    branch &&
    decision &&
    branch.options.some((option) => option.id === decision && option.targetNodeId !== node.id)
  );
}

function isNodeAvailable(
  graph: ExpeditionGraph,
  nodeId: string,
  completedNodeIds: ReadonlySet<string>,
  decisions: ReadonlyMap<string, string>
): boolean {
  return graph.nodes.some((source) => {
    if (!completedNodeIds.has(source.id)) return false;
    const branch = graph.branches.find((candidate) => candidate.sourceNodeId === source.id);
    if (!branch) return source.nextNodeIds.includes(nodeId);
    const selected = decisions.get(branch.id);
    return branch.options.some(
      (option) => option.targetNodeId === nodeId && (!selected || option.id === selected)
    );
  });
}

function getNode(graph: ExpeditionGraph, nodeId: string): ExpeditionEncounterNode {
  const node = graph.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) throw new Error(`Operational map references missing node ${nodeId}.`);
  return node;
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
