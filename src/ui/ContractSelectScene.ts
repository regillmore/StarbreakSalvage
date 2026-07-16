import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene } from '../app/Scene';
import type { RunSkeleton, StartingContract } from '../game/Generation';
import { getRunUpgradeDebugLabels } from '../game/UpgradeEffects';
import type { InputAction } from '../systems/InputSystem';
import { createAttackSimulationPreviewElement } from './AttackSimulationPreview';
import {
  createContractChoicePresentationModels,
  type ContractChoicePresentationModel,
  type ContractMetricModel
} from './ContractSelectionPresentation';
import { createItemIcon } from './ItemCard';
import { createShipPreviewElement, createShipPreviewModel } from './ShipPreview';

type ContractSelectionDirection = -1 | 1;

export class ContractSelectScene implements Scene {
  public readonly id = 'contract-select';
  private selectedIndex = 0;
  private readonly contractCards: HTMLElement[] = [];
  private selectedPreviewElement: HTMLElement | null = null;
  private choiceModels: readonly ContractChoicePresentationModel[] = [];

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly run: RunSkeleton,
    private readonly onLaunch: (contract: StartingContract) => void,
    private readonly onBack: () => void
  ) {}

  public enter(): void {
    this.choiceModels = createContractChoicePresentationModels(this.run);
    const shell = document.createElement('main');
    shell.className = 'scene-panel contract-panel';
    shell.setAttribute('aria-labelledby', 'contract-title');

    const header = document.createElement('header');
    header.className = 'contract-board-header';
    const heading = document.createElement('div');
    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `Contract Board | Seed ${this.run.seed}`;
    const title = document.createElement('h1');
    title.id = 'contract-title';
    title.textContent = 'Choose Contract';
    const intro = document.createElement('p');
    intro.className = 'contract-board-intro';
    intro.textContent =
      'Compare the hull, seeded ignition core, and real opening firing pattern. The highlighted contract launches.';
    heading.append(eyebrow, title, intro);
    header.append(heading, this.createUpgradeIntelLine());

    const selectedPreview = document.createElement('section');
    selectedPreview.className = 'contract-selected-preview';
    selectedPreview.dataset.testid = 'selected-contract-preview';
    selectedPreview.setAttribute('aria-live', 'polite');
    this.selectedPreviewElement = selectedPreview;
    this.updateSelectedPreview();

    const list = document.createElement('div');
    list.className = 'contract-list';
    list.setAttribute('role', 'list');
    list.setAttribute('aria-label', 'Available ship contracts');
    this.contractCards.length = 0;

    for (const [index, choice] of this.choiceModels.entries()) {
      list.append(this.createContractCard(choice, index));
    }

    const controls = document.createElement('div');
    controls.className = 'button-row contract-controls';
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

    shell.append(header, selectedPreview, list, controls);
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
    shipLoadout?: StartingContract['loadout']['debug'];
    upgradeEffects?: readonly string[];
  } {
    const selectedContract = this.run.contracts[this.selectedIndex];
    return {
      seed: this.run.seed,
      entityCount: 0,
      shipLoadout: selectedContract?.loadout.debug,
      upgradeEffects: getRunUpgradeDebugLabels(this.run.upgradeEffects)
    };
  }

  private createContractCard(choice: ContractChoicePresentationModel, index: number): HTMLElement {
    const { contract } = choice;
    const article = document.createElement('article');
    article.className = 'contract-card';
    article.dataset.selected = index === this.selectedIndex ? 'true' : 'false';
    article.dataset.testid = `contract-card-${contract.shipId}`;
    article.setAttribute('role', 'listitem');
    article.setAttribute('aria-label', choice.ariaLabel);
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

    const identity = document.createElement('p');
    identity.className = 'contract-card-summary';
    identity.textContent = contract.summary;
    const summaryBlock = document.createElement('div');
    summaryBlock.className = 'contract-card-summary-block';
    summaryBlock.append(identity);
    if (contract.surveyNote) {
      const survey = document.createElement('p');
      survey.className = 'contract-survey-note';
      survey.textContent = contract.surveyNote;
      summaryBlock.append(survey);
    }

    const weapon = document.createElement('div');
    weapon.className = 'contract-card-weapon';
    const weaponLabel = document.createElement('span');
    weaponLabel.textContent = 'PRIMARY';
    const weaponName = document.createElement('strong');
    weaponName.textContent = contract.startingWeaponName;
    const weaponPattern = document.createElement('small');
    weaponPattern.textContent = contract.startingWeaponPattern.toUpperCase();
    weapon.append(weaponLabel, weaponName, weaponPattern);

    const ignition = this.createIgnitionPanel(choice, 'compact');
    const metrics = this.createMetricGrid(choice.metrics.slice(0, 3), 'compact');

    const selectButton = document.createElement('button');
    selectButton.className = 'secondary-button contract-select-button';
    selectButton.type = 'button';
    selectButton.textContent = index === this.selectedIndex ? 'Selected' : 'Select';
    selectButton.setAttribute('aria-pressed', String(index === this.selectedIndex));
    selectButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.selectContract(index);
    });

    article.append(header, summaryBlock, weapon, ignition, metrics, selectButton);
    this.contractCards.push(article);
    return article;
  }

  private createUpgradeIntelLine(): HTMLElement {
    const upgradeIntel = document.createElement('aside');
    upgradeIntel.className = 'contract-upgrade-intel';
    upgradeIntel.dataset.testid = 'contract-upgrade-intel';

    if (this.run.upgradeEffects.activeUpgradeNames.length === 0) {
      upgradeIntel.hidden = true;
      return upgradeIntel;
    }

    const label = document.createElement('strong');
    label.textContent = 'ARCHIVE SUPPORT';
    const chips = document.createElement('span');
    chips.className = 'contract-upgrade-chip-row';
    for (const upgradeName of this.run.upgradeEffects.activeUpgradeNames) {
      const chip = document.createElement('span');
      chip.textContent = upgradeName;
      chips.append(chip);
    }
    upgradeIntel.append(label, chips);

    if (this.run.seedSurvey) {
      const survey = document.createElement('small');
      survey.className = 'contract-survey-note';
      survey.textContent = this.run.seedSurvey;
      upgradeIntel.append(survey);
    }
    return upgradeIntel;
  }

  private selectContract(index: number): void {
    if (index < 0 || index >= this.run.contracts.length) {
      return;
    }

    this.selectedIndex = index;
    for (const [cardIndex, card] of this.contractCards.entries()) {
      card.dataset.selected = cardIndex === this.selectedIndex ? 'true' : 'false';
      const button = card.querySelector('button');
      if (button) {
        button.textContent = cardIndex === this.selectedIndex ? 'Selected' : 'Select';
        button.setAttribute('aria-pressed', String(cardIndex === this.selectedIndex));
      }
    }
    this.updateSelectedPreview();
  }

  private launchSelectedContract(): void {
    const selectedContract = this.run.contracts[this.selectedIndex];
    if (!selectedContract) throw new Error('No generated contract is selected.');
    this.onLaunch(selectedContract);
  }

  private updateSelectedPreview(): void {
    if (!this.selectedPreviewElement) return;
    const choice = this.choiceModels[this.selectedIndex];
    if (!choice) {
      this.selectedPreviewElement.replaceChildren();
      return;
    }

    const { contract } = choice;
    const previewModel = createShipPreviewModel(contract, 'hero', {
      ariaContext: 'Contract live-fire simulation'
    });
    const liveFire = document.createElement('div');
    liveFire.className = 'contract-live-fire';
    liveFire.dataset.testid = 'selected-ship-preview';
    const preview = createAttackSimulationPreviewElement(document, {
      previewModel,
      shipRadius: contract.shipStats.hitRadius,
      simulation: choice.attackSimulation,
      testId: 'contract-attack-preview',
      projectileLayerTestId: 'contract-attack-projectile-layer',
      projectileTestId: 'contract-attack-projectile',
      className: 'contract-attack-preview',
      liveLabel: 'OPENING VOLLEY'
    });
    const liveFireCaption = document.createElement('div');
    liveFireCaption.className = 'contract-live-fire-caption';
    const weapon = document.createElement('strong');
    weapon.textContent = contract.startingWeaponName;
    const ignition = document.createElement('span');
    ignition.textContent = `IGNITION // ${choice.ignition.name}`;
    liveFireCaption.append(weapon, ignition);
    liveFire.append(preview, liveFireCaption);

    const dossier = document.createElement('div');
    dossier.className = 'contract-selected-copy';
    const kicker = document.createElement('p');
    kicker.className = 'contract-preview-kicker';
    kicker.dataset.testid = 'selected-loadout-preview';
    kicker.textContent = `${previewModel.themeKey} contract // ${contract.loadout.preview.title}`;
    const titleRow = document.createElement('div');
    titleRow.className = 'contract-selected-title';
    const title = document.createElement('h2');
    title.textContent = contract.shipName;
    const pattern = document.createElement('span');
    pattern.textContent = contract.startingWeaponPattern.toUpperCase();
    titleRow.append(title, pattern);
    const sponsor = document.createElement('p');
    sponsor.className = 'contract-selected-sponsor';
    sponsor.textContent = `${contract.sponsor} // ${contract.loadout.preview.role}`;
    const summary = document.createElement('p');
    summary.className = 'contract-selected-summary';
    summary.textContent = contract.summary;
    const ignitionPanel = this.createIgnitionPanel(choice, 'hero');
    const metrics = this.createMetricGrid(choice.metrics, 'hero');
    const tradeoffs = document.createElement('div');
    tradeoffs.className = 'contract-tradeoff-grid';
    tradeoffs.append(
      this.createContractTrait('EDGE', contract.perk, 'positive'),
      this.createContractTrait('COST', contract.drawback, 'negative')
    );
    dossier.append(kicker, titleRow, sponsor, summary, ignitionPanel, metrics, tradeoffs);
    this.selectedPreviewElement.replaceChildren(liveFire, dossier);
  }

  private createIgnitionPanel(
    choice: ContractChoicePresentationModel,
    variant: 'compact' | 'hero'
  ): HTMLElement {
    const panel = document.createElement('section');
    panel.className = `contract-ignition contract-ignition-${variant}`;
    panel.dataset.rarity = choice.ignition.rarity;
    panel.dataset.family = choice.ignition.family;
    panel.dataset.testid =
      variant === 'compact'
        ? `contract-ignition-${choice.contract.shipId}`
        : 'selected-contract-ignition';
    const header = document.createElement('div');
    header.className = 'contract-ignition-header';
    const copy = document.createElement('div');
    const label = document.createElement('span');
    label.textContent = 'SEEDED IGNITION';
    const name = document.createElement('strong');
    name.textContent = choice.ignition.name;
    const family = document.createElement('small');
    family.textContent = choice.ignition.familyLabel;
    copy.append(label, name, family);
    header.append(createItemIcon(document, choice.ignition), copy);
    const effect = document.createElement('p');
    effect.textContent = choice.ignition.effectText;
    panel.append(header, effect);

    if (variant === 'hero') {
      const badges = document.createElement('div');
      badges.className = 'contract-ignition-badges';
      for (const badgeText of choice.ignition.badges.slice(0, 3)) {
        const badge = document.createElement('span');
        badge.textContent = badgeText;
        badges.append(badge);
      }
      panel.append(badges);
    }
    return panel;
  }

  private createMetricGrid(
    metrics: readonly ContractMetricModel[],
    variant: 'compact' | 'hero'
  ): HTMLElement {
    const grid = document.createElement('div');
    grid.className = `contract-metric-grid contract-metric-grid-${variant}`;
    for (const metric of metrics) {
      const item = document.createElement('span');
      item.className = 'contract-metric';
      item.dataset.metric = metric.id;
      const glyph = document.createElement('small');
      glyph.textContent = metric.glyph;
      const value = document.createElement('strong');
      value.textContent = metric.value;
      const label = document.createElement('span');
      label.textContent = metric.label;
      item.append(glyph, value, label);
      grid.append(item);
    }
    return grid;
  }

  private createContractTrait(
    labelText: string,
    bodyText: string,
    tone: 'positive' | 'negative'
  ): HTMLElement {
    const trait = document.createElement('section');
    trait.className = 'contract-trait';
    trait.dataset.tone = tone;
    const label = document.createElement('strong');
    label.textContent = labelText;
    const body = document.createElement('p');
    body.textContent = bodyText;
    trait.append(label, body);
    return trait;
  }

  private createPreviewFrame(contract: StartingContract, variant: 'compact'): HTMLElement {
    const model = createShipPreviewModel(contract, variant);
    const frame = document.createElement('div');
    frame.className = `ship-preview-frame ship-preview-frame-${variant}`;
    frame.dataset.testid = 'contract-ship-preview';
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
  if (contractCount <= 0) return 0;
  return (currentIndex + direction + contractCount) % contractCount;
}
