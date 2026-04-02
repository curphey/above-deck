# Energy & Power — Feature Specification

**Feature:** 6.12 Energy & Power
**Date:** 2026-03-31
**Status:** Draft v1
**License:** GPL

---

## 1. Overview

Energy management is the single most important concern for off-grid cruising sailors. A boat at anchor or on passage is an isolated microgrid: solar panels, alternators, and shore power are the only inputs; batteries are the only storage; and every watt consumed must be accounted for. Running out of power offshore is not an inconvenience — it means no navigation instruments, no autopilot, no radio, no refrigeration.

Despite this, the tooling available to sailors is fragmented and poor. Victron's VRM Portal covers power hardware but ignores engines, tanks, and context. Existing solar calculators solve one piece of the puzzle (panel sizing, controller matching, or load estimation) but none combine energy audit, location-aware solar data, battery chemistry comparison, and route-based seasonal analysis into a single coherent tool.

Energy & Power delivers three capabilities:

1. **Planning tools** (hub, no hardware required) — system sizer and solar generation calculator. Help sailors design or evaluate their electrical systems before buying hardware.
2. **Real-time monitoring** (spoke, requires hardware) — live dashboard showing battery state, solar generation, consumption, charger/inverter status, and per-circuit loads.
3. **Historical analysis** (hub + spoke) — daily, weekly, and monthly energy graphs. Trend detection. Comparison of actual vs. predicted generation.

All three are connected: the sizer's consumption model feeds the real-time dashboard's baseline expectations. Actual data from the spoke validates (or corrects) the sizer's estimates. The generation calculator's PVGIS predictions are compared against real solar yield.

---

## 2. User Stories

### Planning (no hardware required)

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| EP-01 | As a sailor planning a refit, I want to estimate my daily energy consumption so I know how large a battery bank I need. | User can select appliances from a categorised catalog, adjust wattage and hours, switch between anchor/passage modes, and see total daily Wh and Ah. |
| EP-02 | As a sailor shopping for solar panels, I want to know how much solar wattage I need for my consumption and cruising ground. | Given a consumption profile and location, the sizer recommends panel wattage, battery bank size, and charge controller with three tiers (minimum / recommended / comfortable). |
| EP-03 | As a cruiser planning a route, I want to compare solar generation at different locations and times of year. | User can pin multiple locations on a map and see side-by-side monthly generation estimates using PVGIS data. |
| EP-04 | As a sailor with existing panels, I want to know how much energy they will produce at a specific location and month. | User enters panel specs, mounting type, and shading conditions; selects location; sees hourly/daily/monthly generation estimates. |
| EP-05 | As a sailor comparing battery chemistries, I want to see how AGM vs LiFePO4 affects the size, weight, and cycle life of my battery bank. | Sizer shows side-by-side comparison for the same consumption profile: bank size (Ah), usable capacity, weight, expected lifespan. |

### Real-Time Monitoring (spoke, requires hardware)

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| EP-10 | As a sailor at anchor, I want to see my battery SOC, voltage, and current at a glance. | Dashboard shows battery bank SOC (%), voltage, current, and power with 1-second update rate. |
| EP-11 | As a sailor on passage, I want to see a live energy balance (generation vs consumption) so I can manage my power budget. | Dashboard shows real-time generation (solar, alternator) and consumption with net power flow indicator. |
| EP-12 | As a sailor, I want to see the status of each solar MPPT controller (PV voltage, output, daily yield). | Per-array solar card showing PV voltage, charge current, power output, daily yield (kWh), and charging state. |
| EP-13 | As a sailor, I want to know whether I am on shore power and see the charger state. | Shore power indicator (connected/disconnected), AC input voltage/frequency, charger state (bulk/absorption/float), and charging current. |
| EP-14 | As a sailor, I want to see my inverter load so I know how much AC power I am drawing from the batteries. | Inverter card showing load (W), percentage of rated capacity, input/output voltage, and state. |
| EP-15 | As a sailor, I want to see per-circuit consumption via my digital switching system. | Per-circuit list showing name, on/off state, current draw (A), and power (W). Requires CZone, EmpirBus, or equivalent on NMEA 2000. |
| EP-16 | As a sailor, I want low-battery and high-consumption alerts. | Configurable threshold alerts for SOC (%), voltage, consumption rate. Alerts via local alarm, push notification, and optionally SMS. |

### Historical Analysis

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| EP-20 | As a sailor, I want to see daily energy graphs (generation, consumption, SOC trend) for the past 7/30/90 days. | Time-series charts with selectable range showing generation (Wh), consumption (Wh), and SOC (%) over time. |
| EP-21 | As a sailor, I want monthly energy summaries to understand seasonal patterns. | Bar chart showing monthly generation and consumption totals. Highlights surplus/deficit months. |
| EP-22 | As a sailor, I want to compare actual solar yield against PVGIS predictions. | Overlay of predicted vs actual daily generation for the current location and month. |
| EP-23 | As a sailor with a VRM account but no spoke hardware, I want to import my Victron data for historical analysis. | User authenticates with VRM credentials; system imports battery, solar, and inverter history via VRM API stats endpoint. |

