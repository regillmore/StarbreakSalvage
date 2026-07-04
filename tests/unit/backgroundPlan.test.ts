import { describe, expect, it } from 'vitest';

import { BACKGROUNDS, getBackgroundById } from '../../src/content/backgrounds';
import { createRng } from '../../src/core/rng';
import { createBackgroundPlan, summarizeBackgroundPlan } from '../../src/game/BackgroundPlan';
import { generateRunSkeleton } from '../../src/game/Generation';

describe('BackgroundPlan', () => {
  it('creates deterministic plans from explicit RNG forks', () => {
    const background = getBackgroundById('background_outer_debris_field');
    const first = createBackgroundPlan(
      background,
      createRng('STARBREAK-SMOKE').fork('sector-1').fork('background')
    );
    const second = createBackgroundPlan(
      background,
      createRng('STARBREAK-SMOKE').fork('sector-1').fork('background')
    );

    expect(summarizeBackgroundPlan(first)).toEqual(summarizeBackgroundPlan(second));
  });

  it('ships at least three strata for each sector background family', () => {
    for (const background of BACKGROUNDS) {
      const plan = createBackgroundPlan(background, createRng('BACKGROUND-COUNT-SMOKE'));

      expect(plan.layers.length).toBeGreaterThanOrEqual(3);
      expect(plan.primitiveCount).toBeGreaterThanOrEqual(80);
      expect(plan.layers.every((layer) => layer.primitives.length > 0)).toBe(true);
    }
  });

  it('matches the known-seed opening background snapshot', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const openingBackground = run.sectors[0]?.background;

    if (!openingBackground) {
      throw new Error('Expected opening sector background.');
    }

    expect(summarizeBackgroundPlan(openingBackground)).toMatchInlineSnapshot(`
      {
        "id": "background_outer_debris_field",
        "layerCount": 4,
        "layers": [
          {
            "first": {
              "kind": "spark",
              "length": 0,
              "rotation": 0,
              "size": 0.002,
              "x": 0.166,
              "y": 0.828,
            },
            "id": "distant-cold-stars",
            "kind": "deepStars",
            "primitives": 82,
          },
          {
            "first": {
              "kind": "streak",
              "length": 0.018,
              "rotation": 0.302,
              "size": 0.003,
              "x": 0.31,
              "y": 0.628,
            },
            "id": "powdered-scrap-dust",
            "kind": "dust",
            "primitives": 54,
          },
          {
            "first": {
              "kind": "plate",
              "length": 0.026,
              "rotation": -0.207,
              "size": 0.019,
              "x": 0.623,
              "y": 0.972,
            },
            "id": "slow-wreck-shards",
            "kind": "debris",
            "primitives": 34,
          },
          {
            "first": {
              "kind": "plate",
              "length": 0.085,
              "rotation": 0.69,
              "size": 0.085,
              "x": 0.711,
              "y": 0.678,
            },
            "id": "near-hull-plates",
            "kind": "wreckPlates",
            "primitives": 12,
          },
        ],
        "primitiveCount": 182,
      }
    `);
  });
});
