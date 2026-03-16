import React from 'react';
import { RadioScreen } from './RadioScreen';
import { ChannelDial } from './ChannelDial';
import { PTTButton } from './PTTButton';
import { useVHFStore } from '@/stores/vhf';

interface HandheldRadioProps {
  transcriptPanel: React.ReactNode;
  onTransmit?: (message: string) => void;
}

export function HandheldRadio({ transcriptPanel, onTransmit }: HandheldRadioProps) {
  const { setChannel } = useVHFStore();

  function handleTransmit(message: string) {
    onTransmit?.(message);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      {/* Handheld radio body */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: '#16213e',
          border: '2px solid #2d2d4a',
          borderRadius: '16px',
          padding: '12px',
          gap: '10px',
          width: '240px',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Antenna */}
        <div
          aria-hidden="true"
          style={{
            width: '6px',
            height: '40px',
            background: '#2d2d4a',
            borderRadius: '3px',
            alignSelf: 'flex-end',
            marginRight: '12px',
          }}
        />

        {/* Speaker grille */}
        <div
          aria-hidden="true"
          style={{
            display: 'flex',
            gap: '3px',
            width: '100%',
            justifyContent: 'center',
            paddingBottom: '4px',
          }}
        >
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              style={{
                width: '2px',
                height: '14px',
                background: '#2d2d4a',
                borderRadius: '1px',
              }}
            />
          ))}
        </div>

        {/* Screen (compact) */}
        <div style={{ width: '100%', transform: 'scale(0.85)', transformOrigin: 'top center' }}>
          <RadioScreen />
        </div>

        {/* Controls row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            gap: '8px',
            paddingTop: '4px',
          }}
        >
          {/* CH16 quick button */}
          <button
            aria-label="Go to channel 16"
            style={{
              background: '#2d2d4a',
              border: '1px solid #3d3d5a',
              color: '#e0e0e0',
              borderRadius: '3px',
              padding: '4px 6px',
              cursor: 'pointer',
              fontFamily: "'Fira Code', monospace",
              fontSize: '10px',
              letterSpacing: '0.05em',
              flexShrink: 0,
            }}
            onClick={() => setChannel(16)}
          >
            CH16
          </button>

          {/* Compact ChannelDial */}
          <div style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}>
            <ChannelDial />
          </div>

          {/* PTT */}
          <div style={{ transform: 'scale(0.65)', transformOrigin: 'center' }}>
            <PTTButton onTransmit={handleTransmit} />
          </div>
        </div>
      </div>

      {/* Transcript panel below radio body */}
      <div style={{ width: '100%' }}>{transcriptPanel}</div>
    </div>
  );
}
