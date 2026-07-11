import {
  CREW_ARCS,
  CREW_ARC_OUTCOMES,
  CREW_ARC_TRIGGER_SOURCES,
  type CrewArcDefinition,
  type CrewArcOutcome,
  type CrewArcTriggerSource
} from '../content/crewArcs';
import { createRng } from '../core/rng';
import type { CrewMemberStatus, CrewRosterPlan, CrewRosterState } from './CrewCommand';

export type CrewArcStatus = 'dormant' | 'active' | 'awaitingChoice' | 'resolving' | 'resolved';
export type CrewRank = 'specialist' | 'veteran' | 'officer';
export type CrewArcFate =
  'serving' | 'promoted' | 'rescued' | 'departed' | 'mutinied' | 'successor';

export interface CrewArcPlanEntry {
  readonly id: string;
  readonly definitionId: string;
  readonly primaryCandidateId: string;
  readonly partnerCandidateId: string;
  readonly activationSectorIndex: number;
  readonly choiceSectorIndex: number;
  readonly resolutionSectorIndex: number;
}

export interface CrewArcPlan {
  readonly id: string;
  readonly seed: string;
  readonly saveFingerprint: string;
  readonly arcs: readonly CrewArcPlanEntry[];
}

export interface CrewRelationshipState {
  readonly id: string;
  readonly leftCandidateId: string;
  readonly rightCandidateId: string;
  readonly bond: number;
  readonly conflict: number;
  readonly pairedAbilityLabel: string | null;
}

export interface CrewArcEntryState {
  readonly arcId: string;
  readonly status: CrewArcStatus;
  readonly progress: number;
  readonly selectedOptionId: string | null;
  readonly outcome: CrewArcOutcome | null;
  readonly lastSectorIndex: number | null;
}

export interface CrewArcHistoryEntry {
  readonly eventId: string;
  readonly sectorIndex: number;
  readonly label: string;
  readonly arcIds: readonly string[];
}

export interface CrewArcState {
  readonly planId: string;
  readonly arcs: readonly CrewArcEntryState[];
  readonly relationships: readonly CrewRelationshipState[];
  readonly ranks: Readonly<Record<string, CrewRank>>;
  readonly fates: Readonly<Record<string, CrewArcFate>>;
  readonly commandSuccessorId: string | null;
  readonly processedEventIds: readonly string[];
  readonly history: readonly CrewArcHistoryEntry[];
}

export interface CrewArcEvent {
  readonly id: string;
  readonly source: CrewArcTriggerSource;
  readonly sectorIndex: number;
  readonly candidateIds: readonly string[];
  readonly positive: boolean;
  readonly detail: string;
}

export interface CrewArcEventResult {
  readonly state: CrewArcState;
  readonly disposition: 'applied' | 'duplicate' | 'rejected';
  readonly advancedArcIds: readonly string[];
  readonly label: string;
}

export interface CrewArcChoiceResult {
  readonly state: CrewArcState;
  readonly disposition: 'applied' | 'duplicate' | 'rejected';
  readonly label: string;
}

export interface CrewArcChoiceReadModel {
  readonly arcId: string;
  readonly title: string;
  readonly summary: string;
  readonly primary: string;
  readonly partner: string;
  readonly options: readonly {
    readonly id: string;
    readonly label: string;
    readonly summary: string;
    readonly risk: string;
    readonly outcome: CrewArcOutcome;
  }[];
}

export interface CrewArcRosterReadModel {
  readonly knownArcs: number;
  readonly pendingChoices: number;
  readonly resolvedArcs: number;
  readonly relationships: readonly string[];
  readonly fates: readonly string[];
  readonly summary: string;
}

export interface CrewArcCombatInfluence {
  readonly excludedCandidateIds: readonly string[];
  readonly byCandidateId: Readonly<
    Record<
      string,
      {
        readonly rank: CrewRank;
        readonly hullDelta: number;
        readonly damageDelta: number;
        readonly fireDelayMultiplier: number;
        readonly commandCostDelta: number;
        readonly relationshipLabel: string | null;
      }
    >
  >;
  readonly pairedAbilities: readonly string[];
  readonly complications: readonly string[];
}

