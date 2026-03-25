import { useState } from 'react';
import { PanelRadio } from '../vhf/PanelRadio';
import { LCDScreen } from '../vhf/LCDScreen';
import { FistMic } from '../vhf/FistMic';
import { TranscriptPanel } from '../vhf/TranscriptPanel';
import { FeedbackPanel } from '../vhf/FeedbackPanel';
import { ChartControls } from '../chart/ChartControls';
import { ChartLayerPanel } from '../chart/ChartLayerPanel';
import { ChartWeatherLayer } from '../chart/ChartWeatherLayer';
import { useVHFStore } from '@/stores/vhf';

type Section = 'radio' | 'lcd' | 'controls' | 'panels' | 'theme';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'radio', label: 'VHF Radio' },
  { id: 'lcd', label: 'LCD Screen' },
  { id: 'controls', label: 'Chart Controls' },
  { id: 'panels', label: 'Panels' },
  { id: 'theme', label: 'Theme' },
];

export function UIExplorer() {
  const [section, setSection] = useState<Section>('radio');

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar nav */}
      <div style={{
        width: 160, minWidth: 160, borderRight: '1px solid #2d2d4a',
        background: '#16213e', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700,
          color: '#e0e0e0', padding: '0 12px 8px', borderBottom: '1px solid #2d2d4a',
          marginBottom: 4,
        }}>
          UI Explorer
        </div>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            padding: '6px 12px', border: 'none', textAlign: 'left',
            background: section === s.id ? 'rgba(96,165,250,0.15)' : 'transparent',
            color: section === s.id ? '#60a5fa' : '#8b8b9e',
            borderLeft: section === s.id ? '2px solid #60a5fa' : '2px solid transparent',
            cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: 11,
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {section === 'radio' && <RadioSection />}
        {section === 'lcd' && <LCDSection />}
        {section === 'controls' && <ControlsSection />}
        {section === 'panels' && <PanelsSection />}
        {section === 'theme' && <ThemeSection />}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h2 style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, color: '#e0e0e0', margin: '0 0 16px' }}>{children}</h2>;
}

function ComponentBox({ label, children, width }: { label: string; children: React.ReactNode; width?: number }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 10, color: '#8b8b9e', marginBottom: 8 }}>{label}</div>
      <div style={{
        background: '#1a1a2e', border: '1px solid #2d2d4a', borderRadius: 6, padding: 16,
        display: 'inline-block', width: width || 'auto',
      }}>
        {children}
      </div>
    </div>
  );
}

function RadioSection() {
  return (
    <>
      <SectionTitle>VHF Radio Components</SectionTitle>
      <ComponentBox label="<PanelRadio />" width={500}>
        <PanelRadio onTransmit={(msg) => console.log('TX:', msg)} />
      </ComponentBox>
      <ComponentBox label="<FistMic />">
        <FistMic onPressStart={() => console.log('PTT start')} onPressEnd={() => console.log('PTT end')} />
      </ComponentBox>
    </>
  );
}

function LCDSection() {
  return (
    <>
      <SectionTitle>LCD Screen Modes</SectionTitle>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <ComponentBox label="VHF mode (lcdScreen='vhf')">
          <div onClick={() => useVHFStore.getState().setLcdScreen('vhf')}>
            <LCDScreen />
          </div>
        </ComponentBox>
        <ComponentBox label="AIS mode (lcdScreen='ais')">
          <div onClick={() => useVHFStore.getState().setLcdScreen('ais')}>
            <LCDScreen />
          </div>
        </ComponentBox>
        <ComponentBox label="DSC mode (lcdScreen='dsc')">
          <div onClick={() => useVHFStore.getState().setLcdScreen('dsc')}>
            <LCDScreen />
          </div>
        </ComponentBox>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {(['vhf', 'ais', 'dsc'] as const).map(mode => (
          <button key={mode} onClick={() => useVHFStore.getState().setLcdScreen(mode)} style={{
            padding: '4px 12px', borderRadius: 4, border: '1px solid #2d2d4a',
            background: 'rgba(255,255,255,0.05)', color: '#e0e0e0',
            fontFamily: "'Fira Code', monospace", fontSize: 10, cursor: 'pointer',
          }}>
            {mode.toUpperCase()}
          </button>
        ))}
      </div>
    </>
  );
}

