import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene } from '../app/Scene';
import type { InputAction } from '../systems/InputSystem';

interface ContractOption {
  readonly name: string;
  readonly sponsor: string;
  readonly summary: string;
}

const PLACEHOLDER_CONTRACTS: readonly ContractOption[] = [
  {
    name: 'Debt Runner',
    sponsor: 'Redline Credit Union',
    summary: 'Fast economy hull with thin armor and aggressive collection magnets.'
  },
  {
    name: 'Drone Chaplain',
    sponsor: 'Choir of Useful Debris',
    summary: 'Support hull with two micro-drones and reduced direct weapon output.'
  },
  {
    name: 'Missile Accountant',
    sponsor: 'Explosive Receivables',
    summary: 'Armored burst hull that turns overkill into future paperwork.'
  }
];

export class ContractSelectScene implements Scene {
  public readonly id = 'contract-select';

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly onLaunch: () => void,
    private readonly onBack: () => void
  ) {}

  public enter(): void {
    const shell = document.createElement('main');
    shell.className = 'scene-panel contract-panel';
    shell.setAttribute('aria-labelledby', 'contract-title');

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = 'Contract Board';

    const title = document.createElement('h1');
    title.id = 'contract-title';
    title.textContent = 'Choose Contract';

    const list = document.createElement('div');
    list.className = 'contract-list';

    for (const contract of PLACEHOLDER_CONTRACTS) {
      const article = document.createElement('article');
      article.className = 'contract-card';

      const name = document.createElement('h2');
      name.textContent = contract.name;

      const sponsor = document.createElement('p');
      sponsor.className = 'contract-sponsor';
      sponsor.textContent = contract.sponsor;

      const summary = document.createElement('p');
      summary.textContent = contract.summary;

      article.append(name, sponsor, summary);
      list.append(article);
    }

    const controls = document.createElement('div');
    controls.className = 'button-row';

    const launchButton = document.createElement('button');
    launchButton.className = 'primary-button';
    launchButton.type = 'button';
    launchButton.textContent = 'Launch Contract';
    launchButton.addEventListener('click', this.onLaunch);

    const backButton = document.createElement('button');
    backButton.className = 'secondary-button';
    backButton.type = 'button';
    backButton.textContent = 'Back';
    backButton.addEventListener('click', this.onBack);

    controls.append(launchButton, backButton);
    shell.append(eyebrow, title, list, controls);
    this.uiRoot.replaceChildren(shell);
    launchButton.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'confirm') {
      this.onLaunch();
    }

    if (action === 'back' || action === 'pause') {
      this.onBack();
    }
  }

  public getDebugState(): { seed: string; entityCount: number } {
    return { seed: 'STARBREAK-SMOKE', entityCount: 0 };
  }
}
