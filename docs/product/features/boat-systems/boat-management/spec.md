# Boat Management — Feature Specification

**Feature:** 6.11 Boat Management
**Status:** Draft
**Date:** 2026-03-31
**License:** GPL — free and open source

---

## 1. Overview

Boat Management is the central registry of everything about a vessel — its identity, physical specifications, installed equipment, maintenance history, documents, and consumable inventory. It is the foundational data layer that other features depend on: the energy planner reads solar panel specs and battery capacity from here, the passage planner checks engine service intervals, the firmware tracker matches against the equipment list, and the Engineer agent reasons over all of it.

Every cruising sailor maintains this information today — in spreadsheets, paper logbooks, filing cabinets, and memory. The information is fragmented, unsearchable, and disconnected from the tools that need it. Boat Management unifies it into a single structured registry that is always available (offline-first on the spoke), syncs to the hub when connected, and is queryable by both humans and AI agents.

**Why it matters:**

- A boat is a complex system with 50-200 pieces of equipment across propulsion, electrical, water, safety, navigation, rigging, and plumbing. Tracking what is installed, when it was serviced, what parts it needs, and when the next service is due is a significant cognitive burden.
- Maintenance failures at sea are dangerous. Proactive scheduling and AI-assisted analysis of service patterns reduce risk.
- Every other boat system feature (energy, firmware, passage planning, instrument dashboard) needs to know what equipment is aboard. Without a structured registry, each feature builds its own partial model. Boat Management is the single source of truth.
- Non-technical crew (partners, guests) should be able to check tank levels, see what maintenance is upcoming, and find a manual — without understanding the underlying systems.

---

## 2. User Stories

### Boat Profile

- **As a new user,** I want to enter my MMSI and have my vessel's basic details (name, call sign, flag state, vessel type) auto-populated from AIS data, so I don't have to type everything manually.
- **As a catamaran owner,** I want to select my boat model (e.g., "Lagoon 42, 2019") from a community-maintained template library and have factory-standard equipment pre-populated, so I only need to edit what I've changed.
- **As a sailor planning a passage,** I want my boat's draft, displacement, and rig type available to the route planner so it can calculate accurate fuel consumption, weather routing polars, and depth clearance.

### Equipment Registry

- **As a boat owner,** I want to register every piece of significant equipment organised by system (propulsion, electrical, water, safety, navigation, rigging, plumbing) with make, model, serial number, and install date, so I have a complete inventory.
- **As a sailor preparing for an ocean crossing,** I want to see all safety equipment with expiry dates (flares, liferaft certification, EPIRB battery, fire extinguisher service) in one view, so nothing is missed.
- **As a Victron user,** I want to select "Victron SmartSolar MPPT 150/35" from an equipment template and have its specifications (max PV voltage, max charge current, rated power) pre-populated, so the energy planner can use accurate data without manual entry.

### Maintenance

- **As a boat owner,** I want to set recurring maintenance schedules (oil change every 200 engine hours, impeller every 500 hours, antifoul every 12 months) and receive alerts when service is due.
- **As a sailor mid-passage,** I want the passage planner to warn me if an engine service interval will be reached during the planned voyage, so I can service before departure.
- **As someone who just completed maintenance,** I want to log the work done, parts used, cost, and any notes, building a complete service history per equipment item.
- **As a buyer evaluating a boat,** I want to see the complete maintenance history in a format I can export and share, demonstrating the vessel has been well maintained.

### Documents

- **As a boat owner,** I want to store digital copies of registration certificates, insurance policies, equipment manuals, and survey reports, accessible offline on the boat.
- **As a sailor checking into a foreign port,** I want to quickly find my registration certificate, insurance document, and crew list from the document store on my phone.

### Inventory

- **As a sailor provisioning for a passage,** I want to track spare parts, consumables (filters, impellers, anodes, belts), and safety equipment with quantities and expiry dates, so I know what needs restocking.
- **As someone anchored in a remote location,** I want to check if I have the right oil filter aboard before I start an engine service.

### Subsystems (Engines, Tanks, Watermaker)

- **As a catamaran owner with twin engines,** I want to see both engines side by side — hours, service status, live RPM, oil pressure, coolant temp — in a single view.
- **As a liveaboard,** I want to see all tank levels (fuel, water, black, grey) at a glance with consumption rates and estimated time remaining, so I can plan refills.
- **As a watermaker operator,** I want to track output rate, total production, runtime hours, and membrane/filter service intervals in one place.

---

## 3. Data Model

The data model is the linchpin of this feature. It must be rich enough to support maintenance scheduling, energy planning, passage planning, firmware tracking, and AI agent reasoning — while remaining simple enough for a non-technical user to populate.

