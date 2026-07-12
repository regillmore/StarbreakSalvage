import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { getSaveSummary } from '../core/saveData';
import { KNOWN_SEED_LABELS, previewSeedEntry } from '../game/SeedEntry';
import type { RunSnapshotSummary } from '../game/RunSnapshot';
import type { InputAction } from '../systems/InputSystem';

type SaveSummary = ReturnType<typeof getSaveSummary>;

export class MainMenuScene implements Scene {
  public readonly id = 'main-menu';
  private primaryStartButton: HTMLButtonElement | null = null;
  private launchTimeouts: number[] = [];
  private launching = false;

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly saveSummary: SaveSummary,
    private readonly seedInput: string,
    private readonly onStartRun: (seedInput: string) => void,
    private readonly onOpenArchive: () => void,
    private readonly onOpenUpgradeBay: () => void,
    private readonly onOpenSettings: () => void,
    private readonly onOpenScenarioLab: (() => void) | null = null,
    private readonly resumeSummary: RunSnapshotSummary | null = null,
    private readonly onResumeRun: (() => void) | null = null,
    private readonly onDiscardRun: (() => void) | null = null,
    private readonly snapshotNotice: string | null = null
  ) {}

  public enter(): void {
    const document = this.uiRoot.ownerDocument;
    const shell = document.createElement('main');
    shell.className = 'title-shell';
    shell.setAttribute('aria-labelledby', 'game-title');

    const masthead = document.createElement('section');
    masthead.className = 'title-masthead';

    const copy = document.createElement('div');
    copy.className = 'title-copy';

    const eyebrow = document.createElement('p');
    eyebrow.className = 'title-eyebrow';
    eyebrow.textContent = 'Outer-system recovery directive // single pilot';

    const title = document.createElement('h1');
    title.id = 'game-title';
    title.className = 'title-logo';
    title.setAttribute('aria-label', 'Starbreak Salvage');
    const titleLead = document.createElement('span');
    titleLead.textContent = 'Starbreak';
    const titleTail = document.createElement('span');
    titleTail.textContent = 'Salvage';
    title.append(titleLead, titleTail);

    const tagline = document.createElement('p');
    tagline.className = 'tagline';
    tagline.textContent = 'Break the blockade. Build the impossible. Bring home what survives.';

    const doctrine = document.createElement('p');
    doctrine.className = 'title-doctrine';
    doctrine.textContent =
      'A single-player vertical roguelike of volatile weapons, hostile wreckage, and one-way contracts.';

    copy.append(eyebrow, title, tagline, doctrine);
    masthead.append(copy, createTitleArt(document));

    const explicitSeed = this.seedInput.trim().length > 0;
    const launchPanel = document.createElement('section');
    launchPanel.className = 'title-launch-panel';
    launchPanel.setAttribute('aria-labelledby', 'title-launch-heading');

    const launchCopy = document.createElement('div');
    const launchHeading = document.createElement('h2');
    launchHeading.id = 'title-launch-heading';
    launchHeading.textContent = explicitSeed ? 'Route signal acquired' : 'Your next wreck is unknown';
    const launchDetail = document.createElement('p');
    launchDetail.textContent = explicitSeed
      ? 'A shared expedition code is loaded. Launching will reproduce its contract board and route.'
      : 'A fresh expedition code will be generated when you launch. Random is the intended first choice.';
    launchCopy.append(launchHeading, launchDetail);

    const startButton = document.createElement('button');
    startButton.className = 'primary-button title-start-button';
    startButton.type = 'button';
    startButton.dataset.testid = 'start-expedition';
    startButton.textContent = explicitSeed
      ? 'Start Seeded Expedition'
      : 'Start Random Expedition';

    const launchStatus = document.createElement('p');
    launchStatus.className = 'title-launch-status';
    launchStatus.dataset.testid = 'launch-status';
    launchStatus.setAttribute('aria-live', 'polite');
    launchStatus.textContent = explicitSeed
      ? `Loaded code ${previewSeedEntry(this.seedInput).seed}`
      : 'New route, contracts, rewards, and threats on every launch.';

    startButton.addEventListener('click', () => {
      this.beginLaunch(explicitSeed ? this.seedInput : 'RANDOM', shell, startButton, launchStatus);
    });
    launchPanel.append(launchCopy, startButton, launchStatus);
    this.primaryStartButton = startButton;

    const resumePanel = this.createResumePanel(document);

    const navigation = document.createElement('nav');
    navigation.className = 'title-navigation';
    navigation.setAttribute('aria-label', 'Hangar services');
    navigation.append(
      createMenuButton(document, 'Unlock Archive', this.onOpenArchive),
      createMenuButton(document, 'Upgrade Bay', this.onOpenUpgradeBay),
      createMenuButton(document, 'Settings', this.onOpenSettings)
    );

    if (this.onOpenScenarioLab) {
      const scenarioLabButton = createMenuButton(
        document,
        'Scenario Lab [Debug]',
        this.onOpenScenarioLab
      );
      scenarioLabButton.dataset.testid = 'open-scenario-lab';
      navigation.append(scenarioLabButton);
    }

    const seedOptions = this.createSeedOptions(document, shell, launchStatus, explicitSeed);

    const footer = document.createElement('footer');
    footer.className = 'title-footer';
    const status = document.createElement('p');
    status.className = 'boot-status';
    status.dataset.testid = 'boot-status';
    status.textContent = `Salvage Bank ${this.saveSummary.salvageBank} kg // Unlocks ${this.saveSummary.unlockCount} // Upgrades ${this.saveSummary.upgradeCount} // Expeditions ${this.saveSummary.runsEnded}`;
    const build = document.createElement('p');
    build.className = 'title-build-mark';
    build.textContent = 'STARBREAK RECOVERY NETWORK // LOCAL OFFLINE BUILD';
    footer.append(status, build);

    const snapshotNotice = document.createElement('p');
    snapshotNotice.className = 'seed-status run-snapshot-notice';
    snapshotNotice.dataset.testid = 'run-snapshot-notice';
    snapshotNotice.hidden = this.snapshotNotice === null;
    snapshotNotice.textContent = this.snapshotNotice ?? '';

    shell.append(
      masthead,
      ...(resumePanel ? [resumePanel] : []),
      launchPanel,
      navigation,
      seedOptions,
      snapshotNotice,
      footer
    );
    this.uiRoot.replaceChildren(shell);
    startButton.focus();
  }

  public exit(): void {
    const view = this.uiRoot.ownerDocument.defaultView;
    for (const timeout of this.launchTimeouts) {
      view?.clearTimeout(timeout);
    }
    this.launchTimeouts = [];
    this.launching = false;
    this.primaryStartButton = null;
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action !== 'confirm' || this.launching) return;

    const activeElement = this.uiRoot.ownerDocument.activeElement;
    if (activeElement instanceof HTMLButtonElement && this.uiRoot.contains(activeElement)) {
      activeElement.click();
      return;
    }

    this.primaryStartButton?.click();
  }

  public getDebugState(): SceneDebugState {
    return {
      seed: 'n/a',
      entityCount: 0,
      progression: {
        salvageBank: this.saveSummary.salvageBank,
        purchasedUpgrades: this.saveSummary.upgradeCount
      }
    };
  }

  private createSeedOptions(
    document: Document,
    shell: HTMLElement,
    launchStatus: HTMLElement,
    open: boolean
  ): HTMLDetailsElement {
    const details = document.createElement('details');
    details.className = 'seed-options';
    details.open = open;

    const summary = document.createElement('summary');
    summary.textContent = 'Use a specific expedition code';

    const seedForm = document.createElement('form');
    seedForm.className = 'seed-form';

    const seedLabel = document.createElement('label');
    seedLabel.className = 'seed-label';
    seedLabel.htmlFor = 'menu-seed-entry';
    seedLabel.textContent = 'Expedition code (optional)';

    const seedRow = document.createElement('div');
    seedRow.className = 'seed-entry-row';

    const seedInput = document.createElement('input');
    seedInput.id = 'menu-seed-entry';
    seedInput.className = 'seed-entry-input';
    seedInput.dataset.testid = 'seed-entry';
    seedInput.type = 'text';
    seedInput.autocomplete = 'off';
    seedInput.spellcheck = false;
    seedInput.value = this.seedInput;
    seedInput.placeholder = 'Enter a shared or challenge code';
    seedInput.setAttribute('list', 'known-seed-labels');

    const seedOptions = document.createElement('datalist');
    seedOptions.id = 'known-seed-labels';
    for (const label of ['RANDOM', 'DEFAULT', ...KNOWN_SEED_LABELS]) {
      const option = document.createElement('option');
      option.value = label;
      seedOptions.append(option);
    }

    const seededStart = document.createElement('button');
    seededStart.className = 'secondary-button seed-launch-button';
    seededStart.type = 'submit';
    seededStart.textContent = 'Launch This Code';

    const seedStatus = document.createElement('p');
    seedStatus.className = 'seed-status';
    seedStatus.dataset.testid = 'seed-status';

    const syncSeedStatus = (): void => {
      seedStatus.textContent = previewSeedEntry(seedInput.value).status;
    };

    seedInput.addEventListener('input', syncSeedStatus);
    seedForm.addEventListener('submit', (event) => {
      event.preventDefault();
      this.beginLaunch(seedInput.value, shell, seededStart, launchStatus);
    });

    seedRow.append(seedInput, seededStart);
    seedForm.append(seedLabel, seedRow, seedOptions, seedStatus);
    details.append(summary, seedForm);
    syncSeedStatus();
    return details;
  }

  private beginLaunch(
    seedInput: string,
    shell: HTMLElement,
    button: HTMLButtonElement,
    status: HTMLElement
  ): void {
    if (this.launching) return;
    this.launching = true;
    shell.dataset.launching = 'true';

    for (const control of shell.querySelectorAll('button, input')) {
      if (control instanceof HTMLButtonElement || control instanceof HTMLInputElement) {
        control.disabled = true;
      }
    }

    button.textContent = 'Opening Contract Channel';
    status.textContent = 'Authenticating salvage license…';

    const document = this.uiRoot.ownerDocument;
    const view = document.defaultView;
    if (!view) {
      this.onStartRun(seedInput);
      return;
    }

    const reducedMotion = document.documentElement.dataset.reducedMotion === 'true';
    if (reducedMotion) {
      this.launchTimeouts.push(
        view.setTimeout(() => this.onStartRun(seedInput), 80)
      );
      return;
    }

    this.launchTimeouts.push(
      view.setTimeout(() => {
        status.textContent = 'Triangulating contract signals…';
      }, 170),
      view.setTimeout(() => {
        status.textContent = 'Contract board locked. Pilot transfer authorized.';
        button.textContent = 'Stand By';
      }, 360),
      view.setTimeout(() => this.onStartRun(seedInput), 560)
    );
  }

  private createResumePanel(document: Document): HTMLElement | null {
    if (!this.resumeSummary || !this.onResumeRun || !this.onDiscardRun) return null;
    const panel = document.createElement('section');
    panel.className = 'run-snapshot-panel title-resume-panel';
    panel.dataset.testid = 'run-snapshot-panel';
    panel.setAttribute('aria-labelledby', 'run-snapshot-title');
    const title = document.createElement('h2');
    title.id = 'run-snapshot-title';
    title.textContent = 'Suspended Expedition';
    const summary = document.createElement('p');
    summary.dataset.testid = 'run-snapshot-summary';
    summary.textContent = `${this.resumeSummary.contractName} | ${this.resumeSummary.actLabel} S${this.resumeSummary.sectorNumber} ${this.resumeSummary.sectorName} | ${this.resumeSummary.checkpointLabel} | ${(this.resumeSummary.bytes / 1024).toFixed(1)} KiB | Code ${this.resumeSummary.seed}`;
    const boundary = document.createElement('p');
    boundary.className = 'choice-meta';
    boundary.textContent =
      this.resumeSummary.target === 'gameplay'
        ? 'Resume restarts the current operation from its safe entry checkpoint.'
        : this.resumeSummary.target === 'operationalMap'
          ? 'Resume returns to the settled operational map checkpoint.'
          : 'Resume returns to the saved mission briefing checkpoint.';
    const actions = document.createElement('div');
    actions.className = 'button-row';
    const resume = document.createElement('button');
    resume.type = 'button';
    resume.className = 'primary-button';
    resume.dataset.testid = 'resume-expedition';
    resume.textContent = 'Resume Expedition';
    resume.addEventListener('click', this.onResumeRun);
    const discard = document.createElement('button');
    discard.type = 'button';
    discard.className = 'secondary-button';
    discard.dataset.testid = 'discard-expedition';
    discard.textContent = 'Discard Snapshot';
    discard.addEventListener('click', this.onDiscardRun);
    actions.append(resume, discard);
    panel.append(title, summary, boundary, actions);
    return panel;
  }
}

