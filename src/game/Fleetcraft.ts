import {
  FLEET_DOCTRINES,
  FLEET_REFITS,
  SUPPORT_CRAFT,
  SUPPORT_CRAFT_ROLES,
  getSupportCraftDefinition,
  type FleetDoctrine,
  type FleetRefit,
  type SupportCraftRole
} from '../content/supportCraft';
import type { CrewCommand } from '../content/crew';
import { createRng } from '../core/rng';
import type { CrewRosterState } from './CrewCommand';

export type FleetCraftStatus = 'blueprint' | 'ready' | 'damaged' | 'lost';

export interface FleetCraftPlan {
  readonly id: string;
  readonly definitionId: string;
  readonly callsign: string;
  readonly serial: string;
}

export interface FleetPlan {
  readonly id: string;
  readonly seed: string;
  readonly saveFingerprint: string;
  readonly craft: readonly FleetCraftPlan[];
}

export interface FleetCraftState {
  readonly craftId: string;
  readonly status: FleetCraftStatus;
  readonly hull: number;
  readonly doctrine: FleetDoctrine;
  readonly refit: FleetRefit;
  readonly assignedCrewId: string | null;
  readonly componentIds: readonly string[];
  readonly deployments: number;
  readonly defeats: number;
  readonly salvageRecovered: number;
  readonly losses: number;
  readonly repairs: number;
  readonly recoveries: number;
}

export interface FleetHistoryEntry {
  readonly eventId: string;
  readonly sectorIndex: number;
  readonly label: string;
}

export interface FleetState {
  readonly planId: string;
  readonly craft: readonly FleetCraftState[];
  readonly processedEventIds: readonly string[];
  readonly history: readonly FleetHistoryEntry[];
}

export type FleetCommand =
  | { readonly kind: 'construct'; readonly craftId: string; readonly componentId: string }
  | { readonly kind: 'repair'; readonly craftId: string }
  | { readonly kind: 'recover'; readonly craftId: string }
  | {
      readonly kind: 'refit';
      readonly craftId: string;
      readonly componentId: string;
      readonly refit: Exclude<FleetRefit, 'standard'>;
    }
  | { readonly kind: 'assign'; readonly craftId: string; readonly candidateId: string | null }
  | { readonly kind: 'setDoctrine'; readonly craftId: string; readonly doctrine: FleetDoctrine };

export interface FleetCommandResult {
  readonly state: FleetState;
  readonly disposition: 'applied' | 'duplicate' | 'rejected';
  readonly label: string;
  readonly salvageCost: number;
  readonly consumedComponentId: string | null;
}

export interface FleetCommandOption {
  readonly id: string;
  readonly label: string;
  readonly meta: string;
  readonly summary: string;
  readonly disabled: boolean;
  readonly command: FleetCommand;
}

