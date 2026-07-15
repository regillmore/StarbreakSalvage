import type { ActId } from '../content/acts';

export const ACT_ROUTE_LAYER_WIDTHS = [1, 2, 3, 2, 1] as const;
export const ACT_ROUTE_DEPTH = ACT_ROUTE_LAYER_WIDTHS.length;
export const ACT_ROUTE_NODE_COUNT = ACT_ROUTE_LAYER_WIDTHS.reduce(
  (total, width) => total + width,
  0
);

export type ActRouteDifficulty = 'entry' | 'easier' | 'standard' | 'harder' | 'finale';

export interface ActRouteGraphActSource {
  readonly id: ActId;
  readonly startSectorIndex: number;
  readonly endSectorIndex: number;
}

export interface ActRouteNode {
  readonly sectorIndex: number;
  readonly actId: ActId;
  readonly layerIndex: number;
  readonly laneIndex: number;
  readonly layerWidth: number;
  readonly nodeLabel: string;
  readonly difficulty: ActRouteDifficulty;
  readonly difficultyRank: number;
}

export interface ActRouteEdge {
  readonly sourceSectorIndex: number;
  readonly targetSectorIndex: number;
}

export interface ActRouteGraph {
  readonly id: string;
  readonly layerWidths: typeof ACT_ROUTE_LAYER_WIDTHS;
  readonly routeDepth: number;
  readonly nodesPerAct: number;
  readonly nodes: readonly ActRouteNode[];
  readonly edges: readonly ActRouteEdge[];
}

const LOCAL_EDGES: readonly (readonly [number, number])[] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
  [2, 4],
  [2, 5],
  [3, 6],
  [3, 7],
  [4, 6],
  [4, 7],
  [5, 6],
  [5, 7],
  [6, 8],
  [7, 8]
] as const;

const LOCAL_COORDINATES = ACT_ROUTE_LAYER_WIDTHS.flatMap((width, layerIndex) =>
  Array.from({ length: width }, (_, laneIndex) => ({ layerIndex, laneIndex, width }))
);

export function createActRouteGraph(
  seed: string,
  acts: readonly ActRouteGraphActSource[]
): ActRouteGraph {
  const nodes: ActRouteNode[] = [];
  const edges: ActRouteEdge[] = [];

  for (const act of acts) {
    const sectorCount = act.endSectorIndex - act.startSectorIndex + 1;
    if (sectorCount !== ACT_ROUTE_NODE_COUNT) {
      throw new Error(
        `Act route graph ${act.id} requires ${ACT_ROUTE_NODE_COUNT} nodes, received ${sectorCount}.`
      );
    }
    for (const [localIndex, coordinate] of LOCAL_COORDINATES.entries()) {
      nodes.push({
        sectorIndex: act.startSectorIndex + localIndex,
        actId: act.id,
        layerIndex: coordinate.layerIndex,
        laneIndex: coordinate.laneIndex,
        layerWidth: coordinate.width,
        nodeLabel: formatActRouteNodeLabel(coordinate.layerIndex, coordinate.laneIndex),
        ...getDifficulty(coordinate.layerIndex, coordinate.laneIndex)
      });
    }
    for (const [sourceOffset, targetOffset] of LOCAL_EDGES) {
      edges.push({
        sourceSectorIndex: act.startSectorIndex + sourceOffset,
        targetSectorIndex: act.startSectorIndex + targetOffset
      });
    }
  }

  return {
    id: `act-routes:${seed}:${acts.map((act) => act.id).join(':')}:1-2-3-2-1`,
    layerWidths: ACT_ROUTE_LAYER_WIDTHS,
    routeDepth: ACT_ROUTE_DEPTH,
    nodesPerAct: ACT_ROUTE_NODE_COUNT,
    nodes,
    edges
  };
}

export function getActRouteNode(
  graph: Pick<ActRouteGraph, 'nodes'>,
  sectorIndex: number
): ActRouteNode | null {
  return graph.nodes.find((node) => node.sectorIndex === sectorIndex) ?? null;
}

