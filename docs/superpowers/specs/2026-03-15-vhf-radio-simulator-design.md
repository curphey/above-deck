# VHF Radio Simulator — Design Spec

## Overview

A virtual VHF marine radio for practicing radio procedures, targeting RYA Yacht Master exam prep. Users interact with a realistic radio UI using voice (push-to-talk), and an LLM (Claude) plays the radio environment — coastguard, other vessels, marinas, port control — responding with correct VHF protocol.

The implementation will be broken into phases for manageability, but this spec covers the complete feature.

## Goals

- Practice VHF radio calls in a realistic environment without needing a real radio or radio licence
- Learn correct ITU VHF procedures through natural conversation with AI-powered stations
- Support both free practice (open conversation) and guided scenarios (structured exercises)
- Work as a web page and PWA (feels like a real handheld device on mobile)

## Non-Goals

- Multi-user / multiplayer radio simulation
- DSC (Digital Selective Calling) simulation
- AIS integration
- Multiple LLM provider support (Claude only for now)

---

## Architecture

### Frontend: Astro + React Island

The VHF simulator is a single React island (`client:only="react"`) on `pages/tools/vhf.astro`, following the same pattern as the solar EnergyPlanner.

### Backend: Go API Service

A Go HTTP service (`packages/api/`) handles LLM orchestration, conversation state, and scenario logic. Deployed as a Docker container (Fly.io / Railway / Cloud Run).

### Data: Supabase (PostgreSQL)

Conversation history persisted in Supabase. Logged-in users can review past practice sessions. Anonymous users get in-memory sessions (expire after 30 min idle).

### Data Flow

```
User holds PTT
  → Browser SpeechRecognition captures speech
  → Text sent to Go API (POST /api/vhf/transmit)
  → Go service builds prompt, calls Anthropic API with user's key
  → Claude returns structured JSON (dialogue + feedback)
  → Go service persists conversation to Supabase, returns response
  → Browser: response spoken via SpeechSynthesis + Web Audio effects
  → Radio screen shows last message
  → Transcript panel logs full exchange with feedback annotations
```

### Key Architectural Decisions

- **Go backend** — handles LLM calls (no CORS issues), conversation state, scenario management
- **User's own API key** — passed to Go service per-request via auth header. Key stored in localStorage on client, transmitted over HTTPS, never persisted server-side.
- **Anthropic API only** — Go service calls Claude on behalf of the user
- **Supabase for persistence** — conversation history, session management. Ties into existing auth (Google OAuth).
- **Browser Speech APIs** — Web Speech API for STT, SpeechSynthesis for TTS (client-side)
- **Web Audio API** — band-pass filter, static/crackle effects for radio realism (client-side)
- **Zustand store** — persists radio settings and UI state to localStorage
- **Docker deployment** — Go compiles to single binary, tiny container image

---

## User Interface

### Two Radio Layouts

**Desktop (≥768px): Fixed-mount panel radio** — inspired by the Garmin VHF 215i. LCD screen on the left showing channel, frequency, and last message. Physical-style controls on the right (channel knob, squelch knob, button grid). Fist microphone with PTT button below. Transcript panel beneath the radio.

**Mobile/PWA (<768px): Handheld radio** — inspired by the Garmin Cortex H1P. Full-screen device with antenna, speaker grille, screen, and controls. Transcript accessible via swipe-up sheet.

**Desktop can optionally toggle to handheld view.** Mobile never shows the panel view.

Both layouts share the same sub-components (RadioScreen, ChannelDial, SquelchDial, PTTButton) composed differently.

### Visual Design

**Light mode (e-ink):** Paper `#f4f1eb` background, ink `#1a1a1a` text, titanium bezel, muted green (RX) and red (TX/emergency) accents. Matches the landing page chartplotter aesthetic.

**Dark mode (Garmin night):** Navy `#1a1a2e` background, surface `#16213e`, white/pale grey `#e0e0e0` text for channel numbers and primary readouts, dark metal bezel. Green `#4ade80` for RX, coral `#f87171` for TX/emergency. Blue `#60a5fa` for interactive elements only. Follows the brand colour palette.

**Fonts:** Fira Code for all data (channels, frequencies, timestamps), Inter for labels and descriptions. Same as the rest of the project.

### Radio Screen Display

Shows:
- Status bar: power (25W/1W), squelch level, DSC indicator, UTC time
- Channel number (large, centered)
- Frequency (below channel)
- Channel name/description
- Last received or transmitted message with station name and timestamp

### Transcript Panel

Scrollable log of all transmissions in the session:
- RX messages: green left-border, station name, timestamp
- TX messages: red left-border, "You", timestamp, speech-to-text transcription
- Feedback annotations (in scenario mode): green badges for correct procedure, inline notes for errors
- Scenario debrief appears at the end of a completed exercise

### Controls

