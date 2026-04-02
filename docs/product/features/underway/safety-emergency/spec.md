# Safety & Emergency — Feature Specification

**Date:** 2026-03-31
**Status:** Draft v1
**Product Vision Reference:** Section 6.17
**License:** GPL

---

## 1. Overview

Safety and emergency systems are the most critical features on any boat. This specification covers six safety domains:

1. **Man Overboard (MOB)** — instant GPS marking, crew alerting, search pattern guidance.
2. **Bilge monitoring** — pump cycle analysis, water ingress detection, dry-running protection.
3. **CO and fire/smoke detection** — NMEA 2000 sensor integration with immediate alerting.
4. **Check-in schedule** — regular timed check-ins with shore contacts, missed check-in escalation.
5. **Pre-departure safety checklist** — automated and customisable checklists before leaving port.
6. **Emergency contacts** — one-tap alert with GPS position to designated people.

Every safety feature runs on the spoke with zero internet dependency. The hub is used only for forwarding alerts to remote contacts when connectivity is available. No safety function ever waits for a network response.

---

## 2. User Stories

### Man Overboard

- As a skipper, I want to mark a MOB position with one tap (or a physical button) so the GPS coordinates are recorded within 1 second of the event.
- As a skipper, I want the system to immediately display the bearing and distance back to the MOB position so I can begin the recovery manoeuvre.
- As a skipper, I want the system to alert all crew devices (phones, tablets, other MFD screens) within seconds so everyone on board knows immediately.
- As a skipper sailing with a buddy boat, I want the MOB alert to reach other boats in my group so they can assist.
- As a skipper, I want search pattern guidance (expanding square, sector search) if the MOB is not immediately recovered, so I can conduct a systematic search.
- As a skipper, I want the system to track elapsed time since the MOB event so I can assess survivability and communicate this to rescue services.

### Bilge monitoring

- As a boat owner, I want to know how often each bilge pump is cycling so I can detect slow water ingress before it becomes dangerous.
- As a boat owner, I want an immediate alert if a bilge pump runs continuously for more than 60 seconds, which likely indicates either a major leak or a dry-running pump (which will burn out).
- As a boat owner away from the boat, I want a push notification if bilge activity is abnormal so I can return to investigate.
- As a boat owner, I want to see bilge pump history over days and weeks so I can spot trends (a pump that used to cycle once a day now cycling five times a day).

### Environmental detection (CO, fire, smoke)

- As a skipper, I want an immediate alarm if the CO sensor detects dangerous carbon monoxide levels so the crew can ventilate and evacuate.
- As a skipper, I want an alarm if fire or smoke is detected in the engine room, galley, or accommodation spaces.
- As a skipper, I want these alarms to be the loudest and most persistent of all alert types — they cannot be silenced without physical acknowledgement.

### Check-in schedule

- As a sailor on a passage, I want to set a check-in schedule (e.g., every 6 hours) so my shore contact knows I'm safe.
- As a shore contact, I want to be notified if a check-in is missed so I can attempt contact and escalate if needed.
- As a solo sailor, I want the system to prompt me to check in so I don't forget.

### Pre-departure checklist

- As a skipper, I want to run through a safety checklist before leaving port so I don't forget critical items.
- As a skipper, I want the checklist to include automated checks (GPS signal, battery SOC, bilge status, weather forecast) alongside manual items (life jackets, fire extinguishers, seacocks).
- As a skipper, I want to customise the checklist for my boat because every boat is different.

### Emergency contacts

- As a skipper in an emergency, I want to send my GPS position to my emergency contacts with one tap.
- As a skipper, I want the emergency alert to include vessel name, position, number of crew, and the nature of the emergency so the recipient has actionable information.

---

## 3. Man Overboard (MOB)

### 3.1 MOB activation

**Trigger methods (any of these):**

