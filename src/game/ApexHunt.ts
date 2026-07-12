import {
  APEX_HUNT_STRUCTURES,
  APEX_OUTCOMES,
  APEX_THREATS,
  getApexThreatDefinition,
  type ApexOutcome
} from '../content/apexThreats';
import type { BossId } from '../content/bosses';
import type { UnlockId } from '../content/unlocks';
import { createRng } from '../core/rng';
import type { ExpeditionEncounterNode, ExpeditionOperationalRole } from './ExpeditionTypes';

export type ApexEncounterStage = 'trace' | 'ambush' | 'lieutenant' | 'finale';
export type ApexThreatStatus =
  | 'untracked'
  | 'tracked'
  | 'wounded'
  | 'awaitingResolution'
  | 'resolved'
  | 'escaped';

export interface ApexEncounterPlan {
  readonly id: string;
  readonly threatId: string;
  readonly stage: ApexEncounterStage;
  readonly sectorIndex: number;
  readonly operationalRole: ExpeditionOperationalRole;
  readonly label: string;
}

export interface ApexThreatPlan {
  readonly id: string;
  readonly definitionId: string;
  readonly encounters: readonly ApexEncounterPlan[];
}

export interface ApexHuntPlan {
  readonly id: string;
  readonly seed: string;
  readonly saveFingerprint: string;
  readonly threats: readonly ApexThreatPlan[];
}

export interface ApexSubsystemState {
  readonly propulsion: number;
  readonly armor: number;
  readonly core: number;
}

export interface ApexThreatState {
  readonly threatId: string;
  readonly status: ApexThreatStatus;
  readonly integrity: number;
  readonly subsystems: ApexSubsystemState;
  readonly traces: number;
  readonly lieutenantsDefeated: number;
  readonly boardingSabotage: number;
  readonly migrations: number;
  readonly escapeRoutesOpen: number;
  readonly encountersCompleted: readonly string[];
  readonly outcome: ApexOutcome | null;
}

export interface ApexHistoryEntry {
  readonly eventId: string;
  readonly sectorIndex: number;
  readonly threatId: string;
  readonly label: string;
}

export interface ApexHuntState {
  readonly planId: string;
  readonly threats: readonly ApexThreatState[];
  readonly processedEventIds: readonly string[];
  readonly history: readonly ApexHistoryEntry[];
}

export type ApexHuntEvent =
  | {
      readonly id: string;
      readonly type: 'encounterOutcome';
      readonly threatId: string;
      readonly encounterId: string;
      readonly stage: ApexEncounterStage;
      readonly sectorIndex: number;
      readonly outcome: 'success' | 'partialSuccess' | 'failure';
    }
  | {
      readonly id: string;
      readonly type: 'boardingSabotage';
      readonly threatId: string;
      readonly sectorIndex: number;
      readonly amount: number;
    }
  | {
      readonly id: string;
      readonly type: 'resolve';
      readonly threatId: string;
      readonly sectorIndex: number;
      readonly outcome: ApexOutcome;
    }
  | {
      readonly id: string;
      readonly type: 'escape';
      readonly threatId: string;
      readonly sectorIndex: number;
    };

export interface ApexHuntEventResult {
  readonly state: ApexHuntState;
  readonly disposition: 'applied' | 'duplicate' | 'rejected';
  readonly label: string;
  readonly rewardUnlockId: UnlockId | null;
}

export interface ApexFinaleContext {
  readonly alliedFronts: number;
  readonly hostileFronts: number;
  readonly resolvedRivals: number;
  readonly crewBonds: number;
  readonly crewOfficers: number;
  readonly carrierSupport: number;
  readonly boardingCapacity: number;
  readonly fleetSupport: number;
  readonly fleetBoardingAssist: number;
  readonly frontierDecision: 'unresolved' | 'extract' | 'breach';
}

export interface ApexResolutionOption {
  readonly outcome: ApexOutcome;
  readonly label: string;
  readonly summary: string;
  readonly risk: string;
  readonly available: boolean;
  readonly requirement: string;
}

