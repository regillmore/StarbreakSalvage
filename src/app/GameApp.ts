import { CanvasRenderer } from './CanvasRenderer';
import { Loop, type FrameStats } from './Loop';
import type { SceneDebugState } from './Scene';
import { SceneManager } from './SceneManager';
import type { CombatRunResult } from '../game/CombatState';
import {
  applyRunRecordToSave,
  exportSaveData,
  getSaveSummary,
  importSaveData,
  loadSaveData,
  purchaseUpgrade,
  resetSaveData,
  writeSaveData,
  type RunSaveRecord,
  type SaveData,
  type SaveUpdateResult,
  type UpgradePurchaseResult
} from '../core/saveData';
import {
  createDefaultSettings,
  loadSettingsData,
  settingsToKeyBindingMap,
  writeSettingsData,
  type GameSettings
} from '../core/settingsData';
import {
  createRunGenerationSaveFingerprint,
  generateRunSkeleton,
  type RouteOption,
  type RunSkeleton,
  type StartingContract
} from '../game/Generation';
import {
  acquireComponent,
  createEngineeringCombatProfile,
  generateComponentSalvage,
  resolveEngineeringSnapshot
} from '../game/Foundry';
import {
  createRunActSaveContext,
  getInterActTransitionHandoff,
  type RunActPlan
} from '../game/ActPlan';
import { createActEconomyProfile } from '../game/ActEconomy';
import {
  createActTwoDebugScenario,
  createDebugRouteHistoryThroughSector,
  createTwoActDebugSummaryResult
} from '../game/ActTwoDebug';
import { createInterActJunctionChoices } from '../game/InterActJunction';
import { resolveSeedEntry } from '../game/SeedEntry';
import {
  addCredits,
  addItemToSession,
  aggregateCombatRunResults,
  advanceSector,
  applyInterActChoice,
  applyRouteOutcome,
  createRunSession,
  dispatchMissionEvent,
  getCombatModifiersForSector,
  getCurrentSector,
  getEffectiveShipStats,
  getRouteCreditReward,
  hasInterActChoiceForSourceAct,
  incrementShopRerollCount,
  recordSectorCombatResult,
  recordMissionObjectiveOutcome,
  recordMissionOperationBoundary,
  recordFactionCampaignEvent,
  recordCrewRosterEvent,
  recordRunSessionTimelineEvent,
  recordExpeditionBranchDecision,
  resetMissionForCurrentSector,
  spendCredits,
  type RunSessionState
} from '../game/RunSession';
import { getSaveRecordSectorCount } from '../game/RunOutcome';
import { createExpeditionDebugState, createExpeditionPathReadModel } from '../game/ExpeditionGraph';
import {
  createMissionCombatProjection,
  createMissionDebugState,
  createMissionReadModel,
  createMissionSchedule,
  formatMissionTimeline,
  getMissionBranchOptions,
  getMissionStage,
  type MissionEvent,
  type MissionTransitionResult
} from '../game/MissionDirector';
import { formatMissionObjectiveHistory } from '../game/ObjectiveDirector';
import { generateRouteOutcome, type AppliedRouteOutcome } from '../game/RouteEvents';
import { createSectorConditionPlan } from '../game/SectorConditions';
import { getSecondActFinaleSectorIndex } from '../game/SecondActFinale';
import { getShopRerollCost } from '../game/Shops';
import { AudioSystem } from '../systems/AudioSystem';
import { getFeedbackShakeIntensity, type CombatFeedbackCue } from '../systems/CombatFeedback';
import { InputSystem, type InputAction } from '../systems/InputSystem';
import { ContractSelectScene } from '../ui/ContractSelectScene';
import { GameplayScene } from '../ui/GameplayScene';
import { InterActJunctionScene } from '../ui/InterActJunctionScene';
import { MainMenuScene } from '../ui/MainMenuScene';
import { OperationalMapScene } from '../ui/OperationalMapScene';
import { PauseScene } from '../ui/PauseScene';
import { RewardScene } from '../ui/RewardScene';
import { RouteEventScene } from '../ui/RouteEventScene';
import { RouteScene } from '../ui/RouteScene';
import { RunSummaryScene } from '../ui/RunSummaryScene';
import { SettingsScene } from '../ui/SettingsScene';
import { SectorTransitionScene } from '../ui/SectorTransitionScene';
import { ShopScene } from '../ui/ShopScene';
import { UnlockArchiveScene } from '../ui/UnlockArchiveScene';
import type { ItemId } from '../content/items';
import type { UpgradeId } from '../content/upgrades';
import { UpgradeBayScene } from '../ui/UpgradeBayScene';
import { FoundryScene } from '../ui/FoundryScene';
import {
  createDebugFactionCampaignState,
  createFactionCampaignCombatModifier,
  getCapturableRivalForSector,
  getEngagedRivalForSector,
  getFactionCampaignInfluence
} from '../game/FactionCampaign';
import {
  createCrewCombatProfile,
  createDebugCrewRosterState,
  getCrewFoundryAssist,
  getRecruitableCrewCandidate
} from '../game/CrewCommand';
import type { ScenarioLabId } from '../game/ScenarioLab';
import {
  RunSnapshotCoordinator,
  createRunSnapshotSummary,
  type RunSnapshotV2
} from '../game/RunSnapshot';
import { getOperationalInfluence } from '../game/OperationalMap';

export class GameApp {
  private readonly canvas: HTMLCanvasElement;
  private readonly uiRoot: HTMLDivElement;
  private readonly debugOverlay: HTMLDivElement;
  private readonly renderer: CanvasRenderer;
  private readonly audio: AudioSystem;
  private readonly input: InputSystem;
  private readonly sceneManager = new SceneManager();
  private readonly loop: Loop;
  private readonly debugEnabled: boolean;
  private readonly runSnapshotCoordinator: RunSnapshotCoordinator;
  private seedEntryInput: string;
  private currentSeedLabel: string;
  private currentRun: RunSkeleton;
  private settingsData: GameSettings;
  private saveData: SaveData;
  private selectedContract: StartingContract;
  private runSession: RunSessionState;
  private lastRunResult: CombatRunResult | null = null;
  private lastSaveUpdate: SaveUpdateResult | null = null;
  private summarySaved = false;
  private runSnapshot: RunSnapshotV2 | null = null;
  private runSnapshotNotice: string | null = null;
  private snapshotEligible = false;
  private frameStats: FrameStats = {
    fps: 0,
    steps: 0,
    alpha: 0,
    accumulatorSeconds: 0
  };

  public constructor(private readonly root: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.uiRoot = document.createElement('div');
    this.uiRoot.className = 'ui-layer';

    this.debugOverlay = document.createElement('div');
    this.debugOverlay.className = 'debug-overlay';
    this.debugOverlay.setAttribute('aria-live', 'polite');

    this.debugEnabled = isDebugEnabled(window);
    this.settingsData = loadOrRepairSettings(window);
    this.renderer = new CanvasRenderer(this.canvas);
    this.renderer.setSettings(this.settingsData);
    this.audio = new AudioSystem(window);
    this.audio.setSettings(this.settingsData);
    this.input = new InputSystem(window, settingsToKeyBindingMap(this.settingsData));
    const initialSeedInput = getInitialSeed(window) ?? '';
    const initialSeed = resolveSeedEntry(initialSeedInput);
    this.seedEntryInput = initialSeed.source === 'random' ? initialSeed.seed : initialSeedInput;
    this.currentSeedLabel = initialSeed.seed;
    this.saveData = loadOrRepairSave(window);
    this.runSnapshotCoordinator = new RunSnapshotCoordinator(window.localStorage);
    const snapshotLoad = this.runSnapshotCoordinator.load();
    this.runSnapshot = snapshotLoad.snapshot;
    this.runSnapshotNotice = snapshotLoad.repaired
      ? `Suspended expedition was invalid and removed. Permanent progression is safe. ${snapshotLoad.error ?? ''}`.trim()
      : null;
    this.currentRun = this.createRunSkeleton();
    this.selectedContract = getFirstContract(this.currentRun);
    this.runSession = createRunSession(this.currentRun, this.selectedContract, {
      unlockedIds: this.saveData.unlockedIds
    });
    this.loop = new Loop({
      update: (dt) => this.update(dt),
      render: (alpha) => this.render(alpha),
      onFrame: (stats) => {
        this.frameStats = stats;
      }
    });
  }

  public start(): void {
    const children: Node[] = [this.canvas, this.uiRoot];

    if (this.debugEnabled) {
      children.push(this.debugOverlay);
    }

    this.root.replaceChildren(...children);
    this.applyDocumentSettings();
    this.audio.start();
    this.input.start();
    this.showMainMenu();
    this.loop.start();
  }

  public stop(): void {
    this.loop.stop();
    this.input.stop();
    this.audio.stop();
    this.root.replaceChildren();
  }

  private update(dt: number): void {
    this.renderer.updateEffects(dt);

    for (const action of this.input.drainPressedActions()) {
      if (this.handleGlobalDebugAction(action)) {
        continue;
      }

      this.sceneManager.handleAction(action);
    }

    this.sceneManager.update(dt);
  }

  private render(alpha: number): void {
    this.renderer.resizeToDisplay();
    this.sceneManager.render(this.renderer, alpha);
    this.updateDebugOverlay();
  }

  private showMainMenu(): void {
    this.sceneManager.switchTo(
      new MainMenuScene(
        this.uiRoot,
        getSaveSummary(this.saveData),
        this.seedEntryInput,
        (seedInput) => {
          this.startRunFromMenu(seedInput);
        },
        () => {
          this.showUnlockArchive();
        },
        () => {
          this.showUpgradeBay();
        },
        () => {
          this.showSettings(() => this.showMainMenu());
        },
        this.debugEnabled ? () => void this.showScenarioLab() : null,
        this.runSnapshot ? createRunSnapshotSummary(this.runSnapshot) : null,
        this.runSnapshot ? () => this.resumeRunSnapshot() : null,
        this.runSnapshot ? () => this.discardRunSnapshot() : null,
        this.runSnapshotNotice
      )
    );
  }