### 3.1 Entities and Relationships

```
User (1) ──── owns ────> (N) Boat
Boat (1) ──── has ─────> (N) Equipment
Boat (1) ──── has ─────> (N) Tank
Boat (1) ──── has ─────> (N) Document
Boat (1) ──── has ─────> (N) InventoryItem
Equipment (1) ── has ──> (N) MaintenanceSchedule
Equipment (1) ── has ──> (N) MaintenanceRecord
Equipment (1) ── has ──> (N) Document (manuals, warranties)
Equipment (1) ── from ─> (1) EquipmentTemplate (optional)
Boat (1) ──── from ───> (1) BoatModelTemplate (optional)
```

### 3.2 Boat Profile

The boat profile is keyed to MMSI — the universally unique 9-digit identifier broadcast by every AIS transponder and used by DSC radio calling. MMSI is the natural primary key because it is already present in AIS data, VHF/DSC systems, and vessel registrations worldwide.

```
boat:
  id:                   uuid            # internal primary key
  mmsi:                 string(9)       # primary external identifier, globally unique
  name:                 string          # vessel name
  call_sign:            string          # radio call sign (assigned with MMSI)
  imo_number:           string(7)       # IMO number (commercial vessels, optional)
  hin:                  string(12)      # Hull Identification Number (US boats, optional)
  official_number:      string          # flag state registration number
  flag_state:           string          # ISO 3166-1 alpha-2 country code
  port_of_registry:     string          # home port

  # Vessel specs
  vessel_type:          enum            # sailing_monohull, sailing_catamaran, sailing_trimaran, motor_sail
  hull_type:            enum            # monohull, catamaran, trimaran
  hull_material:        enum            # fibreglass, aluminium, steel, wood, composite, ferro_cement
  rig_type:             enum            # sloop, cutter, ketch, schooner, cat_rig, junk
  manufacturer:         string          # e.g., "Lagoon", "Beneteau", "Hallberg-Rassy"
  model:                string          # e.g., "42", "Oceanis 46.1", "HR 40"
  year_built:           integer         # year of manufacture
  year_refit:           integer         # year of last major refit (optional)

  # Dimensions
  loa:                  float           # length overall (metres)
  lwl:                  float           # length waterline (metres)
  beam:                 float           # maximum beam (metres)
  draft:                float           # maximum draft (metres)
  draft_min:            float           # minimum draft for lifting/swing keel (optional)
  displacement:         float           # displacement (kg)
  ballast:              float           # ballast weight (kg, optional)
  air_draft:            float           # height above waterline to top of mast (metres)

  # Capacities
  fuel_capacity:        float           # total fuel capacity (litres)
  water_capacity:       float           # total fresh water capacity (litres)
  holding_capacity:     float           # total black water capacity (litres)
  berths:               integer         # number of berths
  cabins:               integer         # number of cabins
  heads:                integer         # number of heads

  # Performance (used by passage planner, weather routing)
  max_speed:            float           # maximum hull speed (knots)
  cruising_speed:       float           # typical cruising speed under power (knots)
  fuel_consumption:     float           # fuel consumption at cruising speed (litres/hour)
  fuel_consumption_idle: float          # fuel consumption at idle (litres/hour, optional)

  # Electrical (used by energy planner)
  voltage_system:       enum            # 12v, 24v, 48v
  shore_power_voltage:  enum            # 110v_60hz, 230v_50hz, dual

  # Metadata
  owner_id:             uuid            # references user
  template_id:          uuid            # references boat_model_template (optional)
  photo_url:            string          # primary boat photo
  notes:                text            # free-form owner notes
  created_at:           timestamp
  updated_at:           timestamp
  sync_version:         integer         # for hub-spoke sync conflict resolution
```

### 3.3 Equipment Registry

Equipment is organised by system category. Each piece of equipment has identity, specifications, and links to maintenance schedules and firmware tracking.

