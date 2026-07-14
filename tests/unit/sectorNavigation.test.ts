import { describe, expect, it } from 'vitest';
import { generateRunSkeleton } from '../../src/game/Generation';
import { createRunSession } from '../../src/game/RunSession';
import {
  createSectorNavigationPlan,
  createSectorNavigationState,
  recordSectorNavigationVisit,
  synchronizeSectorNavigationState,
  validateSectorNavigationState
} from '../../src/game/SectorNavigation';
import { createRunSnapshot, restoreRunSnapshot } from '../../src/game/RunSnapshot';

describe('sector navigation hub', () => {
  it('creates deterministic procedural local maps without hiding common services', () => {
    const first = createSectorNavigationPlan({ seed: 'NAV-HUB-SMOKE', sectorIndex: 4 });
    const repeat = createSectorNavigationPlan({ seed: 'NAV-HUB-SMOKE', sectorIndex: 4 });
    const nextSector = createSectorNavigationPlan({ seed: 'NAV-HUB-SMOKE', sectorIndex: 5 });

    expect(repeat).toEqual(first);
    expect(nextSector).not.toEqual(first);
    expect(first.destinations.map((destination) => destination.id).sort()).toEqual([
      'apex',
      'crew',
      'fleet',
      'hardpoint',
      'launch',
      'shop'
    ]);
    expect(first.destinations.every((destination) => destination.available)).toBe(true);
    expect(first.edges).toHaveLength(first.destinations.length - 1);
  });

  it('keeps every generated node bounded, distinct, and connected across many seeds', () => {
    const layouts = new Set<string>();
    for (let index = 0; index < 64; index += 1) {
      const plan = createSectorNavigationPlan({
        seed: `NAVIGATION-SWEEP-${index}`,
        sectorIndex: index % 15
      });
      layouts.add(plan.layoutId);
      expect(new Set(plan.destinations.map(({ x, y }) => `${x}:${y}`)).size).toBe(6);
      expect(plan.destinations.every(({ x, y }) => x >= 8 && x <= 92 && y >= 8 && y <= 92)).toBe(
        true
      );

      const connected = new Set(['launch']);
      let changed = true;
      while (changed) {
        changed = false;
        for (const edge of plan.edges) {
          if (connected.has(edge.fromId) && !connected.has(edge.toId)) {
            connected.add(edge.toId);
            changed = true;
          }
          if (connected.has(edge.toId) && !connected.has(edge.fromId)) {
            connected.add(edge.fromId);
            changed = true;
          }
        }
      }
      expect(connected.size).toBe(6);
    }
    expect(layouts.size).toBe(4);
  });

  it('locks a destination only when supplied a specific story reason', () => {
    const plan = createSectorNavigationPlan({
      seed: 'STORY-LOCK-SMOKE',
      sectorIndex: 2,
      serviceLocks: { fleet: 'Hangar pressure doors are sealed during the mutiny.' }
    });

    expect(plan.destinations.find((destination) => destination.id === 'fleet')).toMatchObject({
      available: false,
      unavailableReason: 'Hangar pressure doors are sealed during the mutiny.'
    });
    expect(
      plan.destinations
        .filter((destination) => destination.id !== 'fleet')
        .every((destination) => destination.available)
    ).toBe(true);
  });

  it('records bounded visit state, resets it on transit, and round-trips snapshot v11', () => {
    const run = generateRunSkeleton('NAVIGATION-SNAPSHOT-SMOKE');
    const session = createRunSession(run, run.contracts[0]!);
    session.navigation = recordSectorNavigationVisit(session.navigation, 'shop');
    session.navigation = recordSectorNavigationVisit(session.navigation, 'hardpoint');
    session.navigation = recordSectorNavigationVisit(session.navigation, 'shop');

    expect(session.navigation.visitedDestinationIds).toEqual(['shop', 'hardpoint']);
    expect(validateSectorNavigationState(session.navigation)).toEqual([]);

    const snapshot = createRunSnapshot({
      run,
      contract: run.contracts[0]!,
      session,
      target: 'sectorTransition',
      label: 'Navigation hub visit checkpoint'
    });
    expect(snapshot.version).toBe(11);
    expect(restoreRunSnapshot(snapshot).session.navigation).toEqual(session.navigation);

    expect(synchronizeSectorNavigationState(session.navigation, 1)).toEqual(
      createSectorNavigationState(1)
    );
    expect(
      validateSectorNavigationState({
        sectorIndex: 0,
        visitedDestinationIds: ['shop', 'shop']
      })
    ).toContain('visited destinations must be unique');
  });
});
