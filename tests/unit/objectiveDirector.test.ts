import { describe, expect, it } from 'vitest';

import { MISSION_OBJECTIVES, getMissionObjective } from '../../src/content/objectives';
import { getEnvironmentObjectsForSector } from '../../src/content/environmentObjects';
import { createRng } from '../../src/core/rng';
import { createDefaultCombatBounds } from '../../src/game/CombatGeometry';
import { createCombatState, type CombatState } from '../../src/game/CombatState';
import { generateRunSkeleton } from '../../src/game/Generation';
import { createEnvironmentObjectPlacementPlan } from '../../src/game/EnvironmentObjectPlacement';
import {
  createMissionCombatProjection,
  createMissionDirectorState,
  createMissionSchedule,
  getMissionBranchOptions,
  selectMissionContract,
  transitionMission,
  type MissionDirectorState,
  type MissionSchedule
} from '../../src/game/MissionDirector';
import {
  createMissionObjectivePlan,
  createMissionObjectiveResultSnapshot,
  getMissionObjectiveProgress
} from '../../src/game/ObjectiveDirector';
import {
  createRunSession,
  getRewardModifiersForSector,
  recordMissionObjectiveOutcome
} from '../../src/game/RunSession';

describe('objective grammar and mission anthology', () => {
  it('authors fifteen deterministic contracts across all acts and requested verbs', () => {
    const first = generateRunSkeleton('OBJECTIVE-ANTHOLOGY-KNOWN-SEED');
    const second = generateRunSkeleton('OBJECTIVE-ANTHOLOGY-KNOWN-SEED');
    const firstSchedule = first.expedition.sectors.map((_, index) => {
      const schedule = createMissionSchedule(first.expedition, index);
      const objective = getMissionObjective(schedule.contract!.primaryObjectiveId);
      return [schedule.contract!.id, objective.verb, schedule.contract!.eligibleActIds[0]];
    });
    const secondSchedule = second.expedition.sectors.map((_, index) => {
      const schedule = createMissionSchedule(second.expedition, index);
      const objective = getMissionObjective(schedule.contract!.primaryObjectiveId);
      return [schedule.contract!.id, objective.verb, schedule.contract!.eligibleActIds[0]];
    });

    expect(secondSchedule).toEqual(firstSchedule);
    expect(firstSchedule).toEqual([
      ['contract_breach_levy', 'assault', 'act_outer_rim'],
      ['contract_running_audit', 'pursuit', 'act_outer_rim'],
      ['contract_cold_claim', 'salvage', 'act_outer_rim'],
      ['contract_lifeboat_ledger', 'rescue', 'act_outer_rim'],
      ['contract_last_perimeter', 'defense', 'act_outer_rim'],
      ['contract_ghost_spectrum', 'scan', 'act_core_descent'],
      ['contract_relay_severance', 'sabotage', 'act_core_descent'],
      ['contract_furnace_exit', 'escape', 'act_core_descent'],
      ['contract_pilgrim_screen', 'escort', 'act_core_descent'],
      ['contract_dead_center_writ', 'bossApproach', 'act_core_descent'],
      ['contract_shard_echo_survey', 'scan', 'act_null_frontier'],
      ['contract_vector_debt', 'escape', 'act_null_frontier'],
      ['contract_dead_reef_claim', 'sabotage', 'act_null_frontier'],
      ['contract_foundry_inversion', 'salvage', 'act_null_frontier'],
      ['contract_last_light_anchor', 'bossApproach', 'act_null_frontier']
    ]);
    expect(new Set(MISSION_OBJECTIVES.map((objective) => objective.verb))).toHaveLength(10);
    expect(
      MISSION_OBJECTIVES.filter((objective) =>
        objective.clauses.every((clause) => clause.metric !== 'enemyDefeatRatio')
      ).length
    ).toBeGreaterThanOrEqual(4);
    expect(
      new Set(
        MISSION_OBJECTIVES.map((objective) =>
          JSON.stringify([
            objective.world.scrollLengthScale,
            objective.world.waveCountScale,
            objective.cleanupPolicy,
            objective.clauses.map((clause) => clause.metric)
          ])
        )
      ).size
    ).toBeGreaterThanOrEqual(8);
  });

  it('resolves success, partial success, and failure only after the active field settles', () => {
    const { plan, sector, state } = createFixture(0);
    state.scrollDistance = sector.scroll.length;
    state.nextSpawnIndex = state.spawnSchedule.length;
    state.stats = {
      ...state.stats,
      enemiesDestroyed: sector.objective.requiredEnemyKills,
      environmentObjectsDestroyed: 1
    };

    const success = getMissionObjectiveProgress(
      plan,
      sector.objective,
      sector.scroll.length,
      state
    );
    expect(success.outcome).toBe('success');
    expect(success.terminal).toBe(true);

    state.stats = { ...state.stats, environmentObjectsDestroyed: 0 };
    const partial = getMissionObjectiveProgress(
      plan,
      sector.objective,
      sector.scroll.length,
      state
    );
    expect(partial.outcome).toBe('partialSuccess');

    state.stats = { ...state.stats, enemiesDestroyed: 0 };
    const failure = getMissionObjectiveProgress(
      plan,
      sector.objective,
      sector.scroll.length,
      state
    );
    expect(failure.outcome).toBe('failure');

    state.enemies = [{ id: 999 } as CombatState['enemies'][number]];
    expect(
      getMissionObjectiveProgress(plan, sector.objective, sector.scroll.length, state).outcome
    ).toBe('active');
  });

  it('distinguishes pursuit defeats from escaped enemies without losing terminal safety', () => {
    const { plan, sector, state } = createFixture(1);
    state.scrollDistance = sector.scroll.length;
    state.nextSpawnIndex = state.spawnSchedule.length;
    state.stats = {
      ...state.stats,
      enemiesDestroyed: sector.objective.requiredEnemyKills,
      enemiesEscaped: 2
    };
    const progress = getMissionObjectiveProgress(
      plan,
      sector.objective,
      sector.scroll.length,
      state
    );

    expect(progress.terminal).toBe(true);
    expect(progress.outcome).toBe('partialSuccess');
    expect(progress.clauses.find((clause) => clause.metric === 'enemyEscapes')).toMatchObject({
      value: 2,
      complete: false
    });
  });

  it('projects materially different pacing and world contracts for escape and sabotage play', () => {
    const run = generateRunSkeleton('OBJECTIVE-WORLD-PROJECTION');
    const sabotageSchedule = createMissionSchedule(run.expedition, 6);
    const sabotageState = reachCombat(sabotageSchedule);
    const sabotage = createMissionCombatProjection(
      sabotageSchedule,
      sabotageState,
      run.sectors[6]!
    );
    const escapeSchedule = createMissionSchedule(run.expedition, 7);
    const escapeState = reachCombat(escapeSchedule);
    const escape = createMissionCombatProjection(escapeSchedule, escapeState, run.sectors[7]!);

    expect(sabotage.objectiveWorld).toMatchObject({
      environmentMode: 'destructibles',
      environmentTargetCount: 5
    });
    expect(sabotage.missionObjective?.verb).toBe('sabotage');
    expect(escape.missionObjective?.verb).toBe('escape');
    expect(escape.sector.scroll.length).toBeLessThan(run.sectors[7]!.scroll.length);
    expect(escape.sector.objective.requiredWaves).toBeLessThanOrEqual(
      run.sectors[7]!.objective.requiredWaves
    );
    const sabotageObjects = createEnvironmentObjectPlacementPlan({
      sectorId: sabotage.sector.sectorId,
      sectorIndex: 6,
      scrollLength: sabotage.sector.scroll.length,
      rng: createRng('OBJECTIVE-SABOTAGE-PLACEMENT'),
      definitions: getEnvironmentObjectsForSector(sabotage.sector.sectorId).filter(
        (definition) => definition.damageInteraction.destructible
      ),
      targetCount: sabotage.objectiveWorld!.environmentTargetCount
    });
    expect(sabotageObjects.objects.length).toBeGreaterThanOrEqual(2);
  });

  it('uses objective outcome exits to bypass a high-risk branch after partial success', () => {
    const run = generateRunSkeleton('OBJECTIVE-BRANCH-POLICY');
    const schedule = createMissionSchedule(run.expedition, 3);
    let state = reachCombat(schedule);
    const plan = createMissionObjectivePlan({
      contract: schedule.contract!,
      objective: getMissionObjective(schedule.contract!.primaryObjectiveId),
      optional: false
    });
    const { sector, state: combat } = createFixture(3);
    combat.scrollDistance = sector.scroll.length;
    combat.nextSpawnIndex = combat.spawnSchedule.length;
    combat.stats = { ...combat.stats, pickupsCollected: 2 };
    const progress = getMissionObjectiveProgress(
      plan,
      sector.objective,
      sector.scroll.length,
      combat
    );
    const snapshot = createMissionObjectiveResultSnapshot(
      plan,
      { ...progress, outcome: 'partialSuccess' },
      state.currentStageId,
      'partialSuccess'
    );
    const result = transitionMission(schedule, state, {
      id: 'partial-combat',
      type: 'completeCombat',
      checkpoint: {
        hull: 2,
        scrollDistance: sector.scroll.length,
        worldOffset: sector.scroll.startOffset + sector.scroll.length,
        credits: 20,
        salvage: 4
      },
      objectiveOutcome: snapshot
    });
    state = result.state;

    expect(schedule.contract?.branchPolicy).toBe('afterSuccess');
    expect(state.currentStageId).toBe(schedule.reliefStageId);
    expect(getMissionBranchOptions(schedule, state).map((option) => option.default)).toEqual([true]);
  });

  it('records outcome rewards once and feeds later sector reward generation', () => {
    const { run, schedule, plan, sector, state } = createFixture(0);
    const session = createRunSession(run, run.contracts[0]!);
    state.scrollDistance = sector.scroll.length;
    state.nextSpawnIndex = state.spawnSchedule.length;
    state.stats = {
      ...state.stats,
      enemiesDestroyed: sector.objective.requiredEnemyKills,
      environmentObjectsDestroyed: 1
    };
    const progress = getMissionObjectiveProgress(
      plan,
      sector.objective,
      sector.scroll.length,
      state
    );
    const missionObjective = createMissionObjectiveResultSnapshot(
      plan,
      progress,
      schedule.operationStageId
    );
    const result = {
      reason: 'sectorComplete' as const,
      survivedSeconds: 20,
      distanceTraveled: sector.scroll.length,
      sectorLength: sector.scroll.length,
      credits: 0,
      salvage: 0,
      enemiesDestroyed: sector.objective.requiredEnemyKills,
      bossesDefeated: 0,
      shotsFired: 20,
      pickupsCollected: 0,
      damageTaken: 0,
      itemTriggers: 0,
      itemNames: [],
      missionObjective
    };
    const startingSalvage = session.salvage;

    recordMissionObjectiveOutcome(session, schedule, result);
    recordMissionObjectiveOutcome(session, schedule, result);

    expect(session.objectiveHistory).toHaveLength(1);
    expect(session.salvage).toBe(startingSalvage + 1);
    expect(getRewardModifiersForSector(session, 0)).toContainEqual(
      expect.objectContaining({ choiceBonus: 1, creditBonus: 2 })
    );
  });

  it('applies an explicit failure consequence without corrupting run completion state', () => {
    const { run, schedule, plan, sector, state } = createFixture(7);
    const session = createRunSession(run, run.contracts[0]!);
    state.scrollDistance = sector.scroll.length;
    state.nextSpawnIndex = state.spawnSchedule.length;
    state.stats = { ...state.stats, damageTaken: 4 };
    const progress = getMissionObjectiveProgress(
      plan,
      sector.objective,
      sector.scroll.length,
      state
    );
    const missionObjective = createMissionObjectiveResultSnapshot(
      plan,
      progress,
      schedule.operationStageId
    );
    const result = {
      reason: 'sectorComplete' as const,
      survivedSeconds: 20,
      distanceTraveled: sector.scroll.length,
      sectorLength: sector.scroll.length,
      credits: 0,
      salvage: 0,
      enemiesDestroyed: 0,
      bossesDefeated: 0,
      shotsFired: 0,
      pickupsCollected: 0,
      damageTaken: 4,
      itemTriggers: 0,
      itemNames: [],
      missionObjective
    };

    expect(progress.outcome).toBe('failure');
    expect(schedule.contract?.failurePolicy).toBe('continueWithPenalty');
    recordMissionObjectiveOutcome(session, schedule, result);
    expect(session.curse).toBe(1);
    expect(session.objectiveHistory[0]).toMatchObject({
      outcome: 'failure',
      cursePenalty: 1
    });
  });
});

function createFixture(sectorIndex: number) {
  const run = generateRunSkeleton(`OBJECTIVE-FIXTURE-${sectorIndex}`);
  const schedule = createMissionSchedule(run.expedition, sectorIndex);
  const contract = selectMissionContract(run.expedition, sectorIndex);
  const definition = getMissionObjective(contract.primaryObjectiveId);
  const plan = createMissionObjectivePlan({ contract, objective: definition, optional: false });
  const sector = run.sectors[sectorIndex]!;
  const state = createCombatState(createDefaultCombatBounds(), `objective-${sectorIndex}`, {
    spawnSchedule: [],
    bossSpawnAtSeconds: null,
    sectorLength: sector.scroll.length
  });
  return { run, schedule, plan, sector, state };
}

function reachCombat(schedule: MissionSchedule): MissionDirectorState {
  let state = createMissionDirectorState(schedule);
  state = transitionMission(schedule, state, {
    id: `${schedule.id}:brief`,
    type: 'confirmBriefing'
  }).state;
  return transitionMission(schedule, state, {
    id: `${schedule.id}:entry`,
    type: 'completeEntry'
  }).state;
}