export interface ApexFinaleProfile {
  readonly threatId: string;
  readonly bossId: BossId;
  readonly bossName: string;
  readonly mapCue: string;
  readonly bossHullDelta: number;
  readonly reinforcementCount: number;
  readonly hazardPressure: number;
  readonly escapeRisk: number;
  readonly integrityReadout: string;
  readonly subsystemReadout: string;
  readonly options: readonly ApexResolutionOption[];
  readonly budget: string;
}

export interface ApexCampaignReadModel {
  readonly activeThreats: number;
  readonly resolvedThreats: number;
  readonly awaitingResolution: number;
  readonly threats: readonly string[];
  readonly nextEncounters: readonly string[];
  readonly summary: string;
}

export interface ApexDebugState {
  readonly planId: string;
  readonly active: number;
  readonly resolved: number;
  readonly awaiting: number;
  readonly historyCount: number;
  readonly threats: readonly string[];
  readonly budget: string;
}

const MAX_APEX_HISTORY = 64;
const MAX_APEX_EVENTS = 128;
const BASE_INTEGRITY = 12;
export const MAX_APEX_REINFORCEMENTS = 3;
export const MAX_APEX_HAZARD_PRESSURE = 2;

export function createApexHuntPlan(options: {
  readonly seed: string;
  readonly saveFingerprint: string;
  readonly sectorCount: number;
}): ApexHuntPlan {
  const rng = createRng(`${options.seed}:apex-hunts:${options.saveFingerprint}`);
  const definitions = rng.fork('threats').shuffle(APEX_THREATS);
  const finaleIndexes = [7, 10, 13].map((index) => Math.min(options.sectorCount - 2, index));
  const threats = definitions.map((definition, index): ApexThreatPlan => {
    const finale = finaleIndexes[index]!;
    const roles: readonly ExpeditionOperationalRole[][] = [
      ['detour', 'pursuit', 'gate', 'pursuit'],
      ['pursuit', 'detour', 'gate', 'pursuit'],
      ['gate', 'detour', 'pursuit', 'pursuit']
    ];
    const stages: readonly [ApexEncounterStage, number, ExpeditionOperationalRole][] = [
      ['trace', Math.max(1, finale - 5), roles[index]![0]!],
      ['ambush', Math.max(2, finale - 3), roles[index]![1]!],
      ['lieutenant', Math.max(3, finale - 1), roles[index]![2]!],
      ['finale', finale, roles[index]![3]!]
    ];
    return {
      id: `hunt:${definition.id}`,
      definitionId: definition.id,
      encounters: stages.map(([stage, sectorIndex, operationalRole]) => ({
        id: `apex:${definition.id}:${stage}:s${sectorIndex + 1}`,
        threatId: definition.id,
        stage,
        sectorIndex,
        operationalRole,
        label: `${definition.mapCue} ${definition.name}: ${stage}`
      }))
    };
  });
  return {
    id: `apex-hunts:${options.seed}:${hashLabel(options.saveFingerprint)}`,
    seed: options.seed,
    saveFingerprint: options.saveFingerprint,
    threats
  };
}

export function createApexHuntState(plan: ApexHuntPlan): ApexHuntState {
  return {
    planId: plan.id,
    threats: plan.threats.map((threat) => ({
      threatId: threat.definitionId,
      status: 'untracked',
      integrity: BASE_INTEGRITY,
      subsystems: { propulsion: 4, armor: 4, core: 4 },
      traces: 0,
      lieutenantsDefeated: 0,
      boardingSabotage: 0,
      migrations: 0,
      escapeRoutesOpen: 2,
      encountersCompleted: [],
      outcome: null
    })),
    processedEventIds: [],
    history: []
  };
}