  private async showScenarioLab(): Promise<void> {
    this.resetDebugRunState();
    const { ScenarioLabScene } = await import('../ui/ScenarioLabScene');
    this.sceneManager.switchTo(
      new ScenarioLabScene(
        this.uiRoot,
        this.currentRun,
        this.selectedContract,
        (id) => void this.launchScenarioLab(id),
        () => this.showMainMenu()
      )
    );
  }

  private async launchScenarioLab(id: ScenarioLabId): Promise<void> {
    const [{ createScenarioLabLaunch }, { ScenarioTimelineScene }] = await Promise.all([
      import('../game/ScenarioLab'),
      import('../ui/ScenarioTimelineScene')
    ]);
    const launch = createScenarioLabLaunch({
      run: this.currentRun,
      contract: this.selectedContract,
      scenarioId: id,
      unlockedIds: this.saveData.unlockedIds
    });
    this.runSession = launch.session;
    this.lastRunResult = null;
    this.lastSaveUpdate = null;
    this.summarySaved = false;

    if (launch.definition.target === 'transition') {
      this.showSectorTransition();
      return;
    }
    if (launch.definition.target === 'timeline') {
      this.sceneManager.switchTo(
        new ScenarioTimelineScene(
          this.uiRoot,
          launch.definition,
          launch.readout,
          launch.session.timeline,
          () => void this.showScenarioLab()
        )
      );
      return;
    }
    if (launch.definition.target === 'foundry') {
      this.sceneManager.switchTo(
        new FoundryScene(
          this.uiRoot,
          this.currentRun,
          this.selectedContract,
          launch.session.engineering,
          launch.session.currentSectorIndex + 1,
          (engineering, salvageGained) => {
            this.runSession.engineering = engineering;
            recordRunSessionTimelineEvent(this.runSession, {
              id: `scenario-lab:${id}:foundry-complete`,
              category: 'engineering',
              kind: 'labCommit',
              sectorIndex: this.runSession.currentSectorIndex,
              value: salvageGained,
              subjectId: engineering.committed.frameId
            });
            void this.showScenarioLab();
          },
          'Scenario Lab fixture; changes remain local to this disposable run.'
        )
      );
      return;
    }

    const gameplayScene = this.createGameplayScene();
    gameplayScene.prepareScenarioLabPreset(launch.definition.gameplayPreset);
    this.sceneManager.switchTo(gameplayScene);
  }

  private showSettings(onBack: () => void): void {
    this.sceneManager.switchTo(
      new SettingsScene(
        this.uiRoot,
        () => this.settingsData,
        (settings) => this.applySettings(settings),
        (settings) => this.toggleFullscreen(settings),
        onBack
      )
    );
  }

  private startRunFromMenu(seedInput: string): void {
    const seed = resolveSeedEntry(seedInput);
    this.seedEntryInput = seed.source === 'random' ? seed.seed : seedInput;
    this.currentSeedLabel = seed.seed;
    this.showContractSelect();
  }

  private showUnlockArchive(): void {
    this.sceneManager.switchTo(
      new UnlockArchiveScene(
        this.uiRoot,
        () => this.saveData,
        () => exportSaveData(this.saveData),
        (serialized) => this.importSave(serialized),
        () => {
          this.saveData = resetSaveData(window.localStorage);
          this.runSnapshotCoordinator.clear();
          this.runSnapshot = null;
          this.snapshotEligible = false;
          this.runSnapshotNotice = 'Permanent progression and suspended expedition reset.';
          this.refreshRunForCurrentSave();
        },
        () => {
          this.showUpgradeBay(() => this.showUnlockArchive());
        },
        () => {
          this.showMainMenu();
        }
      )
    );
  }

  private showUpgradeBay(onBack: () => void = () => this.showMainMenu()): void {
    this.sceneManager.switchTo(
      new UpgradeBayScene(
        this.uiRoot,
        () => this.saveData,
        (upgradeId) => this.buyPersistentUpgrade(upgradeId),
        onBack
      )
    );
  }

  private showContractSelect(): void {
    this.refreshRunForCurrentSave();
    this.sceneManager.switchTo(
      new ContractSelectScene(
        this.uiRoot,
        this.currentRun,
        (contract) => {
          this.runSnapshotCoordinator.clear();
          this.runSnapshot = null;
          this.runSnapshotNotice = null;
          this.snapshotEligible = true;
          this.selectedContract = contract;
          this.runSession = createRunSession(this.currentRun, contract, {
            unlockedIds: this.saveData.unlockedIds
          });
          this.lastRunResult = null;
          this.lastSaveUpdate = null;
          this.summarySaved = false;
          this.showSectorTransition();
        },
        () => {
          this.showMainMenu();
        }
      )
    );
  }

  private showGameplay(existingScene?: GameplayScene): void {
    const gameplayScene = existingScene ?? this.createGameplayScene();
    this.checkpointRun('gameplay', 'Operation entry checkpoint');
    this.sceneManager.switchTo(gameplayScene);
  }

  private createGameplayScene(): GameplayScene {
    const schedule = this.getCurrentMissionSchedule();
    const missionReadModel = createMissionReadModel(schedule, this.runSession.mission);
    const stage = getMissionStage(schedule, this.runSession.mission.currentStageId);

    if (stage.kind !== 'combat') {
      throw new Error(`Cannot enter gameplay during mission stage ${stage.kind}.`);
    }

    const sector = getCurrentSector(this.currentRun, this.runSession);
    const projection = createMissionCombatProjection(
      schedule,
      this.runSession.mission,
      sector,
      getOperationalInfluence(
        this.runSession.operational,
        this.runSession.currentSectorIndex,
        stage.operationalRole
      )
    );
    let campaignInfluence = getFactionCampaignInfluence(
      this.currentRun.factionCampaign,
      this.runSession.factionCampaign,
      sector
    );
    if (
      !stage.optional &&
      campaignInfluence.rival &&
      campaignInfluence.rival.status !== 'engaged'
    ) {
      recordFactionCampaignEvent(this.runSession, this.currentRun.factionCampaign, {
        id: `${stage.id}:rival-encounter:${campaignInfluence.rival.id}`,
        type: 'rivalEncounter',
        sectorIndex: this.runSession.currentSectorIndex,
        factionId: campaignInfluence.rival.factionId,
        rivalId: campaignInfluence.rival.id
      });
      campaignInfluence = getFactionCampaignInfluence(
        this.currentRun.factionCampaign,
        this.runSession.factionCampaign,
        sector
      );
    }
    const campaignModifier = createFactionCampaignCombatModifier(
      campaignInfluence,
      this.runSession.currentSectorIndex
    );
    const resolvedLoadout =
      resolveEngineeringSnapshot(this.runSession.engineering.committed).loadout ??
      this.selectedContract.loadout;
    const crewProfile = createCrewCombatProfile(
      this.currentRun.crewRoster,
      this.runSession.crewRoster,
      resolvedLoadout
    );

    return new GameplayScene(
      this.uiRoot,
      this.input,
      this.currentRun,
      this.selectedContract,
      getEffectiveShipStats(this.selectedContract, this.runSession),
      this.runSession.engineering,
      [
        ...getCombatModifiersForSector(this.runSession, this.runSession.currentSectorIndex),
        campaignModifier
      ],
      createSectorConditionPlan({
        run: this.currentRun,
        sectorIndex: this.runSession.currentSectorIndex,
        routeOutcomes: this.runSession.routeOutcomes
      }),
      this.runSession.currentSectorIndex,
      this.runSession.expedition,
      this.runSession.itemInstances,
      this.runSession.credits,
      this.runSession.salvage,
      this.debugEnabled,
      (cues) => {
        this.handleCombatFeedback(cues);
      },
      (pausedScene) => {
        this.showPause(pausedScene);
      },
      (result) => {
        this.handleMissionFailure(result);
      },
      (result) => {
        this.handleMissionCombatComplete(result);
      },
      {
        projection,
        readModel: missionReadModel,
        debugState: createMissionDebugState(schedule, this.runSession.mission)
      },
      campaignInfluence,
      this.runSession.factionCampaign,
      crewProfile,
      this.runSession.timeline
    );
  }

  private handleGlobalDebugAction(action: InputAction): boolean {
    if (!this.debugEnabled) {
      return false;
    }

    switch (action) {
      case 'debugActTwoJunction':
        this.showDebugActTwoJunction();
        return true;
      case 'debugActTwoEntry':
        this.showDebugActTwoEntry();
        return true;
      case 'debugFinaleSmoke':
        this.showDebugFinaleSmoke();
        return true;
      case 'debugTwoActSummary':
        this.showDebugTwoActSummary();
        return true;
      case 'debugMissionAnthology':
        this.showDebugMissionAnthology();
        return true;
      case 'debugMissionOptional':
        this.showDebugMissionOptional();
        return true;
      case 'debugRivalCampaign':
        this.showDebugRivalCampaign();
        return true;
      case 'debugCrewWing':
        this.showDebugCrewWing();
        return true;
      case 'debugScenarioLab':
        void this.showScenarioLab();
        return true;
      default:
        return false;
    }
  }

  private resetDebugRunState(): void {
    this.snapshotEligible = false;
    this.refreshRunForCurrentSave();
    this.lastRunResult = null;
    this.lastSaveUpdate = null;
    this.summarySaved = false;
  }

  private showDebugRivalCampaign(): void {
    this.resetDebugRunState();
    this.runSession.factionCampaign = createDebugFactionCampaignState(
      this.currentRun.factionCampaign
    );
    this.runSession.currentSectorIndex = Math.min(2, this.currentRun.sectors.length - 1);
    resetMissionForCurrentSector(this.currentRun, this.runSession);
    this.runSession.credits = Math.max(this.runSession.credits, 30);
    this.runSession.salvage = Math.max(this.runSession.salvage, 6);
    this.showSectorTransition();
  }

