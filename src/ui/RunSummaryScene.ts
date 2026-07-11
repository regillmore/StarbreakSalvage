import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import { ACHIEVEMENTS } from '../content/achievements';
import { getItemById, type ItemSource } from '../content/items';
import { getUnlockById } from '../content/unlocks';
import type { SaveData, SaveUpdateResult } from '../core/saveData';
import {
  createActDebugState,
  createRunActSaveContext,
  formatRunActTimeline
} from '../game/ActPlan';
import { createBuildSynergyModel, formatBuildSynergySummary } from '../game/BuildSynergy';
import type { CombatRunResult } from '../game/CombatState';
import type { RunSkeleton, StartingContract } from '../game/Generation';
import {
  createExpeditionPathReadModel,
  formatExpeditionCapacity,
  type ExpeditionProgressState
} from '../game/ExpeditionGraph';
import { formatInterActHistory, type InterActChoiceRecord } from '../game/InterActJunction';
import type { RouteHistoryEntry } from '../game/RunSession';
import type { AppliedRouteOutcome } from '../game/RouteEvents';
import type { ItemInstance } from '../game/Rewards';
import {
  createEngineeringDebugState,
  formatEngineeringHistory,
  resolveEngineeringSnapshot,
  type EngineeringState
} from '../game/Foundry';
import { formatSectorConditionTimeline } from '../game/SectorConditions';
import { formatHazardZoneDirectorTimeline } from '../game/HazardZoneDirector';
import { formatSectorPacingTimeline } from '../game/SectorPacing';
import { formatSecondActFinaleOutcome, getSecondActFinalePlan } from '../game/SecondActFinale';
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
import { appendItemCardContent } from './ItemCard';
import { createItemCardViewModel } from './ItemCardViewModel';
import { createRunSummaryProgressModel } from './RunSummaryProgress';
import { formatFactionCampaignSummary, type FactionCampaignState } from '../game/FactionCampaign';

export class RunSummaryScene implements Scene {
  public readonly id = 'run-summary';

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly run: RunSkeleton,
    private readonly contract: StartingContract,
    private readonly result: CombatRunResult | null,
    private readonly routeHistory: readonly RouteHistoryEntry[],
    private readonly routeOutcomes: readonly AppliedRouteOutcome[],
    private readonly interActChoices: readonly InterActChoiceRecord[],
    private readonly expeditionProgress: ExpeditionProgressState,
    private readonly itemInstances: readonly ItemInstance[],
    private readonly engineering: EngineeringState,
    private readonly saveData: SaveData,
    private readonly saveUpdate: SaveUpdateResult | null,
    private readonly onBackToMenu: () => void,
    private readonly missionTimeline: string | null = null,
    private readonly objectiveHistory: string | null = null,
    private readonly factionCampaign: FactionCampaignState | null = null
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

    const progress = createRunSummaryProgressModel(this.saveData, this.saveUpdate);
    const expedition = createExpeditionPathReadModel(this.run.expedition, this.expeditionProgress);
    const finalEngineering = resolveEngineeringSnapshot(this.engineering.committed);

    const stats = document.createElement('dl');
    stats.className = 'summary-stats';

