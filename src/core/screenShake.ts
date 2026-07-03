import { clamp, type Vector2 } from './math';

export interface ScreenShakeSettings {
  readonly reducedMotion: boolean;
  readonly screenShake: number;
}

export interface ScreenShakeState {
  readonly durationSeconds: number;
  readonly secondsRemaining: number;
  readonly magnitude: number;
  readonly phase: number;
}

export const IDLE_SCREEN_SHAKE: ScreenShakeState = {
  durationSeconds: 0,
  secondsRemaining: 0,
  magnitude: 0,
  phase: 0
};

export function triggerScreenShake(
  state: ScreenShakeState,
  settings: ScreenShakeSettings,
  intensity: number
): ScreenShakeState {
  const normalizedIntensity = clamp(intensity, 0, 1);
  const normalizedSetting = clamp(settings.screenShake, 0, 1);

  if (settings.reducedMotion || normalizedIntensity <= 0 || normalizedSetting <= 0) {
    return state;
  }

  const durationSeconds = 0.08 + normalizedIntensity * 0.16;
  const magnitude = normalizedIntensity * normalizedSetting * 16;

  return {
    durationSeconds: Math.max(state.durationSeconds, durationSeconds),
    secondsRemaining: Math.max(state.secondsRemaining, durationSeconds),
    magnitude: Math.max(state.magnitude, magnitude),
    phase: state.phase
  };
}

export function advanceScreenShake(state: ScreenShakeState, dt: number): ScreenShakeState {
  if (state.secondsRemaining <= 0) {
    return IDLE_SCREEN_SHAKE;
  }

  const secondsRemaining = Math.max(0, state.secondsRemaining - Math.max(0, dt));

  if (secondsRemaining <= 0) {
    return IDLE_SCREEN_SHAKE;
  }

  return {
    ...state,
    secondsRemaining,
    phase: state.phase + dt * 52
  };
}

export function getScreenShakeOffset(state: ScreenShakeState): Vector2 {
  if (state.secondsRemaining <= 0 || state.durationSeconds <= 0 || state.magnitude <= 0) {
    return { x: 0, y: 0 };
  }

  const falloff = clamp(state.secondsRemaining / state.durationSeconds, 0, 1);
  const magnitude = state.magnitude * falloff * falloff;

  return {
    x: Math.sin(state.phase * 1.73) * magnitude,
    y: Math.cos(state.phase * 2.11) * magnitude * 0.72
  };
}
