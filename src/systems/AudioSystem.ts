import type { GameSettings } from '../core/settingsData';
import type { CombatFeedbackCue } from './CombatFeedback';

export interface AudioCueDefinition {
  readonly waveform: OscillatorType;
  readonly frequency: number;
  readonly endFrequency: number;
  readonly durationSeconds: number;
  readonly gain: number;
}

export interface AudioPlaybackSettings {
  readonly muted: boolean;
  readonly masterVolume: number;
}

type AudioContextConstructor = new () => AudioContext;
type WindowWithAudioContext = Window & {
  readonly AudioContext?: AudioContextConstructor;
  readonly webkitAudioContext?: AudioContextConstructor;
};

const CUE_DEFINITIONS: Readonly<Record<CombatFeedbackCue, AudioCueDefinition>> = {
  playerFire: {
    waveform: 'square',
    frequency: 620,
    endFrequency: 390,
    durationSeconds: 0.045,
    gain: 0.045
  },
  specialActivated: {
    waveform: 'triangle',
    frequency: 520,
    endFrequency: 1180,
    durationSeconds: 0.16,
    gain: 0.07
  },
  bombUsed: {
    waveform: 'sawtooth',
    frequency: 92,
    endFrequency: 34,
    durationSeconds: 0.28,
    gain: 0.105
  },
  graze: {
    waveform: 'triangle',
    frequency: 980,
    endFrequency: 1320,
    durationSeconds: 0.055,
    gain: 0.032
  },
  enemyDestroyed: {
    waveform: 'sawtooth',
    frequency: 180,
    endFrequency: 78,
    durationSeconds: 0.12,
    gain: 0.08
  },
  bossDefeated: {
    waveform: 'sawtooth',
    frequency: 120,
    endFrequency: 42,
    durationSeconds: 0.32,
    gain: 0.11
  },
  pickupCollected: {
    waveform: 'triangle',
    frequency: 760,
    endFrequency: 980,
    durationSeconds: 0.075,
    gain: 0.052
  },
  playerHit: {
    waveform: 'square',
    frequency: 110,
    endFrequency: 64,
    durationSeconds: 0.18,
    gain: 0.105
  },
  bossSpawned: {
    waveform: 'sawtooth',
    frequency: 92,
    endFrequency: 150,
    durationSeconds: 0.28,
    gain: 0.09
  },
  bossWarning: {
    waveform: 'triangle',
    frequency: 440,
    endFrequency: 420,
    durationSeconds: 0.11,
    gain: 0.065
  },
  sectorClear: {
    waveform: 'triangle',
    frequency: 520,
    endFrequency: 820,
    durationSeconds: 0.24,
    gain: 0.085
  },
  runEnd: {
    waveform: 'sawtooth',
    frequency: 160,
    endFrequency: 48,
    durationSeconds: 0.34,
    gain: 0.11
  }
};

export function getAudioCueDefinition(cue: CombatFeedbackCue): AudioCueDefinition {
  return CUE_DEFINITIONS[cue];
}

export function getAudioCueGain(cue: CombatFeedbackCue, settings: AudioPlaybackSettings): number {
  if (settings.muted || settings.masterVolume <= 0) {
    return 0;
  }

  return getAudioCueDefinition(cue).gain * Math.min(1, settings.masterVolume);
}

export class AudioSystem {
  private context: AudioContext | null = null;
  private settings: AudioPlaybackSettings = {
    muted: false,
    masterVolume: 0.8
  };
  private isStarted = false;

  public constructor(private readonly ownerWindow: WindowWithAudioContext = window) {}

  public start(): void {
    if (this.isStarted) {
      return;
    }

    this.ownerWindow.addEventListener('pointerdown', this.handleUserGesture, { passive: true });
    this.ownerWindow.addEventListener('keydown', this.handleUserGesture);
    this.isStarted = true;
  }

  public stop(): void {
    if (!this.isStarted) {
      return;
    }

    this.ownerWindow.removeEventListener('pointerdown', this.handleUserGesture);
    this.ownerWindow.removeEventListener('keydown', this.handleUserGesture);
    void this.context?.close().catch(() => {});
    this.context = null;
    this.isStarted = false;
  }

  public setSettings(settings: Pick<GameSettings, 'muted' | 'masterVolume'>): void {
    this.settings = {
      muted: settings.muted,
      masterVolume: settings.masterVolume
    };
  }

  public playCue(cue: CombatFeedbackCue): void {
    const gainValue = getAudioCueGain(cue, this.settings);

    if (gainValue <= 0) {
      return;
    }

    const context = this.getContext();

    if (!context) {
      return;
    }

    void context.resume().catch(() => {});
    playOscillatorCue(context, getAudioCueDefinition(cue), gainValue);
  }

  private readonly handleUserGesture = (): void => {
    if (this.settings.muted) {
      return;
    }

    const context = this.getContext();
    void context?.resume().catch(() => {});
  };

  private getContext(): AudioContext | null {
    if (this.context) {
      return this.context;
    }

    const AudioContextType = this.ownerWindow.AudioContext ?? this.ownerWindow.webkitAudioContext;

    if (!AudioContextType) {
      return null;
    }

    try {
      this.context = new AudioContextType();
      return this.context;
    } catch {
      return null;
    }
  }
}

function playOscillatorCue(
  context: AudioContext,
  definition: AudioCueDefinition,
  gainValue: number
): void {
  try {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startAt = context.currentTime;
    const endAt = startAt + definition.durationSeconds;

    oscillator.type = definition.waveform;
    oscillator.frequency.setValueAtTime(definition.frequency, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, definition.endFrequency), endAt);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainValue), startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(endAt + 0.01);
  } catch {
    // Web Audio can be unavailable or suspended in hardened browser contexts.
  }
}
