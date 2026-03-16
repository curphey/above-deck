import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TranscriptEntry, RadioState, PowerLevel, VesselType, RadioMode } from '@/lib/vhf/types';

interface VHFState {
  channel: number;
  squelch: number;
  power: PowerLevel;
  radioState: RadioState;
  mode: RadioMode;
  sessionId: string | null;
  transcript: TranscriptEntry[];
  apiKey: string;
  region: string;
  vesselName: string;
  vesselType: VesselType;
  scenarioId: string | null;
  ttsVoice: string;
  ttsRate: number;
  audioEffects: boolean;
  audioIntensity: number;
  mmsi: string;

  setChannel: (ch: number) => void;
  setSquelch: (sq: number) => void;
  togglePower: () => void;
  setRadioState: (state: RadioState) => void;
  setMode: (mode: RadioMode) => void;
  setSessionId: (id: string | null) => void;
  addTranscriptEntry: (entry: TranscriptEntry) => void;
  clearTranscript: () => void;
  setApiKey: (key: string) => void;
  setRegion: (region: string) => void;
  setVesselName: (name: string) => void;
  setVesselType: (type: VesselType) => void;
  setScenarioId: (id: string | null) => void;
  setTtsVoice: (voice: string) => void;
  setTtsRate: (rate: number) => void;
  setAudioEffects: (on: boolean) => void;
  setAudioIntensity: (intensity: number) => void;
  setMmsi: (mmsi: string) => void;
}

export const useVHFStore = create<VHFState>()(
  persist(
    (set) => ({
      channel: 16,
      squelch: 3,
      power: '25W',
      radioState: 'idle',
      mode: 'free',
      sessionId: null,
      transcript: [],
      apiKey: '',
      region: 'uk-south',
      vesselName: 'SV Artemis',
      vesselType: 'sailing-yacht',
      scenarioId: null,
      ttsVoice: '',
      ttsRate: 1.0,
      audioEffects: true,
      audioIntensity: 0.5,
      mmsi: '235' + Math.random().toString().slice(2, 8).padEnd(6, '0'),

      setChannel: (ch) => set({ channel: Math.max(1, Math.min(88, ch)) }),
      setSquelch: (sq) => set({ squelch: Math.max(0, Math.min(9, sq)) }),
      togglePower: () => set((s) => ({ power: s.power === '25W' ? '1W' : '25W' })),
      setRadioState: (state) => set({ radioState: state }),
      setMode: (mode) => set({ mode }),
      setSessionId: (id) => set({ sessionId: id }),
      addTranscriptEntry: (entry) => set((s) => ({ transcript: [...s.transcript, entry] })),
      clearTranscript: () => set({ transcript: [] }),
      setApiKey: (key) => set({ apiKey: key }),
      setRegion: (region) => set({ region }),
      setVesselName: (name) => set({ vesselName: name }),
      setVesselType: (type) => set({ vesselType: type }),
      setScenarioId: (id) => set({ scenarioId: id }),
      setTtsVoice: (voice) => set({ ttsVoice: voice }),
      setTtsRate: (rate) => set({ ttsRate: rate }),
      setAudioEffects: (on) => set({ audioEffects: on }),
      setAudioIntensity: (intensity) => set({ audioIntensity: intensity }),
      setMmsi: (mmsi) => set({ mmsi }),
    }),
    {
      name: 'above-deck-vhf',
      version: 1,
      partialize: (state) => ({
        apiKey: state.apiKey,
        region: state.region,
        vesselName: state.vesselName,
        vesselType: state.vesselType,
        ttsVoice: state.ttsVoice,
        ttsRate: state.ttsRate,
        audioEffects: state.audioEffects,
        audioIntensity: state.audioIntensity,
        channel: state.channel,
        squelch: state.squelch,
        power: state.power,
        mmsi: state.mmsi,
      }),
    }
  )
);
