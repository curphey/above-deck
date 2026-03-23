# VHF Radio Simulator — UI Redesign Design Spec

## Goal

Redesign the desktop VHF radio simulator from the current abstract button/dial layout to a realistic Garmin VHF 210/215i–inspired panel radio, with a reorganized app layout that separates the radio, instructor feedback, and voice log.

## Reference

- Garmin VHF 210/215i fixed-mount marine VHF radio
- ICOM IC-M330 fixed-mount marine VHF radio
- Static mockup validated at `.superpowers/brainstorm/3500-1774130127/vhf-full-layout-v3.html`

## Layout (Desktop ≥768px)

**50/50 split within the MFD frame:**

### Left Column (50%)
1. **Radio Unit** — Realistic fixed-size radio body in a mounting bracket
   - Left edge: Brand label (vertical), red DISTRESS/SOS button with protective cover
   - Center: Amber LCD screen in bezel showing VHF channel, AIS targets, or DSC screens
   - Right: Button pad (C/A, ENT, MEN, CLR, blue 16/9, green AIS with LED, amber DSC with LED, VOL/SQL rotary knob)
   - Below screen: 4 physical soft keys mapped to LCD soft-key labels
2. **Fist Mic** — Separate mic body with coiled cord (SVG), speaker grille (CSS gradient), PTT button
3. **Instructor Feedback Panel** — Below the mic
   - Scenario progress badge (e.g. "Radio Check — Step 2/4")
   - Correct / Suggestion / Next Step feedback items
   - Color-coded: green (correct), red (suggestion), blue (next step)

### Right Column (50%)
1. **Voice Log** — Full-height scrollable transcript
   - Header with Clear / Export controls
   - Each entry shows: TX/RX color bar, timestamp, station name, channel badge, message text
   - **Audio replay**: Play button with animated waveform bars and duration on each entry
   - **Inline feedback annotations**: Green (correct) or red (warning) badges attached to specific transmissions

## LCD Screens

All screens render inside the same amber LCD panel, switched via radio buttons:

### VHF Channel Screen (default)
- Top row: Power (25W/1W), region, STBY/TX/RX status, signal bars
- Main: Position (lat/lon), time, large channel number
- Bottom: Soft-key labels — SCAN, D/W, CH/WX, HI/LO

### AIS Targets Screen (toggled via AIS button)
- Header: "◆ AIS TARGETS", vessel count
- Table: Icon, Vessel Name, Distance, Bearing, CPA (red for close approaches)
- Detail bar: Selected vessel's MMSI, SOG, COG
- Soft keys: LIST, SORT, **CALL** (highlighted), BACK
- Clickable rows to select vessel

### DSC Screen (toggled via DSC button or SOS)
- Nature of distress, MMSI, position, time, channel
- Soft keys: NATURE, —, —, CANCEL

## Radio Controls

| Button | Action |
|--------|--------|
| AIS | Toggle AIS target list (LED lights when active) |
| DSC | Toggle DSC screen (LED lights when active) |
| SOS/DISTRESS | Jump to DSC distress screen |
| 16/9 | Return to VHF channel screen, set CH16 |
| CLR | Return to VHF from any sub-screen |
| C/A | Call/Answer |
| ENT | Enter/Confirm |
| MEN | Menu |
| Soft keys 1-4 | Context-dependent per LCD screen |
| VOL/SQL knob | Volume and squelch adjustment |
| PTT (on mic) | Push-to-talk — triggers TX |

## Visual Design

All CSS, no images:
- **Radio body**: CSS gradients, borders, box-shadows for 3D depth
- **Mounting bracket**: Dark gradient with screw details (radial gradients)
- **LCD**: Amber/orange on dark brown (`#ffaa00` on `#1a1000`), glow via radial gradient overlay
- **Buttons**: CSS gradients with inset highlights, active states shift down 1px
- **Knob**: Circular gradient with position indicator line
- **Mic cord**: Inline SVG path (coiled curve)
- **Speaker grille**: Repeating linear gradient
- **Waveform bars**: Randomized-height divs with played/unplayed states
- **LED indicators**: 3-4px circles with box-shadow glow when active

## AIS Integration

New feature added to the radio:
- AIS button on the radio body toggles AIS target list on the LCD
- Backend already has AIS client stub (`packages/api/internal/ais/`) with aisstream.io WebSocket
- Vessel type: MMSI, name, call sign, position, destination, vessel type code
- Frontend needs new AIS store state and display components
- CALL soft key on AIS screen initiates DSC call to selected vessel's MMSI

## API Key Fallback

The Go server now supports reading the Anthropic API key from the `ANTHROPIC` environment variable as a fallback when no `X-API-Key` header is provided. This allows local development without entering the key in the settings UI.

## Existing Components to Rewrite

| Component | Change |
|-----------|--------|
| `PanelRadio.tsx` | Full rewrite → realistic radio body with mounting bracket, LCD, button pad |
| `RadioScreen.tsx` | Full rewrite → amber LCD with VHF/AIS/DSC screen modes |
| `PTTButton.tsx` | Restyle as fist mic body with speaker grille and coiled cord |
| `ChannelDial.tsx` | Remove — channel control moves to button pad |
| `SquelchDial.tsx` | Remove — squelch control moves to VOL/SQL knob |
| `VHFSimulator.tsx` | Rewrite layout → 50/50 split, add feedback panel, restructure transcript |
| `TranscriptPanel.tsx` | Enhance → add audio replay, waveform, inline feedback, Clear/Export |

## New Components

| Component | Purpose |
|-----------|---------|
| `LCDScreen.tsx` | Unified LCD renderer with VHF/AIS/DSC screen modes |
| `AISTargetList.tsx` | AIS target rows within the LCD |
| `FistMic.tsx` | Mic body with coiled cord SVG and PTT button |
| `FeedbackPanel.tsx` | Instructor feedback below the radio |
| `AudioReplayBar.tsx` | Play button + waveform + duration for transcript entries |

## Mobile Layout

The `HandheldRadio.tsx` is out of scope for this redesign. It will be addressed separately.