export interface CrewArcDebugState {
  readonly planId: string;
  readonly pending: number;
  readonly resolved: number;
  readonly successor: string | null;
  readonly arcs: readonly string[];
  readonly relationships: readonly string[];
  readonly fates: readonly string[];
  readonly historyCount: number;
}

const MAX_ARC_HISTORY = 96;
const MAX_ARC_EVENTS = 192;

export function createCrewArcPlan(options: {
  readonly seed: string;
  readonly saveFingerprint: string;
  readonly sectorCount: number;
  readonly crewRoster: CrewRosterPlan;
}): CrewArcPlan {
  const rng = createRng(`${options.seed}:crew-arcs:${options.saveFingerprint}`);
  const definitions = rng.fork('definitions').shuffle(CREW_ARCS);
  const candidates = rng.fork('candidates').shuffle(options.crewRoster.candidates);
  const arcs = definitions.map((definition, index): CrewArcPlanEntry => {
    const primary = candidates[index % candidates.length]!;
    const partner = candidates[(index + 1 + (index % 3)) % candidates.length]!;
    const activationSectorIndex = Math.min(
      options.sectorCount - 3,
      Math.max(primary.offerSectorIndex, 1 + (index % 5))
    );
    const choiceSectorIndex = Math.min(
      options.sectorCount - 2,
      activationSectorIndex + 2 + (index % 2)
    );
    const resolutionSectorIndex = Math.min(
      options.sectorCount - 1,
      choiceSectorIndex + 2 + (index % 3)
    );
    return {
      id: `arc:${definition.id}:${primary.id}`,
      definitionId: definition.id,
      primaryCandidateId: primary.id,
      partnerCandidateId: partner.id,
      activationSectorIndex,
      choiceSectorIndex,
      resolutionSectorIndex
    };
  });
  return {
    id: `crew-arcs:${options.seed}:${hashLabel(options.saveFingerprint)}`,
    seed: options.seed,
    saveFingerprint: options.saveFingerprint,
    arcs
  };
}

export function createCrewArcState(plan: CrewArcPlan, roster: CrewRosterPlan): CrewArcState {
  return {
    planId: plan.id,
    arcs: plan.arcs.map((arc) => ({
      arcId: arc.id,
      status: 'dormant',
      progress: 0,
      selectedOptionId: null,
      outcome: null,
      lastSectorIndex: null
    })),
    relationships: uniqueRelationships(plan).map(([leftCandidateId, rightCandidateId]) => ({
      id: relationshipId(leftCandidateId, rightCandidateId),
      leftCandidateId,
      rightCandidateId,
      bond: 0,
      conflict: 0,
      pairedAbilityLabel: null
    })),
    ranks: Object.fromEntries(
      roster.candidates.map((candidate) => [candidate.id, 'specialist'])
    ) as Record<string, CrewRank>,
    fates: Object.fromEntries(
      roster.candidates.map((candidate) => [candidate.id, 'serving'])
    ) as Record<string, CrewArcFate>,
    commandSuccessorId: null,
    processedEventIds: [],
    history: []
  };
}

