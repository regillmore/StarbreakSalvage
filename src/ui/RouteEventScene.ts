import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { StartingContract } from '../game/Generation';
import { describeRouteOutcome, type AppliedRouteOutcome } from '../game/RouteEvents';
import type { InputAction } from '../systems/InputSystem';
import {
  applyContractScreenTheme,
  createContractScreenThemeModel,
  createContractThemeDebugState,
  createContractThemeStrip,
  getContractThemeOptions
} from './ContractTheme';

export class RouteEventScene implements Scene {
  public readonly id = 'route-event';

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly outcome: AppliedRouteOutcome,
    private readonly contract: StartingContract,
    private readonly onContinue: () => void
  ) {}

  public enter(): void {
    const shell = document.createElement('main');
    shell.className = 'scene-panel transition-panel';
    shell.setAttribute('aria-labelledby', 'route-event-title');
    const theme = createContractScreenThemeModel(
      this.contract,
      getContractThemeOptions(this.uiRoot.ownerDocument)
    );
    applyContractScreenTheme(shell, theme);

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `${this.outcome.routeLabel} | ${describeRouteOutcome(this.outcome)}`;

    const title = document.createElement('h1');
    title.id = 'route-event-title';
    title.textContent = this.outcome.title;

    const summary = document.createElement('p');
    summary.className = 'transition-copy';
    summary.textContent = this.outcome.summary;

    const details = document.createElement('dl');
    details.className = 'summary-stats';

    for (const [index, detail] of this.outcome.details.entries()) {
      const term = document.createElement('dt');
      term.textContent = `Effect ${index + 1}`;

      const description = document.createElement('dd');
      description.textContent = detail;

      details.append(term, description);
    }

    const continueButton = document.createElement('button');
    continueButton.className = 'primary-button';
    continueButton.type = 'button';
    continueButton.textContent = 'Continue';
    continueButton.addEventListener('click', this.onContinue);

    shell.append(
      eyebrow,
      createContractThemeStrip(this.uiRoot.ownerDocument, theme),
      title,
      summary,
      details,
      continueButton
    );
    this.uiRoot.replaceChildren(shell);
    continueButton.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'confirm') {
      this.onContinue();
    }
  }

  public getDebugState(): SceneDebugState {
    return {
      seed: this.outcome.id,
      entityCount: 0,
      contractTheme: createContractThemeDebugState(this.contract)
    };
  }
}
