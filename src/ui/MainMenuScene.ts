import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { getSaveSummary } from '../core/saveData';
import { KNOWN_SEED_LABELS, previewSeedEntry } from '../game/SeedEntry';
import type { InputAction } from '../systems/InputSystem';

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
    private readonly onOpenSettings: () => void
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

    shell.append(title, tagline, seedForm, archiveButton, upgradeBayButton, settingsButton, status);
    this.uiRoot.replaceChildren(shell);
    seedInput.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'confirm') {
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
}
