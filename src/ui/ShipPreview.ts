import type { ShipSilhouette, ShipWeaponMountHint } from '../content/ships';
import type { WeaponPatternId } from '../content/weapons';
import type { StartingContract } from '../game/Generation';

const SVG_NS = 'http://www.w3.org/2000/svg';
const VIEWBOX_WIDTH = 120;
const VIEWBOX_HEIGHT = 96;
const CENTER_X = VIEWBOX_WIDTH / 2;
const CENTER_Y = 47;
const SHIP_RADIUS = 24;

export type ShipPreviewVariant = 'compact' | 'hero';

export interface ShipPreviewPrimitiveBase {
  readonly kind: 'circle' | 'line' | 'rect';
  readonly paint: 'fill' | 'stroke';
}

export interface ShipPreviewCircle extends ShipPreviewPrimitiveBase {
  readonly kind: 'circle';
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
}

export interface ShipPreviewLine extends ShipPreviewPrimitiveBase {
  readonly kind: 'line';
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly strokeWidth: number;
}

export interface ShipPreviewRect extends ShipPreviewPrimitiveBase {
  readonly kind: 'rect';
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rx?: number;
}

export type ShipPreviewPrimitive = ShipPreviewCircle | ShipPreviewLine | ShipPreviewRect;

export interface ShipPreviewModel {
  readonly variant: ShipPreviewVariant;
  readonly shipName: string;
  readonly frameName: string;
  readonly mountedModuleCount: number;
  readonly weaponName: string;
  readonly weaponPattern: WeaponPatternId;
  readonly patternLabel: string;
  readonly themeKey: string;
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly trimColor: string;
  readonly engineColor: string;
  readonly cockpitAccent: string;
  readonly silhouettePath: string;
  readonly outerSilhouettePath: string;
  readonly mountPrimitives: readonly ShipPreviewPrimitive[];
  readonly weaponCuePrimitives: readonly ShipPreviewPrimitive[];
  readonly roleBars: readonly string[];
  readonly ariaLabel: string;
}

export interface ShipPreviewOverrides {
  readonly frameName?: string;
  readonly mountedModuleCount?: number;
  readonly weaponName?: string;
  readonly weaponPattern?: WeaponPatternId;
  readonly ariaContext?: string;
}

export interface ShipPreviewElementOptions {
  readonly mode?: 'card' | 'combat';
}

export function createShipPreviewModel(
  contract: StartingContract,
  variant: ShipPreviewVariant,
  overrides: ShipPreviewOverrides = {}
): ShipPreviewModel {
  const { shipAppearance: appearance } = contract;
  const weaponPattern = overrides.weaponPattern ?? contract.startingWeaponPattern;
  const weaponName = overrides.weaponName ?? contract.startingWeaponName;
  const frameName = overrides.frameName ?? contract.loadout.frameName;
  const mountedModuleCount = overrides.mountedModuleCount ?? contract.loadout.mounts.length;
  const patternLabel = formatWeaponPattern(weaponPattern);
  const roleBars = [
    appearance.primaryColor,
    appearance.engineColor,
    appearance.cockpitAccent,
    appearance.trimColor
  ];

  return {
    variant,
    shipName: contract.shipName,
    frameName,
    mountedModuleCount,
    weaponName,
    weaponPattern,
    patternLabel,
    themeKey: appearance.hudThemeKey,
    primaryColor: appearance.primaryColor,
    secondaryColor: appearance.secondaryColor,
    trimColor: appearance.trimColor,
    engineColor: appearance.engineColor,
    cockpitAccent: appearance.cockpitAccent,
    silhouettePath: getShipSilhouettePath(appearance.silhouette, SHIP_RADIUS),
    outerSilhouettePath: getShipSilhouettePath(appearance.silhouette, SHIP_RADIUS * 1.12),
    mountPrimitives: createMountPrimitives(appearance.weaponMounts, SHIP_RADIUS),
    weaponCuePrimitives: createWeaponCuePrimitives(weaponPattern, SHIP_RADIUS),
    roleBars,
    ariaLabel: `${overrides.ariaContext ? `${overrides.ariaContext}, ` : ''}${contract.shipName} ship preview, ${frameName} frame with ${mountedModuleCount} mounted modules, ${appearance.silhouette} silhouette, ${appearance.hudThemeKey} theme, ${weaponName} ${patternLabel} weapon`
  };
}

export function getShipSilhouettePath(silhouette: ShipSilhouette, radius: number): string {
  const points = getSilhouettePoints(silhouette).map(([x, y]) => [
    roundSvgValue(CENTER_X + x * radius),
    roundSvgValue(CENTER_Y + y * radius)
  ]);
  const [firstPoint, ...remainingPoints] = points;

  if (!firstPoint) {
    return '';
  }

  return [
    `M ${firstPoint[0]} ${firstPoint[1]}`,
    ...remainingPoints.map(([x, y]) => `L ${x} ${y}`),
    'Z'
  ].join(' ');
}

