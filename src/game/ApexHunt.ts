import {
  APEX_HUNT_STRUCTURES,
  APEX_THREATS,
  getApexThreatDefinition
} from '../content/apexThreats';
import type { BossId } from '../content/bosses';
import type { ItemId } from '../content/items';
import type { UnlockId } from '../content/unlocks';
import { createRng } from '../core/rng';
import type { ExpeditionEncounterNode, ExpeditionOperationalRole } from './ExpeditionTypes';
import type { ActRouteGraph } from './ActRouteGraph';
import {
  APEX_PURSUIT_STEP_COUNT,
  createApexPursuitTracks,
  type ApexPursuitTrackPlan
} from './ApexPursuitTrack';

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
  readonly routeNodeLabel: string;
  readonly label: string;
}

export interface ApexThreatPlan {
  readonly id: string;
  readonly definitionId: string;
  readonly pursuit: ApexPursuitTrackPlan;
  readonly encounters: readonly ApexEncounterPlan[];
}

export interface ApexHuntPlan {
  readonly id: string;
  readonly seed: string;
  readonly saveFingerprint: string;
  readonly routeGraphId: string;
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
  readonly fleetSupport: number;
}

export interface ApexPressureReadModel {
  readonly id: 'hull' | 'escorts' | 'hazard' | 'escape';
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly tone: 'advantage' | 'warning' | 'neutral';
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
  readonly pressure: readonly ApexPressureReadModel[];
  readonly budget: string;
}

export interface ApexSubsystemReadModel {
  readonly id: keyof ApexSubsystemState;
  readonly label: string;
  readonly current: number;
  readonly maximum: number;
  readonly condition: string;
  readonly effect: string;
}

export interface ApexEvidenceReadModel {
  readonly id: 'traces' | 'lieutenants' | 'migrations' | 'escapeRoutes';
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly tone: 'advantage' | 'warning' | 'neutral';
}

export interface ApexContactReadModel {
  readonly id: string;
  readonly stage: ApexEncounterStage;
  readonly stageLabel: string;
  readonly label: string;
  readonly directive: string;
  readonly payoff: string;
  readonly location: string;
  readonly status: 'resolved' | 'current' | 'ahead' | 'missed';
  readonly statusLabel: string;
}

export interface ApexThreatReadModel {
  readonly id: string;
  readonly mapCue: string;
  readonly name: string;
  readonly title: string;
  readonly summary: string;
  readonly structureLabel: string;
  readonly huntDoctrine: string;
  readonly status: ApexThreatStatus;
  readonly statusLabel: string;
  readonly statusDetail: string;
  readonly integrity: number;
  readonly maximumIntegrity: number;
  readonly integrityDetail: string;
  readonly subsystems: readonly ApexSubsystemReadModel[];
  readonly evidence: readonly ApexEvidenceReadModel[];
  readonly contacts: readonly ApexContactReadModel[];
  readonly nextEncounter: string | null;
  readonly circuitRewardItemIds: readonly [ItemId, ItemId];
  readonly debugLabel: string;
}

export interface ApexCampaignReadModel {
  readonly activeThreats: number;
  readonly resolvedThreats: number;
  readonly awaitingResolution: number;
  readonly threats: readonly ApexThreatReadModel[];
  readonly nextEncounters: readonly string[];
  readonly summary: string;
}

export interface ApexEncounterReadModel {
  readonly mapCue: string;
  readonly threatName: string;
  readonly stage: ApexEncounterStage;
  readonly stageLabel: string;
  readonly label: string;
  readonly directive: string;
  readonly payoff: string;
  readonly banner: string;
  readonly hudReadout: string;
  readonly waveLabel: string;
}