export function applyCrewArcEvent(options: {
  readonly plan: CrewArcPlan;
  readonly state: CrewArcState;
  readonly rosterPlan: CrewRosterPlan;
  readonly rosterState: CrewRosterState;
  readonly event: CrewArcEvent;
}): CrewArcEventResult {
  const { plan, state, rosterPlan, rosterState, event } = options;
  if (state.planId !== plan.id) return rejectedEvent(state, 'Crew arc plan mismatch');
  if (state.processedEventIds.includes(event.id)) {
    return {
      state,
      disposition: 'duplicate',
      advancedArcIds: [],
      label: 'Duplicate crew arc event'
    };
  }
  if (!CREW_ARC_TRIGGER_SOURCES.includes(event.source))
    return rejectedEvent(state, 'Invalid crew arc source');
  const advancedArcIds: string[] = [];
  let relationships = state.relationships;
  let ranks = state.ranks;
  let fates = state.fates;
  let commandSuccessorId = state.commandSuccessorId;
  const arcs = state.arcs.map((arcState) => {
    const arc = plan.arcs.find((candidate) => candidate.id === arcState.arcId)!;
    const definition = getCrewArcDefinition(arc.definitionId);
    const primary = rosterState.members.find(
      (member) => member.candidateId === arc.primaryCandidateId
    );
    if (!primary || !isServing(primary.status) || arcState.status === 'resolved') return arcState;
    if (
      event.candidateIds.length > 0 &&
      !event.candidateIds.includes(arc.primaryCandidateId) &&
      !event.candidateIds.includes(arc.partnerCandidateId)
    )
      return arcState;
    const expectedSource = definition.triggerSequence[Math.min(arcState.progress, 2)];
    const requiredSector =
      arcState.progress === 0
        ? arc.activationSectorIndex
        : arcState.progress === 1
          ? arc.choiceSectorIndex
          : arc.resolutionSectorIndex;
    if (event.source !== expectedSource || event.sectorIndex < requiredSector) return arcState;
    if (arcState.status === 'awaitingChoice') return arcState;
    const progress = Math.min(3, arcState.progress + 1);
    advancedArcIds.push(arc.id);
    if (progress === 2) {
      return {
        ...arcState,
        status: 'awaitingChoice' as const,
        progress,
        lastSectorIndex: event.sectorIndex
      };
    }
    if (progress === 3 && arcState.selectedOptionId) {
      const selected = definition.options.find(
        (option) => option.id === arcState.selectedOptionId
      )!;
      const resolved = resolveOutcome({
        state: { ...state, relationships, ranks, fates, commandSuccessorId },
        arc,
        definition,
        outcome: selected.outcome,
        relationshipDelta: selected.relationshipDelta,
        rosterPlan
      });
      relationships = resolved.relationships;
      ranks = resolved.ranks;
      fates = resolved.fates;
      commandSuccessorId = resolved.commandSuccessorId;
      return {
        ...arcState,
        status: 'resolved' as const,
        progress,
        outcome: selected.outcome,
        lastSectorIndex: event.sectorIndex
      };
    }
    return { ...arcState, status: 'active' as const, progress, lastSectorIndex: event.sectorIndex };
  });
  const label = `${event.source} ${event.positive ? 'positive' : 'adverse'}: ${event.detail}; arcs ${advancedArcIds.length}`;
  return {
    state: {
      ...state,
      arcs,
      relationships,
      ranks,
      fates,
      commandSuccessorId,
      processedEventIds: [...state.processedEventIds, event.id].slice(-MAX_ARC_EVENTS),
      history: [
        ...state.history,
        { eventId: event.id, sectorIndex: event.sectorIndex, label, arcIds: advancedArcIds }
      ].slice(-MAX_ARC_HISTORY)
    },
    disposition: 'applied',
    advancedArcIds,
    label
  };
}

export function chooseCrewArcOption(options: {
  readonly plan: CrewArcPlan;
  readonly state: CrewArcState;
  readonly arcId: string;
  readonly optionId: string;
  readonly eventId: string;
  readonly sectorIndex: number;
}): CrewArcChoiceResult {
  if (options.state.planId !== options.plan.id)
    return rejectedChoice(options.state, 'Crew arc plan mismatch');
  if (options.state.processedEventIds.includes(options.eventId)) {
    return { state: options.state, disposition: 'duplicate', label: 'Duplicate crew choice' };
  }
  const arcIndex = options.state.arcs.findIndex((arc) => arc.arcId === options.arcId);
  const arcState = options.state.arcs[arcIndex];
  const arc = options.plan.arcs.find((candidate) => candidate.id === options.arcId);
  const definition = arc ? getCrewArcDefinition(arc.definitionId) : null;
  const selected = definition?.options.find((option) => option.id === options.optionId);
  if (!arcState || !arc || !definition || !selected || arcState.status !== 'awaitingChoice') {
    return rejectedChoice(options.state, 'Crew arc choice unavailable');
  }
  const arcs = options.state.arcs.map((candidate, index) =>
    index === arcIndex
      ? { ...candidate, status: 'resolving' as const, selectedOptionId: selected.id }
      : candidate
  );
  const label = `${definition.title}: ${selected.label} (${selected.outcome})`;
  return {
    state: {
      ...options.state,
      arcs,
      processedEventIds: [...options.state.processedEventIds, options.eventId].slice(
        -MAX_ARC_EVENTS
      ),
      history: [
        ...options.state.history,
        { eventId: options.eventId, sectorIndex: options.sectorIndex, label, arcIds: [arc.id] }
      ].slice(-MAX_ARC_HISTORY)
    },
    disposition: 'applied',
    label
  };
}

