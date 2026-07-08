import { ACHIEVEMENTS, type AchievementDefinition } from './achievements';
import {
  ACT_ROUTE_CONTRACTS,
  ACT_ROUTE_TAGS,
  type ActRouteContractDefinition
} from './actRouteContracts';
import {
  ACT_BOSS_GATE_KINDS,
  ACT_DEFINITIONS,
  ACT_PRESSURE_TIERS,
  ACT_REWARD_TIERS,
  ACT_ROUTE_KINDS,
  ACT_TRANSITION_KINDS,
  type ActDefinition
} from './acts';
import { BACKGROUNDS, BACKGROUND_LAYER_KINDS, type BackgroundDefinition } from './backgrounds';
import { BOSSES, type BossDefinition } from './bosses';
import { FACTIONS, type FactionDefinition } from './factions';
import {
  ENEMY_FORMATIONS,
  ENEMY_FORMATION_BREAK_CONDITIONS,
  ENEMY_FORMATION_CLEANUP_POLICIES,
  ENEMY_FORMATION_ENTRY_STYLES,
  ENEMY_FORMATION_IDS,
  ENEMY_FORMATION_SHAPES,
  type EnemyFormationDefinition
} from './enemyFormations';
import {
  ENEMY_VARIANTS,
  ENEMY_VARIANT_ENCOUNTER_TYPES,
  ENEMY_VARIANT_IDS,
  type EnemyVariantDefinition
} from './enemyVariants';
import {
  ENVIRONMENT_OBJECT_ACCESSIBILITY_VARIANTS,
  ENVIRONMENT_OBJECT_CHAIN_BEHAVIORS,
  ENVIRONMENT_OBJECT_COLLISION_SHAPES,
  ENVIRONMENT_OBJECT_DAMAGE_SOURCES,
  ENVIRONMENT_OBJECT_DEFINITIONS,
  ENVIRONMENT_OBJECT_FAMILIES,
  ENVIRONMENT_OBJECT_IDS,
  ENVIRONMENT_OBJECT_KINDS,
  ENVIRONMENT_OBJECT_OBJECTIVE_POLICIES,
  ENVIRONMENT_OBJECT_RENDER_CUES,
  ENVIRONMENT_OBJECT_RENDER_LAYERS,
  ENVIRONMENT_OBJECT_REWARD_POLICIES,
  type EnvironmentObjectDefinition
} from './environmentObjects';
import {
  ITEM_FAMILIES,
  ITEM_ARCHETYPES,
  ITEM_HOOKS,
  ITEM_IMPLEMENTATION_STATUSES,
  ITEM_POOL_PROFILE_IDS,
  ITEM_POOL_WEIGHT_PROFILES,
  ITEM_SOURCES,
  ITEM_STACKING_MODES,
  ITEMS,
  ITEM_TAGS,
  ITEM_UI_TAGS,
  ITEM_UNLOCK_TIERS,
  REWARD_POOLS,
  type ItemHook,
  type ItemId,
  type ItemDefinition,
  type ItemPoolWeightProfileDefinition,
  type ItemUnlockTier,
  type RewardPoolDefinition
} from './items';
import { SECTORS, type SectorDefinition } from './sectors';
import {
  SHIP_HUD_THEME_KEYS,
  SHIP_SILHOUETTES,
  SHIP_WEAPON_MOUNT_HINTS,
  SHIPS,
  type ShipDefinition
} from './ships';
import { UNLOCKS, type UnlockDefinition, type UnlockId } from './unlocks';
import {
  UPGRADES,
  UPGRADE_CATEGORIES,
  UPGRADE_EFFECT_KINDS,
  UPGRADE_ICON_KEYS,
  type UpgradeDefinition
} from './upgrades';
import { WEAPONS, type WeaponDefinition } from './weapons';
import { ITEM_HOOK_IMPLEMENTATIONS } from '../game/ItemHooks';
import { COMBAT_ARENA_PADDING, COMBAT_ARENA_WIDTH } from '../game/CombatGeometry';
import {
  ITEM_FAMILY_GATES,
  ITEM_UNLOCKS,
  type ItemFamilyGateDefinition
} from '../game/UnlockGates';
import {
  ENEMY_ATTACK_FAMILIES,
  ENEMY_CLASS_IDS,
  ENEMY_FACTION_FITS,
  ENEMY_FORMATION_ELIGIBILITIES,
  ENEMY_MOVEMENT_FAMILIES,
  ENEMY_OBJECTIVE_POLICIES,
  ENEMY_PRESSURE_TYPES,
  ENEMY_READABILITY_TIERS,
  ENEMY_ROLE_IDS,
  ENEMY_VARIANT_ELIGIBILITIES,
  type EnemyRoleMetadata
} from './enemyRoles';
import {
  HAZARD_ZONE_BOSS_ARENA_POLICIES,
  HAZARD_ZONE_BEHAVIOR_KINDS,
  HAZARD_ZONE_COLLISION_SHAPES,
  HAZARD_ZONE_DAMAGE_SHAPES,
  HAZARD_ZONE_DEFINITIONS,
  HAZARD_ZONE_FAMILIES,
  HAZARD_ZONE_IDS,
  HAZARD_ZONE_RENDER_LAYERS,
  HAZARD_ZONE_SAFE_LANE_POLICIES,
  HAZARD_ZONE_SCHEDULE_SOURCES,
  HAZARD_ZONE_SETTINGS_VARIANTS,
  HAZARD_ZONE_TELEGRAPH_SHAPES,
  type HazardZoneDefinition
} from './hazardZones';

export type ItemHookImplementationRegistry = Readonly<Partial<Record<ItemHook, readonly ItemId[]>>>;

export interface ContentValidationInput {
  readonly acts?: readonly ActDefinition[];
  readonly actRouteContracts?: readonly ActRouteContractDefinition[];
  readonly achievements?: readonly AchievementDefinition[];
  readonly backgrounds?: readonly BackgroundDefinition[];
  readonly bosses?: readonly BossDefinition[];
  readonly enemyFormations?: readonly EnemyFormationDefinition[];
  readonly enemyVariants?: readonly EnemyVariantDefinition[];
  readonly environmentObjects?: readonly EnvironmentObjectDefinition[];
  readonly factions?: readonly FactionDefinition[];
  readonly hazardZones?: readonly HazardZoneDefinition[];
  readonly items?: readonly ItemDefinition[];
  readonly itemHookImplementations?: ItemHookImplementationRegistry;
  readonly itemFamilyGates?: readonly ItemFamilyGateDefinition[];
  readonly itemPoolWeightProfiles?: readonly ItemPoolWeightProfileDefinition[];
  readonly itemUnlocks?: Readonly<Partial<Record<ItemId, UnlockId>>>;
  readonly rewardPools?: readonly RewardPoolDefinition[];
  readonly sectors?: readonly SectorDefinition[];
  readonly ships?: readonly ShipDefinition[];
  readonly unlocks?: readonly UnlockDefinition[];
  readonly upgrades?: readonly UpgradeDefinition[];
  readonly weapons?: readonly WeaponDefinition[];
}

