import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import {
  RUN_TIMELINE_ENTRY_CAP,
  createRunTimelineDebugState,
  formatRunTimelineEntry,
  type RunTimelineState
} from '../game/RunTimeline';
import {
  SCENARIO_LAB_IDS,
  type ScenarioLabDefinition,
  type ScenarioLabSetupReadModel
} from '../game/ScenarioLab';
import type { InputAction } from '../systems/InputSystem';

export class ScenarioTimelineScene implements Scene {
  public readonly id = 'scenario-timeline';

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly definition: ScenarioLabDefinition,
    private readonly setup: ScenarioLabSetupReadModel,
    private readonly timeline: RunTimelineState,
    private readonly onBack: () => void
  ) {}

  public enter(): void {
    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide scenario-lab-panel';
    shell.dataset.testid = 'scenario-timeline';
    shell.setAttribute('aria-labelledby', 'scenario-timeline-title');
    const title = document.createElement('h1');
    title.id = 'scenario-timeline-title';
    title.textContent = this.definition.title;
    const summary = document.createElement('p');
    summary.className = 'transition-copy';
    summary.textContent = `${this.setup.summary} | ${this.timeline.entries.length}/${RUN_TIMELINE_ENTRY_CAP} entries | ${this.timeline.droppedEntries} dropped.`;
    const list = document.createElement('ol');
    list.className = 'scenario-timeline-list';
    list.dataset.testid = 'scenario-timeline-list';
    for (const entry of this.timeline.entries) {
      const item = document.createElement('li');
      item.textContent = formatRunTimelineEntry(entry);
      list.append(item);
    }
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'primary-button';
    back.textContent = 'Back To Scenario Lab';
    back.addEventListener('click', this.onBack);
    shell.append(title, summary, list, back);
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
      seed: 'scenario-lab',
      entityCount: 0,
      runTimeline: createRunTimelineDebugState(this.timeline),
      scenarioLab: {
        scenarioCount: SCENARIO_LAB_IDS.length,
        activeScenario: this.definition.id,
        systems: this.definition.systems,
        budget: this.definition.pressureBudget
      }
    };
  }
}
