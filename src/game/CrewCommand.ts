import {
  CREW_COMMANDS,
  CREW_NAME_PARTS,
  CREW_ROLES,
  getCrewRole,
  type CrewCommand,
  type CrewRoleId
} from '../content/crew';
import { FACTIONS, type FactionId } from '../content/factions';
import type { MissionCrewPolicy } from '../content/objectives';
import { getShipFrameById } from '../content/shipModules';
import { clamp } from '../core/math';
import { createRng } from '../core/rng';
import type { ResolvedShipLoadout } from './ShipLoadout';

export type CrewMemberStatus = 'available' | 'active' | 'injured' | 'departed';

export interface CrewCandidatePlan {
  readonly id: string;
  readonly roleId: CrewRoleId;
  readonly factionId: FactionId;
  readonly name: string;
  readonly callsign: string;
  readonly wingName: string;
  readonly offerSectorIndex: number;
}

export interface CrewRosterPlan {
  readonly id: string;
  readonly seed: string;
  readonly saveFingerprint: string;
  readonly candidates: readonly CrewCandidatePlan[];
}

export interface CrewMemberState {
  readonly candidateId: string;
  readonly status: CrewMemberStatus;
  readonly trust: number;
  readonly recruitedSectorIndex: number | null;
  readonly recoverySectorIndex: number | null;
  readonly missionsCompleted: number;
  readonly enemiesDefeated: number;
  readonly salvageRecovered: number;
  readonly injuries: number;
  readonly retreats: number;
  readonly foundryAssists: number;
  readonly departureReason: string | null;
}

export interface CrewHistoryEntry {
  readonly eventId: string;
  readonly sectorIndex: number;
  readonly label: string;
}

export interface CrewRosterState {
  readonly planId: string;
  readonly members: readonly CrewMemberState[];
  readonly processedEventIds: readonly string[];
  readonly history: readonly CrewHistoryEntry[];
}

export type CrewRosterEvent =
  | {
      readonly id: string;
      readonly type: 'recruit';
      readonly sectorIndex: number;
      readonly candidateId: string;
      readonly commandHeadroom: number;
      readonly source: string;
    }
  | {
      readonly id: string;
      readonly type: 'missionOutcome';
      readonly sectorIndex: number;
      readonly outcome: 'success' | 'partialSuccess' | 'failure';
      readonly crewPolicy: MissionCrewPolicy;
    }
  | {
      readonly id: string;
      readonly type: 'combatOutcome';
      readonly sectorIndex: number;
      readonly candidateId: string;
      readonly injured: boolean;
      readonly retreated: boolean;
      readonly enemiesDefeated: number;
      readonly salvageRecovered: number;
    }
  | {
      readonly id: string;
      readonly type: 'recover';
      readonly sectorIndex: number;
      readonly candidateId: string;
    }
  | {
      readonly id: string;
      readonly type: 'foundryAssist';
      readonly sectorIndex: number;
      readonly candidateId: string;
    };

export interface CrewEventResult {
  readonly state: CrewRosterState;
  readonly disposition: 'applied' | 'duplicate' | 'rejected';
  readonly label: string;
}

export interface CrewCombatMemberProfile {
  readonly candidateId: string;
  readonly name: string;
  readonly callsign: string;
  readonly roleId: CrewRoleId;
  readonly role: string;
  readonly trait: string;
  readonly preferredCommand: CrewCommand;
  readonly commandCost: number;
  readonly maxHull: number;
  readonly moveSpeed: number;
  readonly fireCooldownSeconds: number;
  readonly projectileDamage: number;
  readonly fitLabel: string;
  readonly cue: {
    readonly glyph: string;
    readonly color: string;
    readonly highContrastGlyph: string;
  };
}

export interface CrewCombatProfile {
  readonly members: readonly CrewCombatMemberProfile[];
  readonly commandHeadroom: number;
  readonly commandUsed: number;
  readonly overflowCandidateIds: readonly string[];
}

export interface CrewDebugState {
  readonly planId: string;
  readonly activeCount: number;
  readonly injuredCount: number;
  readonly departedCount: number;
  readonly historyCount: number;
  readonly roster: readonly string[];
}

