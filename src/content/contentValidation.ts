import { BOSSES, type BossDefinition } from './bosses';
import { ACHIEVEMENTS, type AchievementDefinition } from './achievements';
import { FACTIONS, type FactionDefinition } from './factions';
import {
  ITEM_HOOKS,
  ITEMS,
  ITEM_TAGS,
  REWARD_POOLS,
  type ItemDefinition,
  type RewardPoolDefinition
} from './items';
import { SECTORS, type SectorDefinition } from './sectors';
import { UNLOCKS, type UnlockDefinition } from './unlocks';

export interface ContentValidationInput {
  readonly achievements?: readonly AchievementDefinition[];
  readonly bosses?: readonly BossDefinition[];
  readonly factions?: readonly FactionDefinition[];
  readonly items?: readonly ItemDefinition[];
  readonly rewardPools?: readonly RewardPoolDefinition[];
  readonly sectors?: readonly SectorDefinition[];
  readonly unlocks?: readonly UnlockDefinition[];
}

export function validateContent(input: ContentValidationInput = {}): string[] {
  const achievements = input.achievements ?? ACHIEVEMENTS;
  const bosses = input.bosses ?? BOSSES;
  const factions = input.factions ?? FACTIONS;
  const items = input.items ?? ITEMS;
  const rewardPools = input.rewardPools ?? REWARD_POOLS;
  const sectors = input.sectors ?? SECTORS;
  const unlocks = input.unlocks ?? UNLOCKS;
  const errors: string[] = [];
  const achievementIds = new Set<string>();
  const bossIds = new Set<string>();
  const factionIds = new Set<string>();
  const itemIds = new Set<string>();
  const unlockIds = new Set<string>();
  const tagRegistry = new Set<string>(ITEM_TAGS);
  const hookRegistry = new Set<string>(ITEM_HOOKS);

  for (const unlock of unlocks) {
    if (unlockIds.has(unlock.id)) {
      errors.push(`Duplicate unlock id: ${unlock.id}`);
    }

    unlockIds.add(unlock.id);
  }

  for (const achievement of achievements) {
    if (achievementIds.has(achievement.id)) {
      errors.push(`Duplicate achievement id: ${achievement.id}`);
    }

    achievementIds.add(achievement.id);

    if (achievement.unlockIds.length === 0) {
      errors.push(`Achievement ${achievement.id} must grant at least one unlock`);
    }

    for (const unlockId of achievement.unlockIds) {
      if (!unlockIds.has(unlockId)) {
        errors.push(`Achievement ${achievement.id} references missing unlock: ${unlockId}`);
      }
    }
  }

  for (const faction of factions) {
    if (factionIds.has(faction.id)) {
      errors.push(`Duplicate faction id: ${faction.id}`);
    }

    factionIds.add(faction.id);
  }

  for (const boss of bosses) {
    if (bossIds.has(boss.id)) {
      errors.push(`Duplicate boss id: ${boss.id}`);
    }

    bossIds.add(boss.id);

    if (!factionIds.has(boss.factionId)) {
      errors.push(`Boss ${boss.id} references missing faction: ${boss.factionId}`);
    }

    if (!Number.isFinite(boss.maxHull) || boss.maxHull <= 0) {
      errors.push(`Boss ${boss.id} must have positive maxHull`);
    }
  }

  for (const item of items) {
    if (itemIds.has(item.id)) {
      errors.push(`Duplicate item id: ${item.id}`);
    }

    itemIds.add(item.id);

    for (const tag of item.tags) {
      if (!tagRegistry.has(tag)) {
        errors.push(`Item ${item.id} has invalid tag: ${tag}`);
      }
    }

    for (const hook of item.hooks) {
      if (!hookRegistry.has(hook)) {
        errors.push(`Item ${item.id} has invalid hook: ${hook}`);
      }
    }

    if (!Number.isFinite(item.weight) || item.weight <= 0) {
      errors.push(`Item ${item.id} must have a positive weight`);
    }
  }

  for (const pool of rewardPools) {
    if (pool.itemIds.length === 0) {
      errors.push(`Reward pool ${pool.id} must not be empty`);
    }

    for (const itemId of pool.itemIds) {
      if (!itemIds.has(itemId)) {
        errors.push(`Reward pool ${pool.id} references missing item: ${itemId}`);
      }
    }
  }

  for (const sector of sectors) {
    if (sector.bossCandidates.length === 0) {
      errors.push(`Sector ${sector.id} must have at least one boss candidate`);
    }

    for (const bossId of sector.bossCandidates) {
      if (!bossIds.has(bossId)) {
        errors.push(`Sector ${sector.id} references missing boss: ${bossId}`);
      }
    }

    if (sector.objective.kind !== 'clearWaves' && sector.objective.kind !== 'defeatBoss') {
      errors.push(`Sector ${sector.id} has invalid objective kind: ${sector.objective.kind}`);
    }

    if (!Number.isInteger(sector.objective.waveCount) || sector.objective.waveCount <= 0) {
      errors.push(`Sector ${sector.id} objective must have a positive waveCount`);
    }

    if (!Number.isInteger(sector.objective.spawnsPerWave) || sector.objective.spawnsPerWave <= 0) {
      errors.push(`Sector ${sector.id} objective must have a positive spawnsPerWave`);
    }

    if (sector.objective.kind === 'defeatBoss' && !sector.objective.bossGate) {
      errors.push(`Sector ${sector.id} defeatBoss objective must enable bossGate`);
    }
  }

  return errors;
}

export function assertValidContent(input: ContentValidationInput = {}): void {
  const errors = validateContent(input);

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
}
