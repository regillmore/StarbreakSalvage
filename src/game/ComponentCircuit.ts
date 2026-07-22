import type { ComponentQualityId, ComponentSource } from '../content/engineering';
import {
  getShipModuleById,
  type ShipModuleId,
  type ShipUpgradeSocketType
} from '../content/shipModules';
import { ACT_ROUTE_NODE_COUNT } from './ActRouteGraph';

export type ComponentCircuitCapacity = 0 | 2 | 3 | 4 | 5 | 6;

export interface ComponentCircuitSource {
  readonly moduleId: ShipModuleId;
  readonly qualityId?: ComponentQualityId;
  readonly source: ComponentSource;
  readonly acquiredSectorIndex: number;
}

const QUALITY_SOCKET_BONUS: Readonly<Record<ComponentQualityId, number>> = {
  standard: 0,
  tuned: 1,
  prototype: 2,
  relic: 3
};

export function getComponentCircuitCapacity(
  component: ComponentCircuitSource
): ComponentCircuitCapacity {
  const module = getShipModuleById(component.moduleId);
  if (module.slot !== 'primary') return 0;
  if (component.source === 'contract') return 3;

  const baseCapacity = component.acquiredSectorIndex <= ACT_ROUTE_NODE_COUNT ? 2 : 3;
  return Math.min(6, baseCapacity + QUALITY_SOCKET_BONUS[component.qualityId ?? 'standard']) as
    2 | 3 | 4 | 5 | 6;
}

export function getComponentCircuitSlotTypes(
  component: ComponentCircuitSource
): readonly ShipUpgradeSocketType[] {
  const capacity = getComponentCircuitCapacity(component);
  if (capacity === 0) return [];

  const module = getShipModuleById(component.moduleId);
  const nativeType =
    module.upgradeSockets.find((type) => type !== 'flex') ?? module.upgradeSockets[0] ?? 'flex';
  const flexibleType = module.upgradeSockets.includes('flex')
    ? 'flex'
    : (module.upgradeSockets[1] ?? nativeType);
  return Array.from({ length: capacity }, (_value, index) =>
    index % 2 === 0 ? nativeType : flexibleType
  );
}
