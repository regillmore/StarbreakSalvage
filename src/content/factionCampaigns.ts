import type { FactionId } from './factions';
import type { ItemTag } from './items';

export const FACTION_RESPONSE_POLICY_IDS = [
  'response_scrap_grudge',
  'response_ledger_escalation',
  'response_bloom_encroachment',
  'response_void_reprisal'
] as const;
export type FactionResponsePolicyId = (typeof FACTION_RESPONSE_POLICY_IDS)[number];

export const RIVAL_ARCHETYPE_IDS = [
  'rival_toll_marshal',
  'rival_wreck_duelist',
  'rival_spore_cantor',
  'rival_phase_reaver',
  'rival_convoy_warden'
] as const;
export type RivalArchetypeId = (typeof RIVAL_ARCHETYPE_IDS)[number];

export type RivalTactic = 'laneClamp' | 'ramFeint' | 'sporeScreen' | 'phaseCross' | 'escortWall';
export type RivalRecurrencePolicy = 'grudgeEscalation' | 'injuryAdaptation' | 'territoryDefense';

export interface FactionResponsePolicyDefinition {
  readonly id: FactionResponsePolicyId;
  readonly factionId: FactionId;
  readonly label: string;
  readonly summary: string;
  readonly aidShopWeight: number;
  readonly hostilityCombatWeight: number;
  readonly stolenAssetWeight: number;
  readonly sparedTargetWeight: number;
  readonly territoryPressureWeight: number;
  readonly crewOfferThreshold: number;
  readonly routeCopy: string;
  readonly escalationCopy: string;
}

export interface RivalArchetypeDefinition {
  readonly id: RivalArchetypeId;
  readonly title: string;
  readonly summary: string;
  readonly tactic: RivalTactic;
  readonly preferredFactionIds: readonly FactionId[];
  readonly shipNouns: readonly string[];
  readonly baseHull: number;
  readonly fireDelayMultiplier: number;
  readonly firstRetreatHullRatio: number;
  readonly recurrencePolicy: RivalRecurrencePolicy;
  readonly recurrenceGapSectors: number;
  readonly maxAppearances: number;
  readonly upgradeSequence: readonly string[];
  readonly captureReward: { readonly credits: number; readonly salvage: number };
  readonly destructionReward: { readonly credits: number; readonly salvage: number };
  readonly rewardBiasTags: readonly ItemTag[];
  readonly cue: { readonly glyph: string; readonly highContrastGlyph: string };
}

export const FACTION_RESPONSE_POLICIES: readonly FactionResponsePolicyDefinition[] = [
  {
    id: 'response_scrap_grudge',
    factionId: 'faction_scrap_court',
    label: 'Wreck-Tithe Grudge',
    summary:
      'The Court prices stolen wreckage as a personal insult and answers with heavier escorts.',
    aidShopWeight: 1,
    hostilityCombatWeight: 2,
    stolenAssetWeight: 3,
    sparedTargetWeight: 2,
    territoryPressureWeight: 1,
    crewOfferThreshold: 3,
    routeCopy: 'Court witnesses trade salvage gossip for remembered mercy.',
    escalationCopy: 'Court claimants are welding stolen plates onto a returning captain.'
  },
  {
    id: 'response_ledger_escalation',
    factionId: 'faction_corporate_ledger',
    label: 'Compound Enforcement',
    summary:
      'The Ledger converts hostility into tariffs, lane screens, and formally upgraded collectors.',
    aidShopWeight: 2,
    hostilityCombatWeight: 2,
    stolenAssetWeight: 2,
    sparedTargetWeight: 1,
    territoryPressureWeight: 2,
    crewOfferThreshold: 4,
    routeCopy: 'Ledger permits can reduce prices, while active warrants increase them.',
    escalationCopy: 'A compound warrant has attached hardened lane hardware to the rival ship.'
  },
  {
    id: 'response_bloom_encroachment',
    factionId: 'faction_bloom_hive',
    label: 'Living Border',
    summary:
      'The Hive turns mission outcomes into territory growth, symbiotic offers, and spore screens.',
    aidShopWeight: 1,
    hostilityCombatWeight: 1,
    stolenAssetWeight: 2,
    sparedTargetWeight: 2,
    territoryPressureWeight: 3,
    crewOfferThreshold: 2,
    routeCopy: 'Calm Bloom territory opens symbiotic repair and distress-call leads.',
    escalationCopy: 'The rival returns with a scar-grown screen adapted to the last injury.'
  },
  {
    id: 'response_void_reprisal',
    factionId: 'faction_void_corsairs',
    label: 'Ransom Reprisal',
    summary:
      'Corsairs remember stolen cargo and spared captains, then bend later routes around the debt.',
    aidShopWeight: 2,
    hostilityCombatWeight: 3,
    stolenAssetWeight: 3,
    sparedTargetWeight: 1,
    territoryPressureWeight: 1,
    crewOfferThreshold: 3,
    routeCopy: 'Corsair favors reveal phase paths; unpaid ransom invites crossing fire.',
    escalationCopy: 'The returning captain has purchased a phase cut with the accumulated grudge.'
  }
];

