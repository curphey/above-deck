import { describe, it, expect } from 'vitest';
import { CURATED_REGIONS, findRegionByName } from '../regions';

describe('CURATED_REGIONS', () => {
  it('should contain exactly 20 regions', () => {
    expect(CURATED_REGIONS).toHaveLength(20);
  });

  it('should have valid latitudes (-90..90) for all regions', () => {
    for (const r of CURATED_REGIONS) {
      expect(r.lat).toBeGreaterThanOrEqual(-90);
      expect(r.lat).toBeLessThanOrEqual(90);
    }
  });

  it('should have valid longitudes (-180..180) for all regions', () => {
    for (const r of CURATED_REGIONS) {
      expect(r.lon).toBeGreaterThanOrEqual(-180);
      expect(r.lon).toBeLessThanOrEqual(180);
    }
  });

  it('should have positive peak sun hours for all regions', () => {
    for (const r of CURATED_REGIONS) {
      expect(r.psh).toBeGreaterThan(0);
    }
  });

  it('should have derating factors between 0 and 1 for all regions', () => {
    for (const r of CURATED_REGIONS) {
      expect(r.deratingFactor).toBeGreaterThan(0);
      expect(r.deratingFactor).toBeLessThanOrEqual(1);
    }
  });

  it('should have non-empty names for all regions', () => {
    for (const r of CURATED_REGIONS) {
      expect(r.name.length).toBeGreaterThan(0);
    }
  });

  it('should have unique names', () => {
    const names = CURATED_REGIONS.map((r) => r.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('findRegionByName', () => {
  it('should find an existing region', () => {
    const region = findRegionByName('Caribbean');
    expect(region).toBeDefined();
    expect(region!.lat).toBe(15.0);
    expect(region!.psh).toBe(5.5);
  });

  it('should return undefined for unknown region', () => {
    expect(findRegionByName('Narnia')).toBeUndefined();
  });
});
