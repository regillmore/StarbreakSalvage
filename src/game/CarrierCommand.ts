import {
  CARRIERS,
  CARRIER_POSTURES,
  getCarrierFacility,
  type CarrierDefinition,
  type CarrierFacilityType,
  type CarrierId,
  type CarrierPosture
} from '../content/carriers';
import type { FactionId } from '../content/factions';
import type { Rng } from '../core/rng';
import type { CrewRosterPlan, CrewRosterState } from './CrewCommand';

export type CarrierFacilityCondition = 'operational' | 'damaged' | 'offline';

export interface CarrierPlan {
  readonly id: string;
  readonly carrierId: CarrierId;
  readonly name: string;
  readonly origin: CarrierDefinition['origin'];
  readonly summary: string;
  readonly maxHull: number;
  readonly baseCargoCapacity: number;
  readonly facilitySlots: number;
  readonly startingFacilities: readonly CarrierFacilityType[];
  readonly replacementOrder: readonly CarrierFacilityType[];
  readonly liaisonFactionId: FactionId;
}

export interface CarrierFacilityState {
  readonly slot: number;
  readonly type: CarrierFacilityType;
  readonly level: number;
  readonly condition: CarrierFacilityCondition;
  readonly powered: boolean;
  readonly assignedCrewId: string | null;
}

export interface CarrierCargoEntry {
  readonly id: string;
  readonly label: string;
  readonly kind: 'component' | 'salvage' | 'claim' | 'specimen';
  readonly size: number;
  readonly value: number;
  readonly sectorIndex: number;
}

export interface CarrierHistoryEntry {
  readonly eventId: string;
  readonly sectorIndex: number;
  readonly label: string;
}

export interface CarrierState {
  readonly planId: string;
  readonly hull: number;
  readonly heat: number;
  readonly debt: number;
  readonly pursuit: number;
  readonly posture: CarrierPosture;
  readonly facilities: readonly CarrierFacilityState[];
  readonly cargo: readonly CarrierCargoEntry[];
  readonly lastCommandSectorIndex: number | null;
  readonly processedEventIds: readonly string[];
  readonly history: readonly CarrierHistoryEntry[];
}

export type CarrierCommand =
  | { readonly kind: 'setPosture'; readonly posture: CarrierPosture }
  | { readonly kind: 'repairHull'; readonly maxHull: number }
  | { readonly kind: 'repairFacility'; readonly slot: number }
  | { readonly kind: 'upgradeFacility'; readonly slot: number }
  | { readonly kind: 'replaceFacility'; readonly slot: number; readonly facilityType: CarrierFacilityType }
  | { readonly kind: 'reroutePower'; readonly slot: number }
  | { readonly kind: 'assignCrew'; readonly slot: number; readonly candidateId: string }
  | { readonly kind: 'jettisonCargo'; readonly cargoId: string };

export interface CarrierCommandOption {
  readonly id: string;
  readonly label: string;
  readonly meta: string;
  readonly summary: string;
  readonly creditCost: number;
  readonly salvageCost: number;
  readonly command: CarrierCommand;
}

export interface CarrierCommandResult {
  readonly state: CarrierState;
  readonly disposition: 'applied' | 'duplicate' | 'rejected';
  readonly label: string;
  readonly creditCost: number;
  readonly salvageCost: number;
}

export interface CarrierInfluence {
  readonly foundrySalvageBonus: number;
  readonly rewardChoiceBonus: number;
  readonly rewardBiasTags: readonly string[];
  readonly shopDiscount: number;
  readonly crewRecoveryAdvance: number;
  readonly supportCapacity: number;
  readonly boardingCapacity: number;
  readonly optionalMissionAccess: boolean;
  readonly cargoCapacity: number;
  readonly cargoUsed: number;
  readonly factionAccess: Readonly<Record<FactionId, boolean>>;
  readonly riskLabel: string;
}

export interface CarrierDebugState {
  readonly name: string;
  readonly hull: string;
  readonly pressure: string;
  readonly posture: CarrierPosture;
  readonly facilities: readonly string[];
  readonly cargo: string;
  readonly historyCount: number;
}

const MAX_CARRIER_HISTORY = 64;
const MAX_CARRIER_EVENTS = 128;
const MAX_FACILITY_LEVEL = 3;

