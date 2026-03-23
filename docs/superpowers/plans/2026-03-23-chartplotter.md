# Chartplotter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full nautical chartplotter with MapLibre GL JS, OpenSeaMap vector tiles, custom blueprint styling, WebSocket-driven vessel tracking, and VHF simulator integration.

**Architecture:** MapLibre GL JS renders vector tiles with a custom dark nautical style. A Go WebSocket endpoint pushes real-time world state (vessel positions, weather, radio events) to the frontend. The chartplotter works both as a VHF sim companion and a standalone MFD screen.

**Tech Stack:** MapLibre GL JS, OpenSeaMap vector tiles, Go (gorilla/websocket), React 19, Zustand 5

**Design Spec:** `docs/superpowers/specs/2026-03-23-chartplotter-design.md`

---

## File Structure

### New Files — Frontend
- `packages/tools/src/components/chart/ChartView.tsx` — MapLibre wrapper, manages instance
- `packages/tools/src/components/chart/useMap.ts` — MapLibre lifecycle hook
- `packages/tools/src/components/chart/chartStore.ts` — Zustand store for chart data
- `packages/tools/src/components/chart/useChartWebSocket.ts` — WebSocket connection hook
- `packages/tools/src/components/chart/ChartVesselLayer.tsx` — Own vessel + AIS targets
- `packages/tools/src/components/chart/ChartWeatherLayer.tsx` — Weather overlay
- `packages/tools/src/components/chart/ChartControls.tsx` — Zoom, orientation, range rings
- `packages/tools/src/components/chart/ChartInfoPopup.tsx` — Vessel info on click
- `packages/tools/src/components/chart/styles/blueprint-dark.json` — MapLibre style
- `packages/tools/src/components/chart/__tests__/chartStore.test.ts` — Store tests
- `packages/tools/src/components/chart/__tests__/ChartVesselLayer.test.tsx` — Vessel layer tests
- `packages/tools/src/pages/tools/chart.astro` — Standalone chart MFD page

### New Files — Backend
- `packages/api/internal/ws/hub.go` — WebSocket connection hub
- `packages/api/internal/ws/hub_test.go` — Hub tests
- `packages/api/internal/ws/simulator.go` — Vessel movement simulation
- `packages/api/internal/ws/simulator_test.go` — Simulator tests
- `packages/api/internal/ws/handler.go` — HTTP upgrade handler

### Modified Files
- `packages/tools/package.json` — Add maplibre-gl dependency
- `packages/tools/src/components/vhf/VHFSimulator.tsx` — New layout with chart + tabs
- `packages/api/cmd/server/main.go` — Register WebSocket endpoint
- `packages/api/internal/handler/transmit.go` — Push radio events to WebSocket
- `packages/api/go.mod` — Add gorilla/websocket dependency

---

## Task 1: Install MapLibre GL JS + Create Chart Store (#190, #202)

**Files:**
- Modify: `packages/tools/package.json`
- Create: `packages/tools/src/components/chart/chartStore.ts`
- Create: `packages/tools/src/components/chart/__tests__/chartStore.test.ts`

- [ ] **Step 1: Install maplibre-gl**

Run: `cd packages/tools && pnpm add maplibre-gl`

- [ ] **Step 2: Write failing store tests**

Create `packages/tools/src/components/chart/__tests__/chartStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useChartStore } from '../chartStore';

describe('chartStore', () => {
  beforeEach(() => useChartStore.setState(useChartStore.getInitialState()));

  it('initializes with empty vessels', () => {
    expect(useChartStore.getState().vessels).toEqual([]);
  });

  it('updates vessels', () => {
    useChartStore.getState().setVessels([
      { name: 'Doris May', callSign: 'MDMX9', lat: 50.15, lon: -5.07, sog: 5.2, cog: 80, type: 'sailing' },
    ]);
    expect(useChartStore.getState().vessels).toHaveLength(1);
  });

  it('updates own position', () => {
    useChartStore.getState().setOwnPosition({ lat: 50.09, lon: -5.04, sog: 5.2, cog: 320 });
    expect(useChartStore.getState().ownPosition.lat).toBe(50.09);
  });

  it('updates weather', () => {
    useChartStore.getState().setWeather({ windSpeedKnots: 15, windDirection: 220, seaState: 'moderate', visibility: 'good' });
    expect(useChartStore.getState().weather.windSpeedKnots).toBe(15);
  });

  it('sets active radio target', () => {
    useChartStore.getState().setActiveRadioTarget('doris-may');
    expect(useChartStore.getState().activeRadioTarget).toBe('doris-may');
  });

  it('sets chart orientation', () => {
    useChartStore.getState().setOrientation('head-up');
    expect(useChartStore.getState().orientation).toBe('head-up');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd packages/tools && pnpm test -- --run components/chart/__tests__/chartStore.test.ts`

