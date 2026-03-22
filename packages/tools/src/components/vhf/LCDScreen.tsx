import { useVHFStore } from '@/stores/vhf';
import { getChannelFrequency, getChannelName } from '@/lib/vhf/channels';
import type { AISTarget } from '@/lib/vhf/types';

// Amber LCD palette
const LCD = {
  text: '#ffaa00',
  textDim: '#cc7a00',
  textFaint: '#7a4a00',
  bg: 'linear-gradient(180deg, #2a1800 0%, #1a1000 100%)',
  bgSolid: '#1a1000',
};

const styles = {
  bezel: {
    background: '#111',
    border: '1px solid #333',
    borderRadius: '3px',
    padding: '2px',
  } as React.CSSProperties,
  screen: {
    position: 'relative' as const,
    background: LCD.bg,
    fontFamily: "'Fira Code', monospace",
    color: LCD.text,
    padding: '10px 12px',
    minWidth: '240px',
    userSelect: 'none' as const,
    overflow: 'hidden',
  } as React.CSSProperties,
  glow: {
    position: 'absolute' as const,
    inset: 0,
    background: 'radial-gradient(ellipse at center, rgba(255,160,0,0.06) 0%, transparent 70%)',
    pointerEvents: 'none' as const,
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '10px',
    color: LCD.textDim,
    marginBottom: '4px',
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  statusBadge: (active: boolean, color: string) => ({
    padding: '1px 5px',
    borderRadius: '2px',
    fontWeight: 700,
    fontSize: '10px',
    letterSpacing: '0.1em',
    background: active ? color : 'transparent',
    color: active ? LCD.bgSolid : color,
    border: `1px solid ${active ? color : color}`,
  } as React.CSSProperties),
  channelNumber: {
    textAlign: 'center' as const,
    fontSize: '58px',
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: '-2px',
    color: LCD.text,
    margin: '4px 0 2px',
  } as React.CSSProperties,
  frequency: {
    textAlign: 'center' as const,
    fontSize: '12px',
    color: LCD.textDim,
    letterSpacing: '0.05em',
    marginBottom: '2px',
  } as React.CSSProperties,
  channelName: {
    textAlign: 'center' as const,
    fontSize: '9px',
    color: LCD.textFaint,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    marginBottom: '6px',
  },
  positionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '9px',
    color: LCD.textFaint,
    letterSpacing: '0.04em',
    marginBottom: '2px',
  } as React.CSSProperties,
  softKeys: {
    display: 'flex',
    justifyContent: 'space-between',
    borderTop: `1px solid ${LCD.textFaint}`,
    paddingTop: '4px',
    marginTop: '4px',
  } as React.CSSProperties,
  softKey: {
    fontSize: '9px',
    color: LCD.textDim,
    letterSpacing: '0.06em',
    flex: 1,
    textAlign: 'center' as const,
  } as React.CSSProperties,
  sectionHeader: {
    fontSize: '10px',
    color: LCD.text,
    letterSpacing: '0.08em',
    marginBottom: '4px',
    borderBottom: `1px solid ${LCD.textFaint}`,
    paddingBottom: '2px',
  } as React.CSSProperties,
  colHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 50px 40px 40px',
    fontSize: '8px',
    color: LCD.textFaint,
    letterSpacing: '0.06em',
    marginBottom: '2px',
  } as React.CSSProperties,
  aisRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 50px 40px 40px',
    fontSize: '9px',
    color: LCD.textDim,
    padding: '1px 0',
  } as React.CSSProperties,
  detailBar: {
    fontSize: '9px',
    color: LCD.textFaint,
    borderTop: `1px solid ${LCD.textFaint}`,
    paddingTop: '2px',
    marginTop: '2px',
    letterSpacing: '0.04em',
  } as React.CSSProperties,
  dscField: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '9px',
    color: LCD.textDim,
    padding: '1px 0',
    letterSpacing: '0.04em',
  } as React.CSSProperties,
};

function SignalBars({ level }: { level: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: '2px', alignItems: 'flex-end' }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            width: '3px',
            height: `${4 + i * 2}px`,
            backgroundColor: i < level ? LCD.text : LCD.textFaint,
            borderRadius: '1px',
          }}
        />
      ))}
    </span>
  );
}

