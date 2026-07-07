import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { ItemId } from '../content/items';
import type { RouteOption, RunSkeleton, StartingContract } from '../game/Generation';
import { generateSectorRewardChoices } from '../game/SectorRewards';
import { getCurrentSector, getRouteCreditReward, type RunSessionState } from '../game/RunSession';
import { getRewardDossierReadout, getRunUpgradeDebugLabels } from '../game/UpgradeEffects';
import type { InputAction } from '../systems/InputSystem';
import {
  applyContractScreenTheme,
  createContractScreenThemeModel,
  createContractThemeDebugState,
  createContractThemeStrip,
  getContractThemeOptions
} from './ContractTheme';

export class RewardScene implements Scene {
  public readonly id = 'reward';

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly run: RunSkeleton,
    private readonly session: RunSessionState,
    private readonly contract: StartingContract,
    private readonly route: RouteOption,
    private readonly onSelectItem: (itemId: ItemId) => void,
    private readonly onTakeCredits: () => void
  ) {}

  public enter(): void {
    const sector = getCurrentSector(this.run, this.session);
    const creditReward = getRouteCreditReward(this.session, sector.index);
    const rewardChoices = generateSectorRewardChoices({
      run: this.run,
      session: this.session,
      contract: this.contract,
      routeKind: this.route.kind
    });

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
    eyebrow.textContent = `${sector.sectorName} | ${this.route.label} Reward`;

    const title = document.createElement('h1');
    title.id = 'reward-title';
    title.textContent = 'Choose Reward';

    const upgradeReadout = getRewardDossierReadout(this.run.upgradeEffects, this.route.kind);
    const upgradeNote = document.createElement('p');
    upgradeNote.className = 'screen-upgrade-note';
    upgradeNote.dataset.testid = 'reward-upgrade-note';
    upgradeNote.textContent = upgradeReadout ?? '';

    const rewardGrid = document.createElement('div');
    rewardGrid.className = 'reward-grid';

    for (const choice of rewardChoices) {
      const rewardButton = document.createElement('button');
      rewardButton.className = 'choice-card reward-card';
      rewardButton.type = 'button';
      rewardButton.addEventListener('click', () => this.onSelectItem(choice.item.id));

      const name = document.createElement('span');
      name.className = 'choice-title';
      name.textContent = `Take ${choice.item.name}`;

      const meta = document.createElement('span');
      meta.className = 'choice-meta';
      meta.textContent = `${choice.item.rarity} | ${choice.sourceHint}`;

      const body = document.createElement('span');
      body.className = 'choice-body';
      body.textContent = choice.item.effect;

      rewardButton.append(name, meta, body);
      rewardGrid.append(rewardButton);
    }

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

    const firstReward = generateSectorRewardChoices({
      run: this.run,
      session: this.session,
      contract: this.contract,
      routeKind: this.route.kind
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
