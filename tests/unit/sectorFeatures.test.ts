import { describe, expect, it } from 'vitest';

import { createCombatState, type CombatBounds } from '../../src/game/CombatState';
import { createDefaultCombatBounds } from '../../src/game/CombatGeometry';
import { generateRunSkeleton } from '../../src/game/Generation';
import { resolveSectorHazardCollisions } from '../../src/game/SectorHazards';
import {
  getActiveSectorHazards,
  getSectorHazardCollisionRect,
  getSectorHazardReadability,
  getSectorHazardVisualState,
  summarizeSectorFeaturePlan,
  validateSectorFeaturePlan,
  type SectorFeaturePlan
} from '../../src/game/SectorFeatures';
import { calculateViewportLayout } from '../../src/app/ViewportLayout';
import {
  HAZARD_ZONE_DEFINITIONS,
  HAZARD_ZONE_IDS,
  getHazardZoneDefinition,
  getHazardZoneMetrics
} from '../../src/content/hazardZones';

const bounds: CombatBounds = {
  width: 640,
  height: 720,
  padding: 24
};

describe('SectorFeatures', () => {
  it('generates deterministic landmark and hazard plans for known seeds', () => {
    const first = summarizeFeatures('STARBREAK-SMOKE');
    const second = summarizeFeatures('STARBREAK-SMOKE');
    const varied = summarizeFeatures('VOID-CORSAIR-7');

    expect(first).toEqual(second);
    expect(first).not.toEqual(varied);
  });

  it('ships valid sparse features with at least three hazard kinds across the route', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const hazardKinds = new Set<string>();

    for (const sector of run.sectors) {
      expect(validateSectorFeaturePlan(sector.features, sector.scroll.length)).toEqual([]);
      expect(sector.features.landmarks.length).toBeGreaterThanOrEqual(3);
      expect(sector.features.hazards.length).toBeGreaterThanOrEqual(2);

      for (const hazard of sector.features.hazards) {
        hazardKinds.add(hazard.kind);
        expect(hazard.telegraphDistance).toBeLessThan(hazard.startDistance);
        expect(hazard.startDistance).toBeLessThan(hazard.endDistance);
      }
    }

    expect(hazardKinds.size).toBeGreaterThanOrEqual(3);
  });

  it('maps every current hazard kind to a hazard-zone definition', () => {
    expect(HAZARD_ZONE_DEFINITIONS.map((definition) => definition.id)).toEqual([
      ...HAZARD_ZONE_IDS
    ]);

    for (const definition of HAZARD_ZONE_DEFINITIONS) {
      expect(definition.bossArenaPolicy).toBe('hideAndDefer');
      expect(definition.readability.renderLayer).toBe('underBullets');
      expect(definition.readability.minTelegraphLead).toBe(definition.phase.minTelegraphLead);

      for (const source of ['sector', 'condition', 'pacing'] as const) {
        const metrics = getHazardZoneMetrics(definition.id, source);

        expect(metrics.telegraphLead).toBeGreaterThanOrEqual(definition.phase.minTelegraphLead);
        expect(metrics.activeSpan).toBeGreaterThanOrEqual(definition.phase.minActiveSpan);
        expect(metrics.widthRatio).toBeGreaterThan(0);
        expect(metrics.widthRatio).toBeLessThanOrEqual(0.5);
      }
    }

    for (const sector of generateRunSkeleton('STARBREAK-SMOKE').sectors) {
      for (const hazard of sector.features.hazards) {
        const definition = getHazardZoneDefinition(hazard.kind);

        expect(hazard.label).toBe(definition.label);
        expect(hazard.damage).toBe(definition.damage);
        expect(hazard.startDistance - hazard.telegraphDistance).toBeGreaterThanOrEqual(
          definition.phase.minTelegraphLead
        );
      }
    }
  });

  it('ships deterministic lunar-specific landmarks and hazard patterns', () => {
    const first = getLunarSector();
    const second = getLunarSector();

    expect(validateSectorFeaturePlan(first.features, first.scroll.length)).toEqual([]);
    expect(summarizeSectorFeaturePlan(first.features)).toEqual(
      summarizeSectorFeaturePlan(second.features)
    );
    expect(first.features.landmarks.map((landmark) => landmark.kind)).toEqual(
      expect.arrayContaining(['crater_shadow_band', 'comm_array_flyby', 'surface_relay'])
    );
    expect(first.features.hazards.map((hazard) => hazard.kind)).toEqual(
      expect.arrayContaining(['dust_plume', 'mining_laser', 'surface_defense_arc'])
    );
  });

  it('keeps lunar hazards telegraphed, collision-bounded, and rendered under bullets', () => {
    const lunarSector = getLunarSector();
    const hazard = lunarSector.features.hazards.find(
      (candidate) => candidate.kind === 'mining_laser'
    );

    if (!hazard) {
      throw new Error('Expected lunar mining laser hazard.');
    }

    const metadata = getSectorHazardReadability(hazard.kind);
    const rect = getSectorHazardCollisionRect(hazard, bounds);

    expect(metadata.renderLayer).toBe('underBullets');
    expect(metadata.collisionShape).toBe('verticalBand');
    expect(metadata.maxFillAlpha).toBeLessThanOrEqual(0.11);
    expect(hazard.startDistance - hazard.telegraphDistance).toBeGreaterThanOrEqual(
      metadata.minTelegraphLead
    );
    expect(rect.top).toBe(bounds.padding);
    expect(rect.bottom).toBe(bounds.height - bounds.padding);
    expect(rect.width).toBeGreaterThanOrEqual(24);

    expect(getActiveSectorHazards(lunarSector.features, hazard.telegraphDistance - 0.01)).toEqual(
      []
    );
    expect(
      getActiveSectorHazards(lunarSector.features, hazard.telegraphDistance + 0.01).find(
        (activeHazard) => activeHazard.hazard.id === hazard.id
      )?.phase
    ).toBe('telegraph');
    expect(
      getActiveSectorHazards(lunarSector.features, hazard.startDistance + 0.01).find(
        (activeHazard) => activeHazard.hazard.id === hazard.id
      )?.phase
    ).toBe('active');
  });

  it('opens hazard telegraph and active phases from scroll distance', () => {
    const sector = getOpeningSector();
    const hazard = sector.features.hazards[0];

    if (!hazard) {
      throw new Error('Expected opening sector hazard.');
    }

    const singleHazardPlan = createSingleHazardPlan(hazard);

    expect(getActiveSectorHazards(singleHazardPlan, hazard.telegraphDistance - 0.01)).toEqual([]);
    expect(
      getActiveSectorHazards(singleHazardPlan, hazard.telegraphDistance + 0.01)[0]?.phase
    ).toBe('telegraph');
    expect(getActiveSectorHazards(singleHazardPlan, hazard.startDistance + 0.01)[0]?.phase).toBe(
      'active'
    );
    expect(getActiveSectorHazards(singleHazardPlan, hazard.endDistance + 0.01)).toEqual([]);
  });

  it('damages the player only while overlapping an active hazard lane', () => {
    const state = createCombatState(bounds, 'HAZARD-COLLISION', {
      skipEnemyWaves: true
    });
    const hazard = {
      ...getRequiredHazard(),
      telegraphDistance: 80,
      startDistance: 100,
      endDistance: 200,
      xRatio: state.player.x / bounds.width,
      widthRatio: 0.18
    };
    const plan = createSingleHazardPlan(hazard);

    const telegraph = resolveSectorHazardCollisions(state, plan, 90, bounds);

    expect(telegraph.hitHazardIds).toEqual([]);
    expect(state.stats.damageTaken).toBe(0);

    const active = resolveSectorHazardCollisions(state, plan, 120, bounds);

    expect(active.hitHazardIds).toEqual([hazard.id]);
    expect(state.stats.damageTaken).toBe(1);
    expect(state.player.hull).toBe(state.player.maxHull - 1);
  });

  it('defers boss-release hazards that were hidden by the arena lock', () => {
    const state = createCombatState(bounds, 'HAZARD-BOSS-RELEASE', {
      skipEnemyWaves: true
    });
    const releaseDistance = 120;
    const hazard = {
      ...getRequiredHazard(),
      telegraphDistance: 80,
      startDistance: 100,
      endDistance: 180,
      xRatio: state.player.x / bounds.width,
      widthRatio: 0.18
    };
    const plan = createSingleHazardPlan(hazard);

    expect(getActiveSectorHazards(plan, releaseDistance)[0]?.phase).toBe('active');

    const deferredAtRelease = getActiveSectorHazards(plan, releaseDistance, {
      deferOverlappingFromDistance: releaseDistance
    })[0];

    expect(deferredAtRelease?.phase).toBe('telegraph');
    expect(deferredAtRelease?.phaseProgress).toBe(0);

    const releaseCollision = resolveSectorHazardCollisions(state, plan, releaseDistance, bounds, {
      deferOverlappingFromDistance: releaseDistance
    });

    expect(releaseCollision.hitHazardIds).toEqual([]);
    expect(state.stats.damageTaken).toBe(0);

    const activeAfterDeferredLead = resolveSectorHazardCollisions(
      state,
      plan,
      releaseDistance + (hazard.startDistance - hazard.telegraphDistance) + 0.01,
      bounds,
      { deferOverlappingFromDistance: releaseDistance }
    );

    expect(activeAfterDeferredLead.hitHazardIds).toEqual([hazard.id]);
    expect(state.stats.damageTaken).toBe(1);
  });

  it('does not damage the player outside the active hazard lane', () => {
    const state = createCombatState(bounds, 'HAZARD-MISS', {
      skipEnemyWaves: true
    });
    const hazard = {
      ...getRequiredHazard(),
      telegraphDistance: 80,
      startDistance: 100,
      endDistance: 200,
      xRatio: 0.86,
      widthRatio: 0.1
    };
    const plan = createSingleHazardPlan(hazard);

    state.player.x = bounds.padding + state.player.radius;

    const active = resolveSectorHazardCollisions(state, plan, 120, bounds);

    expect(active.damagingHazardIds).toEqual([hazard.id]);
    expect(active.hitHazardIds).toEqual([]);
    expect(state.stats.damageTaken).toBe(0);
  });

  it('keeps hazard lane ratios stable when viewport presentation scale changes', () => {
    const combatBounds = createDefaultCombatBounds();
    const hazard = {
      ...getRequiredHazard(),
      xRatio: 0.5,
      widthRatio: 0.25
    };
    const rect = getSectorHazardCollisionRect(hazard, combatBounds);
    const narrow = calculateViewportLayout({ width: 390, height: 700, dpr: 2 });
    const wide = calculateViewportLayout({ width: 1280, height: 720, dpr: 1 });

    expect(rect.width).toBeCloseTo(combatBounds.width * hazard.widthRatio);
    expect((rect.width * narrow.canvasScale) / narrow.gameplaySafeFrame.width).toBeCloseTo(
      hazard.widthRatio
    );
    expect((rect.width * wide.canvasScale) / wide.gameplaySafeFrame.width).toBeCloseTo(
      hazard.widthRatio
    );
  });

  it('keeps reduced-motion hazard warnings static but visible', () => {
    const reduced = getSectorHazardVisualState(
      { phase: 'telegraph', progress: 0.31, phaseProgress: 0.5 },
      true
    );
    const animated = getSectorHazardVisualState(
      { phase: 'telegraph', progress: 0.31, phaseProgress: 0.5 },
      false
    );

    expect(reduced.pulseScale).toBe(1);
    expect(animated.pulseScale).not.toBe(1);
    expect(reduced.fillAlpha).toBeLessThanOrEqual(0.11);
    expect(reduced.strokeAlpha).toBeGreaterThan(0.7);
  });

  it('rejects invalid generated feature fixtures', () => {
    const badPlan: SectorFeaturePlan = {
      sectorId: 'sector_outer_debris_field',
      sectorIndex: 1,
      landmarks: [
        {
          id: 'duplicate',
          kind: 'not_a_landmark',
          distance: -1,
          xRatio: 1.2,
          widthRatio: 0.2,
          heightRatio: 0.2,
          label: ''
        }
      ] as unknown as SectorFeaturePlan['landmarks'],
      hazards: [
        {
          id: 'duplicate',
          kind: 'not_a_hazard',
          telegraphDistance: 200,
          startDistance: 100,
          endDistance: 90,
          xRatio: 0.5,
          widthRatio: 1.3,
          damage: 0,
          label: ''
        }
      ] as unknown as SectorFeaturePlan['hazards']
    };

    const errors = validateSectorFeaturePlan(badPlan, 150);

    expect(errors).toContain(
      'Sector feature plan sector_outer_debris_field has invalid landmark kind: not_a_landmark'
    );
    expect(errors).toContain(
      'Sector feature plan sector_outer_debris_field has invalid hazard kind: not_a_hazard'
    );
    expect(errors).toContain(
      'Sector feature plan sector_outer_debris_field has duplicate feature id: duplicate'
    );
    expect(errors).toContain(
      'Sector feature plan sector_outer_debris_field hazard duplicate telegraph must precede start'
    );
    expect(errors).toContain(
      'Sector feature plan sector_outer_debris_field hazard duplicate start must precede end'
    );
    expect(errors).toContain(
      'Sector feature plan sector_outer_debris_field hazard duplicate must have positive damage'
    );
  });

  it('rejects valid hazard ids with unsafe registered phase windows', () => {
    const baseHazard = getRequiredHazard();
    const definition = getHazardZoneDefinition(baseHazard.kind);
    const startDistance = 240;
    const badPlan = createSingleHazardPlan({
      ...baseHazard,
      telegraphDistance: startDistance - definition.phase.minTelegraphLead + 1,
      startDistance,
      endDistance: startDistance + definition.phase.minActiveSpan - 1
    });

    const errors = validateSectorFeaturePlan(badPlan, 500);

    expect(errors).toContain(
      `Sector feature plan ${badPlan.sectorId} hazard ${baseHazard.id} telegraph lead is below ${definition.phase.minTelegraphLead}`
    );
    expect(errors).toContain(
      `Sector feature plan ${badPlan.sectorId} hazard ${baseHazard.id} active span is below ${definition.phase.minActiveSpan}`
    );
  });
});

function summarizeFeatures(seed: string): unknown {
  return generateRunSkeleton(seed).sectors.map((sector) =>
    summarizeSectorFeaturePlan(sector.features)
  );
}

function getOpeningSector() {
  const sector = generateRunSkeleton('STARBREAK-SMOKE').sectors[0];

  if (!sector) {
    throw new Error('Expected opening sector.');
  }

  return sector;
}

function getLunarSector() {
  const sector = generateRunSkeleton('LUNAR-SURFACE-LANE').sectors.find(
    (candidate) => candidate.sectorId === 'sector_lunar_surface'
  );

  if (!sector) {
    throw new Error('Expected lunar sector.');
  }

  return sector;
}

function getRequiredHazard() {
  const hazard = getOpeningSector().features.hazards[0];

  if (!hazard) {
    throw new Error('Expected opening sector hazard.');
  }

  return hazard;
}

function createSingleHazardPlan(hazard: SectorFeaturePlan['hazards'][number]): SectorFeaturePlan {
  const sector = getOpeningSector();

  return {
    ...sector.features,
    hazards: [hazard]
  };
}
