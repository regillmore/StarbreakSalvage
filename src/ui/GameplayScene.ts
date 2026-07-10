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
import type { BossId } from '../content/bosses';
import type { SectorId } from '../content/sectors';
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
import {
  createEnvironmentObjectPlacementPlan,
  type EnvironmentObjectPlacementPlan
} from '../game/EnvironmentObjectPlacement';
import { createEnvironmentStressDebugState } from '../game/EnvironmentStress';
import { createLooseCurrencyPlan, type LooseCurrencyPlan } from '../game/LooseCurrency';
import type { ItemInstance } from '../game/Rewards';
import { getSectorCompletionReason } from '../game/RunOutcome';
import type { RouteCombatModifier } from '../game/RouteEvents';
import type {
  MissionCombatProjection,
  MissionDebugState,
  MissionReadModel
} from '../game/MissionDirector';
import { getRunUpgradeDebugLabels } from '../game/UpgradeEffects';
import { createHudMeterModel, createHudThemeModel, type HudThemeOptions } from './HudTheme';
import { createContractThemeDebugState } from './ContractTheme';
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
  type HazardZoneDirectorPlan
} from '../game/HazardZoneDirector';
import { resolveSectorHazardCollisions } from '../game/SectorHazards';
import {
  getActiveSectorHazards,
  getVisibleSectorLandmarks,
  type ActiveSectorHazard,
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
  advanceSectorExitSequence,
  createSectorExitSequence,
  getSectorExitPresentation,
  type SectorExitSequenceReason,
  type SectorExitSequenceState
} from '../game/SectorExitSequence';
import {
  advancePlayerDestructionSequence,
  createPlayerDestructionSequence,
  getPlayerDestructionPresentation,
  type PlayerDestructionSequenceState
} from '../game/PlayerDestruction';
import {
  createWaveDirectorPlan,
  getObjectiveProgress,
  type WaveDirectorPlan
} from '../game/WaveDirector';
import {
  formatSectorObjectiveVariantDebug,
  formatSectorObjectiveVariantReadout
} from '../game/SectorObjectives';
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
  private environmentObjectPlan: EnvironmentObjectPlacementPlan | null = null;
  private looseCurrencyPlan: LooseCurrencyPlan | null = null;
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
  private readonly exitToast: HTMLParagraphElement;
  private readonly destructionToast: HTMLParagraphElement;
  private readonly hullMeter: HudMeterElements;
  private readonly specialMeter: HudMeterElements;
  private readonly bombMeter: HudMeterElements;
  private readonly heatMeter: HudMeterElements;
  private exitSequence: SectorExitSequenceState | null = null;
  private exitSequenceResult: CombatRunResult | null = null;
  private destructionSequence: PlayerDestructionSequenceState | null = null;
  private destructionSequenceResult: CombatRunResult | null = null;
  private bossHazardReleaseDistance: number | null = null;
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
    private readonly expeditionProgress: ExpeditionProgressState,
    private readonly itemLoadout: readonly ItemInstance[],
    private readonly startingCredits: number,
    private readonly startingSalvage: number,
    private readonly debugEnabled: boolean,
    private readonly onFeedback: (cues: readonly CombatFeedbackCue[]) => void,
    private readonly onPause: (scene: GameplayScene) => void,
    private readonly onGameOver: (result: CombatRunResult) => void,
    private readonly onSectorComplete: (result: CombatRunResult) => void,
    private readonly missionContext: GameplayMissionContext | null = null
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

    this.exitToast = document.createElement('p');
    this.exitToast.className = 'sector-exit-toast';
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
    sector.dataset.testid = 'expedition-readout';
    const expedition = createExpeditionPathReadModel(this.run.expedition, this.expeditionProgress);
    sector.textContent = `${formatActSectorLabel(
      this.getCurrentSector().act
    )} | Sector ${this.sectorIndex + 1} | ${this.getCurrentSectorName()} | Expedition ${
      expedition.currentNodeLabel
    } | nodes ${expedition.visitedNodeCount}/${expedition.totalNodeCount}${
      this.missionContext ? ` | ${this.missionContext.readModel.stageLabel}` : ''
    }`;

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
    this.uiRoot.replaceChildren(hud, this.exitToast, this.destructionToast);
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
        this.getCombatBounds(),
        { deferOverlappingFromDistance: this.bossHazardReleaseDistance }
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

    const progress = getObjectiveProgress(this.getWavePlan(), state);
    const completionReason =
      (progress.complete ? this.missionContext?.projection.completionReason : null) ??
      getSectorCompletionReason(this.run, this.sectorIndex, progress);

    if (!this.sectorCompleted && completionReason) {
      this.sectorCompleted = true;
      this.startSectorExitSequence(completionReason);
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
      renderer.paintSectorHazards(this.getActiveHazards(scroll.distance), bounds);
    }

    if (this.exitSequence) {
      renderer.paintSectorExitSequence(getSectorExitPresentation(this.exitSequence), bounds);
    }

    for (const object of getActiveEnvironmentObjects(state)) {
      renderer.paintEnvironmentObject(getEnvironmentObjectScreenState(state, object));
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

    if (this.destructionSequence) {
      renderer.paintPlayerDestruction(getPlayerDestructionPresentation(this.destructionSequence));
    } else {
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
    }
    renderer.endGameplayLayer();
    renderer.paintGameplayFrame();
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

    if (action === 'debugItemStorm' && this.debugEnabled) {
      const state = this.getCombatState();
      const feedbackBefore = createCombatFeedbackSnapshot(state);
      prepareDebugItemStormScenario(state, this.getCombatBounds(), createItemStormLoadout());
      this.emitFeedback(diffCombatFeedback(feedbackBefore, createCombatFeedbackSnapshot(state)));
      this.sectorCompleted = false;
      this.debugScenario = 'item-storm';
      this.syncReadouts();
    }

    if (action === 'debugEnemyRich' && this.debugEnabled) {
      const state = this.getCombatState();
      const feedbackBefore = createCombatFeedbackSnapshot(state);
      prepareDebugEnemyRichScenario(state, this.getCombatBounds());
      this.emitFeedback(diffCombatFeedback(feedbackBefore, createCombatFeedbackSnapshot(state)));
      this.sectorCompleted = false;
      this.debugScenario = 'enemy-rich';
      this.syncReadouts();
    }

    if (action === 'debugEnvironmentStress' && this.debugEnabled) {
      const state = this.getCombatState();
      const feedbackBefore = createCombatFeedbackSnapshot(state);
      const scroll = this.getScrollState();
      const targetDistance = getDebugEnvironmentStressDistance(
        this.getCurrentFeatures(),
        scroll.plan.length
      );

      setScrollDistance(scroll, Math.max(scroll.distance, targetDistance), scroll.plan.baseSpeed);
      state.scrollDistance = scroll.distance;
      prepareDebugEnvironmentStressScenario(state, this.getCombatBounds());
      this.updateBossArena(scroll.distance, state);
      this.emitFeedback(diffCombatFeedback(feedbackBefore, createCombatFeedbackSnapshot(state)));
      this.sectorCompleted = false;
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
      this.debugScenario = 'long-scroll';
      this.syncReadouts();
    }
  }

  public getRunResult(reason: 'abandoned' | 'debug' = 'abandoned'): CombatRunResult {
    return this.withWorldOffset(forceCombatEnd(this.getCombatState(), reason));
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
    this.bossHazardReleaseDistance = null;
    this.sectorCompleted = false;
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
    const enemyRoles = createEnemyRolePressureSummary(combatState);
    const environmentStress = createEnvironmentStressDebugState(activeHazards, entityCounts);
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
        ? `${this.exitSequence.reason} ${Math.round(
            getSectorExitPresentation(this.exitSequence).progress * 100
          )}%`
        : undefined,
      destructionSequence: this.destructionSequence
        ? `${this.destructionSequence.motionMode} ${Math.round(
            getPlayerDestructionPresentation(this.destructionSequence).progress * 100
          )}%`
        : undefined,
      arenaPhase: this.bossArenaUpdate.phase,
      debugScenario: this.debugScenario ?? undefined,
      mission: this.missionContext?.debugState,
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
      items: itemStress,
      enemyRoles,
      environmentStress,
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
        hazardZones: formatHazardZoneDirectorDebug(hazardZoneDirector)
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
      debugFast: options.debugFast
    });
    this.exitSequenceResult = this.withWorldOffset(forceCombatEnd(state, reason));
    this.emitFeedback(['sectorClear']);
    this.syncExitSequenceUi();
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

    this.exitSequence = null;
    this.exitSequenceResult = null;
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
      this.exitToast.setAttribute('aria-hidden', 'true');
      this.exitToast.textContent = '';
      return;
    }

    const presentation = getSectorExitPresentation(this.exitSequence);
    this.exitToast.dataset.exitState = 'active';
    this.exitToast.dataset.exitMotion = presentation.motion;
    this.exitToast.setAttribute('aria-hidden', 'false');
    this.exitToast.textContent = presentation.toast;
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

    this.combatState ??= createCombatState(this.getCombatBounds(), this.getCombatSeed(), {
      weaponId: this.contract.startingWeaponId,
      shipStats: this.shipStats,
      startingHull: this.missionContext?.projection.startingHull,
      items: this.itemLoadout,
      bossId: this.getCurrentSector().bossId,
      bossSpawnAtSeconds: this.getCurrentArenaPlan() ? null : wavePlan.bossSpawnAtSeconds,
      spawnSchedule: wavePlan.spawnSchedule,
      enemyHullBonus: this.getEnemyHullBonus(),
      enemyFireDelayMultiplier: this.getEnemyFireDelayMultiplier(),
      bossHullBonus: this.getBossHullBonus(),
      sectorLength: this.getCurrentScrollPlan().length,
      sectorIndex: this.sectorIndex,
      sectorId: this.getCurrentSector().sectorId,
      environmentObjectPlan: this.getEnvironmentObjectPlan(),
      looseCurrencyPlan: this.getLooseCurrencyPlan()
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

    this.wavePlan = createWaveDirectorPlan({
      seed: this.getCombatSeed(),
      objective: sector.objective,
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
      actPressure: this.getActPressureModel()
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
    const previousPhase = this.bossArenaUpdate.phase;

    this.bossArenaUpdate = updateBossArenaState(this.getBossArenaState(), {
      distance,
      supportComplete: supportProgress.supportComplete,
      bossActive: state.boss !== null,
      bossAlreadySpawned: state.bossSpawned,
      bossDefeated: state.stats.bossesDefeated > 0
    });

    if (previousPhase !== 'released' && this.bossArenaUpdate.phase === 'released') {
      this.bossHazardReleaseDistance ??= distance;
    }

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
      ? `${formatSecondActFinaleBossName(
          this.getCurrentSector().finale,
          state.boss.name
        )} ${Math.max(0, state.boss.hull)}/${state.boss.maxHull} | ${state.boss.phaseLabel}`
      : `Boss ${this.getCurrentBossName()}`;
    this.warningReadout.textContent =
      state.telegraphs[0]?.label ??
      this.getActiveHazards()[0]?.hazard.label ??
      formatBossArenaReadout(this.bossArenaUpdate.phase) ??
      'Warning clear';
    this.itemReadout.textContent = this.getBuildReadout(state);
    this.hintReadout.textContent = this.getOnboardingHint(state);

    if (exitPresentation) {
      this.objectiveReadout.textContent = `${exitPresentation.title} | ${Math.round(
        exitPresentation.progress * 100
      )}%`;
      this.warningReadout.textContent = exitPresentation.toast;
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
  }

  private getCombatSeed(): string {
    const sector = this.run.sectors[this.sectorIndex];
    const suffix = this.missionContext?.projection.combatSeedSuffix;
    return `${this.run.seed}:combat:${sector?.sectorId ?? this.sectorIndex + 1}${
      suffix ? `:${suffix}` : ''
    }`;
  }

  private withWorldOffset(result: CombatRunResult): CombatRunResult {
    return {
      ...result,
      worldOffset: this.getScrollState().worldOffset
    };
  }

  private getCurrentBossName(): string {
    const sector = this.run.sectors[this.sectorIndex];
    return sector ? formatSecondActFinaleBossName(sector.finale, sector.bossName) : 'unassigned';
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
      state.player.weaponOverheatSeconds > 0 ||
        state.player.weaponHeat >= state.weapon.overheatLimit
        ? 'danger'
        : 'steady'
    );
  }

  private getBuildReadout(state: CombatState): string {
    return formatBuildSynergyHud(createBuildSynergyModel(state.items));
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

    const activeHazard = this.getActiveHazards()[0];

    if (activeHazard) {
      return activeHazard.phase === 'telegraph'
        ? `Hint ${activeHazard.hazard.label} ahead; shift lanes before it activates.`
        : `Hint ${activeHazard.hazard.label} active; stay out of the marked lane.`;
    }

    if (state.stats.shotsFired === 0) {
      const pacing = this.getSectorPacingPlan();
      const hazardZoneDirector = this.getHazardZoneDirectorPlan();
      const sectorReadouts = [
        this.sectorConditions.modifiers.length > 0
          ? formatSectorConditionReadout(this.sectorConditions)
          : null,
        formatSectorObjectiveVariantReadout(this.getCurrentSector().objective),
        pacing.arcKind !== 'standard' ? formatSectorPacingReadout(pacing) : null,
        hazardZoneDirector.scheduledHazardCount > 0 || hazardZoneDirector.pressureLevel > 0
          ? formatHazardZoneDirectorReadout(hazardZoneDirector)
          : null
      ].filter((readout): readout is string => readout !== null);

      if (sectorReadouts.length > 0) {
        return sectorReadouts.join(' | ');
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
    return this.combatModifiers.reduce(
      (multiplier, modifier) => multiplier * modifier.enemyFireDelayMultiplier,
      1
    );
  }

  private getBossHullBonus(): number {
    return (
      this.combatModifiers.reduce((total, modifier) => total + modifier.bossHullBonus, 0) +
      (this.getCurrentSector().finale?.bossHullBonus ?? 0)
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

  private getActiveHazards(
    distance = this.getScrollState().distance
  ): readonly ActiveSectorHazard[] {
    if (this.bossArenaUpdate.phase === 'locked') {
      return [];
    }

    return getActiveSectorHazards(this.getCurrentFeatures(), distance, {
      deferOverlappingFromDistance: this.bossHazardReleaseDistance
    });
  }
}

function getDebugLongScrollDistance(sectorLength: number): number {
  const length = Math.max(0, sectorLength);
  const lateDistance = length * DEBUG_LONG_SCROLL_RATIO;
  const exitLeadDistance = Math.max(0, length - DEBUG_LONG_SCROLL_EXIT_LEAD);

  return Math.min(lateDistance, exitLeadDistance);
}

function getDebugEnvironmentStressDistance(
  features: SectorFeaturePlan,
  sectorLength: number
): number {
  const candidates = features.hazards
    .flatMap((hazard) => [hazard.telegraphDistance + 18, hazard.startDistance + 18])
    .map((distance) => Math.max(0, Math.min(distance, Math.max(0, sectorLength - 220))));
  const bestCandidate = candidates
    .map((distance) => ({
      distance,
      activeCount: features.hazards.filter(
        (hazard) => distance >= hazard.telegraphDistance && distance <= hazard.endDistance
      ).length
    }))
    .sort(
      (left, right) => right.activeCount - left.activeCount || left.distance - right.distance
    )[0];

  if (!bestCandidate) {
    return Math.max(0, Math.min(sectorLength * 0.38, sectorLength - DEBUG_LONG_SCROLL_EXIT_LEAD));
  }

  return bestCandidate.distance;
}

function clearExitPressure(state: CombatState): void {
  state.enemies = [];
  state.projectiles = [];
  state.telegraphs = [];
  state.boss = null;
  state.nextSpawnIndex = state.spawnSchedule.length;
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
