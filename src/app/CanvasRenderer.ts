import { getBossById, type BossId } from '../content/bosses';
import { getFactionById, type FactionId } from '../content/factions';
import type { BulletContrast } from '../core/settingsData';
import { clamp } from '../core/math';
import {
  advanceScreenShake,
  getScreenShakeOffset,
  IDLE_SCREEN_SHAKE,
  triggerScreenShake,
  type ScreenShakeState
} from '../core/screenShake';
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
  readonly factionId: FactionId;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly hull: number;
  readonly maxHull: number;
}

export interface BossRenderState {
  readonly bossId: BossId;
  readonly factionId: FactionId;
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
  readonly factionId?: FactionId;
}

export interface TelegraphRenderState {
  readonly kind: 'fan' | 'lane' | 'ring';
  readonly factionId: FactionId;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly width: number;
  readonly height: number;
  readonly ttl: number;
  readonly maxTtl: number;
}

export interface PickupRenderState {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly kind: 'credit' | 'salvage';
}

export interface CombatEffectRenderState {
  readonly kind: 'special' | 'bomb' | 'graze';
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly ttl: number;
  readonly maxTtl: number;
}

export interface RendererSettings {
  readonly reducedMotion: boolean;
  readonly screenShake: number;
  readonly bulletContrast: BulletContrast;
  readonly performanceMode: boolean;
}

export function getCombatEffectRenderRadius(
  effect: Pick<CombatEffectRenderState, 'radius' | 'ttl' | 'maxTtl'>,
  reducedMotion: boolean
): number {
  if (reducedMotion) {
    return effect.radius * 0.72;
  }

  const progress = 1 - clamp(effect.ttl / effect.maxTtl, 0, 1);
  return effect.radius * (0.38 + progress * 0.62);
}

export class CanvasRenderer {
  private readonly context: CanvasRenderingContext2D;
  private size: RenderSize = { width: 1, height: 1, dpr: 1 };
  private starCache: Star[] = [];
  private starCacheKey = '';
  private shakeState: ScreenShakeState = IDLE_SCREEN_SHAKE;
  private settings: RendererSettings = {
    reducedMotion: false,
    screenShake: 0.35,
    bulletContrast: 'standard',
    performanceMode: false
  };

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

  public setSettings(settings: RendererSettings): void {
    this.settings = settings;
    this.starCacheKey = '';

    if (settings.reducedMotion || settings.screenShake <= 0) {
      this.shakeState = IDLE_SCREEN_SHAKE;
    }
  }

  public updateEffects(dt: number): void {
    this.shakeState = advanceScreenShake(this.shakeState, dt);
  }

  public triggerShake(intensity: number): void {
    this.shakeState = triggerScreenShake(this.shakeState, this.settings, intensity);
  }

  public beginGameplayLayer(): void {
    const offset = getScreenShakeOffset(this.shakeState);

    this.context.save();
    this.context.translate(offset.x, offset.y);
  }

  public endGameplayLayer(): void {
    this.context.restore();
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

    context.globalAlpha = this.settings.reducedMotion ? 0.28 : 0.35 + thrust * 0.45;
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
    const faction = getFactionById(enemy.factionId);

    context.save();
    context.translate(enemy.x, enemy.y);

    context.fillStyle = faction.palette.hull;
    context.strokeStyle = faction.palette.trim;
    context.lineWidth = 2;

    if (faction.visualShape === 'diamond') {
      context.beginPath();
      context.moveTo(0, -enemy.radius);
      context.lineTo(enemy.radius, 0);
      context.lineTo(0, enemy.radius);
      context.lineTo(-enemy.radius, 0);
      context.closePath();
      context.fill();
      context.stroke();
      context.strokeRect(
        -enemy.radius * 0.44,
        -enemy.radius * 0.44,
        enemy.radius * 0.88,
        enemy.radius * 0.88
      );
    } else if (faction.visualShape === 'organic') {
      for (let index = 0; index < 5; index += 1) {
        const angle = (Math.PI * 2 * index) / 5;
        context.beginPath();
        context.arc(
          Math.cos(angle) * enemy.radius * 0.42,
          Math.sin(angle) * enemy.radius * 0.38,
          enemy.radius * 0.46,
          0,
          Math.PI * 2
        );
        context.fill();
        context.stroke();
      }
    } else {
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
    }

    context.fillStyle = '#19101f';
    context.fillRect(-enemy.radius, enemy.radius + 6, enemy.radius * 2, 4);
    context.fillStyle = faction.palette.trim;
    context.fillRect(-enemy.radius, enemy.radius + 6, enemy.radius * 2 * healthRatio, 4);

    context.restore();
  }

