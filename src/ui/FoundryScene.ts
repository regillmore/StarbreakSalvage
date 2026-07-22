import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import {
  getComponentAffix,
  getComponentQuality,
  getWeaponEvolutionRecipe
} from '../content/engineering';
import { getShipFrameById, getShipModuleById } from '../content/shipModules';
import { getItemById } from '../content/items';
import type { RunSkeleton, StartingContract } from '../game/Generation';
import type { ItemInstance } from '../game/Rewards';
import {
  canFitItemInCircuit,
  createItemSocketCircuitSummary,
  fitItemInCircuit,
  getActiveFittedItems,
  getItemCircuitDomains,
  moveItemInCircuit,
  reconcileItemSockets,
  unfitItem
} from '../game/ItemSockets';
import {
  commitFoundryDraft,
  createEngineeringDebugState,
  formatComponentName,
  getCargoComponents,
  getInstalledComponent,
  planInstallComponent,
  planRemoveComponent,
  planScrapComponent,
  resolveEngineeringSnapshot,
  undoFoundryDraft,
  type EngineeringState,
  type FoundryComponentInstance
} from '../game/Foundry';
import type { InputAction } from '../systems/InputSystem';
import {
  applyContractScreenTheme,
  createContractScreenThemeModel,
  createContractThemeDebugState,
  createContractThemeStrip,
  getContractThemeOptions
} from './ContractTheme';
import {
  compareFoundryComponents,
  createFoundryComponentStatModel,
  createFoundryDashboardModel,
  type FoundryAttackStatModel,
  type FoundryDashboardModel,
  type FoundryMeterModel
} from './FoundryPresentation';
import { createAttackSimulationPreviewElement } from './AttackSimulationPreview';
import { createShipPreviewModel } from './ShipPreview';

type FoundryView = 'hardpoints' | 'cargo';

