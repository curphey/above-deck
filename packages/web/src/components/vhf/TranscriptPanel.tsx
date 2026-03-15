import React, { useEffect, useRef } from 'react';
import { useVHFStore } from '@/stores/vhf';
import type { TranscriptEntry } from '@/lib/vhf/types';

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function EntryItem({ entry }: { entry: TranscriptEntry }) {
  const isTx = entry.type === 'tx';
  const borderColor = isTx ? '#f87171' : '#4ade80';
  const stationColor = isTx ? '#f87171' : '#4ade80';

  return (
    <li
      role="listitem"
      style={{
        borderLeft: `3px solid ${borderColor}`,
        paddingLeft: '10px',
        marginBottom: '10px',
        listStyle: 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', color: stationColor, fontWeight: 'bold' }}>
          {isTx ? 'You' : entry.station}
        </span>
        <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', color: '#8b8b9e' }}>
          CH{entry.channel} · {formatTime(entry.timestamp)}
        </span>
      </div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#e0e0e0' }}>
        {entry.message}
      </div>
      {entry.feedback && (
        <div style={{ marginTop: '6px' }}>
          {entry.feedback.correct.map((item, i) => (
            <span
              key={`correct-${i}`}
              style={{
                display: 'inline-block',
                background: 'rgba(74, 222, 128, 0.15)',
                color: '#4ade80',
                border: '1px solid rgba(74, 222, 128, 0.4)',
                borderRadius: '3px',
                padding: '1px 6px',
                fontSize: '11px',
                marginRight: '4px',
                marginBottom: '3px',
                fontFamily: "'Fira Code', monospace",
              }}
            >
              {item}
            </span>
          ))}
          {entry.feedback.errors.map((err, i) => (
            <div
              key={`error-${i}`}
              style={{
                color: '#f87171',
                fontSize: '11px',
                fontFamily: "'Inter', sans-serif",
                marginTop: '2px',
              }}
            >
              {err}
            </div>
          ))}
        </div>
      )}
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

  return (
    <div
      style={{
        background: '#16213e',
        borderRadius: '6px',
        padding: '12px',
        overflowY: 'auto',
        maxHeight: '400px',
        minHeight: '120px',
      }}
    >
      <ul style={{ margin: 0, padding: 0 }}>
        {transcript.map((entry) => (
          <EntryItem key={entry.id} entry={entry} />
        ))}
      </ul>
      <div ref={bottomRef} />
    </div>
  );
}
