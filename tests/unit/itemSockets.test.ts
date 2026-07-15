import { describe, expect, it } from 'vitest';

import { generateRunSkeleton } from '../../src/game/Generation';
import { createEngineeringState } from '../../src/game/Foundry';
import {
  autoFitItemSockets,
  autoFitItemSocket,
  canFitItemInCircuit,
  createItemSocketCircuitSummary,
  fitItemInCircuit,
  getActiveFittedItems,
  moveItemInCircuit,
  reconcileItemSockets,
  unfitItem
} from '../../src/game/ItemSockets';
import type { ItemInstance } from '../../src/game/Rewards';

describe('ship signal circuit', () => {
  it('auto-routes a starter circuit through deterministic component conduits', () => {
    const run = generateRunSkeleton('SOCKET-STARTER');
    const engineering = createEngineeringState(run.contracts[0]!.loadout);
    const items: ItemInstance[] = [
      { itemId: 'item_split_prism', acquisitionOrder: 0 },
      { itemId: 'item_phase_grazer', acquisitionOrder: 1 },
      { itemId: 'item_signal_clone_stamp', acquisitionOrder: 2 }
    ];

    const fitted = autoFitItemSockets(items, engineering.committed);
    const replay = autoFitItemSockets(items, engineering.committed);
    const summary = createItemSocketCircuitSummary(fitted, engineering.committed);

    expect(fitted).toEqual(replay);
    expect(fitted.every((item) => item.socket)).toBe(true);
    expect(summary).toMatchObject({ fitted: 3, capacity: 6, open: 3, unfitted: 0 });
    expect(summary.extensions).toHaveLength(3);
    expect(summary.extensions.every((extension) => extension.capacity === 2)).toBe(true);
    expect(summary.channels.some((channel) => channel.type === 'flex')).toBe(true);
    expect(getActiveFittedItems(fitted, engineering.committed)).toHaveLength(3);
  });

  it('reorders the logical chain independently and reroutes across component replacement', () => {
    const run = generateRunSkeleton('CIRCUIT-REORDER');
    const engineering = createEngineeringState(run.contracts[0]!.loadout);
    const items = autoFitItemSockets(
      [
        { itemId: 'item_phase_grazer', acquisitionOrder: 0 },
        { itemId: 'item_split_prism', acquisitionOrder: 1 },
        { itemId: 'item_signal_clone_stamp', acquisitionOrder: 2 }
      ],
      engineering.committed
    );
    const cloneAssignment = items.find((item) => item.acquisitionOrder === 2)!.socket!;
    const movedOnce = moveItemInCircuit(items, engineering.committed, 2, -1);
    const movedTwice = moveItemInCircuit(movedOnce, engineering.committed, 2, -1);
    const reordered = getActiveFittedItems(movedTwice, engineering.committed);
    const removedComponentId = reordered[0]!.socket!.componentId;
    const withoutOneComponent = {
      ...engineering.committed,
      mounts: engineering.committed.mounts.filter(
        (mount) => mount.componentId !== removedComponentId
      )
    };
    const rerouted = reconcileItemSockets(movedTwice, withoutOneComponent);

    expect(reordered.map((item) => item.itemId)).toEqual([
      'item_signal_clone_stamp',
      'item_phase_grazer',
      'item_split_prism'
    ]);
    expect(reordered[0]?.socket).toMatchObject({
      componentId: cloneAssignment.componentId,
      socketIndex: cloneAssignment.socketIndex
    });
    expect(getActiveFittedItems(rerouted, withoutOneComponent)).toHaveLength(3);
    expect(rerouted.some((item) => item.socket?.componentId === removedComponentId)).toBe(false);
  });

  it('appends only a chosen or newly acquired upgrade and preserves deliberate rack choices', () => {
    const run = generateRunSkeleton('SOCKET-NEW-ONLY');
    const engineering = createEngineeringState(run.contracts[0]!.loadout);
    const initial = autoFitItemSockets(
      [
        { itemId: 'item_split_prism', acquisitionOrder: 0 },
        { itemId: 'item_phase_grazer', acquisitionOrder: 1 }
      ],
      engineering.committed
    );
    const ejected = unfitItem(initial, 0);
    expect(canFitItemInCircuit(ejected, engineering.committed, 0)).toBe(true);
    const appended = fitItemInCircuit(ejected, engineering.committed, 0);
    expect(getActiveFittedItems(appended, engineering.committed).at(-1)?.acquisitionOrder).toBe(0);
    const acquired = autoFitItemSocket(
      [...ejected, { itemId: 'item_signal_clone_stamp', acquisitionOrder: 2, socket: null }],
      engineering.committed,
      2
    );

    expect(acquired.find((item) => item.acquisitionOrder === 0)?.socket).toBeNull();
    expect(acquired.find((item) => item.acquisitionOrder === 2)?.socket).not.toBeNull();
    expect(getActiveFittedItems(acquired, engineering.committed).at(-1)?.acquisitionOrder).toBe(2);
  });
});
