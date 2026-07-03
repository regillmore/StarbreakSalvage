import { describe, expect, it } from 'vitest';

import { generateRunSkeleton, summarizeRunSkeleton } from '../../src/game/Generation';
import {
  createWaveDirectorPlan,
  getObjectiveProgress,
  type ObjectiveProgressState
} from '../../src/game/WaveDirector';

describe('WaveDirector', () => {
  it('builds a deterministic multi-wave opening sector from run data', () => {
    const plan = getPlan('STARBREAK-SMOKE', 0);

    expect(plan.objective.requiredEnemyKills).toBeGreaterThan(1);
    expect(plan.bossSpawnAtSeconds).toBeNull();
    expect(plan.waves.map((wave) => [wave.index, wave.label, wave.startsAtSeconds])).toEqual([
      [0, 'salvage_thief_dive', 0.45],
      [1, 'wreck_gnat_swarm', 1.8]
    ]);
    expect(plan.spawnSchedule.map((spawn) => spawn.atSeconds)).toEqual([0.45, 1.8]);
    expect(plan.spawnSchedule.every((spawn) => spawn.xRatio === 0.5)).toBe(true);
  });

  it('requires issued waves, cleared enemies, and target kills before completion', () => {
    const plan = getPlan('STARBREAK-SMOKE', 0);

    expect(
      getObjectiveProgress(
        plan,
        makeProgressState({ enemiesDestroyed: 1, nextSpawnIndex: plan.spawnSchedule.length })
      ).complete
    ).toBe(false);
    expect(
      getObjectiveProgress(
        plan,
        makeProgressState({
          enemiesDestroyed: plan.objective.requiredEnemyKills,
          nextSpawnIndex: plan.spawnSchedule.length - 1
        })
      ).complete
    ).toBe(false);
    expect(
      getObjectiveProgress(
        plan,
        makeProgressState({
          enemiesDestroyed: plan.objective.requiredEnemyKills,
          nextSpawnIndex: plan.spawnSchedule.length,
          enemies: [{} as never]
        })
      ).complete
    ).toBe(false);

    const progress = getObjectiveProgress(
      plan,
      makeProgressState({
        enemiesDestroyed: plan.objective.requiredEnemyKills,
        nextSpawnIndex: plan.spawnSchedule.length
      })
    );

    expect(progress.complete).toBe(true);
    expect(progress.readout).toContain('targets 2/2');
  });

  it('keeps boss-gated sectors open until the boss is defeated', () => {
    const plan = getPlan('STARBREAK-SMOKE', 3);

    expect(plan.objective.bossRequired).toBe(true);
    expect(plan.bossSpawnAtSeconds).toBe(5.55);
    expect(plan.spawnSchedule).toHaveLength(6);

    const bossActive = getObjectiveProgress(
      plan,
      makeProgressState({
        enemiesDestroyed: plan.objective.requiredEnemyKills,
        nextSpawnIndex: plan.spawnSchedule.length,
        boss: {} as never
      })
    );

    expect(bossActive.complete).toBe(false);
    expect(bossActive.readout).toContain('boss gate active');

    const bossDefeated = getObjectiveProgress(
      plan,
      makeProgressState({
        enemiesDestroyed: plan.objective.requiredEnemyKills + 1,
        bossesDefeated: 1,
        nextSpawnIndex: plan.spawnSchedule.length
      })
    );

    expect(bossDefeated.complete).toBe(true);
    expect(bossDefeated.readout).toContain('boss defeated');
  });

  it('matches the known-seed objective snapshot', () => {
    expect(summarizeRunSkeleton(generateRunSkeleton('STARBREAK-SMOKE'))).toMatchInlineSnapshot(`
      {
        "contracts": [
          {
            "rewardMultiplier": 1.01,
            "shipId": "ship_drone_chaplain",
            "sponsor": "Orbital Parish Mutual",
            "stats": {
              "bombCapacity": 2,
              "hitRadius": 18,
              "maxHull": 3,
              "speed": 340,
              "startingCredits": 16,
              "startingSalvage": 0,
            },
            "weaponPattern": "dual",
          },
          {
            "rewardMultiplier": 1.26,
            "shipId": "ship_debt_runner",
            "sponsor": "Redline Credit Union",
            "stats": {
              "bombCapacity": 2,
              "hitRadius": 16,
              "maxHull": 2,
              "speed": 430,
              "startingCredits": 22,
              "startingSalvage": 0,
            },
            "weaponPattern": "single",
          },
          {
            "rewardMultiplier": 1.03,
            "shipId": "ship_relic_thief",
            "sponsor": "Unmarked Vault Services",
            "stats": {
              "bombCapacity": 1,
              "hitRadius": 17,
              "maxHull": 2,
              "speed": 350,
              "startingCredits": 12,
              "startingSalvage": 1,
            },
            "weaponPattern": "single",
          },
        ],
        "sectors": [
          {
            "bossFactionId": "faction_corporate_ledger",
            "bossId": "boss_auditor_drone_xl",
            "bossPatternId": "auditFan",
            "majorWaves": [
              "salvage_thief_dive",
              "wreck_gnat_swarm",
              "mine_drift",
            ],
            "objective": {
              "bossRequired": false,
              "bossSpawnAtSeconds": null,
              "kind": "clearWaves",
              "requiredEnemyKills": 2,
              "requiredWaves": 2,
              "spawnsPerWave": 1,
            },
            "routes": [
              "shop",
              "glitch",
              "repair",
            ],
            "sectorId": "sector_outer_debris_field",
          },
          {
            "bossFactionId": "faction_corporate_ledger",
            "bossId": "boss_auditor_drone_xl",
            "bossPatternId": "auditFan",
            "majorWaves": [
              "barcode_turret_lane",
              "credit_minefield",
              "shield_barge_wall",
            ],
            "objective": {
              "bossRequired": false,
              "bossSpawnAtSeconds": null,
              "kind": "clearWaves",
              "requiredEnemyKills": 4,
              "requiredWaves": 2,
              "spawnsPerWave": 2,
            },
            "routes": [
              "shop",
              "repair",
              "elite",
            ],
            "sectorId": "sector_trade_war_corridor",
          },
          {
            "bossFactionId": "faction_corporate_ledger",
            "bossId": "boss_warranty_void_seraph",
            "bossPatternId": "auditFan",
            "majorWaves": [
              "bloom_lattice",
              "regenerator_pods",
              "spore_spiral",
            ],
            "objective": {
              "bossRequired": false,
              "bossSpawnAtSeconds": null,
              "kind": "clearWaves",
              "requiredEnemyKills": 6,
              "requiredWaves": 3,
              "spawnsPerWave": 2,
            },
            "routes": [
              "elite",
              "vault",
              "shop",
            ],
            "sectorId": "sector_bio_machine_bloom",
          },
          {
            "bossFactionId": "faction_corporate_ledger",
            "bossId": "boss_auditor_drone_xl",
            "bossPatternId": "auditFan",
            "majorWaves": [
              "beam_warning_grid",
              "elite_laser_fan",
              "mine_checkerboard",
            ],
            "objective": {
              "bossRequired": true,
              "bossSpawnAtSeconds": 5.55,
              "kind": "defeatBoss",
              "requiredEnemyKills": 6,
              "requiredWaves": 3,
              "spawnsPerWave": 2,
            },
            "routes": [
              "factionAmbush",
              "repair",
              "glitch",
            ],
            "sectorId": "sector_corporate_kill_grid",
          },
          {
            "bossFactionId": "faction_scrap_court",
            "bossId": "boss_core_wreck",
            "bossPatternId": "missileCurtain",
            "majorWaves": [
              "mixed_faction_storm",
              "final_scrap_curtain",
              "core_lockdown",
            ],
            "objective": {
              "bossRequired": true,
              "bossSpawnAtSeconds": 5.55,
              "kind": "defeatBoss",
              "requiredEnemyKills": 9,
              "requiredWaves": 3,
              "spawnsPerWave": 3,
            },
            "routes": [
              "elite",
              "repair",
              "glitch",
            ],
            "sectorId": "sector_core_wreck",
          },
        ],
        "seed": "STARBREAK-SMOKE",
      }
    `);
  });
});

