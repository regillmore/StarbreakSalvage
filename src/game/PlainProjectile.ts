import type { ItemTag } from '../content/items';
import type { ShipStats } from '../content/ships';
import type { ProjectileBlueprint } from './ItemHooks';

export const DEFAULT_PLAIN_PROJECTILE_DAMAGE_MULTIPLIER = 1;

type PlainFocusStats = Partial<Pick<ShipStats, 'plainProjectileDamageMultiplier'>>;

export function getPlainProjectileDamageMultiplier(stats?: PlainFocusStats | null): number {
  const multiplier = stats?.plainProjectileDamageMultiplier;
  return Number.isFinite(multiplier) && (multiplier ?? 0) > 0
    ? (multiplier ?? DEFAULT_PLAIN_PROJECTILE_DAMAGE_MULTIPLIER)
    : DEFAULT_PLAIN_PROJECTILE_DAMAGE_MULTIPLIER;
}

export function isPlainProjectile(projectile: ProjectileBlueprint): boolean {
  const baseTags = new Set<ItemTag>(projectile.plainBaseTags ?? projectile.tags);
  const keepsBaseIdentity = projectile.tags.every((tag) => tag === 'plain' || baseTags.has(tag));

  return (
    keepsBaseIdentity &&
    projectile.arcChargeKind === undefined &&
    projectile.droneSourceId === undefined &&
    projectile.visualKind === undefined &&
    (projectile.ricochetBounces ?? 0) === 0
  );
}

export function applyPlainProjectileFocus(
  projectile: ProjectileBlueprint,
  stats?: PlainFocusStats | null
): ProjectileBlueprint {
  const multiplier = getPlainProjectileDamageMultiplier(stats);
  if (multiplier === DEFAULT_PLAIN_PROJECTILE_DAMAGE_MULTIPLIER || !isPlainProjectile(projectile)) {
    return projectile;
  }

  return {
    ...projectile,
    damage: projectile.damage * multiplier,
    tags: projectile.tags.includes('plain') ? projectile.tags : [...projectile.tags, 'plain']
  };
}
