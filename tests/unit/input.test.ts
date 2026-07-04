import { describe, expect, it } from 'vitest';

import {
  actionsForKey,
  DEFAULT_KEY_BINDINGS,
  movementAxisFromActions,
  normalizeKey,
  primaryActionForKey
} from '../../src/systems/InputSystem';
import type { InputAction } from '../../src/systems/InputSystem';

describe('input helpers', () => {
  it('normalizes letter keys and legacy space labels', () => {
    expect(normalizeKey('w')).toBe('W');
    expect(normalizeKey('W')).toBe('W');
    expect(normalizeKey('Spacebar')).toBe(' ');
  });

  it('maps physical keys to gameplay actions', () => {
    expect(actionsForKey('ArrowUp')).toContain('moveUp');
    expect(actionsForKey('a')).toContain('moveLeft');
    expect(actionsForKey('Enter')).toEqual(['confirm']);
    expect(primaryActionForKey(' ')).toBe('confirm');
    expect(primaryActionForKey('Escape')).toBe('pause');
    expect(primaryActionForKey('1')).toBe('debugBossOne');
    expect(primaryActionForKey('4')).toBe('debugBossFour');
    expect(primaryActionForKey('5')).toBe('debugBossFive');
    expect(primaryActionForKey('0')).toBe('debugDenseCombat');
  });

  it('uses provided binding maps for action lookup', () => {
    expect(actionsForKey('F', { ...DEFAULT_KEY_BINDINGS, fire: ['F'] })).toEqual(['fire']);
  });

  it('normalizes diagonal movement speed', () => {
    const actions = new Set<InputAction>(['moveUp', 'moveRight']);
    const axis = movementAxisFromActions(actions);

    expect(axis.x).toBeCloseTo(Math.SQRT1_2);
    expect(axis.y).toBeCloseTo(-Math.SQRT1_2);
  });
});
