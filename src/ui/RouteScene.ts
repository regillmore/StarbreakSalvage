import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { RouteOption, RunSkeleton, StartingContract } from '../game/Generation';
import { createActDebugState, formatActSectorLabel } from '../game/ActPlan';
import { createInterActRouteIntelHint } from '../game/InterActJunction';
import {
  getCurrentSector,
  getInterActEffectsForSector,
  type RunSessionState
} from '../game/RunSession';
import { getRunUpgradeDebugLabels } from '../game/UpgradeEffects';
import { selectMissionContract } from '../game/MissionDirector';
import { getMissionObjective } from '../content/objectives';
import {
  createFactionCampaignDebugState,
  getFactionCampaignInfluence
} from '../game/FactionCampaign';
import type { InputAction } from '../systems/InputSystem';
import { createCrewDebugState } from '../game/CrewCommand';
import {
  applyContractScreenTheme,
  createContractScreenThemeModel,
  createContractThemeDebugState,
  createContractThemeStrip,
  getContractThemeOptions
} from './ContractTheme';

export class RouteScene implements Scene {
  public readonly id = 'route';
  private readonly routeButtons: HTMLButtonElement[] = [];

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly run: RunSkeleton,
    private readonly session: RunSessionState,
    private readonly contract: StartingContract,
    private readonly onSelectRoute: (route: RouteOption) => void
  ) {}

  public enter(): void {
    const sector = getCurrentSector(this.run, this.session);
    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide route-panel';
    shell.setAttribute('aria-labelledby', 'route-title');
    const theme = createContractScreenThemeModel(
      this.contract,
      getContractThemeOptions(this.uiRoot.ownerDocument)
    );
    applyContractScreenTheme(shell, theme);

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `${formatActSectorLabel(sector.act)} | Sector ${sector.index} Cleared | Credits ${this.session.credits} | Salvage ${this.session.salvage}`;

    const title = document.createElement('h1');
    title.id = 'route-title';
    title.textContent = 'Choose Route';

    const routeGrid = document.createElement('div');
    routeGrid.className = 'route-grid';
    const interActEffects = getInterActEffectsForSector(this.session, sector);
    const latestObjective = this.session.objectiveHistory.at(-1);
    const campaign = getFactionCampaignInfluence(
      this.run.factionCampaign,
      this.session.factionCampaign,
      sector
    );
    const crew = createCrewDebugState(this.run.crewRoster, this.session.crewRoster);
    const nextSectorIndex = this.session.currentSectorIndex + 1;
    const nextContract = this.run.expedition.sectors[nextSectorIndex]
      ? selectMissionContract(this.run.expedition, nextSectorIndex)
      : null;
    const nextObjective = nextContract
      ? getMissionObjective(nextContract.primaryObjectiveId)
      : null;

    this.routeButtons.length = 0;

    for (const route of sector.routeOptions) {
      const intelHint =
        route.intelHint ?? (interActEffects.routeIntel ? createInterActRouteIntelHint(route) : '');
      const routeButton = document.createElement('button');
      routeButton.className = 'choice-card route-card';
      routeButton.type = 'button';
      routeButton.dataset.testid = `route-${route.kind}`;
      routeButton.addEventListener('click', () => this.onSelectRoute(route));

      const name = document.createElement('span');
      name.className = 'choice-title';
      name.textContent = route.label;

      const risk = document.createElement('span');
      risk.className = 'choice-meta';
      risk.textContent = `Risk ${route.risk}`;

      const hint = document.createElement('span');
      hint.className = 'choice-body';
      hint.textContent = route.rewardHint;

      const pressure = document.createElement('span');
      pressure.className = 'choice-body route-contract-hint';
      pressure.textContent = route.pressureHint ? `Pressure: ${route.pressureHint}` : '';

      const reward = document.createElement('span');
      reward.className = 'choice-body route-contract-hint';
      reward.textContent = route.rewardTierHint ? `Reward: ${route.rewardTierHint}` : '';

      const environment = document.createElement('span');
      environment.className = 'choice-body route-contract-hint';
      environment.textContent = route.environmentalHint
        ? `Terrain: ${route.environmentalHint}`
        : '';

      const intel = document.createElement('span');
      intel.className = 'choice-body route-intel-hint';
      intel.textContent = intelHint;

      const missionPreview = document.createElement('span');
      missionPreview.className = 'choice-body route-contract-hint';
      missionPreview.dataset.testid = `route-${route.kind}-mission-preview`;
      missionPreview.textContent =
        nextContract && nextObjective
          ? `Next mission: ${nextContract.title} / ${nextObjective.hudVerb}. ${nextContract.routePreview}`
          : `Final extraction. ${latestObjective?.summary ?? 'Mission ledger ready to close.'}`;

      const campaignIntel = document.createElement('span');
      campaignIntel.className = 'choice-body route-contract-hint';
      campaignIntel.dataset.testid = `route-${route.kind}-campaign-preview`;
      campaignIntel.textContent = `Campaign: ${campaign.routePreview}${
        campaign.rival
          ? ` Rival ${campaign.rival.name} may recur aboard ${campaign.rival.shipName}.`
          : ''
      }${campaign.crewOfferSignal ? ` Crew lead: ${campaign.crewOfferSignal}` : ''}${
        crew.roster.length > 0 ? ` Wing: ${crew.roster.join(' / ')}.` : ''
      }`;

      routeButton.append(
        name,
        risk,
        hint,
        ...(route.pressureHint ? [pressure] : []),
        ...(route.rewardTierHint ? [reward] : []),
        ...(route.environmentalHint ? [environment] : []),
        ...(intelHint ? [intel] : []),
        missionPreview,
        campaignIntel
      );
      routeGrid.append(routeButton);
      this.routeButtons.push(routeButton);
    }

    shell.append(
      eyebrow,
      createContractThemeStrip(this.uiRoot.ownerDocument, theme),
      title,
      routeGrid
    );
    this.uiRoot.replaceChildren(shell);
    this.routeButtons[0]?.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action !== 'confirm') {
      return;
    }

    const sector = getCurrentSector(this.run, this.session);
    const firstRoute = sector.routeOptions[0];

    if (firstRoute) {
      this.onSelectRoute(firstRoute);
    }
  }

  public getDebugState(): SceneDebugState {
    const sector = getCurrentSector(this.run, this.session);
    const influence = getFactionCampaignInfluence(
      this.run.factionCampaign,
      this.session.factionCampaign,
      sector
    );

    return {
      seed: this.run.seed,
      entityCount: 0,
      act: createActDebugState(sector.act),
      contractTheme: createContractThemeDebugState(this.contract),
      factionCampaign: createFactionCampaignDebugState(
        this.run.factionCampaign,
        this.session.factionCampaign,
        influence
      ),
      upgradeEffects: getRunUpgradeDebugLabels(this.run.upgradeEffects)
    };
  }
}