```
equipment:
  id:                   uuid
  boat_id:              uuid            # references boat
  template_id:          uuid            # references equipment_template (optional)

  # Identity
  name:                 string          # user-facing name, e.g., "Port Engine"
  system:               enum            # propulsion, electrical, water, safety, navigation, rigging, plumbing, communication, climate, entertainment
  subsystem:            string          # freeform, e.g., "solar", "battery", "engine", "watermaker", "liferaft"
  category:             string          # freeform, e.g., "charge_controller", "battery_monitor", "diesel_engine"

  # Manufacturer details
  manufacturer:         string          # e.g., "Victron Energy", "Yanmar", "Spectra"
  model:                string          # e.g., "SmartSolar MPPT 150/35", "4JH45", "Ventura 150T"
  serial_number:        string
  part_number:          string          # manufacturer part/SKU number

  # Installation
  install_date:         date
  install_hours:        float           # engine/runtime hours at installation (optional)
  location:             string          # where on the boat, e.g., "port engine room", "bimini top", "lazarette"
  zone:                 string          # for boat plan SVG mapping, e.g., "engine_room_port", "electrical_panel"

  # Specifications (type-dependent, stored as JSONB)
  specs:                jsonb           # flexible key-value specs populated from template or manual entry
  # Examples by category:
  #   charge_controller: { max_pv_voltage: 150, max_charge_current: 35, rated_power: 1000 }
  #   diesel_engine: { displacement_cc: 2190, cylinders: 4, max_power_hp: 45, max_rpm: 3400 }
  #   battery_bank: { chemistry: "lifepo4", capacity_ah: 400, voltage: 12.8, cells: 4, bms: true }
  #   watermaker: { output_lph: 25, power_draw_w: 350, membrane_type: "filmtec" }
  #   solar_panel: { watts_stc: 200, vmp: 37.2, imp: 5.38, cells: 60, type: "monocrystalline" }
  #   liferaft: { capacity_persons: 6, type: "offshore", last_service: "2025-06-15", next_service: "2026-06-15" }

  # Firmware (linked to firmware tracker, 6.11b)
  firmware_version:     string          # currently installed firmware version
  firmware_auto_detect: boolean         # true if firmware version is auto-detected from NMEA 2000 PGN 126996

  # Data model path (links equipment to live instrument data)
  data_path:            string          # e.g., "propulsion/engines/port", "electrical/solar/array_1"

  # Status
  status:               enum            # active, decommissioned, in_storage, awaiting_install
  warranty_expiry:      date
  notes:                text

  created_at:           timestamp
  updated_at:           timestamp
  sync_version:         integer
```

### 3.4 Maintenance Schedule

Defines recurring or one-off maintenance tasks attached to a piece of equipment.

```
maintenance_schedule:
  id:                   uuid
  equipment_id:         uuid            # references equipment
  boat_id:              uuid            # references boat (denormalised for query efficiency)

  # Task definition
  name:                 string          # e.g., "Oil & filter change", "Impeller replacement", "Antifoul"
  description:          text            # detailed instructions or notes
  priority:             enum            # critical, high, normal, low

  # Trigger — at least one must be set
  interval_hours:       float           # engine/runtime hours between services (e.g., 200)
  interval_months:      integer         # calendar months between services (e.g., 12)
  interval_miles:       float           # nautical miles between services (optional)
  seasonal:             string          # season identifier, e.g., "pre_winter", "pre_season", "mid_season"

  # Parts and cost
  parts:                jsonb           # list of { part_name, part_number, quantity, source }
  estimated_duration:   integer         # estimated time in minutes
  estimated_cost:       float           # estimated cost in user's currency
  currency:             string          # ISO 4217 currency code

  # State
  last_completed:       timestamp       # when this task was last done
  last_completed_hours: float           # engine hours when last done (if hour-based)
  next_due:             timestamp       # computed: last_completed + interval
  next_due_hours:       float           # computed: last_completed_hours + interval_hours
  is_overdue:           boolean         # computed: now > next_due or current_hours > next_due_hours

  created_at:           timestamp
  updated_at:           timestamp
  sync_version:         integer
```

### 3.5 Maintenance Record

A log entry for completed maintenance work.

```
maintenance_record:
  id:                   uuid
  equipment_id:         uuid            # references equipment
  schedule_id:          uuid            # references maintenance_schedule (optional, null for ad-hoc work)
  boat_id:              uuid            # references boat

  # What was done
  title:                string          # e.g., "Port engine oil change"
  description:          text            # detailed notes on work performed
  performed_by:         string          # who did the work (owner, yard name, mechanic)
  date_performed:       date
  engine_hours:         float           # engine hours at time of service (if applicable)

  # Parts used
  parts_used:           jsonb           # list of { part_name, part_number, quantity, cost }
  labour_hours:         float
  total_cost:           float
  currency:             string

  # Location
  location:             string          # where the work was done, e.g., "Marina Cienfuegos, Cuba"
  latitude:             float
  longitude:            float

  # Attachments
  photos:               jsonb           # list of storage URLs
  receipts:             jsonb           # list of storage URLs
  notes:                text

  created_at:           timestamp
  updated_at:           timestamp
  sync_version:         integer
```

### 3.6 Tank

Tanks are separate from equipment because they have live-data characteristics (current level, consumption rate) alongside static configuration.