- [ ] **Step 4: Implement chart store**

Create `packages/tools/src/components/chart/chartStore.ts`:

```typescript
import { create } from 'zustand';

export interface ChartVessel {
  name: string;
  callSign: string;
  lat: number;
  lon: number;
  sog: number;
  cog: number;
  type: string;
}

export interface ChartWeather {
  windSpeedKnots: number;
  windDirection: number;
  seaState: string;
  visibility: string;
}

export interface OwnPosition {
  lat: number;
  lon: number;
  sog: number;
  cog: number;
}

type Orientation = 'north-up' | 'head-up' | 'course-up';

interface ChartState {
  vessels: ChartVessel[];
  ownPosition: OwnPosition;
  weather: ChartWeather;
  activeRadioTarget: string | null;
  orientation: Orientation;
  showRangeRings: boolean;
  setVessels: (vessels: ChartVessel[]) => void;
  setOwnPosition: (pos: OwnPosition) => void;
  setWeather: (weather: ChartWeather) => void;
  setActiveRadioTarget: (id: string | null) => void;
  setOrientation: (o: Orientation) => void;
  setShowRangeRings: (show: boolean) => void;
}

const initialState = {
  vessels: [] as ChartVessel[],
  ownPosition: { lat: 50.09, lon: -5.04, sog: 0, cog: 0 } as OwnPosition,
  weather: { windSpeedKnots: 0, windDirection: 0, seaState: 'calm', visibility: 'good' } as ChartWeather,
  activeRadioTarget: null as string | null,
  orientation: 'north-up' as Orientation,
  showRangeRings: true,
};

export const useChartStore = create<ChartState>()((set) => ({
  ...initialState,
  setVessels: (vessels) => set({ vessels }),
  setOwnPosition: (ownPosition) => set({ ownPosition }),
  setWeather: (weather) => set({ weather }),
  setActiveRadioTarget: (activeRadioTarget) => set({ activeRadioTarget }),
  setOrientation: (orientation) => set({ orientation }),
  setShowRangeRings: (showRangeRings) => set({ showRangeRings }),
}));

// For test reset
(useChartStore as any).getInitialState = () => initialState;
```

- [ ] **Step 5: Run tests to verify they pass**

- [ ] **Step 6: Commit**

```bash
git add packages/tools/package.json packages/tools/pnpm-lock.yaml packages/tools/src/components/chart/
git commit -m "feat(chart): add MapLibre GL JS dependency and chart Zustand store"
```

---

## Task 2: Create Blueprint-Dark MapLibre Style (#191)

**Files:**
- Create: `packages/tools/src/components/chart/styles/blueprint-dark.json`

- [ ] **Step 1: Create the MapLibre style JSON**

This is a MapLibre GL style specification. It defines sources, layers, and styling rules. Key elements:

- **Source:** OpenSeaMap vector tiles (use `https://tiles.openseamap.org/seamark/{z}/{x}/{y}.pbf` for nautical features, and a standard OSM vector tile source like `https://demotiles.maplibre.org/style.json` or OpenMapTiles for base geography)
- **Water:** `#081830` fill
- **Land:** `#1a2a1a` fill, coastline `rgba(74,222,128,0.15)` line
- **Depth contours:** `rgba(96,165,250,0.1)` lines
- **Depth soundings:** `rgba(96,165,250,0.3)` text, Fira Code font
- **Buildings:** slightly lighter than land, no labels
- **Roads:** hidden (not relevant for nautical)
- **Grid:** lat/lon graticule not in style (rendered as MapLibre overlay)
- **Buoys:** red `#f87171` / green `#4ade80` circles (IALA)
- **Lights:** amber `#ffaa00` dots
- **Hazards:** coral `#f87171` symbols
- **All text:** glyphs from MapLibre default or Google Fonts (Fira Code for data)

Note: the exact vector tile sources may need adjustment based on what's available. Start with the MapLibre demo tiles for base geography and plan to switch to OpenMapTiles or Protomaps later. OpenSeaMap vector tiles may not be publicly available as pbf — if not, use the raster tile overlay (`https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png`) as a fallback layer.

The style JSON should be a valid MapLibre style spec. Start with a minimal style and iterate.

- [ ] **Step 2: Verify JSON is valid**

Run: `cat packages/tools/src/components/chart/styles/blueprint-dark.json | python3 -m json.tool > /dev/null && echo "valid"`

- [ ] **Step 3: Commit**

