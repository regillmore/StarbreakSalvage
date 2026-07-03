import type { CanvasRenderer } from '../app/CanvasRenderer';
import {
  formatKeyLabel,
  getVisibleRemapActions,
  updateKeyBinding,
  type GameSettings,
  type RemappableAction
} from '../core/settingsData';
import type { Scene } from '../app/Scene';
import { normalizeKey, type InputAction } from '../systems/InputSystem';

const ACTION_LABELS: Record<RemappableAction, string> = {
  moveUp: 'Move Up',
  moveDown: 'Move Down',
  moveLeft: 'Move Left',
  moveRight: 'Move Right',
  fire: 'Fire',
  special: 'Special',
  bomb: 'Bomb',
  pause: 'Pause',
  confirm: 'Confirm',
  back: 'Back'
};

export class SettingsScene implements Scene {
  public readonly id = 'settings';
  private pendingAction: RemappableAction | null = null;
  private statusText = 'Settings ready.';
  private isListening = false;

  public constructor(
    private readonly uiRoot: HTMLElement,
    private readonly getSettings: () => GameSettings,
    private readonly onChangeSettings: (settings: GameSettings) => void,
    private readonly onToggleFullscreen: (settings: GameSettings) => void,
    private readonly onBack: () => void
  ) {}

  public enter(): void {
    this.addKeyListener();

    const settings = this.getSettings();
    const shell = document.createElement('main');
    shell.className = 'scene-panel scene-panel-wide settings-panel';
    shell.setAttribute('aria-labelledby', 'settings-title');

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `Audio ${settings.muted ? 'Muted' : `${Math.round(settings.masterVolume * 100)}%`} | Contrast ${settings.bulletContrast}`;

    const title = document.createElement('h1');
    title.id = 'settings-title';
    title.textContent = 'Settings';

    const settingsGrid = document.createElement('div');
    settingsGrid.className = 'settings-grid';

    const bindings = document.createElement('section');
    bindings.className = 'settings-group';

    const bindingsTitle = document.createElement('h2');
    bindingsTitle.textContent = 'Controls';
    bindings.append(bindingsTitle);

    for (const action of getVisibleRemapActions()) {
      const button = document.createElement('button');
      button.className = 'secondary-button binding-button';
      button.type = 'button';
      button.dataset.testid = `binding-${action}`;
      button.textContent =
        this.pendingAction === action
          ? `${ACTION_LABELS[action]}: ...`
          : `${ACTION_LABELS[action]}: ${formatKeyLabel(settings.keyBindings[action])}`;
      button.addEventListener('click', () => {
        this.pendingAction = action;
        this.statusText = `${ACTION_LABELS[action]} selected.`;
        this.enter();
      });
      bindings.append(button);
    }

    const access = document.createElement('section');
    access.className = 'settings-group';

    const accessTitle = document.createElement('h2');
    accessTitle.textContent = 'Access';
    access.append(
      accessTitle,
      this.createCheckbox('Mute', settings.muted, (checked) =>
        this.updateSettings({ ...this.getSettings(), muted: checked })
      ),
      this.createCheckbox('Reduced Motion', settings.reducedMotion, (checked) =>
        this.updateSettings({ ...this.getSettings(), reducedMotion: checked })
      ),
      this.createCheckbox('Performance Mode', settings.performanceMode, (checked) =>
        this.updateSettings({ ...this.getSettings(), performanceMode: checked })
      )
    );

    const tuning = document.createElement('section');
    tuning.className = 'settings-group';

    const tuningTitle = document.createElement('h2');
    tuningTitle.textContent = 'Tuning';
    tuning.append(
      tuningTitle,
      this.createRange('Volume', settings.masterVolume, (value) =>
        this.updateSettings({ ...this.getSettings(), masterVolume: value })
      ),
      this.createRange('Screen Shake', settings.screenShake, (value) =>
        this.updateSettings({ ...this.getSettings(), screenShake: value })
      ),
      this.createContrastSelect(settings)
    );

    settingsGrid.append(bindings, access, tuning);

    const controls = document.createElement('div');
    controls.className = 'button-row';

    const fullscreenButton = document.createElement('button');
    fullscreenButton.className = 'secondary-button';
    fullscreenButton.type = 'button';
    fullscreenButton.textContent = 'Fullscreen';
    fullscreenButton.addEventListener('click', () => {
      const next = { ...this.getSettings(), fullscreenPreferred: true };
      this.updateSettings(next);
      this.onToggleFullscreen(next);
    });

    const backButton = document.createElement('button');
    backButton.className = 'primary-button';
    backButton.type = 'button';
    backButton.textContent = 'Back';
    backButton.addEventListener('click', this.onBack);

    controls.append(fullscreenButton, backButton);

    const status = document.createElement('p');
    status.className = 'boot-status';
    status.dataset.testid = 'settings-status';
    status.textContent = this.statusText;

    shell.append(eyebrow, title, settingsGrid, controls, status);
    this.uiRoot.replaceChildren(shell);
    backButton.focus();
  }

