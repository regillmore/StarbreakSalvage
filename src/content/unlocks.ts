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
  | 'unlock_music_outer_debris';

export interface UnlockDefinition {
  readonly id: UnlockId;
  readonly kind: UnlockKind;
  readonly name: string;
  readonly summary: string;
}

export const UNLOCKS: readonly UnlockDefinition[] = [
  {
    id: 'unlock_ship_phase_courier',
    kind: 'ship',
    name: 'Phase Courier',
    summary: 'a risky starter contract built around graze and phase rewards'
  },
  {
    id: 'unlock_ship_shield_bruiser',
    kind: 'ship',
    name: 'Shield Bruiser',
    summary: 'a defensive starter contract that turns hits into counterplay'
  },
  {
    id: 'unlock_ship_scrap_monk',
    kind: 'ship',
    name: 'Scrap Monk',
    summary: 'a salvage-focused starter contract for pickup-heavy runs'
  },
  {
    id: 'unlock_ship_corporate_test_pilot',
    kind: 'ship',
    name: 'Corporate Test Pilot',
    summary: 'an unsafe prototype contract with extreme sponsor clauses'
  },
  {
    id: 'unlock_ship_relic_thief',
    kind: 'ship',
    name: 'Relic Thief',
    summary: 'a curse-biased starter contract that favors vault routes'
  },
  {
    id: 'unlock_item_executive_override',
    kind: 'item',
    name: 'Executive Override',
    summary: 'a prototype survival clause for future reward pools'
  },
  {
    id: 'unlock_challenge_debt_ceiling',
    kind: 'challenge',
    name: 'Debt Ceiling',
    summary: 'a future challenge mode that makes credit choices louder'
  },
  {
    id: 'unlock_boss_auditor_drill',
    kind: 'bossPractice',
    name: 'Auditor Drill',
    summary: 'a future practice entry for direct boss rehearsal'
  },
  {
    id: 'unlock_faction_bloom_hive',
    kind: 'faction',
    name: 'Bloom Hive Dossier',
    summary: 'a faction dossier for organic bullet-pattern variants'
  },
  {
    id: 'unlock_music_outer_debris',
    kind: 'music',
    name: 'Outer Debris Mix',
    summary: 'a future procedural music layer for the first sector'
  }
];

export function getUnlockById(id: UnlockId): UnlockDefinition {
  const unlock = UNLOCKS.find((candidate) => candidate.id === id);

  if (!unlock) {
    throw new Error(`Unknown unlock id: ${id}`);
  }

  return unlock;
}
