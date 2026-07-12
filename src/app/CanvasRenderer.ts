import { getBossById, type BossId } from '../content/bosses';
import {
  getEnvironmentObjectById,
  type EnvironmentObjectCollisionShape,
  type EnvironmentObjectId,
  type EnvironmentObjectKind
} from '../content/environmentObjects';
import { getFactionById, type FactionId } from '../content/factions';
import { getEnemyFormationById, type EnemyFormationId } from '../content/enemyFormations';
import { getEnemyVariantById, type EnemyVariantId } from '../content/enemyVariants';
import { getHazardZoneColor } from '../content/hazardZones';
import type { ShipAppearance, ShipSilhouette, ShipWeaponMountHint } from '../content/ships';
import type { BulletContrast } from '../core/settingsData';
import { clamp } from '../core/math';
import type {
  BackgroundLayerPlan,
  BackgroundPlan,
  BackgroundPrimitive
} from '../game/BackgroundPlan';
import {
  getSectorHazardCollisionRect,
  getSectorHazardVisualState,
  type ActiveSectorHazard,
  type SectorHazardCollisionRect,
  type SectorHazardVisualState,
  type VisibleSectorLandmark
} from '../game/SectorFeatures';
import type { SectorExitPresentation } from '../game/SectorExitSequence';
import {
  advanceScreenShake,
  getScreenShakeOffset,
  IDLE_SCREEN_SHAKE,
  triggerScreenShake,
  type ScreenShakeState
} from '../core/screenShake';
import { generateStarfield, type Star, starCountForViewport } from '../core/starfield';
import { createDefaultCombatBounds } from '../game/CombatGeometry';
import type { CombatBounds } from '../game/CombatState';
import {
  getActiveBeamBoltSegment,
  getWorldAnchoredBeamTrack,
  type BeamHazardSegment
} from '../game/BeamHazard';
import { getPlayerShipCueState, type PlayerShipCueState } from './ShipCombatCues';
import { calculateViewportLayout, type ViewportLayout } from './ViewportLayout';
import type { PlayerDestructionPresentation } from '../game/PlayerDestruction';
import {
  getSetPieceComponentTemplate,
  type SetPieceCollisionShape,
  type SetPieceComponentKind,
  type SetPieceComponentTemplateId
} from '../content/setPieces';
import type { BoardingOperationPlan } from '../game/BoardingOperation';

const BACKGROUND_SEED = 'STARBREAK-SALVAGE-SHELL';
const DEFAULT_PLAYER_SHIP_APPEARANCE: ShipAppearance = {
  silhouette: 'needle',
  primaryColor: '#59f2ff',
  secondaryColor: '#12324a',
  trimColor: '#f8fbff',
  engineColor: '#ffd166',
  cockpitAccent: '#ff6bd6',
  weaponMounts: ['nose', 'wing'],
  hudThemeKey: 'redline'
};

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
  readonly appearance?: ShipAppearance;
  readonly invulnerable?: boolean;
  readonly hull?: number;
  readonly maxHull?: number;
  readonly invulnerableSeconds?: number;
  readonly specialCharge?: number;
  readonly maxSpecialCharge?: number;
  readonly specialCooldown?: number;
  readonly specialActiveSeconds?: number;
  readonly bombs?: number;
  readonly maxBombs?: number;
  readonly bombCooldown?: number;
  readonly weaponHeat?: number;
  readonly weaponOverheatLimit?: number;
  readonly weaponOverheatSeconds?: number;
  readonly scale?: number;
  readonly alpha?: number;
  readonly departureActive?: boolean;
  readonly departureExhaustScale?: number;
  readonly departureSpeedLineAlpha?: number;
}

export interface EnemyRenderState {
  readonly factionId: FactionId;
  readonly variantId?: EnemyVariantId | null;
  readonly formationId?: EnemyFormationId | null;
  readonly formationLabel?: string | null;
  readonly formationMemberIndex?: number | null;
  readonly formationMemberCount?: number | null;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly hull: number;
  readonly maxHull: number;
  readonly rivalName?: string | null;
  readonly rivalTitle?: string | null;
  readonly rivalShipName?: string | null;
}

export interface AllyRenderState {
  readonly source?: 'crew' | 'fleet';
  readonly callsign: string;
  readonly role: string;
  readonly cue: {
    readonly glyph: string;
    readonly color: string;
    readonly highContrastGlyph: string;
  };
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly hull: number;
  readonly maxHull: number;
  readonly status: 'active' | 'injured' | 'retreated';
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
  readonly owner: 'player' | 'ally' | 'enemy';
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

export interface EnvironmentObjectRenderState {
  readonly definitionId: EnvironmentObjectId;
  readonly kind: EnvironmentObjectKind;
  readonly collisionShape: EnvironmentObjectCollisionShape;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly hull: number;
  readonly maxHull: number;
  readonly hitFlashSeconds: number;
  readonly debugLabel: string;
  readonly mineFuseSeconds: number | null;
  readonly mineFuseDurationSeconds: number;
  readonly mineTriggerSource: 'proximity' | 'damage' | 'chain' | null;
}

export interface SetPieceComponentRenderState {
  readonly templateId: SetPieceComponentTemplateId;
  readonly kind: SetPieceComponentKind;
  readonly collisionShape: SetPieceCollisionShape;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly hull: number;
  readonly maxHull: number;
  readonly targetable: boolean;
  readonly hitFlashSeconds: number;
}

export interface CombatEffectRenderState {
  readonly kind:
    'special' | 'bomb' | 'graze' | 'environmentHit' | 'environmentBreak' | 'chainReaction';
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

export interface VelocityCueState {
  readonly parallaxScale: number;
  readonly streakCount: number;
  readonly streakAlpha: number;
  readonly frameAlpha: number;
  readonly frameRailAlpha: number;
  readonly engineWakeAlpha: number;
  readonly pickupTrailAlpha: number;
  readonly impactStreakAlpha: number;
  readonly highContrastProjectiles: boolean;
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

export function getVelocityCueState(settings: RendererSettings): VelocityCueState {
  if (settings.reducedMotion) {
    return {
      parallaxScale: 0,
      streakCount: 0,
      streakAlpha: 0,
      frameAlpha: 0.42,
      frameRailAlpha: 0.04,
      engineWakeAlpha: 0.18,
      pickupTrailAlpha: 0,
      impactStreakAlpha: 0.18,
      highContrastProjectiles: settings.bulletContrast === 'high'
    };
  }

  const performanceScale = settings.performanceMode ? 0.62 : 1;
  const contrastScale = settings.bulletContrast === 'high' ? 0.58 : 1;

  return {
    parallaxScale: settings.performanceMode ? 0.82 : 1.14,
    streakCount: settings.performanceMode ? 9 : 22,
    streakAlpha: roundCueValue(0.24 * performanceScale * contrastScale),
    frameAlpha: roundCueValue(0.58 * performanceScale),
    frameRailAlpha: roundCueValue(0.18 * performanceScale * contrastScale),
    engineWakeAlpha: roundCueValue(0.78 * performanceScale),
    pickupTrailAlpha: roundCueValue(0.48 * performanceScale * contrastScale),
    impactStreakAlpha: roundCueValue(0.64 * performanceScale * contrastScale),
    highContrastProjectiles: settings.bulletContrast === 'high'
  };
}

export class CanvasRenderer {
  private readonly context: CanvasRenderingContext2D;
  private size: RenderSize = { width: 1, height: 1, dpr: 1 };
  private viewportLayout: ViewportLayout = calculateViewportLayout(this.size);
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

  public getViewportLayout(): ViewportLayout {
    return this.viewportLayout;
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
    const frame = this.viewportLayout.gameplaySafeFrame;
    const scale = this.viewportLayout.canvasScale;

    this.context.save();
    this.context.translate(frame.x + offset.x, frame.y + offset.y);
    this.context.scale(scale, scale);
  }

  public endGameplayLayer(): void {
    this.context.restore();
  }

  public resizeToDisplay(): void {
    const ownerWindow = this.canvas.ownerDocument.defaultView ?? window;
    const viewportLayout = calculateViewportLayout({
      width: ownerWindow.innerWidth,
      height: ownerWindow.innerHeight,
      dpr: ownerWindow.devicePixelRatio || 1
    });
    const { dpr, width, height } = viewportLayout;
    const pixelWidth = Math.floor(width * dpr);
    const pixelHeight = Math.floor(height * dpr);

    if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
      this.starCacheKey = '';
    }

    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.size = { width, height, dpr };
    this.viewportLayout = viewportLayout;
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  public paintBackground(scrollOffset = 0, backgroundPlan?: BackgroundPlan): void {
    const { width, height } = this.size;
    const context = this.context;
    const velocityCues = getVelocityCueState(this.settings);
    const effectiveScrollOffset = scrollOffset * velocityCues.parallaxScale;

    if (backgroundPlan) {
      this.paintGeneratedBackground(backgroundPlan, effectiveScrollOffset);
      return;
    }

    const background = context.createLinearGradient(0, 0, width, height);

    background.addColorStop(0, '#040612');
    background.addColorStop(0.48, '#11101f');
    background.addColorStop(0.72, '#181026');
    background.addColorStop(1, '#201018');
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    this.paintNebula();
    this.paintStars(effectiveScrollOffset);
    this.paintHorizonGrid(effectiveScrollOffset);
    this.paintVelocityStreaks(effectiveScrollOffset);
  }

  public paintSectorLandmarks(
    landmarks: readonly VisibleSectorLandmark[],
    bounds: CombatBounds = createDefaultCombatBounds()
  ): void {
    const { width, height } = bounds;
    const context = this.context;
    const alphaScale =
      (this.settings.performanceMode ? 0.78 : 1) * (this.settings.reducedMotion ? 0.82 : 1);

    for (const visible of landmarks) {
      const landmarkWidth = Math.max(54, visible.landmark.widthRatio * width);
      const landmarkHeight = Math.max(34, visible.landmark.heightRatio * height);

      context.save();
      context.translate(visible.landmark.xRatio * width, visible.y);
      context.globalAlpha = clamp(visible.alpha * alphaScale, 0, 0.68);
      context.fillStyle = '#263247';
      context.strokeStyle = '#7cf7ff';
      context.lineWidth = 1.4;
      this.paintSectorLandmarkShape(visible.landmark.kind, landmarkWidth, landmarkHeight);
      context.restore();
    }
  }

