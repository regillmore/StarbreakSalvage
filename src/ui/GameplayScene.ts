import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene } from '../app/Scene';
import { clamp } from '../core/math';
import type { InputSystem, InputAction } from '../systems/InputSystem';

const PLAYER_RADIUS = 18;
const PLAYER_SPEED = 360;
const PLACEHOLDER_SEED = 'STARBREAK-SMOKE';

export class GameplayScene implements Scene {
  public readonly id = 'gameplay';

  private playerX = 0;
  private playerY = 0;
  private thrust = 0;
  private readonly positionReadout: HTMLParagraphElement;

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly input: InputSystem,
    private readonly onPause: (scene: GameplayScene) => void
  ) {
    this.positionReadout = document.createElement('p');
    this.positionReadout.className = 'sr-only';
    this.positionReadout.dataset.testid = 'player-position';
  }

  public enter(): void {
    const size = this.getViewportSize();
    this.playerX = this.playerX || size.width / 2;
    this.playerY = this.playerY || size.height * 0.78;

    const hud = document.createElement('section');
    hud.className = 'game-hud';
    hud.setAttribute('aria-label', 'Run status');

    const sector = document.createElement('p');
    sector.className = 'hud-pill';
    sector.textContent = 'Outer Debris Field';

    const hull = document.createElement('p');
    hull.className = 'hud-pill';
    hull.textContent = 'Hull 3';

    const contract = document.createElement('p');
    contract.className = 'hud-pill';
    contract.textContent = 'Debt Runner';

    hud.append(sector, hull, contract, this.positionReadout);
    this.uiRoot.replaceChildren(hud);
    this.syncPositionReadout();
  }

  public update(dt: number): void {
    const size = this.getViewportSize();
    const axis = this.input.getMovementAxis();

    this.playerX = clamp(this.playerX + axis.x * PLAYER_SPEED * dt, PLAYER_RADIUS + 24, size.width - PLAYER_RADIUS - 24);
    this.playerY = clamp(this.playerY + axis.y * PLAYER_SPEED * dt, PLAYER_RADIUS + 24, size.height - PLAYER_RADIUS - 24);
    this.thrust = Math.max(Math.abs(axis.x), Math.abs(axis.y));
    this.syncPositionReadout();
  }

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
    renderer.paintGameplayFrame();
    renderer.paintPlayerShip({
      x: this.playerX,
      y: this.playerY,
      radius: PLAYER_RADIUS,
      thrust: this.thrust
    });
  }

  public handleAction(action: InputAction): void {
    if (action === 'pause' || action === 'back') {
      this.onPause(this);
    }
  }

  public getDebugState(): { seed: string; entityCount: number } {
    return { seed: PLACEHOLDER_SEED, entityCount: 1 };
  }

  private syncPositionReadout(): void {
    this.positionReadout.textContent = `Player ${Math.round(this.playerX)},${Math.round(this.playerY)}`;
  }

  private getViewportSize(): { width: number; height: number } {
    const ownerWindow = this.uiRoot.ownerDocument.defaultView ?? window;

    return {
      width: Math.max(320, ownerWindow.innerWidth),
      height: Math.max(240, ownerWindow.innerHeight)
    };
  }
}
