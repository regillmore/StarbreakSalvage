import type { WeaponDefinition } from '../content/weapons';
import type { ProjectileBlueprint } from './ItemHooks';

export interface WeaponProjectileOrigin {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

export function createWeaponProjectileBlueprints(
  weapon: WeaponDefinition,
  origin: WeaponProjectileOrigin
): ProjectileBlueprint[] {
  const baseProjectile: ProjectileBlueprint = {
    x: origin.x,
    y: origin.y - origin.radius,
    vx: 0,
    vy: -weapon.projectileSpeed,
    radius: weapon.projectileRadius,
    damage: weapon.damage,
    ttl: weapon.pattern === 'beam' ? 0.85 : weapon.pattern === 'spread' ? 1.05 : 1.6,
    tags: weapon.tags,
    procDepth: 0,
    environmentDamageSource: 'weapon'
  };

  if (weapon.pattern === 'dual') {
    return [-8, 8].map((offset) => ({
      ...baseProjectile,
      x: baseProjectile.x + offset,
      damage: baseProjectile.damage * 0.72,
      radius: Math.max(3, baseProjectile.radius * 0.82)
    }));
  }

  if (weapon.pattern === 'spread') {
    return [-150, 0, 150].map((vx) => ({
      ...baseProjectile,
      vx,
      vy: baseProjectile.vy * (vx === 0 ? 1 : 0.92),
      damage: baseProjectile.damage * (vx === 0 ? 0.95 : 0.72),
      radius: Math.max(3, baseProjectile.radius * 0.88)
    }));
  }

  if (weapon.pattern === 'split') {
    return [-115, 0, 115].map((vx) => ({
      ...baseProjectile,
      vx,
      damage: baseProjectile.damage * (vx === 0 ? 0.9 : 0.58),
      radius: Math.max(3, baseProjectile.radius * 0.78)
    }));
  }

  if (weapon.pattern === 'missile') {
    return [
      {
        ...baseProjectile,
        radius: baseProjectile.radius * 1.18,
        ttl: 2,
        damage: baseProjectile.damage * 1.05
      }
    ];
  }

  if (weapon.pattern === 'beam') {
    return [
      {
        ...baseProjectile,
        vy: -weapon.projectileSpeed * 1.18,
        radius: baseProjectile.radius * 1.4,
        damage: baseProjectile.damage * 1.1
      }
    ];
  }

  return [baseProjectile];
}
