import { describe, expect, it } from 'vitest';

import type { SectorId } from '../../src/content/sectors';
import { createRng } from '../../src/core/rng';
import type { CombatEntityCounts } from '../../src/game/CombatState';
import {
  ACT_PRESSURE_COMBINED_BUDGET,
  createActPressureDebugState,
  createActPressureModel,
  getActPressureEnvironmentObjectTargetCount,
  getActPressureRoutePressure
} from '../../src/game/ActPressure';
import {
  applySectorConditionsToBossArena,
  applySectorConditionsToFeatures,
  applySectorConditionsToScroll,
  createSectorConditionPlan
} from '../../src/game/SectorConditions';
import {
  applyHazardZoneDirectorToFeatures,
  createHazardZoneDirectorPlan,
  type HazardZoneDirectorPlan
} from '../../src/game/HazardZoneDirector';
import {
  createEnvironmentObjectPlacementPlan,
  validateEnvironmentObjectPlacementPlan
} from '../../src/game/EnvironmentObjectPlacement';
import { createEnvironmentStressDebugState } from '../../src/game/EnvironmentStress';
import { createEnemyRolePressureSummaryFromEnemies } from '../../src/game/EnemyRolePressure';
import { generateRunSkeleton } from '../../src/game/Generation';
import { createItemLoadoutStressModel, createItemStormLoadout } from '../../src/game/ItemStress';
import { createLooseCurrencyPlan } from '../../src/game/LooseCurrency';
import {
  applySectorPacingToBossArena,
  applySectorPacingToEncounterPacing,
  applySectorPacingToFeatures,
  applySectorPacingToScroll,
  createSectorPacingPlan
} from '../../src/game/SectorPacing';
import type { ActiveSectorHazard } from '../../src/game/SectorFeatures';
import { createWaveDirectorPlan } from '../../src/game/WaveDirector';

