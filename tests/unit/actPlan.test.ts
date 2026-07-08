import { describe, expect, it } from 'vitest';

import { SECTORS } from '../../src/content/sectors';
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
    const acts = createRunActPlan(SECTORS.filter((sector) => sector.id !== 'sector_lunar_surface'));
    const contexts = createActSectorContexts(acts);

    expect(acts.map((act) => [act.id, act.startSectorIndex, act.endSectorIndex])).toEqual([
      ['act_outer_rim', 0, 2],
      ['act_core_descent', 3, 4]
    ]);
    expect(contexts[0]?.actShortLabel).toBe('Act I');
    expect(contexts[0] ? formatActSectorLabel(contexts[0]) : '').toBe('Act I 1/3');
    expect(contexts[4] ? formatActDebugLabel(contexts[4]) : '').toBe(
      'Act II Core Descent 2/2'
    );
    expect(formatRunActTimeline(acts)).toBe(
      'Act I Outer Rim Contract: S1-S3 | Act II Core Descent: S4-S5'
    );
  });

  it('normalizes save-facing act progress from cleared sector counts', () => {
    const acts = createRunActPlan(SECTORS.filter((sector) => sector.id !== 'sector_lunar_surface'));

    expect(createRunActSaveContext(acts, 0)).toEqual(
      expect.objectContaining({
        actId: 'act_outer_rim',
        actSectorIndex: 1,
        actsCompleted: 0
      })
    );
    expect(createRunActSaveContext(acts, 3)).toEqual(
      expect.objectContaining({
        actId: 'act_core_descent',
        actSectorIndex: 1,
        actsCompleted: 1
      })
    );
    expect(createRunActSaveContext(acts, 5)).toEqual(
      expect.objectContaining({
        actId: 'act_core_descent',
        actSectorIndex: 2,
        actsCompleted: 2
      })
    );
  });
});
