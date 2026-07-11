import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { StartingContract } from '../game/Generation';
import type { ExpeditionBranchOption, ExpeditionGraph } from '../game/ExpeditionTypes';
import {
  createOperationalMapReadModel,
  type OperationalProgressState
} from '../game/OperationalMap';
import type { ExpeditionProgressState } from '../game/ExpeditionTypes';
import type {
  MissionDebugState,
  MissionDirectorState,
  MissionReadModel,
  MissionSchedule
} from '../game/MissionDirector';
import { getMissionStage } from '../game/MissionDirector';
import type { InputAction } from '../systems/InputSystem';
import {
  applyContractScreenTheme,
  createContractScreenThemeModel,
  createContractThemeStrip,
  getContractThemeOptions
} from './ContractTheme';

export class OperationalMapScene implements Scene {
  public readonly id = 'operational-map';
  private readonly actionButtons: HTMLButtonElement[] = [];

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly graph: ExpeditionGraph,
    private readonly expedition: ExpeditionProgressState,
    private readonly operational: OperationalProgressState,
    private readonly schedule: MissionSchedule,
    private readonly missionState: MissionDirectorState,
    private readonly contract: StartingContract,
    private readonly mission: MissionReadModel,
    private readonly debugState: MissionDebugState,
    private readonly options: readonly ExpeditionBranchOption[],
    private readonly credits: number,
    private readonly salvage: number,
    private readonly onSelect: (option: ExpeditionBranchOption) => void,
    private readonly onContinue: () => void,
    private readonly consequenceCopy: string | null = null
  ) {}

  public enter(): void {
    const currentStage = getMissionStage(this.schedule, this.missionState.currentStageId);
    const map = createOperationalMapReadModel({
      graph: this.graph,
      sectorIndex: this.schedule.sectorIndex,
      expedition: this.expedition,
      operational: this.operational,
      currentNodeId: currentStage.nodeId
    });
    const choosing = this.options.length > 0;
    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide operational-map-panel';
    shell.dataset.testid = choosing ? 'mission-branch' : 'mission-relief';
    shell.setAttribute('aria-labelledby', 'operational-map-title');
    const theme = createContractScreenThemeModel(
      this.contract,
      getContractThemeOptions(this.uiRoot.ownerDocument)
    );
    applyContractScreenTheme(shell, theme);

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `Operational map | Credits ${this.credits} | Salvage ${this.salvage} | ${map.operationRange}`;

    const title = document.createElement('h1');
    title.id = 'operational-map-title';
    title.textContent = `${map.sectorName}: ${this.mission.stageLabel}`;

    const copy = document.createElement('p');
    copy.className = 'transition-copy';
    copy.dataset.testid = 'operational-map-summary';
    copy.textContent = `${map.summary}. Estimates communicate bands, not exact encounters.${
      this.consequenceCopy ? ` ${this.consequenceCopy}` : ''
    }`;

    const itinerary = document.createElement('ol');
    itinerary.className = 'operational-itinerary';
    itinerary.setAttribute('aria-label', `${map.sectorName} operation itinerary`);
    for (const node of map.nodes) {
      const card = document.createElement('li');
      card.className = `operational-node operational-node-${node.status}`;
      card.dataset.role = node.role;
      card.dataset.status = node.status;

      const heading = document.createElement('strong');
      heading.textContent = `${node.label}${node.optional ? ' — optional' : ''}`;
      const meta = document.createElement('span');
      meta.textContent = `${node.status} | ${node.timeEstimate} | danger ${node.danger} | ${node.reward}`;
      const consequence = document.createElement('span');
      consequence.textContent = `${node.consequence} ${node.risks}`;
      card.append(heading, meta, consequence);
      itinerary.append(card);
    }

    const actions = document.createElement('div');
    actions.className = 'operational-map-actions';
    this.actionButtons.length = 0;
    if (choosing) {
      for (const option of this.options) {
        const button = document.createElement('button');
        button.className = 'choice-card route-card';
        button.type = 'button';
        button.dataset.testid = `mission-branch-${option.default ? 'direct' : 'optional'}`;
        button.addEventListener('click', () => this.onSelect(option));

        const label = document.createElement('span');
        label.className = 'choice-title';
        label.textContent = option.label;
        const meta = document.createElement('span');
        meta.className = 'choice-meta';
        meta.textContent = option.default
          ? 'Required route | lower exposure'
          : 'Optional operation | state and checkpoint carry';
        const body = document.createElement('span');
        body.className = 'choice-body';
        body.textContent = option.summary;
        button.append(label, meta, body);
        actions.append(button);
        this.actionButtons.push(button);
      }
    } else {
      const button = document.createElement('button');
      button.className = 'primary-button';
      button.type = 'button';
      button.dataset.testid = 'mission-relief-continue';
      button.textContent =
        currentStage.operationalRole === 'staging'
          ? 'Launch Gate Operation'
          : 'Proceed to Extraction';
      button.addEventListener('click', this.onContinue);
      actions.append(button);
      this.actionButtons.push(button);
    }

    shell.append(
      eyebrow,
      createContractThemeStrip(this.uiRoot.ownerDocument, theme),
      title,
      copy,
      itinerary,
      actions
    );
    this.uiRoot.replaceChildren(shell);
    this.actionButtons[0]?.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action !== 'confirm') return;
    const focused = this.uiRoot.ownerDocument.activeElement;
    const button = this.actionButtons.find((candidate) => candidate === focused);
    (button ?? this.actionButtons[0])?.click();
  }

  public getDebugState(): SceneDebugState {
    return { seed: this.graph.seed, entityCount: 0, mission: this.debugState };
  }
}
