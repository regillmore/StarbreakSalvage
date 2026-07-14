import {
  BOARDING_CONTRACTS,
  getBoardingContract,
  type BoardingHazardKind,
  type BoardingIntegration,
  type BoardingObjectiveKind,
  type BoardingRoomKind,
  type BoardingTargetKind
} from '../content/boarding';
import { getMissionObjective } from '../content/objectives';
import { createRng } from '../core/rng';
import type { ExpeditionOperationalRole } from '../content/expeditions';
import type { SectorRoute } from './Generation';
import type { MissionObjectivePlan, MissionObjectiveOutcome } from './ObjectiveDirector';

export type BoardingOperationalRole = Extract<ExpeditionOperationalRole, 'detour' | 'pursuit'>;
export type BoardingOperationStatus =
  'available' | 'active' | 'success' | 'partialSuccess' | 'failure' | 'retreated';
export type BoardingLootCustody = 'unclaimed' | 'held' | 'stowed' | 'lost';

export interface BoardingDoorPlan {
  readonly id: string;
  readonly label: string;
  readonly atDistance: number;
  readonly integrity: number;
  readonly lock: 'pressure' | 'security' | 'welded';
}

export interface BoardingRoomPlan {
  readonly id: string;
  readonly index: number;
  readonly kind: BoardingRoomKind;
  readonly label: string;
  readonly startDistance: number;
  readonly endDistance: number;
  readonly hazard: BoardingHazardKind | null;
  readonly subsystem: string | null;
}

export interface BoardingLootPlan {
  readonly id: string;
  readonly label: string;
  readonly roomId: string;
  readonly size: number;
  readonly value: number;
}

export interface BoardingOperationPlan {
  readonly id: string;
  readonly contractId: string;
  readonly title: string;
  readonly summary: string;
  readonly targetKind: BoardingTargetKind;
  readonly objectiveKinds: readonly BoardingObjectiveKind[];
  readonly sectorIndex: number;
  readonly operationalRole: BoardingOperationalRole;
  readonly scrollLength: number;
  readonly extractionSeconds: number | null;
  readonly rooms: readonly BoardingRoomPlan[];
  readonly doors: readonly BoardingDoorPlan[];
  readonly loot: readonly BoardingLootPlan[];
  readonly integrations: readonly BoardingIntegration[];
}

export interface BoardingCampaignPlan {
  readonly id: string;
  readonly seed: string;
  readonly saveFingerprint: string;
  readonly operations: readonly BoardingOperationPlan[];
}

export interface BoardingLootState extends BoardingLootPlan {
  readonly custody: BoardingLootCustody;
}

export interface BoardingOperationState {
  readonly operationId: string;
  readonly status: BoardingOperationStatus;
  readonly breachedDoorIds: readonly string[];
  readonly securedRoomIds: readonly string[];
  readonly loot: readonly BoardingLootState[];
  readonly completionRatio: number;
  readonly cleanupActorsRetained: 0;
}

export interface BoardingHistoryEntry {
  readonly eventId: string;
  readonly operationId: string;
  readonly sectorIndex: number;
  readonly label: string;
}

export interface BoardingCampaignState {
  readonly planId: string;
  readonly operations: readonly BoardingOperationState[];
  readonly unlockedHooks: readonly string[];
  readonly processedEventIds: readonly string[];
  readonly history: readonly BoardingHistoryEntry[];
}

export interface BoardingTranslatedLoadout {
  readonly primary: string;
  readonly modules: string;
  readonly crew: string;
  readonly bomb: string;
  readonly special: string;
  readonly collision: string;
  readonly summary: string;
}

export interface BoardingSettlementResult {
  readonly state: BoardingCampaignState;
  readonly disposition: 'applied' | 'duplicate' | 'rejected';
  readonly status: BoardingOperationStatus;
  readonly stowedLoot: readonly BoardingLootPlan[];
  readonly unlockedHooks: readonly string[];
  readonly label: string;
}