export interface FleetCombatMemberProfile {
  readonly craftId: string;
  readonly callsign: string;
  readonly role: string;
  readonly trait: string;
  readonly preferredCommand: CrewCommand;
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

export interface FleetCombatProfile {
  readonly doctrine: string;
  readonly members: readonly FleetCombatMemberProfile[];
  readonly readyCraft: number;
  readonly deployedCraft: number;
  readonly berthCapacity: number;
  readonly allySlotCapacity: number;
  readonly overflowCraftIds: readonly string[];
}

export interface FleetCombatOutcome {
  readonly craftId: string;
  readonly lost: boolean;
  readonly retreated: boolean;
  readonly remainingHull: number;
  readonly enemiesDefeated: number;
  readonly salvageRecovered: number;
}

export interface FleetInfluence {
  readonly readyCraft: number;
  readonly damagedCraft: number;
  readonly lostCraft: number;
  readonly assignedCrewIds: readonly string[];
  readonly boardingAssist: number;
  readonly optionalSalvageBonus: number;
  readonly pursuitControl: number;
  readonly projectileScreen: number;
  readonly carrierProtection: number;
  readonly repairSupport: number;
  readonly frontPressure: number;
  readonly summary: string;
}

export interface FleetReadModel {
  readonly capacity: string;
  readonly summary: string;
  readonly craft: readonly string[];
  readonly availableActions: number;
}

export interface FleetDebugState {
  readonly planId: string;
  readonly ready: number;
  readonly damaged: number;
  readonly lost: number;
  readonly deployed: number;
  readonly historyCount: number;
  readonly craft: readonly string[];
  readonly budget: string;
}

const MAX_FLEET_HISTORY = 64;
const MAX_FLEET_EVENTS = 128;
const FLEET_CRAFT_STATUSES: readonly FleetCraftStatus[] = [
  'blueprint',
  'ready',
  'damaged',
  'lost'
];
export const MAX_COMBINED_ALLIES = 4;
export const MAX_COMBINED_ALLY_PROJECTILES = 20;

export function createFleetPlan(options: {
  readonly seed: string;
  readonly saveFingerprint: string;
}): FleetPlan {
  const rng = createRng(`${options.seed}:fleetcraft:${options.saveFingerprint}`);
  const words = rng
    .fork('callsigns')
    .shuffle(['Kite', 'Latch', 'Mica', 'Rook', 'Vesper', 'Coldstar', 'Tern', 'Anvil']);
  const definitions = rng.fork('roles').shuffle(SUPPORT_CRAFT);
  return {
    id: `fleet:${options.seed}:${hashLabel(options.saveFingerprint)}`,
    seed: options.seed,
    saveFingerprint: options.saveFingerprint,
    craft: definitions.map((definition, index) => ({
      id: `craft:${definition.role}:${index + 1}`,
      definitionId: definition.id,
      callsign: `${words[index % words.length]}-${index + 1}`,
      serial: `${definition.role.slice(0, 3).toUpperCase()}-${rng.fork(`serial-${index}`).int(100, 999)}`
    }))
  };
}

export function createFleetState(plan: FleetPlan): FleetState {
  return {
    planId: plan.id,
    craft: plan.craft.map((entry) => {
      const definition = getSupportCraftDefinition(entry.definitionId);
      return {
        craftId: entry.id,
        status: 'blueprint',
        hull: 0,
        doctrine: definition.defaultDoctrine,
        refit: 'standard',
        assignedCrewId: null,
        componentIds: [],
        deployments: 0,
        defeats: 0,
        salvageRecovered: 0,
        losses: 0,
        repairs: 0,
        recoveries: 0
      };
    }),
    processedEventIds: [],
    history: []
  };
}

export function applyFleetCommand(options: {
  readonly plan: FleetPlan;
  readonly state: FleetState;
  readonly command: FleetCommand;
  readonly eventId: string;
  readonly sectorIndex: number;
  readonly salvage: number;
  readonly cargoComponentIds: readonly string[];
  readonly berthCapacity: number;
  readonly foundryAvailable: boolean;
  readonly crewState: CrewRosterState;
}): FleetCommandResult {
  if (options.state.planId !== options.plan.id)
    return rejected(options.state, 'Fleet plan mismatch');
  if (options.state.processedEventIds.includes(options.eventId)) {
    return {
      state: options.state,
      disposition: 'duplicate',
      label: 'Duplicate fleet command',
      salvageCost: 0,
      consumedComponentId: null
    };
  }
  const craftIndex = options.state.craft.findIndex(
    (craft) => craft.craftId === options.command.craftId
  );
  const craftState = options.state.craft[craftIndex];
  const craftPlan = options.plan.craft.find((craft) => craft.id === options.command.craftId);
  if (!craftState || !craftPlan) return rejected(options.state, 'Unknown fleet craft');
  const definition = getSupportCraftDefinition(craftPlan.definitionId);
  let next = craftState;
  let salvageCost = 0;
  let consumedComponentId: string | null = null;
  let label: string = options.command.kind;

  if (options.command.kind === 'construct') {
    const occupied = options.state.craft.filter(
      (craft) => craft.status === 'ready' || craft.status === 'damaged'
    ).length;
    if (craftState.status !== 'blueprint' || occupied >= options.berthCapacity)
      return rejected(options.state, 'No open operational fleet berth');
    if (!options.cargoComponentIds.includes(options.command.componentId))
      return rejected(options.state, 'Construction component unavailable');
    salvageCost = definition.buildSalvage;
    if (options.salvage < salvageCost)
      return rejected(options.state, 'Insufficient salvage for construction');
    consumedComponentId = options.command.componentId;
    next = {
      ...craftState,
      status: 'ready',
      hull: definition.maxHull,
      componentIds: [options.command.componentId]
    };
    label = `${craftPlan.callsign} constructed as ${definition.label}`;
  } else if (options.command.kind === 'repair') {
    if (craftState.status !== 'damaged')
      return rejected(options.state, 'Craft does not need repair');
    salvageCost = Math.max(
      1,
      definition.repairSalvage -
        Number(createFleetInfluence(options.plan, options.state).repairSupport > 0)
    );
    if (options.salvage < salvageCost)
      return rejected(options.state, 'Insufficient salvage for repair');
    next = {
      ...craftState,
      status: 'ready',
      hull: getFleetCraftMaxHull(definition.maxHull, craftState.refit),
      repairs: craftState.repairs + 1
    };
    label = `${craftPlan.callsign} repaired`;
  } else if (options.command.kind === 'recover') {
    if (craftState.status !== 'lost' || !options.foundryAvailable)
      return rejected(options.state, 'Lost craft recovery requires an operational foundry');
    salvageCost = Math.max(
      2,
      definition.repairSalvage +
        1 -
        Number(createFleetInfluence(options.plan, options.state).repairSupport > 0)
    );
    const occupied = options.state.craft.filter(
      (craft) => craft.status === 'ready' || craft.status === 'damaged'
    ).length;
    if (options.salvage < salvageCost || occupied >= options.berthCapacity)
      return rejected(options.state, 'Recovery resources unavailable');
    next = {
      ...craftState,
      status: 'damaged',
      hull: 1,
      assignedCrewId: null,
      recoveries: craftState.recoveries + 1
    };
    label = `${craftPlan.callsign} recovered as a damaged hull`;
  } else if (options.command.kind === 'refit') {
    if (craftState.status !== 'ready' || craftState.refit !== 'standard')
      return rejected(options.state, 'Craft refit unavailable');
    if (!options.cargoComponentIds.includes(options.command.componentId))
      return rejected(options.state, 'Refit component unavailable');
    salvageCost = 2;
    if (options.salvage < salvageCost)
      return rejected(options.state, 'Insufficient salvage for refit');
    consumedComponentId = options.command.componentId;
    next = {
      ...craftState,
      refit: options.command.refit,
      componentIds: [...craftState.componentIds, options.command.componentId],
      hull: getFleetCraftMaxHull(definition.maxHull, options.command.refit)
    };
    label = `${craftPlan.callsign} refit for ${options.command.refit}`;
  } else if (options.command.kind === 'assign') {
    const candidateId = options.command.candidateId;
    if (craftState.status === 'blueprint' || craftState.status === 'lost')
      return rejected(options.state, 'Craft assignment unavailable');
    if (candidateId !== null) {
      const crew = options.crewState.members.find((member) => member.candidateId === candidateId);
      const alreadyAssigned = options.state.craft.some(
        (craft) => craft.craftId !== craftState.craftId && craft.assignedCrewId === candidateId
      );
      if (crew?.status !== 'active' || alreadyAssigned)
        return rejected(options.state, 'Crew pilot unavailable');
    }
    next = { ...craftState, assignedCrewId: candidateId };
    label = `${craftPlan.callsign} assigned to ${candidateId ?? 'automation'}`;
  } else if (options.command.kind === 'setDoctrine') {
    if (craftState.status === 'blueprint' || craftState.status === 'lost')
      return rejected(options.state, 'Craft doctrine unavailable');
    next = { ...craftState, doctrine: options.command.doctrine };
    label = `${craftPlan.callsign} doctrine ${options.command.doctrine}`;
  }
  return applied(
    options.state,
    craftIndex,
    next,
    options.eventId,
    options.sectorIndex,
    label,
    salvageCost,
    consumedComponentId
  );
}

export function recordFleetCombatOutcomes(options: {
  readonly plan: FleetPlan;
  readonly state: FleetState;
  readonly outcomes: readonly FleetCombatOutcome[];
  readonly eventId: string;
  readonly sectorIndex: number;
}): FleetState {
  if (
    options.state.planId !== options.plan.id ||
    options.state.processedEventIds.includes(options.eventId)
  )
    return options.state;
  const byId = new Map(options.outcomes.map((outcome) => [outcome.craftId, outcome]));
  const craft = options.state.craft.map((entry) => {
    const outcome = byId.get(entry.craftId);
    if (!outcome) return entry;
    return {
      ...entry,
      status: outcome.lost
        ? ('lost' as const)
        : outcome.remainingHull < getCraftMaxHull(options.plan, entry)
          ? ('damaged' as const)
          : ('ready' as const),
      hull: outcome.lost ? 0 : Math.max(1, outcome.remainingHull),
      assignedCrewId: outcome.lost ? null : entry.assignedCrewId,
      deployments: entry.deployments + 1,
      defeats: entry.defeats + Math.max(0, outcome.enemiesDefeated),
      salvageRecovered: entry.salvageRecovered + Math.max(0, outcome.salvageRecovered),
      losses: entry.losses + Number(outcome.lost)
    };
  });
  const lost = options.outcomes.filter((outcome) => outcome.lost).length;
  const label = `Fleet returned: ${options.outcomes.length - lost} craft, ${lost} lost`;
  return appendHistory({ ...options.state, craft }, options.eventId, options.sectorIndex, label);
}

export function createFleetCombatProfile(options: {
  readonly plan: FleetPlan;
  readonly state: FleetState;
  readonly berthCapacity: number;
  readonly allySlotsAvailable: number;
}): FleetCombatProfile {
  const ready = options.state.craft.filter(
    (craft) => craft.status === 'ready' && craft.doctrine !== 'reserve'
  );
  const members: FleetCombatMemberProfile[] = [];
  const overflowCraftIds: string[] = [];
  let berthUsed = 0;
  for (const state of ready) {
    const plan = options.plan.craft.find((craft) => craft.id === state.craftId)!;
    const definition = getSupportCraftDefinition(plan.definitionId);
    const berthCost = state.refit === 'overdrive' ? 2 : 1;
    if (
      members.length >= Math.max(0, options.allySlotsAvailable) ||
      berthUsed + berthCost > options.berthCapacity
    ) {
      overflowCraftIds.push(state.craftId);
      continue;
    }
    const crewed = state.assignedCrewId !== null;
    members.push({
      craftId: state.craftId,
      callsign: plan.callsign,
      role: definition.label,
      trait: `${definition.summary} ${crewed ? 'Crew-piloted.' : 'Automation-limited.'}`,
      preferredCommand: doctrineCommand(state.doctrine, definition.preferredCommand),
      maxHull: getFleetCraftMaxHull(definition.maxHull, state.refit),
      moveSpeed: definition.moveSpeed * (state.refit === 'overdrive' ? 1.15 : 1),
      fireCooldownSeconds: definition.fireCooldownSeconds * (crewed ? 0.9 : 1.08),
      projectileDamage:
        definition.projectileDamage + Number(crewed) + Number(state.refit === 'overdrive'),
      fitLabel: `${state.doctrine}/${state.refit}/${crewed ? 'crew' : 'auto'}`,
      cue: definition.cue
    });
    berthUsed += berthCost;
  }
  return {
    doctrine: members.map((member) => member.preferredCommand).join('+') || 'reserve',
    members,
    readyCraft: ready.length,
    deployedCraft: members.length,
    berthCapacity: options.berthCapacity,
    allySlotCapacity: options.allySlotsAvailable,
    overflowCraftIds
  };
}

export function createFleetInfluence(plan: FleetPlan, state: FleetState): FleetInfluence {
  const active = state.craft.filter((craft) => craft.status === 'ready');
  const roleCounts = Object.fromEntries(SUPPORT_CRAFT_ROLES.map((role) => [role, 0])) as Record<
    SupportCraftRole,
    number
  >;
  for (const craft of active) {
    const entry = plan.craft.find((candidate) => candidate.id === craft.craftId)!;
    roleCounts[getSupportCraftDefinition(entry.definitionId).role] += 1;
  }
  const readyCraft = state.craft.filter((craft) => craft.status === 'ready').length;
  const damagedCraft = state.craft.filter((craft) => craft.status === 'damaged').length;
  const lostCraft = state.craft.filter((craft) => craft.status === 'lost').length;
  return {
    readyCraft,
    damagedCraft,
    lostCraft,
    assignedCrewIds: state.craft
      .map((craft) => craft.assignedCrewId)
      .filter((id): id is string => id !== null),
    boardingAssist: roleCounts.boardingPod,
    optionalSalvageBonus: roleCounts.salvageSkiff,
    pursuitControl: roleCounts.interceptor,
    projectileScreen: roleCounts.screenDrone,
    carrierProtection: roleCounts.shieldTender,
    repairSupport: roleCounts.repairTug,
    frontPressure: Math.min(3, readyCraft + roleCounts.boardingPod),
    summary: `${readyCraft} ready | ${damagedCraft} damaged | ${lostCraft} lost | roles ${
      Object.entries(roleCounts)
        .filter(([, count]) => count > 0)
        .map(([role, count]) => `${role}:${count}`)
        .join(', ') || 'none'
    }`
  };
}

export function createFleetReadModel(options: {
  readonly plan: FleetPlan;
  readonly state: FleetState;
  readonly berthCapacity: number;
  readonly cargoComponentIds: readonly string[];
  readonly salvage: number;
}): FleetReadModel {
  const influence = createFleetInfluence(options.plan, options.state);
  const occupied = options.state.craft.filter(
    (craft) => craft.status === 'ready' || craft.status === 'damaged'
  ).length;
  return {
    capacity: `${occupied}/${options.berthCapacity} berths | ${options.cargoComponentIds.length} components`,
    summary: influence.summary,
    craft: options.state.craft.map((craft) => {
      const entry = options.plan.craft.find((candidate) => candidate.id === craft.craftId)!;
      const definition = getSupportCraftDefinition(entry.definitionId);
      return `${entry.callsign} ${definition.label}: ${craft.status} H${craft.hull}/${getFleetCraftMaxHull(definition.maxHull, craft.refit)} ${craft.doctrine}/${craft.refit} ${craft.assignedCrewId ?? 'auto'} D${craft.deployments} L${craft.losses}`;
    }),
    availableActions: options.state.craft.filter((craft) => {
      const entry = options.plan.craft.find((candidate) => candidate.id === craft.craftId)!;
      const definition = getSupportCraftDefinition(entry.definitionId);
      return (
        (craft.status === 'blueprint' &&
          occupied < options.berthCapacity &&
          options.cargoComponentIds.length > 0 &&
          options.salvage >= definition.buildSalvage) ||
        craft.status === 'damaged' ||
        craft.status === 'lost' ||
        craft.status === 'ready'
      );
    }).length
  };
}

export function createFleetCommandOptions(options: {
  readonly plan: FleetPlan;
  readonly state: FleetState;
  readonly berthCapacity: number;
  readonly cargoComponentIds: readonly string[];
  readonly salvage: number;
  readonly foundryAvailable: boolean;
  readonly crewState: CrewRosterState;
}): FleetCommandOption[] {
  const actions: FleetCommandOption[] = [];
  const occupied = options.state.craft.filter(
    (craft) => craft.status === 'ready' || craft.status === 'damaged'
  ).length;
  const componentId = options.cargoComponentIds[0] ?? null;
  for (const state of options.state.craft) {
    const plan = options.plan.craft.find((candidate) => candidate.id === state.craftId)!;
    const definition = getSupportCraftDefinition(plan.definitionId);
    if (state.status === 'blueprint' && componentId) {
      actions.push({
        id: `fleet-build-${state.craftId}`,
        label: `Construct ${plan.callsign}`,
        meta: `${definition.label} | ${definition.buildSalvage} salvage + component`,
        summary: `${definition.summary} Itinerary: ${definition.itineraryUse}.`,
        disabled: occupied >= options.berthCapacity || options.salvage < definition.buildSalvage,
        command: { kind: 'construct', craftId: state.craftId, componentId }
      });
      continue;
    }
    if (state.status === 'damaged') {
      actions.push({
        id: `fleet-repair-${state.craftId}`,
        label: `Repair ${plan.callsign}`,
        meta: `${definition.repairSalvage} salvage`,
        summary: 'Restore the craft to launch condition.',
        disabled: options.salvage < definition.repairSalvage,
        command: { kind: 'repair', craftId: state.craftId }
      });
    }
    if (state.status === 'lost') {
      actions.push({
        id: `fleet-recover-${state.craftId}`,
        label: `Recover ${plan.callsign}`,
        meta: `${definition.repairSalvage + 1} salvage | foundry`,
        summary: 'Reconstruct a damaged hull from its retained launch record.',
        disabled: !options.foundryAvailable || options.berthCapacity < 1,
        command: { kind: 'recover', craftId: state.craftId }
      });
    }
    if (state.status !== 'ready' && state.status !== 'damaged') continue;
    for (const doctrine of FLEET_DOCTRINES.filter((candidate) => candidate !== state.doctrine)) {
      actions.push({
        id: `fleet-doctrine-${state.craftId}-${doctrine}`,
        label: `${plan.callsign}: ${doctrine}`,
        meta: 'Doctrine | no resource cost',
        summary: `Replace ${state.doctrine} behavior with ${doctrine}; reserve craft do not launch.`,
        disabled: false,
        command: { kind: 'setDoctrine', craftId: state.craftId, doctrine }
      });
    }
    const activeCrew = options.crewState.members.filter((member) => member.status === 'active');
    if (state.assignedCrewId) {
      actions.push({
        id: `fleet-automate-${state.craftId}`,
        label: `Automate ${plan.callsign}`,
        meta: 'Release assigned pilot',
        summary: 'Return the pilot to the crew wing; automation fires more slowly.',
        disabled: false,
        command: { kind: 'assign', craftId: state.craftId, candidateId: null }
      });
    } else if (activeCrew[0]) {
      actions.push({
        id: `fleet-assign-${state.craftId}-${activeCrew[0].candidateId}`,
        label: `Assign pilot to ${plan.callsign}`,
        meta: activeCrew[0].candidateId,
        summary: 'Improve craft response while removing that specialist from the ordinary wing.',
        disabled: options.state.craft.some(
          (craft) => craft.assignedCrewId === activeCrew[0]!.candidateId
        ),
        command: {
          kind: 'assign',
          craftId: state.craftId,
          candidateId: activeCrew[0].candidateId
        }
      });
    }
    if (state.status === 'ready' && state.refit === 'standard' && componentId) {
      for (const refit of ['overdrive', 'reinforced'] as const) {
        actions.push({
          id: `fleet-refit-${state.craftId}-${refit}`,
          label: `${plan.callsign}: ${refit} refit`,
          meta: '2 salvage + component',
          summary:
            refit === 'overdrive'
              ? 'Gain speed and damage, but consume two launch berths.'
              : 'Gain one hull without changing berth use.',
          disabled: options.salvage < 2,
          command: { kind: 'refit', craftId: state.craftId, componentId, refit }
        });
      }
    }
  }
  return actions;
}

export function createFleetDebugState(
  plan: FleetPlan,
  state: FleetState,
  deployed = 0
): FleetDebugState {
  const influence = createFleetInfluence(plan, state);
  return {
    planId: plan.id,
    ready: influence.readyCraft,
    damaged: influence.damagedCraft,
    lost: influence.lostCraft,
    deployed,
    historyCount: state.history.length,
    craft: createFleetReadModel({
      plan,
      state,
      berthCapacity: 2,
      cargoComponentIds: [],
      salvage: 0
    }).craft,
    budget: `${MAX_COMBINED_ALLIES} combined allies | ${MAX_COMBINED_ALLY_PROJECTILES} ally projectiles`
  };
}

export function createDebugFleetState(plan: FleetPlan): FleetState {
  let state = createFleetState(plan);
  const craft = state.craft.map((entry, index) => {
    const craftPlan = plan.craft[index]!;
    const definition = getSupportCraftDefinition(craftPlan.definitionId);
    if (index > 2) return entry;
    return {
      ...entry,
      status: index === 2 ? ('damaged' as const) : ('ready' as const),
      hull: index === 2 ? 1 : definition.maxHull,
      doctrine:
        index === 0
          ? ('escort' as const)
          : index === 1
            ? ('screen' as const)
            : ('reserve' as const),
      componentIds: [`debug-component-${index}`]
    };
  });
  state = appendHistory(
    { ...state, craft },
    'debug-fleet-build',
    3,
    'Three debug support craft prepared'
  );
  return state;
}

export function validateFleetPlan(plan: FleetPlan): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  if (plan.craft.length < 5) errors.push('Fleet plan requires at least five support craft roles.');
  for (const craft of plan.craft) {
    if (ids.has(craft.id)) errors.push(`Duplicate fleet craft ${craft.id}.`);
    ids.add(craft.id);
    try {
      getSupportCraftDefinition(craft.definitionId);
    } catch {
      errors.push(`Unknown fleet definition ${craft.definitionId}.`);
    }
  }
  return errors;
}

