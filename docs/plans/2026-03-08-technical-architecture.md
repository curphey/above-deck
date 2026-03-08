# Above Deck — Technical Architecture

**Date**: 2026-03-08
**Status**: Draft — awaiting approval

---

## Architecture Overview

Above Deck is a PWA-first sailing platform built on a modern JAMstack architecture with a Go backend API. Static content (blog, knowledge base, changelog) is pre-rendered by Astro. Interactive app features (map, calculators, equipment registry) run as React islands with Mantine components. All data lives in Supabase (PostgreSQL + PostGIS) with real-time subscriptions for chat and collaboration.

```
┌─────────────────────────────────────────────────────────┐
│                        Client (PWA)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Astro SSG    │  │ React Islands│  │ Service Worker│  │
│  │  (blog, docs, │  │ (map, app,   │  │ (offline,     │  │
│  │   changelog)  │  │  calculators)│  │  cache, sync) │  │
│  └──────────────┘  └──────┬───────┘  └───────┬───────┘  │
│                           │                   │          │
│  ┌────────────────────────┴───────────────────┘          │
│  │  Mantine UI + Tabler Icons                            │
│  │  Mapbox GL JS + OpenSeaMap overlay                    │
│  │  Supabase JS Client (auth, DB, realtime, storage)     │
│  └──────────────────────┬────────────────────────────────┘
│                         │
└─────────────────────────┼───────────────────────────────┘
                          │ HTTPS
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
│  Supabase    │ │   Go API     │ │  External APIs   │
│  (DB, Auth,  │ │  (geospatial │ │  (Open-Meteo,    │
│   Realtime,  │ │   compute,   │ │   NOAA, AIS,     │
│   Storage)   │ │   GPX, AI)   │ │   ADMIRALTY)     │
└──────┬───────┘ └──────┬───────┘ └──────────────────┘
       │                │
       ▼                │
┌──────────────┐        │
│  PostgreSQL  │◄───────┘
│  + PostGIS   │
└──────────────┘
```

---

## Frontend Architecture

### Astro (Static Shell)

Astro handles all content pages with zero JavaScript by default:

- **Landing page** — Static HTML, email signup form
- **Blog** — MDX content collections, tag filtering, RSS generation
- **Knowledge base** — MDX articles, search index, category navigation
- **Changelog** — MDX entries, "what's new" badge logic
- **Research board** — Server-rendered list with client-side filtering (React island)

Astro's hybrid mode (`output: 'hybrid'`) allows SSR for dynamic pages (forum, admin) while keeping content pages fully static.

### React Islands (Interactive App)

Heavy interactive features mount as React islands within Astro pages:

| Island | Purpose |
|--------|---------|
| `MapView` | Mapbox GL JS map with OpenSeaMap overlay, route editing, POI layers, AIS, weather |
| `ItineraryPanel` | Day-by-day voyage timeline, drag-reorder legs, stop details |
| `EquipmentRegistry` | Card grid/list of equipment, service tracking, wizard |
| `EnergyCalculator` | Solar sizer, generation calculator, passage energy forecast |
| `ResourcePlanner` | Fuel/water/power projections, what-if scenarios |
| `ChatPanel` | Real-time messaging (DM, group, boat-to-boat) |
| `ForumThread` | Threaded discussion view |
| `ResearchCard` | Research board item with voting, status, contributions |
| `ProfileEditor` | User profile management with privacy controls |
| `AdminDashboard` | User management, moderation queues, analytics |
| `PassageLive` | Live tracking dashboard, resource monitoring, safety features |

### Mantine Theme

Custom Mantine theme defining the Above Deck design system:

```typescript
// theme.ts
const theme = createTheme({
  primaryColor: 'ocean',        // custom blue palette
  colors: {
    ocean: [...],               // primary — navigation, CTAs
    wind: [...],                // secondary — weather, conditions
    coral: [...],               // accent — alerts, warnings
    sand: [...],                // neutral — backgrounds, cards
  },
  fontFamily: 'Inter, system-ui, sans-serif',
  headings: { fontFamily: 'Inter, system-ui, sans-serif' },
  defaultRadius: 'md',
  components: {
    Card: { defaultProps: { shadow: 'sm', radius: 'md', withBorder: true } },
    Button: { defaultProps: { radius: 'md' } },
  },
});
```