export const RIVAL_ARCHETYPES: readonly RivalArchetypeDefinition[] = [
  {
    id: 'rival_toll_marshal',
    title: 'Toll Marshal',
    summary: 'A patient lane keeper who treats every escape route as billable territory.',
    tactic: 'laneClamp',
    preferredFactionIds: ['faction_corporate_ledger', 'faction_scrap_court'],
    shipNouns: ['Quiet Sum', 'Ninth Receipt', 'Closed Account'],
    baseHull: 9,
    fireDelayMultiplier: 0.9,
    firstRetreatHullRatio: 0.3,
    recurrencePolicy: 'grudgeEscalation',
    recurrenceGapSectors: 2,
    maxAppearances: 3,
    upgradeSequence: ['paired lien cannons', 'hardened audit keel', 'compound pursuit drive'],
    captureReward: { credits: 8, salvage: 4 },
    destructionReward: { credits: 5, salvage: 7 },
    rewardBiasTags: ['credit', 'laser'],
    cue: { glyph: 'TOLL', highContrastGlyph: 'RIVAL-T' }
  },
  {
    id: 'rival_wreck_duelist',
    title: 'Wreck Duelist',
    summary:
      'A close-range claimant who records injuries as titles and returns wearing the evidence.',
    tactic: 'ramFeint',
    preferredFactionIds: ['faction_scrap_court', 'faction_void_corsairs'],
    shipNouns: ['Bent Crown', 'Claimant Zero', 'Rust Verdict'],
    baseHull: 10,
    fireDelayMultiplier: 1,
    firstRetreatHullRatio: 0.34,
    recurrencePolicy: 'injuryAdaptation',
    recurrenceGapSectors: 2,
    maxAppearances: 3,
    upgradeSequence: ['scar-plated prow', 'counterburn grapnel', 'jury-rigged broadside'],
    captureReward: { credits: 6, salvage: 6 },
    destructionReward: { credits: 3, salvage: 9 },
    rewardBiasTags: ['scrap', 'armor'],
    cue: { glyph: 'DUEL', highContrastGlyph: 'RIVAL-D' }
  },
  {
    id: 'rival_spore_cantor',
    title: 'Spore Cantor',
    summary: 'A bio-machine soloist whose surviving hull grows a countermeasure around each wound.',
    tactic: 'sporeScreen',
    preferredFactionIds: ['faction_bloom_hive'],
    shipNouns: ['Green Refrain', 'Choir Scar', 'Pollen Debt'],
    baseHull: 8,
    fireDelayMultiplier: 0.94,
    firstRetreatHullRatio: 0.28,
    recurrencePolicy: 'injuryAdaptation',
    recurrenceGapSectors: 2,
    maxAppearances: 4,
    upgradeSequence: ['reactive spore veil', 'echo-seed launcher', 'regrown cantor shell'],
    captureReward: { credits: 5, salvage: 7 },
    destructionReward: { credits: 4, salvage: 8 },
    rewardBiasTags: ['drone', 'plasma'],
    cue: { glyph: 'CANT', highContrastGlyph: 'RIVAL-C' }
  },
  {
    id: 'rival_phase_reaver',
    title: 'Phase Reaver',
    summary:
      'A ransom ace who crosses the player line, withdraws, and sells the telemetry back as menace.',
    tactic: 'phaseCross',
    preferredFactionIds: ['faction_void_corsairs'],
    shipNouns: ['Ransom Wake', 'Sideways Knife', 'Absent Witness'],
    baseHull: 8,
    fireDelayMultiplier: 0.82,
    firstRetreatHullRatio: 0.26,
    recurrencePolicy: 'grudgeEscalation',
    recurrenceGapSectors: 3,
    maxAppearances: 3,
    upgradeSequence: ['split-phase rudder', 'ransom needle pair', 'ghost beacon scrambler'],
    captureReward: { credits: 9, salvage: 3 },
    destructionReward: { credits: 7, salvage: 5 },
    rewardBiasTags: ['phase', 'missile'],
    cue: { glyph: 'PHASE', highContrastGlyph: 'RIVAL-P' }
  },
  {
    id: 'rival_convoy_warden',
    title: 'Convoy Warden',
    summary: 'An escort commander who converts territorial losses into thicker moving walls.',
    tactic: 'escortWall',
    preferredFactionIds: ['faction_scrap_court', 'faction_corporate_ledger', 'faction_bloom_hive'],
    shipNouns: ['Last Carriage', 'Wall Without Gate', 'Procession Nail'],
    baseHull: 11,
    fireDelayMultiplier: 1.05,
    firstRetreatHullRatio: 0.32,
    recurrencePolicy: 'territoryDefense',
    recurrenceGapSectors: 2,
    maxAppearances: 3,
    upgradeSequence: ['escort signal forge', 'mobile bulwark plates', 'convoy retaliation rack'],
    captureReward: { credits: 7, salvage: 5 },
    destructionReward: { credits: 4, salvage: 9 },
    rewardBiasTags: ['armor', 'drone'],
    cue: { glyph: 'WARD', highContrastGlyph: 'RIVAL-W' }
  }
];

