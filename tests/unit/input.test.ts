import { describe, expect, it } from 'vitest';

import {
  actionsForKey,
  DEFAULT_KEY_BINDINGS,
  getPointerGuidanceAxis,
  INACTIVE_POINTER_CONTROL_STATE,
  mapViewportPointerControlState,
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
    expect(primaryActionForKey('6')).toBe('debugItemStorm');
    expect(primaryActionForKey('0')).toBe('debugDenseCombat');
    expect(primaryActionForKey('E')).toBe('debugEnemyRich');
    expect(primaryActionForKey('H')).toBe('debugEnvironmentStress');
    expect(primaryActionForKey('U')).toBe('debugSetPiece');
    expect(primaryActionForKey('R')).toBe('debugRivalCampaign');
    expect(primaryActionForKey('T')).toBe('debugCrewWing');
    expect(primaryActionForKey('B')).toBe('debugScenarioLab');
    expect(primaryActionForKey('L')).toBe('crewFocus');
    expect(primaryActionForKey('C')).toBe('crewScreen');
    expect(primaryActionForKey('V')).toBe('crewSalvage');
    expect(primaryActionForKey('O')).toBe('crewRegroup');
    expect(primaryActionForKey('Z')).toBe('crewDisengage');
    expect(primaryActionForKey('7')).toBe('debugDestroyPlayer');
    expect(primaryActionForKey('8')).toBe('debugSectorComplete');
    expect(primaryActionForKey('9')).toBe('debugLongScroll');
    expect(primaryActionForKey('J')).toBe('debugActTwoJunction');
    expect(primaryActionForKey('I')).toBe('debugActTwoEntry');
    expect(primaryActionForKey('F')).toBe('debugFinaleSmoke');
    expect(primaryActionForKey('Y')).toBe('debugTwoActSummary');
    expect(primaryActionForKey('M')).toBe('debugMissionAnthology');
    expect(primaryActionForKey('N')).toBe('debugMissionOptional');
  });

  it('uses provided binding maps for action lookup', () => {
    expect(actionsForKey('G', { ...DEFAULT_KEY_BINDINGS, fire: ['G'] })).toEqual(['fire']);
    expect(actionsForKey('B', { ...DEFAULT_KEY_BINDINGS, bomb: ['B'] })).toEqual(['bomb']);
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

  it('guides toward a projected arena-edge target outside the frame', () => {
    const axis = getPointerGuidanceAxis(
      { x: 598, y: 560 },
      {
        ...INACTIVE_POINTER_CONTROL_STATE,
        active: true,
        insideFrame: false,
        position: { x: 640, y: 320 }
      }
    );

    expect(axis.x).toBeGreaterThan(0);
    expect(axis.y).toBeLessThan(0);
  });

  it('keeps pointer control active across the browser viewport', () => {
    const pointer = mapViewportPointerControlState(
      {
        canvasScale: 1,
        gameplaySafeFrame: { x: 100, y: 50, width: 640, height: 720 }
      },
      { x: 980, y: 300 },
      false,
      'mouse'
    );

    expect(pointer).toEqual({
      active: true,
      insideFrame: false,
      primaryDown: false,
      position: { x: 640, y: 250 },
      pointerType: 'mouse'
    });
  });

  it('keeps keyboard movement authoritative over pointer guidance', () => {
    const keyboard = { x: -1, y: 0 };
    const pointer = { x: 1, y: 0 };

    expect(preferKeyboardMovement(keyboard, pointer)).toBe(keyboard);
    expect(preferKeyboardMovement({ x: 0, y: 0 }, pointer)).toBe(pointer);
  });
});
