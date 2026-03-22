import { useCallback, useRef, useMemo } from 'react';
import { useVHFStore } from '@/stores/vhf';
import { VHFApiClient } from '@/lib/vhf/api-client';
import { RadioAudioFX } from '@/lib/vhf/audio-fx';
import { isSTTSupported, createSTTSession, speak } from '@/lib/vhf/speech';
import type { TranscriptEntry } from '@/lib/vhf/types';

const API_URL = typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_VHF_API_URL || 'http://localhost:8080';

export function useVHFRadio() {
  const store = useVHFStore();
  const client = useMemo(() => new VHFApiClient(API_URL), []);
  const audioFX = useRef<RadioAudioFX | null>(null);
  const sttSession = useRef<ReturnType<typeof createSTTSession> | null>(null);

  const isReady = !!store.apiKey;

  const startTransmit = useCallback(() => {
    console.log('[VHF] startTransmit — starting STT');
    store.setRadioState('tx');
    if (isSTTSupported()) {
      sttSession.current = createSTTSession();
      sttSession.current.onError((err: any) => console.error('[VHF] STT error:', err));
      sttSession.current.start();
    } else {
      console.warn('[VHF] STT not supported in this browser');
    }
  }, [store]);

  const stopTransmit = useCallback(async (manualText?: string) => {
    console.log('[VHF] stopTransmit — manualText:', manualText, 'sessionId:', store.sessionId);
    let transcript = manualText || '';
    if (!manualText && sttSession.current) {
      transcript = await new Promise<string>((resolve) => {
        sttSession.current!.onResult((text: string) => {
          console.log('[VHF] STT result:', text);
          resolve(text);
        });
        sttSession.current!.stop();
        setTimeout(() => {
          console.warn('[VHF] STT timeout — no speech detected');
          resolve('');
        }, 3000);
      });
    }

    console.log('[VHF] transcript:', JSON.stringify(transcript), 'sessionId:', store.sessionId);
    if (!transcript || !store.sessionId) {
      console.warn('[VHF] Bailing — no transcript or no session');
      store.setRadioState('idle');
      return;
    }

    const txEntry: TranscriptEntry = {
      id: crypto.randomUUID(),
      type: 'tx',
      station: 'You',
      message: transcript,
      channel: store.channel,
      timestamp: new Date(),
    };
    store.addTranscriptEntry(txEntry);

    store.setRadioState('rx');
    try {
      console.log('[VHF] Transmitting to API...', { sessionId: store.sessionId, message: transcript });
      const response = await client.transmit(
        { message: transcript, session_id: store.sessionId },
        store.apiKey,
      );
      console.log('[VHF] API response:', response);

      if (audioFX.current && store.audioEffects) {
        audioFX.current.playSquelchBreak();
      }

      try {
        console.log('[VHF] Speaking TTS:', response.response.message);
        await speak(response.response.message, store.ttsVoice, store.ttsRate);
        console.log('[VHF] TTS complete');
      } catch (ttsErr) {
        console.warn('[VHF] TTS error:', ttsErr);
      }

      const rxEntry: TranscriptEntry = {
        id: crypto.randomUUID(),
        type: 'rx',
        station: response.response.station,
        message: response.response.message,
        channel: response.response.channel,
        timestamp: new Date(),
        apiResponse: response.feedback,
      };
      store.addTranscriptEntry(rxEntry);
    } catch (err) {
      console.error('Transmit error:', err);
    }
    store.setRadioState('idle');
  }, [store, client]);

  const createSession = useCallback(async (scenarioId?: string) => {
    console.log('[VHF] Creating session...');
    const session = await client.createSession({
      region: store.region,
      vessel_name: store.vesselName,
      vessel_type: store.vesselType,
      scenario_id: scenarioId,
    }, store.apiKey);
    console.log('[VHF] Session created:', session.id);
    store.setSessionId(session.id);
    store.clearTranscript();
    if (scenarioId) store.setScenarioId(scenarioId);
  }, [store, client]);

  const selectScenario = useCallback(async (id: string) => {
    await createSession(id);
    store.setMode('scenario');
  }, [createSession, store]);

  return { startTransmit, stopTransmit, createSession, selectScenario, isReady, error: null };
}