  private showDebugCrewWing(): void {
    this.resetDebugRunState();
    this.runSession.crewRoster = createDebugCrewRosterState(this.currentRun.crewRoster);
    this.runSession.currentSectorIndex = Math.min(3, this.currentRun.sectors.length - 1);
    resetMissionForCurrentSector(this.currentRun, this.runSession);
    this.runSession.credits = Math.max(this.runSession.credits, 30);
    this.runSession.salvage = Math.max(this.runSession.salvage, 8);
    this.showSectorTransition();
  }

  private showDebugActTwoJunction(): void {
    this.resetDebugRunState();
    const scenario = createActTwoDebugScenario(this.currentRun);

    if (!scenario) {
      return;
    }

    const sourceAct = this.currentRun.acts.find(
      (act) => act.endSectorIndex === scenario.actOneFinalSectorIndex
    );
    const targetAct = this.currentRun.acts.find(
      (act) => act.startSectorIndex === scenario.actTwoEntrySectorIndex
    );

    if (!sourceAct || !targetAct) {
      return;
    }

    this.runSession.currentSectorIndex = scenario.actTwoEntrySectorIndex;
    resetMissionForCurrentSector(this.currentRun, this.runSession);
    this.runSession.distanceTraveled = scenario.distanceBeforeActTwo;
    this.runSession.credits = Math.max(this.runSession.credits, 32);
    this.runSession.salvage = Math.max(this.runSession.salvage, 8);
    this.showInterActJunction(sourceAct, targetAct);
  }

  private showDebugActTwoEntry(): void {
    this.resetDebugRunState();
    const scenario = createActTwoDebugScenario(this.currentRun);

    if (!scenario) {
      return;
    }

    this.runSession.currentSectorIndex = scenario.actTwoEntrySectorIndex;
    resetMissionForCurrentSector(this.currentRun, this.runSession);
    this.runSession.distanceTraveled = scenario.distanceBeforeActTwo;
    this.runSession.credits = Math.max(this.runSession.credits, 32);
    this.runSession.salvage = Math.max(this.runSession.salvage, 8);
    this.applyDefaultDebugInterActChoice();
    this.prepareDebugMissionCombat();
    this.showGameplay();
  }

  private showDebugTwoActSummary(): void {
    this.resetDebugRunState();
    const scenario = createActTwoDebugScenario(this.currentRun);

    if (!scenario) {
      return;
    }

    this.runSession.currentSectorIndex = scenario.finaleSectorIndex;
    resetMissionForCurrentSector(this.currentRun, this.runSession);
    this.runSession.distanceTraveled = scenario.distanceBeforeFinale;
    this.runSession.credits = Math.max(this.runSession.credits, 72);
    this.runSession.salvage = Math.max(this.runSession.salvage, 18);
    this.runSession.routeHistory = createDebugRouteHistoryThroughSector(
      this.currentRun,
      scenario.finaleSectorIndex
    );
    this.applyDefaultDebugInterActChoice();
    this.showRunSummary(createTwoActDebugSummaryResult(this.currentRun));
  }

  private showDebugFinaleSmoke(): void {
    this.resetDebugRunState();
    const finaleSectorIndex = getSecondActFinaleSectorIndex(this.currentRun);

    if (finaleSectorIndex < 0) {
      return;
    }

    this.runSession.currentSectorIndex = finaleSectorIndex;
    resetMissionForCurrentSector(this.currentRun, this.runSession);
    this.runSession.distanceTraveled = this.currentRun.sectors
      .slice(0, finaleSectorIndex)
      .reduce((total, sector) => total + sector.scroll.length, 0);
    this.runSession.credits = Math.max(this.runSession.credits, 36);
    this.runSession.salvage = Math.max(this.runSession.salvage, 6);
    this.applyDefaultDebugInterActChoice();
    this.prepareDebugGateOperation();

    const gameplayScene = this.createGameplayScene();
    gameplayScene.prepareDebugFinaleSmoke();
    this.sceneManager.switchTo(gameplayScene);
  }

  private showDebugMissionAnthology(): void {
    this.resetDebugRunState();
    this.runSession.currentSectorIndex = Math.min(6, this.currentRun.sectors.length - 1);
    resetMissionForCurrentSector(this.currentRun, this.runSession);
    this.runSession.credits = Math.max(this.runSession.credits, 36);
    this.runSession.salvage = Math.max(this.runSession.salvage, 8);
    this.applyDefaultDebugInterActChoice();
    this.showSectorTransition();
  }

  private showDebugMissionOptional(): void {
    this.resetDebugRunState();
    this.runSession.currentSectorIndex = Math.min(2, this.currentRun.sectors.length - 1);
    resetMissionForCurrentSector(this.currentRun, this.runSession);
    this.prepareDebugMissionCombat();
    const stageId = this.runSession.mission.currentStageId;
    this.dispatchCurrentMission({
      id: `${stageId}:debug-objective-complete`,
      type: 'completeCombat',
      checkpoint: {
        hull: getEffectiveShipStats(this.selectedContract, this.runSession).maxHull,
        scrollDistance: 900,
        worldOffset: 10_900,
        credits: this.runSession.credits,
        salvage: this.runSession.salvage
      }
    });
    const schedule = this.getCurrentMissionSchedule();
    const optional = getMissionBranchOptions(schedule, this.runSession.mission).find(
      (option) => !option.default
    );
    if (!optional || !schedule.branch) {
      return;
    }
    this.dispatchCurrentMission({
      id: `${this.runSession.mission.currentStageId}:debug-optional:${optional.id}`,
      type: 'selectBranch',
      optionId: optional.id
    });
    recordExpeditionBranchDecision(
      this.currentRun,
      this.runSession,
      schedule.branch.id,
      optional.id
    );
    this.showGameplay();
  }

  private applyDefaultDebugInterActChoice(): void {
    const scenario = createActTwoDebugScenario(this.currentRun);

    if (!scenario) {
      return;
    }

    const sourceAct = this.currentRun.acts.find(
      (act) => act.endSectorIndex === scenario.actOneFinalSectorIndex
    );
    const targetAct = this.currentRun.acts.find(
      (act) => act.startSectorIndex === scenario.actTwoEntrySectorIndex
    );

    if (!sourceAct || !targetAct || hasInterActChoiceForSourceAct(this.runSession, sourceAct.id)) {
      return;
    }

    const choice = createInterActJunctionChoices({
      runSeed: this.currentRun.seed,
      sourceAct,
      targetAct,
      credits: this.runSession.credits,
      salvage: this.runSession.salvage,
      hullPatch: this.runSession.hullPatch,
      curse: this.runSession.curse,
      saveFingerprint: createSaveFingerprint(this.saveData)
    })[0];

    if (choice) {
      applyInterActChoice(this.runSession, choice);
    }
  }

