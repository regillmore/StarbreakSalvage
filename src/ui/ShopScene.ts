import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { ItemId } from '../content/items';
import type { RunSkeleton, StartingContract } from '../game/Generation';
import {
  getCurrentSector,
  getOwnedItemIds,
  getShopModifiersForSector,
  getShopRerollCount,
  type RunSessionState
} from '../game/RunSession';
import { generateShopInventory, SHOP_REROLL_COST } from '../game/Shops';
import { getMarketDecoderReadout, getRunUpgradeDebugLabels } from '../game/UpgradeEffects';
import type { InputAction } from '../systems/InputSystem';
import {
  applyContractScreenTheme,
  createContractScreenThemeModel,
  createContractThemeDebugState,
  createContractThemeStrip,
  getContractThemeOptions
} from './ContractTheme';

export class ShopScene implements Scene {
  public readonly id = 'shop';

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly run: RunSkeleton,
    private readonly session: RunSessionState,
    private readonly contract: StartingContract,
    private readonly onBuyItem: (itemId: ItemId, price: number) => boolean,
    private readonly onReroll: () => boolean,
    private readonly onLeave: () => void
  ) {}

  public enter(): void {
    const sector = getCurrentSector(this.run, this.session);
    const rerollCount = getShopRerollCount(this.session, sector.index);
    const shopModifiers = getShopModifiersForSector(this.session, sector.index);
    const upgradeReadout = getMarketDecoderReadout(this.run.upgradeEffects);
    const priceDiscount =
      shopModifiers.reduce((total, modifier) => total + modifier.discount, 0) +
      this.run.upgradeEffects.shopDiscount;
    const stockBonus =
      shopModifiers.reduce((total, modifier) => total + modifier.stockBonus, 0) +
      this.run.upgradeEffects.shopStockBonus;
    const shopBiasTags = [
      ...shopModifiers.flatMap((modifier) => modifier.biasTags),
      ...this.run.upgradeEffects.shopBiasTags
    ];
    const inventory = generateShopInventory({
      seed: sector.shopSeed,
      sectorIndex: sector.index,
      rerollCount,
      biasTags: [...this.contract.itemBias, ...shopBiasTags],
      excludeItemIds: getOwnedItemIds(this.session),
      priceDiscount,
      count: 4 + stockBonus,
      unlockedIds: this.run.unlockedIds,
      itemInstances: this.session.itemInstances
    });
    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide shop-panel';
    shell.setAttribute('aria-labelledby', 'shop-title');
    const theme = createContractScreenThemeModel(
      this.contract,
      getContractThemeOptions(this.uiRoot.ownerDocument)
    );
    applyContractScreenTheme(shell, theme);

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `${sector.sectorName} Market | Credits ${this.session.credits}${priceDiscount > 0 ? ` | Permit -${priceDiscount} prices` : ''}`;

    const title = document.createElement('h1');
    title.id = 'shop-title';
    title.textContent = 'Shop';

    const upgradeNote = document.createElement('p');
    upgradeNote.className = 'screen-upgrade-note';
    upgradeNote.dataset.testid = 'shop-upgrade-note';
    upgradeNote.textContent = upgradeReadout ?? '';

    const shopGrid = document.createElement('div');
    shopGrid.className = 'shop-grid';

    for (const item of inventory) {
      const buyButton = document.createElement('button');
      buyButton.className = 'choice-card shop-card';
      buyButton.type = 'button';
      buyButton.disabled = this.session.credits < item.price;
      buyButton.addEventListener('click', () => {
        if (this.onBuyItem(item.item.id, item.price)) {
          this.enter();
        }
      });

      const name = document.createElement('span');
      name.className = 'choice-title';
      name.textContent = item.item.name;

      const meta = document.createElement('span');
      meta.className = 'choice-meta';
      meta.textContent = `${item.item.rarity} | ${item.price} credits`;

      const effect = document.createElement('span');
      effect.className = 'choice-body';
      effect.textContent = item.item.effect;

      buyButton.append(name, meta, effect);
      shopGrid.append(buyButton);
    }

    const controls = document.createElement('div');
    controls.className = 'button-row';

    const rerollButton = document.createElement('button');
    rerollButton.className = 'secondary-button';
    rerollButton.type = 'button';
    rerollButton.disabled = this.session.credits < SHOP_REROLL_COST;
    rerollButton.textContent = `Reroll -${SHOP_REROLL_COST}`;
    rerollButton.addEventListener('click', () => {
      if (this.onReroll()) {
        this.enter();
      }
    });

    const leaveButton = document.createElement('button');
    leaveButton.className = 'primary-button';
    leaveButton.type = 'button';
    leaveButton.textContent = 'Leave Shop';
    leaveButton.addEventListener('click', this.onLeave);

    controls.append(rerollButton, leaveButton);
    shell.append(
      eyebrow,
      createContractThemeStrip(this.uiRoot.ownerDocument, theme),
      title,
      ...(upgradeReadout ? [upgradeNote] : []),
      shopGrid,
      controls
    );
    this.uiRoot.replaceChildren(shell);
    shopGrid.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'back' || action === 'pause') {
      this.onLeave();
    }
  }

  public getDebugState(): SceneDebugState {
    return {
      seed: this.run.seed,
      entityCount: 0,
      contractTheme: createContractThemeDebugState(this.contract),
      upgradeEffects: getRunUpgradeDebugLabels(this.run.upgradeEffects)
    };
  }
}
