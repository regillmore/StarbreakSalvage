import { clamp } from '../core/math';

export type ThermalBand = 'cold' | 'working' | 'hot' | 'critical' | 'overheated';

export const THERMAL_HOT_RATIO = 0.6;
export const THERMAL_CRITICAL_RATIO = 0.85;
export const HEAT_SINK_GENERATION_MULTIPLIER = 0.7;
export const HEAT_SINK_VENT_MULTIPLIER = 1.35;
export const HEAT_SINK_HOT_SPEND_RATIO = 0.06;
export const PLASMA_SEED_GENERATION_RATIO = 0.08;
export const OVERHEAT_ORACLE_FLOW_RATIO = 0.18;

export function getThermalRatio(heat: number, capacity: number): number {
  return capacity > 0 ? clamp(heat / capacity, 0, 1) : 0;
}

export function getThermalBand(heat: number, capacity: number, overheatSeconds = 0): ThermalBand {
  if (capacity <= 0) return 'cold';
  if (overheatSeconds > 0 || heat >= capacity) return 'overheated';
  const ratio = getThermalRatio(heat, capacity);
  if (ratio >= THERMAL_CRITICAL_RATIO) return 'critical';
  if (ratio >= THERMAL_HOT_RATIO) return 'hot';
  if (ratio >= 0.25) return 'working';
  return 'cold';
}

export function formatThermalBand(band: ThermalBand): string {
  switch (band) {
    case 'overheated':
      return 'OVERHEAT';
    case 'critical':
      return 'CRITICAL';
    case 'hot':
      return 'HOT';
    case 'working':
      return 'WORKING';
    case 'cold':
      return 'COLD';
  }
}
