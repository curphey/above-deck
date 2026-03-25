export function isSTTSupported(): boolean {
  return typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function createSTTSession() {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) throw new Error('Speech recognition not supported');

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-GB';

  let resultCallback: ((text: string) => void) | null = null;
  let errorCallback: ((error: Event) => void) | null = null;

  recognition.onresult = (event: any) => {
    const text = event.results[0][0].transcript;
    resultCallback?.(text);
  };

  recognition.onerror = (event: any) => {
    errorCallback?.(event);
  };

  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
    onResult: (cb: (text: string) => void) => { resultCallback = cb; },
    onError: (cb: (error: Event) => void) => { errorCallback = cb; },
  };
}

export function speak(text: string, voice?: string, rate = 1.0): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isTTSSupported()) {
      reject(new Error('TTS not supported'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanForTTS(text));
    utterance.rate = rate;
    utterance.lang = 'en-GB';

    if (voice) {
      const voices = speechSynthesis.getVoices();
      const match = voices.find(v => v.name === voice);
      if (match) utterance.voice = match;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => reject(new Error('TTS error'));

    speechSynthesis.speak(utterance);
  });
}

/** Clean up text for natural TTS pronunciation. */
function cleanForTTS(text: string): string {
  return text
    .replace(/callsign/gi, 'call sign')
    .replace(/MAYDAY/g, 'MAY DAY')
    .replace(/PAN PAN/g, 'PAN PAN')
    .replace(/SECURITÉ/g, 'SECURITAY')
    .replace(/(\d{3})°/g, '$1 degrees')  // 220° → 220 degrees
    .replace(/(\d+)kn/g, '$1 knots')     // 15kn → 15 knots
    .replace(/(\d+)nm/g, '$1 nautical miles') // 5nm → 5 nautical miles
    .replace(/Ch\.?\s*(\d+)/g, 'channel $1')  // Ch16 → channel 16
    .replace(/VHF/g, 'V H F')
    .replace(/DSC/g, 'D S C')
    .replace(/AIS/g, 'A I S')
    .replace(/MMSI/g, 'M M S I')
    .replace(/GMDSS/g, 'G M D S S')
    .replace(/SOG/g, 'speed over ground')
    .replace(/COG/g, 'course over ground');
}

export function getVoices(): SpeechSynthesisVoice[] {
  if (!isTTSSupported()) return [];
  return speechSynthesis.getVoices();
}
