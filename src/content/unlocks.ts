export type UnlockKind = 'ship' | 'item' | 'faction' | 'bossPractice' | 'music' | 'challenge';

export type UnlockId =
  | 'unlock_ship_phase_courier'
  | 'unlock_ship_shield_bruiser'
  | 'unlock_ship_scrap_monk'
  | 'unlock_ship_corporate_test_pilot'
  | 'unlock_ship_relic_thief'
  | 'unlock_item_executive_override'
  | 'unlock_challenge_debt_ceiling'
  | 'unlock_boss_auditor_drill'
  | 'unlock_faction_bloom_hive'
  | 'unlock_music_outer_debris'
  | 'unlock_music_core_descent'
  | 'unlock_music_apex_procession'
  | 'unlock_boss_apex_practice'
  | 'unlock_challenge_apex_migration';

export interface UnlockDefinition {
  readonly id: UnlockId;
  readonly kind: UnlockKind;
  readonly name: string;
  readonly summary: string;
  readonly effect: string;
  readonly grants: readonly string[];
}

export const UNLOCKS: readonly UnlockDefinition[] = [
  {
    id: 'unlock_ship_phase_courier',
    kind: 'ship',
    name: 'Phase Courier',
    summary: 'a risky starter contract built around graze and phase rewards',
    effect: 'Adds Phase Courier to future contract boards.',
    grants: ['Ship: Phase Courier']
  },
  {
    id: 'unlock_ship_shield_bruiser',
    kind: 'ship',
    name: 'Shield Bruiser',
    summary: 'a defensive starter contract that turns hits into counterplay',
    effect: 'Adds Shield Bruiser to future contract boards.',
    grants: ['Ship: Shield Bruiser']
  },
  {
    id: 'unlock_ship_scrap_monk',
    kind: 'ship',
    name: 'Scrap Monk',
    summary: 'a salvage-focused starter contract for pickup-heavy runs',
    effect: 'Adds Scrap Monk to future contract boards.',
    grants: ['Ship: Scrap Monk']
  },
  {
    id: 'unlock_ship_corporate_test_pilot',
    kind: 'ship',
    name: 'Corporate Test Pilot',
    summary: 'an unsafe prototype contract with extreme sponsor clauses',
    effect: 'Adds Corporate Test Pilot to future contract boards.',
    grants: ['Ship: Corporate Test Pilot']
  },
  {
    id: 'unlock_ship_relic_thief',
    kind: 'ship',
    name: 'Relic Thief',
    summary: 'a curse-biased starter contract that favors vault routes',
    effect: 'Adds Relic Thief to future contract boards and opens cursed relic reward files.',
    grants: ['Ship: Relic Thief', 'Item Family: Curse Relic']
  },
  {
    id: 'unlock_item_executive_override',
    kind: 'item',
    name: 'Executive Override',
    summary: 'a prototype survival clause for future reward pools',
    effect: 'Adds Overheat Oracle and classified heat prototypes to combat and vault rewards.',
    grants: ['Item: Overheat Oracle', 'Item Family: Heat Prototype Classified Tier']
  },
  {
    id: 'unlock_challenge_debt_ceiling',
    kind: 'challenge',
    name: 'Debt Ceiling',
    summary: 'a future challenge mode that makes credit choices louder',
    effect: 'Marks challenge seed DEBT-CEILING-404 as available for seed-entry work.',
    grants: ['Challenge Seed: Debt Ceiling']
  },
  {
    id: 'unlock_boss_auditor_drill',
    kind: 'bossPractice',
    name: 'Auditor Drill',
    summary: 'a future practice entry for direct boss rehearsal',
    effect: 'Marks Auditor Drone XL as available for direct boss practice.',
    grants: ['Boss Practice: Auditor Drone XL']
  },
  {
    id: 'unlock_faction_bloom_hive',
    kind: 'faction',
    name: 'Bloom Hive Dossier',
    summary: 'a faction dossier for organic bullet-pattern variants',
    effect: 'Adds Bloom Hive enemies and The Bloom Engine boss to generated sectors.',
    grants: ['Faction: Bloom Hive', 'Boss: The Bloom Engine']
  },
  {
    id: 'unlock_music_outer_debris',
    kind: 'music',
    name: 'Outer Debris Mix',
    summary: 'a future procedural music layer for the first sector',
    effect: 'Marks the Outer Debris procedural music layer as available.',
    grants: ['Music Flag: Outer Debris Mix']
  },
  {
    id: 'unlock_music_core_descent',
    kind: 'music',
    name: 'Core Descent Mix',
    summary: 'a future procedural music layer for final-sector pressure',
    effect: 'Marks the Core Descent finale music layer as available.',
    grants: ['Music Flag: Core Descent Mix']
  },
  {
    id: 'unlock_music_apex_procession',
    kind: 'music',
    name: 'Procession Signal Layer',
    summary: 'a future procedural signal layer recovered from the Grave Choir',
    effect: 'Adds the Procession signal layer to future voyage music variation.',
    grants: ['Music Flag: Procession Signal Layer']
  },
  {
    id: 'unlock_boss_apex_practice',
    kind: 'bossPractice',
    name: 'Apex Containment Drills',
    summary: 'practice files for multi-stage apex confrontations',
    effect: 'Adds apex confrontation variants to future practice selections.',
    grants: ['Boss Practice: Apex Containment Drills']
  },
  {
    id: 'unlock_challenge_apex_migration',
    kind: 'challenge',
    name: 'Migration Alarm',
    summary: 'a future challenge seed with open apex escape routes',
    effect: 'Marks challenge seed MIGRATION-ALARM as available.',
    grants: ['Challenge Seed: Migration Alarm']
  }
];

export function getUnlockById(id: UnlockId): UnlockDefinition {
  const unlock = UNLOCKS.find((candidate) => candidate.id === id);

  if (!unlock) {
    throw new Error(`Unknown unlock id: ${id}`);
  }

  return unlock;
}
