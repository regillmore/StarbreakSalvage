import { describe, expect, it } from 'vitest';

import { generateRunSkeleton } from '../../src/game/Generation';
import {
  applyCrewArcEvent,
  chooseCrewArcOption,
  createCrewArcCombatInfluence,
  createCrewArcState,
  createCrewArcRosterReadModel,
  formatCrewArcSummary,
  getCrewArcDefinition,
  validateCrewArcContent,
  validateCrewArcPlan,
  validateCrewArcState,
  type CrewArcPlanEntry,
  type CrewArcState
} from '../../src/game/CrewArc';
import { createCrewCombatProfile, createCrewRosterState } from '../../src/game/CrewCommand';
import {
  chooseCrewArcOption as chooseSessionCrewArcOption,
  createRunSession,
  recordCrewArcEvent
} from '../../src/game/RunSession';
import { createRunSnapshot, restoreRunSnapshot } from '../../src/game/RunSnapshot';

describe('CrewArc', () => {
  const run = generateRunSkeleton('CREW-ARC-KNOWN');
  const roster = allActiveRoster();

  it('generates ten deterministic, ordered multi-node arcs from validated content', () => {
    expect(validateCrewArcContent()).toEqual([]);
    expect(validateCrewArcPlan(run.crewArcs, run.crewRoster)).toEqual([]);
    expect(run.crewArcs.arcs).toHaveLength(10);
    expect(generateRunSkeleton('CREW-ARC-KNOWN').crewArcs).toEqual(run.crewArcs);
    for (const arc of run.crewArcs.arcs) {
      expect(arc.activationSectorIndex).toBeLessThan(arc.choiceSectorIndex);
      expect(arc.choiceSectorIndex).toBeLessThan(arc.resolutionSectorIndex);
    }
  });

  it('waits for an explicit accessible choice between the second and third outcome nodes', () => {
    const arc = run.crewArcs.arcs[0]!;
    const definition = getCrewArcDefinition(arc.definitionId);
    let state = createCrewArcState(run.crewArcs, run.crewRoster);
    state = advance(state, arc, 0);
    state = advance(state, arc, 1);
    expect(state.arcs.find((entry) => entry.arcId === arc.id)).toMatchObject({
      status: 'awaitingChoice',
      progress: 2
    });
    const choice = chooseCrewArcOption({
      plan: run.crewArcs,
      state,
      arcId: arc.id,
      optionId: definition.options[0].id,
      eventId: 'choice',
      sectorIndex: arc.choiceSectorIndex
    });
    expect(choice.disposition).toBe('applied');
    const duplicate = chooseCrewArcOption({
      plan: run.crewArcs,
      state: choice.state,
      arcId: arc.id,
      optionId: definition.options[0].id,
      eventId: 'choice',
      sectorIndex: arc.choiceSectorIndex
    });
    expect(duplicate.disposition).toBe('duplicate');
    state = advance(choice.state, arc, 2);
    expect(state.arcs.find((entry) => entry.arcId === arc.id)).toMatchObject({
      status: 'resolved',
      progress: 3,
      outcome: definition.options[0].outcome
    });
    expect(validateCrewArcState(run.crewArcs, state)).toEqual([]);
  });

  it('resolves promotion, departure, mutiny, rescue, and succession safely and deterministically', () => {
    for (const outcome of [
      'promotion',
      'departure',
      'mutiny',
      'rescue',
      'commandSuccession'
    ] as const) {
      const resolved = resolveOutcome(outcome);
      const arc = run.crewArcs.arcs.find((entry) =>
        getCrewArcDefinition(entry.definitionId).options.some(
          (option) => option.outcome === outcome
        )
      )!;
      expect(resolved.arcs.find((entry) => entry.arcId === arc.id)?.outcome).toBe(outcome);
      expect(validateCrewArcState(run.crewArcs, resolved)).toEqual([]);
    }
    expect(
      formatCrewArcSummary(run.crewArcs, resolveOutcome('commandSuccession'), run.crewRoster)
    ).toContain('successor');
  });

  it('turns rank, bonds, and conflicts into bounded tactical tradeoffs rather than free power', () => {
    const promotion = resolveOutcome('promotion');
    const promotionInfluence = createCrewArcCombatInfluence(run.crewArcs, promotion, roster);
    const promoted = Object.values(promotionInfluence.byCandidateId).find(
      (entry) => entry.rank !== 'specialist'
    );
    expect(promoted?.commandCostDelta).toBe(1);

    const bond = resolveOutcome('bond');
    const bondInfluence = createCrewArcCombatInfluence(run.crewArcs, bond, roster);
    const paired = Object.values(bondInfluence.byCandidateId).filter(
      (entry) => entry.fireDelayMultiplier < 1
    );
    expect(paired.length).toBeGreaterThanOrEqual(2);
    expect(paired.every((entry) => entry.hullDelta < 0)).toBe(true);

    const conflict = resolveOutcome('conflict');
    const conflictInfluence = createCrewArcCombatInfluence(run.crewArcs, conflict, roster);
    expect(conflictInfluence.excludedCandidateIds).toHaveLength(1);
    const profile = createCrewCombatProfile(run.crewRoster, roster, run.contracts[0]!.loadout, {
      arcInfluence: conflictInfluence
    });
    expect(
      profile.members.some((member) =>
        conflictInfluence.excludedCandidateIds.includes(member.candidateId)
      )
    ).toBe(false);
  });

  it('exposes roster relationships, altered fates, and pending choices in its read model', () => {
    const resolved = resolveOutcome('bond');
    const readout = createCrewArcRosterReadModel(run.crewArcs, resolved, run.crewRoster);
    expect(readout.knownArcs).toBeGreaterThan(0);
    expect(readout.resolvedArcs).toBe(1);
    expect(readout.relationships.join(' ')).toContain('bond');
    expect(readout.summary).toContain('resolved');
  });

  it('synchronizes resolved departure into the authoritative roster and run timeline', () => {
    const arc = run.crewArcs.arcs.find((entry) =>
      getCrewArcDefinition(entry.definitionId).options.some(
        (option) => option.outcome === 'departure'
      )
    )!;
    const definition = getCrewArcDefinition(arc.definitionId);
    const option = definition.options.find((entry) => entry.outcome === 'departure')!;
    const session = createRunSession(run, run.contracts[0]!);
    session.crewRoster = roster;
    for (const index of [0, 1] as const) {
      recordCrewArcEvent(run, session, {
        id: `session:${arc.id}:${index}`,
        source: definition.triggerSequence[index],
        sectorIndex: index === 0 ? arc.activationSectorIndex : arc.choiceSectorIndex,
        candidateIds: [arc.primaryCandidateId, arc.partnerCandidateId],
        positive: true,
        detail: `session node ${index}`
      });
    }
    chooseSessionCrewArcOption(run, session, arc.id, option.id, `session:${arc.id}:choice`);
    recordCrewArcEvent(run, session, {
      id: `session:${arc.id}:2`,
      source: definition.triggerSequence[2],
      sectorIndex: arc.resolutionSectorIndex,
      candidateIds: [arc.primaryCandidateId, arc.partnerCandidateId],
      positive: false,
      detail: 'departure resolved'
    });
    expect(session.crewArcs.fates[arc.primaryCandidateId]).toBe('departed');
    expect(
      session.crewRoster.members.find((member) => member.candidateId === arc.primaryCandidateId)
    ).toMatchObject({ status: 'departed' });
    expect(session.timeline.entries.some((entry) => entry.kind === 'arcOutcome')).toBe(true);
  });

  it('round-trips relationship history and fate through snapshot v11', () => {
    const session = createRunSession(run, run.contracts[0]!);
    session.crewRoster = roster;
    session.crewArcs = resolveOutcome('commandSuccession');
    const snapshot = createRunSnapshot({
      run,
      contract: run.contracts[0]!,
      session,
      target: 'sectorTransition',
      label: 'Crew decision'
    });
    expect(snapshot.version).toBe(12);
    expect(snapshot.extensions.crewArcs.planId).toBe(run.crewArcs.id);
    expect(restoreRunSnapshot(snapshot).session.crewArcs).toEqual(session.crewArcs);
  });

  function allActiveRoster() {
    const state = createCrewRosterState(run.crewRoster);
    return {
      ...state,
      members: state.members.map((member) => ({
        ...member,
        status: 'active' as const,
        trust: 4,
        recruitedSectorIndex: 0
      }))
    };
  }

  function advance(state: CrewArcState, arc: CrewArcPlanEntry, index: 0 | 1 | 2): CrewArcState {
    const definition = getCrewArcDefinition(arc.definitionId);
    const sectors = [arc.activationSectorIndex, arc.choiceSectorIndex, arc.resolutionSectorIndex];
    return applyCrewArcEvent({
      plan: run.crewArcs,
      state,
      rosterPlan: run.crewRoster,
      rosterState: roster,
      event: {
        id: `${arc.id}:${index}:${state.history.length}`,
        source: definition.triggerSequence[index],
        sectorIndex: sectors[index]!,
        candidateIds: [arc.primaryCandidateId, arc.partnerCandidateId],
        positive: true,
        detail: `test node ${index}`
      }
    }).state;
  }

  function resolveOutcome(outcome: string): CrewArcState {
    const arc = run.crewArcs.arcs.find((entry) =>
      getCrewArcDefinition(entry.definitionId).options.some((option) => option.outcome === outcome)
    )!;
    const definition = getCrewArcDefinition(arc.definitionId);
    const option = definition.options.find((entry) => entry.outcome === outcome)!;
    let state = createCrewArcState(run.crewArcs, run.crewRoster);
    state = advance(state, arc, 0);
    state = advance(state, arc, 1);
    state = chooseCrewArcOption({
      plan: run.crewArcs,
      state,
      arcId: arc.id,
      optionId: option.id,
      eventId: `${arc.id}:choice`,
      sectorIndex: arc.choiceSectorIndex
    }).state;
    return advance(state, arc, 2);
  }
});
