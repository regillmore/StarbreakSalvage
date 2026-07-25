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
    expect(baseline.meters).toHaveLength(6);
    expect(baseline.meters.find((meter) => meter.id === 'circuit')).toMatchObject({
      value: 0,
      capacity: 3,
      delta: 0,
      tone: 'same'
    });
    expect(baseline.attackStats).toHaveLength(6);
    expect(baseline.attackSimulation.volleySize).toBe(
      baseline.attackStats.find((stat) => stat.id === 'volley')?.value
    );
    expect(baseline.attackSimulation.damageSampleVolleys).toBe(1);
    expect(baseline.attackStats.find((stat) => stat.id === 'baseDps')).toMatchObject({
      value: baseline.attackSimulation.baseDps,
      delta: 0,
      tone: 'same'
    });
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
    expect(dashboard.attackStats.find((stat) => stat.id === 'baseDps')?.value).toBeCloseTo(
      dashboard.attackSimulation.baseDps
    );
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

    expect(previewVolley).toHaveLength(7);
    expect(previewVolley).toEqual(combatVolley);
    expect(dashboard.attackSimulation.ariaLabel).toContain('owned item hooks');
    expect(dashboard.attackSimulation.ariaLabel).toContain(
      'measured across 1 consecutive volley at baseline cadence'
    );
  });

  it('keeps the known-seed Drone Chaplain distinct from the universal six-shot fan', () => {
    const run = generateRunSkeleton('STARBREAK-SMOKE', { unlockedIds: [] });
    const contract = run.contracts.find((candidate) => candidate.shipId === 'ship_drone_chaplain');
    if (!contract) throw new Error('Expected the baseline Drone Chaplain contract.');
    const items = generateStartingItemLoadout(run.seed, contract, { unlockedIds: [] });
    const dashboard = createFoundryDashboardModel(createEngineeringState(contract.loadout), items);

    expect(items.map((item) => item.itemId)).toEqual(['item_signal_clone_stamp']);
    expect(dashboard.meters.find((meter) => meter.id === 'circuit')).toMatchObject({
      value: 1,
      capacity: 3,
      delta: 0,
      tone: 'same'
    });
    expect(dashboard.attackSimulation.volleySize).toBe(5);
    expect(
      Array.from(
        { length: dashboard.attackSimulation.waveCopies },
        (_value, waveIndex) =>
          dashboard.attackSimulation.projectiles.filter(
            (projectile) => projectile.waveIndex === waveIndex
          ).length
      )
    ).toEqual([3, 3, 5, 3, 3]);
    expect(dashboard.attackSimulation.drones).toHaveLength(3);
    expect(
      dashboard.attackSimulation.projectiles.some(
        (projectile) => projectile.tags.includes('drone') && projectile.startBottomPercent > 10
      )
    ).toBe(true);
    expect(
      dashboard.attackSimulation.projectiles
        .filter((projectile) => projectile.waveIndex === 0)
        .map((projectile) => projectile.vy)
    ).toEqual([-660, -660, -660]);
    expect(dashboard.attackSimulation.ariaLabel).toContain(
      '3-5 projectiles per volley across the firing cycle'
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

  it('shows Boreline Crimper gaining value only after an upstream fan exists', () => {
    const contract = generateRunSkeleton('STARBREAK-SMOKE', { unlockedIds: [] }).contracts.find(
      (candidate) => candidate.shipId === 'ship_debt_runner'
    );
    if (!contract) throw new Error('Expected a single-projectile contract.');
    const splitThenCrimp = createFoundryDashboardModel(createEngineeringState(contract.loadout), [
      { itemId: 'item_split_prism', acquisitionOrder: 0 },
      { itemId: 'item_boreline_crimper', acquisitionOrder: 1 }
    ]);
    const crimpThenSplit = createFoundryDashboardModel(createEngineeringState(contract.loadout), [
      { itemId: 'item_boreline_crimper', acquisitionOrder: 0 },
      { itemId: 'item_split_prism', acquisitionOrder: 1 }
    ]);

    expect(splitThenCrimp.circuitStages[1]).toMatchObject({
      name: 'Boreline Crimper',
      incomingProjectiles: 3,
      outgoingProjectiles: 3,
      outputLabel: '2.2 -> 2.5 impact',
      addedTags: ['overkill'],
      changed: true
    });
    expect(crimpThenSplit.circuitStages[0]).toMatchObject({
      name: 'Boreline Crimper',
      outputLabel: 'conditional volley armed',
      addedTags: [],
      changed: false
    });
    expect(
      Math.max(
        ...splitThenCrimp.attackSimulation.projectiles
          .filter((projectile) => projectile.waveIndex === 0)
          .map((projectile) => Math.abs(projectile.vx))
      )
    ).toBeCloseTo(70.528);
  });

  it('shows shield retaliation pressure feeding downstream beam and deflector stages', () => {
    const contract = generateRunSkeleton('STARBREAK-SMOKE', { unlockedIds: [] }).contracts.find(
      (candidate) => candidate.shipId === 'ship_debt_runner'
    );
    if (!contract) throw new Error('Expected a single-projectile contract.');
    const linked = createFoundryDashboardModel(createEngineeringState(contract.loadout), [
      { itemId: 'item_shield_dynamo', acquisitionOrder: 0 },
      { itemId: 'item_revenge_beam', acquisitionOrder: 1 },
      { itemId: 'item_oathbound_deflector', acquisitionOrder: 2 }
    ]);
    const reversed = createFoundryDashboardModel(createEngineeringState(contract.loadout), [
      { itemId: 'item_revenge_beam', acquisitionOrder: 0 },
      { itemId: 'item_oathbound_deflector', acquisitionOrder: 1 },
      { itemId: 'item_shield_dynamo', acquisitionOrder: 2 }
    ]);

    expect(linked.circuitStages[0]).toMatchObject({
      name: 'Shield Dynamo',
      conditionMet: true,
      addedTags: ['shield', 'revenge'],
      changed: true
    });
    expect(linked.circuitStages[0]?.outputLabel).toContain('PRESSURE CYCLE');
    expect(linked.circuitStages[1]).toMatchObject({
      name: 'Revenge Beam',
      conditionMet: true,
      incomingProjectiles: 1,
      outgoingProjectiles: 2,
      changed: true
    });
    expect(linked.circuitStages[2]).toMatchObject({
      name: 'Oathbound Deflector',
      conditionMet: true,
      addedTags: ['ricochet'],
      changed: true
    });
    expect(
      linked.attackSimulation.projectiles.some(
        (projectile) =>
          projectile.tags.includes('revenge') &&
          projectile.tags.includes('ricochet') &&
          projectile.laserKind === 'beam'
      )
    ).toBe(true);
    expect(reversed.circuitStages[0]).toMatchObject({
      name: 'Revenge Beam',
      conditionMet: false,
      changed: false
    });
    expect(reversed.circuitStages[1]).toMatchObject({
      name: 'Oathbound Deflector',
      conditionMet: false,
      changed: false
    });
    expect(reversed.circuitStages[2]).toMatchObject({
      name: 'Shield Dynamo',
      conditionMet: true,
      changed: true
    });
  });

  it('shows Gangue Compression Die converting only upstream light branches into plasma', () => {
    const contract = generateRunSkeleton('STARBREAK-SMOKE', { unlockedIds: [] }).contracts.find(
      (candidate) => candidate.shipId === 'ship_debt_runner'
    );
    if (!contract) throw new Error('Expected a single-projectile contract.');
    const splitThenCompress = createFoundryDashboardModel(
      createEngineeringState(contract.loadout),
      [
        { itemId: 'item_split_prism', acquisitionOrder: 0 },
        { itemId: 'item_gangue_compression_die', acquisitionOrder: 1 }
      ]
    );
    const compressThenSplit = createFoundryDashboardModel(
      createEngineeringState(contract.loadout),
      [
        { itemId: 'item_gangue_compression_die', acquisitionOrder: 0 },
        { itemId: 'item_split_prism', acquisitionOrder: 1 }
      ]
    );

    expect(splitThenCompress.circuitStages[1]).toMatchObject({
      name: 'Gangue Compression Die',
      incomingProjectiles: 3,
      outgoingProjectiles: 3,
      outputLabel: '2.2 -> 2.6 impact',
      addedTags: ['plasma'],
      changed: true
    });
    expect(compressThenSplit.circuitStages[0]).toMatchObject({
      name: 'Gangue Compression Die',
      outputLabel: 'conditional volley armed',
      addedTags: [],
      changed: false
    });
    expect(
      splitThenCompress.attackSimulation.projectiles.filter((projectile) =>
        projectile.tags.includes('plasma')
      )
    ).not.toHaveLength(0);
  });

  it('shows Penumbra Crown Aperture waiting for and transforming an upstream multi-shot volley', () => {
    const contract = generateRunSkeleton('STARBREAK-SMOKE', { unlockedIds: [] }).contracts.find(
      (candidate) => candidate.shipId === 'ship_debt_runner'
    );
    if (!contract) throw new Error('Expected a single-projectile contract.');
    const splitThenCrown = createFoundryDashboardModel(createEngineeringState(contract.loadout), [
      { itemId: 'item_split_prism', acquisitionOrder: 0 },
      { itemId: 'item_penumbra_crown_aperture', acquisitionOrder: 1 }
    ]);
    const crownThenSplit = createFoundryDashboardModel(createEngineeringState(contract.loadout), [
      { itemId: 'item_penumbra_crown_aperture', acquisitionOrder: 0 },
      { itemId: 'item_split_prism', acquisitionOrder: 1 }
    ]);

    expect(splitThenCrown.circuitStages[1]).toMatchObject({
      name: 'Penumbra Crown Aperture',
      incomingProjectiles: 3,
      outgoingProjectiles: 3,
      conditionMet: true,
      addedTags: ['phase', 'plasma'],
      changed: true
    });
    expect(splitThenCrown.circuitStages[1]?.outputLabel).toContain('CENTERLINE PHASE / PLASMA');
    expect(crownThenSplit.circuitStages[0]).toMatchObject({
      name: 'Penumbra Crown Aperture',
      conditionMet: false,
      addedTags: [],
      changed: false
    });
    expect(crownThenSplit.circuitStages[0]?.outputLabel).toContain(
      'NEEDS AN EARLIER MULTI-SHOT STAGE'
    );
    expect(
      splitThenCrown.attackSimulation.projectiles.filter(
        (projectile) => projectile.tags.includes('phase') && projectile.tags.includes('plasma')
      )
    ).not.toHaveLength(0);
  });

  it('shows Forkline Dynamo charging only branches that already exist upstream', () => {
    const contract = generateRunSkeleton('STARBREAK-SMOKE', { unlockedIds: [] }).contracts.find(
      (candidate) => candidate.shipId === 'ship_debt_runner'
    );
    if (!contract) throw new Error('Expected a single-projectile contract.');
    const splitThenCharge = createFoundryDashboardModel(createEngineeringState(contract.loadout), [
      { itemId: 'item_split_prism', acquisitionOrder: 0 },
      { itemId: 'item_forkline_dynamo', acquisitionOrder: 1 }
    ]);
    const chargeThenSplit = createFoundryDashboardModel(createEngineeringState(contract.loadout), [
      { itemId: 'item_forkline_dynamo', acquisitionOrder: 0 },
      { itemId: 'item_split_prism', acquisitionOrder: 1 }
    ]);

    expect(splitThenCharge.circuitStages[1]).toMatchObject({
      name: 'Forkline Dynamo',
      incomingProjectiles: 3,
      outgoingProjectiles: 3,
      outputLabel: 'ARC none -> 0.7 @ 180u',
      addedTags: ['arc'],
      changed: true
    });
    expect(chargeThenSplit.circuitStages[0]).toMatchObject({
      name: 'Forkline Dynamo',
      outputLabel: 'conditional volley armed',
      addedTags: [],
      changed: false
    });
  });

  it('shows Arc Window upgrading an earlier charge without inflating primary impact', () => {
    const contract = generateRunSkeleton('STARBREAK-SMOKE', { unlockedIds: [] }).contracts.find(
      (candidate) => candidate.shipId === 'ship_debt_runner'
    );
    if (!contract) throw new Error('Expected a single-projectile contract.');
    const chargedThenWindowed = createFoundryDashboardModel(
      createEngineeringState(contract.loadout),
      [
        { itemId: 'item_chain_arc_capacitor', acquisitionOrder: 0 },
        { itemId: 'item_arc_window_invoice', acquisitionOrder: 1 }
      ]
    );
    const windowedThenCharged = createFoundryDashboardModel(
      createEngineeringState(contract.loadout),
      [
        { itemId: 'item_arc_window_invoice', acquisitionOrder: 0 },
        { itemId: 'item_chain_arc_capacitor', acquisitionOrder: 1 }
      ]
    );

    expect(chargedThenWindowed.circuitStages[0]).toMatchObject({
      name: 'Chain Arc Capacitor',
      outputLabel: 'ARC none -> 0.6 @ 180u',
      addedTags: ['arc'],
      changed: true
    });
    expect(chargedThenWindowed.circuitStages[1]).toMatchObject({
      name: 'Arc Window Invoice',
      outputLabel: 'ARC 0.6 @ 180u -> 0.8 @ 240u',
      addedTags: [],
      changed: true
    });
    expect(chargedThenWindowed.circuitStages[1]?.incomingImpact).toBeCloseTo(1);
    expect(chargedThenWindowed.circuitStages[1]?.outgoingImpact).toBeCloseTo(1);
    expect(
      chargedThenWindowed.attackSimulation.projectiles.every(
        (projectile) => projectile.arcChargeKind === 'heavy'
      )
    ).toBe(true);
    expect(chargedThenWindowed.attackSimulation.ariaLabel).toContain(
      'the primary hit receives no bonus damage'
    );
    expect(windowedThenCharged.circuitStages[0]).toMatchObject({
      name: 'Arc Window Invoice',
      outputLabel: 'conditional projectile rewrite armed',
      addedTags: [],
      changed: false
    });
    expect(windowedThenCharged.attackSimulation.projectiles[0]?.arcChargeKind).toBe('standard');
  });

  it('shows Faraday Phase Shunt activating only after an earlier arc stage', () => {
    const contract = generateRunSkeleton('STARBREAK-SMOKE', { unlockedIds: [] }).contracts.find(
      (candidate) => candidate.shipId === 'ship_debt_runner'
    );
    if (!contract) throw new Error('Expected a single-projectile contract.');
    const chargedThenShunted = createFoundryDashboardModel(
      createEngineeringState(contract.loadout),
      [
        { itemId: 'item_chain_arc_capacitor', acquisitionOrder: 0 },
        { itemId: 'item_faraday_phase_shunt', acquisitionOrder: 1 }
      ]
    );
    const shuntedThenCharged = createFoundryDashboardModel(
      createEngineeringState(contract.loadout),
      [
        { itemId: 'item_faraday_phase_shunt', acquisitionOrder: 0 },
        { itemId: 'item_chain_arc_capacitor', acquisitionOrder: 1 }
      ]
    );

    expect(chargedThenShunted.circuitStages[1]).toMatchObject({
      name: 'Faraday Phase Shunt',
      addedTags: ['phase'],
      changed: true
    });
    expect(chargedThenShunted.attackSimulation.projectiles[0]).toMatchObject({
      arcChargeKind: 'standard'
    });
    expect(chargedThenShunted.attackSimulation.projectiles[0]?.tags).toEqual(
      expect.arrayContaining(['arc', 'phase'])
    );
    expect(shuntedThenCharged.circuitStages[0]).toMatchObject({
      name: 'Faraday Phase Shunt',
      addedTags: [],
      changed: false
    });
    expect(shuntedThenCharged.attackSimulation.projectiles[0]?.tags).toContain('arc');
    expect(shuntedThenCharged.attackSimulation.projectiles[0]?.tags).not.toContain('phase');
  });

  it('shows Rebound Freight Seal activating only after an earlier ricochet source', () => {
    const contract = generateRunSkeleton('STARBREAK-SMOKE', { unlockedIds: [] }).contracts.find(
      (candidate) => candidate.shipId === 'ship_debt_runner'
    );
    if (!contract) throw new Error('Expected a single-projectile contract.');
    const freightReady = createFoundryDashboardModel(createEngineeringState(contract.loadout), [
      { itemId: 'item_split_prism', acquisitionOrder: 0 },
      { itemId: 'item_ricochet_branch_coupler', acquisitionOrder: 1 },
      { itemId: 'item_rebound_freight_seal', acquisitionOrder: 2 }
    ]);
    const freightUnmet = createFoundryDashboardModel(createEngineeringState(contract.loadout), [
      { itemId: 'item_split_prism', acquisitionOrder: 0 },
      { itemId: 'item_rebound_freight_seal', acquisitionOrder: 1 },
      { itemId: 'item_ricochet_branch_coupler', acquisitionOrder: 2 }
    ]);

    expect(freightReady.circuitStages[2]).toMatchObject({
      name: 'Rebound Freight Seal',
      outputLabel: 'CONDITION MET · 2 BOUNCING SHOTS · +14% IMPACT PER BOUNCE',
      conditionMet: true,
      addedTags: ['overkill'],
      changed: true
    });
    expect(freightReady.circuitStages[2]?.outgoingImpact).toBeGreaterThan(
      freightReady.circuitStages[2]?.incomingImpact ?? 0
    );
    expect(freightUnmet.circuitStages[1]).toMatchObject({
      name: 'Rebound Freight Seal',
      outputLabel: 'CONDITION NOT MET · NEEDS AN EARLIER RICOCHET SOURCE',
      conditionMet: false,
      addedTags: [],
      changed: false
    });
  });

  it('shows Strata-Bore Collimator linking only after an earlier plasma source', () => {
    const contract = generateRunSkeleton('STARBREAK-SMOKE', { unlockedIds: [] }).contracts.find(
      (candidate) => candidate.shipId === 'ship_debt_runner'
    );
    if (!contract) throw new Error('Expected a single-projectile contract.');
    const linked = createFoundryDashboardModel(createEngineeringState(contract.loadout), [
      { itemId: 'item_chain_arc_capacitor', acquisitionOrder: 0 },
      { itemId: 'item_plasma_seed_crucible', acquisitionOrder: 1 },
      { itemId: 'item_strata_bore_collimator', acquisitionOrder: 2 }
    ]);
    const unmet = createFoundryDashboardModel(createEngineeringState(contract.loadout), [
      { itemId: 'item_strata_bore_collimator', acquisitionOrder: 0 },
      { itemId: 'item_chain_arc_capacitor', acquisitionOrder: 1 },
      { itemId: 'item_plasma_seed_crucible', acquisitionOrder: 2 }
    ]);

    expect(linked.circuitStages[2]).toMatchObject({
      name: 'Strata-Bore Collimator',
      outputLabel: 'CONDITION MET · 1 PLASMA SHOT · +18% IMPACT · BEAM LASER',
      conditionMet: true,
      changed: true
    });
    expect(linked.attackSimulation.projectiles[0]).toMatchObject({ laserKind: 'beam' });
    expect(unmet.circuitStages[0]).toMatchObject({
      name: 'Strata-Bore Collimator',
      outputLabel: 'CONDITION NOT MET · NEEDS AN EARLIER PLASMA SOURCE',
      conditionMet: false,
      changed: false
    });
  });

  it('shows Claimant Arc Seal linking only after an earlier overkill source', () => {
    const contract = generateRunSkeleton('STARBREAK-SMOKE', { unlockedIds: [] }).contracts.find(
      (candidate) => candidate.shipId === 'ship_debt_runner'
    );
    if (!contract) throw new Error('Expected a single-projectile contract.');
    const linked = createFoundryDashboardModel(createEngineeringState(contract.loadout), [
      { itemId: 'item_split_prism', acquisitionOrder: 0 },
      { itemId: 'item_ricochet_branch_coupler', acquisitionOrder: 1 },
      { itemId: 'item_rebound_freight_seal', acquisitionOrder: 2 },
      { itemId: 'item_claimant_arc_seal', acquisitionOrder: 3 }
    ]);
    const unmet = createFoundryDashboardModel(createEngineeringState(contract.loadout), [
      { itemId: 'item_split_prism', acquisitionOrder: 0 },
      { itemId: 'item_claimant_arc_seal', acquisitionOrder: 1 },
      { itemId: 'item_ricochet_branch_coupler', acquisitionOrder: 2 },
      { itemId: 'item_rebound_freight_seal', acquisitionOrder: 3 }
    ]);

    expect(linked.circuitStages[3]).toMatchObject({
      name: 'Claimant Arc Seal',
      outputLabel: 'CONDITION MET · 2 OVERKILL SHOTS · STANDARD ARC TO SECOND TARGET',
      conditionMet: true,
      addedTags: ['arc'],
      changed: true
    });
    expect(unmet.circuitStages[1]).toMatchObject({
      name: 'Claimant Arc Seal',
      outputLabel: 'CONDITION NOT MET · NEEDS AN EARLIER OVERKILL SOURCE',
      conditionMet: false,
      addedTags: [],
      changed: false
    });
  });

  it('shows Parallax Echo Lattice phasing only secondary shots created upstream', () => {
    const contract = generateRunSkeleton('STARBREAK-SMOKE', { unlockedIds: [] }).contracts.find(
      (candidate) => candidate.shipId === 'ship_debt_runner'
    );
    if (!contract) throw new Error('Expected a single-projectile contract.');
    const linked = createFoundryDashboardModel(createEngineeringState(contract.loadout), [
      { itemId: 'item_split_prism', acquisitionOrder: 0 },
      { itemId: 'item_parallax_echo_lattice', acquisitionOrder: 1 }
    ]);
    const unmet = createFoundryDashboardModel(createEngineeringState(contract.loadout), [
      { itemId: 'item_parallax_echo_lattice', acquisitionOrder: 0 },
      { itemId: 'item_split_prism', acquisitionOrder: 1 }
    ]);

    expect(linked.circuitStages[1]).toMatchObject({
      name: 'Parallax Echo Lattice',
      outputLabel: 'CONDITION MET · 2 SECONDARY SHOTS PHASED · +0.30S FLIGHT',
      conditionMet: true,
      addedTags: ['phase'],
      changed: true
    });
    expect(
      linked.attackSimulation.projectiles.filter(
        (projectile) => projectile.waveIndex === 0 && projectile.tags.includes('phase')
      )
    ).toHaveLength(2);
    expect(unmet.circuitStages[0]).toMatchObject({
      name: 'Parallax Echo Lattice',
      outputLabel: 'CONDITION NOT MET · NEEDS AN EARLIER SHOT-CREATING STAGE',
      conditionMet: false,
      changed: false
    });
  });

  it('explains whether apex circuit spoils have an upstream signal to transform', () => {
    const contract = generateRunSkeleton('STARBREAK-SMOKE', { unlockedIds: [] }).contracts.find(
      (candidate) => candidate.shipId === 'ship_debt_runner'
    );
    if (!contract) throw new Error('Expected a single-projectile contract.');
    const engineering = createEngineeringState(contract.loadout);
    const crownUnmet = createFoundryDashboardModel(engineering, [
      { itemId: 'item_claimant_mantle_press', acquisitionOrder: 0 }
    ]);
    const choirLinked = createFoundryDashboardModel(engineering, [
      { itemId: 'item_split_prism', acquisitionOrder: 0 },
      { itemId: 'item_funeral_refrain_array', acquisitionOrder: 1 }
    ]);
    const convoyLinked = createFoundryDashboardModel(engineering, [
      { itemId: 'item_split_prism', acquisitionOrder: 0 },
      { itemId: 'item_exodus_rail_switch', acquisitionOrder: 1 },
      { itemId: 'item_passenger_coffer_manifest', acquisitionOrder: 2 }
    ]);

    expect(crownUnmet.circuitStages[0]).toMatchObject({
      name: 'Claimant Mantle Press',
      conditionMet: false,
      changed: false
    });
    expect(crownUnmet.circuitStages[0]!.outputLabel).toContain(
      'NEEDS EARLIER MISSILE OR OVERKILL SHOTS'
    );
    expect(choirLinked.circuitStages[1]).toMatchObject({
      name: 'Funeral Refrain Array',
      conditionMet: true
    });
    expect(choirLinked.circuitStages[1]!.outputLabel).toContain('EVERY 5TH VOLLEY');
    expect(convoyLinked.circuitStages[1]!.outputLabel).toContain('OUTER PAIR');
    expect(convoyLinked.circuitStages[2]!.outputLabel).toContain('ARC ESCORTS');
  });

  it('projects prototype-vent cadence shifts onto affected earlier circuit cards', () => {
    const contract = generateRunSkeleton('STARBREAK-SMOKE', { unlockedIds: [] }).contracts.find(
      (candidate) => candidate.shipId === 'ship_debt_runner'
    );
    if (!contract) throw new Error('Expected a single-projectile contract.');
    const dashboard = createFoundryDashboardModel(createEngineeringState(contract.loadout), [
      {
        itemId: 'item_phase_grazer',
        acquisitionOrder: 0,
        socket: { componentId: 'phase', socketIndex: 0, circuitOrder: 0 }
      },
      {
        itemId: 'item_prototype_vent_script',
        acquisitionOrder: 1,
        socket: { componentId: 'vent', socketIndex: 0, circuitOrder: 1 }
      }
    ]);

    expect(dashboard.circuitStages[0]).toMatchObject({
      name: 'Phase Grazer',
      changed: true,
      cadenceShiftLabel:
        'VENT SCRIPT · EVERY 4TH -> 5TH VOLLEY · +1 HEAT SHOT · SPENDS 32% HEAT · COOL = EXHAUST'
    });
    expect(dashboard.circuitStages[1]).toMatchObject({
      name: 'Prototype Vent Script',
      outputLabel: 'CONDITION MET · 1 EARLIER PERIODIC VOLLEY LINKED',
      conditionMet: true,
      cadenceShiftLabel: null
    });
    expect(dashboard.attackSimulation.waveCopies).toBeGreaterThanOrEqual(5);
    expect(dashboard.attackSimulation.damageSampleVolleys).toBe(5);
    expect(
      dashboard.attackSimulation.projectiles.some((projectile) => projectile.tags.includes('heat'))
    ).toBe(false);
    expect(dashboard.attackSimulation.heatExhausts).toEqual([
      expect.objectContaining({ waveIndex: 4 })
    ]);
    expect(dashboard.attackSimulation.ariaLabel).toContain(
      'spend 32% of overheat capacity; this cool-start cycle generates 0 and replaces 1 underfunded attempt with visible exhaust'
    );

    const unmetDashboard = createFoundryDashboardModel(createEngineeringState(contract.loadout), [
      {
        itemId: 'item_prototype_vent_script',
        acquisitionOrder: 1,
        socket: { componentId: 'vent', socketIndex: 0, circuitOrder: 0 }
      },
      {
        itemId: 'item_phase_grazer',
        acquisitionOrder: 0,
        socket: { componentId: 'phase', socketIndex: 0, circuitOrder: 1 }
      }
    ]);
    expect(unmetDashboard.circuitStages[0]).toMatchObject({
      name: 'Prototype Vent Script',
      outputLabel: 'CONDITION NOT MET · NEEDS AN EARLIER PERIODIC VOLLEY',
      conditionMet: false,
      changed: false
    });
    expect(unmetDashboard.circuitStages[1]).toMatchObject({
      name: 'Phase Grazer',
      cadenceShiftLabel: null
    });
    expect(unmetDashboard.attackSimulation.damageSampleVolleys).toBe(4);
  });

  it('measures the least common cycle of mixed periodic circuit stages', () => {
    const contract = generateRunSkeleton('STARBREAK-SMOKE', { unlockedIds: [] }).contracts.find(
      (candidate) => candidate.shipId === 'ship_debt_runner'
    );
    if (!contract) throw new Error('Expected a single-projectile contract.');
    const dashboard = createFoundryDashboardModel(createEngineeringState(contract.loadout), [
      {
        itemId: 'item_signal_clone_stamp',
        acquisitionOrder: 0,
        socket: { componentId: 'clone', socketIndex: 0, circuitOrder: 0 }
      },
      {
        itemId: 'item_phase_grazer',
        acquisitionOrder: 1,
        socket: { componentId: 'phase', socketIndex: 0, circuitOrder: 1 }
      },
      {
        itemId: 'item_prototype_vent_script',
        acquisitionOrder: 2,
        socket: { componentId: 'vent', socketIndex: 0, circuitOrder: 2 }
      }
    ]);

    expect(dashboard.attackSimulation.damageSampleVolleys).toBe(20);
    expect(dashboard.attackSimulation.baseDps).toBeCloseTo(
      dashboard.attackSimulation.damageSampleTotal /
        (20 * dashboard.attackSimulation.fireCooldownSeconds)
    );
    expect(dashboard.attackSimulation.projectiles.length).toBeLessThanOrEqual(48);

    const ventFirst = createFoundryDashboardModel(createEngineeringState(contract.loadout), [
      {
        itemId: 'item_prototype_vent_script',
        acquisitionOrder: 2,
        socket: { componentId: 'vent', socketIndex: 0, circuitOrder: 0 }
      },
      {
        itemId: 'item_signal_clone_stamp',
        acquisitionOrder: 0,
        socket: { componentId: 'clone', socketIndex: 0, circuitOrder: 1 }
      },
      {
        itemId: 'item_phase_grazer',
        acquisitionOrder: 1,
        socket: { componentId: 'phase', socketIndex: 0, circuitOrder: 2 }
      }
    ]);
    expect(ventFirst.attackSimulation.damageSampleVolleys).toBe(12);
    expect(ventFirst.attackSimulation.baseDps).not.toBeCloseTo(dashboard.attackSimulation.baseDps);
  });

  it('distinguishes deployed, linked, and idle drone circuit stages', () => {
    const contract = generateRunSkeleton('STARBREAK-SMOKE', { unlockedIds: [] }).contracts.find(
      (candidate) => candidate.shipId === 'ship_debt_runner'
    );
    if (!contract) throw new Error('Expected the Debt Runner contract.');
    const engineering = createEngineeringState(contract.loadout);
    const idle = createFoundryDashboardModel(engineering, [
      { itemId: 'item_arc_welder_drone', acquisitionOrder: 0 },
      { itemId: 'item_scrap_saints_relay', acquisitionOrder: 1 }
    ]);

    expect(idle.circuitStages[0]).toMatchObject({
      name: 'Arc Welder Drone',
      conditionMet: false,
      outputLabel: 'FOLLOWER IDLE · NEEDS AN ARC SOURCE'
    });
    expect(idle.circuitStages[1]).toMatchObject({
      name: 'Scrap Saints Relay',
      conditionMet: false,
      outputLabel: 'CONDITION NOT MET · NEEDS A DRONE LAUNCHER'
    });

    const linked = createFoundryDashboardModel(engineering, [
      { itemId: 'item_chain_arc_capacitor', acquisitionOrder: 0 },
      { itemId: 'item_arc_welder_drone', acquisitionOrder: 1 },
      { itemId: 'item_drone_uplink', acquisitionOrder: 2 }
    ]);
    expect(linked.circuitStages[1]).toMatchObject({
      conditionMet: true,
      outputLabel: '1 FOLLOWER DEPLOYED · ARC FEED READY EVERY 3RD VOLLEY'
    });
    expect(linked.circuitStages[2]).toMatchObject({
      conditionMet: true,
      outputLabel: '2 FOLLOWERS DEPLOYED · COPY EVERY 3RD VOLLEY'
    });
    expect(linked.attackSimulation.drones).toHaveLength(3);
  });

  it('builds steady velocity-scaled flight copies inside the preview actor budget', () => {
    const volley = Array.from({ length: 12 }, (_value, index) =>
      projectile(index - 6, (index - 6) * 20, -500)
    );
    const preview = createFoundryAttackPreviewModel('Budget Test', 0.05, volley);

    expect(preview.volleySize).toBe(12);
    expect(preview.damageSampleVolleys).toBe(1);
    expect(preview.damageSampleTotal).toBe(12);
    expect(preview.baseDps).toBe(240);
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
    expect(preview.ariaLabel).toContain('Base direct damage is 240.0 per second');
  });

  it('measures direct projectile DPS without adding conditional arc discharge damage', () => {
    const preview = createFoundryAttackPreviewModel('Measured Arc', 0.2, [
      {
        ...projectile(0, 0, -500),
        damage: 2,
        tags: ['laser', 'arc'],
        arcChargeKind: 'heavy'
      },
      { ...projectile(8, 0, -500), damage: 3 }
    ]);

    expect(preview.damageSampleTotal).toBe(5);
    expect(preview.baseDps).toBe(25);
    expect(preview.ariaLabel).toContain('hit-dependent damage is excluded');
    expect(preview.ariaLabel).toContain('Arc-charged shots store');
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

  it('marks phase and phase-missile shots for their shared refracted preview treatment', () => {
    const phase = createFoundryAttackPreviewModel('Phase', 0.14, [
      { ...projectile(0, 0, -820), tags: ['laser', 'phase'] }
    ]);
    const phaseMissile = createFoundryAttackPreviewModel('Phase Missile', 0.2, [
      { ...projectile(0, 0, -500), tags: ['missile', 'phase'] }
    ]);

    expect(phase.projectiles[0]?.flightKind).toBe('phase');
    expect(phaseMissile.projectiles[0]?.flightKind).toBe('phaseMissile');
    expect(phase.ariaLabel).toContain('refracted core, displaced afterimages, and a broken wake');
    expect(phase.ariaLabel).toContain('first damaging contact pierces and collapses the phase');
    expect(phaseMissile.ariaLabel).toContain('two-stage motor profile');
    expect(phaseMissile.ariaLabel).toContain('refracted core');
  });

  it('marks authored heat shots for their molten live-fire treatment', () => {
    const preview = createFoundryAttackPreviewModel('Heat Shot', 0.2, [
      { ...projectile(0, 0, -520), tags: ['heat', 'plasma'], visualKind: 'heatShot' }
    ]);

    expect(preview.projectiles[0]?.flightKind).toBe('heatShot');
    expect(preview.heatExhausts).toEqual([]);
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
    expect(stats.circuit).toBe(3);
    expect(comparison.power).toBe(0);
    expect(comparison.heat).toBe(4);
    expect(comparison.instability).toBe(2);
    expect(comparison.circuit).toBe(0);
    expect(comparison.tone).toBe('declined');
    expect(comparison.label).toContain('H+4');
  });

  it('treats a higher-quality recovered primary circuit as a beneficial component delta', () => {
    const contract = generateRunSkeleton('FOUNDRY-CIRCUIT-COMPARE').contracts[0]!;
    const state = createEngineeringState(contract.loadout);
    const installed = getInstalledComponent(state.draft, contract.loadout.mounts[0]!.hardpointId);
    if (!installed) throw new Error('Expected installed circuit comparison hardware.');
    const recovered = {
      ...installed,
      id: 'recovered-circuit-candidate',
      source: 'combat' as const,
      sourceLabel: 'Act II salvage',
      acquiredSectorIndex: 10,
      qualityId: 'tuned' as const
    };
    const comparison = compareFoundryComponents(recovered, installed);

    expect(createFoundryComponentStatModel(recovered).circuit).toBe(4);
    expect(comparison).toMatchObject({ circuit: 1, tone: 'improved' });
    expect(comparison.label).toContain('S+1');
  });

  it('keeps circuit capacity absent from non-primary component comparisons', () => {
    const contract = generateRunSkeleton('FOUNDRY-NON-PRIMARY-CIRCUIT').contracts[0]!;
    const state = createEngineeringState(contract.loadout);
    const mount = contract.loadout.mounts.find((candidate) => candidate.slot !== 'primary');
    if (!mount) throw new Error('Expected non-primary comparison hardware.');
    const installed = getInstalledComponent(state.draft, mount.hardpointId);
    if (!installed) throw new Error('Expected installed non-primary hardware.');
    const recovered = {
      ...installed,
      id: 'recovered-non-primary-candidate',
      source: 'boss' as const,
      sourceLabel: 'Boss machinery',
      acquiredSectorIndex: 19,
      qualityId: 'relic' as const
    };
    const comparison = compareFoundryComponents(recovered, installed);

    expect(createFoundryComponentStatModel(recovered).circuit).toBe(0);
    expect(comparison.circuit).toBe(0);
    expect(comparison.label).not.toContain(' S');
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
