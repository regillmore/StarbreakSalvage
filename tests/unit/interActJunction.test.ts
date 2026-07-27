import { describe, expect, it } from 'vitest';

import {
  getActBoundaryHandoffAfterSector,
  getInterActHandoffAfterSector,
  getInterActTransitionHandoff,
  getVictoryHandoffAfterSector,
  shouldOfferSectorCompletionReward
} from '../../src/game/ActPlan';
import { generateRunSkeleton } from '../../src/game/Generation';
import {
  combineInterActShipRefitEffects,
  createInterActJunctionChoices,
  formatInterActHistory,
  type InterActChoice
} from '../../src/game/InterActJunction';
import {
  applyInterActChoice,
  createRunSession,
  getEffectiveShipStats,
  getInterActEffectsForSector,
  hasInterActChoiceForSourceAct
} from '../../src/game/RunSession';

describe('InterActJunction', () => {
  it('creates deterministic keyboard-friendly refit choices from seed and save state', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const sourceAct = run.acts[0];
    const targetAct = run.acts[1];

    if (!sourceAct || !targetAct) {
      throw new Error('Expected two generated acts.');
    }

    const options = {
      runSeed: run.seed,
      sourceAct,
      targetAct,
      credits: 18,
      salvage: 4,
      hullPatch: 1,
      curse: 0,
      saveFingerprint: 'unlock_a|upgrade_b|achievement_c'
    };
    const first = createInterActJunctionChoices(options);
    const second = createInterActJunctionChoices(options);

    expect(first).toEqual(second);
    expect(first).toHaveLength(3);
    expect(first.map((choice) => choice.kind)).toEqual(['repair', 'ordnance', 'vector']);
    expect(first.map((choice) => choice.label)).toEqual([
      'Patch Hull',
      'Deep-Cycle Magazine',
      'Vector Shear Vanes'
    ]);
    expect(first.map((choice) => choice.label)).not.toContain('');
    expect(first.map((choice) => `${choice.summary} ${choice.detail}`).join(' ')).toContain(
      'rest of the run'
    );
    expect(first.map((choice) => choice.kind)).not.toContain('intel');
  });

  it('balances fresh midpoint choices around persistent combat refits', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const contract = run.contracts[0];
    const sourceAct = run.acts[0];
    const targetAct = run.acts[1];

    if (!contract || !sourceAct || !targetAct) {
      throw new Error('Expected generated run parts.');
    }

    const choices = createInterActJunctionChoices({
      runSeed: run.seed,
      sourceAct,
      targetAct,
      credits: 18,
      salvage: 4,
      hullPatch: 0,
      curse: 0,
      saveFingerprint: 'combat-refit-test'
    });
    const repair = choices.find((choice) => choice.kind === 'repair');
    const ordnance = choices.find((choice) => choice.kind === 'ordnance');
    const vector = choices.find((choice) => choice.kind === 'vector');

    if (!repair || !ordnance || !vector) {
      throw new Error('Expected the three fresh midpoint refits.');
    }

    const repairSession = createRunSession(run, contract);
    applyInterActChoice(repairSession, repair);
    expect(getEffectiveShipStats(contract, repairSession).maxHull).toBe(
      contract.shipStats.maxHull + 1
    );

    const ordnanceSession = createRunSession(run, contract);
    applyInterActChoice(ordnanceSession, ordnance);
    expect(getEffectiveShipStats(contract, ordnanceSession)).toMatchObject({
      bombCapacity: contract.shipStats.bombCapacity + 1,
      specialChargeMultiplier: contract.shipStats.specialChargeMultiplier + 0.25
    });

    const vectorSession = createRunSession(run, contract);
    applyInterActChoice(vectorSession, vector);
    expect(getEffectiveShipStats(contract, vectorSession)).toMatchObject({
      speed: contract.shipStats.speed + 40,
      hitRadius: contract.shipStats.hitRadius - 2
    });
  });

  it('detects the deterministic Act I to Act II handoff after the converged finale', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const sourceIndex = run.acts[0]!.endSectorIndex;
    const targetIndex = run.acts[1]!.startSectorIndex;
    const handoff = getInterActTransitionHandoff(run.acts, sourceIndex, targetIndex);

    expect(handoff?.sourceAct.shortLabel).toBe('Act I');
    expect(handoff?.targetAct.shortLabel).toBe('Act II');
    expect(getInterActTransitionHandoff(run.acts, sourceIndex - 1, sourceIndex)).toBeNull();
    expect(getInterActHandoffAfterSector(run.acts, sourceIndex)).toEqual(handoff);
    expect(getInterActHandoffAfterSector(run.acts, sourceIndex - 1)).toBeNull();
  });

  it('classifies all player-facing act boundaries without treating ordinary sectors as handoffs', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const actOne = run.acts[0]!;
    const actTwo = run.acts[1]!;
    const actThree = run.acts[2]!;

    expect(getActBoundaryHandoffAfterSector(run.acts, actOne.endSectorIndex)).toMatchObject({
      kind: 'interActJunction',
      sourceAct: { id: actOne.id },
      targetAct: { id: actTwo.id }
    });
    expect(getActBoundaryHandoffAfterSector(run.acts, actTwo.endSectorIndex)).toMatchObject({
      kind: 'frontierChoice',
      sourceAct: { id: actTwo.id },
      targetAct: { id: actThree.id }
    });
    expect(getActBoundaryHandoffAfterSector(run.acts, actThree.endSectorIndex)).toMatchObject({
      kind: 'victory',
      sourceAct: { id: actThree.id }
    });
    expect(getActBoundaryHandoffAfterSector(run.acts, actTwo.endSectorIndex - 1)).toBeNull();
    expect(getActBoundaryHandoffAfterSector(run.acts, actThree.endSectorIndex - 1)).toBeNull();
    expect(getVictoryHandoffAfterSector(run.acts, actThree.endSectorIndex)).toEqual({
      sourceAct: actThree
    });
    expect(shouldOfferSectorCompletionReward(run.acts, actOne.endSectorIndex)).toBe(true);
    expect(shouldOfferSectorCompletionReward(run.acts, actTwo.endSectorIndex)).toBe(true);
    expect(shouldOfferSectorCompletionReward(run.acts, actThree.endSectorIndex - 1)).toBe(true);
    expect(shouldOfferSectorCompletionReward(run.acts, actThree.endSectorIndex)).toBe(false);
  });

  it('applies a selected choice once and exposes explicit Act II effects', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const contract = run.contracts[0];
    const sourceAct = run.acts[0];
    const targetAct = run.acts[1];
    const targetSector = run.sectors[targetAct?.startSectorIndex ?? -1];

    if (!contract || !sourceAct || !targetAct || !targetSector) {
      throw new Error('Expected generated run parts.');
    }

    const session = createRunSession(run, contract);
    const choice = createTestChoice(sourceAct, targetAct);

    applyInterActChoice(session, choice);

    expect(session.credits).toBe(contract.startingCredits + 2);
    expect(session.salvage).toBe(contract.startingSalvage + 3);
    expect(session.hullPatch).toBe(1);
    expect(session.curse).toBe(1);
    expect(hasInterActChoiceForSourceAct(session, sourceAct.id)).toBe(true);
    expect(getInterActEffectsForSector(session, targetSector)).toEqual(
      expect.objectContaining({
        routeIntel: true,
        shopDiscount: 2,
        rewardChoiceBonus: 1,
        rewardBiasTags: ['shield'],
        shipRefit: {
          speedDelta: 0,
          hitRadiusDelta: 0,
          bombCapacityDelta: 0,
          specialChargeMultiplierDelta: 0
        }
      })
    );
    expect(combineInterActShipRefitEffects(session.interActChoices)).toEqual({
      speedDelta: 0,
      hitRadiusDelta: 0,
      bombCapacityDelta: 0,
      specialChargeMultiplierDelta: 0
    });
    expect(formatInterActHistory(session.interActChoices)).toContain(
      'Outer Rim Contract -> Core Descent: Test Refit'
    );
  });
});

function createTestChoice(
  sourceAct: NonNullable<ReturnType<typeof generateRunSkeleton>['acts'][number]>,
  targetAct: NonNullable<ReturnType<typeof generateRunSkeleton>['acts'][number]>
): InterActChoice {
  return {
    id: 'test-refit',
    kind: 'intel',
    label: 'Test Refit',
    meta: 'Unit test',
    summary: 'Act II test refit.',
    detail: 'Applies every junction effect for accounting coverage.',
    sourceActId: sourceAct.id,
    sourceActLabel: sourceAct.label,
    targetActId: targetAct.id,
    targetActLabel: targetAct.label,
    effects: {
      creditsDelta: 2,
      salvageDelta: 3,
      hullPatchDelta: 1,
      curseDelta: 1,
      routeIntel: true,
      shopDiscount: 2,
      rewardChoiceBonus: 1,
      rewardBiasTags: ['shield'],
      riskLabel: 'test risk'
    }
  };
}
