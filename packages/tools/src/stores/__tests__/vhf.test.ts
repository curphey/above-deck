import { describe, it, expect, beforeEach } from 'vitest';
import { useVHFStore } from '../vhf';

describe('VHF Store', () => {
  beforeEach(() => {
    useVHFStore.setState(useVHFStore.getInitialState());
  });

  it('initialises with channel 16', () => {
    expect(useVHFStore.getState().channel).toBe(16);
  });

  it('clamps channel to valid range', () => {
    useVHFStore.getState().setChannel(0);
    expect(useVHFStore.getState().channel).toBe(1);
    useVHFStore.getState().setChannel(100);
    expect(useVHFStore.getState().channel).toBe(88);
  });

  it('clamps squelch to 0-9', () => {
    useVHFStore.getState().setSquelch(-1);
    expect(useVHFStore.getState().squelch).toBe(0);
    useVHFStore.getState().setSquelch(15);
    expect(useVHFStore.getState().squelch).toBe(9);
  });

  it('toggles power between 25W and 1W', () => {
    expect(useVHFStore.getState().power).toBe('25W');
    useVHFStore.getState().togglePower();
    expect(useVHFStore.getState().power).toBe('1W');
    useVHFStore.getState().togglePower();
    expect(useVHFStore.getState().power).toBe('25W');
  });

  it('adds and clears transcript entries', () => {
    const entry = { id: '1', type: 'rx' as const, station: 'CG', message: 'test', channel: 16, timestamp: new Date() };
    useVHFStore.getState().addTranscriptEntry(entry);
    expect(useVHFStore.getState().transcript).toHaveLength(1);
    useVHFStore.getState().clearTranscript();
    expect(useVHFStore.getState().transcript).toHaveLength(0);
  });

  it('has a valid default MMSI', () => {
    const mmsi = useVHFStore.getState().mmsi;
    expect(mmsi).toMatch(/^235\d{6}$/);
  });

  it('should initialize lcdScreen to vhf', () => {
    const { lcdScreen } = useVHFStore.getState();
    expect(lcdScreen).toBe('vhf');
  });

  it('should toggle lcdScreen between modes', () => {
    const { setLcdScreen } = useVHFStore.getState();
    setLcdScreen('ais');
    expect(useVHFStore.getState().lcdScreen).toBe('ais');
    setLcdScreen('vhf');
    expect(useVHFStore.getState().lcdScreen).toBe('vhf');
  });

  it('should store and clear aisTargets', () => {
    const { setAisTargets, clearAisTargets } = useVHFStore.getState();
    setAisTargets([{ mmsi: '235001234', name: 'BLUE HORIZON', distance: 0.8, bearing: 45, cpa: 0.3, sog: 5.2, cog: 225, vesselType: 'sailing' }]);
    expect(useVHFStore.getState().aisTargets).toHaveLength(1);
    clearAisTargets();
    expect(useVHFStore.getState().aisTargets).toHaveLength(0);
  });

  it('should track selectedAisTarget', () => {
    const { setSelectedAisTarget } = useVHFStore.getState();
    setSelectedAisTarget('235001234');
    expect(useVHFStore.getState().selectedAisTarget).toBe('235001234');
  });
});
