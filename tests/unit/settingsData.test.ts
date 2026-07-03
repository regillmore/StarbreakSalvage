import { describe, expect, it } from 'vitest';

import {
  createDefaultSettings,
  importSettingsData,
  loadSettingsData,
  SETTINGS_SCHEMA_VERSION,
  SETTINGS_STORAGE_KEY,
  settingsToKeyBindingMap,
  updateKeyBinding,
  writeSettingsData,
  type SettingsStorageLike
} from '../../src/core/settingsData';
import { actionsForKey } from '../../src/systems/InputSystem';

class MemoryStorage implements SettingsStorageLike {
  private readonly entries = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }

  public removeItem(key: string): void {
    this.entries.delete(key);
  }
}

describe('settingsData', () => {
  it('creates versioned defaults', () => {
    const settings = createDefaultSettings();

    expect(settings.version).toBe(SETTINGS_SCHEMA_VERSION);
    expect(settings.keyBindings.fire).toBe(' ');
    expect(settings.masterVolume).toBeGreaterThan(0);
  });

  it('loads corrupted settings safely', () => {
    const storage = new MemoryStorage();
    storage.setItem(SETTINGS_STORAGE_KEY, '{bad json');

    const loaded = loadSettingsData(storage);

    expect(loaded.repaired).toBe(true);
    expect(loaded.data).toEqual(createDefaultSettings());
  });

  it('normalizes imported settings and clamps numeric options', () => {
    const settings = importSettingsData(
      JSON.stringify({
        version: 1,
        keyBindings: { fire: 'f' },
        muted: true,
        masterVolume: 8,
        reducedMotion: true,
        screenShake: -3,
        bulletContrast: 'high',
        fullscreenPreferred: true,
        performanceMode: true
      })
    );

    expect(settings.keyBindings.fire).toBe('F');
    expect(settings.muted).toBe(true);
    expect(settings.masterVolume).toBe(1);
    expect(settings.screenShake).toBe(0);
    expect(settings.bulletContrast).toBe('high');
  });

  it('turns remapped settings into input bindings', () => {
    const settings = updateKeyBinding(createDefaultSettings(), 'fire', 'F');
    const bindings = settingsToKeyBindingMap(settings);

    expect(actionsForKey('ArrowRight', settingsToKeyBindingMap(createDefaultSettings()))).toContain(
      'moveRight'
    );
    expect(actionsForKey('F', bindings)).toContain('fire');
    expect(actionsForKey(' ', bindings)).not.toContain('fire');
    expect(actionsForKey(' ', bindings)).toContain('confirm');
  });

  it('writes settings through storage', () => {
    const storage = new MemoryStorage();
    const settings = { ...createDefaultSettings(), muted: true };

    writeSettingsData(storage, settings);

    expect(loadSettingsData(storage).data.muted).toBe(true);
  });
});