export function validateContent(input: ContentValidationInput = {}): string[] {
  const acts = input.acts ?? ACT_DEFINITIONS;
  const actRouteContracts = input.actRouteContracts ?? ACT_ROUTE_CONTRACTS;
  const achievements = input.achievements ?? ACHIEVEMENTS;
  const backgrounds = input.backgrounds ?? BACKGROUNDS;
  const bosses = input.bosses ?? BOSSES;
  const enemyFormations = input.enemyFormations ?? ENEMY_FORMATIONS;
  const enemyVariants = input.enemyVariants ?? ENEMY_VARIANTS;
  const environmentObjects = input.environmentObjects ?? ENVIRONMENT_OBJECT_DEFINITIONS;
  const factions = input.factions ?? FACTIONS;
  const hazardZones = input.hazardZones ?? HAZARD_ZONE_DEFINITIONS;
  const items = input.items ?? ITEMS;
  const itemHookImplementations = createItemHookImplementationRegistry(
    input.itemHookImplementations
  );
  const itemFamilyGates = input.itemFamilyGates ?? ITEM_FAMILY_GATES;
  const itemPoolWeightProfiles = input.itemPoolWeightProfiles ?? ITEM_POOL_WEIGHT_PROFILES;
  const itemUnlocks = input.itemUnlocks ?? ITEM_UNLOCKS;
  const rewardPools = input.rewardPools ?? REWARD_POOLS;
  const sectors = input.sectors ?? SECTORS;
  const ships = input.ships ?? SHIPS;
  const unlocks = input.unlocks ?? UNLOCKS;
  const upgrades = input.upgrades ?? UPGRADES;
  const weapons = input.weapons ?? WEAPONS;
  const errors: string[] = [];
  const achievementIds = new Set<string>();
  const backgroundIds = new Set<string>();
  const bossIds = new Set<string>();
  const factionIds = new Set<string>();
  const itemIds = new Set<string>();
  const shipIds = new Set<string>();
  const unlockIds = new Set<string>();
  const upgradeIds = new Set<string>();
  const weaponIds = new Set<string>();
  const tagRegistry = new Set<string>(ITEM_TAGS);
  const hookRegistry = new Set<string>(ITEM_HOOKS);
  const itemRarities = new Set(['common', 'uncommon', 'rare', 'prototype', 'cursed']);
  const itemFamilies = new Set<string>(ITEM_FAMILIES);
  const itemPoolProfileIds = new Set<string>(ITEM_POOL_PROFILE_IDS);
  const itemSources = new Set<string>(ITEM_SOURCES);
  const itemUnlockTiers = new Set<string>(ITEM_UNLOCK_TIERS);
  const itemImplementationStatuses = new Set<string>(ITEM_IMPLEMENTATION_STATUSES);
  const itemStackingModes = new Set<string>(ITEM_STACKING_MODES);
  const itemUiTags = new Set<string>(ITEM_UI_TAGS);
  const factionPatterns = new Set(['driftShot', 'laneBurst', 'sporeSpread', 'phaseSkirmish']);
  const factionShapes = new Set(['jagged', 'diamond', 'organic', 'needle']);
  const enemyClassIds = new Set<string>(ENEMY_CLASS_IDS);
  const enemyRoles = new Set<string>(ENEMY_ROLE_IDS);
  const enemyPressureTypes = new Set<string>(ENEMY_PRESSURE_TYPES);
  const enemyMovementFamilies = new Set<string>(ENEMY_MOVEMENT_FAMILIES);
  const enemyAttackFamilies = new Set<string>(ENEMY_ATTACK_FAMILIES);
  const enemyVariantEligibilities = new Set<string>(ENEMY_VARIANT_ELIGIBILITIES);
  const enemyFormationEligibilities = new Set<string>(ENEMY_FORMATION_ELIGIBILITIES);
  const enemyReadabilityTiers = new Set<string>(ENEMY_READABILITY_TIERS);
  const enemyFactionFits = new Set<string>(ENEMY_FACTION_FITS);
  const enemyObjectivePolicies = new Set<string>(ENEMY_OBJECTIVE_POLICIES);
  const enemyFormationIds = new Set<string>(ENEMY_FORMATION_IDS);
  const enemyFormationShapes = new Set<string>(ENEMY_FORMATION_SHAPES);
  const enemyFormationEntryStyles = new Set<string>(ENEMY_FORMATION_ENTRY_STYLES);
  const enemyFormationBreakConditions = new Set<string>(ENEMY_FORMATION_BREAK_CONDITIONS);
  const enemyFormationCleanupPolicies = new Set<string>(ENEMY_FORMATION_CLEANUP_POLICIES);
  const enemyVariantIds = new Set<string>(ENEMY_VARIANT_IDS);
  const enemyVariantEncounterTypes = new Set<string>(ENEMY_VARIANT_ENCOUNTER_TYPES);
  const environmentObjectIds = new Set<string>(ENVIRONMENT_OBJECT_IDS);
  const environmentObjectKinds = new Set<string>(ENVIRONMENT_OBJECT_KINDS);
  const environmentObjectFamilies = new Set<string>(ENVIRONMENT_OBJECT_FAMILIES);
  const environmentObjectCollisionShapes = new Set<string>(ENVIRONMENT_OBJECT_COLLISION_SHAPES);
  const environmentObjectDamageSources = new Set<string>(ENVIRONMENT_OBJECT_DAMAGE_SOURCES);
  const environmentObjectObjectivePolicies = new Set<string>(ENVIRONMENT_OBJECT_OBJECTIVE_POLICIES);
  const environmentObjectRewardPolicies = new Set<string>(ENVIRONMENT_OBJECT_REWARD_POLICIES);
  const environmentObjectChainBehaviors = new Set<string>(ENVIRONMENT_OBJECT_CHAIN_BEHAVIORS);
  const environmentObjectRenderCues = new Set<string>(ENVIRONMENT_OBJECT_RENDER_CUES);
  const environmentObjectRenderLayers = new Set<string>(ENVIRONMENT_OBJECT_RENDER_LAYERS);
  const environmentObjectAccessibilityVariants = new Set<string>(
    ENVIRONMENT_OBJECT_ACCESSIBILITY_VARIANTS
  );
  const hazardZoneIds = new Set<string>(HAZARD_ZONE_IDS);
  const hazardZoneFamilies = new Set<string>(HAZARD_ZONE_FAMILIES);
  const hazardZoneTelegraphShapes = new Set<string>(HAZARD_ZONE_TELEGRAPH_SHAPES);
  const hazardZoneDamageShapes = new Set<string>(HAZARD_ZONE_DAMAGE_SHAPES);
  const hazardZoneSafeLanePolicies = new Set<string>(HAZARD_ZONE_SAFE_LANE_POLICIES);
  const hazardZoneRenderLayers = new Set<string>(HAZARD_ZONE_RENDER_LAYERS);
  const hazardZoneCollisionShapes = new Set<string>(HAZARD_ZONE_COLLISION_SHAPES);
  const hazardZoneSettingsVariants = new Set<string>(HAZARD_ZONE_SETTINGS_VARIANTS);
  const hazardZoneBossArenaPolicies = new Set<string>(HAZARD_ZONE_BOSS_ARENA_POLICIES);
  const hazardZoneScheduleSources = new Set<string>(HAZARD_ZONE_SCHEDULE_SOURCES);
  const hazardZoneBehaviorKinds = new Set<string>(HAZARD_ZONE_BEHAVIOR_KINDS);
  const backgroundLayerKinds = new Set<string>(BACKGROUND_LAYER_KINDS);
  const actRouteKinds = new Set<string>(ACT_ROUTE_KINDS);
  const actRewardTiers = new Set<string>(ACT_REWARD_TIERS);
  const actPressureTiers = new Set<string>(ACT_PRESSURE_TIERS);
  const actBossGateKinds = new Set<string>(ACT_BOSS_GATE_KINDS);
  const actTransitionKinds = new Set<string>(ACT_TRANSITION_KINDS);
  const actRouteTags = new Set<string>(ACT_ROUTE_TAGS);
  const sectorObjectiveKinds = new Set(['clearWaves', 'defeatBoss']);
  const unlockKinds = new Set(['ship', 'item', 'faction', 'bossPractice', 'music', 'challenge']);
  const upgradeCategories = new Set<string>(UPGRADE_CATEGORIES);
  const upgradeEffectKinds = new Set<string>(UPGRADE_EFFECT_KINDS);
  const upgradeIconKeys = new Set<string>(UPGRADE_ICON_KEYS);
  const weaponPatterns = new Set(['single', 'dual', 'spread', 'split', 'missile', 'beam']);
  const bossPatterns = new Set(['auditFan', 'missileCurtain', 'sporeSpiral']);
  const shipSilhouettes = new Set<string>(SHIP_SILHOUETTES);
  const shipMountHints = new Set<string>(SHIP_WEAPON_MOUNT_HINTS);
  const shipHudThemeKeys = new Set<string>(SHIP_HUD_THEME_KEYS);
  const canonicalActIds = new Set<string>(acts.map((act) => act.id));
  const canonicalBackgroundIds = new Set<string>(backgrounds.map((background) => background.id));
  const canonicalFactionIds = new Set<string>(factions.map((faction) => faction.id));
  const canonicalSectorIds = new Set<string>(sectors.map((sector) => sector.id));
  const canonicalUnlockIds = new Set<string>(unlocks.map((unlock) => unlock.id));

  validateActDefinitions(errors, acts, {
    routeKinds: actRouteKinds,
    rewardTiers: actRewardTiers,
    pressureTiers: actPressureTiers,
    bossGateKinds: actBossGateKinds,
    transitionKinds: actTransitionKinds,
    sectors: canonicalSectorIds
  });
  validateActRouteContracts(errors, actRouteContracts, {
    acts: canonicalActIds,
    routeKinds: actRouteKinds,
    sectors: canonicalSectorIds,
    factions: canonicalFactionIds,
    backgrounds: canonicalBackgroundIds,
    objectiveKinds: sectorObjectiveKinds,
    routeTags: actRouteTags,
    unlocks: canonicalUnlockIds
  });

  if (items.length < 30) {
    errors.push('Content must define at least 30 items');
  }

  if (factions.length < 4) {
    errors.push('Content must define at least 4 factions');
  }

  for (const background of backgrounds) {
    if (backgroundIds.has(background.id)) {
      errors.push(`Duplicate background id: ${background.id}`);
    }

    backgroundIds.add(background.id);

    if (!background.name.trim()) {
      errors.push(`Background ${background.id} must have a name`);
    }

    if (background.layers.length < 3) {
      errors.push(`Background ${background.id} must define at least three strata`);
    }

    for (const layer of background.layers) {
      if (!layer.id.trim()) {
        errors.push(`Background ${background.id} layer must have an id`);
      }

      if (!backgroundLayerKinds.has(layer.kind)) {
        errors.push(
          `Background ${background.id} layer ${layer.id} has invalid kind: ${layer.kind}`
        );
      }

      validateUnitNumber(
        errors,
        `Background ${background.id} layer ${layer.id}`,
        'alpha',
        layer.alpha
      );
      validatePositiveNumber(
        errors,
        `Background ${background.id} layer ${layer.id}`,
        'parallax',
        layer.parallax
      );
      validatePositiveInteger(
        errors,
        `Background ${background.id} layer ${layer.id}`,
        'density',
        layer.density
      );

      if (layer.priority !== 1 && layer.priority !== 2 && layer.priority !== 3) {
        errors.push(`Background ${background.id} layer ${layer.id} has invalid priority`);
      }
    }
  }

  for (const unlock of unlocks) {
    if (unlockIds.has(unlock.id)) {
      errors.push(`Duplicate unlock id: ${unlock.id}`);
    }

    unlockIds.add(unlock.id);

    if (!unlockKinds.has(unlock.kind)) {
      errors.push(`Unlock ${unlock.id} has invalid kind: ${unlock.kind}`);
    }

    if (!unlock.summary.trim()) {
      errors.push(`Unlock ${unlock.id} must have a summary`);
    }

    if (!unlock.effect.trim()) {
      errors.push(`Unlock ${unlock.id} must describe its effect`);
    }

    if (unlock.grants.length === 0) {
      errors.push(`Unlock ${unlock.id} must list at least one grant`);
    }
  }

  for (const upgrade of upgrades) {
    if (upgradeIds.has(upgrade.id)) {
      errors.push(`Duplicate upgrade id: ${upgrade.id}`);
    }

    upgradeIds.add(upgrade.id);

    if (!upgradeCategories.has(upgrade.category)) {
      errors.push(`Upgrade ${upgrade.id} has invalid category: ${upgrade.category}`);
    }

    if (!upgradeIconKeys.has(upgrade.iconKey)) {
      errors.push(`Upgrade ${upgrade.id} has invalid icon: ${upgrade.iconKey}`);
    }

    if (!upgradeEffectKinds.has(upgrade.effectKind)) {
      errors.push(`Upgrade ${upgrade.id} has invalid effect kind: ${upgrade.effectKind}`);
    }

    if (!upgrade.name.trim()) {
      errors.push(`Upgrade ${upgrade.id} must have a name`);
    }

    if (!upgrade.summary.trim()) {
      errors.push(`Upgrade ${upgrade.id} must have a summary`);
    }

    if (!upgrade.effect.trim()) {
      errors.push(`Upgrade ${upgrade.id} must describe its effect`);
    }

    validatePositiveInteger(errors, `Upgrade ${upgrade.id}`, 'cost', upgrade.cost);
  }

  for (const upgrade of upgrades) {
    for (const prerequisiteId of upgrade.prerequisites) {
      if (prerequisiteId === upgrade.id) {
        errors.push(`Upgrade ${upgrade.id} cannot require itself`);
      }

      if (!upgradeIds.has(prerequisiteId)) {
        errors.push(`Upgrade ${upgrade.id} references missing prerequisite: ${prerequisiteId}`);
      }
    }
  }

  for (const achievement of achievements) {
    if (achievementIds.has(achievement.id)) {
      errors.push(`Duplicate achievement id: ${achievement.id}`);
    }

    achievementIds.add(achievement.id);

    if (achievement.unlockIds.length === 0) {
      errors.push(`Achievement ${achievement.id} must grant at least one unlock`);
    }

    for (const unlockId of achievement.unlockIds) {
      if (!unlockIds.has(unlockId)) {
        errors.push(`Achievement ${achievement.id} references missing unlock: ${unlockId}`);
      }
    }
  }

  const seenEnemyClassIds = new Set<string>();

  for (const faction of factions) {
    if (factionIds.has(faction.id)) {
      errors.push(`Duplicate faction id: ${faction.id}`);
    }

    factionIds.add(faction.id);

    if (!factionPatterns.has(faction.enemyPattern)) {
      errors.push(`Faction ${faction.id} has invalid enemy pattern: ${faction.enemyPattern}`);
    }

    if (!factionShapes.has(faction.visualShape)) {
      errors.push(`Faction ${faction.id} has invalid visual shape: ${faction.visualShape}`);
    }

    if (!faction.summary.trim()) {
      errors.push(`Faction ${faction.id} must have behavior notes`);
    }

    validateEnemyRoleMetadata(errors, faction, seenEnemyClassIds, {
      classIds: enemyClassIds,
      roles: enemyRoles,
      pressureTypes: enemyPressureTypes,
      movementFamilies: enemyMovementFamilies,
      attackFamilies: enemyAttackFamilies,
      variantEligibilities: enemyVariantEligibilities,
      formationEligibilities: enemyFormationEligibilities,
      readabilityTiers: enemyReadabilityTiers,
      factionFits: enemyFactionFits,
      objectivePolicies: enemyObjectivePolicies
    });
  }

  validateEnemyVariantDefinitions(errors, enemyVariants, factions, {
    variantIds: enemyVariantIds,
    variantEligibilities: enemyVariantEligibilities,
    roles: enemyRoles,
    factions: factionIds,
    encounterTypes: enemyVariantEncounterTypes
  });
  validateEnemyFormationDefinitions(errors, enemyFormations, factions, {
    formationIds: enemyFormationIds,
    formationShapes: enemyFormationShapes,
    roles: enemyRoles,
    entryStyles: enemyFormationEntryStyles,
    breakConditions: enemyFormationBreakConditions,
    cleanupPolicies: enemyFormationCleanupPolicies,
    encounterTypes: enemyVariantEncounterTypes
  });
  validateEnvironmentObjectDefinitions(errors, environmentObjects, {
    ids: environmentObjectIds,
    kinds: environmentObjectKinds,
    families: environmentObjectFamilies,
    sectors: canonicalSectorIds,
    factions: factionIds,
    collisionShapes: environmentObjectCollisionShapes,
    damageSources: environmentObjectDamageSources,
    objectivePolicies: environmentObjectObjectivePolicies,
    rewardPolicies: environmentObjectRewardPolicies,
    chainBehaviors: environmentObjectChainBehaviors,
    renderCues: environmentObjectRenderCues,
    renderLayers: environmentObjectRenderLayers,
    accessibilityVariants: environmentObjectAccessibilityVariants
  });
  validateHazardZoneDefinitions(errors, hazardZones, {
    ids: hazardZoneIds,
    families: hazardZoneFamilies,
    sectors: canonicalSectorIds,
    factions: factionIds,
    telegraphShapes: hazardZoneTelegraphShapes,
    damageShapes: hazardZoneDamageShapes,
    safeLanePolicies: hazardZoneSafeLanePolicies,
    renderLayers: hazardZoneRenderLayers,
    collisionShapes: hazardZoneCollisionShapes,
    settingsVariants: hazardZoneSettingsVariants,
    bossArenaPolicies: hazardZoneBossArenaPolicies,
    scheduleSources: hazardZoneScheduleSources,
    behaviorKinds: hazardZoneBehaviorKinds
  });

  for (const boss of bosses) {
    if (bossIds.has(boss.id)) {
      errors.push(`Duplicate boss id: ${boss.id}`);
    }

    bossIds.add(boss.id);

    if (!factionIds.has(boss.factionId)) {
      errors.push(`Boss ${boss.id} references missing faction: ${boss.factionId}`);
    }

    if (!Number.isFinite(boss.maxHull) || boss.maxHull <= 0) {
      errors.push(`Boss ${boss.id} must have positive maxHull`);
    }

    if (!bossPatterns.has(boss.patternId)) {
      errors.push(`Boss ${boss.id} has invalid pattern: ${boss.patternId}`);
    }

    const bossPhases = Array.isArray(boss.phases) ? boss.phases : [];

    if (bossPhases.length < 2) {
      errors.push(`Boss ${boss.id} must define at least two phases`);
    }

    if (bossPhases[0]?.startsAtHullRatio !== 1) {
      errors.push(`Boss ${boss.id} first phase must start at hull ratio 1`);
    }

    let previousPhaseRatio = 1.01;

    for (const phase of bossPhases) {
      if (!phase.label.trim()) {
        errors.push(`Boss ${boss.id} phase must have a label`);
      }

      if (
        !Number.isFinite(phase.startsAtHullRatio) ||
        phase.startsAtHullRatio <= 0 ||
        phase.startsAtHullRatio > 1
      ) {
        errors.push(`Boss ${boss.id} phase ${phase.label} must start between hull ratios 0 and 1`);
      }

      if (phase.startsAtHullRatio >= previousPhaseRatio) {
        errors.push(`Boss ${boss.id} phase ${phase.label} thresholds must descend`);
      }

      previousPhaseRatio = phase.startsAtHullRatio;

      validatePositiveNumber(
        errors,
        `Boss ${boss.id} phase ${phase.label}`,
        'attackCadenceMultiplier',
        phase.attackCadenceMultiplier
      );
      validatePositiveNumber(
        errors,
        `Boss ${boss.id} phase ${phase.label}`,
        'telegraphMultiplier',
        phase.telegraphMultiplier
      );
      validatePositiveNumber(
        errors,
        `Boss ${boss.id} phase ${phase.label}`,
        'projectileBudgetMultiplier',
        phase.projectileBudgetMultiplier
      );

      if (phase.telegraphMultiplier < 0.85) {
        errors.push(`Boss ${boss.id} phase ${phase.label} must keep readable telegraph timing`);
      }

      if (!phase.warningLabel.trim()) {
        errors.push(`Boss ${boss.id} phase ${phase.label} must have a warning label`);
      }

      if (phase.patternSequence.length === 0) {
        errors.push(`Boss ${boss.id} phase ${phase.label} must define a pattern sequence`);
      }

      for (const patternId of phase.patternSequence) {
        if (!bossPatterns.has(patternId)) {
          errors.push(
            `Boss ${boss.id} phase ${phase.label} references invalid pattern: ${patternId}`
          );
        }
      }
    }
  }

  for (const item of items) {
    if (itemIds.has(item.id)) {
      errors.push(`Duplicate item id: ${item.id}`);
    }

    itemIds.add(item.id);

    if (!itemRarities.has(item.rarity)) {
      errors.push(`Item ${item.id} has invalid rarity: ${item.rarity}`);
    }

    if (item.tags.length === 0) {
      errors.push(`Item ${item.id} must have at least one tag`);
    }

    for (const tag of item.tags) {
      if (!tagRegistry.has(tag)) {
        errors.push(`Item ${item.id} has invalid tag: ${tag}`);
      }
    }

    for (const hook of item.hooks) {
      if (!hookRegistry.has(hook)) {
        errors.push(`Item ${item.id} has invalid hook: ${hook}`);
        continue;
      }

      if (!itemHookImplementations[hook].has(item.id)) {
        errors.push(`Item ${item.id} declares ${hook} without an implementation`);
      }
    }

    if (!item.effect.trim()) {
      errors.push(`Item ${item.id} must have effect text`);
    }

    if (!Number.isFinite(item.weight) || item.weight <= 0) {
      errors.push(`Item ${item.id} must have a positive weight`);
    }

    validateItemMetadata(errors, item, itemUnlocks, {
      families: itemFamilies,
      sources: itemSources,
      unlockTiers: itemUnlockTiers,
      implementationStatuses: itemImplementationStatuses,
      stackingModes: itemStackingModes,
      uiTags: itemUiTags
    });
  }

  for (const weapon of weapons) {
    if (weaponIds.has(weapon.id)) {
      errors.push(`Duplicate weapon id: ${weapon.id}`);
    }

    weaponIds.add(weapon.id);

    if (!weaponPatterns.has(weapon.pattern)) {
      errors.push(`Weapon ${weapon.id} has invalid pattern: ${weapon.pattern}`);
    }

    for (const tag of weapon.tags) {
      if (!tagRegistry.has(tag)) {
        errors.push(`Weapon ${weapon.id} has invalid tag: ${tag}`);
      }
    }

    validatePositiveNumber(errors, `Weapon ${weapon.id}`, 'damage', weapon.damage);
    validatePositiveNumber(
      errors,
      `Weapon ${weapon.id}`,
      'projectileSpeed',
      weapon.projectileSpeed
    );
    validatePositiveNumber(
      errors,
      `Weapon ${weapon.id}`,
      'projectileRadius',
      weapon.projectileRadius
    );
    validatePositiveNumber(
      errors,
      `Weapon ${weapon.id}`,
      'fireCooldownSeconds',
      weapon.fireCooldownSeconds
    );
    validateNonNegativeNumber(errors, `Weapon ${weapon.id}`, 'heatPerShot', weapon.heatPerShot);
    validatePositiveNumber(
      errors,
      `Weapon ${weapon.id}`,
      'heatVentPerSecond',
      weapon.heatVentPerSecond
    );
    validatePositiveNumber(errors, `Weapon ${weapon.id}`, 'overheatLimit', weapon.overheatLimit);
    validatePositiveNumber(
      errors,
      `Weapon ${weapon.id}`,
      'overheatCooldownSeconds',
      weapon.overheatCooldownSeconds
    );
  }

  for (const ship of ships) {
    if (shipIds.has(ship.id)) {
      errors.push(`Duplicate ship id: ${ship.id}`);
    }

    shipIds.add(ship.id);

    if (!weaponIds.has(ship.weapon)) {
      errors.push(`Ship ${ship.id} references missing weapon: ${ship.weapon}`);
    }

    if (!ship.appearance) {
      errors.push(`Ship ${ship.id} must define appearance`);
    } else {
      if (!shipSilhouettes.has(ship.appearance.silhouette)) {
        errors.push(
          `Ship ${ship.id} has invalid silhouette: ${String(ship.appearance.silhouette)}`
        );
      }

      if (!shipHudThemeKeys.has(ship.appearance.hudThemeKey)) {
        errors.push(
          `Ship ${ship.id} has invalid HUD theme: ${String(ship.appearance.hudThemeKey)}`
        );
      }

      const weaponMounts = Array.isArray(ship.appearance.weaponMounts)
        ? ship.appearance.weaponMounts
        : [];

      if (weaponMounts.length === 0) {
        errors.push(`Ship ${ship.id} appearance must define at least one weapon mount`);
      }

      for (const mount of weaponMounts) {
        if (!shipMountHints.has(String(mount))) {
          errors.push(`Ship ${ship.id} has invalid weapon mount: ${String(mount)}`);
        }
      }

      validateHexColor(
        errors,
        `Ship ${ship.id} appearance`,
        'primaryColor',
        ship.appearance.primaryColor
      );
      validateHexColor(
        errors,
        `Ship ${ship.id} appearance`,
        'secondaryColor',
        ship.appearance.secondaryColor
      );
      validateHexColor(
        errors,
        `Ship ${ship.id} appearance`,
        'trimColor',
        ship.appearance.trimColor
      );
      validateHexColor(
        errors,
        `Ship ${ship.id} appearance`,
        'engineColor',
        ship.appearance.engineColor
      );
      validateHexColor(
        errors,
        `Ship ${ship.id} appearance`,
        'cockpitAccent',
        ship.appearance.cockpitAccent
      );
    }

    validatePositiveInteger(errors, `Ship ${ship.id} stats`, 'maxHull', ship.stats.maxHull);
    validatePositiveNumber(errors, `Ship ${ship.id} stats`, 'speed', ship.stats.speed);
    validatePositiveNumber(errors, `Ship ${ship.id} stats`, 'hitRadius', ship.stats.hitRadius);
    validatePositiveNumber(
      errors,
      `Ship ${ship.id} stats`,
      'pickupPullRange',
      ship.stats.pickupPullRange
    );
    validatePositiveNumber(
      errors,
      `Ship ${ship.id} stats`,
      'specialChargeMultiplier',
      ship.stats.specialChargeMultiplier
    );
    validateUnitNumber(
      errors,
      `Ship ${ship.id} stats`,
      'specialInitialCharge',
      ship.stats.specialInitialCharge
    );
    validateNonNegativeInteger(
      errors,
      `Ship ${ship.id} stats`,
      'bombCapacity',
      ship.stats.bombCapacity
    );
    validateNonNegativeInteger(
      errors,
      `Ship ${ship.id} stats`,
      'startingCredits',
      ship.stats.startingCredits
    );
    validateNonNegativeInteger(
      errors,
      `Ship ${ship.id} stats`,
      'startingSalvage',
      ship.stats.startingSalvage
    );
  }

  const rewardedItemIds = new Set<string>();
  const rewardPoolIds = new Set<string>();

  for (const pool of rewardPools) {
    if (rewardPoolIds.has(pool.id)) {
      errors.push(`Duplicate reward pool id: ${pool.id}`);
    }

    rewardPoolIds.add(pool.id);

    if (pool.itemIds.length === 0) {
      errors.push(`Reward pool ${pool.id} must not be empty`);
    }

    for (const itemId of pool.itemIds) {
      rewardedItemIds.add(itemId);

      if (!itemIds.has(itemId)) {
        errors.push(`Reward pool ${pool.id} references missing item: ${itemId}`);
        continue;
      }

      const item = items.find((candidate) => candidate.id === itemId);

      if (item && !item.metadata.sources.includes(pool.id)) {
        errors.push(`Item ${item.id} appears in ${pool.id} pool without ${pool.id} source`);
      }
    }
  }

  for (const item of items) {
    if (!rewardedItemIds.has(item.id)) {
      errors.push(`Item ${item.id} must appear in at least one reward pool`);
    }
  }

  validateItemPoolWeightProfiles(errors, itemPoolWeightProfiles, items, rewardPools, {
    profileIds: itemPoolProfileIds,
    rewardPoolIds,
    sources: itemSources,
    rarities: itemRarities,
    families: itemFamilies,
    tags: tagRegistry
  });

  for (const [itemId, unlockId] of Object.entries(itemUnlocks) as [ItemId, UnlockId][]) {
    if (!itemIds.has(itemId)) {
      errors.push(`Item unlock gate references missing item: ${itemId}`);
    }

    if (!unlockIds.has(unlockId)) {
      errors.push(`Item ${itemId} references missing unlock gate: ${unlockId}`);
    }
  }

  validateItemFamilyGates(errors, itemFamilyGates, items, {
    families: itemFamilies,
    unlockTiers: itemUnlockTiers,
    unlockIds
  });

  const representedArchetypeCount = ITEM_ARCHETYPES.filter((archetype) =>
    items.some(
      (item) =>
        rewardedItemIds.has(item.id) && item.tags.some((tag) => archetype.tags.includes(tag))
    )
  ).length;

  if (representedArchetypeCount < 6) {
    errors.push('Content must represent at least 6 build archetypes in reward pools');
  }

  for (const sector of sectors) {
    if (!backgroundIds.has(sector.backgroundId)) {
      errors.push(`Sector ${sector.id} references missing background: ${sector.backgroundId}`);
    }

    if (sector.bossCandidates.length === 0) {
      errors.push(`Sector ${sector.id} must have at least one boss candidate`);
    }

    for (const bossId of sector.bossCandidates) {
      if (!bossIds.has(bossId)) {
        errors.push(`Sector ${sector.id} references missing boss: ${bossId}`);
      }
    }

    if (sector.objective.kind !== 'clearWaves' && sector.objective.kind !== 'defeatBoss') {
      errors.push(`Sector ${sector.id} has invalid objective kind: ${sector.objective.kind}`);
    }

    if (!Number.isInteger(sector.objective.waveCount) || sector.objective.waveCount <= 0) {
      errors.push(`Sector ${sector.id} objective must have a positive waveCount`);
    }

    if (!Number.isInteger(sector.objective.spawnsPerWave) || sector.objective.spawnsPerWave <= 0) {
      errors.push(`Sector ${sector.id} objective must have a positive spawnsPerWave`);
    }

    if (sector.objective.kind === 'defeatBoss' && !sector.objective.bossGate) {
      errors.push(`Sector ${sector.id} defeatBoss objective must enable bossGate`);
    }

    if (sector.encounterPacing) {
      validateEncounterPacing(errors, sector);
    }
  }

  return errors;
}