    const statEntries: ReadonlyArray<readonly [string, string]> = [
      ['Seed', this.run.seed],
      ['Contract', this.contract.shipName],
      ['Frame', this.contract.loadout.summary.frame],
      ['Starting Modules', this.contract.loadout.summary.modules],
      ['Final Ship', finalEngineering.summary],
      ['Final Modules', finalEngineering.loadout?.summary.modules ?? 'Invalid final loadout'],
      ['Engineering History', formatEngineeringHistory(this.engineering.history)],
      ['Power Grid', this.contract.loadout.summary.powerGrid],
      ['Frame Systems', this.contract.loadout.summary.frameStats],
      ['Ship Theme', formatContractThemeSummary(this.contract)],
      ['Reached', getReachedSectorName(this.run, this.routeHistory, this.result)],
      ['Act Progress', formatActProgressSummary(this.run, this.routeHistory, this.result)],
      ['Outcome', getOutcomeLabel(this.result)],
      ['Win/Loss', getOutcomeDetail(this.result)],
      ['Finale', formatFinaleOutcomeSummary(this.run, this.result)],
      ['Survived', `${Math.floor(this.result?.survivedSeconds ?? 0)}s`],
      ['Distance', formatDistanceSummary(this.result)],
      ['Sectors Cleared', `${getSectorsCleared(this.run, this.routeHistory, this.result)}`],
      ['Destroyed', `${this.result?.enemiesDestroyed ?? 0}`],
      ['Bosses', `${this.result?.bossesDefeated ?? 0}`],
      [
        'Set Piece',
        this.result?.setPiece
          ? `${this.result.setPiece.name} | ${this.result.setPiece.completed ? 'neutralized' : 'incomplete'} | components ${this.result.setPiece.destroyedComponents}/${this.result.setPiece.totalComponents} | stages ${this.result.setPiece.stagesCompleted}`
          : 'No set-piece contract in final sector'
      ],
      ['Credits', `${this.result?.credits ?? 0}`],
      ['Salvage', `${this.result?.salvage ?? 0} kg`],
      ['Damage Taken', `${this.result?.damageTaken ?? 0}`],
      ['Item Hooks', `${this.result?.itemTriggers ?? 0}`],
      ['Routes', formatRouteHistory(this.routeHistory)],
      ['Act Route', formatActRouteHistory(this.routeHistory)],
      ['Act Timeline', formatRunActTimeline(this.run.acts)],
      ['Expedition Path', expedition.summary],
      ['Mission Timeline', this.missionTimeline ?? 'Legacy single-stage run'],
      ['Objective History', this.objectiveHistory ?? 'No objective outcomes recorded.'],
      [
        'Faction Campaign',
        this.factionCampaign
          ? formatFactionCampaignSummary(this.run.factionCampaign, this.factionCampaign)
          : 'No run-local faction campaign recorded.'
      ],
      ['Expedition Capacity', formatExpeditionCapacity(this.run.expedition.capacity)],
      ['Inter-Act Refit', formatInterActHistory(this.interActChoices)],
      [
        'Economy By Act',
        formatRunEconomyBreakdown(this.run, this.routeOutcomes, this.interActChoices, this.result)
      ],
      ['Sector Conditions', formatSectorConditionTimeline(this.run, this.routeOutcomes)],
      ['Sector Pacing', formatSectorPacingTimeline(this.run, this.routeOutcomes)],
      ['Hazard Zones', formatHazardZoneDirectorTimeline(this.run, this.routeOutcomes)],
      ['Upgrade Effects', formatRunUpgradeEffects(this.run.upgradeEffects)],
      ['Scrap Flow', progress.scrapBreakdownText],
      ['Upgrade Economy', progress.economyScopeText],
      ['Upgrade Outlook', progress.upgradeProgressText],
      ['Banked Salvage', `${this.saveData.salvageBank} kg`],
      ['Build Identity', formatBuildSynergySummary(createBuildSynergyModel(this.itemInstances))],
      ['Item Sources', formatItemSourceSummary(this.itemInstances)],
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

    const scrapBreakdown = document.createElement('p');
    scrapBreakdown.className = 'summary-note summary-callout';
    scrapBreakdown.dataset.testid = 'scrap-breakdown';
    scrapBreakdown.textContent = progress.scrapBreakdownText;

    const upgradeCallout = document.createElement('p');
    upgradeCallout.className = 'summary-note summary-callout upgrade-progress-callout';
    upgradeCallout.dataset.testid = 'upgrade-progress-callout';
    upgradeCallout.dataset.calloutKind = progress.calloutKind;
    upgradeCallout.setAttribute('aria-live', 'polite');
    upgradeCallout.textContent = progress.calloutText;

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
      this.createItemSummaryGrid(),
      scrapBreakdown,
      upgradeCallout,
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
    const actContext = createRunActSaveContext(
      this.run.acts,
      getSectorsCleared(this.run, this.routeHistory, this.result)
    );
    const act = this.run.acts.find((candidate) => candidate.id === actContext.actId);

    return {
      seed: this.run.seed,
      entityCount: 0,
      act:
        act && actContext.actId && actContext.actName && actContext.actShortLabel
          ? createActDebugState({
              actId: actContext.actId,
              actName: actContext.actName,
              actShortLabel: actContext.actShortLabel,
              actSummary: act.summary,
              actIndex: actContext.actIndex,
              actSectorIndex: actContext.actSectorIndex,
              actSectorCount: actContext.actSectorCount ?? act.sectorCount,
              runSectorIndex: Math.min(
                this.run.sectors.length,
                getSectorsCleared(this.run, this.routeHistory, this.result) + 1
              ),
              routeGrammar: act.routeGrammar,
              rewardTier: act.rewardTier,
              pressureTier: act.pressureTier,
              bossGate: act.bossGate,
              transition: act.transition
            })
          : undefined,
      contractTheme: createContractThemeDebugState(this.contract),
      shipLoadout: this.contract.loadout.debug,
      engineering: createEngineeringDebugState(this.engineering),
      upgradeEffects: getRunUpgradeDebugLabels(this.run.upgradeEffects)
    };
  }

