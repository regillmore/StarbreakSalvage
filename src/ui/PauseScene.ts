import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene } from '../app/Scene';
import type { InputAction } from '../systems/InputSystem';
import type { GameplayScene } from './GameplayScene';

export class PauseScene implements Scene {
  public readonly id = 'pause';

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly gameplayScene: GameplayScene,
    private readonly onResume: (scene: GameplayScene) => void,
    private readonly onEndRun: () => void,
    private readonly onOpenSettings: () => void,
    private readonly onSuspendRun: () => void,
    private readonly operationExit: 'endRun' | 'retreatBoarding' = 'endRun'
  ) {}

  public enter(): void {
    const dossier = this.gameplayScene.getPauseDossier();
    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide pause-panel';
    shell.dataset.testid = 'pause-dossier';
    shell.setAttribute('aria-labelledby', 'pause-title');

    const header = document.createElement('header');
    header.className = 'pause-header';

    const identity = document.createElement('div');
    identity.className = 'pause-identity';

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = dossier.eyebrow;

    const title = document.createElement('h1');
    title.id = 'pause-title';
    title.textContent = 'Paused';

    const sectorTitle = document.createElement('h2');
    sectorTitle.textContent = dossier.title;

    const subtitle = document.createElement('p');
    subtitle.className = 'pause-subtitle';
    subtitle.textContent = dossier.subtitle;

    const status = document.createElement('p');
    status.className = 'pause-contract-status';
    status.textContent =
      this.operationExit === 'retreatBoarding'
        ? 'The incursion remains active. Retreat banks only custody already carried to the lock.'
        : 'The contract remains legally active.';

    identity.append(eyebrow, title, sectorTitle, subtitle);
    header.append(identity, status);

    const metrics = document.createElement('section');
    metrics.className = 'pause-metrics';
    metrics.setAttribute('aria-label', 'Current operation metrics');
    for (const metric of dossier.metrics) {
      const card = document.createElement('div');
      card.className = 'pause-metric';
      card.dataset.tone = metric.tone ?? 'standard';

      const label = document.createElement('span');
      label.textContent = metric.label;
      const value = document.createElement('strong');
      value.textContent = metric.value;

      card.append(label, value);
      metrics.append(card);
    }

    const dossierGrid = document.createElement('div');
    dossierGrid.className = 'pause-dossier-grid';
    for (const section of dossier.sections) {
      const card = document.createElement('section');
      card.className = 'pause-dossier-card';
      card.dataset.pauseSection = section.id;
      card.dataset.testid = `pause-section-${section.id}`;

      const cardEyebrow = document.createElement('p');
      cardEyebrow.className = 'pause-card-eyebrow';
      cardEyebrow.textContent = section.eyebrow;

      const cardTitle = document.createElement('h3');
      cardTitle.textContent = section.title;

      const list = document.createElement('dl');
      for (const entry of section.entries) {
        const row = document.createElement('div');
        row.className = 'pause-dossier-entry';
        row.dataset.tone = entry.tone ?? 'standard';

        const label = document.createElement('dt');
        label.textContent = entry.label;
        const value = document.createElement('dd');
        value.textContent = entry.value;

        row.append(label, value);
        list.append(row);
      }

      card.append(cardEyebrow, cardTitle, list);
      dossierGrid.append(card);
    }

    const controls = document.createElement('div');
    controls.className = 'button-row pause-controls';

    const resumeButton = document.createElement('button');
    resumeButton.className = 'primary-button';
    resumeButton.type = 'button';
    resumeButton.textContent = 'Resume';
    resumeButton.addEventListener('click', () => this.onResume(this.gameplayScene));

    const endButton = document.createElement('button');
    endButton.className = 'secondary-button';
    endButton.type = 'button';
    endButton.textContent =
      this.operationExit === 'retreatBoarding' ? 'Retreat Incursion' : 'End Run';
    endButton.addEventListener('click', this.onEndRun);

    const settingsButton = document.createElement('button');
    settingsButton.className = 'secondary-button';
    settingsButton.type = 'button';
    settingsButton.textContent = 'Settings';
    settingsButton.addEventListener('click', this.onOpenSettings);

    const suspendButton = document.createElement('button');
    suspendButton.className = 'secondary-button';
    suspendButton.type = 'button';
    suspendButton.dataset.testid = 'suspend-expedition';
    suspendButton.textContent = 'Suspend & Main Menu';
    suspendButton.title = 'Save the run and restart this operation from its safe checkpoint later.';
    suspendButton.addEventListener('click', this.onSuspendRun);

    controls.append(resumeButton, settingsButton, suspendButton, endButton);
    shell.append(header, metrics, dossierGrid, controls);
    this.uiRoot.replaceChildren(shell);
    resumeButton.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, alpha: number): void {
    this.gameplayScene.render(renderer, alpha);
    renderer.paintDimmer(0.54);
  }

  public handleAction(action: InputAction): void {
    if (action === 'pause' || action === 'back' || action === 'confirm') {
      this.onResume(this.gameplayScene);
    }
  }

  public getDebugState(): { seed: string; entityCount: number } {
    return this.gameplayScene.getDebugState();
  }
}