export function createCarrierPlan(options: {
  readonly seed: string;
  readonly saveFingerprint: string;
  readonly rng: Rng;
}): CarrierPlan {
  const definition = options.rng.fork(`hull:${options.saveFingerprint}`).choice(CARRIERS);
  return {
    id: `carrier:${options.seed}:${definition.id}:${hashLabel(options.saveFingerprint)}`,
    carrierId: definition.id,
    name: definition.name,
    origin: definition.origin,
    summary: definition.summary,
    maxHull: definition.maxHull,
    baseCargoCapacity: definition.cargoCapacity,
    facilitySlots: definition.facilitySlots,
    startingFacilities: definition.startingFacilities,
    replacementOrder: definition.replacementOrder,
    liaisonFactionId: definition.liaisonFactionId
  };
}

export function createCarrierState(plan: CarrierPlan): CarrierState {
  return {
    planId: plan.id,
    hull: Math.max(1, plan.maxHull - 1),
    heat: 2,
    debt: plan.origin === 'contracted' ? 4 : 0,
    pursuit: 1,
    posture: 'survey',
    facilities: plan.startingFacilities.slice(0, plan.facilitySlots).map((type, slot) => ({
      slot,
      type,
      level: 1,
      condition: slot === plan.facilitySlots - 1 ? 'damaged' : 'operational',
      powered: slot === 0,
      assignedCrewId: null
    })),
    cargo: [],
    lastCommandSectorIndex: null,
    processedEventIds: [],
    history: []
  };
}

export function createCarrierCommandOptions(options: {
  readonly plan: CarrierPlan;
  readonly state: CarrierState;
  readonly crewPlan: CrewRosterPlan;
  readonly crewState: CrewRosterState;
  readonly sectorIndex: number;
}): CarrierCommandOption[] {
  if (options.state.lastCommandSectorIndex === options.sectorIndex) return [];
  const service =
    options.state.facilities.find((facility) => facility.condition !== 'operational') ??
    [...options.state.facilities].sort((left, right) => left.level - right.level)[0];
  const unpowered = options.state.facilities.find((facility) => !facility.powered);
  const posture = CARRIER_POSTURES[(CARRIER_POSTURES.indexOf(options.state.posture) + 1) % CARRIER_POSTURES.length]!;
  const assignedIds = new Set(options.state.facilities.map((facility) => facility.assignedCrewId));
  const crew = options.crewState.members.find(
    (member) => member.status === 'active' && !assignedIds.has(member.candidateId)
  );
  const crewSlot = options.state.facilities.find((facility) => facility.assignedCrewId === null);
  const optionsList: CarrierCommandOption[] = [];

  if (service) {
    const definition = getCarrierFacility(service.type);
    const repair = service.condition !== 'operational';
    optionsList.push({
      id: `carrier-service-${service.slot}`,
      label: repair ? `Repair ${definition.label}` : `Upgrade ${definition.label}`,
      meta: repair ? '2 salvage' : `${definition.upgradeCost} salvage`,
      summary: repair ? `Restore ${definition.influence}.` : `Deepen ${definition.influence}; maximum level ${MAX_FACILITY_LEVEL}.`,
      creditCost: 0,
      salvageCost: repair ? 2 : definition.upgradeCost,
      command: repair
        ? { kind: 'repairFacility', slot: service.slot }
        : { kind: 'upgradeFacility', slot: service.slot }
    });
  }
  if (options.state.hull < options.plan.maxHull) {
    optionsList.push({
      id: 'carrier-repair-hull',
      label: 'Brace Carrier Hull',
      meta: '3 salvage | +2 hull',
      summary: 'Spend recovered structure on the carrier instead of the player ship.',
      creditCost: 0,
      salvageCost: 3,
      command: { kind: 'repairHull', maxHull: options.plan.maxHull }
    });
  }
  if (unpowered) {
    optionsList.push({
      id: `carrier-reroute-${unpowered.slot}`,
      label: `Reroute: ${getCarrierFacility(unpowered.type).label}`,
      meta: '+1 carrier heat',
      summary: 'Move the priority bus to this facility for stronger immediate influence.',
      creditCost: 0,
      salvageCost: 0,
      command: { kind: 'reroutePower', slot: unpowered.slot }
    });
  }
  optionsList.push({
    id: `carrier-posture-${posture}`,
    label: `${formatPosture(posture)} Posture`,
    meta: postureMeta(posture),
    summary: postureSummary(posture),
    creditCost: 0,
    salvageCost: 0,
    command: { kind: 'setPosture', posture }
  });
  const replacementSlot = options.state.facilities.at(-1);
  const replacementType = options.plan.replacementOrder.find(
    (type) => !options.state.facilities.some((facility) => facility.type === type)
  );
  if (replacementSlot && replacementType) {
    optionsList.push({
      id: `carrier-replace-${replacementSlot.slot}-${replacementType}`,
      label: `Install ${getCarrierFacility(replacementType).label}`,
      meta: '8 credits | 4 salvage',
      summary: `Replace ${getCarrierFacility(replacementSlot.type).label} and open ${getCarrierFacility(replacementType).influence}.`,
      creditCost: 8,
      salvageCost: 4,
      command: {
        kind: 'replaceFacility',
        slot: replacementSlot.slot,
        facilityType: replacementType
      }
    });
  }
  if (crew && crewSlot) {
    const candidate = options.crewPlan.candidates.find((entry) => entry.id === crew.candidateId);
    optionsList.push({
      id: `carrier-assign-${crew.candidateId}`,
      label: `Assign ${candidate?.callsign ?? 'Crew'}`,
      meta: getCarrierFacility(crewSlot.type).label,
      summary: 'Move an active specialist from flight reserve to a carrier command post.',
      creditCost: 0,
      salvageCost: 0,
      command: { kind: 'assignCrew', slot: crewSlot.slot, candidateId: crew.candidateId }
    });
  }
  if (options.state.cargo.length > 0) {
    const cargo = options.state.cargo[0]!;
    optionsList.push({
      id: `carrier-jettison-${cargo.id}`,
      label: `Jettison ${cargo.label}`,
      meta: `free ${cargo.size} cargo`,
      summary: 'Discard the oldest manifest entry to make room for later claims.',
      creditCost: 0,
      salvageCost: 0,
      command: { kind: 'jettisonCargo', cargoId: cargo.id }
    });
  }
  return optionsList.slice(0, 6);
}

