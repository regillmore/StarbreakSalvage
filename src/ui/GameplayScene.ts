import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import { calculateViewportLayout, type ViewportLayout } from '../app/ViewportLayout';
import type { Vector2 } from '../core/math';
import {
  createBossArenaState,
  formatBossArenaReadout,
  updateBossArenaState,
  type BossArenaPlan,
  type BossArenaState,
  type BossArenaUpdate
} from '../game/BossArena';
import { createDefaultCombatBounds } from '../game/CombatGeometry';
import {
  createCombatState,
  forceCombatEnd,
  getCombatEntityCounts,
  getActiveEnvironmentObjects,
  getEnvironmentObjectScreenState,
  prepareDebugEnvironmentStressScenario,
  prepareDebugCombinedPhaseTenScenario,
  prepareDebugItemStormScenario,
  prepareDebugEnemyRichScenario,
  prepareDebugLongScrollScenario,
  spawnDebugDenseCombatScenario,
  spawnBoss,
  updateCombatState,
  type CombatBounds,
  type CombatRunResult,
  type CombatState
} from '../game/CombatState';
import type { CrewCombatProfile } from '../game/CrewCommand';
import {
  createFleetDebugState,
  type FleetCombatProfile,
  type FleetState
} from '../game/Fleetcraft';
import { createRunTimelineDebugState, type RunTimelineState } from '../game/RunTimeline';
import type { ScenarioLabGameplayPreset } from '../game/ScenarioLab';
import type { BossId } from '../content/bosses';
import type { SectorId } from '../content/sectors';
import { getEnvironmentObjectsForSector } from '../content/environmentObjects';
import type { ShipStats } from '../content/ships';
import { createRng } from '../core/rng';
import {
  createActPressureDebugState,
  createActPressureModel,
  getActPressureRoutePressure,
  type ActPressureModel
} from '../game/ActPressure';
import { createActEconomyProfile } from '../game/ActEconomy';
import { createActDebugState, formatActSectorLabel } from '../game/ActPlan';
import { formatRouteTagSummary } from '../game/ActTwoDebug';
import { createBuildSynergyModel, formatBuildSynergyHud } from '../game/BuildSynergy';
import { createEnemyRolePressureSummary } from '../game/EnemyRolePressure';
import type { RunSkeleton, StartingContract } from '../game/Generation';
import {
  createExpeditionPathReadModel,
  type ExpeditionProgressState
} from '../game/ExpeditionGraph';
import { createItemLoadoutStressModel, createItemStormLoadout } from '../game/ItemStress';
import { getHeatShotCost } from '../game/HeatShot';
import { createHasteReservoirReadModel } from '../game/HasteReservoir';
import {
  createEnvironmentObjectPlacementPlan,
  type EnvironmentObjectPlacementPlan
} from '../game/EnvironmentObjectPlacement';
import { createEnvironmentStressDebugState } from '../game/EnvironmentStress';
import { createLooseCurrencyPlan, type LooseCurrencyPlan } from '../game/LooseCurrency';
import type { ItemInstance } from '../game/Rewards';
import {
  createEngineeringCombatProfile,
  createEngineeringDebugState,
  type EngineeringState
} from '../game/Foundry';
import { getSectorCompletionReason } from '../game/RunOutcome';
import type { RouteCombatModifier } from '../game/RouteEvents';
import type {
  MissionCombatProjection,
  MissionDebugState,
  MissionReadModel
} from '../game/MissionDirector';
import { createMissionObjectiveResultSnapshot } from '../game/ObjectiveDirector';
import { getRunUpgradeDebugLabels } from '../game/UpgradeEffects';
import { createArenaHudFrameModel } from './ArenaHudFrame';
import { createHudMeterModel, createHudThemeModel, type HudThemeOptions } from './HudTheme';
import { createContractThemeDebugState } from './ContractTheme';
import type { GameplayPauseDossier } from './PauseDossier';
import {
  applySectorConditionsToBossArena,
  applySectorConditionsToFeatures,
  applySectorConditionsToScroll,
  formatSectorConditionReadout,
  type SectorConditionPlan
} from '../game/SectorConditions';
import {
  applySectorPacingToBossArena,
  applySectorPacingToEncounterPacing,
  applySectorPacingToFeatures,
  applySectorPacingToScroll,
  createSectorPacingPlan,
  formatSectorPacingBeatDebug,
  formatSectorPacingReadout,
  type SectorPacingPlan
} from '../game/SectorPacing';
import {
  applySecondActFinaleToBossArena,
  createSecondActFinaleDebugState,
  formatSecondActFinaleBossName,
  formatSecondActFinaleOutcome
} from '../game/SecondActFinale';
import {
  applyHazardZoneDirectorToFeatures,
  createHazardZoneDirectorPlan,
  formatHazardZoneDirectorDebug,
  formatHazardZoneDirectorReadout,
  getHazardSequenceOrdinal,
  type HazardZoneDirectorPlan
} from '../game/HazardZoneDirector';
import { resolveSectorHazardCollisions } from '../game/SectorHazards';
import {
  createMeteorStormDebugFixture,
  formatMeteorStormWarning
} from '../game/MeteorStorm';
import { formatSalvageStormWarning } from '../game/SalvageStorm';
import {
  advanceSectorHazardRuntime,
  createSectorHazardRuntimeState,
  formatSectorHazardRuntimeDebug,
  type SectorHazardRuntimeState
} from '../game/SectorHazardRuntime';
import {
  getActiveSectorHazards,
  getVisibleSectorLandmarks,
  type ActiveSectorHazard,
  type SectorHazardActivationOptions,
  type SectorFeaturePlan
} from '../game/SectorFeatures';
import {
  createScrollState,
  formatScrollReadout,
  getScrollProgress,
  setScrollDistance,
  type SectorScrollPlan,
  type ScrollState
} from '../game/ScrollState';
import {
  advanceSectorExitSequence,
  createSectorExitSequence,
  getSectorExitPresentation,
  type SectorExitSequenceReason,
  type SectorExitSequenceState
} from '../game/SectorExitSequence';
import {
  advanceSectorCooldownScroll,
  applySectorCooldownToScroll,
  createSectorCooldownPlan,
  createSectorCooldownState,
  getSectorCooldownPresentation,
  isSectorFieldSettled,
  suppressSectorCooldownSpawns,
  type SectorCooldownPlan,
  type SectorCooldownState
} from '../game/SectorCooldown';
import {
  advancePlayerDestructionSequence,
  createPlayerDestructionSequence,
  getPlayerDestructionPresentation,
  type PlayerDestructionSequenceState
} from '../game/PlayerDestruction';
import {
  createWaveDirectorPlan,
  fitSpawnScheduleBeforeBossLock,
  getObjectiveProgress,
  type WaveDirectorPlan
} from '../game/WaveDirector';
import {
  formatSectorObjectiveVariantDebug,
  formatSectorObjectiveVariantReadout
} from '../game/SectorObjectives';
import {
  getActiveSetPieceComponents,
  getSetPieceComponentScreenState,
  getSetPieceDebugJumpDistance,
  getSetPieceEngagementDistance,
  getSetPieceReadModel,
  isSetPieceBossLockReleased
} from '../game/SetPiece';
import {
  createFactionCampaignDebugState,
  createRivalEnemySpawn,
  type FactionCampaignInfluence,
  type FactionCampaignState
} from '../game/FactionCampaign';
import {
  createCombatFeedbackSnapshot,
  diffCombatFeedback,
  type CombatFeedbackCue
} from '../systems/CombatFeedback';
import {
  getPointerGuidanceAxis,
  preferKeyboardMovement,
  type InputAction,
  type InputSystem
} from '../systems/InputSystem';
import {
  createBoardingTranslatedLoadout,
  type BoardingOperationPlan
} from '../game/BoardingOperation';
import {
  createConfinedEnvironmentPlan,
  type ConfinedEnvironmentPlan
} from '../game/ConfinedEnvironment';
import { createFactionFrontDebugState, type FactionFrontState } from '../game/FactionFront';
import {
  createApexEncounterReadModel,
  createApexDebugState,
  type ApexEncounterPlan,
  type ApexEncounterReadModel,
  type ApexFinaleProfile,
  type ApexHuntState
} from '../game/ApexHunt';
import { formatBeamHazardTrack } from '../game/BeamHazard';

const DEBUG_BOSS_SHORTCUTS: Partial<Record<InputAction, BossId>> = {
  debugBossOne: 'boss_auditor_drone_xl',
  debugBossTwo: 'boss_unsold_missiles_carrier',
  debugBossThree: 'boss_bloom_engine',
  debugBossFour: 'boss_warranty_void_seraph',
  debugBossFive: 'boss_core_wreck'
};
const DEBUG_LONG_SCROLL_RATIO = 0.86;
const DEBUG_LONG_SCROLL_EXIT_LEAD = 120;

interface HudMeterElements {
  readonly root: HTMLDivElement;
  readonly fill: HTMLSpanElement;
  readonly value: HTMLSpanElement;
}

export interface GameplayMissionContext {
  readonly projection: MissionCombatProjection;
  readonly readModel: MissionReadModel;
  readonly debugState: MissionDebugState;
}

export class GameplayScene implements Scene {
  public readonly id = 'gameplay';

