import {
  ACTIVE_ITEM_FAMILIES,
  ACTIVE_ITEMS,
  ITEM_ARCHETYPES,
  ITEM_FAMILIES,
  ITEM_HOOKS,
  ITEM_IMPLEMENTATION_STATUSES,
  ITEM_SOURCES,
  ITEM_STACKING_MODES,
  ITEM_TAGS,
  ITEM_UNLOCK_TIERS,
  REWARD_POOLS,
  type ItemFamily,
  type ItemDefinition,
  type ItemHook,
  type ItemImplementationStatus,
  type ItemId,
  type ItemRarity,
  type ItemSource,
  type ItemStackingMode,
  type ItemTag,
  type ItemUnlockTier,
  type RewardPoolDefinition
} from './items';
import { ITEM_HOOK_IMPLEMENTATIONS } from '../game/ItemHooks';
import {
  ITEM_FAMILY_GATES,
  ITEM_UNLOCKS,
  type ItemFamilyGateDefinition
} from '../game/UnlockGates';

const ITEM_RARITIES = ['common', 'uncommon', 'rare', 'prototype', 'cursed'] as const;

export const PHASE_6_TARGET_ITEM_COUNT = 60;
export const PHASE_6_TARGET_ITEM_FAMILIES = ACTIVE_ITEM_FAMILIES;
export type Phase6TargetItemFamily = ItemFamily;

export interface BridgeEffectAuditNote {
  readonly itemId: ItemId;
  readonly note: string;
}

export const BRIDGE_EFFECT_AUDIT_NOTES: readonly BridgeEffectAuditNote[] =
  createBridgeEffectNotes(ACTIVE_ITEMS);

export interface ItemCatalogArchetypeAudit {
  readonly id: string;
  readonly label: string;
  readonly itemCount: number;
  readonly rewardedItemCount: number;
  readonly itemIds: readonly ItemId[];
}

export interface ItemCatalogPoolAudit {
  readonly id: RewardPoolDefinition['id'];
  readonly itemCount: number;
  readonly rarityCounts: Readonly<Record<ItemRarity, number>>;
}

export interface ItemCatalogAudit {
  readonly itemCount: number;
  readonly targetItemCount: number;
  readonly targetFamilies: readonly Phase6TargetItemFamily[];
  readonly tagCounts: Readonly<Record<ItemTag, number>>;
  readonly hookCounts: Readonly<Record<ItemHook, number>>;
  readonly rarityCounts: Readonly<Record<ItemRarity, number>>;
  readonly familyCounts: Readonly<Record<ItemFamily, number>>;
  readonly sourceCounts: Readonly<Record<ItemSource, number>>;
  readonly unlockTierCounts: Readonly<Record<ItemUnlockTier, number>>;
  readonly implementationStatusCounts: Readonly<Record<ItemImplementationStatus, number>>;
  readonly stackingCounts: Readonly<Record<ItemStackingMode, number>>;
  readonly poolAudits: readonly ItemCatalogPoolAudit[];
  readonly archetypeAudits: readonly ItemCatalogArchetypeAudit[];
  readonly underrepresentedArchetypeIds: readonly string[];
  readonly lockedItemIds: readonly ItemId[];
  readonly bridgeEffectNotes: readonly BridgeEffectAuditNote[];
}