const MAX_BOARDING_EVENTS = 128;
const MAX_BOARDING_HISTORY = 64;

export function createBoardingCampaignPlan(options: {
  readonly seed: string;
  readonly saveFingerprint: string;
  readonly sectors: readonly Pick<SectorRoute, 'index' | 'sectorId' | 'sectorName'>[];
}): BoardingCampaignPlan {
  const rng = createRng(`${options.seed}:boarding:${options.saveFingerprint}`);
  const eligibleIndexes = options.sectors
    .map((_, index) => index)
    .filter((index) => index > 0 && index < options.sectors.length - 1);
  const shuffledIndexes = rng.fork('sectors').shuffle(eligibleIndexes);
  const selectedIndexes = BOARDING_CONTRACTS.map(
    (_, index) =>
      shuffledIndexes[index % Math.max(1, shuffledIndexes.length)] ??
      Math.min(index + 1, options.sectors.length - 1)
  ).sort((left, right) => left - right);
  const shuffledContracts = rng.fork('contracts').shuffle(BOARDING_CONTRACTS);
  const operations = selectedIndexes.map((sectorIndex, index) => {
    const contract = shuffledContracts[index]!;
    return createBoardingOperationPlan({
      seed: options.seed,
      saveFingerprint: options.saveFingerprint,
      sectorIndex,
      operationalRole: index % 2 === 0 ? 'detour' : 'pursuit',
      contractId: contract.id
    });
  });
  return {
    id: `boarding:${options.seed}:${hashLabel(options.saveFingerprint)}`,
    seed: options.seed,
    saveFingerprint: options.saveFingerprint,
    operations
  };
}

export function createBoardingOperationPlan(options: {
  readonly seed: string;
  readonly saveFingerprint: string;
  readonly sectorIndex: number;
  readonly operationalRole: BoardingOperationalRole;
  readonly contractId: string;
}): BoardingOperationPlan {
  const contract = getBoardingContract(options.contractId);
  const rng = createRng(
    `${options.seed}:boarding:${options.saveFingerprint}:${options.sectorIndex}:${contract.id}:${options.operationalRole}`
  );
  const middleCount = rng.int(2, 4);
  const middleKinds = rng
    .fork('rooms')
    .shuffle(contract.roomKinds.filter((kind) => kind !== 'airlock' && kind !== 'extraction'));
  const kinds: BoardingRoomKind[] = ['airlock'];
  for (let index = 0; index < middleCount; index += 1) {
    kinds.push(middleKinds[index % Math.max(1, middleKinds.length)] ?? 'corridor');
  }
  kinds.push('extraction');
  const roomSpan = rng.int(150, 190);
  const scrollLength = kinds.length * roomSpan + 120;
  const hazards = rng.fork('hazards').shuffle(contract.hazardKinds);
  const rooms = kinds.map<BoardingRoomPlan>((kind, index) => ({
    id: `boarding-room-s${options.sectorIndex + 1}-${index + 1}`,
    index,
    kind,
    label: formatRoomLabel(kind),
    startDistance: 60 + index * roomSpan,
    endDistance: 60 + (index + 1) * roomSpan - 18,
    hazard:
      index > 0 && index < kinds.length - 1 && index % 2 === 1
        ? (hazards[index % hazards.length] ?? null)
        : null,
    subsystem:
      kind === 'subsystem' || kind === 'reactor' || kind === 'bridge' || kind === 'hangar'
        ? formatSubsystem(kind)
        : null
  }));
  const doors = rooms.slice(1).map<BoardingDoorPlan>((room, index) => ({
    id: `boarding-door-s${options.sectorIndex + 1}-${index + 1}`,
    label: index === rooms.length - 2 ? 'Extraction bulkhead' : `${room.label} bulkhead`,
    atDistance: room.startDistance - 12,
    integrity: 2 + ((index + options.sectorIndex) % 3),
    lock: rng.fork(`door-${index}`).choice(['pressure', 'security', 'welded'] as const)
  }));
  const custodyRoom = rooms[Math.max(1, rooms.length - 2)]!;
  const loot: BoardingLootPlan[] = [
    {
      id: `boarding-loot-s${options.sectorIndex + 1}-${contract.id}`,
      label: contract.lootLabel,
      roomId: custodyRoom.id,
      size: contract.integrations.includes('apex') ? 2 : 1,
      value: 3 + Math.floor(options.sectorIndex / 2)
    }
  ];
  return {
    id: `boarding-operation-s${options.sectorIndex + 1}-${contract.id}`,
    contractId: contract.id,
    title: contract.title,
    summary: contract.summary,
    targetKind: contract.targetKind,
    objectiveKinds: contract.objectiveKinds,
    sectorIndex: options.sectorIndex,
    operationalRole: options.operationalRole,
    scrollLength,
    extractionSeconds: contract.objectiveKinds.includes('timedExtraction')
      ? 75 + kinds.length * 8
      : null,
    rooms,
    doors,
    loot,
    integrations: contract.integrations
  };
}

