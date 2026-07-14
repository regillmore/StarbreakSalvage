import { createRng } from '../core/rng';

export const SECTOR_NAVIGATION_DESTINATION_IDS = [
  'launch',
  'shop',
  'hardpoint',
  'fleet',
  'crew',
  'apex'
] as const;

export type SectorNavigationDestinationId = (typeof SECTOR_NAVIGATION_DESTINATION_IDS)[number];

export interface SectorNavigationState {
  readonly sectorIndex: number;
  readonly visitedDestinationIds: readonly SectorNavigationDestinationId[];
}

export interface SectorNavigationDestination {
  readonly id: SectorNavigationDestinationId;
  readonly label: string;
  readonly shortLabel: string;
  readonly deckLabel: string;
  readonly glyph: string;
  readonly summary: string;
  readonly actionLabel: string;
  readonly x: number;
  readonly y: number;
  readonly available: boolean;
  readonly unavailableReason: string | null;
}

export interface SectorNavigationEdge {
  readonly fromId: SectorNavigationDestinationId;
  readonly toId: SectorNavigationDestinationId;
}

export interface SectorNavigationPlan {
  readonly id: string;
  readonly layoutId: string;
  readonly hubName: string;
  readonly localCode: string;
  readonly destinations: readonly SectorNavigationDestination[];
  readonly edges: readonly SectorNavigationEdge[];
}

export type SectorNavigationServiceLocks = Partial<Record<SectorNavigationDestinationId, string>>;

interface NavigationSlot {
  readonly x: number;
  readonly y: number;
}

interface NavigationLayout {
  readonly id: string;
  readonly launch: NavigationSlot;
  readonly services: readonly NavigationSlot[];
}

const DESTINATIONS: ReadonlyArray<
  Omit<SectorNavigationDestination, 'x' | 'y' | 'available' | 'unavailableReason'>
> = [
  {
    id: 'launch',
    label: 'Operation Airlock',
    shortLabel: 'Launch',
    deckLabel: 'Flight Spine 01',
    glyph: '▲',
    summary: 'Review the next operation, then leave the carrier and enter the sector.',
    actionLabel: 'Begin Operation'
  },
  {
    id: 'shop',
    label: 'Freehold Exchange',
    shortLabel: 'Shop',
    deckLabel: 'Market Ring',
    glyph: '◇',
    summary: 'Trade credits for seeded local stock and request a fresh market pull.',
    actionLabel: 'Visit Shop'
  },
  {
    id: 'hardpoint',
    label: 'Hardpoint Control',
    shortLabel: 'Hardpoint',
    deckLabel: 'Engineering Cradle',
    glyph: '⬡',
    summary: 'Fit recovered components, route upgrade sockets, and simulate the live loadout.',
    actionLabel: 'Open Hardpoint Control'
  },
  {
    id: 'fleet',
    label: 'Pocket Hangar',
    shortLabel: 'Fleet Bay',
    deckLabel: 'Auxiliary Berths',
    glyph: '✦',
    summary: 'Construct, refit, assign, and inspect support craft without leaving local orbit.',
    actionLabel: 'Enter Fleet Bay'
  },
  {
    id: 'crew',
    label: 'Crew Commons',
    shortLabel: 'Crew',
    deckLabel: 'Habitat Drum',
    glyph: '◎',
    summary: 'Review wingmates, relationships, recoveries, and unresolved personal arcs.',
    actionLabel: 'Visit Crew Quarters'
  },
  {
    id: 'apex',
    label: 'Signal Vault',
    shortLabel: 'Apex',
    deckLabel: 'Intelligence Well',
    glyph: '△',
    summary: 'Inspect marked apex contacts, evidence, subsystem damage, and disposition forecasts.',
    actionLabel: 'Open Apex Dossier'
  }
];

const LAYOUTS: readonly NavigationLayout[] = [
  {
    id: 'split-keel',
    launch: { x: 50, y: 11 },
    services: [
      { x: 19, y: 29 },
      { x: 78, y: 27 },
      { x: 32, y: 54 },
      { x: 70, y: 57 },
      { x: 48, y: 82 }
    ]
  },
  {
    id: 'spiral-dock',
    launch: { x: 54, y: 10 },
    services: [
      { x: 79, y: 29 },
      { x: 72, y: 64 },
      { x: 45, y: 83 },
      { x: 19, y: 61 },
      { x: 24, y: 28 }
    ]
  },
  {
    id: 'crosswind',
    launch: { x: 50, y: 9 },
    services: [
      { x: 18, y: 40 },
      { x: 50, y: 36 },
      { x: 81, y: 41 },
      { x: 32, y: 76 },
      { x: 68, y: 77 }
    ]
  },
  {
    id: 'long-orbit',
    launch: { x: 78, y: 13 },
    services: [
      { x: 45, y: 18 },
      { x: 18, y: 31 },
      { x: 29, y: 60 },
      { x: 58, y: 53 },
      { x: 74, y: 81 }
    ]
  }
];

const HUB_PREFIXES = ['Wayfinder', 'Morrow', 'Kepler', 'Glass', 'Cold', 'Pilgrim'] as const;
const HUB_SUFFIXES = ['Anchorage', 'Lantern', 'Spindle', 'Harbor', 'Relay', 'Crossing'] as const;

