# Anchor Watch — Feature Specification

**Date:** 2026-03-31
**Status:** Draft v1
**Product Vision Reference:** Section 6.16
**License:** GPL

---

## 1. Overview

Anchor watch is a GPS drag alarm — the most-used overnight safety feature on any cruising boat. When a boat is anchored, the system continuously monitors GPS position against the anchor drop point and alerts the crew if the boat drags outside a defined radius.

This is safety-critical software. A dragged anchor at 3am in a crowded anchorage, near a lee shore, or in deteriorating weather can result in grounding, collision, or loss of vessel. The system must be reliable, low-latency, and must work entirely offline on the spoke with no dependency on the hub or internet.

### What existing tools get wrong

Most anchor watch apps are phone-based. Phones overheat, batteries die, GPS accuracy degrades with power-saving modes, and notifications can be silenced by Do Not Disturb. A dedicated on-boat spoke running on mains power with a continuous GPS feed from the NMEA 2000 network is fundamentally more reliable.

Additionally, most apps use a simple fixed radius. They don't account for depth, scope, chain catenary, freeboard, or tidal range — all of which affect the actual swing circle.

---

## 2. User Stories

### Setting the anchor

- As a skipper, I want to mark my anchor position with one tap so I can start monitoring immediately after the anchor is set.
- As a skipper, I want the system to auto-calculate the expected swing radius from the depth, scope, and my boat's freeboard so I don't have to guess a radius.
- As a skipper, I want to manually override the radius if I know the anchorage better than the algorithm.
- As a skipper, I want to enter the amount of chain/rode I've deployed so the system can calculate scope ratio.

### Monitoring overnight

- As a skipper sleeping below, I want a loud local alarm if the boat drags beyond the swing circle so I wake up immediately.
- As a skipper, I want to glance at the anchor watch display from my bunk and see at-a-glance status (green = safe, red = dragging) without reading numbers.
- As a crew member on another boat in the anchorage, I want to receive a push notification if my friend's boat is dragging so I can radio them.
- As a skipper anchored in a tidal area, I want the system to account for tidal range so the swing circle adjusts as depth changes.

### Reviewing performance

- As a skipper, I want to see a trail of my boat's position over the night so I can understand how the boat swung and whether the anchor held.
- As a skipper, I want to review anchor history across previous anchorages so I can track my anchor's reliability.

### Remote monitoring

- As a boat owner at a restaurant ashore, I want a push notification on my phone if the boat drags while I'm away.
- As a boat owner, I want SMS alerts as a fallback if push notifications fail.

---

## 3. Core Algorithm

### 3.1 Anchor position marking

When the user taps "Drop Anchor":

1. Record the current GPS position as the **boat position** at time of anchor drop.
2. Prompt for (or accept defaults):
   - **Depth at anchor** (metres) — from NMEA 2000 depth transducer (PGN 128267), corrected for transducer offset. User can override.
   - **Scope deployed** (metres) — how much chain/rode the user let out. No sensor for this; manual input required.
   - **Rode type** — all chain, chain + rope, or all rope. Affects catenary calculation.
3. Calculate the **anchor position** by projecting backward from the boat position along the current heading by the horizontal distance the rode covers:
   - For all-chain with catenary: horizontal distance = `sqrt(scope^2 - depth^2)` (simplified; the full catenary calculation is described below).
   - For chain + rope: chain hangs in catenary, rope section is approximately straight.
4. Record the anchor position as the centre point of the swing circle.

**Catenary calculation (all-chain):**

The chain hangs in a catenary curve. The horizontal distance `x` from anchor to bow roller is:

```
x = (T_h / w) * acosh(1 + (w * depth) / T_h)
```

Where:
- `T_h` = horizontal tension at the anchor (varies with wind/current)
- `w` = weight per metre of chain in water (kg/m * g, adjusted for buoyancy — typically 0.87 * weight in air)
- `depth` = water depth + freeboard to bow roller

For the initial calculation, assume light-wind conditions where `T_h` is low and the catenary is deep. As wind increases, `T_h` rises and the chain straightens, reducing the effective scope.

**Simplified fallback:** If the full catenary is overkill for the user's needs, use the Pythagorean approximation: `horizontal_distance = sqrt(scope^2 - depth^2)`. This slightly overestimates the radius (conservative — safer for alarm purposes).

### 3.2 Swing circle calculation

The **swing radius** is the maximum distance the boat can move from the anchor position:

```
swing_radius = horizontal_rode_distance + boat_length
```

Where `boat_length` accounts for the boat pivoting around the bow roller. The boat's stern sweeps a larger circle than the bow.

**Inputs used:**