export function createBoardingCampaignState(plan: BoardingCampaignPlan): BoardingCampaignState {
  return {
    planId: plan.id,
    operations: plan.operations.map((operation) => ({
      operationId: operation.id,
      status: 'available',
      breachedDoorIds: [],
      securedRoomIds: [],
      loot: operation.loot.map((loot) => ({ ...loot, custody: 'unclaimed' })),
      completionRatio: 0,
      cleanupActorsRetained: 0
    })),
    unlockedHooks: [],
    processedEventIds: [],
    history: []
  };
}

export function getBoardingOperationForNode(
  plan: BoardingCampaignPlan,
  node: { readonly sectorIndex: number; readonly operationalRole: ExpeditionOperationalRole }
): BoardingOperationPlan | null {
  const exact = plan.operations.find(
    (operation) =>
      operation.sectorIndex === node.sectorIndex &&
      operation.operationalRole === node.operationalRole
  );
  if (exact || node.operationalRole !== 'pursuit') return exact ?? null;
  return plan.operations.find((operation) => operation.sectorIndex === node.sectorIndex) ?? null;
}

export function createBoardingMissionObjectivePlan(
  operation: BoardingOperationPlan,
  basePlan: MissionObjectivePlan | null
): MissionObjectivePlan {
  const contract = getBoardingContract(operation.contractId);
  const objective = getMissionObjective(contract.objectiveId);
  return {
    contractId: contract.id,
    contractTitle: contract.title,
    objectiveId: objective.id,
    verb: contract.objectiveVerb,
    label: `${contract.title}: ${formatObjectives(contract.objectiveKinds)}`,
    hudVerb: `BOARD / ${contract.objectiveKinds[0]?.toUpperCase() ?? 'SECURE'}`,
    summary: contract.summary,
    clauses: objective.clauses,
    partialSuccessThreshold: objective.partialSuccessThreshold,
    cleanupPolicy: 'clearField',
    successCopy: contract.successCopy,
    partialSuccessCopy: contract.partialCopy,
    failureCopy: contract.failureCopy,
    optional: true,
    factionPolicy: basePlan?.factionPolicy ?? 'hostileInterdiction',
    crewPolicy: operation.integrations.includes('crew') ? 'protectSpecialist' : 'none',
    failurePolicy: 'continueWithPenalty'
  };
}

