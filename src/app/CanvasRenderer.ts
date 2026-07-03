import { clamp } from '../core/math';
import { generateStarfield, type Star, starCountForViewport } from '../core/starfield';

const BACKGROUND_SEED = 'STARBREAK-SALVAGE-SHELL';

export interface RenderSize {
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
}

export interface PlayerRenderState {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly thrust: number;
  readonly invulnerable?: boolean;
}

export interface EnemyRenderState {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly hull: number;
  readonly maxHull: number;
}

export interface ProjectileRenderState {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly owner: 'player' | 'enemy';
}

export interface PickupRenderState {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly kind: 'credit' | 'salvage';
}

export class CanvasRenderer {
  private readonly context: CanvasRenderingContext2D;
  private size: RenderSize = { width: 1, height: 1, dpr: 1 };
  private starCache: Star[] = [];
  private starCacheKey = '';

  public constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas 2D rendering is unavailable.');
    }

    this.context = context;
    this.canvas.className = 'game-canvas';
    this.canvas.setAttribute('aria-label', 'Starbreak Salvage playfield');
    this.canvas.setAttribute('role', 'img');
  }

  public getSize(): RenderSize {
    return this.size;
  }

  public resizeToDisplay(): void {
    const ownerWindow = this.canvas.ownerDocument.defaultView ?? window;
    const dpr = Math.min(ownerWindow.devicePixelRatio || 1, 2);
    const width = Math.max(320, Math.floor(ownerWindow.innerWidth));
    const height = Math.max(240, Math.floor(ownerWindow.innerHeight));
    const pixelWidth = Math.floor(width * dpr);
    const pixelHeight = Math.floor(height * dpr);

    if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      this.size = { width, height, dpr };
      this.starCacheKey = '';
    }

    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  public paintBackground(): void {
    const { width, height } = this.size;
    const context = this.context;
    const background = context.createLinearGradient(0, 0, width, height);

    background.addColorStop(0, '#040612');
    background.addColorStop(0.48, '#11101f');
    background.addColorStop(0.72, '#181026');
    background.addColorStop(1, '#201018');
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    this.paintNebula();
    this.paintStars();
    this.paintHorizonGrid();
  }

  public paintGameplayFrame(): void {
    const { width, height } = this.size;
    const context = this.context;
    const inset = 18;

    context.save();
    context.globalAlpha = 0.5;
    context.strokeStyle = '#7cf7ff';
    context.lineWidth = 1;
    context.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
    context.globalAlpha = 0.16;
    context.strokeStyle = '#ffd166';

    for (let y = height - 80; y > 80; y -= 72) {
      context.beginPath();
      context.moveTo(inset, y);
      context.lineTo(width - inset, y - 18);
      context.stroke();
    }

    context.restore();
  }

  public paintPlayerShip(player: PlayerRenderState): void {
    const context = this.context;
    const thrust = clamp(player.thrust, 0, 1);

    context.save();
    context.translate(player.x, player.y);
    context.globalAlpha = player.invulnerable ? 0.62 : 1;

    context.globalAlpha = 0.35 + thrust * 0.45;
    context.fillStyle = '#ffd166';
    context.beginPath();
    context.moveTo(-player.radius * 0.48, player.radius * 0.68);
    context.lineTo(0, player.radius * (1.35 + thrust * 0.45));
    context.lineTo(player.radius * 0.48, player.radius * 0.68);
    context.closePath();
    context.fill();

    context.globalAlpha = 1;
    context.fillStyle = '#7cf7ff';
    context.strokeStyle = '#f8fbff';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, -player.radius);
    context.lineTo(player.radius * 0.82, player.radius * 0.78);
    context.lineTo(0, player.radius * 0.36);
    context.lineTo(-player.radius * 0.82, player.radius * 0.78);
    context.closePath();
    context.fill();
    context.stroke();

    context.fillStyle = '#ff6bd6';
    context.beginPath();
    context.arc(0, player.radius * 0.2, Math.max(2.5, player.radius * 0.18), 0, Math.PI * 2);
    context.fill();

    context.restore();
  }

  public paintEnemy(enemy: EnemyRenderState): void {
    const context = this.context;
    const healthRatio = clamp(enemy.hull / enemy.maxHull, 0, 1);

    context.save();
    context.translate(enemy.x, enemy.y);

    context.fillStyle = '#ff6b6b';
    context.strokeStyle = '#ffd166';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, enemy.radius);
    context.lineTo(enemy.radius * 0.86, -enemy.radius * 0.48);
    context.lineTo(enemy.radius * 0.28, -enemy.radius * 0.25);
    context.lineTo(0, -enemy.radius);
    context.lineTo(-enemy.radius * 0.28, -enemy.radius * 0.25);
    context.lineTo(-enemy.radius * 0.86, -enemy.radius * 0.48);
    context.closePath();
    context.fill();
    context.stroke();

    context.fillStyle = '#19101f';
    context.fillRect(-enemy.radius, enemy.radius + 6, enemy.radius * 2, 4);
    context.fillStyle = '#7cf7ff';
    context.fillRect(-enemy.radius, enemy.radius + 6, enemy.radius * 2 * healthRatio, 4);

    context.restore();
  }

  public paintProjectile(projectile: ProjectileRenderState): void {
    const context = this.context;

    context.save();
    context.translate(projectile.x, projectile.y);

    if (projectile.owner === 'player') {
      context.fillStyle = '#7cf7ff';
      context.shadowColor = '#7cf7ff';
    } else {
      context.fillStyle = '#ff6bd6';
      context.shadowColor = '#ff6bd6';
    }

    context.shadowBlur = 10;
    context.beginPath();
    context.arc(0, 0, projectile.radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  public paintPickup(pickup: PickupRenderState): void {
    const context = this.context;

    context.save();
    context.translate(pickup.x, pickup.y);
    context.rotate(Math.PI / 4);
    context.fillStyle = pickup.kind === 'credit' ? '#ffd166' : '#7cf7ff';
    context.strokeStyle = '#f8fbff';
    context.lineWidth = 1.5;
    context.fillRect(-pickup.radius, -pickup.radius, pickup.radius * 2, pickup.radius * 2);
    context.strokeRect(-pickup.radius, -pickup.radius, pickup.radius * 2, pickup.radius * 2);
    context.restore();
  }

  public paintDimmer(alpha: number): void {
    const { width, height } = this.size;

    this.context.save();
    this.context.globalAlpha = clamp(alpha, 0, 1);
    this.context.fillStyle = '#03050d';
    this.context.fillRect(0, 0, width, height);
    this.context.restore();
  }

  private paintNebula(): void {
    const { width, height } = this.size;
    const cyanWash = this.context.createRadialGradient(
      width * 0.2,
      height * 0.24,
      0,
      width * 0.2,
      height * 0.24,
      width * 0.72
    );

    cyanWash.addColorStop(0, 'rgba(65, 234, 255, 0.18)');
    cyanWash.addColorStop(1, 'rgba(65, 234, 255, 0)');
    this.context.fillStyle = cyanWash;
    this.context.fillRect(0, 0, width, height);

    const roseWash = this.context.createRadialGradient(
      width * 0.84,
      height * 0.56,
      0,
      width * 0.84,
      height * 0.56,
      width * 0.58
    );

    roseWash.addColorStop(0, 'rgba(255, 85, 188, 0.12)');
    roseWash.addColorStop(1, 'rgba(255, 85, 188, 0)');
    this.context.fillStyle = roseWash;
    this.context.fillRect(0, 0, width, height);
  }

  private paintStars(): void {
    const { width, height } = this.size;
    const cacheKey = `${width}:${height}`;

    if (cacheKey !== this.starCacheKey) {
      this.starCache = generateStarfield({
        width,
        height,
        count: starCountForViewport(width, height),
        seed: BACKGROUND_SEED
      });
      this.starCacheKey = cacheKey;
    }

    for (const star of this.starCache) {
      this.context.globalAlpha = star.alpha;
      this.context.fillStyle = star.tint;
      this.context.beginPath();
      this.context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.context.fill();
    }

    this.context.globalAlpha = 1;
  }

  private paintHorizonGrid(): void {
    const { width, height } = this.size;
    const horizon = height * 0.64;

    this.context.save();
    this.context.globalAlpha = 0.16;
    this.context.strokeStyle = '#ffd166';
    this.context.lineWidth = Math.max(1, width / 1200);

    for (let index = 0; index < 9; index += 1) {
      const y = horizon + index * index * height * 0.008;
      this.context.beginPath();
      this.context.moveTo(0, y);
      this.context.lineTo(width, y);
      this.context.stroke();
    }

    this.context.restore();
  }
}
