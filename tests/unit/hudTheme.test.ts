import { describe, expect, it } from 'vitest';

import { generateRunSkeleton } from '../../src/game/Generation';
import { createHudMeterModel, createHudThemeModel } from '../../src/ui/HudTheme';

describe('HUD theme helpers', () => {
  it('derives cockpit theme variables from selected ship appearance', () => {
    const contract = generateRunSkeleton('STARBREAK-SMOKE', {
      unlockedIds: []
    }).contracts.find((candidate) => candidate.shipName === 'Missile Accountant');

    if (!contract) {
      throw new Error('STARBREAK-SMOKE should include Missile Accountant.');
    }

    const model = createHudThemeModel(contract.shipAppearance);

    expect(model.themeKey).toBe(contract.shipAppearance.hudThemeKey);
    expect(model.label).toBe('LEDGER COCKPIT');
    expect(model.mode).toBe('standard');
    expect(model.cssVariables['--hud-primary']).toBe(contract.shipAppearance.primaryColor);
    expect(model.cssVariables['--hud-engine']).toBe(contract.shipAppearance.engineColor);
    expect(model.cssVariables['--hud-cockpit']).toBe(contract.shipAppearance.cockpitAccent);
  });

  it('simplifies cockpit treatment for high-contrast display mode', () => {
    const contract = generateRunSkeleton('STARBREAK-SMOKE').contracts[0];

    if (!contract) {
      throw new Error('Expected at least one contract.');
    }

    const model = createHudThemeModel(contract.shipAppearance, {
      reducedMotion: true,
      bulletContrast: 'high',
      performanceMode: true
    });

    expect(model.mode).toBe('contrast');
    expect(model.cssVariables['--hud-primary']).toBe('#f8fbff');
    expect(model.cssVariables['--hud-glow-alpha']).toBe('0');
    expect(model.cssVariables['--hud-glow-mix']).toBe('0%');
    expect(model.cssVariables['--hud-warning']).toBe('#ffef5f');
  });

  it('clamps meter fill percentages for DOM meters', () => {
    expect(createHudMeterModel(1, 4)).toEqual({
      ratio: 0.25,
      percent: 25,
      width: '25%'
    });
    expect(createHudMeterModel(7, 4).width).toBe('100%');
    expect(createHudMeterModel(-1, 4).width).toBe('0%');
    expect(createHudMeterModel(1, 0).width).toBe('0%');
  });
});