const MAX_CREW_HISTORY = 64;
const MAX_CREW_EVENTS = 128;
const MAX_ACTIVE_WINGMATES = 3;

export function createCrewRosterPlan(options: {
  readonly seed: string;
  readonly saveFingerprint: string;
  readonly sectorCount: number;
}): CrewRosterPlan {
  const rng = createRng(`${options.seed}:crew-roster:${options.saveFingerprint}`);
  const roles = rng.fork('roles').shuffle(CREW_ROLES);
  const factions = rng.fork('factions').shuffle(FACTIONS);
  const offerSlots = [2, 3, 4, 6, 7];
  const candidates = roles.map((role, index): CrewCandidatePlan => {
    const preferred = factions.find((faction) => role.preferredFactionIds.includes(faction.id));
    const faction = preferred ?? factions[index % factions.length]!;
    const names = CREW_NAME_PARTS[faction.id];
    const candidateRng = rng.fork(`candidate:${role.id}:${faction.id}`);
    const name = candidateRng.choice(names.names);
    const callsign = candidateRng.choice(names.callsigns);
    return {
      id: `crew:${role.id}:${faction.id}`,
      roleId: role.id,
      factionId: faction.id,
      name,
      callsign,
      wingName: candidateRng.choice(['Tin Comet', 'Mercy Vector', 'Spare Orbit', 'Last Lantern']),
      offerSectorIndex: Math.min(
        Math.max(1, offerSlots[index] ?? index + 2),
        Math.max(1, options.sectorCount - 2)
      )
    };
  });

  return {
    id: `crew-roster:${options.seed}:${hashLabel(options.saveFingerprint)}`,
    seed: options.seed,
    saveFingerprint: options.saveFingerprint,
    candidates
  };
}

export function createCrewRosterState(plan: CrewRosterPlan): CrewRosterState {
  return {
    planId: plan.id,
    members: plan.candidates.map((candidate) => createAvailableMember(candidate.id)),
    processedEventIds: [],
    history: []
  };
}

