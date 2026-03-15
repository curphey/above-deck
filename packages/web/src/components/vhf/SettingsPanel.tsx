import React, { useEffect, useState } from 'react';
import { useVHFStore } from '@/stores/vhf';
import { getVoices, isTTSSupported } from '@/lib/vhf/speech';
import type { VesselType } from '@/lib/vhf/types';

const labelStyle: React.CSSProperties = {
  fontFamily: "'Space Mono', monospace",
  fontSize: '11px',
  color: '#8b8b9e',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: '4px',
};

const inputStyle: React.CSSProperties = {
  background: '#1a1a2e',
  border: '1px solid #2d2d4a',
  borderRadius: '4px',
  color: '#e0e0e0',
  fontFamily: "'Inter', sans-serif",
  fontSize: '13px',
  padding: '6px 8px',
  width: '100%',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

const fieldStyle: React.CSSProperties = {
  marginBottom: '16px',
};

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const {
    apiKey, setApiKey,
    region, setRegion,
    vesselName, setVesselName,
    vesselType, setVesselType,
    mmsi, setMmsi,
    ttsVoice, setTtsVoice,
    ttsRate, setTtsRate,
    audioEffects, setAudioEffects,
    audioIntensity, setAudioIntensity,
  } = useVHFStore();

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (isTTSSupported()) {
      const loadVoices = () => setVoices(getVoices());
      loadVoices();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  return (
    <div
      style={{
        background: '#16213e',
        border: '1px solid #2d2d4a',
        borderRadius: '8px',
        padding: '20px',
        fontFamily: "'Inter', sans-serif",
        color: '#e0e0e0',
        maxWidth: '400px',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: "'Space Mono', monospace", fontSize: '14px', margin: 0, color: '#e0e0e0' }}>
          Settings
        </h2>
        <button
          onClick={onClose}
          aria-label="Close settings"
          style={{
            background: 'none',
            border: '1px solid #2d2d4a',
            borderRadius: '4px',
            color: '#8b8b9e',
            cursor: 'pointer',
            padding: '4px 10px',
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px',
          }}
        >
          Close
        </button>
      </div>

      {/* API Key */}
      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor="settings-api-key">API Key</label>
        <input
          id="settings-api-key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={inputStyle}
          placeholder="sk-..."
        />
      </div>

      {/* Region */}
      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor="settings-region">Region</label>
        <select
          id="settings-region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          style={selectStyle}
        >
          <option value="uk-south">UK South</option>
          <option value="caribbean">Caribbean</option>
        </select>
      </div>

      {/* Vessel Name */}
      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor="settings-vessel-name">Vessel Name</label>
        <input
          id="settings-vessel-name"
          type="text"
          value={vesselName}
          onChange={(e) => setVesselName(e.target.value)}
          style={inputStyle}
          placeholder="SV Artemis"
        />
      </div>

      {/* MMSI Number */}
      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor="settings-mmsi">MMSI Number</label>
        <input
          id="settings-mmsi"
          type="text"
          value={mmsi}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 9);
            setMmsi(val);
          }}
          style={inputStyle}
          placeholder="235000000"
          maxLength={9}
        />
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#8b8b9e', display: 'block', marginTop: '4px' }}>
          9-digit Maritime Mobile Service Identity
        </span>
      </div>

      {/* Vessel Type */}
      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor="settings-vessel-type">Vessel Type</label>
        <select
          id="settings-vessel-type"
          value={vesselType}
          onChange={(e) => setVesselType(e.target.value as VesselType)}
          style={selectStyle}
        >
          <option value="sailing-yacht">Sailing Yacht</option>
          <option value="motor-yacht">Motor Yacht</option>
          <option value="catamaran">Catamaran</option>
        </select>
      </div>

      {/* TTS Voice */}
      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor="settings-tts-voice">TTS Voice</label>
        <select
          id="settings-tts-voice"
          value={ttsVoice}
          onChange={(e) => setTtsVoice(e.target.value)}
          style={selectStyle}
          disabled={voices.length === 0}
        >
          <option value="">Default</option>
          {voices.map((v) => (
            <option key={v.name} value={v.name}>{v.name}</option>
          ))}
        </select>
      </div>

      {/* TTS Rate */}
      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor="settings-tts-rate">
          TTS Rate ({ttsRate.toFixed(1)}x)
        </label>
        <input
          id="settings-tts-rate"
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={ttsRate}
          onChange={(e) => setTtsRate(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: '#4ade80' }}
        />
      </div>

      {/* Audio Effects */}
      <div style={{ ...fieldStyle, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          id="settings-audio-effects"
          type="checkbox"
          checked={audioEffects}
          onChange={(e) => setAudioEffects(e.target.checked)}
          style={{ accentColor: '#4ade80', width: '16px', height: '16px', cursor: 'pointer' }}
        />
        <label style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }} htmlFor="settings-audio-effects">
          Audio Effects
        </label>
      </div>

      {/* Audio Intensity */}
      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor="settings-audio-intensity">
          Audio Intensity ({audioIntensity.toFixed(1)})
        </label>
        <input
          id="settings-audio-intensity"
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={audioIntensity}
          onChange={(e) => setAudioIntensity(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: '#4ade80' }}
        />
      </div>
    </div>
  );
}
