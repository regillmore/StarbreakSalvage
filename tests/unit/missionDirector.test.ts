import { describe, expect, it } from 'vitest';

import { generateRunSkeleton } from '../../src/game/Generation';
import {
  createMissionCombatProjection,
  createMissionDirectorState,
  createMissionReadModel,
  createMissionSchedule,
  createSingleStageCompatibilityMissionSchedule,
  getMissionBranchOptions,
  getMissionStage,
  transitionMission,
  type MissionCheckpoint,
  type MissionDirectorState,
  type MissionEvent,
  type MissionSchedule
} from '../../src/game/MissionDirector';
import {
  createRunSession,
  dispatchMissionEvent,
  recordExpeditionBranchDecision
} from '../../src/game/RunSession';
import { createBossArenaState, updateBossArenaState } from '../../src/game/BossArena';
import { createSetPieceState, isSetPieceBossLockReleased } from '../../src/game/SetPiece';

const CHECKPOINT: MissionCheckpoint = {
  hull: 2,
  scrollDistance: 1240,
  worldOffset: 12_480,
  credits: 37,
  salvage: 9
};

describe('MissionDirector', () => {
  it('builds the same explicit schedule from the same expedition graph', () => {
    const run = generateRunSkeleton('MISSION-DIRECTOR-SCHEDULE');
    const first = createMissionSchedule(run.expedition, 0);
    const second = createMissionSchedule(run.expedition, 0);

    expect(second).toEqual(first);
    expect(first.stages.map((stage) => stage.kind)).toEqual([
      'briefing',
      'entry',
      'combat',
      'branch',
      'combat',
      'relief',
      'combat',
      'branch',
      'combat',
      'relief',
      'extraction',
      'failure',
      'completion'
    ]);
    expect(first.stages.find((stage) => stage.operationalRole === 'detour')?.world).toMatchObject({
      scrollLengthScale: 0.34,
      waveCountScale: 0.45,
      bossPolicy: 'none'
    });
    expect(first.operationStageIds).toHaveLength(4);
    expect(first.branches).toHaveLength(2);
  });

  it('advances a direct mission through every required stage exactly once', () => {
    const run = generateRunSkeleton('MISSION-DIRECTOR-DIRECT');
    const schedule = createMissionSchedule(run.expedition, 0);
    let state = createMissionDirectorState(schedule, { credits: 16 });

    state = apply(schedule, state, { id: 'briefing', type: 'confirmBriefing' });
    expect(getMissionStage(schedule, state.currentStageId).kind).toBe('entry');
    state = apply(schedule, state, { id: 'entry', type: 'completeEntry' });
    expect(state.currentStageId).toBe(schedule.operationStageId);
    state = apply(schedule, state, {
      id: 'operation',
      type: 'completeCombat',
      checkpoint: CHECKPOINT
    });
    expect(getMissionStage(schedule, state.currentStageId).kind).toBe('branch');

    const direct = getMissionBranchOptions(schedule).find((option) => option.default);
    expect(direct).toBeDefined();
    state = apply(schedule, state, {
      id: 'branch',
      type: 'selectBranch',
      optionId: direct?.id ?? ''
    });
    expect(getMissionStage(schedule, state.currentStageId).kind).toBe('relief');
    state = apply(schedule, state, { id: 'staging', type: 'completeRelief' });
    expect(getMissionStage(schedule, state.currentStageId).operationalRole).toBe('gate');
    state = apply(schedule, state, {
      id: 'gate-operation',
      type: 'completeCombat',
      checkpoint: CHECKPOINT
    });
    expect(getMissionStage(schedule, state.currentStageId).kind).toBe('branch');
    const extract = getMissionBranchOptions(schedule, state).find((option) => option.default);
    state = apply(schedule, state, {
      id: 'extraction-branch',
      type: 'selectBranch',
      optionId: extract?.id ?? ''
    });
    expect(getMissionStage(schedule, state.currentStageId).kind).toBe('relief');
    state = apply(schedule, state, { id: 'relief', type: 'completeRelief' });
    expect(getMissionStage(schedule, state.currentStageId).kind).toBe('extraction');
    state = apply(schedule, state, { id: 'extraction', type: 'completeExtraction' });

    expect(state.status).toBe('completed');
    expect(state.currentStageId).toBe(schedule.completionStageId);
    expect(state.transitions).toHaveLength(9);
    expect(createMissionReadModel(schedule, state).stageKind).toBe('completion');
  });

  it('branches into a stage-local optional encounter and carries its checkpoint', () => {
    const run = generateRunSkeleton('MISSION-DIRECTOR-OPTIONAL');
    const schedule = createMissionSchedule(run.expedition, 0);
    let state = reachBranch(schedule);
    const optional = getMissionBranchOptions(schedule).find((option) => !option.default);

    state = apply(schedule, state, {
      id: 'optional-branch',
      type: 'selectBranch',
      optionId: optional?.id ?? ''
    });
    expect(state.currentStageId).toBe(schedule.optionalStageId);

    const projection = createMissionCombatProjection(schedule, state, run.sectors[0]!);
    expect(projection.startingHull).toBe(CHECKPOINT.hull);
    expect(projection.sector.objective.bossRequired).toBe(false);
    expect(projection.sector.objective.requiredWaves).toBeLessThanOrEqual(
      run.sectors[0]!.objective.requiredWaves
    );
    expect(projection.sector.scroll.length).toBeLessThan(run.sectors[0]!.scroll.length);
    expect(projection.sector.scroll.startOffset).toBeGreaterThanOrEqual(CHECKPOINT.worldOffset);
    expect(run.sectors[0]!.setPiece).not.toBeNull();
    expect(projection.sector.setPiece).toBeNull();
    expect(projection.completionReason).toBe('sectorComplete');

    state = apply(schedule, state, {
      id: 'optional-combat',
      type: 'completeCombat',
      checkpoint: { ...CHECKPOINT, hull: 1, salvage: 14 }
    });
    expect(getMissionStage(schedule, state.currentStageId).kind).toBe('relief');
    expect(state.checkpoint).toMatchObject({ hull: 1, credits: 37, salvage: 14 });
  });

  it('reprojects the STARBREAK-SMOKE sector-10 set piece and boss lock inside the gate operation', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const sectorIndex = 9;
    const sector = run.sectors[sectorIndex]!;
    const schedule = createMissionSchedule(run.expedition, sectorIndex);
    let state = reachBranch(schedule);
    const directApproach = getMissionBranchOptions(schedule, state).find(
      (option) => option.default
    )!;

    state = apply(schedule, state, {
      id: 'sector-10-approach',
      type: 'selectBranch',
      optionId: directApproach.id
    });
    state = apply(schedule, state, { id: 'sector-10-staging', type: 'completeRelief' });

    const projection = createMissionCombatProjection(schedule, state, sector);
    const arena = projection.sector.arena;
    const setPiece = projection.sector.setPiece;

    expect(sector.sectorId).toBe('sector_core_wreck');
    expect(sector.setPiece?.anchorDistance).toBeGreaterThan(projection.sector.scroll.length);
    expect(arena).not.toBeNull();
    expect(setPiece).not.toBeNull();
    expect(projection.missionObjective?.hudVerb).toBe('BREACH GATE');
    expect(
      projection.missionObjective?.clauses.some((clause) => clause.metric === 'bossDefeats')
    ).toBe(true);
    expect(arena!.lockDistance).toBeLessThan(projection.sector.scroll.length);
    expect(setPiece!.anchorDistance).toBe(Math.round(arena!.lockDistance));

    const setPieceState = createSetPieceState(setPiece);
    setPieceState!.completed = true;
    const arenaState = createBossArenaState(arena);
    const update = updateBossArenaState(arenaState, {
      distance: arena!.lockDistance,
      supportComplete: isSetPieceBossLockReleased(setPieceState),
      bossActive: false,
      bossAlreadySpawned: false,
      bossDefeated: false
    });

    expect(update).toMatchObject({ phase: 'locked', shouldSpawnBoss: true });
  });

  it('rejects out-of-order events and collapses duplicate completion signals', () => {
    const run = generateRunSkeleton('MISSION-DIRECTOR-CATCHUP');
    const schedule = createMissionSchedule(run.expedition, 0);
    const initial = createMissionDirectorState(schedule);
    const rejected = transitionMission(schedule, initial, {
      id: 'early-combat',
      type: 'completeCombat',
      checkpoint: CHECKPOINT
    });

    expect(rejected.disposition).toBe('rejected');
    expect(rejected.state).toBe(initial);

    let combat = apply(schedule, initial, { id: 'brief', type: 'confirmBriefing' });
    combat = apply(schedule, combat, { id: 'enter', type: 'completeEntry' });
    const first = transitionMission(schedule, combat, {
      id: 'same-frame-objective',
      type: 'completeCombat',
      checkpoint: CHECKPOINT
    });
    const duplicate = transitionMission(schedule, first.state, {
      id: 'same-frame-objective',
      type: 'completeCombat',
      checkpoint: CHECKPOINT
    });

    expect(first.disposition).toBe('advanced');
    expect(duplicate.disposition).toBe('duplicate');
    expect(duplicate.state).toBe(first.state);
    expect(duplicate.state.transitions).toHaveLength(3);
  });

  it('evaluates data-backed branch conditions against the combat checkpoint', () => {
    const run = generateRunSkeleton('MISSION-DIRECTOR-BRANCH-CONDITION');
    const schedule = createMissionSchedule(run.expedition, 0);
    let state = createMissionDirectorState(schedule);
    state = apply(schedule, state, { id: 'brief', type: 'confirmBriefing' });
    state = apply(schedule, state, { id: 'entry', type: 'completeEntry' });
    state = apply(schedule, state, {
      id: 'combat',
      type: 'completeCombat',
      checkpoint: { ...CHECKPOINT, hull: 0 }
    });
    const optional = getMissionBranchOptions(schedule).find((option) => !option.default)!;
    const result = transitionMission(schedule, state, {
      id: 'unsafe-detour',
      type: 'selectBranch',
      optionId: optional.id
    });

    expect(result.disposition).toBe('rejected');
    expect(result.reason).toContain('not currently available');
    expect(getMissionBranchOptions(schedule, state).map((option) => option.id)).toEqual([
      getMissionBranchOptions(schedule).find((option) => option.default)!.id
    ]);
  });

  it('suspends, resumes, and fails without losing the active stage or checkpoint', () => {
    const run = generateRunSkeleton('MISSION-DIRECTOR-RESUME');
    const schedule = createMissionSchedule(run.expedition, 0);
    let state = createMissionDirectorState(schedule, { credits: 22, salvage: 4 });
    state = apply(schedule, state, { id: 'brief', type: 'confirmBriefing' });
    state = apply(schedule, state, { id: 'entry', type: 'completeEntry' });
    const combatStage = state.currentStageId;

    state = apply(schedule, state, { id: 'pause', type: 'suspend' });
    expect(state.status).toBe('suspended');
    expect(state.currentStageId).toBe(combatStage);
    state = apply(schedule, state, { id: 'resume', type: 'resume' });
    expect(state.status).toBe('active');
    expect(state.currentStageId).toBe(combatStage);
    state = apply(schedule, state, { id: 'destroyed', type: 'fail', reason: 'destroyed' });
    expect(state.status).toBe('failed');
    expect(state.currentStageId).toBe(schedule.failureStageId);
    expect(state.failureReason).toBe('destroyed');

    const terminalResume = transitionMission(schedule, state, {
      id: 'late-resume',
      type: 'resume'
    });
    expect(terminalResume.disposition).toBe('rejected');
  });

  it('keeps old single-stage combat compatible with the guarded transition contract', () => {
    const schedule = createSingleStageCompatibilityMissionSchedule({
      graphId: 'legacy-graph',
      sectorIndex: 0,
      sectorPlanId: 'legacy-sector',
      nodeId: 'legacy-operation',
      label: 'Legacy operation'
    });
    const initial = createMissionDirectorState(schedule);
    const result = transitionMission(schedule, initial, {
      id: 'legacy-complete',
      type: 'completeCombat',
      checkpoint: CHECKPOINT
    });

    expect(result.disposition).toBe('advanced');
    expect(result.state.status).toBe('completed');
    expect(result.state.currentStageId).toBe(schedule.completionStageId);
  });

  it('integrates transitions and branch decisions with expedition progress in RunSession', () => {
    const run = generateRunSkeleton('MISSION-DIRECTOR-SESSION');
    const contract = run.contracts[0]!;
    const session = createRunSession(run, contract);
    const schedule = createMissionSchedule(run.expedition, 0);

    dispatchMissionEvent(run, session, { id: 'brief', type: 'confirmBriefing' });
    dispatchMissionEvent(run, session, { id: 'entry', type: 'completeEntry' });
    dispatchMissionEvent(run, session, {
      id: 'combat',
      type: 'completeCombat',
      checkpoint: CHECKPOINT
    });
    const optional = getMissionBranchOptions(schedule).find((option) => !option.default)!;
    dispatchMissionEvent(run, session, {
      id: 'branch',
      type: 'selectBranch',
      optionId: optional.id
    });
    recordExpeditionBranchDecision(run, session, schedule.branch!.id, optional.id);

    const optionalNodeId = getMissionStage(schedule, schedule.optionalStageId!).nodeId!;
    expect(session.expedition.visitedNodeIds).toContain(optionalNodeId);
    expect(session.expedition.decisions).toEqual([
      { branchId: schedule.branch!.id, optionId: optional.id }
    ]);
    expect(session.mission.currentStageId).toBe(schedule.optionalStageId);
  });
});

function reachBranch(schedule: MissionSchedule): MissionDirectorState {
  let state = createMissionDirectorState(schedule);
  state = apply(schedule, state, { id: 'briefing', type: 'confirmBriefing' });
  state = apply(schedule, state, { id: 'entry', type: 'completeEntry' });
  return apply(schedule, state, {
    id: 'operation',
    type: 'completeCombat',
    checkpoint: CHECKPOINT
  });
}

function apply(
  schedule: MissionSchedule,
  state: MissionDirectorState,
  event: MissionEvent
): MissionDirectorState {
  const result = transitionMission(schedule, state, event);
  expect(result.disposition).toBe('advanced');
  return result.state;
}