export function createCrewArcChoiceReadModels(
  plan: CrewArcPlan,
  state: CrewArcState,
  roster: CrewRosterPlan
): CrewArcChoiceReadModel[] {
  return state.arcs
    .filter((arc) => arc.status === 'awaitingChoice')
    .map((arcState) => {
      const arc = plan.arcs.find((candidate) => candidate.id === arcState.arcId)!;
      const definition = getCrewArcDefinition(arc.definitionId);
      return {
        arcId: arc.id,
        title: definition.title,
        summary: definition.summary,
        primary: crewName(roster, arc.primaryCandidateId),
        partner: crewName(roster, arc.partnerCandidateId),
        options: definition.options
      };
    });
}

export function createCrewArcRosterReadModel(
  plan: CrewArcPlan,
  state: CrewArcState,
  roster: CrewRosterPlan
): CrewArcRosterReadModel {
  const known = state.arcs.filter((arc) => arc.status !== 'dormant');
  const relationships = state.relationships
    .filter((relationship) => relationship.bond > 0 || relationship.conflict > 0)
    .map(
      (relationship) =>
        `${crewName(roster, relationship.leftCandidateId)} + ${crewName(roster, relationship.rightCandidateId)}: bond ${relationship.bond}, conflict ${relationship.conflict}${relationship.pairedAbilityLabel ? `, ${relationship.pairedAbilityLabel}` : ''}`
    );
  const fates = roster.candidates
    .filter(
      (candidate) =>
        state.fates[candidate.id] !== 'serving' || state.ranks[candidate.id] !== 'specialist'
    )
    .map(
      (candidate) =>
        `${candidate.callsign}: ${state.fates[candidate.id]}/${state.ranks[candidate.id]}`
    );
  const pendingChoices = known.filter((arc) => arc.status === 'awaitingChoice').length;
  const resolvedArcs = known.filter((arc) => arc.status === 'resolved').length;
  return {
    knownArcs: known.length,
    pendingChoices,
    resolvedArcs,
    relationships,
    fates,
    summary: `${known.length}/${plan.arcs.length} known arcs | ${pendingChoices} choices | ${resolvedArcs} resolved | successor ${state.commandSuccessorId ? crewName(roster, state.commandSuccessorId) : 'unnamed'}`
  };
}

export function createCrewArcCombatInfluence(
  _plan: CrewArcPlan,
  state: CrewArcState,
  roster: CrewRosterState
): CrewArcCombatInfluence {
  const activeIds = new Set(
    roster.members
      .filter((member) => member.status === 'active')
      .map((member) => member.candidateId)
  );
  const excludedCandidateIds = Object.entries(state.fates)
    .filter(([, fate]) => fate === 'departed' || fate === 'mutinied')
    .map(([candidateId]) => candidateId);
  const byCandidateId: Record<string, CrewArcCombatInfluence['byCandidateId'][string]> = {};
  const pairedAbilities: string[] = [];
  const complications: string[] = [];
  for (const candidateId of Object.keys(state.ranks)) {
    const rank = state.ranks[candidateId] ?? 'specialist';
    byCandidateId[candidateId] = {
      rank,
      hullDelta: rank === 'officer' ? 1 : 0,
      damageDelta: rank === 'veteran' ? 1 : 0,
      fireDelayMultiplier: 1,
      commandCostDelta: rank === 'specialist' ? 0 : 1,
      relationshipLabel: null
    };
  }
  for (const relationship of state.relationships) {
    const bothActive =
      activeIds.has(relationship.leftCandidateId) && activeIds.has(relationship.rightCandidateId);
    if (!bothActive) continue;
    if (relationship.conflict >= 2) {
      excludedCandidateIds.push(relationship.rightCandidateId);
      complications.push(`${relationship.id}: conflict forces split deployment`);
      byCandidateId[relationship.leftCandidateId] = {
        ...byCandidateId[relationship.leftCandidateId]!,
        relationshipLabel: 'Conflict lead; partner held back'
      };
    } else if (relationship.bond >= 2 && relationship.pairedAbilityLabel) {
      pairedAbilities.push(relationship.pairedAbilityLabel);
      for (const candidateId of [relationship.leftCandidateId, relationship.rightCandidateId]) {
        const current = byCandidateId[candidateId]!;
        byCandidateId[candidateId] = {
          ...current,
          hullDelta: current.hullDelta - 1,
          fireDelayMultiplier: 0.88,
          relationshipLabel: `${relationship.pairedAbilityLabel}; tight formation -1 hull`
        };
      }
    }
  }
  return {
    excludedCandidateIds: [...new Set(excludedCandidateIds)],
    byCandidateId,
    pairedAbilities,
    complications
  };
}

