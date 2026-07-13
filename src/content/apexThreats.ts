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
  readonly subsystemEffects: Readonly<Record<'propulsion' | 'armor' | 'core', string>>;
  readonly structureLabel: string;
  readonly huntDoctrine: string;
  readonly contactCues: Readonly<
    Record<
      'trace' | 'ambush' | 'lieutenant' | 'finale',
      {
        readonly label: string;
        readonly directive: string;
        readonly payoff: string;
      }
    >
  >;
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
    subsystemEffects: {
      propulsion: 'Trace work disrupts migration and opens an evacuation route.',
      armor: 'Escort breaks strip finale integrity and improve containment leverage.',
      core: 'Lieutenant defeats expose the mnemonic core and improve custody control.'
    },
    structureLabel: 'Trace chain',
    huntDoctrine: 'Follow stolen voices across several operations, then silence or negotiate with what gathered them.',
    contactCues: {
      trace: {
        label: 'Dead-frequency trace',
        directive: 'Hold the signal lane and recover a voiceprint from the procession wake.',
        payoff: 'Success damages Procession Vanes and adds trace intelligence for a future compact.'
      },
      ambush: {
        label: 'Reliquary intercept',
        directive: 'Break the escort screen before the choir can absorb another convoy.',
        payoff: 'Success breaches the Reliquary Chorus and closes one escape route.'
      },
      lieutenant: {
        label: 'Cantor vessel',
        directive: 'Defeat the marked cantor directing the procession formation.',
        payoff: 'Success wounds the Mnemonic Sepulcher and removes a command lieutenant.'
      },
      finale: {
        label: 'Silence the procession',
        directive: 'Neutralize Grave Choir, then decide what survives the encounter.',
        payoff: 'Prior subsystem wounds reduce its final integrity and expand disposition leverage.'
      }
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
    subsystemEffects: {
      propulsion: 'Trace work disrupts migration and creates a viable redirection lane.',
      armor: 'Escort breaks breach the mantle and improve carrier containment leverage.',
      core: 'Lieutenant command codes improve a later boarding and capture attempt.'
    },
    structureLabel: 'Siege break',
    huntDoctrine: 'Peel away the foundry\'s claimant fleet, steal its command codes, and confront the body it builds from the wreckage.',
    contactCues: {
      trace: {
        label: 'Foundry wake',
        directive: 'Cut through the pilgrim wake and lock a drive signature before it migrates.',
        payoff: 'Success damages Pilgrim Drives and establishes a redirection vector.'
      },
      ambush: {
        label: 'Claimant escort',
        directive: 'Break the marked armor convoy feeding plates into the runaway foundry.',
        payoff: 'Success breaches the Claimant Mantle and closes one escape route.'
      },
      lieutenant: {
        label: 'Pretender crucible',
        directive: 'Destroy the command crucible carrying the foundry\'s custody codes.',
        payoff: 'Success wounds the Empty Throne Reactor and supplies capture leverage.'
      },
      finale: {
        label: 'Break the empty throne',
        directive: 'Neutralize Crownless Engine, then choose what becomes of the living foundry.',
        payoff: 'Prior subsystem wounds reduce its final integrity and unlock safer dispositions.'
      }
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
    subsystemEffects: {
      propulsion: 'Trace work slows the exodus and improves a safe redirection attempt.',
      armor: 'Escort breaks open the coffer and improve containment leverage.',
      core: 'Lieutenant defeats expose the oracle and improve negotiation or custody control.'
    },
    structureLabel: 'Migration net',
    huntDoctrine: 'Map the automated exodus, cut its stripping escorts, and decide whether its passengers deserve another destination.',
    contactCues: {
      trace: {
        label: 'Exodus vector',
        directive: 'Cross the migration lane and recover a destination prediction.',
        payoff: 'Success damages Exodus Rails and establishes a future evacuation route.'
      },
      ambush: {
        label: 'Passenger screen',
        directive: 'Break the resource-stripping escort before it reaches an inhabited lane.',
        payoff: 'Success breaches the Passenger Coffer and closes one escape route.'
      },
      lieutenant: {
        label: 'Route adjudicator',
        directive: 'Defeat the marked adjudicator rewriting the convoy destination.',
        payoff: 'Success wounds the Destination Oracle and supplies command leverage.'
      },
      finale: {
        label: 'Answer the evacuation decree',
        directive: 'Neutralize Pale Convoy, then decide whether to destroy, bargain, or redirect it.',
        payoff: 'Prior subsystem wounds reduce its final integrity and expand humane alternatives.'
      }
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
