import { useEffect, useRef, useCallback } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import maplibregl from 'maplibre-gl';
import { fetchNauticalPOIs, type NauticalPOI, type POIType } from '@/lib/chart/overpass';

const POI_ICONS: Record<POIType, string> = {
  marina: '⚓',
  harbour: '🏗',
  anchorage: '⚓',
  fuel: '⛽',
  boatyard: '🔧',
  slipway: '🛥',
};

const POI_COLORS: Record<POIType, string> = {
  marina: '#60a5fa',
  harbour: '#60a5fa',
  anchorage: '#4ade80',
  fuel: '#f87171',
  boatyard: '#8b8b9e',
  slipway: '#8b8b9e',
};

interface ChartPOILayerProps {
  map: MaplibreMap | null;
  isLoaded: boolean;
  visible?: boolean;
}

export function ChartPOILayer({ map, isLoaded, visible = true }: ChartPOILayerProps) {
  const poisRef = useRef<NauticalPOI[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastBboxRef = useRef('');

  const loadPOIs = useCallback(async () => {
    if (!map || !visible) return;

    const bounds = map.getBounds();
    const zoom = map.getZoom();

    // Only fetch at zoom >= 8 (POIs are meaningless at global zoom)
    if (zoom < 8) {
      updateSource(map, []);
      return;
    }

    // Avoid re-fetching for the same area
    const bboxKey = [
      bounds.getSouth().toFixed(2), bounds.getWest().toFixed(2),
      bounds.getNorth().toFixed(2), bounds.getEast().toFixed(2),
    ].join(',');
    if (bboxKey === lastBboxRef.current) return;
    lastBboxRef.current = bboxKey;

    // Cancel previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const pois = await fetchNauticalPOIs(
        bounds.getSouth(), bounds.getWest(),
        bounds.getNorth(), bounds.getEast(),
        controller.signal,
      );
      poisRef.current = pois;
      updateSource(map, pois);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.warn('[POI] Overpass query failed:', e.message);
      }
    }
  }, [map, visible]);

  // Set up source and load on map events
  useEffect(() => {
    if (!map || !isLoaded) return;

    // Create GeoJSON source if not exists
    if (!map.getSource('nautical-pois')) {
      map.addSource('nautical-pois', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'poi-labels', type: 'symbol', source: 'nautical-pois',
        layout: {
          'text-field': ['concat', ['get', 'icon'], ' ', ['get', 'name']],
          'text-size': 11,
          'text-anchor': 'left',
          'text-offset': [0.5, 0],
          'text-allow-overlap': false,
          'text-optional': true,
        },
        paint: {
          'text-color': ['get', 'color'],
          'text-halo-color': '#081830',
          'text-halo-width': 1.5,
        },
      });
    }

    // Load POIs on map idle (after pan/zoom)
    const onIdle = () => loadPOIs();
    map.on('moveend', onIdle);
    loadPOIs(); // Initial load

    // Click handler for POI popups
    const onClick = (e: any) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['poi-labels'] });
      if (!features.length) return;

      const props = features[0].properties;
      const coords = (features[0].geometry as any).coordinates;

      popupRef.current?.remove();
      popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: '220px' })
        .setLngLat(coords)
        .setHTML(buildPopupHTML(props))
        .addTo(map);
    };
    map.on('click', 'poi-labels', onClick);

    // Cursor style
    map.on('mouseenter', 'poi-labels', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'poi-labels', () => { map.getCanvas().style.cursor = ''; });

    return () => {
      map.off('moveend', onIdle);
      map.off('click', 'poi-labels', onClick);
      abortRef.current?.abort();
      popupRef.current?.remove();
    };
  }, [map, isLoaded, loadPOIs]);

  // Toggle visibility
  useEffect(() => {
    if (!map || !isLoaded) return;
    const layer = map.getLayer('poi-labels');
    if (layer) {
      map.setLayoutProperty('poi-labels', 'visibility', visible ? 'visible' : 'none');
    }
    if (visible) loadPOIs();
  }, [map, isLoaded, visible, loadPOIs]);

  return null;
}

function updateSource(map: MaplibreMap, pois: NauticalPOI[]) {
  const src = map.getSource('nautical-pois');
  if (!src || !('setData' in src)) return;

  (src as any).setData({
    type: 'FeatureCollection',
    features: pois.map(poi => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [poi.lon, poi.lat] },
      properties: {
        name: poi.name,
        type: poi.type,
        icon: POI_ICONS[poi.type] || '📍',
        color: POI_COLORS[poi.type] || '#8b8b9e',
        ...poi.tags,
      },
    })),
  });
}

function buildPopupHTML(props: any): string {
  const type = props.type as string;
  const icon = POI_ICONS[type as POIType] || '📍';
  const lines: string[] = [];

  lines.push(`<div style="padding:8px;font-family:'Fira Code',monospace;font-size:11px;color:#e0e0e0;background:#16213e;border-radius:4px;">`);
  lines.push(`<div style="font-weight:700;margin-bottom:4px;">${icon} ${props.name || 'Unknown'}</div>`);
  lines.push(`<div style="color:#8b8b9e;font-size:9px;text-transform:uppercase;margin-bottom:4px;">${type}</div>`);

  if (props.vhf_channel || props['seamark:communication:vhf_channel']) {
    const ch = props.vhf_channel || props['seamark:communication:vhf_channel'];
    lines.push(`<div>VHF Ch ${ch}</div>`);
  }
  if (props.phone) {
    lines.push(`<div style="color:#8b8b9e;">${props.phone}</div>`);
  }
  if (props.website) {
    lines.push(`<div><a href="${props.website}" target="_blank" rel="noopener" style="color:#60a5fa;text-decoration:none;font-size:10px;">Website →</a></div>`);
  }
  if (props.opening_hours) {
    lines.push(`<div style="color:#8b8b9e;font-size:9px;margin-top:2px;">${props.opening_hours}</div>`);
  }
  if (props.capacity) {
    lines.push(`<div style="color:#8b8b9e;font-size:9px;">Berths: ${props.capacity}</div>`);
  }

  lines.push('</div>');
  return lines.join('');
}