export function applyApexHuntEvent(
  plan: ApexHuntPlan,
  state: ApexHuntState,
  event: ApexHuntEvent
): ApexHuntEventResult {
  if (state.planId !== plan.id) return rejected(state, 'Apex hunt plan mismatch');
  if (state.processedEventIds.includes(event.id)) {
    return { state, disposition: 'duplicate', label: 'Duplicate apex event', rewardUnlockId: null };
  }
  const threatIndex = state.threats.findIndex((threat) => threat.threatId === event.threatId);
  const threat = state.threats[threatIndex];
  const threatPlan = plan.threats.find((candidate) => candidate.definitionId === event.threatId);
  if (!threat || !threatPlan || threat.status === 'resolved' || threat.status === 'escaped') return rejected(state, 'Apex threat unavailable');
  const definition = getApexThreatDefinition(event.threatId);
  let next = threat;
  let label: string;
  let rewardUnlockId: UnlockId | null = null;

  if (event.type === 'encounterOutcome') {
    const encounter = threatPlan.encounters.find((candidate) => candidate.id === event.encounterId);
    if (!encounter || encounter.stage !== event.stage || threat.encountersCompleted.includes(encounter.id)) {
      return rejected(state, 'Apex encounter unavailable');
    }
    const success = event.outcome === 'success';
    const partial = event.outcome === 'partialSuccess';
    const damage = success ? (event.stage === 'lieutenant' ? 3 : 2) : partial ? 1 : 0;
    const subsystem =
      event.stage === 'trace'
        ? 'propulsion'
        : event.stage === 'ambush'
          ? 'armor'
          : 'core';
    const subsystems = {
      ...threat.subsystems,
      [subsystem]: Math.max(0, threat.subsystems[subsystem] - damage)
    };
    next = {
      ...threat,
      status:
        event.stage === 'finale' && event.outcome !== 'failure'
          ? 'awaitingResolution'
          : damage > 0
            ? 'wounded'
            : threat.status === 'untracked'
              ? 'tracked'
              : threat.status,
      integrity: Math.max(3, threat.integrity - damage),
      subsystems,
      traces: threat.traces + Number(event.stage === 'trace' && event.outcome !== 'failure'),
      lieutenantsDefeated:
        threat.lieutenantsDefeated + Number(event.stage === 'lieutenant' && success),
      migrations: threat.migrations + Number(event.outcome === 'failure'),
      escapeRoutesOpen: Math.max(
        0,
        threat.escapeRoutesOpen - Number(event.stage === 'ambush' && event.outcome !== 'failure')
      ),
      encountersCompleted: [...threat.encountersCompleted, encounter.id]
    };
    label = `${definition.name} ${event.stage} ${event.outcome}; integrity ${next.integrity}/${BASE_INTEGRITY}`;
  } else if (event.type === 'boardingSabotage') {
    const amount = Math.max(0, Math.min(3, Math.floor(event.amount)));
    next = {
      ...threat,
      status: threat.status === 'untracked' ? 'tracked' : threat.status,
      integrity: Math.max(3, threat.integrity - amount),
      subsystems: { ...threat.subsystems, core: Math.max(0, threat.subsystems.core - amount) },
      boardingSabotage: threat.boardingSabotage + amount
    };
    label = `${definition.name} boarding sabotage ${amount}; core ${next.subsystems.core}/4`;
  } else if (event.type === 'resolve') {
    if (
      threat.status !== 'awaitingResolution' ||
      !definition.supportedOutcomes.includes(event.outcome)
    ) {
      return rejected(state, 'Apex resolution unavailable');
    }
    next = { ...threat, status: 'resolved', outcome: event.outcome };
    rewardUnlockId = definition.rewardUnlockId;
    label = `${definition.name} resolved by ${event.outcome}`;
  } else {
    next = {
      ...threat,
      status: 'escaped',
      migrations: threat.migrations + 1,
      escapeRoutesOpen: Math.min(3, threat.escapeRoutesOpen + 1)
    };
    label = `${definition.name} escaped the pursuit corridor`;
  }

  const threats = state.threats.map((candidate, index) =>
    index === threatIndex ? next : candidate
  );
  return {
    state: {
      ...state,
      threats,
      processedEventIds: [...state.processedEventIds, event.id].slice(-MAX_APEX_EVENTS),
      history: [
        ...state.history,
        { eventId: event.id, sectorIndex: event.sectorIndex, threatId: event.threatId, label }
      ].slice(-MAX_APEX_HISTORY)
    },
    disposition: 'applied',
    label,
    rewardUnlockId
  };
}

