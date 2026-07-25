import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import { ACHIEVEMENTS } from '../content/achievements';
import { getItemById, type ItemSource } from '../content/items';
import { getUnlockById } from '../content/unlocks';
import type { SaveData, SaveUpdateResult } from '../core/saveData';
import { createActDebugState, createRunActSaveContext } from '../game/ActPlan';
import type { CombatRunResult } from '../game/CombatState';
import type { RunSkeleton, StartingContract } from '../game/Generation';
import type { InterActChoiceRecord } from '../game/InterActJunction';
import type { RouteHistoryEntry } from '../game/RunSession';
import type { AppliedRouteOutcome } from '../game/RouteEvents';
import type { ItemInstance } from '../game/Rewards';
import { getActiveFittedItems } from '../game/ItemSockets';
import { createEngineeringDebugState, type EngineeringState } from '../game/Foundry';
import { formatSecondActFinaleOutcome, getSecondActFinalePlan } from '../game/SecondActFinale';
import { getRunUpgradeDebugLabels } from '../game/UpgradeEffects';
import {
  createRunDebriefModel,
  formatDistanceSummary,
  getRunDebriefSectorsCleared,
  getOutcomeDetail,
  getOutcomeLabel,
  getSummaryTitle,
  type RunDebriefModel
} from '../game/RunDebrief';
import type { InputAction } from '../systems/InputSystem';
import {
  applyContractScreenTheme,
  createContractScreenThemeModel,
  createContractThemeDebugState,
  createContractThemeStrip,
  getContractThemeOptions
} from './ContractTheme';
import { appendItemCardContent } from './ItemCard';
import { createItemCardViewModel } from './ItemCardViewModel';
import { createRunSummaryProgressModel } from './RunSummaryProgress';

export { formatDistanceSummary, getOutcomeDetail, getOutcomeLabel, getSummaryTitle };

export class RunSummaryScene implements Scene {
  public readonly id = 'run-summary';

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly run: RunSkeleton,
    private readonly contract: StartingContract,
    private readonly result: CombatRunResult | null,
    private readonly currentSectorIndex: number,
    private readonly routeHistory: readonly RouteHistoryEntry[],
    private readonly interActChoices: readonly InterActChoiceRecord[],
    private readonly itemInstances: readonly ItemInstance[],
    private readonly engineering: EngineeringState,
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

    const progress = createRunSummaryProgressModel(this.saveData, this.saveUpdate);
    const model = createRunDebriefModel({
      run: this.run,
      contract: this.contract,
      result: this.result,
      currentSectorIndex: this.currentSectorIndex,
      routeHistory: this.routeHistory,
      interActChoices: this.interActChoices,
      itemInstances: this.itemInstances,
      engineering: this.engineering,
      saveUpdate: this.saveUpdate
    });

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
    unlockSummary.className = 'summary-note summary-callout summary-unlock-callout';
    unlockSummary.dataset.testid = 'unlock-summary';
    unlockSummary.textContent = this.getUnlockSummaryText();

    const archive = document.createElement('section');
    archive.className = 'summary-archive';
    archive.setAttribute('aria-labelledby', 'summary-archive-title');
    const archiveTitle = document.createElement('h2');
    archiveTitle.id = 'summary-archive-title';
    archiveTitle.textContent = 'Archive recovery';
    archive.append(archiveTitle, scrapBreakdown, upgradeCallout, unlockSummary);

    const body = document.createElement('div');
    body.className = 'summary-debrief-grid';
    const voyageColumn = document.createElement('div');
    voyageColumn.className = 'summary-debrief-column';
    voyageColumn.append(this.createBuildSummary(model), this.createRouteSummary(model));
    const detailColumn = document.createElement('div');
    detailColumn.className = 'summary-debrief-column';
    detailColumn.append(
      this.createItemSummaryGrid(model.items, model.omittedItemCount),
      this.createHighlightSummary(model)
    );
    body.append(voyageColumn, detailColumn);

    const footer = document.createElement('footer');
    footer.className = 'summary-footer';
    footer.append(seedShare, menuButton);

