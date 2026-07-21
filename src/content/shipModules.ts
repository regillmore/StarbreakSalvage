import type { ShipId, WeaponId } from './ships';
import { WEAPONS } from './weapons';

export const SHIP_MODULE_SLOTS = [
  'primary',
  'secondary',
  'defense',
  'engine',
  'utility',
  'drone',
  'experimental'
] as const;

export const SHIP_MODULE_MOUNT_SIZES = ['light', 'medium', 'heavy'] as const;

export const SHIP_UPGRADE_SOCKET_TYPES = [
  'weapon',
  'ordnance',
  'defense',
  'drive',
  'utility',
  'drone',
  'experimental',
  'flex'
] as const;

export const SHIPCRAFT_TAGS = [
  'armor',
  'beam',
  'bomb',
  'command',
  'cooling',
  'credit',
  'curse',
  'defense',
  'drone',
  'economy',
  'engine',
  'experimental',
  'graze',
  'heat',
  'heat-routing',
  'heavy',
  'kinetic',
  'laser',
  'light',
  'medium',
  'missile',
  'mobility',
  'ordnance',
  'overkill',
  'phase',
  'plasma',
  'precision',
  'prototype',
  'relic',
  'salvage',
  'shield',
  'speed',
  'support',
  'utility',
  'weapon'
] as const;

export type ShipModuleSlot = (typeof SHIP_MODULE_SLOTS)[number];
export type ShipModuleMountSize = (typeof SHIP_MODULE_MOUNT_SIZES)[number];
export type ShipcraftTag = (typeof SHIPCRAFT_TAGS)[number];
export type ShipUpgradeSocketType = (typeof SHIP_UPGRADE_SOCKET_TYPES)[number];

export type ShipFrameId =
  | 'frame_redline_needle'
  | 'frame_parish_chapel'
  | 'frame_ledger_ordnance'
  | 'frame_blink_courier'
  | 'frame_aegis_bulwark'
  | 'frame_ascetic_scamp'
  | 'frame_warranty_prototype'
  | 'frame_unmarked_reliquary';

export type ShipModuleId =
  | 'module_primary_light_needle_laser'
  | 'module_primary_pulse_cannon'
  | 'module_primary_dumbfire_missile_rack'
  | 'module_primary_needle_splitter'
  | 'module_primary_short_range_spread'
  | 'module_primary_kinetic_popgun'
  | 'module_primary_prototype_beam'
  | 'module_primary_basic_blaster'
  | 'module_secondary_bomb_cassette'
  | 'module_defense_shield_mesh'
  | 'module_defense_armor_ledger'
  | 'module_engine_vector_drive'
  | 'module_engine_torque_array'
  | 'module_utility_credit_tractor'
  | 'module_utility_salvage_lattice'
  | 'module_utility_relic_scanner'
  | 'module_drone_micro_choir'
  | 'module_experimental_phase_router'
  | 'module_experimental_prototype_shunt'
  | 'module_experimental_flux_mirror'
  | 'module_experimental_curse_sink';

export interface ShipHardpointDefinition {
  readonly id: string;
  readonly label: string;
  readonly slot: ShipModuleSlot;
  readonly size: ShipModuleMountSize;
  readonly required: boolean;
  readonly requiredModuleTags: readonly ShipcraftTag[];
  readonly excludedModuleTags: readonly ShipcraftTag[];
}

export interface ShipFrameStats {
  readonly reactorOutput: number;
  readonly mass: number;
  readonly massCapacity: number;
  readonly cooling: number;
  readonly heatRouting: number;
  readonly armor: number;
  readonly shields: number;
  readonly mobility: number;
  readonly cargo: number;
  readonly commandCapacity: number;
}

export interface ShipLoadoutMount {
  readonly hardpointId: string;
  readonly moduleId: ShipModuleId;
}

export interface ShipFrameDefinition {
  readonly id: ShipFrameId;
  readonly name: string;
  readonly role: string;
  readonly legacyShipId: ShipId;
  readonly tags: readonly ShipcraftTag[];
  readonly hardpoints: readonly ShipHardpointDefinition[];
  readonly stats: ShipFrameStats;
  readonly startingLoadout: readonly ShipLoadoutMount[];
  readonly presentation: {
    readonly manufacturer: string;
    readonly summary: string;
    readonly accentColor: string;
  };
}

