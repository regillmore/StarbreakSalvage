import { describe, expect, it } from 'vitest';

import {
  COMPONENT_AFFIXES,
  WEAPON_EVOLUTION_RECIPES,
  type ComponentAffixDefinition,
  type EngineeringEffectKind,
  type WeaponEvolutionRecipeDefinition
} from '../../src/content/engineering';
import { SHIP_FRAMES, SHIP_MODULES, type ShipModuleId } from '../../src/content/shipModules';
import { validateContent } from '../../src/content/contentValidation';
import { createCombatState, updateCombatState } from '../../src/game/CombatState';
import { applyCombinedHooksWithReport } from '../../src/game/CombinedHooks';
import {
  acquireComponent,
  commitFoundryDraft,
  createEngineeringCombatProfile,
  createEngineeringState,
  createFoundryDebugFixture,
  formatEngineeringHistory,
  generateComponentSalvage,
  generatePrimaryWeaponOffer,
  getFusionOptions,
  getPrimaryWeaponCargoComponents,
  planFuseComponents,
  planInstallComponent,
  planOverclockComponent,
  planRemoveComponent,
  planRerouteComponent,
  planScrapComponent,
  resolveEngineeringSnapshot,
  undoFoundryDraft,
  type EngineeringHookInstance,
  type EngineeringState,
  type FoundryComponentInstance
} from '../../src/game/Foundry';
import { generateRunSkeleton } from '../../src/game/Generation';

const BOUNDS = { width: 640, height: 720, padding: 24 } as const;