export class FoundryScene implements Scene {
  public readonly id = 'foundry';
  private state: EngineeringState;
  private itemInstances: ItemInstance[];
  private readonly committedItemInstances: ItemInstance[];
  private status = 'Component secured. Draft is reversible.';
  private view: FoundryView = 'hardpoints';

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly run: RunSkeleton,
    private readonly contract: StartingContract,
    engineering: EngineeringState,
    itemInstances: readonly ItemInstance[],
    private readonly sectorIndex: number,
    private readonly onComplete: (
      state: EngineeringState,
      itemInstances: readonly ItemInstance[],
      salvageGained: number
    ) => void,
    private readonly crewAssist: string | null = null,
    private readonly exitLabel = 'Skip Foundry',
    initialStatus = 'Component secured. Draft is reversible.'
  ) {
    this.status = initialStatus;
    this.state = engineering;
    this.itemInstances = reconcileItemSockets(itemInstances, engineering.draft);
    this.committedItemInstances = reconcileItemSockets(itemInstances, engineering.committed);
  }

  public enter(): void {
    const frame = getShipFrameById(this.state.draft.frameId);
    const resolution = resolveEngineeringSnapshot(this.state.draft);
    const cargo = getCargoComponents(this.state.draft);
    this.itemInstances = reconcileItemSockets(this.itemInstances, this.state.draft);
    const dashboard = createFoundryDashboardModel(
      this.state,
      getActiveFittedItems(this.itemInstances, this.state.draft)
    );
    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide foundry-panel';
    shell.dataset.testid = 'salvage-foundry';
    shell.dataset.foundryView = this.view;
    shell.setAttribute('aria-labelledby', 'foundry-title');
    const theme = createContractScreenThemeModel(
      this.contract,
      getContractThemeOptions(this.uiRoot.ownerDocument)
    );
    applyContractScreenTheme(shell, theme);

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `Sector ${this.sectorIndex} / ${frame.name} / ${
      this.view === 'cargo' ? 'Cargo Bay' : 'Salvage Foundry'
    }`;

    const title = document.createElement('h1');
    title.id = 'foundry-title';
    title.textContent = this.view === 'cargo' ? 'Cargo Management' : 'Hardpoint Control';

    const menu = this.createEngineeringMenu(cargo.length);

    const boundary = document.createElement('p');
    boundary.className = 'foundry-boundary';
    boundary.dataset.testid = 'foundry-boundary';
    boundary.textContent = `${
      this.view === 'cargo'
        ? 'SHARED DRAFT // Loose hardware only. Assignments remain in Hardpoint Control.'
        : 'DRAFT BAY // Assign at each hardpoint. Commit launches. Undo restores.'
    }${this.crewAssist ? ` Crew: ${this.crewAssist}` : ''}`;

    const grid = document.createElement('div');
    grid.className = `foundry-grid-readout ${resolution.valid ? '' : 'foundry-grid-invalid'}`;
    grid.dataset.testid = 'foundry-grid-readout';
    grid.setAttribute('aria-live', 'polite');
    const gridState = document.createElement('strong');
    gridState.textContent = resolution.valid ? 'LEGAL DRAFT' : 'INVALID DRAFT';
    const gridCount = document.createElement('span');
    gridCount.textContent = `${this.state.pendingActions.length} pending / ${dashboard.mountedModuleCount} mounted`;
    grid.append(gridState, gridCount);

    const issueList = document.createElement('div');
    issueList.className = 'foundry-issues';
    issueList.dataset.testid = 'foundry-issues';
    if (resolution.issues.length === 0) {
      issueList.hidden = true;
      issueList.textContent = 'All hardpoints and resource envelopes pass.';
    } else {
      issueList.classList.add('foundry-issues-invalid');
      const issueTitle = document.createElement('strong');
      issueTitle.textContent = `${resolution.issues.length} BLOCKER${resolution.issues.length === 1 ? '' : 'S'}`;
      const issues = document.createElement('ul');
      for (const issue of resolution.issues) {
        const item = document.createElement('li');
        item.textContent = issue.message;
        issues.append(item);
      }
      issueList.append(issueTitle, issues);
    }

    const content =
      this.view === 'cargo'
        ? [issueList, this.createCargoSection()]
        : [
            this.createCommandConsole(dashboard),
            issueList,
            this.createUpgradeCircuitSection(dashboard),
            this.createInstalledSection(frame)
          ];
    const pending = document.createElement('section');
    pending.className = 'foundry-history';
    pending.setAttribute('aria-label', 'Pending engineering operations');
    const pendingTitle = document.createElement('h2');
    pendingTitle.textContent = `Draft Log / ${this.state.pendingActions.length}`;
    const pendingCopy = document.createElement('div');
    pendingCopy.className = 'foundry-pending-list';
    pendingCopy.dataset.testid = 'foundry-pending-history';
    if (this.state.pendingActions.length > 0) {
      for (const action of this.state.pendingActions) {
        const chip = document.createElement('span');
        chip.className = 'foundry-pending-chip';
        chip.textContent = `${action.kind.toUpperCase()} · ${action.summary}`;
        pendingCopy.append(chip);
      }
    } else {
      pendingCopy.textContent = 'Draft clean.';
    }
    pending.append(pendingTitle, pendingCopy);

    const status = document.createElement('p');
    status.className = 'foundry-status';
    status.dataset.testid = 'foundry-status';
    status.setAttribute('aria-live', 'polite');
    status.textContent = this.status;

    const controls = document.createElement('div');
    controls.className = 'button-row foundry-controls';
    const commit = document.createElement('button');
    commit.className = 'primary-button';
    commit.type = 'button';
    commit.dataset.testid = 'foundry-commit';
    commit.textContent = 'Commit Loadout';
    commit.disabled = !resolution.valid;
    commit.addEventListener('click', () => this.commit());

    const undo = document.createElement('button');
    undo.className = 'secondary-button';
    undo.type = 'button';
    undo.dataset.testid = 'foundry-undo';
    undo.textContent = 'Undo';
    undo.disabled =
      this.state.pendingActions.length === 0 &&
      this.getItemSocketSignature(this.itemInstances) ===
        this.getItemSocketSignature(this.committedItemInstances);
    undo.addEventListener('click', () => {
      this.state = undoFoundryDraft(this.state);
      this.itemInstances = [...this.committedItemInstances];
      this.status = 'Draft reset to the last committed ship.';
      this.enter();
    });

    const skip = document.createElement('button');
    skip.className = 'secondary-button';
    skip.type = 'button';
    skip.dataset.testid = 'foundry-skip';
    skip.textContent = this.exitLabel;
    skip.addEventListener('click', () =>
      this.onComplete(undoFoundryDraft(this.state), this.committedItemInstances, 0)
    );
    controls.append(commit, undo, skip);

    shell.append(
      eyebrow,
      createContractThemeStrip(this.uiRoot.ownerDocument, theme),
      title,
      menu,
      boundary,
      grid,
      ...content,
      pending,
      status,
      controls
    );
    this.uiRoot.replaceChildren(shell);
    const focusTarget =
      this.view === 'cargo'
        ? shell.querySelector<HTMLButtonElement>('[data-testid="foundry-open-hardpoints"]')
        : shell.querySelector<HTMLButtonElement>('[data-testid="foundry-open-cargo"]');
    (focusTarget ?? shell.querySelector<HTMLButtonElement>('button:not(:disabled)'))?.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'confirm') {
      this.commit();
    }
    if (action === 'back' || action === 'pause') {
      if (this.view === 'cargo') {
        this.view = 'hardpoints';
        this.status = 'Cargo draft retained. Hardpoint assignments restored to view.';
        this.enter();
        return;
      }
      this.onComplete(undoFoundryDraft(this.state), this.committedItemInstances, 0);
    }
  }

  public getDebugState(): SceneDebugState {
    return {
      seed: this.run.seed,
      entityCount: 0,
      contractTheme: createContractThemeDebugState(this.contract),
      shipLoadout: this.contract.loadout.debug,
      engineering: createEngineeringDebugState(this.state)
    };
  }

  private createCommandConsole(dashboard: FoundryDashboardModel): HTMLElement {
    const console = document.createElement('section');
    console.className = 'foundry-command-console';
    console.dataset.testid = 'foundry-command-console';
    console.setAttribute('aria-label', dashboard.ariaLabel);

    const attack = document.createElement('div');
    attack.className = 'foundry-attack-console';
    const attackHeader = document.createElement('header');
    const attackTitle = document.createElement('h2');
    attackTitle.textContent = 'Attack Simulation';
    const pattern = document.createElement('span');
    pattern.className = 'foundry-pattern-badge';
    pattern.textContent = dashboard.weaponPattern.toUpperCase();
    attackHeader.append(attackTitle, pattern);

    const previewModel = createShipPreviewModel(this.contract, 'hero', {
      frameName: dashboard.frameName,
      mountedModuleCount: dashboard.mountedModuleCount,
      weaponName: dashboard.weaponName,
      weaponPattern: dashboard.weaponPattern,
      ariaContext: 'Draft attack simulation'
    });
    const previewFrame = createAttackSimulationPreviewElement(document, {
      previewModel,
      shipRadius: this.contract.shipStats.hitRadius,
      simulation: dashboard.attackSimulation,
      testId: 'foundry-attack-preview',
      projectileLayerTestId: 'foundry-attack-projectile-layer',
      projectileTestId: 'foundry-attack-projectile',
      className: 'foundry-attack-preview'
    });

    const miniHud = document.createElement('div');
    miniHud.className = 'foundry-mini-hud';
    miniHud.dataset.testid = 'foundry-mini-hud';
    const weapon = document.createElement('strong');
    weapon.textContent = dashboard.weaponName;
    const change = document.createElement('span');
    change.className = 'foundry-draft-change';
    change.dataset.changed = String(dashboard.changed);
    change.textContent = dashboard.changed ? 'DRAFT Δ' : 'BASELINE';
    miniHud.append(weapon, change);

    const attackStats = document.createElement('div');
    attackStats.className = 'foundry-attack-stats';
    for (const stat of dashboard.attackStats) {
      attackStats.append(this.createAttackStat(stat));
    }

    const traits = document.createElement('div');
    traits.className = 'foundry-trait-row';
    for (const trait of dashboard.traits) {
      const chip = document.createElement('span');
      chip.className = 'foundry-trait-chip';
      chip.innerHTML = `<b>${trait.glyph}</b><span>${trait.label}</span><strong>${trait.value}</strong>`;
      traits.append(chip);
    }
    attack.append(attackHeader, previewFrame, miniHud, attackStats, traits);

    const resources = document.createElement('div');
    resources.className = 'foundry-resource-console';
    const resourceHeader = document.createElement('header');
    const resourceTitle = document.createElement('h2');
    resourceTitle.textContent = 'Grid Envelope';
    const validity = document.createElement('span');
    validity.className = 'foundry-validity-light';
    validity.dataset.valid = String(dashboard.valid);
    validity.textContent = dashboard.valid ? 'NOMINAL' : `${dashboard.issueCount} BLOCKED`;
    resourceHeader.append(resourceTitle, validity);
    const meterList = document.createElement('div');
    meterList.className = 'foundry-meter-list';
    for (const meter of dashboard.meters) meterList.append(this.createResourceMeter(meter));
    resources.append(resourceHeader, meterList);

    console.append(attack, resources);
    return console;
  }

  private createResourceMeter(meter: FoundryMeterModel): HTMLElement {
    const row = document.createElement('div');
    row.className = 'foundry-meter';
    row.dataset.tone = meter.tone;
    row.dataset.testid = `foundry-meter-${meter.id}`;
    row.setAttribute('aria-label', meter.ariaLabel);
    const heading = document.createElement('div');
    heading.className = 'foundry-meter-heading';
    const label = document.createElement('span');
    label.innerHTML = `<b>${meter.glyph}</b>${meter.label}`;
    const value = document.createElement('span');
    value.className = 'foundry-meter-value';
    value.textContent = `${meter.value}/${meter.capacity}`;
    const delta = document.createElement('span');
    delta.className = 'foundry-comparison-delta';
    delta.textContent = formatFoundryDelta(meter.delta);
    heading.append(label, delta, value);
    const track = document.createElement('span');
    track.className = 'foundry-meter-track';
    track.setAttribute('role', 'meter');
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', String(meter.capacity));
    track.setAttribute('aria-valuenow', String(meter.value));
    const fill = document.createElement('span');
    fill.style.width = `${Math.round(meter.ratio * 100)}%`;
    track.append(fill);
    row.append(heading, track);
    return row;
  }

  private createAttackStat(stat: FoundryAttackStatModel): HTMLElement {
    const item = document.createElement('div');
    item.className = 'foundry-attack-stat';
    item.dataset.tone = stat.tone;
    item.dataset.testid = `foundry-attack-${stat.id}`;
    item.setAttribute('aria-label', stat.ariaLabel);
    const heading = document.createElement('span');
    heading.className = 'foundry-attack-stat-label';
    heading.innerHTML = `<b>${stat.glyph}</b>${stat.label}`;
    const value = document.createElement('strong');
    value.textContent = stat.displayValue;
    const delta = document.createElement('small');
    delta.textContent = formatFoundryDelta(stat.delta);
    const bar = document.createElement('span');
    bar.className = 'foundry-attack-stat-bar';
    const fill = document.createElement('span');
    fill.style.width = `${Math.round(stat.ratio * 100)}%`;
    bar.append(fill);
    item.append(heading, value, delta, bar);
    return item;
  }

  private createComponentStatStrip(component: FoundryComponentInstance): HTMLElement {
    const stats = createFoundryComponentStatModel(component);
    const strip = document.createElement('div');
    strip.className = `foundry-component-stats${stats.slot === 'primary' ? ' foundry-component-stats-primary' : ''}`;
    const circuitAria = stats.slot === 'primary' ? `, primary weapon circuit ${stats.circuit}` : '';
    strip.setAttribute(
      'aria-label',
      `Power ${stats.power}, heat ${stats.heat}, mass ${stats.mass}, command ${stats.command}, instability ${stats.instability}${circuitAria}`
    );
    const values: (readonly [string, string, number])[] = [
      ['power', 'P', stats.power],
      ['heat', 'H', stats.heat],
      ['mass', 'M', stats.mass],
      ['command', 'C', stats.command],
      ['instability', '!', stats.instability]
    ];
    if (stats.slot === 'primary') values.push(['circuit', 'S', stats.circuit]);
    for (const [id, glyph, value] of values) {
      const stat = document.createElement('span');
      stat.dataset.stat = id;
      if (id === 'circuit') stat.title = 'Primary weapon circuit slots';
      stat.innerHTML = `<b>${glyph}</b>${value}`;
      strip.append(stat);
    }
    return strip;
  }

  private createBadge(text: string, className = ''): HTMLSpanElement {
    const badge = document.createElement('span');
    badge.className = `foundry-badge ${className}`.trim();
    badge.textContent = text;
    return badge;
  }

  private createEngineeringMenu(cargoCount: number): HTMLElement {
    const menu = document.createElement('nav');
    menu.className = 'foundry-menu';
    menu.setAttribute('aria-label', 'Engineering menus');

    const hardpoints = document.createElement('button');
    hardpoints.className = 'secondary-button foundry-menu-button';
    hardpoints.type = 'button';
    hardpoints.dataset.testid = 'foundry-open-hardpoints';
    hardpoints.textContent = 'Hardpoint Control';
    hardpoints.disabled = this.view === 'hardpoints';
    if (this.view === 'hardpoints') hardpoints.setAttribute('aria-current', 'page');
    hardpoints.addEventListener('click', () => {
      this.view = 'hardpoints';
      this.enter();
    });

    const cargo = document.createElement('button');
    cargo.className = 'secondary-button foundry-menu-button';
    cargo.type = 'button';
    cargo.dataset.testid = 'foundry-open-cargo';
    cargo.textContent = `Cargo Management / ${cargoCount}`;
    cargo.disabled = this.view === 'cargo';
    if (this.view === 'cargo') cargo.setAttribute('aria-current', 'page');
    cargo.addEventListener('click', () => {
      this.view = 'cargo';
      this.enter();
    });

    menu.append(hardpoints, cargo);
    return menu;
  }

  private createInstalledSection(frame: ReturnType<typeof getShipFrameById>): HTMLElement {
    const section = document.createElement('section');
    section.className = 'foundry-section foundry-hardpoint-section';
    section.dataset.testid = 'foundry-hardpoint-assignments';
    const sectionHeader = document.createElement('header');
    sectionHeader.className = 'foundry-section-header';
    const title = document.createElement('h2');
    title.textContent = 'Hardpoint Assignments';
    const copy = document.createElement('p');
    copy.textContent =
      'Choose mounted, loose, or transferable hardware at the mount itself. Empty assignments remain reversible until commit.';
    sectionHeader.append(title, copy);
    const list = document.createElement('div');
    list.className = 'foundry-card-grid foundry-hardpoint-grid';

    for (const hardpoint of frame.hardpoints) {
      const component = getInstalledComponent(this.state.draft, hardpoint.id);
      const card = document.createElement('article');
      card.className = 'foundry-card foundry-installed-card';
      card.dataset.testid = `foundry-hardpoint-${hardpoint.id}`;
      card.dataset.state = component ? 'assigned' : 'empty';
      const header = document.createElement('header');
      header.className = 'foundry-card-header';
      const heading = document.createElement('h3');
      heading.textContent = hardpoint.label;
      const badges = document.createElement('div');
      badges.className = 'foundry-badge-row';
      badges.append(
        this.createBadge(hardpoint.slot.toUpperCase()),
        this.createBadge(hardpoint.size.toUpperCase())
      );
      if (hardpoint.required) badges.append(this.createBadge('CORE', 'foundry-badge-required'));
      header.append(heading, badges);
      card.append(header, this.createHardpointAssignmentSelect(frame, hardpoint, component));

      if (component) {
        card.append(this.createComponentStatStrip(component));
      } else {
        const empty = document.createElement('strong');
        empty.className = 'foundry-hardpoint-empty';
        empty.textContent = hardpoint.required ? 'EMPTY / REQUIRED' : 'EMPTY / OPTIONAL';
        card.append(empty);
      }
      list.append(card);
    }
    section.append(sectionHeader, list);
    return section;
  }

  private createHardpointAssignmentSelect(
    frame: ReturnType<typeof getShipFrameById>,
    hardpoint: ReturnType<typeof getShipFrameById>['hardpoints'][number],
    installed: FoundryComponentInstance | null
  ): HTMLElement {
    const field = document.createElement('label');
    field.className = 'foundry-hardpoint-assignment';
    const fieldLabel = document.createElement('span');
    fieldLabel.textContent = 'Assignment';
    const select = document.createElement('select');
    select.dataset.testid = `foundry-hardpoint-assignment-${hardpoint.id}`;
    select.setAttribute('aria-label', `Assign hardware to ${hardpoint.label}`);

    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = 'EMPTY - Move assignment to cargo';
    empty.selected = installed === null;
    select.append(empty);

    const mountByComponent = new Map(
      this.state.draft.mounts.map((mount) => [mount.componentId, mount.hardpointId])
    );
    const hardpointNameById = new Map(
      frame.hardpoints.map((candidate) => [candidate.id, candidate.label])
    );
    const candidates = this.state.draft.components
      .filter((component) => component.compatibility.compatibleHardpointIds.includes(hardpoint.id))
      .sort((left, right) => {
        const rank = (component: FoundryComponentInstance): number => {
          if (component.id === installed?.id) return 0;
          return mountByComponent.has(component.id) ? 2 : 1;
        };
        return rank(left) - rank(right) || left.acquisitionOrder - right.acquisitionOrder;
      });

    for (const component of candidates) {
      const option = document.createElement('option');
      const mountedHardpointId = mountByComponent.get(component.id);
      const source =
        component.id === installed?.id
          ? 'MOUNTED'
          : mountedHardpointId
            ? `MOVE FROM ${hardpointNameById.get(mountedHardpointId) ?? mountedHardpointId}`
            : 'CARGO';
      option.value = component.id;
      option.selected = component.id === installed?.id;
      option.textContent =
        component.id === installed?.id
          ? `${source} - ${formatComponentName(component)}`
          : `${source} - ${formatComponentName(component)} - ${compareFoundryComponents(component, installed).label}`;
      select.append(option);
    }

    select.addEventListener('change', () => {
      const previous = getInstalledComponent(this.state.draft, hardpoint.id);
      if (select.value === '') {
        this.state = planRemoveComponent(this.state, hardpoint.id, this.sectorIndex);
        this.status = previous
          ? `${formatComponentName(previous)} moved from ${hardpoint.label} to cargo.`
          : `${hardpoint.label} remains empty.`;
        this.enter();
        return;
      }

      const component = this.state.draft.components.find(
        (candidate) => candidate.id === select.value
      );
      if (!component) return;
      const sourceMount = this.state.draft.mounts.find(
        (mount) => mount.componentId === component.id
      );
      this.state = planInstallComponent(this.state, component.id, hardpoint.id, this.sectorIndex);
      const displacement =
        previous && previous.id !== component.id
          ? ` ${formatComponentName(previous)} returned to cargo.`
          : sourceMount && sourceMount.hardpointId !== hardpoint.id
            ? ` Its former mount is now empty.`
            : '';
      this.status = `${formatComponentName(component)} assigned to ${hardpoint.label}.${displacement}`;
      this.enter();
    });

    field.append(fieldLabel, select);
    return field;
  }

  private createUpgradeCircuitSection(dashboard: FoundryDashboardModel): HTMLElement {
    const section = document.createElement('section');
    section.className = 'foundry-section foundry-upgrade-circuit';
    section.dataset.testid = 'foundry-upgrade-circuit';
    const summary = createItemSocketCircuitSummary(this.itemInstances, this.state.draft);
    const active = getActiveFittedItems(this.itemInstances, this.state.draft);
    const idle = this.itemInstances
      .filter((instance) => !instance.socket)
      .sort((left, right) => left.acquisitionOrder - right.acquisitionOrder);

    const header = document.createElement('header');
    header.className = 'foundry-circuit-header';
    const title = document.createElement('h2');
    title.textContent = 'Primary Weapon Circuit';
    const budget = document.createElement('strong');
    budget.className = 'foundry-circuit-budget';
    budget.textContent = `${summary.fitted}/${summary.capacity} LIVE / ${summary.open} OPEN`;
    header.append(title, budget);
    const copy = document.createElement('p');
    copy.className = 'foundry-circuit-copy';
    copy.textContent =
      summary.chain.length > 0
        ? `PRIMARY BUS -> ${summary.chain.join(' -> ')} -> MUZZLE. Every upgrade fits every primary-weapon conduit; each stage receives the signal built before it.`
        : 'No live chain. The mounted primary weapon supplies every conduit; append from the rack.';

    const extensions = document.createElement('div');
    extensions.className = 'foundry-circuit-extensions';
    extensions.setAttribute('aria-label', 'Mounted primary weapon circuit capacity');
    for (const extension of summary.extensions) {
      const chip = document.createElement('span');
      chip.className = 'foundry-circuit-extension';
      chip.dataset.testid = 'foundry-circuit-extension';
      chip.innerHTML = `<b>${extension.capacity}</b><span>${extension.moduleName}</span><small>PRIMARY WEAPON SLOTS</small>`;
      extensions.append(chip);
    }

    const rail = document.createElement('div');
    rail.className = 'foundry-circuit-rail';
    rail.dataset.testid = 'foundry-circuit-rail';
    rail.setAttribute('role', 'list');
    rail.setAttribute('aria-label', 'Ordered active upgrade circuit');
    for (const [index, instance] of active.entries()) {
      rail.append(this.createCircuitNode(instance, index, active.length, dashboard));
    }
    for (let index = active.length; index < summary.capacity; index += 1) {
      const empty = document.createElement('article');
      empty.className = 'foundry-circuit-node foundry-circuit-node-empty';
      empty.dataset.testid = 'foundry-circuit-open-node';
      empty.setAttribute('role', 'listitem');
      empty.innerHTML = `<span class="foundry-circuit-position">${String(index + 1).padStart(
        2,
        '0'
      )}</span><strong>OPEN CONDUIT</strong><small>Append from rack</small>`;
      rail.append(empty);
    }

    const rackHeader = document.createElement('h3');
    rackHeader.className = 'foundry-rack-heading';
    rackHeader.textContent = `Upgrade Rack / ${idle.length}`;
    const rack = document.createElement('div');
    rack.className = 'foundry-card-grid foundry-upgrade-rack';

    if (idle.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'foundry-empty';
      empty.textContent = 'Every owned upgrade is live.';
      rack.append(empty);
    }

    for (const instance of idle) {
      const item = getItemById(instance.itemId);
      const card = document.createElement('article');
      card.className = 'foundry-card foundry-upgrade-card foundry-upgrade-idle';
      card.dataset.testid = `foundry-upgrade-${instance.acquisitionOrder}`;
      const heading = document.createElement('h3');
      heading.textContent = item.name;
      const effect = document.createElement('p');
      effect.textContent = item.effect;
      const badges = document.createElement('div');
      badges.className = 'foundry-badge-row';
      badges.append(
        this.createBadge('RACK'),
        ...getItemCircuitDomains(item).map((type) =>
          this.createBadge(type.toUpperCase(), `foundry-badge-${type}`)
        )
      );
      const actions = document.createElement('div');
      actions.className = 'foundry-card-actions';
      const canFit = canFitItemInCircuit(
        this.itemInstances,
        this.state.draft,
        instance.acquisitionOrder
      );
      const append = this.createActionButton('Append to chain', () => {
        this.itemInstances = fitItemInCircuit(
          this.itemInstances,
          this.state.draft,
          instance.acquisitionOrder
        );
        this.status = `${item.name} appended to the signal chain.`;
      });
      append.disabled = !canFit;
      append.setAttribute('aria-label', `Append ${item.name} to the circuit`);
      let fitNote: HTMLElement | null = null;
      if (!canFit) {
        const reason = 'Circuit full. Eject a live stage first.';
        append.title = reason;
        fitNote = document.createElement('small');
        fitNote.className = 'foundry-circuit-fit-note';
        fitNote.textContent = reason;
      }
      actions.append(append);
      card.append(heading, badges, effect);
      if (fitNote) card.append(fitNote);
      card.append(actions);
      rack.append(card);
    }
    section.append(header, copy, extensions, rail, rackHeader, rack);
    return section;
  }

  private createCircuitNode(
    instance: ItemInstance,
    index: number,
    activeCount: number,
    dashboard: FoundryDashboardModel
  ): HTMLElement {
    const item = getItemById(instance.itemId);
    const stage = dashboard.circuitStages.find(
      (candidate) => candidate.acquisitionOrder === instance.acquisitionOrder
    );
    const node = document.createElement('article');
    node.className = 'foundry-circuit-node';
    node.dataset.testid = `foundry-circuit-node-${instance.acquisitionOrder}`;
    node.setAttribute('role', 'listitem');
    const header = document.createElement('header');
    const position = document.createElement('span');
    position.className = 'foundry-circuit-position';
    position.textContent = String(index + 1).padStart(2, '0');
    const domain = document.createElement('span');
    domain.className = 'foundry-circuit-domain';
    domain.textContent = stage?.domain ?? 'REACTIVE';
    header.append(position, domain);
    const heading = document.createElement('h3');
    heading.textContent = item.name;
    const effect = document.createElement('p');
    effect.textContent = item.effect;
    const output = document.createElement('div');
    output.className = 'foundry-circuit-output';
    output.dataset.changed = String(stage?.changed ?? false);
    output.dataset.condition =
      stage?.conditionMet === null || stage?.conditionMet === undefined
        ? 'none'
        : stage.conditionMet
          ? 'met'
          : 'unmet';
    output.innerHTML = `<small>OUTPUT</small><strong>${stage?.outputLabel ?? 'signal armed'}</strong>`;
    if (stage?.cadenceShiftLabel) {
      const cadenceShift = document.createElement('span');
      cadenceShift.className = 'foundry-circuit-cadence-shift';
      cadenceShift.dataset.testid = 'foundry-circuit-cadence-shift';
      cadenceShift.textContent = stage.cadenceShiftLabel;
      output.append(cadenceShift);
    }
    if (stage && stage.addedTags.length > 0) {
      const tags = document.createElement('span');
      tags.textContent = `+ ${stage.addedTags.join(' + ')}`;
      output.append(tags);
    }
    const actions = document.createElement('div');
    actions.className = 'foundry-card-actions foundry-circuit-actions';
    const earlier = this.createActionButton('Earlier', () => {
      this.itemInstances = moveItemInCircuit(
        this.itemInstances,
        this.state.draft,
        instance.acquisitionOrder,
        -1
      );
      this.status = `${item.name} moved earlier in the signal chain.`;
    });
    earlier.disabled = index === 0;
    earlier.setAttribute('aria-label', `Move ${item.name} earlier in the circuit`);
    const later = this.createActionButton('Later', () => {
      this.itemInstances = moveItemInCircuit(
        this.itemInstances,
        this.state.draft,
        instance.acquisitionOrder,
        1
      );
      this.status = `${item.name} moved later in the signal chain.`;
    });
    later.disabled = index === activeCount - 1;
    later.setAttribute('aria-label', `Move ${item.name} later in the circuit`);
    const eject = this.createActionButton('Eject', () => {
      this.itemInstances = unfitItem(this.itemInstances, instance.acquisitionOrder);
      this.status = `${item.name} returned to the upgrade rack.`;
    });
    actions.append(earlier, later, eject);
    node.append(header, heading, effect, output, actions);
    return node;
  }

  private createCargoSection(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'foundry-section foundry-cargo-management';
    section.dataset.testid = 'foundry-cargo-menu';
    const cargo = getCargoComponents(this.state.draft);
    const header = document.createElement('header');
    header.className = 'foundry-section-header';
    const title = document.createElement('h2');
    title.textContent = `Loose Hardware / ${cargo.length}`;
    const copy = document.createElement('p');
    copy.textContent =
      'Inspect recovered components, preserve future options, or mark hardware for scrap. Assignments are made in Hardpoint Control.';
    header.append(title, copy);
    const list = document.createElement('div');
    list.className = 'foundry-card-grid foundry-cargo-grid';

    if (cargo.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'foundry-empty';
      empty.textContent = 'No loose hardware.';
      list.append(empty);
    }

    for (const component of cargo) list.append(this.createCargoCard(component));
    section.append(header, list);
    return section;
  }

  private createCargoCard(component: FoundryComponentInstance): HTMLElement {
    const module = getShipModuleById(component.moduleId);
    const quality = getComponentQuality(component.qualityId);
    const card = document.createElement('article');
    card.className = 'foundry-card foundry-cargo-card';
    card.dataset.testid = `foundry-component-${component.id}`;
    card.style.setProperty('--component-quality', quality.presentation.color);
    const header = document.createElement('header');
    header.className = 'foundry-card-header';
    const heading = document.createElement('h3');
    heading.textContent = formatComponentName(component);
    header.append(heading, this.createBadge(quality.label.toUpperCase(), 'foundry-badge-quality'));

    const identity = document.createElement('div');
    identity.className = 'foundry-badge-row';
    identity.append(
      this.createBadge(component.sourceLabel),
      this.createBadge(module.slot.toUpperCase()),
      this.createBadge(module.size.toUpperCase())
    );
    for (const tag of component.tags.slice(0, 4)) identity.append(this.createBadge(tag));

    const modifiers = document.createElement('div');
    modifiers.className = 'foundry-badge-row foundry-modifier-row';
    for (const affixId of component.affixIds) {
      const affix = getComponentAffix(affixId);
      const badge = this.createBadge(affix.name, 'foundry-badge-affix');
      badge.title = `${affix.presentation.benefit} ${affix.presentation.tradeoff}`;
      modifiers.append(badge);
    }
    for (const recipeId of component.evolutionIds) {
      const recipe = getWeaponEvolutionRecipe(recipeId);
      const badge = this.createBadge(recipe.name, 'foundry-badge-evolution');
      badge.title = `${recipe.presentation.preview} ${recipe.presentation.risk}`;
      modifiers.append(badge);
    }
    if (modifiers.childElementCount === 0) modifiers.append(this.createBadge('CLEAN'));

    const frame = getShipFrameById(this.state.draft.frameId);
    const compatibleHardpoints = frame.hardpoints.filter((hardpoint) =>
      component.compatibility.compatibleHardpointIds.includes(hardpoint.id)
    );
    const fit = document.createElement('p');
    fit.className = 'foundry-cargo-fit';
    fit.innerHTML = `<strong>FITS</strong><span>${
      compatibleHardpoints.map((hardpoint) => hardpoint.label).join(' / ') || 'No current mount'
    }</span>`;

    const actions = document.createElement('div');
    actions.className = 'foundry-card-actions';
    actions.append(
      this.createActionButton(`Scrap +${component.salvageValue}`, () => {
        this.state = planScrapComponent(this.state, component.id, this.sectorIndex);
        this.status = `+${component.salvageValue} salvage on commit.`;
      })
    );
    card.append(
      header,
      identity,
      this.createComponentStatStrip(component),
      modifiers,
      fit,
      actions
    );
    return card;
  }

  private createActionButton(label: string, action: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'secondary-button foundry-action';
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => {
      action();
      this.enter();
    });
    return button;
  }

  private commit(): void {
    const result = commitFoundryDraft(this.state);
    if (!result.ok) {
      this.status = `Commit rejected: ${result.issues.join(' | ')}`;
      this.enter();
      return;
    }
    this.onComplete(
      result.state,
      reconcileItemSockets(this.itemInstances, result.state.committed),
      result.salvageGained
    );
  }

  private getItemSocketSignature(items: readonly ItemInstance[]): string {
    return items
      .map(
        (item) =>
          `${item.acquisitionOrder}:${item.socket?.componentId ?? '-'}:${item.socket?.socketIndex ?? '-'}:${item.socket?.circuitOrder ?? '-'}`
      )
      .join('|');
  }
}

function formatFoundryDelta(value: number): string {
  if (Math.abs(value) < 0.001) return '+/-0';
  return `${value > 0 ? '+' : ''}${Number(value.toFixed(2))}`;
}
