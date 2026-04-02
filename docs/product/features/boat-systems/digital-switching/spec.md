# Digital Switching & Home Automation (6.13)

**Date:** 2026-03-31
**Status:** Draft v1
**References:** Product Vision v2 (6.13), Technical Architecture (switching/ data model, protocol adapters), Boat Systems Monitoring research, Smart Home & PWA Integration research, CAN Bus Technology research

---

## 1. Overview

A cruising boat is a home. It has lighting zones, climate control, a water system, appliances, and a dozen circuits that the crew switches on and off every day. The difference between a boat and a house is that every watt matters, safety is non-negotiable, and the crew might be 500 miles from the nearest electrician.

Digital switching replaces the traditional breaker panel with software-controlled circuits. Above Deck treats this as home automation done right for a marine environment: unified control of every circuit on the boat, intelligent automation rules, integration with off-the-shelf smart home devices, voice control through the AI crew, and remote access from anywhere.

The system integrates with existing marine digital switching hardware (CZone, EmpirBus, Mastervolt) via NMEA 2000, supports DIY builds via ESP32, and bridges to the consumer smart home world via Matter/Thread. It does not replace existing hardware -- it unifies control into a single interface and adds intelligence on top.

### Design principles

- **Observe first, control second.** The system defaults to read-only. Write access to any circuit is an explicit per-device opt-in after the user has verified safe operation. This is the platform-wide "do no harm" principle applied to switching.
- **Works without digital switching hardware.** Boats without CZone or EmpirBus can still use the switching UI for manual state tracking, Matter smart plugs, and ESP32 DIY circuits. The feature degrades gracefully.
- **Local-first, real-time.** Switching commands execute on the spoke (on-board hardware). They never route through the cloud for primary operation. Latency must be under 100ms from tap to circuit state change.
- **Safety-critical circuits are protected.** Navigation lights, bilge pumps, and VHF power cannot be turned off by automation rules or remote commands without explicit override.

---

## 2. User Stories

### Circuit control

- As a sailor, I want to turn cabin lights on and off from the MFD screen so I do not need to walk to the breaker panel.
- As a sailor, I want to dim the salon lights to 20% for night passages so my night vision is preserved.
- As a sailor, I want to see the current draw of each circuit so I know what is consuming power.
- As a sailor, I want to be alerted when a circuit faults (overcurrent, short, ground fault) so I can respond immediately.

### Scenes

- As a sailor, I want to activate a "night passage" scene that dims interior lights, enables navigation lights, and turns off non-essential loads -- with one tap.
- As a sailor, I want to activate an "at anchor" scene that turns on the anchor light, enables deck courtesy lights, and sets the HVAC to evening mode.
- As a sailor, I want to create custom scenes for my boat's specific setup.

### Automation

- As a sailor, I want the anchor light to turn on automatically at sunset and off at sunrise based on my GPS position.
- As a sailor, I want the bilge pump to run automatically when the bilge float switch activates, and I want to be alerted every time it does.
- As a sailor, I want the HVAC to pre-cool the cabin 30 minutes before my scheduled arrival at the marina.
- As a sailor, I want the boat to switch to an "away" profile when I leave the dock (geofence), turning off non-essential loads and enabling security monitoring.

### Remote control

- As a sailor, I want to check which circuits are on from my phone when I am away from the boat.
- As a sailor, I want to turn on the watermaker remotely so the tanks are full when I return.
- As a sailor, I want to start the air conditioning from shore so the boat is cool when I board.

### Voice control

- As a sailor, I want to say "Engineer, turn off the watermaker" and have the AI agent execute the command.
- As a sailor, I want to say "Hey Siri, turn on the salon lights" via the Matter bridge and have it work like any smart home device.

### DIY

- As a technically-inclined sailor, I want to add ESP32 relay boards to control circuits that are not on my NMEA 2000 bus.
- As a builder, I want to wire current sensors to an ESP32 and have per-circuit power monitoring without buying a CZone system.

---

## 3. Data Model

All switching data lives under the `switching/` path in the unified data model. This extends the paths defined in the technical architecture.

### switching/circuits/{circuit_id}

Each physical or logical circuit is a node in the data model.

```
switching/
  circuits/
    {circuit_id}/
      state             — bool (on/off) or float64 (0.0-1.0 for dimmable)
      current           — float64 (amps, real-time draw)
      voltage           — float64 (volts at the circuit)
      power             — float64 (watts, computed from current * voltage)
      fault             — enum (none, overcurrent, short, ground_fault, overtemp, open_circuit)
      fault_message     — string (human-readable fault description)
      type              — enum (lighting, pump, motor, appliance, navigation, entertainment, hvac, general)
      subtype           — string (e.g. "cabin", "anchor", "bilge", "watermaker", "windlass")
      dimmable          — bool
      locked            — bool (true = cannot be controlled by automation or remote, manual override only)
      safety_critical   — bool (true = protected from automation off, requires explicit override)
      source            — enum (nmea2000, matter, esp32, manual, signalk)
      nmea_instance     — uint8 (NMEA 2000 switch bank instance, if applicable)
      nmea_channel      — uint8 (channel within the switch bank, if applicable)
      location          — string (e.g. "salon", "port_hull", "cockpit", "engine_room")
      label             — string (user-defined name, e.g. "Salon overhead")
      last_command_by   — string (who/what last changed state: "user", "scene:night_passage", "rule:sunset_anchor_light", "agent:engineer", "remote:app")
      last_changed      — timestamp
      energy_today      — float64 (watt-hours consumed today, rolling 24h)
```

