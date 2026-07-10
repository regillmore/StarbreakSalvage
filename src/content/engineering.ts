import type { ShipFrameId, ShipModuleId, ShipModuleSlot, ShipcraftTag } from './shipModules';

export const COMPONENT_QUALITY_IDS = ['standard', 'tuned', 'prototype', 'relic'] as const;
export const COMPONENT_SOURCES = [
  'contract',
  'combat',
  'shop',
  'elite',
  'vault',
  'boss',
  'route',
  'faction',
  'lunar'
] as const;
export const COMPONENT_ROUTING_MODES = ['balanced', 'power', 'cooling'] as const;
export const ENGINEERING_EFFECT_KINDS = [
  'topology',
  'targeting',
  'heat',
  'defense',
  'economy',
  'hook'
] as const;

export type ComponentQualityId = (typeof COMPONENT_QUALITY_IDS)[number];
export type ComponentSource = (typeof COMPONENT_SOURCES)[number];
export type ComponentRoutingMode = (typeof COMPONENT_ROUTING_MODES)[number];
export type EngineeringEffectKind = (typeof ENGINEERING_EFFECT_KINDS)[number];

export type ComponentAffixId =
  | 'affix_forked_bore'
  | 'affix_vector_vanes'
  | 'affix_quench_jacket'
  | 'affix_reactive_coupler'
  | 'affix_dividend_tap'
  | 'affix_proc_bus';

export type WeaponEvolutionRecipeId =
  | 'recipe_prism_fork'
  | 'recipe_convergence_vanes'
  | 'recipe_vented_receiver'
  | 'recipe_recoil_aegis'
  | 'recipe_salvage_tithe'
  | 'recipe_proc_bridge';

export interface ComponentQualityDefinition {
  readonly id: ComponentQualityId;
  readonly label: string;
  readonly tier: number;
  readonly salvageMultiplier: number;
  readonly baseInstability: number;
  readonly overclockLimit: number;
  readonly effectMultiplier: number;
  readonly presentation: {
    readonly summary: string;
    readonly color: string;
  };
}

export interface ComponentSourceDefinition {
  readonly id: ComponentSource;
  readonly label: string;
  readonly qualityBias: number;
  readonly salvageBonus: number;
  readonly instabilityBonus: number;
  readonly tags: readonly ShipcraftTag[];
}

export interface EngineeringEffectDefinition {
  readonly kind: EngineeringEffectKind;
  readonly magnitude: number;
  readonly hookPriority: number;
}

export interface ComponentAffixDefinition {
  readonly id: ComponentAffixId;
  readonly name: string;
  readonly allowedSlots: readonly ShipModuleSlot[];
  readonly requiredAnyTags: readonly ShipcraftTag[];
  readonly incompatibleTags: readonly ShipcraftTag[];
  readonly resourceDelta: {
    readonly power: number;
    readonly heat: number;
    readonly mass: number;
    readonly command: number;
  };
  readonly instability: number;
  readonly salvageBonus: number;
  readonly effect: EngineeringEffectDefinition;
  readonly presentation: {
    readonly benefit: string;
    readonly tradeoff: string;
    readonly color: string;
  };
}

export interface WeaponEvolutionRecipeDefinition {
  readonly id: WeaponEvolutionRecipeId;
  readonly name: string;
  readonly requiredBaseSlot: 'primary';
  readonly requiredBaseTags: readonly ShipcraftTag[];
  readonly catalystAnyTags: readonly ShipcraftTag[];
  readonly minimumQuality: ComponentQualityId;
  readonly blockedFrameIds: readonly ShipFrameId[];
  readonly maximumApplications: number;
  readonly resourceDelta: {
    readonly power: number;
    readonly heat: number;
    readonly mass: number;
    readonly command: number;
  };
  readonly instability: number;
  readonly effect: EngineeringEffectDefinition;
  readonly presentation: {
    readonly summary: string;
    readonly preview: string;
    readonly risk: string;
    readonly color: string;
  };
}

export interface ComponentCompatibilitySnapshot {
  readonly frameId: ShipFrameId;
  readonly moduleId: ShipModuleId;
  readonly slot: ShipModuleSlot;
  readonly compatibleHardpointIds: readonly string[];
  readonly recipeIds: readonly WeaponEvolutionRecipeId[];
}

