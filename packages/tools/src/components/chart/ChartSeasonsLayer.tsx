import { useEffect, useRef, useState } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import maplibregl from 'maplibre-gl';
import {
  CRUISING_ZONES, TRANSIT_WINDOWS, MONTH_NAMES,
  getMonthStatus, type CruisingZone, type TransitWindow,
} from '@/lib/chart/cruising-seasons';

interface ChartSeasonsLayerProps {
  map: MaplibreMap | null;
  isLoaded: boolean;
  visible?: boolean;
}

const ZONE_COLORS = {
  safe: 'rgba(74, 222, 128, 0.15)',    // sea green
  danger: 'rgba(248, 113, 113, 0.25)', // coral
  transition: 'rgba(255, 170, 0, 0.15)', // amber
};

const ZONE_BORDER_COLORS = {
  safe: 'rgba(74, 222, 128, 0.5)',
  danger: 'rgba(248, 113, 113, 0.6)',
  transition: 'rgba(255, 170, 0, 0.4)',
};

export function ChartSeasonsLayer({ map, isLoaded, visible = false }: ChartSeasonsLayerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  // Add GeoJSON sources and layers
  useEffect(() => {
    if (!map || !isLoaded) return;

    // Zone polygons
    if (!map.getSource('cruising-zones')) {
      map.addSource('cruising-zones', {
        type: 'geojson',
        data: buildZoneGeoJSON(currentMonth),
      });
      map.addLayer({
        id: 'cruising-zones-fill', type: 'fill', source: 'cruising-zones',
        paint: { 'fill-color': ['get', 'fillColor'] },
        layout: { visibility: visible ? 'visible' : 'none' },
      });
      map.addLayer({
        id: 'cruising-zones-border', type: 'line', source: 'cruising-zones',
        paint: {
          'line-color': ['get', 'borderColor'],
          'line-width': 1,
          'line-dasharray': [4, 2],
        },
        layout: { visibility: visible ? 'visible' : 'none' },
      });
      map.addLayer({
        id: 'cruising-zones-label', type: 'symbol', source: 'cruising-zones',
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 11,
          'text-allow-overlap': false,
          visibility: visible ? 'visible' : 'none',
        },
        paint: {
          'text-color': ['get', 'textColor'],
          'text-halo-color': '#081830',
          'text-halo-width': 1.5,
        },
      });
    }

    // Transit route lines
    if (!map.getSource('transit-routes')) {
      map.addSource('transit-routes', {
        type: 'geojson',
        data: buildTransitGeoJSON(currentMonth),
      });
      map.addLayer({
        id: 'transit-routes-line', type: 'line', source: 'transit-routes',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-dasharray': [6, 3],
        },
        layout: { visibility: visible ? 'visible' : 'none' },
      });
      map.addLayer({
        id: 'transit-routes-label', type: 'symbol', source: 'transit-routes',
        layout: {
          'symbol-placement': 'line-center',
          'text-field': ['get', 'label'],
          'text-size': 10,
          'text-allow-overlap': true,
          visibility: visible ? 'visible' : 'none',
        },
        paint: {
          'text-color': ['get', 'color'],
          'text-halo-color': '#081830',
          'text-halo-width': 1.5,
        },
      });
    }

    // Click handler for zone details
    const onClick = (e: any) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['cruising-zones-fill'],
      });
      if (!features.length) return;
      const props = features[0].properties;
      popupRef.current?.remove();
      popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: '260px' })
        .setLngLat(e.lngLat)
        .setHTML(buildZonePopup(props, currentMonth))
        .addTo(map);
    };
    map.on('click', 'cruising-zones-fill', onClick);

    return () => {
      map.off('click', 'cruising-zones-fill', onClick);
      popupRef.current?.remove();
    };
  }, [map, isLoaded, visible, currentMonth]);

  // Update zone colors when month changes
  useEffect(() => {
    if (!map || !isLoaded) return;
    const src = map.getSource('cruising-zones');
    if (src && 'setData' in src) {
      (src as any).setData(buildZoneGeoJSON(currentMonth));
    }
    const tsrc = map.getSource('transit-routes');
    if (tsrc && 'setData' in tsrc) {
      (tsrc as any).setData(buildTransitGeoJSON(currentMonth));
    }
  }, [map, isLoaded, currentMonth]);

  // Toggle visibility
  useEffect(() => {
    if (!map || !isLoaded) return;
    const vis = visible ? 'visible' : 'none';
    for (const id of ['cruising-zones-fill', 'cruising-zones-border', 'cruising-zones-label', 'transit-routes-line', 'transit-routes-label']) {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis);
    }
  }, [map, isLoaded, visible]);

  if (!visible) return null;

  // Month selector bar
  return (
    <div style={{
      position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      zIndex: 10, display: 'flex', gap: 2,
      background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 4, padding: '4px 6px',
      fontFamily: "'Fira Code', monospace", fontSize: 9,
    }}>
      {MONTH_NAMES.map((name, i) => {
        const month = i + 1;
        const isActive = month === currentMonth;
        return (
          <button
            key={name}
            onClick={() => setCurrentMonth(month)}
            style={{
              padding: '2px 4px', border: 'none', borderRadius: 2,
              background: isActive ? '#60a5fa' : 'transparent',
              color: isActive ? '#081830' : '#8b8b9e',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit',
              fontWeight: isActive ? 700 : 400,
            }}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}

function buildZoneGeoJSON(month: number): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: CRUISING_ZONES.map(zone => {
      const status = getMonthStatus(zone, month);
      return {
        type: 'Feature' as const,
        geometry: { type: 'Polygon' as const, coordinates: [zone.polygon] },
        properties: {
          name: zone.name,
          status,
          hazard: zone.hazard,
          notes: zone.notes,
          fillColor: ZONE_COLORS[status],
          borderColor: ZONE_BORDER_COLORS[status],
          textColor: status === 'danger' ? '#f87171' : status === 'safe' ? '#4ade80' : '#ffaa00',
          label: `${zone.name}\n${status === 'danger' ? '⚠ ' + zone.hazard.toUpperCase() : '✓ Safe'}`,
          safeMonths: zone.safeMonths.join(','),
          dangerMonths: zone.dangerMonths.join(','),
        },
      };
    }),
  };
}

function buildTransitGeoJSON(month: number): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: TRANSIT_WINDOWS.map(tw => {
      const isBest = tw.bestMonths.includes(month);
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: [tw.from, tw.to],
        },
        properties: {
          name: tw.name,
          notes: tw.notes,
          color: isBest ? '#4ade80' : 'rgba(96, 165, 250, 0.3)',
          label: isBest ? `→ ${tw.name}` : '',
          bestMonths: tw.bestMonths.map(m => MONTH_NAMES[m - 1]).join(', '),
        },
      };
    }),
  };
}

