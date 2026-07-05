import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import { calculateViewportLayout, type ViewportLayout } from '../app/ViewportLayout';
import type { Vector2 } from '../core/math';
import { getItemById } from '../content/items';
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
  prepareDebugLongScrollScenario,
  spawnDebugDenseCombatScenario,
  spawnBoss,
  updateCombatState,
  type CombatBounds,
  type CombatRunResult,
  type CombatState
} from '../game/CombatState';
import type { BossId } from '../content/bosses';
import type { ShipStats } from '../content/ships';
import type { RunSkeleton, StartingContract } from '../game/Generation';
import { describeItemLoadout } from '../game/ItemHooks';
import type { ItemInstance } from '../game/Rewards';
import { getSectorCompletionReason } from '../game/RunOutcome';
import type { RouteCombatModifier } from '../game/RouteEvents';
import {
  createHudMeterModel,
  createHudThemeModel,
  type HudThemeOptions
} from './HudTheme';
import {
  applySectorConditionsToBossArena,
  applySectorConditionsToFeatures,
  applySectorConditionsToScroll,
  formatSectorConditionReadout,
  type SectorConditionPlan
} from '../game/SectorConditions';
import { resolveSectorHazardCollisions } from '../game/SectorHazards';
import {
  getActiveSectorHazards,
  getVisibleSectorLandmarks,
  type SectorFeaturePlan
} from '../game/SectorFeatures';
import {
  advanceScrollState,
  createScrollState,
  formatScrollReadout,
  getScrollProgress,
  setScrollDistance,
  type SectorScrollPlan,
  type ScrollState
} from '../game/ScrollState';
import {
  createWaveDirectorPlan,
  getObjectiveProgress,
  type WaveDirectorPlan
} from '../game/WaveDirector';
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

export class GameplayScene implements Scene {
  public readonly id = 'gameplay';

