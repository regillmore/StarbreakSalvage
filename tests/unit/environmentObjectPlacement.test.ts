import { describe, expect, it } from 'vitest';

import {
  ENVIRONMENT_OBJECT_DEFINITIONS,
  getEnvironmentObjectsForSector
} from '../../src/content/environmentObjects';
import { COMBAT_ARENA_HEIGHT, COMBAT_ARENA_WIDTH } from '../../src/game/CombatGeometry';
import {
  createEnvironmentObjectPlacementPlan,
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
    }
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