export interface ShipModuleCompatibility {
  readonly allowedFrameIds: readonly ShipFrameId[];
  readonly blockedFrameIds: readonly ShipFrameId[];
  readonly requiredFrameTags: readonly ShipcraftTag[];
  readonly excludedFrameTags: readonly ShipcraftTag[];
  readonly requiredLoadoutTags: readonly ShipcraftTag[];
  readonly excludedLoadoutTags: readonly ShipcraftTag[];
}

export type ShipModuleBehavior =
  | {
      readonly kind: 'weaponAdapter';
      readonly weaponId: WeaponId;
    }
  | {
      readonly kind: 'legacySystemAdapter';
      readonly adapterId: string;
    };

export interface ShipModuleDefinition {
  readonly id: ShipModuleId;
  readonly slot: ShipModuleSlot;
  readonly size: ShipModuleMountSize;
  readonly powerDraw: number;
  readonly heat: number;
  readonly mass: number;
  readonly commandDraw: number;
  readonly tags: readonly ShipcraftTag[];
  readonly upgradeSockets: readonly ShipUpgradeSocketType[];
  readonly unique: boolean;
  readonly compatibility: ShipModuleCompatibility;
  readonly behavior: ShipModuleBehavior;
  readonly presentation: {
    readonly name: string;
    readonly shortName: string;
    readonly summary: string;
    readonly icon: string;
    readonly accentColor: string;
  };
}

function createUpgradeSockets(slot: ShipModuleSlot): readonly ShipUpgradeSocketType[] {
  const nativeType: Exclude<ShipUpgradeSocketType, 'flex'> =
    slot === 'primary'
      ? 'weapon'
      : slot === 'secondary'
        ? 'ordnance'
        : slot === 'engine'
          ? 'drive'
          : slot;
  return [nativeType, 'flex'];
}

const NONE: readonly never[] = [];

function hardpoint(
  id: string,
  label: string,
  slot: ShipModuleSlot,
  size: ShipModuleMountSize,
  required: boolean,
  requiredModuleTags: readonly ShipcraftTag[] = NONE,
  excludedModuleTags: readonly ShipcraftTag[] = NONE
): ShipHardpointDefinition {
  return {
    id,
    label,
    slot,
    size,
    required,
    requiredModuleTags,
    excludedModuleTags
  };
}

