import type { EnemyFormationId } from './enemyFormations';
import type { FactionId } from './factions';

export const SET_PIECE_COMPONENT_TEMPLATE_IDS = [
  'setpiece_armor_section',
  'setpiece_defense_turret',
  'setpiece_hangar_bay',
  'setpiece_shield_emitter',
  'setpiece_drive_cluster',
  'setpiece_breach_core',
  'setpiece_convoy_coupler'
] as const;
export type SetPieceComponentTemplateId = (typeof SET_PIECE_COMPONENT_TEMPLATE_IDS)[number];

export const SET_PIECE_IDS = [
  'setpiece_ledger_hecaton',
  'setpiece_bloom_spindle',
  'setpiece_court_wreck_train'
] as const;
export type SetPieceId = (typeof SET_PIECE_IDS)[number];

export type SetPieceKind = 'capitalShip' | 'station' | 'wreckConvoy';
export type SetPieceComponentKind =
  'armor' | 'turret' | 'hangar' | 'shieldEmitter' | 'engine' | 'weakPoint' | 'coupler';
export type SetPieceCollisionShape = 'circle' | 'rect';
export type SetPieceDamageSource = 'weapon' | 'special' | 'bomb' | 'hazard';
export type SetPieceStageBeat = 'exterior' | 'interior' | 'destruction';

export interface SetPieceComponentTemplate {
  readonly id: SetPieceComponentTemplateId;
  readonly kind: SetPieceComponentKind;
  readonly name: string;
  readonly hull: number;
  readonly armor: number;
  readonly collision: {
    readonly shape: SetPieceCollisionShape;
    readonly width: number;
    readonly height: number;
    readonly radius: number;
    readonly blocksMovement: boolean;
    readonly contactDamage: number;
  };
  readonly allowedDamageSources: readonly SetPieceDamageSource[];
  readonly reward: { readonly credits: number; readonly salvage: number };
  readonly rendering: {
    readonly normalColor: string;
    readonly highContrastColor: string;
    readonly glyph: string;
  };
}

export interface SetPieceComponentDefinition {
  readonly id: string;
  readonly templateId: SetPieceComponentTemplateId;
  readonly stageId: string;
  readonly dependsOn: readonly string[];
  readonly objectiveTarget: boolean;
}

export interface SetPieceComponentPlacement {
  readonly componentId: string;
  readonly x: number;
  readonly y: number;
}

export interface SetPieceLayoutDefinition {
  readonly id: string;
  readonly label: string;
  readonly safeLane: {
    readonly label: string;
    readonly minX: number;
    readonly maxX: number;
  };
  readonly componentPlacements: readonly SetPieceComponentPlacement[];
  readonly reinforcementXRatios: readonly number[];
}

export interface SetPieceStageDefinition {
  readonly id: string;
  readonly label: string;
  readonly beat: SetPieceStageBeat;
  readonly requiredComponentIds: readonly string[];
  readonly reward: { readonly credits: number; readonly salvage: number };
}

export interface SetPieceDefinition {
  readonly id: SetPieceId;
  readonly name: string;
  readonly kind: SetPieceKind;
  readonly factionId: FactionId;
  readonly contractTitle: string;
  readonly objectiveText: string;
  readonly summary: string;
  readonly anchorDistanceRatio: number;
  readonly components: readonly SetPieceComponentDefinition[];
  readonly layouts: readonly SetPieceLayoutDefinition[];
  readonly stages: readonly SetPieceStageDefinition[];
  readonly approachPressure: 'clear' | 'natural' | 'combine';
  readonly reinforcement: {
    readonly formationId: EnemyFormationId;
    readonly memberCount: number;
    readonly trigger: 'none' | 'hangar' | 'stage';
    readonly triggerStageId?: string;
  };
  readonly bossLock: 'none' | 'untilComplete';
  readonly completionReward: { readonly credits: number; readonly salvage: number };
  readonly caps: {
    readonly reinforcementEnemies: number;
    readonly projectiles: number;
    readonly debris: number;
    readonly effects: number;
    readonly rewardPickups: number;
  };
}

const DAMAGE_SOURCES: readonly SetPieceDamageSource[] = ['weapon', 'special', 'bomb', 'hazard'];