```
tank:
  id:                   uuid
  boat_id:              uuid
  name:                 string          # e.g., "Port fuel tank", "Forward water tank"
  type:                 enum            # fuel, freshwater, blackwater, greywater, lpg
  capacity:             float           # litres
  location:             string          # e.g., "port hull", "starboard hull"
  sensor_type:          string          # e.g., "resistive", "capacitive", "ultrasonic", "none"
  data_path:            string          # e.g., "tanks/fuel/port" — links to live data model
  notes:                text

  created_at:           timestamp
  updated_at:           timestamp
  sync_version:         integer
```

Live tank data (current level %, consumption rate, time remaining) comes from the real-time data model via the `data_path` link, not from this table. This table holds the static configuration.

### 3.7 Document

```
document:
  id:                   uuid
  boat_id:              uuid
  equipment_id:         uuid            # optional — links to specific equipment

  name:                 string          # e.g., "Registration Certificate", "Yanmar 4JH45 Manual"
  category:             enum            # registration, insurance, survey, manual, warranty, certificate, receipt, other
  file_url:             string          # Supabase Storage URL (hub) or local file path (spoke)
  file_type:            string          # MIME type
  file_size:            integer         # bytes
  expiry_date:          date            # for insurance, registration, safety certificates
  issuing_authority:    string          # e.g., "MCA", "USCG", "Bureau Veritas"
  document_number:      string          # policy number, certificate number, etc.
  notes:                text

  created_at:           timestamp
  updated_at:           timestamp
  sync_version:         integer
```

### 3.8 Inventory Item

```
inventory_item:
  id:                   uuid
  boat_id:              uuid
  equipment_id:         uuid            # optional — links to the equipment this spare is for

  name:                 string          # e.g., "Yanmar oil filter", "Size 1 impeller", "Zinc anode M8"
  category:             enum            # spare_part, consumable, safety_equipment, tool, general
  part_number:          string
  manufacturer:         string
  quantity:             integer
  quantity_minimum:     integer         # reorder alert when quantity drops below this
  location_aboard:      string          # where it is stored, e.g., "port lazarette bin 3"
  expiry_date:          date            # for flares, batteries, medical supplies
  notes:                text

  created_at:           timestamp
  updated_at:           timestamp
  sync_version:         integer
```

### 3.9 Boat Model Template

Community-maintained templates that pre-populate boat specs and factory equipment when a user selects their boat model.

```
boat_model_template:
  id:                   uuid
  manufacturer:         string          # e.g., "Lagoon"
  model:                string          # e.g., "42"
  year_start:           integer         # first model year
  year_end:             integer         # last model year (null if still in production)
  variant:              string          # e.g., "Owner Version", "3-cabin", "4-cabin"

  # Pre-populated boat specs
  default_specs:        jsonb           # matches boat profile fields (loa, beam, draft, etc.)

  # Factory equipment list
  default_equipment:    jsonb           # list of equipment_template references with default locations

  # Metadata
  contributed_by:       uuid            # user who created/maintained this template
  verified:             boolean         # community-verified accuracy
  usage_count:          integer         # how many boats use this template (for ranking)
  notes:                text

  created_at:           timestamp
  updated_at:           timestamp
```

### 3.10 Equipment Template

Community-maintained templates for common marine equipment. When a user adds a "Victron SmartSolar MPPT 150/35", the template pre-populates manufacturer, model, specs, typical maintenance schedules, and links to the firmware tracker.

```
equipment_template:
  id:                   uuid
  manufacturer:         string
  model:                string
  category:             string          # e.g., "charge_controller", "diesel_engine", "watermaker"
  system:               enum            # propulsion, electrical, water, safety, navigation, etc.

  # Pre-populated specs
  default_specs:        jsonb           # type-dependent specifications
  default_maintenance:  jsonb           # list of maintenance schedule templates
  manual_url:           string          # link to manufacturer's manual
  firmware_product_id:  string          # links to firmware tracker product registry

  # Metadata
  contributed_by:       uuid
  verified:             boolean
  usage_count:          integer
  notes:                text

  created_at:           timestamp
  updated_at:           timestamp
```

### 3.11 System Categories

Equipment is organised into these top-level systems, each with typical subsystems:

