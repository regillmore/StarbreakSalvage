import {
  FACTION_FRONT_KINDS,
  FACTION_FRONT_STANCES,
  FACTION_FRONT_STRATEGIES,
  getFactionFrontStrategy,
  type FactionFrontKind,
  type FactionFrontStance,
  type FactionFrontStrategyDefinition
} from '../content/factionFronts';
import { FACTIONS, getFactionById, type FactionId } from '../content/factions';
import { clamp } from '../core/math';
import { createRng } from '../core/rng';
import type { ExpeditionBranchOption, ExpeditionEncounterNode, ExpeditionOperationalRole } from './ExpeditionTypes';

export type FactionFrontEventSource =
  | 'aid'
  | 'theft'
  | 'contract'
  | 'sparedTarget'
  | 'rival'
  | 'boarding'
  | 'crew'
  | 'carrier';

export interface FactionFrontSectorPlan {
  readonly id: string;
  readonly sectorIndex: number;
  readonly initialFactionId: FactionId;
  readonly challengerFactionId: FactionId;
  readonly reserveRole: Extract<ExpeditionOperationalRole, 'detour' | 'pursuit'>;
  readonly baselineKind: FactionFrontKind;
  readonly setPieceContested: boolean;
}

export interface FactionFrontPlan {
  readonly id: string;
  readonly seed: string;
  readonly saveFingerprint: string;
  readonly sectors: readonly FactionFrontSectorPlan[];
}

export interface FactionFrontSectorState {
  readonly frontId: string;
  readonly influence: Readonly<Record<FactionId, number>>;
  readonly controllingFactionId: FactionId;
  readonly stance: FactionFrontStance;
  readonly kind: FactionFrontKind;
  readonly strategyLabel: string;
  readonly nodePolicy: FactionFrontStrategyDefinition['nodePolicy'];
  readonly revision: number;
}

export interface FactionFrontHistoryEntry {
  readonly eventId: string;
  readonly source: FactionFrontEventSource;
  readonly factionId: FactionId;
  readonly sectorIndex: number;
  readonly amount: number;
  readonly movedFrontIds: readonly string[];
  readonly label: string;
}

export interface FactionFrontState {
  readonly planId: string;
  readonly allegiance: Readonly<Record<FactionId, number>>;
  readonly sectors: readonly FactionFrontSectorState[];
  readonly processedEventIds: readonly string[];
  readonly history: readonly FactionFrontHistoryEntry[];
}

export interface FactionFrontEvent {
  readonly id: string;
  readonly source: FactionFrontEventSource;
  readonly sectorIndex: number;
  readonly factionId: FactionId;
  readonly amount: number;
  readonly reason: string;
}

export interface FactionFrontEventResult {
  readonly state: FactionFrontState;
  readonly disposition: 'applied' | 'duplicate' | 'rejected';
  readonly movedFrontIds: readonly string[];
  readonly label: string;
}

export interface FactionFrontInfluence {
  readonly frontId: string;
  readonly sectorIndex: number;
  readonly ownerFactionId: FactionId;
  readonly ownerFactionName: string;
  readonly stance: FactionFrontStance;
  readonly kind: FactionFrontKind;
  readonly strategyLabel: string;
  readonly mapCue: string;
  readonly forecast: string;
  readonly reserveRole: FactionFrontSectorPlan['reserveRole'];
  readonly nodePolicy: FactionFrontStrategyDefinition['nodePolicy'];
  readonly priceDelta: number;
  readonly hazardDensityDelta: number;
  readonly reinforcementCount: number;
  readonly supportCount: number;
  readonly crewAccess: boolean;
  readonly carrierAccess: boolean;
  readonly setPieceContested: boolean;
  readonly endingWeight: number;
}

export interface FactionFrontCampaignReadModel {
  readonly alliedCount: number;
  readonly hostileCount: number;
  readonly opportunistCount: number;
  readonly endingDisposition: 'coalition' | 'siege' | 'fractured';
  readonly endingLabel: string;
  readonly fronts: readonly string[];
  readonly summary: string;
}

export interface FactionFrontDebugState {
  readonly planId: string;
  readonly historyCount: number;
  readonly allegiance: readonly string[];
  readonly fronts: readonly string[];
  readonly current: string | null;
  readonly ending: string;
}

const MAX_FRONT_HISTORY = 64;
const MAX_FRONT_EVENTS = 128;

