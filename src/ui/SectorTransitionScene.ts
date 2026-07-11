import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { RunSkeleton, StartingContract } from '../game/Generation';
import { createActDebugState, formatActSectorLabel } from '../game/ActPlan';
import { formatRouteTagSummary } from '../game/ActTwoDebug';
import { formatInterActEffectsReadout } from '../game/InterActJunction';
import {
  getCurrentSector,
  getInterActEffectsForSector,
  type RunSessionState
} from '../game/RunSession';
import {
  applySectorConditionsToScroll,
  createSectorConditionPlan,
  formatSectorConditionReadout
} from '../game/SectorConditions';
import {
  applySectorPacingToScroll,
  createSectorPacingPlan,
  formatSectorPacingReadout
} from '../game/SectorPacing';
import {
  formatSectorObjectiveVariantDebug,
  formatSectorObjectiveVariantReadout
} from '../game/SectorObjectives';
import { getRunUpgradeDebugLabels } from '../game/UpgradeEffects';
import {
  createMissionSchedule,
  getMissionStage,
  type MissionDebugState,
  type MissionReadModel
} from '../game/MissionDirector';
import { createOperationalMapReadModel } from '../game/OperationalMap';
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

export class SectorTransitionScene implements Scene {
  public readonly id = 'sector-transition';

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly run: RunSkeleton,
    private readonly session: RunSessionState,
    private readonly contract: StartingContract,
    private readonly onEnterSector: () => void,
    private readonly mission: MissionReadModel | null = null,
    private readonly missionDebug: MissionDebugState | null = null,
    private readonly onOpenCrewQuarters: (() => void) | null = null
  ) {}

  public enter(): void {
    const sector = getCurrentSector(this.run, this.session);
    const interActEffects = getInterActEffectsForSector(this.session, sector);
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
    const shell = document.createElement('main');
    shell.className = 'scene-panel transition-panel';
    shell.dataset.testid = 'mission-briefing';
    shell.setAttribute('aria-labelledby', 'transition-title');
    const theme = createContractScreenThemeModel(
      this.contract,
      getContractThemeOptions(this.uiRoot.ownerDocument)
    );
    applyContractScreenTheme(shell, theme);

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `${formatActSectorLabel(sector.act)} | Sector ${sector.index} | ${sector.bossName}`;

    const title = document.createElement('h1');
    title.id = 'transition-title';
    title.textContent = this.mission?.stageLabel ?? `Entering ${sector.sectorName}`;

    const routeLine = document.createElement('p');
    routeLine.className = 'transition-copy';
    routeLine.textContent = `Credits ${this.session.credits} | Salvage ${this.session.salvage} | Hull Patch +${this.session.hullPatch} | Curse ${this.session.curse}`;

    const objectiveLine = document.createElement('p');
    objectiveLine.className = 'transition-copy';
    objectiveLine.dataset.testid = 'mission-objective-preview';
    objectiveLine.textContent = this.mission?.objectiveBrief
      ? `${this.mission.contractSummary} | ${this.mission.objectiveBrief}`
      : [
          `${sector.objective.label} | Travel ${Math.floor(scroll.length)}u | ${
            sector.objective.requiredEnemyKills
          } targets${sector.objective.bossRequired ? ' + boss gate' : ''}`,
          formatSectorObjectiveVariantReadout(sector.objective)
        ]
          .filter((part): part is string => part !== null)
          .join(' | ');

    const conditionLine = document.createElement('p');
    conditionLine.className = 'transition-copy';
    conditionLine.textContent = [
      formatSectorConditionReadout(conditions),
      formatInterActEffectsReadout(interActEffects),
      pacing.arcKind === 'standard' ? null : formatSectorPacingReadout(pacing),
      `Cruise ${Math.round(scroll.baseSpeed)}u/s`
    ]
      .filter((part): part is string => part !== null)
      .join(' | ');

    const waveLine = document.createElement('p');
    waveLine.className = 'transition-copy';
    waveLine.textContent = sector.majorWaves.join(' | ');

    const campaignLine = document.createElement('p');
    campaignLine.className = 'transition-copy';
    campaignLine.dataset.testid = 'faction-campaign-brief';
    campaignLine.textContent = [
      `Faction campaign: ${campaign.missionBrief}`,
      `Response ${campaign.responseLabel} | Aid ${campaign.aid} | Hostility ${campaign.hostility} | Territory ${campaign.territoryPressure}`,
      campaign.rival
        ? `RIVAL ${campaign.rival.name} | ${campaign.rival.title} | ${campaign.rival.shipName} | ${campaign.rival.tactic}`
        : null,
      campaign.crewOfferSignal ? `Crew lead: ${campaign.crewOfferSignal}` : null,
      sector.setPiece ? `Set-piece owner projection: ${campaign.factionName}` : null,
      campaign.finaleIntervention ? 'Finale intervention risk active.' : null
    ]
      .filter((part): part is string => Boolean(part))
      .join(' | ');

    const crew = createCrewDebugState(this.run.crewRoster, this.session.crewRoster);
    const crewLine = document.createElement('p');
    crewLine.className = 'transition-copy';
    crewLine.dataset.testid = 'crew-brief';
    crewLine.textContent =
      crew.roster.length > 0
        ? `Crew manifest: ${crew.roster.join(' | ')} | Commands FOCUS [L], SCREEN [C], SALVAGE [V], REGROUP [O], DISENGAGE [Z].`
        : 'Crew manifest: no wingmates. Rescue and specialist contracts can add run-local allies.';
    const arcLine = document.createElement('p');
    arcLine.className = 'transition-copy';
    arcLine.dataset.testid = 'crew-arc-brief';
    arcLine.textContent = createCrewArcRosterReadModel(
      this.run.crewArcs,
      this.session.crewArcs,
      this.run.crewRoster
    ).summary;

    const schedule = createMissionSchedule(this.run.expedition, this.session.currentSectorIndex);
    const currentStage = getMissionStage(schedule, this.session.mission.currentStageId);
    const operationalMap = createOperationalMapReadModel({
      graph: this.run.expedition,
      sectorIndex: this.session.currentSectorIndex,
      expedition: this.session.expedition,
      operational: this.session.operational,
      currentNodeId: currentStage.nodeId
    });
    const operationalLine = document.createElement('p');
    operationalLine.className = 'transition-copy';
    operationalLine.dataset.testid = 'operational-map-preview';
    operationalLine.textContent = `${operationalMap.operationRange} | ${operationalMap.nodes
      .filter((node) => ['advance', 'detour', 'gate', 'pursuit'].includes(node.role))
      .map(
        (node) =>
          `${node.optional ? 'Optional' : 'Required'} ${node.label}: ${node.timeEstimate}, danger ${node.danger}, ${node.reward}; ${node.consequence}`
      )
      .join(' | ')}`;

    const enterButton = document.createElement('button');
    enterButton.className = 'primary-button';
    enterButton.type = 'button';
    enterButton.textContent = this.mission ? 'Begin Operation' : 'Enter Sector';
    enterButton.addEventListener('click', this.onEnterSector);
    const crewButton = document.createElement('button');
    crewButton.className = 'secondary-button';
    crewButton.type = 'button';
    crewButton.dataset.testid = 'open-crew-quarters';
    crewButton.textContent = 'Crew Quarters';
    crewButton.hidden = this.onOpenCrewQuarters === null;
    crewButton.addEventListener('click', () => this.onOpenCrewQuarters?.());

    shell.append(
      eyebrow,
      createContractThemeStrip(this.uiRoot.ownerDocument, theme),
      title,
      routeLine,
      objectiveLine,
      conditionLine,
      waveLine,
      campaignLine,
      crewLine,
      arcLine,
      operationalLine,
      crewButton,
      enterButton
    );
    this.uiRoot.replaceChildren(shell);
    enterButton.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'confirm') {
      const focused = this.uiRoot.ownerDocument.activeElement;
      if (focused instanceof HTMLButtonElement) focused.click();
      else this.onEnterSector();
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
}
