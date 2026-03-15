import { useVHFStore } from '@/stores/vhf';
import { getChannelFrequency, getChannelName } from '@/lib/vhf/channels';

const styles = {
  screen: {
    backgroundColor: '#16213e',
    color: '#e0e0e0',
    fontFamily: "'Fira Code', monospace",
    padding: '16px',
    borderRadius: '4px',
    border: '1px solid #2d2d4a',
    minWidth: '260px',
    userSelect: 'none' as const,
  },
  statusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11px',
    color: '#8b8b9e',
    marginBottom: '8px',
    fontFamily: "'Inter', sans-serif",
  },
  txIndicator: {
    padding: '2px 6px',
    borderRadius: '2px',
    fontWeight: 700,
    fontSize: '11px',
    letterSpacing: '0.05em',
  },
  channelNumber: {
    textAlign: 'center' as const,
    fontSize: '64px',
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: '-2px',
    margin: '8px 0',
    color: '#e0e0e0',
  },
  frequency: {
    textAlign: 'center' as const,
    fontSize: '13px',
    color: '#8b8b9e',
    marginBottom: '4px',
  },
  channelName: {
    textAlign: 'center' as const,
    fontSize: '11px',
    color: '#8b8b9e',
    fontFamily: "'Inter', sans-serif",
    marginBottom: '8px',
  },
  transcript: {
    borderTop: '1px solid #2d2d4a',
    paddingTop: '8px',
    fontSize: '11px',
    color: '#8b8b9e',
    fontFamily: "'Inter', sans-serif",
    fontStyle: 'italic',
    minHeight: '20px',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

function SquelchBars({ level }: { level: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: '2px', alignItems: 'flex-end' }}>
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            width: '3px',
            height: `${4 + i * 1.5}px`,
            backgroundColor: i < level ? '#4ade80' : '#2d2d4a',
            borderRadius: '1px',
          }}
        />
      ))}
    </span>
  );
}

export function RadioScreen() {
  const { channel, squelch, power, radioState, transcript } = useVHFStore();

  const frequency = getChannelFrequency(channel);
  const channelName = getChannelName(channel);
  const lastEntry = transcript[transcript.length - 1];

  const txColor = radioState === 'tx' ? '#f87171' : radioState === 'rx' ? '#4ade80' : 'transparent';
  const txLabel = radioState === 'tx' ? 'TX' : radioState === 'rx' ? 'RX' : '';

  return (
    <div style={styles.screen}>
      <div style={styles.statusBar}>
        <span>{power}</span>
        <SquelchBars level={squelch} />
        {txLabel ? (
          <span
            style={{
              ...styles.txIndicator,
              backgroundColor: txColor,
              color: '#1a1a2e',
            }}
          >
            {txLabel}
          </span>
        ) : (
          <span style={{ width: '30px' }} />
        )}
      </div>
      <div style={styles.channelNumber}>{channel}</div>
      <div style={styles.frequency}>{frequency} MHz</div>
      <div style={styles.channelName}>{channelName}</div>
      {lastEntry && (
        <div style={styles.transcript}>
          {lastEntry.station}: {lastEntry.message}
        </div>
      )}
    </div>
  );
}
