import {
  getItemById,
  type ItemId,
  type ItemTag,
  type RewardPoolDefinition
} from '../content/items';
import { getItemNames, type ItemInstance, type RewardContextKind } from './Rewards';
import type { BossId } from '../content/bosses';
import type {
  EnvironmentObjectDamageSource,
  EnvironmentObjectFamily,
  EnvironmentObjectId,
  EnvironmentObjectKind
} from '../content/environmentObjects';
import type { RouteKind } from './Generation';
import type { ProjectileVisualKind } from './HeatShot';
import type { LaserProjectileKind } from './LaserProjectile';
import { getHasteSourceDefinition, type HasteTriggerKind } from './HasteReservoir';
import { attachArcCharge, getArcChargeProfile, type ArcChargeKind } from './ArcCharge';

export interface ProjectileBlueprint {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly radius: number;
  readonly damage: number;
  readonly ttl: number;
  readonly tags: readonly ItemTag[];
  readonly procDepth: number;
  readonly ricochetBounces?: number;
  readonly environmentDamageSource?: EnvironmentObjectDamageSource;
  readonly visualKind?: ProjectileVisualKind;
  readonly laserKind?: LaserProjectileKind;
  readonly arcChargeKind?: ArcChargeKind;
  readonly droneSourceId?: string;
}

export interface HeatShotEvent {
  readonly sourceItemId: ItemId;
  readonly outcome: 'fired' | 'exhausted';
  readonly heatCost: number;
  readonly heatBefore: number;
  readonly heatAfter: number;
}

export interface FirePayload {
  readonly volleyIndex: number;
  readonly projectiles: readonly ProjectileBlueprint[];
  readonly storedWeaponHeat?: number;
  readonly heatShotCost?: number;
  readonly weaponHeatSpent?: number;
  readonly heatShotEvents?: readonly HeatShotEvent[];
}

export interface EnemyKilledPayload {
  readonly projectileTags: readonly ItemTag[];
  readonly overkillDamage: number;
  readonly bonusSalvage: number;
  readonly blastDamage: number;
}

export interface ProjectileSpawnPayload {
  readonly projectile: ProjectileBlueprint;
}

export interface PlayerHitPayload {
  readonly damage: number;
  readonly revengeProjectiles: readonly ProjectileBlueprint[];
}

export interface PickupCollectedPayload {
  readonly kind: 'credit' | 'salvage';
  readonly hasteFillSeconds: number;
  readonly hasteSourceIds: readonly ItemId[];
}

export interface GrazePayload {
  readonly projectileTags: readonly ItemTag[];
  readonly specialChargeGain: number;
  readonly bonusSalvage: number;
  readonly hasteFillSeconds: number;
  readonly hasteSourceIds: readonly ItemId[];
  readonly effectRadius: number;
}

export interface SpecialUsedPayload {
  readonly projectiles: readonly ProjectileBlueprint[];
  readonly activeSeconds: number;
  readonly cooldownSeconds: number;
  readonly fireRateMultiplier: number;
}

export interface BombUsedPayload {
  readonly damage: number;
  readonly bossDamageRatio: number;
  readonly invulnerabilitySeconds: number;
  readonly cooldownSeconds: number;
  readonly effectRadius: number;
  readonly cancelledProjectiles: number;
}

export interface EnvironmentObjectDestroyedPayload {
  readonly definitionId: EnvironmentObjectId;
  readonly family: EnvironmentObjectFamily;
  readonly kind: EnvironmentObjectKind;
  readonly source: EnvironmentObjectDamageSource;
  readonly rewardCredits: number;
  readonly rewardSalvage: number;
  readonly bonusSalvage: number;
  readonly chainDamage: number;
  readonly effectRadius: number;
}

export interface SectorStartPayload {
  readonly sectorIndex: number;
  readonly sectorId: string;
  readonly creditsBonus: number;
  readonly salvageBonus: number;
  readonly specialChargeBonus: number;
}

export interface RouteChosenPayload {
  readonly routeKind: RouteKind;
  readonly sectorIndex: number;
  readonly creditsDelta: number;
  readonly salvageDelta: number;
  readonly hullPatchDelta: number;
  readonly curseDelta: number;
  readonly relicDelta: number;
  readonly rewardChoiceBonus: number;
  readonly rewardCreditBonus: number;
  readonly rewardBiasTags: readonly ItemTag[];
  readonly rewardPoolIdOverride: RewardPoolDefinition['id'] | null;
  readonly shopDiscount: number;
  readonly shopBiasTags: readonly ItemTag[];
}

export interface ShopEnteredPayload {
  readonly sectorIndex: number;
  readonly rerollCount: number;
  readonly itemCount: number;
  readonly priceDiscount: number;
  readonly biasTags: readonly string[];
}

export interface RewardGeneratedPayload {
  readonly routeKind: RewardContextKind;
  readonly sectorIndex: number;
  readonly poolId: RewardPoolDefinition['id'];
  readonly choiceCount: number;
  readonly biasTags: readonly string[];
}

export interface BossPhaseChangedPayload {
  readonly bossId: BossId;
  readonly previousPhaseIndex: number;
  readonly phaseIndex: number;
  readonly phaseLabel: string;
  readonly attackCooldownSeconds: number;
  readonly telegraphSeconds: number;
  readonly specialChargeGain: number;
  readonly clearEnemyProjectiles: boolean;
}

export type ItemHookPayloadByName = {
  readonly onFire: FirePayload;
  readonly onProjectileSpawn: ProjectileSpawnPayload;
  readonly onEnemyKilled: EnemyKilledPayload;
  readonly onPlayerHit: PlayerHitPayload;
  readonly onPickupCollected: PickupCollectedPayload;
  readonly onGraze: GrazePayload;
  readonly onSpecialUsed: SpecialUsedPayload;
  readonly onBombUsed: BombUsedPayload;
  readonly onSectorStart: SectorStartPayload;
  readonly onRouteChosen: RouteChosenPayload;
  readonly onShopEntered: ShopEnteredPayload;
  readonly onRewardGenerated: RewardGeneratedPayload;
  readonly onBossPhaseChanged: BossPhaseChangedPayload;
  readonly onEnvironmentObjectDestroyed: EnvironmentObjectDestroyedPayload;
};

export type ItemHookName = keyof ItemHookPayloadByName;

export const DEFAULT_ITEM_HOOK_APPLICATION_LIMIT = 48;

const PERIODIC_VOLLEY_CADENCES = {
  item_shield_dynamo: 4,
  item_reactive_plating_grid: 3,
  item_shield_revenge_contract: 6,
  item_drone_uplink: 3,
  item_phase_grazer: 4,
  item_signal_clone_stamp: 3,
  item_missile_splinter_warrant: 4,
  item_overheat_oracle: 5,
  item_arc_welder_drone: 3,
  item_lane_splitter_chisel: 6,
  item_wake_missile_abacus: 5,
  item_sidecar_drone_bay: 4,
  item_harmonic_fork_loom: 3,
  item_warhead_echo_chamber: 4,
  item_funeral_refrain_array: 5,
  item_empty_throne_coronation: 4,
  item_passenger_coffer_manifest: 3
} as const satisfies Partial<Record<ItemId, number>>;

export interface ItemVolleyCadenceProfile {
  readonly baseCadence: number;
  readonly effectiveCadence: number;
  readonly prototypeVented: boolean;
}

export interface PrototypeVentCircuitConditionProfile {
  readonly earlierPeriodicStageCount: number;
  readonly conditionMet: boolean;
}

export interface ItemHookDispatchOptions {
  readonly maxApplications?: number;
}

export interface ItemHookDispatchReport<THook extends ItemHookName> {
  readonly payload: ItemHookPayloadByName[THook];
  readonly appliedItemIds: readonly ItemId[];
  readonly skippedItemIds: readonly ItemId[];
  readonly maxApplications: number;
}

