import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { RouteOption, RunSkeleton, StartingContract } from '../game/Generation';
import { getCurrentSector, type RunSessionState } from '../game/RunSession';
import type { InputAction } from '../systems/InputSystem';
import {
  applyContractScreenTheme,
  createContractScreenThemeModel,
  createContractThemeDebugState,
  createContractThemeStrip,
  getContractThemeOptions
} from './ContractTheme';

export class RouteScene implements Scene {
  public readonly id = 'route';
  private readonly routeButtons: HTMLButtonElement[] = [];

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly run: RunSkeleton,
    private readonly session: RunSessionState,
    private readonly contract: StartingContract,
    private readonly onSelectRoute: (route: RouteOption) => void
  ) {}

  public enter(): void {
    const sector = getCurrentSector(this.run, this.session);
    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide route-panel';
    shell.setAttribute('aria-labelledby', 'route-title');
    const theme = createContractScreenThemeModel(
      this.contract,
      getContractThemeOptions(this.uiRoot.ownerDocument)
    );
    applyContractScreenTheme(shell, theme);

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `Sector ${sector.index} Cleared | Credits ${this.session.credits} | Salvage ${this.session.salvage}`;

    const title = document.createElement('h1');
    title.id = 'route-title';
    title.textContent = 'Choose Route';

    const routeGrid = document.createElement('div');
    routeGrid.className = 'route-grid';

    this.routeButtons.length = 0;

    for (const route of sector.routeOptions) {
      const routeButton = document.createElement('button');
      routeButton.className = 'choice-card route-card';
      routeButton.type = 'button';
      routeButton.dataset.testid = `route-${route.kind}`;
      routeButton.addEventListener('click', () => this.onSelectRoute(route));

      const name = document.createElement('span');
      name.className = 'choice-title';
      name.textContent = route.label;

      const risk = document.createElement('span');
      risk.className = 'choice-meta';
      risk.textContent = `Risk ${route.risk}`;

      const hint = document.createElement('span');
      hint.className = 'choice-body';
      hint.textContent = route.rewardHint;

      routeButton.append(name, risk, hint);
      routeGrid.append(routeButton);
      this.routeButtons.push(routeButton);
    }

    shell.append(eyebrow, createContractThemeStrip(this.uiRoot.ownerDocument, theme), title, routeGrid);
    this.uiRoot.replaceChildren(shell);
    this.routeButtons[0]?.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action !== 'confirm') {
      return;
    }

    const sector = getCurrentSector(this.run, this.session);
    const firstRoute = sector.routeOptions[0];

    if (firstRoute) {
      this.onSelectRoute(firstRoute);
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