export const RIVAL_NAME_PARTS: Readonly<
  Record<FactionId, { readonly callsigns: readonly string[]; readonly surnames: readonly string[] }>
> = {
  faction_scrap_court: {
    callsigns: ['Baron', 'Claimant', 'Marshal', 'Dame'],
    surnames: ['Kettlewire', 'Rusk Vane', 'Oxblood Nine', 'Morrowplate']
  },
  faction_corporate_ledger: {
    callsigns: ['Auditor', 'Receiver', 'Comptroller', 'Executor'],
    surnames: ['Vale-7', 'Mira Quoin', 'Orson Pike', 'Tessell Gray']
  },
  faction_bloom_hive: {
    callsigns: ['Cantor', 'Vessel', 'Chorus', 'Gardener'],
    surnames: ['Of Nine Petals', 'Amber Lung', 'Soft-Thorn', 'Root After Rain']
  },
  faction_void_corsairs: {
    callsigns: ['Captain', 'Ransomer', 'Knife', 'Witness'],
    surnames: ['Sable Kest', 'Irix No-Moon', 'Vanta Coil', 'Pale Meridian']
  }
};

export function getFactionResponsePolicy(factionId: FactionId): FactionResponsePolicyDefinition {
  const definition = FACTION_RESPONSE_POLICIES.find(
    (candidate) => candidate.factionId === factionId
  );
  if (!definition) throw new Error(`Missing faction response policy for ${factionId}.`);
  return definition;
}

export function getRivalArchetype(id: RivalArchetypeId): RivalArchetypeDefinition {
  const definition = RIVAL_ARCHETYPES.find((candidate) => candidate.id === id);
  if (!definition) throw new Error(`Unknown rival archetype ${id}.`);
  return definition;
}
