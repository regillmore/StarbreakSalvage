import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import { getComponentAffix, getComponentQuality } from '../content/engineering';
import { getShipFrameById, getShipModuleById } from '../content/shipModules';
import type { RunSkeleton, StartingContract } from '../game/Generation';
import {
  commitFoundryDraft,
  createEngineeringDebugState,
  formatComponentName,
  getCargoComponents,
  getComponentTradeoff,
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

export class FoundryScene implements Scene {
  public readonly id = 'foundry';
  private state: EngineeringState;
  private status = 'Recovered component secured. Draft changes are reversible until commit.';

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly run: RunSkeleton,
    private readonly contract: StartingContract,
    engineering: EngineeringState,
    private readonly sectorIndex: number,
    private readonly onComplete: (state: EngineeringState, salvageGained: number) => void
  ) {
    this.state = engineering;
  }

  public enter(): void {
    const frame = getShipFrameById(this.state.draft.frameId);
    const resolution = resolveEngineeringSnapshot(this.state.draft);
    const debug = createEngineeringDebugState(this.state);
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
    eyebrow.textContent = `Sector ${this.sectorIndex} | ${frame.name} | Salvage Foundry`;

    const title = document.createElement('h1');
    title.id = 'foundry-title';
    title.textContent = 'Engineer The Ship';

    const boundary = document.createElement('p');
    boundary.className = 'foundry-boundary';
    boundary.dataset.testid = 'foundry-boundary';
    boundary.textContent =
      'Planning bay: install, remove, reroute, fuse, overclock, or scrap. Undo restores the last commit; only Commit & Continue changes the flight ship.';

    const grid = document.createElement('p');
    grid.className = `foundry-grid-readout ${resolution.valid ? '' : 'foundry-grid-invalid'}`;
    grid.dataset.testid = 'foundry-grid-readout';
    grid.setAttribute('aria-live', 'polite');
    grid.textContent = `${resolution.valid ? 'LEGAL DRAFT' : 'INVALID DRAFT'} | ${resolution.summary} | ${debug.effects} | Proc ${debug.procBudget}`;

    const issueList = document.createElement('div');
    issueList.className = 'foundry-issues';
    issueList.dataset.testid = 'foundry-issues';
    if (resolution.issues.length === 0) {
      issueList.textContent = 'Validation: all hardpoints and resource envelopes pass.';
    } else {
      issueList.classList.add('foundry-issues-invalid');
      issueList.textContent = `Validation: ${resolution.issues.map((issue) => issue.message).join(' | ')}`;
    }

    const workspace = document.createElement('div');
    workspace.className = 'foundry-workspace';
    workspace.append(this.createInstalledSection(frame), this.createCargoSection());

    const fusion = this.createFusionSection();
    const pending = document.createElement('section');
    pending.className = 'foundry-history';
    pending.setAttribute('aria-label', 'Pending engineering operations');
    const pendingTitle = document.createElement('h2');
    pendingTitle.textContent = `Pending Operations (${this.state.pendingActions.length})`;
    const pendingCopy = document.createElement('p');
    pendingCopy.dataset.testid = 'foundry-pending-history';
    pendingCopy.textContent =
      this.state.pendingActions.length > 0
        ? this.state.pendingActions.map((action) => action.summary).join(' -> ')
        : 'No uncommitted changes.';
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
    commit.textContent = 'Commit & Continue';
    commit.disabled = !resolution.valid;
    commit.addEventListener('click', () => this.commit());

    const undo = document.createElement('button');
    undo.className = 'secondary-button';
    undo.type = 'button';
    undo.dataset.testid = 'foundry-undo';
    undo.textContent = 'Undo Draft';
    undo.disabled = this.state.pendingActions.length === 0;
    undo.addEventListener('click', () => {
      this.state = undoFoundryDraft(this.state);
      this.status = 'Draft reset to the last committed ship.';
      this.enter();
    });

    const skip = document.createElement('button');
    skip.className = 'secondary-button';
    skip.type = 'button';
    skip.dataset.testid = 'foundry-skip';
    skip.textContent = 'Continue Without Changes';
    skip.addEventListener('click', () => this.onComplete(undoFoundryDraft(this.state), 0));
    controls.append(commit, undo, skip);

    shell.append(
      eyebrow,
      createContractThemeStrip(this.uiRoot.ownerDocument, theme),
      title,
      boundary,
      grid,
      issueList,
      workspace,
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
      this.onComplete(undoFoundryDraft(this.state), 0);
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

  private createInstalledSection(frame: ReturnType<typeof getShipFrameById>): HTMLElement {
    const section = document.createElement('section');
    section.className = 'foundry-section';
    const title = document.createElement('h2');
    title.textContent = 'Installed Hardpoints';
    const list = document.createElement('div');
    list.className = 'foundry-card-grid';

    for (const hardpoint of frame.hardpoints) {
      const component = getInstalledComponent(this.state.draft, hardpoint.id);
      const card = document.createElement('article');
      card.className = 'foundry-card foundry-installed-card';
      card.dataset.testid = `foundry-hardpoint-${hardpoint.id}`;
      const heading = document.createElement('h3');
      heading.textContent = `${hardpoint.label} | ${hardpoint.slot}/${hardpoint.size}${hardpoint.required ? ' | REQUIRED' : ''}`;
      const copy = document.createElement('p');
      copy.textContent = component
        ? `${formatComponentName(component)} | ${getComponentTradeoff(component)}`
        : 'EMPTY HARDPOINT';
      card.append(heading, copy);

      if (component) {
        const actions = document.createElement('div');
        actions.className = 'foundry-card-actions';
        actions.append(
          this.createActionButton('Remove', () => {
            this.state = planRemoveComponent(this.state, hardpoint.id, this.sectorIndex);
            this.status = `${formatComponentName(component)} moved to cargo. Commit is blocked if the frame is incomplete.`;
          }),
          this.createActionButton(`Reroute (${component.routingMode})`, () => {
            this.state = planRerouteComponent(this.state, component.id, this.sectorIndex);
            this.status = 'Routing changed. Review power and heat headroom before commit.';
          }),
          this.createActionButton(`Overclock ${component.overclockLevel}`, () => {
            this.state = planOverclockComponent(this.state, component.id, this.sectorIndex);
            this.status = 'Overclock planned. Output rises with power, heat, and instability.';
          })
        );
        card.append(actions);
      }
      list.append(card);
    }
    section.append(title, list);
    return section;
  }

  private createCargoSection(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'foundry-section';
    const cargo = getCargoComponents(this.state.draft);
    const title = document.createElement('h2');
    title.textContent = `Component Cargo (${cargo.length})`;
    const list = document.createElement('div');
    list.className = 'foundry-card-grid';

    if (cargo.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'foundry-empty';
      empty.textContent =
        'No loose components. Remove an installed module or recover more salvage.';
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
    const heading = document.createElement('h3');
    heading.textContent = formatComponentName(component);
    const source = document.createElement('p');
    source.textContent = `${component.sourceLabel} | ${module.slot}/${module.size} | Tags ${component.tags.join('/')}`;
    const tradeoff = document.createElement('p');
    tradeoff.textContent = getComponentTradeoff(component);
    const affixes = document.createElement('p');
    affixes.textContent =
      component.affixIds.length > 0
        ? component.affixIds
            .map((affixId) => {
              const affix = getComponentAffix(affixId);
              return `${affix.name}: ${affix.presentation.benefit} ${affix.presentation.tradeoff}`;
            })
            .join(' | ')
        : 'No affix; clean fusion stock.';
    const actions = document.createElement('div');
    actions.className = 'foundry-card-actions';
    for (const hardpointId of component.compatibility.compatibleHardpointIds) {
      actions.append(
        this.createActionButton(`Install: ${hardpointId}`, () => {
          this.state = planInstallComponent(
            this.state,
            component.id,
            hardpointId,
            this.sectorIndex
          );
          this.status = `${formatComponentName(component)} assigned to ${hardpointId}. Displaced hardware remains in cargo.`;
        })
      );
    }
    actions.append(
      this.createActionButton(`Reroute (${component.routingMode})`, () => {
        this.state = planRerouteComponent(this.state, component.id, this.sectorIndex);
        this.status = 'Cargo routing planned; it matters when this component is installed.';
      }),
      this.createActionButton(`Overclock ${component.overclockLevel}`, () => {
        this.state = planOverclockComponent(this.state, component.id, this.sectorIndex);
        this.status = 'Cargo overclock planned. The risk becomes active on installation.';
      }),
      this.createActionButton(`Scrap +${component.salvageValue}`, () => {
        this.state = planScrapComponent(this.state, component.id, this.sectorIndex);
        this.status = `${component.salvageValue} run salvage reserved; payout occurs only on commit.`;
      })
    );
    card.append(heading, source, tradeoff, affixes, actions);
    return card;
  }

  private createFusionSection(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'foundry-section foundry-fusion';
    const options = getFusionOptions(this.state.draft);
    const title = document.createElement('h2');
    title.textContent = `Weapon Evolution Recipes (${options.length})`;
    const copy = document.createElement('p');
    copy.textContent =
      'Fusion consumes one loose catalyst and evolves one loose primary component. Outcomes are deterministic and each recipe is application-capped.';
    const list = document.createElement('div');
    list.className = 'foundry-fusion-list';
    if (options.length === 0) {
      const empty = document.createElement('p');
      empty.textContent =
        'No legal fusion pair in cargo. Remove a primary and recover a matching catalyst.';
      list.append(empty);
    }
    for (const option of options.slice(0, 8)) {
      const button = document.createElement('button');
      button.className = 'choice-card foundry-fusion-card';
      button.type = 'button';
      button.textContent = `${option.title} | ${option.preview} | Risk: ${option.risk}`;
      button.addEventListener('click', () => {
        this.state = planFuseComponents(this.state, option, this.sectorIndex);
        this.status = `${option.title} planned. Install the evolved primary and validate the grid before commit.`;
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
    this.onComplete(result.state, result.salvageGained);
  }
}
