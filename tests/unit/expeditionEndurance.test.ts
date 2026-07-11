import { describe, expect, it } from 'vitest';

import { SCENARIO_LAB_IDS } from '../../src/game/ScenarioLab';
import { runExpeditionEnduranceHarness } from '../../src/game/ExpeditionEndurance';
import { RUN_SNAPSHOT_MAX_BYTES } from '../../src/game/RunSnapshot';

describe('ExpeditionEndurance', () => {
  it('replays every voyage public boundary deterministically across repeated restores', () => {
    const first = runExpeditionEnduranceHarness({ seed: 'VOYAGE-ENDURANCE', cycles: 3 });
    const second = runExpeditionEnduranceHarness({ seed: 'VOYAGE-ENDURANCE', cycles: 3 });
    expect(first).toEqual(second);
    expect(first.totalRoundTrips).toBe((SCENARIO_LAB_IDS.length + 1) * 3);
    expect(new Set(first.boundaries.map((boundary) => boundary.boundaryId))).toEqual(
      new Set([...SCENARIO_LAB_IDS, 'finale_checkpoint'])
    );
    expect(first.boundaries.every((boundary) => boundary.pendingEngineeringActions === 0)).toBe(
      true
    );
    expect(first.boundaries.some((boundary) => boundary.setPieceComponents >= 7)).toBe(true);
    expect(first.boundaries.some((boundary) => boundary.crewHistory === 3)).toBe(true);
    expect(first.boundaries.some((boundary) => boundary.factionHistory > 3)).toBe(true);
    expect(first.boundaries.some((boundary) => boundary.factionFrontHistory > 3)).toBe(true);
    expect(first.boundaries.some((boundary) => boundary.itemCount > 20)).toBe(true);
  });

  it('keeps snapshots and bounded histories below their public caps', () => {
    const report = runExpeditionEnduranceHarness({ seed: 'VOYAGE-BOUNDS', cycles: 8 });
    expect(report.maxSnapshotBytes).toBeLessThan(RUN_SNAPSHOT_MAX_BYTES);
    expect(report.maxTimelineEntries).toBeLessThanOrEqual(96);
    expect(report.maxFactionHistory).toBeLessThanOrEqual(64);
    expect(report.maxFactionFrontHistory).toBeLessThanOrEqual(64);
    expect(report.maxCrewHistory).toBeLessThanOrEqual(64);
    expect(report.maxCarrierHistory).toBeLessThanOrEqual(64);
    expect(report.maxCarrierCargo).toBeLessThanOrEqual(16);
    expect(report.maxEngineeringHistory).toBeLessThanOrEqual(3);
  });
});
