import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { RunSkeleton, StartingContract } from '../game/Generation';
import {
  SCENARIO_LAB_DEFINITIONS,
  createScenarioLabLaunch,
  type ScenarioLabId
} from '../game/ScenarioLab';
import type { InputAction } from '../systems/InputSystem';

export class ScenarioLabScene implements Scene {
  public readonly id = 'scenario-lab';
  private readonly buttons: HTMLButtonElement[] = [];

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly run: RunSkeleton,
    private readonly contract: StartingContract,
    private readonly onLaunch: (id: ScenarioLabId) => void,
    private readonly onBack: () => void
  ) {}

  public enter(): void {
    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide scenario-lab-panel';
    shell.dataset.testid = 'scenario-lab';
    shell.setAttribute('aria-labelledby', 'scenario-lab-title');

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = 'Debug only | Local state | No telemetry';

    const title = document.createElement('h1');
    title.id = 'scenario-lab-title';
    title.textContent = 'Expedition Scenario Lab';

    const intro = document.createElement('p');
    intro.className = 'transition-copy';
    intro.dataset.testid = 'scenario-lab-intro';
    intro.textContent =
      'Launch authoritative voyage plans without completing a full run. Each card creates a fresh deterministic session from public scenario and timeline models.';

    const grid = document.createElement('div');
    grid.className = 'scenario-lab-grid';
    this.buttons.length = 0;

    for (const definition of SCENARIO_LAB_DEFINITIONS) {
      const preview = createScenarioLabLaunch({
        run: this.run,
        contract: this.contract,
        scenarioId: definition.id,
        unlockedIds: this.run.unlockedIds
      }).readout;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice-card scenario-lab-card';
      button.dataset.testid = `scenario-lab-${definition.id}`;
      button.addEventListener('click', () => this.onLaunch(definition.id));

      const heading = document.createElement('span');
      heading.className = 'choice-title';
      heading.textContent = definition.title;

      const systems = document.createElement('span');
      systems.className = 'choice-meta';
      systems.textContent = `${definition.target.toUpperCase()} | ${definition.systems.join(' + ')}`;

      const summary = document.createElement('span');
      summary.className = 'choice-body';
      summary.textContent = definition.summary;

      const setup = document.createElement('span');
      setup.className = 'choice-body scenario-lab-setup';
      setup.textContent = `${preview.sector} | ${preview.missionStage} | ${preview.frame} | engineering ${preview.engineeringHistory} | faction ${preview.factionEvents} | fronts ${preview.frontEvents} | crew ${preview.crewEvents} | arcs ${preview.arcEvents} | fleet ${preview.fleetEvents} | apex ${preview.apexEvents} | timeline ${preview.timelineEvents}`;

      const budget = document.createElement('span');
      budget.className = 'choice-body scenario-lab-budget';
      budget.textContent = `Budget: ${definition.pressureBudget}. Access: ${definition.accessibilityCheck}.`;

      button.append(heading, systems, summary, setup, budget);
      grid.append(button);
      this.buttons.push(button);
    }

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'secondary-button';
    back.textContent = 'Back To Menu';
    back.addEventListener('click', this.onBack);

    shell.append(eyebrow, title, intro, grid, back);
    this.uiRoot.replaceChildren(shell);
    this.buttons[0]?.focus();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'confirm') {
      const focused = this.uiRoot.ownerDocument.activeElement;
      if (focused instanceof HTMLButtonElement && this.buttons.includes(focused)) focused.click();
      else this.buttons[0]?.click();
    } else if (action === 'back' || action === 'pause') {
      this.onBack();
    }
  }

  public getDebugState(): SceneDebugState {
    return {
      seed: this.run.seed,
      entityCount: 0,
      scenarioLab: {
        scenarioCount: SCENARIO_LAB_DEFINITIONS.length,
        activeScenario: null,
        systems: [...new Set(SCENARIO_LAB_DEFINITIONS.flatMap((definition) => definition.systems))],
        budget: 'public setup models; 96 timeline entries; bounded gameplay presets'
      }
    };
  }
}
