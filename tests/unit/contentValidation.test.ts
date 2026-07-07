import { describe, expect, it } from 'vitest';

import { ACHIEVEMENTS, type AchievementDefinition } from '../../src/content/achievements';
import { BACKGROUNDS, type BackgroundDefinition } from '../../src/content/backgrounds';
import { BOSSES, type BossDefinition } from '../../src/content/bosses';
import { validateContent } from '../../src/content/contentValidation';
import { FACTIONS, type FactionDefinition } from '../../src/content/factions';
import {
  ITEM_POOL_WEIGHT_PROFILES,
  ITEM_ARCHETYPES,
  ITEMS,
  REWARD_POOLS,
  type ItemDefinition,
  type ItemPoolWeightProfileDefinition,
  type RewardPoolDefinition
} from '../../src/content/items';
import { SECTORS, type SectorDefinition } from '../../src/content/sectors';
import { SHIPS, type ShipDefinition } from '../../src/content/ships';
import { UNLOCKS, type UnlockDefinition } from '../../src/content/unlocks';
import { UPGRADES, type UpgradeDefinition } from '../../src/content/upgrades';
import { WEAPONS, type WeaponDefinition } from '../../src/content/weapons';
import { ITEM_HOOK_IMPLEMENTATIONS } from '../../src/game/ItemHooks';
import type { ItemFamilyGateDefinition } from '../../src/game/UnlockGates';

const baseItem = ITEMS[0] as ItemDefinition;
const baseBackground = BACKGROUNDS[0] as BackgroundDefinition;
const baseFaction = FACTIONS[0] as FactionDefinition;
const baseBoss = BOSSES[0] as BossDefinition;
const baseSector = SECTORS[0] as SectorDefinition;
const baseShip = SHIPS[0] as ShipDefinition;
const baseUnlock = UNLOCKS[0] as UnlockDefinition;
const baseUpgrade = UPGRADES[0] as UpgradeDefinition;
const baseWeapon = WEAPONS[0] as WeaponDefinition;
const baseAchievement = ACHIEVEMENTS[0] as AchievementDefinition;