### switching/banks/{bank_id}

Groups circuits by physical hardware module (maps to NMEA 2000 switch bank instances).

```
switching/
  banks/
    {bank_id}/
      label             — string (e.g. "CZone Module 1 - Salon")
      source            — enum (czone, empirbus, mastervolt, esp32, matter)
      nmea_instance     — uint8 (PGN 127501/127502 instance number)
      channel_count     — uint8 (number of channels on this bank)
      circuits          — []circuit_id (references to circuits managed by this bank)
      online            — bool (is the module communicating)
      last_seen         — timestamp
      firmware_version  — string
```

### switching/scenes/{scene_id}

A scene is a named collection of circuit states that can be activated as a group.

```
switching/
  scenes/
    {scene_id}/
      label             — string (e.g. "Night Passage")
      description       — string
      icon              — string (Tabler icon name)
      active            — bool
      circuit_states    — map[circuit_id]target_state
                          where target_state is:
                            { state: bool | float64, transition_ms: uint32 }
      safety_override   — bool (if true, scene can control safety_critical circuits)
      created_by        — string (user_id or "system")
      last_activated    — timestamp
```

**Built-in scenes** (shipped as defaults, user can modify):

| Scene | Description |
|-------|-------------|
| Night Passage | Nav lights on, interior lights dimmed to 10% red, non-essential loads off, instruments dimmed |
| At Anchor | Anchor light on, courtesy lights on, nav lights off, interior at 50% |
| Docked | Shore power loads enabled, security lights on, HVAC in comfort mode |
| Movie Night | Salon lights off, courtesy lights dim 5%, entertainment system on |
| Away | All non-essential loads off, bilge monitoring active, security enabled |
| Storm | All exterior lights on, hatches alert active, bilge monitoring heightened |

### switching/rules/{rule_id}

Automation rules define conditions and actions for circuit control.

```
switching/
  rules/
    {rule_id}/
      label             — string
      enabled           — bool
      trigger           — object:
        type            — enum (schedule, sensor, geofence, circuit_event, system_event)
        schedule        — cron expression (if type=schedule)
        sensor_path     — string (data model path to watch, if type=sensor)
        sensor_op       — enum (gt, lt, eq, neq, change)
        sensor_value    — any (threshold value)
        geofence_id     — string (if type=geofence)
        geofence_event  — enum (enter, exit)
        circuit_id      — string (if type=circuit_event)
        circuit_event   — enum (fault, on, off, overcurrent)
        system_event    — enum (sunrise, sunset, shore_power_connected, shore_power_disconnected, anchor_set, anchor_weighed)
      conditions        — []object (additional conditions, all must be true):
        path            — string (data model path)
        op              — enum (gt, lt, eq, neq)
        value           — any
      actions           — []object:
        type            — enum (set_circuit, activate_scene, send_alert, run_command)
        circuit_id      — string (if type=set_circuit)
        target_state    — bool | float64 (if type=set_circuit)
        scene_id        — string (if type=activate_scene)
        alert_message   — string (if type=send_alert)
        alert_severity  — enum (info, warning, critical)
        command          — string (if type=run_command)
      cooldown_seconds  — uint32 (minimum interval between rule firings)
      last_fired        — timestamp
      fire_count        — uint64
```

### switching/geofences/{geofence_id}

```
switching/
  geofences/
    {geofence_id}/
      label             — string (e.g. "Home marina", "Anchor zone")
      center_lat        — float64
      center_lng        — float64
      radius_m          — float64
      inside            — bool (current state)
      last_transition   — timestamp
```

---

## 4. Supported Hardware

### 4.1 CZone (Mastervolt / BEP / Navico)

The most widely installed marine digital switching system. CZone modules sit on the NMEA 2000 backbone and control individual circuits via solid-state outputs.

**Integration path:** NMEA 2000 PGN 127501 (Binary Switch Status) and PGN 127502 (Switch Control). The Above Deck Go server reads PGN 127501 for circuit state and sends PGN 127502 to command circuits. CZone also uses PGN 126720 (proprietary) for extended features (dimming curves, fault reporting, configuration).

| PGN | Direction | Purpose |
|-----|-----------|---------|
| 127501 | Read | Switch bank status -- on/off state per channel, updated on change |
| 127502 | Write | Command a switch bank channel on/off/dim |
| 126720 | Read/Write | CZone proprietary -- dimming, fault codes, module config |

**Hardware required:** CZone output modules (COI, MOI), connected to NMEA 2000 backbone, accessible via a bidirectional gateway (Yacht Devices YDNU-02, Actisense NGT-1, or iKonvert USB).

**Limitations:** CZone configuration (circuit assignments, dimming curves, interlock groups) is done via the CZone Configuration Tool (Windows) or MFD import. Above Deck reads and controls the resulting circuits but does not replicate the configuration tool.

### 4.2 EmpirBus NXT

Originally Swedish, now Garmin-owned. Distributed NMEA 2000 modules similar to CZone. Individual IPX6 waterproof modules for lighting, pumps, windlass, climate, generators.

**Integration path:** Same PGN 127501/127502 for standard on/off. EmpirBus uses PGN 126720 (proprietary, manufacturer code for EmpirBus) for extended features. Configuration is done via EmpirBus NXT Configuration Tool or Raymarine Axiom MFD.

**Hardware compatibility:** Same NMEA 2000 gateway requirements as CZone. Bidirectional gateway required for write operations.

### 4.3 Mastervolt CZone

