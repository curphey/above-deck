import { useRef, useCallback } from 'react';
import { useRoutePlannerStore } from '@/stores/route-planner';
import { generateRoute } from '@/lib/chart/route-generator';
import { MONTH_NAMES } from '@/lib/chart/cruising-seasons';

const DEPARTURE_PRESETS: { name: string; lat: number; lon: number }[] = [
  { name: 'Gibraltar', lat: 36.14, lon: -5.35 },
  { name: 'Las Palmas, Canaries', lat: 28.1, lon: -15.4 },
  { name: 'Fort Lauderdale, FL', lat: 26.12, lon: -80.14 },
  { name: 'Opua, New Zealand', lat: -35.31, lon: 174.12 },
  { name: 'Fremantle, Australia', lat: -32.06, lon: 115.74 },
  { name: 'Falmouth, UK', lat: 50.15, lon: -5.07 },
];

const SEASON_COLORS = {
  safe: '#4ade80',
  caution: '#ffaa00',
  danger: '#f87171',
};

export function RoutePlanner() {
  const store = useRoutePlannerStore();
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!store.apiKey) {
      store.setError('Enter your Claude API key to generate a route');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    store.setLoading(true);
    store.setError(null);
    store.setPlan(null);

    try {
      const plan = await generateRoute({
        apiKey: store.apiKey,
        departureName: store.departureName,
        departureLat: store.departureLat,
        departureLon: store.departureLon,
        departureMonth: store.departureMonth,
        departureYear: store.departureYear,
        tripDuration: store.tripDuration,
        direction: store.direction,
        boatSpeed: store.boatSpeed,
        preferences: store.preferences,
        signal: controller.signal,
      });
      store.setPlan(plan);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        store.setError(e.message || 'Failed to generate route');
      }
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  return (
    <div style={{
      display: 'flex', height: '100%', fontFamily: "'Inter', sans-serif",
      color: '#e0e0e0', fontSize: 12,
    }}>
      {/* Left panel — inputs */}
      <div style={{
        width: 280, minWidth: 280, padding: 16, overflowY: 'auto',
        background: '#16213e', borderRight: '1px solid #2d2d4a',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
          Circumnavigation Planner
        </div>

        {/* API Key */}
        <Field label="Claude API Key">
          <input
            type="password"
            value={store.apiKey}
            onChange={(e) => store.setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            style={inputStyle}
          />
        </Field>

        {/* Departure */}
        <Field label="Departure">
          <select
            value={store.departureName}
            onChange={(e) => {
              const preset = DEPARTURE_PRESETS.find(p => p.name === e.target.value);
              if (preset) store.setDeparture(preset.name, preset.lat, preset.lon);
            }}
            style={inputStyle}
          >
            {DEPARTURE_PRESETS.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        </Field>

        {/* Departure date */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Field label="Month" style={{ flex: 1 }}>
            <select value={store.departureMonth} onChange={(e) => store.setDepartureMonth(Number(e.target.value))} style={inputStyle}>
              {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </Field>
          <Field label="Year" style={{ flex: 1 }}>
            <input type="number" value={store.departureYear} onChange={(e) => store.setDepartureYear(Number(e.target.value))} style={inputStyle} min={2025} max={2035} />
          </Field>
        </div>

        {/* Trip config */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Field label="Duration" style={{ flex: 1 }}>
            <select value={store.tripDuration} onChange={(e) => store.setTripDuration(Number(e.target.value) as 3 | 4 | 5)} style={inputStyle}>
              <option value={3}>3 years</option>
              <option value={4}>4 years</option>
              <option value={5}>5 years</option>
            </select>
          </Field>
          <Field label="Speed (kn)" style={{ flex: 1 }}>
            <input type="number" value={store.boatSpeed} onChange={(e) => store.setBoatSpeed(Number(e.target.value))} style={inputStyle} min={3} max={12} step={0.5} />
          </Field>
        </div>

        <Field label="Direction">
          <select value={store.direction} onChange={(e) => store.setDirection(e.target.value as 'westabout' | 'eastabout')} style={inputStyle}>
            <option value="westabout">Westabout (trade winds)</option>
            <option value="eastabout">Eastabout</option>
          </select>
        </Field>

        <Field label="Preferences (optional)">
          <textarea
            value={store.preferences}
            onChange={(e) => store.setPreferences(e.target.value)}
            placeholder="e.g., Skip Red Sea, spend extra time in Pacific, avoid Southern Ocean..."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </Field>

        <button
          onClick={handleGenerate}
          disabled={store.loading}
          style={{
            padding: '10px 16px', border: 'none', borderRadius: 4,
            background: store.loading ? '#2d2d4a' : '#60a5fa',
            color: store.loading ? '#8b8b9e' : '#081830',
            fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700,
            cursor: store.loading ? 'wait' : 'pointer',
          }}
        >
          {store.loading ? 'Planning route...' : 'Generate Route'}
        </button>

        {store.error && (
          <div style={{ color: '#f87171', fontSize: 11, padding: '8px', background: 'rgba(248,113,113,0.1)', borderRadius: 4 }}>
            {store.error}
          </div>
        )}
      </div>

      {/* Right panel — route display */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {!store.plan && !store.loading && (
          <div style={{ color: '#8b8b9e', textAlign: 'center', marginTop: 40, fontFamily: "'Space Mono', monospace" }}>
            Configure your trip and click Generate Route
          </div>
        )}

        {store.loading && (
          <div style={{ color: '#60a5fa', textAlign: 'center', marginTop: 40, fontFamily: "'Space Mono', monospace" }}>
            Planning your circumnavigation...
          </div>
        )}

        {store.plan && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700 }}>
              {store.plan.totalYears}-Year Circumnavigation
            </div>
            <div style={{ color: '#8b8b9e', fontSize: 11, lineHeight: 1.5 }}>
              {store.plan.summary}
            </div>

            {/* Waypoint timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {store.plan.waypoints.map((wp, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, padding: '8px 10px',
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  borderRadius: 4, borderLeft: `3px solid ${SEASON_COLORS[wp.seasonStatus]}`,
                }}>
                  <div style={{ minWidth: 24, color: '#8b8b9e', fontFamily: "'Fira Code', monospace", fontSize: 10 }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{wp.name}</div>
                    <div style={{ color: '#8b8b9e', fontSize: 10, marginTop: 2 }}>
                      {MONTH_NAMES[wp.arriveMonth - 1]} Y{wp.arriveYear}
                      {wp.stayWeeks > 0 && ` · ${wp.stayWeeks}w`}
                      {wp.departMonth !== wp.arriveMonth && ` → depart ${MONTH_NAMES[wp.departMonth - 1]}`}
                    </div>
                    {wp.notes && (
                      <div style={{ color: '#8b8b9e', fontSize: 10, marginTop: 2, fontStyle: 'italic' }}>
                        {wp.notes}
                      </div>
                    )}
                  </div>
                  <div style={{
                    fontSize: 9, fontFamily: "'Fira Code', monospace",
                    color: SEASON_COLORS[wp.seasonStatus],
                    alignSelf: 'center',
                  }}>
                    {wp.seasonStatus === 'safe' ? '✓' : wp.seasonStatus === 'danger' ? '⚠' : '◐'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Helpers ---

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 8px', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)', border: '1px solid #2d2d4a',
  borderRadius: 4, color: '#e0e0e0',
  fontFamily: "'Inter', sans-serif", fontSize: 11,
};

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <div style={{ fontSize: 10, color: '#8b8b9e', marginBottom: 3, fontFamily: "'Fira Code', monospace" }}>
        {label}
      </div>
      {children}
    </div>
  );
}