export const ITEM_HOOK_IMPLEMENTATIONS: Readonly<Record<ItemHookName, readonly ItemId[]>> = {
  onFire: [
    'item_split_prism',
    'item_boreline_crimper',
    'item_gangue_compression_die',
    'item_penumbra_crown_aperture',
    'item_parallax_echo_lattice',
    'item_forkline_dynamo',
    'item_ashwake_reliquary',
    'item_shield_dynamo',
    'item_reactive_plating_grid',
    'item_shield_revenge_contract',
    'item_revenge_beam',
    'item_oathbound_deflector',
    'item_cursed_hull_plate',
    'item_drone_uplink',
    'item_heat_sink_saint',
    'item_phase_grazer',
    'item_mirror_turret',
    'item_missile_splinter_warrant',
    'item_overheat_oracle',
    'item_arc_welder_drone',
    'item_lane_splitter_chisel',
    'item_wake_missile_abacus',
    'item_sidecar_drone_bay',
    'item_signal_clone_stamp',
    'item_harmonic_fork_loom',
    'item_warhead_echo_chamber',
    'item_funeral_refrain_array',
    'item_empty_throne_coronation',
    'item_exodus_rail_switch',
    'item_passenger_coffer_manifest',
    'item_prototype_vent_script'
  ],
  onProjectileSpawn: [
    'item_chain_arc_capacitor',
    'item_ricochet_license',
    'item_plasma_lens_array',
    'item_phase_anchor_spool',
    'item_plasma_bloom_filter',
    'item_mnemonic_sepulcher_key',
    'item_claimant_mantle_press',
    'item_arc_window_invoice',
    'item_heat_signature_loop',
    'item_plasma_seed_crucible',
    'item_ricochet_branch_coupler',
    'item_rebound_freight_seal',
    'item_strata_bore_collimator',
    'item_claimant_arc_seal',
    'item_crossfeed_detonator',
    'item_faraday_phase_shunt'
  ],
  onEnemyKilled: [
    'item_overkill_ledger',
    'item_bomb_refund_actuator',
    'item_vault_parasite',
    'item_laser_tax_stamp',
    'item_scrap_saints_relay',
    'item_bombardier_tithe',
    'item_relic_index_codex',
    'item_salvage_dividend_chip',
    'item_excess_warhead_clause',
    'item_boss_bounty_stamp',
    'item_crossfeed_detonator'
  ],
  onPlayerHit: ['item_curse_eater_gasket'],
  onPickupCollected: [
    'item_coin_operated_cannon',
    'item_salvage_magnet',
    'item_credit_reroute_fuse',
    'item_magnetized_tithe_box',
    'item_regolith_scoop_array',
    'item_coastdown_capacitor'
  ],
  onGraze: ['item_near_miss_tachometer', 'item_phase_wake_suture'],
  onSpecialUsed: [],
  onBombUsed: ['item_excess_warhead_clause'],
  onSectorStart: [
    'item_crater_shadow_lens',
    'item_surface_beacon_drone',
    'item_exit_toll_transponder'
  ],
  onRouteChosen: [
    'item_curse_interest_bond',
    'item_low_orbit_ore_scrip',
    'item_route_ledger_spool',
    'item_ambush_insurance_stamp'
  ],
  onShopEntered: ['item_coupon_cascade_fuse', 'item_convoy_receipt_printer'],
  onRewardGenerated: [
    'item_market_echo_locator',
    'item_relic_ash_compass',
    'item_mining_laser_transit'
  ],
  onBossPhaseChanged: [
    'item_phase_breaker_subpoena',
    'item_warning_siren_lattice',
    'item_capital_wound_ledger',
    'item_telegraph_rewrite_quill'
  ],
  onEnvironmentObjectDestroyed: ['item_salvage_dividend_chip']
};

export function applyItemHooks<THook extends ItemHookName>(
  hook: THook,
  instances: readonly ItemInstance[],
  payload: ItemHookPayloadByName[THook]
): ItemHookPayloadByName[THook] {
  return applyItemHooksWithReport(hook, instances, payload).payload;
}

export function applyItemHooksWithReport<THook extends ItemHookName>(
  hook: THook,
  instances: readonly ItemInstance[],
  payload: ItemHookPayloadByName[THook],
  options: ItemHookDispatchOptions = {}
): ItemHookDispatchReport<THook> {
  const maxApplications = Math.max(
    0,
    Math.floor(options.maxApplications ?? DEFAULT_ITEM_HOOK_APPLICATION_LIMIT)
  );
  const appliedItemIds: ItemId[] = [];
  const skippedItemIds: ItemId[] = [];
  let currentPayload = payload;

  for (const instance of getOrderedItemInstances(instances)) {
    const item = getItemById(instance.itemId);

    if (!item.hooks.includes(hook)) {
      continue;
    }

    if (appliedItemIds.length >= maxApplications) {
      skippedItemIds.push(instance.itemId);
      continue;
    }

    currentPayload = applyItemHookInstance(hook, instance.itemId, instances, currentPayload);
    appliedItemIds.push(instance.itemId);
  }

  return {
    payload: currentPayload,
    appliedItemIds,
    skippedItemIds,
    maxApplications
  };
}

export function getOrderedItemInstances(instances: readonly ItemInstance[]): ItemInstance[] {
  return [...instances].sort(
    (a, b) =>
      (a.socket?.circuitOrder ?? 1_000_000 + a.acquisitionOrder) -
        (b.socket?.circuitOrder ?? 1_000_000 + b.acquisitionOrder) ||
      a.acquisitionOrder - b.acquisitionOrder ||
      a.itemId.localeCompare(b.itemId)
  );
}

export function getItemVolleyCadenceProfile(
  itemId: ItemId,
  instances: readonly ItemInstance[]
): ItemVolleyCadenceProfile | null {
  const baseCadence = PERIODIC_VOLLEY_CADENCES[itemId as keyof typeof PERIODIC_VOLLEY_CADENCES];
  if (!baseCadence) {
    return null;
  }

  const ordered = getOrderedItemInstances(instances);
  const itemIndex = ordered.findIndex((instance) => instance.itemId === itemId);
  const ventIndex = ordered.findIndex(
    (instance) => instance.itemId === 'item_prototype_vent_script'
  );
  const prototypeVented = itemIndex >= 0 && ventIndex > itemIndex;

  return {
    baseCadence,
    effectiveCadence: baseCadence + (prototypeVented ? 1 : 0),
    prototypeVented
  };
}

export function getPrototypeVentCircuitConditionProfile(
  instances: readonly ItemInstance[]
): PrototypeVentCircuitConditionProfile | null {
  const ordered = getOrderedItemInstances(instances);
  const ventIndex = ordered.findIndex(
    (instance) => instance.itemId === 'item_prototype_vent_script'
  );
  if (ventIndex < 0) return null;

  const earlierPeriodicStageCount = ordered
    .slice(0, ventIndex)
    .filter(
      (instance) =>
        PERIODIC_VOLLEY_CADENCES[instance.itemId as keyof typeof PERIODIC_VOLLEY_CADENCES] !==
        undefined
    ).length;

  return {
    earlierPeriodicStageCount,
    conditionMet: earlierPeriodicStageCount > 0
  };
}

export function describeItemLoadout(instances: readonly ItemInstance[]): string {
  const names = getItemNames(getOrderedItemInstances(instances));
  return names.length > 0 ? names.join(' + ') : 'No items';
}

export function hasItem(instances: readonly ItemInstance[], itemId: ItemId): boolean {
  return instances.some((instance) => instance.itemId === itemId);
}

