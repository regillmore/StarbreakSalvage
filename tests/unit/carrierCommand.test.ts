import { describe, expect, it } from 'vitest';

import { CARRIERS, CARRIER_FACILITIES } from '../../src/content/carriers';
import { validateContent } from '../../src/content/contentValidation';
import {
  createCarrierCommandOptions,
  createCarrierInfluence,
  resolveCarrierTransit,
  stowCarrierCargo
} from '../../src/game/CarrierCommand';
import { generateRunSkeleton } from '../../src/game/Generation';
import {
  applyCarrierCommand as applySessionCarrierCommand,
  advanceSector,
  createRunSession
} from '../../src/game/RunSession';
import { createRunSnapshot, restoreRunSnapshot } from '../../src/game/RunSnapshot';
import { createCrewCombatProfile, createDebugCrewRosterState } from '../../src/game/CrewCommand';

describe('CarrierCommand', () => {
  it('generates a deterministic limited-slot carrier from seed and save state', () => {
    const first = generateRunSkeleton('CARRIER-DETERMINISM');
    const second = generateRunSkeleton('CARRIER-DETERMINISM');
    expect(first.carrierPlan).toEqual(second.carrierPlan);
    expect(first.carrierPlan.facilitySlots).toBe(4);
    expect(first.carrierPlan.startingFacilities).toHaveLength(4);
    expect(new Set(first.carrierPlan.startingFacilities).size).toBe(4);
    expect(CARRIERS.map((carrier) => carrier.id)).toContain(first.carrierPlan.carrierId);
  });

  it('offers one concise command action per sector and applies resource costs idempotently', () => {
    const run = generateRunSkeleton('CARRIER-COMMANDS');
    const session = createRunSession(run, run.contracts[0]!);
    session.salvage = 20;
    const commandOptions = createCarrierCommandOptions({
      plan: run.carrierPlan,
      state: session.carrier,
      crewPlan: run.crewRoster,
      crewState: session.crewRoster,
      sectorIndex: 0
    });
    expect(commandOptions.map((option) => option.command.kind)).toEqual(
      expect.arrayContaining(['repairFacility', 'reroutePower', 'setPosture', 'replaceFacility'])
    );
    const repair = commandOptions.find((option) => option.command.kind === 'repairFacility')!;
    const first = applySessionCarrierCommand(run, session, repair.command, 'carrier:test:repair');
    const duplicate = applySessionCarrierCommand(run, session, repair.command, 'carrier:test:repair');
    expect(first.disposition).toBe('applied');
    expect(session.salvage).toBe(18);
    expect(duplicate.disposition).toBe('duplicate');
    expect(session.carrier.history).toHaveLength(1);
    expect(createCarrierCommandOptions({
      plan: run.carrierPlan,
      state: session.carrier,
      crewPlan: run.crewRoster,
      crewState: session.crewRoster,
      sectorIndex: 0
    })).toEqual([]);
  });

  it('derives mission, engineering, crew, market, support, and boarding hooks from facilities', () => {
    const run = generateRunSkeleton('CARRIER-INFLUENCE');
    const session = createRunSession(run, run.contracts[0]!);
    const base = createCarrierInfluence(run.carrierPlan, session.carrier);
    expect(base.cargoCapacity).toBeGreaterThanOrEqual(run.carrierPlan.baseCargoCapacity);
    expect(base.optionalMissionAccess).toBe(true);
    expect(base.supportCapacity + base.boardingCapacity + base.foundrySalvageBonus + base.crewRecoveryAdvance + base.shopDiscount).toBeGreaterThan(0);

    const pressured = {
      ...session.carrier,
      debt: 14,
      heat: 10,
      hull: 1,
      pursuit: 6
    };
    const restricted = createCarrierInfluence(run.carrierPlan, pressured);
    expect(restricted.optionalMissionAccess).toBe(false);
    expect(Object.values(restricted.factionAccess).filter(Boolean)).toHaveLength(1);
  });

  it('moves an assigned crew member from the flight wing into a carrier post', () => {
    const run = generateRunSkeleton('CARRIER-CREW-POST');
    const session = createRunSession(run, run.contracts[0]!);
    session.crewRoster = createDebugCrewRosterState(run.crewRoster);
    const assignment = createCarrierCommandOptions({
      plan: run.carrierPlan,
      state: session.carrier,
      crewPlan: run.crewRoster,
      crewState: session.crewRoster,
      sectorIndex: 0
    }).find((option) => option.command.kind === 'assignCrew')!;
    expect(applySessionCarrierCommand(run, session, assignment.command, 'carrier:crew-post').disposition).toBe('applied');
    const assignedId = assignment.command.kind === 'assignCrew' ? assignment.command.candidateId : '';
    const profile = createCrewCombatProfile(run.crewRoster, session.crewRoster, run.contracts[0]!.loadout, {
      excludedCandidateIds: [assignedId]
    });
    expect(session.carrier.facilities.some((facility) => facility.assignedCrewId === assignedId)).toBe(true);
    expect(profile.members.some((member) => member.candidateId === assignedId)).toBe(false);
  });

  it('stores bounded cargo and resolves posture tradeoffs through explicit transit events', () => {
    const run = generateRunSkeleton('CARRIER-CARGO');
    const session = createRunSession(run, run.contracts[0]!);
    let state = session.carrier;
    const capacity = createCarrierInfluence(run.carrierPlan, state).cargoCapacity;
    for (let index = 0; index < capacity + 2; index += 1) {
      state = stowCarrierCargo({
        plan: run.carrierPlan,
        state,
        cargo: { id: `cargo-${index}`, label: `Cargo ${index}`, kind: 'claim', size: 1, value: 2, sectorIndex: index }
      });
    }
    expect(createCarrierInfluence(run.carrierPlan, state).cargoUsed).toBe(capacity);
    const transit = resolveCarrierTransit(run.carrierPlan, { ...state, posture: 'stealth' }, 2);
    const replay = resolveCarrierTransit(run.carrierPlan, transit, 2);
    expect(transit.heat).toBeLessThanOrEqual(state.heat);
    expect(transit.debt).toBeGreaterThanOrEqual(state.debt);
    expect(replay).toBe(transit);
  });

  it('carries carrier state through sector transit and snapshot v4 restore', () => {
    const run = generateRunSkeleton('CARRIER-SNAPSHOT');
    const contract = run.contracts[0]!;
    const session = createRunSession(run, contract);
    session.salvage = 20;
    const option = createCarrierCommandOptions({
      plan: run.carrierPlan,
      state: session.carrier,
      crewPlan: run.crewRoster,
      crewState: session.crewRoster,
      sectorIndex: 0
    }).find((candidate) => candidate.command.kind === 'setPosture')!;
    applySessionCarrierCommand(run, session, option.command, 'carrier:snapshot:posture');
    expect(advanceSector(run, session)).toBe(true);
    const snapshot = createRunSnapshot({ run, contract, session, target: 'sectorTransition', label: 'Carrier transit' });
    const restored = restoreRunSnapshot(snapshot);
    expect(snapshot.version).toBe(4);
    expect(snapshot.extensions.carrier.planId).toBe(run.carrierPlan.id);
    expect(restored.session.carrier).toEqual(session.carrier);
    expect(restored.run.carrierPlan).toEqual(run.carrierPlan);
  });

  it('validates the carrier catalog and rejects incomplete replacement contracts', () => {
    expect(validateContent()).toEqual([]);
    const invalid = { ...CARRIERS[0]!, replacementOrder: CARRIERS[0]!.replacementOrder.slice(1) };
    expect(validateContent({ carriers: [invalid], carrierFacilities: CARRIER_FACILITIES })).toContain(
      `Carrier ${invalid.id} replacement order must cover every facility type`
    );
  });
});
