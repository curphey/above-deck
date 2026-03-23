import React from 'react';
import { useChartStore } from './chartStore';

interface ChartControlsProps {
  map: any;
}

type Orientation = 'north-up' | 'head-up' | 'course-up';

const ORIENTATION_CYCLE: Orientation[] = ['north-up', 'head-up', 'course-up'];
const ORIENTATION_LABELS: Record<Orientation, string> = {
  'north-up': 'N↑',
  'head-up': 'H↑',
  'course-up': 'C↑',
};

const buttonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  background: 'rgba(0,0,0,0.6)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 4,
  color: '#8b8b9e',
  cursor: 'pointer',
  fontFamily: "'Fira Code', monospace",
  fontSize: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  lineHeight: 1,
};

const activeButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  color: '#60a5fa',
  borderColor: 'rgba(96,165,250,0.4)',
};

export function ChartControls({ map }: ChartControlsProps) {
  const orientation = useChartStore((s) => s.orientation);
  const showRangeRings = useChartStore((s) => s.showRangeRings);
  const setOrientation = useChartStore((s) => s.setOrientation);
  const setShowRangeRings = useChartStore((s) => s.setShowRangeRings);
  const ownPosition = useChartStore((s) => s.ownPosition);

  function handleZoomIn() {
    map?.zoomIn();
  }

  function handleZoomOut() {
    map?.zoomOut();
  }

  function handleOrientationToggle() {
    const currentIndex = ORIENTATION_CYCLE.indexOf(orientation);
    const nextIndex = (currentIndex + 1) % ORIENTATION_CYCLE.length;
    setOrientation(ORIENTATION_CYCLE[nextIndex]);
  }

  function handleRangeRingsToggle() {
    setShowRangeRings(!showRangeRings);
  }

  function handleCenterOnVessel() {
    if (map && ownPosition) {
      map.flyTo({ center: [ownPosition.lon, ownPosition.lat] });
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 60,
        left: 8,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <button
        style={buttonStyle}
        onClick={handleZoomIn}
        title="Zoom in"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        style={buttonStyle}
        onClick={handleZoomOut}
        title="Zoom out"
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        style={activeButtonStyle}
        onClick={handleOrientationToggle}
        title={`Orientation: ${orientation}`}
        aria-label={`Toggle orientation, current: ${orientation}`}
      >
        {ORIENTATION_LABELS[orientation]}
      </button>
      <button
        style={showRangeRings ? activeButtonStyle : buttonStyle}
        onClick={handleRangeRingsToggle}
        title={showRangeRings ? 'Hide range rings' : 'Show range rings'}
        aria-label={showRangeRings ? 'Hide range rings' : 'Show range rings'}
      >
        ◎
      </button>
      <button
        style={buttonStyle}
        onClick={handleCenterOnVessel}
        title="Center on own vessel"
        aria-label="Center on own vessel"
      >
        ⊕
      </button>
    </div>
  );
}
