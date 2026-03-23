# VHF Regions, Feedback & Scenarios — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 new cruising regions, wire LLM feedback into the instructor panel, and make scenarios region-aware so practice feels authentic to each location.

**Architecture:** Regions and scenarios live in Go (`radio/` package). Feedback flows from LLM response → Zustand store → FeedbackPanel. Scenarios adapt their briefings to the selected region. Frontend fetches regions dynamically.

**Tech Stack:** Go (backend), React 19 + Zustand 5 (frontend)

**Design Spec:** `docs/superpowers/specs/2026-03-22-vhf-regions-feedback-design.md`

---

## File Structure

### Modified Files
- `packages/api/internal/radio/regions.go` — Add 4 new regions
- `packages/api/internal/radio/scenarios.go` — Make scenarios region-aware
- `packages/api/internal/handler/session.go` — Add GET /api/vhf/regions endpoint
- `packages/api/cmd/server/main.go` — Register regions endpoint
- `packages/tools/src/stores/vhf.ts` — Add feedbackHistory state
- `packages/tools/src/hooks/use-vhf-radio.ts` — Wire feedback from API response to store
- `packages/tools/src/components/vhf/VHFSimulator.tsx` — Pass feedbackHistory to FeedbackPanel
- `packages/tools/src/components/vhf/SettingsPanel.tsx` — Dynamic region dropdown from API
- `packages/tools/src/lib/vhf/api-client.ts` — Add getRegions() method

### New Files
- `packages/api/internal/radio/regions_test.go` — Tests for new regions
- `packages/api/internal/radio/scenarios_test.go` — Tests for region-aware scenarios (if not existing)
- `packages/tools/src/stores/__tests__/vhf-feedback.test.ts` — Feedback store tests

---

## Task 1: Add 4 New Cruising Regions (Go)

**Files:**
- Modify: `packages/api/internal/radio/regions.go`
- Create: `packages/api/internal/radio/regions_test.go`

- [ ] **Step 1: Write tests for new regions**

Create `regions_test.go`:
```go
func TestAllRegionsCount(t *testing.T) {
    regions := AllRegions()
    if len(regions) != 6 {
        t.Errorf("expected 6 regions, got %d", len(regions))
    }
}

func TestGetRegionMedGreece(t *testing.T) {
    r, ok := GetRegion("med-greece")
    if !ok { t.Fatal("med-greece not found") }
    if len(r.Coastguard) == 0 { t.Error("no coastguard stations") }
    if len(r.Vessels) < 5 { t.Error("expected at least 5 vessels") }
    if len(r.Marinas) == 0 { t.Error("no marinas") }
}

func TestGetRegionSEAsia(t *testing.T) {
    r, ok := GetRegion("se-asia")
    if !ok { t.Fatal("se-asia not found") }
    if len(r.Vessels) < 5 { t.Error("expected at least 5 vessels") }
}

func TestGetRegionPacific(t *testing.T) {
    r, ok := GetRegion("pacific")
    if !ok { t.Fatal("pacific not found") }
    if len(r.Vessels) < 5 { t.Error("expected at least 5 vessels") }
}

func TestGetRegionAtlantic(t *testing.T) {
    r, ok := GetRegion("atlantic")
    if !ok { t.Fatal("atlantic not found") }
    if len(r.Vessels) < 5 { t.Error("expected at least 5 vessels") }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/api && go test ./internal/radio/ -run TestAllRegionsCount -v`

- [ ] **Step 3: Add 4 regions to regions.go**

Add Mediterranean (med-greece), Southeast Asia (se-asia), Pacific (pacific), and Atlantic/Canaries (atlantic) regions. Each has:
- ID, Name, Description
- 2+ CoastguardStations with callsigns, channels, coverage
- 5 Vessels with names, callsigns, types, nationalities, personalities
- 4+ Marinas with working channels
- LocalFlavour paragraph

Use the design spec for details on each region's coastguard, vessels, marinas, and local flavour.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/api && go test ./internal/radio/ -v`

