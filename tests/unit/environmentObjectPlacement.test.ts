import { describe, expect, it } from 'vitest';

import {
  ENVIRONMENT_OBJECT_DEFINITIONS,
  getEnvironmentObjectsForSector
} from '../../src/content/environmentObjects';
import { COMBAT_ARENA_HEIGHT, COMBAT_ARENA_WIDTH } from '../../src/game/CombatGeometry';
import {
  ENVIRONMENT_OBJECT_ACTIVE_LEAD_DISTANCE,
  ENVIRONMENT_OBJECT_EXIT_CLEAR_DISTANCE,
  createEnvironmentObjectPlacementPlan,
  getEnvironmentObjectActiveDistanceWindow,
  getEnvironmentObjectOpenLaneWidth,
  validateEnvironmentObjectPlacementPlan
} from '../../src/game/EnvironmentObjectPlacement';
import { createRng } from '../../src/core/rng';

describe('EnvironmentObjectPlacement', () => {
  it('creates deterministic fixed-world placement plans for known seeds', () => {
    const first = createEnvironmentObjectPlacementPlan({
      sectorId: 'sector_outer_debris_field',
      sectorIndex: 1,
      scrollLength: 1800,
      rng: createRng('OBJECT-PLACEMENT-SEED').fork('outer')
    });
    const second = createEnvironmentObjectPlacementPlan({
      sectorId: 'sector_outer_debris_field',
      sectorIndex: 1,
      scrollLength: 1800,
      rng: createRng('OBJECT-PLACEMENT-SEED').fork('outer')
    });

    expect(first).toEqual(second);
    expect(first.arenaWidth).toBe(COMBAT_ARENA_WIDTH);
    expect(first.arenaHeight).toBe(COMBAT_ARENA_HEIGHT);
    expect(validateEnvironmentObjectPlacementPlan(first)).toEqual([]);
    expect(first.objects.length).toBeGreaterThan(0);
  });

  it('keeps every placed object inside fixed combat bounds with a readable open lane', () => {
    const plan = createEnvironmentObjectPlacementPlan({
      sectorId: 'sector_lunar_surface',
      sectorIndex: 4,
      scrollLength: 2200,
      rng: createRng('LUNAR-OBJECT-LANES').fork('surface'),
      targetCount: 5
    });

    expect(validateEnvironmentObjectPlacementPlan(plan)).toEqual([]);

    for (const object of plan.objects) {
      const definition = ENVIRONMENT_OBJECT_DEFINITIONS.find(
        (candidate) => candidate.id === object.definitionId
      );

      if (!definition) {
        throw new Error(`Missing definition for ${object.definitionId}`);
      }

      expect(object.x).toBeGreaterThanOrEqual(plan.padding);
      expect(object.x).toBeLessThanOrEqual(plan.arenaWidth - plan.padding);
      expect(object.y).toBeGreaterThanOrEqual(plan.padding);
      expect(object.y).toBeLessThanOrEqual(plan.arenaHeight - plan.padding);
      expect(getEnvironmentObjectOpenLaneWidth(object)).toBeGreaterThanOrEqual(
        definition.placement.safeLaneWidth
      );
      expect(object.distance - ENVIRONMENT_OBJECT_ACTIVE_LEAD_DISTANCE).toBeGreaterThanOrEqual(
        definition.placement.avoidPlayerSpawnDistance
      );
      expect(object.distance).toBeLessThanOrEqual(
        plan.scrollLength - ENVIRONMENT_OBJECT_EXIT_CLEAR_DISTANCE
      );
    }
  });

  it('avoids hazards, enemy spawn lanes, boss locks, and sector exits', () => {
    const plan = createEnvironmentObjectPlacementPlan({
      sectorId: 'sector_trade_war_corridor',
      sectorIndex: 3,
      scrollLength: 2600,
      rng: createRng('OBJECT-LAYOUT-SAFETY').fork('trade'),
      targetCount: 5,
      hazards: [
        {
          telegraphDistance: 760,
          startDistance: 840,
          endDistance: 980,
          xRatio: 0.2,
          widthRatio: 0.32
        },
        {
          telegraphDistance: 1110,
          startDistance: 1180,
          endDistance: 1320,
          xRatio: 0.8,
          widthRatio: 0.28
        }
      ],
      enemySpawnLanes: [
        { distance: 1040, xRatio: 0.22, width: 130, label: 'left spawn' },
        { distance: 1460, xRatio: 0.78, width: 130, label: 'right spawn' }
      ],
      bossArena: {
        approachStartDistance: 1900,
        lockDistance: 2130,
        releaseDistance: 2600
      }
    });

    expect(validateEnvironmentObjectPlacementPlan(plan)).toEqual([]);
    expect(plan.objects.length).toBeGreaterThan(0);

    for (const object of plan.objects) {
      const activeWindow = getEnvironmentObjectActiveDistanceWindow(object);

      expect(activeWindow.endDistance).toBeLessThan(1900);
      expect(object.distance).toBeLessThanOrEqual(
        plan.scrollLength - ENVIRONMENT_OBJECT_EXIT_CLEAR_DISTANCE
      );
      expect(overlapsReservedLane(object, 1040, 0.22, 130)).toBe(false);
      expect(overlapsReservedLane(object, 1460, 0.78, 130)).toBe(false);
      expect(object.layoutRole).toMatch(/lanePressure|cover|gate|reward/);
    }
  });

  it('materializes deterministic discrete mine clusters from mine-belt schedules', () => {
    const options = {
      sectorId: 'sector_outer_debris_field' as const,
      sectorIndex: 2,
      scrollLength: 2200,
      hazards: [
        {
          id: 'test-mine-belt',
          kind: 'mine_belt' as const,
          telegraphDistance: 760,
          startDistance: 900,
          endDistance: 1060,
          xRatio: 0.5,
          widthRatio: 0.32
        }
      ]
    };
    const first = createEnvironmentObjectPlacementPlan({
      ...options,
      rng: createRng('MINE-CLUSTER-SEED'),
      targetCount: 1
    });
    const second = createEnvironmentObjectPlacementPlan({
      ...options,
      rng: createRng('MINE-CLUSTER-SEED'),
      targetCount: 1
    });
    const mines = first.objects.filter((object) => object.definitionId === 'proximity_mine');

    expect(first).toEqual(second);
    expect(validateEnvironmentObjectPlacementPlan(first)).toEqual([]);
    expect(mines.length).toBeGreaterThanOrEqual(4);
    expect(mines.length).toBeLessThanOrEqual(6);
    expect(mines.every((mine) => mine.layoutRole === 'lanePressure')).toBe(true);
    expect(mines.every((mine) => mine.x >= 218 && mine.x <= 422)).toBe(true);
    expect(
      mines.every(
        (mine) =>
          mine.distance >= 882 &&
          mine.distance <= 918 &&
          mine.distance <= first.scrollLength - ENVIRONMENT_OBJECT_EXIT_CLEAR_DISTANCE
      )
    ).toBe(true);
  });

  it('paces obstacle pressure across long sectors without using viewport dimensions', () => {
    const plan = createEnvironmentObjectPlacementPlan({
      sectorId: 'sector_lunar_surface',
      sectorIndex: 5,
      scrollLength: 3200,
      rng: createRng('LONG-OBJECT-PACING').fork('surface'),
      targetCount: 5
    });

    expect(validateEnvironmentObjectPlacementPlan(plan)).toEqual([]);
    expect(plan.arenaWidth).toBe(COMBAT_ARENA_WIDTH);
    expect(plan.arenaHeight).toBe(COMBAT_ARENA_HEIGHT);
    expect(plan.objects.length).toBeGreaterThan(1);
    expect(plan.objects[0]?.distance).toBeLessThan(
      plan.objects[plan.objects.length - 1]?.distance ?? 0
    );
    expect(
      plan.objects.every(
        (object) => object.distance <= 3200 - ENVIRONMENT_OBJECT_EXIT_CLEAR_DISTANCE
      )
    ).toBe(true);
  });

  it('filters placement candidates by sector fit', () => {
    const lunarDefinitions = getEnvironmentObjectsForSector('sector_lunar_surface');
    const plan = createEnvironmentObjectPlacementPlan({
      sectorId: 'sector_lunar_surface',
      sectorIndex: 4,
      scrollLength: 2200,
      rng: createRng('LUNAR-OBJECT-FIT').fork('surface'),
      targetCount: 5
    });
    const lunarDefinitionIds = new Set(lunarDefinitions.map((definition) => definition.id));

    expect(lunarDefinitionIds).toContain('lunar_rock_field');
    expect(plan.objects.every((object) => lunarDefinitionIds.has(object.definitionId))).toBe(true);
  });

  it('reports unsafe manual placement plans', () => {
    const definition = ENVIRONMENT_OBJECT_DEFINITIONS.find(
      (candidate) => candidate.id === 'shield_gate'
    );

    if (!definition) {
      throw new Error('Expected environment object definition.');
    }

    expect(
      validateEnvironmentObjectPlacementPlan({
        sectorId: 'sector_outer_debris_field',
        sectorIndex: 1,
        scrollLength: 1800,
        arenaWidth: 800,
        arenaHeight: 600,
        padding: 24,
        objects: [
          {
            id: 'unsafe-object',
            definitionId: definition.id,
            collisionShape: definition.collision.shape,
            distance: 400,
            x: 320,
            y: 120,
            width: definition.collision.width,
            height: definition.collision.height,
            radius: definition.collision.radius,
            safeLaneWidth: 0,
            debugLabel: definition.debugLabel
          }
        ]
      })
    ).toEqual([
      'Environment object placement plan must use fixed combat-world dimensions',
      'Environment object placement unsafe-object leaves an unsafe lane'
    ]);
  });
});

function overlapsReservedLane(
  object: { readonly distance: number; readonly x: number; readonly width: number; readonly radius: number; readonly collisionShape: string },
  laneDistance: number,
  laneXRatio: number,
  laneWidth: number
): boolean {
  if (Math.abs(object.distance - laneDistance) > 78) {
    return false;
  }

  const footprint = object.collisionShape === 'circle' ? object.radius * 2 : object.width;
  const objectLeft = object.x - footprint / 2;
  const objectRight = object.x + footprint / 2;
  const laneCenter = COMBAT_ARENA_WIDTH * laneXRatio;

  return objectLeft <= laneCenter + laneWidth / 2 && objectRight >= laneCenter - laneWidth / 2;
}