  private handleMissionCombatComplete(result: CombatRunResult): void {
    const stageId = this.runSession.mission.currentStageId;
    const schedule = this.getCurrentMissionSchedule();
    const completedStage = getMissionStage(schedule, stageId);
    const sector = getCurrentSector(this.currentRun, this.runSession);
    const sectorIndex = this.runSession.currentSectorIndex;
    const isOptionalStage = completedStage.optional;
    const objectiveOutcome = result.missionObjective?.outcome;
    const campaignOutcome =
      objectiveOutcome === 'failure'
        ? 'failure'
        : objectiveOutcome === 'partialSuccess'
          ? 'partialSuccess'
          : 'success';

    if (completedStage.operationalRole === 'gate' && schedule.contract) {
      recordFactionCampaignEvent(this.runSession, this.currentRun.factionCampaign, {
        id: `${stageId}:campaign-contract`,
        type: 'contractCompleted',
        sectorIndex,
        factionId: sector.bossFactionId,
        contractId: schedule.contract.id
      });
      recordFactionCampaignEvent(this.runSession, this.currentRun.factionCampaign, {
        id: `${stageId}:campaign-outcome`,
        type: 'missionOutcome',
        sectorIndex,
        factionId: sector.bossFactionId,
        contractId: schedule.contract.id,
        outcome: campaignOutcome
      });
    }

    const combatRival = result.rivalEncounter;
    const unresolvedRival = getEngagedRivalForSector(
      this.currentRun.factionCampaign,
      this.runSession.factionCampaign,
      sectorIndex
    );
    if (combatRival || unresolvedRival) {
      const rivalId = combatRival?.rivalId ?? unresolvedRival!.id;
      recordFactionCampaignEvent(this.runSession, this.currentRun.factionCampaign, {
        id: `${stageId}:rival-outcome:${rivalId}`,
        type: 'rivalOutcome',
        sectorIndex,
        factionId: combatRival?.rivalId
          ? (this.currentRun.factionCampaign.rivals.find(
              (candidate) => candidate.id === combatRival.rivalId
            )?.factionId ?? sector.bossFactionId)
          : unresolvedRival!.factionId,
        rivalId,
        outcome: combatRival?.outcome ?? 'escaped'
      });
    }

    if (isOptionalStage && campaignOutcome === 'success') {
      const capturable = getCapturableRivalForSector(
        this.currentRun.factionCampaign,
        this.runSession.factionCampaign,
        sectorIndex
      );
      if (capturable) {
        recordFactionCampaignEvent(this.runSession, this.currentRun.factionCampaign, {
          id: `${stageId}:rival-captured:${capturable.id}`,
          type: 'rivalOutcome',
          sectorIndex,
          factionId: capturable.factionId,
          rivalId: capturable.id,
          outcome: 'captured'
        });
      }
    }

    for (const member of result.crew?.members ?? []) {
      recordCrewRosterEvent(this.runSession, this.currentRun.crewRoster, {
        id: `${stageId}:crew-combat:${member.candidateId}`,
        type: 'combatOutcome',
        sectorIndex,
        candidateId: member.candidateId,
        injured: member.injured,
        retreated: member.retreated,
        enemiesDefeated: member.enemiesDefeated,
        salvageRecovered: member.salvageRecovered
      });
    }

    const crewPolicy = schedule.contract?.crewPolicy ?? 'none';
    recordCrewRosterEvent(this.runSession, this.currentRun.crewRoster, {
      id: `${stageId}:crew-mission-outcome`,
      type: 'missionOutcome',
      sectorIndex,
      outcome: campaignOutcome,
      crewPolicy
    });
    const campaignInfluence = getFactionCampaignInfluence(
      this.currentRun.factionCampaign,
      this.runSession.factionCampaign,
      sector
    );
    const commandHeadroom = createEngineeringCombatProfile(this.runSession.engineering).resources
      .commandHeadroom;
    const candidate =
      campaignOutcome !== 'failure'
        ? getRecruitableCrewCandidate(this.currentRun.crewRoster, this.runSession.crewRoster, {
            sectorIndex,
            crewPolicy: isOptionalStage ? 'none' : crewPolicy,
            factionId: sector.bossFactionId,
            factionSignal: Boolean(campaignInfluence.crewOfferSignal) && isOptionalStage,
            commandHeadroom
          })
        : null;
    if (candidate) {
      const recruitment = recordCrewRosterEvent(this.runSession, this.currentRun.crewRoster, {
        id: `${stageId}:crew-recruit:${candidate.id}`,
        type: 'recruit',
        sectorIndex,
        candidateId: candidate.id,
        commandHeadroom,
        source:
          crewPolicy === 'protectSpecialist'
            ? 'protected specialist transfer'
            : crewPolicy === 'recordCandidate'
              ? 'distress rescue manifest'
              : 'trusted faction distress channel'
      });
      if (recruitment.disposition === 'applied') {
        recordFactionCampaignEvent(this.runSession, this.currentRun.factionCampaign, {
          id: `${stageId}:crew-faction-aid:${candidate.id}`,
          type: 'aid',
          sectorIndex,
          factionId: candidate.factionId,
          amount: 1,
          reason: `rescued ${candidate.callsign}`
        });
      }
    }
    const operationCheckpoint = {
      hull: result.remainingHull ?? null,
      scrollDistance: result.distanceTraveled,
      worldOffset: result.worldOffset ?? result.distanceTraveled,
      credits: this.runSession.credits + result.credits,
      salvage: this.runSession.salvage + result.salvage
    };
    const transition = this.dispatchCurrentMission({
      id: `${stageId}:combat-complete`,
      type: 'completeCombat',
      checkpoint: operationCheckpoint,
      objectiveOutcome: result.missionObjective
    });

    if (transition.disposition !== 'advanced') {
      return;
    }

    recordMissionObjectiveOutcome(this.runSession, schedule, result);
    recordSectorCombatResult(this.runSession, result, createActEconomyProfile(sector));
    this.lastRunResult = this.runSession.lastCombatResult;
    const operationNode = completedStage.nodeId
      ? this.currentRun.expedition.nodes.find((node) => node.id === completedStage.nodeId)
      : null;
    if (operationNode) {
      recordMissionOperationBoundary(this.runSession, {
        id: `${stageId}:settled`,
        node: operationNode,
        outcome: campaignOutcome,
        checkpoint: operationCheckpoint
      });
    }
    const nextStage = getMissionStage(
      this.getCurrentMissionSchedule(),
      this.runSession.mission.currentStageId
    );

    if (nextStage.kind === 'branch') {
      this.showMissionBranch();
      return;
    }

    if (nextStage.kind === 'relief') {
      this.showMissionRelief();
      return;
    }

    if (nextStage.kind === 'failure') {
      this.showRunSummary({ ...result, reason: 'abandoned' });
      return;
    }

    throw new Error(`Combat advanced to unexpected mission stage ${nextStage.kind}.`);
  }

  private prepareDebugMissionCombat(): void {
    if (
      getMissionStage(this.getCurrentMissionSchedule(), this.runSession.mission.currentStageId)
        .kind === 'briefing'
    ) {
      this.dispatchCurrentMission({
        id: `${this.runSession.mission.currentStageId}:debug-briefing`,
        type: 'confirmBriefing'
      });
      this.dispatchCurrentMission({
        id: `${this.runSession.mission.currentStageId}:debug-entry`,
        type: 'completeEntry'
      });
    }
  }

  private prepareDebugGateOperation(): void {
    this.prepareDebugMissionCombat();
    let schedule = this.getCurrentMissionSchedule();
    let stage = getMissionStage(schedule, this.runSession.mission.currentStageId);
    if (stage.operationalRole === 'gate') return;
    if (stage.operationalRole !== 'advance') {
      throw new Error(`Debug gate setup cannot advance from ${stage.operationalRole}.`);
    }
    this.dispatchCurrentMission({
      id: `${stage.id}:debug-complete`,
      type: 'completeCombat',
      checkpoint: {
        hull: getEffectiveShipStats(this.selectedContract, this.runSession).maxHull,
        scrollDistance: 900,
        worldOffset: 10_900,
        credits: this.runSession.credits,
        salvage: this.runSession.salvage
      }
    });
    schedule = this.getCurrentMissionSchedule();
    stage = getMissionStage(schedule, this.runSession.mission.currentStageId);
    const branch = stage.branchId
      ? schedule.branches.find((candidate) => candidate.id === stage.branchId)
      : null;
    const direct = branch?.options.find((option) => option.default);
    if (!branch || !direct) {
      throw new Error('Debug gate setup could not resolve the staging route.');
    }
    this.dispatchCurrentMission({
      id: `${stage.id}:debug-direct`,
      type: 'selectBranch',
      optionId: direct.id
    });
    recordExpeditionBranchDecision(this.currentRun, this.runSession, branch.id, direct.id);
    stage = getMissionStage(schedule, this.runSession.mission.currentStageId);
    this.dispatchCurrentMission({
      id: `${stage.id}:debug-staging`,
      type: 'completeRelief'
    });
  }

  private handleMissionFailure(result: CombatRunResult): void {
    if (
      this.runSession.mission.status !== 'failed' &&
      this.runSession.mission.status !== 'completed'
    ) {
      this.dispatchCurrentMission({
        id: `${this.runSession.mission.currentStageId}:fail:${result.reason}`,
        type: 'fail',
        reason: result.reason
      });
    }
    this.showRunSummary(aggregateCombatRunResults(this.runSession.lastCombatResult, result));
  }

  private getCurrentMissionSchedule() {
    const sectorIndex = Math.min(
      this.currentRun.expedition.sectors.length - 1,
      Math.max(0, this.runSession.mission.sectorIndex)
    );
    return createMissionSchedule(this.currentRun.expedition, sectorIndex);
  }

  private dispatchCurrentMission(event: MissionEvent): MissionTransitionResult {
    return dispatchMissionEvent(this.currentRun, this.runSession, event);
  }

  private showMissionBranch(): void {
    const schedule = this.getCurrentMissionSchedule();
    const branchStage = getMissionStage(schedule, this.runSession.mission.currentStageId);
    const currentBranch = branchStage.branchId
      ? schedule.branches.find((branch) => branch.id === branchStage.branchId)
      : null;
    if (!currentBranch) {
      throw new Error(`Operational map stage ${branchStage.id} has no branch.`);
    }
    const sector = getCurrentSector(this.currentRun, this.runSession);
    const capturableRival = getCapturableRivalForSector(
      this.currentRun.factionCampaign,
      this.runSession.factionCampaign,
      this.runSession.currentSectorIndex
    );
    const campaign = getFactionCampaignInfluence(
      this.currentRun.factionCampaign,
      this.runSession.factionCampaign,
      sector
    );
    const crewCandidate = getRecruitableCrewCandidate(
      this.currentRun.crewRoster,
      this.runSession.crewRoster,
      {
        sectorIndex: this.runSession.currentSectorIndex,
        crewPolicy: 'none',
        factionId: sector.bossFactionId,
        factionSignal: Boolean(campaign.crewOfferSignal),
        commandHeadroom: createEngineeringCombatProfile(this.runSession.engineering).resources
          .commandHeadroom
      }
    );
    this.sceneManager.switchTo(
      new OperationalMapScene(
        this.uiRoot,
        this.currentRun.expedition,
        this.runSession.expedition,
        this.runSession.operational,
        schedule,
        this.runSession.mission,
        this.selectedContract,
        createMissionReadModel(schedule, this.runSession.mission),
        createMissionDebugState(schedule, this.runSession.mission),
        getMissionBranchOptions(schedule, this.runSession.mission),
        this.runSession.credits,
        this.runSession.salvage,
        (option) => {
          const result = this.dispatchCurrentMission({
            id: `${this.runSession.mission.currentStageId}:branch:${option.id}`,
            type: 'selectBranch',
            optionId: option.id
          });

          if (result.disposition !== 'advanced') {
            return;
          }

          if (capturableRival && option.default) {
            recordFactionCampaignEvent(this.runSession, this.currentRun.factionCampaign, {
              id: `${currentBranch.id}:${option.id}:spared:${capturableRival.id}`,
              type: 'targetSpared',
              sectorIndex: this.runSession.currentSectorIndex,
              factionId: capturableRival.factionId,
              rivalId: capturableRival.id
            });
          }

          recordExpeditionBranchDecision(
            this.currentRun,
            this.runSession,
            currentBranch.id,
            option.id
          );
          const stage = getMissionStage(schedule, this.runSession.mission.currentStageId);
          if (stage.kind === 'combat') {
            this.showGameplay();
          } else if (stage.kind === 'relief') {
            this.showMissionRelief();
          } else if (stage.kind === 'extraction') {
            this.showRouteChoice();
          }
        },
        () => {},
        [
          capturableRival
            ? `Rival option: extract and let ${capturableRival.name} recur, or pursue the optional lane to capture ${capturableRival.shipName}.`
            : null,
          crewCandidate
            ? `Distress option: the optional lane can recover ${crewCandidate.callsign} and ${crewCandidate.wingName}.`
            : null
        ]
          .filter((copy): copy is string => Boolean(copy))
          .join(' ') || null
      )
    );
    this.checkpointRun('operationalMap', `${branchStage.label} checkpoint`);
  }

