import { describe, expect, it } from 'vitest';

import { circlesOverlap } from '../../src/systems/CollisionSystem';

describe('circlesOverlap', () => {
  it('detects overlapping and touching circles', () => {
    expect(circlesOverlap({ x: 0, y: 0, radius: 4 }, { x: 7, y: 0, radius: 3 })).toBe(true);
    expect(circlesOverlap({ x: 0, y: 0, radius: 4 }, { x: 8, y: 0, radius: 3 })).toBe(false);
  });

  it('treats negative radii as zero', () => {
    expect(circlesOverlap({ x: 0, y: 0, radius: -4 }, { x: 0, y: 0, radius: 0 })).toBe(true);
    expect(circlesOverlap({ x: 0, y: 0, radius: -4 }, { x: 1, y: 0, radius: 0 })).toBe(false);
  });
});
