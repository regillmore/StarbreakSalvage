import {
  ACT_ROUTE_CONTRACTS,
  type ActRouteContractDefinition
} from '../content/actRouteContracts';
import type { ActId } from '../content/acts';
import type { BackgroundId } from '../content/backgrounds';
import type { FactionId } from '../content/factions';
import type { SectorId, SectorObjectiveKind } from '../content/sectors';
import type { UnlockId } from '../content/unlocks';

export interface ActRouteEligibilityContext {
  readonly actId: ActId;
  readonly sectorId: SectorId;
  readonly backgroundId: BackgroundId;
  readonly bossFactionId: FactionId;
  readonly objectiveKind: SectorObjectiveKind;
  readonly unlockedIds: readonly UnlockId[];
}

export function getEligibleActRouteContracts(
  context: ActRouteEligibilityContext,
  contracts: readonly ActRouteContractDefinition[] = ACT_ROUTE_CONTRACTS
): ActRouteContractDefinition[] {
  const unlockedIds = new Set(context.unlockedIds);

  return contracts.filter(
    (contract) =>
      contract.actId === context.actId &&
      contract.sectorFit.allowedSectorIds.includes(context.sectorId) &&
      contract.objectiveFamilies.includes(context.objectiveKind) &&
      contract.requiredUnlockIds.every((unlockId) => unlockedIds.has(unlockId))
  );
}

export function getActRouteContractWeight(
  contract: ActRouteContractDefinition,
  context: ActRouteEligibilityContext
): number {
  return (
    contract.weight +
    (contract.sectorFit.preferredSectorIds.includes(context.sectorId) ? 3 : 0) +
    (contract.factionFit.includes(context.bossFactionId) ? 2 : 0) +
    (contract.backgroundHooks.includes(context.backgroundId) ? 1 : 0)
  );
}

export function formatActRouteContractDebug(contract: ActRouteContractDefinition): string {
  return `${contract.label} ${contract.kind} ${contract.tags.join('/')}`;
}
