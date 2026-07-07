import type { FactionId } from '../content/factions';
import {
  getItemById,
  ITEM_POOL_WEIGHT_PROFILES,
  REWARD_POOLS,
  type ItemDefinition,
  type ItemId,
  type ItemPoolProfileId,
  type ItemPoolWeightProfileDefinition,
  type ItemSource,
  type ItemTag,
  type RewardPoolId
} from '../content/items';
import type { RouteKind, StartingContract } from './Generation';
import { createRng, type Rng } from '../core/rng';
import { filterUnlockedItemIds, type UnlockAccess } from './UnlockGates';

export interface ItemInstance {
  readonly itemId: ItemId;
  readonly acquisitionOrder: number;
}

export interface RewardChoice {
  readonly item: ItemDefinition;
  readonly weight: number;
  readonly sourceHint: string;
  readonly poolProfileId: ItemPoolProfileId;
}

export interface RewardPoolContext {
  readonly routeKind?: RouteKind;
  readonly sectorId?: string;
  readonly sectorRole?: string;
  readonly bossFactionId?: FactionId;
  readonly bossGate?: boolean;
}

const DEFAULT_FIELD_KIT: readonly ItemId[] = ['item_split_prism', 'item_chain_arc_capacitor'];

export function generateRewardChoices(options: {
  readonly seed: string;
  readonly poolId: RewardPoolId;
  readonly poolProfileId?: ItemPoolProfileId;
  readonly count: number;
  readonly biasTags?: readonly string[];
  readonly excludeItemIds?: readonly ItemId[];
  readonly unlockedIds?: UnlockAccess['unlockedIds'];
  readonly context?: RewardPoolContext;
}): RewardChoice[] {
  const profile = getItemPoolWeightProfile(options.poolProfileId ?? options.poolId);
  const pool = REWARD_POOLS.find((candidate) => candidate.id === options.poolId);

  if (!pool || pool.itemIds.length === 0) {
    throw new Error(`Reward pool ${options.poolId} is empty or missing.`);
  }

  const rng = createRng(options.seed).fork(`reward-${options.poolId}-${profile.id}`);
  const excluded = new Set<ItemId>(options.excludeItemIds ?? []);
  const candidateItemIds = getProfileCandidateItemIds(profile);
  const availableItems = filterUnlockedItemIds(candidateItemIds, {
    unlockedIds: options.unlockedIds
  })
    .filter((itemId) => !excluded.has(itemId))
    .map((itemId) => getItemById(itemId));

  return selectUniqueRewards(
    rng,
    availableItems,
    options.count,
    options.biasTags ?? [],
    profile,
    options.context ?? {}
  );
}

export function generateStartingItemLoadout(
  seed: string,
  contract: StartingContract,
  options: UnlockAccess = {}
): ItemInstance[] {
  const rewardChoices = generateRewardChoices({
    seed: `${seed}:${contract.id}:field-kit`,
    poolId: 'starter',
    count: 3,
    biasTags: contract.itemBias,
    excludeItemIds: DEFAULT_FIELD_KIT,
    unlockedIds: options.unlockedIds
  });
  const itemIds = [...DEFAULT_FIELD_KIT, ...rewardChoices.map((choice) => choice.item.id)].slice(
    0,
    3
  );

  return itemIds.map((itemId, acquisitionOrder) => ({
    itemId,
    acquisitionOrder
  }));
}

export function getItemNames(instances: readonly ItemInstance[]): string[] {
  return instances.map((instance) => getItemById(instance.itemId).name);
}

function selectUniqueRewards(
  rng: Rng,
  items: readonly ItemDefinition[],
  count: number,
  biasTags: readonly string[],
  profile: ItemPoolWeightProfileDefinition,
  context: RewardPoolContext
): RewardChoice[] {
  const available = [...items];
  const selected: RewardChoice[] = [];

  while (selected.length < count && available.length > 0) {
    const weightedCandidates = available
      .map((candidate) => ({
        item: candidate,
        weight: getRewardWeight(candidate, biasTags, profile, context)
      }))
      .filter((candidate) => candidate.weight > 0);

    if (weightedCandidates.length === 0) {
      break;
    }

    const item = rng.weightedChoice(
      weightedCandidates.map((candidate) => ({
        item: candidate.item,
        weight: candidate.weight
      }))
    );

    selected.push({
      item,
      weight: getRewardWeight(item, biasTags, profile, context),
      sourceHint: getRewardSourceHint(item, profile, context),
      poolProfileId: profile.id
    });
    available.splice(available.indexOf(item), 1);
  }

  return selected;
}

export function getItemPoolWeightProfile(
  profileId: ItemPoolProfileId
): ItemPoolWeightProfileDefinition {
  const profile = ITEM_POOL_WEIGHT_PROFILES.find((candidate) => candidate.id === profileId);

  if (!profile) {
    throw new Error(`Unknown item pool weight profile: ${profileId}`);
  }

  return profile;
}

