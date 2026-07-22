import type { WeaponDefinition, WeaponIconKind } from '../content/weapons';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function createWeaponIcon(
  document: Document,
  weapon: Pick<WeaponDefinition, 'id' | 'name' | 'iconKind'>
): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('weapon-icon');
  svg.dataset.weaponId = weapon.id;
  svg.dataset.iconKind = weapon.iconKind;
  svg.setAttribute('viewBox', '0 0 48 48');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${weapon.name} weapon icon`);
  svg.setAttribute('focusable', 'false');

  appendPath(svg, 'M8 18V9h9 M31 9h9v9 M40 30v9h-9 M17 39H8v-9', 'weapon-icon-frame');
  appendWeaponGlyph(svg, weapon.iconKind);
  return svg;
}

function appendWeaponGlyph(svg: SVGSVGElement, iconKind: WeaponIconKind): void {
  if (iconKind === 'needle') {
    appendPath(svg, 'M24 6L28 15L25.8 35L24 41L22.2 35L20 15Z', 'weapon-icon-core');
    appendLine(svg, 24, 10, 24, 35, 'weapon-icon-line weapon-icon-hot');
    appendLine(svg, 17, 31, 31, 31, 'weapon-icon-line');
  } else if (iconKind === 'pulse') {
    appendCircle(svg, 17, 20, 6, 'weapon-icon-core');
    appendCircle(svg, 31, 20, 6, 'weapon-icon-core');
    appendCircle(svg, 17, 20, 2.2, 'weapon-icon-energy');
    appendCircle(svg, 31, 20, 2.2, 'weapon-icon-energy');
    appendPath(svg, 'M13 31H35L31 39H17Z', 'weapon-icon-core');
    appendLine(svg, 17, 26, 17, 31, 'weapon-icon-line');
    appendLine(svg, 31, 26, 31, 31, 'weapon-icon-line');
  } else if (iconKind === 'missile') {
    appendPath(svg, 'M24 5L30 15L28 33L24 39L20 33L18 15Z', 'weapon-icon-core');
    appendPath(svg, 'M19 24L13 32L20 30 M29 24L35 32L28 30', 'weapon-icon-line');
    appendCircle(svg, 24, 16, 2.2, 'weapon-icon-energy');
    appendLine(svg, 21, 40, 19, 44, 'weapon-icon-hot');
    appendLine(svg, 24, 40, 24, 45, 'weapon-icon-hot');
    appendLine(svg, 27, 40, 29, 44, 'weapon-icon-hot');
  } else if (iconKind === 'splitter') {
    appendPath(svg, 'M24 41V24L13 13 M24 24L24 8 M24 24L35 13', 'weapon-icon-line');
    appendPath(svg, 'M9 10L17 12L12 17Z M20 5L24 12L28 5Z M39 10L36 17L31 12Z', 'weapon-icon-core');
    appendCircle(svg, 24, 25, 3.2, 'weapon-icon-energy');
  } else if (iconKind === 'spread') {
    appendPath(svg, 'M20 39H28L30 31H18Z', 'weapon-icon-core');
    appendPath(svg, 'M24 30L11 12 M24 30L24 8 M24 30L37 12', 'weapon-icon-line');
    appendCircle(svg, 10, 10, 2.5, 'weapon-icon-energy');
    appendCircle(svg, 24, 6, 2.5, 'weapon-icon-energy');
    appendCircle(svg, 38, 10, 2.5, 'weapon-icon-energy');
  } else if (iconKind === 'kinetic') {
    appendRect(svg, 11, 11, 11, 13, 2, 'weapon-icon-core');
    appendRect(svg, 26, 11, 11, 13, 2, 'weapon-icon-core');
    appendLine(svg, 15, 15, 20, 20, 'weapon-icon-hot');
    appendLine(svg, 30, 15, 35, 20, 'weapon-icon-hot');
    appendPath(svg, 'M16 25L20 38H28L32 25 M20 32H28', 'weapon-icon-line');
  } else if (iconKind === 'beam') {
    appendRect(svg, 20, 6, 8, 25, 1, 'weapon-icon-core');
    appendRect(svg, 23, 6, 2, 25, 1, 'weapon-icon-energy');
    appendPath(svg, 'M15 38L20 29H28L33 38L24 43Z', 'weapon-icon-core');
    appendLine(svg, 14, 15, 18, 15, 'weapon-icon-hot');
    appendLine(svg, 30, 15, 34, 15, 'weapon-icon-hot');
  } else {
    appendCircle(svg, 24, 17, 8, 'weapon-icon-core');
    appendCircle(svg, 24, 17, 3.2, 'weapon-icon-energy');
    appendPath(svg, 'M15 37L19 24 M33 37L29 24 M15 37H33', 'weapon-icon-line');
    appendLine(svg, 12, 20, 16, 20, 'weapon-icon-hot');
    appendLine(svg, 32, 20, 36, 20, 'weapon-icon-hot');
  }
}

function appendPath(svg: SVGSVGElement, d: string, className: string): void {
  const path = svg.ownerDocument.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('class', className);
  svg.append(path);
}

function appendLine(
  svg: SVGSVGElement,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  className: string
): void {
  const line = svg.ownerDocument.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', `${x1}`);
  line.setAttribute('y1', `${y1}`);
  line.setAttribute('x2', `${x2}`);
  line.setAttribute('y2', `${y2}`);
  line.setAttribute('class', className);
  svg.append(line);
}

function appendCircle(
  svg: SVGSVGElement,
  cx: number,
  cy: number,
  radius: number,
  className: string
): void {
  const circle = svg.ownerDocument.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', `${cx}`);
  circle.setAttribute('cy', `${cy}`);
  circle.setAttribute('r', `${radius}`);
  circle.setAttribute('class', className);
  svg.append(circle);
}

function appendRect(
  svg: SVGSVGElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  className: string
): void {
  const rect = svg.ownerDocument.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', `${x}`);
  rect.setAttribute('y', `${y}`);
  rect.setAttribute('width', `${width}`);
  rect.setAttribute('height', `${height}`);
  rect.setAttribute('rx', `${radius}`);
  rect.setAttribute('class', className);
  svg.append(rect);
}
