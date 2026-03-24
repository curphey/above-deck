import { useEffect, useRef } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import { useChartStore } from './chartStore';

// SVG triangle pointing up (will be rotated to COG via icon-rotate)
const TRIANGLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><polygon points="10,2 18,18 2,18" fill="COLOR" stroke="#081830" stroke-width="1.5"/></svg>`;

function createTriangleImage(map: MaplibreMap, id: string, color: string) {
  if (map.hasImage(id)) return;
  const svg = TRIANGLE_SVG.replace('COLOR', color);
  const img = new Image(20, 20);
  img.onload = () => {
    if (!map.hasImage(id)) {
      map.addImage(id, img, { sdf: false });
    }
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

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
  const imagesLoaded = useRef(false);

  useEffect(() => {
    if (!map || !isLoaded) return;

    // Create triangle images once
    if (!imagesLoaded.current) {
      createTriangleImage(map, 'vessel-blue', '#60a5fa');
      createTriangleImage(map, 'vessel-active', '#ffaa00');
      imagesLoaded.current = true;
    }

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
      // Triangle icon layer rotated to COG
      map.addLayer({
        id: 'ais-vessel-layer', type: 'symbol', source: 'ais-vessels',
        layout: {
          'icon-image': ['case', ['==', ['get', 'isActive'], 1], 'vessel-active', 'vessel-blue'],
          'icon-size': ['case', ['==', ['get', 'isActive'], 1], 0.9, 0.6],
          'icon-rotate': ['get', 'cog'],
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
      });
      map.addLayer({
        id: 'ais-vessel-label', type: 'symbol', source: 'ais-vessels',
        layout: {
          'text-field': ['get', 'name'], 'text-size': 9,
          'text-offset': [0, 1.5], 'text-anchor': 'top',
          'text-optional': true,
        },
        paint: { 'text-color': '#8b8b9e', 'text-halo-color': '#081830', 'text-halo-width': 1 },
      });
    }
  }, [map, isLoaded, vessels, ownPosition, activeRadioTarget, aisVisible, vesselTypeFilter]);

  return null;
}