export function getRewardWeight(
  item: ItemDefinition,
  biasTags: readonly string[],
  profile: ItemPoolWeightProfileDefinition,
  context: RewardPoolContext = {}
): number {
  const rarityMultiplier = profile.rarityWeights[item.rarity] ?? 0;

  if (rarityMultiplier <= 0) {
    return 0;
  }

  const sourceMultiplier = getBestMetadataMultiplier(item.metadata.sources, {
    ...profile.sourceWeights,
    ...getContextSourceWeights(context)
  });
  const familyMultiplier = profile.familyWeights?.[item.metadata.family] ?? 1;
  const profileTagMultiplier = getBestMetadataMultiplier(item.tags, {
    ...(profile.tagWeights ?? {}),
    ...getContextTagWeights(context)
  });
  const biasMultiplier =
    1 +
    item.tags.filter((tag) => biasTags.includes(tag)).length +
    getSourceBiasCount(item, biasTags);

  return (
    item.weight *
    rarityMultiplier *
    sourceMultiplier *
    familyMultiplier *
    profileTagMultiplier *
    biasMultiplier
  );
}

function getProfileCandidateItemIds(profile: ItemPoolWeightProfileDefinition): readonly ItemId[] {
  const itemIds = profile.poolIds.flatMap((poolId) => {
    const pool = REWARD_POOLS.find((candidate) => candidate.id === poolId);

    if (!pool) {
      throw new Error(`Reward pool ${poolId} is empty or missing.`);
    }

    return pool.itemIds;
  });

  return [...new Set(itemIds)];
}

function getRewardSourceHint(
  item: ItemDefinition,
  profile: ItemPoolWeightProfileDefinition,
  context: RewardPoolContext
): string {
  const sourceWeights = {
    ...profile.sourceWeights,
    ...getContextSourceWeights(context)
  };
  const bestSource = item.metadata.sources
    .map((source) => ({
      source,
      weight: sourceWeights[source] ?? 1
    }))
    .sort((left, right) => right.weight - left.weight)[0]?.source;

  if (bestSource && bestSource !== 'combat' && bestSource !== 'starter') {
    return `${formatSourceHint(bestSource)} source`;
  }

  return `${profile.label} pool`;
}

function getBestMetadataMultiplier<TValue extends string>(
  values: readonly TValue[],
  weights: Readonly<Partial<Record<TValue, number>>>
): number {
  return Math.max(1, ...values.map((value) => weights[value] ?? 1));
}

function getSourceBiasCount(item: ItemDefinition, biasTags: readonly string[]): number {
  return item.metadata.sources.filter((source) => biasTags.includes(source)).length;
}

function getContextSourceWeights(
  context: RewardPoolContext
): Readonly<Partial<Record<ItemSource, number>>> {
  const weights: Partial<Record<ItemSource, number>> = {};

  if (context.routeKind === 'shop') {
    weights.shop = 2.5;
    weights.route = 1.4;
  }

  if (context.routeKind === 'repair') {
    weights.route = 2;
  }

  if (context.routeKind === 'elite') {
    weights.elite = 3;
    weights.boss = 1.5;
  }

  if (context.routeKind === 'vault') {
    weights.vault = 3;
  }

  if (context.routeKind === 'glitch') {
    weights.route = 2;
    weights.vault = 1.8;
  }

  if (context.routeKind === 'factionAmbush') {
    weights.faction = 3;
    weights.elite = 1.6;
  }

  if (context.sectorId === 'sector_lunar_surface') {
    weights.lunar = 3.5;
  }

  if (context.bossGate) {
    weights.boss = Math.max(weights.boss ?? 1, 2.5);
  }

  return weights;
}

function getContextTagWeights(
  context: RewardPoolContext
): Readonly<Partial<Record<ItemTag, number>>> {
  const weights: Partial<Record<ItemTag, number>> = {};

  if (context.routeKind === 'repair') {
    weights.shield = 1.5;
    weights.armor = 1.5;
    weights.credit = 1.2;
  }

  if (context.routeKind === 'elite') {
    weights.overkill = 1.7;
    weights.drone = 1.4;
    weights.missile = 1.3;
  }

  if (context.routeKind === 'vault' || context.routeKind === 'glitch') {
    weights.curse = 1.7;
    weights.phase = 1.4;
    weights.relic = 1.4;
  }

  if (context.routeKind === 'shop') {
    weights.credit = 1.6;
    weights.magnet = 1.4;
  }

  if (context.sectorId === 'sector_lunar_surface') {
    weights.scrap = 1.6;
    weights.laser = 1.35;
    weights.phase = Math.max(weights.phase ?? 1, 1.25);
  }

  for (const tag of getFactionBiasTags(context.bossFactionId)) {
    weights[tag] = Math.max(weights[tag] ?? 1, 1.45);
  }

  return weights;
}

function getFactionBiasTags(factionId: FactionId | undefined): readonly ItemTag[] {
  if (factionId === 'faction_corporate_ledger') {
    return ['credit', 'laser'];
  }

  if (factionId === 'faction_bloom_hive') {
    return ['phase', 'drone'];
  }

  if (factionId === 'faction_void_corsairs') {
    return ['phase', 'ricochet', 'curse'];
  }

  if (factionId === 'faction_scrap_court') {
    return ['missile', 'overkill'];
  }

  return [];
}

function formatSourceHint(source: ItemSource): string {
  switch (source) {
    case 'starter':
      return 'starter';
    case 'combat':
      return 'combat';
    case 'shop':
      return 'shop';
    case 'vault':
      return 'vault';
    case 'elite':
      return 'elite';
    case 'boss':
      return 'boss';
    case 'faction':
      return 'faction';
    case 'lunar':
      return 'lunar';
    case 'route':
      return 'route';
    case 'unlock':
      return 'unlock';
  }
}