---

## 3. Data Model

Energy & Power maps to the `electrical/` branch of the unified data model defined in the technical architecture.

### 3.1 Data Model Paths

```
electrical/
  batteries/
    {bankId}/                    -- e.g., "house", "start", "bow-thruster"
      voltage           float64  V
      current           float64  A    (positive = charging, negative = discharging)
      power             float64  W
      soc               float64  %    (0-100)
      soh               float64  %    (0-100, state of health)
      capacity           float64  Ah   (nominal)
      capacity_remaining float64  Ah
      temperature        float64  C
      time_remaining     int64    seconds (estimated at current draw)
      charge_cycles      int64    count
      chemistry          string   enum: lead_acid, agm, gel, lifepo4
      system_voltage     int      enum: 12, 24, 48
      num_cells          int
      cell_voltages      []float64  V (per cell, from BMS)

  solar/
    {arrayId}/                   -- e.g., "arch-port", "bimini-starboard"
      pv_voltage         float64  V
      pv_current         float64  A
      pv_power           float64  W
      charge_current     float64  A    (output to battery)
      charge_power       float64  W
      daily_yield        float64  Wh
      state              string   enum: off, bulk, absorption, float, mppt, equalize
      controller_model   string
      rated_power        float64  W    (panel nameplate)
      panel_count        int
      panel_type         string   enum: mono_rigid, mono_flexible, poly, thin_film
      mounting           string   enum: arch, bimini, deck, pole, rail

  chargers/
    {chargerId}/
      state              string   enum: off, bulk, absorption, float, equalize, storage
      output_current     float64  A
      output_power       float64  W
      input_voltage      float64  V
      input_current      float64  A
      mode               string   enum: charger_only, inverter_only, on, off

  inverters/
    {inverterId}/
      load               float64  W
      load_percent       float64  %    (of rated capacity)
      state              string   enum: off, inverting, standby, fault
      ac_out_voltage     float64  V
      ac_out_current     float64  A
      ac_out_frequency   float64  Hz
      dc_input_voltage   float64  V
      dc_input_current   float64  A
      rated_power        float64  W

  alternators/
    {alternatorId}/                -- e.g., "port-engine", "starboard-engine"
      output_current     float64  A
      output_voltage     float64  V
      output_power       float64  W
      temperature        float64  C
      field_current      float64  A    (if smart alternator)

  shore/
    connected            bool
    voltage              float64  V
    current              float64  A
    frequency            float64  Hz
    power                float64  W
    source               string   enum: grid, generator

  loads/
    {circuitId}/                  -- e.g., "fridge", "watermaker", "nav-lights"
      state              string   enum: on, off, fault
      current            float64  A
      power              float64  W
      name               string
      category           string   enum: navigation, refrigeration, lighting, comfort, water, communication, safety, mechanical
      type               string   enum: dc, ac
```

### 3.2 Relational Data (SQLite on spoke, PostgreSQL on hub)

**battery_banks**

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| boat_id | uuid | FK to boats |
| name | text | e.g., "House Bank" |
| chemistry | text | lead_acid, agm, gel, lifepo4 |
| nominal_voltage | int | 12, 24, 48 |
| nominal_capacity_ah | float | Nameplate Ah |
| usable_capacity_ah | float | After DoD limit |
| max_dod_percent | float | 50 for lead-acid, 80-90 for LiFePO4 |
| num_batteries | int | Batteries in the bank |
| install_date | date | |
| manufacturer | text | |
| model | text | |
| notes | text | |

**solar_arrays**

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| boat_id | uuid | FK to boats |
| name | text | e.g., "Arch Port" |
| rated_power_w | float | Total nameplate watts |
| panel_count | int | |
| panel_wattage | float | Per-panel watts |
| panel_type | text | mono_rigid, mono_flexible, poly, thin_film |
| mounting | text | arch, bimini, deck, pole, rail |
| tilt_angle | float | Degrees from horizontal |
| controller_type | text | mppt, pwm |
| controller_model | text | |
| install_date | date | |

**chargers**

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | |
| boat_id | uuid | |
| name | text | |
| type | text | shore_charger, inverter_charger, dc_dc |
| rated_power_w | float | |
| rated_current_a | float | |
| manufacturer | text | |
| model | text | |

**inverters**

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | |
| boat_id | uuid | |
| name | text | |
| rated_power_w | float | Continuous rating |
| surge_power_w | float | Peak rating |
| manufacturer | text | |
| model | text | |