  private combatState: CombatState | null = null;
  private wavePlan: WaveDirectorPlan | null = null;
  private scrollState: ScrollState | null = null;
  private routeConditionedScroll: SectorScrollPlan | null = null;
  private sectorPacingPlan: SectorPacingPlan | null = null;
  private actPressureModel: ActPressureModel | null = null;
  private hazardZoneDirectorPlan: HazardZoneDirectorPlan | null = null;
  private sectorHazardRuntimeState: SectorHazardRuntimeState | null = null;
  private environmentObjectPlan: EnvironmentObjectPlacementPlan | null = null;
  private looseCurrencyPlan: LooseCurrencyPlan | null = null;
  private conditionedScroll: SectorScrollPlan | null = null;
  private sectorCooldownPlan: SectorCooldownPlan | null = null;
  private conditionedFeatures: SectorFeaturePlan | null = null;
  private conditionedArena: BossArenaPlan | null | undefined;
  private bossArenaState: BossArenaState | null = null;
  private bossArenaUpdate: BossArenaUpdate = {
    phase: 'none',
    speedOverride: null,
    shouldSpawnBoss: false
  };
  private viewportLayout: ViewportLayout | null = null;
  private viewportLayoutKey = '';
  private readonly positionReadout: HTMLParagraphElement;
  private readonly distanceReadout: HTMLParagraphElement;
  private readonly hullReadout: HTMLParagraphElement;
  private readonly economyReadout: HTMLParagraphElement;
  private readonly objectiveReadout: HTMLParagraphElement;
  private readonly verbReadout: HTMLParagraphElement;
  private readonly weaponReadout: HTMLParagraphElement;
  private readonly combatReadout: HTMLParagraphElement;
  private readonly bossReadout: HTMLParagraphElement;
  private readonly warningReadout: HTMLParagraphElement;
  private readonly itemReadout: HTMLParagraphElement;
  private readonly hintReadout: HTMLParagraphElement;
  private readonly commandReadout: HTMLParagraphElement;
  private readonly exitToast: HTMLParagraphElement;
  private readonly destructionToast: HTMLParagraphElement;
  private readonly hullMeter: HudMeterElements;
  private readonly specialMeter: HudMeterElements;
  private readonly bombMeter: HudMeterElements;
  private readonly heatMeter: HudMeterElements;
  private readonly confinedEnvironment: ConfinedEnvironmentPlan | null;
  private hudRoot: HTMLElement | null = null;
  private arenaHudRoot: HTMLElement | null = null;
  private arenaHudLayoutKey = '';
  private apexContactBanner: HTMLElement | null = null;
  private readonly apexEncounterPresentation: ApexEncounterReadModel | null;
  private exitSequence: SectorExitSequenceState | null = null;
  private exitSequenceResult: CombatRunResult | null = null;
  private sectorCooldown: SectorCooldownState | null = null;
  private destructionSequence: PlayerDestructionSequenceState | null = null;
  private destructionSequenceResult: CombatRunResult | null = null;
  private sectorCompleted = false;
  private queuedSpecial = false;
  private queuedBomb = false;
  private debugScenario: string | null = null;
  private scenarioLabPreset: ScenarioLabGameplayPreset | null = null;
  private scenarioLabCaseCount = 0;

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly input: InputSystem,
    private readonly run: RunSkeleton,
    private readonly contract: StartingContract,
    private readonly shipStats: ShipStats,
    private readonly engineeringState: EngineeringState,
    private readonly combatModifiers: readonly RouteCombatModifier[],
    private readonly sectorConditions: SectorConditionPlan,
    private readonly sectorIndex: number,
    private readonly expeditionProgress: ExpeditionProgressState,
    private readonly itemLoadout: readonly ItemInstance[],
    private readonly startingCredits: number,
    private readonly startingSalvage: number,
    private readonly debugEnabled: boolean,
    private readonly onFeedback: (cues: readonly CombatFeedbackCue[]) => void,
    private readonly onPause: (scene: GameplayScene) => void,
    private readonly onGameOver: (result: CombatRunResult) => void,
    private readonly onSectorComplete: (result: CombatRunResult) => void,
    private readonly missionContext: GameplayMissionContext | null = null,
    private readonly campaignInfluence: FactionCampaignInfluence | null = null,
    private readonly campaignState: FactionCampaignState | null = null,
    private readonly crewProfile: CrewCombatProfile | null = null,
    private readonly runTimeline: RunTimelineState | null = null,
    private readonly factionFrontState: FactionFrontState | null = null,
    private readonly fleetProfile: FleetCombatProfile | null = null,
    private readonly fleetState: FleetState | null = null,
    private readonly apexEncounter: ApexEncounterPlan | null = null,
    private readonly apexProfile: ApexFinaleProfile | null = null,
    private readonly apexState: ApexHuntState | null = null
  ) {
    this.confinedEnvironment = this.missionContext?.projection.boardingOperation
      ? createConfinedEnvironmentPlan(this.missionContext.projection.boardingOperation)
      : null;
    this.apexEncounterPresentation = this.apexEncounter
      ? createApexEncounterReadModel(this.apexEncounter)
      : null;
    this.positionReadout = document.createElement('p');
    this.positionReadout.className = 'sr-only';
    this.positionReadout.dataset.testid = 'player-position';

    this.distanceReadout = document.createElement('p');
    this.distanceReadout.className = 'hud-pill hud-pill-progress';
    this.distanceReadout.dataset.testid = 'distance-readout';

    this.hullReadout = document.createElement('p');
    this.hullReadout.className = 'hud-pill hud-pill-vital';
    this.hullReadout.dataset.testid = 'hull-readout';

    this.economyReadout = document.createElement('p');
    this.economyReadout.className = 'hud-pill hud-pill-vital';
    this.economyReadout.dataset.testid = 'pickup-readout';

    this.objectiveReadout = document.createElement('p');
    this.objectiveReadout.className = 'hud-pill hud-pill-wide hud-pill-objective';
    this.objectiveReadout.dataset.testid = 'objective-readout';

    this.verbReadout = document.createElement('p');
    this.verbReadout.className = 'hud-pill hud-pill-resource';
    this.verbReadout.dataset.testid = 'verb-readout';

    this.weaponReadout = document.createElement('p');
    this.weaponReadout.className = 'hud-pill hud-pill-wide hud-pill-system hud-pill-weapon';
    this.weaponReadout.dataset.testid = 'weapon-readout';

    this.combatReadout = document.createElement('p');
    this.combatReadout.className = 'hud-pill';
    this.combatReadout.dataset.testid = 'combat-status';

    this.bossReadout = document.createElement('p');
    this.bossReadout.className = 'hud-pill hud-pill-boss';
    this.bossReadout.dataset.testid = 'boss-readout';

    this.warningReadout = document.createElement('p');
    this.warningReadout.className = 'hud-pill hud-pill-wide hud-pill-warning hud-pill-alert';
    this.warningReadout.dataset.testid = 'boss-warning';

    this.itemReadout = document.createElement('p');
    this.itemReadout.className = 'hud-pill hud-pill-wide';
    this.itemReadout.dataset.testid = 'item-readout';

    this.hintReadout = document.createElement('p');
    this.hintReadout.className = 'hud-pill hud-pill-wide hud-pill-guidance';
    this.hintReadout.dataset.testid = 'hint-readout';

    this.commandReadout = document.createElement('p');
    this.commandReadout.className = 'hud-pill hud-pill-wide hud-pill-system';
    this.commandReadout.dataset.testid = 'crew-command-readout';
    this.commandReadout.setAttribute('aria-live', 'polite');

    this.exitToast = document.createElement('p');
    this.exitToast.className = 'sr-only';
    this.exitToast.dataset.testid = 'sector-exit-toast';
    this.exitToast.dataset.exitState = 'idle';
    this.exitToast.setAttribute('aria-live', 'polite');
    this.exitToast.setAttribute('aria-hidden', 'true');

    this.destructionToast = document.createElement('p');
    this.destructionToast.className = 'sector-exit-toast player-destruction-toast';
    this.destructionToast.dataset.testid = 'player-destruction-toast';
    this.destructionToast.dataset.destructionState = 'idle';
    this.destructionToast.setAttribute('aria-live', 'assertive');
    this.destructionToast.setAttribute('aria-hidden', 'true');

    this.hullMeter = createHudMeterElement(document, 'Hull integrity', 'HUL', 'hull-meter');
    this.specialMeter = createHudMeterElement(document, 'Special charge', 'SPC', 'special-meter');
    this.bombMeter = createHudMeterElement(document, 'Bomb stock', 'BMB', 'bomb-meter');
    this.heatMeter = createHudMeterElement(document, 'Weapon heat', 'HEAT', 'weapon-heat-meter');
  }

  public enter(): void {
    this.getCombatState();

    const ownerDocument = this.uiRoot.ownerDocument;
    const hudTheme = createHudThemeModel(
      this.contract.shipAppearance,
      getHudThemeOptions(ownerDocument)
    );
    const hud = document.createElement('section');
    hud.className = 'game-hud cockpit-hud';
    hud.dataset.exitState = 'idle';
    hud.dataset.testid = 'cockpit-hud';
    hud.dataset.hudTheme = hudTheme.themeKey;
    hud.dataset.hudMode = hudTheme.mode;
    hud.dataset.operationMode = this.missionContext?.projection.operationMode ?? 'flight';
    hud.dataset.environmentKind = this.confinedEnvironment?.kind ?? 'openSpace';
    hud.setAttribute('aria-label', `${this.contract.shipName} cockpit status`);

    for (const [property, value] of Object.entries(hudTheme.cssVariables)) {
      hud.style.setProperty(property, value);
    }

    const chrome = ownerDocument.createElement('div');
    chrome.className = 'hud-cockpit-chrome';

    const themeReadout = ownerDocument.createElement('p');
    themeReadout.className = 'hud-theme-readout';
    themeReadout.dataset.testid = 'hud-theme-readout';
    themeReadout.textContent = `${hudTheme.label} | ${this.contract.shipName}`;

    const sector = document.createElement('p');
    sector.className = 'hud-pill hud-pill-context';
    sector.dataset.testid = 'expedition-readout';
    const expedition = createExpeditionPathReadModel(this.run.expedition, this.expeditionProgress);
    const actSectorLabel = formatActSectorLabel(this.getCurrentSector().act);
    const missionStageLabel = this.missionContext?.readModel.stageLabel ?? 'Sector operation';
    sector.textContent = `${actSectorLabel} | S${this.sectorIndex + 1} ${this.getCurrentSectorName()} | ${missionStageLabel}`;
    sector.setAttribute(
      'aria-label',
      `${actSectorLabel}. Sector ${this.sectorIndex + 1}, ${this.getCurrentSectorName()}. Expedition ${expedition.currentNodeLabel}. Nodes ${expedition.visitedNodeCount} of ${expedition.totalNodeCount}. ${missionStageLabel}.`
    );

    const contract = document.createElement('p');
    contract.className = 'hud-pill';
    contract.textContent = this.contract.shipName;

    const loadout = document.createElement('p');
    loadout.className = 'hud-pill';
    loadout.dataset.testid = 'ship-loadout-readout';
    const engineering = createEngineeringCombatProfile(this.engineeringState);
    loadout.setAttribute(
      'aria-label',
      `${engineering.frameName} engineered loadout. ${engineering.moduleSummary}. Instability ${engineering.instability} of ${engineering.instabilityCapacity}.`
    );
    loadout.textContent = `${engineering.frameName} | ${engineering.moduleSummary} | P${engineering.resources.powerDraw}/${engineering.resources.reactorOutput} H${engineering.resources.heatLoad}/${engineering.resources.thermalCapacity} | INST ${engineering.instability}/${engineering.instabilityCapacity}`;

    const boarding = ownerDocument.createElement('p');
    boarding.className = 'hud-pill hud-pill-wide hud-pill-system';
    boarding.dataset.testid = 'boarding-readout';
    const boardingOperation = this.missionContext?.projection.boardingOperation;
    if (boardingOperation) {
      const translation = createBoardingTranslatedLoadout({
        weaponName: this.getCombatState().weapon.name,
        moduleSummary: engineering.moduleSummary,
        crewCount: this.crewProfile?.members.length ?? 0
      });
      boarding.textContent = `${boardingOperation.title} | ${this.confinedEnvironment?.label ?? 'Confined interior'} | ${boardingOperation.rooms.length} rooms / ${boardingOperation.doors.length} bulkheads | ${translation.summary}`;
      boarding.setAttribute(
        'aria-label',
        `${boardingOperation.title} boarding incursion. ${boardingOperation.summary}. ${translation.primary}. ${translation.modules}. ${translation.crew}. ${translation.bomb}. ${translation.special}. ${translation.collision}.`
      );
    } else {
      boarding.hidden = true;
    }

    const apexEncounterModel = this.apexEncounterPresentation;
    const apex = ownerDocument.createElement('p');
    apex.className = 'hud-pill hud-pill-wide hud-pill-system hud-pill-apex';
    apex.dataset.testid = 'apex-readout';
    if (apexEncounterModel && this.apexProfile) {
      apex.dataset.stage = apexEncounterModel.stage;
      apex.textContent = `${apexEncounterModel.hudReadout} // Lasting effect: ${apexEncounterModel.payoff}`;
      apex.setAttribute(
        'aria-label',
        `${apexEncounterModel.banner}. ${apexEncounterModel.directive} ${apexEncounterModel.payoff}`
      );
    } else {
      apex.hidden = true;
    }

    const frameModel = createArenaHudFrameModel(
      this.getViewportLayout(),
      this.contract.shipAppearance.hudThemeKey
    );
    const arenaFrame = ownerDocument.createElement('section');
    arenaFrame.className = 'arena-hud-frame';
    arenaFrame.dataset.testid = 'arena-hud-frame';
    arenaFrame.dataset.exitState = 'idle';
    arenaFrame.dataset.hudTheme = frameModel.themeKey;
    arenaFrame.dataset.viewportClass = frameModel.viewportClass;
    arenaFrame.dataset.railMode = frameModel.railMode;
    arenaFrame.setAttribute(
      'aria-label',
      `${this.contract.shipName} ${frameModel.designation.toLowerCase()} combat frame`
    );
    for (const [property, value] of Object.entries({
      ...hudTheme.cssVariables,
      ...frameModel.cssVariables
    })) {
      arenaFrame.style.setProperty(property, value);
    }

    const frameBoundary = ownerDocument.createElement('div');
    frameBoundary.className = 'arena-hud-boundary';
    frameBoundary.setAttribute('aria-hidden', 'true');
    for (const corner of ['north-west', 'north-east', 'south-west', 'south-east']) {
      const bracket = ownerDocument.createElement('span');
      bracket.className = `arena-hud-corner arena-hud-corner-${corner}`;
      frameBoundary.append(bracket);
    }

    const frameDesignator = ownerDocument.createElement('header');
    frameDesignator.className = 'arena-hud-designator';
    frameDesignator.dataset.testid = 'arena-hud-designator';
    const frameMark = ownerDocument.createElement('span');
    frameMark.className = 'arena-hud-contract-mark';
    frameMark.textContent = frameModel.contractMark;
    const frameIdentity = ownerDocument.createElement('span');
    frameIdentity.className = 'arena-hud-contract-identity';
    const frameTitle = ownerDocument.createElement('strong');
    frameTitle.textContent = this.contract.shipName;
    const frameSponsor = ownerDocument.createElement('span');
    frameSponsor.textContent = `${frameModel.designation} // ${this.contract.sponsor}`;
    frameIdentity.append(frameTitle, frameSponsor);
    frameDesignator.append(frameMark, frameIdentity);

    const leftMeters = ownerDocument.createElement('div');
    leftMeters.className = 'arena-hud-meter-bank arena-hud-meter-bank-left';
    leftMeters.dataset.testid = 'arena-hud-left-meters';
    leftMeters.append(this.hullMeter.root, this.specialMeter.root);
    const rightMeters = ownerDocument.createElement('div');
    rightMeters.className = 'arena-hud-meter-bank arena-hud-meter-bank-right';
    rightMeters.dataset.testid = 'arena-hud-right-meters';
    rightMeters.append(this.bombMeter.root, this.heatMeter.root);

    const navigationRail = ownerDocument.createElement('div');
    navigationRail.className = 'arena-hud-rail arena-hud-navigation-rail';
    navigationRail.append(this.distanceReadout, this.hullReadout, this.verbReadout);
    const weaponRail = ownerDocument.createElement('div');
    weaponRail.className = 'arena-hud-rail arena-hud-weapon-rail';
    weaponRail.append(this.weaponReadout, this.bossReadout, apex);
    const missionRail = ownerDocument.createElement('div');
    missionRail.className = 'arena-hud-rail arena-hud-mission-rail';
    missionRail.append(this.objectiveReadout, this.warningReadout, this.hintReadout);

    arenaFrame.append(
      frameBoundary,
      frameDesignator,
      leftMeters,
      rightMeters,
      navigationRail,
      weaponRail,
      missionRail
    );
    chrome.append(themeReadout, sector);
    const dossierSource = ownerDocument.createElement('div');
    dossierSource.className = 'hud-dossier-source';
    dossierSource.hidden = true;
    dossierSource.setAttribute('aria-hidden', 'true');
    dossierSource.append(
      this.economyReadout,
      this.combatReadout,
      this.itemReadout,
      this.commandReadout,
      loadout,
      boarding,
      contract
    );
    hud.append(chrome, dossierSource, this.positionReadout);
    const contactBanner = ownerDocument.createElement('aside');
    contactBanner.className = 'apex-contact-banner';
    contactBanner.dataset.testid = 'apex-contact-banner';
    contactBanner.setAttribute('aria-live', 'polite');
    if (apexEncounterModel) {
      const contactEyebrow = ownerDocument.createElement('span');
      contactEyebrow.textContent = apexEncounterModel.banner;
      const contactTitle = ownerDocument.createElement('strong');
      contactTitle.textContent = apexEncounterModel.stageLabel;
      const contactDirective = ownerDocument.createElement('span');
      contactDirective.textContent = apexEncounterModel.directive;
      contactBanner.append(contactEyebrow, contactTitle, contactDirective);
    } else {
      contactBanner.hidden = true;
    }
    this.apexContactBanner = contactBanner;
    this.hudRoot = hud;
    this.arenaHudRoot = arenaFrame;
    this.uiRoot.replaceChildren(
      hud,
      arenaFrame,
      contactBanner,
      this.exitToast,
      this.destructionToast
    );
    this.syncExitSequenceUi();
    this.syncPlayerDestructionUi();
    this.syncReadouts();
  }

  public update(dt: number): void {
    if (this.updatePlayerDestructionSequence(dt)) {
      return;
    }

    if (this.updateSectorExitSequence(dt)) {
      return;
    }

    const scrollState = this.getScrollState();
    const state = this.getCombatState();
    const arenaBeforeScroll = this.updateBossArena(scrollState.distance, state);
    const cooldownPlan = this.getSectorCooldownPlan();

    const setPieceTravelLocked = Boolean(
      state.setPiece &&
      !state.setPiece.completed &&
      scrollState.distance >= getSetPieceEngagementDistance(state.setPiece.plan)
    );
    const scrollAdvance = advanceSectorCooldownScroll(
      scrollState,
      cooldownPlan,
      this.sectorCooldown !== null,
      dt,
      setPieceTravelLocked
        ? 0
        : this.sectorCooldown
          ? scrollState.plan.baseSpeed
          : (arenaBeforeScroll.speedOverride ?? undefined)
    );

    const arenaAfterScroll = this.updateBossArena(scrollState.distance, state);
    advanceSectorHazardRuntime(this.getSectorHazardRuntimeState(), this.getCurrentFeatures(), {
      scrollDistance: scrollState.distance,
      dt,
      scrollingPaused: scrollAdvance.delta === 0,
      nominalScrollSpeed: scrollState.plan.baseSpeed,
      suspended: arenaAfterScroll.phase === 'locked',
      activationOptions: this.getSectorHazardActivationOptions(false)
    });
    const feedbackBefore = createCombatFeedbackSnapshot(state);

    if (arenaAfterScroll.shouldSpawnBoss) {
      spawnBoss(state, this.getCombatBossId(), this.getCombatBounds(), {
        clearField: true
      });
    }

    const special = this.queuedSpecial;
    const bomb = this.queuedBomb;
    this.queuedSpecial = false;
    this.queuedBomb = false;
    const movement = this.getEffectiveMovementAxis(state);
    let result = updateCombatState(
      state,
      {
        movement,
        fire: this.input.isActionPressed('fire') || this.input.isPointerFirePressed(),
        special,
        bomb,
        scrollDistance: scrollState.distance
      },
      dt,
      this.getCombatBounds()
    );
    this.emitFeedback(diffCombatFeedback(feedbackBefore, createCombatFeedbackSnapshot(state)));

    this.updateBossArena(scrollState.distance, state);

    if (!result && this.bossArenaUpdate.phase !== 'locked') {
      const hazardFeedbackBefore = createCombatFeedbackSnapshot(state);
      const collisions = resolveSectorHazardCollisions(
        state,
        this.getCurrentFeatures(),
        scrollState.distance,
        this.getCombatBounds(),
        this.getSectorHazardActivationOptions()
      );

      if (collisions.hitHazardIds.length > 0) {
        this.emitFeedback(
          diffCombatFeedback(hazardFeedbackBefore, createCombatFeedbackSnapshot(state))
        );
      }

      if (state.player.hull <= 0) {
        result = forceCombatEnd(state, 'destroyed');
      }
    }

    this.syncReadouts();

    if (result) {
      if (result.reason === 'destroyed') {
        this.startPlayerDestructionSequence(result);
        return;
      }

      this.emitFeedback(['runEnd']);
      this.onGameOver(this.withWorldOffset(result));
      return;
    }

    if (this.sectorCooldown) {
      const cooldown = getSectorCooldownPresentation(this.sectorCooldown, scrollState.distance);

      if (cooldown.complete) {
        this.startSectorExitSequence(this.sectorCooldown.reason);
      }

      return;
    }

    const progress = getObjectiveProgress(this.getWavePlan(), state);
    const setPieceComplete = !state.setPiece || state.setPiece.completed;
    const fieldSettled = isSectorFieldSettled(state);
    const completionReason =
      setPieceComplete && fieldSettled
        ? ((progress.complete ? this.missionContext?.projection.completionReason : null) ??
          getSectorCompletionReason(this.run, this.sectorIndex, progress))
        : null;

    if (!this.sectorCompleted && completionReason) {
      this.sectorCompleted = true;
      this.startSectorCooldown(completionReason);
    }
  }

  public render(renderer: CanvasRenderer, _alpha: number): void {
    const state = this.getCombatState();
    const scroll = this.getScrollState();
    const bounds = this.getCombatBounds();
    const exitPresentation = this.exitSequence
      ? getSectorExitPresentation(this.exitSequence)
      : null;
    const exitEscorts = new Map(
      (exitPresentation?.escorts ?? []).map((escort) => [escort.id, escort] as const)
    );

    if (this.confinedEnvironment) {
      renderer.paintConfinedBackground(this.confinedEnvironment, scroll.cameraOffset);
    } else {
      renderer.paintBackground(scroll.cameraOffset, this.getCurrentSector().background);
    }
    renderer.beginGameplayLayer();
    if (this.missionContext?.projection.boardingOperation && this.confinedEnvironment) {
      renderer.paintBoardingInterior(
        this.missionContext.projection.boardingOperation,
        this.confinedEnvironment,
        scroll.distance,
        bounds
      );
    }
    renderer.paintSectorLandmarks(
      getVisibleSectorLandmarks(this.getCurrentFeatures(), scroll.distance, bounds.height),
      bounds
    );

    if (this.bossArenaUpdate.phase !== 'locked') {
      renderer.paintSectorHazards(this.getActiveHazards(scroll.distance), bounds);
    }

    for (const object of getActiveEnvironmentObjects(state)) {
      renderer.paintEnvironmentObject(getEnvironmentObjectScreenState(state, object));
    }

    for (const component of getActiveSetPieceComponents(state.setPiece, state.scrollDistance)) {
      renderer.paintSetPieceComponent(
        getSetPieceComponentScreenState(state.scrollDistance, component)
      );
    }

    for (const pickup of state.pickups) {
      renderer.paintPickup(pickup);
    }

    for (const telegraph of state.telegraphs) {
      renderer.paintTelegraph(telegraph);
    }

    for (const effect of state.effects) {
      renderer.paintCombatEffect(effect);
    }

    for (const ally of state.allies) {
      const departure = exitEscorts.get(`ally:${ally.candidateId}`);
      renderer.paintAlly(
        departure
          ? {
              ...ally,
              x: departure.x,
              y: departure.y,
              scale: departure.scale,
              alpha: departure.alpha,
              departureActive: true,
              departureThrust: departure.thrust
            }
          : ally
      );
    }

    for (const drone of state.drones) {
      const departure = exitEscorts.get(`drone:${drone.id}`);
      renderer.paintDroneFollower(
        departure
          ? {
              ...drone,
              x: departure.x,
              y: departure.y,
              scale: departure.scale,
              alpha: departure.alpha,
              departureActive: true,
              departureThrust: departure.thrust
            }
          : drone
      );
    }

    for (const enemy of state.enemies) {
      renderer.paintEnemy(enemy);
    }

    if (state.boss) {
      renderer.paintBoss(state.boss);
    }

    for (const projectile of state.projectiles) {
      renderer.paintProjectile(projectile);
    }

    if (this.destructionSequence) {
      renderer.paintPlayerDestruction(getPlayerDestructionPresentation(this.destructionSequence));
    } else {
      renderer.paintPlayerShip({
        x: exitPresentation?.shipX ?? state.player.x,
        y: exitPresentation?.shipY ?? state.player.y,
        radius: state.player.radius,
        thrust:
          exitPresentation?.thrust ??
          Math.max(
            Math.abs(this.getEffectiveMovementAxis(state).x),
            Math.abs(this.getEffectiveMovementAxis(state).y)
          ),
        appearance: this.contract.shipAppearance,
        invulnerable: state.player.invulnerableSeconds > 0,
        hull: state.player.hull,
        maxHull: state.player.maxHull,
        invulnerableSeconds: state.player.invulnerableSeconds,
        specialCharge: state.player.specialCharge,
        maxSpecialCharge: state.player.maxSpecialCharge,
        specialCooldown: state.player.specialCooldown,
        specialActiveSeconds: state.player.specialActiveSeconds,
        bombs: state.player.bombs,
        maxBombs: state.player.maxBombs,
        bombCooldown: state.player.bombCooldown,
        weaponHeat: state.player.weaponHeat,
        weaponOverheatLimit: state.weapon.overheatLimit,
        weaponOverheatSeconds: state.player.weaponOverheatSeconds,
        scale: exitPresentation?.shipScale,
        alpha: exitPresentation?.shipAlpha,
        departureActive: exitPresentation !== null,
        departureExhaustScale: exitPresentation?.exhaustScale,
        departureSpeedLineAlpha: exitPresentation?.speedLineAlpha
      });
    }

    if (exitPresentation) {
      renderer.paintSectorExitTransition(exitPresentation, bounds);
    }
    renderer.endGameplayLayer();
    renderer.paintGameplayFrame(this.contract.shipAppearance);
  }

  public handleAction(action: InputAction): void {
    if (this.destructionSequence) {
      if (action === 'pause' || action === 'back') {
        this.onPause(this);
      }

      return;
    }

    if (this.exitSequence) {
      if (action === 'pause' || action === 'back') {
        this.onPause(this);
      }

      if (action === 'debugSectorComplete' && this.debugEnabled) {
        this.finishSectorExitSequence();
      }

      return;
    }

    if (action === 'special') {
      this.queuedSpecial = true;
    }

    if (action === 'bomb') {
      this.queuedBomb = true;
    }

    if (action === 'pause' || action === 'back') {
      this.onPause(this);
    }

    if (action === 'debugGameOver' && this.debugEnabled) {
      this.emitFeedback(['runEnd']);
      this.onGameOver(forceCombatEnd(this.getCombatState(), 'debug'));
    }

    if (action === 'debugDestroyPlayer' && this.debugEnabled) {
      const state = this.getCombatState();
      state.player.hull = 0;
      state.scrollDistance = this.getScrollState().distance;
      this.startPlayerDestructionSequence(forceCombatEnd(state, 'destroyed'));
      return;
    }

    if (action === 'debugSectorComplete' && this.debugEnabled) {
      this.sectorCompleted = true;
      this.startSectorExitSequence('sectorComplete', { debugFast: true });
      return;
    }

    const debugBossId = DEBUG_BOSS_SHORTCUTS[action];
    if (debugBossId && this.debugEnabled) {
      const state = this.getCombatState();
      const feedbackBefore = createCombatFeedbackSnapshot(state);
      spawnBoss(state, debugBossId, this.getCombatBounds(), { clearField: true });
      this.emitFeedback(diffCombatFeedback(feedbackBefore, createCombatFeedbackSnapshot(state)));
      this.sectorCompleted = false;
      this.sectorCooldown = null;
      this.debugScenario = 'boss-shortcut';
      this.syncReadouts();
    }

    if (action === 'debugDenseCombat' && this.debugEnabled) {
      const state = this.getCombatState();
      const feedbackBefore = createCombatFeedbackSnapshot(state);
      spawnDebugDenseCombatScenario(state, this.getCombatBounds());
      this.emitFeedback(diffCombatFeedback(feedbackBefore, createCombatFeedbackSnapshot(state)));
      this.sectorCompleted = false;
      this.sectorCooldown = null;
      this.debugScenario = 'dense-combat';
      this.syncReadouts();
    }

    if (action === 'debugItemStorm' && this.debugEnabled) {
      const state = this.getCombatState();
      const feedbackBefore = createCombatFeedbackSnapshot(state);
      prepareDebugItemStormScenario(state, this.getCombatBounds(), createItemStormLoadout());
      this.emitFeedback(diffCombatFeedback(feedbackBefore, createCombatFeedbackSnapshot(state)));
      this.sectorCompleted = false;
      this.sectorCooldown = null;
      this.debugScenario = 'item-storm';
      this.syncReadouts();
    }

    if (action === 'debugEnemyRich' && this.debugEnabled) {
      const state = this.getCombatState();
      const feedbackBefore = createCombatFeedbackSnapshot(state);
      prepareDebugEnemyRichScenario(state, this.getCombatBounds());
      this.emitFeedback(diffCombatFeedback(feedbackBefore, createCombatFeedbackSnapshot(state)));
      this.sectorCompleted = false;
      this.sectorCooldown = null;
      this.debugScenario = 'enemy-rich';
      this.syncReadouts();
    }

    if (action === 'debugEnvironmentStress' && this.debugEnabled) {
      const state = this.getCombatState();
      const feedbackBefore = createCombatFeedbackSnapshot(state);
      const scroll = this.getScrollState();
      const fixture = createMeteorStormDebugFixture(
        this.getCurrentFeatures(),
        this.getCurrentScrollPlan().length,
        scroll.distance
      );
      const targetDistance = fixture.targetDistance;

      this.conditionedFeatures = fixture.features;
      setScrollDistance(scroll, Math.max(scroll.distance, targetDistance), scroll.plan.baseSpeed);
      state.scrollDistance = scroll.distance;
      this.sectorHazardRuntimeState = createSectorHazardRuntimeState(scroll.distance);
      this.getSectorHazardRuntimeState().effectiveDistances[fixture.hazard.id] = targetDistance;
      prepareDebugEnvironmentStressScenario(state, this.getCombatBounds());
      this.updateBossArena(scroll.distance, state);
      this.emitFeedback(diffCombatFeedback(feedbackBefore, createCombatFeedbackSnapshot(state)));
      this.sectorCompleted = false;
      this.sectorCooldown = null;
      this.debugScenario = 'environment-stress';
      this.syncReadouts();
    }

    if (action === 'debugLongScroll' && this.debugEnabled) {
      const state = this.getCombatState();
      const feedbackBefore = createCombatFeedbackSnapshot(state);
      const scroll = this.getScrollState();
      const targetDistance = getDebugLongScrollDistance(scroll.plan.length);

      setScrollDistance(scroll, Math.max(scroll.distance, targetDistance), scroll.plan.baseSpeed);
      prepareDebugLongScrollScenario(state, scroll.distance);
      this.updateBossArena(scroll.distance, state);
      this.emitFeedback(diffCombatFeedback(feedbackBefore, createCombatFeedbackSnapshot(state)));
      this.sectorCompleted = false;
      this.sectorCooldown = null;
      this.debugScenario = 'long-scroll';
      this.syncReadouts();
    }

    if (action === 'debugSetPiece' && this.debugEnabled) {
      const state = this.getCombatState();
      const jumpDistance = getSetPieceDebugJumpDistance(state.setPiece?.plan ?? null);

      if (jumpDistance !== null) {
        const scroll = this.getScrollState();
        setScrollDistance(scroll, jumpDistance, scroll.plan.baseSpeed);
        state.scrollDistance = scroll.distance;
        this.updateBossArena(scroll.distance, state);
        this.sectorCompleted = false;
        this.sectorCooldown = null;
        this.debugScenario = `set-piece:${state.setPiece?.plan.definitionId ?? 'none'}`;
        this.syncReadouts();
      }
    }
  }

  public getRunResult(reason: 'abandoned' | 'debug' = 'abandoned'): CombatRunResult {
    return this.withWorldOffset(forceCombatEnd(this.getCombatState(), reason));
  }

  public isBoardingOperation(): boolean {
    return this.missionContext?.projection.operationMode === 'boarding';
  }

  public getPauseDossier(): GameplayPauseDossier {
    const state = this.getCombatState();
    const sector = this.getCurrentSector();
    const scroll = this.getScrollState();
    const expedition = createExpeditionPathReadModel(this.run.expedition, this.expeditionProgress);
    const engineering = createEngineeringCombatProfile(this.engineeringState);
    const pacing = this.getSectorPacingPlan();
    const hazardDirector = this.getHazardZoneDirectorPlan();
    const setPiece = getSetPieceReadModel(state.setPiece);
    const routePressure = this.combatModifiers.map((modifier) => modifier.label).join(', ');
    const boarding = this.missionContext?.projection.boardingOperation;
    const mission = this.missionContext?.readModel;
    const objectiveVariant = formatSectorObjectiveVariantReadout(sector.objective);
    const fullLoadout = `${engineering.frameName} | ${engineering.moduleSummary} | P${engineering.resources.powerDraw}/${engineering.resources.reactorOutput} H${engineering.resources.heatLoad}/${engineering.resources.thermalCapacity} | INST ${engineering.instability}/${engineering.instabilityCapacity}`;
    const operationEntries = [
      { label: 'Objective', value: this.objectiveReadout.textContent ?? 'Objective unavailable' },
      mission?.objectiveBrief ? { label: 'Brief', value: mission.objectiveBrief } : null,
      {
        label: 'Immediate warning',
        value:
          this.warningReadout.textContent === 'Warning clear'
            ? 'No immediate warning.'
            : (this.warningReadout.textContent ?? 'No immediate warning.'),
        tone: this.warningReadout.textContent === 'Warning clear' ? 'standard' : 'warning'
      } as const,
      { label: 'Guidance', value: this.hintReadout.textContent ?? 'Hold the current route.' },
      setPiece
        ? {
            label: 'Set piece',
            value: `${setPiece.name} / ${setPiece.layoutLabel} | ${setPiece.stageLabel} | target ${setPiece.targetLabel} | safe ${setPiece.safeLaneLabel}`
          }
        : null
    ].filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    const sectorEntries = [
      { label: 'Conditions', value: formatSectorConditionReadout(this.sectorConditions) },
      { label: 'Pacing', value: formatSectorPacingReadout(pacing) },
      { label: 'Hazard plan', value: formatHazardZoneDirectorReadout(hazardDirector) },
      objectiveVariant ? { label: 'Objective variant', value: objectiveVariant } : null,
      {
        label: 'Route pressure',
        value:
          routePressure ||
          formatRouteTagSummary(sector.routeOptions) ||
          'No carried route pressure.'
      },
      boarding
        ? {
            label: 'Environment',
            value: `${boarding.title} | ${this.confinedEnvironment?.label ?? 'Confined interior'} | ${boarding.rooms.length} rooms / ${boarding.doors.length} bulkheads`
          }
        : null
    ].filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    const campaignEntries = [
      this.campaignInfluence?.rival
        ? {
            label: 'Rival contact',
            value: `${this.campaignInfluence.rival.name} | ${this.campaignInfluence.rival.shipName} | appearance ${this.campaignInfluence.rival.appearance}`
          }
        : null,
      this.campaignInfluence?.front
        ? {
            label: 'Faction front',
            value: `${this.campaignInfluence.front.mapCue} ${this.campaignInfluence.front.strategyLabel} | ${this.campaignInfluence.front.ownerFactionName} ${this.campaignInfluence.front.stance} | reinforcements ${this.campaignInfluence.frontReinforcementCount} / support ${this.campaignInfluence.frontSupportCount}`
          }
        : null,
      this.campaignInfluence?.frontForecast
        ? { label: 'Forecast', value: this.campaignInfluence.frontForecast }
        : null
    ].filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    return {
      eyebrow: `${formatActSectorLabel(sector.act)} // SECTOR ${this.sectorIndex + 1} // ${mission?.stageLabel ?? 'ACTIVE OPERATION'}`,
      title: sector.sectorName,
      subtitle: mission
        ? `${mission.contractTitle} — ${mission.summary}`
        : `${this.contract.shipName} active contract`,
      metrics: [
        {
          label: boarding ? 'Interior progress' : 'Distance',
          value: boarding
            ? formatBoardingDistanceReadout(boarding, scroll.distance, state.timeSeconds)
            : `${Math.round(scroll.distance)}/${scroll.plan.length}u`
        },
        {
          label: 'Hull',
          value: `${state.player.hull}/${state.player.maxHull}`,
          tone: state.player.hull <= 1 ? 'warning' : 'good'
        },
        { label: 'Credits', value: `${this.startingCredits + state.player.credits}` },
        { label: 'Salvage', value: `${this.startingSalvage + state.player.salvage}` }
      ],
      sections: [
        {
          id: 'operation',
          eyebrow: 'Live orders',
          title: 'Current operation',
          entries: [...operationEntries, ...campaignEntries]
        },
        {
          id: 'sector',
          eyebrow: 'Navigation intelligence',
          title: 'Sector dossier',
          entries: sectorEntries
        },
        {
          id: 'ship',
          eyebrow: this.contract.shipName,
          title: 'Ship systems',
          entries: [
            { label: 'Weapon', value: this.getWeaponReadout(state) },
            { label: 'Reserves', value: this.getVerbReadout(state) },
            { label: 'Signal circuit', value: this.getBuildReadout(state) },
            { label: 'Hardpoints', value: fullLoadout }
          ]
        },
        {
          id: 'ledger',
          eyebrow: `${expedition.visitedNodeCount}/${expedition.totalNodeCount} expedition nodes`,
          title: 'Ledger & support',
          entries: [
            { label: 'Combat', value: this.combatReadout.textContent ?? 'No combat logged.' },
            { label: 'Wing', value: this.getWingReadout(state) },
            {
              label: state.boss ? 'Boss contact' : 'Expected boss',
              value: this.bossReadout.textContent ?? this.getCurrentBossName()
            },
            {
              label: 'Expedition',
              value: `${expedition.currentNodeLabel} | nodes ${expedition.visitedNodeCount}/${expedition.totalNodeCount}`
            }
          ]
        }
      ]
    };
  }

  public prepareScenarioLabPreset(preset: ScenarioLabGameplayPreset, scenarioCount: number): void {
    const state = this.getCombatState();
    const feedbackBefore = createCombatFeedbackSnapshot(state);
    this.scenarioLabPreset = preset;
    this.scenarioLabCaseCount = scenarioCount;

    if (preset === 'setPiece' || preset === 'combined') {
      const jumpDistance = getSetPieceDebugJumpDistance(state.setPiece?.plan ?? null);
      if (jumpDistance !== null) {
        const scroll = this.getScrollState();
        setScrollDistance(scroll, jumpDistance, scroll.plan.baseSpeed);
        state.scrollDistance = scroll.distance;
        this.updateBossArena(scroll.distance, state);
      }
    }
    if (preset === 'combined') {
      prepareDebugCombinedPhaseTenScenario(state, this.getCombatBounds());
    }

    this.sectorCompleted = false;
    this.sectorCooldown = null;
    this.debugScenario = `lab:${preset}`;
    this.emitFeedback(diffCombatFeedback(feedbackBefore, createCombatFeedbackSnapshot(state)));
    this.syncReadouts();
  }

  public prepareDebugFinaleSmoke(): boolean {
    const sector = this.getCurrentSector();
    const finale = sector.finale;
    const arena = this.getCurrentArenaPlan();

    if (!finale || !arena) {
      return false;
    }

    const state = this.getCombatState();
    const scroll = this.getScrollState();
    const feedbackBefore = createCombatFeedbackSnapshot(state);

    setScrollDistance(scroll, arena.lockDistance, scroll.plan.baseSpeed);
    state.scrollDistance = scroll.distance;
    clearExitPressure(state);
    state.bossSpawned = false;
    this.bossArenaState = createBossArenaState(arena);
    this.bossArenaUpdate = updateBossArenaState(this.getBossArenaState(), {
      distance: scroll.distance,
      supportComplete: true,
      bossActive: false,
      bossAlreadySpawned: false,
      bossDefeated: false
    });
    spawnBoss(state, finale.bossId, this.getCombatBounds(), { clearField: true });
    this.bossArenaUpdate = updateBossArenaState(this.getBossArenaState(), {
      distance: scroll.distance,
      supportComplete: true,
      bossActive: true,
      bossAlreadySpawned: true,
      bossDefeated: false
    });
    this.sectorCompleted = false;
    this.sectorCooldown = null;
    this.debugScenario = `finale-smoke:${finale.variantId}`;
    this.emitFeedback(diffCombatFeedback(feedbackBefore, createCombatFeedbackSnapshot(state)));
    this.syncReadouts();
    return true;
  }

  public getDebugState(): SceneDebugState {
    const scroll = getScrollProgress(this.getScrollState());
    const viewportLayout = this.getViewportLayout();
    const bounds = this.getCombatBounds();
    const features = this.getCurrentFeatures();
    const activeLandmarks = getVisibleSectorLandmarks(features, scroll.distance, bounds.height);
    const activeHazards = this.getActiveHazards(scroll.distance);
    const background = this.getCurrentSector().background;
    const currentSector = this.getCurrentSector();
    const combatState = this.getCombatState();
    const objectiveProgress = getObjectiveProgress(this.getWavePlan(), combatState);
    const entityCounts = getCombatEntityCounts(combatState);
    const sectorPacing = this.getSectorPacingPlan();
    const hazardZoneDirector = this.getHazardZoneDirectorPlan();
    const itemStress = createItemLoadoutStressModel(combatState.items);
    const haste = createHasteReservoirReadModel(combatState.items, combatState.player.hasteSeconds);
    const enemyRoles = createEnemyRolePressureSummary(combatState);
    const environmentStress = createEnvironmentStressDebugState(activeHazards, entityCounts);
    const setPiece = getSetPieceReadModel(combatState.setPiece);
    const hudTheme = createHudThemeModel(
      this.contract.shipAppearance,
      getHudThemeOptions(this.uiRoot.ownerDocument)
    );

    return {
      seed: this.run.seed,
      entityCount: entityCounts.total,
      entityCounts,
      distance: scroll.distance,
      sectorLength: scroll.length,
      scrollSpeed: scroll.speed,
      exitSequence: this.exitSequence
        ? `${this.exitSequence.reason} ${getSectorExitPresentation(this.exitSequence).phase} ${Math.round(
            getSectorExitPresentation(this.exitSequence).progress * 100
          )}%`
        : undefined,
      sectorCooldown: this.sectorCooldown
        ? `${Math.round(
            getSectorCooldownPresentation(this.sectorCooldown, scroll.distance).progress * 100
          )}%`
        : undefined,
      destructionSequence: this.destructionSequence
        ? `${this.destructionSequence.motionMode} ${Math.round(
            getPlayerDestructionPresentation(this.destructionSequence).progress * 100
          )}%`
        : undefined,
      arenaPhase: this.bossArenaUpdate.phase,
      debugScenario: this.debugScenario ?? undefined,
      heatShots: {
        fired: combatState.heatShotsFired,
        exhausted: combatState.heatShotsExhausted,
        storedHeat: combatState.player.weaponHeat,
        cost: getHeatShotCost(combatState.weapon.overheatLimit)
      },
      haste: {
        active: haste.active,
        chargeSeconds: haste.chargeSeconds,
        capacitySeconds: haste.capacitySeconds,
        sourceCount: haste.sourceCount,
        pauseDrainWhileNotFiring: haste.pauseDrainWhileNotFiring,
        fireCooldownMultiplier: haste.fireCooldownMultiplier
      },
      mission: this.missionContext?.debugState,
      boarding: this.missionContext?.projection.boardingOperation
        ? {
            operationId: this.missionContext.projection.boardingOperation.id,
            title: this.missionContext.projection.boardingOperation.title,
            target: this.missionContext.projection.boardingOperation.targetKind,
            rooms: this.missionContext.projection.boardingOperation.rooms.length,
            doors: this.missionContext.projection.boardingOperation.doors.length,
            hazards: this.missionContext.projection.boardingOperation.rooms.filter(
              (room) => room.hazard !== null
            ).length,
            loot: this.missionContext.projection.boardingOperation.loot.length,
            extractionSeconds: this.missionContext.projection.boardingOperation.extractionSeconds,
            integrations: this.missionContext.projection.boardingOperation.integrations,
            environmentKind: this.confinedEnvironment?.kind ?? 'capitalHull',
            environmentLabel: this.confinedEnvironment?.label ?? 'Confined interior'
          }
        : undefined,
      backgroundPrimitives: background.primitiveCount,
      backgroundLayers: background.layers.length,
      activeLandmarks: activeLandmarks.length,
      activeHazards: activeHazards.length,
      viewport: {
        width: viewportLayout.width,
        height: viewportLayout.height,
        className: viewportLayout.viewportClass,
        dpr: viewportLayout.dpr,
        scale: viewportLayout.canvasScale,
        canvasPixelWidth: Math.round(viewportLayout.width * viewportLayout.dpr),
        canvasPixelHeight: Math.round(viewportLayout.height * viewportLayout.dpr),
        safeFrameX: viewportLayout.gameplaySafeFrame.x,
        safeFrameY: viewportLayout.gameplaySafeFrame.y,
        safeFrameWidth: viewportLayout.gameplaySafeFrame.width,
        safeFrameHeight: viewportLayout.gameplaySafeFrame.height,
        arenaWidth: bounds.width,
        arenaHeight: bounds.height
      },
      inputMode: this.input.getActiveInputMode(),
      hudMode: hudTheme.mode,
      contractTheme: createContractThemeDebugState(this.contract),
      shipLoadout: this.contract.loadout.debug,
      engineering: createEngineeringDebugState(this.engineeringState),
      combinedProc: combatState.procTelemetry,
      items: itemStress,
      enemyRoles,
      environmentStress,
      setPiece: setPiece ?? undefined,
      factionCampaign: this.campaignState
        ? createFactionCampaignDebugState(
            this.run.factionCampaign,
            this.campaignState,
            this.campaignInfluence
          )
        : undefined,
      factionFronts: this.factionFrontState
        ? createFactionFrontDebugState(
            this.run.factionFronts,
            this.factionFrontState,
            this.sectorIndex
          )
        : undefined,
      crew: {
        activeCommand: combatState.crewCommand.active,
        commandCooldown: combatState.crewCommand.cooldownSeconds,
        issuedCommands: combatState.crewCommand.issuedCount,
        allies: combatState.allies.map(
          (ally) => `${ally.callsign}:${ally.status}:H${ally.hull}/${ally.maxHull}:${ally.fitLabel}`
        )
      },
      fleet:
        this.fleetState && this.fleetProfile
          ? createFleetDebugState(
              this.run.fleet,
              this.fleetState,
              combatState.allies.filter((ally) => ally.source === 'fleet').length
            )
          : undefined,
      apex: this.apexState ? createApexDebugState(this.run.apexHunts, this.apexState) : undefined,
      runTimeline: this.runTimeline ? createRunTimelineDebugState(this.runTimeline) : undefined,
      scenarioLab: this.scenarioLabPreset
        ? {
            scenarioCount: this.scenarioLabCaseCount,
            activeScenario: this.scenarioLabPreset,
            systems: [
              'mission actors',
              'multi-part geometry',
              'ally AI',
              'module/item procs',
              'sustained load'
            ],
            budget: `E${entityCounts.enemies} A${entityCounts.allies} P${entityCounts.projectiles} G${entityCounts.setPieceComponents ?? 0} H${combatState.procTelemetry.budget}`
          }
        : undefined,
      actPressure: createActPressureDebugState({
        model: this.getActPressureModel(),
        enemyRoles,
        environmentStress,
        itemStress,
        hazardZoneDirector
      }),
      finale: currentSector.finale
        ? createSecondActFinaleDebugState(currentSector.finale)
        : undefined,
      upgradeEffects: getRunUpgradeDebugLabels(this.run.upgradeEffects),
      act: createActDebugState(currentSector.act),
      progression: {
        runCredits: this.startingCredits + combatState.player.credits,
        runSalvage: this.startingSalvage + combatState.player.salvage
      },
      sector: {
        index: this.sectorIndex + 1,
        id: currentSector.sectorId,
        name: currentSector.sectorName,
        backgroundId: currentSector.background.id,
        objective: formatSectorObjectiveVariantDebug(currentSector.objective) ?? undefined,
        objectiveState: objectiveProgress.readout,
        routeTags: formatRouteTagSummary(currentSector.routeOptions) ?? undefined,
        encounterPacing: currentSector.encounterPacing ? 'paced' : undefined,
        pacing: sectorPacing.arcKind === 'standard' ? undefined : sectorPacing.debugLabel,
        pacingBeat:
          formatSectorPacingBeatDebug(sectorPacing, scroll.distance, scroll.length) ?? undefined,
        hazardZones: formatHazardZoneDirectorDebug(hazardZoneDirector),
        hazardRuntime: formatSectorHazardRuntimeDebug(this.getSectorHazardRuntimeState())
      }
    };
  }

  private startSectorExitSequence(
    reason: SectorExitSequenceReason,
    options: { readonly debugFast?: boolean } = {}
  ): void {
    if (this.exitSequenceResult) {
      return;
    }

    const state = this.getCombatState();
    const scroll = this.getScrollState();

    state.scrollDistance = scroll.distance;
    clearExitPressure(state);
    this.exitSequence = createSectorExitSequence({
      sectorName: this.getCurrentSectorName(),
      sectorIndex: this.sectorIndex,
      sectorCount: this.run.sectors.length,
      reason,
      reducedMotion: getHudThemeOptions(this.uiRoot.ownerDocument).reducedMotion,
      playerX: state.player.x,
      playerY: state.player.y,
      escorts: [
        ...state.allies
          .filter(({ status }) => status === 'active')
          .map((ally) => ({
            id: `ally:${ally.candidateId}`,
            kind: 'ally' as const,
            x: ally.x,
            y: ally.y,
            radius: ally.radius
          })),
        ...state.drones.map((drone) => ({
          id: `drone:${drone.id}`,
          kind: 'drone' as const,
          x: drone.x,
          y: drone.y,
          radius: drone.radius
        }))
      ],
      debugFast: options.debugFast
    });
    this.exitSequenceResult = this.withWorldOffset(forceCombatEnd(state, reason));
    this.emitFeedback(['sectorClear']);
    this.syncExitSequenceUi();
    this.syncReadouts();
  }

  private startSectorCooldown(reason: SectorExitSequenceReason): void {
    if (this.sectorCooldown || this.exitSequenceResult) {
      return;
    }

    const settlingHazardIds = this.getActiveHazards().map(({ hazard }) => hazard.id);
    const cooldown = createSectorCooldownState(
      this.getSectorCooldownPlan(),
      reason,
      settlingHazardIds
    );

    if (!cooldown) {
      this.startSectorExitSequence(reason);
      return;
    }

    const state = this.getCombatState();
    state.scrollDistance = this.getScrollState().distance;
    suppressSectorCooldownSpawns(state);
    this.sectorCooldown = cooldown;
    this.syncReadouts();
  }

  private updateSectorExitSequence(dt: number): boolean {
    if (!this.exitSequence) {
      return false;
    }

    const complete = advanceSectorExitSequence(this.exitSequence, dt);
    this.syncExitSequenceUi();
    this.syncReadouts();

    if (complete) {
      this.finishSectorExitSequence();
    }

    return true;
  }

  private finishSectorExitSequence(): void {
    const result = this.exitSequenceResult;

    if (!result) {
      return;
    }

    if (this.exitSequence) {
      advanceSectorExitSequence(this.exitSequence, this.exitSequence.durationSeconds);
    }
    this.exitSequenceResult = null;
    this.sectorCooldown = null;
    this.syncExitSequenceUi();

    if (result.reason === 'victory') {
      this.emitFeedback(['runEnd']);
      this.onGameOver(result);
      return;
    }

    this.onSectorComplete(result);
  }

  private startPlayerDestructionSequence(result: CombatRunResult): void {
    if (this.destructionSequenceResult) {
      return;
    }

    const state = this.getCombatState();
    const settings = getHudThemeOptions(this.uiRoot.ownerDocument);

    state.player.hull = 0;
    state.scrollDistance = this.getScrollState().distance;
    this.destructionSequence = createPlayerDestructionSequence({
      shipName: this.contract.shipName,
      appearance: this.contract.shipAppearance,
      x: state.player.x,
      y: state.player.y,
      radius: state.player.radius,
      reducedMotion: settings.reducedMotion,
      performanceMode: settings.performanceMode,
      bulletContrast: settings.bulletContrast
    });
    this.destructionSequenceResult = result;
    this.emitFeedback(['playerDestroyed']);
    this.syncPlayerDestructionUi();
    this.syncReadouts();
  }

  private updatePlayerDestructionSequence(dt: number): boolean {
    if (!this.destructionSequence) {
      return false;
    }

    const complete = advancePlayerDestructionSequence(this.destructionSequence, dt);
    this.syncPlayerDestructionUi();
    this.syncReadouts();

    if (complete) {
      this.finishPlayerDestructionSequence();
    }

    return true;
  }

  private finishPlayerDestructionSequence(): void {
    const result = this.destructionSequenceResult;

    if (!result) {
      return;
    }

    this.destructionSequence = null;
    this.destructionSequenceResult = null;
    this.syncPlayerDestructionUi();
    this.emitFeedback(['runEnd']);
    this.onGameOver(result);
  }

  private syncExitSequenceUi(): void {
    if (!this.exitSequence) {
      this.exitToast.dataset.exitState = 'idle';
      delete this.exitToast.dataset.exitPhase;
      delete this.exitToast.dataset.exitEscorts;
      this.exitToast.setAttribute('aria-hidden', 'true');
      this.exitToast.textContent = '';
      if (this.hudRoot) {
        this.hudRoot.dataset.exitState = 'idle';
      }
      if (this.arenaHudRoot) {
        this.arenaHudRoot.dataset.exitState = 'idle';
      }
      return;
    }

    const presentation = getSectorExitPresentation(this.exitSequence);
    this.exitToast.dataset.exitState = 'active';
    this.exitToast.dataset.exitPhase = presentation.phase;
    this.exitToast.dataset.exitEscorts = String(presentation.escorts.length);
    this.exitToast.setAttribute('aria-hidden', 'false');
    this.exitToast.textContent = presentation.announcement;
    if (this.hudRoot) {
      this.hudRoot.dataset.exitState = 'active';
    }
    if (this.arenaHudRoot) {
      this.arenaHudRoot.dataset.exitState = 'active';
    }
  }

  private syncPlayerDestructionUi(): void {
    if (!this.destructionSequence) {
      this.destructionToast.dataset.destructionState = 'idle';
      this.destructionToast.setAttribute('aria-hidden', 'true');
      this.destructionToast.textContent = '';
      return;
    }

    const presentation = getPlayerDestructionPresentation(this.destructionSequence);
    this.destructionToast.dataset.destructionState = 'active';
    this.destructionToast.dataset.destructionMotion = presentation.motionMode;
    this.destructionToast.setAttribute('aria-hidden', 'false');
    this.destructionToast.textContent = `Cockpit failure | ${presentation.transponderText}`;
  }

  private getCombatState(): CombatState {
    const wavePlan = this.getWavePlan();
    const engineering = createEngineeringCombatProfile(this.engineeringState);

    const setPiecePlan = this.getCurrentSector().setPiece;
    const rivalSpawn = this.campaignInfluence
      ? createRivalEnemySpawn(
          this.campaignInfluence,
          this.sectorIndex,
          this.getCurrentScrollPlan().length
        )
      : null;
    const influencedSpawnSchedule = wavePlan.spawnSchedule.map((spawn, index) =>
      this.campaignInfluence && index % 3 === 0
        ? { ...spawn, factionId: this.campaignInfluence.enemyFactionId }
        : spawn
    );
    const frontReinforcements = influencedSpawnSchedule
      .filter((spawn) => spawn.rivalId === null || spawn.rivalId === undefined)
      .slice(0, this.campaignInfluence?.frontReinforcementCount ?? 0)
      .map((spawn, index) => ({
        ...spawn,
        atSeconds: spawn.atSeconds + 2.5 + index,
        atDistance:
          spawn.atDistance === null || spawn.atDistance === undefined
            ? spawn.atDistance
            : Math.min(
                this.getCurrentScrollPlan().length - 80,
                spawn.atDistance + 110 + index * 70
              ),
        waveLabel: `${this.campaignInfluence?.front?.mapCue ?? '[FRONT]'} reinforcement`,
        factionId: this.campaignInfluence?.front?.ownerFactionId ?? spawn.factionId,
        formationInstanceId: `front-reinforcement:${this.sectorIndex}:${index}`,
        countsForObjective: false
      }));
    const apexContact = this.apexEncounterPresentation;
    const apexContactCount = apexContact
      ? Math.max(1, this.apexProfile?.reinforcementCount ?? 0)
      : 0;
    const apexVariant = this.apexEncounter
      ? {
          trace: 'variant_evasive' as const,
          ambush: 'variant_shielded' as const,
          lieutenant: 'variant_overclocked' as const,
          finale: 'variant_armored' as const
        }[this.apexEncounter.stage]
      : null;
    const apexReinforcements = influencedSpawnSchedule
      .slice(0, apexContactCount)
      .map((spawn, index) => ({
        ...spawn,
        atSeconds: spawn.atSeconds + 4 + index * 1.5,
        atDistance: null,
        hull: spawn.hull + (this.apexEncounter?.stage === 'lieutenant' ? 2 : 1),
        waveLabel: apexContact?.waveLabel ?? '[APEX] marked contact',
        variantId: apexVariant,
        formationInstanceId: `apex-reinforcement:${this.sectorIndex}:${index}`,
        formationLabel: apexContact?.label ?? 'Apex contact',
        countsForObjective: this.apexEncounter?.stage !== 'finale'
      }));
    const spawnSchedule = fitSpawnScheduleBeforeBossLock(
      [
        ...influencedSpawnSchedule,
        ...frontReinforcements,
        ...apexReinforcements,
        ...(rivalSpawn ? [rivalSpawn] : [])
      ].sort(
        (left, right) =>
          (left.atDistance ?? Number.POSITIVE_INFINITY) -
            (right.atDistance ?? Number.POSITIVE_INFINITY) || left.atSeconds - right.atSeconds
      ),
      this.getCurrentArenaPlan()?.lockDistance ?? null
    );
    this.combatState ??= createCombatState(this.getCombatBounds(), this.getCombatSeed(), {
      weaponId: engineering.weaponId,
      shipStats: this.shipStats,
      engineering,
      startingHull: this.missionContext?.projection.startingHull,
      items: this.itemLoadout,
      bossId: this.getCombatBossId(),
      bossSpawnAtSeconds: this.getCurrentArenaPlan() ? null : wavePlan.bossSpawnAtSeconds,
      spawnSchedule,
      enemyHullBonus: this.getEnemyHullBonus(),
      enemyFireDelayMultiplier: this.getEnemyFireDelayMultiplier(),
      bossHullBonus: this.getBossHullBonus(),
      sectorLength: this.getCurrentScrollPlan().length,
      sectorIndex: this.sectorIndex,
      sectorId: this.getCurrentSector().sectorId,
      environmentObjectPlan: this.getEnvironmentObjectPlan(),
      setPiecePlan,
      setPieceOwnerFactionId: this.campaignInfluence?.setPieceOwnerFactionId,
      looseCurrencyPlan: this.getLooseCurrencyPlan(),
      bossPhaseUpgradeEffects: this.run.upgradeEffects.bossPhase,
      sectorStartUpgradeEffects: this.run.upgradeEffects.sectorStart,
      crew: this.crewProfile,
      fleet: this.fleetProfile
    });
    return this.combatState;
  }

  private getEnvironmentObjectPlan(): EnvironmentObjectPlacementPlan {
    if (this.environmentObjectPlan) {
      return this.environmentObjectPlan;
    }

    const sector = this.getCurrentSector();
    const features = this.getCurrentFeatures();
    const wavePlan = this.getWavePlan();
    this.environmentObjectPlan = createEnvironmentObjectPlacementPlan({
      sectorId: sector.sectorId as SectorId,
      sectorIndex: this.sectorIndex,
      scrollLength: this.getCurrentScrollPlan().length,
      rng: createRng(`${this.getCombatSeed()}:environment-objects`),
      definitions:
        this.missionContext?.projection.objectiveWorld?.environmentMode === 'destructibles'
          ? getEnvironmentObjectsForSector(sector.sectorId).filter(
              (definition) => definition.damageInteraction.destructible
            )
          : undefined,
      targetCount: this.missionContext?.projection.objectiveWorld?.environmentTargetCount,
      hazards: features.hazards,
      enemySpawnLanes: wavePlan.spawnSchedule
        .filter((spawn) => spawn.atDistance !== null && spawn.atDistance !== undefined)
        .map((spawn) => ({
          distance: spawn.atDistance ?? 0,
          xRatio: spawn.xRatio,
          width: spawn.formationMemberCount ? 118 : 96,
          label: spawn.waveLabel
        })),
      bossArena: this.getCurrentArenaPlan(),
      actPressure: this.getActPressureModel()
    });

    return this.environmentObjectPlan;
  }

  private getLooseCurrencyPlan(): LooseCurrencyPlan {
    if (this.looseCurrencyPlan) {
      return this.looseCurrencyPlan;
    }

    const sector = this.getCurrentSector();
    const features = this.getCurrentFeatures();
    const environmentObjects = this.getEnvironmentObjectPlan();

    this.looseCurrencyPlan = createLooseCurrencyPlan({
      seed: this.getCombatSeed(),
      sectorId: sector.sectorId,
      sectorIndex: this.sectorIndex,
      scrollLength: this.getCurrentScrollPlan().length,
      hazards: features.hazards,
      landmarks: features.landmarks,
      environmentObjects: environmentObjects.objects,
      routeEventBias: this.getLooseCurrencyRouteBias(),
      actPressure: this.getActPressureModel(),
      actEconomy: createActEconomyProfile(sector)
    });

    return this.looseCurrencyPlan;
  }

  private getLooseCurrencyRouteBias(): 'none' | 'hazard' | 'elite' | 'market' | 'salvage' {
    const objectiveBias = this.missionContext?.projection.objectiveWorld?.looseCurrencyBias;
    if (objectiveBias === 'salvage' || objectiveBias === 'hazard') {
      return objectiveBias;
    }

    if (this.sectorConditions.modifiers.some((modifier) => modifier.source === 'shop')) {
      return 'market';
    }

    if (
      this.sectorConditions.modifiers.some(
        (modifier) => modifier.source === 'vault' || modifier.source === 'repair'
      )
    ) {
      return 'salvage';
    }

    if (this.hasEnemyVariantElitePressure()) {
      return 'elite';
    }

    if (
      this.sectorConditions.modifiers.some(
        (modifier) => modifier.hazardDensityDelta > 0 || modifier.source === 'glitch'
      )
    ) {
      return 'hazard';
    }

    return 'none';
  }

  private getWavePlan(): WaveDirectorPlan {
    if (this.wavePlan) {
      return this.wavePlan;
    }

    const sector = this.getCurrentSector();

    if (!sector) {
      throw new Error(`No sector exists at index ${this.sectorIndex}.`);
    }

    const sectorPacing = this.getSectorPacingPlan();
    const encounterPacing = applySectorPacingToEncounterPacing(
      sector.encounterPacing,
      sectorPacing
    );

    const apexFinale = this.apexEncounter?.stage === 'finale' && this.apexProfile;
    this.wavePlan = createWaveDirectorPlan({
      seed: this.getCombatSeed(),
      objective: apexFinale
        ? {
            ...sector.objective,
            kind: 'defeatBoss',
            label: `Neutralize ${this.apexProfile!.bossName}`,
            bossRequired: true,
            bossSpawnAtSeconds: Math.min(14, 4 + sector.objective.requiredWaves * 1.35)
          }
        : sector.objective,
      majorWaves: sector.majorWaves,
      preferredFactionId: sector.bossFactionId,
      availableFactionIds: this.run.availableFactionIds,
      scroll: this.getCurrentScrollPlan(),
      pacing: encounterPacing,
      sectorIndex: this.sectorIndex,
      routePressure:
        this.hasEnemyVariantRoutePressure() ||
        sectorPacing.arcKind !== 'standard' ||
        getActPressureRoutePressure(this.getActPressureModel()),
      challenge: this.hasEnemyVariantChallengePressure(),
      eliteEncounter: this.hasEnemyVariantElitePressure(),
      formationClusterWaves: sectorPacing.formationClusterWaveIndexes,
      actPressure: this.getActPressureModel(),
      missionObjective: apexFinale ? null : this.missionContext?.projection.missionObjective
    });

    return this.wavePlan;
  }

  private getScrollState(): ScrollState {
    this.scrollState ??= createScrollState(
      applySectorCooldownToScroll(this.getCurrentScrollPlan(), this.getSectorCooldownPlan())
    );
    return this.scrollState;
  }

  private getSectorCooldownPlan(): SectorCooldownPlan {
    this.sectorCooldownPlan ??= createSectorCooldownPlan({
      scroll: this.getCurrentScrollPlan(),
      sectorIndex: this.sectorIndex,
      sectorCount: this.run.sectors.length,
      operationMode: this.missionContext?.projection.operationMode ?? 'flight'
    });
    return this.sectorCooldownPlan;
  }

  private getSectorHazardRuntimeState(): SectorHazardRuntimeState {
    this.sectorHazardRuntimeState ??= createSectorHazardRuntimeState(
      this.scrollState?.distance ?? 0
    );
    return this.sectorHazardRuntimeState;
  }

  private getBossArenaState(): BossArenaState {
    this.bossArenaState ??= createBossArenaState(this.getCurrentArenaPlan());
    return this.bossArenaState;
  }

  private getCurrentScrollPlan(): SectorScrollPlan {
    this.conditionedScroll ??= applySectorPacingToScroll(
      this.getRouteConditionedScrollPlan(),
      this.getSectorPacingPlan()
    );
    return this.conditionedScroll;
  }

  private getCurrentFeatures(): SectorFeaturePlan {
    if (!this.conditionedFeatures) {
      const routeConditionedFeatures = applySectorConditionsToFeatures(
        this.getCurrentSector().features,
        this.getCurrentSector().scroll,
        this.getRouteConditionedScrollPlan(),
        this.sectorConditions
      );

      const pacedFeatures = applySectorPacingToFeatures(
        routeConditionedFeatures,
        this.getCurrentScrollPlan(),
        this.getSectorPacingPlan()
      );
      const hazardZoneDirector = createHazardZoneDirectorPlan({
        runSeed: this.run.seed,
        saveStateKey: this.run.unlockedIds.join('|'),
        sequenceKey:
          this.missionContext?.projection.stageId ?? `legacy-sector-${this.sectorIndex + 1}`,
        sequenceOrdinal: getHazardSequenceOrdinal(
          this.sectorIndex,
          this.missionContext?.projection.operationalRole ?? null
        ),
        features: pacedFeatures,
        scroll: this.getCurrentScrollPlan(),
        conditions: this.sectorConditions,
        pacing: this.getSectorPacingPlan(),
        bossArena: this.getCurrentArenaPlan(),
        backgroundId: this.getCurrentSector().background.id,
        actPressure: this.getActPressureModel()
      });

      this.hazardZoneDirectorPlan = hazardZoneDirector;
      this.conditionedFeatures = applyHazardZoneDirectorToFeatures(
        pacedFeatures,
        hazardZoneDirector
      );
    }

    return this.conditionedFeatures;
  }

  private getHazardZoneDirectorPlan(): HazardZoneDirectorPlan {
    if (!this.hazardZoneDirectorPlan) {
      this.getCurrentFeatures();
    }

    if (!this.hazardZoneDirectorPlan) {
      throw new Error('Hazard-zone director plan was not initialized.');
    }

    return this.hazardZoneDirectorPlan;
  }

  private getCurrentArenaPlan(): BossArenaPlan | null {
    if (this.conditionedArena === undefined) {
      const routeConditionedScroll = this.getRouteConditionedScrollPlan();
      const routeConditionedArena = applySectorConditionsToBossArena(
        this.getCurrentSector().arena,
        this.getCurrentSector().scroll,
        routeConditionedScroll,
        this.sectorConditions
      );

      const pacedArena = applySectorPacingToBossArena(
        routeConditionedArena,
        routeConditionedScroll,
        this.getCurrentScrollPlan(),
        this.getSectorPacingPlan()
      );
      this.conditionedArena = applySecondActFinaleToBossArena(
        pacedArena,
        this.getCurrentSector().finale
      );
    }

    return this.conditionedArena;
  }

  private getRouteConditionedScrollPlan(): SectorScrollPlan {
    this.routeConditionedScroll ??= applySectorConditionsToScroll(
      this.getCurrentSector().scroll,
      this.sectorConditions
    );
    return this.routeConditionedScroll;
  }

  private getSectorPacingPlan(): SectorPacingPlan {
    this.sectorPacingPlan ??= createSectorPacingPlan({
      runSeed: this.run.seed,
      sector: this.getCurrentSector(),
      sectorIndex: this.sectorIndex,
      conditions: this.sectorConditions,
      scroll: this.getRouteConditionedScrollPlan()
    });
    return this.sectorPacingPlan;
  }

  private getActPressureModel(): ActPressureModel {
    this.actPressureModel ??= createActPressureModel({
      sector: this.getCurrentSector(),
      pacing: this.getSectorPacingPlan()
    });
    return this.actPressureModel;
  }

  private updateBossArena(distance: number, state: CombatState): BossArenaUpdate {
    const supportProgress = getObjectiveProgress(this.getWavePlan(), {
      ...state,
      scrollDistance: distance
    });
    this.bossArenaUpdate = updateBossArenaState(this.getBossArenaState(), {
      distance,
      supportComplete:
        supportProgress.supportComplete && isSetPieceBossLockReleased(state.setPiece),
      bossActive: state.boss !== null,
      bossAlreadySpawned: state.bossSpawned,
      bossDefeated: state.stats.bossesDefeated > 0
    });

    return this.bossArenaUpdate;
  }

  private getCurrentSectorName(): string {
    return this.getCurrentSector().sectorName;
  }

  private getCurrentSector(): RunSkeleton['sectors'][number] {
    const sector = this.missionContext?.projection.sector ?? this.run.sectors[this.sectorIndex];

    if (!sector) {
      throw new Error(`No sector exists at index ${this.sectorIndex}.`);
    }

    return sector;
  }

  private syncReadouts(): void {
    const state = this.getCombatState();
    this.syncArenaHudLayout();
    if (this.apexContactBanner) {
      this.apexContactBanner.hidden = !this.apexEncounter || state.timeSeconds > 6;
    }
    const cooldownPresentation = this.sectorCooldown
      ? getSectorCooldownPresentation(this.sectorCooldown, this.getScrollState().distance)
      : null;
    const settlingHazard = cooldownPresentation ? this.getActiveHazards()[0] : null;
    const exitPresentation = this.exitSequence
      ? getSectorExitPresentation(this.exitSequence)
      : null;
    const destructionPresentation = this.destructionSequence
      ? getPlayerDestructionPresentation(this.destructionSequence)
      : null;

    this.positionReadout.textContent = `Player ${Math.round(state.player.x)},${Math.round(
      state.player.y
    )}`;
    this.hullReadout.textContent = `Hull ${state.player.hull}/${state.player.maxHull}`;
    this.distanceReadout.textContent = [
      this.missionContext?.projection.boardingOperation
        ? formatBoardingDistanceReadout(
            this.missionContext.projection.boardingOperation,
            this.getScrollState().distance,
            state.timeSeconds
          )
        : formatScrollReadout(this.getScrollState()),
      formatBossArenaReadout(this.bossArenaUpdate.phase)
    ]
      .filter((part): part is string => Boolean(part))
      .join(' | ');
    this.economyReadout.textContent = `Credits ${this.startingCredits + state.player.credits} | Salvage ${this.startingSalvage + state.player.salvage}`;
    const setPiece = getSetPieceReadModel(state.setPiece);
    const apexContact = this.apexEncounterPresentation;
    this.objectiveReadout.textContent = [
      getObjectiveProgress(this.getWavePlan(), state).readout,
      apexContact ? `APEX HUNT · ${apexContact.stageLabel}: ${apexContact.label}` : null,
      setPiece
        ? `${setPiece.stageLabel} | target ${setPiece.targetLabel} | ${setPiece.destroyedComponents}/${setPiece.totalComponents}`
        : null
    ]
      .filter((part): part is string => Boolean(part))
      .join(' | ');
    this.verbReadout.textContent = this.getVerbReadout(state);
    this.weaponReadout.textContent = this.getWeaponReadout(state);
    this.weaponReadout.dataset.hasteActive = String(
      createHasteReservoirReadModel(state.items, state.player.hasteSeconds).active
    );
    this.syncMeters(state);
    this.combatReadout.textContent = `Destroyed ${state.stats.enemiesDestroyed} | Rivals ${state.stats.rivalsDestroyed}D/${state.stats.rivalsEscaped}E | Shots ${state.stats.shotsFired} | Hooks ${state.stats.itemTriggers}`;
    this.commandReadout.textContent = this.getWingReadout(state);
    this.bossReadout.textContent = state.boss
      ? `${formatSecondActFinaleBossName(
          this.getCurrentSector().finale,
          state.boss.name
        )} ${Math.max(0, state.boss.hull)}/${state.boss.maxHull} | ${state.boss.phaseLabel}`
      : `Boss ${this.getCurrentBossName()}`;
    this.bossReadout.hidden = state.boss === null;
    this.warningReadout.textContent =
      state.telegraphs[0]?.label ??
      (state.rivalEncounter?.outcome === 'engaged'
        ? `RIVAL ${state.rivalEncounter.name} | ${state.rivalEncounter.title} | ${state.rivalEncounter.tactic}`
        : null) ??
      formatActiveHazardWarning(this.getActiveHazards()[0]) ??
      (apexContact ? `APEX CONTACT · ${apexContact.directive}` : null) ??
      (setPiece && setPiece.active
        ? `${setPiece.layoutLabel}; ${setPiece.stageLabel}; safe ${setPiece.safeLaneLabel}`
        : null) ??
      formatBossArenaReadout(this.bossArenaUpdate.phase) ??
      'Warning clear';
    this.itemReadout.textContent = this.getBuildReadout(state);
    this.hintReadout.textContent = this.getOnboardingHint(state);

    if (cooldownPresentation) {
      this.objectiveReadout.textContent = cooldownPresentation.readout;
      this.warningReadout.textContent = settlingHazard
        ? `${settlingHazard.hazard.label} settling | no new hazards`
        : cooldownPresentation.warning;
      this.hintReadout.textContent = settlingHazard
        ? `Hint ${settlingHazard.hazard.label} is clearing; collect remaining drops en route.`
        : cooldownPresentation.hint;
    }

    if (exitPresentation) {
      this.objectiveReadout.textContent = exitPresentation.title;
      this.warningReadout.textContent = exitPresentation.announcement;
      this.hintReadout.textContent =
        this.exitSequence?.reason === 'victory'
          ? formatSecondActFinaleOutcome(this.getCurrentSector().finale, 'victory')
          : exitPresentation.hint;
    }

    if (destructionPresentation) {
      this.objectiveReadout.textContent = `Ship breakup | ${Math.round(
        destructionPresentation.progress * 100
      )}%`;
      this.warningReadout.textContent = destructionPresentation.transponderText;
      this.hintReadout.textContent =
        this.getCurrentSector().finale !== null
          ? formatSecondActFinaleOutcome(this.getCurrentSector().finale, 'destroyed')
          : 'Hint Controls offline; rescue transponder broadcasting.';
    }

    this.warningReadout.hidden = this.warningReadout.textContent === 'Warning clear';
    this.hintReadout.hidden =
      cooldownPresentation === null &&
      exitPresentation === null &&
      destructionPresentation === null &&
      state.boss === null &&
      this.bossArenaUpdate.phase === 'none' &&
      this.getActiveHazards().length === 0;
  }

  private getCombatSeed(): string {
    const sector = this.run.sectors[this.sectorIndex];
    const suffix = this.missionContext?.projection.combatSeedSuffix;
    return `${this.run.seed}:combat:${sector?.sectorId ?? this.sectorIndex + 1}${
      suffix ? `:${suffix}` : ''
    }`;
  }

  private withWorldOffset(result: CombatRunResult): CombatRunResult {
    const plan = this.missionContext?.projection.missionObjective;
    const progress = plan ? getObjectiveProgress(this.getWavePlan(), this.getCombatState()) : null;
    const missionProgress = progress?.missionObjective;
    const boardingDeadline = this.missionContext?.projection.boardingOperation?.extractionSeconds;
    const timedOut =
      boardingDeadline !== null &&
      boardingDeadline !== undefined &&
      this.getCombatState().timeSeconds > boardingDeadline;
    const outcomeOverride =
      timedOut && missionProgress && plan
        ? missionProgress.completionRatio >= plan.partialSuccessThreshold
          ? 'partialSuccess'
          : 'failure'
        : missionProgress?.outcome === 'active' && result.reason === 'sectorComplete'
          ? 'success'
          : undefined;
    return {
      ...result,
      worldOffset: this.getScrollState().worldOffset,
      missionObjective:
        plan && missionProgress && this.missionContext
          ? createMissionObjectiveResultSnapshot(
              plan,
              missionProgress,
              this.missionContext.projection.stageId,
              outcomeOverride
            )
          : result.missionObjective
    };
  }

  private getCurrentBossName(): string {
    if (this.apexEncounter?.stage === 'finale' && this.apexProfile) {
      return this.apexProfile.bossName;
    }
    const sector = this.run.sectors[this.sectorIndex];
    return sector ? formatSecondActFinaleBossName(sector.finale, sector.bossName) : 'unassigned';
  }

  private getCombatBossId(): BossId {
    return this.apexEncounter?.stage === 'finale' && this.apexProfile
      ? this.apexProfile.bossId
      : this.getCurrentSector().bossId;
  }

  private getVerbReadout(state: CombatState): string {
    const specialPercent = Math.round(
      (state.player.specialCharge / state.player.maxSpecialCharge) * 100
    );
    const specialStatus =
      state.player.specialActiveSeconds > 0
        ? `active ${state.player.specialActiveSeconds.toFixed(1)}s`
        : state.player.specialCooldown > 0
          ? `cooldown ${state.player.specialCooldown.toFixed(1)}s`
          : `${specialPercent}%`;

    return `Special ${specialStatus} | Bombs ${state.player.bombs}/${state.player.maxBombs} | Graze ${state.stats.grazes}`;
  }

  private getWeaponReadout(state: CombatState): string {
    const heatPercent = Math.round((state.player.weaponHeat / state.weapon.overheatLimit) * 100);
    const heatStatus =
      state.player.weaponOverheatSeconds > 0
        ? `OVERHEAT ${state.player.weaponOverheatSeconds.toFixed(1)}s`
        : `Heat ${heatPercent}%`;
    const haste = createHasteReservoirReadModel(state.items, state.player.hasteSeconds);
    const hasteStatus =
      haste.sourceCount > 0
        ? ` | ${haste.active ? 'HASTE' : 'Haste'} ${haste.chargeSeconds.toFixed(1)}/${haste.capacitySeconds.toFixed(1)}s${haste.pauseDrainWhileNotFiring ? ' COAST' : ''}`
        : '';

    return `${state.weapon.name}${
      this.missionContext?.projection.operationMode === 'boarding' ? ' / BREACH CUTTER' : ''
    } | ${state.weapon.pattern} | ${heatStatus}${hasteStatus}`;
  }

  private syncMeters(state: CombatState): void {
    syncHudMeter(
      this.hullMeter,
      createHudMeterModel(state.player.hull, state.player.maxHull),
      state.player.hull <= 1 ? 'danger' : 'steady'
    );
    syncHudMeter(
      this.specialMeter,
      createHudMeterModel(state.player.specialCharge, state.player.maxSpecialCharge),
      state.player.specialCharge >= state.player.maxSpecialCharge ? 'ready' : 'charging'
    );
    syncHudMeter(
      this.bombMeter,
      createHudMeterModel(state.player.bombs, state.player.maxBombs),
      state.player.bombs > 0 ? 'ready' : 'empty'
    );
    syncHudMeter(
      this.heatMeter,
      createHudMeterModel(state.player.weaponHeat, state.weapon.overheatLimit),
      state.player.weaponOverheatSeconds > 0 ||
        state.player.weaponHeat >= state.weapon.overheatLimit
        ? 'danger'
        : 'steady'
    );
  }

  private getBuildReadout(state: CombatState): string {
    return formatBuildSynergyHud(createBuildSynergyModel(state.items));
  }

  private getWingReadout(state: CombatState): string {
    const activeAllies = state.allies.filter((ally) => ally.status === 'active');
    const injuredAllies = state.allies.filter((ally) => ally.status === 'injured');
    const activeCrew = activeAllies.filter((ally) => ally.source === 'crew').length;
    const activeFleet = activeAllies.filter((ally) => ally.source === 'fleet').length;

    return state.allies.length > 0
      ? `Automatic support | ${activeCrew} crew / ${activeFleet} craft active | ${injuredAllies.length} disabled | ${state.stats.allyEnemiesDestroyed} defeats | ${state.stats.allySalvageCollected} salvage recovered`
      : 'No deployed wing support.';
  }

  private getOnboardingHint(state: CombatState): string {
    if (state.boss) {
      const finale = this.getCurrentSector().finale;
      if (finale) {
        return `Hint ${finale.label}; ${finale.summary}`;
      }

      return `Hint Boss phase ${state.boss.phaseLabel}; watch warnings before crossing lanes.`;
    }

    if (this.bossArenaUpdate.phase === 'approach') {
      return 'Hint Boss approach; the sector is narrowing into an arena.';
    }

    if (this.bossArenaUpdate.phase === 'locked') {
      return 'Hint Arena locked; clear remaining targets to draw the boss.';
    }

    if (this.bossArenaUpdate.phase === 'released') {
      return 'Hint Arena released; push to the sector exit.';
    }

    const activeHazard = this.getActiveHazards().find(isHazardPresentationVisible);

    if (activeHazard) {
      if (activeHazard.hazard.kind === 'salvage_storm') {
        const warning = formatMeteorStormWarning(activeHazard);
        return `Hint ${warning}. Move between the small marked circles; the storm pocket itself is safe.`;
      }
      if (activeHazard.hazard.kind === 'salvage_squall') {
        const warning = formatSalvageStormWarning(activeHazard);
        return activeHazard.phase === 'telegraph'
          ? `Hint ${warning}. Follow the calm-channel sequence before the first surge.`
          : `Hint ${warning}. Charged lanes damage every craft; hold the calm channel or clear the storm edge.`;
      }
      const beamTrack =
        activeHazard.hazard.kind === 'warning_beam'
          ? ` ${formatBeamHazardTrack(activeHazard.hazard.beam)}.`
          : '';
      return activeHazard.phase === 'telegraph'
        ? `Hint ${activeHazard.hazard.label} ahead.${beamTrack} Shift clear before it activates.`
        : `Hint ${activeHazard.hazard.label} active.${beamTrack} Dodge the advancing luminous bolt.`;
    }

    if (state.stats.shotsFired === 0) {
      return 'Hint Fire to engage; pause opens the full sector dossier.';
    }

    if (state.player.specialCharge >= state.player.maxSpecialCharge) {
      return 'Hint Special ready; spend charge for a short burst window.';
    }

    if (state.player.bombs > 0 && state.projectiles.length >= 24) {
      return 'Hint Bomb ready; use it when bullets crowd the salvage lane.';
    }

    if (state.pickups.length > 0) {
      const looseCredits = state.pickups
        .filter((pickup) => pickup.kind === 'credit')
        .reduce((total, pickup) => total + pickup.value, 0);
      const looseSalvage = state.pickups
        .filter((pickup) => pickup.kind === 'salvage')
        .reduce((total, pickup) => total + pickup.value, 0);

      return `Hint Salvage lane active: pull ${looseCredits} credits / ${looseSalvage} salvage before it drifts clear.`;
    }

    return `Hint ${getObjectiveProgress(this.getWavePlan(), state).readout}`;
  }

  private getEnemyHullBonus(): number {
    return this.combatModifiers.reduce((total, modifier) => total + modifier.enemyHullBonus, 0);
  }

  private getEnemyFireDelayMultiplier(): number {
    const routeMultiplier = this.combatModifiers.reduce(
      (multiplier, modifier) => multiplier * modifier.enemyFireDelayMultiplier,
      1
    );
    const apexPressureMultiplier = Math.max(
      0.88,
      1 - (this.apexProfile?.hazardPressure ?? 0) * 0.06
    );
    return routeMultiplier * apexPressureMultiplier;
  }

  private getBossHullBonus(): number {
    return (
      this.combatModifiers.reduce((total, modifier) => total + modifier.bossHullBonus, 0) +
      (this.getCurrentSector().finale?.bossHullBonus ?? 0) +
      (this.apexEncounter?.stage === 'finale' ? (this.apexProfile?.bossHullDelta ?? 0) : 0)
    );
  }

  private hasEnemyVariantRoutePressure(): boolean {
    return (
      this.getEnemyHullBonus() > 0 ||
      this.getEnemyFireDelayMultiplier() < 0.99 ||
      this.sectorConditions.modifiers.some(
        (modifier) =>
          modifier.hazardDensityDelta > 0 ||
          modifier.scrollSpeedMultiplier > 1 ||
          modifier.source === 'glitch' ||
          modifier.source === 'factionAmbush'
      )
    );
  }

  private hasEnemyVariantChallengePressure(): boolean {
    return this.sectorConditions.modifiers.some(
      (modifier) => modifier.source === 'challenge_debt_ceiling'
    );
  }

  private hasEnemyVariantElitePressure(): boolean {
    return this.sectorConditions.modifiers.some(
      (modifier) => modifier.source === 'elite' || modifier.source === 'factionAmbush'
    );
  }

  private emitFeedback(cues: readonly CombatFeedbackCue[]): void {
    if (cues.length > 0) {
      this.onFeedback(cues);
    }
  }

  private getEffectiveMovementAxis(state: CombatState): Vector2 {
    return preferKeyboardMovement(
      this.input.getMovementAxis(),
      getPointerGuidanceAxis(state.player, this.input.getPointerControlState())
    );
  }

  private getCombatBounds(): CombatBounds {
    const bounds = createDefaultCombatBounds();
    return this.missionContext?.projection.operationMode === 'boarding'
      ? { ...bounds, padding: 60, enemyProjectileBoundary: 'sideWalls' as const }
      : bounds;
  }

  private getViewportLayout(): ViewportLayout {
    const ownerWindow = this.uiRoot.ownerDocument.defaultView ?? window;
    const width = ownerWindow.innerWidth;
    const height = ownerWindow.innerHeight;
    const dpr = ownerWindow.devicePixelRatio || 1;
    const layoutKey = `${width}x${height}@${dpr}`;

    if (!this.viewportLayout || this.viewportLayoutKey !== layoutKey) {
      this.viewportLayout = calculateViewportLayout({ width, height, dpr });
      this.viewportLayoutKey = layoutKey;
    }

    return this.viewportLayout;
  }

  private syncArenaHudLayout(): void {
    if (!this.arenaHudRoot) {
      return;
    }

    const layout = this.getViewportLayout();
    const frame = layout.gameplaySafeFrame;
    const layoutKey = `${layout.viewportClass}:${frame.x},${frame.y},${frame.width},${frame.height}`;

    if (this.arenaHudLayoutKey === layoutKey) {
      return;
    }

    const model = createArenaHudFrameModel(layout, this.contract.shipAppearance.hudThemeKey);
    this.arenaHudRoot.dataset.viewportClass = model.viewportClass;
    this.arenaHudRoot.dataset.railMode = model.railMode;
    for (const [property, value] of Object.entries(model.cssVariables)) {
      this.arenaHudRoot.style.setProperty(property, value);
    }
    this.arenaHudLayoutKey = layoutKey;
  }

  private getActiveHazards(
    distance = this.getScrollState().distance
  ): readonly ActiveSectorHazard[] {
    if (this.bossArenaUpdate.phase === 'locked') {
      return [];
    }

    return getActiveSectorHazards(
      this.getCurrentFeatures(),
      distance,
      this.getSectorHazardActivationOptions()
    );
  }

  private getSectorHazardActivationOptions(includeRuntime = true): SectorHazardActivationOptions {
    return {
      allowedHazardIds: this.sectorCooldown?.settlingHazardIds,
      distanceOverrides: includeRuntime
        ? this.sectorHazardRuntimeState?.effectiveDistances
        : undefined,
      beamLaunchWorldDistanceOverrides: includeRuntime
        ? this.sectorHazardRuntimeState?.beamLaunchWorldDistances
        : undefined,
      elapsedSecondsOverrides: includeRuntime
        ? this.sectorHazardRuntimeState?.beamElapsedSeconds
        : undefined
    };
  }
}

