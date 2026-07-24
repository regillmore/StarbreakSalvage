import { type ItemDefinition, type ItemId, type ItemRarity } from '../content/items';
import { getComponentQuality } from '../content/engineering';
import type { FactionId } from '../content/factions';
import type { UnlockId } from '../content/unlocks';
import { createRng } from '../core/rng';
import type { ActEconomyProfile } from './ActEconomy';
import { applyCombinedHooks } from './CombinedHooks';
import type { EngineeringHookInstance, FoundryComponentInstance } from './Foundry';
import { generateRewardChoices, type ItemInstance } from './Rewards';

export interface ShopInventoryItem {
  readonly slot: number;
  readonly item: ItemDefinition;
  readonly price: number;
  readonly sourceHint: string;
}

export const SHOP_REROLL_COST = 2;
export const SHOP_HULL_REPAIR_BASE_COST = 4;
export const SHOP_BASE_CIRCUIT_STOCK = 3;

const RARITY_PRICE: Record<ItemRarity, number> = {
  common: 5,
  uncommon: 7,
  rare: 10,
  prototype: 12,
  cursed: 6
};
const PRIMARY_WEAPON_QUALITY_PRICE = [8, 12, 17, 23] as const;

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
  readonly actEconomy?: ActEconomyProfile;
  readonly engineeringHooks?: readonly EngineeringHookInstance[];
  readonly procBudget?: number;
  readonly couponCascadeUpgrade?: boolean;
  readonly convoyReceiptPrinterUpgrade?: boolean;
}): ShopInventoryItem[] {
  const shopSeed = `${options.seed}:sector-${options.sectorIndex}:reroll-${options.rerollCount}`;
  const priceRng = createRng(shopSeed).fork('prices');
  const actPriceAdjustment = options.actEconomy?.shopPriceAdjustment ?? 0;
  const hasLegacyCouponCascade = (options.itemInstances ?? []).some(
    (instance) => instance.itemId === 'item_coupon_cascade_fuse'
  );
  const applyPermanentCouponCascade =
    options.couponCascadeUpgrade === true && !hasLegacyCouponCascade;
  const hasLegacyConvoyReceiptPrinter = (options.itemInstances ?? []).some(
    (instance) => instance.itemId === 'item_convoy_receipt_printer'
  );
  const applyPermanentConvoyReceiptPrinter =
    options.convoyReceiptPrinterUpgrade === true &&
    !hasLegacyConvoyReceiptPrinter &&
    options.rerollCount > 0;
  const shopPayload = applyCombinedHooks(
    'onShopEntered',
    options.itemInstances ?? [],
    options.engineeringHooks ?? [],
    {
      sectorIndex: options.sectorIndex,
      rerollCount: options.rerollCount,
      itemCount:
        (options.count ?? SHOP_BASE_CIRCUIT_STOCK) +
        (applyPermanentConvoyReceiptPrinter ? 1 : 0),
      priceDiscount: (options.priceDiscount ?? 0) + (applyPermanentCouponCascade ? 1 : 0),
      biasTags: [
        ...(options.biasTags ?? []),
        ...(applyPermanentCouponCascade ? ['credit'] : []),
        ...(applyPermanentConvoyReceiptPrinter ? ['drone', 'credit'] : [])
      ]
    },
    { maxApplications: options.procBudget }
  );
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
      bossGate: options.bossGate,
      actEconomy: options.actEconomy
    }
  });

  return rewardChoices.map((choice, slot) => ({
    slot,
    item: choice.item,
    sourceHint: choice.sourceHint,
    price: Math.max(
      2,
      getShopPrice(choice.item, options.sectorIndex, priceRng.int(-1, 2)) +
        actPriceAdjustment -
        shopPayload.priceDiscount
    )
  }));
}

export function getShopRerollCost(
  actEconomy: ActEconomyProfile | undefined,
  rerollCount: number
): number {
  const repeatSurcharge = actEconomy?.escalated
    ? Math.min(actEconomy.repeatRerollSurcharge, Math.max(0, rerollCount))
    : 0;
  return SHOP_REROLL_COST + (actEconomy?.rerollCostBonus ?? 0) + repeatSurcharge;
}

export function getShopHullRepairCost(actEconomy: ActEconomyProfile | undefined): number {
  return SHOP_HULL_REPAIR_BASE_COST + (actEconomy?.repairCreditSurcharge ?? 0);
}

export function getShopPrimaryWeaponPrice(
  component: FoundryComponentInstance,
  actEconomy: ActEconomyProfile
): number {
  const quality = getComponentQuality(component.qualityId);
  return (
    PRIMARY_WEAPON_QUALITY_PRICE[quality.tier]! +
    Math.max(0, actEconomy.runSectorIndex - 1) +
    actEconomy.shopPriceAdjustment
  );
}

function getShopPrice(item: ItemDefinition, sectorIndex: number, variance: number): number {
  return Math.max(2, RARITY_PRICE[item.rarity] + Math.max(0, sectorIndex - 1) + variance);
}
