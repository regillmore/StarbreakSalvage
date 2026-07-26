import { createApexGlyph } from './ApexGlyph';

export interface ConstellationMapNode {
  readonly id: string;
  readonly kind: 'sector' | 'service' | 'approach';
  readonly label: string;
  readonly shortLabel: string;
  readonly glyph: string;
  readonly glyphKind?: 'text' | 'apex';
  readonly x: number;
  readonly y: number;
  readonly status: string;
  readonly stateLabel: string;
  readonly selectable: boolean;
  readonly available: boolean;
  readonly visited?: boolean;
  readonly revealOrder: number;
  readonly testId?: string;
  readonly destinationId?: string;
  readonly unavailableReason?: string | null;
  readonly signal?: 'apex-contact' | 'apex-track' | 'apex-break' | 'route-shop';
}

export interface ConstellationMapEdge {
  readonly fromId: string;
  readonly toId: string;
  readonly status: string;
  readonly revealOrder: number;
}

export interface ConstellationMapResult {
  readonly element: HTMLElement;
  readonly buttons: ReadonlyMap<string, HTMLButtonElement>;
}

export type ConstellationMapViewMode = 'focus' | 'overview';

export interface ConstellationMapViewport {
  readonly mode: ConstellationMapViewMode;
  readonly scale: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const CONSTELLATION_FOCUS_SCALE = 1.38;

export function createConstellationMapViewport(
  nodes: readonly Pick<ConstellationMapNode, 'id' | 'x' | 'y'>[],
  focusNodeIds: readonly string[],
  mode: ConstellationMapViewMode
): ConstellationMapViewport {
  const focusIds = new Set(focusNodeIds);
  const focusNodes = nodes.filter((node) => focusIds.has(node.id));
  if (mode === 'overview' || focusNodes.length === 0) {
    return { mode: 'overview', scale: 1, x: 0, y: 0, width: 100, height: 100 };
  }

  const scale = CONSTELLATION_FOCUS_SCALE;
  const width = 100 / scale;
  const height = 100 / scale;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const xValues = focusNodes.map((node) => node.x);
  const yValues = focusNodes.map((node) => node.y);
  const centerX = clamp(
    (Math.min(...xValues) + Math.max(...xValues)) / 2,
    halfWidth,
    100 - halfWidth
  );
  const centerY = clamp(
    (Math.min(...yValues) + Math.max(...yValues)) / 2,
    halfHeight,
    100 - halfHeight
  );
  return {
    mode: 'focus',
    scale,
    x: centerX - halfWidth,
    y: centerY - halfHeight,
    width,
    height
  };
}

export function projectConstellationPoint(
  viewport: ConstellationMapViewport,
  x: number,
  y: number
): { readonly x: number; readonly y: number } {
  return {
    x: ((x - viewport.x) / viewport.width) * 100,
    y: ((y - viewport.y) / viewport.height) * 100
  };
}

export function createConstellationMap(options: {
  readonly document: Document;
  readonly ariaLabel: string;
  readonly label: string;
  readonly code: string;
  readonly layoutId: string;
  readonly nodes: readonly ConstellationMapNode[];
  readonly edges: readonly ConstellationMapEdge[];
  readonly selectedId: string;
  readonly onSelect: (nodeId: string) => void;
  readonly view?: {
    readonly mode: ConstellationMapViewMode;
    readonly focusNodeIds: readonly string[];
    readonly onModeChange: (mode: ConstellationMapViewMode) => void;
  };
}): ConstellationMapResult {
  const map = options.document.createElement('section');
  map.className = 'navigation-map constellation-map';
  map.dataset.testid = 'navigation-map';
  map.dataset.constellationLayout = options.layoutId;
  map.setAttribute('aria-label', options.ariaLabel);

  const grid = options.document.createElement('span');
  grid.className = 'navigation-map-grid';
  grid.setAttribute('aria-hidden', 'true');

  const routes = options.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  routes.classList.add('navigation-map-routes');
  routes.setAttribute('preserveAspectRatio', 'none');
  routes.setAttribute('aria-hidden', 'true');
  const byId = new Map(options.nodes.map((node) => [node.id, node]));
  for (const edge of options.edges) {
    const from = byId.get(edge.fromId);
    const to = byId.get(edge.toId);
    if (!from || !to) continue;
    const line = options.document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(from.x));
    line.setAttribute('y1', String(from.y));
    line.setAttribute('x2', String(to.x));
    line.setAttribute('y2', String(to.y));
    line.setAttribute('pathLength', '1');
    line.dataset.status = edge.status;
    line.style.setProperty('--constellation-order', String(edge.revealOrder));
    line.style.setProperty('--constellation-delay', `${90 + edge.revealOrder * 85}ms`);
    routes.append(line);
  }

  const mapLabel = options.document.createElement('div');
  mapLabel.className = 'navigation-map-label';
  const mapTitle = options.document.createElement('strong');
  mapTitle.textContent = options.label;
  const mapCode = options.document.createElement('span');
  mapCode.textContent = `${options.layoutId.replace('-', ' ')} // ${options.code}`;
  mapLabel.append(mapTitle, mapCode);
  map.append(grid, routes, mapLabel);