export function applyItemHookInstance<THook extends ItemHookName>(
  hook: THook,
  itemId: ItemId,
  instances: readonly ItemInstance[],
  payload: ItemHookPayloadByName[THook]
): ItemHookPayloadByName[THook] {
  const item = getItemById(itemId);

  if (!item.hooks.includes(hook)) {
    return payload;
  }

  switch (hook) {
    case 'onFire':
      return applyOnFire(itemId, instances, payload as FirePayload) as ItemHookPayloadByName[THook];
    case 'onProjectileSpawn':
      return applyOnProjectileSpawn(
        itemId,
        payload as ProjectileSpawnPayload
      ) as ItemHookPayloadByName[THook];
    case 'onEnemyKilled':
      return applyOnEnemyKilled(
        itemId,
        instances,
        payload as EnemyKilledPayload
      ) as ItemHookPayloadByName[THook];
    case 'onPlayerHit':
      return applyOnPlayerHit(
        itemId,
        instances,
        payload as PlayerHitPayload
      ) as ItemHookPayloadByName[THook];
    case 'onPickupCollected':
      return applyOnPickupCollected(
        itemId,
        payload as PickupCollectedPayload
      ) as ItemHookPayloadByName[THook];
    case 'onGraze':
      return applyOnGraze(itemId, payload as GrazePayload) as ItemHookPayloadByName[THook];
    case 'onSpecialUsed':
      return applyOnSpecialUsed(
        itemId,
        payload as SpecialUsedPayload
      ) as ItemHookPayloadByName[THook];
    case 'onBombUsed':
      return applyOnBombUsed(itemId, payload as BombUsedPayload) as ItemHookPayloadByName[THook];
    case 'onSectorStart':
      return applyOnSectorStart(
        itemId,
        payload as SectorStartPayload
      ) as ItemHookPayloadByName[THook];
    case 'onRouteChosen':
      return applyOnRouteChosen(
        itemId,
        payload as RouteChosenPayload
      ) as ItemHookPayloadByName[THook];
    case 'onShopEntered':
      return applyOnShopEntered(
        itemId,
        payload as ShopEnteredPayload
      ) as ItemHookPayloadByName[THook];
    case 'onRewardGenerated':
      return applyOnRewardGenerated(
        itemId,
        payload as RewardGeneratedPayload
      ) as ItemHookPayloadByName[THook];
    case 'onBossPhaseChanged':
      return applyOnBossPhaseChanged(
        itemId,
        payload as BossPhaseChangedPayload
      ) as ItemHookPayloadByName[THook];
    case 'onEnvironmentObjectDestroyed':
      return applyOnEnvironmentObjectDestroyed(
        itemId,
        payload as EnvironmentObjectDestroyedPayload
      ) as ItemHookPayloadByName[THook];
  }
}

function applyOnProjectileSpawn(
  itemId: ItemId,
  payload: ProjectileSpawnPayload
): ProjectileSpawnPayload {
  if (
    itemId === 'item_chain_arc_capacitor' &&
    hasAnyTag(payload.projectile.tags, ['laser', 'plasma'])
  ) {
    return {
      projectile: attachArcCharge(payload.projectile)
    };
  }

  if (
    itemId === 'item_ricochet_license' &&
    hasAnyTag(payload.projectile.tags, ['plasma', 'phase', 'ricochet'])
  ) {
    return {
      projectile: {
        ...payload.projectile,
        ttl: payload.projectile.ttl + 0.8,
        tags: addTags(payload.projectile.tags, ['ricochet']),
        ricochetBounces: Math.max(1, payload.projectile.ricochetBounces ?? 0)
      }
    };
  }

  if (itemId === 'item_plasma_lens_array' && hasAnyTag(payload.projectile.tags, ['plasma'])) {
    return {
      projectile: attachArcCharge({
        ...payload.projectile,
        damage: payload.projectile.damage * 1.04,
        radius: payload.projectile.radius + 1
      })
    };
  }

  if (itemId === 'item_phase_anchor_spool' && hasAnyTag(payload.projectile.tags, ['phase'])) {
    return {
      projectile: {
        ...payload.projectile,
        vx: payload.projectile.vx + Math.sign(payload.projectile.vx || 1) * 18,
        ttl: payload.projectile.ttl + 0.32,
        tags: addTags(payload.projectile.tags, ['ricochet'])
      }
    };
  }

  if (
    itemId === 'item_plasma_bloom_filter' &&
    hasAnyTag(payload.projectile.tags, ['phase', 'plasma'])
  ) {
    return {
      projectile: {
        ...payload.projectile,
        damage: payload.projectile.damage * 1.1,
        radius: Math.max(payload.projectile.radius + 1, payload.projectile.radius * 1.14),
        ttl: payload.projectile.ttl + 0.1
      }
    };
  }

  if (
    itemId === 'item_arc_window_invoice' &&
    hasAnyTag(payload.projectile.tags, ['arc', 'plasma', 'phase', 'ricochet', 'split'])
  ) {
    return {
      projectile: attachArcCharge(payload.projectile, 'heavy')
    };
  }

  if (itemId === 'item_crossfeed_detonator' && getCircuitTraitCount(payload.projectile.tags) >= 2) {
    return {
      projectile: attachArcCharge(payload.projectile, 'heavy')
    };
  }

  if (
    itemId === 'item_faraday_phase_shunt' &&
    getArcChargeProfile(payload.projectile) !== null &&
    !payload.projectile.tags.includes('phase')
  ) {
    return {
      projectile: {
        ...payload.projectile,
        tags: addTags(payload.projectile.tags, ['phase'])
      }
    };
  }

  if (
    itemId === 'item_heat_signature_loop' &&
    hasAnyTag(payload.projectile.tags, ['heat', 'plasma'])
  ) {
    return {
      projectile: {
        ...payload.projectile,
        damage: payload.projectile.damage * 1.05,
        ttl: payload.projectile.ttl + 0.18,
        tags: addTags(payload.projectile.tags, ['heat'])
      }
    };
  }

  if (
    itemId === 'item_plasma_seed_crucible' &&
    hasAnyTag(payload.projectile.tags, ['arc', 'split', 'phase', 'ricochet', 'drone', 'missile'])
  ) {
    return {
      projectile: {
        ...payload.projectile,
        damage: payload.projectile.damage * 1.16,
        radius: payload.projectile.radius + 1,
        ttl: payload.projectile.ttl + 0.12,
        tags: addTags(payload.projectile.tags, ['plasma', 'heat'])
      }
    };
  }

  if (
    itemId === 'item_ricochet_branch_coupler' &&
    hasAnyTag(payload.projectile.tags, ['split', 'drone'])
  ) {
    return {
      projectile: {
        ...payload.projectile,
        ttl: payload.projectile.ttl + 0.55,
        tags: addTags(payload.projectile.tags, ['ricochet']),
        ricochetBounces: (payload.projectile.ricochetBounces ?? 0) + 1
      }
    };
  }

  if (itemId === 'item_rebound_freight_seal') {
    const preparedBounces = Math.min(
      2,
      Math.max(0, Math.floor(payload.projectile.ricochetBounces ?? 0))
    );

    if (preparedBounces > 0) {
      return {
        projectile: {
          ...payload.projectile,
          damage: payload.projectile.damage * (1 + preparedBounces * 0.14),
          radius: payload.projectile.radius + preparedBounces * 0.5,
          tags: addTags(payload.projectile.tags, ['overkill'])
        }
      };
    }
  }

  if (itemId === 'item_strata_bore_collimator' && payload.projectile.tags.includes('plasma')) {
    const supportingTraits = Math.min(3, getCircuitTraitCount(payload.projectile.tags));
    return {
      projectile: {
        ...payload.projectile,
        vx: payload.projectile.vx * 1.12,
        vy: payload.projectile.vy * 1.12,
        damage: payload.projectile.damage * (1.14 + supportingTraits * 0.04),
        radius: payload.projectile.radius + 0.5,
        tags: addTags(payload.projectile.tags, ['laser']),
        laserKind: 'beam'
      }
    };
  }

  if (itemId === 'item_claimant_arc_seal' && payload.projectile.tags.includes('overkill')) {
    return {
      projectile: attachArcCharge(payload.projectile)
    };
  }

  if (
    itemId === 'item_mnemonic_sepulcher_key' &&
    hasAnyTag(payload.projectile.tags, ['phase', 'drone'])
  ) {
    return {
      projectile: attachArcCharge(
        {
          ...payload.projectile,
          ttl: payload.projectile.ttl + 0.3
        },
        'heavy'
      )
    };
  }

  if (
    itemId === 'item_claimant_mantle_press' &&
    hasAnyTag(payload.projectile.tags, ['missile', 'overkill'])
  ) {
    return {
      projectile: {
        ...payload.projectile,
        damage: payload.projectile.damage * 1.14,
        radius: payload.projectile.radius + 1,
        ttl: payload.projectile.ttl + 0.12,
        tags: addTags(payload.projectile.tags, ['armor', 'shield', 'revenge'])
      }
    };
  }

  return payload;
}

