import type { ComponentSource } from '../content/engineering';
import {
  getShipModuleById,
  type ShipModuleId,
  type ShipUpgradeSocketType
} from '../content/shipModules';
import { ACT_ROUTE_NODE_COUNT } from './ActRouteGraph';

export type ComponentCircuitCapacity = 1 | 2 | 3;

export interface ComponentCircuitSource {
  readonly moduleId: ShipModuleId;
  readonly source: ComponentSource;
  readonly acquiredSectorIndex: number;
}

export function getComponentCircuitCapacity(
  component: ComponentCircuitSource
): ComponentCircuitCapacity {
  if (component.source === 'contract') return 1;
  return component.acquiredSectorIndex <= ACT_ROUTE_NODE_COUNT ? 2 : 3;
}

export function getComponentCircuitSlotTypes(
  component: ComponentCircuitSource
): readonly ShipUpgradeSocketType[] {
  const capacity = getComponentCircuitCapacity(component);
  if (capacity === 1) return ['flex'];

  const module = getShipModuleById(component.moduleId);
  const nativeType =
    module.upgradeSockets.find((type) => type !== 'flex') ?? module.upgradeSockets[0] ?? 'flex';
  const flexibleType = module.upgradeSockets.includes('flex')
    ? 'flex'
    : (module.upgradeSockets[1] ?? nativeType);
  const template: readonly ShipUpgradeSocketType[] = [nativeType, flexibleType, nativeType];
  return template.slice(0, capacity);
}
