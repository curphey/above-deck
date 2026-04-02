# Admin & Platform — Feature Specification

**Date:** 2026-03-31
**Status:** Draft
**Section:** 6.27
**Companion to:** above-deck-product-vision-v2.md, above-deck-technical-architecture.md

---

## 1. Overview

Admin & Platform covers the operational tooling needed to run the Above Deck platform — user management, content moderation, analytics, system health, OTA updates, and NMEA 2000 diagnostics. These are internal tools for platform operators and boat owners, not end-user features.

The admin surface is split across two contexts:

- **Hub admin** — cloud platform operations. User management, content moderation, analytics, OTA version management, system health monitoring. Accessible only to users with admin or moderator roles via the community site.
- **Spoke diagnostics** — on-boat system health and NMEA 2000 network diagnostics. Accessible to the boat owner via the MFD shell. No user management or moderation — those are hub concerns.

Admin tooling is functional, not polished. It follows the same design system (Tailwind CSS + Ant Design 5, blueprint aesthetic) but prioritises density and efficiency over progressive disclosure. Admins need to see everything at once.

---

## 2. User Management

### 2.1 User Directory

A searchable, sortable table of all registered users.

**Columns:**
- Display name
- Email (obscured by default, reveal on click)
- Sign-up date
- Last active date
- Role (user / moderator / admin)
- Boat count
- Status (active / suspended / deleted)

**Actions:**
- Full-text search across name and email
- Filter by role, status, sign-up date range
- Sort by any column
- Click through to user detail view

### 2.2 User Detail View

Full profile for a single user, showing:

- Profile information (name, bio, avatar, boat profiles linked)
- Account metadata (sign-up method, last login, login count)
- Activity summary (content created, moderation actions received)
- Linked boats and their roles (owner, crew, guest)
- Moderation history (warnings, suspensions, reasons)

**Actions:**
- Suspend account (with reason, duration: 7d / 30d / permanent)
- Unsuspend account
- Change role (user / moderator / admin)
- Delete account (GDPR-compliant — removes PII, anonymises contributions, retains community content with attribution removed)
- Force sign-out (invalidate all sessions)
- View all content by this user

### 2.3 Account Deletion

GDPR-compliant deletion process:

1. Admin initiates deletion (or user self-service requests it)
2. System generates a deletion report — what will be removed, what will be anonymised
3. Admin confirms (or automated after 30-day user-initiated cooling-off period)
4. PII removed: name, email, avatar, bio, location, IP addresses
5. Content anonymised: community reviews, forum posts, almanac contributions attributed to "Deleted User"
6. Boat profiles deleted (unless shared with crew — ownership transfers or deletes)
7. Logbook and track data deleted
8. Deletion logged for audit trail (no PII in the log — just user ID hash and timestamp)

---

## 3. Role Management

### 3.1 Roles

Three platform roles, enforced via Supabase RLS policies and Go API middleware:

| Role | Scope | Capabilities |
|------|-------|-------------|
| **User** | Default | Create content, manage own boat profiles, use all tools, participate in community |
| **Moderator** | Content + community | Everything a user can do, plus: review moderation queue, approve/reject flagged content, issue warnings, suspend users (up to 30 days) |
| **Admin** | Platform-wide | Everything a moderator can do, plus: manage roles, permanent suspensions, account deletion, system configuration, OTA management, view analytics |

### 3.2 Role Assignment

- Roles are assigned by admins only (no self-promotion)
- Role changes are logged in the audit trail
- A user can hold exactly one platform role
- Boat-level roles (owner / crew / guest) are separate from platform roles and managed by the boat owner

### 3.3 Boat-Level Access

Orthogonal to platform roles. Managed by the boat owner, not by admins:

| Boat Role | Capabilities |
|-----------|-------------|
| **Owner** | Full control — equipment, settings, crew management, data deletion |
| **Crew** | Read and write — logbook entries, passage plans, instrument data |
| **Guest** | Read-only — view instruments, view logbook, view passages |

Admins can view boat-level role assignments but cannot modify them (boat data sovereignty).

---

