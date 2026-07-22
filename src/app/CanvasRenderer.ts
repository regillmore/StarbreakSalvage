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
import type { ItemTag } from '../content/items';
import { getHazardZoneColor } from '../content/hazardZones';
import type { ShipAppearance, ShipSilhouette, ShipWeaponMountHint } from '../content/ships';
import type { BoardingRoomKind } from '../content/boarding';
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
import type { ConfinedEnvironmentPlan } from '../game/ConfinedEnvironment';
import {
  BOARDING_WORLD_TO_CANVAS,
  createConfinedBackgroundFrame,
  createVisibleBoardingRoomBands
} from '../game/ConfinedEnvironmentPresentation';
import {
  getMissileFlightPhase,
  getMissileThrustScale,
  isMissileProjectile
} from '../game/MissileFlight';
import { getPhaseProjectilePresentation, isPhaseProjectile } from '../game/PhaseProjectile';
import { getHeatShotPresentation, type ProjectileVisualKind } from '../game/HeatShot';
import {
  getLaserProjectileKind,
  getLaserProjectilePresentation,
  type LaserProjectileKind
} from '../game/LaserProjectile';
import { getArcChargeProfile, type ArcChargeKind } from '../game/ArcCharge';
import {
  createMeteorStormGeometry,
  type MeteorStormImpact
} from '../game/MeteorStorm';
import { createSalvageStormGeometry } from '../game/SalvageStorm';

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

export interface DroneFollowerRenderState {
  readonly label: string;
  readonly glyph: string;
  readonly color: string;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly firingPulseSeconds: number;
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
  readonly vx: number;
  readonly vy: number;
  readonly radius: number;
  readonly owner: 'player' | 'ally' | 'enemy';
  readonly tags: readonly ItemTag[];
  readonly arcChargeKind?: ArcChargeKind;
  readonly ageSeconds?: number;
  readonly factionId?: FactionId;
  readonly visualKind?: ProjectileVisualKind;
  readonly laserKind?: LaserProjectileKind;
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
    | 'special'
    | 'bomb'
    | 'graze'
    | 'environmentHit'
    | 'environmentBreak'
    | 'chainReaction'
    | 'phaseCollapse'
    | 'arcDischarge'
    | 'heatExhaust';
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly targetX?: number;
  readonly targetY?: number;
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
    this.context.beginPath();
    this.context.rect(frame.x, frame.y, frame.width, frame.height);
    this.context.clip();
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

  public paintConfinedBackground(plan: ConfinedEnvironmentPlan, scrollOffset = 0): void {
    const { width, height } = this.size;
    const context = this.context;
    const velocityCues = getVelocityCueState(this.settings);
    const maxPriority = this.settings.performanceMode || this.settings.reducedMotion ? 2 : 3;
    const unit = Math.min(width, height);
    const frame = createConfinedBackgroundFrame({
      plan,
      scrollOffset,
      parallaxScale: velocityCues.parallaxScale,
      viewportHeight: height,
      maxPriority
    });
    const effectiveScrollOffset = scrollOffset * velocityCues.parallaxScale;
    const background = context.createLinearGradient(0, 0, width, height);

    background.addColorStop(0, plan.palette.deep);
    background.addColorStop(0.5, plan.palette.far);
    background.addColorStop(1, plan.palette.deep);
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    context.save();
    context.globalAlpha = this.settings.bulletContrast === 'high' ? 0.42 : 0.68;
    context.strokeStyle = plan.palette.seam;
    context.lineWidth = 1;
    const gridSize = Math.max(54, Math.round(unit * 0.095));
    const gridOffset = wrapCanvasValue(effectiveScrollOffset * 0.08, gridSize);
    for (let x = 0; x <= width + gridSize; x += gridSize) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = -gridSize; y <= height + gridSize; y += gridSize) {
      context.beginPath();
      context.moveTo(0, y + gridOffset);
      context.lineTo(width, y + gridOffset);
      context.stroke();
    }
    context.restore();

    for (const instance of frame.panels) {
      const { panel, y } = instance;
      const panelWidth = Math.max(72, panel.width * width);
      const panelHeight = Math.max(42, panel.height * height);
      const x = panel.x * width;
      const bevel = Math.min(panelWidth, panelHeight) * panel.bevel;

      context.save();
      context.globalAlpha = panel.priority === 1 ? 0.76 : 0.54;
      context.fillStyle = panel.alternate ? plan.palette.panelAlt : plan.palette.panel;
      context.strokeStyle = plan.palette.seam;
      context.lineWidth = panel.priority === 1 ? 1.6 : 1;
      context.beginPath();
      context.moveTo(x - panelWidth / 2 + bevel, y - panelHeight / 2);
      context.lineTo(x + panelWidth / 2, y - panelHeight / 2);
      context.lineTo(x + panelWidth / 2 - bevel * 0.65, y + panelHeight / 2);
      context.lineTo(x - panelWidth / 2, y + panelHeight / 2);
      context.closePath();
      context.fill();
      context.stroke();
      context.globalAlpha *= 0.55;
      context.strokeStyle = panel.alternate ? plan.palette.warning : plan.palette.accent;
      context.beginPath();
      context.moveTo(x - panelWidth * 0.34, y - panelHeight * 0.22);
      context.lineTo(x + panelWidth * 0.3, y - panelHeight * 0.22);
      context.lineTo(x + panelWidth * 0.23, y + panelHeight * 0.22);
      context.stroke();
      context.restore();
    }

    for (const instance of frame.conduits) {
      const { conduit, y } = instance;
      const x = conduit.x * width;
      const length = Math.max(90, conduit.length * width);
      const bend = Math.max(18, conduit.bend * height) * conduit.side;

      context.save();
      context.globalAlpha = conduit.priority === 1 ? 0.76 : 0.5;
      context.strokeStyle = conduit.priority === 1 ? plan.palette.accent : plan.palette.warning;
      context.lineWidth = conduit.priority === 1 ? 3 : 2;
      context.beginPath();
      context.moveTo(x - length / 2, y);
      context.lineTo(x - length * 0.12, y);
      context.quadraticCurveTo(x, y, x, y + bend);
      context.lineTo(x + length / 2, y + bend);
      context.stroke();
      context.restore();
    }

    context.save();
    for (const rib of frame.ribs) {
      const ribY = rib.y;
      context.globalAlpha = 0.82;
      context.fillStyle = plan.palette.trench;
      context.fillRect(0, ribY - 10, width, 20);
      context.globalAlpha = 0.78;
      context.strokeStyle = plan.palette.seam;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(0, ribY - 10);
      context.lineTo(width, ribY - 10);
      context.moveTo(0, ribY + 10);
      context.lineTo(width, ribY + 10);
      context.stroke();
      context.globalAlpha = 0.5;
      context.fillStyle = plan.palette.warning;
      for (let x = 18; x < width; x += 96) {
        context.fillRect(x, ribY - 2, 36, 4);
      }
    }
    context.restore();

