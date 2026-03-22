import { useVHFStore } from '@/stores/vhf';

interface FistMicProps {
  onPressStart: () => void;
  onPressEnd: () => void;
}

export function FistMic({ onPressStart, onPressEnd }: FistMicProps) {
  const radioState = useVHFStore(s => s.radioState);
  const isActive = radioState === 'tx';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: '0px',
      }}
    >
      {/* Coiled cord */}
      <svg
        viewBox="0 0 40 50"
        width="40"
        height="50"
        style={{ flexShrink: 0 }}
        aria-hidden="true"
      >
        <path
          d="M20 0 C20 10, 5 14, 5 24 S20 34, 20 44"
          fill="none"
          stroke="#444"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M20 0 C20 10, 5 14, 5 24 S20 34, 20 44"
          fill="none"
          stroke="#333"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      {/* Mic body */}
      <div
        style={{
          width: '64px',
          background: 'linear-gradient(180deg, #3a3a3a 0%, #222 100%)',
          borderRadius: '8px',
          border: '1px solid #444',
          boxShadow: '0 4px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '8px 0 10px 0',
          gap: '8px',
        }}
      >
        {/* Speaker grille */}
        <div
          style={{
            width: '40px',
            height: '22px',
            background:
              'repeating-linear-gradient(0deg, #333 0px, #333 2px, #222 2px, #222 4px)',
            borderRadius: '4px',
            border: '1px solid #555',
          }}
          aria-hidden="true"
        />

        {/* PTT button */}
        <button
          aria-label="Push to talk"
          onMouseDown={onPressStart}
          onMouseUp={onPressEnd}
          onTouchStart={onPressStart}
          onTouchEnd={onPressEnd}
          style={{
            width: '46px',
            height: '28px',
            background: isActive
              ? 'linear-gradient(180deg, #f87171 0%, #cc4444 100%)'
              : 'linear-gradient(180deg, #555 0%, #333 100%)',
            border: isActive ? '2px solid #f87171' : '2px solid #666',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: "'Space Mono', monospace",
            fontWeight: 700,
            fontSize: '9px',
            color: isActive ? '#fff' : '#ccc',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            transition: 'background 0.08s, border-color 0.08s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          } as React.CSSProperties}
        >
          {isActive ? 'TX' : 'PTT'}
        </button>
      </div>
    </div>
  );
}
