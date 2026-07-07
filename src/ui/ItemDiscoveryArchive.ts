import { ITEM_FAMILIES, ITEMS, type ItemDefinition, type ItemFamily } from '../content/items';
import { getUnlockById } from '../content/unlocks';
import type { SaveData } from '../core/saveData';
import { getItemFamilyGate, isItemFamilyTierUnlocked } from '../game/UnlockGates';

export type ItemFamilyArchiveState = 'available' | 'partial' | 'locked' | 'unlocked';

export interface ItemFamilyArchiveEntry {
  readonly family: ItemFamily;
  readonly label: string;
  readonly state: ItemFamilyArchiveState;
  readonly statusText: string;
  readonly hintText: string;
  readonly discoveredItemCount: number;
  readonly totalItemCount: number;
  readonly discoveredItemNames: readonly string[];
  readonly gateLabel: string | null;
  readonly unlockName: string | null;
}

export interface ItemDiscoveryArchiveModel {
  readonly discoveredItemCount: number;
  readonly totalItemCount: number;
  readonly discoveredFamilyCount: number;
  readonly totalFamilyCount: number;
  readonly entries: readonly ItemFamilyArchiveEntry[];
}

const ITEM_FAMILY_LABELS: Readonly<Record<ItemFamily, string>> = {
  'laser-split': 'Laser Split',
  'missile-overkill': 'Missile Overkill',
  'drone-copy': 'Drone Copy',
  'shield-revenge': 'Shield Revenge',
  'credit-shop': 'Credit Shop',
  'curse-relic': 'Curse Relic',
  'phase-graze': 'Phase Graze',
  'heat-prototype': 'Heat Prototype',
  'lunar-surface': 'Lunar Surface',
  'route-economy': 'Route Economy',
  'boss-pressure': 'Boss Pressure'
};

export function createItemDiscoveryArchiveModel(
  saveData: SaveData,
  items: readonly ItemDefinition[] = ITEMS
): ItemDiscoveryArchiveModel {
  const discoveredItemIds = new Set(saveData.discoveredItemIds);
  const discoveredFamilyIds = new Set(saveData.discoveredItemFamilyIds);
  const entries = ITEM_FAMILIES.map((family) =>
    createItemFamilyArchiveEntry(family, saveData, items, discoveredItemIds, discoveredFamilyIds)
  );
  const discoveredFamilyCount = new Set([
    ...saveData.discoveredItemFamilyIds,
    ...entries.filter((entry) => entry.discoveredItemCount > 0).map((entry) => entry.family)
  ]).size;

  return {
    discoveredItemCount: discoveredItemIds.size,
    totalItemCount: items.length,
    discoveredFamilyCount,
    totalFamilyCount: ITEM_FAMILIES.length,
    entries
  };
}

function createItemFamilyArchiveEntry(
  family: ItemFamily,
  saveData: SaveData,
  items: readonly ItemDefinition[],
  discoveredItemIds: ReadonlySet<string>,
  discoveredFamilyIds: ReadonlySet<string>
): ItemFamilyArchiveEntry {
  const familyItems = items.filter((item) => item.metadata.family === family);
  const discoveredItems = familyItems.filter((item) => discoveredItemIds.has(item.id));
  const gate = getItemFamilyGate(family);
  const gateUnlocked = gate ? saveData.unlockedIds.includes(gate.unlockId) : true;
  const hasLockedTier = familyItems.some(
    (item) =>
      gate &&
      gate.unlockTiers.includes(item.metadata.unlockTier) &&
      !isItemFamilyTierUnlocked(family, item.metadata.unlockTier, {
        unlockedIds: saveData.unlockedIds
      })
  );
  const hasAvailableTier = familyItems.some((item) =>
    isItemFamilyTierUnlocked(family, item.metadata.unlockTier, {
      unlockedIds: saveData.unlockedIds
    })
  );
  const state: ItemFamilyArchiveState =
    gate && !gateUnlocked && !hasAvailableTier
      ? 'locked'
      : gate && !gateUnlocked && hasLockedTier
        ? 'partial'
        : gate
          ? 'unlocked'
          : 'available';
  const unlockName = gate ? getUnlockById(gate.unlockId).name : null;
  const statusText = getStatusText(state, discoveredItems.length, familyItems.length);
  const hintText = getHintText({
    state,
    gateHint: gate?.lockedHint ?? null,
    gateSummary: gate?.summary ?? null,
    discoveredItems,
    discoveredFamily: discoveredFamilyIds.has(family)
  });

  return {
    family,
    label: ITEM_FAMILY_LABELS[family],
    state,
    statusText,
    hintText,
    discoveredItemCount: discoveredItems.length,
    totalItemCount: familyItems.length,
    discoveredItemNames: discoveredItems.map((item) => item.name),
    gateLabel: gate?.label ?? null,
    unlockName
  };
}

function getStatusText(
  state: ItemFamilyArchiveState,
  discoveredItemCount: number,
  totalItemCount: number
): string {
  const progress = `${discoveredItemCount}/${totalItemCount} discovered`;

  if (state === 'locked') {
    return `Locked | ${progress}`;
  }

  if (state === 'partial') {
    return `Core available, classified tier locked | ${progress}`;
  }

  if (state === 'unlocked') {
    return `Unlocked | ${progress}`;
  }

  return `Available | ${progress}`;
}

function getHintText(options: {
  readonly state: ItemFamilyArchiveState;
  readonly gateHint: string | null;
  readonly gateSummary: string | null;
  readonly discoveredItems: readonly ItemDefinition[];
  readonly discoveredFamily: boolean;
}): string {
  if (options.state === 'locked') {
    return options.gateHint ?? 'Find related contracts to reveal this family.';
  }

  if (options.state === 'partial') {
    return options.gateHint ?? 'Core entries can appear now; classified entries need an unlock.';
  }

  if (options.discoveredItems.length > 0) {
    return `Recorded: ${options.discoveredItems
      .slice(0, 3)
      .map((item) => item.name)
      .join(', ')}${options.discoveredItems.length > 3 ? '...' : ''}`;
  }

  if (options.discoveredFamily) {
    return options.gateSummary ?? 'Family discovered; recover items to fill in records.';
  }

  return options.gateSummary ?? 'Can appear in future rewards; recover an item to record details.';
}