| System | Subsystems | Examples |
|--------|-----------|----------|
| **Propulsion** | engine, transmission, propeller, saildrive, shaft, fuel_system, exhaust | Yanmar 4JH45, Max-Prop, Volvo Saildrive 130S |
| **Electrical** | battery, solar, charge_controller, inverter, charger, alternator, dc_dc, bms, shore_power, generator, wind_generator | Victron SmartSolar, Battle Born 100Ah, Mastervolt Mass Combi |
| **Water** | watermaker, freshwater_pump, water_heater, shower_sump | Spectra Ventura 150T, Whale Gulper |
| **Safety** | liferaft, epirb, plb, fire_extinguisher, flares, life_jackets, man_overboard, first_aid, jacklines, harnesses | ACR GlobalFix V5, Ocean Signal rescueME |
| **Navigation** | chartplotter, radar, ais, gps, compass, autopilot, depth, wind, speed, vhf, ssb | Raymarine Axiom 12, B&G Vulcan, ICOM M510 |
| **Rigging** | mast, boom, standing_rigging, running_rigging, sails, winches, furler, traveller | Harken winches, Facnor furler, North Sails |
| **Plumbing** | seacock, hose, through_hull, bilge_pump, toilet, holding_tank_pump | Groco seacocks, Jabsco head |
| **Communication** | satellite, cellular, wifi_router, antenna | Starlink Mini, Iridium GO!, Pepwave |
| **Climate** | air_conditioning, heater, fan, dehumidifier | Marine Air, Webasto, Eberspacher |
| **Entertainment** | stereo, speakers, tv, streaming | Fusion Apollo, JL Audio |

---

## 4. UI/UX