**energy_readings** (time-series, spoke only — aggregated summaries sync to hub)

| Column | Type | Description |
|--------|------|-------------|
| timestamp | int64 | Unix timestamp |
| source | text | battery, solar, charger, inverter, alternator, shore, load |
| instance | text | Bank/array/circuit ID |
| metric | text | voltage, current, power, soc, yield, etc. |
| value | float64 | |

**energy_daily_summary** (synced to hub)

| Column | Type | Description |
|--------|------|-------------|
| date | date | |
| boat_id | uuid | |
| solar_yield_wh | float | Total solar generation |
| consumption_wh | float | Total consumption |
| max_soc | float | Peak SOC |
| min_soc | float | Minimum SOC |
| avg_soc | float | Average SOC |
| shore_power_wh | float | Energy from shore |
| alternator_wh | float | Energy from alternator |
| peak_solar_w | float | Maximum instantaneous solar |
| peak_consumption_w | float | Maximum instantaneous consumption |

### 3.3 Sizer Data (hub only, per-user)

**energy_profiles**

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | |
| user_id | uuid | FK to users |
| boat_id | uuid | FK to boats (optional) |
| name | text | e.g., "Atlantic crossing plan" |
| system_voltage | int | 12, 24, 48 |
| created_at | timestamp | |
| updated_at | timestamp | |

**energy_profile_loads**

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | |
| profile_id | uuid | FK to energy_profiles |
| appliance_id | text | FK to appliance catalog or "custom" |
| name | text | |
| watts | float | |
| hours_per_day_anchor | float | |
| hours_per_day_passage | float | |
| quantity | int | |
| duty_cycle | float | 0-1 (for cycling loads like fridge) |
| type | text | dc, ac |

**energy_profile_locations**

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | |
| profile_id | uuid | FK to energy_profiles |
| name | text | e.g., "Caribbean winter" |
| lat | float | |
| lng | float | |
| months | text[] | Which months at this location |

---

## 4. Data Sources

### 4.1 Victron VE.Direct (Spoke)

Point-to-point serial protocol (TTL UART, 19200 baud). Connects directly to MPPT solar controllers, SmartShunt battery monitors, and Phoenix inverters. Each device requires its own VE.Direct port or USB adapter. The Cerbo GX has 3-4 built-in VE.Direct ports.

**Protocol:** Simple text frames with key-value pairs. Fields include battery voltage (`V`), battery current (`I`), panel voltage (`VPV`), panel power (`PPV`), state of charge (`SOC`), yield today (`H20`, in 0.01 kWh), and charging state (`CS`).

**Adapter:** `victron-vedirect` protocol adapter in the Go spoke. Reads serial port, parses text frames, maps to `electrical/` data model paths.

### 4.2 Victron MQTT via Cerbo GX (Spoke)

The Cerbo GX aggregates all Victron devices and publishes their data via MQTT on the local network. This is the preferred integration path for boats with a Cerbo GX — one connection provides all Victron data.

**Transport:** MQTT TCP port 1883 (native), WebSocket port 9001 (for browser clients).

**Topic structure:** `N/{portalId}/{serviceType}/{deviceInstance}/{dbusPath}`

**Key topics:**

| Topic | Maps to |
|-------|---------|
| `N/{id}/system/0/Dc/Battery/Soc` | `electrical/batteries/{bank}/soc` |
| `N/{id}/system/0/Dc/Battery/Voltage` | `electrical/batteries/{bank}/voltage` |
| `N/{id}/system/0/Dc/Battery/Current` | `electrical/batteries/{bank}/current` |
| `N/{id}/system/0/Dc/Battery/Power` | `electrical/batteries/{bank}/power` |
| `N/{id}/system/0/Dc/Pv/Power` | `electrical/solar/total/pv_power` |
| `N/{id}/solarcharger/{n}/Pv/V` | `electrical/solar/{array}/pv_voltage` |
| `N/{id}/solarcharger/{n}/Yield/Power` | `electrical/solar/{array}/charge_power` |
| `N/{id}/solarcharger/{n}/Yield/User` | `electrical/solar/{array}/daily_yield` |
| `N/{id}/vebus/{n}/Ac/ActiveIn/L1/V` | `electrical/shore/voltage` |
| `N/{id}/vebus/{n}/Ac/Out/L1/P` | `electrical/inverters/{inv}/load` |
| `N/{id}/vebus/{n}/State` | `electrical/chargers/{ch}/state` |
| `N/{id}/battery/{n}/Dc/0/Temperature` | `electrical/batteries/{bank}/temperature` |

**Adapter:** `victron-mqtt` protocol adapter in the Go spoke. Subscribes to relevant topics, maps to data model.

