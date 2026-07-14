import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import { getMissionObjective } from '../content/objectives';
import type { RouteOption, RunSkeleton, StartingContract } from '../game/Generation';
import { createActDebugState, formatActSectorLabel } from '../game/ActPlan';
import type { ActConstellationNode } from '../game/ActConstellation';
import { formatRouteTagSummary } from '../game/ActTwoDebug';
import { getCurrentSector, type RunSessionState } from '../game/RunSession';
import { applySectorConditionsToScroll, createSectorConditionPlan } from '../game/SectorConditions';
import { applySectorPacingToScroll, createSectorPacingPlan } from '../game/SectorPacing';
import { formatSectorObjectiveVariantDebug } from '../game/SectorObjectives';
import { getRunUpgradeDebugLabels } from '../game/UpgradeEffects';
import type { MissionDebugState, MissionReadModel } from '../game/MissionDirector';
import type { InputAction } from '../systems/InputSystem';
import {
  applyContractScreenTheme,
  createContractScreenThemeModel,
  createContractThemeDebugState,
  createContractThemeStrip,
  getContractThemeOptions
} from './ContractTheme';
import {
  createFactionCampaignDebugState,
  getFactionCampaignInfluence
} from '../game/FactionCampaign';
import { createCrewDebugState } from '../game/CrewCommand';
import { createCrewArcDebugState, createCrewArcRosterReadModel } from '../game/CrewArc';
import { createFleetDebugState, formatFleetSummary } from '../game/Fleetcraft';
import { createApexCampaignReadModel, createApexDebugState } from '../game/ApexHunt';
import { getCargoComponents } from '../game/Foundry';
import { getActiveFittedItems } from '../game/ItemSockets';
import {
  createSectorNavigationPlan,
  recordSectorNavigationVisit,
  type SectorNavigationDestination,
  type SectorNavigationPlan,
  type SectorNavigationServiceLocks
} from '../game/SectorNavigation';
import {
  createConstellationMap,
  updateConstellationSelection,
  type ConstellationMapNode
} from './ConstellationMap';
import {
  createRouteNavigationReadModel,
  type RouteNavigationReadModel
} from '../game/RouteNavigation';

interface NavigationBriefingContext {
  readonly sector: ReturnType<typeof getCurrentSector>;
  readonly conditions: ReturnType<typeof createSectorConditionPlan>;
  readonly pacing: ReturnType<typeof createSectorPacingPlan>;
  readonly scroll: ReturnType<typeof applySectorPacingToScroll>;
  readonly campaign: ReturnType<typeof getFactionCampaignInfluence>;
  readonly crew: ReturnType<typeof createCrewDebugState>;
  readonly crewArcSummary: string;
  readonly fleetSummary: string;
  readonly apex: ReturnType<typeof createApexCampaignReadModel>;
}

export interface PostSectorNavigationOption {
  readonly id: string;
  readonly label: string;
  readonly summary: string;
  readonly available: boolean;
  readonly unavailableReason: string | null;
}

export interface PostSectorNavigationChoice {
  readonly optional: PostSectorNavigationOption;
  readonly onward: PostSectorNavigationOption & { readonly nextSectorIndex: number | null };
  readonly onChoose: (optionId: string) => void;
}

export interface NavigationRouteChoice {
  readonly sourceSectorIndex: number;
  readonly targetSectorIndex: number | null;
  readonly onChoose: (route: RouteOption) => void;
}