    shell.append(
      this.createSummaryHeader(model, theme),
      this.createMetricGrid(model),
      body,
      archive,
      footer
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
      getRunDebriefSectorsCleared(this.run, this.currentSectorIndex, this.routeHistory, this.result)
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
              actRouteNodeLabel: `${actContext.actSectorIndex}A`,
              actRouteLaneIndex: 0,
              actRouteDifficulty:
                actContext.actSectorIndex === (actContext.actSectorCount ?? act.routeDepth)
                  ? 'finale'
                  : 'standard',
              runSectorIndex: Math.min(
                this.run.sectors.length,
                getRunDebriefSectorsCleared(
                  this.run,
                  this.currentSectorIndex,
                  this.routeHistory,
                  this.result
                ) + 1
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
    return formatCompactUnlockSummary(this.saveUpdate);
  }

  private createSummaryHeader(
    model: RunDebriefModel,
    theme: ReturnType<typeof createContractScreenThemeModel>
  ): HTMLElement {
    const header = document.createElement('header');
    header.className = 'summary-header';

    const identity = document.createElement('div');
    identity.className = 'summary-header-identity';
    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = 'Run Debrief';
    const title = document.createElement('h1');
    title.id = 'summary-title';
    title.textContent = model.title;
    const themeStrip = createContractThemeStrip(this.uiRoot.ownerDocument, theme);
    identity.append(eyebrow, title, themeStrip);

    const outcome = document.createElement('div');
    outcome.className = 'summary-outcome';
    const outcomeLabel = document.createElement('p');
    outcomeLabel.className = 'summary-outcome-label';
    outcomeLabel.textContent = model.outcomeLabel;
    const outcomeDetail = document.createElement('p');
    outcomeDetail.className = 'summary-outcome-detail';
    outcomeDetail.textContent = model.outcomeDetail;
    const reached = document.createElement('p');
    reached.className = 'summary-reached';
    reached.textContent = `${model.reached} · ${model.actProgress}`;
    outcome.append(outcomeLabel, outcomeDetail, reached);

    header.append(identity, outcome);
    return header;
  }

  private createMetricGrid(model: RunDebriefModel): HTMLElement {
    const grid = document.createElement('section');
    grid.className = 'summary-metric-grid';
    grid.dataset.testid = 'summary-metrics';
    grid.setAttribute('aria-label', 'Run totals');

    for (const metric of model.metrics) {
      const card = document.createElement('div');
      card.className = 'summary-metric';
      const label = document.createElement('span');
      label.textContent = metric.label;
      const value = document.createElement('strong');
      value.textContent = metric.value;
      card.append(label, value);
      grid.append(card);
    }

    return grid;
  }

  private createBuildSummary(model: RunDebriefModel): HTMLElement {
    const card = createSummaryCard('Final ship', 'summary-final-build');
    const title = document.createElement('h3');
    title.className = 'summary-build-name';
    title.textContent = model.ship.name;

    const stats = document.createElement('dl');
    stats.className = 'summary-stats summary-build-stats';
    appendSummaryStat(stats, 'Frame', model.ship.frame);
    appendSummaryStat(stats, 'Modules', model.ship.modules);
    appendSummaryStat(stats, 'Grid', model.ship.engineering);
    appendSummaryStat(stats, 'Power', model.ship.powerGrid);

    const circuit = document.createElement('div');
    circuit.className = 'summary-circuit';
    const circuitLabel = document.createElement('span');
    circuitLabel.textContent = 'Circuit identity';
    const circuitTitle = document.createElement('strong');
    circuitTitle.textContent = model.ship.circuitTitle;
    const circuitDetail = document.createElement('p');
    circuitDetail.textContent = model.ship.circuitDetail;
    circuit.append(circuitLabel, circuitTitle, circuitDetail);

    card.append(title, stats, circuit);
    return card;
  }

  private createRouteSummary(model: RunDebriefModel): HTMLElement {
    const card = createSummaryCard('Flight path', 'summary-flight-path');
    const routes = document.createElement('div');
    routes.className = 'summary-route-acts';

    if (model.routeActs.length === 0) {
      const note = document.createElement('p');
      note.className = 'summary-note';
      note.textContent = 'No route nodes recorded.';
      routes.append(note);
    } else {
      for (const act of model.routeActs) {
        const row = document.createElement('div');
        row.className = 'summary-route-act';
        const label = document.createElement('strong');
        label.textContent = act.actLabel;
        const nodes = document.createElement('div');
        nodes.className = 'summary-route-nodes';
        for (const nodeLabel of act.nodeLabels) {
          const node = document.createElement('span');
          node.textContent = nodeLabel;
          nodes.append(node);
        }
        row.append(label, nodes);
        routes.append(row);
      }
    }

    card.append(routes);
    return card;
  }

  private createHighlightSummary(model: RunDebriefModel): HTMLElement {
    const card = createSummaryCard('Defining turns', 'summary-highlight-list');
    const list = document.createElement('ol');
    list.className = 'summary-highlight-list';

    if (model.highlights.length === 0) {
      const note = document.createElement('p');
      note.className = 'summary-note';
      note.textContent = 'No major turn was recorded before closeout.';
      card.append(note);
      return card;
    }

    for (const highlight of model.highlights) {
      const item = document.createElement('li');
      const kicker = document.createElement('span');
      kicker.textContent = highlight.kicker;
      const title = document.createElement('strong');
      title.textContent = highlight.title;
      const detail = document.createElement('p');
      detail.textContent = highlight.detail;
      item.append(kicker, title, detail);
      list.append(item);
    }

    card.append(list);
    return card;
  }

  private createItemSummaryGrid(
    itemInstances: readonly ItemInstance[],
    omittedItemCount: number
  ): HTMLElement {
    const wrapper = document.createElement('section');
    wrapper.className = 'summary-card summary-item-section';
    wrapper.dataset.testid = 'summary-item-list';
    wrapper.setAttribute('aria-labelledby', 'summary-items-title');
    const heading = document.createElement('h2');
    heading.id = 'summary-items-title';
    heading.textContent = 'Defining upgrades';
    wrapper.append(heading);

    if (itemInstances.length === 0) {
      const note = document.createElement('p');
      note.className = 'summary-note';
      note.textContent = 'No upgrades were recovered.';
      wrapper.append(note);
      return wrapper;
    }

    const grid = document.createElement('div');
    grid.className = 'summary-item-grid';
    const circuitPositions = new Map(
      getActiveFittedItems(this.itemInstances, this.engineering.committed).map(
        (instance, index) => [instance.acquisitionOrder, index + 1]
      )
    );

    for (const instance of itemInstances) {
      const card = document.createElement('article');
      card.className = 'summary-item-card';
      appendItemCardContent(
        card,
        createItemCardViewModel(getItemById(instance.itemId), {
          sourceLabel: circuitPositions.has(instance.acquisitionOrder)
            ? `Circuit ${circuitPositions.get(instance.acquisitionOrder)}`
            : 'Upgrade rack',
          acquisitionOrder: instance.acquisitionOrder
        }),
        { compact: true, includeEffect: false }
      );
      grid.append(card);
    }

    wrapper.append(grid);
    if (omittedItemCount > 0) {
      const remainder = document.createElement('p');
      remainder.className = 'summary-item-remainder';
      remainder.textContent = `+${omittedItemCount} more upgrade${omittedItemCount === 1 ? '' : 's'} carried in the rack.`;
      wrapper.append(remainder);
    }
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
    input.className = 'seed-share-input sr-only';
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
    status.textContent = `Seed ${this.run.seed}`;

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

function createSummaryCard(titleText: string, testId: string): HTMLElement {
  const card = document.createElement('section');
  card.className = 'summary-card';
  card.dataset.testid = testId;
  const title = document.createElement('h2');
  title.textContent = titleText;
  card.append(title);
  return card;
}

function appendSummaryStat(stats: HTMLDListElement, labelText: string, valueText: string): void {
  const label = document.createElement('dt');
  label.textContent = labelText;
  const value = document.createElement('dd');
  value.textContent = valueText;
  stats.append(label, value);
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

export function formatCompactUnlockSummary(saveUpdate: SaveUpdateResult | null): string {
  if (!saveUpdate) return 'Archive unchanged.';
  if (saveUpdate.newUnlockIds.length === 0) {
    return `Archive banked ${saveUpdate.salvageEarned} kg. No new unlocks.`;
  }

  const visibleNames = saveUpdate.newUnlockIds
    .slice(0, 2)
    .map((unlockId) => getUnlockById(unlockId).name);
  const remainder = saveUpdate.newUnlockIds.length - visibleNames.length;
  return `Unlocked ${saveUpdate.newUnlockIds.length}: ${visibleNames.join(', ')}${
    remainder > 0 ? ` +${remainder} more` : ''
  }.`;
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
    const rewardBiases = [
      ...new Set(outcomes.flatMap((outcome) => outcome.effects.reward.biasTags))
    ];

    return `${act.shortLabel}: ${outcomes.length} routes, ${formatSignedCredits(
      credits
    )}/${formatSignedSalvage(salvage)}, +${cashOut} cash-out, ${
      rewardBiases.length > 0 ? rewardBiases.join('/') : 'standard'
    } reward bias`;
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
  const junctionRewardBiases = [
    ...new Set(interActChoices.flatMap((choice) => choice.effects.rewardBiasTags))
  ];
  const junctionPart =
    interActChoices.length > 0
      ? `Junction: ${formatSignedCredits(junctionCredits)}/${formatSignedSalvage(
          junctionSalvage
        )}, ${junctionShopDiscount > 0 ? `-${junctionShopDiscount}` : '+0'} shop, ${
          junctionRewardBiases.length > 0 ? junctionRewardBiases.join('/') : 'standard'
        } reward bias`
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
    case 'apex':
      return 'apex';
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
