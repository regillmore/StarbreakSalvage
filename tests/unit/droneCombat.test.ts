import { describe, expect, it } from 'vitest';

import {
  createCombatState,
  updateCombatState,
  type CombatBounds
} from '../../src/game/CombatState';

const bounds: CombatBounds = { width: 640, height: 720, padding: 24 };

describe('drone follower combat', () => {
  it('keeps fitted drones in formation and launches their tagged shots from the actors', () => {
    const state = createCombatState(bounds, 'DRONE-FOLLOWER-COMBAT', {
      items: [{ itemId: 'item_drone_uplink', acquisitionOrder: 0 }],
      skipEnemyWaves: true
    });

    expect(state.drones).toHaveLength(2);
    state.player.x = 410;
    state.player.y = 480;
    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 0.1, bounds);
    expect(state.drones.every((drone) => drone.x > 320)).toBe(true);

    for (let volley = 0; volley < 3; volley += 1) {
      state.player.fireCooldown = 0;
      updateCombatState(state, { movement: { x: 0, y: 0 }, fire: true }, 0, bounds);
    }

    const droneShots = state.projectiles.filter(
      (projectile) => projectile.droneSourceId === 'item_drone_uplink'
    );
    expect(droneShots).toHaveLength(2);
    expect(new Set(droneShots.map((projectile) => projectile.x))).toEqual(
      new Set(state.drones.map((drone) => drone.x))
    );
    expect(droneShots.every((projectile) => projectile.y < state.drones[0]!.y)).toBe(true);
    expect(state.drones.every((drone) => drone.firingPulseSeconds > 0)).toBe(true);
  });
});
