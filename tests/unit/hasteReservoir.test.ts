import { describe, expect, it } from 'vitest';

import {
  BASE_HASTE_CAPACITY_SECONDS,
  HASTE_CAPACITY_PER_ADDITIONAL_SOURCE_SECONDS,
  STANDARD_HASTE_FIRE_COOLDOWN_MULTIPLIER,
  createHasteReservoirProfile,
  createHasteReservoirReadModel,
  fillHasteReservoir,
  getHasteFireCooldownMultiplier
} from '../../src/game/HasteReservoir';
import type { ItemInstance } from '../../src/game/Rewards';

describe('HasteReservoir', () => {
  it('has no capacity without a fitted haste source', () => {
    expect(createHasteReservoirProfile([])).toEqual({
      sourceCount: 0,
      capacitySeconds: 0,
      sourceIds: []
    });
    expect(fillHasteReservoir(0, 4, 0)).toBe(0);
  });

  it('scales one shared capacity with distinct haste sources', () => {
    const items: ItemInstance[] = [
      { itemId: 'item_coin_operated_cannon', acquisitionOrder: 0 },
      { itemId: 'item_coin_operated_cannon', acquisitionOrder: 1 },
      { itemId: 'item_credit_reroute_fuse', acquisitionOrder: 2 },
      { itemId: 'item_phase_wake_suture', acquisitionOrder: 3 }
    ];

    expect(createHasteReservoirProfile(items)).toEqual({
      sourceCount: 3,
      capacitySeconds:
        BASE_HASTE_CAPACITY_SECONDS + 2 * HASTE_CAPACITY_PER_ADDITIONAL_SOURCE_SECONDS,
      sourceIds: ['item_coin_operated_cannon', 'item_credit_reroute_fuse', 'item_phase_wake_suture']
    });
  });

  it('caps clustered refills without changing the standard live cadence', () => {
    const capacitySeconds = 4;
    const filled = fillHasteReservoir(3.7, 9, capacitySeconds);
    const active = createHasteReservoirReadModel(
      [{ itemId: 'item_coin_operated_cannon', acquisitionOrder: 0 }],
      filled
    );

    expect(filled).toBe(capacitySeconds);
    expect(active.fireCooldownMultiplier).toBe(STANDARD_HASTE_FIRE_COOLDOWN_MULTIPLIER);
    expect(getHasteFireCooldownMultiplier(0.01)).toBe(STANDARD_HASTE_FIRE_COOLDOWN_MULTIPLIER);
    expect(getHasteFireCooldownMultiplier(0)).toBe(1);
  });
});
