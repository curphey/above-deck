import { useEffect } from 'react';
import { useChartStore } from '../chart/chartStore';
import { useVHFStore } from '@/stores/vhf';
import { distanceNM, bearingDeg, estimateCPA } from '@/lib/vhf/ais-math';
import type { AISTarget } from '@/lib/vhf/types';

/**
 * Bridges chart store vessel data into the VHF store as AIS targets.
 * Computes distance, bearing, and CPA from own position for each vessel.
 * Updates every time chart vessels or own position change.
 */
export function useAISBridge() {
  const vessels = useChartStore(s => s.vessels);
  const ownPosition = useChartStore(s => s.ownPosition);
  const setAisTargets = useVHFStore(s => s.setAisTargets);

  useEffect(() => {
    if (!vessels.length) {
      setAisTargets([]);
      return;
    }

    const targets: AISTarget[] = vessels
      .map((v) => {
        const dist = distanceNM(ownPosition.lat, ownPosition.lon, v.lat, v.lon);
        const brg = bearingDeg(ownPosition.lat, ownPosition.lon, v.lat, v.lon);
        const cpa = estimateCPA(
          ownPosition.lat, ownPosition.lon, ownPosition.sog, ownPosition.cog,
          v.lat, v.lon, v.sog, v.cog,
        );
        return {
          mmsi: v.callSign || 'unknown',
          name: v.name,
          distance: Math.round(dist * 10) / 10,
          bearing: Math.round(brg),
          cpa: Math.round(cpa * 10) / 10,
          sog: v.sog,
          cog: v.cog,
          vesselType: mapVesselType(v.type),
        };
      })
      .filter((t) => t.distance <= 25) // Only show vessels within 25nm
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20); // Cap at 20 targets

    setAisTargets(targets);
  }, [vessels, ownPosition, setAisTargets]);
}

function mapVesselType(type: string): AISTarget['vesselType'] {
  const lower = type.toLowerCase();
  if (lower.includes('sail')) return 'sailing';
  if (lower.includes('cargo')) return 'cargo';
  if (lower.includes('tanker')) return 'tanker';
  if (lower.includes('fish')) return 'fishing';
  if (lower.includes('passenger')) return 'passenger';
  if (lower.includes('motor') || lower.includes('pleasure')) return 'motor';
  return 'vessel';
}
