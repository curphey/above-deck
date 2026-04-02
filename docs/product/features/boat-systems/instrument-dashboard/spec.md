# Instrument Dashboard — Feature Specification

**Feature:** 6.14 Instrument Dashboard
**Status:** Draft
**Date:** 2026-03-31
**License:** GPL v3

---

## 1. Overview

The Instrument Dashboard is a configurable, real-time display for all boat data. It renders gauge-based visualisations of navigation, electrical, propulsion, tank, and environmental data from the Above Deck unified data model. Users arrange gauges into layouts, set alarm thresholds, and switch between preset configurations for different sailing modes.

The dashboard runs as an MFD app tile on both hub and spoke. On the spoke, it connects directly to the Go WebSocket server for sub-second instrument updates from protocol adapters. On the hub, it displays the same data with a slight delay (synced from the spoke when connectivity is available), enabling remote monitoring from shore.

Design references: Raymarine Axiom 2 Dashboard app (gauge types, three-tier data display), Maretron N2KView (drag-and-drop gauge placement, alarm system), Simarine PICO (visual battery and tank overview aesthetic).

---

## 2. User Stories

### Sailor at the helm
- As a sailor under way, I want to glance at speed, depth, wind, and heading gauges so I can maintain situational awareness without looking away from the water for long.
- As a sailor sailing at night, I want the dashboard in a red-tinted dark mode so it does not destroy my night vision.
- As a sailor in rough conditions, I want gauges large enough to read from 1.5 metres away on a bouncing boat.

### Cruiser monitoring systems
- As a cruiser at anchor, I want to see battery SOC, solar input, tank levels, and fridge temperature on a single page so I can manage resources without opening multiple apps.
- As a cruiser with two engines, I want a motoring layout showing RPM, oil pressure, coolant temp, and fuel rate for both engines side by side.

### Remote monitoring
- As a boat owner away from the boat, I want to view the instrument dashboard remotely via the hub so I can check battery voltage, bilge status, and fridge temperature from my phone.

### Customisation
- As a power user, I want to create custom layouts with exactly the gauges I need, arranged how I want, and save them for one-tap recall.
- As a racer, I want a stripped-down layout showing only VMG, polar speed percentage, true wind angle, and boat speed.

### Alarms
- As a sailor, I want the depth gauge to flash and sound an alarm when water shoals below my configured threshold so I can react before grounding.
- As a cruiser, I want a low-voltage alarm on my house battery bank so I am warned before the battery drops to a damaging level.

---

## 3. Gauge Types

### 3.1 Analog Dial

Traditional round gauge with a rotating needle on a circular scale. Used where visual rate-of-change matters (wind angle, compass heading, RPM, speed).

- Configurable scale range, major/minor tick marks, colour-coded arcs (green/yellow/red zones)
- Needle smoothing (configurable damping) to reduce jitter from noisy data
- Digital readout of the current value centred below the needle
- SVG-rendered for crisp scaling across display sizes

### 3.2 Digital Readout

Large numeric display with label and unit. The primary gauge type for precise values where the exact number matters more than the trend (depth, voltage, temperature, SOC percentage).

- Configurable decimal places, unit conversion (knots/km/h/mph, C/F, metres/feet/fathoms)
- Trend arrow (up/down/steady) based on recent rate of change
- Colour transitions based on alarm thresholds (normal, warning, critical)
- Compact and large variants for different layout densities

### 3.3 Bar Gauge

Horizontal or vertical filled bar showing a value as a proportion of a range. Used for tank levels, battery SOC, signal strength.

- Configurable min/max, colour gradient (green to red as tank empties, or red to green as SOC rises)
- Percentage label and absolute value label
- Grouped bar display for multi-tank or multi-battery overview

### 3.4 Tape Gauge

Linear strip gauge that scrolls as the value changes. Used for depth (vertical tape), speed (horizontal tape), heading (horizontal rotating tape with compass markings).

- Moving-scale style: the value marker stays fixed, the scale slides behind it
- Configurable scale density and label interval
- Useful for values where continuous change over a range is the key information

### 3.5 Compass Rose

Dedicated circular compass display showing heading with a rotating card and lubber line.

- Magnetic or true heading (user selectable, with magnetic variation displayed)
- COG vector overlay
- Bearing to waypoint overlay when a route is active
- Rate of turn indicator (optional arc)