function createMenuButton(
  document: Document,
  label: string,
  onClick: () => void
): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'secondary-button title-service-button';
  button.type = 'button';
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

function createTitleArt(document: Document): HTMLElement {
  const frame = document.createElement('figure');
  frame.className = 'title-art';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 520 420');
  svg.setAttribute('role', 'img');
  svg.setAttribute(
    'aria-label',
    'A salvage cutter descending through a shattered orbital ring toward a luminous wreck field.'
  );
  svg.innerHTML = `
    <defs>
      <linearGradient id="title-hull" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f8fbff" />
        <stop offset="0.45" stop-color="#7cf7ff" />
        <stop offset="1" stop-color="#17627a" />
      </linearGradient>
      <radialGradient id="title-core">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.96" />
        <stop offset="0.22" stop-color="#ffef5f" stop-opacity="0.88" />
        <stop offset="1" stop-color="#ff6bd6" stop-opacity="0" />
      </radialGradient>
      <filter id="title-glow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
    </defs>
    <g class="title-art-stars" fill="#f8fbff">
      <circle cx="58" cy="82" r="2" /><circle cx="132" cy="32" r="1.4" />
      <circle cx="446" cy="65" r="1.8" /><circle cx="482" cy="184" r="1.2" />
      <circle cx="84" cy="304" r="1.5" /><circle cx="420" cy="348" r="2" />
      <circle cx="314" cy="46" r="1.2" /><circle cx="218" cy="366" r="1.5" />
    </g>
    <g class="title-art-ring" fill="none" stroke="#7cf7ff">
      <path d="M42 222 C102 80 389 41 484 202" stroke-width="13" opacity="0.22" />
      <path d="M35 245 C114 356 394 379 491 214" stroke-width="4" opacity="0.7" />
      <path d="M62 174 L114 126 M398 103 L454 148 M52 274 L110 312 M406 324 L466 270" stroke-width="8" opacity="0.8" />
    </g>
    <g class="title-art-wreckage" fill="#ff6bd6" stroke="#f8fbff" stroke-width="2">
      <path d="M78 176 l31 -16 20 19 -28 24 z" opacity="0.5" />
      <path d="M397 244 l40 -14 18 31 -47 10 z" opacity="0.55" />
      <path d="M118 328 l26 -10 13 21 -33 13 z" opacity="0.42" />
      <path d="M374 76 l21 -8 17 14 -28 17 z" opacity="0.42" />
    </g>
    <circle class="title-art-core" cx="276" cy="218" r="106" fill="url(#title-core)" filter="url(#title-glow)" />
    <g class="title-art-ship" transform="translate(268 210) rotate(-8)">
      <path d="M0 -96 L34 -26 L68 12 L30 20 L16 74 L0 96 L-16 74 L-30 20 L-68 12 L-34 -26 Z" fill="url(#title-hull)" stroke="#f8fbff" stroke-width="4" />
      <path d="M0 -58 L16 -8 L0 28 L-16 -8 Z" fill="#081523" stroke="#ffef5f" stroke-width="3" />
      <path d="M-28 20 L-13 68 M28 20 L13 68" stroke="#ff6bd6" stroke-width="5" />
      <path d="M-12 83 L0 126 L12 83" fill="#ffef5f" opacity="0.88" />
    </g>
    <g class="title-art-scan" fill="none" stroke="#ffef5f" stroke-width="2">
      <circle cx="268" cy="210" r="136" stroke-dasharray="5 13" />
      <path d="M268 52 V24 M268 368 V396 M110 210 H82 M426 210 H454" />
    </g>
  `;

  const caption = document.createElement('figcaption');
  caption.innerHTML = '<strong>Recovery window open</strong><span>Contract traffic detected beyond the ring</span>';
  frame.append(svg, caption);
  return frame;
}
