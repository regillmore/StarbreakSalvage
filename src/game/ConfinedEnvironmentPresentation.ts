import type { BoardingRoomKind } from '../content/boarding';
import type { BoardingOperationPlan } from './BoardingOperation';
import type {
  ConfinedConduitPlan,
  ConfinedEnvironmentPlan,
  ConfinedLampPlan,
  ConfinedPanelPlan
} from './ConfinedEnvironment';

export const BOARDING_WORLD_TO_CANVAS = 0.82;

export interface ConfinedPanelInstance {
  readonly id: string;
  readonly panel: ConfinedPanelPlan;
  readonly y: number;
}

export interface ConfinedConduitInstance {
  readonly id: string;
  readonly conduit: ConfinedConduitPlan;
  readonly y: number;
}

export interface ConfinedLampInstance {
  readonly id: string;
  readonly lamp: ConfinedLampPlan;
  readonly y: number;
}

export interface ConfinedRibInstance {
  readonly id: string;
  readonly worldIndex: number;
  readonly y: number;
}

export interface ConfinedBackgroundFrame {
  readonly panels: readonly ConfinedPanelInstance[];
  readonly conduits: readonly ConfinedConduitInstance[];
  readonly lamps: readonly ConfinedLampInstance[];
  readonly ribs: readonly ConfinedRibInstance[];
}

export interface BoardingRoomBand {
  readonly id: string;
  readonly roomIndex: number;
  readonly kind: BoardingRoomKind;
  readonly top: number;
  readonly bottom: number;
}

export function createConfinedBackgroundFrame(options: {
  readonly plan: ConfinedEnvironmentPlan;
  readonly scrollOffset: number;
  readonly parallaxScale: number;
  readonly viewportHeight: number;
  readonly maxPriority: 1 | 2 | 3;
}): ConfinedBackgroundFrame {
  const { plan, viewportHeight, maxPriority } = options;
  const effectiveScrollOffset = options.scrollOffset * options.parallaxScale;
  const wrapSpan = viewportHeight + 220;
  const wrapOrigin = -110;

  const panels = plan.panels.flatMap((panel, sourceIndex) => {
    if (panel.priority > maxPriority) return [];
    const height = Math.max(42, panel.height * viewportHeight);
    return createRepeatedInstances({
      sourceIndex,
      sourceY: panel.y,
      scrollOffset: effectiveScrollOffset * plan.panelScrollRatio,
      wrapSpan,
      wrapOrigin,
      viewportHeight,
      extent: height / 2 + 2,
      create: (id, y) => ({ id, panel, y })
    });
  });

  const conduits = plan.conduits.flatMap((conduit, sourceIndex) => {
    if (conduit.priority > maxPriority) return [];
    const bend = Math.max(18, conduit.bend * viewportHeight);
    return createRepeatedInstances({
      sourceIndex,
      sourceY: conduit.y,
      scrollOffset: effectiveScrollOffset * (plan.panelScrollRatio + 0.08),
      wrapSpan,
      wrapOrigin,
      viewportHeight,
      extent: bend + 4,
      create: (id, y) => ({ id, conduit, y })
    });
  });

  const lamps = plan.lamps.flatMap((lamp, sourceIndex) => {
    if (lamp.priority > maxPriority) return [];
    return createRepeatedInstances({
      sourceIndex,
      sourceY: lamp.y,
      scrollOffset: effectiveScrollOffset * (plan.panelScrollRatio + 0.16),
      wrapSpan,
      wrapOrigin,
      viewportHeight,
      extent: 20,
      create: (id, y) => ({ id, lamp, y })
    });
  });

  const ribSpacing = Math.max(96, plan.ribSpacing);
  const ribBaseY = plan.ribOffset + effectiveScrollOffset * 0.42;
  const firstRib = Math.ceil((-12 - ribBaseY) / ribSpacing);
  const lastRib = Math.floor((viewportHeight + 12 - ribBaseY) / ribSpacing);
  const ribs: ConfinedRibInstance[] = [];
  for (let worldIndex = firstRib; worldIndex <= lastRib; worldIndex += 1) {
    ribs.push({
      id: `rib:${worldIndex}`,
      worldIndex,
      y: ribBaseY + worldIndex * ribSpacing
    });
  }

  return { panels, conduits, lamps, ribs };
}

export function createVisibleBoardingRoomBands(
  operation: BoardingOperationPlan,
  distance: number,
  viewportHeight: number
): readonly BoardingRoomBand[] {
  return operation.rooms.flatMap((room, roomIndex) => {
    const top = viewportHeight - (room.endDistance - distance) * BOARDING_WORLD_TO_CANVAS;
    const bottom = viewportHeight - (room.startDistance - distance) * BOARDING_WORLD_TO_CANVAS;
    if (bottom < 0 || top > viewportHeight) return [];
    return [
      {
        id: `room:${roomIndex}`,
        roomIndex,
        kind: room.kind,
        top: Math.max(0, top),
        bottom: Math.min(viewportHeight, bottom)
      }
    ];
  });
}

function createRepeatedInstances<T>(options: {
  readonly sourceIndex: number;
  readonly sourceY: number;
  readonly scrollOffset: number;
  readonly wrapSpan: number;
  readonly wrapOrigin: number;
  readonly viewportHeight: number;
  readonly extent: number;
  readonly create: (id: string, y: number) => T;
}): readonly T[] {
  const baseY = options.sourceY * options.wrapSpan + options.scrollOffset + options.wrapOrigin;
  const firstCycle = Math.ceil((-options.extent - baseY) / options.wrapSpan);
  const lastCycle = Math.floor(
    (options.viewportHeight + options.extent - baseY) / options.wrapSpan
  );
  const instances: T[] = [];
  for (let cycle = firstCycle; cycle <= lastCycle; cycle += 1) {
    instances.push(
      options.create(`${options.sourceIndex}:${cycle}`, baseY + cycle * options.wrapSpan)
    );
  }
  return instances;
}