export class SectorTransitionScene implements Scene {
  public readonly id = 'sector-transition';
  private selectedNodeId: string | null = null;
  private plan: SectorNavigationPlan | null = null;
  private detailRoot: HTMLElement | null = null;
  private constellationButtons = new Map<string, HTMLButtonElement>();

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly run: RunSkeleton,
    private readonly session: RunSessionState,
    private readonly contract: StartingContract,
    private readonly onEnterSector: () => void,
    private readonly mission: MissionReadModel | null = null,
    private readonly missionDebug: MissionDebugState | null = null,
    private readonly onOpenCrewQuarters: (() => void) | null = null,
    private readonly onOpenFleetBay: (() => void) | null = null,
    private readonly onOpenApexDossier: (() => void) | null = null,
    private readonly onOpenShop: (() => void) | null = null,
    private readonly onOpenHardpoint: (() => void) | null = null,
    private readonly serviceLocks: SectorNavigationServiceLocks = {},
    private readonly postSectorChoice: PostSectorNavigationChoice | null = null,
    private readonly routeChoice: NavigationRouteChoice | null = null
  ) {}

  public enter(): void {
    const context = this.createBriefingContext();
    this.plan = createSectorNavigationPlan({
      run: this.run,
      sectorIndex: this.session.currentSectorIndex,
      serviceLocks: this.createEffectiveServiceLocks()
    });
    if (!this.selectedNodeId || !this.getPlanNodeIds(this.plan).includes(this.selectedNodeId)) {
      this.selectedNodeId = this.routeChoice
        ? (this.getRouteTargetNodeId(this.plan) ?? this.plan.constellation.currentSectorNodeId)
        : this.plan.constellation.currentSectorNodeId;
    }
    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide transition-panel navigation-hub-panel';
    shell.dataset.testid = 'mission-briefing';
    shell.dataset.navigationLayout = this.plan.layoutId;
    shell.setAttribute('aria-labelledby', 'transition-title');
    const theme = createContractScreenThemeModel(
      this.contract,
      getContractThemeOptions(this.uiRoot.ownerDocument)
    );
    applyContractScreenTheme(shell, theme);

    const header = document.createElement('header');
    header.className = 'navigation-hub-header';
    const headingGroup = document.createElement('div');
    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    const routeModel = this.routeChoice ? this.createRouteChoiceModel() : null;
    eyebrow.textContent = routeModel
      ? `${routeModel.actLabel} // ${this.plan.localCode} // ${routeModel.edgeLabel}`
      : `${formatActSectorLabel(context.sector.act)} // ${this.plan.localCode} // ${context.sector.sectorName}`;
    const title = document.createElement('h1');
    title.id = 'transition-title';
    title.textContent = `${this.plan.hubName} Navigation`;
    const subtitle = document.createElement('p');
    subtitle.className = 'navigation-hub-subtitle';
    subtitle.textContent = this.routeChoice
      ? this.postSectorChoice
        ? `${this.run.carrierPlan.name} flight board · Both sectors are ready: hold the cleared node once, or choose a route on the next node.`
        : `${this.run.carrierPlan.name} route plot · Commitment accepted; choose how the ship crosses the highlighted edge.`
      : this.postSectorChoice
        ? `${this.run.carrierPlan.name} act chart · Hold this node once for its paired challenge, or continue along the newly resolved route.`
        : `${this.run.carrierPlan.name} act chart · Future sectors remain unresolved until their routes open; carrier services remain in local orbit.`;
    headingGroup.append(eyebrow, title, subtitle);
    const resources = document.createElement('div');
    resources.className = 'navigation-resource-strip';
    resources.setAttribute('aria-label', 'Run resources');
    resources.append(
      this.createResource('Credits', this.session.credits),
      this.createResource('Salvage', this.session.salvage),
      this.createResource('Hull', `+${this.session.hullPatch}`),
      this.createResource('Curse', this.session.curse)
    );
    header.append(headingGroup, resources);

    const workspace = document.createElement('div');
    workspace.className = 'navigation-hub-workspace';
    const map = this.createNavigationMap(this.plan);
    this.detailRoot = document.createElement('section');
    this.detailRoot.className = 'navigation-destination-detail';
    this.detailRoot.dataset.testid = 'navigation-destination-detail';
    this.detailRoot.setAttribute('aria-live', 'polite');
    workspace.append(map, this.detailRoot);

    const footer = document.createElement('p');
    footer.className = 'navigation-hub-footer';
    footer.textContent = this.routeChoice
      ? this.postSectorChoice
        ? 'TWO READY SECTORS // Cleared node: one optional hold · Next node: three onward routes.'
        : 'ROUTE COMMIT // Choose one travel vector from the settled sector to the next mission signal.'
      : this.postSectorChoice
        ? 'POST-SECTOR HOLD // Optional challenge remains on the cleared node · The active destination continues the expedition.'
        : 'ACT CHART // Future sectors resolve only when travel opens · Unlinked carrier services remain locally available.';

    shell.append(
      header,
      createContractThemeStrip(this.uiRoot.ownerDocument, theme),
      workspace,
      footer
    );
    this.uiRoot.replaceChildren(shell);
    this.renderDestinationDetail(context);
    this.detailRoot
      .querySelector<HTMLButtonElement>(
        '.navigation-route-card, [data-testid="navigation-destination-action"], [data-testid="navigation-optional-action"]'
      )
      ?.focus({ preventScroll: true });
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'confirm') {
      const focused = this.uiRoot.ownerDocument.activeElement;
      if (focused instanceof HTMLButtonElement) focused.click();
      else if (this.selectedNodeId) this.activateNode(this.selectedNodeId);
    }
  }

  public getDebugState(): SceneDebugState {
    const sector = getCurrentSector(this.run, this.session);
    const conditions = createSectorConditionPlan({
      run: this.run,
      sectorIndex: this.session.currentSectorIndex,
      routeOutcomes: this.session.routeOutcomes
    });
    const routeConditionedScroll = applySectorConditionsToScroll(sector.scroll, conditions);
    const pacing = createSectorPacingPlan({
      runSeed: this.run.seed,
      sector,
      sectorIndex: this.session.currentSectorIndex,
      conditions,
      scroll: routeConditionedScroll
    });

    return {
      seed: this.run.seed,
      entityCount: 0,
      act: createActDebugState(sector.act),
      contractTheme: createContractThemeDebugState(this.contract),
      upgradeEffects: getRunUpgradeDebugLabels(this.run.upgradeEffects),
      mission: this.missionDebug ?? undefined,
      factionCampaign: createFactionCampaignDebugState(
        this.run.factionCampaign,
        this.session.factionCampaign,
        getFactionCampaignInfluence(
          this.run.factionCampaign,
          this.session.factionCampaign,
          sector,
          { plan: this.run.factionFronts, state: this.session.factionFronts }
        )
      ),
      crew: {
        activeCommand: 'briefing',
        commandCooldown: 0,
        issuedCommands: 0,
        allies: createCrewDebugState(this.run.crewRoster, this.session.crewRoster).roster
      },
      crewArcs: createCrewArcDebugState(
        this.run.crewArcs,
        this.session.crewArcs,
        this.run.crewRoster
      ),
      fleet: createFleetDebugState(this.run.fleet, this.session.fleet),
      apex: createApexDebugState(this.run.apexHunts, this.session.apexHunts),
      progression: {
        runCredits: this.session.credits,
        runSalvage: this.session.salvage
      },
      sector: {
        index: sector.index,
        id: sector.sectorId,
        name: sector.sectorName,
        backgroundId: sector.background.id,
        objective: formatSectorObjectiveVariantDebug(sector.objective) ?? undefined,
        routeTags: formatRouteTagSummary(sector.routeOptions) ?? undefined,
        encounterPacing: sector.encounterPacing ? 'paced' : undefined,
        pacing: pacing.arcKind === 'standard' ? undefined : pacing.debugLabel
      }
    };
  }

  private createBriefingContext(): NavigationBriefingContext {
    const sector = getCurrentSector(this.run, this.session);
    const conditions = createSectorConditionPlan({
      run: this.run,
      sectorIndex: this.session.currentSectorIndex,
      routeOutcomes: this.session.routeOutcomes
    });
    const routeConditionedScroll = applySectorConditionsToScroll(sector.scroll, conditions);
    const pacing = createSectorPacingPlan({
      runSeed: this.run.seed,
      sector,
      sectorIndex: this.session.currentSectorIndex,
      conditions,
      scroll: routeConditionedScroll
    });
    const scroll = applySectorPacingToScroll(routeConditionedScroll, pacing);
    const campaign = getFactionCampaignInfluence(
      this.run.factionCampaign,
      this.session.factionCampaign,
      sector,
      { plan: this.run.factionFronts, state: this.session.factionFronts }
    );
    return {
      sector,
      conditions,
      pacing,
      scroll,
      campaign,
      crew: createCrewDebugState(this.run.crewRoster, this.session.crewRoster),
      crewArcSummary: createCrewArcRosterReadModel(
        this.run.crewArcs,
        this.session.crewArcs,
        this.run.crewRoster
      ).summary,
      fleetSummary: formatFleetSummary(this.run.fleet, this.session.fleet),
      apex: createApexCampaignReadModel(
        this.run.apexHunts,
        this.session.apexHunts,
        this.session.currentSectorIndex
      )
    };
  }

  private createEffectiveServiceLocks(): SectorNavigationServiceLocks {
    return {
      ...this.serviceLocks,
      ...(this.onOpenShop ? {} : { shop: 'No market tender is operating at this story location.' }),
      ...(this.onOpenHardpoint
        ? {}
        : { hardpoint: 'Engineering access is sealed by the current story state.' }),
      ...(this.onOpenFleetBay
        ? {}
        : { fleet: 'The hangar is isolated during the current story state.' }),
      ...(this.onOpenCrewQuarters
        ? {}
        : { crew: 'Crew transit is restricted during the current story state.' }),
      ...(this.onOpenApexDossier ? {} : { apex: 'The signal vault has no authorized uplink here.' })
    };
  }

  private createNavigationMap(plan: SectorNavigationPlan): HTMLElement {
    const onwardNodeId = this.getOnwardSectorNodeId(plan);
    const routeTargetNodeId = this.getRouteTargetNodeId(plan);
    const activeTargetNodeId = routeTargetNodeId ?? (this.postSectorChoice ? onwardNodeId : null);
    const sectorNodes: ConstellationMapNode[] = plan.constellation.nodes
      .filter((node) => node.kind === 'sector')
      .map((node) => {
        const current = node.id === plan.constellation.currentSectorNodeId;
        const onward = node.id === onwardNodeId;
        const routeTarget = Boolean(
          this.routeChoice &&
          node.id === (routeTargetNodeId ?? plan.constellation.currentSectorNodeId)
        );
        const routeSource = Boolean(
          this.routeChoice && !this.postSectorChoice && current && !routeTarget
        );
        const activeDestination = routeTarget || onward;
        const resolvedSector = activeDestination ? this.run.sectors[node.sectorIndex] : null;
        const optionalAvailable = this.postSectorChoice?.optional.available ?? true;
        return {
          id: node.id,
          kind: 'sector',
          label: resolvedSector?.sectorName ?? node.label,
          shortLabel: resolvedSector
            ? `S${node.revealOrder + 1} · ${resolvedSector.sectorName}`
            : node.shortLabel,
          glyph: resolvedSector ? '◆' : node.glyph,
          x: node.x,
          y: node.y,
          status: routeTarget
            ? 'choice'
            : current && this.postSectorChoice
              ? 'choice'
              : routeSource
                ? 'completed'
                : onward
                  ? 'choice'
                  : node.status,
          stateLabel: routeTarget
            ? 'CHOOSE ROUTE'
            : current && this.postSectorChoice
              ? 'OPTIONAL'
              : routeSource
                ? 'DEPARTED'
                : onward
                  ? 'CONTINUE'
                  : node.stateLabel,
          selectable: routeTarget || routeSource || onward || node.status !== 'hidden',
          available: routeTarget
            ? true
            : routeSource
              ? true
              : current && this.postSectorChoice
                ? optionalAvailable
                : onward
                  ? true
                  : node.status !== 'hidden',
          visited: routeSource || node.status === 'completed',
          revealOrder: node.revealOrder,
          testId: routeTarget
            ? 'navigation-destination-route'
            : current
              ? this.postSectorChoice
                ? 'navigation-destination-optional'
                : 'navigation-destination-launch'
              : onward
                ? 'navigation-destination-continue'
                : `navigation-sector-${node.sectorIndex + 1}`,
          destinationId: routeTarget
            ? 'route'
            : current
              ? this.postSectorChoice
                ? 'optional'
                : 'launch'
              : onward
                ? 'continue'
                : node.id,
          unavailableReason: routeTarget
            ? null
            : current && this.postSectorChoice
              ? this.postSectorChoice.optional.unavailableReason
              : null
        };
      });
    const serviceNodes: ConstellationMapNode[] = plan.destinations.map((destination) => {
      const visited = this.session.navigation.visitedDestinationIds.includes(destination.id);
      return {
        id: destination.id,
        kind: 'service',
        label: destination.label,
        shortLabel: destination.shortLabel,
        glyph: destination.glyph,
        x: destination.x,
        y: destination.y,
        status: destination.available ? (visited ? 'visited' : 'service') : 'locked',
        stateLabel: destination.available ? (visited ? 'VISITED' : 'OPEN') : 'LOCKED',
        selectable: true,
        available: destination.available,
        visited,
        revealOrder: destination.revealOrder,
        testId: this.getDestinationTestId(destination.id),
        destinationId: destination.id,
        unavailableReason: destination.unavailableReason
      };
    });
    const result = createConstellationMap({
      document: this.uiRoot.ownerDocument,
      ariaLabel: `${plan.constellation.actLabel} sector constellation and carrier services`,
      label: `${plan.constellation.actShortLabel} CONSTELLATION`,
      code: plan.localCode,
      layoutId: plan.layoutId,
      nodes: [...sectorNodes, ...serviceNodes],
      edges: plan.constellation.edges.map((edge) =>
        activeTargetNodeId &&
        ((edge.fromId === plan.constellation.currentSectorNodeId &&
          edge.toId === activeTargetNodeId) ||
          (edge.toId === plan.constellation.currentSectorNodeId &&
            edge.fromId === activeTargetNodeId))
          ? { ...edge, status: 'choice' }
          : edge
      ),
      selectedId: this.selectedNodeId ?? plan.constellation.currentSectorNodeId,
      onSelect: (nodeId) => this.selectNode(nodeId)
    });
    this.constellationButtons = new Map(result.buttons);
    return result.element;
  }

  private selectNode(nodeId: string): void {
    this.selectedNodeId = nodeId;
    updateConstellationSelection(this.constellationButtons, nodeId);
    this.renderDestinationDetail(this.createBriefingContext());
  }

  private renderDestinationDetail(context: NavigationBriefingContext): void {
    if (!this.detailRoot || !this.plan || !this.selectedNodeId) return;
    const sectorNode = this.plan.constellation.nodes.find(
      (candidate) => candidate.id === this.selectedNodeId && candidate.kind === 'sector'
    );
    if (sectorNode) {
      this.renderSectorDetail(context, sectorNode);
      return;
    }
    const destination = this.plan.destinations.find(
      (candidate) => candidate.id === this.selectedNodeId
    );
    if (!destination) return;
    this.renderServiceDetail(context, destination);
  }

  private renderSectorDetail(context: NavigationBriefingContext, node: ActConstellationNode): void {
    if (!this.detailRoot || !this.plan) return;
    const current = node.id === this.plan.constellation.currentSectorNodeId;
    const onward = node.id === this.getOnwardSectorNodeId(this.plan);
    const sectorNodes = this.plan.constellation.nodes.filter(
      (candidate) => candidate.kind === 'sector'
    );
    const actSectorNumber = sectorNodes.findIndex((candidate) => candidate.id === node.id) + 1;
    const routeTarget = Boolean(
      this.routeChoice &&
      node.id ===
        (this.getRouteTargetNodeId(this.plan) ?? this.plan.constellation.currentSectorNodeId)
    );
    if (routeTarget) {
      this.renderRouteChoiceDetail();
      return;
    }
    const stateLabel =
      current && this.postSectorChoice
        ? 'POST-SECTOR HOLD'
        : current && this.routeChoice
          ? 'DEPARTED'
          : onward
            ? 'CONTINUE'
            : node.stateLabel;
    const heading = document.createElement('div');
    heading.className = 'navigation-detail-heading';
    const identity = document.createElement('div');
    const kicker = document.createElement('p');
    kicker.className = 'eyebrow';
    kicker.textContent = `${this.plan.constellation.actShortLabel} // SECTOR ${actSectorNumber}/${sectorNodes.length} // ${stateLabel}`;
    const title = document.createElement('h2');
    title.textContent = current
      ? this.postSectorChoice
        ? this.postSectorChoice.optional.label
        : this.routeChoice
          ? node.label
          : (this.mission?.stageLabel ?? `Entering ${context.sector.sectorName}`)
      : onward && this.postSectorChoice
        ? this.postSectorChoice.onward.label
        : node.label;
    identity.append(kicker, title);
    const status = document.createElement('span');
    status.className = 'navigation-detail-status';
    const available = current
      ? this.postSectorChoice
        ? this.postSectorChoice.optional.available
        : this.routeChoice
          ? false
          : true
      : onward
        ? true
        : false;
    status.dataset.available = String(available);
    status.textContent = stateLabel;
    heading.append(identity, status);
    const summary = document.createElement('p');
    summary.className = 'navigation-detail-summary';
    if (current) summary.dataset.testid = 'mission-story-brief';
    summary.textContent = current
      ? this.postSectorChoice
        ? (this.postSectorChoice.optional.unavailableReason ??
          this.postSectorChoice.optional.summary)
        : this.routeChoice
          ? `Departure is committed. Select the highlighted next signal to choose the travel vector from ${node.label}.`
          : this.createLaunchStory(context)
      : onward && this.postSectorChoice
        ? this.postSectorChoice.onward.summary
        : node.summary;
    const body = document.createElement('div');
    body.className = 'navigation-detail-body';
    if (current && this.postSectorChoice) {
      body.append(
        this.createDetailMetric('Sector state', 'Required operation cleared'),
        this.createDetailMetric('Commitment', 'One optional local challenge')
      );
    } else if (current && this.routeChoice) {
      body.append(
        this.createDetailMetric('Sector state', 'Cleared and departed'),
        this.createDetailMetric('Navigation', 'Route choice pending at next signal')
      );
    } else if (current) {
      this.appendLaunchBriefing(body, context);
    } else if (onward && this.postSectorChoice) {
      body.append(
        this.createDetailMetric('Route', `Sector ${node.sectorIndex + 1}`),
        this.createDetailMetric('Commitment', 'Leave this optional signal behind')
      );
    } else {
      body.append(
        this.createDetailMetric('Act position', `${actSectorNumber}/${sectorNodes.length}`),
        this.createDetailMetric(
          'Signal state',
          node.status === 'completed'
            ? 'Route settled and retained on the chart'
            : 'Destination fixed; approach not yet open'
        )
      );
    }
    const action = document.createElement('button');
    action.className =
      current && this.postSectorChoice
        ? 'primary-button'
        : current && this.routeChoice
          ? 'secondary-button'
          : current || onward
            ? 'primary-button'
            : 'secondary-button';
    action.type = 'button';
    action.dataset.testid = 'navigation-destination-action';
    action.disabled = !available;
    action.textContent = current
      ? this.postSectorChoice
        ? this.postSectorChoice.optional.available
          ? 'Stay for Optional Challenge'
          : 'Optional Challenge Unavailable'
        : this.routeChoice
          ? 'Choose Route at Next Signal'
          : 'Begin Operation'
      : onward && this.postSectorChoice
        ? 'Continue to Next Sector'
        : node.status === 'completed'
          ? 'Operation Settled'
          : 'Complete Current Sector';
    if (current && this.postSectorChoice) action.dataset.testid = 'navigation-optional-action';
    if (onward && this.postSectorChoice) action.dataset.testid = 'navigation-continue-action';
    action.addEventListener('click', () => this.activateNode(node.id));
    const children: HTMLElement[] = [heading, summary, body, action];
    if (current && this.postSectorChoice && this.getOnwardSectorNodeId(this.plan) === null) {
      const continueAction = document.createElement('button');
      continueAction.className = 'secondary-button';
      continueAction.type = 'button';
      continueAction.dataset.testid = 'navigation-continue-action';
      continueAction.textContent = this.postSectorChoice.onward.label;
      continueAction.addEventListener('click', () =>
        this.postSectorChoice?.onChoose(this.postSectorChoice.onward.id)
      );
      children.push(continueAction);
    }
    this.detailRoot.replaceChildren(...children);
  }

  private renderRouteChoiceDetail(): void {
    if (!this.detailRoot || !this.routeChoice) return;
    const model = this.createRouteChoiceModel();
    const heading = document.createElement('div');
    heading.className = 'navigation-detail-heading';
    const identity = document.createElement('div');
    const kicker = document.createElement('p');
    kicker.className = 'eyebrow';
    kicker.textContent = `${model.actLabel} // ROUTE COMMIT`;
    const title = document.createElement('h2');
    title.textContent = model.title;
    identity.append(kicker, title);
    const status = document.createElement('span');
    status.className = 'navigation-detail-status';
    status.dataset.available = 'true';
    status.textContent = this.postSectorChoice ? '3 ROUTES' : 'CHOOSE ROUTE';
    heading.append(identity, status);

    const summary = document.createElement('p');
    summary.className = 'navigation-detail-summary';
    summary.dataset.testid = 'route-story-brief';
    summary.textContent = model.summary;

    const body = document.createElement('div');
    body.className = 'navigation-detail-body navigation-route-body';
    body.append(
      this.createDetailMetric('Crossing', model.edgeLabel, 'route-edge-preview'),
      this.createDetailMetric('Next objective', model.objective, 'route-mission-preview')
    );
    const routeOptions = document.createElement('div');
    routeOptions.className = 'navigation-route-options';
    routeOptions.dataset.testid = 'navigation-route-options';
    routeOptions.setAttribute('aria-label', `Routes from ${model.edgeLabel}`);

    for (const option of model.options) {
      const button = document.createElement('button');
      button.className = 'choice-card route-card navigation-route-card navigation-flight-option';
      button.type = 'button';
      button.dataset.testid = `route-${option.route.kind}`;
      button.addEventListener('click', () => this.routeChoice?.onChoose(option.route));
      button.setAttribute(
        'aria-label',
        [
          option.route.label,
          `${option.riskLabel} risk ${option.route.risk}`,
          option.summary,
          ...option.details
        ].join('. ')
      );

      const routeHeading = document.createElement('span');
      routeHeading.className = 'navigation-route-card-heading';
      const name = document.createElement('strong');
      name.textContent = option.route.label;
      const risk = document.createElement('small');
      risk.textContent = `${option.riskLabel} · RISK ${option.route.risk}`;
      routeHeading.append(name, risk);
      const routeSummary = document.createElement('span');
      routeSummary.className = 'navigation-route-card-summary';
      routeSummary.textContent = option.summary;
      button.append(routeHeading, routeSummary);
      for (const detail of option.details) {
        const routeDetail = document.createElement('span');
        routeDetail.className = 'navigation-route-card-detail';
        routeDetail.textContent = detail;
        button.append(routeDetail);
      }
      routeOptions.append(button);
    }

    body.append(routeOptions);
    this.detailRoot.replaceChildren(heading, summary, body);
  }

  private renderServiceDetail(
    context: NavigationBriefingContext,
    destination: SectorNavigationDestination
  ): void {
    if (!this.detailRoot) return;
    const heading = document.createElement('div');
    heading.className = 'navigation-detail-heading';
    const identity = document.createElement('div');
    const kicker = document.createElement('p');
    kicker.className = 'eyebrow';
    kicker.textContent = `${destination.deckLabel} // ${destination.available ? 'LOCAL ORBIT' : 'ACCESS HOLD'}`;
    const title = document.createElement('h2');
    title.textContent = destination.label;
    identity.append(kicker, title);
    const status = document.createElement('span');
    status.className = 'navigation-detail-status';
    status.dataset.available = String(destination.available);
    status.textContent = destination.available
      ? this.session.navigation.visitedDestinationIds.includes(destination.id)
        ? 'VISITED'
        : 'AVAILABLE'
      : 'STORY LOCK';
    heading.append(identity, status);
    const summary = document.createElement('p');
    summary.className = 'navigation-detail-summary';
    summary.textContent = destination.unavailableReason ?? destination.summary;
    const body = document.createElement('div');
    body.className = 'navigation-detail-body';
    this.appendDestinationBody(body, destination, context);
    const action = document.createElement('button');
    action.className = 'secondary-button';
    action.type = 'button';
    action.dataset.testid = 'navigation-destination-action';
    action.disabled = !destination.available;
    action.textContent = destination.available ? destination.actionLabel : 'Transit Unavailable';
    action.addEventListener('click', () => this.activateNode(destination.id));
    this.detailRoot.replaceChildren(heading, summary, body, action);
  }

  private appendDestinationBody(
    body: HTMLElement,
    destination: SectorNavigationDestination,
    context: NavigationBriefingContext
  ): void {
    if (destination.id === 'shop') {
      body.append(
        this.createDetailMetric('Tender', `${this.session.credits} credits`),
        this.createDetailMetric('Local stock', '4+ seeded offers'),
        this.createDetailCopy(
          'Market access is a carrier service. A shop route can still improve terms or stock, but no longer decides whether the market exists.'
        )
      );
      return;
    }
    if (destination.id === 'hardpoint') {
      const cargo = getCargoComponents(this.session.engineering.committed);
      const fitted = getActiveFittedItems(
        this.session.itemInstances,
        this.session.engineering.committed
      );
      body.append(
        this.createDetailMetric('Recovered hardware', `${cargo.length} in cargo`),
        this.createDetailMetric(
          'Installed modules',
          `${this.session.engineering.committed.mounts.length}`
        ),
        this.createDetailMetric(
          'Live upgrades',
          `${fitted.length}/${this.session.itemInstances.length}`
        ),
        this.createDetailCopy(
          cargo.length > 0
            ? 'Recovered component cargo is ready to install, fuse, scrap, or retain for fleet construction.'
            : 'The loadout, socket circuit, and attack simulation remain available even with no loose hardware.'
        )
      );
      return;
    }
    if (destination.id === 'fleet') {
      body.append(
        this.createDetailMetric('Support status', context.fleetSummary),
        this.createDetailCopy(
          'The bay remains accessible with an empty roster; construction and assignment explain their own component, salvage, berth, or crew requirements.'
        )
      );
      return;
    }
    if (destination.id === 'crew') {
      body.append(
        this.createDetailMetric('Manifest', `${context.crew.roster.length} wingmate records`),
        this.createDetailCopy(
          context.crew.roster.length > 0
            ? context.crew.roster.join(' | ')
            : 'No wingmates are aboard. Rescue and specialist contracts can add run-local allies.'
        ),
        this.createDetailCopy(context.crewArcSummary)
      );
      return;
    }
    body.append(
      this.createDetailMetric('Pursuit network', context.apex.summary),
      this.createDetailCopy(
        context.apex.nextEncounters.length > 0
          ? `Marked signals: ${context.apex.nextEncounters.join(' | ')}`
          : 'No unresolved marked contacts are projected ahead.'
      )
    );
  }

  private appendLaunchBriefing(body: HTMLElement, context: NavigationBriefingContext): void {
    const objective = [
      this.mission?.objectiveId
        ? getMissionObjective(this.mission.objectiveId).hudVerb
        : 'SECTOR OBJECTIVE',
      context.sector.objective.label
    ].join(' · ');
    const transit = `${Math.floor(context.scroll.length)}u · ${Math.round(context.scroll.baseSpeed)}u/s`;
    const notableMetrics: HTMLElement[] = [];

    if (context.campaign.rival) {
      notableMetrics.push(
        this.createDetailMetric(
          'Opposition',
          `RIVAL · ${context.campaign.rival.name} · ${context.campaign.rival.tactic}`,
          'faction-campaign-brief'
        )
      );
    } else if (context.sector.objective.bossRequired) {
      notableMetrics.push(
        this.createDetailMetric('Threat', `${context.sector.bossName} · boss gate`)
      );
    } else if (context.sector.setPiece) {
      notableMetrics.push(
        this.createDetailMetric('Fortification', `${context.campaign.factionName} control`)
      );
    }

    if (context.crew.activeCount > 0) {
      notableMetrics.push(
        this.createDetailMetric(
          'Wing',
          `${context.crew.activeCount} active wingmate${context.crew.activeCount === 1 ? '' : 's'}`,
          'crew-brief'
        )
      );
    } else if (context.conditions.modifiers.length > 0) {
      notableMetrics.push(
        this.createDetailMetric(
          'Conditions',
          context.conditions.modifiers.map((modifier) => modifier.label).join(' · ')
        )
      );
    } else if (context.pacing.arcKind !== 'standard') {
      notableMetrics.push(
        this.createDetailMetric(
          'Flight profile',
          `${context.pacing.label} · ${context.pacing.pressureBand} pressure`
        )
      );
    }

    body.append(
      this.createDetailMetric('Objective', objective, 'mission-objective-preview'),
      this.createDetailMetric('Transit', transit),
      ...notableMetrics.slice(0, 2)
    );
  }

  private createLaunchStory(context: NavigationBriefingContext): string {
    const missionLead = this.mission?.contractSummary?.trim() || context.sector.objective.label;
    return `${finishSentence(missionLead)} ${finishSentence(context.campaign.missionBrief)}`;
  }

  private activateNode(nodeId: string): void {
    if (!this.plan) return;
    if (nodeId === this.plan.constellation.currentSectorNodeId) {
      if (this.postSectorChoice) {
        if (this.postSectorChoice.optional.available) {
          this.postSectorChoice.onChoose(this.postSectorChoice.optional.id);
        }
        return;
      }
      if (this.routeChoice) return;
      this.session.navigation = recordSectorNavigationVisit(this.session.navigation, 'launch');
      this.onEnterSector();
      return;
    }
    if (this.postSectorChoice && nodeId === this.getOnwardSectorNodeId(this.plan)) {
      this.postSectorChoice.onChoose(this.postSectorChoice.onward.id);
      return;
    }
    const destination = this.plan.destinations.find((candidate) => candidate.id === nodeId);
    if (!destination?.available) return;
    this.session.navigation = recordSectorNavigationVisit(this.session.navigation, destination.id);
    switch (destination.id) {
      case 'shop':
        this.onOpenShop?.();
        break;
      case 'hardpoint':
        this.onOpenHardpoint?.();
        break;
      case 'fleet':
        this.onOpenFleetBay?.();
        break;
      case 'crew':
        this.onOpenCrewQuarters?.();
        break;
      case 'apex':
        this.onOpenApexDossier?.();
        break;
    }
  }

  private getPlanNodeIds(plan: SectorNavigationPlan): readonly string[] {
    return [
      ...plan.constellation.nodes.map((node) => node.id),
      ...plan.destinations.map((destination) => destination.id)
    ];
  }

  private getOnwardSectorNodeId(plan: SectorNavigationPlan): string | null {
    const nextSectorIndex =
      this.postSectorChoice?.onward.nextSectorIndex ?? this.routeChoice?.targetSectorIndex;
    if (nextSectorIndex === null || nextSectorIndex === undefined) return null;
    return (
      plan.constellation.nodes.find(
        (node) => node.kind === 'sector' && node.sectorIndex === nextSectorIndex
      )?.id ?? null
    );
  }

  private getRouteTargetNodeId(plan: SectorNavigationPlan): string | null {
    if (!this.routeChoice) return null;
    const targetSectorIndex = this.routeChoice.targetSectorIndex;
    if (targetSectorIndex === null) return null;
    return (
      plan.constellation.nodes.find(
        (node) => node.kind === 'sector' && node.sectorIndex === targetSectorIndex
      )?.id ?? null
    );
  }

  private createRouteChoiceModel(): RouteNavigationReadModel {
    if (!this.routeChoice) throw new Error('Route choice model requested outside route mode.');
    return createRouteNavigationReadModel({
      run: this.run,
      sourceSectorIndex: this.routeChoice.sourceSectorIndex,
      targetSectorIndex: this.routeChoice.targetSectorIndex
    });
  }

  private createResource(label: string, value: string | number): HTMLElement {
    const item = document.createElement('span');
    item.innerHTML = `<small>${label}</small><strong>${value}</strong>`;
    return item;
  }

  private createDetailMetric(label: string, value: string, testId?: string): HTMLElement {
    const metric = document.createElement('div');
    metric.className = 'navigation-detail-metric';
    if (testId) metric.dataset.testid = testId;
    const name = document.createElement('small');
    name.textContent = label;
    const readout = document.createElement('strong');
    readout.textContent = value;
    metric.append(name, readout);
    return metric;
  }

  private createDetailCopy(value: string, testId?: string): HTMLElement {
    const copy = document.createElement('p');
    copy.className = 'transition-copy';
    if (testId) copy.dataset.testid = testId;
    copy.textContent = value;
    return copy;
  }

  private getDestinationTestId(destinationId: string): string {
    if (destinationId === 'fleet') return 'open-fleet-bay';
    if (destinationId === 'crew') return 'open-crew-quarters';
    if (destinationId === 'apex') return 'open-apex-dossier';
    if (destinationId === 'hardpoint') return 'open-hardpoint-control';
    if (destinationId === 'shop') return 'open-shop';
    return 'navigation-destination-launch';
  }
}

function finishSentence(value: string): string {
  const trimmed = value.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}