export interface ApexPursuitNavigationReadModel {
  readonly threatId: string;
  readonly threatName: string;
  readonly mapCue: string;
  readonly status: ApexThreatStatus;
  readonly step: number;
  readonly totalSteps: number;
  readonly currentEncounter: ApexEncounterPlan | null;
  readonly revealedNextEncounter: ApexEncounterPlan | null;
  readonly revealedNextSectorIndex: number | null;
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
  readonly actRouteGraph: Pick<ActRouteGraph, 'id' | 'nodes' | 'edges'>;
}): ApexHuntPlan {
  const rng = createRng(`${options.seed}:apex-hunts:${options.saveFingerprint}`);
  const definitions = rng.fork('threats').shuffle(APEX_THREATS);
  const pursuitTracks = createApexPursuitTracks(options);
  const stages: readonly ApexEncounterStage[] = ['trace', 'ambush', 'lieutenant', 'finale'];
  const threats = pursuitTracks.map((pursuit, index): ApexThreatPlan => {
    const definition = definitions[index % definitions.length]!;
    return {
      id: `hunt:${pursuit.actId}:${definition.id}`,
      definitionId: definition.id,
      pursuit,
      encounters: stages.map((stage, stageIndex) => {
        const sectorIndex = pursuit.sectorIndices[stageIndex]!;
        return {
          id: `apex:${definition.id}:${stage}:s${sectorIndex + 1}`,
          threatId: definition.id,
          stage,
          sectorIndex,
          operationalRole: 'gate',
          routeNodeLabel: pursuit.nodeLabels[stageIndex]!,
          label: `${definition.mapCue} ${definition.name}: ${stage}`
        };
      })
    };
  });
  return {
    id: `apex-hunts:${options.seed}:${hashLabel(options.saveFingerprint)}`,
    seed: options.seed,
    saveFingerprint: options.saveFingerprint,
    routeGraphId: options.actRouteGraph.id,
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
      encountersCompleted: []
    })),
    processedEventIds: [],
    history: []
  };
}

