import { createRng } from '../core/rng';
import {
  createActConstellationPlan,
  type ActConstellationPlan,
  type ActConstellationSource
} from './ActConstellation';
import type { RunSkeleton } from './Generation';
import {
  getActRouteNode,
  getNextActRouteSectorIndices
} from './ActRouteGraph';

export const SECTOR_NAVIGATION_DESTINATION_IDS = [
  'launch',
  'shop',
  'hardpoint',
  'fleet',
  'crew',
  'apex'
] as const;

export const SECTOR_NAVIGATION_SERVICE_IDS = [
  'shop',
  'hardpoint',
  'fleet',
  'crew',
  'apex'
] as const;

export type SectorNavigationDestinationId = (typeof SECTOR_NAVIGATION_DESTINATION_IDS)[number];
export type SectorNavigationServiceId = (typeof SECTOR_NAVIGATION_SERVICE_IDS)[number];

export interface SectorNavigationState {
  readonly sectorIndex: number;
  readonly visitedDestinationIds: readonly SectorNavigationDestinationId[];
}

export interface SectorNavigationDestination {
  readonly id: SectorNavigationServiceId;
  readonly label: string;
  readonly shortLabel: string;
  readonly deckLabel: string;
  readonly glyph: string;
  readonly summary: string;
  readonly actionLabel: string;
  readonly x: number;
  readonly y: number;
  readonly revealOrder: number;
  readonly available: boolean;
  readonly unavailableReason: string | null;
}

export interface SectorNavigationPlan {
  readonly id: string;
  readonly layoutId: string;
  readonly hubName: string;
  readonly localCode: string;
  readonly constellation: ActConstellationPlan;
  readonly destinations: readonly SectorNavigationDestination[];
}

export type SectorNavigationServiceLocks = Partial<Record<SectorNavigationServiceId, string>>;

interface NavigationSlot {
  readonly x: number;
  readonly y: number;
}

const DESTINATIONS: ReadonlyArray<
  Omit<SectorNavigationDestination, 'x' | 'y' | 'revealOrder' | 'available' | 'unavailableReason'>
> = [
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
    summary:
      'Assign recovered hardware at each mount, order the signal circuit, and inspect cargo separately.',
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
    summary: 'Track three seeded apex bounties, their pursuit steps, finale damage, and circuit spoils.',
    actionLabel: 'Open Bounty Board'
  }
];

const SERVICE_SLOTS: readonly NavigationSlot[] = [
  { x: 13, y: 27 },
  { x: 13, y: 55 },
  { x: 13, y: 82 },
  { x: 87, y: 36 },
  { x: 87, y: 74 }
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
  readonly run: Pick<RunSkeleton, 'seed' | 'acts' | 'sectors' | 'actRouteGraph'>;
  readonly sectorIndex: number;
  readonly visitedSectorIndices?: readonly number[];
  readonly choiceSectorIndices?: readonly number[];
  readonly serviceLocks?: SectorNavigationServiceLocks;
}): SectorNavigationPlan {
  const sectorIndex = sanitizeSectorIndex(options.sectorIndex);
  const sector = options.run.sectors[sectorIndex];
  if (!sector) throw new Error(`Navigation sector ${sectorIndex + 1} is unavailable.`);
  const act = options.run.acts.find((candidate) => candidate.id === sector.act.actId);
  if (!act) throw new Error(`Navigation act ${sector.act.actId} is unavailable.`);

  const constellationSource: ActConstellationSource = {
    id: act.id,
    index: act.index,
    label: act.label,
    shortLabel: act.shortLabel,
    summary: act.summary,
    sectors: options.run.sectors
      .slice(act.startSectorIndex, act.endSectorIndex + 1)
      .map((candidate) => {
        const candidateIndex = candidate.index - 1;
        const routeNode = getActRouteNode(options.run.actRouteGraph, candidateIndex);
        if (!routeNode) {
          throw new Error(`Navigation route node ${candidateIndex + 1} is unavailable.`);
        }
        return {
          id: candidate.sectorId,
          sectorIndex: candidateIndex,
          sectorName: candidate.sectorName,
          nodeLabel: routeNode.nodeLabel,
          layerIndex: routeNode.layerIndex,
          laneIndex: routeNode.laneIndex,
          difficulty: routeNode.difficulty,
          nextSectorIndices: getNextActRouteSectorIndices(
            options.run.actRouteGraph,
            candidateIndex
          )
        };
      })
  };
  const visitedSectorIndices = options.visitedSectorIndices ?? [sectorIndex];
  const choiceSectorIndices = options.choiceSectorIndices ?? [];
  const knownSectorIndices = new Set<number>([...visitedSectorIndices, ...choiceSectorIndices]);
  for (const visitedSectorIndex of visitedSectorIndices) {
    if (visitedSectorIndex === sectorIndex) continue;
    for (const targetSectorIndex of getNextActRouteSectorIndices(
      options.run.actRouteGraph,
      visitedSectorIndex
    )) {
      knownSectorIndices.add(targetSectorIndex);
    }
  }
  const constellation = createActConstellationPlan({
    seed: options.run.seed,
    act: constellationSource,
    currentSectorIndex: sectorIndex,
    visitedSectorIndices,
    knownSectorIndices: [...knownSectorIndices],
    choiceSectorIndices
  });
  const rng = createRng(`${options.run.seed}:navigation-services:${act.id}`);
  const serviceDefinitions = rng.fork('service-order').shuffle(DESTINATIONS);
  const destinations = serviceDefinitions.map((definition, index) =>
    resolveDestination(definition, SERVICE_SLOTS[index]!, index, options.serviceLocks)
  );
  const prefix = rng.fork('hub-prefix').choice(HUB_PREFIXES);
  const suffix = rng.fork('hub-suffix').choice(HUB_SUFFIXES);

  return {
    id: `navigation:${options.run.seed}:${act.id}`,
    layoutId: constellation.layoutId,
    hubName: `${prefix} ${suffix}`,
    localCode: constellation.localCode,
    constellation,
    destinations
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
  revealOrder: number,
  serviceLocks: SectorNavigationServiceLocks | undefined
): SectorNavigationDestination {
  const unavailableReason = serviceLocks?.[definition.id]?.trim() || null;
  return {
    ...definition,
    x: slot.x,
    y: slot.y,
    revealOrder,
    available: unavailableReason === null,
    unavailableReason
  };
}

function sanitizeSectorIndex(value: number): number {
  return Number.isInteger(value) && value >= 0 ? value : 0;
}
