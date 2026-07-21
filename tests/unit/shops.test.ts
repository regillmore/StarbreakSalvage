import { describe, expect, it } from 'vitest';

import { generateShopInventory } from '../../src/game/Shops';

const baseOptions = {
  seed: 'COUPON-CASCADE-COMPATIBILITY',
  sectorIndex: 3,
  rerollCount: 1,
  excludeItemIds: []
} as const;

describe('shop permanent effects', () => {
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
      count: 5,
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