### 3.6 Wind Display

Specialised circular gauge for wind data showing both apparent and true wind simultaneously.

- Outer ring: apparent wind angle and speed
- Inner ring: true wind angle and speed (calculated or from instruments)
- Close-hauled angle markers (configurable per tack)
- Port/starboard colour coding (red/green)
- History trace: faint trail showing wind angle variation over the last N minutes

### 3.7 Trend Graph

Small inline sparkline or mini time-series chart showing recent history of a value.

- Configurable time window (5 min, 30 min, 1 hr, 6 hr, 24 hr)
- Used alongside digital readouts to show barometric pressure trend, battery voltage over time, solar yield curve
- Tap to expand to a full-screen historical chart

### 3.8 Status Indicator

Simple state display for boolean or enumerated values.

- On/off indicators (shore power connected, bilge pump running, autopilot engaged)
- Colour-coded states: green (normal), coral (attention), flashing (alarm)
- Gear indicator for transmission (F/N/R)
- Charger state display (Bulk/Absorption/Float/Equalize)

---

## 4. Data Bindings

Each gauge binds to a path in the unified data model. The data model is the single source of truth for all instrument and system data.

### 4.1 Binding Model

A gauge configuration consists of:

```
{
  "gauge_type": "analog_dial",
  "data_path": "navigation/speed/through_water",
  "label": "Boat Speed",
  "unit": "knots",
  "range": { "min": 0, "max": 15 },
  "alarm": { "low": null, "high": 12 },
  "damping": 2,
  "update_rate": "normal"
}
```

- `data_path` — dot or slash-separated path in the Above Deck data model
- `unit` — display unit with automatic conversion from the canonical SI unit stored in the data model
- `range` — display range for analog/bar/tape gauges
- `alarm` — per-gauge threshold overrides (see section 6)
- `damping` — smoothing factor (seconds) to reduce jitter
- `update_rate` — `fast` (10 Hz), `normal` (1 Hz), or `slow` (0.1 Hz)

### 4.2 Available Data Paths

Gauges can bind to any path in the data model. Key paths by domain:

**navigation/**
| Path | Type | Description |
|------|------|-------------|
| `navigation/position/latitude` | float64 | Current latitude |
| `navigation/position/longitude` | float64 | Current longitude |
| `navigation/heading/magnetic` | float64 | Magnetic heading (degrees) |
| `navigation/heading/true` | float64 | True heading (degrees) |
| `navigation/course/over_ground` | float64 | COG (degrees) |
| `navigation/speed/through_water` | float64 | Speed through water (m/s) |
| `navigation/speed/over_ground` | float64 | SOG (m/s) |
| `navigation/depth/below_transducer` | float64 | Depth below transducer (m) |
| `navigation/depth/below_keel` | float64 | Depth below keel (m) |
| `navigation/wind/apparent_angle` | float64 | Apparent wind angle (rad) |
| `navigation/wind/apparent_speed` | float64 | Apparent wind speed (m/s) |
| `navigation/wind/true_angle` | float64 | True wind angle (rad) |
| `navigation/wind/true_speed` | float64 | True wind speed (m/s) |
| `navigation/attitude/heel` | float64 | Heel angle (rad) |
| `navigation/attitude/trim` | float64 | Trim angle (rad) |
| `navigation/autopilot/mode` | enum | Autopilot mode (standby, compass, wind, track) |
| `navigation/autopilot/target_heading` | float64 | Target heading (degrees) |

**electrical/**
| Path | Type | Description |
|------|------|-------------|
| `electrical/batteries/{id}/voltage` | float64 | Battery voltage (V) |
| `electrical/batteries/{id}/current` | float64 | Battery current (A) |
| `electrical/batteries/{id}/soc` | float64 | State of charge (%) |
| `electrical/batteries/{id}/temperature` | float64 | Battery temperature (C) |
| `electrical/solar/{id}/power` | float64 | Solar panel output (W) |
| `electrical/solar/{id}/daily_yield` | float64 | Daily solar yield (kWh) |
| `electrical/chargers/{id}/state` | enum | Charger state (bulk, absorption, float) |
| `electrical/inverters/{id}/load` | float64 | Inverter load (W) |
| `electrical/shore/connected` | bool | Shore power connected |
| `electrical/shore/voltage` | float64 | Shore power voltage (V) |

**propulsion/**
| Path | Type | Description |
|------|------|-------------|
| `propulsion/engines/{id}/rpm` | float64 | Engine RPM |
| `propulsion/engines/{id}/oil_pressure` | float64 | Oil pressure (kPa) |
| `propulsion/engines/{id}/coolant_temp` | float64 | Coolant temperature (C) |
| `propulsion/engines/{id}/exhaust_temp` | float64 | Exhaust temperature (C) |
| `propulsion/engines/{id}/fuel_rate` | float64 | Fuel consumption (L/hr) |
| `propulsion/engines/{id}/hours` | float64 | Total engine hours |
| `propulsion/transmissions/{id}/gear` | enum | Forward / Neutral / Reverse |

**tanks/**
| Path | Type | Description |
|------|------|-------------|
| `tanks/fuel/{id}/level` | float64 | Tank level (%) |
| `tanks/fuel/{id}/capacity` | float64 | Tank capacity (L) |
| `tanks/freshwater/{id}/level` | float64 | Tank level (%) |
| `tanks/blackwater/{id}/level` | float64 | Tank level (%) |

**environment/**
| Path | Type | Description |
|------|------|-------------|
| `environment/outside/temperature` | float64 | Outside air temp (C) |
| `environment/outside/sea_temp` | float64 | Sea water temp (C) |
| `environment/outside/pressure` | float64 | Barometric pressure (hPa) |
| `environment/outside/humidity` | float64 | Relative humidity (%) |
| `environment/inside/{zone}/temperature` | float64 | Cabin temp (C) |
| `environment/refrigeration/{id}/temperature` | float64 | Fridge/freezer temp (C) |

### 4.3 Dynamic Binding

- Gauges auto-discover available data paths from the data model at runtime
- If a bound path has no data source (no sensor connected), the gauge shows a "No Data" state rather than zero
- When a new device comes online (e.g., engine started, sensor connected), its data paths become available immediately
- Unit conversion is handled at the display layer; the data model stores canonical SI units

---

## 5. Layout System

### 5.1 Grid-Based Layout

Layouts use a responsive grid system that adapts to display size:

| Display Size | Grid | Typical Use |
|-------------|------|-------------|
| 7" (1024x600) | 4x3 | Helm display, dedicated instrument panel |
| 9" (1280x720) | 6x4 | Primary MFD |
| 12" (1280x800) | 6x5 | Navigation station MFD |
| 16" (1920x1080) | 8x6 | Large chart table display |
| 24-27" (2560x1440) | 12x8 | Dedicated monitoring station |

Gauges occupy one or more grid cells. An analog dial might take 2x2 cells; a digital readout might take 1x1. Users resize gauges by spanning cells.

### 5.2 Layout Editing

- **Edit mode:** long-press or tap edit button to enter layout editing
- **Add gauge:** tap empty cell, select gauge type, bind to data path from a categorised picker
- **Move gauge:** drag to reposition within the grid
- **Resize gauge:** drag corner handle to span more or fewer cells
- **Remove gauge:** drag to trash zone or tap delete in context menu
- **Undo/redo:** full undo stack during editing session

### 5.3 Save and Load

- Layouts are saved locally (spoke SQLite) and synced to hub
- Each layout has a name and optional icon
- Layouts are per-boat (tied to the boat profile, not the user)
- Export/import layouts as JSON for sharing with the community
- Multiple users on the same boat share layouts but can have personal favourites order

### 5.4 Pages

A dashboard can have multiple pages (swipe left/right or tap page indicators to switch). Each page is an independent layout. This matches the Raymarine pattern of multiple dashboard pages for different contexts.

---

## 6. Alarm Thresholds

### 6.1 Per-Gauge Alarms

Every gauge can have configurable alarm thresholds:

| Alarm Type | Trigger | Example |
|-----------|---------|---------|
| Low threshold | Value drops below limit | Depth < 2.0m, battery voltage < 12.0V |
| High threshold | Value exceeds limit | Coolant temp > 95C, RPM > 3200 |
| Rate-of-change | Value changes faster than limit | Barometric pressure drop > 3 hPa/hr |
| Stale data | No update received within timeout | GPS position > 30s stale |

### 6.2 Alarm Behaviour

- **Visual:** gauge border flashes coral (`#f87171`), value text turns coral
- **Audible:** configurable alarm tone via the spoke's audio output (distinct tones for warning vs critical)
- **Notification:** alert pushed to the Above Deck notification system (`notifications/alerts/`)
- **Escalation:** if not acknowledged within a configurable window, the alarm escalates (louder tone, push notification to phone, alert to AI Engineer agent)
- **Acknowledge:** tap to acknowledge and silence; alarm remains visible until the condition clears
- **Snooze:** temporarily suppress a specific alarm for a configurable duration

### 6.3 System-Level Defaults

The monitoring service on the spoke maintains its own alarm thresholds (configured in boat profile). Per-gauge alarms on the dashboard are display-layer overrides that supplement, not replace, the system-level monitoring. The spoke monitoring service always runs regardless of whether any dashboard is open.

Common default thresholds shipped with the platform:

| Parameter | Warning | Critical |
|-----------|---------|----------|
| Depth below keel | < 3.0m | < 1.5m |
| House battery voltage (12V) | < 12.2V | < 11.8V |
| House battery voltage (24V) | < 24.4V | < 23.6V |
| Engine coolant temp | > 90C | > 100C |
| Engine oil pressure | < 250 kPa | < 150 kPa |
| Bilge pump cycles/hr | > 3 | > 6 |
| Fridge temperature | > 5C | > 8C |
| Freezer temperature | > -15C | > -10C |
| Battery temperature (LiFePO4) | < 5C or > 45C | < 0C or > 50C |

---

## 7. Real-Time Updates

### 7.1 WebSocket Protocol

The spoke's Go WebSocket server pushes data model changes to connected dashboard clients.

**Connection flow:**
1. Dashboard client connects to `ws://{spoke}:{port}/ws/instruments`
2. Client sends a subscription message listing the data paths it needs (based on which gauges are on screen)
3. Server pushes updates only for subscribed paths, at the appropriate rate
4. Client re-subscribes when the layout changes (page switch, gauge add/remove)

**Message format:**

```json
{
  "type": "update",
  "timestamp": "2026-03-31T14:22:03.142Z",
  "values": [
    { "path": "navigation/speed/over_ground", "value": 6.42, "ts": 1743434523142 },
    { "path": "navigation/depth/below_keel", "value": 8.7, "ts": 1743434523100 },
    { "path": "electrical/batteries/house/voltage", "value": 13.21, "ts": 1743434523000 }
  ]
}
```

### 7.2 Update Rates by Data Type

Different data types have different native update rates from the NMEA 2000 bus. The dashboard respects these rates and does not request data faster than the bus provides it.

| Data Category | Bus Rate | Dashboard Rate | Rationale |
|--------------|----------|----------------|-----------|
| Engine RPM (PGN 127488) | 10 Hz | 10 Hz (fast) | Needs responsive needle movement |
| Wind angle/speed | 4 Hz | 4 Hz (fast) | Critical for sailing decisions |
| Speed, heading, COG | 2-4 Hz | 2 Hz (normal) | Smooth display without excess traffic |
| Depth | 2.5 Hz | 2 Hz (normal) | Important but not millisecond-critical |
| Battery voltage/current | 1 Hz | 1 Hz (normal) | Slow-changing values |
| Tank levels | 2.5 Hz | 0.5 Hz (slow) | Very slow-changing, reduce noise |
| Temperature (all types) | 1 Hz | 0.2 Hz (slow) | Changes over minutes, not seconds |
| Engine hours, total log | 1 Hz | 0.1 Hz (slow) | Near-static values |

### 7.3 Data Damping

Configurable per gauge. A damping value of N seconds means the displayed value is a rolling average over the last N seconds. This smooths jitter from noisy sensors (particularly depth sounders in rough seas and wind instruments in gusty conditions). Damping of 0 shows raw values.

### 7.4 Connection Resilience

- Auto-reconnect with exponential backoff on WebSocket disconnect
- Stale data detection: if no update received for a data path within 2x its expected interval, the gauge shows a stale indicator (dimmed value, clock icon)
- Offline indicator when the WebSocket connection is down

---

## 8. UI/UX

### 8.1 Design Language

The dashboard follows the Above Deck blueprint aesthetic:

- **Background:** Deep Navy (`#1a1a2e`) default, with gauge faces on Midnight Blue (`#16213e`) surfaces
- **Gauge lines and ticks:** Blueprint Grey (`#2d2d4a`) at varying opacity
- **Values:** Pale Grey (`#e0e0e0`) for primary readings
- **Labels:** Slate (`#8b8b9e`) for gauge labels, units, and secondary text
- **Positive values:** Sea Green (`#4ade80`) for charging, generation, healthy
- **Warning values:** Coral (`#f87171`) for alarms, deficits, critical
- **Interactive elements:** Ocean Blue (`#60a5fa`) for selected gauge borders, edit handles
- **Typography:** Space Mono for gauge values (monospace for numerical alignment), Inter for labels

The overall aesthetic should feel like a backlit instrument panel on a well-designed cockpit — precise, functional, zero decoration.

### 8.2 Night Mode

Dark mode is the default. A dedicated night mode goes further:

- All colours shift to deep red tones (red preserves scotopic vision)
- Screen brightness reduces to minimum
- White and blue elements are eliminated entirely
- Activated manually or auto-triggered by ambient light sensor / time of day

### 8.3 Responsive Scaling

The dashboard must be usable across the full display range:

| Screen | Gauge Sizing | Touch Target |
|--------|-------------|--------------|
| 7" helm display | Max 4-6 gauges visible, large type (24-32pt values) | 48px minimum tap targets |
| 9-12" MFD | 8-12 gauges per page, medium type (18-24pt) | 44px minimum |
| 16"+ nav station | 15-20+ gauges per page, dense layout option | 40px minimum |
| Phone (remote) | 2-4 gauges per row, scrollable, single-column option | 48px minimum |

Font sizes for gauge values scale proportionally with gauge cell size. A 2x2 gauge shows larger numbers than a 1x1 gauge.

### 8.4 Three-Tier Data Display

Following the Raymarine pattern of progressive disclosure:

1. **MFD home screen tiles** — key values (SOG, depth, battery SOC) shown as live tiles on the MFD home grid without opening the dashboard app
2. **Overlay sidebar** — a slide-out panel with configurable data fields that overlays on top of any other app (chartplotter, anchor watch)
3. **Full dashboard app** — the dedicated multi-page instrument display described in this spec

This spec covers tier 3. Tiers 1 and 2 are part of the MFD shell specification.

### 8.5 Split View

The dashboard can render in half-screen mode for MFD split view alongside the chartplotter, anchor watch, or camera feeds. In split view, the layout adapts: fewer gauges visible, larger individual gauge sizes, swipe to access additional pages.

---

## 9. Preset Layouts

The dashboard ships with preset layouts that cover common scenarios. Users can modify presets or create their own.

### 9.1 Sailing

| Gauge | Type | Size |
|-------|------|------|
| Boat speed (STW) | Analog dial | 2x2 |
| SOG | Digital readout | 1x1 |
| Depth | Digital readout with trend | 2x1 |
| True wind angle/speed | Wind display | 2x2 |
| Apparent wind angle/speed | Wind display | 2x2 |
| Heading (compass) | Compass rose | 2x2 |
| COG | Digital readout | 1x1 |
| Heel angle | Analog dial | 1x1 |
| VMG | Digital readout | 1x1 |

### 9.2 Motoring

| Gauge | Type | Size |
|-------|------|------|
| Port engine RPM | Analog dial | 2x2 |
| Starboard engine RPM | Analog dial | 2x2 |
| Port oil pressure | Analog dial | 1x1 |
| Starboard oil pressure | Analog dial | 1x1 |
| Port coolant temp | Analog dial | 1x1 |
| Starboard coolant temp | Analog dial | 1x1 |
| Fuel rate (combined) | Digital readout | 1x1 |
| SOG | Digital readout | 1x1 |
| Heading | Compass rose | 2x2 |
| Depth | Digital readout | 1x1 |
| Fuel tank levels | Bar gauge (grouped) | 2x1 |
| Transmission gear (port) | Status indicator | 1x1 |
| Transmission gear (stbd) | Status indicator | 1x1 |

### 9.3 At Anchor

| Gauge | Type | Size |
|-------|------|------|
| House battery SOC | Bar gauge | 2x1 |
| House battery voltage | Digital readout with trend | 1x1 |
| Solar input (W) | Digital readout with trend | 1x1 |
| Solar daily yield (kWh) | Digital readout | 1x1 |
| Shore power status | Status indicator | 1x1 |
| Fresh water level | Bar gauge | 1x2 |
| Fuel level | Bar gauge | 1x2 |
| Black water level | Bar gauge | 1x2 |
| Fridge temperature | Digital readout | 1x1 |
| Freezer temperature | Digital readout | 1x1 |
| Cabin temperature | Digital readout | 1x1 |
| Barometric pressure | Digital readout with trend | 2x1 |
| Depth (tide reference) | Digital readout with trend | 1x1 |
| Wind speed | Digital readout | 1x1 |

### 9.4 Monitoring (Unattended)

Designed for the remote monitoring use case via the hub — a dense overview of everything that matters when the boat is left alone.

| Gauge | Type | Size |
|-------|------|------|
| Battery SOC (all banks) | Bar gauge (grouped) | 2x1 |
| Battery voltage (all banks) | Digital readout | 1x1 per bank |
| Shore power | Status indicator | 1x1 |
| Bilge pump status | Status indicator | 1x1 per zone |
| All tank levels | Bar gauge (grouped) | 2x2 |
| Fridge temperature | Digital readout | 1x1 |
| Freezer temperature | Digital readout | 1x1 |
| Cabin temperature | Digital readout | 1x1 |
| GPS position | Digital readout | 2x1 |
| Last update timestamp | Digital readout | 1x1 |

---

## 10. Hub vs Spoke

### 10.1 Spoke (On-Board)

- Primary runtime environment for the dashboard
- Direct WebSocket connection to the Go server's instrument data stream
- Sub-second latency from sensor to screen
- Full 10 Hz update rate for fast-changing values
- Layout editing and alarm configuration stored locally in SQLite
- Works 100% offline with no hub dependency
- Audio alarms via the spoke hardware's audio output

### 10.2 Hub (Remote Viewing)

- Dashboard accessible via browser from anywhere with internet
- Data arrives via spoke-to-hub sync (when the spoke has connectivity)
- Update latency depends on connectivity: seconds on good cellular, minutes on satellite, hours on HF radio
- The hub dashboard renders identically but shows a "last synced" timestamp
- Alarm thresholds are evaluated on the spoke (where the data is fresh); the hub receives alarm notifications, it does not independently evaluate thresholds on stale data
- Layout configurations sync between hub and spoke — edit on either, changes propagate

### 10.3 Degradation

| Connectivity State | Behaviour |
|-------------------|-----------|
| Spoke online, direct access | Full real-time dashboard, all update rates |
| Spoke online, hub access via internet | Near-real-time, slight delay, all gauges functional |
| Spoke online, no internet | Dashboard works locally on spoke, hub shows last-synced state |
| Spoke offline (powered down) | Hub shows last-known values with timestamps, stale indicators on all gauges |

---

## 11. Technical Implementation Notes

### 11.1 Gauge Rendering

- SVG for analog dials, compass rose, wind display (scales crisply, animates smoothly)
- Canvas for trend graphs (performance with many data points)
- React components with Zustand for gauge state
- `requestAnimationFrame` for smooth needle animation on analog gauges
- GPU-composited layers for gauges that update at high frequency

### 11.2 Performance Budget

- Dashboard page must render within 500ms of page switch
- Gauge update must paint within 16ms (60 fps) of receiving a WebSocket message
- Maximum 50 gauges per page (practical limit for both layout density and WebSocket subscription size)
- WebSocket message batching: the server bundles all path updates within a 50ms window into a single message to reduce overhead

### 11.3 Accessibility

- High-contrast mode option for bright sunlight readability (inverse: light background with dark gauges)
- All gauge values exposed via ARIA labels for screen readers
- Keyboard navigation between gauges in edit mode
- Colour-blind safe alarm indicators: flashing pattern in addition to colour change

### 11.4 Data Persistence

- Current gauge values cached in IndexedDB for instant display on page load (no blank gauges while waiting for first WebSocket update)
- Layout configurations stored in spoke SQLite, synced to hub PostgreSQL
- Alarm history (trigger time, acknowledge time, value at trigger) logged to the spoke's time-series store

---

## 12. Out of Scope

- Gauge types for radar or sonar data (these are full app displays, not dashboard gauges)
- Digital switching control from the dashboard (covered by the Digital Switching feature spec)
- Autopilot control interface (separate app, though autopilot status gauges are in scope)
- Historical data analysis and long-term charting (covered by the Logbook/Analytics feature)
- AR overlay on camera feeds (covered by the Cameras spec and future AR spec)
