import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene } from '../app/Scene';
import type { InputAction } from '../systems/InputSystem';

export class MainMenuScene implements Scene {
  public readonly id = 'main-menu';

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly onStartRun: () => void
  ) {}

  public enter(): void {
    const shell = document.createElement('main');
    shell.className = 'title-shell';
    shell.setAttribute('aria-labelledby', 'game-title');

    const title = document.createElement('h1');
    title.id = 'game-title';
    title.textContent = 'Starbreak Salvage';

    const tagline = document.createElement('p');
    tagline.className = 'tagline';
    tagline.textContent = 'Disposable pilots. Unsafe weapons. Profitable wreckage.';

    const startButton = document.createElement('button');
    startButton.className = 'primary-button title-button';
    startButton.type = 'button';
    startButton.textContent = 'Start Run';
    startButton.addEventListener('click', this.onStartRun);

    const status = document.createElement('p');
    status.className = 'boot-status';
    status.dataset.testid = 'boot-status';
    status.textContent = 'Awaiting salvage contract.';

    shell.append(title, tagline, startButton, status);
    this.uiRoot.replaceChildren(shell);
    startButton.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'confirm') {
      this.onStartRun();
    }
  }

  public getDebugState(): { seed: string; entityCount: number } {
    return { seed: 'n/a', entityCount: 0 };
  }
}