All Boat Management screens render inside the MFD shell. The interface follows the blueprint aesthetic: dark background (#1a1a2e), fine grid lines (#2d2d4a), monospace headings (Space Mono), clean body text (Inter).

### 4.1 Key Screens

**Boat Profile**
- Single-page form for vessel identity and specs
- MMSI entry field with auto-populate button (fetches from AIS data)
- Boat model template selector with search (type-ahead)
- Photo upload
- Tabs or sections: Identity, Dimensions, Capacities, Performance, Electrical

**Equipment Registry**
- List view grouped by system category (propulsion, electrical, water, etc.)
- Each system category is collapsible with equipment count and status summary
- Equipment cards show: name, manufacturer/model, status badge, maintenance status indicator (green = OK, coral = due soon, red = overdue)
- Add equipment: search equipment template library (type-ahead) or manual entry
- Filter by system, status, maintenance status

**Equipment Detail**
- Full specifications, installation details, firmware version
- Maintenance tab: upcoming schedules, full service history timeline
- Documents tab: linked manuals, warranty documents
- Spares tab: linked inventory items
- Live data tab: if equipment has a `data_path`, show real-time values from the instrument data model (RPM, voltage, output, etc.)

**Boat Plan View**
- Interactive SVG schematic of the vessel (top-down or profile view)
- Zones highlighted by system (colour-coded: propulsion, electrical, water, etc.)
- Tap a zone to see equipment in that area
- Overlay indicators for active alerts (pulsing coral dot on problem areas)
- Template SVG plans for common boat layouts; community can contribute new layouts

**Maintenance Dashboard**
- Timeline view of upcoming maintenance sorted by urgency
- Overdue items at the top in coral (#f87171)
- Due-soon items (within 30 days or 50 hours) in amber
- Cards show: task name, equipment name, trigger info ("due in 47 engine hours"), last completed date
- Quick-log button to record completion directly from the dashboard
- Calendar view option for date-based maintenance
- Filters: by system, by priority, by trigger type (hours, calendar, seasonal)

**Tank Overview**
- Visual tank level display for all tanks
- Horizontal bar gauges with percentage and litres remaining
- Consumption rate and time-remaining estimates (when live data is available via spoke)
- Colour coding: green > 50%, amber 20-50%, coral < 20%
- Tap for refill history

**Engine Panel**
- Side-by-side engine cards (for multi-engine boats)
- Live gauges when connected to spoke: RPM, oil pressure, coolant temp, exhaust temp
- Static view when hub-only: engine hours, service status, next maintenance
- Fuel consumption rate and total consumed

**Document Library**
- Filterable list by category (registration, insurance, manuals, certificates)
- Expiry date badges with alerts for approaching/expired documents
- Inline PDF/image viewer
- Quick-share button for port check-in documents

**Inventory**
- Searchable list of spares and consumables
- Grouped by linked equipment or by category
- Low-stock alerts (quantity below minimum)
- Expiry date tracking for safety equipment

### 4.2 Interaction Patterns

- **Progressive disclosure:** Equipment list shows summary cards; tap for full detail. Maintenance dashboard shows next action; expand for full history.
- **Non-technical friendly:** Tank levels, maintenance due dates, and document access are immediately understandable. Technical specs are one level deeper.
- **Quick-log maintenance:** A prominent action button on the maintenance dashboard and equipment detail screens. Pre-fills from the schedule template. User confirms date, notes, and done.
- **Template-driven entry:** When adding equipment, the system searches the template library first. Selecting a template pre-fills specs, maintenance schedules, and manual links. The user edits only what differs from the template.
- **Offline-first:** All views work with local SQLite data on the spoke. Adding, editing, and logging maintenance all work offline and sync when connectivity is available.

---

## 5. API Endpoints

REST API served by the Go backend. All endpoints require authentication (JWT). Versioned under `/api/v1/`.

### 5.1 Boat Profile

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/boats` | List boats owned by authenticated user |
| `POST` | `/boats` | Create a new boat profile |
| `GET` | `/boats/:boat_id` | Get boat profile |
| `PUT` | `/boats/:boat_id` | Update boat profile |
| `DELETE` | `/boats/:boat_id` | Delete boat and all associated data |
| `GET` | `/boats/lookup/:mmsi` | Auto-populate boat details from AIS data by MMSI |

### 5.2 Equipment

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/boats/:boat_id/equipment` | List all equipment, filterable by `?system=` and `?status=` |
| `POST` | `/boats/:boat_id/equipment` | Add equipment (optionally from template) |
| `GET` | `/boats/:boat_id/equipment/:equip_id` | Get equipment detail |
| `PUT` | `/boats/:boat_id/equipment/:equip_id` | Update equipment |
| `DELETE` | `/boats/:boat_id/equipment/:equip_id` | Remove equipment (soft delete, marks as decommissioned) |

### 5.3 Maintenance

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/boats/:boat_id/maintenance/schedules` | List all maintenance schedules |
| `POST` | `/boats/:boat_id/maintenance/schedules` | Create a maintenance schedule |
| `PUT` | `/boats/:boat_id/maintenance/schedules/:sched_id` | Update schedule |
| `DELETE` | `/boats/:boat_id/maintenance/schedules/:sched_id` | Delete schedule |
| `GET` | `/boats/:boat_id/maintenance/records` | List maintenance records, filterable by `?equipment_id=` |
| `POST` | `/boats/:boat_id/maintenance/records` | Log a completed maintenance task |
| `GET` | `/boats/:boat_id/maintenance/upcoming` | Computed: all upcoming/overdue tasks sorted by urgency |
| `GET` | `/boats/:boat_id/maintenance/export` | Export full maintenance history (CSV or JSON) |

### 5.4 Tanks

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/boats/:boat_id/tanks` | List all tanks with current levels (live data if spoke) |
| `POST` | `/boats/:boat_id/tanks` | Add a tank |
| `PUT` | `/boats/:boat_id/tanks/:tank_id` | Update tank configuration |
| `DELETE` | `/boats/:boat_id/tanks/:tank_id` | Remove tank |

### 5.5 Documents

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/boats/:boat_id/documents` | List documents, filterable by `?category=` |
| `POST` | `/boats/:boat_id/documents` | Upload a document (multipart form) |
| `GET` | `/boats/:boat_id/documents/:doc_id` | Get document metadata |
| `GET` | `/boats/:boat_id/documents/:doc_id/download` | Download document file |
| `PUT` | `/boats/:boat_id/documents/:doc_id` | Update document metadata |
| `DELETE` | `/boats/:boat_id/documents/:doc_id` | Delete document |

### 5.6 Inventory

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/boats/:boat_id/inventory` | List inventory items, filterable by `?category=` |
| `POST` | `/boats/:boat_id/inventory` | Add inventory item |
| `PUT` | `/boats/:boat_id/inventory/:item_id` | Update inventory item |
| `DELETE` | `/boats/:boat_id/inventory/:item_id` | Remove inventory item |
| `GET` | `/boats/:boat_id/inventory/low-stock` | Items where quantity <= quantity_minimum |
| `GET` | `/boats/:boat_id/inventory/expiring` | Items with expiry_date within next 90 days |

### 5.7 Templates

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/templates/boats` | Search boat model templates, `?q=lagoon 42` |
| `GET` | `/templates/boats/:template_id` | Get full template with default specs and equipment list |
| `POST` | `/templates/boats` | Contribute a new boat model template |
| `GET` | `/templates/equipment` | Search equipment templates, `?q=victron smartsolar` |
| `GET` | `/templates/equipment/:template_id` | Get full equipment template with specs and maintenance |
| `POST` | `/templates/equipment` | Contribute a new equipment template |

---

## 6. Hub vs Spoke Behavior

### 6.1 What Runs Where

| Capability | Hub (Cloud) | Spoke (On-Boat) |
|-----------|-------------|-----------------|
| Boat profile CRUD | Yes | Yes (offline) |
| Equipment registry CRUD | Yes | Yes (offline) |
| Maintenance scheduling & logging | Yes | Yes (offline) |
| Document storage | Supabase Storage | Local filesystem |
| Inventory tracking | Yes | Yes (offline) |
| Template library (read) | Canonical source | Cached subset |
| Template contributions (write) | Yes | Queued, synced to hub |
| Live instrument data (RPM, tanks, etc.) | No | Yes (from protocol adapters) |
| Maintenance hour-based triggers | No (no live engine data) | Yes (reads engine hours from data model) |
| MMSI auto-populate | Yes (AIS data API) | Yes (from on-board AIS receiver) |
| NMEA 2000 equipment auto-detect | No | Yes (PGN 126996 Product Information) |
| Firmware version auto-detect | No | Yes (PGN 126996) |

### 6.2 Sync Strategy

The boat is the source of truth for its own data. Boat profile, equipment, maintenance, and inventory sync bidirectionally between hub and spoke.

**Sync direction:**

| Data | Direction | Conflict Resolution |
|------|-----------|-------------------|
| Boat profile | Bidirectional | Last-write-wins (HLC timestamp) |
| Equipment registry | Bidirectional | Last-write-wins (HLC timestamp) |
| Maintenance schedules | Bidirectional | Last-write-wins |
| Maintenance records | Spoke to hub (additive) | Merge — both sides keep additions |
| Documents (metadata) | Bidirectional | Last-write-wins |
| Document files | Hub to spoke (cached) | Hub is canonical for file storage |
| Inventory items | Bidirectional | Last-write-wins |
| Templates | Hub to spoke (read-only) | Hub is canonical |
| Live instrument data | Spoke only | Not synced (time-series upload is opt-in) |

**Spoke-first scenarios:**

When a sailor on the boat adds equipment, logs maintenance, or updates a tank configuration while offline, the changes are written to local SQLite and queued in `sync_queue`. On next connectivity, the queue drains to the hub. If the same record was edited on the hub (e.g., by the owner on their phone via cellular), HLC timestamps determine the winner.

**NMEA 2000 auto-discovery:**

The spoke's protocol adapter can enumerate all devices on the NMEA 2000 backbone by sending ISO Request (PGN 59904) for Product Information (PGN 126996). This returns manufacturer, model, serial number, and firmware version for every NMEA 2000 device. The spoke can automatically suggest equipment registry entries based on discovered devices, pre-linked to their data model paths. The user confirms or dismisses each suggestion.

---

## 7. AI Agent Integration

The **Engineer agent** is the primary consumer of Boat Management data. It monitors systems, advises on maintenance, and answers questions about the boat's equipment and status.

### 7.1 Data Subscriptions

The Engineer agent subscribes to:

- `equipment/*` — full equipment registry
- `maintenance/schedules/*` — all maintenance schedules and due dates
- `maintenance/records/*` — service history
- `tanks/*` — tank configurations and live levels
- `propulsion/engines/*` — live engine parameters (spoke only)
- `electrical/batteries/*` — battery status (spoke only)

### 7.2 Tools Available to Engineer

| Tool | Description |
|------|-------------|
| `get_equipment_by_system` | List equipment filtered by system category |
| `get_maintenance_upcoming` | Get upcoming/overdue maintenance sorted by urgency |
| `log_maintenance` | Record a completed maintenance task (with user confirmation) |
| `get_tank_levels` | Current tank levels and consumption rates |
| `get_engine_status` | Live engine parameters (spoke only) |
| `get_equipment_specs` | Full specifications for a piece of equipment |
| `search_equipment_templates` | Find equipment templates by manufacturer/model |
| `get_documents` | Retrieve documents by category or equipment |
| `get_inventory` | Check spare parts and consumables |
| `get_maintenance_history` | Full service history for an equipment item |

### 7.3 Proactive Behaviors

The Engineer agent uses Boat Management data to proactively alert and advise:

- **Maintenance alerts:** "Port engine oil change is due in 47 hours. You have two oil filters in inventory." 
- **Cross-system reasoning:** When the passage planner estimates 180 engine hours for a planned voyage, Engineer checks if any hour-based maintenance falls within that window and warns before departure.
- **Anomaly detection (spoke):** If live engine coolant temperature trends upward over multiple passages, Engineer flags it as a potential cooling system issue and suggests checking the impeller service history.
- **Document expiry:** "Your insurance policy expires in 30 days. The document is in your library."
- **Safety audit:** Before an ocean crossing, Engineer can review all safety equipment expiry dates and maintenance status, flagging anything overdue or expiring during the passage.
- **Inventory management:** "You used the last Yanmar oil filter during the last service. Recommend ordering replacement."

### 7.4 RAG Integration

Equipment manuals stored as documents are ingested into the RAG pipeline. The Engineer agent can answer questions like "What is the torque spec for the Yanmar 4JH45 cylinder head bolts?" by querying the embedded manual content. This works on both hub (pgvector) and spoke (sqlite-vec) when the relevant manual has been synced.

### 7.5 MCP Exposure

The Boat Management data model is exposed via the MCP server, allowing external AI tools (ChatGPT, Gemini, other MCP clients) to query:

- Boat profile and specifications
- Equipment registry
- Maintenance status and history
- Tank configurations
- Document metadata

This enables scenarios like asking an external AI assistant "What maintenance is due on my boat?" and having it query Above Deck's MCP server for the answer.

---

## 8. Dependencies

Boat Management is a foundational feature. Many other features depend on the equipment registry and boat profile as their source of truth.

### 8.1 Features That Depend on Boat Management

| Feature | What It Reads | Why |
|---------|--------------|-----|
| **6.11b Firmware Tracking** | Equipment registry (manufacturer, model, firmware_version) | Matches installed equipment against firmware version database to identify available updates |
| **6.12 Energy & Power** | Battery specs (chemistry, capacity, voltage), solar panel specs (watts, Vmp, Imp), inverter/charger specs, voltage system | Accurate energy balance calculations require real equipment specifications, not guesses |
| **6.4 Passage Resources** | Engine fuel consumption, tank capacities, watermaker output, engine service intervals | Fuel planning, water planning, and "service due during passage" warnings |
| **6.2 Route Planning** | Draft, displacement, cruising speed, fuel consumption | Depth clearance checks, ETA calculations, fuel range |
| **6.6 Weather** | Boat polars / performance characteristics | Weather routing optimisation |
| **6.14 Instrument Dashboard** | Equipment data paths | Maps live instrument data to the correct equipment for labelling and context |
| **6.13 Digital Switching** | Equipment registry for switch modules, circuit assignments | Knows which circuits control which equipment |
| **6.8 Cruising Administration** | Registration, insurance, vessel documents | Port check-in document access |
| **AI Agents (all)** | Boat profile, equipment, maintenance | Agents need to know the boat to give relevant advice |
| **MCP Server** | Full data model | External AI tools query boat configuration |

### 8.2 External Dependencies

| Dependency | Purpose |
|-----------|---------|
| AIS data source (MarineTraffic API, on-board AIS receiver) | MMSI auto-populate for boat profile |
| NMEA 2000 protocol adapter | Equipment auto-discovery (PGN 126996), live engine/tank data |
| Victron protocol adapter | Battery, solar, inverter live data |
| Supabase Storage | Document file storage on hub |
| Community template contributions | Boat model and equipment template library growth |

---

## 9. Open Questions

1. **Multi-owner boats:** Some boats have multiple people who need management access (couples, co-owners, paid crew). The current model has a single `owner_id`. Should we add a `boat_members` table with role-based access (owner, crew, guest)?

2. **Boat model template seeding:** What is the minimum viable set of boat model templates for launch? Should we seed from a public data source (e.g., SailboatData.com, which has specs for thousands of models) or start with a manually curated set of the 50 most popular cruising boats?

3. **Engine hours source of truth:** When the spoke has live engine hours from NMEA 2000, should those automatically update the equipment record, or should the user confirm? Auto-update is convenient but risks bad data from a misconfigured sensor.

4. **Boat plan SVG:** How should the interactive boat plan be implemented? Options: (a) community-contributed SVG templates per boat model, (b) a generic parametric generator based on hull type and dimensions, (c) a drawing tool where users create their own layout. Option (a) produces the best results but requires community contribution. Option (b) is faster to ship.

5. **Equipment decommissioning vs. deletion:** When equipment is removed from the boat (sold, replaced), should it be soft-deleted (preserving service history) or moved to an archive? Soft delete is proposed in the data model above, but the UX needs to handle the "I replaced my autopilot" workflow cleanly.

6. **Units:** The spec uses metric throughout (metres, litres, kg, celsius). The UI must support user-preferred units (imperial, metric) with conversion at the display layer. How do we handle mixed-unit equipment specs from templates (e.g., US-sourced templates in feet/gallons)?

7. **Template governance:** As the community grows, how do we handle quality control for contributed templates? Options: (a) verified flag set by trusted community members, (b) usage count as a quality signal, (c) moderation queue, (d) all of the above.

8. **Privacy:** Some sailors will not want their MMSI, equipment list, or maintenance records visible to other users. The default should be private. What, if anything, should be optionally shareable (e.g., sharing maintenance history with a prospective buyer, sharing equipment list with a marine surveyor)?

9. **Warranty tracking integration:** Should warranty expiry dates trigger reminders? Should we track warranty claims as a type of maintenance record?

10. **Import from existing tools:** Some sailors maintain equipment and maintenance data in spreadsheets or apps like Maintainance (iOS), Boat Beacon, or custom databases. Should we provide CSV import, or is manual entry acceptable for launch?
