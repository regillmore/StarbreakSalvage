import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import { ACHIEVEMENTS } from '../content/achievements';
import { getUnlockById } from '../content/unlocks';
import type { SaveData, SaveUpdateResult } from '../core/saveData';
import type { CombatRunResult } from '../game/CombatState';
import type { RunSkeleton, StartingContract } from '../game/Generation';
import type { RouteHistoryEntry } from '../game/RunSession';
import type { AppliedRouteOutcome } from '../game/RouteEvents';
import { formatSectorConditionTimeline } from '../game/SectorConditions';
import { formatRunUpgradeEffects, getRunUpgradeDebugLabels } from '../game/UpgradeEffects';
import type { InputAction } from '../systems/InputSystem';
import {
  applyContractScreenTheme,
  createContractScreenThemeModel,
  createContractThemeDebugState,
  createContractThemeStrip,
  formatContractThemeSummary,
  getContractThemeOptions
} from './ContractTheme';

export class RunSummaryScene implements Scene {
  public readonly id = 'run-summary';

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly run: RunSkeleton,
    private readonly contract: StartingContract,
    private readonly result: CombatRunResult | null,
    private readonly routeHistory: readonly RouteHistoryEntry[],
    private readonly routeOutcomes: readonly AppliedRouteOutcome[],
    private readonly saveData: SaveData,
    private readonly saveUpdate: SaveUpdateResult | null,
    private readonly onBackToMenu: () => void
  ) {}

  public enter(): void {
    const shell = document.createElement('main');
    shell.className = 'scene-panel summary-panel';
    shell.setAttribute('aria-labelledby', 'summary-title');
    const theme = createContractScreenThemeModel(
      this.contract,
      getContractThemeOptions(this.uiRoot.ownerDocument)
    );
    applyContractScreenTheme(shell, theme);

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = 'Run Summary';

    const title = document.createElement('h1');
    title.id = 'summary-title';
    title.textContent = getSummaryTitle(this.result);

    const stats = document.createElement('dl');
    stats.className = 'summary-stats';

    const statEntries: ReadonlyArray<readonly [string, string]> = [
      ['Seed', this.run.seed],
      ['Contract', this.contract.shipName],
      ['Ship Theme', formatContractThemeSummary(this.contract)],
      ['Reached', getReachedSectorName(this.run, this.routeHistory, this.result)],
      ['Outcome', getOutcomeLabel(this.result)],
      ['Win/Loss', getOutcomeDetail(this.result)],
      ['Survived', `${Math.floor(this.result?.survivedSeconds ?? 0)}s`],
      ['Distance', formatDistanceSummary(this.result)],
      ['Sectors Cleared', `${getSectorsCleared(this.run, this.routeHistory, this.result)}`],
      ['Destroyed', `${this.result?.enemiesDestroyed ?? 0}`],
      ['Bosses', `${this.result?.bossesDefeated ?? 0}`],
      ['Credits', `${this.result?.credits ?? 0}`],
      ['Salvage', `${this.result?.salvage ?? 0} kg`],
      ['Damage Taken', `${this.result?.damageTaken ?? 0}`],
      ['Item Hooks', `${this.result?.itemTriggers ?? 0}`],
      ['Routes', formatRouteHistory(this.routeHistory)],
      ['Sector Conditions', formatSectorConditionTimeline(this.run, this.routeOutcomes)],
      ['Upgrade Effects', formatRunUpgradeEffects(this.run.upgradeEffects)],
      ['Banked Salvage', `${this.saveData.salvageBank} kg`],
      ['Items', this.result?.itemNames.join(', ') ?? 'none'],
      ['Unlock Reasons', formatUnlockReasons(this.saveUpdate)]
    ];

    for (const [label, value] of statEntries) {
      const term = document.createElement('dt');
      term.textContent = label;

      const detail = document.createElement('dd');
      detail.textContent = value;

      stats.append(term, detail);
    }

    const seedShare = this.createSeedShareControl();

    const menuButton = document.createElement('button');
    menuButton.className = 'primary-button';
    menuButton.type = 'button';
    menuButton.textContent = 'Back to Menu';
    menuButton.addEventListener('click', this.onBackToMenu);

    const unlockSummary = document.createElement('p');
    unlockSummary.className = 'summary-note';
    unlockSummary.dataset.testid = 'unlock-summary';
    unlockSummary.textContent = this.getUnlockSummaryText();

    shell.append(
      eyebrow,
      createContractThemeStrip(this.uiRoot.ownerDocument, theme),
      title,
      stats,
      seedShare,
      unlockSummary,
      menuButton
    );
    this.uiRoot.replaceChildren(shell);
    menuButton.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'confirm' || action === 'back') {
      this.onBackToMenu();
    }
  }

  public getDebugState(): SceneDebugState {
    return {
      seed: this.run.seed,
      entityCount: 0,
      contractTheme: createContractThemeDebugState(this.contract),
      upgradeEffects: getRunUpgradeDebugLabels(this.run.upgradeEffects)
    };
  }

  private getUnlockSummaryText(): string {
    return formatUnlockSummary(this.saveUpdate);
  }

  private createSeedShareControl(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'seed-share';

    const label = document.createElement('label');
    label.className = 'sr-only';
    label.htmlFor = 'seed-share-link';
    label.textContent = 'Shareable seed link';

    const input = document.createElement('input');
    input.id = 'seed-share-link';
    input.className = 'seed-share-input';
    input.dataset.testid = 'seed-share-link';
    input.readOnly = true;
    input.value = buildSeedShareUrl(this.getCurrentHref(), this.run.seed);

    const copyButton = document.createElement('button');
    copyButton.className = 'secondary-button';
    copyButton.type = 'button';
    copyButton.textContent = 'Copy Seed Link';

    const status = document.createElement('p');
    status.className = 'summary-note seed-share-status';
    status.dataset.testid = 'seed-share-status';
    status.textContent = 'Seed link ready.';

    copyButton.addEventListener('click', () => {
      input.select();
      void writeSeedLinkToClipboard(input.value, this.uiRoot.ownerDocument.defaultView).then(
        (copied) => {
          status.textContent = copied ? 'Seed link copied.' : 'Seed link ready.';
        }
      );
    });

    wrapper.append(label, input, copyButton, status);
    return wrapper;
  }

  private getCurrentHref(): string {
    return this.uiRoot.ownerDocument.defaultView?.location.href ?? '';
  }
}

