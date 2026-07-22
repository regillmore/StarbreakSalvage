import { describe, expect, it } from 'vitest';

import {
  HAZARD_ZONE_DEFINITIONS,
  getHazardZoneDefinition,
  type HazardZoneId
} from '../../src/content/hazardZones';
import { createCombatState, spawnBoss, type CombatBounds } from '../../src/game/CombatState';
import { resolveSectorHazardCollisions } from '../../src/game/SectorHazards';
import { getActiveBeamBoltSegment } from '../../src/game/BeamHazard';
import {
  getActiveSectorHazards,
  getSectorHazardCollisionRect,
  getSectorHazardDamageRects,
  getSectorHazardVisualState,
  type SectorFeaturePlan,
  type SectorHazardPlan
} from '../../src/game/SectorFeatures';
import {
  createSalvageStormGeometry,
  formatSalvageStormWarning,
  getSalvageStormPhaseState
} from '../../src/game/SalvageStorm';
import {
  createMeteorStormDebugFixture,
  createMeteorStormGeometry,
  formatMeteorStormWarning
} from '../../src/game/MeteorStorm';

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
      expect(definition.behavior.activeDamageDutyCycle).toBeGreaterThanOrEqual(
        definition.behavior.kind === 'meteorStorm' ? 0.15 : 0.45
      );
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

  it('moves a readable calm channel across three salvage squall surges and lulls', () => {
    const hazard = createHazard('salvage_squall', {
      telegraphDistance: 20,
      startDistance: 170,
      endDistance: 470,
      xRatio: 0.25
    });
    const plan = createPlan(hazard);
    const firstSurge = getActiveSectorHazards(plan, 180)[0];
    const firstLull = getActiveSectorHazards(plan, 240)[0];
    const middleSurge = getActiveSectorHazards(plan, 280)[0];
    const finalSurge = getActiveSectorHazards(plan, 380)[0];

    if (!firstSurge || !firstLull || !middleSurge || !finalSurge) {
      throw new Error('Expected all salvage squall phases.');
    }

    const rect = getSectorHazardCollisionRect(hazard, bounds);
    const firstGeometry = createSalvageStormGeometry(firstSurge, rect);
    expect(firstGeometry.flowDirection).toBe(1);
    expect(firstGeometry.calmLaneIndex).toBe(0);
    expect(firstGeometry.damageRects).toHaveLength(2);
    expect(getSalvageStormPhaseState(firstLull).damageWindowOpen).toBe(false);
    expect(getSectorHazardDamageRects(firstLull, bounds)).toEqual([]);
    expect(getSalvageStormPhaseState(middleSurge).calmLaneIndex).toBe(1);
    expect(getSalvageStormPhaseState(finalSurge).calmLaneIndex).toBe(2);
    expect(formatSalvageStormWarning(firstSurge)).toContain('SURGE 1/3 | CALM LEFT');

    const reversed = getActiveSectorHazards(
      createPlan({ ...hazard, id: 'test_reverse_squall', xRatio: 0.75 }),
      180
    )[0];
    if (!reversed) throw new Error('Expected reverse salvage squall.');
    expect(getSalvageStormPhaseState(reversed)).toMatchObject({
      flowDirection: -1,
      calmLaneIndex: 2
    });
  });

  it('scrolls an already-active rounded meteor pocket through the arena without a path forecast', () => {
    const hazard = createHazard('salvage_storm', {
      telegraphDistance: 20,
      startDistance: 170,
      endDistance: 570,
      xRatio: 0.25
    });
    const plan = createPlan(hazard);
    const hiddenApproach = getActiveSectorHazards(plan, 120)[0];
    const early = getActiveSectorHazards(plan, 182)[0];
    const firstImpact = getActiveSectorHazards(plan, 198)[0];
    const late = getActiveSectorHazards(plan, 530)[0];
    if (!hiddenApproach || !early || !firstImpact || !late) {
      throw new Error('Expected meteor storm approach and active phases.');
    }

    const rect = getSectorHazardCollisionRect(hazard, bounds);
    const approachGeometry = createMeteorStormGeometry(hiddenApproach, rect);
    const earlyGeometry = createMeteorStormGeometry(early, rect);
    const impactGeometry = createMeteorStormGeometry(firstImpact, rect);
    const lateGeometry = createMeteorStormGeometry(late, rect);

    expect(approachGeometry.impacts).toEqual([]);
    expect(approachGeometry.damageImpacts).toEqual([]);
    expect(approachGeometry.pocket.centerY + approachGeometry.pocket.radiusY).toBeLessThan(
      rect.top
    );
    expect(earlyGeometry.impacts.some((impact) => impact.phase === 'telegraph')).toBe(true);
    expect(impactGeometry.damageImpacts).toHaveLength(1);
    expect(getSectorHazardDamageRects(firstImpact, bounds)[0]?.width).toBeLessThan(70);
    expect(lateGeometry.pocket.centerY).toBeGreaterThan(earlyGeometry.pocket.centerY);
    expect(lateGeometry.pocket.centerX).toBe(earlyGeometry.pocket.centerX);
    expect(formatMeteorStormWarning(hiddenApproach)).toBe('METEOR STORM | INBOUND');
    expect(formatMeteorStormWarning(early)).toMatch(/\d+ MARKED \| \d+ IMPACTING/);

    const runtimeAdvanced = getActiveSectorHazards(plan, 260, {
      distanceOverrides: { [hazard.id]: 350 }
    })[0];
    const worldPosition = getActiveSectorHazards(plan, 260)[0];
    if (!runtimeAdvanced || !worldPosition) throw new Error('Expected anchored meteor storm.');
    expect(runtimeAdvanced.phaseProgress).toBeGreaterThan(worldPosition.phaseProgress);
    const runtimeGeometry = createMeteorStormGeometry(runtimeAdvanced, rect);
    const worldGeometry = createMeteorStormGeometry(worldPosition, rect);
    const effectivePosition = getActiveSectorHazards(plan, 350)[0];
    if (!effectivePosition) throw new Error('Expected effective meteor position.');
    expect(Math.abs(runtimeGeometry.pocket.centerY - worldGeometry.pocket.centerY)).toBeLessThan(5);
    expect(runtimeGeometry.pocket.centerY).toBeLessThan(
      createMeteorStormGeometry(effectivePosition, rect).pocket.centerY
    );
  });

  it('provides one deterministic route-meteor browser inspection fixture', () => {
    const source = createPlan(createHazard('warning_beam'));
    const first = createMeteorStormDebugFixture(source, 1800);
    const repeated = createMeteorStormDebugFixture(source, 1800);

    expect(repeated).toEqual(first);
    expect(first.features.hazards).toEqual([first.hazard]);
    expect(first.hazard).toMatchObject({
      id: 'debug_route_meteor_storm',
      kind: 'salvage_storm',
      label: 'ROUTE METEORS',
      widthRatio: 0.48
    });
    expect(first.targetDistance).toBeGreaterThan(first.hazard.startDistance);
    expect(first.targetDistance).toBeLessThan(first.hazard.endDistance);
    expect(first.targetDistance - first.hazard.startDistance).toBeGreaterThan(190);

    const lateFixture = createMeteorStormDebugFixture(source, 1800, 1200);
    expect(lateFixture.hazard.startDistance).toBe(1200);
    expect(lateFixture.targetDistance).toBeGreaterThan(1200);
  });

  it('damages every allegiance only inside the brief circular meteor impact', () => {
    const state = createCombatState(bounds, 'METEOR-STORM', {
      skipEnemyWaves: true
    });
    const hazard = createHazard('salvage_storm', {
      telegraphDistance: 20,
      startDistance: 170,
      endDistance: 570,
      xRatio: 0.25
    });
    const plan = createPlan(hazard);
    const activeHazard = getActiveSectorHazards(plan, 198)[0];
    if (!activeHazard) throw new Error('Expected an active meteor impact.');
    const geometry = createMeteorStormGeometry(
      activeHazard,
      getSectorHazardCollisionRect(hazard, bounds)
    );
    const impact = geometry.damageImpacts[0];
    if (!impact) throw new Error('Expected a damaging meteor circle.');

    state.player.x = bounds.width - bounds.padding - state.player.radius;
    state.player.y = bounds.height - bounds.padding - state.player.radius;
    state.enemies.push({
      id: 902,
      factionId: 'faction_scrap_court',
      x: impact.x,
      y: impact.y,
      radius: 17,
      hull: 3,
      maxHull: 3,
      drift: 0,
      targetY: impact.y,
      fireCooldown: 10
    });
    state.allies = [
      {
        source: 'crew',
        candidateId: 'meteor-test-ally',
        name: 'Meteor Test Ally',
        callsign: 'MARK',
        role: 'gunner',
        trait: 'steady',
        preferredCommand: 'focus',
        cue: { glyph: 'A', color: '#7cf7ff', highContrastGlyph: 'A' },
        x: impact.x,
        y: impact.y,
        radius: 13,
        hull: 3,
        maxHull: 3,
        moveSpeed: 180,
        fireCooldownSeconds: 1,
        projectileDamage: 1,
        fireCooldown: 0,
        screenCooldown: 0,
        status: 'active',
        enemiesDefeated: 0,
        salvageRecovered: 0,
        fitLabel: 'meteor fixture'
      }
    ];
    const boss = spawnBoss(state, 'boss_auditor_drone_xl', bounds);
    boss.x = impact.x;
    boss.y = impact.y;
    boss.hull = 5;

    const safePass = resolveSectorHazardCollisions(state, plan, 198, bounds);
    expect(safePass.hitHazardIds).toEqual([]);
    expect(state.player.hull).toBe(state.player.maxHull);
    expect(state.enemies[0]?.hull).toBe(2);
    expect(state.allies[0]?.hull).toBe(2);
    expect(state.boss?.hull).toBe(4);
    expect(state.hazardActorCooldowns.size).toBe(3);

    state.player.x = impact.x;
    state.player.y = impact.y;
    const impactPass = resolveSectorHazardCollisions(state, plan, 198, bounds);
    expect(impactPass.hitHazardIds).toEqual([hazard.id]);
    expect(state.player.hull).toBe(state.player.maxHull - 1);
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

  it('lets active beam segments pierce and damage every actor allegiance on cooldown', () => {
    const state = createCombatState(bounds, 'INDISCRIMINATE-BEAM', {
      skipEnemyWaves: true
    });
    const hazard = createHazard('warning_beam', {
      telegraphDistance: 40,
      startDistance: 190,
      endDistance: 340,
      beam: {
        sourceEdge: 'left',
        sourceOffsetRatio: 0.46,
        targetEdge: 'right',
        targetOffsetRatio: 0.46
      }
    });
    const plan = createPlan(hazard);
    const collisionDistance = 272.5;
    const activeHazard = getActiveSectorHazards(plan, collisionDistance)[0];
    const bolt = activeHazard ? getActiveBeamBoltSegment(activeHazard, bounds) : null;
    if (!bolt) throw new Error('Expected an active finite beam bolt.');
    const pointOnBolt = (progress: number) => ({
      x: bolt.startX + (bolt.endX - bolt.startX) * progress,
      y: bolt.startY + (bolt.endY - bolt.startY) * progress
    });
    const playerPoint = pointOnBolt(0.44);
    const enemyPoint = pointOnBolt(0.3);
    const allyPoint = pointOnBolt(0.58);
    const bossPoint = pointOnBolt(0.72);
    state.player.x = playerPoint.x;
    state.player.y = playerPoint.y;
    state.enemies.push({
      id: 901,
      factionId: 'faction_scrap_court',
      x: enemyPoint.x,
      y: enemyPoint.y,
      radius: 17,
      hull: 3,
      maxHull: 3,
      drift: 0,
      targetY: enemyPoint.y,
      fireCooldown: 10
    });
    state.allies = [
      {
        source: 'crew',
        candidateId: 'beam-test-ally',
        name: 'Beam Test Ally',
        callsign: 'LUX',
        role: 'gunner',
        trait: 'steady',
        preferredCommand: 'focus',
        cue: { glyph: 'A', color: '#7cf7ff', highContrastGlyph: 'A' },
        x: allyPoint.x,
        y: allyPoint.y,
        radius: 13,
        hull: 3,
        maxHull: 3,
        moveSpeed: 180,
        fireCooldownSeconds: 1,
        projectileDamage: 1,
        fireCooldown: 0,
        screenCooldown: 0,
        status: 'active',
        enemiesDefeated: 0,
        salvageRecovered: 0,
        fitLabel: 'beam fixture'
      }
    ];
    const boss = spawnBoss(state, 'boss_auditor_drone_xl', bounds);
    boss.x = bossPoint.x;
    boss.y = bossPoint.y;
    boss.hull = 5;

    const first = resolveSectorHazardCollisions(state, plan, collisionDistance, bounds);
    const second = resolveSectorHazardCollisions(state, plan, collisionDistance, bounds);

    expect(first.hitHazardIds).toEqual([hazard.id]);
    expect(second.hitHazardIds).toEqual([]);
    expect(state.player.hull).toBe(state.player.maxHull - 1);
    expect(state.enemies[0]?.hull).toBe(2);
    expect(state.boss?.hull).toBe(4);
    expect(state.allies[0]?.hull).toBe(2);
    expect(state.hazardActorCooldowns.size).toBe(3);
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