function applyOnFire(
  itemId: ItemId,
  instances: readonly ItemInstance[],
  payload: FirePayload
): FirePayload {
  if (itemId === 'item_split_prism') {
    const splitProjectiles = payload.projectiles.flatMap((projectile) => {
      if (projectile.procDepth > 0) {
        return [projectile];
      }

      const sideDamage = Math.max(0.35, projectile.damage * 0.62);
      const sideSpeed = Math.max(60, Math.abs(projectile.vy) * 0.16);

      return [
        projectile,
        {
          ...projectile,
          vx: projectile.vx - sideSpeed,
          damage: sideDamage,
          radius: Math.max(3, projectile.radius * 0.82),
          tags: addTags(projectile.tags, ['split']),
          procDepth: projectile.procDepth + 1
        },
        {
          ...projectile,
          vx: projectile.vx + sideSpeed,
          damage: sideDamage,
          radius: Math.max(3, projectile.radius * 0.82),
          tags: addTags(projectile.tags, ['split']),
          procDepth: projectile.procDepth + 1
        }
      ];
    });

    return {
      ...payload,
      projectiles: splitProjectiles
    };
  }

  if (itemId === 'item_boreline_crimper') {
    return {
      ...payload,
      projectiles: payload.projectiles.map((projectile) => {
        if (Math.abs(projectile.vx) < 24) {
          return projectile;
        }

        return {
          ...projectile,
          vx: projectile.vx * 0.58,
          vy: projectile.vy * 1.12,
          damage: projectile.damage * 1.18,
          tags: addTags(projectile.tags, ['overkill'])
        };
      })
    };
  }

  if (itemId === 'item_gangue_compression_die') {
    const peakDamage = payload.projectiles.reduce(
      (peak, projectile) => Math.max(peak, projectile.damage),
      0
    );

    return {
      ...payload,
      projectiles: payload.projectiles.map((projectile) => {
        if (peakDamage <= 0 || projectile.damage >= peakDamage * 0.9) {
          return projectile;
        }

        return {
          ...projectile,
          vx: projectile.vx * 0.9,
          vy: projectile.vy * 0.9,
          damage: projectile.damage * 1.3,
          radius: projectile.radius + 1,
          ttl: projectile.ttl + 0.18,
          tags: addTags(projectile.tags, ['plasma'])
        };
      })
    };
  }

  if (itemId === 'item_penumbra_crown_aperture' && payload.projectiles.length >= 2) {
    const projectedCenter =
      payload.projectiles.reduce(
        (sum, projectile) => sum + projectile.x + projectile.vx * 0.12,
        0
      ) / payload.projectiles.length;
    const centerlineIndex = payload.projectiles.reduce((closestIndex, projectile, index) => {
      const closest = payload.projectiles[closestIndex];
      if (!closest) return index;
      const distance = Math.abs(projectile.x + projectile.vx * 0.12 - projectedCenter);
      const closestDistance = Math.abs(closest.x + closest.vx * 0.12 - projectedCenter);
      return distance < closestDistance ? index : closestIndex;
    }, 0);

    return {
      ...payload,
      projectiles: payload.projectiles.map((projectile, index) =>
        index === centerlineIndex
          ? {
              ...projectile,
              vx: projectile.vx * 0.92,
              vy: projectile.vy * 0.92,
              radius: projectile.radius + 1,
              ttl: projectile.ttl + 0.18,
              tags: addTags(projectile.tags, ['phase', 'plasma'])
            }
          : projectile
      )
    };
  }

  if (itemId === 'item_parallax_echo_lattice') {
    return {
      ...payload,
      projectiles: payload.projectiles.map((projectile) =>
        projectile.procDepth > 0
          ? {
              ...projectile,
              ttl: projectile.ttl + 0.3,
              tags: addTags(projectile.tags, ['phase'])
            }
          : projectile
      )
    };
  }

  if (itemId === 'item_forkline_dynamo' && payload.projectiles.length >= 2) {
    const horizontalOrder = payload.projectiles
      .map((projectile, index) => ({
        index,
        projectedX: projectile.x + projectile.vx * 0.12
      }))
      .sort((left, right) => left.projectedX - right.projectedX || left.index - right.index);
    const chargedIndices = new Set([horizontalOrder[0]?.index, horizontalOrder.at(-1)?.index]);

    return {
      ...payload,
      projectiles: payload.projectiles.map((projectile, index) =>
        chargedIndices.has(index) ? attachArcCharge(projectile) : projectile
      )
    };
  }

  if (itemId === 'item_ashwake_reliquary') {
    const phaseSources = payload.projectiles
      .filter((projectile) => projectile.tags.includes('phase'))
      .slice(0, 3);

    if (phaseSources.length === 0) return payload;

    return {
      ...payload,
      projectiles: [
        ...payload.projectiles,
        ...phaseSources.map((projectile, index) => {
          const side = phaseSources.length === 1 ? 1 : index % 2 === 0 ? -1 : 1;
          return {
            ...projectile,
            x: projectile.x + side * 18,
            vx: -projectile.vx + side * 48,
            vy: projectile.vy * 0.9,
            damage: Math.max(0.48, projectile.damage * 0.56),
            radius: Math.max(3.5, projectile.radius * 0.82),
            ttl: projectile.ttl + 0.24,
            tags: addTags(projectile.tags, ['relic', 'phase', 'plasma']),
            procDepth: projectile.procDepth + 1
          };
        })
      ]
    };
  }

  if (
    itemId === 'item_shield_dynamo' &&
    isItemVolleyCycle(itemId, instances, payload.volleyIndex)
  ) {
    return addPrototypeVentCycleShot(itemId, instances, payload, {
      ...payload,
      projectiles: payload.projectiles.map((projectile) => ({
        ...projectile,
        vx: projectile.vx * 0.94,
        vy: projectile.vy * 0.94,
        radius: projectile.radius + 1,
        damage: projectile.damage * 1.35,
        ttl: projectile.ttl + 0.16,
        tags: addTags(projectile.tags, ['shield', 'revenge'])
      }))
    });
  }

  if (
    itemId === 'item_reactive_plating_grid' &&
    isItemVolleyCycle(itemId, instances, payload.volleyIndex)
  ) {
    const outerShots = [...payload.projectiles]
      .map((projectile, index) => ({
        projectile,
        index,
        projectedX: projectile.x + projectile.vx * 0.12
      }))
      .sort(
        (left, right) =>
          Math.abs(right.projectedX) - Math.abs(left.projectedX) || left.index - right.index
      )
      .slice(0, 2);

    return addPrototypeVentCycleShot(itemId, instances, payload, {
      ...payload,
      projectiles: [
        ...payload.projectiles,
        ...outerShots.map(({ projectile }, index) => {
          const side =
            outerShots.length === 1
              ? payload.volleyIndex % 2 === 0
                ? -1
                : 1
              : index === 0
                ? -1
                : 1;
          return {
            ...projectile,
            x: projectile.x + side * 16,
            vx: projectile.vx + side * 72,
            vy: projectile.vy * 0.88,
            radius: Math.max(4, projectile.radius * 0.92),
            damage: Math.max(0.42, projectile.damage * 0.46),
            ttl: projectile.ttl + 0.24,
            tags: addTags(projectile.tags, ['armor', 'shield', 'revenge']),
            procDepth: projectile.procDepth + 1
          };
        })
      ]
    });
  }

  if (
    itemId === 'item_shield_revenge_contract' &&
    isItemVolleyCycle(itemId, instances, payload.volleyIndex)
  ) {
    const retaliationShots = getRetaliationProjectiles(payload.projectiles).slice(0, 2);
    if (retaliationShots.length === 0) return payload;

    return addPrototypeVentCycleShot(itemId, instances, payload, {
      ...payload,
      projectiles: [
        ...payload.projectiles,
        ...retaliationShots.map((projectile, index) => {
          const side = retaliationShots.length === 1 ? 0 : index === 0 ? -1 : 1;
          return {
            ...projectile,
            x: projectile.x + side * 18,
            vx: projectile.vx * 0.62 + side * 54,
            vy: projectile.vy * 1.18,
            radius: Math.max(4, projectile.radius * 0.82),
            damage: Math.max(0.58, projectile.damage * 0.7),
            ttl: projectile.ttl * 0.9,
            tags: addTags(projectile.tags, ['shield', 'revenge']),
            procDepth: projectile.procDepth + 1
          };
        })
      ]
    });
  }

  if (itemId === 'item_revenge_beam') {
    const seedProjectile = getHeaviestRetaliationProjectile(payload.projectiles);
    if (!seedProjectile) return payload;

    return {
      ...payload,
      projectiles: [
        ...payload.projectiles,
        {
          ...seedProjectile,
          vx: seedProjectile.vx * 0.18,
          vy: seedProjectile.vy * 1.28,
          radius: Math.max(5, seedProjectile.radius * 0.88),
          damage: Math.max(0.9, seedProjectile.damage * 1.2),
          ttl: Math.max(0.72, seedProjectile.ttl * 0.82),
          tags: addTags(seedProjectile.tags, ['laser', 'shield', 'revenge']),
          procDepth: seedProjectile.procDepth + 1,
          laserKind: 'beam'
        }
      ]
    };
  }

  if (itemId === 'item_oathbound_deflector') {
    return {
      ...payload,
      projectiles: payload.projectiles.map((projectile) =>
        isRetaliationProjectile(projectile)
          ? {
              ...projectile,
              vx: projectile.vx * 1.08,
              ttl: projectile.ttl + 0.28,
              tags: addTags(projectile.tags, ['ricochet']),
              ricochetBounces: Math.max(1, projectile.ricochetBounces ?? 0)
            }
          : projectile
      )
    };
  }

  if (itemId === 'item_cursed_hull_plate') {
    const retaliationShots = getRetaliationProjectiles(payload.projectiles);
    const seedProjectile = getHeaviestRetaliationProjectile(retaliationShots);
    if (!seedProjectile) return payload;

    const amplified = payload.projectiles.map((projectile) =>
      isRetaliationProjectile(projectile)
        ? {
            ...projectile,
            damage: projectile.damage * 1.25,
            tags: addTags(projectile.tags, ['curse', 'overkill'])
          }
        : projectile
    );
    return {
      ...payload,
      projectiles: [
        ...amplified,
        ...[-118, 0, 118].map((vx) => ({
          ...seedProjectile,
          vx: seedProjectile.vx * 0.2 + vx,
          vy: seedProjectile.vy * 0.92,
          radius: Math.max(4, seedProjectile.radius * 0.8),
          damage: Math.max(0.55, seedProjectile.damage * 0.5),
          ttl: seedProjectile.ttl + 0.12,
          tags: addTags(seedProjectile.tags, ['armor', 'curse', 'overkill', 'revenge']),
          procDepth: seedProjectile.procDepth + 1
        }))
      ]
    };
  }

  if (itemId === 'item_drone_uplink' && isItemVolleyCycle(itemId, instances, payload.volleyIndex)) {
    return addPrototypeVentCycleShot(itemId, instances, payload, {
      ...payload,
      projectiles: [
        ...payload.projectiles,
        ...payload.projectiles.slice(0, 1).flatMap((projectile) => [
          {
            ...projectile,
            x: projectile.x - 32,
            damage: projectile.damage * 0.38,
            radius: Math.max(3, projectile.radius * 0.75),
            tags: addTags(projectile.tags, ['drone']),
            procDepth: projectile.procDepth + 1,
            droneSourceId: itemId
          },
          {
            ...projectile,
            x: projectile.x + 32,
            damage: projectile.damage * 0.38,
            radius: Math.max(3, projectile.radius * 0.75),
            tags: addTags(projectile.tags, ['drone']),
            procDepth: projectile.procDepth + 1,
            droneSourceId: itemId
          }
        ])
      ]
    });
  }

  if (itemId === 'item_mirror_turret') {
    return {
      ...payload,
      projectiles: [
        ...payload.projectiles,
        ...payload.projectiles.slice(0, 1).map((projectile) => ({
          ...projectile,
          y: projectile.y + 18,
          vy: Math.abs(projectile.vy) * 0.75,
          damage: projectile.damage * 0.38,
          radius: Math.max(3, projectile.radius * 0.72),
          tags: addTags(projectile.tags, ['drone']),
          procDepth: projectile.procDepth + 1,
          droneSourceId: itemId
        }))
      ]
    };
  }

  if (itemId === 'item_heat_sink_saint') {
    return {
      ...payload,
      projectiles: payload.projectiles.map((projectile) => ({
        ...projectile,
        ttl: projectile.ttl + 0.2
      }))
    };
  }

  if (itemId === 'item_phase_grazer' && isItemVolleyCycle(itemId, instances, payload.volleyIndex)) {
    return addPrototypeVentCycleShot(itemId, instances, payload, {
      ...payload,
      projectiles: payload.projectiles.map((projectile) => ({
        ...projectile,
        damage: projectile.damage * 1.2,
        ttl: projectile.ttl + 0.35,
        tags: addTags(projectile.tags, ['phase'])
      }))
    });
  }

  if (
    itemId === 'item_signal_clone_stamp' &&
    isItemVolleyCycle(itemId, instances, payload.volleyIndex)
  ) {
    const sources = payload.projectiles
      .filter((projectile) => !projectile.tags.includes('drone'))
      .slice(0, 4);
    return addPrototypeVentCycleShot(itemId, instances, payload, {
      ...payload,
      projectiles: [
        ...payload.projectiles,
        ...sources.map((projectile, index) => ({
          ...projectile,
          x: projectile.x + (index % 2 === 0 ? -24 : 24),
          vx: projectile.vx + (index % 2 === 0 ? -36 : 36),
          damage: Math.max(0.3, projectile.damage * 0.48),
          radius: Math.max(3, projectile.radius * 0.78),
          tags: addTags(projectile.tags, ['drone', 'arc']),
          procDepth: projectile.procDepth + 1,
          droneSourceId: itemId
        }))
      ]
    });
  }

  if (
    itemId === 'item_missile_splinter_warrant' &&
    isItemVolleyCycle(itemId, instances, payload.volleyIndex)
  ) {
    const seedProjectile = payload.projectiles[0];

    if (!seedProjectile) {
      return payload;
    }

    return addPrototypeVentCycleShot(itemId, instances, payload, {
      ...payload,
      projectiles: [
        ...payload.projectiles,
        ...[-92, 92].map((vx) => ({
          ...seedProjectile,
          vx: seedProjectile.vx + vx,
          vy: seedProjectile.vy * 0.9,
          damage: Math.max(0.45, seedProjectile.damage * 0.58),
          radius: Math.max(3, seedProjectile.radius * 0.8),
          ttl: seedProjectile.ttl + 0.15,
          tags: addTags(seedProjectile.tags, ['missile', 'split']),
          procDepth: seedProjectile.procDepth + 1
        }))
      ]
    });
  }

  if (
    itemId === 'item_overheat_oracle' &&
    isItemVolleyCycle(itemId, instances, payload.volleyIndex)
  ) {
    const seedProjectile = payload.projectiles[0];

    if (!seedProjectile) {
      return payload;
    }

    return addPrototypeVentCycleShot(itemId, instances, payload, {
      ...payload,
      projectiles: [
        ...payload.projectiles,
        {
          ...seedProjectile,
          vx: 0,
          vy: seedProjectile.vy * 1.16,
          damage: Math.max(0.55, seedProjectile.damage * 0.62),
          radius: Math.max(4, seedProjectile.radius * 0.92),
          ttl: Math.max(1.2, seedProjectile.ttl * 0.9),
          tags: addTags(seedProjectile.tags, ['heat', 'phase']),
          procDepth: seedProjectile.procDepth + 1
        }
      ]
    });
  }

  if (
    itemId === 'item_arc_welder_drone' &&
    isItemVolleyCycle(itemId, instances, payload.volleyIndex) &&
    (hasItem(instances, 'item_chain_arc_capacitor') ||
      payload.projectiles.some((projectile) => projectile.tags.includes('arc')))
  ) {
    const seedProjectile = payload.projectiles[0];

    if (!seedProjectile) {
      return payload;
    }

    const side = payload.volleyIndex % 2 === 0 ? -1 : 1;

    return addPrototypeVentCycleShot(itemId, instances, payload, {
      ...payload,
      projectiles: [
        ...payload.projectiles,
        {
          ...seedProjectile,
          x: seedProjectile.x + side * 38,
          vx: seedProjectile.vx + side * 44,
          damage: Math.max(0.4, seedProjectile.damage * 0.52),
          radius: Math.max(3, seedProjectile.radius * 0.76),
          tags: addTags(seedProjectile.tags, ['arc', 'drone']),
          arcChargeKind: seedProjectile.arcChargeKind ?? 'standard',
          procDepth: seedProjectile.procDepth + 1,
          droneSourceId: itemId
        }
      ]
    });
  }

  if (
    itemId === 'item_lane_splitter_chisel' &&
    isItemVolleyCycle(itemId, instances, payload.volleyIndex)
  ) {
    const seedProjectile = payload.projectiles[0];

    if (!seedProjectile || seedProjectile.procDepth > 0) {
      return payload;
    }

    return addPrototypeVentCycleShot(itemId, instances, payload, {
      ...payload,
      projectiles: [
        ...payload.projectiles,
        ...[-64, 64].map((vx) => ({
          ...seedProjectile,
          vx: seedProjectile.vx + vx,
          damage: Math.max(0.35, seedProjectile.damage * 0.48),
          radius: Math.max(3, seedProjectile.radius * 0.72),
          tags: addTags(seedProjectile.tags, ['split', 'laser']),
          laserKind: 'lane' as const,
          procDepth: seedProjectile.procDepth + 1
        }))
      ]
    });
  }

  if (
    itemId === 'item_wake_missile_abacus' &&
    isItemVolleyCycle(itemId, instances, payload.volleyIndex)
  ) {
    const seedProjectile = payload.projectiles[0];

    if (!seedProjectile) {
      return payload;
    }

    return addPrototypeVentCycleShot(itemId, instances, payload, {
      ...payload,
      projectiles: [
        ...payload.projectiles,
        {
          ...seedProjectile,
          vy: seedProjectile.vy * 0.84,
          damage: Math.max(0.45, seedProjectile.damage * 0.82),
          radius: seedProjectile.radius + 1,
          ttl: seedProjectile.ttl + 0.3,
          tags: addTags(seedProjectile.tags, ['missile']),
          procDepth: seedProjectile.procDepth + 1
        }
      ]
    });
  }

  if (
    itemId === 'item_sidecar_drone_bay' &&
    isItemVolleyCycle(itemId, instances, payload.volleyIndex)
  ) {
    const seedProjectile = payload.projectiles[0];

    if (!seedProjectile) {
      return payload;
    }

    const side = payload.volleyIndex % 8 === 0 ? -1 : 1;

    return addPrototypeVentCycleShot(itemId, instances, payload, {
      ...payload,
      projectiles: [
        ...payload.projectiles,
        {
          ...seedProjectile,
          x: seedProjectile.x + side * 30,
          vx: seedProjectile.vx + side * 42,
          damage: Math.max(0.35, seedProjectile.damage * 0.45),
          radius: Math.max(3, seedProjectile.radius * 0.72),
          tags: addTags(seedProjectile.tags, ['drone']),
          procDepth: seedProjectile.procDepth + 1,
          droneSourceId: itemId
        }
      ]
    });
  }

  if (
    itemId === 'item_harmonic_fork_loom' &&
    isItemVolleyCycle(itemId, instances, payload.volleyIndex)
  ) {
    const outerProjectiles = [...payload.projectiles]
      .sort((left, right) => Math.abs(right.vx) - Math.abs(left.vx))
      .slice(0, 2);

    return addPrototypeVentCycleShot(itemId, instances, payload, {
      ...payload,
      projectiles: [
        ...payload.projectiles,
        ...outerProjectiles.map((projectile, index) => {
          const side = index === 0 ? -1 : 1;
          return {
            ...projectile,
            x: projectile.x + side * 12,
            vx: -projectile.vx + side * 54,
            damage: Math.max(0.35, projectile.damage * 0.52),
            radius: Math.max(3, projectile.radius * 0.78),
            tags: addTags(projectile.tags, ['laser', 'split']),
            laserKind: 'fork' as const,
            procDepth: projectile.procDepth + 1
          };
        })
      ]
    });
  }

  if (
    itemId === 'item_warhead_echo_chamber' &&
    isItemVolleyCycle(itemId, instances, payload.volleyIndex)
  ) {
    const seedProjectile = payload.projectiles.reduce<ProjectileBlueprint | null>(
      (heaviest, projectile) =>
        !heaviest || projectile.damage > heaviest.damage ? projectile : heaviest,
      null
    );

    if (!seedProjectile) {
      return payload;
    }

    return addPrototypeVentCycleShot(itemId, instances, payload, {
      ...payload,
      projectiles: [
        ...payload.projectiles,
        {
          ...seedProjectile,
          vy: seedProjectile.vy * 0.72,
          damage: Math.max(0.7, seedProjectile.damage * 0.78),
          radius: seedProjectile.radius + 2,
          ttl: seedProjectile.ttl + 0.5,
          tags: addTags(seedProjectile.tags, ['missile', 'overkill']),
          procDepth: seedProjectile.procDepth + 1
        }
      ]
    });
  }

  if (
    itemId === 'item_funeral_refrain_array' &&
    isItemVolleyCycle(itemId, instances, payload.volleyIndex)
  ) {
    const sources = [...payload.projectiles]
      .sort((left, right) => right.damage - left.damage)
      .slice(0, 2);
    if (sources.length === 0) return payload;

    return addPrototypeVentCycleShot(itemId, instances, payload, {
      ...payload,
      projectiles: [
        ...payload.projectiles,
        ...sources.map((projectile, index) => {
          const side = sources.length === 1 ? 0 : index === 0 ? -1 : 1;
          return {
            ...projectile,
            x: projectile.x + side * 26,
            vx: projectile.vx * 0.74 + side * 46,
            vy: projectile.vy * 0.9,
            damage: Math.max(0.52, projectile.damage * 0.58),
            radius: Math.max(4, projectile.radius * 0.86),
            ttl: projectile.ttl + 0.34,
            tags: addTags(projectile.tags, ['phase', 'drone']),
            procDepth: projectile.procDepth + 1,
            droneSourceId: itemId
          };
        })
      ]
    });
  }

  if (
    itemId === 'item_empty_throne_coronation' &&
    isItemVolleyCycle(itemId, instances, payload.volleyIndex)
  ) {
    const seedProjectile = payload.projectiles.reduce<ProjectileBlueprint | null>(
      (heaviest, projectile) =>
        !heaviest || projectile.damage > heaviest.damage ? projectile : heaviest,
      null
    );
    if (!seedProjectile) return payload;

    return addPrototypeVentCycleShot(itemId, instances, payload, {
      ...payload,
      projectiles: [
        ...payload.projectiles,
        {
          ...seedProjectile,
          vx: seedProjectile.vx * 0.35,
          vy: seedProjectile.vy * 0.68,
          damage: Math.max(0.95, seedProjectile.damage * 0.92),
          radius: seedProjectile.radius + 2.5,
          ttl: seedProjectile.ttl + 0.52,
          tags: addTags(seedProjectile.tags, ['heat', 'plasma', 'overkill']),
          procDepth: seedProjectile.procDepth + 1
        }
      ]
    });
  }

  if (itemId === 'item_exodus_rail_switch' && payload.projectiles.length >= 2) {
    const projected = payload.projectiles
      .map((projectile, index) => ({
        index,
        x: projectile.x + projectile.vx * 0.12
      }))
      .sort((left, right) => left.x - right.x || left.index - right.index);
    const outerIndices = new Set([projected[0]!.index, projected.at(-1)!.index]);
    const center = projected.reduce((sum, candidate) => sum + candidate.x, 0) / projected.length;

    return {
      ...payload,
      projectiles: payload.projectiles.map((projectile, index) => {
        if (!outerIndices.has(index)) return projectile;
        const projectedX = projectile.x + projectile.vx * 0.12;
        const crossingDirection = projectedX <= center ? 1 : -1;
        return {
          ...projectile,
          vx: crossingDirection * (Math.abs(projectile.vx) + 76),
          damage: projectile.damage * 1.12,
          ttl: projectile.ttl + 0.34,
          tags: addTags(projectile.tags, ['phase', 'split'])
        };
      })
    };
  }

  if (
    itemId === 'item_passenger_coffer_manifest' &&
    isItemVolleyCycle(itemId, instances, payload.volleyIndex) &&
    payload.projectiles.length >= 2
  ) {
    const sources = [...payload.projectiles]
      .sort((left, right) => left.damage - right.damage)
      .slice(0, 2);

    return addPrototypeVentCycleShot(itemId, instances, payload, {
      ...payload,
      projectiles: [
        ...payload.projectiles,
        ...sources.map((projectile, index) =>
          attachArcCharge({
            ...projectile,
            x: projectile.x + (index === 0 ? -34 : 34),
            vx: projectile.vx + (index === 0 ? -52 : 52),
            vy: projectile.vy * 0.88,
            damage: Math.max(0.45, projectile.damage * 0.55),
            radius: Math.max(3.5, projectile.radius * 0.82),
            ttl: projectile.ttl + 0.45,
            tags: addTags(projectile.tags, ['drone', 'arc']),
            procDepth: projectile.procDepth + 1,
            droneSourceId: itemId
          })
        )
      ]
    });
  }

  return payload;
}

