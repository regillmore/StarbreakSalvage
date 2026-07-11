import {
  FACTION_RESPONSE_POLICIES,
  RIVAL_ARCHETYPES,
  RIVAL_NAME_PARTS,
  getFactionResponsePolicy,
  getRivalArchetype,
  type RivalArchetypeId,
  type RivalRecurrencePolicy,
  type RivalTactic
} from '../content/factionCampaigns';
import { FACTIONS, getFactionById, type FactionId } from '../content/factions';
import type { ItemTag } from '../content/items';
import { clamp } from '../core/math';
import { createRng } from '../core/rng';
import type { EnemySpawn } from './CombatState';
import type { SectorRoute } from './Generation';
import type { RouteCombatModifier } from './RouteEvents';

export type RivalStatus = 'planned' | 'engaged' | 'escaped' | 'captured' | 'destroyed';
export type RivalCombatOutcome = 'escaped' | 'captured' | 'destroyed';
export type CampaignMissionOutcome = 'success' | 'partialSuccess' | 'failure';

export interface RivalCaptainPlan {
  readonly id: string;
  readonly factionId: FactionId;
  readonly archetypeId: RivalArchetypeId;
  readonly name: string;
  readonly title: string;
  readonly shipName: string;
  readonly tactic: RivalTactic;
  readonly recurrencePolicy: RivalRecurrencePolicy;
  readonly firstSectorIndex: number;
  readonly recurrenceGapSectors: number;
  readonly maxAppearances: number;
  readonly upgradeSequence: readonly string[];
  readonly captureReward: { readonly credits: number; readonly salvage: number };
  readonly destructionReward: { readonly credits: number; readonly salvage: number };
  readonly rewardBiasTags: readonly ItemTag[];
}

export interface FactionCampaignPlan {
  readonly id: string;
  readonly seed: string;
  readonly saveFingerprint: string;
  readonly rivals: readonly RivalCaptainPlan[];
}

export interface FactionCampaignLedger {
  readonly factionId: FactionId;
  readonly aid: number;
  readonly hostility: number;
  readonly stolenAssets: number;
  readonly sparedTargets: number;
  readonly completedContracts: number;
  readonly territoryPressure: number;
  readonly majorMissionOutcomes: readonly string[];
}

export interface RivalCaptainState {
  readonly rivalId: string;
  readonly status: RivalStatus;
  readonly appearances: number;
  readonly injuries: readonly string[];
  readonly upgrades: readonly string[];
  readonly grudge: number;
  readonly lastEncounterSectorIndex: number | null;
  readonly nextEligibleSectorIndex: number;
  readonly rewardClaimed: boolean;
  readonly finaleIntervention: boolean;
}

export interface FactionCampaignHistoryEntry {
  readonly eventId: string;
  readonly sectorIndex: number;
  readonly label: string;
}

export interface FactionCampaignState {
  readonly planId: string;
  readonly ledgers: Readonly<Record<FactionId, FactionCampaignLedger>>;
  readonly rivals: readonly RivalCaptainState[];
  readonly processedEventIds: readonly string[];
  readonly history: readonly FactionCampaignHistoryEntry[];
}

interface CampaignEventBase {
  readonly id: string;
  readonly sectorIndex: number;
  readonly factionId: FactionId;
}

export type FactionCampaignEvent =
  | (CampaignEventBase & { readonly type: 'aid'; readonly amount: number; readonly reason: string })
  | (CampaignEventBase & { readonly type: 'assetStolen'; readonly value: number })
  | (CampaignEventBase & { readonly type: 'targetSpared'; readonly rivalId?: string })
  | (CampaignEventBase & { readonly type: 'contractCompleted'; readonly contractId: string })
  | (CampaignEventBase & {
      readonly type: 'missionOutcome';
      readonly outcome: CampaignMissionOutcome;
      readonly contractId: string;
    })
  | (CampaignEventBase & { readonly type: 'rivalEncounter'; readonly rivalId: string })
  | (CampaignEventBase & {
      readonly type: 'rivalOutcome';
      readonly rivalId: string;
      readonly outcome: RivalCombatOutcome;
    });

