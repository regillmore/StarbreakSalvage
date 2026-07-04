import type { CanvasRenderer } from './CanvasRenderer';
import type { InputAction } from '../systems/InputSystem';

export interface SceneDebugState {
  readonly seed: string;
  readonly entityCount: number;
  readonly distance?: number;
  readonly sectorLength?: number;
  readonly scrollSpeed?: number;
  readonly arenaPhase?: string;
  readonly backgroundPrimitives?: number;
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