describe('salvage foundry', () => {
  it('generates deterministic component salvage from seed, save, sector, and acquisition state', () => {
    const firstState = createDebtEngineering();
    const secondState = createDebtEngineering();
    const options = {
      seed: 'FOUNDRY-KNOWN-SEED',
      saveFingerprint: 'unlocks=fresh|upgrades=none',
      sectorIndex: 3,
      routeKind: 'elite' as const,
      sectorId: 'sector_trade_war_corridor',
      bossRequired: false
    };
    const first = generateComponentSalvage({ ...options, state: firstState });
    const second = generateComponentSalvage({ ...options, state: secondState });

    expect(first).toEqual(second);
    expect(first.id).toContain('component-3-');
    expect(first.compatibility.compatibleHardpointIds.length).toBeGreaterThan(0);
    expect(first.salvageValue).toBeGreaterThan(0);
    expect(first.source).toBe('elite');
  });

  it('reserves primary weapons for explicit offers instead of automatic salvage', () => {
    const state = createDebtEngineering();
    const options = {
      saveFingerprint: 'unlocks=fresh|upgrades=none',
      sectorIndex: 3,
      routeKind: 'elite' as const,
      sectorId: 'sector_trade_war_corridor',
      bossRequired: false,
      state
    };

    for (let index = 0; index < 32; index += 1) {
      const automatic = generateComponentSalvage({
        ...options,
        seed: `AUTOMATIC-COMPONENT-${index}`
      });
      expect(SHIP_MODULES.find((module) => module.id === automatic.moduleId)?.slot).not.toBe(
        'primary'
      );
    }

    const offer = generatePrimaryWeaponOffer({
      ...options,
      seed: 'PRIMARY-OFFER',
      offerKey: 'sector-reward'
    });
    const laterSequence = generatePrimaryWeaponOffer({
      ...options,
      seed: 'PRIMARY-OFFER',
      offerKey: 'sector-reward',
      state: { ...state, nextComponentSequence: state.nextComponentSequence + 4 }
    });
    const rerolled = generatePrimaryWeaponOffer({
      ...options,
      seed: 'PRIMARY-OFFER',
      offerKey: 'shop-reroll-1'
    });

    expect(SHIP_MODULES.find((module) => module.id === offer.moduleId)?.slot).toBe('primary');
    expect(laterSequence.id).toBe(offer.id);
    expect(laterSequence.moduleId).toBe(offer.moduleId);
    expect(laterSequence.qualityId).toBe(offer.qualityId);
    expect(rerolled.id).not.toBe(offer.id);
  });

  it('keeps illegal removal in a reversible draft and rejects commit', () => {
    const state = createDebtEngineering();
    const removed = planRemoveComponent(state, 'nose-primary', 1);
    const resolution = resolveEngineeringSnapshot(removed.draft);
    const commit = commitFoundryDraft(removed);

    expect(resolution.valid).toBe(false);
    expect(resolution.issues.map((issue) => issue.code)).toContain('missingRequiredHardpoint');
    expect(commit.ok).toBe(false);
    expect(undoFoundryDraft(removed).draft).toEqual(state.committed);
    expect(undoFoundryDraft(removed).pendingActions).toEqual([]);
  });

  it('keeps foundry resource and instability quotas informational while preserving structural checks', () => {
    const initial = createDebtEngineering();
    const overloaded = {
      ...initial,
      draft: {
        ...initial.draft,
        components: initial.draft.components.map((component) =>
          component.id === 'component-contract-nose-primary'
            ? { ...component, overclockLevel: 20, instability: 99 }
            : component
        )
      }
    };
    const resolution = resolveEngineeringSnapshot(overloaded.draft);
    const commit = commitFoundryDraft(overloaded);

    expect(resolution.resources?.powerHeadroom).toBeLessThan(0);
    expect(resolution.resources?.heatHeadroom).toBeLessThan(0);
    expect(resolution.instability).toBeGreaterThan(resolution.instabilityCapacity);
    expect(resolution.issues).toEqual([]);
    expect(resolution.valid).toBe(true);
    expect(commit.ok).toBe(true);
    expect(createEngineeringCombatProfile(commit.state).weaponId).toBe('weapon_light_needle_laser');
  });

  it('exposes only loose primary weapons to the player-facing cargo reserve', () => {
    const state = createFoundryDebugFixture(createDebtEngineering(), {
      seed: 'PRIMARY-RESERVE-FIXTURE'
    });
    const primaryCargo = getPrimaryWeaponCargoComponents(state.draft);
    const installedPrimary = state.draft.mounts
      .map((mount) =>
        state.draft.components.find((component) => component.id === mount.componentId)
      )
      .find(
        (component) =>
          component !== undefined &&
          SHIP_MODULES.find((module) => module.id === component.moduleId)?.slot === 'primary'
      );

    expect(primaryCargo).toHaveLength(1);
    expect(
      primaryCargo.every(
        (component) =>
          SHIP_MODULES.find((module) => module.id === component.moduleId)?.slot === 'primary'
      )
    ).toBe(true);
    expect(primaryCargo[0]?.moduleId).not.toBe(installedPrimary?.moduleId);
  });

  it('installs, reroutes, overclocks, scraps, and commits explicit resource tradeoffs', () => {
    const initial = createDebtEngineering();
    const loose = createLooseComponent(initial, 'module_primary_basic_blaster', 'loose-blaster');
    let state = acquireComponent(initial, loose);
    state = planRemoveComponent(state, 'nose-primary', 2);
    state = planInstallComponent(state, loose.id, 'nose-primary', 2);
    state = planRerouteComponent(state, loose.id, 2);
    state = planOverclockComponent(state, loose.id, 2);
    const displaced = state.draft.components.find(
      (component) => component.id === 'component-contract-nose-primary'
    );
    if (!displaced) throw new Error('Expected displaced contract primary.');
    state = planScrapComponent(state, displaced.id, 2);
    const resolution = resolveEngineeringSnapshot(state.draft);
    const commit = commitFoundryDraft(state);

    expect(resolution.valid).toBe(true);
    expect(resolution.loadout?.primaryWeaponId).toBe('weapon_basic_blaster');
    expect(resolution.resources?.heatLoad).toBeGreaterThan(initial.committed.mounts.length);
    expect(commit.ok).toBe(true);
    expect(commit.salvageGained).toBe(displaced.salvageValue);
    expect(commit.state.history.map((record) => record.kind)).toEqual(
      expect.arrayContaining(['acquire', 'remove', 'install', 'reroute', 'overclock', 'scrap'])
    );
  });

  it('fuses a catalyst into a bounded topology evolution that changes live fire', () => {
    const initial = createDebtEngineering();
    const catalyst = createLooseComponent(
      initial,
      'module_primary_basic_blaster',
      'topology-catalyst'
    );
    let state = acquireComponent(initial, catalyst);
    state = planRemoveComponent(state, 'nose-primary', 2);
    const option = getFusionOptions(state.draft).find(
      (candidate) =>
        candidate.baseComponentId === 'component-contract-nose-primary' &&
        candidate.catalystComponentId === catalyst.id &&
        candidate.recipeId === 'recipe_prism_fork'
    );
    if (!option) throw new Error('Expected deterministic Prism Fork fusion option.');
    state = planFuseComponents(state, option, 2);
    state = planInstallComponent(state, 'component-contract-nose-primary', 'nose-primary', 2);
    const commit = commitFoundryDraft(state);
    expect(commit.ok).toBe(true);
    const profile = createEngineeringCombatProfile(commit.state);
    expect(profile.effects.extraProjectiles).toBe(1);
    expect(profile.instability).toBeGreaterThan(0);

    const combat = createCombatState(BOUNDS, 'ENGINEERED-TOPOLOGY', {
      engineering: profile,
      shipStats: getDebtContract().shipStats,
      skipEnemyWaves: true
    });
    updateCombatState(combat, { movement: { x: 0, y: 0 }, fire: true }, 1 / 60, BOUNDS);
    expect(combat.projectiles.filter((projectile) => projectile.owner === 'player')).toHaveLength(
      2
    );
    expect(combat.procTelemetry.lastOrder[0]).toContain('module:');
  });

  it('keeps the same acquired components and choices bit-stable', () => {
    const build = () => {
      let state = createFoundryDebugFixture(createDebtEngineering(), {
        seed: 'FOUNDRY-DEBUG-KNOWN-SEED'
      });
      const cargo = state.draft.components.find(
        (component) => !state.draft.mounts.some((mount) => mount.componentId === component.id)
      );
      if (!cargo) throw new Error('Expected debug cargo.');
      state = planOverclockComponent(state, cargo.id, 4);
      state = planRerouteComponent(state, cargo.id, 4);
      return {
        componentIds: state.draft.components.map((component) => component.id),
        signature: resolveEngineeringSnapshot(state.draft).signature,
        pending: state.pendingActions.map((action) => action.summary)
      };
    };

    expect(build()).toEqual(build());
  });

  it('formats the path from starting ship through committed engineering history', () => {
    const initial = createDebtEngineering();
    const loose = createLooseComponent(initial, 'module_primary_basic_blaster', 'history-loose');
    let state = acquireComponent(initial, loose);
    state = planOverclockComponent(state, loose.id, 1);
    const committed = commitFoundryDraft(state);

    expect(committed.ok).toBe(true);
    expect(formatEngineeringHistory(committed.state.history)).toContain('Recovered');
    expect(formatEngineeringHistory(committed.state.history)).toContain('Overclock');
  });
});

