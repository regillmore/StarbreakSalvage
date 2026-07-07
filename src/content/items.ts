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
  'relic',
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
  'onPickupCollected',
  'onGraze',
  'onSpecialUsed',
  'onBombUsed',
  'onSectorStart',
  'onRouteChosen',
  'onShopEntered',
  'onRewardGenerated',
  'onBossPhaseChanged'
] as const;

export const ITEM_FAMILIES = [
  'laser-split',
  'missile-overkill',
  'drone-copy',
  'shield-revenge',
  'credit-shop',
  'curse-relic',
  'phase-graze',
  'heat-prototype',
  'lunar-surface',
  'route-economy',
  'boss-pressure'
] as const;

export const ITEM_SOURCES = [
  'starter',
  'combat',
  'shop',
  'vault',
  'elite',
  'boss',
  'faction',
  'lunar',
  'route',
  'unlock'
] as const;

export const ITEM_UNLOCK_TIERS = ['baseline', 'advanced', 'unlock'] as const;
export const ITEM_IMPLEMENTATION_STATUSES = ['live', 'bridge', 'planned'] as const;
export const ITEM_STACKING_MODES = ['unique', 'stackable'] as const;

export const ITEM_UI_TAGS = [
  'arc',
  'armor',
  'bomb',
  'boss',
  'credit',
  'curse',
  'drone',
  'heat',
  'laser',
  'lunar',
  'magnet',
  'missile',
  'overkill',
  'phase',
  'plasma',
  'prototype',
  'relic',
  'revenge',
  'route',
  'salvage',
  'shield',
  'shop',
  'split',
  'vault'
] as const;

export type ItemTag = (typeof ITEM_TAGS)[number];
export type ItemHook = (typeof ITEM_HOOKS)[number];
export type ItemFamily = (typeof ITEM_FAMILIES)[number];
export type ItemSource = (typeof ITEM_SOURCES)[number];
export type ItemUnlockTier = (typeof ITEM_UNLOCK_TIERS)[number];
export type ItemImplementationStatus = (typeof ITEM_IMPLEMENTATION_STATUSES)[number];
export type ItemStackingMode = (typeof ITEM_STACKING_MODES)[number];
export type ItemUiTag = (typeof ITEM_UI_TAGS)[number];
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
  | 'item_revenge_beam'
  | 'item_laser_tax_stamp'
  | 'item_missile_splinter_warrant'
  | 'item_scrap_saints_relay'
  | 'item_plasma_lens_array'
  | 'item_shield_revenge_contract'
  | 'item_credit_reroute_fuse'
  | 'item_phase_anchor_spool'
  | 'item_curse_eater_gasket'
  | 'item_bombardier_tithe'
  | 'item_magnetized_tithe_box'
  | 'item_overheat_oracle'
  | 'item_relic_index_codex'
  | 'item_arc_welder_drone'
  | 'item_plasma_bloom_filter'
  | 'item_salvage_dividend_chip';

export interface ItemDefinition {
  readonly id: ItemId;
  readonly name: string;
  readonly rarity: ItemRarity;
  readonly tags: readonly ItemTag[];
  readonly hooks: readonly ItemHook[];
  readonly effect: string;
  readonly weight: number;
  readonly metadata: ItemMetadata;
}

export interface ItemMetadata {
  readonly family: ItemFamily;
  readonly sources: readonly ItemSource[];
  readonly unlockTier: ItemUnlockTier;
  readonly implementationStatus: ItemImplementationStatus;
  readonly implementationNote?: string;
  readonly stacking: ItemStackingMode;
  readonly uiTags: readonly ItemUiTag[];
}

export interface RewardPoolDefinition {
  readonly id: 'starter' | 'combat' | 'vault';
  readonly itemIds: readonly ItemId[];
}