- **Channel dial** — rotatable knob, changes channel (1-88). Click/drag on desktop, swipe on mobile.
- **Squelch dial** — adjusts background noise threshold. Higher = less static.
- **PTT button** — hold to transmit. Mouse hold on desktop, touch hold on mobile. Large touch target on handheld.
- **CH16 button** — instant jump to Channel 16 (distress/calling). Red accent.
- **H/L button** — toggle high (25W) / low (1W) power.
- **CALL button** — rendered disabled in v1 (DSC in later sub-project).
- **WX button** — shortcut to weather channel (same as dialling to the weather channel manually).

---

## LLM Conversation Engine

### Approach: Hybrid (LLM + Structured Feedback)

A single Claude conversation per session. The system prompt instructs Claude to return structured JSON alongside radio dialogue, enabling the client to render feedback annotations and track scenario progress.

### System Prompt Structure

The system prompt includes:

1. **Role definition** — "You are the VHF radio environment simulator. You play all stations: coastguard, port control, marinas, other vessels."
2. **VHF regulations** — ITU Radio Regulations, GMDSS procedures, correct call formats, phonetic alphabet, channel usage rules, prowords ("over", "out", "roger", "say again")
3. **Region world state** — injected based on selected cruising region. Includes coastguard stations, nearby vessels (names, types, nationalities, personalities), marinas, anchorages.
4. **Scenario instructions** (if in scenario mode) — exercise briefing, expected procedure, completion criteria.
5. **Response format** — JSON schema with `response`, `feedback`, and `scenario` objects.

### Response JSON Schema

```json
{
  "response": {
    "station": "string — who is speaking",
    "message": "string — the radio dialogue",
    "channel": "number — current channel"
  },
  "feedback": {
    "correct": ["string[] — things the user did right"],
    "errors": ["string[] — protocol mistakes"],
    "protocol_note": "string — what should happen next"
  },
  "scenario": {
    "state": "string — current scenario step",
    "next_expected": "string — what the user should do next",
    "complete": "boolean — is the scenario finished",
    "score": "number|null — final score if complete (0-100)"
  }
}
```

### Token Management

- System prompt: ~2000 tokens (constant)
- Conversation history kept in Zustand store
- After ~20 exchanges, older messages are truncated (earliest messages dropped, keeping the system prompt and most recent 10 exchanges). No separate summarisation call — simple sliding window to keep costs predictable.
- Estimated cost: ~$0.01-0.03 per exchange

---

## Speech & Audio

### Speech-to-Text

- Web Speech API (`SpeechRecognition`) — starts on PTT press, finalises on release
- TX indicator glows while transmitting
- Falls back to text input if browser doesn't support STT or mic permission denied

### Text-to-Speech

- `SpeechSynthesis` API for response playback
- Audio routed through Web Audio API effects chain:
  - Band-pass filter (300Hz–3kHz) — VHF radio frequency response
  - Light distortion/compression — characteristic radio edge
  - Static burst at start/end of transmission — squelch break sound
  - Low-level background white noise — adjustable via squelch knob

### Audio State Machine

```
Idle (quiet hiss based on squelch)
  → RX (squelch break + incoming audio + effects)
  → Idle
Idle
  → TX (PTT held, mic active, TX indicator red)
  → Idle
```

### Graceful Degradation

- No mic permission → text input fallback
- No SpeechRecognition support → text input fallback
- No SpeechSynthesis → text-only responses in transcript
- Each degradation shows a clear message to the user

---

## Scenarios & Training

### Two Modes

**Free Practice** — default. Open radio environment with realistic local vessels, coastguard, and marinas. No scoring. Users can call any station, have natural conversations (ask about moorings, restaurants, conditions), and practice at their own pace.

**Guided Scenarios** — structured exercises for RYA exam prep. Accessible from the transcript panel via a scenario picker.

### Starter Scenarios

| Scenario | Description |
|----------|-------------|
| Radio Check | Request signal report from coastguard on CH16 |
| Pan-Pan | Declare urgency (engine failure, crew injury) |
| Mayday | Full distress call with position, vessel description |
| Mayday Relay | Hear and relay another vessel's Mayday |
| Securité | Broadcast navigational/weather warning |
| Routine Call | Contact vessel, agree working channel, conversation |

Each scenario includes:
- **Briefing** — situation setup with your vessel, position, circumstances
- **Expected procedure** — step-by-step correct protocol
- **LLM instructions** — injected into system prompt for Claude's role
- **Completion criteria** — tracked via feedback JSON
- **Debrief** — summary of performance shown in transcript panel

### Scenario Data

Defined in `lib/vhf/scenarios.ts` as typed objects. Pure client-side, no database.

---

## Cruising Regions

The radio environment changes based on selected region. Each region provides:

- Coastguard / port authority stations with correct call signs
- 4-6 nearby vessels with names, types, nationalities, personalities
- Marinas and anchorages with working channels
- Local flavour (accented English, local knowledge, cultural context)

### Starter Regions

| Region | Highlights |
|--------|-----------|
| UK South Coast | Falmouth, Solent, Channel Islands. Falmouth Coastguard, cross-channel traffic |
| Mediterranean | Côte d'Azur, Greek Islands, Croatia. Port authorities, charter fleets |
| Caribbean | BVI, Grenadines, Antigua. Cruiser nets, charter boats, customs check-in |
| Southeast Asia | Thailand, Malaysia, Indonesia. Dive boats, anchorage communities |
| Pacific | Fiji, Tonga, New Zealand. Long-passage vessels, radio nets |
| Canaries / Atlantic | Las Palmas, ARC rally, mid-ocean comms |