### State Management

- **Supabase JS client** for all server state (DB reads/writes, auth, realtime subscriptions)
- **React Query (@tanstack/react-query)** for caching, optimistic updates, and offline sync
- **Zustand** for client-only UI state (map viewport, panel visibility, calculator inputs)
- No Redux — Supabase + React Query covers server state, Zustand covers UI state

### Offline Strategy

```
┌─────────────────────────────────────────┐
│              Service Worker              │
│                                          │
│  ┌──────────────┐  ┌─────────────────┐  │
│  │ Cache API    │  │ IndexedDB       │  │
│  │              │  │                 │  │
│  │ • App shell  │  │ • Routes/legs   │  │
│  │ • Static     │  │ • Equipment     │  │
│  │   assets     │  │ • POI cache     │  │
│  │ • Map tiles  │  │ • Log entries   │  │
│  │   (visited   │  │ • Positions     │  │
│  │    areas)    │  │ • Draft edits   │  │
│  │ • Weather    │  │                 │  │
│  │   snapshots  │  │ Sync queue:     │  │
│  └──────────────┘  │ • Pending       │  │
│                    │   mutations     │  │
│                    │ • Conflict      │  │
│                    │   resolution    │  │
│                    └─────────────────┘  │
└─────────────────────────────────────────┘
```

**Offline-capable features:**
- Equipment registry (full CRUD cached)
- Saved routes and itineraries
- POIs for planned route areas
- Calculator tools (fully client-side)
- Voyage log entries (queued for sync)
- GPS position logging (cached, synced on reconnect)

**Online-only features:**
- Weather forecasts (cached snapshots available offline)
- AIS live data
- Chat/messaging
- Community contributions (queued for sync)
- Map tiles for unvisited areas

**Sync strategy:**
- Mutations queued in IndexedDB when offline
- On reconnect: replay queue with conflict resolution
- Conflict strategy: last-write-wins for simple fields, merge for collections
- Visual indicator showing sync status ("2 changes pending sync")

---

## Backend Architecture

### Go API Server

The Go API handles compute-intensive operations that don't belong in the browser or in Supabase functions:

```
go-api/
├── cmd/
│   └── server/
│       └── main.go              # Entry point
├── internal/
│   ├── handler/                 # HTTP handlers
│   │   ├── routes.go            # Route planning & GPX
│   │   ├── weather.go           # Weather data aggregation
│   │   ├── tides.go             # Tide calculations
│   │   ├── resources.go         # Fuel/water/energy calculations
│   │   ├── ai.go                # Claude API proxy
│   │   └── gpx.go               # GPX import/export
│   ├── service/                 # Business logic
│   │   ├── routing.go           # Distance, bearing, ETA
│   │   ├── solar.go             # Solar irradiance calculations
│   │   ├── fuel.go              # Fuel consumption modeling
│   │   ├── water.go             # Water budget calculations
│   │   └── tides.go             # Harmonic tide predictions (Neaps port)
│   ├── geo/                     # Geospatial utilities
│   │   ├── distance.go          # Haversine, Vincenty
│   │   ├── bearing.go           # True/magnetic bearing
│   │   └── solar_position.go   # Sun position for solar calculations
│   ├── external/                # External API clients
│   │   ├── openmeteo.go         # Open-Meteo Marine API
│   │   ├── noaa.go              # NOAA tides/charts
│   │   ├── admiralty.go         # ADMIRALTY tides
│   │   ├── aisstream.go         # AIS WebSocket client
│   │   └── claude.go            # Claude API client
│   └── middleware/
│       ├── auth.go              # Supabase JWT verification
│       ├── ratelimit.go         # Rate limiting
│       └── cors.go              # CORS
├── pkg/
│   ├── gpx/                     # GPX parsing/generation
│   └── neaps/                   # Tide harmonic calculations (ported from TS)
└── go.mod
```

**Why Go for these operations:**
- GPX parsing/generation with large files
- Geospatial calculations (Haversine, great circle routes)
- Solar position/irradiance computation (CPU-intensive)
- Weather data aggregation across multiple legs
- Tide harmonic predictions (Neaps port)
- Claude API proxy (keeps API key server-side)

