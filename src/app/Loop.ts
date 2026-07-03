import { clamp } from '../core/math';

export const FIXED_DT_SECONDS = 1 / 60;
export const MAX_FRAME_SECONDS = 0.25;

export interface FixedStepAdvance {
  readonly frameSeconds: number;
  readonly steps: number;
  readonly accumulatorSeconds: number;
  readonly alpha: number;
}

export interface FrameStats {
  readonly fps: number;
  readonly steps: number;
  readonly alpha: number;
  readonly accumulatorSeconds: number;
}

export interface LoopCallbacks {
  readonly update: (dt: number) => void;
  readonly render: (alpha: number) => void;
  readonly onFrame?: (stats: FrameStats) => void;
}

export function advanceFixedStepAccumulator(
  accumulatorSeconds: number,
  elapsedSeconds: number,
  fixedDeltaSeconds = FIXED_DT_SECONDS,
  maxFrameSeconds = MAX_FRAME_SECONDS
): FixedStepAdvance {
  const safeFixedDelta = Math.max(Number.EPSILON, fixedDeltaSeconds);
  const frameSeconds = clamp(Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0, 0, maxFrameSeconds);
  let nextAccumulator = Math.max(0, accumulatorSeconds) + frameSeconds;
  let steps = 0;

  while (nextAccumulator >= safeFixedDelta) {
    nextAccumulator -= safeFixedDelta;
    steps += 1;
  }

  return {
    frameSeconds,
    steps,
    accumulatorSeconds: nextAccumulator,
    alpha: clamp(nextAccumulator / safeFixedDelta, 0, 1)
  };
}

export class Loop {
  private frameHandle: number | null = null;
  private lastNowMs: number | null = null;
  private accumulatorSeconds = 0;

  public constructor(
    private readonly callbacks: LoopCallbacks,
    private readonly ownerWindow: Window = window
  ) {}

  public start(): void {
    if (this.frameHandle !== null) {
      return;
    }

    this.lastNowMs = null;
    this.accumulatorSeconds = 0;
    this.frameHandle = this.ownerWindow.requestAnimationFrame(this.tick);
  }

  public stop(): void {
    if (this.frameHandle === null) {
      return;
    }

    this.ownerWindow.cancelAnimationFrame(this.frameHandle);
    this.frameHandle = null;
  }

  private readonly tick = (nowMs: number): void => {
    const previousNowMs = this.lastNowMs ?? nowMs;
    this.lastNowMs = nowMs;

    const elapsedSeconds = (nowMs - previousNowMs) / 1000;
    const advanced = advanceFixedStepAccumulator(this.accumulatorSeconds, elapsedSeconds);
    this.accumulatorSeconds = advanced.accumulatorSeconds;

    for (let index = 0; index < advanced.steps; index += 1) {
      this.callbacks.update(FIXED_DT_SECONDS);
    }

    this.callbacks.render(advanced.alpha);
    this.callbacks.onFrame?.({
      fps: advanced.frameSeconds > 0 ? 1 / advanced.frameSeconds : 0,
      steps: advanced.steps,
      alpha: advanced.alpha,
      accumulatorSeconds: advanced.accumulatorSeconds
    });

    this.frameHandle = this.ownerWindow.requestAnimationFrame(this.tick);
  };
}