export function assertValidContent(input: ContentValidationInput = {}): void {
  const errors = validateContent(input);

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
}

function validateActDefinitions(
  errors: string[],
  acts: readonly ActDefinition[],
  registries: {
    readonly routeKinds: ReadonlySet<string>;
    readonly rewardTiers: ReadonlySet<string>;
    readonly pressureTiers: ReadonlySet<string>;
    readonly bossGateKinds: ReadonlySet<string>;
    readonly transitionKinds: ReadonlySet<string>;
    readonly sectors: ReadonlySet<string>;
  }
): void {
  const actIds = new Set<string>();
  const actOrders = new Set<number>();
  const hasVictoryTransition = acts.some((act) => act.transition.kind === 'victory');

  if (acts.length < 2) {
    errors.push('Content must define at least two acts');
  }

  if (!hasVictoryTransition) {
    errors.push('At least one act must transition to victory');
  }

  for (const act of acts) {
    const owner = `Act ${act.id}`;

    if (actIds.has(act.id)) {
      errors.push(`Duplicate act id: ${act.id}`);
    }

    actIds.add(act.id);

    if (actOrders.has(act.order)) {
      errors.push(`Duplicate act order: ${act.order}`);
    }

    actOrders.add(act.order);
    validatePositiveInteger(errors, owner, 'order', act.order);

    if (!act.label.trim()) {
      errors.push(`${owner} must have a label`);
    }

    if (!act.shortLabel.trim()) {
      errors.push(`${owner} must have a short label`);
    }

    if (!act.summary.trim()) {
      errors.push(`${owner} must have a summary`);
    }

    validatePositiveInteger(errors, `${owner} sector budget`, 'plannedSectors', act.sectorBudget.plannedSectors);
    validatePositiveInteger(errors, `${owner} sector budget`, 'minSectors', act.sectorBudget.minSectors);
    validatePositiveInteger(errors, `${owner} sector budget`, 'maxSectors', act.sectorBudget.maxSectors);

    if (act.sectorBudget.minSectors > act.sectorBudget.maxSectors) {
      errors.push(`${owner} sector budget must order min/max sectors`);
    }

    if (
      act.sectorBudget.plannedSectors < act.sectorBudget.minSectors ||
      act.sectorBudget.plannedSectors > act.sectorBudget.maxSectors
    ) {
      errors.push(`${owner} sector budget plannedSectors must sit between min and max`);
    }

    validateStringList(
      errors,
      owner,
      'preferred sector',
      act.preferredSectorIds,
      registries.sectors
    );

    validateStringList(
      errors,
      `${owner} route grammar`,
      'allowed route',
      act.routeGrammar.allowedKinds,
      registries.routeKinds
    );

    for (const guaranteedKind of act.routeGrammar.guaranteedKinds) {
      if (!registries.routeKinds.has(guaranteedKind)) {
        errors.push(`${owner} route grammar has invalid guaranteed route: ${guaranteedKind}`);
      }
    }

    for (const duplicateGuaranteedKind of getDuplicateStrings(act.routeGrammar.guaranteedKinds)) {
      errors.push(
        `${owner} route grammar has duplicate guaranteed route: ${duplicateGuaranteedKind}`
      );
    }

    if (act.routeGrammar.allowedKinds.length === 0) {
      errors.push(`${owner} route grammar must allow at least one route`);
    }

    for (const guaranteedRoute of act.routeGrammar.guaranteedKinds) {
      if (!act.routeGrammar.allowedKinds.includes(guaranteedRoute)) {
        errors.push(
          `${owner} route grammar guaranteed route must also be allowed: ${guaranteedRoute}`
        );
      }
    }

    if (!act.routeGrammar.summary.trim()) {
      errors.push(`${owner} route grammar must have a summary`);
    }

    if (!registries.rewardTiers.has(act.rewardTier)) {
      errors.push(`${owner} has invalid reward tier: ${act.rewardTier}`);
    }

    if (!registries.pressureTiers.has(act.pressureTier)) {
      errors.push(`${owner} has invalid pressure tier: ${act.pressureTier}`);
    }

    if (!registries.bossGateKinds.has(act.bossGate.kind)) {
      errors.push(`${owner} has invalid boss gate kind: ${act.bossGate.kind}`);
    }

    if (!act.bossGate.label.trim()) {
      errors.push(`${owner} boss gate must have a label`);
    }

    if (!registries.transitionKinds.has(act.transition.kind)) {
      errors.push(`${owner} has invalid transition kind: ${act.transition.kind}`);
    }

    if (!act.transition.label.trim()) {
      errors.push(`${owner} transition must have a label`);
    }

    if (act.transition.kind === 'interActJunction') {
      if (!act.transition.nextActId) {
        errors.push(`${owner} inter-act transition must name nextActId`);
      } else if (act.transition.nextActId === act.id) {
        errors.push(`${owner} transition cannot target itself`);
      } else if (
        !actIds.has(act.transition.nextActId) &&
        !acts.some((candidate) => candidate.id === act.transition.nextActId)
      ) {
        errors.push(
          `${owner} transition references missing next act: ${act.transition.nextActId}`
        );
      }
    }
  }
}

