import {
  getItemById,
  type ItemId,
  type ItemTag,
  type RewardPoolDefinition
} from '../content/items';
import { getItemNames, type ItemInstance } from './Rewards';
import type { BossId } from '../content/bosses';
import type { RouteKind } from './Generation';

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
}

export interface FirePayload {
  readonly volleyIndex: number;
  readonly projectiles: readonly ProjectileBlueprint[];
}

export interface EnemyKilledPayload {
  readonly projectileTags: readonly ItemTag[];
  readonly overkillDamage: number;
  readonly bonusSalvage: number;
  readonly blastDamage: number;
  readonly arcDamage: number;
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
  readonly fireRateMultiplier: number;
}

export interface GrazePayload {
  readonly projectileTags: readonly ItemTag[];
  readonly specialChargeGain: number;
  readonly bonusSalvage: number;
  readonly fireRateMultiplier: number;
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

export interface SectorStartPayload {
  readonly sectorIndex: number;
  readonly sectorId: string;
  readonly creditsBonus: number;
  readonly salvageBonus: number;
  readonly specialChargeBonus: number;
  readonly fireRateMultiplier: number;
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
  readonly shopStockBonus: number;
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
  readonly routeKind: RouteKind;
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
};

export type ItemHookName = keyof ItemHookPayloadByName;

export const DEFAULT_ITEM_HOOK_APPLICATION_LIMIT = 48;

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
    'item_drone_uplink',
    'item_heat_sink_saint',
    'item_phase_grazer',
    'item_mirror_turret',
    'item_missile_splinter_warrant',
    'item_overheat_oracle',
    'item_arc_welder_drone'
  ],
  onProjectileSpawn: [
    'item_chain_arc_capacitor',
    'item_ricochet_license',
    'item_plasma_lens_array',
    'item_phase_anchor_spool',
    'item_plasma_bloom_filter'
  ],
  onEnemyKilled: [
    'item_chain_arc_capacitor',
    'item_overkill_ledger',
    'item_bomb_refund_actuator',
    'item_vault_parasite',
    'item_laser_tax_stamp',
    'item_scrap_saints_relay',
    'item_bombardier_tithe',
    'item_relic_index_codex',
    'item_salvage_dividend_chip'
  ],
  onPlayerHit: [
    'item_shield_dynamo',
    'item_cursed_hull_plate',
    'item_revenge_beam',
    'item_shield_revenge_contract',
    'item_curse_eater_gasket'
  ],
  onPickupCollected: [
    'item_coin_operated_cannon',
    'item_salvage_magnet',
    'item_credit_reroute_fuse',
    'item_magnetized_tithe_box'
  ],
  onGraze: [],
  onSpecialUsed: [],
  onBombUsed: [],
  onSectorStart: [],
  onRouteChosen: [],
  onShopEntered: [],
  onRewardGenerated: [],
  onBossPhaseChanged: []
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

    currentPayload = applySingleItemHook(hook, instance.itemId, instances, currentPayload);
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
    (a, b) => a.acquisitionOrder - b.acquisitionOrder || a.itemId.localeCompare(b.itemId)
  );
}

export function describeItemLoadout(instances: readonly ItemInstance[]): string {
  const names = getItemNames(getOrderedItemInstances(instances));
  return names.length > 0 ? names.join(' + ') : 'No items';
}

export function hasItem(instances: readonly ItemInstance[], itemId: ItemId): boolean {
  return instances.some((instance) => instance.itemId === itemId);
}

