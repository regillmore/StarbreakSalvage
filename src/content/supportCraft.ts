import type { CrewCommand } from './crew';

export const SUPPORT_CRAFT_ROLES = [
  'interceptor',
  'screenDrone',
  'salvageSkiff',
  'shieldTender',
  'boardingPod',
  'repairTug'
] as const;
export type SupportCraftRole = (typeof SUPPORT_CRAFT_ROLES)[number];

export const FLEET_DOCTRINES = ['escort', 'screen', 'harvest', 'breach', 'reserve'] as const;
export type FleetDoctrine = (typeof FLEET_DOCTRINES)[number];

export const FLEET_REFITS = ['standard', 'overdrive', 'reinforced'] as const;
export type FleetRefit = (typeof FLEET_REFITS)[number];

export interface SupportCraftDefinition {
  readonly id: string;
  readonly role: SupportCraftRole;
  readonly label: string;
  readonly summary: string;
  readonly preferredCommand: CrewCommand;
  readonly defaultDoctrine: FleetDoctrine;
  readonly buildSalvage: number;
  readonly repairSalvage: number;
  readonly maxHull: number;
  readonly moveSpeed: number;
  readonly fireCooldownSeconds: number;
  readonly projectileDamage: number;
  readonly itineraryUse: string;
  readonly cue: {
    readonly glyph: string;
    readonly color: string;
    readonly highContrastGlyph: string;
  };
}

export const SUPPORT_CRAFT: readonly SupportCraftDefinition[] = [
  craft(
    'fleet_interceptor',
    'interceptor',
    'Needle Interceptor',
    'A fast pursuit cutter that hunts exposed targets but cannot hold a line.',
    'focus',
    'escort',
    5,
    2,
    2,
    250,
    0.72,
    1,
    'reduces pursuit escape risk',
    'I',
    '#68d9ff',
    'I'
  ),
  craft(
    'fleet_screen_drone',
    'screenDrone',
    'Prism Screen Drone',
    'A disposable lattice drone that clears fire instead of adding another gun.',
    'screen',
    'screen',
    4,
    2,
    3,
    190,
    1.35,
    1,
    'screens hostile operation pressure',
    'D',
    '#b8f5ff',
    'D'
  ),
  craft(
    'fleet_salvage_skiff',
    'salvageSkiff',
    'Latch Salvage Skiff',
    'A magnet rig that recovers loose value while leaving the strike wing thinner.',
    'salvage',
    'harvest',
    4,
    2,
    2,
    175,
    1.4,
    1,
    'adds salvage to successful optional operations',
    'S',
    '#ffd36a',
    'S'
  ),
  craft(
    'fleet_shield_tender',
    'shieldTender',
    'Palisade Shield Tender',
    'A slow field tender that repairs formation craft but spends a valuable berth.',
    'regroup',
    'screen',
    6,
    3,
    5,
    145,
    1.55,
    1,
    'reduces carrier transit exposure',
    'T',
    '#8cffb2',
    'T'
  ),
  craft(
    'fleet_boarding_pod',
    'boardingPod',
    'Grapnel Boarding Pod',
    'An armored insertion pod that opens breach options and risks total loss inside.',
    'focus',
    'breach',
    6,
    3,
    4,
    165,
    1.05,
    2,
    'opens and improves boarding incursions',
    'B',
    '#ff9a74',
    'B'
  ),
  craft(
    'fleet_repair_tug',
    'repairTug',
    'Cold-Weld Repair Tug',
    'A compact service tug that recovers damaged craft instead of maximizing fire.',
    'regroup',
    'reserve',
    5,
    2,
    4,
    155,
    1.65,
    1,
    'reduces fleet repair and recovery costs',
    'R',
    '#d7b5ff',
    'R'
  )
];

export function getSupportCraftDefinition(id: string): SupportCraftDefinition {
  const definition = SUPPORT_CRAFT.find((candidate) => candidate.id === id);
  if (!definition) throw new Error(`Unknown support craft ${id}.`);
  return definition;
}

function craft(
  id: string,
  role: SupportCraftRole,
  label: string,
  summary: string,
  preferredCommand: CrewCommand,
  defaultDoctrine: FleetDoctrine,
  buildSalvage: number,
  repairSalvage: number,
  maxHull: number,
  moveSpeed: number,
  fireCooldownSeconds: number,
  projectileDamage: number,
  itineraryUse: string,
  glyph: string,
  color: string,
  highContrastGlyph: string
): SupportCraftDefinition {
  return {
    id,
    role,
    label,
    summary,
    preferredCommand,
    defaultDoctrine,
    buildSalvage,
    repairSalvage,
    maxHull,
    moveSpeed,
    fireCooldownSeconds,
    projectileDamage,
    itineraryUse,
    cue: { glyph, color, highContrastGlyph }
  };
}
