# VHF Radio Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the desktop VHF radio simulator to a realistic Garmin-inspired panel radio with 50/50 layout (radio+feedback | voice log with replay), AIS target display, and inline instructor feedback.

**Architecture:** Replace existing abstract UI components with a realistic CSS-rendered radio body containing an amber LCD with switchable screens (VHF/AIS/DSC). The VHFSimulator layout changes from radio-left/transcript-right to a 50/50 split with feedback panel below the radio. TranscriptPanel gains audio replay and inline feedback annotations.

**Tech Stack:** React 19, Zustand 5, CSS-in-JS (inline styles), Web Audio API, SVG

**Design Spec:** `docs/superpowers/specs/2026-03-22-vhf-radio-redesign-design.md`
**Validated Mockup:** `.superpowers/brainstorm/3500-1774130127/vhf-full-layout-v3.html`

---

## File Structure

### New Files
- `packages/tools/src/components/vhf/LCDScreen.tsx` — Amber LCD renderer with VHF/AIS/DSC screen modes
- `packages/tools/src/components/vhf/AISTargetList.tsx` — AIS target rows rendered inside the LCD
- `packages/tools/src/components/vhf/FistMic.tsx` — Mic body with coiled cord SVG and PTT
- `packages/tools/src/components/vhf/FeedbackPanel.tsx` — Instructor feedback below radio
- `packages/tools/src/components/vhf/AudioReplayBar.tsx` — Play button + waveform + duration
- `packages/tools/src/components/vhf/__tests__/LCDScreen.test.tsx`
- `packages/tools/src/components/vhf/__tests__/AISTargetList.test.tsx`
- `packages/tools/src/components/vhf/__tests__/FistMic.test.tsx`
- `packages/tools/src/components/vhf/__tests__/FeedbackPanel.test.tsx`
- `packages/tools/src/components/vhf/__tests__/AudioReplayBar.test.tsx`

### Modified Files
- `packages/tools/src/components/vhf/PanelRadio.tsx` — Full rewrite: realistic radio body
- `packages/tools/src/components/vhf/VHFSimulator.tsx` — 50/50 layout, integrate new components
- `packages/tools/src/components/vhf/TranscriptPanel.tsx` — Add audio replay, inline feedback, Clear/Export
- `packages/tools/src/stores/vhf.ts` — Add `lcdScreen` state (vhf/ais/dsc), AIS targets array
- `packages/tools/src/lib/vhf/types.ts` — Add AISTarget, FeedbackAnnotation, LCDScreenMode types

### Deleted Files
- `packages/tools/src/components/vhf/ChannelDial.tsx` — Channel control moves to button pad
- `packages/tools/src/components/vhf/SquelchDial.tsx` — Squelch control moves to knob
- `packages/tools/src/components/vhf/RadioScreen.tsx` — Replaced by LCDScreen

### Existing Test Files to Update
- `packages/tools/src/components/vhf/__tests__/layouts.test.tsx` — Update PanelRadio assertions
- `packages/tools/src/components/vhf/__tests__/RadioScreen.test.tsx` — Rename/rewrite for LCDScreen
- `packages/tools/src/components/vhf/__tests__/controls.test.tsx` — Remove ChannelDial tests, update PTT

---

## Task 1: Add New Types and Store State

**Files:**
- Modify: `packages/tools/src/lib/vhf/types.ts`
- Modify: `packages/tools/src/stores/vhf.ts`
- Modify: `packages/tools/src/stores/__tests__/vhf.test.ts`

- [ ] **Step 1: Write failing tests for new store state**

Add tests to `stores/__tests__/vhf.test.ts`:

