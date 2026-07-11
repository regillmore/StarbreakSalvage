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
  acquireComponent,
  createEngineeringCombatProfile,
  createEngineeringState,
  generateComponentSalvage,
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
import {
  createFrontierDecisionState,
  resolveFrontierDecision,
  type FrontierDecision,
  type FrontierDecisionState
} from './NullFrontier';
import {
  applyCarrierCommand as reduceCarrierCommand,
  createCarrierInfluence,
  createCarrierState,
  resolveCarrierTransit,
  stowCarrierCargo as reduceCarrierCargo,
  type CarrierCargoEntry,
  type CarrierCommand,
  type CarrierCommandResult,
  type CarrierState
} from './CarrierCommand';
import {
  createBoardingCampaignState,
  settleBoardingOperation,
  type BoardingCampaignState,
  type BoardingOperationPlan,
  type BoardingSettlementResult
} from './BoardingOperation';
import {
  applyFactionFrontEvent,
  createFactionFrontInfluence,
  createFactionFrontState,
  type FactionFrontEvent,
  type FactionFrontEventResult,
  type FactionFrontPlan,
  type FactionFrontState
} from './FactionFront';

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
  frontierDecision: FrontierDecisionState;
  carrier: CarrierState;
  boarding: BoardingCampaignState;
  factionFronts: FactionFrontState;
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
  const actTwoSectorIndex =
    run.acts.find((act) => act.id === 'act_core_descent')?.endSectorIndex ??
    Math.max(0, run.sectors.length - 1);

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
    frontierDecision: createFrontierDecisionState(actTwoSectorIndex),
    carrier: createCarrierState(run.carrierPlan),
    boarding: createBoardingCampaignState(run.boardingCampaign),
    factionFronts: createFactionFrontState(run.factionFronts),
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

export function applyCarrierCommand(
  run: RunSkeleton,
  session: RunSessionState,
  command: CarrierCommand,
  eventId = `carrier-command:${session.currentSectorIndex}:${session.carrier.history.length}`
): CarrierCommandResult {
  if (command.kind === 'assignCrew') {
    const member = session.crewRoster.members.find(
      (candidate) => candidate.candidateId === command.candidateId
    );
    const alreadyAssigned = session.carrier.facilities.some(
      (facility) => facility.assignedCrewId === command.candidateId
    );
    if (member?.status !== 'active' || alreadyAssigned) {
      return {
        state: session.carrier,
        disposition: 'rejected',
        label: 'Crew member unavailable for carrier post',
        creditCost: 0,
        salvageCost: 0
      };
    }
  }
  const result = reduceCarrierCommand({
    plan: run.carrierPlan,
    state: session.carrier,
    eventId,
    sectorIndex: session.currentSectorIndex,
    command,
    availableCredits: session.credits,
    availableSalvage: session.salvage
  });
  if (result.disposition !== 'applied') return result;
  session.carrier = result.state;
  session.credits -= result.creditCost;
  session.salvage -= result.salvageCost;
  recordRunSessionTimelineEvent(session, {
    id: eventId,
    category: 'carrier',
    kind: command.kind,
    sectorIndex: session.currentSectorIndex,
    value: result.salvageCost,
    subjectId: run.carrierPlan.carrierId,
    detailId: result.label
  });
  recordFactionFrontEvent(session, run.factionFronts, {
    id: `${eventId}:front`,
    source: 'carrier',
    sectorIndex: session.currentSectorIndex,
    factionId: run.carrierPlan.liaisonFactionId,
    amount:
      command.kind === 'setPosture' && command.posture === 'assault'
        ? -1
        : command.kind === 'jettisonCargo'
          ? -1
          : 1,
    reason: `carrier ${command.kind} under ${session.carrier.posture} posture`
  });
  return result;
}

export function stowCarrierCargo(
  run: RunSkeleton,
  session: RunSessionState,
  cargo: CarrierCargoEntry
): CarrierState {
  const next = reduceCarrierCargo({ plan: run.carrierPlan, state: session.carrier, cargo });
  if (next !== session.carrier) {
    session.carrier = next;
    recordRunSessionTimelineEvent(session, {
      id: `carrier-cargo:${cargo.id}`,
      category: 'carrier',
      kind: 'cargo',
      sectorIndex: cargo.sectorIndex,
      value: cargo.value,
      subjectId: cargo.id,
      detailId: cargo.kind
    });
  }
  return session.carrier;
}

