const REGION_AGENTS: Record<string, Array<{ name: string; type: string }>> = {
  'uk-south': [
    { name: 'Solent Coastguard', type: 'coastguard' },
    { name: 'Falmouth Coastguard', type: 'coastguard' },
    { name: 'Doris May', type: 'vessel' },
    { name: 'Blue Horizon', type: 'vessel' },
    { name: 'Saoirse', type: 'vessel' },
    { name: 'Windchaser', type: 'vessel' },
    { name: 'Nordic Spirit', type: 'vessel' },
  ],
  'caribbean': [
    { name: 'VISAR', type: 'coastguard' },
    { name: 'Antigua Coastguard', type: 'coastguard' },
    { name: 'Island Time', type: 'vessel' },
    { name: 'Sunsail 4204', type: 'vessel' },
    { name: 'Rhum Runner', type: 'vessel' },
    { name: 'Trade Wind', type: 'vessel' },
    { name: 'Sea Biscuit', type: 'vessel' },
  ],
  'med-greece': [
    { name: 'Olympia Radio', type: 'coastguard' },
    { name: 'Piraeus JRCC', type: 'coastguard' },
    { name: 'Katamarano', type: 'vessel' },
    { name: 'Agios Nikolaos', type: 'vessel' },
    { name: 'Rüzgar', type: 'vessel' },
    { name: 'Bella Vita', type: 'vessel' },
    { name: 'Fair Wind', type: 'vessel' },
  ],
  'se-asia': [
    { name: 'MRCC Phuket', type: 'coastguard' },
    { name: 'MRCC Putrajaya', type: 'coastguard' },
    { name: 'Somchai', type: 'vessel' },
    { name: 'Southern Cross', type: 'vessel' },
    { name: 'Libre', type: 'vessel' },
    { name: 'Dive Master', type: 'vessel' },
    { name: 'Hai Long', type: 'vessel' },
  ],
  'pacific': [
    { name: 'MRCC Suva', type: 'coastguard' },
    { name: "Nuku'alofa Radio", type: 'coastguard' },
    { name: 'Kia Ora', type: 'vessel' },
    { name: 'Windward Passage', type: 'vessel' },
    { name: 'Escapade', type: 'vessel' },
    { name: 'Tui Tai', type: 'vessel' },
    { name: 'Fiji Princess', type: 'vessel' },
  ],
  'atlantic': [
    { name: 'Las Palmas Radio', type: 'coastguard' },
    { name: 'Cape Verde Radio', type: 'coastguard' },
    { name: 'Fair Winds', type: 'vessel' },
    { name: 'Petit Bateau', type: 'vessel' },
    { name: 'Sturmvogel', type: 'vessel' },
    { name: 'Ocean Wanderer', type: 'vessel' },
    { name: 'Express Delivery', type: 'vessel' },
  ],
};

interface ChannelInfoProps {
  region: string;
}

export function ChannelInfo({ region }: ChannelInfoProps) {
  const agents = REGION_AGENTS[region] ?? [];

  if (agents.length === 0) return null;

  return (
    <div style={{ paddingTop: '4px' }}>
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: '10px',
        textTransform: 'uppercase',
        color: '#8b8b9e',
        letterSpacing: '0.08em',
        marginBottom: '6px',
      }}>
        On Channel
      </div>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
      }}>
        {agents.map((agent) => (
          <span
            key={agent.name}
            style={agent.type === 'coastguard' ? coastguardChipStyle : vesselChipStyle}
          >
            {agent.name}
          </span>
        ))}
      </div>
    </div>
  );
}

const baseChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 8px',
  borderRadius: '12px',
  fontSize: '10px',
  fontFamily: 'Inter, sans-serif',
  whiteSpace: 'nowrap',
};

const coastguardChipStyle: React.CSSProperties = {
  ...baseChipStyle,
  background: 'rgba(96,165,250,0.15)',
  color: '#60a5fa',
  border: '1px solid rgba(96,165,250,0.3)',
};

const vesselChipStyle: React.CSSProperties = {
  ...baseChipStyle,
  background: 'rgba(255,255,255,0.05)',
  color: '#8b8b9e',
  border: '1px solid rgba(255,255,255,0.1)',
};