```typescript
it('should initialize lcdScreen to vhf', () => {
  const { lcdScreen } = useVHFStore.getState();
  expect(lcdScreen).toBe('vhf');
});

it('should toggle lcdScreen between modes', () => {
  const { setLcdScreen } = useVHFStore.getState();
  setLcdScreen('ais');
  expect(useVHFStore.getState().lcdScreen).toBe('ais');
  setLcdScreen('vhf');
  expect(useVHFStore.getState().lcdScreen).toBe('vhf');
});

it('should store and clear aisTargets', () => {
  const { setAisTargets, clearAisTargets } = useVHFStore.getState();
  setAisTargets([{ mmsi: '235001234', name: 'BLUE HORIZON', distance: 0.8, bearing: 45, cpa: 0.3, sog: 5.2, cog: 225, vesselType: 'sailing' }]);
  expect(useVHFStore.getState().aisTargets).toHaveLength(1);
  clearAisTargets();
  expect(useVHFStore.getState().aisTargets).toHaveLength(0);
});

it('should track selectedAisTarget', () => {
  const { setSelectedAisTarget } = useVHFStore.getState();
  setSelectedAisTarget('235001234');
  expect(useVHFStore.getState().selectedAisTarget).toBe('235001234');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/tools && pnpm test -- --run stores/__tests__/vhf.test.ts`
Expected: FAIL — `lcdScreen`, `setLcdScreen`, `aisTargets`, etc. not found

- [ ] **Step 3: Add types to types.ts**

Add to `packages/tools/src/lib/vhf/types.ts`:

```typescript
export type LCDScreenMode = 'vhf' | 'ais' | 'dsc';

export interface AISTarget {
  mmsi: string;
  name: string;
  distance: number;  // nautical miles
  bearing: number;   // degrees
  cpa: number;       // closest point of approach, nm
  sog: number;       // speed over ground, knots
  cog: number;       // course over ground, degrees
  vesselType: 'sailing' | 'motor' | 'cargo' | 'tanker' | 'fishing' | 'passenger' | 'vessel';
}

export interface FeedbackAnnotation {
  type: 'correct' | 'warning';
  message: string;
}
```

- [ ] **Step 4: Add state to vhf.ts store**

Add to the Zustand store in `packages/tools/src/stores/vhf.ts`:
- `lcdScreen: LCDScreenMode` (initial: `'vhf'`)
- `setLcdScreen: (screen: LCDScreenMode) => void`
- `aisTargets: AISTarget[]` (initial: `[]`)
- `setAisTargets: (targets: AISTarget[]) => void`
- `clearAisTargets: () => void`
- `selectedAisTarget: string | null` (initial: `null`)
- `setSelectedAisTarget: (mmsi: string | null) => void`

Do NOT persist `lcdScreen`, `aisTargets`, or `selectedAisTarget` — these are session state.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd packages/tools && pnpm test -- --run stores/__tests__/vhf.test.ts`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add packages/tools/src/lib/vhf/types.ts packages/tools/src/stores/vhf.ts packages/tools/src/stores/__tests__/vhf.test.ts
git commit -m "feat(vhf): add LCD screen mode, AIS target types and store state"
```

---

## Task 2: Build LCDScreen Component