export interface ItemArchetypeDefinition {
  readonly id:
    | 'laser-split'
    | 'missile-overkill'
    | 'drone-copy'
    | 'shield-revenge'
    | 'credit-shop'
    | 'curse-relic'
    | 'phase-graze'
    | 'heat-prototype';
  readonly label: string;
  readonly tags: readonly ItemTag[];
}

export const ITEM_ARCHETYPES: readonly ItemArchetypeDefinition[] = [
  {
    id: 'laser-split',
    label: 'Laser/Split',
    tags: ['laser', 'split', 'arc']
  },
  {
    id: 'missile-overkill',
    label: 'Missile/Overkill',
    tags: ['missile', 'overkill', 'bomb']
  },
  {
    id: 'drone-copy',
    label: 'Drone/Copy',
    tags: ['drone', 'arc']
  },
  {
    id: 'shield-revenge',
    label: 'Shield/Revenge',
    tags: ['shield', 'revenge']
  },
  {
    id: 'credit-shop',
    label: 'Credit/Shop',
    tags: ['credit', 'magnet']
  },
  {
    id: 'curse-relic',
    label: 'Curse/Relic',
    tags: ['curse', 'relic']
  },
  {
    id: 'phase-graze',
    label: 'Phase/Graze',
    tags: ['phase', 'ricochet']
  },
  {
    id: 'heat-prototype',
    label: 'Heat/Prototype',
    tags: ['heat', 'plasma']
  }
];

