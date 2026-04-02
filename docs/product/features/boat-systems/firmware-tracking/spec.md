# Feature Spec: Firmware Update Tracking (6.11b)

**Date:** 2026-03-31
**Status:** Draft v1
**Parent feature:** Boat Management (6.11)
**Research:** [Firmware Update Tracking Feasibility Study](../../../research/hardware/firmware-update-tracking.md)

---

## 1. Overview

### What this feature does

Firmware Update Tracking is a cross-manufacturer firmware monitoring service built into the Above Deck boat management tool. It maintains a continuously updated database of firmware versions across marine electronics brands, matches releases against each user's registered equipment, and notifies them when updates are available — with changelogs, risk warnings, and community-sourced annotations.

### Why it matters

No service exists that tracks firmware updates across marine electronics manufacturers. Every boat owner with mixed-brand electronics (nearly all of them) must manually check 3-10 different manufacturer websites, apps, and portals to discover if updates are available. Victron Energy has explicitly stated that proactive firmware alerts are "not planned." Garmin publishes monthly PDF bulletins. Raymarine buries versions on download pages. There is no cross-vendor firmware awareness anywhere in the marine industry.

The marine industry mirrors where home automation was circa 2015 — walled gardens, no cross-vendor standards, and users left to manually manage updates across a growing fleet of smart devices. Home Assistant solved this for smart homes. Nobody has done it for boats.

A well-equipped cruising catamaran may have 15-30 firmware-updateable devices spanning 5-10 brands. Missing a critical update can mean unpatched security vulnerabilities, unresolved bugs affecting safety systems, or missing features that improve passage safety. Conversely, applying a bad update (such as a VE.Bus firmware that resets inverter settings to factory defaults) can disable critical systems offshore.

### Design principles

- **Metadata only** — track version numbers, dates, and changelog summaries. Never host or redistribute firmware binaries.
- **Link to official sources** — every update entry links to the manufacturer's official download page.
- **Shared device inventory** — the equipment registry that powers firmware tracking also feeds energy planning, maintenance scheduling, and passage planning.
- **Community-enriched** — users contribute real-world experience with specific firmware versions.
- **Hub scrapes, spoke discovers** — scrapers run on the hub, NMEA 2000 auto-discovery runs on the spoke.

---

## 2. User Stories

### Equipment owner

- **US-1:** As a boat owner with mixed-brand electronics, I want a single place to see which of my devices have firmware updates available, so I do not have to check 5-10 manufacturer websites individually.
- **US-2:** As a cruiser preparing for a passage, I want to know if any of my navigation equipment has pending firmware updates, so I can update before departure while I still have good connectivity.
- **US-3:** As a boat owner, I want to see a changelog summary for each available update, so I can decide whether the update is worth applying.
- **US-4:** As a Victron user, I want to link my VRM account so my device inventory and current firmware versions are populated automatically.
- **US-5:** As a boat owner, I want risk indicators on firmware updates (e.g. "VE.Bus updates reset settings to factory defaults"), so I do not brick my inverter at sea.

### Community contributor

- **US-6:** As a sailor who just applied a firmware update, I want to report whether it went smoothly or caused problems, so other users can make informed decisions.
- **US-7:** As a sailor experiencing issues after a firmware update, I want to see if other users have reported similar problems with that version, so I know whether the issue is widespread.

### Notification consumer

- **US-8:** As a boat owner, I want a weekly email digest of firmware updates relevant to my registered equipment, so I stay informed without needing to log in.
- **US-9:** As a boat owner, I want in-app notifications when a new firmware version is released for any of my registered devices.
- **US-10:** As a boat owner, I want to be notified immediately if a firmware update is flagged as a security patch, so I can prioritise it.

### On-boat user

- **US-11:** As a boat owner with a spoke running on board, I want my NMEA 2000 devices to be automatically discovered with their current firmware versions, so I do not have to manually enter every device.
- **US-12:** As a boat owner at anchor with limited connectivity, I want my spoke to compare locally cached firmware data against discovered device versions, so I know about available updates even offline.

---

## 3. Data Model

### Hub database (PostgreSQL via Supabase)

