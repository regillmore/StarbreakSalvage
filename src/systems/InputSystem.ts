import type { Vector2 } from '../core/math';

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
  'debugDenseCombat'
] as const;

export type InputAction = (typeof INPUT_ACTIONS)[number];
export type KeyBindingMap = Record<InputAction, readonly string[]>;

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
  debugDenseCombat: ['0']
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

export class InputSystem {
  private readonly keysDown = new Set<string>();
  private readonly pressedActions = new Set<InputAction>();
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
    this.ownerWindow.addEventListener('blur', this.handleBlur);
    this.isStarted = true;
  }

  public stop(): void {
    if (!this.isStarted) {
      return;
    }

    this.ownerWindow.removeEventListener('keydown', this.handleKeyDown);
    this.ownerWindow.removeEventListener('keyup', this.handleKeyUp);
    this.ownerWindow.removeEventListener('blur', this.handleBlur);
    this.keysDown.clear();
    this.pressedActions.clear();
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

  private readonly handleBlur = (): void => {
    this.keysDown.clear();
    this.pressedActions.clear();
  };
}

function shouldIgnoreKeyboardEvent(event: KeyboardEvent): boolean {
  const target = event.target;

  if (!(target instanceof Element)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}