**What stays in Supabase (no Go needed):**
- CRUD operations (equipment, profiles, boats, POIs)
- Auth and user management
- Real-time subscriptions (chat, collaboration)
- File storage (photos, documents)
- Row-level security policies
- PostGIS spatial queries (nearby POIs, route bounding boxes)

### API Design

RESTful JSON API with versioning:

```
Base: /api/v1

# Route planning
POST   /routes/calculate          # Calculate distance, bearing, ETA for waypoints
POST   /routes/auto-stops         # Suggest stops along a route
POST   /routes/gpx/export         # Generate GPX file from route
POST   /routes/gpx/import         # Parse GPX file into route data

# Weather
GET    /weather/route?routeId=    # Weather along a route (aggregated from Open-Meteo)
GET    /weather/forecast?lat=&lon= # Point forecast
GET    /weather/window?routeId=   # Best departure window analysis

# Tides
GET    /tides/prediction?stationId=&date= # Tide prediction at station
GET    /tides/route?routeId=      # Tides at all waypoints along route
GET    /tides/gates?routeId=      # Tidal gate analysis

# Resource planning
POST   /resources/fuel             # Fuel calculation for a passage
POST   /resources/water            # Water budget for a passage
POST   /resources/energy           # Energy balance for a passage
POST   /resources/summary          # Combined resource summary

# Solar calculations
POST   /solar/size                 # System sizing recommendation
POST   /solar/generation           # Generation estimate for location/date
POST   /solar/passage              # Solar generation along a route

# AI
POST   /ai/plan                    # Natural language passage planning
POST   /ai/suggest                 # Route/POI suggestions
POST   /ai/chat                    # Conversational interaction

# Live tracking
POST   /tracking/position          # Log GPS position
GET    /tracking/beacon/:shareId   # Public beacon data (no auth)
GET    /tracking/fleet/:groupId    # Fleet positions
```

All authenticated endpoints verify Supabase JWT tokens. The Go API connects to the same Supabase PostgreSQL database for reads when needed.

---

## Database Architecture

### Supabase (PostgreSQL + PostGIS)

All tables use Supabase Row Level Security (RLS) policies for data access control.

### Core Schema

```sql
-- Users (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users primary key,
  display_name text,
  bio text,
  avatar_url text,
  location text,
  years_sailing integer,
  miles_logged integer,
  roles text[],                          -- ['skipper', 'crew', 'navigator']
  privacy_default text default 'private', -- 'private', 'group', 'public'
  sailing_thresholds jsonb,              -- {min_wind_kts: 8, min_angle_deg: 45}
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Certifications
create table certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null,                    -- 'RYA Yachtmaster', 'ICC', 'ASA 101', etc.
  issuer text,
  date_issued date,
  expiry_date date,
  certificate_number text,
  visibility text default 'private',     -- 'private', 'group', 'public'
  created_at timestamptz default now()
);

-- Vessels
create table vessels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  name text not null,
  boat_model_id uuid references boat_model_templates(id),
  boat_type text,                        -- 'monohull', 'catamaran'
  year integer,
  loa_m numeric,                         -- length overall in meters
  beam_m numeric,
  draft_m numeric,
  displacement_kg numeric,
  cruise_speed_kts numeric,
  fuel_tank_l numeric,
  water_tank_l numeric,
  mmsi text,                             -- AIS identifier
  call_sign text,                        -- VHF call sign
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Equipment
create table equipment (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid references vessels(id) on delete cascade,
  equipment_template_id uuid references equipment_templates(id),
  system text not null,                  -- 'propulsion', 'electrical', 'water', etc.
  equipment_type text not null,          -- 'engine', 'solar_panel', 'battery', etc.
  name text not null,
  make text,
  model text,
  install_date date,
  serial_number text,
  specs jsonb default '{}',             -- type-specific specs (fuel_rate, wattage, etc.)
  service_interval_hours integer,
  service_interval_months integer,
  current_hours numeric default 0,
  last_service_date date,
  last_service_hours numeric,
  status text default 'healthy',         -- 'healthy', 'attention', 'overdue'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Equipment Parts
create table equipment_parts (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid references equipment(id) on delete cascade,
  name text not null,
  part_number text,
  supplier text,
  notes text,
  created_at timestamptz default now()
);

-- Service History
create table service_records (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid references equipment(id) on delete cascade,
  service_date date not null,
  hours_at_service numeric,
  description text,
  parts_used text[],
  notes text,
  created_at timestamptz default now()
);

-- Template databases
create table boat_model_templates (
  id uuid primary key default gen_random_uuid(),
  manufacturer text not null,            -- 'Lagoon', 'Beneteau', 'Jeanneau'
  model text not null,                   -- '43', 'Oceanis 40.1'
  year_range text,                       -- '2018-2023'
  boat_type text,                        -- 'catamaran', 'monohull'
  default_specs jsonb not null,          -- LOA, beam, draft, tanks, etc.
  default_equipment jsonb not null,      -- array of equipment with specs
  known_options jsonb,                   -- upgradeable components
  source text,                           -- where data came from
  community_submitted boolean default false,
  approved boolean default true,
  created_at timestamptz default now()
);

create table equipment_templates (
  id uuid primary key default gen_random_uuid(),
  equipment_type text not null,
  manufacturer text not null,
  model text not null,
  default_specs jsonb not null,          -- type-specific defaults
  service_intervals jsonb,               -- recommended service schedule
  common_parts jsonb,                    -- parts with part numbers
  community_submitted boolean default false,
  approved boolean default true,
  created_at timestamptz default now()
);

-- Power consumers (default wattages)
create table power_consumer_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,                    -- 'Fridge', 'Autopilot', 'Chart plotter'
  default_watts numeric not null,
  typical_hours_per_day numeric,
  category text,                         -- 'navigation', 'comfort', 'safety'
  notes text,
  created_at timestamptz default now()
);
```