```bash
git add packages/tools/src/components/chart/styles/
git commit -m "feat(chart): create blueprint-dark MapLibre style with nautical theme"
```

---

## Task 3: Build ChartView + useMap Hook (#190)

**Files:**
- Create: `packages/tools/src/components/chart/useMap.ts`
- Create: `packages/tools/src/components/chart/ChartView.tsx`

- [ ] **Step 1: Create useMap hook**

`useMap.ts` — Manages the MapLibre GL JS map instance lifecycle:

```typescript
import { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';

interface UseMapOptions {
  container: React.RefObject<HTMLDivElement>;
  center?: [number, number]; // [lon, lat]
  zoom?: number;
  style: string | maplibregl.StyleSpecification;
}

export function useMap({ container, center = [-5.04, 50.09], zoom = 12, style }: UseMapOptions) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!container.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: container.current,
      style,
      center,
      zoom,
      attributionControl: false,
    });

    map.on('load', () => setIsLoaded(true));

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setIsLoaded(false);
    };
  }, []);

  return { map: mapRef.current, isLoaded };
}
```

- [ ] **Step 2: Create ChartView component**

`ChartView.tsx` — Main chart component:

```typescript
import { useRef } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMap } from './useMap';
import blueprintStyle from './styles/blueprint-dark.json';

interface ChartViewProps {
  center?: [number, number];
  zoom?: number;
}

export function ChartView({ center, zoom }: ChartViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { map, isLoaded } = useMap({
    container: containerRef,
    center,
    zoom,
    style: blueprintStyle as any,
  });

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#081830',
      }}
    />
  );
}
```

- [ ] **Step 3: Test manually**

Create a temporary test page or render ChartView in the existing VHF page to verify the map loads. Check browser console for tile loading errors.

- [ ] **Step 4: Commit**

```bash
git add packages/tools/src/components/chart/useMap.ts packages/tools/src/components/chart/ChartView.tsx
git commit -m "feat(chart): add ChartView component with MapLibre GL JS and useMap hook"
```

---

## Task 4: Add Chart Controls (#193)

**Files:**
- Create: `packages/tools/src/components/chart/ChartControls.tsx`

- [ ] **Step 1: Implement ChartControls**

Overlay buttons for chart interaction. Positioned absolute over the chart.

Controls:
- Zoom in / out buttons
- Orientation toggle (N↑ / H↑ / C↑) — cycles through north-up, head-up, course-up
- Range rings toggle
- Center on own vessel button

Styling: small dark buttons matching radio button aesthetic. `background: rgba(0,0,0,0.6)`, `border: 1px solid rgba(255,255,255,0.15)`, `borderRadius: 4px`, `color: #8b8b9e`, Fira Code font.

Reads/writes from `useChartStore` for orientation and range rings. Calls `map.zoomIn()` / `map.zoomOut()` for zoom. Receives map instance via prop or context.

- [ ] **Step 2: Wire into ChartView**

Import ChartControls into ChartView and render as an overlay.

- [ ] **Step 3: Commit**

```bash
git add packages/tools/src/components/chart/ChartControls.tsx packages/tools/src/components/chart/ChartView.tsx
git commit -m "feat(chart): add chart controls — zoom, orientation, range rings"
```

---

## Task 5: Add Standalone Chart Page (#194)

**Files:**
- Create: `packages/tools/src/pages/tools/chart.astro`

- [ ] **Step 1: Create the Astro page**

Follow the same pattern as `vhf.astro` — render ChartView inside the MFD layout:

```astro
---
import MFDLayout from '@/layouts/MFDLayout.astro';
---
<MFDLayout screenId="chart" title="Chart — Above Deck">
  <div id="chart-root" style="width:100%;height:100%;"></div>
</MFDLayout>

<script>
  import { ChartView } from '@/components/chart/ChartView';
  import { createRoot } from 'react-dom/client';
  import React from 'react';
  const root = createRoot(document.getElementById('chart-root')!);
  root.render(React.createElement(ChartView));
</script>
```

Or use the Astro React island pattern: `<ChartView client:only="react" />`

- [ ] **Step 2: Verify it loads at /tools/tools/chart**

- [ ] **Step 3: Commit**

```bash
git add packages/tools/src/pages/tools/chart.astro
git commit -m "feat(chart): add standalone chart page as MFD screen"
```

---

## Task 6: Build Go WebSocket Hub (#199)

**Files:**
- Create: `packages/api/internal/ws/hub.go`
- Create: `packages/api/internal/ws/hub_test.go`
- Create: `packages/api/internal/ws/handler.go`
- Modify: `packages/api/go.mod`
- Modify: `packages/api/cmd/server/main.go`

