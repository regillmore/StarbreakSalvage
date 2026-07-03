import {
  ITEM_HOOKS,
  ITEMS,
  ITEM_TAGS,
  REWARD_POOLS,
  type ItemDefinition,
  type RewardPoolDefinition
} from './items';

export interface ContentValidationInput {
  readonly items?: readonly ItemDefinition[];
  readonly rewardPools?: readonly RewardPoolDefinition[];
}

export function validateContent(input: ContentValidationInput = {}): string[] {
  const items = input.items ?? ITEMS;
  const rewardPools = input.rewardPools ?? REWARD_POOLS;
  const errors: string[] = [];
  const itemIds = new Set<string>();
  const tagRegistry = new Set<string>(ITEM_TAGS);
  const hookRegistry = new Set<string>(ITEM_HOOKS);

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

  return errors;
}

export function assertValidContent(input: ContentValidationInput = {}): void {
  const errors = validateContent(input);

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
}