export function createDebugCrewArcState(
  plan: CrewArcPlan,
  rosterPlan: CrewRosterPlan,
  rosterState: CrewRosterState
): CrewArcState {
  let state = createCrewArcState(plan, rosterPlan);
  const activeIds = rosterState.members
    .filter((member) => isServing(member.status))
    .map((member) => member.candidateId);
  for (const arc of plan.arcs.slice(0, 4)) {
    const definition = getCrewArcDefinition(arc.definitionId);
    const candidateIds = [arc.primaryCandidateId, arc.partnerCandidateId];
    if (!activeIds.includes(arc.primaryCandidateId)) continue;
    state = applyCrewArcEvent({
      plan,
      state,
      rosterPlan,
      rosterState,
      event: {
        id: `debug:${arc.id}:1`,
        source: definition.triggerSequence[0],
        sectorIndex: arc.activationSectorIndex,
        candidateIds,
        positive: true,
        detail: 'debug activation'
      }
    }).state;
    state = applyCrewArcEvent({
      plan,
      state,
      rosterPlan,
      rosterState,
      event: {
        id: `debug:${arc.id}:2`,
        source: definition.triggerSequence[1],
        sectorIndex: arc.choiceSectorIndex,
        candidateIds,
        positive: true,
        detail: 'debug choice gate'
      }
    }).state;
  }
  const choice = createCrewArcChoiceReadModels(plan, state, rosterPlan)[0];
  if (choice) {
    state = chooseCrewArcOption({
      plan,
      state,
      arcId: choice.arcId,
      optionId: choice.options[0]!.id,
      eventId: `debug:${choice.arcId}:choice`,
      sectorIndex: 8
    }).state;
    const arc = plan.arcs.find((candidate) => candidate.id === choice.arcId)!;
    const definition = getCrewArcDefinition(arc.definitionId);
    state = applyCrewArcEvent({
      plan,
      state,
      rosterPlan,
      rosterState,
      event: {
        id: `debug:${arc.id}:3`,
        source: definition.triggerSequence[2],
        sectorIndex: arc.resolutionSectorIndex,
        candidateIds: [arc.primaryCandidateId, arc.partnerCandidateId],
        positive: true,
        detail: 'debug resolution'
      }
    }).state;
  }
  return state;
}

export function createCrewArcDebugState(
  plan: CrewArcPlan,
  state: CrewArcState,
  roster: CrewRosterPlan
): CrewArcDebugState {
  const readModel = createCrewArcRosterReadModel(plan, state, roster);
  return {
    planId: plan.id,
    pending: readModel.pendingChoices,
    resolved: readModel.resolvedArcs,
    successor: state.commandSuccessorId ? crewName(roster, state.commandSuccessorId) : null,
    arcs: state.arcs
      .filter((arc) => arc.status !== 'dormant')
      .map((arc) => `${arc.arcId}:${arc.status}:${arc.progress}:${arc.outcome ?? '-'}`),
    relationships: readModel.relationships,
    fates: readModel.fates,
    historyCount: state.history.length
  };
}

export function validateCrewArcPlan(plan: CrewArcPlan, roster: CrewRosterPlan): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  if (plan.arcs.length < 8) errors.push('Crew arc plan requires at least eight arcs.');
  for (const arc of plan.arcs) {
    if (ids.has(arc.id)) errors.push(`Duplicate crew arc ${arc.id}.`);
    ids.add(arc.id);
    if (!CREW_ARCS.some((definition) => definition.id === arc.definitionId))
      errors.push(`Unknown crew arc definition ${arc.definitionId}.`);
    if (
      !roster.candidates.some((candidate) => candidate.id === arc.primaryCandidateId) ||
      !roster.candidates.some((candidate) => candidate.id === arc.partnerCandidateId)
    )
      errors.push(`Crew arc ${arc.id} has an unknown candidate.`);
    if (!(
      arc.activationSectorIndex < arc.choiceSectorIndex &&
      arc.choiceSectorIndex < arc.resolutionSectorIndex
    ))
      errors.push(`Crew arc ${arc.id} does not span ordered nodes.`);
  }
  return errors;
}

