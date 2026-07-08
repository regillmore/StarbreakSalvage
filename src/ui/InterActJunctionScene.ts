import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { RunActPlan } from '../game/ActPlan';
import {
  formatInterActEffectsReadout,
  type InterActChoice
} from '../game/InterActJunction';
import { getInterActEffectsForSector, type RunSessionState } from '../game/RunSession';
import type { RunSkeleton, StartingContract } from '../game/Generation';
import type { InputAction } from '../systems/InputSystem';
import {
  applyContractScreenTheme,
  createContractScreenThemeModel,
  createContractThemeDebugState,
  createContractThemeStrip,
  getContractThemeOptions
} from './ContractTheme';

export class InterActJunctionScene implements Scene {
  public readonly id = 'inter-act-junction';
  private readonly choiceButtons: HTMLButtonElement[] = [];

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly run: RunSkeleton,
    private readonly session: RunSessionState,
    private readonly contract: StartingContract,
    private readonly sourceAct: RunActPlan,
    private readonly targetAct: RunActPlan,
    private readonly choices: readonly InterActChoice[],
    private readonly onSelectChoice: (choice: InterActChoice) => void,
    private readonly onAbandon: () => void
  ) {}

  public enter(): void {
    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide junction-panel';
    shell.setAttribute('aria-labelledby', 'junction-title');
    const theme = createContractScreenThemeModel(
      this.contract,
      getContractThemeOptions(this.uiRoot.ownerDocument)
    );
    applyContractScreenTheme(shell, theme);

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `${this.sourceAct.shortLabel} Complete | Credits ${this.session.credits} | Salvage ${this.session.salvage}`;

    const title = document.createElement('h1');
    title.id = 'junction-title';
    title.textContent = 'Midpoint Refit';

    const summary = document.createElement('p');
    summary.className = 'transition-copy';
    summary.textContent = `${this.sourceAct.label} secured. Choose one refit before ${this.targetAct.label}.`;

    const targetLine = document.createElement('p');
    targetLine.className = 'transition-copy';
    targetLine.textContent = `Next: ${this.targetAct.shortLabel} ${this.targetAct.label} | ${this.targetAct.sectorCount} sectors | ${this.targetAct.rewardTier} rewards | ${this.targetAct.pressureTier} pressure`;

    const choiceGrid = document.createElement('div');
    choiceGrid.className = 'junction-grid';

    this.choiceButtons.length = 0;

    for (const choice of this.choices) {
      const choiceButton = document.createElement('button');
      choiceButton.className = 'choice-card junction-card';
      choiceButton.type = 'button';
      choiceButton.dataset.testid = `junction-choice-${choice.kind}`;
      choiceButton.addEventListener('click', () => this.onSelectChoice(choice));

      const name = document.createElement('span');
      name.className = 'choice-title';
      name.textContent = choice.label;

      const meta = document.createElement('span');
      meta.className = 'choice-meta';
      meta.textContent = choice.meta;

      const summaryLine = document.createElement('span');
      summaryLine.className = 'choice-body';
      summaryLine.textContent = choice.summary;

      const detail = document.createElement('span');
      detail.className = 'choice-body';
      detail.textContent = choice.detail;

      choiceButton.append(name, meta, summaryLine, detail);
      choiceGrid.append(choiceButton);
      this.choiceButtons.push(choiceButton);
    }

    const controls = document.createElement('div');
    controls.className = 'button-row';

    const abandonButton = document.createElement('button');
    abandonButton.className = 'secondary-button';
    abandonButton.type = 'button';
    abandonButton.textContent = 'Abandon Contract';
    abandonButton.addEventListener('click', this.onAbandon);

    controls.append(abandonButton);
    shell.append(
      eyebrow,
      createContractThemeStrip(this.uiRoot.ownerDocument, theme),
      title,
      summary,
      targetLine,
      choiceGrid,
      controls
    );
    this.uiRoot.replaceChildren(shell);
    this.choiceButtons[0]?.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'confirm') {
      const choice = this.choices[0];

      if (choice) {
        this.onSelectChoice(choice);
      }
      return;
    }

    if (action === 'back' || action === 'pause') {
      this.onAbandon();
    }
  }

  public getDebugState(): SceneDebugState {
    const currentSector = this.run.sectors[this.session.currentSectorIndex];
    const effects = currentSector
      ? getInterActEffectsForSector(this.session, currentSector)
      : null;

    return {
      seed: this.run.seed,
      entityCount: 0,
      act: {
        id: this.targetAct.id,
        name: this.targetAct.label,
        shortLabel: this.targetAct.shortLabel,
        index: this.targetAct.index,
        sectorIndex: 1,
        sectorCount: this.targetAct.sectorCount,
        rewardTier: this.targetAct.rewardTier,
        pressureTier: this.targetAct.pressureTier,
        bossGate: this.targetAct.bossGate.kind,
        transition: this.targetAct.transition.kind
      },
      interAct: {
        targetAct: this.targetAct.label,
        choices: this.choices.map((choice) => choice.label),
        applied: effects ? formatInterActEffectsReadout(effects) : null
      },
      progression: {
        runCredits: this.session.credits,
        runSalvage: this.session.salvage
      },
      contractTheme: createContractThemeDebugState(this.contract)
    };
  }
}
