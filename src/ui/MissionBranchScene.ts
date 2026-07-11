import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { StartingContract } from '../game/Generation';
import type { ExpeditionBranchOption } from '../game/ExpeditionTypes';
import type { MissionDebugState, MissionReadModel } from '../game/MissionDirector';
import type { InputAction } from '../systems/InputSystem';
import {
  applyContractScreenTheme,
  createContractScreenThemeModel,
  createContractThemeStrip,
  getContractThemeOptions
} from './ContractTheme';

export class MissionBranchScene implements Scene {
  public readonly id = 'mission-branch';
  private readonly buttons: HTMLButtonElement[] = [];

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly seed: string,
    private readonly contract: StartingContract,
    private readonly mission: MissionReadModel,
    private readonly debugState: MissionDebugState,
    private readonly options: readonly ExpeditionBranchOption[],
    private readonly credits: number,
    private readonly salvage: number,
    private readonly onSelect: (option: ExpeditionBranchOption) => void,
    private readonly rivalDecisionCopy: string | null = null
  ) {}

  public enter(): void {
    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide route-panel mission-transition-panel';
    shell.dataset.testid = 'mission-branch';
    shell.setAttribute('aria-labelledby', 'mission-branch-title');
    const theme = createContractScreenThemeModel(
      this.contract,
      getContractThemeOptions(this.uiRoot.ownerDocument)
    );
    applyContractScreenTheme(shell, theme);

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `Field decision | Credits ${this.credits} | Salvage ${this.salvage}`;

    const title = document.createElement('h1');
    title.id = 'mission-branch-title';
    title.textContent = this.mission.stageLabel;

    const copy = document.createElement('p');
    copy.className = 'transition-copy';
    const hasOptional = this.options.some((option) => !option.default);
    copy.textContent = `${this.mission.contractTitle}: ${
      this.mission.latestOutcome ? `primary outcome ${this.mission.latestOutcome}. ` : ''
    }${
      hasOptional
        ? 'Extract now or carry the current hull and build into an optional pressure lane.'
        : 'The optional pressure lane is unavailable; bank the outcome and extract.'
    }${this.rivalDecisionCopy ? ` ${this.rivalDecisionCopy}` : ''}`;

    const grid = document.createElement('div');
    grid.className = 'route-grid';
    this.buttons.length = 0;

    for (const option of this.options) {
      const button = document.createElement('button');
      button.className = 'choice-card route-card';
      button.type = 'button';
      button.dataset.testid = `mission-branch-${option.default ? 'direct' : 'optional'}`;
      button.addEventListener('click', () => this.onSelect(option));

      const label = document.createElement('span');
      label.className = 'choice-title';
      label.textContent = option.label;

      const body = document.createElement('span');
      body.className = 'choice-body';
      body.textContent = option.summary;

      const meta = document.createElement('span');
      meta.className = 'choice-meta';
      meta.textContent = option.default
        ? this.rivalDecisionCopy
          ? 'Direct extraction | optional consequence declined'
          : 'Direct extraction'
        : this.rivalDecisionCopy
          ? 'Optional pursuit | consequence attempt'
          : 'Optional encounter | state carries';

      button.append(label, meta, body);
      grid.append(button);
      this.buttons.push(button);
    }

    shell.append(
      eyebrow,
      createContractThemeStrip(this.uiRoot.ownerDocument, theme),
      title,
      copy,
      grid
    );
    this.uiRoot.replaceChildren(shell);
    this.buttons[0]?.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'confirm') {
      const defaultOption = this.options.find((option) => option.default) ?? this.options[0];
      if (defaultOption) {
        this.onSelect(defaultOption);
      }
    }
  }

  public getDebugState(): SceneDebugState {
    return { seed: this.seed, entityCount: 0, mission: this.debugState };
  }
}
