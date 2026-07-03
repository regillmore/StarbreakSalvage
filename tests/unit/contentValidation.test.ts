import { describe, expect, it } from 'vitest';

import { ACHIEVEMENTS, type AchievementDefinition } from '../../src/content/achievements';
import { BOSSES, type BossDefinition } from '../../src/content/bosses';
import { validateContent } from '../../src/content/contentValidation';
import { FACTIONS, type FactionDefinition } from '../../src/content/factions';
import {
  ITEM_ARCHETYPES,
  ITEMS,
  REWARD_POOLS,
  type ItemDefinition,
  type RewardPoolDefinition
} from '../../src/content/items';
import { SECTORS, type SectorDefinition } from '../../src/content/sectors';
import { SHIPS, type ShipDefinition } from '../../src/content/ships';
import { UNLOCKS, type UnlockDefinition } from '../../src/content/unlocks';
import { WEAPONS, type WeaponDefinition } from '../../src/content/weapons';
import { ITEM_HOOK_IMPLEMENTATIONS } from '../../src/game/ItemHooks';

const baseItem = ITEMS[0] as ItemDefinition;
const baseFaction = FACTIONS[0] as FactionDefinition;
const baseBoss = BOSSES[0] as BossDefinition;
const baseSector = SECTORS[0] as SectorDefinition;
const baseShip = SHIPS[0] as ShipDefinition;
const baseUnlock = UNLOCKS[0] as UnlockDefinition;
const baseWeapon = WEAPONS[0] as WeaponDefinition;
const baseAchievement = ACHIEVEMENTS[0] as AchievementDefinition;

describe('validateContent', () => {
  it('accepts the shipped item and reward content', () => {
    expect(validateContent()).toEqual([]);
  });

  it('ships the phase 2 content breadth targets', () => {
    const rewardedItemIds = new Set(REWARD_POOLS.flatMap((pool) => pool.itemIds));
    const representedArchetypes = ITEM_ARCHETYPES.filter((archetype) =>
      ITEMS.some(
        (item) =>
          rewardedItemIds.has(item.id) && item.tags.some((tag) => archetype.tags.includes(tag))
      )
    );

    expect(ITEMS).toHaveLength(30);
    expect(FACTIONS).toHaveLength(4);
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

  it('rejects missing item hook implementations', () => {
    const errors = validateContent({
      itemHookImplementations: {
        onFire: ITEM_HOOK_IMPLEMENTATIONS.onFire.filter((itemId) => itemId !== 'item_split_prism')
      }
    });

    expect(errors).toContain('Item item_split_prism declares onFire without an implementation');
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
