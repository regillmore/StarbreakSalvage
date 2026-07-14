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
  canFitItemInSocket,
  createItemSocketCircuitSummary,
  fitItemInSocket,
  getActiveFittedItems,
  getItemCompatibleSocketTypes,
  getItemSocketSlots,
  reconcileItemSockets,
  unfitItem
} from '../game/ItemSockets';
import {
  commitFoundryDraft,
  createEngineeringDebugState,
  formatComponentName,
  getCargoComponents,
  getFusionOptions,
  getInstalledComponent,
  planFuseComponents,
  planInstallComponent,
  planOverclockComponent,
  planRemoveComponent,
  planRerouteComponent,
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
import { createShipPreviewElement, createShipPreviewModel } from './ShipPreview';

export class FoundryScene implements Scene {
  public readonly id = 'foundry';
  private state: EngineeringState;
  private itemInstances: ItemInstance[];
  private readonly committedItemInstances: ItemInstance[];
  private status = 'Component secured. Draft is reversible.';

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
    this.itemInstances = reconcileItemSockets(this.itemInstances, this.state.draft);
    const dashboard = createFoundryDashboardModel(
      this.state,
      getActiveFittedItems(this.itemInstances, this.state.draft)
    );
    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide foundry-panel';
    shell.dataset.testid = 'salvage-foundry';
    shell.setAttribute('aria-labelledby', 'foundry-title');
    const theme = createContractScreenThemeModel(
      this.contract,
      getContractThemeOptions(this.uiRoot.ownerDocument)
    );
    applyContractScreenTheme(shell, theme);

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `Sector ${this.sectorIndex} / ${frame.name} / Salvage Foundry`;

    const title = document.createElement('h1');
    title.id = 'foundry-title';
    title.textContent = 'Hardpoint Control';

    const boundary = document.createElement('p');
    boundary.className = 'foundry-boundary';
    boundary.dataset.testid = 'foundry-boundary';
    boundary.textContent = `DRAFT BAY // Commit launches. Undo restores.${this.crewAssist ? ` Crew: ${this.crewAssist}` : ''}`;

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

    const console = this.createCommandConsole(dashboard);

    const workspace = document.createElement('div');
    workspace.className = 'foundry-workspace';
    workspace.append(this.createInstalledSection(frame), this.createCargoSection());

    const sockets = this.createUpgradeCircuitSection();
    const fusion = this.createFusionSection();
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
      boundary,
      grid,
      console,
      issueList,
      workspace,
      sockets,
      fusion,
      pending,
      status,
      controls
    );
    this.uiRoot.replaceChildren(shell);
    shell.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
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
    const previewFrame = document.createElement('div');
    previewFrame.className = 'ship-preview-frame ship-preview-frame-hero foundry-attack-preview';
    previewFrame.dataset.testid = 'foundry-attack-preview';
    previewFrame.style.setProperty('--ship-primary', previewModel.primaryColor);
    previewFrame.style.setProperty('--ship-secondary', previewModel.secondaryColor);
    previewFrame.style.setProperty('--ship-trim', previewModel.trimColor);
    previewFrame.style.setProperty('--ship-engine', previewModel.engineColor);
    previewFrame.setAttribute('role', 'group');
    previewFrame.setAttribute('aria-label', dashboard.attackSimulation.ariaLabel);
    const projectileLayer = document.createElement('div');
    projectileLayer.className = 'foundry-attack-projectile-layer';
    projectileLayer.dataset.testid = 'foundry-attack-projectile-layer';
    projectileLayer.dataset.volleySize = String(dashboard.attackSimulation.volleySize);
    projectileLayer.dataset.fireCooldown = String(
      dashboard.attackSimulation.fireCooldownSeconds
    );
    projectileLayer.setAttribute('aria-hidden', 'true');
    for (const projectile of dashboard.attackSimulation.projectiles) {
      const shot = document.createElement('span');
      shot.className = 'foundry-attack-projectile';
      if (projectile.waveIndex > 0) shot.classList.add('foundry-attack-projectile-echo');
      shot.dataset.testid = 'foundry-attack-projectile';
      shot.dataset.projectileIndex = String(projectile.projectileIndex);
      shot.dataset.waveIndex = String(projectile.waveIndex);
      shot.dataset.velocity = `${projectile.vx},${projectile.vy}`;
      shot.dataset.damage = String(projectile.damage);
      shot.dataset.radius = String(projectile.radius);
      shot.dataset.ttl = String(projectile.ttl);
      shot.dataset.tags = projectile.tags.join(' ');
      shot.style.setProperty('--shot-start-x', `${projectile.startX}px`);
      shot.style.setProperty('--shot-end-x', `${projectile.endX}px`);
      shot.style.setProperty('--shot-end-y', `${projectile.endY}px`);
      shot.style.setProperty('--shot-rest-x', `${projectile.restX}px`);
      shot.style.setProperty('--shot-rest-y', `${projectile.restY}px`);
      shot.style.setProperty('--shot-performance-x', `${projectile.performanceX}px`);
      shot.style.setProperty('--shot-performance-y', `${projectile.performanceY}px`);
      shot.style.setProperty('--shot-size', `${projectile.displaySize}px`);
      shot.style.setProperty('--shot-duration', `${projectile.durationSeconds}s`);
      shot.style.setProperty('--shot-delay', `${projectile.delaySeconds}s`);
      projectileLayer.append(shot);
    }
    const targeting = document.createElement('span');
    targeting.className = 'foundry-target-reticle';
    targeting.setAttribute('aria-hidden', 'true');
    const liveFire = document.createElement('span');
    liveFire.className = 'foundry-live-fire-label';
    liveFire.textContent = 'LIVE FIRE';
    liveFire.setAttribute('aria-hidden', 'true');
    previewFrame.append(
      projectileLayer,
      createShipPreviewElement(document, previewModel, { mode: 'combat' }),
      targeting,
      liveFire
    );

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

  private createComponentStatStrip(
    component: FoundryComponentInstance,
    includeSalvage = false
  ): HTMLElement {
    const stats = createFoundryComponentStatModel(component);
    const strip = document.createElement('div');
    strip.className = 'foundry-component-stats';
    strip.setAttribute(
      'aria-label',
      `Power ${stats.power}, heat ${stats.heat}, mass ${stats.mass}, command ${stats.command}, instability ${stats.instability}${includeSalvage ? `, scrap ${stats.salvage}` : ''}`
    );
    const values: readonly (readonly [string, string, number])[] = [
      ['power', 'P', stats.power],
      ['heat', 'H', stats.heat],
      ['mass', 'M', stats.mass],
      ['command', 'C', stats.command],
      ['instability', '!', stats.instability],
      ...(includeSalvage ? ([['salvage', '$', stats.salvage]] as const) : [])
    ];
    for (const [id, glyph, value] of values) {
      const stat = document.createElement('span');
      stat.dataset.stat = id;
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

  private createInstalledSection(frame: ReturnType<typeof getShipFrameById>): HTMLElement {
    const section = document.createElement('section');
    section.className = 'foundry-section';
    const title = document.createElement('h2');
    title.textContent = 'Hardpoints';
    const list = document.createElement('div');
    list.className = 'foundry-card-grid';

    for (const hardpoint of frame.hardpoints) {
      const component = getInstalledComponent(this.state.draft, hardpoint.id);
      const card = document.createElement('article');
      card.className = 'foundry-card foundry-installed-card';
      card.dataset.testid = `foundry-hardpoint-${hardpoint.id}`;
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
      card.append(header);

      if (component) {
        const componentName = document.createElement('strong');
        componentName.className = 'foundry-component-name';
        componentName.textContent = formatComponentName(component);
        card.append(
          componentName,
          this.createComponentStatStrip(component),
          this.createComponentSocketStrip(component.id)
        );
        const actions = document.createElement('div');
        actions.className = 'foundry-card-actions';
        actions.append(
          this.createActionButton('Remove', () => {
            this.state = planRemoveComponent(this.state, hardpoint.id, this.sectorIndex);
            this.status = `${formatComponentName(component)} moved to cargo.`;
          }),
          this.createActionButton(`Route / ${component.routingMode}`, () => {
            this.state = planRerouteComponent(this.state, component.id, this.sectorIndex);
            this.status = 'Routing changed.';
          }),
          this.createActionButton(`Clock / ${component.overclockLevel}`, () => {
            this.state = planOverclockComponent(this.state, component.id, this.sectorIndex);
            this.status = 'Overclock staged.';
          })
        );
        card.append(actions);
      } else {
        const empty = document.createElement('strong');
        empty.className = 'foundry-hardpoint-empty';
        empty.textContent = 'EMPTY';
        card.append(empty);
      }
      list.append(card);
    }
    section.append(title, list);
    return section;
  }

  private createComponentSocketStrip(componentId: string): HTMLElement {
    const strip = document.createElement('div');
    strip.className = 'foundry-socket-strip';
    for (const slot of getItemSocketSlots(this.state.draft).filter(
      (candidate) => candidate.componentId === componentId
    )) {
      const item = this.itemInstances.find(
        (candidate) =>
          candidate.socket?.componentId === componentId &&
          candidate.socket.socketIndex === slot.socketIndex
      );
      const socket = document.createElement('span');
      socket.className = `foundry-socket foundry-socket-${slot.type}`;
      socket.dataset.testid = `foundry-socket-${componentId}-${slot.socketIndex}`;
      socket.textContent = item
        ? `${slot.circuitOrder + 1} ${slot.type.toUpperCase()} / ${getItemById(item.itemId).name}`
        : `${slot.circuitOrder + 1} ${slot.type.toUpperCase()} / EMPTY`;
      strip.append(socket);
    }
    return strip;
  }

  private createUpgradeCircuitSection(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'foundry-section foundry-upgrade-circuit';
    section.dataset.testid = 'foundry-upgrade-circuit';
    const summary = createItemSocketCircuitSummary(this.itemInstances, this.state.draft);
    const title = document.createElement('h2');
    title.textContent = `Upgrade Circuit / ${summary.fitted}/${summary.capacity}`;
    const copy = document.createElement('p');
    copy.className = 'foundry-circuit-copy';
    copy.textContent =
      summary.chain.length > 0
        ? `Signal order: ${summary.chain.join(' > ')}. Later upgrades receive earlier transformations.`
        : 'No live circuit. Fit upgrades to installed components.';
    const rack = document.createElement('div');
    rack.className = 'foundry-card-grid foundry-upgrade-rack';

    for (const instance of [...this.itemInstances].sort(
      (left, right) => left.acquisitionOrder - right.acquisitionOrder
    )) {
      const item = getItemById(instance.itemId);
      const card = document.createElement('article');
      card.className = `foundry-card foundry-upgrade-card ${
        instance.socket ? 'foundry-upgrade-fitted' : 'foundry-upgrade-idle'
      }`;
      card.dataset.testid = `foundry-upgrade-${instance.acquisitionOrder}`;
      const heading = document.createElement('h3');
      heading.textContent = item.name;
      const effect = document.createElement('p');
      effect.textContent = item.effect;
      const badges = document.createElement('div');
      badges.className = 'foundry-badge-row';
      badges.append(
        this.createBadge(instance.socket ? `LIVE ${instance.socket.circuitOrder + 1}` : 'RACK'),
        ...getItemCompatibleSocketTypes(item).map((type) =>
          this.createBadge(type.toUpperCase(), `foundry-badge-${type}`)
        )
      );
      const actions = document.createElement('div');
      actions.className = 'foundry-card-actions foundry-socket-actions';
      if (instance.socket) {
        actions.append(
          this.createActionButton('Eject', () => {
            this.itemInstances = unfitItem(this.itemInstances, instance.acquisitionOrder);
            this.status = `${item.name} returned to the upgrade rack.`;
          })
        );
      }
      const compatibleSlots = getItemSocketSlots(this.state.draft).filter(
        (candidate) =>
          canFitItemInSocket(item.id, candidate) &&
          !(
            instance.socket?.componentId === candidate.componentId &&
            instance.socket.socketIndex === candidate.socketIndex
          )
      );
      if (compatibleSlots.length > 0) {
        const select = document.createElement('select');
        select.className = 'foundry-socket-select';
        select.setAttribute('aria-label', `Fit or move ${item.name}`);
        const prompt = document.createElement('option');
        prompt.value = '';
        prompt.textContent = instance.socket ? 'Move / swap…' : 'Fit / swap…';
        select.append(prompt);
        for (const slot of compatibleSlots) {
          const occupant = this.itemInstances.find(
            (candidate) =>
              candidate.socket?.componentId === slot.componentId &&
              candidate.socket.socketIndex === slot.socketIndex
          );
          const option = document.createElement('option');
          option.value = `${slot.componentId}:${slot.socketIndex}`;
          option.textContent = `${slot.circuitOrder + 1} / ${slot.moduleName} / ${slot.type.toUpperCase()}${
            occupant ? ` / swap ${getItemById(occupant.itemId).name}` : ''
          }`;
          select.append(option);
        }
        select.addEventListener('change', () => {
          const slot = compatibleSlots.find(
            (candidate) =>
              `${candidate.componentId}:${candidate.socketIndex}` === select.value
          );
          if (!slot) return;
          this.itemInstances = fitItemInSocket(
            this.itemInstances,
            this.state.draft,
            instance.acquisitionOrder,
            slot.componentId,
            slot.socketIndex
          );
          this.status = `${item.name} routed into ${slot.moduleName} ${slot.type} socket.`;
          this.enter();
        });
        actions.append(select);
      }
      card.append(heading, badges, effect, actions);
      rack.append(card);
    }
    section.append(title, copy, rack);
    return section;
  }

  private createCargoSection(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'foundry-section';
    const cargo = getCargoComponents(this.state.draft);
    const title = document.createElement('h2');
    title.textContent = `Cargo / ${cargo.length}`;
    const list = document.createElement('div');
    list.className = 'foundry-card-grid';

    if (cargo.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'foundry-empty';
      empty.textContent = 'No loose hardware.';
      list.append(empty);
    }

    for (const component of cargo) list.append(this.createCargoCard(component));
    section.append(title, list);
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

    const actions = document.createElement('div');
    actions.className = 'foundry-card-actions';
    const frame = getShipFrameById(this.state.draft.frameId);
    for (const hardpointId of component.compatibility.compatibleHardpointIds) {
      const hardpoint = frame.hardpoints.find((candidate) => candidate.id === hardpointId);
      const installed = getInstalledComponent(this.state.draft, hardpointId);
      const comparison = compareFoundryComponents(component, installed);
      const install = document.createElement('button');
      install.className = 'secondary-button foundry-action foundry-install-action';
      install.type = 'button';
      install.dataset.tone = comparison.tone;
      install.setAttribute(
        'aria-label',
        `Install ${formatComponentName(component)} in ${hardpoint?.label ?? hardpointId}. Resource change ${comparison.label}`
      );
      const installLabel = document.createElement('strong');
      installLabel.textContent = `Install / ${hardpoint?.label ?? hardpointId}`;
      const comparisonLabel = document.createElement('small');
      comparisonLabel.textContent = comparison.label;
      install.append(installLabel, comparisonLabel);
      install.addEventListener('click', () => {
        this.state = planInstallComponent(this.state, component.id, hardpointId, this.sectorIndex);
        this.status = `${formatComponentName(component)} installed in ${hardpoint?.label ?? hardpointId}.`;
        this.enter();
      });
      actions.append(install);
    }
    actions.append(
      this.createActionButton(`Route / ${component.routingMode}`, () => {
        this.state = planRerouteComponent(this.state, component.id, this.sectorIndex);
        this.status = 'Cargo routing staged.';
      }),
      this.createActionButton(`Clock / ${component.overclockLevel}`, () => {
        this.state = planOverclockComponent(this.state, component.id, this.sectorIndex);
        this.status = 'Cargo overclock staged.';
      }),
      this.createActionButton(`Scrap +${component.salvageValue}`, () => {
        this.state = planScrapComponent(this.state, component.id, this.sectorIndex);
        this.status = `+${component.salvageValue} salvage on commit.`;
      })
    );
    card.append(
      header,
      identity,
      this.createComponentStatStrip(component, true),
      modifiers,
      actions
    );
    return card;
  }

  private createFusionSection(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'foundry-section foundry-fusion';
    const options = getFusionOptions(this.state.draft);
    const title = document.createElement('h2');
    title.textContent = `Evolution / ${options.length}`;
    const copy = document.createElement('p');
    copy.textContent = 'BASE + CATALYST -> NEW FIRE';
    const list = document.createElement('div');
    list.className = 'foundry-fusion-list';
    if (options.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No compatible pair in cargo.';
      list.append(empty);
    }
    for (const option of options.slice(0, 8)) {
      const button = document.createElement('button');
      button.className = 'choice-card foundry-fusion-card';
      button.type = 'button';
      const optionTitle = document.createElement('span');
      optionTitle.className = 'choice-title';
      optionTitle.textContent = option.title;
      const preview = document.createElement('span');
      preview.className = 'choice-body';
      preview.textContent = option.preview;
      const risk = document.createElement('span');
      risk.className = 'choice-meta';
      risk.textContent = `RISK / ${option.risk}`;
      button.append(optionTitle, preview, risk);
      button.addEventListener('click', () => {
        this.state = planFuseComponents(this.state, option, this.sectorIndex);
        this.status = `${option.title} staged.`;
        this.enter();
      });
      list.append(button);
    }
    section.append(title, copy, list);
    return section;
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
          `${item.acquisitionOrder}:${item.socket?.componentId ?? '-'}:${item.socket?.socketIndex ?? '-'}`
      )
      .join('|');
  }
}

function formatFoundryDelta(value: number): string {
  if (Math.abs(value) < 0.001) return '+/-0';
  return `${value > 0 ? '+' : ''}${Number(value.toFixed(2))}`;
}
