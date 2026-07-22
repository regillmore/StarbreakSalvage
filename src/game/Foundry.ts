import {
  COMPONENT_AFFIXES,
  COMPONENT_QUALITIES,
  WEAPON_EVOLUTION_RECIPES,
  getComponentAffix,
  getComponentQuality,
  getComponentSource,
  getWeaponEvolutionRecipe,
  type ComponentAffixId,
  type ComponentCompatibilitySnapshot,
  type ComponentQualityId,
  type ComponentRoutingMode,
  type ComponentSource,
  type EngineeringEffectDefinition,
  type EngineeringEffectKind,
  type WeaponEvolutionRecipeId
} from '../content/engineering';
import type { ItemTag } from '../content/items';
import {
  SHIP_FRAMES,
  SHIP_MODULES,
  type ShipFrameDefinition,
  type ShipFrameId,
  type ShipModuleDefinition,
  type ShipModuleId,
  type ShipModuleMountSize,
  type ShipcraftTag
} from '../content/shipModules';
import { createRng } from '../core/rng';
import type { RouteKind } from './Generation';
import {
  resolveShipLoadout,
  validateShipLoadout,
  type ResolvedShipLoadout,
  type ShipLoadoutIssueCode,
  type ShipLoadoutResources
} from './ShipLoadout';
import type {
  EnemyKilledPayload,
  FirePayload,
  ItemHookName,
  ItemHookPayloadByName,
  PlayerHitPayload,
  ProjectileBlueprint,
  ProjectileSpawnPayload
} from './ItemHooks';

export type EngineeringActionKind =
  'acquire' | 'install' | 'remove' | 'scrap' | 'reroute' | 'fuse' | 'overclock';

export interface FoundryComponentInstance {
  readonly id: string;
  readonly moduleId: ShipModuleId;
  readonly qualityId: ComponentQualityId;
  readonly source: ComponentSource;
  readonly sourceLabel: string;
  readonly acquiredSectorIndex: number;
  readonly acquisitionOrder: number;
  readonly tags: readonly ShipcraftTag[];
  readonly compatibility: ComponentCompatibilitySnapshot;
  readonly affixIds: readonly ComponentAffixId[];
  readonly evolutionIds: readonly WeaponEvolutionRecipeId[];
  readonly routingMode: ComponentRoutingMode;
  readonly overclockLevel: number;
  readonly instability: number;
  readonly salvageValue: number;
  readonly fusedFromIds: readonly string[];
}

export interface EngineeredMount {
  readonly hardpointId: string;
  readonly componentId: string;
  readonly installationOrder: number;
}

export interface EngineeringSnapshot {
  readonly frameId: ShipFrameId;
  readonly components: readonly FoundryComponentInstance[];
  readonly mounts: readonly EngineeredMount[];
  readonly scrapEarned: number;
}

export interface EngineeringActionRecord {
  readonly id: string;
  readonly kind: EngineeringActionKind;
  readonly sectorIndex: number;
  readonly summary: string;
  readonly componentIds: readonly string[];
  readonly beforeSignature: string;
  readonly afterSignature: string;
}

export interface EngineeringState {
  readonly committed: EngineeringSnapshot;
  readonly draft: EngineeringSnapshot;
  readonly history: readonly EngineeringActionRecord[];
  readonly pendingActions: readonly EngineeringActionRecord[];
  readonly nextComponentSequence: number;
  readonly nextActionSequence: number;
}

export interface EngineeringResourceDelta {
  readonly power: number;
  readonly heat: number;
  readonly mass: number;
  readonly command: number;
}

export interface EngineeringCombatEffects {
  readonly extraProjectiles: number;
  readonly convergence: number;
  readonly heatPerShotMultiplier: number;
  readonly heatVentMultiplier: number;
  readonly damageTakenMultiplier: number;
  readonly bonusSalvagePerKill: number;
  readonly procBudgetBonus: number;
}

export interface EngineeringHookInstance {
  readonly sourceId: string;
  readonly sourceLabel: string;
  readonly acquisitionOrder: number;
  readonly installationOrder: number;
  readonly hook: ItemHookName;
  readonly effect: EngineeringEffectDefinition;
}

export interface EngineeringResolution {
  readonly valid: boolean;
  readonly issues: readonly {
    readonly code: ShipLoadoutIssueCode | 'engineeringResource' | 'instability';
    readonly message: string;
  }[];
  readonly loadout: ResolvedShipLoadout | null;
  readonly resources: ShipLoadoutResources | null;
  readonly instability: number;
  readonly instabilityCapacity: number;
  readonly effects: EngineeringCombatEffects;
  readonly hooks: readonly EngineeringHookInstance[];
  readonly signature: string;
  readonly summary: string;
}

export interface EngineeringCombatProfile {
  readonly weaponId: ResolvedShipLoadout['primaryWeaponId'];
  readonly moduleIds: readonly ShipModuleId[];
  readonly loadoutSignature: string;
  readonly frameName: string;
  readonly moduleSummary: string;
  readonly resources: ShipLoadoutResources;
  readonly instability: number;
  readonly instabilityCapacity: number;
  readonly effects: EngineeringCombatEffects;
  readonly hooks: readonly EngineeringHookInstance[];
  readonly procBudget: number;
}

export interface EngineeringDebugState {
  readonly signature: string;
  readonly installedCount: number;
  readonly cargoCount: number;
  readonly historyCount: number;
  readonly pendingCount: number;
  readonly instability: number;
  readonly instabilityCapacity: number;
  readonly procBudget: number;
  readonly effects: string;
  readonly resources: string;
}

export interface FusionOption {
  readonly id: string;
  readonly baseComponentId: string;
  readonly catalystComponentId: string;
  readonly recipeId: WeaponEvolutionRecipeId;
  readonly title: string;
  readonly preview: string;
  readonly risk: string;
}