export function validateFleetState(plan: FleetPlan, state: FleetState): string[] {
  const errors: string[] = [];
  if (state.planId !== plan.id || state.craft.length !== plan.craft.length)
    errors.push('Fleet state plan mismatch.');
  if (
    state.history.length > MAX_FLEET_HISTORY ||
    state.processedEventIds.length > MAX_FLEET_EVENTS ||
    new Set(state.processedEventIds).size !== state.processedEventIds.length
  )
    errors.push('Fleet history is invalid.');
  for (const craft of state.craft) {
    if (
      !plan.craft.some((entry) => entry.id === craft.craftId) ||
      !FLEET_CRAFT_STATUSES.includes(craft.status) ||
      !FLEET_DOCTRINES.includes(craft.doctrine) ||
      !FLEET_REFITS.includes(craft.refit) ||
      craft.hull < 0 ||
      ((craft.status === 'blueprint' || craft.status === 'lost') && craft.hull !== 0) ||
      ((craft.status === 'ready' || craft.status === 'damaged') && craft.hull <= 0)
    )
      errors.push(`Fleet craft state ${craft.craftId} is invalid.`);
  }
  const assignedCrewIds = state.craft
    .map((craft) => craft.assignedCrewId)
    .filter((id): id is string => id !== null);
  if (new Set(assignedCrewIds).size !== assignedCrewIds.length) {
    errors.push('Fleet crew assignments are duplicated.');
  }
  return errors;
}

