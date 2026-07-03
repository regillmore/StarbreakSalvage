import type { ItemTag } from './items';
import type { WeaponId } from './ships';

export type WeaponPatternId = 'single' | 'dual' | 'spread' | 'split' | 'missile' | 'beam';

export interface WeaponDefinition {
  readonly id: WeaponId;
  readonly name: string;
  readonly tags: readonly ItemTag[];
  readonly pattern: WeaponPatternId;
  readonly damage: number;
  readonly projectileSpeed: number;
  readonly projectileRadius: number;
  readonly fireCooldownSeconds: number;
  readonly heatPerShot: number;
  readonly heatVentPerSecond: number;
  readonly overheatLimit: number;
  readonly overheatCooldownSeconds: number;
}

export const WEAPONS: readonly WeaponDefinition[] = [
  {
    id: 'weapon_light_needle_laser',
    name: 'Light Needle Laser',
    tags: ['laser'],
    pattern: 'single',
    damage: 1,
    projectileSpeed: 760,
    projectileRadius: 4,
    fireCooldownSeconds: 0.16,
    heatPerShot: 0.1,
    heatVentPerSecond: 0.52,
    overheatLimit: 1.4,
    overheatCooldownSeconds: 0.6
  },
  {
    id: 'weapon_pulse_cannon',
    name: 'Pulse Cannon',
    tags: ['plasma'],
    pattern: 'dual',
    damage: 1.15,
    projectileSpeed: 660,
    projectileRadius: 5,
    fireCooldownSeconds: 0.2,
    heatPerShot: 0.13,
    heatVentPerSecond: 0.5,
    overheatLimit: 1.35,
    overheatCooldownSeconds: 0.68
  },
  {
    id: 'weapon_dumbfire_missile_rack',
    name: 'Dumbfire Missile Rack',
    tags: ['missile', 'overkill'],
    pattern: 'missile',
    damage: 2.35,
    projectileSpeed: 500,
    projectileRadius: 7,
    fireCooldownSeconds: 0.34,
    heatPerShot: 0.2,
    heatVentPerSecond: 0.44,
    overheatLimit: 1.55,
    overheatCooldownSeconds: 0.9
  },
  {
    id: 'weapon_needle_splitter',
    name: 'Needle Splitter',
    tags: ['laser', 'split'],
    pattern: 'split',
    damage: 0.9,
    projectileSpeed: 820,
    projectileRadius: 3.5,
    fireCooldownSeconds: 0.14,
    heatPerShot: 0.12,
    heatVentPerSecond: 0.58,
    overheatLimit: 1.4,
    overheatCooldownSeconds: 0.58
  },
  {
    id: 'weapon_short_range_spread',
    name: 'Short-Range Spread Cannon',
    tags: ['plasma'],
    pattern: 'spread',
    damage: 1.2,
    projectileSpeed: 580,
    projectileRadius: 5.5,
    fireCooldownSeconds: 0.22,
    heatPerShot: 0.15,
    heatVentPerSecond: 0.5,
    overheatLimit: 1.45,
    overheatCooldownSeconds: 0.72
  },
  {
    id: 'weapon_kinetic_popgun',
    name: 'Kinetic Popgun',
    tags: ['scrap'],
    pattern: 'dual',
    damage: 1,
    projectileSpeed: 640,
    projectileRadius: 4.5,
    fireCooldownSeconds: 0.18,
    heatPerShot: 0.1,
    heatVentPerSecond: 0.56,
    overheatLimit: 1.5,
    overheatCooldownSeconds: 0.55
  },
  {
    id: 'weapon_prototype_beam',
    name: 'Prototype Beam',
    tags: ['laser', 'heat'],
    pattern: 'beam',
    damage: 1.4,
    projectileSpeed: 780,
    projectileRadius: 5,
    fireCooldownSeconds: 0.2,
    heatPerShot: 0.48,
    heatVentPerSecond: 0.34,
    overheatLimit: 1,
    overheatCooldownSeconds: 1.15
  },
  {
    id: 'weapon_basic_blaster',
    name: 'Basic Blaster',
    tags: ['plasma'],
    pattern: 'single',
    damage: 1,
    projectileSpeed: 650,
    projectileRadius: 4.5,
    fireCooldownSeconds: 0.18,
    heatPerShot: 0.11,
    heatVentPerSecond: 0.52,
    overheatLimit: 1.45,
    overheatCooldownSeconds: 0.62
  }
];

export function getWeaponById(id: WeaponId): WeaponDefinition {
  const weapon = WEAPONS.find((candidate) => candidate.id === id);

  if (!weapon) {
    throw new Error(`Unknown weapon id: ${id}`);
  }

  return weapon;
}
