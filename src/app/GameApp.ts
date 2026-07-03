import { generateStarfield, starCountForViewport } from '../core/starfield';

const TITLE_STARFIELD_SEED = 'STARBREAK-SALVAGE-TITLE';

export class GameApp {
  private readonly canvas: HTMLCanvasElement;
  private readonly overlay: HTMLElement;
  private readonly status: HTMLParagraphElement;
  private readonly handleResize = (): void => this.renderStarfield();

  public constructor(private readonly root: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'starfield-canvas';
    this.canvas.setAttribute('aria-label', 'Starfield flight deck');
    this.canvas.setAttribute('role', 'img');

    const overlay = document.createElement('main');
    overlay.className = 'title-shell';
    overlay.setAttribute('aria-labelledby', 'game-title');

    const title = document.createElement('h1');
    title.id = 'game-title';
    title.textContent = 'Starbreak Salvage';

    const tagline = document.createElement('p');
    tagline.className = 'tagline';
    tagline.textContent = 'Disposable pilots. Unsafe weapons. Profitable wreckage.';

    const startButton = document.createElement('button');
    startButton.className = 'start-button';
    startButton.type = 'button';
    startButton.textContent = 'Start Run';
    startButton.addEventListener('click', () => this.handleStartRun(startButton));

    this.status = document.createElement('p');
    this.status.className = 'boot-status';
    this.status.dataset.testid = 'boot-status';
    this.status.textContent = 'Awaiting salvage contract.';

    overlay.append(title, tagline, startButton, this.status);
    this.overlay = overlay;
  }

  public start(): void {
    this.root.replaceChildren(this.canvas, this.overlay);
    window.addEventListener('resize', this.handleResize);
    this.renderStarfield();
  }

  public stop(): void {
    window.removeEventListener('resize', this.handleResize);
    this.root.replaceChildren();
  }

  private handleStartRun(startButton: HTMLButtonElement): void {
    startButton.textContent = 'Contract Armed';
    startButton.classList.add('is-armed');
    this.status.textContent = 'Contract board warming up for the first playable slice.';
  }

  private renderStarfield(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(window.innerWidth * dpr));
    const height = Math.max(1, Math.floor(window.innerHeight * dpr));

    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;

    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D rendering is unavailable.');
    }

    const stars = generateStarfield({
      width,
      height,
      count: starCountForViewport(width, height),
      seed: TITLE_STARFIELD_SEED
    });

    const background = context.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, '#040612');
    background.addColorStop(0.42, '#101022');
    background.addColorStop(0.68, '#151026');
    background.addColorStop(1, '#1a1018');
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    this.paintNebula(context, width, height);

    for (const star of stars) {
      context.globalAlpha = star.alpha;
      context.fillStyle = star.tint;
      context.beginPath();
      context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      context.fill();
    }

    context.globalAlpha = 1;
    this.paintHorizonGrid(context, width, height);
  }

  private paintNebula(context: CanvasRenderingContext2D, width: number, height: number): void {
    const cyanWash = context.createRadialGradient(
      width * 0.2,
      height * 0.24,
      0,
      width * 0.2,
      height * 0.24,
      width * 0.72
    );
    cyanWash.addColorStop(0, 'rgba(65, 234, 255, 0.18)');
    cyanWash.addColorStop(1, 'rgba(65, 234, 255, 0)');
    context.fillStyle = cyanWash;
    context.fillRect(0, 0, width, height);

    const roseWash = context.createRadialGradient(
      width * 0.84,
      height * 0.56,
      0,
      width * 0.84,
      height * 0.56,
      width * 0.58
    );
    roseWash.addColorStop(0, 'rgba(255, 85, 188, 0.12)');
    roseWash.addColorStop(1, 'rgba(255, 85, 188, 0)');
    context.fillStyle = roseWash;
    context.fillRect(0, 0, width, height);
  }

  private paintHorizonGrid(context: CanvasRenderingContext2D, width: number, height: number): void {
    context.save();
    context.globalAlpha = 0.17;
    context.strokeStyle = '#ffd166';
    context.lineWidth = Math.max(1, width / 1200);

    const horizon = height * 0.62;
    for (let i = 0; i < 9; i += 1) {
      const y = horizon + i * i * height * 0.008;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    context.restore();
  }
}
