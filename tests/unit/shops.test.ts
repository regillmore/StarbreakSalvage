import { describe, expect, it } from 'vitest';

import { createActEconomyProfile } from '../../src/game/ActEconomy';
import { generateRunSkeleton } from '../../src/game/Generation';
import {
  generateShopInventory,
  getShopHullRepairCost,
  SHOP_BASE_CIRCUIT_STOCK
} from '../../src/game/Shops';

const baseOptions = {
  seed: 'COUPON-CASCADE-COMPATIBILITY',
  sectorIndex: 3,
  rerollCount: 1,
  excludeItemIds: []
} as const;

describe('shop permanent effects', () => {
  it('offers three base circuit slots before earned stock bonuses', () => {
    expect(generateShopInventory({ ...baseOptions, rerollCount: 0 })).toHaveLength(
      SHOP_BASE_CIRCUIT_STOCK
    );
  });

  it('prices repeatable hull service from the current act repair economy', () => {
    const run = generateRunSkeleton('SHOP-HULL-REPAIR-PRICE');
    const actOne = createActEconomyProfile(run.sectors[run.acts[0]!.startSectorIndex]!);
    const actTwo = createActEconomyProfile(run.sectors[run.acts[1]!.startSectorIndex]!);
    const actThree = createActEconomyProfile(run.sectors[run.acts[2]!.endSectorIndex]!);

    expect(getShopHullRepairCost(actOne)).toBe(4);
    expect(getShopHullRepairCost(actTwo)).toBe(6);
    expect(getShopHullRepairCost(actThree)).toBeGreaterThan(getShopHullRepairCost(actTwo));
  });

  it('preserves Coupon Cascade pricing and bias without doubling a restored item copy', () => {
    const authoredEquivalent = generateShopInventory({
      ...baseOptions,
      priceDiscount: 1,
      biasTags: ['credit']
    });
    const permanent = generateShopInventory({
      ...baseOptions,
      couponCascadeUpgrade: true
    });
    const restoredItem = generateShopInventory({
      ...baseOptions,
      itemInstances: [{ itemId: 'item_coupon_cascade_fuse', acquisitionOrder: 0 }]
    });
    const both = generateShopInventory({
      ...baseOptions,
      couponCascadeUpgrade: true,
      itemInstances: [{ itemId: 'item_coupon_cascade_fuse', acquisitionOrder: 0 }]
    });

    expect(permanent).toEqual(authoredEquivalent);
    expect(restoredItem).toEqual(authoredEquivalent);
    expect(both).toEqual(authoredEquivalent);
  });

  it('preserves Convoy Receipt reroll stock without doubling a restored item copy', () => {
    const authoredEquivalent = generateShopInventory({
      ...baseOptions,
      count: SHOP_BASE_CIRCUIT_STOCK + 1,
      biasTags: ['drone', 'credit']
    });
    const permanent = generateShopInventory({
      ...baseOptions,
      convoyReceiptPrinterUpgrade: true
    });
    const restoredItem = generateShopInventory({
      ...baseOptions,
      itemInstances: [{ itemId: 'item_convoy_receipt_printer', acquisitionOrder: 0 }]
    });
    const both = generateShopInventory({
      ...baseOptions,
      convoyReceiptPrinterUpgrade: true,
      itemInstances: [{ itemId: 'item_convoy_receipt_printer', acquisitionOrder: 0 }]
    });
    const initial = generateShopInventory({
      ...baseOptions,
      rerollCount: 0,
      convoyReceiptPrinterUpgrade: true
    });
    const initialBaseline = generateShopInventory({ ...baseOptions, rerollCount: 0 });

    expect(permanent).toEqual(authoredEquivalent);
    expect(restoredItem).toEqual(authoredEquivalent);
    expect(both).toEqual(authoredEquivalent);
    expect(initial).toEqual(initialBaseline);
  });
});