export const SHIP_FRAMES: readonly ShipFrameDefinition[] = [
  {
    id: 'frame_redline_needle',
    name: 'Redline Needle',
    role: 'fast collector',
    legacyShipId: 'ship_debt_runner',
    tags: ['light', 'economy', 'precision', 'speed'],
    hardpoints: [
      hardpoint('nose-primary', 'Nose primary', 'primary', 'light', true),
      hardpoint('spine-engine', 'Spine engine', 'engine', 'light', true),
      hardpoint('ledger-utility', 'Ledger utility', 'utility', 'light', false)
    ],
    stats: {
      reactorOutput: 11,
      mass: 8,
      massCapacity: 18,
      cooling: 7,
      heatRouting: 3,
      armor: 1,
      shields: 1,
      mobility: 10,
      cargo: 5,
      commandCapacity: 1
    },
    startingLoadout: [
      { hardpointId: 'nose-primary', moduleId: 'module_primary_light_needle_laser' },
      { hardpointId: 'spine-engine', moduleId: 'module_engine_vector_drive' },
      { hardpointId: 'ledger-utility', moduleId: 'module_utility_credit_tractor' }
    ],
    presentation: {
      manufacturer: 'Redline Credit Union',
      summary: 'Thin pressure hull with generous thrust and a compact collection bus.',
      accentColor: '#59f2ff'
    }
  },
  {
    id: 'frame_parish_chapel',
    name: 'Parish Chapel',
    role: 'drone command carrier',
    legacyShipId: 'ship_drone_chaplain',
    tags: ['medium', 'drone', 'support'],
    hardpoints: [
      hardpoint('choir-primary', 'Choir primary', 'primary', 'medium', true),
      hardpoint('parish-engine', 'Parish engine', 'engine', 'medium', true),
      hardpoint('orbit-command', 'Orbit command', 'drone', 'medium', true, ['drone']),
      hardpoint('vestry-utility', 'Vestry utility', 'utility', 'light', false)
    ],
    stats: {
      reactorOutput: 14,
      mass: 12,
      massCapacity: 25,
      cooling: 8,
      heatRouting: 4,
      armor: 2,
      shields: 2,
      mobility: 6,
      cargo: 4,
      commandCapacity: 4
    },
    startingLoadout: [
      { hardpointId: 'choir-primary', moduleId: 'module_primary_pulse_cannon' },
      { hardpointId: 'parish-engine', moduleId: 'module_engine_vector_drive' },
      { hardpointId: 'orbit-command', moduleId: 'module_drone_micro_choir' }
    ],
    presentation: {
      manufacturer: 'Orbital Parish Mutual',
      summary: 'A command-rich chapel hull built around an independently powered drone rail.',
      accentColor: '#9fd7ff'
    }
  },
  {
    id: 'frame_ledger_ordnance',
    name: 'Ledger Ordnance',
    role: 'armored burst platform',
    legacyShipId: 'ship_missile_accountant',
    tags: ['heavy', 'ordnance', 'armor', 'overkill'],
    hardpoints: [
      hardpoint('pod-primary', 'Pod primary', 'primary', 'heavy', true),
      hardpoint('ventral-secondary', 'Ventral secondary', 'secondary', 'medium', true),
      hardpoint('claims-defense', 'Claims defense', 'defense', 'heavy', false),
      hardpoint('torque-engine', 'Torque engine', 'engine', 'heavy', true),
      hardpoint('audit-utility', 'Audit utility', 'utility', 'light', false)
    ],
    stats: {
      reactorOutput: 15,
      mass: 18,
      massCapacity: 39,
      cooling: 7,
      heatRouting: 5,
      armor: 4,
      shields: 1,
      mobility: 4,
      cargo: 8,
      commandCapacity: 2
    },
    startingLoadout: [
      { hardpointId: 'pod-primary', moduleId: 'module_primary_dumbfire_missile_rack' },
      { hardpointId: 'ventral-secondary', moduleId: 'module_secondary_bomb_cassette' },
      { hardpointId: 'torque-engine', moduleId: 'module_engine_torque_array' }
    ],
    presentation: {
      manufacturer: 'Ledger Detonation Office',
      summary:
        'A high-mass weapons bus with deep cargo and deliberately mediocre turning authority.',
      accentColor: '#ffc15a'
    }
  },
  {
    id: 'frame_blink_courier',
    name: 'Blink Courier',
    role: 'phase skirmisher',
    legacyShipId: 'ship_phase_courier',
    tags: ['light', 'phase', 'precision', 'graze'],
    hardpoints: [
      hardpoint('needle-primary', 'Needle primary', 'primary', 'light', true),
      hardpoint('blink-engine', 'Blink engine', 'engine', 'light', true),
      hardpoint('phase-experimental', 'Phase experimental', 'experimental', 'medium', true, [
        'phase'
      ]),
      hardpoint('courier-utility', 'Courier utility', 'utility', 'light', false)
    ],
    stats: {
      reactorOutput: 13,
      mass: 7,
      massCapacity: 18,
      cooling: 8,
      heatRouting: 6,
      armor: 1,
      shields: 2,
      mobility: 10,
      cargo: 2,
      commandCapacity: 2
    },
    startingLoadout: [
      { hardpointId: 'needle-primary', moduleId: 'module_primary_needle_splitter' },
      { hardpointId: 'blink-engine', moduleId: 'module_engine_vector_drive' },
      { hardpointId: 'phase-experimental', moduleId: 'module_experimental_phase_router' }
    ],
    presentation: {
      manufacturer: 'Blink Freight Associates',
      summary: 'A tiny hull with more heat routing than armor and a dedicated phase bus.',
      accentColor: '#7cf7ff'
    }
  },
  {
    id: 'frame_aegis_bulwark',
    name: 'Aegis Bulwark',
    role: 'shield rammer',
    legacyShipId: 'ship_shield_bruiser',
    tags: ['heavy', 'armor', 'shield', 'defense'],
    hardpoints: [
      hardpoint('broadside-primary', 'Broadside primary', 'primary', 'heavy', true),
      hardpoint('aegis-defense', 'Aegis defense', 'defense', 'heavy', true, ['shield']),
      hardpoint('bulwark-engine', 'Bulwark engine', 'engine', 'heavy', true),
      hardpoint('counter-utility', 'Counter utility', 'utility', 'medium', false)
    ],
    stats: {
      reactorOutput: 14,
      mass: 20,
      massCapacity: 38,
      cooling: 8,
      heatRouting: 5,
      armor: 5,
      shields: 6,
      mobility: 3,
      cargo: 5,
      commandCapacity: 2
    },
    startingLoadout: [
      { hardpointId: 'broadside-primary', moduleId: 'module_primary_short_range_spread' },
      { hardpointId: 'aegis-defense', moduleId: 'module_defense_shield_mesh' },
      { hardpointId: 'bulwark-engine', moduleId: 'module_engine_torque_array' }
    ],
    presentation: {
      manufacturer: 'Aegis Claims Department',
      summary: 'A broad collision profile wrapped around shield routing and redundant plating.',
      accentColor: '#9adfa7'
    }
  },
  {
    id: 'frame_ascetic_scamp',
    name: 'Ascetic Scamp',
    role: 'salvage converter',
    legacyShipId: 'ship_scrap_monk',
    tags: ['medium', 'salvage', 'utility'],
    hardpoints: [
      hardpoint('vow-primary', 'Vow primary', 'primary', 'medium', true),
      hardpoint('simple-engine', 'Simple engine', 'engine', 'medium', true),
      hardpoint('salvage-utility', 'Salvage utility', 'utility', 'medium', true, ['salvage']),
      hardpoint('silent-drone', 'Silent drone', 'drone', 'light', false)
    ],
    stats: {
      reactorOutput: 11,
      mass: 11,
      massCapacity: 23,
      cooling: 9,
      heatRouting: 3,
      armor: 2,
      shields: 1,
      mobility: 7,
      cargo: 8,
      commandCapacity: 2
    },
    startingLoadout: [
      { hardpointId: 'vow-primary', moduleId: 'module_primary_kinetic_popgun' },
      { hardpointId: 'simple-engine', moduleId: 'module_engine_vector_drive' },
      { hardpointId: 'salvage-utility', moduleId: 'module_utility_salvage_lattice' }
    ],
    presentation: {
      manufacturer: 'Ascetic Salvage Trust',
      summary: 'An efficient converter hull with low reactor demand and unusually deep cargo.',
      accentColor: '#d9c66f'
    }
  },
  {
    id: 'frame_warranty_prototype',
    name: 'Warranty Prototype',
    role: 'experimental power testbed',
    legacyShipId: 'ship_corporate_test_pilot',
    tags: ['medium', 'prototype', 'heat', 'heat-routing'],
    hardpoints: [
      hardpoint('test-primary', 'Test primary', 'primary', 'medium', true),
      hardpoint('warranty-engine', 'Warranty engine', 'engine', 'medium', true),
      hardpoint('experiment-a', 'Experiment A', 'experimental', 'medium', true, ['prototype']),
      hardpoint('experiment-b', 'Experiment B', 'experimental', 'medium', false),
      hardpoint('telemetry-utility', 'Telemetry utility', 'utility', 'light', false)
    ],
    stats: {
      reactorOutput: 19,
      mass: 10,
      massCapacity: 27,
      cooling: 8,
      heatRouting: 8,
      armor: 2,
      shields: 2,
      mobility: 8,
      cargo: 3,
      commandCapacity: 3
    },
    startingLoadout: [
      { hardpointId: 'test-primary', moduleId: 'module_primary_prototype_beam' },
      { hardpointId: 'warranty-engine', moduleId: 'module_engine_vector_drive' },
      { hardpointId: 'experiment-a', moduleId: 'module_experimental_prototype_shunt' }
    ],
    presentation: {
      manufacturer: 'Warranty Void Labs',
      summary:
        'An overprovisioned reactor with two experiment buses and insufficient legal review.',
      accentColor: '#ffef5f'
    }
  },
  {
    id: 'frame_unmarked_reliquary',
    name: 'Unmarked Reliquary',
    role: 'artifact infiltrator',
    legacyShipId: 'ship_relic_thief',
    tags: ['light', 'relic', 'curse', 'utility'],
    hardpoints: [
      hardpoint('plain-primary', 'Plain primary', 'primary', 'light', true),
      hardpoint('quiet-engine', 'Quiet engine', 'engine', 'light', true),
      hardpoint('vault-utility', 'Vault utility', 'utility', 'light', true, ['relic']),
      hardpoint('sealed-experimental', 'Sealed experimental', 'experimental', 'medium', true, [
        'relic'
      ])
    ],
    stats: {
      reactorOutput: 12,
      mass: 9,
      massCapacity: 22,
      cooling: 7,
      heatRouting: 5,
      armor: 1,
      shields: 3,
      mobility: 7,
      cargo: 6,
      commandCapacity: 3
    },
    startingLoadout: [
      { hardpointId: 'plain-primary', moduleId: 'module_primary_basic_blaster' },
      { hardpointId: 'quiet-engine', moduleId: 'module_engine_vector_drive' },
      { hardpointId: 'vault-utility', moduleId: 'module_utility_relic_scanner' },
      { hardpointId: 'sealed-experimental', moduleId: 'module_experimental_curse_sink' }
    ],
    presentation: {
      manufacturer: 'Unmarked Vault Services',
      summary: 'A quiet relic carrier with sealed routing and more cargo than its registry admits.',
      accentColor: '#62d986'
    }
  }
];

