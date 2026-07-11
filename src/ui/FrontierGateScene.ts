import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { RunActPlan } from '../game/ActPlan';
import type { RunSkeleton, StartingContract } from '../game/Generation';
import type { RunSessionState } from '../game/RunSession';
import { formatFrontierCampaign } from '../game/NullFrontier';
import type { InputAction } from '../systems/InputSystem';
import {
  applyContractScreenTheme,
  createContractScreenThemeModel,
  createContractThemeDebugState,
  createContractThemeStrip,
  getContractThemeOptions
} from './ContractTheme';

export class FrontierGateScene implements Scene {
  public readonly id = 'frontier-gate';

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly run: RunSkeleton,
    private readonly session: RunSessionState,
    private readonly contract: StartingContract,
    private readonly sourceAct: RunActPlan,
    private readonly targetAct: RunActPlan,
    private readonly onExtract: () => void,
    private readonly onBreach: () => void
  ) {}

  public enter(): void {
    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide junction-panel';
    shell.setAttribute('aria-labelledby', 'frontier-gate-title');
    const theme = createContractScreenThemeModel(
      this.contract,
      getContractThemeOptions(this.uiRoot.ownerDocument)
    );
    applyContractScreenTheme(shell, theme);

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `${this.sourceAct.shortLabel} Complete | Core finale cleared`;
    const title = document.createElement('h1');
    title.id = 'frontier-gate-title';
    title.textContent = 'The Frontier Is Optional';
    const summary = document.createElement('p');
    summary.className = 'transition-copy';
    summary.textContent = `${this.sourceAct.label} is a complete victory. Extract now, or carry this ship and every consequence into ${this.targetAct.label}.`;
    const campaign = document.createElement('p');
    campaign.className = 'transition-copy';
    campaign.textContent = formatFrontierCampaign(this.run.frontierCampaign);

    const choices = document.createElement('div');
    choices.className = 'junction-grid';
    const extract = createChoice(
      'frontier-choice-extract',
      'Complete Extraction',
      '+180 credits | +45 kg salvage',
      'End with a confirmed, fully rewarded Core Descent victory.',
      this.onExtract
    );
    const breach = createChoice(
      'frontier-choice-breach',
      'Breach the Frontier',
      '+40 credits | +12 kg launch salvage',
      `Carry the run into five new sectors. Structural target: ${Math.round(this.run.frontierCampaign.standardTargetSeconds / 60)} minutes total.`,
      this.onBreach
    );
    choices.append(extract, breach);
    shell.append(
      eyebrow,
      createContractThemeStrip(this.uiRoot.ownerDocument, theme),
      title,
      summary,
      campaign,
      choices
    );
    this.uiRoot.replaceChildren(shell);
    extract.focus();
  }

  public update(_dt: number): void {}
  public render(renderer: CanvasRenderer, _alpha: number): void { renderer.paintBackground(); }

  public handleAction(action: InputAction): void {
    if (action === 'confirm') this.onExtract();
    if (action === 'back' || action === 'pause') this.onExtract();
  }

  public getDebugState(): SceneDebugState {
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
      progression: { runCredits: this.session.credits, runSalvage: this.session.salvage },
      contractTheme: createContractThemeDebugState(this.contract)
    };
  }
}

function createChoice(
  testId: string,
  label: string,
  meta: string,
  summary: string,
  onSelect: () => void
): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'choice-card junction-card';
  button.type = 'button';
  button.dataset.testid = testId;
  button.addEventListener('click', onSelect);
  const title = document.createElement('span');
  title.className = 'choice-title';
  title.textContent = label;
  const detail = document.createElement('span');
  detail.className = 'choice-meta';
  detail.textContent = meta;
  const body = document.createElement('span');
  body.className = 'choice-body';
  body.textContent = summary;
  button.append(title, detail, body);
  return button;
}
