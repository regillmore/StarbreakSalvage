import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import { getMissionObjective } from '../content/objectives';
import type { RouteOption, RunSkeleton, StartingContract } from '../game/Generation';
import { createActDebugState, formatActSectorLabel } from '../game/ActPlan';
import type { ActConstellationNode } from '../game/ActConstellation';
import { formatRouteTagSummary } from '../game/ActTwoDebug';
import {
  getCurrentSector,
  getRunSessionVisitedActRouteSectorIndices,
  getShipHullReadModel,
  type RunSessionState
} from '../game/RunSession';
import { applySectorConditionsToScroll, createSectorConditionPlan } from '../game/SectorConditions';
import { applySectorPacingToScroll, createSectorPacingPlan } from '../game/SectorPacing';
import { formatSectorObjectiveVariantDebug } from '../game/SectorObjectives';
import { SHOP_BASE_CIRCUIT_STOCK } from '../game/Shops';
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
import {
  createApexCampaignReadModel,
  createApexDebugState,
  createApexPursuitNavigationReadModel
} from '../game/ApexHunt';
import { getPrimaryWeaponCargoComponents } from '../game/Foundry';
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
  type ConstellationMapNode,
  type ConstellationMapViewMode
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
  readonly apexPursuit: ReturnType<typeof createApexPursuitNavigationReadModel>;
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
  readonly onward: PostSectorNavigationOption & { readonly nextSectorIndices: readonly number[] };
  readonly onChoose: (optionId: string) => void;
}

export interface NavigationRouteChoice {
  readonly sourceSectorIndex: number;
  readonly targetSectorIndices: readonly number[];
  readonly onChoose: (targetSectorIndex: number, route: RouteOption) => void;
}

