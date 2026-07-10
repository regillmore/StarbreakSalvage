import { calculateViewportLayout, viewportPointToCombatPoint } from '../app/ViewportLayout';
import type { Vector2 } from '../core/math';

export type ActiveInputMode = 'none' | 'keyboard' | 'pointer';

export const INPUT_ACTIONS = [
  'moveUp',
  'moveDown',
  'moveLeft',
  'moveRight',
  'confirm',
  'fire',
  'special',
  'bomb',
  'pause',
  'back',
  'debugGameOver',
  'debugBossOne',
  'debugBossTwo',
  'debugBossThree',
  'debugBossFour',
  'debugBossFive',
  'debugItemStorm',
  'debugDenseCombat',
  'debugEnemyRich',
  'debugEnvironmentStress',
  'debugSectorComplete',
  'debugDestroyPlayer',
  'debugLongScroll',
  'debugActTwoJunction',
  'debugActTwoEntry',
  'debugFinaleSmoke',
  'debugTwoActSummary',
  'debugMissionAnthology',
  'debugMissionOptional'
] as const;

export type InputAction = (typeof INPUT_ACTIONS)[number];
export type KeyBindingMap = Record<InputAction, readonly string[]>;

export interface PointerControlState {
  readonly active: boolean;
  readonly insideFrame: boolean;
  readonly primaryDown: boolean;
  readonly position: Vector2;
  readonly pointerType: string;
}

export const INACTIVE_POINTER_CONTROL_STATE: PointerControlState = {
  active: false,
  insideFrame: false,
  primaryDown: false,
  position: { x: 0, y: 0 },
  pointerType: 'unknown'
};

export const DEFAULT_KEY_BINDINGS: KeyBindingMap = {
  moveUp: ['ArrowUp', 'W'],
  moveDown: ['ArrowDown', 'S'],
  moveLeft: ['ArrowLeft', 'A'],
  moveRight: ['ArrowRight', 'D'],
  fire: [' ', 'Spacebar'],
  special: ['Shift'],
  bomb: ['X'],
  pause: ['Escape', 'P'],
  confirm: ['Enter', ' '],
  back: ['Backspace', 'Escape'],
  debugGameOver: ['K'],
  debugBossOne: ['1'],
  debugBossTwo: ['2'],
  debugBossThree: ['3'],
  debugBossFour: ['4'],
  debugBossFive: ['5'],
  debugItemStorm: ['6'],
  debugDenseCombat: ['0'],
  debugEnemyRich: ['E'],
  debugEnvironmentStress: ['H'],
  debugSectorComplete: ['8'],
  debugDestroyPlayer: ['7'],
  debugLongScroll: ['9'],
  debugActTwoJunction: ['J'],
  debugActTwoEntry: ['I'],
  debugFinaleSmoke: ['F'],
  debugTwoActSummary: ['Y'],
  debugMissionAnthology: ['M'],
  debugMissionOptional: ['N']
};

export function normalizeKey(key: string): string {
  if (key === 'Spacebar') {
    return ' ';
  }

  if (key.length === 1 && key !== ' ') {
    return key.toUpperCase();
  }

  return key;
}

export function actionsForKey(
  key: string,
  bindings: KeyBindingMap = DEFAULT_KEY_BINDINGS
): InputAction[] {
  const normalizedKey = normalizeKey(key);

  return INPUT_ACTIONS.filter((action) =>
    bindings[action].some((boundKey) => normalizeKey(boundKey) === normalizedKey)
  );
}

export function primaryActionForKey(
  key: string,
  bindings: KeyBindingMap = DEFAULT_KEY_BINDINGS
): InputAction | null {
  return actionsForKey(key, bindings)[0] ?? null;
}

export function movementAxisFromActions(actions: ReadonlySet<InputAction>): Vector2 {
  const x = Number(actions.has('moveRight')) - Number(actions.has('moveLeft'));
  const y = Number(actions.has('moveDown')) - Number(actions.has('moveUp'));

  if (x !== 0 && y !== 0) {
    const diagonalScale = Math.SQRT1_2;
    return {
      x: x * diagonalScale,
      y: y * diagonalScale
    };
  }

  return { x, y };
}

export function getPointerGuidanceAxis(
  player: Vector2,
  pointer: PointerControlState,
  deadZone = 10
): Vector2 {
  if (!pointer.active) {
    return { x: 0, y: 0 };
  }

  const dx = pointer.position.x - player.x;
  const dy = pointer.position.y - player.y;
  const distance = Math.hypot(dx, dy);

  if (distance <= deadZone) {
    return { x: 0, y: 0 };
  }

  return {
    x: dx / distance,
    y: dy / distance
  };
}

export function preferKeyboardMovement(keyboard: Vector2, pointer: Vector2): Vector2 {
  return keyboard.x !== 0 || keyboard.y !== 0 ? keyboard : pointer;
}

export class InputSystem {
  private readonly keysDown = new Set<string>();
  private readonly pressedActions = new Set<InputAction>();
  private pointerState: PointerControlState = INACTIVE_POINTER_CONTROL_STATE;
  private activeInputMode: ActiveInputMode = 'none';
  private isStarted = false;

  public constructor(
    private readonly ownerWindow: Window = window,
    private bindings: KeyBindingMap = DEFAULT_KEY_BINDINGS
  ) {}

  public start(): void {
    if (this.isStarted) {
      return;
    }

    this.ownerWindow.addEventListener('keydown', this.handleKeyDown);
    this.ownerWindow.addEventListener('keyup', this.handleKeyUp);
    this.ownerWindow.addEventListener('pointermove', this.handlePointerMove);
    this.ownerWindow.addEventListener('pointerdown', this.handlePointerDown);
    this.ownerWindow.addEventListener('pointerup', this.handlePointerUp);
    this.ownerWindow.addEventListener('pointercancel', this.handlePointerCancel);
    this.ownerWindow.addEventListener('blur', this.handleBlur);
    this.isStarted = true;
  }

