import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';

interface ChartInfoPopupProps {
  map: maplibregl.Map | null;
  isLoaded: boolean;
}

export function ChartInfoPopup({ map, isLoaded }: ChartInfoPopupProps) {
  useEffect(() => {
    if (!map || !isLoaded) return;

    // Hover tooltip (lightweight)
    const hoverPopup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 });

    // Click popup (detailed)
    const clickPopup = new maplibregl.Popup({ closeButton: true, closeOnClick: true, offset: 12 });

    const popupStyle = `font-family:'Inter',sans-serif;color:#e0e0e0;background:#16213e;border:1px solid #2d2d4a;border-radius:4px;padding:6px 8px;`;

    const handleHover = (e: any) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const p = feature.properties;
      const coords = feature.geometry.coordinates.slice();

      map.getCanvas().style.cursor = 'pointer';
      hoverPopup
        .setLngLat(coords)
        .setHTML(`<div style="${popupStyle}font-size:10px;"><strong>${p.name || 'Unknown'}</strong>${p.sog ? ` · ${p.sog}kn` : ''}</div>`)
        .addTo(map);
    };

    const handleHoverLeave = () => {
      map.getCanvas().style.cursor = '';
      hoverPopup.remove();
    };

    const handleClick = (e: any) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const p = feature.properties;
      const coords = feature.geometry.coordinates.slice();

      hoverPopup.remove(); // hide hover when showing detail
      clickPopup
        .setLngLat(coords)
        .setHTML(`
          <div style="${popupStyle}min-width:140px;">
            <div style="font-family:'Space Mono',monospace;font-size:11px;font-weight:700;margin-bottom:4px;">${p.name || 'Unknown'}</div>
            ${p.callSign ? `<div style="font-size:9px;color:#8b8b9e;">Callsign: ${p.callSign}</div>` : ''}
            <div style="font-size:9px;color:#8b8b9e;">SOG: ${p.sog || 0}kn  COG: ${p.cog || 0}°</div>
            ${p.type ? `<div style="font-size:9px;color:#8b8b9e;">Type: ${p.type}</div>` : ''}
          </div>
        `)
        .addTo(map);
    };

    // Own vessel hover
    const handleOwnHover = (e: any) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const p = feature.properties;
      const coords = feature.geometry.coordinates.slice();
      map.getCanvas().style.cursor = 'pointer';
      hoverPopup
        .setLngLat(coords)
        .setHTML(`<div style="${popupStyle}font-size:10px;color:#4ade80;"><strong>${p.name || 'You'}</strong>${p.sog ? ` · ${p.sog}kn ${p.cog}°` : ''}</div>`)
        .addTo(map);
    };

    map.on('mouseenter', 'ais-vessel-layer', handleHover);
    map.on('mouseleave', 'ais-vessel-layer', handleHoverLeave);
    map.on('click', 'ais-vessel-layer', handleClick);
    map.on('mouseenter', 'own-vessel-layer', handleOwnHover);
    map.on('mouseleave', 'own-vessel-layer', handleHoverLeave);

    return () => {
      map.off('mouseenter', 'ais-vessel-layer', handleHover);
      map.off('mouseleave', 'ais-vessel-layer', handleHoverLeave);
      map.off('click', 'ais-vessel-layer', handleClick);
      map.off('mouseenter', 'own-vessel-layer', handleOwnHover);
      map.off('mouseleave', 'own-vessel-layer', handleHoverLeave);
      hoverPopup.remove();
      clickPopup.remove();
    };
  }, [map, isLoaded]);

  return null;
}
