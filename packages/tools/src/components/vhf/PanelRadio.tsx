import React from 'react';
import { LCDScreen } from './LCDScreen';
import { useVHFStore } from '@/stores/vhf';

interface PanelRadioProps {
  onTransmit?: (message: string) => void;
}

const btn: React.CSSProperties = {
  fontFamily: "'Space Mono', monospace",
  fontSize: '7px',
  fontWeight: 600,
  cursor: 'pointer',
  border: '1px solid #555',
  borderRadius: '2px',
  background: 'linear-gradient(180deg, #444 0%, #2a2a2a 100%)',
  color: '#ccc',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  letterSpacing: '0.04em',
};

const btnBlue: React.CSSProperties = {
  ...btn,
  background: 'linear-gradient(180deg, #3366aa 0%, #224488 100%)',
  border: '1px solid #4477bb',
  color: '#aaccff',
};

const btnGreen: React.CSSProperties = {
  ...btn,
  background: 'linear-gradient(180deg, #2a6633 0%, #1a4422 100%)',
  border: '1px solid #3a7744',
  color: '#4ade80',
};

const btnAmber: React.CSSProperties = {
  ...btn,
  background: 'linear-gradient(180deg, #665522 0%, #443311 100%)',
  border: '1px solid #776633',
  color: '#ffaa00',
};

export function PanelRadio({ onTransmit: _onTransmit }: PanelRadioProps) {
  const { lcdScreen, setLcdScreen, setChannel } = useVHFStore();

  return (
    /* Mounting bracket */
    <div
      style={{
        padding: '6px 10px 10px',
        background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        alignSelf: 'center',
        position: 'relative',
      }}
    >
      {/* Corner screws */}
      {[
        { top: 4, left: 4 },
        { top: 4, right: 4 },
        { bottom: 4, left: 4 },
        { bottom: 4, right: 4 },
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #666 0%, #333 60%, #222 100%)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
            ...pos,
          }}
        />
      ))}

      {/* Radio body */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: 480,
          height: 180,
          background: 'linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 60%, #222 100%)',
          borderRadius: 5,
          border: '1px solid #444',
          overflow: 'hidden',
        }}
      >
        {/* Left edge */}
        <div
          style={{
            width: 32,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 0 8px',
            background: 'linear-gradient(90deg, #222 0%, #2a2a2a 100%)',
            borderRight: '1px solid #3a3a3a',
            position: 'relative',
          }}
        >
          {/* Brand label — vertical */}
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 6,
              color: '#888',
              letterSpacing: '0.1em',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)',
              userSelect: 'none',
            }}
          >
            VHF
          </span>

          {/* Distress cover outline */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: -4,
                border: '1px dashed #664444',
                borderRadius: 4,
                pointerEvents: 'none',
              }}
            />
            {/* Red DISTRESS button */}
            <button
              aria-label="Distress"
              onClick={() => setLcdScreen('dsc')}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 40% 35%, #ff6666 0%, #cc0000 60%, #880000 100%)',
                border: '1px solid #ff4444',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(200,0,0,0.5)',
              }}
            />
          </div>

          <div style={{ width: 8, height: 8 }} />
        </div>

        {/* Center: screen section */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '8px 6px 6px',
            gap: 4,
          }}
        >
          {/* LCD bezel + screen */}
          <div style={{ flex: 1 }}>
            <LCDScreen />
          </div>

          {/* 4 soft key buttons below LCD bezel */}
          <div style={{ display: 'flex', gap: 2 }}>
            {['SCAN', 'D/W', 'CH/WX', 'HI/LO'].map((label) => (
              <button
                key={label}
                style={{
                  ...btn,
                  flex: 1,
                  height: 12,
                  fontSize: '6px',
                  borderRadius: '1px',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: button pad */}
        <div
          style={{
            width: 140,
            display: 'flex',
            flexDirection: 'column',
            padding: '8px 8px 6px',
            gap: 5,
            borderLeft: '1px solid #3a3a3a',
          }}
        >
          {/* Row 1: C/A + ENT */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { label: 'C/A', ariaLabel: undefined },
              { label: 'ENT', ariaLabel: undefined },
            ].map(({ label, ariaLabel }) => (
              <button
                key={label}
                aria-label={ariaLabel}
                style={{ ...btn, width: 36, height: 22 }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Row 2: MEN + CLR */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={{ ...btn, width: 36, height: 22 }}>MEN</button>
            <button
              style={{ ...btn, width: 36, height: 22 }}
              onClick={() => setLcdScreen('vhf')}
            >
              CLR
            </button>
          </div>

          {/* Row 3: Blue 16/9 button */}
          <div>
            <button
              aria-label="Go to channel 16"
              style={{ ...btnBlue, width: 76, height: 22 }}
              onClick={() => {
                setChannel(16);
                setLcdScreen('vhf');
              }}
            >
              16/9
            </button>
          </div>

          {/* Row 4: AIS + DSC side by side */}
          <div style={{ display: 'flex', gap: 4 }}>
            {/* AIS button */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  background: lcdScreen === 'ais' ? '#4ade80' : '#333',
                  boxShadow: lcdScreen === 'ais' ? '0 0 4px #4ade80' : 'none',
                }}
              />
              <button
                aria-label="AIS targets"
                style={{ ...btnGreen, width: 36, height: 22 }}
                onClick={() => setLcdScreen(lcdScreen === 'ais' ? 'vhf' : 'ais')}
              >
                AIS
              </button>
            </div>

            {/* DSC button */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  background: lcdScreen === 'dsc' ? '#ffaa00' : '#333',
                  boxShadow: lcdScreen === 'dsc' ? '0 0 4px #ffaa00' : 'none',
                }}
              />
              <button
                aria-label="DSC"
                style={{ ...btnAmber, width: 36, height: 22 }}
                onClick={() => setLcdScreen(lcdScreen === 'dsc' ? 'vhf' : 'dsc')}
              >
                DSC
              </button>
            </div>
          </div>

          {/* VOL/SQL knob */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
            <div
              title="VOL/SQL"
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle at 40% 35%, #555 0%, #333 50%, #222 100%)',
                border: '2px solid #444',
                boxShadow: '0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              {/* Position indicator line */}
              <div
                style={{
                  position: 'absolute',
                  top: '4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 2,
                  height: 8,
                  background: '#aaa',
                  borderRadius: 1,
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 6,
                  color: '#666',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.04em',
                }}
              >
                VOL/SQL
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