- [ ] **Step 5: Commit**

```bash
git add packages/api/internal/radio/regions.go packages/api/internal/radio/regions_test.go
git commit -m "feat(vhf): add Mediterranean, SE Asia, Pacific, Atlantic regions"
```

---

## Task 2: Add Regions API Endpoint (Go)

**Files:**
- Modify: `packages/api/internal/handler/session.go` (or create `regions.go`)
- Modify: `packages/api/cmd/server/main.go`

- [ ] **Step 1: Add handler function**

Add to `packages/api/internal/handler/` — a `Regions` handler:

```go
func Regions(w http.ResponseWriter, r *http.Request) {
    type regionSummary struct {
        ID   string `json:"id"`
        Name string `json:"name"`
    }
    regions := radio.AllRegions()
    summaries := make([]regionSummary, len(regions))
    for i, r := range regions {
        summaries[i] = regionSummary{ID: r.ID, Name: r.Name}
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(summaries)
}
```

- [ ] **Step 2: Register route in main.go**

Add: `mux.HandleFunc("GET /api/vhf/regions", handler.Regions)`

- [ ] **Step 3: Test endpoint**

```bash
curl -s http://localhost:8080/api/vhf/regions | python3 -m json.tool
```

Should return 6 regions.

- [ ] **Step 4: Commit**

```bash
git add packages/api/internal/handler/ packages/api/cmd/server/main.go
git commit -m "feat(vhf): add GET /api/vhf/regions endpoint"
```

---

## Task 3: Make Scenarios Region-Aware (Go)

**Files:**
- Modify: `packages/api/internal/radio/scenarios.go`
- Modify: `packages/api/internal/llm/prompt.go`

- [ ] **Step 1: Add RegionHints to scenarios**

Update the `Scenario` struct to include an optional `RegionHints` map:

```go
type Scenario struct {
    ID                 string            `json:"id"`
    Name               string            `json:"name"`
    Description        string            `json:"description"`
    Briefing           string            `json:"briefing"`
    ExpectedProcedure  []string          `json:"expected_procedure"`
    LLMInstructions    string            `json:"llm_instructions"`
    CompletionCriteria string            `json:"completion_criteria"`
    RegionHints        map[string]string `json:"region_hints,omitempty"`
}
```

`RegionHints` maps region IDs to briefing overrides. For example, the "radio-check" scenario for `med-greece` would reference Olympia Radio instead of Falmouth Coastguard.

- [ ] **Step 2: Add region hints for key scenarios**

For each of the 10 existing scenarios, add `RegionHints` entries for the 4 new regions. The hints modify the briefing to reference appropriate coastguard stations, positions, and local context. Keep it simple — a one-line position and station name change per region.

Example for `radio-check`:
```go
RegionHints: map[string]string{
    "med-greece": "You are moored in Kalamaki Marina, Athens. Contact Olympia Radio on Channel 16 for a radio check.",
    "se-asia":    "You are anchored in Chalong Bay, Phuket. Contact MRCC Phuket on Channel 16 for a radio check.",
    "pacific":    "You are moored at Vuda Point Marina, Fiji. Contact Fiji Navy on Channel 16 for a radio check.",
    "atlantic":   "You are moored in Las Palmas Marina, Gran Canaria. Contact Las Palmas Radio on Channel 16 for a radio check.",
},
```

- [ ] **Step 3: Update prompt builder to use region hints**

In `prompt.go`, when a scenario has a `RegionHints` entry for the current region, append the hint to the scenario briefing in the system prompt.

- [ ] **Step 4: Run Go tests**

Run: `cd packages/api && go test ./... -v`

- [ ] **Step 5: Commit**

```bash
git add packages/api/internal/radio/scenarios.go packages/api/internal/llm/prompt.go
git commit -m "feat(vhf): make scenarios region-aware with briefing hints"
```

---

## Task 4: Add Feedback Store State (Frontend)