export const SET_PIECE_COMPONENT_TEMPLATES: readonly SetPieceComponentTemplate[] = [
  {
    id: 'setpiece_armor_section',
    kind: 'armor',
    name: 'Armor Section',
    hull: 9,
    armor: 1.4,
    collision: {
      shape: 'rect',
      width: 116,
      height: 70,
      radius: 0,
      blocksMovement: true,
      contactDamage: 1
    },
    allowedDamageSources: DAMAGE_SOURCES,
    reward: { credits: 2, salvage: 1 },
    rendering: { normalColor: '#7890a3', highContrastColor: '#f8fbff', glyph: 'ARM' }
  },
  {
    id: 'setpiece_defense_turret',
    kind: 'turret',
    name: 'Defense Turret',
    hull: 5,
    armor: 0.4,
    collision: {
      shape: 'circle',
      width: 0,
      height: 0,
      radius: 31,
      blocksMovement: true,
      contactDamage: 1
    },
    allowedDamageSources: DAMAGE_SOURCES,
    reward: { credits: 3, salvage: 0 },
    rendering: { normalColor: '#ff6b6b', highContrastColor: '#ffef5f', glyph: 'GUN' }
  },
  {
    id: 'setpiece_hangar_bay',
    kind: 'hangar',
    name: 'Hangar Bay',
    hull: 7,
    armor: 0.8,
    collision: {
      shape: 'rect',
      width: 132,
      height: 58,
      radius: 0,
      blocksMovement: true,
      contactDamage: 1
    },
    allowedDamageSources: DAMAGE_SOURCES,
    reward: { credits: 2, salvage: 2 },
    rendering: { normalColor: '#b99cff', highContrastColor: '#ffffff', glyph: 'HGR' }
  },
  {
    id: 'setpiece_shield_emitter',
    kind: 'shieldEmitter',
    name: 'Shield Emitter',
    hull: 4,
    armor: 0.2,
    collision: {
      shape: 'circle',
      width: 0,
      height: 0,
      radius: 27,
      blocksMovement: true,
      contactDamage: 1
    },
    allowedDamageSources: DAMAGE_SOURCES,
    reward: { credits: 2, salvage: 1 },
    rendering: { normalColor: '#59f2ff', highContrastColor: '#ffffff', glyph: 'SHD' }
  },
  {
    id: 'setpiece_drive_cluster',
    kind: 'engine',
    name: 'Drive Cluster',
    hull: 7,
    armor: 0.7,
    collision: {
      shape: 'rect',
      width: 104,
      height: 64,
      radius: 0,
      blocksMovement: true,
      contactDamage: 1
    },
    allowedDamageSources: DAMAGE_SOURCES,
    reward: { credits: 1, salvage: 3 },
    rendering: { normalColor: '#ff9f43', highContrastColor: '#ffef5f', glyph: 'DRV' }
  },
  {
    id: 'setpiece_breach_core',
    kind: 'weakPoint',
    name: 'Breach Core',
    hull: 6,
    armor: 0,
    collision: {
      shape: 'circle',
      width: 0,
      height: 0,
      radius: 35,
      blocksMovement: true,
      contactDamage: 1
    },
    allowedDamageSources: DAMAGE_SOURCES,
    reward: { credits: 4, salvage: 4 },
    rendering: { normalColor: '#ff4fd8', highContrastColor: '#ffffff', glyph: 'CORE' }
  },
  {
    id: 'setpiece_convoy_coupler',
    kind: 'coupler',
    name: 'Convoy Coupler',
    hull: 4,
    armor: 0.3,
    collision: {
      shape: 'rect',
      width: 74,
      height: 42,
      radius: 0,
      blocksMovement: true,
      contactDamage: 1
    },
    allowedDamageSources: DAMAGE_SOURCES,
    reward: { credits: 1, salvage: 2 },
    rendering: { normalColor: '#c99a62', highContrastColor: '#ffef5f', glyph: 'LINK' }
  }
];