describe('ActPressure', () => {
  it('selects conservative pressure tiers from explicit act and pacing context', () => {
    const actOne = createPressureFixture('STARBREAK-SMOKE', 0);
    const actTwo = createPressureFixture('STARBREAK-SMOKE', 5);
    const finale = createPressureFixture('STARBREAK-SMOKE', 9);

    expect(actOne.model.pressureKind).toBe('baseline');
    expect(actOne.model.routePressure).toBe(false);
    expect(actOne.model.hazardPressure).toBe(0);
    expect(actOne.model.looseCurrencyValueBonus).toBe(0);

    expect(actTwo.model.pressureKind).toBe('sustained');
    expect(getActPressureRoutePressure(actTwo.model)).toBe(true);
    expect(actTwo.model.hazardPressure).toBe(1);
    expect(actTwo.model.environmentObjectTargetBonus).toBe(0);
    expect(actTwo.model.looseCurrencyValueBonus).toBe(1);

    expect(finale.model.pressureKind).toBe('finale');
    expect(finale.model.intensity).toBe(3);
    expect(finale.model.hazardPressure).toBe(1);
    expect(getActPressureEnvironmentObjectTargetCount(4, finale.model)).toBe(5);
    expect(finale.model.looseCurrencyValueBonus).toBe(2);
  });

  it('summarizes act pressure across enemy, hazard, environment, pickup, and item budgets', () => {
    const fixture = createPressureFixture('STARBREAK-SMOKE', 9);
    const enemyRoles = createEnemyRolePressureSummaryFromEnemies(
      [
        {
          factionId: 'faction_scrap_court',
          variantId: 'variant_armored',
          formationId: 'formation_wedge'
        },
        {
          factionId: 'faction_corporate_ledger',
          variantId: 'variant_overclocked',
          formationId: 'formation_wedge'
        },
        {
          factionId: 'faction_void_corsairs',
          variantId: null,
          formationId: null
        }
      ],
      { enemyProjectiles: 18, telegraphs: 2 }
    );
    const environmentStress = createEnvironmentStressDebugState(
      fixture.director.entries.slice(0, 2).map(createActiveHazard),
      createCounts({
        environmentObjects: 4,
        destructibles: 2,
        obstacles: 2,
        looseCurrencyPickups: 6,
        looseCurrencyValue: 14
      })
    );
    const itemStress = createItemLoadoutStressModel(createItemStormLoadout().slice(0, 8));
    const debug = createActPressureDebugState({
      model: fixture.model,
      enemyRoles,
      environmentStress,
      itemStress,
      hazardZoneDirector: fixture.director
    });

    expect(debug.combined.budget).toBe(ACT_PRESSURE_COMBINED_BUDGET);
    expect(debug.combined.withinBudget).toBe(true);
    expect(debug.enemy.projectiles).toBe(18);
    expect(debug.enemy.variants).toBe(2);
    expect(debug.enemy.formations).toBe(2);
    expect(debug.hazard.total).toBe(fixture.director.totalHazardCount);
    expect(debug.environment.objects).toBe(4);
    expect(debug.pickup.value).toBe(14);
    expect(debug.item.hookApplications).toBeGreaterThan(0);
  });

  it('keeps act-aware environment placement deterministic and fixed-world across viewport shapes', () => {
    const fixture = createPressureFixture('STARBREAK-SMOKE', 9);
    const narrowViewportPlan = createEnvironmentObjectPlacementPlan({
      sectorId: fixture.sector.sectorId as SectorId,
      sectorIndex: fixture.sectorIndex,
      scrollLength: fixture.scroll.length,
      rng: createRng('ACT-PRESSURE-VIEWPORT-PARITY').fork('fixed-world'),
      targetCount: 4,
      hazards: fixture.features.hazards,
      bossArena: fixture.arena,
      actPressure: fixture.model
    });
    const wideViewportPlan = createEnvironmentObjectPlacementPlan({
      sectorId: fixture.sector.sectorId as SectorId,
      sectorIndex: fixture.sectorIndex,
      scrollLength: fixture.scroll.length,
      rng: createRng('ACT-PRESSURE-VIEWPORT-PARITY').fork('fixed-world'),
      targetCount: 4,
      hazards: fixture.features.hazards,
      bossArena: fixture.arena,
      actPressure: fixture.model
    });

    expect(narrowViewportPlan).toEqual(wideViewportPlan);
    expect(validateEnvironmentObjectPlacementPlan(narrowViewportPlan)).toEqual([]);
    expect(narrowViewportPlan.arenaWidth).toBe(640);
    expect(narrowViewportPlan.arenaHeight).toBe(720);
    expect(narrowViewportPlan.objects.length).toBeLessThanOrEqual(5);
  });

  it('keeps combined enemy and environment stress below documented budgets', () => {
    const fixture = createPressureFixture('STARBREAK-SMOKE', 5);
    const wavePlan = createWaveDirectorPlan({
      seed: `${fixture.run.seed}:combat:${fixture.sector.sectorId}`,
      objective: fixture.sector.objective,
      majorWaves: fixture.sector.majorWaves,
      preferredFactionId: fixture.sector.bossFactionId,
      availableFactionIds: fixture.run.availableFactionIds,
      scroll: fixture.scroll,
      pacing: applySectorPacingToEncounterPacing(fixture.sector.encounterPacing, fixture.pacing),
      sectorIndex: fixture.sectorIndex,
      routePressure: false,
      formationClusterWaves: fixture.pacing.formationClusterWaveIndexes,
      actPressure: fixture.model
    });
    const environmentPlan = createEnvironmentObjectPlacementPlan({
      sectorId: fixture.sector.sectorId as SectorId,
      sectorIndex: fixture.sectorIndex,
      scrollLength: fixture.scroll.length,
      rng: createRng('ACT-PRESSURE-COMBINED-STRESS').fork('objects'),
      hazards: fixture.features.hazards,
      enemySpawnLanes: wavePlan.spawnSchedule
        .filter((spawn) => spawn.atDistance !== null)
        .map((spawn) => ({
          distance: spawn.atDistance ?? 0,
          xRatio: spawn.xRatio,
          width: spawn.formationMemberCount ? 118 : 96,
          label: spawn.waveLabel
        })),
      bossArena: fixture.arena,
      actPressure: fixture.model
    });
    const looseCurrency = createLooseCurrencyPlan({
      seed: `${fixture.run.seed}:combat:${fixture.sector.sectorId}`,
      sectorId: fixture.sector.sectorId,
      sectorIndex: fixture.sectorIndex,
      scrollLength: fixture.scroll.length,
      hazards: fixture.features.hazards,
      landmarks: fixture.features.landmarks,
      environmentObjects: environmentPlan.objects,
      routeEventBias: 'none',
      actPressure: fixture.model
    });
    const enemyRoles = createEnemyRolePressureSummaryFromEnemies(
      wavePlan.spawnSchedule.map((spawn) => ({
        factionId: spawn.factionId,
        variantId: spawn.variantId ?? null,
        formationId: spawn.formationId ?? null
      })),
      { enemyProjectiles: 24, telegraphs: 3 }
    );
    const environmentStress = createEnvironmentStressDebugState(
      fixture.director.entries.slice(0, 4).map(createActiveHazard),
      createCounts({
        environmentObjects: environmentPlan.objects.length,
        destructibles: environmentPlan.objects.filter(
          (object) => object.layoutRole === 'reward' || object.layoutRole === 'cover'
        ).length,
        obstacles: environmentPlan.objects.filter((object) => object.layoutRole === 'lanePressure')
          .length,
        looseCurrencyPickups: looseCurrency.events.length,
        looseCurrencyValue: looseCurrency.events.reduce(
          (total, event) => total + event.credits + event.salvage * 4,
          0
        )
      })
    );
    const itemStress = createItemLoadoutStressModel(createItemStormLoadout().slice(0, 12));
    const debug = createActPressureDebugState({
      model: fixture.model,
      enemyRoles,
      environmentStress,
      itemStress,
      hazardZoneDirector: fixture.director
    });
    const directorWithoutActPressure = createHazardZoneDirectorPlan({
      runSeed: fixture.run.seed,
      saveStateKey: fixture.run.unlockedIds.join('|'),
      features: fixture.pacedFeatures,
      scroll: fixture.scroll,
      conditions: fixture.conditions,
      pacing: fixture.pacing,
      bossArena: fixture.arena,
      backgroundId: fixture.sector.background.id
    });

    expect(fixture.director.pressureLevel).toBeGreaterThan(
      directorWithoutActPressure.pressureLevel
    );
    expect(looseCurrency.events.find((event) => event.source === 'routeEvent')?.credits).toBe(2);
    expect(debug.combined.withinBudget).toBe(true);
    expect(debug.combined.used).toBeLessThanOrEqual(ACT_PRESSURE_COMBINED_BUDGET);
    expect(debug.enemy.withinBudget).toBe(true);
    expect(debug.environment.withinBudget).toBe(true);
    expect(debug.item.withinBudget).toBe(true);
  });
});