    for (const instance of frame.lamps) {
      const { lamp, y } = instance;
      const x = lamp.x * width;
      const color = lamp.warning ? plan.palette.warning : plan.palette.lamp;
      context.save();
      context.globalAlpha = lamp.warning ? 0.82 : 0.9;
      context.fillStyle = color;
      if (!this.settings.performanceMode) {
        context.shadowColor = color;
        context.shadowBlur = lamp.warning ? 12 : 18;
      }
      context.fillRect(x - 12, y - 2, 24, 4);
      context.restore();
    }

    const leftOcclusion = context.createLinearGradient(0, 0, width * 0.28, 0);
    leftOcclusion.addColorStop(0, plan.palette.trench);
    leftOcclusion.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = leftOcclusion;
    context.globalAlpha = 0.86;
    context.fillRect(0, 0, width * 0.28, height);
    const rightOcclusion = context.createLinearGradient(width, 0, width * 0.72, 0);
    rightOcclusion.addColorStop(0, plan.palette.trench);
    rightOcclusion.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = rightOcclusion;
    context.fillRect(width * 0.72, 0, width * 0.28, height);
    context.globalAlpha = 1;
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
    environment: ConfinedEnvironmentPlan,
    distance: number,
    bounds: CombatBounds = createDefaultCombatBounds()
  ): void {
    const context = this.context;
    const railWidth = Math.max(24, bounds.width * 0.09);
    const highContrast = this.settings.bulletContrast === 'high';
    const passageOffset = wrapCanvasValue(distance * BOARDING_WORLD_TO_CANVAS, 112);
    context.save();
    context.fillStyle = highContrast ? '#020303' : environment.palette.far;
    context.globalAlpha = highContrast ? 0.92 : 0.86;
    context.fillRect(0, 0, bounds.width, bounds.height);

    context.globalAlpha = highContrast ? 0.5 : 0.62;
    context.strokeStyle = highContrast ? '#ffffff' : environment.palette.seam;
    context.lineWidth = 1;
    for (let y = -112; y < bounds.height + 112; y += 112) {
      const seamY = y + passageOffset;
      context.beginPath();
      context.moveTo(railWidth, seamY);
      context.lineTo(bounds.width - railWidth, seamY);
      context.stroke();
      context.fillStyle = environment.palette.panel;
      context.globalAlpha = highContrast ? 0.18 : 0.24;
      context.fillRect(railWidth + 8, seamY + 8, bounds.width - railWidth * 2 - 16, 88);
      context.globalAlpha = highContrast ? 0.5 : 0.62;
    }
    for (const x of [bounds.width * 0.34, bounds.width * 0.5, bounds.width * 0.66]) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, bounds.height);
      context.stroke();
    }
    for (const room of createVisibleBoardingRoomBands(operation, distance, bounds.height)) {
      if (room.bottom <= room.top) continue;
      context.save();
      context.beginPath();
      context.rect(0, room.top, bounds.width, room.bottom - room.top);
      context.clip();
      this.paintBoardingRoomTreatment(room.kind, environment, bounds, passageOffset, highContrast);
      context.restore();
    }

    context.fillStyle = highContrast ? '#000000' : environment.palette.trench;
    context.globalAlpha = 0.96;
    context.fillRect(0, 0, railWidth, bounds.height);
    context.fillRect(bounds.width - railWidth, 0, railWidth, bounds.height);
    context.strokeStyle = highContrast ? '#ffffff' : environment.palette.accent;
    context.lineWidth = highContrast ? 2.5 : 1.4;
    context.setLineDash([16, 10]);
    context.beginPath();
    context.moveTo(railWidth, 0);
    context.lineTo(railWidth, bounds.height);
    context.moveTo(bounds.width - railWidth, 0);
    context.lineTo(bounds.width - railWidth, bounds.height);
    context.stroke();
    context.setLineDash([]);

    context.globalAlpha = highContrast ? 0.72 : 0.86;
    context.fillStyle = highContrast ? '#ffffff' : environment.palette.warning;
    for (let y = -48; y < bounds.height + 48; y += 76) {
      const markerY = y + wrapCanvasValue(distance * 0.56, 76);
      context.save();
      context.translate(railWidth * 0.5, markerY);
      context.rotate(-0.58);
      context.fillRect(-12, -2, 24, 4);
      context.restore();
      context.save();
      context.translate(bounds.width - railWidth * 0.5, markerY);
      context.rotate(0.58);
      context.fillRect(-12, -2, 24, 4);
      context.restore();
    }

    for (const door of operation.doors) {
      const y = bounds.height - (door.atDistance - distance) * BOARDING_WORLD_TO_CANVAS;
      if (y < -32 || y > bounds.height + 32) continue;
      context.fillStyle = highContrast ? '#000000' : environment.palette.trench;
      context.strokeStyle = highContrast ? '#ffec6e' : environment.palette.warning;
      context.lineWidth = 3;
      context.fillRect(railWidth, y - 12, bounds.width - railWidth * 2, 24);
      context.strokeRect(railWidth, y - 12, bounds.width - railWidth * 2, 24);
      context.fillStyle = context.strokeStyle;
      context.font = '10px monospace';
      context.textAlign = 'center';
      context.fillText(`${door.lock.toUpperCase()} / ${door.integrity}`, bounds.width / 2, y + 3);
    }

    context.globalAlpha = 0.76;
    context.fillStyle = highContrast ? '#ffffff' : environment.palette.lamp;
    context.font = '11px monospace';
    context.textAlign = 'left';
    context.fillText(
      `BOARDING: ${operation.title.toUpperCase()} / ${environment.label.toUpperCase()}`,
      railWidth + 8,
      18
    );
    context.restore();
  }

  private paintBoardingRoomTreatment(
    kind: BoardingRoomKind,
    environment: ConfinedEnvironmentPlan,
    bounds: CombatBounds,
    passageOffset: number,
    highContrast: boolean
  ): void {
    const context = this.context;
    const railWidth = Math.max(24, bounds.width * 0.09);
    const left = railWidth + 18;
    const right = bounds.width - railWidth - 18;
    const center = bounds.width / 2;

    context.save();
    context.globalAlpha = highContrast ? 0.24 : 0.34;
    context.strokeStyle = highContrast ? '#ffffff' : environment.palette.accent;
    context.fillStyle = highContrast ? '#ffffff' : environment.palette.accent;
    context.lineWidth = 2;

    if (kind === 'reactor') {
      for (let y = -160; y < bounds.height + 160; y += 240) {
        const centerY = y + passageOffset * 1.6;
        for (const radius of [34, 48, 62]) {
          context.beginPath();
          context.arc(center, centerY, radius, 0, Math.PI * 2);
          context.stroke();
        }
      }
    } else if (kind === 'hangar' || kind === 'cargo') {
      for (let y = -100; y < bounds.height + 100; y += 92) {
        const markerY = y + passageOffset;
        context.beginPath();
        context.moveTo(left, markerY + 20);
        context.lineTo(center - 20, markerY);
        context.lineTo(right, markerY + 20);
        context.stroke();
      }
    } else if (kind === 'brig' || kind === 'quarters') {
      for (let y = -120; y < bounds.height + 120; y += 144) {
        const cellY = y + passageOffset;
        context.strokeRect(left + 12, cellY, 92, 78);
        context.strokeRect(right - 104, cellY, 92, 78);
      }
    } else if (kind === 'subsystem' || kind === 'bridge') {
      for (let y = -80; y < bounds.height + 80; y += 104) {
        const traceY = y + passageOffset;
        context.beginPath();
        context.moveTo(left, traceY);
        context.lineTo(center - 56, traceY);
        context.lineTo(center - 28, traceY + 22);
        context.lineTo(center + 48, traceY + 22);
        context.lineTo(center + 72, traceY);
        context.lineTo(right, traceY);
        context.stroke();
      }
    } else if (kind === 'airlock' || kind === 'extraction') {
      for (let y = -120; y < bounds.height + 120; y += 164) {
        const gateY = y + passageOffset;
        context.beginPath();
        context.moveTo(left, gateY + 28);
        context.lineTo(center, gateY);
        context.lineTo(right, gateY + 28);
        context.stroke();
      }
    } else {
      context.setLineDash([8, 22]);
      context.beginPath();
      context.moveTo(center, 0);
      context.lineTo(center, bounds.height);
      context.stroke();
      context.setLineDash([]);
    }

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

      if (activeHazard.hazard.kind === 'salvage_storm') {
        this.paintMeteorStormHazard(activeHazard, rect, color, style);
        continue;
      }

      if (activeHazard.hazard.kind === 'salvage_squall') {
        this.paintSalvageSquallHazard(activeHazard, rect, color, style);
        continue;
      }

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

  public paintDroneFollower(drone: DroneFollowerRenderState): void {
    const context = this.context;
    const highContrast = this.settings.bulletContrast === 'high';
    const pulse = clamp(drone.firingPulseSeconds / 0.14, 0, 1);
    const color = highContrast ? '#ffffff' : drone.color;
    context.save();
    context.translate(drone.x, drone.y);
    context.shadowBlur = this.settings.performanceMode ? 0 : 7 + pulse * 11;
    context.shadowColor = color;
    context.strokeStyle = color;
    context.fillStyle = highContrast ? '#050712' : '#07101d';
    context.lineWidth = 1.5 + pulse;
    context.beginPath();
    context.moveTo(0, -drone.radius * 1.2);
    context.lineTo(drone.radius, -drone.radius * 0.08);
    context.lineTo(drone.radius * 0.48, drone.radius * 0.82);
    context.lineTo(0, drone.radius * 0.48);
    context.lineTo(-drone.radius * 0.48, drone.radius * 0.82);
    context.lineTo(-drone.radius, -drone.radius * 0.08);
    context.closePath();
    context.fill();
    context.stroke();

    context.globalAlpha = 0.42 + pulse * 0.45;
    context.beginPath();
    context.arc(0, 0, drone.radius * (1.5 + pulse * 0.34), 0, Math.PI * 2);
    context.stroke();
    context.globalAlpha = 1;
    context.fillStyle = color;
    context.font = 'bold 6px ui-monospace, monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(drone.glyph, 0, 0);

    context.globalAlpha = 0.7;
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(-drone.radius * 0.3, drone.radius * 0.7);
    context.lineTo(0, drone.radius * (1.5 + pulse * 0.35));
    context.lineTo(drone.radius * 0.3, drone.radius * 0.7);
    context.closePath();
    context.fill();
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
    const phased = isPhaseProjectile(projectile.tags);
    const laserKind = getLaserProjectileKind(projectile.tags, projectile.laserKind);
    let projectileColor: string;

    context.save();
    context.translate(projectile.x, projectile.y);

    if (projectile.owner === 'player') {
      projectileColor = this.settings.bulletContrast === 'high' ? '#ffffff' : '#7cf7ff';
    } else if (projectile.owner === 'ally') {
      projectileColor = this.settings.bulletContrast === 'high' ? '#ffffff' : '#8dff9a';
    } else {
      const faction = projectile.factionId ? getFactionById(projectile.factionId) : null;
      projectileColor =
        this.settings.bulletContrast === 'high'
          ? '#ffef5f'
          : (faction?.palette.projectile ?? '#ff6bd6');
    }

    context.fillStyle = projectileColor;
    context.shadowColor = projectileColor;
    context.shadowBlur = velocityCues.highContrastProjectiles ? 14 : 10;

    if (projectile.visualKind === 'heatShot') {
      if (phased) {
        this.paintPhaseProjectileWake(
          projectile,
          projectileColor,
          velocityCues.highContrastProjectiles
        );
      }
      this.paintHeatShotProjectile(projectile, velocityCues.highContrastProjectiles);
      this.paintArcProjectileCharge(projectile, velocityCues.highContrastProjectiles);
      context.restore();
      return;
    }

    if (phased) {
      this.paintPhaseProjectileWake(
        projectile,
        projectileColor,
        velocityCues.highContrastProjectiles
      );
    }

    if (isMissileProjectile(projectile.tags)) {
      if (laserKind) {
        this.paintLaserProjectile(
          projectile,
          projectileColor,
          velocityCues.highContrastProjectiles,
          laserKind
        );
        this.paintArcProjectileCharge(projectile, velocityCues.highContrastProjectiles);
        context.restore();
        return;
      }
      this.paintMissileProjectile(
        projectile,
        projectileColor,
        velocityCues.highContrastProjectiles
      );
      this.paintArcProjectileCharge(projectile, velocityCues.highContrastProjectiles);
      context.restore();
      return;
    }

    if (laserKind) {
      this.paintLaserProjectile(
        projectile,
        projectileColor,
        velocityCues.highContrastProjectiles,
        laserKind
      );
      this.paintArcProjectileCharge(projectile, velocityCues.highContrastProjectiles);
      context.restore();
      return;
    }

    if (phased) {
      this.paintPhaseProjectileCore(
        projectile,
        projectileColor,
        velocityCues.highContrastProjectiles
      );
      this.paintArcProjectileCharge(projectile, velocityCues.highContrastProjectiles);
      context.restore();
      return;
    }

    context.beginPath();
    context.arc(0, 0, projectile.radius, 0, Math.PI * 2);
    context.fill();

    if (velocityCues.highContrastProjectiles) {
      context.shadowBlur = 0;
      context.strokeStyle = '#03050d';
      context.lineWidth = Math.max(2, projectile.radius * 0.55);
      context.stroke();
    }

    this.paintArcProjectileCharge(projectile, velocityCues.highContrastProjectiles);

    context.restore();
  }

  private paintLaserProjectile(
    projectile: ProjectileRenderState,
    projectileColor: string,
    highContrast: boolean,
    kind: LaserProjectileKind
  ): void {
    const context = this.context;
    const presentation = getLaserProjectilePresentation({
      ageSeconds: this.settings.reducedMotion ? 0.12 : projectile.ageSeconds,
      radius: projectile.radius,
      vx: projectile.vx,
      vy: projectile.vy,
      kind
    });
    const accentColor = highContrast
      ? '#ffef5f'
      : kind === 'beam'
        ? '#ffef5f'
        : kind === 'fork'
          ? '#ff6bd6'
          : kind === 'lane'
            ? '#62ffcb'
            : projectileColor;
    const halfLength = presentation.coreLength * 0.5;
    const halfWidth = presentation.coreWidth * 0.5;
    const glowEnabled = !this.settings.performanceMode;

    context.save();
    context.rotate(presentation.headingRadians);

    context.globalAlpha = highContrast ? 0.88 : presentation.pulse * 0.7;
    context.strokeStyle = accentColor;
    context.lineWidth = Math.max(1.2, presentation.coreWidth * 0.62);
    context.beginPath();
    context.moveTo(0, halfLength * 0.56);
    context.lineTo(0, halfLength + presentation.wakeLength);
    context.stroke();

    context.globalAlpha = highContrast ? 1 : 0.78;
    context.strokeStyle = accentColor;
    context.lineWidth = highContrast ? 2.5 : Math.max(1.2, presentation.shellWidth * 0.42);
    context.shadowColor = accentColor;
    context.shadowBlur = glowEnabled ? (kind === 'beam' ? 18 : 11) : 0;

    if (kind === 'beam') {
      context.beginPath();
      context.moveTo(0, -halfLength);
      context.lineTo(presentation.shellWidth * 0.5, halfLength * 0.62);
      context.lineTo(0, halfLength);
      context.lineTo(-presentation.shellWidth * 0.5, halfLength * 0.62);
      context.closePath();
      context.stroke();
    } else if (kind === 'lane') {
      const rail = Math.max(2.2, presentation.branchSpread * 0.48);
      context.beginPath();
      context.moveTo(-rail, -halfLength);
      context.lineTo(-rail, halfLength);
      context.moveTo(rail, -halfLength);
      context.lineTo(rail, halfLength);
      context.moveTo(-rail * 1.45, -halfLength * 0.78);
      context.lineTo(rail * 1.45, -halfLength * 0.78);
      context.stroke();
    } else if (kind === 'split') {
      const split = Math.max(1.8, presentation.branchSpread * 0.45);
      context.beginPath();
      context.moveTo(-split, halfLength * 0.8);
      context.lineTo(-split, -halfLength * 0.5);
      context.lineTo(0, -halfLength);
      context.lineTo(split, -halfLength * 0.5);
      context.lineTo(split, halfLength * 0.8);
      context.stroke();
    } else if (kind === 'fork') {
      context.beginPath();
      context.moveTo(0, halfLength);
      context.lineTo(0, -halfLength * 0.12);
      context.lineTo(-presentation.branchSpread, -halfLength);
      context.moveTo(0, -halfLength * 0.12);
      context.lineTo(presentation.branchSpread, -halfLength);
      context.stroke();
    }

    context.globalAlpha = 1;
    context.fillStyle = highContrast ? '#ffffff' : projectileColor;
    context.strokeStyle = highContrast ? '#03050d' : '#ffffff';
    context.lineWidth = highContrast ? 2 : Math.max(0.8, presentation.coreWidth * 0.22);
    context.beginPath();
    context.moveTo(0, -halfLength);
    context.lineTo(halfWidth, halfLength * 0.5);
    context.lineTo(0, halfLength);
    context.lineTo(-halfWidth, halfLength * 0.5);
    context.closePath();
    context.fill();
    context.shadowBlur = 0;
    context.stroke();

    if (kind === 'beam') {
      context.strokeStyle = highContrast ? '#03050d' : '#ff9c4a';
      context.lineWidth = Math.max(1, presentation.coreWidth * 0.28);
      context.beginPath();
      context.moveTo(0, -halfLength * 0.72);
      context.lineTo(0, halfLength * 0.62);
      context.stroke();
    }

    context.restore();
  }

  private paintArcProjectileCharge(projectile: ProjectileRenderState, highContrast: boolean): void {
    const profile = getArcChargeProfile(projectile);
    if (!profile) return;

    const context = this.context;
    const age = this.settings.reducedMotion ? 0.14 : Math.max(0, projectile.ageSeconds ?? 0);
    const pulse = 0.78 + Math.sin(age * 19) * 0.18;
    const shellRadius = Math.max(
      projectile.radius + 3,
      projectile.radius * (profile.kind === 'heavy' ? 1.95 : 1.62)
    );
    const accent = highContrast ? '#ffef5f' : profile.kind === 'heavy' ? '#ff6bd6' : '#7cf7ff';
    const branchCount = this.settings.performanceMode ? 2 : profile.kind === 'heavy' ? 5 : 3;

    context.save();
    context.rotate(age * (profile.kind === 'heavy' ? 2.8 : 2.1));
    context.globalAlpha = highContrast ? 0.96 : pulse;
    context.strokeStyle = accent;
    context.lineWidth = highContrast ? 2.2 : profile.kind === 'heavy' ? 1.65 : 1.25;
    context.shadowColor = accent;
    context.shadowBlur = this.settings.reducedMotion ? 0 : profile.kind === 'heavy' ? 16 : 10;
    context.setLineDash([Math.max(2, shellRadius * 0.34), Math.max(2, shellRadius * 0.24)]);
    context.beginPath();
    context.arc(0, 0, shellRadius, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);

    for (let index = 0; index < branchCount; index += 1) {
      const angle = (index / branchCount) * Math.PI * 2;
      const tangentX = -Math.sin(angle);
      const tangentY = Math.cos(angle);
      const innerX = Math.cos(angle) * shellRadius * 0.62;
      const innerY = Math.sin(angle) * shellRadius * 0.62;
      const outerX = Math.cos(angle) * shellRadius * 1.18;
      const outerY = Math.sin(angle) * shellRadius * 1.18;
      const kink = (index % 2 === 0 ? 1 : -1) * shellRadius * 0.22;
      context.beginPath();
      context.moveTo(innerX, innerY);
      context.lineTo(
        (innerX + outerX) * 0.5 + tangentX * kink,
        (innerY + outerY) * 0.5 + tangentY * kink
      );
      context.lineTo(outerX, outerY);
      context.stroke();
    }
    context.restore();
  }

  private paintHeatShotProjectile(projectile: ProjectileRenderState, highContrast: boolean): void {
    const context = this.context;
    const presentation = getHeatShotPresentation({
      ageSeconds: this.settings.reducedMotion ? 0.12 : projectile.ageSeconds,
      radius: projectile.radius,
      vx: projectile.vx,
      vy: projectile.vy
    });
    const shellColor = highContrast ? '#ffef5f' : '#ff9c4a';
    const wakeColor = highContrast ? '#ffffff' : '#ffd166';

    context.save();
    context.rotate(presentation.headingRadians);

    context.globalAlpha = highContrast ? 0.92 : presentation.pulse * 0.72;
    context.strokeStyle = wakeColor;
    context.lineWidth = highContrast ? 3 : Math.max(1.8, projectile.radius * 0.34);
    context.beginPath();
    context.moveTo(-presentation.wakeSpread, projectile.radius * 0.78);
    context.quadraticCurveTo(
      -presentation.wakeSpread * 1.4,
      presentation.wakeLength * 0.55,
      -presentation.wakeSpread * 0.3,
      presentation.wakeLength
    );
    context.moveTo(presentation.wakeSpread, projectile.radius * 0.78);
    context.quadraticCurveTo(
      presentation.wakeSpread * 1.4,
      presentation.wakeLength * 0.55,
      presentation.wakeSpread * 0.3,
      presentation.wakeLength
    );
    context.stroke();

    context.globalAlpha = highContrast ? 1 : 0.9;
    context.fillStyle = shellColor;
    context.strokeStyle = highContrast ? '#03050d' : '#fff3c4';
    context.lineWidth = highContrast ? 2.5 : 1.5;
    context.beginPath();
    context.moveTo(0, -presentation.shellRadius);
    context.lineTo(presentation.shellRadius * 0.86, 0);
    context.lineTo(presentation.shellRadius * 0.52, presentation.shellRadius);
    context.lineTo(-presentation.shellRadius * 0.52, presentation.shellRadius);
    context.lineTo(-presentation.shellRadius * 0.86, 0);
    context.closePath();
    context.fill();
    context.stroke();

    context.fillStyle = '#ffffff';
    context.shadowColor = highContrast ? '#ffffff' : '#ffef5f';
    context.shadowBlur = this.settings.reducedMotion ? 0 : 16;
    context.beginPath();
    context.ellipse(
      0,
      0,
      presentation.coreWidth * 0.5,
      presentation.coreLength * 0.5,
      0,
      0,
      Math.PI * 2
    );
    context.fill();
    context.restore();
  }

  private paintPhaseProjectileWake(
    projectile: ProjectileRenderState,
    projectileColor: string,
    highContrast: boolean
  ): void {
    const context = this.context;
    const presentation = getPhaseProjectilePresentation({
      ageSeconds: this.settings.reducedMotion ? 0.12 : projectile.ageSeconds,
      radius: projectile.radius,
      vx: projectile.vx,
      vy: projectile.vy
    });
    const echoCount = this.settings.performanceMode ? 1 : this.settings.reducedMotion ? 2 : 3;
    const phaseAccent =
      projectile.owner === 'enemy'
        ? '#ffdf70'
        : projectile.owner === 'ally'
          ? '#9bffb0'
          : '#ff6bd6';

    context.save();
    context.rotate(presentation.headingRadians);
    context.globalAlpha = highContrast ? 0.82 : presentation.visibility * 0.7;
    context.strokeStyle = highContrast ? '#ffffff' : phaseAccent;
    context.fillStyle = highContrast ? '#ffffff' : projectileColor;
    context.lineWidth = highContrast ? 1.8 : Math.max(1, projectile.radius * 0.24);
    context.setLineDash([
      Math.max(2, projectile.radius * 0.72),
      Math.max(2, projectile.radius * 0.58)
    ]);
    context.beginPath();
    context.moveTo(0, projectile.radius * 1.1);
    context.lineTo(0, presentation.wakeLength);
    context.stroke();
    context.setLineDash([]);

    for (let index = echoCount; index > 0; index -= 1) {
      const depth = index / echoCount;
      const y = presentation.echoDistance * depth;
      const x = (index % 2 === 0 ? -1 : 1) * presentation.lateralOffset * depth;
      const radius = projectile.radius * (0.72 - depth * 0.16);
      context.globalAlpha = (highContrast ? 0.46 : 0.38) * (1 - depth * 0.38);
      context.beginPath();
      context.moveTo(x, y - radius * 1.25);
      context.lineTo(x + radius, y);
      context.lineTo(x, y + radius * 1.25);
      context.lineTo(x - radius, y);
      context.closePath();
      context.stroke();
    }

    context.globalAlpha = highContrast ? 0.76 : 0.58;
    context.strokeStyle = highContrast ? '#ffffff' : projectileColor;
    context.lineWidth = highContrast ? 2 : Math.max(1.2, projectile.radius * 0.28);
    context.rotate(presentation.apertureRotation);
    context.beginPath();
    context.arc(0, 0, presentation.apertureRadius, Math.PI * 0.12, Math.PI * 0.74);
    context.moveTo(presentation.apertureRadius, 0);
    context.arc(0, 0, presentation.apertureRadius, Math.PI * 1.08, Math.PI * 1.68);
    context.stroke();
    context.restore();
  }

  private paintPhaseProjectileCore(
    projectile: ProjectileRenderState,
    projectileColor: string,
    highContrast: boolean
  ): void {
    const context = this.context;
    const presentation = getPhaseProjectilePresentation({
      ageSeconds: this.settings.reducedMotion ? 0.12 : projectile.ageSeconds,
      radius: projectile.radius,
      vx: projectile.vx,
      vy: projectile.vy
    });
    const radius = Math.max(3.5, projectile.radius) * presentation.coreScale;
    const phaseAccent = projectile.owner === 'enemy' ? '#ffdf70' : '#ff6bd6';
    const shellOffset = presentation.lateralOffset * 0.42;

    context.save();
    context.rotate(presentation.headingRadians);
    context.shadowColor = highContrast ? '#ffffff' : phaseAccent;
    context.shadowBlur = this.settings.performanceMode ? 0 : highContrast ? 8 : 14;
    context.globalAlpha = highContrast ? 0.58 : 0.46;
    context.fillStyle = highContrast ? '#ffffff' : phaseAccent;
    for (const offset of [-shellOffset, shellOffset]) {
      context.beginPath();
      context.moveTo(offset, -radius * 1.34);
      context.lineTo(offset + radius * 0.82, 0);
      context.lineTo(offset, radius * 1.34);
      context.lineTo(offset - radius * 0.82, 0);
      context.closePath();
      context.fill();
    }

    context.globalAlpha = 1;
    context.fillStyle = highContrast ? '#ffffff' : projectileColor;
    context.strokeStyle = '#03050d';
    context.lineWidth = highContrast ? 2.4 : Math.max(1.2, projectile.radius * 0.28);
    context.beginPath();
    context.moveTo(0, -radius * 1.62);
    context.lineTo(radius * 0.98, -radius * 0.08);
    context.lineTo(radius * 0.42, radius * 0.34);
    context.lineTo(0, radius * 1.55);
    context.lineTo(-radius * 0.42, radius * 0.34);
    context.lineTo(-radius * 0.98, -radius * 0.08);
    context.closePath();
    context.fill();
    context.shadowBlur = 0;
    context.stroke();

    context.strokeStyle = highContrast ? '#03050d' : '#ffffff';
    context.lineWidth = Math.max(1, projectile.radius * 0.2);
    context.beginPath();
    context.moveTo(-radius * 0.58, 0);
    context.lineTo(radius * 0.58, 0);
    context.stroke();
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(0, -radius * 0.28, Math.max(1.2, projectile.radius * 0.22), 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  private paintMissileProjectile(
    projectile: ProjectileRenderState,
    projectileColor: string,
    highContrast: boolean
  ): void {
    const context = this.context;
    const ageSeconds = Math.max(0, projectile.ageSeconds ?? 0);
    const thrustScale = getMissileThrustScale(ageSeconds);
    const phase = getMissileFlightPhase(ageSeconds);
    const bodyWidth = Math.max(7, projectile.radius * 1.42);
    const bodyLength = Math.max(18, projectile.radius * 3.25);
    const tailY = bodyLength * 0.42;
    const exhaustLength =
      projectile.radius * (phase === 'ejection' ? 1.05 : 1.4 + thrustScale * 1.25);
    const glowEnabled = !this.settings.performanceMode;

    context.rotate(Math.atan2(projectile.vx, -projectile.vy));

    if (glowEnabled) {
      const exhaustGlow = context.createLinearGradient(0, tailY, 0, tailY + exhaustLength);
      exhaustGlow.addColorStop(0, '#ffffff');
      exhaustGlow.addColorStop(0.18, '#ffb14a');
      exhaustGlow.addColorStop(0.58, projectile.owner === 'enemy' ? '#ff6bd6' : '#7cf7ff');
      exhaustGlow.addColorStop(1, 'rgba(124, 247, 255, 0)');
      context.save();
      context.globalAlpha = this.settings.reducedMotion ? 0.7 : 0.88;
      context.fillStyle = exhaustGlow;
      context.shadowColor = projectile.owner === 'enemy' ? '#ff6bd6' : '#7cf7ff';
      context.shadowBlur = highContrast ? 8 : 13;
      context.beginPath();
      context.moveTo(-bodyWidth * 0.24, tailY - 1);
      context.lineTo(bodyWidth * 0.24, tailY - 1);
      context.lineTo(bodyWidth * 0.11, tailY + exhaustLength * 0.62);
      context.lineTo(0, tailY + exhaustLength);
      context.lineTo(-bodyWidth * 0.11, tailY + exhaustLength * 0.62);
      context.closePath();
      context.fill();
      context.restore();
    }

    context.save();
    context.shadowColor = projectileColor;
    context.shadowBlur = highContrast || this.settings.performanceMode ? 0 : 9;
    context.fillStyle = highContrast ? '#ffffff' : projectileColor;
    context.strokeStyle = '#03050d';
    context.lineWidth = highContrast ? 2.2 : 1.25;

    context.beginPath();
    context.moveTo(-bodyWidth * 0.48, bodyLength * 0.2);
    context.lineTo(-bodyWidth * 0.92, bodyLength * 0.48);
    context.lineTo(-bodyWidth * 0.34, bodyLength * 0.4);
    context.lineTo(bodyWidth * 0.34, bodyLength * 0.4);
    context.lineTo(bodyWidth * 0.92, bodyLength * 0.48);
    context.lineTo(bodyWidth * 0.48, bodyLength * 0.2);
    context.closePath();
    context.fill();
    context.stroke();

    context.beginPath();
    context.moveTo(0, -bodyLength * 0.58);
    context.quadraticCurveTo(
      bodyWidth * 0.5,
      -bodyLength * 0.35,
      bodyWidth * 0.5,
      -bodyLength * 0.04
    );
    context.lineTo(bodyWidth * 0.38, bodyLength * 0.4);
    context.lineTo(-bodyWidth * 0.38, bodyLength * 0.4);
    context.lineTo(-bodyWidth * 0.5, -bodyLength * 0.04);
    context.quadraticCurveTo(-bodyWidth * 0.5, -bodyLength * 0.35, 0, -bodyLength * 0.58);
    context.closePath();
    context.fill();
    context.stroke();

    context.shadowBlur = 0;
    context.strokeStyle = highContrast ? '#03050d' : 'rgba(255, 255, 255, 0.86)';
    context.lineWidth = Math.max(1.1, projectile.radius * 0.16);
    context.beginPath();
    context.moveTo(0, -bodyLength * 0.3);
    context.lineTo(0, bodyLength * 0.22);
    context.stroke();

    context.fillStyle = phase === 'ejection' ? '#ffef9a' : '#ffffff';
    context.beginPath();
    context.arc(0, -bodyLength * 0.29, Math.max(1.5, projectile.radius * 0.22), 0, Math.PI * 2);
    context.fill();
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
    const velocityCues = getVelocityCueState(this.settings);
    if (effect.kind === 'heatExhaust') {
      this.paintHeatExhaustEffect(effect, alpha, velocityCues.highContrastProjectiles);
      return;
    }
    if (effect.kind === 'arcDischarge') {
      this.paintArcDischargeEffect(effect, alpha, velocityCues.highContrastProjectiles);
      return;
    }
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
                : effect.kind === 'phaseCollapse' && velocityCues.highContrastProjectiles
                  ? '#ffffff'
                  : '#ff6bd6';

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

    context.globalAlpha =
      effect.kind === 'graze'
        ? alpha * 0.78
        : effect.kind === 'phaseCollapse'
          ? alpha * 0.9
          : alpha * 0.62;
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth =
      effect.kind === 'bomb' || effect.kind === 'environmentBreak'
        ? 4
        : effect.kind === 'phaseCollapse'
          ? 3
          : 2;
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
    } else if (effect.kind === 'phaseCollapse') {
      const collapseProgress = 1 - alpha;
      const highContrast = velocityCues.highContrastProjectiles;
      context.shadowBlur = this.settings.reducedMotion ? 0 : 10;
      context.save();
      context.rotate(collapseProgress * Math.PI * 0.85);
      context.lineWidth = highContrast ? 3 : 2.4;
      for (const [offset, strokeColor] of [
        [-1, highContrast ? '#ffffff' : '#ff6bd6'],
        [1, highContrast ? '#ffef5f' : '#7cf7ff']
      ] as const) {
        context.globalAlpha = alpha * 0.9;
        context.strokeStyle = strokeColor;
        context.beginPath();
        context.arc(
          offset * radius * 0.13,
          0,
          radius * 0.72,
          offset < 0 ? Math.PI * 0.12 : Math.PI * 1.12,
          offset < 0 ? Math.PI * 0.88 : Math.PI * 1.88
        );
        context.stroke();
      }
      context.restore();

      context.globalAlpha = alpha;
      context.fillStyle = highContrast ? '#ffffff' : '#f8fbff';
      context.beginPath();
      context.moveTo(0, -Math.max(3, radius * 0.18));
      context.lineTo(Math.max(3, radius * 0.18), 0);
      context.lineTo(0, Math.max(3, radius * 0.18));
      context.lineTo(-Math.max(3, radius * 0.18), 0);
      context.closePath();
      context.fill();
    }

    context.restore();
  }

  private paintArcDischargeEffect(
    effect: CombatEffectRenderState,
    alpha: number,
    highContrast: boolean
  ): void {
    const context = this.context;
    const targetX = effect.targetX ?? effect.x;
    const targetY = effect.targetY ?? effect.y;
    const dx = targetX - effect.x;
    const dy = targetY - effect.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const normalX = -dy / length;
    const normalY = dx / length;
    const segmentCount = this.settings.performanceMode ? 5 : this.settings.reducedMotion ? 7 : 9;
    const phase = this.settings.reducedMotion ? 0.36 : 1 - alpha;
    const accent = highContrast ? '#ffef5f' : '#7cf7ff';
    const core = highContrast ? '#ffffff' : '#f8fbff';
    const points: Array<{ readonly x: number; readonly y: number }> = [];

    for (let index = 0; index <= segmentCount; index += 1) {
      const progress = index / segmentCount;
      const taper = Math.sin(progress * Math.PI);
      const offset =
        index === 0 || index === segmentCount
          ? 0
          : Math.sin(index * 7.7 + phase * 21) * effect.radius * 0.72 * taper;
      points.push({
        x: effect.x + dx * progress + normalX * offset,
        y: effect.y + dy * progress + normalY * offset
      });
    }

    const strokeBolt = (color: string, width: number, opacity: number): void => {
      context.globalAlpha = alpha * opacity;
      context.strokeStyle = color;
      context.lineWidth = width;
      context.beginPath();
      context.moveTo(points[0]!.x, points[0]!.y);
      for (const point of points.slice(1)) context.lineTo(point.x, point.y);
      context.stroke();
    };

    context.save();
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.shadowColor = accent;
    context.shadowBlur = this.settings.reducedMotion ? 0 : 18;
    if (highContrast) strokeBolt('#03050d', 6, 0.9);
    strokeBolt(accent, highContrast ? 3.5 : 4.2, 0.72);
    strokeBolt(core, highContrast ? 1.7 : 1.45, 1);

    context.globalAlpha = alpha;
    context.fillStyle = core;
    context.strokeStyle = accent;
    context.lineWidth = highContrast ? 2.5 : 1.5;
    context.beginPath();
    context.arc(targetX, targetY, Math.max(3.5, effect.radius * 0.34), 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.restore();
  }

  private paintHeatExhaustEffect(
    effect: CombatEffectRenderState,
    alpha: number,
    highContrast: boolean
  ): void {
    const context = this.context;
    const progress = 1 - alpha;
    const plumeLength = effect.radius * (0.9 + progress * 1.25);
    const plumeWidth = effect.radius * (0.46 + progress * 0.42);
    const plumeColor = highContrast ? '#ffffff' : '#ff9c4a';

    context.save();
    context.translate(effect.x, effect.y);
    context.globalAlpha = alpha * 0.78;
    context.fillStyle = plumeColor;
    context.strokeStyle = highContrast ? '#03050d' : '#ffd166';
    context.lineWidth = highContrast ? 2.5 : 1.5;
    context.shadowColor = highContrast ? '#ffffff' : '#ff9c4a';
    context.shadowBlur = this.settings.reducedMotion ? 0 : 12;
    context.beginPath();
    context.moveTo(-plumeWidth * 0.45, 0);
    context.quadraticCurveTo(-plumeWidth, plumeLength * 0.34, -plumeWidth * 0.25, plumeLength);
    context.lineTo(0, plumeLength * 0.74);
    context.lineTo(plumeWidth * 0.25, plumeLength);
    context.quadraticCurveTo(plumeWidth, plumeLength * 0.34, plumeWidth * 0.45, 0);
    context.closePath();
    context.fill();
    context.stroke();

    context.globalAlpha = alpha;
    context.fillStyle = highContrast ? '#ffef5f' : '#fff3c4';
    context.beginPath();
    context.ellipse(0, plumeLength * 0.2, plumeWidth * 0.22, plumeLength * 0.3, 0, 0, Math.PI * 2);
    context.fill();
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

  private paintMeteorStormHazard(
    activeHazard: ActiveSectorHazard,
    rect: SectorHazardCollisionRect,
    color: string,
    style: SectorHazardVisualState
  ): void {
    if (activeHazard.phase !== 'active') {
      return;
    }

    const context = this.context;
    const geometry = createMeteorStormGeometry(activeHazard, rect);
    const pocket = geometry.pocket;
    const highContrast = this.settings.bulletContrast === 'high';
    const markerColor = highContrast ? '#ffffff' : '#ffd166';
    const impactColor = highContrast ? '#fff36b' : '#ff784f';

    context.save();
    context.fillStyle = color;
    context.globalAlpha = style.fillAlpha * 0.42;
    context.beginPath();
    context.ellipse(
      pocket.centerX,
      pocket.centerY,
      pocket.radiusX,
      pocket.radiusY,
      0,
      0,
      Math.PI * 2
    );
    context.fill();
    context.strokeStyle = color;
    context.lineWidth = style.lineWidth;
    context.globalAlpha = style.strokeAlpha * 0.62;
    context.setLineDash([7, 11]);
    context.stroke();
    context.setLineDash([]);

    for (const impact of geometry.impacts) {
      this.paintMeteorStormImpact(impact, markerColor, impactColor, style);
    }

    context.restore();
  }

  private paintMeteorStormImpact(
    impact: MeteorStormImpact,
    markerColor: string,
    impactColor: string,
    style: SectorHazardVisualState
  ): void {
    const context = this.context;
    const telegraphing = impact.phase === 'telegraph';

    if (telegraphing) {
      const progress = impact.phaseProgress;
      const outerRadius = impact.radius * (1.48 - progress * 0.38);
      context.strokeStyle = markerColor;
      context.lineWidth = Math.max(1.4, style.lineWidth * 0.9);
      context.globalAlpha = style.strokeAlpha * (0.72 + progress * 0.2);
      context.setLineDash([8, 5]);
      context.beginPath();
      context.arc(impact.x, impact.y, outerRadius, 0, Math.PI * 2);
      context.stroke();
      context.setLineDash([]);
      context.globalAlpha *= 0.8;
      context.beginPath();
      context.arc(impact.x, impact.y, Math.max(5, impact.radius * progress), 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.moveTo(impact.x - 7, impact.y);
      context.lineTo(impact.x + 7, impact.y);
      context.moveTo(impact.x, impact.y - 7);
      context.lineTo(impact.x, impact.y + 7);
      context.stroke();
      return;
    }

    if (impact.phase === 'impact') {
      const flare = 1 - impact.phaseProgress * 0.22;
      context.fillStyle = impactColor;
      context.strokeStyle = markerColor;
      context.globalAlpha = style.fillAlpha * 3.8;
      context.beginPath();
      context.arc(impact.x, impact.y, impact.radius * flare, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = style.strokeAlpha;
      context.lineWidth = Math.max(2, style.lineWidth * 1.2);
      context.stroke();

      context.globalAlpha *= 0.82;
      context.lineWidth = 2;
      const streakLength = this.settings.reducedMotion ? 28 : 48;
      context.beginPath();
      context.moveTo(impact.x - streakLength * 0.52, impact.y - streakLength);
      context.lineTo(impact.x - impact.radius * 0.18, impact.y - impact.radius * 0.2);
      context.stroke();
      return;
    }

    const afterglowRadius = impact.radius * (0.78 + impact.phaseProgress * 0.7);
    context.strokeStyle = impactColor;
    context.lineWidth = Math.max(1, style.lineWidth * 0.68);
    context.globalAlpha = style.strokeAlpha * (1 - impact.phaseProgress) * 0.52;
    context.beginPath();
    context.arc(impact.x, impact.y, afterglowRadius, 0, Math.PI * 2);
    context.stroke();
    if (!this.settings.performanceMode) {
      const fragmentCount = this.settings.reducedMotion ? 3 : 5;
      for (let index = 0; index < fragmentCount; index += 1) {
        const angle = (index / fragmentCount) * Math.PI * 2 + impact.index * 0.72;
        const distance = afterglowRadius * 0.7;
        context.beginPath();
        context.moveTo(
          impact.x + Math.cos(angle) * distance,
          impact.y + Math.sin(angle) * distance
        );
        context.lineTo(
          impact.x + Math.cos(angle) * (distance + 6),
          impact.y + Math.sin(angle) * (distance + 6)
        );
        context.stroke();
      }
    }
  }

  private paintSalvageSquallHazard(
    activeHazard: ActiveSectorHazard,
    rect: SectorHazardCollisionRect,
    color: string,
    style: SectorHazardVisualState
  ): void {
    const context = this.context;
    const geometry = createSalvageStormGeometry(activeHazard, rect);
    const active = activeHazard.phase === 'active';
    const highContrast = this.settings.bulletContrast === 'high';
    const chargedColor = highContrast ? '#fff36b' : '#ffd166';
    const calmColor = highContrast ? '#ffffff' : '#72f1da';
    const particleCount = this.settings.performanceMode ? 4 : this.settings.reducedMotion ? 6 : 10;

    context.save();
    context.fillStyle = color;
    context.globalAlpha = style.fillAlpha * (active ? 0.34 : 0.2);
    context.fillRect(rect.left, rect.top, rect.width, rect.height);
    context.strokeStyle = color;
    context.lineWidth = style.lineWidth;
    context.globalAlpha = style.strokeAlpha * (active ? 0.74 : 0.56);
    context.setLineDash(active ? [] : [10, 9]);
    context.strokeRect(rect.left, rect.top, rect.width, rect.height);
    context.setLineDash([]);

    for (const [laneIndex, lane] of geometry.laneRects.entries()) {
      const calm = laneIndex === geometry.calmLaneIndex;
      const charged = active && geometry.damageWindowOpen && !calm;
      context.fillStyle = charged ? chargedColor : color;
      context.globalAlpha = charged ? style.fillAlpha : style.fillAlpha * (calm ? 0.06 : 0.2);
      context.fillRect(lane.left, lane.top, lane.width, lane.height);
      context.strokeStyle = calm ? calmColor : chargedColor;
      context.lineWidth = calm ? style.lineWidth * 1.15 : style.lineWidth * 0.82;
      context.globalAlpha = calm
        ? style.strokeAlpha * 0.9
        : style.strokeAlpha * (charged ? 0.66 : 0.34);
      context.setLineDash(calm ? [18, 8] : active ? [] : [6, 12]);
      context.strokeRect(lane.left, lane.top, lane.width, lane.height);
      context.setLineDash([]);

      if (calm) {
        this.paintSalvageStormCalmLane(lane, calmColor, geometry.flowDirection, style);
      } else {
        this.paintSalvageStormCharge(
          lane,
          chargedColor,
          laneIndex,
          geometry.flowDirection,
          geometry.pulseProgress,
          charged,
          particleCount,
          style
        );
      }
    }

    this.paintSalvageStormSequence(rect, geometry.calmLaneIndex, geometry.flowDirection, calmColor, style);
    context.restore();
  }

  private paintSalvageStormCalmLane(
    rect: SectorHazardCollisionRect,
    color: string,
    flowDirection: -1 | 1,
    style: SectorHazardVisualState
  ): void {
    const context = this.context;
    context.strokeStyle = color;
    context.lineWidth = 1.4;
    context.globalAlpha = style.strokeAlpha * 0.64;
    const direction = flowDirection > 0 ? 1 : -1;
    for (let y = rect.top + 42; y < rect.bottom - 18; y += style.patternStride + 24) {
      context.beginPath();
      context.moveTo(rect.centerX - direction * 12, y - 7);
      context.lineTo(rect.centerX + direction * 2, y);
      context.lineTo(rect.centerX - direction * 12, y + 7);
      context.stroke();
    }
  }

  private paintSalvageStormCharge(
    rect: SectorHazardCollisionRect,
    color: string,
    laneIndex: number,
    flowDirection: -1 | 1,
    pulseProgress: number,
    charged: boolean,
    particleCount: number,
    style: SectorHazardVisualState
  ): void {
    const context = this.context;
    const motion = this.settings.reducedMotion ? 0 : pulseProgress * rect.height * 0.34;
    const direction = flowDirection > 0 ? 1 : -1;
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = charged ? 1.8 : 1.1;
    context.globalAlpha = style.strokeAlpha * (charged ? 0.78 : 0.34);

    for (let index = 0; index < particleCount; index += 1) {
      const xRatio = ((index * 47 + laneIndex * 31) % 101) / 100;
      const x = rect.left + 10 + xRatio * Math.max(1, rect.width - 20);
      const yOffset = (index * 79 + laneIndex * 43 + motion) % Math.max(1, rect.height);
      const y = rect.top + yOffset;
      const length = 8 + (index % 3) * 4;
      context.beginPath();
      context.moveTo(x - direction * length * 0.55, y - length);
      context.lineTo(x + direction * length * 0.55, y + length);
      context.stroke();
      if (charged && index % 3 === 0) {
        context.beginPath();
        context.moveTo(x - 3, y);
        context.lineTo(x + direction * 5, y + 5);
        context.lineTo(x - direction * 2, y + 8);
        context.closePath();
        context.fill();
      }
    }

    if (!this.settings.performanceMode) {
      context.globalAlpha *= 0.68;
      context.lineWidth = 1.2;
      const arcCount = this.settings.reducedMotion ? 2 : 4;
      for (let index = 0; index < arcCount; index += 1) {
        const y = rect.top + ((index + 1) / (arcCount + 1)) * rect.height;
        const inset = 8 + ((index * 13 + laneIndex * 7) % 18);
        context.beginPath();
        context.moveTo(rect.left + inset, y - 8);
        context.lineTo(rect.centerX - direction * 6, y + 4);
        context.lineTo(rect.right - inset, y - 4);
        context.stroke();
      }
    }
  }

  private paintSalvageStormSequence(
    rect: SectorHazardCollisionRect,
    calmLaneIndex: number,
    flowDirection: -1 | 1,
    color: string,
    style: SectorHazardVisualState
  ): void {
    const context = this.context;
    const direction = flowDirection > 0 ? 1 : -1;
    const y = rect.top + 18;
    const step = rect.width / 3;
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = 1.4;
    context.globalAlpha = style.strokeAlpha * 0.84;

    for (let index = 0; index < 3; index += 1) {
      const x = rect.left + step * (index + 0.5);
      context.beginPath();
      context.arc(x, y, index === calmLaneIndex ? 4.5 : 2.2, 0, Math.PI * 2);
      context.fill();
    }
    context.beginPath();
    context.moveTo(rect.centerX - direction * 18, y);
    context.lineTo(rect.centerX + direction * 18, y);
    context.lineTo(rect.centerX + direction * 10, y - 6);
    context.moveTo(rect.centerX + direction * 18, y);
    context.lineTo(rect.centerX + direction * 10, y + 6);
    context.stroke();
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
    if (!track) {
      return;
    }
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
