import {
  EXPEDITION_COMPLETION_RULES,
  EXPEDITION_ENTRY_RULES,
  EXPEDITION_NODE_KINDS,
  EXPEDITION_NODE_PROFILES,
  EXPEDITION_OPERATIONAL_ROLES,
  EXPEDITION_OPPORTUNITIES,
  EXPEDITION_PRESSURE_BANDS,
  EXPEDITION_REWARD_HOOKS,
  EXPEDITION_RISK_BANDS,
  EXPEDITION_TRANSITION_POLICIES,
  getExpeditionNodeProfile
} from '../content/expeditions';
import type { ExpeditionGraph } from './ExpeditionTypes';

export function validateExpeditionGraph(graph: ExpeditionGraph): string[] {
  const errors: string[] = [];
  const nodeIds = new Set<string>();
  const legIds = new Set<string>();
  const sectorIds = new Set<string>();
  const branchIds = new Set<string>();
  const actIds = new Set(graph.acts.map((act) => act.actId));
  const knownNodeKinds = new Set<string>(EXPEDITION_NODE_KINDS);
  const knownPressureBands = new Set<string>(EXPEDITION_PRESSURE_BANDS);
  const knownEntryRules = new Set<string>(EXPEDITION_ENTRY_RULES);
  const knownCompletionRules = new Set<string>(EXPEDITION_COMPLETION_RULES);
  const knownTransitionPolicies = new Set<string>(EXPEDITION_TRANSITION_POLICIES);
  const knownRewardHooks = new Set<string>(EXPEDITION_REWARD_HOOKS);
  const knownProfileIds = new Set(EXPEDITION_NODE_PROFILES.map((profile) => profile.id));
  const knownOperationalRoles = new Set<string>(EXPEDITION_OPERATIONAL_ROLES);
  const knownRiskBands = new Set<string>(EXPEDITION_RISK_BANDS);
  const knownOpportunityIds = new Set(
    EXPEDITION_OPPORTUNITIES.map((opportunity) => opportunity.id)
  );
  const knownObjectiveKinds = new Set<string>(['clearWaves', 'defeatBoss']);

  if (!graph.id.trim()) {
    errors.push('Expedition graph must have an id');
  }

  if (!graph.seed.trim()) {
    errors.push('Expedition graph must have a seed');
  }

  for (const node of graph.nodes) {
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate expedition node id: ${node.id}`);
    }
    nodeIds.add(node.id);

    if (!knownProfileIds.has(node.profileId)) {
      errors.push(`Expedition node ${node.id} references missing profile: ${node.profileId}`);
    } else {
      const profile = getExpeditionNodeProfile(node.profileId);
      if (profile.nodeKind !== node.kind) {
        errors.push(`Expedition node ${node.id} kind does not match profile ${node.profileId}`);
      }
    }
    if (!knownNodeKinds.has(node.kind)) {
      errors.push(`Expedition node ${node.id} has invalid kind: ${node.kind}`);
    }
    if (!knownPressureBands.has(node.pressureBand)) {
      errors.push(`Expedition node ${node.id} has invalid pressure band: ${node.pressureBand}`);
    }
    if (!knownOperationalRoles.has(node.operationalRole)) {
      errors.push(
        `Expedition node ${node.id} has invalid operational role: ${node.operationalRole}`
      );
    }
    if (
      !knownRiskBands.has(node.intel.danger) ||
      !node.intel.reward.trim() ||
      !node.intel.consequence.trim() ||
      !node.intel.factionRisk.trim() ||
      !node.intel.crewRisk.trim() ||
      !node.intel.shipRisk.trim()
    ) {
      errors.push(`Expedition node ${node.id} has invalid operational intel`);
    }
    if (!knownEntryRules.has(node.entryRule)) {
      errors.push(`Expedition node ${node.id} has invalid entry rule: ${node.entryRule}`);
    }
    if (!knownCompletionRules.has(node.completionRule)) {
      errors.push(`Expedition node ${node.id} has invalid completion rule: ${node.completionRule}`);
    }
    if (!knownTransitionPolicies.has(node.transitionPolicy)) {
      errors.push(
        `Expedition node ${node.id} has invalid transition policy: ${node.transitionPolicy}`
      );
    }
    if (
      node.duration.minSeconds <= 0 ||
      node.duration.targetSeconds < node.duration.minSeconds ||
      node.duration.maxSeconds < node.duration.targetSeconds
    ) {
      errors.push(`Expedition node ${node.id} must order positive duration bounds`);
    }
    for (const hook of node.rewardHooks) {
      if (!knownRewardHooks.has(hook)) {
        errors.push(`Expedition node ${node.id} has invalid reward hook: ${hook}`);
      }
    }
    if (!knownObjectiveKinds.has(node.content.objectiveKind)) {
      errors.push(
        `Expedition node ${node.id} has invalid objective reference: ${node.content.objectiveKind}`
      );
    }
    if (node.content.majorWaveIds.length === 0) {
      errors.push(`Expedition node ${node.id} must reference major waves`);
    }
    if (node.content.routeKinds.length === 0) {
      errors.push(`Expedition node ${node.id} must reference route kinds`);
    }
    if (!node.content.rewardPoolSeed.trim() || !node.content.shopSeed.trim()) {
      errors.push(`Expedition node ${node.id} must reference reward and shop seeds`);
    }
    if (
      node.content.opportunityId !== null &&
      !knownOpportunityIds.has(node.content.opportunityId)
    ) {
      errors.push(
        `Expedition node ${node.id} references missing opportunity: ${node.content.opportunityId}`
      );
    }
    if (node.optional !== (node.content.opportunityId !== null)) {
      errors.push(`Expedition node ${node.id} optional state must match opportunity content`);
    }
  }

  if (!nodeIds.has(graph.startNodeId)) {
    errors.push(`Expedition graph references missing start node: ${graph.startNodeId}`);
  }
  for (const terminalNodeId of graph.terminalNodeIds) {
    if (!nodeIds.has(terminalNodeId)) {
      errors.push(`Expedition graph references missing terminal node: ${terminalNodeId}`);
    }
  }

  for (const node of graph.nodes) {
    for (const nextNodeId of node.nextNodeIds) {
      if (!nodeIds.has(nextNodeId)) {
        errors.push(`Expedition node ${node.id} references missing exit node: ${nextNodeId}`);
      }
    }
  }

  for (const leg of graph.missionLegs) {
    if (legIds.has(leg.id)) {
      errors.push(`Duplicate expedition mission leg id: ${leg.id}`);
    }
    legIds.add(leg.id);
    if (!nodeIds.has(leg.entryNodeId)) {
      errors.push(`Expedition mission leg ${leg.id} references missing entry node`);
    }
    for (const nodeId of [...leg.nodeIds, ...leg.exitNodeIds]) {
      if (!nodeIds.has(nodeId)) {
        errors.push(`Expedition mission leg ${leg.id} references missing node: ${nodeId}`);
      }
    }
  }

  for (const sector of graph.sectors) {
    if (sectorIds.has(sector.id)) {
      errors.push(`Duplicate expedition sector id: ${sector.id}`);
    }
    sectorIds.add(sector.id);
    if (!actIds.has(sector.actId)) {
      errors.push(`Expedition sector ${sector.id} references missing act: ${sector.actId}`);
    }
    if (!nodeIds.has(sector.entryNodeId)) {
      errors.push(`Expedition sector ${sector.id} references missing entry node`);
    }
    for (const nodeId of [...sector.nodeIds, ...sector.exitNodeIds]) {
      if (!nodeIds.has(nodeId)) {
        errors.push(`Expedition sector ${sector.id} references missing node: ${nodeId}`);
      }
    }
    for (const node of graph.nodes.filter((candidate) => sector.nodeIds.includes(candidate.id))) {
      if (node.sectorPlanId !== sector.id || node.content.sectorId !== sector.sectorId) {
        errors.push(`Expedition sector ${sector.id} has mismatched node content: ${node.id}`);
      }
    }
    const sectorRoles = graph.nodes
      .filter((candidate) => sector.nodeIds.includes(candidate.id))
      .map((node) => node.operationalRole);
    for (const role of EXPEDITION_OPERATIONAL_ROLES) {
      if (sectorRoles.filter((candidate) => candidate === role).length !== 1) {
        errors.push(`Expedition sector ${sector.id} must define one ${role} node`);
      }
    }
    for (const legId of sector.missionLegIds) {
      if (!legIds.has(legId)) {
        errors.push(`Expedition sector ${sector.id} references missing mission leg: ${legId}`);
      }
    }
  }

  for (const branch of graph.branches) {
    if (branchIds.has(branch.id)) {
      errors.push(`Duplicate expedition branch id: ${branch.id}`);
    }
    branchIds.add(branch.id);
    const sourceNode = graph.nodes.find((node) => node.id === branch.sourceNodeId);
    if (!sourceNode) {
      errors.push(`Expedition branch ${branch.id} references missing source node`);
      continue;
    }
    if (branch.options.length < 2) {
      errors.push(`Expedition branch ${branch.id} must define at least two options`);
    }
    if (branch.options.filter((option) => option.default).length !== 1) {
      errors.push(`Expedition branch ${branch.id} must define exactly one default option`);
    }
    const optionIds = new Set<string>();
    for (const option of branch.options) {
      if (optionIds.has(option.id)) {
        errors.push(`Expedition branch ${branch.id} has duplicate option: ${option.id}`);
      }
      optionIds.add(option.id);
      if (!nodeIds.has(option.targetNodeId)) {
        errors.push(
          `Expedition branch ${branch.id} option ${option.id} references missing target node`
        );
      }
      if (!sourceNode.nextNodeIds.includes(option.targetNodeId)) {
        errors.push(
          `Expedition branch ${branch.id} option ${option.id} target is not a source-node exit`
        );
      }
    }
  }

  for (const gate of graph.gates) {
    if (!actIds.has(gate.actId)) {
      errors.push(`Expedition gate ${gate.id} references missing act: ${gate.actId}`);
    }
    if (!sectorIds.has(gate.sectorPlanId)) {
      errors.push(`Expedition gate ${gate.id} references missing sector: ${gate.sectorPlanId}`);
    }
    if (!nodeIds.has(gate.nodeId)) {
      errors.push(`Expedition gate ${gate.id} references missing node: ${gate.nodeId}`);
    }
  }

  if (errors.length === 0) {
    try {
      assertExpeditionPathResolves(graph);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Expedition path could not resolve');
    }
  }

  return errors;
}

function assertExpeditionPathResolves(graph: ExpeditionGraph): void {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const branches = new Map(graph.branches.map((branch) => [branch.sourceNodeId, branch]));
  const visited = new Set<string>();
  let currentNodeId: string | undefined = graph.startNodeId;

  while (currentNodeId) {
    if (visited.has(currentNodeId)) {
      throw new Error(`Expedition graph path contains a cycle at ${currentNodeId}.`);
    }

    const node = nodes.get(currentNodeId);
    if (!node) {
      throw new Error(`Expedition graph path references missing node ${currentNodeId}.`);
    }
    visited.add(currentNodeId);

    const branch = branches.get(currentNodeId);
    if (branch) {
      const defaultOption = branch.options.find((option) => option.default);
      if (!defaultOption) {
        throw new Error(`Expedition branch ${branch.id} has no selectable option.`);
      }
      currentNodeId = defaultOption.targetNodeId;
      continue;
    }

    if (node.nextNodeIds.length > 1) {
      throw new Error(`Expedition node ${node.id} has multiple exits without a branch.`);
    }
    currentNodeId = node.nextNodeIds[0];
  }
}
