import { createRng } from '../core/rng';

export type ActConstellationNodeStatus = 'completed' | 'current' | 'hidden' | 'choice';

export type ActConstellationEdgeStatus = 'completed' | 'hidden' | 'choice';

export interface ActConstellationSectorSource {
  readonly id: string;
  readonly sectorIndex: number;
  readonly sectorName: string;
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
      { x: 31, y: 17 },
      { x: 43, y: 34 },
      { x: 35, y: 51 },
      { x: 57, y: 68 },
      { x: 70, y: 84 }
    ]
  },
  {
    id: 'signal-zigzag',
    slots: [
      { x: 66, y: 17 },
      { x: 47, y: 33 },
      { x: 62, y: 50 },
      { x: 38, y: 67 },
      { x: 50, y: 84 }
    ]
  },
  {
    id: 'falling-crown',
    slots: [
      { x: 50, y: 16 },
      { x: 33, y: 34 },
      { x: 51, y: 50 },
      { x: 69, y: 67 },
      { x: 47, y: 84 }
    ]
  },
  {
    id: 'hollow-spiral',
    slots: [
      { x: 38, y: 17 },
      { x: 65, y: 33 },
      { x: 54, y: 50 },
      { x: 32, y: 68 },
      { x: 61, y: 84 }
    ]
  }
];

export function createActConstellationPlan(options: {
  readonly seed: string;
  readonly act: ActConstellationSource;
  readonly currentSectorIndex: number;
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
  const sectorNodes = options.act.sectors.map((sector, offset): ActConstellationNode => {
    const slot = layout.slots[offset]!;
    const status = getSectorStatus(offset, currentOffset);
    return {
      id: createSectorNodeId(sector.sectorIndex),
      kind: 'sector',
      sectorIndex: sector.sectorIndex,
      label: status === 'hidden' ? 'Uncharted signal' : sector.sectorName,
      shortLabel: status === 'hidden' ? 'Unknown' : `S${offset + 1} · ${sector.sectorName}`,
      summary: getSectorSummary(status, sector.sectorName, offset + 1, options.act.sectors.length),
      glyph: getSectorGlyph(status),
      x: clampPercent(slot.x + rng.fork(`sector-${offset}:x`).int(-2, 2)),
      y: clampPercent(slot.y + rng.fork(`sector-${offset}:y`).int(-1, 1)),
      status,
      stateLabel: getSectorStateLabel(status),
      revealOrder: offset,
      approachId: null,
      defaultApproach: false
    };
  });
  const currentNode = sectorNodes[currentOffset]!;
  const sectorEdges = sectorNodes.slice(1).map((node, offset): ActConstellationEdge => ({
    fromId: sectorNodes[offset]!.id,
    toId: node.id,
    status: getSectorEdgeStatus(offset + 1, currentOffset),
    revealOrder: offset
  }));
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
      defaultApproach: approach.default
    };
  });
}

function getSectorStatus(offset: number, currentOffset: number): ActConstellationNodeStatus {
  if (offset < currentOffset) return 'completed';
  if (offset === currentOffset) return 'current';
  return 'hidden';
}

function getSectorEdgeStatus(offset: number, currentOffset: number): ActConstellationEdgeStatus {
  if (offset <= currentOffset) return 'completed';
  return 'hidden';
}

function getSectorSummary(
  status: ActConstellationNodeStatus,
  sectorName: string,
  actSectorNumber: number,
  actSectorCount: number
): string {
  if (status === 'completed') return `${sectorName} is charted and settled for this run.`;
  if (status === 'current') return `${sectorName} is the active operation.`;
  return `Act sector ${actSectorNumber}/${actSectorCount} remains beyond reliable sensor range.`;
}

function getSectorGlyph(status: ActConstellationNodeStatus): string {
  if (status === 'completed') return '✓';
  if (status === 'current') return '◆';
  return '·';
}

function getSectorStateLabel(status: ActConstellationNodeStatus): string {
  if (status === 'completed') return 'CHARTED';
  if (status === 'current') return 'CURRENT';
  return 'UNRESOLVED';
}

function clampPercent(value: number): number {
  return Math.max(7, Math.min(93, value));
}
