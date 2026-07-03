import { describe, expect, it } from 'vitest';

import { getAudioCueDefinition, getAudioCueGain } from '../../src/systems/AudioSystem';

describe('AudioSystem helpers', () => {
  it('defines original procedural cue shapes', () => {
    expect(getAudioCueDefinition('playerFire')).toMatchObject({
      waveform: 'square',
      frequency: 620
    });
    expect(getAudioCueDefinition('bossDefeated').durationSeconds).toBeGreaterThan(
      getAudioCueDefinition('enemyDestroyed').durationSeconds
    );
    expect(getAudioCueDefinition('bombUsed').gain).toBeGreaterThan(
      getAudioCueDefinition('graze').gain
    );
  });

  it('applies mute and master volume to cue gain', () => {
    expect(getAudioCueGain('playerFire', { muted: true, masterVolume: 1 })).toBe(0);
    expect(getAudioCueGain('playerFire', { muted: false, masterVolume: 0 })).toBe(0);
    expect(getAudioCueGain('playerFire', { muted: false, masterVolume: 0.5 })).toBeCloseTo(
      getAudioCueDefinition('playerFire').gain * 0.5
    );
  });
});
