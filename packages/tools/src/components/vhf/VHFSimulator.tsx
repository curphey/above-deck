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
import { ChannelInfo } from './ChannelInfo';
import { ChartView } from '../chart/ChartView';
import { useChartWebSocket } from '../chart/useChartWebSocket';
import { useAISBridge } from './useAISBridge';

const REGION_CENTERS: Record<string, [number, number]> = {
  'uk-south': [-1.3, 50.7],
  'caribbean': [-64.6, 18.4],
  'med-greece': [23.7, 37.9],
  'se-asia': [98.3, 7.9],
  'pacific': [177.0, -17.8],
  'atlantic': [-15.4, 28.1],
};

export function VHFSimulator() {
  const { startTransmit, stopTransmit, createSession, selectScenario, isReady } = useVHFRadio();
  const [layout, setLayout] = useState<'panel' | 'handheld'>('panel');
  const [showSettings, setShowSettings] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);
  const [activeTab, setActiveTab] = useState<'log' | 'feedback' | 'scenario'>('log');
  const scenarioId = useVHFStore(s => s.scenarioId);
  const feedbackHistory = useVHFStore(s => s.feedbackHistory);
  const region = useVHFStore(s => s.region);
  const sessionId = useVHFStore(s => s.sessionId);

  useChartWebSocket(sessionId);
  useAISBridge();

  useEffect(() => {
    const checkWidth = () => setLayout(window.innerWidth >= 768 ? 'panel' : 'handheld');
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  // Settings accessible via toolbar button — don't auto-show
  // Server falls back to ANTHROPIC env var when no client-side key

  // Auto-create session on mount if none exists
  useEffect(() => {
    if (!sessionId) {
      createSession().catch(err => console.error('[VHF] Auto-create session failed:', err));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTransmit = useCallback((message: string) => {
    stopTransmit(message);
  }, [stopTransmit]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {layout === 'panel' ? (
          <>
            {/* LEFT: Radio + Tabs */}
            <div style={{ width: '420px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #2d2d4a', overflow: 'hidden' }}>
              <div style={{ padding: '10px', flexShrink: 0 }}>
                <PanelRadio onTransmit={handleTransmit} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', flexShrink: 0 }}>
                <FistMic onPressStart={startTransmit} onPressEnd={() => stopTransmit()} />
                <ChannelInfo region={region} />
              </div>
              {/* Tab bar */}
              <div style={{ display: 'flex', borderBottom: '1px solid #2d2d4a', flexShrink: 0 }}>
                {(['log', 'feedback', 'scenario'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{
                    flex: 1, padding: '6px', textAlign: 'center',
                    fontFamily: "'Space Mono', monospace", fontSize: '9px',
                    color: activeTab === tab ? '#e0e0e0' : '#8b8b9e',
                    background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: activeTab === tab ? '2px solid #60a5fa' : '2px solid transparent',
                  }}>
                    {tab === 'log' ? 'Voice Log' : tab === 'feedback' ? 'Feedback' : 'Scenario'}
                  </button>
                ))}
              </div>
              {/* Tab content */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {activeTab === 'log' && <TranscriptPanel />}
                {activeTab === 'feedback' && <FeedbackPanel scenarioLabel={scenarioId || 'Free Practice'} feedback={feedbackHistory} />}
                {activeTab === 'scenario' && (
                  <div style={{ padding: '10px', fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#8b8b9e' }}>
                    {scenarioId ? `Active: ${scenarioId}` : 'No scenario active. Click Scenarios to start one.'}
                  </div>
                )}
              </div>
            </div>
            {/* RIGHT: Chartplotter */}
            <div style={{ flex: 1, position: 'relative' }}>
              <ChartView center={REGION_CENTERS[region] || REGION_CENTERS['uk-south']} zoom={11} />
            </div>
          </>
        ) : (
          <HandheldRadio transcriptPanel={<TranscriptPanel />} onTransmit={handleTransmit} />
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