export function normalizeLegacyApexBountyState(state: ApexHuntState): ApexHuntState {
  if (!state.threats.some((threat) => threat.status === 'awaitingResolution')) return state;
  return {
    ...state,
    threats: state.threats.map((threat) =>
      threat.status === 'awaitingResolution'
        ? { ...threat, status: 'resolved' as const }
        : threat
    )
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
    const encounterIndex = threatPlan.encounters.findIndex(
      (candidate) => candidate.id === event.encounterId
    );
    const previousEncounter = threatPlan.encounters[encounterIndex - 1];
    if (!encounter || encounter.stage !== event.stage || threat.encountersCompleted.includes(encounter.id)) {
      return rejected(state, 'Apex encounter unavailable');
    }
    if (previousEncounter && !threat.encountersCompleted.includes(previousEncounter.id)) {
      return rejected(state, 'Apex pursuit track has not reached this contact');
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
          ? 'resolved'
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
      encountersCompleted:
        event.outcome === 'failure'
          ? threat.encountersCompleted
          : [...threat.encountersCompleted, encounter.id]
    };
    if (event.stage === 'finale' && event.outcome !== 'failure') {
      rewardUnlockId = definition.rewardUnlockId;
      label = `${definition.name} bounty claimed; target destroyed`;
    } else {
      label = `${definition.name} ${event.stage} ${event.outcome}; integrity ${next.integrity}/${BASE_INTEGRITY}`;
    }
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
  state: ApexHuntState,
  node: Pick<ExpeditionEncounterNode, 'sectorIndex' | 'operationalRole'>
): ApexEncounterPlan | null {
  for (const threatPlan of plan.threats) {
    const encounterIndex = threatPlan.encounters.findIndex(
      (encounter) =>
        encounter.sectorIndex === node.sectorIndex &&
        encounter.operationalRole === node.operationalRole
    );
    if (encounterIndex < 0) continue;
    const threat = state.threats.find(
      (candidate) => candidate.threatId === threatPlan.definitionId
    );
    if (
      !threat ||
      threat.status === 'resolved' ||
      threat.status === 'escaped' ||
      threat.status === 'awaitingResolution'
    ) {
      return null;
    }
    const encounter = threatPlan.encounters[encounterIndex]!;
    const previous = threatPlan.encounters[encounterIndex - 1];
    if (
      threat.encountersCompleted.includes(encounter.id) ||
      (previous && !threat.encountersCompleted.includes(previous.id))
    ) {
      return null;
    }
    return encounter;
  }
  return null;
}

export function getApexPursuitRouteEscapeThreatIds(options: {
  readonly plan: ApexHuntPlan;
  readonly state: ApexHuntState;
  readonly sourceSectorIndex: number;
  readonly targetSectorIndex: number;
}): readonly string[] {
  return options.plan.threats.flatMap((threatPlan) => {
    const threat = options.state.threats.find(
      (candidate) => candidate.threatId === threatPlan.definitionId
    );
    if (!threat || threat.status === 'resolved' || threat.status === 'escaped') return [];
    const encounterIndex = threatPlan.encounters.findIndex(
      (encounter) => encounter.sectorIndex === options.sourceSectorIndex
    );
    if (encounterIndex < 0) return [];
    const encounter = threatPlan.encounters[encounterIndex]!;
    const next = threatPlan.encounters[encounterIndex + 1] ?? null;
    const stepComplete = threat.encountersCompleted.includes(encounter.id);
    const keptTrack = stepComplete && next?.sectorIndex === options.targetSectorIndex;
    return keptTrack ? [] : [threatPlan.definitionId];
  });
}

export function createApexPursuitNavigationReadModel(
  plan: ApexHuntPlan,
  state: ApexHuntState,
  sectorIndex: number
): ApexPursuitNavigationReadModel | null {
  const threatPlan = plan.threats.find(
    (candidate) =>
      sectorIndex >= candidate.pursuit.actStartSectorIndex &&
      sectorIndex <= candidate.pursuit.actEndSectorIndex
  );
  if (!threatPlan) return null;
  const threat = state.threats.find(
    (candidate) => candidate.threatId === threatPlan.definitionId
  );
  if (!threat) return null;
  const definition = getApexThreatDefinition(threatPlan.definitionId);
  const currentIndex = threatPlan.encounters.findIndex(
    (encounter) => encounter.sectorIndex === sectorIndex
  );
  const currentEncounter = currentIndex >= 0 ? threatPlan.encounters[currentIndex]! : null;
  const currentComplete = Boolean(
    currentEncounter && threat.encountersCompleted.includes(currentEncounter.id)
  );
  const revealedNextEncounter =
    currentComplete && threat.status !== 'escaped' && threat.status !== 'resolved'
      ? (threatPlan.encounters[currentIndex + 1] ?? null)
      : null;
  const completedSteps = countCompletedPursuitSteps(threatPlan, threat);
  let summary: string;
  if (threat.status === 'escaped') {
    summary = `${definition.mapCue} ${definition.name} escaped when its seeded track was broken.`;
  } else if (threat.status === 'resolved') {
    summary = `${definition.mapCue} ${definition.name} bounty claimed.`;
  } else if (threat.status === 'awaitingResolution') {
    summary = `${definition.mapCue} ${definition.name} kill confirmed; bounty settlement pending.`;
  } else if (currentEncounter?.stage === 'finale') {
    summary = `${definition.mapCue} Track complete at ${currentEncounter.routeNodeLabel}; the apex body is inside this sector.`;
  } else if (currentEncounter && currentComplete && revealedNextEncounter) {
    summary = `${definition.mapCue} Pursuit ${currentIndex + 1}/${APEX_PURSUIT_STEP_COUNT} secured; track lock reveals ${revealedNextEncounter.routeNodeLabel}.`;
  } else if (currentEncounter) {
    summary = `${definition.mapCue} Pursuit ${currentIndex + 1}/${APEX_PURSUIT_STEP_COUNT} is embedded here; complete the marked contact to decrypt the next signal.`;
  } else {
    summary = `${definition.mapCue} ${definition.name} pursuit is no longer aligned with this signal.`;
  }
  return {
    threatId: threatPlan.definitionId,
    threatName: definition.name,
    mapCue: definition.mapCue,
    status: threat.status,
    step: Math.min(APEX_PURSUIT_STEP_COUNT, Math.max(1, completedSteps + 1)),
    totalSteps: APEX_PURSUIT_STEP_COUNT,
    currentEncounter,
    revealedNextEncounter,
    revealedNextSectorIndex: revealedNextEncounter?.sectorIndex ?? null,
    summary
  };
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
  const escapeRisk = Math.max(
    0,
    Math.min(
      6,
      threat.escapeRoutesOpen +
        threat.migrations +
        Math.ceil(threat.subsystems.propulsion / 2) -
        options.context.fleetSupport
    )
  );
  return {
    threatId: definition.id,
    bossId: definition.bossId,
    bossName: definition.name,
    mapCue: definition.mapCue,
    bossHullDelta,
    reinforcementCount,
    hazardPressure,
    escapeRisk,
    integrityReadout: `Integrity ${threat.integrity}/${BASE_INTEGRITY} | traces ${threat.traces} | lieutenants ${threat.lieutenantsDefeated} | migrations ${threat.migrations} | escape routes ${threat.escapeRoutesOpen}`,
    subsystemReadout: `${definition.subsystemLabels.propulsion} ${threat.subsystems.propulsion}/4 | ${definition.subsystemLabels.armor} ${threat.subsystems.armor}/4 | ${definition.subsystemLabels.core} ${threat.subsystems.core}/4`,
    pressure: [
      {
        id: 'hull',
        label: 'Finale hull',
        value: formatSigned(bossHullDelta),
        detail: bossHullDelta <= 0
          ? 'Hunt damage and support reduced the apex hull budget.'
          : 'Migration pressure rebuilt the apex beyond its baseline hull.',
        tone: bossHullDelta < 0 ? 'advantage' : bossHullDelta > 0 ? 'warning' : 'neutral'
      },
      {
        id: 'escorts',
        label: 'Escort waves',
        value: `${reinforcementCount}/${MAX_APEX_REINFORCEMENTS}`,
        detail: 'Migrations and hostile fronts add escorts; allied fronts remove them.',
        tone: reinforcementCount > 1 ? 'warning' : 'neutral'
      },
      {
        id: 'hazard',
        label: 'Hazard pressure',
        value: `${hazardPressure}/${MAX_APEX_HAZARD_PRESSURE}`,
        detail: 'Open escape routes add hazards; carrier support suppresses them.',
        tone: hazardPressure > 0 ? 'warning' : 'advantage'
      },
      {
        id: 'escape',
        label: 'Escape risk',
        value: `${escapeRisk}/6`,
        detail: 'Open routes, migrations, and intact drives raise risk; fleet control lowers it.',
        tone: escapeRisk > 2 ? 'warning' : escapeRisk === 0 ? 'advantage' : 'neutral'
      }
    ],
    budget: `${reinforcementCount}/${MAX_APEX_REINFORCEMENTS} reinforcements | hazard ${hazardPressure}/${MAX_APEX_HAZARD_PRESSURE} | shared boss/projectile/effect caps`
  };
}

export function createApexEncounterReadModel(
  encounter: ApexEncounterPlan
): ApexEncounterReadModel {
  const definition = getApexThreatDefinition(encounter.threatId);
  const cue = definition.contactCues[encounter.stage];
  return {
    mapCue: definition.mapCue,
    threatName: definition.name,
    stage: encounter.stage,
    stageLabel: encounterStageLabel(encounter.stage),
    label: cue.label,
    directive: cue.directive,
    payoff: cue.payoff,
    banner: `${definition.mapCue} APEX CONTACT // ${cue.label}`,
    hudReadout: `${definition.mapCue} ${definition.name} // ${encounterStageLabel(encounter.stage)} // ${cue.directive}`,
    waveLabel: `${definition.mapCue} ${encounter.stage === 'lieutenant' ? 'marked lieutenant' : encounter.stage === 'finale' ? 'apex body' : 'hunt escort'}`
  };
}

export function createApexThreatReadModel(
  plan: ApexThreatPlan,
  state: ApexThreatState,
  sectorIndex: number
): ApexThreatReadModel {
  const definition = getApexThreatDefinition(state.threatId);
  const completedSteps = countCompletedPursuitSteps(plan, state);
  const actReached = sectorIndex >= plan.pursuit.actStartSectorIndex;
  const terminal = state.status === 'resolved' || state.status === 'escaped';
  const revealedContactIds = new Set(
    plan.encounters
      .filter((_, index) => terminal || (actReached && index <= completedSteps))
      .map((encounter) => encounter.id)
  );
  const contacts = plan.encounters.map((encounter, index): ApexContactReadModel => {
    const cue = definition.contactCues[encounter.stage];
    const completed = state.encountersCompleted.includes(encounter.id);
    const revealed = revealedContactIds.has(encounter.id);
    const status: ApexContactReadModel['status'] = completed
      ? 'resolved'
      : revealed && encounter.sectorIndex < sectorIndex
        ? 'missed'
        : revealed && encounter.sectorIndex === sectorIndex
          ? 'current'
          : 'ahead';
    return {
      id: encounter.id,
      stage: encounter.stage,
      stageLabel: encounterStageLabel(encounter.stage),
      label: cue.label,
      directive: cue.directive,
      payoff: cue.payoff,
      location: revealed
        ? `Signal ${encounter.routeNodeLabel} · ${formatOperationalRole(encounter.operationalRole)}`
        : 'Route signal encrypted',
      status,
      statusLabel: revealed
        ? {
            resolved: 'Contact resolved',
            current: 'Contact in this sector',
            ahead: 'Track revealed',
            missed: 'Contact passed'
          }[status]
        : `Step ${index + 1} encrypted`
    };
  });
  const next = contacts.find(
    (contact) =>
      revealedContactIds.has(contact.id) &&
      (contact.status === 'current' || contact.status === 'ahead')
  );
  const subsystem = (id: keyof ApexSubsystemState): ApexSubsystemReadModel => {
    const current = state.subsystems[id];
    return {
      id,
      label: definition.subsystemLabels[id],
      current,
      maximum: 4,
      condition: current === 0 ? 'Disabled' : current <= 2 ? 'Breached' : current < 4 ? 'Damaged' : 'Intact',
      effect: definition.subsystemEffects[id]
    };
  };
  return {
    id: definition.id,
    mapCue: definition.mapCue,
    name: definition.name,
    title: definition.title,
    summary: definition.summary,
    structureLabel: definition.structureLabel,
    huntDoctrine: definition.huntDoctrine,
    status: state.status,
    statusLabel: threatStatusLabel(state),
    statusDetail: threatStatusDetail(state),
    integrity: state.integrity,
    maximumIntegrity: BASE_INTEGRITY,
    integrityDetail: `${BASE_INTEGRITY - state.integrity} integrity stripped. Every successful contact weakens the finale; migration pressure can rebuild it.`,
    subsystems: [subsystem('propulsion'), subsystem('armor'), subsystem('core')],
    evidence: [
      {
        id: 'traces',
        label: 'Trace intelligence',
        value: `${state.traces}`,
        detail: 'Recovered traces keep the pursuit locked onto the target.',
        tone: state.traces > 0 ? 'advantage' : 'neutral'
      },
      {
        id: 'lieutenants',
        label: 'Command codes',
        value: `${state.lieutenantsDefeated}`,
        detail: 'Defeated lieutenants strip command protection from the finale.',
        tone: state.lieutenantsDefeated > 0 ? 'advantage' : 'neutral'
      },
      {
        id: 'migrations',
        label: 'Migrations',
        value: `${state.migrations}`,
        detail: 'Failed contacts let the apex rebuild and add finale pressure.',
        tone: state.migrations > 0 ? 'warning' : 'advantage'
      },
      {
        id: 'escapeRoutes',
        label: 'Open escape routes',
        value: `${state.escapeRoutesOpen}`,
        detail: 'Open lanes add hazard and escape pressure; ambush wins close them.',
        tone: state.escapeRoutesOpen > 1 ? 'warning' : state.escapeRoutesOpen === 0 ? 'advantage' : 'neutral'
      }
    ],
    contacts,
    nextEncounter: next ? `${next.stageLabel}: ${next.label} · ${next.location}` : null,
    circuitRewardItemIds: definition.circuitRewardItemIds,
    debugLabel: `${definition.mapCue} ${definition.name}: ${state.status} I${state.integrity}/${BASE_INTEGRITY} P${state.subsystems.propulsion} A${state.subsystems.armor} C${state.subsystems.core} M${state.migrations} E${state.escapeRoutesOpen}`
  };
}

export function createApexCampaignReadModel(
  plan: ApexHuntPlan,
  state: ApexHuntState,
  sectorIndex: number
): ApexCampaignReadModel {
  const threats = plan.threats.map((threatPlan) => {
    const threat = state.threats.find((candidate) => candidate.threatId === threatPlan.definitionId);
    if (!threat) throw new Error(`Missing apex threat state ${threatPlan.definitionId}.`);
    return createApexThreatReadModel(threatPlan, threat, sectorIndex);
  });
  const nextEncounters = threats.flatMap((threat) =>
    threat.status !== 'resolved' && threat.status !== 'escaped' && threat.nextEncounter
      ? [threat.nextEncounter]
      : []
  );
  const activeThreats = state.threats.filter(
    (threat) => threat.status !== 'resolved' && threat.status !== 'escaped'
  ).length;
  const resolvedThreats = state.threats.filter((threat) => threat.status === 'resolved').length;
  const awaitingResolution = state.threats.filter(
    (threat) => threat.status === 'awaitingResolution'
  ).length;
  const currentThreat = plan.threats.find(
    (threat) =>
      sectorIndex >= threat.pursuit.actStartSectorIndex &&
      sectorIndex <= threat.pursuit.actEndSectorIndex
  );
  const currentReadout = currentThreat
    ? threats.find((threat) => threat.id === currentThreat.definitionId)
    : null;
  return {
    activeThreats,
    resolvedThreats,
    awaitingResolution,
    threats,
    nextEncounters,
    summary: currentReadout
      ? `Current track ${currentReadout.mapCue} ${currentReadout.name} · ${currentReadout.statusLabel} | ${resolvedThreats}/3 acts resolved`
      : `${activeThreats} active bounties | ${resolvedThreats}/3 claimed`
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
    threats: readout.threats.map((threat) => threat.debugLabel),
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
  if (plan.threats.length !== 3) errors.push('Apex campaign requires one threat in each act.');
  if (!plan.routeGraphId) errors.push('Apex campaign requires an act route graph.');
  const ids = new Set<string>();
  const actIds = new Set<string>();
  for (const threat of plan.threats) {
    if (ids.has(threat.id)) errors.push(`Duplicate apex hunt ${threat.id}.`);
    ids.add(threat.id);
    if (actIds.has(threat.pursuit.actId)) {
      errors.push(`Duplicate apex pursuit act ${threat.pursuit.actId}.`);
    }
    actIds.add(threat.pursuit.actId);
    const definition = getApexThreatDefinition(threat.definitionId);
    if (!APEX_HUNT_STRUCTURES.includes(definition.structure)) errors.push(`Invalid apex structure ${definition.structure}.`);
    if (
      threat.encounters.length !== APEX_PURSUIT_STEP_COUNT ||
      threat.encounters[threat.encounters.length - 1]?.stage !== 'finale'
    ) {
      errors.push(`Apex hunt ${threat.id} requires a four-layer pursuit chain.`);
    }
    if (
      threat.encounters.some(
        (encounter, index) =>
          encounter.sectorIndex !== threat.pursuit.sectorIndices[index] ||
          encounter.routeNodeLabel !== threat.pursuit.nodeLabels[index] ||
          encounter.operationalRole !== 'gate'
      )
    ) {
      errors.push(`Apex hunt ${threat.id} is not aligned with its constellation track.`);
    }
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
    if (!plan.threats.some((entry) => entry.definitionId === threat.threatId) || threat.integrity < 0 || Object.values(threat.subsystems).some((value) => value < 0 || value > 4)) errors.push(`Apex threat state ${threat.threatId} is invalid.`);
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
    if (!threat.structureLabel || !threat.huntDoctrine) {
      errors.push(`Apex threat ${threat.id} requires player-facing hunt doctrine.`);
    }
    if (Object.values(threat.contactCues).some((cue) => !cue.label || !cue.directive || !cue.payoff)) {
      errors.push(`Apex threat ${threat.id} has incomplete contact cues.`);
    }
    if (Object.values(threat.subsystemEffects).some((effect) => !effect)) {
      errors.push(`Apex threat ${threat.id} has incomplete subsystem effects.`);
    }
  }
  for (const structure of APEX_HUNT_STRUCTURES) if (!structures.has(structure)) errors.push(`Missing apex hunt structure ${structure}.`);
  return errors;
}

export function formatApexSummary(plan: ApexHuntPlan, state: ApexHuntState): string {
  const readout = createApexCampaignReadModel(plan, state, 0);
  return `${readout.summary}. ${readout.threats.map((threat) => `${threat.mapCue} ${threat.name}: ${threat.statusLabel}`).join(' | ')}`;
}

function threatStatusLabel(threat: ApexThreatState): string {
  if (threat.status === 'resolved') return 'Bounty claimed';
  return {
    untracked: 'Signal not acquired',
    tracked: 'Located',
    wounded: 'Hunt progressing',
    awaitingResolution: 'Kill confirmed',
    escaped: 'Escaped'
  }[threat.status];
}

function threatStatusDetail(threat: ApexThreatState): string {
  if (threat.status === 'awaitingResolution') {
    return 'The apex combat is complete. This legacy record will settle as a claimed bounty.';
  }
  if (threat.status === 'resolved') return 'Target destroyed. Its apex circuit spoil entered the sector reward pool.';
  if (threat.status === 'escaped') return 'The final contact passed without a successful neutralization.';
  if (threat.status === 'untracked') return 'No trace has been secured yet; its first marked contact remains ahead.';
  if (threat.status === 'tracked') return 'The threat is located, but no lasting subsystem damage is confirmed.';
  return 'Prior contacts inflicted lasting damage that will carry into the finale.';
}

function encounterStageLabel(stage: ApexEncounterStage): string {
  return {
    trace: 'Acquire trace',
    ambush: 'Break escort',
    lieutenant: 'Defeat lieutenant',
    finale: 'Neutralize apex'
  }[stage];
}

function formatOperationalRole(role: ExpeditionOperationalRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function formatSigned(value: number): string {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function countCompletedPursuitSteps(
  plan: ApexThreatPlan,
  state: ApexThreatState
): number {
  let completed = 0;
  for (const encounter of plan.encounters) {
    if (!state.encountersCompleted.includes(encounter.id)) break;
    completed += 1;
  }
  return completed;
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