export interface FactionCampaignEventResult {
  readonly state: FactionCampaignState;
  readonly disposition: 'applied' | 'duplicate' | 'rejected';
  readonly reward: { readonly credits: number; readonly salvage: number };
  readonly label: string;
}

export interface RivalPresenceReadModel {
  readonly id: string;
  readonly name: string;
  readonly title: string;
  readonly shipName: string;
  readonly factionId: FactionId;
  readonly factionName: string;
  readonly tactic: RivalTactic;
  readonly status: RivalStatus;
  readonly appearance: number;
  readonly upgrades: readonly string[];
  readonly grudge: number;
  readonly cue: string;
}

export interface FactionCampaignInfluence {
  readonly factionId: FactionId;
  readonly factionName: string;
  readonly responseLabel: string;
  readonly aid: number;
  readonly hostility: number;
  readonly territoryPressure: number;
  readonly enemyFactionId: FactionId;
  readonly enemyHullBonus: number;
  readonly enemyFireDelayMultiplier: number;
  readonly bossHullBonus: number;
  readonly shopDiscount: number;
  readonly shopBiasTags: readonly ItemTag[];
  readonly routePreview: string;
  readonly missionBrief: string;
  readonly crewOfferSignal: string | null;
  readonly setPieceOwnerFactionId: FactionId;
  readonly finaleIntervention: boolean;
  readonly rival: RivalPresenceReadModel | null;
}

export interface FactionCampaignDebugState {
  readonly planId: string;
  readonly historyCount: number;
  readonly ledger: readonly string[];
  readonly rivals: readonly string[];
  readonly activeRival: string | null;
  readonly influence: string;
}

const MAX_CAMPAIGN_HISTORY = 64;
const MAX_PROCESSED_EVENTS = 128;

export function createFactionCampaignPlan(options: {
  readonly seed: string;
  readonly saveFingerprint: string;
  readonly sectorCount: number;
}): FactionCampaignPlan {
  const rng = createRng(`${options.seed}:faction-campaign:${options.saveFingerprint}`);
  const archetypes = rng.fork('archetypes').shuffle(RIVAL_ARCHETYPES);
  const remainingArchetypes = [...archetypes];
  const rivals = FACTIONS.map((faction, index): RivalCaptainPlan => {
    const preferredIndex = remainingArchetypes.findIndex((archetype) =>
      archetype.preferredFactionIds.includes(faction.id)
    );
    const fallbackIndex = remainingArchetypes.length > 0 ? index % remainingArchetypes.length : -1;
    const selectionIndex = preferredIndex >= 0 ? preferredIndex : fallbackIndex;
    const archetype =
      selectionIndex >= 0
        ? remainingArchetypes.splice(selectionIndex, 1)[0]
        : RIVAL_ARCHETYPES[index % RIVAL_ARCHETYPES.length];
    if (!archetype) throw new Error('Faction campaign requires rival archetypes.');
    const names = RIVAL_NAME_PARTS[faction.id];
    const rivalRng = rng.fork(`rival:${faction.id}:${archetype.id}`);
    const name = `${rivalRng.choice(names.callsigns)} ${rivalRng.choice(names.surnames)}`;
    const shipName = rivalRng.choice(archetype.shipNouns);

    return {
      id: `rival:${faction.id}:${archetype.id}`,
      factionId: faction.id,
      archetypeId: archetype.id,
      name,
      title: archetype.title,
      shipName,
      tactic: archetype.tactic,
      recurrencePolicy: archetype.recurrencePolicy,
      firstSectorIndex: Math.min(Math.max(1, index + 1), Math.max(1, options.sectorCount - 2)),
      recurrenceGapSectors: archetype.recurrenceGapSectors,
      maxAppearances: archetype.maxAppearances,
      upgradeSequence: rivalRng.fork('upgrades').shuffle(archetype.upgradeSequence),
      captureReward: archetype.captureReward,
      destructionReward: archetype.destructionReward,
      rewardBiasTags: archetype.rewardBiasTags
    };
  });

  return {
    id: `campaign:${options.seed}:${hashLabel(options.saveFingerprint)}`,
    seed: options.seed,
    saveFingerprint: options.saveFingerprint,
    rivals
  };
}