function isRetaliationProjectile(projectile: ProjectileBlueprint): boolean {
  return projectile.tags.includes('revenge');
}

function getRetaliationProjectiles(
  projectiles: readonly ProjectileBlueprint[]
): ProjectileBlueprint[] {
  return projectiles.filter(isRetaliationProjectile);
}

function getHeaviestRetaliationProjectile(
  projectiles: readonly ProjectileBlueprint[]
): ProjectileBlueprint | null {
  return getRetaliationProjectiles(projectiles).reduce<ProjectileBlueprint | null>(
    (heaviest, projectile) =>
      !heaviest || projectile.damage > heaviest.damage ? projectile : heaviest,
    null
  );
}

function isItemVolleyCycle(
  itemId: ItemId,
  instances: readonly ItemInstance[],
  volleyIndex: number
): boolean {
  const cadence = getItemVolleyCadenceProfile(itemId, instances);
  return cadence !== null && volleyIndex % cadence.effectiveCadence === 0;
}

function addPrototypeVentCycleShot(
  itemId: ItemId,
  instances: readonly ItemInstance[],
  input: FirePayload,
  output: FirePayload
): FirePayload {
  const cadence = getItemVolleyCadenceProfile(itemId, instances);
  const seedProjectile = input.projectiles[0];
  if (!cadence?.prototypeVented || !seedProjectile) {
    return output;
  }

  const heatCost = Math.max(0, input.heatShotCost ?? 0);
  const storedHeat = input.storedWeaponHeat ?? Number.POSITIVE_INFINITY;
  const alreadySpent = Math.max(0, input.weaponHeatSpent ?? 0);
  const availableHeat = Number.isFinite(storedHeat)
    ? Math.max(0, storedHeat - alreadySpent)
    : heatCost;
  const canFire = availableHeat + 1e-9 >= heatCost;
  const event: HeatShotEvent = {
    sourceItemId: itemId,
    outcome: canFire ? 'fired' : 'exhausted',
    heatCost,
    heatBefore: availableHeat,
    heatAfter: canFire ? Math.max(0, availableHeat - heatCost) : availableHeat
  };

  if (!canFire) {
    return {
      ...output,
      weaponHeatSpent: alreadySpent,
      heatShotEvents: [...(input.heatShotEvents ?? []), event]
    };
  }

  return {
    ...output,
    weaponHeatSpent: alreadySpent + heatCost,
    heatShotEvents: [...(input.heatShotEvents ?? []), event],
    projectiles: [
      ...output.projectiles,
      {
        ...seedProjectile,
        vx: seedProjectile.vx * 0.28,
        vy: seedProjectile.vy * 0.76,
        damage: Math.max(1.15, seedProjectile.damage * 1.65),
        radius: Math.max(6, seedProjectile.radius * 1.18),
        ttl: seedProjectile.ttl + 0.4,
        tags: addTags(seedProjectile.tags, ['heat', 'plasma']),
        procDepth: seedProjectile.procDepth + 1,
        visualKind: 'heatShot'
      }
    ]
  };
}