function validateActRouteContracts(
  errors: string[],
  contracts: readonly ActRouteContractDefinition[],
  registries: {
    readonly acts: ReadonlySet<string>;
    readonly routeKinds: ReadonlySet<string>;
    readonly sectors: ReadonlySet<string>;
    readonly factions: ReadonlySet<string>;
    readonly backgrounds: ReadonlySet<string>;
    readonly objectiveKinds: ReadonlySet<string>;
    readonly routeTags: ReadonlySet<string>;
    readonly unlocks: ReadonlySet<string>;
  }
): void {
  const contractIds = new Set<string>();
  const coreRouteKinds = new Set<string>();

  if (contracts.length < ACT_ROUTE_KINDS.length) {
    errors.push('Content must define at least one act route contract per route kind');
  }

  for (const contract of contracts) {
    const owner = `Act route contract ${contract.id}`;

    if (contractIds.has(contract.id)) {
      errors.push(`Duplicate act route contract id: ${contract.id}`);
    }

    contractIds.add(contract.id);

    if (!registries.acts.has(contract.actId)) {
      errors.push(`${owner} references missing act: ${contract.actId}`);
    }

    if (!registries.routeKinds.has(contract.kind)) {
      errors.push(`${owner} has invalid route kind: ${contract.kind}`);
    }

    if (contract.actId === 'act_core_descent') {
      coreRouteKinds.add(contract.kind);
    }

    if (!contract.label.trim()) {
      errors.push(`${owner} must have a label`);
    }

    if (!contract.routeCardCopy.trim()) {
      errors.push(`${owner} must have route card copy`);
    }

    if (!contract.environmentalPressureHint.trim()) {
      errors.push(`${owner} must have an environmental pressure hint`);
    }

    if (!contract.rewardTierHint.trim()) {
      errors.push(`${owner} must have a reward tier hint`);
    }

    if (!contract.pressureHint.trim()) {
      errors.push(`${owner} must have a pressure hint`);
    }

    validateStringList(errors, owner, 'route tag', contract.tags, registries.routeTags);
    validateStringList(
      errors,
      `${owner} sector fit`,
      'allowed sector',
      contract.sectorFit.allowedSectorIds,
      registries.sectors
    );
    validateStringList(
      errors,
      `${owner} sector fit`,
      'preferred sector',
      contract.sectorFit.preferredSectorIds,
      registries.sectors
    );
    validateStringList(errors, owner, 'faction fit', contract.factionFit, registries.factions);
    validateStringList(
      errors,
      owner,
      'background hook',
      contract.backgroundHooks,
      registries.backgrounds
    );
    validateStringList(
      errors,
      owner,
      'objective family',
      contract.objectiveFamilies,
      registries.objectiveKinds
    );

    for (const preferredSectorId of contract.sectorFit.preferredSectorIds) {
      if (!contract.sectorFit.allowedSectorIds.includes(preferredSectorId)) {
        errors.push(`${owner} preferred sector must also be allowed: ${preferredSectorId}`);
      }
    }

    for (const unlockId of contract.requiredUnlockIds) {
      if (!registries.unlocks.has(unlockId)) {
        errors.push(`${owner} references missing unlock: ${unlockId}`);
      }
    }

    for (const duplicateUnlockId of getDuplicateStrings(contract.requiredUnlockIds)) {
      errors.push(`${owner} has duplicate required unlock: ${duplicateUnlockId}`);
    }

    validatePositiveInteger(errors, owner, 'weight', contract.weight);

    if (!Number.isFinite(contract.riskOffset)) {
      errors.push(`${owner} must have a finite riskOffset`);
    }

    if (contract.riskOffset < -2 || contract.riskOffset > 3) {
      errors.push(`${owner} riskOffset must stay between -2 and 3`);
    }
  }

  for (const routeKind of ACT_ROUTE_KINDS) {
    if (!coreRouteKinds.has(routeKind)) {
      errors.push(`Act II route contracts must include route kind: ${routeKind}`);
    }
  }
}

function createItemHookImplementationRegistry(
  overrides: ItemHookImplementationRegistry | undefined
): Readonly<Record<ItemHook, ReadonlySet<ItemId>>> {
  return {
    onFire: new Set(overrides?.onFire ?? ITEM_HOOK_IMPLEMENTATIONS.onFire),
    onProjectileSpawn: new Set(
      overrides?.onProjectileSpawn ?? ITEM_HOOK_IMPLEMENTATIONS.onProjectileSpawn
    ),
    onEnemyKilled: new Set(overrides?.onEnemyKilled ?? ITEM_HOOK_IMPLEMENTATIONS.onEnemyKilled),
    onPlayerHit: new Set(overrides?.onPlayerHit ?? ITEM_HOOK_IMPLEMENTATIONS.onPlayerHit),
    onPickupCollected: new Set(
      overrides?.onPickupCollected ?? ITEM_HOOK_IMPLEMENTATIONS.onPickupCollected
    ),
    onGraze: new Set(overrides?.onGraze ?? ITEM_HOOK_IMPLEMENTATIONS.onGraze),
    onSpecialUsed: new Set(overrides?.onSpecialUsed ?? ITEM_HOOK_IMPLEMENTATIONS.onSpecialUsed),
    onBombUsed: new Set(overrides?.onBombUsed ?? ITEM_HOOK_IMPLEMENTATIONS.onBombUsed),
    onSectorStart: new Set(overrides?.onSectorStart ?? ITEM_HOOK_IMPLEMENTATIONS.onSectorStart),
    onRouteChosen: new Set(overrides?.onRouteChosen ?? ITEM_HOOK_IMPLEMENTATIONS.onRouteChosen),
    onShopEntered: new Set(overrides?.onShopEntered ?? ITEM_HOOK_IMPLEMENTATIONS.onShopEntered),
    onRewardGenerated: new Set(
      overrides?.onRewardGenerated ?? ITEM_HOOK_IMPLEMENTATIONS.onRewardGenerated
    ),
    onEnvironmentObjectDestroyed: new Set(
      overrides?.onEnvironmentObjectDestroyed ??
        ITEM_HOOK_IMPLEMENTATIONS.onEnvironmentObjectDestroyed
    ),
    onBossPhaseChanged: new Set(
      overrides?.onBossPhaseChanged ?? ITEM_HOOK_IMPLEMENTATIONS.onBossPhaseChanged
    )
  };
}

