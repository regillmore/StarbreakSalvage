import { describe, expect, it } from 'vitest';

import { generateRunSkeleton } from '../../src/game/Generation';
import { createEngineeringState } from '../../src/game/Foundry';
import {
  autoFitItemSockets,
  autoFitItemSocket,
  createItemSocketCircuitSummary,
  fitItemInSocket,
  getActiveFittedItems,
  getItemSocketSlots,
  reconcileItemSockets,
  unfitItem
} from '../../src/game/ItemSockets';
import type { ItemInstance } from '../../src/game/Rewards';

describe('item upgrade sockets', () => {
  it('auto-fits a starter circuit deterministically into limited component sockets', () => {
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
    expect(summary).toMatchObject({ fitted: 3, capacity: 6, unfitted: 0 });
    expect(getActiveFittedItems(fitted, engineering.committed)).toHaveLength(3);
  });

  it('supports fitting, swapping, ejecting, and invalid-component reconciliation', () => {
    const run = generateRunSkeleton('SOCKET-SWAP');
    const engineering = createEngineeringState(run.contracts[0]!.loadout);
    const items = autoFitItemSockets(
      [
        { itemId: 'item_split_prism', acquisitionOrder: 0 },
        { itemId: 'item_signal_clone_stamp', acquisitionOrder: 1 }
      ],
      engineering.committed
    );
    const firstAssignment = items.find((item) => item.acquisitionOrder === 0)!.socket!;
    const target = getItemSocketSlots(engineering.committed).find(
      (slot) =>
        slot.componentId === firstAssignment.componentId &&
        slot.socketIndex === firstAssignment.socketIndex
    )!;
    const swapped = fitItemInSocket(
      items,
      engineering.committed,
      1,
      target.componentId,
      target.socketIndex
    );
    const ejected = unfitItem(swapped, 1);
    const withoutTargetComponent = {
      ...engineering.committed,
      mounts: engineering.committed.mounts.filter(
        (mount) => mount.componentId !== target.componentId
      )
    };

    expect(swapped.find((item) => item.acquisitionOrder === 1)?.socket).toMatchObject({
      componentId: target.componentId,
      socketIndex: target.socketIndex
    });
    expect(ejected.find((item) => item.acquisitionOrder === 1)?.socket).toBeNull();
    expect(
      reconcileItemSockets(swapped, withoutTargetComponent).some(
        (item) => item.socket?.componentId === target.componentId
      )
    ).toBe(false);
  });

  it('auto-fits only a newly acquired upgrade and preserves deliberate rack choices', () => {
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
    const acquired = autoFitItemSocket(
      [
        ...ejected,
        { itemId: 'item_signal_clone_stamp', acquisitionOrder: 2, socket: null }
      ],
      engineering.committed,
      2
    );

    expect(acquired.find((item) => item.acquisitionOrder === 0)?.socket).toBeNull();
    expect(acquired.find((item) => item.acquisitionOrder === 2)?.socket).not.toBeNull();
  });
});