describe('combined item and module hooks', () => {
  it('orders module hooks before acquired items and enforces one shared budget', () => {
    const moduleHook = createHook('topology', 'onFire', 1, 20);
    const report = applyCombinedHooksWithReport(
      'onFire',
      [{ itemId: 'item_split_prism', acquisitionOrder: 0 }],
      [moduleHook],
      { volleyIndex: 1, projectiles: [baseProjectile()] },
      { maxApplications: 1 }
    );

    expect(report.appliedSources.map((source) => `${source.kind}:${source.sourceId}`)).toEqual([
      'module:module-hook-topology'
    ]);
    expect(report.skippedItemIds).toEqual(['item_split_prism']);
    expect(report.payload.projectiles).toHaveLength(2);
  });

  it('applies topology, targeting, heat, defense, economy, and hook evolutions materially', () => {
    const topology = applyCombinedHooksWithReport(
      'onFire',
      [],
      [createHook('topology', 'onFire', 1, 20)],
      { volleyIndex: 1, projectiles: [baseProjectile()] }
    ).payload;
    const heat = applyCombinedHooksWithReport(
      'onFire',
      [],
      [createHook('heat', 'onFire', 0.2, 10)],
      { volleyIndex: 1, projectiles: [baseProjectile()] }
    ).payload;
    const targeting = applyCombinedHooksWithReport(
      'onProjectileSpawn',
      [],
      [createHook('targeting', 'onProjectileSpawn', 0.4, 30)],
      { projectile: { ...baseProjectile(), vx: 120 } }
    ).payload;
    const hook = applyCombinedHooksWithReport(
      'onProjectileSpawn',
      [],
      [createHook('hook', 'onProjectileSpawn', 4, 5)],
      { projectile: baseProjectile() }
    ).payload;
    const economy = applyCombinedHooksWithReport(
      'onEnemyKilled',
      [],
      [createHook('economy', 'onEnemyKilled', 2, 50)],
      {
        projectileTags: ['laser'],
        overkillDamage: 0,
        bonusSalvage: 0,
        blastDamage: 0
      }
    ).payload;
    const defense = applyCombinedHooksWithReport(
      'onPlayerHit',
      [],
      [createHook('defense', 'onPlayerHit', 0.2, 40)],
      { damage: 1, revengeProjectiles: [] }
    ).payload;

    expect(topology.projectiles).toHaveLength(2);
    expect(heat.projectiles[0]?.tags).toContain('heat');
    expect(Math.abs(targeting.projectile.vx)).toBeLessThan(120);
    expect(hook.projectile.tags).toContain('arc');
    expect(economy.bonusSalvage).toBe(2);
    expect(defense.revengeProjectiles).toHaveLength(1);
  });
});