export const SET_PIECES: readonly SetPieceDefinition[] = [
  {
    id: 'setpiece_ledger_hecaton',
    name: 'Hecaton Ledger Ark',
    kind: 'capitalShip',
    factionId: 'faction_corporate_ledger',
    contractTitle: 'Void the Hecaton',
    objectiveText: 'Strip the ark shield, breach its armor, and cut the drive ledger.',
    summary: 'A capital collection ship rebuilt into one of several seeded breach geometries.',
    anchorDistanceRatio: 0.42,
    components: [
      {
        id: 'hecaton-emitter-a',
        templateId: 'setpiece_shield_emitter',
        stageId: 'hecaton-screen',
        dependsOn: [],
        objectiveTarget: true
      },
      {
        id: 'hecaton-emitter-b',
        templateId: 'setpiece_shield_emitter',
        stageId: 'hecaton-screen',
        dependsOn: [],
        objectiveTarget: true
      },
      {
        id: 'hecaton-turret',
        templateId: 'setpiece_defense_turret',
        stageId: 'hecaton-screen',
        dependsOn: [],
        objectiveTarget: false
      },
      {
        id: 'hecaton-armor',
        templateId: 'setpiece_armor_section',
        stageId: 'hecaton-breach',
        dependsOn: ['hecaton-emitter-a', 'hecaton-emitter-b'],
        objectiveTarget: true
      },
      {
        id: 'hecaton-hangar',
        templateId: 'setpiece_hangar_bay',
        stageId: 'hecaton-breach',
        dependsOn: ['hecaton-armor'],
        objectiveTarget: false
      },
      {
        id: 'hecaton-drive',
        templateId: 'setpiece_drive_cluster',
        stageId: 'hecaton-collapse',
        dependsOn: ['hecaton-armor'],
        objectiveTarget: true
      },
      {
        id: 'hecaton-core',
        templateId: 'setpiece_breach_core',
        stageId: 'hecaton-collapse',
        dependsOn: ['hecaton-drive'],
        objectiveTarget: true
      }
    ],
    layouts: [
      {
        id: 'starboard-ledger',
        label: 'Starboard Ledger',
        safeLane: { label: 'port maintenance lane', minX: 30, maxX: 170 },
        componentPlacements: [
          { componentId: 'hecaton-emitter-a', x: 210, y: 170 },
          { componentId: 'hecaton-emitter-b', x: 600, y: 190 },
          { componentId: 'hecaton-turret', x: 520, y: 280 },
          { componentId: 'hecaton-armor', x: 320, y: 340 },
          { componentId: 'hecaton-hangar', x: 500, y: 420 },
          { componentId: 'hecaton-drive', x: 420, y: 520 },
          { componentId: 'hecaton-core', x: 270, y: 590 }
        ],
        reinforcementXRatios: [0.42, 0.62, 0.82]
      },
      {
        id: 'port-ledger',
        label: 'Port Ledger',
        safeLane: { label: 'starboard maintenance lane', minX: 470, maxX: 610 },
        componentPlacements: [
          { componentId: 'hecaton-emitter-a', x: 430, y: 170 },
          { componentId: 'hecaton-emitter-b', x: 40, y: 190 },
          { componentId: 'hecaton-turret', x: 120, y: 280 },
          { componentId: 'hecaton-armor', x: 320, y: 340 },
          { componentId: 'hecaton-hangar', x: 140, y: 420 },
          { componentId: 'hecaton-drive', x: 220, y: 520 },
          { componentId: 'hecaton-core', x: 370, y: 590 }
        ],
        reinforcementXRatios: [0.18, 0.38, 0.58]
      },
      {
        id: 'inverted-audit',
        label: 'Inverted Audit',
        safeLane: { label: 'port audit lane', minX: 30, maxX: 170 },
        componentPlacements: [
          { componentId: 'hecaton-emitter-a', x: 280, y: 540 },
          { componentId: 'hecaton-emitter-b', x: 560, y: 520 },
          { componentId: 'hecaton-turret', x: 600, y: 440 },
          { componentId: 'hecaton-armor', x: 400, y: 400 },
          { componentId: 'hecaton-hangar', x: 400, y: 310 },
          { componentId: 'hecaton-drive', x: 280, y: 230 },
          { componentId: 'hecaton-core', x: 540, y: 120 }
        ],
        reinforcementXRatios: [0.28, 0.55, 0.82]
      }
    ],
    stages: [
      {
        id: 'hecaton-screen',
        label: 'Exterior shield screen',
        beat: 'exterior',
        requiredComponentIds: ['hecaton-emitter-a', 'hecaton-emitter-b'],
        reward: { credits: 3, salvage: 1 }
      },
      {
        id: 'hecaton-breach',
        label: 'Interior hangar breach',
        beat: 'interior',
        requiredComponentIds: ['hecaton-armor'],
        reward: { credits: 2, salvage: 2 }
      },
      {
        id: 'hecaton-collapse',
        label: 'Drive-ledger collapse',
        beat: 'destruction',
        requiredComponentIds: ['hecaton-drive', 'hecaton-core'],
        reward: { credits: 4, salvage: 3 }
      }
    ],
    approachPressure: 'clear',
    reinforcement: { formationId: 'formation_screen', memberCount: 0, trigger: 'none' },
    bossLock: 'none',
    completionReward: { credits: 6, salvage: 4 },
    caps: { reinforcementEnemies: 3, projectiles: 18, debris: 20, effects: 24, rewardPickups: 24 }
  },
  {
    id: 'setpiece_bloom_spindle',
    name: 'Bloom Spindle Exchange',
    kind: 'station',
    factionId: 'faction_bloom_hive',
    contractTitle: 'Open the Spindle',
    objectiveText: 'Silence the living batteries and reach the station seed chamber.',
    summary: 'A grown orbital exchange whose seeded crown and stem can bloom to either flank.',
    anchorDistanceRatio: 0.55,
    components: [
      {
        id: 'spindle-emitter',
        templateId: 'setpiece_shield_emitter',
        stageId: 'spindle-crown',
        dependsOn: [],
        objectiveTarget: true
      },
      {
        id: 'spindle-turret-a',
        templateId: 'setpiece_defense_turret',
        stageId: 'spindle-crown',
        dependsOn: [],
        objectiveTarget: false
      },
      {
        id: 'spindle-turret-b',
        templateId: 'setpiece_defense_turret',
        stageId: 'spindle-crown',
        dependsOn: [],
        objectiveTarget: false
      },
      {
        id: 'spindle-armor',
        templateId: 'setpiece_armor_section',
        stageId: 'spindle-stem',
        dependsOn: ['spindle-emitter'],
        objectiveTarget: true
      },
      {
        id: 'spindle-hangar',
        templateId: 'setpiece_hangar_bay',
        stageId: 'spindle-stem',
        dependsOn: ['spindle-armor'],
        objectiveTarget: false
      },
      {
        id: 'spindle-drive',
        templateId: 'setpiece_drive_cluster',
        stageId: 'spindle-seed',
        dependsOn: ['spindle-armor'],
        objectiveTarget: true
      },
      {
        id: 'spindle-core',
        templateId: 'setpiece_breach_core',
        stageId: 'spindle-seed',
        dependsOn: ['spindle-drive'],
        objectiveTarget: true
      }
    ],
    layouts: [
      {
        id: 'starboard-bloom',
        label: 'Starboard Bloom',
        safeLane: { label: 'port evacuation lane', minX: 30, maxX: 170 },
        componentPlacements: [
          { componentId: 'spindle-emitter', x: 600, y: 170 },
          { componentId: 'spindle-turret-a', x: 520, y: 250 },
          { componentId: 'spindle-turret-b', x: 260, y: 300 },
          { componentId: 'spindle-armor', x: 320, y: 350 },
          { componentId: 'spindle-hangar', x: 500, y: 430 },
          { componentId: 'spindle-drive', x: 420, y: 520 },
          { componentId: 'spindle-core', x: 270, y: 590 }
        ],
        reinforcementXRatios: [0.42, 0.62, 0.82]
      },
      {
        id: 'port-bloom',
        label: 'Port Bloom',
        safeLane: { label: 'starboard evacuation lane', minX: 470, maxX: 610 },
        componentPlacements: [
          { componentId: 'spindle-emitter', x: 40, y: 170 },
          { componentId: 'spindle-turret-a', x: 120, y: 250 },
          { componentId: 'spindle-turret-b', x: 380, y: 300 },
          { componentId: 'spindle-armor', x: 320, y: 350 },
          { componentId: 'spindle-hangar', x: 140, y: 430 },
          { componentId: 'spindle-drive', x: 220, y: 520 },
          { componentId: 'spindle-core', x: 370, y: 590 }
        ],
        reinforcementXRatios: [0.18, 0.38, 0.58]
      },
      {
        id: 'seed-first',
        label: 'Seed-First Bloom',
        safeLane: { label: 'port cultivation lane', minX: 30, maxX: 170 },
        componentPlacements: [
          { componentId: 'spindle-emitter', x: 560, y: 540 },
          { componentId: 'spindle-turret-a', x: 600, y: 440 },
          { componentId: 'spindle-turret-b', x: 220, y: 460 },
          { componentId: 'spindle-armor', x: 400, y: 400 },
          { componentId: 'spindle-hangar', x: 400, y: 310 },
          { componentId: 'spindle-drive', x: 280, y: 230 },
          { componentId: 'spindle-core', x: 540, y: 120 }
        ],
        reinforcementXRatios: [0.28, 0.55, 0.82]
      }
    ],
    stages: [
      {
        id: 'spindle-crown',
        label: 'Exterior crown batteries',
        beat: 'exterior',
        requiredComponentIds: ['spindle-emitter'],
        reward: { credits: 2, salvage: 2 }
      },
      {
        id: 'spindle-stem',
        label: 'Interior market stem',
        beat: 'interior',
        requiredComponentIds: ['spindle-armor'],
        reward: { credits: 3, salvage: 2 }
      },
      {
        id: 'spindle-seed',
        label: 'Seed chamber purge',
        beat: 'destruction',
        requiredComponentIds: ['spindle-drive', 'spindle-core'],
        reward: { credits: 3, salvage: 4 }
      }
    ],
    approachPressure: 'natural',
    reinforcement: { formationId: 'formation_ring', memberCount: 3, trigger: 'hangar' },
    bossLock: 'none',
    completionReward: { credits: 5, salvage: 6 },
    caps: { reinforcementEnemies: 3, projectiles: 18, debris: 20, effects: 24, rewardPickups: 24 }
  },
  {
    id: 'setpiece_court_wreck_train',
    name: 'Court Wreck-Train Crown',
    kind: 'wreckConvoy',
    factionId: 'faction_scrap_court',
    contractTitle: 'Uncouple the Crown',
    objectiveText: 'Split the wreck train, expose the throne core, and clear the boss approach.',
    summary: 'A seeded wreck convoy that can flank, mirror, or reverse its crown progression.',
    anchorDistanceRatio: 0.78,
    components: [
      {
        id: 'train-coupler-a',
        templateId: 'setpiece_convoy_coupler',
        stageId: 'train-links',
        dependsOn: [],
        objectiveTarget: true
      },
      {
        id: 'train-coupler-b',
        templateId: 'setpiece_convoy_coupler',
        stageId: 'train-links',
        dependsOn: [],
        objectiveTarget: true
      },
      {
        id: 'train-turret-a',
        templateId: 'setpiece_defense_turret',
        stageId: 'train-links',
        dependsOn: [],
        objectiveTarget: false
      },
      {
        id: 'train-turret-b',
        templateId: 'setpiece_defense_turret',
        stageId: 'train-links',
        dependsOn: [],
        objectiveTarget: false
      },
      {
        id: 'train-armor-a',
        templateId: 'setpiece_armor_section',
        stageId: 'train-hulks',
        dependsOn: ['train-coupler-a'],
        objectiveTarget: true
      },
      {
        id: 'train-armor-b',
        templateId: 'setpiece_armor_section',
        stageId: 'train-hulks',
        dependsOn: ['train-coupler-b'],
        objectiveTarget: true
      },
      {
        id: 'train-drive',
        templateId: 'setpiece_drive_cluster',
        stageId: 'train-crown',
        dependsOn: ['train-armor-a', 'train-armor-b'],
        objectiveTarget: true
      },
      {
        id: 'train-core',
        templateId: 'setpiece_breach_core',
        stageId: 'train-crown',
        dependsOn: ['train-drive'],
        objectiveTarget: true
      }
    ],
    layouts: [
      {
        id: 'starboard-crown',
        label: 'Starboard Crown',
        safeLane: { label: 'port tow corridor', minX: 30, maxX: 170 },
        componentPlacements: [
          { componentId: 'train-coupler-a', x: 214, y: 190 },
          { componentId: 'train-coupler-b', x: 600, y: 210 },
          { componentId: 'train-turret-a', x: 520, y: 290 },
          { componentId: 'train-turret-b', x: 410, y: 310 },
          { componentId: 'train-armor-a', x: 300, y: 400 },
          { componentId: 'train-armor-b', x: 470, y: 420 },
          { componentId: 'train-drive', x: 380, y: 520 },
          { componentId: 'train-core', x: 250, y: 590 }
        ],
        reinforcementXRatios: [0.42, 0.62, 0.82]
      },
      {
        id: 'port-crown',
        label: 'Port Crown',
        safeLane: { label: 'starboard tow corridor', minX: 470, maxX: 610 },
        componentPlacements: [
          { componentId: 'train-coupler-a', x: 426, y: 190 },
          { componentId: 'train-coupler-b', x: 40, y: 210 },
          { componentId: 'train-turret-a', x: 120, y: 290 },
          { componentId: 'train-turret-b', x: 230, y: 310 },
          { componentId: 'train-armor-a', x: 340, y: 400 },
          { componentId: 'train-armor-b', x: 170, y: 420 },
          { componentId: 'train-drive', x: 260, y: 520 },
          { componentId: 'train-core', x: 390, y: 590 }
        ],
        reinforcementXRatios: [0.18, 0.38, 0.58]
      },
      {
        id: 'crown-first',
        label: 'Crown-First Train',
        safeLane: { label: 'port salvage corridor', minX: 30, maxX: 170 },
        componentPlacements: [
          { componentId: 'train-coupler-a', x: 260, y: 540 },
          { componentId: 'train-coupler-b', x: 560, y: 520 },
          { componentId: 'train-turret-a', x: 600, y: 450 },
          { componentId: 'train-turret-b', x: 210, y: 470 },
          { componentId: 'train-armor-a', x: 350, y: 400 },
          { componentId: 'train-armor-b', x: 520, y: 420 },
          { componentId: 'train-drive', x: 280, y: 230 },
          { componentId: 'train-core', x: 520, y: 120 }
        ],
        reinforcementXRatios: [0.28, 0.55, 0.82]
      }
    ],
    stages: [
      {
        id: 'train-links',
        label: 'Exterior tow links',
        beat: 'exterior',
        requiredComponentIds: ['train-coupler-a', 'train-coupler-b'],
        reward: { credits: 2, salvage: 3 }
      },
      {
        id: 'train-hulks',
        label: 'Interior wreck hulks',
        beat: 'interior',
        requiredComponentIds: ['train-armor-a', 'train-armor-b'],
        reward: { credits: 3, salvage: 3 }
      },
      {
        id: 'train-crown',
        label: 'Crown reactor separation',
        beat: 'destruction',
        requiredComponentIds: ['train-drive', 'train-core'],
        reward: { credits: 4, salvage: 4 }
      }
    ],
    approachPressure: 'combine',
    reinforcement: {
      formationId: 'formation_convoy',
      memberCount: 3,
      trigger: 'stage',
      triggerStageId: 'train-hulks'
    },
    bossLock: 'untilComplete',
    completionReward: { credits: 7, salvage: 7 },
    caps: { reinforcementEnemies: 3, projectiles: 18, debris: 22, effects: 26, rewardPickups: 24 }
  }
];

export function getSetPieceById(id: SetPieceId): SetPieceDefinition {
  const definition = SET_PIECES.find((candidate) => candidate.id === id);

  if (!definition) {
    throw new Error(`Unknown set piece: ${id}`);
  }

  return definition;
}

export function getSetPieceLayoutById(
  definition: SetPieceDefinition,
  layoutId: string
): SetPieceLayoutDefinition {
  const layout = definition.layouts.find((candidate) => candidate.id === layoutId);

  if (!layout) {
    throw new Error(`Unknown set-piece layout: ${definition.id}/${layoutId}`);
  }

  return layout;
}

export function getSetPieceComponentTemplate(
  id: SetPieceComponentTemplateId
): SetPieceComponentTemplate {
  const template = SET_PIECE_COMPONENT_TEMPLATES.find((candidate) => candidate.id === id);

  if (!template) {
    throw new Error(`Unknown set-piece component template: ${id}`);
  }

  return template;
}