### 4.3 Victron VRM API (Hub)

Cloud API providing access to Victron installation data for users who have a Cerbo GX with internet connectivity but no spoke hardware.

**Base URL:** `https://vrmapi.victronenergy.com/v2`

**Authentication:** Personal access token via `X-Authorization: Token {token}` header.

**Key endpoints used:**

| Endpoint | Purpose |
|----------|---------|
| `/users/{id}/installations` | List boats/installations |
| `/installations/{id}/widgets/BatterySummary` | Latest battery SOC, voltage, current |
| `/installations/{id}/widgets/SolarChargerSummary` | Solar PV power, yield per MPPT |
| `/installations/{id}/widgets/VeBusStatus` | Inverter/charger state |
| `/installations/{id}/stats` | Historical data (hourly/daily/monthly) |
| `/installations/{id}/diagnostics` | All current diagnostic values |

**Limitations:** Polling only (no streaming), ~100 requests per 15 minutes, Victron equipment only (no NMEA 2000 engine/tank data). Minimum useful poll interval: 30 seconds.

**Hub integration:** The Go API server proxies VRM requests, caches responses, and normalises data into the same format as spoke-sourced data. Users authenticate once with their VRM token; the hub stores it encrypted.

### 4.4 NMEA 2000 PGNs (Spoke)

Battery and electrical data from non-Victron equipment (or Victron devices bridged to NMEA 2000 via Cerbo GX).

| PGN | Name | Data | Update Rate |
|-----|------|------|-------------|
| 127506 | DC Detailed Status | SOC (%), SOH (%), time remaining, ripple voltage | 1 Hz |
| 127508 | Battery Status | Voltage, current, temperature, battery instance | 1 Hz |
| 127513 | Battery Configuration Status | Chemistry type, capacity, charge/discharge efficiency, bank instance | On change |
| 127751 | DC Current/Voltage | Bus voltage, current | 1 Hz |

**Adapter:** The existing `nmea2000` protocol adapter parses these PGNs and maps to `electrical/batteries/{bank}/` paths. Battery instance numbers are mapped to user-defined bank names via equipment registry configuration.

### 4.5 PVGIS API (Hub)

European Commission's free solar irradiance API. Used by the generation calculator and system sizer.

**Base URL:** `https://re.jrc.ec.europa.eu/api/v5_3/`

**Endpoints used:**

| Endpoint | Purpose |
|----------|---------|
| `MRcalc` | Monthly average irradiance for a location. Primary data for seasonal generation estimates. |
| `SHScalc` | Off-grid PV system simulation. Models panel + battery + daily consumption. Returns % days battery full, % days battery empty. |
| `seriescalc` | Hourly time-series data. Powers detailed passage energy modelling. |

**Key parameters:** `lat`, `lon`, `peakpower`, `loss`, `angle` (0 for flat-mounted marine panels), `raddatabase=PVGIS-ERA5` (global coverage including ocean), `outputformat=json`.

**Constraints:** 30 requests/second rate limit. No authentication required. No browser-side AJAX (CORS blocked) — all requests proxied through the Go API server. HTTP 429/529 for rate limiting (retry after 4-5 seconds).

**Caching strategy:** PVGIS data is static for a given location — irradiance values do not change year to year. Cache responses by lat/lng (rounded to 0.1 degree) indefinitely. Invalidate only on PVGIS version change.

---

## 5. System Sizer Tool

The sizer helps sailors design or evaluate their electrical system. It answers the question: "What battery bank and solar array do I need?"

### 5.1 Input Flow

**Step 1 — Energy audit (consumption)**

Three levels of progressive disclosure:

- **Quick estimate:** Select boat size (25-30ft / 30-40ft / 40-50ft / 50ft+) and cruising style (weekender / coastal / offshore / liveaboard). Pre-populate typical loads from the appliance database.
- **Customise:** Adjust individual appliances from a categorised catalog. Each appliance shows name, typical wattage (editable), and hours/day. Toggle between anchor and passage modes. Add custom appliances.
- **Expert:** Enter exact amp draws, duty cycles, inverter efficiency, and seasonal variations.

**Step 2 — Location and season**

- Map picker (click to place pin) or search by port/location name.
- Select months of interest or specify a route (multiple locations with date ranges).
- System fetches PVGIS monthly irradiance data for each location.

**Step 3 — Battery preferences**

- Chemistry: AGM vs LiFePO4 (side-by-side comparison shown).
- System voltage: 12V / 24V / 48V.
- Days of autonomy: 1-5 days (default 2-3).

**Step 4 — Existing equipment (optional)**

- Already have panels? Enter specs to see if they are sufficient.
- Already have batteries? Enter capacity to see if they cover consumption.

### 5.2 Output

Three recommendation tiers:

