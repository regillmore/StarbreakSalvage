import { describe, expect, it } from 'vitest';

import {
  createCombatState,
  forceCombatEnd,
  updateCombatState,
  type CombatBounds
} from '../../src/game/CombatState';

const bounds: CombatBounds = {
  width: 640,
  height: 720,
  padding: 24
};

describe('CombatState', () => {
  it('lets player fire destroy enemies and produce pickups', () => {
    const state = createCombatState(bounds, 'STARBREAK-SMOKE');

    for (let frame = 0; frame < 150; frame += 1) {
      updateCombatState(state, { movement: { x: 0, y: 0 }, fire: true }, 1 / 60, bounds);
    }

    expect(state.stats.shotsFired).toBeGreaterThan(1);
    expect(state.stats.enemiesDestroyed).toBeGreaterThanOrEqual(1);
    expect(state.pickups.length + state.stats.pickupsCollected).toBeGreaterThan(0);
  });

  it('collects pickups when they overlap the player', () => {
    const state = createCombatState(bounds, 'STARBREAK-SMOKE');
    state.pickups.push({
      id: 999,
      kind: 'credit',
      x: state.player.x,
      y: state.player.y,
      vx: 0,
      vy: 0,
      radius: 8,
      value: 5
    });

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);

    expect(state.player.credits).toBe(5);
    expect(state.stats.pickupsCollected).toBe(1);
    expect(state.pickups).toHaveLength(0);
  });

  it('ends the run when enemy damage removes the final hull point', () => {
    const state = createCombatState(bounds, 'STARBREAK-SMOKE');
    state.player.hull = 1;
    state.projectiles.push({
      id: 777,
      owner: 'enemy',
      x: state.player.x,
      y: state.player.y,
      vx: 0,
      vy: 0,
      radius: 8,
      damage: 1,
      ttl: 1,
      tags: ['plasma'],
      procDepth: 0
    });

    const result = updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false },
      1 / 60,
      bounds
    );

    expect(result?.reason).toBe('destroyed');
    expect(result?.damageTaken).toBe(1);
    expect(state.ended).toBe(true);
  });

  it('can force a debug run result', () => {
    const state = createCombatState(bounds, 'LASER-TAX-404');
    const result = forceCombatEnd(state, 'debug');

    expect(result.reason).toBe('debug');
    expect(state.ended).toBe(true);
  });
});
