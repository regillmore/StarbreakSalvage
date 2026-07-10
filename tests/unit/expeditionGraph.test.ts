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
  it('generates a validated two-act graph with stable mission contracts', () => {
    const run = generateRunSkeleton('EXPEDITION-GRAPH-SMOKE');
    const graph = run.expedition;

    expect(validateExpeditionGraph(graph)).toEqual([]);
    expect(graph.acts).toHaveLength(2);
    expect(graph.sectors).toHaveLength(10);
    expect(graph.nodes).toHaveLength(40);
    expect(graph.missionLegs).toHaveLength(40);
    expect(graph.branches).toHaveLength(10);
    expect(graph.gates.map((gate) => [gate.actId, gate.kind, gate.transitionKind])).toEqual([
      ['act_outer_rim', 'checkpoint', 'interActJunction'],
      ['act_core_descent', 'finale', 'victory']
    ]);
    expect(graph.startNodeId).toBe('expedition_s01_ingress');
    expect(graph.terminalNodeIds).toEqual(['expedition_s10_gate']);

    for (const node of graph.nodes) {
      expect(node.id).toMatch(/^expedition_s\d{2}_/);
      expect(node.profileId).toMatch(/^expedition_profile_/);
      expect(node.content.sectorId).toMatch(/^sector_/);
      expect(node.duration.minSeconds).toBeGreaterThan(0);
      expect(node.duration.targetSeconds).toBeGreaterThanOrEqual(node.duration.minSeconds);
      expect(node.duration.maxSeconds).toBeGreaterThanOrEqual(node.duration.targetSeconds);
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

    if (!branch || !detour) {
      throw new Error('Expected an expedition branch and optional detour.');
    }

    const progress = recordExpeditionDecision(
      graph,
      createExpeditionProgress(graph),
      branch.id,
      detour.id
    );
    const first = resolveExpeditionPath(graph, progress.decisions);
    const second = resolveExpeditionPath(graph, progress.decisions);
    const defaultPath = resolveExpeditionPath(graph);

    expect(first).toEqual(second);
    expect(first.nodeIds).toContain(detour.targetNodeId);
    expect(first.decisionOutcomeIds).toContain(detour.outcomeId);
    expect(first.targetSeconds).toBeGreaterThan(defaultPath.targetSeconds);
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
      'expedition_s01_gate',
      'expedition_s02_ingress'
    ]);
    expect(afterFirstSector.visitedNodeIds).not.toContain('expedition_s01_opportunity');
    expect(model.currentNodeId).toBe('expedition_s06_ingress');
    expect(model.visitedNodeCount).toBe(16);
    expect(model.visitedSectorCount).toBe(6);
  });

  it('provides 12-20 minutes of structural target capacity without changing combat speed', () => {
    const capacity = generateRunSkeleton('EXPEDITION-GRAPH-SMOKE').expedition.capacity;

    expect(capacity.requiredNodeCount).toBe(30);
    expect(capacity.optionalNodeCount).toBe(10);
    expect(capacity.baselineTargetSeconds).toBeGreaterThanOrEqual(12 * 60);
    expect(capacity.baselineTargetSeconds).toBeLessThanOrEqual(20 * 60);
    expect(capacity.expandedTargetSeconds).toBeGreaterThan(capacity.baselineTargetSeconds);
    expect(capacity.expandedTargetSeconds).toBeLessThanOrEqual(20 * 60);
  });

  it('keeps compact known-seed graph snapshots', () => {
    const snapshots = ['STARBREAK-SMOKE', 'LASER-TAX-404', 'EXPEDITION-GRAPH-SMOKE'].map((seed) => {
      const graph = generateRunSkeleton(seed).expedition;

      return {
        seed,
        id: graph.id,
        capacity: graph.capacity,
        opportunities: graph.nodes
          .filter((node) => node.optional)
          .map((node) => node.content.opportunityId),
        gates: graph.gates.map((gate) => ({
          actId: gate.actId,
          nodeId: gate.nodeId,
          kind: gate.kind,
          transition: gate.transitionKind
        }))
      };
    });

    expect(snapshots).toMatchInlineSnapshot(`
      [
        {
          "capacity": {
            "baselineMaxSeconds": 1326,
            "baselineMinSeconds": 612,
            "baselineTargetSeconds": 962,
            "expandedTargetSeconds": 1182,
            "optionalNodeCount": 10,
            "requiredNodeCount": 30,
          },
          "gates": [
            {
              "actId": "act_outer_rim",
              "kind": "checkpoint",
              "nodeId": "expedition_s05_gate",
              "transition": "interActJunction",
            },
            {
              "actId": "act_core_descent",
              "kind": "finale",
              "nodeId": "expedition_s10_gate",
              "transition": "victory",
            },
          ],
          "id": "expedition_starbreak-smoke_53f226d4",
          "opportunities": [
            "expedition_opportunity_salvage_sweep",
            "expedition_opportunity_field_cache",
            "expedition_opportunity_field_cache",
            "expedition_opportunity_salvage_sweep",
            "expedition_opportunity_black_box",
            "expedition_opportunity_salvage_sweep",
            "expedition_opportunity_field_cache",
            "expedition_opportunity_salvage_sweep",
            "expedition_opportunity_black_box",
            "expedition_opportunity_salvage_sweep",
          ],
          "seed": "STARBREAK-SMOKE",
        },
        {
          "capacity": {
            "baselineMaxSeconds": 1326,
            "baselineMinSeconds": 612,
            "baselineTargetSeconds": 962,
            "expandedTargetSeconds": 1182,
            "optionalNodeCount": 10,
            "requiredNodeCount": 30,
          },
          "gates": [
            {
              "actId": "act_outer_rim",
              "kind": "checkpoint",
              "nodeId": "expedition_s05_gate",
              "transition": "interActJunction",
            },
            {
              "actId": "act_core_descent",
              "kind": "finale",
              "nodeId": "expedition_s10_gate",
              "transition": "victory",
            },
          ],
          "id": "expedition_laser-tax-404_60d04233",
          "opportunities": [
            "expedition_opportunity_black_box",
            "expedition_opportunity_field_cache",
            "expedition_opportunity_black_box",
            "expedition_opportunity_black_box",
            "expedition_opportunity_black_box",
            "expedition_opportunity_black_box",
            "expedition_opportunity_salvage_sweep",
            "expedition_opportunity_black_box",
            "expedition_opportunity_salvage_sweep",
            "expedition_opportunity_field_cache",
          ],
          "seed": "LASER-TAX-404",
        },
        {
          "capacity": {
            "baselineMaxSeconds": 1326,
            "baselineMinSeconds": 612,
            "baselineTargetSeconds": 962,
            "expandedTargetSeconds": 1182,
            "optionalNodeCount": 10,
            "requiredNodeCount": 30,
          },
          "gates": [
            {
              "actId": "act_outer_rim",
              "kind": "checkpoint",
              "nodeId": "expedition_s05_gate",
              "transition": "interActJunction",
            },
            {
              "actId": "act_core_descent",
              "kind": "finale",
              "nodeId": "expedition_s10_gate",
              "transition": "victory",
            },
          ],
          "id": "expedition_expedition-graph-smoke_5bca58c1",
          "opportunities": [
            "expedition_opportunity_salvage_sweep",
            "expedition_opportunity_black_box",
            "expedition_opportunity_field_cache",
            "expedition_opportunity_salvage_sweep",
            "expedition_opportunity_field_cache",
            "expedition_opportunity_black_box",
            "expedition_opportunity_field_cache",
            "expedition_opportunity_salvage_sweep",
            "expedition_opportunity_black_box",
            "expedition_opportunity_salvage_sweep",
          ],
          "seed": "EXPEDITION-GRAPH-SMOKE",
        },
      ]
    `);
  });

  it('rejects duplicate nodes and broken graph references', () => {
    const graph = generateRunSkeleton('EXPEDITION-GRAPH-SMOKE').expedition;
    const firstNode = graph.nodes[0];

    if (!firstNode) {
      throw new Error('Expected an expedition node.');
    }

    const errors = validateExpeditionGraph({
      ...graph,
      startNodeId: 'expedition_missing_start',
      nodes: [
        ...graph.nodes,
        {
          ...firstNode,
          optional: true,
          nextNodeIds: ['expedition_missing_exit'],
          content: {
            ...firstNode.content,
            opportunityId: 'expedition_opportunity_missing'
          }
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
