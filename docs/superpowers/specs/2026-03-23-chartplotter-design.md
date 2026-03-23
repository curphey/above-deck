# Chartplotter — Design Spec

## Goal

Build a full-featured nautical chartplotter as both a VHF simulator companion and a standalone MFD tool. Uses MapLibre GL JS with OpenSeaMap vector tiles, custom blueprint-aesthetic styling, WebSocket-driven real-time vessel tracking, and intelligent AIS display. Architected as an experiment toward a production chartplotter.

## Dual Purpose

1. **VHF sim companion** — Right column of the VHF simulator, showing the radio scene: vessel positions, who you're talking to, CPA warnings, weather
2. **Standalone tool** — Own MFD screen at `/tools/chart` for chart viewing, route planning (future), anchor watch (future)

## Architecture

### Stack
- **MapLibre GL JS** — WebGL vector tile renderer
- **OpenSeaMap vector tiles** — Nautical data (depth contours, buoys, lights, harbours, shipping lanes)
- **Custom MapLibre style JSON** — Blueprint aesthetic matching brand guidelines
- **WebSocket** — Real-time updates from Go backend (vessel positions, weather, radio events)
- **React** — Component wrapper with hooks for MapLibre lifecycle and WebSocket

### Data Layers (bottom to top)
1. **Base chart** — Water, land, depth contours (vector tiles, custom styled)
2. **Nautical overlay** — Buoys, lights, hazards, shipping lanes, anchorages (vector tiles)
3. **Weather** — Wind barbs, sea state shading, visibility (from WorldState via WebSocket)
4. **Vessels** — AIS targets with COG vectors, CPA/TCPA warnings (from WorldState)
5. **Own vessel** — Position, heading, course vector, range rings
6. **Interactive** — Selection highlights, info popups, measurement tools

## Chart Styling (Blueprint Aesthetic)

Custom MapLibre style inspired by S-52 night palette + brand guidelines. Dark-first — no day mode for V1.

| Element | Color | Notes |
|---------|-------|-------|
| Water (deep) | `#081830` | Base, subtly darker at depth |
| Water (shoal) | slightly warmer | Hints at shallow areas |
| Land | `#1a2a1a` | Muted dark green |
| Coastline | `#4ade80` at 15% opacity | Fine line, not heavy |
| Depth contours | `#60a5fa` at 10% opacity | Fine lines, zoom-dependent |
| Depth soundings | `#60a5fa` at 30% opacity | Fira Code 7px |
| Grid (lat/lon) | `rgba(255,255,255,0.04)` | Labels at chart edges, Fira Code |
| Buoys (port) | `#f87171` | IALA convention red |
| Buoys (starboard) | `#4ade80` | IALA convention green |
| Light sectors | Transparent colored wedges | From light position |
| Hazards | `#f87171` | Coral for dangers |
| Typography | Fira Code (data), Space Mono (labels) | No serif fonts |

Night mode IS the default — blueprint-first, sailors plan at night.

## Vessel Display & AIS

### Own Vessel
- Green triangle `#4ade80`, rotated to heading
- Course vector proportional to SOG
- Range rings at 0.5nm, 1nm, 2nm (togglable)
- Wake trail showing recent track (fading line)

### AIS Targets
| State | Color | Behavior |
|-------|-------|----------|
| Safe | `#60a5fa` blue | Thin COG vector |
| Caution (CPA < 1nm) | `#ffaa00` amber | Thicker vector, CPA/TCPA label |
| Danger (CPA < 0.5nm) | `#f87171` red | Pulsing, dashed CPA line, audible alert |
| Coastguard station | `#ffaa00` amber dot | Coverage range circle |

### Intelligent Filtering
- Wide zoom: only show vessels within CPA threshold or in active radio conversation
- Close zoom: show all vessels
- Vessels in active VHF conversation get a radio badge
- Mayday positions flash red