export function projectSectorForBoarding(
  sector: SectorRoute,
  operation: BoardingOperationPlan
): SectorRoute {
  const waveCount = Math.max(1, Math.min(sector.majorWaves.length, operation.rooms.length - 2));
  const ratio = operation.scrollLength / Math.max(1, sector.scroll.length);
  return {
    ...sector,
    sectorName: `${operation.title} / ${formatTarget(operation.targetKind)}`,
    majorWaves: sector.majorWaves.slice(0, waveCount),
    objective: {
      ...sector.objective,
      label: `${formatObjectives(operation.objectiveKinds)} interior`,
      requiredWaves: waveCount,
      requiredEnemyKills: waveCount * sector.objective.spawnsPerWave,
      bossRequired: false,
      bossSpawnAtSeconds: null,
      variantId: 'standardSweep',
      variantLabel: 'Boarding Incursion',
      variantSummary: `${operation.rooms.length} bounded rooms; custody must reach extraction.`,
      pressureBand: 'volatile',
      travelGateRatio: 1
    },
    scroll: {
      ...sector.scroll,
      length: operation.scrollLength,
      startOffset: 0,
      baseSpeed: Math.min(sector.scroll.baseSpeed, 58)
    },
    features: {
      ...sector.features,
      landmarks: sector.features.landmarks.map((landmark, index) => ({
        ...landmark,
        distance: Math.round(landmark.distance * ratio),
        label: operation.rooms[index % operation.rooms.length]?.label ?? landmark.label
      })),
      hazards: sector.features.hazards
        .slice(0, Math.max(1, Math.min(3, operation.rooms.length - 2)))
        .map((hazard, index) => {
          const room = operation.rooms[index + 1] ?? operation.rooms[0]!;
          const startDistance = Math.max(80, room.startDistance + 22);
          const endDistance = Math.min(operation.scrollLength - 40, startDistance + 72);
          return {
            ...hazard,
            id: `${operation.id}:hazard:${index + 1}`,
            label: formatHazard(room.hazard ?? 'securityGrid'),
            telegraphDistance: Math.max(0, startDistance - 48),
            startDistance,
            endDistance
          };
        })
    },
    arena: null,
    finale: null,
    setPiece: null
  };
}

export function createBoardingTranslatedLoadout(options: {
  readonly weaponName: string;
  readonly moduleSummary: string;
  readonly crewCount: number;
}): BoardingTranslatedLoadout {
  const translated = {
    primary: `${options.weaponName} → breach cutter`,
    modules: `${options.moduleSummary} → pressure-rated rig`,
    crew: `${options.crewCount} wingmate${options.crewCount === 1 ? '' : 's'} → boarding screen`,
    bomb: 'Bomb → room-clear charge',
    special: 'Special → subsystem overdrive',
    collision: 'Hull/collision → bulkhead and hazard contact'
  };
  return {
    ...translated,
    summary: `${translated.primary} | ${translated.bomb} | ${translated.special}`
  };
}

