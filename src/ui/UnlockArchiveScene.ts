import type { CanvasRenderer } from '../app/CanvasRenderer';
import { ACHIEVEMENTS } from '../content/achievements';
import { UNLOCKS } from '../content/unlocks';
import { UPGRADES } from '../content/upgrades';
import type { SaveData } from '../core/saveData';
import type { Scene } from '../app/Scene';
import type { InputAction } from '../systems/InputSystem';
import { createArchiveUpgradeProgressModel } from './RunSummaryProgress';

export interface SaveImportResult {
  readonly ok: boolean;
  readonly message: string;
}

export class UnlockArchiveScene implements Scene {
  public readonly id = 'unlock-archive';
  private statusText = 'Archive ready.';

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly getSaveData: () => SaveData,
    private readonly onExport: () => string,
    private readonly onImport: (serialized: string) => SaveImportResult,
    private readonly onReset: () => void,
    private readonly onOpenUpgradeBay: () => void,
    private readonly onBack: () => void
  ) {}

  public enter(): void {
    const saveData = this.getSaveData();
    const upgradeProgress = createArchiveUpgradeProgressModel(saveData);
    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide archive-panel';
    shell.setAttribute('aria-labelledby', 'archive-title');

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `Salvage Bank ${saveData.salvageBank} kg | Unlocks ${saveData.unlockedIds.length}/${UNLOCKS.length} | Upgrades ${saveData.purchasedUpgradeIds.length}/${UPGRADES.length} | Ready ${upgradeProgress.availableUpgradeCount}`;

    const title = document.createElement('h1');
    title.id = 'archive-title';
    title.textContent = 'Unlock Archive';

    const stats = document.createElement('dl');
    stats.className = 'summary-stats';
    stats.dataset.testid = 'save-stats';

    const statEntries: ReadonlyArray<readonly [string, string]> = [
      ['Runs', `${saveData.stats.runsEnded}`],
      ['Sectors', `${saveData.stats.sectorsCleared}`],
      ['Bosses', `${saveData.stats.bossesDefeated}`],
      ['Best Sector', `${saveData.stats.bestSectorsCleared}`],
      ['Recovered', `${saveData.stats.salvageRecovered} kg`],
      ['Upgrades', `${saveData.purchasedUpgradeIds.length}/${UPGRADES.length}`],
      ['Affordable', `${upgradeProgress.availableUpgradeCount}/${UPGRADES.length}`],
      ['Next Upgrade', upgradeProgress.statusText],
      ['Achievements', `${saveData.achievementIds.length}/${ACHIEVEMENTS.length}`]
    ];

    for (const [label, value] of statEntries) {
      const term = document.createElement('dt');
      term.textContent = label;

      const detail = document.createElement('dd');
      detail.textContent = value;

      stats.append(term, detail);
    }

    const unlockGrid = document.createElement('div');
    unlockGrid.className = 'archive-grid';
    unlockGrid.dataset.testid = 'unlock-list';

    for (const unlock of UNLOCKS) {
      const item = document.createElement('article');
      item.className = 'archive-item';
      item.dataset.unlocked = saveData.unlockedIds.includes(unlock.id) ? 'true' : 'false';

      const name = document.createElement('h2');
      name.textContent = unlock.name;

      const meta = document.createElement('p');
      meta.className = 'choice-meta';
      meta.textContent = `${unlock.kind} | ${item.dataset.unlocked === 'true' ? 'Unlocked' : 'Locked'}`;

      const body = document.createElement('p');
      body.className = 'choice-body';
      body.textContent = unlock.summary;

      const effect = document.createElement('p');
      effect.className = 'choice-body';
      effect.textContent = unlock.effect;

      const grants = document.createElement('p');
      grants.className = 'choice-meta';
      grants.textContent = `Adds ${unlock.grants.join(', ')}`;

      item.append(name, meta, body, effect, grants);
      unlockGrid.append(item);
    }

    const saveBox = document.createElement('textarea');
    saveBox.className = 'save-textarea';
    saveBox.dataset.testid = 'save-import-box';
    saveBox.rows = 5;
    saveBox.spellcheck = false;
    saveBox.value = '';

    const controls = document.createElement('div');
    controls.className = 'button-row';

    const upgradeBayButton = document.createElement('button');
    upgradeBayButton.className = 'secondary-button';
    upgradeBayButton.type = 'button';
    upgradeBayButton.textContent = 'Upgrade Bay';
    upgradeBayButton.addEventListener('click', this.onOpenUpgradeBay);

    const exportButton = document.createElement('button');
    exportButton.className = 'secondary-button';
    exportButton.type = 'button';
    exportButton.textContent = 'Export Save';
    exportButton.addEventListener('click', () => {
      saveBox.value = this.onExport();
      this.setStatus('Save exported.');
    });

    const importButton = document.createElement('button');
    importButton.className = 'secondary-button';
    importButton.type = 'button';
    importButton.textContent = 'Import Save';
    importButton.addEventListener('click', () => {
      const result = this.onImport(saveBox.value);
      this.statusText = result.message;

      if (result.ok) {
        this.enter();
      } else {
        this.setStatus(result.message);
      }
    });

    const resetButton = document.createElement('button');
    resetButton.className = 'secondary-button';
    resetButton.type = 'button';
    resetButton.textContent = 'Reset Save';
    resetButton.addEventListener('click', () => {
      this.onReset();
      this.statusText = 'Save reset.';
      this.enter();
    });

    const backButton = document.createElement('button');
    backButton.className = 'primary-button';
    backButton.type = 'button';
    backButton.textContent = 'Back';
    backButton.addEventListener('click', this.onBack);

    controls.append(upgradeBayButton, exportButton, importButton, resetButton, backButton);

    const status = document.createElement('p');
    status.className = 'boot-status';
    status.dataset.testid = 'save-status';
    status.textContent =
      this.statusText === 'Archive ready.' ? upgradeProgress.statusText : this.statusText;

    shell.append(eyebrow, title, stats, unlockGrid, saveBox, controls, status);
    this.uiRoot.replaceChildren(shell);
    backButton.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'back' || action === 'pause') {
      this.onBack();
    }
  }

  public getDebugState(): { seed: string; entityCount: number } {
    return { seed: 'n/a', entityCount: 0 };
  }

  private setStatus(message: string): void {
    this.statusText = message;
    const status = this.uiRoot.querySelector<HTMLElement>('[data-testid="save-status"]');

    if (status) {
      status.textContent = message;
    }
  }
}
