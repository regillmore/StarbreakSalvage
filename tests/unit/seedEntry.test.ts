import { describe, expect, it } from 'vitest';

import { DEFAULT_SEED } from '../../src/core/rng';
import { previewSeedEntry, resolveSeedEntry } from '../../src/game/SeedEntry';

describe('seed entry resolution', () => {
  it('treats blank as random while keeping default as an explicit reference route', () => {
    expect(resolveSeedEntry('', () => 'fresh route 9')).toMatchObject({
      seed: 'FRESH-ROUTE-9',
      source: 'random'
    });
    expect(resolveSeedEntry('default')).toMatchObject({
      seed: DEFAULT_SEED,
      source: 'default'
    });
  });

  it('recognizes known seed labels after normalization', () => {
    expect(resolveSeedEntry('laser tax 404')).toMatchObject({
      seed: 'LASER-TAX-404',
      source: 'known'
    });
  });

  it('keeps custom labels deterministic after normalization', () => {
    expect(resolveSeedEntry('My first salvage run')).toMatchObject({
      seed: 'MY-FIRST-SALVAGE-RUN',
      source: 'custom'
    });
  });

  it('previews random without consuming a random seed', () => {
    expect(previewSeedEntry('')).toMatchObject({
      seed: 'RANDOM',
      source: 'random'
    });
    expect(previewSeedEntry('random')).toMatchObject({
      seed: 'RANDOM',
      source: 'random'
    });
  });

  it('resolves random through an injectable seed factory', () => {
    expect(resolveSeedEntry('random', () => 'pilot roll 7')).toMatchObject({
      seed: 'PILOT-ROLL-7',
      source: 'random'
    });
  });
});
