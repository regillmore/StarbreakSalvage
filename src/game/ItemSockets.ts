import { getItemById, type ItemDefinition, type ItemId } from '../content/items';
import {
  getShipModuleById,
  type ShipModuleId,
  type ShipUpgradeSocketType
} from '../content/shipModules';
import type { EngineeringSnapshot } from './Foundry';
import type { ItemInstance, ItemSocketAssignment } from './Rewards';

export interface ItemSocketSlot {
  readonly componentId: string;
  readonly hardpointId: string;
  readonly moduleId: ShipModuleId;
  readonly moduleName: string;
  readonly socketIndex: number;
  readonly type: ShipUpgradeSocketType;
  readonly circuitOrder: number;
}

export interface ItemSocketCircuitSummary {
  readonly fitted: number;
  readonly capacity: number;
  readonly unfitted: number;
  readonly chain: readonly string[];
}

const OFFENSIVE_TAGS = new Set(['arc', 'laser', 'plasma', 'ricochet', 'split']);
const ORDNANCE_TAGS = new Set(['bomb', 'missile', 'overkill']);
const DEFENSE_TAGS = new Set(['armor', 'revenge', 'shield']);
const DRIVE_TAGS = new Set(['heat', 'phase']);
const UTILITY_TAGS = new Set(['credit', 'magnet', 'relic', 'scrap']);

export function getItemCompatibleSocketTypes(
  itemOrId: ItemDefinition | ItemId
): readonly Exclude<ShipUpgradeSocketType, 'flex'>[] {
  const item = typeof itemOrId === 'string' ? getItemById(itemOrId) : itemOrId;
  const types: Exclude<ShipUpgradeSocketType, 'flex'>[] = [];
  const add = (type: Exclude<ShipUpgradeSocketType, 'flex'>): void => {
    if (!types.includes(type)) types.push(type);
  };

  if (item.tags.some((tag) => OFFENSIVE_TAGS.has(tag))) add('weapon');
  if (item.tags.some((tag) => ORDNANCE_TAGS.has(tag))) add('ordnance');
  if (item.tags.some((tag) => DEFENSE_TAGS.has(tag)) || item.hooks.includes('onPlayerHit')) {
    add('defense');
  }
  if (
    item.tags.some((tag) => DRIVE_TAGS.has(tag)) ||
    item.hooks.includes('onGraze') ||
    item.hooks.includes('onSpecialUsed')
  ) {
    add('drive');
  }
  if (
    item.tags.some((tag) => UTILITY_TAGS.has(tag)) ||
    item.hooks.some((hook) =>
      [
        'onPickupCollected',
        'onSectorStart',
        'onRouteChosen',
        'onShopEntered',
        'onRewardGenerated',
        'onEnvironmentObjectDestroyed'
      ].includes(hook)
    )
  ) {
    add('utility');
  }
  if (item.tags.includes('drone')) add('drone');
  if (
    item.tags.includes('curse') ||
    item.rarity === 'prototype' ||
    item.rarity === 'cursed' ||
    item.hooks.includes('onBossPhaseChanged')
  ) {
    add('experimental');
  }
  if (
    types.length === 0 ||
    item.hooks.includes('onFire') ||
    item.hooks.includes('onProjectileSpawn')
  ) {
    add('weapon');
  }
  return types;
}

export function getItemSocketSlots(snapshot: EngineeringSnapshot): ItemSocketSlot[] {
  let circuitOrder = 0;
  return [...snapshot.mounts]
    .sort(
      (left, right) =>
        left.installationOrder - right.installationOrder ||
        left.hardpointId.localeCompare(right.hardpointId)
    )
    .flatMap((mount) => {
      const component = snapshot.components.find((candidate) => candidate.id === mount.componentId);
      if (!component) return [];
      const module = getShipModuleById(component.moduleId);
      return module.upgradeSockets.map((type, socketIndex) => ({
        componentId: component.id,
        hardpointId: mount.hardpointId,
        moduleId: module.id,
        moduleName: module.presentation.shortName,
        socketIndex,
        type,
        circuitOrder: circuitOrder++
      }));
    })
    .sort(
      (left, right) =>
        left.circuitOrder - right.circuitOrder ||
        left.componentId.localeCompare(right.componentId) ||
        left.socketIndex - right.socketIndex
    );
}

export function canFitItemInSocket(itemId: ItemId, slot: ItemSocketSlot): boolean {
  return slot.type === 'flex' || getItemCompatibleSocketTypes(itemId).includes(slot.type);
}

export function reconcileItemSockets(
  items: readonly ItemInstance[],
  snapshot: EngineeringSnapshot
): ItemInstance[] {
  const slots = getItemSocketSlots(snapshot);
  const claimed = new Set<string>();
  return [...items]
    .sort((left, right) => left.acquisitionOrder - right.acquisitionOrder)
    .map((item) => {
      const slot = item.socket
        ? slots.find(
            (candidate) =>
              candidate.componentId === item.socket?.componentId &&
              candidate.socketIndex === item.socket.socketIndex
          )
        : null;
      const key = slot ? getSlotKey(slot) : '';
      if (!slot || claimed.has(key) || !canFitItemInSocket(item.itemId, slot)) {
        return { ...item, socket: null };
      }
      claimed.add(key);
      return { ...item, socket: createAssignment(slot) };
    });
}

