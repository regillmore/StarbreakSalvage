import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { ItemId } from '../content/items';
import { createActEconomyProfile } from '../game/ActEconomy';
import { createSectorPrimaryWeaponOffer, getInstalledPrimaryWeapon } from '../game/ComponentOffers';
import type { FoundryComponentInstance } from '../game/Foundry';
import type { RunSkeleton, StartingContract } from '../game/Generation';
import { generateSectorRewardChoices } from '../game/SectorRewards';
import {
  getCurrentSector,
  getIncomingRewardRouteKind,
  getRouteCreditReward,
  type RunSessionState
} from '../game/RunSession';
import { getRewardDossierReadout, getRunUpgradeDebugLabels } from '../game/UpgradeEffects';
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
import { appendPrimaryWeaponOfferCardContent } from './ComponentOfferCard';
import { createApexGlyph } from './ApexGlyph';

export class RewardScene implements Scene {
  public readonly id = 'reward';

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly run: RunSkeleton,
    private readonly session: RunSessionState,
    private readonly contract: StartingContract,
    private readonly onSelectItem: (itemId: ItemId) => void,
    private readonly onSelectPrimaryWeapon: (component: FoundryComponentInstance) => void,
    private readonly onTakeCredits: () => void
  ) {}

  public enter(): void {
    const sector = getCurrentSector(this.run, this.session);
    const actEconomy = createActEconomyProfile(sector);
    const incomingRouteKind = getIncomingRewardRouteKind(
      this.session,
      this.session.currentSectorIndex
    );
    const creditReward = getRouteCreditReward(
      this.session,
      this.session.currentSectorIndex,
      actEconomy
    );
    const rewardChoices = generateSectorRewardChoices({
      run: this.run,
      session: this.session,
      contract: this.contract,
      ...(incomingRouteKind ? { routeKind: incomingRouteKind } : {})
    });
    const primaryWeaponOffer = createSectorPrimaryWeaponOffer(this.run, this.session);
    const installedPrimary = getInstalledPrimaryWeapon(this.session.engineering.committed);

    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide reward-panel';
    shell.setAttribute('aria-labelledby', 'reward-title');
    const theme = createContractScreenThemeModel(
      this.contract,
      getContractThemeOptions(this.uiRoot.ownerDocument)
    );
    applyContractScreenTheme(shell, theme);

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `${sector.sectorName} | Operation Reward`;

    const title = document.createElement('h1');
    title.id = 'reward-title';
    title.textContent = 'Choose Reward';

    const upgradeReadout = getRewardDossierReadout(
      this.run.upgradeEffects,
      incomingRouteKind ?? 'sectorClear'
    );
    const upgradeNote = document.createElement('p');
    upgradeNote.className = 'screen-upgrade-note';
    upgradeNote.dataset.testid = 'reward-upgrade-note';
    upgradeNote.textContent = upgradeReadout ?? '';

    const rewardGrid = document.createElement('div');
    rewardGrid.className = 'reward-grid';
    rewardGrid.dataset.testid = 'reward-grid';
    rewardGrid.dataset.itemChoiceCount = String(rewardChoices.length);
    rewardGrid.dataset.totalChoiceCount = String(rewardChoices.length + 2);
    rewardGrid.dataset.apexRewardCount = String(
      rewardChoices.filter((choice) => 'apexReward' in choice).length
    );

    for (const choice of rewardChoices) {
      const rewardButton = document.createElement('button');
      rewardButton.className = 'choice-card reward-card';
      rewardButton.type = 'button';
      if ('apexReward' in choice) {
        rewardButton.classList.add('reward-card-apex');
        rewardButton.dataset.testid = 'apex-reward-card';
        rewardButton.dataset.apexThreat = choice.apexReward.threatId;
        const apexFlag = document.createElement('span');
        apexFlag.className = 'reward-card-apex-flag';
        const apexGlyph = createApexGlyph(document);
        apexGlyph.classList.add('apex-glyph-reward');
        apexGlyph.dataset.apexSurface = 'reward-provenance';
        apexFlag.append(apexGlyph, `${choice.apexReward.mapCue} Apex Spoil`);
        rewardButton.append(apexFlag);
        rewardButton.setAttribute(
          'aria-label',
          `Apex spoil from ${choice.apexReward.threatName}: ${choice.item.name}`
        );
      }
      rewardButton.addEventListener('click', () => this.onSelectItem(choice.item.id));

      appendItemCardContent(
        rewardButton,
        createItemCardViewModel(choice.item, {
          sourceLabel: choice.sourceHint
        }),
        { actionLabel: 'Take circuit' }
      );
      rewardGrid.append(rewardButton);
    }

    const primaryWeaponButton = document.createElement('button');
    primaryWeaponButton.className = 'choice-card reward-card component-offer-card';
    primaryWeaponButton.type = 'button';
    primaryWeaponButton.dataset.testid = 'reward-primary-weapon';
    primaryWeaponButton.addEventListener('click', () =>
      this.onSelectPrimaryWeapon(primaryWeaponOffer)
    );
    appendPrimaryWeaponOfferCardContent(primaryWeaponButton, primaryWeaponOffer, installedPrimary, {
      sourceLabel: 'Recovered Armament',
      actionLabel: 'Take Weapon to Cargo'
    });
    rewardGrid.append(primaryWeaponButton);

    const creditsButton = document.createElement('button');
    creditsButton.className = 'choice-card reward-card';
    creditsButton.type = 'button';
    creditsButton.textContent = `Take ${creditReward} Credits`;
    creditsButton.addEventListener('click', this.onTakeCredits);
    rewardGrid.append(creditsButton);

    shell.append(
      eyebrow,
      createContractThemeStrip(this.uiRoot.ownerDocument, theme),
      title,
      ...(upgradeReadout ? [upgradeNote] : []),
      rewardGrid
    );
    this.uiRoot.replaceChildren(shell);
    rewardGrid.querySelector<HTMLButtonElement>('button')?.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action !== 'confirm') {
      return;
    }

    const incomingRouteKind = getIncomingRewardRouteKind(
      this.session,
      this.session.currentSectorIndex
    );
    const firstReward = generateSectorRewardChoices({
      run: this.run,
      session: this.session,
      contract: this.contract,
      ...(incomingRouteKind ? { routeKind: incomingRouteKind } : {})
    })[0];

    if (firstReward) {
      this.onSelectItem(firstReward.item.id);
    } else {
      this.onTakeCredits();
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