function VHFScreen() {
  const channel = useVHFStore((s) => s.channel);
  const squelch = useVHFStore((s) => s.squelch);
  const power = useVHFStore((s) => s.power);
  const radioState = useVHFStore((s) => s.radioState);
  const region = useVHFStore((s) => s.region);

  const frequency = getChannelFrequency(channel);
  const channelName = getChannelName(channel);

  const statusLabel = radioState === 'tx' ? 'TX' : radioState === 'rx' ? 'RX' : 'STBY';
  const statusColor = radioState === 'tx' ? '#ff4444' : radioState === 'rx' ? '#44ff88' : LCD.textDim;
  const statusActive = radioState === 'tx' || radioState === 'rx';

  const now = new Date();
  const timeStr = now.toUTCString().slice(17, 22) + 'z';
  const regionLabel = region ? region.toUpperCase().slice(0, 8) : 'INT';

  return (
    <>
      <div style={styles.topBar}>
        <span>{power}</span>
        <span>{regionLabel}</span>
        <SignalBars level={Math.ceil(squelch / 2)} />
        <span style={styles.statusBadge(statusActive, statusColor)}>{statusLabel}</span>
      </div>

      <div style={styles.channelNumber}>{channel}</div>
      <div style={styles.frequency}>{frequency} MHz</div>
      <div style={styles.channelName}>{channelName}</div>

      <div style={styles.positionBar}>
        <span>50°09'N 005°04'W</span>
        <span>{timeStr}</span>
      </div>

      <div style={styles.softKeys}>
        {['SCAN', 'D/W', 'CH/WX', 'HI/LO'].map((label) => (
          <span key={label} style={styles.softKey}>{label}</span>
        ))}
      </div>
    </>
  );
}

function AISScreen() {
  const aisTargets = useVHFStore((s) => s.aisTargets);
  const selectedAisTarget = useVHFStore((s) => s.selectedAisTarget);

  const selected = aisTargets.find((t) => t.mmsi === selectedAisTarget);

  return (
    <>
      <div style={styles.sectionHeader}>◆ AIS TARGETS ({aisTargets.length})</div>

      <div style={styles.colHeader}>
        <span>Vessel</span>
        <span>Dist</span>
        <span>Brg</span>
        <span>CPA</span>
      </div>

      {aisTargets.length === 0 ? (
        <div style={{ fontSize: '9px', color: LCD.textFaint, letterSpacing: '0.06em' }}>NO TARGETS</div>
      ) : (
        aisTargets.slice(0, 4).map((t: AISTarget) => (
          <div
            key={t.mmsi}
            style={{
              ...styles.aisRow,
              color: t.mmsi === selectedAisTarget ? LCD.text : LCD.textDim,
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
              {t.name.slice(0, 8)}
            </span>
            <span>{t.distance.toFixed(1)}nm</span>
            <span>{t.bearing}°</span>
            <span>{t.cpa.toFixed(1)}</span>
          </div>
        ))
      )}

      {selected && (
        <div style={styles.detailBar}>
          SOG {selected.sog}kt  COG {selected.cog}°  MMSI {selected.mmsi}
        </div>
      )}

      <div style={styles.softKeys}>
        {['LIST', 'SORT', 'CALL', 'BACK'].map((label) => (
          <span key={label} style={styles.softKey}>{label}</span>
        ))}
      </div>
    </>
  );
}

function DSCScreen() {
  const mmsi = useVHFStore((s) => s.mmsi);
  const channel = useVHFStore((s) => s.channel);

  return (
    <>
      <div style={styles.sectionHeader}>⚠ DSC DISTRESS</div>

      <div style={styles.dscField}>
        <span>NATURE</span>
        <span>UNDESIGNATED</span>
      </div>
      <div style={styles.dscField}>
        <span>MMSI</span>
        <span>{mmsi}</span>
      </div>
      <div style={styles.dscField}>
        <span>POSITION</span>
        <span>50°09'N 005°04'W</span>
      </div>
      <div style={styles.dscField}>
        <span>TIME</span>
        <span>--:--z</span>
      </div>
      <div style={styles.dscField}>
        <span>CHANNEL</span>
        <span>{channel}</span>
      </div>

      <div style={styles.softKeys}>
        {['NATURE', '—', '—', 'CANCEL'].map((label, i) => (
          <span key={i} style={styles.softKey}>{label}</span>
        ))}
      </div>
    </>
  );
}

export function LCDScreen() {
  const lcdScreen = useVHFStore((s) => s.lcdScreen);

  return (
    <div style={styles.bezel}>
      <div style={styles.screen}>
        <div style={styles.glow} />
        {lcdScreen === 'vhf' && <VHFScreen />}
        {lcdScreen === 'ais' && <AISScreen />}
        {lcdScreen === 'dsc' && <DSCScreen />}
      </div>
    </div>
  );
}
