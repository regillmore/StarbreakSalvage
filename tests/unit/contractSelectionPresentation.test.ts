import { describe, expect, it } from 'vitest';

import { generateRunSkeleton } from '../../src/game/Generation';
import { generateStartingItemLoadout } from '../../src/game/Rewards';
import {
  createContractChoicePresentationModel,
  createContractChoicePresentationModels
} from '../../src/ui/ContractSelectionPresentation';

describe('contract selection presentation', () => {
  it('shows the exact deterministic ignition core assigned when each contract launches', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE', { unlockedIds: [] });
    const models = createContractChoicePresentationModels(run);

    expect(models).toHaveLength(run.contracts.length);
    for (const [index, model] of models.entries()) {
      const contract = run.contracts[index]!;
      const expectedIgnition = generateStartingItemLoadout(run.seed, contract, {
        unlockedIds: run.unlockedIds
      });

      expect(model.contract.id).toBe(contract.id);
      expect(model.ignition.itemId).toBe(expectedIgnition[0]?.itemId);
      expect(model.ignition.sourceLabel).toBe('Seeded ignition');
      expect(model.metrics.map((metric) => metric.id)).toEqual([
        'hull',
        'speed',
        'thermal',
        'bombs',
        'economy'
      ]);
      expect(model.metrics.find((metric) => metric.id === 'thermal')?.value).toBe('100%');
      expect(model.ariaLabel).toContain(model.ignition.name);
    }
  });

  it('uses the production attack model after the ignition core is fitted', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE', { unlockedIds: [] });
    const contract = run.contracts.find((candidate) => candidate.shipId === 'ship_drone_chaplain');
    if (!contract) throw new Error('Expected Drone Chaplain in the contract board.');

    const model = createContractChoicePresentationModel(run, contract);
    const firstWave = model.attackSimulation.projectiles.filter(
      (projectile) => projectile.waveIndex === 0
    );
    const waveSizes = Array.from(
      { length: model.attackSimulation.waveCopies },
      (_, waveIndex) =>
        model.attackSimulation.projectiles.filter(
          (projectile) => projectile.waveIndex === waveIndex
        ).length
    );

    expect(firstWave.length).toBeGreaterThan(0);
    expect(Math.max(...waveSizes)).toBe(model.attackSimulation.volleySize);
    expect(new Set(waveSizes).size).toBeGreaterThan(1);
    expect(model.attackSimulation.projectiles.length).toBeLessThanOrEqual(48);
    expect(model.attackSimulation.ariaLabel).toContain('owned item hooks');
    expect(createContractChoicePresentationModel(run, contract)).toEqual(model);
  });
});
