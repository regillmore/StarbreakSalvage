import { describe, expect, it } from 'vitest';

import { getEligibleEnemyVariants, getEnemyVariantChance } from '../../src/content/enemyVariants';
import { createWaveDirectorPlan } from '../../src/game/WaveDirector';

describe('enemy variants', () => {
  it('keeps fresh opening sectors variant-free without pressure flags', () => {
    const plan = createWaveDirectorPlan({
      seed: 'FRESH-VARIANT-GUARD',
      objective: {
        kind: 'clearWaves',
        label: 'Fresh Sweep',
        requiredWaves: 3,
        spawnsPerWave: 3,
        requiredEnemyKills: 9,
        bossRequired: false,
        bossSpawnAtSeconds: null
      },
      majorWaves: ['fresh_one', 'fresh_two', 'fresh_three'],
      preferredFactionId: 'faction_scrap_court',
      sectorIndex: 0
    });

    expect(plan.spawnSchedule).toHaveLength(9);
    expect(plan.spawnSchedule.every((spawn) => !spawn.variantId)).toBe(true);
  });

  it('selects a seeded later-sector variant schedule under route pressure', () => {
    const first = createVariantPressurePlan();
    const second = createVariantPressurePlan();
    const firstVariants = first.spawnSchedule.map((spawn) => spawn.variantId ?? 'baseline');
    const secondVariants = second.spawnSchedule.map((spawn) => spawn.variantId ?? 'baseline');

    expect(firstVariants).toEqual(secondVariants);
    expect(firstVariants.filter((variantId) => variantId !== 'baseline').length).toBeGreaterThan(0);
    expect(first.spawnSchedule.map((spawn) => [spawn.factionId, spawn.variantId ?? 'baseline']))
      .toMatchInlineSnapshot(`
        [
          [
            "faction_corporate_ledger",
            "variant_shielded",
          ],
          [
            "faction_scrap_court",
            "variant_salvage_rich",
          ],
          [
            "faction_scrap_court",
            "variant_armored",
          ],
          [
            "faction_corporate_ledger",
            "baseline",
          ],
          [
            "faction_scrap_court",
            "variant_salvage_rich",
          ],
          [
            "faction_void_corsairs",
            "baseline",
          ],
          [
            "faction_scrap_court",
            "variant_armored",
          ],
          [
            "faction_void_corsairs",
            "baseline",
          ],
          [
            "faction_scrap_court",
            "baseline",
          ],
        ]
      `);
  });

  it('respects faction eligibility when building candidate pools', () => {
    const bloomEliteOnly = getEligibleEnemyVariants({
      factionId: 'faction_bloom_hive',
      sectorIndex: 2,
      waveIndex: 0,
      spawnIndex: 0,
      waveLabel: 'elite_test',
      routePressure: false,
      challenge: false,
      elite: true,
      encounterType: 'elite'
    });
    const bloomChallenge = getEligibleEnemyVariants({
      factionId: 'faction_bloom_hive',
      sectorIndex: 2,
      waveIndex: 0,
      spawnIndex: 0,
      waveLabel: 'challenge_test',
      routePressure: false,
      challenge: true,
      elite: false,
      encounterType: 'normal'
    });

    expect(bloomEliteOnly.map((variant) => variant.id)).not.toContain('variant_armored');
    expect(bloomChallenge.map((variant) => variant.id)).toEqual([
      'variant_evasive',
      'variant_volatile',
      'variant_salvage_rich'
    ]);
  });

  it('caps combined late-sector pressure chance below coin-flip territory', () => {
    expect(
      getEnemyVariantChance({
        factionId: 'faction_void_corsairs',
        sectorIndex: 4,
        waveIndex: 2,
        spawnIndex: 1,
        waveLabel: 'elite_intercept',
        routePressure: true,
        challenge: true,
        elite: true,
        encounterType: 'elite'
      })
    ).toBe(0.48);
  });
});

function createVariantPressurePlan() {
  return createWaveDirectorPlan({
    seed: 'VARIANT-ESCALATION-GRID',
    objective: {
      kind: 'clearWaves',
      label: 'Variant Sweep',
      requiredWaves: 3,
      spawnsPerWave: 3,
      requiredEnemyKills: 9,
      bossRequired: false,
      bossSpawnAtSeconds: null
    },
    majorWaves: ['elite_wedge_probe', 'ambush_intercept_pair', 'late_salvage_screen'],
    preferredFactionId: 'faction_scrap_court',
    availableFactionIds: [
      'faction_scrap_court',
      'faction_corporate_ledger',
      'faction_bloom_hive',
      'faction_void_corsairs'
    ],
    sectorIndex: 4,
    routePressure: true,
    challenge: true,
    eliteEncounter: true,
    enableFormations: false
  });
}
