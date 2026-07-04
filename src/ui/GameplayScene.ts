import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import { getItemById } from '../content/items';
import {
  createCombatState,
  forceCombatEnd,
  getCombatEntityCount,
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
  advanceScrollState,
  createScrollState,
  formatScrollReadout,
  getScrollProgress,
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
import type { InputSystem, InputAction } from '../systems/InputSystem';

const DEBUG_BOSS_SHORTCUTS: Partial<Record<InputAction, BossId>> = {
  debugBossOne: 'boss_auditor_drone_xl',
  debugBossTwo: 'boss_unsold_missiles_carrier',
  debugBossThree: 'boss_bloom_engine',
  debugBossFour: 'boss_warranty_void_seraph',
  debugBossFive: 'boss_core_wreck'
};

export class GameplayScene implements Scene {
  public readonly id = 'gameplay';

  private combatState: CombatState | null = null;
  private wavePlan: WaveDirectorPlan | null = null;
  private scrollState: ScrollState | null = null;
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
  private sectorCompleted = false;
  private queuedSpecial = false;
  private queuedBomb = false;

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly input: InputSystem,
    private readonly run: RunSkeleton,
    private readonly contract: StartingContract,
    private readonly shipStats: ShipStats,
    private readonly combatModifiers: readonly RouteCombatModifier[],
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
    this.hullReadout.className = 'hud-pill';
    this.hullReadout.dataset.testid = 'hull-readout';

    this.economyReadout = document.createElement('p');
    this.economyReadout.className = 'hud-pill';
    this.economyReadout.dataset.testid = 'pickup-readout';

    this.objectiveReadout = document.createElement('p');
    this.objectiveReadout.className = 'hud-pill hud-pill-wide';
    this.objectiveReadout.dataset.testid = 'objective-readout';

    this.verbReadout = document.createElement('p');
    this.verbReadout.className = 'hud-pill hud-pill-wide';
    this.verbReadout.dataset.testid = 'verb-readout';

    this.weaponReadout = document.createElement('p');
    this.weaponReadout.className = 'hud-pill hud-pill-wide';
    this.weaponReadout.dataset.testid = 'weapon-readout';

    this.combatReadout = document.createElement('p');
    this.combatReadout.className = 'hud-pill';
    this.combatReadout.dataset.testid = 'combat-status';

    this.bossReadout = document.createElement('p');
    this.bossReadout.className = 'hud-pill';
    this.bossReadout.dataset.testid = 'boss-readout';

    this.warningReadout = document.createElement('p');
    this.warningReadout.className = 'hud-pill';
    this.warningReadout.dataset.testid = 'boss-warning';

    this.itemReadout = document.createElement('p');
    this.itemReadout.className = 'hud-pill hud-pill-wide';
    this.itemReadout.dataset.testid = 'item-readout';

    this.hintReadout = document.createElement('p');
    this.hintReadout.className = 'hud-pill hud-pill-wide';
    this.hintReadout.dataset.testid = 'hint-readout';
  }

  public enter(): void {
    this.getCombatState();

    const hud = document.createElement('section');
    hud.className = 'game-hud';
    hud.setAttribute('aria-label', 'Run status');

    const sector = document.createElement('p');
    sector.className = 'hud-pill';
    sector.textContent = `Sector ${this.sectorIndex + 1} | ${this.getCurrentSectorName()}`;

    const contract = document.createElement('p');
    contract.className = 'hud-pill';
    contract.textContent = this.contract.shipName;

    hud.append(
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
      contract,
      this.positionReadout
    );
    this.uiRoot.replaceChildren(hud);
    this.syncReadouts();
  }

  public update(dt: number): void {
    advanceScrollState(this.getScrollState(), dt);

    const state = this.getCombatState();
    const feedbackBefore = createCombatFeedbackSnapshot(state);
    const special = this.queuedSpecial;
    const bomb = this.queuedBomb;
    this.queuedSpecial = false;
    this.queuedBomb = false;
    const result = updateCombatState(
      state,
      {
        movement: this.input.getMovementAxis(),
        fire: this.input.isActionPressed('fire'),
        special,
        bomb
      },
      dt,
      this.getCombatBounds()
    );
    this.emitFeedback(diffCombatFeedback(feedbackBefore, createCombatFeedbackSnapshot(state)));

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

    renderer.paintBackground(scroll.cameraOffset, this.getCurrentSector().background);
    renderer.beginGameplayLayer();
    renderer.paintGameplayFrame();

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
        Math.abs(this.input.getMovementAxis().x),
        Math.abs(this.input.getMovementAxis().y)
      ),
      invulnerable: state.player.invulnerableSeconds > 0
    });
    renderer.endGameplayLayer();
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

    const debugBossId = DEBUG_BOSS_SHORTCUTS[action];
    if (debugBossId && this.debugEnabled) {
      const state = this.getCombatState();
      const feedbackBefore = createCombatFeedbackSnapshot(state);
      spawnBoss(state, debugBossId, this.getCombatBounds(), { clearField: true });
      this.emitFeedback(diffCombatFeedback(feedbackBefore, createCombatFeedbackSnapshot(state)));
      this.sectorCompleted = false;
      this.syncReadouts();
    }

    if (action === 'debugDenseCombat' && this.debugEnabled) {
      const state = this.getCombatState();
      const feedbackBefore = createCombatFeedbackSnapshot(state);
      spawnDebugDenseCombatScenario(state, this.getCombatBounds());
      this.emitFeedback(diffCombatFeedback(feedbackBefore, createCombatFeedbackSnapshot(state)));
      this.sectorCompleted = false;
      this.syncReadouts();
    }
  }

  public getRunResult(reason: 'abandoned' | 'debug' = 'abandoned'): CombatRunResult {
    return forceCombatEnd(this.getCombatState(), reason);
  }

  public getDebugState(): SceneDebugState {
    const scroll = getScrollProgress(this.getScrollState());

    return {
      seed: this.run.seed,
      entityCount: getCombatEntityCount(this.getCombatState()),
      distance: scroll.distance,
      sectorLength: scroll.length,
      scrollSpeed: scroll.speed,
      backgroundPrimitives: this.getCurrentSector().background.primitiveCount
    };
  }

  private getCombatState(): CombatState {
    const wavePlan = this.getWavePlan();

    this.combatState ??= createCombatState(this.getCombatBounds(), this.getCombatSeed(), {
      weaponId: this.contract.startingWeaponId,
      shipStats: this.shipStats,
      items: this.itemLoadout,
      bossId: this.run.sectors[this.sectorIndex]?.bossId,
      bossSpawnAtSeconds: wavePlan.bossSpawnAtSeconds,
      spawnSchedule: wavePlan.spawnSchedule,
      enemyHullBonus: this.getEnemyHullBonus(),
      enemyFireDelayMultiplier: this.getEnemyFireDelayMultiplier(),
      bossHullBonus: this.getBossHullBonus()
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
      availableFactionIds: this.run.availableFactionIds
    });

    return this.wavePlan;
  }

  private getScrollState(): ScrollState {
    this.scrollState ??= createScrollState(this.getCurrentSector().scroll);
    return this.scrollState;
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
    this.distanceReadout.textContent = formatScrollReadout(this.getScrollState());
    this.economyReadout.textContent = `Credits ${this.startingCredits + state.player.credits} | Salvage ${this.startingSalvage + state.player.salvage}`;
    this.objectiveReadout.textContent = getObjectiveProgress(this.getWavePlan(), state).readout;
    this.verbReadout.textContent = this.getVerbReadout(state);
    this.weaponReadout.textContent = this.getWeaponReadout(state);
    this.combatReadout.textContent = `Destroyed ${state.stats.enemiesDestroyed} | Shots ${state.stats.shotsFired} | Hooks ${state.stats.itemTriggers}`;
    this.bossReadout.textContent = state.boss
      ? `${state.boss.name} ${Math.max(0, state.boss.hull)}/${state.boss.maxHull} | ${
          state.boss.phaseLabel
        }`
      : `Boss ${this.getCurrentBossName()}`;
    this.warningReadout.textContent = state.telegraphs[0]?.label ?? 'Warning clear';
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

    if (state.stats.shotsFired === 0) {
      return 'Hint Hold fire, move through gaps, and clear waves to open a route.';
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

  private getCombatBounds(): CombatBounds {
    const ownerWindow = this.uiRoot.ownerDocument.defaultView ?? window;

    return {
      width: Math.max(320, ownerWindow.innerWidth),
      height: Math.max(240, ownerWindow.innerHeight),
      padding: 24
    };
  }
}