export interface FoundryCommitResult {
  readonly ok: boolean;
  readonly state: EngineeringState;
  readonly salvageGained: number;
  readonly issues: readonly string[];
}

export const BASE_COMBINED_PROC_BUDGET = 48;
export const MAX_COMBINED_PROC_BUDGET = 64;
const MAX_ENGINEERED_PROJECTILES = 2;
const MOUNT_SIZE_RANK: Readonly<Record<ShipModuleMountSize, number>> = {
  light: 1,
  medium: 2,
  heavy: 3
};

export function createEngineeringState(loadout: ResolvedShipLoadout): EngineeringState {
  const components = loadout.mounts.map<FoundryComponentInstance>((mount, index) => ({
    id: `component-contract-${mount.hardpointId}`,
    moduleId: mount.moduleId,
    qualityId: 'standard',
    source: 'contract',
    sourceLabel: 'Contract issue',
    acquiredSectorIndex: 0,
    acquisitionOrder: index,
    tags: mount.moduleTags,
    compatibility: {
      frameId: loadout.frameId,
      moduleId: mount.moduleId,
      slot: mount.slot,
      compatibleHardpointIds: [mount.hardpointId],
      recipeIds: getEligibleRecipeIds(mount.slot, mount.moduleTags, loadout.frameId)
    },
    affixIds: [],
    evolutionIds: [],
    routingMode: 'balanced',
    overclockLevel: 0,
    instability: 0,
    salvageValue: 1,
    fusedFromIds: []
  }));
  const snapshot: EngineeringSnapshot = {
    frameId: loadout.frameId,
    components,
    mounts: loadout.mounts.map((mount, index) => ({
      hardpointId: mount.hardpointId,
      componentId: components[index]!.id,
      installationOrder: index
    })),
    scrapEarned: 0
  };

  return {
    committed: snapshot,
    draft: snapshot,
    history: [],
    pendingActions: [],
    nextComponentSequence: components.length,
    nextActionSequence: 0
  };
}

export function generateComponentSalvage(options: {
  readonly seed: string;
  readonly saveFingerprint: string;
  readonly sectorIndex: number;
  readonly routeKind: RouteKind;
  readonly sectorId: string;
  readonly bossRequired: boolean;
  readonly state: EngineeringState;
}): FoundryComponentInstance {
  const source = getComponentSourceForRoute(
    options.routeKind,
    options.sectorId,
    options.bossRequired
  );
  return generateComponentInstance({
    ...options,
    source,
    rngSeed: `${options.seed}:${options.saveFingerprint}:foundry:${options.sectorIndex}:${options.routeKind}:${options.state.nextComponentSequence}`,
    candidateFilter: (module) => module.slot !== 'primary',
    createId: (module, quality) =>
      `component-${options.sectorIndex}-${options.state.nextComponentSequence}-${module.id.replace('module_', '')}-${quality.id}`
  });
}

export function generatePrimaryWeaponOffer(options: {
  readonly seed: string;
  readonly saveFingerprint: string;
  readonly sectorIndex: number;
  readonly routeKind?: RouteKind;
  readonly source?: ComponentSource;
  readonly sectorId: string;
  readonly bossRequired: boolean;
  readonly offerKey: string;
  readonly state: EngineeringState;
}): FoundryComponentInstance {
  const source =
    options.source ??
    (options.routeKind
      ? getComponentSourceForRoute(options.routeKind, options.sectorId, options.bossRequired)
      : getDefaultComponentOfferSource(options.sectorId, options.bossRequired));
  const offerKey = toComponentOfferKey(`${options.offerKey}-${options.routeKind ?? source}`);
  return generateComponentInstance({
    ...options,
    source,
    rngSeed: `${options.seed}:${options.saveFingerprint}:foundry-primary:${options.sectorIndex}:${options.routeKind ?? source}:${options.offerKey}`,
    candidateFilter: (module) => module.slot === 'primary',
    createId: (module, quality) =>
      `component-offer-${options.sectorIndex}-${offerKey}-${module.id.replace('module_', '')}-${quality.id}`
  });
}

function generateComponentInstance(options: {
  readonly sectorIndex: number;
  readonly state: EngineeringState;
  readonly source: ComponentSource;
  readonly rngSeed: string;
  readonly candidateFilter: (module: ShipModuleDefinition) => boolean;
  readonly createId: (
    module: ShipModuleDefinition,
    quality: (typeof COMPONENT_QUALITIES)[number]
  ) => string;
}): FoundryComponentInstance {
  const source = options.source;
  const sourceDefinition = getComponentSource(source);
  const frame = getFrame(options.state.committed.frameId);
  const rng = createRng(options.rngSeed);
  const candidates = SHIP_MODULES.filter(
    (module) =>
      options.candidateFilter(module) &&
      getStructurallyCompatibleHardpoints(frame, module).length > 0
  );
  if (candidates.length === 0) {
    throw new Error(`No compatible ${source} component candidates for ${frame.id}.`);
  }
  const module = rng.weightedChoice(
    candidates.map((candidate) => ({
      item: candidate,
      weight: getComponentDropWeight(candidate, sourceDefinition.tags)
    }))
  );
  const targetTier = Math.min(
    3,
    Math.floor(Math.max(0, options.sectorIndex - 1) / 3) + sourceDefinition.qualityBias
  );
  const quality = rng.weightedChoice(
    COMPONENT_QUALITIES.map((candidate) => ({
      item: candidate,
      weight: Math.max(1, 9 - Math.abs(candidate.tier - targetTier) * 3)
    }))
  );
  const compatibleAffixes = COMPONENT_AFFIXES.filter((affix) => isAffixCompatible(affix, module));
  const affix =
    compatibleAffixes.length > 0 && rng.fork('affix-roll').int(0, 99) < 72
      ? rng.fork('affix-choice').choice(compatibleAffixes)
      : null;
  const salvageValue = Math.max(
    1,
    Math.round(
      (module.mass +
        module.powerDraw +
        2 +
        sourceDefinition.salvageBonus +
        (affix?.salvageBonus ?? 0)) *
        quality.salvageMultiplier
    )
  );
  const compatibleHardpointIds = getStructurallyCompatibleHardpoints(frame, module).map(
    (hardpoint) => hardpoint.id
  );

  return {
    id: options.createId(module, quality),
    moduleId: module.id,
    qualityId: quality.id,
    source,
    sourceLabel: sourceDefinition.label,
    acquiredSectorIndex: options.sectorIndex,
    acquisitionOrder: options.state.nextComponentSequence,
    tags: uniqueTags([...module.tags, ...sourceDefinition.tags]),
    compatibility: {
      frameId: frame.id,
      moduleId: module.id,
      slot: module.slot,
      compatibleHardpointIds,
      recipeIds: getEligibleRecipeIds(module.slot, module.tags, frame.id)
    },
    affixIds: affix ? [affix.id] : [],
    evolutionIds: [],
    routingMode: 'balanced',
    overclockLevel: 0,
    instability:
      quality.baseInstability + sourceDefinition.instabilityBonus + (affix?.instability ?? 0),
    salvageValue,
    fusedFromIds: []
  };
}