#### `manufacturers` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID, PK | |
| `name` | TEXT, NOT NULL, UNIQUE | e.g. "Victron Energy", "Garmin", "Raymarine" |
| `slug` | TEXT, NOT NULL, UNIQUE | URL-safe identifier |
| `website_url` | TEXT | Manufacturer home page |
| `firmware_page_url` | TEXT | Official firmware downloads page |
| `nmea_manufacturer_code` | INT | NMEA 2000 manufacturer code from PGN 60928 |
| `scraper_enabled` | BOOLEAN, DEFAULT false | Whether the hub actively scrapes this manufacturer |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### `product_lines` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID, PK | |
| `manufacturer_id` | UUID, FK → manufacturers | |
| `name` | TEXT, NOT NULL | e.g. "Cerbo GX", "GPSMAP 8616", "Axiom2 Pro" |
| `category` | TEXT, NOT NULL | ENUM: mfd, radar, autopilot, instrument_display, ais, vhf, power_controller, power_monitor, solar_charger, inverter_charger, bms, gateway, digital_switching, stereo, router, sensor |
| `nmea_product_code` | INT | Product code from PGN 126996, if known |
| `victron_product_id` | INT | Victron-specific product ID for VRM matching |
| `update_method` | TEXT | How firmware is applied: ble, wifi, usb, sd_card, nmea2000, ota |
| `update_risk_level` | TEXT | DEFAULT 'low'. ENUM: low, medium, high |
| `update_risk_notes` | TEXT | e.g. "VE.Bus updates reset all settings to factory defaults" |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### `firmware_versions` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID, PK | |
| `product_line_id` | UUID, FK → product_lines | |
| `version` | TEXT, NOT NULL | Version string as published by manufacturer |
| `version_normalized` | TEXT | Semver-normalized for comparison (e.g. "3.72.0") |
| `release_date` | DATE | Date published, if known |
| `changelog_url` | TEXT | Link to official changelog |
| `changelog_summary` | TEXT | Plain-text summary of key changes |
| `download_url` | TEXT | Link to official download page (never a direct binary link) |
| `is_latest` | BOOLEAN, DEFAULT false | Whether this is the current latest release |
| `is_beta` | BOOLEAN, DEFAULT false | Whether this is a beta/candidate release |
| `is_security_update` | BOOLEAN, DEFAULT false | Whether this addresses security vulnerabilities |
| `source` | TEXT, NOT NULL | How we discovered this: github_tag, rss_feed, url_probe, html_scrape, vrm_api, manual |
| `source_url` | TEXT | The specific URL we scraped or polled |
| `raw_metadata` | JSONB | Full raw data from the source for debugging |
| `created_at` | TIMESTAMPTZ | When we first discovered this version |
| `updated_at` | TIMESTAMPTZ | |

**Unique constraint:** (`product_line_id`, `version`)

#### `community_annotations` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID, PK | |
| `firmware_version_id` | UUID, FK → firmware_versions | |
| `user_id` | UUID, FK → auth.users | |
| `rating` | INT, NOT NULL | 1-5 scale: 1 = caused serious problems, 5 = flawless |
| `body` | TEXT | Free-text description of experience |
| `update_method_used` | TEXT | How they applied it: ble, usb, vrm_remote, sd_card, etc. |
| `device_context` | JSONB | Other devices on the bus, GX firmware version, etc. |
| `issues_reported` | TEXT[] | Array of issue tags: settings_reset, brick, connectivity_loss, performance_degradation, incompatibility |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**RLS policy:** Users can create/edit/delete their own annotations. All annotations are readable by authenticated users.

#### `compatibility_warnings` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID, PK | |
| `firmware_version_id` | UUID, FK → firmware_versions | The version that triggers the warning |
| `affected_product_line_id` | UUID, FK → product_lines | The product affected by the incompatibility |
| `affected_version_range` | TEXT | Semver range of affected versions (e.g. "<2.80") |
| `description` | TEXT, NOT NULL | What goes wrong |
| `source` | TEXT | manufacturer_docs, community_report, release_notes |
| `source_url` | TEXT | Link to official documentation or forum post |
| `created_at` | TIMESTAMPTZ | |

### Relationship to Equipment Registry (6.11)

The equipment registry in Boat Management defines user-owned devices:

