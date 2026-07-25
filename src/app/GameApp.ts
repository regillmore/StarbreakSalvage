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
import { DEFAULT_SEED } from '../core/rng';
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
  resolveEngineeringSnapshot,
  type FoundryComponentInstance
} from '../game/Foundry';
import { createShopPrimaryWeaponOffer } from '../game/ComponentOffers';
import {
  createRunActSaveContext,
  getActBoundaryHandoffAfterSector,
  getFrontierChoiceHandoff,
  getInterActTransitionHandoff,
  shouldOfferSectorCompletionReward,
  type RunActPlan
} from '../game/ActPlan';
import { createActEconomyProfile } from '../game/ActEconomy';
import { getNextActRouteSectorIndices } from '../game/ActRouteGraph';
import {
  createActTwoDebugScenario,
  createDebugRouteHistoryBeforeSector,
  createTwoActDebugSummaryResult
} from '../game/ActTwoDebug';
import { createInterActJunctionChoices } from '../game/InterActJunction';
import { resolveSeedEntry } from '../game/SeedEntry';
import {
  addCredits,
  addItemToSession,
  aggregateCombatRunResults,
  advanceSector,
  applyCarrierCommand,
  applyFleetCommand,
  applyFrontierDecision,
  applyInterActChoice,
  applyRouteOutcome,
  createRunSession,
  dispatchMissionEvent,
  getCombatModifiersForSector,
  getCurrentSector,
  getEffectiveShipStats,
  getShipHullReadModel,
  getRouteCreditReward,
  getShopRerollCount,
  hasInterActChoiceForSourceAct,
  incrementShopRerollCount,
  recordSectorCombatResult,
  recordMissionObjectiveOutcome,
  recordMissionOperationBoundary,
  recordBoardingOperationOutcome,
  recordFactionCampaignEvent,
  recordCrewRosterEvent,
  recordCrewArcEvent,
  recordFleetCombatOutcomes,
  recordApexHuntEvent,
  chooseCrewArcOption,
  recordRunSessionTimelineEvent,
  recordExpeditionBranchDecision,
  resetMissionForCurrentSector,
  repairShipHull,
  spendCredits,
  stowCarrierCargo,
  type RunSessionState
} from '../game/RunSession';
import { depleteShopStockItem, getAvailableShopStockItem } from '../game/ShopStock';
import { getSaveRecordSectorCount } from '../game/RunOutcome';
import { getActiveFittedItems } from '../game/ItemSockets';
import { createExpeditionDebugState, createExpeditionPathReadModel } from '../game/ExpeditionGraph';
import {
  createMissionCombatProjection,
  createMissionDebugState,
  createMissionReadModel,
  createMissionSchedule,
  getMissionBranchOptions,
  getMissionStage,
  type MissionEvent,
  type MissionTransitionResult
} from '../game/MissionDirector';
import { generateRouteOutcome, type AppliedRouteOutcome } from '../game/RouteEvents';
import { createSectorConditionPlan } from '../game/SectorConditions';
import { getSecondActFinaleSectorIndex } from '../game/SecondActFinale';
import { getShopHullRepairCost, getShopRerollCost } from '../game/Shops';
import { AudioSystem } from '../systems/AudioSystem';
import { getFeedbackShakeIntensity, type CombatFeedbackCue } from '../systems/CombatFeedback';
import { InputSystem, type InputAction } from '../systems/InputSystem';
import { ContractSelectScene } from '../ui/ContractSelectScene';
import { GameplayScene } from '../ui/GameplayScene';
import { InterActJunctionScene } from '../ui/InterActJunctionScene';
import { FrontierGateScene } from '../ui/FrontierGateScene';
import { MainMenuScene } from '../ui/MainMenuScene';
import { PauseScene } from '../ui/PauseScene';
import { RewardScene } from '../ui/RewardScene';
import { RouteEventScene } from '../ui/RouteEventScene';
import { RunSummaryScene } from '../ui/RunSummaryScene';
import { SettingsScene } from '../ui/SettingsScene';
import { SectorTransitionScene } from '../ui/SectorTransitionScene';
import { ShopScene } from '../ui/ShopScene';
import { UnlockArchiveScene } from '../ui/UnlockArchiveScene';
import type { ItemId } from '../content/items';
import type { UpgradeId } from '../content/upgrades';
import { UPGRADES } from '../content/upgrades';
import { UNLOCKS } from '../content/unlocks';
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
import { createCrewArcCombatInfluence } from '../game/CrewArc';
import {
  MAX_COMBINED_ALLIES,
  createFleetCombatProfile,
  createFleetInfluence
} from '../game/Fleetcraft';
import type { ScenarioLabId } from '../game/ScenarioLab';
import {
  RunSnapshotCoordinator,
  createRunSnapshotSummary,
  type RunSnapshotV12
} from '../game/RunSnapshot';
import { getOperationalInfluence } from '../game/OperationalMap';
import { createCarrierInfluence } from '../game/CarrierCommand';
import { getBoardingOperationForNode } from '../game/BoardingOperation';
import {
  createFactionFrontCampaignReadModel,
  createFactionFrontInfluence,
  projectFactionFrontBranchOptions
} from '../game/FactionFront';
import {
  createApexFinaleProfile,
  getApexEncounterForNode,
  getResolvedApexUnlockIds,
  type ApexFinaleContext,
  type ApexFinaleProfile
} from '../game/ApexHunt';
import type { ApexOutcome } from '../content/apexThreats';

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
  private scenarioLabSession = false;
  private runSnapshot: RunSnapshotV12 | null = null;
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
    const initialSeed = initialSeedInput.trim() ? resolveSeedEntry(initialSeedInput) : null;
    this.seedEntryInput = initialSeed?.source === 'random' ? '' : initialSeedInput;
    this.currentSeedLabel = initialSeed?.seed ?? DEFAULT_SEED;
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
        this.saveData.lastRun?.seed ?? null,
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
    const [{ SCENARIO_LAB_IDS, createScenarioLabLaunch }, { ScenarioTimelineScene }] =
      await Promise.all([
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
    this.scenarioLabSession = true;
    this.lastRunResult = null;
    this.lastSaveUpdate = null;
    this.summarySaved = false;

    if (launch.definition.target === 'transition') {
      this.showSectorTransition();
      return;
    }
    if (launch.definition.target === 'reward') {
      this.showReward();
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
    if (launch.definition.target === 'crewQuarters') {
      void this.showCrewQuarters(() => void this.showScenarioLab());
      return;
    }
    if (launch.definition.target === 'fleetBay') {
      void this.showFleetBay(() => void this.showScenarioLab());
      return;
    }
    if (launch.definition.target === 'apexDossier') {
      const awaiting = launch.session.apexHunts.threats.find(
        (threat) => threat.status === 'awaitingResolution'
      );
      const profile = awaiting
        ? createApexFinaleProfile({
            plan: this.currentRun.apexHunts,
            state: launch.session.apexHunts,
            threatId: awaiting.threatId,
            context: this.createApexFinaleContext()
          })
        : null;
      void this.showApexDossier(profile, null, () => void this.showScenarioLab());
      return;
    }
    if (launch.definition.target === 'carrierDeck') {
      void this.showCommandDeck(this.getCurrentMissionSchedule());
      return;
    }
    if (launch.definition.target === 'frontierGate') {
      const sourceAct = this.currentRun.acts.find((act) => act.id === 'act_core_descent');
      const targetAct = this.currentRun.acts.find((act) => act.id === 'act_null_frontier');
      if (!sourceAct || !targetAct) throw new Error('Frontier Scenario Lab acts are unavailable.');
      this.lastRunResult = {
        ...createTwoActDebugSummaryResult(this.currentRun),
        reason: 'sectorComplete'
      };
      this.showFrontierGate(sourceAct, targetAct);
      return;
    }
    if (launch.definition.target === 'releaseAudit') {
      const [{ VoyageReleaseAuditScene }, { createVoyageReleaseAudit }] = await Promise.all([
        import('../ui/VoyageReleaseAuditScene'),
        import('../game/VoyageReleaseAudit')
      ]);
      this.sceneManager.switchTo(
        new VoyageReleaseAuditScene(
          this.uiRoot,
          launch.definition,
          launch.readout,
          createVoyageReleaseAudit(
            generateRunSkeleton(this.currentRun.seed, {
              unlockedIds: [],
              purchasedUpgradeIds: []
            }),
            generateRunSkeleton(this.currentRun.seed, {
              unlockedIds: UNLOCKS.map((unlock) => unlock.id),
              purchasedUpgradeIds: UPGRADES.map((upgrade) => upgrade.id)
            })
          ),
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
          launch.session.itemInstances,
          launch.session.currentSectorIndex + 1,
          (engineering, itemInstances, salvageGained) => {
            this.runSession.engineering = engineering;
            this.runSession.itemInstances = [...itemInstances];
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
    gameplayScene.prepareScenarioLabPreset(
      launch.definition.gameplayPreset,
      SCENARIO_LAB_IDS.length
    );
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
    this.seedEntryInput = seed.source === 'random' ? '' : seedInput;
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
    const operationNode = stage.nodeId
      ? (this.currentRun.expedition.nodes.find((node) => node.id === stage.nodeId) ?? null)
      : null;
    const boardingOperation = operationNode
      ? getBoardingOperationForNode(this.currentRun.boardingCampaign, operationNode)
      : null;
    const apexEncounter = operationNode
      ? getApexEncounterForNode(
          this.currentRun.apexHunts,
          this.runSession.apexHunts,
          operationNode
        )
      : null;
    const apexThreat = apexEncounter
      ? this.runSession.apexHunts.threats.find(
          (threat) => threat.threatId === apexEncounter.threatId
        )
      : null;
    const apexProfile =
      apexEncounter && apexThreat?.status !== 'resolved' && apexThreat?.status !== 'escaped'
        ? createApexFinaleProfile({
            plan: this.currentRun.apexHunts,
            state: this.runSession.apexHunts,
            threatId: apexEncounter.threatId,
            context: this.createApexFinaleContext()
          })
        : null;
    const projection = createMissionCombatProjection(
      schedule,
      this.runSession.mission,
      sector,
      getOperationalInfluence(
        this.runSession.operational,
        this.runSession.currentSectorIndex,
        stage.operationalRole
      ),
      boardingOperation
    );
    let campaignInfluence = getFactionCampaignInfluence(
      this.currentRun.factionCampaign,
      this.runSession.factionCampaign,
      sector,
      { plan: this.currentRun.factionFronts, state: this.runSession.factionFronts }
    );
    if (
      !stage.optional &&
      campaignInfluence.rival &&
      campaignInfluence.rival.status !== 'engaged'
    ) {
      recordFactionCampaignEvent(
        this.runSession,
        this.currentRun.factionCampaign,
        {
          id: `${stage.id}:rival-encounter:${campaignInfluence.rival.id}`,
          type: 'rivalEncounter',
          sectorIndex: this.runSession.currentSectorIndex,
          factionId: campaignInfluence.rival.factionId,
          rivalId: campaignInfluence.rival.id
        },
        this.currentRun.factionFronts
      );
      campaignInfluence = getFactionCampaignInfluence(
        this.currentRun.factionCampaign,
        this.runSession.factionCampaign,
        sector,
        { plan: this.currentRun.factionFronts, state: this.runSession.factionFronts }
      );
    }
    const campaignModifier = createFactionCampaignCombatModifier(
      campaignInfluence,
      this.runSession.currentSectorIndex
    );
    const resolvedLoadout =
      resolveEngineeringSnapshot(this.runSession.engineering.committed).loadout ??
      this.selectedContract.loadout;
    const fleetInfluence = createFleetInfluence(this.currentRun.fleet, this.runSession.fleet);
    const fleetAssignedCrewIds = fleetInfluence.assignedCrewIds;
    const crewProfile = createCrewCombatProfile(
      this.currentRun.crewRoster,
      this.runSession.crewRoster,
      resolvedLoadout,
      {
        excludedCandidateIds: [
          ...this.runSession.carrier.facilities
            .map((facility) => facility.assignedCrewId)
            .filter((candidateId): candidateId is string => candidateId !== null),
          ...fleetAssignedCrewIds
        ],
        arcInfluence: createCrewArcCombatInfluence(
          this.currentRun.crewArcs,
          this.runSession.crewArcs,
          this.runSession.crewRoster
        )
      }
    );
    const carrierInfluence = createCarrierInfluence(
      this.currentRun.carrierPlan,
      this.runSession.carrier
    );
    const fleetProfile = createFleetCombatProfile({
      plan: this.currentRun.fleet,
      state: this.runSession.fleet,
      berthCapacity: carrierInfluence.supportCapacity,
      allySlotsAvailable: MAX_COMBINED_ALLIES - crewProfile.members.length
    });

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
        routeOutcomes: this.runSession.routeOutcomes,
        factionFront: campaignInfluence.front
      }),
      this.runSession.currentSectorIndex,
      this.runSession.expedition,
      getActiveFittedItems(this.runSession.itemInstances, this.runSession.engineering.committed),
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
      this.runSession.timeline,
      this.runSession.factionFronts,
      fleetProfile,
      this.runSession.fleet,
      apexEncounter,
      apexProfile,
      this.runSession.apexHunts
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
      case 'debugFrontierGate':
        this.showDebugFrontierGate();
        return true;
      case 'debugCarrierDeck':
        this.showDebugCarrierDeck();
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
    this.scenarioLabSession = false;
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

    this.runSession.currentSectorIndex = scenario.actOneFinalSectorIndex;
    resetMissionForCurrentSector(this.currentRun, this.runSession);
    const schedule = this.getCurrentMissionSchedule();
    if (!schedule.extractionStageId) {
      throw new Error('Act I finale debug fixture has no extraction stage.');
    }
    this.runSession.mission = {
      ...this.runSession.mission,
      currentStageId: schedule.extractionStageId,
      visitedStageIds: [schedule.startStageId, schedule.extractionStageId]
    };
    this.runSession.distanceTraveled = scenario.distanceBeforeActTwo;
    this.runSession.credits = Math.max(this.runSession.credits, 32);
    this.runSession.salvage = Math.max(this.runSession.salvage, 8);
    this.showRouteChoice();
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
    this.runSession.routeHistory = createDebugRouteHistoryBeforeSector(
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
    this.runSession.currentSectorIndex =
      this.currentRun.actRouteGraph.nodes.find(
        (node) => node.actId === 'act_core_descent' && node.layerIndex === 1 && node.laneIndex === 0
      )?.sectorIndex ?? 0;
    resetMissionForCurrentSector(this.currentRun, this.runSession);
    this.runSession.credits = Math.max(this.runSession.credits, 36);
    this.runSession.salvage = Math.max(this.runSession.salvage, 8);
    this.applyDefaultDebugInterActChoice();
    this.showSectorTransition();
  }

  private showDebugMissionOptional(): void {
    this.resetDebugRunState();
    this.runSession.currentSectorIndex =
      this.currentRun.actRouteGraph.nodes.find(
        (node) => node.actId === 'act_outer_rim' && node.layerIndex === 2 && node.laneIndex === 1
      )?.sectorIndex ?? 0;
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
    let stage = getMissionStage(
      this.getCurrentMissionSchedule(),
      this.runSession.mission.currentStageId
    );
    if (stage.kind === 'relief') {
      this.dispatchCurrentMission({
        id: `${stage.id}:debug-staging`,
        type: 'completeRelief'
      });
    }
    stage = getMissionStage(
      this.getCurrentMissionSchedule(),
      this.runSession.mission.currentStageId
    );
    if (stage.operationalRole === 'gate') {
      this.dispatchCurrentMission({
        id: `${stage.id}:debug-gate-complete`,
        type: 'completeCombat',
        checkpoint: {
          hull: getEffectiveShipStats(this.selectedContract, this.runSession).maxHull,
          scrollDistance: 1_800,
          worldOffset: 11_800,
          credits: this.runSession.credits,
          salvage: this.runSession.salvage
        }
      });
    }
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
    const encounterFactionId = createFactionFrontInfluence(
      this.currentRun.factionFronts,
      this.runSession.factionFronts,
      sectorIndex
    ).ownerFactionId;
    const isOptionalStage = completedStage.optional;
    const objectiveOutcome = result.missionObjective?.outcome;
    const campaignOutcome =
      objectiveOutcome === 'failure'
        ? 'failure'
        : objectiveOutcome === 'partialSuccess'
          ? 'partialSuccess'
          : 'success';
    const operationNode = completedStage.nodeId
      ? (this.currentRun.expedition.nodes.find((node) => node.id === completedStage.nodeId) ?? null)
      : null;
    const apexEncounter = operationNode
      ? getApexEncounterForNode(
          this.currentRun.apexHunts,
          this.runSession.apexHunts,
          operationNode
        )
      : null;
    if (apexEncounter?.stage === 'finale' && result.bossesDefeated > 0) {
      const apexThreat = this.runSession.apexHunts.threats.find(
        (threat) => threat.threatId === apexEncounter.threatId
      );
      if (apexThreat?.status !== 'awaitingResolution' && apexThreat?.status !== 'resolved') {
        recordApexHuntEvent(this.currentRun, this.runSession, {
          id: `${stageId}:apex-finale`,
          type: 'encounterOutcome',
          threatId: apexEncounter.threatId,
          encounterId: apexEncounter.id,
          stage: apexEncounter.stage,
          sectorIndex,
          outcome: campaignOutcome
        });
      }
      const updatedThreat = this.runSession.apexHunts.threats.find(
        (threat) => threat.threatId === apexEncounter.threatId
      );
      if (updatedThreat?.status === 'awaitingResolution') {
        const profile = createApexFinaleProfile({
          plan: this.currentRun.apexHunts,
          state: this.runSession.apexHunts,
          threatId: apexEncounter.threatId,
          context: this.createApexFinaleContext()
        });
        void this.showApexDossier(profile, (outcome) => {
          recordApexHuntEvent(this.currentRun, this.runSession, {
            id: `${stageId}:apex-resolution:${outcome}`,
            type: 'resolve',
            threatId: apexEncounter.threatId,
            sectorIndex,
            outcome
          });
          this.handleMissionCombatComplete(result);
        });
        return;
      }
    }

    if (completedStage.operationalRole === 'gate' && schedule.contract) {
      recordFactionCampaignEvent(
        this.runSession,
        this.currentRun.factionCampaign,
        {
          id: `${stageId}:campaign-contract`,
          type: 'contractCompleted',
          sectorIndex,
          factionId: encounterFactionId,
          contractId: schedule.contract.id
        },
        this.currentRun.factionFronts
      );
      recordFactionCampaignEvent(
        this.runSession,
        this.currentRun.factionCampaign,
        {
          id: `${stageId}:campaign-outcome`,
          type: 'missionOutcome',
          sectorIndex,
          factionId: encounterFactionId,
          contractId: schedule.contract.id,
          outcome: campaignOutcome
        },
        this.currentRun.factionFronts
      );
    }

    const combatRival = result.rivalEncounter;
    const unresolvedRival = getEngagedRivalForSector(
      this.currentRun.factionCampaign,
      this.runSession.factionCampaign,
      sectorIndex
    );
    if (combatRival || unresolvedRival) {
      const rivalId = combatRival?.rivalId ?? unresolvedRival!.id;
      recordFactionCampaignEvent(
        this.runSession,
        this.currentRun.factionCampaign,
        {
          id: `${stageId}:rival-outcome:${rivalId}`,
          type: 'rivalOutcome',
          sectorIndex,
          factionId: combatRival?.rivalId
            ? (this.currentRun.factionCampaign.rivals.find(
                (candidate) => candidate.id === combatRival.rivalId
              )?.factionId ?? encounterFactionId)
            : unresolvedRival!.factionId,
          rivalId,
          outcome: combatRival?.outcome ?? 'escaped'
        },
        this.currentRun.factionFronts
      );
    }

    if (isOptionalStage && campaignOutcome === 'success') {
      const capturable = getCapturableRivalForSector(
        this.currentRun.factionCampaign,
        this.runSession.factionCampaign,
        sectorIndex
      );
      if (capturable) {
        recordFactionCampaignEvent(
          this.runSession,
          this.currentRun.factionCampaign,
          {
            id: `${stageId}:rival-captured:${capturable.id}`,
            type: 'rivalOutcome',
            sectorIndex,
            factionId: capturable.factionId,
            rivalId: capturable.id,
            outcome: 'captured'
          },
          this.currentRun.factionFronts
        );
      }
    }

    for (const member of result.crew?.members ?? []) {
      recordCrewRosterEvent(
        this.runSession,
        this.currentRun.crewRoster,
        {
          id: `${stageId}:crew-combat:${member.candidateId}`,
          type: 'combatOutcome',
          sectorIndex,
          candidateId: member.candidateId,
          injured: member.injured,
          retreated: member.retreated,
          enemiesDefeated: member.enemiesDefeated,
          salvageRecovered: member.salvageRecovered
        },
        this.currentRun.factionFronts
      );
      if (member.injured) {
        recordCrewArcEvent(this.currentRun, this.runSession, {
          id: `${stageId}:crew-arc-injury:${member.candidateId}`,
          source: 'injury',
          sectorIndex,
          candidateIds: [member.candidateId],
          positive: false,
          detail: `${member.candidateId} returned injured`
        });
      }
    }
    if (result.fleet && result.fleet.craft.length > 0) {
      recordFleetCombatOutcomes(
        this.currentRun,
        this.runSession,
        result.fleet.craft,
        `${stageId}:fleet-combat`
      );
    }

    const boardingOperation = operationNode
      ? getBoardingOperationForNode(this.currentRun.boardingCampaign, operationNode)
      : null;
    const crewPolicy = boardingOperation?.integrations.includes('crew')
      ? 'protectSpecialist'
      : (schedule.contract?.crewPolicy ?? 'none');
    recordCrewRosterEvent(
      this.runSession,
      this.currentRun.crewRoster,
      {
        id: `${stageId}:crew-mission-outcome`,
        type: 'missionOutcome',
        sectorIndex,
        outcome: campaignOutcome,
        crewPolicy
      },
      this.currentRun.factionFronts
    );
    const activeCrewIds = this.runSession.crewRoster.members
      .filter((member) => member.status === 'active' || member.status === 'injured')
      .map((member) => member.candidateId);
    recordCrewArcEvent(this.currentRun, this.runSession, {
      id: `${stageId}:crew-arc-mission`,
      source: 'mission',
      sectorIndex,
      candidateIds: activeCrewIds,
      positive: campaignOutcome !== 'failure',
      detail: `${completedStage.label} ${campaignOutcome}`
    });
    recordCrewArcEvent(this.currentRun, this.runSession, {
      id: `${stageId}:crew-arc-faction`,
      source: 'faction',
      sectorIndex,
      candidateIds: activeCrewIds,
      positive: campaignOutcome !== 'failure',
      detail: `${encounterFactionId} front contact`
    });
    if (combatRival || unresolvedRival) {
      recordCrewArcEvent(this.currentRun, this.runSession, {
        id: `${stageId}:crew-arc-rival`,
        source: 'rival',
        sectorIndex,
        candidateIds: activeCrewIds,
        positive: combatRival?.outcome === 'destroyed',
        detail: `rival ${combatRival?.outcome ?? 'escaped'}`
      });
    }
    if ((result.crew?.issuedCommands ?? 0) > 0) {
      recordCrewArcEvent(this.currentRun, this.runSession, {
        id: `${stageId}:crew-arc-command`,
        source: 'command',
        sectorIndex,
        candidateIds: result.crew?.members.map((member) => member.candidateId) ?? [],
        positive: campaignOutcome !== 'failure',
        detail: `${result.crew?.command ?? 'formation'} command`
      });
    }
    const campaignInfluence = getFactionCampaignInfluence(
      this.currentRun.factionCampaign,
      this.runSession.factionCampaign,
      sector,
      { plan: this.currentRun.factionFronts, state: this.runSession.factionFronts }
    );
    const commandHeadroom = createEngineeringCombatProfile(this.runSession.engineering).resources
      .commandHeadroom;
    const candidate =
      campaignOutcome !== 'failure'
        ? getRecruitableCrewCandidate(this.currentRun.crewRoster, this.runSession.crewRoster, {
            sectorIndex,
            crewPolicy: isOptionalStage && !boardingOperation ? 'none' : crewPolicy,
            factionId: encounterFactionId,
            factionSignal: Boolean(campaignInfluence.crewOfferSignal) && isOptionalStage,
            commandHeadroom
          })
        : null;
    if (candidate) {
      const recruitment = recordCrewRosterEvent(
        this.runSession,
        this.currentRun.crewRoster,
        {
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
        },
        this.currentRun.factionFronts
      );
      if (recruitment.disposition === 'applied') {
        recordCrewArcEvent(this.currentRun, this.runSession, {
          id: `${stageId}:crew-arc-rescue:${candidate.id}`,
          source: 'rescue',
          sectorIndex,
          candidateIds: [candidate.id],
          positive: true,
          detail: `${candidate.callsign} joined the voyage`
        });
        recordFactionCampaignEvent(
          this.runSession,
          this.currentRun.factionCampaign,
          {
            id: `${stageId}:crew-faction-aid:${candidate.id}`,
            type: 'aid',
            sectorIndex,
            factionId: candidate.factionId,
            amount: 1,
            reason: `rescued ${candidate.callsign}`
          },
          this.currentRun.factionFronts
        );
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
    if (operationNode) {
      const boundary = recordMissionOperationBoundary(this.runSession, {
        id: `${stageId}:settled`,
        node: operationNode,
        outcome: campaignOutcome,
        checkpoint: operationCheckpoint
      });
      const fleetInfluence = createFleetInfluence(this.currentRun.fleet, this.runSession.fleet);
      const fleetSalvage =
        boundary.disposition === 'applied' &&
        operationNode.optional &&
        campaignOutcome !== 'failure'
          ? Math.min(
              3,
              fleetInfluence.optionalSalvageBonus +
                Number(operationNode.operationalRole === 'pursuit') * fleetInfluence.pursuitControl
            )
          : 0;
      if (fleetSalvage > 0) {
        this.runSession.salvage += fleetSalvage;
        recordRunSessionTimelineEvent(this.runSession, {
          id: `${stageId}:fleet-itinerary`,
          category: 'economy',
          kind: 'fleet:itinerary',
          sectorIndex,
          value: fleetSalvage,
          subjectId: operationNode.id,
          detailId: `${fleetInfluence.optionalSalvageBonus} skiff/${fleetInfluence.pursuitControl} pursuit`
        });
      }
    }
    if (apexEncounter?.stage !== 'finale' && apexEncounter) {
      recordApexHuntEvent(this.currentRun, this.runSession, {
        id: `${stageId}:apex-${apexEncounter.stage}`,
        type: 'encounterOutcome',
        threatId: apexEncounter.threatId,
        encounterId: apexEncounter.id,
        stage: apexEncounter.stage,
        sectorIndex,
        outcome: campaignOutcome
      });
    }
    if (boardingOperation) {
      recordBoardingOperationOutcome(this.currentRun, this.runSession, boardingOperation, {
        eventId: `${stageId}:boarding-settled`,
        outcome: campaignOutcome,
        completionRatio:
          result.missionObjective?.completionRatio ?? (campaignOutcome === 'success' ? 1 : 0),
        retreated: result.reason === 'abandoned'
      });
    }
    const nextStage = getMissionStage(
      this.getCurrentMissionSchedule(),
      this.runSession.mission.currentStageId
    );

    if (nextStage.kind === 'branch') {
      if (
        !completedStage.optional &&
        completedStage.operationalRole === 'gate' &&
        nextStage.id === schedule.branchStageId &&
        shouldOfferSectorCompletionReward(this.currentRun.acts, this.runSession.currentSectorIndex)
      ) {
        this.showReward();
      } else {
        this.showMissionBranch();
      }
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
    if (stage.kind === 'branch') {
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
    }
    if (stage.kind !== 'relief' || stage.operationalRole !== 'staging') {
      throw new Error('Debug gate setup could not reach the staging checkpoint.');
    }
    this.dispatchCurrentMission({
      id: `${stage.id}:debug-staging`,
      type: 'completeRelief'
    });
  }

  private handleMissionFailure(result: CombatRunResult): void {
    const schedule = this.getCurrentMissionSchedule();
    const stage = getMissionStage(schedule, this.runSession.mission.currentStageId);
    const node = stage.nodeId
      ? (this.currentRun.expedition.nodes.find((candidate) => candidate.id === stage.nodeId) ??
        null)
      : null;
    const boardingOperation = node
      ? getBoardingOperationForNode(this.currentRun.boardingCampaign, node)
      : null;
    const apexEncounter = node
      ? getApexEncounterForNode(
          this.currentRun.apexHunts,
          this.runSession.apexHunts,
          node
        )
      : null;
    if (apexEncounter) {
      recordApexHuntEvent(this.currentRun, this.runSession, {
        id: `${stage.id}:apex-failed:${result.reason}`,
        type: 'encounterOutcome',
        threatId: apexEncounter.threatId,
        encounterId: apexEncounter.id,
        stage: apexEncounter.stage,
        sectorIndex: this.runSession.currentSectorIndex,
        outcome: 'failure'
      });
    }
    if (boardingOperation) {
      recordBoardingOperationOutcome(this.currentRun, this.runSession, boardingOperation, {
        eventId: `${stage.id}:boarding-failed:${result.reason}`,
        outcome: 'failure',
        completionRatio: result.missionObjective?.completionRatio ?? 0,
        retreated: result.reason === 'abandoned'
      });
    }
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
    if (branchStage.id !== schedule.branchStageId) {
      const direct = currentBranch.options.find((option) => option.default);
      if (!direct) throw new Error(`Legacy branch ${currentBranch.id} has no safe continuation.`);
      const result = this.dispatchCurrentMission({
        id: `${branchStage.id}:compatibility-direct:${direct.id}`,
        type: 'selectBranch',
        optionId: direct.id
      });
      if (result.disposition === 'advanced') {
        recordExpeditionBranchDecision(
          this.currentRun,
          this.runSession,
          currentBranch.id,
          direct.id
        );
        this.showMissionRelief();
      }
      return;
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
      sector,
      { plan: this.currentRun.factionFronts, state: this.runSession.factionFronts }
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
    const frontInfluence = createFactionFrontInfluence(
      this.currentRun.factionFronts,
      this.runSession.factionFronts,
      this.runSession.currentSectorIndex
    );
    const conditionEligibleOptions = getMissionBranchOptions(schedule, this.runSession.mission);
    const optionalSource = currentBranch.options.find((option) => !option.default) ?? null;
    const missionOptions = conditionEligibleOptions.map(
      (option) =>
        projectFactionFrontBranchOptions(
          [option],
          this.currentRun.expedition.nodes,
          frontInfluence
        )[0] ?? option
    );
    const direct = missionOptions.find((option) => option.default);
    const optional = missionOptions.find((option) => !option.default) ?? optionalSource;
    if (!direct || !optional) {
      throw new Error(`Post-sector branch ${currentBranch.id} is incomplete.`);
    }
    const optionalAvailable = missionOptions.some((option) => option.id === optional.id);
    const optionalUnavailableReason = optionalAvailable
      ? null
      : 'The paired challenge could not be projected for this sector.';
    const commitOption = (optionId: string) => {
      const option = currentBranch.options.find((candidate) => candidate.id === optionId);
      if (!option) return null;
      const result = this.dispatchCurrentMission({
        id: `${this.runSession.mission.currentStageId}:branch:${option.id}`,
        type: 'selectBranch',
        optionId: option.id
      });

      if (result.disposition !== 'advanced') return null;

      if (capturableRival && option.default) {
        recordFactionCampaignEvent(
          this.runSession,
          this.currentRun.factionCampaign,
          {
            id: `${currentBranch.id}:${option.id}:spared:${capturableRival.id}`,
            type: 'targetSpared',
            sectorIndex: this.runSession.currentSectorIndex,
            factionId: capturableRival.factionId,
            rivalId: capturableRival.id
          },
          this.currentRun.factionFronts
        );
      }

      recordExpeditionBranchDecision(this.currentRun, this.runSession, currentBranch.id, option.id);
      return getMissionStage(schedule, this.runSession.mission.currentStageId);
    };
    const chooseOption = (optionId: string) => {
      const stage = commitOption(optionId);
      if (!stage) return;
      if (stage.kind === 'combat') {
        this.showGameplay();
      } else if (stage.kind === 'relief') {
        this.showMissionRelief();
      } else if (stage.kind === 'extraction') {
        this.showRouteChoice();
      }
    };
    const chooseRoute = (targetSectorIndex: number, route: RouteOption) => {
      let stage = commitOption(direct.id);
      if (!stage) return;
      if (stage.kind === 'relief') {
        const result = this.dispatchCurrentMission({
          id: `${stage.id}:relief-complete`,
          type: 'completeRelief'
        });
        if (result.disposition !== 'advanced') return;
        stage = getMissionStage(schedule, this.runSession.mission.currentStageId);
      }
      if (stage.kind !== 'extraction') {
        throw new Error(`Post-sector route advanced to unexpected mission stage ${stage.kind}.`);
      }
      this.handleRouteChoice(targetSectorIndex, route);
    };
    if (
      getActBoundaryHandoffAfterSector(this.currentRun.acts, this.runSession.currentSectorIndex)
    ) {
      chooseOption(direct.id);
      return;
    }
    const sourceSectorIndex = this.runSession.currentSectorIndex;
    const targetSectorIndices = getNextActRouteSectorIndices(
      this.currentRun.actRouteGraph,
      sourceSectorIndex
    );
    this.sceneManager.switchTo(
      new SectorTransitionScene(
        this.uiRoot,
        this.currentRun,
        this.runSession,
        this.selectedContract,
        () => {},
        createMissionReadModel(schedule, this.runSession.mission),
        createMissionDebugState(schedule, this.runSession.mission),
        () => void this.showCrewQuarters(),
        () => void this.showFleetBay(() => this.showSectorTransition(), 'Return to Navigation'),
        () => void this.showApexDossier(),
        () => this.showNavigationShop(),
        () => this.showNavigationFoundry(),
        {},
        {
          optional: {
            id: optional.id,
            label: optional.label,
            summary: [
              optional.summary,
              capturableRival
                ? `Success can capture ${capturableRival.shipName}; continuing leaves ${capturableRival.name} in circulation.`
                : null,
              crewCandidate
                ? `${crewCandidate.callsign} and ${crewCandidate.wingName} are inside the optional signal.`
                : null
            ]
              .filter((copy): copy is string => Boolean(copy))
              .join(' '),
            available: optionalAvailable,
            unavailableReason: optionalUnavailableReason
          },
          onward: {
            id: direct.id,
            label: direct.label,
            summary: direct.summary,
            available: true,
            unavailableReason: null,
            nextSectorIndices: targetSectorIndices
          },
          onChoose: chooseOption
        },
        {
          sourceSectorIndex,
          targetSectorIndices,
          onChoose: chooseRoute
        },
        () => this.suspendAtConstellation('sectorTransition', `Suspended at ${branchStage.label}`)
      )
    );
    this.checkpointRun('sectorTransition', `${branchStage.label} checkpoint`);
  }

  private showMissionRelief(): void {
    const schedule = this.getCurrentMissionSchedule();
    const stage = getMissionStage(schedule, this.runSession.mission.currentStageId);
    if (stage.operationalRole === 'staging') {
      void this.showCommandDeck(schedule);
      return;
    }

    const result = this.dispatchCurrentMission({
      id: `${stage.id}:relief-complete`,
      type: 'completeRelief'
    });
    if (result.disposition !== 'advanced') return;

    const nextStage = getMissionStage(schedule, this.runSession.mission.currentStageId);
    if (nextStage.kind === 'combat') {
      this.showGameplay();
    } else if (nextStage.kind === 'extraction') {
      this.showRouteChoice();
    } else {
      throw new Error(`Relief advanced to unexpected mission stage ${nextStage.kind}.`);
    }
  }

  private async showCommandDeck(schedule = this.getCurrentMissionSchedule()): Promise<void> {
    const { CommandDeckScene } = await import('../ui/CommandDeckScene');
    const continueRelief = () => {
      const result = this.dispatchCurrentMission({
        id: `${this.runSession.mission.currentStageId}:relief-complete`,
        type: 'completeRelief'
      });
      if (result.disposition !== 'advanced') return;
      const nextStage = getMissionStage(schedule, this.runSession.mission.currentStageId);
      if (nextStage.kind === 'combat') this.showGameplay();
      else if (nextStage.kind === 'extraction') this.showRouteChoice();
    };
    this.sceneManager.switchTo(
      new CommandDeckScene(
        this.uiRoot,
        this.currentRun.carrierPlan,
        this.runSession.carrier,
        this.currentRun.crewRoster,
        this.runSession.crewRoster,
        this.selectedContract,
        this.runSession.currentSectorIndex,
        this.runSession.credits,
        this.runSession.salvage,
        (option) => {
          const result = applyCarrierCommand(
            this.currentRun,
            this.runSession,
            option.command,
            `carrier-command:${this.runSession.currentSectorIndex}:${option.id}`
          );
          if (result.disposition === 'applied') void this.showCommandDeck(schedule);
        },
        continueRelief,
        () => void this.showFleetBay(() => void this.showCommandDeck(schedule))
      )
    );
    this.checkpointRun(
      'operationalMap',
      `${this.currentRun.carrierPlan.name} command deck checkpoint`
    );
  }

  private async showFleetBay(
    onBack: () => void,
    backLabel = 'Return To Command Deck'
  ): Promise<void> {
    const { FleetBayScene } = await import('../ui/FleetBayScene');
    this.sceneManager.switchTo(
      new FleetBayScene(
        this.uiRoot,
        this.currentRun.fleet,
        this.runSession.fleet,
        this.currentRun.carrierPlan,
        this.runSession.carrier,
        this.runSession.crewRoster,
        this.runSession.engineering,
        this.selectedContract,
        this.runSession.currentSectorIndex,
        this.runSession.salvage,
        (option) => {
          const result = applyFleetCommand(
            this.currentRun,
            this.runSession,
            option.command,
            `fleet-command:${this.runSession.currentSectorIndex}:${option.id}`
          );
          if (result.disposition === 'applied') void this.showFleetBay(onBack, backLabel);
        },
        onBack,
        backLabel
      )
    );
  }

  private showRouteChoice(): void {
    if (
      getActBoundaryHandoffAfterSector(this.currentRun.acts, this.runSession.currentSectorIndex)
    ) {
      this.advanceAfterSectorExtraction();
      return;
    }
    const schedule = this.getCurrentMissionSchedule();
    const sourceSectorIndex = this.runSession.currentSectorIndex;
    const targetSectorIndices = getNextActRouteSectorIndices(
      this.currentRun.actRouteGraph,
      sourceSectorIndex
    );
    const returnToRoutePlot = () => this.showRouteChoice();
    this.sceneManager.switchTo(
      new SectorTransitionScene(
        this.uiRoot,
        this.currentRun,
        this.runSession,
        this.selectedContract,
        () => {},
        createMissionReadModel(schedule, this.runSession.mission),
        createMissionDebugState(schedule, this.runSession.mission),
        () => void this.showCrewQuarters(returnToRoutePlot),
        () => void this.showFleetBay(returnToRoutePlot, 'Return to Route Plot'),
        () => void this.showApexDossier(null, null, returnToRoutePlot),
        () => this.showNavigationShop(returnToRoutePlot),
        () => this.showNavigationFoundry(returnToRoutePlot, 'Return to Route Plot'),
        {},
        null,
        {
          sourceSectorIndex,
          targetSectorIndices,
          onChoose: (targetSectorIndex, route) => this.handleRouteChoice(targetSectorIndex, route)
        },
        () =>
          this.suspendAtConstellation(
            'operationalMap',
            `Suspended at route plot after sector ${sourceSectorIndex + 1}`
          )
      )
    );
    this.checkpointRun('operationalMap', `Route plot after sector ${sourceSectorIndex + 1}`);
  }

  private handleRouteChoice(targetSectorIndex: number, route: RouteOption): void {
    const sector = getCurrentSector(this.currentRun, this.runSession);
    const outcome = generateRouteOutcome({
      run: this.currentRun,
      sector,
      route,
      availableCredits: this.runSession.credits,
      targetSectorIndex
    });

    applyRouteOutcome(
      this.runSession,
      sector,
      route,
      outcome,
      this.currentRun.factionCampaign,
      this.currentRun.factionFronts,
      this.currentRun.upgradeEffects.routeChosen
    );

    if (route.kind === 'shop') {
      this.showShop(targetSectorIndex, route);
      return;
    }

    this.showRouteEvent(targetSectorIndex, route, outcome);
  }

  private showRouteEvent(
    targetSectorIndex: number,
    route: RouteOption,
    outcome: AppliedRouteOutcome
  ): void {
    this.sceneManager.switchTo(
      new RouteEventScene(this.uiRoot, outcome, this.selectedContract, () => {
        this.acquireRouteComponentAndAdvance(targetSectorIndex, route);
      })
    );
  }

  private showShop(targetSectorIndex: number, route: RouteOption): void {
    this.sceneManager.switchTo(
      new ShopScene(
        this.uiRoot,
        this.currentRun,
        this.runSession,
        this.selectedContract,
        (itemId, price) => this.buyShopItem(itemId, price),
        (componentId, price) => this.buyShopPrimaryWeapon(componentId, price),
        () => this.rerollShop(),
        (price) => this.buyShopRepair(price),
        () => {
          this.acquireRouteComponentAndAdvance(targetSectorIndex, route);
        }
      )
    );
  }

  private showReward(): void {
    this.sceneManager.switchTo(
      new RewardScene(
        this.uiRoot,
        this.currentRun,
        this.runSession,
        this.selectedContract,
        (itemId) => {
          addItemToSession(this.runSession, itemId);
          this.showMissionBranch();
        },
        (component) => {
          this.acquireRecoveredComponent(component);
          this.showMissionBranch();
        },
        () => {
          const sector = getCurrentSector(this.currentRun, this.runSession);
          addCredits(
            this.runSession,
            getRouteCreditReward(
              this.runSession,
              this.runSession.currentSectorIndex,
              createActEconomyProfile(sector)
            )
          );
          this.showMissionBranch();
        }
      )
    );
  }

  private buyShopItem(itemId: ItemId, price: number): boolean {
    const sector = getCurrentSector(this.currentRun, this.runSession);
    const rerollCount = getShopRerollCount(this.runSession, sector.index);
    if (!getAvailableShopStockItem(this.runSession, sector.index, rerollCount, itemId, price)) {
      return false;
    }

    if (!spendCredits(this.runSession, price)) {
      return false;
    }

    depleteShopStockItem(this.runSession, sector.index, rerollCount, itemId, price);
    addItemToSession(this.runSession, itemId);
    return true;
  }

  private buyShopPrimaryWeapon(componentId: string, price: number): boolean {
    const offer = createShopPrimaryWeaponOffer(this.currentRun, this.runSession);
    if (
      offer.depleted ||
      offer.component.id !== componentId ||
      offer.price !== price ||
      this.runSession.credits < price
    ) {
      return false;
    }
    if (!spendCredits(this.runSession, price)) return false;
    return this.acquireRecoveredComponent(offer.component);
  }

  private rerollShop(): boolean {
    const sector = getCurrentSector(this.currentRun, this.runSession);
    const rerollCost = getShopRerollCost(
      createActEconomyProfile(sector),
      getShopRerollCount(this.runSession, sector.index)
    );

    if (!spendCredits(this.runSession, rerollCost)) {
      return false;
    }

    incrementShopRerollCount(this.runSession, sector.index);
    return true;
  }

  private buyShopRepair(price: number): boolean {
    const sector = getCurrentSector(this.currentRun, this.runSession);
    const expectedPrice = getShopHullRepairCost(createActEconomyProfile(sector));
    const before = getShipHullReadModel(this.selectedContract, this.runSession);
    if (price !== expectedPrice || before.missing === 0) return false;
    if (!spendCredits(this.runSession, price)) return false;

    const after = repairShipHull(this.selectedContract, this.runSession);
    recordRunSessionTimelineEvent(this.runSession, {
      id: `shop-repair:${sector.index}:${this.runSession.timeline.entries.length}`,
      category: 'economy',
      kind: 'shopRepair',
      sectorIndex: this.runSession.currentSectorIndex,
      value: price,
      subjectId: this.selectedContract.shipId,
      detailId: `${before.current}-${after.current}/${after.max}`
    });
    return after.current > before.current;
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

  private advanceAfterSectorExtraction(targetSectorIndex?: number): void {
    const missionResult = this.dispatchCurrentMission({
      id: `${this.runSession.mission.currentStageId}:extraction-complete`,
      type: 'completeExtraction'
    });

    if (missionResult.disposition !== 'advanced') {
      return;
    }

    const previousSectorIndex = this.runSession.currentSectorIndex;

    const frontierHandoff = getFrontierChoiceHandoff(this.currentRun.acts, previousSectorIndex);
    if (frontierHandoff && this.runSession.frontierDecision.decision === 'unresolved') {
      this.showFrontierGate(frontierHandoff.sourceAct, frontierHandoff.targetAct);
      return;
    }

    if (!advanceSector(this.currentRun, this.runSession, targetSectorIndex)) {
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

    this.beginCurrentSectorOperation();
  }

  private showDebugFrontierGate(): void {
    if (!this.snapshotEligible) this.resetDebugRunState();
    const sourceAct = this.currentRun.acts.find((act) => act.id === 'act_core_descent');
    const targetAct = this.currentRun.acts.find((act) => act.id === 'act_null_frontier');
    if (!sourceAct || !targetAct) return;

    this.runSession.currentSectorIndex = sourceAct.endSectorIndex;
    resetMissionForCurrentSector(this.currentRun, this.runSession);
    this.runSession.routeHistory = createDebugRouteHistoryBeforeSector(
      this.currentRun,
      sourceAct.endSectorIndex
    );
    this.lastRunResult = {
      ...createTwoActDebugSummaryResult(this.currentRun),
      reason: 'sectorComplete'
    };
    this.showFrontierGate(sourceAct, targetAct);
  }

  private showDebugCarrierDeck(): void {
    this.resetDebugRunState();
    this.runSession.currentSectorIndex = Math.min(1, this.currentRun.sectors.length - 1);
    resetMissionForCurrentSector(this.currentRun, this.runSession);
    const schedule = this.getCurrentMissionSchedule();
    const stagingId = schedule.stagingStageId;
    if (!stagingId) return;
    this.runSession.mission = {
      ...this.runSession.mission,
      currentStageId: stagingId,
      visitedStageIds: [schedule.startStageId, stagingId]
    };
    this.runSession.credits = Math.max(this.runSession.credits, 30);
    this.runSession.salvage = Math.max(this.runSession.salvage, 20);
    this.runSession.crewRoster = createDebugCrewRosterState(this.currentRun.crewRoster);
    void this.showCommandDeck(schedule);
  }

  private showFrontierGate(sourceAct: RunActPlan, targetAct: RunActPlan): void {
    this.sceneManager.switchTo(
      new FrontierGateScene(
        this.uiRoot,
        this.currentRun,
        this.runSession,
        this.selectedContract,
        sourceAct,
        targetAct,
        () => {
          applyFrontierDecision(this.runSession, 'extract');
          const victory = this.lastRunResult
            ? { ...this.lastRunResult, reason: 'victory' as const }
            : undefined;
          this.showRunSummary(victory);
        },
        () => {
          applyFrontierDecision(this.runSession, 'breach');
          if (!advanceSector(this.currentRun, this.runSession)) {
            this.showRunSummary(
              this.lastRunResult ? { ...this.lastRunResult, reason: 'victory' as const } : undefined
            );
            return;
          }
          this.showSectorTransition();
        }
      )
    );
  }

  private acquireRouteComponentAndAdvance(targetSectorIndex: number, route: RouteOption): void {
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
    this.acquireRecoveredComponent(component);
    this.advanceAfterSectorExtraction(targetSectorIndex);
  }

  private acquireRecoveredComponent(component: FoundryComponentInstance): boolean {
    const engineering = acquireComponent(this.runSession.engineering, component);
    if (engineering === this.runSession.engineering) return false;
    this.runSession.engineering = engineering;
    stowCarrierCargo(this.currentRun, this.runSession, {
      id: component.id,
      label: component.sourceLabel,
      kind: 'component',
      size: 1,
      value: component.salvageValue,
      sectorIndex: this.runSession.currentSectorIndex
    });
    recordRunSessionTimelineEvent(this.runSession, {
      id: `engineering-acquire:${component.id}`,
      category: 'engineering',
      kind: 'acquire',
      sectorIndex: this.runSession.currentSectorIndex,
      value: component.salvageValue,
      subjectId: component.id,
      detailId: component.moduleId
    });
    return true;
  }

  private showNavigationShop(onBack: () => void = () => this.showSectorTransition()): void {
    this.sceneManager.switchTo(
      new ShopScene(
        this.uiRoot,
        this.currentRun,
        this.runSession,
        this.selectedContract,
        (itemId, price) => this.buyShopItem(itemId, price),
        (componentId, price) => this.buyShopPrimaryWeapon(componentId, price),
        () => this.rerollShop(),
        (price) => this.buyShopRepair(price),
        onBack
      )
    );
  }

  private showNavigationFoundry(
    onBack: () => void = () => this.showSectorTransition(),
    backLabel = 'Return to Navigation'
  ): void {
    const sector = getCurrentSector(this.currentRun, this.runSession);
    const crewAssist = getCrewFoundryAssist(this.currentRun.crewRoster, this.runSession.crewRoster);
    const carrierInfluence = createCarrierInfluence(
      this.currentRun.carrierPlan,
      this.runSession.carrier
    );
    const previousHistoryLength = this.runSession.engineering.history.length;
    const previousItems = JSON.stringify(this.runSession.itemInstances);
    this.sceneManager.switchTo(
      new FoundryScene(
        this.uiRoot,
        this.currentRun,
        this.selectedContract,
        this.runSession.engineering,
        this.runSession.itemInstances,
        sector.index,
        (engineering, itemInstances, salvageGained) => {
          const changed =
            engineering.history.length !== previousHistoryLength ||
            JSON.stringify(itemInstances) !== previousItems;
          this.runSession.engineering = engineering;
          this.runSession.itemInstances = [...itemInstances];
          const assistBonus = salvageGained > 0 ? (crewAssist?.salvageBonus ?? 0) : 0;
          const carrierBonus = salvageGained > 0 ? carrierInfluence.foundrySalvageBonus : 0;
          const totalSalvage = salvageGained + assistBonus + carrierBonus;
          this.runSession.salvage += totalSalvage;
          if (changed && crewAssist) {
            recordCrewRosterEvent(
              this.runSession,
              this.currentRun.crewRoster,
              {
                id: `foundry-assist:${sector.index}:${crewAssist.candidateId}`,
                type: 'foundryAssist',
                sectorIndex: this.runSession.currentSectorIndex,
                candidateId: crewAssist.candidateId
              },
              this.currentRun.factionFronts
            );
          }
          if (changed) {
            recordCrewArcEvent(this.currentRun, this.runSession, {
              id: `foundry-arc:${sector.index}:${engineering.history.length}`,
              source: 'module',
              sectorIndex: this.runSession.currentSectorIndex,
              candidateIds: crewAssist ? [crewAssist.candidateId] : [],
              positive: true,
              detail: `committed ${engineering.committed.frameId}`
            });
            recordRunSessionTimelineEvent(this.runSession, {
              id: `engineering-commit:${sector.index}:${engineering.history.length}`,
              category: 'engineering',
              kind: 'commit',
              sectorIndex: this.runSession.currentSectorIndex,
              value: totalSalvage,
              subjectId: engineering.committed.frameId,
              detailId: `history-${engineering.history.length}`
            });
          }
          onBack();
        },
        crewAssist?.label ?? null,
        backLabel,
        'Carrier hardpoint draft. Changes remain reversible until commit.'
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
    const stage = getMissionStage(schedule, this.runSession.mission.currentStageId);
    if (stage.kind === 'branch') {
      this.showMissionBranch();
      return;
    }
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
        () => this.beginCurrentSectorOperation(),
        createMissionReadModel(schedule, this.runSession.mission),
        createMissionDebugState(schedule, this.runSession.mission),
        () => void this.showCrewQuarters(),
        () => void this.showFleetBay(() => this.showSectorTransition(), 'Return to Navigation'),
        () => void this.showApexDossier(),
        () => this.showNavigationShop(),
        () => this.showNavigationFoundry(),
        {},
        null,
        null,
        () =>
          this.suspendAtConstellation(
            'sectorTransition',
            `Suspended at sector ${this.runSession.currentSectorIndex + 1} constellation`
          )
      )
    );
  }

  private beginCurrentSectorOperation(): void {
    const briefing = this.dispatchCurrentMission({
      id: `${this.runSession.mission.currentStageId}:briefing-confirmed`,
      type: 'confirmBriefing'
    });
    if (briefing.disposition !== 'advanced') return;

    const entry = this.dispatchCurrentMission({
      id: `${this.runSession.mission.currentStageId}:entry-complete`,
      type: 'completeEntry'
    });
    if (entry.disposition === 'advanced') this.showGameplay();
  }

  private async showCrewQuarters(
    onBack: () => void = () => this.showSectorTransition()
  ): Promise<void> {
    const { CrewQuartersScene } = await import('../ui/CrewQuartersScene');
    this.sceneManager.switchTo(
      new CrewQuartersScene(
        this.uiRoot,
        this.currentRun.crewRoster,
        this.runSession.crewRoster,
        this.currentRun.crewArcs,
        this.runSession.crewArcs,
        this.runSession.currentSectorIndex,
        (arcId, optionId) => {
          chooseCrewArcOption(this.currentRun, this.runSession, arcId, optionId);
          void this.showCrewQuarters(onBack);
        },
        onBack
      )
    );
  }

  private async showApexDossier(
    profile: ApexFinaleProfile | null = null,
    onResolve: ((outcome: ApexOutcome) => void) | null = null,
    onBack: () => void = () => this.showSectorTransition()
  ): Promise<void> {
    const { ApexDossierScene } = await import('../ui/ApexDossierScene');
    this.sceneManager.switchTo(
      new ApexDossierScene(
        this.uiRoot,
        this.currentRun.apexHunts,
        this.runSession.apexHunts,
        this.runSession.currentSectorIndex,
        this.createApexFinaleContext(),
        profile,
        onResolve,
        onBack
      )
    );
  }

  private createApexFinaleContext(): ApexFinaleContext {
    const fronts = createFactionFrontCampaignReadModel(
      this.currentRun.factionFronts,
      this.runSession.factionFronts
    );
    const carrier = createCarrierInfluence(this.currentRun.carrierPlan, this.runSession.carrier);
    const fleet = createFleetInfluence(this.currentRun.fleet, this.runSession.fleet);
    return {
      alliedFronts: fronts.alliedCount,
      hostileFronts: fronts.hostileCount,
      resolvedRivals: this.runSession.factionCampaign.rivals.filter(
        (rival) => rival.status === 'captured' || rival.status === 'destroyed'
      ).length,
      crewBonds: this.runSession.crewArcs.relationships.filter(
        (relationship) => relationship.bond >= 2
      ).length,
      crewOfficers: Object.values(this.runSession.crewArcs.ranks).filter(
        (rank) => rank === 'officer'
      ).length,
      carrierSupport: carrier.supportCapacity,
      boardingCapacity: carrier.boardingCapacity,
      fleetSupport: fleet.readyCraft + fleet.pursuitControl,
      fleetBoardingAssist: fleet.boardingAssist,
      frontierDecision: this.runSession.frontierDecision.decision
    };
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
          const result = gameplayScene.getRunResult('abandoned');
          if (gameplayScene.isBoardingOperation()) {
            this.dispatchCurrentMission({
              id: `${this.runSession.mission.currentStageId}:resume-retreat:${this.runSession.mission.transitions.length}`,
              type: 'resume'
            });
            this.handleMissionCombatComplete(result);
          } else {
            this.handleMissionFailure(result);
          }
        },
        () => {
          this.showSettings(() => this.showPause(gameplayScene));
        },
        () => {
          this.checkpointRun('gameplay', 'Manually suspended operation');
          this.showMainMenu();
        },
        gameplayScene.isBoardingOperation() ? 'retreatBoarding' : 'endRun'
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
    this.sceneManager.switchTo(
      new RunSummaryScene(
        this.uiRoot,
        this.currentRun,
        this.selectedContract,
        this.lastRunResult,
        this.runSession.currentSectorIndex,
        this.runSession.routeHistory,
        this.runSession.interActChoices,
        this.runSession.itemInstances,
        this.runSession.engineering,
        this.saveData,
        this.lastSaveUpdate,
        () => {
          this.returnToMainMenuFromDebrief();
        }
      )
    );
  }

  private returnToMainMenuFromDebrief(): void {
    this.seedEntryInput = '';
    const url = new URL(window.location.href);
    if (url.searchParams.has('seed')) {
      url.searchParams.delete('seed');
      window.history.replaceState(window.history.state, '', url);
    }
    this.showMainMenu();
  }

  private saveRunSummary(result: CombatRunResult | null): SaveUpdateResult | null {
    if (!result || this.summarySaved) {
      return this.lastSaveUpdate;
    }
    if (this.scenarioLabSession) {
      this.summarySaved = true;
      return null;
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
      result.reason,
      this.runSession.frontierDecision.decision === 'extract'
        ? this.currentRun.acts.slice(0, 2).reduce((total, act) => total + act.routeDepth, 0)
        : this.currentRun.acts.reduce((total, act) => total + act.routeDepth, 0)
    );
    const actSaveContext = createRunActSaveContext(this.currentRun.acts, sectorsCleared);
    const sector = this.currentRun.sectors[this.runSession.currentSectorIndex];
    const finale = sector?.finale ?? null;
    const frontierVictory =
      result.reason === 'victory' && this.runSession.frontierDecision.decision === 'breach';
    const expedition = createExpeditionPathReadModel(
      this.currentRun.expedition,
      this.runSession.expedition
    );
    const frontEnding = createFactionFrontCampaignReadModel(
      this.currentRun.factionFronts,
      this.runSession.factionFronts
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
      finaleVariantId: frontierVictory
        ? this.currentRun.frontierCampaign.variantId
        : (finale?.variantId ?? null),
      finaleVariantName: frontierVictory
        ? `${this.currentRun.frontierCampaign.name} / ${frontEnding.endingLabel}`
        : finale?.variantName
          ? `${finale.variantName} / ${frontEnding.endingLabel}`
          : frontEnding.endingLabel,
      finaleCleared: result.reason === 'victory' && (finale !== null || frontierVictory),
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
      itemIds: this.runSession.itemInstances.map((item) => item.itemId),
      bonusUnlockIds: getResolvedApexUnlockIds(this.currentRun.apexHunts, this.runSession.apexHunts)
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
    const hazardRuntimeDebug = debugState.sector?.hazardRuntime
      ? [`Hazard runtime ${debugState.sector.hazardRuntime}`]
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
            `Mines ${debugState.entityCounts.proximityMines ?? 0} armed ${debugState.entityCounts.armedProximityMines ?? 0}`,
            `Set-piece parts ${debugState.entityCounts.setPieceComponents ?? 0} targets ${debugState.entityCounts.setPieceTargets ?? 0} shots ${debugState.entityCounts.setPieceProjectiles ?? 0}/${debugState.entityCounts.setPieceProjectileCap ?? 0}`
          ];
    const arenaDebug =
      debugState.arenaPhase && debugState.arenaPhase !== 'none'
        ? [`Arena ${debugState.arenaPhase}`]
        : [];
    const exitDebug = debugState.exitSequence ? [`Exit ${debugState.exitSequence}`] : [];
    const cooldownDebug = debugState.sectorCooldown
      ? [`Recovery coast ${debugState.sectorCooldown}`]
      : [];
    const destructionDebug = debugState.destructionSequence
      ? [`Destruction ${debugState.destructionSequence}`]
      : [];
    const scenarioDebug = debugState.debugScenario ? [`Scenario ${debugState.debugScenario}`] : [];
    const heatShotDebug = debugState.heatShots
      ? [
          `Heat shots F${debugState.heatShots.fired}/X${debugState.heatShots.exhausted} reserve ${debugState.heatShots.storedHeat.toFixed(2)}/${debugState.heatShots.cost.toFixed(2)}`
        ]
      : [];
    const hasteDebug = debugState.haste
      ? [
          `Haste ${debugState.haste.active ? 'ACTIVE' : 'idle'} ${debugState.haste.chargeSeconds.toFixed(2)}/${debugState.haste.capacitySeconds.toFixed(2)}s sources ${debugState.haste.sourceCount} drain ${debugState.haste.pauseDrainWhileNotFiring ? 'coast-hold' : 'continuous'} cooldown x${debugState.haste.fireCooldownMultiplier.toFixed(2)}`
        ]
      : [];
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
          `Set-piece ${debugState.setPiece.name}/${debugState.setPiece.layoutLabel} ${debugState.setPiece.beat} ${debugState.setPiece.destroyedComponents}/${debugState.setPiece.totalComponents} target ${debugState.setPiece.targetLabel} lane ${debugState.setPiece.safeLaneLabel}${debugState.setPiece.bossLockActive ? ' BOSS-LOCK' : ''}`
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
    const carrierDebug = debugState.carrier
      ? [
          `Carrier ${debugState.carrier.name} hull ${debugState.carrier.hull} ${debugState.carrier.pressure} ${debugState.carrier.posture} cargo ${debugState.carrier.cargo}`,
          `Carrier facilities ${debugState.carrier.facilities.join(' / ')} events ${debugState.carrier.historyCount}`
        ]
      : [];
    const boardingDebug = debugState.boarding
      ? [
          `Boarding ${debugState.boarding.title} ${debugState.boarding.target} rooms ${debugState.boarding.rooms} doors ${debugState.boarding.doors} hazards ${debugState.boarding.hazards} loot ${debugState.boarding.loot}`,
          `Boarding environment ${debugState.boarding.environmentLabel} / ${debugState.boarding.environmentKind}`,
          `Boarding integrations ${debugState.boarding.integrations.join('/')} extraction ${debugState.boarding.extractionSeconds ?? 'untimed'}`
        ]
      : [];
    const factionFrontDebug = debugState.factionFronts
      ? [
          `Front ${debugState.factionFronts.current ?? 'no current front'} events ${debugState.factionFronts.historyCount}`,
          `Front allegiance ${debugState.factionFronts.allegiance.join(' / ')}`,
          `Front ending ${debugState.factionFronts.ending}`
        ]
      : [];
    const crewArcDebug = debugState.crewArcs
      ? [
          `Crew arcs pending ${debugState.crewArcs.pending} resolved ${debugState.crewArcs.resolved} successor ${debugState.crewArcs.successor ?? 'none'} events ${debugState.crewArcs.historyCount}`,
          `Crew relationships ${debugState.crewArcs.relationships.join(' / ') || 'none'}`,
          `Crew fates ${debugState.crewArcs.fates.join(' / ') || 'none'}`
        ]
      : [];
    const fleetDebug = debugState.fleet
      ? [
          `Fleet ready ${debugState.fleet.ready} damaged ${debugState.fleet.damaged} lost ${debugState.fleet.lost} deployed ${debugState.fleet.deployed} events ${debugState.fleet.historyCount}`,
          `Fleet budget ${debugState.fleet.budget}`,
          `Fleet craft ${debugState.fleet.craft.join(' / ') || 'none'}`
        ]
      : [];
    const apexDebug = debugState.apex
      ? [
          `Apex active ${debugState.apex.active} resolved ${debugState.apex.resolved} awaiting ${debugState.apex.awaiting} events ${debugState.apex.historyCount}`,
          `Apex budget ${debugState.apex.budget}`,
          `Apex threats ${debugState.apex.threats.join(' / ')}`
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
      ...cooldownDebug,
      ...destructionDebug,
      ...scenarioDebug,
      ...heatShotDebug,
      ...hasteDebug,
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
      ...carrierDebug,
      ...boardingDebug,
      ...factionFrontDebug,
      ...crewArcDebug,
      ...fleetDebug,
      ...apexDebug,
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
      ...hazardRuntimeDebug,
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
    this.scenarioLabSession = false;
    this.currentRun = this.createRunSkeleton();
    this.selectedContract = getFirstContract(this.currentRun);
    this.runSession = createRunSession(this.currentRun, this.selectedContract, {
      unlockedIds: this.saveData.unlockedIds
    });
  }

  private checkpointRun(
    target: 'sectorTransition' | 'gameplay' | 'operationalMap',
    label: string
  ): boolean {
    if (!this.snapshotEligible) return false;
    try {
      this.runSnapshot = this.runSnapshotCoordinator.checkpoint({
        run: this.currentRun,
        contract: this.selectedContract,
        session: this.runSession,
        target,
        label
      });
      this.runSnapshotNotice = null;
      return true;
    } catch (error) {
      this.runSnapshotNotice =
        error instanceof Error
          ? `Run checkpoint failed: ${error.message}`
          : 'Run checkpoint failed.';
      return false;
    }
  }

  private suspendAtConstellation(
    target: 'sectorTransition' | 'operationalMap',
    label: string
  ): void {
    if (!this.checkpointRun(target, label)) return;
    this.runSnapshotNotice = 'Expedition suspended safely at the constellation.';
    this.showMainMenu();
  }

  private resumeRunSnapshot(): void {
    if (!this.runSnapshot) return;
    try {
      const restored = this.runSnapshotCoordinator.restore(this.runSnapshot);
      this.currentSeedLabel = restored.run.seed;
      this.currentRun = restored.run;
      this.selectedContract = restored.contract;
      this.runSession = restored.session;
      this.lastRunResult = null;
      this.lastSaveUpdate = null;
      this.summarySaved = false;
      this.scenarioLabSession = false;
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
        } else if (stage.kind === 'extraction') {
          this.showRouteChoice();
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
