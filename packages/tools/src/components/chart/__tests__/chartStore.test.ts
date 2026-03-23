import { describe, it, expect, beforeEach } from 'vitest';
import { useChartStore } from '../chartStore';

describe('chartStore', () => {
  beforeEach(() => useChartStore.setState(useChartStore.getInitialState()));

  it('initializes with empty vessels', () => {
    expect(useChartStore.getState().vessels).toEqual([]);
  });

  it('updates vessels', () => {
    useChartStore.getState().setVessels([
      { name: 'Doris May', callSign: 'MDMX9', lat: 50.15, lon: -5.07, sog: 5.2, cog: 80, type: 'sailing' },
    ]);
    expect(useChartStore.getState().vessels).toHaveLength(1);
  });

  it('updates own position', () => {
    useChartStore.getState().setOwnPosition({ lat: 50.09, lon: -5.04, sog: 5.2, cog: 320 });
    expect(useChartStore.getState().ownPosition.lat).toBe(50.09);
  });

  it('updates weather', () => {
    useChartStore.getState().setWeather({ windSpeedKnots: 15, windDirection: 220, seaState: 'moderate', visibility: 'good' });
    expect(useChartStore.getState().weather.windSpeedKnots).toBe(15);
  });

  it('sets active radio target', () => {
    useChartStore.getState().setActiveRadioTarget('doris-may');
    expect(useChartStore.getState().activeRadioTarget).toBe('doris-may');
  });

  it('sets chart orientation', () => {
    useChartStore.getState().setOrientation('head-up');
    expect(useChartStore.getState().orientation).toBe('head-up');
  });
});
