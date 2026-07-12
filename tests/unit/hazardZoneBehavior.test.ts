import { describe, expect, it } from 'vitest';

import {
  HAZARD_ZONE_DEFINITIONS,
  getHazardZoneDefinition,
  type HazardZoneId
} from '../../src/content/hazardZones';
import { createCombatState, type CombatBounds } from '../../src/game/CombatState';
import { resolveSectorHazardCollisions } from '../../src/game/SectorHazards';
import {
  getActiveSectorHazards,
  getSectorHazardDamageRects,
  getSectorHazardVisualState,
  type SectorFeaturePlan,
  type SectorHazardPlan
} from '../../src/game/SectorFeatures';

const bounds: CombatBounds = {
  width: 640,
  height: 720,
  padding: 24
};

describe('HazardZoneBehavior', () => {
  it('ships at least five rich behavior families with telegraph and active cues', () => {
    const behaviorKinds = new Set(
      HAZARD_ZONE_DEFINITIONS.map((definition) => definition.behavior.kind)
    );

    expect(behaviorKinds.size).toBeGreaterThanOrEqual(5);

    for (const definition of HAZARD_ZONE_DEFINITIONS) {
      expect(definition.behavior.warningCue).not.toBe(definition.behavior.activeCue);
      expect(definition.behavior.collisionBands).toBeGreaterThanOrEqual(1);
      expect(definition.behavior.activeDamageDutyCycle).toBeGreaterThanOrEqual(0.45);
      expect(definition.readability.renderLayer).toBe('underBullets');
    }
  });

  it('opens collision only after the validated warning lead', () => {
    const hazard = createHazard('mining_laser', {
      telegraphDistance: 80,
      startDistance: 230,
      endDistance: 360
    });
    const plan = createPlan(hazard);
    const warning = getActiveSectorHazards(plan, 160)[0];
    const active = getActiveSectorHazards(plan, 280)[0];

    if (!warning || !active) {
      throw new Error('Expected sweep hazard phases.');
    }

    expect(hazard.startDistance - hazard.telegraphDistance).toBeGreaterThanOrEqual(
      getHazardZoneDefinition(hazard.kind).phase.minTelegraphLead
    );
    expect(warning.phase).toBe('telegraph');
    expect(getSectorHazardDamageRects(warning, bounds)).toEqual([]);
    expect(active.phase).toBe('active');
    expect(getSectorHazardDamageRects(active, bounds).length).toBe(1);
  });

  it('delegates mine-belt damage to discrete proximity-mine entities', () => {
    const hazard = createHazard('mine_belt', {
      telegraphDistance: 80,
      startDistance: 230,
      endDistance: 390
    });
    const active = getActiveSectorHazards(createPlan(hazard), 260)[0];

    if (!active) {
      throw new Error('Expected a scheduled mine cluster.');
    }

    expect(getSectorHazardVisualState(active, false, false, false).behaviorKind).toBe(
      'discreteMineCluster'
    );
    expect(getSectorHazardDamageRects(active, bounds)).toEqual([]);
  });

  it('supports pulsed active windows without changing generated timing', () => {
    const hazard = createHazard('surface_defense_arc', {
      telegraphDistance: 20,
      startDistance: 170,
      endDistance: 470
    });
    const plan = createPlan(hazard);
    const openPulse = getActiveSectorHazards(plan, 180)[0];
    const closedPulse = getActiveSectorHazards(plan, 250)[0];

    if (!openPulse || !closedPulse) {
      throw new Error('Expected pulse hazard phases.');
    }

    expect(openPulse.phase).toBe('active');
    expect(getSectorHazardDamageRects(openPulse, bounds).length).toBeGreaterThan(0);
    expect(closedPulse.phase).toBe('active');
    expect(getSectorHazardDamageRects(closedPulse, bounds)).toEqual([]);
    expect(closedPulse.hazard.startDistance).toBe(hazard.startDistance);
    expect(closedPulse.hazard.endDistance).toBe(hazard.endDistance);
  });

  it('keeps hazard damage on cooldown after an active hit', () => {
    const state = createCombatState(bounds, 'HAZARD-COOLDOWN', {
      skipEnemyWaves: true
    });
    const hazard = createHazard('debris_lane', {
      telegraphDistance: 40,
      startDistance: 190,
      endDistance: 320,
      xRatio: state.player.x / bounds.width,
      widthRatio: 0.2
    });
    const plan = createPlan(hazard);

    const first = resolveSectorHazardCollisions(state, plan, 220, bounds);
    const second = resolveSectorHazardCollisions(state, plan, 230, bounds);

    expect(first.hitHazardIds).toEqual([hazard.id]);
    expect(second.hitHazardIds).toEqual([]);
    expect(state.stats.damageTaken).toBe(1);
    expect(state.player.invulnerableSeconds).toBeGreaterThanOrEqual(
      getHazardZoneDefinition(hazard.kind).damageCooldownSeconds
    );
  });

  it('cleans up active hazard state after the end distance', () => {
    const hazard = createHazard('dust_plume', {
      telegraphDistance: 20,
      startDistance: 190,
      endDistance: 330
    });
    const plan = createPlan(hazard);

    expect(getActiveSectorHazards(plan, 329.99).length).toBe(1);
    expect(getActiveSectorHazards(plan, 330.01)).toEqual([]);
  });

  it('simplifies render state for reduced-motion and performance settings', () => {
    const hazard = createHazard('surface_defense_arc', {
      telegraphDistance: 20,
      startDistance: 170,
      endDistance: 470
    });
    const active = getActiveSectorHazards(createPlan(hazard), 180)[0];

    if (!active) {
      throw new Error('Expected active pulse hazard.');
    }

    const normal = getSectorHazardVisualState(active, false, false, false);
    const reduced = getSectorHazardVisualState(active, true, false, false);
    const performance = getSectorHazardVisualState(active, false, true, false);
    const highContrast = getSectorHazardVisualState(active, false, false, true);

    expect(normal.behaviorKind).toBe('pulseField');
    expect(reduced.pulseScale).toBe(1);
    expect(performance.patternStride).toBeGreaterThan(normal.patternStride);
    expect(performance.segmentCount).toBeLessThanOrEqual(normal.segmentCount);
    expect(highContrast.lineWidth).toBeGreaterThan(normal.lineWidth);
    expect(normal.renderLayer).toBe('underBullets');
  });
});

function createHazard(
  kind: HazardZoneId,
  overrides: Partial<SectorHazardPlan> = {}
): SectorHazardPlan {
  const definition = getHazardZoneDefinition(kind);

  return {
    id: `test_${kind}`,
    kind,
    telegraphDistance: 40,
    startDistance: 190,
    endDistance: 330,
    xRatio: 0.5,
    widthRatio: definition.metrics.sector.widthRatio,
    damage: definition.damage,
    label: definition.label,
    ...overrides
  };
}

function createPlan(hazard: SectorHazardPlan): SectorFeaturePlan {
  return {
    sectorId: 'sector_outer_debris_field',
    sectorIndex: 1,
    landmarks: [
      {
        id: 'test_landmark',
        kind: 'wreck_silhouette',
        distance: 120,
        xRatio: 0.5,
        widthRatio: 0.2,
        heightRatio: 0.12,
        label: 'test landmark'
      }
    ],
    hazards: [hazard]
  };
}