interface ItemMetadataRegistries {
  readonly families: ReadonlySet<string>;
  readonly sources: ReadonlySet<string>;
  readonly unlockTiers: ReadonlySet<string>;
  readonly implementationStatuses: ReadonlySet<string>;
  readonly stackingModes: ReadonlySet<string>;
  readonly uiTags: ReadonlySet<string>;
}

interface ItemPoolProfileRegistries {
  readonly profileIds: ReadonlySet<string>;
  readonly rewardPoolIds: ReadonlySet<string>;
  readonly sources: ReadonlySet<string>;
  readonly rarities: ReadonlySet<string>;
  readonly families: ReadonlySet<string>;
  readonly tags: ReadonlySet<string>;
}

interface ItemFamilyGateRegistries {
  readonly families: ReadonlySet<string>;
  readonly unlockTiers: ReadonlySet<string>;
  readonly unlockIds: ReadonlySet<string>;
}

interface EnemyRoleMetadataRegistries {
  readonly classIds: ReadonlySet<string>;
  readonly roles: ReadonlySet<string>;
  readonly pressureTypes: ReadonlySet<string>;
  readonly movementFamilies: ReadonlySet<string>;
  readonly attackFamilies: ReadonlySet<string>;
  readonly variantEligibilities: ReadonlySet<string>;
  readonly formationEligibilities: ReadonlySet<string>;
  readonly readabilityTiers: ReadonlySet<string>;
  readonly factionFits: ReadonlySet<string>;
  readonly objectivePolicies: ReadonlySet<string>;
}

interface EnemyVariantDefinitionRegistries {
  readonly variantIds: ReadonlySet<string>;
  readonly variantEligibilities: ReadonlySet<string>;
  readonly roles: ReadonlySet<string>;
  readonly factions: ReadonlySet<string>;
  readonly encounterTypes: ReadonlySet<string>;
}

interface EnemyFormationDefinitionRegistries {
  readonly formationIds: ReadonlySet<string>;
  readonly formationShapes: ReadonlySet<string>;
  readonly roles: ReadonlySet<string>;
  readonly entryStyles: ReadonlySet<string>;
  readonly breakConditions: ReadonlySet<string>;
  readonly cleanupPolicies: ReadonlySet<string>;
  readonly encounterTypes: ReadonlySet<string>;
}

interface EnvironmentObjectDefinitionRegistries {
  readonly ids: ReadonlySet<string>;
  readonly kinds: ReadonlySet<string>;
  readonly families: ReadonlySet<string>;
  readonly sectors: ReadonlySet<string>;
  readonly factions: ReadonlySet<string>;
  readonly collisionShapes: ReadonlySet<string>;
  readonly damageSources: ReadonlySet<string>;
  readonly objectivePolicies: ReadonlySet<string>;
  readonly rewardPolicies: ReadonlySet<string>;
  readonly chainBehaviors: ReadonlySet<string>;
  readonly renderCues: ReadonlySet<string>;
  readonly renderLayers: ReadonlySet<string>;
  readonly accessibilityVariants: ReadonlySet<string>;
}

interface HazardZoneDefinitionRegistries {
  readonly ids: ReadonlySet<string>;
  readonly families: ReadonlySet<string>;
  readonly sectors: ReadonlySet<string>;
  readonly factions: ReadonlySet<string>;
  readonly telegraphShapes: ReadonlySet<string>;
  readonly damageShapes: ReadonlySet<string>;
  readonly safeLanePolicies: ReadonlySet<string>;
  readonly renderLayers: ReadonlySet<string>;
  readonly collisionShapes: ReadonlySet<string>;
  readonly settingsVariants: ReadonlySet<string>;
  readonly bossArenaPolicies: ReadonlySet<string>;
  readonly scheduleSources: ReadonlySet<string>;
  readonly behaviorKinds: ReadonlySet<string>;
}

function validateEnvironmentObjectDefinitions(
  errors: string[],
  environmentObjects: readonly EnvironmentObjectDefinition[],
  registries: EnvironmentObjectDefinitionRegistries
): void {
  const seenObjectIds = new Set<string>();
  const innerArenaWidth = COMBAT_ARENA_WIDTH - COMBAT_ARENA_PADDING * 2;

  for (const object of environmentObjects) {
    const owner = `Environment object ${String(object.id)}`;

    if (seenObjectIds.has(object.id)) {
      errors.push(`Duplicate environment object id: ${String(object.id)}`);
    }

    seenObjectIds.add(object.id);

    if (!registries.ids.has(object.id)) {
      errors.push(`${owner} has invalid id`);
    }

    if (!registries.kinds.has(object.kind)) {
      errors.push(`${owner} has invalid kind: ${String(object.kind)}`);
    }

    if (!registries.families.has(object.family)) {
      errors.push(`${owner} has invalid family: ${String(object.family)}`);
    }

    if (!object.name.trim()) {
      errors.push(`${owner} must have a name`);
    }

    if (!object.debugLabel.trim()) {
      errors.push(`${owner} must have a debug label`);
    }

    if (!object.summary.trim()) {
      errors.push(`${owner} must have a summary`);
    }

    validateStringList(errors, owner, 'sector fit', object.sectorFit, registries.sectors);

    if (object.factionFit !== 'any') {
      validateStringList(errors, owner, 'faction fit', object.factionFit, registries.factions);
    }

    if (!registries.collisionShapes.has(object.collision.shape)) {
      errors.push(`${owner} has invalid collision shape: ${String(object.collision.shape)}`);
    }

    validatePositiveNumber(errors, `${owner} collision`, 'width', object.collision.width);
    validatePositiveNumber(errors, `${owner} collision`, 'height', object.collision.height);
    validateNonNegativeNumber(errors, `${owner} collision`, 'radius', object.collision.radius);

    const footprintWidth =
      object.collision.shape === 'circle' ? object.collision.radius * 2 : object.collision.width;
    const footprintHeight =
      object.collision.shape === 'circle' ? object.collision.radius * 2 : object.collision.height;

    if (object.collision.shape === 'circle' && object.collision.radius <= 0) {
      errors.push(`${owner} collision circle must have positive radius`);
    }

    if (object.collision.shape !== 'circle' && object.collision.radius !== 0) {
      errors.push(`${owner} collision non-circle must use radius 0`);
    }

    if (footprintWidth > 180 || footprintHeight > 140) {
      errors.push(`${owner} collision footprint is too large for readable lanes`);
    }

    validatePositiveNumber(errors, `${owner} durability`, 'hull', object.durability.hull);
    validateNonNegativeNumber(errors, `${owner} durability`, 'armor', object.durability.armor);

    if (object.durability.hull > 12) {
      errors.push(`${owner} durability must keep hull at or below 12`);
    }

    validateNonNegativeNumber(
      errors,
      `${owner} damage interaction`,
      'contactDamage',
      object.damageInteraction.contactDamage
    );

    if (object.damageInteraction.contactDamage > 1) {
      errors.push(`${owner} damage interaction must keep contactDamage at or below 1`);
    }

    if (object.damageInteraction.destructible) {
      validateStringList(
        errors,
        owner,
        'damage source',
        object.damageInteraction.allowedSources,
        registries.damageSources
      );
    } else if (object.damageInteraction.allowedSources.length > 0) {
      errors.push(`${owner} non-destructible objects cannot list damage sources`);
    }

    if (!registries.objectivePolicies.has(object.objectivePolicy)) {
      errors.push(`${owner} has invalid objective policy: ${String(object.objectivePolicy)}`);
    }

    if (!registries.rewardPolicies.has(object.reward.policy)) {
      errors.push(`${owner} has invalid reward policy: ${String(object.reward.policy)}`);
    }

    validateNonNegativeInteger(errors, `${owner} reward`, 'minValue', object.reward.minValue);
    validateNonNegativeInteger(errors, `${owner} reward`, 'maxValue', object.reward.maxValue);
    validateUnitNumber(errors, `${owner} reward`, 'dropChance', object.reward.dropChance);

    if (object.reward.policy === 'none') {
      if (
        object.reward.minValue !== 0 ||
        object.reward.maxValue !== 0 ||
        object.reward.dropChance !== 0
      ) {
        errors.push(`${owner} reward none must not define value or chance`);
      }
    } else {
      if (object.reward.maxValue < object.reward.minValue || object.reward.maxValue <= 0) {
        errors.push(`${owner} reward must order positive value range`);
      }

      if (object.reward.dropChance <= 0) {
        errors.push(`${owner} reward must have positive dropChance`);
      }
    }

    if (!registries.chainBehaviors.has(object.chain.behavior)) {
      errors.push(`${owner} has invalid chain behavior: ${String(object.chain.behavior)}`);
    }

    validateNonNegativeNumber(errors, `${owner} chain`, 'radius', object.chain.radius);
    validateNonNegativeNumber(errors, `${owner} chain`, 'damage', object.chain.damage);
    validateNonNegativeInteger(errors, `${owner} chain`, 'maxTargets', object.chain.maxTargets);

    if (object.chain.behavior === 'none') {
      if (object.chain.radius !== 0 || object.chain.damage !== 0 || object.chain.maxTargets !== 0) {
        errors.push(`${owner} chain none must not define radius, damage, or targets`);
      }
    } else {
      if (object.chain.radius <= 0 || object.chain.damage <= 0 || object.chain.maxTargets <= 0) {
        errors.push(`${owner} chain behavior must define positive radius, damage, and targets`);
      }

      if (object.chain.maxTargets > 6) {
        errors.push(`${owner} chain behavior must keep maxTargets at or below 6`);
      }
    }

    validatePositiveNumber(errors, `${owner} placement`, 'weight', object.placement.weight);
    validatePositiveInteger(
      errors,
      `${owner} placement`,
      'maxPerSector',
      object.placement.maxPerSector
    );
    validateUnitNumber(
      errors,
      `${owner} placement`,
      'minDistanceRatio',
      object.placement.minDistanceRatio
    );
    validateUnitNumber(
      errors,
      `${owner} placement`,
      'maxDistanceRatio',
      object.placement.maxDistanceRatio
    );
    validatePositiveNumber(errors, `${owner} placement`, 'minSpacing', object.placement.minSpacing);
    validatePositiveNumber(
      errors,
      `${owner} placement`,
      'safeLaneWidth',
      object.placement.safeLaneWidth
    );
    validatePositiveNumber(
      errors,
      `${owner} placement`,
      'avoidPlayerSpawnDistance',
      object.placement.avoidPlayerSpawnDistance
    );
    validatePositiveNumber(
      errors,
      `${owner} placement`,
      'avoidBossLockDistance',
      object.placement.avoidBossLockDistance
    );

    if (object.placement.minDistanceRatio >= object.placement.maxDistanceRatio) {
      errors.push(`${owner} placement must order distance ratios`);
    }

    if (object.placement.safeLaneWidth < 180) {
      errors.push(`${owner} placement must keep safeLaneWidth at or above 180`);
    }

    if (object.placement.safeLaneWidth + footprintWidth > innerArenaWidth) {
      errors.push(`${owner} placement safe lane is impossible with collision footprint`);
    }

    if (object.placement.xBands.length === 0) {
      errors.push(`${owner} placement must list at least one x band`);
    }

    for (const [index, band] of object.placement.xBands.entries()) {
      const bandOwner = `${owner} placement x band ${index + 1}`;

      validateUnitNumber(errors, bandOwner, 'minXRatio', band.minXRatio);
      validateUnitNumber(errors, bandOwner, 'maxXRatio', band.maxXRatio);

      if (band.minXRatio >= band.maxXRatio) {
        errors.push(`${bandOwner} must order x ratios`);
      }
    }

    if (!registries.renderCues.has(object.rendering.cue)) {
      errors.push(`${owner} rendering has invalid cue: ${String(object.rendering.cue)}`);
    }

    if (!registries.renderLayers.has(object.rendering.layer)) {
      errors.push(`${owner} rendering has invalid layer: ${String(object.rendering.layer)}`);
    }

    validateHexColor(errors, `${owner} rendering`, 'normalColor', object.rendering.normalColor);
    validateHexColor(
      errors,
      `${owner} rendering`,
      'highContrastColor',
      object.rendering.highContrastColor
    );
    validateUnitNumber(errors, `${owner} rendering`, 'fillAlpha', object.rendering.fillAlpha);
    validateUnitNumber(errors, `${owner} rendering`, 'strokeAlpha', object.rendering.strokeAlpha);

    if (object.rendering.fillAlpha > 0.38) {
      errors.push(`${owner} rendering must keep fillAlpha at or below 0.38`);
    }

    if (object.rendering.strokeAlpha > 0.95) {
      errors.push(`${owner} rendering must keep strokeAlpha at or below 0.95`);
    }

    validateEnvironmentObjectCues(errors, `${owner} audio cues`, object.audioCues);
    validateEnvironmentObjectCues(errors, `${owner} vfx cues`, object.vfxCues);

    if (!registries.accessibilityVariants.has(object.accessibility.reducedMotionVariant)) {
      errors.push(
        `${owner} accessibility has invalid reduced motion variant: ${String(
          object.accessibility.reducedMotionVariant
        )}`
      );
    }

    if (!registries.accessibilityVariants.has(object.accessibility.highContrastVariant)) {
      errors.push(
        `${owner} accessibility has invalid high contrast variant: ${String(
          object.accessibility.highContrastVariant
        )}`
      );
    }

    if (!object.accessibility.label.trim()) {
      errors.push(`${owner} accessibility must have a label`);
    }
  }
}