export function validateCrewArcContent(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const outcomes = new Set<CrewArcOutcome>();
  if (CREW_ARCS.length < 8) errors.push('Crew arcs require at least eight definitions.');
  for (const definition of CREW_ARCS) {
    if (ids.has(definition.id)) errors.push(`Duplicate crew arc definition ${definition.id}.`);
    ids.add(definition.id);
    if (definition.options.length !== 2)
      errors.push(`Crew arc ${definition.id} requires two choices.`);
    if (new Set(definition.options.map((option) => option.id)).size !== definition.options.length) {
      errors.push(`Crew arc ${definition.id} has duplicate choice ids.`);
    }
    for (const trigger of definition.triggerSequence) {
      if (!CREW_ARC_TRIGGER_SOURCES.includes(trigger))
        errors.push(`Crew arc ${definition.id} has invalid trigger ${trigger}.`);
    }
    for (const option of definition.options) {
      outcomes.add(option.outcome);
      if (!option.risk.trim())
        errors.push(`Crew arc ${definition.id} choice ${option.id} has no risk.`);
    }
  }
  for (const outcome of CREW_ARC_OUTCOMES) {
    if (!outcomes.has(outcome)) errors.push(`Crew arcs do not expose outcome ${outcome}.`);
  }
  return errors;
}

export function validateCrewArcState(plan: CrewArcPlan, state: CrewArcState): string[] {
  const errors: string[] = [];
  const candidateIds = new Set(
    plan.arcs.flatMap((arc) => [arc.primaryCandidateId, arc.partnerCandidateId])
  );
  if (state.planId !== plan.id || state.arcs.length !== plan.arcs.length)
    errors.push('Crew arc state plan mismatch.');
  if (state.history.length > MAX_ARC_HISTORY || state.processedEventIds.length > MAX_ARC_EVENTS)
    errors.push('Crew arc history exceeds bounds.');
  if (new Set(state.processedEventIds).size !== state.processedEventIds.length)
    errors.push('Crew arc event ids are not unique.');
  for (const arc of state.arcs) {
    const planEntry = plan.arcs.find((candidate) => candidate.id === arc.arcId);
    const definition = planEntry ? getCrewArcDefinition(planEntry.definitionId) : null;
    if (
      !planEntry ||
      arc.progress < 0 ||
      arc.progress > 3 ||
      (arc.outcome !== null && !CREW_ARC_OUTCOMES.includes(arc.outcome)) ||
      (arc.selectedOptionId !== null &&
        !definition?.options.some((option) => option.id === arc.selectedOptionId)) ||
      (arc.status === 'resolved' && (arc.progress !== 3 || arc.outcome === null))
    )
      errors.push(`Crew arc state ${arc.arcId} is invalid.`);
  }
  for (const [candidateId, rank] of Object.entries(state.ranks)) {
    if (
      !candidateIds.has(candidateId) ||
      !(['specialist', 'veteran', 'officer'] as const).includes(rank)
    )
      errors.push(`Crew arc rank ${candidateId} is invalid.`);
  }
  for (const [candidateId, fate] of Object.entries(state.fates)) {
    if (
      !candidateIds.has(candidateId) ||
      !(['serving', 'promoted', 'rescued', 'departed', 'mutinied', 'successor'] as const).includes(
        fate
      )
    )
      errors.push(`Crew arc fate ${candidateId} is invalid.`);
  }
  for (const relationship of state.relationships) {
    if (
      !candidateIds.has(relationship.leftCandidateId) ||
      !candidateIds.has(relationship.rightCandidateId) ||
      relationship.bond < 0 ||
      relationship.bond > 4 ||
      relationship.conflict < 0 ||
      relationship.conflict > 4
    )
      errors.push(`Crew relationship ${relationship.id} is invalid.`);
  }
  if (state.commandSuccessorId !== null && !candidateIds.has(state.commandSuccessorId)) {
    errors.push('Crew command successor is invalid.');
  }
  return errors;
}