**Files:**
- Create: `packages/tools/src/components/vhf/LCDScreen.tsx`
- Create: `packages/tools/src/components/vhf/__tests__/LCDScreen.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/LCDScreen.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { LCDScreen } from '../LCDScreen';
import { useVHFStore } from '@/stores/vhf';

beforeEach(() => useVHFStore.setState({ channel: 16, squelch: 3, power: '25W', radioState: 'idle', lcdScreen: 'vhf' }));

describe('LCDScreen', () => {
  it('renders VHF screen by default showing channel 16', () => {
    render(<LCDScreen />);
    expect(screen.getByText('16')).toBeInTheDocument();
    expect(screen.getByText('156.800 MHz')).toBeInTheDocument();
  });

  it('renders AIS screen when lcdScreen is ais', () => {
    useVHFStore.setState({ lcdScreen: 'ais' });
    render(<LCDScreen />);
    expect(screen.getByText(/AIS TARGETS/)).toBeInTheDocument();
  });

  it('renders DSC screen when lcdScreen is dsc', () => {
    useVHFStore.setState({ lcdScreen: 'dsc' });
    render(<LCDScreen />);
    expect(screen.getByText(/DSC/)).toBeInTheDocument();
  });

  it('shows STBY status when idle', () => {
    render(<LCDScreen />);
    expect(screen.getByText('STBY')).toBeInTheDocument();
  });

  it('shows TX status when transmitting', () => {
    useVHFStore.setState({ radioState: 'tx' });
    render(<LCDScreen />);
    expect(screen.getByText('TX')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/tools && pnpm test -- --run components/vhf/__tests__/LCDScreen.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement LCDScreen**

Create `packages/tools/src/components/vhf/LCDScreen.tsx`.

Reference the validated mockup `.superpowers/brainstorm/3500-1774130127/vhf-full-layout-v3.html` for exact styling. Key requirements:
- Amber LCD colors: text `#ffaa00`/`#cc7a00`, background `linear-gradient(180deg, #2a1800 0%, #1a1000 100%)`
- Radial gradient glow overlay via `::before` pseudo (use a wrapper div with absolute positioning)
- Font: Fira Code monospace
- Three screen modes rendered conditionally based on `useVHFStore(s => s.lcdScreen)`:
  - **VHF**: power, region, status badge, signal bars, position, time, large channel, soft-key labels
  - **AIS**: header, column headers, target rows (from `aisTargets`), detail bar, soft-key labels
  - **DSC**: distress fields (nature, MMSI, position, time, channel), soft-key labels
- Soft-key labels array returned via prop callback so parent can wire physical soft keys
- Channel number from store, frequency from `getChannelFrequency()`

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/tools && pnpm test -- --run components/vhf/__tests__/LCDScreen.test.tsx`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add packages/tools/src/components/vhf/LCDScreen.tsx packages/tools/src/components/vhf/__tests__/LCDScreen.test.tsx
git commit -m "feat(vhf): add LCDScreen component with VHF/AIS/DSC modes"
```

---

## Task 3: Build AISTargetList Component

**Files:**
- Create: `packages/tools/src/components/vhf/AISTargetList.tsx`
- Create: `packages/tools/src/components/vhf/__tests__/AISTargetList.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { AISTargetList } from '../AISTargetList';

const targets = [
  { mmsi: '235001234', name: 'BLUE HORIZON', distance: 0.8, bearing: 45, cpa: 0.3, sog: 5.2, cog: 225, vesselType: 'sailing' as const },
  { mmsi: '235009876', name: 'SOLENT TRADER', distance: 1.2, bearing: 180, cpa: 0.5, sog: 8.1, cog: 90, vesselType: 'cargo' as const },
];

describe('AISTargetList', () => {
  it('renders vessel names', () => {
    render(<AISTargetList targets={targets} selectedMmsi={null} onSelect={() => {}} />);
    expect(screen.getByText('BLUE HORIZON')).toBeInTheDocument();
    expect(screen.getByText('SOLENT TRADER')).toBeInTheDocument();
  });

  it('shows distance and bearing', () => {
    render(<AISTargetList targets={targets} selectedMmsi={null} onSelect={() => {}} />);
    expect(screen.getByText('0.8nm')).toBeInTheDocument();
    expect(screen.getByText('045°')).toBeInTheDocument();
  });

  it('highlights CPA below 0.5nm as warning', () => {
    const { container } = render(<AISTargetList targets={targets} selectedMmsi={null} onSelect={() => {}} />);
    // CPA 0.3nm should have warning styling
    const cpaCell = screen.getByText('0.3nm');
    expect(cpaCell.style.color).toBe('#ff6600');
  });

  it('calls onSelect when row clicked', () => {
    const onSelect = vi.fn();
    render(<AISTargetList targets={targets} selectedMmsi={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('BLUE HORIZON'));
    expect(onSelect).toHaveBeenCalledWith('235001234');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/tools && pnpm test -- --run components/vhf/__tests__/AISTargetList.test.tsx`