function createPressureFixture(seed: string, sectorIndex: number) {
  const run = generateRunSkeleton(seed);
  const sector = run.sectors[sectorIndex];

  if (!sector) {
    throw new Error(`Expected sector ${sectorIndex}.`);
  }

  const conditions = createSectorConditionPlan({
    run,
    sectorIndex,
    routeOutcomes: []
  });
  const routeScroll = applySectorConditionsToScroll(sector.scroll, conditions);
  const routeFeatures = applySectorConditionsToFeatures(
    sector.features,
    sector.scroll,
    routeScroll,
    conditions
  );
  const pacing = createSectorPacingPlan({
    runSeed: run.seed,
    sector,
    sectorIndex,
    conditions,
    scroll: routeScroll
  });
  const scroll = applySectorPacingToScroll(routeScroll, pacing);
  const model = createActPressureModel({ sector, pacing });
  const pacedFeatures = applySectorPacingToFeatures(routeFeatures, scroll, pacing);
  const routeArena = applySectorConditionsToBossArena(
    sector.arena,
    sector.scroll,
    routeScroll,
    conditions
  );
  const arena = applySectorPacingToBossArena(routeArena, routeScroll, scroll, pacing);
  const director = createHazardZoneDirectorPlan({
    runSeed: run.seed,
    saveStateKey: run.unlockedIds.join('|'),
    features: pacedFeatures,
    scroll,
    conditions,
    pacing,
    bossArena: arena,
    backgroundId: sector.background.id,
    actPressure: model
  });
  const features = applyHazardZoneDirectorToFeatures(pacedFeatures, director);

  return {
    run,
    sector,
    sectorIndex,
    conditions,
    pacing,
    scroll,
    model,
    arena,
    director,
    pacedFeatures,
    features
  };
}

function createActiveHazard(entry: HazardZoneDirectorPlan['entries'][number]): ActiveSectorHazard {
  return {
    hazard: entry.hazard,
    phase: 'active',
    progress: 0.5,
    phaseProgress: 0.5
  };
}

function createCounts(overrides: Partial<CombatEntityCounts>): CombatEntityCounts {
  return {
    total: 0,
    player: 1,
    enemies: 0,
    boss: 0,
    projectiles: 0,
    playerProjectiles: 0,
    enemyProjectiles: 0,
    pickups: 0,
    looseCurrencyPickups: 0,
    looseCurrencyValue: 0,
    looseCurrencyCredits: 0,
    looseCurrencySalvage: 0,
    looseCurrencyPickupCap: 48,
    looseCurrencyValueCap: 120,
    effects: 0,
    pickupsAndEffects: 0,
    telegraphs: 0,
    environmentObjects: 0,
    destructibles: 0,
    obstacles: 0,
    ...overrides
  };
}