export function getNextActRouteSectorIndices(
  graph: Pick<ActRouteGraph, 'edges'>,
  sourceSectorIndex: number
): readonly number[] {
  return graph.edges
    .filter((edge) => edge.sourceSectorIndex === sourceSectorIndex)
    .map((edge) => edge.targetSectorIndex);
}

export function getDefaultActRoutePathSectorIndices(
  graph: Pick<ActRouteGraph, 'nodes' | 'edges'>
): readonly number[] {
  const path: number[] = [];
  const entries = graph.nodes.filter((node) => node.layerIndex === 0);
  for (const entry of entries) {
    let currentSectorIndex: number | undefined = entry.sectorIndex;
    while (currentSectorIndex !== undefined) {
      path.push(currentSectorIndex);
      currentSectorIndex = getNextActRouteSectorIndices(graph, currentSectorIndex)[0];
    }
  }
  return path;
}

export function isActRouteTransition(
  graph: Pick<ActRouteGraph, 'edges'>,
  sourceSectorIndex: number,
  targetSectorIndex: number
): boolean {
  return graph.edges.some(
    (edge) =>
      edge.sourceSectorIndex === sourceSectorIndex && edge.targetSectorIndex === targetSectorIndex
  );
}

export function getVisitedActRouteSectorIndices(options: {
  readonly graph: Pick<ActRouteGraph, 'nodes'>;
  readonly currentSectorIndex: number;
  readonly routeTargetSectorIndices?: readonly number[];
}): readonly number[] {
  const current = getActRouteNode(options.graph, options.currentSectorIndex);
  if (!current) return [];
  const reachedActIds = new Set(
    options.graph.nodes
      .filter((node) => node.sectorIndex <= options.currentSectorIndex && node.layerIndex === 0)
      .map((node) => node.actId)
  );
  const visited = new Set<number>([
    options.currentSectorIndex,
    ...(options.routeTargetSectorIndices ?? []),
    ...options.graph.nodes
      .filter((node) => node.layerIndex === 0 && reachedActIds.has(node.actId))
      .map((node) => node.sectorIndex)
  ]);
  return [...visited]
    .filter((sectorIndex) => getActRouteNode(options.graph, sectorIndex) !== null)
    .sort((left, right) => left - right);
}

export function formatActRouteNodeLabel(layerIndex: number, laneIndex: number): string {
  const layer = Math.max(0, Math.floor(layerIndex)) + 1;
  const lane = String.fromCharCode(65 + Math.max(0, Math.floor(laneIndex)));
  return `${layer}${lane}`;
}

export function getActRouteLocalNode(localIndex: number): Pick<
  ActRouteNode,
  | 'layerIndex'
  | 'laneIndex'
  | 'layerWidth'
  | 'nodeLabel'
  | 'difficulty'
  | 'difficultyRank'
> {
  const safeIndex = Math.max(0, Math.min(LOCAL_COORDINATES.length - 1, Math.floor(localIndex)));
  const coordinate = LOCAL_COORDINATES[safeIndex]!;
  return {
    layerIndex: coordinate.layerIndex,
    laneIndex: coordinate.laneIndex,
    layerWidth: coordinate.width,
    nodeLabel: formatActRouteNodeLabel(coordinate.layerIndex, coordinate.laneIndex),
    ...getDifficulty(coordinate.layerIndex, coordinate.laneIndex)
  };
}

export function getNextActRouteLocalIndices(localIndex: number): readonly number[] {
  return LOCAL_EDGES.filter(([source]) => source === localIndex).map(([, target]) => target);
}

function getDifficulty(
  layerIndex: number,
  laneIndex: number
): Pick<ActRouteNode, 'difficulty' | 'difficultyRank'> {
  if (layerIndex === 0) return { difficulty: 'entry', difficultyRank: 0 };
  if (layerIndex === ACT_ROUTE_DEPTH - 1) return { difficulty: 'finale', difficultyRank: 0 };
  if (layerIndex === 2 && laneIndex === 1) {
    return { difficulty: 'standard', difficultyRank: 0 };
  }
  return laneIndex === 0
    ? { difficulty: 'easier', difficultyRank: -1 }
    : { difficulty: 'harder', difficultyRank: 1 };
}
