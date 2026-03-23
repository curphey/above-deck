import { useRef, useEffect } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMap } from './useMap';
import blueprintStyle from './styles/blueprint-dark.json';
import { ChartVesselLayer } from './ChartVesselLayer';
import { ChartControls } from './ChartControls';
import { ChartWeatherLayer } from './ChartWeatherLayer';
import { ChartInfoPopup } from './ChartInfoPopup';
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

  return (
    <div
      ref={containerRef}
      className="chart-container"
      style={{
        width: '100%',
        height: '100%',
        background: '#a5bfdd',
        position: 'relative',
        /* Dark nautical filter applied via CSS below */
      }}
    >
      <ChartVesselLayer map={map} isLoaded={isLoaded} />
      <ChartInfoPopup map={map} isLoaded={isLoaded} />
      <ChartControls map={map} />
      <ChartWeatherLayer />
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
