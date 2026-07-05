import type { CanvasRenderer } from './CanvasRenderer';
import type { InputAction } from '../systems/InputSystem';

export interface SceneDebugState {
  readonly seed: string;
  readonly entityCount: number;
  readonly entityCounts?: {
    readonly total: number;
    readonly player: number;
    readonly enemies: number;
    readonly boss: number;
    readonly projectiles: number;
    readonly playerProjectiles: number;
    readonly enemyProjectiles: number;
    readonly pickups: number;
    readonly effects: number;
    readonly pickupsAndEffects: number;
    readonly telegraphs: number;
  };
  readonly distance?: number;
  readonly sectorLength?: number;
  readonly scrollSpeed?: number;
  readonly arenaPhase?: string;
  readonly debugScenario?: string;
  readonly backgroundPrimitives?: number;
  readonly backgroundLayers?: number;
  readonly activeLandmarks?: number;
  readonly activeHazards?: number;
  readonly viewport?: {
    readonly width: number;
    readonly height: number;
    readonly className: string;
    readonly scale: number;
    readonly safeFrameWidth: number;
    readonly safeFrameHeight: number;
  };
}

export interface Scene {
  readonly id: string;
  enter?(params?: unknown): void;
  exit?(): void;
  update(dt: number): void;
  render(renderer: CanvasRenderer, alpha: number): void;
  handleAction?(action: InputAction): void;
  getDebugState?(): SceneDebugState;
}
