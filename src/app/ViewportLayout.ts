import { clamp } from '../core/math';

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
  readonly gameplaySafeFrame: ViewportRect;
}

const MIN_VIEWPORT_WIDTH = 320;
const MIN_VIEWPORT_HEIGHT = 240;
const BASE_VIEWPORT_WIDTH = 960;
const BASE_VIEWPORT_HEIGHT = 720;
const MIN_SAFE_FRAME_WIDTH = 260;
const MIN_SAFE_FRAME_HEIGHT = 132;

export function calculateViewportLayout(input: ViewportLayoutInput): ViewportLayout {
  const width = sanitizeViewportDimension(input.width, MIN_VIEWPORT_WIDTH);
  const height = sanitizeViewportDimension(input.height, MIN_VIEWPORT_HEIGHT);
  const dpr = roundLayoutValue(clamp(input.dpr ?? 1, 1, 2));
  const viewportClass = getViewportClass(width);
  const canvasScale = roundLayoutValue(
    clamp(Math.min(width / BASE_VIEWPORT_WIDTH, height / BASE_VIEWPORT_HEIGHT), 0.58, 1.22)
  );
  const sideReserve = calculateSideReserve(width, viewportClass);
  const hudTop = calculateTopReserve(height, viewportClass);
  const hudBottom = calculateBottomReserve(height, viewportClass);
  const safeFrame = fitSafeFrame({
    width,
    height,
    top: hudTop,
    bottom: hudBottom,
    side: sideReserve
  });

  return {
    width,
    height,
    dpr,
    viewportClass,
    canvasScale,
    combatPadding: Math.round(clamp(20 * canvasScale, 14, 28)),
    hudSafeArea: {
      top: safeFrame.y,
      bottom: height - safeFrame.y - safeFrame.height,
      left: safeFrame.x,
      right: width - safeFrame.x - safeFrame.width
    },
    gameplaySafeFrame: safeFrame
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

function roundLayoutValue(value: number): number {
  return Math.round(value * 100) / 100;
}
