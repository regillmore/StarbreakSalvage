import type { ShipAppearance } from '../content/ships';
import type { BulletContrast } from '../core/settingsData';
import { clamp } from '../core/math';

const DAMAGE_INVULNERABILITY_REFERENCE_SECONDS = 0.55;
const HIGH_HEAT_THRESHOLD = 0.72;

export interface PlayerShipCueInput {
  readonly appearance: ShipAppearance;
  readonly thrust: number;
  readonly hull: number;
  readonly maxHull: number;
  readonly invulnerableSeconds: number;
  readonly specialCharge: number;
  readonly maxSpecialCharge: number;
  readonly specialCooldown: number;
  readonly specialActiveSeconds: number;
  readonly bombs: number;
  readonly maxBombs: number;
  readonly bombCooldown: number;
  readonly weaponHeat: number;
  readonly weaponOverheatLimit: number;
  readonly weaponOverheatSeconds: number;
}

export interface PlayerShipCueOptions {
  readonly reducedMotion: boolean;
  readonly performanceMode: boolean;
  readonly bulletContrast: BulletContrast;
}

export interface PlayerShipCueState {
  readonly bodyAlpha: number;
  readonly wakeAlpha: number;
  readonly wakeLengthScale: number;
  readonly damageFlashAlpha: number;
  readonly invulnerabilityRingAlpha: number;
  readonly specialReadyAlpha: number;
  readonly specialActiveAlpha: number;
  readonly bombReadyAlpha: number;
  readonly heatStressAlpha: number;
  readonly overheatAlpha: number;
  readonly wakeColor: string;
  readonly damageColor: string;
  readonly invulnerabilityColor: string;
  readonly specialColor: string;
  readonly bombColor: string;
  readonly heatColor: string;
  readonly hitRingColor: string;
}

export function getPlayerShipCueState(
  input: PlayerShipCueInput,
  options: PlayerShipCueOptions
): PlayerShipCueState {
  const cueScale = getCueScale(options);
  const thrust = clamp(input.thrust, 0, 1);
  const hullRatio = normalizeRatio(input.hull, input.maxHull);
  const hullStress = 1 - hullRatio;
  const invulnerabilityRatio = clamp(
    input.invulnerableSeconds / DAMAGE_INVULNERABILITY_REFERENCE_SECONDS,
    0,
    1
  );
  const specialRatio = normalizeRatio(input.specialCharge, input.maxSpecialCharge);
  const heatRatio = normalizeRatio(input.weaponHeat, input.weaponOverheatLimit);
  const specialReady = specialRatio >= 1 && input.specialCooldown <= 0;
  const bombReady = input.bombs > 0 && input.maxBombs > 0 && input.bombCooldown <= 0;
  const heatStress =
    heatRatio > HIGH_HEAT_THRESHOLD
      ? (heatRatio - HIGH_HEAT_THRESHOLD) / (1 - HIGH_HEAT_THRESHOLD)
      : 0;
  const damageFlash = hullStress > 0 ? invulnerabilityRatio * 0.34 + hullStress * 0.2 : 0;
  const isHighContrast = options.bulletContrast === 'high';
  const invulnerabilityRingAlpha =
    input.invulnerableSeconds > 0 ? (0.3 + invulnerabilityRatio * 0.42) * cueScale : 0;
  const bodyAlpha =
    input.invulnerableSeconds > 0 ? clamp(0.76 - invulnerabilityRatio * 0.18, 0.58, 0.76) : 1;

  return {
    bodyAlpha: roundCueValue(bodyAlpha),
    wakeAlpha: roundCueValue((0.2 + thrust * 0.8) * cueScale),
    wakeLengthScale: roundCueValue(
      (0.86 + thrust * 0.62 + (input.specialActiveSeconds > 0 ? 0.12 : 0)) *
        (options.reducedMotion ? 0.74 : 1)
    ),
    damageFlashAlpha: roundCueValue(Math.min(0.58, damageFlash * cueScale)),
    invulnerabilityRingAlpha: roundCueValue(invulnerabilityRingAlpha),
    specialReadyAlpha: specialReady ? roundCueValue(0.52 * cueScale) : 0,
    specialActiveAlpha:
      input.specialActiveSeconds > 0 ? roundCueValue(0.62 * cueScale) : 0,
    bombReadyAlpha: bombReady
      ? roundCueValue((0.32 + Math.min(input.bombs, 3) * 0.07) * cueScale)
      : 0,
    heatStressAlpha: roundCueValue(heatStress * 0.58 * cueScale),
    overheatAlpha: input.weaponOverheatSeconds > 0 ? roundCueValue(0.74 * cueScale) : 0,
    wakeColor: input.appearance.engineColor,
    damageColor: isHighContrast ? '#ffef5f' : '#ff5d6c',
    invulnerabilityColor: isHighContrast ? '#f8fbff' : input.appearance.trimColor,
    specialColor: isHighContrast ? '#ffef5f' : input.appearance.cockpitAccent,
    bombColor: isHighContrast ? '#f8fbff' : input.appearance.trimColor,
    heatColor: isHighContrast ? '#ffd166' : input.appearance.engineColor,
    hitRingColor: isHighContrast ? '#f8fbff' : '#f8fbff'
  };
}

function getCueScale(options: PlayerShipCueOptions): number {
  const motionScale = options.reducedMotion ? 0.44 : options.performanceMode ? 0.72 : 1;
  const contrastScale = options.bulletContrast === 'high' ? 0.82 : 1;
  return motionScale * contrastScale;
}

function normalizeRatio(value: number, max: number): number {
  return max > 0 ? clamp(value / max, 0, 1) : 0;
}

function roundCueValue(value: number): number {
  return Math.round(value * 1000) / 1000;
}