export function getApexEncounterForNode(
  plan: ApexHuntPlan,
  node: Pick<ExpeditionEncounterNode, 'sectorIndex' | 'operationalRole'>
): ApexEncounterPlan | null {
  return (
    plan.threats
      .flatMap((threat) => threat.encounters)
      .find(
        (encounter) =>
          encounter.sectorIndex === node.sectorIndex &&
          encounter.operationalRole === node.operationalRole
      ) ?? null
  );
}

export function createApexFinaleProfile(options: {
  readonly plan: ApexHuntPlan;
  readonly state: ApexHuntState;
  readonly threatId: string;
  readonly context: ApexFinaleContext;
}): ApexFinaleProfile {
  const threat = options.state.threats.find((candidate) => candidate.threatId === options.threatId);
  if (!threat) throw new Error(`Unknown apex threat state ${options.threatId}.`);
  const definition = getApexThreatDefinition(options.threatId);
  const support =
    options.context.alliedFronts +
    options.context.resolvedRivals +
    options.context.crewBonds +
    options.context.crewOfficers +
    options.context.carrierSupport +
    options.context.fleetSupport;
  const pressure = threat.migrations + threat.escapeRoutesOpen + options.context.hostileFronts;
  const bossHullDelta = Math.max(-12, Math.min(8, threat.integrity - BASE_INTEGRITY + pressure - Math.floor(support / 3)));
  const reinforcementCount = Math.max(
    0,
    Math.min(MAX_APEX_REINFORCEMENTS, 1 + threat.migrations + options.context.hostileFronts - options.context.alliedFronts)
  );
  const hazardPressure = Math.max(
    0,
    Math.min(MAX_APEX_HAZARD_PRESSURE, threat.escapeRoutesOpen - options.context.carrierSupport)
  );
  const option = (outcome: ApexOutcome): ApexResolutionOption => {
    const available = isOutcomeAvailable(outcome, definition.supportedOutcomes, options.context);
    return {
      outcome,
      label: outcomeLabel(outcome),
      summary: outcomeSummary(outcome, definition.name),
      risk: outcomeRisk(outcome),
      available,
      requirement: outcomeRequirement(outcome)
    };
  };
  return {
    threatId: definition.id,
    bossId: definition.bossId,
    bossName: definition.name,
    mapCue: definition.mapCue,
    bossHullDelta,
    reinforcementCount,
    hazardPressure,
    escapeRisk: Math.max(0, Math.min(6, threat.escapeRoutesOpen + threat.migrations - options.context.fleetSupport)),
    integrityReadout: `Integrity ${threat.integrity}/${BASE_INTEGRITY} | traces ${threat.traces} | lieutenants ${threat.lieutenantsDefeated} | migrations ${threat.migrations} | escape routes ${threat.escapeRoutesOpen}`,
    subsystemReadout: `${definition.subsystemLabels.propulsion} ${threat.subsystems.propulsion}/4 | ${definition.subsystemLabels.armor} ${threat.subsystems.armor}/4 | ${definition.subsystemLabels.core} ${threat.subsystems.core}/4`,
    options: definition.supportedOutcomes.map(option),
    budget: `${reinforcementCount}/${MAX_APEX_REINFORCEMENTS} reinforcements | hazard ${hazardPressure}/${MAX_APEX_HAZARD_PRESSURE} | shared boss/projectile/effect caps`
  };
}

