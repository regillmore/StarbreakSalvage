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

  it('creates three starting contracts and a five-sector baseline route skeleton', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');

    expect(run.seed).toBe('STARBREAK-SMOKE');
    expect(run.contracts).toHaveLength(3);
    expect(new Set(run.contracts.map((contract) => contract.shipId)).size).toBe(3);
    expect(run.sectors.map((sector) => sector.sectorId)).toEqual([
      'sector_outer_debris_field',
      'sector_trade_war_corridor',
      'sector_bio_machine_bloom',
      'sector_corporate_kill_grid',
      'sector_core_wreck'
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
    expect(run.sectors[3]?.objective.bossRequired).toBe(true);
    expect(run.sectors[4]?.objective.bossSpawnAtSeconds).toBe(5.55);
  });

  it('can route a deterministic lunar surface sector into the middle lane', () => {
    const run = generateRunSkeleton('LUNAR-SURFACE-LANE');

    expect(run.sectors.map((sector) => sector.sectorId)).toEqual([
      'sector_outer_debris_field',
      'sector_trade_war_corridor',
      'sector_lunar_surface',
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
      'src/game/Generation.ts',
      'src/game/ScrollState.ts',
      'src/game/SectorFeatures.ts',
      'src/game/SectorObjectives.ts',
      'src/game/UpgradeEffects.ts',
      'src/game/WaveDirector.ts'
    ];

    for (const file of guardedFiles) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      expect(source).not.toContain('Math.random');
    }
  });
});
