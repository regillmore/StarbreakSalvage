import type { CanvasRenderer } from './CanvasRenderer';
import type { InputAction } from '../systems/InputSystem';
import type { ContractThemeDebugState } from '../ui/ContractTheme';

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
  readonly inputMode?: string;
  readonly hudMode?: string;
  readonly contractTheme?: ContractThemeDebugState;
  readonly upgradeEffects?: readonly string[];
  readonly backgroundPrimitives?: number;
  readonly backgroundLayers?: number;
  readonly activeLandmarks?: number;
  readonly activeHazards?: number;
  readonly viewport?: {
    readonly width: number;
    readonly height: number;
    readonly className: string;
    readonly dpr: number;
    readonly scale: number;
    readonly canvasPixelWidth: number;
    readonly canvasPixelHeight: number;
    readonly safeFrameX: number;
    readonly safeFrameY: number;
    readonly safeFrameWidth: number;
    readonly safeFrameHeight: number;
    readonly arenaWidth?: number;
    readonly arenaHeight?: number;
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
