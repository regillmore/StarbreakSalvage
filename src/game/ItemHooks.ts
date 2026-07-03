import { getItemById, type ItemId, type ItemTag } from '../content/items';
import { getItemNames, type ItemInstance } from './Rewards';

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

export type ItemHookPayloadByName = {
  readonly onFire: FirePayload;
  readonly onProjectileSpawn: ProjectileSpawnPayload;
  readonly onEnemyKilled: EnemyKilledPayload;
  readonly onPlayerHit: PlayerHitPayload;
  readonly onPickupCollected: PickupCollectedPayload;
};

export type ItemHookName = keyof ItemHookPayloadByName;

export function applyItemHooks<THook extends ItemHookName>(
  hook: THook,
  instances: readonly ItemInstance[],
  payload: ItemHookPayloadByName[THook]
): ItemHookPayloadByName[THook] {
  return getOrderedItemInstances(instances).reduce(
    (currentPayload, instance) => applySingleItemHook(hook, instance.itemId, instances, currentPayload),
    payload
  );
}

export function getOrderedItemInstances(instances: readonly ItemInstance[]): ItemInstance[] {
  return [...instances].sort((a, b) => a.acquisitionOrder - b.acquisitionOrder || a.itemId.localeCompare(b.itemId));
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
      return applyOnProjectileSpawn(itemId, payload as ProjectileSpawnPayload) as ItemHookPayloadByName[THook];
    case 'onEnemyKilled':
      return applyOnEnemyKilled(itemId, instances, payload as EnemyKilledPayload) as ItemHookPayloadByName[THook];
    case 'onPlayerHit':
      return applyOnPlayerHit(itemId, instances, payload as PlayerHitPayload) as ItemHookPayloadByName[THook];
    case 'onPickupCollected':
      return applyOnPickupCollected(itemId, payload as PickupCollectedPayload) as ItemHookPayloadByName[THook];
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

  if (itemId === 'item_drone_uplink' && hasItem(instances, 'item_mirror_turret') && payload.volleyIndex % 3 === 0) {
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

  return payload;
}

function applyOnPlayerHit(
  itemId: ItemId,
  instances: readonly ItemInstance[],
  payload: PlayerHitPayload
): PlayerHitPayload {
  if (itemId !== 'item_revenge_beam' || !hasItem(instances, 'item_shield_dynamo')) {
    return payload;
  }

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

  return payload;
}

function hasAnyTag(tags: readonly ItemTag[], candidates: readonly ItemTag[]): boolean {
  return candidates.some((candidate) => tags.includes(candidate));
}

function addTags(tags: readonly ItemTag[], added: readonly ItemTag[]): ItemTag[] {
  return [...new Set([...tags, ...added])];
}
