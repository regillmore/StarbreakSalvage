import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { UpgradeIconKey, UpgradeId } from '../content/upgrades';
import type { SaveData, UpgradePurchaseResult } from '../core/saveData';
import type { InputAction } from '../systems/InputSystem';
import { createUpgradeBayViewModel, type UpgradeCardViewModel } from './UpgradeBayViewModel';

const SVG_NS = 'http://www.w3.org/2000/svg';

export class UpgradeBayScene implements Scene {
  public readonly id = 'upgrade-bay';
  private statusText = 'Upgrade Bay ready.';
  private focusUpgradeId: UpgradeId | null = null;

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly getSaveData: () => SaveData,
    private readonly onPurchaseUpgrade: (upgradeId: UpgradeId) => UpgradePurchaseResult,
    private readonly onBack: () => void
  ) {}

  public enter(): void {
    const saveData = this.getSaveData();
    const model = createUpgradeBayViewModel(saveData);
    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide upgrade-bay-panel';
    shell.setAttribute('aria-labelledby', 'upgrade-bay-title');

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `Salvage Bank ${model.salvageBank} kg`;

    const title = document.createElement('h1');
    title.id = 'upgrade-bay-title';
    title.textContent = 'Upgrade Bay';

    const summary = document.createElement('p');
    summary.className = 'upgrade-bay-summary';
    summary.dataset.testid = 'upgrade-bay-summary';
    summary.textContent = model.summaryText;

    const grid = document.createElement('section');
    grid.className = 'upgrade-grid';
    grid.dataset.testid = 'upgrade-grid';
    grid.setAttribute('aria-label', 'Persistent upgrades');

    for (const card of model.cards) {
      grid.append(this.createUpgradeCard(card));
    }

    const controls = document.createElement('div');
    controls.className = 'button-row';

    const backButton = document.createElement('button');
    backButton.className = 'primary-button';
    backButton.type = 'button';
    backButton.textContent = 'Back';
    backButton.addEventListener('click', this.onBack);
    controls.append(backButton);

    const status = document.createElement('p');
    status.className = 'boot-status';
    status.dataset.testid = 'upgrade-bay-status';
    status.setAttribute('aria-live', 'polite');
    status.textContent = this.statusText;

    shell.append(eyebrow, title, summary, grid, controls, status);
    this.uiRoot.replaceChildren(shell);

    const focusedCard = this.focusUpgradeId
      ? shell.querySelector<HTMLElement>(`[data-upgrade-id="${this.focusUpgradeId}"]`)
      : null;
    (focusedCard ?? backButton).focus();
    this.focusUpgradeId = null;
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'back' || action === 'pause') {
      this.onBack();
    }
  }

  public getDebugState(): SceneDebugState {
    const model = createUpgradeBayViewModel(this.getSaveData());

    return {
      seed: 'n/a',
      entityCount: 0,
      progression: {
        salvageBank: model.salvageBank,
        purchasedUpgrades: model.purchasedCount,
        totalUpgrades: model.totalCount,
        availableUpgrades: model.availableCount
      }
    };
  }

  private createUpgradeCard(card: UpgradeCardViewModel): HTMLElement {
    const item = document.createElement('article');
    item.className = 'upgrade-card';
    item.dataset.state = card.state;
    item.dataset.category = card.category;
    item.dataset.testid = `upgrade-card-${card.id}`;
    item.dataset.upgradeId = card.id;
    item.tabIndex = 0;
    item.setAttribute('aria-labelledby', `${card.id}-title`);
    item.setAttribute('aria-describedby', `${card.id}-summary ${card.id}-state`);

    const header = document.createElement('div');
    header.className = 'upgrade-card-header';
    header.append(createUpgradeIcon(document, card.iconKey, `${card.name} icon`));

    const headingGroup = document.createElement('div');
    headingGroup.className = 'upgrade-card-title';

    const category = document.createElement('p');
    category.className = 'choice-meta';
    category.textContent = card.categoryLabel;

    const name = document.createElement('h2');
    name.id = `${card.id}-title`;
    name.textContent = card.name;

    headingGroup.append(category, name);
    header.append(headingGroup);

    const meta = document.createElement('p');
    meta.className = 'choice-meta';
    meta.textContent = `${card.costLabel} | ${card.stateLabel}`;

    const summary = document.createElement('p');
    summary.id = `${card.id}-summary`;
    summary.className = 'choice-body';
    summary.textContent = card.summary;

    const effect = document.createElement('p');
    effect.className = 'choice-body upgrade-effect';
    effect.textContent = card.effect;

    const state = document.createElement('p');
    state.id = `${card.id}-state`;
    state.className = 'upgrade-state';
    state.textContent = card.stateDetail;

    item.append(header, meta, summary, effect, state);

    if (card.prerequisiteLabel) {
      const prerequisites = document.createElement('p');
      prerequisites.className = 'upgrade-prerequisites';
      prerequisites.textContent = card.prerequisiteLabel;
      item.append(prerequisites);
    }

    const actionButton = document.createElement('button');
    actionButton.className = `${card.canPurchase ? 'primary-button' : 'secondary-button'} upgrade-card-action`;
    actionButton.type = 'button';
    actionButton.disabled = !card.canPurchase;
    actionButton.textContent = card.actionLabel;
    actionButton.setAttribute('aria-label', `${card.actionLabel} ${card.name}`);
    actionButton.addEventListener('click', () => {
      this.focusUpgradeId = card.id;
      const result = this.onPurchaseUpgrade(card.id);
      this.statusText = result.message;
      this.enter();
    });

    item.append(actionButton);
    return item;
  }
}