export function applyCrewRosterEvent(
  plan: CrewRosterPlan,
  state: CrewRosterState,
  event: CrewRosterEvent
): CrewEventResult {
  if (state.planId !== plan.id) return rejected(state, 'Crew plan mismatch');
  if (state.processedEventIds.includes(event.id)) {
    return { state, disposition: 'duplicate', label: 'Duplicate crew event' };
  }

  let members = state.members;
  let label: string = event.type;

  if (event.type === 'recruit') {
    const index = memberIndex(state, event.candidateId);
    const member = state.members[index];
    const candidate = plan.candidates.find((entry) => entry.id === event.candidateId);
    if (!member || !candidate || member.status !== 'available') {
      return rejected(state, 'Crew candidate unavailable');
    }
    const role = getCrewRole(candidate.roleId);
    const occupied = getOccupiedCommand(state, plan);
    if (occupied + role.commandCost > Math.max(0, event.commandHeadroom)) {
      return rejected(state, 'Insufficient command capacity');
    }
    members = replaceMember(members, index, {
      ...member,
      status: 'active',
      trust: 3,
      recruitedSectorIndex: event.sectorIndex
    });
    label = `${candidate.callsign} recruited through ${event.source}`;
  } else if (event.type === 'missionOutcome') {
    members = members.map((member) => {
      if (member.status !== 'active') return member;
      const delta =
        event.outcome === 'success'
          ? event.crewPolicy === 'protectSpecialist'
            ? 2
            : 1
          : event.outcome === 'failure' && event.crewPolicy !== 'none'
            ? -2
            : 0;
      const trust = clamp(member.trust + delta, 0, 8);
      if (trust <= 0) {
        return {
          ...member,
          status: 'departed' as const,
          trust,
          departureReason: 'Trust exhausted after mission losses.'
        };
      }
      return {
        ...member,
        trust,
        missionsCompleted: member.missionsCompleted + Number(event.outcome !== 'failure')
      };
    });
    label = `Crew mission ${event.outcome} (${event.crewPolicy})`;
  } else if (event.type === 'combatOutcome') {
    const index = memberIndex(state, event.candidateId);
    const member = state.members[index];
    if (!member || (member.status !== 'active' && member.status !== 'injured')) {
      return rejected(state, 'Crew combat outcome unavailable');
    }
    const trust = clamp(member.trust - Number(event.retreated), 0, 8);
    const next: CrewMemberState = {
      ...member,
      status: event.injured ? 'injured' : trust <= 0 ? 'departed' : 'active',
      trust,
      recoverySectorIndex: event.injured ? event.sectorIndex + 2 : null,
      enemiesDefeated: member.enemiesDefeated + Math.max(0, event.enemiesDefeated),
      salvageRecovered: member.salvageRecovered + Math.max(0, event.salvageRecovered),
      injuries: member.injuries + Number(event.injured),
      retreats: member.retreats + Number(event.retreated),
      departureReason: trust <= 0 ? 'Departed after repeated disengagement orders.' : null
    };
    members = replaceMember(members, index, next);
    label = `${crewName(plan, member.candidateId)} ${event.injured ? 'injured' : event.retreated ? 'disengaged' : 'returned'}`;
  } else if (event.type === 'recover') {
    const index = memberIndex(state, event.candidateId);
    const member = state.members[index];
    if (
      !member ||
      member.status !== 'injured' ||
      member.recoverySectorIndex === null ||
      event.sectorIndex < member.recoverySectorIndex
    ) {
      return rejected(state, 'Crew recovery unavailable');
    }
    members = replaceMember(members, index, {
      ...member,
      status: 'active',
      recoverySectorIndex: null,
      trust: clamp(member.trust + 1, 0, 8)
    });
    label = `${crewName(plan, member.candidateId)} recovered`;
  } else if (event.type === 'foundryAssist') {
    const index = memberIndex(state, event.candidateId);
    const member = state.members[index];
    if (!member || member.status !== 'active') return rejected(state, 'Crew assist unavailable');
    members = replaceMember(members, index, {
      ...member,
      foundryAssists: member.foundryAssists + 1,
      trust: clamp(member.trust + 1, 0, 8)
    });
    label = `${crewName(plan, member.candidateId)} assisted the foundry`;
  }

  return {
    state: {
      ...state,
      members,
      processedEventIds: [...state.processedEventIds, event.id].slice(-MAX_CREW_EVENTS),
      history: [
        ...state.history,
        { eventId: event.id, sectorIndex: event.sectorIndex, label }
      ].slice(-MAX_CREW_HISTORY)
    },
    disposition: 'applied',
    label
  };
}

export function recoverEligibleCrew(
  plan: CrewRosterPlan,
  state: CrewRosterState,
  sectorIndex: number
): CrewRosterState {
  return state.members.reduce((next, member) => {
    if (
      member.status !== 'injured' ||
      member.recoverySectorIndex === null ||
      sectorIndex < member.recoverySectorIndex
    ) {
      return next;
    }
    return applyCrewRosterEvent(plan, next, {
      id: `crew-recover:${member.candidateId}:${sectorIndex}`,
      type: 'recover',
      sectorIndex,
      candidateId: member.candidateId
    }).state;
  }, state);
}

export function getRecruitableCrewCandidate(
  plan: CrewRosterPlan,
  state: CrewRosterState,
  options: {
    readonly sectorIndex: number;
    readonly crewPolicy: MissionCrewPolicy;
    readonly factionId: FactionId;
    readonly factionSignal: boolean;
    readonly commandHeadroom: number;
  }
): CrewCandidatePlan | null {
  if (options.crewPolicy === 'none' && !options.factionSignal) return null;
  const occupied = getOccupiedCommand(state, plan);
  const candidates = plan.candidates.filter((candidate) => {
    const member = state.members.find((entry) => entry.candidateId === candidate.id);
    const role = getCrewRole(candidate.roleId);
    return (
      member?.status === 'available' &&
      candidate.offerSectorIndex <= options.sectorIndex &&
      (options.factionSignal || role.eligibleMissionPolicies.includes(options.crewPolicy)) &&
      occupied + role.commandCost <= options.commandHeadroom
    );
  });
  return (
    candidates.find((candidate) => candidate.factionId === options.factionId) ??
    candidates[0] ??
    null
  );
}

