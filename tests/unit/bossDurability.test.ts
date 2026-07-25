import { describe, expect, it } from 'vitest';

import { BOSSES, getBossById } from '../../src/content/bosses';
import {
  BOSS_DPS_BENCHMARKS,
  createBossDurabilityProfile
} from '../../src/game/BossDurability';
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

describe('boss durability', () => {
  it.each(BOSSES.map((boss) => [boss.id] as const))(
    'keeps %s in the authored engagement band across act DPS benchmarks',
    (bossId) => {
      const definition = getBossById(bossId);
      const actProfiles = BOSS_DPS_BENCHMARKS.map((_expectedDps, actIndex) =>
        createBossDurabilityProfile(definition, { actNumber: actIndex + 1 })
      );

      expect(actProfiles[0]?.nominalEngagementSeconds).toBeGreaterThanOrEqual(8);
      expect(actProfiles[0]?.nominalEngagementSeconds).toBeLessThanOrEqual(14.5);
      expect(
        actProfiles.map((profile) => Number(profile.modifiedEngagementSeconds.toFixed(2)))
      ).toEqual(Array.from({ length: BOSS_DPS_BENCHMARKS.length }, () => definition.maxHull / 10));
      expect(actProfiles.map((profile) => profile.maxHull)).toEqual(
        BOSS_DPS_BENCHMARKS.map(
          (expectedDps) => definition.maxHull * (expectedDps / BOSS_DPS_BENCHMARKS[0])
        )
      );
    }
  );

  it('scales positive and negative durability modifiers with the act benchmark', () => {
    const definition = getBossById('boss_core_wreck');
    const baseline = createBossDurabilityProfile(definition, { actNumber: 2 });
    const reinforced = createBossDurabilityProfile(definition, {
      actNumber: 2,
      hullBonus: 10
    });
    const wounded = createBossDurabilityProfile(definition, {
      actNumber: 2,
      hullBonus: -12
    });

    expect(baseline.maxHull).toBe(250);
    expect(reinforced.maxHull).toBe(270);
    expect(reinforced.scaledHullBonus).toBe(20);
    expect(wounded.maxHull).toBe(226);
    expect(wounded.scaledHullBonus).toBe(-24);
  });

  it('threads the act benchmark through production boss spawning', () => {
    const state = createCombatState(bounds, 'ACT-II-BOSS-DURABILITY', {
      bossId: 'boss_core_wreck',
      bossSpawnAtSeconds: 0,
      skipEnemyWaves: true,
      bossHullBonus: 8,
      bossDurabilityActNumber: 2
    });

    expect(state.boss?.maxHull).toBe(266);
    expect(state.boss?.hull).toBe(266);
    expect(state.bossDurabilityActNumber).toBe(2);
  });

  it('keeps a benchmark-damaged boss alive through arrival and its opening attack', () => {
    const state = createCombatState(bounds, 'BOSS-OPENING-ATTACK-DURABILITY', {
      bossId: 'boss_auditor_drone_xl',
      bossSpawnAtSeconds: 0,
      skipEnemyWaves: true,
      bossDurabilityActNumber: 1
    });

    for (let frame = 0; frame < 180; frame += 1) {
      if (!state.boss) {
        break;
      }
      state.boss.hull -= BOSS_DPS_BENCHMARKS[0] / 60;
      updateCombatState(state, { movement: { x: 0, y: 0 }, fire: false }, 1 / 60, bounds);
    }

    expect(state.boss).not.toBeNull();
    expect(state.boss?.y).toBe(state.boss?.targetY);
    expect(state.projectiles.some((projectile) => projectile.owner === 'enemy')).toBe(true);
  });
});