function formatActiveHazardWarning(activeHazard: ActiveSectorHazard | undefined): string | null {
  if (!activeHazard) {
    return null;
  }

  if (activeHazard.hazard.kind === 'salvage_storm') {
    return activeHazard.phase === 'active' ? formatMeteorStormWarning(activeHazard) : null;
  }

  if (activeHazard.hazard.kind === 'salvage_squall') {
    return formatSalvageStormWarning(activeHazard);
  }

  if (activeHazard.hazard.kind !== 'warning_beam') {
    return activeHazard.hazard.label;
  }

  const phase =
    activeHazard.phase === 'active'
      ? `BOLT ${Math.round(activeHazard.phaseProgress * 100)}%`
      : 'TRACKING';
  return `${activeHazard.hazard.label} ${phase} | ${formatBeamHazardTrack(activeHazard.hazard.beam)}`;
}

function isHazardPresentationVisible(activeHazard: ActiveSectorHazard): boolean {
  return !(
    activeHazard.hazard.kind === 'salvage_storm' && activeHazard.phase === 'telegraph'
  );
}

function getDebugLongScrollDistance(sectorLength: number): number {
  const length = Math.max(0, sectorLength);
  const lateDistance = length * DEBUG_LONG_SCROLL_RATIO;
  const exitLeadDistance = Math.max(0, length - DEBUG_LONG_SCROLL_EXIT_LEAD);

  return Math.min(lateDistance, exitLeadDistance);
}

