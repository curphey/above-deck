import React, { useEffect, useRef } from 'react';
import { useVHFStore } from '@/stores/vhf';
import type { TranscriptEntry } from '@/lib/vhf/types';
import { AudioReplayBar } from './AudioReplayBar';

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function EntryItem({ entry }: { entry: TranscriptEntry }) {
  const isTx = entry.type === 'tx';
  const borderColor = isTx ? '#f87171' : '#60a5fa';
  const stationColor = isTx ? '#f87171' : '#60a5fa';
  const duration = Math.ceil(entry.message.length / 15);

  const feedbackBorderColor =
    entry.feedback?.type === 'correct' ? '#4ade80' : '#f87171';
  const feedbackBg =
    entry.feedback?.type === 'correct'
      ? 'rgba(74, 222, 128, 0.08)'
      : 'rgba(248, 113, 113, 0.08)';

  return (
    <li
      role="listitem"
      style={{
        display: 'flex',
        marginBottom: '10px',
        listStyle: 'none',
      }}
    >
      {/* TX/RX color indicator bar */}
      <div
        style={{
          width: '3px',
          flexShrink: 0,
          background: borderColor,
          borderRadius: '2px',
          marginRight: '10px',
        }}
      />

      {/* Entry content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Meta row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: stationColor, fontWeight: 'bold' }}>
            {isTx ? 'You' : entry.station}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontFamily: "'Fira Code', monospace",
                fontSize: '9px',
                color: '#8b8b9e',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '3px',
                padding: '1px 4px',
              }}
            >
              CH{entry.channel}
            </span>
            <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', color: '#8b8b9e' }}>
              {formatTime(entry.timestamp)}
            </span>
          </div>
        </div>

        {/* Message text */}
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#e0e0e0', marginBottom: '6px' }}>
          {entry.message}
        </div>

        {/* Audio replay bar */}
        <AudioReplayBar
          duration={duration}
          type={entry.type}
          onPlay={() => {}}
        />

        {/* Inline feedback annotation */}
        {entry.feedback && (
          <div
            style={{
              marginTop: '6px',
              borderLeft: `2px solid ${feedbackBorderColor}`,
              paddingLeft: '8px',
              background: feedbackBg,
              borderRadius: '0 3px 3px 0',
              padding: '4px 8px',
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '11px',
                color: feedbackBorderColor,
              }}
            >
              {entry.feedback.message}
            </span>
          </div>
        )}
      </div>
    </li>
  );
}

export function TranscriptPanel() {
  const transcript = useVHFStore((s) => s.transcript);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current && typeof bottomRef.current.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  const handleClear = () => {
    useVHFStore.getState().clearTranscript();
  };

  const handleExport = () => {
    // Export functionality — no-op placeholder
  };

  const buttonStyle: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: '9px',
    color: '#8b8b9e',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid #2d2d4a',
    borderRadius: '3px',
    padding: '3px 8px',
    cursor: 'pointer',
    letterSpacing: '0.05em',
  };

  return (
    <div
      style={{
        background: '#16213e',
        borderRadius: '6px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '120px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '10px',
            color: '#8b8b9e',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Voice Log
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button style={buttonStyle} onClick={handleClear}>
            Clear
          </button>
          <button style={buttonStyle} onClick={handleExport}>
            Export
          </button>
        </div>
      </div>

      {/* Scrollable entry list */}
      <ul
        style={{
          margin: 0,
          padding: 0,
          flex: 1,
          overflowY: 'auto',
        }}
      >
        {transcript.map((entry) => (
          <EntryItem key={entry.id} entry={entry} />
        ))}
      </ul>
      <div ref={bottomRef} />
    </div>
  );
}
