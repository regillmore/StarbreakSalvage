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
    expect(
      plan.waves.map((wave) => [
        wave.index,
        wave.label,
        wave.startsAtSeconds,
        wave.startsAtDistance
      ])
    ).toEqual([
      [0, 'salvage_thief_dive', 0.45, 173.04],
      [1, 'wreck_gnat_swarm', 1.8, 836.36]
    ]);
    expect(plan.spawnSchedule.map((spawn) => spawn.atSeconds)).toEqual([0.45, 1.8]);
    expect(plan.spawnSchedule.map((spawn) => spawn.atDistance)).toEqual([173.04, 836.36]);
    expect(plan.spawnSchedule.every((spawn) => spawn.xRatio === 0.5)).toBe(true);
  });

  it('keeps a time-based fallback when no scroll plan is provided', () => {
    const plan = createWaveDirectorPlan({
      seed: 'TIME-FALLBACK',
      objective: {
        kind: 'clearWaves',
        label: 'Fallback Sweep',
        requiredWaves: 2,
        spawnsPerWave: 1,
        requiredEnemyKills: 2,
        bossRequired: false,
        bossSpawnAtSeconds: null
      },
      majorWaves: ['clock_one', 'clock_two'],
      preferredFactionId: 'faction_corporate_ledger'
    });

    expect(plan.waves.map((wave) => wave.startsAtDistance)).toEqual([null, null]);
    expect(plan.spawnSchedule.map((spawn) => spawn.atDistance ?? null)).toEqual([null, null]);
    expect(plan.spawnSchedule.map((spawn) => spawn.atSeconds)).toEqual([0.45, 1.8]);
  });

  it('uses lunar encounter pacing hooks for low-altitude wave spacing', () => {
    const run = generateRunSkeleton('LUNAR-SURFACE-LANE');
    const sector = run.sectors[2];

    if (!sector || sector.sectorId !== 'sector_lunar_surface' || !sector.encounterPacing) {
      throw new Error('Expected paced lunar sector.');
    }

    const plan = createWaveDirectorPlan({
      seed: `${run.seed}:combat:${sector.sectorId}`,
      objective: sector.objective,
      majorWaves: sector.majorWaves,
      preferredFactionId: sector.bossFactionId,
      scroll: sector.scroll,
      pacing: sector.encounterPacing
    });
    const waveDistances = plan.waves.map((wave) => wave.startsAtDistance ?? 0);

    expect(plan.encounterPacing).toEqual(sector.encounterPacing);
    expect(waveDistances[0]).toBeCloseTo(sector.scroll.length * 0.16, 2);
    expect(waveDistances[2]).toBeCloseTo(sector.scroll.length * 0.72, 2);
    expect(plan.spawnSchedule.map((spawn) => spawn.waveLabel)).toEqual([
      sector.majorWaves[0],
      sector.majorWaves[0],
      sector.majorWaves[1],
      sector.majorWaves[1],
      sector.majorWaves[2],
      sector.majorWaves[2]
    ]);
    expect(plan.spawnSchedule.filter((_spawn, index) => index % 2 === 0).map((spawn) => spawn.xRatio)).toEqual([
      0.56,
      0.56,
      0.56
    ]);
    expect(plan.spawnSchedule.filter((_spawn, index) => index % 2 === 1).every((spawn) => spawn.xRatio >= 0.14 && spawn.xRatio <= 0.86)).toBe(true);
    expect(plan.spawnSchedule.every((spawn) => spawn.targetY >= 92 && spawn.targetY <= 158)).toBe(
      true
    );
    expect(plan.spawnSchedule[1]?.atDistance).toBe(
      (plan.spawnSchedule[0]?.atDistance ?? 0) + 34
    );
  });

  it('requires exit distance, issued waves, cleared enemies, and target kills before completion', () => {
    const plan = getPlan('STARBREAK-SMOKE', 0);

    expect(
      getObjectiveProgress(
        plan,
        makeProgressState({
          enemiesDestroyed: plan.objective.requiredEnemyKills,
          nextSpawnIndex: plan.spawnSchedule.length,
          scrollDistance: (plan.sectorLength ?? 0) - 1
        })
      ).complete
    ).toBe(false);
    expect(
      getObjectiveProgress(
        plan,
        makeProgressState({
          enemiesDestroyed: 1,
          nextSpawnIndex: plan.spawnSchedule.length,
          scrollDistance: plan.sectorLength ?? 0
        })
      ).complete
    ).toBe(false);
    expect(
      getObjectiveProgress(
        plan,
        makeProgressState({
          enemiesDestroyed: plan.objective.requiredEnemyKills,
          nextSpawnIndex: plan.spawnSchedule.length - 1,
          scrollDistance: plan.sectorLength ?? 0
        })
      ).complete
    ).toBe(false);
    expect(
      getObjectiveProgress(
        plan,
        makeProgressState({
          enemiesDestroyed: plan.objective.requiredEnemyKills,
          nextSpawnIndex: plan.spawnSchedule.length,
          enemies: [{} as never],
          scrollDistance: plan.sectorLength ?? 0
        })
      ).complete
    ).toBe(false);

    const progress = getObjectiveProgress(
      plan,
      makeProgressState({
        enemiesDestroyed: plan.objective.requiredEnemyKills,
        nextSpawnIndex: plan.spawnSchedule.length,
        scrollDistance: plan.sectorLength ?? 0
      })
    );

    expect(progress.complete).toBe(true);
    expect(progress.distanceComplete).toBe(true);
    expect(progress.readout).toContain('targets 2/2');
    expect(progress.readout).toContain('distance 1442/1442u');
  });

  it('keeps boss-gated sectors open until the boss is defeated', () => {
    const plan = getPlan('STARBREAK-SMOKE', 3);

    expect(plan.objective.bossRequired).toBe(true);
    expect(plan.bossSpawnAtSeconds).toBe(5.55);
    expect(plan.spawnSchedule).toHaveLength(6);
    expect(
      plan.spawnSchedule.map((spawn) => ({
        wave: spawn.waveLabel,
        atSeconds: spawn.atSeconds,
        atDistance: spawn.atDistance
      }))
    ).toEqual([
      { wave: 'beam_warning_grid', atSeconds: 0.45, atDistance: 45 },
      { wave: 'beam_warning_grid', atSeconds: 0.77, atDistance: 85 },
      { wave: 'elite_laser_fan', atSeconds: 1.8, atDistance: 242.5 },
      { wave: 'elite_laser_fan', atSeconds: 2.12, atDistance: 282.5 },
      { wave: 'mine_checkerboard', atSeconds: 3.15, atDistance: 440 },
      { wave: 'mine_checkerboard', atSeconds: 3.47, atDistance: 480 }
    ]);

    const bossActive = getObjectiveProgress(
      plan,
      makeProgressState({
        enemiesDestroyed: plan.objective.requiredEnemyKills,
        nextSpawnIndex: plan.spawnSchedule.length,
        scrollDistance: plan.sectorLength ?? 0,
        boss: {} as never
      })
    );

    expect(bossActive.complete).toBe(false);
    expect(bossActive.readout).toContain('boss gate active');

    const travelIncomplete = getObjectiveProgress(
      plan,
      makeProgressState({
        enemiesDestroyed: plan.objective.requiredEnemyKills + 1,
        bossesDefeated: 1,
        nextSpawnIndex: plan.spawnSchedule.length,
        scrollDistance: (plan.sectorLength ?? 0) - 1
      })
    );

    expect(travelIncomplete.complete).toBe(false);
    expect(travelIncomplete.bossComplete).toBe(true);
    expect(travelIncomplete.distanceComplete).toBe(false);

    const bossDefeated = getObjectiveProgress(
      plan,
      makeProgressState({
        enemiesDestroyed: plan.objective.requiredEnemyKills + 1,
        bossesDefeated: 1,
        nextSpawnIndex: plan.spawnSchedule.length,
        scrollDistance: plan.sectorLength ?? 0
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
            "background": {
              "id": "background_outer_debris_field",
              "layerCount": 4,
              "primitiveCount": 182,
            },
            "bossFactionId": "faction_corporate_ledger",
            "bossId": "boss_auditor_drone_xl",
            "bossPatternId": "auditFan",
            "features": {
              "hazardKinds": [
                "debris_lane",
                "salvage_storm",
              ],
              "hazardWindows": [
                [
                  319.6,
                  490.6,
                  714.6,
                ],
                [
                  605.36,
                  756.36,
                  951.36,
                ],
              ],
              "landmarkKinds": [
                "repair_platform",
                "wreck_silhouette",
                "beacon_line",
              ],
            },
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
            "scroll": {
              "baseSpeed": 85,
              "length": 1442,
              "startOffset": 299,
            },
            "sectorId": "sector_outer_debris_field",
          },
          {
            "background": {
              "id": "background_trade_war_corridor",
              "layerCount": 4,
              "primitiveCount": 152,
            },
            "bossFactionId": "faction_corporate_ledger",
            "bossId": "boss_auditor_drone_xl",
            "bossPatternId": "auditFan",
            "features": {
              "hazardKinds": [
                "mine_belt",
                "warning_beam",
              ],
              "hazardWindows": [
                [
                  401.5,
                  533.5,
                  722.5,
                ],
                [
                  784.7,
                  974.7,
                  1143.7,
                ],
              ],
              "landmarkKinds": [
                "vault_door",
                "convoy_shadow",
                "beacon_line",
              ],
            },
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
            "scroll": {
              "baseSpeed": 92,
              "length": 1665,
              "startOffset": 10706,
            },
            "sectorId": "sector_trade_war_corridor",
          },
          {
            "background": {
              "id": "background_bio_machine_bloom",
              "layerCount": 4,
              "primitiveCount": 136,
            },
            "bossFactionId": "faction_void_corsairs",
            "bossId": "boss_warranty_void_seraph",
            "bossPatternId": "auditFan",
            "features": {
              "hazardKinds": [
                "salvage_storm",
                "mine_belt",
                "debris_lane",
              ],
              "hazardWindows": [
                [
                  404.9,
                  575.9,
                  768.9,
                ],
                [
                  1046.74,
                  1173.74,
                  1369.74,
                ],
                [
                  1467.46,
                  1609.46,
                  1825.46,
                ],
              ],
              "landmarkKinds": [
                "core_machinery",
                "repair_platform",
                "beacon_line",
              ],
            },
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
            "scroll": {
              "baseSpeed": 84,
              "length": 1953,
              "startOffset": 20476,
            },
            "sectorId": "sector_bio_machine_bloom",
          },
          {
            "arena": {
              "approachSpeed": 58,
              "approachStartDistance": 2001.07,
              "lockDistance": 2203.71,
              "releaseDistance": 2533,
            },
            "background": {
              "id": "background_corporate_kill_grid",
              "layerCount": 4,
              "primitiveCount": 150,
            },
            "bossFactionId": "faction_corporate_ledger",
            "bossId": "boss_auditor_drone_xl",
            "bossPatternId": "auditFan",
            "features": {
              "hazardKinds": [
                "crush_gate",
                "warning_beam",
                "mine_belt",
              ],
              "hazardWindows": [
                [
                  575.9,
                  755.9,
                  885.9,
                ],
                [
                  1298.14,
                  1488.14,
                  1652.14,
                ],
                [
                  1985.06,
                  2150.06,
                  2344.06,
                ],
              ],
              "landmarkKinds": [
                "beacon_line",
                "vault_door",
                "core_machinery",
              ],
            },
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
            "scroll": {
              "baseSpeed": 100,
              "length": 2533,
              "startOffset": 30175,
            },
            "sectorId": "sector_corporate_kill_grid",
          },
          {
            "arena": {
              "approachSpeed": 58,
              "approachStartDistance": 2003.44,
              "lockDistance": 2206.32,
              "releaseDistance": 2536,
            },
            "background": {
              "id": "background_core_wreck",
              "layerCount": 4,
              "primitiveCount": 126,
            },
            "bossFactionId": "faction_scrap_court",
            "bossId": "boss_core_wreck",
            "bossPatternId": "missileCurtain",
            "features": {
              "hazardKinds": [
                "warning_beam",
                "salvage_storm",
                "crush_gate",
              ],
              "hazardWindows": [
                [
                  553.8,
                  729.8,
                  895.8,
                ],
                [
                  1378.88,
                  1539.88,
                  1750.88,
                ],
                [
                  1850.52,
                  2044.52,
                  2180.52,
                ],
              ],
              "landmarkKinds": [
                "vault_door",
                "core_machinery",
                "wreck_silhouette",
              ],
            },
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
            "scroll": {
              "baseSpeed": 96,
              "length": 2536,
              "startOffset": 40804,
            },
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
    preferredFactionId: sector.bossFactionId,
    scroll: sector.scroll,
    pacing: sector.encounterPacing
  });
}

function makeProgressState(
  overrides: Partial<
    Pick<ObjectiveProgressState, 'nextSpawnIndex' | 'enemies' | 'boss'> & {
      readonly enemiesDestroyed: number;
      readonly bossesDefeated: number;
      readonly scrollDistance: number;
    }
  > = {}
): ObjectiveProgressState {
  return {
    nextSpawnIndex: overrides.nextSpawnIndex ?? 0,
    enemies: overrides.enemies ?? [],
    boss: overrides.boss ?? null,
    scrollDistance: overrides.scrollDistance ?? 0,
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
      enemyProjectilesCancelled: 0,
      environmentObjectsDestroyed: 0,
      environmentRewardsDropped: 0,
      environmentChainReactions: 0
    }
  };
}
