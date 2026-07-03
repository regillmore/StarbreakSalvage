import { describe, expect, it } from 'vitest';

import { applyItemHooks, getOrderedItemInstances } from '../../src/game/ItemHooks';
import type { ItemInstance } from '../../src/game/Rewards';

const baseProjectile = {
  x: 100,
  y: 200,
  vx: 0,
  vy: -700,
  radius: 4,
  damage: 1,
  ttl: 1.4,
  tags: ['laser'] as const,
  procDepth: 0
};

describe('item hook ordering', () => {
  it('sorts item hooks by acquisition order', () => {
    const instances: ItemInstance[] = [
      { itemId: 'item_chain_arc_capacitor', acquisitionOrder: 2 },
      { itemId: 'item_split_prism', acquisitionOrder: 1 },
      { itemId: 'item_salvage_magnet', acquisitionOrder: 3 }
    ];

    expect(getOrderedItemInstances(instances).map((instance) => instance.itemId)).toEqual([
      'item_split_prism',
      'item_chain_arc_capacitor',
      'item_salvage_magnet'
    ]);
  });
});

describe('item synergies', () => {
  it('applies split plus arc synergy', () => {
    const instances: ItemInstance[] = [
      { itemId: 'item_split_prism', acquisitionOrder: 0 },
      { itemId: 'item_chain_arc_capacitor', acquisitionOrder: 1 }
    ];
    const firePayload = applyItemHooks('onFire', instances, {
      volleyIndex: 1,
      projectiles: [baseProjectile]
    });
    const killPayload = applyItemHooks('onEnemyKilled', instances, {
      projectileTags: ['laser'],
      overkillDamage: 0,
      bonusSalvage: 0,
      blastDamage: 0,
      arcDamage: 0
    });

    expect(firePayload.projectiles).toHaveLength(3);
    expect(firePayload.projectiles.some((projectile) => projectile.tags.includes('split'))).toBe(
      true
    );
    expect(killPayload.arcDamage).toBeGreaterThan(0);
  });

  it('applies projectile spawn hooks deterministically', () => {
    const instances: ItemInstance[] = [
      { itemId: 'item_chain_arc_capacitor', acquisitionOrder: 0 },
      { itemId: 'item_ricochet_license', acquisitionOrder: 1 }
    ];
    const payload = applyItemHooks('onProjectileSpawn', instances, {
      projectile: {
        ...baseProjectile,
        tags: ['plasma'],
        ttl: 1
      }
    });

    expect(payload.projectile.tags).toContain('arc');
    expect(payload.projectile.ttl).toBeGreaterThan(1);
  });

  it('applies missile plus overkill synergy', () => {
    const instances: ItemInstance[] = [
      { itemId: 'item_overkill_ledger', acquisitionOrder: 0 },
      { itemId: 'item_bomb_refund_actuator', acquisitionOrder: 1 }
    ];
    const payload = applyItemHooks('onEnemyKilled', instances, {
      projectileTags: ['missile', 'overkill'],
      overkillDamage: 1.4,
      bonusSalvage: 0,
      blastDamage: 0,
      arcDamage: 0
    });

    expect(payload.bonusSalvage).toBe(2);
    expect(payload.blastDamage).toBeGreaterThan(0);
  });

  it('applies shield plus revenge synergy', () => {
    const instances: ItemInstance[] = [
      { itemId: 'item_shield_dynamo', acquisitionOrder: 0 },
      { itemId: 'item_revenge_beam', acquisitionOrder: 1 }
    ];
    const payload = applyItemHooks('onPlayerHit', instances, {
      damage: 1,
      revengeProjectiles: []
    });

    expect(payload.revengeProjectiles).toHaveLength(1);
    expect(payload.revengeProjectiles[0]?.tags).toContain('revenge');
  });

  it('applies drone plus copy synergy', () => {
    const instances: ItemInstance[] = [
      { itemId: 'item_drone_uplink', acquisitionOrder: 0 },
      { itemId: 'item_mirror_turret', acquisitionOrder: 1 }
    ];
    const payload = applyItemHooks('onFire', instances, {
      volleyIndex: 3,
      projectiles: [baseProjectile]
    });

    expect(payload.projectiles.length).toBeGreaterThan(2);
    expect(payload.projectiles.some((projectile) => projectile.tags.includes('drone'))).toBe(true);
  });
});