export function autoFitItemSockets(
  items: readonly ItemInstance[],
  snapshot: EngineeringSnapshot
): ItemInstance[] {
  const reconciled = reconcileItemSockets(items, snapshot);
  const slots = getItemSocketSlots(snapshot);
  const claimed = new Set(
    reconciled.flatMap((item) => (item.socket ? [getAssignmentKey(item.socket)] : []))
  );
  return reconciled.map((item) => {
    if (item.socket) return item;
    const compatible =
      slots.find(
        (slot) =>
          slot.type !== 'flex' &&
          !claimed.has(getSlotKey(slot)) &&
          canFitItemInSocket(item.itemId, slot)
      ) ??
      slots.find(
        (slot) =>
          slot.type === 'flex' &&
          !claimed.has(getSlotKey(slot)) &&
          canFitItemInSocket(item.itemId, slot)
      );
    if (!compatible) return item;
    claimed.add(getSlotKey(compatible));
    return { ...item, socket: createAssignment(compatible) };
  });
}

export function autoFitItemSocket(
  items: readonly ItemInstance[],
  snapshot: EngineeringSnapshot,
  acquisitionOrder: number
): ItemInstance[] {
  const reconciled = reconcileItemSockets(items, snapshot);
  const selected = reconciled.find((item) => item.acquisitionOrder === acquisitionOrder);
  if (!selected || selected.socket) return reconciled;
  const claimed = new Set(
    reconciled.flatMap((item) => (item.socket ? [getAssignmentKey(item.socket)] : []))
  );
  const slots = getItemSocketSlots(snapshot);
  const target =
    slots.find(
      (slot) =>
        slot.type !== 'flex' &&
        !claimed.has(getSlotKey(slot)) &&
        canFitItemInSocket(selected.itemId, slot)
    ) ??
    slots.find(
      (slot) =>
        slot.type === 'flex' &&
        !claimed.has(getSlotKey(slot)) &&
        canFitItemInSocket(selected.itemId, slot)
    );
  return target
    ? fitItemInSocket(
        reconciled,
        snapshot,
        acquisitionOrder,
        target.componentId,
        target.socketIndex
      )
    : reconciled;
}

export function fitItemInSocket(
  items: readonly ItemInstance[],
  snapshot: EngineeringSnapshot,
  acquisitionOrder: number,
  componentId: string,
  socketIndex: number
): ItemInstance[] {
  const reconciled = reconcileItemSockets(items, snapshot);
  const slots = getItemSocketSlots(snapshot);
  const target = slots.find(
    (slot) => slot.componentId === componentId && slot.socketIndex === socketIndex
  );
  const selected = reconciled.find((item) => item.acquisitionOrder === acquisitionOrder);
  if (!target || !selected || !canFitItemInSocket(selected.itemId, target)) return reconciled;
  const oldAssignment = selected.socket ?? null;
  const occupant = reconciled.find(
    (item) => item.socket && getAssignmentKey(item.socket) === getSlotKey(target)
  );
  const oldSlot = oldAssignment
    ? slots.find((slot) => getSlotKey(slot) === getAssignmentKey(oldAssignment))
    : null;

  return reconciled.map((item) => {
    if (item.acquisitionOrder === acquisitionOrder) {
      return { ...item, socket: createAssignment(target) };
    }
    if (occupant && item.acquisitionOrder === occupant.acquisitionOrder) {
      return {
        ...item,
        socket:
          oldSlot && canFitItemInSocket(item.itemId, oldSlot) ? createAssignment(oldSlot) : null
      };
    }
    return item;
  });
}

export function unfitItem(
  items: readonly ItemInstance[],
  acquisitionOrder: number
): ItemInstance[] {
  return items.map((item) =>
    item.acquisitionOrder === acquisitionOrder ? { ...item, socket: null } : item
  );
}

export function getActiveFittedItems(
  items: readonly ItemInstance[],
  snapshot: EngineeringSnapshot
): ItemInstance[] {
  return reconcileItemSockets(items, snapshot)
    .filter((item) => Boolean(item.socket))
    .sort(
      (left, right) =>
        (left.socket?.circuitOrder ?? Number.MAX_SAFE_INTEGER) -
          (right.socket?.circuitOrder ?? Number.MAX_SAFE_INTEGER) ||
        left.acquisitionOrder - right.acquisitionOrder
    );
}

export function createItemSocketCircuitSummary(
  items: readonly ItemInstance[],
  snapshot: EngineeringSnapshot
): ItemSocketCircuitSummary {
  const reconciled = reconcileItemSockets(items, snapshot);
  const active = getActiveFittedItems(reconciled, snapshot);
  return {
    fitted: active.length,
    capacity: getItemSocketSlots(snapshot).length,
    unfitted: reconciled.length - active.length,
    chain: active.map((item) => getItemById(item.itemId).name)
  };
}

function createAssignment(slot: ItemSocketSlot): ItemSocketAssignment {
  return {
    componentId: slot.componentId,
    socketIndex: slot.socketIndex,
    circuitOrder: slot.circuitOrder
  };
}

function getSlotKey(slot: Pick<ItemSocketSlot, 'componentId' | 'socketIndex'>): string {
  return `${slot.componentId}:${slot.socketIndex}`;
}

function getAssignmentKey(
  assignment: Pick<ItemSocketAssignment, 'componentId' | 'socketIndex'>
): string {
  return `${assignment.componentId}:${assignment.socketIndex}`;
}
