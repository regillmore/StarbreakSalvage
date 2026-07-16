import { describe, expect, it } from 'vitest';

import { createDefaultSaveData } from '../../src/core/saveData';
import { generateRunSkeleton } from '../../src/game/Generation';
import { generateRewardChoices, generateStartingItemLoadout } from '../../src/game/Rewards';
import {
  BASELINE_SHIP_IDS,
  getAvailableBossPracticeIds,
  getAvailableChallengeSeeds,
  getAvailableFactionIds,
  getAvailableShips,
  getItemFamilyGate
} from '../../src/game/UnlockGates';
import { createWaveDirectorPlan } from '../../src/game/WaveDirector';

describe('unlock gates', () => {
  it('keeps fresh-save generation viable while excluding locked ships and factions', () => {
    const freshSave = createDefaultSaveData();
    const run = generateRunSkeleton('STARBREAK-SMOKE', {
      unlockedIds: freshSave.unlockedIds
    });

    expect(
      getAvailableShips({ unlockedIds: freshSave.unlockedIds }).map((ship) => ship.id)
    ).toEqual(BASELINE_SHIP_IDS);
    expect(run.contracts).toHaveLength(3);
    expect(run.contracts.map((contract) => contract.shipId).sort()).toEqual(
      [...BASELINE_SHIP_IDS].sort()
    );
    expect(run.availableFactionIds).not.toContain('faction_bloom_hive');
    expect(run.sectors.map((sector) => sector.bossId)).not.toContain('boss_bloom_engine');
  });

  it('keeps fresh-save item pools and starter loadouts large enough', () => {
    const freshSave = createDefaultSaveData();
    const run = generateRunSkeleton('STARBREAK-SMOKE', {
      unlockedIds: freshSave.unlockedIds
    });
    const contract = run.contracts[0];

    if (!contract) {
      throw new Error('Expected a fresh-save contract.');
    }

    const combatRewards = generateRewardChoices({
      seed: 'FRESH-ITEM-POOL',
      poolId: 'combat',
      count: 99,
      unlockedIds: freshSave.unlockedIds
    }).map((choice) => choice.item.id);
    const vaultRewards = generateRewardChoices({
      seed: 'FRESH-VAULT-POOL',
      poolId: 'vault',
      count: 99,
      unlockedIds: freshSave.unlockedIds
    }).map((choice) => choice.item.id);
    const starterLoadout = generateStartingItemLoadout(run.seed, contract, {
      unlockedIds: freshSave.unlockedIds
    });

    expect(combatRewards).not.toContain('item_overheat_oracle');
    expect(combatRewards).not.toContain('item_capital_wound_ledger');
    expect(vaultRewards).not.toContain('item_curse_interest_bond');
    expect(starterLoadout).toHaveLength(1);
    expect(starterLoadout.map((item) => item.itemId)).not.toContain('item_cursed_hull_plate');
    expect(starterLoadout.map((item) => item.acquisitionOrder)).toEqual([0]);
  });

  it('excludes locked factions from directed combat waves', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE', {
      unlockedIds: []
    });
    const sector = run.sectors[2];

    if (!sector) {
      throw new Error('Expected a sector for wave gating.');
    }

    const plan = createWaveDirectorPlan({
      seed: `${run.seed}:combat:${sector.sectorId}`,
      objective: sector.objective,
      majorWaves: sector.majorWaves,
      preferredFactionId: sector.bossFactionId,
      availableFactionIds: run.availableFactionIds
    });

    expect(plan.spawnSchedule.map((spawn) => spawn.factionId)).not.toContain('faction_bloom_hive');
  });

  it('unlocks ships, items, factions, challenge seeds, and boss practice flags', () => {
    const unlockedIds = [
      'unlock_ship_phase_courier',
      'unlock_ship_relic_thief',
      'unlock_item_executive_override',
      'unlock_faction_bloom_hive',
      'unlock_challenge_debt_ceiling',
      'unlock_boss_auditor_drill'
    ] as const;
    const combatRewards = generateRewardChoices({
      seed: 'UNLOCKED-ITEM-POOL',
      poolId: 'combat',
      count: 99,
      unlockedIds
    }).map((choice) => choice.item.id);
    const vaultRewards = generateRewardChoices({
      seed: 'UNLOCKED-VAULT-POOL',
      poolId: 'vault',
      count: 99,
      unlockedIds
    }).map((choice) => choice.item.id);

    expect(getAvailableShips({ unlockedIds }).map((ship) => ship.id)).toContain(
      'ship_phase_courier'
    );
    expect(getAvailableFactionIds({ unlockedIds })).toContain('faction_bloom_hive');
    expect(combatRewards).toContain('item_overheat_oracle');
    expect(combatRewards).toContain('item_capital_wound_ledger');
    expect(vaultRewards).toContain('item_curse_interest_bond');
    expect(getItemFamilyGate('curse-relic')?.unlockId).toBe('unlock_ship_relic_thief');
    expect(getAvailableChallengeSeeds({ unlockedIds }).map((challenge) => challenge.id)).toEqual([
      'challenge_debt_ceiling'
    ]);
    expect(getAvailableBossPracticeIds({ unlockedIds })).toEqual(['boss_auditor_drone_xl']);
  });
});
