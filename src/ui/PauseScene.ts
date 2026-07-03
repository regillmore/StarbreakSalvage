import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene } from '../app/Scene';
import type { InputAction } from '../systems/InputSystem';
import type { GameplayScene } from './GameplayScene';

export class PauseScene implements Scene {
  public readonly id = 'pause';

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly gameplayScene: GameplayScene,
    private readonly onResume: (scene: GameplayScene) => void,
    private readonly onEndRun: () => void,
    private readonly onOpenSettings: () => void
  ) {}

  public enter(): void {
    const shell = document.createElement('main');
    shell.className = 'scene-panel pause-panel';
    shell.setAttribute('aria-labelledby', 'pause-title');

    const title = document.createElement('h1');
    title.id = 'pause-title';
    title.textContent = 'Paused';

    const status = document.createElement('p');
    status.textContent = 'The contract remains legally active.';

    const controls = document.createElement('div');
    controls.className = 'button-row';

    const resumeButton = document.createElement('button');
    resumeButton.className = 'primary-button';
    resumeButton.type = 'button';
    resumeButton.textContent = 'Resume';
    resumeButton.addEventListener('click', () => this.onResume(this.gameplayScene));

    const endButton = document.createElement('button');
    endButton.className = 'secondary-button';
    endButton.type = 'button';
    endButton.textContent = 'End Run';
    endButton.addEventListener('click', this.onEndRun);

    const settingsButton = document.createElement('button');
    settingsButton.className = 'secondary-button';
    settingsButton.type = 'button';
    settingsButton.textContent = 'Settings';
    settingsButton.addEventListener('click', this.onOpenSettings);

    controls.append(resumeButton, settingsButton, endButton);
    shell.append(title, status, controls);
    this.uiRoot.replaceChildren(shell);
    resumeButton.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, alpha: number): void {
    this.gameplayScene.render(renderer, alpha);
    renderer.paintDimmer(0.54);
  }

  public handleAction(action: InputAction): void {
    if (action === 'pause' || action === 'back' || action === 'confirm') {
      this.onResume(this.gameplayScene);
    }
  }

  public getDebugState(): { seed: string; entityCount: number } {
    return this.gameplayScene.getDebugState();
  }
}
