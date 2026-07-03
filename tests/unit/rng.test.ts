import { describe, expect, it } from 'vitest';

import { createRng, parseSeedLabel } from '../../src/core/rng';

describe('parseSeedLabel', () => {
  it('normalizes readable seed labels', () => {
    expect(parseSeedLabel(' laser tax 404 ')).toBe('LASER-TAX-404');
    expect(parseSeedLabel('Void_Corsair_7')).toBe('VOID-CORSAIR-7');
    expect(parseSeedLabel('')).toBe('STARBREAK-SMOKE');
  });
});

describe('SeededRng', () => {
  it('repeats the same number stream for the same seed', () => {
    const first = createRng('STARBREAK-SMOKE');
    const second = createRng('STARBREAK-SMOKE');

    expect([first.nextU32(), first.nextU32(), first.nextU32()]).toEqual([
      second.nextU32(),
      second.nextU32(),
      second.nextU32()
    ]);
  });

  it('varies number streams when seeds differ', () => {
    const first = createRng('STARBREAK-SMOKE');
    const second = createRng('LASER-TAX-404');

    expect([first.nextU32(), first.nextU32(), first.nextU32()]).not.toEqual([
      second.nextU32(),
      second.nextU32(),
      second.nextU32()
    ]);
  });

  it('forks stable streams independent of parent draw count', () => {
    const root = createRng('ORBITAL-JUNK-PROPHET');
    const firstForkValue = root.fork('sector-2-shop').nextU32();

    root.nextU32();
    root.nextU32();

    expect(root.fork('sector-2-shop').nextU32()).toBe(firstForkValue);
  });

  it('keeps integer rolls inside inclusive bounds', () => {
    const rng = createRng('VOID-CORSAIR-7');

    for (let index = 0; index < 128; index += 1) {
      expect(rng.int(3, 7)).toBeGreaterThanOrEqual(3);
      expect(rng.int(3, 7)).toBeLessThanOrEqual(7);
    }
  });

  it('supports deterministic choice, shuffle, and weightedChoice helpers', () => {
    const items = ['alpha', 'beta', 'gamma', 'delta'] as const;
    const first = createRng('LASER-TAX-404');
    const second = createRng('LASER-TAX-404');

    expect(first.choice(items)).toBe(second.choice(items));
    expect(first.shuffle(items)).toEqual(second.shuffle(items));
    expect(items).toEqual(['alpha', 'beta', 'gamma', 'delta']);

    const weighted = [
      { item: 'never', weight: 0 },
      { item: 'often', weight: 10 },
      { item: 'sometimes', weight: 1 }
    ] as const;

    expect(first.weightedChoice(weighted)).not.toBe('never');
    expect(() => first.weightedChoice([{ item: 'empty', weight: 0 }])).toThrow(
      /positive weight/
    );
  });
});