### Route & Passage Schema

```sql
-- Routes / Voyages
create table routes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  vessel_id uuid references vessels(id),
  title text not null,
  description text,
  status text default 'draft',           -- 'draft', 'planned', 'active', 'completed'
  departure_date timestamptz,
  total_distance_nm numeric,
  total_duration_hours numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Waypoints
create table waypoints (
  id uuid primary key default gen_random_uuid(),
  route_id uuid references routes(id) on delete cascade,
  position geography(Point, 4326) not null,
  sequence integer not null,
  name text,
  waypoint_type text,                    -- 'departure', 'stop', 'waypoint', 'arrival'
  day_number integer,                    -- which day of the voyage
  planned_arrival timestamptz,
  planned_departure timestamptz,
  notes text,
  poi_id uuid references pois(id),      -- linked POI if stopping
  created_at timestamptz default now()
);

-- Route Legs (between waypoints)
create table legs (
  id uuid primary key default gen_random_uuid(),
  route_id uuid references routes(id) on delete cascade,
  from_waypoint_id uuid references waypoints(id),
  to_waypoint_id uuid references waypoints(id),
  sequence integer not null,
  day_number integer,
  distance_nm numeric,
  bearing_deg numeric,
  estimated_duration_hours numeric,
  route_geometry geography(LineString, 4326),
  created_at timestamptz default now()
);

-- Crew assignments
create table route_crew (
  id uuid primary key default gen_random_uuid(),
  route_id uuid references routes(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'crew',              -- 'captain', 'crew'
  invited_at timestamptz default now(),
  accepted_at timestamptz,
  unique(route_id, user_id)
);

-- Crew comments/suggestions on waypoints
create table waypoint_comments (
  id uuid primary key default gen_random_uuid(),
  waypoint_id uuid references waypoints(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  comment text not null,
  comment_type text default 'comment',   -- 'comment', 'suggestion', 'concern'
  status text default 'pending',         -- 'pending', 'approved', 'rejected'
  created_at timestamptz default now()
);
```

### POI Schema