function clearExitPressure(state: CombatState): void {
  state.enemies = [];
  state.projectiles = [];
  state.telegraphs = [];
  state.boss = null;
  state.nextSpawnIndex = state.spawnSchedule.length;
}

function formatBoardingDistanceReadout(
  operation: BoardingOperationPlan,
  distance: number,
  elapsedSeconds: number
): string {
  const current =
    operation.rooms.find((room) => distance >= room.startDistance && distance < room.endDistance) ??
    operation.rooms.find((room) => distance < room.startDistance) ??
    operation.rooms.at(-1);
  const roomNumber = current ? current.index + 1 : operation.rooms.length;
  const timer = operation.extractionSeconds
    ? ` | purge ${Math.max(0, operation.extractionSeconds - elapsedSeconds).toFixed(0)}s`
    : '';
  return `Interior ${roomNumber}/${operation.rooms.length} ${current?.label ?? 'Extraction'} | ${Math.round(distance)}/${operation.scrollLength}m${timer}`;
}

function createHudMeterElement(
  ownerDocument: Document,
  label: string,
  shortLabel: string,
  testId: string
): HudMeterElements {
  const root = ownerDocument.createElement('div');
  root.className = 'hud-meter';
  root.dataset.testid = testId;
  root.setAttribute('role', 'meter');
  root.setAttribute('aria-label', label);
  root.setAttribute('aria-valuemin', '0');
  root.setAttribute('aria-valuemax', '100');
  root.setAttribute('aria-valuenow', '0');

  const caption = ownerDocument.createElement('span');
  caption.className = 'hud-meter-caption';
  caption.textContent = shortLabel;

  const value = ownerDocument.createElement('span');
  value.className = 'hud-meter-value';
  value.textContent = '0%';

  const track = ownerDocument.createElement('span');
  track.className = 'hud-meter-track';

  const fill = ownerDocument.createElement('span');
  fill.className = 'hud-meter-fill';
  fill.style.width = '0%';

  track.append(fill);
  root.append(caption, value, track);

  return { root, fill, value };
}

function syncHudMeter(
  elements: HudMeterElements,
  meter: ReturnType<typeof createHudMeterModel>,
  state: string
): void {
  elements.root.dataset.state = state;
  elements.root.setAttribute('aria-valuenow', String(meter.percent));
  elements.fill.style.width = meter.width;
  elements.value.textContent = meter.width;
}

function getHudThemeOptions(ownerDocument: Document): HudThemeOptions {
  const { dataset } = ownerDocument.documentElement;

  return {
    reducedMotion: dataset.reducedMotion === 'true',
    bulletContrast: dataset.bulletContrast === 'high' ? 'high' : 'standard',
    performanceMode: dataset.performanceMode === 'true'
  };
}
