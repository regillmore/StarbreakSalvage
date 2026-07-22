import { describe, expect, it } from 'vitest';

import { getShipModuleById } from '../../src/content/shipModules';
import { generateRunSkeleton } from '../../src/game/Generation';
import {
  getComponentCircuitCapacity,
  getComponentCircuitSlotTypes
} from '../../src/game/ComponentCircuit';
import { createEngineeringState } from '../../src/game/Foundry';
import {
  autoFitItemSockets,
  autoFitItemSocket,
  canFitItemInCircuit,
  createItemSocketCircuitSummary,
  fitItemInCircuit,
  getActiveFittedItems,
  getItemCircuitDomains,
  getItemSocketSlots,
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
    expect(summary.extensions).toHaveLength(1);
    expect(summary.extensions[0]).toMatchObject({ capacity: 3 });
    expect(summary.channels).toEqual([
      { type: 'weapon', count: 2 },
      { type: 'flex', count: 1 }
    ]);
    expect(getActiveFittedItems(fitted, engineering.committed)).toHaveLength(3);
  });

  it('projects circuit capacity only from the primary weapon with quality-scaled variation', () => {
    const run = generateRunSkeleton('SOCKET-CAPACITY-TIERS');
    const engineering = createEngineeringState(run.contracts[0]!.loadout);
    const starterPrimary = engineering.committed.components.find(
      (component) => getShipModuleById(component.moduleId).slot === 'primary'
    );
    if (!starterPrimary) throw new Error('Expected a contract primary weapon.');
    const nonPrimary = engineering.committed.components.filter(
      (component) => getShipModuleById(component.moduleId).slot !== 'primary'
    );
    const recovered = (sectorIndex: number, qualityId: typeof starterPrimary.qualityId) => ({
      ...starterPrimary,
      source: 'combat' as const,
      acquiredSectorIndex: sectorIndex,
      qualityId
    });

    expect(getComponentCircuitCapacity(starterPrimary)).toBe(3);
    expect(getComponentCircuitSlotTypes(starterPrimary)).toEqual(['weapon', 'flex', 'weapon']);
    expect(nonPrimary.every((component) => getComponentCircuitCapacity(component) === 0)).toBe(
      true
    );
    expect(
      nonPrimary.every((component) => getComponentCircuitSlotTypes(component).length === 0)
    ).toBe(true);
    expect(
      (['standard', 'tuned', 'prototype', 'relic'] as const).map((quality) =>
        getComponentCircuitCapacity(recovered(1, quality))
      )
    ).toEqual([2, 3, 4, 5]);
    expect(
      (['standard', 'tuned', 'prototype', 'relic'] as const).map((quality) =>
        getComponentCircuitCapacity(recovered(10, quality))
      )
    ).toEqual([3, 4, 5, 6]);
    expect(getComponentCircuitSlotTypes(recovered(19, 'relic'))).toEqual([
      'weapon',
      'flex',
      'weapon',
      'flex',
      'weapon',
      'flex'
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
    const recoveredReplacement = {
      ...removedComponent,
      id: 'recovered-replacement',
      source: 'combat' as const,
      sourceLabel: 'Combat wreckage',
      acquiredSectorIndex: 10
    };
    const withRecoveredReplacement = {
      ...engineering.committed,
      components: [...engineering.committed.components, recoveredReplacement],
      mounts: engineering.committed.mounts.map((mount) =>
        mount.componentId === removedComponentId
          ? { ...mount, componentId: recoveredReplacement.id }
          : mount
      )
    };
    const rerouted = reconcileItemSockets(movedTwice, withRecoveredReplacement);

    expect(reordered.map((item) => item.itemId)).toEqual([
      'item_salvage_magnet',
      'item_split_prism',
      'item_phase_grazer'
    ]);
    expect(reordered[0]?.socket).toMatchObject({
      componentId: salvageAssignment.componentId,
      socketIndex: salvageAssignment.socketIndex
    });
    expect(getActiveFittedItems(rerouted, withRecoveredReplacement)).toHaveLength(3);
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

  it('fits every upgrade domain into any open primary-weapon conduit', () => {
    const run = generateRunSkeleton('SOCKET-UNIVERSAL-CONDUITS', { unlockedIds: [] });
    const contract = run.contracts.find(
      (candidate) => candidate.shipId === 'ship_missile_accountant'
    );
    if (!contract) throw new Error('Expected the Missile Accountant circuit fixture.');
    const engineering = createEngineeringState(contract.loadout);
    const primaryHardpoint = contract.loadout.mounts.find((mount) => mount.slot === 'primary');
    const primaryMount = engineering.committed.mounts.find(
      (mount) => mount.hardpointId === primaryHardpoint?.hardpointId
    );
    const primaryComponent = engineering.committed.components.find(
      (component) => component.id === primaryMount?.componentId
    );
    if (!primaryMount || !primaryComponent) {
      throw new Error('Expected installed primary weapon hardware.');
    }
    const universalSnapshot = {
      ...engineering.committed,
      components: [
        {
          ...primaryComponent,
          source: 'combat' as const,
          sourceLabel: 'Act I salvage',
          acquiredSectorIndex: 1
        }
      ],
      mounts: [{ ...primaryMount, installationOrder: 0 }]
    };
    const slots = getItemSocketSlots(universalSnapshot);
    const items: ItemInstance[] = [
      {
        itemId: 'item_split_prism',
        acquisitionOrder: 0,
        socket: { componentId: primaryComponent.id, socketIndex: 1, circuitOrder: 0 }
      },
      { itemId: 'item_signal_clone_stamp', acquisitionOrder: 1, socket: null }
    ];

    expect(slots.map((slot) => slot.type)).toEqual(['weapon', 'flex']);
    expect(getItemCircuitDomains('item_signal_clone_stamp')).not.toContain('ordnance');
    expect(canFitItemInCircuit(items, universalSnapshot, 1)).toBe(true);

    const fitted = fitItemInCircuit(items, universalSnapshot, 1);
    expect(fitted.find((item) => item.acquisitionOrder === 1)?.socket).toMatchObject({
      componentId: primaryComponent.id,
      socketIndex: 0,
      circuitOrder: 1
    });
  });
});
