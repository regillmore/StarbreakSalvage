import type { MissionObjectiveVerb } from './objectives';

export const BOARDING_TARGET_KINDS = ['capitalShip', 'station', 'wreck', 'derelict'] as const;
export type BoardingTargetKind = (typeof BOARDING_TARGET_KINDS)[number];

export const BOARDING_OBJECTIVE_KINDS = [
  'breach',
  'secure',
  'rescue',
  'sabotage',
  'salvage',
  'escort',
  'timedExtraction'
] as const;
export type BoardingObjectiveKind = (typeof BOARDING_OBJECTIVE_KINDS)[number];

export const BOARDING_ROOM_KINDS = [
  'airlock',
  'corridor',
  'cargo',
  'quarters',
  'brig',
  'subsystem',
  'reactor',
  'hangar',
  'bridge',
  'extraction'
] as const;
export type BoardingRoomKind = (typeof BOARDING_ROOM_KINDS)[number];

export const BOARDING_HAZARD_KINDS = [
  'decompression',
  'coolant',
  'powerArc',
  'fire',
  'sporeCloud',
  'securityGrid'
] as const;
export type BoardingHazardKind = (typeof BOARDING_HAZARD_KINDS)[number];

export type BoardingIntegration =
  | 'carrier'
  | 'crew'
  | 'faction'
  | 'foundry'
  | 'rival'
  | 'apex';

export interface BoardingContractDefinition {
  readonly id: string;
  readonly title: string;
  readonly targetKind: BoardingTargetKind;
  readonly objectiveKinds: readonly BoardingObjectiveKind[];
  readonly objectiveVerb: MissionObjectiveVerb;
  readonly objectiveId: string;
  readonly summary: string;
  readonly roomKinds: readonly BoardingRoomKind[];
  readonly hazardKinds: readonly BoardingHazardKind[];
  readonly lootLabel: string;
  readonly integrations: readonly BoardingIntegration[];
  readonly successCopy: string;
  readonly partialCopy: string;
  readonly failureCopy: string;
}

export const BOARDING_CONTRACTS: readonly BoardingContractDefinition[] = [
  {
    id: 'boarding_furnace_ledger',
    title: 'Furnace Ledger',
    targetKind: 'station',
    objectiveKinds: ['breach', 'sabotage', 'timedExtraction'],
    objectiveVerb: 'sabotage',
    objectiveId: 'objective_system_sabotage',
    summary: 'Cut through the refinery spine, poison its calibration vault, and beat the purge.',
    roomKinds: ['airlock', 'corridor', 'subsystem', 'reactor', 'extraction'],
    hazardKinds: ['coolant', 'powerArc', 'fire'],
    lootLabel: 'Furnace calibration die',
    integrations: ['carrier', 'foundry', 'faction'],
    successCopy: 'The calibration die is aboard and the refinery ledger is dark.',
    partialCopy: 'The refinery is wounded; a fragment of the die reached extraction.',
    failureCopy: 'The purge sealed the refinery before usable calibration data escaped.'
  },
  {
    id: 'boarding_lifeboat_blackbox',
    title: 'Lifeboat Blackbox',
    targetKind: 'derelict',
    objectiveKinds: ['rescue', 'escort'],
    objectiveVerb: 'rescue',
    objectiveId: 'objective_lifeboat_rescue',
    summary: 'Find the sealed survivors and screen their pod through a collapsing derelict.',
    roomKinds: ['airlock', 'quarters', 'brig', 'corridor', 'extraction'],
    hazardKinds: ['decompression', 'fire'],
    lootLabel: 'Survivor blackbox',
    integrations: ['carrier', 'crew', 'faction'],
    successCopy: 'Survivors and blackbox crossed the carrier threshold together.',
    partialCopy: 'A partial rescue manifest escaped the derelict.',
    failureCopy: 'The derelict folded before a rescue manifest reached the airlock.'
  },
  {
    id: 'boarding_claimants_vault',
    title: "Claimant's Vault",
    targetKind: 'capitalShip',
    objectiveKinds: ['breach', 'salvage'],
    objectiveVerb: 'salvage',
    objectiveId: 'objective_field_salvage',
    summary: 'Open a faction vault under live fire and keep custody of the claim to extraction.',
    roomKinds: ['airlock', 'corridor', 'cargo', 'subsystem', 'extraction'],
    hazardKinds: ['securityGrid', 'powerArc'],
    lootLabel: 'Disputed claim cylinder',
    integrations: ['carrier', 'faction'],
    successCopy: 'The disputed claim is sealed in carrier custody.',
    partialCopy: 'Only a contested slice of the claim survived extraction.',
    failureCopy: 'The claim reverted to its defenders when custody broke.'
  },
  {
    id: 'boarding_rival_drydock',
    title: 'Rival Drydock',
    targetKind: 'capitalShip',
    objectiveKinds: ['secure', 'sabotage'],
    objectiveVerb: 'assault',
    objectiveId: 'objective_breach_assault',
    summary: 'Board the rival tender, pin its captain, and cripple the refit berth.',
    roomKinds: ['airlock', 'hangar', 'corridor', 'subsystem', 'bridge', 'extraction'],
    hazardKinds: ['securityGrid', 'fire', 'decompression'],
    lootLabel: 'Rival refit cipher',
    integrations: ['carrier', 'rival', 'faction'],
    successCopy: 'The drydock is crippled and its captain is in carrier custody.',
    partialCopy: 'The refit berth is damaged, but the rival escaped the cordon.',
    failureCopy: 'The drydock repelled the incursion and accelerated its refit.'
  },
  {
    id: 'boarding_leviathan_trace',
    title: 'Leviathan Trace',
    targetKind: 'wreck',
    objectiveKinds: ['salvage', 'timedExtraction'],
    objectiveVerb: 'scan',
    objectiveId: 'objective_threat_scan',
    summary: 'Descend through a split warship and recover the impossible bite telemetry.',
    roomKinds: ['airlock', 'corridor', 'cargo', 'reactor', 'bridge', 'extraction'],
    hazardKinds: ['decompression', 'powerArc', 'sporeCloud'],
    lootLabel: 'Apex trace lattice',
    integrations: ['carrier', 'apex', 'foundry'],
    successCopy: 'The trace lattice identifies a living threat beyond the wreck.',
    partialCopy: 'A noisy trace survived; enough to begin a hunt, not enough to trust.',
    failureCopy: 'The wreck consumed its trace before extraction.'
  },
  {
    id: 'boarding_seed_hangar',
    title: 'Seed Hangar',
    targetKind: 'station',
    objectiveKinds: ['secure', 'escort', 'timedExtraction'],
    objectiveVerb: 'escort',
    objectiveId: 'objective_convoy_escort',
    summary: 'Secure an autonomous hangar and escort its dormant craft core to the carrier.',
    roomKinds: ['airlock', 'hangar', 'corridor', 'subsystem', 'cargo', 'extraction'],
    hazardKinds: ['securityGrid', 'coolant', 'fire'],
    lootLabel: 'Dormant craft core',
    integrations: ['carrier', 'crew', 'foundry', 'apex'],
    successCopy: 'The dormant craft core is berthed under carrier power.',
    partialCopy: 'The core arrived damaged but recoverable.',
    failureCopy: 'The hangar reclaimed its craft core before extraction.'
  }
];

export function getBoardingContract(id: string): BoardingContractDefinition {
  const contract = BOARDING_CONTRACTS.find((candidate) => candidate.id === id);
  if (!contract) throw new Error(`Unknown boarding contract: ${id}.`);
  return contract;
}

