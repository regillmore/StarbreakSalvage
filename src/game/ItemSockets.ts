import { getItemById, type ItemDefinition, type ItemId } from '../content/items';
import {
  getShipModuleById,
  type ShipModuleId,
  type ShipUpgradeSocketType
} from '../content/shipModules';
import { getComponentCircuitSlotTypes } from './ComponentCircuit';
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
  readonly open: number;
  readonly unfitted: number;
  readonly chain: readonly string[];
  readonly channels: readonly ItemCircuitChannelSummary[];
  readonly extensions: readonly ItemCircuitExtensionSummary[];
}

export interface ItemCircuitChannelSummary {
  readonly type: ShipUpgradeSocketType;
  readonly count: number;
}

export interface ItemCircuitExtensionSummary {
  readonly componentId: string;
  readonly moduleName: string;
  readonly capacity: number;
  readonly channels: readonly ShipUpgradeSocketType[];
}

export type ItemCircuitMoveDirection = -1 | 1;

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
      return getComponentCircuitSlotTypes(component).map((type, socketIndex) => ({
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
  const requested = items.filter((item) => Boolean(item.socket)).sort(compareCircuitOrder);
  const orderClaims = new Set<number>();
  const requestedOrders = new Map<number, number>();
  let nextOrder = getNextCircuitOrder(items);

  for (const item of requested) {
    const requestedOrder = item.socket?.circuitOrder ?? nextOrder;
    const circuitOrder = orderClaims.has(requestedOrder) ? nextOrder++ : requestedOrder;
    orderClaims.add(circuitOrder);
    requestedOrders.set(item.acquisitionOrder, circuitOrder);
  }

  const assignments = routeCircuitItems(requested, slots, requestedOrders);
  const claimed = new Set<string>();
  return [...items]
    .sort((left, right) => left.acquisitionOrder - right.acquisitionOrder)
    .map((item) => {
      if (!item.socket) return { ...item, socket: null };
      const assignment = assignments.get(item.acquisitionOrder);
      if (!assignment || claimed.has(getAssignmentKey(assignment))) {
        return { ...item, socket: null };
      }
      claimed.add(getAssignmentKey(assignment));
      return { ...item, socket: assignment };
    });
}

export function autoFitItemSockets(
  items: readonly ItemInstance[],
  snapshot: EngineeringSnapshot
): ItemInstance[] {
  const reconciled = reconcileItemSockets(items, snapshot);
  const slots = getItemSocketSlots(snapshot);
  const requestedOrders = new Map<number, number>();
  let nextOrder = getNextCircuitOrder(reconciled);
  for (const item of reconciled) {
    requestedOrders.set(
      item.acquisitionOrder,
      item.socket?.circuitOrder ?? nextOrder++
    );
  }
  const assignments = routeCircuitItems(reconciled, slots, requestedOrders);
  return reconciled.map((item) => {
    const assignment = assignments.get(item.acquisitionOrder);
    return assignment ? { ...item, socket: assignment } : { ...item, socket: null };
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
  return fitItemInCircuit(reconciled, snapshot, acquisitionOrder);
}

export function canFitItemInCircuit(
  items: readonly ItemInstance[],
  snapshot: EngineeringSnapshot,
  acquisitionOrder: number
): boolean {
  const reconciled = reconcileItemSockets(items, snapshot);
  const selected = reconciled.find((item) => item.acquisitionOrder === acquisitionOrder);
  if (!selected || selected.socket) return false;
  const claimed = new Set(
    reconciled.flatMap((item) => (item.socket ? [getAssignmentKey(item.socket)] : []))
  );
  return Boolean(findOpenCircuitSlot(selected.itemId, getItemSocketSlots(snapshot), claimed));
}

export function fitItemInCircuit(
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
  const target = findOpenCircuitSlot(selected.itemId, getItemSocketSlots(snapshot), claimed);
  if (!target) return reconciled;
  const circuitOrder = getNextCircuitOrder(reconciled);
  return reconciled.map((item) =>
    item.acquisitionOrder === acquisitionOrder
      ? { ...item, socket: createAssignment(target, circuitOrder) }
      : item
  );
}

export function moveItemInCircuit(
  items: readonly ItemInstance[],
  snapshot: EngineeringSnapshot,
  acquisitionOrder: number,
  direction: ItemCircuitMoveDirection
): ItemInstance[] {
  const reconciled = reconcileItemSockets(items, snapshot);
  const active = reconciled.filter((item) => Boolean(item.socket)).sort(compareCircuitOrder);
  const index = active.findIndex((item) => item.acquisitionOrder === acquisitionOrder);
  const other = active[index + direction];
  const selected = active[index];
  if (!selected?.socket || !other?.socket) return reconciled;
  const selectedOrder = selected.socket.circuitOrder;
  const otherOrder = other.socket.circuitOrder;
  return reconciled.map((item) => {
    if (item.acquisitionOrder === selected.acquisitionOrder && item.socket) {
      return { ...item, socket: { ...item.socket, circuitOrder: otherOrder } };
    }
    if (item.acquisitionOrder === other.acquisitionOrder && item.socket) {
      return { ...item, socket: { ...item.socket, circuitOrder: selectedOrder } };
    }
    return item;
  });
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
      return {
        ...item,
        socket: createAssignment(
          target,
          oldAssignment?.circuitOrder ?? getNextCircuitOrder(reconciled)
        )
      };
    }
    if (occupant && item.acquisitionOrder === occupant.acquisitionOrder) {
      return {
        ...item,
        socket:
          oldSlot && canFitItemInSocket(item.itemId, oldSlot)
            ? createAssignment(oldSlot, occupant.socket?.circuitOrder)
            : null
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
    .sort(compareCircuitOrder);
}

export function createItemSocketCircuitSummary(
  items: readonly ItemInstance[],
  snapshot: EngineeringSnapshot
): ItemSocketCircuitSummary {
  const reconciled = reconcileItemSockets(items, snapshot);
  const active = getActiveFittedItems(reconciled, snapshot);
  const slots = getItemSocketSlots(snapshot);
  const channels = [...new Set(slots.map((slot) => slot.type))].map((type) => ({
    type,
    count: slots.filter((slot) => slot.type === type).length
  }));
  const extensions = [...new Set(slots.map((slot) => slot.componentId))].map((componentId) => {
    const componentSlots = slots.filter((slot) => slot.componentId === componentId);
    return {
      componentId,
      moduleName: componentSlots[0]?.moduleName ?? componentId,
      capacity: componentSlots.length,
      channels: componentSlots.map((slot) => slot.type)
    };
  });
  return {
    fitted: active.length,
    capacity: slots.length,
    open: slots.length - active.length,
    unfitted: reconciled.length - active.length,
    chain: active.map((item) => getItemById(item.itemId).name),
    channels,
    extensions
  };
}

function createAssignment(
  slot: ItemSocketSlot,
  circuitOrder = slot.circuitOrder
): ItemSocketAssignment {
  return {
    componentId: slot.componentId,
    socketIndex: slot.socketIndex,
    circuitOrder
  };
}

function routeCircuitItems(
  requested: readonly ItemInstance[],
  slots: readonly ItemSocketSlot[],
  requestedOrders: ReadonlyMap<number, number>
): Map<number, ItemSocketAssignment> {
  const assignments = new Map<number, ItemSocketAssignment>();
  const claimed = new Set<string>();
  const validAsStored = requested.every((item) => {
    const slot = slots.find(
      (candidate) =>
        candidate.componentId === item.socket?.componentId &&
        candidate.socketIndex === item.socket.socketIndex
    );
    if (!slot || claimed.has(getSlotKey(slot)) || !canFitItemInSocket(item.itemId, slot)) {
      return false;
    }
    claimed.add(getSlotKey(slot));
    assignments.set(
      item.acquisitionOrder,
      createAssignment(slot, requestedOrders.get(item.acquisitionOrder))
    );
    return true;
  });
  if (validAsStored) return assignments;

  assignments.clear();
  const claimedBySlot = new Map<string, ItemInstance>();
  const routedSlots = new Map<number, ItemSocketSlot>();
  const tryRoute = (item: ItemInstance, visited: Set<string>): boolean => {
    const preferredKey = item.socket ? getAssignmentKey(item.socket) : '';
    const options = slots
      .filter((slot) => canFitItemInSocket(item.itemId, slot))
      .sort(
        (left, right) =>
          Number(getSlotKey(left) !== preferredKey) - Number(getSlotKey(right) !== preferredKey) ||
          Number(left.type === 'flex') - Number(right.type === 'flex') ||
          left.circuitOrder - right.circuitOrder
      );
    for (const slot of options) {
      const key = getSlotKey(slot);
      if (visited.has(key)) continue;
      visited.add(key);
      const occupant = claimedBySlot.get(key);
      if (occupant && !tryRoute(occupant, visited)) continue;
      claimedBySlot.set(key, item);
      routedSlots.set(item.acquisitionOrder, slot);
      return true;
    }
    return false;
  };

  for (const item of [...requested].sort(compareCircuitOrder)) {
    tryRoute(item, new Set());
  }
  for (const item of requested) {
    const slot = routedSlots.get(item.acquisitionOrder);
    if (!slot) continue;
    assignments.set(
      item.acquisitionOrder,
      createAssignment(slot, requestedOrders.get(item.acquisitionOrder))
    );
  }
  return assignments;
}

function findOpenCircuitSlot(
  itemId: ItemId,
  slots: readonly ItemSocketSlot[],
  claimed: ReadonlySet<string>
): ItemSocketSlot | undefined {
  return (
    slots.find(
      (slot) =>
        slot.type !== 'flex' && !claimed.has(getSlotKey(slot)) && canFitItemInSocket(itemId, slot)
    ) ??
    slots.find(
      (slot) =>
        slot.type === 'flex' && !claimed.has(getSlotKey(slot)) && canFitItemInSocket(itemId, slot)
    )
  );
}

function getNextCircuitOrder(items: readonly ItemInstance[]): number {
  return (
    items.reduce((highest, item) => Math.max(highest, item.socket?.circuitOrder ?? -1), -1) + 1
  );
}

function compareCircuitOrder(left: ItemInstance, right: ItemInstance): number {
  return (
    (left.socket?.circuitOrder ?? Number.MAX_SAFE_INTEGER) -
      (right.socket?.circuitOrder ?? Number.MAX_SAFE_INTEGER) ||
    left.acquisitionOrder - right.acquisitionOrder ||
    left.itemId.localeCompare(right.itemId)
  );
}

function getSlotKey(slot: Pick<ItemSocketSlot, 'componentId' | 'socketIndex'>): string {
  return `${slot.componentId}:${slot.socketIndex}`;
}

function getAssignmentKey(
  assignment: Pick<ItemSocketAssignment, 'componentId' | 'socketIndex'>
): string {
  return `${assignment.componentId}:${assignment.socketIndex}`;
}
