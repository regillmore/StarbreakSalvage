import type { BoardingRoomKind, BoardingTargetKind } from '../content/boarding';
import { createRng } from '../core/rng';
import type { BoardingOperationPlan } from './BoardingOperation';

export type ConfinedEnvironmentKind =
  'capitalHull' | 'industrialStation' | 'buriedWreck' | 'abandonedDerelict';

export interface ConfinedEnvironmentPalette {
  readonly deep: string;
  readonly far: string;
  readonly panel: string;
  readonly panelAlt: string;
  readonly trench: string;
  readonly seam: string;
  readonly accent: string;
  readonly warning: string;
  readonly lamp: string;
}

export interface ConfinedPanelPlan {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly bevel: number;
  readonly alternate: boolean;
  readonly priority: 1 | 2 | 3;
}

export interface ConfinedConduitPlan {
  readonly x: number;
  readonly y: number;
  readonly length: number;
  readonly bend: number;
  readonly side: -1 | 1;
  readonly priority: 1 | 2 | 3;
}

export interface ConfinedLampPlan {
  readonly x: number;
  readonly y: number;
  readonly warning: boolean;
  readonly priority: 1 | 2;
}

export interface ConfinedEnvironmentPlan {
  readonly id: string;
  readonly kind: ConfinedEnvironmentKind;
  readonly label: string;
  readonly targetKind: BoardingTargetKind;
  readonly palette: ConfinedEnvironmentPalette;
  readonly ribSpacing: number;
  readonly ribOffset: number;
  readonly panelScrollRatio: number;
  readonly panels: readonly ConfinedPanelPlan[];
  readonly conduits: readonly ConfinedConduitPlan[];
  readonly lamps: readonly ConfinedLampPlan[];
  readonly roomKinds: readonly BoardingRoomKind[];
}

const ENVIRONMENT_BY_TARGET: Record<
  BoardingTargetKind,
  Pick<ConfinedEnvironmentPlan, 'kind' | 'label' | 'palette'>
> = {
  capitalShip: {
    kind: 'capitalHull',
    label: 'Armored capital-ship interior',
    palette: {
      deep: '#03090d',
      far: '#0b1820',
      panel: '#142b35',
      panelAlt: '#1b3640',
      trench: '#020608',
      seam: '#3e727b',
      accent: '#6de8eb',
      warning: '#ff9f43',
      lamp: '#d8ffff'
    }
  },
  station: {
    kind: 'industrialStation',
    label: 'Industrial station interior',
    palette: {
      deep: '#080705',
      far: '#1c1710',
      panel: '#30281b',
      panelAlt: '#253138',
      trench: '#050403',
      seam: '#796141',
      accent: '#69d9d1',
      warning: '#ffb34f',
      lamp: '#fff0b8'
    }
  },
  wreck: {
    kind: 'buriedWreck',
    label: 'Rock-cut wreck interior',
    palette: {
      deep: '#050407',
      far: '#17121b',
      panel: '#29202d',
      panelAlt: '#332a29',
      trench: '#030205',
      seam: '#70556f',
      accent: '#9be7d7',
      warning: '#d78c58',
      lamp: '#d4ffe9'
    }
  },
  derelict: {
    kind: 'abandonedDerelict',
    label: 'Abandoned underdeck interior',
    palette: {
      deep: '#030705',
      far: '#0c1712',
      panel: '#17271f',
      panelAlt: '#2a2528',
      trench: '#010403',
      seam: '#49665c',
      accent: '#79cbb7',
      warning: '#d56b70',
      lamp: '#c6f7e8'
    }
  }
};

export function createConfinedEnvironmentPlan(
  operation: BoardingOperationPlan
): ConfinedEnvironmentPlan {
  const definition = ENVIRONMENT_BY_TARGET[operation.targetKind];
  const layoutFingerprint = [
    operation.id,
    operation.rooms
      .map((room) => `${room.kind}:${room.startDistance}:${room.hazard ?? 'clear'}`)
      .join('|'),
    operation.doors.map((door) => `${door.lock}:${door.integrity}`).join('|')
  ].join(':');
  const rng = createRng(layoutFingerprint).fork('confined-environment');
  const panelCount = rng.int(12, 16);
  const conduitCount = rng.int(5, 8);
  const lampCount = rng.int(8, 12);

  return {
    id: `confined:${operation.id}`,
    kind: definition.kind,
    label: definition.label,
    targetKind: operation.targetKind,
    palette: definition.palette,
    ribSpacing: rng.int(142, 188),
    ribOffset: rng.int(0, 120),
    panelScrollRatio: round(0.12 + rng.nextFloat() * 0.1),
    panels: Array.from({ length: panelCount }, (_, index) => ({
      x: round(rng.nextFloat()),
      y: round(rng.nextFloat()),
      width: round(0.12 + rng.nextFloat() * 0.26),
      height: round(0.08 + rng.nextFloat() * 0.2),
      bevel: round(0.08 + rng.nextFloat() * 0.2),
      alternate: index % 3 === 1,
      priority: index % 5 === 0 ? 3 : index % 2 === 0 ? 2 : 1
    })),
    conduits: Array.from({ length: conduitCount }, (_, index) => ({
      x: round(rng.nextFloat()),
      y: round(rng.nextFloat()),
      length: round(0.16 + rng.nextFloat() * 0.28),
      bend: round(0.025 + rng.nextFloat() * 0.11),
      side: index % 2 === 0 ? -1 : 1,
      priority: index % 3 === 0 ? 3 : index % 2 === 0 ? 2 : 1
    })),
    lamps: Array.from({ length: lampCount }, (_, index) => ({
      x: round(0.05 + rng.nextFloat() * 0.9),
      y: round(rng.nextFloat()),
      warning: index % 4 === 0,
      priority: index % 3 === 0 ? 2 : 1
    })),
    roomKinds: operation.rooms.map((room) => room.kind)
  };
}

export function summarizeConfinedEnvironmentPlan(plan: ConfinedEnvironmentPlan): unknown {
  return {
    id: plan.id,
    kind: plan.kind,
    label: plan.label,
    targetKind: plan.targetKind,
    ribSpacing: plan.ribSpacing,
    ribOffset: plan.ribOffset,
    panelScrollRatio: plan.panelScrollRatio,
    panels: plan.panels.length,
    conduits: plan.conduits.length,
    lamps: plan.lamps.length,
    firstPanel: plan.panels[0] ?? null,
    roomKinds: plan.roomKinds
  };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
