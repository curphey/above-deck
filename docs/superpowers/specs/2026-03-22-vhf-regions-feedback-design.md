# VHF Radio: Regions Expansion + Instructor Feedback Wiring

## Goal

Add 4 new cruising regions (Mediterranean, SE Asia, Pacific, Atlantic/Canaries) and wire the LLM's feedback response into the FeedbackPanel so users get accumulated instructor feedback during practice sessions.

## Part 1: Wire Instructor Feedback

### Current State

The Go API already returns structured feedback on every transmit response:

```json
{
  "feedback": {
    "correct": ["Used proper calling format"],
    "errors": ["Missing vessel name repetition"],
    "protocol_note": "Respond to coastguard with your message"
  }
}
```

The `FeedbackPanel` component exists and renders correctly, but receives `feedback={[]}` — it's not connected to the API response.

### Changes

**Zustand store (`vhf.ts`):**
- Add `feedbackHistory: FeedbackItem[]` (session state, not persisted)
- Add `addFeedbackItems: (items: FeedbackItem[]) => void`
- Add `clearFeedbackHistory: () => void`
- Type: `FeedbackItem = { type: 'correct' | 'suggestion' | 'tip'; label: string; message: string }`

**Hook (`use-vhf-radio.ts`):**
- After receiving API response, map feedback fields to `FeedbackItem[]`:
  - `feedback.correct[]` → items with `type: 'correct'`, `label: 'Correct'`
  - `feedback.errors[]` → items with `type: 'suggestion'`, `label: 'Correction'`
  - `feedback.protocol_note` → single item with `type: 'tip'`, `label: 'Next Step'`
- Call `store.addFeedbackItems(items)` to accumulate
- Attach `FeedbackAnnotation` to each RX transcript entry using the latest feedback

**VHFSimulator:**
- Read `feedbackHistory` from store and pass to `FeedbackPanel`
- Read scenario progress from store for `scenarioLabel` prop
- Clear `feedbackHistory` when "New Session" is clicked (already clears transcript)

**Transcript entries:**
- Each RX entry already supports optional `feedback: FeedbackAnnotation`
- Wire the first error (if any) as a `warning` annotation, or first correct item as a `correct` annotation

## Part 2: Add Cruising Regions

Add 4 new regions to `packages/api/internal/radio/regions.go`. Each follows the existing structure: ID, name, description, coastguard stations, 5 vessels with personalities, marinas, local flavour.

### Mediterranean (Greek Islands)

- **ID:** `med-greece`
- **Coastguard:** Piraeus JRCC (OLYMPIA RADIO), Hellenic Coast Guard
- **Vessels:** Charter catamaran (mixed nationality), Greek fishing caique (local, speaks Greek first), Turkish gulet (professional crew), Italian motor yacht (gregarious), British cruiser (experienced, heading to Turkey)
- **Marinas:** Kalamaki Marina (Ch12), Poros Town Quay (Ch12), Hydra Port (Ch12), Aegina Marina (Ch12), Gouvia Marina Corfu (Ch69)
- **Local flavour:** Meltemi wind patterns, mandatory AIS in shipping lanes, Greek port police check-in, laid-back VHF culture compared to UK

### Southeast Asia (Thailand/Malaysia)

- **ID:** `se-asia`
- **Coastguard:** MRCC Phuket (THAI MARITIME), Malaysian Maritime (MRCC Putrajaya)
- **Vessels:** Thai longtail operator (limited English, local knowledge), Australian cruiser (heading to Langkawi), French catamaran (rally participant), dive boat operator (commercial, brisk), cargo vessel (professional, follows COLREGS strictly)
- **Marinas:** Ao Po Grand Marina (Ch69), Royal Langkawi Yacht Club (Ch69), Yacht Haven Marina Phuket (Ch73), Rebak Marina (Ch16)
- **Local flavour:** Piracy awareness zones, Strait of Malacca TSS, monsoon seasons, customs check-in at every country, limited coastguard English in some areas

### Pacific (Fiji/Tonga)

- **ID:** `pacific`
- **Coastguard:** MRCC Suva (FIJI NAVY), Tonga Maritime
- **Vessels:** Kiwi cruiser (experienced offshore, heading home), American rally boat (Pacific Puddle Jump), French circumnavigator (solo, experienced), local Fijian fishing vessel (limited VHF protocol), inter-island supply ship (schedules, professional)
- **Marinas:** Vuda Point Marina (Ch16), Musket Cove Marina (Ch68), Neiafu (Tonga, no marina — anchor and check-in), Port Denarau Marina (Ch16)
- **Local flavour:** Sevusevu protocol (kava ceremony on arrival), cyclone season awareness, limited SAR coverage, HF radio nets still active, check-in with Fiji Navy on arrival

### Atlantic / Canaries (ARC Route)

- **ID:** `atlantic`
- **Coastguard:** Las Palmas MRCC (LAS PALMAS RADIO), Cape Verde Coast Guard
- **Vessels:** ARC rally catamaran (first-timers, excited), solo French sailor (veteran Vendee follower), German bluewater cat (methodical, SSB equipped), British cruiser couple (nervous first crossing), professional delivery crew (efficient, no chat)
- **Marinas:** Las Palmas Marina (Ch9), Marina Rubicon Lanzarote (Ch9), Mindelo Marina (Ch16), Santa Cruz de Tenerife (Ch9), Porto Santo (Ch16)
- **Local flavour:** ARC rally net on SSB, weather routing critical (ITCZ position), Portuguese/Spanish VHF conventions, sail-to-waypoint culture, trade wind sailing, watch schedule discipline

## Part 3: Region Selector

**New API endpoint:** `GET /api/vhf/regions`
- Returns list of all regions with ID and name (lightweight, no full vessel data)
- Frontend fetches this on mount to populate the settings dropdown

**Frontend settings panel:**
- Replace hardcoded `<option>` values with dynamic list from API
- Default selection remains `uk-south`

**Frontend region display:**
- The LCD screen's region indicator (currently shows "UK-SOUTH") reads from the store and updates when region changes
