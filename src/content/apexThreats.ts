import type { BossId } from './bosses';
import type { FactionId } from './factions';
import type { UnlockId } from './unlocks';

export const APEX_HUNT_STRUCTURES = ['traceChain', 'siegeBreak', 'migrationNet'] as const;
export type ApexHuntStructure = (typeof APEX_HUNT_STRUCTURES)[number];

export const APEX_OUTCOMES = [
  'destruction',
  'capture',
  'containment',
  'bargain',
  'evacuation'
] as const;
export type ApexOutcome = (typeof APEX_OUTCOMES)[number];

export interface ApexThreatDefinition {
  readonly id: string;
  readonly name: string;
  readonly title: string;
  readonly summary: string;
  readonly structure: ApexHuntStructure;
  readonly bossId: BossId;
  readonly factionId: FactionId;
  readonly subsystemLabels: Readonly<Record<'propulsion' | 'armor' | 'core', string>>;
  readonly supportedOutcomes: readonly ApexOutcome[];
  readonly rewardUnlockId: UnlockId;
  readonly mapCue: string;
}

export const APEX_THREATS: readonly ApexThreatDefinition[] = [
  {
    id: 'apex_grave_choir',
    name: 'Grave Choir',
    title: 'Signal-Eating Procession',
    summary: 'A procession of dead transponders gathers voices, escorts, and mass as it crosses the frontier.',
    structure: 'traceChain',
    bossId: 'boss_grave_choir',
    factionId: 'faction_bloom_hive',
    subsystemLabels: {
      propulsion: 'Procession Vanes',
      armor: 'Reliquary Chorus',
      core: 'Mnemonic Sepulcher'
    },
    supportedOutcomes: ['destruction', 'containment', 'bargain'],
    rewardUnlockId: 'unlock_music_apex_procession',
    mapCue: '[CHOIR]'
  },
  {
    id: 'apex_crownless_engine',
    name: 'Crownless Engine',
    title: 'Runaway Siege Foundry',
    summary: 'A self-coronating foundry migrates between wrecks and manufactures a new body around every wound.',
    structure: 'siegeBreak',
    bossId: 'boss_crownless_engine',
    factionId: 'faction_scrap_court',
    subsystemLabels: {
      propulsion: 'Pilgrim Drives',
      armor: 'Claimant Mantle',
      core: 'Empty Throne Reactor'
    },
    supportedOutcomes: ['destruction', 'capture', 'containment'],
    rewardUnlockId: 'unlock_boss_apex_practice',
    mapCue: '[CROWN]'
  },
  {
    id: 'apex_pale_convoy',
    name: 'Pale Convoy',
    title: 'Uncrewed Evacuation Armada',
    summary: 'An automated refugee fleet mistakes every inhabited route for a collapsing world and strips it for passage.',
    structure: 'migrationNet',
    bossId: 'boss_pale_convoy',
    factionId: 'faction_corporate_ledger',
    subsystemLabels: {
      propulsion: 'Exodus Rails',
      armor: 'Passenger Coffer',
      core: 'Destination Oracle'
    },
    supportedOutcomes: ['destruction', 'bargain', 'evacuation'],
    rewardUnlockId: 'unlock_challenge_apex_migration',
    mapCue: '[PALE]'
  }
];

export function getApexThreatDefinition(id: string): ApexThreatDefinition {
  const definition = APEX_THREATS.find((candidate) => candidate.id === id);
  if (!definition) throw new Error(`Unknown apex threat ${id}.`);
  return definition;
}
