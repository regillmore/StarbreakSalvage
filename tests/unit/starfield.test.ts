import { describe, expect, it } from 'vitest';

import { generateStarfield, starCountForViewport } from '../../src/core/starfield';

describe('generateStarfield', () => {
  it('returns the same field for the same seed', () => {
    const options = {
      width: 320,
      height: 480,
      count: 18,
      seed: 'STARBREAK-SMOKE'
    };

    expect(generateStarfield(options)).toEqual(generateStarfield(options));
  });

  it('changes the field when the seed changes', () => {
    const baseOptions = {
      width: 320,
      height: 480,
      count: 18
    };

    expect(generateStarfield({ ...baseOptions, seed: 'STARBREAK-SMOKE' })).not.toEqual(
      generateStarfield({ ...baseOptions, seed: 'LASER-TAX-404' })
    );
  });

  it('keeps generated stars inside the canvas bounds', () => {
    const width = 640;
    const height = 360;
    const stars = generateStarfield({
      width,
      height,
      count: 64,
      seed: 'ORBITAL-JUNK-PROPHET'
    });

    expect(stars).toHaveLength(64);
    for (const star of stars) {
      expect(star.x).toBeGreaterThanOrEqual(0);
      expect(star.x).toBeLessThanOrEqual(width);
      expect(star.y).toBeGreaterThanOrEqual(0);
      expect(star.y).toBeLessThanOrEqual(height);
      expect(star.radius).toBeGreaterThan(0);
      expect(star.alpha).toBeGreaterThanOrEqual(0.38);
      expect(star.alpha).toBeLessThanOrEqual(1);
    }
  });
});

describe('starCountForViewport', () => {
  it('scales with viewport area while staying bounded', () => {
    expect(starCountForViewport(320, 240)).toBe(120);
    expect(starCountForViewport(1920, 1080)).toBe(482);
    expect(starCountForViewport(4096, 4096)).toBe(520);
  });
});
