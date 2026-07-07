import { describe, expect, it } from 'vitest';

import { ENEMY_ATTACK_FAMILIES, type EnemyAttackFamily } from '../../src/content/enemyRoles';
import type { CombatBounds, EnemyState, PlayerState } from '../../src/game/CombatState';
import {
  createEnemyAttackProjectiles,
  createEnemyAttackTelegraphs,
  getEnemyAttackProfile
} from '../../src/systems/EnemyAttack';

const bounds: CombatBounds = { width: 640, height: 720, padding: 24 };
const player = {
  x: 320,
  y: 575,
  radius: 18
} as PlayerState;

describe('EnemyAttack', () => {
  it('defines bounded attack and telegraph profiles for every registered family', () => {
    for (const attackFamily of ENEMY_ATTACK_FAMILIES) {
      const profile = getEnemyAttackProfile(attackFamily);
      const enemy = makeEnemy({ factionId: factionForAttackFamily(attackFamily) });
      const telegraphs = createEnemyAttackTelegraphs(enemy, attackFamily, player, bounds);
      const projectiles = createEnemyAttackProjectiles(enemy, attackFamily, player, 0);

      expect(profile.cooldownSeconds).toBeGreaterThanOrEqual(0.9);
      expect(profile.telegraphSeconds).toBeGreaterThanOrEqual(0.18);
      expect(projectiles).toHaveLength(profile.projectileBudget);
      expect(projectiles.length).toBeLessThanOrEqual(3);
      expect(telegraphs.length).toBeLessThanOrEqual(3);
      expect(
        telegraphs.every(
          (telegraph) =>
            telegraph.x >= bounds.padding &&
            telegraph.x <= bounds.width - bounds.padding &&
            telegraph.y >= 0 &&
            telegraph.y <= bounds.height
        )
      ).toBe(true);
    }
  });

  it('keeps current live roles distinct in cadence, warning, and projectile pressure', () => {
    const families: readonly EnemyAttackFamily[] = [
      'driftShot',
      'laneBurst',
      'sporeSpread',
      'phaseSkirmish'
    ];

    const signatures = families.map((attackFamily) => {
      const profile = getEnemyAttackProfile(attackFamily);
      const enemy = makeEnemy({ factionId: factionForAttackFamily(attackFamily) });
      const telegraphs = createEnemyAttackTelegraphs(enemy, attackFamily, player, bounds);
      const projectiles = createEnemyAttackProjectiles(enemy, attackFamily, player, 0);

      return [
        attackFamily,
        profile.cooldownSeconds,
        profile.telegraphSeconds,
        telegraphs.map((telegraph) => telegraph.kind).join(','),
        projectiles.map((projectile) => `${projectile.radius}:${projectile.tags.join('+')}`).join(',')
      ];
    });

    expect(new Set(signatures.map((signature) => signature.slice(1).join('|'))).size).toBe(
      families.length
    );
  });

  it('aims scout phase needles deterministically at the player', () => {
    const enemy = makeEnemy({
      factionId: 'faction_void_corsairs',
      x: 256,
      y: 130
    });

    const first = createEnemyAttackProjectiles(enemy, 'phaseSkirmish', player, 0);
    const second = createEnemyAttackProjectiles(enemy, 'phaseSkirmish', player, 0);

    expect(first).toEqual(second);
    expect(first).toHaveLength(2);
    expect(first[0]?.vx).toBeLessThan(first[1]?.vx ?? 0);
    expect(first.every((projectile) => projectile.vy > 250)).toBe(true);
    expect(first.every((projectile) => projectile.tags.includes('phase'))).toBe(true);
  });

  it('alternates hazard mark drift by attack sequence without changing budget', () => {
    const enemy = makeEnemy({ factionId: 'faction_bloom_hive' });
    const first = createEnemyAttackProjectiles(enemy, 'hazardMark', player, 0);
    const second = createEnemyAttackProjectiles(enemy, 'hazardMark', player, 1);

    expect(first).toHaveLength(2);
    expect(second).toHaveLength(2);
    expect(first.map((projectile) => projectile.vx)).not.toEqual(
      second.map((projectile) => projectile.vx)
    );
    expect(first.every((projectile) => projectile.tags.includes('curse'))).toBe(true);
  });
});

function makeEnemy(overrides: Partial<EnemyState> = {}): EnemyState {
  return {
    id: 1,
    factionId: 'faction_corporate_ledger',
    x: 320,
    y: 128,
    radius: 17,
    hull: 2,
    maxHull: 2,
    drift: 0,
    targetY: 128,
    homeX: 320,
    fireCooldown: 1,
    ...overrides
  };
}

function factionForAttackFamily(attackFamily: EnemyAttackFamily): EnemyState['factionId'] {
  if (attackFamily === 'driftShot' || attackFamily === 'deployBurst') {
    return 'faction_scrap_court';
  }

  if (attackFamily === 'sporeSpread' || attackFamily === 'hazardMark') {
    return 'faction_bloom_hive';
  }

  if (attackFamily === 'phaseSkirmish' || attackFamily === 'chargedShot') {
    return 'faction_void_corsairs';
  }

  return 'faction_corporate_ledger';
}