export function settleBoardingOperation(options: {
  readonly plan: BoardingCampaignPlan;
  readonly state: BoardingCampaignState;
  readonly operation: BoardingOperationPlan;
  readonly eventId: string;
  readonly outcome: Exclude<MissionObjectiveOutcome, 'active'>;
  readonly completionRatio: number;
  readonly retreated: boolean;
}): BoardingSettlementResult {
  if (options.state.planId !== options.plan.id)
    return rejected(options.state, 'Boarding plan mismatch');
  if (!options.plan.operations.some((operation) => operation.id === options.operation.id)) {
    return rejected(options.state, 'Unknown boarding operation');
  }
  if (options.state.processedEventIds.includes(options.eventId)) {
    return {
      state: options.state,
      disposition: 'duplicate',
      status: getOperationState(options.state, options.operation.id)?.status ?? 'failure',
      stowedLoot: [],
      unlockedHooks: [],
      label: 'Duplicate boarding settlement'
    };
  }
  const current = getOperationState(options.state, options.operation.id);
  if (!current || !['available', 'active'].includes(current.status)) {
    return rejected(options.state, 'Boarding operation already closed');
  }
  const status: BoardingOperationStatus = options.retreated ? 'retreated' : options.outcome;
  const ratio = clamp01(options.completionRatio);
  const securedCount =
    status === 'success'
      ? options.operation.rooms.length
      : Math.floor(options.operation.rooms.length * ratio);
  const breachedCount = Math.min(options.operation.doors.length, Math.max(0, securedCount - 1));
  const custody: BoardingLootCustody =
    status === 'success'
      ? 'stowed'
      : (status === 'partialSuccess' || status === 'retreated') && ratio >= 0.5
        ? 'held'
        : 'lost';
  const operationState: BoardingOperationState = {
    operationId: options.operation.id,
    status,
    breachedDoorIds: options.operation.doors.slice(0, breachedCount).map((door) => door.id),
    securedRoomIds: options.operation.rooms.slice(0, securedCount).map((room) => room.id),
    loot: current.loot.map((loot) => ({ ...loot, custody })),
    completionRatio: ratio,
    cleanupActorsRetained: 0
  };
  const unlockedHooks =
    status === 'success' || status === 'partialSuccess'
      ? options.operation.integrations
          .filter((integration) => integration !== 'carrier')
          .map((integration) => `${integration}:${options.operation.contractId}`)
      : [];
  const state: BoardingCampaignState = {
    ...options.state,
    operations: options.state.operations.map((operation) =>
      operation.operationId === options.operation.id ? operationState : operation
    ),
    unlockedHooks: [...new Set([...options.state.unlockedHooks, ...unlockedHooks])],
    processedEventIds: [...options.state.processedEventIds, options.eventId].slice(
      -MAX_BOARDING_EVENTS
    ),
    history: [
      ...options.state.history,
      {
        eventId: options.eventId,
        operationId: options.operation.id,
        sectorIndex: options.operation.sectorIndex,
        label: `${options.operation.title}: ${status}; rooms ${securedCount}/${options.operation.rooms.length}; custody ${custody}; cleanup 0`
      }
    ].slice(-MAX_BOARDING_HISTORY)
  };
  return {
    state,
    disposition: 'applied',
    status,
    stowedLoot: custody === 'stowed' || custody === 'held' ? options.operation.loot : [],
    unlockedHooks,
    label: state.history.at(-1)!.label
  };
}

export function validateBoardingCampaignPlan(plan: BoardingCampaignPlan): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  if (plan.operations.length < 4)
    errors.push('Boarding campaign requires at least four operations.');
  const targets = new Set<BoardingTargetKind>();
  const objectives = new Set<BoardingObjectiveKind>();
  for (const operation of plan.operations) {
    if (ids.has(operation.id)) errors.push(`Duplicate boarding operation: ${operation.id}.`);
    ids.add(operation.id);
    targets.add(operation.targetKind);
    operation.objectiveKinds.forEach((objective) => objectives.add(objective));
    if (operation.rooms.length < 4 || operation.rooms.length > 7) {
      errors.push(`Boarding operation ${operation.id} must have 4-7 rooms.`);
    }
    if (operation.rooms[0]?.kind !== 'airlock' || operation.rooms.at(-1)?.kind !== 'extraction') {
      errors.push(`Boarding operation ${operation.id} needs airlock and extraction endpoints.`);
    }
    if (operation.doors.length !== operation.rooms.length - 1) {
      errors.push(`Boarding operation ${operation.id} door chain is incomplete.`);
    }
    if (operation.loot.length < 1)
      errors.push(`Boarding operation ${operation.id} has no custody loot.`);
  }
  for (const target of ['capitalShip', 'station', 'wreck', 'derelict'] as const) {
    if (!targets.has(target)) errors.push(`Boarding campaign is missing target ${target}.`);
  }
  for (const objective of [
    'breach',
    'secure',
    'rescue',
    'sabotage',
    'salvage',
    'escort',
    'timedExtraction'
  ] as const) {
    if (!objectives.has(objective))
      errors.push(`Boarding campaign is missing objective ${objective}.`);
  }
  return errors;
}