export function createSectorNavigationState(sectorIndex: number): SectorNavigationState {
  return {
    sectorIndex: sanitizeSectorIndex(sectorIndex),
    visitedDestinationIds: []
  };
}

export function synchronizeSectorNavigationState(
  state: SectorNavigationState,
  sectorIndex: number
): SectorNavigationState {
  const nextSectorIndex = sanitizeSectorIndex(sectorIndex);
  return state.sectorIndex === nextSectorIndex
    ? state
    : createSectorNavigationState(nextSectorIndex);
}

export function recordSectorNavigationVisit(
  state: SectorNavigationState,
  destinationId: SectorNavigationDestinationId
): SectorNavigationState {
  if (state.visitedDestinationIds.includes(destinationId)) return state;
  return {
    ...state,
    visitedDestinationIds: [...state.visitedDestinationIds, destinationId]
  };
}

export function createSectorNavigationPlan(options: {
  readonly seed: string;
  readonly sectorIndex: number;
  readonly serviceLocks?: SectorNavigationServiceLocks;
}): SectorNavigationPlan {
  const sectorIndex = sanitizeSectorIndex(options.sectorIndex);
  const rng = createRng(`${options.seed}:sector-navigation:${sectorIndex}`);
  const layout = rng.fork('layout').choice(LAYOUTS);
  const serviceSlots = layout.services.map((slot, index) => ({
    x: clampPercent(slot.x + rng.fork(`slot-${index}:x`).int(-2, 2)),
    y: clampPercent(slot.y + rng.fork(`slot-${index}:y`).int(-2, 2))
  }));
  const serviceDefinitions = rng
    .fork('service-order')
    .shuffle(DESTINATIONS.filter((destination) => destination.id !== 'launch'));
  const launch = DESTINATIONS.find((destination) => destination.id === 'launch')!;
  const destinations: SectorNavigationDestination[] = [
    resolveDestination(launch, layout.launch, options.serviceLocks),
    ...serviceDefinitions.map((definition, index) =>
      resolveDestination(definition, serviceSlots[index]!, options.serviceLocks)
    )
  ];
  const prefix = rng.fork('hub-prefix').choice(HUB_PREFIXES);
  const suffix = rng.fork('hub-suffix').choice(HUB_SUFFIXES);

  return {
    id: `navigation:${options.seed}:s${sectorIndex + 1}`,
    layoutId: layout.id,
    hubName: `${prefix} ${suffix}`,
    localCode: `${prefix.slice(0, 2).toUpperCase()}-${rng.fork('local-code').int(11, 99)}`,
    destinations,
    edges: createNavigationEdges(destinations)
  };
}

export function validateSectorNavigationState(state: SectorNavigationState): readonly string[] {
  const issues: string[] = [];
  if (!Number.isInteger(state.sectorIndex) || state.sectorIndex < 0) {
    issues.push('sector index must be a non-negative integer');
  }
  if (!Array.isArray(state.visitedDestinationIds)) {
    issues.push('visited destinations must be an array');
    return issues;
  }
  if (new Set(state.visitedDestinationIds).size !== state.visitedDestinationIds.length) {
    issues.push('visited destinations must be unique');
  }
  for (const id of state.visitedDestinationIds) {
    if (!SECTOR_NAVIGATION_DESTINATION_IDS.includes(id)) {
      issues.push(`unknown destination ${String(id)}`);
    }
  }
  return issues;
}

function resolveDestination(
  definition: (typeof DESTINATIONS)[number],
  slot: NavigationSlot,
  serviceLocks: SectorNavigationServiceLocks | undefined
): SectorNavigationDestination {
  const unavailableReason = serviceLocks?.[definition.id]?.trim() || null;
  return {
    ...definition,
    x: slot.x,
    y: slot.y,
    available: unavailableReason === null,
    unavailableReason
  };
}

function createNavigationEdges(
  destinations: readonly SectorNavigationDestination[]
): readonly SectorNavigationEdge[] {
  const connected = new Set<SectorNavigationDestinationId>(['launch']);
  const edges: SectorNavigationEdge[] = [];
  while (connected.size < destinations.length) {
    let nearest:
      | {
          readonly fromId: SectorNavigationDestinationId;
          readonly toId: SectorNavigationDestinationId;
          readonly distance: number;
        }
      | undefined;
    for (const from of destinations) {
      if (!connected.has(from.id)) continue;
      for (const to of destinations) {
        if (connected.has(to.id)) continue;
        const distance = Math.hypot(to.x - from.x, to.y - from.y);
        if (
          !nearest ||
          distance < nearest.distance ||
          (distance === nearest.distance &&
            `${from.id}:${to.id}` < `${nearest.fromId}:${nearest.toId}`)
        ) {
          nearest = { fromId: from.id, toId: to.id, distance };
        }
      }
    }
    if (!nearest) break;
    edges.push({ fromId: nearest.fromId, toId: nearest.toId });
    connected.add(nearest.toId);
  }
  return edges;
}

function clampPercent(value: number): number {
  return Math.max(8, Math.min(92, value));
}

function sanitizeSectorIndex(value: number): number {
  return Number.isInteger(value) && value >= 0 ? value : 0;
}
