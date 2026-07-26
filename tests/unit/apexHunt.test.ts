import { describe, expect, it } from 'vitest';

import { APEX_THREATS } from '../../src/content/apexThreats';
import { getItemById } from '../../src/content/items';
import {
  MAX_APEX_HAZARD_PRESSURE,
  MAX_APEX_REINFORCEMENTS,
  applyApexHuntEvent,
  createApexCampaignReadModel,
  createApexEncounterReadModel,
  createApexFinaleProfile,
  createApexHuntState,
  createApexPursuitNavigationReadModel,
  getApexEncounterForNode,
  normalizeLegacyApexBountyState,
  validateApexContent,
  validateApexHuntPlan,
  validateApexHuntState
} from '../../src/game/ApexHunt';
import { generateRunSkeleton } from '../../src/game/Generation';
import { advanceSector, createRunSession, recordApexHuntEvent } from '../../src/game/RunSession';
import { getNextActRouteSectorIndices } from '../../src/game/ActRouteGraph';

const loadedContext = {
  alliedFronts: 2,
  hostileFronts: 1,
  resolvedRivals: 1,
  crewBonds: 2,
  crewOfficers: 1,
  carrierSupport: 2,
  fleetSupport: 2
};

describe('ApexHunt', () => {
  it('assigns two exclusive live circuit spoils to each apex', () => {
    const rewardItemIds = APEX_THREATS.flatMap((threat) => threat.circuitRewardItemIds);

    expect(APEX_THREATS.map((threat) => threat.circuitRewardItemIds)).toHaveLength(3);
    expect(rewardItemIds).toHaveLength(6);
    expect(new Set(rewardItemIds).size).toBe(6);
    for (const itemId of rewardItemIds) {
      const item = getItemById(itemId);
      expect(item.metadata.sources).toEqual(['apex']);
      expect(item.metadata.uiTags).toContain('apex');
      expect(item.metadata.implementationStatus).toBe('live');
    }
  });

  it('generates three deterministic, structurally distinct multi-node pursuits', () => {
    const first = generateRunSkeleton('APEX-PLAN').apexHunts;
    const second = generateRunSkeleton('APEX-PLAN').apexHunts;
    expect(first).toEqual(second);
    expect(first.threats).toHaveLength(3);
    expect(new Set(first.threats.map((threat) => threat.definitionId)).size).toBe(3);
    expect(first.threats.every((threat) => threat.encounters.length === 4)).toBe(true);
    expect(first.threats.map((threat) => threat.pursuit.actId)).toEqual([
      'act_outer_rim',
      'act_core_descent',
      'act_null_frontier'
    ]);
    expect(
      first.threats.every(
        (threat) =>
          threat.encounters.at(-1)?.routeNodeLabel.startsWith('4') &&
          threat.encounters.every((encounter) => encounter.operationalRole === 'gate')
      )
    ).toBe(true);
    const nodeKeys = first.threats.flatMap((threat) =>
      threat.encounters.map((encounter) => `${encounter.sectorIndex}:${encounter.operationalRole}`)
    );
    expect(new Set(nodeKeys).size).toBe(nodeKeys.length);
    expect(validateApexHuntPlan(first)).toEqual([]);
    expect(validateApexContent()).toEqual([]);
  });

  it('reveals one seeded constellation signal only after the preceding pursuit step', () => {
    const run = generateRunSkeleton('APEX-TRACK-REVEAL');
    const hunt = run.apexHunts.threats[0]!;
    const [trace, ambush, lieutenant] = hunt.encounters;
    let state = createApexHuntState(run.apexHunts);

    expect(
      createApexPursuitNavigationReadModel(run.apexHunts, state, trace!.sectorIndex)
        ?.revealedNextSectorIndex
    ).toBeNull();
    expect(
      getApexEncounterForNode(run.apexHunts, state, {
        sectorIndex: ambush!.sectorIndex,
        operationalRole: 'gate'
      })
    ).toBeNull();

    state = applyApexHuntEvent(run.apexHunts, state, {
      id: 'track-reveal:trace',
      type: 'encounterOutcome',
      threatId: hunt.definitionId,
      encounterId: trace!.id,
      stage: trace!.stage,
      sectorIndex: trace!.sectorIndex,
      outcome: 'success'
    }).state;

    const revealed = createApexPursuitNavigationReadModel(
      run.apexHunts,
      state,
      trace!.sectorIndex
    );
    expect(revealed).toMatchObject({
      revealedNextSectorIndex: ambush!.sectorIndex,
      totalSteps: 4
    });
    expect(revealed?.summary).toContain(ambush!.routeNodeLabel);
    expect(
      getApexEncounterForNode(run.apexHunts, state, {
        sectorIndex: ambush!.sectorIndex,
        operationalRole: 'gate'
      })?.id
    ).toBe(ambush!.id);
    expect(
      getApexEncounterForNode(run.apexHunts, state, {
        sectorIndex: lieutenant!.sectorIndex,
        operationalRole: 'gate'
      })
    ).toBeNull();
  });

  it('keeps a completed pursuit on its revealed child and lets the apex escape off-track', () => {
    const run = generateRunSkeleton('APEX-TRACK-BRANCH');
    const hunt = run.apexHunts.threats[0]!;
    const [trace, ambush] = hunt.encounters;
    const createTrackedSession = () => {
      const session = createRunSession(run, run.contracts[0]!);
      recordApexHuntEvent(run, session, {
        id: `track-branch:${session.timeline.entries.length}`,
        type: 'encounterOutcome',
        threatId: hunt.definitionId,
        encounterId: trace!.id,
        stage: trace!.stage,
        sectorIndex: trace!.sectorIndex,
        outcome: 'success'
      });
      return session;
    };

    const onTrack = createTrackedSession();
    expect(advanceSector(run, onTrack, ambush!.sectorIndex)).toBe(true);
    expect(
      onTrack.apexHunts.threats.find((threat) => threat.threatId === hunt.definitionId)?.status
    ).not.toBe('escaped');

    const sibling = getNextActRouteSectorIndices(
      run.actRouteGraph,
      trace!.sectorIndex
    ).find((sectorIndex) => sectorIndex !== ambush!.sectorIndex)!;
    const offTrack = createTrackedSession();
    expect(advanceSector(run, offTrack, sibling)).toBe(true);
    expect(
      offTrack.apexHunts.threats.find((threat) => threat.threatId === hunt.definitionId)?.status
    ).toBe('escaped');
    expect(offTrack.apexHunts.history.at(-1)?.label).toContain('escaped the pursuit corridor');

    const missedStep = createRunSession(run, run.contracts[0]!);
    expect(advanceSector(run, missedStep, ambush!.sectorIndex)).toBe(true);
    expect(
      missedStep.apexHunts.threats.find(
        (threat) => threat.threatId === hunt.definitionId
      )?.status
    ).toBe('escaped');
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

  it('keeps the finale profile focused on combat pressure instead of disposition routes', () => {
    const plan = generateRunSkeleton('APEX-COMBAT-PROFILE').apexHunts;
    const state = createApexHuntState(plan);
    const profile = createApexFinaleProfile({
      plan,
      state,
      threatId: plan.threats[0]!.definitionId,
      context: loadedContext
    });

    expect(profile.pressure).toHaveLength(4);
    expect(profile).not.toHaveProperty('options');
    expect(profile).not.toHaveProperty('readyOptions');
  });

  it('settles restored pre-bounty resolution state as a claimed kill', () => {
    const plan = generateRunSkeleton('APEX-LEGACY-SETTLEMENT').apexHunts;
    const state = createApexHuntState(plan);
    const legacy = {
      ...state,
      threats: state.threats.map((threat, index) =>
        index === 0 ? { ...threat, status: 'awaitingResolution' as const } : threat
      )
    };

    const normalized = normalizeLegacyApexBountyState(legacy);
    expect(legacy.threats[0]!.status).toBe('awaitingResolution');
    expect(normalized.threats[0]!.status).toBe('resolved');
    expect(validateApexHuntState(plan, normalized)).toEqual([]);
  });

  it('presents named contacts, plain-language state, and explained evidence', () => {
    const plan = generateRunSkeleton('APEX-READ-MODEL').apexHunts;
    const hunt = plan.threats[0]!;
    const encounter = hunt.encounters[0]!;
    let state = createApexHuntState(plan);
    state = applyApexHuntEvent(plan, state, {
      id: 'read-model-trace',
      type: 'encounterOutcome',
      threatId: hunt.definitionId,
      encounterId: encounter.id,
      stage: encounter.stage,
      sectorIndex: encounter.sectorIndex,
      outcome: 'success'
    }).state;

    const campaign = createApexCampaignReadModel(plan, state, encounter.sectorIndex);
    const threat = campaign.threats.find((candidate) => candidate.id === hunt.definitionId)!;
    const contact = createApexEncounterReadModel(encounter);

    expect(campaign.summary).toContain('Current track');
    expect(threat.statusLabel).toBe('Hunt progressing');
    expect(threat.integrityDetail).toContain('integrity stripped');
    expect(threat.subsystems).toHaveLength(3);
    expect(threat.evidence.find((entry) => entry.id === 'traces')).toMatchObject({
      value: '1',
      detail: 'Recovered traces keep the pursuit locked onto the target.'
    });
    expect(threat.contacts[0]).toMatchObject({ status: 'resolved', statusLabel: 'Contact resolved' });
    expect(contact.banner).toContain('APEX CONTACT');
    expect(contact.payoff).toContain('Success');
  });

  it('claims a bounty atomically at the successful finale and returns its variety unlock', () => {
    const plan = generateRunSkeleton('APEX-RESOLVE').apexHunts;
    const hunt = plan.threats[0]!;
    const finale = hunt.encounters.at(-1)!;
    let state = createApexHuntState(plan);
    for (const encounter of hunt.encounters.slice(0, -1)) {
      state = applyApexHuntEvent(plan, state, {
        id: `resolve-track:${encounter.id}`,
        type: 'encounterOutcome',
        threatId: hunt.definitionId,
        encounterId: encounter.id,
        stage: encounter.stage,
        sectorIndex: encounter.sectorIndex,
        outcome: 'success'
      }).state;
    }
    const resolved = applyApexHuntEvent(plan, state, {
      id: 'resolution', type: 'encounterOutcome', threatId: hunt.definitionId,
      encounterId: finale.id, stage: 'finale', sectorIndex: finale.sectorIndex, outcome: 'success'
    });
    expect(resolved.state.threats[0]).toMatchObject({ status: 'resolved' });
    expect(resolved.label).toContain('bounty claimed');
    expect(resolved.rewardUnlockId).toMatch(/^unlock_/);
    expect(applyApexHuntEvent(plan, resolved.state, {
      id: 'resolution-2', type: 'encounterOutcome', threatId: hunt.definitionId,
      encounterId: finale.id, stage: 'finale', sectorIndex: finale.sectorIndex, outcome: 'success'
    }).disposition).toBe('rejected');
  });

  it('maps itinerary contacts and records a missed finale escape', () => {
    const run = generateRunSkeleton('APEX-ESCAPE');
    const hunt = run.apexHunts.threats[0]!;
    const encounter = hunt.encounters[0]!;
    const initialState = createApexHuntState(run.apexHunts);
    expect(getApexEncounterForNode(run.apexHunts, initialState, {
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