export function validateBoardingCampaignState(
  plan: BoardingCampaignPlan,
  state: BoardingCampaignState
): string[] {
  const errors: string[] = [];
  if (state.planId !== plan.id) errors.push('Boarding state plan mismatch.');
  if (state.operations.length !== plan.operations.length)
    errors.push('Boarding state operation count mismatch.');
  if (
    state.history.length > MAX_BOARDING_HISTORY ||
    state.processedEventIds.length > MAX_BOARDING_EVENTS
  ) {
    errors.push('Boarding state history exceeds bounds.');
  }
  if (new Set(state.processedEventIds).size !== state.processedEventIds.length)
    errors.push('Boarding state has duplicate event ids.');
  for (const operation of state.operations) {
    const source = plan.operations.find((candidate) => candidate.id === operation.operationId);
    if (!source) {
      errors.push(`Boarding state references unknown operation ${operation.operationId}.`);
      continue;
    }
    if (operation.cleanupActorsRetained !== 0)
      errors.push(`Boarding operation ${operation.operationId} retained cleanup actors.`);
    if (operation.loot.some((loot) => !source.loot.some((candidate) => candidate.id === loot.id))) {
      errors.push(`Boarding operation ${operation.operationId} has unknown loot.`);
    }
  }
  return errors;
}

export function formatBoardingCampaignSummary(
  plan: BoardingCampaignPlan,
  state: BoardingCampaignState
): string {
  const closed = state.operations.filter(
    (operation) => operation.status !== 'available' && operation.status !== 'active'
  );
  const custody = state.operations
    .flatMap((operation) => operation.loot)
    .filter((loot) => loot.custody === 'stowed' || loot.custody === 'held');
  return `${closed.length}/${plan.operations.length} incursions | custody ${custody.length} | ${closed.map((operation) => `${plan.operations.find((candidate) => candidate.id === operation.operationId)?.title ?? operation.operationId}:${operation.status}`).join(', ') || 'no boarding outcomes'}`;
}

function getOperationState(
  state: BoardingCampaignState,
  id: string
): BoardingOperationState | null {
  return state.operations.find((operation) => operation.operationId === id) ?? null;
}

function rejected(state: BoardingCampaignState, label: string): BoardingSettlementResult {
  return {
    state,
    disposition: 'rejected',
    status: 'failure',
    stowedLoot: [],
    unlockedHooks: [],
    label
  };
}

function formatRoomLabel(kind: BoardingRoomKind): string {
  return (
    {
      airlock: 'Breach Airlock',
      corridor: 'Armored Corridor',
      cargo: 'Claim Hold',
      quarters: 'Crew Quarters',
      brig: 'Sealed Brig',
      subsystem: 'Subsystem Spine',
      reactor: 'Reactor Gallery',
      hangar: 'Hangar Deck',
      bridge: 'Command Bridge',
      extraction: 'Extraction Lock'
    } satisfies Record<BoardingRoomKind, string>
  )[kind];
}

function formatSubsystem(kind: BoardingRoomKind): string {
  return kind === 'reactor'
    ? 'power core'
    : kind === 'bridge'
      ? 'command lattice'
      : kind === 'hangar'
        ? 'launch control'
        : 'defense bus';
}

function formatHazard(kind: BoardingHazardKind): string {
  return (
    {
      decompression: 'DECOMPRESSION',
      coolant: 'COOLANT FLOOD',
      powerArc: 'POWER ARC',
      fire: 'DECK FIRE',
      sporeCloud: 'SPORE CLOUD',
      securityGrid: 'SECURITY GRID'
    } satisfies Record<BoardingHazardKind, string>
  )[kind];
}

function formatTarget(kind: BoardingTargetKind): string {
  return (
    {
      capitalShip: 'Capital Ship',
      station: 'Station',
      wreck: 'Wreck',
      derelict: 'Derelict'
    } satisfies Record<BoardingTargetKind, string>
  )[kind];
}

function formatObjectives(kinds: readonly BoardingObjectiveKind[]): string {
  return kinds
    .map((kind) =>
      kind === 'timedExtraction' ? 'Timed Extraction' : `${kind[0]!.toUpperCase()}${kind.slice(1)}`
    )
    .join(' / ');
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function hashLabel(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