```sql
create table pois (
  id uuid primary key default gen_random_uuid(),
  position geography(Point, 4326) not null,
  name text not null,
  category text not null,                -- 'harbour', 'marina', 'anchorage', etc.
  description text,
  depth_m numeric,
  seabed_type text,
  shelter_rating jsonb,                  -- {N: 'good', S: 'poor', E: 'moderate', W: 'good'}
  facilities text[],                     -- ['water', 'fuel', 'showers', 'wifi']
  approach_notes text,
  local_knowledge text,                  -- "Good for North sector winds"
  source text,                           -- 'osm', 'noaa', 'gfw', 'community'
  source_id text,                        -- ID in source database
  community_submitted boolean default false,
  approved boolean default true,
  avg_rating numeric,
  review_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index pois_position_idx on pois using gist(position);
create index pois_category_idx on pois(category);

create table poi_reviews (
  id uuid primary key default gen_random_uuid(),
  poi_id uuid references pois(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  rating integer check (rating between 1 and 5),
  comment text,
  photos text[],                         -- storage URLs
  visited_date date,
  verified boolean default false,        -- was user actually there (GPS match)?
  created_at timestamptz default now()
);
```

### Social & Communication Schema

```sql
-- Groups
create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  group_type text,                       -- 'boat_crew', 'yacht_club', 'rally', 'friends'
  vessel_id uuid references vessels(id), -- if boat_crew type
  avatar_url text,
  created_by uuid references profiles(id),
  whatsapp_link text,                    -- linked WhatsApp group
  created_at timestamptz default now()
);

create table group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member',            -- 'admin', 'member'
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

-- Messaging
create table conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_type text not null,       -- 'direct', 'group', 'boat_to_boat'
  group_id uuid references groups(id),
  vessel_id uuid references vessels(id), -- for boat_to_boat
  title text,
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references profiles(id),
  content text not null,
  message_type text default 'text',      -- 'text', 'image', 'position', 'system'
  metadata jsonb,                        -- for position shares, etc.
  created_at timestamptz default now()
);

create index messages_conversation_idx on messages(conversation_id, created_at desc);
```

### Content & Community Schema

```sql
-- Forum
create table forum_topics (
  id uuid primary key default gen_random_uuid(),
  category text not null,                -- 'general', 'gear', 'routes', 'help', etc.
  title text not null,
  author_id uuid references profiles(id),
  pinned boolean default false,
  locked boolean default false,
  reply_count integer default 0,
  last_reply_at timestamptz,
  created_at timestamptz default now()
);

create table forum_replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references forum_topics(id) on delete cascade,
  author_id uuid references profiles(id),
  content text not null,
  parent_reply_id uuid references forum_replies(id), -- threading
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Research Board
create table research_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  author_id uuid references profiles(id),
  status text default 'draft',           -- 'draft', 'in_progress', 'complete'
  category text,
  vote_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table research_contributions (
  id uuid primary key default gen_random_uuid(),
  research_id uuid references research_items(id) on delete cascade,
  author_id uuid references profiles(id),
  content text not null,
  created_at timestamptz default now()
);

create table research_votes (
  id uuid primary key default gen_random_uuid(),
  research_id uuid references research_items(id) on delete cascade,
  user_id uuid references profiles(id),
  unique(research_id, user_id)
);

-- Newsletter subscribers
create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  user_id uuid references profiles(id),  -- null if not a registered user
  subscribed_at timestamptz default now(),
  unsubscribed_at timestamptz
);

-- Content moderation
create table moderation_queue (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,            -- 'poi_review', 'forum_reply', 'research', etc.
  content_id uuid not null,
  reported_by uuid references profiles(id),
  reason text,
  status text default 'pending',         -- 'pending', 'approved', 'rejected'
  moderator_id uuid references profiles(id),
  moderated_at timestamptz,
  notes text,
  created_at timestamptz default now()
);
```

### Live Tracking Schema

```sql
-- Position logs
create table position_logs (
  id uuid primary key default gen_random_uuid(),
  route_id uuid references routes(id) on delete cascade,
  vessel_id uuid references vessels(id),
  position geography(Point, 4326) not null,
  heading numeric,
  speed_kts numeric,
  timestamp timestamptz not null,
  source text default 'gps',             -- 'gps', 'manual', 'signalk'
  created_at timestamptz default now()
);

create index position_logs_route_time_idx on position_logs(route_id, timestamp desc);
create index position_logs_position_idx on position_logs using gist(position);

-- Live beacons (shareable tracking links)
create table beacons (
  id uuid primary key default gen_random_uuid(),
  route_id uuid references routes(id) on delete cascade,
  share_id text unique not null,         -- short URL-safe ID
  active boolean default true,
  update_interval_seconds integer default 300,
  created_at timestamptz default now()
);

-- Voyage log entries (manual)
create table log_entries (
  id uuid primary key default gen_random_uuid(),
  route_id uuid references routes(id) on delete cascade,
  user_id uuid references profiles(id),
  entry_type text,                       -- 'note', 'sail_change', 'weather', 'event', 'photo'
  content text,
  position geography(Point, 4326),
  photos text[],                         -- storage URLs
  timestamp timestamptz default now(),
  created_at timestamptz default now()
);
```

