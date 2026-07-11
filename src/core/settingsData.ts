import {
  DEFAULT_KEY_BINDINGS,
  INPUT_ACTIONS,
  normalizeKey,
  type InputAction,
  type KeyBindingMap
} from '../systems/InputSystem';

export const SETTINGS_STORAGE_KEY = 'starbreak.settings.v1';
export const SETTINGS_SCHEMA_VERSION = 1;

export const REMAPPABLE_ACTIONS = [
  'moveUp',
  'moveDown',
  'moveLeft',
  'moveRight',
  'fire',
  'special',
  'bomb',
  'crewFocus',
  'crewScreen',
  'crewSalvage',
  'crewRegroup',
  'crewDisengage',
  'pause',
  'confirm',
  'back'
] as const satisfies readonly InputAction[];

export type RemappableAction = (typeof REMAPPABLE_ACTIONS)[number];
export type BulletContrast = 'standard' | 'high';

export interface GameSettings {
  readonly version: typeof SETTINGS_SCHEMA_VERSION;
  readonly keyBindings: Record<RemappableAction, string>;
  readonly muted: boolean;
  readonly masterVolume: number;
  readonly reducedMotion: boolean;
  readonly screenShake: number;
  readonly bulletContrast: BulletContrast;
  readonly fullscreenPreferred: boolean;
  readonly performanceMode: boolean;
}

export interface SettingsLoadResult {
  readonly data: GameSettings;
  readonly repaired: boolean;
  readonly error: string | null;
}

export interface SettingsStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createDefaultSettings(): GameSettings {
  return {
    version: SETTINGS_SCHEMA_VERSION,
    keyBindings: {
      moveUp: 'W',
      moveDown: 'S',
      moveLeft: 'A',
      moveRight: 'D',
      fire: ' ',
      special: 'Shift',
      bomb: 'X',
      crewFocus: 'L',
      crewScreen: 'C',
      crewSalvage: 'V',
      crewRegroup: 'O',
      crewDisengage: 'Z',
      pause: 'P',
      confirm: 'Enter',
      back: 'Escape'
    },
    muted: false,
    masterVolume: 0.8,
    reducedMotion: false,
    screenShake: 0.35,
    bulletContrast: 'standard',
    fullscreenPreferred: false,
    performanceMode: false
  };
}

export function loadSettingsData(storage: SettingsStorageLike): SettingsLoadResult {
  const raw = storage.getItem(SETTINGS_STORAGE_KEY);

  if (!raw) {
    return { data: createDefaultSettings(), repaired: false, error: null };
  }

  try {
    return { data: importSettingsData(raw), repaired: false, error: null };
  } catch (error) {
    return {
      data: createDefaultSettings(),
      repaired: true,
      error: error instanceof Error ? error.message : 'Settings could not be loaded.'
    };
  }
}

export function writeSettingsData(storage: SettingsStorageLike, data: GameSettings): void {
  storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data, null, 2));
}

export function importSettingsData(serialized: string): GameSettings {
  const parsed: unknown = JSON.parse(serialized);

  if (!isRecord(parsed)) {
    throw new Error('Settings payload must be an object.');
  }

  if (parsed.version !== SETTINGS_SCHEMA_VERSION) {
    throw new Error(`Unsupported settings version: ${String(parsed.version)}`);
  }

  return normalizeSettings(parsed);
}

export function updateKeyBinding(
  settings: GameSettings,
  action: RemappableAction,
  key: string
): GameSettings {
  return {
    ...settings,
    keyBindings: {
      ...settings.keyBindings,
      [action]: normalizeKey(key)
    }
  };
}

export function settingsToKeyBindingMap(settings: GameSettings): KeyBindingMap {
  const keyBindings: KeyBindingMap = { ...DEFAULT_KEY_BINDINGS };
  const defaultSettings = createDefaultSettings();

  for (const action of REMAPPABLE_ACTIONS) {
    const key = settings.keyBindings[action];

    if (key === defaultSettings.keyBindings[action]) {
      keyBindings[action] = DEFAULT_KEY_BINDINGS[action];
      continue;
    }

    keyBindings[action] = key === ' ' ? [' ', 'Spacebar'] : [key];
  }

  return keyBindings;
}

export function formatKeyLabel(key: string): string {
  if (key === ' ') {
    return 'Space';
  }

  return key;
}

function normalizeSettings(input: Record<string, unknown>): GameSettings {
  const defaults = createDefaultSettings();
  const inputBindings = isRecord(input.keyBindings) ? input.keyBindings : {};

  return {
    version: SETTINGS_SCHEMA_VERSION,
    keyBindings: REMAPPABLE_ACTIONS.reduce<Record<RemappableAction, string>>(
      (bindings, action) => ({
        ...bindings,
        [action]: sanitizeKey(inputBindings[action], defaults.keyBindings[action])
      }),
      { ...defaults.keyBindings }
    ),
    muted: typeof input.muted === 'boolean' ? input.muted : defaults.muted,
    masterVolume: sanitizeUnit(input.masterVolume, defaults.masterVolume),
    reducedMotion:
      typeof input.reducedMotion === 'boolean' ? input.reducedMotion : defaults.reducedMotion,
    screenShake: sanitizeUnit(input.screenShake, defaults.screenShake),
    bulletContrast: input.bulletContrast === 'high' ? 'high' : 'standard',
    fullscreenPreferred:
      typeof input.fullscreenPreferred === 'boolean'
        ? input.fullscreenPreferred
        : defaults.fullscreenPreferred,
    performanceMode:
      typeof input.performanceMode === 'boolean' ? input.performanceMode : defaults.performanceMode
  };
}

function sanitizeKey(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    return fallback;
  }

  return normalizeKey(value);
}

function sanitizeUnit(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(1, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isRemappableAction(action: InputAction): action is RemappableAction {
  return (REMAPPABLE_ACTIONS as readonly InputAction[]).includes(action);
}

export function getVisibleRemapActions(): readonly RemappableAction[] {
  return REMAPPABLE_ACTIONS;
}

export function getAllInputActions(): readonly InputAction[] {
  return INPUT_ACTIONS;
}