  private getUnlockSummaryText(): string {
    return formatUnlockSummary(this.saveUpdate);
  }

  private createItemSummaryGrid(): HTMLElement {
    const wrapper = document.createElement('section');
    wrapper.className = 'summary-item-section';
    wrapper.dataset.testid = 'summary-item-list';
    wrapper.setAttribute('aria-label', 'Run item cards');

    if (this.itemInstances.length === 0) {
      const note = document.createElement('p');
      note.className = 'summary-note';
      note.textContent = 'No item cards recorded.';
      wrapper.append(note);
      return wrapper;
    }

    const grid = document.createElement('div');
    grid.className = 'summary-item-grid';

    for (const instance of this.itemInstances) {
      const card = document.createElement('article');
      card.className = 'summary-item-card';
      appendItemCardContent(
        card,
        createItemCardViewModel(getItemById(instance.itemId), {
          sourceLabel: 'Run item',
          acquisitionOrder: instance.acquisitionOrder
        }),
        { compact: true, includeEffect: false, includeSynergy: false }
      );
      grid.append(card);
    }

    wrapper.append(grid);
    return wrapper;
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

export function formatActRouteHistory(routeHistory: readonly RouteHistoryEntry[]): string {
  if (routeHistory.length === 0) {
    return 'none';
  }

  return routeHistory
    .map((entry) => {
      const actLabel =
        entry.actShortLabel && entry.actSectorIndex && entry.actSectorCount
          ? `${entry.actShortLabel} ${entry.actSectorIndex}/${entry.actSectorCount}`
          : 'Act ?';
      const routeTags =
        entry.routeTags && entry.routeTags.length > 0 ? ` [${entry.routeTags.join('/')}]` : '';

      return `${actLabel} S${entry.sectorIndex} ${entry.routeLabel}: ${
        entry.outcomeTitle ?? 'routed'
      }${routeTags}`;
    })
    .join(' | ');
}

export function formatRunEconomyBreakdown(
  run: RunSkeleton,
  routeOutcomes: readonly AppliedRouteOutcome[],
  interActChoices: readonly InterActChoiceRecord[],
  result: CombatRunResult | null
): string {
  const actParts = run.acts.map((act) => {
    const outcomes = routeOutcomes.filter(
      (outcome) =>
        outcome.sectorIndex >= act.startSectorIndex && outcome.sectorIndex <= act.endSectorIndex
    );
    const credits = outcomes.reduce((total, outcome) => total + outcome.effects.creditsDelta, 0);
    const salvage = outcomes.reduce((total, outcome) => total + outcome.effects.salvageDelta, 0);
    const cashOut = outcomes.reduce(
      (total, outcome) => total + outcome.effects.reward.creditBonus,
      0
    );
    const choices = outcomes.reduce(
      (total, outcome) => total + outcome.effects.reward.choiceBonus,
      0
    );

    return `${act.shortLabel}: ${outcomes.length} routes, ${formatSignedCredits(
      credits
    )}/${formatSignedSalvage(salvage)}, +${cashOut} cash-out, +${choices} choices`;
  });
  const junctionCredits = interActChoices.reduce(
    (total, choice) => total + choice.effects.creditsDelta,
    0
  );
  const junctionSalvage = interActChoices.reduce(
    (total, choice) => total + choice.effects.salvageDelta,
    0
  );
  const junctionShopDiscount = interActChoices.reduce(
    (total, choice) => total + choice.effects.shopDiscount,
    0
  );
  const junctionRewardChoices = interActChoices.reduce(
    (total, choice) => total + choice.effects.rewardChoiceBonus,
    0
  );
  const junctionPart =
    interActChoices.length > 0
      ? `Junction: ${formatSignedCredits(junctionCredits)}/${formatSignedSalvage(
          junctionSalvage
        )}, ${junctionShopDiscount > 0 ? `-${junctionShopDiscount}` : '+0'} shop, +${
          junctionRewardChoices
        } choices`
      : 'Junction: none';
  const recovered = result
    ? `Recovered: ${result.credits} credits/${result.salvage} kg`
    : 'Recovered: pending';

  return [...actParts, junctionPart, recovered].join(' | ');
}

export function formatFinaleOutcomeSummary(
  run: RunSkeleton,
  result: CombatRunResult | null
): string {
  return formatSecondActFinaleOutcome(getSecondActFinalePlan(run), result?.reason);
}

export function formatItemSourceSummary(itemInstances: readonly ItemInstance[]): string {
  if (itemInstances.length === 0) {
    return 'none';
  }

  const counts = new Map<ItemSource, number>();

  for (const instance of itemInstances) {
    const item = getItemById(instance.itemId);
    const source = getPrimaryItemSource(item.metadata.sources);
    counts.set(source, (counts.get(source) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([source, count]) => `${formatItemSourceLabel(source)} ${count}`)
    .join(', ');
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

function formatSignedCredits(value: number): string {
  return `${value >= 0 ? '+' : ''}${value}c`;
}

function formatSignedSalvage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value}kg`;
}

function getPrimaryItemSource(sources: readonly ItemSource[]): ItemSource {
  return (
    sources.find((source) => source !== 'combat' && source !== 'starter') ?? sources[0] ?? 'combat'
  );
}

function formatItemSourceLabel(source: ItemSource): string {
  switch (source) {
    case 'starter':
      return 'starter';
    case 'combat':
      return 'combat';
    case 'shop':
      return 'shop';
    case 'vault':
      return 'vault';
    case 'elite':
      return 'elite';
    case 'boss':
      return 'boss';
    case 'faction':
      return 'faction';
    case 'lunar':
      return 'lunar';
    case 'route':
      return 'route';
    case 'unlock':
      return 'unlock';
  }
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

function formatActProgressSummary(
  run: RunSkeleton,
  routeHistory: readonly RouteHistoryEntry[],
  result: CombatRunResult | null
): string {
  const actContext = createRunActSaveContext(
    run.acts,
    getSectorsCleared(run, routeHistory, result)
  );

  if (!actContext.actId || !actContext.actName || !actContext.actShortLabel) {
    return 'Act progress unavailable';
  }

  return `${actContext.actShortLabel} ${actContext.actName} ${actContext.actSectorIndex}/${
    actContext.actSectorCount ?? '?'
  } | ${actContext.actsCompleted}/${run.acts.length} acts secured`;
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
