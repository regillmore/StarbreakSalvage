import { describe, expect, it } from 'vitest';

import { SHIPS } from '../../src/content/ships';
import { getWeaponById } from '../../src/content/weapons';
import {
  createCombatState,
  updateCombatState,
  type CombatBounds
} from '../../src/game/CombatState';
import { applyItemHooks } from '../../src/game/ItemHooks';
import { applyPlainProjectileFocus, isPlainProjectile } from '../../src/game/PlainProjectile';
import { createWeaponProjectileBlueprints } from '../../src/game/WeaponProjectiles';

const BOUNDS: CombatBounds = { width: 640, height: 720, padding: 24 };

describe('Scrap Monk plain projectile focus', () => {
  it('amplifies the natural weapon volley and marks it for focused feedback', () => {
    const ship = SHIPS.find((candidate) => candidate.id === 'ship_scrap_monk');
    if (!ship) throw new Error('Expected Scrap Monk content.');
    const weapon = getWeaponById(ship.weapon);
    const baseline = createWeaponProjectileBlueprints(weapon, { x: 0, y: 0, radius: 0 });
    const state = createCombatState(BOUNDS, 'PLAIN-FOCUS', {
      weaponId: ship.weapon,
      shipStats: ship.stats,
      skipEnemyWaves: true
    });

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: true }, 0, BOUNDS);
    const shots = state.projectiles.filter((projectile) => projectile.owner === 'player');

    expect(ship.stats.plainProjectileDamageMultiplier).toBe(1.3);
    expect(shots).toHaveLength(baseline.length);
    expect(shots.every((projectile) => projectile.tags.includes('plain'))).toBe(true);
    expect(shots.map((projectile) => projectile.damage)).toEqual(
      baseline.map((projectile) => projectile.damage * 1.3)
    );
  });

  it('keeps focus on untouched shots while transformed branches forfeit it', () => {
    const ship = SHIPS.find((candidate) => candidate.id === 'ship_scrap_monk');
    if (!ship) throw new Error('Expected Scrap Monk content.');
    const state = createCombatState(BOUNDS, 'PLAIN-MIXED-VOLLEY', {
      weaponId: ship.weapon,
      shipStats: ship.stats,
      items: [{ itemId: 'item_split_prism', acquisitionOrder: 0 }],
      skipEnemyWaves: true
    });

    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: true }, 0, BOUNDS);
    const shots = state.projectiles.filter((projectile) => projectile.owner === 'player');
    const focused = shots.filter((projectile) => projectile.tags.includes('plain'));
    const transformed = shots.filter((projectile) => projectile.tags.includes('split'));

    expect(shots).toHaveLength(6);
    expect(focused).toHaveLength(2);
    expect(transformed).toHaveLength(4);
    expect(transformed.every((projectile) => !projectile.tags.includes('plain'))).toBe(true);
  });

  it('supports ordered raw upgrades and a deterministic periodic plain echo', () => {
    const weapon = getWeaponById('weapon_basic_blaster');
    const base = createWeaponProjectileBlueprints(weapon, { x: 0, y: 0, radius: 0 });
    const items = [
      { itemId: 'item_stillpoint_flywheel' as const, acquisitionOrder: 0 },
      { itemId: 'item_empty_hand_repeater' as const, acquisitionOrder: 1 },
      { itemId: 'item_unadorned_bore' as const, acquisitionOrder: 2 }
    ];
    const firePayload = applyItemHooks('onFire', items, {
      volleyIndex: 4,
      projectiles: base
    });
    const spawned = firePayload.projectiles.map(
      (projectile) => applyItemHooks('onProjectileSpawn', items, { projectile }).projectile
    );

    expect(spawned).toHaveLength(2);
    expect(spawned.every(isPlainProjectile)).toBe(true);
    expect(spawned[0]?.damage).toBeCloseTo((base[0]?.damage ?? 0) * 1.12 * 1.1);
    expect(spawned[1]?.damage).toBeCloseTo((base[0]?.damage ?? 0) * 1.12 * 0.72 * 1.1);
    expect(
      applyPlainProjectileFocus(spawned[0]!, { plainProjectileDamageMultiplier: 1.3 }).tags
    ).toContain('plain');
  });

  it('does not grant focused damage to ordinary ships', () => {
    const projectile = createWeaponProjectileBlueprints(getWeaponById('weapon_basic_blaster'), {
      x: 0,
      y: 0,
      radius: 0
    })[0]!;

    expect(applyPlainProjectileFocus(projectile)).toBe(projectile);
  });
});
