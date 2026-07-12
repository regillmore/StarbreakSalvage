import { describe, expect, it } from 'vitest';

import { APEX_OUTCOMES } from '../../src/content/apexThreats';
import {
  MAX_APEX_HAZARD_PRESSURE,
  MAX_APEX_REINFORCEMENTS,
  applyApexHuntEvent,
  createApexFinaleProfile,
  createApexHuntPlan,
  createApexHuntState,
  getApexEncounterForNode,
  validateApexContent,
  validateApexHuntPlan,
  validateApexHuntState
} from '../../src/game/ApexHunt';
import { generateRunSkeleton } from '../../src/game/Generation';
import { advanceSector, createRunSession, recordApexHuntEvent } from '../../src/game/RunSession';

const loadedContext = {
  alliedFronts: 2,
  hostileFronts: 1,
  resolvedRivals: 1,
  crewBonds: 2,
  crewOfficers: 1,
  carrierSupport: 2,
  boardingCapacity: 1,
  fleetSupport: 2,
  fleetBoardingAssist: 1,
  frontierDecision: 'breach' as const
};

describe('ApexHunt', () => {
  it('generates three deterministic, structurally distinct multi-node pursuits', () => {
    const first = createApexHuntPlan({ seed: 'APEX-PLAN', saveFingerprint: 'fresh', sectorCount: 14 });
    const second = createApexHuntPlan({ seed: 'APEX-PLAN', saveFingerprint: 'fresh', sectorCount: 14 });
    expect(first).toEqual(second);
    expect(first.threats).toHaveLength(3);
    expect(new Set(first.threats.map((threat) => threat.definitionId)).size).toBe(3);
    expect(first.threats.every((threat) => threat.encounters.length === 4)).toBe(true);
    const nodeKeys = first.threats.flatMap((threat) =>
      threat.encounters.map((encounter) => `${encounter.sectorIndex}:${encounter.operationalRole}`)
    );
    expect(new Set(nodeKeys).size).toBe(nodeKeys.length);
    expect(validateApexHuntPlan(first)).toEqual([]);
    expect(validateApexContent()).toEqual([]);
  });

  it('carries encounter and boarding damage into a later bounded finale', () => {
    const run = generateRunSkeleton('APEX-WOUNDS');
    const hunt = run.apexHunts.threats[0]!;
    const trace = hunt.encounters[0]!;
    let state = createApexHuntState(run.apexHunts);
    state = applyApexHuntEvent(run.apexHunts, state, {
      id: 'trace', type: 'encounterOutcome', threatId: hunt.definitionId,
      encounterId: trace.id, stage: trace.stage, sectorIndex: trace.sectorIndex, outcome: 'success'
    }).state;
    state = applyApexHuntEvent(run.apexHunts, state, {
      id: 'sabotage', type: 'boardingSabotage', threatId: hunt.definitionId,
      sectorIndex: trace.sectorIndex, amount: 3
    }).state;
    const threat = state.threats.find((entry) => entry.threatId === hunt.definitionId)!;
    const profile = createApexFinaleProfile({
      plan: run.apexHunts, state, threatId: hunt.definitionId, context: loadedContext
    });
    expect(threat.integrity).toBeLessThan(12);
    expect(threat.subsystems.propulsion).toBeLessThan(4);
    expect(threat.subsystems.core).toBeLessThan(4);
    expect(profile.bossHullDelta).toBeLessThan(0);
    expect(profile.reinforcementCount).toBeLessThanOrEqual(MAX_APEX_REINFORCEMENTS);
    expect(profile.hazardPressure).toBeLessThanOrEqual(MAX_APEX_HAZARD_PRESSURE);
    expect(validateApexHuntState(run.apexHunts, state)).toEqual([]);
  });

  it('exposes all five risk-bearing outcomes across the three finales', () => {
    const plan = createApexHuntPlan({ seed: 'APEX-ENDINGS', saveFingerprint: 'fresh', sectorCount: 14 });
    const state = createApexHuntState(plan);
    const outcomes = new Set(
      plan.threats.flatMap((threat) =>
        createApexFinaleProfile({ plan, state, threatId: threat.definitionId, context: loadedContext })
          .options.filter((option) => option.available)
          .map((option) => option.outcome)
      )
    );
    expect(outcomes).toEqual(new Set(APEX_OUTCOMES));
  });

  it('settles a finale once and returns its variety unlock', () => {
    const plan = createApexHuntPlan({ seed: 'APEX-RESOLVE', saveFingerprint: 'fresh', sectorCount: 14 });
    const hunt = plan.threats[0]!;
    const finale = hunt.encounters.at(-1)!;
    let state = createApexHuntState(plan);
    state = applyApexHuntEvent(plan, state, {
      id: 'finale', type: 'encounterOutcome', threatId: hunt.definitionId,
      encounterId: finale.id, stage: 'finale', sectorIndex: finale.sectorIndex, outcome: 'success'
    }).state;
    const option = createApexFinaleProfile({
      plan, state, threatId: hunt.definitionId, context: loadedContext
    }).options.find((entry) => entry.available)!;
    const resolved = applyApexHuntEvent(plan, state, {
      id: 'resolution', type: 'resolve', threatId: hunt.definitionId,
      sectorIndex: finale.sectorIndex, outcome: option.outcome
    });
    expect(resolved.state.threats[0]).toMatchObject({ status: 'resolved', outcome: option.outcome });
    expect(resolved.rewardUnlockId).toMatch(/^unlock_/);
    expect(applyApexHuntEvent(plan, resolved.state, {
      id: 'resolution-2', type: 'resolve', threatId: hunt.definitionId,
      sectorIndex: finale.sectorIndex, outcome: option.outcome
    }).disposition).toBe('rejected');
  });

  it('maps itinerary contacts and records a missed finale escape', () => {
    const run = generateRunSkeleton('APEX-ESCAPE');
    const hunt = run.apexHunts.threats[0]!;
    const encounter = hunt.encounters[0]!;
    expect(getApexEncounterForNode(run.apexHunts, {
      sectorIndex: encounter.sectorIndex, operationalRole: encounter.operationalRole
    })?.id).toBe(encounter.id);

    const session = createRunSession(run, run.contracts[0]!);
    const finale = hunt.encounters.at(-1)!;
    session.currentSectorIndex = finale.sectorIndex;
    advanceSector(run, session);
    expect(session.apexHunts.threats.find(
      (threat) => threat.threatId === hunt.definitionId
    )?.status).toBe('escaped');
    expect(session.timeline.entries.some((entry) => entry.kind === 'apex:escape')).toBe(true);
  });

  it('deduplicates public session events', () => {
    const run = generateRunSkeleton('APEX-SESSION');
    const session = createRunSession(run, run.contracts[0]!);
    const hunt = run.apexHunts.threats[0]!;
    const event = {
      id: 'session-apex', type: 'boardingSabotage' as const,
      threatId: hunt.definitionId, sectorIndex: 1, amount: 2
    };
    expect(recordApexHuntEvent(run, session, event).disposition).toBe('applied');
    expect(recordApexHuntEvent(run, session, event).disposition).toBe('duplicate');
    expect(session.timeline.entries.filter(
      (entry) => entry.kind === 'apex:boardingSabotage'
    )).toHaveLength(1);
  });
});
