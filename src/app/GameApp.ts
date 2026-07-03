import { CanvasRenderer } from './CanvasRenderer';
import { Loop, type FrameStats } from './Loop';
import { SceneManager } from './SceneManager';
import type { CombatEndReason } from '../game/CombatState';
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
  generateRunSkeleton,
  type RouteOption,
  type RunSkeleton,
  type StartingContract
} from '../game/Generation';
import {
  addCredits,
  addItemToSession,
  advanceSector,
  createRunSession,
  getCurrentSector,
  incrementShopRerollCount,
  recordRouteChoice,
  recordSectorCombatResult,
  spendCredits,
  type RunSessionState
} from '../game/RunSession';
import { SHOP_REROLL_COST } from '../game/Shops';
import { InputSystem } from '../systems/InputSystem';
import { ContractSelectScene } from '../ui/ContractSelectScene';
import { GameplayScene } from '../ui/GameplayScene';
import { MainMenuScene } from '../ui/MainMenuScene';
import { PauseScene } from '../ui/PauseScene';
import { RewardScene } from '../ui/RewardScene';
import { RouteScene } from '../ui/RouteScene';
import { RunSummaryScene } from '../ui/RunSummaryScene';
import { SectorTransitionScene } from '../ui/SectorTransitionScene';
import { ShopScene } from '../ui/ShopScene';
import { UnlockArchiveScene } from '../ui/UnlockArchiveScene';
import type { ItemId } from '../content/items';

export class GameApp {
  private readonly canvas: HTMLCanvasElement;
  private readonly uiRoot: HTMLDivElement;
  private readonly debugOverlay: HTMLDivElement;
  private readonly renderer: CanvasRenderer;
  private readonly input: InputSystem;
  private readonly sceneManager = new SceneManager();
  private readonly loop: Loop;
  private readonly debugEnabled: boolean;
  private readonly currentRun: RunSkeleton;
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

    this.renderer = new CanvasRenderer(this.canvas);
    this.input = new InputSystem(window);
    this.debugEnabled = isDebugEnabled(window);
    this.currentRun = generateRunSkeleton(getInitialSeed(window));
    this.saveData = loadOrRepairSave(window);
    this.selectedContract = getFirstContract(this.currentRun);
    this.runSession = createRunSession(this.currentRun, this.selectedContract);
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
    this.input.start();
    this.showMainMenu();
    this.loop.start();
  }

  public stop(): void {
    this.loop.stop();
    this.input.stop();
    this.root.replaceChildren();
  }

  private update(dt: number): void {
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
        () => {
          this.showContractSelect();
        },
        () => {
          this.showUnlockArchive();
        }
      )
    );
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
        },
        () => {
          this.showMainMenu();
        }
      )
    );
  }

  private showContractSelect(): void {
    this.sceneManager.switchTo(
      new ContractSelectScene(
        this.uiRoot,
        this.currentRun,
        (contract) => {
          this.selectedContract = contract;
          this.runSession = createRunSession(this.currentRun, contract);
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
        this.runSession.currentSectorIndex,
        this.runSession.itemInstances,
        this.runSession.credits,
        this.runSession.salvage,
        this.debugEnabled,
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
    recordRouteChoice(this.runSession, sector, route);

    if (route.kind === 'shop') {
      this.showShop(route);
      return;
    }

    this.showReward(route);
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
          addCredits(this.runSession, 6);
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
      reason: result.reason as CombatEndReason,
      survivedSeconds: result.survivedSeconds,
      sectorsCleared: Math.max(
        this.runSession.currentSectorIndex,
        this.runSession.routeHistory.length
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
      return { ok: true, message: 'Save imported.' };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Save import failed.'
      };
    }
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
