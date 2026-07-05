import type { ShipAppearance, ShipHudThemeKey } from '../content/ships';
import type { BulletContrast } from '../core/settingsData';
import { clamp } from '../core/math';

export type HudThemeMode = 'standard' | 'quiet' | 'contrast';

export interface HudThemeOptions {
  readonly reducedMotion: boolean;
  readonly bulletContrast: BulletContrast;
  readonly performanceMode: boolean;
}

export interface HudThemeModel {
  readonly themeKey: ShipHudThemeKey;
  readonly label: string;
  readonly mode: HudThemeMode;
  readonly cssVariables: Readonly<Record<string, string>>;
}

export interface HudMeterModel {
  readonly ratio: number;
  readonly percent: number;
  readonly width: string;
}

const DEFAULT_THEME_OPTIONS: HudThemeOptions = {
  reducedMotion: false,
  bulletContrast: 'standard',
  performanceMode: false
};

export function createHudThemeModel(
  appearance: ShipAppearance,
  options: HudThemeOptions = DEFAULT_THEME_OPTIONS
): HudThemeModel {
  const isHighContrast = options.bulletContrast === 'high';
  const mode: HudThemeMode = isHighContrast
    ? 'contrast'
    : options.reducedMotion || options.performanceMode
      ? 'quiet'
      : 'standard';
  const glowAlpha = mode === 'standard' ? '0.34' : mode === 'quiet' ? '0.16' : '0';
  const glowMix = mode === 'standard' ? '34%' : mode === 'quiet' ? '16%' : '0%';
  const panelAlpha = mode === 'standard' ? '0.76' : '0.86';

  return {
    themeKey: appearance.hudThemeKey,
    label: `${appearance.hudThemeKey.toUpperCase()} COCKPIT`,
    mode,
    cssVariables: {
      '--hud-primary': isHighContrast ? '#f8fbff' : appearance.primaryColor,
      '--hud-secondary': isHighContrast ? '#071016' : appearance.secondaryColor,
      '--hud-trim': isHighContrast ? '#f8fbff' : appearance.trimColor,
      '--hud-engine': isHighContrast ? '#ffd166' : appearance.engineColor,
      '--hud-cockpit': isHighContrast ? '#ffef5f' : appearance.cockpitAccent,
      '--hud-warning': isHighContrast ? '#ffef5f' : appearance.cockpitAccent,
      '--hud-panel-alpha': panelAlpha,
      '--hud-glow-alpha': glowAlpha,
      '--hud-glow-mix': glowMix
    }
  };
}

export function createHudMeterModel(value: number, max: number): HudMeterModel {
  const ratio = max > 0 ? clamp(value / max, 0, 1) : 0;
  const percent = Math.round(ratio * 100);

  return {
    ratio,
    percent,
    width: `${percent}%`
  };
}
