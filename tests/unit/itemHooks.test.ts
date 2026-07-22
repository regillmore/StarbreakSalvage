import { describe, expect, it } from 'vitest';

import {
  applyItemHooks,
  applyItemHooksWithReport,
  getItemVolleyCadenceProfile,
  getOrderedItemInstances,
  getPrototypeVentCircuitConditionProfile
} from '../../src/game/ItemHooks';
import type { ItemInstance } from '../../src/game/Rewards';
import { getArcChargeProfile } from '../../src/game/ArcCharge';

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
        blastDamage: 0
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
      hasteFillSeconds: 0,
      hasteSourceIds: [],
      effectRadius: 34
    });

    expect(payload).toEqual({
      projectileTags: ['phase'],
      specialChargeGain: 0.1,
      bonusSalvage: 0,
      hasteFillSeconds: 0,
      hasteSourceIds: [],
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
    const spawned = firePayload.projectiles.map(
      (projectile) => applyItemHooks('onProjectileSpawn', instances, { projectile }).projectile
    );

    expect(firePayload.projectiles).toHaveLength(3);
    expect(firePayload.projectiles.some((projectile) => projectile.tags.includes('split'))).toBe(
      true
    );
    expect(spawned.every((projectile) => projectile.arcChargeKind === 'standard')).toBe(true);
    expect(spawned.every((projectile) => getArcChargeProfile(projectile)?.range === 180)).toBe(
      true
    );
  });

  it('lets Boreline Crimper reshape only the off-axis shots already built upstream', () => {
    const splitThenCrimp: ItemInstance[] = [
      { itemId: 'item_split_prism', acquisitionOrder: 0 },
      { itemId: 'item_boreline_crimper', acquisitionOrder: 1 }
    ];
    const crimpThenSplit: ItemInstance[] = [
      { itemId: 'item_boreline_crimper', acquisitionOrder: 0 },
      { itemId: 'item_split_prism', acquisitionOrder: 1 }
    ];

    const compressed = applyItemHooks('onFire', splitThenCrimp, {
      volleyIndex: 1,
      projectiles: [baseProjectile]
    });
    const uncompressed = applyItemHooks('onFire', crimpThenSplit, {
      volleyIndex: 1,
      projectiles: [baseProjectile]
    });
    const compressedSides = compressed.projectiles.filter((projectile) => projectile.vx !== 0);
    const uncompressedSides = uncompressed.projectiles.filter((projectile) => projectile.vx !== 0);

    expect(compressedSides).toHaveLength(2);
    expect(compressedSides.map((projectile) => Math.abs(projectile.vx))).toEqual([64.96, 64.96]);
    expect(compressedSides.map((projectile) => projectile.vy)).toEqual([
      expect.closeTo(-784),
      expect.closeTo(-784)
    ]);
    expect(compressedSides.every((projectile) => projectile.damage > 0.73)).toBe(true);
    expect(compressedSides.every((projectile) => projectile.tags.includes('overkill'))).toBe(true);
    expect(uncompressedSides.map((projectile) => Math.abs(projectile.vx))).toEqual([112, 112]);
    expect(uncompressedSides.every((projectile) => projectile.damage === 0.62)).toBe(true);
    expect(uncompressedSides.every((projectile) => !projectile.tags.includes('overkill'))).toBe(
      true
    );
  });

  it('lets Gangue Compression Die compact only lighter shots already built upstream', () => {
    const splitThenCompress: ItemInstance[] = [
      { itemId: 'item_split_prism', acquisitionOrder: 0 },
      { itemId: 'item_gangue_compression_die', acquisitionOrder: 1 }
    ];
    const compressThenSplit: ItemInstance[] = [
      { itemId: 'item_gangue_compression_die', acquisitionOrder: 0 },
      { itemId: 'item_split_prism', acquisitionOrder: 1 }
    ];

    const compressed = applyItemHooks('onFire', splitThenCompress, {
      volleyIndex: 1,
      projectiles: [baseProjectile]
    });
    const uncompressed = applyItemHooks('onFire', compressThenSplit, {
      volleyIndex: 1,
      projectiles: [baseProjectile]
    });
    const compactedBranches = compressed.projectiles.filter((projectile) =>
      projectile.tags.includes('plasma')
    );
    const laterBranches = uncompressed.projectiles.filter((projectile) => projectile.vx !== 0);

    expect(compactedBranches).toHaveLength(2);
    expect(compactedBranches.map((projectile) => Math.abs(projectile.vx))).toEqual([100.8, 100.8]);
    expect(compactedBranches.map((projectile) => projectile.vy)).toEqual([
      expect.closeTo(-630),
      expect.closeTo(-630)
    ]);
    expect(compactedBranches.every((projectile) => projectile.damage > 0.8)).toBe(true);
    expect(compactedBranches.every((projectile) => projectile.radius > 4)).toBe(true);
    expect(compactedBranches.every((projectile) => projectile.ttl > baseProjectile.ttl)).toBe(true);
    expect(laterBranches.every((projectile) => projectile.damage === 0.62)).toBe(true);
    expect(laterBranches.every((projectile) => !projectile.tags.includes('plasma'))).toBe(true);
  });

  it('lets Forkline Dynamo charge only the outer branches already built upstream', () => {
    const splitThenCharge: ItemInstance[] = [
      { itemId: 'item_split_prism', acquisitionOrder: 0 },
      { itemId: 'item_forkline_dynamo', acquisitionOrder: 1 }
    ];
    const chargeThenSplit: ItemInstance[] = [
      { itemId: 'item_forkline_dynamo', acquisitionOrder: 0 },
      { itemId: 'item_split_prism', acquisitionOrder: 1 }
    ];

    const charged = applyItemHooks('onFire', splitThenCharge, {
      volleyIndex: 1,
      projectiles: [baseProjectile]
    });
    const uncharged = applyItemHooks('onFire', chargeThenSplit, {
      volleyIndex: 1,
      projectiles: [baseProjectile]
    });
    const chargedBranches = charged.projectiles.filter(
      (projectile) => projectile.arcChargeKind === 'standard'
    );

    expect(charged.projectiles).toHaveLength(3);
    expect(chargedBranches).toHaveLength(2);
    expect(chargedBranches.map((projectile) => projectile.vx)).toEqual([-112, 112]);
    expect(chargedBranches.every((projectile) => projectile.tags.includes('arc'))).toBe(true);
    expect(charged.projectiles.find((projectile) => projectile.vx === 0)?.arcChargeKind).toBe(
      undefined
    );
    expect(uncharged.projectiles).toHaveLength(3);
    expect(uncharged.projectiles.every((projectile) => !projectile.tags.includes('arc'))).toBe(
      true
    );
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

  it('lets Rebound Freight Seal amplify only ricochets prepared earlier in the chain', () => {
    const coupledThenSealed: ItemInstance[] = [
      { itemId: 'item_ricochet_branch_coupler', acquisitionOrder: 0 },
      { itemId: 'item_rebound_freight_seal', acquisitionOrder: 1 }
    ];
    const sealedThenCoupled: ItemInstance[] = [
      { itemId: 'item_rebound_freight_seal', acquisitionOrder: 0 },
      { itemId: 'item_ricochet_branch_coupler', acquisitionOrder: 1 }
    ];
    const branch = { ...baseProjectile, tags: ['laser', 'split'] as const };
    const amplified = applyItemHooks('onProjectileSpawn', coupledThenSealed, {
      projectile: branch
    }).projectile;
    const missed = applyItemHooks('onProjectileSpawn', sealedThenCoupled, {
      projectile: branch
    }).projectile;

    expect(amplified.ricochetBounces).toBe(1);
    expect(amplified.damage).toBeCloseTo(1.14);
    expect(amplified.radius).toBeCloseTo(4.5);
    expect(amplified.tags).toEqual(expect.arrayContaining(['ricochet', 'overkill']));
    expect(missed.ricochetBounces).toBe(1);
    expect(missed.damage).toBe(1);
    expect(missed.tags).toContain('ricochet');
    expect(missed.tags).not.toContain('overkill');
  });

  it('lets Strata-Bore Collimator focus only plasma prepared earlier in the chain', () => {
    const plasmaThenCollimator: ItemInstance[] = [
      { itemId: 'item_plasma_seed_crucible', acquisitionOrder: 0 },
      { itemId: 'item_strata_bore_collimator', acquisitionOrder: 1 }
    ];
    const collimatorThenPlasma: ItemInstance[] = [
      { itemId: 'item_strata_bore_collimator', acquisitionOrder: 0 },
      { itemId: 'item_plasma_seed_crucible', acquisitionOrder: 1 }
    ];
    const chargedShot = { ...baseProjectile, tags: ['laser', 'arc'] as const };
    const focused = applyItemHooks('onProjectileSpawn', plasmaThenCollimator, {
      projectile: chargedShot
    }).projectile;
    const latePlasma = applyItemHooks('onProjectileSpawn', collimatorThenPlasma, {
      projectile: chargedShot
    }).projectile;

    expect(focused.tags).toEqual(expect.arrayContaining(['arc', 'plasma', 'heat', 'laser']));
    expect(focused.damage).toBeCloseTo(baseProjectile.damage * 1.16 * 1.18);
    expect(focused.vy).toBeCloseTo(baseProjectile.vy * 1.12);
    expect(focused.laserKind).toBe('beam');
    expect(latePlasma.damage).toBeCloseTo(baseProjectile.damage * 1.16);
    expect(latePlasma.laserKind).toBeUndefined();
  });

  it('lets Claimant Arc Seal charge only overkill prepared earlier in the chain', () => {
    const claimed: ItemInstance[] = [
      { itemId: 'item_ricochet_branch_coupler', acquisitionOrder: 0 },
      { itemId: 'item_rebound_freight_seal', acquisitionOrder: 1 },
      { itemId: 'item_claimant_arc_seal', acquisitionOrder: 2 }
    ];
    const lateOverkill: ItemInstance[] = [
      { itemId: 'item_ricochet_branch_coupler', acquisitionOrder: 0 },
      { itemId: 'item_claimant_arc_seal', acquisitionOrder: 1 },
      { itemId: 'item_rebound_freight_seal', acquisitionOrder: 2 }
    ];
    const branch = { ...baseProjectile, tags: ['laser', 'split'] as const };
    const charged = applyItemHooks('onProjectileSpawn', claimed, {
      projectile: branch
    }).projectile;
    const missed = applyItemHooks('onProjectileSpawn', lateOverkill, {
      projectile: branch
    }).projectile;

    expect(charged.tags).toEqual(expect.arrayContaining(['ricochet', 'overkill', 'arc']));
    expect(charged.arcChargeKind).toBe('standard');
    expect(missed.tags).toEqual(expect.arrayContaining(['ricochet', 'overkill']));
    expect(missed.tags).not.toContain('arc');
    expect(missed.arcChargeKind).toBeUndefined();
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

  it('vents only earlier periodic stages one volley later and adds one heat shot per cycle', () => {
    const vented: ItemInstance[] = [
      {
        itemId: 'item_phase_grazer',
        acquisitionOrder: 0,
        socket: { componentId: 'a', socketIndex: 0, circuitOrder: 0 }
      },
      {
        itemId: 'item_prototype_vent_script',
        acquisitionOrder: 1,
        socket: { componentId: 'a', socketIndex: 1, circuitOrder: 1 }
      }
    ];
    const ventFirst = vented.map((instance, index) => ({
      ...instance,
      socket: { ...instance.socket!, circuitOrder: 1 - index }
    }));

    expect(getItemVolleyCadenceProfile('item_phase_grazer', vented)).toEqual({
      baseCadence: 4,
      effectiveCadence: 5,
      prototypeVented: true
    });
    expect(getItemVolleyCadenceProfile('item_phase_grazer', ventFirst)).toEqual({
      baseCadence: 4,
      effectiveCadence: 4,
      prototypeVented: false
    });
    expect(getPrototypeVentCircuitConditionProfile(vented)).toEqual({
      earlierPeriodicStageCount: 1,
      conditionMet: true
    });
    expect(getPrototypeVentCircuitConditionProfile(ventFirst)).toEqual({
      earlierPeriodicStageCount: 0,
      conditionMet: false
    });

    const delayedOldCycle = applyItemHooks('onFire', vented, {
      volleyIndex: 4,
      projectiles: [baseProjectile]
    });
    const ventedCycle = applyItemHooks('onFire', vented, {
      volleyIndex: 5,
      projectiles: [baseProjectile],
      storedWeaponHeat: 0.8,
      heatShotCost: 0.4,
      weaponHeatSpent: 0,
      heatShotEvents: []
    });
    const unaffectedLaterStage = applyItemHooks('onFire', ventFirst, {
      volleyIndex: 4,
      projectiles: [baseProjectile]
    });

    expect(delayedOldCycle.projectiles).toEqual([baseProjectile]);
    expect(ventedCycle.projectiles).toHaveLength(2);
    expect(ventedCycle.projectiles.filter((shot) => shot.visualKind === 'heatShot')).toEqual([
      expect.objectContaining({
        damage: 1.65,
        radius: 6,
        tags: expect.arrayContaining(['heat', 'plasma'])
      })
    ]);
    expect(ventedCycle.weaponHeatSpent).toBe(0.4);
    expect(ventedCycle.heatShotEvents).toEqual([
      expect.objectContaining({ outcome: 'fired', heatBefore: 0.8, heatAfter: 0.4 })
    ]);
    expect(ventedCycle.projectiles.some((shot) => shot.tags.includes('phase'))).toBe(true);
    expect(unaffectedLaterStage.projectiles).toHaveLength(1);
    expect(unaffectedLaterStage.projectiles[0]?.tags).toContain('phase');
    expect(unaffectedLaterStage.projectiles[0]?.tags).not.toContain('heat');
  });

  it('replaces an underfunded heat shot with exhaust and never double-spends one reserve', () => {
    const instances: ItemInstance[] = [
      {
        itemId: 'item_phase_grazer',
        acquisitionOrder: 0,
        socket: { componentId: 'a', socketIndex: 0, circuitOrder: 0 }
      },
      {
        itemId: 'item_missile_splinter_warrant',
        acquisitionOrder: 1,
        socket: { componentId: 'a', socketIndex: 1, circuitOrder: 1 }
      },
      {
        itemId: 'item_prototype_vent_script',
        acquisitionOrder: 2,
        socket: { componentId: 'a', socketIndex: 2, circuitOrder: 2 }
      }
    ];
    const payload = applyItemHooks('onFire', instances, {
      volleyIndex: 5,
      projectiles: [baseProjectile],
      storedWeaponHeat: 0.6,
      heatShotCost: 0.4,
      weaponHeatSpent: 0,
      heatShotEvents: []
    });

    expect(payload.weaponHeatSpent).toBe(0.4);
    expect(payload.projectiles.filter((shot) => shot.visualKind === 'heatShot')).toHaveLength(1);
    expect(payload.heatShotEvents?.map((event) => event.outcome)).toEqual(['fired', 'exhausted']);
    expect(payload.heatShotEvents?.[1]?.heatBefore).toBeCloseTo(0.2);
    expect(payload.heatShotEvents?.[1]?.heatAfter).toBeCloseTo(0.2);
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
      blastDamage: 0
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

  it('deploys the uplink pair without an undocumented mirror prerequisite', () => {
    const instances: ItemInstance[] = [{ itemId: 'item_drone_uplink', acquisitionOrder: 0 }];
    const payload = applyItemHooks('onFire', instances, {
      volleyIndex: 3,
      projectiles: [baseProjectile]
    });

    expect(payload.projectiles).toHaveLength(3);
    expect(
      payload.projectiles.filter((projectile) => projectile.tags.includes('drone'))
    ).toHaveLength(2);
    expect(
      payload.projectiles
        .filter((projectile) => projectile.tags.includes('drone'))
        .every((projectile) => projectile.droneSourceId === 'item_drone_uplink')
    ).toBe(true);
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
      blastDamage: 0
    });

    expect(payload.bonusSalvage).toBe(4);
    expect(payload.blastDamage).toBeGreaterThan(0);
  });

  it('pays Scrap Saints only when the consuming projectile was drone-fired', () => {
    const instances: ItemInstance[] = [
      { itemId: 'item_drone_uplink', acquisitionOrder: 0 },
      { itemId: 'item_scrap_saints_relay', acquisitionOrder: 1 }
    ];
    const resolve = (projectileTags: readonly ('laser' | 'drone')[]) =>
      applyItemHooks('onEnemyKilled', instances, {
        projectileTags,
        overkillDamage: 0,
        bonusSalvage: 0,
        blastDamage: 0
      });

    expect(resolve(['laser']).bonusSalvage).toBe(0);
    expect(resolve(['laser', 'drone']).bonusSalvage).toBe(1);
  });

  it('applies expanded pickup and curse revenge hooks', () => {
    const pickupInstances: ItemInstance[] = [
      { itemId: 'item_credit_reroute_fuse', acquisitionOrder: 0 },
      { itemId: 'item_magnetized_tithe_box', acquisitionOrder: 1 }
    ];
    const creditPayload = applyItemHooks('onPickupCollected', pickupInstances, {
      kind: 'credit',
      hasteFillSeconds: 0,
      hasteSourceIds: []
    });

    const revengeInstances: ItemInstance[] = [
      { itemId: 'item_cursed_hull_plate', acquisitionOrder: 0 },
      { itemId: 'item_curse_eater_gasket', acquisitionOrder: 1 }
    ];
    const hitPayload = applyItemHooks('onPlayerHit', revengeInstances, {
      damage: 2,
      revengeProjectiles: []
    });

    expect(creditPayload.hasteFillSeconds).toBeCloseTo(1.15);
    expect(creditPayload.hasteSourceIds).toEqual([
      'item_credit_reroute_fuse',
      'item_magnetized_tithe_box'
    ]);
    expect(hitPayload.revengeProjectiles.length).toBeGreaterThanOrEqual(2);
    expect(
      hitPayload.revengeProjectiles.some((projectile) => projectile.tags.includes('relic'))
    ).toBe(true);
  });

  it('does not double-fill haste from duplicate copies of one unique source', () => {
    const payload = applyItemHooks(
      'onPickupCollected',
      [
        { itemId: 'item_coin_operated_cannon', acquisitionOrder: 0 },
        { itemId: 'item_coin_operated_cannon', acquisitionOrder: 1 }
      ],
      {
        kind: 'credit',
        hasteFillSeconds: 0,
        hasteSourceIds: []
      }
    );

    expect(payload.hasteFillSeconds).toBeCloseTo(0.8);
    expect(payload.hasteSourceIds).toEqual(['item_coin_operated_cannon']);
  });

  it('fills Coastdown haste from either kind of collected currency', () => {
    const instances: ItemInstance[] = [{ itemId: 'item_coastdown_capacitor', acquisitionOrder: 0 }];
    const collect = (kind: 'credit' | 'salvage') =>
      applyItemHooks('onPickupCollected', instances, {
        kind,
        hasteFillSeconds: 0,
        hasteSourceIds: []
      });

    expect(collect('credit')).toMatchObject({
      hasteFillSeconds: 0.55,
      hasteSourceIds: ['item_coastdown_capacitor']
    });
    expect(collect('salvage')).toMatchObject({
      hasteFillSeconds: 0.55,
      hasteSourceIds: ['item_coastdown_capacitor']
    });
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

  it('applies first expansion graze and bomb hooks without the retired vent special', () => {
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
        hasteFillSeconds: 0,
        hasteSourceIds: [],
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
    expect(grazePayload.hasteFillSeconds).toBeGreaterThan(0);
    expect(grazePayload.hasteSourceIds).toEqual(['item_phase_wake_suture']);
    expect(grazePayload.effectRadius).toBeGreaterThan(34);
    expect(specialPayload).toEqual({
      projectiles: [baseProjectile],
      activeSeconds: 1,
      cooldownSeconds: 2,
      fireRateMultiplier: 1
    });
    expect(bombPayload.damage).toBeGreaterThan(5);
    expect(bombPayload.bossDamageRatio).toBeGreaterThan(0.05);
    expect(bombPayload.effectRadius).toBeGreaterThan(120);
  });

  it('applies first expansion sector, route, shop, and reward hooks', () => {
    const sectorPayload = applyItemHooks(
      'onSectorStart',
      [
        { itemId: 'item_crater_shadow_lens', acquisitionOrder: 0 },
        { itemId: 'item_surface_beacon_drone', acquisitionOrder: 1 }
      ],
      {
        sectorIndex: 2,
        sectorId: 'sector_lunar_surface',
        creditsBonus: 0,
        salvageBonus: 0,
        specialChargeBonus: 0
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

    expect(sectorPayload.creditsBonus).toBe(0);
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

  it('preserves the retired Exit Toll hook for restored run snapshots', () => {
    const payload = applyItemHooks(
      'onSectorStart',
      [{ itemId: 'item_exit_toll_transponder', acquisitionOrder: 0 }],
      {
        sectorIndex: 4,
        sectorId: 'sector_core_wreck',
        creditsBonus: 0,
        salvageBonus: 0,
        specialChargeBonus: 0
      }
    );

    expect(payload.creditsBonus).toBe(3);
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

  it('builds the five replacement weapon upgrades into bounded circuit chains', () => {
    const firePayload = applyItemHooks(
      'onFire',
      [
        { itemId: 'item_split_prism', acquisitionOrder: 0 },
        { itemId: 'item_harmonic_fork_loom', acquisitionOrder: 1 },
        { itemId: 'item_warhead_echo_chamber', acquisitionOrder: 2 }
      ],
      {
        volleyIndex: 12,
        projectiles: [baseProjectile]
      }
    );
    const spawnPayload = applyItemHooks(
      'onProjectileSpawn',
      [
        { itemId: 'item_chain_arc_capacitor', acquisitionOrder: 0 },
        { itemId: 'item_plasma_seed_crucible', acquisitionOrder: 1 },
        { itemId: 'item_ricochet_branch_coupler', acquisitionOrder: 2 }
      ],
      {
        projectile: {
          ...baseProjectile,
          tags: ['laser', 'split']
        }
      }
    );
    const crossfeedSpawn = applyItemHooks(
      'onProjectileSpawn',
      [{ itemId: 'item_crossfeed_detonator', acquisitionOrder: 0 }],
      {
        projectile: {
          ...baseProjectile,
          tags: ['arc', 'missile']
        }
      }
    );
    const killPayload = applyItemHooks(
      'onEnemyKilled',
      [{ itemId: 'item_crossfeed_detonator', acquisitionOrder: 0 }],
      {
        projectileTags: ['arc', 'missile'],
        overkillDamage: 0,
        bonusSalvage: 0,
        blastDamage: 0
      }
    );

    expect(firePayload.projectiles).toHaveLength(6);
    expect(firePayload.projectiles.filter((shot) => shot.tags.includes('split')).length).toBe(4);
    expect(firePayload.projectiles.some((shot) => shot.tags.includes('overkill'))).toBe(true);
    expect(spawnPayload.projectile.tags).toEqual(
      expect.arrayContaining(['arc', 'plasma', 'heat', 'ricochet'])
    );
    expect(spawnPayload.projectile.damage).toBeGreaterThan(1);
    expect(spawnPayload.projectile.ricochetBounces).toBe(1);
    expect(crossfeedSpawn.projectile.arcChargeKind).toBe('heavy');
    expect(killPayload.blastDamage).toBe(0.55);
  });

  it('makes Plasma Seed Crucible depend on an earlier projectile trait', () => {
    const chainThenCrucible: ItemInstance[] = [
      {
        itemId: 'item_chain_arc_capacitor',
        acquisitionOrder: 0,
        socket: { componentId: 'a', socketIndex: 0, circuitOrder: 0 }
      },
      {
        itemId: 'item_plasma_seed_crucible',
        acquisitionOrder: 1,
        socket: { componentId: 'a', socketIndex: 1, circuitOrder: 1 }
      }
    ];
    const crucibleThenChain = chainThenCrucible.map((item, index) => ({
      ...item,
      socket: { ...item.socket!, circuitOrder: index === 0 ? 1 : 0 }
    }));
    const first = applyItemHooks('onProjectileSpawn', chainThenCrucible, {
      projectile: baseProjectile
    });
    const second = applyItemHooks('onProjectileSpawn', crucibleThenChain, {
      projectile: baseProjectile
    });

    expect(first.projectile.tags).toEqual(expect.arrayContaining(['arc', 'plasma', 'heat']));
    expect(first.projectile.damage).toBeGreaterThan(second.projectile.damage);
    expect(second.projectile.tags).toContain('arc');
    expect(second.projectile.tags).not.toContain('heat');
  });

  it('lets Faraday Phase Shunt preserve an earlier arc charge through one hit', () => {
    const chargedThenShunted: ItemInstance[] = [
      {
        itemId: 'item_chain_arc_capacitor',
        acquisitionOrder: 0,
        socket: { componentId: 'a', socketIndex: 0, circuitOrder: 0 }
      },
      {
        itemId: 'item_faraday_phase_shunt',
        acquisitionOrder: 1,
        socket: { componentId: 'a', socketIndex: 1, circuitOrder: 1 }
      }
    ];
    const shuntedThenCharged = chargedThenShunted.map((item, index) => ({
      ...item,
      socket: { ...item.socket!, circuitOrder: index === 0 ? 1 : 0 }
    }));
    const first = applyItemHooks('onProjectileSpawn', chargedThenShunted, {
      projectile: baseProjectile
    });
    const second = applyItemHooks('onProjectileSpawn', shuntedThenCharged, {
      projectile: baseProjectile
    });

    expect(first.projectile.tags).toEqual(expect.arrayContaining(['arc', 'phase']));
    expect(first.projectile.arcChargeKind).toBe('standard');
    expect(second.projectile.tags).toContain('arc');
    expect(second.projectile.tags).not.toContain('phase');
  });
});