function applySingleItemHook<THook extends ItemHookName>(
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
      projectile: {
        ...payload.projectile,
        tags: addTags(payload.projectile.tags, ['arc'])
      }
    };
  }

  if (itemId === 'item_ricochet_license' && hasAnyTag(payload.projectile.tags, ['plasma'])) {
    return {
      projectile: {
        ...payload.projectile,
        ttl: payload.projectile.ttl + 0.35
      }
    };
  }

  if (itemId === 'item_plasma_lens_array' && hasAnyTag(payload.projectile.tags, ['plasma'])) {
    return {
      projectile: {
        ...payload.projectile,
        damage: payload.projectile.damage * 1.04,
        radius: payload.projectile.radius + 1,
        tags: addTags(payload.projectile.tags, ['arc'])
      }
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

  if (
    itemId === 'item_drone_uplink' &&
    hasItem(instances, 'item_mirror_turret') &&
    payload.volleyIndex % 3 === 0
  ) {
    return {
      ...payload,
      projectiles: [
        ...payload.projectiles,
        ...payload.projectiles.slice(0, 1).flatMap((projectile) => [
          {
            ...projectile,
            x: projectile.x - 32,
            damage: projectile.damage * 0.5,
            radius: Math.max(3, projectile.radius * 0.75),
            tags: addTags(projectile.tags, ['drone']),
            procDepth: projectile.procDepth + 1
          },
          {
            ...projectile,
            x: projectile.x + 32,
            damage: projectile.damage * 0.5,
            radius: Math.max(3, projectile.radius * 0.75),
            tags: addTags(projectile.tags, ['drone']),
            procDepth: projectile.procDepth + 1
          }
        ])
      ]
    };
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
          procDepth: projectile.procDepth + 1
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

  if (itemId === 'item_phase_grazer' && payload.volleyIndex % 5 === 0) {
    const seedProjectile = payload.projectiles[0];

    if (!seedProjectile) {
      return payload;
    }

    return {
      ...payload,
      projectiles: [
        ...payload.projectiles,
        {
          ...seedProjectile,
          vx: seedProjectile.vx * 0.35,
          vy: seedProjectile.vy * 1.08,
          damage: Math.max(0.35, seedProjectile.damage * 0.45),
          radius: Math.max(3, seedProjectile.radius * 0.7),
          ttl: Math.max(1.1, seedProjectile.ttl * 0.8),
          tags: addTags(seedProjectile.tags, ['phase']),
          procDepth: seedProjectile.procDepth + 1
        }
      ]
    };
  }

  if (itemId === 'item_missile_splinter_warrant' && payload.volleyIndex % 4 === 0) {
    const seedProjectile = payload.projectiles[0];

    if (!seedProjectile) {
      return payload;
    }

    return {
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
    };
  }

  if (itemId === 'item_overheat_oracle' && payload.volleyIndex % 5 === 0) {
    const seedProjectile = payload.projectiles[0];

    if (!seedProjectile) {
      return payload;
    }

    return {
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
    };
  }

  if (
    itemId === 'item_arc_welder_drone' &&
    payload.volleyIndex % 3 === 0 &&
    (hasItem(instances, 'item_chain_arc_capacitor') ||
      payload.projectiles.some((projectile) => projectile.tags.includes('arc')))
  ) {
    const seedProjectile = payload.projectiles[0];

    if (!seedProjectile) {
      return payload;
    }

    const side = payload.volleyIndex % 2 === 0 ? -1 : 1;

    return {
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
          procDepth: seedProjectile.procDepth + 1
        }
      ]
    };
  }

  return payload;
}