| Input | Source | Fallback |
|-------|--------|----------|
| Depth | NMEA 2000 PGN 128267 (depth below transducer) + transducer offset from boat profile | Manual input |
| Scope (chain/rode deployed) | Manual input | Default to 5:1 ratio * depth |
| Freeboard to bow roller | Boat profile (static, entered once) | Default 1.5m |
| Boat length | Boat profile | Default 12m |
| Tidal range | Tide data (if available) | Assume no tidal variation |
| Rode type | User selection | Default: all chain |

### 3.3 Auto-calculated radius

When the user enters only depth and scope, the system calculates the radius automatically:

```
total_depth = charted_depth + tidal_height + transducer_offset + freeboard_to_bow_roller
horizontal_distance = sqrt(scope^2 - total_depth^2)
swing_radius = horizontal_distance + boat_length
```

The user sees this as a single number: "Swing radius: 45m". They can accept it, adjust it, or override with a fixed radius.

### 3.4 Drag detection

The monitoring loop runs every GPS fix (typically 1Hz from NMEA 2000):

1. Compute distance from current GPS position to anchor position.
2. Compare against swing radius.
3. Apply hysteresis to avoid false alarms:
   - **Warning** at 90% of swing radius — "Approaching limit".
   - **Alarm** when distance exceeds swing radius for 3 consecutive fixes (3 seconds at 1Hz).
   - **Critical alarm** when distance exceeds swing radius by 10% or more, or rate of departure exceeds 0.5 knots.
4. Track the **drag vector** — direction and speed of movement away from anchor.
5. Cancel alarm if the boat returns inside the swing radius (GPS wander, not actual drag).

**GPS accuracy considerations:**

- NMEA 2000 GPS accuracy is typically 2-5m CEP (circular error probable).
- In very small swing circles (<20m radius), GPS noise can cause false alarms.
- Apply a GPS noise floor of 5m — never alarm on movements smaller than 5m from the swing circle boundary.
- Use a rolling average of the last 5 GPS positions (5 seconds) to smooth noise, but never delay a genuine alarm by more than 5 seconds.

### 3.5 Tidal adjustment

If tide data is available (from the tide prediction engine or manual entry):

1. Recalculate `total_depth` every 10 minutes based on predicted tidal height.
2. Recalculate `horizontal_distance` and `swing_radius` accordingly.
3. At low tide, depth decreases, `total_depth` drops, `horizontal_distance` increases, swing radius grows.
4. At high tide, the reverse.
5. Display the current adjusted radius on the UI.

---

## 4. Data Model

### 4.1 Anchor session

```
anchor_sessions
  id                  UUID
  boat_id             UUID
  anchor_lat          REAL        -- anchor position (calculated)
  anchor_lng          REAL
  drop_lat            REAL        -- boat position at time of drop
  drop_lng            REAL
  depth_at_drop       REAL        -- metres, from transducer or manual
  scope_deployed      REAL        -- metres of chain/rode
  rode_type           TEXT        -- 'chain', 'chain_rope', 'rope'
  chain_length        REAL        -- metres of chain (if chain_rope)
  swing_radius        REAL        -- metres, calculated or overridden
  radius_override     BOOLEAN     -- true if user manually set radius
  freeboard           REAL        -- metres, from boat profile or manual
  boat_length         REAL        -- metres, from boat profile
  status              TEXT        -- 'active', 'retrieved', 'dragged'
  started_at          TIMESTAMP
  ended_at            TIMESTAMP   -- null while active
  notes               TEXT        -- user notes (bottom type, holding, etc.)
```

### 4.2 Anchor position log (time-series)

```
anchor_position_log
  session_id          UUID
  timestamp           TIMESTAMP
  boat_lat            REAL
  boat_lng            REAL
  distance_to_anchor  REAL        -- metres
  depth               REAL        -- current depth reading
  wind_speed          REAL        -- knots, if available
  wind_direction      REAL        -- degrees true, if available
  current_speed       REAL        -- knots, if available
  current_direction   REAL        -- degrees true, if available
  alarm_state         TEXT        -- 'safe', 'warning', 'alarm', 'critical'
```

Logged at reduced frequency (every 30 seconds) to limit storage. Full 1Hz data is kept in memory for the last 10 minutes for drag analysis, then downsampled.

### 4.3 Anchor history

```
anchor_history
  session_id          UUID
  anchorage_name      TEXT        -- reverse geocoded or user-entered
  lat                 REAL
  lng                 REAL
  arrived_at          TIMESTAMP
  departed_at         TIMESTAMP
  max_wind            REAL        -- peak wind during session
  max_drag_distance   REAL        -- furthest distance from anchor
  dragged             BOOLEAN     -- did drag alarm trigger?
  bottom_type         TEXT        -- sand, mud, rock, weed, coral
  holding_rating      INTEGER     -- 1-5, user rating
  notes               TEXT
```