export function createCrewCombatProfile(
  plan: CrewRosterPlan,
  state: CrewRosterState,
  loadout: ResolvedShipLoadout,
  options: { readonly excludedCandidateIds?: readonly string[] } = {}
): CrewCombatProfile {
  const headroom = Math.max(0, loadout.resources.commandHeadroom);
  const excluded = new Set(options.excludedCandidateIds ?? []);
  const active = state.members.filter(
    (member) => member.status === 'active' && !excluded.has(member.candidateId)
  );
  const members: CrewCombatMemberProfile[] = [];
  const overflowCandidateIds: string[] = [];
  let used = 0;

  for (const member of active) {
    const candidate = plan.candidates.find((entry) => entry.id === member.candidateId);
    if (!candidate) continue;
    const role = getCrewRole(candidate.roleId);
    if (members.length >= MAX_ACTIVE_WINGMATES || used + role.commandCost > headroom) {
      overflowCandidateIds.push(candidate.id);
      continue;
    }
    const fit = getCrewLoadoutFit(candidate, loadout);
    members.push({
      candidateId: candidate.id,
      name: candidate.name,
      callsign: candidate.callsign,
      roleId: candidate.roleId,
      role: role.role,
      trait: role.trait,
      preferredCommand: role.preferredCommand,
      commandCost: role.commandCost,
      maxHull: role.hull + Number(fit.score > 0),
      moveSpeed: role.moveSpeed,
      fireCooldownSeconds: role.fireCooldownSeconds,
      projectileDamage: role.projectileDamage + Number(fit.score >= 2),
      fitLabel: fit.label,
      cue: role.cue
    });
    used += role.commandCost;
  }

  return { members, commandHeadroom: headroom, commandUsed: used, overflowCandidateIds };
}

export function getCrewFoundryAssist(
  plan: CrewRosterPlan,
  state: CrewRosterState
): { readonly candidateId: string; readonly label: string; readonly salvageBonus: number } | null {
  const member = state.members.find((entry) => {
    if (entry.status !== 'active') return false;
    const candidate = plan.candidates.find((item) => item.id === entry.candidateId);
    return candidate?.roleId === 'crew_engineer' || candidate?.roleId === 'crew_salvager';
  });
  if (!member) return null;
  const candidate = plan.candidates.find((entry) => entry.id === member.candidateId)!;
  const role = getCrewRole(candidate.roleId);
  return {
    candidateId: candidate.id,
    label: `${candidate.callsign} (${role.role}) adds +1 committed salvage and steadies the operation.`,
    salvageBonus: 1
  };
}

export function createCrewDebugState(plan: CrewRosterPlan, state: CrewRosterState): CrewDebugState {
  return {
    planId: plan.id,
    activeCount: state.members.filter((member) => member.status === 'active').length,
    injuredCount: state.members.filter((member) => member.status === 'injured').length,
    departedCount: state.members.filter((member) => member.status === 'departed').length,
    historyCount: state.history.length,
    roster: state.members
      .filter((member) => member.status !== 'available')
      .map((member) => {
        const candidate = plan.candidates.find((entry) => entry.id === member.candidateId)!;
        return `${candidate.callsign}:${member.status}:T${member.trust}:K${member.enemiesDefeated}:S${member.salvageRecovered}`;
      })
  };
}

export function createDebugCrewRosterState(plan: CrewRosterPlan): CrewRosterState {
  let state = createCrewRosterState(plan);
  for (const [index, candidate] of plan.candidates.slice(0, 3).entries()) {
    state = applyCrewRosterEvent(plan, state, {
      id: `debug-crew-recruit:${candidate.id}`,
      type: 'recruit',
      sectorIndex: 2 + index,
      candidateId: candidate.id,
      commandHeadroom: 99,
      source: index === 0 ? 'distress rescue' : 'specialist transfer'
    }).state;
  }
  return state;
}

