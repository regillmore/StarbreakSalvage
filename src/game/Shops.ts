import { type ItemDefinition, type ItemId, type ItemRarity } from '../content/items';
import { createRng } from '../core/rng';
import { generateRewardChoices } from './Rewards';

export interface ShopInventoryItem {
  readonly slot: number;
  readonly item: ItemDefinition;
  readonly price: number;
}

export const SHOP_REROLL_COST = 2;

const SHOP_ITEM_COUNT = 4;
const RARITY_PRICE: Record<ItemRarity, number> = {
  common: 5,
  uncommon: 7,
  rare: 10,
  prototype: 12,
  cursed: 6
};

export function generateShopInventory(options: {
  readonly seed: string;
  readonly sectorIndex: number;
  readonly rerollCount: number;
  readonly biasTags?: readonly string[];
  readonly excludeItemIds?: readonly ItemId[];
  readonly priceDiscount?: number;
  readonly count?: number;
}): ShopInventoryItem[] {
  const shopSeed = `${options.seed}:sector-${options.sectorIndex}:reroll-${options.rerollCount}`;
  const priceRng = createRng(shopSeed).fork('prices');
  const rewardChoices = generateRewardChoices({
    seed: shopSeed,
    poolId: 'combat',
    count: options.count ?? SHOP_ITEM_COUNT,
    biasTags: options.biasTags ?? [],
    excludeItemIds: options.excludeItemIds ?? []
  });

  return rewardChoices.map((choice, slot) => ({
    slot,
    item: choice.item,
    price: Math.max(
      2,
      getShopPrice(choice.item, options.sectorIndex, priceRng.int(-1, 2)) -
        (options.priceDiscount ?? 0)
    )
  }));
}

function getShopPrice(item: ItemDefinition, sectorIndex: number, variance: number): number {
  return Math.max(2, RARITY_PRICE[item.rarity] + Math.max(0, sectorIndex - 1) + variance);
}