export function validateFleetContent(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const roles = new Set<SupportCraftRole>();
  for (const craft of SUPPORT_CRAFT) {
    if (ids.has(craft.id)) errors.push(`Duplicate support craft ${craft.id}.`);
    ids.add(craft.id);
    roles.add(craft.role);
    if (craft.buildSalvage <= 0 || craft.maxHull <= 0 || !craft.itineraryUse.trim())
      errors.push(`Support craft ${craft.id} has invalid costs, hull, or itinerary use.`);
  }
  for (const role of SUPPORT_CRAFT_ROLES)
    if (!roles.has(role)) errors.push(`Missing support craft role ${role}.`);
  return errors;
}

export function formatFleetSummary(plan: FleetPlan, state: FleetState): string {
  const influence = createFleetInfluence(plan, state);
  const altered = state.craft
    .filter((craft) => craft.status !== 'blueprint')
    .map((craft) => {
      const entry = plan.craft.find((candidate) => candidate.id === craft.craftId)!;
      return `${entry.callsign}:${craft.status}:${craft.doctrine}:${craft.refit}:D${craft.deployments}:L${craft.losses}`;
    });
  return `${influence.summary}. ${altered.join(' | ') || 'No support craft constructed.'}`;
}

function doctrineCommand(doctrine: FleetDoctrine, fallback: CrewCommand): CrewCommand {
  if (doctrine === 'screen') return 'screen';
  if (doctrine === 'harvest') return 'salvage';
  if (doctrine === 'breach') return 'focus';
  if (doctrine === 'escort') return fallback;
  return 'regroup';
}

