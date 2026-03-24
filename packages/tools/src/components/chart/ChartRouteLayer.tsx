import { useEffect, useRef } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import maplibregl from 'maplibre-gl';
import { useRoutePlannerStore, type RouteWaypoint } from '@/stores/route-planner';
import { MONTH_NAMES } from '@/lib/chart/cruising-seasons';

const STATUS_COLORS = {
  safe: '#4ade80',
  caution: '#ffaa00',
  danger: '#f87171',
};

interface ChartRouteLayerProps {
  map: MaplibreMap | null;
  isLoaded: boolean;
}

export function ChartRouteLayer({ map, isLoaded }: ChartRouteLayerProps) {
  const plan = useRoutePlannerStore(s => s.plan);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const waypoints = plan?.waypoints ?? [];

    // Route line
    const lineData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: waypoints.length >= 2 ? [{
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: waypoints.map(wp => [wp.lon, wp.lat]),
        },
        properties: {},
      }] : [],
    };

    // Waypoint markers
    const pointData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: waypoints.map((wp, i) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [wp.lon, wp.lat] },
        properties: {
          name: wp.name,
          index: i + 1,
          arriveMonth: MONTH_NAMES[wp.arriveMonth - 1],
          arriveYear: wp.arriveYear,
          stayWeeks: wp.stayWeeks,
          notes: wp.notes,
          color: STATUS_COLORS[wp.seasonStatus] || STATUS_COLORS.safe,
          seasonStatus: wp.seasonStatus,
        },
      })),
    };

    // Route line source/layer
    const lineSrc = map.getSource('route-line');
    if (lineSrc && 'setData' in lineSrc) {
      (lineSrc as any).setData(lineData);
    } else if (!lineSrc) {
      map.addSource('route-line', { type: 'geojson', data: lineData });
      map.addLayer({
        id: 'route-line-layer', type: 'line', source: 'route-line',
        paint: {
          'line-color': '#60a5fa',
          'line-width': 2.5,
          'line-dasharray': [4, 2],
          'line-opacity': 0.8,
        },
      });
    }

    // Waypoint markers source/layer
    const ptSrc = map.getSource('route-waypoints');
    if (ptSrc && 'setData' in ptSrc) {
      (ptSrc as any).setData(pointData);
    } else if (!ptSrc) {
      map.addSource('route-waypoints', { type: 'geojson', data: pointData });
      map.addLayer({
        id: 'route-waypoint-circles', type: 'circle', source: 'route-waypoints',
        paint: {
          'circle-radius': 5,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#081830',
        },
      });
      map.addLayer({
        id: 'route-waypoint-labels', type: 'symbol', source: 'route-waypoints',
        layout: {
          'text-field': ['concat', ['to-string', ['get', 'index']], '. ', ['get', 'name']],
          'text-size': 10,
          'text-offset': [0, 1.4],
          'text-anchor': 'top',
          'text-allow-overlap': false,
          'text-optional': true,
        },
        paint: {
          'text-color': '#e0e0e0',
          'text-halo-color': '#081830',
          'text-halo-width': 1.5,
        },
      });

      // Click popup
      map.on('click', 'route-waypoint-circles', (e: any) => {
        const feat = e.features?.[0];
        if (!feat) return;
        const p = feat.properties;
        const coords = (feat.geometry as any).coordinates;

        popupRef.current?.remove();
        popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: '240px' })
          .setLngLat(coords)
          .setHTML(`<div style="padding:8px;font-family:'Fira Code',monospace;font-size:11px;color:#e0e0e0;background:#16213e;border-radius:4px;">
            <div style="font-weight:700;margin-bottom:4px;">${p.index}. ${p.name}</div>
            <div style="color:#8b8b9e;font-size:10px;">Arrive: ${p.arriveMonth} Y${p.arriveYear} · ${p.stayWeeks}w stay</div>
            <div style="color:${p.color};font-size:9px;margin-top:2px;">${p.seasonStatus === 'safe' ? '✓ Safe season' : p.seasonStatus === 'danger' ? '⚠ Danger season' : '◐ Caution'}</div>
            ${p.notes ? `<div style="color:#8b8b9e;font-size:9px;margin-top:4px;font-style:italic;">${p.notes}</div>` : ''}
          </div>`)
          .addTo(map);
      });

      map.on('mouseenter', 'route-waypoint-circles', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'route-waypoint-circles', () => { map.getCanvas().style.cursor = ''; });
    }

    // Fit map to route bounds if we have waypoints
    if (waypoints.length >= 2) {
      const bounds = new maplibregl.LngLatBounds();
      waypoints.forEach(wp => bounds.extend([wp.lon, wp.lat]));
      map.fitBounds(bounds, { padding: 50, maxZoom: 6 });
    }
  }, [map, isLoaded, plan]);

  useEffect(() => {
    return () => { popupRef.current?.remove(); };
  }, []);

  return null;
}