| Tier | Philosophy |
|------|-----------|
| Minimum viable | Covers consumption in best-case solar conditions. Requires supplemental charging (engine/generator) in winter at higher latitudes. |
| Recommended | Covers consumption in average solar conditions at the specified location. 15-20% surplus margin. |
| Comfortable | Covers consumption in worst-month solar conditions. Rarely needs supplemental charging. 30-40% surplus margin. |

Each tier shows:
- Solar panel wattage and approximate panel count
- Battery bank size (Ah and kWh) for each chemistry option
- Charge controller rating (amps)
- Inverter size (if AC loads are present)
- Weight estimate for the battery bank
- Daily energy balance visualisation (generation curve vs consumption baseline)

### 5.3 Calculation Engine

```
daily_consumption_wh = SUM(appliance_watts * hours_per_day * duty_cycle * quantity)
  + (ac_consumption_wh / inverter_efficiency)

peak_sun_hours = pvgis_monthly_irradiance(lat, lng, month) / 1000
  -- MRcalc returns kWh/m2/day; divide by 1 kW/m2 to get PSH

system_efficiency = base_efficiency
  * temperature_derating(location_avg_temp)
  * angle_derating(tilt_angle, latitude)
  * shading_factor(mounting_type)
  * motion_derating(mode)

required_solar_w = daily_consumption_wh / (peak_sun_hours * system_efficiency)

battery_bank_ah = (daily_consumption_wh / system_voltage)
  * (1 / max_dod)
  * days_of_autonomy
```

Default derating factors:

| Factor | Default | Configurable |
|--------|---------|-------------|
| Base MPPT efficiency | 0.97 | No |
| Wiring losses | 0.97 | Yes |
| Temperature derating | 0.90 (tropics), 0.95 (temperate) | Auto from location |
| Horizontal angle loss | latitude-dependent (0.93 at 25N, 0.85 at 50N) | Auto |
| Shading — arch mount | 0.90 | Yes |
| Shading — bimini mount | 0.80 | Yes |
| Shading — deck mount | 0.70 | Yes |
| Soiling/salt spray | 0.97 | Yes |
| Motion (passage) | 0.92 | Yes |
| Panel degradation | 0.995 per year of age | Yes |

### 5.4 Appliance Catalog

A built-in database of ~50 common marine appliances with default wattage, duty cycle, and anchor/passage usage hours. Categories: Navigation, Communication, Refrigeration, Lighting, Water Systems, Comfort/Galley, Charging/Electronics, Sailing/Mechanical, Safety.

Source data: the appliance database in the solar energy research document. Stored as a JSON fixture in the codebase. Community contributions can extend it via the hub.

---

## 6. Generation Calculator

The generation calculator answers: "How much energy will my existing (or planned) panels produce at a given location and time of year?"

### 6.1 Inputs

| Input | Required | Source |
|-------|----------|--------|
| Total panel wattage | Yes | User entry or from equipment registry |
| Panel type (mono/poly/thin-film) | Yes | Affects efficiency assumptions |
| Mounting type | Yes | arch, bimini, deck, pole |
| Shading conditions | Yes | none, light rigging, heavy rigging, partial sail |
| Location (lat/lng) | Yes | Map pin or search |
| Month or date range | Yes | Dropdown or date picker |
| Panel age (years) | Optional | Degradation factor |
| Controller type (MPPT/PWM) | Optional | Default MPPT |

### 6.2 Outputs

**Daily generation estimate:**
- Expected daily yield (Wh and Ah at system voltage)
- Hourly generation curve (bell-curve chart from PVGIS daily radiation data)
- Peak output time and wattage

**Monthly comparison chart:**
- 12 bars showing expected monthly generation
- Best and worst months highlighted
- If consumption profile is linked, overlays consumption line to show surplus/deficit months

**Multi-location comparison:**
- Side-by-side bar charts for pinned locations
- Answers: "My system works in the Caribbean but will I have a deficit in the UK in December?"

### 6.3 PVGIS Integration

The hub Go API server handles all PVGIS requests:

1. Client sends `{ lat, lng, peakpower_w, loss_pct, angle, month }` to `/api/energy/solar/estimate`.
2. Server checks cache (keyed by lat/lng rounded to 0.1 degree).
3. On cache miss, server calls PVGIS `MRcalc` with `horirrad=1&optrad=1&avtemp=1&raddatabase=PVGIS-ERA5&outputformat=json`.
4. Server applies boat-specific derating factors (not handled by PVGIS): shading, motion, soiling, degradation.
5. Returns monthly generation estimates to client.

For off-grid system validation, the server calls `SHScalc` with panel specs, battery size, and daily consumption to get percentage of days with full/empty battery.

---

## 7. Real-Time Dashboard

### 7.1 Layout

