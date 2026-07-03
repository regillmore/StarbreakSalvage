import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene } from '../app/Scene';
import {
  createCombatState,
  forceCombatEnd,
  getCombatEntityCount,
  updateCombatState,
  type CombatBounds,
  type CombatRunResult,
  type CombatState
} from '../game/CombatState';
import type { RunSkeleton, StartingContract } from '../game/Generation';
import { describeItemLoadout } from '../game/ItemHooks';
import { generateStartingItemLoadout, type ItemInstance } from '../game/Rewards';
import type { InputSystem, InputAction } from '../systems/InputSystem';

export class GameplayScene implements Scene {
  public readonly id = 'gameplay';

  private combatState: CombatState | null = null;
  private readonly positionReadout: HTMLParagraphElement;
  private readonly hullReadout: HTMLParagraphElement;
  private readonly economyReadout: HTMLParagraphElement;
  private readonly combatReadout: HTMLParagraphElement;
  private readonly itemReadout: HTMLParagraphElement;
  private readonly itemLoadout: readonly ItemInstance[];

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly input: InputSystem,
    private readonly run: RunSkeleton,
    private readonly contract: StartingContract,
    private readonly debugEnabled: boolean,
    private readonly onPause: (scene: GameplayScene) => void,
    private readonly onGameOver: (result: CombatRunResult) => void
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

    this.itemReadout = document.createElement('p');
    this.itemReadout.className = 'hud-pill hud-pill-wide';
    this.itemReadout.dataset.testid = 'item-readout';

    this.itemLoadout = generateStartingItemLoadout(run.seed, contract);
  }

  public enter(): void {
    this.combatState ??= createCombatState(this.getCombatBounds(), this.run.seed, {
      weaponId: this.contract.startingWeaponId,
      items: this.itemLoadout
    });

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
    const result = updateCombatState(
      state,
      {
        movement: this.input.getMovementAxis(),
        fire: this.input.isActionPressed('fire')
      },
      dt,
      this.getCombatBounds()
    );

    this.syncReadouts();

    if (result) {
      this.onGameOver(result);
    }
  }

  public render(renderer: CanvasRenderer, _alpha: number): void {
    const state = this.getCombatState();

    renderer.paintBackground();
    renderer.paintGameplayFrame();

    for (const pickup of state.pickups) {
      renderer.paintPickup(pickup);
    }

    for (const enemy of state.enemies) {
      renderer.paintEnemy(enemy);
    }

    for (const projectile of state.projectiles) {
      renderer.paintProjectile(projectile);
    }

    renderer.paintPlayerShip({
      x: state.player.x,
      y: state.player.y,
      radius: state.player.radius,
      thrust: Math.max(Math.abs(this.input.getMovementAxis().x), Math.abs(this.input.getMovementAxis().y)),
      invulnerable: state.player.invulnerableSeconds > 0
    });
  }

  public handleAction(action: InputAction): void {
    if (action === 'pause' || action === 'back') {
      this.onPause(this);
    }

    if (action === 'debugGameOver' && this.debugEnabled) {
      this.onGameOver(forceCombatEnd(this.getCombatState(), 'debug'));
    }
  }

  public getRunResult(reason: 'abandoned' | 'debug' = 'abandoned'): CombatRunResult {
    return forceCombatEnd(this.getCombatState(), reason);
  }

  public getDebugState(): { seed: string; entityCount: number } {
    return { seed: this.run.seed, entityCount: getCombatEntityCount(this.getCombatState()) };
  }

  private getCombatState(): CombatState {
    this.combatState ??= createCombatState(this.getCombatBounds(), this.run.seed);
    return this.combatState;
  }

  private getCurrentSectorName(): string {
    return this.run.sectors[0]?.sectorName ?? 'Outer Debris Field';
  }

  private syncReadouts(): void {
    const state = this.getCombatState();

    this.positionReadout.textContent = `Player ${Math.round(state.player.x)},${Math.round(
      state.player.y
    )}`;
    this.hullReadout.textContent = `Hull ${state.player.hull}/${state.player.maxHull}`;
    this.economyReadout.textContent = `Credits ${state.player.credits} | Salvage ${state.player.salvage}`;
    this.combatReadout.textContent = `Destroyed ${state.stats.enemiesDestroyed} | Shots ${state.stats.shotsFired} | Hooks ${state.stats.itemTriggers}`;
    this.itemReadout.textContent = describeItemLoadout(state.items);
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
