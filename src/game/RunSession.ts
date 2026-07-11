import type { ItemId } from '../content/items';
import type { ShipStats } from '../content/ships';
import type { UnlockId } from '../content/unlocks';
import type { ActId } from '../content/acts';
import type { CombatRunResult } from './CombatState';
import {
  getActEconomyCombatCreditBonus,
  getActEconomyCombatSalvageBonus,
  type ActEconomyProfile
} from './ActEconomy';
import { applyCombinedHooks } from './CombinedHooks';
import {
  createEngineeringCombatProfile,
  createEngineeringState,
  type EngineeringState
} from './Foundry';
import type {
  RouteKind,
  RouteOption,
  RunSkeleton,
  SectorRoute,
  StartingContract
} from './Generation';
import {
  createExpeditionProgress,
  recordExpeditionDecision,
  type ExpeditionProgressState
} from './ExpeditionGraph';
import {
  createMissionDirectorState,
  createMissionSchedule,
  synchronizeExpeditionProgressWithMission,
  transitionMission,
  type MissionCheckpoint,
  type MissionDirectorState,
  type MissionEvent,
  type MissionSchedule,
  type MissionTransitionResult
} from './MissionDirector';
import type { MissionObjectiveResultSnapshot } from './ObjectiveDirector';
import {
  combineInterActEffects,
  createInterActChoiceRecord,
  type InterActChoice,
  type InterActChoiceRecord,
  type InterActEffectSummary
} from './InterActJunction';
import { generateStartingItemLoadout, type ItemInstance } from './Rewards';
import type {
  AppliedRouteOutcome,
  RouteCombatModifier,
  RouteRewardModifier,
  RouteShopModifier
} from './RouteEvents';
import {
  applyFactionCampaignEvent,
  createFactionCampaignState,
  type FactionCampaignEvent,
  type FactionCampaignEventResult,
  type FactionCampaignPlan,
  type FactionCampaignState
} from './FactionCampaign';
import {
  applyCrewRosterEvent,
  createCrewRosterState,
  recoverEligibleCrew,
  type CrewEventResult,
  type CrewRosterEvent,
  type CrewRosterPlan,
  type CrewRosterState
} from './CrewCommand';
import {
  createRunTimeline,
  recordRunTimelineEvent,
  type RunTimelineEvent,
  type RunTimelineState
} from './RunTimeline';
import {
  createOperationalProgressState,
  recordOperationBoundary,
  type OperationBoundaryResult,
  type OperationalOutcome,
  type OperationalProgressState
} from './OperationalMap';
import type { ExpeditionEncounterNode } from './ExpeditionTypes';

export interface RouteHistoryEntry {
  readonly sectorIndex: number;
  readonly actId?: ActId;
  readonly actName?: string;
  readonly actShortLabel?: string;
  readonly actIndex?: number;
  readonly actSectorIndex?: number;
  readonly actSectorCount?: number;
  readonly routeKind: RouteKind;
  readonly routeLabel: string;
  readonly routeTags?: readonly string[];
  readonly outcomeTitle?: string;
  readonly outcomeSummary?: string;
}

export interface RunSessionState {
  currentSectorIndex: number;
  expedition: ExpeditionProgressState;
  mission: MissionDirectorState;
  operational: OperationalProgressState;
  credits: number;
  salvage: number;
  distanceTraveled: number;
  hullPatch: number;
  curse: number;
  relicsRecovered: number;
  itemInstances: ItemInstance[];
  routeHistory: RouteHistoryEntry[];
  routeOutcomes: AppliedRouteOutcome[];
  interActChoices: InterActChoiceRecord[];
  shopRerollsBySector: Record<number, number>;
  lastCombatResult: CombatRunResult | null;
  objectiveHistory: MissionObjectiveOutcomeRecord[];
  engineering: EngineeringState;
  factionCampaign: FactionCampaignState;
  crewRoster: CrewRosterState;
  timeline: RunTimelineState;
}

export interface MissionObjectiveOutcomeRecord extends MissionObjectiveResultSnapshot {
  readonly sectorIndex: number;
  readonly actId: ActId;
  readonly reward: RouteRewardModifier;
  readonly salvageBonus: number;
  readonly cursePenalty: number;
}

