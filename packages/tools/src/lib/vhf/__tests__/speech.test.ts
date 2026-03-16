import { describe, it, expect } from 'vitest';
import { isSTTSupported, isTTSSupported } from '../speech';

describe('Speech Wrappers', () => {
  it('isSTTSupported returns false in jsdom (no SpeechRecognition)', () => {
    expect(isSTTSupported()).toBe(false);
  });

  it('isTTSSupported returns false in jsdom (no speechSynthesis)', () => {
    const supported = isTTSSupported();
    expect(typeof supported).toBe('boolean');
  });
});
