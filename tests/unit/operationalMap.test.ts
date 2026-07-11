import { describe, expect, it } from 'vitest';

import { generateRunSkeleton } from '../../src/game/Generation';
import {
  createOperationalMapReadModel,
  createOperationalProgressState,
  getOperationalInfluence,
  recordOperationBoundary,
  validateOperationalProgressState
} from '../../src/game/OperationalMap';
import { createMissionSchedule, getMissionStage } from '../../src/game/MissionDirector';
import {
  aggregateCombatRunResults,
  createRunSession,
  dispatchMissionEvent,
  recordExpeditionBranchDecision,
  recordMissionOperationBoundary
} from '../../src/game/RunSession';

const CHECKPOINT = {
  hull: 3,
  scrollDistance: 720,
  worldOffset: 11_200,
  credits: 30,
  salvage: 8
};

describe('OperationalMap', () => {
  it('aggregates operation results for run summaries without losing gate outcomes', () => {
    const advance = {
      reason: 'sectorComplete' as const,
      survivedSeconds: 20,
      distanceTraveled: 600,
      sectorLength: 600,
      credits: 4,
      salvage: 1,
      enemiesDestroyed: 8,
      bossesDefeated: 0,
      shotsFired: 30,
      pickupsCollected: 2,
      damageTaken: 1,
      itemTriggers: 3,
      itemNames: ['Split Prism']
    };
    const gate = {
      ...advance,
      survivedSeconds: 35,
      distanceTraveled: 800,
      credits: 6,
      salvage: 2,
      enemiesDestroyed: 12,
      bossesDefeated: 1,
      itemTriggers: 5,
      itemNames: ['Split Prism', 'Debt Coil']
    };
    expect(aggregateCombatRunResults(advance, gate)).toMatchObject({
      survivedSeconds: 55,
      distanceTraveled: 1400,
      credits: 10,
      salvage: 3,
      enemiesDestroyed: 20,
      bossesDefeated: 1,
      itemTriggers: 8,
      itemNames: ['Split Prism', 'Debt Coil']
    });
  });

  it('builds the same public two-to-four-operation itinerary from the same seed', () => {
    const firstRun = generateRunSkeleton('OPERATIONAL-MAP-PLAN');
    const secondRun = generateRunSkeleton('OPERATIONAL-MAP-PLAN');
    const firstSession = createRunSession(firstRun, firstRun.contracts[0]!);
    const secondSession = createRunSession(secondRun, secondRun.contracts[0]!);
    const first = createOperationalMapReadModel({
      graph: firstRun.expedition,
      sectorIndex: 0,
      expedition: firstSession.expedition,
      operational: firstSession.operational,
      currentNodeId: firstRun.expedition.startNodeId
    });
    const second = createOperationalMapReadModel({
      graph: secondRun.expedition,
      sectorIndex: 0,
      expedition: secondSession.expedition,
      operational: secondSession.operational,
      currentNodeId: secondRun.expedition.startNodeId
    });

    expect(second).toEqual(first);
    expect(first.operationRange).toBe('2 required / up to 4 with detour and pursuit');
    expect(first.nodes.map((node) => node.role)).toEqual([
      'ingress',
      'advance',
      'detour',
      'staging',
      'gate',
      'pursuit',
      'extraction'
    ]);
    expect(first.nodes.filter((node) => node.optional)).toHaveLength(2);
    expect(
      first.nodes.every(
        (node) =>
          node.timeEstimate.includes('sec') &&
          node.reward.length > 0 &&
          node.consequence.length > 0 &&
          node.risks.includes('Faction')
      )
    ).toBe(true);
  });

  it('settles an operation boundary and its payout exactly once with explicit cleanup', () => {
    const run = generateRunSkeleton('OPERATIONAL-BOUNDARY-IDEMPOTENCE');
    const session = createRunSession(run, run.contracts[0]!);
    const detour = run.expedition.nodes.find((node) => node.operationalRole === 'detour')!;
    const startingSalvage = session.salvage;
    const first = recordMissionOperationBoundary(session, {
      id: 'detour-settled',
      node: detour,
      outcome: 'success',
      checkpoint: CHECKPOINT
    });
    const duplicate = recordMissionOperationBoundary(session, {
      id: 'detour-settled',
      node: detour,
      outcome: 'success',
      checkpoint: CHECKPOINT
    });

    expect(first).toMatchObject({
      disposition: 'applied',
      salvageAwarded: 1,
      consequence: 'gateSupport'
    });
    expect(duplicate.disposition).toBe('duplicate');
    expect(session.salvage).toBe(startingSalvage + 1);
    expect(session.operational.history).toHaveLength(1);
    expect(session.operational.history[0]?.cleanup).toEqual({
      retainedActors: 0,
      retainedProjectiles: 0,
      retainedHooks: 0,
      rewardSettled: true
    });
    expect(validateOperationalProgressState(run.expedition, session.operational)).toEqual([]);
  });

  it('turns optional outcomes into deterministic later-operation pressure', () => {
    const run = generateRunSkeleton('OPERATIONAL-CONSEQUENCES');
    const detour = run.expedition.nodes.find((node) => node.operationalRole === 'detour')!;
    const pursuit = run.expedition.nodes.find((node) => node.operationalRole === 'pursuit')!;
    let state = createOperationalProgressState();
    state = recordOperationBoundary(state, {
      id: 'detour',
      node: detour,
      outcome: 'success',
      checkpoint: CHECKPOINT
    }).state;
    state = recordOperationBoundary(state, {
      id: 'pursuit',
      node: pursuit,
      outcome: 'partialSuccess',
      checkpoint: CHECKPOINT
    }).state;

    expect(getOperationalInfluence(state, 0, 'gate')).toMatchObject({
      waveCountScale: 0.8,
      scrollLengthScale: 0.9
    });
    expect(getOperationalInfluence(state, 1, 'advance')).toMatchObject({
      waveCountScale: 1.2,
      scrollLengthScale: 1.12
    });
    expect(getOperationalInfluence(state, 1, 'gate')).toBeUndefined();
  });

  it('replays both optional decisions into four live combat operations', () => {
    const run = generateRunSkeleton('OPERATIONAL-FOUR-OPS');
    const session = createRunSession(run, run.contracts[0]!);
    const schedule = createMissionSchedule(run.expedition, 0);
    dispatchMissionEvent(run, session, { id: 'brief', type: 'confirmBriefing' });
    dispatchMissionEvent(run, session, { id: 'entry', type: 'completeEntry' });
    const visitedRoles: string[] = [];

    for (let operation = 0; operation < 4; operation += 1) {
      const stage = getMissionStage(schedule, session.mission.currentStageId);
      visitedRoles.push(stage.operationalRole ?? 'none');
      dispatchMissionEvent(run, session, {
        id: `combat-${operation}`,
        type: 'completeCombat',
        checkpoint: CHECKPOINT
      });
      if (operation === 0 || operation === 2) {
        const branchStage = getMissionStage(schedule, session.mission.currentStageId);
        const branch = schedule.branches.find(
          (candidate) => candidate.id === branchStage.branchId
        )!;
        const optional = branch.options.find((option) => !option.default)!;
        dispatchMissionEvent(run, session, {
          id: `branch-${operation}`,
          type: 'selectBranch',
          optionId: optional.id
        });
        recordExpeditionBranchDecision(run, session, branch.id, optional.id);
      } else if (operation === 1) {
        dispatchMissionEvent(run, session, { id: 'staging', type: 'completeRelief' });
      }
    }

    expect(visitedRoles).toEqual(['advance', 'detour', 'gate', 'pursuit']);
    expect(session.expedition.decisions).toHaveLength(2);
    expect(getMissionStage(schedule, session.mission.currentStageId).kind).toBe('relief');
  });

  it('settles and replays all sixty fifteen-sector operation boundaries without accumulation', () => {
    const run = generateRunSkeleton('OPERATIONAL-ENDURANCE');
    const operationNodes = run.expedition.nodes.filter((node) =>
      ['advance', 'detour', 'gate', 'pursuit'].includes(node.operationalRole)
    );
    let state = createOperationalProgressState();
    let salvageAwarded = 0;
    for (const node of operationNodes) {
      const result = recordOperationBoundary(state, {
        id: `settled:${node.id}`,
        node,
        outcome: 'success',
        checkpoint: CHECKPOINT
      });
      state = result.state;
      salvageAwarded += result.salvageAwarded;
    }
    let replayAwarded = 0;
    for (const node of operationNodes) {
      const result = recordOperationBoundary(state, {
        id: `settled:${node.id}`,
        node,
        outcome: 'success',
        checkpoint: CHECKPOINT
      });
      state = result.state;
      replayAwarded += result.salvageAwarded;
    }

    expect(operationNodes).toHaveLength(60);
    expect(state.history).toHaveLength(60);
    expect(state.processedOperationIds).toHaveLength(60);
    expect(salvageAwarded).toBe(45);
    expect(replayAwarded).toBe(0);
    expect(state.history.every((record) => record.cleanup.rewardSettled)).toBe(true);
    expect(validateOperationalProgressState(run.expedition, state)).toEqual([]);
  });
});
