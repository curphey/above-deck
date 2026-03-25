import { useEffect } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import { useChartStore } from './chartStore';

interface ChartVesselLayerProps {
  map: MaplibreMap | null;
  isLoaded: boolean;
}

export function ChartVesselLayer({ map, isLoaded }: ChartVesselLayerProps) {
  const vessels = useChartStore(s => s.vessels);
  const ownPosition = useChartStore(s => s.ownPosition);
  const activeRadioTarget = useChartStore(s => s.activeRadioTarget);
  const aisVisible = useChartStore(s => s.layers.aisVessels);
  const vesselTypeFilter = useChartStore(s => s.vesselTypeFilter);

  useEffect(() => {
    if (!map || !isLoaded) return;

    // Own vessel (always visible)
    const ownGeoJSON: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [ownPosition.lon, ownPosition.lat] },
        properties: { name: 'You', cog: ownPosition.cog, sog: ownPosition.sog },
      }],
    };

    const ownSrc = map.getSource('own-vessel');
    if (ownSrc && 'setData' in ownSrc) {
      (ownSrc as any).setData(ownGeoJSON);
    } else if (!ownSrc) {
      map.addSource('own-vessel', { type: 'geojson', data: ownGeoJSON });
      map.addLayer({
        id: 'own-vessel-layer', type: 'circle', source: 'own-vessel',
        paint: { 'circle-radius': 7, 'circle-color': '#4ade80', 'circle-stroke-width': 2, 'circle-stroke-color': '#081830' },
      });
      map.addLayer({
        id: 'own-vessel-label', type: 'symbol', source: 'own-vessel',
        layout: { 'text-field': ['get', 'name'], 'text-size': 10, 'text-offset': [0, 1.5], 'text-anchor': 'top' },
        paint: { 'text-color': '#4ade80', 'text-halo-color': '#081830', 'text-halo-width': 1 },
      });
    }

    // AIS vessels — filter by type and visibility
    const filteredVessels = aisVisible
      ? vessels.filter(v => vesselTypeFilter[v.type] !== false)
      : [];

    const vesselGeoJSON: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: filteredVessels.map(v => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [v.lon, v.lat] },
        properties: {
          name: v.name, callSign: v.callSign, cog: v.cog, sog: v.sog, type: v.type,
          isActive: (v.callSign === activeRadioTarget || v.name === activeRadioTarget) ? 1 : 0,
        },
      })),
    };

    const aisSrc = map.getSource('ais-vessels');
    if (aisSrc && 'setData' in aisSrc) {
      (aisSrc as any).setData(vesselGeoJSON);
    } else if (!aisSrc) {
      map.addSource('ais-vessels', { type: 'geojson', data: vesselGeoJSON });
      // Vessel dots — blue normally, gold when active radio target
      map.addLayer({
        id: 'ais-vessel-layer', type: 'circle', source: 'ais-vessels',
        paint: {
          'circle-radius': ['case', ['==', ['get', 'isActive'], 1], 8, 5],
          'circle-color': ['case', ['==', ['get', 'isActive'], 1], '#ffaa00', '#60a5fa'],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#081830',
        },
      });
      // Name labels — always visible
      map.addLayer({
        id: 'ais-vessel-label', type: 'symbol', source: 'ais-vessels',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 10,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': ['case', ['==', ['get', 'isActive'], 1], '#ffaa00', '#8b8b9e'],
          'text-halo-color': '#081830',
          'text-halo-width': 1.5,
        },
      });
    }
  }, [map, isLoaded, vessels, ownPosition, activeRadioTarget, aisVisible, vesselTypeFilter]);

  return null;
}