export function acquireComponent(
  state: EngineeringState,
  component: FoundryComponentInstance
): EngineeringState {
  if (state.committed.components.some((candidate) => candidate.id === component.id)) return state;
  const committed = {
    ...state.committed,
    components: [...state.committed.components, component]
  };
  const action = createActionRecord(
    state,
    'acquire',
    component.acquiredSectorIndex,
    `Recovered ${formatComponentName(component)} from ${component.sourceLabel}.`,
    [component.id],
    state.committed,
    committed
  );
  return {
    ...state,
    committed,
    draft: committed,
    history: [...state.history, action],
    pendingActions: [],
    nextComponentSequence: Math.max(
      state.nextComponentSequence + 1,
      component.acquisitionOrder + 1
    ),
    nextActionSequence: state.nextActionSequence + 1
  };
}

export function createFoundryDebugFixture(
  state: EngineeringState,
  options: { readonly seed?: string; readonly sectorIndex?: number } = {}
): EngineeringState {
  const seed = options.seed ?? 'FOUNDRY-DEBUG-FIXTURE';
  const sectorIndex = options.sectorIndex ?? 3;
  let fixture = state;
  for (const [index, routeKind] of (['elite', 'vault', 'shop'] as const).entries()) {
    const component = generateComponentSalvage({
      seed,
      saveFingerprint: 'debug-save',
      sectorIndex: sectorIndex + index,
      routeKind,
      sectorId: index === 1 ? 'sector_lunar_surface' : 'sector_trade_war_corridor',
      bossRequired: false,
      state: fixture
    });
    fixture = acquireComponent(fixture, component);
  }
  const primary = generatePrimaryWeaponOffer({
    seed,
    saveFingerprint: 'debug-save',
    sectorIndex: sectorIndex + 3,
    source: 'combat',
    sectorId: 'sector_trade_war_corridor',
    bossRequired: false,
    offerKey: 'debug-primary-reserve',
    state: fixture
  });
  const committed = {
    ...fixture.committed,
    components: [...fixture.committed.components, primary]
  };
  return {
    ...fixture,
    committed,
    draft: committed,
    nextComponentSequence: Math.max(fixture.nextComponentSequence + 1, primary.acquisitionOrder + 1)
  };
}

export function planInstallComponent(
  state: EngineeringState,
  componentId: string,
  hardpointId: string,
  sectorIndex: number
): EngineeringState {
  const component = getComponent(state.draft, componentId);
  if (!component.compatibility.compatibleHardpointIds.includes(hardpointId)) return state;
  const mounts = state.draft.mounts
    .filter((mount) => mount.componentId !== componentId && mount.hardpointId !== hardpointId)
    .concat({
      hardpointId,
      componentId,
      installationOrder: getNextInstallationOrder(state.draft)
    });
  return planSnapshotChange(
    state,
    'install',
    sectorIndex,
    `Install ${formatComponentName(component)} on ${hardpointId}.`,
    [componentId],
    { ...state.draft, mounts }
  );
}

export function planRemoveComponent(
  state: EngineeringState,
  hardpointId: string,
  sectorIndex: number
): EngineeringState {
  const mount = state.draft.mounts.find((candidate) => candidate.hardpointId === hardpointId);
  if (!mount) return state;
  const component = getComponent(state.draft, mount.componentId);
  return planSnapshotChange(
    state,
    'remove',
    sectorIndex,
    `Remove ${formatComponentName(component)} from ${hardpointId}.`,
    [component.id],
    {
      ...state.draft,
      mounts: state.draft.mounts.filter((candidate) => candidate.hardpointId !== hardpointId)
    }
  );
}

export function planScrapComponent(
  state: EngineeringState,
  componentId: string,
  sectorIndex: number
): EngineeringState {
  if (state.draft.mounts.some((mount) => mount.componentId === componentId)) return state;
  const component = getComponent(state.draft, componentId);
  return planSnapshotChange(
    state,
    'scrap',
    sectorIndex,
    `Scrap ${formatComponentName(component)} for ${component.salvageValue} salvage.`,
    [component.id],
    {
      ...state.draft,
      components: state.draft.components.filter((candidate) => candidate.id !== componentId),
      scrapEarned: state.draft.scrapEarned + component.salvageValue
    }
  );
}

