import type { RouteKind, RunSkeleton, StartingContract } from './Generation';
import {
  getCurrentSector,
  getOwnedItemIds,
  getRewardModifiersForSector,
  type RunSessionState
} from './RunSession';
import { generateRewardChoices, type RewardChoice } from './Rewards';

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

  return generateRewardChoices({
    seed: `${sector.rewardPoolSeed}:sector-${sector.index}:route-${options.routeKind}`,
    poolId,
    count: options.count ?? 3 + choiceBonus,
    biasTags: [
      ...options.contract.itemBias,
      ...getRouteBiasTags(options.routeKind),
      ...modifierBiasTags
    ],
    excludeItemIds: getOwnedItemIds(options.session)
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
