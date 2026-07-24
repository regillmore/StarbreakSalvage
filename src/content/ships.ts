export type ShipId =
  | 'ship_debt_runner'
  | 'ship_drone_chaplain'
  | 'ship_missile_accountant'
  | 'ship_phase_courier'
  | 'ship_shield_bruiser'
  | 'ship_scrap_monk'
  | 'ship_corporate_test_pilot'
  | 'ship_relic_thief';

export type WeaponId =
  | 'weapon_light_needle_laser'
  | 'weapon_pulse_cannon'
  | 'weapon_dumbfire_missile_rack'
  | 'weapon_needle_splitter'
  | 'weapon_short_range_spread'
  | 'weapon_kinetic_popgun'
  | 'weapon_prototype_beam'
  | 'weapon_basic_blaster';

export type ShipTag =
  | 'armor'
  | 'credit'
  | 'curse'
  | 'drone'
  | 'graze'
  | 'heat'
  | 'missile'
  | 'overkill'
  | 'phase'
  | 'prototype'
  | 'relic'
  | 'scrap'
  | 'shield'
  | 'speed';

export const SHIP_SILHOUETTES = [
  'needle',
  'chapel',
  'ordnance',
  'phase',
  'bulwark',
  'monk',
  'prototype',
  'relic'
] as const;

export const SHIP_WEAPON_MOUNT_HINTS = [
  'nose',
  'wing',
  'pod',
  'drone',
  'broadside',
  'beam',
  'orbit'
] as const;

export const SHIP_HUD_THEME_KEYS = [
  'redline',
  'parish',
  'ledger',
  'phase',
  'aegis',
  'scrap',
  'warranty',
  'relic'
] as const;

export type ShipSilhouette = (typeof SHIP_SILHOUETTES)[number];
export type ShipWeaponMountHint = (typeof SHIP_WEAPON_MOUNT_HINTS)[number];
export type ShipHudThemeKey = (typeof SHIP_HUD_THEME_KEYS)[number];

export interface ShipAppearance {
  readonly silhouette: ShipSilhouette;
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly trimColor: string;
  readonly engineColor: string;
  readonly cockpitAccent: string;
  readonly weaponMounts: readonly ShipWeaponMountHint[];
  readonly hudThemeKey: ShipHudThemeKey;
}

export interface ShipStats {
  readonly maxHull: number;
  readonly speed: number;
  readonly hitRadius: number;
  readonly pickupPullRange: number;
  readonly specialChargeMultiplier: number;
  readonly specialInitialCharge: number;
  readonly bombCapacity: number;
  readonly startingCredits: number;
  readonly startingSalvage: number;
}

export interface ShipDefinition {
  readonly id: ShipId;
  readonly name: string;
  readonly tags: readonly ShipTag[];
  readonly weapon: WeaponId;
  readonly weaponName: string;
  readonly appearance: ShipAppearance;
  readonly stats: ShipStats;
  readonly perk: string;
  readonly drawback: string;
  readonly contractSummary: string;
  readonly sponsors: readonly string[];
  readonly itemBias: readonly string[];
}