export function createApexCampaignReadModel(
  plan: ApexHuntPlan,
  state: ApexHuntState,
  sectorIndex: number
): ApexCampaignReadModel {
  const threats = state.threats.map((threat) => {
    const definition = getApexThreatDefinition(threat.threatId);
    return `${definition.mapCue} ${definition.name}: ${threat.status} I${threat.integrity}/${BASE_INTEGRITY} P${threat.subsystems.propulsion} A${threat.subsystems.armor} C${threat.subsystems.core} M${threat.migrations} E${threat.escapeRoutesOpen} ${threat.outcome ?? ''}`.trim();
  });
  const nextEncounters = plan.threats.flatMap((threat) => {
    const stateEntry = state.threats.find((candidate) => candidate.threatId === threat.definitionId)!;
    if (stateEntry.status === 'resolved' || stateEntry.status === 'escaped') return [];
    const next = threat.encounters.find(
      (encounter) =>
        encounter.sectorIndex >= sectorIndex &&
        !stateEntry.encountersCompleted.includes(encounter.id)
    );
    return next ? [`${next.label} @ sector ${next.sectorIndex + 1}/${next.operationalRole}`] : [];
  });
  const activeThreats = state.threats.filter(
    (threat) => threat.status !== 'resolved' && threat.status !== 'escaped'
  ).length;
  const resolvedThreats = state.threats.filter((threat) => threat.status === 'resolved').length;
  const awaitingResolution = state.threats.filter(
    (threat) => threat.status === 'awaitingResolution'
  ).length;
  return {
    activeThreats,
    resolvedThreats,
    awaitingResolution,
    threats,
    nextEncounters,
    summary: `${activeThreats} active apex hunts | ${resolvedThreats} resolved | ${awaitingResolution} awaiting disposition`
  };
}

export function createApexDebugState(plan: ApexHuntPlan, state: ApexHuntState): ApexDebugState {
  const readout = createApexCampaignReadModel(plan, state, 0);
  return {
    planId: plan.id,
    active: readout.activeThreats,
    resolved: readout.resolvedThreats,
    awaiting: readout.awaitingResolution,
    historyCount: state.history.length,
    threats: readout.threats,
    budget: `${MAX_APEX_REINFORCEMENTS} reinforcements | ${MAX_APEX_HAZARD_PRESSURE} hazard pressure | existing boss projectile/effect caps`
  };
}

export function createDebugApexHuntState(plan: ApexHuntPlan): ApexHuntState {
  let state = createApexHuntState(plan);
  for (const [threatIndex, threat] of plan.threats.entries()) {
    for (const encounter of threat.encounters.slice(0, threatIndex === 0 ? 4 : 2)) {
      state = applyApexHuntEvent(plan, state, {
        id: `debug:${encounter.id}`,
        type: 'encounterOutcome',
        threatId: threat.definitionId,
        encounterId: encounter.id,
        stage: encounter.stage,
        sectorIndex: encounter.sectorIndex,
        outcome: 'success'
      }).state;
    }
  }
  return state;
}

export function getResolvedApexUnlockIds(plan: ApexHuntPlan, state: ApexHuntState): UnlockId[] {
  return state.threats.flatMap((threat) => {
    if (threat.status !== 'resolved') return [];
    const definition = getApexThreatDefinition(threat.threatId);
    return plan.threats.some((planThreat) => planThreat.definitionId === threat.threatId)
      ? [definition.rewardUnlockId]
      : [];
  });
}

export function validateApexHuntPlan(plan: ApexHuntPlan): string[] {
  const errors: string[] = [];
  if (plan.threats.length < 3) errors.push('Apex campaign requires at least three threats.');
  const ids = new Set<string>();
  for (const threat of plan.threats) {
    if (ids.has(threat.id)) errors.push(`Duplicate apex hunt ${threat.id}.`);
    ids.add(threat.id);
    const definition = getApexThreatDefinition(threat.definitionId);
    if (!APEX_HUNT_STRUCTURES.includes(definition.structure)) errors.push(`Invalid apex structure ${definition.structure}.`);
    if (threat.encounters.length < 4 || threat.encounters[threat.encounters.length - 1]?.stage !== 'finale') errors.push(`Apex hunt ${threat.id} requires a multi-node finale chain.`);
    for (let index = 1; index < threat.encounters.length; index += 1) {
      if (threat.encounters[index]!.sectorIndex <= threat.encounters[index - 1]!.sectorIndex) errors.push(`Apex hunt ${threat.id} encounters are not ordered.`);
    }
  }
  return errors;
}