export function createFactionCampaignState(plan: FactionCampaignPlan): FactionCampaignState {
  return {
    planId: plan.id,
    ledgers: createInitialLedgers(),
    rivals: plan.rivals.map((rival) => ({
      rivalId: rival.id,
      status: 'planned',
      appearances: 0,
      injuries: [],
      upgrades: [],
      grudge: 0,
      lastEncounterSectorIndex: null,
      nextEligibleSectorIndex: rival.firstSectorIndex,
      rewardClaimed: false,
      finaleIntervention: false
    })),
    processedEventIds: [],
    history: []
  };
}

export function applyFactionCampaignEvent(
  plan: FactionCampaignPlan,
  state: FactionCampaignState,
  event: FactionCampaignEvent
): FactionCampaignEventResult {
  if (state.planId !== plan.id) {
    return { state, disposition: 'rejected', reward: emptyReward(), label: 'Campaign mismatch' };
  }

  if (state.processedEventIds.includes(event.id)) {
    return { state, disposition: 'duplicate', reward: emptyReward(), label: 'Duplicate event' };
  }

  const ledger = state.ledgers[event.factionId];
  if (!ledger) {
    return { state, disposition: 'rejected', reward: emptyReward(), label: 'Unknown faction' };
  }

  let ledgers = state.ledgers;
  let rivals = state.rivals;
  let reward = emptyReward();
  let label: string = event.type;

  if (event.type === 'aid') {
    ledgers = replaceLedger(ledgers, event.factionId, {
      aid: ledger.aid + Math.max(0, Math.floor(event.amount)),
      hostility: Math.max(0, ledger.hostility - 1)
    });
    label = `${getFactionById(event.factionId).name} aid: ${event.reason}`;
  } else if (event.type === 'assetStolen') {
    const policy = getFactionResponsePolicy(event.factionId);
    ledgers = replaceLedger(ledgers, event.factionId, {
      stolenAssets: ledger.stolenAssets + Math.max(1, Math.floor(event.value)),
      hostility: ledger.hostility + policy.stolenAssetWeight,
      territoryPressure: ledger.territoryPressure + 1
    });
    label = `${getFactionById(event.factionId).name} asset stolen`;
  } else if (event.type === 'targetSpared') {
    const policy = getFactionResponsePolicy(event.factionId);
    ledgers = replaceLedger(ledgers, event.factionId, {
      sparedTargets: ledger.sparedTargets + 1,
      aid: ledger.aid + policy.sparedTargetWeight
    });
    label = `${getFactionById(event.factionId).name} target spared`;
  } else if (event.type === 'contractCompleted') {
    ledgers = replaceLedger(ledgers, event.factionId, {
      completedContracts: ledger.completedContracts + 1
    });
    label = `Contract ${event.contractId} recorded`;
  } else if (event.type === 'missionOutcome') {
    const policy = getFactionResponsePolicy(event.factionId);
    const success = event.outcome === 'success';
    ledgers = replaceLedger(ledgers, event.factionId, {
      hostility: Math.max(
        0,
        ledger.hostility + (success ? 1 : event.outcome === 'failure' ? -1 : 0)
      ),
      territoryPressure: clamp(
        ledger.territoryPressure + (success ? -1 : event.outcome === 'failure' ? 2 : 1),
        0,
        12
      ),
      majorMissionOutcomes: [
        ...ledger.majorMissionOutcomes,
        `${event.contractId}:${event.outcome}:${policy.id}`
      ].slice(-8)
    });
    label = `${getFactionById(event.factionId).name} mission ${event.outcome}`;
  } else if (event.type === 'rivalEncounter') {
    const index = rivals.findIndex((rival) => rival.rivalId === event.rivalId);
    const rival = rivals[index];
    const planRival = plan.rivals.find((candidate) => candidate.id === event.rivalId);
    if (
      !rival ||
      !planRival ||
      planRival.factionId !== event.factionId ||
      rival.status === 'captured' ||
      rival.status === 'destroyed'
    ) {
      return { state, disposition: 'rejected', reward, label: 'Rival unavailable' };
    }
    const next: RivalCaptainState = {
      ...rival,
      status: 'engaged',
      appearances: rival.appearances + 1,
      lastEncounterSectorIndex: event.sectorIndex
    };
    rivals = replaceAt(rivals, index, next);
    label = `${planRival.name} encountered aboard ${planRival.shipName}`;
  } else if (event.type === 'rivalOutcome') {
    const resolved = resolveRivalOutcome(plan, rivals, ledgers, event);
    if (!resolved) {
      return { state, disposition: 'rejected', reward, label: 'Rival outcome rejected' };
    }
    rivals = resolved.rivals;
    ledgers = resolved.ledgers;
    reward = resolved.reward;
    label = resolved.label;
  }

  return {
    state: {
      ...state,
      ledgers,
      rivals,
      processedEventIds: [...state.processedEventIds, event.id].slice(-MAX_PROCESSED_EVENTS),
      history: [
        ...state.history,
        { eventId: event.id, sectorIndex: event.sectorIndex, label }
      ].slice(-MAX_CAMPAIGN_HISTORY)
    },
    disposition: 'applied',
    reward,
    label
  };
}