- [ ] **Step 1: Add gorilla/websocket dependency**

Run: `cd packages/api && go get github.com/gorilla/websocket`

- [ ] **Step 2: Write hub tests**

```go
package ws

import "testing"

func TestHubRegisterAndBroadcast(t *testing.T) {
    hub := NewHub()
    go hub.Run()

    ch := make(chan []byte, 1)
    client := &Client{SessionID: "test-session", Send: ch}

    hub.Register <- client

    hub.Broadcast("test-session", []byte(`{"type":"test"}`))

    msg := <-ch
    if string(msg) != `{"type":"test"}` {
        t.Errorf("expected test message, got %s", string(msg))
    }

    hub.Unregister <- client
}

func TestHubBroadcastToCorrectSession(t *testing.T) {
    hub := NewHub()
    go hub.Run()

    ch1 := make(chan []byte, 1)
    ch2 := make(chan []byte, 1)
    c1 := &Client{SessionID: "session-1", Send: ch1}
    c2 := &Client{SessionID: "session-2", Send: ch2}

    hub.Register <- c1
    hub.Register <- c2

    hub.Broadcast("session-1", []byte(`{"type":"for-1"}`))

    msg := <-ch1
    if string(msg) != `{"type":"for-1"}` {
        t.Error("session-1 should receive message")
    }

    select {
    case <-ch2:
        t.Error("session-2 should NOT receive message for session-1")
    default:
        // correct — no message
    }
}
```

- [ ] **Step 3: Implement Hub**

```go
package ws

import "sync"

type Client struct {
    SessionID string
    Send      chan []byte
    conn      interface{} // *websocket.Conn, kept abstract for testing
}

type Hub struct {
    clients    map[*Client]bool
    Register   chan *Client
    Unregister chan *Client
    mu         sync.RWMutex
}

func NewHub() *Hub {
    return &Hub{
        clients:    make(map[*Client]bool),
        Register:   make(chan *Client),
        Unregister: make(chan *Client),
    }
}

func (h *Hub) Run() {
    for {
        select {
        case client := <-h.Register:
            h.mu.Lock()
            h.clients[client] = true
            h.mu.Unlock()
        case client := <-h.Unregister:
            h.mu.Lock()
            if _, ok := h.clients[client]; ok {
                delete(h.clients, client)
                close(client.Send)
            }
            h.mu.Unlock()
        }
    }
}

func (h *Hub) Broadcast(sessionID string, message []byte) {
    h.mu.RLock()
    defer h.mu.RUnlock()
    for client := range h.clients {
        if client.SessionID == sessionID {
            select {
            case client.Send <- message:
            default:
                // drop if buffer full
            }
        }
    }
}
```

- [ ] **Step 4: Implement WebSocket handler**

`handler.go`:

```go
package ws

import (
    "log"
    "net/http"

    "github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool { return true },
}

func HandleWebSocket(hub *Hub) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        sessionID := r.PathValue("id")
        if sessionID == "" {
            http.Error(w, "missing session ID", http.StatusBadRequest)
            return
        }

        conn, err := upgrader.Upgrade(w, r, nil)
        if err != nil {
            log.Printf("WebSocket upgrade error: %v", err)
            return
        }

        client := &Client{
            SessionID: sessionID,
            Send:      make(chan []byte, 256),
            conn:      conn,
        }

        hub.Register <- client

        // Write pump
        go func() {
            defer func() {
                hub.Unregister <- client
                conn.Close()
            }()
            for msg := range client.Send {
                if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
                    return
                }
            }
        }()

        // Read pump (keep connection alive, handle pings)
        for {
            _, _, err := conn.ReadMessage()
            if err != nil {
                break
            }
        }
    }
}
```

- [ ] **Step 5: Register in main.go**

Add to `main.go`:
```go
wsHub := ws.NewHub()
go wsHub.Run()
mux.HandleFunc("GET /api/vhf/sessions/{id}/ws", ws.HandleWebSocket(wsHub))
```

- [ ] **Step 6: Run tests**

Run: `cd packages/api && go test ./internal/ws/ -v`

- [ ] **Step 7: Commit**

```bash
git add packages/api/internal/ws/ packages/api/cmd/server/main.go packages/api/go.mod packages/api/go.sum
git commit -m "feat(ws): add WebSocket hub for per-session real-time updates"
```

---

## Task 7: Build Vessel Movement Simulator (#200)

**Files:**
- Create: `packages/api/internal/ws/simulator.go`
- Create: `packages/api/internal/ws/simulator_test.go`

- [ ] **Step 1: Write simulator tests**