interface WeaponModuleProfile {
  readonly id: ShipModuleId;
  readonly weaponId: WeaponId;
  readonly size: ShipModuleMountSize;
  readonly powerDraw: number;
  readonly heat: number;
  readonly mass: number;
  readonly tags: readonly ShipcraftTag[];
  readonly compatibility?: Partial<ShipModuleCompatibility>;
  readonly accentColor: string;
}

const WEAPON_MODULE_PROFILES: readonly WeaponModuleProfile[] = [
  {
    id: 'module_primary_light_needle_laser',
    weaponId: 'weapon_light_needle_laser',
    size: 'light',
    powerDraw: 3,
    heat: 2,
    mass: 2,
    tags: ['weapon', 'laser', 'precision'],
    accentColor: '#59f2ff'
  },
  {
    id: 'module_primary_pulse_cannon',
    weaponId: 'weapon_pulse_cannon',
    size: 'medium',
    powerDraw: 4,
    heat: 3,
    mass: 3,
    tags: ['weapon', 'plasma', 'support'],
    accentColor: '#9fd7ff'
  },
  {
    id: 'module_primary_dumbfire_missile_rack',
    weaponId: 'weapon_dumbfire_missile_rack',
    size: 'heavy',
    powerDraw: 6,
    heat: 4,
    mass: 6,
    tags: ['weapon', 'missile', 'ordnance', 'overkill'],
    compatibility: { requiredFrameTags: ['ordnance'] },
    accentColor: '#ffc15a'
  },
  {
    id: 'module_primary_needle_splitter',
    weaponId: 'weapon_needle_splitter',
    size: 'light',
    powerDraw: 4,
    heat: 4,
    mass: 2,
    tags: ['weapon', 'laser', 'precision', 'phase'],
    compatibility: {
      allowedFrameIds: ['frame_redline_needle', 'frame_blink_courier', 'frame_warranty_prototype']
    },
    accentColor: '#7cf7ff'
  },
  {
    id: 'module_primary_short_range_spread',
    weaponId: 'weapon_short_range_spread',
    size: 'heavy',
    powerDraw: 5,
    heat: 4,
    mass: 5,
    tags: ['weapon', 'plasma', 'defense', 'heavy'],
    compatibility: {
      allowedFrameIds: ['frame_ledger_ordnance', 'frame_aegis_bulwark']
    },
    accentColor: '#9adfa7'
  },
  {
    id: 'module_primary_kinetic_popgun',
    weaponId: 'weapon_kinetic_popgun',
    size: 'light',
    powerDraw: 2,
    heat: 2,
    mass: 2,
    tags: ['weapon', 'kinetic', 'salvage'],
    accentColor: '#d9c66f'
  },
  {
    id: 'module_primary_prototype_beam',
    weaponId: 'weapon_prototype_beam',
    size: 'medium',
    powerDraw: 7,
    heat: 8,
    mass: 4,
    tags: ['weapon', 'beam', 'laser', 'prototype', 'heat'],
    compatibility: { requiredFrameTags: ['prototype'] },
    accentColor: '#ffef5f'
  },
  {
    id: 'module_primary_basic_blaster',
    weaponId: 'weapon_basic_blaster',
    size: 'light',
    powerDraw: 3,
    heat: 2,
    mass: 3,
    tags: ['weapon', 'plasma', 'utility'],
    accentColor: '#62d986'
  }
];