export function foldFactionCampaignEvents(
  plan: FactionCampaignPlan,
  events: readonly FactionCampaignEvent[]
): FactionCampaignState {
  return events.reduce(
    (state, event) => applyFactionCampaignEvent(plan, state, event).state,
    createFactionCampaignState(plan)
  );
}

export function getFactionCampaignInfluence(
  plan: FactionCampaignPlan,
  state: FactionCampaignState,
  sector: Pick<SectorRoute, 'index' | 'bossFactionId' | 'objective' | 'setPiece'>
): FactionCampaignInfluence {
  const sectorIndex = Math.max(0, sector.index - 1);
  const rival = getRivalForSector(plan, state, sectorIndex);
  const factionId = rival?.factionId ?? sector.bossFactionId;
  const ledger = state.ledgers[factionId];
  const faction = getFactionById(factionId);
  const policy = getFactionResponsePolicy(factionId);
  const hostilityPressure = Math.floor((ledger.hostility * policy.hostilityCombatWeight) / 4);
  const territoryPressure = Math.floor(
    (ledger.territoryPressure * policy.territoryPressureWeight) / 4
  );
  const rivalState = rival
    ? (state.rivals.find((candidate) => candidate.rivalId === rival.id) ?? null)
    : null;
  const finaleIntervention = Boolean(
    sector.objective.bossRequired && rivalState && rivalState.appearances > 0
  );
  const crewOfferSignal =
    ledger.aid >= policy.crewOfferThreshold
      ? `${faction.name} distress channel trusts this run (${ledger.aid} aid).`
      : null;

  return {
    factionId,
    factionName: faction.name,
    responseLabel: policy.label,
    aid: ledger.aid,
    hostility: ledger.hostility,
    territoryPressure: ledger.territoryPressure,
    enemyFactionId: factionId,
    enemyHullBonus: clamp(hostilityPressure + territoryPressure + (rival ? 1 : 0), 0, 5),
    enemyFireDelayMultiplier: clamp(1 - ledger.hostility * 0.018 - (rival ? 0.04 : 0), 0.78, 1),
    bossHullBonus: finaleIntervention ? Math.min(4, 1 + (rivalState?.upgrades.length ?? 0)) : 0,
    shopDiscount: clamp(
      Math.floor((ledger.aid * policy.aidShopWeight) / 4) - Math.floor(ledger.hostility / 3),
      -3,
      3
    ),
    shopBiasTags: getFactionCampaignBiasTags(factionId),
    routePreview: `${policy.routeCopy} Aid ${ledger.aid}; hostility ${ledger.hostility}; territory ${ledger.territoryPressure}.`,
    missionBrief: rival
      ? `${rival.name}, ${rival.title}, is flying ${rival.shipName} with ${rival.tactic} tactics.`
      : `${policy.label}: ${policy.summary}`,
    crewOfferSignal,
    setPieceOwnerFactionId: rival?.factionId ?? factionId,
    finaleIntervention,
    rival
  };
}

