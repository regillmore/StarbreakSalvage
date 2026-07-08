import { describe, expect, it } from 'vitest';

import { generateRunSkeleton } from '../../src/game/Generation';
import { getSaveRecordSectorCount, getSectorCompletionReason } from '../../src/game/RunOutcome';

describe('RunOutcome', () => {
  it('distinguishes sector clears from final-sector victory', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');

    expect(getSectorCompletionReason(run, 0, { complete: true })).toBe('sectorComplete');
    expect(getSectorCompletionReason(run, run.sectors.length - 1, { complete: true })).toBe(
      'victory'
    );
    expect(getSectorCompletionReason(run, run.sectors.length - 1, { complete: false })).toBeNull();
  });

  it('counts all sectors for victory save records', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');

    expect(getSaveRecordSectorCount(run, 9, 9, 'victory')).toBe(10);
    expect(getSaveRecordSectorCount(run, 9, 9, 'sectorComplete')).toBe(9);
  });
});
