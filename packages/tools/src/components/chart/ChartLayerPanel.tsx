import React from 'react';
import { useChartStore, VESSEL_TYPES, type LayerVisibility } from './chartStore';

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  left: 8,
  zIndex: 10,
  background: 'rgba(0,0,0,0.75)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 4,
  fontFamily: "'Fira Code', monospace",
  fontSize: 10,
  color: '#8b8b9e',
  userSelect: 'none',
};

const toggleBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  background: 'rgba(0,0,0,0.6)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 4,
  color: '#8b8b9e',
  cursor: 'pointer',
  fontFamily: "'Fira Code', monospace",
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
};

const LAYER_LABELS: Record<keyof LayerVisibility, string> = {
  seamarks: 'Sea marks',
  bathymetry: 'Depth shading',
  aisVessels: 'AIS vessels',
  pois: 'Marinas & POIs',
  weather: 'Weather',
  rangeRings: 'Range rings',
};

export function ChartLayerPanel() {
  const layers = useChartStore(s => s.layers);
  const vesselTypeFilter = useChartStore(s => s.vesselTypeFilter);
  const layerPanelOpen = useChartStore(s => s.layerPanelOpen);
  const toggleLayer = useChartStore(s => s.toggleLayer);
  const toggleVesselType = useChartStore(s => s.toggleVesselType);
  const setLayerPanelOpen = useChartStore(s => s.setLayerPanelOpen);

  if (!layerPanelOpen) {
    return (
      <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
        <button
          style={toggleBtnStyle}
          onClick={() => setLayerPanelOpen(true)}
          title="Layers"
          aria-label="Open layer panel"
        >
          ☰
        </button>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <span style={{ color: '#e0e0e0', fontSize: 10, fontWeight: 600 }}>LAYERS</span>
        <button
          onClick={() => setLayerPanelOpen(false)}
          style={{
            background: 'none', border: 'none', color: '#8b8b9e',
            cursor: 'pointer', fontSize: 12, padding: '0 2px',
          }}
          aria-label="Close layer panel"
        >
          ×
        </button>
      </div>

      {/* Layer toggles */}
      <div style={{ padding: '4px 8px' }}>
        {(Object.keys(LAYER_LABELS) as (keyof LayerVisibility)[]).map((key) => (
          <label key={key} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '3px 0', cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={layers[key]}
              onChange={() => toggleLayer(key)}
              style={{ accentColor: '#60a5fa', width: 12, height: 12, margin: 0 }}
            />
            <span>{LAYER_LABELS[key]}</span>
          </label>
        ))}
      </div>

      {/* Vessel type filter — only shown when AIS vessels layer is on */}
      {layers.aisVessels && (
        <>
          <div style={{
            padding: '4px 8px 2px', borderTop: '1px solid rgba(255,255,255,0.08)',
            color: '#e0e0e0', fontSize: 9, fontWeight: 600,
          }}>
            VESSEL TYPES
          </div>
          <div style={{ padding: '2px 8px 6px' }}>
            {VESSEL_TYPES.map((type) => (
              <label key={type} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '2px 0', cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={vesselTypeFilter[type] ?? true}
                  onChange={() => toggleVesselType(type)}
                  style={{ accentColor: '#60a5fa', width: 11, height: 11, margin: 0 }}
                />
                <span style={{ fontSize: 9 }}>{type}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