**Files:**
- Modify: `packages/tools/src/stores/vhf.ts`
- Modify: `packages/tools/src/lib/vhf/types.ts`
- Create: `packages/tools/src/stores/__tests__/vhf-feedback.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { useVHFStore } from '@/stores/vhf';

describe('feedbackHistory', () => {
  beforeEach(() => useVHFStore.setState({ feedbackHistory: [] }));

  it('initializes empty', () => {
    expect(useVHFStore.getState().feedbackHistory).toEqual([]);
  });

  it('accumulates feedback items', () => {
    const { addFeedbackItems } = useVHFStore.getState();
    addFeedbackItems([{ type: 'correct', label: 'Correct', message: 'Good format' }]);
    addFeedbackItems([{ type: 'suggestion', label: 'Correction', message: 'Say vessel name 3x' }]);
    expect(useVHFStore.getState().feedbackHistory).toHaveLength(2);
  });

  it('clears feedback history', () => {
    const { addFeedbackItems, clearFeedbackHistory } = useVHFStore.getState();
    addFeedbackItems([{ type: 'correct', label: 'Correct', message: 'Good' }]);
    clearFeedbackHistory();
    expect(useVHFStore.getState().feedbackHistory).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Add FeedbackItem type and store state**

In `types.ts`:
```typescript
export interface FeedbackItem {
  type: 'correct' | 'suggestion' | 'tip';
  label: string;
  message: string;
}
```

In `vhf.ts` store — add (session state, NOT persisted):
- `feedbackHistory: FeedbackItem[]` (initial: `[]`)
- `addFeedbackItems: (items: FeedbackItem[]) => void` — appends to array
- `clearFeedbackHistory: () => void` — resets to `[]`

- [ ] **Step 4: Run tests to verify they pass**

- [ ] **Step 5: Commit**

```bash
git add packages/tools/src/stores/vhf.ts packages/tools/src/lib/vhf/types.ts packages/tools/src/stores/__tests__/vhf-feedback.test.ts
git commit -m "feat(vhf): add feedbackHistory to store for accumulated instructor feedback"
```

---

## Task 5: Wire Feedback from API Response to Store (Frontend)

**Files:**
- Modify: `packages/tools/src/hooks/use-vhf-radio.ts`
- Modify: `packages/tools/src/components/vhf/VHFSimulator.tsx`

- [ ] **Step 1: Update useVHFRadio hook**

In `stopTransmit`, after receiving the API response, map the feedback:

```typescript
// After const response = await client.transmit(...)
const feedbackItems: FeedbackItem[] = [];
if (response.feedback?.correct) {
  response.feedback.correct.forEach(msg =>
    feedbackItems.push({ type: 'correct', label: 'Correct', message: msg })
  );
}
if (response.feedback?.errors) {
  response.feedback.errors.forEach(msg =>
    feedbackItems.push({ type: 'suggestion', label: 'Correction', message: msg })
  );
}
if (response.feedback?.protocol_note) {
  feedbackItems.push({ type: 'tip', label: 'Next Step', message: response.feedback.protocol_note });
}
if (feedbackItems.length > 0) {
  store.addFeedbackItems(feedbackItems);
}
```

Also attach feedback to the RX transcript entry:
```typescript
const firstError = response.feedback?.errors?.[0];
const firstCorrect = response.feedback?.correct?.[0];
const rxEntry: TranscriptEntry = {
  // ...existing fields...
  feedback: firstError
    ? { type: 'warning', message: firstError }
    : firstCorrect
    ? { type: 'correct', message: firstCorrect }
    : undefined,
};
```

- [ ] **Step 2: Update VHFSimulator to pass feedbackHistory**

```typescript
const feedbackHistory = useVHFStore(s => s.feedbackHistory);
const scenarioId = useVHFStore(s => s.scenarioId);

// In the JSX:
<FeedbackPanel
  scenarioLabel={scenarioId || 'Free Practice'}
  feedback={feedbackHistory}