export function planRerouteComponent(
  state: EngineeringState,
  componentId: string,
  sectorIndex: number
): EngineeringState {
  const component = getComponent(state.draft, componentId);
  const nextMode: ComponentRoutingMode =
    component.routingMode === 'balanced'
      ? 'power'
      : component.routingMode === 'power'
        ? 'cooling'
        : 'balanced';
  return updateComponent(
    state,
    componentId,
    sectorIndex,
    'reroute',
    `Reroute ${formatComponentName(component)} to ${nextMode}.`,
    (candidate) => ({ ...candidate, routingMode: nextMode })
  );
}

export function planOverclockComponent(
  state: EngineeringState,
  componentId: string,
  sectorIndex: number
): EngineeringState {
  const component = getComponent(state.draft, componentId);
  const quality = getComponentQuality(component.qualityId);
  if (component.overclockLevel >= quality.overclockLimit) return state;
  const nextLevel = component.overclockLevel + 1;
  return updateComponent(
    state,
    componentId,
    sectorIndex,
    'overclock',
    `Overclock ${formatComponentName(component)} to level ${nextLevel}; +1 power, +2 heat, +${nextLevel + 1} instability.`,
    (candidate) => ({
      ...candidate,
      overclockLevel: nextLevel,
      instability: candidate.instability + nextLevel + 1
    })
  );
}

export function getFusionOptions(snapshot: EngineeringSnapshot): FusionOption[] {
  const cargo = getCargoComponents(snapshot);
  const options: FusionOption[] = [];

  for (const base of cargo) {
    const baseModule = getModule(base.moduleId);
    if (baseModule.slot !== 'primary') continue;
    for (const catalyst of cargo) {
      if (catalyst.id === base.id) continue;
      for (const recipe of WEAPON_EVOLUTION_RECIPES) {
        if (!canFuse(snapshot.frameId, base, catalyst, recipe.id)) continue;
        options.push({
          id: `${base.id}:${catalyst.id}:${recipe.id}`,
          baseComponentId: base.id,
          catalystComponentId: catalyst.id,
          recipeId: recipe.id,
          title: `${recipe.name}: ${formatComponentName(base)} + ${formatComponentName(catalyst)}`,
          preview: recipe.presentation.preview,
          risk: recipe.presentation.risk
        });
      }
    }
  }

  return options.sort((left, right) => left.id.localeCompare(right.id));
}

export function planFuseComponents(
  state: EngineeringState,
  option: FusionOption,
  sectorIndex: number
): EngineeringState {
  const validOption = getFusionOptions(state.draft).find((candidate) => candidate.id === option.id);
  if (!validOption) return state;
  const base = getComponent(state.draft, option.baseComponentId);
  const catalyst = getComponent(state.draft, option.catalystComponentId);
  const recipe = getWeaponEvolutionRecipe(option.recipeId);
  const quality = getHigherQuality(base.qualityId, catalyst.qualityId);
  const fused: FoundryComponentInstance = {
    ...base,
    qualityId: quality.id,
    tags: uniqueTags([...base.tags, ...catalyst.tags]),
    affixIds: [...new Set([...base.affixIds, ...catalyst.affixIds])].slice(0, 2),
    evolutionIds: [...base.evolutionIds, recipe.id],
    instability: base.instability + catalyst.instability + recipe.instability,
    salvageValue: base.salvageValue + Math.max(1, Math.floor(catalyst.salvageValue / 2)),
    fusedFromIds: [...base.fusedFromIds, catalyst.id, ...catalyst.fusedFromIds]
  };
  return planSnapshotChange(
    state,
    'fuse',
    sectorIndex,
    `Fuse ${formatComponentName(base)} with ${formatComponentName(catalyst)} using ${recipe.name}.`,
    [base.id, catalyst.id],
    {
      ...state.draft,
      components: state.draft.components
        .filter((component) => component.id !== catalyst.id)
        .map((component) => (component.id === base.id ? fused : component))
    }
  );
}

export function undoFoundryDraft(state: EngineeringState): EngineeringState {
  return { ...state, draft: state.committed, pendingActions: [] };
}

export function commitFoundryDraft(state: EngineeringState): FoundryCommitResult {
  const resolution = resolveEngineeringSnapshot(state.draft);
  if (!resolution.valid) {
    return {
      ok: false,
      state,
      salvageGained: 0,
      issues: resolution.issues.map((issue) => issue.message)
    };
  }
  const salvageGained = Math.max(0, state.draft.scrapEarned - state.committed.scrapEarned);
  return {
    ok: true,
    state: {
      ...state,
      committed: state.draft,
      history: [...state.history, ...state.pendingActions],
      pendingActions: []
    },
    salvageGained,
    issues: []
  };
}

export function resolveEngineeringSnapshot(snapshot: EngineeringSnapshot): EngineeringResolution {
  const componentById = new Map(snapshot.components.map((component) => [component.id, component]));
  const spec = {
    frameId: snapshot.frameId,
    mounts: snapshot.mounts.flatMap((mount) => {
      const component = componentById.get(mount.componentId);
      return component ? [{ hardpointId: mount.hardpointId, moduleId: component.moduleId }] : [];
    })
  };
  const validationOptions = { enforceResourceEnvelope: false } as const;
  const baseValidation = validateShipLoadout(spec, undefined, validationOptions);
  const issues: EngineeringResolution['issues'][number][] = baseValidation.issues.map((issue) => ({
    code: issue.code,
    message: issue.message
  }));
  let loadout: ResolvedShipLoadout | null = null;
  if (baseValidation.valid) loadout = resolveShipLoadout(spec, undefined, validationOptions);
  const installed = getInstalledComponents(snapshot);
  const resourceDelta = installed.reduce<EngineeringResourceDelta>(
    (total, component) => addResourceDelta(total, getComponentResourceDelta(component)),
    { power: 0, heat: 0, mass: 0, command: 0 }
  );
  const resources = baseValidation.resources
    ? applyResourceDelta(baseValidation.resources, resourceDelta)
    : null;
  const frame = getFrame(snapshot.frameId);
  const instability = installed.reduce((total, component) => total + component.instability, 0);
  const instabilityCapacity = 12 + frame.stats.heatRouting + frame.stats.commandCapacity;
  const hooks = createEngineeringHooks(snapshot);
  const effects = summarizeEngineeringEffects(installed);
  const signature = createEngineeringSignature(snapshot);

  return {
    valid: issues.length === 0 && loadout !== null,
    issues,
    loadout,
    resources,
    instability,
    instabilityCapacity,
    effects,
    hooks,
    signature,
    summary: formatEngineeringSnapshot(snapshot, resources, instability, instabilityCapacity)
  };
}

