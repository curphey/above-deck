import { useState, useEffect, useCallback } from 'react';
import { useVHFRadio } from '@/hooks/use-vhf-radio';
import { useVHFStore } from '@/stores/vhf';
import { PanelRadio } from './PanelRadio';
import { HandheldRadio } from './HandheldRadio';
import { TranscriptPanel } from './TranscriptPanel';
import { SettingsPanel } from './SettingsPanel';
import { ScenarioPicker } from './ScenarioPicker';
import { VHFApiClient } from '@/lib/vhf/api-client';
import type { Scenario } from '@/lib/vhf/types';

export function VHFSimulator() {
  const { startTransmit, stopTransmit, createSession, selectScenario, isReady } = useVHFRadio();
  const apiKey = useVHFStore(s => s.apiKey);
  const [layout, setLayout] = useState<'panel' | 'handheld'>('panel');
  const [showSettings, setShowSettings] = useState(!apiKey);
  const [showScenarios, setShowScenarios] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const scenarioId = useVHFStore(s => s.scenarioId);

  useEffect(() => {
    const checkWidth = () => setLayout(window.innerWidth >= 768 ? 'panel' : 'handheld');
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  useEffect(() => {
    if (!apiKey) setShowSettings(true);
  }, [apiKey]);

  const handleTransmit = useCallback((message: string) => {
    stopTransmit(message);
  }, [stopTransmit]);

  const transcript = <TranscriptPanel />;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {layout === 'panel' ? (
          <>
            <div style={{ flex: '0 0 auto' }}>
              <PanelRadio onTransmit={handleTransmit} />
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {transcript}
            </div>
          </>
        ) : (
          <HandheldRadio transcriptPanel={transcript} onTransmit={handleTransmit} />
        )}
      </div>

      {showSettings && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{ maxHeight: '100%', overflowY: 'auto' }}>
            <SettingsPanel onClose={() => setShowSettings(false)} />
          </div>
        </div>
      )}

      <div style={{ padding: '8px', display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={() => setShowSettings(true)} style={toolbarBtnStyle}>Settings</button>
        <button onClick={() => createSession()} style={toolbarBtnStyle}>New Session</button>
        <button onClick={() => setShowScenarios(!showScenarios)} style={toolbarBtnStyle}>Scenarios</button>
      </div>
    </div>
  );
}

const toolbarBtnStyle: React.CSSProperties = {
  padding: '6px 12px',
  background: 'rgba(255,255,255,0.1)',
  color: '#e0e0e0',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '4px',
  fontFamily: "'Space Mono', monospace",
  fontSize: '11px',
  cursor: 'pointer',
};