function ControlsSection() {
  return (
    <>
      <SectionTitle>Chart Controls</SectionTitle>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <ComponentBox label="<ChartControls /> (no map)">
          <ChartControls map={null} />
        </ComponentBox>
        <ComponentBox label="<ChartLayerPanel />">
          <div style={{ position: 'relative', width: 200, height: 300 }}>
            <ChartLayerPanel />
          </div>
        </ComponentBox>
        <ComponentBox label="<ChartWeatherLayer />">
          <div style={{ position: 'relative', width: 140, height: 80 }}>
            <ChartWeatherLayer />
          </div>
        </ComponentBox>
      </div>
    </>
  );
}

function PanelsSection() {
  return (
    <>
      <SectionTitle>Panels</SectionTitle>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <ComponentBox label="<TranscriptPanel />" width={400}>
          <div style={{ height: 300 }}>
            <TranscriptPanel />
          </div>
        </ComponentBox>
        <ComponentBox label="<FeedbackPanel />" width={400}>
          <div style={{ height: 300 }}>
            <FeedbackPanel scenarioLabel="Radio Check" feedback={[
              { type: 'correct', message: 'Good use of prowords' },
              { type: 'suggestion', message: 'Say "over" at the end of your transmission' },
              { type: 'tip', message: 'Channel 16 is for distress, safety, and calling only' },
            ]} />
          </div>
        </ComponentBox>
      </div>
    </>
  );
}

function ThemeSection() {
  const colors = [
    { name: 'Deep Navy (bg)', hex: '#1a1a2e' },
    { name: 'Midnight Blue (surface)', hex: '#16213e' },
    { name: 'Pale Grey (text)', hex: '#e0e0e0' },
    { name: 'Slate (secondary)', hex: '#8b8b9e' },
    { name: 'Sea Green (positive)', hex: '#4ade80' },
    { name: 'Coral (warning)', hex: '#f87171' },
    { name: 'Ocean Blue (accent)', hex: '#60a5fa' },
    { name: 'Blueprint Grey (lines)', hex: '#2d2d4a' },
    { name: 'LCD Amber', hex: '#ffaa00' },
    { name: 'LCD Dim', hex: '#cc7a00' },
  ];

  const fonts = [
    { name: 'Space Mono', sample: 'ABOVE DECK — Headings', style: "'Space Mono', monospace" },
    { name: 'Inter', sample: 'Body text — clean and legible at small sizes', style: "'Inter', sans-serif" },
    { name: 'Fira Code', sample: '50°09.12\'N 005°04.56\'W SOG: 5.2kn', style: "'Fira Code', monospace" },
  ];

  return (
    <>
      <SectionTitle>Theme</SectionTitle>

      <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 10, color: '#8b8b9e', marginBottom: 8 }}>Color Palette</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {colors.map(c => (
          <div key={c.hex} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#16213e', border: '1px solid #2d2d4a', borderRadius: 4, padding: '8px 12px',
          }}>
            <div style={{ width: 24, height: 24, borderRadius: 4, background: c.hex, border: '1px solid rgba(255,255,255,0.1)' }} />
            <div>
              <div style={{ fontSize: 11, color: '#e0e0e0' }}>{c.name}</div>
              <div style={{ fontSize: 9, color: '#8b8b9e', fontFamily: "'Fira Code', monospace" }}>{c.hex}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 10, color: '#8b8b9e', marginBottom: 8 }}>Typography</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {fonts.map(f => (
          <div key={f.name} style={{
            background: '#16213e', border: '1px solid #2d2d4a', borderRadius: 4, padding: '12px 16px',
          }}>
            <div style={{ fontSize: 9, color: '#8b8b9e', fontFamily: "'Fira Code', monospace", marginBottom: 4 }}>{f.name}</div>
            <div style={{ fontFamily: f.style, fontSize: 16, color: '#e0e0e0' }}>{f.sample}</div>
          </div>
        ))}
      </div>
    </>
  );
}