  public exit(): void {
    this.removeKeyListener();
  }

  public update(_dt: number): void {}

  public render(renderer: CanvasRenderer, _alpha: number): void {
    renderer.paintBackground();
  }

  public handleAction(action: InputAction): void {
    if (this.pendingAction) {
      return;
    }

    if (action === 'back' || action === 'pause') {
      this.onBack();
    }
  }

  public getDebugState(): { seed: string; entityCount: number } {
    return { seed: 'n/a', entityCount: 0 };
  }

  private createCheckbox(
    labelText: string,
    checked: boolean,
    onChange: (checked: boolean) => void
  ): HTMLLabelElement {
    const label = document.createElement('label');
    label.className = 'setting-control';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.addEventListener('change', () => onChange(input.checked));

    const labelCopy = document.createElement('span');
    labelCopy.textContent = labelText;

    label.append(input, labelCopy);
    return label;
  }

  private createRange(
    labelText: string,
    value: number,
    onChange: (value: number) => void
  ): HTMLLabelElement {
    const label = document.createElement('label');
    label.className = 'setting-control setting-control-stacked';

    const labelCopy = document.createElement('span');
    labelCopy.textContent = `${labelText} ${Math.round(value * 100)}%`;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = '100';
    input.value = `${Math.round(value * 100)}`;
    input.addEventListener('change', () => onChange(Number(input.value) / 100));

    label.append(labelCopy, input);
    return label;
  }

  private createContrastSelect(settings: GameSettings): HTMLLabelElement {
    const label = document.createElement('label');
    label.className = 'setting-control setting-control-stacked';

    const labelCopy = document.createElement('span');
    labelCopy.textContent = 'Bullet Contrast';

    const select = document.createElement('select');
    const standard = document.createElement('option');
    standard.value = 'standard';
    standard.textContent = 'Standard';

    const high = document.createElement('option');
    high.value = 'high';
    high.textContent = 'High';

    select.append(standard, high);
    select.value = settings.bulletContrast;
    select.addEventListener('change', () => {
      this.updateSettings({
        ...this.getSettings(),
        bulletContrast: select.value === 'high' ? 'high' : 'standard'
      });
    });

    label.append(labelCopy, select);
    return label;
  }

  private updateSettings(settings: GameSettings): void {
    this.onChangeSettings(settings);
    this.statusText = 'Settings saved.';
    this.enter();
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.pendingAction) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    const action = this.pendingAction;
    const key = normalizeKey(event.key);
    this.pendingAction = null;
    this.onChangeSettings(updateKeyBinding(this.getSettings(), action, key));
    this.statusText = `${ACTION_LABELS[action]} set to ${formatKeyLabel(key)}.`;
    this.enter();
  };

  private addKeyListener(): void {
    if (this.isListening) {
      return;
    }

    const ownerWindow = this.uiRoot.ownerDocument.defaultView ?? window;
    ownerWindow.addEventListener('keydown', this.handleKeyDown, true);
    this.isListening = true;
  }

  private removeKeyListener(): void {
    if (!this.isListening) {
      return;
    }

    const ownerWindow = this.uiRoot.ownerDocument.defaultView ?? window;
    ownerWindow.removeEventListener('keydown', this.handleKeyDown, true);
    this.isListening = false;
  }
}