```go
package ws

import (
    "testing"
    "math"

    "github.com/curphey/above-deck/api/internal/agent"
)

func TestSimulatorMovesVessel(t *testing.T) {
    vessel := agent.VesselPosition{
        Name: "Doris May", CallSign: "MDMX9",
        Lat: 50.0, Lon: -5.0, SOG: 5.0, COG: 90,
    }

    updated := MoveVessel(vessel, 2.0) // 2 seconds

    if updated.Lat == vessel.Lat && updated.Lon == vessel.Lon {
        t.Error("vessel should have moved")
    }

    // Moving east (COG 90), longitude should increase
    if updated.Lon <= vessel.Lon {
        t.Error("moving east, longitude should increase")
    }

    // Latitude should stay roughly the same (moving due east)
    if math.Abs(updated.Lat-vessel.Lat) > 0.0001 {
        t.Error("latitude should barely change when moving due east")
    }
}

func TestSimulatorMovesNorth(t *testing.T) {
    vessel := agent.VesselPosition{
        Name: "Test", Lat: 50.0, Lon: -5.0, SOG: 6.0, COG: 0,
    }

    updated := MoveVessel(vessel, 60.0) // 1 minute

    // Moving north, latitude should increase
    if updated.Lat <= vessel.Lat {
        t.Error("moving north, latitude should increase")
    }
}
```

- [ ] **Step 2: Implement simulator**

```go
package ws

import (
    "encoding/json"
    "math"
    "time"

    "github.com/curphey/above-deck/api/internal/agent"
)

// MoveVessel updates a vessel's position based on SOG and COG over dtSeconds.
func MoveVessel(v agent.VesselPosition, dtSeconds float64) agent.VesselPosition {
    // SOG is in knots (nautical miles per hour)
    // 1 nautical mile = 1 minute of latitude = 1/60 degree
    nmTravelled := v.SOG * (dtSeconds / 3600.0)

    cogRad := float64(v.COG) * math.Pi / 180.0
    dLat := nmTravelled * math.Cos(cogRad) / 60.0
    dLon := nmTravelled * math.Sin(cogRad) / (60.0 * math.Cos(v.Lat*math.Pi/180.0))

    v.Lat += dLat
    v.Lon += dLon
    return v
}

// WorldUpdate is the JSON message sent via WebSocket.
type WorldUpdate struct {
    Type        string                 `json:"type"`
    Vessels     []agent.VesselPosition `json:"vessels"`
    Weather     agent.WeatherState     `json:"weather"`
    OwnPosition OwnPos                `json:"ownPosition"`
    Timestamp   string                 `json:"timestamp"`
}

type OwnPos struct {
    Lat float64 `json:"lat"`
    Lon float64 `json:"lon"`
    SOG float64 `json:"sog"`
    COG int     `json:"cog"`
}

// Simulator ticks the world state and broadcasts updates.
type Simulator struct {
    hub      *Hub
    world    *agent.WorldState
    session  string
    ownPos   OwnPos
    interval time.Duration
    stop     chan struct{}
}

func NewSimulator(hub *Hub, world *agent.WorldState, sessionID string, ownLat, ownLon float64) *Simulator {
    return &Simulator{
        hub:      hub,
        world:    world,
        session:  sessionID,
        ownPos:   OwnPos{Lat: ownLat, Lon: ownLon, SOG: 5.0, COG: 320},
        interval: 2 * time.Second,
        stop:     make(chan struct{}),
    }
}

func (s *Simulator) Start() {
    go func() {
        ticker := time.NewTicker(s.interval)
        defer ticker.Stop()
        for {
            select {
            case <-ticker.C:
                s.tick()
            case <-s.stop:
                return
            }
        }
    }()
}

func (s *Simulator) Stop() {
    close(s.stop)
}

func (s *Simulator) tick() {
    dt := s.interval.Seconds()

    // Move all vessels
    for i := range s.world.Vessels {
        s.world.Vessels[i] = MoveVessel(s.world.Vessels[i], dt)
    }

    // Build update message
    update := WorldUpdate{
        Type:        "world_update",
        Vessels:     s.world.Vessels,
        Weather:     s.world.Weather,
        OwnPosition: s.ownPos,
        Timestamp:   time.Now().UTC().Format(time.RFC3339),
    }

    data, err := json.Marshal(update)
    if err != nil {
        return
    }

    s.hub.Broadcast(s.session, data)
}
```

- [ ] **Step 3: Run tests**

Run: `cd packages/api && go test ./internal/ws/ -v`

- [ ] **Step 4: Commit**

```bash
git add packages/api/internal/ws/simulator.go packages/api/internal/ws/simulator_test.go
git commit -m "feat(ws): add vessel movement simulator with position updates"
```