function applyOnEnemyKilled(
  itemId: ItemId,
  instances: readonly ItemInstance[],
  payload: EnemyKilledPayload
): EnemyKilledPayload {
  if (
    itemId === 'item_overkill_ledger' &&
    hasAnyTag(payload.projectileTags, ['missile', 'overkill']) &&
    payload.overkillDamage > 0
  ) {
    return {
      ...payload,
      bonusSalvage: payload.bonusSalvage + Math.max(1, Math.ceil(payload.overkillDamage))
    };
  }

  if (
    itemId === 'item_bomb_refund_actuator' &&
    hasItem(instances, 'item_overkill_ledger') &&
    hasAnyTag(payload.projectileTags, ['missile'])
  ) {
    return {
      ...payload,
      blastDamage: payload.blastDamage + 0.85
    };
  }

  if (
    itemId === 'item_vault_parasite' &&
    hasAnyTag(payload.projectileTags, ['curse', 'overkill'])
  ) {
    return {
      ...payload,
      bonusSalvage: payload.bonusSalvage + 2 + Math.max(0, Math.ceil(payload.overkillDamage * 0.5)),
      blastDamage: payload.blastDamage + 0.75
    };
  }

  if (itemId === 'item_laser_tax_stamp' && hasAnyTag(payload.projectileTags, ['laser'])) {
    return {
      ...payload,
      bonusSalvage: payload.bonusSalvage + 1
    };
  }

  if (itemId === 'item_scrap_saints_relay' && hasAnyTag(payload.projectileTags, ['drone'])) {
    return {
      ...payload,
      bonusSalvage: payload.bonusSalvage + 1
    };
  }

  if (
    itemId === 'item_bombardier_tithe' &&
    hasAnyTag(payload.projectileTags, ['bomb', 'missile'])
  ) {
    return {
      ...payload,
      blastDamage: payload.blastDamage + 0.65
    };
  }

  if (
    itemId === 'item_relic_index_codex' &&
    hasAnyTag(payload.projectileTags, ['curse', 'phase'])
  ) {
    return {
      ...payload,
      bonusSalvage: payload.bonusSalvage + 1
    };
  }

  if (itemId === 'item_salvage_dividend_chip') {
    return {
      ...payload,
      bonusSalvage: payload.bonusSalvage + 1
    };
  }

  if (
    itemId === 'item_excess_warhead_clause' &&
    (payload.overkillDamage >= 2 || hasAnyTag(payload.projectileTags, ['missile', 'overkill']))
  ) {
    return {
      ...payload,
      bonusSalvage: payload.bonusSalvage + (payload.overkillDamage >= 2 ? 1 : 0),
      blastDamage: payload.blastDamage + 0.75
    };
  }

  if (
    itemId === 'item_boss_bounty_stamp' &&
    hasAnyTag(payload.projectileTags, ['phase', 'overkill', 'missile'])
  ) {
    return {
      ...payload,
      bonusSalvage: payload.bonusSalvage + 1
    };
  }

  if (itemId === 'item_crossfeed_detonator') {
    const circuitTraitCount = getCircuitTraitCount(payload.projectileTags);

    if (circuitTraitCount >= 2) {
      return {
        ...payload,
        blastDamage: payload.blastDamage + 0.55
      };
    }
  }

  return payload;
}

