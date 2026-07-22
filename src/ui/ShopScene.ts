import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import { getItemById, type ItemId } from '../content/items';
import { createActEconomyProfile, getActEconomyShopReadout } from '../game/ActEconomy';
import { formatProspectiveBuildSynergy } from '../game/BuildSynergy';
import type { RunSkeleton, StartingContract } from '../game/Generation';
import {
  getCurrentSector,
  getInterActEffectsForSector,
  getOwnedItemIds,
  getShipHullReadModel,
  getShopModifiersForSector,
  getShopRerollCount,
  type RunSessionState
} from '../game/RunSession';
import { getShopStockForRoll, initializeShopStockForRoll } from '../game/ShopStock';
import { generateShopInventory, getShopHullRepairCost, getShopRerollCost } from '../game/Shops';
import { createEngineeringCombatProfile } from '../game/Foundry';
import {
  getCouponCascadeReadout,
  getConvoyReceiptPrinterReadout,
  getMarketDecoderReadout,
  getRunUpgradeDebugLabels
} from '../game/UpgradeEffects';
import type { InputAction } from '../systems/InputSystem';
import {
  applyContractScreenTheme,
  createContractScreenThemeModel,
  createContractThemeDebugState,
  createContractThemeStrip,
  getContractThemeOptions
} from './ContractTheme';
import { appendItemCardContent } from './ItemCard';
import { createItemCardViewModel } from './ItemCardViewModel';
import {
  createFactionCampaignDebugState,
  getFactionCampaignInfluence
} from '../game/FactionCampaign';
import { createCarrierInfluence } from '../game/CarrierCommand';
import { getActiveFittedItems } from '../game/ItemSockets';