export function createRunSession(
  run: RunSkeleton,
  contract: StartingContract,
  options: { readonly unlockedIds?: readonly UnlockId[] } = {}
): RunSessionState {
  const missionSchedule = createMissionSchedule(run.expedition, 0);
  const mission = createMissionDirectorState(missionSchedule, {
    credits: contract.startingCredits,
    salvage: contract.startingSalvage
  });
  const expedition = synchronizeExpeditionProgressWithMission(
    createExpeditionProgress(run.expedition),
    missionSchedule,
    mission
  );

  return {
    currentSectorIndex: 0,
    expedition,
    mission,
    operational: createOperationalProgressState(),
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
    interActChoices: [],
    shopRerollsBySector: {},
    lastCombatResult: null,
    objectiveHistory: [],
    engineering: createEngineeringState(contract.loadout),
    factionCampaign: createFactionCampaignState(run.factionCampaign),
    crewRoster: createCrewRosterState(run.crewRoster),
    timeline: recordRunTimelineEvent(createRunTimeline(), {
      id: `run-start:${run.seed}:${contract.id}`,
      category: 'run',
      kind: 'start',
      sectorIndex: 0,
      subjectId: contract.id,
      detailId: run.expedition.id
    })
  };
}

export function recordMissionOperationBoundary(
  session: RunSessionState,
  options: {
    readonly id: string;
    readonly node: ExpeditionEncounterNode;
    readonly outcome: OperationalOutcome;
    readonly checkpoint: MissionCheckpoint;
  }
): OperationBoundaryResult {
  const result = recordOperationBoundary(session.operational, options);
  session.operational = result.state;
  if (result.disposition === 'applied') {
    session.salvage += result.salvageAwarded;
    recordRunSessionTimelineEvent(session, {
      id: `operation-boundary:${options.id}`,
      category: 'node',
      kind: options.node.operationalRole,
      sectorIndex: options.node.sectorIndex,
      value: result.salvageAwarded,
      subjectId: options.node.id,
      detailId: result.consequence
    });
  }
  return result;
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

export function recordSectorCombatResult(
  session: RunSessionState,
  result: CombatRunResult,
  actEconomy?: ActEconomyProfile
): void {
  session.lastCombatResult = aggregateCombatRunResults(session.lastCombatResult, result);
  session.distanceTraveled += result.distanceTraveled;
  session.credits +=
    result.credits +
    Math.max(3, result.enemiesDestroyed * 3) +
    getActEconomyCombatCreditBonus(actEconomy, result);
  session.salvage +=
    result.salvage +
    Math.max(1, result.enemiesDestroyed) +
    getActEconomyCombatSalvageBonus(actEconomy, result);
  recordRunSessionTimelineEvent(session, {
    id: `combat:${session.currentSectorIndex}:${result.reason}:${session.mission.transitions.length}`,
    category: result.bossesDefeated > 0 ? 'boss' : 'duration',
    kind: result.bossesDefeated > 0 ? 'defeated' : 'combat',
    sectorIndex: session.currentSectorIndex,
    durationSeconds: result.survivedSeconds,
    value: result.enemiesDestroyed,
    subjectId: result.reason,
    detailId: result.crew ? `crew-${result.crew.members.length}` : null
  });
  recordRunSessionTimelineEvent(session, {
    id: `combat-economy:${session.currentSectorIndex}:${session.mission.transitions.length}`,
    category: 'economy',
    kind: 'combatReward',
    sectorIndex: session.currentSectorIndex,
    value: result.credits + result.salvage,
    subjectId: `credits-${result.credits}`,
    detailId: `salvage-${result.salvage}`
  });
}

export function aggregateCombatRunResults(
  previous: CombatRunResult | null,
  result: CombatRunResult
): CombatRunResult {
  if (!previous) return result;
  return {
    ...result,
    survivedSeconds: previous.survivedSeconds + result.survivedSeconds,
    distanceTraveled: previous.distanceTraveled + result.distanceTraveled,
    credits: previous.credits + result.credits,
    salvage: previous.salvage + result.salvage,
    enemiesDestroyed: previous.enemiesDestroyed + result.enemiesDestroyed,
    enemiesEscaped: (previous.enemiesEscaped ?? 0) + (result.enemiesEscaped ?? 0),
    bossesDefeated: previous.bossesDefeated + result.bossesDefeated,
    shotsFired: previous.shotsFired + result.shotsFired,
    pickupsCollected: previous.pickupsCollected + result.pickupsCollected,
    damageTaken: previous.damageTaken + result.damageTaken,
    itemTriggers: previous.itemTriggers + result.itemTriggers,
    itemNames: [...new Set([...previous.itemNames, ...result.itemNames])]
  };
}

export function recordMissionObjectiveOutcome(
  session: RunSessionState,
  schedule: MissionSchedule,
  result: CombatRunResult
): MissionObjectiveOutcomeRecord | null {
  const outcome = result.missionObjective;
  const contract = schedule.contract;
  if (!outcome || !contract) {
    return null;
  }

  const existing = session.objectiveHistory.find((record) => record.stageId === outcome.stageId);
  if (existing) {
    return existing;
  }

  const rewardRule = contract.rewardPolicy[outcome.outcome];
  const optionalBonus = outcome.optional && outcome.outcome === 'success' ? 1 : 0;
  const cursePenalty =
    outcome.outcome === 'failure' && contract.failurePolicy === 'continueWithPenalty' ? 1 : 0;
  const record: MissionObjectiveOutcomeRecord = {
    ...outcome,
    sectorIndex: schedule.sectorIndex,
    actId: schedule.contract.eligibleActIds[0]!,
    reward: {
      choiceBonus: rewardRule.choiceBonus + optionalBonus,
      creditBonus: rewardRule.creditBonus + optionalBonus,
      biasTags: rewardRule.biasTags,
      poolIdOverride: null
    },
    salvageBonus: rewardRule.salvageBonus + optionalBonus,
    cursePenalty
  };
  session.objectiveHistory = [...session.objectiveHistory, record];
  session.salvage += record.salvageBonus;
  session.curse += record.cursePenalty;
  recordRunSessionTimelineEvent(session, {
    id: `objective:${outcome.stageId}`,
    category: 'mission',
    kind: outcome.outcome,
    sectorIndex: schedule.sectorIndex,
    value: outcome.completionRatio,
    subjectId: outcome.contractId,
    detailId: outcome.objectiveId
  });
  return record;
}

export function recordRouteChoice(
  session: RunSessionState,
  sector: SectorRoute,
  route: RouteOption,
  outcome?: AppliedRouteOutcome
): void {
  session.routeHistory.push({
    sectorIndex: sector.index,
    actId: sector.act.actId,
    actName: sector.act.actName,
    actShortLabel: sector.act.actShortLabel,
    actIndex: sector.act.actIndex,
    actSectorIndex: sector.act.actSectorIndex,
    actSectorCount: sector.act.actSectorCount,
    routeKind: route.kind,
    routeLabel: route.label,
    routeTags: route.routeTags ?? [],
    outcomeTitle: outcome?.title,
    outcomeSummary: outcome?.summary
  });
}

export function applyRouteOutcome(
  session: RunSessionState,
  sector: SectorRoute,
  route: RouteOption,
  outcome: AppliedRouteOutcome,
  factionCampaignPlan?: FactionCampaignPlan
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
  recordRunSessionTimelineEvent(session, {
    id: `route:${adjustedOutcome.id}`,
    category: 'decision',
    kind: 'route',
    sectorIndex: Math.max(0, sector.index - 1),
    value: route.risk,
    subjectId: route.kind,
    detailId: adjustedOutcome.id
  });
  recordRunSessionTimelineEvent(session, {
    id: `route-economy:${adjustedOutcome.id}`,
    category: 'economy',
    kind: 'routeDelta',
    sectorIndex: Math.max(0, sector.index - 1),
    value: adjustedOutcome.effects.creditsDelta + adjustedOutcome.effects.salvageDelta,
    subjectId: `credits-${adjustedOutcome.effects.creditsDelta}`,
    detailId: `salvage-${adjustedOutcome.effects.salvageDelta}`
  });

  if (factionCampaignPlan) {
    recordRouteCampaignConsequence(session, factionCampaignPlan, sector, route, adjustedOutcome.id);
  }
}

export function recordFactionCampaignEvent(
  session: RunSessionState,
  plan: FactionCampaignPlan,
  event: FactionCampaignEvent
): FactionCampaignEventResult {
  const result = applyFactionCampaignEvent(plan, session.factionCampaign, event);
  session.factionCampaign = result.state;

  if (result.disposition === 'applied') {
    session.credits += result.reward.credits;
    session.salvage += result.reward.salvage;
    recordRunSessionTimelineEvent(session, {
      id: `timeline:${event.id}`,
      category:
        event.type === 'rivalEncounter' || event.type === 'rivalOutcome' ? 'rival' : 'faction',
      kind: event.type,
      sectorIndex: event.sectorIndex,
      value: result.reward.credits + result.reward.salvage,
      subjectId: event.factionId,
      detailId: 'rivalId' in event ? (event.rivalId ?? null) : null
    });
  }

  return result;
}

export function recordCrewRosterEvent(
  session: RunSessionState,
  plan: CrewRosterPlan,
  event: CrewRosterEvent
): CrewEventResult {
  const result = applyCrewRosterEvent(plan, session.crewRoster, event);
  session.crewRoster = result.state;
  if (result.disposition === 'applied') {
    recordRunSessionTimelineEvent(session, {
      id: `timeline:${event.id}`,
      category: 'crew',
      kind: event.type,
      sectorIndex: event.sectorIndex,
      subjectId: 'candidateId' in event ? event.candidateId : null,
      detailId: event.type === 'missionOutcome' ? event.outcome : null
    });
  }
  return result;
}

export function recordRunSessionTimelineEvent(
  session: RunSessionState,
  event: RunTimelineEvent
): void {
  session.timeline = recordRunTimelineEvent(session.timeline, event);
}

function recordRouteCampaignConsequence(
  session: RunSessionState,
  plan: FactionCampaignPlan,
  sector: SectorRoute,
  route: RouteOption,
  outcomeId: string
): void {
  if (route.kind === 'shop' || route.kind === 'repair') {
    recordFactionCampaignEvent(session, plan, {
      id: `${outcomeId}:campaign-aid`,
      type: 'aid',
      sectorIndex: Math.max(0, sector.index - 1),
      factionId: sector.bossFactionId,
      amount: 1,
      reason: route.kind === 'shop' ? 'market permit honored' : 'repair crew protected'
    });
    return;
  }

  if (route.kind === 'factionAmbush' || route.kind === 'vault') {
    recordFactionCampaignEvent(session, plan, {
      id: `${outcomeId}:campaign-theft`,
      type: 'assetStolen',
      sectorIndex: Math.max(0, sector.index - 1),
      factionId: sector.bossFactionId,
      value: route.kind === 'factionAmbush' ? 2 : 1
    });
  }
}

function applyRouteChosenHooks(
  session: RunSessionState,
  sector: SectorRoute,
  route: RouteOption,
  outcome: AppliedRouteOutcome
): AppliedRouteOutcome {
  const engineering = createEngineeringCombatProfile(session.engineering);
  const payload = applyCombinedHooks(
    'onRouteChosen',
    session.itemInstances,
    engineering.hooks,
    {
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
    },
    { maxApplications: engineering.procBudget }
  );
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
  return [
    ...session.routeOutcomes
      .filter((outcome) => outcome.sectorIndex === sectorIndex)
      .map((outcome) => outcome.effects.reward),
    ...session.objectiveHistory
      .filter((outcome) => outcome.sectorIndex === sectorIndex)
      .map((outcome) => outcome.reward)
  ];
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

export function applyInterActChoice(
  session: RunSessionState,
  choice: InterActChoice
): InterActChoiceRecord {
  const record = createInterActChoiceRecord(choice);

  session.credits = Math.max(0, session.credits + choice.effects.creditsDelta);
  session.salvage = Math.max(0, session.salvage + choice.effects.salvageDelta);
  session.hullPatch = Math.max(0, session.hullPatch + choice.effects.hullPatchDelta);
  session.curse = Math.max(0, session.curse + choice.effects.curseDelta);
  session.interActChoices = [...session.interActChoices, record];
  recordRunSessionTimelineEvent(session, {
    id: `inter-act:${record.id}`,
    category: 'decision',
    kind: 'interActRefit',
    sectorIndex: session.currentSectorIndex,
    value: choice.effects.creditsDelta + choice.effects.salvageDelta,
    subjectId: choice.id,
    detailId: choice.targetActId
  });
  return record;
}

export function hasInterActChoiceForSourceAct(
  session: RunSessionState,
  sourceActId: ActId
): boolean {
  return session.interActChoices.some((choice) => choice.sourceActId === sourceActId);
}

export function getInterActEffectsForSector(
  session: RunSessionState,
  sector: SectorRoute
): InterActEffectSummary {
  return combineInterActEffects(sector.act.actId, sector.act.actName, session.interActChoices);
}

export function getRouteCreditReward(
  session: RunSessionState,
  sectorIndex: number,
  actEconomy?: ActEconomyProfile
): number {
  const bonus = getRewardModifiersForSector(session, sectorIndex).reduce(
    (total, modifier) => total + modifier.creditBonus,
    0
  );

  return 6 + bonus + (actEconomy?.rewardCreditBonus ?? 0);
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
  if (isRunComplete(run, session)) {
    return false;
  }

  session.crewRoster = recoverEligibleCrew(
    run.crewRoster,
    session.crewRoster,
    session.currentSectorIndex
  );
  recordRunSessionTimelineEvent(session, {
    id: `sector-enter:${session.currentSectorIndex}`,
    category: 'node',
    kind: 'sectorEnter',
    sectorIndex: session.currentSectorIndex,
    subjectId: run.sectors[session.currentSectorIndex]?.sectorId ?? null,
    detailId: run.expedition.sectors[session.currentSectorIndex]?.sectorId ?? null
  });
  resetMissionForCurrentSector(run, session);
  return true;
}

export function resetMissionForCurrentSector(
  run: RunSkeleton,
  session: RunSessionState
): MissionDirectorState {
  const schedule = createMissionSchedule(run.expedition, session.currentSectorIndex);
  session.mission = createMissionDirectorState(schedule, {
    credits: session.credits,
    salvage: session.salvage
  });
  session.expedition = synchronizeExpeditionProgressWithMission(
    session.expedition,
    schedule,
    session.mission
  );
  return session.mission;
}

export function dispatchMissionEvent(
  run: RunSkeleton,
  session: RunSessionState,
  event: MissionEvent
): MissionTransitionResult {
  const schedule = createMissionSchedule(run.expedition, session.currentSectorIndex);
  const result = transitionMission(schedule, session.mission, event);
  session.mission = result.state;
  session.expedition = synchronizeExpeditionProgressWithMission(
    session.expedition,
    schedule,
    session.mission
  );
  if (result.disposition === 'advanced') {
    recordRunSessionTimelineEvent(session, {
      id: `mission-transition:${event.id}`,
      category: event.type === 'selectBranch' ? 'decision' : 'node',
      kind: event.type,
      sectorIndex: session.currentSectorIndex,
      subjectId: result.state.currentStageId,
      detailId: event.type === 'fail' ? event.reason : null
    });
  }
  return result;
}

export function recordExpeditionBranchDecision(
  run: RunSkeleton,
  session: RunSessionState,
  branchId: string,
  optionId: string
): void {
  session.expedition = recordExpeditionDecision(
    run.expedition,
    session.expedition,
    branchId,
    optionId
  );
  recordRunSessionTimelineEvent(session, {
    id: `expedition-decision:${branchId}:${optionId}`,
    category: 'decision',
    kind: 'branch',
    sectorIndex: session.currentSectorIndex,
    subjectId: branchId,
    detailId: optionId
  });
}