export class SectorTransitionScene implements Scene {
  public readonly id = 'sector-transition';
  private selectedNodeId: string | null = null;
  private plan: SectorNavigationPlan | null = null;
  private detailRoot: HTMLElement | null = null;
  private constellationButtons = new Map<string, HTMLButtonElement>();
  private constellationViewMode: ConstellationMapViewMode = 'focus';

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
    private readonly routeChoice: NavigationRouteChoice | null = null,
    private readonly onSuspendAndExit: (() => void) | null = null
  ) {}

  public enter(): void {
    const context = this.createBriefingContext();
    const hull = getShipHullReadModel(this.contract, this.session);
    const choiceSectorIndices = this.routeChoice?.targetSectorIndices ?? [];
    const visitedSectorIndices = getRunSessionVisitedActRouteSectorIndices(this.run, this.session);
    this.plan = createSectorNavigationPlan({
      run: this.run,
      sectorIndex: this.session.currentSectorIndex,
      visitedSectorIndices,
      choiceSectorIndices,
      serviceLocks: this.createEffectiveServiceLocks()
    });
    if (!this.selectedNodeId || !this.getPlanNodeIds(this.plan).includes(this.selectedNodeId)) {
      this.selectedNodeId = this.routeChoice
        ? (this.getRouteTargetNodeIds(this.plan)[0] ?? this.plan.constellation.currentSectorNodeId)
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
        ? `${this.run.carrierPlan.name} flight board · Hold the cleared node once, or commit a ranked destination and its built-in route effect.`
        : `${this.run.carrierPlan.name} route plot · Each destination carries one seeded route effect; choose the signal and consequence together.`
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
      this.createResource('Hull', `${hull.current}/${hull.max}`, 'navigation-hull', hull.state),
      this.createResource('Curse', this.session.curse)
    );
    const headerUtility = document.createElement('div');
    headerUtility.className = 'navigation-hub-utility';
    if (this.onSuspendAndExit) {
      const suspend = document.createElement('button');
      suspend.className = 'secondary-button navigation-suspend-action';
      suspend.type = 'button';
      suspend.dataset.testid = 'suspend-navigation';
      suspend.textContent = 'Suspend & Exit';
      suspend.setAttribute('aria-label', 'Suspend expedition and exit to main menu');
      suspend.addEventListener('click', this.onSuspendAndExit);
      headerUtility.append(suspend);
    }
    headerUtility.append(resources);
    header.append(headingGroup, headerUtility);

    const workspace = document.createElement('div');
    workspace.className = 'navigation-hub-workspace';
    const map = this.createNavigationMap(this.plan, context.apexPursuit);
    this.detailRoot = document.createElement('section');
    this.detailRoot.className = 'navigation-destination-detail';
    this.detailRoot.dataset.testid = 'navigation-destination-detail';
    this.detailRoot.setAttribute('aria-live', 'polite');
    workspace.append(map, this.detailRoot);

    const footer = document.createElement('footer');
    footer.className = 'navigation-hub-footer';
    const footerCopy = document.createElement('p');
    footerCopy.textContent = this.routeChoice
      ? this.postSectorChoice
        ? 'READY SIGNALS // Cleared node: one optional hold · Each destination: one base route effect.'
        : 'DESTINATION COMMIT // Compare node-bound route effects, then commit the next signal.'
      : this.postSectorChoice
        ? 'POST-SECTOR HOLD // Optional challenge remains on the cleared node · The active destination continues the expedition.'
        : 'ACT CHART // Future sectors resolve only when travel opens · Unlinked carrier services remain locally available.';
    footer.append(footerCopy);

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
        '[data-testid="navigation-route-commit"], [data-testid="navigation-destination-action"], [data-testid="navigation-optional-action"]'
      )
      ?.focus({ preventScroll: true });
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if ((action === 'back' || action === 'pause') && this.onSuspendAndExit) {
      this.onSuspendAndExit();
      return;
    }
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
      ),
      apexPursuit: createApexPursuitNavigationReadModel(
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

  private createNavigationMap(
    plan: SectorNavigationPlan,
    apexPursuit: NavigationBriefingContext['apexPursuit']
  ): HTMLElement {
    const orderedRouteTargetNodeIds = this.getRouteTargetNodeIds(plan);
    const routeTargetNodeIds = new Set(orderedRouteTargetNodeIds);
    const sectorNodes: ConstellationMapNode[] = plan.constellation.nodes
      .filter((node) => node.kind === 'sector')
      .map((node) => {
        const current = node.id === plan.constellation.currentSectorNodeId;
        const routeTarget = routeTargetNodeIds.has(node.id);
        const routeSource = Boolean(
          this.routeChoice && !this.postSectorChoice && current && !routeTarget
        );
        const resolvedSector = routeTarget ? this.run.sectors[node.sectorIndex] : null;
        const routeEffect = routeTarget
          ? this.createRouteChoiceModel(node.sectorIndex).effect
          : null;
        const apexTrack = Boolean(
          routeTarget && apexPursuit?.revealedNextSectorIndex === node.sectorIndex
        );
        const apexBreak = Boolean(
          routeTarget &&
            apexPursuit?.revealedNextSectorIndex != null &&
            apexPursuit?.revealedNextSectorIndex !== node.sectorIndex
        );
        const apexContact = Boolean(
          current &&
            apexPursuit?.currentEncounter &&
            apexPursuit.revealedNextSectorIndex === null &&
            apexPursuit.status !== 'escaped' &&
            apexPursuit.status !== 'resolved'
        );
        const optionalAvailable = this.postSectorChoice?.optional.available ?? true;
        return {
          id: node.id,
          kind: 'sector',
          label: resolvedSector?.sectorName ?? node.label,
          shortLabel: resolvedSector
            ? `${node.layerIndex + 1}${String.fromCharCode(65 + node.laneIndex)} · ${resolvedSector.sectorName}`
            : node.shortLabel,
          glyph: resolvedSector ? '◆' : node.glyph,
          glyphKind: apexTrack ? 'apex' : 'text',
          x: node.x,
          y: node.y,
          status: routeTarget
            ? 'choice'
            : current && this.postSectorChoice
              ? 'choice'
              : routeSource
                ? 'completed'
                : node.status,
          stateLabel: routeTarget
            ? apexTrack
              ? `${apexPursuit?.mapCue ?? '[APEX]'} TRACK · ${formatRouteDifficulty(node.difficulty)} · ${routeEffect?.route.label.toUpperCase() ?? 'ROUTE EFFECT'}`
              : apexBreak
                ? `BREAKS TRACK · ${formatRouteDifficulty(node.difficulty)} · ${routeEffect?.route.label.toUpperCase() ?? 'ROUTE EFFECT'}`
                : `${formatRouteDifficulty(node.difficulty)} · ${routeEffect?.route.label.toUpperCase() ?? 'ROUTE EFFECT'}`
            : current && this.postSectorChoice
              ? 'OPTIONAL'
              : routeSource
                ? 'DEPARTED'
                : node.stateLabel,
          selectable: routeTarget || routeSource || node.status !== 'hidden',
          available: routeTarget
            ? true
            : routeSource
              ? true
              : current && this.postSectorChoice
                ? optionalAvailable
                : node.status !== 'hidden',
          visited: routeSource || node.status === 'completed',
          revealOrder: node.revealOrder,
          testId: routeTarget
            ? node.id === orderedRouteTargetNodeIds[0]
              ? 'navigation-destination-route'
              : `navigation-destination-route-${node.sectorIndex + 1}`
            : current
              ? this.postSectorChoice
                ? 'navigation-destination-optional'
                : 'navigation-destination-launch'
              : `navigation-sector-${node.sectorIndex + 1}`,
          destinationId: routeTarget
            ? `route:${node.sectorIndex}`
            : current
              ? this.postSectorChoice
                ? 'optional'
                : 'launch'
              : node.id,
          unavailableReason: routeTarget
            ? null
            : current && this.postSectorChoice
              ? this.postSectorChoice.optional.unavailableReason
              : null,
          signal: apexTrack
            ? 'apex-track'
            : apexBreak
              ? 'apex-break'
              : apexContact
                ? 'apex-contact'
                : undefined
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
      edges: plan.constellation.edges,
      selectedId: this.selectedNodeId ?? plan.constellation.currentSectorNodeId,
      onSelect: (nodeId) => this.selectNode(nodeId),
      view: {
        mode: this.constellationViewMode,
        focusNodeIds: sectorNodes
          .filter(
            (node) =>
              node.status === 'choice' ||
              (node.id === plan.constellation.currentSectorNodeId && node.status === 'current')
          )
          .map((node) => node.id),
        onModeChange: (mode) => {
          this.constellationViewMode = mode;
        }
      }
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
    const actSectorNumber = node.layerIndex + 1;
    const routeTarget = this.getRouteTargetNodeIds(this.plan).includes(node.id);
    if (routeTarget) {
      this.renderRouteChoiceDetail(node.sectorIndex);
      return;
    }
    const stateLabel =
      current && this.postSectorChoice
        ? 'POST-SECTOR HOLD'
        : current && this.routeChoice
          ? 'DEPARTED'
          : node.stateLabel;
    const heading = document.createElement('div');
    heading.className = 'navigation-detail-heading';
    const identity = document.createElement('div');
    const kicker = document.createElement('p');
    kicker.className = 'eyebrow';
    kicker.textContent = `${this.plan.constellation.actShortLabel} // LAYER ${actSectorNumber}/5 // SIGNAL ${node.layerIndex + 1}${String.fromCharCode(65 + node.laneIndex)} // ${stateLabel}`;
    const title = document.createElement('h2');
    title.textContent = current
      ? this.postSectorChoice
        ? this.postSectorChoice.optional.label
        : this.routeChoice
          ? node.label
          : (this.mission?.stageLabel ?? `Entering ${context.sector.sectorName}`)
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
    } else {
      body.append(
        this.createDetailMetric('Act layer', `${actSectorNumber}/5`),
        this.createDetailMetric(
          'Signal state',
          node.status === 'completed'
            ? 'Route settled and retained on the chart'
            : 'Destination fixed; approach not yet open'
        )
      );
    }
    if (current && context.apexPursuit) {
      body.prepend(
        this.createDetailMetric(
          'Apex pursuit',
          context.apexPursuit.summary,
          'apex-pursuit-brief'
        )
      );
    }
    const action = document.createElement('button');
    action.className =
      current && this.postSectorChoice
        ? 'primary-button'
        : current && this.routeChoice
          ? 'secondary-button'
          : current
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
          ? 'Inspect Destination Effects'
          : 'Begin Operation'
      : node.status === 'completed'
        ? 'Operation Settled'
        : node.status === 'bypassed'
          ? 'Signal Bypassed'
          : 'Complete Current Sector';
    if (current && this.postSectorChoice) action.dataset.testid = 'navigation-optional-action';
    action.addEventListener('click', () => this.activateNode(node.id));
    this.detailRoot.replaceChildren(heading, summary, body, action);
  }

  private renderRouteChoiceDetail(targetSectorIndex: number): void {
    if (!this.detailRoot || !this.routeChoice) return;
    const model = this.createRouteChoiceModel(targetSectorIndex);
    const effect = model.effect;
    if (!effect) return;
    const apexPursuit = createApexPursuitNavigationReadModel(
      this.run.apexHunts,
      this.session.apexHunts,
      this.session.currentSectorIndex
    );
    const apexTrack = apexPursuit?.revealedNextSectorIndex === targetSectorIndex;
    const apexBreak = Boolean(
      apexPursuit?.revealedNextSectorIndex != null && !apexTrack
    );
    const heading = document.createElement('div');
    heading.className = 'navigation-detail-heading';
    const identity = document.createElement('div');
    const kicker = document.createElement('p');
    kicker.className = 'eyebrow';
    kicker.textContent = `${model.actLabel} // DESTINATION COMMIT`;
    const title = document.createElement('h2');
    title.textContent = model.title;
    identity.append(kicker, title);
    const status = document.createElement('span');
    status.className = 'navigation-detail-status';
    status.dataset.available = 'true';
    status.textContent = model.difficultyLabel;
    heading.append(identity, status);

    const summary = document.createElement('p');
    summary.className = 'navigation-detail-summary';
    summary.dataset.testid = 'route-story-brief';
    summary.textContent = model.summary;

    const body = document.createElement('div');
    body.className = 'navigation-detail-body navigation-route-body';
    body.append(
      this.createDetailMetric('Crossing', model.edgeLabel, 'route-edge-preview'),
      this.createDetailMetric('Next objective', model.objective, 'route-mission-preview'),
      this.createDetailMetric('Signal profile', model.difficultySummary, 'route-difficulty-preview')
    );
    if (apexTrack) {
      body.append(
        this.createDetailMetric(
          'Apex pursuit',
          `${apexPursuit?.mapCue ?? '[APEX]'} TRACK LOCK · ${apexPursuit?.revealedNextEncounter?.routeNodeLabel ?? 'NEXT SIGNAL'}`,
          'apex-pursuit-route-preview'
        )
      );
    } else if (apexBreak) {
      body.append(
        this.createDetailMetric(
          'Apex pursuit',
          `${apexPursuit?.mapCue ?? '[APEX]'} TRACK BREAK · THE APEX ESCAPES`,
          'apex-pursuit-route-preview'
        )
      );
    }
    const routeEffect = document.createElement('article');
    routeEffect.className = 'navigation-route-effect';
    routeEffect.dataset.testid = 'navigation-route-effect';
    routeEffect.setAttribute('aria-label', `Base route effect: ${effect.route.label}`);
    const routeHeading = document.createElement('div');
    routeHeading.className = 'navigation-route-effect-heading';
    const routeIdentity = document.createElement('span');
    const routeKicker = document.createElement('small');
    routeKicker.textContent = 'BASE ROUTE EFFECT';
    const routeName = document.createElement('strong');
    routeName.textContent = effect.route.label;
    routeIdentity.append(routeKicker, routeName);
    const risk = document.createElement('span');
    risk.className = 'navigation-route-effect-risk';
    risk.textContent = `${effect.riskLabel} · RISK ${effect.route.risk}`;
    routeHeading.append(routeIdentity, risk);
    const routeSummary = document.createElement('p');
    routeSummary.className = 'navigation-route-effect-summary';
    routeSummary.textContent = effect.summary;
    routeEffect.append(routeHeading, routeSummary);
    for (const detail of effect.details) {
      const routeDetail = document.createElement('span');
      routeDetail.className = 'navigation-route-effect-detail';
      routeDetail.textContent = detail;
      routeEffect.append(routeDetail);
    }
    body.append(routeEffect);

    const commit = document.createElement('button');
    commit.className = 'primary-button navigation-route-commit';
    commit.type = 'button';
    commit.dataset.testid = 'navigation-route-commit';
    commit.dataset.routeKind = effect.route.kind;
    commit.textContent = apexTrack
      ? 'Commit Tracked Destination'
      : apexBreak
        ? 'Commit & Break Pursuit'
        : 'Commit Destination';
    commit.setAttribute(
      'aria-label',
      `Commit ${model.edgeLabel} with ${effect.route.label}, ${effect.riskLabel} risk ${effect.route.risk}${apexTrack ? ', apex pursuit track confirmed' : apexBreak ? ', warning: this breaks the apex pursuit track' : ''}`
    );
    commit.addEventListener('click', () =>
      this.routeChoice?.onChoose(targetSectorIndex, effect.route)
    );
    this.detailRoot.replaceChildren(heading, summary, body, commit);
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
        this.createDetailMetric('Local stock', `${SHOP_BASE_CIRCUIT_STOCK}+ seeded offers`),
        this.createDetailCopy(
          'Market access is a carrier service. A shop route can still improve prices and inventory focus, but only Upgrade Bay effects add slots.'
        )
      );
      return;
    }
    if (destination.id === 'hardpoint') {
      const cargo = getPrimaryWeaponCargoComponents(this.session.engineering.committed);
      const fitted = getActiveFittedItems(
        this.session.itemInstances,
        this.session.engineering.committed
      );
      body.append(
        this.createDetailMetric(
          'Primary reserve',
          `${cargo.length} weapon${cargo.length === 1 ? '' : 's'}`
        ),
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
            ? 'Compare the mounted primary with reserve weapons beside the live attack simulation. Primary Cargo keeps inspection and scrapping in the same reversible draft.'
            : 'The mounted primary, ordered signal circuit, and attack simulation remain available even with no reserve weapons.'
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

  private getRouteTargetNodeIds(plan: SectorNavigationPlan): readonly string[] {
    if (!this.routeChoice) return [];
    const targetSectorIndices = new Set(this.routeChoice.targetSectorIndices);
    return plan.constellation.nodes
      .filter((node) => node.kind === 'sector' && targetSectorIndices.has(node.sectorIndex))
      .map((node) => node.id);
  }

  private createRouteChoiceModel(targetSectorIndex?: number): RouteNavigationReadModel {
    if (!this.routeChoice) throw new Error('Route choice model requested outside route mode.');
    const selectedTarget =
      targetSectorIndex ??
      this.plan?.constellation.nodes.find((node) => node.id === this.selectedNodeId)?.sectorIndex ??
      this.routeChoice.targetSectorIndices[0] ??
      null;
    return createRouteNavigationReadModel({
      run: this.run,
      sourceSectorIndex: this.routeChoice.sourceSectorIndex,
      targetSectorIndex: selectedTarget
    });
  }

  private createResource(
    label: string,
    value: string | number,
    testId?: string,
    tone?: string
  ): HTMLElement {
    const item = document.createElement('span');
    if (testId) item.dataset.testid = testId;
    if (tone) item.dataset.tone = tone;
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

function formatRouteDifficulty(difficulty: ActConstellationNode['difficulty']): string {
  if (difficulty === 'easier') return 'EASIER';
  if (difficulty === 'harder') return 'HARDER';
  if (difficulty === 'standard') return 'STANDARD';
  if (difficulty === 'finale') return 'CONVERGENCE';
  return 'READY';
}