export function getRivalForSector(
  plan: FactionCampaignPlan,
  state: FactionCampaignState,
  sectorIndex: number
): RivalPresenceReadModel | null {
  const candidates = plan.rivals
    .map((rivalPlan) => ({
      plan: rivalPlan,
      state: state.rivals.find((candidate) => candidate.rivalId === rivalPlan.id)
    }))
    .filter((entry): entry is { plan: RivalCaptainPlan; state: RivalCaptainState } =>
      Boolean(entry.state)
    )
    .filter(({ plan: rivalPlan, state: rivalState }) => {
      if (rivalState.status === 'captured' || rivalState.status === 'destroyed') return false;
      if (rivalState.status === 'engaged' && rivalState.lastEncounterSectorIndex === sectorIndex) {
        return true;
      }
      if (rivalState.lastEncounterSectorIndex === sectorIndex) return false;
      if (sectorIndex >= 9 && rivalState.status === 'escaped' && rivalState.finaleIntervention) {
        return true;
      }
      if (rivalState.appearances >= rivalPlan.maxAppearances) return false;
      return sectorIndex >= rivalState.nextEligibleSectorIndex;
    })
    .sort(
      (left, right) =>
        Number(right.state.status === 'engaged') - Number(left.state.status === 'engaged') ||
        right.state.grudge - left.state.grudge ||
        left.state.nextEligibleSectorIndex - right.state.nextEligibleSectorIndex ||
        left.plan.id.localeCompare(right.plan.id)
    );
  const selected = candidates[0];
  return selected ? createRivalReadModel(selected.plan, selected.state) : null;
}

export function getEngagedRivalForSector(
  plan: FactionCampaignPlan,
  state: FactionCampaignState,
  sectorIndex: number
): RivalPresenceReadModel | null {
  const rivalState = state.rivals.find(
    (rival) => rival.status === 'engaged' && rival.lastEncounterSectorIndex === sectorIndex
  );
  const rivalPlan = rivalState
    ? plan.rivals.find((rival) => rival.id === rivalState.rivalId)
    : null;
  return rivalPlan && rivalState ? createRivalReadModel(rivalPlan, rivalState) : null;
}

export function getCapturableRivalForSector(
  plan: FactionCampaignPlan,
  state: FactionCampaignState,
  sectorIndex: number
): RivalPresenceReadModel | null {
  const rivalState = state.rivals.find(
    (rival) => rival.status === 'escaped' && rival.lastEncounterSectorIndex === sectorIndex
  );
  const rivalPlan = rivalState
    ? plan.rivals.find((rival) => rival.id === rivalState.rivalId)
    : null;
  return rivalPlan && rivalState ? createRivalReadModel(rivalPlan, rivalState) : null;
}

export function createRivalEnemySpawn(
  influence: FactionCampaignInfluence,
  sectorIndex: number,
  scrollLength: number
): EnemySpawn | null {
  const rival = influence.rival;
  if (!rival || rival.status !== 'engaged') return null;
  const archetype = getRivalArchetype(rival.id.split(':').at(-1) as RivalArchetypeId);
  const rng = createRng(`${rival.id}:appearance:${rival.appearance}:sector:${sectorIndex}`);
  const retreatAtHullRatio =
    rival.appearance === 1
      ? archetype.firstRetreatHullRatio
      : rival.appearance < 3 && archetype.recurrencePolicy === 'injuryAdaptation'
        ? 0.14
        : 0;

  return {
    atSeconds: 0,
    atDistance: Math.round(scrollLength * (0.5 + rng.int(0, 8) / 100)),
    waveIndex: 950,
    waveLabel: `${rival.name} aboard ${rival.shipName}`,
    xRatio: rng.int(24, 76) / 100,
    targetY: 128,
    hull: archetype.baseHull + rival.upgrades.length * 2 + Math.min(3, rival.grudge),
    fireDelay: 1.05 * archetype.fireDelayMultiplier,
    factionId: rival.factionId,
    formationId: null,
    formationInstanceId: `rival-appearance:${rival.id}:${rival.appearance}`,
    formationLabel: `${rival.title} / ${rival.tactic}`,
    formationMemberIndex: 0,
    formationMemberCount: 1,
    countsForObjective: false,
    rivalId: rival.id,
    rivalName: rival.name,
    rivalTitle: rival.title,
    rivalShipName: rival.shipName,
    rivalTactic: rival.tactic,
    rivalRetreatAtHullRatio: retreatAtHullRatio
  };
}

