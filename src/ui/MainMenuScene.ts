import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { getSaveSummary } from '../core/saveData';
import { KNOWN_SEED_LABELS, previewSeedEntry } from '../game/SeedEntry';
import type { InputAction } from '../systems/InputSystem';
import type { RunSnapshotSummary } from '../game/RunSnapshot';

type SaveSummary = ReturnType<typeof getSaveSummary>;

export class MainMenuScene implements Scene {
  public readonly id = 'main-menu';
  private seedInputElement: HTMLInputElement | null = null;

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
    const shell = document.createElement('main');
    shell.className = 'title-shell';
    shell.setAttribute('aria-labelledby', 'game-title');

    const title = document.createElement('h1');
    title.id = 'game-title';
    title.textContent = 'Starbreak Salvage';

    const tagline = document.createElement('p');
    tagline.className = 'tagline';
    tagline.textContent = 'Disposable pilots. Unsafe weapons. Profitable wreckage.';

    const seedForm = document.createElement('form');
    seedForm.className = 'seed-form';

    const seedLabel = document.createElement('label');
    seedLabel.className = 'seed-label';
    seedLabel.htmlFor = 'menu-seed-entry';
    seedLabel.textContent = 'Seed';

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
    seedInput.placeholder = 'blank, random, default, or seed label';
    seedInput.setAttribute('list', 'known-seed-labels');

    const seedOptions = document.createElement('datalist');
    seedOptions.id = 'known-seed-labels';
    for (const label of ['DEFAULT', 'RANDOM', ...KNOWN_SEED_LABELS]) {
      const option = document.createElement('option');
      option.value = label;
      seedOptions.append(option);
    }

    const startButton = document.createElement('button');
    startButton.className = 'primary-button title-button';
    startButton.type = 'submit';
    startButton.textContent = 'Start Run';

    const seedStatus = document.createElement('p');
    seedStatus.className = 'seed-status';
    seedStatus.dataset.testid = 'seed-status';

    const syncSeedStatus = (): void => {
      seedStatus.textContent = previewSeedEntry(seedInput.value).status;
    };

    seedInput.addEventListener('input', syncSeedStatus);
    seedForm.addEventListener('submit', (event) => {
      event.preventDefault();
      this.onStartRun(seedInput.value);
    });

    seedRow.append(seedInput, startButton);
    seedForm.append(seedLabel, seedRow, seedOptions, seedStatus);
    this.seedInputElement = seedInput;
    syncSeedStatus();

    const archiveButton = document.createElement('button');
    archiveButton.className = 'secondary-button title-button';
    archiveButton.type = 'button';
    archiveButton.textContent = 'Unlock Archive';
    archiveButton.addEventListener('click', this.onOpenArchive);

    const upgradeBayButton = document.createElement('button');
    upgradeBayButton.className = 'secondary-button title-button';
    upgradeBayButton.type = 'button';
    upgradeBayButton.textContent = 'Upgrade Bay';
    upgradeBayButton.addEventListener('click', this.onOpenUpgradeBay);

    const settingsButton = document.createElement('button');
    settingsButton.className = 'secondary-button title-button';
    settingsButton.type = 'button';
    settingsButton.textContent = 'Settings';
    settingsButton.addEventListener('click', this.onOpenSettings);

    const status = document.createElement('p');
    status.className = 'boot-status';
    status.dataset.testid = 'boot-status';
    status.textContent = `Bank ${this.saveSummary.salvageBank} kg | Unlocks ${this.saveSummary.unlockCount} | Upgrades ${this.saveSummary.upgradeCount} | Runs ${this.saveSummary.runsEnded}`;

    const scenarioLabButton = document.createElement('button');
    scenarioLabButton.className = 'secondary-button title-button';
    scenarioLabButton.type = 'button';
    scenarioLabButton.dataset.testid = 'open-scenario-lab';
    scenarioLabButton.textContent = 'Scenario Lab [Debug]';
    scenarioLabButton.hidden = this.onOpenScenarioLab === null;
    scenarioLabButton.addEventListener('click', () => this.onOpenScenarioLab?.());

    const resumePanel = this.createResumePanel();
    const snapshotNotice = document.createElement('p');
    snapshotNotice.className = 'seed-status run-snapshot-notice';
    snapshotNotice.dataset.testid = 'run-snapshot-notice';
    snapshotNotice.hidden = this.snapshotNotice === null;
    snapshotNotice.textContent = this.snapshotNotice ?? '';

    shell.append(
      title,
      tagline,
      seedForm,
      ...(resumePanel ? [resumePanel] : []),
      archiveButton,
      upgradeBayButton,
      settingsButton,
      scenarioLabButton,
      snapshotNotice,
      status
    );
    this.uiRoot.replaceChildren(shell);
    seedInput.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'confirm') {
      const activeElement = this.uiRoot.ownerDocument.activeElement;
      if (activeElement instanceof HTMLButtonElement && this.uiRoot.contains(activeElement)) {
        activeElement.click();
        return;
      }
      this.onStartRun(this.seedInputElement?.value ?? this.seedInput);
    }
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

  private createResumePanel(): HTMLElement | null {
    if (!this.resumeSummary || !this.onResumeRun || !this.onDiscardRun) return null;
    const panel = document.createElement('section');
    panel.className = 'run-snapshot-panel';
    panel.dataset.testid = 'run-snapshot-panel';
    panel.setAttribute('aria-labelledby', 'run-snapshot-title');
    const title = document.createElement('h2');
    title.id = 'run-snapshot-title';
    title.textContent = 'Suspended Expedition';
    const summary = document.createElement('p');
    summary.dataset.testid = 'run-snapshot-summary';
    summary.textContent = `${this.resumeSummary.contractName} | ${this.resumeSummary.actLabel} S${this.resumeSummary.sectorNumber} ${this.resumeSummary.sectorName} | ${this.resumeSummary.checkpointLabel} | ${(this.resumeSummary.bytes / 1024).toFixed(1)} KiB | Seed ${this.resumeSummary.seed}`;
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