function buildZonePopup(props: any, month: number): string {
  const safeMonths = (props.safeMonths as string).split(',').map(Number);
  const dangerMonths = (props.dangerMonths as string).split(',').map(Number);

  const monthGrid = MONTH_NAMES.map((name, i) => {
    const m = i + 1;
    const isCurrent = m === month;
    let bg = 'transparent';
    let color = '#8b8b9e';
    if (safeMonths.includes(m)) { bg = 'rgba(74,222,128,0.2)'; color = '#4ade80'; }
    if (dangerMonths.includes(m)) { bg = 'rgba(248,113,113,0.2)'; color = '#f87171'; }
    const border = isCurrent ? '1px solid #60a5fa' : '1px solid transparent';
    return `<span style="display:inline-block;padding:1px 3px;border-radius:2px;background:${bg};color:${color};border:${border};font-size:8px;">${name}</span>`;
  }).join(' ');

  return `<div style="padding:8px;font-family:'Fira Code',monospace;font-size:11px;color:#e0e0e0;background:#16213e;border-radius:4px;">
    <div style="font-weight:700;margin-bottom:4px;">${props.name}</div>
    <div style="color:#8b8b9e;font-size:9px;margin-bottom:6px;">${props.notes}</div>
    <div style="display:flex;flex-wrap:wrap;gap:2px;">${monthGrid}</div>
    <div style="margin-top:6px;font-size:8px;color:#8b8b9e;">
      <span style="color:#4ade80;">■</span> Safe
      <span style="color:#f87171;margin-left:8px;">■</span> ${props.hazard} risk
    </div>
  </div>`;
}
