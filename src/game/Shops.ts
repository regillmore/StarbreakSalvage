import { type ItemDefinition, type ItemId, type ItemRarity } from '../content/items';
import type { FactionId } from '../content/factions';
import type { UnlockId } from '../content/unlocks';
import { createRng } from '../core/rng';
import { applyItemHooks } from './ItemHooks';
import { generateRewardChoices, type ItemInstance } from './Rewards';

export interface ShopInventoryItem {
  readonly slot: number;
  readonly item: ItemDefinition;
  readonly price: number;
  readonly sourceHint: string;
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
  readonly unlockedIds?: readonly UnlockId[];
  readonly itemInstances?: readonly ItemInstance[];
  readonly sectorId?: string;
  readonly sectorRole?: string;
  readonly bossFactionId?: FactionId;
  readonly bossGate?: boolean;
}): ShopInventoryItem[] {
  const shopSeed = `${options.seed}:sector-${options.sectorIndex}:reroll-${options.rerollCount}`;
  const priceRng = createRng(shopSeed).fork('prices');
  const shopPayload = applyItemHooks('onShopEntered', options.itemInstances ?? [], {
    sectorIndex: options.sectorIndex,
    rerollCount: options.rerollCount,
    itemCount: options.count ?? SHOP_ITEM_COUNT,
    priceDiscount: options.priceDiscount ?? 0,
    biasTags: options.biasTags ?? []
  });
  const rewardChoices = generateRewardChoices({
    seed: shopSeed,
    poolId: 'combat',
    poolProfileId: 'shop',
    count: Math.max(1, Math.floor(shopPayload.itemCount)),
    biasTags: shopPayload.biasTags,
    excludeItemIds: options.excludeItemIds ?? [],
    unlockedIds: options.unlockedIds,
    context: {
      routeKind: 'shop',
      sectorId: options.sectorId,
      sectorRole: options.sectorRole,
      bossFactionId: options.bossFactionId,
      bossGate: options.bossGate
    }
  });

  return rewardChoices.map((choice, slot) => ({
    slot,
    item: choice.item,
    sourceHint: choice.sourceHint,
    price: Math.max(
      2,
      getShopPrice(choice.item, options.sectorIndex, priceRng.int(-1, 2)) -
        shopPayload.priceDiscount
    )
  }));
}

function getShopPrice(item: ItemDefinition, sectorIndex: number, variance: number): number {
  return Math.max(2, RARITY_PRICE[item.rarity] + Math.max(0, sectorIndex - 1) + variance);
}