export class ShopScene implements Scene {
  public readonly id = 'shop';

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly run: RunSkeleton,
    private readonly session: RunSessionState,
    private readonly contract: StartingContract,
    private readonly onBuyItem: (itemId: ItemId, price: number) => boolean,
    private readonly onReroll: () => boolean,
    private readonly onRepairHull: (price: number) => boolean,
    private readonly onLeave: () => void
  ) {}

  public enter(): void {
    const sector = getCurrentSector(this.run, this.session);
    const actEconomy = createActEconomyProfile(sector);
    const hull = getShipHullReadModel(this.contract, this.session);
    const hullRepairCost = getShopHullRepairCost(actEconomy);
    const rerollCount = getShopRerollCount(this.session, sector.index);
    const shopModifiers = getShopModifiersForSector(this.session, sector.index);
    const interActEffects = getInterActEffectsForSector(this.session, sector);
    const upgradeReadout = [
      getMarketDecoderReadout(this.run.upgradeEffects),
      getCouponCascadeReadout(this.run.upgradeEffects),
      getConvoyReceiptPrinterReadout(this.run.upgradeEffects)
    ]
      .filter((readout): readout is string => Boolean(readout))
      .join(' | ');
    const campaign = getFactionCampaignInfluence(
      this.run.factionCampaign,
      this.session.factionCampaign,
      sector,
      { plan: this.run.factionFronts, state: this.session.factionFronts }
    );
    const carrier = createCarrierInfluence(this.run.carrierPlan, this.session.carrier);
    const carrierAccess = carrier.factionAccess[campaign.factionId] && campaign.frontCarrierAccess;
    const priceDiscount =
      shopModifiers.reduce((total, modifier) => total + modifier.discount, 0) +
      interActEffects.shopDiscount +
      this.run.upgradeEffects.shopDiscount +
      campaign.shopDiscount +
      (carrierAccess ? carrier.shopDiscount : -3);
    const stockBonus =
      shopModifiers.reduce((total, modifier) => total + modifier.stockBonus, 0) +
      this.run.upgradeEffects.shopStockBonus;
    const shopBiasTags = [
      ...shopModifiers.flatMap((modifier) => modifier.biasTags),
      ...interActEffects.rewardBiasTags,
      ...this.run.upgradeEffects.shopBiasTags,
      ...campaign.shopBiasTags,
      ...carrier.rewardBiasTags
    ];
    const engineering = createEngineeringCombatProfile(this.session.engineering);
    const stock =
      getShopStockForRoll(this.session, sector.index, rerollCount) ??
      initializeShopStockForRoll(
        this.session,
        sector.index,
        rerollCount,
        generateShopInventory({
          seed: sector.shopSeed,
          sectorIndex: sector.index,
          rerollCount,
          biasTags: [...this.contract.itemBias, ...shopBiasTags],
          excludeItemIds: getOwnedItemIds(this.session),
          priceDiscount,
          count: 4 + stockBonus,
          unlockedIds: this.run.unlockedIds,
          itemInstances: getActiveFittedItems(
            this.session.itemInstances,
            this.session.engineering.committed
          ),
          sectorId: sector.sectorId,
          sectorRole: sector.sectorName,
          bossFactionId: sector.bossFactionId,
          bossGate: sector.objective.bossRequired,
          actEconomy,
          engineeringHooks: engineering.hooks,
          procBudget: engineering.procBudget,
          couponCascadeUpgrade: this.run.upgradeEffects.shopCouponCascade,
          convoyReceiptPrinterUpgrade: this.run.upgradeEffects.convoyReceiptPrinter
        }).map((item) => ({
          slot: item.slot,
          itemId: item.item.id,
          price: item.price,
          sourceHint: item.sourceHint,
          depleted: false
        }))
      );
    const rerollCost = getShopRerollCost(actEconomy, rerollCount);
    const actEconomyReadout = getActEconomyShopReadout(actEconomy);
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
    eyebrow.textContent = [
      `${sector.sectorName} Market`,
      `Credits ${this.session.credits}`,
      `Hull ${hull.current}/${hull.max}`,
      priceDiscount > 0 ? `Permit -${priceDiscount} prices` : null,
      actEconomyReadout,
      `${campaign.responseLabel} ${campaign.shopDiscount >= 0 ? 'permit' : 'warrant'} ${campaign.shopDiscount >= 0 ? '-' : '+'}${Math.abs(campaign.shopDiscount)}`,
      campaign.front
        ? `${campaign.front.mapCue} ${campaign.front.strategyLabel} ${campaign.front.stance}`
        : null,
      carrierAccess
        ? `${this.run.carrierPlan.name} access -${carrier.shopDiscount}`
        : `${this.run.carrierPlan.name} access restricted +3`
    ]
      .filter(Boolean)
      .join(' | ');

    const title = document.createElement('h1');
    title.id = 'shop-title';
    title.textContent = 'Shop';

    const upgradeNote = document.createElement('p');
    upgradeNote.className = 'screen-upgrade-note';
    upgradeNote.dataset.testid = 'shop-upgrade-note';
    upgradeNote.textContent = upgradeReadout ?? '';

    const shopGrid = document.createElement('div');
    shopGrid.className = 'shop-grid';

    for (const stockItem of stock) {
      if (stockItem.depleted) {
        shopGrid.append(createEmptyShopSlot(stockItem.slot));
        continue;
      }

      const item = getItemById(stockItem.itemId);
      const buyButton = document.createElement('button');
      buyButton.className = 'choice-card shop-card';
      buyButton.type = 'button';
      buyButton.dataset.testid = `shop-slot-${stockItem.slot}`;
      buyButton.dataset.state = 'available';
      buyButton.disabled = this.session.credits < stockItem.price;
      buyButton.addEventListener('click', () => {
        if (this.onBuyItem(item.id, stockItem.price)) {
          this.enter();
        }
      });

      appendItemCardContent(
        buyButton,
        createItemCardViewModel(item, {
          sourceLabel: stockItem.sourceHint,
          price: stockItem.price,
          synergyText: formatProspectiveBuildSynergy(this.session.itemInstances, item.id)
        })
      );
      shopGrid.append(buyButton);
    }

    const repairService = document.createElement('section');
    repairService.className = 'shop-repair-service';
    repairService.dataset.testid = 'shop-repair-service';
    repairService.dataset.state = hull.state;
    repairService.setAttribute('aria-labelledby', 'shop-repair-title');

    const repairIdentity = document.createElement('div');
    repairIdentity.className = 'shop-repair-identity';
    const repairEyebrow = document.createElement('small');
    repairEyebrow.textContent = 'Dock Service // Fixed Labor Rate';
    const repairTitle = document.createElement('h2');
    repairTitle.id = 'shop-repair-title';
    repairTitle.textContent = 'Hull Repair';
    const repairCopy = document.createElement('p');
    repairCopy.textContent =
      hull.missing > 0
        ? 'Restore one hull point. Repeat while the ship is damaged and credits remain.'
        : 'The contract hull is fully sealed. No repair charge is due.';
    repairIdentity.append(repairEyebrow, repairTitle, repairCopy);

    const repairGauge = document.createElement('div');
    repairGauge.className = 'shop-repair-gauge';
    repairGauge.dataset.testid = 'shop-repair-gauge';
    repairGauge.setAttribute('role', 'meter');
    repairGauge.setAttribute('aria-label', `Ship hull ${hull.current} of ${hull.max}`);
    repairGauge.setAttribute('aria-valuemin', '0');
    repairGauge.setAttribute('aria-valuemax', `${hull.max}`);
    repairGauge.setAttribute('aria-valuenow', `${hull.current}`);
    const repairReadout = document.createElement('strong');
    repairReadout.textContent = `Hull ${hull.current}/${hull.max}`;
    const repairSegments = document.createElement('span');
    repairSegments.className = 'shop-repair-segments';
    repairSegments.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < hull.max; index += 1) {
      const segment = document.createElement('i');
      segment.dataset.filled = String(index < hull.current);
      repairSegments.append(segment);
    }
    repairGauge.append(repairReadout, repairSegments);

    const repairButton = document.createElement('button');
    repairButton.className = 'secondary-button shop-repair-action';
    repairButton.type = 'button';
    repairButton.dataset.testid = 'shop-repair-action';
    repairButton.disabled = hull.missing === 0 || this.session.credits < hullRepairCost;
    repairButton.textContent =
      hull.missing === 0 ? 'Hull Fully Repaired' : `Repair +1 Hull -${hullRepairCost}`;
    repairButton.setAttribute(
      'aria-label',
      hull.missing === 0
        ? `Hull fully repaired at ${hull.current} of ${hull.max}`
        : `Repair one hull for ${hullRepairCost} credits, current hull ${hull.current} of ${hull.max}`
    );
    repairButton.addEventListener('click', () => {
      if (this.onRepairHull(hullRepairCost)) this.enter();
    });

    repairService.append(repairIdentity, repairGauge, repairButton);

    const controls = document.createElement('div');
    controls.className = 'button-row';

    const rerollButton = document.createElement('button');
    rerollButton.className = 'secondary-button';
    rerollButton.type = 'button';
    rerollButton.disabled = this.session.credits < rerollCost;
    rerollButton.textContent = `Reroll -${rerollCost}`;
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
      ...(upgradeReadout.length > 0 ? [upgradeNote] : []),
      repairService,
      shopGrid,
      controls
    );
    this.uiRoot.replaceChildren(shell);
    shell.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
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
    const sector = getCurrentSector(this.run, this.session);
    const influence = getFactionCampaignInfluence(
      this.run.factionCampaign,
      this.session.factionCampaign,
      sector,
      { plan: this.run.factionFronts, state: this.session.factionFronts }
    );
    return {
      seed: this.run.seed,
      entityCount: 0,
      contractTheme: createContractThemeDebugState(this.contract),
      factionCampaign: createFactionCampaignDebugState(
        this.run.factionCampaign,
        this.session.factionCampaign,
        influence
      ),
      upgradeEffects: getRunUpgradeDebugLabels(this.run.upgradeEffects)
    };
  }
}

function createEmptyShopSlot(slot: number): HTMLButtonElement {
  const emptySlot = document.createElement('button');
  emptySlot.className = 'choice-card shop-card shop-card-empty';
  emptySlot.type = 'button';
  emptySlot.disabled = true;
  emptySlot.dataset.testid = `shop-slot-${slot}`;
  emptySlot.dataset.state = 'empty';
  emptySlot.setAttribute('aria-label', `Inventory slot ${slot + 1}, empty`);

  const label = document.createElement('span');
  label.className = 'shop-empty-label';
  label.textContent = `Inventory Slot ${String(slot + 1).padStart(2, '0')}`;

  const title = document.createElement('strong');
  title.className = 'shop-empty-title';
  title.textContent = 'Empty Slot';

  const note = document.createElement('span');
  note.className = 'shop-empty-note';
  note.textContent = 'Purchased. Reroll to restock.';

  emptySlot.append(label, title, note);
  return emptySlot;
}