---

## Project Structure

```
above-deck/
├── packages/
│   ├── web/                          # Astro frontend
│   │   ├── src/
│   │   │   ├── components/           # React components
│   │   │   │   ├── map/              # MapView, layers, controls
│   │   │   │   ├── equipment/        # Equipment registry components
│   │   │   │   ├── calculators/      # Solar sizer, energy, fuel, water
│   │   │   │   ├── itinerary/        # Day-by-day view, timeline
│   │   │   │   ├── social/           # Chat, profiles, groups
│   │   │   │   ├── forum/            # Forum threads, replies
│   │   │   │   ├── research/         # Research board components
│   │   │   │   ├── live/             # Tracking, beacon, safety
│   │   │   │   ├── admin/            # Admin dashboard, moderation
│   │   │   │   ├── layout/           # Shell, navigation, sidebar
│   │   │   │   └── ui/               # Shared Mantine-based components
│   │   │   ├── content/              # MDX content collections
│   │   │   │   ├── blog/             # Blog posts
│   │   │   │   ├── changelog/        # Changelog entries
│   │   │   │   └── knowledge-base/   # How-to guides
│   │   │   ├── layouts/              # Astro layouts
│   │   │   ├── pages/                # Astro pages (routes)
│   │   │   │   ├── app/              # Authenticated app pages
│   │   │   │   ├── tools/            # Standalone calculators (no auth)
│   │   │   │   ├── blog/             # Blog listing + detail
│   │   │   │   ├── knowledge/        # Knowledge base
│   │   │   │   ├── research/         # Research board
│   │   │   │   ├── forum/            # Community forum
│   │   │   │   ├── admin/            # Admin pages
│   │   │   │   └── beacon/           # Public beacon tracking pages
│   │   │   ├── lib/                  # Client-side utilities
│   │   │   │   ├── supabase.ts       # Supabase client init
│   │   │   │   ├── hooks/            # React hooks (useEquipment, useRoute, etc.)
│   │   │   │   ├── stores/           # Zustand stores
│   │   │   │   ├── offline/          # Service worker, sync, cache
│   │   │   │   └── geo/              # Client-side geo utilities
│   │   │   ├── styles/               # Global styles, Mantine theme
│   │   │   └── types/                # TypeScript types
│   │   ├── public/
│   │   │   ├── sw.js                 # Service worker
│   │   │   ├── manifest.json         # PWA manifest
│   │   │   └── icons/                # PWA icons
│   │   ├── astro.config.mjs
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api/                          # Go backend
│       ├── cmd/server/main.go
│       ├── internal/
│       │   ├── handler/
│       │   ├── service/
│       │   ├── geo/
│       │   ├── external/
│       │   └── middleware/
│       ├── pkg/
│       │   ├── gpx/
│       │   └── neaps/
│       ├── go.mod
│       └── Dockerfile
│
├── supabase/
│   ├── migrations/                   # Database migrations
│   ├── seed.sql                      # Seed data (boat templates, equipment, POI)
│   └── config.toml                   # Supabase config
│
├── seed-data/
│   ├── boat-models/                  # JSON files per manufacturer
│   ├── equipment/                    # JSON files per equipment type
│   ├── power-consumers/              # Default power consumer list
│   └── pois/                         # OSM/NOAA/GFW import scripts
│
├── docs/                             # Documentation
├── research/                         # Research documents
├── tasks/                            # Work tracking
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Test + lint on PR
│       ├── deploy-web.yml            # Netlify deploy
│       └── deploy-api.yml            # Go API deploy
│
├── docker/
│   ├── web.Dockerfile               # Astro frontend container
│   ├── api.Dockerfile               # Go API container
│   └── nginx.conf                   # Reverse proxy config (if needed)
├── docker-compose.yml                # Full local dev stack
├── docker-compose.prod.yml           # Production compose (optional)
├── .dockerignore
├── CLAUDE.md
├── package.json                      # Workspace root (pnpm)
└── pnpm-workspace.yaml
```

