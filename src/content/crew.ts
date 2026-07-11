import type { FactionId } from './factions';
import type { MissionCrewPolicy } from './objectives';
import type { ShipcraftTag } from './shipModules';

export const CREW_ROLE_IDS = [
  'crew_interceptor',
  'crew_bulwark',
  'crew_salvager',
  'crew_engineer',
  'crew_pathfinder'
] as const;
export type CrewRoleId = (typeof CREW_ROLE_IDS)[number];

export const CREW_COMMANDS = ['focus', 'screen', 'salvage', 'regroup', 'disengage'] as const;
export type CrewCommand = (typeof CREW_COMMANDS)[number];

export interface CrewRoleDefinition {
  readonly id: CrewRoleId;
  readonly role: string;
  readonly summary: string;
  readonly trait: string;
  readonly preferredCommand: CrewCommand;
  readonly commandCost: number;
  readonly hull: number;
  readonly moveSpeed: number;
  readonly fireCooldownSeconds: number;
  readonly projectileDamage: number;
  readonly preferredFrameTags: readonly ShipcraftTag[];
  readonly preferredModuleTags: readonly ShipcraftTag[];
  readonly eligibleMissionPolicies: readonly MissionCrewPolicy[];
  readonly preferredFactionIds: readonly FactionId[];
  readonly cue: {
    readonly glyph: string;
    readonly color: string;
    readonly highContrastGlyph: string;
  };
}

export const CREW_ROLES: readonly CrewRoleDefinition[] = [
  {
    id: 'crew_interceptor',
    role: 'Interceptor Pilot',
    summary: 'A fast wingmate that converts focus orders into precise pursuit fire.',
    trait: 'Needle Threader',
    preferredCommand: 'focus',
    commandCost: 1,
    hull: 4,
    moveSpeed: 250,
    fireCooldownSeconds: 0.72,
    projectileDamage: 1,
    preferredFrameTags: ['light', 'mobility'],
    preferredModuleTags: ['missile', 'phase'],
    eligibleMissionPolicies: ['recordCandidate'],
    preferredFactionIds: ['faction_void_corsairs', 'faction_corporate_ledger'],
    cue: { glyph: 'F', color: '#7cf7ff', highContrastGlyph: 'ALLY-F' }
  },
  {
    id: 'crew_bulwark',
    role: 'Screen Warden',
    summary: 'A durable escort that intercepts hostile shots under screen orders.',
    trait: 'Debt Shield',
    preferredCommand: 'screen',
    commandCost: 2,
    hull: 7,
    moveSpeed: 175,
    fireCooldownSeconds: 1.15,
    projectileDamage: 1,
    preferredFrameTags: ['heavy', 'command'],
    preferredModuleTags: ['shield', 'armor'],
    eligibleMissionPolicies: ['protectSpecialist'],
    preferredFactionIds: ['faction_scrap_court', 'faction_corporate_ledger'],
    cue: { glyph: 'S', color: '#ffd166', highContrastGlyph: 'ALLY-S' }
  },
  {
    id: 'crew_salvager',
    role: 'Wreck Diver',
    summary: 'A recovery specialist that pulls loose value out of dangerous lanes.',
    trait: 'Claim Before Impact',
    preferredCommand: 'salvage',
    commandCost: 1,
    hull: 5,
    moveSpeed: 205,
    fireCooldownSeconds: 1.05,
    projectileDamage: 1,
    preferredFrameTags: ['salvage', 'economy'],
    preferredModuleTags: ['salvage', 'drone'],
    eligibleMissionPolicies: ['recordCandidate', 'protectSpecialist'],
    preferredFactionIds: ['faction_scrap_court', 'faction_bloom_hive'],
    cue: { glyph: '$', color: '#8dff9a', highContrastGlyph: 'ALLY-$' }
  },
  {
    id: 'crew_engineer',
    role: 'Field Engineer',
    summary: 'A systems specialist that steadies regroup recovery and foundry commits.',
    trait: 'Cold-Solder Nerves',
    preferredCommand: 'regroup',
    commandCost: 2,
    hull: 5,
    moveSpeed: 190,
    fireCooldownSeconds: 1.2,
    projectileDamage: 1,
    preferredFrameTags: ['command', 'prototype'],
    preferredModuleTags: ['heat', 'utility'],
    eligibleMissionPolicies: ['protectSpecialist'],
    preferredFactionIds: ['faction_corporate_ledger', 'faction_bloom_hive'],
    cue: { glyph: '+', color: '#ff9ad5', highContrastGlyph: 'ALLY-+' }
  },
  {
    id: 'crew_pathfinder',
    role: 'Void Pathfinder',
    summary: 'A route scout whose disengage discipline preserves crews through bad gates.',
    trait: 'Exit Geometry',
    preferredCommand: 'disengage',
    commandCost: 1,
    hull: 4,
    moveSpeed: 235,
    fireCooldownSeconds: 0.9,
    projectileDamage: 1,
    preferredFrameTags: ['mobility', 'phase'],
    preferredModuleTags: ['phase', 'heat'],
    eligibleMissionPolicies: ['recordCandidate'],
    preferredFactionIds: ['faction_void_corsairs'],
    cue: { glyph: '>', color: '#b9a6ff', highContrastGlyph: 'ALLY->' }
  }
];

export const CREW_NAME_PARTS: Readonly<
  Record<FactionId, { readonly names: readonly string[]; readonly callsigns: readonly string[] }>
> = {
  faction_scrap_court: {
    names: ['Mara Venn', 'Ivo Rusk', 'Talla Quoin', 'Brin Oss'],
    callsigns: ['Rivet', 'Crownless', 'Latch', 'Tin Saint']
  },
  faction_corporate_ledger: {
    names: ['Nia Sum', 'Oren Vale', 'Kest Rel', 'Pava Nine'],
    callsigns: ['Margin', 'Blue Ink', 'Variance', 'Receipt']
  },
  faction_bloom_hive: {
    names: ['Sera Mycel', 'Olo Vire', 'Nemi Rhiz', 'Caro Spore'],
    callsigns: ['Soft Signal', 'Green Wake', 'Third Petal', 'Rootlight']
  },
  faction_void_corsairs: {
    names: ['Vey Orra', 'Karo Nix', 'Sumi Raal', 'Dax Sable'],
    callsigns: ['Side Door', 'Low Star', 'Afterimage', 'Quiet Knife']
  }
};

export function getCrewRole(id: CrewRoleId): CrewRoleDefinition {
  const role = CREW_ROLES.find((candidate) => candidate.id === id);
  if (!role) throw new Error(`Unknown crew role: ${id}.`);
  return role;
}
