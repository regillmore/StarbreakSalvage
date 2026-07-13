import { describe, expect, it } from 'vitest';

import {
  createEngineeringState,
  getInstalledComponent,
  planOverclockComponent,
  planRemoveComponent
} from '../../src/game/Foundry';
import { generateRunSkeleton } from '../../src/game/Generation';
import {
  compareFoundryComponents,
  createFoundryAttackPreviewModel,
  createFoundryComponentStatModel,
  createFoundryDashboardModel
} from '../../src/ui/FoundryPresentation';
import type { ProjectileBlueprint } from '../../src/game/ItemHooks';

describe('foundry visual presentation', () => {
  it('builds compact resource and attack comparisons against the committed ship', () => {
    const contract = generateRunSkeleton('FOUNDRY-VISUAL-MODEL').contracts[0]!;
    const initial = createEngineeringState(contract.loadout);
    const baseline = createFoundryDashboardModel(initial);
    const primary = getInstalledComponent(initial.draft, contract.loadout.mounts[0]!.hardpointId);
    if (!primary) throw new Error('Expected a starting primary component.');
    const overclockedState = planOverclockComponent(initial, primary.id, 2);
    const overclocked = createFoundryDashboardModel(overclockedState);

    expect(baseline.valid).toBe(true);
    expect(baseline.changed).toBe(false);
    expect(baseline.meters).toHaveLength(5);
    expect(baseline.attackStats).toHaveLength(5);
    expect(baseline.attackSimulation.volleySize).toBe(
      baseline.attackStats.find((stat) => stat.id === 'volley')?.value
    );
    expect(baseline.attackSimulation.projectiles.length).toBeLessThanOrEqual(48);
    expect(baseline.attackSimulation.projectiles.every((projectile) => projectile.vy < 0)).toBe(
      true
    );
    expect(baseline.meters.every((meter) => meter.delta === 0)).toBe(true);
    expect(overclocked.changed).toBe(true);
    expect(overclocked.meters.find((meter) => meter.id === 'power')?.delta).toBe(1);
    expect(overclocked.meters.find((meter) => meter.id === 'heat')?.delta).toBe(2);
    expect(overclocked.meters.find((meter) => meter.id === 'instability')?.delta).toBeGreaterThan(
      0
    );
    expect(overclocked.weaponPattern).toBe(contract.startingWeaponPattern);
    expect(overclocked.ariaLabel).toContain('from committed');

    const incomplete = createFoundryDashboardModel(
      planRemoveComponent(initial, contract.loadout.mounts[0]!.hardpointId, 2)
    );
    expect(incomplete.valid).toBe(false);
    expect(incomplete.mountedModuleCount).toBe(baseline.mountedModuleCount - 1);
    expect(incomplete.weaponName).toBe(baseline.weaponName);
  });

  it('uses production weapon and engineering hooks for the live-fire volley', () => {
    const contract = generateRunSkeleton('STARBREAK-SMOKE', { unlockedIds: [] }).contracts.find(
      (candidate) => candidate.shipId === 'ship_debt_runner'
    );
    if (!contract) throw new Error('Expected a single-projectile contract.');
    const initial = createEngineeringState(contract.loadout);
    const primaryHardpoint = contract.loadout.mounts.find((mount) => mount.slot === 'primary');
    if (!primaryHardpoint) throw new Error('Expected a primary hardpoint.');
    const primary = getInstalledComponent(initial.draft, primaryHardpoint.hardpointId);
    if (!primary) throw new Error('Expected an installed primary component.');
    const engineered = {
      ...initial,
      draft: {
        ...initial.draft,
        components: initial.draft.components.map((component) =>
          component.id === primary.id
            ? {
                ...component,
                evolutionIds: ['recipe_prism_fork', 'recipe_convergence_vanes'] as const
              }
            : component
        )
      }
    };
    const dashboard = createFoundryDashboardModel(engineered);
    const firstWave = dashboard.attackSimulation.projectiles.filter(
      (projectile) => projectile.waveIndex === 0
    );

    expect(dashboard.attackSimulation.volleySize).toBe(2);
    expect(firstWave).toHaveLength(2);
    expect(firstWave.find((projectile) => projectile.tags.includes('split'))?.vx).toBeCloseTo(
      -71.4
    );
    expect(dashboard.attackStats.find((stat) => stat.id === 'volley')?.value).toBe(2);
  });

  it('builds steady velocity-scaled flight copies inside the preview actor budget', () => {
    const volley = Array.from({ length: 12 }, (_value, index) =>
      projectile(index - 6, (index - 6) * 20, -500)
    );
    const preview = createFoundryAttackPreviewModel('Budget Test', 0.05, volley);

    expect(preview.volleySize).toBe(12);
    expect(preview.waveCopies).toBe(4);
    expect(preview.projectiles).toHaveLength(48);
    expect(preview.projectiles[0]?.durationSeconds).toBeCloseTo(0.2);
    expect(preview.projectiles[0]?.endY).toBeCloseTo(-24);
    expect(preview.projectiles[0]?.delaySeconds).toBeCloseTo(0);
    expect(preview.projectiles[12]?.delaySeconds).toBeCloseTo(-0.05);
    expect(preview.ariaLabel).toContain('12 projectiles per volley');
  });

  it('summarizes component costs and direct replacement deltas', () => {
    const contract = generateRunSkeleton('FOUNDRY-COMPARE-MODEL').contracts[0]!;
    const state = createEngineeringState(contract.loadout);
    const hardpointId = contract.loadout.mounts[0]!.hardpointId;
    const installed = getInstalledComponent(state.draft, hardpointId);
    if (!installed) throw new Error('Expected installed comparison hardware.');
    const tunedCandidate = {
      ...installed,
      id: 'comparison-candidate',
      routingMode: 'power' as const,
      overclockLevel: 1,
      instability: installed.instability + 2
    };
    const stats = createFoundryComponentStatModel(tunedCandidate);
    const comparison = compareFoundryComponents(tunedCandidate, installed);

    expect(stats.slot).toBe(contract.loadout.mounts[0]!.slot);
    expect(comparison.power).toBe(0);
    expect(comparison.heat).toBe(4);
    expect(comparison.instability).toBe(2);
    expect(comparison.tone).toBe('declined');
    expect(comparison.label).toContain('H+4');
  });
});

function projectile(x: number, vx: number, vy: number): ProjectileBlueprint {
  return {
    x,
    y: 0,
    vx,
    vy,
    radius: 4,
    damage: 1,
    ttl: 1.6,
    tags: ['laser'],
    procDepth: 0,
    environmentDamageSource: 'weapon'
  };
}
