import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene } from '../app/Scene';
import {
  createCombatState,
  forceCombatEnd,
  getCombatEntityCount,
  spawnBoss,
  updateCombatState,
  type CombatBounds,
  type CombatRunResult,
  type CombatState
} from '../game/CombatState';
import type { BossId } from '../content/bosses';
import type { RunSkeleton, StartingContract } from '../game/Generation';
import { describeItemLoadout } from '../game/ItemHooks';
import type { ItemInstance } from '../game/Rewards';
import {
  createCombatFeedbackSnapshot,
  diffCombatFeedback,
  type CombatFeedbackCue
} from '../systems/CombatFeedback';
import type { InputSystem, InputAction } from '../systems/InputSystem';

const SECTOR_CLEAR_DESTROYED_GOAL = 1;
const DEBUG_BOSS_SHORTCUTS: Partial<Record<InputAction, BossId>> = {
  debugBossOne: 'boss_auditor_drone_xl',
  debugBossTwo: 'boss_unsold_missiles_carrier',
  debugBossThree: 'boss_bloom_engine'
};

export class GameplayScene implements Scene {
  public readonly id = 'gameplay';

  private combatState: CombatState | null = null;
  private readonly positionReadout: HTMLParagraphElement;
  private readonly hullReadout: HTMLParagraphElement;
  private readonly economyReadout: HTMLParagraphElement;
  private readonly combatReadout: HTMLParagraphElement;
  private readonly bossReadout: HTMLParagraphElement;
  private readonly warningReadout: HTMLParagraphElement;
  private readonly itemReadout: HTMLParagraphElement;
  private sectorCompleted = false;

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly input: InputSystem,
    private readonly run: RunSkeleton,
    private readonly contract: StartingContract,
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

    this.hullReadout = document.createElement('p');
    this.hullReadout.className = 'hud-pill';
    this.hullReadout.dataset.testid = 'hull-readout';

    this.economyReadout = document.createElement('p');
    this.economyReadout.className = 'hud-pill';
    this.economyReadout.dataset.testid = 'pickup-readout';

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
  }

  public enter(): void {
    this.getCombatState();

    const hud = document.createElement('section');
    hud.className = 'game-hud';
    hud.setAttribute('aria-label', 'Run status');

    const sector = document.createElement('p');
    sector.className = 'hud-pill';
    sector.textContent = this.getCurrentSectorName();

    const contract = document.createElement('p');
    contract.className = 'hud-pill';
    contract.textContent = this.contract.shipName;

    const weapon = document.createElement('p');
    weapon.className = 'hud-pill';
    weapon.textContent = 'Space: Fire';

    hud.append(
      sector,
      this.hullReadout,
      this.economyReadout,
      this.combatReadout,
      this.bossReadout,
      this.warningReadout,
      this.itemReadout,
      contract,
      weapon,
      this.positionReadout
    );
    this.uiRoot.replaceChildren(hud);
    this.syncReadouts();
  }

  public update(dt: number): void {
    const state = this.getCombatState();
    const feedbackBefore = createCombatFeedbackSnapshot(state);
    const result = updateCombatState(
      state,
      {
        movement: this.input.getMovementAxis(),
        fire: this.input.isActionPressed('fire')
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

    if (!this.sectorCompleted && state.stats.enemiesDestroyed >= SECTOR_CLEAR_DESTROYED_GOAL) {
      this.sectorCompleted = true;
      this.emitFeedback(['sectorClear']);
      this.onSectorComplete(forceCombatEnd(state, 'sectorComplete'));
    }
  }

  public render(renderer: CanvasRenderer, _alpha: number): void {
    const state = this.getCombatState();

    renderer.paintBackground();
    renderer.beginGameplayLayer();
    renderer.paintGameplayFrame();

    for (const pickup of state.pickups) {
      renderer.paintPickup(pickup);
    }

    for (const telegraph of state.telegraphs) {
      renderer.paintTelegraph(telegraph);
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
  }

  public getRunResult(reason: 'abandoned' | 'debug' = 'abandoned'): CombatRunResult {
    return forceCombatEnd(this.getCombatState(), reason);
  }

  public getDebugState(): { seed: string; entityCount: number } {
    return { seed: this.run.seed, entityCount: getCombatEntityCount(this.getCombatState()) };
  }

  private getCombatState(): CombatState {
    this.combatState ??= createCombatState(this.getCombatBounds(), this.getCombatSeed(), {
      weaponId: this.contract.startingWeaponId,
      items: this.itemLoadout,
      bossId: this.run.sectors[this.sectorIndex]?.bossId
    });
    return this.combatState;
  }

  private getCurrentSectorName(): string {
    return this.run.sectors[this.sectorIndex]?.sectorName ?? 'Outer Debris Field';
  }

  private syncReadouts(): void {
    const state = this.getCombatState();

    this.positionReadout.textContent = `Player ${Math.round(state.player.x)},${Math.round(
      state.player.y
    )}`;
    this.hullReadout.textContent = `Hull ${state.player.hull}/${state.player.maxHull}`;
    this.economyReadout.textContent = `Credits ${this.startingCredits + state.player.credits} | Salvage ${this.startingSalvage + state.player.salvage}`;
    this.combatReadout.textContent = `Destroyed ${state.stats.enemiesDestroyed} | Shots ${state.stats.shotsFired} | Hooks ${state.stats.itemTriggers}`;
    this.bossReadout.textContent = state.boss
      ? `${state.boss.name} ${Math.max(0, state.boss.hull)}/${state.boss.maxHull}`
      : `Boss ${this.getCurrentBossName()}`;
    this.warningReadout.textContent = state.telegraphs[0]?.label ?? 'Warning clear';
    this.itemReadout.textContent = describeItemLoadout(state.items);
  }

  private getCombatSeed(): string {
    const sector = this.run.sectors[this.sectorIndex];
    return `${this.run.seed}:combat:${sector?.sectorId ?? this.sectorIndex + 1}`;
  }

  private getCurrentBossName(): string {
    return this.run.sectors[this.sectorIndex]?.bossName ?? 'unassigned';
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