function getCircuitTraitCount(tags: readonly ItemTag[]): number {
  return new Set(
    tags.filter((tag) =>
      ['arc', 'drone', 'missile', 'phase', 'revenge', 'ricochet', 'shield', 'split'].includes(tag)
    )
  ).size;
}

function applyOnEnvironmentObjectDestroyed(
  itemId: ItemId,
  payload: EnvironmentObjectDestroyedPayload
): EnvironmentObjectDestroyedPayload {
  const salvageRichFamily =
    payload.family === 'debris' ||
    payload.family === 'rock' ||
    payload.family === 'wreck' ||
    payload.family === 'cache';

  if (
    itemId === 'item_salvage_dividend_chip' &&
    payload.kind === 'destructible' &&
    (salvageRichFamily || payload.rewardSalvage > 0)
  ) {
    return {
      ...payload,
      bonusSalvage: payload.bonusSalvage + 1
    };
  }

  return payload;
}

function applyOnPlayerHit(
  itemId: ItemId,
  instances: readonly ItemInstance[],
  payload: PlayerHitPayload
): PlayerHitPayload {
  if (
    itemId === 'item_curse_eater_gasket' &&
    (hasItem(instances, 'item_cursed_hull_plate') ||
      hasItem(instances, 'item_vault_parasite') ||
      hasItem(instances, 'item_relic_index_codex'))
  ) {
    return {
      ...payload,
      revengeProjectiles: [
        ...payload.revengeProjectiles,
        {
          x: 0,
          y: 0,
          vx: 0,
          vy: -720,
          radius: 5,
          damage: Math.max(1, payload.damage * 0.9),
          ttl: 0.85,
          tags: ['curse', 'relic'],
          procDepth: 1
        }
      ]
    };
  }

  return payload;
}

