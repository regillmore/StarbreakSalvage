import type { ItemId } from '../content/items';
import type { ItemInstance } from './Rewards';

export type HasteTriggerKind = 'creditPickup' | 'salvagePickup' | 'phaseGraze' | 'anyPickup';

export interface HasteSourceDefinition {
  readonly itemId: ItemId;
  readonly trigger: HasteTriggerKind;
  readonly fillSeconds: number;
}

export interface HasteReservoirProfile {
  readonly sourceCount: number;
  readonly capacitySeconds: number;
  readonly sourceIds: readonly ItemId[];
  readonly pauseDrainWhileNotFiring: boolean;
}

export interface HasteReservoirReadModel extends HasteReservoirProfile {
  readonly chargeSeconds: number;
  readonly active: boolean;
  readonly fillRatio: number;
  readonly fireCooldownMultiplier: number;
}

export const STANDARD_HASTE_FIRE_COOLDOWN_MULTIPLIER = 0.75;
export const BASE_HASTE_CAPACITY_SECONDS = 2.4;
export const HASTE_CAPACITY_PER_ADDITIONAL_SOURCE_SECONDS = 0.8;
export const MAX_HASTE_CAPACITY_SECONDS = 6.4;

const HASTE_SOURCE_DEFINITIONS = [
  {
    itemId: 'item_coin_operated_cannon',
    trigger: 'creditPickup',
    fillSeconds: 0.8
  },
  {
    itemId: 'item_credit_reroute_fuse',
    trigger: 'creditPickup',
    fillSeconds: 0.65
  },
  {
    itemId: 'item_magnetized_tithe_box',
    trigger: 'creditPickup',
    fillSeconds: 0.5
  },
  {
    itemId: 'item_salvage_magnet',
    trigger: 'salvagePickup',
    fillSeconds: 0.45
  },
  {
    itemId: 'item_regolith_scoop_array',
    trigger: 'salvagePickup',
    fillSeconds: 0.75
  },
  {
    itemId: 'item_phase_wake_suture',
    trigger: 'phaseGraze',
    fillSeconds: 0.65
  },
  {
    itemId: 'item_coastdown_capacitor',
    trigger: 'anyPickup',
    fillSeconds: 0.55
  }
] as const satisfies readonly HasteSourceDefinition[];

const HASTE_SOURCES_BY_ITEM = new Map<ItemId, HasteSourceDefinition>(
  HASTE_SOURCE_DEFINITIONS.map((source) => [source.itemId, source])
);

export function getHasteSourceDefinition(itemId: ItemId): HasteSourceDefinition | null {
  return HASTE_SOURCES_BY_ITEM.get(itemId) ?? null;
}

export function createHasteReservoirProfile(items: readonly ItemInstance[]): HasteReservoirProfile {
  const sourceIds = [
    ...new Set(
      items.map((item) => item.itemId).filter((itemId) => HASTE_SOURCES_BY_ITEM.has(itemId))
    )
  ];
  const sourceCount = sourceIds.length;
  const capacitySeconds =
    sourceCount === 0
      ? 0
      : Math.min(
          MAX_HASTE_CAPACITY_SECONDS,
          BASE_HASTE_CAPACITY_SECONDS +
            Math.max(0, sourceCount - 1) * HASTE_CAPACITY_PER_ADDITIONAL_SOURCE_SECONDS
        );

  return {
    sourceCount,
    capacitySeconds,
    sourceIds,
    pauseDrainWhileNotFiring: sourceIds.includes('item_coastdown_capacitor')
  };
}

export function fillHasteReservoir(
  currentSeconds: number,
  fillSeconds: number,
  capacitySeconds: number
): number {
  return Math.min(
    Math.max(0, capacitySeconds),
    Math.max(0, currentSeconds) + Math.max(0, fillSeconds)
  );
}

export function getHasteFireCooldownMultiplier(chargeSeconds: number): number {
  return chargeSeconds > 0 ? STANDARD_HASTE_FIRE_COOLDOWN_MULTIPLIER : 1;
}

export function drainHasteReservoir(
  currentSeconds: number,
  deltaSeconds: number,
  profile: HasteReservoirProfile,
  firing: boolean
): number {
  const clampedSeconds = Math.min(profile.capacitySeconds, Math.max(0, currentSeconds));
  if (profile.pauseDrainWhileNotFiring && !firing) {
    return clampedSeconds;
  }

  return Math.max(0, clampedSeconds - Math.max(0, deltaSeconds));
}

export function createHasteReservoirReadModel(
  items: readonly ItemInstance[],
  chargeSeconds: number
): HasteReservoirReadModel {
  const profile = createHasteReservoirProfile(items);
  const clampedCharge = Math.min(profile.capacitySeconds, Math.max(0, chargeSeconds));

  return {
    ...profile,
    chargeSeconds: clampedCharge,
    active: clampedCharge > 0,
    fillRatio: profile.capacitySeconds > 0 ? clampedCharge / profile.capacitySeconds : 0,
    fireCooldownMultiplier: getHasteFireCooldownMultiplier(clampedCharge)
  };
}