- [ ] **Step 3: Implement AISTargetList**

Create `AISTargetList.tsx`. Props: `targets: AISTarget[]`, `selectedMmsi: string | null`, `onSelect: (mmsi: string) => void`. Renders column headers and rows matching the mockup amber LCD style. CPA values below 0.5nm render in `#ff6600`. Vessel type icons: ⛵ sailing, 🚢 cargo/motor/tanker/passenger, 🎣 fishing.

- [ ] **Step 4: Run tests, verify pass**
- [ ] **Step 5: Commit**

```bash
git add packages/tools/src/components/vhf/AISTargetList.tsx packages/tools/src/components/vhf/__tests__/AISTargetList.test.tsx
git commit -m "feat(vhf): add AISTargetList LCD component"
```

---

## Task 4: Build FistMic Component

**Files:**
- Create: `packages/tools/src/components/vhf/FistMic.tsx`
- Create: `packages/tools/src/components/vhf/__tests__/FistMic.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { FistMic } from '../FistMic';

describe('FistMic', () => {
  it('renders PTT button', () => {
    render(<FistMic onTransmit={() => {}} />);
    expect(screen.getByLabelText('Push to talk')).toBeInTheDocument();
  });

  it('shows TX state on mouse down', () => {
    render(<FistMic onTransmit={() => {}} />);
    fireEvent.mouseDown(screen.getByLabelText('Push to talk'));
    expect(screen.getByText('TX')).toBeInTheDocument();
  });

  it('calls onTransmit on mouse up', () => {
    const onTransmit = vi.fn();
    render(<FistMic onTransmit={onTransmit} />);
    const btn = screen.getByLabelText('Push to talk');
    fireEvent.mouseDown(btn);
    fireEvent.mouseUp(btn);
    expect(onTransmit).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**
- [ ] **Step 3: Implement FistMic**

Create `FistMic.tsx`. Renders mic body with:
- Coiled cord (inline SVG path)
- Speaker grille (CSS repeating-linear-gradient)
- PTT button that sets `radioState` to `'tx'` on press, `'idle'` on release, calls `onTransmit`
- Styling from mockup: dark gradient body, rounded corners, box-shadow

- [ ] **Step 4: Run tests, verify pass**
- [ ] **Step 5: Commit**

```bash
git add packages/tools/src/components/vhf/FistMic.tsx packages/tools/src/components/vhf/__tests__/FistMic.test.tsx
git commit -m "feat(vhf): add FistMic component with coiled cord and PTT"
```

---

## Task 5: Build FeedbackPanel Component

**Files:**
- Create: `packages/tools/src/components/vhf/FeedbackPanel.tsx`
- Create: `packages/tools/src/components/vhf/__tests__/FeedbackPanel.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
import { render, screen } from '@testing-library/react';
import { FeedbackPanel } from '../FeedbackPanel';