function getPlan(seed: string, sectorIndex: number) {
  const run = generateRunSkeleton(seed);
  const sector = run.sectors[sectorIndex];

  if (!sector) {
    throw new Error(`Missing sector ${sectorIndex}.`);
  }

  return createWaveDirectorPlan({
    seed: `${run.seed}:combat:${sector.sectorId}`,
    objective: sector.objective,
    majorWaves: sector.majorWaves,
    preferredFactionId: sector.bossFactionId
  });
}

function makeProgressState(
  overrides: Partial<
    Pick<ObjectiveProgressState, 'nextSpawnIndex' | 'enemies' | 'boss'> & {
      readonly enemiesDestroyed: number;
      readonly bossesDefeated: number;
    }
  > = {}
): ObjectiveProgressState {
  return {
    nextSpawnIndex: overrides.nextSpawnIndex ?? 0,
    enemies: overrides.enemies ?? [],
    boss: overrides.boss ?? null,
    stats: {
      enemiesDestroyed: overrides.enemiesDestroyed ?? 0,
      bossesDefeated: overrides.bossesDefeated ?? 0,
      shotsFired: 0,
      pickupsCollected: 0,
      damageTaken: 0,
      itemTriggers: 0,
      specialsUsed: 0,
      bombsUsed: 0,
      grazes: 0,
      enemyProjectilesCancelled: 0
    }
  };
}
