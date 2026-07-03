import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene } from '../app/Scene';
import type { InputAction } from '../systems/InputSystem';

export class RunSummaryScene implements Scene {
  public readonly id = 'run-summary';

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly onBackToMenu: () => void
  ) {}

  public enter(): void {
    const shell = document.createElement('main');
    shell.className = 'scene-panel summary-panel';
    shell.setAttribute('aria-labelledby', 'summary-title');

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = 'Run Summary';

    const title = document.createElement('h1');
    title.id = 'summary-title';
    title.textContent = 'Contract Suspended';

    const stats = document.createElement('dl');
    stats.className = 'summary-stats';

    const statEntries: ReadonlyArray<readonly [string, string]> = [
      ['Seed', 'STARBREAK-SMOKE'],
      ['Sector', 'Outer Debris Field'],
      ['Salvage', '0 kg']
    ];

    for (const [label, value] of statEntries) {
      const term = document.createElement('dt');
      term.textContent = label;

      const detail = document.createElement('dd');
      detail.textContent = value;

      stats.append(term, detail);
    }

    const menuButton = document.createElement('button');
    menuButton.className = 'primary-button';
    menuButton.type = 'button';
    menuButton.textContent = 'Back to Menu';
    menuButton.addEventListener('click', this.onBackToMenu);

    shell.append(eyebrow, title, stats, menuButton);
    this.uiRoot.replaceChildren(shell);
    menuButton.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'confirm' || action === 'back') {
      this.onBackToMenu();
    }
  }

  public getDebugState(): { seed: string; entityCount: number } {
    return { seed: 'STARBREAK-SMOKE', entityCount: 0 };
  }
}