export function createEngineeringCombatProfile(state: EngineeringState): EngineeringCombatProfile {
  const resolution = resolveEngineeringSnapshot(state.committed);
  if (!resolution.valid || !resolution.loadout || !resolution.resources) {
    throw new Error(
      `Committed engineering state is invalid: ${resolution.issues.map((issue) => issue.message).join('; ')}`
    );
  }
  return {
    weaponId: resolution.loadout.primaryWeaponId,
    moduleIds: resolution.loadout.mounts.map((mount) => mount.moduleId),
    loadoutSignature: resolution.signature,
    frameName: resolution.loadout.frameName,
    moduleSummary: resolution.loadout.mounts
      .map((mount) => `${mount.slot}:${mount.moduleShortName}`)
      .join(' / '),
    resources: resolution.resources,
    instability: resolution.instability,
    instabilityCapacity: resolution.instabilityCapacity,
    effects: resolution.effects,
    hooks: resolution.hooks,
    procBudget: Math.min(
      MAX_COMBINED_PROC_BUDGET,
      BASE_COMBINED_PROC_BUDGET + resolution.effects.procBudgetBonus
    )
  };
}

export function createEngineeringDebugState(state: EngineeringState): EngineeringDebugState {
  const resolution = resolveEngineeringSnapshot(state.draft);
  const installedIds = new Set(state.draft.mounts.map((mount) => mount.componentId));
  const procBudget = Math.min(
    MAX_COMBINED_PROC_BUDGET,
    BASE_COMBINED_PROC_BUDGET + resolution.effects.procBudgetBonus
  );
  return {
    signature: resolution.signature,
    installedCount: installedIds.size,
    cargoCount: state.draft.components.filter((component) => !installedIds.has(component.id))
      .length,
    historyCount: state.history.length,
    pendingCount: state.pendingActions.length,
    instability: resolution.instability,
    instabilityCapacity: resolution.instabilityCapacity,
    procBudget,
    effects: formatEngineeringEffects(resolution.effects),
    resources: resolution.resources ? formatResources(resolution.resources) : 'invalid grid'
  };
}

export function getCargoComponents(snapshot: EngineeringSnapshot): FoundryComponentInstance[] {
  const installed = new Set(snapshot.mounts.map((mount) => mount.componentId));
  return snapshot.components.filter((component) => !installed.has(component.id));
}

export function getPrimaryWeaponCargoComponents(
  snapshot: EngineeringSnapshot
): FoundryComponentInstance[] {
  return getCargoComponents(snapshot).filter(
    (component) => getModule(component.moduleId).slot === 'primary'
  );
}

export function consumeCargoComponent(
  state: EngineeringState,
  componentId: string
): EngineeringState {
  const installed = new Set(state.committed.mounts.map((mount) => mount.componentId));
  if (
    installed.has(componentId) ||
    !state.committed.components.some((component) => component.id === componentId)
  ) {
    return state;
  }
  const remove = (snapshot: EngineeringSnapshot): EngineeringSnapshot => ({
    ...snapshot,
    components: snapshot.components.filter((component) => component.id !== componentId)
  });
  return {
    ...state,
    committed: remove(state.committed),
    draft: remove(state.draft)
  };
}

export function getInstalledComponent(
  snapshot: EngineeringSnapshot,
  hardpointId: string
): FoundryComponentInstance | null {
  const mount = snapshot.mounts.find((candidate) => candidate.hardpointId === hardpointId);
  return mount
    ? (snapshot.components.find((component) => component.id === mount.componentId) ?? null)
    : null;
}

export function formatComponentName(component: FoundryComponentInstance): string {
  const module = getModule(component.moduleId);
  const quality = getComponentQuality(component.qualityId);
  const affixes = component.affixIds.map((affixId) => getComponentAffix(affixId).name);
  const evolutions = component.evolutionIds.map(
    (recipeId) => getWeaponEvolutionRecipe(recipeId).name
  );
  return [quality.label, module.presentation.shortName, ...affixes, ...evolutions].join(' / ');
}

export function formatEngineeringHistory(history: readonly EngineeringActionRecord[]): string {
  return history.length > 0
    ? history.map((record) => `S${record.sectorIndex} ${record.summary}`).join(' -> ')
    : 'No engineering changes committed.';
}

export function getComponentTradeoff(component: FoundryComponentInstance): string {
  const delta = getComponentResourceDelta(component);
  const quality = getComponentQuality(component.qualityId);
  return [
    `P${formatDelta(delta.power)} H${formatDelta(delta.heat)} M${formatDelta(delta.mass)} C${formatDelta(delta.command)}`,
    `instability ${component.instability}`,
    `overclock ${component.overclockLevel}/${quality.overclockLimit}`,
    `scrap ${component.salvageValue}`
  ].join(' | ');
}