  public paintBoardingInterior(
    operation: BoardingOperationPlan,
    distance: number,
    bounds: CombatBounds = createDefaultCombatBounds()
  ): void {
    const context = this.context;
    const railWidth = Math.max(24, bounds.width * 0.09);
    const highContrast = this.settings.bulletContrast === 'high';
    context.save();
    context.fillStyle = highContrast ? 'rgba(0, 0, 0, 0.82)' : 'rgba(5, 13, 20, 0.72)';
    context.fillRect(0, 0, railWidth, bounds.height);
    context.fillRect(bounds.width - railWidth, 0, railWidth, bounds.height);
    context.strokeStyle = highContrast ? '#ffffff' : '#54d8df';
    context.lineWidth = highContrast ? 2.5 : 1.4;
    context.setLineDash([16, 10]);
    context.beginPath();
    context.moveTo(railWidth, 0);
    context.lineTo(railWidth, bounds.height);
    context.moveTo(bounds.width - railWidth, 0);
    context.lineTo(bounds.width - railWidth, bounds.height);
    context.stroke();
    context.setLineDash([]);

    for (const door of operation.doors) {
      const y = bounds.height - (door.atDistance - distance) * 0.82;
      if (y < -32 || y > bounds.height + 32) continue;
      context.fillStyle = highContrast ? '#000000' : 'rgba(17, 38, 48, 0.9)';
      context.strokeStyle = highContrast ? '#ffec6e' : '#ff9f43';
      context.lineWidth = 3;
      context.fillRect(railWidth, y - 12, bounds.width - railWidth * 2, 24);
      context.strokeRect(railWidth, y - 12, bounds.width - railWidth * 2, 24);
      context.fillStyle = context.strokeStyle;
      context.font = '10px monospace';
      context.textAlign = 'center';
      context.fillText(`${door.lock.toUpperCase()} / ${door.integrity}`, bounds.width / 2, y + 3);
    }

    context.globalAlpha = 0.76;
    context.fillStyle = highContrast ? '#ffffff' : '#8ff7ff';
    context.font = '11px monospace';
    context.textAlign = 'left';
    context.fillText(`BOARDING: ${operation.title.toUpperCase()}`, railWidth + 8, 18);
    context.restore();
  }

  public paintSectorHazards(
    activeHazards: readonly ActiveSectorHazard[],
    bounds: CombatBounds = createDefaultCombatBounds()
  ): void {
    const { height } = bounds;
    const context = this.context;

    for (const activeHazard of activeHazards) {
      if (activeHazard.hazard.kind === 'mine_belt') {
        continue;
      }

      const style = getSectorHazardVisualState(
        activeHazard,
        this.settings.reducedMotion,
        this.settings.performanceMode,
        this.settings.bulletContrast === 'high'
      );
      const color = this.getSectorHazardColor(activeHazard.hazard.kind);

      if (activeHazard.hazard.kind === 'warning_beam') {
        this.paintDirectionalBeamHazard(activeHazard, bounds, color, style);
        continue;
      }

      const rect = getSectorHazardCollisionRect(activeHazard.hazard, bounds);

      context.save();
      context.translate(rect.centerX, height / 2);
      context.scale(style.pulseScale, 1);
      context.translate(-rect.centerX, -height / 2);
      context.fillStyle = color;
      context.strokeStyle = color;
      context.lineWidth = style.lineWidth;
      context.globalAlpha = style.fillAlpha;
      context.fillRect(rect.left, rect.top, rect.width, rect.height);
      context.globalAlpha = style.strokeAlpha;
      context.strokeRect(rect.left, rect.top, rect.width, rect.height);
      this.paintSectorHazardPattern(activeHazard, rect, color, style);
      context.restore();
    }
  }

  public paintSectorExitTransition(
    presentation: SectorExitPresentation,
    bounds: CombatBounds = createDefaultCombatBounds()
  ): void {
    const { width, height } = bounds;
    const context = this.context;
    const alpha = clamp(presentation.transitionAlpha, 0, 1);

    if (alpha <= 0) {
      return;
    }

    const shutterHeight = height * 0.5 * alpha;
    const edgeColor = this.settings.bulletContrast === 'high' ? '#ffffff' : '#7cf7ff';

    context.save();
    context.globalAlpha = Math.min(0.98, 0.82 + alpha * 0.16);
    context.fillStyle = '#040612';
    context.fillRect(0, 0, width, shutterHeight);
    context.fillRect(0, height - shutterHeight, width, shutterHeight);
    context.globalAlpha = (1 - alpha) * 0.5;
    context.strokeStyle = edgeColor;
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(0, shutterHeight);
    context.lineTo(width, shutterHeight);
    context.moveTo(0, height - shutterHeight);
    context.lineTo(width, height - shutterHeight);
    context.stroke();
    context.restore();
  }

  public paintGameplayFrame(): void {
    const { width } = this.size;
    const frame = this.viewportLayout.gameplaySafeFrame;
    const context = this.context;
    const velocityCues = getVelocityCueState(this.settings);

    context.save();
    context.globalAlpha = velocityCues.frameAlpha;
    context.strokeStyle = '#7cf7ff';
    context.lineWidth = 1;
    context.strokeRect(frame.x, frame.y, frame.width, frame.height);
    context.globalAlpha = velocityCues.frameRailAlpha;
    context.strokeStyle = '#ffd166';

    for (let y = frame.y + frame.height - 42; y > frame.y + 42; y -= 72) {
      context.beginPath();
      context.moveTo(frame.x, y);
      context.lineTo(frame.x + frame.width, y - 18);
      context.stroke();
    }

    if (velocityCues.frameRailAlpha > 0.08) {
      const railWidth = Math.min(42, Math.max(18, frame.x + 22));
      const leftRail = context.createLinearGradient(0, 0, railWidth, 0);
      leftRail.addColorStop(0, 'rgba(124, 247, 255, 0.24)');
      leftRail.addColorStop(1, 'rgba(124, 247, 255, 0)');

      const rightRail = context.createLinearGradient(width, 0, width - railWidth, 0);
      rightRail.addColorStop(0, 'rgba(255, 209, 102, 0.2)');
      rightRail.addColorStop(1, 'rgba(255, 209, 102, 0)');

      context.globalAlpha = velocityCues.frameRailAlpha;
      context.fillStyle = leftRail;
      context.fillRect(0, frame.y, railWidth, frame.height);
      context.fillStyle = rightRail;
      context.fillRect(width - railWidth, frame.y, railWidth, frame.height);
    }

    context.restore();
  }

  public paintPlayerShip(player: PlayerRenderState): void {
    const context = this.context;
    const thrust = clamp(player.thrust, 0, 1);
    const departureExhaustScale = Math.max(1, player.departureExhaustScale ?? 1);
    const departureSpeedLineAlpha = clamp(player.departureSpeedLineAlpha ?? 0, 0, 1);
    const velocityCues = getVelocityCueState(this.settings);
    const appearance = player.appearance ?? DEFAULT_PLAYER_SHIP_APPEARANCE;
    const cueState = getPlayerShipCueState(
      {
        appearance,
        thrust,
        hull: player.hull ?? 1,
        maxHull: player.maxHull ?? 1,
        invulnerableSeconds: player.invulnerableSeconds ?? (player.invulnerable ? 0.28 : 0),
        specialCharge: player.specialCharge ?? 0,
        maxSpecialCharge: player.maxSpecialCharge ?? 1,
        specialCooldown: player.specialCooldown ?? 0,
        specialActiveSeconds: player.specialActiveSeconds ?? 0,
        bombs: player.bombs ?? 0,
        maxBombs: player.maxBombs ?? 0,
        bombCooldown: player.bombCooldown ?? 0,
        weaponHeat: player.weaponHeat ?? 0,
        weaponOverheatLimit: player.weaponOverheatLimit ?? 1,
        weaponOverheatSeconds: player.weaponOverheatSeconds ?? 0
      },
      this.settings
    );
    const shipAlpha = cueState.bodyAlpha * clamp(player.alpha ?? 1, 0, 1);

    context.save();
    context.translate(player.x, player.y);
    context.scale(Math.max(0.1, player.scale ?? 1), Math.max(0.1, player.scale ?? 1));

    if (departureSpeedLineAlpha > 0) {
      context.globalAlpha = departureSpeedLineAlpha;
      context.strokeStyle =
        this.settings.bulletContrast === 'high' ? '#ffffff' : appearance.engineColor;
      context.lineWidth = Math.max(1.5, player.radius * 0.09);
      for (const offset of [-1.7, -0.82, 0, 0.82, 1.7]) {
        context.beginPath();
        context.moveTo(offset * player.radius, player.radius * 1.4);
        context.lineTo(
          offset * player.radius * 1.18,
          player.radius * (4.2 + departureExhaustScale * 1.4)
        );
        context.stroke();
      }
    }

    if (!player.departureActive) {
      this.paintPlayerReadinessCues(player.radius, cueState);
    }

    if (velocityCues.engineWakeAlpha > 0 && cueState.wakeAlpha > 0) {
      const wakeLength = cueState.wakeLengthScale * departureExhaustScale;

      context.globalAlpha = velocityCues.engineWakeAlpha * cueState.wakeAlpha * shipAlpha;
      context.strokeStyle = cueState.wakeColor;
      context.lineWidth = Math.max(2, player.radius * 0.12);
      context.beginPath();
      context.moveTo(-player.radius * 0.38, player.radius * 0.72);
      context.lineTo(-player.radius * 0.18, player.radius * (1.42 + wakeLength * 0.7));
      context.moveTo(player.radius * 0.38, player.radius * 0.72);
      context.lineTo(player.radius * 0.18, player.radius * (1.42 + wakeLength * 0.7));
      if (cueState.specialActiveAlpha > 0) {
        context.moveTo(0, player.radius * 0.62);
        context.lineTo(0, player.radius * (1.36 + wakeLength * 0.78));
      }
      context.stroke();
    }

    context.globalAlpha =
      (this.settings.reducedMotion ? 0.2 : 0.28 + thrust * 0.36) *
      (0.62 + cueState.wakeAlpha * 0.38) *
      shipAlpha;
    context.fillStyle = appearance.engineColor;
    context.beginPath();
    context.moveTo(-player.radius * 0.48, player.radius * 0.68);
    context.lineTo(0, player.radius * (1.35 + thrust * 0.45) * departureExhaustScale);
    context.lineTo(player.radius * 0.48, player.radius * 0.68);
    context.closePath();
    context.fill();

    context.globalAlpha = shipAlpha;
    context.fillStyle = appearance.secondaryColor;
    this.tracePlayerShipSilhouette(appearance.silhouette, player.radius * 1.08);
    context.fill();

    context.fillStyle =
      this.settings.bulletContrast === 'high' ? '#f8fbff' : appearance.primaryColor;
    this.tracePlayerShipSilhouette(appearance.silhouette, player.radius * 0.92);
    context.fill();

    context.strokeStyle =
      this.settings.bulletContrast === 'high' ? '#ffef5f' : appearance.trimColor;
    context.lineWidth = 2;
    this.tracePlayerShipSilhouette(appearance.silhouette, player.radius);
    context.stroke();

    if (!player.departureActive) {
      this.paintPlayerDamageCues(appearance.silhouette, player.radius, cueState);
    }

    context.globalAlpha = shipAlpha * (this.settings.bulletContrast === 'high' ? 0.42 : 0.24);
    context.strokeStyle = cueState.hitRingColor;
    context.lineWidth = 1;
    context.beginPath();
    context.arc(0, 0, player.radius, 0, Math.PI * 2);
    context.stroke();

    context.globalAlpha = shipAlpha;
    this.paintPlayerWeaponMounts(appearance.weaponMounts, appearance, player.radius);
    if (!player.departureActive) {
      this.paintPlayerWeaponStress(player.radius, cueState);
    }

    context.fillStyle =
      this.settings.bulletContrast === 'high' ? '#ffffff' : appearance.cockpitAccent;
    context.beginPath();
    context.arc(0, player.radius * 0.2, Math.max(2.5, player.radius * 0.18), 0, Math.PI * 2);
    context.fill();

    context.restore();
  }