export function createFactionFrontPlan(options: {
  readonly seed: string;
  readonly saveFingerprint: string;
  readonly sectorCount: number;
}): FactionFrontPlan {
  const rng = createRng(`${options.seed}:faction-fronts:${options.saveFingerprint}`);
  const factionOrder = rng.fork('factions').shuffle(FACTIONS.map((faction) => faction.id));
  const kinds = rng.fork('kinds').shuffle(FACTION_FRONT_KINDS);
  const sectors = Array.from({ length: options.sectorCount }, (_, sectorIndex): FactionFrontSectorPlan => {
    const initialFactionId = factionOrder[sectorIndex % factionOrder.length]!;
    const challengerFactionId = factionOrder[(sectorIndex + 1 + (sectorIndex % 2)) % factionOrder.length]!;
    return {
      id: `front-s${String(sectorIndex + 1).padStart(2, '0')}`,
      sectorIndex,
      initialFactionId,
      challengerFactionId,
      reserveRole: sectorIndex % 2 === 0 ? 'detour' : 'pursuit',
      baselineKind: kinds[sectorIndex % kinds.length]!,
      setPieceContested: sectorIndex % 4 === 2
    };
  });
  return {
    id: `fronts:${options.seed}:${hashLabel(options.saveFingerprint)}`,
    seed: options.seed,
    saveFingerprint: options.saveFingerprint,
    sectors
  };
}

export function createFactionFrontState(plan: FactionFrontPlan): FactionFrontState {
  const allegiance = factionRecord(0);
  return {
    planId: plan.id,
    allegiance,
    sectors: plan.sectors.map((front) => createInitialFrontState(front)),
    processedEventIds: [],
    history: []
  };
}

export function applyFactionFrontEvent(
  plan: FactionFrontPlan,
  state: FactionFrontState,
  event: FactionFrontEvent
): FactionFrontEventResult {
  if (state.planId !== plan.id) return rejected(state, 'Faction front plan mismatch');
  if (state.processedEventIds.includes(event.id)) {
    return { state, disposition: 'duplicate', movedFrontIds: [], label: 'Duplicate front event' };
  }
  if (!FACTIONS.some((faction) => faction.id === event.factionId) || !Number.isFinite(event.amount)) {
    return rejected(state, 'Invalid faction front event');
  }
  const amount = clamp(Math.trunc(event.amount), -4, 4);
  const allegiance = {
    ...state.allegiance,
    [event.factionId]: clamp(state.allegiance[event.factionId] + amount, -12, 12)
  };
  const movedFrontIds: string[] = [];
  const sectors = state.sectors.map((frontState) => {
    const front = plan.sectors.find((candidate) => candidate.id === frontState.frontId)!;
    const distance = front.sectorIndex - event.sectorIndex;
    if (distance < 1 || distance > 4) return frontState;
    const falloff = Math.max(1, Math.abs(amount) - Math.max(0, distance - 2));
    const signed = falloff;
    const influence = {
      ...frontState.influence,
      [event.factionId]: clamp(frontState.influence[event.factionId] + signed, -12, 12)
    };
    const next = resolveFrontState(front, influence, allegiance, frontState.revision + 1);
    if (
      next.controllingFactionId !== frontState.controllingFactionId ||
      next.stance !== frontState.stance ||
      next.kind !== frontState.kind ||
      next.nodePolicy !== frontState.nodePolicy
    ) {
      movedFrontIds.push(front.id);
    }
    return next;
  });
  const label = `${getFactionById(event.factionId).name} ${event.source} ${amount >= 0 ? '+' : ''}${amount}: ${event.reason}`;
  return {
    state: {
      planId: state.planId,
      allegiance,
      sectors,
      processedEventIds: [...state.processedEventIds, event.id].slice(-MAX_FRONT_EVENTS),
      history: [
        ...state.history,
        {
          eventId: event.id,
          source: event.source,
          factionId: event.factionId,
          sectorIndex: event.sectorIndex,
          amount,
          movedFrontIds,
          label
        }
      ].slice(-MAX_FRONT_HISTORY)
    },
    disposition: 'applied',
    movedFrontIds,
    label
  };
}

export function createFactionFrontInfluence(
  plan: FactionFrontPlan,
  state: FactionFrontState,
  sectorIndex: number
): FactionFrontInfluence {
  const front = plan.sectors[sectorIndex];
  const frontState = front ? state.sectors.find((candidate) => candidate.frontId === front.id) : null;
  if (!front || !frontState) throw new Error(`Faction fronts have no sector ${sectorIndex}.`);
  const strategy = getFactionFrontStrategy(frontState.controllingFactionId, frontState.stance);
  return {
    frontId: front.id,
    sectorIndex,
    ownerFactionId: frontState.controllingFactionId,
    ownerFactionName: getFactionById(frontState.controllingFactionId).name,
    stance: frontState.stance,
    kind: frontState.kind,
    strategyLabel: strategy.label,
    mapCue: strategy.mapCue,
    forecast: strategy.forecast,
    reserveRole: front.reserveRole,
    nodePolicy: frontState.nodePolicy,
    priceDelta: strategy.priceDelta,
    hazardDensityDelta: strategy.hazardDensityDelta,
    reinforcementCount: strategy.reinforcementCount,
    supportCount: strategy.supportCount,
    crewAccess: strategy.crewAccess,
    carrierAccess: strategy.carrierAccess,
    setPieceContested: front.setPieceContested || strategy.kind === 'contestedSetPiece',
    endingWeight: strategy.endingWeight
  };
}

