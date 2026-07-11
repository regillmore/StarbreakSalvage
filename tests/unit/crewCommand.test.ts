import { describe, expect, it } from 'vitest';

import { CREW_ROLES } from '../../src/content/crew';
import {
  applyCrewRosterEvent,
  createCrewCombatProfile,
  createCrewRosterPlan,
  createCrewRosterState,
  createDebugCrewRosterState,
  getCrewFoundryAssist,
  getRecruitableCrewCandidate,
  recoverEligibleCrew,
  validateCrewContent
} from '../../src/game/CrewCommand';
import { generateRunSkeleton } from '../../src/game/Generation';

describe('CrewCommand', () => {
  it('validates distinct tactical roles and rejects broken budgets', () => {
    expect(validateCrewContent()).toEqual([]);
    expect(CREW_ROLES).toHaveLength(5);
    expect(new Set(CREW_ROLES.map((role) => role.preferredCommand)).size).toBe(5);
    expect(
      validateCrewContent({
        roles: [{ ...CREW_ROLES[0]!, commandCost: 0, cue: { ...CREW_ROLES[0]!.cue, glyph: '' } }]
      })
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining('invalid command cost'),
        expect.stringContaining('incomplete non-color cue'),
        expect.stringContaining('At least four crew roles')
      ])
    );
  });

  it('generates the same identities from seed plus save fingerprint', () => {
    const options = { seed: 'CREW-KNOWN', saveFingerprint: 'fresh', sectorCount: 10 };
    const first = createCrewRosterPlan(options);
    const second = createCrewRosterPlan(options);
    const progressed = createCrewRosterPlan({ ...options, saveFingerprint: 'upgraded' });

    expect(first).toEqual(second);
    expect(first).not.toEqual(progressed);
    expect(new Set(first.candidates.map((candidate) => candidate.roleId)).size).toBe(5);
    expect(first.candidates.every((candidate) => candidate.name && candidate.callsign)).toBe(true);
  });

  it('acquires candidates only through eligible consequence and command capacity', () => {
    const plan = createCrewRosterPlan({
      seed: 'CREW-RECRUIT',
      saveFingerprint: 'fresh',
      sectorCount: 10
    });
    let state = createCrewRosterState(plan);
    const candidate = getRecruitableCrewCandidate(plan, state, {
      sectorIndex: 8,
      crewPolicy: 'recordCandidate',
      factionId: plan.candidates[0]!.factionId,
      factionSignal: false,
      commandHeadroom: 4
    });
    expect(candidate).not.toBeNull();

    const rejected = applyCrewRosterEvent(plan, state, {
      id: 'recruit-too-small',
      type: 'recruit',
      sectorIndex: 4,
      candidateId: candidate!.id,
      commandHeadroom: 0,
      source: 'invalid free grant'
    });
    expect(rejected.disposition).toBe('rejected');

    const recruited = applyCrewRosterEvent(plan, state, {
      id: 'recruit-rescue',
      type: 'recruit',
      sectorIndex: 4,
      candidateId: candidate!.id,
      commandHeadroom: 4,
      source: 'distress rescue manifest'
    });
    state = recruited.state;
    expect(recruited.disposition).toBe('applied');
    expect(state.members.find((member) => member.candidateId === candidate!.id)).toMatchObject({
      status: 'active',
      trust: 3
    });
  });

  it('tracks trust, injury, deterministic recovery, and departure', () => {
    const plan = createCrewRosterPlan({
      seed: 'CREW-OUTCOMES',
      saveFingerprint: 'fresh',
      sectorCount: 10
    });
    const candidate = plan.candidates[0]!;
    let state = applyCrewRosterEvent(plan, createCrewRosterState(plan), {
      id: 'recruit',
      type: 'recruit',
      sectorIndex: 2,
      candidateId: candidate.id,
      commandHeadroom: 9,
      source: 'rescue'
    }).state;
    state = applyCrewRosterEvent(plan, state, {
      id: 'injury',
      type: 'combatOutcome',
      sectorIndex: 3,
      candidateId: candidate.id,
      injured: true,
      retreated: false,
      enemiesDefeated: 2,
      salvageRecovered: 3
    }).state;
    expect(state.members[0]).toMatchObject({
      status: 'injured',
      recoverySectorIndex: 5,
      injuries: 1
    });
    expect(recoverEligibleCrew(plan, state, 4).members[0]?.status).toBe('injured');
    state = recoverEligibleCrew(plan, state, 5);
    expect(state.members[0]).toMatchObject({ status: 'active', recoverySectorIndex: null });

    for (let index = 0; index < 2; index += 1) {
      state = applyCrewRosterEvent(plan, state, {
        id: `failure-${index}`,
        type: 'missionOutcome',
        sectorIndex: 6 + index,
        outcome: 'failure',
        crewPolicy: 'protectSpecialist'
      }).state;
    }
    expect(state.members[0]?.status).toBe('departed');
  });

  it('resolves frame/module fit, bounded deployment, and foundry assistance', () => {
    const run = generateRunSkeleton('CREW-FIT');
    const state = createDebugCrewRosterState(run.crewRoster);
    const profile = createCrewCombatProfile(run.crewRoster, state, run.contracts[0]!.loadout);

    expect(profile.members.length).toBeLessThanOrEqual(3);
    expect(profile.commandUsed).toBeLessThanOrEqual(profile.commandHeadroom);
    expect(profile.members.every((member) => member.fitLabel.length > 0)).toBe(true);

    const assistCandidate = run.crewRoster.candidates.find(
      (candidate) => candidate.roleId === 'crew_engineer' || candidate.roleId === 'crew_salvager'
    )!;
    const assistState = applyCrewRosterEvent(
      run.crewRoster,
      createCrewRosterState(run.crewRoster),
      {
        id: 'assist-recruit',
        type: 'recruit',
        sectorIndex: 4,
        candidateId: assistCandidate.id,
        commandHeadroom: 9,
        source: 'specialist rescue'
      }
    ).state;
    expect(getCrewFoundryAssist(run.crewRoster, assistState)).toMatchObject({ salvageBonus: 1 });
  });

  it('bounds event and presentation history', () => {
    const plan = createCrewRosterPlan({
      seed: 'CREW-BOUNDS',
      saveFingerprint: 'fresh',
      sectorCount: 10
    });
    let state = createDebugCrewRosterState(plan);
    for (let index = 0; index < 150; index += 1) {
      state = applyCrewRosterEvent(plan, state, {
        id: `history-${index}`,
        type: 'missionOutcome',
        sectorIndex: index,
        outcome: 'success',
        crewPolicy: 'none'
      }).state;
    }
    expect(state.history).toHaveLength(64);
    expect(state.processedEventIds).toHaveLength(128);
  });
});
