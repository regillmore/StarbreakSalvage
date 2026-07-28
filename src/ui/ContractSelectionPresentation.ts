import { getItemById } from '../content/items';
import { createEngineeringState } from '../game/Foundry';
import type { RunSkeleton, StartingContract } from '../game/Generation';
import { autoFitItemSockets, getActiveFittedItems } from '../game/ItemSockets';
import { generateStartingItemLoadout } from '../game/Rewards';
import {
  createFoundryDashboardModel,
  type FoundryAttackSimulationModel
} from './FoundryPresentation';
import { createItemCardViewModel, type ItemCardViewModel } from './ItemCardViewModel';

export interface ContractMetricModel {
  readonly id: 'hull' | 'speed' | 'thermal' | 'bombs' | 'economy';
  readonly glyph: string;
  readonly label: string;
  readonly value: string;
}

export interface ContractChoicePresentationModel {
  readonly contract: StartingContract;
  readonly ignition: ItemCardViewModel;
  readonly attackSimulation: FoundryAttackSimulationModel;
  readonly metrics: readonly ContractMetricModel[];
  readonly ariaLabel: string;
}

export function createContractChoicePresentationModels(
  run: RunSkeleton
): ContractChoicePresentationModel[] {
  return run.contracts.map((contract) => createContractChoicePresentationModel(run, contract));
}

export function createContractChoicePresentationModel(
  run: RunSkeleton,
  contract: StartingContract
): ContractChoicePresentationModel {
  const engineering = createEngineeringState(contract.loadout);
  const fittedItems = autoFitItemSockets(
    generateStartingItemLoadout(run.seed, contract, { unlockedIds: run.unlockedIds }),
    engineering.committed
  );
  const activeItems = getActiveFittedItems(fittedItems, engineering.committed);
  const ignitionInstance = activeItems[0];

  if (!ignitionInstance || activeItems.length !== 1) {
    throw new Error(`Contract ${contract.id} must resolve exactly one fitted ignition core.`);
  }

  const ignitionItem = getItemById(ignitionInstance.itemId);
  const ignition = createItemCardViewModel(ignitionItem, {
    sourceLabel: 'Seeded ignition',
    acquisitionOrder: ignitionInstance.acquisitionOrder
  });
  const attackSimulation = createFoundryDashboardModel(engineering, activeItems).attackSimulation;
  const metrics: readonly ContractMetricModel[] = [
    { id: 'hull', glyph: 'HUL', label: 'Hull', value: String(contract.shipStats.maxHull) },
    { id: 'speed', glyph: 'SPD', label: 'Speed', value: String(contract.shipStats.speed) },
    {
      id: 'thermal',
      glyph: 'HCAP',
      label: 'Heat capacity',
      value: `${Math.round((contract.shipStats.weaponHeatCapacityMultiplier ?? 1) * 100)}%`
    },
    { id: 'bombs', glyph: 'BMB', label: 'Bombs', value: String(contract.shipStats.bombCapacity) },
    {
      id: 'economy',
      glyph: 'START',
      label: 'Credits / salvage',
      value: `${contract.startingCredits} / ${contract.startingSalvage}`
    }
  ];

  return {
    contract,
    ignition,
    attackSimulation,
    metrics,
    ariaLabel: `${contract.shipName}, ${contract.startingWeaponName} ${contract.startingWeaponPattern}, seeded ignition ${ignition.name}. ${contract.summary}`
  };
}
