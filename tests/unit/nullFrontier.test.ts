import { describe, expect, it } from 'vitest';

import { getFrontierChoiceHandoff } from '../../src/game/ActPlan';
import { generateRunSkeleton } from '../../src/game/Generation';
import {
  applyFrontierDecision,
  advanceSector,
  createRunSession
} from '../../src/game/RunSession';
import { createSectorConditionPlan } from '../../src/game/SectorConditions';
import { createRunSnapshot, restoreRunSnapshot } from '../../src/game/RunSnapshot';
import { formatFrontierOutcome } from '../../src/game/NullFrontier';

describe('Null Frontier', () => {
  it('generates one coherent five-sector campaign deterministically', () => {
    const first = generateRunSkeleton('FRONTIER-DETERMINISM');
    const second = generateRunSkeleton('FRONTIER-DETERMINISM');
    const frontierSectors = first.sectors.slice(10);

    expect(first.frontierCampaign).toEqual(second.frontierCampaign);
    expect(frontierSectors).toHaveLength(5);
    expect(new Set(frontierSectors.map((sector) => sector.sectorId)).size).toBe(5);
    expect(frontierSectors.at(-1)?.sectorId).toBe('sector_horizon_scar');
    expect(frontierSectors.every((sector) => sector.frontierLaw !== null)).toBe(true);
    expect(frontierSectors.every((sector) => sector.routeOptions.some((route) => route.actRouteId?.startsWith('act3_')))).toBe(true);
    expect(frontierSectors.at(-1)?.bossId).toBe('boss_horizon_leviathan');
  });

  it('offers a complete extraction or a state-carrying breach after Act II', () => {
    const run = generateRunSkeleton('FRONTIER-CHOICE');
    const handoff = getFrontierChoiceHandoff(run.acts, 9);
    expect(handoff?.sourceAct.id).toBe('act_core_descent');
    expect(handoff?.targetAct.id).toBe('act_null_frontier');

    const extraction = createRunSession(run, run.contracts[0]!);
    const extractionState = applyFrontierDecision(extraction, 'extract');
    expect(extractionState).toMatchObject({ decision: 'extract', creditsAwarded: 180, salvageAwarded: 45 });
    expect(formatFrontierOutcome(run.frontierCampaign, extractionState, 'victory')).toContain('complete victory');

    const breach = createRunSession(run, run.contracts[0]!);
    const breachState = applyFrontierDecision(breach, 'breach');
    applyFrontierDecision(breach, 'breach');
    expect(breach.frontierDecision).toBe(breachState);
    expect(breach.timeline.entries.filter((entry) => entry.id === 'frontier-decision:breach')).toHaveLength(1);
  });

  it('applies each frontier law through shared sector-condition contracts', () => {
    const run = generateRunSkeleton('FRONTIER-LAWS');
    for (let sectorIndex = 10; sectorIndex < 15; sectorIndex += 1) {
      const conditions = createSectorConditionPlan({ run, sectorIndex });
      expect(conditions.modifiers.some((modifier) => modifier.source === 'frontierLaw')).toBe(true);
      expect(conditions.scrollSpeedMultiplier).toBeGreaterThan(0);
      expect(conditions.lengthMultiplier).toBeGreaterThan(0);
    }
  });

  it('restores the chosen campaign and breach decision from the current snapshot', () => {
    const run = generateRunSkeleton('FRONTIER-SNAPSHOT');
    const contract = run.contracts[0]!;
    const session = createRunSession(run, contract);
    for (let sector = 0; sector < 10; sector += 1) expect(advanceSector(run, session)).toBe(true);
    applyFrontierDecision(session, 'breach');
    const snapshot = createRunSnapshot({
      run,
      contract,
      session,
      target: 'sectorTransition',
      label: 'Null Frontier breach'
    });
    const restored = restoreRunSnapshot(snapshot);

    expect(snapshot.version).toBe(6);
    expect(restored.run.frontierCampaign).toEqual(run.frontierCampaign);
    expect(restored.session.frontierDecision.decision).toBe('breach');
    expect(restored.session.currentSectorIndex).toBe(10);
  });
});