export function validateApexHuntState(plan: ApexHuntPlan, state: ApexHuntState): string[] {
  const errors: string[] = [];
  if (state.planId !== plan.id || state.threats.length !== plan.threats.length) errors.push('Apex state plan mismatch.');
  if (state.history.length > MAX_APEX_HISTORY || state.processedEventIds.length > MAX_APEX_EVENTS || new Set(state.processedEventIds).size !== state.processedEventIds.length) errors.push('Apex history is invalid.');
  for (const threat of state.threats) {
    if (!plan.threats.some((entry) => entry.definitionId === threat.threatId) || threat.integrity < 0 || Object.values(threat.subsystems).some((value) => value < 0 || value > 4) || (threat.outcome !== null && !APEX_OUTCOMES.includes(threat.outcome))) errors.push(`Apex threat state ${threat.threatId} is invalid.`);
  }
  return errors;
}

export function validateApexContent(): string[] {
  const errors: string[] = [];
  const structures = new Set(APEX_THREATS.map((threat) => threat.structure));
  const ids = new Set<string>();
  for (const threat of APEX_THREATS) {
    if (ids.has(threat.id)) errors.push(`Duplicate apex threat ${threat.id}.`);
    ids.add(threat.id);
    if (threat.supportedOutcomes.length < 3) errors.push(`Apex threat ${threat.id} requires three outcomes.`);
  }
  for (const structure of APEX_HUNT_STRUCTURES) if (!structures.has(structure)) errors.push(`Missing apex hunt structure ${structure}.`);
  return errors;
}

export function formatApexSummary(plan: ApexHuntPlan, state: ApexHuntState): string {
  const readout = createApexCampaignReadModel(plan, state, 0);
  return `${readout.summary}. ${readout.threats.join(' | ')}`;
}

function isOutcomeAvailable(
  outcome: ApexOutcome,
  supported: readonly ApexOutcome[],
  context: ApexFinaleContext
): boolean {
  if (!supported.includes(outcome)) return false;
  if (outcome === 'capture') return context.boardingCapacity + context.fleetBoardingAssist > 1;
  if (outcome === 'containment') return context.carrierSupport + context.crewOfficers > 1;
  if (outcome === 'bargain') return context.alliedFronts + context.resolvedRivals + context.crewBonds > 1;
  if (outcome === 'evacuation') return context.frontierDecision === 'breach' && context.fleetSupport > 0;
  return true;
}

function outcomeLabel(outcome: ApexOutcome): string {
  return {
    destruction: 'Destroy The Apex',
    capture: 'Take The Living Prize',
    containment: 'Seal It In Carrier Custody',
    bargain: 'Accept A Dangerous Compact',
    evacuation: 'Open An Exodus Corridor'
  }[outcome];
}

function outcomeSummary(outcome: ApexOutcome, name: string): string {
  return {
    destruction: `End ${name} permanently and lose every future use of its systems.`,
    capture: `Board and capture ${name} as a volatile future practice dossier.`,
    containment: `Keep ${name} intact under expensive carrier and crew watch.`,
    bargain: `Trade passage and information with ${name}; the frontier remembers the compromise.`,
    evacuation: `Redirect ${name} away from inhabited lanes instead of claiming it.`
  }[outcome];
}

function outcomeRisk(outcome: ApexOutcome): string {
  return {
    destruction: 'No specimen, intelligence, or diplomatic leverage survives.',
    capture: 'Boarding teams and support craft remain exposed during custody transfer.',
    containment: 'Carrier capacity and command attention remain tied to the prisoner.',
    bargain: 'Allied factions may treat the compact as betrayal.',
    evacuation: 'The threat survives and may return in a later challenge variant.'
  }[outcome];
}

function outcomeRequirement(outcome: ApexOutcome): string {
  return {
    destruction: 'Always available after neutralization.',
    capture: 'Requires combined carrier and fleet boarding capacity.',
    containment: 'Requires carrier support and an officer-grade crew chain.',
    bargain: 'Requires bonds, allied fronts, or a resolved rival channel.',
    evacuation: 'Requires a frontier breach and operational support fleet.'
  }[outcome];
}

function rejected(state: ApexHuntState, label: string): ApexHuntEventResult {
  return { state, disposition: 'rejected', label, rewardUnlockId: null };
}

function hashLabel(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
