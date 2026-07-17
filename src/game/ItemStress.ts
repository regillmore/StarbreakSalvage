import {
  getItemById,
  type ItemId,
  type ItemPoolProfileId,
  type RewardPoolId
} from '../content/items';
import type { UnlockId } from '../content/unlocks';
import { createBuildSynergyModel, formatBuildSynergyHud } from './BuildSynergy';
import {
  DEFAULT_ITEM_HOOK_APPLICATION_LIMIT,
  getOrderedItemInstances,
  ITEM_HOOK_IMPLEMENTATIONS,
  type ItemHookName
} from './ItemHooks';
import { generateRewardChoices, type ItemInstance, type RewardPoolContext } from './Rewards';
import { getDefaultUnlockedIds } from './UnlockGates';

export const ITEM_STRESS_PREVIEW_SEED = 'HOOK-STORM-SMOKE';

export const ITEM_STORM_ITEM_IDS: readonly ItemId[] = [
  'item_split_prism',
  'item_chain_arc_capacitor',
  'item_drone_uplink',
  'item_mirror_turret',
  'item_missile_splinter_warrant',
  'item_overkill_ledger',
  'item_bomb_refund_actuator',
  'item_near_miss_tachometer',
  'item_phase_wake_suture',
  'item_prototype_vent_script',
  'item_excess_warhead_clause',
  'item_salvage_dividend_chip',
  'item_shield_revenge_contract',
  'item_regolith_scoop_array',
  'item_crater_shadow_lens',
  'item_route_ledger_spool',
  'item_coupon_cascade_fuse',
  'item_market_echo_locator',
  'item_relic_ash_compass',
  'item_oathbound_deflector',
  'item_harmonic_fork_loom',
  'item_plasma_seed_crucible',
  'item_ricochet_branch_coupler',
  'item_warhead_echo_chamber',
  'item_crossfeed_detonator'
];

export interface ItemHookPressureEntry {
  readonly hook: ItemHookName;
  readonly itemCount: number;
  readonly itemIds: readonly ItemId[];
}

export interface ItemLoadoutStressModel {
  readonly itemCount: number;
  readonly uniqueItemCount: number;
  readonly activeHookTypes: number;
  readonly totalHookTypes: number;
  readonly hookApplications: number;
  readonly procBudget: number;
  readonly peakHookName: ItemHookName | null;
  readonly peakHookApplications: number;
  readonly skippedHookApplications: number;
  readonly buildLabel: string;
  readonly topHooks: readonly ItemHookPressureEntry[];
}

export interface ItemStressPoolSet {
  readonly combatCount: number;
  readonly shopCount: number;
  readonly vaultCount: number;
  readonly combatItemIds: readonly ItemId[];
  readonly shopItemIds: readonly ItemId[];
  readonly vaultItemIds: readonly ItemId[];
}

export interface ItemStressPoolPreview {
  readonly seed: string;
  readonly fresh: ItemStressPoolSet;
  readonly unlocked: ItemStressPoolSet;
  readonly unlockedOnlyItemIds: readonly ItemId[];
}

export function createItemStormLoadout(
  itemIds: readonly ItemId[] = ITEM_STORM_ITEM_IDS
): ItemInstance[] {
  return itemIds.map((itemId, acquisitionOrder) => ({
    itemId,
    acquisitionOrder
  }));
}

export function createItemLoadoutStressModel(
  instances: readonly ItemInstance[],
  procBudget = DEFAULT_ITEM_HOOK_APPLICATION_LIMIT
): ItemLoadoutStressModel {
  const orderedInstances = getOrderedItemInstances(instances);
  const hookNames = Object.keys(ITEM_HOOK_IMPLEMENTATIONS) as ItemHookName[];
  const topHooks = hookNames
    .map((hook): ItemHookPressureEntry => {
      const itemIds = orderedInstances
        .filter((instance) => getItemById(instance.itemId).hooks.includes(hook))
        .map((instance) => instance.itemId);

      return {
        hook,
        itemCount: itemIds.length,
        itemIds
      };
    })
    .filter((entry) => entry.itemCount > 0)
    .sort((a, b) => b.itemCount - a.itemCount || a.hook.localeCompare(b.hook));
  const peakHook = topHooks[0] ?? null;
  const hookApplications = topHooks.reduce((total, entry) => total + entry.itemCount, 0);
  const sanitizedProcBudget = Math.max(0, Math.floor(procBudget));

  return {
    itemCount: orderedInstances.length,
    uniqueItemCount: new Set(orderedInstances.map((instance) => instance.itemId)).size,
    activeHookTypes: topHooks.length,
    totalHookTypes: hookNames.length,
    hookApplications,
    procBudget: sanitizedProcBudget,
    peakHookName: peakHook?.hook ?? null,
    peakHookApplications: peakHook?.itemCount ?? 0,
    skippedHookApplications: topHooks.reduce(
      (total, entry) => total + Math.max(0, entry.itemCount - sanitizedProcBudget),
      0
    ),
    buildLabel: formatBuildSynergyHud(createBuildSynergyModel(orderedInstances)),
    topHooks
  };
}

export function createItemStressPoolPreview(
  seed = ITEM_STRESS_PREVIEW_SEED
): ItemStressPoolPreview {
  const fresh = createPoolSet(seed, []);
  const unlocked = createPoolSet(seed, getDefaultUnlockedIds());
  const freshIds = new Set(getPoolSetItemIds(fresh));
  const unlockedOnlyItemIds = getUniqueSortedItemIds(
    getPoolSetItemIds(unlocked).filter((itemId) => !freshIds.has(itemId))
  );

  return {
    seed,
    fresh,
    unlocked,
    unlockedOnlyItemIds
  };
}

function createPoolSet(seed: string, unlockedIds: readonly UnlockId[]): ItemStressPoolSet {
  const combatItemIds = generateStressPool(seed, 'combat', 'combat', unlockedIds);
  const shopItemIds = generateStressPool(seed, 'combat', 'shop', unlockedIds, {
    routeKind: 'shop'
  });
  const vaultItemIds = generateStressPool(seed, 'vault', 'vault', unlockedIds, {
    routeKind: 'vault'
  });

  return {
    combatCount: combatItemIds.length,
    shopCount: shopItemIds.length,
    vaultCount: vaultItemIds.length,
    combatItemIds,
    shopItemIds,
    vaultItemIds
  };
}

function generateStressPool(
  seed: string,
  poolId: RewardPoolId,
  poolProfileId: ItemPoolProfileId,
  unlockedIds: readonly UnlockId[],
  context: RewardPoolContext = {}
): ItemId[] {
  return generateRewardChoices({
    seed: `${seed}:stress:${poolProfileId}`,
    poolId,
    poolProfileId,
    count: 99,
    unlockedIds,
    context
  }).map((choice) => choice.item.id);
}

function getPoolSetItemIds(poolSet: ItemStressPoolSet): ItemId[] {
  return [...poolSet.combatItemIds, ...poolSet.shopItemIds, ...poolSet.vaultItemIds];
}

function getUniqueSortedItemIds(itemIds: readonly ItemId[]): ItemId[] {
  return [...new Set(itemIds)].sort((a, b) => a.localeCompare(b));
}