  public paintPlayerDestruction(presentation: PlayerDestructionPresentation): void {
    const context = this.context;
    const { center, colors, radius } = presentation;

    context.save();
    context.translate(center.x, center.y);

    if (presentation.shockwaveAlpha > 0) {
      context.globalAlpha = presentation.shockwaveAlpha;
      context.strokeStyle = colors.warning;
      context.lineWidth = presentation.motionMode === 'reduced' ? 1.5 : 2.4;
      context.beginPath();
      context.arc(0, 0, presentation.shockwaveRadius, 0, Math.PI * 2);
      context.stroke();
    }

    if (presentation.failurePulseAlpha > 0) {
      context.globalAlpha = presentation.failurePulseAlpha;
      context.fillStyle = colors.warning;
      this.tracePlayerShipSilhouette(presentation.silhouette, radius * 0.92);
      context.fill();
    }

    context.globalAlpha = 0.74;
    context.strokeStyle = colors.trim;
    context.lineWidth = 1.4;
    this.tracePlayerShipSilhouette(presentation.silhouette, radius * 1.02);
    context.stroke();

    for (const debris of presentation.debris) {
      this.paintPlayerDestructionDebris(debris, center);
    }

    if (presentation.cockpitPulseAlpha > 0) {
      context.globalAlpha = presentation.cockpitPulseAlpha;
      context.strokeStyle = colors.cockpit;
      context.lineWidth = 1.8;
      context.beginPath();
      context.arc(0, radius * 0.16, presentation.cockpitPulseRadius, 0, Math.PI * 2);
      context.stroke();
      context.fillStyle = colors.cockpit;
      context.beginPath();
      context.arc(0, radius * 0.16, Math.max(2.5, radius * 0.16), 0, Math.PI * 2);
      context.fill();
    }

    if (presentation.transponderAlpha > 0) {
      context.globalAlpha = presentation.transponderAlpha;
      context.fillStyle = colors.warning;
      context.font = '700 12px "Trebuchet MS", Arial, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(presentation.transponderText, 0, -radius * 2.35);
    }

    context.restore();
  }