function getFleetCraftMaxHull(baseHull: number, refit: FleetRefit): number {
  return baseHull + Number(refit === 'reinforced');
}

function getCraftMaxHull(plan: FleetPlan, state: FleetCraftState): number {
  const entry = plan.craft.find((candidate) => candidate.id === state.craftId)!;
  return getFleetCraftMaxHull(getSupportCraftDefinition(entry.definitionId).maxHull, state.refit);
}

function applied(
  state: FleetState,
  craftIndex: number,
  craft: FleetCraftState,
  eventId: string,
  sectorIndex: number,
  label: string,
  salvageCost: number,
  consumedComponentId: string | null
): FleetCommandResult {
  const next = appendHistory(
    { ...state, craft: state.craft.map((entry, index) => (index === craftIndex ? craft : entry)) },
    eventId,
    sectorIndex,
    label
  );
  return { state: next, disposition: 'applied', label, salvageCost, consumedComponentId };
}

function appendHistory(
  state: FleetState,
  eventId: string,
  sectorIndex: number,
  label: string
): FleetState {
  return {
    ...state,
    processedEventIds: [...state.processedEventIds, eventId].slice(-MAX_FLEET_EVENTS),
    history: [...state.history, { eventId, sectorIndex, label }].slice(-MAX_FLEET_HISTORY)
  };
}

function rejected(state: FleetState, label: string): FleetCommandResult {
  return { state, disposition: 'rejected', label, salvageCost: 0, consumedComponentId: null };
}

function hashLabel(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