export const ITEMS: readonly ItemDefinition[] = [
  {
    id: 'item_chain_arc_capacitor',
    name: 'Chain Arc Capacitor',
    rarity: 'rare',
    tags: ['laser', 'plasma'],
    hooks: ['onProjectileSpawn', 'onEnemyKilled'],
    effect: 'laser and plasma shots can arc to nearby enemies',
    weight: 7,
    metadata: {
      family: 'laser-split',
      sources: ['starter', 'combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['laser', 'arc']
    }
  },
  {
    id: 'item_split_prism',
    name: 'Split Prism',
    rarity: 'uncommon',
    tags: ['split'],
    hooks: ['onFire'],
    effect: 'primary shots split into weaker side shots',
    weight: 11,
    metadata: {
      family: 'laser-split',
      sources: ['starter', 'combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['split']
    }
  },
  {
    id: 'item_ricochet_license',
    name: 'Ricochet License',
    rarity: 'uncommon',
    tags: ['ricochet', 'plasma'],
    hooks: ['onProjectileSpawn'],
    effect: 'eligible shots live longer for edge bounces later',
    weight: 9,
    metadata: {
      family: 'phase-graze',
      sources: ['combat'],
      unlockTier: 'baseline',
      implementationStatus: 'bridge',
      implementationNote: 'Extends projectile life now; true edge-bounce behavior is future work.',
      stacking: 'unique',
      uiTags: ['plasma', 'phase']
    }
  },
  {
    id: 'item_drone_uplink',
    name: 'Drone Uplink',
    rarity: 'rare',
    tags: ['drone'],
    hooks: ['onFire'],
    effect: 'drones copy a reduced primary shot every third volley',
    weight: 8,
    metadata: {
      family: 'drone-copy',
      sources: ['starter', 'combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['drone']
    }
  },
  {
    id: 'item_shield_dynamo',
    name: 'Shield Dynamo',
    rarity: 'uncommon',
    tags: ['shield'],
    hooks: ['onPlayerHit'],
    effect: 'shield damage primes retaliation effects',
    weight: 10,
    metadata: {
      family: 'shield-revenge',
      sources: ['starter'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['shield']
    }
  },
  {
    id: 'item_coin_operated_cannon',
    name: 'Coin-Operated Cannon',
    rarity: 'uncommon',
    tags: ['credit'],
    hooks: ['onPickupCollected'],
    effect: 'collecting credits briefly improves fire rate',
    weight: 10,
    metadata: {
      family: 'credit-shop',
      sources: ['starter', 'combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['credit', 'shop']
    }
  },
  {
    id: 'item_overkill_ledger',
    name: 'Overkill Ledger',
    rarity: 'rare',
    tags: ['overkill', 'scrap'],
    hooks: ['onEnemyKilled'],
    effect: 'excess damage converts into bonus salvage',
    weight: 7,
    metadata: {
      family: 'missile-overkill',
      sources: ['starter', 'combat', 'vault'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['overkill', 'salvage']
    }
  },
  {
    id: 'item_heat_sink_saint',
    name: 'Heat Sink Saint',
    rarity: 'uncommon',
    tags: ['heat'],
    hooks: ['onFire'],
    effect: 'keeps prototype fire cadence stable',
    weight: 8,
    metadata: {
      family: 'heat-prototype',
      sources: ['combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['heat', 'prototype']
    }
  },
  {
    id: 'item_cursed_hull_plate',
    name: 'Cursed Hull Plate',
    rarity: 'cursed',
    tags: ['curse', 'armor'],
    hooks: ['onPlayerHit'],
    effect: 'lowers comfort but makes revenge builds louder',
    weight: 4,
    metadata: {
      family: 'curse-relic',
      sources: ['vault'],
      unlockTier: 'advanced',
      implementationStatus: 'bridge',
      implementationNote: 'Has curse retaliation now; explicit downside tuning is future work.',
      stacking: 'unique',
      uiTags: ['curse', 'armor']
    }
  },
  {
    id: 'item_bomb_refund_actuator',
    name: 'Bomb Refund Actuator',
    rarity: 'rare',
    tags: ['bomb'],
    hooks: ['onEnemyKilled'],
    effect: 'explosive overkill can send a secondary blast forward',
    weight: 6,
    metadata: {
      family: 'missile-overkill',
      sources: ['combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['bomb', 'overkill']
    }
  },
  {
    id: 'item_phase_grazer',
    name: 'Phase Grazer',
    rarity: 'rare',
    tags: ['phase'],
    hooks: ['onFire'],
    effect: 'phase-biased volleys add a tiny homing shard later',
    weight: 6,
    metadata: {
      family: 'phase-graze',
      sources: ['combat', 'vault'],
      unlockTier: 'baseline',
      implementationStatus: 'bridge',
      implementationNote: 'Adds phase shots now; a dedicated graze hook should carry more of the identity.',
      stacking: 'unique',
      uiTags: ['phase']
    }
  },
  {
    id: 'item_vault_parasite',
    name: 'Vault Parasite',
    rarity: 'prototype',
    tags: ['curse'],
    hooks: ['onEnemyKilled'],
    effect: 'cursed rewards bias toward stronger salvage payouts',
    weight: 3,
    metadata: {
      family: 'curse-relic',
      sources: ['vault'],
      unlockTier: 'advanced',
      implementationStatus: 'bridge',
      implementationNote: 'Pays salvage now; vault/source reward weighting is future work.',
      stacking: 'unique',
      uiTags: ['vault', 'curse']
    }
  },
  {
    id: 'item_mirror_turret',
    name: 'Mirror Turret',
    rarity: 'uncommon',
    tags: ['drone'],
    hooks: ['onFire'],
    effect: 'adds a rear ghost shot at reduced damage',
    weight: 10,
    metadata: {
      family: 'drone-copy',
      sources: ['starter'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['drone']
    }
  },
  {
    id: 'item_salvage_magnet',
    name: 'Salvage Magnet',
    rarity: 'common',
    tags: ['scrap', 'credit', 'magnet'],
    hooks: ['onPickupCollected'],
    effect: 'pickup attraction range is increased',
    weight: 14,
    metadata: {
      family: 'credit-shop',
      sources: ['starter', 'combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['magnet', 'salvage']
    }
  },
  {
    id: 'item_revenge_beam',
    name: 'Revenge Beam',
    rarity: 'rare',
    tags: ['revenge', 'shield'],
    hooks: ['onPlayerHit'],
    effect: 'taking shield damage fires a bright retaliation beam',
    weight: 7,
    metadata: {
      family: 'shield-revenge',
      sources: ['starter', 'vault'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['shield', 'revenge']
    }
  },
  {
    id: 'item_laser_tax_stamp',
    name: 'Laser Tax Stamp',
    rarity: 'uncommon',
    tags: ['laser', 'credit'],
    hooks: ['onEnemyKilled'],
    effect: 'laser kills issue bonus salvage receipts',
    weight: 8,
    metadata: {
      family: 'laser-split',
      sources: ['starter', 'combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['laser', 'credit']
    }
  },
  {
    id: 'item_missile_splinter_warrant',
    name: 'Missile Splinter Warrant',
    rarity: 'uncommon',
    tags: ['missile', 'split'],
    hooks: ['onFire'],
    effect: 'every fourth volley adds two lighter missile shards',
    weight: 8,
    metadata: {
      family: 'missile-overkill',
      sources: ['starter', 'combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['missile', 'split']
    }
  },
  {
    id: 'item_scrap_saints_relay',
    name: 'Scrap Saints Relay',
    rarity: 'common',
    tags: ['scrap', 'drone'],
    hooks: ['onEnemyKilled'],
    effect: 'drone-marked kills recover extra salvage',
    weight: 9,
    metadata: {
      family: 'drone-copy',
      sources: ['starter', 'combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['drone', 'salvage']
    }
  },
  {
    id: 'item_plasma_lens_array',
    name: 'Plasma Lens Array',
    rarity: 'uncommon',
    tags: ['plasma', 'arc'],
    hooks: ['onProjectileSpawn'],
    effect: 'plasma shots gain a wider charged lens',
    weight: 8,
    metadata: {
      family: 'laser-split',
      sources: ['starter', 'combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['plasma', 'arc']
    }
  },
  {
    id: 'item_shield_revenge_contract',
    name: 'Shield Revenge Contract',
    rarity: 'rare',
    tags: ['shield', 'revenge'],
    hooks: ['onPlayerHit'],
    effect: 'shield damage launches paired retaliation slugs',
    weight: 6,
    metadata: {
      family: 'shield-revenge',
      sources: ['combat', 'vault'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['shield', 'revenge']
    }
  },
  {
    id: 'item_credit_reroute_fuse',
    name: 'Credit Reroute Fuse',
    rarity: 'common',
    tags: ['credit', 'heat'],
    hooks: ['onPickupCollected'],
    effect: 'credit pickups briefly vent weapon cadence',
    weight: 10,
    metadata: {
      family: 'credit-shop',
      sources: ['starter', 'combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['credit', 'heat']
    }
  },
  {
    id: 'item_phase_anchor_spool',
    name: 'Phase Anchor Spool',
    rarity: 'uncommon',
    tags: ['phase', 'ricochet'],
    hooks: ['onProjectileSpawn'],
    effect: 'phase shots persist longer and drift through lanes',
    weight: 7,
    metadata: {
      family: 'phase-graze',
      sources: ['combat', 'vault'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['phase']
    }
  },
  {
    id: 'item_curse_eater_gasket',
    name: 'Curse-Eater Gasket',
    rarity: 'cursed',
    tags: ['curse', 'armor'],
    hooks: ['onPlayerHit'],
    effect: 'taking hits while cursed kicks out a hungry shard',
    weight: 4,
    metadata: {
      family: 'curse-relic',
      sources: ['vault'],
      unlockTier: 'advanced',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['curse', 'armor']
    }
  },
  {
    id: 'item_bombardier_tithe',
    name: 'Bombardier Tithe',
    rarity: 'rare',
    tags: ['bomb', 'missile'],
    hooks: ['onEnemyKilled'],
    effect: 'missile and bomb kills spread a modest blast',
    weight: 6,
    metadata: {
      family: 'missile-overkill',
      sources: ['combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['bomb', 'missile']
    }
  },
  {
    id: 'item_magnetized_tithe_box',
    name: 'Magnetized Tithe Box',
    rarity: 'common',
    tags: ['magnet', 'credit'],
    hooks: ['onPickupCollected'],
    effect: 'credit collection sharpens the next burst',
    weight: 10,
    metadata: {
      family: 'credit-shop',
      sources: ['starter', 'combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['magnet', 'credit']
    }
  },
  {
    id: 'item_overheat_oracle',
    name: 'Overheat Oracle',
    rarity: 'prototype',
    tags: ['heat', 'phase'],
    hooks: ['onFire'],
    effect: 'every fifth volley vents a phase omen shot',
    weight: 5,
    metadata: {
      family: 'heat-prototype',
      sources: ['combat', 'vault', 'unlock'],
      unlockTier: 'unlock',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['heat', 'prototype']
    }
  },
  {
    id: 'item_relic_index_codex',
    name: 'Relic Index Codex',
    rarity: 'prototype',
    tags: ['relic', 'curse'],
    hooks: ['onEnemyKilled'],
    effect: 'cursed or phase kills recover indexed relic scrap',
    weight: 4,
    metadata: {
      family: 'curse-relic',
      sources: ['vault'],
      unlockTier: 'advanced',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['relic', 'curse']
    }
  },
  {
    id: 'item_arc_welder_drone',
    name: 'Arc Welder Drone',
    rarity: 'uncommon',
    tags: ['arc', 'drone'],
    hooks: ['onFire'],
    effect: 'arc builds gain a side drone weld every third volley',
    weight: 8,
    metadata: {
      family: 'drone-copy',
      sources: ['starter', 'combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['drone', 'arc']
    }
  },
  {
    id: 'item_plasma_bloom_filter',
    name: 'Plasma Bloom Filter',
    rarity: 'rare',
    tags: ['plasma', 'phase'],
    hooks: ['onProjectileSpawn'],
    effect: 'phase and plasma shots bloom into heavier bolts',
    weight: 6,
    metadata: {
      family: 'heat-prototype',
      sources: ['combat', 'vault'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['plasma', 'phase']
    }
  },
  {
    id: 'item_salvage_dividend_chip',
    name: 'Salvage Dividend Chip',
    rarity: 'common',
    tags: ['scrap', 'credit'],
    hooks: ['onEnemyKilled'],
    effect: 'combat kills pay a small salvage dividend',
    weight: 11,
    metadata: {
      family: 'route-economy',
      sources: ['starter', 'combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['route', 'salvage']
    }
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
      'item_coin_operated_cannon',
      'item_laser_tax_stamp',
      'item_missile_splinter_warrant',
      'item_scrap_saints_relay',
      'item_plasma_lens_array',
      'item_credit_reroute_fuse',
      'item_magnetized_tithe_box',
      'item_arc_welder_drone',
      'item_salvage_dividend_chip'
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
      'item_coin_operated_cannon',
      'item_laser_tax_stamp',
      'item_missile_splinter_warrant',
      'item_scrap_saints_relay',
      'item_plasma_lens_array',
      'item_shield_revenge_contract',
      'item_credit_reroute_fuse',
      'item_phase_anchor_spool',
      'item_bombardier_tithe',
      'item_magnetized_tithe_box',
      'item_overheat_oracle',
      'item_arc_welder_drone',
      'item_plasma_bloom_filter',
      'item_salvage_dividend_chip'
    ]
  },
  {
    id: 'vault',
    itemIds: [
      'item_vault_parasite',
      'item_cursed_hull_plate',
      'item_revenge_beam',
      'item_overkill_ledger',
      'item_phase_grazer',
      'item_shield_revenge_contract',
      'item_phase_anchor_spool',
      'item_curse_eater_gasket',
      'item_overheat_oracle',
      'item_relic_index_codex',
      'item_plasma_bloom_filter'
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
