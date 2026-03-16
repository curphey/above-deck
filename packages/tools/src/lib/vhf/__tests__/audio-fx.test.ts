import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RadioAudioFX } from '../audio-fx';

class MockAudioContext {
  createBiquadFilter = vi.fn(() => ({ type: '', frequency: { value: 0 }, Q: { value: 0 }, connect: vi.fn() }));
  createDynamicsCompressor = vi.fn(() => ({ connect: vi.fn() }));
  createGain = vi.fn(() => ({ gain: { value: 0 }, connect: vi.fn() }));
  createOscillator = vi.fn(() => ({ connect: vi.fn(), start: vi.fn(), stop: vi.fn(), type: '', frequency: { value: 0 } }));
  destination = {};
  close = vi.fn();
}

beforeEach(() => {
  vi.stubGlobal('AudioContext', MockAudioContext);
});

describe('RadioAudioFX', () => {
  it('creates without error', () => {
    const fx = new RadioAudioFX();
    expect(fx).toBeDefined();
  });

  it('setSquelch clamps to 0-9', () => {
    const fx = new RadioAudioFX();
    expect(() => fx.setSquelch(0)).not.toThrow();
    expect(() => fx.setSquelch(9)).not.toThrow();
  });

  it('dispose cleans up AudioContext', () => {
    const fx = new RadioAudioFX();
    fx.dispose();
    fx.dispose(); // double dispose should not throw
  });
});
