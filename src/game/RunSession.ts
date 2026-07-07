import type { ItemId } from '../content/items';
import type { ShipStats } from '../content/ships';
import type { UnlockId } from '../content/unlocks';
import type { CombatRunResult } from './CombatState';
import { applyItemHooks } from './ItemHooks';
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
  distanceTraveled: number;
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
    distanceTraveled: 0,
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
  session.distanceTraveled += result.distanceTraveled;
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
  const adjustedOutcome = applyRouteChosenHooks(session, sector, route, outcome);

  recordRouteChoice(session, sector, route, adjustedOutcome);

  session.credits = Math.max(0, session.credits + adjustedOutcome.effects.creditsDelta);
  session.salvage = Math.max(0, session.salvage + adjustedOutcome.effects.salvageDelta);
  session.hullPatch = Math.max(0, session.hullPatch + adjustedOutcome.effects.hullPatchDelta);
  session.curse = Math.max(0, session.curse + adjustedOutcome.effects.curseDelta);
  session.relicsRecovered = Math.max(
    0,
    session.relicsRecovered + adjustedOutcome.effects.relicDelta
  );
  session.routeOutcomes = [...session.routeOutcomes, adjustedOutcome];
}

function applyRouteChosenHooks(
  session: RunSessionState,
  sector: SectorRoute,
  route: RouteOption,
  outcome: AppliedRouteOutcome
): AppliedRouteOutcome {
  const payload = applyItemHooks('onRouteChosen', session.itemInstances, {
    routeKind: route.kind,
    sectorIndex: sector.index,
    creditsDelta: outcome.effects.creditsDelta,
    salvageDelta: outcome.effects.salvageDelta,
    hullPatchDelta: outcome.effects.hullPatchDelta,
    curseDelta: outcome.effects.curseDelta,
    relicDelta: outcome.effects.relicDelta,
    rewardChoiceBonus: outcome.effects.reward.choiceBonus,
    rewardCreditBonus: outcome.effects.reward.creditBonus,
    rewardBiasTags: outcome.effects.reward.biasTags,
    rewardPoolIdOverride: outcome.effects.reward.poolIdOverride,
    shopDiscount: outcome.effects.shop?.discount ?? 0,
    shopStockBonus: outcome.effects.shop?.stockBonus ?? 0,
    shopBiasTags: outcome.effects.shop?.biasTags ?? []
  });
  const hasShopPayload =
    outcome.effects.shop !== null ||
    payload.shopDiscount !== 0 ||
    payload.shopStockBonus !== 0 ||
    payload.shopBiasTags.length > 0;

  return {
    ...outcome,
    effects: {
      ...outcome.effects,
      creditsDelta: payload.creditsDelta,
      salvageDelta: payload.salvageDelta,
      hullPatchDelta: payload.hullPatchDelta,
      curseDelta: payload.curseDelta,
      relicDelta: payload.relicDelta,
      reward: {
        choiceBonus: payload.rewardChoiceBonus,
        creditBonus: payload.rewardCreditBonus,
        biasTags: payload.rewardBiasTags,
        poolIdOverride: payload.rewardPoolIdOverride
      },
      shop: hasShopPayload
        ? {
            discount: payload.shopDiscount,
            stockBonus: payload.shopStockBonus,
            biasTags: payload.shopBiasTags
          }
        : null
    }
  };
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