Mastervolt is the parent company of CZone. Some Mastervolt-branded products use CZone protocol directly, others use Mastervolt's own MasterBus protocol. MasterBus is a CAN-based protocol but not NMEA 2000 -- it requires a MasterBus-to-NMEA 2000 interface (Mastervolt MasterBus USB Interface) for Above Deck integration.

**Integration path:** For CZone-protocol Mastervolt products, same as section 4.1. For MasterBus-native products, integration via the MasterBus-NMEA 2000 gateway, which translates MasterBus device state into standard NMEA 2000 PGNs.

### 4.4 ESP32 DIY Path

For boats without commercial digital switching, or for circuits not on the NMEA 2000 bus. ESP32 microcontrollers with relay boards and current sensors provide per-circuit switching and monitoring at a fraction of the cost.

**Reference hardware:**

| Component | Purpose | Approximate Cost |
|-----------|---------|-----------------|
| ESP32-S3 DevKit | Controller | $10 |
| 4/8-channel relay module (5V, optoisolated) | Circuit switching | $5-10 |
| ACS712 / INA219 current sensor (per circuit) | Current monitoring | $3-5 each |
| Hat Labs Sailor Hat ESP32 | Marine-grade dev board with CAN transceiver | $60 |
| 12V-5V buck converter | Power supply | $3 |

**Integration path:** ESP32 runs firmware (SensESP or custom) that connects to the Above Deck Go server via WiFi. Two options:

1. **MQTT** -- ESP32 publishes circuit state to MQTT topics, Go server subscribes. Commands sent via MQTT publish from the server.
2. **HTTP/WebSocket** -- ESP32 connects directly to the Go server's WebSocket endpoint, sending state updates and receiving commands.
3. **NMEA 2000 native** -- ESP32 with CAN transceiver (e.g., SN65HVD230) speaks PGN 127501/127502 directly on the NMEA 2000 bus. The Go server reads/writes via the same gateway used for CZone. This is the cleanest integration but requires CAN bus wiring to the ESP32.

**Firmware reference:** Above Deck will publish reference ESP32 firmware (C++/Arduino or ESP-IDF) for common relay/sensor configurations. Community contributions encouraged.

### 4.5 Matter/Thread Devices

Off-the-shelf smart home devices (smart plugs, smart switches, smart bulbs, contact sensors, temperature sensors) integrated via the Matter protocol. See section 9 for full detail.

---

## 5. Lighting

Lighting is the most frequently controlled system on a boat. The switching interface must make common operations instant.

### 5.1 Circuit categories

| Category | Examples | Control | Notes |
|----------|----------|---------|-------|
| Cabin interior | Salon overhead, cabin reading, galley, heads | On/off, dimming | Most commonly controlled |
| Navigation | Port (red), starboard (green), stern (white), masthead (white), steaming | On/off | COLREGS-required, safety_critical=true |
| Anchor | All-round white | On/off | Auto-on at sunset when at anchor |
| Courtesy | Cockpit, companionway, transom step, sugar scoop | On/off, dimming | Low-level deck lighting |
| Spreader/deck | Spreader lights, foredeck work light | On/off | High-intensity, for deck work |
| Underwater | Underwater transom lights | On/off, colour, intensity | RGB or single-colour LED |
| Instrument | Chartplotter backlight, panel backlight | Dimming | Coordinated with night mode |

### 5.2 Lighting scenes

Scenes apply a set of lighting states simultaneously. Transition times create smooth fades rather than abrupt switching.

| Scene | Lighting behaviour | Typical transition |
|-------|-------------------|-------------------|
| Night Passage | Nav lights on, cabin lights 10% red/amber, instrument backlights 20% | 2000ms fade |
| At Anchor | Anchor light on, nav lights off, cabin 50%, courtesy lights on | 1000ms fade |
| Docked | All interior at 100%, courtesy on, nav lights off | 500ms |
| Movie Night | Salon off, adjacent cabins 5%, courtesy off | 3000ms fade |
| Sunrise | All lights off, anchor light off (triggered by sunrise rule) | 5000ms fade |
| All Off | Everything off except safety_critical circuits | Immediate |

### 5.3 Navigation light interlock

Navigation lights are safety_critical. The system enforces:

- Navigation lights cannot be turned off by a scene unless `safety_override=true` on that scene.
- Automation rules cannot turn off navigation lights unless the boat is confirmed at anchor or docked (based on GPS and anchor state).
- If navigation lights are turned off while underway, a warning alert is raised immediately.
- The UI shows navigation light status prominently, with a distinct visual indicator separate from cabin lighting.

---

## 6. HVAC

HVAC on a boat typically means marine air conditioning (reverse-cycle heat pump drawing seawater for heat exchange), diesel heaters (Webasto, Eberspacher), or electric heaters on shore power.

### 6.1 Data model

```
hvac/
  zones/
    {zone_id}/
      label             — string (e.g. "Salon", "Port cabin", "Stbd cabin")
      target_temp       — float64 (degrees C)
      actual_temp       — float64 (degrees C, from sensor)
      humidity          — float64 (%, from sensor)
      mode              — enum (off, cool, heat, auto, fan_only, dehumidify)
      fan_speed         — enum (auto, low, medium, high)
      source            — enum (ac_seawater, diesel_heater, electric, heat_pump)
      power_draw        — float64 (watts)
      compressor_state  — enum (off, running, defrost)
      seawater_pump     — bool (on/off, for marine AC)
      last_changed      — timestamp
  schedule/
    {schedule_id}/
      zone_id           — string
      days              — []enum (mon, tue, wed, thu, fri, sat, sun)
      time_on           — string (HH:MM, local time)
      time_off          — string (HH:MM, local time)
      target_temp       — float64
      mode              — enum
```

