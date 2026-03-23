import { useEffect, useRef } from 'react';
import { useChartStore } from './chartStore';

const WS_BASE = typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_VHF_WS_URL || 'ws://localhost:8080';

export function useChartWebSocket(sessionId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const { setVessels, setOwnPosition, setWeather, setActiveRadioTarget } = useChartStore();

  useEffect(() => {
    if (!sessionId) return;

    const ws = new WebSocket(`${WS_BASE}/api/vhf/sessions/${sessionId}/ws`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'world_update') {
          if (data.vessels) setVessels(data.vessels);
          if (data.ownPosition) setOwnPosition(data.ownPosition);
          if (data.weather) setWeather(data.weather);
        }
        if (data.type === 'radio_event') {
          setActiveRadioTarget(data.agentId || null);
          setTimeout(() => setActiveRadioTarget(null), 5000);
        }
      } catch (err) {
        console.warn('[Chart] WebSocket parse error:', err);
      }
    };

    ws.onclose = () => console.log('[Chart] WebSocket closed');
    ws.onerror = (err) => console.error('[Chart] WebSocket error:', err);

    return () => { ws.close(); wsRef.current = null; };
  }, [sessionId]);
}
