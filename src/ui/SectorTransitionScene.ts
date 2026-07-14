import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import { getMissionObjective } from '../content/objectives';
import type { RunSkeleton, StartingContract } from '../game/Generation';
import { createActDebugState, formatActSectorLabel } from '../game/ActPlan';
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
  type SectorNavigationDestinationId,
  type SectorNavigationPlan,
  type SectorNavigationServiceLocks
} from '../game/SectorNavigation';

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

export class SectorTransitionScene implements Scene {
  public readonly id = 'sector-transition';
  private selectedDestinationId: SectorNavigationDestinationId = 'launch';
  private plan: SectorNavigationPlan | null = null;
  private detailRoot: HTMLElement | null = null;
  private destinationButtons = new Map<SectorNavigationDestinationId, HTMLButtonElement>();

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
    private readonly serviceLocks: SectorNavigationServiceLocks = {}
  ) {}

  public enter(): void {
    const context = this.createBriefingContext();
    this.plan = createSectorNavigationPlan({
      seed: this.run.seed,
      sectorIndex: this.session.currentSectorIndex,
      serviceLocks: this.createEffectiveServiceLocks()
    });
    if (
      !this.plan.destinations.some((destination) => destination.id === this.selectedDestinationId)
    ) {
      this.selectedDestinationId = 'launch';
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
    eyebrow.textContent = `${formatActSectorLabel(context.sector.act)} // ${this.plan.localCode} // ${context.sector.sectorName}`;
    const title = document.createElement('h1');
    title.id = 'transition-title';
    title.textContent = `${this.plan.hubName} Navigation`;
    const subtitle = document.createElement('p');
    subtitle.className = 'navigation-hub-subtitle';
    subtitle.textContent = `${this.run.carrierPlan.name} local operations hub · Select a destination for live details.`;
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
    footer.textContent =
      'LOCAL TRANSIT // Arrow keys move between destinations · Enter inspects · Travel controls confirm departure.';

    shell.append(
      header,
      createContractThemeStrip(this.uiRoot.ownerDocument, theme),
      workspace,
      footer
    );
    this.uiRoot.replaceChildren(shell);
    this.renderDestinationDetail(context);
    this.detailRoot
      .querySelector<HTMLButtonElement>('[data-testid="navigation-destination-action"]')
      ?.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'confirm') {
      const focused = this.uiRoot.ownerDocument.activeElement;
      if (focused instanceof HTMLButtonElement) focused.click();
      else this.activateDestination(this.selectedDestinationId);
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
    this.destinationButtons.clear();
    const map = document.createElement('section');
    map.className = 'navigation-map';
    map.dataset.testid = 'navigation-map';
    map.setAttribute('aria-label', `${plan.hubName} local destination map`);
    const grid = document.createElement('span');
    grid.className = 'navigation-map-grid';
    grid.setAttribute('aria-hidden', 'true');
    const routes = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    routes.classList.add('navigation-map-routes');
    routes.setAttribute('viewBox', '0 0 100 100');
    routes.setAttribute('preserveAspectRatio', 'none');
    routes.setAttribute('aria-hidden', 'true');
    const byId = new Map(plan.destinations.map((destination) => [destination.id, destination]));
    for (const edge of plan.edges) {
      const from = byId.get(edge.fromId)!;
      const to = byId.get(edge.toId)!;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(from.x));
      line.setAttribute('y1', String(from.y));
      line.setAttribute('x2', String(to.x));
      line.setAttribute('y2', String(to.y));
      routes.append(line);
    }
    const mapLabel = document.createElement('div');
    mapLabel.className = 'navigation-map-label';
    mapLabel.innerHTML = `<strong>LOCAL NAV</strong><span>${plan.layoutId.replace('-', ' ')} // ${plan.localCode}</span>`;
    map.append(grid, routes, mapLabel);

    for (const destination of plan.destinations) {
      const button = document.createElement('button');
      button.className = 'navigation-destination-node';
      button.type = 'button';
      button.dataset.destinationId = destination.id;
      button.dataset.testid = this.getDestinationTestId(destination.id);
      button.dataset.available = String(destination.available);
      button.dataset.visited = String(
        this.session.navigation.visitedDestinationIds.includes(destination.id)
      );
      button.style.setProperty('--nav-x', `${destination.x}%`);
      button.style.setProperty('--nav-y', `${destination.y}%`);
      button.setAttribute('aria-pressed', String(destination.id === this.selectedDestinationId));
      button.setAttribute(
        'aria-label',
        `${destination.label}, ${destination.available ? 'available' : `unavailable: ${destination.unavailableReason}`}`
      );
      const glyph = document.createElement('span');
      glyph.className = 'navigation-node-glyph';
      glyph.textContent = destination.glyph;
      glyph.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.className = 'navigation-node-label';
      label.textContent = destination.shortLabel;
      const state = document.createElement('span');
      state.className = 'navigation-node-state';
      state.textContent = !destination.available
        ? 'LOCKED'
        : this.session.navigation.visitedDestinationIds.includes(destination.id)
          ? 'VISITED'
          : 'OPEN';
      button.append(glyph, label, state);
      button.addEventListener('click', () => this.selectDestination(destination.id));
      button.addEventListener('keydown', (event) => this.handleMapKey(event, destination.id));
      this.destinationButtons.set(destination.id, button);
      map.append(button);
    }
    return map;
  }

  private selectDestination(destinationId: SectorNavigationDestinationId): void {
    this.selectedDestinationId = destinationId;
    for (const [id, button] of this.destinationButtons) {
      button.setAttribute('aria-pressed', String(id === destinationId));
    }
    this.renderDestinationDetail(this.createBriefingContext());
  }

  private renderDestinationDetail(context: NavigationBriefingContext): void {
    if (!this.detailRoot || !this.plan) return;
    const destination = this.plan.destinations.find(
      (candidate) => candidate.id === this.selectedDestinationId
    )!;
    const heading = document.createElement('div');
    heading.className = 'navigation-detail-heading';
    const identity = document.createElement('div');
    const kicker = document.createElement('p');
    kicker.className = 'eyebrow';
    kicker.textContent = `${destination.deckLabel} // ${destination.available ? 'TRANSIT OPEN' : 'ACCESS HOLD'}`;
    const title = document.createElement('h2');
    title.textContent =
      destination.id === 'launch'
        ? (this.mission?.stageLabel ?? `Entering ${context.sector.sectorName}`)
        : destination.label;
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
    if (destination.id === 'launch') summary.dataset.testid = 'mission-story-brief';
    summary.textContent =
      destination.unavailableReason ??
      (destination.id === 'launch' ? this.createLaunchStory(context) : destination.summary);
    const body = document.createElement('div');
    body.className = 'navigation-detail-body';
    this.appendDestinationBody(body, destination, context);
    const action = document.createElement('button');
    action.className = destination.id === 'launch' ? 'primary-button' : 'secondary-button';
    action.type = 'button';
    action.dataset.testid = 'navigation-destination-action';
    action.disabled = !destination.available;
    action.textContent = destination.available ? destination.actionLabel : 'Transit Unavailable';
    action.addEventListener('click', () => this.activateDestination(destination.id));
    this.detailRoot.replaceChildren(heading, summary, body, action);
  }

  private appendDestinationBody(
    body: HTMLElement,
    destination: SectorNavigationDestination,
    context: NavigationBriefingContext
  ): void {
    if (destination.id === 'launch') {
      this.appendLaunchBriefing(body, context);
      return;
    }
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

  private activateDestination(destinationId: SectorNavigationDestinationId): void {
    const destination = this.plan?.destinations.find((candidate) => candidate.id === destinationId);
    if (!destination?.available) return;
    this.session.navigation = recordSectorNavigationVisit(this.session.navigation, destinationId);
    switch (destinationId) {
      case 'launch':
        this.onEnterSector();
        break;
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

  private handleMapKey(event: KeyboardEvent, originId: SectorNavigationDestinationId): void {
    const direction = event.key;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(direction) || !this.plan) {
      return;
    }
    event.preventDefault();
    const origin = this.plan.destinations.find((destination) => destination.id === originId)!;
    const candidates = this.plan.destinations
      .filter((candidate) => candidate.id !== originId)
      .map((candidate) => ({
        candidate,
        dx: candidate.x - origin.x,
        dy: candidate.y - origin.y
      }))
      .filter(({ dx, dy }) => {
        if (direction === 'ArrowUp') return dy < 0;
        if (direction === 'ArrowDown') return dy > 0;
        if (direction === 'ArrowLeft') return dx < 0;
        return dx > 0;
      })
      .sort((left, right) => {
        const leftPrimary =
          direction === 'ArrowUp' || direction === 'ArrowDown'
            ? Math.abs(left.dy)
            : Math.abs(left.dx);
        const rightPrimary =
          direction === 'ArrowUp' || direction === 'ArrowDown'
            ? Math.abs(right.dy)
            : Math.abs(right.dx);
        const leftCross =
          direction === 'ArrowUp' || direction === 'ArrowDown'
            ? Math.abs(left.dx)
            : Math.abs(left.dy);
        const rightCross =
          direction === 'ArrowUp' || direction === 'ArrowDown'
            ? Math.abs(right.dx)
            : Math.abs(right.dy);
        return leftPrimary + leftCross * 0.45 - (rightPrimary + rightCross * 0.45);
      });
    const next = candidates[0]?.candidate;
    if (!next) return;
    this.selectDestination(next.id);
    this.destinationButtons.get(next.id)?.focus();
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

  private getDestinationTestId(destinationId: SectorNavigationDestinationId): string {
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