export function createFactionCampaignCombatModifier(
  influence: FactionCampaignInfluence,
  targetSectorIndex: number
): RouteCombatModifier {
  return {
    targetSectorIndex,
    label: `${influence.responseLabel}${influence.rival ? ` / ${influence.rival.name}` : ''}`,
    enemyHullBonus: influence.enemyHullBonus,
    enemyFireDelayMultiplier: influence.enemyFireDelayMultiplier,
    bossHullBonus: influence.bossHullBonus
  };
}

export function createFactionCampaignDebugState(
  plan: FactionCampaignPlan,
  state: FactionCampaignState,
  influence?: FactionCampaignInfluence | null
): FactionCampaignDebugState {
  return {
    planId: plan.id,
    historyCount: state.history.length,
    ledger: FACTIONS.map((faction) => {
      const ledger = state.ledgers[faction.id];
      return `${faction.name}:A${ledger.aid}/H${ledger.hostility}/S${ledger.stolenAssets}/P${ledger.sparedTargets}/T${ledger.territoryPressure}`;
    }),
    rivals: plan.rivals.map((rivalPlan) => {
      const rival = state.rivals.find((candidate) => candidate.rivalId === rivalPlan.id);
      return `${rivalPlan.name}:${rival?.status ?? 'missing'}@${rival?.appearances ?? 0}+${rival?.upgrades.length ?? 0}`;
    }),
    activeRival: influence?.rival
      ? `${influence.rival.name}/${influence.rival.shipName}/${influence.rival.status}`
      : null,
    influence: influence
      ? `${influence.factionName} A${influence.aid} H${influence.hostility} T${influence.territoryPressure} combat+${influence.enemyHullBonus} shop${influence.shopDiscount >= 0 ? '-' : '+'}${Math.abs(influence.shopDiscount)}`
      : 'no sector influence'
  };
}

export function createDebugFactionCampaignState(plan: FactionCampaignPlan): FactionCampaignState {
  const scrapRival = plan.rivals.find((rival) => rival.factionId === 'faction_scrap_court');
  const events: FactionCampaignEvent[] = [
    {
      id: 'debug:ledger-aid',
      type: 'aid',
      sectorIndex: 0,
      factionId: 'faction_corporate_ledger',
      amount: 4,
      reason: 'debug permit convoy'
    },
    {
      id: 'debug:scrap-theft',
      type: 'assetStolen',
      sectorIndex: 0,
      factionId: 'faction_scrap_court',
      value: 2
    },
    {
      id: 'debug:bloom-spared',
      type: 'targetSpared',
      sectorIndex: 0,
      factionId: 'faction_bloom_hive'
    }
  ];
  if (scrapRival) {
    events.push({
      id: 'debug:scrap-rival-encounter',
      type: 'rivalEncounter',
      sectorIndex: 0,
      factionId: scrapRival.factionId,
      rivalId: scrapRival.id
    });
    events.push({
      id: 'debug:scrap-rival-escape',
      type: 'rivalOutcome',
      sectorIndex: 0,
      factionId: scrapRival.factionId,
      rivalId: scrapRival.id,
      outcome: 'escaped'
    });
  }
  return foldFactionCampaignEvents(plan, events);
}

