import type { ItemTag } from './items';
import type { WeaponId } from './ships';

export interface WeaponDefinition {
  readonly id: WeaponId;
  readonly name: string;
  readonly tags: readonly ItemTag[];
  readonly damage: number;
  readonly projectileSpeed: number;
  readonly projectileRadius: number;
  readonly fireCooldownSeconds: number;
}

export const WEAPONS: readonly WeaponDefinition[] = [
  {
    id: 'weapon_light_needle_laser',
    name: 'Light Needle Laser',
    tags: ['laser'],
    damage: 1,
    projectileSpeed: 760,
    projectileRadius: 4,
    fireCooldownSeconds: 0.16
  },
  {
    id: 'weapon_pulse_cannon',
    name: 'Pulse Cannon',
    tags: ['plasma'],
    damage: 1.15,
    projectileSpeed: 660,
    projectileRadius: 5,
    fireCooldownSeconds: 0.2
  },
  {
    id: 'weapon_dumbfire_missile_rack',
    name: 'Dumbfire Missile Rack',
    tags: ['missile', 'overkill'],
    damage: 2.35,
    projectileSpeed: 500,
    projectileRadius: 7,
    fireCooldownSeconds: 0.34
  },
  {
    id: 'weapon_needle_splitter',
    name: 'Needle Splitter',
    tags: ['laser', 'split'],
    damage: 0.9,
    projectileSpeed: 820,
    projectileRadius: 3.5,
    fireCooldownSeconds: 0.14
  },
  {
    id: 'weapon_short_range_spread',
    name: 'Short-Range Spread Cannon',
    tags: ['plasma'],
    damage: 1.2,
    projectileSpeed: 580,
    projectileRadius: 5.5,
    fireCooldownSeconds: 0.22
  },
  {
    id: 'weapon_kinetic_popgun',
    name: 'Kinetic Popgun',
    tags: ['scrap'],
    damage: 1,
    projectileSpeed: 640,
    projectileRadius: 4.5,
    fireCooldownSeconds: 0.18
  },
  {
    id: 'weapon_prototype_beam',
    name: 'Prototype Beam',
    tags: ['laser', 'heat'],
    damage: 1.4,
    projectileSpeed: 780,
    projectileRadius: 5,
    fireCooldownSeconds: 0.2
  },
  {
    id: 'weapon_basic_blaster',
    name: 'Basic Blaster',
    tags: ['plasma'],
    damage: 1,
    projectileSpeed: 650,
    projectileRadius: 4.5,
    fireCooldownSeconds: 0.18
  }
];

export function getWeaponById(id: WeaponId): WeaponDefinition {
  const weapon = WEAPONS.find((candidate) => candidate.id === id);

  if (!weapon) {
    throw new Error(`Unknown weapon id: ${id}`);
  }

  return weapon;
}