export function applyCarrierCommand(options: {
  readonly plan: CarrierPlan;
  readonly state: CarrierState;
  readonly eventId: string;
  readonly sectorIndex: number;
  readonly command: CarrierCommand;
  readonly availableCredits: number;
  readonly availableSalvage: number;
}): CarrierCommandResult {
  if (options.state.planId !== options.plan.id) return rejected(options.state, 'Carrier plan mismatch');
  if (options.state.processedEventIds.includes(options.eventId)) {
    return { state: options.state, disposition: 'duplicate', label: 'Duplicate carrier command', creditCost: 0, salvageCost: 0 };
  }
  if (options.state.lastCommandSectorIndex === options.sectorIndex) return rejected(options.state, 'Command action already spent this sector');

  const costs = getCommandCosts(options.state, options.command);
  if (options.availableCredits < costs.creditCost || options.availableSalvage < costs.salvageCost) {
    return rejected(options.state, 'Insufficient carrier resources');
  }
  const applied = applyCommand(options.state, options.command);
  if (!applied) return rejected(options.state, 'Carrier command unavailable');
  const next = recordCarrierEvent(
    { ...applied.state, lastCommandSectorIndex: options.sectorIndex },
    options.eventId,
    options.sectorIndex,
    applied.label
  );
  return { state: next, disposition: 'applied', label: applied.label, ...costs };
}

export function stowCarrierCargo(options: {
  readonly plan: CarrierPlan;
  readonly state: CarrierState;
  readonly cargo: CarrierCargoEntry;
}): CarrierState {
  if (options.state.processedEventIds.includes(`cargo:${options.cargo.id}`)) return options.state;
  const influence = createCarrierInfluence(options.plan, options.state);
  if (influence.cargoUsed + options.cargo.size > influence.cargoCapacity) {
    return recordCarrierEvent(options.state, `cargo:${options.cargo.id}`, options.cargo.sectorIndex, `${options.cargo.label} left behind; cargo full`);
  }
  return recordCarrierEvent(
    { ...options.state, cargo: [...options.state.cargo, options.cargo] },
    `cargo:${options.cargo.id}`,
    options.cargo.sectorIndex,
    `${options.cargo.label} stowed`
  );
}

export function resolveCarrierTransit(plan: CarrierPlan, state: CarrierState, sectorIndex: number): CarrierState {
  const eventId = `carrier-transit:${sectorIndex}`;
  if (state.processedEventIds.includes(eventId)) return state;
  const influence = createCarrierInfluence(plan, state);
  const reactor = getFacilityStrength(state, 'reactor');
  const liaison = getFacilityStrength(state, 'liaison');
  const postureHeat = state.posture === 'assault' ? 2 : state.posture === 'survey' ? 1 : -1;
  const heat = clampInt(state.heat + postureHeat - Number(reactor > 0), 0, 10);
  const pursuit = clampInt(state.pursuit + (state.posture === 'survey' ? 1 : state.posture === 'stealth' ? -1 : 0) - Number(influence.supportCapacity > 0), 0, 6);
  const debt = clampInt(state.debt + (state.posture === 'stealth' ? 1 : 0) - Number(liaison > 0), 0, 20);
  const hullDamage = Number(heat >= 9) + Number(pursuit >= 6 && influence.supportCapacity === 0);
  const hull = clampInt(state.hull - hullDamage, 0, plan.maxHull);
  const facilities =
    heat >= 9
      ? state.facilities.map((facility) =>
          facility.powered && facility.condition === 'operational'
            ? { ...facility, condition: 'damaged' as const }
            : facility
        )
      : state.facilities;
  return recordCarrierEvent(
    { ...state, heat, pursuit, debt, hull, facilities },
    eventId,
    sectorIndex,
    `Transit ${formatPosture(state.posture)}: hull ${hull}/${plan.maxHull}, heat ${heat}, debt ${debt}, pursuit ${pursuit}`
  );
}

