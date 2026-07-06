import {
  ITEM_ARCHETYPES,
  ITEM_HOOKS,
  ITEM_TAGS,
  ITEMS,
  REWARD_POOLS,
  type ItemDefinition,
  type ItemHook,
  type ItemId,
  type ItemRarity,
  type ItemTag,
  type RewardPoolDefinition
} from './items';
import { ITEM_HOOK_IMPLEMENTATIONS } from '../game/ItemHooks';
import { ITEM_UNLOCKS } from '../game/UnlockGates';

const ITEM_RARITIES = ['common', 'uncommon', 'rare', 'prototype', 'cursed'] as const;

export const PHASE_6_TARGET_ITEM_COUNT = 60;

export const PHASE_6_TARGET_ITEM_FAMILIES = [
  'laser-split',
  'missile-overkill',
  'drone-copy',
  'shield-revenge',
  'credit-shop',
  'curse-relic',
  'phase-graze',
  'heat-prototype',
  'lunar-surface',
  'route-economy',
  'boss-pressure'
] as const;

export type Phase6TargetItemFamily = (typeof PHASE_6_TARGET_ITEM_FAMILIES)[number];

export interface BridgeEffectAuditNote {
  readonly itemId: ItemId;
  readonly note: string;
}

export const BRIDGE_EFFECT_AUDIT_NOTES: readonly BridgeEffectAuditNote[] = [
  {
    itemId: 'item_ricochet_license',
    note: 'Extends plasma projectile life now; true edge-bounce behavior is still future work.'
  },
  {
    itemId: 'item_phase_grazer',
    note: 'Adds phase shots and graze charge today; a dedicated onGraze hook would make the fantasy clearer.'
  },
  {
    itemId: 'item_vault_parasite',
    note: 'Pays extra salvage today; stronger vault/source weighting still belongs in Phase 6 pool work.'
  },
  {
    itemId: 'item_cursed_hull_plate',
    note: 'Adds curse-themed revenge fire today; its downside/risk copy is still lighter than its text implies.'
  }
];

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
  readonly poolAudits: readonly ItemCatalogPoolAudit[];
  readonly archetypeAudits: readonly ItemCatalogArchetypeAudit[];
  readonly underrepresentedArchetypeIds: readonly string[];
  readonly lockedItemIds: readonly ItemId[];
  readonly bridgeEffectNotes: readonly BridgeEffectAuditNote[];
}

export function createItemCatalogAudit(options: {
  readonly items?: readonly ItemDefinition[];
  readonly rewardPools?: readonly RewardPoolDefinition[];
  readonly itemUnlocks?: Readonly<Partial<Record<ItemId, unknown>>>;
} = {}): ItemCatalogAudit {
  const items = options.items ?? ITEMS;
  const rewardPools = options.rewardPools ?? REWARD_POOLS;
  const itemUnlocks = options.itemUnlocks ?? ITEM_UNLOCKS;
  const itemById = new Map(items.map((item) => [item.id, item]));
  const rewardedItemIds = new Set<ItemId>(rewardPools.flatMap((pool) => pool.itemIds));
  const tagCounts = createCountRecord(ITEM_TAGS);
  const hookCounts = createCountRecord(ITEM_HOOKS);
  const rarityCounts = createCountRecord(ITEM_RARITIES);

  for (const item of items) {
    rarityCounts[item.rarity] += 1;

    for (const tag of item.tags) {
      tagCounts[tag] += 1;
    }

    for (const hook of item.hooks) {
      hookCounts[hook] += 1;
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
    poolAudits,
    archetypeAudits,
    underrepresentedArchetypeIds,
    lockedItemIds: Object.keys(itemUnlocks).sort() as ItemId[],
    bridgeEffectNotes: BRIDGE_EFFECT_AUDIT_NOTES
  };
}

export function getImplementedHookItemIds(hook: ItemHook): readonly ItemId[] {
  return ITEM_HOOK_IMPLEMENTATIONS[hook];
}

function createCountRecord<TKey extends string>(keys: readonly TKey[]): Record<TKey, number> {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<TKey, number>;
}
