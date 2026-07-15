import { describe, expect, it } from 'vitest';

import {
  ACT_ROUTE_DEPTH,
  ACT_ROUTE_NODE_COUNT,
  getActRouteNode,
  getNextActRouteSectorIndices,
  type ActRouteGraph
} from '../../src/game/ActRouteGraph';
import { generateRunSkeleton } from '../../src/game/Generation';

describe('ActRouteGraph', () => {
  it('builds a deterministic 1-2-3-2-1 graph for every act', () => {
    const run = generateRunSkeleton('FORKING-CONSTELLATION');
    const repeated = generateRunSkeleton('FORKING-CONSTELLATION');

    expect(run.actRouteGraph).toEqual(repeated.actRouteGraph);
    expect(run.actRouteGraph.layerWidths).toEqual([1, 2, 3, 2, 1]);
    expect(run.actRouteGraph.routeDepth).toBe(ACT_ROUTE_DEPTH);
    expect(run.actRouteGraph.nodesPerAct).toBe(ACT_ROUTE_NODE_COUNT);
    expect(run.actRouteGraph.nodes).toHaveLength(ACT_ROUTE_NODE_COUNT * 3);
  });

  it('fans the second layer through a shared standard 3B signal', () => {
    const run = generateRunSkeleton('FORKING-CONSTELLATION');
    const graph = run.actRouteGraph;

    for (const act of run.acts) {
      const nodes = graph.nodes.filter((node) => node.actId === act.id);
      const optionsFrom = (nodeLabel: string) =>
        getNextActRouteSectorIndices(
          graph,
          nodes.find((node) => node.nodeLabel === nodeLabel)!.sectorIndex
        ).map((sectorIndex) => {
          const node = getActRouteNode(graph, sectorIndex)!;
          return [node.nodeLabel, node.difficulty];
        });

      expect(optionsFrom('1A')).toEqual([
        ['2A', 'easier'],
        ['2B', 'harder']
      ]);
      expect(optionsFrom('2A')).toEqual([
        ['3A', 'easier'],
        ['3B', 'standard']
      ]);
      expect(optionsFrom('2B')).toEqual([
        ['3B', 'standard'],
        ['3C', 'harder']
      ]);
      for (const nodeLabel of ['3A', '3B', '3C']) {
        expect(optionsFrom(nodeLabel)).toEqual([
          ['4A', 'easier'],
          ['4B', 'harder']
        ]);
      }
    }
  });

  it('makes every legal route visit exactly five unique nodes without backtracking', () => {
    const run = generateRunSkeleton('FORKING-CONSTELLATION');
    const graph = run.actRouteGraph;

    for (const act of run.acts) {
      const entry = graph.nodes.find((node) => node.actId === act.id && node.layerIndex === 0)!;
      const paths = collectPaths(graph, [entry.sectorIndex]);

      expect(paths).toHaveLength(8);
      expect(
        new Set(paths.flat()).size
      ).toBe(ACT_ROUTE_NODE_COUNT);
      for (const path of paths) {
        expect(path).toHaveLength(ACT_ROUTE_DEPTH);
        expect(new Set(path).size).toBe(ACT_ROUTE_DEPTH);
        expect(path.map((sectorIndex) => getActRouteNode(graph, sectorIndex)?.layerIndex)).toEqual([
          0,
          1,
          2,
          3,
          4
        ]);
      }
    }
  });
});

function collectPaths(
  graph: ActRouteGraph,
  path: readonly number[]
): readonly (readonly number[])[] {
  const next = getNextActRouteSectorIndices(graph, path.at(-1)!);
  return next.length === 0
    ? [path]
    : next.flatMap((sectorIndex) => collectPaths(graph, [...path, sectorIndex]));
}
