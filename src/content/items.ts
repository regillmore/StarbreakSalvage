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
  'onBossPhaseChanged',
  'onEnvironmentObjectDestroyed'
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

export const ITEM_POOL_PROFILE_IDS = [
  'starter',
  'starterCore',
  'combat',
  'shop',
  'vault',
  'elite',
  'boss',
  'faction',
  'lunar',
  'route'
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
export type ItemPoolProfileId = (typeof ITEM_POOL_PROFILE_IDS)[number];
export type ItemUnlockTier = (typeof ITEM_UNLOCK_TIERS)[number];
export type ItemImplementationStatus = (typeof ITEM_IMPLEMENTATION_STATUSES)[number];
export type ItemStackingMode = (typeof ITEM_STACKING_MODES)[number];
export type ItemUiTag = (typeof ITEM_UI_TAGS)[number];
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'prototype' | 'cursed';
export type RewardPoolId = 'starter' | 'starterCore' | 'combat' | 'vault';

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
  | 'item_salvage_dividend_chip'
  | 'item_lane_splitter_chisel'
  | 'item_arc_window_invoice'
  | 'item_wake_missile_abacus'
  | 'item_excess_warhead_clause'
  | 'item_sidecar_drone_bay'
  | 'item_signal_clone_stamp'
  | 'item_reactive_plating_grid'
  | 'item_oathbound_deflector'
  | 'item_coupon_cascade_fuse'
  | 'item_boreline_crimper'
  | 'item_market_echo_locator'
  | 'item_faraday_phase_shunt'
  | 'item_relic_ash_compass'
  | 'item_curse_interest_bond'
  | 'item_near_miss_tachometer'
  | 'item_phase_wake_suture'
  | 'item_heat_signature_loop'
  | 'item_prototype_vent_script'
  | 'item_crater_shadow_lens'
  | 'item_regolith_scoop_array'
  | 'item_surface_beacon_drone'
  | 'item_mining_laser_transit'
  | 'item_strata_bore_collimator'
  | 'item_low_orbit_ore_scrip'
  | 'item_gangue_compression_die'
  | 'item_route_ledger_spool'
  | 'item_forkline_dynamo'
  | 'item_ambush_insurance_stamp'
  | 'item_claimant_arc_seal'
  | 'item_exit_toll_transponder'
  | 'item_coastdown_capacitor'
  | 'item_convoy_receipt_printer'
  | 'item_rebound_freight_seal'
  | 'item_phase_breaker_subpoena'
  | 'item_warning_siren_lattice'
  | 'item_capital_wound_ledger'
  | 'item_boss_bounty_stamp'
  | 'item_telegraph_rewrite_quill'
  | 'item_harmonic_fork_loom'
  | 'item_plasma_seed_crucible'
  | 'item_ricochet_branch_coupler'
  | 'item_warhead_echo_chamber'
  | 'item_crossfeed_detonator';

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
  readonly retired?: boolean;
  readonly stacking: ItemStackingMode;
  readonly uiTags: readonly ItemUiTag[];
}

export interface RewardPoolDefinition {
  readonly id: RewardPoolId;
  readonly itemIds: readonly ItemId[];
  readonly bridgeSources?: readonly ItemSource[];
}

