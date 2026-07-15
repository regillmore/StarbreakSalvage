import { describe, expect, it } from 'vitest';

import {
  advanceExpeditionCompatibilityProgress,
  createExpeditionPathReadModel,
  createExpeditionProgress,
  recordExpeditionDecision,
  resolveExpeditionPath,
  summarizeExpeditionGraph,
  synchronizeExpeditionCompatibilityProgress,
  validateExpeditionGraph
} from '../../src/game/ExpeditionGraph';
import { generateRunSkeleton } from '../../src/game/Generation';

describe('ExpeditionGraph', () => {
  it('generates a validated three-act graph with stable mission contracts', () => {
    const graph = generateRunSkeleton('EXPEDITION-GRAPH-SMOKE').expedition;
    expect(validateExpeditionGraph(graph)).toEqual([]);
    expect(graph.acts).toHaveLength(3);
    expect(graph.sectors).toHaveLength(27);
    expect(graph.nodes).toHaveLength(189);
    expect(graph.missionLegs).toHaveLength(162);
    expect(graph.branches).toHaveLength(54);
    expect(graph.gates.map((gate) => [gate.actId, gate.kind, gate.transitionKind])).toEqual([
      ['act_outer_rim', 'checkpoint', 'interActJunction'],
      ['act_core_descent', 'finale', 'frontierChoice'],
      ['act_null_frontier', 'finale', 'victory']
    ]);
    expect(graph.startNodeId).toBe('expedition_s01_ingress');
    expect(graph.terminalNodeIds).toEqual(['expedition_s27_exit']);

    for (const sector of graph.sectors) {
      expect(
        sector.nodeIds.map(
          (nodeId) => graph.nodes.find((node) => node.id === nodeId)?.operationalRole
        )
      ).toEqual(['ingress', 'advance', 'detour', 'staging', 'gate', 'pursuit', 'extraction']);
      expect(sector.requiredNodeIds).toHaveLength(5);
      expect(sector.optionalNodeIds).toHaveLength(2);
      expect(sector.branchIds).toHaveLength(2);
    }
  });

  it('repeats graph generation for the same seed and save state', () => {
    const first = generateRunSkeleton('EXPEDITION-GRAPH-SMOKE');
    const second = generateRunSkeleton('EXPEDITION-GRAPH-SMOKE');
    expect(summarizeExpeditionGraph(first.expedition)).toEqual(
      summarizeExpeditionGraph(second.expedition)
    );
  });

  it('includes save state in graph identity and optional opportunity selection', () => {
    const fresh = generateRunSkeleton('EXPEDITION-SAVE-FINGERPRINT', {
      unlockedIds: [],
      purchasedUpgradeIds: []
    });
    const progressed = generateRunSkeleton('EXPEDITION-SAVE-FINGERPRINT', {
      unlockedIds: ['unlock_ship_scrap_monk', 'unlock_item_executive_override'],
      purchasedUpgradeIds: ['upgrade_contract_survey_rig']
    });
    expect(fresh.expedition.id).not.toBe(progressed.expedition.id);
    expect(fresh.expedition.saveFingerprint).not.toBe(progressed.expedition.saveFingerprint);
    expect(
      fresh.expedition.nodes
        .filter((node) => node.optional)
        .map((node) => node.content.opportunityId)
    ).not.toEqual(
      progressed.expedition.nodes
        .filter((node) => node.optional)
        .map((node) => node.content.opportunityId)
    );
  });

  it('resolves the same decision history to the same path and major outcomes', () => {
    const graph = generateRunSkeleton('MISSION-BRANCH-CATCHUP').expedition;
    const branch = graph.branches[0];
    const detour = branch?.options.find((option) => !option.default);
    if (!branch || !detour) throw new Error('Expected an expedition branch and optional detour.');
    const progress = recordExpeditionDecision(
      graph,
      createExpeditionProgress(graph),
      branch.id,
      detour.id
    );
    const first = resolveExpeditionPath(graph, progress.decisions);
    expect(first).toEqual(resolveExpeditionPath(graph, progress.decisions));
    expect(first.nodeIds).toContain(detour.targetNodeId);
    expect(first.decisionOutcomeIds).toContain(detour.outcomeId);
    expect(first.targetSeconds).toBeGreaterThan(resolveExpeditionPath(graph).targetSeconds);
  });

  it('keeps current one-lane sector progress as an explicit compatibility projection', () => {
    const graph = generateRunSkeleton('STARBREAK-SMOKE').expedition;
    const initial = createExpeditionProgress(graph);
    const afterFirstSector = advanceExpeditionCompatibilityProgress(graph, initial, 0);
    const atActTwo = synchronizeExpeditionCompatibilityProgress(graph, initial, 5);
    const model = createExpeditionPathReadModel(graph, atActTwo);
    expect(afterFirstSector.visitedNodeIds).toEqual([
      'expedition_s01_ingress',
      'expedition_s01_operation',
      'expedition_s01_staging',
      'expedition_s01_gate_operation',
      'expedition_s01_exit',
      'expedition_s02_ingress'
    ]);
    expect(afterFirstSector.visitedNodeIds).not.toContain('expedition_s01_detour');
    expect(model.currentNodeId).toBe('expedition_s06_ingress');
    expect(model.visitedNodeCount).toBe(16);
  });

  it('reports capacity from the fresh one-operation-per-sector itinerary', () => {
    const capacity = generateRunSkeleton('EXPEDITION-GRAPH-SMOKE').expedition.capacity;
    expect(capacity).toEqual({
      requiredNodeCount: 45,
      optionalNodeCount: 15,
      baselineMinSeconds: 652,
      baselineTargetSeconds: 1005,
      baselineMaxSeconds: 1365,
      expandedTargetSeconds: 1260
    });
    expect(capacity.baselineTargetSeconds).toBeGreaterThanOrEqual(15 * 60);
    expect(capacity.baselineTargetSeconds).toBeLessThanOrEqual(20 * 60);
    expect(capacity.expandedTargetSeconds).toBeGreaterThan(capacity.baselineTargetSeconds);
    expect(capacity.expandedTargetSeconds).toBeLessThanOrEqual(25 * 60);
  });

  it('keeps compact known-seed graph identities and frontier gates', () => {
    const summaries = ['STARBREAK-SMOKE', 'LASER-TAX-404', 'EXPEDITION-GRAPH-SMOKE'].map((seed) => {
      const graph = generateRunSkeleton(seed).expedition;
      return {
        seed,
        id: graph.id,
        target: graph.capacity.baselineTargetSeconds,
        optionalOpportunityCount: graph.nodes.filter((node) => node.optional).length,
        gates: graph.gates.map((gate) => `${gate.actId}:${gate.transitionKind}`)
      };
    });
    expect(summaries).toEqual([
      {
        seed: 'STARBREAK-SMOKE',
        id: 'expedition_starbreak-smoke_53f226d4',
        target: 1001,
        optionalOpportunityCount: 54,
        gates: [
          'act_outer_rim:interActJunction',
          'act_core_descent:frontierChoice',
          'act_null_frontier:victory'
        ]
      },
      {
        seed: 'LASER-TAX-404',
        id: 'expedition_laser-tax-404_60d04233',
        target: 1009,
        optionalOpportunityCount: 54,
        gates: [
          'act_outer_rim:interActJunction',
          'act_core_descent:frontierChoice',
          'act_null_frontier:victory'
        ]
      },
      {
        seed: 'EXPEDITION-GRAPH-SMOKE',
        id: 'expedition_expedition-graph-smoke_5bca58c1',
        target: 1005,
        optionalOpportunityCount: 54,
        gates: [
          'act_outer_rim:interActJunction',
          'act_core_descent:frontierChoice',
          'act_null_frontier:victory'
        ]
      }
    ]);
  });

  it('rejects duplicate nodes and broken graph references', () => {
    const graph = generateRunSkeleton('EXPEDITION-GRAPH-SMOKE').expedition;
    const firstNode = graph.nodes[0];
    if (!firstNode) throw new Error('Expected an expedition node.');
    const errors = validateExpeditionGraph({
      ...graph,
      startNodeId: 'expedition_missing_start',
      nodes: [
        ...graph.nodes,
        {
          ...firstNode,
          optional: true,
          nextNodeIds: ['expedition_missing_exit'],
          content: { ...firstNode.content, opportunityId: 'expedition_opportunity_missing' }
        }
      ]
    });
    expect(errors).toContain(`Duplicate expedition node id: ${firstNode.id}`);
    expect(errors).toContain(
      'Expedition graph references missing start node: expedition_missing_start'
    );
    expect(errors).toContain(
      `Expedition node ${firstNode.id} references missing exit node: expedition_missing_exit`
    );
    expect(errors).toContain(
      `Expedition node ${firstNode.id} references missing opportunity: expedition_opportunity_missing`
    );
  });
});
