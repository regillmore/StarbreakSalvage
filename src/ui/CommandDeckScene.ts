import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import { getCarrierFacility } from '../content/carriers';
import {
  createCarrierCommandOptions,
  createCarrierDebugState,
  createCarrierInfluence,
  type CarrierCommandOption,
  type CarrierPlan,
  type CarrierState
} from '../game/CarrierCommand';
import type { CrewRosterPlan, CrewRosterState } from '../game/CrewCommand';
import type { StartingContract } from '../game/Generation';
import type { InputAction } from '../systems/InputSystem';
import {
  applyContractScreenTheme,
  createContractScreenThemeModel,
  createContractThemeDebugState,
  createContractThemeStrip,
  getContractThemeOptions
} from './ContractTheme';

export class CommandDeckScene implements Scene {
  public readonly id = 'command-deck';
  private readonly buttons: HTMLButtonElement[] = [];

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly plan: CarrierPlan,
    private readonly state: CarrierState,
    private readonly crewPlan: CrewRosterPlan,
    private readonly crewState: CrewRosterState,
    private readonly contract: StartingContract,
    private readonly sectorIndex: number,
    private readonly credits: number,
    private readonly salvage: number,
    private readonly onCommand: (option: CarrierCommandOption) => void,
    private readonly onContinue: () => void
  ) {}

  public enter(): void {
    const influence = createCarrierInfluence(this.plan, this.state);
    const options = createCarrierCommandOptions({
      plan: this.plan,
      state: this.state,
      crewPlan: this.crewPlan,
      crewState: this.crewState,
      sectorIndex: this.sectorIndex
    });
    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide junction-panel';
    shell.dataset.testid = 'command-deck';
    shell.setAttribute('aria-labelledby', 'command-deck-title');
    const theme = createContractScreenThemeModel(
      this.contract,
      getContractThemeOptions(this.uiRoot.ownerDocument)
    );
    applyContractScreenTheme(shell, theme);

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `${this.plan.origin === 'recovered' ? 'Recovered' : 'Contracted'} carrier | Credits ${this.credits} | Salvage ${this.salvage}`;
    const title = document.createElement('h1');
    title.id = 'command-deck-title';
    title.textContent = `${this.plan.name} Command Deck`;
    const summary = document.createElement('p');
    summary.className = 'transition-copy';
    summary.dataset.testid = 'carrier-risk-readout';
    summary.textContent = `${this.plan.summary} ${influence.riskLabel}. Posture ${this.state.posture}. Cargo ${influence.cargoUsed}/${influence.cargoCapacity}.`;

    const facilities = document.createElement('ul');
    facilities.className = 'operational-itinerary';
    facilities.setAttribute('aria-label', 'Carrier facilities');
    for (const facility of this.state.facilities) {
      const definition = getCarrierFacility(facility.type);
      const item = document.createElement('li');
      item.className = `operational-node operational-node-${facility.condition === 'operational' ? 'available' : 'blocked'}`;
      item.dataset.facility = facility.type;
      const heading = document.createElement('strong');
      heading.textContent = `${definition.label} L${facility.level}${facility.powered ? ' — powered' : ''}`;
      const detail = document.createElement('span');
      detail.textContent = `${facility.condition} | ${definition.influence}${facility.assignedCrewId ? ` | post ${facility.assignedCrewId}` : ''}`;
      item.append(heading, detail);
      facilities.append(item);
    }

    const actions = document.createElement('div');
    actions.className = 'junction-grid';
    this.buttons.length = 0;
    for (const option of options) {
      const button = document.createElement('button');
      button.className = 'choice-card junction-card';
      button.type = 'button';
      button.dataset.testid = option.id;
      button.disabled = this.credits < option.creditCost || this.salvage < option.salvageCost;
      button.addEventListener('click', () => this.onCommand(option));
      const label = document.createElement('span');
      label.className = 'choice-title';
      label.textContent = option.label;
      const meta = document.createElement('span');
      meta.className = 'choice-meta';
      meta.textContent = option.meta;
      const body = document.createElement('span');
      body.className = 'choice-body';
      body.textContent = option.summary;
      button.append(label, meta, body);
      actions.append(button);
      this.buttons.push(button);
    }

    const continueButton = document.createElement('button');
    continueButton.className = 'primary-button';
    continueButton.type = 'button';
    continueButton.dataset.testid = 'command-deck-continue';
    continueButton.textContent = options.length > 0 ? 'Hold Course Without Changes' : 'Launch Gate Operation';
    continueButton.addEventListener('click', this.onContinue);
    this.buttons.push(continueButton);

    shell.append(
      eyebrow,
      createContractThemeStrip(this.uiRoot.ownerDocument, theme),
      title,
      summary,
      facilities,
      actions,
      continueButton
    );
    this.uiRoot.replaceChildren(shell);
    this.buttons.find((button) => !button.disabled)?.focus();
  }

  public update(_dt: number): void {}
  public render(renderer: CanvasRenderer, _alpha: number): void { renderer.paintBackground(); }

  public handleAction(action: InputAction): void {
    if (action !== 'confirm') return;
    const focused = this.uiRoot.ownerDocument.activeElement;
    (this.buttons.find((button) => button === focused) ?? this.buttons.find((button) => !button.disabled))?.click();
  }

  public getDebugState(): SceneDebugState {
    const carrier = createCarrierDebugState(this.plan, this.state);
    return {
      seed: this.plan.id,
      entityCount: 0,
      progression: { runCredits: this.credits, runSalvage: this.salvage },
      contractTheme: createContractThemeDebugState(this.contract),
      carrier
    };
  }
}