function validateEnvironmentObjectCues(
  errors: string[],
  owner: string,
  cues: { readonly spawn: string; readonly hit: string; readonly destroy: string }
): void {
  if (!cues.spawn.trim()) {
    errors.push(`${owner} must define spawn cue`);
  }

  if (!cues.hit.trim()) {
    errors.push(`${owner} must define hit cue`);
  }

  if (!cues.destroy.trim()) {
    errors.push(`${owner} must define destroy cue`);
  }
}

function validateHazardZoneDefinitions(
  errors: string[],
  hazardZones: readonly HazardZoneDefinition[],
  registries: HazardZoneDefinitionRegistries
): void {
  const seenHazardZoneIds = new Set<string>();

  for (const hazard of hazardZones) {
    const owner = `Hazard zone ${String(hazard.id)}`;

    if (seenHazardZoneIds.has(hazard.id)) {
      errors.push(`Duplicate hazard zone id: ${String(hazard.id)}`);
    }

    seenHazardZoneIds.add(hazard.id);

    if (!registries.ids.has(hazard.id)) {
      errors.push(`${owner} has invalid id`);
    }

    if (!registries.families.has(hazard.family)) {
      errors.push(`${owner} has invalid family: ${String(hazard.family)}`);
    }

    if (!hazard.label.trim()) {
      errors.push(`${owner} must have a label`);
    }

    if (!hazard.debugLabel.trim()) {
      errors.push(`${owner} must have a debug label`);
    }

    if (!hazard.summary.trim()) {
      errors.push(`${owner} must have a summary`);
    }

    if (hazard.sectorFit.length === 0) {
      errors.push(`${owner} must list at least one sector fit`);
    }

    validateStringList(errors, owner, 'sector fit', hazard.sectorFit, registries.sectors);

    if (hazard.factionFit !== 'any') {
      validateStringList(errors, owner, 'faction fit', hazard.factionFit, registries.factions);
    }

    if (!registries.telegraphShapes.has(hazard.telegraphShape)) {
      errors.push(`${owner} has invalid telegraph shape: ${String(hazard.telegraphShape)}`);
    }

    if (!registries.damageShapes.has(hazard.activeDamageShape)) {
      errors.push(`${owner} has invalid active damage shape: ${String(hazard.activeDamageShape)}`);
    }

    for (const source of registries.scheduleSources) {
      const metrics = hazard.metrics[source as keyof HazardZoneDefinition['metrics']];

      if (!metrics) {
        errors.push(`${owner} must define ${source} metrics`);
        continue;
      }

      validateUnitNumber(errors, `${owner} ${source} metrics`, 'widthRatio', metrics.widthRatio);
      validatePositiveNumber(
        errors,
        `${owner} ${source} metrics`,
        'activeSpan',
        metrics.activeSpan
      );
      validatePositiveNumber(
        errors,
        `${owner} ${source} metrics`,
        'telegraphLead',
        metrics.telegraphLead
      );

      if (metrics.widthRatio < 0.05 || metrics.widthRatio > 0.5) {
        errors.push(`${owner} ${source} metrics must keep widthRatio between 0.05 and 0.5`);
      }
    }

    validatePositiveNumber(
      errors,
      `${owner} phase`,
      'minTelegraphLead',
      hazard.phase.minTelegraphLead
    );
    validatePositiveNumber(errors, `${owner} phase`, 'minActiveSpan', hazard.phase.minActiveSpan);
    validatePositiveNumber(errors, owner, 'damage', hazard.damage);
    validatePositiveNumber(errors, owner, 'damageCooldownSeconds', hazard.damageCooldownSeconds);

    if (hazard.damage > 2) {
      errors.push(`${owner} must keep damage at or below 2`);
    }

    if (hazard.damageCooldownSeconds < 0.2) {
      errors.push(`${owner} must keep damageCooldownSeconds at or above 0.2`);
    }

    if (!registries.safeLanePolicies.has(hazard.safeLane.policy)) {
      errors.push(`${owner} has invalid safe-lane policy: ${String(hazard.safeLane.policy)}`);
    }

    validateUnitNumber(
      errors,
      `${owner} safe lane`,
      'minSafeWidthRatio',
      hazard.safeLane.minSafeWidthRatio
    );

    if (hazard.safeLane.minSafeWidthRatio < 0.25) {
      errors.push(`${owner} safe lane must keep minSafeWidthRatio at or above 0.25`);
    }

    const widestMetric = Math.max(
      ...Object.values(hazard.metrics).map((metrics) => metrics.widthRatio)
    );

    if (hazard.safeLane.minSafeWidthRatio > 1 - widestMetric) {
      errors.push(`${owner} safe lane cannot exceed remaining arena width`);
    }

    if (!registries.bossArenaPolicies.has(hazard.bossArenaPolicy)) {
      errors.push(`${owner} has invalid boss arena policy: ${String(hazard.bossArenaPolicy)}`);
    }

    if (hazard.bossArenaPolicy !== 'hideAndDefer') {
      errors.push(`${owner} must hide and defer during locked boss arenas`);
    }

    if (!registries.renderLayers.has(hazard.readability.renderLayer)) {
      errors.push(
        `${owner} readability has invalid render layer: ${String(hazard.readability.renderLayer)}`
      );
    }

    if (hazard.readability.renderLayer !== 'underBullets') {
      errors.push(`${owner} readability must render under bullets`);
    }

    if (!registries.collisionShapes.has(hazard.readability.collisionShape)) {
      errors.push(
        `${owner} readability has invalid collision shape: ${String(
          hazard.readability.collisionShape
        )}`
      );
    }

    validateUnitNumber(
      errors,
      `${owner} readability`,
      'maxFillAlpha',
      hazard.readability.maxFillAlpha
    );
    validateUnitNumber(
      errors,
      `${owner} readability`,
      'maxStrokeAlpha',
      hazard.readability.maxStrokeAlpha
    );

    if (hazard.readability.maxFillAlpha > 0.14) {
      errors.push(`${owner} readability must keep maxFillAlpha at or below 0.14`);
    }

    if (hazard.readability.maxStrokeAlpha > 0.95) {
      errors.push(`${owner} readability must keep maxStrokeAlpha at or below 0.95`);
    }

    if (hazard.readability.minTelegraphLead !== hazard.phase.minTelegraphLead) {
      errors.push(`${owner} readability minTelegraphLead must match phase metadata`);
    }

    validateHexColor(errors, `${owner} readability`, 'normalColor', hazard.readability.normalColor);
    validateHexColor(
      errors,
      `${owner} readability`,
      'highContrastColor',
      hazard.readability.highContrastColor
    );

    if (!registries.settingsVariants.has(hazard.readability.reducedMotionVariant)) {
      errors.push(
        `${owner} readability has invalid reduced motion variant: ${String(
          hazard.readability.reducedMotionVariant
        )}`
      );
    }

    if (!registries.settingsVariants.has(hazard.readability.performanceVariant)) {
      errors.push(
        `${owner} readability has invalid performance variant: ${String(
          hazard.readability.performanceVariant
        )}`
      );
    }

    if (!hazard.behavior) {
      errors.push(`${owner} must define behavior metadata`);
      continue;
    }

    if (!registries.behaviorKinds.has(hazard.behavior.kind)) {
      errors.push(`${owner} behavior has invalid kind: ${String(hazard.behavior.kind)}`);
    }

    if (!hazard.behavior.warningCue.trim()) {
      errors.push(`${owner} behavior must have a warning cue`);
    }

    if (!hazard.behavior.activeCue.trim()) {
      errors.push(`${owner} behavior must have an active cue`);
    }

    validateUnitNumber(errors, `${owner} behavior`, 'motionScale', hazard.behavior.motionScale);
    validateUnitNumber(
      errors,
      `${owner} behavior`,
      'activeDamageDutyCycle',
      hazard.behavior.activeDamageDutyCycle
    );
    validatePositiveInteger(
      errors,
      `${owner} behavior`,
      'activePulseCount',
      hazard.behavior.activePulseCount
    );
    validatePositiveInteger(
      errors,
      `${owner} behavior`,
      'collisionBands',
      hazard.behavior.collisionBands
    );
    validateUnitNumber(
      errors,
      `${owner} behavior`,
      'patternDensity',
      hazard.behavior.patternDensity
    );

    if (hazard.behavior.activeDamageDutyCycle < 0.45) {
      errors.push(`${owner} behavior must keep activeDamageDutyCycle at or above 0.45`);
    }

    if (hazard.behavior.activePulseCount > 8) {
      errors.push(`${owner} behavior must keep activePulseCount at or below 8`);
    }

    if (hazard.behavior.collisionBands > 4) {
      errors.push(`${owner} behavior must keep collisionBands at or below 4`);
    }
  }
}

