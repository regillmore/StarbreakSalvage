import type { ItemId } from '../content/items';
import type { CombatRunResult } from './CombatState';
import type {
  RouteKind,
  RouteOption,
  RunSkeleton,
  SectorRoute,
  StartingContract
} from './Generation';
import { generateStartingItemLoadout, type ItemInstance } from './Rewards';

export interface RouteHistoryEntry {
  readonly sectorIndex: number;
  readonly routeKind: RouteKind;
  readonly routeLabel: string;
}

export interface RunSessionState {
  currentSectorIndex: number;
  credits: number;
  salvage: number;
  itemInstances: ItemInstance[];
  routeHistory: RouteHistoryEntry[];
  shopRerollsBySector: Record<number, number>;
  lastCombatResult: CombatRunResult | null;
}

const STARTING_CREDITS = 16;

export function createRunSession(run: RunSkeleton, contract: StartingContract): RunSessionState {
  return {
    currentSectorIndex: 0,
    credits: STARTING_CREDITS,
    salvage: 0,
    itemInstances: generateStartingItemLoadout(run.seed, contract),
    routeHistory: [],
    shopRerollsBySector: {},
    lastCombatResult: null
  };
}

export function getCurrentSector(run: RunSkeleton, session: RunSessionState): SectorRoute {
  const sector = run.sectors[session.currentSectorIndex];

  if (!sector) {
    throw new Error(`No sector exists at index ${session.currentSectorIndex}.`);
  }

  return sector;
}

export function isRunComplete(run: RunSkeleton, session: RunSessionState): boolean {
  return session.currentSectorIndex >= run.sectors.length;
}

export function recordSectorCombatResult(session: RunSessionState, result: CombatRunResult): void {
  session.lastCombatResult = result;
  session.credits += result.credits + Math.max(3, result.enemiesDestroyed * 3);
  session.salvage += result.salvage + Math.max(1, result.enemiesDestroyed);
}

export function recordRouteChoice(
  session: RunSessionState,
  sector: SectorRoute,
  route: RouteOption
): void {
  session.routeHistory.push({
    sectorIndex: sector.index,
    routeKind: route.kind,
    routeLabel: route.label
  });
}

export function addItemToSession(session: RunSessionState, itemId: ItemId): ItemInstance {
  const instance = {
    itemId,
    acquisitionOrder: session.itemInstances.length
  };

  session.itemInstances = [...session.itemInstances, instance];
  return instance;
}

export function getOwnedItemIds(session: RunSessionState): ItemId[] {
  return session.itemInstances.map((instance) => instance.itemId);
}

export function spendCredits(session: RunSessionState, amount: number): boolean {
  if (amount < 0) {
    throw new Error('Cannot spend a negative credit amount.');
  }

  if (session.credits < amount) {
    return false;
  }

  session.credits -= amount;
  return true;
}

export function addCredits(session: RunSessionState, amount: number): void {
  if (amount < 0) {
    throw new Error('Cannot add a negative credit amount.');
  }

  session.credits += amount;
}

export function getShopRerollCount(session: RunSessionState, sectorIndex: number): number {
  return session.shopRerollsBySector[sectorIndex] ?? 0;
}

export function incrementShopRerollCount(session: RunSessionState, sectorIndex: number): number {
  const nextCount = getShopRerollCount(session, sectorIndex) + 1;
  session.shopRerollsBySector = {
    ...session.shopRerollsBySector,
    [sectorIndex]: nextCount
  };

  return nextCount;
}

export function advanceSector(run: RunSkeleton, session: RunSessionState): boolean {
  session.currentSectorIndex += 1;
  return !isRunComplete(run, session);
}
