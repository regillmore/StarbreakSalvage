import { describe, expect, it } from 'vitest';

import { getSetPieceById, getSetPieceLayoutById } from '../../src/content/setPieces';
import {
  createCombatState,
  damageSetPieceComponentsInRadius,
  damageSetPieceComponentsInRect,
  updateCombatState,
  type CombatBounds,
  type CombatState
} from '../../src/game/CombatState';
import {
  createSetPiecePlan,
  getSetPieceForwardFireLane,
  setPieceComponentOverlapsCircle
} from '../../src/game/SetPiece';

const bounds: CombatBounds = { width: 640, height: 720, padding: 24 };

describe('set-piece combat integration', () => {
  it('lets corrected straight-fire loadouts reach either opening Hecaton shield', () => {
    for (const targetId of ['hecaton-emitter-a', 'hecaton-emitter-b']) {
      const state = createState(1, 'starboard-ledger');
      const target = requireComponent(state, targetId);
      const definition = getSetPieceById(state.setPiece!.plan.definitionId);
      const layout = getSetPieceLayoutById(definition, state.setPiece!.plan.layoutId);
      const lane = getSetPieceForwardFireLane(definition, layout, targetId);
      if (!lane) throw new Error(`Expected a forward-fire lane to ${targetId}.`);

      target.hull = 0.5;
      for (const component of state.setPiece!.components) {
        component.subsystemCooldownSeconds = 99;
      }
      state.player.x = (lane.minX + lane.maxX) / 2;
      state.player.y = bounds.height - bounds.padding - state.player.radius;
      updateCombatState(
        state,
        { movement: { x: 0, y: 0 }, fire: true, scrollDistance: state.scrollDistance },
        1 / 120,
        bounds
      );

      for (let frame = 0; frame < 240 && !target.destroyed; frame += 1) {
        updateCombatState(
          state,
          { movement: { x: 0, y: 0 }, fire: false, scrollDistance: state.scrollDistance },
          1 / 120,
          bounds
        );
      }

      expect(target.destroyed).toBe(true);
      expect(state.stats.setPieceComponentsDestroyed).toBe(1);
    }
  });

  it('routes projectile damage through dependency locks and explicit accounting', () => {
    const state = createState(1);
    const emitter = requireComponent(state, 'hecaton-emitter-a');
    const armor = requireComponent(state, 'hecaton-armor');
    armor.hull = 1;
    emitter.hull = 1;

    fireFixtureProjectile(state, armor.x, armor.y, 'weapon');
    expect(armor.hull).toBe(1);
    expect(state.projectiles).toHaveLength(0);
    expect(state.stats.setPieceComponentsDestroyed).toBe(0);

    fireFixtureProjectile(state, emitter.x, emitter.y, 'special');
    expect(emitter.destroyed).toBe(true);
    expect(state.stats.setPieceComponentsDestroyed).toBe(1);
    expect(state.stats.environmentObjectsDestroyed).toBe(1);
    expect(state.stats.enemiesDestroyed).toBe(0);
  });

  it('accepts bombs and hazard rectangles while capping actor rewards', () => {
    const state = createState(1);
    const firstEmitter = requireComponent(state, 'hecaton-emitter-a');
    const secondEmitter = requireComponent(state, 'hecaton-emitter-b');
    firstEmitter.hull = 1;
    secondEmitter.hull = 1;

    expect(
      damageSetPieceComponentsInRadius(
        state,
        firstEmitter.x,
        firstEmitter.y,
        firstEmitter.radius + 2,
        'bomb',
        4
      )
    ).toBe(1);
    expect(
      damageSetPieceComponentsInRect(
        state,
        {
          left: secondEmitter.x - 40,
          right: secondEmitter.x + 40,
          top: secondEmitter.y - 40,
          bottom: secondEmitter.y + 40
        },
        'hazard',
        4
      )
    ).toBe(1);

    const droppedAfterFirstPass = state.stats.setPieceRewardsDropped;
    damageSetPieceComponentsInRadius(
      state,
      firstEmitter.x,
      firstEmitter.y,
      firstEmitter.radius + 2,
      'bomb',
      100
    );
    expect(state.stats.setPieceRewardsDropped).toBe(droppedAfterFirstPass);
    expect(state.stats.setPieceRewardsDropped).toBeLessThanOrEqual(
      state.setPiece?.plan.caps.rewardPickups ?? 0
    );
  });

  it('pushes contact toward the authored safe lane without changing world geometry', () => {
    const state = createState(1);
    const drive = requireComponent(state, 'hecaton-drive');
    state.player.x = drive.x;
    state.player.y = drive.y;

    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: state.scrollDistance },
      0,
      bounds
    );

    expect(state.player.x).toBeLessThan(drive.x);
    expect(state.player.x).toBeGreaterThanOrEqual(bounds.padding + state.player.radius);
    expect(
      setPieceComponentOverlapsCircle(
        state.scrollDistance,
        drive,
        state.player.x,
        state.player.y,
        state.player.radius
      )
    ).toBe(false);
    expect(state.stats.damageTaken).toBe(1);
  });

  it('caps turret fire and subsystem destruction stops future pressure', () => {
    const state = createState(1);
    const turret = requireComponent(state, 'hecaton-turret');

    for (let index = 0; index < 30; index += 1) {
      turret.subsystemCooldownSeconds = 0;
      updateCombatState(
        state,
        { movement: { x: 0, y: 0 }, fire: false, scrollDistance: state.scrollDistance },
        0,
        bounds
      );
    }

    expect(state.projectiles.filter((projectile) => projectile.setPieceSourceId)).toHaveLength(
      state.setPiece?.plan.caps.projectiles ?? 0
    );
    expect(state.stats.setPieceProjectilesFired).toBe(state.setPiece?.plan.caps.projectiles ?? 0);

    turret.hull = 1;
    fireFixtureProjectile(state, turret.x, turret.y, 'weapon');
    const firedAtDestruction = state.stats.setPieceProjectilesFired;
    turret.subsystemCooldownSeconds = 0;
    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: state.scrollDistance },
      0,
      bounds
    );

    expect(turret.destroyed).toBe(true);
    expect(state.stats.setPieceProjectilesFired).toBe(firedAtDestruction);
  });

  it('lets a fast hangar kill cancel its bounded formation launch', () => {
    const state = createState(1);
    for (const id of ['hecaton-emitter-a', 'hecaton-emitter-b', 'hecaton-armor']) {
      const component = requireComponent(state, id);
      component.hull = 1;
      damageSetPieceComponentsInRadius(
        state,
        component.x,
        component.y,
        Math.max(component.radius, component.width / 2) + 2,
        'bomb',
        4
      );
    }

    const hangar = requireComponent(state, 'hecaton-hangar');
    expect(hangar.targetable).toBe(true);
    hangar.hull = 1;
    damageSetPieceComponentsInRadius(state, hangar.x, hangar.y, hangar.width / 2 + 2, 'special', 4);
    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: state.scrollDistance },
      0.1,
      bounds
    );

    expect(hangar.destroyed).toBe(true);
    expect(state.stats.setPieceReinforcementsSpawned).toBe(0);
    expect(state.enemies).toHaveLength(0);
  });

  it('preserves every explicit credit and salvage reward under the actor pickup cap', () => {
    const state = createState(1);
    for (const id of [
      'hecaton-emitter-a',
      'hecaton-emitter-b',
      'hecaton-turret',
      'hecaton-armor',
      'hecaton-hangar',
      'hecaton-drive',
      'hecaton-core'
    ]) {
      const component = requireComponent(state, id);
      damageSetPieceComponentsInRadius(state, component.x, component.y, 1, 'bomb', 100);
    }

    const events = state.setPiece?.eventLog ?? [];
    const expectedCredits = events.reduce((total, event) => total + event.credits, 0);
    const expectedSalvage = events.reduce((total, event) => total + event.salvage, 0);
    const droppedCredits = state.pickups
      .filter((pickup) => pickup.kind === 'credit')
      .reduce((total, pickup) => total + pickup.value, 0);
    const droppedSalvage = state.pickups
      .filter((pickup) => pickup.kind === 'salvage')
      .reduce((total, pickup) => total + pickup.value, 0);

    expect(state.setPiece?.completed).toBe(true);
    expect(droppedCredits).toBe(expectedCredits);
    expect(droppedSalvage).toBe(expectedSalvage);
    expect(state.pickups.length).toBeLessThanOrEqual(state.setPiece?.plan.caps.rewardPickups ?? 0);
  });
});