## 4. Content Moderation

### 4.1 Moderation Queue

A unified queue of content flagged for review. Sources:

- **User reports** — any user can flag content (with reason: spam, inaccurate, offensive, safety concern)
- **Automated detection** — spam classifier, profanity filter, link analysis
- **Rate-based triggers** — user creating content at abnormal rates

**Queue columns:**
- Content type (review, forum post, almanac edit, route, photo)
- Content snippet (preview)
- Author
- Flag reason
- Flag source (user report / automated)
- Flag count (how many users flagged it)
- Date flagged

**Queue actions:**
- Approve (content stays, flags cleared)
- Remove (content hidden, author notified with reason)
- Edit (moderator can fix minor issues — typos in almanac entries, recategorisation)
- Warn user (formal warning added to user's moderation history)
- Suspend user (if pattern of abuse)
- Escalate to admin (if moderator is unsure)

### 4.2 Automated Detection

Server-side checks run on all user-generated content before it is published:

- **Spam classifier** — trained on sailing community content. Flags promotional links, crypto spam, SEO content. Low-confidence results go to queue; high-confidence results are auto-rejected with appeal option.
- **Profanity filter** — configurable word list. Flags but does not auto-remove (sailing communities have different norms).
- **Link analysis** — new accounts posting external links are flagged for review.
- **Duplicate detection** — near-identical reviews or posts flagged.
- **Rate limiting** — users creating more than N pieces of content per hour are throttled and flagged.

### 4.3 Moderation Log

All moderation actions are logged with:

- Action taken (approve, remove, warn, suspend)
- Moderator who took the action
- Timestamp
- Reason provided
- Content snapshot (preserved even if content is later deleted)

Moderation logs are visible to admins. Users can see their own moderation history (actions taken against their content).

### 4.4 Appeal Process

Users whose content is removed or whose accounts are suspended can appeal:

1. User submits appeal with explanation (one appeal per action)
2. Appeal appears in a separate admin queue (not the standard moderation queue)
3. Admin reviews original content, moderation action, and appeal
4. Admin upholds or reverses the decision
5. User notified of outcome

---

## 5. Analytics

### 5.1 Platform: Umami (Self-Hosted)

Privacy-respecting, cookie-free analytics via self-hosted Umami instance. No third-party trackers, no PII collection, no cross-site tracking. GDPR-compliant by design.

**What is tracked:**
- Page views and unique visitors (anonymised — no IP storage)
- Referral sources
- Device and browser breakdown
- Geographic distribution (country level, derived from anonymised IP at request time, not stored)
- Session duration and bounce rate

**What is NOT tracked:**
- Individual user behaviour
- Cross-session tracking
- Personal data of any kind
- Click-level interaction data

### 5.2 Community Health Metrics

Derived from platform data (not analytics trackers). Aggregated, not per-user:

| Metric | Source | Purpose |
|--------|--------|---------|
| Active users (DAU/WAU/MAU) | Auth session data | Platform health |
| New registrations per week | User table | Growth |
| Content created per week | Content tables | Engagement |
| Moderation queue depth | Moderation table | Operational load |
| Average moderation response time | Moderation log | Quality of service |
| Flagged content ratio | Flags vs total content | Community health |
| Boat profiles created | Boat table | Feature adoption |
| Spoke registrations | Spoke sync table | On-boat adoption |
| AI agent interactions per week | Agent log table | AI feature usage |

### 5.3 Analytics Dashboard

Admin-only view showing:

- Time-series charts for key metrics (7d / 30d / 90d / 1y)
- Community health summary (green/amber/red indicators for queue depth, flag ratio, response time)
- Content breakdown by type
- Geographic distribution of users
- Spoke version distribution (how many boats on which version)

No per-user analytics. No engagement scoring. No retention funnels. The goal is operational awareness, not growth hacking.

---

## 6. OTA Update System

### 6.1 Overview

Spoke instances (on-boat Docker containers) receive updates from the hub. Updates are user-initiated, never forced — a boat's systems must not change without the owner's explicit consent.

### 6.2 Version Management

**Hub side (admin):**
- Publish new spoke versions (Docker image tags)
- Write release notes (changelog, breaking changes, migration notes)
- Mark versions as stable / beta / deprecated
- Set minimum supported version (spokes below this are warned but not blocked)
- View version distribution across all spokes

**Spoke side (boat owner):**
- View current version and available updates
- Read release notes before updating
- Initiate update (pull new Docker image, restart container)
- Rollback to previous version (hub retains last 3 stable versions)

### 6.3 Update Process

1. Admin publishes new version on hub with release notes and stability tag
2. Spokes check for updates on hub sync (or manual check)
3. Spoke displays update notification in MFD shell (non-intrusive — status bar indicator)
4. Owner reviews release notes and initiates update
5. Spoke pulls new Docker image
6. Spoke runs pre-update health check (disk space, database integrity)
7. Spoke stops current container, starts new container
8. New container runs post-update migrations (database schema, data model changes)
9. Post-update health check — if failed, automatic rollback to previous image
10. Update status reported to hub

### 6.4 Rollback

- Spoke retains the previous Docker image locally
- Rollback is one-button in the MFD shell settings
- Rollback restores previous binary but keeps the database (migrations are forward-compatible)
- If post-update health check fails, rollback is automatic — no user intervention required
- Rollback events are logged and reported to hub for quality monitoring

### 6.5 Safety Constraints

- Updates never happen automatically — always user-initiated
- Updates never happen while underway (system checks GPS speed — if > 0.5 knots, update is blocked with explanation)
- Updates require shore power or battery SOC > 50%
- The update process is designed to complete in under 5 minutes on marina WiFi
- If connectivity is lost mid-update, the spoke continues running the previous version (atomic swap)

---

## 7. System Health

### 7.1 Hub Health Dashboard (Admin)

Operational monitoring for the cloud platform:

| Check | Source | Alert Threshold |
|-------|--------|-----------------|
| API server uptime | Uptime Kuma or similar | < 99.9% over 24h |
| API response time (p95) | Go middleware metrics | > 500ms |
| Database connections | PostgreSQL stats | > 80% pool utilisation |
| Sync queue depth | Sync service metrics | > 1000 pending items |
| Failed sync attempts | Sync error log | > 10% failure rate |
| Storage usage | Supabase Storage metrics | > 80% quota |
| RAG pipeline health | Embedding job status | Failed jobs |
| External API status | Health check probes | Open-Meteo, NOAA, AIS stream unreachable |

Dashboard is a simple status page — green/amber/red indicators with drill-down to logs. Not a full observability platform.

### 7.2 Spoke Health (On-Boat)

Visible to the boat owner in the MFD shell settings panel:

| Check | What it Monitors |
|-------|-----------------|
| System uptime | Time since last restart |
| CPU / RAM / Disk usage | Docker container resource consumption |
| Database integrity | SQLite PRAGMA integrity_check on schedule |
| Gateway connectivity | TCP/UDP connection status to each configured gateway |
| Data freshness | Time since last update for each data path (stale data = possible gateway issue) |
| Sync status | Last successful sync, pending queue depth, errors |
| Internet connectivity | Hub reachability, latency |
| Docker image version | Current vs available |

### 7.3 Spoke Fleet View (Admin)

Hub-side view of all registered spokes:

- Last sync timestamp
- Current version
- Connectivity status (online / last seen N hours ago)
- Error count since last sync
- Hardware type (Mac Mini / N100 / HALPI2)

This is opt-in — boat owners choose whether their spoke reports status to the hub. Privacy-respecting: no instrument data, no position, no personal data in fleet view.

---

## 8. NMEA 2000 Diagnostics

### 8.1 Context

NMEA 2000 diagnostics are a spoke-only feature. They require direct access to the boat's NMEA 2000 network via a gateway (iKonvert, NavLink2). The hub has no visibility into individual boat networks.

### 8.2 Device Listing

Auto-discovered via ISO Request (PGN 59904) → Product Information (PGN 126996) and Address Claim (PGN 60928):

| Field | Source PGN |
|-------|-----------|
| Manufacturer | 126996 |
| Model | 126996 |
| Serial number | 126996 |
| Software version | 126996 |
| NMEA 2000 address | 60928 |
| Device class / function | 60928 |
| Last seen | Adapter timestamp |

Table view with search and filter by manufacturer, device class, status.

### 8.3 PGN Analysis

Real-time view of NMEA 2000 traffic:

- **PGN frequency table** — which PGNs are being broadcast, by which device, at what rate (messages/second)
- **PGN decode** — select a PGN to see decoded field values in real time (using the NMEA 2000 field specifications from the research docs)
- **Unknown PGN log** — PGNs received that the system does not recognise (proprietary manufacturer PGNs)
- **Traffic volume** — total messages/second on the bus, broken down by source address

### 8.4 Health Reports

Periodic automated analysis of the NMEA 2000 network:

| Check | What it Detects |
|-------|----------------|
| Missing devices | Device previously seen is no longer responding |
| Address conflicts | Two devices claiming the same address |
| Bus load | Total traffic approaching NMEA 2000 bandwidth limits (250 kbit/s) |
| Error frames | CAN bus error frames indicating wiring or termination issues |
| Stale data | Device broadcasting but values not changing (sensor failure) |
| Firmware status | Current firmware vs known latest (via firmware tracker on hub) |

Health reports are stored locally and optionally synced to hub (for firmware tracking integration). Reports are viewable in the MFD shell under a diagnostics panel.

### 8.5 Security Audit

Integrated with the spoke's security scanner (section 6.18 of the product vision):

- Unknown devices on the bus
- Devices sending unexpected PGNs
- Traffic pattern anomalies
- Open gateways (gateways exposing the bus to WiFi without authentication)

---

## 9. Hub vs Spoke

| Capability | Hub | Spoke |
|-----------|-----|-------|
| User management | Yes | No |
| Role management | Yes | No |
| Content moderation | Yes | No |
| Analytics (Umami) | Yes | No |
| Community health metrics | Yes | No |
| OTA version publishing | Yes | No |
| OTA update installation | No | Yes |
| System health (platform) | Yes | No |
| System health (on-boat) | No | Yes |
| Spoke fleet view | Yes | No |
| NMEA 2000 diagnostics | No | Yes |
| NMEA 2000 device listing | No | Yes |
| PGN analysis | No | Yes |
| Network health reports | No | Yes (sync to hub optional) |
| Security audit | No | Yes |

The admin interface on the hub is a protected section of the community site, accessible only to admin and moderator roles. The diagnostics interface on the spoke is a panel within the MFD shell, accessible to the boat owner (no role check — spoke is single-tenant).

---

## 10. Data Model

### 10.1 Hub Tables (PostgreSQL via Supabase)

```sql
-- Role management
-- Users table is managed by Supabase Auth; platform role stored as metadata
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS
  platform_role TEXT DEFAULT 'user' CHECK (platform_role IN ('user', 'moderator', 'admin'));

-- Moderation queue
CREATE TABLE moderation_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type  TEXT NOT NULL,          -- 'review', 'forum_post', 'almanac_edit', 'route', 'photo'
  content_id    UUID NOT NULL,          -- FK to the content table
  content_snapshot JSONB NOT NULL,      -- preserved copy of content at time of flag
  flag_reason   TEXT NOT NULL,          -- 'spam', 'inaccurate', 'offensive', 'safety'
  flag_source   TEXT NOT NULL,          -- 'user_report', 'automated'
  flagged_by    UUID REFERENCES auth.users(id),  -- NULL for automated flags
  author_id     UUID REFERENCES auth.users(id),
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'removed', 'escalated')),
  reviewed_by   UUID REFERENCES auth.users(id),
  review_notes  TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  reviewed_at   TIMESTAMPTZ
);

-- Moderation log (immutable audit trail)
CREATE TABLE moderation_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action        TEXT NOT NULL,          -- 'approve', 'remove', 'warn', 'suspend', 'unsuspend', 'role_change', 'delete_account'
  target_user   UUID REFERENCES auth.users(id),
  moderator     UUID REFERENCES auth.users(id),
  reason        TEXT,
  metadata      JSONB,                  -- action-specific data (suspension duration, old/new role, etc.)
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- User suspensions
CREATE TABLE user_suspensions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id),
  reason        TEXT NOT NULL,
  suspended_by  UUID REFERENCES auth.users(id),
  starts_at     TIMESTAMPTZ DEFAULT now(),
  ends_at       TIMESTAMPTZ,           -- NULL = permanent
  lifted_at     TIMESTAMPTZ,           -- set if manually lifted early
  lifted_by     UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Appeals
CREATE TABLE moderation_appeals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderation_log_id UUID REFERENCES moderation_log(id),
  user_id       UUID REFERENCES auth.users(id),
  appeal_text   TEXT NOT NULL,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'upheld', 'reversed')),
  reviewed_by   UUID REFERENCES auth.users(id),
  review_notes  TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  reviewed_at   TIMESTAMPTZ
);

-- OTA version registry
CREATE TABLE spoke_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version       TEXT NOT NULL UNIQUE,   -- semver, e.g. '1.2.0'
  docker_tag    TEXT NOT NULL,           -- Docker image tag
  release_notes TEXT NOT NULL,
  stability     TEXT DEFAULT 'stable' CHECK (stability IN ('stable', 'beta', 'deprecated')),
  min_upgrade_from TEXT,                -- minimum version that can upgrade to this
  published_by  UUID REFERENCES auth.users(id),
  published_at  TIMESTAMPTZ DEFAULT now()
);

-- Spoke registry (opt-in fleet view)
CREATE TABLE spoke_instances (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id),
  boat_id       UUID,                   -- FK to boats table
  current_version TEXT,
  hardware_type TEXT,                   -- 'mac_mini_m4', 'n100', 'halpi2', 'other'
  last_sync_at  TIMESTAMPTZ,
  last_error_count INTEGER DEFAULT 0,
  reports_status BOOLEAN DEFAULT false, -- opt-in fleet view
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
```

### 10.2 RLS Policies

```sql
-- Moderation queue: moderators and admins only
CREATE POLICY moderation_queue_access ON moderation_queue
  FOR ALL USING (
    (SELECT platform_role FROM auth.users WHERE id = auth.uid()) IN ('moderator', 'admin')
  );

-- Moderation log: admins only (moderators see via API with filtered view)
CREATE POLICY moderation_log_admin ON moderation_log
  FOR SELECT USING (
    (SELECT platform_role FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Appeals: user sees own, admins see all
CREATE POLICY appeals_user ON moderation_appeals
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY appeals_admin ON moderation_appeals
  FOR ALL USING (
    (SELECT platform_role FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Spoke instances: user sees own, admins see all (where reports_status = true)
CREATE POLICY spoke_instances_user ON spoke_instances
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY spoke_instances_admin ON spoke_instances
  FOR SELECT USING (
    (SELECT platform_role FROM auth.users WHERE id = auth.uid()) = 'admin'
    AND reports_status = true
  );
```

### 10.3 Spoke Tables (SQLite)

```sql
-- NMEA 2000 device registry (auto-populated from bus discovery)
CREATE TABLE nmea2k_devices (
  id              INTEGER PRIMARY KEY,
  source_address  INTEGER NOT NULL,
  manufacturer_id INTEGER,
  manufacturer    TEXT,
  model           TEXT,
  serial_number   TEXT,
  software_version TEXT,
  device_class    INTEGER,
  device_function INTEGER,
  first_seen_at   TEXT NOT NULL,        -- ISO 8601
  last_seen_at    TEXT NOT NULL,
  status          TEXT DEFAULT 'active' -- 'active', 'missing', 'conflict'
);

-- NMEA 2000 health reports
CREATE TABLE nmea2k_health_reports (
  id              INTEGER PRIMARY KEY,
  report_type     TEXT NOT NULL,        -- 'scheduled', 'manual'
  bus_load_pct    REAL,
  device_count    INTEGER,
  missing_devices TEXT,                 -- JSON array of device IDs
  address_conflicts TEXT,               -- JSON array of conflict details
  error_frames    INTEGER,
  stale_sensors   TEXT,                 -- JSON array of stale data paths
  firmware_status TEXT,                 -- JSON array of outdated firmware
  created_at      TEXT NOT NULL
);

-- Spoke update history
CREATE TABLE spoke_updates (
  id              INTEGER PRIMARY KEY,
  from_version    TEXT NOT NULL,
  to_version      TEXT NOT NULL,
  status          TEXT NOT NULL,        -- 'success', 'failed', 'rolled_back'
  started_at      TEXT NOT NULL,
  completed_at    TEXT,
  error_message   TEXT
);
```

---

## 11. API Endpoints

### 11.1 Hub Admin API (Go)

All admin endpoints require JWT with admin or moderator role. Prefixed with `/api/v1/admin/`.

```
# User management (admin only)
GET    /admin/users                    — list users (paginated, searchable)
GET    /admin/users/:id                — user detail
PATCH  /admin/users/:id/role           — change role
POST   /admin/users/:id/suspend        — suspend user
POST   /admin/users/:id/unsuspend      — unsuspend user
DELETE /admin/users/:id                — delete account (GDPR)
POST   /admin/users/:id/force-signout  — invalidate sessions

# Moderation (moderator + admin)
GET    /admin/moderation/queue         — list pending items (filterable)
POST   /admin/moderation/:id/approve   — approve content
POST   /admin/moderation/:id/remove    — remove content
POST   /admin/moderation/:id/escalate  — escalate to admin
POST   /admin/moderation/:id/warn      — warn author

# Appeals (admin only)
GET    /admin/appeals                  — list pending appeals
POST   /admin/appeals/:id/uphold       — uphold original decision
POST   /admin/appeals/:id/reverse      — reverse original decision

# OTA (admin only)
GET    /admin/versions                 — list published versions
POST   /admin/versions                 — publish new version
PATCH  /admin/versions/:id             — update stability tag

# Fleet view (admin only)
GET    /admin/spokes                   — list registered spokes (opt-in only)

# Analytics (admin only)
GET    /admin/metrics/community        — community health metrics
GET    /admin/metrics/system           — system health metrics
```

### 11.2 Spoke Diagnostics API (Go)

Local-only endpoints (no auth required — spoke is single-tenant on the boat LAN). Prefixed with `/api/v1/diagnostics/`.

```
# NMEA 2000
GET    /diagnostics/nmea2k/devices     — list discovered devices
GET    /diagnostics/nmea2k/traffic     — real-time PGN traffic summary
GET    /diagnostics/nmea2k/pgn/:pgn    — decode specific PGN
GET    /diagnostics/nmea2k/health      — latest health report
POST   /diagnostics/nmea2k/health      — trigger manual health report

# System
GET    /diagnostics/system/health      — CPU, RAM, disk, uptime
GET    /diagnostics/system/gateways    — gateway connection status
GET    /diagnostics/system/sync        — sync status and queue depth

# Updates
GET    /diagnostics/updates/current    — current version info
GET    /diagnostics/updates/available  — available updates
POST   /diagnostics/updates/install    — initiate update
POST   /diagnostics/updates/rollback   — rollback to previous version
```

---

## 12. Implementation Notes

- Admin UI is built with React + Tailwind CSS + Ant Design 5, rendered as a protected section of the community site (hub)
- Spoke diagnostics UI is a React panel within the MFD shell
- Moderation queue uses Supabase Realtime for live updates (new flags appear without page refresh)
- Analytics queries run against aggregate views, never scanning individual user records
- NMEA 2000 diagnostics use the existing protocol adapter infrastructure — they read from the same TCP/UDP streams, they just present the data differently (raw PGN view vs decoded data model)
- Health reports run on a configurable schedule (default: every 6 hours) and on manual trigger
- The OTA system uses Docker image pulls over HTTPS — no custom update protocol
- All admin actions are idempotent where possible (suspending an already-suspended user is a no-op)