### 4.4 Data model paths (unified model)

```
anchor/
  session/           -- current active session (or null)
    status           -- 'active', 'retrieved', 'dragged'
    anchor_position  -- { lat, lng }
    drop_position    -- { lat, lng }
    depth            -- metres at drop
    scope            -- metres deployed
    rode_type        -- chain, chain_rope, rope
    swing_radius     -- metres (current, adjusted for tide)
    distance         -- current distance from anchor (metres)
    bearing          -- bearing from anchor to boat (degrees true)
    alarm_state      -- safe, warning, alarm, critical
    started_at       -- timestamp
  history/           -- array of past sessions
  settings/          -- user preferences (default scope ratio, alarm sounds, etc.)
```

---

## 5. Alert System

### 5.1 Alert levels

| Level | Condition | Response |
|-------|-----------|----------|
| **Safe** | Distance < 90% of swing radius | Green display. No alert. |
| **Warning** | Distance 90-100% of swing radius | Amber display. Single audible tone. No external notification. |
| **Alarm** | Distance > swing radius for 3+ seconds | Red display. Continuous loud alarm. Push notification to all registered devices. |
| **Critical** | Distance > 110% of swing radius, or drag speed > 0.5kt | Red flashing display. Maximum volume alarm. Push + SMS to all registered contacts. Alert forwarded to hub for remote notification. |

### 5.2 Notification channels

| Channel | Latency | Requires | Notes |
|---------|---------|----------|-------|
| **Local audio alarm** | Immediate | Spoke hardware speaker or connected speaker | Must be loud enough to wake crew. User-configurable alarm sound. |
| **Local visual alarm** | Immediate | Spoke display (MFD shell) | Full-screen red flash with distance and bearing to anchor. |
| **Push notification** | 1-5 seconds | Internet connectivity, registered device | Via hub relay. Falls back to SMS if push fails. |
| **SMS** | 5-30 seconds | Mobile network (spoke 4G modem or phone tethering) | Via Twilio or similar. Last resort for critical alerts. |
| **Group/fleet alert** | 5-10 seconds | Internet or local network | Alert other boats in the same group/buddy network. |

### 5.3 Escalation

1. **0 seconds:** Local audio + visual alarm on spoke.
2. **10 seconds (no acknowledgement):** Push notification to all registered devices.
3. **60 seconds (no acknowledgement):** SMS to owner's phone.
4. **120 seconds (no acknowledgement):** Alert forwarded to designated emergency contacts with GPS position.
5. **Continuous:** Alarm repeats every 30 seconds until acknowledged or anchor is retrieved.

### 5.4 Acknowledgement

- Acknowledge button on the MFD display dismisses the alarm temporarily (5-minute snooze).
- If the boat is still outside the radius after snooze, alarm re-triggers.
- Only retrieving the anchor (ending the session) permanently stops monitoring.

---

## 6. UI/UX

### 6.1 Chart overlay

The anchor watch renders as an overlay on the chartplotter:

- **Anchor icon** at the calculated anchor position.
- **Swing circle** — a circle centred on the anchor position with the swing radius. Colour-coded:
  - Green fill (low opacity) when safe.
  - Amber outline at 90% radius (warning zone).
  - Red when alarm is active.
- **Boat position** — the standard boat icon, with a trailing breadcrumb trail showing the path over the last few hours.
- **Drag vector** — if dragging, an arrow showing direction and speed of drag.
- **Nearby hazards** — if chart data is available, highlight any rocks, shallow water, or other vessels within the swing circle + 50m buffer.

### 6.2 Dedicated anchor watch display

A full-screen MFD panel optimised for overnight monitoring from the bunk:

```
+--------------------------------------------------+
|  ANCHOR WATCH                          22:47 UTC  |
|                                                   |
|           [Swing circle visualisation]            |
|           [Boat dot within circle]                |
|           [Wind arrow overlay]                    |
|                                                   |
|  Distance: 23m / 45m          Status: SAFE        |
|  Bearing:  NW (315)           Wind: 12kt SW      |
|  Depth:    4.2m               Tide: +1.3m (rising)|
|                                                   |
|  Scope: 30m chain    Radius: 45m (auto)           |
|                                                   |
|  [Retrieve Anchor]            [Adjust Radius]     |
+--------------------------------------------------+
```

### 6.3 Night mode

- Default dark mode is already the platform standard (deep navy background).
- Anchor watch adds a **red-only mode** option — all UI elements rendered in red/dark red to preserve night vision. No blue, green, or white light.
- Minimum brightness setting that is still readable from 2m (across a cabin).
- Large, high-contrast status indicator (SAFE / DRAGGING) readable without glasses.

