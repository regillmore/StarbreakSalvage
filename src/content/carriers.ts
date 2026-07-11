import type { FactionId } from './factions';

export type CarrierId = 'carrier_cinder_tender' | 'carrier_ledger_ark' | 'carrier_ghost_drydock';
export type CarrierFacilityType =
  | 'foundry'
  | 'medbay'
  | 'intelligence'
  | 'hangar'
  | 'vault'
  | 'reactor'
  | 'liaison';
export type CarrierPosture = 'survey' | 'stealth' | 'assault';

export interface CarrierFacilityDefinition {
  readonly type: CarrierFacilityType;
  readonly label: string;
  readonly summary: string;
  readonly influence: string;
  readonly upgradeCost: number;
}

export interface CarrierDefinition {
  readonly id: CarrierId;
  readonly name: string;
  readonly origin: 'recovered' | 'contracted';
  readonly summary: string;
  readonly maxHull: number;
  readonly cargoCapacity: number;
  readonly facilitySlots: number;
  readonly startingFacilities: readonly CarrierFacilityType[];
  readonly replacementOrder: readonly CarrierFacilityType[];
  readonly liaisonFactionId: FactionId;
}

export const CARRIER_FACILITIES: readonly CarrierFacilityDefinition[] = [
  { type: 'foundry', label: 'Wake Foundry', summary: 'Refines recovered components between operations.', influence: 'better engineering salvage and component handling', upgradeCost: 5 },
  { type: 'medbay', label: 'Cold Medbay', summary: 'Treats injured crew during sector transit.', influence: 'crew recovers one sector earlier', upgradeCost: 4 },
  { type: 'intelligence', label: 'Long-Ear Array', summary: 'Forecasts optional mission exposure and claim traffic.', influence: 'keeps optional mission access open under moderate pressure', upgradeCost: 5 },
  { type: 'hangar', label: 'Pocket Hangar', summary: 'Reserves launch rails for bounded support craft.', influence: 'adds one future support-craft berth and pursuit screening', upgradeCost: 6 },
  { type: 'vault', label: 'Seal Vault', summary: 'Stores volatile cargo without spreading heat.', influence: 'adds cargo capacity and vault reward bias', upgradeCost: 5 },
  { type: 'reactor', label: 'Spare-Sun Reactor', summary: 'Routes power across damaged facilities.', influence: 'reduces transit heat and keeps one damaged system useful', upgradeCost: 6 },
  { type: 'liaison', label: 'Claim Liaison', summary: 'Maintains one faction channel through debt and pursuit.', influence: 'improves market access and future front diplomacy', upgradeCost: 4 }
];

export const CARRIERS: readonly CarrierDefinition[] = [
  {
    id: 'carrier_cinder_tender', name: 'Cinder Tender', origin: 'recovered',
    summary: 'A furnace tug recovered from the Core Wreck and rebuilt as a mobile workshop.',
    maxHull: 8, cargoCapacity: 8, facilitySlots: 4,
    startingFacilities: ['foundry', 'reactor', 'medbay', 'hangar'],
    replacementOrder: ['intelligence', 'vault', 'liaison', 'foundry', 'medbay', 'hangar', 'reactor'],
    liaisonFactionId: 'faction_scrap_court'
  },
  {
    id: 'carrier_ledger_ark', name: 'Ledger Ark', origin: 'contracted',
    summary: 'A repossessed convoy vault leased under a contract nobody expects to survive.',
    maxHull: 7, cargoCapacity: 10, facilitySlots: 4,
    startingFacilities: ['vault', 'liaison', 'intelligence', 'reactor'],
    replacementOrder: ['foundry', 'medbay', 'hangar', 'vault', 'liaison', 'intelligence', 'reactor'],
    liaisonFactionId: 'faction_corporate_ledger'
  },
  {
    id: 'carrier_ghost_drydock', name: 'Ghost Drydock', origin: 'recovered',
    summary: 'A silent frontier dock whose machinery still remembers how to hide a fleet.',
    maxHull: 6, cargoCapacity: 9, facilitySlots: 4,
    startingFacilities: ['hangar', 'intelligence', 'foundry', 'vault'],
    replacementOrder: ['reactor', 'medbay', 'liaison', 'hangar', 'intelligence', 'foundry', 'vault'],
    liaisonFactionId: 'faction_void_corsairs'
  }
];

export const CARRIER_POSTURES: readonly CarrierPosture[] = ['survey', 'stealth', 'assault'];

export function getCarrierFacility(type: CarrierFacilityType): CarrierFacilityDefinition {
  const facility = CARRIER_FACILITIES.find((candidate) => candidate.type === type);
  if (!facility) throw new Error(`Unknown carrier facility: ${type}.`);
  return facility;
}