  const buttons = new Map<string, HTMLButtonElement>();
  for (const node of options.nodes) {
    const button = options.document.createElement('button');
    button.className = 'navigation-destination-node constellation-node';
    button.type = 'button';
    button.disabled = !node.selectable;
    button.dataset.selectionId = node.id;
    button.dataset.destinationId = node.destinationId ?? node.id;
    button.dataset.nodeKind = node.kind;
    button.dataset.constellationStatus = node.status;
    button.dataset.available = String(node.available);
    button.dataset.visited = String(Boolean(node.visited));
    button.dataset.glyphKind = node.glyphKind ?? 'text';
    if (node.signal) button.dataset.signal = node.signal;
    if (node.testId) button.dataset.testid = node.testId;
    button.style.setProperty('--constellation-order', String(node.revealOrder));
    button.style.setProperty('--constellation-delay', `${120 + node.revealOrder * 80}ms`);
    button.setAttribute('aria-pressed', String(node.id === options.selectedId));
    button.setAttribute(
      'aria-label',
      `${node.label}, ${
        node.available
          ? `available, ${node.stateLabel.toLowerCase()}`
          : `unavailable: ${node.unavailableReason ?? node.stateLabel}`
      }`
    );

    const glyph = options.document.createElement('span');
    glyph.className = 'navigation-node-glyph';
    if (node.glyphKind === 'apex') glyph.append(createApexGlyph(options.document));
    else glyph.textContent = node.glyph;
    glyph.setAttribute('aria-hidden', 'true');
    const label = options.document.createElement('span');
    label.className = 'navigation-node-label';
    label.textContent = node.shortLabel;
    const state = options.document.createElement('span');
    state.className = 'navigation-node-state';
    state.textContent = node.stateLabel;
    button.append(glyph, label, state);
    button.addEventListener('click', () => options.onSelect(node.id));
    button.addEventListener('keydown', (event) =>
      handleConstellationKey(event, node.id, options.nodes, buttons)
    );
    buttons.set(node.id, button);
    map.append(button);
  }

  let viewMode = options.view?.mode ?? 'overview';
  const focusNodeIds = options.view?.focusNodeIds ?? [];
  const focusNodeIdSet = new Set(focusNodeIds);
  const focusAvailable = options.nodes.some(
    (node) => node.kind === 'sector' && focusNodeIdSet.has(node.id)
  );
  let viewToggle: HTMLButtonElement | null = null;

  const applyView = (requestedMode: ConstellationMapViewMode): void => {
    const viewport = createConstellationMapViewport(
      options.nodes.filter((node) => node.kind === 'sector'),
      focusNodeIds,
      requestedMode
    );
    viewMode = viewport.mode;
    map.dataset.constellationView = viewMode;
    map.dataset.constellationFocusCount = String(focusNodeIds.length);
    routes.setAttribute('viewBox', formatViewport(viewport));
    for (const node of options.nodes) {
      const point =
        node.kind === 'sector'
          ? projectConstellationPoint(viewport, node.x, node.y)
          : { x: node.x, y: node.y };
      const button = buttons.get(node.id);
      button?.style.setProperty('--nav-x', `${formatCoordinate(point.x)}%`);
      button?.style.setProperty('--nav-y', `${formatCoordinate(point.y)}%`);
    }
    if (viewToggle) updateViewToggle(viewToggle, viewMode);
  };

  if (options.view && focusAvailable) {
    viewToggle = options.document.createElement('button');
    viewToggle.className = 'navigation-map-view-toggle';
    viewToggle.type = 'button';
    viewToggle.dataset.testid = 'navigation-map-view-toggle';
    viewToggle.addEventListener('click', () => {
      const nextMode = viewMode === 'focus' ? 'overview' : 'focus';
      applyView(nextMode);
      options.view?.onModeChange(nextMode);
    });
    map.append(viewToggle);
  }
  applyView(viewMode);

  return { element: map, buttons };
}

function updateViewToggle(toggle: HTMLButtonElement, mode: ConstellationMapViewMode): void {
  const overview = mode === 'overview';
  toggle.setAttribute('aria-pressed', String(overview));
  toggle.setAttribute(
    'aria-label',
    overview ? 'Focus active constellation choices' : 'Show complete act constellation'
  );
  toggle.textContent = overview ? 'Focus Choices' : 'View Full Act';
}

function formatViewport(viewport: ConstellationMapViewport): string {
  return [viewport.x, viewport.y, viewport.width, viewport.height].map(formatCoordinate).join(' ');
}

function formatCoordinate(value: number): string {
  return String(Number(value.toFixed(3)));
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function updateConstellationSelection(
  buttons: ReadonlyMap<string, HTMLButtonElement>,
  selectedId: string
): void {
  for (const [id, button] of buttons) {
    button.setAttribute('aria-pressed', String(id === selectedId));
  }
}

function handleConstellationKey(
  event: KeyboardEvent,
  originId: string,
  nodes: readonly ConstellationMapNode[],
  buttons: ReadonlyMap<string, HTMLButtonElement>
): void {
  const direction = event.key;
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(direction)) return;
  const origin = nodes.find((node) => node.id === originId);
  if (!origin) return;
  const candidates = nodes
    .filter((candidate) => candidate.id !== originId && candidate.selectable)
    .map((candidate) => ({
      candidate,
      dx: candidate.x - origin.x,
      dy: candidate.y - origin.y
    }))
    .filter(({ dx, dy }) => {
      if (direction === 'ArrowUp') return dy < 0;
      if (direction === 'ArrowDown') return dy > 0;
      if (direction === 'ArrowLeft') return dx < 0;
      return dx > 0;
    })
    .sort(
      (left, right) =>
        getDirectionalDistance(left, direction) - getDirectionalDistance(right, direction)
    );
  const next = candidates[0]?.candidate;
  if (!next) return;
  event.preventDefault();
  buttons.get(next.id)?.focus();
}

function getDirectionalDistance(
  entry: { readonly dx: number; readonly dy: number },
  direction: string
): number {
  const vertical = direction === 'ArrowUp' || direction === 'ArrowDown';
  const primary = vertical ? Math.abs(entry.dy) : Math.abs(entry.dx);
  const cross = vertical ? Math.abs(entry.dx) : Math.abs(entry.dy);
  return primary + cross * 0.45;
}
