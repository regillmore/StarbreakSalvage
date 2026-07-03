import { describe, expect, it } from 'vitest';

import { generateRunSkeleton } from '../../src/game/Generation';
import { generateRewardChoices, generateStartingItemLoadout } from '../../src/game/Rewards';

describe('reward generation', () => {
  it('returns deterministic reward choices for the same seed and pool', () => {
    const first = generateRewardChoices({
      seed: 'LASER-TAX-404',
      poolId: 'starter',
      count: 3,
      biasTags: ['credit']
    }).map((choice) => choice.item.id);
    const second = generateRewardChoices({
      seed: 'LASER-TAX-404',
      poolId: 'starter',
      count: 3,
      biasTags: ['credit']
    }).map((choice) => choice.item.id);

    expect(first).toEqual(second);
  });

  it('creates a starter loadout with acquisition order and visible split/arc kit', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const contract = run.contracts[0];

    if (!contract) {
      throw new Error('Expected generated contract for reward test.');
    }

    const loadout = generateStartingItemLoadout(run.seed, contract);

    expect(loadout).toEqual([
      expect.objectContaining({ itemId: 'item_split_prism', acquisitionOrder: 0 }),
      expect.objectContaining({ itemId: 'item_chain_arc_capacitor', acquisitionOrder: 1 }),
      expect.objectContaining({ acquisitionOrder: 2 })
    ]);
  });
});
