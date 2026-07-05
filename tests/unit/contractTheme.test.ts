import { describe, expect, it } from 'vitest';

import {
  createContractScreenThemeModel,
  createContractThemeDebugState,
  formatContractThemeSummary
} from '../../src/ui/ContractTheme';
import { generateRunSkeleton } from '../../src/game/Generation';

describe('contract screen theme helpers', () => {
  it('derives reusable screen variables and labels from the selected contract', () => {
    const contract = getContractByShipName('STARBREAK-SMOKE', 'Missile Accountant');
    const model = createContractScreenThemeModel(contract);

    expect(model.shipId).toBe(contract.shipId);
    expect(model.shipName).toBe('Missile Accountant');
    expect(model.themeKey).toBe(contract.shipAppearance.hudThemeKey);
    expect(model.label).toBe('LEDGER CONTRACT');
    expect(model.debugLabel).toBe('Missile Accountant/ledger');
    expect(model.cssVariables['--screen-primary']).toBe(contract.shipAppearance.primaryColor);
    expect(model.cssVariables['--screen-engine']).toBe(contract.shipAppearance.engineColor);
    expect(model.cssVariables['--screen-cockpit']).toBe(contract.shipAppearance.cockpitAccent);
  });

  it('summarizes ship appearance metadata for replay/debug context', () => {
    const contract = getContractByShipName('STARBREAK-SMOKE', 'Debt Runner');

    expect(formatContractThemeSummary(contract)).toBe(
      'Debt Runner (ship_debt_runner) | redline theme | needle silhouette | mounts nose+wing'
    );
    expect(createContractThemeDebugState(contract)).toEqual({
      shipId: 'ship_debt_runner',
      shipName: 'Debt Runner',
      themeKey: 'redline',
      silhouette: 'needle'
    });
  });

  it('uses high-contrast substitutions without changing contract identity', () => {
    const contract = getContractByShipName('STARBREAK-SMOKE', 'Drone Chaplain');
    const model = createContractScreenThemeModel(contract, {
      reducedMotion: true,
      performanceMode: true,
      bulletContrast: 'high'
    });

    expect(model.themeKey).toBe('parish');
    expect(model.shipName).toBe('Drone Chaplain');
    expect(model.cssVariables['--screen-primary']).toBe('#f8fbff');
    expect(model.cssVariables['--screen-engine']).toBe('#ffd166');
    expect(model.cssVariables['--screen-glow-alpha']).toBe('0');
  });
});

function getContractByShipName(seed: string, shipName: string) {
  const contract = generateRunSkeleton(seed, { unlockedIds: [] }).contracts.find(
    (candidate) => candidate.shipName === shipName
  );

  if (!contract) {
    throw new Error(`Expected ${seed} to include ${shipName}.`);
  }

  return contract;
}
