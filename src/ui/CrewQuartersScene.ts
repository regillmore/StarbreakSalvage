import type { CanvasRenderer } from '../app/CanvasRenderer';
import type { Scene, SceneDebugState } from '../app/Scene';
import type { CrewRosterPlan, CrewRosterState } from '../game/CrewCommand';
import {
  createCrewArcChoiceReadModels,
  createCrewArcDebugState,
  createCrewArcRosterReadModel,
  type CrewArcPlan,
  type CrewArcState
} from '../game/CrewArc';
import type { InputAction } from '../systems/InputSystem';

export class CrewQuartersScene implements Scene {
  public readonly id = 'crew-quarters';
  private readonly buttons: HTMLButtonElement[] = [];

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly crewPlan: CrewRosterPlan,
    private readonly crewState: CrewRosterState,
    private readonly arcPlan: CrewArcPlan,
    private readonly arcState: CrewArcState,
    private readonly sectorIndex: number,
    private readonly onChoose: (arcId: string, optionId: string) => void,
    private readonly onBack: () => void
  ) {}

  public enter(): void {
    const readModel = createCrewArcRosterReadModel(this.arcPlan, this.arcState, this.crewPlan);
    const choices = createCrewArcChoiceReadModels(this.arcPlan, this.arcState, this.crewPlan);
    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide junction-panel';
    shell.dataset.testid = 'crew-quarters';
    shell.setAttribute('aria-labelledby', 'crew-quarters-title');

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `Voyage cast | Sector ${this.sectorIndex + 1}`;
    const title = document.createElement('h1');
    title.id = 'crew-quarters-title';
    title.textContent = 'Crew Quarters';
    const summary = document.createElement('p');
    summary.className = 'transition-copy';
    summary.textContent = readModel.summary;

    const roster = document.createElement('ul');
    roster.className = 'operational-itinerary';
    roster.dataset.testid = 'crew-arc-roster';
    roster.setAttribute('aria-label', 'Crew roster and fates');
    for (const candidate of this.crewPlan.candidates) {
      const member = this.crewState.members.find((entry) => entry.candidateId === candidate.id)!;
      const item = document.createElement('li');
      item.className = `operational-node operational-node-${member.status === 'active' ? 'available' : 'blocked'}`;
      const heading = document.createElement('strong');
      heading.textContent = `${candidate.callsign} — ${candidate.name}`;
      const detail = document.createElement('span');
      detail.textContent = `${candidate.roleId.replace('crew_', '')} | ${member.status} | trust ${member.trust} | ${this.arcState.ranks[candidate.id]} | fate ${this.arcState.fates[candidate.id]}`;
      item.append(heading, detail);
      roster.append(item);
    }

    const relationships = document.createElement('section');
    relationships.dataset.testid = 'crew-relationships';
    relationships.setAttribute('aria-labelledby', 'crew-relationships-title');
    const relationshipTitle = document.createElement('h2');
    relationshipTitle.id = 'crew-relationships-title';
    relationshipTitle.textContent = 'Relationships';
    const relationshipCopy = document.createElement('p');
    relationshipCopy.className = 'transition-copy';
    relationshipCopy.textContent =
      readModel.relationships.join(' | ') ||
      'No bond or conflict has hardened yet. Explicit voyage outcomes will change this roster.';
    relationships.append(relationshipTitle, relationshipCopy);

    const choiceGrid = document.createElement('div');
    choiceGrid.className = 'junction-grid';
    this.buttons.length = 0;
    for (const choice of choices) {
      const group = document.createElement('section');
      group.className = 'choice-card';
      group.setAttribute('aria-labelledby', `${choice.arcId}-title`);
      const heading = document.createElement('h2');
      heading.id = `${choice.arcId}-title`;
      heading.textContent = choice.title;
      const copy = document.createElement('p');
      copy.textContent = `${choice.primary} / ${choice.partner}: ${choice.summary}`;
      group.append(heading, copy);
      for (const option of choice.options) {
        const button = document.createElement('button');
        button.className = 'secondary-button';
        button.type = 'button';
        button.dataset.testid = `crew-arc-choice-${choice.arcId}-${option.id}`;
        button.textContent = `${option.label} — ${option.summary} Risk: ${option.risk}`;
        button.addEventListener('click', () => this.onChoose(choice.arcId, option.id));
        group.append(button);
        this.buttons.push(button);
      }
      choiceGrid.append(group);
    }
    if (choices.length === 0) {
      const quiet = document.createElement('p');
      quiet.className = 'transition-copy';
      quiet.textContent =
        'No crew decision is waiting. Mission, carrier, boarding, faction, rival, injury, module, command, and rescue outcomes may open one.';
      choiceGrid.append(quiet);
    }

    const back = document.createElement('button');
    back.className = 'primary-button';
    back.type = 'button';
    back.dataset.testid = 'crew-quarters-back';
    back.textContent = 'Return To Briefing';
    back.addEventListener('click', this.onBack);
    this.buttons.push(back);
    shell.append(eyebrow, title, summary, roster, relationships, choiceGrid, back);
    this.uiRoot.replaceChildren(shell);
    (this.buttons[0] ?? back).focus();
  }

  public update(_dt: number): void {}
  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (action === 'back' || action === 'pause') this.onBack();
    if (action === 'confirm') {
      const focused = this.uiRoot.ownerDocument.activeElement;
      (this.buttons.find((button) => button === focused) ?? this.buttons[0])?.click();
    }
  }

  public getDebugState(): SceneDebugState {
    return {
      seed: this.arcPlan.id,
      entityCount: 0,
      crewArcs: createCrewArcDebugState(this.arcPlan, this.arcState, this.crewPlan)
    };
  }
}
