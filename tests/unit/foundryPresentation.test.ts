import { describe, expect, it } from 'vitest';

import {
  createEngineeringCombatProfile,
  createEngineeringState,
  getInstalledComponent,
  planOverclockComponent,
  planRemoveComponent
} from '../../src/game/Foundry';
import {
  createCombatState,
  updateCombatState,
  type CombatBounds
} from '../../src/game/CombatState';
import { generateStartingItemLoadout } from '../../src/game/Rewards';
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

  it('matches combat when owned item hooks reshape the loadout volley', () => {
    const contract = generateRunSkeleton('STARBREAK-SMOKE', { unlockedIds: [] }).contracts.find(
      (candidate) => candidate.shipId === 'ship_drone_chaplain'
    );
    if (!contract) throw new Error('Expected the baseline Drone Chaplain contract.');
    const engineering = createEngineeringState(contract.loadout);
    const items = [
      { itemId: 'item_split_prism' as const, acquisitionOrder: 0 },
      { itemId: 'item_chain_arc_capacitor' as const, acquisitionOrder: 1 }
    ];
    const dashboard = createFoundryDashboardModel(engineering, items);
    const combat = createCombatState(bounds, 'FOUNDRY-COMBAT-PARITY', {
      weaponId: contract.startingWeaponId,
      shipStats: contract.shipStats,
      items,
      engineering: createEngineeringCombatProfile(engineering),
      skipEnemyWaves: true
    });

    updateCombatState(combat, { movement: { x: 0, y: 0 }, fire: true }, 0, bounds);

    const previewVolley = dashboard.attackSimulation.projectiles
      .filter((projectile) => projectile.waveIndex === 0)
      .map((projectile) => ({
        x: projectile.x,
        vx: projectile.vx,
        vy: projectile.vy,
        radius: projectile.radius,
        damage: projectile.damage,
        ttl: projectile.ttl,
        tags: projectile.tags
      }));
    const combatVolley = combat.projectiles
      .filter((projectile) => projectile.owner === 'player')
      .map((projectile) => ({
        x: projectile.x - combat.player.x,
        vx: projectile.vx,
        vy: projectile.vy,
        radius: projectile.radius,
        damage: projectile.damage,
        ttl: projectile.ttl,
        tags: projectile.tags
      }));

    expect(previewVolley).toHaveLength(6);
    expect(previewVolley).toEqual(combatVolley);
    expect(dashboard.attackSimulation.ariaLabel).toContain('owned item hooks');
  });

  it('keeps the known-seed Drone Chaplain distinct from the universal six-shot fan', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE', { unlockedIds: [] });
    const contract = run.contracts.find((candidate) => candidate.shipId === 'ship_drone_chaplain');
    if (!contract) throw new Error('Expected the baseline Drone Chaplain contract.');
    const items = generateStartingItemLoadout(run.seed, contract, { unlockedIds: [] });
    const dashboard = createFoundryDashboardModel(createEngineeringState(contract.loadout), items);

    expect(items.map((item) => item.itemId)).toEqual(['item_signal_clone_stamp']);
    expect(dashboard.attackSimulation.volleySize).toBe(4);
    expect(
      Array.from(
        { length: dashboard.attackSimulation.waveCopies },
        (_value, waveIndex) =>
          dashboard.attackSimulation.projectiles.filter(
            (projectile) => projectile.waveIndex === waveIndex
          ).length
      )
    ).toEqual([2, 2, 4, 2, 2]);
    expect(
      dashboard.attackSimulation.projectiles
        .filter((projectile) => projectile.waveIndex === 0)
        .map((projectile) => projectile.vy)
    ).toEqual([-660, -660]);
    expect(dashboard.attackSimulation.ariaLabel).toContain(
      '2-4 projectiles per volley across the firing cycle'
    );
  });

  it('previews the cumulative output of each ordered circuit stage', () => {
    const contract = generateRunSkeleton('STARBREAK-SMOKE', { unlockedIds: [] }).contracts.find(
      (candidate) => candidate.shipId === 'ship_debt_runner'
    );
    if (!contract) throw new Error('Expected a single-projectile contract.');
    const phaseSplitClone = [
      {
        itemId: 'item_phase_grazer' as const,
        acquisitionOrder: 0,
        socket: { componentId: 'phase', socketIndex: 0, circuitOrder: 0 }
      },
      {
        itemId: 'item_split_prism' as const,
        acquisitionOrder: 1,
        socket: { componentId: 'split', socketIndex: 0, circuitOrder: 1 }
      },
      {
        itemId: 'item_signal_clone_stamp' as const,
        acquisitionOrder: 2,
        socket: { componentId: 'clone', socketIndex: 0, circuitOrder: 2 }
      }
    ];
    const clonePhaseSplit = phaseSplitClone.map((item, index) => ({
      ...item,
      socket: { ...item.socket, circuitOrder: [1, 2, 0][index]! }
    }));
    const builtThenCloned = createFoundryDashboardModel(
      createEngineeringState(contract.loadout),
      phaseSplitClone
    );
    const clonedThenBuilt = createFoundryDashboardModel(
      createEngineeringState(contract.loadout),
      clonePhaseSplit
    );

    expect(builtThenCloned.circuitStages.map((stage) => stage.name)).toEqual([
      'Phase Grazer',
      'Split Prism',
      'Signal Clone Stamp'
    ]);
    expect(builtThenCloned.circuitStages[1]).toMatchObject({
      incomingProjectiles: 1,
      outgoingProjectiles: 3,
      outputLabel: '1 -> 3 shots'
    });
    expect(builtThenCloned.circuitStages.at(-1)?.outgoingProjectiles).toBe(6);
    expect(clonedThenBuilt.circuitStages.at(-1)?.outgoingProjectiles).toBe(4);
  });

  it('builds steady velocity-scaled flight copies inside the preview actor budget', () => {
    const volley = Array.from({ length: 12 }, (_value, index) =>
      projectile(index - 6, (index - 6) * 20, -500)
    );
    const preview = createFoundryAttackPreviewModel('Budget Test', 0.05, volley);

    expect(preview.volleySize).toBe(12);
    expect(preview.waveCopies).toBe(4);
    expect(preview.projectiles).toHaveLength(48);
    expect(preview.cameraWidth).toBe(640);
    expect(preview.cameraHeight).toBe(260);
    expect(preview.projectiles[0]?.durationSeconds).toBeCloseTo(0.5);
    expect(preview.projectiles[0]?.endRisePercent).toBeCloseTo(96.1538);
    expect(preview.projectiles[0]?.displayDiameterPercent).toBeCloseTo(1.25);
    expect(preview.projectiles[0]?.delaySeconds).toBeCloseTo(0);
    expect(preview.projectiles[12]?.delaySeconds).toBeCloseTo(-0.05);
    expect(preview.ariaLabel).toContain('12 projectiles per volley');
  });

  it('normalizes combat radius and lane spacing into one responsive camera scale', () => {
    const preview = createFoundryAttackPreviewModel('Dual Geometry', 0.2, [
      projectile(-8, 0, -660),
      projectile(8, 0, -660)
    ]);
    const firstWave = preview.projectiles.filter((candidate) => candidate.waveIndex === 0);

    expect(firstWave.map((candidate) => candidate.startXPercent)).toEqual([-1.25, 1.25]);
    expect(firstWave[1]!.startXPercent - firstWave[0]!.startXPercent).toBeCloseTo(2.5);
    expect(firstWave.every((candidate) => candidate.displayDiameterPercent === 1.25)).toBe(true);
    expect(firstWave.every((candidate) => candidate.endRisePercent >= 96)).toBe(true);
    expect(firstWave[0]!.durationSeconds).toBeCloseTo(1);
    expect(firstWave[0]!.performanceRisePercent).toBeLessThan(60);
  });

  it('projects missile previews through the production two-stage motor', () => {
    const ballistic = createFoundryAttackPreviewModel('Ballistic', 0.05, [projectile(0, 0, -500)]);
    const missile = createFoundryAttackPreviewModel('Missile', 0.05, [
      { ...projectile(0, 0, -500), tags: ['missile'] }
    ]);
    const missileShot = missile.projectiles[0];

    expect(missileShot?.flightKind).toBe('missile');
    expect(missileShot?.headingDegrees).toBe(0);
    expect(missileShot?.durationSeconds).toBeGreaterThan(
      ballistic.projectiles[0]?.durationSeconds ?? 0
    );
    expect(missileShot?.endRisePercent).toBeCloseTo(96.1538, 3);
    expect(missile.ariaLabel).toContain('two-stage motor profile');
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

const bounds: CombatBounds = {
  width: 640,
  height: 720,
  padding: 24
};
