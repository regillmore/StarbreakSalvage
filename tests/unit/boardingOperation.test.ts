import { describe, expect, it } from 'vitest';

import { BOARDING_CONTRACTS, BOARDING_OBJECTIVE_KINDS, BOARDING_TARGET_KINDS } from '../../src/content/boarding';
import {
  createBoardingCampaignState,
  createBoardingMissionObjectivePlan,
  createBoardingTranslatedLoadout,
  projectSectorForBoarding,
  settleBoardingOperation,
  validateBoardingCampaignPlan,
  validateBoardingCampaignState
} from '../../src/game/BoardingOperation';
import { generateRunSkeleton } from '../../src/game/Generation';
import { createRunSession, recordBoardingOperationOutcome } from '../../src/game/RunSession';
import { createRunSnapshot, restoreRunSnapshot } from '../../src/game/RunSnapshot';

describe('BoardingOperation', () => {
  it('generates deterministic bounded interiors covering every target and objective family', () => {
    const first = generateRunSkeleton('BOARDING-DETERMINISM');
    const second = generateRunSkeleton('BOARDING-DETERMINISM');
    expect(first.boardingCampaign).toEqual(second.boardingCampaign);
    expect(first.boardingCampaign.operations).toHaveLength(BOARDING_CONTRACTS.length);
    expect(validateBoardingCampaignPlan(first.boardingCampaign)).toEqual([]);
    expect(new Set(first.boardingCampaign.operations.map((operation) => operation.targetKind))).toEqual(
      new Set(BOARDING_TARGET_KINDS)
    );
    expect(
      new Set(first.boardingCampaign.operations.flatMap((operation) => operation.objectiveKinds))
    ).toEqual(new Set(BOARDING_OBJECTIVE_KINDS));
    for (const operation of first.boardingCampaign.operations) {
      expect(operation.rooms.length).toBeGreaterThanOrEqual(4);
      expect(operation.rooms.length).toBeLessThanOrEqual(7);
      expect(operation.rooms[0]?.kind).toBe('airlock');
      expect(operation.rooms.at(-1)?.kind).toBe('extraction');
      expect(operation.doors).toHaveLength(operation.rooms.length - 1);
    }
  });

  it('projects a close-range operation through the shared sector and objective contracts', () => {
    const run = generateRunSkeleton('BOARDING-PROJECTION');
    const operation = run.boardingCampaign.operations[0]!;
    const sector = run.sectors[operation.sectorIndex]!;
    const projection = projectSectorForBoarding(sector, operation);
    const objective = createBoardingMissionObjectivePlan(operation, null);
    const translated = createBoardingTranslatedLoadout({
      weaponName: 'Pulse Fork',
      moduleSummary: 'reactor, drone rack',
      crewCount: 2
    });

    expect(projection.scroll.length).toBe(operation.scrollLength);
    expect(projection.scroll.length).toBeLessThan(sector.scroll.length);
    expect(projection.arena).toBeNull();
    expect(projection.setPiece).toBeNull();
    expect(projection.objective.bossRequired).toBe(false);
    expect(objective.contractId).toBe(operation.contractId);
    expect(objective.cleanupPolicy).toBe('clearField');
    expect(translated.summary).toContain('breach cutter');
    expect(translated.bomb).toContain('room-clear');
  });

  it('settles success, partial custody, retreat, and duplicate boundaries with zero retained actors', () => {
    const run = generateRunSkeleton('BOARDING-SETTLEMENT');
    const [successOperation, partialOperation, retreatOperation] = run.boardingCampaign.operations;
    let state = createBoardingCampaignState(run.boardingCampaign);
    const success = settleBoardingOperation({
      plan: run.boardingCampaign,
      state,
      operation: successOperation!,
      eventId: 'boarding-success',
      outcome: 'success',
      completionRatio: 1,
      retreated: false
    });
    state = success.state;
    const duplicate = settleBoardingOperation({
      plan: run.boardingCampaign,
      state,
      operation: successOperation!,
      eventId: 'boarding-success',
      outcome: 'failure',
      completionRatio: 0,
      retreated: false
    });
    const partial = settleBoardingOperation({
      plan: run.boardingCampaign,
      state,
      operation: partialOperation!,
      eventId: 'boarding-partial',
      outcome: 'partialSuccess',
      completionRatio: 0.6,
      retreated: false
    });
    state = partial.state;
    const retreat = settleBoardingOperation({
      plan: run.boardingCampaign,
      state,
      operation: retreatOperation!,
      eventId: 'boarding-retreat',
      outcome: 'failure',
      completionRatio: 0.4,
      retreated: true
    });

    expect(success.status).toBe('success');
    expect(success.stowedLoot.length).toBeGreaterThan(0);
    expect(duplicate.disposition).toBe('duplicate');
    expect(partial.status).toBe('partialSuccess');
    expect(partial.state.operations.find((entry) => entry.operationId === partialOperation!.id)?.loot[0]?.custody).toBe('held');
    expect(retreat.status).toBe('retreated');
    expect(retreat.state.operations.every((entry) => entry.cleanupActorsRetained === 0)).toBe(true);
    expect(validateBoardingCampaignState(run.boardingCampaign, retreat.state)).toEqual([]);
  });

  it('applies carrier, foundry, faction, rival, and apex-facing consequences outside combat', () => {
    const run = generateRunSkeleton('BOARDING-CONSEQUENCES');
    const contract = run.contracts[0]!;
    const session = createRunSession(run, contract);
    const foundryOperation = run.boardingCampaign.operations.find((operation) => operation.integrations.includes('foundry'))!;
    const engineeringBefore = session.engineering.committed.components.length;
    const cargoBefore = session.carrier.cargo.length;
    const settlement = recordBoardingOperationOutcome(run, session, foundryOperation, {
      eventId: 'boarding-foundry-outcome',
      outcome: 'success',
      completionRatio: 1,
      retreated: false
    });

    expect(settlement.disposition).toBe('applied');
    expect(session.engineering.committed.components.length).toBeGreaterThan(engineeringBefore);
    expect(session.carrier.cargo.length).toBeGreaterThan(cargoBefore);
    expect(session.boarding.unlockedHooks).toContain(`foundry:${foundryOperation.contractId}`);

    const rivalOperation = run.boardingCampaign.operations.find((operation) => operation.integrations.includes('rival'))!;
    recordBoardingOperationOutcome(run, session, rivalOperation, {
      eventId: 'boarding-rival-outcome',
      outcome: 'success',
      completionRatio: 1,
      retreated: false
    });
    expect(session.factionCampaign.rivals.some((rival) => rival.status === 'captured')).toBe(true);

    const apexOperation = run.boardingCampaign.operations.find((operation) => operation.integrations.includes('apex'))!;
    recordBoardingOperationOutcome(run, session, apexOperation, {
      eventId: 'boarding-apex-outcome',
      outcome: 'partialSuccess',
      completionRatio: 0.6,
      retreated: false
    });
    expect(session.boarding.unlockedHooks).toContain(`apex:${apexOperation.contractId}`);
  });

  it('round-trips boarding custody and hooks through snapshot v6', () => {
    const run = generateRunSkeleton('BOARDING-SNAPSHOT');
    const contract = run.contracts[0]!;
    const session = createRunSession(run, contract);
    const operation = run.boardingCampaign.operations[0]!;
    recordBoardingOperationOutcome(run, session, operation, {
      eventId: 'boarding-snapshot-outcome',
      outcome: 'success',
      completionRatio: 1,
      retreated: false
    });
    const snapshot = createRunSnapshot({
      run,
      contract,
      session,
      target: 'sectorTransition',
      label: 'Boarding custody'
    });
    const restored = restoreRunSnapshot(snapshot);
    expect(snapshot.version).toBe(6);
    expect(snapshot.extensions.boarding.planId).toBe(run.boardingCampaign.id);
    expect(restored.session.boarding).toEqual(session.boarding);
  });
});
