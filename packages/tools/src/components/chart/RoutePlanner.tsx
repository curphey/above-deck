import { useRoutePlannerStore } from '@/stores/route-planner';
import { MONTH_NAMES } from '@/lib/chart/cruising-seasons';
import { ChartView } from './ChartView';
import { RouteChat } from './RouteChat';

const SEASON_COLORS = {
  safe: '#4ade80',
  caution: '#ffaa00',
  danger: '#f87171',
};

export function RoutePlanner() {
  const plan = useRoutePlannerStore(s => s.plan);

  return (
    <div style={{
      display: 'flex', height: '100%', fontFamily: "'Inter', sans-serif",
      color: '#e0e0e0', fontSize: 12,
    }}>
      {/* Left panel — chat agent */}
      <div style={{
        width: 340, minWidth: 340,
        background: '#16213e', borderRight: '1px solid #2d2d4a',
        display: 'flex', flexDirection: 'column',
      }}>
        <RouteChat />
      </div>

      {/* Center — chart with route overlay */}
      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        <ChartView center={[170, 10]} zoom={2} />
      </div>

      {/* Right panel — route timeline (only shown when a plan exists) */}
      {plan && (
        <div style={{
          width: 280, minWidth: 280, overflowY: 'auto', padding: 12,
          borderLeft: '1px solid #2d2d4a', background: '#16213e',
        }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            {plan.totalYears}-Year Route
          </div>
          <div style={{ color: '#8b8b9e', fontSize: 10, lineHeight: 1.5, marginBottom: 12 }}>
            {plan.summary}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {plan.waypoints.map((wp, i) => (
              <div key={i} style={{
                display: 'flex', gap: 8, padding: '6px 8px',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                borderRadius: 3, borderLeft: `3px solid ${SEASON_COLORS[wp.seasonStatus]}`,
              }}>
                <div style={{ minWidth: 20, color: '#8b8b9e', fontFamily: "'Fira Code', monospace", fontSize: 9 }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {wp.name}
                  </div>
                  <div style={{ color: '#8b8b9e', fontSize: 9, marginTop: 1 }}>
                    {MONTH_NAMES[wp.arriveMonth - 1]} Y{wp.arriveYear}
                    {wp.stayWeeks > 0 && ` · ${wp.stayWeeks}w`}
                  </div>
                </div>
                <div style={{
                  fontSize: 9, color: SEASON_COLORS[wp.seasonStatus], alignSelf: 'center',
                }}>
                  {wp.seasonStatus === 'safe' ? '✓' : wp.seasonStatus === 'danger' ? '⚠' : '◐'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
