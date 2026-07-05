import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene } from '../app/Scene';
import type { RunSkeleton, StartingContract } from '../game/Generation';
import { formatRunUpgradeEffects, getRunUpgradeDebugLabels } from '../game/UpgradeEffects';
import type { InputAction } from '../systems/InputSystem';
import { createShipPreviewElement, createShipPreviewModel } from './ShipPreview';

type ContractSelectionDirection = -1 | 1;

export class ContractSelectScene implements Scene {
  public readonly id = 'contract-select';
  private selectedIndex = 0;
  private readonly contractCards: HTMLElement[] = [];
  private selectedPreviewElement: HTMLElement | null = null;

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

    const upgradeIntel = this.createUpgradeIntelLine();

    const selectedPreview = document.createElement('section');
    selectedPreview.className = 'contract-selected-preview';
    selectedPreview.dataset.testid = 'selected-contract-preview';
    selectedPreview.setAttribute('aria-live', 'polite');
    this.selectedPreviewElement = selectedPreview;
    this.updateSelectedPreview();

    const list = document.createElement('div');
    list.className = 'contract-list';

    this.contractCards.length = 0;

    for (const [index, contract] of this.run.contracts.entries()) {
      const article = document.createElement('article');
      article.className = 'contract-card';
      article.dataset.selected = index === this.selectedIndex ? 'true' : 'false';
      article.dataset.testid = `contract-card-${contract.shipId}`;
      article.setAttribute('aria-selected', String(index === this.selectedIndex));
      article.addEventListener('click', () => this.selectContract(index));

      const header = document.createElement('div');
      header.className = 'contract-card-header';

      const preview = this.createPreviewFrame(contract, 'compact');

      const titleGroup = document.createElement('div');
      titleGroup.className = 'contract-card-title';

      const name = document.createElement('h2');
      name.textContent = contract.shipName;

      const sponsor = document.createElement('p');
      sponsor.className = 'contract-sponsor';
      sponsor.textContent = contract.sponsor;
      titleGroup.append(name, sponsor);
      header.append(preview, titleGroup);

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

      const survey = document.createElement('p');
      survey.className = 'contract-detail contract-survey-note';
      survey.textContent = contract.surveyNote ?? '';

      const selectButton = document.createElement('button');
      selectButton.className = 'secondary-button contract-select-button';
      selectButton.type = 'button';
      selectButton.textContent = index === this.selectedIndex ? 'Selected' : 'Select';
      selectButton.addEventListener('click', () => this.selectContract(index));

      article.append(
        header,
        summary,
        weapon,
        stats,
        economy,
        ...(contract.surveyNote ? [survey] : []),
        selectButton
      );
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
    shell.append(eyebrow, title, upgradeIntel, selectedPreview, list, controls);
    this.uiRoot.replaceChildren(shell);
    launchButton.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'moveLeft' || action === 'moveUp') {
      this.selectContract(getNextContractIndex(this.selectedIndex, this.run.contracts.length, -1));
    }

    if (action === 'moveRight' || action === 'moveDown') {
      this.selectContract(getNextContractIndex(this.selectedIndex, this.run.contracts.length, 1));
    }

    if (action === 'confirm') {
      this.launchSelectedContract();
    }

    if (action === 'back' || action === 'pause') {
      this.onBack();
    }
  }

  public getDebugState(): {
    seed: string;
    entityCount: number;
    upgradeEffects?: readonly string[];
  } {
    return {
      seed: this.run.seed,
      entityCount: 0,
      upgradeEffects: getRunUpgradeDebugLabels(this.run.upgradeEffects)
    };
  }

  private createUpgradeIntelLine(): HTMLElement {
    const upgradeIntel = document.createElement('p');
    upgradeIntel.className = 'contract-upgrade-intel';
    upgradeIntel.dataset.testid = 'contract-upgrade-intel';

    if (this.run.upgradeEffects.activeUpgradeIds.length === 0) {
      upgradeIntel.textContent = 'Upgrades: none';
      return upgradeIntel;
    }

    upgradeIntel.textContent = [
      `Upgrades: ${formatRunUpgradeEffects(this.run.upgradeEffects)}`,
      this.run.seedSurvey
    ]
      .filter((line): line is string => Boolean(line))
      .join(' | ');
    return upgradeIntel;
  }

  private selectContract(index: number): void {
    if (index < 0 || index >= this.run.contracts.length) {
      return;
    }

    this.selectedIndex = index;

    for (const [cardIndex, card] of this.contractCards.entries()) {
      card.dataset.selected = cardIndex === this.selectedIndex ? 'true' : 'false';
      card.setAttribute('aria-selected', String(cardIndex === this.selectedIndex));
      const button = card.querySelector('button');

      if (button) {
        button.textContent = cardIndex === this.selectedIndex ? 'Selected' : 'Select';
      }
    }

    this.updateSelectedPreview();
  }

  private launchSelectedContract(): void {
    const selectedContract = this.run.contracts[this.selectedIndex];

    if (!selectedContract) {
      throw new Error('No generated contract is selected.');
    }

    this.onLaunch(selectedContract);
  }

  private updateSelectedPreview(): void {
    if (!this.selectedPreviewElement) {
      return;
    }

    const selectedContract = this.run.contracts[this.selectedIndex];

    if (!selectedContract) {
      this.selectedPreviewElement.replaceChildren();
      return;
    }

    const model = createShipPreviewModel(selectedContract, 'hero');
    const preview = this.createPreviewFrame(selectedContract, 'hero');
    const copy = document.createElement('div');
    copy.className = 'contract-selected-copy';

    const kicker = document.createElement('p');
    kicker.className = 'contract-preview-kicker';
    kicker.textContent = `${model.themeKey.toUpperCase()} | ${model.patternLabel.toUpperCase()}`;

    const title = document.createElement('h2');
    title.textContent = model.shipName;

    const weapon = document.createElement('p');
    weapon.className = 'contract-detail';
    weapon.textContent = `${model.weaponName} | Bias ${selectedContract.itemBias.slice(0, 3).join(' / ')}`;

    const perk = document.createElement('p');
    perk.textContent = `${selectedContract.perk}. Tradeoff: ${selectedContract.drawback}.`;

    const survey = document.createElement('p');
    survey.className = 'contract-detail contract-survey-note';
    survey.textContent = selectedContract.surveyNote ?? '';

    copy.append(kicker, title, weapon, perk, ...(selectedContract.surveyNote ? [survey] : []));
    this.selectedPreviewElement.replaceChildren(preview, copy);
  }

  private createPreviewFrame(contract: StartingContract, variant: 'compact' | 'hero'): HTMLElement {
    const model = createShipPreviewModel(contract, variant);
    const frame = document.createElement('div');
    frame.className = `ship-preview-frame ship-preview-frame-${variant}`;
    frame.dataset.testid =
      variant === 'compact' ? 'contract-ship-preview' : 'selected-ship-preview';
    frame.style.setProperty('--ship-primary', model.primaryColor);
    frame.style.setProperty('--ship-secondary', model.secondaryColor);
    frame.style.setProperty('--ship-trim', model.trimColor);
    frame.style.setProperty('--ship-engine', model.engineColor);
    frame.append(createShipPreviewElement(document, model));
    return frame;
  }
}

export function getNextContractIndex(
  currentIndex: number,
  contractCount: number,
  direction: ContractSelectionDirection
): number {
  if (contractCount <= 0) {
    return 0;
  }

  return (currentIndex + direction + contractCount) % contractCount;
}
