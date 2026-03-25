import { useEffect, useState } from 'react';
import { ChartView } from './ChartView';
import { useChartWebSocket } from './useChartWebSocket';
import { VHFApiClient } from '@/lib/vhf/api-client';

const API_URL = typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_VHF_API_URL || 'http://localhost:8080';

interface StandaloneChartProps {
  center?: [number, number];
  zoom?: number;
}

/**
 * Chart with auto-created background session for live AIS vessel data.
 * Creates a lightweight VHF session on mount to get WebSocket vessel feeds.
 */
export function StandaloneChart({ center, zoom }: StandaloneChartProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const client = new VHFApiClient(API_URL);
    client.createSession('uk-south', 'Chart Viewer', 'sailing')
      .then(session => setSessionId(session.id))
      .catch(err => console.warn('[Chart] Could not create session for AIS data:', err));
  }, []);

  useChartWebSocket(sessionId);

  return <ChartView center={center} zoom={zoom} />;
}