export function applyEngineeringHook<THook extends ItemHookName>(
  hook: THook,
  source: EngineeringHookInstance,
  payload: ItemHookPayloadByName[THook]
): ItemHookPayloadByName[THook] {
  if (source.hook !== hook) return payload;

  if (hook === 'onFire') {
    return applyEngineeringFire(source, payload as FirePayload) as ItemHookPayloadByName[THook];
  }
  if (hook === 'onProjectileSpawn') {
    return applyEngineeringProjectileSpawn(
      source,
      payload as ProjectileSpawnPayload
    ) as ItemHookPayloadByName[THook];
  }
  if (hook === 'onEnemyKilled') {
    return applyEngineeringEnemyKilled(
      source,
      payload as EnemyKilledPayload
    ) as ItemHookPayloadByName[THook];
  }
  if (hook === 'onPlayerHit') {
    return applyEngineeringPlayerHit(
      source,
      payload as PlayerHitPayload
    ) as ItemHookPayloadByName[THook];
  }
  return payload;
}

function applyEngineeringFire(source: EngineeringHookInstance, payload: FirePayload): FirePayload {
  if (source.effect.kind === 'topology') {
    const base = payload.projectiles[0];
    if (!base) return payload;
    const count = Math.min(
      MAX_ENGINEERED_PROJECTILES,
      Math.max(1, Math.floor(source.effect.magnitude))
    );
    const additions = Array.from({ length: count }, (_value, index) => ({
      ...base,
      x: base.x + (index % 2 === 0 ? -9 : 9),
      vx: base.vx + (index % 2 === 0 ? -105 : 105),
      damage: base.damage * 0.55,
      radius: Math.max(3, base.radius * 0.82),
      tags: addItemTags(base.tags, ['split']),
      procDepth: base.procDepth + 1
    }));
    return { ...payload, projectiles: [...payload.projectiles, ...additions].slice(0, 12) };
  }
  if (source.effect.kind === 'heat') {
    return {
      ...payload,
      projectiles: payload.projectiles.map((projectile) => ({
        ...projectile,
        tags: addItemTags(projectile.tags, ['heat'])
      }))
    };
  }
  return payload;
}

function applyEngineeringProjectileSpawn(
  source: EngineeringHookInstance,
  payload: ProjectileSpawnPayload
): ProjectileSpawnPayload {
  if (source.effect.kind === 'targeting') {
    return {
      projectile: {
        ...payload.projectile,
        vx: payload.projectile.vx * Math.max(0.2, 1 - source.effect.magnitude),
        ttl: payload.projectile.ttl + 0.08
      }
    };
  }
  if (source.effect.kind === 'hook') {
    return {
      projectile: {
        ...payload.projectile,
        tags: addItemTags(payload.projectile.tags, ['arc']),
        procDepth: payload.projectile.procDepth + 1
      }
    };
  }
  return payload;
}

function applyEngineeringEnemyKilled(
  source: EngineeringHookInstance,
  payload: EnemyKilledPayload
): EnemyKilledPayload {
  return source.effect.kind === 'economy'
    ? {
        ...payload,
        bonusSalvage: payload.bonusSalvage + Math.max(1, Math.floor(source.effect.magnitude))
      }
    : payload;
}

function applyEngineeringPlayerHit(
  source: EngineeringHookInstance,
  payload: PlayerHitPayload
): PlayerHitPayload {
  if (source.effect.kind !== 'defense') return payload;
  const revenge: ProjectileBlueprint = {
    x: 0,
    y: -8,
    vx: 0,
    vy: -720,
    radius: 4,
    damage: Math.max(0.35, payload.damage * 0.45),
    ttl: 1.2,
    tags: ['shield', 'revenge'],
    procDepth: 1,
    environmentDamageSource: 'weapon'
  };
  return { ...payload, revengeProjectiles: [...payload.revengeProjectiles, revenge] };
}

function createEngineeringHooks(snapshot: EngineeringSnapshot): EngineeringHookInstance[] {
  return snapshot.mounts.flatMap((mount) => {
    const component = getComponent(snapshot, mount.componentId);
    return getComponentEffects(component).flatMap((effect, effectIndex) => {
      const hook = getHookForEffect(effect.kind);
      return hook
        ? [
            {
              sourceId: component.id,
              sourceLabel: formatComponentName(component),
              acquisitionOrder: component.acquisitionOrder,
              installationOrder: mount.installationOrder * 10 + effectIndex,
              hook,
              effect
            }
          ]
        : [];
    });
  });
}

function getHookForEffect(kind: EngineeringEffectKind): ItemHookName | null {
  if (kind === 'topology' || kind === 'heat') return 'onFire';
  if (kind === 'targeting' || kind === 'hook') return 'onProjectileSpawn';
  if (kind === 'economy') return 'onEnemyKilled';
  if (kind === 'defense') return 'onPlayerHit';
  return null;
}

function summarizeEngineeringEffects(
  installed: readonly FoundryComponentInstance[]
): EngineeringCombatEffects {
  const totals = new Map<EngineeringEffectKind, number>();
  for (const component of installed) {
    for (const effect of getComponentEffects(component)) {
      totals.set(effect.kind, (totals.get(effect.kind) ?? 0) + effect.magnitude);
    }
  }
  const topology = totals.get('topology') ?? 0;
  const targeting = totals.get('targeting') ?? 0;
  const heat = totals.get('heat') ?? 0;
  const defense = totals.get('defense') ?? 0;
  const economy = totals.get('economy') ?? 0;
  const hook = totals.get('hook') ?? 0;
  return {
    extraProjectiles: Math.min(MAX_ENGINEERED_PROJECTILES, Math.max(0, Math.floor(topology))),
    convergence: Math.min(0.75, targeting),
    heatPerShotMultiplier: Math.max(0.55, 1 - Math.min(0.45, heat)),
    heatVentMultiplier: 1 + Math.min(0.8, heat),
    damageTakenMultiplier: Math.max(0.6, 1 - Math.min(0.4, defense)),
    bonusSalvagePerKill: Math.min(3, Math.max(0, Math.floor(economy))),
    procBudgetBonus: Math.min(16, Math.max(0, Math.floor(hook)))
  };
}

