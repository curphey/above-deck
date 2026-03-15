import React from 'react';
import { RadioScreen } from './RadioScreen';
import { ChannelDial } from './ChannelDial';
import { SquelchDial } from './SquelchDial';
import { PTTButton } from './PTTButton';
import { useVHFStore } from '@/stores/vhf';

interface PanelRadioProps {
  onTransmit?: (message: string) => void;
}

export function PanelRadio({ onTransmit }: PanelRadioProps) {
  const { setChannel, togglePower } = useVHFStore();

  function handleTransmit(message: string) {
    onTransmit?.(message);
  }

  const quickButtonStyle: React.CSSProperties = {
    background: '#2d2d4a',
    border: '1px solid #3d3d5a',
    color: '#e0e0e0',
    borderRadius: '3px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontFamily: "'Fira Code', monospace",
    fontSize: '11px',
    letterSpacing: '0.05em',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#16213e',
        border: '2px solid #2d2d4a',
        borderRadius: '6px',
        padding: '16px',
        gap: '16px',
        maxWidth: '560px',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Main body: screen + controls */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Left: screen */}
        <div style={{ flex: 1 }}>
          <RadioScreen />
        </div>

        {/* Right: control panel */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            background: '#0f1729',
            border: '1px solid #2d2d4a',
            borderRadius: '4px',
            padding: '12px 10px',
          }}
        >
          <ChannelDial />

          {/* Quick buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
            <button
              aria-label="Go to channel 16"
              style={quickButtonStyle}
              onClick={() => setChannel(16)}
            >
              CH16
            </button>
            <button
              aria-label="Go to channel 9"
              style={quickButtonStyle}
              onClick={() => setChannel(9)}
            >
              CH9
            </button>
            <button
              aria-label="Toggle power"
              style={quickButtonStyle}
              onClick={togglePower}
            >
              H/L
            </button>
          </div>

          <SquelchDial />
        </div>
      </div>

      {/* Bottom: PTT styled as fist mic */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '8px',
          borderTop: '1px solid #2d2d4a',
        }}
      >
        <PTTButton onTransmit={handleTransmit} />
      </div>
    </div>
  );
}
