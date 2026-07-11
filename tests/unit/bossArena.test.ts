import { describe, expect, it } from 'vitest';

import { generateRunSkeleton } from '../../src/game/Generation';
import {
  createBossArenaPlan,
  createBossArenaState,
  updateBossArenaState,
  type BossArenaPlan
} from '../../src/game/BossArena';

describe('BossArena', () => {
  it('creates deterministic arena distance marks for boss-gated sectors', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const arenaSummary = run.sectors.map((sector) =>
      sector.arena
        ? {
            sectorId: sector.sectorId,
            approachStartDistance: sector.arena.approachStartDistance,
            lockDistance: sector.arena.lockDistance,
            releaseDistance: sector.arena.releaseDistance,
            approachSpeed: sector.arena.approachSpeed
          }
        : null
    );

    expect(arenaSummary).toMatchInlineSnapshot(`
      [
        null,
        null,
        null,
        {
          "approachSpeed": 58,
          "approachStartDistance": 2001.07,
          "lockDistance": 2203.71,
          "releaseDistance": 2533,
          "sectorId": "sector_corporate_kill_grid",
        },
        null,
        null,
        null,
        null,
        {
          "approachSpeed": 68.44,
          "approachStartDistance": 2725,
          "lockDistance": 2955,
          "releaseDistance": 3315,
          "sectorId": "sector_corporate_kill_grid",
        },
        {
          "approachSpeed": 71.92,
          "approachStartDistance": 2984,
          "lockDistance": 3214,
          "releaseDistance": 3574,
          "sectorId": "sector_core_wreck",
        },
        null,
        null,
        null,
        {
          "approachSpeed": 74.24,
          "approachStartDistance": 3601,
          "lockDistance": 3831,
          "releaseDistance": 4191,
          "sectorId": "sector_gravity_choir",
        },
        {
          "approachSpeed": 74.24,
          "approachStartDistance": 3906,
          "lockDistance": 4136,
          "releaseDistance": 4496,
          "sectorId": "sector_horizon_scar",
        },
      ]
    `);
  });

  it('does not create an arena for non-boss objectives', () => {
    const sector = generateRunSkeleton('STARBREAK-SMOKE').sectors[0];

    if (!sector) {
      throw new Error('Expected opening sector.');
    }

    expect(
      createBossArenaPlan({
        sectorId: 'sector_outer_debris_field',
        objective: sector.objective,
        scroll: sector.scroll
      })
    ).toBeNull();
  });

  it('slows on approach, locks at the arena, and spawns once when support is clear', () => {
    const arena = getBossArena();
    const state = createBossArenaState(arena);

    expect(
      updateBossArenaState(state, {
        distance: arena.approachStartDistance - 1,
        supportComplete: true,
        bossActive: false,
        bossAlreadySpawned: false,
        bossDefeated: false
      })
    ).toEqual({ phase: 'travel', speedOverride: null, shouldSpawnBoss: false });

    expect(
      updateBossArenaState(state, {
        distance: arena.approachStartDistance,
        supportComplete: true,
        bossActive: false,
        bossAlreadySpawned: false,
        bossDefeated: false
      })
    ).toEqual({ phase: 'approach', speedOverride: arena.approachSpeed, shouldSpawnBoss: false });

    expect(
      updateBossArenaState(state, {
        distance: arena.lockDistance,
        supportComplete: false,
        bossActive: false,
        bossAlreadySpawned: false,
        bossDefeated: false
      })
    ).toEqual({ phase: 'locked', speedOverride: 0, shouldSpawnBoss: false });

    expect(
      updateBossArenaState(state, {
        distance: arena.lockDistance,
        supportComplete: true,
        bossActive: false,
        bossAlreadySpawned: false,
        bossDefeated: false
      })
    ).toEqual({ phase: 'locked', speedOverride: 0, shouldSpawnBoss: true });

    expect(
      updateBossArenaState(state, {
        distance: arena.lockDistance,
        supportComplete: true,
        bossActive: false,
        bossAlreadySpawned: false,
        bossDefeated: false
      })
    ).toEqual({ phase: 'locked', speedOverride: 0, shouldSpawnBoss: false });
  });

  it('unlocks after boss defeat and resumes exit speed', () => {
    const arena = getBossArena();
    const state = createBossArenaState(arena);

    updateBossArenaState(state, {
      distance: arena.lockDistance,
      supportComplete: true,
      bossActive: false,
      bossAlreadySpawned: false,
      bossDefeated: false
    });

    expect(
      updateBossArenaState(state, {
        distance: arena.lockDistance,
        supportComplete: true,
        bossActive: false,
        bossAlreadySpawned: true,
        bossDefeated: true
      })
    ).toEqual({ phase: 'released', speedOverride: arena.exitSpeed, shouldSpawnBoss: false });
  });

  it('does not request arena boss spawning after a debug boss shortcut already spawned', () => {
    const arena = getBossArena();
    const state = createBossArenaState(arena);

    expect(
      updateBossArenaState(state, {
        distance: arena.lockDistance,
        supportComplete: true,
        bossActive: true,
        bossAlreadySpawned: true,
        bossDefeated: false
      })
    ).toEqual({ phase: 'locked', speedOverride: 0, shouldSpawnBoss: false });
  });
});

function getBossArena(): BossArenaPlan {
  const arena = generateRunSkeleton('STARBREAK-SMOKE').sectors[3]?.arena;

  if (!arena) {
    throw new Error('Expected fourth sector to have a boss arena.');
  }

  return arena;
}