---

## Task 8: Build useChartWebSocket Hook (#202)

**Files:**
- Create: `packages/tools/src/components/chart/useChartWebSocket.ts`

- [ ] **Step 1: Implement WebSocket hook**

```typescript
import { useEffect, useRef } from 'react';
import { useChartStore } from './chartStore';

const WS_BASE = typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_VHF_WS_URL || 'ws://localhost:8080';

export function useChartWebSocket(sessionId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const { setVessels, setOwnPosition, setWeather, setActiveRadioTarget } = useChartStore();

  useEffect(() => {
    if (!sessionId) return;

    const ws = new WebSocket(`${WS_BASE}/api/vhf/sessions/${sessionId}/ws`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'world_update') {
          if (data.vessels) setVessels(data.vessels);
          if (data.ownPosition) setOwnPosition(data.ownPosition);
          if (data.weather) setWeather(data.weather);
        }

        if (data.type === 'radio_event') {
          setActiveRadioTarget(data.agentId || null);
          // Clear after 5 seconds
          setTimeout(() => setActiveRadioTarget(null), 5000);
        }
      } catch (err) {
        console.warn('[Chart] WebSocket message parse error:', err);
      }
    };

    ws.onclose = () => {
      console.log('[Chart] WebSocket closed');
    };

    ws.onerror = (err) => {
      console.error('[Chart] WebSocket error:', err);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [sessionId]);
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/tools/src/components/chart/useChartWebSocket.ts
git commit -m "feat(chart): add useChartWebSocket hook for real-time data"
```

---

## Task 9: Build Vessel Layer (#195, #196)

**Files:**
- Create: `packages/tools/src/components/chart/ChartVesselLayer.tsx`

- [ ] **Step 1: Implement vessel layer**

Uses MapLibre's `addSource` / `addLayer` API to render vessels as GeoJSON points with custom styling.

```typescript
import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import { useChartStore } from './chartStore';

interface ChartVesselLayerProps {
  map: maplibregl.Map | null;
}

export function ChartVesselLayer({ map }: ChartVesselLayerProps) {
  const vessels = useChartStore(s => s.vessels);
  const ownPosition = useChartStore(s => s.ownPosition);
  const activeRadioTarget = useChartStore(s => s.activeRadioTarget);

  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;

    // Own vessel source + layer
    const ownGeoJSON = {
      type: 'FeatureCollection' as const,
      features: [{
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [ownPosition.lon, ownPosition.lat] },
        properties: { name: 'You', cog: ownPosition.cog, sog: ownPosition.sog, isOwn: true },
      }],
    };

    // AIS vessel source
    const vesselGeoJSON = {
      type: 'FeatureCollection' as const,
      features: vessels.map(v => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [v.lon, v.lat] },
        properties: {
          name: v.name,
          callSign: v.callSign,
          cog: v.cog,
          sog: v.sog,
          type: v.type,
          isActive: v.callSign === activeRadioTarget || v.name === activeRadioTarget,
        },
      })),
    };

    // Update or create sources
    const ownSource = map.getSource('own-vessel') as maplibregl.GeoJSONSource;
    if (ownSource) {
      ownSource.setData(ownGeoJSON);
    } else {
      map.addSource('own-vessel', { type: 'geojson', data: ownGeoJSON });
      map.addLayer({
        id: 'own-vessel-layer',
        type: 'circle',
        source: 'own-vessel',
        paint: {
          'circle-radius': 6,
          'circle-color': '#4ade80',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#1a1a2e',
        },
      });
      map.addLayer({
        id: 'own-vessel-label',
        type: 'symbol',
        source: 'own-vessel',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 10,
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
        },
        paint: { 'text-color': '#4ade80' },
      });
    }

    const vesselSource = map.getSource('ais-vessels') as maplibregl.GeoJSONSource;
    if (vesselSource) {
      vesselSource.setData(vesselGeoJSON);
    } else {
      map.addSource('ais-vessels', { type: 'geojson', data: vesselGeoJSON });
      map.addLayer({
        id: 'ais-vessel-layer',
        type: 'circle',
        source: 'ais-vessels',
        paint: {
          'circle-radius': 5,
          'circle-color': ['case', ['get', 'isActive'], '#ffaa00', '#60a5fa'],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#1a1a2e',
        },
      });
      map.addLayer({
        id: 'ais-vessel-label',
        type: 'symbol',
        source: 'ais-vessels',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 9,
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
        },
        paint: { 'text-color': '#8b8b9e' },
      });
    }
  }, [map, vessels, ownPosition, activeRadioTarget]);

  return null; // Renders via MapLibre layers, not DOM
}
```