export function createShipPreviewElement(
  ownerDocument: Document,
  model: ShipPreviewModel,
  options: ShipPreviewElementOptions = {}
): SVGSVGElement {
  const combatMode = options.mode === 'combat';
  const svg = ownerDocument.createElementNS(SVG_NS, 'svg');
  svg.classList.add('ship-preview-svg', `ship-preview-${model.variant}`);
  if (combatMode) svg.classList.add('ship-preview-combat');
  svg.setAttribute('viewBox', `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', model.ariaLabel);
  svg.dataset.theme = model.themeKey;

  const background = createSvgElement(ownerDocument, 'rect');
  setSvgAttributes(background, {
    x: '1',
    y: '1',
    width: String(VIEWBOX_WIDTH - 2),
    height: String(VIEWBOX_HEIGHT - 2),
    rx: '8',
    fill: 'rgba(3, 5, 13, 0.56)',
    stroke: model.secondaryColor,
    'stroke-width': '1.2'
  });

  const wake = createSvgElement(ownerDocument, 'path');
  setSvgAttributes(wake, {
    d: `M ${CENTER_X - 10} ${CENTER_Y + 20} L ${CENTER_X} ${CENTER_Y + 42} L ${
      CENTER_X + 10
    } ${CENTER_Y + 20}`,
    fill: model.engineColor,
    opacity: '0.54'
  });

  const outer = createSvgElement(ownerDocument, 'path');
  setSvgAttributes(outer, {
    d: model.outerSilhouettePath,
    fill: model.secondaryColor,
    opacity: '0.94'
  });

  const body = createSvgElement(ownerDocument, 'path');
  setSvgAttributes(body, {
    d: model.silhouettePath,
    fill: model.primaryColor,
    stroke: model.trimColor,
    'stroke-width': '2.2',
    'stroke-linejoin': 'round'
  });

  const weaponCueGroup = createSvgElement(ownerDocument, 'g');
  weaponCueGroup.setAttribute('class', 'ship-preview-weapon-cue');
  for (const primitive of model.weaponCuePrimitives) {
    weaponCueGroup.append(
      createPrimitiveElement(ownerDocument, primitive, {
        fill: model.engineColor,
        stroke: model.engineColor,
        opacity: '0.82'
      })
    );
  }

  const mountGroup = createSvgElement(ownerDocument, 'g');
  mountGroup.setAttribute('class', 'ship-preview-mounts');
  for (const primitive of model.mountPrimitives) {
    mountGroup.append(
      createPrimitiveElement(ownerDocument, primitive, {
        fill: model.trimColor,
        stroke: model.engineColor,
        opacity: '0.96'
      })
    );
  }

  const cockpit = createSvgElement(ownerDocument, 'circle');
  setSvgAttributes(cockpit, {
    cx: String(CENTER_X),
    cy: String(CENTER_Y + SHIP_RADIUS * 0.2),
    r: '5',
    fill: model.cockpitAccent,
    stroke: '#f8fbff',
    'stroke-width': '1'
  });

  const hitRing = createSvgElement(ownerDocument, 'circle');
  setSvgAttributes(hitRing, {
    cx: String(CENTER_X),
    cy: String(CENTER_Y),
    r: String(SHIP_RADIUS),
    fill: 'none',
    stroke: '#f8fbff',
    'stroke-width': '1',
    opacity: '0.34'
  });

  const roleGroup = createSvgElement(ownerDocument, 'g');
  roleGroup.setAttribute('class', 'ship-preview-role-bars');
  for (const [index, color] of model.roleBars.entries()) {
    const bar = createSvgElement(ownerDocument, 'rect');
    setSvgAttributes(bar, {
      x: String(14 + index * 23),
      y: '84',
      width: '16',
      height: '3',
      rx: '1.5',
      fill: color
    });
    roleGroup.append(bar);
  }

  if (combatMode) {
    svg.append(wake, outer, body, mountGroup, cockpit);
  } else {
    svg.append(
      background,
      weaponCueGroup,
      wake,
      outer,
      body,
      hitRing,
      mountGroup,
      cockpit,
      roleGroup
    );
  }
  return svg;
}

export function formatWeaponPattern(pattern: WeaponPatternId): string {
  switch (pattern) {
    case 'single':
      return 'single';
    case 'dual':
      return 'dual';
    case 'spread':
      return 'spread';
    case 'split':
      return 'split';
    case 'missile':
      return 'missile';
    case 'beam':
      return 'beam';
    default:
      return pattern;
  }
}

function getSilhouettePoints(silhouette: ShipSilhouette): readonly (readonly [number, number])[] {
  switch (silhouette) {
    case 'chapel':
      return [
        [0, -1.08],
        [0.62, -0.18],
        [0.48, 0.76],
        [0, 0.46],
        [-0.48, 0.76],
        [-0.62, -0.18]
      ];
    case 'ordnance':
      return [
        [0, -0.9],
        [0.9, -0.28],
        [0.72, 0.84],
        [0.22, 0.58],
        [0, 0.82],
        [-0.22, 0.58],
        [-0.72, 0.84],
        [-0.9, -0.28]
      ];
    case 'phase':
      return [
        [0, -1.05],
        [0.74, -0.1],
        [0.34, 0.18],
        [0.62, 0.9],
        [0, 0.34],
        [-0.62, 0.9],
        [-0.34, 0.18],
        [-0.74, -0.1]
      ];
    case 'bulwark':
      return [
        [0, -0.88],
        [0.96, -0.04],
        [0.72, 0.68],
        [0.18, 0.92],
        [0, 0.64],
        [-0.18, 0.92],
        [-0.72, 0.68],
        [-0.96, -0.04]
      ];
    case 'monk':
      return [
        [0, -0.92],
        [0.58, -0.28],
        [0.52, 0.5],
        [0, 0.88],
        [-0.52, 0.5],
        [-0.58, -0.28]
      ];
    case 'prototype':
      return [
        [0, -1.08],
        [0.52, -0.48],
        [0.98, 0.14],
        [0.34, 0.34],
        [0.42, 0.88],
        [0, 0.54],
        [-0.58, 0.76],
        [-0.32, 0.08],
        [-0.72, -0.3]
      ];
    case 'relic':
      return [
        [0, -1.02],
        [0.78, -0.12],
        [0.34, 0.76],
        [0, 0.44],
        [-0.34, 0.76],
        [-0.78, -0.12]
      ];
    case 'needle':
    default:
      return [
        [0, -1],
        [0.82, 0.78],
        [0, 0.36],
        [-0.82, 0.78]
      ];
  }
}

function createMountPrimitives(
  mounts: readonly ShipWeaponMountHint[],
  radius: number
): readonly ShipPreviewPrimitive[] {
  return mounts.flatMap((mount) => createMountPrimitive(mount, radius));
}

function createMountPrimitive(
  mount: ShipWeaponMountHint,
  radius: number
): readonly ShipPreviewPrimitive[] {
  const size = Math.max(2.2, radius * 0.13);

  switch (mount) {
    case 'nose':
      return [
        {
          kind: 'rect',
          paint: 'fill',
          x: CENTER_X - size * 0.5,
          y: CENTER_Y - radius * 0.82,
          width: size,
          height: size * 1.6
        }
      ];
    case 'wing':
      return [
        {
          kind: 'circle',
          paint: 'fill',
          cx: CENTER_X - radius * 0.56,
          cy: CENTER_Y + radius * 0.12,
          r: size
        },
        {
          kind: 'circle',
          paint: 'fill',
          cx: CENTER_X + radius * 0.56,
          cy: CENTER_Y + radius * 0.12,
          r: size
        }
      ];
    case 'pod':
      return [
        {
          kind: 'rect',
          paint: 'fill',
          x: CENTER_X - radius * 0.8,
          y: CENTER_Y + radius * 0.18,
          width: size * 1.1,
          height: size * 2.4
        },
        {
          kind: 'rect',
          paint: 'fill',
          x: CENTER_X + radius * 0.8 - size * 1.1,
          y: CENTER_Y + radius * 0.18,
          width: size * 1.1,
          height: size * 2.4
        }
      ];
    case 'drone':
      return [
        {
          kind: 'circle',
          paint: 'fill',
          cx: CENTER_X - radius * 0.84,
          cy: CENTER_Y - radius * 0.28,
          r: size * 0.95
        },
        {
          kind: 'circle',
          paint: 'fill',
          cx: CENTER_X + radius * 0.84,
          cy: CENTER_Y - radius * 0.28,
          r: size * 0.95
        }
      ];
    case 'broadside':
      return [
        {
          kind: 'rect',
          paint: 'stroke',
          x: CENTER_X - radius * 0.78,
          y: CENTER_Y - radius * 0.16,
          width: size * 1.2,
          height: size * 3.2
        },
        {
          kind: 'rect',
          paint: 'stroke',
          x: CENTER_X + radius * 0.78 - size * 1.2,
          y: CENTER_Y - radius * 0.16,
          width: size * 1.2,
          height: size * 3.2
        }
      ];
    case 'beam':
      return [
        {
          kind: 'rect',
          paint: 'fill',
          x: CENTER_X - size * 0.42,
          y: CENTER_Y - radius * 0.92,
          width: size * 0.84,
          height: radius * 0.48
        }
      ];
    case 'orbit':
      return [
        {
          kind: 'circle',
          paint: 'fill',
          cx: CENTER_X - radius * 0.38,
          cy: CENTER_Y + radius * 0.54,
          r: size * 0.82
        },
        {
          kind: 'circle',
          paint: 'fill',
          cx: CENTER_X + radius * 0.38,
          cy: CENTER_Y + radius * 0.54,
          r: size * 0.82
        }
      ];
    default:
      return [];
  }
}

function createWeaponCuePrimitives(
  pattern: WeaponPatternId,
  radius: number
): readonly ShipPreviewPrimitive[] {
  const top = CENTER_Y - radius * 2.04;
  const nose = CENTER_Y - radius * 0.98;

  switch (pattern) {
    case 'dual':
      return [
        createLine(CENTER_X - radius * 0.28, nose, CENTER_X - radius * 0.28, top),
        createLine(CENTER_X + radius * 0.28, nose, CENTER_X + radius * 0.28, top)
      ];
    case 'spread':
      return [
        createLine(CENTER_X, nose, CENTER_X, top),
        createLine(CENTER_X - radius * 0.18, nose, CENTER_X - radius * 0.92, top + 6),
        createLine(CENTER_X + radius * 0.18, nose, CENTER_X + radius * 0.92, top + 6)
      ];
    case 'split':
      return [
        createLine(CENTER_X, nose, CENTER_X, top),
        createLine(CENTER_X - radius * 0.08, nose - 2, CENTER_X - radius * 0.64, top + 2),
        createLine(CENTER_X + radius * 0.08, nose - 2, CENTER_X + radius * 0.64, top + 2)
      ];
    case 'missile':
      return [
        {
          kind: 'circle',
          paint: 'stroke',
          cx: CENTER_X - radius * 0.42,
          cy: top + 10,
          r: 5
        },
        {
          kind: 'circle',
          paint: 'stroke',
          cx: CENTER_X + radius * 0.42,
          cy: top + 10,
          r: 5
        },
        createLine(CENTER_X - radius * 0.42, nose + 2, CENTER_X - radius * 0.42, top + 15),
        createLine(CENTER_X + radius * 0.42, nose + 2, CENTER_X + radius * 0.42, top + 15)
      ];
    case 'beam':
      return [
        {
          kind: 'rect',
          paint: 'fill',
          x: CENTER_X - 3,
          y: top,
          width: 6,
          height: nose - top + 6,
          rx: 3
        }
      ];
    case 'single':
    default:
      return [createLine(CENTER_X, nose, CENTER_X, top)];
  }
}

function createLine(x1: number, y1: number, x2: number, y2: number): ShipPreviewLine {
  return {
    kind: 'line',
    paint: 'stroke',
    x1,
    y1,
    x2,
    y2,
    strokeWidth: 2
  };
}

function createPrimitiveElement(
  ownerDocument: Document,
  primitive: ShipPreviewPrimitive,
  colors: { readonly fill: string; readonly stroke: string; readonly opacity: string }
): SVGElement {
  const element = createSvgElement(ownerDocument, primitive.kind);
  const fill = primitive.paint === 'fill' ? colors.fill : 'none';
  const stroke = primitive.paint === 'stroke' ? colors.stroke : 'none';
  const common = {
    fill,
    stroke,
    opacity: colors.opacity,
    'stroke-width': primitive.kind === 'line' ? String(primitive.strokeWidth) : '1.3',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  };

  if (primitive.kind === 'circle') {
    setSvgAttributes(element, {
      ...common,
      cx: String(roundSvgValue(primitive.cx)),
      cy: String(roundSvgValue(primitive.cy)),
      r: String(roundSvgValue(primitive.r))
    });
    return element;
  }

  if (primitive.kind === 'line') {
    setSvgAttributes(element, {
      ...common,
      x1: String(roundSvgValue(primitive.x1)),
      y1: String(roundSvgValue(primitive.y1)),
      x2: String(roundSvgValue(primitive.x2)),
      y2: String(roundSvgValue(primitive.y2))
    });
    return element;
  }

  setSvgAttributes(element, {
    ...common,
    x: String(roundSvgValue(primitive.x)),
    y: String(roundSvgValue(primitive.y)),
    width: String(roundSvgValue(primitive.width)),
    height: String(roundSvgValue(primitive.height)),
    ...(primitive.rx === undefined ? {} : { rx: String(roundSvgValue(primitive.rx)) })
  });
  return element;
}

function createSvgElement(ownerDocument: Document, tagName: string): SVGElement {
  return ownerDocument.createElementNS(SVG_NS, tagName);
}

function setSvgAttributes(element: SVGElement, attributes: Readonly<Record<string, string>>): void {
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
}

function roundSvgValue(value: number): number {
  return Math.round(value * 100) / 100;
}