function applyOnEnemyKilled(
  itemId: ItemId,
  instances: readonly ItemInstance[],
  payload: EnemyKilledPayload
): EnemyKilledPayload {
  if (
    itemId === 'item_chain_arc_capacitor' &&
    hasAnyTag(payload.projectileTags, ['laser', 'plasma']) &&
    hasItem(instances, 'item_split_prism')
  ) {
    return {
      ...payload,
      arcDamage: payload.arcDamage + 0.75
    };
  }

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

  if (itemId === 'item_vault_parasite') {
    return {
      ...payload,
      bonusSalvage: payload.bonusSalvage + 1
    };
  }

  if (itemId === 'item_laser_tax_stamp' && hasAnyTag(payload.projectileTags, ['laser'])) {
    return {
      ...payload,
      bonusSalvage: payload.bonusSalvage + 1
    };
  }

  if (
    itemId === 'item_scrap_saints_relay' &&
    (hasAnyTag(payload.projectileTags, ['drone']) ||
      hasItem(instances, 'item_drone_uplink') ||
      hasItem(instances, 'item_arc_welder_drone'))
  ) {
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

  return payload;
}

function applyOnPlayerHit(
  itemId: ItemId,
  instances: readonly ItemInstance[],
  payload: PlayerHitPayload
): PlayerHitPayload {
  if (itemId === 'item_shield_dynamo') {
    return {
      ...payload,
      revengeProjectiles: [
        ...payload.revengeProjectiles,
        {
          x: 0,
          y: -4,
          vx: 0,
          vy: -520,
          radius: 4,
          damage: Math.max(0.5, payload.damage * 0.45),
          ttl: 0.65,
          tags: ['shield'],
          procDepth: 1
        }
      ]
    };
  }

  if (itemId === 'item_cursed_hull_plate') {
    return {
      ...payload,
      revengeProjectiles: [
        ...payload.revengeProjectiles,
        {
          x: 0,
          y: 0,
          vx: 0,
          vy: -570,
          radius: 5,
          damage: Math.max(0.65, payload.damage * 0.6),
          ttl: 0.8,
          tags: ['curse', 'armor'],
          procDepth: 1
        }
      ]
    };
  }

  if (itemId === 'item_revenge_beam' && hasItem(instances, 'item_shield_dynamo')) {
    return {
      ...payload,
      revengeProjectiles: [
        ...payload.revengeProjectiles,
        {
          x: 0,
          y: 0,
          vx: 0,
          vy: -680,
          radius: 6,
          damage: Math.max(1, payload.damage),
          ttl: 0.9,
          tags: ['shield', 'revenge'],
          procDepth: 1
        }
      ]
    };
  }

  if (itemId === 'item_shield_revenge_contract') {
    return {
      ...payload,
      revengeProjectiles: [
        ...payload.revengeProjectiles,
        ...[-78, 78].map((vx) => ({
          x: 0,
          y: -2,
          vx,
          vy: -610,
          radius: 5,
          damage: Math.max(0.85, payload.damage * 0.72),
          ttl: 0.85,
          tags: ['shield', 'revenge'] as const,
          procDepth: 1
        }))
      ]
    };
  }

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
  if (itemId === 'item_coin_operated_cannon' && payload.kind === 'credit') {
    return {
      ...payload,
      fireRateMultiplier: payload.fireRateMultiplier * 0.72
    };
  }

  if (itemId === 'item_credit_reroute_fuse' && payload.kind === 'credit') {
    return {
      ...payload,
      fireRateMultiplier: payload.fireRateMultiplier * 0.82
    };
  }

  if (itemId === 'item_magnetized_tithe_box' && payload.kind === 'credit') {
    return {
      ...payload,
      fireRateMultiplier: payload.fireRateMultiplier * 0.88
    };
  }

  if (itemId === 'item_salvage_magnet' && payload.kind === 'salvage') {
    return {
      ...payload,
      fireRateMultiplier: payload.fireRateMultiplier * 0.92
    };
  }

  return payload;
}

function applyOnGraze(_itemId: ItemId, payload: GrazePayload): GrazePayload {
  return payload;
}

function applyOnSpecialUsed(_itemId: ItemId, payload: SpecialUsedPayload): SpecialUsedPayload {
  return payload;
}

function applyOnBombUsed(_itemId: ItemId, payload: BombUsedPayload): BombUsedPayload {
  return payload;
}

function applyOnSectorStart(_itemId: ItemId, payload: SectorStartPayload): SectorStartPayload {
  return payload;
}

function applyOnRouteChosen(_itemId: ItemId, payload: RouteChosenPayload): RouteChosenPayload {
  return payload;
}

function applyOnShopEntered(_itemId: ItemId, payload: ShopEnteredPayload): ShopEnteredPayload {
  return payload;
}

function applyOnRewardGenerated(
  _itemId: ItemId,
  payload: RewardGeneratedPayload
): RewardGeneratedPayload {
  return payload;
}

function applyOnBossPhaseChanged(
  _itemId: ItemId,
  payload: BossPhaseChangedPayload
): BossPhaseChangedPayload {
  return payload;
}

function hasAnyTag(tags: readonly ItemTag[], candidates: readonly ItemTag[]): boolean {
  return candidates.some((candidate) => tags.includes(candidate));
}

function addTags(tags: readonly ItemTag[], added: readonly ItemTag[]): ItemTag[] {
  return [...new Set([...tags, ...added])];
}
