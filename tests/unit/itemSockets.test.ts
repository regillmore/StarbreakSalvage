import { describe, expect, it } from 'vitest';

import { generateRunSkeleton } from '../../src/game/Generation';
import { getComponentCircuitSlotTypes } from '../../src/game/ComponentCircuit';
import {
  acquireComponent,
  createEngineeringState,
  generateComponentSalvage
} from '../../src/game/Foundry';
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
import { createRunSession } from '../../src/game/RunSession';

describe('ship signal circuit', () => {
  it('fits one seeded starter core and leaves two contract conduits open', () => {
    const run = generateRunSkeleton('STARTER-CORE-OPEN-SLOTS', { unlockedIds: [] });
    const contract = run.contracts[0]!;
    const session = createRunSession(run, contract, { unlockedIds: [] });
    const summary = createItemSocketCircuitSummary(
      session.itemInstances,
      session.engineering.committed
    );

    expect(session.itemInstances).toHaveLength(1);
    expect(summary).toMatchObject({ fitted: 1, capacity: 3, open: 2, unfitted: 0 });
    expect(getActiveFittedItems(session.itemInstances, session.engineering.committed)).toHaveLength(
      1
    );
  });

  it('auto-routes a starter circuit through deterministic component conduits', () => {
    const run = generateRunSkeleton('SOCKET-STARTER');
    const engineering = createEngineeringState(run.contracts[0]!.loadout);
    const items: ItemInstance[] = [
      { itemId: 'item_phase_grazer', acquisitionOrder: 0 },
      { itemId: 'item_split_prism', acquisitionOrder: 1 },
      { itemId: 'item_salvage_magnet', acquisitionOrder: 2 }
    ];

    const fitted = autoFitItemSockets(items, engineering.committed);
    const replay = autoFitItemSockets(items, engineering.committed);
    const summary = createItemSocketCircuitSummary(fitted, engineering.committed);

    expect(fitted).toEqual(replay);
    expect(fitted.every((item) => item.socket)).toBe(true);
    expect(summary).toMatchObject({ fitted: 3, capacity: 3, open: 0, unfitted: 0 });
    expect(summary.extensions).toHaveLength(3);
    expect(summary.extensions.every((extension) => extension.capacity === 1)).toBe(true);
    expect(summary.channels).toEqual([{ type: 'flex', count: 3 }]);
    expect(getActiveFittedItems(fitted, engineering.committed)).toHaveLength(3);
  });

  it('tiers component circuit capacity from contract issue through Act I and Act II salvage', () => {
    const run = generateRunSkeleton('SOCKET-CAPACITY-TIERS');
    let engineering = createEngineeringState(run.contracts[0]!.loadout);
    const starterSlots = run.contracts.flatMap((contract) =>
      createEngineeringState(contract.loadout).committed.components.map(
        getComponentCircuitSlotTypes
      )
    );
    const generateAt = (sectorIndex: number) =>
      generateComponentSalvage({
        seed: run.seed,
        saveFingerprint: 'capacity-tiers',
        sectorIndex,
        routeKind: 'elite',
        sectorId: run.sectors[sectorIndex - 1]!.sectorId,
        bossRequired: false,
        state: engineering
      });
    const actOneOpening = generateAt(1);
    engineering = acquireComponent(engineering, actOneOpening);
    const actOneFinale = generateAt(9);
    engineering = acquireComponent(engineering, actOneFinale);
    const actTwoOpening = generateAt(10);
    engineering = acquireComponent(engineering, actTwoOpening);
    const actThreeOpening = generateAt(19);

    expect(starterSlots.every((slots) => slots.length === 1)).toBe(true);
    expect(starterSlots.every((slots) => slots[0] === 'flex')).toBe(true);
    expect(getComponentCircuitSlotTypes(actOneOpening)).toHaveLength(2);
    expect(getComponentCircuitSlotTypes(actOneFinale)).toHaveLength(2);
    expect(getComponentCircuitSlotTypes(actTwoOpening)).toHaveLength(3);
    expect(getComponentCircuitSlotTypes(actThreeOpening)).toHaveLength(3);
    expect(getComponentCircuitSlotTypes(actTwoOpening)).toEqual([
      expect.not.stringMatching('flex'),
      'flex',
      expect.not.stringMatching('flex')
    ]);
  });

  it('reorders the logical chain independently and reroutes across component replacement', () => {
    const run = generateRunSkeleton('CIRCUIT-REORDER');
    const contract = run.contracts.find((candidate) => candidate.shipId === 'ship_debt_runner');
    if (!contract) throw new Error('Expected the Debt Runner circuit fixture.');
    const engineering = createEngineeringState(contract.loadout);
    const items = autoFitItemSockets(
      [
        { itemId: 'item_split_prism', acquisitionOrder: 0 },
        { itemId: 'item_phase_grazer', acquisitionOrder: 1 },
        { itemId: 'item_salvage_magnet', acquisitionOrder: 2 }
      ],
      engineering.committed
    );
    const salvageAssignment = items.find((item) => item.acquisitionOrder === 2)!.socket!;
    const movedOnce = moveItemInCircuit(items, engineering.committed, 2, -1);
    const movedTwice = moveItemInCircuit(movedOnce, engineering.committed, 2, -1);
    const reordered = getActiveFittedItems(movedTwice, engineering.committed);
    const removedComponentId = reordered[0]!.socket!.componentId;
    const removedComponent = engineering.committed.components.find(
      (component) => component.id === removedComponentId
    )!;
    const actOneReplacement = {
      ...removedComponent,
      id: 'act-one-replacement',
      source: 'combat' as const,
      sourceLabel: 'Combat wreckage',
      acquiredSectorIndex: 1
    };
    const withActOneReplacement = {
      ...engineering.committed,
      components: [...engineering.committed.components, actOneReplacement],
      mounts: engineering.committed.mounts.map((mount) =>
        mount.componentId === removedComponentId
          ? { ...mount, componentId: actOneReplacement.id }
          : mount
      )
    };
    const rerouted = reconcileItemSockets(movedTwice, withActOneReplacement);

    expect(reordered.map((item) => item.itemId)).toEqual([
      'item_salvage_magnet',
      'item_split_prism',
      'item_phase_grazer'
    ]);
    expect(reordered[0]?.socket).toMatchObject({
      componentId: salvageAssignment.componentId,
      socketIndex: salvageAssignment.socketIndex
    });
    expect(getActiveFittedItems(rerouted, withActOneReplacement)).toHaveLength(3);
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
