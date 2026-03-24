import { useRef, useEffect, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMap } from './useMap';
import blueprintStyle from './styles/blueprint-dark.json';
import { ChartVesselLayer } from './ChartVesselLayer';
import { ChartControls } from './ChartControls';
import { ChartWeatherLayer } from './ChartWeatherLayer';
import { ChartInfoPopup } from './ChartInfoPopup';
import { ChartLayerPanel } from './ChartLayerPanel';
import { ChartPOILayer } from './ChartPOILayer';
import { ChartSeasonsLayer } from './ChartSeasonsLayer';
import { ChartRouteLayer } from './ChartRouteLayer';
import { useChartStore } from './chartStore';

// Inject chart popup CSS
const CHART_CSS = `
.chart-container .maplibregl-popup-content {
  background: #16213e !important;
  color: #e0e0e0 !important;
  border: 1px solid #2d2d4a !important;
  border-radius: 4px !important;
  padding: 0 !important;
}
.chart-container .maplibregl-popup-tip {
  border-top-color: #16213e !important;
}
`;

let cssInjected = false;
function injectChartCSS() {
  if (cssInjected) return;
  const style = document.createElement('style');
  style.textContent = CHART_CSS;
  document.head.appendChild(style);
  cssInjected = true;
}

interface ChartViewProps {
  center?: [number, number];
  zoom?: number;
}

export function ChartView({ center, zoom }: ChartViewProps) {
  useEffect(() => { injectChartCSS(); }, []);
  const containerRef = useRef<HTMLDivElement>(null);
  const { map, isLoaded } = useMap({
    container: containerRef,
    center,
    zoom,
    style: blueprintStyle as any,
  });
  const ownPosition = useChartStore(s => s.ownPosition);
  const showWeather = useChartStore(s => s.layers.weather);
  const [showSeasons, setShowSeasons] = useState(false);

  // Toggle OpenSeaMap layer visibility based on seamarks toggle
  const showSeamarks = useChartStore(s => s.layers.seamarks);
  useEffect(() => {
    if (!map || !isLoaded) return;
    const layer = map.getLayer('openseamap-overlay');
    if (layer) {
      map.setLayoutProperty('openseamap-overlay', 'visibility', showSeamarks ? 'visible' : 'none');
    }
  }, [map, isLoaded, showSeamarks]);

  return (
    <div
      ref={containerRef}
      className="chart-container"
      style={{
        width: '100%',
        height: '100%',
        background: '#a5bfdd',
        position: 'relative',
      }}
    >
      <ChartVesselLayer map={map} isLoaded={isLoaded} />
      <ChartInfoPopup map={map} isLoaded={isLoaded} />
      <ChartLayerPanel />
      <ChartPOILayer map={map} isLoaded={isLoaded} />
      <ChartSeasonsLayer map={map} isLoaded={isLoaded} visible={showSeasons} />
      <ChartRouteLayer map={map} isLoaded={isLoaded} />
      <ChartControls map={map} />
      {showWeather && <ChartWeatherLayer />}
      {/* Seasons toggle button — top-right */}
      <button
        onClick={() => setShowSeasons(s => !s)}
        title={showSeasons ? 'Hide cruising seasons' : 'Show cruising seasons'}
        aria-label="Toggle cruising seasons"
        style={{
          position: 'absolute', top: 8, right: 8, zIndex: 10,
          width: 28, height: 28,
          background: showSeasons ? 'rgba(96,165,250,0.3)' : 'rgba(0,0,0,0.6)',
          border: `1px solid ${showSeasons ? '#60a5fa' : 'rgba(255,255,255,0.15)'}`,
          borderRadius: 4, cursor: 'pointer',
          color: showSeasons ? '#60a5fa' : '#8b8b9e',
          fontFamily: "'Fira Code', monospace", fontSize: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        🌊
      </button>
      {/* Position overlay */}
      <div style={{
        position: 'absolute', bottom: 8, left: 8, zIndex: 10,
        fontFamily: "'Fira Code', monospace", fontSize: 9, color: 'rgba(255,255,255,0.4)',
        display: 'flex', flexDirection: 'column', gap: 1,
      }}>
        <span>{formatLat(ownPosition.lat)} {formatLon(ownPosition.lon)}</span>
        <span>SOG: {ownPosition.sog.toFixed(1)}kn COG: {ownPosition.cog}°</span>
      </div>
    </div>
  );
}

function formatLat(lat: number): string {
  const dir = lat >= 0 ? 'N' : 'S';
  const abs = Math.abs(lat);
  const deg = Math.floor(abs);
  const min = ((abs - deg) * 60).toFixed(2);
  return `${deg}°${min}'${dir}`;
}

function formatLon(lon: number): string {
  const dir = lon >= 0 ? 'E' : 'W';
  const abs = Math.abs(lon);
  const deg = Math.floor(abs);
  const min = ((abs - deg) * 60).toFixed(2);
  return `${deg}°${min}'${dir}`;
}
