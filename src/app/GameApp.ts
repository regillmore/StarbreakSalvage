import { CanvasRenderer } from './CanvasRenderer';
import { Loop, type FrameStats } from './Loop';
import { SceneManager } from './SceneManager';
import type { CombatRunResult } from '../game/CombatState';
import {
  applyRunRecordToSave,
  exportSaveData,
  getSaveSummary,
  importSaveData,
  loadSaveData,
  resetSaveData,
  writeSaveData,
  type RunSaveRecord,
  type SaveData,
  type SaveUpdateResult
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
import { resolveSeedEntry } from '../game/SeedEntry';
import {
  addCredits,
  addItemToSession,
  advanceSector,
  applyRouteOutcome,
  createRunSession,
  getCombatModifiersForSector,
  getCurrentSector,
  getEffectiveShipStats,
  getRouteCreditReward,
  incrementShopRerollCount,
  recordSectorCombatResult,
  spendCredits,
  type RunSessionState
} from '../game/RunSession';
import { getSaveRecordSectorCount } from '../game/RunOutcome';
import { generateRouteOutcome, type AppliedRouteOutcome } from '../game/RouteEvents';
import { SHOP_REROLL_COST } from '../game/Shops';
import { AudioSystem } from '../systems/AudioSystem';
import { getFeedbackShakeIntensity, type CombatFeedbackCue } from '../systems/CombatFeedback';
import { InputSystem } from '../systems/InputSystem';
import { ContractSelectScene } from '../ui/ContractSelectScene';
import { GameplayScene } from '../ui/GameplayScene';
import { MainMenuScene } from '../ui/MainMenuScene';
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
          this.showMainMenu();
        }
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
          this.showGameplay();
        },
        () => {
          this.showMainMenu();
        }
      )
    );
  }

  private showGameplay(existingScene?: GameplayScene): void {
    const gameplayScene =
      existingScene ??
      new GameplayScene(
        this.uiRoot,
        this.input,
        this.currentRun,
        this.selectedContract,
        getEffectiveShipStats(this.selectedContract, this.runSession),
        getCombatModifiersForSector(this.runSession, this.runSession.currentSectorIndex),
        this.runSession.currentSectorIndex,
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
          this.showRunSummary(result);
        },
        (result) => {
          this.handleSectorComplete(result);
        }
      );

    this.sceneManager.switchTo(gameplayScene);
  }

  private handleSectorComplete(result: CombatRunResult): void {
    this.lastRunResult = result;
    recordSectorCombatResult(this.runSession, result);
    this.showRouteChoice();
  }

  private showRouteChoice(): void {
    this.sceneManager.switchTo(
      new RouteScene(this.uiRoot, this.currentRun, this.runSession, (route) => {
        this.handleRouteChoice(route);
      })
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
      new RouteEventScene(this.uiRoot, outcome, () => {
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
          addCredits(this.runSession, getRouteCreditReward(this.runSession, sector.index));
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
    if (!spendCredits(this.runSession, SHOP_REROLL_COST)) {
      return false;
    }

    const sector = getCurrentSector(this.currentRun, this.runSession);
    incrementShopRerollCount(this.runSession, sector.index);
    return true;
  }

  private advanceAfterReward(): void {
    if (!advanceSector(this.currentRun, this.runSession)) {
      this.showRunSummary(this.lastRunResult ?? undefined);
      return;
    }

    this.showSectorTransition();
  }

  private showSectorTransition(): void {
    this.sceneManager.switchTo(
      new SectorTransitionScene(this.uiRoot, this.currentRun, this.runSession, () => {
        this.showGameplay();
      })
    );
  }

  private showPause(gameplayScene: GameplayScene): void {
    this.sceneManager.switchTo(
      new PauseScene(
        this.uiRoot,
        gameplayScene,
        (resumedScene) => {
          this.showGameplay(resumedScene);
        },
        () => {
          this.showRunSummary(gameplayScene.getRunResult('abandoned'));
        },
        () => {
          this.showSettings(() => this.showPause(gameplayScene));
        }
      )
    );
  }

  private showRunSummary(result?: CombatRunResult): void {
    this.lastRunResult = result ?? this.lastRunResult;
    this.lastSaveUpdate = this.saveRunSummary(this.lastRunResult);
    this.sceneManager.switchTo(
      new RunSummaryScene(
        this.uiRoot,
        this.currentRun,
        this.selectedContract,
        this.lastRunResult,
        this.runSession.routeHistory,
        this.saveData,
        this.lastSaveUpdate,
        () => {
          this.showMainMenu();
        }
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

    return {
      seed: this.currentRun.seed,
      contractId: this.selectedContract.id,
      contractName: this.selectedContract.shipName,
      reason: result.reason,
      survivedSeconds: result.survivedSeconds,
      sectorsCleared: getSaveRecordSectorCount(
        this.currentRun,
        this.runSession.currentSectorIndex,
        this.runSession.routeHistory.length,
        result.reason
      ),
      bossesDefeated: result.bossesDefeated + previousBosses,
      enemiesDestroyed: result.enemiesDestroyed + previousEnemies,
      creditsRecovered: Math.max(result.credits, this.runSession.credits),
      salvageRecovered: Math.max(result.salvage, this.runSession.salvage),
      itemTriggers: result.itemTriggers + previousTriggers
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
    this.debugOverlay.textContent = [
      `FPS ${Math.round(this.frameStats.fps)}`,
      `Scene ${this.sceneManager.getSceneId()}`,
      `Seed ${debugState.seed}`,
      `Entities ${debugState.entityCount}`
    ].join(' | ');
  }

  private createRunSkeleton(): RunSkeleton {
    return generateRunSkeleton(this.currentSeedLabel, {
      unlockedIds: this.saveData.unlockedIds
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