function createUpgradeIcon(
  ownerDocument: Document,
  iconKey: UpgradeIconKey,
  label: string
): SVGSVGElement {
  const svg = ownerDocument.createElementNS(SVG_NS, 'svg');
  svg.classList.add('upgrade-icon');
  svg.setAttribute('viewBox', '0 0 64 64');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', label);
  svg.setAttribute('focusable', 'false');

  const title = ownerDocument.createElementNS(SVG_NS, 'title');
  title.textContent = label;
  svg.append(title);

  appendSvgElement(svg, 'rect', {
    x: '6',
    y: '6',
    width: '52',
    height: '52',
    rx: '7',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    opacity: '0.36'
  });

  if (iconKey === 'contract-scope') {
    appendContractScopeIcon(svg);
  } else if (iconKey === 'route-radar') {
    appendRouteRadarIcon(svg);
  } else if (iconKey === 'market-tag') {
    appendMarketTagIcon(svg);
  } else if (iconKey === 'vault-index') {
    appendVaultIndexIcon(svg);
  } else if (iconKey === 'scrap-ledger') {
    appendScrapLedgerIcon(svg);
  } else {
    appendSeedMapIcon(svg);
  }

  return svg;
}

function appendContractScopeIcon(svg: SVGSVGElement): void {
  appendSvgElement(svg, 'circle', {
    cx: '32',
    cy: '31',
    r: '17',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '3'
  });
  appendSvgElement(svg, 'path', {
    d: 'M32 11v9M32 42v11M12 31h10M42 31h10',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-linecap': 'round',
    'stroke-width': '3'
  });
  appendSvgElement(svg, 'path', {
    d: 'M25 41l7-20 7 20-7-4z',
    fill: 'currentColor',
    opacity: '0.48'
  });
}

function appendRouteRadarIcon(svg: SVGSVGElement): void {
  appendSvgElement(svg, 'path', {
    d: 'M14 38c9-14 27-14 36 0M20 43c6-8 18-8 24 0',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-linecap': 'round',
    'stroke-width': '3'
  });
  appendSvgElement(svg, 'path', {
    d: 'M17 23l13 9 17-13',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-linejoin': 'round',
    'stroke-width': '3'
  });
  appendSvgElement(svg, 'circle', { cx: '17', cy: '23', r: '4', fill: 'currentColor' });
  appendSvgElement(svg, 'circle', { cx: '30', cy: '32', r: '4', fill: 'currentColor' });
  appendSvgElement(svg, 'circle', { cx: '47', cy: '19', r: '4', fill: 'currentColor' });
}

function appendMarketTagIcon(svg: SVGSVGElement): void {
  appendSvgElement(svg, 'path', {
    d: 'M14 18h26l11 11-22 22H14z',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-linejoin': 'round',
    'stroke-width': '3'
  });
  appendSvgElement(svg, 'circle', { cx: '39', cy: '27', r: '3.5', fill: 'currentColor' });
  appendSvgElement(svg, 'path', {
    d: 'M21 36h20M21 43h13',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-linecap': 'round',
    'stroke-width': '3'
  });
}

function appendVaultIndexIcon(svg: SVGSVGElement): void {
  appendSvgElement(svg, 'rect', {
    x: '17',
    y: '13',
    width: '30',
    height: '39',
    rx: '3',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '3'
  });
  appendSvgElement(svg, 'path', {
    d: 'M23 21h18M23 30h18M23 39h12M47 22h5M47 33h5M47 44h5',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-linecap': 'round',
    'stroke-width': '3'
  });
}

function appendScrapLedgerIcon(svg: SVGSVGElement): void {
  appendSvgElement(svg, 'path', {
    d: 'M19 13h20l7 7v31H19z',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-linejoin': 'round',
    'stroke-width': '3'
  });
  appendSvgElement(svg, 'path', {
    d: 'M39 13v8h8M25 29h13M25 37h8',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'stroke-width': '3'
  });
  appendSvgElement(svg, 'circle', {
    cx: '40',
    cy: '42',
    r: '8',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '3'
  });
  appendSvgElement(svg, 'path', {
    d: 'M36 42h8M40 38v8',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-linecap': 'round',
    'stroke-width': '2.5'
  });
}

function appendSeedMapIcon(svg: SVGSVGElement): void {
  appendSvgElement(svg, 'path', {
    d: 'M14 19l12-5 12 5 12-5v31l-12 5-12-5-12 5z',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-linejoin': 'round',
    'stroke-width': '3'
  });
  appendSvgElement(svg, 'path', {
    d: 'M26 14v31M38 19v31',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2.5',
    opacity: '0.72'
  });
  appendSvgElement(svg, 'path', {
    d: 'M21 28l2 4 4 1-4 2-2 4-2-4-4-2 4-1zM45 24l1.5 3 3 .8-3 1.4-1.5 3-1.5-3-3-1.4 3-.8z',
    fill: 'currentColor',
    opacity: '0.58'
  });
}

function appendSvgElement(
  parent: SVGSVGElement,
  tagName: string,
  attributes: Record<string, string>
): void {
  const element = parent.ownerDocument.createElementNS(SVG_NS, tagName);

  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }

  parent.append(element);
}
