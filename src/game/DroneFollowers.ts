import type { ItemId, ItemTag } from '../content/items';
import type { ShipModuleId } from '../content/shipModules';
import type { ItemInstance } from './Rewards';
import type { ProjectileBlueprint } from './ItemHooks';

export const MICRO_CHOIR_MODULE_ID = 'module_drone_micro_choir' as const;
export const MAX_COMBAT_DRONE_FOLLOWERS = 8;

export type DroneFollowerSourceId =
  | typeof MICRO_CHOIR_MODULE_ID
  | 'item_drone_uplink'
  | 'item_mirror_turret'
  | 'item_arc_welder_drone'
  | 'item_sidecar_drone_bay'
  | 'item_signal_clone_stamp';

export interface DroneFollowerSpec {
  readonly id: string;
  readonly sourceId: DroneFollowerSourceId;
  readonly sourceIndex: number;
  readonly label: string;
  readonly glyph: string;
  readonly color: string;
  readonly radius: number;
  readonly moveSpeed: number;
}

interface DroneFollowerSourceDefinition {
  readonly sourceId: DroneFollowerSourceId;
  readonly count: number;
  readonly label: string;
  readonly glyphs: readonly string[];
  readonly color: string;
  readonly radius: number;
  readonly moveSpeed: number;
}

const ITEM_DRONE_SOURCE_IDS = [
  'item_drone_uplink',
  'item_mirror_turret',
  'item_arc_welder_drone',
  'item_sidecar_drone_bay',
  'item_signal_clone_stamp'
] as const satisfies readonly ItemId[];

const SOURCE_DEFINITIONS: Readonly<Record<DroneFollowerSourceId, DroneFollowerSourceDefinition>> = {
  module_drone_micro_choir: {
    sourceId: MICRO_CHOIR_MODULE_ID,
    count: 2,
    label: 'Micro-Choir',
    glyphs: ['I', 'II'],
    color: '#9fd7ff',
    radius: 8,
    moveSpeed: 480
  },
  item_drone_uplink: {
    sourceId: 'item_drone_uplink',
    count: 2,
    label: 'Uplink Choir',
    glyphs: ['L', 'R'],
    color: '#7cf7ff',
    radius: 8,
    moveSpeed: 470
  },
  item_mirror_turret: {
    sourceId: 'item_mirror_turret',
    count: 1,
    label: 'Mirror',
    glyphs: ['M'],
    color: '#ff9fe7',
    radius: 9,
    moveSpeed: 440
  },
  item_arc_welder_drone: {
    sourceId: 'item_arc_welder_drone',
    count: 1,
    label: 'Arc Welder',
    glyphs: ['A'],
    color: '#ffd166',
    radius: 9,
    moveSpeed: 450
  },
  item_sidecar_drone_bay: {
    sourceId: 'item_sidecar_drone_bay',
    count: 1,
    label: 'Sidecar',
    glyphs: ['S'],
    color: '#72f2a7',
    radius: 8,
    moveSpeed: 500
  },
  item_signal_clone_stamp: {
    sourceId: 'item_signal_clone_stamp',
    count: 1,
    label: 'Signal Clone',
    glyphs: ['C'],
    color: '#d29cff',
    radius: 9,
    moveSpeed: 460
  }
};

export function createDroneFollowerSpecs(
  items: readonly ItemInstance[],
  moduleIds: readonly ShipModuleId[] = []
): DroneFollowerSpec[] {
  const sources: DroneFollowerSourceId[] = [];
  if (moduleIds.includes(MICRO_CHOIR_MODULE_ID)) {
    sources.push(MICRO_CHOIR_MODULE_ID);
  }

  const ownedItemIds = new Set(items.map((item) => item.itemId));
  for (const itemId of ITEM_DRONE_SOURCE_IDS) {
    if (ownedItemIds.has(itemId)) sources.push(itemId);
  }

  return sources
    .flatMap((sourceId) => {
      const definition = SOURCE_DEFINITIONS[sourceId];
      return Array.from({ length: definition.count }, (_value, sourceIndex) => ({
        id: `${sourceId}:${sourceIndex}`,
        sourceId,
        sourceIndex,
        label: definition.label,
        glyph: definition.glyphs[sourceIndex] ?? `${sourceIndex + 1}`,
        color: definition.color,
        radius: definition.radius,
        moveSpeed: definition.moveSpeed
      }));
    })
    .slice(0, MAX_COMBAT_DRONE_FOLLOWERS);
}

export function createMicroChoirVolley(
  projectiles: readonly ProjectileBlueprint[],
  volleyIndex: number,
  moduleIds: readonly ShipModuleId[] = []
): ProjectileBlueprint[] {
  if (!moduleIds.includes(MICRO_CHOIR_MODULE_ID)) return [...projectiles];
  const seed = projectiles.find((projectile) => !projectile.tags.includes('drone'));
  if (!seed) return [...projectiles];

  const side = volleyIndex % 2 === 0 ? -1 : 1;
  return [
    ...projectiles,
    {
      ...seed,
      x: seed.x + side * 44,
      vx: seed.vx + side * 24,
      damage: Math.max(0.3, seed.damage * 0.36),
      radius: Math.max(3, seed.radius * 0.72),
      tags: addDroneTag(seed.tags),
      procDepth: seed.procDepth + 1,
      droneSourceId: MICRO_CHOIR_MODULE_ID
    }
  ];
}

export function getEscortFormationOffset(
  index: number,
  count: number
): {
  readonly x: number;
  readonly y: number;
} {
  const safeCount = Math.max(1, count);
  const center = (safeCount - 1) / 2;
  const relative = index - center;
  return {
    x: relative * 44,
    y: 36 + Math.abs(relative) * 10
  };
}

export function isDroneFollowerSourceId(value: string | undefined): value is DroneFollowerSourceId {
  return value !== undefined && value in SOURCE_DEFINITIONS;
}

function addDroneTag(tags: readonly ItemTag[]): readonly ItemTag[] {
  return tags.includes('drone') ? tags : [...tags, 'drone'];
}