export function createItemCatalogAudit(
  options: {
    readonly items?: readonly ItemDefinition[];
    readonly rewardPools?: readonly RewardPoolDefinition[];
    readonly itemUnlocks?: Readonly<Partial<Record<ItemId, unknown>>>;
    readonly itemFamilyGates?: readonly ItemFamilyGateDefinition[];
  } = {}
): ItemCatalogAudit {
  const items = options.items ?? ACTIVE_ITEMS;
  const rewardPools = options.rewardPools ?? REWARD_POOLS;
  const itemUnlocks = options.itemUnlocks ?? ITEM_UNLOCKS;
  const itemFamilyGates = options.itemFamilyGates ?? ITEM_FAMILY_GATES;
  const itemById = new Map(items.map((item) => [item.id, item]));
  const rewardedItemIds = new Set<ItemId>(rewardPools.flatMap((pool) => pool.itemIds));
  const tagCounts = createCountRecord(ITEM_TAGS);
  const hookCounts = createCountRecord(ITEM_HOOKS);
  const rarityCounts = createCountRecord(ITEM_RARITIES);
  const familyCounts = createCountRecord(ITEM_FAMILIES);
  const sourceCounts = createCountRecord(ITEM_SOURCES);
  const unlockTierCounts = createCountRecord(ITEM_UNLOCK_TIERS);
  const implementationStatusCounts = createCountRecord(ITEM_IMPLEMENTATION_STATUSES);
  const stackingCounts = createCountRecord(ITEM_STACKING_MODES);

  for (const item of items) {
    rarityCounts[item.rarity] += 1;
    familyCounts[item.metadata.family] += 1;
    unlockTierCounts[item.metadata.unlockTier] += 1;
    implementationStatusCounts[item.metadata.implementationStatus] += 1;
    stackingCounts[item.metadata.stacking] += 1;

    for (const tag of item.tags) {
      tagCounts[tag] += 1;
    }

    for (const hook of item.hooks) {
      hookCounts[hook] += 1;
    }

    for (const source of item.metadata.sources) {
      sourceCounts[source] += 1;
    }
  }

  const poolAudits = rewardPools.map((pool) => {
    const poolRarityCounts = createCountRecord(ITEM_RARITIES);

    for (const itemId of pool.itemIds) {
      const item = itemById.get(itemId);

      if (item) {
        poolRarityCounts[item.rarity] += 1;
      }
    }

    return {
      id: pool.id,
      itemCount: pool.itemIds.length,
      rarityCounts: poolRarityCounts
    };
  });

  const archetypeAudits = ITEM_ARCHETYPES.map((archetype) => {
    const matchingItems = items.filter((item) =>
      item.tags.some((tag) => archetype.tags.includes(tag))
    );
    const matchingRewardedItems = matchingItems.filter((item) => rewardedItemIds.has(item.id));

    return {
      id: archetype.id,
      label: archetype.label,
      itemCount: matchingItems.length,
      rewardedItemCount: matchingRewardedItems.length,
      itemIds: matchingItems.map((item) => item.id)
    };
  });

  const underrepresentedArchetypeIds = archetypeAudits
    .filter((audit) => audit.rewardedItemCount < 5)
    .map((audit) => audit.id);

  return {
    itemCount: items.length,
    targetItemCount: PHASE_6_TARGET_ITEM_COUNT,
    targetFamilies: PHASE_6_TARGET_ITEM_FAMILIES,
    tagCounts,
    hookCounts,
    rarityCounts,
    familyCounts,
    sourceCounts,
    unlockTierCounts,
    implementationStatusCounts,
    stackingCounts,
    poolAudits,
    archetypeAudits,
    underrepresentedArchetypeIds,
    lockedItemIds: getLockedItemIds(items, itemUnlocks, itemFamilyGates),
    bridgeEffectNotes: createBridgeEffectNotes(items)
  };
}

export function getImplementedHookItemIds(hook: ItemHook): readonly ItemId[] {
  return ITEM_HOOK_IMPLEMENTATIONS[hook];
}

function createCountRecord<TKey extends string>(keys: readonly TKey[]): Record<TKey, number> {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<TKey, number>;
}

function getLockedItemIds(
  items: readonly ItemDefinition[],
  itemUnlocks: Readonly<Partial<Record<ItemId, unknown>>>,
  itemFamilyGates: readonly ItemFamilyGateDefinition[]
): ItemId[] {
  const lockedIds = new Set(Object.keys(itemUnlocks) as ItemId[]);

  for (const item of items) {
    const gate = itemFamilyGates.find((candidate) => candidate.family === item.metadata.family);

    if (gate?.unlockTiers.includes(item.metadata.unlockTier)) {
      lockedIds.add(item.id);
    }
  }

  return [...lockedIds].sort();
}

function createBridgeEffectNotes(items: readonly ItemDefinition[]): BridgeEffectAuditNote[] {
  return items
    .filter((item) => item.metadata.implementationStatus === 'bridge')
    .map((item) => ({
      itemId: item.id,
      note: item.metadata.implementationNote ?? 'Bridge item is missing an implementation note.'
    }));
}
