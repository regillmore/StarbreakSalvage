export const ITEM_TAGS = [
  'armor',
  'arc',
  'bomb',
  'credit',
  'curse',
  'drone',
  'heat',
  'laser',
  'magnet',
  'missile',
  'overkill',
  'phase',
  'plasma',
  'ricochet',
  'revenge',
  'scrap',
  'shield',
  'split'
] as const;

export const ITEM_HOOKS = [
  'onFire',
  'onProjectileSpawn',
  'onEnemyKilled',
  'onPlayerHit',
  'onPickupCollected'
] as const;

export type ItemTag = (typeof ITEM_TAGS)[number];
export type ItemHook = (typeof ITEM_HOOKS)[number];
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'prototype' | 'cursed';

export type ItemId =
  | 'item_chain_arc_capacitor'
  | 'item_split_prism'
  | 'item_ricochet_license'
  | 'item_drone_uplink'
  | 'item_shield_dynamo'
  | 'item_coin_operated_cannon'
  | 'item_overkill_ledger'
  | 'item_heat_sink_saint'
  | 'item_cursed_hull_plate'
  | 'item_bomb_refund_actuator'
  | 'item_phase_grazer'
  | 'item_vault_parasite'
  | 'item_mirror_turret'
  | 'item_salvage_magnet'
  | 'item_revenge_beam';

export interface ItemDefinition {
  readonly id: ItemId;
  readonly name: string;
  readonly rarity: ItemRarity;
  readonly tags: readonly ItemTag[];
  readonly hooks: readonly ItemHook[];
  readonly effect: string;
  readonly weight: number;
}

export interface RewardPoolDefinition {
  readonly id: 'starter' | 'combat' | 'vault';
  readonly itemIds: readonly ItemId[];
}

export const ITEMS: readonly ItemDefinition[] = [
  {
    id: 'item_chain_arc_capacitor',
    name: 'Chain Arc Capacitor',
    rarity: 'rare',
    tags: ['laser', 'plasma'],
    hooks: ['onProjectileSpawn', 'onEnemyKilled'],
    effect: 'laser and plasma shots can arc to nearby enemies',
    weight: 7
  },
  {
    id: 'item_split_prism',
    name: 'Split Prism',
    rarity: 'uncommon',
    tags: ['split'],
    hooks: ['onFire'],
    effect: 'primary shots split into weaker side shots',
    weight: 11
  },
  {
    id: 'item_ricochet_license',
    name: 'Ricochet License',
    rarity: 'uncommon',
    tags: ['ricochet', 'plasma'],
    hooks: ['onProjectileSpawn'],
    effect: 'eligible shots live longer for edge bounces later',
    weight: 9
  },
  {
    id: 'item_drone_uplink',
    name: 'Drone Uplink',
    rarity: 'rare',
    tags: ['drone'],
    hooks: ['onFire'],
    effect: 'drones copy a reduced primary shot every third volley',
    weight: 8
  },
  {
    id: 'item_shield_dynamo',
    name: 'Shield Dynamo',
    rarity: 'uncommon',
    tags: ['shield'],
    hooks: ['onPlayerHit'],
    effect: 'shield damage primes retaliation effects',
    weight: 10
  },
  {
    id: 'item_coin_operated_cannon',
    name: 'Coin-Operated Cannon',
    rarity: 'uncommon',
    tags: ['credit'],
    hooks: ['onPickupCollected'],
    effect: 'collecting credits briefly improves fire rate',
    weight: 10
  },
  {
    id: 'item_overkill_ledger',
    name: 'Overkill Ledger',
    rarity: 'rare',
    tags: ['overkill', 'scrap'],
    hooks: ['onEnemyKilled'],
    effect: 'excess damage converts into bonus salvage',
    weight: 7
  },
  {
    id: 'item_heat_sink_saint',
    name: 'Heat Sink Saint',
    rarity: 'uncommon',
    tags: ['heat'],
    hooks: ['onFire'],
    effect: 'keeps prototype fire cadence stable',
    weight: 8
  },
  {
    id: 'item_cursed_hull_plate',
    name: 'Cursed Hull Plate',
    rarity: 'cursed',
    tags: ['curse', 'armor'],
    hooks: ['onPlayerHit'],
    effect: 'lowers comfort but makes revenge builds louder',
    weight: 4
  },
  {
    id: 'item_bomb_refund_actuator',
    name: 'Bomb Refund Actuator',
    rarity: 'rare',
    tags: ['bomb'],
    hooks: ['onEnemyKilled'],
    effect: 'explosive overkill can send a secondary blast forward',
    weight: 6
  },
  {
    id: 'item_phase_grazer',
    name: 'Phase Grazer',
    rarity: 'rare',
    tags: ['phase'],
    hooks: ['onFire'],
    effect: 'phase-biased volleys add a tiny homing shard later',
    weight: 6
  },
  {
    id: 'item_vault_parasite',
    name: 'Vault Parasite',
    rarity: 'prototype',
    tags: ['curse'],
    hooks: ['onEnemyKilled'],
    effect: 'cursed rewards bias toward stronger salvage payouts',
    weight: 3
  },
  {
    id: 'item_mirror_turret',
    name: 'Mirror Turret',
    rarity: 'uncommon',
    tags: ['drone'],
    hooks: ['onFire'],
    effect: 'adds a rear ghost shot at reduced damage',
    weight: 10
  },
  {
    id: 'item_salvage_magnet',
    name: 'Salvage Magnet',
    rarity: 'common',
    tags: ['scrap', 'credit', 'magnet'],
    hooks: ['onPickupCollected'],
    effect: 'pickup attraction range is increased',
    weight: 14
  },
  {
    id: 'item_revenge_beam',
    name: 'Revenge Beam',
    rarity: 'rare',
    tags: ['revenge', 'shield'],
    hooks: ['onPlayerHit'],
    effect: 'taking shield damage fires a bright retaliation beam',
    weight: 7
  }
];

export const REWARD_POOLS: readonly RewardPoolDefinition[] = [
  {
    id: 'starter',
    itemIds: [
      'item_salvage_magnet',
      'item_split_prism',
      'item_chain_arc_capacitor',
      'item_drone_uplink',
      'item_mirror_turret',
      'item_overkill_ledger',
      'item_shield_dynamo',
      'item_revenge_beam',
      'item_coin_operated_cannon'
    ]
  },
  {
    id: 'combat',
    itemIds: [
      'item_split_prism',
      'item_chain_arc_capacitor',
      'item_ricochet_license',
      'item_drone_uplink',
      'item_overkill_ledger',
      'item_bomb_refund_actuator',
      'item_heat_sink_saint',
      'item_phase_grazer',
      'item_salvage_magnet',
      'item_coin_operated_cannon'
    ]
  },
  {
    id: 'vault',
    itemIds: [
      'item_vault_parasite',
      'item_cursed_hull_plate',
      'item_revenge_beam',
      'item_overkill_ledger',
      'item_phase_grazer'
    ]
  }
];

export function getItemById(id: ItemId, items: readonly ItemDefinition[] = ITEMS): ItemDefinition {
  const item = items.find((candidate) => candidate.id === id);

  if (!item) {
    throw new Error(`Unknown item id: ${id}`);
  }

  return item;
}
