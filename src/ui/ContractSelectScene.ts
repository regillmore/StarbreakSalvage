import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene } from '../app/Scene';
import type { RunSkeleton, StartingContract } from '../game/Generation';
import type { InputAction } from '../systems/InputSystem';

export class ContractSelectScene implements Scene {
  public readonly id = 'contract-select';
  private selectedIndex = 0;
  private readonly contractCards: HTMLElement[] = [];

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly run: RunSkeleton,
    private readonly onLaunch: (contract: StartingContract) => void,
    private readonly onBack: () => void
  ) {}

  public enter(): void {
    const shell = document.createElement('main');
    shell.className = 'scene-panel contract-panel';
    shell.setAttribute('aria-labelledby', 'contract-title');

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `Contract Board | Seed ${this.run.seed}`;

    const title = document.createElement('h1');
    title.id = 'contract-title';
    title.textContent = 'Choose Contract';

    const list = document.createElement('div');
    list.className = 'contract-list';

    this.contractCards.length = 0;

    for (const [index, contract] of this.run.contracts.entries()) {
      const article = document.createElement('article');
      article.className = 'contract-card';
      article.dataset.selected = index === this.selectedIndex ? 'true' : 'false';

      const name = document.createElement('h2');
      name.textContent = contract.shipName;

      const sponsor = document.createElement('p');
      sponsor.className = 'contract-sponsor';
      sponsor.textContent = contract.sponsor;

      const summary = document.createElement('p');
      summary.textContent = contract.summary;

      const weapon = document.createElement('p');
      weapon.className = 'contract-detail';
      weapon.textContent = `Weapon: ${contract.startingWeaponName} | ${contract.startingWeaponPattern}`;

      const stats = document.createElement('p');
      stats.className = 'contract-detail';
      stats.textContent = `Hull ${contract.shipStats.maxHull} | Speed ${contract.shipStats.speed} | Hit ${contract.shipStats.hitRadius} | Bombs ${contract.shipStats.bombCapacity}`;

      const economy = document.createElement('p');
      economy.className = 'contract-detail';
      economy.textContent = `Start: ${contract.startingCredits} credits | ${contract.startingSalvage} salvage`;

      const selectButton = document.createElement('button');
      selectButton.className = 'secondary-button contract-select-button';
      selectButton.type = 'button';
      selectButton.textContent = index === this.selectedIndex ? 'Selected' : 'Select';
      selectButton.addEventListener('click', () => this.selectContract(index));

      article.append(name, sponsor, summary, weapon, stats, economy, selectButton);
      list.append(article);
      this.contractCards.push(article);
    }

    const controls = document.createElement('div');
    controls.className = 'button-row';

    const launchButton = document.createElement('button');
    launchButton.className = 'primary-button';
    launchButton.type = 'button';
    launchButton.textContent = 'Launch Contract';
    launchButton.addEventListener('click', () => this.launchSelectedContract());

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
      this.launchSelectedContract();
    }

    if (action === 'back' || action === 'pause') {
      this.onBack();
    }
  }

  public getDebugState(): { seed: string; entityCount: number } {
    return { seed: this.run.seed, entityCount: 0 };
  }

  private selectContract(index: number): void {
    this.selectedIndex = index;

    for (const [cardIndex, card] of this.contractCards.entries()) {
      card.dataset.selected = cardIndex === this.selectedIndex ? 'true' : 'false';
      const button = card.querySelector('button');

      if (button) {
        button.textContent = cardIndex === this.selectedIndex ? 'Selected' : 'Select';
      }
    }
  }

  private launchSelectedContract(): void {
    const selectedContract = this.run.contracts[this.selectedIndex];

    if (!selectedContract) {
      throw new Error('No generated contract is selected.');
    }

    this.onLaunch(selectedContract);
  }
}