#### `equipment` table (defined by 6.11, referenced here)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID, PK | |
| `boat_id` | UUID, FK → boats | |
| `product_line_id` | UUID, FK → product_lines, NULLABLE | Links to firmware tracking |
| `system_category` | TEXT | propulsion, electrical, water, safety, navigation, rigging, plumbing |
| `manufacturer` | TEXT | Free-text if not matched to a product_line |
| `model` | TEXT | Free-text if not matched |
| `serial_number` | TEXT | |
| `install_date` | DATE | |
| `current_firmware_version` | TEXT | Manually entered or auto-detected |
| `firmware_version_source` | TEXT | manual, nmea2000_discovery, vrm_api |
| `firmware_last_checked` | TIMESTAMPTZ | When the version was last verified |
| `nmea2000_address` | INT | NMEA 2000 bus address if discovered |
| `nmea2000_name` | BIGINT | 64-bit NAME from PGN 60928 |

When `product_line_id` is set, the system can compare `current_firmware_version` against `firmware_versions.is_latest` to determine if an update is available.

### Spoke database (SQLite)

The spoke maintains a local copy of:

- `product_lines` — synced from hub (read-only on spoke)
- `firmware_versions` — synced from hub (read-only on spoke), filtered to versions relevant to the user's registered equipment plus a broader set for NMEA 2000 discovery matching
- `equipment` — bidirectional sync with hub, spoke-authoritative for auto-discovered data
- `community_annotations` — synced from hub (read-only on spoke)

---

## 4. Data Acquisition Pipeline

All scrapers run as Go workers on the hub, scheduled via cron. Each worker implements a common interface:

```go
type FirmwareScraper interface {
    Name() string
    Manufacturer() string
    Schedule() string              // cron expression
    Scrape(ctx context.Context) ([]FirmwareRelease, error)
    HealthCheck() error
}

type FirmwareRelease struct {
    ProductLineName    string
    Version            string
    ReleaseDate        *time.Time
    ChangelogURL       string
    ChangelogSummary   string
    DownloadURL        string
    IsBeta             bool
    IsSecurityUpdate   bool
    Source             string
    SourceURL          string
    RawMetadata        json.RawMessage
}
```

Workers write discovered versions to the `firmware_versions` table. Duplicate detection uses the unique constraint on (`product_line_id`, `version`). New versions trigger the notification pipeline.

### 4.1 Victron — GitHub API Tag Monitor

**Source:** `https://api.github.com/repos/victronenergy/venus/tags`

**Schedule:** Every 6 hours

**Method:** Poll the GitHub API for tags on the `victronenergy/venus` repository. Tags follow a consistent pattern: `v3.33`, `v3.40`, ..., `v3.72`. Compare against known versions in the database. New tags are recorded as Venus OS releases.

**Details:**
- GitHub API requires no authentication for public repos (rate limit: 60 requests/hour unauthenticated, 5000/hour with a PAT)
- Use conditional requests (`If-None-Match` with ETag) to avoid burning rate limit when nothing has changed
- Parse tag name to extract version number (strip leading `v`)
- Release date derived from the tag's commit timestamp
- Changelog URL constructed as `https://github.com/victronenergy/venus/releases/tag/{tag}`
- This covers Venus OS (GX device firmware) only; individual device firmware (MPPT, SmartShunt, etc.) comes from other sources

**Fragility:** Very low. GitHub API is stable. Tag naming convention has been consistent across 40+ releases.

### 4.2 Victron — RSS Feed Poller

**Source:** `https://www.victronenergy.com/blog/feed/`

**Schedule:** Every 12 hours

**Method:** Parse the RSS 2.0 feed. Filter for posts whose title or category matches firmware release patterns (e.g. contains "Venus OS", "firmware", "update", "release"). Extract version numbers from the title or description using regex. Cross-reference against known versions.

**Details:**
- RSS feed includes all blog posts, not just firmware announcements — filtering is essential
- Blog posts often announce major Venus OS releases with human-readable changelogs
- Extract `<link>` element as the changelog URL
- Use `<pubDate>` as the release date
- Parse description for changelog summary (strip HTML, truncate to 500 chars)
- This source may lag behind the GitHub tag by hours or days — the GitHub monitor is the primary source, RSS is supplementary for changelog content

**Fragility:** Low. Standard RSS 2.0. Victron has maintained their blog feed for years.

### 4.3 Garmin — Monthly PDF URL Prober

**Source:** Predictable URL pattern: `https://www8.garmin.com/marine/PDF/MarineSoftwareUpdate/{YEAR}/{Month}{Year}.pdf`

