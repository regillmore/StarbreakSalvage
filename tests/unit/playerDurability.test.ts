import { describe, expect, it } from 'vitest';

import {
  applyPlayerDurabilityDamage,
  createPlayerGuardCapacity,
  normalizeIncomingPlayerDamage,
  normalizePlayerHull
} from '../../src/game/PlayerDurability';

describe('PlayerDurability', () => {
  it('repairs legacy fractional hull upward to the nearest surviving integer', () => {
    expect(normalizePlayerHull(0.7680000000000002, 4)).toBe(1);
    expect(normalizePlayerHull(3.2, 4)).toBe(4);
    expect(normalizePlayerHull(-1, 4)).toBe(0);
  });

  it('quantizes every positive player-facing hit to a whole damage point', () => {
    expect(normalizeIncomingPlayerDamage(0.55)).toBe(1);
    expect(normalizeIncomingPlayerDamage(1.6)).toBe(2);
    expect(normalizeIncomingPlayerDamage(0)).toBe(0);
  });

  it('translates fractional mitigation into a whole guard buffer with equivalent durability', () => {
    expect(createPlayerGuardCapacity(4, 0.768)).toBe(2);
    expect(createPlayerGuardCapacity(4, 0.6)).toBe(3);
    expect(createPlayerGuardCapacity(4, 1)).toBe(0);
  });

  it('spends guard before hull without introducing fractional state', () => {
    expect(applyPlayerDurabilityDamage(4, 2, 1)).toEqual({
      incomingDamage: 1,
      guardAbsorbed: 1,
      hullDamage: 0,
      hull: 4,
      guard: 1,
      destroyed: false
    });
    expect(applyPlayerDurabilityDamage(4, 1, 2)).toEqual({
      incomingDamage: 2,
      guardAbsorbed: 1,
      hullDamage: 1,
      hull: 3,
      guard: 0,
      destroyed: false
    });
  });
});
