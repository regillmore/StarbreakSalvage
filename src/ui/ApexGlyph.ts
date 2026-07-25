const SVG_NS = 'http://www.w3.org/2000/svg';

export const APEX_GLYPH_ID = 'tri-vector';

export function createApexGlyph(document: Document): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('apex-glyph');
  svg.dataset.glyphId = APEX_GLYPH_ID;
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('aria-hidden', 'true');

  appendPath(svg, 'M12 2.4L15.4 7.8L12 10L8.6 7.8Z', 'apex-glyph-vector');
  appendPath(svg, 'M2.9 17.8L4.2 11.3L7.9 11.4L9.2 15.2Z', 'apex-glyph-vector');
  appendPath(svg, 'M21.1 17.8L19.8 11.3L16.1 11.4L14.8 15.2Z', 'apex-glyph-vector');
  appendCircle(svg, 12, 12.6, 2, 'apex-glyph-core');
  return svg;
}

function appendPath(svg: SVGSVGElement, d: string, className: string): void {
  const path = svg.ownerDocument.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('class', className);
  svg.append(path);
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
