import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { CarrierPlan, CarrierState } from '../game/CarrierCommand';
import { createCarrierInfluence } from '../game/CarrierCommand';
import type { CrewRosterState } from '../game/CrewCommand';
import type { EngineeringState } from '../game/Foundry';
import { getCargoComponents } from '../game/Foundry';
import type { StartingContract } from '../game/Generation';
import {
  createFleetCommandOptions,
  createFleetDebugState,
  createFleetReadModel,
  type FleetCommandOption,
  type FleetPlan,
  type FleetState
} from '../game/Fleetcraft';
import type { InputAction } from '../systems/InputSystem';
import {
  applyContractScreenTheme,
  createContractScreenThemeModel,
  createContractThemeDebugState,
  createContractThemeStrip,
  getContractThemeOptions
} from './ContractTheme';

export class FleetBayScene implements Scene {
  public readonly id = 'fleet-bay';
  private readonly buttons: HTMLButtonElement[] = [];

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly plan: FleetPlan,
    private readonly state: FleetState,
    private readonly carrierPlan: CarrierPlan,
    private readonly carrierState: CarrierState,
    private readonly crewState: CrewRosterState,
    private readonly engineering: EngineeringState,
    private readonly contract: StartingContract,
    private readonly sectorIndex: number,
    private readonly salvage: number,
    private readonly onCommand: (option: FleetCommandOption) => void,
    private readonly onBack: () => void
  ) {}

  public enter(): void {
    const carrier = createCarrierInfluence(this.carrierPlan, this.carrierState);
    const components = getCargoComponents(this.engineering.committed);
    const readout = createFleetReadModel({
      plan: this.plan,
      state: this.state,
      berthCapacity: carrier.supportCapacity,
      cargoComponentIds: components.map((component) => component.id),
      salvage: this.salvage
    });
    const foundryAvailable = this.carrierState.facilities.some(
      (facility) =>
        facility.type === 'foundry' && facility.powered && facility.condition === 'operational'
    );
    const options = createFleetCommandOptions({
      plan: this.plan,
      state: this.state,
      berthCapacity: carrier.supportCapacity,
      cargoComponentIds: components.map((component) => component.id),
      salvage: this.salvage,
      foundryAvailable,
      crewState: this.crewState
    });
    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide junction-panel';
    shell.dataset.testid = 'fleet-bay';
    shell.setAttribute('aria-labelledby', 'fleet-bay-title');
    const theme = createContractScreenThemeModel(
      this.contract,
      getContractThemeOptions(this.uiRoot.ownerDocument)
    );
    applyContractScreenTheme(shell, theme);

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `Fleetcraft | Sector ${this.sectorIndex + 1} | Salvage ${this.salvage}`;
    const title = document.createElement('h1');
    title.id = 'fleet-bay-title';
    title.textContent = 'Pocket Hangar Fleet Bay';
    const summary = document.createElement('p');
    summary.className = 'transition-copy';
    summary.dataset.testid = 'fleet-capacity';
    summary.textContent = `${readout.capacity}. ${readout.summary}. Combined combat ceiling: four crew-plus-fleet allies and twenty ally projectiles.`;

    const roster = document.createElement('ul');
    roster.className = 'operational-itinerary';
    roster.dataset.testid = 'fleet-roster';
    roster.setAttribute('aria-label', 'Support craft roster');
    for (const line of readout.craft) {
      const item = document.createElement('li');
      item.className = `operational-node ${line.includes(': ready') ? 'operational-node-available' : 'operational-node-blocked'}`;
      item.textContent = line;
      roster.append(item);
    }

    const actions = document.createElement('div');
    actions.className = 'junction-grid';
    this.buttons.length = 0;
    for (const option of options) {
      const button = document.createElement('button');
      button.className = 'choice-card junction-card';
      button.type = 'button';
      button.dataset.testid = option.id;
      button.disabled = option.disabled;
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
    if (options.length === 0) {
      const blocked = document.createElement('p');
      blocked.className = 'transition-copy';
      blocked.textContent =
        carrier.supportCapacity === 0
          ? 'No powered hangar berth. Replace, repair, power, or upgrade a carrier hangar first.'
          : 'No fleet action is currently available. Salvaged components enable construction and refit.';
      actions.append(blocked);
    }

    const back = document.createElement('button');
    back.className = 'primary-button';
    back.type = 'button';
    back.dataset.testid = 'fleet-bay-back';
    back.textContent = 'Return To Command Deck';
    back.addEventListener('click', this.onBack);
    this.buttons.push(back);
    shell.append(
      eyebrow,
      createContractThemeStrip(this.uiRoot.ownerDocument, theme),
      title,
      summary,
      roster,
      actions,
      back
    );
    this.uiRoot.replaceChildren(shell);
    (this.buttons.find((button) => !button.disabled) ?? back).focus();
  }

  public update(_dt: number): void {}
  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'back' || action === 'pause') this.onBack();
    if (action === 'confirm') {
      const focused = this.uiRoot.ownerDocument.activeElement;
      (
        this.buttons.find((button) => button === focused) ??
        this.buttons.find((button) => !button.disabled)
      )?.click();
    }
  }

  public getDebugState(): SceneDebugState {
    return {
      seed: this.plan.id,
      entityCount: 0,
      progression: { runSalvage: this.salvage },
      contractTheme: createContractThemeDebugState(this.contract),
      fleet: createFleetDebugState(this.plan, this.state)
    };
  }
}