export function applyFrontierDecision(
  session: RunSessionState,
  decision: Exclude<FrontierDecision, 'unresolved'>
): FrontierDecisionState {
  const previous = session.frontierDecision;
  const next = resolveFrontierDecision(previous, decision);
  if (next === previous) return previous;
  session.frontierDecision = next;
  session.credits += next.creditsAwarded;
  session.salvage += next.salvageAwarded;
  recordRunSessionTimelineEvent(session, {
    id: `frontier-decision:${decision}`,
    category: 'run',
    kind: decision,
    sectorIndex: previous.actTwoSectorIndex,
    value: next.salvageAwarded,
    subjectId: 'act_null_frontier',
    detailId: `${next.creditsAwarded}:${next.salvageAwarded}`
  });
  return next;
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

export function recordBoardingOperationOutcome(
  run: RunSkeleton,
  session: RunSessionState,
  operation: BoardingOperationPlan,
  options: {
    readonly eventId: string;
    readonly outcome: 'success' | 'partialSuccess' | 'failure';
    readonly completionRatio: number;
    readonly retreated: boolean;
  }
): BoardingSettlementResult {
  const settlement = settleBoardingOperation({
    plan: run.boardingCampaign,
    state: session.boarding,
    operation,
    ...options
  });
  if (settlement.disposition !== 'applied') return settlement;
  session.boarding = settlement.state;

  for (const loot of settlement.stowedLoot) {
    stowCarrierCargo(run, session, {
      id: loot.id,
      label: loot.label,
      kind: operation.integrations.includes('apex') ? 'specimen' : 'claim',
      size: loot.size,
      value: loot.value,
      sectorIndex: operation.sectorIndex
    });
  }

  if (operation.integrations.includes('foundry') && options.outcome !== 'failure') {
    const component = generateComponentSalvage({
      seed: run.seed,
      saveFingerprint: run.boardingCampaign.saveFingerprint,
      sectorIndex: operation.sectorIndex + 1,
      routeKind: 'vault',
      sectorId: run.sectors[operation.sectorIndex]?.sectorId ?? 'boarding',
      bossRequired: false,
      state: session.engineering
    });
    session.engineering = acquireComponent(session.engineering, component);
    stowCarrierCargo(run, session, {
      id: component.id,
      label: `${operation.title} component`,
      kind: 'component',
      size: 1,
      value: component.salvageValue,
      sectorIndex: operation.sectorIndex
    });
    recordRunSessionTimelineEvent(session, {
      id: `${options.eventId}:foundry:${component.id}`,
      category: 'engineering',
      kind: 'boardingRecipe',
      sectorIndex: operation.sectorIndex,
      value: component.salvageValue,
      subjectId: component.id,
      detailId: operation.contractId
    });
  }

  if (operation.integrations.includes('faction')) {
    const sector = run.sectors[operation.sectorIndex];
    if (sector) {
      const frontFactionId = createFactionFrontInfluence(
        run.factionFronts,
        session.factionFronts,
        operation.sectorIndex
      ).ownerFactionId;
      recordFactionCampaignEvent(session, run.factionCampaign, {
        id: `${options.eventId}:faction`,
        type: 'missionOutcome',
        sectorIndex: operation.sectorIndex,
        factionId: frontFactionId,
        contractId: operation.contractId,
        outcome: options.outcome
      }, run.factionFronts);
      recordFactionFrontEvent(session, run.factionFronts, {
        id: `${options.eventId}:boarding-front`,
        source: 'boarding',
        sectorIndex: operation.sectorIndex,
      factionId: sector.bossFactionId,
        amount: options.outcome === 'failure' ? 1 : options.outcome === 'success' ? -3 : -1,
        reason: `${operation.title} ${options.outcome}`
      });
    }
  }

  if (operation.integrations.includes('rival') && options.outcome === 'success') {
    const rival = run.factionCampaign.rivals.find((candidate) => {
      const state = session.factionCampaign.rivals.find((entry) => entry.rivalId === candidate.id);
      return state && state.status !== 'captured' && state.status !== 'destroyed';
    });
    if (rival) {
      recordFactionCampaignEvent(session, run.factionCampaign, {
        id: `${options.eventId}:rival-encounter:${rival.id}`,
        type: 'rivalEncounter',
        sectorIndex: operation.sectorIndex,
        factionId: rival.factionId,
        rivalId: rival.id
      }, run.factionFronts);
      recordFactionCampaignEvent(session, run.factionCampaign, {
        id: `${options.eventId}:rival-capture:${rival.id}`,
        type: 'rivalOutcome',
        sectorIndex: operation.sectorIndex,
        factionId: rival.factionId,
        rivalId: rival.id,
        outcome: 'captured'
      }, run.factionFronts);
    }
  }

  recordRunSessionTimelineEvent(session, {
    id: `${options.eventId}:boarding`,
    category: 'node',
    kind: options.retreated ? 'boardingRetreat' : `boarding${options.outcome}`,
    sectorIndex: operation.sectorIndex,
    value: settlement.stowedLoot.reduce((total, loot) => total + loot.value, 0),
    subjectId: operation.id,
    detailId: settlement.unlockedHooks.join('|') || null
  });
  return settlement;
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
  factionCampaignPlan?: FactionCampaignPlan,
  factionFrontPlan?: FactionFrontPlan
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
    recordRouteCampaignConsequence(
      session,
      factionCampaignPlan,
      sector,
      route,
      adjustedOutcome.id,
      factionFrontPlan
    );
  }
}