function validateEnemyRoleMetadata(
  errors: string[],
  faction: FactionDefinition,
  seenClassIds: Set<string>,
  registries: EnemyRoleMetadataRegistries
): void {
  const metadata = (faction as Partial<FactionDefinition>).enemyRole as
    EnemyRoleMetadata | undefined;
  const owner = `Faction ${faction.id} enemy role`;

  if (!metadata) {
    errors.push(`${owner} must define metadata`);
    return;
  }

  if (!registries.classIds.has(metadata.classId)) {
    errors.push(`${owner} has invalid class id: ${String(metadata.classId)}`);
  }

  if (seenClassIds.has(metadata.classId)) {
    errors.push(`Duplicate enemy class id: ${String(metadata.classId)}`);
  }

  seenClassIds.add(metadata.classId);

  if (!registries.roles.has(metadata.role)) {
    errors.push(`${owner} has invalid role: ${String(metadata.role)}`);
  }

  if (!registries.pressureTypes.has(metadata.pressureType)) {
    errors.push(`${owner} has invalid pressure type: ${String(metadata.pressureType)}`);
  }

  if (!registries.movementFamilies.has(metadata.movementFamily)) {
    errors.push(`${owner} has invalid movement family: ${String(metadata.movementFamily)}`);
  }

  if (!registries.attackFamilies.has(metadata.attackFamily)) {
    errors.push(`${owner} has invalid attack family: ${String(metadata.attackFamily)}`);
  }

  if (metadata.attackFamily !== faction.enemyPattern) {
    errors.push(`${owner} attack family must match current enemy pattern`);
  }

  validateStringList(
    errors,
    owner,
    'variant eligibility',
    metadata.variantEligibility,
    registries.variantEligibilities
  );
  validateStringList(
    errors,
    owner,
    'formation eligibility',
    metadata.formationEligibility,
    registries.formationEligibilities
  );

  if (!metadata.formationEligibility.includes('solo')) {
    errors.push(`${owner} must allow solo formation eligibility`);
  }

  if (!registries.readabilityTiers.has(metadata.readabilityTier)) {
    errors.push(`${owner} has invalid readability tier: ${String(metadata.readabilityTier)}`);
  }

  if (!registries.factionFits.has(metadata.factionFit)) {
    errors.push(`${owner} has invalid faction fit: ${String(metadata.factionFit)}`);
  }

  if (!registries.objectivePolicies.has(metadata.objectivePolicy)) {
    errors.push(`${owner} has invalid objective policy: ${String(metadata.objectivePolicy)}`);
  }

  if (!metadata.debugLabel.trim()) {
    errors.push(`${owner} must have a debug label`);
  }
}

function validateEnemyFormationDefinitions(
  errors: string[],
  formations: readonly EnemyFormationDefinition[],
  factions: readonly FactionDefinition[],
  registries: EnemyFormationDefinitionRegistries
): void {
  const seenFormationIds = new Set<string>();

  for (const formation of formations) {
    const owner = `Enemy formation ${String(formation.id)}`;

    if (seenFormationIds.has(formation.id)) {
      errors.push(`Duplicate enemy formation id: ${formation.id}`);
    }

    seenFormationIds.add(formation.id);

    if (!registries.formationIds.has(formation.id)) {
      errors.push(`${owner} has invalid id`);
    }

    if (!registries.formationShapes.has(formation.shape)) {
      errors.push(`${owner} has invalid shape: ${String(formation.shape)}`);
    }

    if (!formation.name.trim()) {
      errors.push(`${owner} must have a name`);
    }

    if (!formation.debugLabel.trim()) {
      errors.push(`${owner} must have a debug label`);
    }

    if (!formation.summary.trim()) {
      errors.push(`${owner} must have a summary`);
    }

    validateNonNegativeInteger(errors, owner, 'minSectorIndex', formation.minSectorIndex);
    validatePositiveInteger(errors, owner, 'minMembers', formation.minMembers);
    validatePositiveInteger(errors, owner, 'maxMembers', formation.maxMembers);
    validatePositiveNumber(errors, owner, 'weight', formation.weight);
    validateNonNegativeInteger(errors, owner, 'clearBonusSalvage', formation.clearBonusSalvage);
    validatePositiveNumber(errors, owner, 'spacing', formation.spacing);

    if (formation.minMembers > formation.maxMembers) {
      errors.push(`${owner} must order minMembers before maxMembers`);
    }

    if (formation.maxMembers > formation.members.length) {
      errors.push(`${owner} must define enough member slots for maxMembers`);
    }

    if (formation.spacing < 36) {
      errors.push(`${owner} must keep spacing readable`);
    }

    if (formation.clearBonusSalvage > 3) {
      errors.push(`${owner} must keep clearBonusSalvage at or below 3`);
    }

    if (!registries.entryStyles.has(formation.entryStyle)) {
      errors.push(`${owner} has invalid entry style: ${String(formation.entryStyle)}`);
    }

    if (!registries.breakConditions.has(formation.breakCondition)) {
      errors.push(`${owner} has invalid break condition: ${String(formation.breakCondition)}`);
    }

    if (!registries.cleanupPolicies.has(formation.cleanupPolicy)) {
      errors.push(`${owner} has invalid cleanup policy: ${String(formation.cleanupPolicy)}`);
    }

    if (formation.cleanupPolicy !== 'requiredTargets') {
      errors.push(`${owner} cleanup policy must keep first-pass members as required targets`);
    }

    if (formation.encounterTypes) {
      validateStringList(
        errors,
        owner,
        'encounter type',
        formation.encounterTypes,
        registries.encounterTypes
      );
    }

    if (formation.preferredRoles) {
      validateStringList(
        errors,
        owner,
        'preferred role',
        formation.preferredRoles,
        registries.roles
      );
    }

    for (const [index, member] of formation.members.entries()) {
      const memberOwner = `${owner} member ${index + 1}`;

      if (!registries.roles.has(member.role)) {
        errors.push(`${memberOwner} has invalid role: ${String(member.role)}`);
      }

      if (!Number.isFinite(member.xOffset) || Math.abs(member.xOffset) > 180) {
        errors.push(`${memberOwner} must keep xOffset within fixed-arena bounds`);
      }

      if (
        !Number.isFinite(member.targetYOffset) ||
        member.targetYOffset < -90 ||
        member.targetYOffset > 100
      ) {
        errors.push(`${memberOwner} must keep targetYOffset within readable bounds`);
      }

      if (
        !Number.isFinite(member.delaySeconds) ||
        member.delaySeconds < 0 ||
        member.delaySeconds > 0.75
      ) {
        errors.push(`${memberOwner} must keep delaySeconds between 0 and 0.75`);
      }

      if (
        !Number.isFinite(member.distanceOffset) ||
        member.distanceOffset < 0 ||
        member.distanceOffset > 72
      ) {
        errors.push(`${memberOwner} must keep distanceOffset between 0 and 72`);
      }
    }

    if (!formation.cue.label.trim()) {
      errors.push(`${owner} must have a cue label`);
    }

    if (formation.cue.label.length > 4) {
      errors.push(`${owner} cue label must be 4 characters or fewer`);
    }

    validateHexColor(errors, `${owner} cue`, 'stroke', formation.cue.stroke);

    const matchingFactions = factions.filter((faction) =>
      faction.enemyRole.formationEligibility.includes(formation.shape)
    );

    if (matchingFactions.length === 0) {
      errors.push(`${owner} must match at least one current faction formation eligibility`);
    }

    const memberRoles = new Set(formation.members.map((member) => member.role));
    const coveredRoles = new Set(matchingFactions.map((faction) => faction.enemyRole.role));

    for (const role of memberRoles) {
      if (!coveredRoles.has(role)) {
        errors.push(`${owner} member role ${role} must match a current faction for this shape`);
      }
    }
  }
}

function validateEnemyVariantDefinitions(
  errors: string[],
  variants: readonly EnemyVariantDefinition[],
  factions: readonly FactionDefinition[],
  registries: EnemyVariantDefinitionRegistries
): void {
  const seenVariantIds = new Set<string>();

  for (const variant of variants) {
    const owner = `Enemy variant ${String(variant.id)}`;

    if (seenVariantIds.has(variant.id)) {
      errors.push(`Duplicate enemy variant id: ${variant.id}`);
    }

    seenVariantIds.add(variant.id);

    if (!registries.variantIds.has(variant.id)) {
      errors.push(`${owner} has invalid id`);
    }

    if (!variant.name.trim()) {
      errors.push(`${owner} must have a name`);
    }

    if (!variant.debugLabel.trim()) {
      errors.push(`${owner} must have a debug label`);
    }

    if (!variant.summary.trim()) {
      errors.push(`${owner} must have a summary`);
    }

    validateStringList(
      errors,
      owner,
      'eligibility',
      variant.eligibility,
      registries.variantEligibilities
    );

    if (variant.eligibility.includes('baseline')) {
      errors.push(`${owner} must not use baseline eligibility`);
    }

    validateNonNegativeInteger(errors, owner, 'minSectorIndex', variant.minSectorIndex);
    validatePositiveNumber(errors, owner, 'weight', variant.weight);
    validateNonNegativeInteger(errors, owner, 'hullBonus', variant.hullBonus);
    validatePositiveNumber(errors, owner, 'fireDelayMultiplier', variant.fireDelayMultiplier);
    validatePositiveNumber(errors, owner, 'driftMultiplier', variant.driftMultiplier);
    validatePositiveNumber(errors, owner, 'radiusScale', variant.radiusScale);
    validateNonNegativeInteger(errors, owner, 'bonusSalvage', variant.bonusSalvage);

    if (variant.hullBonus > 2) {
      errors.push(`${owner} must keep hullBonus at or below 2`);
    }

    if (variant.fireDelayMultiplier < 0.75 || variant.fireDelayMultiplier > 1.25) {
      errors.push(`${owner} must keep fireDelayMultiplier between 0.75 and 1.25`);
    }

    if (variant.driftMultiplier < 0.75 || variant.driftMultiplier > 1.45) {
      errors.push(`${owner} must keep driftMultiplier between 0.75 and 1.45`);
    }

    if (variant.radiusScale < 0.85 || variant.radiusScale > 1.2) {
      errors.push(`${owner} must keep radiusScale between 0.85 and 1.2`);
    }

    if (variant.bonusSalvage > 4) {
      errors.push(`${owner} must keep bonusSalvage at or below 4`);
    }

    if (variant.allowedRoles) {
      validateStringList(errors, owner, 'allowed role', variant.allowedRoles, registries.roles);
    }

    if (variant.allowedFactions) {
      validateStringList(
        errors,
        owner,
        'allowed faction',
        variant.allowedFactions,
        registries.factions
      );
    }

    if (variant.encounterTypes) {
      validateStringList(
        errors,
        owner,
        'encounter type',
        variant.encounterTypes,
        registries.encounterTypes
      );
    }

    if (!variant.cue.label.trim()) {
      errors.push(`${owner} must have a cue label`);
    }

    if (variant.cue.label.length > 4) {
      errors.push(`${owner} cue label must be 4 characters or fewer`);
    }

    validateHexColor(errors, `${owner} cue`, 'fill', variant.cue.fill);
    validateHexColor(errors, `${owner} cue`, 'stroke', variant.cue.stroke);

    const matchingFactions = factions.filter((faction) => {
      const metadata = faction.enemyRole;
      const roleAllowed =
        !variant.allowedRoles ||
        variant.allowedRoles.length === 0 ||
        variant.allowedRoles.includes(metadata.role);
      const factionAllowed =
        !variant.allowedFactions ||
        variant.allowedFactions.length === 0 ||
        variant.allowedFactions.includes(faction.id);

      return (
        roleAllowed &&
        factionAllowed &&
        variant.eligibility.some((eligibility) => metadata.variantEligibility.includes(eligibility))
      );
    });

    if (matchingFactions.length === 0) {
      errors.push(`${owner} must match at least one current faction role`);
    }
  }
}

function validateItemFamilyGates(
  errors: string[],
  gates: readonly ItemFamilyGateDefinition[],
  items: readonly ItemDefinition[],
  registries: ItemFamilyGateRegistries
): void {
  const seenFamilies = new Set<string>();

  for (const gate of gates) {
    const owner = `Item family gate ${gate.family}`;

    if (seenFamilies.has(gate.family)) {
      errors.push(`Duplicate item family gate: ${gate.family}`);
    }

    seenFamilies.add(gate.family);

    if (!registries.families.has(gate.family)) {
      errors.push(`${owner} references invalid family`);
    }

    if (!registries.unlockIds.has(gate.unlockId)) {
      errors.push(`${owner} references missing unlock: ${gate.unlockId}`);
    }

    if (!gate.label.trim()) {
      errors.push(`${owner} must have a label`);
    }

    if (!gate.summary.trim()) {
      errors.push(`${owner} must have summary text`);
    }

    if (!gate.lockedHint.trim()) {
      errors.push(`${owner} must have locked hint text`);
    }

    if (gate.unlockTiers.length === 0) {
      errors.push(`${owner} must gate at least one unlock tier`);
    }

    for (const duplicateTier of getDuplicateStrings(gate.unlockTiers)) {
      errors.push(`${owner} has duplicate unlock tier: ${duplicateTier}`);
    }

    for (const unlockTier of gate.unlockTiers) {
      if (!registries.unlockTiers.has(unlockTier)) {
        errors.push(`${owner} has invalid unlock tier: ${unlockTier}`);
      }
    }

    const gatedItems = items.filter(
      (item) =>
        item.metadata.family === gate.family &&
        gate.unlockTiers.includes(item.metadata.unlockTier as ItemUnlockTier)
    );

    if (gatedItems.length === 0) {
      errors.push(`${owner} must match at least one item`);
    }

    for (const item of gatedItems) {
      if (item.metadata.sources.includes('starter')) {
        errors.push(`${owner} must not gate starter item ${item.id}`);
      }
    }
  }
}

