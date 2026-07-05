import { BOSSES, type BossDefinition } from './bosses';
import { ACHIEVEMENTS, type AchievementDefinition } from './achievements';
import { BACKGROUNDS, BACKGROUND_LAYER_KINDS, type BackgroundDefinition } from './backgrounds';
import { FACTIONS, type FactionDefinition } from './factions';
import {
  ITEM_ARCHETYPES,
  ITEM_HOOKS,
  ITEMS,
  ITEM_TAGS,
  REWARD_POOLS,
  type ItemHook,
  type ItemId,
  type ItemDefinition,
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
import { UNLOCKS, type UnlockDefinition } from './unlocks';
import {
  UPGRADES,
  UPGRADE_CATEGORIES,
  UPGRADE_EFFECT_KINDS,
  UPGRADE_ICON_KEYS,
  type UpgradeDefinition
} from './upgrades';
import { WEAPONS, type WeaponDefinition } from './weapons';
import { ITEM_HOOK_IMPLEMENTATIONS } from '../game/ItemHooks';

export type ItemHookImplementationRegistry = Readonly<Partial<Record<ItemHook, readonly ItemId[]>>>;

export interface ContentValidationInput {
  readonly achievements?: readonly AchievementDefinition[];
  readonly backgrounds?: readonly BackgroundDefinition[];
  readonly bosses?: readonly BossDefinition[];
  readonly factions?: readonly FactionDefinition[];
  readonly items?: readonly ItemDefinition[];
  readonly itemHookImplementations?: ItemHookImplementationRegistry;
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

  for (const pool of rewardPools) {
    if (pool.itemIds.length === 0) {
      errors.push(`Reward pool ${pool.id} must not be empty`);
    }

    for (const itemId of pool.itemIds) {
      rewardedItemIds.add(itemId);

      if (!itemIds.has(itemId)) {
        errors.push(`Reward pool ${pool.id} references missing item: ${itemId}`);
      }
    }
  }

  for (const item of items) {
    if (!rewardedItemIds.has(item.id)) {
      errors.push(`Item ${item.id} must appear in at least one reward pool`);
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
    )
  };
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
