import { getShipModuleById } from '../content/shipModules';
import { createActEconomyProfile } from './ActEconomy';
import {
  generatePrimaryWeaponOffer,
  type EngineeringSnapshot,
  type FoundryComponentInstance
} from './Foundry';
import { createRunGenerationSaveFingerprint, type RunSkeleton } from './Generation';
import {
  getCurrentSector,
  getIncomingRewardRouteKind,
  getShopRerollCount,
  type RunSessionState
} from './RunSession';
import { getShopPrimaryWeaponPrice } from './Shops';

export interface ShopPrimaryWeaponOffer {
  readonly component: FoundryComponentInstance;
  readonly price: number;
  readonly depleted: boolean;
}

export function createSectorPrimaryWeaponOffer(
  run: RunSkeleton,
  session: RunSessionState
): FoundryComponentInstance {
  const sector = getCurrentSector(run, session);
  const routeKind = getIncomingRewardRouteKind(session, session.currentSectorIndex);
  return generatePrimaryWeaponOffer({
    seed: sector.rewardPoolSeed,
    saveFingerprint: getGenerationFingerprint(run),
    sectorIndex: sector.index,
    ...(routeKind ? { routeKind } : {}),
    sectorId: sector.sectorId,
    bossRequired: sector.objective.bossRequired,
    offerKey: 'sector-reward',
    state: session.engineering
  });
}

export function createShopPrimaryWeaponOffer(
  run: RunSkeleton,
  session: RunSessionState
): ShopPrimaryWeaponOffer {
  const sector = getCurrentSector(run, session);
  const rerollCount = getShopRerollCount(session, sector.index);
  const component = generatePrimaryWeaponOffer({
    seed: sector.shopSeed,
    saveFingerprint: getGenerationFingerprint(run),
    sectorIndex: sector.index,
    routeKind: 'shop',
    source: 'shop',
    sectorId: sector.sectorId,
    bossRequired: sector.objective.bossRequired,
    offerKey: `shop-reroll-${rerollCount}`,
    state: session.engineering
  });
  return {
    component,
    price: getShopPrimaryWeaponPrice(component, createActEconomyProfile(sector)),
    depleted: session.engineering.committed.components.some(
      (candidate) => candidate.id === component.id
    )
  };
}

export function getInstalledPrimaryWeapon(
  snapshot: EngineeringSnapshot
): FoundryComponentInstance | null {
  for (const mount of snapshot.mounts) {
    const component = snapshot.components.find((candidate) => candidate.id === mount.componentId);
    if (component && getShipModuleById(component.moduleId).slot === 'primary') return component;
  }
  return null;
}

function getGenerationFingerprint(run: RunSkeleton): string {
  return createRunGenerationSaveFingerprint(run.unlockedIds, run.upgradeEffects);
}
