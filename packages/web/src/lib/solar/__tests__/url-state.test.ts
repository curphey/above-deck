import { describe, it, expect } from 'vitest';
import { encodeConfig, decodeConfig } from '../url-state';

describe('URL state encoding/decoding', () => {
  it('should roundtrip encode and decode a config object', () => {
    const config = {
      boatName: 'Sea Breeze',
      boatType: 'mono',
      systemVoltage: 12,
      regionName: 'Caribbean',
      latitude: 15.0,
      longitude: -61.0,
    };

    const encoded = encodeConfig(config);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = decodeConfig(encoded);
    expect(decoded).toEqual(config);
  });

  it('should handle complex nested objects', () => {
    const config = {
      appliances: [
        { name: 'Fridge', watts: 60 },
        { name: 'Lights', watts: 25 },
      ],
      nested: { deep: { value: true } },
    };

    const encoded = encodeConfig(config);
    const decoded = decodeConfig(encoded);
    expect(decoded).toEqual(config);
  });

  it('should return null for empty string', () => {
    expect(decodeConfig('')).toBeNull();
  });

  it('should return null for invalid encoded data', () => {
    expect(decodeConfig('not-valid-lz-data!!!')).toBeNull();
  });

  it('should return null for corrupted data', () => {
    expect(decodeConfig('abc123xyz')).toBeNull();
  });
});
