import { useState } from 'react';

const ALERT_TYPES = ['distress', 'urgency', 'safety', 'routine', 'all-ships'] as const;
type AlertType = (typeof ALERT_TYPES)[number];

const DISTRESS_NATURES = [
  'undesignated', 'fire-explosion', 'flooding', 'collision', 'grounding',
  'capsizing', 'sinking', 'disabled-adrift', 'abandoning-ship', 'mob', 'piracy',
] as const;

const DISTRESS_LABELS: Record<string, string> = {
  'undesignated': 'Undesignated',
  'fire-explosion': 'Fire/Explosion',
  'flooding': 'Flooding',
  'collision': 'Collision',
  'grounding': 'Grounding',
  'capsizing': 'Capsizing',
  'sinking': 'Sinking',
  'disabled-adrift': 'Disabled/Adrift',
  'abandoning-ship': 'Abandoning Ship',
  'mob': 'MOB',
  'piracy': 'Piracy',
};

interface DSCAlert {
  type: AlertType;
  nature?: string;
  mmsi: string;
  targetMmsi?: string;
}

interface DSCPanelProps {
  onSendAlert: (alert: DSCAlert) => void;
  onCancel: () => void;
  mmsi: string;
  position?: string;
}

export function DSCPanel({ onSendAlert, onCancel, mmsi, position }: DSCPanelProps) {
  const [alertType, setAlertType] = useState<AlertType | null>(null);
  const [nature, setNature] = useState<string | null>(null);
  const [targetMmsi, setTargetMmsi] = useState('');
  const [confirming, setConfirming] = useState(false);

  function handleSend() {
    if (alertType === 'distress' && !confirming) {
      setConfirming(true);
      return;
    }
    onSendAlert({
      type: alertType!,
      nature: nature ?? undefined,
      mmsi,
      targetMmsi: targetMmsi || undefined,
    });
  }

  // Style the panel with dark theme matching radio aesthetic
  const panelStyle: React.CSSProperties = {
    background: '#16213e',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px',
    padding: '16px',
    fontFamily: "'Space Mono', monospace",
    color: '#e0e0e0',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    paddingBottom: '8px',
  };

  const typeBtnStyle = (type: AlertType, active: boolean): React.CSSProperties => ({
    padding: '8px 12px',
    border: active ? '2px solid #4ade80' : '1px solid rgba(255,255,255,0.2)',
    borderRadius: '4px',
    background: type === 'distress' && active ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.05)',
    color: type === 'distress' ? '#f87171' : '#e0e0e0',
    fontFamily: "'Space Mono', monospace",
    fontSize: '12px',
    cursor: 'pointer',
  });

  const natureBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 10px',
    border: active ? '2px solid #f87171' : '1px solid rgba(255,255,255,0.15)',
    borderRadius: '4px',
    background: active ? 'rgba(248,113,113,0.15)' : 'transparent',
    color: '#e0e0e0',
    fontFamily: "'Inter', sans-serif",
    fontSize: '11px',
    cursor: 'pointer',
  });

  const sendBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    marginTop: '12px',
    border: 'none',
    borderRadius: '4px',
    background: confirming ? '#f87171' : '#4ade80',
    color: '#fff',
    fontFamily: "'Space Mono', monospace",
    fontSize: '13px',
    fontWeight: 700,
    cursor: alertType === 'distress' && !nature ? 'not-allowed' : 'pointer',
    opacity: alertType === 'distress' && !nature ? 0.5 : 1,
  };

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontSize: '14px', fontWeight: 700 }}>DSC Alert</span>
        <button
          onClick={onCancel}
          style={{ background: 'none', border: 'none', color: '#8b8b9e', cursor: 'pointer', fontFamily: "'Space Mono', monospace", fontSize: '12px' }}
        >
          Cancel
        </button>
      </div>

      <div style={{ fontSize: '11px', color: '#8b8b9e', marginBottom: '4px' }}>MMSI: {mmsi}</div>
      {position && <div style={{ fontSize: '11px', color: '#8b8b9e', marginBottom: '8px' }}>Position: {position}</div>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
        {ALERT_TYPES.map((type) => (
          <button
            key={type}
            style={typeBtnStyle(type, alertType === type)}
            onClick={() => { setAlertType(type); setConfirming(false); setNature(null); }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {alertType === 'distress' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
          {DISTRESS_NATURES.map((n) => (
            <button key={n} style={natureBtnStyle(nature === n)} onClick={() => setNature(n)}>
              {DISTRESS_LABELS[n]}
            </button>
          ))}
        </div>
      )}

      {alertType && alertType !== 'all-ships' && alertType !== 'distress' && (
        <input
          placeholder="Target MMSI (9 digits)"
          value={targetMmsi}
          onChange={(e) => setTargetMmsi(e.target.value.replace(/\D/g, '').slice(0, 9))}
          style={{
            width: '100%',
            padding: '8px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '4px',
            color: '#e0e0e0',
            fontFamily: "'Fira Code', monospace",
            fontSize: '12px',
            marginBottom: '8px',
            boxSizing: 'border-box',
          }}
        />
      )}

      {alertType && (
        <button
          style={sendBtnStyle}
          onClick={handleSend}
          disabled={alertType === 'distress' && !nature}
        >
          {confirming ? 'Confirm' : 'Send'}
        </button>
      )}
    </div>
  );
}