| Method | Latency | Notes |
|--------|---------|-------|
| MFD on-screen button | <1 second | Large, always-accessible button on the MFD status bar. Not buried in a menu. |
| Physical hardware button | <1 second | Dedicated USB or Bluetooth button mounted in the cockpit. The system listens for the HID event. |
| NMEA 2000 MOB PGN | <1 second | PGN 127233 (Man Overboard Notification). Triggered by dedicated MOB devices (e.g., MOB1 wristband, DSC VHF). |
| Voice command | 2-5 seconds | "Man overboard!" via microphone, processed by the Watchman agent. Fallback only — not primary. |
| Crew wearable disconnect | <5 seconds | Bluetooth LE beacon worn by crew. If the beacon's RSSI drops below threshold for 10+ seconds (person left the boat), auto-trigger MOB alert. Future capability. |

### 3.2 Immediate actions (automated, within 1 second of trigger)

1. **Record MOB position** — GPS coordinates at the moment of activation (PGN 129025).
2. **Record MOB time** — precise UTC timestamp.
3. **Start elapsed timer** — counting up from MOB event.
4. **Sound alarm** — loud, distinctive MOB alarm tone. Different from anchor drag or bilge alarm.
5. **Display MOB screen** — full-screen takeover of the MFD showing:
   - Bearing and distance to MOB position.
   - Current boat position and heading.
   - Elapsed time.
   - Wind and current data (if available).
6. **Mark chart** — MOB marker placed on the chartplotter at the recorded position.
7. **Alert all local devices** — push WebSocket alert to all connected screens and devices on the boat's local network.
8. **Log event** — write to the logbook immediately.

### 3.3 MOB display

```
+--------------------------------------------------+
|  *** MAN OVERBOARD ***              Elapsed: 3:42 |
|                                                   |
|  [Chart view with MOB marker and boat position]   |
|  [Bearing line from boat to MOB]                  |
|  [Drift estimate arrow from MOB position]         |
|                                                   |
|  Bearing: 145 (SE)    Distance: 0.3 NM           |
|  Wind: 18kt SW        Current: 0.8kt NE (est.)   |
|  Water temp: 16C      Survivability: hours        |
|                                                   |
|  [Cancel MOB]  [Send Mayday]  [Search Pattern]    |
+--------------------------------------------------+
```

### 3.4 Drift estimation

After the MOB position is recorded, the person in the water will drift. The system estimates drift using:

- **Wind** — leeway at approximately 3-4% of wind speed for a person in the water (less with a life jacket, more without).
- **Current** — from the tide prediction engine or estimated from SOG vs speed-through-water.
- **Elapsed time** — drift distance = drift speed * elapsed time.

The estimated drift position is shown as a growing uncertainty circle on the chart, expanding over time. This is an estimate, not a guarantee — the display makes this clear.

### 3.5 Search patterns

If the MOB is not recovered within 5 minutes, the system offers search pattern guidance:

| Pattern | When to use | Description |
|---------|-------------|-------------|
| **Williamson Turn** | Immediate recovery, <2 minutes since MOB | Turn hard to the side the person fell, when 60 degrees off original heading reverse the helm, steady on reciprocal course. The system shows the recommended turn sequence on the chart. |
| **Expanding Square** | MOB position known, drift moderate | Start at the estimated drift position, run legs of increasing length (1, 1, 2, 2, 3, 3...) at 90-degree turns. System draws the pattern on the chart and guides the helmsman. |
| **Sector Search** | MOB position known, limited drift | Triangular pattern centred on the estimated position. Three passes at 120-degree offsets. |
| **Parallel Track** | Large search area, multiple vessels | Parallel lines with track spacing based on visibility. Useful when coordinating with other vessels. |

The system displays the recommended pattern on the chartplotter with course guidance. This is advisory — the skipper commands the search.

### 3.6 External alerting

When internet is available, the system forwards the MOB alert:

1. **Buddy boats** — alert all boats in the same group/fleet with MOB position.
2. **Emergency contacts** — SMS and push notification with GPS position, elapsed time, vessel name, crew count.
3. **Hub relay** — the hub stores the event and can display it on a web dashboard for shore contacts.

