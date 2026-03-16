import { describe, it, expect } from 'vitest';
import { getProfileAdjustments } from '../cruising-profiles';

describe('getProfileAdjustments', () => {
  it('should return correct values for weekend style', () => {
    const profile = getProfileAdjustments('weekend');
    expect(profile.autonomyDays).toBe(1);
    expect(profile.shoreCharging).toBe(true);
    expect(profile.hoursMultiplier).toBe(0.6);
    expect(profile.description).toBeTruthy();
  });

  it('should return correct values for coastal style', () => {
    const profile = getProfileAdjustments('coastal');
    expect(profile.autonomyDays).toBe(2);
    expect(profile.shoreCharging).toBe(false);
    expect(profile.hoursMultiplier).toBe(1.0);
    expect(profile.description).toBeTruthy();
  });

  it('should return correct values for offshore style', () => {
    const profile = getProfileAdjustments('offshore');
    expect(profile.autonomyDays).toBe(3);
    expect(profile.shoreCharging).toBe(false);
    expect(profile.hoursMultiplier).toBe(1.3);
    expect(profile.description).toBeTruthy();
  });

  it('should have increasing autonomy days from weekend to offshore', () => {
    const weekend = getProfileAdjustments('weekend');
    const coastal = getProfileAdjustments('coastal');
    const offshore = getProfileAdjustments('offshore');
    expect(weekend.autonomyDays).toBeLessThan(coastal.autonomyDays);
    expect(coastal.autonomyDays).toBeLessThan(offshore.autonomyDays);
  });

  it('should have increasing hours multiplier from weekend to offshore', () => {
    const weekend = getProfileAdjustments('weekend');
    const coastal = getProfileAdjustments('coastal');
    const offshore = getProfileAdjustments('offshore');
    expect(weekend.hoursMultiplier).toBeLessThan(coastal.hoursMultiplier);
    expect(coastal.hoursMultiplier).toBeLessThan(offshore.hoursMultiplier);
  });
});