  public stop(): void {
    if (!this.isStarted) {
      return;
    }

    this.ownerWindow.removeEventListener('keydown', this.handleKeyDown);
    this.ownerWindow.removeEventListener('keyup', this.handleKeyUp);
    this.ownerWindow.removeEventListener('pointermove', this.handlePointerMove);
    this.ownerWindow.removeEventListener('pointerdown', this.handlePointerDown);
    this.ownerWindow.removeEventListener('pointerup', this.handlePointerUp);
    this.ownerWindow.removeEventListener('pointercancel', this.handlePointerCancel);
    this.ownerWindow.removeEventListener('blur', this.handleBlur);
    this.keysDown.clear();
    this.pressedActions.clear();
    this.pointerState = INACTIVE_POINTER_CONTROL_STATE;
    this.activeInputMode = 'none';
    this.isStarted = false;
  }

  public setBindings(bindings: KeyBindingMap): void {
    this.bindings = bindings;
    this.keysDown.clear();
    this.pressedActions.clear();
  }

  public isActionPressed(action: InputAction): boolean {
    return this.bindings[action].some((key) => this.keysDown.has(normalizeKey(key)));
  }

  public getHeldActions(): ReadonlySet<InputAction> {
    const held = new Set<InputAction>();

    for (const action of INPUT_ACTIONS) {
      if (this.isActionPressed(action)) {
        held.add(action);
      }
    }

    return held;
  }

  public getMovementAxis(): Vector2 {
    return movementAxisFromActions(this.getHeldActions());
  }

  public getPointerControlState(): PointerControlState {
    return this.pointerState;
  }

  public isPointerFirePressed(): boolean {
    return this.pointerState.active && this.pointerState.primaryDown;
  }

  public getActiveInputMode(): ActiveInputMode {
    return this.activeInputMode;
  }

  public drainPressedActions(): InputAction[] {
    const actions = [...this.pressedActions];
    this.pressedActions.clear();
    return actions;
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (shouldIgnoreKeyboardEvent(event)) {
      return;
    }

    const normalizedKey = normalizeKey(event.key);
    const action = primaryActionForKey(normalizedKey, this.bindings);
    const mappedActions = actionsForKey(normalizedKey, this.bindings);

    if (mappedActions.length === 0) {
      return;
    }

    event.preventDefault();
    this.keysDown.add(normalizedKey);
    this.activeInputMode = 'keyboard';

    if (!event.repeat && action) {
      this.pressedActions.add(action);
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    const mappedActions = actionsForKey(event.key, this.bindings);

    if (mappedActions.length > 0) {
      event.preventDefault();
      this.keysDown.delete(normalizeKey(event.key));
    }
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (shouldIgnorePointerEvent(event) && !this.pointerState.primaryDown) {
      this.clearPointerState();
      return;
    }

    this.updatePointerState(event);
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }

    if (shouldIgnorePointerEvent(event)) {
      this.clearPointerState();
      return;
    }

    this.updatePointerState(event, true);

    if (this.pointerState.insideFrame) {
      event.preventDefault();
    }
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }

    if (shouldIgnorePointerEvent(event)) {
      this.clearPointerState();
      return;
    }

    this.updatePointerState(event, false);
  };

  private readonly handlePointerCancel = (): void => {
    this.clearPointerState();
  };

  private readonly handleBlur = (): void => {
    this.keysDown.clear();
    this.pressedActions.clear();
    this.clearPointerState();
    this.activeInputMode = 'none';
  };

  private updatePointerState(
    event: PointerEvent,
    primaryDown = this.pointerState.primaryDown
  ): void {
    const layout = calculateViewportLayout({
      width: this.ownerWindow.innerWidth,
      height: this.ownerWindow.innerHeight,
      dpr: this.ownerWindow.devicePixelRatio || 1
    });
    const position = viewportPointToCombatPoint(layout, {
      x: event.clientX,
      y: event.clientY
    });
    const active = position.insideFrame || primaryDown;

    this.pointerState = {
      active,
      insideFrame: position.insideFrame,
      primaryDown,
      position: {
        x: position.x,
        y: position.y
      },
      pointerType: event.pointerType || 'unknown'
    };

    if (active) {
      this.activeInputMode = 'pointer';
    }
  }

  private clearPointerState(): void {
    this.pointerState = INACTIVE_POINTER_CONTROL_STATE;

    if (this.activeInputMode === 'pointer') {
      this.activeInputMode = 'none';
    }
  }
}

function shouldIgnoreKeyboardEvent(event: KeyboardEvent): boolean {
  const target = event.target;

  if (!(target instanceof Element)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  if (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    (target instanceof HTMLElement && target.isContentEditable)
  ) {
    return true;
  }

  return isNativeActivationKey(event.key) && isNativeActivationTarget(target);
}

function shouldIgnorePointerEvent(event: PointerEvent): boolean {
  const target = event.target;

  if (!(target instanceof Element)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return (
    target.closest('.ui-layer') !== null ||
    tagName === 'button' ||
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    tagName === 'label' ||
    target.closest('[role="button"]') !== null ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

function isNativeActivationKey(key: string): boolean {
  return key === 'Enter' || key === ' ' || key === 'Space' || key === 'Spacebar';
}

function isNativeActivationTarget(target: Element): boolean {
  return target.closest('button, [role="button"]') !== null;
}
