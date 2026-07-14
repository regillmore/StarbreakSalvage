import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { StartingContract } from '../game/Generation';
import {
  createActConstellationPlan,
  type ActConstellationPlan,
  type ActConstellationSource
} from '../game/ActConstellation';
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
  getContractThemeOptions,
  type ContractScreenThemeModel
} from './ContractTheme';
import type { FactionFrontInfluence } from '../game/FactionFront';
import {
  createConstellationMap,
  updateConstellationSelection,
  type ConstellationMapNode
} from './ConstellationMap';

export class OperationalMapScene implements Scene {
  public readonly id = 'operational-map';
  private readonly actionButtons: HTMLButtonElement[] = [];
  private selectedApproachId: string | null = null;
  private approachPlan: ActConstellationPlan | null = null;
  private approachDetailRoot: HTMLElement | null = null;
  private constellationButtons = new Map<string, HTMLButtonElement>();

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
    private readonly consequenceCopy: string | null = null,
    private readonly factionFront: FactionFrontInfluence | null = null
  ) {}

  public enter(): void {
    const currentStage = getMissionStage(this.schedule, this.missionState.currentStageId);
    const map = createOperationalMapReadModel({
      graph: this.graph,
      sectorIndex: this.schedule.sectorIndex,
      expedition: this.expedition,
      operational: this.operational,
      currentNodeId: currentStage.nodeId,
      factionFront: this.factionFront
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

    if (choosing) {
      this.renderApproachConstellation(shell, theme, eyebrow, title, copy);
      return;
    }

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
      const front = document.createElement('span');
      front.textContent = node.frontForecast
        ? `${node.frontDirective?.toUpperCase()}: ${node.frontForecast}`
        : '';
      front.hidden = node.frontForecast === null;
      card.append(heading, meta, consequence, front);
      itinerary.append(card);
    }

    const actions = document.createElement('div');
    actions.className = 'operational-map-actions';
    this.actionButtons.length = 0;
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

  private renderApproachConstellation(
    shell: HTMLElement,
    theme: ContractScreenThemeModel,
    eyebrow: HTMLElement,
    title: HTMLElement,
    copy: HTMLElement
  ): void {
    const sectorPlan = this.graph.sectors.find(
      (sector) => sector.sectorIndex === this.schedule.sectorIndex
    );
    const actPlan = sectorPlan
      ? this.graph.acts.find((act) => act.actId === sectorPlan.actId)
      : null;
    if (!sectorPlan || !actPlan) {
      throw new Error(
        `Approach constellation is unavailable for sector ${this.schedule.sectorIndex + 1}.`
      );
    }
    const source: ActConstellationSource = {
      id: actPlan.actId,
      index: actPlan.actIndex,
      label: actPlan.label,
      shortLabel: actPlan.shortLabel,
      summary: `A shared route chart for ${actPlan.label}.`,
      sectors: actPlan.sectorPlanIds.map((sectorPlanId) => {
        const sector = this.graph.sectors.find((candidate) => candidate.id === sectorPlanId);
        if (!sector) throw new Error(`Constellation sector ${sectorPlanId} is unavailable.`);
        return {
          id: sector.id,
          sectorIndex: sector.sectorIndex,
          sectorName: sector.sectorName
        };
      })
    };
    const constellation = createActConstellationPlan({
      seed: this.graph.seed,
      act: source,
      currentSectorIndex: this.schedule.sectorIndex,
      approaches: this.options.map((option) => ({
        id: option.id,
        label: option.label,
        summary: option.summary,
        default: option.default
      }))
    });
    this.approachPlan = constellation;
    if (!this.options.some((option) => option.id === this.selectedApproachId)) {
      this.selectedApproachId =
        this.options.find((option) => option.default)?.id ?? this.options[0]?.id ?? null;
    }
    const selectedNodeId = `approach:${this.selectedApproachId}`;
    const nodes: ConstellationMapNode[] = constellation.nodes.map((node) => ({
      id: node.id,
      kind: node.kind,
      label: node.label,
      shortLabel: node.shortLabel,
      glyph: node.glyph,
      x: node.x,
      y: node.y,
      status: node.status,
      stateLabel: node.stateLabel,
      selectable: node.kind === 'approach',
      available: node.kind === 'approach' || node.status !== 'hidden',
      visited: node.status === 'completed',
      revealOrder: node.revealOrder,
      testId:
        node.kind === 'approach'
          ? `mission-branch-${node.defaultApproach ? 'direct' : 'optional'}`
          : undefined,
      destinationId: node.id
    }));
    const map = createConstellationMap({
      document: this.uiRoot.ownerDocument,
      ariaLabel: `${actPlan.label} approach constellation`,
      label: `${actPlan.shortLabel} APPROACH`,
      code: constellation.localCode,
      layoutId: constellation.layoutId,
      nodes,
      edges: constellation.edges,
      selectedId: selectedNodeId,
      onSelect: (nodeId) => this.selectApproachNode(nodeId)
    });
    this.constellationButtons = new Map(map.buttons);
    this.approachDetailRoot = document.createElement('section');
    this.approachDetailRoot.className = 'navigation-destination-detail';
    this.approachDetailRoot.dataset.testid = 'approach-constellation-detail';
    this.approachDetailRoot.setAttribute('aria-live', 'polite');
    const workspace = document.createElement('div');
    workspace.className = 'navigation-hub-workspace operational-constellation-workspace';
    workspace.append(map.element, this.approachDetailRoot);

    shell.classList.add('navigation-hub-panel', 'approach-constellation-panel');
    shell.dataset.testid = 'mission-branch';
    eyebrow.textContent = `${actPlan.shortLabel} // ${sectorPlan.sectorName} // APPROACH VECTORS`;
    title.textContent = `${actPlan.label} Constellation`;
    copy.textContent =
      'New vectors have resolved around the active sector. Inspect a connected node, then commit the approach.';
    shell.replaceChildren(
      eyebrow,
      createContractThemeStrip(this.uiRoot.ownerDocument, theme),
      title,
      copy,
      workspace
    );
    this.uiRoot.replaceChildren(shell);
    this.renderApproachDetail();
    this.actionButtons[0]?.focus();
  }

  private selectApproachNode(nodeId: string): void {
    const node = this.approachPlan?.nodes.find(
      (candidate) => candidate.id === nodeId && candidate.kind === 'approach'
    );
    if (!node?.approachId) return;
    this.selectedApproachId = node.approachId;
    updateConstellationSelection(this.constellationButtons, node.id);
    this.renderApproachDetail();
  }

  private renderApproachDetail(): void {
    if (!this.approachDetailRoot || !this.approachPlan || !this.selectedApproachId) return;
    const option = this.options.find((candidate) => candidate.id === this.selectedApproachId);
    const node = this.approachPlan.nodes.find(
      (candidate) => candidate.approachId === this.selectedApproachId
    );
    if (!option || !node) return;
    const target = this.graph.nodes.find((candidate) => candidate.id === option.targetNodeId);

    const heading = document.createElement('div');
    heading.className = 'navigation-detail-heading';
    const identity = document.createElement('div');
    const kicker = document.createElement('p');
    kicker.className = 'eyebrow';
    kicker.textContent = `APPROACH VECTOR // ${option.default ? 'DIRECT' : 'OPTIONAL'}`;
    const title = document.createElement('h2');
    title.textContent = option.label;
    identity.append(kicker, title);
    const status = document.createElement('span');
    status.className = 'navigation-detail-status';
    status.dataset.available = 'true';
    status.textContent = 'AVAILABLE';
    heading.append(identity, status);

    const summary = document.createElement('p');
    summary.className = 'navigation-detail-summary';
    summary.textContent = option.summary;
    const body = document.createElement('div');
    body.className = 'navigation-detail-body';
    body.append(
      this.createApproachMetric(
        'Exposure',
        option.default
          ? 'Required route · lower exposure'
          : 'Optional operation · higher commitment'
      ),
      this.createApproachMetric('Contact', target?.label ?? node.label)
    );
    if (this.consequenceCopy) {
      const context = document.createElement('p');
      context.className = 'transition-copy approach-context-copy';
      context.textContent = this.consequenceCopy;
      body.append(context);
    }
    const action = document.createElement('button');
    action.className = 'primary-button';
    action.type = 'button';
    action.dataset.testid = 'approach-decision-confirm';
    action.textContent = `Commit ${option.label}`;
    action.addEventListener('click', () => this.onSelect(option));
    this.actionButtons.length = 0;
    this.actionButtons.push(action);
    this.approachDetailRoot.replaceChildren(heading, summary, body, action);
  }

  private createApproachMetric(label: string, value: string): HTMLElement {
    const metric = document.createElement('div');
    metric.className = 'navigation-detail-metric';
    const name = document.createElement('small');
    name.textContent = label;
    const readout = document.createElement('strong');
    readout.textContent = value;
    metric.append(name, readout);
    return metric;
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