### Package Manager & Monorepo

- **pnpm** workspaces for the monorepo
- `packages/web` — Astro frontend (TypeScript)
- `packages/api` — Go backend (separate build)
- Shared types could live in `packages/shared` if needed later

### Docker (From Day One)

The entire stack is Dockerized for consistent development and deployment.

**docker-compose.yml** runs the full local environment:

```yaml
services:
  web:
    build:
      context: .
      dockerfile: docker/web.Dockerfile
    ports:
      - "4321:4321"
    volumes:
      - ./packages/web:/app/packages/web
      - /app/packages/web/node_modules
    environment:
      - PUBLIC_SUPABASE_URL=http://supabase-kong:8000
      - PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    depends_on:
      - api

  api:
    build:
      context: .
      dockerfile: docker/api.Dockerfile
    ports:
      - "8080:8080"
    volumes:
      - ./packages/api:/app
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@supabase-db:5432/postgres
      - SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET}
    depends_on:
      - supabase-db

  supabase-db:
    image: supabase/postgres:15.6.1.143
    ports:
      - "54322:5432"
    environment:
      POSTGRES_PASSWORD: postgres
    volumes:
      - supabase-db-data:/var/lib/postgresql/data
      - ./supabase/migrations:/docker-entrypoint-initdb.d

  supabase-kong:
    image: kong:2.8.1
    # Supabase API gateway — routes auth, storage, realtime

  supabase-auth:
    image: supabase/gotrue:v2.164.0
    # Google OAuth provider

  supabase-realtime:
    image: supabase/realtime:v2.33.70
    # WebSocket subscriptions for chat, collaboration

  supabase-storage:
    image: supabase/storage-api:v1.12.3
    # Photo/file uploads

  analytics:
    image: ghcr.io/umami-software/umami:postgresql-latest
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@supabase-db:5432/umami
    depends_on:
      - supabase-db

volumes:
  supabase-db-data:
```

**Docker strategy:**
- **Development**: `docker compose up` runs everything locally — no external dependencies
- **Production**: Individual containers deployed to Fly.io (Go API), Netlify (web static build), Supabase Cloud (managed DB)
- **CI**: Docker images built and tested in GitHub Actions
- Hot-reload: volume mounts for packages/web and packages/api enable live development
- Supabase local: full Supabase stack (DB, Auth, Realtime, Storage) runs locally via Docker
- Analytics: Umami runs alongside for local analytics testing

---

## Authentication & Authorization

### Auth Flow

```
User → Google Sign-In → Supabase Auth → JWT → Client
                                          ↓
                                   Go API (verify JWT)
                                          ↓
                                   Supabase RLS (row-level security)
```

### Authorization Model

| Role | Capabilities |
|------|-------------|
| `anon` | View public content, use standalone calculators, view public beacons |
| `authenticated` | All anon + CRUD own data, join groups, post in forum, chat |
| `moderator` | All authenticated + review moderation queue, approve/reject content |
| `admin` | All moderator + user management, CMS, analytics, system config |

Roles stored in `profiles.role` and enforced via:
- Supabase RLS policies for database access
- Go API middleware for compute endpoints
- Astro middleware for page-level access (admin pages)

---

## Real-time Architecture

### Supabase Realtime Channels

| Channel | Purpose | Subscribers |
|---------|---------|-------------|
| `chat:{conversationId}` | Message delivery | Conversation participants |
| `route:{routeId}` | Route edit collaboration | Route crew |
| `beacon:{shareId}` | Live position updates | Beacon viewers |
| `fleet:{groupId}` | Fleet position aggregation | Group members |
| `notifications:{userId}` | User notifications | Individual user |

### Chat Implementation

- Messages stored in `messages` table
- Supabase Realtime broadcasts new messages to conversation subscribers
- Unread count tracked client-side with last-read timestamps
- Offline messages queued and sent on reconnect

