import { describe, expect, it } from 'vitest';

import { formatThermalBand, getThermalBand, getThermalRatio } from '../../src/game/ThermalCircuit';

describe('thermal circuit read model', () => {
  it('uses shared bounded thresholds for simulation and combat feedback', () => {
    expect(getThermalRatio(3, 2)).toBe(1);
    expect(getThermalBand(0, 0)).toBe('cold');
    expect(getThermalBand(0.2, 1)).toBe('cold');
    expect(getThermalBand(0.4, 1)).toBe('working');
    expect(getThermalBand(0.6, 1)).toBe('hot');
    expect(getThermalBand(0.85, 1)).toBe('critical');
    expect(getThermalBand(1, 1)).toBe('overheated');
    expect(getThermalBand(0.1, 1, 0.4)).toBe('overheated');
    expect(formatThermalBand('critical')).toBe('CRITICAL');
  });
});
