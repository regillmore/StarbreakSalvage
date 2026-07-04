import { getItemById, REWARD_POOLS, type ItemDefinition, type ItemId } from '../content/items';
import type { StartingContract } from './Generation';
import { createRng, type Rng } from '../core/rng';
import { filterUnlockedItemIds, type UnlockAccess } from './UnlockGates';

export interface ItemInstance {
  readonly itemId: ItemId;
  readonly acquisitionOrder: number;
}

export interface RewardChoice {
  readonly item: ItemDefinition;
  readonly weight: number;
}

const DEFAULT_FIELD_KIT: readonly ItemId[] = ['item_split_prism', 'item_chain_arc_capacitor'];

export function generateRewardChoices(options: {
  readonly seed: string;
  readonly poolId: 'starter' | 'combat' | 'vault';
  readonly count: number;
  readonly biasTags?: readonly string[];
  readonly excludeItemIds?: readonly ItemId[];
  readonly unlockedIds?: UnlockAccess['unlockedIds'];
}): RewardChoice[] {
  const pool = REWARD_POOLS.find((candidate) => candidate.id === options.poolId);

  if (!pool || pool.itemIds.length === 0) {
    throw new Error(`Reward pool ${options.poolId} is empty or missing.`);
  }

  const rng = createRng(options.seed).fork(`reward-${options.poolId}`);
  const excluded = new Set<ItemId>(options.excludeItemIds ?? []);
  const availableItems = filterUnlockedItemIds(pool.itemIds, { unlockedIds: options.unlockedIds })
    .filter((itemId) => !excluded.has(itemId))
    .map((itemId) => getItemById(itemId));

  return selectUniqueRewards(rng, availableItems, options.count, options.biasTags ?? []);
}

export function generateStartingItemLoadout(
  seed: string,
  contract: StartingContract,
  options: UnlockAccess = {}
): ItemInstance[] {
  const rewardChoices = generateRewardChoices({
    seed: `${seed}:${contract.id}:field-kit`,
    poolId: 'starter',
    count: 3,
    biasTags: contract.itemBias,
    excludeItemIds: DEFAULT_FIELD_KIT,
    unlockedIds: options.unlockedIds
  });
  const itemIds = [...DEFAULT_FIELD_KIT, ...rewardChoices.map((choice) => choice.item.id)].slice(
    0,
    3
  );

  return itemIds.map((itemId, acquisitionOrder) => ({
    itemId,
    acquisitionOrder
  }));
}

export function getItemNames(instances: readonly ItemInstance[]): string[] {
  return instances.map((instance) => getItemById(instance.itemId).name);
}

function selectUniqueRewards(
  rng: Rng,
  items: readonly ItemDefinition[],
  count: number,
  biasTags: readonly string[]
): RewardChoice[] {
  const available = [...items];
  const selected: RewardChoice[] = [];

  while (selected.length < count && available.length > 0) {
    const item = rng.weightedChoice(
      available.map((candidate) => ({
        item: candidate,
        weight: getRewardWeight(candidate, biasTags)
      }))
    );

    selected.push({
      item,
      weight: getRewardWeight(item, biasTags)
    });
    available.splice(available.indexOf(item), 1);
  }

  return selected;
}

function getRewardWeight(item: ItemDefinition, biasTags: readonly string[]): number {
  const biasBonus = item.tags.reduce(
    (bonus, tag) => bonus + (biasTags.includes(tag) ? item.weight : 0),
    0
  );

  return item.weight + biasBonus;
}
