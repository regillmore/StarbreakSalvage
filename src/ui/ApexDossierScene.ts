import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { ApexOutcome } from '../content/apexThreats';
import {
  createApexCampaignReadModel,
  createApexDebugState,
  createApexFinaleProfile,
  type ApexFinaleContext,
  type ApexFinaleProfile,
  type ApexHuntPlan,
  type ApexHuntState,
  type ApexPressureReadModel,
  type ApexResolutionOption,
  type ApexThreatReadModel
} from '../game/ApexHunt';
import type { InputAction } from '../systems/InputSystem';

export class ApexDossierScene implements Scene {
  public readonly id = 'apex-dossier';
  private selectedThreatId: string;

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly plan: ApexHuntPlan,
    private readonly state: ApexHuntState,
    private readonly sectorIndex: number,
    private readonly context: ApexFinaleContext,
    private readonly resolution: ApexFinaleProfile | null,
    private readonly onResolve: ((outcome: ApexOutcome) => void) | null,
    private readonly onBack: () => void
  ) {
    this.selectedThreatId =
      resolution?.threatId ??
      state.threats.find((threat) => threat.status === 'awaitingResolution')?.threatId ??
      plan.threats[0]?.definitionId ??
      '';
  }

  public enter(): void {
    this.renderDossier();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'confirm') {
      const focused = this.uiRoot.ownerDocument.activeElement;
      if (focused instanceof HTMLButtonElement) focused.click();
    } else if ((action === 'back' || action === 'pause') && this.onResolve === null) {
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

  private renderDossier(focusThreatTab = false): void {
    const document = this.uiRoot.ownerDocument;
    const model = createApexCampaignReadModel(this.plan, this.state, this.sectorIndex);
    const selected =
      model.threats.find((threat) => threat.id === this.selectedThreatId) ?? model.threats[0];
    if (!selected) throw new Error('Apex dossier requires at least one threat.');
    this.selectedThreatId = selected.id;
    const profile =
      this.resolution?.threatId === selected.id
        ? this.resolution
        : createApexFinaleProfile({
            plan: this.plan,
            state: this.state,
            threatId: selected.id,
            context: this.context
          });
    const forcedResolution = this.onResolve !== null;

    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide apex-dossier-panel';
    shell.dataset.testid = 'apex-dossier';
    shell.dataset.resolution = String(forcedResolution);
    shell.setAttribute('aria-labelledby', 'apex-title');

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = forcedResolution
      ? `${selected.mapCue} Finale secured · combat complete`
      : 'Roaming apex intelligence · four-contact campaigns';
    const title = document.createElement('h1');
    title.id = 'apex-title';
    title.textContent = forcedResolution
      ? `${selected.name} Neutralized`
      : 'Apex Pursuit Network';
    const summary = document.createElement('p');
    summary.className = 'apex-campaign-summary';
    summary.textContent = forcedResolution
      ? 'The fight is over. Choose the campaign outcome; locked routes show exactly which leverage was missing.'
      : `${model.summary}. Select a threat to inspect its contacts, lasting damage, and future disposition routes.`;

    const tabs = document.createElement('nav');
    tabs.className = 'apex-threat-tabs';
    tabs.setAttribute('aria-label', 'Apex threat dossiers');
    const visibleThreats = forcedResolution
      ? model.threats.filter((threat) => threat.id === selected.id)
      : model.threats;
    for (const threat of visibleThreats) {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'apex-threat-tab';
      tab.dataset.testid = `apex-threat-${threat.id}`;
      tab.dataset.selected = String(threat.id === selected.id);
      tab.dataset.status = threat.status;
      tab.setAttribute('aria-pressed', String(threat.id === selected.id));
      const identity = document.createElement('span');
      identity.className = 'apex-threat-tab-identity';
      identity.textContent = `${threat.mapCue} ${threat.name}`;
      const status = document.createElement('span');
      status.className = 'apex-threat-tab-status';
      status.textContent = threat.statusLabel;
      tab.append(identity, status);
      tab.addEventListener('click', () => {
        if (threat.id === this.selectedThreatId) return;
        this.selectedThreatId = threat.id;
        this.renderDossier(true);
      });
      tabs.append(tab);
    }

    const layout = document.createElement('div');
    layout.className = 'apex-dossier-layout';
    layout.append(
      this.createThreatSheet(document, selected),
      this.createIntelPanel(document, selected, profile)
    );

    const dispositions = this.createDispositionSection(
      document,
      selected,
      profile,
      forcedResolution
    );
    const controls = document.createElement('div');
    controls.className = 'apex-dossier-controls';
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'secondary-button';
    back.textContent = 'Back';
    back.hidden = forcedResolution;
    back.addEventListener('click', this.onBack);
    controls.append(back);

    shell.append(eyebrow, title, summary, tabs, layout, dispositions, controls);
    this.uiRoot.replaceChildren(shell);

    const focusTarget = focusThreatTab || !forcedResolution
      ? shell.querySelector<HTMLButtonElement>(
          `[data-testid="apex-threat-${this.selectedThreatId}"]`
        )
      : shell.querySelector<HTMLButtonElement>(
          '[data-testid^="apex-resolution-"][data-ready="true"], button:not([hidden])'
        );
    focusTarget?.focus();
  }

  private createThreatSheet(
    document: Document,
    threat: ApexThreatReadModel
  ): HTMLElement {
    const sheet = document.createElement('article');
    sheet.className = 'apex-threat-sheet';
    const header = document.createElement('header');
    header.className = 'apex-sheet-header';
    const copy = document.createElement('div');
    const title = document.createElement('h2');
    title.textContent = threat.name;
    const subtitle = document.createElement('p');
    subtitle.textContent = `${threat.title} · ${threat.structureLabel}`;
    copy.append(title, subtitle);
    const status = document.createElement('span');
    status.className = 'apex-status-badge';
    status.dataset.status = threat.status;
    status.textContent = threat.statusLabel;
    header.append(copy, status);

    const summary = document.createElement('p');
    summary.className = 'apex-threat-summary';
    summary.textContent = threat.summary;
    const doctrine = document.createElement('p');
    doctrine.className = 'apex-doctrine';
    doctrine.textContent = threat.huntDoctrine;
    const statusDetail = document.createElement('p');
    statusDetail.className = 'apex-status-detail';
    statusDetail.textContent = threat.statusDetail;

    const heading = document.createElement('h3');
    heading.textContent = 'Pursuit track';
    const timeline = document.createElement('ol');
    timeline.className = 'apex-contact-track';
    timeline.dataset.testid = 'apex-contact-track';
    for (const contact of threat.contacts) {
      const item = document.createElement('li');
      item.className = 'apex-contact';
      item.dataset.status = contact.status;
      const marker = document.createElement('span');
      marker.className = 'apex-contact-marker';
      marker.setAttribute('aria-hidden', 'true');
      const body = document.createElement('div');
      const contactHeader = document.createElement('div');
      contactHeader.className = 'apex-contact-header';
      const label = document.createElement('strong');
      label.textContent = `${contact.stageLabel} · ${contact.label}`;
      const contactStatus = document.createElement('span');
      contactStatus.textContent = contact.statusLabel;
      contactHeader.append(label, contactStatus);
      const location = document.createElement('small');
      location.textContent = contact.location;
      const directive = document.createElement('p');
      directive.textContent = contact.directive;
      const payoff = document.createElement('p');
      payoff.className = 'apex-contact-payoff';
      payoff.textContent = `LASTING EFFECT · ${contact.payoff}`;
      body.append(contactHeader, location, directive, payoff);
      item.append(marker, body);
      timeline.append(item);
    }
    sheet.append(header, summary, doctrine, statusDetail, heading, timeline);
    return sheet;
  }

  private createIntelPanel(
    document: Document,
    threat: ApexThreatReadModel,
    profile: ApexFinaleProfile
  ): HTMLElement {
    const panel = document.createElement('aside');
    panel.className = 'apex-intel-panel';
    const heading = document.createElement('h2');
    heading.textContent = 'What the hunt changed';

    const integrity = document.createElement('section');
    integrity.className = 'apex-integrity-card';
    const integrityHeader = document.createElement('div');
    const integrityLabel = document.createElement('strong');
    integrityLabel.textContent = 'Remaining apex integrity';
    const integrityValue = document.createElement('span');
    integrityValue.textContent = `${threat.integrity}/${threat.maximumIntegrity}`;
    integrityHeader.append(integrityLabel, integrityValue);
    integrity.append(
      integrityHeader,
      createMeter(document, threat.integrity, threat.maximumIntegrity, 'Apex integrity remaining'),
      createParagraph(document, threat.integrityDetail)
    );

    const subsystemGrid = document.createElement('div');
    subsystemGrid.className = 'apex-subsystem-grid';
    subsystemGrid.dataset.testid = 'apex-subsystems';
    for (const subsystem of threat.subsystems) {
      const card = document.createElement('article');
      card.className = 'apex-subsystem-card';
      card.dataset.condition = subsystem.condition.toLowerCase();
      const row = document.createElement('div');
      const label = document.createElement('strong');
      label.textContent = subsystem.label;
      const value = document.createElement('span');
      value.textContent = `${subsystem.current}/${subsystem.maximum} · ${subsystem.condition}`;
      row.append(label, value);
      card.append(
        row,
        createMeter(
          document,
          subsystem.current,
          subsystem.maximum,
          `${subsystem.label} integrity remaining`
        ),
        createParagraph(document, subsystem.effect)
      );
      subsystemGrid.append(card);
    }

    const evidenceHeading = document.createElement('h3');
    evidenceHeading.textContent = 'Campaign evidence';
    const evidence = document.createElement('div');
    evidence.className = 'apex-evidence-grid';
    evidence.dataset.testid = 'apex-evidence';
    for (const entry of threat.evidence) {
      const card = document.createElement('article');
      card.className = 'apex-evidence-card';
      card.dataset.tone = entry.tone;
      const value = document.createElement('strong');
      value.textContent = entry.value;
      const label = document.createElement('span');
      label.textContent = entry.label;
      const detail = document.createElement('small');
      detail.textContent = entry.detail;
      card.append(value, label, detail);
      evidence.append(card);
    }

    const pressureHeading = document.createElement('h3');
    pressureHeading.textContent = 'Finale forecast';
    const pressure = document.createElement('div');
    pressure.className = 'apex-pressure-grid';
    pressure.dataset.testid = 'apex-pressure';
    for (const entry of profile.pressure) pressure.append(createPressureCard(document, entry));

    panel.append(
      heading,
      integrity,
      subsystemGrid,
      evidenceHeading,
      evidence,
      pressureHeading,
      pressure
    );
    return panel;
  }

  private createDispositionSection(
    document: Document,
    threat: ApexThreatReadModel,
    profile: ApexFinaleProfile,
    forcedResolution: boolean
  ): HTMLElement {
    const section = document.createElement('section');
    section.className = 'apex-dispositions';
    section.dataset.testid = 'apex-dispositions';
    const heading = document.createElement('div');
    heading.className = 'apex-disposition-heading';
    const copy = document.createElement('div');
    const title = document.createElement('h2');
    title.textContent = forcedResolution ? 'Choose final disposition' : 'Disposition routes';
    const intro = document.createElement('p');
    intro.textContent = forcedResolution
      ? `${profile.readyOptions}/${profile.options.length} routes are ready. Requirements use the expedition and hunt evidence shown above.`
      : 'Preview only. Contacts and expedition decisions can open these routes before the finale.';
    copy.append(title, intro);
    const decision = document.createElement('span');
    decision.className = 'apex-decision-state';
    decision.textContent = threat.status === 'awaitingResolution' ? 'Decision required' : 'Projection';
    heading.append(copy, decision);

    const choices = document.createElement('div');
    choices.className = 'apex-disposition-grid';
    choices.setAttribute('aria-label', 'Apex disposition choices');
    for (const option of profile.options) {
      choices.append(this.createDispositionCard(document, option, forcedResolution));
    }
    section.append(heading, choices);
    return section;
  }

  private createDispositionCard(
    document: Document,
    option: ApexResolutionOption,
    forcedResolution: boolean
  ): HTMLElement {
    const card = forcedResolution ? document.createElement('button') : document.createElement('article');
    card.className = 'apex-resolution-card';
    card.dataset.testid = `apex-resolution-${option.outcome}`;
    card.dataset.ready = String(option.available);
    if (card instanceof HTMLButtonElement) {
      card.type = 'button';
      card.setAttribute('aria-disabled', String(!option.available));
      card.addEventListener('click', () => {
        if (option.available) this.onResolve?.(option.outcome);
      });
    }
    const header = document.createElement('div');
    header.className = 'apex-resolution-header';
    const label = document.createElement('h3');
    label.textContent = option.label;
    const status = document.createElement('span');
    status.className = 'apex-readiness-badge';
    status.textContent = option.available ? 'Ready' : 'Locked';
    header.append(label, status);
    const summary = createParagraph(document, option.summary);
    summary.className = 'apex-resolution-summary';
    const risk = createParagraph(document, `CONSEQUENCE · ${option.risk}`);
    risk.className = 'apex-resolution-risk';
    const requirements = document.createElement('div');
    requirements.className = 'apex-requirement-list';
    if (option.requirements.length === 0) {
      const ready = document.createElement('p');
      ready.className = 'apex-requirement-empty';
      ready.textContent = 'Neutralization complete · no additional leverage required.';
      requirements.append(ready);
    } else {
      for (const requirement of option.requirements) {
        const row = document.createElement('section');
        row.className = 'apex-requirement';
        row.dataset.met = String(requirement.met);
        const requirementHeader = document.createElement('div');
        const requirementLabel = document.createElement('strong');
        requirementLabel.textContent = requirement.label;
        const score = document.createElement('span');
        score.textContent = `${requirement.current}/${requirement.target}`;
        requirementHeader.append(requirementLabel, score);
        const meter = createMeter(
          document,
          requirement.current,
          requirement.target,
          `${requirement.label} ${requirement.current} of ${requirement.target}`
        );
        const sources = document.createElement('small');
        sources.textContent = requirement.sourceReadout;
        const missing = document.createElement('b');
        missing.textContent = requirement.missingReadout;
        row.append(requirementHeader, meter, sources, missing);
        requirements.append(row);
      }
    }
    card.append(header, summary, risk, requirements);
    return card;
  }
}

function createMeter(document: Document, value: number, maximum: number, label: string): HTMLMeterElement {
  const meter = document.createElement('meter');
  meter.min = 0;
  meter.max = maximum;
  meter.value = Math.max(0, Math.min(maximum, value));
  meter.setAttribute('aria-label', label);
  return meter;
}

function createParagraph(document: Document, copy: string): HTMLParagraphElement {
  const paragraph = document.createElement('p');
  paragraph.textContent = copy;
  return paragraph;
}

function createPressureCard(document: Document, entry: ApexPressureReadModel): HTMLElement {
  const card = document.createElement('article');
  card.className = 'apex-pressure-card';
  card.dataset.tone = entry.tone;
  const row = document.createElement('div');
  const label = document.createElement('span');
  label.textContent = entry.label;
  const value = document.createElement('strong');
  value.textContent = entry.value;
  row.append(label, value);
  const detail = document.createElement('small');
  detail.textContent = entry.detail;
  card.append(row, detail);
  return card;
}
