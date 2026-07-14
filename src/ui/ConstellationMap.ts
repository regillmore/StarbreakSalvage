export interface ConstellationMapNode {
  readonly id: string;
  readonly kind: 'sector' | 'service' | 'approach';
  readonly label: string;
  readonly shortLabel: string;
  readonly glyph: string;
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
  routes.setAttribute('viewBox', '0 0 100 100');
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
    if (node.testId) button.dataset.testid = node.testId;
    button.style.setProperty('--nav-x', `${node.x}%`);
    button.style.setProperty('--nav-y', `${node.y}%`);
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
    glyph.textContent = node.glyph;
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

  return { element: map, buttons };
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