  public paintBoss(boss: BossRenderState): void {
    const context = this.context;
    const healthRatio = clamp(boss.hull / boss.maxHull, 0, 1);
    const bossDefinition = getBossById(boss.bossId);
    const faction = getFactionById(boss.factionId);

    context.save();
    context.translate(boss.x, boss.y);
    context.shadowBlur = 20;
    context.shadowColor = faction.palette.hull;
    context.fillStyle = faction.palette.hull;
    context.strokeStyle = faction.palette.trim;
    context.lineWidth = 3;

    if (bossDefinition.patternId === 'sporeSpiral') {
      for (let index = 0; index < 7; index += 1) {
        const angle = (Math.PI * 2 * index) / 7;
        context.beginPath();
        context.ellipse(
          Math.cos(angle) * boss.radius * 0.36,
          Math.sin(angle) * boss.radius * 0.24,
          boss.radius * 0.42,
          boss.radius * 0.28,
          angle,
          0,
          Math.PI * 2
        );
        context.fill();
        context.stroke();
      }
    } else if (bossDefinition.patternId === 'missileCurtain') {
      context.beginPath();
      context.moveTo(0, -boss.radius);
      context.lineTo(boss.radius, -boss.radius * 0.15);
      context.lineTo(boss.radius * 0.72, boss.radius);
      context.lineTo(0, boss.radius * 0.62);
      context.lineTo(-boss.radius * 0.72, boss.radius);
      context.lineTo(-boss.radius, -boss.radius * 0.15);
      context.closePath();
      context.fill();
      context.stroke();
    } else {
      context.beginPath();
      context.rect(-boss.radius, -boss.radius * 0.62, boss.radius * 2, boss.radius * 1.24);
      context.fill();
      context.stroke();
      context.beginPath();
      context.arc(0, 0, boss.radius * 0.5, 0, Math.PI * 2);
      context.stroke();
    }

    context.shadowBlur = 0;
    context.fillStyle = '#060912';
    context.fillRect(-boss.radius, boss.radius + 12, boss.radius * 2, 7);
    context.fillStyle = faction.palette.warning;
    context.fillRect(-boss.radius, boss.radius + 12, boss.radius * 2 * healthRatio, 7);
    context.restore();
  }

  public paintTelegraph(telegraph: TelegraphRenderState): void {
    const context = this.context;
    const faction = getFactionById(telegraph.factionId);
    const alpha = clamp(telegraph.ttl / telegraph.maxTtl, 0.2, 0.85);

    context.save();
    context.globalAlpha = alpha;
    context.strokeStyle = faction.palette.warning;
    context.fillStyle = faction.palette.warning;
    context.lineWidth = 3;
    context.font = '700 12px "Cascadia Mono", Consolas, monospace';
    context.textAlign = 'center';

    if (telegraph.kind === 'lane') {
      context.globalAlpha = alpha * 0.22;
      context.fillRect(
        telegraph.x - telegraph.width / 2,
        telegraph.y,
        telegraph.width,
        telegraph.height
      );
      context.globalAlpha = alpha;
      context.strokeRect(
        telegraph.x - telegraph.width / 2,
        telegraph.y,
        telegraph.width,
        telegraph.height
      );
      context.fillText(telegraph.label, telegraph.x, Math.max(32, telegraph.y - 8));
    } else {
      context.beginPath();
      context.arc(telegraph.x, telegraph.y, telegraph.radius, 0, Math.PI * 2);
      context.stroke();

      if (telegraph.kind === 'fan') {
        context.beginPath();
        context.moveTo(telegraph.x, telegraph.y);
        context.lineTo(telegraph.x - telegraph.radius * 0.92, telegraph.y + telegraph.radius);
        context.moveTo(telegraph.x, telegraph.y);
        context.lineTo(telegraph.x + telegraph.radius * 0.92, telegraph.y + telegraph.radius);
        context.stroke();
      }

      context.fillText(telegraph.label, telegraph.x, telegraph.y + 4);
    }

    context.restore();
  }

  public paintProjectile(projectile: ProjectileRenderState): void {
    const context = this.context;

    context.save();
    context.translate(projectile.x, projectile.y);

    if (projectile.owner === 'player') {
      context.fillStyle = this.settings.bulletContrast === 'high' ? '#ffffff' : '#7cf7ff';
      context.shadowColor = this.settings.bulletContrast === 'high' ? '#ffffff' : '#7cf7ff';
    } else {
      const faction = projectile.factionId ? getFactionById(projectile.factionId) : null;
      context.fillStyle =
        this.settings.bulletContrast === 'high'
          ? '#ffef5f'
          : (faction?.palette.projectile ?? '#ff6bd6');
      context.shadowColor =
        this.settings.bulletContrast === 'high'
          ? '#ffef5f'
          : (faction?.palette.projectile ?? '#ff6bd6');
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

  public paintCombatEffect(effect: CombatEffectRenderState): void {
    const context = this.context;
    const alpha = clamp(effect.ttl / effect.maxTtl, 0, 1);
    const radius = getCombatEffectRenderRadius(effect, this.settings.reducedMotion);
    const color =
      effect.kind === 'bomb' ? '#ffd166' : effect.kind === 'special' ? '#7cf7ff' : '#ff6bd6';

    context.save();
    context.translate(effect.x, effect.y);
    context.globalAlpha = effect.kind === 'graze' ? alpha * 0.78 : alpha * 0.62;
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = effect.kind === 'bomb' ? 4 : 2;
    context.shadowColor = color;
    context.shadowBlur = this.settings.reducedMotion ? 0 : 14;
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.stroke();

    if (effect.kind === 'graze') {
      context.globalAlpha = alpha;
      context.beginPath();
      context.arc(0, 0, 3.5, 0, Math.PI * 2);
      context.fill();
    } else if (effect.kind === 'special') {
      context.globalAlpha = alpha * 0.28;
      context.beginPath();
      context.arc(0, 0, Math.max(8, radius * 0.42), 0, Math.PI * 2);
      context.fill();
    }

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
    const cacheKey = `${width}:${height}:${this.settings.performanceMode}`;

    if (cacheKey !== this.starCacheKey) {
      const count = starCountForViewport(width, height);
      this.starCache = generateStarfield({
        width,
        height,
        count: this.settings.performanceMode ? Math.max(24, Math.floor(count * 0.55)) : count,
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
