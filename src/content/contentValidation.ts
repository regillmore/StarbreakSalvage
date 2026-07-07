import { BOSSES, type BossDefinition } from './bosses';
import { ACHIEVEMENTS, type AchievementDefinition } from './achievements';
import { BACKGROUNDS, BACKGROUND_LAYER_KINDS, type BackgroundDefinition } from './backgrounds';
import { FACTIONS, type FactionDefinition } from './factions';
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
import { ITEM_UNLOCKS } from '../game/UnlockGates';

export type ItemHookImplementationRegistry = Readonly<Partial<Record<ItemHook, readonly ItemId[]>>>;

export interface ContentValidationInput {
  readonly achievements?: readonly AchievementDefinition[];
  readonly backgrounds?: readonly BackgroundDefinition[];
  readonly bosses?: readonly BossDefinition[];
  readonly factions?: readonly FactionDefinition[];
  readonly items?: readonly ItemDefinition[];
  readonly itemHookImplementations?: ItemHookImplementationRegistry;
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
  const achievements = input.achievements ?? ACHIEVEMENTS;
  const backgrounds = input.backgrounds ?? BACKGROUNDS;
  const bosses = input.bosses ?? BOSSES;
  const factions = input.factions ?? FACTIONS;
  const items = input.items ?? ITEMS;
  const itemHookImplementations = createItemHookImplementationRegistry(
    input.itemHookImplementations
  );
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
  const backgroundLayerKinds = new Set<string>(BACKGROUND_LAYER_KINDS);
  const unlockKinds = new Set(['ship', 'item', 'faction', 'bossPractice', 'music', 'challenge']);
  const upgradeCategories = new Set<string>(UPGRADE_CATEGORIES);
  const upgradeEffectKinds = new Set<string>(UPGRADE_EFFECT_KINDS);
  const upgradeIconKeys = new Set<string>(UPGRADE_ICON_KEYS);
  const weaponPatterns = new Set(['single', 'dual', 'spread', 'split', 'missile', 'beam']);
  const bossPatterns = new Set(['auditFan', 'missileCurtain', 'sporeSpiral']);
  const shipSilhouettes = new Set<string>(SHIP_SILHOUETTES);
  const shipMountHints = new Set<string>(SHIP_WEAPON_MOUNT_HINTS);
  const shipHudThemeKeys = new Set<string>(SHIP_HUD_THEME_KEYS);

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
  }

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