---

## Deployment Architecture

### Local Development (Docker Compose)

```
docker compose up
  ├── web (Astro dev server, port 4321)
  ├── api (Go API, port 8080)
  ├── supabase-db (PostgreSQL + PostGIS, port 54322)
  ├── supabase-kong (API gateway, port 8000)
  ├── supabase-auth (Google OAuth)
  ├── supabase-realtime (WebSocket)
  ├── supabase-storage (file uploads)
  └── analytics (Umami, port 3000)
```

Everything runs locally with zero external dependencies. Hot-reload via volume mounts.

### Production

```
┌────────────────────────────┐
│         Netlify CDN        │
│  (Astro static + SSR)      │
│  • Static pages (blog, KB) │
│  • SSR pages (forum, app)  │
│  • PWA assets + SW         │
│  • Built from Docker image │
└─────────────┬──────────────┘
              │
              │ API calls
              ▼
┌────────────────────────────┐
│   Go API (Docker on Fly.io)│
│  • Docker image deployed   │
│  • Auto-scaling            │
│  • Connects to Supabase DB │
└─────────────┬──────────────┘
              │
              ▼
┌────────────────────────────┐
│     Supabase Cloud         │
│  • PostgreSQL + PostGIS    │
│  • Auth                    │
│  • Realtime                │
│  • Storage (photos)        │
└────────────────────────────┘
```

**Hosting costs (free tier):**
- Netlify: 100GB bandwidth/mo, 300 build min/mo
- Supabase: 500MB DB, 1GB storage, 2GB bandwidth, 50K monthly active users
- Fly.io: 3 shared VMs, 160GB bandwidth (or Railway free tier)

### CI/CD Pipeline

```
Push to main → GitHub Actions
  ├── Lint + Type Check (frontend)
  ├── Unit Tests (Vitest)
  ├── Go Tests
  ├── Build Docker images
  ├── Run integration tests against Docker compose
  ├── Build Astro
  ├── Deploy to Netlify (frontend)
  └── Deploy Docker image to Fly.io (Go API)

PR → GitHub Actions
  ├── Lint + Type Check
  ├── Unit Tests
  ├── Go Tests
  ├── Build Docker images (verify they build)
  ├── Playwright E2E (against docker compose preview)
  └── Preview deploy URL posted to PR
```

---

## Testing Strategy

| Layer | Tool | What |
|-------|------|------|
| Unit (frontend) | Vitest | Components, hooks, utilities, calculators |
| Unit (backend) | Go `testing` | Services, handlers, geo calculations |
| Integration | Vitest + Supabase local | Database queries, RLS policies, auth flows |
| E2E | Playwright | Critical user flows (auth, route planning, equipment CRUD) |
| Visual | Storybook (optional) | Component library documentation |

### TDD Workflow (per CLAUDE.md)

1. Write test first
2. Confirm it fails
3. Implement minimum code to pass
4. Refactor while green

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monorepo | pnpm workspaces | Simple, fast, good for frontend + separate Go backend |
| Frontend framework | Astro + React islands | Static content (blog/KB) is fast; app features get full React |
| UI library | Mantine v7 | Progressive disclosure components built-in; dark mode; accessible |
| State management | React Query + Zustand | Server state cached/synced; UI state in Zustand; no Redux overhead |
| Map library | Mapbox GL JS | Experience, offline tile packs, 50K free loads/mo |
| Backend language | Go | Performance for geospatial; simple deployment; good for solo dev |
| Database | Supabase (Postgres + PostGIS) | Free tier; auth + realtime + storage included; PostGIS for geo |
| Offline | Service Worker + IndexedDB | Standard PWA; Cache API for assets; IndexedDB for data + sync queue |
| Analytics | Plausible or Umami | Privacy-respecting; self-hostable; no third-party trackers |
| Testing | Vitest + Playwright | Fast unit tests; reliable E2E; TDD workflow |
| Package manager | pnpm | Fast, disk-efficient, good workspace support |
| Containerization | Docker + Docker Compose | Consistent dev/prod; entire stack runs locally; no "works on my machine" |
| Deployment | Netlify + Fly.io + Supabase | All have free tiers; minimal ops; Docker images for Go API |
