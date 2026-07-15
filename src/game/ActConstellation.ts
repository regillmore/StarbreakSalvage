import { createRng } from '../core/rng';
import type { ActRouteDifficulty } from './ActRouteGraph';

export type ActConstellationNodeStatus =
  | 'completed'
  | 'current'
  | 'hidden'
  | 'choice'
  | 'bypassed';

export type ActConstellationEdgeStatus = 'completed' | 'hidden' | 'choice' | 'bypassed';

export interface ActConstellationSectorSource {
  readonly id: string;
  readonly sectorIndex: number;
  readonly sectorName: string;
  readonly nodeLabel: string;
  readonly layerIndex: number;
  readonly laneIndex: number;
  readonly difficulty: ActRouteDifficulty;
  readonly nextSectorIndices: readonly number[];
}

export interface ActConstellationSource {
  readonly id: string;
  readonly index: number;
  readonly label: string;
  readonly shortLabel: string;
  readonly summary: string;
  readonly sectors: readonly ActConstellationSectorSource[];
}

export interface ActConstellationApproachSource {
  readonly id: string;
  readonly label: string;
  readonly summary: string;
  readonly default: boolean;
}

export interface ActConstellationNode {
  readonly id: string;
  readonly kind: 'sector' | 'approach';
  readonly sectorIndex: number;
  readonly label: string;
  readonly shortLabel: string;
  readonly summary: string;
  readonly glyph: string;
  readonly x: number;
  readonly y: number;
  readonly status: ActConstellationNodeStatus;
  readonly stateLabel: string;
  readonly revealOrder: number;
  readonly approachId: string | null;
  readonly defaultApproach: boolean;
  readonly layerIndex: number;
  readonly laneIndex: number;
  readonly difficulty: ActRouteDifficulty;
}

export interface ActConstellationEdge {
  readonly fromId: string;
  readonly toId: string;
  readonly status: ActConstellationEdgeStatus;
  readonly revealOrder: number;
}

export interface ActConstellationPlan {
  readonly id: string;
  readonly actId: string;
  readonly actIndex: number;
  readonly actLabel: string;
  readonly actShortLabel: string;
  readonly actSummary: string;
  readonly layoutId: string;
  readonly localCode: string;
  readonly currentSectorNodeId: string;
  readonly nodes: readonly ActConstellationNode[];
  readonly edges: readonly ActConstellationEdge[];
}

interface ConstellationSlot {
  readonly x: number;
  readonly y: number;
}

interface ConstellationLayout {
  readonly id: string;
  readonly slots: readonly ConstellationSlot[];
}

const CONSTELLATION_LAYOUTS: readonly ConstellationLayout[] = [
  {
    id: 'broken-lance',
    slots: [
      { x: 50, y: 14 },
      { x: 38, y: 31 },
      { x: 63, y: 31 },
      { x: 29, y: 49 },
      { x: 50, y: 49 },
      { x: 71, y: 49 },
      { x: 39, y: 67 },
      { x: 62, y: 67 },
      { x: 50, y: 85 }
    ]
  },
  {
    id: 'signal-zigzag',
    slots: [
      { x: 48, y: 14 },
      { x: 36, y: 31 },
      { x: 61, y: 30 },
      { x: 28, y: 49 },
      { x: 49, y: 48 },
      { x: 70, y: 50 },
      { x: 37, y: 67 },
      { x: 63, y: 68 },
      { x: 51, y: 85 }
    ]
  },
  {
    id: 'falling-crown',
    slots: [
      { x: 52, y: 14 },
      { x: 40, y: 30 },
      { x: 65, y: 32 },
      { x: 30, y: 50 },
      { x: 51, y: 48 },
      { x: 72, y: 49 },
      { x: 40, y: 68 },
      { x: 64, y: 66 },
      { x: 49, y: 85 }
    ]
  },
  {
    id: 'hollow-spiral',
    slots: [
      { x: 50, y: 14 },
      { x: 37, y: 32 },
      { x: 64, y: 30 },
      { x: 29, y: 48 },
      { x: 50, y: 50 },
      { x: 72, y: 48 },
      { x: 38, y: 66 },
      { x: 63, y: 68 },
      { x: 50, y: 85 }
    ]
  }
];

