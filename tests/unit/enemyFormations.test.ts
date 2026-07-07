import { describe, expect, it } from 'vitest';

import {
  getEligibleEnemyFormations,
  getEnemyFormationChance
} from '../../src/content/enemyFormations';
import {
  createCombatState,
  updateCombatState,
  type CombatBounds
} from '../../src/game/CombatState';
import { createWaveDirectorPlan } from '../../src/game/WaveDirector';

const bounds: CombatBounds = {
  width: 640,
  height: 720,
  padding: 24
};

describe('enemy formations', () => {
  it('keeps fresh opening sectors and single-target waves formation-free', () => {
    const freshPlan = createWaveDirectorPlan({
      seed: 'FRESH-FORMATION-GUARD',
      objective: {
        kind: 'clearWaves',
        label: 'Fresh Sweep',
        requiredWaves: 2,
        spawnsPerWave: 3,
        requiredEnemyKills: 6,
        bossRequired: false,
        bossSpawnAtSeconds: null
      },
      majorWaves: ['fresh_one', 'fresh_two'],
      preferredFactionId: 'faction_scrap_court',
      sectorIndex: 0
    });
    const singlePlan = createWaveDirectorPlan({
      seed: 'SINGLE-FORMATION-GUARD',
      objective: {
        kind: 'clearWaves',
        label: 'Single Sweep',
        requiredWaves: 2,
        spawnsPerWave: 1,
        requiredEnemyKills: 2,
        bossRequired: false,
        bossSpawnAtSeconds: null
      },
      majorWaves: ['single_one', 'single_two'],
      preferredFactionId: 'faction_corporate_ledger',
      sectorIndex: 4,
      routePressure: true,
      challenge: true
    });

    expect(freshPlan.spawnSchedule.every((spawn) => !spawn.formationId)).toBe(true);
    expect(singlePlan.spawnSchedule.every((spawn) => !spawn.formationId)).toBe(true);
  });

  it('selects a seeded later-sector formation schedule under pressure', () => {
    const first = createFormationPressurePlan();
    const second = createFormationPressurePlan();

    expect(first.spawnSchedule.map((spawn) => spawn.formationId ?? 'solo')).toEqual(
      second.spawnSchedule.map((spawn) => spawn.formationId ?? 'solo')
    );
    expect(first.spawnSchedule.some((spawn) => spawn.formationId)).toBe(true);
    expect(
      first.spawnSchedule.map((spawn) => ({
        wave: spawn.waveLabel,
        formation: spawn.formationLabel ?? 'solo',
        member: `${(spawn.formationMemberIndex ?? -1) + 1}/${spawn.formationMemberCount ?? 1}`,
        faction: spawn.factionId,
        x: Math.round(spawn.xRatio * bounds.width),
        targetY: spawn.targetY,
        atDistance: spawn.atDistance ?? null
      }))
    ).toMatchInlineSnapshot(`
      [
        {
          "atDistance": 192,
          "faction": "faction_corporate_ledger",
          "formation": "screen",
          "member": "1/3",
          "targetY": 150,
          "wave": "elite_wedge_probe",
          "x": 248,
        },
        {
          "atDistance": 240,
          "faction": "faction_corporate_ledger",
          "formation": "screen",
          "member": "2/3",
          "targetY": 150,
          "wave": "elite_wedge_probe",
          "x": 320,
        },
        {
          "atDistance": 288,
          "faction": "faction_corporate_ledger",
          "formation": "screen",
          "member": "3/3",
          "targetY": 150,
          "wave": "elite_wedge_probe",
          "x": 392,
        },
        {
          "atDistance": 560,
          "faction": "faction_void_corsairs",
          "formation": "wedge",
          "member": "1/3",
          "targetY": 112,
          "wave": "ambush_pincer_pair",
          "x": 320,
        },
        {
          "atDistance": 616,
          "faction": "faction_bloom_hive",
          "formation": "wedge",
          "member": "2/3",
          "targetY": 144,
          "wave": "ambush_pincer_pair",
          "x": 264,
        },
        {
          "atDistance": 656,
          "faction": "faction_void_corsairs",
          "formation": "wedge",
          "member": "3/3",
          "targetY": 144,
          "wave": "ambush_pincer_pair",
          "x": 376,
        },
        {
          "atDistance": 928,
          "faction": "faction_scrap_court",
          "formation": "escort",
          "member": "1/3",
          "targetY": 78,
          "wave": "late_salvage_screen",
          "x": 320,
        },
        {
          "atDistance": 982,
          "faction": "faction_corporate_ledger",
          "formation": "escort",
          "member": "2/3",
          "targetY": 120,
          "wave": "late_salvage_screen",
          "x": 266,
        },
        {
          "atDistance": 1022,
          "faction": "faction_corporate_ledger",
          "formation": "escort",
          "member": "3/3",
          "targetY": 120,
          "wave": "late_salvage_screen",
          "x": 374,
        },
      ]
    `);
  });

  it('keeps formation members inside the fixed combat world with readable spacing', () => {
    const plan = createFormationPressurePlan();
    const formationSpawns = plan.spawnSchedule.filter((spawn) => spawn.formationId);

    expect(formationSpawns.length).toBeGreaterThan(0);
    expect(
      formationSpawns.every(
        (spawn) =>
          spawn.xRatio >= 0.1 && spawn.xRatio <= 0.9 && spawn.targetY >= 64 && spawn.targetY <= 240
      )
    ).toBe(true);

    for (const waveIndex of new Set(formationSpawns.map((spawn) => spawn.waveIndex))) {
      const waveMembers = formationSpawns.filter((spawn) => spawn.waveIndex === waveIndex);
      const uniqueMemberIndexes = new Set(waveMembers.map((spawn) => spawn.formationMemberIndex));

      expect(uniqueMemberIndexes.size).toBe(waveMembers.length);
      expect(waveMembers.map((spawn) => spawn.atSeconds)).toEqual(
        [...waveMembers.map((spawn) => spawn.atSeconds)].sort((a, b) => a - b)
      );
    }
  });

  it('spawns formation members once when scroll jumps across all member thresholds', () => {
    const plan = createWaveDirectorPlan({
      seed: 'FORMATION-CATCHUP-GRID',
      objective: {
        kind: 'clearWaves',
        label: 'Catchup Sweep',
        requiredWaves: 2,
        spawnsPerWave: 3,
        requiredEnemyKills: 6,
        bossRequired: false,
        bossSpawnAtSeconds: null
      },
      majorWaves: ['formation_one', 'formation_two'],
      preferredFactionId: 'faction_corporate_ledger',
      availableFactionIds: [
        'faction_scrap_court',
        'faction_corporate_ledger',
        'faction_bloom_hive',
        'faction_void_corsairs'
      ],
      scroll: {
        length: 1200,
        baseSpeed: 100
      },
      sectorIndex: 4,
      routePressure: true,
      challenge: true
    });
    const finalDistance = Math.max(...plan.spawnSchedule.map((spawn) => spawn.atDistance ?? 0));
    const state = createCombatState(bounds, 'FORMATION-CATCHUP-RUN', {
      spawnSchedule: plan.spawnSchedule,
      bossSpawnAtSeconds: null
    });

    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: finalDistance + 1 },
      1 / 60,
      bounds
    );

    const spawnedIds = state.enemies.map((enemy) => enemy.id);
    expect(state.nextSpawnIndex).toBe(plan.spawnSchedule.length);
    expect(state.enemies).toHaveLength(plan.spawnSchedule.length);
    expect(state.enemies.some((enemy) => enemy.formationId)).toBe(true);

    updateCombatState(
      state,
      { movement: { x: 0, y: 0 }, fire: false, scrollDistance: finalDistance + 1 },
      1 / 60,
      bounds
    );

    expect(state.nextSpawnIndex).toBe(plan.spawnSchedule.length);
    expect(state.enemies.map((enemy) => enemy.id)).toEqual(spawnedIds);
  });

  it('respects faction shape eligibility and caps pressure chance', () => {
    const ledgerFormations = getEligibleEnemyFormations({
      preferredFactionId: 'faction_corporate_ledger',
      availableFactionIds: ['faction_corporate_ledger'],
      sectorIndex: 3,
      waveIndex: 1,
      spawnCount: 3,
      waveLabel: 'elite_ledger_screen',
      routePressure: true,
      challenge: false,
      elite: true,
      encounterType: 'elite'
    });

    expect(ledgerFormations.map((formation) => formation.id)).toEqual([
      'formation_column',
      'formation_screen',
      'formation_escort',
      'formation_staggered_lane'
    ]);
    expect(
      getEnemyFormationChance({
        preferredFactionId: 'faction_void_corsairs',
        availableFactionIds: ['faction_void_corsairs'],
        sectorIndex: 4,
        waveIndex: 2,
        spawnCount: 3,
        waveLabel: 'elite_intercept',
        routePressure: true,
        challenge: true,
        elite: true,
        encounterType: 'elite'
      })
    ).toBe(0.86);
  });
});

function createFormationPressurePlan() {
  return createWaveDirectorPlan({
    seed: 'FORMATION-SQUAD-GRID',
    objective: {
      kind: 'clearWaves',
      label: 'Formation Sweep',
      requiredWaves: 3,
      spawnsPerWave: 3,
      requiredEnemyKills: 9,
      bossRequired: false,
      bossSpawnAtSeconds: null
    },
    majorWaves: ['elite_wedge_probe', 'ambush_pincer_pair', 'late_salvage_screen'],
    preferredFactionId: 'faction_void_corsairs',
    availableFactionIds: [
      'faction_scrap_court',
      'faction_corporate_ledger',
      'faction_bloom_hive',
      'faction_void_corsairs'
    ],
    scroll: {
      length: 1600,
      baseSpeed: 100
    },
    sectorIndex: 4,
    routePressure: true,
    challenge: true,
    eliteEncounter: true
  });
}
