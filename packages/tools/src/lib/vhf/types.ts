export interface VHFResponse {
  response: {
    station: string;
    message: string;
    channel: number;
  };
  feedback: {
    correct: string[];
    errors: string[];
    protocol_note: string;
  };
  scenario?: {
    state: string;
    next_expected: string;
    complete: boolean;
    score: number | null;
  };
}

export interface TransmitRequest {
  message: string;
  session_id: string;
}

export interface CreateSessionRequest {
  region: string;
  vessel_name: string;
  vessel_type: string;
  scenario_id?: string;
}

export interface Session {
  id: string;
  region: string;
  vessel_name: string;
  vessel_type: string;
  scenario_id?: string;
  messages: Array<{ role: string; content: string }>;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  briefing: string;
}

export interface TranscriptEntry {
  id: string;
  type: 'tx' | 'rx';
  station: string;
  message: string;
  channel: number;
  timestamp: Date;
  apiResponse?: VHFResponse['feedback'];
  feedback?: FeedbackAnnotation;
}

export type RadioMode = 'free' | 'scenario';
export type RadioState = 'idle' | 'tx' | 'rx';
export type PowerLevel = '25W' | '1W';
export type VesselType = 'sailing-yacht' | 'motor-yacht' | 'catamaran';

export type LCDScreenMode = 'vhf' | 'ais' | 'dsc';

export interface AISTarget {
  mmsi: string;
  name: string;
  distance: number;
  bearing: number;
  cpa: number;
  sog: number;
  cog: number;
  vesselType: 'sailing' | 'motor' | 'cargo' | 'tanker' | 'fishing' | 'passenger' | 'vessel';
}

export interface FeedbackAnnotation {
  type: 'correct' | 'warning';
  message: string;
}