  private showMissionRelief(): void {
    const schedule = this.getCurrentMissionSchedule();
    this.sceneManager.switchTo(
      new OperationalMapScene(
        this.uiRoot,
        this.currentRun.expedition,
        this.runSession.expedition,
        this.runSession.operational,
        schedule,
        this.runSession.mission,
        this.selectedContract,
        createMissionReadModel(schedule, this.runSession.mission),
        createMissionDebugState(schedule, this.runSession.mission),
        [],
        this.runSession.credits,
        this.runSession.salvage,
        () => {},
        () => {
          const result = this.dispatchCurrentMission({
            id: `${this.runSession.mission.currentStageId}:relief-complete`,
            type: 'completeRelief'
          });
          if (result.disposition === 'advanced') {
            const nextStage = getMissionStage(schedule, this.runSession.mission.currentStageId);
            if (nextStage.kind === 'combat') {
              this.showGameplay();
            } else if (nextStage.kind === 'extraction') {
              this.showRouteChoice();
            }
          }
        },
        'Combat world cleanup is settled; no actors, projectiles, hooks, or pending payouts cross this checkpoint.'
      )
    );
    this.checkpointRun(
      'operationalMap',
      `${createMissionReadModel(schedule, this.runSession.mission).stageLabel} checkpoint`
    );
  }

  private showRouteChoice(): void {
    this.sceneManager.switchTo(
      new RouteScene(
        this.uiRoot,
        this.currentRun,
        this.runSession,
        this.selectedContract,
        (route) => {
          this.handleRouteChoice(route);
        }
      )
    );
  }

  private handleRouteChoice(route: RouteOption): void {
    const sector = getCurrentSector(this.currentRun, this.runSession);
    const outcome = generateRouteOutcome({
      run: this.currentRun,
      sector,
      route,
      availableCredits: this.runSession.credits
    });

    applyRouteOutcome(this.runSession, sector, route, outcome, this.currentRun.factionCampaign);

    if (route.kind === 'shop') {
      this.showShop(route);
      return;
    }

    this.showRouteEvent(route, outcome);
  }

  private showRouteEvent(route: RouteOption, outcome: AppliedRouteOutcome): void {
    this.sceneManager.switchTo(
      new RouteEventScene(this.uiRoot, outcome, this.selectedContract, () => {
        this.showReward(route);
      })
    );
  }

  private showShop(route: RouteOption): void {
    this.sceneManager.switchTo(
      new ShopScene(
        this.uiRoot,
        this.currentRun,
        this.runSession,
        this.selectedContract,
        (itemId, price) => this.buyShopItem(itemId, price),
        () => this.rerollShop(),
        () => {
          this.showReward(route);
        }
      )
    );
  }

  private showReward(route: RouteOption): void {
    this.sceneManager.switchTo(
      new RewardScene(
        this.uiRoot,
        this.currentRun,
        this.runSession,
        this.selectedContract,
        route,
        (itemId) => {
          addItemToSession(this.runSession, itemId);
          this.showFoundryAfterReward(route);
        },
        () => {
          const sector = getCurrentSector(this.currentRun, this.runSession);
          addCredits(
            this.runSession,
            getRouteCreditReward(this.runSession, sector.index, createActEconomyProfile(sector))
          );
          this.showFoundryAfterReward(route);
        }
      )
    );
  }

  private buyShopItem(itemId: ItemId, price: number): boolean {
    if (!spendCredits(this.runSession, price)) {
      return false;
    }

    addItemToSession(this.runSession, itemId);
    return true;
  }

  private rerollShop(): boolean {
    const sector = getCurrentSector(this.currentRun, this.runSession);
    const rerollCost = getShopRerollCost(
      createActEconomyProfile(sector),
      this.runSession.shopRerollsBySector[sector.index] ?? 0
    );

    if (!spendCredits(this.runSession, rerollCost)) {
      return false;
    }

    incrementShopRerollCount(this.runSession, sector.index);
    return true;
  }

  private buyPersistentUpgrade(upgradeId: UpgradeId): UpgradePurchaseResult {
    const result = purchaseUpgrade(this.saveData, upgradeId);

    if (!result.ok) {
      return result;
    }

    this.saveData = result.data;
    writeSaveData(window.localStorage, this.saveData);
    this.refreshRunForCurrentSave();
    return result;
  }

  private advanceAfterReward(): void {
    const missionResult = this.dispatchCurrentMission({
      id: `${this.runSession.mission.currentStageId}:extraction-complete`,
      type: 'completeExtraction'
    });

    if (missionResult.disposition !== 'advanced') {
      return;
    }

    const previousSectorIndex = this.runSession.currentSectorIndex;

    if (!advanceSector(this.currentRun, this.runSession)) {
      const victory = this.lastRunResult
        ? { ...this.lastRunResult, reason: 'victory' as const }
        : undefined;
      this.showRunSummary(victory);
      return;
    }

    const handoff = getInterActTransitionHandoff(
      this.currentRun.acts,
      previousSectorIndex,
      this.runSession.currentSectorIndex
    );

    if (handoff && !hasInterActChoiceForSourceAct(this.runSession, handoff.sourceAct.id)) {
      this.showInterActJunction(handoff.sourceAct, handoff.targetAct);
      return;
    }

    this.showSectorTransition();
  }

  private showFoundryAfterReward(route: RouteOption): void {
    const sector = getCurrentSector(this.currentRun, this.runSession);
    const component = generateComponentSalvage({
      seed: this.currentRun.seed,
      saveFingerprint: createRunGenerationSaveFingerprint(
        this.currentRun.unlockedIds,
        this.currentRun.upgradeEffects
      ),
      sectorIndex: sector.index,
      routeKind: route.kind,
      sectorId: sector.sectorId,
      bossRequired: sector.objective.bossRequired,
      state: this.runSession.engineering
    });
    this.runSession.engineering = acquireComponent(this.runSession.engineering, component);
    recordRunSessionTimelineEvent(this.runSession, {
      id: `engineering-acquire:${component.id}`,
      category: 'engineering',
      kind: 'acquire',
      sectorIndex: this.runSession.currentSectorIndex,
      value: component.salvageValue,
      subjectId: component.id,
      detailId: component.moduleId
    });
    const crewAssist = getCrewFoundryAssist(this.currentRun.crewRoster, this.runSession.crewRoster);
    this.sceneManager.switchTo(
      new FoundryScene(
        this.uiRoot,
        this.currentRun,
        this.selectedContract,
        this.runSession.engineering,
        sector.index,
        (engineering, salvageGained) => {
          this.runSession.engineering = engineering;
          this.runSession.salvage += salvageGained + (crewAssist?.salvageBonus ?? 0);
          if (crewAssist) {
            recordCrewRosterEvent(this.runSession, this.currentRun.crewRoster, {
              id: `foundry-assist:${sector.index}:${crewAssist.candidateId}`,
              type: 'foundryAssist',
              sectorIndex: this.runSession.currentSectorIndex,
              candidateId: crewAssist.candidateId
            });
          }
          recordRunSessionTimelineEvent(this.runSession, {
            id: `engineering-commit:${sector.index}:${engineering.history.length}`,
            category: 'engineering',
            kind: 'commit',
            sectorIndex: this.runSession.currentSectorIndex,
            value: salvageGained + (crewAssist?.salvageBonus ?? 0),
            subjectId: engineering.committed.frameId,
            detailId: `history-${engineering.history.length}`
          });
          this.advanceAfterReward();
        },
        crewAssist?.label ?? null
      )
    );
  }

  private showInterActJunction(sourceAct: RunActPlan, targetAct: RunActPlan): void {
    const choices = createInterActJunctionChoices({
      runSeed: this.currentRun.seed,
      sourceAct,
      targetAct,
      credits: this.runSession.credits,
      salvage: this.runSession.salvage,
      hullPatch: this.runSession.hullPatch,
      curse: this.runSession.curse,
      saveFingerprint: createSaveFingerprint(this.saveData)
    });

    this.sceneManager.switchTo(
      new InterActJunctionScene(
        this.uiRoot,
        this.currentRun,
        this.runSession,
        this.selectedContract,
        sourceAct,
        targetAct,
        choices,
        (choice) => {
          applyInterActChoice(this.runSession, choice);
          this.showSectorTransition();
        },
        () => {
          this.abandonAtInterActJunction();
        }
      )
    );
  }

  private showSectorTransition(): void {
    const schedule = this.getCurrentMissionSchedule();
    this.checkpointRun(
      'sectorTransition',
      `Sector ${this.runSession.currentSectorIndex + 1} briefing`
    );
    this.sceneManager.switchTo(
      new SectorTransitionScene(
        this.uiRoot,
        this.currentRun,
        this.runSession,
        this.selectedContract,
        () => {
          const briefing = this.dispatchCurrentMission({
            id: `${this.runSession.mission.currentStageId}:briefing-confirmed`,
            type: 'confirmBriefing'
          });
          if (briefing.disposition !== 'advanced') {
            return;
          }

          const entry = this.dispatchCurrentMission({
            id: `${this.runSession.mission.currentStageId}:entry-complete`,
            type: 'completeEntry'
          });
          if (entry.disposition === 'advanced') {
            this.showGameplay();
          }
        },
        createMissionReadModel(schedule, this.runSession.mission),
        createMissionDebugState(schedule, this.runSession.mission)
      )
    );
  }

