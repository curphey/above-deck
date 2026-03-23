import { useState, useEffect, useCallback } from 'react';
import { useVHFRadio } from '@/hooks/use-vhf-radio';
import { useVHFStore } from '@/stores/vhf';
import { PanelRadio } from './PanelRadio';
import { HandheldRadio } from './HandheldRadio';
import { TranscriptPanel } from './TranscriptPanel';
import { SettingsPanel } from './SettingsPanel';
import { ScenarioPicker } from './ScenarioPicker';
import { FistMic } from './FistMic';
import { FeedbackPanel } from './FeedbackPanel';

export function VHFSimulator() {
  const { startTransmit, stopTransmit, createSession, selectScenario, isReady } = useVHFRadio();
  const apiKey = useVHFStore(s => s.apiKey);
  const [layout, setLayout] = useState<'panel' | 'handheld'>('panel');
  const [showSettings, setShowSettings] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);
  const scenarioId = useVHFStore(s => s.scenarioId);
  const feedbackHistory = useVHFStore(s => s.feedbackHistory);

  useEffect(() => {
    const checkWidth = () => setLayout(window.innerWidth >= 768 ? 'panel' : 'handheld');
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  useEffect(() => {
    if (!apiKey) setShowSettings(true);
  }, [apiKey]);

  // Auto-create session on mount if none exists
  const sessionId = useVHFStore(s => s.sessionId);
  useEffect(() => {
    if (!sessionId) {
      createSession().catch(err => console.error('[VHF] Auto-create session failed:', err));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTransmit = useCallback((message: string) => {
    stopTransmit(message);
  }, [stopTransmit]);

  const transcript = <TranscriptPanel />;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {layout === 'panel' ? (
          <>
            {/* LEFT COLUMN (50%) */}
            <div style={{ width: '50%', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '16px', gap: '12px', borderRight: '1px solid #2d2d4a' }}>
              <PanelRadio onTransmit={handleTransmit} />
              <FistMic onPressStart={startTransmit} onPressEnd={() => stopTransmit()} />
              <FeedbackPanel
                scenarioLabel={scenarioId || 'Free Practice'}
                feedback={feedbackHistory}
              />
            </div>

            {/* RIGHT COLUMN (50%) */}
            <div style={{ width: '50%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <TranscriptPanel />
            </div>
          </>
        ) : (
          <HandheldRadio transcriptPanel={transcript} onTransmit={handleTransmit} />
        )}
      </div>

      {/* Bottom toolbar */}
      <div style={{ padding: '8px', display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={() => setShowSettings(true)} style={toolbarBtnStyle}>Settings</button>
        <button onClick={() => createSession()} style={toolbarBtnStyle}>New Session</button>
        <button onClick={() => setShowScenarios(!showScenarios)} style={toolbarBtnStyle}>Scenarios</button>
      </div>

      {/* Settings overlay (if shown) */}
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

      {/* Scenarios overlay (if shown) */}
      {showScenarios && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: '#1a1a2e',
            border: '1px solid #2d2d4a',
            borderRadius: '8px',
            padding: '16px',
            maxWidth: '640px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', color: '#e0e0e0' }}>
                Select Scenario
              </div>
              <button
                onClick={() => setShowScenarios(false)}
                style={{ ...toolbarBtnStyle, padding: '4px 8px' }}
              >
                Close
              </button>
            </div>
            <ScenarioPicker
              onSelect={(id) => {
                selectScenario(id);
                setShowScenarios(false);
              }}
              activeScenarioId={scenarioId ?? null}
            />
          </div>
        </div>
      )}
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