export function formatCrewArcSummary(
  plan: CrewArcPlan,
  state: CrewArcState,
  roster: CrewRosterPlan
): string {
  const readModel = createCrewArcRosterReadModel(plan, state, roster);
  return `${readModel.summary}. ${readModel.relationships.join(' | ') || 'No established relationships'}. ${readModel.fates.join(' | ') || 'No altered fates'}.`;
}

export function getCrewArcDefinition(id: string): CrewArcDefinition {
  const definition = CREW_ARCS.find((candidate) => candidate.id === id);
  if (!definition) throw new Error(`Unknown crew arc definition ${id}.`);
  return definition;
}

function resolveOutcome(options: {
  readonly state: CrewArcState;
  readonly arc: CrewArcPlanEntry;
  readonly definition: CrewArcDefinition;
  readonly outcome: CrewArcOutcome;
  readonly relationshipDelta: number;
  readonly rosterPlan: CrewRosterPlan;
}): Pick<CrewArcState, 'relationships' | 'ranks' | 'fates' | 'commandSuccessorId'> {
  const relationshipKey = relationshipId(
    options.arc.primaryCandidateId,
    options.arc.partnerCandidateId
  );
  const relationships = options.state.relationships.map((relationship) => {
    if (relationship.id !== relationshipKey) return relationship;
    const positive = options.relationshipDelta > 0;
    return {
      ...relationship,
      bond: Math.max(
        0,
        Math.min(4, relationship.bond + (positive ? options.relationshipDelta : 0))
      ),
      conflict: Math.max(
        0,
        Math.min(4, relationship.conflict + (positive ? 0 : Math.abs(options.relationshipDelta)))
      ),
      pairedAbilityLabel:
        options.outcome === 'pairedAbility' || options.outcome === 'bond'
          ? options.definition.pairedAbilityLabel
          : relationship.pairedAbilityLabel
    };
  });
  const ranks = { ...options.state.ranks };
  const fates = { ...options.state.fates };
  let commandSuccessorId = options.state.commandSuccessorId;
  if (
    options.outcome === 'promotion' ||
    options.outcome === 'pairedAbility' ||
    options.outcome === 'specialistPost'
  ) {
    ranks[options.arc.primaryCandidateId] =
      ranks[options.arc.primaryCandidateId] === 'veteran' ? 'officer' : 'veteran';
    fates[options.arc.primaryCandidateId] = 'promoted';
  } else if (options.outcome === 'departure') {
    fates[options.arc.primaryCandidateId] = 'departed';
  } else if (options.outcome === 'mutiny') {
    fates[options.arc.primaryCandidateId] = 'mutinied';
  } else if (options.outcome === 'rescue') {
    fates[options.arc.primaryCandidateId] = 'rescued';
  } else if (options.outcome === 'commandSuccession') {
    commandSuccessorId = options.arc.primaryCandidateId;
    fates[options.arc.primaryCandidateId] = 'successor';
    ranks[options.arc.primaryCandidateId] = 'officer';
  }
  return { relationships, ranks, fates, commandSuccessorId };
}

function uniqueRelationships(plan: CrewArcPlan): readonly [string, string][] {
  return [
    ...new Map(
      plan.arcs.map((arc) => {
        const pair = [arc.primaryCandidateId, arc.partnerCandidateId].sort() as [string, string];
        return [relationshipId(pair[0], pair[1]), pair] as const;
      })
    ).values()
  ];
}

function relationshipId(left: string, right: string): string {
  return `relationship:${[left, right].sort().join(':')}`;
}

function crewName(plan: CrewRosterPlan, candidateId: string): string {
  return plan.candidates.find((candidate) => candidate.id === candidateId)?.callsign ?? candidateId;
}

function isServing(status: CrewMemberStatus): boolean {
  return status === 'active' || status === 'injured';
}

function rejectedEvent(state: CrewArcState, label: string): CrewArcEventResult {
  return { state, disposition: 'rejected', advancedArcIds: [], label };
}

function rejectedChoice(state: CrewArcState, label: string): CrewArcChoiceResult {
  return { state, disposition: 'rejected', label };
}

function hashLabel(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
