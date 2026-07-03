import type { RouteKind, RunSkeleton, StartingContract } from './Generation';
import { getCurrentSector, getOwnedItemIds, type RunSessionState } from './RunSession';
import { generateRewardChoices, type RewardChoice } from './Rewards';

export function generateSectorRewardChoices(options: {
  readonly run: RunSkeleton;
  readonly session: RunSessionState;
  readonly contract: StartingContract;
  readonly routeKind: RouteKind;
  readonly count?: number;
}): RewardChoice[] {
  const sector = getCurrentSector(options.run, options.session);
  const poolId = options.routeKind === 'vault' ? 'vault' : 'combat';

  return generateRewardChoices({
    seed: `${sector.rewardPoolSeed}:sector-${sector.index}:route-${options.routeKind}`,
    poolId,
    count: options.count ?? 3,
    biasTags: [...options.contract.itemBias, ...getRouteBiasTags(options.routeKind)],
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
