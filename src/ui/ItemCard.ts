import type { ItemFamily } from '../content/items';
import type { ItemCardViewModel } from './ItemCardViewModel';

export interface ItemCardRenderOptions {
  readonly titlePrefix?: string;
  readonly titleTag?: 'span' | 'h2';
  readonly includeEffect?: boolean;
  readonly includeSynergy?: boolean;
  readonly compact?: boolean;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

export function appendItemCardContent(
  parent: HTMLElement,
  model: ItemCardViewModel,
  options: ItemCardRenderOptions = {}
): void {
  parent.dataset.rarity = model.rarity;
  parent.dataset.family = model.family;
  parent.dataset.effectState = model.effectStateKind;

  const usesHeading = options.titleTag === 'h2';
  const header = parent.ownerDocument.createElement(usesHeading ? 'div' : 'span');
  header.className = 'item-card-header';

  const title = parent.ownerDocument.createElement(options.titleTag ?? 'span');
  title.className = 'choice-title item-card-title';
  title.textContent = `${options.titlePrefix ?? ''}${model.name}`;

  const meta = parent.ownerDocument.createElement('span');
  meta.className = 'choice-meta item-card-meta';
  meta.textContent = model.metaLine;

  const copy = parent.ownerDocument.createElement(usesHeading ? 'div' : 'span');
  copy.className = 'item-card-title-copy';
  copy.append(title, meta);

  header.append(createItemIcon(parent.ownerDocument, model), copy);
  parent.append(header);

  if (options.includeEffect !== false) {
    const body = parent.ownerDocument.createElement('span');
    body.className = 'choice-body item-card-effect';
    body.textContent = model.effectText;
    parent.append(body);
  }

  const badges = parent.ownerDocument.createElement('span');
  badges.className = 'item-badge-row';

  for (const badgeText of model.badges) {
    const badge = parent.ownerDocument.createElement('span');
    badge.className = 'item-badge';
    badge.textContent = badgeText;
    badges.append(badge);
  }

  const status = parent.ownerDocument.createElement('span');
  status.className = 'item-badge item-badge-status';
  status.dataset.effectState = model.effectStateKind;
  status.textContent = model.effectStateLabel;
  badges.append(status);

  if (model.acquisitionLabel) {
    const acquisition = parent.ownerDocument.createElement('span');
    acquisition.className = 'item-badge';
    acquisition.textContent = model.acquisitionLabel;
    badges.append(acquisition);
  }

  parent.append(badges);

  if (options.includeSynergy !== false && model.synergyText) {
    const synergy = parent.ownerDocument.createElement('span');
    synergy.className = 'choice-meta item-card-synergy';
    synergy.textContent = model.synergyText;
    parent.append(synergy);
  }

  if (options.compact) {
    parent.dataset.compact = 'true';
  }
}

export function createItemIcon(document: Document, model: ItemCardViewModel): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('item-icon');
  svg.setAttribute('viewBox', '0 0 32 32');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${model.name} ${model.iconLabel}`);
  svg.dataset.iconKind = model.iconKind;

  appendIconShape(svg, model.iconKind);
  return svg;
}

function appendIconShape(svg: SVGSVGElement, family: ItemFamily): void {
  if (family === 'laser-split') {
    appendLine(svg, 6, 16, 26, 16);
    appendLine(svg, 16, 6, 16, 26);
    appendCircle(svg, 16, 16, 4);
  } else if (family === 'missile-overkill') {
    appendPolygon(svg, '16 5 24 25 16 21 8 25');
    appendLine(svg, 16, 9, 16, 21);
  } else if (family === 'drone-copy') {
    appendCircle(svg, 16, 16, 6);
    appendCircle(svg, 7, 9, 2.4);
    appendCircle(svg, 25, 23, 2.4);
  } else if (family === 'shield-revenge') {
    appendPolygon(svg, '16 5 25 9 22 23 16 27 10 23 7 9');
    appendLine(svg, 11, 16, 21, 16);
  } else if (family === 'credit-shop') {
    appendRect(svg, 8, 7, 16, 18);
    appendLine(svg, 12, 13, 20, 13);
    appendLine(svg, 12, 19, 19, 19);
  } else if (family === 'curse-relic') {
    appendPolygon(svg, '16 6 24 14 16 26 8 14');
    appendCircle(svg, 16, 15, 3);
  } else if (family === 'phase-graze') {
    appendArc(svg, 'M9 22 C13 5 24 8 23 18');
    appendArc(svg, 'M23 10 C18 27 7 24 9 14');
    appendCircle(svg, 16, 16, 2.4);
  } else if (family === 'heat-prototype') {
    appendArc(svg, 'M11 24 C8 17 14 14 14 8 C20 13 24 16 20 24');
    appendLine(svg, 13, 23, 19, 23);
  } else if (family === 'lunar-surface') {
    appendCircle(svg, 16, 16, 8);
    appendCircle(svg, 13, 14, 1.6);
    appendCircle(svg, 19, 19, 1.2);
  } else if (family === 'route-economy') {
    appendLine(svg, 7, 23, 25, 9);
    appendCircle(svg, 8, 23, 2.6);
    appendCircle(svg, 16, 16, 2.6);
    appendCircle(svg, 24, 9, 2.6);
  } else {
    appendPolygon(svg, '16 5 26 16 16 27 6 16');
    appendLine(svg, 10, 16, 22, 16);
  }
}

function appendLine(svg: SVGSVGElement, x1: number, y1: number, x2: number, y2: number): void {
  const line = svg.ownerDocument.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', String(x1));
  line.setAttribute('y1', String(y1));
  line.setAttribute('x2', String(x2));
  line.setAttribute('y2', String(y2));
  line.setAttribute('stroke', 'currentColor');
  line.setAttribute('stroke-width', '2');
  line.setAttribute('stroke-linecap', 'round');
  svg.append(line);
}

function appendCircle(svg: SVGSVGElement, cx: number, cy: number, r: number): void {
  const circle = svg.ownerDocument.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', String(cx));
  circle.setAttribute('cy', String(cy));
  circle.setAttribute('r', String(r));
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke', 'currentColor');
  circle.setAttribute('stroke-width', '2');
  svg.append(circle);
}

function appendRect(svg: SVGSVGElement, x: number, y: number, width: number, height: number): void {
  const rect = svg.ownerDocument.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', String(x));
  rect.setAttribute('y', String(y));
  rect.setAttribute('width', String(width));
  rect.setAttribute('height', String(height));
  rect.setAttribute('rx', '2');
  rect.setAttribute('fill', 'none');
  rect.setAttribute('stroke', 'currentColor');
  rect.setAttribute('stroke-width', '2');
  svg.append(rect);
}

function appendPolygon(svg: SVGSVGElement, points: string): void {
  const polygon = svg.ownerDocument.createElementNS(SVG_NS, 'polygon');
  polygon.setAttribute('points', points);
  polygon.setAttribute('fill', 'none');
  polygon.setAttribute('stroke', 'currentColor');
  polygon.setAttribute('stroke-width', '2');
  polygon.setAttribute('stroke-linejoin', 'round');
  svg.append(polygon);
}

function appendArc(svg: SVGSVGElement, d: string): void {
  const path = svg.ownerDocument.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linecap', 'round');
  svg.append(path);
}
