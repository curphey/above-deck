import { useVHFStore } from '@/stores/vhf';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    fontFamily: "'Fira Code', monospace",
  },
  label: {
    fontSize: '10px',
    color: '#8b8b9e',
    fontFamily: "'Inter', sans-serif",
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  value: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#e0e0e0',
    lineHeight: 1,
  },
  button: {
    background: '#2d2d4a',
    border: '1px solid #3d3d5a',
    color: '#e0e0e0',
    borderRadius: '3px',
    width: '32px',
    height: '24px',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
};

export function ChannelDial() {
  const { channel, setChannel } = useVHFStore();

  return (
    <div style={styles.container}>
      <span style={styles.label}>CH</span>
      <button
        aria-label="Channel up"
        style={styles.button}
        onClick={() => setChannel(channel + 1)}
      >
        ▲
      </button>
      <span style={styles.value}>{channel}</span>
      <button
        aria-label="Channel down"
        style={styles.button}
        onClick={() => setChannel(channel - 1)}
      >
        ▼
      </button>
    </div>
  );
}