export const COMPONENT_QUALITIES: readonly ComponentQualityDefinition[] = [
  {
    id: 'standard',
    label: 'Field Standard',
    tier: 0,
    salvageMultiplier: 1,
    baseInstability: 0,
    overclockLimit: 1,
    effectMultiplier: 1,
    presentation: {
      summary: 'Serviceable salvage with one safe overclock margin.',
      color: '#dbe8ee'
    }
  },
  {
    id: 'tuned',
    label: 'Dock Tuned',
    tier: 1,
    salvageMultiplier: 1.35,
    baseInstability: 1,
    overclockLimit: 2,
    effectMultiplier: 1.15,
    presentation: {
      summary: 'Calibrated salvage with stronger effects and a visible thermal bill.',
      color: '#72f2a7'
    }
  },
  {
    id: 'prototype',
    label: 'Prototype',
    tier: 2,
    salvageMultiplier: 1.8,
    baseInstability: 2,
    overclockLimit: 2,
    effectMultiplier: 1.35,
    presentation: {
      summary: 'Rare engineering stock with excellent output and uncertain tolerances.',
      color: '#ffef5f'
    }
  },
  {
    id: 'relic',
    label: 'Relic Grade',
    tier: 3,
    salvageMultiplier: 2.4,
    baseInstability: 4,
    overclockLimit: 1,
    effectMultiplier: 1.6,
    presentation: {
      summary: 'Recovered machine logic that performs brilliantly and resents explanation.',
      color: '#ff6bd6'
    }
  }
];

export const COMPONENT_SOURCE_DEFINITIONS: readonly ComponentSourceDefinition[] = [
  {
    id: 'contract',
    label: 'Contract issue',
    qualityBias: 0,
    salvageBonus: 0,
    instabilityBonus: 0,
    tags: []
  },
  {
    id: 'combat',
    label: 'Combat wreckage',
    qualityBias: 0,
    salvageBonus: 1,
    instabilityBonus: 0,
    tags: ['weapon']
  },
  {
    id: 'shop',
    label: 'Market surplus',
    qualityBias: 1,
    salvageBonus: 1,
    instabilityBonus: 0,
    tags: ['economy']
  },
  {
    id: 'elite',
    label: 'Elite salvage',
    qualityBias: 2,
    salvageBonus: 2,
    instabilityBonus: 1,
    tags: ['overkill']
  },
  {
    id: 'vault',
    label: 'Vault recovery',
    qualityBias: 2,
    salvageBonus: 2,
    instabilityBonus: 2,
    tags: ['relic', 'curse']
  },
  {
    id: 'boss',
    label: 'Boss machinery',
    qualityBias: 3,
    salvageBonus: 3,
    instabilityBonus: 1,
    tags: ['heavy']
  },
  {
    id: 'route',
    label: 'Route cache',
    qualityBias: 1,
    salvageBonus: 1,
    instabilityBonus: 0,
    tags: ['utility']
  },
  {
    id: 'faction',
    label: 'Faction hardware',
    qualityBias: 2,
    salvageBonus: 2,
    instabilityBonus: 1,
    tags: ['command']
  },
  {
    id: 'lunar',
    label: 'Lunar recovery',
    qualityBias: 1,
    salvageBonus: 2,
    instabilityBonus: 0,
    tags: ['salvage', 'cooling']
  }
];