export function createActConstellationPlan(options: {
  readonly seed: string;
  readonly act: ActConstellationSource;
  readonly currentSectorIndex: number;
  readonly visitedSectorIndices?: readonly number[];
  readonly knownSectorIndices?: readonly number[];
  readonly choiceSectorIndices?: readonly number[];
  readonly approaches?: readonly ActConstellationApproachSource[];
}): ActConstellationPlan {
  if (options.act.sectors.length === 0) {
    throw new Error(`Act constellation ${options.act.id} requires at least one sector.`);
  }
  if (options.act.sectors.length > CONSTELLATION_LAYOUTS[0]!.slots.length) {
    throw new Error(`Act constellation ${options.act.id} exceeds its sector capacity.`);
  }

  const currentOffset = options.act.sectors.findIndex(
    (sector) => sector.sectorIndex === options.currentSectorIndex
  );
  if (currentOffset < 0) {
    throw new Error(
      `Sector ${options.currentSectorIndex + 1} does not belong to act constellation ${options.act.id}.`
    );
  }

  const rng = createRng(`${options.seed}:act-constellation:${options.act.id}`);
  const layout = rng.fork('layout').choice(CONSTELLATION_LAYOUTS);
  const visited = new Set(options.visitedSectorIndices ?? [options.currentSectorIndex]);
  const known = new Set(options.knownSectorIndices ?? [options.currentSectorIndex]);
  const choices = new Set(options.choiceSectorIndices ?? []);
  known.add(options.currentSectorIndex);
  for (const sectorIndex of visited) known.add(sectorIndex);
  for (const sectorIndex of choices) known.add(sectorIndex);
  const currentLayerIndex = options.act.sectors[currentOffset]!.layerIndex;
  const sectorNodes = options.act.sectors.map((sector, offset): ActConstellationNode => {
    const slot = layout.slots[offset]!;
    const status = getSectorStatus(
      sector,
      options.currentSectorIndex,
      currentLayerIndex,
      visited,
      known,
      choices
    );
    return {
      id: createSectorNodeId(sector.sectorIndex),
      kind: 'sector',
      sectorIndex: sector.sectorIndex,
      label: status === 'hidden' ? 'Uncharted signal' : sector.sectorName,
      shortLabel: status === 'hidden' ? 'Unknown' : `${sector.nodeLabel} · ${sector.sectorName}`,
      summary: getSectorSummary(status, sector.sectorName, sector.nodeLabel),
      glyph: getSectorGlyph(status),
      x: clampPercent(slot.x + rng.fork(`sector-${offset}:x`).int(-1, 1)),
      y: clampPercent(slot.y + rng.fork(`sector-${offset}:y`).int(-1, 1)),
      status,
      stateLabel: getSectorStateLabel(status),
      revealOrder: offset,
      approachId: null,
      defaultApproach: false,
      layerIndex: sector.layerIndex,
      laneIndex: sector.laneIndex,
      difficulty: sector.difficulty
    };
  });
  const currentNode = sectorNodes[currentOffset]!;
  const sectorByIndex = new Map(sectorNodes.map((node) => [node.sectorIndex, node]));
  const sectorEdges = options.act.sectors.flatMap((sector, sourceOffset) =>
    sector.nextSectorIndices.flatMap((targetSectorIndex): readonly ActConstellationEdge[] => {
      const sourceNode = sectorByIndex.get(sector.sectorIndex);
      const targetNode = sectorByIndex.get(targetSectorIndex);
      if (!sourceNode || !targetNode) return [];
      return [
        {
          fromId: sourceNode.id,
          toId: targetNode.id,
          status: getSectorEdgeStatus(sourceNode, targetNode, visited, choices, known),
          revealOrder: sourceOffset
        }
      ];
    })
  );
  const approachNodes = createApproachNodes(currentNode, options.approaches ?? []);
  const approachEdges = approachNodes.map((node, index): ActConstellationEdge => ({
    fromId: currentNode.id,
    toId: node.id,
    status: 'choice',
    revealOrder: currentOffset + index + 1
  }));

  return {
    id: `constellation:${options.seed}:${options.act.id}`,
    actId: options.act.id,
    actIndex: options.act.index,
    actLabel: options.act.label,
    actShortLabel: options.act.shortLabel,
    actSummary: options.act.summary,
    layoutId: layout.id,
    localCode: `${options.act.shortLabel.replace(/[^a-z0-9]/gi, '').toUpperCase()}-${rng
      .fork('local-code')
      .int(11, 99)}`,
    currentSectorNodeId: currentNode.id,
    nodes: [...sectorNodes, ...approachNodes],
    edges: [...sectorEdges, ...approachEdges]
  };
}