/>
```

- [ ] **Step 3: Clear feedback on new session**

In `createSession` callback in the hook, add `store.clearFeedbackHistory()`.

- [ ] **Step 4: Run all tests**

Run: `cd packages/tools && pnpm test -- --run`

- [ ] **Step 5: Commit**

```bash
git add packages/tools/src/hooks/use-vhf-radio.ts packages/tools/src/components/vhf/VHFSimulator.tsx
git commit -m "feat(vhf): wire LLM feedback into FeedbackPanel and transcript entries"
```

---

## Task 6: Dynamic Region Selector (Frontend)

**Files:**
- Modify: `packages/tools/src/lib/vhf/api-client.ts`
- Modify: `packages/tools/src/components/vhf/SettingsPanel.tsx`

- [ ] **Step 1: Add getRegions to API client**

```typescript
async getRegions(): Promise<Array<{ id: string; name: string }>> {
  const res = await fetch(`${this.baseUrl}/api/vhf/regions`);
  if (!res.ok) throw new Error(`Get regions failed: ${res.status}`);
  return res.json();
}
```

- [ ] **Step 2: Update SettingsPanel to fetch regions**

Replace the hardcoded `<option>` values with a dynamic list:

```typescript
const [regions, setRegions] = useState<Array<{ id: string; name: string }>>([
  { id: 'uk-south', name: 'UK South' },
  { id: 'caribbean', name: 'Caribbean' },
]);

useEffect(() => {
  const client = new VHFApiClient('http://localhost:8080');
  client.getRegions().then(setRegions).catch(() => {});
}, []);
```

Render regions as `<option>` elements in the select.

- [ ] **Step 3: Test manually**

Start the Go server with new regions, open settings, verify all 6 regions appear.

- [ ] **Step 4: Commit**

```bash
git add packages/tools/src/lib/vhf/api-client.ts packages/tools/src/components/vhf/SettingsPanel.tsx
git commit -m "feat(vhf): dynamic region selector from API"
```

---

## Task 7: Scenario Picker with Region Context (Frontend)

**Files:**
- Modify: `packages/tools/src/components/vhf/ScenarioPicker.tsx`
- Modify: `packages/tools/src/components/vhf/VHFSimulator.tsx`

- [ ] **Step 1: Update ScenarioPicker**

The ScenarioPicker should fetch scenarios from the API and display them. It already has a basic structure. Ensure it:
- Fetches from `GET /api/vhf/scenarios`
- Displays scenario name and description
- On click, calls `selectScenario(id)` which creates a session with that scenario
- Shows the active scenario with a highlight

- [ ] **Step 2: Wire into VHFSimulator**

Make the Scenarios toolbar button toggle the ScenarioPicker overlay. Pass `selectScenario` from the hook.

- [ ] **Step 3: Test manually**

Select a scenario, verify it starts a session with that scenario. The coastguard should respond according to the scenario instructions.

- [ ] **Step 4: Commit**

```bash
git add packages/tools/src/components/vhf/ScenarioPicker.tsx packages/tools/src/components/vhf/VHFSimulator.tsx
git commit -m "feat(vhf): wire scenario picker to create scenario sessions"
```

---

## Task 8: Integration Test and Polish

- [ ] **Step 1: Run full Go test suite**

Run: `cd packages/api && go test ./... -v`

- [ ] **Step 2: Run full frontend test suite**

Run: `cd packages/tools && pnpm test -- --run`

- [ ] **Step 3: Manual integration test**

1. Start Go server and frontend
2. Open VHF simulator
3. Change region to Mediterranean in settings
4. Select "Radio Check" scenario
5. PTT and request radio check from Olympia Radio
6. Verify feedback panel shows accumulated feedback
7. Verify transcript shows inline feedback annotations
8. Try different regions and scenarios

- [ ] **Step 4: Commit any fixes**

```bash
git commit -am "fix(vhf): integration fixes for regions, feedback, scenarios"
```
