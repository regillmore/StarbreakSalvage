import { describe, expect, it } from 'vitest';

import { buildSeedShareUrl } from '../../src/ui/RunSummaryScene';

describe('buildSeedShareUrl', () => {
  it('creates a clean share link for the active seed', () => {
    expect(
      buildSeedShareUrl(
        'https://example.test/StarbreakSalvage/?debug=1&mode=smoke#summary',
        'LASER-TAX-404'
      )
    ).toBe('https://example.test/StarbreakSalvage/?mode=smoke&seed=LASER-TAX-404');
  });

  it('replaces an existing seed parameter', () => {
    expect(
      buildSeedShareUrl('https://example.test/StarbreakSalvage/?seed=OLD-SEED', 'VOID-CORSAIR-7')
    ).toBe('https://example.test/StarbreakSalvage/?seed=VOID-CORSAIR-7');
  });
});
