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

  it('toggles layer visibility', () => {
    expect(useChartStore.getState().layers.seamarks).toBe(true);
    useChartStore.getState().toggleLayer('seamarks');
    expect(useChartStore.getState().layers.seamarks).toBe(false);
    useChartStore.getState().toggleLayer('seamarks');
    expect(useChartStore.getState().layers.seamarks).toBe(true);
  });

  it('toggles vessel type filter', () => {
    expect(useChartStore.getState().vesselTypeFilter['Sailing']).toBe(true);
    useChartStore.getState().toggleVesselType('Sailing');
    expect(useChartStore.getState().vesselTypeFilter['Sailing']).toBe(false);
  });

  it('keeps rangeRings and showRangeRings in sync', () => {
    useChartStore.getState().toggleLayer('rangeRings');
    expect(useChartStore.getState().layers.rangeRings).toBe(false);
    expect(useChartStore.getState().showRangeRings).toBe(false);
  });

  it('defaults Passenger and Tanker to hidden', () => {
    expect(useChartStore.getState().vesselTypeFilter['Passenger']).toBe(false);
    expect(useChartStore.getState().vesselTypeFilter['Tanker']).toBe(false);
  });

  it('tracks layer panel open state', () => {
    expect(useChartStore.getState().layerPanelOpen).toBe(false);
    useChartStore.getState().setLayerPanelOpen(true);
    expect(useChartStore.getState().layerPanelOpen).toBe(true);
  });
});