The energy dashboard renders inside the MFD shell as a single app tile. It is designed for dark backgrounds and must be readable at arm's length (helm station) and in low-light conditions.

**Primary view — Energy Overview:**

```
+--------------------------------------------------+
|  BATTERY                    |  ENERGY BALANCE     |
|  ████████████████░░░░  78%  |  [24hr area chart]  |
|  13.2V   -8.4A   -110W     |  Gen ████ 1,840 Wh  |
|  Est: 14h remaining         |  Con ████ 1,620 Wh  |
|                             |  Net: +220 Wh       |
+--------------------------------------------------+
|  SOLAR           |  CHARGER/INVERTER  |  SHORE    |
|  ☀ 340W / 400W   |  State: Float      |  ● Disc.  |
|  Today: 1.84 kWh |  Out: 2.1A         |           |
|  Array 1: 180W   |  Inv: 45W (2%)     |           |
|  Array 2: 160W   |                    |           |
+--------------------------------------------------+
```

**Secondary view — Per-Circuit Loads (if digital switching available):**

Scrollable list of circuits with name, state (on/off), current draw, and power. Sortable by power consumption.

**Tertiary view — Battery Detail:**

SOC trend chart (last 24 hours), cell voltages (if BMS data available), temperature, charge cycles, health indicators.

### 7.2 Gauges and Visualisations

| Element | Type | Colour |
|---------|------|--------|
| Battery SOC | Segmented bar gauge | Green (>50%), yellow (20-50%), red (<20%) |
| Battery current | Signed numeric, arrow indicator | Green when charging, coral when discharging |
| Solar output | Numeric + small bar (actual/rated) | Sea green |
| Energy balance chart | Stacked area (generation above axis, consumption below) | Green/coral |
| Shore power | Status dot | Green (connected), grey (disconnected) |
| Charger state | Text badge | Colour-coded by state |

### 7.3 Update Rates

| Data source | Dashboard refresh |
|-------------|-------------------|
| Victron MQTT | 1 second (subscription-based, no polling) |
| VE.Direct serial | 1 second (frame rate) |
| NMEA 2000 PGNs | 1 second (PGN update rate) |
| VRM API (remote fallback) | 30 seconds (polling) |
| Per-circuit loads | On change (NMEA 2000 switch bank events) |

---

## 8. Historical Analysis

### 8.1 Time Ranges

| Range | Resolution | Data Source |
|-------|-----------|-------------|
| Last 24 hours | 1-minute averages | Spoke local time-series (energy_readings) |
| Last 7 days | 15-minute averages | Spoke local time-series |
| Last 30 days | Hourly averages | Spoke local or hub (synced daily summaries) |
| Last 12 months | Daily summaries | Hub (energy_daily_summary) |

### 8.2 Charts

**Daily energy balance:** Stacked area chart. Solar generation (green) above the x-axis, consumption (coral) below. SOC trend overlaid as a line.

**Weekly/monthly bars:** Side-by-side bars for generation and consumption per day/week. Horizontal line showing average.

**SOC heatmap:** 24x7 grid (hours x days) showing SOC by colour intensity. Reveals patterns like "batteries always low on Tuesdays" (laundry day).

**Predicted vs actual:** Overlay of PVGIS-predicted generation against actual solar yield for the current location. Helps identify panel degradation, persistent shading, or dirty panels.

### 8.3 Data Retention

| Location | Retention | Notes |
|----------|-----------|-------|
| Spoke (raw readings) | 90 days | 1-second samples downsampled to 1-minute after 24 hours |
| Spoke (daily summaries) | Indefinite | Small — one row per day |
| Hub (daily summaries) | Indefinite | Synced from spoke |
| Hub (VRM import) | Indefinite | Historical import from VRM API |

---

## 9. UI/UX

### 9.1 Design Principles

- Dark mode is default. Blueprint aesthetic: fine lines, precise spacing, Sea Green for generation, Coral for consumption, Ocean Blue for interactive elements.
- All UI renders inside the MFD shell frame. Never standalone pages.
- Dashboard designed for readability at helm station distance (~1m). Large SOC number, high-contrast colours.
- Progressive disclosure: overview first, tap/click for detail.
- Real-time updates with subtle value transitions (count-up/down animation), no jarring full-page reloads.

### 9.2 Sizer/Calculator UX (Hub, Browser)

- Card-based appliance selection. Categorised tabs. Tap to add, toggle to remove.
- Sliders for hours/day and quantity. Value displayed above thumb.
- Map picker for location. Click to pin, search by name.
- Results panel always visible (sticky sidebar on desktop, pull-up bottom sheet on mobile).
- All calculations update within 100ms of input change. No "Calculate" button.
- Dark mode palette as specified in brand guidelines.
- Mobile-first: thumb-zone navigation, minimum 44px touch targets, 16px body text.