**The system does NOT automatically contact coast guard or send a DSC distress call.** That is the skipper's decision, made via the VHF radio. The MOB system provides the information; the skipper decides on the response.

### 3.7 MOB cancellation

- Cancel requires a deliberate action (long-press or confirmation dialog) to prevent accidental dismissal.
- On cancellation, the system prompts: "Person recovered?" — if yes, log the recovery. If false alarm, log as false alarm.
- All alerts (local and remote) are cancelled.

---

## 4. Bilge Monitoring

### 4.1 Data sources

| Source | How | Data |
|--------|-----|------|
| NMEA 2000 digital input | Float switch wired to a digital switching module (CZone, EmpirBus) | Switch state: on/off |
| Current clamp on pump wire | CT clamp on the bilge pump power wire, read via analog input (ESP32/SensESP) | Current draw (amps) — pump running when >0.5A |
| Dedicated bilge sensor | Capacitive water level sensor (e.g., ME SENSE bilge sensor) via BLE | Water presence: wet/dry, level |
| High-water float switch | Secondary float switch mounted higher than the primary | Binary: triggered = high water |

### 4.2 Pump cycle counting

The system counts each activation of the bilge pump:

```
pump_cycle = {
  compartment_id:   TEXT     -- 'forward', 'main', 'engine_room', 'lazarette'
  started_at:       TIMESTAMP
  ended_at:         TIMESTAMP
  duration_seconds:  REAL
  trigger:          TEXT     -- 'float_switch', 'manual', 'scheduled'
}
```

Each pump-on to pump-off transition is one cycle. The system tracks:

- **Cycles per hour** — the primary health metric.
- **Cycle duration** — how long the pump runs each time.
- **Total daily cycles** — trend analysis.
- **Interval between cycles** — decreasing intervals = increasing water ingress.

### 4.3 Alarm thresholds