export function isFactionFrontNodeAvailable(
  influence: FactionFrontInfluence,
  node: Pick<ExpeditionEncounterNode, 'operationalRole' | 'optional'>
): boolean {
  if (!node.optional || node.operationalRole !== influence.reserveRole) return true;
  return influence.nodePolicy !== 'close';
}

export function projectFactionFrontBranchOptions(
  options: readonly ExpeditionBranchOption[],
  nodes: readonly ExpeditionEncounterNode[],
  influence: FactionFrontInfluence
): ExpeditionBranchOption[] {
  return options
    .filter((option) => {
      const node = nodes.find((candidate) => candidate.id === option.targetNodeId);
      return !node || isFactionFrontNodeAvailable(influence, node);
    })
    .map((option) => {
      const node = nodes.find((candidate) => candidate.id === option.targetNodeId);
      if (!node?.optional || node.operationalRole !== influence.reserveRole) return option;
      return {
        ...option,
        label: `${influence.mapCue} ${influence.strategyLabel}`,
        summary: `${influence.forecast} Owner ${influence.ownerFactionName}; ${influence.stance}; ${influence.nodePolicy} reserve node.`
      };
    });
}

export function createFactionFrontCampaignReadModel(
  plan: FactionFrontPlan,
  state: FactionFrontState
): FactionFrontCampaignReadModel {
  const counts = FACTION_FRONT_STANCES.map((stance) => ({
    stance,
    count: state.sectors.filter((front) => front.stance === stance).length
  }));
  const alliedCount = counts.find((entry) => entry.stance === 'alliance')?.count ?? 0;
  const hostileCount = counts.find((entry) => entry.stance === 'hostility')?.count ?? 0;
  const opportunistCount = counts.find((entry) => entry.stance === 'opportunist')?.count ?? 0;
  const endingDisposition =
    alliedCount >= hostileCount + 3
      ? 'coalition'
      : hostileCount >= alliedCount + 3
        ? 'siege'
        : 'fractured';
  const endingLabel =
    endingDisposition === 'coalition'
      ? 'Coalition Corridor'
      : endingDisposition === 'siege'
        ? 'Siege Horizon'
        : 'Fractured Passage';
  const fronts = plan.sectors.map((front) => {
    const current = state.sectors.find((candidate) => candidate.frontId === front.id)!;
    const strategy = getFactionFrontStrategy(current.controllingFactionId, current.stance);
    return `S${front.sectorIndex + 1} ${strategy.mapCue} ${strategy.label} ${current.nodePolicy}`;
  });
  return {
    alliedCount,
    hostileCount,
    opportunistCount,
    endingDisposition,
    endingLabel,
    fronts,
    summary: `${endingLabel} | allied ${alliedCount} / hostile ${hostileCount} / opportunist ${opportunistCount}`
  };
}

export function createFactionFrontDebugState(
  plan: FactionFrontPlan,
  state: FactionFrontState,
  sectorIndex?: number
): FactionFrontDebugState {
  const campaign = createFactionFrontCampaignReadModel(plan, state);
  const current = sectorIndex === undefined ? null : createFactionFrontInfluence(plan, state, sectorIndex);
  return {
    planId: plan.id,
    historyCount: state.history.length,
    allegiance: FACTIONS.map((faction) => `${faction.name}:${state.allegiance[faction.id]}`),
    fronts: campaign.fronts,
    current: current
      ? `${current.mapCue} ${current.ownerFactionName}/${current.stance}/${current.kind}/${current.nodePolicy}`
      : null,
    ending: campaign.summary
  };
}

export function createDebugFactionFrontState(plan: FactionFrontPlan): FactionFrontState {
  let state = createFactionFrontState(plan);
  const events: FactionFrontEvent[] = [
    { id: 'front-debug-ledger-aid', source: 'aid', sectorIndex: 0, factionId: 'faction_corporate_ledger', amount: 4, reason: 'permit convoy protected' },
    { id: 'front-debug-scrap-theft', source: 'theft', sectorIndex: 0, factionId: 'faction_scrap_court', amount: -4, reason: 'claim vault stripped' },
    { id: 'front-debug-bloom-crew', source: 'crew', sectorIndex: 1, factionId: 'faction_bloom_hive', amount: 3, reason: 'specialist sheltered' },
    { id: 'front-debug-corsair-carrier', source: 'carrier', sectorIndex: 1, factionId: 'faction_void_corsairs', amount: 2, reason: 'liaison channel opened' }
  ];
  for (const event of events) state = applyFactionFrontEvent(plan, state, event).state;
  return state;
}

