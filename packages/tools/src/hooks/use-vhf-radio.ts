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
    store.setRadioState('tx');
    if (isSTTSupported()) {
      sttSession.current = createSTTSession();
      sttSession.current.start();
    }
  }, [store]);

  const stopTransmit = useCallback(async (manualText?: string) => {
    let transcript = manualText || '';
    if (!manualText && sttSession.current) {
      transcript = await new Promise<string>((resolve) => {
        sttSession.current!.onResult((text: string) => resolve(text));
        sttSession.current!.stop();
        // Timeout fallback
        setTimeout(() => resolve(''), 3000);
      });
    }

    if (!transcript || !store.sessionId) {
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
      const response = await client.transmit(
        { message: transcript, session_id: store.sessionId },
        store.apiKey,
      );

      if (audioFX.current && store.audioEffects) {
        audioFX.current.playSquelchBreak();
      }

      try {
        await speak(response.response.message, store.ttsVoice, store.ttsRate);
      } catch {
        // TTS may not be available
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
    const session = await client.createSession({
      region: store.region,
      vessel_name: store.vesselName,
      vessel_type: store.vesselType,
      scenario_id: scenarioId,
    }, store.apiKey);
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
