import { useChartStore } from './chartStore';

export function ChartWeatherLayer() {
  const weather = useChartStore(s => s.weather);
  const windArrowRotation = weather.windDirection + 180;

  return (
    <div style={{
      position: 'absolute', top: 8, right: 8, zIndex: 10,
      background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 4, padding: '6px 8px',
      fontFamily: "'Fira Code', monospace", fontSize: 9, color: '#8b8b9e',
      display: 'flex', flexDirection: 'column', gap: 2, pointerEvents: 'none',
    }}>
      <span>
        <span style={{
          display: 'inline-block', width: 0, height: 0,
          borderLeft: '3px solid transparent', borderRight: '3px solid transparent',
          borderBottom: '8px solid #60a5fa',
          transform: `rotate(${windArrowRotation}deg)`, marginRight: 4,
        }} />
        {windDirToCompass(weather.windDirection)} <span style={{color:'#e0e0e0'}}>{weather.windSpeedKnots}kn</span>
      </span>
      <span>Sea: <span style={{color:'#e0e0e0'}}>{weather.seaState}</span></span>
      <span>Vis: <span style={{color:'#e0e0e0'}}>{weather.visibility}</span></span>
    </div>
  );
}

function windDirToCompass(deg: number): string {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}
