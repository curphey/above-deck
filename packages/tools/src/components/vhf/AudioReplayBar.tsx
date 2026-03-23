import React, { useMemo } from 'react';

interface AudioReplayBarProps {
  duration: number;
  type: 'tx' | 'rx';
  onPlay: () => void;
}

/** Format seconds as M:SS */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Seeded pseudo-random number generator (mulberry32) */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BAR_COUNT = 30;

export function AudioReplayBar({ duration, type, onPlay }: AudioReplayBarProps) {
  const accentColor = type === 'tx' ? '#f87171' : '#60a5fa';

  const barHeights = useMemo(() => {
    const rand = mulberry32(duration * 1000 + (type === 'tx' ? 1 : 2));
    return Array.from({ length: BAR_COUNT }, () => Math.round(rand() * 14 + 3));
  }, [duration, type]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      {/* Play button */}
      <button
        aria-label="Play audio"
        onClick={onPlay}
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: '#8b8b9e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
          flexShrink: 0,
          fontSize: '10px',
        }}
      >
        ▶
      </button>

      {/* Waveform bars */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1px',
          flex: 1,
        }}
      >
        {barHeights.map((height, i) => (
          <div
            key={i}
            data-testid="wave-bar"
            style={{
              width: '2px',
              height: `${height}px`,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '1px',
              flexShrink: 0,
            }}
          />
        ))}
      </div>

      {/* Duration label */}
      <span
        style={{
          fontFamily: '"Fira Code", monospace',
          fontSize: '9px',
          color: '#8b8b9e',
          flexShrink: 0,
        }}
      >
        {formatDuration(duration)}
      </span>
    </div>
  );
}