export function formatUnlockSummary(saveUpdate: SaveUpdateResult | null): string {
  if (!saveUpdate) {
    return 'Archive unchanged.';
  }

  const reasons = formatUnlockReasons(saveUpdate);

  if (saveUpdate.newUnlockIds.length === 0) {
    return `Recovered ${saveUpdate.salvageEarned} kg for the archive. ${reasons}`;
  }

  const names = saveUpdate.newUnlockIds.map((unlockId) => getUnlockById(unlockId).name);
  return `Unlocked: ${names.join(', ')}. ${reasons}`;
}

export function buildSeedShareUrl(currentHref: string, seed: string): string {
  try {
    const url = new URL(currentHref);
    url.searchParams.delete('debug');
    url.searchParams.set('seed', seed);
    url.hash = '';
    return url.href;
  } catch {
    return `?seed=${encodeURIComponent(seed)}`;
  }
}

async function writeSeedLinkToClipboard(
  value: string,
  ownerWindow: Window | null
): Promise<boolean> {
  const clipboard = ownerWindow?.navigator.clipboard;

  if (!clipboard) {
    return false;
  }

  try {
    await clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function getSummaryTitle(result: CombatRunResult | null): string {
  if (result?.reason === 'destroyed') {
    return 'Ship Destroyed';
  }

  if (result?.reason === 'debug') {
    return 'Debug Run Ended';
  }

  if (result?.reason === 'victory') {
    return 'Victory Confirmed';
  }

  if (result?.reason === 'sectorComplete') {
    return 'Contract Complete';
  }

  return 'Contract Suspended';
}

export function getOutcomeLabel(result: CombatRunResult | null): string {
  if (!result) {
    return 'pending';
  }

  if (result.reason === 'destroyed') {
    return 'permadeath';
  }

  if (result.reason === 'debug') {
    return 'forced test';
  }

  if (result.reason === 'victory') {
    return 'final boss salvaged';
  }

  if (result.reason === 'sectorComplete') {
    return 'sector survived';
  }

  return 'abandoned';
}

export function getOutcomeDetail(result: CombatRunResult | null): string {
  if (!result) {
    return 'Run pending.';
  }

  if (result.reason === 'victory') {
    return 'Win: final boss salvaged.';
  }

  if (result.reason === 'destroyed') {
    return 'Loss: ship destroyed and contract closed.';
  }

  if (result.reason === 'debug') {
    return 'Debug: forced test summary.';
  }

  if (result.reason === 'sectorComplete') {
    return 'Sector cleared: route selected for the next leg.';
  }

  return 'Abandoned: pilot exited before resolution.';
}

export function formatRouteHistory(routeHistory: readonly RouteHistoryEntry[]): string {
  if (routeHistory.length === 0) {
    return 'none';
  }

  return routeHistory
    .map((entry) => `S${entry.sectorIndex} ${entry.routeLabel}: ${entry.outcomeTitle ?? 'routed'}`)
    .join(' | ');
}

export function formatDistanceSummary(result: CombatRunResult | null): string {
  if (!result) {
    return '0u';
  }

  const distance = Math.floor(Math.max(0, result.distanceTraveled));
  const sectorLength =
    result.sectorLength === null ? null : Math.floor(Math.max(0, result.sectorLength));

  if (!sectorLength) {
    return `${distance}u`;
  }

  return `${distance}/${sectorLength}u`;
}

export function formatUnlockReasons(saveUpdate: SaveUpdateResult | null): string {
  if (!saveUpdate || saveUpdate.newAchievementIds.length === 0) {
    return 'No new archive trigger.';
  }

  return saveUpdate.newAchievementIds
    .map((achievementId) => {
      const achievement = ACHIEVEMENTS.find((candidate) => candidate.id === achievementId);
      return achievement
        ? `${achievement.name}: ${achievement.summary}`
        : `${achievementId}: archive trigger`;
    })
    .join(' | ');
}

function getReachedSectorName(
  run: RunSkeleton,
  routeHistory: readonly RouteHistoryEntry[],
  result: CombatRunResult | null
): string {
  const index = Math.min(getSectorsCleared(run, routeHistory, result), run.sectors.length - 1);
  return run.sectors[index]?.sectorName ?? 'Outer Debris Field';
}

function getSectorsCleared(
  run: RunSkeleton,
  routeHistory: readonly RouteHistoryEntry[],
  result: CombatRunResult | null
): number {
  if (result?.reason === 'victory') {
    return run.sectors.length;
  }

  if (result?.reason === 'sectorComplete') {
    return Math.min(run.sectors.length, routeHistory.length + 1);
  }

  return Math.min(run.sectors.length, routeHistory.length);
}
