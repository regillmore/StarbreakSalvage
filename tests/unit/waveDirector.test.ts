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
            ],
            "sectorRange": [
              1,
              5,
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
              "sector_bio_machine_bloom",
              "sector_lunar_surface",
              "sector_trade_war_corridor",
              "sector_corporate_kill_grid",
              "sector_core_wreck",
            ],
            "sectorRange": [
              6,
              10,
            ],
            "shortLabel": "Act II",
            "transition": "victory",
          },
        ],
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
          "actCount": 2,
          "branchCount": 10,
          "capacity": {
            "baselineMaxSeconds": 1326,
            "baselineMinSeconds": 612,
            "baselineTargetSeconds": 962,
            "expandedTargetSeconds": 1182,
            "optionalNodeCount": 10,
            "requiredNodeCount": 30,
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
              "transition": "victory",
            },
          ],
          "id": "expedition_starbreak-smoke_53f226d4",
          "nodeCount": 40,
          "saveFingerprint": "unlocks=unlock_boss_auditor_drill,unlock_challenge_debt_ceiling,unlock_faction_bloom_hive,unlock_item_executive_override,unlock_music_core_descent,unlock_music_outer_debris,unlock_ship_corporate_test_pilot,unlock_ship_phase_courier,unlock_ship_relic_thief,unlock_ship_scrap_monk,unlock_ship_shield_bruiser|upgrades=none",
          "schemaVersion": 1,
          "sectorCount": 10,
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
            "setPiece": {
              "anchorDistance": 606,
              "bossLock": "none",
              "id": "setpiece_ledger_hecaton",
              "reinforcementFormation": "formation_screen",
              "safeLane": {
                "label": "port maintenance lane",
                "maxX": 216,
                "minX": 34,
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
            "act": {
              "id": "act_outer_rim",
              "index": 1,
              "pressureTier": "baseline",
              "rewardTier": "standard",
              "sectorCount": 5,
              "sectorIndex": 4,
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
              "sectorIndex": 5,
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
              "id": "act_core_descent",
              "index": 2,
              "pressureTier": "elevated",
              "rewardTier": "escalated",
              "sectorCount": 5,
              "sectorIndex": 1,
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
                  1212.68,
                  1350.68,
                  1574.68,
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
              "vault",
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
              "id": "act_core_descent",
              "index": 2,
              "pressureTier": "elevated",
              "rewardTier": "escalated",
              "sectorCount": 5,
              "sectorIndex": 2,
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
                "environmentalHint": "hazard timing may feel less regular after the shear",
                "id": "act2_seed_shear",
                "label": "Seed Shear",
                "pressureHint": "high variance pressure with possible curse exposure",
                "rewardTierHint": "extra reward choice with phase and heat bias",
                "tags": [
                  "seedShear",
                  "hazard",
                  "pressure",
                ],
              },
            ],
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
              "repair",
              "vault",
              "glitch",
            ],
            "scroll": {
              "baseSpeed": 103,
              "length": 2623,
              "startOffset": 60370,
            },
            "sectorId": "sector_lunar_surface",
            "setPiece": {
              "anchorDistance": 1443,
              "bossLock": "none",
              "id": "setpiece_bloom_spindle",
              "reinforcementFormation": "formation_ring",
              "safeLane": {
                "label": "starboard evacuation lane",
                "maxX": 606,
                "minX": 424,
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
                "rewardTierHint": "extra reward choice with phase and heat bias",
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
              "factionAmbush",
              "elite",
              "glitch",
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
              "id": "act_core_descent",
              "index": 2,
              "pressureTier": "elevated",
              "rewardTier": "escalated",
              "sectorCount": 5,
              "sectorIndex": 4,
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
                "rewardTierHint": "extra reward choice with phase and heat bias",
                "tags": [
                  "seedShear",
                  "hazard",
                  "pressure",
                ],
              },
            ],
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
              "glitch",
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
              "sectorIndex": 5,
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
                "environmentalHint": "hazard timing may feel less regular after the shear",
                "id": "act2_seed_shear",
                "label": "Seed Shear",
                "pressureHint": "high variance pressure with possible curse exposure",
                "rewardTierHint": "extra reward choice with phase and heat bias",
                "tags": [
                  "seedShear",
                  "hazard",
                  "pressure",
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
              "approachSpeed": 71.92,
              "approachStartDistance": 2984,
              "lockDistance": 3214,
              "releaseDistance": 3574,
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
                  972.2,
                  1144.2,
                  1266.2,
                ],
                [
                  1930.92,
                  2087.92,
                  2308.92,
                ],
                [
                  2731.68,
                  2901.68,
                  3031.68,
                ],
              ],
              "landmarkKinds": [
                "wreck_silhouette",
                "core_machinery",
                "vault_door",
              ],
            },
            "majorWaves": [
              "unstable_relic_front",
              "core_lockdown",
              "mixed_faction_storm",
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
              "vault",
              "glitch",
              "shop",
            ],
            "scroll": {
              "baseSpeed": 124,
              "length": 3574,
              "startOffset": 90870,
            },
            "sectorId": "sector_core_wreck",
            "setPiece": {
              "anchorDistance": 3214,
              "bossLock": "untilComplete",
              "id": "setpiece_court_wreck_train",
              "reinforcementFormation": "formation_convoy",
              "safeLane": {
                "label": "center tow corridor",
                "maxX": 388,
                "minX": 252,
              },
            },
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
      setPieceComponentsDestroyed: 0,
      setPieceStagesCompleted: 0,
      setPiecesCompleted: 0,
      setPieceRewardsDropped: 0,
      setPieceProjectilesFired: 0,
      setPieceReinforcementsSpawned: 0,
      rivalsEscaped: 0,
      rivalsDestroyed: 0
    }
  };
}
