import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import { getItemById } from '../content/items';
import {
  createApexCampaignReadModel,
  createApexDebugState,
  type ApexHuntPlan,
  type ApexHuntState,
  type ApexThreatReadModel
} from '../game/ApexHunt';
import type { InputAction } from '../systems/InputSystem';
import { createApexGlyph } from './ApexGlyph';

export class ApexDossierScene implements Scene {
  public readonly id = 'apex-dossier';
  private selectedThreatId: string;

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly plan: ApexHuntPlan,
    private readonly state: ApexHuntState,
    private readonly sectorIndex: number,
    private readonly onBack: () => void
  ) {
    const current = plan.threats.find(
      (threat) =>
        sectorIndex >= threat.pursuit.actStartSectorIndex &&
        sectorIndex <= threat.pursuit.actEndSectorIndex
    );
    this.selectedThreatId =
      current?.definitionId ??
      state.threats.find((threat) => threat.status !== 'untracked')?.threatId ??
      plan.threats[0]?.definitionId ??
      '';
  }

  public enter(): void {
    this.renderBoard();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'confirm') {
      const focused = this.uiRoot.ownerDocument.activeElement;
      if (focused instanceof HTMLButtonElement) focused.click();
    } else if (action === 'back' || action === 'pause') {
      this.onBack();
    }
  }

  public getDebugState(): SceneDebugState {
    return {
      seed: this.plan.seed,
      entityCount: 0,
      apex: createApexDebugState(this.plan, this.state)
    };
  }

  private renderBoard(focusTile = false): void {
    const document = this.uiRoot.ownerDocument;
    const model = createApexCampaignReadModel(this.plan, this.state, this.sectorIndex);
    const selected =
      model.threats.find((threat) => threat.id === this.selectedThreatId) ?? model.threats[0];
    if (!selected) throw new Error('Apex bounty board requires at least one threat.');
    this.selectedThreatId = selected.id;

    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide apex-dossier-panel apex-bounty-board';
    shell.dataset.testid = 'apex-dossier';
    shell.setAttribute('aria-labelledby', 'apex-title');

    const header = document.createElement('header');
    header.className = 'apex-bounty-header';
    const masthead = document.createElement('div');
    masthead.className = 'apex-dossier-masthead';
    masthead.dataset.testid = 'apex-dossier-masthead';
    const mastheadGlyph = createApexGlyph(document);
    mastheadGlyph.classList.add('apex-glyph-masthead');
    mastheadGlyph.dataset.apexSurface = 'dossier-masthead';
    const copy = document.createElement('div');
    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = 'SIGNAL VAULT // THREE SEEDED BOUNTIES';
    const title = document.createElement('h1');
    title.id = 'apex-title';
    title.textContent = 'Apex Bounties';
    const summary = document.createElement('p');
    summary.className = 'apex-campaign-summary';
    summary.textContent = `${model.summary}. Follow every marked signal in an act, destroy the apex at layer four, and claim one of its circuit spoils.`;
    copy.append(eyebrow, title, summary);
    masthead.append(mastheadGlyph, copy);
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'secondary-button apex-bounty-back';
    back.textContent = 'Back';
    back.addEventListener('click', this.onBack);
    header.append(masthead, back);

    const tiles = document.createElement('nav');
    tiles.className = 'apex-bounty-tiles';
    tiles.dataset.testid = 'apex-bounty-tiles';
    tiles.setAttribute('aria-label', 'Apex bounty targets');
    for (const [index, threat] of model.threats.entries()) {
      tiles.append(this.createBountyTile(document, threat, index));
    }

    const layout = document.createElement('section');
    layout.className = 'apex-bounty-layout';
    layout.append(
      this.createTargetVisual(document, selected),
      this.createBountyDetails(document, selected)
    );

    shell.append(header, tiles, layout);
    this.uiRoot.replaceChildren(shell);
    const focusTarget = focusTile
      ? shell.querySelector<HTMLButtonElement>(
          `[data-testid="apex-threat-${this.selectedThreatId}"]`
        )
      : back;
    focusTarget?.focus();
  }

  private createBountyTile(
    document: Document,
    threat: ApexThreatReadModel,
    index: number
  ): HTMLButtonElement {
    const completed = countResolvedContacts(threat);
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'apex-bounty-tile';
    tile.dataset.testid = `apex-threat-${threat.id}`;
    tile.dataset.selected = String(threat.id === this.selectedThreatId);
    tile.dataset.status = threat.status;
    tile.setAttribute('aria-pressed', String(threat.id === this.selectedThreatId));

    const heading = document.createElement('span');
    heading.className = 'apex-bounty-tile-heading';
    const glyph = createApexGlyph(document);
    glyph.classList.add('apex-glyph-bounty-tile');
    glyph.dataset.apexSurface = 'bounty-tile';
    const number = document.createElement('span');
    number.textContent = `BOUNTY ${String(index + 1).padStart(2, '0')}`;
    const status = document.createElement('b');
    status.textContent = threat.statusLabel;
    heading.append(glyph, number, status);

    const name = document.createElement('strong');
    name.textContent = threat.name;
    const title = document.createElement('small');
    title.textContent = threat.title;
    const progress = createPursuitPips(document, threat);
    const progressLabel = document.createElement('span');
    progressLabel.className = 'apex-bounty-progress-label';
    progressLabel.textContent = `${completed}/${threat.contacts.length} pursuit contacts`;
    tile.append(heading, name, title, progress, progressLabel);
    tile.addEventListener('click', () => {
      if (threat.id === this.selectedThreatId) return;
      this.selectedThreatId = threat.id;
      this.renderBoard(true);
    });
    return tile;
  }

  private createTargetVisual(document: Document, threat: ApexThreatReadModel): HTMLElement {
    const visual = document.createElement('article');
    visual.className = 'apex-bounty-visual';
    visual.dataset.testid = 'apex-bounty-visual';
    visual.dataset.threat = threat.id;
    visual.dataset.status = threat.status;

    const radar = document.createElement('div');
    radar.className = 'apex-bounty-radar';
    radar.setAttribute('aria-hidden', 'true');
    const ringOuter = document.createElement('span');
    ringOuter.className = 'apex-bounty-radar-ring apex-bounty-radar-ring-outer';
    const ringInner = document.createElement('span');
    ringInner.className = 'apex-bounty-radar-ring apex-bounty-radar-ring-inner';
    const axis = document.createElement('span');
    axis.className = 'apex-bounty-radar-axis';
    const glyph = createApexGlyph(document);
    glyph.classList.add('apex-glyph-bounty-target');
    glyph.dataset.apexSurface = 'bounty-target';
    radar.append(ringOuter, ringInner, axis, glyph);

    const identity = document.createElement('div');
    identity.className = 'apex-bounty-identity';
    const cue = document.createElement('span');
    cue.textContent = `${threat.mapCue} TARGET PROFILE`;
    const name = document.createElement('h2');
    name.textContent = threat.name;
    const title = document.createElement('p');
    title.textContent = `${threat.title} · ${threat.structureLabel}`;
    const status = document.createElement('strong');
    status.className = 'apex-status-badge';
    status.dataset.status = threat.status;
    status.textContent = threat.statusLabel;
    identity.append(cue, name, title, status);

    const condition = document.createElement('div');
    condition.className = 'apex-bounty-condition';
    const conditionLabel = document.createElement('span');
    conditionLabel.textContent =
      threat.status === 'resolved'
        ? 'BOUNTY RESULT'
        : threat.status === 'escaped'
          ? 'LAST SIGNAL'
          : 'PROJECTED FINALE INTEGRITY';
    const conditionValue = document.createElement('strong');
    conditionValue.textContent =
      threat.status === 'resolved'
        ? 'TARGET DESTROYED'
        : threat.status === 'escaped'
          ? 'TARGET ESCAPED'
          : `${threat.integrity}/${threat.maximumIntegrity}`;
    condition.append(conditionLabel, conditionValue);
    if (threat.status !== 'resolved' && threat.status !== 'escaped') {
      condition.append(
        createMeter(
          document,
          threat.integrity,
          threat.maximumIntegrity,
          `${threat.name} projected finale integrity`
        )
      );
    }

    visual.append(radar, identity, condition);
    return visual;
  }

  private createBountyDetails(document: Document, threat: ApexThreatReadModel): HTMLElement {
    const details = document.createElement('article');
    details.className = 'apex-bounty-details';
    details.dataset.testid = 'apex-bounty-details';

    const header = document.createElement('header');
    const copy = document.createElement('div');
    const eyebrow = document.createElement('span');
    eyebrow.textContent = 'PURSUIT STATUS';
    const heading = document.createElement('h2');
    heading.textContent = `${countResolvedContacts(threat)}/${threat.contacts.length} contacts secured`;
    copy.append(eyebrow, heading);
    const state = document.createElement('b');
    state.textContent = threat.status === 'resolved' ? 'CLAIMED' : threat.status === 'escaped' ? 'LOST' : 'ACTIVE';
    header.append(copy, state);

    const summary = document.createElement('p');
    summary.className = 'apex-bounty-summary';
    summary.textContent = threat.summary;
    const doctrine = document.createElement('p');
    doctrine.className = 'apex-bounty-doctrine';
    doctrine.textContent = threat.huntDoctrine;

    const track = document.createElement('ol');
    track.className = 'apex-bounty-track';
    track.dataset.testid = 'apex-contact-track';
    for (const [index, contact] of threat.contacts.entries()) {
      const step = document.createElement('li');
      step.dataset.status = contact.status;
      const number = document.createElement('span');
      number.textContent = String(index + 1).padStart(2, '0');
      const stepCopy = document.createElement('div');
      const label = document.createElement('strong');
      label.textContent = contact.stageLabel;
      const contactStatus = document.createElement('b');
      contactStatus.textContent = contact.statusLabel;
      const name = document.createElement('span');
      name.textContent = contact.label;
      const location = document.createElement('small');
      location.textContent = contact.location;
      stepCopy.append(label, contactStatus, name, location);
      step.append(number, stepCopy);
      track.append(step);
    }

    const facts = document.createElement('div');
    facts.className = 'apex-bounty-facts';
    facts.append(
      createFact(
        document,
        threat.status === 'resolved' ? 'Kill confirmed' : threat.status === 'escaped' ? 'Bounty lost' : 'Next order',
        threat.statusDetail
      ),
      createFact(
        document,
        'Finale damage',
        `${threat.maximumIntegrity - threat.integrity} integrity stripped before contact · ${threat.integrity}/${threat.maximumIntegrity} projected remaining`
      ),
      this.createSpoilsFact(document, threat)
    );

    details.append(header, summary, doctrine, track, facts);
    return details;
  }

  private createSpoilsFact(document: Document, threat: ApexThreatReadModel): HTMLElement {
    const names = threat.circuitRewardItemIds.map((itemId) => getItemById(itemId).name);
    const fact = createFact(
      document,
      'Apex circuit spoils',
      `${names.join(' / ')} · one associated circuit replaces an ordinary sector reward after the kill.`
    );
    fact.dataset.testid = 'apex-bounty-spoils';
    const glyph = createApexGlyph(document);
    glyph.classList.add('apex-glyph-bounty-spoil');
    glyph.dataset.apexSurface = 'bounty-spoil';
    fact.prepend(glyph);
    return fact;
  }
}

function countResolvedContacts(threat: ApexThreatReadModel): number {
  return threat.contacts.filter((contact) => contact.status === 'resolved').length;
}

function createPursuitPips(document: Document, threat: ApexThreatReadModel): HTMLElement {
  const track = document.createElement('span');
  track.className = 'apex-bounty-pips';
  track.setAttribute('aria-hidden', 'true');
  for (const contact of threat.contacts) {
    const pip = document.createElement('i');
    pip.dataset.status = contact.status;
    track.append(pip);
  }
  return track;
}

function createFact(document: Document, labelCopy: string, detailCopy: string): HTMLElement {
  const fact = document.createElement('section');
  fact.className = 'apex-bounty-fact';
  const label = document.createElement('strong');
  label.textContent = labelCopy;
  const detail = document.createElement('p');
  detail.textContent = detailCopy;
  fact.append(label, detail);
  return fact;
}

function createMeter(
  document: Document,
  value: number,
  maximum: number,
  label: string
): HTMLMeterElement {
  const meter = document.createElement('meter');
  meter.min = 0;
  meter.max = maximum;
  meter.value = Math.max(0, Math.min(maximum, value));
  meter.setAttribute('aria-label', label);
  return meter;
}
