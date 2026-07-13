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
  createFoundryComponentStatModel,
  createFoundryDashboardModel
} from '../../src/ui/FoundryPresentation';

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