function validateItemPoolWeightProfiles(
  errors: string[],
  profiles: readonly ItemPoolWeightProfileDefinition[],
  items: readonly ItemDefinition[],
  rewardPools: readonly RewardPoolDefinition[],
  registries: ItemPoolProfileRegistries
): void {
  const seenProfileIds = new Set<string>();
  const itemById = new Map(items.map((item) => [item.id, item]));
  const poolById = new Map(rewardPools.map((pool) => [pool.id, pool]));

  for (const profile of profiles) {
    const owner = `Item pool profile ${profile.id}`;

    if (seenProfileIds.has(profile.id)) {
      errors.push(`Duplicate item pool profile id: ${profile.id}`);
    }

    seenProfileIds.add(profile.id);

    if (!registries.profileIds.has(profile.id)) {
      errors.push(`${owner} has invalid id`);
    }

    if (!profile.label.trim()) {
      errors.push(`${owner} must have a label`);
    }

    if (profile.poolIds.length === 0) {
      errors.push(`${owner} must reference at least one reward pool`);
    }

    for (const poolId of profile.poolIds) {
      if (!registries.rewardPoolIds.has(poolId)) {
        errors.push(`${owner} references missing reward pool: ${String(poolId)}`);
      }
    }

    for (const duplicatePoolId of getDuplicateStrings(profile.poolIds)) {
      errors.push(`${owner} has duplicate reward pool: ${duplicatePoolId}`);
    }

    validateWeightMap(errors, owner, 'source', profile.sourceWeights, registries.sources);
    validateWeightMap(errors, owner, 'family', profile.familyWeights ?? {}, registries.families);
    validateWeightMap(errors, owner, 'tag', profile.tagWeights ?? {}, registries.tags);

    let hasPositiveRarity = false;

    for (const rarity of registries.rarities) {
      const value = profile.rarityWeights[rarity as keyof typeof profile.rarityWeights];

      if (value === undefined) {
        errors.push(`${owner} is missing rarity weight: ${rarity}`);
        continue;
      }

      if (!Number.isFinite(value) || value < 0) {
        errors.push(`${owner} has invalid rarity weight for ${rarity}`);
      }

      if (value !== undefined && value > 0) {
        hasPositiveRarity = true;
      }
    }

    for (const rarity of Object.keys(profile.rarityWeights)) {
      if (!registries.rarities.has(rarity)) {
        errors.push(`${owner} has invalid rarity weight: ${rarity}`);
      }
    }

    if (!hasPositiveRarity) {
      errors.push(`${owner} must allow at least one rarity`);
    }

    const candidateIds = new Set(
      profile.poolIds.flatMap((poolId) => poolById.get(poolId)?.itemIds ?? [])
    );
    const hasEligibleCandidate = [...candidateIds].some((itemId) => {
      const item = itemById.get(itemId);

      return item ? profile.rarityWeights[item.rarity] > 0 : false;
    });

    if (!hasEligibleCandidate) {
      errors.push(`${owner} must leave at least one eligible candidate`);
    }
  }

  for (const profileId of registries.profileIds) {
    if (!seenProfileIds.has(profileId)) {
      errors.push(`Missing item pool profile: ${profileId}`);
    }
  }
}

function validateWeightMap(
  errors: string[],
  owner: string,
  label: string,
  weights: Readonly<Record<string, number>> | Readonly<Partial<Record<string, number>>>,
  registry: ReadonlySet<string>
): void {
  for (const [key, value] of Object.entries(weights)) {
    if (!registry.has(key)) {
      errors.push(`${owner} has invalid ${label} weight: ${key}`);
    }

    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      errors.push(`${owner} has invalid ${label} weight for ${key}`);
    }
  }
}

function validateStringList(
  errors: string[],
  owner: string,
  label: string,
  values: readonly string[],
  registry: ReadonlySet<string>
): void {
  if (values.length === 0) {
    errors.push(`${owner} must list at least one ${label}`);
  }

  for (const value of values) {
    if (!registry.has(value)) {
      errors.push(`${owner} has invalid ${label}: ${String(value)}`);
    }
  }

  for (const duplicateValue of getDuplicateStrings(values)) {
    errors.push(`${owner} has duplicate ${label}: ${duplicateValue}`);
  }
}

function validateItemMetadata(
  errors: string[],
  item: ItemDefinition,
  itemUnlocks: Readonly<Partial<Record<ItemId, UnlockId>>>,
  registries: ItemMetadataRegistries
): void {
  const metadata = item.metadata;

  if (!metadata) {
    errors.push(`Item ${item.id} must define metadata`);
    return;
  }

  if (!registries.families.has(metadata.family)) {
    errors.push(`Item ${item.id} has invalid family: ${String(metadata.family)}`);
  }

  if (metadata.sources.length === 0) {
    errors.push(`Item ${item.id} must list at least one source`);
  }

  for (const source of metadata.sources) {
    if (!registries.sources.has(source)) {
      errors.push(`Item ${item.id} has invalid source: ${String(source)}`);
    }
  }

  for (const duplicateSource of getDuplicateStrings(metadata.sources)) {
    errors.push(`Item ${item.id} has duplicate source: ${duplicateSource}`);
  }

  if (!registries.unlockTiers.has(metadata.unlockTier)) {
    errors.push(`Item ${item.id} has invalid unlock tier: ${String(metadata.unlockTier)}`);
  }

  if (!registries.implementationStatuses.has(metadata.implementationStatus)) {
    errors.push(
      `Item ${item.id} has invalid implementation status: ${String(metadata.implementationStatus)}`
    );
  }

  if (
    (metadata.implementationStatus === 'bridge' || metadata.implementationStatus === 'planned') &&
    !metadata.implementationNote?.trim()
  ) {
    errors.push(`Item ${item.id} must explain ${metadata.implementationStatus} implementation`);
  }

  if (metadata.implementationStatus === 'planned' && metadata.sources.includes('starter')) {
    errors.push(`Item ${item.id} cannot be starter sourced while implementation is planned`);
  }

  if (!registries.stackingModes.has(metadata.stacking)) {
    errors.push(`Item ${item.id} has invalid stacking mode: ${String(metadata.stacking)}`);
  }

  if (metadata.uiTags.length === 0) {
    errors.push(`Item ${item.id} must list at least one UI tag`);
  }

  for (const uiTag of metadata.uiTags) {
    if (!registries.uiTags.has(uiTag)) {
      errors.push(`Item ${item.id} has invalid UI tag: ${String(uiTag)}`);
    }
  }

  for (const duplicateUiTag of getDuplicateStrings(metadata.uiTags)) {
    errors.push(`Item ${item.id} has duplicate UI tag: ${duplicateUiTag}`);
  }

  const requiredUnlockId = itemUnlocks[item.id];
  const hasUnlockSource = metadata.sources.includes('unlock');

  if (metadata.unlockTier === 'unlock' && !requiredUnlockId) {
    errors.push(`Item ${item.id} is unlock tier but has no unlock gate`);
  }

  if (requiredUnlockId && metadata.unlockTier !== 'unlock') {
    errors.push(`Item ${item.id} has an unlock gate but is not unlock tier`);
  }

  if (hasUnlockSource && !requiredUnlockId) {
    errors.push(`Item ${item.id} lists unlock source without an unlock gate`);
  }

  if (requiredUnlockId && !hasUnlockSource) {
    errors.push(`Item ${item.id} has an unlock gate but no unlock source`);
  }

  if (
    (item.rarity === 'prototype' || item.rarity === 'cursed') &&
    metadata.sources.includes('starter')
  ) {
    errors.push(`Item ${item.id} cannot be starter sourced with ${item.rarity} rarity`);
  }
}

function getDuplicateStrings(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }

    seen.add(value);
  }

  return [...duplicates];
}

function validatePositiveNumber(
  errors: string[],
  owner: string,
  field: string,
  value: number
): void {
  if (!Number.isFinite(value) || value <= 0) {
    errors.push(`${owner} must have positive ${field}`);
  }
}

function validateNonNegativeNumber(
  errors: string[],
  owner: string,
  field: string,
  value: number
): void {
  if (!Number.isFinite(value) || value < 0) {
    errors.push(`${owner} must have non-negative ${field}`);
  }
}

function validatePositiveInteger(
  errors: string[],
  owner: string,
  field: string,
  value: number
): void {
  if (!Number.isInteger(value) || value <= 0) {
    errors.push(`${owner} must have positive ${field}`);
  }
}

function validateNonNegativeInteger(
  errors: string[],
  owner: string,
  field: string,
  value: number
): void {
  if (!Number.isInteger(value) || value < 0) {
    errors.push(`${owner} must have non-negative ${field}`);
  }
}

function validateUnitNumber(errors: string[], owner: string, field: string, value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    errors.push(`${owner} must have ${field} between 0 and 1`);
  }
}

function validateHexColor(errors: string[], owner: string, field: string, value: string): void {
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
    errors.push(`${owner} must have ${field} as a #RRGGBB color`);
  }
}

function validateEncounterPacing(errors: string[], sector: SectorDefinition): void {
  const pacing = sector.encounterPacing;

  if (!pacing) {
    return;
  }

  validateUnitNumber(
    errors,
    `Sector ${sector.id} encounter pacing`,
    'waveWindowStartRatio',
    pacing.waveWindowStartRatio
  );
  validateUnitNumber(
    errors,
    `Sector ${sector.id} encounter pacing`,
    'waveWindowEndRatio',
    pacing.waveWindowEndRatio
  );
  validatePositiveNumber(
    errors,
    `Sector ${sector.id} encounter pacing`,
    'spawnSpacing',
    pacing.spawnSpacing
  );
  if (pacing.waveDistanceRatios) {
    for (const [index, ratio] of pacing.waveDistanceRatios.entries()) {
      validateUnitNumber(
        errors,
        `Sector ${sector.id} encounter pacing waveDistanceRatios ${index + 1}`,
        'ratio',
        ratio
      );

      const previousRatio = pacing.waveDistanceRatios[index - 1];

      if (previousRatio !== undefined && ratio <= previousRatio) {
        errors.push(`Sector ${sector.id} encounter pacing must order waveDistanceRatios`);
      }
    }
  }
  validateUnitNumber(
    errors,
    `Sector ${sector.id} encounter pacing`,
    'firstSpawnXRatio',
    pacing.firstSpawnXRatio
  );
  validateUnitNumber(
    errors,
    `Sector ${sector.id} encounter pacing`,
    'flankXMinRatio',
    pacing.flankXMinRatio
  );
  validateUnitNumber(
    errors,
    `Sector ${sector.id} encounter pacing`,
    'flankXMaxRatio',
    pacing.flankXMaxRatio
  );
  validatePositiveNumber(
    errors,
    `Sector ${sector.id} encounter pacing`,
    'targetYMin',
    pacing.targetYMin
  );
  validatePositiveNumber(
    errors,
    `Sector ${sector.id} encounter pacing`,
    'targetYMax',
    pacing.targetYMax
  );

  if (pacing.waveWindowStartRatio >= pacing.waveWindowEndRatio) {
    errors.push(`Sector ${sector.id} encounter pacing must order wave window ratios`);
  }

  if (pacing.flankXMinRatio >= pacing.flankXMaxRatio) {
    errors.push(`Sector ${sector.id} encounter pacing must order flank x ratios`);
  }

  if (pacing.targetYMin >= pacing.targetYMax) {
    errors.push(`Sector ${sector.id} encounter pacing must order target y bounds`);
  }
}