export function recordFactionCampaignEvent(
  session: RunSessionState,
  plan: FactionCampaignPlan,
  event: FactionCampaignEvent,
  factionFrontPlan?: FactionFrontPlan
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
    if (factionFrontPlan) {
      const frontEvent = mapCampaignEventToFrontEvent(event);
      if (frontEvent) recordFactionFrontEvent(session, factionFrontPlan, frontEvent);
    }
  }

  return result;
}

export function recordCrewRosterEvent(
  session: RunSessionState,
  plan: CrewRosterPlan,
  event: CrewRosterEvent,
  factionFrontPlan?: FactionFrontPlan
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
    if (factionFrontPlan && 'candidateId' in event && (event.type === 'recruit' || event.type === 'foundryAssist')) {
      const candidate = plan.candidates.find((entry) => entry.id === event.candidateId);
      if (candidate) {
        recordFactionFrontEvent(session, factionFrontPlan, {
          id: `${event.id}:crew-front`,
          source: 'crew',
          sectorIndex: event.sectorIndex,
          factionId: candidate.factionId,
          amount: 1,
          reason: `${event.type} tie with ${candidate.callsign}`
        });
      }
    }
  }
  return result;
}

export function recordFactionFrontEvent(
  session: RunSessionState,
  plan: FactionFrontPlan,
  event: FactionFrontEvent
): FactionFrontEventResult {
  const result = applyFactionFrontEvent(plan, session.factionFronts, event);
  session.factionFronts = result.state;
  if (result.disposition === 'applied') {
    recordRunSessionTimelineEvent(session, {
      id: `timeline:${event.id}`,
      category: 'faction',
      kind: `front:${event.source}`,
      sectorIndex: event.sectorIndex,
      value: result.movedFrontIds.length,
      subjectId: event.factionId,
      detailId: result.movedFrontIds.join('|') || null
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
  outcomeId: string,
  factionFrontPlan?: FactionFrontPlan
): void {
  if (route.kind === 'shop' || route.kind === 'repair') {
    recordFactionCampaignEvent(session, plan, {
      id: `${outcomeId}:campaign-aid`,
      type: 'aid',
      sectorIndex: Math.max(0, sector.index - 1),
      factionId: sector.bossFactionId,
      amount: 1,
      reason: route.kind === 'shop' ? 'market permit honored' : 'repair crew protected'
    }, factionFrontPlan);
    return;
  }

  if (route.kind === 'factionAmbush' || route.kind === 'vault') {
    recordFactionCampaignEvent(session, plan, {
      id: `${outcomeId}:campaign-theft`,
      type: 'assetStolen',
      sectorIndex: Math.max(0, sector.index - 1),
      factionId: sector.bossFactionId,
      value: route.kind === 'factionAmbush' ? 2 : 1
    }, factionFrontPlan);
  }
}

function mapCampaignEventToFrontEvent(event: FactionCampaignEvent): FactionFrontEvent | null {
  if (event.type === 'rivalEncounter') return null;
  const source =
    event.type === 'aid'
      ? 'aid'
      : event.type === 'assetStolen'
        ? 'theft'
        : event.type === 'targetSpared'
          ? 'sparedTarget'
          : event.type === 'rivalOutcome'
            ? 'rival'
            : 'contract';
  const amount =
    event.type === 'aid'
      ? Math.max(1, event.amount)
      : event.type === 'assetStolen'
        ? -Math.max(1, event.value)
        : event.type === 'targetSpared'
          ? 2
          : event.type === 'missionOutcome'
            ? event.outcome === 'failure'
              ? 1
              : event.outcome === 'success'
                ? -2
                : -1
            : event.type === 'rivalOutcome'
              ? event.outcome === 'escaped'
                ? -1
                : -3
              : 1;
  return {
    id: `${event.id}:front-fold`,
    source,
    sectorIndex: event.sectorIndex,
    factionId: event.factionId,
    amount,
    reason: event.type
  };
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

  session.carrier = resolveCarrierTransit(
    run.carrierPlan,
    session.carrier,
    session.currentSectorIndex
  );
  const carrierInfluence = createCarrierInfluence(run.carrierPlan, session.carrier);
  session.crewRoster = recoverEligibleCrew(
    run.crewRoster,
    session.crewRoster,
    session.currentSectorIndex + carrierInfluence.crewRecoveryAdvance
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