export interface ItemPoolWeightProfileDefinition {
  readonly id: ItemPoolProfileId;
  readonly label: string;
  readonly poolIds: readonly RewardPoolId[];
  readonly sourceWeights: Readonly<Partial<Record<ItemSource, number>>>;
  readonly rarityWeights: Readonly<Record<ItemRarity, number>>;
  readonly familyWeights?: Readonly<Partial<Record<ItemFamily, number>>>;
  readonly tagWeights?: Readonly<Partial<Record<ItemTag, number>>>;
  readonly biasWeight?: number;
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
    hooks: ['onProjectileSpawn'],
    effect: 'laser and plasma shots carry a charge that zaps a nearby second target when spent',
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
    effect: 'phase, plasma, and ricochet shots rebound once from an arena sidewall',
    weight: 9,
    metadata: {
      family: 'phase-graze',
      sources: ['combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
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
    effect: 'deploys an uplink pair that copies one reduced primary shot each every third volley',
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
    effect: 'credit pickups add strong charge to the shared haste reservoir',
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
    effect: 'turns existing retaliation shots into amplified cursed overkill, then adds a fan',
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
    effect: 'every fourth volley phases the entire current projectile chain',
    weight: 6,
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
    id: 'item_vault_parasite',
    name: 'Vault Parasite',
    rarity: 'prototype',
    tags: ['curse'],
    hooks: ['onEnemyKilled'],
    effect: 'cursed and overkill executions rupture into salvage and blast damage',
    weight: 3,
    metadata: {
      family: 'curse-relic',
      sources: ['vault'],
      unlockTier: 'advanced',
      implementationStatus: 'live',
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
    effect: 'deploys a mirror follower that fires one reduced rear-cover shot each volley',
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
    effect: 'pulls pickups farther; salvage adds charge to the shared haste reservoir',
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
    effect: 'kills made by drone-fired shots recover one extra salvage; needs a drone launcher',
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
    effect: 'plasma shots gain a wider lens and carry a standard secondary-target arc charge',
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
    effect: 'credit pickups add steady charge to the shared haste reservoir',
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
    effect: 'credit pickups add charge to the shared haste reservoir',
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
    effect:
      'deploys an arc welder follower that fires a charged side shot every third volley; needs an arc source',
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
    hooks: ['onEnemyKilled', 'onEnvironmentObjectDestroyed'],
    effect: 'combat kills and salvage-rich wreckage pay a small salvage dividend',
    weight: 11,
    metadata: {
      family: 'route-economy',
      sources: ['starter', 'combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['route', 'salvage']
    }
  },
  {
    id: 'item_lane_splitter_chisel',
    name: 'Lane Splitter Chisel',
    rarity: 'uncommon',
    tags: ['split', 'laser'],
    hooks: ['onFire'],
    effect: 'every sixth volley carves two long, parallel side-lane laser cuts',
    weight: 8,
    metadata: {
      family: 'laser-split',
      sources: ['starter', 'combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['laser', 'split']
    }
  },
  {
    id: 'item_arc_window_invoice',
    name: 'Arc Window Invoice',
    rarity: 'rare',
    tags: ['arc', 'plasma'],
    hooks: ['onProjectileSpawn'],
    effect: 'eligible shots upgrade their stored arc to a longer-range, harder secondary discharge',
    weight: 6,
    metadata: {
      family: 'laser-split',
      sources: ['combat', 'vault'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['arc', 'plasma']
    }
  },
  {
    id: 'item_wake_missile_abacus',
    name: 'Wake Missile Abacus',
    rarity: 'common',
    tags: ['missile'],
    hooks: ['onFire'],
    effect: 'every fifth volley adds a counted wake missile',
    weight: 11,
    metadata: {
      family: 'missile-overkill',
      sources: ['starter', 'combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['missile']
    }
  },
  {
    id: 'item_excess_warhead_clause',
    name: 'Excess Warhead Clause',
    rarity: 'rare',
    tags: ['overkill', 'missile', 'bomb'],
    hooks: ['onEnemyKilled', 'onBombUsed'],
    effect: 'heavy overkill and bombs push wider blast pressure',
    weight: 6,
    metadata: {
      family: 'missile-overkill',
      sources: ['combat', 'vault'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['overkill', 'bomb']
    }
  },
  {
    id: 'item_sidecar_drone_bay',
    name: 'Sidecar Drone Bay',
    rarity: 'common',
    tags: ['drone'],
    hooks: ['onFire'],
    effect: 'deploys a sidecar follower that fires one reduced flanking shot every fourth volley',
    weight: 11,
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
    id: 'item_signal_clone_stamp',
    name: 'Signal Clone Stamp',
    rarity: 'rare',
    tags: ['drone', 'arc'],
    hooks: ['onFire'],
    effect:
      'deploys a clone follower; every third volley it copies up to four earlier shots at reduced impact',
    weight: 6,
    metadata: {
      family: 'drone-copy',
      sources: ['combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['drone', 'arc']
    }
  },
  {
    id: 'item_reactive_plating_grid',
    name: 'Reactive Plating Grid',
    rarity: 'common',
    tags: ['armor', 'shield'],
    hooks: ['onPlayerHit'],
    effect: 'hull plating spits two small shield shards when hit',
    weight: 11,
    metadata: {
      family: 'shield-revenge',
      sources: ['starter', 'combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['armor', 'shield']
    }
  },
  {
    id: 'item_oathbound_deflector',
    name: 'Oathbound Deflector',
    rarity: 'uncommon',
    tags: ['shield', 'revenge'],
    hooks: ['onBossPhaseChanged'],
    effect: 'boss phase breaks feed the deflector a little special charge',
    weight: 7,
    metadata: {
      family: 'shield-revenge',
      sources: ['combat', 'boss'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['shield', 'boss']
    }
  },
  {
    id: 'item_coupon_cascade_fuse',
    name: 'Coupon Cascade Fuse',
    rarity: 'common',
    tags: ['credit'],
    hooks: ['onShopEntered'],
    effect: 'shops trim prices by one credit while this fuse is installed',
    weight: 11,
    metadata: {
      family: 'credit-shop',
      sources: ['starter', 'combat', 'shop'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      retired: true,
      stacking: 'unique',
      uiTags: ['credit', 'shop']
    }
  },
  {
    id: 'item_boreline_crimper',
    name: 'Boreline Crimper',
    rarity: 'common',
    tags: ['split', 'overkill'],
    hooks: ['onFire'],
    effect:
      'off-axis shots already in the chain trade spread for forward speed, impact, and overkill',
    weight: 11,
    metadata: {
      family: 'missile-overkill',
      sources: ['starter', 'combat', 'shop'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['split', 'overkill']
    }
  },
  {
    id: 'item_market_echo_locator',
    name: 'Market Echo Locator',
    rarity: 'uncommon',
    tags: ['credit', 'magnet'],
    hooks: ['onRewardGenerated'],
    effect: 'shop and repair rewards lean toward credit and salvage-attraction tools',
    weight: 8,
    metadata: {
      family: 'credit-shop',
      sources: ['combat', 'shop'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      retired: true,
      stacking: 'unique',
      uiTags: ['credit', 'shop']
    }
  },
  {
    id: 'item_faraday_phase_shunt',
    name: 'Faraday Phase Shunt',
    rarity: 'uncommon',
    tags: ['phase', 'arc'],
    hooks: ['onProjectileSpawn'],
    effect: 'arc-charged shots already in the chain phase through one target before discharging',
    weight: 8,
    metadata: {
      family: 'phase-graze',
      sources: ['combat', 'shop'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['phase', 'arc']
    }
  },
  {
    id: 'item_relic_ash_compass',
    name: 'Relic Ash Compass',
    rarity: 'rare',
    tags: ['relic', 'phase'],
    hooks: ['onRewardGenerated'],
    effect: 'vault rewards lean more strongly toward relic and phase technology',
    weight: 5,
    metadata: {
      family: 'curse-relic',
      sources: ['vault'],
      unlockTier: 'advanced',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['relic', 'vault']
    }
  },
  {
    id: 'item_curse_interest_bond',
    name: 'Curse Interest Bond',
    rarity: 'cursed',
    tags: ['curse', 'credit'],
    hooks: ['onRouteChosen'],
    effect: 'vault and glitch routes pay more salvage but accrue more curse',
    weight: 4,
    metadata: {
      family: 'curse-relic',
      sources: ['vault', 'route'],
      unlockTier: 'advanced',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['curse', 'route']
    }
  },
  {
    id: 'item_near_miss_tachometer',
    name: 'Near-Miss Tachometer',
    rarity: 'common',
    tags: ['phase'],
    hooks: ['onGraze'],
    effect: 'grazes build a little extra special charge',
    weight: 11,
    metadata: {
      family: 'phase-graze',
      sources: ['starter', 'combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['phase']
    }
  },
  {
    id: 'item_phase_wake_suture',
    name: 'Phase Wake Suture',
    rarity: 'uncommon',
    tags: ['phase', 'ricochet'],
    hooks: ['onGraze'],
    effect: 'phase grazes add charge to the shared haste reservoir',
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
    id: 'item_heat_signature_loop',
    name: 'Heat Signature Loop',
    rarity: 'uncommon',
    tags: ['heat', 'plasma'],
    hooks: ['onProjectileSpawn'],
    effect: 'heat and plasma shots keep a little more signature energy',
    weight: 8,
    metadata: {
      family: 'heat-prototype',
      sources: ['combat'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['heat', 'plasma']
    }
  },
  {
    id: 'item_prototype_vent_script',
    name: 'Prototype Vent Script',
    rarity: 'rare',
    tags: ['heat'],
    hooks: ['onFire'],
    effect:
      'earlier periodic volleys trigger one cycle later and spend 32% heat capacity on a heavy heat shot, or vent exhaust when underfunded',
    weight: 6,
    metadata: {
      family: 'heat-prototype',
      sources: ['combat', 'vault'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['heat', 'prototype']
    }
  },
  {
    id: 'item_crater_shadow_lens',
    name: 'Crater Shadow Lens',
    rarity: 'common',
    tags: ['phase', 'plasma'],
    hooks: ['onSectorStart'],
    effect: 'lunar sector starts grant a small phase charge reading',
    weight: 10,
    metadata: {
      family: 'lunar-surface',
      sources: ['starter', 'combat', 'lunar'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['lunar', 'phase']
    }
  },
  {
    id: 'item_regolith_scoop_array',
    name: 'Regolith Scoop Array',
    rarity: 'uncommon',
    tags: ['scrap', 'magnet'],
    hooks: ['onPickupCollected'],
    effect: 'salvage pickups add strong charge to the shared haste reservoir',
    weight: 8,
    metadata: {
      family: 'lunar-surface',
      sources: ['combat', 'lunar'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['lunar', 'salvage']
    }
  },
  {
    id: 'item_surface_beacon_drone',
    name: 'Surface Beacon Drone',
    rarity: 'rare',
    tags: ['drone', 'phase'],
    hooks: ['onSectorStart'],
    effect: 'lunar entries start with a beacon salvage ping',
    weight: 5,
    metadata: {
      family: 'lunar-surface',
      sources: ['combat', 'lunar'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['lunar', 'drone']
    }
  },
  {
    id: 'item_mining_laser_transit',
    name: 'Mining Laser Transit',
    rarity: 'rare',
    tags: ['laser', 'plasma'],
    hooks: ['onRewardGenerated'],
    effect: 'lunar and vault rewards bias toward laser salvage tools',
    weight: 5,
    metadata: {
      family: 'lunar-surface',
      sources: ['combat', 'vault', 'lunar'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      retired: true,
      stacking: 'unique',
      uiTags: ['lunar', 'laser']
    }
  },
  {
    id: 'item_strata_bore_collimator',
    name: 'Strata-Bore Collimator',
    rarity: 'rare',
    tags: ['laser', 'plasma'],
    hooks: ['onProjectileSpawn'],
    effect:
      'plasma prepared earlier is focused into a beam-laser; other circuit traits deepen its impact',
    weight: 5,
    metadata: {
      family: 'lunar-surface',
      sources: ['combat', 'vault', 'lunar'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['lunar', 'laser']
    }
  },
  {
    id: 'item_low_orbit_ore_scrip',
    name: 'Low-Orbit Ore Scrip',
    rarity: 'common',
    tags: ['credit', 'scrap'],
    hooks: ['onRouteChosen'],
    effect: 'low-risk route choices refund a small ore credit',
    weight: 10,
    metadata: {
      family: 'lunar-surface',
      sources: ['starter', 'combat', 'lunar', 'route'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      retired: true,
      stacking: 'unique',
      uiTags: ['lunar', 'credit']
    }
  },
  {
    id: 'item_gangue_compression_die',
    name: 'Gangue Compression Die',
    rarity: 'common',
    tags: ['plasma', 'split'],
    hooks: ['onFire'],
    effect:
      'lighter shots already in the chain compact into slower, harder, longer-lived plasma slugs',
    weight: 10,
    metadata: {
      family: 'lunar-surface',
      sources: ['starter', 'combat', 'lunar', 'route'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['lunar', 'plasma', 'split']
    }
  },
  {
    id: 'item_route_ledger_spool',
    name: 'Route Ledger Spool',
    rarity: 'common',
    tags: ['credit', 'scrap'],
    hooks: ['onRouteChosen'],
    effect: 'route rewards carry one extra credit in the ledger',
    weight: 11,
    metadata: {
      family: 'route-economy',
      sources: ['starter', 'combat', 'route'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      retired: true,
      stacking: 'unique',
      uiTags: ['route', 'credit']
    }
  },
  {
    id: 'item_forkline_dynamo',
    name: 'Forkline Dynamo',
    rarity: 'common',
    tags: ['arc', 'split'],
    hooks: ['onFire'],
    effect:
      'once the current volley has branches, its two outermost shots carry standard arc charge',
    weight: 11,
    metadata: {
      family: 'laser-split',
      sources: ['starter', 'combat', 'route'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['arc', 'split']
    }
  },
  {
    id: 'item_ambush_insurance_stamp',
    name: 'Ambush Insurance Stamp',
    rarity: 'uncommon',
    tags: ['armor', 'credit'],
    hooks: ['onRouteChosen'],
    effect: 'elite and ambush routes pay a small insurance salvage claim',
    weight: 7,
    metadata: {
      family: 'route-economy',
      sources: ['combat', 'route', 'elite', 'faction'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      retired: true,
      stacking: 'unique',
      uiTags: ['route', 'armor']
    }
  },
  {
    id: 'item_claimant_arc_seal',
    name: 'Claimant Arc Seal',
    rarity: 'uncommon',
    tags: ['arc', 'overkill'],
    hooks: ['onProjectileSpawn'],
    effect: 'upstream overkill shots carry a standard arc claim into a second target',
    weight: 7,
    metadata: {
      family: 'missile-overkill',
      sources: ['combat', 'route', 'elite', 'faction'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['overkill', 'arc']
    }
  },
  {
    id: 'item_exit_toll_transponder',
    name: 'Exit Toll Transponder',
    rarity: 'rare',
    tags: ['credit', 'scrap'],
    hooks: ['onSectorStart'],
    effect: 'later sectors start with a modest toll refund',
    weight: 6,
    metadata: {
      family: 'route-economy',
      sources: ['combat', 'route'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      retired: true,
      stacking: 'unique',
      uiTags: ['route', 'credit']
    }
  },
  {
    id: 'item_coastdown_capacitor',
    name: 'Coastdown Capacitor',
    rarity: 'rare',
    tags: ['credit', 'heat'],
    hooks: ['onPickupCollected'],
    effect:
      'any collected currency banks shared haste; the reservoir stops draining while fire is released',
    weight: 6,
    metadata: {
      family: 'credit-shop',
      sources: ['combat', 'route'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['credit', 'heat']
    }
  },
  {
    id: 'item_convoy_receipt_printer',
    name: 'Convoy Receipt Printer',
    rarity: 'uncommon',
    tags: ['credit', 'drone'],
    hooks: ['onShopEntered'],
    effect: 'rerolled shops print one extra convoy receipt choice',
    weight: 7,
    metadata: {
      family: 'route-economy',
      sources: ['combat', 'route', 'shop'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      retired: true,
      stacking: 'unique',
      uiTags: ['route', 'shop']
    }
  },
  {
    id: 'item_rebound_freight_seal',
    name: 'Rebound Freight Seal',
    rarity: 'uncommon',
    tags: ['ricochet', 'overkill'],
    hooks: ['onProjectileSpawn'],
    effect:
      'shots with prepared wall bounces gain 14% impact per bounce and carry overkill freight',
    weight: 7,
    metadata: {
      family: 'phase-graze',
      sources: ['combat', 'route', 'shop'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['phase', 'overkill']
    }
  },
  {
    id: 'item_phase_breaker_subpoena',
    name: 'Phase Breaker Subpoena',
    rarity: 'rare',
    tags: ['phase', 'overkill'],
    hooks: ['onBossPhaseChanged'],
    effect: 'late boss phases clear pressure and feed special charge',
    weight: 5,
    metadata: {
      family: 'boss-pressure',
      sources: ['combat', 'boss'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      retired: true,
      stacking: 'unique',
      uiTags: ['boss', 'phase']
    }
  },
  {
    id: 'item_warning_siren_lattice',
    name: 'Warning Siren Lattice',
    rarity: 'common',
    tags: ['shield', 'phase'],
    hooks: ['onBossPhaseChanged'],
    effect: 'boss phase warnings linger longer and slow the next volley',
    weight: 10,
    metadata: {
      family: 'boss-pressure',
      sources: ['starter', 'combat', 'boss'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      retired: true,
      stacking: 'unique',
      uiTags: ['boss', 'shield']
    }
  },
  {
    id: 'item_capital_wound_ledger',
    name: 'Capital Wound Ledger',
    rarity: 'prototype',
    tags: ['overkill', 'credit'],
    hooks: ['onBossPhaseChanged'],
    effect: 'boss phase wounds stall attacks and spike special charge',
    weight: 4,
    metadata: {
      family: 'boss-pressure',
      sources: ['combat', 'vault', 'boss'],
      unlockTier: 'advanced',
      implementationStatus: 'live',
      retired: true,
      stacking: 'unique',
      uiTags: ['boss', 'overkill']
    }
  },
  {
    id: 'item_boss_bounty_stamp',
    name: 'Boss Bounty Stamp',
    rarity: 'uncommon',
    tags: ['credit', 'scrap'],
    hooks: ['onEnemyKilled'],
    effect: 'high-pressure kills stamp a little extra salvage',
    weight: 7,
    metadata: {
      family: 'boss-pressure',
      sources: ['combat', 'boss', 'elite'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      retired: true,
      stacking: 'unique',
      uiTags: ['boss', 'salvage']
    }
  },
  {
    id: 'item_telegraph_rewrite_quill',
    name: 'Telegraph Rewrite Quill',
    rarity: 'rare',
    tags: ['ricochet', 'phase'],
    hooks: ['onBossPhaseChanged'],
    effect: 'boss phase scripts gain slower, clearer warning timing',
    weight: 5,
    metadata: {
      family: 'boss-pressure',
      sources: ['combat', 'vault', 'boss'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      retired: true,
      stacking: 'unique',
      uiTags: ['boss', 'phase']
    }
  },
  {
    id: 'item_harmonic_fork_loom',
    name: 'Harmonic Fork Loom',
    rarity: 'common',
    tags: ['laser', 'split'],
    hooks: ['onFire'],
    effect: 'every third volley mirrors the outer shots as crossing harmonic fork lasers',
    weight: 10,
    metadata: {
      family: 'laser-split',
      sources: ['starter', 'combat', 'boss'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['laser', 'split']
    }
  },
  {
    id: 'item_plasma_seed_crucible',
    name: 'Plasma Seed Crucible',
    rarity: 'rare',
    tags: ['plasma', 'heat'],
    hooks: ['onProjectileSpawn'],
    effect: 'tagged circuit shots bloom into larger, hotter plasma bolts',
    weight: 5,
    metadata: {
      family: 'heat-prototype',
      sources: ['combat', 'vault', 'boss'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['plasma', 'heat']
    }
  },
  {
    id: 'item_ricochet_branch_coupler',
    name: 'Ricochet Branch Coupler',
    rarity: 'uncommon',
    tags: ['ricochet', 'split'],
    hooks: ['onProjectileSpawn'],
    effect: 'split and drone branches gain one wall bounce and a longer flight path',
    weight: 7,
    metadata: {
      family: 'phase-graze',
      sources: ['combat', 'elite', 'boss'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['phase', 'split']
    }
  },
  {
    id: 'item_warhead_echo_chamber',
    name: 'Warhead Echo Chamber',
    rarity: 'prototype',
    tags: ['missile', 'overkill'],
    hooks: ['onFire'],
    effect: 'every fourth volley echoes its heaviest shot as a slower overkill warhead',
    weight: 4,
    metadata: {
      family: 'missile-overkill',
      sources: ['combat', 'vault', 'boss'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['missile', 'overkill', 'prototype']
    }
  },
  {
    id: 'item_crossfeed_detonator',
    name: 'Crossfeed Detonator',
    rarity: 'rare',
    tags: ['arc', 'overkill'],
    hooks: ['onProjectileSpawn', 'onEnemyKilled'],
    effect:
      'shots already carrying two circuit traits gain a heavy arc charge and trigger a compact blast on kill',
    weight: 5,
    metadata: {
      family: 'drone-copy',
      sources: ['combat', 'boss'],
      unlockTier: 'baseline',
      implementationStatus: 'live',
      stacking: 'unique',
      uiTags: ['arc', 'overkill']
    }
  }
];

export const ACTIVE_ITEMS: readonly ItemDefinition[] = ITEMS.filter(
  (item) => !item.metadata.retired
);

export const ACTIVE_ITEM_FAMILIES: readonly ItemFamily[] = ITEM_FAMILIES.filter((family) =>
  ACTIVE_ITEMS.some((item) => item.metadata.family === family)
);

export const STARTER_CORE_ITEM_IDS: readonly ItemId[] = [
  'item_split_prism',
  'item_signal_clone_stamp',
  'item_missile_splinter_warrant',
  'item_phase_grazer',
  'item_shield_dynamo',
  'item_coin_operated_cannon',
  'item_salvage_dividend_chip',
  'item_prototype_vent_script',
  'item_cursed_hull_plate'
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
      'item_salvage_dividend_chip',
      'item_lane_splitter_chisel',
      'item_wake_missile_abacus',
      'item_sidecar_drone_bay',
      'item_reactive_plating_grid',
      'item_boreline_crimper',
      'item_near_miss_tachometer',
      'item_crater_shadow_lens',
      'item_gangue_compression_die',
      'item_forkline_dynamo',
      'item_harmonic_fork_loom'
    ]
  },
  {
    id: 'starterCore',
    itemIds: STARTER_CORE_ITEM_IDS,
    bridgeSources: ['starter', 'combat', 'vault']
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
      'item_salvage_dividend_chip',
      'item_lane_splitter_chisel',
      'item_arc_window_invoice',
      'item_wake_missile_abacus',
      'item_excess_warhead_clause',
      'item_sidecar_drone_bay',
      'item_signal_clone_stamp',
      'item_reactive_plating_grid',
      'item_oathbound_deflector',
      'item_boreline_crimper',
      'item_faraday_phase_shunt',
      'item_near_miss_tachometer',
      'item_phase_wake_suture',
      'item_heat_signature_loop',
      'item_prototype_vent_script',
      'item_crater_shadow_lens',
      'item_regolith_scoop_array',
      'item_surface_beacon_drone',
      'item_strata_bore_collimator',
      'item_gangue_compression_die',
      'item_forkline_dynamo',
      'item_claimant_arc_seal',
      'item_coastdown_capacitor',
      'item_rebound_freight_seal',
      'item_harmonic_fork_loom',
      'item_plasma_seed_crucible',
      'item_ricochet_branch_coupler',
      'item_warhead_echo_chamber',
      'item_crossfeed_detonator'
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
      'item_plasma_bloom_filter',
      'item_arc_window_invoice',
      'item_excess_warhead_clause',
      'item_relic_ash_compass',
      'item_curse_interest_bond',
      'item_phase_wake_suture',
      'item_prototype_vent_script',
      'item_strata_bore_collimator',
      'item_warhead_echo_chamber',
      'item_plasma_seed_crucible'
    ]
  }
];

export const ITEM_POOL_WEIGHT_PROFILES: readonly ItemPoolWeightProfileDefinition[] = [
  {
    id: 'starter',
    label: 'Starter',
    poolIds: ['starter'],
    sourceWeights: {
      starter: 3,
      combat: 1
    },
    rarityWeights: {
      common: 1.3,
      uncommon: 0.9,
      rare: 0.35,
      prototype: 0,
      cursed: 0
    },
    familyWeights: {
      'laser-split': 1.15,
      'drone-copy': 1.15,
      'shield-revenge': 1.1,
      'credit-shop': 1.1
    }
  },
  {
    id: 'starterCore',
    label: 'Ignition Core',
    poolIds: ['starterCore'],
    sourceWeights: {
      starter: 1.1,
      combat: 1,
      vault: 1
    },
    rarityWeights: {
      common: 0.9,
      uncommon: 1,
      rare: 1,
      prototype: 0.8,
      cursed: 1
    },
    biasWeight: 20
  },
  {
    id: 'combat',
    label: 'Combat',
    poolIds: ['combat'],
    sourceWeights: {
      combat: 1.6,
      starter: 0.8,
      route: 1.2,
      lunar: 1.2,
      boss: 1.15,
      unlock: 1.25
    },
    rarityWeights: {
      common: 1,
      uncommon: 1,
      rare: 0.75,
      prototype: 0.28,
      cursed: 0
    }
  },
  {
    id: 'shop',
    label: 'Shop',
    poolIds: ['combat'],
    sourceWeights: {
      shop: 4,
      route: 1.8,
      combat: 1,
      starter: 0.8
    },
    rarityWeights: {
      common: 1.25,
      uncommon: 1,
      rare: 0.55,
      prototype: 0.15,
      cursed: 0
    },
    familyWeights: {
      'credit-shop': 3,
      'route-economy': 2,
      'heat-prototype': 1.2,
      'drone-copy': 1.15
    },
    tagWeights: {
      credit: 2,
      magnet: 1.6,
      heat: 1.25,
      drone: 1.15
    }
  },
  {
    id: 'vault',
    label: 'Vault',
    poolIds: ['vault'],
    sourceWeights: {
      vault: 4,
      route: 1.4,
      boss: 1.25,
      unlock: 1.25
    },
    rarityWeights: {
      common: 0.05,
      uncommon: 0.7,
      rare: 1.5,
      prototype: 1.1,
      cursed: 1.25
    },
    familyWeights: {
      'curse-relic': 3,
      'phase-graze': 1.6,
      'heat-prototype': 1.5,
      'missile-overkill': 1.2
    },
    tagWeights: {
      curse: 2,
      relic: 2,
      phase: 1.35,
      ricochet: 1.2
    }
  },
  {
    id: 'elite',
    label: 'Elite',
    poolIds: ['combat', 'vault'],
    sourceWeights: {
      elite: 4,
      boss: 2,
      combat: 1,
      vault: 0.9,
      unlock: 1.2
    },
    rarityWeights: {
      common: 0.4,
      uncommon: 1,
      rare: 1.35,
      prototype: 0.55,
      cursed: 0.2
    },
    familyWeights: {
      'missile-overkill': 1.8,
      'drone-copy': 1.5,
      'phase-graze': 1.4
    },
    tagWeights: {
      overkill: 1.8,
      missile: 1.5,
      drone: 1.4
    }
  },
  {
    id: 'boss',
    label: 'Boss',
    poolIds: ['combat', 'vault'],
    sourceWeights: {
      boss: 4,
      elite: 1.8,
      vault: 1.5,
      combat: 1,
      unlock: 1.2
    },
    rarityWeights: {
      common: 0.2,
      uncommon: 0.8,
      rare: 1.6,
      prototype: 0.9,
      cursed: 0.4
    },
    familyWeights: {
      'laser-split': 1.6,
      'heat-prototype': 1.5,
      'shield-revenge': 1.4,
      'missile-overkill': 1.4,
      'phase-graze': 1.3
    },
    tagWeights: {
      shield: 1.3,
      overkill: 1.25,
      phase: 1.2
    }
  },
  {
    id: 'faction',
    label: 'Faction',
    poolIds: ['combat', 'vault'],
    sourceWeights: {
      faction: 4,
      elite: 2,
      combat: 1,
      vault: 0.8,
      unlock: 1.15
    },
    rarityWeights: {
      common: 0.6,
      uncommon: 1,
      rare: 1.25,
      prototype: 0.45,
      cursed: 0.45
    },
    familyWeights: {
      'drone-copy': 1.35,
      'laser-split': 1.3,
      'missile-overkill': 1.25,
      'phase-graze': 1.25
    }
  },
  {
    id: 'lunar',
    label: 'Lunar',
    poolIds: ['combat', 'vault'],
    sourceWeights: {
      lunar: 4,
      route: 1.5,
      combat: 1,
      vault: 0.8
    },
    rarityWeights: {
      common: 0.9,
      uncommon: 1.1,
      rare: 1.15,
      prototype: 0.45,
      cursed: 0.2
    },
    familyWeights: {
      'lunar-surface': 4,
      'route-economy': 1.4,
      'laser-split': 1.25
    },
    tagWeights: {
      scrap: 1.6,
      laser: 1.4,
      phase: 1.2
    }
  },
  {
    id: 'route',
    label: 'Route',
    poolIds: ['combat', 'vault'],
    sourceWeights: {
      route: 4,
      shop: 2,
      combat: 1,
      vault: 0.9
    },
    rarityWeights: {
      common: 1.2,
      uncommon: 1,
      rare: 0.75,
      prototype: 0.25,
      cursed: 0.25
    },
    familyWeights: {
      'route-economy': 4,
      'credit-shop': 2,
      'curse-relic': 1.25
    },
    tagWeights: {
      credit: 1.8,
      scrap: 1.6,
      curse: 1.2
    }
  }
];

export function getItemById(id: ItemId, items: readonly ItemDefinition[] = ITEMS): ItemDefinition {
  const item = items.find((candidate) => candidate.id === id);

  if (!item) {
    throw new Error(`Unknown item id: ${id}`);
  }

  return item;
}
