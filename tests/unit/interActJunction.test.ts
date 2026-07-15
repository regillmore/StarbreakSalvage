import { describe, expect, it } from 'vitest';

import {
  getInterActHandoffAfterSector,
  getInterActTransitionHandoff
} from '../../src/game/ActPlan';
import { generateRunSkeleton } from '../../src/game/Generation';
import {
  createInterActJunctionChoices,
  formatInterActHistory,
  type InterActChoice
} from '../../src/game/InterActJunction';
import {
  applyInterActChoice,
  createRunSession,
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
    expect(first[0]?.kind).toBe('repair');
    expect(first.map((choice) => choice.label)).not.toContain('');
    expect(first.map((choice) => `${choice.summary} ${choice.detail}`).join(' ')).toContain(
      'Act II'
    );
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
        rewardBiasTags: ['shield']
      })
    );
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
