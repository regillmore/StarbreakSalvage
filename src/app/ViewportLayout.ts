import { clamp, type Vector2 } from '../core/math';
import {
  COMBAT_ARENA_HEIGHT,
  COMBAT_ARENA_PADDING,
  COMBAT_ARENA_WIDTH
} from '../game/CombatGeometry';

export type ViewportClass = 'narrow' | 'standard' | 'wide';

export interface ViewportLayoutInput {
  readonly width: number;
  readonly height: number;
  readonly dpr?: number;
}

export interface ViewportRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface HudSafeArea {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
}

export interface ViewportLayout {
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
  readonly viewportClass: ViewportClass;
  readonly canvasScale: number;
  readonly combatPadding: number;
  readonly hudSafeArea: HudSafeArea;
  readonly viewportSafeFrame: ViewportRect;
  readonly gameplaySafeFrame: ViewportRect;
}

export interface CombatPointerPosition extends Vector2 {
  readonly insideFrame: boolean;
}

const MIN_VIEWPORT_WIDTH = 320;
const MIN_VIEWPORT_HEIGHT = 240;
const MIN_SAFE_FRAME_WIDTH = 260;
const MIN_SAFE_FRAME_HEIGHT = 132;
const MAX_GAMEPLAY_PRESENTATION_SCALE = 1.22;

export function calculateViewportLayout(input: ViewportLayoutInput): ViewportLayout {
  const width = sanitizeViewportDimension(input.width, MIN_VIEWPORT_WIDTH);
  const height = sanitizeViewportDimension(input.height, MIN_VIEWPORT_HEIGHT);
  const dpr = roundLayoutValue(clamp(input.dpr ?? 1, 1, 2));
  const viewportClass = getViewportClass(width);
  const sideReserve = calculateSideReserve(width, viewportClass);
  const hudTop = calculateTopReserve(height, viewportClass);
  const hudBottom = calculateBottomReserve(height, viewportClass);
  const viewportSafeFrame = fitSafeFrame({
    width,
    height,
    top: hudTop,
    bottom: hudBottom,
    side: sideReserve
  });
  const gameplaySafeFrame = fitGameplayArenaFrame(viewportSafeFrame);
  const canvasScale = gameplaySafeFrame.width / COMBAT_ARENA_WIDTH;

  return {
    width,
    height,
    dpr,
    viewportClass,
    canvasScale,
    combatPadding: COMBAT_ARENA_PADDING,
    hudSafeArea: {
      top: gameplaySafeFrame.y,
      bottom: height - gameplaySafeFrame.y - gameplaySafeFrame.height,
      left: gameplaySafeFrame.x,
      right: width - gameplaySafeFrame.x - gameplaySafeFrame.width
    },
    viewportSafeFrame,
    gameplaySafeFrame
  };
}

export function getViewportClass(width: number): ViewportClass {
  if (width < 560) {
    return 'narrow';
  }

  if (width >= 1180) {
    return 'wide';
  }

  return 'standard';
}

export function viewportPointToCombatPoint(
  layout: Pick<ViewportLayout, 'canvasScale' | 'gameplaySafeFrame'>,
  point: Vector2
): CombatPointerPosition {
  const scale = layout.canvasScale > 0 ? layout.canvasScale : 1;
  const rawX = (point.x - layout.gameplaySafeFrame.x) / scale;
  const rawY = (point.y - layout.gameplaySafeFrame.y) / scale;

  return {
    x: clamp(rawX, 0, COMBAT_ARENA_WIDTH),
    y: clamp(rawY, 0, COMBAT_ARENA_HEIGHT),
    insideFrame: rawX >= 0 && rawX <= COMBAT_ARENA_WIDTH && rawY >= 0 && rawY <= COMBAT_ARENA_HEIGHT
  };
}

export function combatPointToViewportPoint(
  layout: Pick<ViewportLayout, 'canvasScale' | 'gameplaySafeFrame'>,
  point: Vector2
): Vector2 {
  return {
    x: layout.gameplaySafeFrame.x + point.x * layout.canvasScale,
    y: layout.gameplaySafeFrame.y + point.y * layout.canvasScale
  };
}

function sanitizeViewportDimension(value: number, minimum: number): number {
  if (!Number.isFinite(value)) {
    return minimum;
  }

  return Math.max(minimum, Math.floor(value));
}

function calculateSideReserve(width: number, viewportClass: ViewportClass): number {
  const ratio = viewportClass === 'narrow' ? 0.035 : viewportClass === 'wide' ? 0.055 : 0.048;
  const maximum = viewportClass === 'narrow' ? 24 : 52;

  return Math.round(clamp(width * ratio, 12, maximum));
}

function calculateTopReserve(height: number, viewportClass: ViewportClass): number {
  const ratio = viewportClass === 'narrow' ? 0.24 : 0.13;
  const maximum = viewportClass === 'narrow' ? 184 : 122;

  return Math.round(clamp(height * ratio, 58, maximum));
}

function calculateBottomReserve(height: number, viewportClass: ViewportClass): number {
  const ratio = viewportClass === 'narrow' ? 0.075 : 0.058;
  const maximum = viewportClass === 'narrow' ? 58 : 78;

  return Math.round(clamp(height * ratio, 28, maximum));
}

function fitSafeFrame(input: {
  readonly width: number;
  readonly height: number;
  readonly top: number;
  readonly bottom: number;
  readonly side: number;
}): ViewportRect {
  let top = input.top;
  let bottom = input.bottom;
  let side = input.side;
  const targetMinHeight = Math.min(
    input.height * 0.55,
    Math.max(MIN_SAFE_FRAME_HEIGHT, input.height - 88)
  );
  const verticalDeficit = targetMinHeight - (input.height - top - bottom);

  if (verticalDeficit > 0) {
    top = Math.max(42, top - Math.ceil(verticalDeficit * 0.72));
    bottom = Math.max(22, bottom - Math.floor(verticalDeficit * 0.28));
  }

  const targetMinWidth = Math.min(input.width - 24, MIN_SAFE_FRAME_WIDTH);
  const horizontalDeficit = targetMinWidth - (input.width - side * 2);

  if (horizontalDeficit > 0) {
    side = Math.max(10, side - Math.ceil(horizontalDeficit / 2));
  }

  return {
    x: side,
    y: top,
    width: Math.max(1, input.width - side * 2),
    height: Math.max(1, input.height - top - bottom)
  };
}

function fitGameplayArenaFrame(frame: ViewportRect): ViewportRect {
  const scale = Math.min(
    frame.width / COMBAT_ARENA_WIDTH,
    frame.height / COMBAT_ARENA_HEIGHT,
    MAX_GAMEPLAY_PRESENTATION_SCALE
  );
  const width = Math.max(1, Math.round(COMBAT_ARENA_WIDTH * scale));
  const height = Math.max(1, Math.round(COMBAT_ARENA_HEIGHT * scale));

  return {
    x: Math.round(frame.x + (frame.width - width) / 2),
    y: Math.round(frame.y + (frame.height - height) / 2),
    width,
    height
  };
}

function roundLayoutValue(value: number): number {
  return Math.round(value * 100) / 100;
}