export const SHIPS: readonly ShipDefinition[] = [
  {
    id: 'ship_debt_runner',
    name: 'Debt Runner',
    tags: ['credit', 'speed'],
    weapon: 'weapon_light_needle_laser',
    weaponName: 'Light Needle Laser',
    appearance: {
      silhouette: 'needle',
      primaryColor: '#59f2ff',
      secondaryColor: '#12324a',
      trimColor: '#f8fbff',
      engineColor: '#ffd166',
      cockpitAccent: '#ff6bd6',
      weaponMounts: ['nose', 'wing'],
      hudThemeKey: 'redline'
    },
    stats: {
      maxHull: 2,
      speed: 430,
      hitRadius: 16,
      pickupPullRange: 520,
      specialChargeMultiplier: 1.05,
      specialInitialCharge: 1,
      bombCapacity: 2,
      startingCredits: 22,
      startingSalvage: 0
    },
    perk: 'credits are pulled from farther away',
    drawback: 'elite bounty ambush can replace normal elite encounters',
    contractSummary: 'Fast economy hull with thin armor and aggressive collection magnets.',
    sponsors: ['Redline Credit Union', 'Receivables Afterburner Group'],
    itemBias: ['credit', 'laser', 'shop']
  },
  {
    id: 'ship_drone_chaplain',
    name: 'Drone Chaplain',
    tags: ['drone'],
    weapon: 'weapon_pulse_cannon',
    weaponName: 'Pulse Cannon',
    appearance: {
      silhouette: 'chapel',
      primaryColor: '#9fd7ff',
      secondaryColor: '#2d2857',
      trimColor: '#fff2b8',
      engineColor: '#6fffd0',
      cockpitAccent: '#f6d96f',
      weaponMounts: ['drone', 'orbit'],
      hudThemeKey: 'parish'
    },
    stats: {
      maxHull: 3,
      speed: 340,
      hitRadius: 18,
      pickupPullRange: 280,
      specialChargeMultiplier: 1,
      specialInitialCharge: 1,
      bombCapacity: 2,
      startingCredits: 16,
      startingSalvage: 0
    },
    perk: 'two micro-drones alternate reduced primary copies from formation',
    drawback: 'its command grid consumes power and mass that direct weapons could use',
    contractSummary: 'Support hull escorted by two visible micro-drones with alternating fire.',
    sponsors: ['Choir of Useful Debris', 'Orbital Parish Mutual'],
    itemBias: ['drone', 'orbital', 'support']
  },
  {
    id: 'ship_missile_accountant',
    name: 'Missile Accountant',
    tags: ['missile', 'overkill'],
    weapon: 'weapon_dumbfire_missile_rack',
    weaponName: 'Dumbfire Missile Rack',
    appearance: {
      silhouette: 'ordnance',
      primaryColor: '#d6e1ea',
      secondaryColor: '#74323c',
      trimColor: '#ffc15a',
      engineColor: '#ff8a3d',
      cockpitAccent: '#f8fbff',
      weaponMounts: ['pod', 'broadside'],
      hudThemeKey: 'ledger'
    },
    stats: {
      maxHull: 4,
      speed: 300,
      hitRadius: 20,
      pickupPullRange: 240,
      specialChargeMultiplier: 0.95,
      specialInitialCharge: 1,
      bombCapacity: 3,
      startingCredits: 14,
      startingSalvage: 1
    },
    perk: 'overkill damage can produce bonus scrap',
    drawback: 'slower reload and lower agility',
    contractSummary: 'Armored burst hull that turns overkill into future paperwork.',
    sponsors: ['Explosive Receivables', 'Ledger Detonation Office'],
    itemBias: ['missile', 'overkill', 'scrap']
  },
  {
    id: 'ship_phase_courier',
    name: 'Phase Courier',
    tags: ['phase', 'graze'],
    weapon: 'weapon_needle_splitter',
    weaponName: 'Needle Splitter',
    appearance: {
      silhouette: 'phase',
      primaryColor: '#7cf7ff',
      secondaryColor: '#2b5cff',
      trimColor: '#f8fbff',
      engineColor: '#baff6f',
      cockpitAccent: '#ff8cff',
      weaponMounts: ['nose', 'wing'],
      hudThemeKey: 'phase'
    },
    stats: {
      maxHull: 2,
      speed: 455,
      hitRadius: 15,
      pickupPullRange: 300,
      specialChargeMultiplier: 1.45,
      specialInitialCharge: 0.75,
      bombCapacity: 1,
      startingCredits: 15,
      startingSalvage: 0
    },
    perk: 'grazing charges special ability',
    drawback: 'lower max hull',
    contractSummary: 'High mobility hull that gets paid for almost being hit.',
    sponsors: ['Blink Freight Associates', 'Close Call Express'],
    itemBias: ['phase', 'graze', 'split']
  },
  {
    id: 'ship_shield_bruiser',
    name: 'Shield Bruiser',
    tags: ['shield', 'armor'],
    weapon: 'weapon_short_range_spread',
    weaponName: 'Short-Range Spread Cannon',
    appearance: {
      silhouette: 'bulwark',
      primaryColor: '#9adfa7',
      secondaryColor: '#243b3a',
      trimColor: '#e8fff0',
      engineColor: '#ffd166',
      cockpitAccent: '#7cf7ff',
      weaponMounts: ['broadside', 'wing'],
      hudThemeKey: 'aegis'
    },
    stats: {
      maxHull: 5,
      speed: 280,
      hitRadius: 22,
      pickupPullRange: 220,
      specialChargeMultiplier: 0.9,
      specialInitialCharge: 1,
      bombCapacity: 3,
      startingCredits: 12,
      startingSalvage: 1
    },
    perk: 'strong affinity for proactive shield-retaliation circuits',
    drawback: 'large hitbox and slow movement',
    contractSummary: 'Tank hull that turns firing cadence into armored counter-volley pressure.',
    sponsors: ['Impact Compliance LLC', 'Aegis Claims Department'],
    itemBias: ['shield', 'armor', 'revenge']
  },
  {
    id: 'ship_scrap_monk',
    name: 'Scrap Monk',
    tags: ['scrap'],
    weapon: 'weapon_kinetic_popgun',
    weaponName: 'Kinetic Popgun',
    appearance: {
      silhouette: 'monk',
      primaryColor: '#d9c66f',
      secondaryColor: '#3b3840',
      trimColor: '#f8fbff',
      engineColor: '#8affc1',
      cockpitAccent: '#ffb36f',
      weaponMounts: ['nose', 'orbit'],
      hudThemeKey: 'scrap'
    },
    stats: {
      maxHull: 3,
      speed: 360,
      hitRadius: 18,
      pickupPullRange: 340,
      specialChargeMultiplier: 1.1,
      specialInitialCharge: 0.9,
      bombCapacity: 2,
      startingCredits: 10,
      startingSalvage: 2
    },
    perk: 'destroyed enemy bullets become scrap motes',
    drawback: 'shops offer fewer items unless purity is broken',
    contractSummary: 'Minimalist hull that turns restraint into salvage conversion.',
    sponsors: ['Order of Clean Ledgers', 'Ascetic Salvage Trust'],
    itemBias: ['scrap', 'magnet', 'purity']
  },
  {
    id: 'ship_corporate_test_pilot',
    name: 'Corporate Test Pilot',
    tags: ['prototype', 'heat'],
    weapon: 'weapon_prototype_beam',
    weaponName: 'Prototype Beam',
    appearance: {
      silhouette: 'prototype',
      primaryColor: '#f8fbff',
      secondaryColor: '#2434a3',
      trimColor: '#ffef5f',
      engineColor: '#ff6b3d',
      cockpitAccent: '#62ffcb',
      weaponMounts: ['beam', 'pod'],
      hudThemeKey: 'warranty'
    },
    stats: {
      maxHull: 3,
      speed: 370,
      hitRadius: 18,
      pickupPullRange: 260,
      specialChargeMultiplier: 1.2,
      specialInitialCharge: 1,
      bombCapacity: 2,
      startingCredits: 18,
      startingSalvage: 0
    },
    perk: 'starts with a rare experimental item',
    drawback: 'random malfunction each sector',
    contractSummary: 'Prototype hull with excellent power and suspicious warranty language.',
    sponsors: ['Warranty Void Labs', 'Forward-Looking Liability'],
    itemBias: ['prototype', 'heat', 'curse']
  },
  {
    id: 'ship_relic_thief',
    name: 'Relic Thief',
    tags: ['relic', 'curse'],
    weapon: 'weapon_basic_blaster',
    weaponName: 'Basic Blaster',
    appearance: {
      silhouette: 'relic',
      primaryColor: '#62d986',
      secondaryColor: '#26213d',
      trimColor: '#f5dc7a',
      engineColor: '#6fc8ff',
      cockpitAccent: '#ff6bd6',
      weaponMounts: ['nose', 'orbit'],
      hudThemeKey: 'relic'
    },
    stats: {
      maxHull: 2,
      speed: 350,
      hitRadius: 17,
      pickupPullRange: 260,
      specialChargeMultiplier: 1.15,
      specialInitialCharge: 0.85,
      bombCapacity: 1,
      startingCredits: 12,
      startingSalvage: 1
    },
    perk: 'detects hidden relic rooms',
    drawback: 'lower max hull and higher curse chance',
    contractSummary: 'Artifact hunter hull that knows which vaults are supposed to stay closed.',
    sponsors: ['Unmarked Vault Services', 'Antiquities Recovery Office'],
    itemBias: ['relic', 'curse', 'vault']
  }
];
