import { describe, expect, it } from 'vitest';

import { SECTORS, type SectorDefinition, type SectorId } from '../../src/content/sectors';
import {
  createActSectorContexts,
  createRunActPlan,
  createRunActSaveContext,
  formatActDebugLabel,
  formatActSectorLabel,
  formatRunActTimeline
} from '../../src/game/ActPlan';

describe('ActPlan', () => {
  it('splits the current sector route into deterministic Act I and Act II plans', () => {
    const acts = createRunActPlan(createTenSectorDefinitions());
    const contexts = createActSectorContexts(acts);

    expect(acts.map((act) => [act.id, act.startSectorIndex, act.endSectorIndex])).toEqual([
      ['act_outer_rim', 0, 4],
      ['act_core_descent', 5, 9]
    ]);
    expect(contexts[0]?.actShortLabel).toBe('Act I');
    expect(contexts[0] ? formatActSectorLabel(contexts[0]) : '').toBe('Act I 1/5');
    expect(contexts[9] ? formatActDebugLabel(contexts[9]) : '').toBe(
      'Act II Core Descent 5/5'
    );
    expect(formatRunActTimeline(acts)).toBe(
      'Act I Outer Rim Contract: S1-S5 | Act II Core Descent: S6-S10'
    );
  });

  it('normalizes save-facing act progress from cleared sector counts', () => {
    const acts = createRunActPlan(createTenSectorDefinitions());

    expect(createRunActSaveContext(acts, 0)).toEqual(
      expect.objectContaining({
        actId: 'act_outer_rim',
        actSectorIndex: 1,
        actsCompleted: 0
      })
    );
    expect(createRunActSaveContext(acts, 5)).toEqual(
      expect.objectContaining({
        actId: 'act_core_descent',
        actSectorIndex: 1,
        actsCompleted: 1
      })
    );
    expect(createRunActSaveContext(acts, 10)).toEqual(
      expect.objectContaining({
        actId: 'act_core_descent',
        actSectorIndex: 5,
        actsCompleted: 2
      })
    );
  });
});

function createTenSectorDefinitions(): SectorDefinition[] {
  const sectorIds: readonly SectorId[] = [
    'sector_outer_debris_field',
    'sector_trade_war_corridor',
    'sector_bio_machine_bloom',
    'sector_corporate_kill_grid',
    'sector_trade_war_corridor',
    'sector_bio_machine_bloom',
    'sector_lunar_surface',
    'sector_trade_war_corridor',
    'sector_corporate_kill_grid',
    'sector_core_wreck'
  ];

  return sectorIds.map(getSectorDefinition);
}

function getSectorDefinition(id: SectorId): SectorDefinition {
  const sector = SECTORS.find((candidate) => candidate.id === id);

  if (!sector) {
    throw new Error(`Missing test sector: ${id}`);
  }

  return sector;
}
