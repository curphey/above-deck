import { useRef } from 'react';
import { useVHFStore } from '@/stores/vhf';

interface PTTButtonProps {
  onTransmit: (message: string) => void;
}

export function PTTButton({ onTransmit }: PTTButtonProps) {
  const { radioState, setRadioState } = useVHFStore();
  const isActive = radioState === 'tx';
  const messageRef = useRef('');

  function handlePressStart() {
    setRadioState('tx');
    messageRef.current = '';
  }

  function handlePressEnd() {
    setRadioState('idle');
    onTransmit(messageRef.current);
  }

  return (
    <button
      aria-label="Push to talk"
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      style={{
        backgroundColor: isActive ? '#f87171' : '#2d2d4a',
        border: isActive ? '2px solid #f87171' : '2px solid #3d3d5a',
        color: isActive ? '#1a1a2e' : '#e0e0e0',
        borderRadius: '50%',
        width: '80px',
        height: '80px',
        cursor: 'pointer',
        fontFamily: "'Space Mono', monospace",
        fontWeight: 700,
        fontSize: '12px',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        transition: 'background-color 0.1s, border-color 0.1s, color 0.1s',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      } as React.CSSProperties}
    >
      {isActive ? 'TX' : 'PTT'}
    </button>
  );
}