export function formatCrewRosterSummary(
  plan: CrewRosterPlan,
  state: CrewRosterState,
  runOutcome?: string
): string {
  const known = state.members.filter((member) => member.status !== 'available');
  if (known.length === 0) return 'No distress recruit joined this expedition.';
  return known
    .map((member) => {
      const candidate = plan.candidates.find((entry) => entry.id === member.candidateId)!;
      const role = getCrewRole(candidate.roleId);
      const finale =
        runOutcome === 'victory' && member.status === 'active' ? 'finale survivor' : member.status;
      return `${candidate.callsign} / ${role.role}: ${finale}, trust ${member.trust}, ${member.enemiesDefeated} defeats, ${member.salvageRecovered} salvage, ${member.injuries} injuries`;
    })
    .join(' | ');
}

export function validateCrewContent(
  options: {
    readonly roles?: typeof CREW_ROLES;
  } = {}
): string[] {
  const roles = options.roles ?? CREW_ROLES;
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const role of roles) {
    if (ids.has(role.id)) errors.push(`Duplicate crew role id: ${role.id}`);
    ids.add(role.id);
    if (!CREW_COMMANDS.includes(role.preferredCommand)) {
      errors.push(`Crew role ${role.id} has invalid preferred command.`);
    }
    if (role.commandCost < 1 || role.commandCost > 3) {
      errors.push(`Crew role ${role.id} has invalid command cost.`);
    }
    if (role.hull < 1 || role.moveSpeed <= 0 || role.fireCooldownSeconds <= 0) {
      errors.push(`Crew role ${role.id} has invalid combat budget.`);
    }
    if (role.eligibleMissionPolicies.length === 0) {
      errors.push(`Crew role ${role.id} has no mission acquisition policy.`);
    }
    if (!role.cue.glyph || !role.cue.highContrastGlyph) {
      errors.push(`Crew role ${role.id} has incomplete non-color cue.`);
    }
  }
  if (roles.length < 4) errors.push('At least four crew roles are required.');
  return errors;
}

function getCrewLoadoutFit(
  candidate: CrewCandidatePlan,
  loadout: ResolvedShipLoadout
): { readonly score: number; readonly label: string } {
  const role = getCrewRole(candidate.roleId);
  const frame = getShipFrameById(loadout.frameId);
  const moduleTags = new Set(loadout.mounts.flatMap((mount) => mount.moduleTags));
  const frameMatches = role.preferredFrameTags.filter((tag) => frame.tags.includes(tag));
  const moduleMatches = role.preferredModuleTags.filter((tag) => moduleTags.has(tag));
  const score = frameMatches.length + moduleMatches.length;
  return {
    score,
    label:
      score > 0 ? `Fit ${[...frameMatches, ...moduleMatches].join('+')}` : `Off-fit ${frame.name}`
  };
}

function createAvailableMember(candidateId: string): CrewMemberState {
  return {
    candidateId,
    status: 'available',
    trust: 0,
    recruitedSectorIndex: null,
    recoverySectorIndex: null,
    missionsCompleted: 0,
    enemiesDefeated: 0,
    salvageRecovered: 0,
    injuries: 0,
    retreats: 0,
    foundryAssists: 0,
    departureReason: null
  };
}

function getOccupiedCommand(state: CrewRosterState, plan: CrewRosterPlan): number {
  return state.members.reduce((total, member) => {
    if (member.status !== 'active' && member.status !== 'injured') return total;
    const candidate = plan.candidates.find((entry) => entry.id === member.candidateId);
    return total + (candidate ? getCrewRole(candidate.roleId).commandCost : 0);
  }, 0);
}

function memberIndex(state: CrewRosterState, candidateId: string): number {
  return state.members.findIndex((member) => member.candidateId === candidateId);
}

function replaceMember(
  members: readonly CrewMemberState[],
  index: number,
  member: CrewMemberState
): readonly CrewMemberState[] {
  return members.map((candidate, memberIndex) => (memberIndex === index ? member : candidate));
}

function crewName(plan: CrewRosterPlan, candidateId: string): string {
  return plan.candidates.find((candidate) => candidate.id === candidateId)?.callsign ?? candidateId;
}

function rejected(state: CrewRosterState, label: string): CrewEventResult {
  return { state, disposition: 'rejected', label };
}

function hashLabel(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