export const COMPONENT_AFFIXES: readonly ComponentAffixDefinition[] = [
  {
    id: 'affix_forked_bore',
    name: 'Forked Bore',
    allowedSlots: ['primary'],
    requiredAnyTags: ['weapon', 'precision'],
    incompatibleTags: ['beam'],
    resourceDelta: { power: 1, heat: 2, mass: 0, command: 0 },
    instability: 1,
    salvageBonus: 2,
    effect: { kind: 'topology', magnitude: 1, hookPriority: 20 },
    presentation: {
      benefit: 'Adds one bounded flank projectile to each volley.',
      tradeoff: '+1 power, +2 heat.',
      color: '#7cf7ff'
    }
  },
  {
    id: 'affix_vector_vanes',
    name: 'Vector Vanes',
    allowedSlots: ['primary', 'engine'],
    requiredAnyTags: ['weapon', 'mobility', 'precision'],
    incompatibleTags: [],
    resourceDelta: { power: 1, heat: 0, mass: 1, command: 0 },
    instability: 0,
    salvageBonus: 1,
    effect: { kind: 'targeting', magnitude: 0.25, hookPriority: 30 },
    presentation: {
      benefit: 'Converges lateral projectile velocity toward the forward lane.',
      tradeoff: '+1 power, +1 mass.',
      color: '#72f2a7'
    }
  },
  {
    id: 'affix_quench_jacket',
    name: 'Quench Jacket',
    allowedSlots: ['primary', 'engine', 'utility', 'experimental'],
    requiredAnyTags: ['heat', 'cooling', 'heat-routing', 'weapon'],
    incompatibleTags: [],
    resourceDelta: { power: 1, heat: -1, mass: 1, command: 0 },
    instability: 0,
    salvageBonus: 2,
    effect: { kind: 'heat', magnitude: 0.18, hookPriority: 10 },
    presentation: {
      benefit: 'Reduces heat per shot and accelerates venting.',
      tradeoff: '+1 power, +1 mass.',
      color: '#59f2ff'
    }
  },
  {
    id: 'affix_reactive_coupler',
    name: 'Reactive Coupler',
    allowedSlots: ['primary', 'defense', 'experimental'],
    requiredAnyTags: ['weapon', 'defense', 'shield', 'armor'],
    incompatibleTags: [],
    resourceDelta: { power: 1, heat: 1, mass: 1, command: 0 },
    instability: 1,
    salvageBonus: 2,
    effect: { kind: 'defense', magnitude: 0.16, hookPriority: 40 },
    presentation: {
      benefit: 'Reduces incoming damage and emits a revenge pulse on impact.',
      tradeoff: '+1 power, +1 heat, +1 mass.',
      color: '#9adfa7'
    }
  },
  {
    id: 'affix_dividend_tap',
    name: 'Dividend Tap',
    allowedSlots: ['primary', 'secondary', 'utility', 'drone'],
    requiredAnyTags: ['weapon', 'economy', 'credit', 'salvage', 'drone'],
    incompatibleTags: ['curse'],
    resourceDelta: { power: 1, heat: 1, mass: 0, command: 0 },
    instability: 1,
    salvageBonus: 2,
    effect: { kind: 'economy', magnitude: 1, hookPriority: 50 },
    presentation: {
      benefit: 'Adds bounded salvage to qualifying kills.',
      tradeoff: '+1 power, +1 heat.',
      color: '#ffd166'
    }
  },
  {
    id: 'affix_proc_bus',
    name: 'Proc Arbitration Bus',
    allowedSlots: ['primary', 'drone', 'experimental', 'utility'],
    requiredAnyTags: ['weapon', 'command', 'experimental', 'drone'],
    incompatibleTags: [],
    resourceDelta: { power: 1, heat: 1, mass: 0, command: 1 },
    instability: 2,
    salvageBonus: 3,
    effect: { kind: 'hook', magnitude: 4, hookPriority: 5 },
    presentation: {
      benefit: 'Adds arc routing and expands the shared item/module proc budget.',
      tradeoff: '+1 power, +1 heat, +1 command.',
      color: '#ff6bd6'
    }
  }
];

