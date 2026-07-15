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
  it('splits the voyage into deterministic three-act plans', () => {
    const acts = createRunActPlan(createTwentySevenSectorDefinitions());
    const contexts = createActSectorContexts(acts);

    expect(acts.map((act) => [act.id, act.startSectorIndex, act.endSectorIndex])).toEqual([
      ['act_outer_rim', 0, 8],
      ['act_core_descent', 9, 17],
      ['act_null_frontier', 18, 26]
    ]);
    expect(contexts[0]?.actShortLabel).toBe('Act I');
    expect(contexts[0] ? formatActSectorLabel(contexts[0]) : '').toBe('Act I 1/5');
    expect(contexts[17] ? formatActDebugLabel(contexts[17]) : '').toBe(
      'Act II Core Descent 5/5'
    );
    expect(formatRunActTimeline(acts)).toBe(
      'Act I Outer Rim Contract: 5-layer route / nodes S1-S9 | Act II Core Descent: 5-layer route / nodes S10-S18 | Act III Null Frontier: 5-layer route / nodes S19-S27'
    );
  });

  it('normalizes save-facing act progress from cleared sector counts', () => {
    const acts = createRunActPlan(createTwentySevenSectorDefinitions());

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
        actId: 'act_null_frontier',
        actSectorIndex: 1,
        actsCompleted: 2
      })
    );
    expect(createRunActSaveContext(acts, 15)).toEqual(
      expect.objectContaining({ actId: 'act_null_frontier', actSectorIndex: 5, actsCompleted: 3 })
    );
  });
});

function createTwentySevenSectorDefinitions(): SectorDefinition[] {
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
    'sector_core_wreck',
    'sector_nullglass_expanse',
    'sector_dead_signal_reef',
    'sector_parallax_foundry',
    'sector_gravity_choir',
    'sector_horizon_scar',
    'sector_trade_war_corridor',
    'sector_bio_machine_bloom',
    'sector_lunar_surface',
    'sector_corporate_kill_grid',
    'sector_trade_war_corridor',
    'sector_bio_machine_bloom',
    'sector_lunar_surface',
    'sector_corporate_kill_grid',
    'sector_trade_war_corridor',
    'sector_nullglass_expanse',
    'sector_gravity_choir',
    'sector_dead_signal_reef'
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