function createState(sectorIndex: number, layoutId?: string): CombatState {
  const setPiecePlan = createSetPiecePlan({ sectorIndex, scrollLength: 2400, layoutId });
  const state = createCombatState(bounds, `SET-PIECE-COMBAT-${sectorIndex}`, {
    skipEnemyWaves: true,
    bossSpawnAtSeconds: null,
    setPiecePlan
  });
  state.scrollDistance = setPiecePlan?.anchorDistance ?? 0;
  return state;
}

function requireComponent(state: CombatState, id: string) {
  const component = state.setPiece?.components.find((candidate) => candidate.id === id);
  if (!component) throw new Error(`Expected component ${id}.`);
  return component;
}

function fireFixtureProjectile(
  state: CombatState,
  x: number,
  y: number,
  source: 'weapon' | 'special'
): void {
  state.projectiles.push({
    id: 9999,
    owner: 'player',
    x,
    y,
    vx: 0,
    vy: 0,
    radius: 8,
    damage: 4,
    ttl: 1,
    tags: source === 'special' ? ['phase'] : ['laser'],
    procDepth: 0,
    environmentDamageSource: source
  });
  updateCombatState(
    state,
    { movement: { x: 0, y: 0 }, fire: false, scrollDistance: state.scrollDistance },
    0,
    bounds
  );
}