function createCompatibility(
  overrides: Partial<ShipModuleCompatibility> = {}
): ShipModuleCompatibility {
  return {
    allowedFrameIds: overrides.allowedFrameIds ?? NONE,
    blockedFrameIds: overrides.blockedFrameIds ?? NONE,
    requiredFrameTags: overrides.requiredFrameTags ?? NONE,
    excludedFrameTags: overrides.excludedFrameTags ?? NONE,
    requiredLoadoutTags: overrides.requiredLoadoutTags ?? NONE,
    excludedLoadoutTags: overrides.excludedLoadoutTags ?? NONE
  };
}

function createWeaponModule(profile: WeaponModuleProfile): ShipModuleDefinition {
  const weapon = WEAPONS.find((candidate) => candidate.id === profile.weaponId);

  if (!weapon) {
    throw new Error(`Ship module adapter references missing weapon: ${profile.weaponId}`);
  }

  return {
    id: profile.id,
    slot: 'primary',
    size: profile.size,
    powerDraw: profile.powerDraw,
    heat: profile.heat,
    mass: profile.mass,
    commandDraw: 0,
    tags: profile.tags,
    upgradeSockets: createUpgradeSockets('primary'),
    unique: true,
    compatibility: createCompatibility(profile.compatibility),
    behavior: { kind: 'weaponAdapter', weaponId: profile.weaponId },
    presentation: {
      name: weapon.name,
      shortName: weapon.name,
      summary: `${weapon.pattern} weapon compatibility adapter; preserves the established firing model.`,
      icon: `weapon-${weapon.pattern}`,
      accentColor: profile.accentColor
    }
  };
}