  private showPause(gameplayScene: GameplayScene): void {
    if (this.runSession.mission.status === 'active') {
      this.dispatchCurrentMission({
        id: `${this.runSession.mission.currentStageId}:suspend:${this.runSession.mission.transitions.length}`,
        type: 'suspend'
      });
    }
    this.sceneManager.switchTo(
      new PauseScene(
        this.uiRoot,
        gameplayScene,
        (resumedScene) => {
          const result = this.dispatchCurrentMission({
            id: `${this.runSession.mission.currentStageId}:resume:${this.runSession.mission.transitions.length}`,
            type: 'resume'
          });
          if (result.disposition === 'advanced') {
            this.showGameplay(resumedScene);
          }
        },
        () => {
          this.handleMissionFailure(gameplayScene.getRunResult('abandoned'));
        },
        () => {
          this.showSettings(() => this.showPause(gameplayScene));
        },
        () => {
          this.checkpointRun('gameplay', 'Manually suspended operation');
          this.showMainMenu();
        }
      )
    );
  }

  private abandonAtInterActJunction(): void {
    this.handleMissionFailure({
      reason: 'abandoned',
      survivedSeconds: 0,
      distanceTraveled: 0,
      sectorLength: null,
      credits: this.runSession.credits,
      salvage: this.runSession.salvage,
      enemiesDestroyed: 0,
      bossesDefeated: 0,
      shotsFired: 0,
      pickupsCollected: 0,
      damageTaken: 0,
      itemTriggers: 0,
      itemNames: []
    });
  }

  private showRunSummary(result?: CombatRunResult): void {
    this.runSnapshotCoordinator.clear();
    this.runSnapshot = null;
    this.snapshotEligible = false;
    this.lastRunResult = result ?? this.lastRunResult;
    if (this.lastRunResult) {
      recordRunSessionTimelineEvent(this.runSession, {
        id: `run-end:${this.lastRunResult.reason}`,
        category: 'run',
        kind: this.lastRunResult.reason,
        sectorIndex: this.runSession.currentSectorIndex,
        subjectId: this.currentRun.seed,
        detailId: this.lastRunResult.reason
      });
    }
    this.lastSaveUpdate = this.saveRunSummary(this.lastRunResult);
    const schedule = this.getCurrentMissionSchedule();
    this.sceneManager.switchTo(
      new RunSummaryScene(
        this.uiRoot,
        this.currentRun,
        this.selectedContract,
        this.lastRunResult,
        this.runSession.routeHistory,
        this.runSession.routeOutcomes,
        this.runSession.interActChoices,
        this.runSession.expedition,
        this.runSession.itemInstances,
        this.runSession.engineering,
        this.saveData,
        this.lastSaveUpdate,
        () => {
          this.showMainMenu();
        },
        formatMissionTimeline(schedule, this.runSession.mission),
        formatMissionObjectiveHistory(this.runSession.objectiveHistory),
        this.runSession.factionCampaign,
        this.runSession.crewRoster,
        this.runSession.timeline
      )
    );
  }

  private saveRunSummary(result: CombatRunResult | null): SaveUpdateResult | null {
    if (!result || this.summarySaved) {
      return this.lastSaveUpdate;
    }

    const update = applyRunRecordToSave(this.saveData, this.createSaveRecord(result));
    this.saveData = update.data;
    this.lastSaveUpdate = update;
    this.summarySaved = true;
    writeSaveData(window.localStorage, this.saveData);
    return update;
  }

  private createSaveRecord(result: CombatRunResult): RunSaveRecord {
    const sectorsCleared = getSaveRecordSectorCount(
      this.currentRun,
      this.runSession.currentSectorIndex,
      this.runSession.routeHistory.length,
      result.reason
    );
    const actSaveContext = createRunActSaveContext(this.currentRun.acts, sectorsCleared);
    const sector = this.currentRun.sectors[this.runSession.currentSectorIndex];
    const finale = sector?.finale ?? null;
    const expedition = createExpeditionPathReadModel(
      this.currentRun.expedition,
      this.runSession.expedition
    );

    return {
      seed: this.currentRun.seed,
      contractId: this.selectedContract.id,
      contractName: this.selectedContract.shipName,
      reason: result.reason,
      actId: actSaveContext.actId,
      actName: actSaveContext.actName,
      actShortLabel: actSaveContext.actShortLabel,
      actIndex: actSaveContext.actIndex,
      actSectorIndex: actSaveContext.actSectorIndex,
      actSectorCount: actSaveContext.actSectorCount,
      actsCompleted: actSaveContext.actsCompleted,
      finaleVariantId: finale?.variantId ?? null,
      finaleVariantName: finale?.variantName ?? null,
      finaleCleared: result.reason === 'victory' && finale !== null,
      expeditionGraphId: expedition.graphId,
      expeditionVisitedNodeIds: expedition.visitedNodeIds,
      expeditionDecisionIds: this.runSession.expedition.decisions.map(
        (decision) => `${decision.branchId}:${decision.optionId}`
      ),
      expeditionTargetSeconds: expedition.baselineTargetSeconds,
      survivedSeconds: result.survivedSeconds,
      distanceTraveled: result.distanceTraveled,
      sectorLength: result.sectorLength,
      sectorsCleared,
      bossesDefeated: result.bossesDefeated,
      enemiesDestroyed: result.enemiesDestroyed,
      creditsRecovered: Math.max(result.credits, this.runSession.credits),
      salvageRecovered: Math.max(result.salvage, this.runSession.salvage),
      itemTriggers: result.itemTriggers,
      itemIds: this.runSession.itemInstances.map((item) => item.itemId)
    };
  }