**Ship with 2 regions for v1** (UK South Coast + Caribbean). Add remaining regions incrementally — the data authoring (accurate callsigns, working channels, local knowledge) needs to be credible.

Region data lives in `lib/vhf/regions.ts` as typed objects.

---

## Settings

Accessible from gear icon on radio or transcript panel. All stored in localStorage via Zustand.

| Setting | Description |
|---------|-------------|
| API Key | Anthropic API key (paste from console.anthropic.com). Validated on save. |
| Region | Cruising area picker |
| Call Sign | Your vessel name (default: "SV Artemis") |
| Vessel Type | Sailing yacht, motor yacht, catamaran |
| TTS Voice | Select from available browser voices |
| TTS Rate | Speech speed |
| Audio Effects | Toggle static/crackle, adjust intensity |
| Mic Input | Select microphone |

**No account needed for basic use.** API key stored in localStorage. Logged-in users (Google OAuth via Supabase) get conversation history persistence and session review.

---

## File Structure

### Go API (`packages/api/`)

```
packages/api/
├── cmd/server/
│   └── main.go                        # Entry point, HTTP server setup
├── internal/
│   ├── handler/
│   │   ├── transmit.go                # POST /api/vhf/transmit
│   │   ├── session.go                 # Session CRUD endpoints
│   │   ├── scenarios.go               # GET /api/vhf/scenarios
│   │   └── health.go                  # GET /health
│   ├── llm/
│   │   ├── client.go                  # Anthropic API client
│   │   ├── prompt.go                  # System prompt builder
│   │   └── client_test.go
│   ├── radio/
│   │   ├── channels.go                # ITU channel↔frequency map
│   │   ├── regions.go                 # Cruising regions + world state
│   │   ├── scenarios.go               # Scenario definitions
│   │   ├── channels_test.go
│   │   ├── regions_test.go
│   │   └── scenarios_test.go
│   ├── session/
│   │   ├── manager.go                 # Session lifecycle, conversation state
│   │   ├── store.go                   # Supabase persistence
│   │   └── manager_test.go
│   └── middleware/
│       ├── auth.go                    # Extract user from Supabase JWT
│       └── cors.go                    # CORS for frontend
├── Dockerfile
├── go.mod
└── go.sum
```

### Frontend (`packages/web/src/`)

```
packages/web/src/
├── pages/tools/vhf.astro
├── components/vhf/
│   ├── VHFSimulator.tsx               # Top-level island
│   ├── RadioPanel.tsx                 # Shared radio logic
│   ├── PanelRadio.tsx                 # Desktop fixed-mount layout
│   ├── HandheldRadio.tsx              # Mobile handheld layout
│   ├── RadioScreen.tsx                # LCD display
│   ├── ChannelDial.tsx                # Rotatable channel knob
│   ├── SquelchDial.tsx                # Squelch knob
│   ├── PTTButton.tsx                  # Push-to-talk
│   ├── TranscriptPanel.tsx            # Log + feedback
│   ├── ScenarioPicker.tsx             # Exercise selector
│   ├── SettingsPanel.tsx              # API key, region, voice
│   └── RegionPicker.tsx               # Cruising region selector
├── stores/vhf.ts                      # Zustand store (UI state, settings)
├── hooks/
│   └── use-vhf-radio.ts              # Orchestrates speech + Go API + audio
├── lib/vhf/
│   ├── types.ts                       # Shared interfaces
│   ├── api-client.ts                  # Go API client (fetch wrapper)
│   ├── speech.ts                      # STT/TTS wrappers
│   ├── audio-fx.ts                    # Web Audio effects
│   └── __tests__/
│       ├── api-client.test.ts
│       └── speech.test.ts
└── test/vhf/
    └── vhf.test.ts                    # Smoke tests
```

---

## Testing Strategy

### Go (packages/api/)
- **Unit tests (`go test`):** Channel lookups, prompt building, scenario definitions, region data, session management
- **Handler tests:** HTTP handler tests with `httptest` — request/response validation, auth middleware, error cases
- **Integration:** Tests against real Anthropic API (gated behind env var, not run in CI by default)

### Frontend (packages/web/)
- **Unit tests (Vitest):** API client, speech wrappers, audio effects
- **Component tests (Vitest + Testing Library):** RadioScreen renders channel, TranscriptPanel shows messages, SettingsPanel validates API key
- **No e2e** — LLM responses are non-deterministic, making automated e2e unreliable

---

## Future Enhancements

- **Scenario scoring & progress** — persistent scores, exercise history, completion tracking (may use Supabase)
- **Additional LLM providers** — OpenAI, Groq, open gateway for OpenAI-compatible endpoints
- **DSC simulation** — Digital Selective Calling procedures
- **Community scenarios** — user-contributed exercises shared via the platform
