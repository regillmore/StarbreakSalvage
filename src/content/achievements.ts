import type { UnlockId } from './unlocks';

export type AchievementId =
  | 'achievement_first_contract'
  | 'achievement_salvage_receipt'
  | 'achievement_route_surveyor'
  | 'achievement_credit_float'
  | 'achievement_boss_claim'
  | 'achievement_build_crafter';

export type AchievementStat =
  | 'runsEnded'
  | 'salvageRecovered'
  | 'sectorsCleared'
  | 'creditsRecovered'
  | 'bossesDefeated'
  | 'itemTriggers';

export interface AchievementCondition {
  readonly stat: AchievementStat;
  readonly atLeast: number;
}

export interface AchievementDefinition {
  readonly id: AchievementId;
  readonly name: string;
  readonly summary: string;
  readonly condition: AchievementCondition;
  readonly unlockIds: readonly UnlockId[];
}

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  {
    id: 'achievement_first_contract',
    name: 'Liability Accepted',
    summary: 'complete any recorded contract outcome',
    condition: { stat: 'runsEnded', atLeast: 1 },
    unlockIds: ['unlock_ship_phase_courier', 'unlock_ship_shield_bruiser']
  },
  {
    id: 'achievement_salvage_receipt',
    name: 'Legally Ambiguous Salvage',
    summary: 'recover salvage into the permanent bank',
    condition: { stat: 'salvageRecovered', atLeast: 1 },
    unlockIds: ['unlock_ship_scrap_monk']
  },
  {
    id: 'achievement_route_surveyor',
    name: 'Route Surveyor',
    summary: 'clear a sector and choose a route',
    condition: { stat: 'sectorsCleared', atLeast: 1 },
    unlockIds: ['unlock_ship_corporate_test_pilot', 'unlock_ship_relic_thief']
  },
  {
    id: 'achievement_credit_float',
    name: 'Credit Float',
    summary: 'finish a run with a useful credit reserve',
    condition: { stat: 'creditsRecovered', atLeast: 10 },
    unlockIds: ['unlock_item_executive_override', 'unlock_challenge_debt_ceiling']
  },
  {
    id: 'achievement_boss_claim',
    name: 'Boss Claim Filed',
    summary: 'defeat a boss in combat',
    condition: { stat: 'bossesDefeated', atLeast: 1 },
    unlockIds: ['unlock_boss_auditor_drill', 'unlock_faction_bloom_hive']
  },
  {
    id: 'achievement_build_crafter',
    name: 'Build-Crafter',
    summary: 'trigger item hooks during combat',
    condition: { stat: 'itemTriggers', atLeast: 1 },
    unlockIds: ['unlock_music_outer_debris']
  }
];
