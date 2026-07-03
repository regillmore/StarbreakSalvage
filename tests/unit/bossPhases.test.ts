import { describe, expect, it } from 'vitest';

import { BOSSES, getBossById, type BossId } from '../../src/content/bosses';
import {
  createCombatState,
  updateCombatState,
  type CombatBounds
} from '../../src/game/CombatState';

const bounds: CombatBounds = {
  width: 640,
  height: 720,
  padding: 24
};

describe('boss phases', () => {
  it.each(BOSSES.map((boss) => [boss.id] as const))(
    'advances %s into its next phase when hull crosses the threshold',
    (bossId) => {
      const definition = getBossById(bossId);
      const nextPhase = definition.phases[1];

      if (!nextPhase) {
        throw new Error(`Boss ${bossId} is missing a second phase.`);
      }

      const state = createCombatState(bounds, `PHASE-${bossId}`, {
        bossId,
        bossSpawnAtSeconds: 0,
        skipEnemyWaves: true
      });
      const boss = state.boss;

      if (!boss) {
        throw new Error(`Boss ${bossId} did not spawn.`);
      }

      state.telegraphs.push({
        id: 900,
        kind: 'fan',
        factionId: boss.factionId,
        label: 'STALE WARNING',
        x: boss.x,
        y: boss.y,
        radius: 60,
        width: 0,
        height: 0,
        ttl: 1,
        maxTtl: 1
      });
      state.projectiles.push({
        id: 901,
        owner: 'player',
        x: boss.x,
        y: boss.y,
        vx: 0,
        vy: 0,
        radius: 8,
        damage: definition.maxHull * (1 - nextPhase.startsAtHullRatio) + 0.2,
        ttl: 1,
        tags: ['laser'],
        procDepth: 0
      });

      updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);

      expect(state.boss?.phaseIndex).toBe(1);
      expect(state.boss?.phaseLabel).toBe(nextPhase.label);
      expect(state.boss?.currentWarningLabel).toBe(nextPhase.warningLabel);
      expect(state.boss?.currentAttackCadenceSeconds).toBeCloseTo(
        definition.attackCadenceSeconds * nextPhase.attackCadenceMultiplier
      );
      expect(state.telegraphs).toEqual([]);
    }
  );

  it('keeps late core wreck volleys deterministic and inside the projectile budget', () => {
    const firstVolley = collectFinalCoreVolley();
    const secondVolley = collectFinalCoreVolley();

    expect(firstVolley).toEqual(secondVolley);
    expect(firstVolley.phaseLabel).toBe('Core Unsealed');
    expect(firstVolley.telegraph).toEqual({
      kind: 'ring',
      label: 'CORE UNSEALED'
    });
    expect(firstVolley.enemyProjectileCount).toBeGreaterThan(0);
    expect(firstVolley.enemyProjectileCount).toBeLessThanOrEqual(12);
  });
});

function collectFinalCoreVolley(): {
  readonly phaseLabel: string;
  readonly telegraph: { readonly kind: string; readonly label: string } | null;
  readonly enemyProjectileCount: number;
  readonly projectileVelocities: readonly string[];
} {
  const state = createCombatState(bounds, 'CORE-WRECK-PHASE-CHECK', {
    bossId: 'boss_core_wreck' satisfies BossId,
    bossSpawnAtSeconds: 0,
    skipEnemyWaves: true
  });
  const boss = state.boss;

  if (!boss) {
    throw new Error('Core Wreck did not spawn.');
  }

  boss.y = boss.targetY;
  boss.hull = boss.maxHull * 0.28;
  updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);

  const phasedBoss = state.boss;

  if (!phasedBoss) {
    throw new Error('Core Wreck disappeared before phase check.');
  }

  phasedBoss.attackCooldown = 0;
  updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);

  const telegraph = state.telegraphs[0]
    ? {
        kind: state.telegraphs[0].kind,
        label: state.telegraphs[0].label
      }
    : null;

  for (let frame = 0; frame < 70; frame += 1) {
    updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);
  }

  const enemyProjectiles = state.projectiles.filter((projectile) => projectile.owner === 'enemy');

  return {
    phaseLabel: phasedBoss.phaseLabel,
    telegraph,
    enemyProjectileCount: enemyProjectiles.length,
    projectileVelocities: enemyProjectiles.map(
      (projectile) => `${projectile.vx.toFixed(2)},${projectile.vy.toFixed(2)}`
    )
  };
}
