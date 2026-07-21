import { describe, expect, it } from 'vitest';

import {
  createDroneFollowerSpecs,
  createMicroChoirVolley,
  getEscortFormationOffset,
  MAX_COMBAT_DRONE_FOLLOWERS
} from '../../src/game/DroneFollowers';
import type { ProjectileBlueprint } from '../../src/game/ItemHooks';

const baseProjectile: ProjectileBlueprint = {
  x: 320,
  y: 560,
  vx: 0,
  vy: -600,
  radius: 4,
  damage: 1,
  ttl: 1.2,
  tags: ['laser'],
  procDepth: 0
};

describe('drone followers', () => {
  it('builds a stable bounded roster from the native bay and fitted launchers', () => {
    const followers = createDroneFollowerSpecs(
      [
        { itemId: 'item_drone_uplink', acquisitionOrder: 4 },
        { itemId: 'item_sidecar_drone_bay', acquisitionOrder: 2 },
        { itemId: 'item_scrap_saints_relay', acquisitionOrder: 1 },
        { itemId: 'item_signal_clone_stamp', acquisitionOrder: 3 }
      ],
      ['module_drone_micro_choir']
    );

    expect(followers).toHaveLength(6);
    expect(followers.map((follower) => follower.sourceId)).toEqual([
      'module_drone_micro_choir',
      'module_drone_micro_choir',
      'item_drone_uplink',
      'item_drone_uplink',
      'item_sidecar_drone_bay',
      'item_signal_clone_stamp'
    ]);
    expect(followers.length).toBeLessThanOrEqual(MAX_COMBAT_DRONE_FOLLOWERS);
  });

  it('adds one alternating reduced Micro-Choir shot without rewriting the base volley', () => {
    const first = createMicroChoirVolley([baseProjectile], 1, ['module_drone_micro_choir']);
    const second = createMicroChoirVolley([baseProjectile], 2, ['module_drone_micro_choir']);

    expect(first[0]).toEqual(baseProjectile);
    expect(first[1]).toMatchObject({
      x: 364,
      vx: 24,
      damage: 0.36,
      tags: ['laser', 'drone'],
      droneSourceId: 'module_drone_micro_choir'
    });
    expect(second[1]).toMatchObject({ x: 276, vx: -24 });
    expect(createMicroChoirVolley([baseProjectile], 1)).toEqual([baseProjectile]);
  });

  it('centers odd formations and widens them symmetrically', () => {
    expect(getEscortFormationOffset(1, 3)).toEqual({ x: 0, y: 36 });
    expect(getEscortFormationOffset(0, 4)).toEqual({ x: -66, y: 51 });
    expect(getEscortFormationOffset(3, 4)).toEqual({ x: 66, y: 51 });
  });
});
