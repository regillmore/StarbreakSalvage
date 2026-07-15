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

  it('offers easier and harder destinations at every middle-layer fork', () => {
    const run = generateRunSkeleton('FORKING-CONSTELLATION');
    const graph = run.actRouteGraph;

    for (const act of run.acts) {
      const forkNodes = graph.nodes.filter(
        (node) =>
          node.actId === act.id &&
          node.layerIndex < ACT_ROUTE_DEPTH - 2
      );
      for (const source of forkNodes) {
        const difficulties = getNextActRouteSectorIndices(graph, source.sectorIndex)
          .map((sectorIndex) => getActRouteNode(graph, sectorIndex)?.difficulty)
          .sort();
        expect(difficulties).toEqual(['easier', 'harder']);
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