  private paintPlayerDestructionDebris(
    debris: PlayerDestructionPresentation['debris'][number],
    center: PlayerDestructionPresentation['center']
  ): void {
    const context = this.context;
    const half = debris.size / 2;

    context.save();
    context.translate(debris.x - center.x, debris.y - center.y);
    context.rotate(debris.rotation);
    context.globalAlpha = debris.alpha;
    context.fillStyle = debris.color;
    context.strokeStyle = debris.color;
    context.lineWidth = Math.max(1, debris.size * 0.16);

    if (debris.shape === 'engine') {
      context.beginPath();
      context.moveTo(-half, -half * 0.45);
      context.lineTo(half, -half * 0.45);
      context.lineTo(0, half * 1.35);
      context.closePath();
      context.fill();
    } else if (debris.shape === 'cockpit') {
      context.beginPath();
      context.ellipse(0, 0, half * 0.82, half * 1.1, 0.2, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha *= 0.62;
      context.strokeStyle = '#f8fbff';
      context.stroke();
    } else if (debris.shape === 'signal') {
      context.beginPath();
      context.moveTo(-half, 0);
      context.lineTo(half, 0);
      context.moveTo(0, -half);
      context.lineTo(0, half);
      context.stroke();
    } else if (debris.shape === 'trim') {
      context.fillRect(-half * 1.2, -half * 0.28, debris.size * 1.7, half * 0.56);
    } else {
      context.beginPath();
      context.moveTo(-half, -half);
      context.lineTo(half * 1.1, -half * 0.2);
      context.lineTo(half * 0.28, half);
      context.lineTo(-half * 0.9, half * 0.44);
      context.closePath();
      context.fill();
    }

    context.restore();
  }

  private paintPlayerReadinessCues(radius: number, cueState: PlayerShipCueState): void {
    const context = this.context;

    if (cueState.bombReadyAlpha > 0) {
      context.save();
      context.globalAlpha = cueState.bombReadyAlpha;
      context.strokeStyle = cueState.bombColor;
      context.lineWidth = 1.5;
      context.setLineDash([Math.max(5, radius * 0.24), Math.max(4, radius * 0.18)]);
      context.beginPath();
      context.arc(0, 0, radius * 1.34, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }

    if (cueState.specialReadyAlpha > 0 || cueState.specialActiveAlpha > 0) {
      context.save();
      context.globalAlpha = Math.max(cueState.specialReadyAlpha, cueState.specialActiveAlpha);
      context.strokeStyle = cueState.specialColor;
      context.lineWidth = cueState.specialActiveAlpha > 0 ? 2.2 : 1.6;
      context.beginPath();
      context.arc(0, -radius * 0.12, radius * 0.88, Math.PI * 1.08, Math.PI * 1.92);
      context.stroke();
      context.beginPath();
      context.moveTo(-radius * 0.42, -radius * 0.82);
      context.lineTo(-radius * 0.18, -radius * 1.06);
      context.moveTo(radius * 0.42, -radius * 0.82);
      context.lineTo(radius * 0.18, -radius * 1.06);
      context.stroke();
      context.restore();
    }

    if (cueState.invulnerabilityRingAlpha > 0) {
      context.save();
      context.globalAlpha = cueState.invulnerabilityRingAlpha;
      context.strokeStyle = cueState.invulnerabilityColor;
      context.lineWidth = 1.3;
      context.setLineDash([4, 6]);
      context.beginPath();
      context.arc(0, 0, radius * 1.18, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }
  }

  private paintPlayerDamageCues(
    silhouette: ShipSilhouette,
    radius: number,
    cueState: PlayerShipCueState
  ): void {
    if (cueState.damageFlashAlpha <= 0) {
      return;
    }

    const context = this.context;

    context.save();
    context.globalAlpha = cueState.damageFlashAlpha;
    context.fillStyle = cueState.damageColor;
    this.tracePlayerShipSilhouette(silhouette, radius * 0.9);
    context.fill();
    context.strokeStyle = cueState.damageColor;
    context.lineWidth = 1.4;
    context.beginPath();
    context.moveTo(-radius * 0.36, -radius * 0.28);
    context.lineTo(radius * 0.04, radius * 0.08);
    context.lineTo(-radius * 0.14, radius * 0.42);
    context.moveTo(radius * 0.32, -radius * 0.04);
    context.lineTo(radius * 0.08, radius * 0.28);
    context.stroke();
    context.restore();
  }

  private paintPlayerWeaponStress(radius: number, cueState: PlayerShipCueState): void {
    const alpha = Math.max(cueState.heatStressAlpha, cueState.overheatAlpha);

    if (alpha <= 0) {
      return;
    }

    const context = this.context;

    context.save();
    context.globalAlpha = alpha;
    context.strokeStyle = cueState.heatColor;
    context.lineWidth = cueState.overheatAlpha > 0 ? 2.4 : 1.7;
    if (cueState.overheatAlpha > 0) {
      context.setLineDash([3, 4]);
    }
    context.beginPath();
    context.moveTo(-radius * 0.72, -radius * 0.04);
    context.lineTo(-radius * 0.92, radius * 0.36);
    context.moveTo(radius * 0.72, -radius * 0.04);
    context.lineTo(radius * 0.92, radius * 0.36);
    context.moveTo(-radius * 0.18, -radius * 0.9);
    context.lineTo(radius * 0.18, -radius * 0.9);
    context.stroke();
    context.restore();
  }

  private tracePlayerShipSilhouette(silhouette: ShipSilhouette, radius: number): void {
    const context = this.context;

    context.beginPath();

    switch (silhouette) {
      case 'chapel':
        context.moveTo(0, -radius * 1.08);
        context.lineTo(radius * 0.62, -radius * 0.18);
        context.lineTo(radius * 0.48, radius * 0.76);
        context.lineTo(0, radius * 0.46);
        context.lineTo(-radius * 0.48, radius * 0.76);
        context.lineTo(-radius * 0.62, -radius * 0.18);
        break;
      case 'ordnance':
        context.moveTo(0, -radius * 0.9);
        context.lineTo(radius * 0.9, -radius * 0.28);
        context.lineTo(radius * 0.72, radius * 0.84);
        context.lineTo(radius * 0.22, radius * 0.58);
        context.lineTo(0, radius * 0.82);
        context.lineTo(-radius * 0.22, radius * 0.58);
        context.lineTo(-radius * 0.72, radius * 0.84);
        context.lineTo(-radius * 0.9, -radius * 0.28);
        break;
      case 'phase':
        context.moveTo(0, -radius * 1.05);
        context.lineTo(radius * 0.74, -radius * 0.1);
        context.lineTo(radius * 0.34, radius * 0.18);
        context.lineTo(radius * 0.62, radius * 0.9);
        context.lineTo(0, radius * 0.34);
        context.lineTo(-radius * 0.62, radius * 0.9);
        context.lineTo(-radius * 0.34, radius * 0.18);
        context.lineTo(-radius * 0.74, -radius * 0.1);
        break;
      case 'bulwark':
        context.moveTo(0, -radius * 0.88);
        context.lineTo(radius * 0.96, -radius * 0.04);
        context.lineTo(radius * 0.72, radius * 0.68);
        context.lineTo(radius * 0.18, radius * 0.92);
        context.lineTo(0, radius * 0.64);
        context.lineTo(-radius * 0.18, radius * 0.92);
        context.lineTo(-radius * 0.72, radius * 0.68);
        context.lineTo(-radius * 0.96, -radius * 0.04);
        break;
      case 'monk':
        context.moveTo(0, -radius * 0.92);
        context.lineTo(radius * 0.58, -radius * 0.28);
        context.lineTo(radius * 0.52, radius * 0.5);
        context.lineTo(0, radius * 0.88);
        context.lineTo(-radius * 0.52, radius * 0.5);
        context.lineTo(-radius * 0.58, -radius * 0.28);
        break;
      case 'prototype':
        context.moveTo(0, -radius * 1.08);
        context.lineTo(radius * 0.52, -radius * 0.48);
        context.lineTo(radius * 0.98, radius * 0.14);
        context.lineTo(radius * 0.34, radius * 0.34);
        context.lineTo(radius * 0.42, radius * 0.88);
        context.lineTo(0, radius * 0.54);
        context.lineTo(-radius * 0.58, radius * 0.76);
        context.lineTo(-radius * 0.32, radius * 0.08);
        context.lineTo(-radius * 0.72, -radius * 0.3);
        break;
      case 'relic':
        context.moveTo(0, -radius * 1.02);
        context.lineTo(radius * 0.78, -radius * 0.12);
        context.lineTo(radius * 0.34, radius * 0.76);
        context.lineTo(0, radius * 0.44);
        context.lineTo(-radius * 0.34, radius * 0.76);
        context.lineTo(-radius * 0.78, -radius * 0.12);
        break;
      case 'needle':
      default:
        context.moveTo(0, -radius);
        context.lineTo(radius * 0.82, radius * 0.78);
        context.lineTo(0, radius * 0.36);
        context.lineTo(-radius * 0.82, radius * 0.78);
        break;
    }

    context.closePath();
  }

  private paintPlayerWeaponMounts(
    mounts: readonly ShipWeaponMountHint[],
    appearance: ShipAppearance,
    radius: number
  ): void {
    const context = this.context;
    const mountColor = this.settings.bulletContrast === 'high' ? '#ffffff' : appearance.trimColor;

    context.save();
    context.fillStyle = mountColor;
    context.strokeStyle = appearance.engineColor;
    context.lineWidth = 1;

    for (const mount of mounts) {
      this.paintPlayerWeaponMount(mount, radius);
    }

    context.restore();
  }

  private paintPlayerWeaponMount(mount: ShipWeaponMountHint, radius: number): void {
    const context = this.context;
    const size = Math.max(2.2, radius * 0.13);

    switch (mount) {
      case 'nose':
        context.fillRect(-size * 0.5, -radius * 0.82, size, size * 1.6);
        break;
      case 'wing':
        context.beginPath();
        context.arc(-radius * 0.56, radius * 0.12, size, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.arc(radius * 0.56, radius * 0.12, size, 0, Math.PI * 2);
        context.fill();
        break;
      case 'pod':
        context.fillRect(-radius * 0.8, radius * 0.18, size * 1.1, size * 2.4);
        context.fillRect(radius * 0.8 - size * 1.1, radius * 0.18, size * 1.1, size * 2.4);
        break;
      case 'drone':
        context.beginPath();
        context.arc(-radius * 0.84, -radius * 0.28, size * 0.95, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.arc(radius * 0.84, -radius * 0.28, size * 0.95, 0, Math.PI * 2);
        context.fill();
        break;
      case 'broadside':
        context.strokeRect(-radius * 0.78, -radius * 0.16, size * 1.2, size * 3.2);
        context.strokeRect(radius * 0.78 - size * 1.2, -radius * 0.16, size * 1.2, size * 3.2);
        break;
      case 'beam':
        context.fillRect(-size * 0.42, -radius * 0.92, size * 0.84, radius * 0.48);
        break;
      case 'orbit':
        context.beginPath();
        context.arc(-radius * 0.38, radius * 0.54, size * 0.82, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.arc(radius * 0.38, radius * 0.54, size * 0.82, 0, Math.PI * 2);
        context.fill();
        break;
      default:
        break;
    }
  }

  public paintEnemy(enemy: EnemyRenderState): void {
    const context = this.context;
    const healthRatio = clamp(enemy.hull / enemy.maxHull, 0, 1);
    const faction = getFactionById(enemy.factionId);
    const formation = enemy.formationId ? getEnemyFormationById(enemy.formationId) : null;
    const variant = enemy.variantId ? getEnemyVariantById(enemy.variantId) : null;

    context.save();
    context.translate(enemy.x, enemy.y);

    if (formation) {
      this.paintEnemyFormationCue(enemy, formation.cue);
    }

    if (variant) {
      this.paintEnemyVariantCue(enemy, variant.cue);
    }

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
    } else if (faction.visualShape === 'needle') {
      context.beginPath();
      context.moveTo(0, -enemy.radius * 1.16);
      context.lineTo(enemy.radius * 0.44, -enemy.radius * 0.12);
      context.lineTo(enemy.radius * 0.9, enemy.radius * 0.46);
      context.lineTo(enemy.radius * 0.18, enemy.radius * 0.18);
      context.lineTo(0, enemy.radius);
      context.lineTo(-enemy.radius * 0.18, enemy.radius * 0.18);
      context.lineTo(-enemy.radius * 0.9, enemy.radius * 0.46);
      context.lineTo(-enemy.radius * 0.44, -enemy.radius * 0.12);
      context.closePath();
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(0, -enemy.radius * 0.72);
      context.lineTo(0, enemy.radius * 0.68);
      context.stroke();
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

    if (enemy.rivalName) {
      context.globalAlpha = 1;
      context.fillStyle = this.settings.bulletContrast === 'high' ? '#ffffff' : '#ffef5f';
      context.strokeStyle = '#03050d';
      context.lineWidth = 3;
      context.font = `bold ${this.settings.performanceMode ? 8 : 9}px ui-monospace, monospace`;
      context.textAlign = 'center';
      context.textBaseline = 'bottom';
      const label = this.settings.performanceMode
        ? `RIVAL ${enemy.rivalName}`
        : `RIVAL ${enemy.rivalName} | ${enemy.rivalShipName ?? enemy.rivalTitle ?? ''}`;
      context.strokeText(label, 0, -enemy.radius - 10);
      context.fillText(label, 0, -enemy.radius - 10);
    }

    context.restore();
  }

  public paintAlly(ally: AllyRenderState): void {
    if (ally.status !== 'active') return;
    const context = this.context;
    const highContrast = this.settings.bulletContrast === 'high';
    const healthRatio = clamp(ally.hull / Math.max(1, ally.maxHull), 0, 1);
    context.save();
    context.translate(ally.x, ally.y);
    context.fillStyle = highContrast ? '#050712' : ally.cue.color;
    context.strokeStyle = highContrast ? '#ffffff' : '#dffcff';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, -ally.radius);
    context.lineTo(ally.radius * 0.82, ally.radius * 0.72);
    context.lineTo(0, ally.radius * 0.38);
    context.lineTo(-ally.radius * 0.82, ally.radius * 0.72);
    context.closePath();
    context.fill();
    context.stroke();
    context.fillStyle = highContrast ? '#ffffff' : '#03050d';
    context.font = 'bold 8px ui-monospace, monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(highContrast ? ally.cue.highContrastGlyph : ally.cue.glyph, 0, 1);
    context.fillStyle = '#050712';
    context.fillRect(-ally.radius, ally.radius + 5, ally.radius * 2, 3);
    context.fillStyle = highContrast ? '#ffffff' : ally.cue.color;
    context.fillRect(-ally.radius, ally.radius + 5, ally.radius * 2 * healthRatio, 3);
    context.fillStyle = highContrast ? '#ffffff' : ally.cue.color;
    context.strokeStyle = '#03050d';
    context.lineWidth = 3;
    context.font = `bold ${this.settings.performanceMode ? 7 : 8}px ui-monospace, monospace`;
    context.textBaseline = 'bottom';
    const identity = ally.source === 'fleet' ? 'FLEET' : 'ALLY';
    const label = this.settings.performanceMode
      ? `${identity} ${ally.callsign}`
      : `${identity} ${ally.callsign} | ${ally.role}`;
    context.strokeText(label, 0, -ally.radius - 7);
    context.fillText(label, 0, -ally.radius - 7);
    context.restore();
  }

  private paintEnemyFormationCue(
    enemy: EnemyRenderState,
    cue: { readonly label: string; readonly stroke: string }
  ): void {
    const context = this.context;
    const stroke = this.settings.bulletContrast === 'high' ? '#ffffff' : cue.stroke;
    const memberIndex = Math.max(0, enemy.formationMemberIndex ?? 0);
    const memberCount = Math.max(1, enemy.formationMemberCount ?? 1);
    const ringRadius = enemy.radius * 1.62;
    const startAngle = -Math.PI / 2 + (Math.PI * 2 * memberIndex) / memberCount;
    const endAngle = startAngle + Math.PI * 0.52;

    context.save();
    context.globalAlpha = this.settings.reducedMotion ? 0.54 : 0.68;
    context.strokeStyle = stroke;
    context.lineWidth = 1.4;
    context.beginPath();
    context.arc(0, 0, ringRadius, startAngle, endAngle);
    context.stroke();

    context.globalAlpha = 0.9;
    context.fillStyle = stroke;
    context.font = '7px system-ui, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(cue.label, 0, enemy.radius + 18);
    context.restore();
  }

  private paintEnemyVariantCue(
    enemy: EnemyRenderState,
    cue: { readonly label: string; readonly fill: string; readonly stroke: string }
  ): void {
    const context = this.context;
    const stroke = this.settings.bulletContrast === 'high' ? '#ffffff' : cue.stroke;
    const fill = this.settings.bulletContrast === 'high' ? '#050712' : cue.fill;
    const badgeWidth = Math.max(24, cue.label.length * 7 + 9);
    const badgeHeight = 13;
    const ringRadius = enemy.radius * 1.34;

    context.save();
    context.globalAlpha = this.settings.reducedMotion ? 0.82 : 0.92;
    context.strokeStyle = stroke;
    context.lineWidth = 2.2;
    context.beginPath();
    context.arc(0, 0, ringRadius, 0, Math.PI * 2);
    context.stroke();

    context.globalAlpha = this.settings.reducedMotion ? 0.72 : 0.84;
    context.beginPath();
    context.moveTo(-ringRadius, -enemy.radius * 0.26);
    context.lineTo(-ringRadius - 6, -enemy.radius * 0.58);
    context.moveTo(ringRadius, -enemy.radius * 0.26);
    context.lineTo(ringRadius + 6, -enemy.radius * 0.58);
    context.moveTo(-ringRadius, enemy.radius * 0.26);
    context.lineTo(-ringRadius - 6, enemy.radius * 0.58);
    context.moveTo(ringRadius, enemy.radius * 0.26);
    context.lineTo(ringRadius + 6, enemy.radius * 0.58);
    context.stroke();

    context.globalAlpha = 0.96;
    context.fillStyle = fill;
    context.strokeStyle = stroke;
    context.lineWidth = 1;
    context.fillRect(-badgeWidth / 2, -enemy.radius - badgeHeight - 8, badgeWidth, badgeHeight);
    context.strokeRect(-badgeWidth / 2, -enemy.radius - badgeHeight - 8, badgeWidth, badgeHeight);
    context.fillStyle = stroke;
    context.font = '8px system-ui, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(cue.label, 0, -enemy.radius - badgeHeight / 2 - 8);
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
    const warningColor =
      this.settings.bulletContrast === 'high' ? '#ffef5f' : faction.palette.warning;

    context.save();
    context.globalAlpha = alpha;
    context.strokeStyle = warningColor;
    context.fillStyle = warningColor;
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
    const velocityCues = getVelocityCueState(this.settings);

    context.save();
    context.translate(projectile.x, projectile.y);

    if (projectile.owner === 'player') {
      context.fillStyle = this.settings.bulletContrast === 'high' ? '#ffffff' : '#7cf7ff';
      context.shadowColor = this.settings.bulletContrast === 'high' ? '#ffffff' : '#7cf7ff';
    } else if (projectile.owner === 'ally') {
      context.fillStyle = this.settings.bulletContrast === 'high' ? '#ffffff' : '#8dff9a';
      context.shadowColor = this.settings.bulletContrast === 'high' ? '#ffffff' : '#8dff9a';
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

    context.shadowBlur = velocityCues.highContrastProjectiles ? 14 : 10;
    context.beginPath();
    context.arc(0, 0, projectile.radius, 0, Math.PI * 2);
    context.fill();

    if (velocityCues.highContrastProjectiles) {
      context.shadowBlur = 0;
      context.strokeStyle = '#03050d';
      context.lineWidth = Math.max(2, projectile.radius * 0.55);
      context.stroke();
    }

    context.restore();
  }

  public paintEnvironmentObject(object: EnvironmentObjectRenderState): void {
    const context = this.context;
    const definition = getEnvironmentObjectById(object.definitionId);
    const healthRatio = clamp(object.hull / Math.max(1, object.maxHull), 0, 1);
    const highContrast = this.settings.bulletContrast === 'high';
    const color = highContrast
      ? definition.rendering.highContrastColor
      : definition.rendering.normalColor;
    const strokeColor = object.hitFlashSeconds > 0 ? '#f8fbff' : color;
    const halfWidth = object.collisionShape === 'circle' ? object.radius : object.width / 2;
    const halfHeight = object.collisionShape === 'circle' ? object.radius : object.height / 2;

    context.save();
    context.translate(object.x, object.y);
    context.globalAlpha = highContrast ? 0.42 : definition.rendering.fillAlpha;
    context.fillStyle = color;
    context.strokeStyle = strokeColor;
    context.lineWidth = object.hitFlashSeconds > 0 ? 3 : highContrast ? 2.5 : 1.8;
    context.shadowColor = strokeColor;
    context.shadowBlur =
      this.settings.reducedMotion || this.settings.performanceMode
        ? 0
        : object.hitFlashSeconds > 0
          ? 12
          : 5;

    if (definition.rendering.cue === 'proximityMine' && definition.proximity) {
      const armed = object.mineFuseSeconds !== null;
      const fuseRatio = armed
        ? clamp(
            (object.mineFuseSeconds ?? 0) / Math.max(0.01, object.mineFuseDurationSeconds),
            0,
            1
          )
        : 1;

      context.shadowBlur = 0;
      context.globalAlpha = highContrast ? 0.76 : armed ? 0.64 : 0.24;
      context.strokeStyle = armed ? (highContrast ? '#ffffff' : '#ffef5f') : color;
      context.lineWidth = armed ? 2.8 : 1.4;
      context.setLineDash(armed ? [8, 6] : [4, 9]);
      context.beginPath();
      context.arc(
        0,
        0,
        armed ? definition.proximity.blastRadius : definition.proximity.triggerRadius,
        0,
        Math.PI * 2
      );
      context.stroke();
      context.setLineDash([]);

      if (armed) {
        context.globalAlpha = 1;
        context.lineWidth = 4;
        context.beginPath();
        context.arc(
          0,
          0,
          definition.proximity.blastRadius - 5,
          -Math.PI / 2,
          -Math.PI / 2 + Math.PI * 2 * (1 - fuseRatio)
        );
        context.stroke();
      }

      context.globalAlpha = highContrast ? 1 : 0.9;
      context.fillStyle = armed ? (highContrast ? '#ffef5f' : '#ff8a4c') : color;
      context.strokeStyle = strokeColor;
      context.lineWidth = object.hitFlashSeconds > 0 ? 3 : 2.2;
      context.beginPath();
      context.arc(0, 0, object.radius, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      for (let index = 0; index < 8; index += 1) {
        const angle = (Math.PI * 2 * index) / 8;
        context.beginPath();
        context.moveTo(
          Math.cos(angle) * object.radius * 0.72,
          Math.sin(angle) * object.radius * 0.72
        );
        context.lineTo(
          Math.cos(angle) * object.radius * 1.38,
          Math.sin(angle) * object.radius * 1.38
        );
        context.stroke();
      }

      context.fillStyle = highContrast ? '#03050d' : '#f8fbff';
      context.font = 'bold 12px ui-monospace, monospace';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(armed ? '!' : 'M', 0, 1);
    } else if (object.collisionShape === 'circle') {
      context.beginPath();
      context.arc(0, 0, object.radius, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = highContrast ? 1 : definition.rendering.strokeAlpha;
      context.stroke();

      if (!this.settings.performanceMode) {
        context.globalAlpha = highContrast ? 0.86 : 0.48;
        context.beginPath();
        context.moveTo(-object.radius * 0.52, -object.radius * 0.22);
        context.lineTo(object.radius * 0.18, object.radius * 0.44);
        context.moveTo(object.radius * 0.36, -object.radius * 0.42);
        context.lineTo(object.radius * 0.62, object.radius * 0.16);
        context.stroke();
      }
    } else {
      context.fillRect(-halfWidth, -halfHeight, object.width, object.height);
      context.globalAlpha = highContrast ? 1 : definition.rendering.strokeAlpha;
      context.strokeRect(-halfWidth, -halfHeight, object.width, object.height);

      if (object.collisionShape === 'gate') {
        context.globalAlpha = highContrast ? 0.92 : 0.58;
        context.beginPath();
        context.moveTo(-halfWidth * 0.62, -halfHeight);
        context.lineTo(-halfWidth * 0.62, halfHeight);
        context.moveTo(halfWidth * 0.62, -halfHeight);
        context.lineTo(halfWidth * 0.62, halfHeight);
        context.moveTo(-halfWidth, 0);
        context.lineTo(halfWidth, 0);
        context.stroke();
      } else if (!this.settings.performanceMode) {
        context.globalAlpha = highContrast ? 0.86 : 0.42;
        context.beginPath();
        context.moveTo(-halfWidth * 0.72, -halfHeight * 0.2);
        context.lineTo(halfWidth * 0.7, halfHeight * 0.18);
        context.moveTo(-halfWidth * 0.22, halfHeight * 0.62);
        context.lineTo(halfWidth * 0.22, -halfHeight * 0.58);
        context.stroke();
      }
    }

    if (healthRatio < 0.98) {
      context.shadowBlur = 0;
      context.globalAlpha = highContrast ? 1 : 0.82;
      context.strokeStyle = highContrast ? '#ffef5f' : '#ffd166';
      context.lineWidth = 2.2;
      context.beginPath();
      context.moveTo(-halfWidth, halfHeight + 5);
      context.lineTo(-halfWidth + halfWidth * 2 * healthRatio, halfHeight + 5);
      context.stroke();
    }

    context.restore();
  }

  public paintSetPieceComponent(component: SetPieceComponentRenderState): void {
    const context = this.context;
    const template = getSetPieceComponentTemplate(component.templateId);
    const highContrast = this.settings.bulletContrast === 'high';
    const color = highContrast
      ? template.rendering.highContrastColor
      : template.rendering.normalColor;
    const healthRatio = clamp(component.hull / Math.max(1, component.maxHull), 0, 1);
    const halfWidth =
      component.collisionShape === 'circle' ? component.radius : component.width / 2;
    const halfHeight =
      component.collisionShape === 'circle' ? component.radius : component.height / 2;

    context.save();
    context.translate(component.x, component.y);
    context.fillStyle = color;
    context.strokeStyle = component.hitFlashSeconds > 0 ? '#ffffff' : color;
    context.lineWidth = component.targetable ? 3 : 5;
    context.globalAlpha = component.targetable ? (highContrast ? 0.58 : 0.46) : 0.24;
    context.shadowColor = color;
    context.shadowBlur =
      this.settings.reducedMotion || this.settings.performanceMode
        ? 0
        : component.hitFlashSeconds > 0
          ? 16
          : 8;

    if (component.collisionShape === 'circle') {
      context.beginPath();
      context.arc(0, 0, component.radius, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 1;
      context.stroke();
    } else {
      context.fillRect(-halfWidth, -halfHeight, component.width, component.height);
      context.globalAlpha = 1;
      context.strokeRect(-halfWidth, -halfHeight, component.width, component.height);
    }

    if (!this.settings.performanceMode) {
      context.shadowBlur = 0;
      context.globalAlpha = highContrast ? 1 : 0.82;
      context.fillStyle = highContrast ? '#03050d' : '#f8fbff';
      context.font = 'bold 10px ui-monospace, monospace';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(component.targetable ? template.rendering.glyph : 'LOCK', 0, 0);
    }

    context.shadowBlur = 0;
    context.globalAlpha = 1;
    context.strokeStyle = highContrast ? '#ffef5f' : component.targetable ? '#7cf7ff' : '#6f7a85';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(-halfWidth, halfHeight + 7);
    context.lineTo(-halfWidth + halfWidth * 2 * healthRatio, halfHeight + 7);
    context.stroke();
    context.restore();
  }

  public paintPickup(pickup: PickupRenderState): void {
    const context = this.context;
    const velocityCues = getVelocityCueState(this.settings);

    context.save();
    context.translate(pickup.x, pickup.y);

    if (velocityCues.pickupTrailAlpha > 0) {
      context.globalAlpha = velocityCues.pickupTrailAlpha;
      context.strokeStyle = pickup.kind === 'credit' ? '#ffd166' : '#7cf7ff';
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(-pickup.radius * 0.38, -pickup.radius * 1.9);
      context.lineTo(-pickup.radius * 0.08, -pickup.radius * 4.2);
      context.moveTo(pickup.radius * 0.38, -pickup.radius * 1.7);
      context.lineTo(pickup.radius * 0.08, -pickup.radius * 3.5);
      context.stroke();
    }

    context.globalAlpha = 1;
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
      effect.kind === 'bomb'
        ? '#ffd166'
        : effect.kind === 'special'
          ? '#7cf7ff'
          : effect.kind === 'environmentBreak'
            ? '#ff8a4c'
            : effect.kind === 'chainReaction'
              ? '#ffef5f'
              : effect.kind === 'environmentHit'
                ? '#8aa4b8'
                : '#ff6bd6';
    const velocityCues = getVelocityCueState(this.settings);

    context.save();
    context.translate(effect.x, effect.y);

    if (velocityCues.impactStreakAlpha > 0) {
      context.globalAlpha = alpha * velocityCues.impactStreakAlpha;
      context.strokeStyle = color;
      context.lineWidth = effect.kind === 'bomb' || effect.kind === 'environmentBreak' ? 3 : 2;
      for (const offset of [-0.48, 0, 0.48]) {
        context.beginPath();
        context.moveTo(offset * radius * 0.58, -radius * 0.8);
        context.lineTo(offset * radius * 0.26, -radius * 1.28);
        context.stroke();
      }
    }

    context.globalAlpha = effect.kind === 'graze' ? alpha * 0.78 : alpha * 0.62;
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = effect.kind === 'bomb' || effect.kind === 'environmentBreak' ? 4 : 2;
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
    } else if (effect.kind === 'special' || effect.kind === 'environmentBreak') {
      context.globalAlpha = alpha * 0.28;
      context.beginPath();
      context.arc(0, 0, Math.max(8, radius * 0.42), 0, Math.PI * 2);
      context.fill();
    } else if (effect.kind === 'chainReaction') {
      context.globalAlpha = alpha * 0.18;
      context.beginPath();
      context.arc(0, 0, Math.max(10, radius * 0.64), 0, Math.PI * 2);
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

  private paintSectorLandmarkShape(
    kind: VisibleSectorLandmark['landmark']['kind'],
    width: number,
    height: number
  ): void {
    const context = this.context;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    if (kind === 'wreck_silhouette') {
      context.beginPath();
      context.moveTo(-halfWidth, -halfHeight * 0.15);
      context.lineTo(-halfWidth * 0.54, -halfHeight);
      context.lineTo(halfWidth * 0.82, -halfHeight * 0.62);
      context.lineTo(halfWidth, halfHeight * 0.2);
      context.lineTo(halfWidth * 0.18, halfHeight);
      context.lineTo(-halfWidth * 0.72, halfHeight * 0.48);
      context.closePath();
      context.fill();
      context.globalAlpha *= 0.78;
      context.stroke();
      return;
    }

    if (kind === 'beacon_line') {
      context.strokeStyle = '#ffd166';
      context.lineWidth = 2;
      for (let index = -2; index <= 2; index += 1) {
        const x = index * (width / 6);
        context.beginPath();
        context.moveTo(x, -halfHeight);
        context.lineTo(x, halfHeight);
        context.stroke();
      }
      context.fillStyle = '#7cf7ff';
      context.fillRect(-halfWidth, -3, width, 6);
      return;
    }

    if (kind === 'vault_door') {
      context.fillStyle = '#191827';
      context.strokeStyle = '#ffd166';
      context.lineWidth = 2;
      context.beginPath();
      context.rect(-halfWidth, -halfHeight, width, height);
      context.fill();
      context.stroke();
      context.beginPath();
      context.arc(0, 0, Math.min(halfWidth, halfHeight) * 0.52, 0, Math.PI * 2);
      context.stroke();
      return;
    }

    if (kind === 'convoy_shadow') {
      context.fillStyle = '#151926';
      context.strokeStyle = '#8aa4b8';
      for (const offset of [-0.34, 0, 0.34]) {
        context.beginPath();
        context.ellipse(offset * width, 0, width * 0.18, height * 0.44, -0.1, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      }
      return;
    }

    if (kind === 'repair_platform') {
      context.fillStyle = '#132829';
      context.strokeStyle = '#7cf7ff';
      context.lineWidth = 2;
      context.strokeRect(-halfWidth, -halfHeight, width, height);
      context.fillRect(-halfWidth * 0.18, -halfHeight, halfWidth * 0.36, height);
      context.fillRect(-halfWidth, -halfHeight * 0.18, width, halfHeight * 0.36);
      return;
    }

    if (kind === 'crater_shadow_band') {
      context.fillStyle = '#111827';
      context.strokeStyle = '#8aa4b8';
      context.lineWidth = 1.5;
      context.beginPath();
      context.ellipse(0, 0, halfWidth, halfHeight * 0.62, -0.08, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha *= 0.62;
      context.beginPath();
      context.ellipse(0, 0, halfWidth * 0.72, halfHeight * 0.34, -0.08, 0, Math.PI);
      context.stroke();
      return;
    }

    if (kind === 'comm_array_flyby') {
      context.strokeStyle = '#7cf7ff';
      context.fillStyle = '#1b2636';
      context.lineWidth = 1.6;
      for (const offset of [-0.32, 0, 0.32]) {
        const x = offset * width;
        context.beginPath();
        context.moveTo(x, halfHeight);
        context.lineTo(x, -halfHeight * 0.56);
        context.stroke();
        context.beginPath();
        context.ellipse(x, -halfHeight * 0.72, width * 0.09, height * 0.12, -0.38, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      }
      context.beginPath();
      context.moveTo(-halfWidth * 0.62, halfHeight * 0.18);
      context.lineTo(halfWidth * 0.62, -halfHeight * 0.08);
      context.stroke();
      return;
    }

    if (kind === 'surface_relay') {
      context.fillStyle = '#172231';
      context.strokeStyle = '#ffd166';
      context.lineWidth = 1.7;
      context.strokeRect(-halfWidth * 0.52, -halfHeight * 0.2, width * 0.36, height * 0.52);
      context.strokeRect(halfWidth * 0.12, -halfHeight * 0.42, width * 0.32, height * 0.74);
      for (const x of [-halfWidth * 0.34, halfWidth * 0.28]) {
        context.beginPath();
        context.moveTo(x, -halfHeight * 0.48);
        context.lineTo(x, -halfHeight);
        context.moveTo(x - width * 0.08, -halfHeight * 0.82);
        context.lineTo(x + width * 0.08, -halfHeight * 0.82);
        context.stroke();
      }
      context.fillRect(-halfWidth, halfHeight * 0.26, width, height * 0.12);
      return;
    }

    context.fillStyle = '#251b24';
    context.strokeStyle = '#ffd166';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(0, 0, Math.min(halfWidth, halfHeight), 0, Math.PI * 2);
    context.stroke();
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      context.beginPath();
      context.moveTo(Math.cos(angle) * halfWidth * 0.28, Math.sin(angle) * halfHeight * 0.28);
      context.lineTo(Math.cos(angle) * halfWidth, Math.sin(angle) * halfHeight);
      context.stroke();
    }
  }

  private paintSectorHazardPattern(
    activeHazard: ActiveSectorHazard,
    rect: SectorHazardCollisionRect,
    color: string,
    style: SectorHazardVisualState
  ): void {
    const context = this.context;

    context.strokeStyle = color;
    context.fillStyle = color;
    context.globalAlpha = style.strokeAlpha * (activeHazard.phase === 'telegraph' ? 0.7 : 0.84);

    if (activeHazard.phase === 'telegraph') {
      context.setLineDash([9, 10]);
    }

    if (style.behaviorKind === 'sweepBeam') {
      context.setLineDash([]);
      const sweepWidth = Math.max(12, rect.width * 0.42);
      const centerX = rect.left + rect.width * style.motionRatio;
      context.lineWidth = activeHazard.phase === 'active' ? 3.4 : 2.2;
      context.beginPath();
      context.moveTo(centerX, rect.top);
      context.lineTo(centerX, rect.bottom);
      context.stroke();
      context.setLineDash([]);
      context.globalAlpha *= 0.58;
      context.beginPath();
      context.moveTo(centerX - sweepWidth * 0.5, rect.top);
      context.lineTo(centerX - sweepWidth * 0.5, rect.bottom);
      context.moveTo(centerX + sweepWidth * 0.5, rect.top);
      context.lineTo(centerX + sweepWidth * 0.5, rect.bottom);
      context.stroke();
      return;
    }

    if (style.behaviorKind === 'staticWarningGate') {
      context.setLineDash([]);
      context.lineWidth = activeHazard.phase === 'active' ? 3.1 : 2.1;
      context.beginPath();
      context.moveTo(rect.centerX, rect.top);
      context.lineTo(rect.centerX, rect.bottom);
      context.stroke();
      context.globalAlpha *= 0.58;
      for (let y = rect.top + 32; y < rect.bottom; y += style.patternStride + 28) {
        context.beginPath();
        context.moveTo(rect.centerX - rect.width * 0.38, y - 16);
        context.lineTo(rect.centerX + rect.width * 0.38, y + 16);
        context.moveTo(rect.centerX + rect.width * 0.38, y - 16);
        context.lineTo(rect.centerX - rect.width * 0.38, y + 16);
        context.stroke();
      }
      return;
    }

    if (style.behaviorKind === 'dustFront') {
      context.setLineDash([]);
      const frontY = rect.top + rect.height * style.motionRatio;
      context.globalAlpha *= activeHazard.phase === 'active' ? 0.92 : 0.72;
      context.beginPath();
      context.moveTo(rect.left, frontY);
      context.quadraticCurveTo(rect.centerX, frontY - 34, rect.right, frontY + 8);
      context.stroke();
      context.globalAlpha *= 0.82;
      for (
        let y = rect.top + 34, index = 0;
        y < rect.bottom;
        y += style.patternStride, index += 1
      ) {
        const x = rect.left + ((index * 41) % Math.max(1, rect.width));
        context.beginPath();
        context.moveTo(x - rect.width * 0.22, y + 10);
        context.quadraticCurveTo(x, y - 18, x + rect.width * 0.28, y + 8);
        context.stroke();
        context.globalAlpha *= 0.96;
        context.beginPath();
        context.arc(x + rect.width * 0.12, y - 2, 4 + (index % 3), 0, Math.PI * 2);
        context.stroke();
      }
      return;
    }

    if (style.behaviorKind === 'plasmaCurtain') {
      context.setLineDash([]);
      for (
        let y = rect.top + 30, index = 0;
        y < rect.bottom;
        y += style.patternStride, index += 1
      ) {
        const x = rect.left + ((index * 37) % Math.max(1, rect.width));
        context.beginPath();
        context.moveTo(x - 14, y - 6);
        context.lineTo(x + 18, y + 8);
        context.stroke();
        if (index % 2 === 0) {
          context.beginPath();
          context.moveTo(rect.left + rect.width * 0.24, y + 14);
          context.lineTo(rect.right - rect.width * 0.2, y - 10);
          context.stroke();
        }
      }
      return;
    }

    if (style.behaviorKind === 'pulseField') {
      context.setLineDash([]);
      context.globalAlpha *= style.damageWindowOpen ? 1 : 0.52;
      for (let y = rect.top + 36; y < rect.bottom; y += style.patternStride + 20) {
        context.beginPath();
        context.arc(rect.centerX, y, rect.width * 0.44, Math.PI * 0.12, Math.PI * 0.88);
        context.stroke();
        context.beginPath();
        context.moveTo(rect.left + rect.width * 0.18, y + 18);
        context.lineTo(rect.right - rect.width * 0.18, y + 18);
        context.stroke();
      }
      return;
    }

    if (style.behaviorKind === 'collapsingColumns') {
      context.setLineDash([]);
      const toothWidth = Math.min(28, rect.width * 0.28);
      const squeeze = 0.26 + activeHazard.phaseProgress * 0.34;
      for (let y = rect.top + 18; y < rect.bottom; y += style.patternStride) {
        context.beginPath();
        context.moveTo(rect.left, y);
        context.lineTo(rect.left + toothWidth + rect.width * squeeze, y + 18);
        context.lineTo(rect.left, y + 36);
        context.moveTo(rect.right, y);
        context.lineTo(rect.right - toothWidth - rect.width * squeeze, y + 18);
        context.lineTo(rect.right, y + 36);
        context.stroke();
      }
      return;
    }

    for (let y = rect.top - rect.width; y < rect.bottom; y += style.patternStride) {
      context.beginPath();
      context.moveTo(rect.left, y);
      context.lineTo(rect.right, y + rect.width * 0.52);
      context.stroke();
    }
  }

  private paintDirectionalBeamHazard(
    activeHazard: ActiveSectorHazard,
    bounds: CombatBounds,
    color: string,
    style: SectorHazardVisualState
  ): void {
    const context = this.context;
    const track = getWorldAnchoredBeamTrack(activeHazard, bounds);
    const bolt = getActiveBeamBoltSegment(activeHazard, bounds);
    const active = activeHazard.phase === 'active';
    const highContrast = this.settings.bulletContrast === 'high';
    const coreColor = highContrast ? '#ffffff' : '#fffbd6';

    context.save();
    context.lineCap = 'round';
    context.lineJoin = 'round';

    if (active) {
      context.setLineDash([3, 15]);
      this.strokeBeamSegment(track, color, Math.max(1.4, style.lineWidth * 0.72), 0.24);
      context.setLineDash([]);
      context.globalCompositeOperation = highContrast ? 'source-over' : 'lighter';
      context.shadowColor = color;
      context.shadowBlur = this.settings.performanceMode ? 0 : 18;
      if (bolt) {
        this.strokeBeamSegment(bolt, color, bolt.radius * 3.2, style.fillAlpha * 0.62);
        this.strokeBeamSegment(bolt, color, bolt.radius * 1.85, style.strokeAlpha * 0.78);
        this.strokeBeamSegment(
          bolt,
          coreColor,
          Math.max(3, bolt.radius * 0.58),
          highContrast ? 1 : 0.96
        );
        this.strokeBeamSegment(bolt, '#ffffff', Math.max(1.2, bolt.radius * 0.18), 1);
        this.paintBeamBoltHead(bolt, color, coreColor);
      }
    } else {
      context.setLineDash([12, 10]);
      this.strokeBeamSegment(track, color, Math.max(2, style.lineWidth), style.strokeAlpha);
      context.setLineDash([]);
      this.strokeBeamSegment(track, coreColor, 1, 0.26 + activeHazard.phaseProgress * 0.34);
    }

    this.paintBeamSourceEmitter(track, color, coreColor, active, style);
    this.paintBeamEndpoint(track, color, coreColor, active, style);

    if (!this.settings.performanceMode) {
      const markerCount = this.settings.reducedMotion ? 2 : 4;
      for (let index = 1; index <= markerCount; index += 1) {
        const progress = index / (markerCount + 1);
        const x = track.startX + (track.endX - track.startX) * progress;
        const y = track.startY + (track.endY - track.startY) * progress;
        const normalX = -Math.sin(track.angle);
        const normalY = Math.cos(track.angle);
        const halfWidth = active ? track.radius * 0.82 : 7;
        context.globalAlpha = active ? 0.24 : 0.34;
        context.strokeStyle = color;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(x - normalX * halfWidth, y - normalY * halfWidth);
        context.lineTo(x + normalX * halfWidth, y + normalY * halfWidth);
        context.stroke();
      }
    }

    context.restore();
  }

  private paintBeamBoltHead(bolt: BeamHazardSegment, color: string, coreColor: string): void {
    const context = this.context;
    const normalX = -Math.sin(bolt.angle);
    const normalY = Math.cos(bolt.angle);
    const flareRadius = bolt.radius * 1.18;
    context.save();
    context.globalAlpha = 0.96;
    context.fillStyle = coreColor;
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(bolt.endX, bolt.endY, Math.max(4, bolt.radius * 0.52), 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.moveTo(bolt.endX - normalX * flareRadius, bolt.endY - normalY * flareRadius);
    context.lineTo(bolt.endX + normalX * flareRadius, bolt.endY + normalY * flareRadius);
    context.stroke();
    context.restore();
  }

  private strokeBeamSegment(
    segment: BeamHazardSegment,
    color: string,
    lineWidth: number,
    alpha: number
  ): void {
    const context = this.context;
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.globalAlpha = clamp(alpha, 0, 1);
    context.beginPath();
    context.moveTo(segment.startX, segment.startY);
    context.lineTo(segment.endX, segment.endY);
    context.stroke();
  }

  private paintBeamSourceEmitter(
    segment: BeamHazardSegment,
    color: string,
    coreColor: string,
    active: boolean,
    style: SectorHazardVisualState
  ): void {
    const context = this.context;
    context.save();
    context.translate(segment.startX, segment.startY);
    context.rotate(segment.angle);
    context.globalAlpha = active ? 0.96 : style.strokeAlpha;
    context.strokeStyle = coreColor;
    context.fillStyle = color;
    context.lineWidth = active ? 2.4 : 1.7;
    context.beginPath();
    context.arc(0, 0, active ? 15 : 12, -Math.PI * 0.62, Math.PI * 0.62);
    context.stroke();
    context.beginPath();
    context.moveTo(5, -9);
    context.lineTo(20, 0);
    context.lineTo(5, 9);
    context.closePath();
    if (active) context.fill();
    context.stroke();
    context.restore();
  }

  private paintBeamEndpoint(
    segment: BeamHazardSegment,
    color: string,
    coreColor: string,
    active: boolean,
    style: SectorHazardVisualState
  ): void {
    const context = this.context;
    const radius = active ? 12 : 9;
    context.globalAlpha = active ? 0.86 : style.strokeAlpha * 0.82;
    context.strokeStyle = active ? coreColor : color;
    context.lineWidth = active ? 2 : 1.4;
    context.beginPath();
    context.arc(segment.endX, segment.endY, radius, 0, Math.PI * 2);
    context.moveTo(segment.endX - radius - 6, segment.endY);
    context.lineTo(segment.endX + radius + 6, segment.endY);
    context.moveTo(segment.endX, segment.endY - radius - 6);
    context.lineTo(segment.endX, segment.endY + radius + 6);
    context.stroke();
  }

  private getSectorHazardColor(kind: ActiveSectorHazard['hazard']['kind']): string {
    return getHazardZoneColor(kind, this.settings.bulletContrast === 'high');
  }

  private paintGeneratedBackground(plan: BackgroundPlan, scrollOffset: number): void {
    const { width, height } = this.size;
    const context = this.context;
    const background = context.createLinearGradient(0, 0, width, height);

    background.addColorStop(0, plan.palette.top);
    background.addColorStop(0.52, plan.palette.middle);
    background.addColorStop(1, plan.palette.bottom);
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    const glow = context.createRadialGradient(
      width * 0.5,
      height * 0.34,
      0,
      width * 0.5,
      height * 0.34,
      width * 0.72
    );
    glow.addColorStop(0, plan.palette.glow);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);

    for (const layer of this.getVisibleBackgroundLayers(plan)) {
      this.paintBackgroundLayer(layer, scrollOffset);
    }

    this.paintVelocityStreaks(scrollOffset);
    context.globalAlpha = 1;
  }

  private getVisibleBackgroundLayers(plan: BackgroundPlan): readonly BackgroundLayerPlan[] {
    const maxPriority = this.settings.performanceMode || this.settings.reducedMotion ? 2 : 3;
    return plan.layers.filter((layer) => layer.priority <= maxPriority);
  }

  private paintBackgroundLayer(layer: BackgroundLayerPlan, scrollOffset: number): void {
    const { width, height } = this.size;
    const unit = Math.min(width, height);
    const wrapSpan = height + 160;

    for (const primitive of layer.primitives) {
      this.paintBackgroundPrimitive(
        primitive,
        layer,
        primitive.x * width,
        wrapCanvasValue(primitive.y * wrapSpan + scrollOffset * layer.parallax, wrapSpan) - 80,
        unit,
        height
      );
    }
  }

  private paintBackgroundPrimitive(
    primitive: BackgroundPrimitive,
    layer: BackgroundLayerPlan,
    x: number,
    y: number,
    unit: number,
    height: number
  ): void {
    const context = this.context;
    const alphaScale =
      (this.settings.reducedMotion ? 0.68 : 1) * (this.settings.performanceMode ? 0.82 : 1);
    const alpha = clamp(layer.alpha * primitive.alpha * alphaScale, 0, 0.78);
    const size = Math.max(0.8, primitive.size * unit);
    const lineLength = primitive.length * (primitive.kind === 'rail' ? height : unit);
    const lineWidth = Math.max(1, primitive.width * unit);

    context.save();
    context.translate(x, y);
    context.rotate(primitive.rotation);
    context.globalAlpha = alpha;
    context.strokeStyle = primitive.color;
    context.fillStyle = primitive.color;
    context.lineWidth = lineWidth;

    if (primitive.kind === 'spark') {
      context.beginPath();
      context.arc(0, 0, size, 0, Math.PI * 2);
      context.fill();
    } else if (primitive.kind === 'streak' || primitive.kind === 'gridLine') {
      context.beginPath();
      context.moveTo(-lineLength / 2, 0);
      context.lineTo(lineLength / 2, 0);
      context.stroke();
    } else if (primitive.kind === 'rail') {
      context.globalAlpha = alpha * 0.68;
      context.beginPath();
      context.moveTo(0, -lineLength / 2);
      context.lineTo(0, lineLength / 2);
      context.stroke();
      context.globalAlpha = alpha * 0.28;
      context.strokeStyle = primitive.accentColor;
      context.lineWidth = lineWidth + 2;
      context.beginPath();
      context.moveTo(0, -lineLength / 2);
      context.lineTo(0, lineLength / 2);
      context.stroke();
    } else if (primitive.kind === 'bloom') {
      context.beginPath();
      context.ellipse(0, 0, Math.max(2, primitive.length * unit), size, 0, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = alpha * 0.56;
      context.strokeStyle = primitive.accentColor;
      context.stroke();
    } else if (primitive.kind === 'strand') {
      context.beginPath();
      context.moveTo(-lineLength / 2, size * 0.4);
      context.quadraticCurveTo(0, -size * 1.8, lineLength / 2, size * 0.25);
      context.stroke();
      context.globalAlpha = alpha * 0.36;
      context.strokeStyle = primitive.accentColor;
      context.beginPath();
      context.moveTo(-lineLength / 2, -size * 0.2);
      context.quadraticCurveTo(0, size * 1.2, lineLength / 2, -size * 0.15);
      context.stroke();
    } else if (primitive.kind === 'crater') {
      context.beginPath();
      context.ellipse(0, 0, Math.max(size * 1.6, lineLength * 0.5), size, 0, 0, Math.PI * 2);
      context.stroke();
      context.globalAlpha = alpha * 0.28;
      context.fillStyle = primitive.accentColor;
      context.beginPath();
      context.ellipse(size * 0.18, size * 0.12, size * 0.72, size * 0.32, 0, 0, Math.PI * 2);
      context.fill();
    } else if (primitive.kind === 'ridge') {
      context.beginPath();
      context.moveTo(-lineLength / 2, size * 0.25);
      context.lineTo(-lineLength * 0.22, -size * 0.3);
      context.lineTo(lineLength * 0.06, size * 0.08);
      context.lineTo(lineLength * 0.34, -size * 0.24);
      context.lineTo(lineLength / 2, size * 0.18);
      context.stroke();
      context.globalAlpha = alpha * 0.32;
      context.strokeStyle = primitive.accentColor;
      context.beginPath();
      context.moveTo(-lineLength * 0.46, size * 0.58);
      context.lineTo(lineLength * 0.42, size * 0.42);
      context.stroke();
    } else if (primitive.kind === 'tower') {
      const towerWidth = Math.max(lineWidth * 3, size * 0.55);
      context.beginPath();
      context.moveTo(-towerWidth, lineLength / 2);
      context.lineTo(-towerWidth * 0.36, -lineLength / 2);
      context.lineTo(towerWidth * 0.36, -lineLength / 2);
      context.lineTo(towerWidth, lineLength / 2);
      context.closePath();
      context.fill();
      context.globalAlpha = alpha * 0.55;
      context.strokeStyle = primitive.accentColor;
      context.beginPath();
      context.moveTo(0, -lineLength / 2);
      context.lineTo(0, -lineLength * 0.78);
      context.moveTo(-towerWidth * 1.9, -lineLength * 0.68);
      context.lineTo(towerWidth * 1.9, -lineLength * 0.68);
      context.stroke();
    } else if (primitive.kind === 'shadow') {
      context.globalAlpha = alpha * 0.72;
      context.beginPath();
      context.ellipse(
        0,
        0,
        Math.max(size * 1.4, lineLength * 0.5),
        Math.max(size, lineWidth * 4),
        0,
        0,
        Math.PI * 2
      );
      context.fill();
    } else {
      this.paintAngularBackgroundShape(primitive, size, lineLength, lineWidth);
    }

    context.restore();
  }

  private paintAngularBackgroundShape(
    primitive: BackgroundPrimitive,
    size: number,
    length: number,
    lineWidth: number
  ): void {
    const context = this.context;
    const halfLength = Math.max(size, length / 2);
    const halfWidth = Math.max(size * 0.42, lineWidth * 2);

    context.beginPath();
    if (primitive.kind === 'fracture') {
      context.moveTo(-halfLength, -halfWidth * 0.2);
      context.lineTo(-halfLength * 0.18, -halfWidth);
      context.lineTo(halfLength, -halfWidth * 0.36);
      context.lineTo(halfLength * 0.28, halfWidth);
      context.lineTo(-halfLength * 0.72, halfWidth * 0.58);
    } else {
      context.moveTo(-halfLength, -halfWidth);
      context.lineTo(halfLength * 0.72, -halfWidth * 0.58);
      context.lineTo(halfLength, halfWidth * 0.2);
      context.lineTo(-halfLength * 0.32, halfWidth);
      context.lineTo(-halfLength * 0.8, halfWidth * 0.16);
    }
    context.closePath();
    context.fill();
    context.globalAlpha *= 0.58;
    context.strokeStyle = primitive.accentColor;
    context.stroke();
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

  private paintStars(scrollOffset: number): void {
    const { width, height } = this.size;
    const cacheKey = `${width}:${height}:${this.settings.performanceMode}`;
    const starOffset = wrapCanvasValue(scrollOffset * 0.42, height);

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
      this.context.arc(
        star.x,
        wrapCanvasValue(star.y + starOffset, height),
        star.radius,
        0,
        Math.PI * 2
      );
      this.context.fill();
    }

    this.context.globalAlpha = 1;
  }

  private paintHorizonGrid(scrollOffset: number): void {
    const { width, height } = this.size;
    const horizon = height * 0.64;
    const gridOffset = wrapCanvasValue(scrollOffset * 0.18, 72);

    this.context.save();
    this.context.globalAlpha = 0.16;
    this.context.strokeStyle = '#ffd166';
    this.context.lineWidth = Math.max(1, width / 1200);

    for (let index = 0; index < 9; index += 1) {
      const y = horizon + index * index * height * 0.008 + gridOffset;
      this.context.beginPath();
      this.context.moveTo(0, y);
      this.context.lineTo(width, y);
      this.context.stroke();
    }

    this.context.restore();
  }

  private paintVelocityStreaks(scrollOffset: number): void {
    const velocityCues = getVelocityCueState(this.settings);

    if (velocityCues.streakCount <= 0 || velocityCues.streakAlpha <= 0) {
      return;
    }

    const { width, height } = this.size;
    const context = this.context;
    const wrapSpan = height + 220;
    const offset = wrapCanvasValue(scrollOffset * 1.34, wrapSpan);

    context.save();
    context.lineCap = 'round';

    for (let index = 0; index < velocityCues.streakCount; index += 1) {
      const x = (((index * 173) % 997) / 997) * width;
      const y = wrapCanvasValue(index * 113 + offset, wrapSpan) - 110;
      const length = 38 + ((index * 47) % 84);
      const drift = ((index % 5) - 2) * 2.8;
      const alpha = velocityCues.streakAlpha * (0.55 + ((index * 29) % 45) / 100);

      context.globalAlpha = alpha;
      context.strokeStyle = index % 3 === 0 ? '#ffd166' : '#c6f7ff';
      context.lineWidth = index % 4 === 0 ? 1.8 : 1.1;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + drift, y + length);
      context.stroke();
    }

    context.restore();
  }
}

function wrapCanvasValue(value: number, span: number): number {
  const safeSpan = Math.max(1, span);
  return ((value % safeSpan) + safeSpan) % safeSpan;
}

function roundCueValue(value: number): number {
  return Math.round(value * 1000) / 1000;
}