  private combatState: CombatState | null = null;
  private wavePlan: WaveDirectorPlan | null = null;
  private scrollState: ScrollState | null = null;
  private conditionedScroll: SectorScrollPlan | null = null;
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
  private readonly hullMeter: HudMeterElements;
  private readonly specialMeter: HudMeterElements;
  private readonly bombMeter: HudMeterElements;
  private readonly heatMeter: HudMeterElements;
  private sectorCompleted = false;
  private queuedSpecial = false;
  private queuedBomb = false;
  private debugScenario: string | null = null;

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly input: InputSystem,
    private readonly run: RunSkeleton,
    private readonly contract: StartingContract,
    private readonly shipStats: ShipStats,
    private readonly combatModifiers: readonly RouteCombatModifier[],
    private readonly sectorConditions: SectorConditionPlan,
    private readonly sectorIndex: number,
    private readonly itemLoadout: readonly ItemInstance[],
    private readonly startingCredits: number,
    private readonly startingSalvage: number,
    private readonly debugEnabled: boolean,
    private readonly onFeedback: (cues: readonly CombatFeedbackCue[]) => void,
    private readonly onPause: (scene: GameplayScene) => void,
    private readonly onGameOver: (result: CombatRunResult) => void,
    private readonly onSectorComplete: (result: CombatRunResult) => void
  ) {
    this.positionReadout = document.createElement('p');
    this.positionReadout.className = 'sr-only';
    this.positionReadout.dataset.testid = 'player-position';

    this.distanceReadout = document.createElement('p');
    this.distanceReadout.className = 'hud-pill';
    this.distanceReadout.dataset.testid = 'distance-readout';

    this.hullReadout = document.createElement('p');
    this.hullReadout.className = 'hud-pill hud-pill-vital';
    this.hullReadout.dataset.testid = 'hull-readout';

    this.economyReadout = document.createElement('p');
    this.economyReadout.className = 'hud-pill hud-pill-vital';
    this.economyReadout.dataset.testid = 'pickup-readout';

    this.objectiveReadout = document.createElement('p');
    this.objectiveReadout.className = 'hud-pill hud-pill-wide';
    this.objectiveReadout.dataset.testid = 'objective-readout';

    this.verbReadout = document.createElement('p');
    this.verbReadout.className = 'hud-pill hud-pill-wide';
    this.verbReadout.dataset.testid = 'verb-readout';

    this.weaponReadout = document.createElement('p');
    this.weaponReadout.className = 'hud-pill hud-pill-wide hud-pill-system';
    this.weaponReadout.dataset.testid = 'weapon-readout';

    this.combatReadout = document.createElement('p');
    this.combatReadout.className = 'hud-pill';
    this.combatReadout.dataset.testid = 'combat-status';

    this.bossReadout = document.createElement('p');
    this.bossReadout.className = 'hud-pill';
    this.bossReadout.dataset.testid = 'boss-readout';

    this.warningReadout = document.createElement('p');
    this.warningReadout.className = 'hud-pill hud-pill-warning';
    this.warningReadout.dataset.testid = 'boss-warning';

    this.itemReadout = document.createElement('p');
    this.itemReadout.className = 'hud-pill hud-pill-wide';
    this.itemReadout.dataset.testid = 'item-readout';

    this.hintReadout = document.createElement('p');
    this.hintReadout.className = 'hud-pill hud-pill-wide';
    this.hintReadout.dataset.testid = 'hint-readout';

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
    hud.dataset.testid = 'cockpit-hud';
    hud.dataset.hudTheme = hudTheme.themeKey;
    hud.dataset.hudMode = hudTheme.mode;
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

    const meterStrip = ownerDocument.createElement('div');
    meterStrip.className = 'hud-meter-strip';
    meterStrip.append(
      this.hullMeter.root,
      this.specialMeter.root,
      this.bombMeter.root,
      this.heatMeter.root
    );

    const sector = document.createElement('p');
    sector.className = 'hud-pill';
    sector.textContent = `Sector ${this.sectorIndex + 1} | ${this.getCurrentSectorName()}`;

    const contract = document.createElement('p');
    contract.className = 'hud-pill';
    contract.textContent = this.contract.shipName;

    const readoutStrip = ownerDocument.createElement('div');
    readoutStrip.className = 'hud-readout-strip';
    readoutStrip.append(
      sector,
      this.distanceReadout,
      this.hullReadout,
      this.economyReadout,
      this.objectiveReadout,
      this.hintReadout,
      this.verbReadout,
      this.weaponReadout,
      this.combatReadout,
      this.bossReadout,
      this.warningReadout,
      this.itemReadout,
      contract
    );
    chrome.append(themeReadout, meterStrip);
    hud.append(chrome, readoutStrip, this.positionReadout);
    this.uiRoot.replaceChildren(hud);
    this.syncReadouts();
  }

  public update(dt: number): void {
    const scrollState = this.getScrollState();
    const state = this.getCombatState();
    const arenaBeforeScroll = this.updateBossArena(scrollState.distance, state);

    advanceScrollState(scrollState, dt, arenaBeforeScroll.speedOverride ?? undefined);

    const arenaAfterScroll = this.updateBossArena(scrollState.distance, state);
    const feedbackBefore = createCombatFeedbackSnapshot(state);

    if (arenaAfterScroll.shouldSpawnBoss) {
      spawnBoss(state, this.getCurrentSector().bossId, this.getCombatBounds(), {
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
        this.getCombatBounds()
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
      this.emitFeedback(['runEnd']);
      this.onGameOver(result);
      return;
    }

    const progress = getObjectiveProgress(this.getWavePlan(), state);
    const completionReason = getSectorCompletionReason(this.run, this.sectorIndex, progress);

    if (!this.sectorCompleted && completionReason) {
      this.sectorCompleted = true;
      const completionResult = forceCombatEnd(state, completionReason);

      if (completionReason === 'victory') {
        this.emitFeedback(['sectorClear', 'runEnd']);
        this.onGameOver(completionResult);
        return;
      }

      this.emitFeedback(['sectorClear']);
      this.onSectorComplete(completionResult);
    }
  }

  public render(renderer: CanvasRenderer, _alpha: number): void {
    const state = this.getCombatState();
    const scroll = this.getScrollState();
    const bounds = this.getCombatBounds();

    renderer.paintBackground(scroll.cameraOffset, this.getCurrentSector().background);
    renderer.beginGameplayLayer();
    renderer.paintSectorLandmarks(
      getVisibleSectorLandmarks(this.getCurrentFeatures(), scroll.distance, bounds.height),
      bounds
    );

    if (this.bossArenaUpdate.phase !== 'locked') {
      renderer.paintSectorHazards(
        getActiveSectorHazards(this.getCurrentFeatures(), scroll.distance),
        bounds
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

    for (const enemy of state.enemies) {
      renderer.paintEnemy(enemy);
    }

    if (state.boss) {
      renderer.paintBoss(state.boss);
    }

    for (const projectile of state.projectiles) {
      renderer.paintProjectile(projectile);
    }

    renderer.paintPlayerShip({
      x: state.player.x,
      y: state.player.y,
      radius: state.player.radius,
      thrust: Math.max(
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
      weaponOverheatSeconds: state.player.weaponOverheatSeconds
    });
    renderer.endGameplayLayer();
    renderer.paintGameplayFrame();
  }

  public handleAction(action: InputAction): void {
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

    if (action === 'debugSectorComplete' && this.debugEnabled) {
      this.emitFeedback(['sectorClear']);
      this.sectorCompleted = true;
      this.onSectorComplete(forceCombatEnd(this.getCombatState(), 'sectorComplete'));
      return;
    }

    const debugBossId = DEBUG_BOSS_SHORTCUTS[action];
    if (debugBossId && this.debugEnabled) {
      const state = this.getCombatState();
      const feedbackBefore = createCombatFeedbackSnapshot(state);
      spawnBoss(state, debugBossId, this.getCombatBounds(), { clearField: true });
      this.emitFeedback(diffCombatFeedback(feedbackBefore, createCombatFeedbackSnapshot(state)));
      this.sectorCompleted = false;
      this.debugScenario = 'boss-shortcut';
      this.syncReadouts();
    }

    if (action === 'debugDenseCombat' && this.debugEnabled) {
      const state = this.getCombatState();
      const feedbackBefore = createCombatFeedbackSnapshot(state);
      spawnDebugDenseCombatScenario(state, this.getCombatBounds());
      this.emitFeedback(diffCombatFeedback(feedbackBefore, createCombatFeedbackSnapshot(state)));
      this.sectorCompleted = false;
      this.debugScenario = 'dense-combat';
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
      this.debugScenario = 'long-scroll';
      this.syncReadouts();
    }
  }

  public getRunResult(reason: 'abandoned' | 'debug' = 'abandoned'): CombatRunResult {
    return forceCombatEnd(this.getCombatState(), reason);
  }

  public getDebugState(): SceneDebugState {
    const scroll = getScrollProgress(this.getScrollState());
    const viewportLayout = this.getViewportLayout();
    const bounds = this.getCombatBounds();
    const features = this.getCurrentFeatures();
    const activeLandmarks = getVisibleSectorLandmarks(features, scroll.distance, bounds.height);
    const activeHazards =
      this.bossArenaUpdate.phase === 'locked'
        ? []
        : getActiveSectorHazards(features, scroll.distance);
    const background = this.getCurrentSector().background;
    const combatState = this.getCombatState();
    const entityCounts = getCombatEntityCounts(combatState);

    return {
      seed: this.run.seed,
      entityCount: entityCounts.total,
      entityCounts,
      distance: scroll.distance,
      sectorLength: scroll.length,
      scrollSpeed: scroll.speed,
      arenaPhase: this.bossArenaUpdate.phase,
      debugScenario: this.debugScenario ?? undefined,
      backgroundPrimitives: background.primitiveCount,
      backgroundLayers: background.layers.length,
      activeLandmarks: activeLandmarks.length,
      activeHazards: activeHazards.length,
      viewport: {
        width: viewportLayout.width,
        height: viewportLayout.height,
        className: viewportLayout.viewportClass,
        scale: viewportLayout.canvasScale,
        safeFrameWidth: viewportLayout.gameplaySafeFrame.width,
        safeFrameHeight: viewportLayout.gameplaySafeFrame.height,
        arenaWidth: bounds.width,
        arenaHeight: bounds.height
      },
      inputMode: this.input.getActiveInputMode()
    };
  }

  private getCombatState(): CombatState {
    const wavePlan = this.getWavePlan();

    this.combatState ??= createCombatState(this.getCombatBounds(), this.getCombatSeed(), {
      weaponId: this.contract.startingWeaponId,
      shipStats: this.shipStats,
      items: this.itemLoadout,
      bossId: this.run.sectors[this.sectorIndex]?.bossId,
      bossSpawnAtSeconds: this.getCurrentArenaPlan() ? null : wavePlan.bossSpawnAtSeconds,
      spawnSchedule: wavePlan.spawnSchedule,
      enemyHullBonus: this.getEnemyHullBonus(),
      enemyFireDelayMultiplier: this.getEnemyFireDelayMultiplier(),
      bossHullBonus: this.getBossHullBonus(),
      sectorLength: this.getCurrentScrollPlan().length
    });
    return this.combatState;
  }

  private getWavePlan(): WaveDirectorPlan {
    if (this.wavePlan) {
      return this.wavePlan;
    }

    const sector = this.run.sectors[this.sectorIndex];

    if (!sector) {
      throw new Error(`No sector exists at index ${this.sectorIndex}.`);
    }

    this.wavePlan = createWaveDirectorPlan({
      seed: this.getCombatSeed(),
      objective: sector.objective,
      majorWaves: sector.majorWaves,
      preferredFactionId: sector.bossFactionId,
      availableFactionIds: this.run.availableFactionIds,
      scroll: this.getCurrentScrollPlan()
    });

    return this.wavePlan;
  }

  private getScrollState(): ScrollState {
    this.scrollState ??= createScrollState(this.getCurrentScrollPlan());
    return this.scrollState;
  }

  private getBossArenaState(): BossArenaState {
    this.bossArenaState ??= createBossArenaState(this.getCurrentArenaPlan());
    return this.bossArenaState;
  }

  private getCurrentScrollPlan(): SectorScrollPlan {
    this.conditionedScroll ??= applySectorConditionsToScroll(
      this.getCurrentSector().scroll,
      this.sectorConditions
    );
    return this.conditionedScroll;
  }

  private getCurrentFeatures(): SectorFeaturePlan {
    this.conditionedFeatures ??= applySectorConditionsToFeatures(
      this.getCurrentSector().features,
      this.getCurrentSector().scroll,
      this.getCurrentScrollPlan(),
      this.sectorConditions
    );
    return this.conditionedFeatures;
  }

  private getCurrentArenaPlan(): BossArenaPlan | null {
    if (this.conditionedArena === undefined) {
      this.conditionedArena = applySectorConditionsToBossArena(
        this.getCurrentSector().arena,
        this.getCurrentSector().scroll,
        this.getCurrentScrollPlan(),
        this.sectorConditions
      );
    }

    return this.conditionedArena;
  }

  private updateBossArena(distance: number, state: CombatState): BossArenaUpdate {
    const supportProgress = getObjectiveProgress(this.getWavePlan(), {
      ...state,
      scrollDistance: distance
    });

    this.bossArenaUpdate = updateBossArenaState(this.getBossArenaState(), {
      distance,
      supportComplete: supportProgress.supportComplete,
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
    const sector = this.run.sectors[this.sectorIndex];

    if (!sector) {
      throw new Error(`No sector exists at index ${this.sectorIndex}.`);
    }

    return sector;
  }

  private syncReadouts(): void {
    const state = this.getCombatState();

    this.positionReadout.textContent = `Player ${Math.round(state.player.x)},${Math.round(
      state.player.y
    )}`;
    this.hullReadout.textContent = `Hull ${state.player.hull}/${state.player.maxHull}`;
    this.distanceReadout.textContent = [
      formatScrollReadout(this.getScrollState()),
      formatBossArenaReadout(this.bossArenaUpdate.phase)
    ]
      .filter((part): part is string => Boolean(part))
      .join(' | ');
    this.economyReadout.textContent = `Credits ${this.startingCredits + state.player.credits} | Salvage ${this.startingSalvage + state.player.salvage}`;
    this.objectiveReadout.textContent = getObjectiveProgress(this.getWavePlan(), state).readout;
    this.verbReadout.textContent = this.getVerbReadout(state);
    this.weaponReadout.textContent = this.getWeaponReadout(state);
    this.syncMeters(state);
    this.combatReadout.textContent = `Destroyed ${state.stats.enemiesDestroyed} | Shots ${state.stats.shotsFired} | Hooks ${state.stats.itemTriggers}`;
    this.bossReadout.textContent = state.boss
      ? `${state.boss.name} ${Math.max(0, state.boss.hull)}/${state.boss.maxHull} | ${
          state.boss.phaseLabel
        }`
      : `Boss ${this.getCurrentBossName()}`;
    this.warningReadout.textContent =
      state.telegraphs[0]?.label ??
      getActiveSectorHazards(this.getCurrentFeatures(), this.getScrollState().distance)[0]?.hazard
        .label ??
      formatBossArenaReadout(this.bossArenaUpdate.phase) ??
      'Warning clear';
    this.itemReadout.textContent = this.getBuildReadout(state);
    this.hintReadout.textContent = this.getOnboardingHint(state);
  }

  private getCombatSeed(): string {
    const sector = this.run.sectors[this.sectorIndex];
    return `${this.run.seed}:combat:${sector?.sectorId ?? this.sectorIndex + 1}`;
  }

  private getCurrentBossName(): string {
    return this.run.sectors[this.sectorIndex]?.bossName ?? 'unassigned';
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

    return `${state.weapon.name} | ${state.weapon.pattern} | ${heatStatus}`;
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
      state.player.weaponOverheatSeconds > 0 || state.player.weaponHeat >= state.weapon.overheatLimit
        ? 'danger'
        : 'steady'
    );
  }

  private getBuildReadout(state: CombatState): string {
    if (state.items.length === 0) {
      return 'Build no items';
    }

    const names = state.items.map((item) => getItemById(item.itemId).name);
    const compactNames = names.slice(0, 3).join(' + ');
    const overflow = names.length > 3 ? ` +${names.length - 3}` : '';
    const hookSummary = describeItemLoadout(state.items);
    return `Build ${compactNames}${overflow} | ${hookSummary}`;
  }

  private getOnboardingHint(state: CombatState): string {
    if (state.boss) {
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

    const activeHazard = getActiveSectorHazards(
      this.getCurrentFeatures(),
      this.getScrollState().distance
    )[0];

    if (activeHazard) {
      return activeHazard.phase === 'telegraph'
        ? `Hint ${activeHazard.hazard.label} ahead; shift lanes before it activates.`
        : `Hint ${activeHazard.hazard.label} active; stay out of the marked lane.`;
    }

    if (state.stats.shotsFired === 0) {
      if (this.sectorConditions.modifiers.length > 0) {
        return formatSectorConditionReadout(this.sectorConditions);
      }

      return 'Hint Hold fire, move through gaps, and survive to the sector exit.';
    }

    if (state.player.specialCharge >= state.player.maxSpecialCharge) {
      return 'Hint Special ready; spend charge for a short burst window.';
    }

    if (state.player.bombs > 0 && state.projectiles.length >= 24) {
      return 'Hint Bomb ready; use it when bullets crowd the salvage lane.';
    }

    if (state.pickups.length > 0) {
      return 'Hint Pull pickups into the ship to fund shops and permanent salvage.';
    }

    return `Hint ${getObjectiveProgress(this.getWavePlan(), state).readout}`;
  }

  private getEnemyHullBonus(): number {
    return this.combatModifiers.reduce((total, modifier) => total + modifier.enemyHullBonus, 0);
  }

  private getEnemyFireDelayMultiplier(): number {
    return this.combatModifiers.reduce(
      (multiplier, modifier) => multiplier * modifier.enemyFireDelayMultiplier,
      1
    );
  }

  private getBossHullBonus(): number {
    return this.combatModifiers.reduce((total, modifier) => total + modifier.bossHullBonus, 0);
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
    return createDefaultCombatBounds();
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
}

function getDebugLongScrollDistance(sectorLength: number): number {
  const length = Math.max(0, sectorLength);
  const lateDistance = length * DEBUG_LONG_SCROLL_RATIO;
  const exitLeadDistance = Math.max(0, length - DEBUG_LONG_SCROLL_EXIT_LEAD);

  return Math.min(lateDistance, exitLeadDistance);
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
