import { describe, expect, it } from 'vitest';

import { createDefaultSaveData, applyRunRecordToSave } from '../../src/core/saveData';
import { createBossArenaState, updateBossArenaState } from '../../src/game/BossArena';
import { generateRunSkeleton } from '../../src/game/Generation';
import { createSectorConditionPlan } from '../../src/game/SectorConditions';
import {
  applySectorConditionsToBossArena,
  applySectorConditionsToScroll
} from '../../src/game/SectorConditions';
import {
  applySectorPacingToBossArena,
  applySectorPacingToScroll,
  createSectorPacingPlan
} from '../../src/game/SectorPacing';
import {
  applySecondActFinaleToBossArena,
  createSecondActFinaleDebugState,
  formatSecondActFinaleOutcome,
  getSecondActFinalePlan,
  getSecondActFinaleSectorIndex
} from '../../src/game/SecondActFinale';
import { formatFinaleOutcomeSummary } from '../../src/ui/RunSummaryScene';
import type { CombatRunResult } from '../../src/game/CombatState';

describe('SecondActFinale', () => {
  it('selects one deterministic Act II finale plan for the final sector', () => {
    const first = generateRunSkeleton('FINALE-088-SMOKE');
    const second = generateRunSkeleton('FINALE-088-SMOKE');
    const finale = getRequiredFinale(first);

    expect(getSecondActFinaleSectorIndex(first)).toBe(9);
    expect(first.sectors.filter((sector) => sector.finale !== null)).toHaveLength(1);
    expect(second.sectors[9]?.finale).toEqual(finale);
    expect(finale.bossId).toBe('boss_core_wreck');
    expect(finale.bossName).toBe('The Core Wreck');
    expect(finale.bossHullBonus).toBeGreaterThan(0);
    expect(finale.debugLabel).toContain('boss_core_wreck');

    const debug = createSecondActFinaleDebugState(finale);
    expect(debug).toEqual(
      expect.objectContaining({
        variantId: finale.variantId,
        label: finale.label,
        bossId: 'boss_core_wreck',
        victoryUnlockId: 'unlock_music_core_descent'
      })
    );
  });

  it('tunes finale arena approach without breaking lock or release', () => {
    const { sector, pacedArena, finaleArena } = createFinaleArenaFixture('STARBREAK-SMOKE');

    expect(finaleArena.lockDistance).toBe(pacedArena.lockDistance);
    expect(finaleArena.releaseDistance).toBe(pacedArena.releaseDistance);
    expect(finaleArena.approachStartDistance).toBeLessThan(pacedArena.approachStartDistance);
    expect(finaleArena.approachSpeed).toBeLessThanOrEqual(pacedArena.approachSpeed);

    const arenaState = createBossArenaState(finaleArena);
    expect(
      updateBossArenaState(arenaState, {
        distance: finaleArena.lockDistance,
        supportComplete: true,
        bossActive: false,
        bossAlreadySpawned: false,
        bossDefeated: false
      })
    ).toEqual({ phase: 'locked', speedOverride: 0, shouldSpawnBoss: true });
    expect(
      updateBossArenaState(arenaState, {
        distance: finaleArena.lockDistance,
        supportComplete: true,
        bossActive: false,
        bossAlreadySpawned: true,
        bossDefeated: true
      })
    ).toEqual({
      phase: 'released',
      speedOverride: finaleArena.exitSpeed,
      shouldSpawnBoss: false
    });

    expect(sector.features.hazards.length).toBeGreaterThan(0);
  });

  it('formats victory, defeat, and abandonment finale summaries clearly', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const finale = getRequiredFinale(run);

    expect(formatFinaleOutcomeSummary(run, createResult('victory'))).toBe(finale.victoryCopy);
    expect(formatFinaleOutcomeSummary(run, createResult('destroyed'))).toBe(finale.defeatCopy);
    expect(formatFinaleOutcomeSummary(run, createResult('abandoned'))).toBe(finale.abandonCopy);
    expect(formatSecondActFinaleOutcome(null, 'abandoned')).toBe('No finale gate reached.');
  });

  it('records finale victory metadata and unlock hooks through save updates', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const finale = getRequiredFinale(run);
    const update = applyRunRecordToSave(createDefaultSaveData(), {
      seed: run.seed,
      contractId: 'contract_1',
      contractName: 'Debt Runner',
      reason: 'victory',
      actId: 'act_core_descent',
      actName: 'Core Descent',
      actShortLabel: 'Act II',
      actIndex: 2,
      actSectorIndex: 5,
      actSectorCount: 5,
      actsCompleted: 2,
      finaleVariantId: finale.variantId,
      finaleVariantName: finale.variantName,
      finaleCleared: true,
      survivedSeconds: 240,
      distanceTraveled: 32000,
      sectorLength: 3600,
      sectorsCleared: run.sectors.length,
      bossesDefeated: 2,
      enemiesDestroyed: 80,
      creditsRecovered: 44,
      salvageRecovered: 12,
      itemTriggers: 4
    });

    expect(update.data.stats.victories).toBe(1);
    expect(update.data.lastRun?.finaleVariantId).toBe(finale.variantId);
    expect(update.data.lastRun?.finaleVariantName).toBe(finale.variantName);
    expect(update.data.lastRun?.finaleCleared).toBe(true);
    expect(update.newAchievementIds).toContain('achievement_core_finale');
    expect(update.newUnlockIds).toContain(finale.victoryUnlockId);
  });
});

function getRequiredFinale(run: ReturnType<typeof generateRunSkeleton>) {
  const finale = getSecondActFinalePlan(run);

  if (!finale) {
    throw new Error('Expected an Act II finale plan.');
  }

  return finale;
}

function createFinaleArenaFixture(seed: string) {
  const run = generateRunSkeleton(seed);
  const sectorIndex = getSecondActFinaleSectorIndex(run);
  const sector = run.sectors[sectorIndex];
  const finale = getRequiredFinale(run);

  if (!sector) {
    throw new Error('Expected finale sector.');
  }

  const conditions = createSectorConditionPlan({
    run,
    sectorIndex,
    routeOutcomes: []
  });
  const routeScroll = applySectorConditionsToScroll(sector.scroll, conditions);
  const pacing = createSectorPacingPlan({
    runSeed: run.seed,
    sector,
    sectorIndex,
    conditions,
    scroll: routeScroll
  });
  const pacedScroll = applySectorPacingToScroll(routeScroll, pacing);
  const routeArena = applySectorConditionsToBossArena(
    sector.arena,
    sector.scroll,
    routeScroll,
    conditions
  );
  const pacedArena = applySectorPacingToBossArena(routeArena, routeScroll, pacedScroll, pacing);
  const finaleArena = applySecondActFinaleToBossArena(pacedArena, finale);

  if (!pacedArena || !finaleArena) {
    throw new Error('Expected finale boss arena.');
  }

  return { sector, pacedArena, finaleArena };
}

function createResult(reason: CombatRunResult['reason']): CombatRunResult {
  return {
    reason,
    survivedSeconds: 100,
    distanceTraveled: 3200,
    sectorLength: 3200,
    credits: 12,
    salvage: 5,
    enemiesDestroyed: 18,
    bossesDefeated: reason === 'victory' ? 1 : 0,
    shotsFired: 120,
    pickupsCollected: 4,
    damageTaken: reason === 'destroyed' ? 3 : 0,
    itemTriggers: 2,
    itemNames: ['Split Prism']
  };
}
