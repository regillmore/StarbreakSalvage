import type { ItemId } from '../content/items';
import type { ShipStats } from '../content/ships';
import type { UnlockId } from '../content/unlocks';
import type { CombatRunResult } from './CombatState';
import type {
  RouteKind,
  RouteOption,
  RunSkeleton,
  SectorRoute,
  StartingContract
} from './Generation';
import { generateStartingItemLoadout, type ItemInstance } from './Rewards';
import type {
  AppliedRouteOutcome,
  RouteCombatModifier,
  RouteRewardModifier,
  RouteShopModifier
} from './RouteEvents';

export interface RouteHistoryEntry {
  readonly sectorIndex: number;
  readonly routeKind: RouteKind;
  readonly routeLabel: string;
  readonly outcomeTitle?: string;
  readonly outcomeSummary?: string;
}

export interface RunSessionState {
  currentSectorIndex: number;
  credits: number;
  salvage: number;
  hullPatch: number;
  curse: number;
  relicsRecovered: number;
  itemInstances: ItemInstance[];
  routeHistory: RouteHistoryEntry[];
  routeOutcomes: AppliedRouteOutcome[];
  shopRerollsBySector: Record<number, number>;
  lastCombatResult: CombatRunResult | null;
}

export function createRunSession(
  run: RunSkeleton,
  contract: StartingContract,
  options: { readonly unlockedIds?: readonly UnlockId[] } = {}
): RunSessionState {
  return {
    currentSectorIndex: 0,
    credits: contract.startingCredits,
    salvage: contract.startingSalvage,
    hullPatch: 0,
    curse: 0,
    relicsRecovered: 0,
    itemInstances: generateStartingItemLoadout(run.seed, contract, {
      unlockedIds: options.unlockedIds ?? run.unlockedIds
    }),
    routeHistory: [],
    routeOutcomes: [],
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
  route: RouteOption,
  outcome?: AppliedRouteOutcome
): void {
  session.routeHistory.push({
    sectorIndex: sector.index,
    routeKind: route.kind,
    routeLabel: route.label,
    outcomeTitle: outcome?.title,
    outcomeSummary: outcome?.summary
  });
}

export function applyRouteOutcome(
  session: RunSessionState,
  sector: SectorRoute,
  route: RouteOption,
  outcome: AppliedRouteOutcome
): void {
  recordRouteChoice(session, sector, route, outcome);

  session.credits = Math.max(0, session.credits + outcome.effects.creditsDelta);
  session.salvage = Math.max(0, session.salvage + outcome.effects.salvageDelta);
  session.hullPatch = Math.max(0, session.hullPatch + outcome.effects.hullPatchDelta);
  session.curse = Math.max(0, session.curse + outcome.effects.curseDelta);
  session.relicsRecovered = Math.max(0, session.relicsRecovered + outcome.effects.relicDelta);
  session.routeOutcomes = [...session.routeOutcomes, outcome];
}

export function getEffectiveShipStats(
  contract: StartingContract,
  session: RunSessionState
): ShipStats {
  return {
    ...contract.shipStats,
    maxHull: contract.shipStats.maxHull + session.hullPatch
  };
}

export function getCombatModifiersForSector(
  session: RunSessionState,
  sectorIndex: number
): RouteCombatModifier[] {
  return session.routeOutcomes.flatMap((outcome) => {
    const modifier = outcome.effects.combat;
    return modifier && modifier.targetSectorIndex === sectorIndex ? [modifier] : [];
  });
}

export function getRewardModifiersForSector(
  session: RunSessionState,
  sectorIndex: number
): RouteRewardModifier[] {
  return session.routeOutcomes
    .filter((outcome) => outcome.sectorIndex === sectorIndex)
    .map((outcome) => outcome.effects.reward);
}

export function getShopModifiersForSector(
  session: RunSessionState,
  sectorIndex: number
): RouteShopModifier[] {
  return session.routeOutcomes.flatMap((outcome) => {
    const modifier = outcome.effects.shop;
    return modifier && outcome.sectorIndex === sectorIndex ? [modifier] : [];
  });
}

export function getRouteCreditReward(session: RunSessionState, sectorIndex: number): number {
  const bonus = getRewardModifiersForSector(session, sectorIndex).reduce(
    (total, modifier) => total + modifier.creditBonus,
    0
  );

  return 6 + bonus;
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
