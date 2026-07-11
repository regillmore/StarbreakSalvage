import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { generateRunSkeleton, summarizeRunSkeleton } from '../../src/game/Generation';

const TEST_SEEDS = [
  'LASER-TAX-404',
  'ORBITAL-JUNK-PROPHET',
  'VOID-CORSAIR-7',
  'STARBREAK-SMOKE'
] as const;

describe('generateRunSkeleton', () => {
  it.each(TEST_SEEDS)('repeats the same generated content for %s', (seed) => {
    expect(summarizeRunSkeleton(generateRunSkeleton(seed))).toEqual(
      summarizeRunSkeleton(generateRunSkeleton(seed))
    );
  });

  it('varies contract, boss, route, or wave choices across known seeds', () => {
    const signatures = TEST_SEEDS.map((seed) =>
      JSON.stringify(summarizeRunSkeleton(generateRunSkeleton(seed)))
    );

    expect(new Set(signatures).size).toBeGreaterThan(1);
  });

  it('creates three starting contracts and a fifteen-sector frontier route skeleton', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');

    expect(run.seed).toBe('STARBREAK-SMOKE');
    expect(run.acts.map((act) => [act.id, act.shortLabel, act.sectorIds])).toEqual([
      [
        'act_outer_rim',
        'Act I',
        [
          'sector_outer_debris_field',
          'sector_trade_war_corridor',
          'sector_bio_machine_bloom',
          'sector_corporate_kill_grid',
          'sector_trade_war_corridor'
        ]
      ],
      [
        'act_core_descent',
        'Act II',
        [
          'sector_bio_machine_bloom',
          'sector_lunar_surface',
          'sector_trade_war_corridor',
          'sector_corporate_kill_grid',
          'sector_core_wreck'
        ]
      ],
      [
        'act_null_frontier',
        'Act III',
        [
          'sector_nullglass_expanse',
          'sector_dead_signal_reef',
          'sector_parallax_foundry',
          'sector_gravity_choir',
          'sector_horizon_scar'
        ]
      ]
    ]);
    expect(run.contracts).toHaveLength(3);
    expect(new Set(run.contracts.map((contract) => contract.shipId)).size).toBe(3);
    expect(run.sectors.map((sector) => sector.sectorId)).toEqual([
      'sector_outer_debris_field',
      'sector_trade_war_corridor',
      'sector_bio_machine_bloom',
      'sector_corporate_kill_grid',
      'sector_trade_war_corridor',
      'sector_bio_machine_bloom',
      'sector_lunar_surface',
      'sector_trade_war_corridor',
      'sector_corporate_kill_grid',
      'sector_core_wreck',
      'sector_nullglass_expanse',
      'sector_dead_signal_reef',
      'sector_parallax_foundry',
      'sector_gravity_choir',
      'sector_horizon_scar'
    ]);

    for (const sector of run.sectors) {
      expect(sector.routeOptions).toHaveLength(3);
      expect(sector.majorWaves).toHaveLength(3);
      expect(sector.rewardPoolSeed).toContain(run.seed);
      expect(sector.shopSeed).toContain(run.seed);
      expect(sector.bossFactionId).toMatch(/^faction_/);
      expect(['auditFan', 'missileCurtain', 'sporeSpiral']).toContain(sector.bossPatternId);
      expect(sector.objective.requiredWaves).toBeGreaterThanOrEqual(1);
      expect(sector.objective.requiredEnemyKills).toBe(
        sector.objective.requiredWaves * sector.objective.spawnsPerWave
      );
    }

    expect(run.sectors[0]?.objective.requiredEnemyKills).toBeGreaterThan(1);
    expect(run.sectors[0]?.act.actShortLabel).toBe('Act I');
    expect(run.sectors[4]?.act.actSectorIndex).toBe(5);
    expect(run.sectors[5]?.act.actShortLabel).toBe('Act II');
    expect(run.sectors[9]?.act.rewardTier).toBe('escalated');
    expect(run.sectors[3]?.objective.bossRequired).toBe(true);
    expect(run.sectors[9]?.objective.bossSpawnAtSeconds).toBe(5.55);
  });

  it('summarizes a deterministic three-act plan with five sectors per act', () => {
    const first = summarizeRunSkeleton(generateRunSkeleton('ACT2-GATE-SMOKE'));
    const second = summarizeRunSkeleton(generateRunSkeleton('ACT2-GATE-SMOKE'));

    expect(first).toEqual(second);
    expect(first).toEqual(
      expect.objectContaining({
        acts: [
          expect.objectContaining({
            id: 'act_outer_rim',
            sectorRange: [1, 5],
            rewardTier: 'standard',
            pressureTier: 'baseline',
            transition: 'interActJunction'
          }),
          expect.objectContaining({
            id: 'act_core_descent',
            sectorRange: [6, 10],
            rewardTier: 'escalated',
            pressureTier: 'elevated',
            transition: 'frontierChoice'
          }),
          expect.objectContaining({
            id: 'act_null_frontier',
            sectorRange: [11, 15],
            rewardTier: 'escalated',
            pressureTier: 'elevated',
            transition: 'victory'
          })
        ]
      })
    );
  });

  it('can route a deterministic lunar surface sector into the middle lane', () => {
    const run = generateRunSkeleton('LUNAR-SURFACE-LANE');

    expect(run.sectors.slice(0, 10).map((sector) => sector.sectorId)).toEqual([
      'sector_outer_debris_field',
      'sector_trade_war_corridor',
      'sector_lunar_surface',
      'sector_bio_machine_bloom',
      'sector_corporate_kill_grid',
      'sector_trade_war_corridor',
      'sector_lunar_surface',
      'sector_bio_machine_bloom',
      'sector_corporate_kill_grid',
      'sector_core_wreck'
    ]);
    expect(run.sectors[2]?.sectorName).toBe('Lunar Surface');
    expect(run.sectors[2]?.background.id).toBe('background_lunar_surface');
    expect(run.sectors[2]?.background.layers.map((layer) => layer.kind)).toEqual([
      'deepStars',
      'craterRims',
      'lunarRidges',
      'surfaceTowers',
      'wreckShadows'
    ]);
    expect(run.sectors[2]?.encounterPacing).toEqual({
      waveWindowStartRatio: 0.16,
      waveWindowEndRatio: 0.72,
      spawnSpacing: 34,
      firstSpawnXRatio: 0.56,
      flankXMinRatio: 0.14,
      flankXMaxRatio: 0.86,
      targetYMin: 92,
      targetYMax: 158
    });
  });

  it('normalizes user seed input before generation', () => {
    expect(generateRunSkeleton(' laser tax 404 ').seed).toBe('LASER-TAX-404');
  });
});

describe('deterministic generation guardrails', () => {
  it('does not call Math.random in RNG or run generation code', () => {
    const guardedFiles = [
      'src/core/rng.ts',
      'src/game/BackgroundPlan.ts',
      'src/game/BossArena.ts',
      'src/game/ExpeditionGraph.ts',
      'src/game/Foundry.ts',
      'src/game/Generation.ts',
      'src/game/ScrollState.ts',
      'src/game/SectorFeatures.ts',
      'src/game/SectorObjectives.ts',
      'src/game/ShipLoadout.ts',
      'src/game/UpgradeEffects.ts',
      'src/game/WaveDirector.ts'
    ];

    for (const file of guardedFiles) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      expect(source).not.toContain('Math.random');
    }
  });
});