export function formatFactionCampaignSummary(
  plan: FactionCampaignPlan,
  state: FactionCampaignState
): string {
  const factionSummary = FACTIONS.map((faction) => {
    const ledger = state.ledgers[faction.id];
    return `${faction.name} A${ledger.aid}/H${ledger.hostility}/stolen ${ledger.stolenAssets}/spared ${ledger.sparedTargets}/territory ${ledger.territoryPressure}`;
  }).join(' | ');
  const rivalSummary = plan.rivals
    .map((rivalPlan) => {
      const rival = state.rivals.find((candidate) => candidate.rivalId === rivalPlan.id);
      return `${rivalPlan.name} (${rivalPlan.title}) ${rival?.status ?? 'missing'} x${rival?.appearances ?? 0}${rival?.upgrades.length ? ` [${rival.upgrades.join(', ')}]` : ''}`;
    })
    .join(' | ');
  return `${factionSummary}. Rivals: ${rivalSummary}.`;
}

export function validateFactionCampaignContent(
  options: {
    readonly policies?: typeof FACTION_RESPONSE_POLICIES;
    readonly archetypes?: typeof RIVAL_ARCHETYPES;
    readonly nameParts?: typeof RIVAL_NAME_PARTS;
  } = {}
): string[] {
  const errors: string[] = [];
  const policies = options.policies ?? FACTION_RESPONSE_POLICIES;
  const archetypes = options.archetypes ?? RIVAL_ARCHETYPES;
  const nameParts = options.nameParts ?? RIVAL_NAME_PARTS;
  const factionIds = new Set(FACTIONS.map((faction) => faction.id));
  const policyFactions = new Set<FactionId>();
  const archetypeIds = new Set<string>();

  if (policies.length < 3) errors.push('At least three faction response policies are required.');
  if (archetypes.length < 4) errors.push('At least four rival archetypes are required.');

  for (const policy of policies) {
    if (policyFactions.has(policy.factionId))
      errors.push(`Duplicate faction response policy for ${policy.factionId}.`);
    policyFactions.add(policy.factionId);
    if (!factionIds.has(policy.factionId))
      errors.push(`Response policy ${policy.id} references an unknown faction.`);
    if (!policy.label.trim() || !policy.summary.trim())
      errors.push(`Response policy ${policy.id} needs readable copy.`);
  }

  for (const faction of FACTIONS) {
    if (!policyFactions.has(faction.id))
      errors.push(`Faction ${faction.id} has no response policy.`);
    if (nameParts[faction.id].callsigns.length < 3 || nameParts[faction.id].surnames.length < 3) {
      errors.push(`Faction ${faction.id} needs at least three rival name parts.`);
    }
  }

  for (const archetype of archetypes) {
    if (archetypeIds.has(archetype.id)) errors.push(`Duplicate rival archetype ${archetype.id}.`);
    archetypeIds.add(archetype.id);
    if (archetype.preferredFactionIds.some((factionId) => !factionIds.has(factionId))) {
      errors.push(`Rival archetype ${archetype.id} references an unknown faction.`);
    }
    if (archetype.maxAppearances < 2 || archetype.recurrenceGapSectors < 1) {
      errors.push(`Rival archetype ${archetype.id} has an invalid recurrence policy.`);
    }
    if (archetype.upgradeSequence.length < 2 || archetype.shipNouns.length < 2) {
      errors.push(`Rival archetype ${archetype.id} lacks ships or adaptations.`);
    }
  }

  return errors;
}

