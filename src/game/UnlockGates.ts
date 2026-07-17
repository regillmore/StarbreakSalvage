import { type BossId } from '../content/bosses';
import { FACTIONS, type FactionDefinition, type FactionId } from '../content/factions';
import { getItemById, type ItemFamily, type ItemId, type ItemUnlockTier } from '../content/items';
import { SHIPS, type ShipDefinition, type ShipId } from '../content/ships';
import { UNLOCKS, type UnlockId } from '../content/unlocks';

export interface UnlockAccess {
  readonly unlockedIds?: readonly UnlockId[];
}

export interface ItemFamilyGateDefinition {
  readonly family: ItemFamily;
  readonly unlockId: UnlockId;
  readonly unlockTiers: readonly ItemUnlockTier[];
  readonly label: string;
  readonly summary: string;
  readonly lockedHint: string;
}

export interface ChallengeSeedDefinition {
  readonly id: 'challenge_debt_ceiling';
  readonly label: string;
  readonly seed: string;
  readonly summary: string;
  readonly unlockId: UnlockId;
}

export const CHALLENGE_SEEDS: readonly ChallengeSeedDefinition[] = [
  {
    id: 'challenge_debt_ceiling',
    label: 'Debt Ceiling',
    seed: 'DEBT-CEILING-404',
    summary: 'credit income is scarce and shop choices carry higher opportunity cost',
    unlockId: 'unlock_challenge_debt_ceiling'
  }
];

export const BASELINE_SHIP_IDS: readonly ShipId[] = [
  'ship_debt_runner',
  'ship_drone_chaplain',
  'ship_missile_accountant'
];

export const SHIP_UNLOCKS: Readonly<Partial<Record<ShipId, UnlockId>>> = {
  ship_phase_courier: 'unlock_ship_phase_courier',
  ship_shield_bruiser: 'unlock_ship_shield_bruiser',
  ship_scrap_monk: 'unlock_ship_scrap_monk',
  ship_corporate_test_pilot: 'unlock_ship_corporate_test_pilot',
  ship_relic_thief: 'unlock_ship_relic_thief'
};

export const ITEM_UNLOCKS: Readonly<Partial<Record<ItemId, UnlockId>>> = {
  item_overheat_oracle: 'unlock_item_executive_override'
};

export const ITEM_FAMILY_GATES: readonly ItemFamilyGateDefinition[] = [
  {
    family: 'curse-relic',
    unlockId: 'unlock_ship_relic_thief',
    unlockTiers: ['advanced'],
    label: 'Relic Theft Dossier',
    summary: 'opens cursed relic tables for vault and route rewards',
    lockedHint: 'Survey routes and recover enough records to expose the Relic Thief trail.'
  },
  {
    family: 'heat-prototype',
    unlockId: 'unlock_item_executive_override',
    unlockTiers: ['unlock'],
    label: 'Executive Prototype Waiver',
    summary: 'permits classified heat prototypes to enter combat and vault rewards',
    lockedHint: 'Recover a larger credit float to convince sponsors to release prototypes.'
  }
];

export const FACTION_UNLOCKS: Readonly<Partial<Record<FactionId, UnlockId>>> = {
  faction_bloom_hive: 'unlock_faction_bloom_hive'
};

export const BOSS_UNLOCKS: Readonly<Partial<Record<BossId, UnlockId>>> = {
  boss_bloom_engine: 'unlock_faction_bloom_hive'
};

export const BOSS_PRACTICE_UNLOCKS: Readonly<Partial<Record<BossId, UnlockId>>> = {
  boss_auditor_drone_xl: 'unlock_boss_auditor_drill'
};

export function getDefaultUnlockedIds(): UnlockId[] {
  return UNLOCKS.map((unlock) => unlock.id);
}

export function getEffectiveUnlockedIds(access: UnlockAccess = {}): readonly UnlockId[] {
  return access.unlockedIds ?? getDefaultUnlockedIds();
}

export function hasUnlock(access: UnlockAccess, unlockId: UnlockId): boolean {
  return new Set(getEffectiveUnlockedIds(access)).has(unlockId);
}

export function getAvailableShips(access: UnlockAccess = {}): ShipDefinition[] {
  return SHIPS.filter((ship) => isShipUnlocked(ship.id, access));
}

export function getAvailableFactionIds(access: UnlockAccess = {}): FactionId[] {
  return getAvailableFactions(access).map((faction) => faction.id);
}

export function getAvailableFactions(access: UnlockAccess = {}): FactionDefinition[] {
  return FACTIONS.filter((faction) => isFactionUnlocked(faction.id, access));
}

export function filterUnlockedItemIds(
  itemIds: readonly ItemId[],
  access: UnlockAccess = {}
): ItemId[] {
  return itemIds.filter((itemId) => isItemUnlocked(itemId, access));
}

export function filterUnlockedBossCandidates(
  bossIds: readonly BossId[],
  access: UnlockAccess = {}
): BossId[] {
  const unlockedBossIds = bossIds.filter((bossId) => isBossUnlocked(bossId, access));
  return unlockedBossIds.length > 0 ? unlockedBossIds : [...bossIds];
}

export function getAvailableChallengeSeeds(access: UnlockAccess = {}): ChallengeSeedDefinition[] {
  return CHALLENGE_SEEDS.filter((challenge) => hasUnlock(access, challenge.unlockId));
}

export function getAvailableBossPracticeIds(access: UnlockAccess = {}): BossId[] {
  return Object.entries(BOSS_PRACTICE_UNLOCKS)
    .filter((entry): entry is [BossId, UnlockId] => hasUnlock(access, entry[1]))
    .map(([bossId]) => bossId);
}

export function getItemFamilyGate(family: ItemFamily): ItemFamilyGateDefinition | undefined {
  return ITEM_FAMILY_GATES.find((gate) => gate.family === family);
}

export function isItemFamilyTierUnlocked(
  family: ItemFamily,
  unlockTier: ItemUnlockTier,
  access: UnlockAccess = {}
): boolean {
  const gate = getItemFamilyGate(family);

  if (!gate || !gate.unlockTiers.includes(unlockTier)) {
    return true;
  }

  return hasUnlock(access, gate.unlockId);
}

export function isShipUnlocked(shipId: ShipId, access: UnlockAccess = {}): boolean {
  if (BASELINE_SHIP_IDS.includes(shipId)) {
    return true;
  }

  return hasRequiredUnlock(SHIP_UNLOCKS[shipId], access);
}

export function isItemUnlocked(itemId: ItemId, access: UnlockAccess = {}): boolean {
  const item = getItemById(itemId);

  return (
    hasRequiredUnlock(ITEM_UNLOCKS[itemId], access) &&
    isItemFamilyTierUnlocked(item.metadata.family, item.metadata.unlockTier, access)
  );
}

export function isFactionUnlocked(factionId: FactionId, access: UnlockAccess = {}): boolean {
  return hasRequiredUnlock(FACTION_UNLOCKS[factionId], access);
}

export function isBossUnlocked(bossId: BossId, access: UnlockAccess = {}): boolean {
  return hasRequiredUnlock(BOSS_UNLOCKS[bossId], access);
}

function hasRequiredUnlock(requiredUnlockId: UnlockId | undefined, access: UnlockAccess): boolean {
  return requiredUnlockId ? hasUnlock(access, requiredUnlockId) : true;
}