export const WEAPON_EVOLUTION_RECIPES: readonly WeaponEvolutionRecipeDefinition[] = [
  createRecipe({
    id: 'recipe_prism_fork',
    name: 'Prism Fork',
    catalystAnyTags: ['precision', 'laser', 'plasma'],
    resourceDelta: { power: 1, heat: 2, mass: 1, command: 0 },
    instability: 2,
    effect: { kind: 'topology', magnitude: 1, hookPriority: 21 },
    summary: 'Fuse a precision or energy catalyst into a bounded forked volley.',
    preview: '+1 flank projectile per volley, capped across all engineering effects.',
    risk: '+1 power, +2 heat, +1 mass, +2 instability.',
    color: '#7cf7ff'
  }),
  createRecipe({
    id: 'recipe_convergence_vanes',
    name: 'Convergence Vanes',
    catalystAnyTags: ['mobility', 'speed', 'precision'],
    resourceDelta: { power: 1, heat: 0, mass: 1, command: 0 },
    instability: 1,
    effect: { kind: 'targeting', magnitude: 0.32, hookPriority: 31 },
    summary: 'Fuse maneuvering hardware into the weapon carriage.',
    preview: 'Lateral shots converge toward the forward lane without homing simulation.',
    risk: '+1 power, +1 mass, +1 instability.',
    color: '#72f2a7'
  }),
  createRecipe({
    id: 'recipe_vented_receiver',
    name: 'Vented Receiver',
    catalystAnyTags: ['cooling', 'heat-routing', 'heat'],
    resourceDelta: { power: 1, heat: -2, mass: 1, command: 0 },
    instability: 1,
    effect: { kind: 'heat', magnitude: 0.24, hookPriority: 11 },
    summary: 'Fuse thermal routing into the primary receiver.',
    preview: 'Lower heat per shot and faster passive venting.',
    risk: '+1 power, +1 mass, +1 instability.',
    color: '#59f2ff'
  }),
  createRecipe({
    id: 'recipe_recoil_aegis',
    name: 'Recoil Aegis',
    catalystAnyTags: ['defense', 'shield', 'armor'],
    resourceDelta: { power: 1, heat: 1, mass: 2, command: 0 },
    instability: 2,
    effect: { kind: 'defense', magnitude: 0.22, hookPriority: 41 },
    summary: 'Fuse defensive structure into the weapon recoil path.',
    preview: 'Reduces incoming damage and emits a bounded revenge pulse.',
    risk: '+1 power, +1 heat, +2 mass, +2 instability.',
    color: '#9adfa7'
  }),
  createRecipe({
    id: 'recipe_salvage_tithe',
    name: 'Salvage Tithe',
    catalystAnyTags: ['economy', 'credit', 'salvage', 'overkill'],
    resourceDelta: { power: 1, heat: 1, mass: 0, command: 0 },
    instability: 2,
    effect: { kind: 'economy', magnitude: 1, hookPriority: 51 },
    summary: 'Fuse collection logic into the weapon audit trail.',
    preview: 'Qualifying kills add bounded bonus salvage.',
    risk: '+1 power, +1 heat, +2 instability.',
    color: '#ffd166'
  }),
  createRecipe({
    id: 'recipe_proc_bridge',
    name: 'Proc Bridge',
    catalystAnyTags: ['command', 'experimental', 'drone', 'phase'],
    resourceDelta: { power: 1, heat: 2, mass: 0, command: 1 },
    instability: 3,
    effect: { kind: 'hook', magnitude: 6, hookPriority: 6 },
    summary: 'Fuse event-routing hardware into the primary trigger bus.',
    preview: 'Adds arc routing and expands the shared item/module proc budget.',
    risk: '+1 power, +2 heat, +1 command, +3 instability.',
    color: '#ff6bd6'
  })
];

function createRecipe(
  input: Omit<
    WeaponEvolutionRecipeDefinition,
    | 'requiredBaseSlot'
    | 'requiredBaseTags'
    | 'minimumQuality'
    | 'blockedFrameIds'
    | 'maximumApplications'
    | 'presentation'
  > & {
    readonly summary: string;
    readonly preview: string;
    readonly risk: string;
    readonly color: string;
  }
): WeaponEvolutionRecipeDefinition {
  return {
    id: input.id,
    name: input.name,
    requiredBaseSlot: 'primary',
    requiredBaseTags: ['weapon'],
    catalystAnyTags: input.catalystAnyTags,
    minimumQuality: 'standard',
    blockedFrameIds: [],
    maximumApplications: 1,
    resourceDelta: input.resourceDelta,
    instability: input.instability,
    effect: input.effect,
    presentation: {
      summary: input.summary,
      preview: input.preview,
      risk: input.risk,
      color: input.color
    }
  };
}

export function getComponentQuality(id: ComponentQualityId): ComponentQualityDefinition {
  const definition = COMPONENT_QUALITIES.find((quality) => quality.id === id);
  if (!definition) throw new Error(`Unknown component quality: ${id}`);
  return definition;
}

export function getComponentSource(id: ComponentSource): ComponentSourceDefinition {
  const definition = COMPONENT_SOURCE_DEFINITIONS.find((source) => source.id === id);
  if (!definition) throw new Error(`Unknown component source: ${id}`);
  return definition;
}

export function getComponentAffix(id: ComponentAffixId): ComponentAffixDefinition {
  const definition = COMPONENT_AFFIXES.find((affix) => affix.id === id);
  if (!definition) throw new Error(`Unknown component affix: ${id}`);
  return definition;
}

export function getWeaponEvolutionRecipe(
  id: WeaponEvolutionRecipeId
): WeaponEvolutionRecipeDefinition {
  const definition = WEAPON_EVOLUTION_RECIPES.find((recipe) => recipe.id === id);
  if (!definition) throw new Error(`Unknown weapon evolution recipe: ${id}`);
  return definition;
}
