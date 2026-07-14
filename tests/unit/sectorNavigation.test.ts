import { describe, expect, it } from 'vitest';
import { createActConstellationPlan } from '../../src/game/ActConstellation';
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
  it('keeps one deterministic sector constellation throughout an act and refreshes the next act', () => {
    const run = generateRunSkeleton('NAV-HUB-SMOKE');
    const first = createSectorNavigationPlan({ run, sectorIndex: 0 });
    const repeat = createSectorNavigationPlan({ run, sectorIndex: 0 });
    const progressed = createSectorNavigationPlan({ run, sectorIndex: 1 });
    const nextAct = createSectorNavigationPlan({ run, sectorIndex: 5 });

    expect(repeat).toEqual(first);
    expect(progressed.id).toBe(first.id);
    expect(progressed.layoutId).toBe(first.layoutId);
    expect(progressed.hubName).toBe(first.hubName);
    expect(progressed.destinations).toEqual(first.destinations);
    expect(progressed.constellation.nodes.map(({ x, y }) => ({ x, y }))).toEqual(
      first.constellation.nodes.map(({ x, y }) => ({ x, y }))
    );
    expect(nextAct.id).not.toBe(first.id);
    expect(nextAct.constellation.actId).not.toBe(first.constellation.actId);
    expect(first.destinations.map((destination) => destination.id).sort()).toEqual([
      'apex',
      'crew',
      'fleet',
      'hardpoint',
      'shop'
    ]);
    expect(first.destinations.every((destination) => destination.available)).toBe(true);
    expect(first.constellation.edges).toHaveLength(4);
  });

  it('keeps every future sector unresolved until its travel choice opens', () => {
    const run = generateRunSkeleton('CONSTELLATION-REVEAL-SMOKE');
    const first = createSectorNavigationPlan({ run, sectorIndex: 0 }).constellation;
    const second = createSectorNavigationPlan({ run, sectorIndex: 1 }).constellation;

    expect(first.nodes.filter((node) => node.kind === 'sector').map((node) => node.status)).toEqual(
      ['current', 'hidden', 'hidden', 'hidden', 'hidden']
    );
    expect(first.edges.map((edge) => edge.status)).toEqual([
      'hidden',
      'hidden',
      'hidden',
      'hidden'
    ]);
    expect(
      second.nodes.filter((node) => node.kind === 'sector').map((node) => node.status)
    ).toEqual(['completed', 'current', 'hidden', 'hidden', 'hidden']);
    expect(second.edges.map((edge) => edge.status)).toEqual([
      'completed',
      'hidden',
      'hidden',
      'hidden'
    ]);
    expect(
      first.nodes
        .filter((node) => node.status === 'hidden')
        .every((node) => node.label === 'Uncharted signal' && node.stateLabel === 'UNRESOLVED')
    ).toBe(true);
  });

  it('keeps floating services off the connected graph across many seeds', () => {
    const layouts = new Set<string>();
    for (let index = 0; index < 64; index += 1) {
      const run = generateRunSkeleton(`NAVIGATION-SWEEP-${index}`);
      const plan = createSectorNavigationPlan({ run, sectorIndex: index % 15 });
      layouts.add(plan.layoutId);
      const sectorNodes = plan.constellation.nodes.filter((node) => node.kind === 'sector');
      const allPositions = [
        ...sectorNodes.map(({ x, y }) => `${x}:${y}`),
        ...plan.destinations.map(({ x, y }) => `${x}:${y}`)
      ];
      expect(new Set(allPositions).size).toBe(10);
      expect(
        [...sectorNodes, ...plan.destinations].every(
          ({ x, y }) => x >= 7 && x <= 93 && y >= 7 && y <= 93
        )
      ).toBe(true);
      expect(
        plan.constellation.edges.every(
          (edge) =>
            sectorNodes.some((node) => node.id === edge.fromId) &&
            sectorNodes.some((node) => node.id === edge.toId)
        )
      ).toBe(true);

      const connected = new Set([sectorNodes[0]!.id]);
      for (const edge of plan.constellation.edges) connected.add(edge.toId);
      expect(connected.size).toBe(5);
    }
    expect(layouts.size).toBe(4);
  });

  it('projects approach choices as newly connected nodes on the same act chart', () => {
    const plan = createActConstellationPlan({
      seed: 'APPROACH-CONSTELLATION-SMOKE',
      act: {
        id: 'act-smoke',
        index: 1,
        label: 'Smoke Act',
        shortLabel: 'Act S',
        summary: 'A test constellation.',
        sectors: Array.from({ length: 5 }, (_, index) => ({
          id: `sector-${index}`,
          sectorIndex: index,
          sectorName: `Sector ${index + 1}`
        }))
      },
      currentSectorIndex: 2,
      approaches: [
        {
          id: 'direct',
          label: 'Hold the spine',
          summary: 'Continue through the required route.',
          default: true
        },
        {
          id: 'optional',
          label: 'Break for the signal',
          summary: 'Commit to the optional contact.',
          default: false
        }
      ]
    });

    expect(plan.nodes.filter((node) => node.kind === 'approach')).toMatchObject([
      { approachId: 'direct', status: 'choice', defaultApproach: true },
      { approachId: 'optional', status: 'choice', defaultApproach: false }
    ]);
    expect(plan.edges.filter((edge) => edge.status === 'choice')).toHaveLength(2);
  });

  it('locks a service only when supplied a specific story reason', () => {
    const run = generateRunSkeleton('STORY-LOCK-SMOKE');
    const plan = createSectorNavigationPlan({
      run,
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