function getComponentEffects(component: FoundryComponentInstance): EngineeringEffectDefinition[] {
  const quality = getComponentQuality(component.qualityId);
  const multiplier = quality.effectMultiplier * (1 + component.overclockLevel * 0.25);
  return [
    ...component.affixIds.map((affixId) => getComponentAffix(affixId).effect),
    ...component.evolutionIds.map((recipeId) => getWeaponEvolutionRecipe(recipeId).effect)
  ].map((effect) => ({ ...effect, magnitude: effect.magnitude * multiplier }));
}

export function getComponentResourceDelta(
  component: FoundryComponentInstance
): EngineeringResourceDelta {
  const affixAndRecipe = [
    ...component.affixIds.map((affixId) => getComponentAffix(affixId).resourceDelta),
    ...component.evolutionIds.map((recipeId) => getWeaponEvolutionRecipe(recipeId).resourceDelta)
  ].reduce(addResourceDelta, { power: 0, heat: 0, mass: 0, command: 0 });
  const routing =
    component.routingMode === 'power'
      ? { power: -1, heat: 2, mass: 0, command: 0 }
      : component.routingMode === 'cooling'
        ? { power: 1, heat: -2, mass: 0, command: 0 }
        : { power: 0, heat: 0, mass: 0, command: 0 };
  return addResourceDelta(addResourceDelta(affixAndRecipe, routing), {
    power: component.overclockLevel,
    heat: component.overclockLevel * 2,
    mass: 0,
    command: 0
  });
}

function applyResourceDelta(
  resources: ShipLoadoutResources,
  delta: EngineeringResourceDelta
): ShipLoadoutResources {
  const powerDraw = Math.max(0, resources.powerDraw + delta.power);
  const totalMass = Math.max(0, resources.totalMass + delta.mass);
  const moduleMass = Math.max(0, resources.moduleMass + delta.mass);
  const heatLoad = Math.max(0, resources.heatLoad + delta.heat);
  const commandDraw = Math.max(0, resources.commandDraw + delta.command);
  return {
    ...resources,
    powerDraw,
    powerHeadroom: resources.reactorOutput - powerDraw,
    totalMass,
    moduleMass,
    massHeadroom: resources.massCapacity - totalMass,
    heatLoad,
    heatHeadroom: resources.thermalCapacity - heatLoad,
    commandDraw,
    commandHeadroom: resources.commandCapacity - commandDraw
  };
}

function planSnapshotChange(
  state: EngineeringState,
  kind: Exclude<EngineeringActionKind, 'acquire'>,
  sectorIndex: number,
  summary: string,
  componentIds: readonly string[],
  draft: EngineeringSnapshot
): EngineeringState {
  const action = createActionRecord(
    state,
    kind,
    sectorIndex,
    summary,
    componentIds,
    state.draft,
    draft
  );
  return {
    ...state,
    draft,
    pendingActions: [...state.pendingActions, action],
    nextActionSequence: state.nextActionSequence + 1
  };
}

function updateComponent(
  state: EngineeringState,
  componentId: string,
  sectorIndex: number,
  kind: 'reroute' | 'overclock',
  summary: string,
  update: (component: FoundryComponentInstance) => FoundryComponentInstance
): EngineeringState {
  return planSnapshotChange(state, kind, sectorIndex, summary, [componentId], {
    ...state.draft,
    components: state.draft.components.map((component) =>
      component.id === componentId ? update(component) : component
    )
  });
}

function createActionRecord(
  state: EngineeringState,
  kind: EngineeringActionKind,
  sectorIndex: number,
  summary: string,
  componentIds: readonly string[],
  before: EngineeringSnapshot,
  after: EngineeringSnapshot
): EngineeringActionRecord {
  return {
    id: `engineering-${state.nextActionSequence}-${kind}`,
    kind,
    sectorIndex,
    summary,
    componentIds,
    beforeSignature: createEngineeringSignature(before),
    afterSignature: createEngineeringSignature(after)
  };
}

function createEngineeringSignature(snapshot: EngineeringSnapshot): string {
  const components = [...snapshot.components]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map(
      (component) =>
        `${component.id}=${component.moduleId}@${component.qualityId}:${component.affixIds.join('+')}:${component.evolutionIds.join('+')}:${component.routingMode}:o${component.overclockLevel}:i${component.instability}`
    );
  const mounts = [...snapshot.mounts]
    .sort((left, right) => left.hardpointId.localeCompare(right.hardpointId))
    .map((mount) => `${mount.hardpointId}=${mount.componentId}`);
  return `${snapshot.frameId}|${mounts.join(',')}|${components.join(',')}|s${snapshot.scrapEarned}`;
}

function getInstalledComponents(snapshot: EngineeringSnapshot): FoundryComponentInstance[] {
  return snapshot.mounts.map((mount) => getComponent(snapshot, mount.componentId));
}

function getComponent(
  snapshot: EngineeringSnapshot,
  componentId: string
): FoundryComponentInstance {
  const component = snapshot.components.find((candidate) => candidate.id === componentId);
  if (!component) throw new Error(`Unknown foundry component: ${componentId}`);
  return component;
}

function getModule(moduleId: ShipModuleId): ShipModuleDefinition {
  const module = SHIP_MODULES.find((candidate) => candidate.id === moduleId);
  if (!module) throw new Error(`Unknown foundry module: ${moduleId}`);
  return module;
}

function getFrame(frameId: ShipFrameId): ShipFrameDefinition {
  const frame = SHIP_FRAMES.find((candidate) => candidate.id === frameId);
  if (!frame) throw new Error(`Unknown foundry frame: ${frameId}`);
  return frame;
}