function resolveRivalOutcome(
  plan: FactionCampaignPlan,
  rivals: readonly RivalCaptainState[],
  ledgers: FactionCampaignState['ledgers'],
  event: Extract<FactionCampaignEvent, { type: 'rivalOutcome' }>
): {
  readonly rivals: readonly RivalCaptainState[];
  readonly ledgers: FactionCampaignState['ledgers'];
  readonly reward: { readonly credits: number; readonly salvage: number };
  readonly label: string;
} | null {
  const index = rivals.findIndex((rival) => rival.rivalId === event.rivalId);
  const rival = rivals[index];
  const rivalPlan = plan.rivals.find((candidate) => candidate.id === event.rivalId);
  if (!rival || !rivalPlan || rivalPlan.factionId !== event.factionId) return null;
  const captureAfterEscape =
    event.outcome === 'captured' &&
    rival.status === 'escaped' &&
    rival.lastEncounterSectorIndex === event.sectorIndex;
  if (rival.status !== 'engaged' && !captureAfterEscape) return null;

  const ledger = ledgers[event.factionId];
  if (event.outcome === 'escaped') {
    const upgrade = rivalPlan.upgradeSequence[rival.upgrades.length] ?? null;
    const next: RivalCaptainState = {
      ...rival,
      status: 'escaped',
      injuries: [...rival.injuries, `hull scar ${rival.appearances}`].slice(-4),
      upgrades: upgrade ? [...rival.upgrades, upgrade] : rival.upgrades,
      grudge: rival.grudge + 2,
      nextEligibleSectorIndex: event.sectorIndex + rivalPlan.recurrenceGapSectors,
      finaleIntervention: rival.appearances >= 2
    };
    return {
      rivals: replaceAt(rivals, index, next),
      ledgers: replaceLedger(ledgers, event.factionId, {
        sparedTargets: ledger.sparedTargets + 1,
        hostility: ledger.hostility + 1
      }),
      reward: emptyReward(),
      label: `${rivalPlan.name} escaped, adapted, and marked a return sector`
    };
  }

  const reward = rival.rewardClaimed
    ? emptyReward()
    : event.outcome === 'captured'
      ? rivalPlan.captureReward
      : rivalPlan.destructionReward;
  const next: RivalCaptainState = {
    ...rival,
    status: event.outcome,
    rewardClaimed: true,
    nextEligibleSectorIndex: Number.MAX_SAFE_INTEGER,
    finaleIntervention: false
  };
  return {
    rivals: replaceAt(rivals, index, next),
    ledgers: replaceLedger(ledgers, event.factionId, {
      aid: ledger.aid + (event.outcome === 'captured' ? 2 : 0),
      hostility: ledger.hostility + (event.outcome === 'destroyed' ? 2 : 0),
      territoryPressure: Math.max(0, ledger.territoryPressure - 1)
    }),
    reward,
    label: `${rivalPlan.name} ${event.outcome}; reward ${reward.credits}c/${reward.salvage}kg`
  };
}

function createRivalReadModel(
  plan: RivalCaptainPlan,
  state: RivalCaptainState
): RivalPresenceReadModel {
  const archetype = getRivalArchetype(plan.archetypeId);
  return {
    id: plan.id,
    name: plan.name,
    title: plan.title,
    shipName: plan.shipName,
    factionId: plan.factionId,
    factionName: getFactionById(plan.factionId).name,
    tactic: plan.tactic,
    status: state.status,
    appearance: state.appearances,
    upgrades: state.upgrades,
    grudge: state.grudge,
    cue: archetype.cue.glyph
  };
}

function createInitialLedgers(): Readonly<Record<FactionId, FactionCampaignLedger>> {
  return Object.fromEntries(
    FACTIONS.map((faction) => [
      faction.id,
      {
        factionId: faction.id,
        aid: 0,
        hostility: 0,
        stolenAssets: 0,
        sparedTargets: 0,
        completedContracts: 0,
        territoryPressure: 0,
        majorMissionOutcomes: []
      }
    ])
  ) as unknown as Readonly<Record<FactionId, FactionCampaignLedger>>;
}

function replaceLedger(
  ledgers: FactionCampaignState['ledgers'],
  factionId: FactionId,
  patch: Partial<Omit<FactionCampaignLedger, 'factionId'>>
): FactionCampaignState['ledgers'] {
  return { ...ledgers, [factionId]: { ...ledgers[factionId], ...patch } };
}

function replaceAt<T>(values: readonly T[], index: number, value: T): readonly T[] {
  return values.map((candidate, candidateIndex) => (candidateIndex === index ? value : candidate));
}

function getFactionCampaignBiasTags(factionId: FactionId): readonly ItemTag[] {
  if (factionId === 'faction_corporate_ledger') return ['credit', 'laser'];
  if (factionId === 'faction_scrap_court') return ['scrap', 'armor'];
  if (factionId === 'faction_bloom_hive') return ['plasma', 'drone'];
  return ['phase', 'missile'];
}

function emptyReward(): { readonly credits: number; readonly salvage: number } {
  return { credits: 0, salvage: 0 };
}

function hashLabel(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
