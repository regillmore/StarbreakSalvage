import type { CanvasRenderer } from './CanvasRenderer';
import type { Scene, SceneDebugState } from './Scene';
import type { InputAction } from '../systems/InputSystem';

export class SceneManager {
  private currentScene: Scene | null = null;

  public switchTo(scene: Scene, params?: unknown): void {
    this.currentScene?.exit?.();
    this.currentScene = scene;
    scene.enter?.(params);
  }

  public update(dt: number): void {
    this.currentScene?.update(dt);
  }

  public render(renderer: CanvasRenderer, alpha: number): void {
    this.currentScene?.render(renderer, alpha);
  }

  public handleAction(action: InputAction): void {
    this.currentScene?.handleAction?.(action);
  }

  public getSceneId(): string {
    return this.currentScene?.id ?? 'boot';
  }

  public getDebugState(): SceneDebugState {
    return this.currentScene?.getDebugState?.() ?? { seed: 'n/a', entityCount: 0 };
  }
}