export function createCarrierInfluence(plan: CarrierPlan, state: CarrierState): CarrierInfluence {
  const foundry = getFacilityStrength(state, 'foundry');
  const medbay = getFacilityStrength(state, 'medbay');
  const intelligence = getFacilityStrength(state, 'intelligence');
  const hangar = getFacilityStrength(state, 'hangar');
  const vault = getFacilityStrength(state, 'vault');
  const liaison = getFacilityStrength(state, 'liaison');
  const cargoCapacity = plan.baseCargoCapacity + vault * 2;
  const restricted = state.debt >= 8 || state.pursuit >= 5;
  const factionAccess = {
    faction_scrap_court: !restricted || plan.liaisonFactionId === 'faction_scrap_court',
    faction_corporate_ledger: !restricted || plan.liaisonFactionId === 'faction_corporate_ledger',
    faction_bloom_hive: !restricted || plan.liaisonFactionId === 'faction_bloom_hive',
    faction_void_corsairs: !restricted || plan.liaisonFactionId === 'faction_void_corsairs'
  } satisfies Record<FactionId, boolean>;
  return {
    foundrySalvageBonus: Math.min(3, foundry),
    rewardChoiceBonus: vault >= 2 ? 1 : 0,
    rewardBiasTags: vault > 0 ? ['relic'] : foundry > 0 ? ['scrap'] : [],
    shopDiscount: liaison > 0 ? Math.min(3, liaison) : 0,
    crewRecoveryAdvance: medbay > 0 ? 1 : 0,
    supportCapacity: hangar > 0 ? Math.min(2, hangar) : 0,
    boardingCapacity: hangar + foundry > 0 ? Math.min(3, hangar + Number(foundry > 0)) : 0,
    optionalMissionAccess:
      state.hull > 1 && state.heat < 10 && (state.debt < 12 || intelligence > 0),
    cargoCapacity,
    cargoUsed: state.cargo.reduce((total, cargo) => total + cargo.size, 0),
    factionAccess,
    riskLabel: `Hull ${state.hull}/${plan.maxHull} | Heat ${state.heat}/10 | Debt ${state.debt} | Pursuit ${state.pursuit}/6`
  };
}

export function createCarrierDebugState(plan: CarrierPlan, state: CarrierState): CarrierDebugState {
  const influence = createCarrierInfluence(plan, state);
  return {
    name: plan.name,
    hull: `${state.hull}/${plan.maxHull}`,
    pressure: `H${state.heat} D${state.debt} P${state.pursuit}`,
    posture: state.posture,
    facilities: state.facilities.map((facility) => `${facility.type}:L${facility.level}:${facility.condition}:${facility.powered ? 'P' : '-'}:${facility.assignedCrewId ?? '-'}`),
    cargo: `${influence.cargoUsed}/${influence.cargoCapacity}`,
    historyCount: state.history.length
  };
}

export function formatCarrierSummary(plan: CarrierPlan, state: CarrierState): string {
  const influence = createCarrierInfluence(plan, state);
  return `${plan.name} (${plan.origin}) | ${influence.riskLabel} | ${formatPosture(state.posture)} | cargo ${influence.cargoUsed}/${influence.cargoCapacity} | ${state.facilities.map((facility) => `${getCarrierFacility(facility.type).label} L${facility.level} ${facility.condition}${facility.powered ? ' powered' : ''}`).join(', ')}`;
}

function getFacilityStrength(state: CarrierState, type: CarrierFacilityType): number {
  const facility = state.facilities.find((candidate) => candidate.type === type);
  if (!facility || facility.condition === 'offline') return 0;
  const conditionScale = facility.condition === 'damaged' ? 0 : facility.level;
  return conditionScale + Number(facility.powered && conditionScale > 0) + Number(facility.assignedCrewId && conditionScale > 0);
}

