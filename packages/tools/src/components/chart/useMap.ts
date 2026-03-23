import { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';

interface UseMapOptions {
  container: React.RefObject<HTMLDivElement | null>;
  center?: [number, number];
  zoom?: number;
  style: string | maplibregl.StyleSpecification;
}

export function useMap({ container, center = [-5.04, 50.09], zoom = 12, style }: UseMapOptions) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!container.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: container.current,
      style,
      center,
      zoom,
      attributionControl: false,
    });

    map.on('load', () => setIsLoaded(true));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setIsLoaded(false);
    };
  }, []);

  return { map: mapRef.current, isLoaded };
}
