import { useRef } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMap } from './useMap';
import blueprintStyle from './styles/blueprint-dark.json';
import { ChartVesselLayer } from './ChartVesselLayer';
import { ChartControls } from './ChartControls';
import { ChartWeatherLayer } from './ChartWeatherLayer';

interface ChartViewProps {
  center?: [number, number];
  zoom?: number;
}

export function ChartView({ center, zoom }: ChartViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { map, isLoaded } = useMap({
    container: containerRef,
    center,
    zoom,
    style: blueprintStyle as any,
  });

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#081830',
        position: 'relative',
      }}
    >
      <ChartVesselLayer map={map} isLoaded={isLoaded} />
      <ChartControls map={map} />
      <ChartWeatherLayer />
    </div>
  );
}