  private importSave(serialized: string): { ok: boolean; message: string } {
    try {
      this.saveData = importSaveData(serialized);
      writeSaveData(window.localStorage, this.saveData);
      this.refreshRunForCurrentSave();
      return { ok: true, message: 'Save imported.' };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Save import failed.'
      };
    }
  }

  private applySettings(settings: GameSettings): void {
    this.settingsData = settings;
    writeSettingsData(window.localStorage, settings);
    this.input.setBindings(settingsToKeyBindingMap(settings));
    this.renderer.setSettings(settings);
    this.audio.setSettings(settings);
    this.applyDocumentSettings();
  }

  private handleCombatFeedback(cues: readonly CombatFeedbackCue[]): void {
    for (const cue of cues) {
      this.audio.playCue(cue);
      this.renderer.triggerShake(getFeedbackShakeIntensity(cue));
    }
  }

  private applyDocumentSettings(): void {
    const documentElement = this.root.ownerDocument.documentElement;
    documentElement.dataset.reducedMotion = String(this.settingsData.reducedMotion);
    documentElement.dataset.bulletContrast = this.settingsData.bulletContrast;
    documentElement.dataset.performanceMode = String(this.settingsData.performanceMode);
    documentElement.dataset.audioMuted = String(this.settingsData.muted);
    documentElement.style.setProperty('--screen-shake', `${this.settingsData.screenShake}`);
  }

  private toggleFullscreen(settings: GameSettings): void {
    const ownerDocument = this.root.ownerDocument;
    this.applySettings(settings);

    if (!ownerDocument.fullscreenElement) {
      void ownerDocument.documentElement.requestFullscreen?.().catch(() => {});
      return;
    }

    void ownerDocument.exitFullscreen?.().catch(() => {});
  }

  private updateDebugOverlay(): void {
    if (!this.debugEnabled) {
      return;
    }

    const debugState = this.sceneManager.getDebugState();
    const expedition = createExpeditionDebugState(
      this.currentRun.expedition,
      this.runSession.expedition
    );
    const scrollDebug =
      debugState.distance === undefined ||
      debugState.sectorLength === undefined ||
      debugState.scrollSpeed === undefined
        ? []
        : [
            `Distance ${Math.floor(debugState.distance)}/${Math.floor(debugState.sectorLength)}`,
            `Scroll ${Math.round(debugState.scrollSpeed)}u/s`
          ];
    const backgroundDebug =
      debugState.backgroundPrimitives === undefined
        ? []
        : [
            `Bg ${debugState.backgroundPrimitives}p${
              debugState.backgroundLayers === undefined ? '' : `/${debugState.backgroundLayers}l`
            }`
          ];
    const featureDebug =
      debugState.activeLandmarks === undefined && debugState.activeHazards === undefined
        ? []
        : [`Features L${debugState.activeLandmarks ?? 0}/H${debugState.activeHazards ?? 0}`];
    const sectorDebug = debugState.sector
      ? [
          `Sector S${debugState.sector.index} ${debugState.sector.name}`,
          `Plan ${[
            debugState.sector.id,
            debugState.sector.backgroundId,
            debugState.sector.objective,
            debugState.sector.encounterPacing,
            debugState.sector.pacing,
            debugState.sector.routeTags ? `tags:${debugState.sector.routeTags}` : null
          ]
            .filter((part): part is string => Boolean(part))
            .join('/')}`
        ].filter((line) => line.length > 0)
      : [];
    const missionDebug = debugState.mission
      ? [
          `Mission ${debugState.mission.kind} ${debugState.mission.status}`,
          `Stage ${debugState.mission.stage} | T${debugState.mission.transitions}`,
          `Contract ${debugState.mission.contractId ?? 'legacy'} | Objective ${
            debugState.mission.objectiveVerb ?? 'none'
          }/${debugState.mission.objectiveId ?? 'none'}${
            debugState.mission.objectiveOutcome ? ` | ${debugState.mission.objectiveOutcome}` : ''
          }`
        ]
      : [];
    const objectiveDebug = debugState.sector?.objectiveState
      ? [`Objective ${debugState.sector.objectiveState}`]
      : [];
    const sectorPacingDebug = debugState.sector?.pacingBeat
      ? [`Pacing ${debugState.sector.pacingBeat}`]
      : [];
    const hazardZoneDebug = debugState.sector?.hazardZones
      ? [`Hazards ${debugState.sector.hazardZones}`]
      : [];
    const viewportDebug =
      debugState.viewport === undefined
        ? []
        : [
            `Viewport ${debugState.viewport.width}x${debugState.viewport.height} ${debugState.viewport.className} @${debugState.viewport.scale.toFixed(2)} DPR ${debugState.viewport.dpr.toFixed(2)}`,
            `Canvas ${debugState.viewport.canvasPixelWidth}x${debugState.viewport.canvasPixelHeight}`,
            `Safe ${debugState.viewport.safeFrameX},${debugState.viewport.safeFrameY} ${debugState.viewport.safeFrameWidth}x${debugState.viewport.safeFrameHeight}`,
            debugState.viewport.arenaWidth === undefined ||
            debugState.viewport.arenaHeight === undefined
              ? ''
              : `World ${debugState.viewport.arenaWidth}x${debugState.viewport.arenaHeight}`
          ].filter((line) => line.length > 0);
    const countDebug =
      debugState.entityCounts === undefined
        ? []
        : [
            `Enemies ${debugState.entityCounts.enemies}${
              debugState.entityCounts.boss > 0 ? `+Boss ${debugState.entityCounts.boss}` : ''
            }`,
            `Projectiles ${debugState.entityCounts.projectiles} (P${debugState.entityCounts.playerProjectiles}/E${debugState.entityCounts.enemyProjectiles})`,
            `Pickups/FX ${debugState.entityCounts.pickups}/${debugState.entityCounts.effects}`,
            `Loose ${debugState.entityCounts.looseCurrencyPickups}/${debugState.entityCounts.looseCurrencyPickupCap} V${debugState.entityCounts.looseCurrencyValue}/${debugState.entityCounts.looseCurrencyValueCap} C${debugState.entityCounts.looseCurrencyCredits}/S${debugState.entityCounts.looseCurrencySalvage}`,
            `Telegraphs ${debugState.entityCounts.telegraphs}`,
            `Environment ${debugState.entityCounts.environmentObjects} (D${debugState.entityCounts.destructibles}/O${debugState.entityCounts.obstacles})`,
            `Set-piece parts ${debugState.entityCounts.setPieceComponents ?? 0} targets ${debugState.entityCounts.setPieceTargets ?? 0} shots ${debugState.entityCounts.setPieceProjectiles ?? 0}/${debugState.entityCounts.setPieceProjectileCap ?? 0}`
          ];
    const arenaDebug =
      debugState.arenaPhase && debugState.arenaPhase !== 'none'
        ? [`Arena ${debugState.arenaPhase}`]
        : [];
    const exitDebug = debugState.exitSequence ? [`Exit ${debugState.exitSequence}`] : [];
    const destructionDebug = debugState.destructionSequence
      ? [`Destruction ${debugState.destructionSequence}`]
      : [];
    const scenarioDebug = debugState.debugScenario ? [`Scenario ${debugState.debugScenario}`] : [];
    const itemDebug = createItemDebugLines(debugState.items);
    const enemyRoleDebug = createEnemyRoleDebugLines(debugState.enemyRoles);
    const environmentStressDebug = createEnvironmentStressDebugLines(debugState.environmentStress);
    const actPressureDebug = createActPressureDebugLines(debugState.actPressure);
    const inputDebug = debugState.inputMode ? [`Input ${debugState.inputMode}`] : [];
    const hudDebug = debugState.hudMode ? [`HUD ${debugState.hudMode}`] : [];
    const themeDebug = debugState.contractTheme
      ? [`Theme ${debugState.contractTheme.themeKey}/${debugState.contractTheme.shipName}`]
      : [];
    const loadoutDebug = debugState.shipLoadout
      ? [
          `Loadout ${debugState.shipLoadout.frameName} P${debugState.shipLoadout.powerDraw}/${debugState.shipLoadout.reactorOutput} H${debugState.shipLoadout.heatLoad}/${debugState.shipLoadout.thermalCapacity} M${debugState.shipLoadout.totalMass}/${debugState.shipLoadout.massCapacity} C${debugState.shipLoadout.commandDraw}/${debugState.shipLoadout.commandCapacity}`
        ]
      : [];
    const engineeringDebug = debugState.engineering
      ? [
          `Foundry I${debugState.engineering.installedCount} C${debugState.engineering.cargoCount} H${debugState.engineering.historyCount} P${debugState.engineering.pendingCount} Inst ${debugState.engineering.instability}/${debugState.engineering.instabilityCapacity} Proc ${debugState.engineering.procBudget} ${debugState.engineering.effects} ${debugState.engineering.resources}`
        ]
      : [];
    const combinedProcDebug = debugState.combinedProc
      ? [
          `Combined proc ${debugState.combinedProc.peakHook ?? 'none'} ${debugState.combinedProc.peakApplications}/${debugState.combinedProc.budget} total ${debugState.combinedProc.totalApplied} skip ${debugState.combinedProc.totalSkipped} order ${debugState.combinedProc.lastOrder.join('>') || 'none'}`
        ]
      : [];
    const setPieceDebug = debugState.setPiece
      ? [
          `Set-piece ${debugState.setPiece.name} ${debugState.setPiece.beat} ${debugState.setPiece.destroyedComponents}/${debugState.setPiece.totalComponents} target ${debugState.setPiece.targetLabel} lane ${debugState.setPiece.safeLaneLabel}${debugState.setPiece.bossLockActive ? ' BOSS-LOCK' : ''}`
        ]
      : [];
    const factionCampaignDebug = debugState.factionCampaign
      ? [
          `Campaign ${debugState.factionCampaign.influence} events ${debugState.factionCampaign.historyCount}`,
          `Campaign rivals ${debugState.factionCampaign.rivals.join(' / ')}`,
          ...(debugState.factionCampaign.activeRival
            ? [`Active rival ${debugState.factionCampaign.activeRival}`]
            : [])
        ]
      : [];
    const crewDebug = debugState.crew
      ? [
          `Crew ${debugState.crew.activeCommand} cd ${debugState.crew.commandCooldown.toFixed(2)} issued ${debugState.crew.issuedCommands}`,
          `Allies ${debugState.crew.allies.join(' / ') || 'none'}`
        ]
      : [];
    const timelineDebug = debugState.runTimeline
      ? [
          `Timeline ${debugState.runTimeline.entries}/${debugState.runTimeline.capacity} dropped ${debugState.runTimeline.dropped} elapsed ${debugState.runTimeline.elapsedSeconds.toFixed(1)}s`,
          `Timeline cats ${debugState.runTimeline.categories.join(' / ') || 'none'}`,
          ...debugState.runTimeline.latest.map((entry) => `Timeline ${entry}`)
        ]
      : [];
    const scenarioLabDebug = debugState.scenarioLab
      ? [
          `Scenario Lab ${debugState.scenarioLab.activeScenario ?? 'catalog'} ${debugState.scenarioLab.scenarioCount} cases`,
          `Scenario systems ${debugState.scenarioLab.systems.join('/') || 'none'}`,
          `Scenario budget ${debugState.scenarioLab.budget}`
        ]
      : [];
    const upgradeDebug =
      debugState.upgradeEffects && debugState.upgradeEffects.length > 0
        ? [`Upgrades ${debugState.upgradeEffects.join(', ')}`]
        : [];
    const progressionDebug = createProgressionDebugLines(debugState.progression);
    const actDebug = debugState.act
      ? [
          `Act ${debugState.act.shortLabel} ${debugState.act.name} ${debugState.act.sectorIndex}/${debugState.act.sectorCount} ${debugState.act.rewardTier}/${debugState.act.pressureTier}`
        ]
      : [];
    const finaleDebug = debugState.finale
      ? [
          `Finale ${debugState.finale.label} ${debugState.finale.variantId} +${debugState.finale.bossHullBonus}H A${debugState.finale.approachDistanceMultiplier.toFixed(
            2
          )}/${debugState.finale.approachSpeedMultiplier.toFixed(2)} ${debugState.finale.victoryUnlockId}`
        ]
      : [];
    const interActDebug = debugState.interAct
      ? [
          `Junction ${debugState.interAct.targetAct} choices ${debugState.interAct.choices.join('/')}${
            debugState.interAct.applied ? ` | ${debugState.interAct.applied}` : ''
          }`
        ]
      : [];
    const expeditionDebug = [
      `Expedition ${expedition.currentNodeId} ${expedition.visitedNodes}/${expedition.totalNodes} decisions ${expedition.decisions}`,
      `Expedition capacity ${expedition.baselineMinutes.toFixed(1)}-${expedition.expandedMinutes.toFixed(1)}m`
    ];

    this.debugOverlay.textContent = [
      `FPS ${Math.round(this.frameStats.fps)}`,
      `Scene ${this.sceneManager.getSceneId()}`,
      `Seed ${debugState.seed}`,
      `Entities ${debugState.entityCount}`,
      ...countDebug,
      ...scrollDebug,
      ...arenaDebug,
      ...exitDebug,
      ...destructionDebug,
      ...scenarioDebug,
      ...itemDebug,
      ...enemyRoleDebug,
      ...environmentStressDebug,
      ...actPressureDebug,
      ...inputDebug,
      ...hudDebug,
      ...themeDebug,
      ...loadoutDebug,
      ...engineeringDebug,
      ...combinedProcDebug,
      ...setPieceDebug,
      ...factionCampaignDebug,
      ...crewDebug,
      ...timelineDebug,
      ...scenarioLabDebug,
      ...upgradeDebug,
      ...progressionDebug,
      ...actDebug,
      ...finaleDebug,
      ...interActDebug,
      ...expeditionDebug,
      ...missionDebug,
      ...sectorDebug,
      ...objectiveDebug,
      ...sectorPacingDebug,
      ...hazardZoneDebug,
      ...backgroundDebug,
      ...featureDebug,
      ...viewportDebug
    ].join(' | ');
  }

  private createRunSkeleton(): RunSkeleton {
    return generateRunSkeleton(this.currentSeedLabel, {
      unlockedIds: this.saveData.unlockedIds,
      purchasedUpgradeIds: this.saveData.purchasedUpgradeIds
    });
  }

  private refreshRunForCurrentSave(): void {
    this.currentRun = this.createRunSkeleton();
    this.selectedContract = getFirstContract(this.currentRun);
    this.runSession = createRunSession(this.currentRun, this.selectedContract, {
      unlockedIds: this.saveData.unlockedIds
    });
  }

  private checkpointRun(
    target: 'sectorTransition' | 'gameplay' | 'operationalMap',
    label: string
  ): void {
    if (!this.snapshotEligible) return;
    try {
      this.runSnapshot = this.runSnapshotCoordinator.checkpoint({
        run: this.currentRun,
        contract: this.selectedContract,
        session: this.runSession,
        target,
        label
      });
      this.runSnapshotNotice = null;
    } catch (error) {
      this.runSnapshotNotice =
        error instanceof Error
          ? `Run checkpoint failed: ${error.message}`
          : 'Run checkpoint failed.';
    }
  }

  private resumeRunSnapshot(): void {
    if (!this.runSnapshot) return;
    try {
      const restored = this.runSnapshotCoordinator.restore(this.runSnapshot);
      this.currentSeedLabel = restored.run.seed;
      this.seedEntryInput = restored.run.seed;
      this.currentRun = restored.run;
      this.selectedContract = restored.contract;
      this.runSession = restored.session;
      this.lastRunResult = null;
      this.lastSaveUpdate = null;
      this.summarySaved = false;
      this.snapshotEligible = true;
      this.runSnapshotNotice = null;
      if (restored.snapshot.checkpoint.target === 'gameplay') {
        if (this.runSession.mission.status === 'suspended') {
          const result = this.dispatchCurrentMission({
            id: `${this.runSession.mission.currentStageId}:snapshot-resume:${this.runSession.mission.transitions.length}`,
            type: 'resume'
          });
          if (result.disposition !== 'advanced') {
            throw new Error(result.reason ?? 'Suspended mission could not resume.');
          }
        }
        this.showGameplay();
        return;
      }
      if (restored.snapshot.checkpoint.target === 'operationalMap') {
        const stage = getMissionStage(
          this.getCurrentMissionSchedule(),
          this.runSession.mission.currentStageId
        );
        if (stage.kind === 'branch') {
          this.showMissionBranch();
        } else if (stage.kind === 'relief') {
          this.showMissionRelief();
        } else {
          throw new Error(`Operational-map snapshot points to ${stage.kind}.`);
        }
        return;
      }
      this.showSectorTransition();
    } catch (error) {
      this.runSnapshotCoordinator.clear();
      this.runSnapshot = null;
      this.snapshotEligible = false;
      this.runSnapshotNotice =
        error instanceof Error
          ? `Suspended expedition could not resume and was removed: ${error.message}`
          : 'Suspended expedition could not resume and was removed.';
      this.showMainMenu();
    }
  }

  private discardRunSnapshot(): void {
    this.runSnapshotCoordinator.clear();
    this.runSnapshot = null;
    this.snapshotEligible = false;
    this.runSnapshotNotice = 'Suspended expedition discarded. Permanent progression was unchanged.';
    this.showMainMenu();
  }
}

