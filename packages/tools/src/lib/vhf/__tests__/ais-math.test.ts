import { describe, it, expect } from 'vitest';
import { distanceNM, bearingDeg, estimateCPA } from '../ais-math';

describe('ais-math', () => {
  describe('distanceNM', () => {
    it('returns 0 for same point', () => {
      expect(distanceNM(50, -5, 50, -5)).toBe(0);
    });

    it('computes reasonable distance (Falmouth to Lizard ~12nm)', () => {
      const d = distanceNM(50.15, -5.07, 49.96, -5.20);
      expect(d).toBeGreaterThan(10);
      expect(d).toBeLessThan(15);
    });

    it('computes 60nm for 1 degree latitude', () => {
      const d = distanceNM(50, 0, 51, 0);
      expect(d).toBeCloseTo(60, 0);
    });
  });

  describe('bearingDeg', () => {
    it('returns ~0 for due north', () => {
      const b = bearingDeg(50, -5, 51, -5);
      expect(b).toBeCloseTo(0, 0);
    });

    it('returns ~90 for due east', () => {
      const b = bearingDeg(50, -5, 50, -4);
      expect(b).toBeCloseTo(90, 0);
    });

    it('returns ~180 for due south', () => {
      const b = bearingDeg(51, -5, 50, -5);
      expect(b).toBeCloseTo(180, 0);
    });

    it('returns ~270 for due west', () => {
      const b = bearingDeg(50, -4, 50, -5);
      expect(b).toBeCloseTo(270, 0);
    });

    it('returns value in 0-360 range', () => {
      const b = bearingDeg(50, -5, 49, -6);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(360);
    });
  });

  describe('estimateCPA', () => {
    it('returns current distance for stationary vessels', () => {
      const cpa = estimateCPA(50, -5, 0, 0, 50.1, -5, 0, 0);
      const dist = distanceNM(50, -5, 50.1, -5);
      expect(cpa).toBeCloseTo(dist, 1);
    });

    it('returns smaller CPA for converging courses', () => {
      // Own vessel heading east, target heading west, on converging tracks
      const cpa = estimateCPA(50, -5, 5, 90, 50, -4.5, 5, 270);
      const currentDist = distanceNM(50, -5, 50, -4.5);
      expect(cpa).toBeLessThan(currentDist);
    });

    it('returns current distance for diverging courses', () => {
      // Both heading away from each other
      const cpa = estimateCPA(50, -5, 5, 270, 50, -4, 5, 90);
      const currentDist = distanceNM(50, -5, 50, -4);
      // CPA should be close to current distance (they're moving apart)
      expect(cpa).toBeCloseTo(currentDist, 0);
    });
  });
});