describe('engineering content validation', () => {
  it('rejects invalid affix and recipe contracts', () => {
    const invalidAffixes = COMPONENT_AFFIXES.map((affix, index) =>
      index === 0
        ? {
            ...affix,
            effect: { ...affix.effect, kind: 'telepathy', magnitude: 0 },
            resourceDelta: { ...affix.resourceDelta, power: Number.NaN },
            presentation: { ...affix.presentation, benefit: '' }
          }
        : affix
    ) as unknown as readonly ComponentAffixDefinition[];
    const invalidRecipes = WEAPON_EVOLUTION_RECIPES.map((recipe, index) =>
      index === 0
        ? {
            ...recipe,
            minimumQuality: 'mythic',
            maximumApplications: 0,
            catalystAnyTags: [],
            blockedFrameIds: ['frame_missing']
          }
        : recipe
    ) as unknown as readonly WeaponEvolutionRecipeDefinition[];
    const errors = validateContent({
      componentAffixes: invalidAffixes,
      weaponEvolutionRecipes: invalidRecipes
    });

    expect(errors).toContain('Component affix affix_forked_bore has invalid effect: telepathy');
    expect(errors).toContain(
      'Component affix affix_forked_bore must have positive effect magnitude'
    );
    expect(errors).toContain('Component affix affix_forked_bore must have integer power delta');
    expect(errors).toContain('Component affix affix_forked_bore must describe its benefit');
    expect(errors).toContain(
      'Weapon evolution recipe recipe_prism_fork must require a catalyst tag'
    );
    expect(errors).toContain(
      'Weapon evolution recipe recipe_prism_fork references missing quality: mythic'
    );
    expect(errors).toContain(
      'Weapon evolution recipe recipe_prism_fork has invalid blocked frame: frame_missing'
    );
    expect(errors).toContain(
      'Weapon evolution recipe recipe_prism_fork must have positive maximumApplications'
    );
  });
});

function createDebtEngineering(): EngineeringState {
  return createEngineeringState(getDebtContract().loadout);
}

function getDebtContract() {
  const contract = generateRunSkeleton('STARBREAK-SMOKE').contracts.find(
    (candidate) => candidate.shipId === 'ship_debt_runner'
  );
  if (!contract) throw new Error('Expected Debt Runner contract.');
  return contract;
}

function createLooseComponent(
  state: EngineeringState,
  moduleId: ShipModuleId,
  id: string
): FoundryComponentInstance {
  const module = SHIP_MODULES.find((candidate) => candidate.id === moduleId);
  const frame = SHIP_FRAMES.find((candidate) => candidate.id === state.committed.frameId);
  if (!module || !frame) throw new Error('Missing foundry fixture content.');
  const hardpointIds = frame.hardpoints
    .filter((hardpoint) => hardpoint.slot === module.slot)
    .map((hardpoint) => hardpoint.id);
  return {
    id,
    moduleId,
    qualityId: 'standard',
    source: 'combat',
    sourceLabel: 'Combat wreckage',
    acquiredSectorIndex: 1,
    acquisitionOrder: state.nextComponentSequence,
    tags: module.tags,
    compatibility: {
      frameId: frame.id,
      moduleId,
      slot: module.slot,
      compatibleHardpointIds: hardpointIds,
      recipeIds: WEAPON_EVOLUTION_RECIPES.map((recipe) => recipe.id)
    },
    affixIds: [],
    evolutionIds: [],
    routingMode: 'balanced',
    overclockLevel: 0,
    instability: 0,
    salvageValue: 4,
    fusedFromIds: []
  };
}

function createHook(
  kind: EngineeringEffectKind,
  hook: EngineeringHookInstance['hook'],
  magnitude: number,
  hookPriority: number
): EngineeringHookInstance {
  return {
    sourceId: `module-hook-${kind}`,
    sourceLabel: `${kind} test module`,
    acquisitionOrder: 0,
    installationOrder: 0,
    hook,
    effect: { kind, magnitude, hookPriority }
  };
}

function baseProjectile() {
  return {
    x: 100,
    y: 200,
    vx: 0,
    vy: -700,
    radius: 4,
    damage: 1,
    ttl: 1.4,
    tags: ['laser'] as const,
    procDepth: 0
  };
}
