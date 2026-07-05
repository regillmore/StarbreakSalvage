import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { RunSkeleton, StartingContract } from '../game/Generation';
import { getCurrentSector, type RunSessionState } from '../game/RunSession';
import {
  applySectorConditionsToScroll,
  createSectorConditionPlan,
  formatSectorConditionReadout
} from '../game/SectorConditions';
import type { InputAction } from '../systems/InputSystem';
import {
  applyContractScreenTheme,
  createContractScreenThemeModel,
  createContractThemeDebugState,
  createContractThemeStrip,
  getContractThemeOptions
} from './ContractTheme';

export class SectorTransitionScene implements Scene {
  public readonly id = 'sector-transition';

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly run: RunSkeleton,
    private readonly session: RunSessionState,
    private readonly contract: StartingContract,
    private readonly onEnterSector: () => void
  ) {}

  public enter(): void {
    const sector = getCurrentSector(this.run, this.session);
    const conditions = createSectorConditionPlan({
      run: this.run,
      sectorIndex: this.session.currentSectorIndex,
      routeOutcomes: this.session.routeOutcomes
    });
    const scroll = applySectorConditionsToScroll(sector.scroll, conditions);
    const shell = document.createElement('main');
    shell.className = 'scene-panel transition-panel';
    shell.setAttribute('aria-labelledby', 'transition-title');
    const theme = createContractScreenThemeModel(
      this.contract,
      getContractThemeOptions(this.uiRoot.ownerDocument)
    );
    applyContractScreenTheme(shell, theme);

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `Sector ${sector.index} | ${sector.bossName}`;

    const title = document.createElement('h1');
    title.id = 'transition-title';
    title.textContent = `Entering ${sector.sectorName}`;

    const routeLine = document.createElement('p');
    routeLine.className = 'transition-copy';
    routeLine.textContent = `Credits ${this.session.credits} | Salvage ${this.session.salvage} | Hull Patch +${this.session.hullPatch} | Curse ${this.session.curse}`;

    const objectiveLine = document.createElement('p');
    objectiveLine.className = 'transition-copy';
    objectiveLine.textContent = `${sector.objective.label} | Travel ${Math.floor(
      scroll.length
    )}u | ${sector.objective.requiredEnemyKills} targets${
      sector.objective.bossRequired ? ' + boss gate' : ''
    }`;

    const conditionLine = document.createElement('p');
    conditionLine.className = 'transition-copy';
    conditionLine.textContent = `${formatSectorConditionReadout(
      conditions
    )} | Cruise ${Math.round(scroll.baseSpeed)}u/s`;

    const waveLine = document.createElement('p');
    waveLine.className = 'transition-copy';
    waveLine.textContent = sector.majorWaves.join(' | ');

    const enterButton = document.createElement('button');
    enterButton.className = 'primary-button';
    enterButton.type = 'button';
    enterButton.textContent = 'Enter Sector';
    enterButton.addEventListener('click', this.onEnterSector);

    shell.append(
      eyebrow,
      createContractThemeStrip(this.uiRoot.ownerDocument, theme),
      title,
      routeLine,
      objectiveLine,
      conditionLine,
      waveLine,
      enterButton
    );
    this.uiRoot.replaceChildren(shell);
    enterButton.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'confirm') {
      this.onEnterSector();
    }
  }

  public getDebugState(): SceneDebugState {
    return {
      seed: this.run.seed,
      entityCount: 0,
      contractTheme: createContractThemeDebugState(this.contract)
    };
  }
}