function applyOnPickupCollected(
  itemId: ItemId,
  payload: PickupCollectedPayload
): PickupCollectedPayload {
  const matchingPickup = applyHasteSource(
    itemId,
    payload.kind === 'credit' ? 'creditPickup' : 'salvagePickup',
    payload
  );
  return applyHasteSource(itemId, 'anyPickup', matchingPickup);
}

function applyOnGraze(itemId: ItemId, payload: GrazePayload): GrazePayload {
  if (itemId === 'item_near_miss_tachometer') {
    return {
      ...payload,
      specialChargeGain: payload.specialChargeGain + 0.04,
      effectRadius: payload.effectRadius + 6
    };
  }

  if (itemId === 'item_phase_wake_suture' && hasAnyTag(payload.projectileTags, ['phase'])) {
    return applyHasteSource(itemId, 'phaseGraze', {
      ...payload,
      specialChargeGain: payload.specialChargeGain + 0.025,
      effectRadius: payload.effectRadius + 10
    });
  }

  return payload;
}

function applyHasteSource<
  TPayload extends {
    readonly hasteFillSeconds: number;
    readonly hasteSourceIds: readonly ItemId[];
  }
>(itemId: ItemId, trigger: HasteTriggerKind, payload: TPayload): TPayload {
  const source = getHasteSourceDefinition(itemId);
  if (!source || source.trigger !== trigger || payload.hasteSourceIds.includes(itemId)) {
    return payload;
  }

  return {
    ...payload,
    hasteFillSeconds: payload.hasteFillSeconds + source.fillSeconds,
    hasteSourceIds: [...payload.hasteSourceIds, itemId]
  };
}

function applyOnSpecialUsed(_itemId: ItemId, payload: SpecialUsedPayload): SpecialUsedPayload {
  return payload;
}

function applyOnBombUsed(itemId: ItemId, payload: BombUsedPayload): BombUsedPayload {
  if (itemId === 'item_excess_warhead_clause') {
    return {
      ...payload,
      damage: payload.damage + 0.35,
      bossDamageRatio: payload.bossDamageRatio + 0.015,
      cooldownSeconds: payload.cooldownSeconds + 0.05,
      effectRadius: payload.effectRadius * 1.08
    };
  }

  return payload;
}

function applyOnSectorStart(itemId: ItemId, payload: SectorStartPayload): SectorStartPayload {
  const isLunarSector = payload.sectorId.includes('lunar');

  if (itemId === 'item_crater_shadow_lens') {
    return {
      ...payload,
      specialChargeBonus: payload.specialChargeBonus + (isLunarSector ? 0.08 : 0.02)
    };
  }

  if (itemId === 'item_surface_beacon_drone' && isLunarSector) {
    return {
      ...payload,
      salvageBonus: payload.salvageBonus + 1,
      specialChargeBonus: payload.specialChargeBonus + 0.05
    };
  }

  if (itemId === 'item_exit_toll_transponder') {
    return {
      ...payload,
      creditsBonus: payload.creditsBonus + Math.min(3, Math.max(1, payload.sectorIndex))
    };
  }

  return payload;
}

function applyOnRouteChosen(itemId: ItemId, payload: RouteChosenPayload): RouteChosenPayload {
  if (
    itemId === 'item_curse_interest_bond' &&
    (payload.routeKind === 'vault' || payload.routeKind === 'glitch')
  ) {
    return {
      ...payload,
      salvageDelta: payload.salvageDelta + 2,
      curseDelta: payload.curseDelta + 1,
      rewardBiasTags: addTags(payload.rewardBiasTags, ['curse', 'relic'])
    };
  }

  if (
    itemId === 'item_low_orbit_ore_scrip' &&
    (payload.routeKind === 'shop' || payload.routeKind === 'repair')
  ) {
    return {
      ...payload,
      creditsDelta: payload.creditsDelta + 1
    };
  }

  if (itemId === 'item_route_ledger_spool') {
    return {
      ...payload,
      rewardCreditBonus: payload.rewardCreditBonus + 1
    };
  }

  if (
    itemId === 'item_ambush_insurance_stamp' &&
    (payload.routeKind === 'elite' || payload.routeKind === 'factionAmbush')
  ) {
    return {
      ...payload,
      salvageDelta: payload.salvageDelta + 1,
      rewardBiasTags: addTags(payload.rewardBiasTags, ['armor', 'credit'])
    };
  }

  return payload;
}

function applyOnShopEntered(itemId: ItemId, payload: ShopEnteredPayload): ShopEnteredPayload {
  if (itemId === 'item_coupon_cascade_fuse') {
    return {
      ...payload,
      priceDiscount: payload.priceDiscount + 1,
      biasTags: [...payload.biasTags, 'credit']
    };
  }

  if (itemId === 'item_convoy_receipt_printer' && payload.rerollCount > 0) {
    return {
      ...payload,
      itemCount: payload.itemCount + 1,
      biasTags: [...payload.biasTags, 'drone', 'credit']
    };
  }

  return payload;
}

function applyOnRewardGenerated(
  itemId: ItemId,
  payload: RewardGeneratedPayload
): RewardGeneratedPayload {
  if (
    itemId === 'item_market_echo_locator' &&
    (payload.routeKind === 'shop' || payload.routeKind === 'repair')
  ) {
    return {
      ...payload,
      biasTags: [...payload.biasTags, 'credit', 'magnet']
    };
  }

  if (itemId === 'item_relic_ash_compass' && payload.poolId === 'vault') {
    return {
      ...payload,
      biasTags: [...payload.biasTags, 'relic', 'phase']
    };
  }

  if (
    itemId === 'item_mining_laser_transit' &&
    (payload.routeKind === 'vault' || payload.routeKind === 'factionAmbush')
  ) {
    return {
      ...payload,
      biasTags: [...payload.biasTags, 'laser', 'plasma']
    };
  }

  return payload;
}

function applyOnBossPhaseChanged(
  itemId: ItemId,
  payload: BossPhaseChangedPayload
): BossPhaseChangedPayload {
  if (itemId === 'item_phase_breaker_subpoena') {
    return {
      ...payload,
      specialChargeGain: payload.specialChargeGain + 0.12,
      clearEnemyProjectiles: payload.clearEnemyProjectiles || payload.phaseIndex >= 2
    };
  }

  if (itemId === 'item_warning_siren_lattice') {
    return {
      ...payload,
      attackCooldownSeconds: payload.attackCooldownSeconds + 0.1,
      telegraphSeconds: payload.telegraphSeconds + 0.15
    };
  }

  if (itemId === 'item_capital_wound_ledger') {
    return {
      ...payload,
      attackCooldownSeconds: payload.attackCooldownSeconds + 0.18,
      specialChargeGain: payload.specialChargeGain + 0.18
    };
  }

  if (itemId === 'item_telegraph_rewrite_quill') {
    return {
      ...payload,
      attackCooldownSeconds: payload.attackCooldownSeconds + 0.05,
      telegraphSeconds: payload.telegraphSeconds + 0.22
    };
  }

  return payload;
}

function hasAnyTag(tags: readonly ItemTag[], candidates: readonly ItemTag[]): boolean {
  return candidates.some((candidate) => tags.includes(candidate));
}

function addTags(tags: readonly ItemTag[], added: readonly ItemTag[]): ItemTag[] {
  return [...new Set([...tags, ...added])];
}
