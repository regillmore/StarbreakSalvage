import { describe, expect, it } from 'vitest';

import { createVoyageReleaseAudit } from '../../src/game/VoyageReleaseAudit';
import { generateRunSkeleton } from '../../src/game/Generation';
import { UNLOCKS } from '../../src/content/unlocks';
import { UPGRADES } from '../../src/content/upgrades';

describe('VoyageReleaseAudit', () => {
  it('measures fresh and progressed extraction, standard, and completionist capacity', () => {
    const create = () =>
      createVoyageReleaseAudit(
        generateRunSkeleton('PHASE-11-RELEASE', { unlockedIds: [], purchasedUpgradeIds: [] }),
        generateRunSkeleton('PHASE-11-RELEASE', {
          unlockedIds: UNLOCKS.map((unlock) => unlock.id),
          purchasedUpgradeIds: UPGRADES.map((upgrade) => upgrade.id)
        })
      );
    const first = create();
    const second = create();
    expect(first).toEqual(second);
    expect(first.measurements).toHaveLength(6);
    expect(new Set(first.measurements.map((measurement) => measurement.id)).size).toBe(6);
    expect(first.measurements.every((measurement) => measurement.targetSeconds > 0)).toBe(true);
    expect(first.earlyExtractionMinutes).toBeLessThan(first.freshStandardMinutes);
    expect(first.freshStandardMinutes).toBeLessThan(first.completionistMinutes);
    expect(first.freshStandardMinutes).toBe(first.progressedStandardMinutes);
    expect(first.caveat).toContain('not player stopwatch time');
    expect(first.summary).toBe(
      'Fresh standard 16.88m | progressed standard 16.88m | early extraction 11.08m | completionist 21.13m'
    );
  });
});
