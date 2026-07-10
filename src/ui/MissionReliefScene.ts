import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { StartingContract } from '../game/Generation';
import type { MissionDebugState, MissionReadModel } from '../game/MissionDirector';
import type { InputAction } from '../systems/InputSystem';
import {
  applyContractScreenTheme,
  createContractScreenThemeModel,
  createContractThemeStrip,
  getContractThemeOptions
} from './ContractTheme';

export class MissionReliefScene implements Scene {
  public readonly id = 'mission-relief';

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly seed: string,
    private readonly contract: StartingContract,
    private readonly mission: MissionReadModel,
    private readonly debugState: MissionDebugState,
    private readonly hull: number | null,
    private readonly credits: number,
    private readonly salvage: number,
    private readonly onContinue: () => void
  ) {}

  public enter(): void {
    const shell = document.createElement('main');
    shell.className = 'scene-panel transition-panel mission-transition-panel';
    shell.dataset.testid = 'mission-relief';
    shell.setAttribute('aria-labelledby', 'mission-relief-title');
    const theme = createContractScreenThemeModel(
      this.contract,
      getContractThemeOptions(this.uiRoot.ownerDocument)
    );
    applyContractScreenTheme(shell, theme);

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = 'Pressure clear | Extraction channel open';

    const title = document.createElement('h1');
    title.id = 'mission-relief-title';
    title.textContent = this.mission.stageLabel;

    const status = document.createElement('p');
    status.className = 'transition-copy';
    status.textContent = `Checkpoint hull ${this.hull ?? 'reset'} | Credits ${this.credits} | Salvage ${this.salvage}`;

    const copy = document.createElement('p');
    copy.className = 'transition-copy';
    copy.textContent = `${this.mission.reliefCopy} Combat state is settled exactly once; review the route claim before leaving this mission.`;

    const button = document.createElement('button');
    button.className = 'primary-button';
    button.type = 'button';
    button.dataset.testid = 'mission-relief-continue';
    button.textContent = 'Proceed to Extraction';
    button.addEventListener('click', this.onContinue);

    shell.append(
      eyebrow,
      createContractThemeStrip(this.uiRoot.ownerDocument, theme),
      title,
      status,
      copy,
      button
    );
    this.uiRoot.replaceChildren(shell);
    button.focus();
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
    return { seed: this.seed, entityCount: 0, mission: this.debugState };
  }
}