**Schedule:** Daily (check for current month's PDF)

**Method:** Construct the expected URL for the current month's PDF bulletin. Issue an HTTP HEAD request. If the PDF exists (HTTP 200), download it, extract text (Go PDF library), and parse device names and version numbers from the structured table format.

**Details:**
- URL pattern example: `https://www8.garmin.com/marine/PDF/MarineSoftwareUpdate/2026/March2026.pdf`
- Garmin publishes one PDF per month listing all current firmware versions for all marine products
- PDF contains a table with columns: Product, Current Software Version, Previous Version, Change History Link
- Parse the table to extract product names and version numbers
- Match product names against known `product_lines` entries
- Changelog URL is included in the PDF as a link to Garmin's support pages
- If the PDF does not exist yet for the current month, do nothing — check again tomorrow

**Fragility:** Low. Garmin has maintained this URL pattern and PDF format consistently. If the URL pattern changes, the prober fails silently and logs a warning. Manual intervention required to update the pattern.

### 4.4 Raymarine — HTML Scraper

**Source:** `https://www.raymarine.com/en-us/support/software-updates-and-documents`

**Schedule:** Every 24 hours

**Method:** Fetch the page, parse the HTML DOM, extract product names and version numbers from the download listing. Raymarine lists firmware downloads grouped by product family (Axiom, Axiom2, LightHouse, etc.) with version numbers visible in the listing.

**Details:**
- Use Go's `net/http` to fetch the page and `golang.org/x/net/html` or `goquery` to parse the DOM
- Extract product name, version number, and download page URL from each listing
- Changelog URLs typically link to release notes PDFs or support pages
- Respect `robots.txt` — check before scraping
- Set a reasonable `User-Agent` header identifying the scraper
- Rate-limit requests (minimum 5 seconds between page fetches)
- If the page structure changes, the scraper fails gracefully, logs the error, and an admin is notified

**Fragility:** Medium. HTML structure can change without warning. The scraper should be defensive (log warnings on parse failures rather than crashing) and include selectors that are as stable as possible (IDs over class names, semantic elements over dividers).

### 4.5 Victron — VRM API Version Poller

**Source:** `https://vrmapi.victronenergy.com/v2/`

**Schedule:** On-demand (triggered when a user links their VRM account)

**Method:** After a user links their VRM account (see section 6), query their installation diagnostics to retrieve current firmware versions for all connected Victron devices.

**Details:**
- Authentication: user provides VRM credentials or personal access token, stored encrypted
- `GET /v2/installations/{id}/diagnostics` returns device list with firmware versions
- Map Victron product IDs (from the diagnostics response) to `product_lines` entries using a maintained lookup table (based on [community product ID mapping](https://gist.github.com/seidler2547/52f3e91cbcbf2fa257ae79371bb78588))
- This is not a scraper per se — it reads the user's own data with their explicit authorisation
- Refresh on user request or on a schedule (every 24 hours) if the user has opted in

**Fragility:** Low. VRM API is documented and maintained. Victron actively supports third-party integrations.

### Scraper health monitoring

Each scraper reports health status:
- **Last successful run** — timestamp
- **Last failure** — timestamp and error message
- **Consecutive failures** — counter, triggers admin alert at threshold (e.g. 3)
- **Versions discovered (total)** — running count
- **Versions discovered (last run)** — count for the most recent run

Admin dashboard (or simple log output) shows scraper health at a glance. If a scraper fails for 72 hours, an alert is sent to the project maintainers.

---

## 5. NMEA 2000 Auto-Discovery

### How it works

Every NMEA 2000 certified device must respond to two standard PGNs:

| PGN | Name | Key Fields |
|-----|------|------------|
| **60928** | ISO Address Claim | 64-bit NAME containing: manufacturer code (11 bits), device class (7 bits), device function (8 bits), device instance (8 bits), system instance (4 bits), industry group (3 bits) |
| **126996** | Product Information | NMEA 2000 database version, product code (16-bit), model ID string (32 bytes), software version string (32 bytes), model version string (32 bytes), model serial code (32 bytes), certification level, load equivalency |

**PGN 126996 is the key.** The `software version string` field contains the device's current firmware version.

### Discovery process

1. The spoke sends an ISO Request (PGN 59904) for PGN 126996 on the NMEA 2000 bus via the connected gateway (iKonvert, NavLink2, YDWG-02, etc.)
2. All NMEA 2000 devices on the bus respond with their Product Information (fast-packet, up to 134 bytes)
3. The spoke also captures ISO Address Claim (PGN 60928) messages to extract the manufacturer code
4. For each responding device, the spoke records:
   - Manufacturer code (from PGN 60928) — mapped to manufacturer name via NMEA manufacturer code registry
   - Product code (from PGN 126996) — mapped to product line where known
   - Model ID string — human-readable model name
   - Software version string — current firmware version
   - Model serial code — serial number
5. Discovered devices are matched against the `product_lines` table (synced from hub) using manufacturer code + product code
6. If a match is found, `current_firmware_version` is compared against the latest known version in `firmware_versions`
7. Results are displayed in the boat management UI and written to the `equipment` table

### Matching strategy

Matching NMEA 2000 discovery data to the firmware version database requires a multi-step approach:

1. **Exact match:** manufacturer code + product code → `product_lines` entry. This is the most reliable.
2. **Fuzzy match:** If no product code match, attempt to match the model ID string against known product names using string similarity.
3. **Unmatched devices:** Display with manufacturer name and model string, flag as "not tracked" — the community can help map unknown devices over time.

### Discovery triggers

- **On startup** — spoke sends discovery requests on boot
- **Periodic** — every 24 hours while running
- **On demand** — user can trigger a manual scan from the UI
- **On bus change** — if a new device appears on the bus (new ISO Address Claim observed), trigger discovery for that device

### Gateway requirements

NMEA 2000 auto-discovery requires a gateway that supports bidirectional communication:
- **Yacht Devices iKonvert (USB)** — full bidirectional, can send ISO Requests
- **Digital Yacht NavLink2 (WiFi)** — full bidirectional
- **Yacht Devices YDWG-02 (Ethernet)** — full bidirectional
- **Actisense NGT-1 (USB)** — full bidirectional
- **Read-only gateways** — can still passively capture PGN 60928 and PGN 126996 messages as devices claim addresses on bus startup, but cannot actively request Product Information from all devices

---

## 6. VRM Integration

### Linking a VRM account

1. User navigates to Settings > Integrations > Victron VRM
2. User enters their VRM email and password, or provides a personal access token
3. Above Deck authenticates against the VRM API (`POST /v2/auth/login`)
4. On success, the VRM access token is stored encrypted in the database, associated with the user's account
5. Above Deck fetches the user's installation list (`GET /v2/users/{id}/installations`)
6. User selects which installation(s) to link (many users have only one)
7. Above Deck fetches diagnostics for each linked installation, populating the equipment registry with Victron devices and their current firmware versions

### Ongoing sync

- Every 24 hours (configurable), Above Deck re-queries the VRM diagnostics endpoint for linked installations
- Firmware version changes are detected and recorded in the equipment table
- If a device's firmware version moves backward (downgrade), flag it in the UI

### Data retrieved from VRM

- Device type and product ID
- Current firmware version
- Device serial number
- Installation name and location
- Last communication timestamp

### VRM token management

- Tokens are stored encrypted at rest (AES-256-GCM)
- Users can revoke VRM integration at any time (deletes stored credentials)
- If the VRM token expires or is revoked, the user is notified and asked to re-authenticate
- Above Deck never stores the user's VRM password — only the API token returned by VRM auth

---

## 7. Notification System

### In-app notification feed

- A firmware updates feed in the boat management dashboard shows all relevant updates
- Each entry shows: manufacturer, product, new version, release date, changelog summary, risk level
- Entries are filterable by manufacturer, category, and status (new, viewed, dismissed)
- Clicking an entry opens the firmware detail view with full changelog, community annotations, and compatibility warnings
- New entries are marked with an unread indicator; the MFD status bar shows a count of unread firmware updates

### Email digest

- Weekly email (configurable: daily, weekly, monthly, off) listing firmware updates relevant to the user's registered equipment
- Each entry includes: device name, current version, available version, one-line changelog summary, link to details
- Security updates are highlighted
- High-risk updates include the risk warning in the email body
- Email is plain text with an HTML alternative — no tracking pixels, no external image loads
- Users can unsubscribe from the email digest without affecting in-app notifications

### Notification triggers

| Event | In-app | Email | Priority |
|-------|--------|-------|----------|
| New firmware version detected for user's equipment | Immediate | Next digest | Normal |
| Security update detected | Immediate | Immediate (out-of-cycle email) | High |
| Community reports problems with a version the user is running | Immediate | Next digest | Normal |
| Compatibility warning affects user's equipment combination | Immediate | Next digest | Normal |
| NMEA 2000 discovery finds outdated firmware on board | Immediate (spoke) | Next digest | Normal |

---

## 8. Community Annotations

### Submitting an annotation

After a user applies a firmware update, they can submit an annotation:

1. Navigate to the firmware version detail page
2. Select a rating (1-5 scale):
   - 1 = caused serious problems (brick, data loss, settings reset)
   - 2 = caused minor problems (glitches, required reboot)
   - 3 = neutral (no issues, no noticeable improvement)
   - 4 = good (noticeable improvement, no issues)
   - 5 = flawless (significant improvement, no issues)
3. Optionally describe their experience in free text
4. Select the update method used (BLE, USB, VRM remote, SD card, etc.)
5. Optionally provide device context (other devices on the bus, GX firmware version)
6. Tag any issues encountered from a predefined list: settings_reset, brick, connectivity_loss, performance_degradation, incompatibility, other

### Viewing annotations

- Firmware version detail page shows an aggregate rating and count
- Individual annotations are listed chronologically
- Annotations with issue tags are surfaced prominently
- If more than 2 annotations flag the same issue, a warning banner appears on the firmware version

### Moderation

- Community annotations are subject to the platform's standard moderation rules
- Annotations can be flagged by other users
- Moderators can remove annotations that are spam, abusive, or clearly false
- No editing of annotations after 24 hours (to preserve historical accuracy)

---

## 9. UI/UX

### Key screens

#### 9.1 Firmware Dashboard

The primary entry point, accessible from the Boat Management tool.

- **Update summary card** — count of available updates, count of security updates, count of high-risk updates
- **Device list** — each registered device showing: name, manufacturer, current version, latest version, update status (up to date / update available / unknown)
- **Sort and filter** — by manufacturer, category, update status, risk level
- **Last checked** — timestamp of last scraper run and last NMEA 2000 discovery

#### 9.2 Firmware Version Detail

Shown when a user clicks on a specific firmware version.

- **Version header** — manufacturer, product, version number, release date
- **Changelog** — summary text plus link to official changelog
- **Risk indicator** — if applicable, warning banner with risk details (e.g. "This update resets VE.Bus device settings to factory defaults. Back up your configuration before proceeding.")
- **Compatibility warnings** — if this version has known conflicts with other products/versions
- **Update instructions** — link to official update procedure (manufacturer page)
- **Community annotations** — aggregate rating, individual reports
- **Version history** — list of all known versions for this product, with release dates

#### 9.3 Firmware Feed (Timeline)

A chronological feed of all firmware releases across tracked manufacturers.

- Each entry shows: manufacturer logo/name, product, version, release date, one-line summary
- Filter by manufacturer, category
- Mark entries as read/dismissed
- Clicking an entry opens the version detail view

#### 9.4 NMEA 2000 Discovery Results

Displayed after an on-boat NMEA 2000 scan.

- List of all discovered devices: manufacturer, model, serial, firmware version, bus address
- Status for each: matched to product line (yes/no), update available (yes/no/unknown)
- Action: "Add to equipment registry" for newly discovered devices
- Action: "Update firmware version" to sync the discovered version to the equipment record

#### 9.5 VRM Integration Settings

Under Settings > Integrations.

- VRM account status: linked / not linked
- Linked installations list
- Last sync timestamp
- Manual sync button
- Unlink button

### Visual design

All screens follow the Above Deck blueprint aesthetic:
- Dark mode default (Deep Navy `#1a1a2e` background, Midnight Blue `#16213e` cards)
- Space Mono headings, Inter body text
- Update-available status uses Ocean Blue (`#60a5fa`)
- Security updates use Coral (`#f87171`)
- Up-to-date status uses Sea Green (`#4ade80`)
- Risk warnings use Coral background with clear text
- Community rating displayed as a simple numeric average with count, not stars

---

## 10. API Endpoints

All endpoints require authentication. Prefixed with `/api/v1`.

### Firmware versions

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/firmware/versions` | List firmware versions. Query params: `manufacturer`, `product_line_id`, `category`, `is_latest`, `since` (date), `page`, `per_page` |
| `GET` | `/firmware/versions/{id}` | Get a specific firmware version with changelog, annotations, and compatibility warnings |
| `GET` | `/firmware/versions/latest` | Get the latest version for each tracked product line |

### User equipment firmware status

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/boats/{boat_id}/firmware/status` | Get firmware status for all equipment on a boat. Returns each device with current version, latest version, and update availability |
| `GET` | `/boats/{boat_id}/firmware/updates` | Get only equipment with available updates |

### Community annotations

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/firmware/versions/{id}/annotations` | List annotations for a firmware version |
| `POST` | `/firmware/versions/{id}/annotations` | Submit an annotation (auth required) |
| `PUT` | `/firmware/versions/{id}/annotations/{annotation_id}` | Update own annotation (within 24 hours) |
| `DELETE` | `/firmware/versions/{id}/annotations/{annotation_id}` | Delete own annotation |

### NMEA 2000 discovery (spoke only)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/nmea2000/discover` | Trigger a discovery scan |
| `GET` | `/nmea2000/devices` | List discovered devices with firmware match status |

### VRM integration

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/integrations/vrm/link` | Link a VRM account (accepts credentials, returns installation list) |
| `DELETE` | `/integrations/vrm/link` | Unlink VRM account |
| `GET` | `/integrations/vrm/status` | Get VRM link status and last sync time |
| `POST` | `/integrations/vrm/sync` | Trigger manual VRM sync |

### Notification preferences

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/users/me/firmware/notifications` | Get notification preferences |
| `PUT` | `/users/me/firmware/notifications` | Update notification preferences (digest frequency, security alert opt-in, etc.) |

### Admin / scraper status (admin only)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/firmware/scrapers` | List all scrapers with health status |
| `POST` | `/admin/firmware/scrapers/{name}/run` | Manually trigger a scraper run |
| `POST` | `/admin/firmware/versions` | Manually add a firmware version (for manufacturers without scrapers) |

---

## 11. Hub vs Spoke Behavior

### Hub responsibilities

| Function | Details |
|----------|---------|
| **Run scrapers** | All Go scraper workers execute on the hub on cron schedules |
| **Maintain firmware database** | The `firmware_versions`, `product_lines`, and `manufacturers` tables are hub-authoritative |
| **Process VRM API calls** | VRM integration queries run from the hub |
| **Send email digests** | Email notification system runs on the hub |
| **Serve firmware API** | Browser users query the hub API directly |
| **Generate community annotation aggregates** | Rating averages, issue frequency counts |

### Spoke responsibilities

| Function | Details |
|----------|---------|
| **NMEA 2000 discovery** | Sends ISO Requests, parses responses, populates equipment registry |
| **Local firmware matching** | Compares discovered device versions against synced firmware database |
| **In-app notifications** | Displays firmware update availability in the MFD shell and boat management UI |
| **Equipment registry (local)** | Stores equipment with firmware versions, syncs bidirectionally with hub |

### Sync behavior

| Direction | Data | Frequency |
|-----------|------|-----------|
| Hub → Spoke | `manufacturers`, `product_lines`, `firmware_versions` (filtered to user's equipment + common NMEA 2000 devices), `community_annotations` (aggregates only), `compatibility_warnings` | On connect, then every 6 hours |
| Spoke → Hub | Equipment registry changes (new devices from NMEA 2000 discovery, updated firmware versions), NMEA 2000 discovery results | On connect, queued offline |

The spoke can operate fully offline for firmware status display — it compares local equipment records against the synced firmware version database. New scraper results are picked up on the next sync.

---

## 12. Phased Rollout

### Phase 1: Victron + Garmin + Raymarine

**Scope:**
- Equipment registry with manual device entry (manufacturer/model dropdowns)
- GitHub tag monitor for Victron Venus OS
- RSS feed poller for Victron blog
- URL prober for Garmin monthly PDFs
- HTML scraper for Raymarine download pages
- Firmware dashboard UI (device list, update status, version detail)
- Firmware feed (timeline of releases)
- In-app notifications for new versions matching user's equipment
- Weekly email digest
- Link to official changelogs and download pages

**Why these three first:** They cover the majority of electronics on a typical cruising boat, and each has a viable data source with low legal risk. Victron has the richest data (API, GitHub, RSS). Garmin has a predictable PDF pattern. Raymarine has scrapeable public pages.

**Exit criteria:** Users can register equipment, see available updates, and receive notifications for Victron, Garmin, and Raymarine products.

### Phase 2: Deep Integration + Expansion

**Scope:**
- VRM account linking for Victron auto-detection
- Community annotations (ratings, issue reports)
- Compatibility warnings
- Update sequencing guidance (e.g. "Update Cerbo GX to v3.72 before updating MPPT controllers")
- Risk indicators on high-risk updates
- Additional manufacturers: Simrad, B&G, Lowrance (Navico group — shared download infrastructure), Furuno, Maretron, Actisense, Digital Yacht

**Navico challenge:** Simrad/B&G/Lowrance download pages return HTTP 403 for automated requests (bot protection). Options: monitor app store updates for companion apps, parse cached Google search results, or rely on community submissions. This may require a "manual entry with community verification" approach rather than automated scraping.

**Exit criteria:** VRM integration works end to end. Community annotations are live. At least 2 additional manufacturer scrapers are operational.

### Phase 3: NMEA 2000 Auto-Discovery

**Scope:**
- ISO Request (PGN 59904) implementation in the spoke protocol adapters
- PGN 126996 and PGN 60928 parsing
- Automatic equipment registry population from discovered devices
- Automatic firmware version comparison against synced database
- Zero-configuration firmware awareness — plug in a gateway, and the system discovers all devices

**Prerequisites:**
- Spoke must be running with a bidirectional NMEA 2000 gateway connected
- Product line database must include NMEA 2000 product codes for matching
- Community contribution of manufacturer code → product line mappings will be ongoing

**Exit criteria:** Spoke can discover all NMEA 2000 devices on the bus, match them to product lines, and display firmware update status without manual device registration.

---

## 13. Legal Constraints

### What we do

- **Track metadata only** — version numbers, release dates, changelog summaries (factual data, not copyrightable under US law)
- **Link to official sources** — every firmware entry links to the manufacturer's official download or changelog page
- **Scrape public pages only** — no scraping behind authentication walls (except VRM API with user's own credentials)
- **Respect robots.txt** — all scrapers check and obey robots.txt directives
- **Identify ourselves** — scrapers use a descriptive User-Agent header
- **Rate-limit requests** — minimum 5 seconds between requests to any single host

### What we never do

- **Never host firmware binaries** — not even temporarily. We link to manufacturer download pages.
- **Never redistribute firmware files** — no caching, no mirroring, no S3 buckets with firmware images
- **Never reverse-engineer update protocols** — we observe publicly documented data only
- **Never scrape behind authentication** — except the VRM API using the user's own credentials with their explicit consent
- **Never circumvent bot protection** — if a manufacturer blocks automated access (e.g. Navico), we respect that and use alternative approaches (manual entry, community submissions)

### Legal basis

- **hiQ v. LinkedIn (9th Circuit, 2022):** Scraping publicly available data does not violate the Computer Fraud and Abuse Act. The "gates-up-or-down" test holds: if data is publicly accessible without login, there is no legal barrier to automated access.
- **Factual data:** Version numbers and release dates are factual data, not subject to copyright protection.
- **Linking:** Linking to manufacturer pages is established as legally permissible.

### Risk mitigation

- If a manufacturer requests that we stop scraping their site, we comply immediately and switch to alternative data sources (community submissions, manual entry)
- All scraper source URLs and methods are documented so they can be audited
- The project's open-source GPL license means the scraping code is publicly auditable

---

## 14. Dependencies

### Hard dependencies

| Dependency | Feature | Why |
|------------|---------|-----|
| **Equipment Registry (6.11)** | Boat Management | Firmware tracking matches against the user's registered equipment. Without the equipment registry, there is nothing to match against. |
| **Go API server** | Core infrastructure | Scrapers, matching engine, and API endpoints run within the Go binary. |
| **PostgreSQL (Supabase)** | Core infrastructure | Hub database for firmware versions, annotations, and scraper state. |
| **Hub-Spoke sync** | Core infrastructure | Firmware version database must sync from hub to spoke for local matching. |

### Soft dependencies (enhance but not required)

| Dependency | Feature | Enhancement |
|------------|---------|-------------|
| **NMEA 2000 protocol adapter** | Spoke protocol adapters | Enables auto-discovery (Phase 3). Firmware tracking works without it via manual entry. |
| **Email service** | Notification system | Enables email digests. In-app notifications work without email. |
| **MFD shell** | Frontend | Enables firmware status in the status bar. Dashboard works standalone. |
| **AI agents (Engineer)** | AI crew | The Engineer agent could proactively advise on firmware updates during passage planning or maintenance reviews. Not required for core functionality. |

### Build order

1. Equipment registry (6.11) — must exist first
2. Firmware version database + scrapers (Phase 1) — hub-side, can be built independently
3. Firmware dashboard UI — depends on both 1 and 2
4. Notifications — depends on 3
5. VRM integration + community annotations (Phase 2) — depends on 3
6. NMEA 2000 auto-discovery (Phase 3) — depends on spoke protocol adapter work and the firmware database
