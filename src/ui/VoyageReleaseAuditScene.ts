import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { VoyageReleaseAuditReport } from '../game/VoyageReleaseAudit';
import type { ScenarioLabDefinition, ScenarioLabSetupReadModel } from '../game/ScenarioLab';
import type { InputAction } from '../systems/InputSystem';

export class VoyageReleaseAuditScene implements Scene {
  public readonly id = 'voyage-release-audit';

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly definition: ScenarioLabDefinition,
    private readonly setup: ScenarioLabSetupReadModel,
    private readonly report: VoyageReleaseAuditReport,
    private readonly onBack: () => void
  ) {}

  public enter(): void {
    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide';
    shell.dataset.testid = 'voyage-release-audit';
    shell.setAttribute('aria-labelledby', 'voyage-audit-title');
    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = 'Phase 11 | Local deterministic evidence';
    const title = document.createElement('h1');
    title.id = 'voyage-audit-title';
    title.textContent = this.definition.title;
    const snapshot = document.createElement('p');
    snapshot.dataset.testid = 'voyage-audit-snapshot';
    snapshot.textContent = `Run snapshot v9 round trip: ${this.setup.snapshotBytes} bytes | ${this.setup.missionStage}`;
    const summary = document.createElement('p');
    summary.dataset.testid = 'voyage-audit-duration-summary';
    summary.textContent = this.report.summary;
    const list = document.createElement('ul');
    list.dataset.testid = 'voyage-audit-measurements';
    for (const measurement of this.report.measurements) {
      const item = document.createElement('li');
      item.textContent = `${measurement.saveProfile} ${measurement.routeProfile}: ${measurement.targetMinutes.toFixed(2)}m target (${measurement.minSeconds}-${measurement.maxSeconds}s, ${measurement.nodeCount} nodes, ${measurement.sectorCount} sectors)`;
      list.append(item);
    }
    const caveat = document.createElement('p');
    caveat.dataset.testid = 'voyage-audit-caveat';
    caveat.textContent = this.report.caveat;
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'secondary-button';
    back.textContent = 'Back To Scenario Lab';
    back.addEventListener('click', this.onBack);
    shell.append(eyebrow, title, snapshot, summary, list, caveat, back);
    this.uiRoot.replaceChildren(shell);
    back.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'confirm' || action === 'back' || action === 'pause') this.onBack();
  }

  public getDebugState(): SceneDebugState {
    return {
      seed: this.report.seed,
      entityCount: 0,
      scenarioLab: {
        scenarioCount: 16,
        activeScenario: 'release-audit',
        systems: this.definition.systems,
        budget: `${this.setup.snapshotBytes} snapshot bytes | ${this.report.summary}`
      }
    };
  }
}