| Condition | Threshold | Alert Level | Response |
|-----------|-----------|-------------|----------|
| Normal activity | <3 cycles/hour | None | Log only. |
| Elevated activity | 3-10 cycles/hour | Warning | Amber alert on MFD. Push notification. "Bilge pump cycling more than usual in [compartment]." |
| High activity | >10 cycles/hour | Alarm | Red alert. Loud alarm. Push + SMS. "Possible water ingress in [compartment]. Investigate immediately." |
| Continuous running | Pump on >60 seconds | Alarm | Red alert. Could indicate major leak (pump can't keep up) or dry running (no water, pump overheating). |
| Dry running detected | Pump on >60 seconds + no water level change | Critical | "Bilge pump may be dry-running in [compartment]. Risk of pump failure." |
| High-water switch triggered | Secondary float activates | Critical | Maximum alarm. "High water in [compartment]. Primary pump is not keeping up." |
| Pump failure | Water level rising but pump not activating | Critical | "Bilge pump in [compartment] may have failed. Water level rising." |

### 4.4 Frequency analysis

The system maintains a rolling baseline of normal bilge activity per compartment:

- First 7 days of operation: learning mode. Establishes baseline cycles/hour for each compartment.
- After learning: deviations from baseline by >2x trigger a warning. Deviations >5x trigger an alarm.
- Seasonal adjustment: boats in the tropics with deck fittings may have higher rain-related bilge activity. The baseline adapts over weeks.

### 4.5 Bilge monitoring display

```
+--------------------------------------------------+
|  BILGE STATUS                                     |
|                                                   |
|  Forward        [====    ]  0 cycles/hr    OK     |
|  Main salon     [====    ]  1 cycle/hr     OK     |
|  Engine room    [========]  4 cycles/hr    WARN   |
|  Lazarette      [====    ]  0 cycles/hr    OK     |
|                                                   |
|  Engine room: 4 cycles in the last hour           |
|  Baseline: 1 cycle/hr   Trend: increasing         |
|                                                   |
|  Last 24 hours:                                   |
|  [bar chart of cycles per hour, per compartment]  |
|                                                   |
|  Last 7 days:                                     |
|  [trend line of daily cycle count]                |
+--------------------------------------------------+
```

---

## 5. CO Detection

### 5.1 Sensor integration

Carbon monoxide detectors connected to the NMEA 2000 network transmit concentration levels. Relevant PGNs:

| PGN | Name | Data |
|-----|------|------|
| 130312 | Temperature | Source type can be used for environmental sensors |
| 126720 | Proprietary | Manufacturer-specific CO data (varies by manufacturer) |

Many marine CO detectors are standalone with their own alarms. The Above Deck integration provides:

- **Centralised alerting** — the MFD shows the CO alarm alongside other safety alerts, ensuring the crew sees it even if they're not near the standalone detector.
- **Remote notification** — CO alarm forwarded to push/SMS for boat owners ashore.
- **Logging** — CO events logged with timestamp, concentration level, and duration.

### 5.2 CO alarm levels

| Level | CO Concentration | Response |
|-------|-----------------|----------|
| Normal | <10 ppm | Green status. |
| Elevated | 10-35 ppm | Amber warning. "Elevated CO detected. Ventilate cabin." |
| Danger | 35-100 ppm | Red alarm. Loud alarm. "Dangerous CO level. Open hatches. Move to cockpit." |
| Life-threatening | >100 ppm | Critical alarm. Cannot be silenced from MFD — requires physical acknowledgement or CO level dropping below threshold. |

These thresholds align with UL 2034 / EN 50291 standards for residential CO detectors.

### 5.3 Integration with gas appliances

Boats with LPG or CNG cooking gas should have solenoid shut-off valves. If the boat has a gas solenoid connected to the digital switching system:

- On CO detection at "Danger" level or above, the system can automatically shut off the gas solenoid (if the user has opted in to write-access for that circuit).
- This is an opt-in safety automation, not a default. The system must have explicit permission to actuate any physical system.

---

## 6. Fire and Smoke Detection

### 6.1 Sensor integration

Marine fire/smoke detectors connect via:

- **NMEA 2000** — some commercial detectors (Fireboy-Xintea, Fireangel Marine) offer NMEA 2000 or CAN bus output.
- **Digital switching inputs** — detector relay output wired to a CZone or EmpirBus digital input channel.
- **BLE sensors** — wireless smoke detectors (emerging category).
- **Analog temperature** — engine room temperature sensors. A rapid temperature rise (>10 degrees C in 5 minutes) without engine running is a fire indicator.

### 6.2 Fire alarm behaviour

Fire alarms are the highest priority alert in the system:

1. **Immediate full-screen alarm** — overrides all other displays.
2. **Loudest alarm tone** — distinct from MOB and bilge alarms.
3. **Location displayed** — "FIRE DETECTED: Engine Room" (from sensor zone mapping).
4. **Cannot be remotely silenced** — requires physical button press on the spoke hardware or clearing the alarm at the detector.
5. **All channels activated** — local alarm, push, SMS, emergency contacts, all simultaneously. No staged escalation — fire is always critical.
6. **Engine room fire suppression** — if the boat has an automated fire suppression system (Fireboy, Sea-Fire) connected to the digital switching system, display its status (armed/discharged). The system does NOT trigger fire suppression automatically — that is the suppression system's own decision based on its temperature sensor.

---

## 7. Check-in Schedule

### 7.1 Configuration

The skipper sets up a check-in schedule before departure:

```
checkin_schedule
  id                  UUID
  boat_id             UUID
  interval_hours      INTEGER     -- e.g., 6, 12, 24
  start_time          TIMESTAMP   -- first check-in due
  shore_contacts      JSONB       -- array of { name, phone, email }
  passage_description TEXT        -- "Crossing Bay of Biscay, 4 crew"
  active              BOOLEAN
  created_at          TIMESTAMP
```

### 7.2 Check-in flow

1. At the scheduled time, the spoke displays a check-in prompt on the MFD.
2. The prompt includes a simple "Check In" button plus a status selector: "All well" / "Minor issue" / "Need assistance".
3. If internet is available, the check-in is forwarded to the hub, which notifies shore contacts with: vessel name, position, time, status, and a link to a live tracking page.
4. If no internet, the check-in is queued and sent when connectivity returns.

### 7.3 Missed check-in escalation

| Time since missed | Action |
|-------------------|--------|
| Check-in due | Prompt on MFD with audible reminder. |
| +15 minutes | Second prompt, louder. |
| +30 minutes | Marked as missed. If internet available, shore contacts notified: "Check-in missed. Last known position: [lat/lng] at [time]." |
| +60 minutes | SMS to shore contacts with position. |
| +2 hours | Emergency contacts notified. |

Shore contacts receive a web link showing the boat's last known position on a map, with a timeline of check-ins.

### 7.4 Solo sailor mode

For solo sailors, the check-in system doubles as a wellness check:

- More frequent check-in intervals (every 2-4 hours during daylight).
- If a check-in is missed and no GPS movement is detected (boat stationary, suggesting the sailor is incapacitated), escalation is faster.
- The system can require a simple interaction (tap a button, answer a question) to confirm alertness.

---

## 8. Pre-departure Safety Checklist

### 8.1 Automated checks

The system automatically verifies these before departure:

| Check | Source | Pass Condition |
|-------|--------|----------------|
| GPS signal | NMEA 2000 PGN 129029 | Valid fix, HDOP < 5 |
| Battery SOC | Victron / NMEA 2000 PGN 127506 | >50% (configurable) |
| Fuel level | NMEA 2000 PGN 127505 | >25% (configurable) |
| Bilge status | Bilge monitoring system | No active alarms, pump not cycling |
| Weather forecast | Cached weather data | No severe weather warnings for planned route |
| Engine status | NMEA 2000 PGN 127489 | No active engine alarms |
| Navigation lights | Digital switching status | Functional (if testable) |
| AIS transponder | AIS system status | Transmitting |
| Depth sounder | NMEA 2000 PGN 128267 | Receiving valid readings |
| CO detector | CO sensor status | Normal reading, sensor online |

### 8.2 Manual checks

User-configurable items that require human verification:

**Default list (editable):**

- Life jackets accessible and inspected
- Safety harnesses and jacklines rigged
- Fire extinguishers checked (pressure gauge green)
- Flares in date
- First aid kit complete
- EPIRB armed and registered
- VHF radio tested (with coast guard if appropriate)
- Seacocks — appropriate valves open/closed
- Loose items stowed
- Passage plan filed with shore contact
- Crew briefed (safety procedures, MOB drill, fire response)
- Gas shut off (if not cooking)

### 8.3 Checklist UI

```
+--------------------------------------------------+
|  PRE-DEPARTURE CHECKLIST                          |
|                                                   |
|  Automated                                        |
|  [x] GPS signal              PASS                 |
|  [x] Battery SOC: 87%        PASS (>50%)          |
|  [x] Fuel: 78%               PASS (>25%)          |
|  [ ] Bilge: pump cycling     WARN — investigate   |
|  [x] Weather: fair           PASS                 |
|  [x] AIS transmitting        PASS                 |
|                                                   |
|  Manual                                           |
|  [ ] Life jackets accessible                      |
|  [ ] Fire extinguishers checked                   |
|  [ ] Seacocks configured                          |
|  [ ] Passage plan filed                           |
|  ...                                              |
|                                                   |
|  [Skip]                    [All Clear — Depart]   |
+--------------------------------------------------+
```

The checklist can be skipped — it is advisory, not a gate. Sailors know their own boats.

---

## 9. Emergency Contacts

### 9.1 Configuration

```
emergency_contacts
  id                  UUID
  boat_id             UUID
  name                TEXT
  relationship        TEXT        -- 'shore contact', 'family', 'marina', 'coast guard'
  phone               TEXT        -- for SMS
  email               TEXT        -- for email alerts
  notify_on           JSONB       -- array of event types: ['mob', 'drag', 'bilge_critical', 'fire', 'co', 'missed_checkin', 'manual']
  priority            INTEGER     -- escalation order
  created_at          TIMESTAMP
```

### 9.2 One-tap emergency alert

A dedicated emergency button on the MFD (always visible, never more than one tap away):

1. Tap the emergency button.
2. Select emergency type: MOB / Fire / Flooding / Medical / Grounding / Collision / Other.
3. Confirm send (to prevent accidental activation).
4. System sends to all emergency contacts:
   - Vessel name and registration.
   - GPS position (lat/lng, plus nearest landmark if chart data available).
   - Time of alert.
   - Emergency type.
   - Number of crew on board (from passage plan or boat profile).
   - Current weather conditions (wind, sea state if available).

### 9.3 Emergency message format

```
EMERGENCY ALERT
Vessel: [boat name] ([registration])
Position: [lat] [lng] ([nearest landmark])
Time: [UTC timestamp]
Emergency: [type]
Crew: [number] on board
Wind: [speed] [direction]
Contact: [skipper phone if set]

This is an automated alert from the Above Deck safety system.
```

The message is sent via SMS and email simultaneously.

---

## 10. Alert Escalation (All Safety Systems)

### 10.1 Priority hierarchy

All safety alerts share a common escalation framework, with priority determining urgency:

| Priority | Events | Escalation Speed |
|----------|--------|-----------------|
| **P1 — Life-threatening** | MOB, fire, CO (life-threatening), high water | Immediate — all channels simultaneously. |
| **P2 — Critical** | Anchor drag (critical), bilge (continuous run), CO (danger) | 0s local, 10s push, 60s SMS, 120s contacts. |
| **P3 — Alarm** | Anchor drag (alarm), bilge (high activity), missed check-in | 0s local, 30s push, 5min SMS. |
| **P4 — Warning** | Anchor warning, bilge elevated, CO elevated | Local display only. No external notification. |

### 10.2 Channel details

| Channel | Implementation | Spoke Dependency | Hub Dependency |
|---------|---------------|-----------------|----------------|
| **Local audio** | Spoke hardware speaker, configurable volume per alert type | Spoke only | None |
| **Local visual** | MFD display — full-screen takeover for P1, banner for P2-P4 | Spoke only | None |
| **Push notification** | WebSocket to connected local devices + hub relay to mobile push (FCM/APNs) | Spoke generates | Hub relays |
| **SMS** | Via hub API to SMS gateway (Twilio or equivalent open-source self-hosted alternative) | Spoke sends to hub | Hub sends SMS |
| **Email** | Via hub API to email service | Spoke sends to hub | Hub sends email |
| **Group/fleet** | Hub relays to other boats in the same group | Spoke sends to hub | Hub relays |

### 10.3 Alert acknowledgement

- **P4 (warning):** Auto-clears when condition resolves. Can be dismissed with a single tap.
- **P3 (alarm):** Requires acknowledgement tap. Snooze available (5 minutes). Re-triggers if condition persists.
- **P2 (critical):** Requires acknowledgement. No snooze. Continues until condition resolves or explicitly cancelled.
- **P1 (life-threatening):** Cannot be silenced from software alone for MOB and fire. Requires either condition resolution (person recovered, fire extinguished) or explicit cancellation with confirmation dialog.

---

## 11. Hub vs Spoke

### Spoke (on-boat) — all detection and local alerting

Everything safety-critical runs on the spoke:

- MOB position recording and display.
- Bilge pump cycle counting, frequency analysis, alarm evaluation.
- CO sensor reading and alarm triggering.
- Fire/smoke sensor reading and alarm triggering.
- Check-in prompt display and timer.
- Pre-departure checklist (automated checks and manual UI).
- Emergency alert composition.
- Local audio and visual alarms.
- All data logging (SQLite).

**None of these functions require internet or the hub.** A boat at sea with no connectivity has full safety system coverage.

### Hub (cloud) — remote notification and coordination

The hub provides services that require internet:

- Push notification relay (FCM/APNs).
- SMS gateway access.
- Email delivery.
- Group/fleet alert distribution.
- Shore contact notification for check-in system.
- Web-based tracking page for shore contacts.
- Historical safety event storage for cross-device access.

### Sync behaviour

| Data | Direction | Priority |
|------|-----------|----------|
| MOB event | Spoke to Hub | Highest — sent immediately if online |
| Fire/CO alert | Spoke to Hub | Highest |
| Bilge critical alert | Spoke to Hub | High |
| Anchor drag alert | Spoke to Hub | High |
| Missed check-in | Spoke to Hub | High |
| Manual emergency alert | Spoke to Hub | Highest |
| Bilge history (routine) | Spoke to Hub | Normal — syncs on next connection |
| Checklist completions | Spoke to Hub | Low — syncs on next connection |
| Emergency contact config | Bidirectional | Normal |
| Check-in schedule config | Bidirectional | Normal |

---

## 12. NMEA 2000 Integration

### Required PGNs

| PGN | Name | Used For |
|-----|------|----------|
| 129025 | Position, Rapid Update | MOB position, emergency alert position |
| 127501 | Binary Switch Status | Bilge pump activation detection |
| 128267 | Water Depth | Pre-departure check |
| 127506 | DC Detailed Status | Battery SOC for pre-departure check |
| 127505 | Fluid Level | Fuel level for pre-departure check |

### Optional PGNs

| PGN | Name | Used For |
|-----|------|----------|
| 127233 | Man Overboard Notification | MOB trigger from dedicated hardware |
| 130312 | Temperature | Engine room fire detection (rapid rise) |
| 127489 | Engine Parameters, Dynamic | Engine status for pre-departure check |
| 130306 | Wind Data | MOB drift estimation, emergency report |
| 129026 | COG & SOG, Rapid Update | MOB drift calculation |
| 129029 | GNSS Position Data | High-precision position for MOB |
| 126720 | Proprietary | CO detector data (manufacturer-specific) |

---

## 13. Data Model

### 13.1 MOB events

```
mob_events
  id                  UUID
  boat_id             UUID
  mob_lat             REAL
  mob_lng             REAL
  mob_time            TIMESTAMP
  boat_lat_at_event   REAL
  boat_lng_at_event   REAL
  wind_speed          REAL        -- knots, at time of event
  wind_direction      REAL        -- degrees true
  water_temp          REAL        -- celsius, for survivability estimate
  crew_count          INTEGER
  status              TEXT        -- 'active', 'recovered', 'false_alarm', 'escalated'
  recovered_at        TIMESTAMP   -- null until resolved
  notes               TEXT
```

### 13.2 Bilge pump cycles

```
bilge_cycles
  id                  UUID
  boat_id             UUID
  compartment         TEXT        -- 'forward', 'main', 'engine_room', 'lazarette'
  started_at          TIMESTAMP
  ended_at            TIMESTAMP
  duration_seconds    REAL
  trigger             TEXT        -- 'float_switch', 'manual', 'high_water'
```

### 13.3 Bilge baselines

```
bilge_baselines
  boat_id             UUID
  compartment         TEXT
  avg_cycles_per_hour REAL
  stddev              REAL
  sample_days         INTEGER
  updated_at          TIMESTAMP
```

### 13.4 Safety alerts

```
safety_alerts
  id                  UUID
  boat_id             UUID
  alert_type          TEXT        -- 'mob', 'fire', 'co', 'bilge', 'checkin_missed', 'manual_emergency'
  priority            TEXT        -- 'p1', 'p2', 'p3', 'p4'
  message             TEXT
  lat                 REAL
  lng                 REAL
  triggered_at        TIMESTAMP
  acknowledged_at     TIMESTAMP   -- null if not yet acknowledged
  resolved_at         TIMESTAMP   -- null if still active
  notifications_sent  JSONB       -- record of channels used and timestamps
```

### 13.5 Check-in log

```
checkin_log
  id                  UUID
  schedule_id         UUID
  due_at              TIMESTAMP
  checked_in_at       TIMESTAMP   -- null if missed
  status              TEXT        -- 'ok', 'minor_issue', 'need_assistance', 'missed'
  lat                 REAL
  lng                 REAL
  forwarded_to_hub    BOOLEAN
```

### 13.6 Data model paths (unified model)

```
safety/
  mob/
    active           -- current MOB event (or null)
    history          -- array of past events
  bilge/
    compartments/    -- per-compartment status
      [id]/
        pump_state   -- on/off
        cycles_hour  -- current rate
        baseline     -- learned normal rate
        alarm_state  -- safe, warning, alarm, critical
        last_cycle   -- timestamp
    history          -- time-series of cycle counts
  co/
    level_ppm        -- current reading
    alarm_state      -- normal, elevated, danger, life_threatening
    sensor_status    -- online, offline, fault
  fire/
    zones/           -- per-zone detector status
      [id]/
        status       -- normal, alarm
        temperature  -- if temperature-based detection
    alarm_state      -- normal, alarm
  checkin/
    schedule         -- current active schedule
    next_due         -- timestamp of next check-in
    last_checkin     -- timestamp and status
    missed_count     -- consecutive missed check-ins
  emergency/
    contacts         -- configured contacts
    last_alert       -- most recent emergency alert
  checklist/
    last_completed   -- timestamp
    items            -- current checklist state
```

---

## 14. Edge Cases and Failure Modes

| Scenario | Behaviour |
|----------|-----------|
| GPS lost during MOB | Record last known GPS position. Display "GPS LOST — position approximate" warning. Do not discard the MOB event. |
| Bilge sensor disconnected | Display "Bilge sensor offline in [compartment]". Do not generate false "all clear" — the absence of data is not safety. |
| CO sensor offline | Display "CO detector offline". This is itself a warning — a non-functional CO detector is a safety hazard. |
| Multiple simultaneous alarms (e.g., fire + bilge) | Display highest priority first (P1 > P2). Stack secondary alerts below. All audio alarms play simultaneously. |
| Check-in due but no internet | Display check-in prompt on MFD. Queue the check-in for when internet returns. Shore contacts are not notified until connectivity — this is a known limitation. |
| Spoke loses power during MOB | On restart, restore MOB event from SQLite. Display immediately. Timer continues from original event time. |
| False bilge alarm during heavy rain | Rain can cause bilge pumps to cycle more frequently (deck drains). The baseline learning should adapt, but initially this may generate false warnings. User can acknowledge and adjust thresholds. |
| Emergency button pressed accidentally | Confirmation dialog prevents accidental sends. If sent, a cancellation can be sent to contacts. |

---

## 15. Future Considerations

- **AIS DSC integration** — when the skipper sends a DSC distress call on VHF, automatically populate the position from the safety system's GPS, ensuring the DSC position is current (some VHF radios use their own GPS which may be less accurate or stale).
- **Crew tracking** — BLE beacons worn by each crew member. The system knows who is on board, who is in the cockpit, who is below. MOB detection becomes automatic ("Crew member Jane is no longer detected on board").
- **Automated EPIRB monitoring** — if the EPIRB has a digital interface, monitor its armed/battery status.
- **Integration with rescue services** — structured data export compatible with SAROPS (Search and Rescue Optimal Planning System) used by coast guards.
- **Engine room camera** — on fire alarm, automatically switch the MFD to the engine room camera feed so the crew can assess the situation before opening the engine room (opening it feeds oxygen to the fire).
- **Medical emergency guidance** — the AI crew (specifically the Bosun agent) could provide first-aid guidance based on the nature of the medical emergency, drawing from a RAG database of marine first-aid procedures.