function createSystemModule(
  definition: Omit<ShipModuleDefinition, 'compatibility' | 'behavior' | 'upgradeSockets'> & {
    readonly compatibility?: Partial<ShipModuleCompatibility>;
    readonly adapterId: string;
  }
): ShipModuleDefinition {
  const { adapterId, compatibility, ...module } = definition;
  return {
    ...module,
    upgradeSockets: createUpgradeSockets(module.slot),
    compatibility: createCompatibility(compatibility),
    behavior: { kind: 'legacySystemAdapter', adapterId }
  };
}

export const SHIP_MODULES: readonly ShipModuleDefinition[] = [
  ...WEAPON_MODULE_PROFILES.map(createWeaponModule),
  createSystemModule({
    id: 'module_secondary_bomb_cassette',
    slot: 'secondary',
    size: 'medium',
    powerDraw: 2,
    heat: 1,
    mass: 3,
    commandDraw: 0,
    tags: ['bomb', 'ordnance'],
    unique: true,
    adapterId: 'legacy-bomb-capacity',
    presentation: {
      name: 'Ventral Bomb Cassette',
      shortName: 'Bomb Cassette',
      summary: 'Armored secondary magazine routed to the established bomb controls.',
      icon: 'secondary-bomb',
      accentColor: '#ffc15a'
    }
  }),
  createSystemModule({
    id: 'module_defense_shield_mesh',
    slot: 'defense',
    size: 'medium',
    powerDraw: 3,
    heat: 2,
    mass: 4,
    commandDraw: 0,
    tags: ['defense', 'shield'],
    unique: true,
    adapterId: 'legacy-shield-profile',
    presentation: {
      name: 'Aegis Retaliation Mesh',
      shortName: 'Aegis Mesh',
      summary: 'Shield bus and retaliation coupler represented by the existing hull contract.',
      icon: 'defense-shield',
      accentColor: '#9adfa7'
    }
  }),
  createSystemModule({
    id: 'module_defense_armor_ledger',
    slot: 'defense',
    size: 'heavy',
    powerDraw: 1,
    heat: 1,
    mass: 7,
    commandDraw: 0,
    tags: ['defense', 'armor', 'heavy'],
    unique: false,
    adapterId: 'legacy-armor-profile',
    presentation: {
      name: 'Claims Armor Ledger',
      shortName: 'Armor Ledger',
      summary: 'Dense sacrificial plating with a severe mass bill.',
      icon: 'defense-armor',
      accentColor: '#d6e1ea'
    }
  }),
  createSystemModule({
    id: 'module_engine_vector_drive',
    slot: 'engine',
    size: 'light',
    powerDraw: 4,
    heat: 3,
    mass: 4,
    commandDraw: 0,
    tags: ['engine', 'mobility', 'speed'],
    unique: true,
    adapterId: 'legacy-mobility-profile',
    presentation: {
      name: 'Vector Dividend Drive',
      shortName: 'Vector Drive',
      summary: "Responsive thrust adapter preserving each contract frame's movement profile.",
      icon: 'engine-vector',
      accentColor: '#6fffd0'
    }
  }),
  createSystemModule({
    id: 'module_engine_torque_array',
    slot: 'engine',
    size: 'heavy',
    powerDraw: 3,
    heat: 4,
    mass: 6,
    commandDraw: 0,
    tags: ['engine', 'heavy', 'ordnance'],
    unique: true,
    adapterId: 'legacy-heavy-mobility-profile',
    presentation: {
      name: 'Ordnance Torque Array',
      shortName: 'Torque Array',
      summary: 'Slow-turning thrust bank designed to move armor and magazines together.',
      icon: 'engine-torque',
      accentColor: '#ff8a3d'
    }
  }),
  createSystemModule({
    id: 'module_utility_credit_tractor',
    slot: 'utility',
    size: 'light',
    powerDraw: 2,
    heat: 1,
    mass: 2,
    commandDraw: 0,
    tags: ['utility', 'economy', 'credit'],
    unique: true,
    adapterId: 'legacy-pickup-pull-profile',
    presentation: {
      name: 'Receivables Tractor',
      shortName: 'Credit Tractor',
      summary: 'Collection field adapter preserving the Debt Runner pickup envelope.',
      icon: 'utility-tractor',
      accentColor: '#59f2ff'
    }
  }),
  createSystemModule({
    id: 'module_utility_salvage_lattice',
    slot: 'utility',
    size: 'medium',
    powerDraw: 2,
    heat: 2,
    mass: 3,
    commandDraw: 0,
    tags: ['utility', 'salvage', 'cooling'],
    unique: true,
    adapterId: 'legacy-salvage-conversion',
    presentation: {
      name: 'Ascetic Salvage Lattice',
      shortName: 'Salvage Lattice',
      summary: 'Sparse conversion grid with strong cooling access and cargo integration.',
      icon: 'utility-salvage',
      accentColor: '#d9c66f'
    }
  }),
  createSystemModule({
    id: 'module_utility_relic_scanner',
    slot: 'utility',
    size: 'light',
    powerDraw: 2,
    heat: 2,
    mass: 2,
    commandDraw: 1,
    tags: ['utility', 'relic', 'command'],
    unique: true,
    compatibility: { requiredFrameTags: ['relic'] },
    adapterId: 'legacy-relic-room-scan',
    presentation: {
      name: 'Unmarked Vault Scanner',
      shortName: 'Vault Scanner',
      summary: 'Command-assisted artifact scan tied to the established relic contract.',
      icon: 'utility-relic',
      accentColor: '#62d986'
    }
  }),
  createSystemModule({
    id: 'module_drone_micro_choir',
    slot: 'drone',
    size: 'medium',
    powerDraw: 4,
    heat: 4,
    mass: 3,
    commandDraw: 2,
    tags: ['drone', 'support', 'command'],
    unique: true,
    adapterId: 'legacy-two-micro-drones',
    presentation: {
      name: 'Micro-Choir Bay',
      shortName: 'Micro-Choir',
      summary: 'Twin followers alternate reduced primary copies from the escort formation.',
      icon: 'drone-choir',
      accentColor: '#9fd7ff'
    }
  }),
  createSystemModule({
    id: 'module_experimental_phase_router',
    slot: 'experimental',
    size: 'medium',
    powerDraw: 5,
    heat: 6,
    mass: 2,
    commandDraw: 1,
    tags: ['experimental', 'phase', 'graze', 'heat-routing'],
    unique: true,
    compatibility: { requiredFrameTags: ['phase'] },
    adapterId: 'legacy-graze-charge',
    presentation: {
      name: 'Near-Miss Phase Router',
      shortName: 'Phase Router',
      summary: 'Routes graze telemetry into the established special-charge behavior.',
      icon: 'experimental-phase',
      accentColor: '#7cf7ff'
    }
  }),
  createSystemModule({
    id: 'module_experimental_prototype_shunt',
    slot: 'experimental',
    size: 'medium',
    powerDraw: 5,
    heat: 4,
    mass: 3,
    commandDraw: 1,
    tags: ['experimental', 'prototype', 'heat-routing'],
    unique: true,
    compatibility: { requiredFrameTags: ['prototype'] },
    adapterId: 'legacy-prototype-contract',
    presentation: {
      name: 'Warranty Void Shunt',
      shortName: 'Void Shunt',
      summary:
        'Experimental bus adapter leaving the established beam and malfunction hooks intact.',
      icon: 'experimental-shunt',
      accentColor: '#ffef5f'
    }
  }),
  createSystemModule({
    id: 'module_experimental_flux_mirror',
    slot: 'experimental',
    size: 'medium',
    powerDraw: 4,
    heat: 8,
    mass: 3,
    commandDraw: 1,
    tags: ['experimental', 'prototype', 'heat'],
    unique: true,
    compatibility: { requiredFrameTags: ['prototype'] },
    adapterId: 'future-flux-mirror',
    presentation: {
      name: 'Unlicensed Flux Mirror',
      shortName: 'Flux Mirror',
      summary: 'A future foundry module whose extreme thermal bill is already enforceable.',
      icon: 'experimental-flux',
      accentColor: '#ff6b3d'
    }
  }),
  createSystemModule({
    id: 'module_experimental_curse_sink',
    slot: 'experimental',
    size: 'medium',
    powerDraw: 3,
    heat: 5,
    mass: 3,
    commandDraw: 1,
    tags: ['experimental', 'relic', 'curse'],
    unique: true,
    compatibility: { requiredFrameTags: ['relic'] },
    adapterId: 'legacy-curse-profile',
    presentation: {
      name: 'Sealed Curse Sink',
      shortName: 'Curse Sink',
      summary: 'A sealed artifact bus preserving the Relic Thief risk profile.',
      icon: 'experimental-curse',
      accentColor: '#ff6bd6'
    }
  })
];

export function getShipFrameById(id: ShipFrameId): ShipFrameDefinition {
  const frame = SHIP_FRAMES.find((candidate) => candidate.id === id);

  if (!frame) {
    throw new Error(`Unknown ship frame id: ${id}`);
  }

  return frame;
}

export function getShipFrameForShip(shipId: ShipId): ShipFrameDefinition {
  const frame = SHIP_FRAMES.find((candidate) => candidate.legacyShipId === shipId);

  if (!frame) {
    throw new Error(`No ship frame adapter exists for ${shipId}`);
  }

  return frame;
}

export function getShipModuleById(id: ShipModuleId): ShipModuleDefinition {
  const module = SHIP_MODULES.find((candidate) => candidate.id === id);

  if (!module) {
    throw new Error(`Unknown ship module id: ${id}`);
  }

  return module;
}