### 9.3 Dashboard UX (Spoke, MFD Shell)

- Optimised for touch screens (7-16 inch MFD displays).
- Three swipeable panels: Overview, Circuits, Battery Detail.
- Gauges use Recharts 2 components.
- WebSocket connection to spoke Go server for real-time updates.
- Offline-first: dashboard works with no internet. Historical charts load from local SQLite.

### 9.4 Typography

- Headings: Space Mono
- Body: Inter
- Data values / specs: Fira Code
- All via Google Fonts CDN

---

## 10. API Endpoints

### 10.1 Hub API (Go server)

**Sizer / Calculator:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/energy/appliances` | List appliance catalog (categorised) |
| POST | `/api/energy/profiles` | Create a new energy profile |
| GET | `/api/energy/profiles/{id}` | Get energy profile with loads and locations |
| PUT | `/api/energy/profiles/{id}` | Update energy profile |
| DELETE | `/api/energy/profiles/{id}` | Delete energy profile |
| POST | `/api/energy/profiles/{id}/loads` | Add load to profile |
| PUT | `/api/energy/profiles/{id}/loads/{loadId}` | Update load |
| DELETE | `/api/energy/profiles/{id}/loads/{loadId}` | Remove load |
| POST | `/api/energy/profiles/{id}/locations` | Add location to profile |
| POST | `/api/energy/profiles/{id}/calculate` | Run sizer calculation, return recommendations |
| POST | `/api/energy/solar/estimate` | Solar generation estimate for given panel specs + location |
| GET | `/api/energy/solar/irradiance?lat={}&lng={}` | Monthly irradiance data (PVGIS proxy with cache) |

**Historical (VRM import or spoke sync):**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/energy/history/daily?boat_id={}&from={}&to={}` | Daily energy summaries |
| GET | `/api/energy/history/monthly?boat_id={}&year={}` | Monthly aggregates |
| POST | `/api/energy/vrm/connect` | Store VRM API token (encrypted) |
| POST | `/api/energy/vrm/import` | Import historical data from VRM |
| GET | `/api/energy/vrm/status` | Check VRM connection status |

### 10.2 Spoke API (Go server, local network)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/energy/live` | Current state of all electrical paths (snapshot) |
| WS | `/ws/energy` | WebSocket stream of electrical data changes |
| GET | `/api/energy/history?range={24h,7d,30d}` | Historical time-series data |
| GET | `/api/energy/summary/today` | Today's generation, consumption, SOC range |
| GET | `/api/energy/summary/daily?from={}&to={}` | Daily summaries for date range |
| GET | `/api/energy/batteries` | Battery bank configuration and current state |
| GET | `/api/energy/solar` | Solar array configuration and current state |
| GET | `/api/energy/loads` | Per-circuit load states (if digital switching) |
| POST | `/api/energy/alerts` | Configure alert thresholds |
| GET | `/api/energy/alerts` | Get current alert configuration |

---

## 11. Hub vs Spoke

| Capability | Hub (browser) | Spoke (on-boat) | Notes |
|------------|---------------|-----------------|-------|
| System sizer | Yes | No | Planning tool, no hardware needed |
| Generation calculator | Yes | No | Uses PVGIS API (requires internet) |
| Appliance catalog | Yes | No | Hub-managed, synced to spoke for reference |
| Real-time dashboard | Via VRM API (30s polling) | Yes (1s updates) | Spoke is the primary experience |
| Historical daily summaries | Yes (synced from spoke or VRM import) | Yes (local) | Daily summaries sync spoke-to-hub |
| Raw time-series | No | Yes (90-day retention) | Too granular to sync; stays on spoke |
| Per-circuit monitoring | No | Yes | Requires NMEA 2000 digital switching |
| Alerts | VRM-based or hub polling | Yes (local alarm + push) | Spoke alerts are immediate; hub alerts depend on connectivity |
| Energy profiles | Yes (persisted to hub DB) | Synced down | Profiles created on hub, available on spoke for comparison |
| VRM integration | Yes | No (spoke uses MQTT directly) | VRM API is the no-hardware path |

### Sync Strategy

**Spoke to hub (when internet available):**
- Daily energy summaries (energy_daily_summary rows) — compact, one row per day.
- Equipment configuration changes (battery bank, solar array records).
- Not raw time-series — too large and not needed on hub.

**Hub to spoke (when internet available):**
- Updated appliance catalog.
- Energy profiles (so sizer estimates can be compared against real data on-board).
- PVGIS cache (pre-fetch irradiance data for planned route locations).

---

## 12. AI Agent Integration

The **Engineer** agent is responsible for energy and power monitoring. It has read access to all `electrical/` data model paths and the energy history.

### 12.1 Proactive Monitoring

