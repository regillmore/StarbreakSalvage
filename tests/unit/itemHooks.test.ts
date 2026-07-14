import { describe, expect, it } from 'vitest';

import {
  applyItemHooks,
  applyItemHooksWithReport,
  getOrderedItemInstances
} from '../../src/game/ItemHooks';
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

  it('reports deterministic hook order and enforces an application cap', () => {
    const instances: ItemInstance[] = [
      { itemId: 'item_salvage_dividend_chip', acquisitionOrder: 2 },
      { itemId: 'item_laser_tax_stamp', acquisitionOrder: 0 },
      { itemId: 'item_vault_parasite', acquisitionOrder: 1 }
    ];
    const report = applyItemHooksWithReport(
      'onEnemyKilled',
      instances,
      {
        projectileTags: ['laser'],
        overkillDamage: 0,
        bonusSalvage: 0,
        blastDamage: 0,
        arcDamage: 0
      },
      { maxApplications: 2 }
    );

    expect(report.appliedItemIds).toEqual(['item_laser_tax_stamp', 'item_vault_parasite']);
    expect(report.skippedItemIds).toEqual(['item_salvage_dividend_chip']);
    expect(report.payload.bonusSalvage).toBe(1);
  });

  it('keeps future hook surfaces inert until items declare implementations', () => {
    const instances: ItemInstance[] = [
      { itemId: 'item_phase_grazer', acquisitionOrder: 0 },
      { itemId: 'item_overheat_oracle', acquisitionOrder: 1 }
    ];
    const payload = applyItemHooks('onGraze', instances, {
      projectileTags: ['phase'],
      specialChargeGain: 0.1,
      bonusSalvage: 0,
      fireRateMultiplier: 1,
      effectRadius: 34
    });

    expect(payload).toEqual({
      projectileTags: ['phase'],
      specialChargeGain: 0.1,
      bonusSalvage: 0,
      fireRateMultiplier: 1,
      effectRadius: 34
    });
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
    expect(payload.projectile.ricochetBounces).toBe(1);
  });

  it('uses fitted circuit order to build materially different projectile chains', () => {
    const phaseSplitClone: ItemInstance[] = [
      {
        itemId: 'item_phase_grazer',
        acquisitionOrder: 0,
        socket: { componentId: 'a', socketIndex: 0, circuitOrder: 0 }
      },
      {
        itemId: 'item_split_prism',
        acquisitionOrder: 1,
        socket: { componentId: 'a', socketIndex: 1, circuitOrder: 1 }
      },
      {
        itemId: 'item_signal_clone_stamp',
        acquisitionOrder: 2,
        socket: { componentId: 'b', socketIndex: 0, circuitOrder: 2 }
      }
    ];
    const clonePhaseSplit = phaseSplitClone.map((item, index) => ({
      ...item,
      socket: { ...item.socket!, circuitOrder: [1, 2, 0][index]! }
    }));

    const builtThenCloned = applyItemHooks('onFire', phaseSplitClone, {
      volleyIndex: 12,
      projectiles: [baseProjectile]
    });
    const clonedThenBuilt = applyItemHooks('onFire', clonePhaseSplit, {
      volleyIndex: 12,
      projectiles: [baseProjectile]
    });

    expect(builtThenCloned.projectiles).toHaveLength(6);
    expect(clonedThenBuilt.projectiles).toHaveLength(4);
    expect(builtThenCloned.projectiles.filter((shot) => shot.tags.includes('drone'))).toHaveLength(
      3
    );
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

    expect(payload.revengeProjectiles.length).toBeGreaterThanOrEqual(2);
    expect(
      payload.revengeProjectiles.some((projectile) => projectile.tags.includes('revenge'))
    ).toBe(true);
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

  it('applies expanded volley hooks for missile, phase, and arc drone builds', () => {
    const instances: ItemInstance[] = [
      { itemId: 'item_missile_splinter_warrant', acquisitionOrder: 0 },
      { itemId: 'item_phase_grazer', acquisitionOrder: 1 },
      { itemId: 'item_overheat_oracle', acquisitionOrder: 2 },
      { itemId: 'item_chain_arc_capacitor', acquisitionOrder: 3 },
      { itemId: 'item_arc_welder_drone', acquisitionOrder: 4 }
    ];
    const payload = applyItemHooks('onFire', instances, {
      volleyIndex: 60,
      projectiles: [baseProjectile]
    });

    expect(payload.projectiles.length).toBeGreaterThan(4);
    expect(payload.projectiles.some((projectile) => projectile.tags.includes('missile'))).toBe(
      true
    );
    expect(payload.projectiles.some((projectile) => projectile.tags.includes('phase'))).toBe(true);
    expect(payload.projectiles.some((projectile) => projectile.tags.includes('drone'))).toBe(true);
  });

  it('applies expanded projectile spawn hooks for plasma and phase builds', () => {
    const instances: ItemInstance[] = [
      { itemId: 'item_plasma_lens_array', acquisitionOrder: 0 },
      { itemId: 'item_phase_anchor_spool', acquisitionOrder: 1 },
      { itemId: 'item_plasma_bloom_filter', acquisitionOrder: 2 }
    ];
    const payload = applyItemHooks('onProjectileSpawn', instances, {
      projectile: {
        ...baseProjectile,
        tags: ['plasma', 'phase'],
        damage: 1,
        radius: 4,
        ttl: 1
      }
    });

    expect(payload.projectile.tags).toContain('arc');
    expect(payload.projectile.tags).toContain('ricochet');
    expect(payload.projectile.damage).toBeGreaterThan(1);
    expect(payload.projectile.radius).toBeGreaterThan(4);
    expect(payload.projectile.ttl).toBeGreaterThan(1);
  });

  it('applies expanded kill reward hooks', () => {
    const instances: ItemInstance[] = [
      { itemId: 'item_laser_tax_stamp', acquisitionOrder: 0 },
      { itemId: 'item_scrap_saints_relay', acquisitionOrder: 1 },
      { itemId: 'item_bombardier_tithe', acquisitionOrder: 2 },
      { itemId: 'item_relic_index_codex', acquisitionOrder: 3 },
      { itemId: 'item_salvage_dividend_chip', acquisitionOrder: 4 }
    ];
    const payload = applyItemHooks('onEnemyKilled', instances, {
      projectileTags: ['laser', 'drone', 'missile', 'phase'],
      overkillDamage: 0,
      bonusSalvage: 0,
      blastDamage: 0,
      arcDamage: 0
    });

    expect(payload.bonusSalvage).toBe(4);
    expect(payload.blastDamage).toBeGreaterThan(0);
  });

  it('applies expanded pickup and curse revenge hooks', () => {
    const pickupInstances: ItemInstance[] = [
      { itemId: 'item_credit_reroute_fuse', acquisitionOrder: 0 },
      { itemId: 'item_magnetized_tithe_box', acquisitionOrder: 1 }
    ];
    const creditPayload = applyItemHooks('onPickupCollected', pickupInstances, {
      kind: 'credit',
      fireRateMultiplier: 1
    });

    const revengeInstances: ItemInstance[] = [
      { itemId: 'item_cursed_hull_plate', acquisitionOrder: 0 },
      { itemId: 'item_curse_eater_gasket', acquisitionOrder: 1 }
    ];
    const hitPayload = applyItemHooks('onPlayerHit', revengeInstances, {
      damage: 2,
      revengeProjectiles: []
    });

    expect(creditPayload.fireRateMultiplier).toBeLessThan(1);
    expect(hitPayload.revengeProjectiles.length).toBeGreaterThanOrEqual(2);
    expect(
      hitPayload.revengeProjectiles.some((projectile) => projectile.tags.includes('relic'))
    ).toBe(true);
  });

  it('applies first expansion volley hooks for split, missile, and sidecar items', () => {
    const instances: ItemInstance[] = [
      { itemId: 'item_lane_splitter_chisel', acquisitionOrder: 0 },
      { itemId: 'item_wake_missile_abacus', acquisitionOrder: 1 },
      { itemId: 'item_sidecar_drone_bay', acquisitionOrder: 2 }
    ];
    const payload = applyItemHooks('onFire', instances, {
      volleyIndex: 60,
      projectiles: [baseProjectile]
    });

    expect(payload.projectiles.length).toBeGreaterThan(4);
    expect(payload.projectiles.some((projectile) => projectile.tags.includes('split'))).toBe(true);
    expect(payload.projectiles.some((projectile) => projectile.tags.includes('missile'))).toBe(
      true
    );
    expect(payload.projectiles.some((projectile) => projectile.tags.includes('drone'))).toBe(true);
  });

  it('applies first expansion projectile spawn hooks', () => {
    const instances: ItemInstance[] = [
      { itemId: 'item_arc_window_invoice', acquisitionOrder: 0 },
      { itemId: 'item_signal_clone_stamp', acquisitionOrder: 1 },
      { itemId: 'item_heat_signature_loop', acquisitionOrder: 2 }
    ];
    const payload = applyItemHooks('onProjectileSpawn', instances, {
      projectile: {
        ...baseProjectile,
        tags: ['plasma', 'drone', 'heat'],
        damage: 1,
        ttl: 1
      }
    });

    expect(payload.projectile.tags).toContain('arc');
    expect(payload.projectile.tags).toContain('heat');
    expect(payload.projectile.damage).toBeGreaterThan(1);
    expect(payload.projectile.ttl).toBeGreaterThan(1);
  });

  it('applies first expansion graze, special, and bomb hooks', () => {
    const grazePayload = applyItemHooks(
      'onGraze',
      [
        { itemId: 'item_near_miss_tachometer', acquisitionOrder: 0 },
        { itemId: 'item_phase_wake_suture', acquisitionOrder: 1 }
      ],
      {
        projectileTags: ['phase'],
        specialChargeGain: 0.1,
        bonusSalvage: 0,
        fireRateMultiplier: 1,
        effectRadius: 34
      }
    );
    const specialPayload = applyItemHooks(
      'onSpecialUsed',
      [{ itemId: 'item_prototype_vent_script', acquisitionOrder: 0 }],
      {
        projectiles: [baseProjectile],
        activeSeconds: 1,
        cooldownSeconds: 2,
        fireRateMultiplier: 1
      }
    );
    const bombPayload = applyItemHooks(
      'onBombUsed',
      [{ itemId: 'item_excess_warhead_clause', acquisitionOrder: 0 }],
      {
        damage: 5,
        bossDamageRatio: 0.05,
        invulnerabilitySeconds: 0.8,
        cooldownSeconds: 8,
        effectRadius: 120,
        cancelledProjectiles: 3
      }
    );

    expect(grazePayload.specialChargeGain).toBeGreaterThan(0.1);
    expect(grazePayload.fireRateMultiplier).toBeLessThan(1);
    expect(grazePayload.effectRadius).toBeGreaterThan(34);
    expect(specialPayload.projectiles).toHaveLength(2);
    expect(specialPayload.cooldownSeconds).toBeLessThan(2);
    expect(specialPayload.fireRateMultiplier).toBeLessThan(1);
    expect(bombPayload.damage).toBeGreaterThan(5);
    expect(bombPayload.bossDamageRatio).toBeGreaterThan(0.05);
    expect(bombPayload.effectRadius).toBeGreaterThan(120);
  });

  it('applies first expansion sector, route, shop, and reward hooks', () => {
    const sectorPayload = applyItemHooks(
      'onSectorStart',
      [
        { itemId: 'item_crater_shadow_lens', acquisitionOrder: 0 },
        { itemId: 'item_surface_beacon_drone', acquisitionOrder: 1 },
        { itemId: 'item_exit_toll_transponder', acquisitionOrder: 2 }
      ],
      {
        sectorIndex: 2,
        sectorId: 'sector_lunar_surface',
        creditsBonus: 0,
        salvageBonus: 0,
        specialChargeBonus: 0,
        fireRateMultiplier: 1
      }
    );
    const routePayload = applyItemHooks(
      'onRouteChosen',
      [
        { itemId: 'item_curse_interest_bond', acquisitionOrder: 0 },
        { itemId: 'item_route_ledger_spool', acquisitionOrder: 1 }
      ],
      {
        routeKind: 'vault',
        sectorIndex: 3,
        creditsDelta: 0,
        salvageDelta: 0,
        hullPatchDelta: 0,
        curseDelta: 0,
        relicDelta: 0,
        rewardChoiceBonus: 0,
        rewardCreditBonus: 0,
        rewardBiasTags: [],
        rewardPoolIdOverride: null,
        shopDiscount: 0,
        shopStockBonus: 0,
        shopBiasTags: []
      }
    );
    const shopPayload = applyItemHooks(
      'onShopEntered',
      [
        { itemId: 'item_coupon_cascade_fuse', acquisitionOrder: 0 },
        { itemId: 'item_convoy_receipt_printer', acquisitionOrder: 1 }
      ],
      {
        sectorIndex: 2,
        rerollCount: 1,
        itemCount: 4,
        priceDiscount: 0,
        biasTags: []
      }
    );
    const rewardPayload = applyItemHooks(
      'onRewardGenerated',
      [
        { itemId: 'item_relic_ash_compass', acquisitionOrder: 0 },
        { itemId: 'item_mining_laser_transit', acquisitionOrder: 1 }
      ],
      {
        routeKind: 'vault',
        sectorIndex: 3,
        poolId: 'vault',
        choiceCount: 4,
        biasTags: []
      }
    );

    expect(sectorPayload.creditsBonus).toBe(2);
    expect(sectorPayload.salvageBonus).toBe(1);
    expect(sectorPayload.specialChargeBonus).toBeGreaterThan(0.1);
    expect(routePayload.salvageDelta).toBe(2);
    expect(routePayload.curseDelta).toBe(1);
    expect(routePayload.rewardChoiceBonus).toBe(1);
    expect(routePayload.rewardCreditBonus).toBe(1);
    expect(shopPayload.itemCount).toBe(5);
    expect(shopPayload.priceDiscount).toBe(1);
    expect(shopPayload.biasTags).toContain('drone');
    expect(rewardPayload.choiceCount).toBe(5);
    expect(rewardPayload.biasTags).toEqual(['relic', 'phase', 'laser', 'plasma']);
  });

  it('applies first expansion boss phase pressure hooks', () => {
    const payload = applyItemHooks(
      'onBossPhaseChanged',
      [
        { itemId: 'item_oathbound_deflector', acquisitionOrder: 0 },
        { itemId: 'item_phase_breaker_subpoena', acquisitionOrder: 1 },
        { itemId: 'item_warning_siren_lattice', acquisitionOrder: 2 },
        { itemId: 'item_capital_wound_ledger', acquisitionOrder: 3 },
        { itemId: 'item_telegraph_rewrite_quill', acquisitionOrder: 4 }
      ],
      {
        bossId: 'boss_auditor_drone_xl',
        previousPhaseIndex: 1,
        phaseIndex: 2,
        phaseLabel: 'Breach',
        attackCooldownSeconds: 1,
        telegraphSeconds: 0.8,
        specialChargeGain: 0,
        clearEnemyProjectiles: false
      }
    );

    expect(payload.attackCooldownSeconds).toBeGreaterThan(1.3);
    expect(payload.telegraphSeconds).toBeGreaterThan(1);
    expect(payload.specialChargeGain).toBeGreaterThan(0.35);
    expect(payload.clearEnemyProjectiles).toBe(true);
  });
});
