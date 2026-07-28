import type { ShipStats } from '../content/ships';
import type { WeaponDefinition } from '../content/weapons';
import { clamp } from '../core/math';

export const DEFAULT_WEAPON_HEAT_CAPACITY_MULTIPLIER = 1;
export const MIN_WEAPON_HEAT_CAPACITY_MULTIPLIER = 0.25;
export const MAX_WEAPON_HEAT_CAPACITY_MULTIPLIER = 2;

type ShipThermalStats = Partial<
  Pick<ShipStats, 'weaponHeatCapacityMultiplier'>
>;

export function getWeaponHeatCapacityMultiplier(stats?: ShipThermalStats | null): number {
  const authoredMultiplier = stats?.weaponHeatCapacityMultiplier;
  return Number.isFinite(authoredMultiplier)
    ? clamp(
        authoredMultiplier ?? DEFAULT_WEAPON_HEAT_CAPACITY_MULTIPLIER,
        MIN_WEAPON_HEAT_CAPACITY_MULTIPLIER,
        MAX_WEAPON_HEAT_CAPACITY_MULTIPLIER
      )
    : DEFAULT_WEAPON_HEAT_CAPACITY_MULTIPLIER;
}

export function applyShipThermalProfile(
  weapon: WeaponDefinition,
  stats?: ShipThermalStats | null
): WeaponDefinition {
  const multiplier = getWeaponHeatCapacityMultiplier(stats);
  if (multiplier === DEFAULT_WEAPON_HEAT_CAPACITY_MULTIPLIER) {
    return weapon;
  }

  return {
    ...weapon,
    overheatLimit: weapon.overheatLimit * multiplier
  };
}