### 6.4 Setup flow

1. Tap "Drop Anchor" on the MFD toolbar or anchor watch panel.
2. System shows current GPS position and depth reading.
3. User enters scope deployed (metres or feet, with unit toggle). Default offered based on 5:1 ratio to current depth.
4. User selects rode type (chain / chain+rope / rope). Default from boat profile if set.
5. System calculates and displays swing radius.
6. User accepts or adjusts.
7. Monitoring begins. Chart overlay activates.

### 6.5 Retrieve flow

1. Tap "Retrieve Anchor".
2. Session is ended. Alarm monitoring stops.
3. Session is saved to anchor history.
4. User is prompted to rate holding quality and note bottom type (optional).

---

## 7. Hub vs Spoke

### Spoke (on-boat) — safety-critical, runs locally

All real-time processing happens on the spoke:

- GPS position monitoring (1Hz loop).
- Distance calculation.
- Drag detection algorithm.
- Local alarm (audio + visual).
- Tidal adjustment (using cached tide data).
- Position logging (SQLite).

**This must work with zero internet connectivity.** The spoke never depends on the hub for any safety function.

### Hub (cloud) — remote notification relay

The hub provides remote notification services:

- Receives alert events from spoke (when internet is available).
- Relays push notifications to registered devices.
- Sends SMS alerts via third-party SMS gateway.
- Forwards alerts to emergency contacts.
- Stores anchor history for cross-device access.
- Provides the web-based anchor history view.

**If the hub is unreachable, all local safety functions continue uninterrupted.** Remote notifications simply don't fire until connectivity is restored.

### Sync behaviour

| Data | Direction | Timing |
|------|-----------|--------|
| Anchor session (metadata) | Spoke to Hub | On session end, or next sync |
| Position log (downsampled) | Spoke to Hub | Periodic during session if online, otherwise on next sync |
| Alert events | Spoke to Hub | Immediately if online (high priority in sync queue) |
| Anchor history | Bidirectional | Standard sync cycle |
| Tide data | Hub to Spoke | Pre-cached for current region |

---

## 8. NMEA 2000 Integration

### Required PGNs

| PGN | Name | Used For |
|-----|------|----------|
| 129025 | Position, Rapid Update | Boat GPS position (10Hz) |
| 129026 | COG & SOG, Rapid Update | Course and speed (drag speed calculation) |
| 128267 | Water Depth | Depth at anchor, ongoing depth monitoring |
| 130306 | Wind Data | Wind speed and direction display, catenary adjustment |
| 129033 | Time & Date | Timestamp correlation |

### Optional PGNs

| PGN | Name | Used For |
|-----|------|----------|
| 129029 | GNSS Position Data | Higher-precision position, HDOP for accuracy estimate |
| 130576 | Small Craft Status | Trim, heel — can indicate anchor loading |
| 127250 | Vessel Heading | Heading for anchor position back-calculation |
| 128259 | Speed, Water Referenced | Current estimation (SOG - boat speed through water = current) |

---

## 9. Edge Cases and Failure Modes

| Scenario | Behaviour |
|----------|-----------|
| GPS signal lost | Alert user immediately. Display "GPS LOST" warning. Continue showing last known position. Do not declare drag or safe. |
| Depth sensor lost | Continue monitoring with last known depth. Note on display that depth is stale. |
| Very short scope (<3:1) | Warn user that scope is below recommended minimum. Still monitor. |
| Very shallow water (<2m) | GPS noise dominates at small radii. Increase noise floor. Warn user. |
| Multiple anchors (Bahamian moor, etc.) | Support a second anchor position with a separate radius. Combined constraint: boat must stay within the intersection of both circles. |
| Anchor session still active at next anchorage | Prompt user to end previous session before starting a new one. |
| Spoke loses power | On restart, check for active anchor session. If GPS is now far from anchor position, prompt user to confirm status. |

---

## 10. Future Considerations

- **AIS integration** — show other vessels in the anchorage with their own estimated swing circles (based on AIS position, estimated scope). Highlight collision risk if circles overlap.
- **Bottom type from chart data** — auto-populate expected holding quality from chart seabed classification.
- **Community anchorage reviews** — after retrieving anchor, prompt for review of the anchorage (holding, shelter, facilities). Feed into community anchorage database.
- **Wind forecast overlay** — show predicted wind shifts over the next 12 hours and how they'll affect the boat's position within the swing circle.
- **Anchor load estimation** — from wind speed, boat windage, and current, estimate the load on the anchor and rode. Alert if approaching the anchor's rated holding capacity.
