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
  generateRunSkeleton,
  type RouteOption,
  type RunSkeleton,
  type StartingContract
} from '../game/Generation';
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
import { MissionBranchScene } from '../ui/MissionBranchScene';
import { MissionReliefScene } from '../ui/MissionReliefScene';
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
        }
      )
    );
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

    this.sceneManager.switchTo(gameplayScene);
  }

  private createGameplayScene(): GameplayScene {
    const schedule = this.getCurrentMissionSchedule();
    const missionReadModel = createMissionReadModel(schedule, this.runSession.mission);
    const stage = getMissionStage(schedule, this.runSession.mission.currentStageId);

    if (stage.kind !== 'combat') {
      throw new Error(`Cannot enter gameplay during mission stage ${stage.kind}.`);
    }

    const projection = createMissionCombatProjection(
      schedule,
      this.runSession.mission,
      getCurrentSector(this.currentRun, this.runSession)
    );

    return new GameplayScene(
      this.uiRoot,
      this.input,
      this.currentRun,
      this.selectedContract,
      getEffectiveShipStats(this.selectedContract, this.runSession),
      getCombatModifiersForSector(this.runSession, this.runSession.currentSectorIndex),
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
      }
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
      default:
        return false;
    }
  }

  private resetDebugRunState(): void {
    this.refreshRunForCurrentSave();
    this.lastRunResult = null;
    this.lastSaveUpdate = null;
    this.summarySaved = false;
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
    this.prepareDebugMissionCombat();

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
    const transition = this.dispatchCurrentMission({
      id: `${stageId}:combat-complete`,
      type: 'completeCombat',
      checkpoint: {
        hull: result.remainingHull ?? null,
        scrollDistance: result.distanceTraveled,
        worldOffset: result.worldOffset ?? result.distanceTraveled,
        credits: this.runSession.credits + result.credits,
        salvage: this.runSession.salvage + result.salvage
      },
      objectiveOutcome: result.missionObjective
    });

    if (transition.disposition !== 'advanced') {
      return;
    }

    this.lastRunResult = result;
    recordMissionObjectiveOutcome(this.runSession, schedule, result);
    const sector = getCurrentSector(this.currentRun, this.runSession);
    recordSectorCombatResult(this.runSession, result, createActEconomyProfile(sector));
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
    this.showRunSummary(result);
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
    this.sceneManager.switchTo(
      new MissionBranchScene(
        this.uiRoot,
        this.currentRun.seed,
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

          if (result.disposition !== 'advanced' || !schedule.branch) {
            return;
          }

          recordExpeditionBranchDecision(
            this.currentRun,
            this.runSession,
            schedule.branch.id,
            option.id
          );
          const stage = getMissionStage(schedule, this.runSession.mission.currentStageId);
          if (stage.kind === 'combat') {
            this.showGameplay();
          } else {
            this.showMissionRelief();
          }
        }
      )
    );
  }

  private showMissionRelief(): void {
    const schedule = this.getCurrentMissionSchedule();
    this.sceneManager.switchTo(
      new MissionReliefScene(
        this.uiRoot,
        this.currentRun.seed,
        this.selectedContract,
        createMissionReadModel(schedule, this.runSession.mission),
        createMissionDebugState(schedule, this.runSession.mission),
        this.runSession.mission.checkpoint.hull,
        this.runSession.credits,
        this.runSession.salvage,
        () => {
          const result = this.dispatchCurrentMission({
            id: `${this.runSession.mission.currentStageId}:relief-complete`,
            type: 'completeRelief'
          });
          if (result.disposition === 'advanced') {
            this.showRouteChoice();
          }
        }
      )
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

    applyRouteOutcome(this.runSession, sector, route, outcome);

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
          this.advanceAfterReward();
        },
        () => {
          const sector = getCurrentSector(this.currentRun, this.runSession);
          addCredits(
            this.runSession,
            getRouteCreditReward(this.runSession, sector.index, createActEconomyProfile(sector))
          );
          this.advanceAfterReward();
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
        }
      )
    );
  }

  private abandonAtInterActJunction(): void {
    this.handleMissionFailure({
      reason: 'abandoned',
      survivedSeconds: this.lastRunResult?.survivedSeconds ?? 0,
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
    this.lastRunResult = result ?? this.lastRunResult;
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
        this.saveData,
        this.lastSaveUpdate,
        () => {
          this.showMainMenu();
        },
        formatMissionTimeline(schedule, this.runSession.mission),
        formatMissionObjectiveHistory(this.runSession.objectiveHistory)
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
    const previousCombat = this.runSession.lastCombatResult;
    const previousEnemies =
      previousCombat && previousCombat !== result ? previousCombat.enemiesDestroyed : 0;
    const previousBosses =
      previousCombat && previousCombat !== result ? previousCombat.bossesDefeated : 0;
    const previousTriggers =
      previousCombat && previousCombat !== result ? previousCombat.itemTriggers : 0;
    const currentDistance = previousCombat === result ? 0 : result.distanceTraveled;
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
      distanceTraveled: this.runSession.distanceTraveled + currentDistance,
      sectorLength: result.sectorLength,
      sectorsCleared,
      bossesDefeated: result.bossesDefeated + previousBosses,
      enemiesDestroyed: result.enemiesDestroyed + previousEnemies,
      creditsRecovered: Math.max(result.credits, this.runSession.credits),
      salvageRecovered: Math.max(result.salvage, this.runSession.salvage),
      itemTriggers: result.itemTriggers + previousTriggers,
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
            `Environment ${debugState.entityCounts.environmentObjects} (D${debugState.entityCounts.destructibles}/O${debugState.entityCounts.obstacles})`
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