- [ ] **Step 2: Wire into ChartView**

Import and render `<ChartVesselLayer map={map} />` inside ChartView.

- [ ] **Step 3: Commit**

```bash
git add packages/tools/src/components/chart/ChartVesselLayer.tsx packages/tools/src/components/chart/ChartView.tsx
git commit -m "feat(chart): add vessel layer with own vessel and AIS targets"
```

---

## Task 10: Build Weather Overlay (#203)

**Files:**
- Create: `packages/tools/src/components/chart/ChartWeatherLayer.tsx`

- [ ] **Step 1: Implement weather overlay**

A DOM-based overlay (positioned absolute over the chart) showing current weather. Simple info box — not a full chart layer.

```typescript
import { useChartStore } from './chartStore';

export function ChartWeatherLayer() {
  const weather = useChartStore(s => s.weather);

  const windArrowRotation = weather.windDirection + 180; // arrow points FROM direction

  return (
    <div style={{
      position: 'absolute', top: 8, right: 8, zIndex: 10,
      background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 4, padding: '6px 8px',
      fontFamily: "'Fira Code', monospace", fontSize: 9, color: '#8b8b9e',
      display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <span>
        <span style={{
          display: 'inline-block', width: 0, height: 0,
          borderLeft: '3px solid transparent', borderRight: '3px solid transparent',
          borderBottom: '8px solid #60a5fa',
          transform: `rotate(${windArrowRotation}deg)`, marginRight: 4,
        }} />
        {windDirToCompass(weather.windDirection)} <span style={{color:'#e0e0e0'}}>{weather.windSpeedKnots}kn</span>
      </span>
      <span>Sea: <span style={{color:'#e0e0e0'}}>{weather.seaState}</span></span>
      <span>Vis: <span style={{color:'#e0e0e0'}}>{weather.visibility}</span></span>
    </div>
  );
}

function windDirToCompass(deg: number): string {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}
```

- [ ] **Step 2: Wire into ChartView**

- [ ] **Step 3: Commit**

```bash
git add packages/tools/src/components/chart/ChartWeatherLayer.tsx packages/tools/src/components/chart/ChartView.tsx
git commit -m "feat(chart): add weather overlay with wind, sea state, visibility"
```

---

## Task 11: Push Radio Events to WebSocket (#201)

**Files:**
- Modify: `packages/api/internal/handler/transmit.go`
- Modify: `packages/api/cmd/server/main.go`

- [ ] **Step 1: Pass WebSocket hub to transmit handler**

Update `TransmitHandler` to accept a `*ws.Hub`:

```go
type TransmitHandler struct {
    mgr    *session.Manager
    client LLMClient
    wsHub  *ws.Hub
}
```

Update `NewTransmitHandler` to accept the hub.

- [ ] **Step 2: Push radio event after agent response**

After the agent responds, broadcast a radio event:

```go
if h.wsHub != nil {
    radioEvent, _ := json.Marshal(map[string]string{
        "type":    "radio_event",
        "agentId": resp.Response.Station,
        "station": resp.Response.Station,
        "message": resp.Response.Message,
        "channel": fmt.Sprintf("%d", resp.Response.Channel),
    })
    h.wsHub.Broadcast(req.SessionID, radioEvent)
}
```

- [ ] **Step 3: Update main.go** to pass hub to transmit handler

- [ ] **Step 4: Run tests**

Run: `cd packages/api && go test ./... -v`

- [ ] **Step 5: Commit**

```bash
git add packages/api/internal/handler/transmit.go packages/api/cmd/server/main.go
git commit -m "feat(ws): push radio events to WebSocket on agent response"
```

---

## Task 12: Build Tabbed Panel (#206)

**Files:**
- Modify: `packages/tools/src/components/vhf/VHFSimulator.tsx`

- [ ] **Step 1: Add tabbed panel state**

Add `activeTab` state: `'log' | 'feedback' | 'scenario'`, default `'log'`.

- [ ] **Step 2: Replace separate panels with tabs**

Replace the current FeedbackPanel and TranscriptPanel direct rendering with a tab bar and conditional content:

```tsx
<div style={{ display: 'flex', borderBottom: '1px solid #2d2d4a', flexShrink: 0 }}>
  {['log', 'feedback', 'scenario'].map(tab => (
    <button key={tab} onClick={() => setActiveTab(tab)} style={{
      flex: 1, padding: '6px', textAlign: 'center',
      fontFamily: "'Space Mono', monospace", fontSize: '9px',
      color: activeTab === tab ? '#e0e0e0' : '#8b8b9e',
      borderBottom: activeTab === tab ? '2px solid #60a5fa' : '2px solid transparent',
      background: 'none', border: 'none', cursor: 'pointer',
    }}>
      {tab === 'log' ? 'Voice Log' : tab === 'feedback' ? 'Feedback' : 'Scenario'}
    </button>
  ))}
</div>
<div style={{ flex: 1, overflow: 'hidden' }}>
  {activeTab === 'log' && <TranscriptPanel />}
  {activeTab === 'feedback' && <FeedbackPanel ... />}
  {activeTab === 'scenario' && <ScenarioInfo />}
</div>
```

- [ ] **Step 3: Commit**

```bash
git add packages/tools/src/components/vhf/VHFSimulator.tsx
git commit -m "feat(vhf): add tabbed panel for voice log, feedback, scenarios"
```

---

## Task 13: Restructure VHF Layout with Chartplotter (#204)

**Files:**
- Modify: `packages/tools/src/components/vhf/VHFSimulator.tsx`

- [ ] **Step 1: Change layout to radio-left, chart-right**

Left column (420px fixed):
- Compact radio (PanelRadio)
- PTT + On Channel chips
- Tabbed panel (from Task 12)

Right column (flex: 1):
- ChartView with WebSocket connection

```tsx
import { ChartView } from '../chart/ChartView';
import { useChartWebSocket } from '../chart/useChartWebSocket';

// In component:
const sessionId = useVHFStore(s => s.sessionId);
useChartWebSocket(sessionId);

// Right column:
<div style={{ flex: 1, position: 'relative' }}>
  <ChartView center={regionCenter} zoom={12} />
</div>
```

Region centers mapping:
```typescript
const REGION_CENTERS: Record<string, [number, number]> = {
  'uk-south': [-1.3, 50.7],
  'caribbean': [-64.6, 18.4],
  'med-greece': [23.7, 37.9],
  'se-asia': [98.3, 7.9],
  'pacific': [177.0, -17.8],
  'atlantic': [-15.4, 28.1],
};
```

- [ ] **Step 2: Test manually**

Start both servers, open VHF page, verify chart renders alongside radio.

- [ ] **Step 3: Commit**

```bash
git add packages/tools/src/components/vhf/VHFSimulator.tsx
git commit -m "feat(vhf): restructure layout — radio left, chartplotter right"
```

---

## Task 14: Add VHF-Chart Interaction (#205, #197, #198)

**Files:**
- Modify: `packages/tools/src/components/chart/ChartVesselLayer.tsx`
- Create: `packages/tools/src/components/chart/ChartInfoPopup.tsx`
- Modify: `packages/tools/src/components/chart/ChartView.tsx`

- [ ] **Step 1: Add pulsing effect for active radio target**

In ChartVesselLayer, when `activeRadioTarget` matches a vessel, add a pulsing animation via a second circle layer with animated radius.

- [ ] **Step 2: Add vessel info popup**

ChartInfoPopup.tsx: On clicking a vessel marker, show a popup with name, callsign, SOG/COG, type. Use MapLibre's `Popup` class.

```typescript
map.on('click', 'ais-vessel-layer', (e) => {
  const feature = e.features?.[0];
  if (!feature) return;
  const props = feature.properties;
  new maplibregl.Popup({ closeButton: false, className: 'chart-popup' })
    .setLngLat(e.lngLat)
    .setHTML(`<div style="...">${props.name}<br>${props.sog}kn ${props.cog}°</div>`)
    .addTo(map);
});
```

- [ ] **Step 3: Add intelligent filtering**

At zoom < 10, filter to only show vessels with CPA < 1nm or activeRadioTarget. At zoom >= 10, show all.

- [ ] **Step 4: Commit**

```bash
git add packages/tools/src/components/chart/
git commit -m "feat(chart): add vessel interaction — popups, pulsing, intelligent filtering"
```

---

## Task 15: Integration Test

- [ ] **Step 1: Run full Go tests**

Run: `cd packages/api && go test ./... -v`

- [ ] **Step 2: Run full frontend tests**

Run: `cd packages/tools && pnpm test -- --run`

- [ ] **Step 3: Manual integration test**

1. Start Go server with .env
2. Open VHF simulator
3. Verify chart renders in right column with nautical tiles
4. Verify vessels appear on chart from WebSocket
5. Verify vessels move every 2 seconds
6. Call a vessel — verify it pulses on chart
7. Click a vessel on chart — verify info popup
8. Switch regions — verify chart centers on new area
9. Check weather overlay updates
10. Open standalone chart page at /tools/chart

- [ ] **Step 4: Commit any fixes**

```bash
git commit -am "fix(chart): integration fixes"
```