### Vessel Info Popup (on click)
- Name, callsign, vessel type
- SOG, COG, CPA/TCPA
- Distance and bearing from own vessel
- Radio status (if in VHF conversation)

## WebSocket Data Flow

### Endpoint
`GET /api/vhf/sessions/{id}/ws` — upgrades to WebSocket

### Messages (server → client)

**World update (every 2 seconds):**
```json
{
  "type": "world_update",
  "vessels": [
    {"name": "Doris May", "callSign": "MDMX9", "lat": 50.15, "lon": -5.07, "sog": 5.2, "cog": 80, "type": "sailing"}
  ],
  "weather": {"windSpeedKnots": 15, "windDirection": 220, "seaState": "moderate", "visibility": "good"},
  "ownPosition": {"lat": 50.15, "lon": -5.04, "sog": 5.2, "cog": 320},
  "timestamp": "2026-03-23T12:34:00Z"
}
```

**Radio event (immediate on transmission):**
```json
{
  "type": "radio_event",
  "agentId": "doris-may",
  "station": "Doris May",
  "message": "Go ahead Artemis, over",
  "channel": 16
}
```

### Update Frequencies
- Vessel positions: every 2 seconds (simulated movement along COG at SOG rate)
- Weather: every 30 seconds
- Radio events: immediately when transmission occurs

### Go Backend Additions
- `internal/ws/hub.go` — WebSocket hub managing connections per session
- `internal/ws/simulator.go` — Simulates vessel movement (updates positions along COG at SOG rate between radio calls)
- Transmit handler pushes `radio_event` to WebSocket when agent responds

## Layout

### VHF Sim (integrated mode)

```
┌─────────────────────────────────────────────┐
│ ABOVE DECK          12.8V  342W  12:34 UTC  │
├──────────────┬──────────────────────────────┤
│ [Radio Unit] │                              │
│              │      CHARTPLOTTER            │
│ [PTT][chips] │                              │
│              │   Vessels, weather, chart     │
│ ┌──────────┐ │   with nautical tiles        │
│ │Voice Log │ │                              │
│ │Feedback  │ │                              │
│ │Scenario  │ │                              │
│ │(tabbed)  │ │                              │
│ └──────────┘ │                              │
├──────────────┴──────────────────────────────┤
│  Home  Solar  VHF  Chart  Passage  Weather  │
└─────────────────────────────────────────────┘
```

Left column: 420px fixed. Right column: fills remaining space.

### Standalone Mode

Full-screen chart at `/tools/chart` as its own MFD screen. Same component, no radio panel.

## Component Structure

```
packages/tools/src/components/chart/
  ChartView.tsx            — Main MapLibre wrapper, manages instance and layers
  ChartVesselLayer.tsx     — AIS targets + own vessel rendering
  ChartWeatherLayer.tsx    — Wind barbs, sea state overlay
  ChartControls.tsx        — Zoom, orientation (N-up/head-up/course-up), range rings
  ChartInfoPopup.tsx       — Vessel/waypoint info on click
  useMap.ts                — MapLibre instance lifecycle hook
  useChartWebSocket.ts     — WebSocket connection hook
  chartStore.ts            — Zustand store for chart state (vessels, weather, position)
  styles/
    blueprint-dark.json    — MapLibre style definition (full blueprint theme)
```

```
packages/api/internal/ws/
  hub.go                   — WebSocket hub, manages connections per session
  simulator.go             — Vessel movement simulation engine
```

## VHF Integration

- When in radio conversation with a vessel, that vessel pulses gently on chart
- Mayday declaration causes position to flash red
- Selecting a vessel on the chart could pre-fill a radio call (future)
- Chart centers on the region's area when session starts
- Own vessel position matches the WorldState

## Future (Not V1)

- Route planning with waypoints
- Anchor watch with drag alarm
- Tidal overlay (stream arrows)
- Depth shading with dynamic contouring
- MOB button
- Instrument panel split view
- Offline chart caching (PWA)
