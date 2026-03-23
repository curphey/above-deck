import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';

interface ChartInfoPopupProps {
  map: maplibregl.Map | null;
  isLoaded: boolean;
}

export function ChartInfoPopup({ map, isLoaded }: ChartInfoPopupProps) {
  useEffect(() => {
    if (!map || !isLoaded) return;

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: true, offset: 10 });

    const handleClick = (e: any) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const p = feature.properties;
      const coords = feature.geometry.coordinates.slice();

      popup
        .setLngLat(coords)
        .setHTML(`
          <div style="font-family:'Inter',sans-serif;font-size:11px;color:#e0e0e0;background:#16213e;border:1px solid #2d2d4a;border-radius:4px;padding:8px;min-width:120px;">
            <div style="font-family:'Space Mono',monospace;font-size:10px;font-weight:700;margin-bottom:4px;">${p.name || 'Unknown'}</div>
            ${p.callSign ? `<div style="font-size:9px;color:#8b8b9e;">Callsign: ${p.callSign}</div>` : ''}
            <div style="font-size:9px;color:#8b8b9e;">SOG: ${p.sog || 0}kn  COG: ${p.cog || 0}°</div>
            ${p.type ? `<div style="font-size:9px;color:#8b8b9e;">Type: ${p.type}</div>` : ''}
          </div>
        `)
        .addTo(map);
    };

    map.on('click', 'ais-vessel-layer', handleClick);
    map.on('mouseenter', 'ais-vessel-layer', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'ais-vessel-layer', () => { map.getCanvas().style.cursor = ''; });

    return () => {
      map.off('click', 'ais-vessel-layer', handleClick);
      popup.remove();
    };
  }, [map, isLoaded]);

  return null;
}