function createEnvironmentStressDebugLines(
  environmentStress: SceneDebugState['environmentStress']
): readonly string[] {
  if (!environmentStress) {
    return [];
  }

  const hazards =
    environmentStress.hazardLabels.length > 0 ? environmentStress.hazardLabels.join('/') : 'none';

  return [
    `Env stress H${environmentStress.activeHazards}/${environmentStress.hazardBudget} ${hazards} Obj${environmentStress.environmentObjects}/${environmentStress.environmentObjectBudget} D${environmentStress.destructibles}/O${environmentStress.obstacles} Loose ${environmentStress.loosePickups}/${environmentStress.loosePickupCap} V${environmentStress.looseValue}/${environmentStress.looseValueCap} ${
      environmentStress.withinBudget ? 'ok' : 'watch'
    }`
  ];
}

function createActPressureDebugLines(
  actPressure: SceneDebugState['actPressure']
): readonly string[] {
  if (!actPressure) {
    return [];
  }

  return [
    `Act pressure ${actPressure.label} ${actPressure.combined.used}/${actPressure.combined.budget} ${
      actPressure.combined.withinBudget ? 'ok' : 'watch'
    } R${actPressure.routePressure ? 1 : 0} Hz+${actPressure.hazardPressure} Obj+${
      actPressure.environmentObjectTargetBonus
    } Loose+${actPressure.looseCurrencyValueBonus} E${actPressure.enemy.projectiles}/${
      actPressure.enemy.projectileBudget
    } T${actPressure.enemy.telegraphs}/${actPressure.enemy.telegraphBudget} H${
      actPressure.hazard.active
    }/${actPressure.hazard.budget} Z${actPressure.hazard.scheduled}/${
      actPressure.hazard.total
    } Obj${actPressure.environment.objects}/${actPressure.environment.objectBudget} Loose${
      actPressure.pickup.active
    }/${actPressure.pickup.pickupBudget} V${actPressure.pickup.value}/${
      actPressure.pickup.valueBudget
    } Hooks${actPressure.item.hookApplications}/${actPressure.item.hookBudget}`
  ];
}

function createItemDebugLines(items: SceneDebugState['items']): readonly string[] {
  if (!items || items.itemCount === 0) {
    return [];
  }

  const peakHook = items.peakHookName
    ? `${items.peakHookName} ${items.peakHookApplications}/${items.procBudget}`
    : `none 0/${items.procBudget}`;

  return [
    `Items ${items.itemCount} (${items.uniqueItemCount} unique)`,
    `Hooks ${items.activeHookTypes}/${items.totalHookTypes} ${items.hookApplications} apps`,
    `Proc ${peakHook} skip ${items.skippedHookApplications}`,
    items.buildLabel
  ];
}

function createEnemyRoleDebugLines(enemyRoles: SceneDebugState['enemyRoles']): readonly string[] {
  if (!enemyRoles || enemyRoles.totalEnemies === 0) {
    return [];
  }

  const roleSummary = enemyRoles.roleCounts
    .map((roleCount) => `${roleCount.role}:${roleCount.count}`)
    .join(' ');
  const objectiveSummary = enemyRoles.objectivePolicyCounts
    .map((policyCount) => `${policyCount.objectivePolicy}:${policyCount.count}`)
    .join(' ');
  const variantSummary = enemyRoles.variantCounts
    .map((variantCount) => `${variantCount.label}:${variantCount.count}`)
    .join(' ');
  const formationSummary = enemyRoles.formationCounts
    .map((formationCount) => `${formationCount.label}:${formationCount.count}`)
    .join(' ');

  return [
    `Roles ${roleSummary}`,
    `Enemy budget E${enemyRoles.enemyProjectiles}/${enemyRoles.enemyProjectileBudget} T${enemyRoles.telegraphs}/${enemyRoles.telegraphBudget} ${
      enemyRoles.withinStressBudget ? 'ok' : 'over'
    }`,
    `Enemy meta V${enemyRoles.variantCount}${variantSummary ? ` ${variantSummary}` : ''} F${
      enemyRoles.formationCount
    }${formationSummary ? ` ${formationSummary}` : ''}${
      objectiveSummary ? ` ${objectiveSummary}` : ''
    }`
  ];
}

function createProgressionDebugLines(
  progression: SceneDebugState['progression']
): readonly string[] {
  if (!progression) {
    return [];
  }

  const saveParts = [
    progression.salvageBank === undefined ? null : `Bank ${progression.salvageBank}kg`,
    progression.purchasedUpgrades === undefined
      ? null
      : progression.totalUpgrades === undefined
        ? `Upgrades ${progression.purchasedUpgrades}`
        : `Upgrades ${progression.purchasedUpgrades}/${progression.totalUpgrades}`,
    progression.availableUpgrades === undefined ? null : `Ready ${progression.availableUpgrades}`
  ].filter((part): part is string => Boolean(part));
  const runParts = [
    progression.runCredits === undefined ? null : `Credits ${progression.runCredits}`,
    progression.runSalvage === undefined ? null : `Salvage ${progression.runSalvage}`
  ].filter((part): part is string => Boolean(part));

  return [
    ...(saveParts.length > 0 ? [`Progress ${saveParts.join(' ')}`] : []),
    ...(runParts.length > 0 ? [`Run ${runParts.join(' ')}`] : [])
  ];
}

function createSaveFingerprint(saveData: SaveData): string {
  return [
    saveData.unlockedIds.join(','),
    saveData.purchasedUpgradeIds.join(','),
    saveData.achievementIds.join(',')
  ].join('|');
}

function getInitialSeed(ownerWindow: Window): string | null {
  return new URLSearchParams(ownerWindow.location.search).get('seed');
}

function getFirstContract(run: RunSkeleton): StartingContract {
  const contract = run.contracts[0];

  if (!contract) {
    throw new Error('Generated run skeleton did not include any starting contracts.');
  }

  return contract;
}

function isDebugEnabled(ownerWindow: Window): boolean {
  const params = new URLSearchParams(ownerWindow.location.search);

  if (params.get('debug') === '1' || params.get('debug') === 'true') {
    return true;
  }

  try {
    return ownerWindow.localStorage.getItem('starbreak.debug') === '1';
  } catch {
    return false;
  }
}

function loadOrRepairSave(ownerWindow: Window): SaveData {
  const loaded = loadSaveData(ownerWindow.localStorage);

  if (loaded.repaired) {
    writeSaveData(ownerWindow.localStorage, loaded.data);
  }

  return loaded.data;
}

function loadOrRepairSettings(ownerWindow: Window): GameSettings {
  try {
    const loaded = loadSettingsData(ownerWindow.localStorage);

    if (loaded.repaired) {
      writeSettingsData(ownerWindow.localStorage, loaded.data);
    }

    return loaded.data;
  } catch {
    return createDefaultSettings();
  }
}