export function validateFactionFrontPlan(plan: FactionFrontPlan): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const front of plan.sectors) {
    if (ids.has(front.id)) errors.push(`Duplicate faction front ${front.id}.`);
    ids.add(front.id);
    if (front.initialFactionId === front.challengerFactionId) errors.push(`Faction front ${front.id} lacks a challenger.`);
  }
  for (const faction of FACTIONS) {
    for (const stance of FACTION_FRONT_STANCES) {
      if (!FACTION_FRONT_STRATEGIES.some((strategy) => strategy.factionId === faction.id && strategy.stance === stance)) {
        errors.push(`Missing faction front strategy ${faction.id}/${stance}.`);
      }
    }
  }
  return errors;
}

export function validateFactionFrontState(plan: FactionFrontPlan, state: FactionFrontState): string[] {
  const errors: string[] = [];
  if (state.planId !== plan.id || state.sectors.length !== plan.sectors.length) errors.push('Faction front state plan mismatch.');
  if (state.history.length > MAX_FRONT_HISTORY || state.processedEventIds.length > MAX_FRONT_EVENTS) errors.push('Faction front history exceeds bounds.');
  if (new Set(state.processedEventIds).size !== state.processedEventIds.length) errors.push('Faction front event ids are not unique.');
  if (
    FACTIONS.some(
      (faction) =>
        !Number.isFinite(state.allegiance[faction.id]) ||
        Math.abs(state.allegiance[faction.id]) > 12
    )
  ) {
    errors.push('Faction front allegiance is invalid.');
  }
  for (const front of state.sectors) {
    if (!plan.sectors.some((candidate) => candidate.id === front.frontId)) errors.push(`Unknown faction front ${front.frontId}.`);
    if (!FACTION_FRONT_STANCES.includes(front.stance) || !FACTION_FRONT_KINDS.includes(front.kind)) errors.push(`Invalid faction front state ${front.frontId}.`);
    if (
      !FACTIONS.some((faction) => faction.id === front.controllingFactionId) ||
      FACTIONS.some((faction) => !Number.isFinite(front.influence[faction.id]))
    ) {
      errors.push(`Faction front ${front.frontId} influence is invalid.`);
    }
  }
  for (const entry of state.history) {
    if (
      !state.processedEventIds.includes(entry.eventId) ||
      !Number.isFinite(entry.amount) ||
      entry.movedFrontIds.some((id) => !plan.sectors.some((front) => front.id === id))
    ) {
      errors.push(`Faction front history ${entry.eventId} is invalid.`);
    }
  }
  return errors;
}

export function formatFactionFrontSummary(plan: FactionFrontPlan, state: FactionFrontState): string {
  const campaign = createFactionFrontCampaignReadModel(plan, state);
  return `${campaign.summary}. ${campaign.fronts.join(' | ')}.`;
}

function createInitialFrontState(front: FactionFrontSectorPlan): FactionFrontSectorState {
  const influence = factionRecord(0);
  influence[front.initialFactionId] = 2;
  influence[front.challengerFactionId] = 1;
  return resolveFrontState(front, influence, factionRecord(0), 0);
}

function resolveFrontState(
  front: FactionFrontSectorPlan,
  influence: Readonly<Record<FactionId, number>>,
  allegiance: Readonly<Record<FactionId, number>>,
  revision: number
): FactionFrontSectorState {
  const controllingFactionId = [...FACTIONS]
    .sort((left, right) =>
      (influence[right.id] + Math.sign(allegiance[right.id])) -
        (influence[left.id] + Math.sign(allegiance[left.id])) ||
      left.id.localeCompare(right.id)
    )[0]!.id;
  const score = allegiance[controllingFactionId];
  const stance: FactionFrontStance = score >= 3 ? 'alliance' : score <= -2 ? 'hostility' : 'opportunist';
  const strategy = getFactionFrontStrategy(controllingFactionId, stance);
  return {
    frontId: front.id,
    influence,
    controllingFactionId,
    stance,
    kind: revision === 0 ? front.baselineKind : strategy.kind,
    strategyLabel: strategy.label,
    nodePolicy: strategy.nodePolicy,
    revision
  };
}

function factionRecord(value: number): Record<FactionId, number> {
  return {
    faction_scrap_court: value,
    faction_corporate_ledger: value,
    faction_bloom_hive: value,
    faction_void_corsairs: value
  };
}

function rejected(state: FactionFrontState, label: string): FactionFrontEventResult {
  return { state, disposition: 'rejected', movedFrontIds: [], label };
}

function hashLabel(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
