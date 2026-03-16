import { describe, it, expect } from 'vitest';
import { calculateDelta, getDeltaColor, formatDelta } from '../use-delta';

describe('calculateDelta', () => {
  it('returns positive delta when current > previous', () => {
    expect(calculateDelta(200, 100)).toBe(100);
  });
  it('returns negative delta when current < previous', () => {
    expect(calculateDelta(50, 100)).toBe(-50);
  });
  it('returns 0 when previous is null', () => {
    expect(calculateDelta(100, null)).toBe(0);
  });
  it('returns 0 when current equals previous', () => {
    expect(calculateDelta(100, 100)).toBe(0);
  });
});

describe('getDeltaColor', () => {
  it('drain increase is coral (bad)', () => {
    expect(getDeltaColor('drain', 100)).toBe('coral');
  });
  it('drain decrease is green (good)', () => {
    expect(getDeltaColor('drain', -50)).toBe('green');
  });
  it('charge increase is green (good)', () => {
    expect(getDeltaColor('charge', 100)).toBe('green');
  });
  it('charge decrease is coral (bad)', () => {
    expect(getDeltaColor('charge', -50)).toBe('coral');
  });
  it('balance toward surplus is green', () => {
    expect(getDeltaColor('balance', 50)).toBe('green');
  });
  it('balance toward deficit is coral', () => {
    expect(getDeltaColor('balance', -50)).toBe('coral');
  });
  it('autonomy increase is green', () => {
    expect(getDeltaColor('autonomy', 1)).toBe('green');
  });
  it('zero delta is grey', () => {
    expect(getDeltaColor('drain', 0)).toBe('grey');
  });
});

describe('formatDelta', () => {
  it('formats positive delta with + and up arrow', () => {
    expect(formatDelta(120)).toBe('+120 ↑');
  });
  it('formats negative delta with down arrow', () => {
    expect(formatDelta(-50)).toBe('-50 ↓');
  });
  it('returns empty string for zero', () => {
    expect(formatDelta(0)).toBe('');
  });
  it('rounds decimal values', () => {
    expect(formatDelta(120.7)).toBe('+121 ↑');
  });
});
