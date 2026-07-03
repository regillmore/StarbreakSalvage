import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene } from '../app/Scene';
import type { ItemId } from '../content/items';
import type { RunSkeleton, StartingContract } from '../game/Generation';
import {
  getCurrentSector,
  getOwnedItemIds,
  getShopRerollCount,
  type RunSessionState
} from '../game/RunSession';
import { generateShopInventory, SHOP_REROLL_COST } from '../game/Shops';
import type { InputAction } from '../systems/InputSystem';

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
    const inventory = generateShopInventory({
      seed: sector.shopSeed,
      sectorIndex: sector.index,
      rerollCount,
      biasTags: this.contract.itemBias,
      excludeItemIds: getOwnedItemIds(this.session)
    });
    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide shop-panel';
    shell.setAttribute('aria-labelledby', 'shop-title');

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `${sector.sectorName} Market | Credits ${this.session.credits}`;

    const title = document.createElement('h1');
    title.id = 'shop-title';
    title.textContent = 'Shop';

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
    shell.append(eyebrow, title, shopGrid, controls);
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

  public getDebugState(): { seed: string; entityCount: number } {
    return { seed: this.run.seed, entityCount: 0 };
  }
}