describe('validateContent', () => {
  it('accepts the shipped item and reward content', () => {
    expect(validateContent()).toEqual([]);
  });

  it('ships the current content breadth targets', () => {
    const rewardedItemIds = new Set(REWARD_POOLS.flatMap((pool) => pool.itemIds));
    const representedArchetypes = ITEM_ARCHETYPES.filter((archetype) =>
      ITEMS.some(
        (item) =>
          rewardedItemIds.has(item.id) && item.tags.some((tag) => archetype.tags.includes(tag))
      )
    );

    expect(ITEMS).toHaveLength(60);
    expect(FACTIONS).toHaveLength(4);
    expect(BACKGROUNDS).toHaveLength(6);
    expect(UPGRADES.length).toBeGreaterThanOrEqual(6);
    expect(representedArchetypes).toHaveLength(ITEM_ARCHETYPES.length);
    expect(representedArchetypes.length).toBeGreaterThanOrEqual(6);
  });

  it('rejects duplicate faction ids and missing boss faction references', () => {
    const errors = validateContent({
      factions: [baseFaction, { ...baseFaction, name: 'Duplicate Court' }],
      bosses: [
        {
          ...baseBoss,
          factionId: 'faction_missing'
        } as unknown as BossDefinition
      ]
    });

    expect(errors).toContain(`Duplicate faction id: ${baseFaction.id}`);
    expect(errors).toContain(
      'Boss boss_auditor_drone_xl references missing faction: faction_missing'
    );
  });

  it('rejects invalid faction behavior metadata', () => {
    const errors = validateContent({
      factions: [
        {
          ...baseFaction,
          enemyPattern: 'teleportMine',
          visualShape: 'box',
          summary: ''
        } as unknown as FactionDefinition
      ]
    });

    expect(errors).toContain(`Faction ${baseFaction.id} has invalid enemy pattern: teleportMine`);
    expect(errors).toContain(`Faction ${baseFaction.id} has invalid visual shape: box`);
    expect(errors).toContain(`Faction ${baseFaction.id} must have behavior notes`);
  });

  it('rejects invalid boss phase definitions', () => {
    const basePhase = baseBoss.phases[0];

    if (!basePhase) {
      throw new Error('Boss fixture is missing a phase.');
    }

    const errors = validateContent({
      bosses: [
        {
          ...baseBoss,
          phases: [
            {
              ...basePhase,
              startsAtHullRatio: 0.9,
              telegraphMultiplier: 0.5,
              patternSequence: []
            }
          ]
        }
      ] as unknown as readonly BossDefinition[]
    });

    expect(errors).toContain(`Boss ${baseBoss.id} must define at least two phases`);
    expect(errors).toContain(`Boss ${baseBoss.id} first phase must start at hull ratio 1`);
    expect(errors).toContain(
      `Boss ${baseBoss.id} phase ${basePhase.label} must keep readable telegraph timing`
    );
    expect(errors).toContain(
      `Boss ${baseBoss.id} phase ${basePhase.label} must define a pattern sequence`
    );
  });

  it('rejects duplicate unlock ids and missing achievement unlock references', () => {
    const errors = validateContent({
      unlocks: [baseUnlock, { ...baseUnlock, name: 'Duplicate Unlock' }],
      achievements: [
        {
          ...baseAchievement,
          unlockIds: ['unlock_missing']
        } as unknown as AchievementDefinition
      ]
    });

    expect(errors).toContain(`Duplicate unlock id: ${baseUnlock.id}`);
    expect(errors).toContain(
      'Achievement achievement_first_contract references missing unlock: unlock_missing'
    );
  });

  it('rejects invalid unlock archive metadata', () => {
    const errors = validateContent({
      unlocks: [
        {
          ...baseUnlock,
          kind: 'coupon',
          summary: '',
          effect: '',
          grants: []
        } as unknown as UnlockDefinition
      ]
    });

    expect(errors).toContain(`Unlock ${baseUnlock.id} has invalid kind: coupon`);
    expect(errors).toContain(`Unlock ${baseUnlock.id} must have a summary`);
    expect(errors).toContain(`Unlock ${baseUnlock.id} must describe its effect`);
    expect(errors).toContain(`Unlock ${baseUnlock.id} must list at least one grant`);
  });

  it('rejects invalid upgrade catalog metadata', () => {
    const errors = validateContent({
      upgrades: [
        baseUpgrade,
        {
          ...baseUpgrade,
          name: 'Duplicate Survey Rig'
        },
        {
          ...baseUpgrade,
          id: 'upgrade_seed_cartographer',
          category: 'thruster',
          iconKey: 'orb',
          effectKind: 'damageBoost',
          name: '',
          summary: '',
          effect: '',
          cost: 0,
          prerequisites: ['upgrade_missing', 'upgrade_seed_cartographer']
        }
      ] as unknown as readonly UpgradeDefinition[]
    });

    expect(errors).toContain(`Duplicate upgrade id: ${baseUpgrade.id}`);
    expect(errors).toContain('Upgrade upgrade_seed_cartographer has invalid category: thruster');
    expect(errors).toContain('Upgrade upgrade_seed_cartographer has invalid icon: orb');
    expect(errors).toContain(
      'Upgrade upgrade_seed_cartographer has invalid effect kind: damageBoost'
    );
    expect(errors).toContain('Upgrade upgrade_seed_cartographer must have a name');
    expect(errors).toContain('Upgrade upgrade_seed_cartographer must have a summary');
    expect(errors).toContain('Upgrade upgrade_seed_cartographer must describe its effect');
    expect(errors).toContain('Upgrade upgrade_seed_cartographer must have positive cost');
    expect(errors).toContain(
      'Upgrade upgrade_seed_cartographer references missing prerequisite: upgrade_missing'
    );
    expect(errors).toContain('Upgrade upgrade_seed_cartographer cannot require itself');
  });

  it('rejects missing sector boss references', () => {
    const errors = validateContent({
      sectors: [
        {
          ...baseSector,
          bossCandidates: ['boss_missing']
        }
      ] as unknown as readonly SectorDefinition[]
    });

    expect(errors).toContain(
      'Sector sector_outer_debris_field references missing boss: boss_missing'
    );
  });

  it('rejects missing sector background references', () => {
    const errors = validateContent({
      sectors: [
        {
          ...baseSector,
          backgroundId: 'background_missing'
        }
      ] as unknown as readonly SectorDefinition[]
    });

    expect(errors).toContain(
      'Sector sector_outer_debris_field references missing background: background_missing'
    );
  });

  it('rejects invalid background strata', () => {
    const baseLayer = baseBackground.layers[0];

    if (!baseLayer) {
      throw new Error('Background fixture is missing a layer.');
    }

    const errors = validateContent({
      backgrounds: [
        {
          ...baseBackground,
          name: '',
          layers: [
            {
              ...baseLayer,
              id: '',
              kind: 'mattePainting',
              alpha: 1.4,
              parallax: 0,
              density: 0,
              priority: 9
            }
          ]
        }
      ] as unknown as readonly BackgroundDefinition[]
    });

    expect(errors).toContain(`Background ${baseBackground.id} must have a name`);
    expect(errors).toContain(`Background ${baseBackground.id} must define at least three strata`);
    expect(errors).toContain(`Background ${baseBackground.id} layer must have an id`);
    expect(errors).toContain(
      `Background ${baseBackground.id} layer  has invalid kind: mattePainting`
    );
    expect(errors).toContain(
      `Background ${baseBackground.id} layer  must have alpha between 0 and 1`
    );
    expect(errors).toContain(`Background ${baseBackground.id} layer  must have positive parallax`);
    expect(errors).toContain(`Background ${baseBackground.id} layer  must have positive density`);
    expect(errors).toContain(`Background ${baseBackground.id} layer  has invalid priority`);
  });

  it('rejects invalid sector objective data', () => {
    const errors = validateContent({
      sectors: [
        {
          ...baseSector,
          objective: {
            ...baseSector.objective,
            kind: 'defeatBoss',
            waveCount: 0,
            spawnsPerWave: -1,
            bossGate: false
          }
        }
      ] as unknown as readonly SectorDefinition[]
    });

    expect(errors).toContain(
      'Sector sector_outer_debris_field objective must have a positive waveCount'
    );
    expect(errors).toContain(
      'Sector sector_outer_debris_field objective must have a positive spawnsPerWave'
    );
    expect(errors).toContain(
      'Sector sector_outer_debris_field defeatBoss objective must enable bossGate'
    );
  });

  it('rejects invalid sector encounter pacing data', () => {
    const errors = validateContent({
      sectors: [
        {
          ...baseSector,
          encounterPacing: {
            waveWindowStartRatio: 0.8,
            waveWindowEndRatio: 0.2,
            spawnSpacing: 0,
            firstSpawnXRatio: 1.2,
            flankXMinRatio: 0.9,
            flankXMaxRatio: 0.1,
            targetYMin: 180,
            targetYMax: 80
          }
        }
      ] as unknown as readonly SectorDefinition[]
    });

    expect(errors).toContain(
      'Sector sector_outer_debris_field encounter pacing must order wave window ratios'
    );
    expect(errors).toContain(
      'Sector sector_outer_debris_field encounter pacing must have positive spawnSpacing'
    );
    expect(errors).toContain(
      'Sector sector_outer_debris_field encounter pacing must have firstSpawnXRatio between 0 and 1'
    );
    expect(errors).toContain(
      'Sector sector_outer_debris_field encounter pacing must order flank x ratios'
    );
    expect(errors).toContain(
      'Sector sector_outer_debris_field encounter pacing must order target y bounds'
    );
  });

  it('rejects duplicate item ids', () => {
    const errors = validateContent({
      items: [baseItem, { ...baseItem, name: 'Duplicate Capacitor' }]
    });

    expect(errors).toContain(`Duplicate item id: ${baseItem.id}`);
  });

  it('rejects missing ship weapon references and invalid ship stats', () => {
    const errors = validateContent({
      ships: [
        {
          ...baseShip,
          weapon: 'weapon_missing',
          stats: {
            ...baseShip.stats,
            maxHull: 0,
            specialInitialCharge: 2,
            bombCapacity: -1
          }
        }
      ] as unknown as readonly ShipDefinition[]
    });

    expect(errors).toContain(`Ship ${baseShip.id} references missing weapon: weapon_missing`);
    expect(errors).toContain(`Ship ${baseShip.id} stats must have positive maxHull`);
    expect(errors).toContain(
      `Ship ${baseShip.id} stats must have specialInitialCharge between 0 and 1`
    );
    expect(errors).toContain(`Ship ${baseShip.id} stats must have non-negative bombCapacity`);
  });

  it('rejects invalid ship appearance definitions', () => {
    const errors = validateContent({
      ships: [
        {
          ...baseShip,
          id: 'ship_drone_chaplain',
          appearance: undefined
        },
        {
          ...baseShip,
          appearance: {
            ...baseShip.appearance,
            silhouette: 'saucer',
            primaryColor: 'cyan',
            hudThemeKey: 'invalid_theme',
            weaponMounts: ['nose', 'invalid_mount']
          }
        }
      ] as unknown as readonly ShipDefinition[]
    });

    expect(errors).toContain('Ship ship_drone_chaplain must define appearance');
    expect(errors).toContain(`Ship ${baseShip.id} has invalid silhouette: saucer`);
    expect(errors).toContain(`Ship ${baseShip.id} has invalid HUD theme: invalid_theme`);
    expect(errors).toContain(`Ship ${baseShip.id} has invalid weapon mount: invalid_mount`);
    expect(errors).toContain(
      `Ship ${baseShip.id} appearance must have primaryColor as a #RRGGBB color`
    );
  });

  it('rejects invalid weapon definitions', () => {
    const errors = validateContent({
      weapons: [
        {
          ...baseWeapon,
          pattern: 'spiral',
          tags: ['not-a-real-tag'],
          damage: 0,
          heatVentPerSecond: 0
        }
      ] as unknown as readonly WeaponDefinition[]
    });

    expect(errors).toContain(`Weapon ${baseWeapon.id} has invalid pattern: spiral`);
    expect(errors).toContain(`Weapon ${baseWeapon.id} has invalid tag: not-a-real-tag`);
    expect(errors).toContain(`Weapon ${baseWeapon.id} must have positive damage`);
    expect(errors).toContain(`Weapon ${baseWeapon.id} must have positive heatVentPerSecond`);
  });

  it('rejects invalid item tags', () => {
    const errors = validateContent({
      items: [
        {
          ...baseItem,
          id: 'item_split_prism',
          tags: ['not-a-real-tag']
        } as unknown as ItemDefinition
      ],
      rewardPools: []
    });

    expect(errors).toContain('Item item_split_prism has invalid tag: not-a-real-tag');
  });

  it('rejects invalid item metadata', () => {
    const errors = validateContent({
      items: [
        {
          ...baseItem,
          metadata: {
            family: 'saucer-build',
            sources: ['starter', 'starter', 'moon'],
            unlockTier: 'vip',
            implementationStatus: 'bridge',
            stacking: 'infinite',
            uiTags: ['laser', 'laser', 'sparkle']
          }
        } as unknown as ItemDefinition,
        {
          ...baseItem,
          id: 'item_vault_parasite',
          rarity: 'prototype',
          metadata: {
            ...baseItem.metadata,
            sources: ['starter'],
            implementationStatus: 'planned',
            implementationNote: ''
          }
        } as unknown as ItemDefinition
      ]
    });

    expect(errors).toContain('Item item_chain_arc_capacitor has invalid family: saucer-build');
    expect(errors).toContain('Item item_chain_arc_capacitor has invalid source: moon');
    expect(errors).toContain('Item item_chain_arc_capacitor has duplicate source: starter');
    expect(errors).toContain('Item item_chain_arc_capacitor has invalid unlock tier: vip');
    expect(errors).toContain('Item item_chain_arc_capacitor must explain bridge implementation');
    expect(errors).toContain('Item item_chain_arc_capacitor has invalid stacking mode: infinite');
    expect(errors).toContain('Item item_chain_arc_capacitor has invalid UI tag: sparkle');
    expect(errors).toContain('Item item_chain_arc_capacitor has duplicate UI tag: laser');
    expect(errors).toContain(
      'Item item_vault_parasite cannot be starter sourced while implementation is planned'
    );
    expect(errors).toContain(
      'Item item_vault_parasite cannot be starter sourced with prototype rarity'
    );
  });

  it('rejects item metadata that drifts from unlock gates and reward pools', () => {
    const errors = validateContent({
      items: [
        {
          ...baseItem,
          metadata: {
            ...baseItem.metadata,
            sources: ['starter', 'unlock'],
            unlockTier: 'unlock'
          }
        }
      ],
      itemUnlocks: {
        item_chain_arc_capacitor: 'unlock_missing' as never
      }
    });

    expect(errors).toContain(
      'Item item_chain_arc_capacitor appears in combat pool without combat source'
    );
    expect(errors).toContain(
      'Item item_chain_arc_capacitor references missing unlock gate: unlock_missing'
    );
  });

  it('rejects missing item hook implementations', () => {
    const errors = validateContent({
      itemHookImplementations: {
        onFire: ITEM_HOOK_IMPLEMENTATIONS.onFire.filter((itemId) => itemId !== 'item_split_prism')
      }
    });

    expect(errors).toContain('Item item_split_prism declares onFire without an implementation');
  });

  it('validates newly registered item hook implementation entries', () => {
    const itemWithFutureHook = {
      ...baseItem,
      hooks: ['onGraze']
    } as unknown as ItemDefinition;
    const items = ITEMS.map((item) => (item.id === baseItem.id ? itemWithFutureHook : item));
    const missingErrors = validateContent({ items });
    const implementedErrors = validateContent({
      items,
      itemHookImplementations: {
        onGraze: [baseItem.id]
      }
    });

    expect(missingErrors).toContain(
      'Item item_chain_arc_capacitor declares onGraze without an implementation'
    );
    expect(implementedErrors).not.toContain(
      'Item item_chain_arc_capacitor declares onGraze without an implementation'
    );
  });

  it('rejects item content that is not present in any reward pool', () => {
    const errors = validateContent({
      rewardPools: [
        {
          id: 'starter',
          itemIds: ITEMS.filter((item) => item.id !== 'item_salvage_dividend_chip').map(
            (item) => item.id
          )
        }
      ]
    });

    expect(errors).toContain(
      'Item item_salvage_dividend_chip must appear in at least one reward pool'
    );
  });

  it('rejects missing reward pool item references', () => {
    const errors = validateContent({
      items: ITEMS,
      rewardPools: [
        {
          id: 'starter',
          itemIds: ['item_missing']
        }
      ] as unknown as readonly RewardPoolDefinition[]
    });

    expect(errors).toContain('Reward pool starter references missing item: item_missing');
  });

  it('rejects invalid item pool weight profiles', () => {
    const baseProfile = ITEM_POOL_WEIGHT_PROFILES[0];

    if (!baseProfile) {
      throw new Error('Expected at least one item pool weight profile.');
    }

    const invalidProfile = {
      ...baseProfile,
      id: 'moon-market',
      label: '',
      poolIds: ['starter', 'missing_pool', 'starter'],
      sourceWeights: {
        starter: 1,
        moon: 2
      },
      rarityWeights: {
        common: 1,
        uncommon: 1,
        rare: 0.5,
        prototype: 0,
        cursed: 0,
        mythic: 1
      },
      familyWeights: {
        'laser-split': 1,
        saucer: 2
      },
      tagWeights: {
        laser: 1,
        sparkle: 2
      }
    } as unknown as ItemPoolWeightProfileDefinition;
    const errors = validateContent({
      itemPoolWeightProfiles: [invalidProfile]
    });

    expect(errors).toContain('Item pool profile moon-market has invalid id');
    expect(errors).toContain('Item pool profile moon-market must have a label');
    expect(errors).toContain(
      'Item pool profile moon-market references missing reward pool: missing_pool'
    );
    expect(errors).toContain('Item pool profile moon-market has duplicate reward pool: starter');
    expect(errors).toContain('Item pool profile moon-market has invalid source weight: moon');
    expect(errors).toContain('Item pool profile moon-market has invalid family weight: saucer');
    expect(errors).toContain('Item pool profile moon-market has invalid tag weight: sparkle');
    expect(errors).toContain('Item pool profile moon-market has invalid rarity weight: mythic');
    expect(errors).toContain('Missing item pool profile: starter');
  });

  it('rejects invalid item family gates', () => {
    const invalidGate = {
      family: 'ghost-family',
      unlockId: 'missing_unlock',
      unlockTiers: ['advanced', 'advanced', 'mythic'],
      label: '',
      summary: '',
      lockedHint: ''
    } as unknown as ItemFamilyGateDefinition;
    const emptyGate = {
      family: 'laser-split',
      unlockId: baseUnlock.id,
      unlockTiers: ['unlock'],
      label: 'Empty Gate',
      summary: 'no matching item tier',
      lockedHint: 'no matching item tier'
    } as ItemFamilyGateDefinition;
    const errors = validateContent({
      itemFamilyGates: [invalidGate, emptyGate]
    });

    expect(errors).toContain('Item family gate ghost-family references invalid family');
    expect(errors).toContain(
      'Item family gate ghost-family references missing unlock: missing_unlock'
    );
    expect(errors).toContain('Item family gate ghost-family must have a label');
    expect(errors).toContain('Item family gate ghost-family must have summary text');
    expect(errors).toContain('Item family gate ghost-family must have locked hint text');
    expect(errors).toContain('Item family gate ghost-family has duplicate unlock tier: advanced');
    expect(errors).toContain('Item family gate ghost-family has invalid unlock tier: mythic');
    expect(errors).toContain('Item family gate ghost-family must match at least one item');
    expect(errors).toContain('Item family gate laser-split must match at least one item');
  });

  it('rejects empty reward pools', () => {
    const errors = validateContent({
      items: ITEMS,
      rewardPools: [
        {
          id: 'combat',
          itemIds: []
        }
      ]
    });

    expect(errors).toContain('Reward pool combat must not be empty');
  });
});
