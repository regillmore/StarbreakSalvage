import { describe, expect, it } from 'vitest';

import {
  actionsForKey,
  DEFAULT_KEY_BINDINGS,
  getPointerGuidanceAxis,
  INACTIVE_POINTER_CONTROL_STATE,
  movementAxisFromActions,
  normalizeKey,
  preferKeyboardMovement,
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
    expect(primaryActionForKey('8')).toBe('debugSectorComplete');
    expect(primaryActionForKey('9')).toBe('debugLongScroll');
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

  it('derives pointer guidance only outside the dead zone', () => {
    expect(
      getPointerGuidanceAxis(
        { x: 320, y: 560 },
        { ...INACTIVE_POINTER_CONTROL_STATE, active: true, position: { x: 326, y: 564 } }
      )
    ).toEqual({ x: 0, y: 0 });

    const axis = getPointerGuidanceAxis(
      { x: 320, y: 560 },
      { ...INACTIVE_POINTER_CONTROL_STATE, active: true, position: { x: 420, y: 560 } }
    );

    expect(axis.x).toBeCloseTo(1);
    expect(axis.y).toBeCloseTo(0);
  });

  it('keeps keyboard movement authoritative over pointer guidance', () => {
    const keyboard = { x: -1, y: 0 };
    const pointer = { x: 1, y: 0 };

    expect(preferKeyboardMovement(keyboard, pointer)).toBe(keyboard);
    expect(preferKeyboardMovement({ x: 0, y: 0 }, pointer)).toBe(pointer);
  });
});
