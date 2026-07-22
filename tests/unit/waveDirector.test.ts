import { describe, expect, it } from 'vitest';

import { generateRunSkeleton, summarizeRunSkeleton } from '../../src/game/Generation';
import {
  createWaveDirectorPlan,
  fitSpawnScheduleBeforeBossLock,
  getObjectiveProgress,
  type ObjectiveProgressState
} from '../../src/game/WaveDirector';
import type { EnemySpawn } from '../../src/game/CombatState';

describe('WaveDirector', () => {
  it('fits every distance-gated support spawn ahead of the live boss lock', () => {
    const schedule: EnemySpawn[] = [
      createTestSpawn(240, 0),
      createTestSpawn(1_108, 1),
      createTestSpawn(1_260, 2),
      createTestSpawn(null, 3)
    ];

    const fitted = fitSpawnScheduleBeforeBossLock(schedule, 1_116);
    const distanceSpawns = fitted.filter(
      (spawn): spawn is EnemySpawn & { readonly atDistance: number } =>
        spawn.atDistance !== null && spawn.atDistance !== undefined
    );

    expect(distanceSpawns.map((spawn) => spawn.atDistance)).toEqual([240, 1008, 1020]);
    expect(distanceSpawns.every((spawn) => spawn.atDistance <= 1_020)).toBe(true);
    expect(fitted.at(-1)?.atDistance).toBeNull();
    expect(schedule.map((spawn) => spawn.atDistance)).toEqual([240, 1108, 1260, null]);
  });

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
    expect(
      plan.spawnSchedule.filter((_spawn, index) => index % 2 === 0).map((spawn) => spawn.xRatio)
    ).toEqual([0.56, 0.56, 0.56]);
    expect(
      plan.spawnSchedule
        .filter((_spawn, index) => index % 2 === 1)
        .every((spawn) => spawn.xRatio >= 0.14 && spawn.xRatio <= 0.86)
    ).toBe(true);
    expect(plan.spawnSchedule.every((spawn) => spawn.targetY >= 92 && spawn.targetY <= 158)).toBe(
      true
    );
    expect(plan.spawnSchedule[1]?.atDistance).toBe((plan.spawnSchedule[0]?.atDistance ?? 0) + 34);
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
        "actRouteGraph": {
          "edgeCount": 42,
          "id": "act-routes:STARBREAK-SMOKE:act_outer_rim:act_core_descent:act_null_frontier:1-2-3-2-1",
          "layerWidths": [
            1,
            2,
            3,
            2,
            1,
          ],
          "nodeCount": 27,
          "nodesPerAct": 9,
          "routeDepth": 5,
        },
        "acts": [
          {
            "bossGate": "checkpoint",
            "id": "act_outer_rim",
            "index": 1,
            "label": "Outer Rim Contract",
            "pressureTier": "baseline",
            "rewardTier": "standard",
            "routeGrammar": [
              "shop",
              "elite",
              "vault",
              "repair",
              "glitch",
              "factionAmbush",
            ],
            "sectorIds": [
              "sector_outer_debris_field",
              "sector_trade_war_corridor",
              "sector_bio_machine_bloom",
              "sector_corporate_kill_grid",
              "sector_trade_war_corridor",
              "sector_bio_machine_bloom",
              "sector_lunar_surface",
              "sector_trade_war_corridor",
              "sector_corporate_kill_grid",
            ],
            "sectorRange": [
              1,
              9,
            ],
            "shortLabel": "Act I",
            "transition": "interActJunction",
          },
          {
            "bossGate": "finale",
            "id": "act_core_descent",
            "index": 2,
            "label": "Core Descent",
            "pressureTier": "elevated",
            "rewardTier": "escalated",
            "routeGrammar": [
              "shop",
              "elite",
              "vault",
              "repair",
              "glitch",
              "factionAmbush",
            ],
            "sectorIds": [
              "sector_trade_war_corridor",
              "sector_corporate_kill_grid",
              "sector_corporate_kill_grid",
              "sector_bio_machine_bloom",
              "sector_trade_war_corridor",
              "sector_trade_war_corridor",
              "sector_bio_machine_bloom",
              "sector_lunar_surface",
              "sector_core_wreck",
            ],
            "sectorRange": [
              10,
              18,
            ],
            "shortLabel": "Act II",
            "transition": "frontierChoice",
          },
          {
            "bossGate": "finale",
            "id": "act_null_frontier",
            "index": 3,
            "label": "Null Frontier",
            "pressureTier": "elevated",
            "rewardTier": "escalated",
            "routeGrammar": [
              "shop",
              "elite",
              "vault",
              "repair",
              "glitch",
              "factionAmbush",
            ],
            "sectorIds": [
              "sector_nullglass_expanse",
              "sector_dead_signal_reef",
              "sector_parallax_foundry",
              "sector_gravity_choir",
              "sector_parallax_foundry",
              "sector_dead_signal_reef",
              "sector_gravity_choir",
              "sector_parallax_foundry",
              "sector_horizon_scar",
            ],
            "sectorRange": [
              19,
              27,
            ],
            "shortLabel": "Act III",
            "transition": "victory",
          },
        ],
        "carrier": {
          "cargoCapacity": 8,
          "carrierId": "carrier_cinder_tender",
          "facilities": [
            "foundry",
            "reactor",
            "medbay",
            "hangar",
          ],
          "id": "carrier:STARBREAK-SMOKE:carrier_cinder_tender:10cqree",
          "liaisonFactionId": "faction_scrap_court",
          "name": "Cinder Tender",
          "origin": "recovered",
        },
        "contracts": [
          {
            "frameId": "frame_parish_chapel",
            "loadoutSignature": "frame_parish_chapel:choir-primary=module_primary_pulse_cannon,parish-engine=module_engine_vector_drive,orbit-command=module_drone_micro_choir",
            "modules": [
              "module_primary_pulse_cannon",
              "module_engine_vector_drive",
              "module_drone_micro_choir",
            ],
            "resources": {
              "command": [
                2,
                4,
              ],
              "heat": [
                10,
                12,
              ],
              "mass": [
                22,
                25,
              ],
              "power": [
                12,
                14,
              ],
            },
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
            "frameId": "frame_redline_needle",
            "loadoutSignature": "frame_redline_needle:nose-primary=module_primary_light_needle_laser,spine-engine=module_engine_vector_drive,ledger-utility=module_utility_credit_tractor",
            "modules": [
              "module_primary_light_needle_laser",
              "module_engine_vector_drive",
              "module_utility_credit_tractor",
            ],
            "resources": {
              "command": [
                0,
                1,
              ],
              "heat": [
                6,
                10,
              ],
              "mass": [
                16,
                18,
              ],
              "power": [
                9,
                11,
              ],
            },
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
            "frameId": "frame_unmarked_reliquary",
            "loadoutSignature": "frame_unmarked_reliquary:plain-primary=module_primary_basic_blaster,quiet-engine=module_engine_vector_drive,vault-utility=module_utility_relic_scanner,sealed-experimental=module_experimental_curse_sink",
            "modules": [
              "module_primary_basic_blaster",
              "module_engine_vector_drive",
              "module_utility_relic_scanner",
              "module_experimental_curse_sink",
            ],
            "resources": {
              "command": [
                2,
                3,
              ],
              "heat": [
                12,
                12,
              ],
              "mass": [
                21,
                22,
              ],
              "power": [
                12,
                12,
              ],
            },
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
        "expedition": {
          "actCount": 3,
          "branchCount": 54,
          "capacity": {
            "baselineMaxSeconds": 1359,
            "baselineMinSeconds": 650,
            "baselineTargetSeconds": 1001,
            "expandedTargetSeconds": 1256,
            "optionalNodeCount": 15,
            "requiredNodeCount": 45,
          },
          "gates": [
            {
              "actId": "act_outer_rim",
              "kind": "checkpoint",
              "transition": "interActJunction",
            },
            {
              "actId": "act_core_descent",
              "kind": "finale",
              "transition": "frontierChoice",
            },
            {
              "actId": "act_null_frontier",
              "kind": "finale",
              "transition": "victory",
            },
          ],
          "id": "expedition_starbreak-smoke_53f226d4",
          "nodeCount": 189,
          "saveFingerprint": "unlocks=unlock_boss_auditor_drill,unlock_challenge_debt_ceiling,unlock_faction_bloom_hive,unlock_item_executive_override,unlock_music_core_descent,unlock_music_outer_debris,unlock_ship_corporate_test_pilot,unlock_ship_phase_courier,unlock_ship_relic_thief,unlock_ship_scrap_monk,unlock_ship_shield_bruiser|upgrades=none",
          "schemaVersion": 2,
          "sectorCount": 27,
        },
        "factionCampaign": {
          "id": "campaign:STARBREAK-SMOKE:10cqree",
          "rivals": [
            {
              "archetypeId": "rival_toll_marshal",
              "factionId": "faction_scrap_court",
              "firstSectorIndex": 1,
              "id": "rival:faction_scrap_court:rival_toll_marshal",
              "name": "Claimant Morrowplate",
              "shipName": "Closed Account",
            },
            {
              "archetypeId": "rival_convoy_warden",
              "factionId": "faction_corporate_ledger",
              "firstSectorIndex": 2,
              "id": "rival:faction_corporate_ledger:rival_convoy_warden",
              "name": "Executor Vale-7",
              "shipName": "Procession Nail",
            },
            {
              "archetypeId": "rival_spore_cantor",
              "factionId": "faction_bloom_hive",
              "firstSectorIndex": 3,
              "id": "rival:faction_bloom_hive:rival_spore_cantor",
              "name": "Gardener Root After Rain",
              "shipName": "Green Refrain",
            },
            {
              "archetypeId": "rival_phase_reaver",
              "factionId": "faction_void_corsairs",
              "firstSectorIndex": 4,
              "id": "rival:faction_void_corsairs:rival_phase_reaver",
              "name": "Ransomer Irix No-Moon",
              "shipName": "Ransom Wake",
            },
          ],
        },
        "frontierCampaign": {
          "factionHooks": [
            "faction_void_corsairs",
            "faction_scrap_court",
            "faction_corporate_ledger",
            "faction_bloom_hive",
            "faction_scrap_court",
          ],
          "finaleBossId": "boss_horizon_leviathan",
          "finaleGate": "Meridian Anchor",
          "id": "frontier_starbreak-smoke_glassMeridian",
          "laws": [
            [
              "sector_nullglass_expanse",
              "law_shard_echo",
            ],
            [
              "sector_dead_signal_reef",
              "law_signal_hunger",
            ],
            [
              "sector_parallax_foundry",
              "law_thermal_inversion",
            ],
            [
              "sector_gravity_choir",
              "law_vector_debt",
            ],
            [
              "sector_horizon_scar",
              "law_last_light",
            ],
          ],
          "name": "Glass Meridian",
          "standardTargetSeconds": 1001,
          "variantId": "glassMeridian",
        },
        "sectors": [
          {
            "act": {
              "id": "act_outer_rim",
              "index": 1,
              "pressureTier": "baseline",
              "rewardTier": "standard",
              "sectorCount": 5,
              "sectorIndex": 1,
            },
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
                  590.36,
                  756.36,
                  1381.36,
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
            "setPiece": {
              "anchorDistance": 606,
              "bossLock": "none",
              "id": "setpiece_ledger_hecaton",
              "layoutId": "starboard-ledger",
              "layoutLabel": "Starboard Ledger",
              "reinforcementFormation": "formation_screen",
              "safeLane": {
                "label": "port maintenance lane",
                "maxX": 170,
                "minX": 30,
              },
            },
          },
          {
            "act": {
              "id": "act_outer_rim",
              "index": 1,
              "pressureTier": "baseline",
              "rewardTier": "standard",
              "sectorCount": 5,
              "sectorIndex": 2,
            },
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
            "act": {
              "id": "act_outer_rim",
              "index": 1,
              "pressureTier": "baseline",
              "rewardTier": "standard",
              "sectorCount": 5,
              "sectorIndex": 2,
            },
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
                  389.9,
                  575.9,
                  1198.9,
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
            "act": {
              "id": "act_outer_rim",
              "index": 1,
              "pressureTier": "baseline",
              "rewardTier": "standard",
              "sectorCount": 5,
              "sectorIndex": 3,
            },
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
            "act": {
              "id": "act_outer_rim",
              "index": 1,
              "pressureTier": "baseline",
              "rewardTier": "standard",
              "sectorCount": 5,
              "sectorIndex": 3,
            },
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
                "debris_lane",
                "warning_beam",
              ],
              "hazardWindows": [
                [
                  436.3,
                  587.3,
                  778.3,
                ],
                [
                  1103.38,
                  1264.38,
                  1455.38,
                ],
                [
                  1471.02,
                  1655.02,
                  1801.02,
                ],
              ],
              "landmarkKinds": [
                "vault_door",
                "convoy_shadow",
                "beacon_line",
              ],
            },
            "majorWaves": [
              "convoy_crossfire",
              "barcode_turret_lane",
              "credit_minefield",
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
              "elite",
              "repair",
              "glitch",
            ],
            "scroll": {
              "baseSpeed": 96,
              "length": 2061,
              "startOffset": 40804,
            },
            "sectorId": "sector_trade_war_corridor",
          },
          {
            "act": {
              "id": "act_outer_rim",
              "index": 1,
              "pressureTier": "baseline",
              "rewardTier": "standard",
              "sectorCount": 5,
              "sectorIndex": 3,
            },
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
                "mine_belt",
                "salvage_storm",
                "debris_lane",
              ],
              "hazardWindows": [
                [
                  598.8,
                  746.8,
                  940.8,
                ],
                [
                  1197.68,
                  1350.68,
                  2004.68,
                ],
                [
                  1904.72,
                  2059.72,
                  2235.72,
                ],
              ],
              "landmarkKinds": [
                "beacon_line",
                "repair_platform",
                "core_machinery",
              ],
            },
            "majorWaves": [
              "spore_spiral",
              "regenerator_pods",
              "bloom_lattice",
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
              "factionAmbush",
              "shop",
            ],
            "scroll": {
              "baseSpeed": 101,
              "length": 2446,
              "startOffset": 50895,
            },
            "sectorId": "sector_bio_machine_bloom",
          },
          {
            "act": {
              "id": "act_outer_rim",
              "index": 1,
              "pressureTier": "baseline",
              "rewardTier": "standard",
              "sectorCount": 5,
              "sectorIndex": 4,
            },
            "background": {
              "id": "background_lunar_surface",
              "layerCount": 5,
              "primitiveCount": 132,
            },
            "bossFactionId": "faction_scrap_court",
            "bossId": "boss_unsold_missiles_carrier",
            "bossPatternId": "missileCurtain",
            "encounterPacing": {
              "firstSpawnXRatio": 0.56,
              "flankXMaxRatio": 0.86,
              "flankXMinRatio": 0.14,
              "spawnSpacing": 34,
              "targetYMax": 158,
              "targetYMin": 92,
              "waveWindowEndRatio": 0.72,
              "waveWindowStartRatio": 0.16,
            },
            "features": {
              "hazardKinds": [
                "surface_defense_arc",
                "mining_laser",
                "dust_plume",
              ],
              "hazardWindows": [
                [
                  585.9,
                  757.9,
                  908.9,
                ],
                [
                  1301.34,
                  1479.34,
                  1617.34,
                ],
                [
                  1920.86,
                  2074.86,
                  2277.86,
                ],
              ],
              "landmarkKinds": [
                "crater_shadow_band",
                "surface_relay",
                "comm_array_flyby",
              ],
            },
            "majorWaves": [
              "surface_array_crossfire",
              "low_orbit_debris",
              "crater_skim_patrol",
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
              "vault",
              "elite",
              "glitch",
            ],
            "scroll": {
              "baseSpeed": 103,
              "length": 2623,
              "startOffset": 60370,
            },
            "sectorId": "sector_lunar_surface",
          },
          {
            "act": {
              "id": "act_outer_rim",
              "index": 1,
              "pressureTier": "baseline",
              "rewardTier": "standard",
              "sectorCount": 5,
              "sectorIndex": 4,
            },
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
                "warning_beam",
                "debris_lane",
                "mine_belt",
              ],
              "hazardWindows": [
                [
                  677,
                  837,
                  1009,
                ],
                [
                  1376.4,
                  1517.4,
                  1734.4,
                ],
                [
                  1886.6,
                  2042.6,
                  2210.6,
                ],
              ],
              "landmarkKinds": [
                "beacon_line",
                "vault_door",
                "convoy_shadow",
              ],
            },
            "majorWaves": [
              "barcode_turret_lane",
              "convoy_crossfire",
              "credit_minefield",
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
              "repair",
              "elite",
              "factionAmbush",
            ],
            "scroll": {
              "baseSpeed": 115,
              "length": 2580,
              "startOffset": 70594,
            },
            "sectorId": "sector_trade_war_corridor",
          },
          {
            "act": {
              "id": "act_outer_rim",
              "index": 1,
              "pressureTier": "baseline",
              "rewardTier": "standard",
              "sectorCount": 5,
              "sectorIndex": 5,
            },
            "arena": {
              "approachSpeed": 68.44,
              "approachStartDistance": 2725,
              "lockDistance": 2955,
              "releaseDistance": 3315,
            },
            "background": {
              "id": "background_corporate_kill_grid",
              "layerCount": 4,
              "primitiveCount": 150,
            },
            "bossFactionId": "faction_void_corsairs",
            "bossId": "boss_warranty_void_seraph",
            "bossPatternId": "auditFan",
            "features": {
              "hazardKinds": [
                "mine_belt",
                "warning_beam",
                "crush_gate",
              ],
              "hazardWindows": [
                [
                  807.5,
                  960.5,
                  1139.5,
                ],
                [
                  1814.7,
                  1966.7,
                  2135.7,
                ],
                [
                  2610.3,
                  2777.3,
                  2913.3,
                ],
              ],
              "landmarkKinds": [
                "vault_door",
                "beacon_line",
                "core_machinery",
              ],
            },
            "majorWaves": [
              "beam_warning_grid",
              "drone_lockstep",
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
              "shop",
              "elite",
              "repair",
            ],
            "scroll": {
              "baseSpeed": 118,
              "length": 3315,
              "startOffset": 80856,
            },
            "sectorId": "sector_corporate_kill_grid",
          },
          {
            "act": {
              "id": "act_core_descent",
              "index": 2,
              "pressureTier": "elevated",
              "rewardTier": "escalated",
              "sectorCount": 5,
              "sectorIndex": 1,
            },
            "actRouteContracts": [
              {
                "environmentalHint": "repair lanes favor readable corridors over dense clutter",
                "id": "act2_field_suture",
                "label": "Field Suture",
                "pressureHint": "low combat pressure, low immediate reward ceiling",
                "rewardTierHint": "safer reward bias with Act II credit tension",
                "tags": [
                  "repair",
                  "economy",
                ],
              },
              {
                "environmentalHint": "escort lanes favor faction-colored crossfire windows",
                "id": "act2_faction_heist",
                "label": "Faction Heist",
                "pressureHint": "high combat pressure with faction-specific reward bias",
                "rewardTierHint": "focused faction cache with escalated salvage",
                "tags": [
                  "faction",
                  "pressure",
                  "economy",
                ],
              },
              {
                "environmentalHint": "stable dock lane with fewer surprise hazards before launch",
                "id": "act2_core_broker_permit",
                "label": "Core Broker Permit",
                "pressureHint": "low combat pressure, high economy commitment",
                "rewardTierHint": "escalated shop stock and price pressure",
                "tags": [
                  "deepMarket",
                  "economy",
                  "core",
                ],
              },
            ],
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
                "debris_lane",
                "warning_beam",
              ],
              "hazardWindows": [
                [
                  854.7,
                  1001.7,
                  1148.7,
                ],
                [
                  1655.42,
                  1812.42,
                  2013.42,
                ],
                [
                  2352.18,
                  2512.18,
                  2652.18,
                ],
              ],
              "landmarkKinds": [
                "beacon_line",
                "convoy_shadow",
                "vault_door",
              ],
            },
            "majorWaves": [
              "shield_barge_wall",
              "credit_minefield",
              "convoy_crossfire",
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
              "repair",
              "factionAmbush",
              "shop",
            ],
            "scroll": {
              "baseSpeed": 124,
              "length": 3099,
              "startOffset": 90870,
            },
            "sectorId": "sector_trade_war_corridor",
          },
          {
            "act": {
              "id": "act_core_descent",
              "index": 2,
              "pressureTier": "elevated",
              "rewardTier": "escalated",
              "sectorCount": 5,
              "sectorIndex": 2,
            },
            "actRouteContracts": [
              {
                "environmentalHint": "stable dock lane with fewer surprise hazards before launch",
                "id": "act2_core_broker_permit",
                "label": "Core Broker Permit",
                "pressureHint": "low combat pressure, high economy commitment",
                "rewardTierHint": "escalated shop stock and price pressure",
                "tags": [
                  "deepMarket",
                  "economy",
                  "core",
                ],
              },
              {
                "environmentalHint": "hazard timing may feel less regular after the shear",
                "id": "act2_seed_shear",
                "label": "Seed Shear",
                "pressureHint": "high variance pressure with possible curse exposure",
                "rewardTierHint": "strong phase and heat bias in the reward pool",
                "tags": [
                  "seedShear",
                  "hazard",
                  "pressure",
                ],
              },
              {
                "environmentalHint": "escort lanes favor faction-colored crossfire windows",
                "id": "act2_faction_heist",
                "label": "Faction Heist",
                "pressureHint": "high combat pressure with faction-specific reward bias",
                "rewardTierHint": "focused faction cache with escalated salvage",
                "tags": [
                  "faction",
                  "pressure",
                  "economy",
                ],
              },
            ],
            "arena": {
              "approachSpeed": 69.02,
              "approachStartDistance": 3125,
              "lockDistance": 3355,
              "releaseDistance": 3715,
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
                  1002.5,
                  1186.5,
                  1301.5,
                ],
                [
                  1936.7,
                  2091.7,
                  2216.7,
                ],
                [
                  2850.3,
                  3000.3,
                  3200.3,
                ],
              ],
              "landmarkKinds": [
                "vault_door",
                "beacon_line",
                "core_machinery",
              ],
            },
            "majorWaves": [
              "drone_lockstep",
              "elite_laser_fan",
              "beam_warning_grid",
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
              "shop",
              "glitch",
              "factionAmbush",
            ],
            "scroll": {
              "baseSpeed": 119,
              "length": 3715,
              "startOffset": 100284,
            },
            "sectorId": "sector_corporate_kill_grid",
          },
          {
            "act": {
              "id": "act_core_descent",
              "index": 2,
              "pressureTier": "elevated",
              "rewardTier": "escalated",
              "sectorCount": 5,
              "sectorIndex": 2,
            },
            "actRouteContracts": [
              {
                "environmentalHint": "formation lanes are more likely to stack near hazards",
                "id": "act2_overseer_bounty",
                "label": "Overseer Bounty",
                "pressureHint": "high combat pressure with boss-approach implications",
                "rewardTierHint": "escalated salvage plus an extra reward look",
                "tags": [
                  "bossApproach",
                  "pressure",
                  "core",
                ],
              },
              {
                "environmentalHint": "escort lanes favor faction-colored crossfire windows",
                "id": "act2_faction_heist",
                "label": "Faction Heist",
                "pressureHint": "high combat pressure with faction-specific reward bias",
                "rewardTierHint": "focused faction cache with escalated salvage",
                "tags": [
                  "faction",
                  "pressure",
                  "economy",
                ],
              },
              {
                "environmentalHint": "stable dock lane with fewer surprise hazards before launch",
                "id": "act2_core_broker_permit",
                "label": "Core Broker Permit",
                "pressureHint": "low combat pressure, high economy commitment",
                "rewardTierHint": "escalated shop stock and price pressure",
                "tags": [
                  "deepMarket",
                  "economy",
                  "core",
                ],
              },
            ],
            "arena": {
              "approachSpeed": 74.24,
              "approachStartDistance": 3214,
              "lockDistance": 3444,
              "releaseDistance": 3804,
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
                "warning_beam",
                "mine_belt",
                "crush_gate",
              ],
              "hazardWindows": [
                [
                  904.2,
                  1095.2,
                  1270.2,
                ],
                [
                  2125.32,
                  2255.32,
                  2432.32,
                ],
                [
                  3001.28,
                  3191.28,
                  3344.28,
                ],
              ],
              "landmarkKinds": [
                "beacon_line",
                "vault_door",
                "core_machinery",
              ],
            },
            "majorWaves": [
              "elite_laser_fan",
              "drone_lockstep",
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
              "elite",
              "factionAmbush",
              "shop",
            ],
            "scroll": {
              "baseSpeed": 128,
              "length": 3804,
              "startOffset": 110009,
            },
            "sectorId": "sector_corporate_kill_grid",
          },
          {
            "act": {
              "id": "act_core_descent",
              "index": 2,
              "pressureTier": "elevated",
              "rewardTier": "escalated",
              "sectorCount": 5,
              "sectorIndex": 3,
            },
            "actRouteContracts": [
              {
                "environmentalHint": "repair lanes favor readable corridors over dense clutter",
                "id": "act2_field_suture",
                "label": "Field Suture",
                "pressureHint": "low combat pressure, low immediate reward ceiling",
                "rewardTierHint": "safer reward bias with Act II credit tension",
                "tags": [
                  "repair",
                  "economy",
                ],
              },
              {
                "environmentalHint": "formation lanes are more likely to stack near hazards",
                "id": "act2_overseer_bounty",
                "label": "Overseer Bounty",
                "pressureHint": "high combat pressure with boss-approach implications",
                "rewardTierHint": "escalated salvage plus an extra reward look",
                "tags": [
                  "bossApproach",
                  "pressure",
                  "core",
                ],
              },
              {
                "environmentalHint": "hazard timing may feel less regular after the shear",
                "id": "act2_seed_shear",
                "label": "Seed Shear",
                "pressureHint": "high variance pressure with possible curse exposure",
                "rewardTierHint": "strong phase and heat bias in the reward pool",
                "tags": [
                  "seedShear",
                  "hazard",
                  "pressure",
                ],
              },
            ],
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
                "mine_belt",
                "salvage_storm",
                "debris_lane",
              ],
              "hazardWindows": [
                [
                  961.2,
                  1103.2,
                  1250.2,
                ],
                [
                  1924.12,
                  2094.12,
                  2764.12,
                ],
                [
                  2847.48,
                  2979.48,
                  3178.48,
                ],
              ],
              "landmarkKinds": [
                "core_machinery",
                "repair_platform",
                "beacon_line",
              ],
            },
            "majorWaves": [
              "spore_spiral",
              "regenerator_pods",
              "corrosion_pools",
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
              "repair",
              "elite",
              "glitch",
            ],
            "scroll": {
              "baseSpeed": 126,
              "length": 3714,
              "startOffset": 120460,
            },
            "sectorId": "sector_bio_machine_bloom",
          },
          {
            "act": {
              "id": "act_core_descent",
              "index": 2,
              "pressureTier": "elevated",
              "rewardTier": "escalated",
              "sectorCount": 5,
              "sectorIndex": 3,
            },
            "actRouteContracts": [
              {
                "environmentalHint": "formation lanes are more likely to stack near hazards",
                "id": "act2_overseer_bounty",
                "label": "Overseer Bounty",
                "pressureHint": "high combat pressure with boss-approach implications",
                "rewardTierHint": "escalated salvage plus an extra reward look",
                "tags": [
                  "bossApproach",
                  "pressure",
                  "core",
                ],
              },
              {
                "environmentalHint": "repair lanes favor readable corridors over dense clutter",
                "id": "act2_field_suture",
                "label": "Field Suture",
                "pressureHint": "low combat pressure, low immediate reward ceiling",
                "rewardTierHint": "safer reward bias with Act II credit tension",
                "tags": [
                  "repair",
                  "economy",
                ],
              },
              {
                "environmentalHint": "hazard timing may feel less regular after the shear",
                "id": "act2_seed_shear",
                "label": "Seed Shear",
                "pressureHint": "high variance pressure with possible curse exposure",
                "rewardTierHint": "strong phase and heat bias in the reward pool",
                "tags": [
                  "seedShear",
                  "hazard",
                  "pressure",
                ],
              },
            ],
            "background": {
              "id": "background_trade_war_corridor",
              "layerCount": 4,
              "primitiveCount": 152,
            },
            "bossFactionId": "faction_scrap_court",
            "bossId": "boss_unsold_missiles_carrier",
            "bossPatternId": "missileCurtain",
            "features": {
              "hazardKinds": [
                "debris_lane",
                "warning_beam",
                "mine_belt",
              ],
              "hazardWindows": [
                [
                  979.3,
                  1131.3,
                  1323.3,
                ],
                [
                  2128.98,
                  2290.98,
                  2438.98,
                ],
                [
                  3004.42,
                  3159.42,
                  3319.42,
                ],
              ],
              "landmarkKinds": [
                "convoy_shadow",
                "vault_door",
                "beacon_line",
              ],
            },
            "majorWaves": [
              "credit_minefield",
              "barcode_turret_lane",
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
              "elite",
              "repair",
              "glitch",
            ],
            "scroll": {
              "baseSpeed": 128,
              "length": 3831,
              "startOffset": 130785,
            },
            "sectorId": "sector_trade_war_corridor",
            "setPiece": {
              "anchorDistance": 2107,
              "bossLock": "none",
              "id": "setpiece_bloom_spindle",
              "layoutId": "starboard-bloom",
              "layoutLabel": "Starboard Bloom",
              "reinforcementFormation": "formation_ring",
              "safeLane": {
                "label": "port evacuation lane",
                "maxX": 170,
                "minX": 30,
              },
            },
          },
          {
            "act": {
              "id": "act_core_descent",
              "index": 2,
              "pressureTier": "elevated",
              "rewardTier": "escalated",
              "sectorCount": 5,
              "sectorIndex": 3,
            },
            "actRouteContracts": [
              {
                "environmentalHint": "repair lanes favor readable corridors over dense clutter",
                "id": "act2_field_suture",
                "label": "Field Suture",
                "pressureHint": "low combat pressure, low immediate reward ceiling",
                "rewardTierHint": "safer reward bias with Act II credit tension",
                "tags": [
                  "repair",
                  "economy",
                ],
              },
              {
                "environmentalHint": "hazard timing may feel less regular after the shear",
                "id": "act2_seed_shear",
                "label": "Seed Shear",
                "pressureHint": "high variance pressure with possible curse exposure",
                "rewardTierHint": "strong phase and heat bias in the reward pool",
                "tags": [
                  "seedShear",
                  "hazard",
                  "pressure",
                ],
              },
              {
                "environmentalHint": "formation lanes are more likely to stack near hazards",
                "id": "act2_overseer_bounty",
                "label": "Overseer Bounty",
                "pressureHint": "high combat pressure with boss-approach implications",
                "rewardTierHint": "escalated salvage plus an extra reward look",
                "tags": [
                  "bossApproach",
                  "pressure",
                  "core",
                ],
              },
            ],
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
                "warning_beam",
                "mine_belt",
                "debris_lane",
              ],
              "hazardWindows": [
                [
                  1114.3,
                  1283.3,
                  1418.3,
                ],
                [
                  2138.18,
                  2273.18,
                  2446.18,
                ],
                [
                  3080.22,
                  3247.22,
                  3429.22,
                ],
              ],
              "landmarkKinds": [
                "beacon_line",
                "convoy_shadow",
                "vault_door",
              ],
            },
            "majorWaves": [
              "convoy_crossfire",
              "shield_barge_wall",
              "credit_minefield",
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
              "repair",
              "glitch",
              "elite",
            ],
            "scroll": {
              "baseSpeed": 128,
              "length": 4021,
              "startOffset": 140488,
            },
            "sectorId": "sector_trade_war_corridor",
          },
          {
            "act": {
              "id": "act_core_descent",
              "index": 2,
              "pressureTier": "elevated",
              "rewardTier": "escalated",
              "sectorCount": 5,
              "sectorIndex": 4,
            },
            "actRouteContracts": [
              {
                "environmentalHint": "vault doors sit close to unstable lanes and late telegraphs",
                "id": "act2_relic_undertow",
                "label": "Relic Undertow",
                "pressureHint": "medium combat pressure, high build variance",
                "rewardTierHint": "vault-tier relic pool with Act II rarity pressure",
                "tags": [
                  "relic",
                  "hazard",
                  "core",
                ],
              },
              {
                "environmentalHint": "stable dock lane with fewer surprise hazards before launch",
                "id": "act2_core_broker_permit",
                "label": "Core Broker Permit",
                "pressureHint": "low combat pressure, high economy commitment",
                "rewardTierHint": "escalated shop stock and price pressure",
                "tags": [
                  "deepMarket",
                  "economy",
                  "core",
                ],
              },
              {
                "environmentalHint": "hazard timing may feel less regular after the shear",
                "id": "act2_seed_shear",
                "label": "Seed Shear",
                "pressureHint": "high variance pressure with possible curse exposure",
                "rewardTierHint": "strong phase and heat bias in the reward pool",
                "tags": [
                  "seedShear",
                  "hazard",
                  "pressure",
                ],
              },
            ],
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
                "debris_lane",
                "mine_belt",
                "salvage_storm",
              ],
              "hazardWindows": [
                [
                  1096.5,
                  1245.5,
                  1428.5,
                ],
                [
                  2236.7,
                  2383.7,
                  2572.7,
                ],
                [
                  3228.3,
                  3376.3,
                  4010.3,
                ],
              ],
              "landmarkKinds": [
                "repair_platform",
                "core_machinery",
                "beacon_line",
              ],
            },
            "majorWaves": [
              "regenerator_pods",
              "bloom_lattice",
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
              "vault",
              "shop",
              "glitch",
            ],
            "scroll": {
              "baseSpeed": 128,
              "length": 4165,
              "startOffset": 150896,
            },
            "sectorId": "sector_bio_machine_bloom",
          },
          {
            "act": {
              "id": "act_core_descent",
              "index": 2,
              "pressureTier": "elevated",
              "rewardTier": "escalated",
              "sectorCount": 5,
              "sectorIndex": 4,
            },
            "actRouteContracts": [
              {
                "environmentalHint": "bio-lanes favor spores, dust fronts, and organic cover beats",
                "id": "act2_bloom_graft_cache",
                "label": "Bloom Graft Cache",
                "pressureHint": "medium spread pressure with strong build-shaping upside",
                "rewardTierHint": "vault-tier relic pool biased toward shield, curse, and bloom tech",
                "tags": [
                  "bio",
                  "relic",
                  "hazard",
                ],
              },
              {
                "environmentalHint": "formation lanes are more likely to stack near hazards",
                "id": "act2_overseer_bounty",
                "label": "Overseer Bounty",
                "pressureHint": "high combat pressure with boss-approach implications",
                "rewardTierHint": "escalated salvage plus an extra reward look",
                "tags": [
                  "bossApproach",
                  "pressure",
                  "core",
                ],
              },
              {
                "environmentalHint": "escort lanes favor faction-colored crossfire windows",
                "id": "act2_faction_heist",
                "label": "Faction Heist",
                "pressureHint": "high combat pressure with faction-specific reward bias",
                "rewardTierHint": "focused faction cache with escalated salvage",
                "tags": [
                  "faction",
                  "pressure",
                  "economy",
                ],
              },
            ],
            "background": {
              "id": "background_lunar_surface",
              "layerCount": 5,
              "primitiveCount": 132,
            },
            "bossFactionId": "faction_void_corsairs",
            "bossId": "boss_warranty_void_seraph",
            "bossPatternId": "auditFan",
            "encounterPacing": {
              "firstSpawnXRatio": 0.56,
              "flankXMaxRatio": 0.86,
              "flankXMinRatio": 0.14,
              "spawnSpacing": 34,
              "targetYMax": 158,
              "targetYMin": 92,
              "waveWindowEndRatio": 0.72,
              "waveWindowStartRatio": 0.16,
            },
            "features": {
              "hazardKinds": [
                "mining_laser",
                "surface_defense_arc",
                "dust_plume",
              ],
              "hazardWindows": [
                [
                  1203.6,
                  1405.6,
                  1513.6,
                ],
                [
                  2364.76,
                  2526.76,
                  2710.76,
                ],
                [
                  3467.04,
                  3657.04,
                  3835.04,
                ],
              ],
              "landmarkKinds": [
                "comm_array_flyby",
                "crater_shadow_band",
                "surface_relay",
              ],
            },
            "majorWaves": [
              "low_orbit_debris",
              "ridge_shadow_intercept",
              "surface_array_crossfire",
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
              "vault",
              "elite",
              "factionAmbush",
            ],
            "scroll": {
              "baseSpeed": 128,
              "length": 4422,
              "startOffset": 160417,
            },
            "sectorId": "sector_lunar_surface",
          },
          {
            "act": {
              "id": "act_core_descent",
              "index": 2,
              "pressureTier": "elevated",
              "rewardTier": "escalated",
              "sectorCount": 5,
              "sectorIndex": 5,
            },
            "actRouteContracts": [
              {
                "environmentalHint": "formation lanes are more likely to stack near hazards",
                "id": "act2_overseer_bounty",
                "label": "Overseer Bounty",
                "pressureHint": "high combat pressure with boss-approach implications",
                "rewardTierHint": "escalated salvage plus an extra reward look",
                "tags": [
                  "bossApproach",
                  "pressure",
                  "core",
                ],
              },
              {
                "environmentalHint": "hazard timing may feel less regular after the shear",
                "id": "act2_seed_shear",
                "label": "Seed Shear",
                "pressureHint": "high variance pressure with possible curse exposure",
                "rewardTierHint": "strong phase and heat bias in the reward pool",
                "tags": [
                  "seedShear",
                  "hazard",
                  "pressure",
                ],
              },
              {
                "environmentalHint": "escort lanes favor faction-colored crossfire windows",
                "id": "act2_faction_heist",
                "label": "Faction Heist",
                "pressureHint": "high combat pressure with faction-specific reward bias",
                "rewardTierHint": "focused faction cache with escalated salvage",
                "tags": [
                  "faction",
                  "pressure",
                  "economy",
                ],
              },
            ],
            "arena": {
              "approachSpeed": 74.24,
              "approachStartDistance": 4375,
              "lockDistance": 4605,
              "releaseDistance": 4965,
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
                "salvage_storm",
                "crush_gate",
                "warning_beam",
              ],
              "hazardWindows": [
                [
                  1348.5,
                  1508.5,
                  2134.5,
                ],
                [
                  2658.7,
                  2860.7,
                  2988.7,
                ],
                [
                  3848.3,
                  4001.3,
                  4135.3,
                ],
              ],
              "landmarkKinds": [
                "vault_door",
                "core_machinery",
                "wreck_silhouette",
              ],
            },
            "majorWaves": [
              "unstable_relic_front",
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
              "glitch",
              "factionAmbush",
            ],
            "scroll": {
              "baseSpeed": 128,
              "length": 4965,
              "startOffset": 170579,
            },
            "sectorId": "sector_core_wreck",
            "setPiece": {
              "anchorDistance": 4605,
              "bossLock": "untilComplete",
              "id": "setpiece_court_wreck_train",
              "layoutId": "crown-first",
              "layoutLabel": "Crown-First Train",
              "reinforcementFormation": "formation_convoy",
              "safeLane": {
                "label": "port salvage corridor",
                "maxX": 170,
                "minX": 30,
              },
            },
          },
          {
            "act": {
              "id": "act_null_frontier",
              "index": 3,
              "pressureTier": "elevated",
              "rewardTier": "escalated",
              "sectorCount": 5,
              "sectorIndex": 1,
            },
            "actRouteContracts": [
              {
                "environmentalHint": "a protected machinery wake suppresses one hazard",
                "id": "act3_mobile_drydock",
                "label": "Mobile Drydock",
                "pressureHint": "low immediate pressure with a narrower reward ceiling",
                "rewardTierHint": "repair plus engineering salvage",
                "tags": [
                  "frontier",
                  "repair",
                  "engineering",
                ],
              },
              {
                "environmentalHint": "faction crossfire follows the active frontier law",
                "id": "act3_claim_war",
                "label": "Claim War",
                "pressureHint": "high combat pressure with a persistent faction consequence",
                "rewardTierHint": "focused faction cache and campaign influence",
                "tags": [
                  "frontier",
                  "faction",
                  "pressure",
                ],
              },
              {
                "environmentalHint": "the local law intensifies around elite anchors",
                "id": "act3_anchor_hunt",
                "label": "Anchor Hunt",
                "pressureHint": "critical combat pressure without added hull inflation",
                "rewardTierHint": "boss-grade salvage and stronger component quality",
                "tags": [
                  "frontier",
                  "bossApproach",
                  "pressure",
                ],
              },
            ],
            "background": {
              "id": "background_nullglass_expanse",
              "layerCount": 3,
              "primitiveCount": 136,
            },
            "bossFactionId": "faction_void_corsairs",
            "bossId": "boss_prism_regent",
            "bossPatternId": "auditFan",
            "features": {
              "hazardKinds": [
                "mine_belt",
                "warning_beam",
                "salvage_storm",
              ],
              "hazardWindows": [
                [
                  1245.1,
                  1392.1,
                  1569.1,
                ],
                [
                  2557.66,
                  2728.66,
                  2894.66,
                ],
                [
                  3553.14,
                  3721.14,
                  4369.14,
                ],
              ],
              "landmarkKinds": [
                "wreck_silhouette",
                "vault_door",
                "beacon_line",
              ],
            },
            "frontierLaw": {
              "id": "law_shard_echo",
              "label": "Shard Echo",
            },
            "majorWaves": [
              "echo_mine_choir",
              "mirror_shard_fan",
              "prism_debt_lane",
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
              "repair",
              "factionAmbush",
              "elite",
            ],
            "scroll": {
              "baseSpeed": 128,
              "length": 4627,
              "startOffset": 180367,
            },
            "sectorId": "sector_nullglass_expanse",
          },
          {
            "act": {
              "id": "act_null_frontier",
              "index": 3,
              "pressureTier": "elevated",
              "rewardTier": "escalated",
              "sectorCount": 5,
              "sectorIndex": 2,
            },
            "actRouteContracts": [
              {
                "environmentalHint": "faction crossfire follows the active frontier law",
                "id": "act3_claim_war",
                "label": "Claim War",
                "pressureHint": "high combat pressure with a persistent faction consequence",
                "rewardTierHint": "focused faction cache and campaign influence",
                "tags": [
                  "frontier",
                  "faction",
                  "pressure",
                ],
              },
              {
                "environmentalHint": "the sector law changes cadence without hiding telegraphs",
                "id": "act3_parallax_cut",
                "label": "Parallax Cut",
                "pressureHint": "high variance pressure and a shortened escape window",
                "rewardTierHint": "extra choice with phase, heat, and curse bias",
                "tags": [
                  "frontier",
                  "seedShear",
                  "hazard",
                ],
              },
              {
                "environmentalHint": "the exchange stabilizes one hazard window",
                "id": "act3_lawwright_exchange",
                "label": "Lawwright Exchange",
                "pressureHint": "low combat pressure, expensive certainty",
                "rewardTierHint": "escalated stock with engineering-tag bias",
                "tags": [
                  "frontier",
                  "engineering",
                  "economy",
                ],
              },
            ],
            "background": {
              "id": "background_dead_signal_reef",
              "layerCount": 3,
              "primitiveCount": 86,
            },
            "bossFactionId": "faction_corporate_ledger",
            "bossId": "boss_auditor_drone_xl",
            "bossPatternId": "auditFan",
            "features": {
              "hazardKinds": [
                "mine_belt",
                "salvage_storm",
                "debris_lane",
              ],
              "hazardWindows": [
                [
                  1258,
                  1403,
                  1592,
                ],
                [
                  2679.4,
                  2840.4,
                  3460.4,
                ],
                [
                  3825.6,
                  3964.6,
                  4164.6,
                ],
              ],
              "landmarkKinds": [
                "surface_relay",
                "beacon_line",
                "wreck_silhouette",
              ],
            },
            "frontierLaw": {
              "id": "law_signal_hunger",
              "label": "Signal Hunger",
            },
            "majorWaves": [
              "reef_shadow_dive",
              "ghost_transponder_pack",
              "silent_beacon_trap",
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
              "factionAmbush",
              "glitch",
              "shop",
            ],
            "scroll": {
              "baseSpeed": 128,
              "length": 4930,
              "startOffset": 190312,
            },
            "sectorId": "sector_dead_signal_reef",
          },
          {
            "act": {
              "id": "act_null_frontier",
              "index": 3,
              "pressureTier": "elevated",
              "rewardTier": "escalated",
              "sectorCount": 5,
              "sectorIndex": 2,
            },
            "actRouteContracts": [
              {
                "environmentalHint": "a protected machinery wake suppresses one hazard",
                "id": "act3_mobile_drydock",
                "label": "Mobile Drydock",
                "pressureHint": "low immediate pressure with a narrower reward ceiling",
                "rewardTierHint": "repair plus engineering salvage",
                "tags": [
                  "frontier",
                  "repair",
                  "engineering",
                ],
              },
              {
                "environmentalHint": "the sector law changes cadence without hiding telegraphs",
                "id": "act3_parallax_cut",
                "label": "Parallax Cut",
                "pressureHint": "high variance pressure and a shortened escape window",
                "rewardTierHint": "extra choice with phase, heat, and curse bias",
                "tags": [
                  "frontier",
                  "seedShear",
                  "hazard",
                ],
              },
              {
                "environmentalHint": "the local law intensifies around elite anchors",
                "id": "act3_anchor_hunt",
                "label": "Anchor Hunt",
                "pressureHint": "critical combat pressure without added hull inflation",
                "rewardTierHint": "boss-grade salvage and stronger component quality",
                "tags": [
                  "frontier",
                  "bossApproach",
                  "pressure",
                ],
              },
            ],
            "background": {
              "id": "background_parallax_foundry",
              "layerCount": 3,
              "primitiveCount": 112,
            },
            "bossFactionId": "faction_bloom_hive",
            "bossId": "boss_bloom_engine",
            "bossPatternId": "sporeSpiral",
            "features": {
              "hazardKinds": [
                "mining_laser",
                "salvage_storm",
                "crush_gate",
              ],
              "hazardWindows": [
                [
                  1383.2,
                  1569.2,
                  1695.2,
                ],
                [
                  2822.72,
                  3005.72,
                  3653.72,
                ],
                [
                  4024.88,
                  4190.88,
                  4354.88,
                ],
              ],
              "landmarkKinds": [
                "vault_door",
                "core_machinery",
                "repair_platform",
              ],
            },
            "frontierLaw": {
              "id": "law_thermal_inversion",
              "label": "Thermal Inversion",
            },
            "majorWaves": [
              "forge_slag_front",
              "inversion_rail",
              "hot_swap_drones",
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
              "repair",
              "glitch",
              "elite",
            ],
            "scroll": {
              "baseSpeed": 128,
              "length": 5084,
              "startOffset": 200062,
            },
            "sectorId": "sector_parallax_foundry",
          },
          {
            "act": {
              "id": "act_null_frontier",
              "index": 3,
              "pressureTier": "elevated",
              "rewardTier": "escalated",
              "sectorCount": 5,
              "sectorIndex": 3,
            },
            "actRouteContracts": [
              {
                "environmentalHint": "the exchange stabilizes one hazard window",
                "id": "act3_lawwright_exchange",
                "label": "Lawwright Exchange",
                "pressureHint": "low combat pressure, expensive certainty",
                "rewardTierHint": "escalated stock with engineering-tag bias",
                "tags": [
                  "frontier",
                  "engineering",
                  "economy",
                ],
              },
              {
                "environmentalHint": "curse exposure arrives through mirrored threat lanes",
                "id": "act3_impossible_vault",
                "label": "Impossible Vault",
                "pressureHint": "high build variance and law-driven hazards",
                "rewardTierHint": "frontier relic pool plus an engineering component",
                "tags": [
                  "frontier",
                  "relic",
                  "hazard",
                ],
              },
              {
                "environmentalHint": "the local law intensifies around elite anchors",
                "id": "act3_anchor_hunt",
                "label": "Anchor Hunt",
                "pressureHint": "critical combat pressure without added hull inflation",
                "rewardTierHint": "boss-grade salvage and stronger component quality",
                "tags": [
                  "frontier",
                  "bossApproach",
                  "pressure",
                ],
              },
            ],
            "arena": {
              "approachSpeed": 74.24,
              "approachStartDistance": 5085,
              "lockDistance": 5315,
              "releaseDistance": 5675,
            },
            "background": {
              "id": "background_gravity_choir",
              "layerCount": 3,
              "primitiveCount": 126,
            },
            "bossFactionId": "faction_void_corsairs",
            "bossId": "boss_prism_regent",
            "bossPatternId": "auditFan",
            "features": {
              "hazardKinds": [
                "mine_belt",
                "crush_gate",
                "warning_beam",
              ],
              "hazardWindows": [
                [
                  1582.5,
                  1729.5,
                  1916.5,
                ],
                [
                  3042.5,
                  3235.5,
                  3366.5,
                ],
                [
                  4559.5,
                  4732.5,
                  4907.5,
                ],
              ],
              "landmarkKinds": [
                "wreck_silhouette",
                "beacon_line",
                "core_machinery",
              ],
            },
            "frontierLaw": {
              "id": "law_vector_debt",
              "label": "Vector Debt",
            },
            "majorWaves": [
              "compression_procession",
              "tidal_pincer",
              "orbit_knuckle",
            ],
            "objective": {
              "bossRequired": true,
              "bossSpawnAtSeconds": 4.2,
              "kind": "defeatBoss",
              "requiredEnemyKills": 4,
              "requiredWaves": 2,
              "spawnsPerWave": 2,
            },
            "routes": [
              "shop",
              "vault",
              "elite",
            ],
            "scroll": {
              "baseSpeed": 128,
              "length": 5675,
              "startOffset": 210235,
            },
            "sectorId": "sector_gravity_choir",
          },
          {
            "act": {
              "id": "act_null_frontier",
              "index": 3,
              "pressureTier": "elevated",
              "rewardTier": "escalated",
              "sectorCount": 5,
              "sectorIndex": 3,
            },
            "actRouteContracts": [
              {
                "environmentalHint": "curse exposure arrives through mirrored threat lanes",
                "id": "act3_impossible_vault",
                "label": "Impossible Vault",
                "pressureHint": "high build variance and law-driven hazards",
                "rewardTierHint": "frontier relic pool plus an engineering component",
                "tags": [
                  "frontier",
                  "relic",
                  "hazard",
                ],
              },
              {
                "environmentalHint": "the local law intensifies around elite anchors",
                "id": "act3_anchor_hunt",
                "label": "Anchor Hunt",
                "pressureHint": "critical combat pressure without added hull inflation",
                "rewardTierHint": "boss-grade salvage and stronger component quality",
                "tags": [
                  "frontier",
                  "bossApproach",
                  "pressure",
                ],
              },
              {
                "environmentalHint": "a protected machinery wake suppresses one hazard",
                "id": "act3_mobile_drydock",
                "label": "Mobile Drydock",
                "pressureHint": "low immediate pressure with a narrower reward ceiling",
                "rewardTierHint": "repair plus engineering salvage",
                "tags": [
                  "frontier",
                  "repair",
                  "engineering",
                ],
              },
            ],
            "background": {
              "id": "background_parallax_foundry",
              "layerCount": 3,
              "primitiveCount": 112,
            },
            "bossFactionId": "faction_corporate_ledger",
            "bossId": "boss_mass_cantor",
            "bossPatternId": "missileCurtain",
            "features": {
              "hazardKinds": [
                "salvage_storm",
                "mining_laser",
                "crush_gate",
              ],
              "hazardWindows": [
                [
                  1571.9,
                  1720.9,
                  2341.9,
                ],
                [
                  2932.34,
                  3142.34,
                  3285.34,
                ],
                [
                  4283.86,
                  4451.86,
                  4606.86,
                ],
              ],
              "landmarkKinds": [
                "vault_door",
                "core_machinery",
                "repair_platform",
              ],
            },
            "frontierLaw": {
              "id": "law_thermal_inversion",
              "label": "Thermal Inversion",
            },
            "majorWaves": [
              "forge_slag_front",
              "hot_swap_drones",
              "inversion_rail",
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
              "vault",
              "elite",
              "repair",
            ],
            "scroll": {
              "baseSpeed": 128,
              "length": 5473,
              "startOffset": 220528,
            },
            "sectorId": "sector_parallax_foundry",
          },
          {
            "act": {
              "id": "act_null_frontier",
              "index": 3,
              "pressureTier": "elevated",
              "rewardTier": "escalated",
              "sectorCount": 5,
              "sectorIndex": 3,
            },
            "actRouteContracts": [
              {
                "environmentalHint": "curse exposure arrives through mirrored threat lanes",
                "id": "act3_impossible_vault",
                "label": "Impossible Vault",
                "pressureHint": "high build variance and law-driven hazards",
                "rewardTierHint": "frontier relic pool plus an engineering component",
                "tags": [
                  "frontier",
                  "relic",
                  "hazard",
                ],
              },
              {
                "environmentalHint": "the exchange stabilizes one hazard window",
                "id": "act3_lawwright_exchange",
                "label": "Lawwright Exchange",
                "pressureHint": "low combat pressure, expensive certainty",
                "rewardTierHint": "escalated stock with engineering-tag bias",
                "tags": [
                  "frontier",
                  "engineering",
                  "economy",
                ],
              },
              {
                "environmentalHint": "faction crossfire follows the active frontier law",
                "id": "act3_claim_war",
                "label": "Claim War",
                "pressureHint": "high combat pressure with a persistent faction consequence",
                "rewardTierHint": "focused faction cache and campaign influence",
                "tags": [
                  "frontier",
                  "faction",
                  "pressure",
                ],
              },
            ],
            "background": {
              "id": "background_dead_signal_reef",
              "layerCount": 3,
              "primitiveCount": 86,
            },
            "bossFactionId": "faction_corporate_ledger",
            "bossId": "boss_auditor_drone_xl",
            "bossPatternId": "auditFan",
            "features": {
              "hazardKinds": [
                "debris_lane",
                "salvage_storm",
                "mine_belt",
              ],
              "hazardWindows": [
                [
                  1558.7,
                  1724.7,
                  1937.7,
                ],
                [
                  3164.42,
                  3317.42,
                  3963.42,
                ],
                [
                  4540.18,
                  4696.18,
                  4894.18,
                ],
              ],
              "landmarkKinds": [
                "surface_relay",
                "wreck_silhouette",
                "beacon_line",
              ],
            },
            "frontierLaw": {
              "id": "law_signal_hunger",
              "label": "Signal Hunger",
            },
            "majorWaves": [
              "silent_beacon_trap",
              "blackout_barrage",
              "reef_shadow_dive",
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
              "vault",
              "shop",
              "factionAmbush",
            ],
            "scroll": {
              "baseSpeed": 128,
              "length": 5699,
              "startOffset": 230400,
            },
            "sectorId": "sector_dead_signal_reef",
          },
          {
            "act": {
              "id": "act_null_frontier",
              "index": 3,
              "pressureTier": "elevated",
              "rewardTier": "escalated",
              "sectorCount": 5,
              "sectorIndex": 4,
            },
            "actRouteContracts": [
              {
                "environmentalHint": "the sector law changes cadence without hiding telegraphs",
                "id": "act3_parallax_cut",
                "label": "Parallax Cut",
                "pressureHint": "high variance pressure and a shortened escape window",
                "rewardTierHint": "extra choice with phase, heat, and curse bias",
                "tags": [
                  "frontier",
                  "seedShear",
                  "hazard",
                ],
              },
              {
                "environmentalHint": "curse exposure arrives through mirrored threat lanes",
                "id": "act3_impossible_vault",
                "label": "Impossible Vault",
                "pressureHint": "high build variance and law-driven hazards",
                "rewardTierHint": "frontier relic pool plus an engineering component",
                "tags": [
                  "frontier",
                  "relic",
                  "hazard",
                ],
              },
              {
                "environmentalHint": "the exchange stabilizes one hazard window",
                "id": "act3_lawwright_exchange",
                "label": "Lawwright Exchange",
                "pressureHint": "low combat pressure, expensive certainty",
                "rewardTierHint": "escalated stock with engineering-tag bias",
                "tags": [
                  "frontier",
                  "engineering",
                  "economy",
                ],
              },
            ],
            "arena": {
              "approachSpeed": 74.24,
              "approachStartDistance": 5652,
              "lockDistance": 5882,
              "releaseDistance": 6242,
            },
            "background": {
              "id": "background_gravity_choir",
              "layerCount": 3,
              "primitiveCount": 126,
            },
            "bossFactionId": "faction_void_corsairs",
            "bossId": "boss_prism_regent",
            "bossPatternId": "auditFan",
            "features": {
              "hazardKinds": [
                "warning_beam",
                "mine_belt",
                "crush_gate",
              ],
              "hazardWindows": [
                [
                  1758.6,
                  1920.6,
                  2085.6,
                ],
                [
                  3444.36,
                  3600.36,
                  3793.36,
                ],
                [
                  4958.44,
                  5151.44,
                  5300.44,
                ],
              ],
              "landmarkKinds": [
                "core_machinery",
                "wreck_silhouette",
                "beacon_line",
              ],
            },
            "frontierLaw": {
              "id": "law_vector_debt",
              "label": "Vector Debt",
            },
            "majorWaves": [
              "mass_canticle",
              "tidal_pincer",
              "compression_procession",
            ],
            "objective": {
              "bossRequired": true,
              "bossSpawnAtSeconds": 4.2,
              "kind": "defeatBoss",
              "requiredEnemyKills": 4,
              "requiredWaves": 2,
              "spawnsPerWave": 2,
            },
            "routes": [
              "glitch",
              "vault",
              "shop",
            ],
            "scroll": {
              "baseSpeed": 128,
              "length": 6242,
              "startOffset": 240948,
            },
            "sectorId": "sector_gravity_choir",
          },
          {
            "act": {
              "id": "act_null_frontier",
              "index": 3,
              "pressureTier": "elevated",
              "rewardTier": "escalated",
              "sectorCount": 5,
              "sectorIndex": 4,
            },
            "actRouteContracts": [
              {
                "environmentalHint": "the sector law changes cadence without hiding telegraphs",
                "id": "act3_parallax_cut",
                "label": "Parallax Cut",
                "pressureHint": "high variance pressure and a shortened escape window",
                "rewardTierHint": "extra choice with phase, heat, and curse bias",
                "tags": [
                  "frontier",
                  "seedShear",
                  "hazard",
                ],
              },
              {
                "environmentalHint": "a protected machinery wake suppresses one hazard",
                "id": "act3_mobile_drydock",
                "label": "Mobile Drydock",
                "pressureHint": "low immediate pressure with a narrower reward ceiling",
                "rewardTierHint": "repair plus engineering salvage",
                "tags": [
                  "frontier",
                  "repair",
                  "engineering",
                ],
              },
              {
                "environmentalHint": "the local law intensifies around elite anchors",
                "id": "act3_anchor_hunt",
                "label": "Anchor Hunt",
                "pressureHint": "critical combat pressure without added hull inflation",
                "rewardTierHint": "boss-grade salvage and stronger component quality",
                "tags": [
                  "frontier",
                  "bossApproach",
                  "pressure",
                ],
              },
            ],
            "background": {
              "id": "background_parallax_foundry",
              "layerCount": 3,
              "primitiveCount": 112,
            },
            "bossFactionId": "faction_bloom_hive",
            "bossId": "boss_bloom_engine",
            "bossPatternId": "sporeSpiral",
            "features": {
              "hazardKinds": [
                "mining_laser",
                "salvage_storm",
                "crush_gate",
              ],
              "hazardWindows": [
                [
                  1755.7,
                  1927.7,
                  2084.7,
                ],
                [
                  3494.22,
                  3662.22,
                  4297.22,
                ],
                [
                  4976.38,
                  5159.38,
                  5303.38,
                ],
              ],
              "landmarkKinds": [
                "vault_door",
                "core_machinery",
                "repair_platform",
              ],
            },
            "frontierLaw": {
              "id": "law_thermal_inversion",
              "label": "Thermal Inversion",
            },
            "majorWaves": [
              "hot_swap_drones",
              "inversion_rail",
              "forge_slag_front",
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
              "glitch",
              "repair",
              "elite",
            ],
            "scroll": {
              "baseSpeed": 128,
              "length": 6209,
              "startOffset": 250999,
            },
            "sectorId": "sector_parallax_foundry",
          },
          {
            "act": {
              "id": "act_null_frontier",
              "index": 3,
              "pressureTier": "elevated",
              "rewardTier": "escalated",
              "sectorCount": 5,
              "sectorIndex": 5,
            },
            "actRouteContracts": [
              {
                "environmentalHint": "faction crossfire follows the active frontier law",
                "id": "act3_claim_war",
                "label": "Claim War",
                "pressureHint": "high combat pressure with a persistent faction consequence",
                "rewardTierHint": "focused faction cache and campaign influence",
                "tags": [
                  "frontier",
                  "faction",
                  "pressure",
                ],
              },
              {
                "environmentalHint": "the sector law changes cadence without hiding telegraphs",
                "id": "act3_parallax_cut",
                "label": "Parallax Cut",
                "pressureHint": "high variance pressure and a shortened escape window",
                "rewardTierHint": "extra choice with phase, heat, and curse bias",
                "tags": [
                  "frontier",
                  "seedShear",
                  "hazard",
                ],
              },
              {
                "environmentalHint": "the local law intensifies around elite anchors",
                "id": "act3_anchor_hunt",
                "label": "Anchor Hunt",
                "pressureHint": "critical combat pressure without added hull inflation",
                "rewardTierHint": "boss-grade salvage and stronger component quality",
                "tags": [
                  "frontier",
                  "bossApproach",
                  "pressure",
                ],
              },
            ],
            "arena": {
              "approachSpeed": 74.24,
              "approachStartDistance": 6000,
              "lockDistance": 6230,
              "releaseDistance": 6590,
            },
            "background": {
              "id": "background_horizon_scar",
              "layerCount": 3,
              "primitiveCount": 88,
            },
            "bossFactionId": "faction_scrap_court",
            "bossId": "boss_horizon_leviathan",
            "bossPatternId": "sporeSpiral",
            "features": {
              "hazardKinds": [
                "salvage_storm",
                "warning_beam",
                "crush_gate",
              ],
              "hazardWindows": [
                [
                  1766,
                  1931,
                  2606,
                ],
                [
                  3605.2,
                  3795.2,
                  3917.2,
                ],
                [
                  5155.8,
                  5356.8,
                  5494.8,
                ],
              ],
              "landmarkKinds": [
                "beacon_line",
                "core_machinery",
                "wreck_silhouette",
              ],
            },
            "frontierLaw": {
              "id": "law_last_light",
              "label": "Last Light",
            },
            "majorWaves": [
              "last_light_curtain",
              "eventide_wall",
              "anchor_breakers",
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
              "factionAmbush",
              "glitch",
              "elite",
            ],
            "scroll": {
              "baseSpeed": 128,
              "length": 6590,
              "startOffset": 260048,
            },
            "sectorId": "sector_horizon_scar",
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

function createTestSpawn(atDistance: number | null, waveIndex: number): EnemySpawn {
  return {
    atSeconds: waveIndex,
    atDistance,
    waveIndex,
    waveLabel: `test wave ${waveIndex}`,
    xRatio: 0.5,
    targetY: 120,
    hull: 2,
    fireDelay: 1,
    factionId: 'faction_scrap_court'
  };
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
      enemiesEscaped: 0,
      bossesDefeated: overrides.bossesDefeated ?? 0,
      shotsFired: 0,
      pickupsCollected: 0,
      looseCurrencySpawned: 0,
      looseCurrencyCollected: 0,
      looseCurrencyExpired: 0,
      looseCurrencySuppressedValue: 0,
      damageTaken: 0,
      itemTriggers: 0,
      specialsUsed: 0,
      bombsUsed: 0,
      grazes: 0,
      enemyProjectilesCancelled: 0,
      environmentObjectsDestroyed: 0,
      environmentRewardsDropped: 0,
      environmentChainReactions: 0,
      proximityMinesTriggered: 0,
      proximityMinesDetonated: 0,
      proximityMineEnemyHits: 0,
      setPieceComponentsDestroyed: 0,
      setPieceStagesCompleted: 0,
      setPiecesCompleted: 0,
      setPieceRewardsDropped: 0,
      setPieceProjectilesFired: 0,
      setPieceReinforcementsSpawned: 0,
      rivalsEscaped: 0,
      rivalsDestroyed: 0,
      alliesDeployed: 0,
      allyProjectilesFired: 0,
      allyEnemiesDestroyed: 0,
      allyProjectilesScreened: 0,
      allySalvageCollected: 0,
      allyInjuries: 0,
      allyRetreats: 0
    }
  };
}