function getStructurallyCompatibleHardpoints(
  frame: ShipFrameDefinition,
  module: ShipModuleDefinition
) {
  return frame.hardpoints.filter(
    (hardpoint) =>
      hardpoint.slot === module.slot &&
      MOUNT_SIZE_RANK[module.size] <= MOUNT_SIZE_RANK[hardpoint.size] &&
      hardpoint.requiredModuleTags.every((tag) => module.tags.includes(tag)) &&
      hardpoint.excludedModuleTags.every((tag) => !module.tags.includes(tag)) &&
      (module.compatibility.allowedFrameIds.length === 0 ||
        module.compatibility.allowedFrameIds.includes(frame.id)) &&
      !module.compatibility.blockedFrameIds.includes(frame.id) &&
      module.compatibility.requiredFrameTags.every((tag) => frame.tags.includes(tag)) &&
      module.compatibility.excludedFrameTags.every((tag) => !frame.tags.includes(tag))
  );
}

function getEligibleRecipeIds(
  slot: ShipModuleDefinition['slot'],
  tags: readonly ShipcraftTag[],
  frameId: ShipFrameId
): WeaponEvolutionRecipeId[] {
  return WEAPON_EVOLUTION_RECIPES.filter(
    (recipe) =>
      slot === recipe.requiredBaseSlot &&
      recipe.requiredBaseTags.every((tag) => tags.includes(tag)) &&
      !recipe.blockedFrameIds.includes(frameId)
  ).map((recipe) => recipe.id);
}

function canFuse(
  frameId: ShipFrameId,
  base: FoundryComponentInstance,
  catalyst: FoundryComponentInstance,
  recipeId: WeaponEvolutionRecipeId
): boolean {
  const recipe = getWeaponEvolutionRecipe(recipeId);
  const baseModule = getModule(base.moduleId);
  const quality = getComponentQuality(base.qualityId);
  const minimumQuality = getComponentQuality(recipe.minimumQuality);
  return (
    baseModule.slot === recipe.requiredBaseSlot &&
    recipe.requiredBaseTags.every((tag) => base.tags.includes(tag)) &&
    recipe.catalystAnyTags.some((tag) => catalyst.tags.includes(tag)) &&
    quality.tier >= minimumQuality.tier &&
    !recipe.blockedFrameIds.includes(frameId) &&
    base.evolutionIds.filter((id) => id === recipe.id).length < recipe.maximumApplications
  );
}

function isAffixCompatible(
  affix: (typeof COMPONENT_AFFIXES)[number],
  module: ShipModuleDefinition
): boolean {
  return (
    affix.allowedSlots.includes(module.slot) &&
    affix.requiredAnyTags.some((tag) => module.tags.includes(tag)) &&
    affix.incompatibleTags.every((tag) => !module.tags.includes(tag))
  );
}

function getComponentDropWeight(
  module: ShipModuleDefinition,
  sourceTags: readonly ShipcraftTag[]
): number {
  return 5 + module.tags.filter((tag) => sourceTags.includes(tag)).length * 3;
}

function getComponentSourceForRoute(
  routeKind: RouteKind,
  sectorId: string,
  bossRequired: boolean
): ComponentSource {
  if (bossRequired) return 'boss';
  if (sectorId === 'sector_lunar_surface') return 'lunar';
  if (routeKind === 'shop') return 'shop';
  if (routeKind === 'elite') return 'elite';
  if (routeKind === 'vault' || routeKind === 'glitch') return 'vault';
  if (routeKind === 'factionAmbush') return 'faction';
  if (routeKind === 'repair') return 'route';
  return 'combat';
}

function getDefaultComponentOfferSource(sectorId: string, bossRequired: boolean): ComponentSource {
  if (bossRequired) return 'boss';
  if (sectorId === 'sector_lunar_surface') return 'lunar';
  return 'combat';
}

function toComponentOfferKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function addResourceDelta(
  left: EngineeringResourceDelta,
  right: EngineeringResourceDelta
): EngineeringResourceDelta {
  return {
    power: left.power + right.power,
    heat: left.heat + right.heat,
    mass: left.mass + right.mass,
    command: left.command + right.command
  };
}

function getHigherQuality(left: ComponentQualityId, right: ComponentQualityId) {
  const leftQuality = getComponentQuality(left);
  const rightQuality = getComponentQuality(right);
  return leftQuality.tier >= rightQuality.tier ? leftQuality : rightQuality;
}

function getNextInstallationOrder(snapshot: EngineeringSnapshot): number {
  return Math.max(-1, ...snapshot.mounts.map((mount) => mount.installationOrder)) + 1;
}

function uniqueTags(tags: readonly ShipcraftTag[]): ShipcraftTag[] {
  return [...new Set(tags)];
}

function addItemTags(tags: readonly ItemTag[], additions: readonly ItemTag[]): ItemTag[] {
  return [...new Set([...tags, ...additions])];
}

function formatEngineeringSnapshot(
  snapshot: EngineeringSnapshot,
  resources: ShipLoadoutResources | null,
  instability: number,
  instabilityCapacity: number
): string {
  const installed = snapshot.mounts.length;
  const cargo = getCargoComponents(snapshot).length;
  return `${installed} installed | ${cargo} cargo | ${resources ? formatResources(resources) : 'invalid grid'} | Instability ${instability}/${instabilityCapacity}`;
}

function formatResources(resources: ShipLoadoutResources): string {
  return `P${resources.powerDraw}/${resources.reactorOutput} H${resources.heatLoad}/${resources.thermalCapacity} M${resources.totalMass}/${resources.massCapacity} C${resources.commandDraw}/${resources.commandCapacity}`;
}

function formatEngineeringEffects(effects: EngineeringCombatEffects): string {
  return `Topo +${effects.extraProjectiles} Aim ${Math.round(effects.convergence * 100)}% Heat ${Math.round(effects.heatPerShotMultiplier * 100)}% Def ${Math.round(effects.damageTakenMultiplier * 100)}% Salv +${effects.bonusSalvagePerKill} Proc +${effects.procBudgetBonus}`;
}

function formatDelta(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}