### 6.2 Integration paths

| HVAC system | Protocol | Integration |
|-------------|----------|-------------|
| Dometic Marine AC | NMEA 2000 (PGN 130316 temp, proprietary PGNs for control) | Via NMEA 2000 gateway, bidirectional |
| Webasto diesel heater | Proprietary serial or CAN | ESP32 bridge to WiFi/MQTT, then to Go server |
| Eberspacher | Proprietary serial | Same ESP32 bridge approach |
| Shore power electric heater | Relay control | Via CZone circuit or ESP32 relay |
| Matter-compatible thermostat | Matter | Direct integration via Matter controller |

### 6.3 Energy-aware operation

HVAC is the largest consumer on most boats. The switching system coordinates with the energy planner:

- If battery SOC drops below a configurable threshold (e.g., 30%), HVAC automatically reduces to eco mode or shuts off.
- If shore power is disconnected, HVAC switches from high-draw mode to battery-conserving mode.
- The energy planner can forecast HVAC energy consumption based on target temperature differential and historical data.

---

## 7. Pumps and Appliances

### 7.1 Pumps

| Pump | Control | Monitoring | Safety |
|------|---------|------------|--------|
| Bilge pump (per hull) | Auto (float switch) + manual override | Run count, run duration, current draw, dry-running detection | safety_critical=true, alerts on every activation, alert on high frequency |
| Freshwater pressure pump | Auto (pressure switch) + manual override | Run count, current draw, cycling detection | Alert on rapid cycling (leak indicator) |
| Washdown pump | Manual | Current draw | Auto-off timer (prevent accidental drain) |
| Seawater AC pump | Tied to HVAC | Current draw, flow rate | Alert on no-flow (intake blocked) |
| Watermaker high-pressure pump | Manual / scheduled | Current draw, production rate (L/hr), total produced, membrane hours | Auto-flush on shutdown, lockout on low battery |

### 7.2 Windlass

| Parameter | Detail |
|-----------|--------|
| Control | Up / down / stop |
| Current draw | Real-time monitoring (windlass draws 80-150A) |
| Chain counter | Metres/feet deployed (via chain counter sensor or NMEA 2000) |
| Safety | Requires explicit user action (no automation, no remote), dead-man switch behaviour in UI (hold to operate, release to stop) |

Windlass is never controlled by automation rules or remote commands. The UI requires a continuous press-and-hold interaction. This mirrors the physical dead-man switch on the foredeck.

### 7.3 Thrusters

| Parameter | Detail |
|-----------|--------|
| Control | Port / starboard / off (bow thruster), same for stern |
| Current draw | Real-time (thrusters draw 100-300A) |
| Duty cycle | Timer tracking, overheat protection alert |
| Safety | No automation, no remote. UI requires press-and-hold. |

Like the windlass, thrusters are never automated. Manual control only.

### 7.4 Appliances

| Appliance | Control | Monitoring | Automation |
|-----------|---------|------------|------------|
| Watermaker | On/off, flush cycle | Production rate, membrane hours, power draw | Scheduled runs (e.g., "run 2 hours daily at solar peak"), auto-flush, lockout on low SOC |
| Fridge/freezer | On/off (compressor circuit) | Temperature, power draw, door open alert | Alert on temperature rise, energy tracking |
| Washing machine | On/off (circuit only) | Power draw, cycle detection | Schedule to run on shore power or high solar |
| Water heater | On/off | Temperature, power draw | Auto-on when shore power connected, auto-off on battery |
| Inverter | On/off | Load, efficiency, temperature | Auto-off when no AC loads detected for N minutes |

---

## 8. Automation Rules

Automation rules are evaluated on the spoke in real-time. The rule engine subscribes to the data model and fires rules when trigger conditions are met.

### 8.1 Trigger types

| Trigger | Example | Data source |
|---------|---------|-------------|
| Schedule | "Every day at 06:00 local" | Cron expression, local timezone from GPS |
| Sensor threshold | "When battery SOC < 25%" | Any data model path |
| Sensor change | "When bilge float switch changes to true" | Any boolean data model path |
| System event | "At sunset", "Shore power connected" | Computed from GPS position + date, or electrical/shore/connected |
| Geofence | "When boat exits home marina zone" | GPS position vs geofence polygon |
| Circuit event | "When bilge pump turns on" | switching/circuits/{id}/state |

### 8.2 Conditions

Conditions are additional checks that must all pass before actions execute. This allows compound rules:

- Trigger: sunset. Condition: navigation/autopilot/mode != "standby" (i.e., boat is underway). Action: turn on navigation lights.
- Trigger: battery SOC < 20%. Condition: electrical/shore/connected == false. Action: turn off watermaker, HVAC, water heater. Send critical alert.

### 8.3 Geofence triggers

Geofences are circular zones defined by a centre point and radius. The rule engine checks the boat's GPS position against all active geofences and fires rules on enter/exit transitions.

**Common geofence automations:**

| Geofence event | Actions |
|----------------|---------|
| Exit home marina | Activate "underway" scene, enable anchor alarm standby, disable shore power loads |
| Enter destination marina | Pre-cool HVAC, send ETA notification |
| Anchor set (auto-geofence from anchor watch) | Activate "at anchor" scene, enable anchor alarm |
| Anchor weighed | Deactivate "at anchor" scene, activate "underway" scene |

### 8.4 Cooldown and debounce

Every rule has a `cooldown_seconds` parameter. The rule will not fire again within the cooldown window, even if the trigger condition is met repeatedly. This prevents:

- Bilge pump alerts firing every second during a pump cycle.
- Lighting scenes toggling rapidly from sensor noise.
- Geofence rules firing on GPS jitter near a boundary.

### 8.5 Rule safety

- Rules cannot control circuits marked `locked=true`.
- Rules cannot turn off circuits marked `safety_critical=true` unless the rule explicitly has `safety_override=true` (set by the user, not defaulted).
- Rules log every firing to the automation history (switching/rules/{id}/fire_count, last_fired).
- The user can disable any rule instantly from the UI.
- A "kill all automations" button disables all rules at once. Manual control takes over.

---

## 9. Matter/Thread Integration

The Above Deck Go server acts as both a **Matter controller** (discovering and reading off-the-shelf smart home devices) and a **Matter bridge** (exposing boat systems to smart home ecosystems).

### 9.1 Inbound: Matter controller

Above Deck discovers Matter devices on the boat's local network and integrates their data into the unified data model.

| Matter device type | Maps to data model path | Example product |
|-------------------|------------------------|-----------------|
| Smart plug with energy monitoring | switching/circuits/{id}/ (state, power, current) | Eve Energy, TP-Link Tapo |
| Smart light bulb / switch | switching/circuits/{id}/ (state, dimmable, brightness) | Philips Hue, Nanoleaf |
| Temperature sensor | environment/inside/{zone}/temperature | Eve Room, Aqara |
| Humidity sensor | environment/inside/{zone}/humidity | Eve Room |
| Contact sensor | switching/circuits/{id}/ (mapped as binary input) | Eve Door & Window |
| Thermostat | hvac/zones/{zone}/ | Nest, Ecobee |
| Water leak sensor | tanks/{location}/leak_detected | Aqara Water Leak |

**Commissioning flow:**

1. User puts Matter device into pairing mode.
2. Above Deck Go server discovers the device via mDNS on the local network.
3. User enters the Matter setup code (QR or 11-digit number) in the Above Deck UI.
4. Go server commissions the device using SPAKE2+ (PASE), establishes encrypted session.
5. Device appears in the switching UI as a new circuit. User assigns label, location, type.

### 9.2 Outbound: Matter bridge

The Go server exposes boat systems as Matter devices. Any Matter controller (Apple Home, Google Home, Alexa, Home Assistant, SmartThings) can commission the bridge and see boat data as native smart home devices.

| Boat system | Matter device type | Matter cluster |
|-------------|-------------------|----------------|
| Cabin lights (dimmable) | Dimmable Light | On/Off + Level Control |
| Navigation lights | On/Off Switch | On/Off |
| Anchor light | On/Off Switch | On/Off |
| Cabin temperature | Temperature Sensor | Temperature Measurement |
| Cabin humidity | Humidity Sensor | Relative Humidity |
| Bilge water alarm | Contact Sensor | Boolean State |
| Battery SOC | Power Source | Power Source (battery percentage) |
| Solar production | Electrical Energy Measurement | Electrical Energy Measurement |
| Shore power | Smart Plug | On/Off + Electrical Measurement |

**Multi-admin:** The Matter bridge supports up to five simultaneous controller fabrics. One bridge serves HomeKit, Google Home, Alexa, Home Assistant, and SmartThings simultaneously.

### 9.3 Thread mesh networking

Thread is the low-power mesh protocol that Matter uses for battery-powered devices. A Thread border router (HomePod Mini, Nest Hub 2nd gen, or dedicated Thread border router) extends the mesh network across the boat.

**Marine relevance:** Thread's mesh topology handles the RF challenges of a boat (metal hulls, compartmentalised spaces) better than point-to-point WiFi for small sensors. A few Thread border routers placed in different compartments create reliable coverage.

### 9.4 Go implementation

The Go server uses the Matter SDK (or a Go binding to the C++ connectedhomeip SDK) for both controller and bridge roles. This is a significant implementation effort -- Matter is complex. The phased approach:

1. **Phase 1:** Matter bridge only (outbound). Expose a few key data points (cabin temp, battery SOC, lighting state) to smart home ecosystems. Use the Go Matter bridge library if available, or shell out to a Matter bridge process.
2. **Phase 2:** Matter controller (inbound). Discover and commission off-the-shelf Matter devices. Integrate into the unified data model.
3. **Phase 3:** Full bidirectional. Smart home ecosystems can both read state and send commands that flow through to NMEA 2000 / ESP32 circuits.

---

## 10. Voice Control

Voice control works through two independent paths.

### 10.1 AI agent path (Above Deck native)

The Engineer agent has tools for circuit control. Voice or text commands to the Engineer are parsed, validated, and executed.

**Examples:**

| Command | Agent action |
|---------|-------------|
| "Engineer, turn off the watermaker" | Engineer calls `set_circuit(circuit_id="watermaker", state=false)` |
| "Engineer, activate night passage" | Engineer calls `activate_scene(scene_id="night_passage")` |
| "Engineer, what is the salon temperature?" | Engineer reads `environment/inside/salon/temperature` and responds |
| "Engineer, dim the cabin lights to 30%" | Engineer calls `set_circuit(circuit_id="salon_overhead", state=0.3)` |
| "Engineer, why did the bilge pump just run?" | Engineer reads bilge pump history, current draw, run duration, and explains |

**Safety:** The Engineer agent respects all the same safety rules as the UI -- locked circuits cannot be controlled, safety_critical circuits require explicit override, windlass and thrusters are excluded from agent control entirely.

### 10.2 Smart home voice assistant path (via Matter bridge)