| Condition | Engineer Action |
|-----------|----------------|
| SOC drops below configured threshold (default 30%) | Alert: "Battery bank at {soc}%. At current draw ({watts}W), estimated {hours}h remaining. Consider reducing loads or starting engine." |
| SOC trending to reach 0% before sunrise | Alert: "At current consumption rate, batteries will be depleted by {time}, approximately {hours}h before solar generation resumes. Recommend reducing overnight loads by {watts}W." |
| Solar yield significantly below PVGIS prediction (>30% deficit) | Advisory: "Solar yield today is {actual}Wh vs {predicted}Wh expected. Possible causes: cloud cover, dirty panels, shading, or panel degradation." |
| Charger fault state detected | Alert: "Charger '{name}' is reporting a fault. Check VE.Bus error code {code}." |
| Battery temperature out of range | Alert: "Battery bank '{name}' temperature is {temp}C. Safe charging range is 5-45C." |
| Unusual consumption pattern | Advisory: "Consumption today ({wh}Wh) is {percent}% above your 7-day average. Highest draw: {circuit} at {watts}W." |
| Shore power disconnected unexpectedly | Alert: "Shore power disconnected. Batteries now primary power source. SOC: {soc}%." |

### 12.2 Chat Interface

Users can ask the Engineer natural-language questions:

- "How much solar did I generate today?"
- "What is my battery state of charge?"
- "Will my batteries last the night at this consumption rate?"
- "How does my solar yield this month compare to what PVGIS predicts?"
- "What is my biggest power consumer?"
- "Should I run the engine to charge?"
- "Compare my energy use this week vs last week."

The Engineer agent has access to:
- Real-time electrical data (via data model subscription)
- Historical energy summaries (via spoke or hub database)
- Equipment registry (battery specs, solar array specs)
- PVGIS generation predictions
- The user's energy profile from the sizer tool (if created)

### 12.3 Cross-Agent Collaboration

- **Navigator asks Engineer:** "Do we have enough battery for a 48-hour passage without running the engine?" Engineer calculates based on passage-mode consumption profile, expected solar generation on the planned route, and current SOC.
- **Bosun asks Engineer:** "Is the watermaker running efficiently?" Engineer checks watermaker circuit power draw against expected values.
- **Navigator provides route to Engineer:** Engineer pre-fetches PVGIS data for waypoints along the route and generates an energy forecast for the passage.

---

## 13. Dependencies

### 13.1 Internal Dependencies

| Dependency | Feature | Relationship |
|------------|---------|-------------|
| Equipment Registry | Boat Management | Battery banks, solar arrays, chargers, and inverters are registered equipment. Energy & Power reads equipment metadata (manufacturer, model, capacity, install date) from the registry. |
| Protocol Adapters | Spoke Infrastructure | `victron-vedirect`, `victron-mqtt`, and `nmea2000` adapters feed data into the `electrical/` data model paths. Energy & Power consumes this data, does not manage adapters. |
| Data Model | Spoke Infrastructure | All real-time energy data flows through the unified data model's `electrical/` branch. |
| MFD Shell | UI Framework | Energy dashboard renders as an app tile inside the MFD shell. |
| Alert Engine | Spoke Infrastructure | Energy alerts (low SOC, charger fault, etc.) are registered with the spoke's alert engine, which handles multi-channel delivery (local, push, SMS). |
| AI Agents (Engineer) | Agent Framework | The Engineer agent requires the agent lifecycle manager (Watchman), RAG pipeline, and chat interface infrastructure. |
| Digital Switching (6.13) | Per-Circuit Monitoring | Per-circuit load data comes from digital switching systems (CZone, EmpirBus) via NMEA 2000 PGN 127501. Optional — Energy & Power works without it. |
| Sync Engine | Hub-Spoke Sync | Daily energy summaries sync from spoke to hub. Energy profiles sync from hub to spoke. |

### 13.2 External Dependencies

| Dependency | Type | Notes |
|------------|------|-------|
| PVGIS API v5.3 | External API | Free, no auth. Rate limit 30 req/s. CORS blocked — must proxy through Go server. Global coverage via ERA5 dataset. |
| Victron VRM API v2 | External API | Free with Victron hardware. Requires user's VRM token. Rate limit ~100 req/15min. |
| Recharts 2 | Frontend library | Chart components for gauges and time-series graphs. |
| mqtt.js | Frontend library | MQTT client for browser WebSocket connection to Cerbo GX (spoke dashboard). |
| Google Fonts | CDN | Space Mono, Inter, Fira Code. |
| Tailwind CSS + Ant Design 5 (antd) | UI library | Form controls, sliders, toggles, cards, tabs. Comprehensive React component library with built-in dark mode, i18n, and accessibility. |
| @ant-design/icons | Icon set | Ant Design's default icon set. |