describe('FeedbackPanel', () => {
  it('renders scenario progress', () => {
    render(<FeedbackPanel scenarioLabel="Radio Check — Step 2/4" feedback={[]} />);
    expect(screen.getByText('Radio Check — Step 2/4')).toBeInTheDocument();
  });

  it('renders feedback items by type', () => {
    const feedback = [
      { type: 'correct' as const, label: 'Correct', message: 'Good calling format.' },
      { type: 'suggestion' as const, label: 'Suggestion', message: 'Include your position.' },
      { type: 'tip' as const, label: 'Next Step', message: 'Give your radio check request.' },
    ];
    render(<FeedbackPanel scenarioLabel="" feedback={feedback} />);
    expect(screen.getByText('Good calling format.')).toBeInTheDocument();
    expect(screen.getByText('Include your position.')).toBeInTheDocument();
    expect(screen.getByText('Give your radio check request.')).toBeInTheDocument();
  });

  it('renders empty state when no feedback', () => {
    render(<FeedbackPanel scenarioLabel="" feedback={[]} />);
    expect(screen.getByText('Instructor Feedback')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**
- [ ] **Step 3: Implement FeedbackPanel**

Create `FeedbackPanel.tsx`. Renders the instructor feedback section with scenario badge and color-coded feedback items (green correct, red suggestion, blue tip). Styled per mockup with blueprint theme.

- [ ] **Step 4: Run tests, verify pass**
- [ ] **Step 5: Commit**

```bash
git add packages/tools/src/components/vhf/FeedbackPanel.tsx packages/tools/src/components/vhf/__tests__/FeedbackPanel.test.tsx
git commit -m "feat(vhf): add FeedbackPanel component"
```

---

## Task 6: Build AudioReplayBar Component

**Files:**
- Create: `packages/tools/src/components/vhf/AudioReplayBar.tsx`
- Create: `packages/tools/src/components/vhf/__tests__/AudioReplayBar.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { AudioReplayBar } from '../AudioReplayBar';

describe('AudioReplayBar', () => {
  it('renders play button and duration', () => {
    render(<AudioReplayBar duration={4} type="tx" onPlay={() => {}} />);
    expect(screen.getByLabelText('Play audio')).toBeInTheDocument();
    expect(screen.getByText('0:04')).toBeInTheDocument();
  });

  it('calls onPlay when play button clicked', () => {
    const onPlay = vi.fn();
    render(<AudioReplayBar duration={4} type="tx" onPlay={onPlay} />);
    fireEvent.click(screen.getByLabelText('Play audio'));
    expect(onPlay).toHaveBeenCalled();
  });

  it('renders waveform bars', () => {
    const { container } = render(<AudioReplayBar duration={4} type="tx" onPlay={() => {}} />);
    const bars = container.querySelectorAll('[data-testid="wave-bar"]');
    expect(bars.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**
- [ ] **Step 3: Implement AudioReplayBar**

Create `AudioReplayBar.tsx`. Renders: circular play/pause button, waveform bars (randomized heights), duration label. Play triggers TTS re-speak of the message. Waveform bars animate progressively when playing. Color follows TX (red) or RX (blue) theme.

- [ ] **Step 4: Run tests, verify pass**
- [ ] **Step 5: Commit**

```bash
git add packages/tools/src/components/vhf/AudioReplayBar.tsx packages/tools/src/components/vhf/__tests__/AudioReplayBar.test.tsx
git commit -m "feat(vhf): add AudioReplayBar component with waveform animation"
```

---

## Task 7: Rewrite PanelRadio as Realistic Radio Body

**Files:**
- Modify: `packages/tools/src/components/vhf/PanelRadio.tsx` (full rewrite)
- Modify: `packages/tools/src/components/vhf/__tests__/layouts.test.tsx`

- [ ] **Step 1: Update failing tests**

Update `__tests__/layouts.test.tsx` for the new PanelRadio structure:

```typescript
describe('PanelRadio', () => {
  it('renders LCD screen showing channel 16', () => {
    render(<PanelRadio onTransmit={() => {}} />);
    expect(screen.getByText('16')).toBeInTheDocument();
  });

  it('renders radio control buttons', () => {
    render(<PanelRadio onTransmit={() => {}} />);
    expect(screen.getByLabelText('Go to channel 16')).toBeInTheDocument();
    expect(screen.getByLabelText('AIS targets')).toBeInTheDocument();
    expect(screen.getByLabelText('DSC')).toBeInTheDocument();
    expect(screen.getByLabelText('Distress')).toBeInTheDocument();
  });

  it('toggles AIS screen when AIS button clicked', () => {
    render(<PanelRadio onTransmit={() => {}} />);
    fireEvent.click(screen.getByLabelText('AIS targets'));
    expect(screen.getByText(/AIS TARGETS/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**
- [ ] **Step 3: Rewrite PanelRadio**

Full rewrite of `PanelRadio.tsx`. Reference the mockup for exact structure:
- Mounting bracket with screw details
- Radio body: left edge (brand label + distress button), center (LCD bezel + LCDScreen + soft keys), right (button pad with C/A, ENT, MEN, CLR, 16/9, AIS, DSC, VOL/SQL knob)
- All buttons wire to store actions (setChannel, setLcdScreen, togglePower, etc.)
- AIS/DSC buttons have LED indicator dots that glow when active
- Fixed width (480px), does NOT stretch

- [ ] **Step 4: Run tests, verify pass**
- [ ] **Step 5: Commit**

```bash
git add packages/tools/src/components/vhf/PanelRadio.tsx packages/tools/src/components/vhf/__tests__/layouts.test.tsx
git commit -m "feat(vhf): rewrite PanelRadio as realistic Garmin-style radio body"
```

---

## Task 8: Enhance TranscriptPanel with Audio Replay and Inline Feedback

**Files:**
- Modify: `packages/tools/src/components/vhf/TranscriptPanel.tsx`
- Modify: `packages/tools/src/components/vhf/__tests__/TranscriptPanel.test.tsx`

- [ ] **Step 1: Update tests**

Add to `__tests__/TranscriptPanel.test.tsx`:

```typescript
it('renders audio replay bar on each entry', () => {
  useVHFStore.setState({
    transcript: [{ station: 'SV Artemis', message: 'Test', channel: 16, direction: 'tx', timestamp: Date.now() }],
  });
  render(<TranscriptPanel />);
  expect(screen.getByLabelText('Play audio')).toBeInTheDocument();
});

it('renders inline feedback annotation when present', () => {
  useVHFStore.setState({
    transcript: [{
      station: 'SV Artemis', message: 'Test', channel: 16, direction: 'tx', timestamp: Date.now(),
      feedback: { type: 'correct', message: 'Good procedure' },
    }],
  });
  render(<TranscriptPanel />);
  expect(screen.getByText('Good procedure')).toBeInTheDocument();
});

it('renders Clear and Export buttons', () => {
  render(<TranscriptPanel />);
  expect(screen.getByText('Clear')).toBeInTheDocument();
  expect(screen.getByText('Export')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify they fail**
- [ ] **Step 3: Enhance TranscriptPanel**

Update `TranscriptPanel.tsx`:
- Add header with "Voice Log" title, Clear/Export buttons
- Each entry gets: TX/RX color indicator bar, timestamp, station, channel badge, message, AudioReplayBar
- Optional inline feedback annotation (green border-left for correct, red for warning)
- Full-height scrollable layout (flex: 1, overflow-y: auto)
- Also update `TranscriptEntry` type in `types.ts` to include optional `feedback: FeedbackAnnotation`

- [ ] **Step 4: Run tests, verify pass**
- [ ] **Step 5: Commit**

```bash
git add packages/tools/src/components/vhf/TranscriptPanel.tsx packages/tools/src/components/vhf/__tests__/TranscriptPanel.test.tsx packages/tools/src/lib/vhf/types.ts
git commit -m "feat(vhf): enhance TranscriptPanel with audio replay and inline feedback"
```

---

## Task 9: Rewrite VHFSimulator Layout (50/50 Split)

**Files:**
- Modify: `packages/tools/src/components/vhf/VHFSimulator.tsx`

- [ ] **Step 1: Write failing test**

Add to an existing or new test file:

```typescript
import { render, screen } from '@testing-library/react';
import { VHFSimulator } from '../VHFSimulator';

describe('VHFSimulator', () => {
  it('renders radio, feedback panel, and voice log', () => {
    render(<VHFSimulator />);
    expect(screen.getByText('Instructor Feedback')).toBeInTheDocument();
    expect(screen.getByText('Voice Log')).toBeInTheDocument();
    expect(screen.getByLabelText('Push to talk')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Rewrite VHFSimulator**

Rewrite `VHFSimulator.tsx` with 50/50 layout:
- Left column (50%): PanelRadio → FistMic → FeedbackPanel, scrollable
- Right column (50%): TranscriptPanel (full height)
- Remove old settings modal auto-show (settings accessible via toolbar)
- Keep toolbar at bottom (Settings, New Session, Scenarios)
- Responsive: still switch to HandheldRadio below 768px (unchanged)

- [ ] **Step 4: Run all VHF tests**

Run: `cd packages/tools && pnpm test -- --run`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add packages/tools/src/components/vhf/VHFSimulator.tsx
git commit -m "feat(vhf): rewrite VHFSimulator with 50/50 radio+feedback|voicelog layout"
```

---

## Task 10: Delete Obsolete Components and Clean Up

**Files:**
- Delete: `packages/tools/src/components/vhf/ChannelDial.tsx`
- Delete: `packages/tools/src/components/vhf/SquelchDial.tsx`
- Delete: `packages/tools/src/components/vhf/RadioScreen.tsx`
- Modify: `packages/tools/src/components/vhf/__tests__/controls.test.tsx` (remove ChannelDial tests)
- Delete: `packages/tools/src/components/vhf/__tests__/RadioScreen.test.tsx`

- [ ] **Step 1: Remove imports of deleted components from any remaining files**

Search for imports of `ChannelDial`, `SquelchDial`, `RadioScreen` — they should only be referenced in the old PanelRadio (already rewritten) and HandheldRadio (still uses its own controls — verify).

Check `HandheldRadio.tsx` — if it imports ChannelDial/SquelchDial, keep those files or update HandheldRadio. If HandheldRadio has its own inline controls, safe to delete.

- [ ] **Step 2: Delete files and update tests**

```bash
rm packages/tools/src/components/vhf/ChannelDial.tsx
rm packages/tools/src/components/vhf/SquelchDial.tsx
rm packages/tools/src/components/vhf/RadioScreen.tsx
rm packages/tools/src/components/vhf/__tests__/RadioScreen.test.tsx
```

Update `controls.test.tsx` to remove ChannelDial tests (keep PTT tests if FistMic doesn't fully replace them).

- [ ] **Step 3: Run full test suite**

Run: `cd packages/tools && pnpm test -- --run`
Expected: ALL PASS, no broken imports

- [ ] **Step 4: Commit**

```bash
git add -A packages/tools/src/components/vhf/
git commit -m "chore(vhf): remove obsolete ChannelDial, SquelchDial, RadioScreen components"
```

---

## Task 11: Visual QA and Polish

- [ ] **Step 1: Start dev server and visually compare**

Run: `pnpm --filter @above-deck/tools dev`

Open `http://localhost:4323/tools/tools/vhf` and compare against the validated mockup at `.superpowers/brainstorm/3500-1774130127/vhf-full-layout-v3.html`

- [ ] **Step 2: Check all interactive states**

Verify:
- AIS button toggles LCD to AIS screen, LED lights up
- DSC button toggles LCD to DSC screen
- SOS button shows DSC distress screen
- 16/9 button returns to VHF screen
- CLR returns to VHF from any sub-screen
- PTT on fist mic shows TX state on LCD
- Soft keys map correctly to LCD labels
- Transcript entries have play buttons
- Feedback panel renders below radio
- 50/50 split looks balanced
- Radio body is fixed width, centered in left column

- [ ] **Step 3: Fix any visual discrepancies**
- [ ] **Step 4: Commit**

```bash
git commit -am "fix(vhf): visual polish after QA pass"
```

- [ ] **Step 5: Run full test suite one final time**

Run: `cd packages/tools && pnpm test -- --run`
Expected: ALL PASS