function applyCommand(state: CarrierState, command: CarrierCommand): { readonly state: CarrierState; readonly label: string } | null {
  if (command.kind === 'setPosture') return { state: { ...state, posture: command.posture }, label: `${formatPosture(command.posture)} posture set` };
  if (command.kind === 'repairHull') return { state: { ...state, hull: Math.min(command.maxHull, state.hull + 2) }, label: 'Carrier hull braced by 2' };
  if (command.kind === 'jettisonCargo') {
    const cargo = state.cargo.find((entry) => entry.id === command.cargoId);
    return cargo ? { state: { ...state, cargo: state.cargo.filter((entry) => entry.id !== command.cargoId) }, label: `${cargo.label} jettisoned` } : null;
  }
  const facility = state.facilities[command.slot];
  if (!facility) return null;
  let replacement: CarrierFacilityState;
  let label: string;
  if (command.kind === 'repairFacility') {
    if (facility.condition === 'operational') return null;
    replacement = { ...facility, condition: 'operational' };
    label = `${getCarrierFacility(facility.type).label} repaired`;
  } else if (command.kind === 'upgradeFacility') {
    if (facility.condition !== 'operational' || facility.level >= MAX_FACILITY_LEVEL) return null;
    replacement = { ...facility, level: facility.level + 1 };
    label = `${getCarrierFacility(facility.type).label} upgraded to L${replacement.level}`;
  } else if (command.kind === 'replaceFacility') {
    if (state.facilities.some((candidate) => candidate.type === command.facilityType)) return null;
    replacement = { ...facility, type: command.facilityType, level: 1, condition: 'operational', assignedCrewId: null };
    label = `${getCarrierFacility(facility.type).label} replaced by ${getCarrierFacility(command.facilityType).label}`;
  } else if (command.kind === 'reroutePower') {
    return {
      state: { ...state, heat: clampInt(state.heat + 1, 0, 10), facilities: state.facilities.map((candidate) => ({ ...candidate, powered: candidate.slot === facility.slot })) },
      label: `Power rerouted to ${getCarrierFacility(facility.type).label}`
    };
  } else {
    replacement = { ...facility, assignedCrewId: command.candidateId };
    label = `Crew assigned to ${getCarrierFacility(facility.type).label}`;
  }
  return { state: { ...state, facilities: replaceFacility(state.facilities, facility.slot, replacement) }, label };
}

function getCommandCosts(state: CarrierState, command: CarrierCommand): { creditCost: number; salvageCost: number } {
  if (command.kind === 'repairHull') return { creditCost: 0, salvageCost: 3 };
  if (command.kind === 'repairFacility') return { creditCost: 0, salvageCost: 2 };
  if (command.kind === 'upgradeFacility') {
    const facility = state.facilities[command.slot];
    return { creditCost: 0, salvageCost: facility ? getCarrierFacility(facility.type).upgradeCost : 99 };
  }
  if (command.kind === 'replaceFacility') return { creditCost: 8, salvageCost: 4 };
  return { creditCost: 0, salvageCost: 0 };
}

function replaceFacility(facilities: readonly CarrierFacilityState[], slot: number, replacement: CarrierFacilityState): CarrierFacilityState[] {
  return facilities.map((facility) => (facility.slot === slot ? replacement : facility));
}

function recordCarrierEvent(state: CarrierState, eventId: string, sectorIndex: number, label: string): CarrierState {
  return {
    ...state,
    processedEventIds: [...state.processedEventIds, eventId].slice(-MAX_CARRIER_EVENTS),
    history: [...state.history, { eventId, sectorIndex, label }].slice(-MAX_CARRIER_HISTORY)
  };
}

function rejected(state: CarrierState, label: string): CarrierCommandResult {
  return { state, disposition: 'rejected', label, creditCost: 0, salvageCost: 0 };
}

function formatPosture(posture: CarrierPosture): string {
  return posture[0]!.toUpperCase() + posture.slice(1);
}

function postureMeta(posture: CarrierPosture): string {
  if (posture === 'survey') return '+intel | +heat | +pursuit';
  if (posture === 'stealth') return '-heat | -pursuit | +debt';
  return '+heat | holds course under pressure';
}

function postureSummary(posture: CarrierPosture): string {
  if (posture === 'survey') return 'Expose the carrier to widen forecasts and future claim opportunities.';
  if (posture === 'stealth') return 'Cool the wake and lose pursuit while deferred obligations accumulate.';
  return 'Keep launch rails hot and accept thermal pressure instead of changing course.';
}

function clampInt(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

function hashLabel(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
