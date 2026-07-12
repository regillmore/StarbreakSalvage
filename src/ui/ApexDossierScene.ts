import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { ApexOutcome } from '../content/apexThreats';
import {
  createApexCampaignReadModel,
  createApexDebugState,
  type ApexFinaleProfile,
  type ApexHuntPlan,
  type ApexHuntState
} from '../game/ApexHunt';
import type { InputAction } from '../systems/InputSystem';

export class ApexDossierScene implements Scene {
  public readonly id = 'apex-dossier';

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly plan: ApexHuntPlan,
    private readonly state: ApexHuntState,
    private readonly sectorIndex: number,
    private readonly resolution: ApexFinaleProfile | null,
    private readonly onResolve: ((outcome: ApexOutcome) => void) | null,
    private readonly onBack: () => void
  ) {}

  public enter(): void {
    const model = createApexCampaignReadModel(this.plan, this.state, this.sectorIndex);
    const shell = document.createElement('main');
    shell.className = 'scene-panel';
    shell.dataset.testid = 'apex-dossier';
    shell.setAttribute('aria-labelledby', 'apex-title');

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = 'Roaming Apex Dossier';
    const title = document.createElement('h1');
    title.id = 'apex-title';
    title.textContent = this.resolution
      ? `Disposition: ${this.resolution.bossName}`
      : 'Persistent Threat Registry';
    const summary = document.createElement('p');
    summary.textContent = model.summary;
    const roster = document.createElement('ul');
    roster.dataset.testid = 'apex-threats';
    for (const threat of model.threats) {
      const item = document.createElement('li');
      item.textContent = threat;
      roster.append(item);
    }
    const next = document.createElement('p');
    next.textContent = model.nextEncounters.length > 0
      ? `Signals: ${model.nextEncounters.join(' | ')}`
      : 'Signals: no unresolved pursuit contacts ahead.';
    shell.append(eyebrow, title, summary, roster, next);

    if (this.resolution) {
      const integrity = document.createElement('p');
      integrity.textContent = `${this.resolution.integrityReadout} | ${this.resolution.subsystemReadout}`;
      const budget = document.createElement('p');
      budget.dataset.testid = 'apex-budget';
      budget.textContent = `${this.resolution.budget} | escape risk ${this.resolution.escapeRisk}/6`;
      const choices = document.createElement('div');
      choices.className = 'choice-list';
      choices.setAttribute('aria-label', 'Apex disposition choices');
      for (const option of this.resolution.options) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = option.available ? 'primary-button' : 'secondary-button';
        button.dataset.testid = `apex-resolution-${option.outcome}`;
        button.disabled = !option.available || this.onResolve === null;
        button.textContent = `${option.label} — ${option.summary} Risk: ${option.risk} ${option.requirement}`;
        button.addEventListener('click', () => this.onResolve?.(option.outcome));
        choices.append(button);
      }
      shell.append(integrity, budget, choices);
    }

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'secondary-button';
    back.textContent = 'Back';
    back.hidden = this.onResolve !== null;
    back.addEventListener('click', this.onBack);
    shell.append(back);
    this.uiRoot.replaceChildren(shell);
    (shell.querySelector('button:not(:disabled):not([hidden])') as HTMLButtonElement | null)?.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'confirm') {
      const focused = this.uiRoot.ownerDocument.activeElement;
      if (focused instanceof HTMLButtonElement) focused.click();
    } else if ((action === 'back' || action === 'pause') && this.onResolve === null) {
      this.onBack();
    }
  }

  public getDebugState(): SceneDebugState {
    return {
      seed: this.plan.seed,
      entityCount: 0,
      apex: createApexDebugState(this.plan, this.state)
    };
  }
}
