import { describe, expect, it } from 'vitest';

import { generateRunSkeleton } from '../../src/game/Generation';
import {
  createShipPreviewModel,
  getShipSilhouettePath,
  formatWeaponPattern
} from '../../src/ui/ShipPreview';
import { getNextContractIndex } from '../../src/ui/ContractSelectScene';

describe('ship previews', () => {
  it('derives preview models from generated contract appearance data', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE');
    const models = run.contracts.map((contract) => createShipPreviewModel(contract, 'compact'));

    expect(models).toHaveLength(3);
    expect(new Set(models.map((model) => model.silhouettePath)).size).toBe(3);

    for (const [index, model] of models.entries()) {
      const contract = run.contracts[index];

      if (!contract) {
        throw new Error('Expected generated contract for preview model.');
      }

      expect(model.shipName).toBe(contract.shipName);
      expect(model.frameName).toBe(contract.loadout.frameName);
      expect(model.mountedModuleCount).toBe(contract.loadout.mounts.length);
      expect(model.weaponName).toBe(contract.startingWeaponName);
      expect(model.themeKey).toBe(contract.shipAppearance.hudThemeKey);
      expect(model.primaryColor).toBe(contract.shipAppearance.primaryColor);
      expect(model.mountPrimitives.length).toBeGreaterThan(0);
      expect(model.weaponCuePrimitives.length).toBeGreaterThan(0);
      expect(model.ariaLabel).toContain(contract.shipName);
      expect(model.ariaLabel).toContain(contract.startingWeaponName);
    }
  });

  it('builds weapon and role cues for the selected missile contract', () => {
    const missileContract = generateRunSkeleton('STARBREAK-SMOKE', {
      unlockedIds: []
    }).contracts.find((contract) => contract.shipId === 'ship_missile_accountant');

    if (!missileContract) {
      throw new Error('STARBREAK-SMOKE should include Missile Accountant.');
    }

    const model = createShipPreviewModel(missileContract, 'hero');

    expect(model.variant).toBe('hero');
    expect(model.patternLabel).toBe('missile');
    expect(model.weaponCuePrimitives.some((primitive) => primitive.kind === 'circle')).toBe(true);
    expect(model.roleBars).toEqual([
      missileContract.shipAppearance.primaryColor,
      missileContract.shipAppearance.engineColor,
      missileContract.shipAppearance.cockpitAccent,
      missileContract.shipAppearance.trimColor
    ]);
  });

  it('accepts a draft weapon override for engineering previews', () => {
    const contract = generateRunSkeleton('SHIP-PREVIEW-ENGINEERING').contracts[0]!;
    const model = createShipPreviewModel(contract, 'hero', {
      weaponName: 'Prototype Beam',
      weaponPattern: 'beam',
      mountedModuleCount: 7,
      ariaContext: 'Draft attack simulation'
    });

    expect(model.weaponName).toBe('Prototype Beam');
    expect(model.weaponPattern).toBe('beam');
    expect(model.mountedModuleCount).toBe(7);
    expect(model.weaponCuePrimitives.some((primitive) => primitive.kind === 'rect')).toBe(true);
    expect(model.ariaLabel).toContain('Draft attack simulation');
  });

  it('keeps silhouette paths and selection movement deterministic', () => {
    expect(getShipSilhouettePath('needle', 24)).toBe(
      'M 60 23 L 79.68 65.72 L 60 55.64 L 40.32 65.72 Z'
    );
    expect(getShipSilhouettePath('ordnance', 24)).not.toBe(getShipSilhouettePath('needle', 24));
    expect(formatWeaponPattern('beam')).toBe('beam');
    expect(getNextContractIndex(0, 3, -1)).toBe(2);
    expect(getNextContractIndex(2, 3, 1)).toBe(0);
  });
});
