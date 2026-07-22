import type { ItemPoolProfileId, RewardPoolId } from '../content/items';
import type { RouteKind, RunSkeleton, SectorRoute, StartingContract } from './Generation';
import {
  getCurrentSector,
  getInterActEffectsForSector,
  getOwnedItemIds,
  getRewardModifiersForSector,
  type RunSessionState
} from './RunSession';
import { applyCombinedHooks } from './CombinedHooks';
import { createEngineeringCombatProfile } from './Foundry';
import { generateRewardChoices, type RewardChoice, type RewardContextKind } from './Rewards';
import {
  getMarketEchoLocatorRewardBiasTags,
  getMarketEchoLocatorRewardChoiceBonus,
  getMiningLaserTransitRewardBiasTags,
  getRewardUpgradeBiasTags,
  getRewardUpgradeChoiceBonus
} from './UpgradeEffects';
import { createActEconomyProfile } from './ActEconomy';
import { createCarrierInfluence } from './CarrierCommand';
import { getActiveFittedItems } from './ItemSockets';

export function generateSectorRewardChoices(options: {
  readonly run: RunSkeleton;
  readonly session: RunSessionState;
  readonly contract: StartingContract;
  readonly routeKind?: RouteKind;
  readonly count?: number;
}): RewardChoice[] {
  const sector = getCurrentSector(options.run, options.session);
  const rewardContext: RewardContextKind = options.routeKind ?? 'sectorClear';
  const actEconomy = createActEconomyProfile(sector);
  const modifiers = getRewardModifiersForSector(
    options.session,
    options.session.currentSectorIndex
  );
  const interActEffects = getInterActEffectsForSector(options.session, sector);
  const poolOverride = [...modifiers]
    .reverse()
    .find((modifier) => modifier.poolIdOverride)?.poolIdOverride;
  const poolId = poolOverride ?? (rewardContext === 'vault' ? 'vault' : 'combat');
  const modifierBiasTags = modifiers.flatMap((modifier) => modifier.biasTags);
  const upgradeChoiceBonus = getRewardUpgradeChoiceBonus(options.run.upgradeEffects, rewardContext);
  const upgradeBiasTags = getRewardUpgradeBiasTags(options.run.upgradeEffects, rewardContext);
  const fittedItems = getActiveFittedItems(
    options.session.itemInstances,
    options.session.engineering.committed
  );
  const legacyMarketEchoActive = fittedItems.some(
    (instance) => instance.itemId === 'item_market_echo_locator'
  );
  const legacyMiningLaserTransitActive = fittedItems.some(
    (instance) => instance.itemId === 'item_mining_laser_transit'
  );
  const marketEchoChoiceBonus = getMarketEchoLocatorRewardChoiceBonus(
    options.run.upgradeEffects,
    rewardContext,
    legacyMarketEchoActive
  );
  const marketEchoBiasTags = getMarketEchoLocatorRewardBiasTags(
    options.run.upgradeEffects,
    rewardContext,
    legacyMarketEchoActive
  );
  const miningLaserTransitBiasTags = getMiningLaserTransitRewardBiasTags(
    options.run.upgradeEffects,
    rewardContext,
    legacyMiningLaserTransitActive
  );
  const engineering = createEngineeringCombatProfile(options.session.engineering);
  const carrier = createCarrierInfluence(options.run.carrierPlan, options.session.carrier);
  const rewardChoiceCount = Math.max(
    1,
    Math.floor((options.count ?? 3) + upgradeChoiceBonus + marketEchoChoiceBonus)
  );
  const rewardPayload = applyCombinedHooks(
    'onRewardGenerated',
    fittedItems,
    engineering.hooks,
    {
      routeKind: rewardContext,
      sectorIndex: sector.index,
      poolId,
      choiceCount: rewardChoiceCount,
      biasTags: [
        ...options.contract.itemBias,
        ...getRouteBiasTags(rewardContext),
        ...modifierBiasTags,
        ...upgradeBiasTags,
        ...marketEchoBiasTags,
        ...miningLaserTransitBiasTags,
        ...interActEffects.rewardBiasTags,
        ...actEconomy.rewardBiasTags,
        ...carrier.rewardBiasTags
      ]
    },
    { maxApplications: engineering.procBudget }
  );
  const poolProfileId = getSectorRewardPoolProfileId(rewardPayload.poolId, rewardContext, sector);
  const rewardSeedSuffix =
    rewardContext === 'sectorClear' ? 'reward-sectorClear' : `route-${rewardContext}`;

  return generateRewardChoices({
    seed: `${sector.rewardPoolSeed}:sector-${sector.index}:${rewardSeedSuffix}`,
    poolId: rewardPayload.poolId,
    poolProfileId,
    // Choice breadth is a permanent-progression affordance. Run-local systems may
    // still bias the manifest through this hook, but cannot passively widen it.
    count: rewardChoiceCount,
    biasTags: rewardPayload.biasTags,
    excludeItemIds: getOwnedItemIds(options.session),
    unlockedIds: options.run.unlockedIds,
    context: {
      routeKind: rewardContext,
      sectorId: sector.sectorId,
      sectorRole: sector.sectorName,
      bossFactionId: sector.bossFactionId,
      bossGate: sector.objective.bossRequired,
      actEconomy
    }
  });
}

function getSectorRewardPoolProfileId(
  poolId: RewardPoolId,
  routeKind: RewardContextKind,
  sector: SectorRoute
): ItemPoolProfileId {
  if (poolId === 'vault') {
    return 'vault';
  }

  if (poolId === 'starterCore') {
    return 'starterCore';
  }

  if (routeKind === 'elite') {
    return 'elite';
  }

  if (routeKind === 'factionAmbush') {
    return 'faction';
  }

  if (sector.sectorId === 'sector_lunar_surface') {
    return 'lunar';
  }

  if (sector.objective.bossRequired) {
    return 'boss';
  }

  if (routeKind === 'shop' || routeKind === 'repair' || routeKind === 'glitch') {
    return 'route';
  }

  return 'combat';
}

function getRouteBiasTags(routeKind: RewardContextKind): readonly string[] {
  if (routeKind === 'shop' || routeKind === 'repair') {
    return ['credit', 'shield'];
  }

  if (routeKind === 'elite' || routeKind === 'factionAmbush') {
    return ['overkill', 'drone'];
  }

  if (routeKind === 'vault' || routeKind === 'glitch') {
    return ['curse', 'phase'];
  }

  return [];
}
