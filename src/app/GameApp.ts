import { CanvasRenderer } from './CanvasRenderer';
import { Loop, type FrameStats } from './Loop';
import { SceneManager } from './SceneManager';
import { InputSystem } from '../systems/InputSystem';
import { ContractSelectScene } from '../ui/ContractSelectScene';
import { GameplayScene } from '../ui/GameplayScene';
import { MainMenuScene } from '../ui/MainMenuScene';
import { PauseScene } from '../ui/PauseScene';
import { RunSummaryScene } from '../ui/RunSummaryScene';

export class GameApp {
  private readonly canvas: HTMLCanvasElement;
  private readonly uiRoot: HTMLDivElement;
  private readonly debugOverlay: HTMLDivElement;
  private readonly renderer: CanvasRenderer;
  private readonly input: InputSystem;
  private readonly sceneManager = new SceneManager();
  private readonly loop: Loop;
  private readonly debugEnabled: boolean;
  private frameStats: FrameStats = {
    fps: 0,
    steps: 0,
    alpha: 0,
    accumulatorSeconds: 0
  };

  public constructor(private readonly root: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.uiRoot = document.createElement('div');
    this.uiRoot.className = 'ui-layer';

    this.debugOverlay = document.createElement('div');
    this.debugOverlay.className = 'debug-overlay';
    this.debugOverlay.setAttribute('aria-live', 'polite');

    this.renderer = new CanvasRenderer(this.canvas);
    this.input = new InputSystem(window);
    this.debugEnabled = isDebugEnabled(window);
    this.loop = new Loop({
      update: (dt) => this.update(dt),
      render: (alpha) => this.render(alpha),
      onFrame: (stats) => {
        this.frameStats = stats;
      }
    });
  }

  public start(): void {
    const children: Node[] = [this.canvas, this.uiRoot];

    if (this.debugEnabled) {
      children.push(this.debugOverlay);
    }

    this.root.replaceChildren(...children);
    this.input.start();
    this.showMainMenu();
    this.loop.start();
  }

  public stop(): void {
    this.loop.stop();
    this.input.stop();
    this.root.replaceChildren();
  }

  private update(dt: number): void {
    for (const action of this.input.drainPressedActions()) {
      this.sceneManager.handleAction(action);
    }

    this.sceneManager.update(dt);
  }

  private render(alpha: number): void {
    this.renderer.resizeToDisplay();
    this.sceneManager.render(this.renderer, alpha);
    this.updateDebugOverlay();
  }

  private showMainMenu(): void {
    this.sceneManager.switchTo(
      new MainMenuScene(this.uiRoot, () => {
        this.showContractSelect();
      })
    );
  }

  private showContractSelect(): void {
    this.sceneManager.switchTo(
      new ContractSelectScene(
        this.uiRoot,
        () => {
          this.showGameplay();
        },
        () => {
          this.showMainMenu();
        }
      )
    );
  }

  private showGameplay(existingScene?: GameplayScene): void {
    const gameplayScene =
      existingScene ??
      new GameplayScene(this.uiRoot, this.input, (pausedScene) => {
        this.showPause(pausedScene);
      });

    this.sceneManager.switchTo(gameplayScene);
  }

  private showPause(gameplayScene: GameplayScene): void {
    this.sceneManager.switchTo(
      new PauseScene(
        this.uiRoot,
        gameplayScene,
        (resumedScene) => {
          this.showGameplay(resumedScene);
        },
        () => {
          this.showRunSummary();
        }
      )
    );
  }

  private showRunSummary(): void {
    this.sceneManager.switchTo(
      new RunSummaryScene(this.uiRoot, () => {
        this.showMainMenu();
      })
    );
  }

  private updateDebugOverlay(): void {
    if (!this.debugEnabled) {
      return;
    }

    const debugState = this.sceneManager.getDebugState();
    this.debugOverlay.textContent = [
      `FPS ${Math.round(this.frameStats.fps)}`,
      `Scene ${this.sceneManager.getSceneId()}`,
      `Seed ${debugState.seed}`,
      `Entities ${debugState.entityCount}`
    ].join(' | ');
  }
}

function isDebugEnabled(ownerWindow: Window): boolean {
  const params = new URLSearchParams(ownerWindow.location.search);

  if (params.get('debug') === '1' || params.get('debug') === 'true') {
    return true;
  }

  try {
    return ownerWindow.localStorage.getItem('starbreak.debug') === '1';
  } catch {
    return false;
  }
}