When the Matter bridge exposes circuits to HomeKit, Google Home, or Alexa, voice commands work natively through those ecosystems:

- "Hey Siri, turn on the salon lights"
- "Alexa, set the cabin temperature to 22"
- "Hey Google, turn off all the lights"

This path does not go through the AI agents. It goes directly from the voice assistant to the Matter bridge to the Go server to the circuit.

---

## 11. Remote Control

Remote control means controlling the boat's circuits from outside the local network -- from shore, from another country, from anywhere with internet.

### 11.1 Architecture

Remote commands flow through the hub:

```
User phone (PWA)
  → Hub API (authenticated, encrypted)
    → Hub-to-spoke sync channel (WebSocket or MQTT over TLS)
      → Spoke Go server
        → Protocol adapter (NMEA 2000 / ESP32 / Matter)
          → Physical circuit
```

The spoke must be online (connected to internet) for remote control to work. If the spoke is offline, commands are queued on the hub and delivered when connectivity is restored.

### 11.2 Remote control permissions

Remote control is a separate permission layer on top of local control:

| Permission | Default | Description |
|------------|---------|-------------|
| Remote view | Enabled | See circuit states, current draw, fault status from anywhere |
| Remote control (general) | Disabled | Must be explicitly enabled per-user |
| Remote control (per-circuit) | Disabled | Each circuit must be individually enabled for remote control |
| Remote control (safety_critical) | Disabled, cannot be enabled remotely | Safety-critical circuits can only be unlocked from local UI |
| Remote control (windlass, thrusters) | Permanently disabled | Never remotely controllable |

### 11.3 Command confirmation

Remote commands that affect high-draw circuits (watermaker, HVAC, windlass) require a confirmation step in the UI: "Start watermaker remotely? This will draw approximately 800W from the battery bank. Current SOC: 72%. Confirm?"

---

## 12. UI/UX

The switching interface renders inside the MFD shell as a boat systems app.

### 12.1 Circuit control screen

The primary screen shows all circuits grouped by location or type. Each circuit is a card showing:

- Circuit label and icon (Tabler icon set)
- On/off toggle (tap to switch)
- Dimming slider (for dimmable circuits, drag or tap)
- Current draw (real-time, in amps or watts)
- Fault indicator (red badge if faulted)
- Lock indicator (padlock icon if locked)
- Source badge (small icon showing CZone, ESP32, Matter, etc.)

**Grouping options:** by location (salon, cockpit, engine room, port hull, stbd hull), by type (lighting, pumps, appliances, HVAC), or by switch bank (hardware grouping).

**Quick actions bar** at the top: "All Off" (with confirmation for safety_critical), "Night Mode", "Scenes" dropdown.

### 12.2 Scene management screen

Lists all scenes with activate/deactivate toggle for each. Tap a scene to see and edit its circuit states. Create new scene button opens an editor where the user selects circuits and target states.

Active scene is highlighted. Multiple scenes can be active simultaneously (they compose -- later-activated scene wins for conflicting circuits).

### 12.3 Automation rules screen

Lists all rules with enable/disable toggle. Each rule shows: trigger summary, action summary, last fired time, fire count. Tap to edit. Create new rule with guided builder (select trigger type, set conditions, choose actions).

### 12.4 HVAC screen

Per-zone temperature display with target adjustment (tap +/- or dial). Mode selector (off, cool, heat, auto, fan, dehumidify). Fan speed selector. Current power draw. Schedule view showing upcoming on/off times.

### 12.5 Boat schematic view

An optional view showing a simplified plan view of the boat with circuit locations marked. Tap a location to control the circuits in that zone. Colour-coded: green = on, dark = off, red = fault. This is the Raymarine-style graphical view.

The schematic is configurable -- users upload or select a boat outline, then place circuit markers. Pre-built templates for common boat types (monohull, catamaran, motor yacht).

### 12.6 Design adherence

All UI follows the brand guidelines:

- Dark mode default (Deep Navy #1a1a2e background, Midnight Blue #16213e cards)
- Space Mono headings, Inter body text
- Sea Green (#4ade80) for active/on states
- Coral (#f87171) for faults and warnings
- Ocean Blue (#60a5fa) for interactive elements
- Blueprint Grey (#2d2d4a) borders at low opacity
- Tabler icons throughout
- No decorative elements -- every pixel serves a function

---

## 13. API Endpoints

The switching API is bidirectional -- it supports both reading state and sending commands. All endpoints are served by the Go API server (spoke for local, hub for remote).

### 13.1 REST API

**Read operations:**

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/switching/circuits | List all circuits with current state |
| GET | /api/v1/switching/circuits/{id} | Get single circuit detail |
| GET | /api/v1/switching/banks | List all switch banks |
| GET | /api/v1/switching/banks/{id} | Get switch bank detail with circuits |
| GET | /api/v1/switching/scenes | List all scenes |
| GET | /api/v1/switching/scenes/{id} | Get scene detail with circuit states |
| GET | /api/v1/switching/rules | List all automation rules |
| GET | /api/v1/switching/rules/{id} | Get rule detail |
| GET | /api/v1/switching/geofences | List all geofences |
| GET | /api/v1/switching/history | Circuit state change history (paginated) |
| GET | /api/v1/hvac/zones | List HVAC zones |
| GET | /api/v1/hvac/zones/{id} | Get HVAC zone detail |
| GET | /api/v1/hvac/schedule | List HVAC schedules |

**Write operations:**

| Method | Path | Description |
|--------|------|-------------|
| PUT | /api/v1/switching/circuits/{id}/state | Set circuit state (on/off/dim level) |
| POST | /api/v1/switching/scenes/{id}/activate | Activate a scene |
| POST | /api/v1/switching/scenes/{id}/deactivate | Deactivate a scene |
| POST | /api/v1/switching/scenes | Create a new scene |
| PUT | /api/v1/switching/scenes/{id} | Update a scene |
| DELETE | /api/v1/switching/scenes/{id} | Delete a scene |
| POST | /api/v1/switching/rules | Create an automation rule |
| PUT | /api/v1/switching/rules/{id} | Update a rule |
| DELETE | /api/v1/switching/rules/{id} | Delete a rule |
| PUT | /api/v1/switching/rules/{id}/enabled | Enable/disable a rule |
| POST | /api/v1/switching/circuits/{id}/lock | Lock a circuit (disable automation/remote control) |
| POST | /api/v1/switching/circuits/{id}/unlock | Unlock a circuit |
| PUT | /api/v1/hvac/zones/{id} | Set HVAC zone target temp, mode, fan speed |
| POST | /api/v1/hvac/schedule | Create HVAC schedule |
| PUT | /api/v1/hvac/schedule/{id} | Update HVAC schedule |
| DELETE | /api/v1/hvac/schedule/{id} | Delete HVAC schedule |
| POST | /api/v1/switching/geofences | Create a geofence |
| PUT | /api/v1/switching/geofences/{id} | Update a geofence |
| DELETE | /api/v1/switching/geofences/{id} | Delete a geofence |

**Write request body example (set circuit state):**

```json
{
  "state": true,
  "dim_level": 0.5,
  "transition_ms": 1000,
  "source": "user"
}
```

**Write response:**

```json
{
  "circuit_id": "salon_overhead",
  "state": true,
  "dim_level": 0.5,
  "previous_state": false,
  "previous_dim_level": 0.0,
  "timestamp": "2026-03-31T14:22:05Z",
  "acknowledged": true
}
```

The `acknowledged` field indicates whether the physical hardware confirmed the state change. For NMEA 2000 circuits, this means PGN 127501 was received reflecting the new state. For Matter devices, this means the device reported the new state. If `acknowledged` is false after a timeout (configurable, default 2 seconds), the API returns the response with `acknowledged: false` and the UI shows a "pending" indicator.

### 13.2 WebSocket API

Real-time circuit state updates are delivered via WebSocket. The frontend subscribes to switching paths and receives updates on every state change.

**Subscribe message:**

```json
{
  "action": "subscribe",
  "paths": [
    "switching/circuits/*",
    "switching/scenes/*",
    "hvac/zones/*"
  ]
}
```

**Update message (server to client):**

```json
{
  "path": "switching/circuits/salon_overhead/state",
  "value": true,
  "timestamp": "2026-03-31T14:22:05Z",
  "source": "nmea2000"
}
```

**Command message (client to server):**

```json
{
  "action": "command",
  "path": "switching/circuits/salon_overhead/state",
  "value": 0.5,
  "transition_ms": 1000
}
```

### 13.3 MCP tools (for AI agents)

The switching system exposes tools via the Model Context Protocol for AI agent use:

| Tool | Parameters | Description |
|------|-----------|-------------|
| `get_circuits` | filter_type, filter_location | List circuits with current state |
| `set_circuit` | circuit_id, state, dim_level, transition_ms | Control a circuit |
| `get_scenes` | | List available scenes |
| `activate_scene` | scene_id | Activate a scene |
| `deactivate_scene` | scene_id | Deactivate a scene |
| `get_hvac_zones` | | List HVAC zones with current state |
| `set_hvac_zone` | zone_id, target_temp, mode, fan_speed | Control HVAC |
| `get_circuit_history` | circuit_id, duration | Get recent state changes for a circuit |
| `get_automation_rules` | | List automation rules |

---

## 14. Hub vs Spoke

### 14.1 Spoke responsibilities (on-boat, real-time)

The spoke handles all real-time switching operations:

- **Protocol adapters** -- NMEA 2000 PGN 127501/127502 read/write, ESP32 MQTT/WebSocket, Matter controller/bridge.
- **Rule engine** -- evaluates automation rules in real-time, fires actions with sub-second latency.
- **State management** -- maintains the complete current state of all circuits in memory and SQLite.
- **Local API** -- serves the REST and WebSocket APIs for local clients (MFD screens, tablets, phones on boat WiFi).
- **Matter bridge** -- runs the Matter bridge process for smart home ecosystem integration.
- **Safety enforcement** -- all safety checks (locked, safety_critical, dead-man) are enforced at the spoke level. The spoke is the authority on what can and cannot be switched.

The spoke operates with zero cloud dependency. If internet goes down, all local switching, automation, and Matter integration continue without interruption.

### 14.2 Hub responsibilities (cloud, remote access)

The hub provides remote access and data aggregation:

- **Remote control relay** -- authenticated remote commands are forwarded to the spoke via the sync channel. The hub never directly controls hardware.
- **State mirror** -- the spoke syncs circuit state to the hub when connectivity is available. The hub stores a mirror of the current state for remote viewing.
- **History storage** -- circuit state change history is uploaded to the hub for long-term storage and trend analysis (daily energy consumption per circuit, pump run frequency, etc.).
- **Remote notifications** -- alerts generated by the spoke (circuit fault, bilge pump activation) are forwarded through the hub to push notifications, email, or SMS.

### 14.3 Sync behaviour

| Data | Direction | Frequency | Conflict resolution |
|------|-----------|-----------|---------------------|
| Circuit state | Spoke → Hub | On change (real-time when connected) | Spoke wins (spoke is source of truth) |
| Scene definitions | Bidirectional | On change | Last-write-wins with timestamp |
| Automation rules | Bidirectional | On change | Last-write-wins with timestamp |
| Geofence definitions | Bidirectional | On change | Last-write-wins with timestamp |
| State history | Spoke → Hub | Batch upload (every 5 minutes or on reconnect) | Append-only, no conflict |
| Remote commands | Hub → Spoke | Immediate (queued if offline) | Spoke validates and executes or rejects |

### 14.4 Offline queueing

If the spoke loses internet connectivity:

- Remote commands from the hub are queued on the hub. When the spoke reconnects, queued commands are delivered in order with their original timestamps. The spoke evaluates whether each command is still valid (e.g., a "turn on HVAC" command from 3 hours ago might be rejected if battery SOC is now low).
- State changes on the spoke are queued locally. When connectivity is restored, the spoke sends a state reconciliation to the hub, bringing the hub's mirror up to date.

---

## 15. Safety

### 15.1 Do no harm (default posture)

The system defaults to observe-only mode. No write commands are sent to any bus or device until the user explicitly enables write access for each device or protocol adapter. This is configured in the spoke settings:

```
adapters:
  nmea2000:
    gateway: "ydnu-02"
    write_enabled: false          # default: observe only
    write_allowed_pgns: []        # empty = no writes allowed
  esp32:
    write_enabled: false
  matter:
    write_enabled: false
```

Enabling write access is a deliberate action with a confirmation dialog explaining what it means.

### 15.2 Circuit protection levels

| Level | Behaviour | Examples |
|-------|-----------|---------|
| Normal | Full control from UI, automation, remote, agents | Cabin lights, courtesy lights, water heater |
| Locked | Manual local control only. No automation, no remote, no agent control. | User-chosen circuits |
| Safety-critical | Cannot be turned off by automation or remote. Manual local control and explicit override only. Alert raised if turned off while underway. | Navigation lights, bilge pump, VHF power |
| Dead-man | Requires continuous user interaction (press-and-hold). No automation, no remote, no agent. | Windlass, thrusters |

### 15.3 Failsafe defaults

If the spoke software crashes or the Go server restarts:

- All circuits remain in their current physical state. The software does not send any commands on startup until it has read the current state from the hardware.
- Automation rules are paused until the system has been running for 30 seconds and has confirmed connectivity with all switch banks.
- The Matter bridge restarts and re-advertises. Smart home controllers reconnect automatically.
- An alert is logged: "System restart detected. Automation rules paused for 30 seconds. All circuits in current hardware state."

### 15.4 Overcurrent and fault handling

When PGN 127501 reports a fault condition on a channel, or an ESP32 current sensor detects overcurrent:

1. The circuit is immediately marked `fault` in the data model.
2. An alert is raised (severity: warning for overcurrent, critical for short circuit or ground fault).
3. The fault is logged to circuit history with timestamp, current reading, and fault type.
4. The UI shows a red fault indicator on the affected circuit. The circuit cannot be re-enabled from the UI until the fault is cleared (either by the hardware resetting, or by the user manually clearing the fault in the UI after investigation).

### 15.5 Write access audit log

Every write command (circuit state change, scene activation, rule firing) is logged with:

- Timestamp
- Circuit/scene/rule affected
- Old state and new state
- Source (user, scene, rule, agent, remote, matter)
- User ID (if user-initiated)
- IP address (if remote)

This audit log is stored on the spoke (SQLite) and synced to the hub. It is browsable in the UI and available via the API for debugging and accountability.

---

## Appendix A: NMEA 2000 PGN Reference

### PGN 127501 — Binary Switch Bank Status

| Field | Type | Description |
|-------|------|-------------|
| Switch Bank Instance | uint8 | Identifies the physical switch module (0-252) |
| Switch 1-28 | 2-bit enum per switch | 00=off, 01=on, 10=error, 11=unavailable |

Transmitted on change. Each module broadcasts the state of all its channels whenever any channel changes.

### PGN 127502 — Switch Bank Control

| Field | Type | Description |
|-------|------|-------------|
| Switch Bank Instance | uint8 | Target module |
| Switch 1-28 | 2-bit enum per switch | 00=off, 01=on, 10=no change, 11=no change |

Sent by a controller (Above Deck) to command specific channels on a specific module. Channels set to "no change" (10 or 11) are not affected.

### PGN 126720 — Proprietary (CZone/EmpirBus)

Manufacturer-specific extensions for dimming control, fault reporting, configuration, and extended status. The manufacturer code in the PGN header identifies CZone vs EmpirBus vs other vendors. Decoding requires vendor-specific documentation.

---

## Appendix B: ESP32 Reference Firmware

The Above Deck project will publish reference ESP32 firmware for common switching configurations:

| Configuration | Channels | Features |
|---------------|----------|----------|
| 4-channel relay board | 4 on/off circuits | WiFi, MQTT, current sensing (optional) |
| 8-channel relay board | 8 on/off circuits | WiFi, MQTT, current sensing (optional) |
| 4-channel dimmer (MOSFET PWM) | 4 dimmable LED circuits | WiFi, MQTT, 12V PWM output |
| CAN bus gateway | N/A | ESP32 + SN65HVD230, speaks PGN 127501/127502 on NMEA 2000 bus |
| Tank level reader | 4 analog inputs | Resistive tank sender to WiFi/MQTT |

Firmware source is GPL-licensed and published in the Above Deck GitHub organisation. Community contributions for additional configurations are encouraged.