export function createSectorNodeId(sectorIndex: number): string {
  return `sector:${Math.max(0, Math.floor(sectorIndex))}`;
}

function createApproachNodes(
  currentNode: ActConstellationNode,
  approaches: readonly ActConstellationApproachSource[]
): readonly ActConstellationNode[] {
  const verticalDirection = currentNode.y > 70 ? -1 : 1;
  const offsets: readonly ConstellationSlot[] = [
    { x: -18, y: 13 * verticalDirection },
    { x: 18, y: 13 * verticalDirection },
    { x: 0, y: 21 * verticalDirection }
  ];
  return approaches.map((approach, index) => {
    const offset = offsets[index] ?? {
      x: (index % 2 === 0 ? -1 : 1) * (15 + index * 2),
      y: (13 + index * 3) * verticalDirection
    };
    return {
      id: `approach:${approach.id}`,
      kind: 'approach',
      sectorIndex: currentNode.sectorIndex,
      label: approach.label,
      shortLabel: approach.label,
      summary: approach.summary,
      glyph: approach.default ? '◆' : '◇',
      x: clampPercent(currentNode.x + offset.x),
      y: clampPercent(currentNode.y + offset.y),
      status: 'choice',
      stateLabel: approach.default ? 'DIRECT' : 'OPTIONAL',
      revealOrder: currentNode.revealOrder + index + 1,
      approachId: approach.id,
      defaultApproach: approach.default,
      layerIndex: currentNode.layerIndex,
      laneIndex: currentNode.laneIndex,
      difficulty: currentNode.difficulty
    };
  });
}

function getSectorStatus(
  sector: ActConstellationSectorSource,
  currentSectorIndex: number,
  currentLayerIndex: number,
  visited: ReadonlySet<number>,
  known: ReadonlySet<number>,
  choices: ReadonlySet<number>
): ActConstellationNodeStatus {
  if (sector.sectorIndex === currentSectorIndex) return 'current';
  if (visited.has(sector.sectorIndex)) return 'completed';
  if (choices.has(sector.sectorIndex)) return 'choice';
  if (known.has(sector.sectorIndex) && sector.layerIndex <= currentLayerIndex) return 'bypassed';
  return 'hidden';
}

function getSectorEdgeStatus(
  source: ActConstellationNode,
  target: ActConstellationNode,
  visited: ReadonlySet<number>,
  choices: ReadonlySet<number>,
  known: ReadonlySet<number>
): ActConstellationEdgeStatus {
  if (visited.has(source.sectorIndex) && visited.has(target.sectorIndex)) return 'completed';
  if (source.status === 'current' && choices.has(target.sectorIndex)) return 'choice';
  if (known.has(source.sectorIndex) && known.has(target.sectorIndex)) return 'bypassed';
  return 'hidden';
}

function getSectorSummary(
  status: ActConstellationNodeStatus,
  sectorName: string,
  nodeLabel: string
): string {
  if (status === 'completed') return `${sectorName} is charted and settled for this run.`;
  if (status === 'current') return `${sectorName} is the active operation.`;
  if (status === 'choice') return `${sectorName} is open for route commitment.`;
  if (status === 'bypassed') return `${sectorName} was left behind by the committed path.`;
  return `Act signal ${nodeLabel} remains beyond reliable sensor range.`;
}

function getSectorGlyph(status: ActConstellationNodeStatus): string {
  if (status === 'completed') return '✓';
  if (status === 'current' || status === 'choice') return '◆';
  if (status === 'bypassed') return '×';
  return '·';
}

function getSectorStateLabel(status: ActConstellationNodeStatus): string {
  if (status === 'completed') return 'CHARTED';
  if (status === 'current') return 'CURRENT';
  if (status === 'choice') return 'READY';
  if (status === 'bypassed') return 'BYPASSED';
  return 'UNRESOLVED';
}

function clampPercent(value: number): number {
  return Math.max(7, Math.min(93, value));
}
