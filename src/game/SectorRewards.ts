import type { RouteKind, RunSkeleton, StartingContract } from './Generation';
import {
  getCurrentSector,
  getOwnedItemIds,
  getRewardModifiersForSector,
  type RunSessionState
} from './RunSession';
import { applyItemHooks } from './ItemHooks';
import { generateRewardChoices, type RewardChoice } from './Rewards';
import { getRewardUpgradeBiasTags, getRewardUpgradeChoiceBonus } from './UpgradeEffects';

export function generateSectorRewardChoices(options: {
  readonly run: RunSkeleton;
  readonly session: RunSessionState;
  readonly contract: StartingContract;
  readonly routeKind: RouteKind;
  readonly count?: number;
}): RewardChoice[] {
  const sector = getCurrentSector(options.run, options.session);
  const modifiers = getRewardModifiersForSector(options.session, sector.index);
  const poolOverride = [...modifiers]
    .reverse()
    .find((modifier) => modifier.poolIdOverride)?.poolIdOverride;
  const poolId = poolOverride ?? (options.routeKind === 'vault' ? 'vault' : 'combat');
  const choiceBonus = modifiers.reduce((total, modifier) => total + modifier.choiceBonus, 0);
  const modifierBiasTags = modifiers.flatMap((modifier) => modifier.biasTags);
  const upgradeChoiceBonus = getRewardUpgradeChoiceBonus(
    options.run.upgradeEffects,
    options.routeKind
  );
  const upgradeBiasTags = getRewardUpgradeBiasTags(options.run.upgradeEffects, options.routeKind);
  const rewardPayload = applyItemHooks('onRewardGenerated', options.session.itemInstances, {
    routeKind: options.routeKind,
    sectorIndex: sector.index,
    poolId,
    choiceCount: options.count ?? 3 + choiceBonus + upgradeChoiceBonus,
    biasTags: [
      ...options.contract.itemBias,
      ...getRouteBiasTags(options.routeKind),
      ...modifierBiasTags,
      ...upgradeBiasTags
    ]
  });

  return generateRewardChoices({
    seed: `${sector.rewardPoolSeed}:sector-${sector.index}:route-${options.routeKind}`,
    poolId: rewardPayload.poolId,
    count: Math.max(1, Math.floor(rewardPayload.choiceCount)),
    biasTags: rewardPayload.biasTags,
    excludeItemIds: getOwnedItemIds(options.session),
    unlockedIds: options.run.unlockedIds
  });
}

function getRouteBiasTags(routeKind: RouteKind): readonly string[] {
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
