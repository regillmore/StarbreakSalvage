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
import { createSectorConditionPlan } from '../game/SectorConditions';
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
        createSectorConditionPlan({
          run: this.currentRun,
          sectorIndex: this.runSession.currentSectorIndex,
          routeOutcomes: this.runSession.routeOutcomes
        }),
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
    if (!advanceSector(this.currentRun, this.runSession)) {
      this.showRunSummary(this.lastRunResult ?? undefined);
      return;
    }

    this.showSectorTransition();
  }

  private showSectorTransition(): void {
    this.sceneManager.switchTo(
      new SectorTransitionScene(
        this.uiRoot,
        this.currentRun,
        this.runSession,
        this.selectedContract,
        () => {
          this.showGameplay();
        }
      )
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
        this.runSession.routeOutcomes,
        this.runSession.itemInstances,
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
    const currentDistance = previousCombat === result ? 0 : result.distanceTraveled;

    return {
      seed: this.currentRun.seed,
      contractId: this.selectedContract.id,
      contractName: this.selectedContract.shipName,
      reason: result.reason,
      survivedSeconds: result.survivedSeconds,
      distanceTraveled: this.runSession.distanceTraveled + currentDistance,
      sectorLength: result.sectorLength,
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
            debugState.sector.encounterPacing
          ]
            .filter((part): part is string => Boolean(part))
            .join('/')}`
        ]
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
            `Telegraphs ${debugState.entityCounts.telegraphs}`
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
    const inputDebug = debugState.inputMode ? [`Input ${debugState.inputMode}`] : [];
    const hudDebug = debugState.hudMode ? [`HUD ${debugState.hudMode}`] : [];
    const themeDebug = debugState.contractTheme
      ? [`Theme ${debugState.contractTheme.themeKey}/${debugState.contractTheme.shipName}`]
      : [];
    const upgradeDebug =
      debugState.upgradeEffects && debugState.upgradeEffects.length > 0
        ? [`Upgrades ${debugState.upgradeEffects.join(', ')}`]
        : [];
    const progressionDebug = createProgressionDebugLines(debugState.progression);

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
      ...inputDebug,
      ...hudDebug,
      ...themeDebug,
      ...upgradeDebug,
      ...progressionDebug,
      ...sectorDebug,
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
