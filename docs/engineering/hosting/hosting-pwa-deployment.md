# Hosting, PWA & Deployment Specification

**Date:** 2026-03-31
**Status:** Draft v1
**Companion to:** [Technical Architecture](../../above-deck-technical-architecture.md), [Engineering Standards](../engineering-standards.md)

---

## 1. Hub Hosting Architecture

The hub serves three functions: community site (blog, knowledge base, forums), hosted tools (passage planner, energy sizer, VHF sim), and sync endpoint for spoke boats. All components are Docker-based and hosting-agnostic.

### 1.1 Supabase (Managed)

Supabase provides PostgreSQL, Auth, Realtime, and Storage as a single managed service.

**Region selection:**

- Primary region: EU (Frankfurt or London) for GDPR compliance. The project serves a global sailing community, but EU data residency satisfies the strictest regulatory requirements and covers the majority of cruising sailors.
- Supabase does not currently offer multi-region replication on managed plans. If latency becomes an issue for non-EU users, the CDN handles static assets and the Go API can be deployed to multiple regions with a shared Supabase backend.

**Tier selection:**

| Supabase Tier | Monthly Cost | Database | Storage | Bandwidth | Auth MAUs | Realtime Connections |
|---------------|-------------|----------|---------|-----------|-----------|---------------------|
| **Free** | $0 | 500 MB, 2 projects | 1 GB | 2 GB | 50,000 | 200 concurrent |
| **Pro** | $25 | 8 GB, unlimited projects | 100 GB | 250 GB | 100,000 | 500 concurrent |

**Recommendation: Start on Free tier.** The Free tier supports the first 100+ users comfortably. Upgrade to Pro when any of these thresholds are hit:
- Database exceeds 500 MB (likely around 500-1000 active boats with full profiles, routes, and almanac data)
- Storage exceeds 1 GB (user-uploaded photos and documents)
- Realtime connections exceed 200 (fleet tracking, live chat)

**Self-hosted fallback:** Supabase can be self-hosted via `docker-compose` on any VPS. The official `supabase/supabase` Docker setup includes PostgreSQL, GoTrue (auth), Realtime, Storage, PostgREST, and Kong (API gateway). This is documented as a fallback if the managed service becomes unsuitable, but is not the default path — managed Supabase eliminates operational burden for a solo builder.

### 1.2 Go API Server

The Go API server handles sync, RAG, MCP, weather proxying, and firmware tracking. It runs as a single Docker container.

**Hosting options evaluated:**

| Provider | Monthly Cost (1 vCPU, 256-512 MB) | ARM64 | Auto-scale | Deploy Method | Cold Start |
|----------|----------------------------------|-------|------------|---------------|------------|
| **Fly.io** | $0-5 (free allowance: 3 shared VMs) | Yes (Firecracker) | Yes | `fly deploy` | ~200ms (warm) |
| **Railway** | $5-10 | No (AMD64 only) | Yes | Git push | None (always on) |
| **Render** | $0-7 (free tier: 750 hrs) | No | Yes | Git push | 30s+ (free tier spins down) |
| **Hetzner VPS** | EUR 3.29 (CAX11 ARM64, 2 vCPU, 4 GB) | Yes | No | Docker + SSH | None |
| **DigitalOcean** | $4-6 (basic droplet) | No (AMD64) | No | Docker + SSH | None |
| **GCP Cloud Run** | $0-5 (free tier: 2M requests/mo) | No | Yes (to zero) | Container push | ~1-3s |
| **AWS ECS Fargate** | $10-15 | Yes | Yes | Task definition | ~10-30s |

**Recommendation: Fly.io** for the initial deployment.

Rationale:
- Free tier covers a solo-builder project with low traffic
- ARM64 support via Firecracker microVMs (matches spoke architecture)
- Deploys from Dockerfile with `fly deploy` — no CI pipeline changes needed
- Scales to zero on inactivity (cost control), wakes in ~200ms
- Global edge network with anycast routing — good for sailors worldwide
- Simple secrets management (`fly secrets set`)
- Built-in metrics and logging

**Fallback path:** If Fly.io pricing or reliability becomes an issue, Hetzner CAX11 (ARM64 VPS at EUR 3.29/mo) provides the best price-performance ratio for a single always-on instance. The Go binary is hosting-agnostic — any Docker host works.

### 1.3 Static Frontend (Astro Build Output)

The community site (`packages/site/`) builds to static HTML/CSS/JS via Astro. The tools package (`packages/tools/`) builds separately but deploys to the same CDN origin.

**Hosting options evaluated:**

| Provider | Free Tier | Build Integration | CDN | Custom Domains | Bandwidth |
|----------|-----------|-------------------|-----|----------------|-----------|
| **Cloudflare Pages** | Unlimited bandwidth, 500 builds/mo | Git push, GitHub Actions | Global (300+ PoPs) | Yes, free SSL | Unlimited |
| **Netlify** | 100 GB bandwidth, 300 build min/mo | Git push, GitHub Actions | Global | Yes, free SSL | 100 GB |
| **Vercel** | 100 GB bandwidth, 6000 build min/mo | Git push, GitHub Actions | Global (edge) | Yes, free SSL | 100 GB |
| **GitHub Pages** | Unlimited (public repos) | GitHub Actions only | Fastly CDN | Yes (CNAME) | Soft limits |

**Recommendation: Cloudflare Pages.**

Rationale:
- Unlimited bandwidth on free tier — no surprise bills as the community grows
- 300+ global PoPs — fast for sailors everywhere (this matters: cruisers access from marina WiFi on every continent)
- Free custom domain with automatic TLS
- Excellent build integration (GitHub Actions or direct Git push)
- Edge functions available if SSR is needed later (Astro adapter exists)
- Workers KV available for edge caching of dynamic content
- No vendor lock-in — static output deploys anywhere

### 1.4 DNS and Domains

- Register domain via Cloudflare Registrar (cheapest renewal, integrated with Cloudflare Pages)
- DNS managed by Cloudflare (free tier)
- Records:
  - `@` and `www` — CNAME to Cloudflare Pages deployment
  - `api.` — CNAME to Fly.io app (e.g., `above-deck-api.fly.dev`)
  - `analytics.` — A record to Umami VPS (if self-hosted)
- DNSSEC enabled via Cloudflare
- CAA records restricting certificate issuance to Cloudflare and Let's Encrypt

### 1.5 TLS/SSL

- Frontend: handled by Cloudflare Pages (automatic, free, edge-terminated)
- API: handled by Fly.io (automatic Let's Encrypt certificates)
- Supabase: handled by Supabase (managed TLS)
- No certificate management required by the project — all providers handle renewal automatically

### 1.6 Cost Estimates

All costs are infrastructure costs for running the open-source project. There are no paid tiers, no monetization, no revenue.

**100 users (launch):**

| Component | Monthly Cost |
|-----------|-------------|
| Supabase (Free tier) | $0 |
| Fly.io (free allowance) | $0 |
| Cloudflare Pages (free tier) | $0 |
| Domain registration | ~$1 (amortised) |
| **Total** | **~$1/mo** |

**1,000 users (growing community):**

| Component | Monthly Cost |
|-----------|-------------|
| Supabase (Pro tier) | $25 |
| Fly.io (1 shared VM, always on) | $2-5 |
| Cloudflare Pages (free tier) | $0 |
| Umami analytics (Hetzner VPS) | EUR 3.29 |
| Domain | ~$1 |
| **Total** | **~$35/mo** |

**10,000 users (established community):**

| Component | Monthly Cost |
|-----------|-------------|
| Supabase (Pro + compute addon) | $50-75 |
| Fly.io (2 VMs, 1 vCPU each) | $10-20 |
| Cloudflare Pages (free tier still) | $0 |
| Umami analytics (Hetzner VPS) | EUR 3.29 |
| Uptime monitoring (Hetzner VPS, shared) | $0 (shared with Umami) |
| Domain | ~$1 |
| **Total** | **~$70-100/mo** |

These estimates assume the project remains community-funded. At 10,000 users the infrastructure cost is roughly $0.01 per user per month.

---

## 2. CDN and Edge

### 2.1 Static Frontend Assets

All Astro build output (HTML, CSS, JS, images, fonts) is served via Cloudflare's CDN. Cache behaviour:

| Asset Type | Cache-Control Header | CDN TTL | Notes |
|------------|---------------------|---------|-------|
| HTML pages | `public, max-age=0, s-maxage=3600` | 1 hour | Stale-while-revalidate for instant loads |
| JS/CSS (hashed filenames) | `public, max-age=31536000, immutable` | 1 year | Content-addressed, safe to cache forever |
| Fonts (Google Fonts, self-hosted) | `public, max-age=31536000, immutable` | 1 year | Space Mono, Inter, Fira Code |
| Images | `public, max-age=86400` | 1 day | Blog images, icons |
| `manifest.json` | `public, max-age=0, s-maxage=86400` | 1 day | Must be fresh for PWA updates |
| `sw.js` (service worker) | `public, max-age=0` | No CDN cache | Browsers check for SW updates on every navigation |

### 2.2 Chart Tile Caching at Edge

MapLibre vector tiles (MVT/PBF) are served from a tile source (self-hosted PMTiles on S3/R2 or a third-party tile server). Cloudflare caches tile requests at edge.

- **Cache key:** `/{z}/{x}/{y}.pbf` — tiles are immutable for a given version
- **Cache-Control:** `public, max-age=604800` (7 days) for production tile sets
- **Cache invalidation:** Deploy new tile set with a versioned URL prefix (`/tiles/v2/{z}/{x}/{y}.pbf`)
- **Origin:** Cloudflare R2 (S3-compatible, zero egress fees) for self-hosted PMTiles; or protomaps.com CDN for community tiles
- **Bandwidth:** Vector tiles are typically 10-50 KB per tile. A full session of chart browsing might fetch 200-500 tiles (2-25 MB). At 10,000 users with Cloudflare R2, egress cost is $0.

### 2.3 GRIB File Distribution

Weather GRIB files (1-50 MB per region) are pre-processed by the Go API and stored in Supabase Storage or Cloudflare R2.

- **Cache-Control:** `public, max-age=3600` (1 hour) — GRIB data is refreshed every 6 hours by the major models
- **Distribution:** Files are fetched by the spoke during sync or by the PWA on demand
- **Edge caching:** Cloudflare caches GRIB files at PoPs near popular cruising areas
- **Compression:** GRIB2 is already compressed; serve with `Content-Encoding: identity` (no double-compression)

### 2.4 Cache Invalidation Strategy

- **Immutable assets** (hashed JS/CSS, versioned tiles): never invalidated, superseded by new URLs
- **Mutable assets** (HTML, GRIB, manifest.json): short CDN TTL + `stale-while-revalidate` for instant loads with background refresh
- **Emergency purge:** Cloudflare API purge by URL or purge-everything (rare, for security patches)
- **No query-string cache busting** — Cloudflare strips query strings from cache keys by default; use filename hashing instead

### 2.5 Geographic Distribution

Sailors are global. The CDN must perform well in:
- Caribbean (US PoPs, Miami/San Juan)
- Mediterranean (EU PoPs, Marseille/Athens/Istanbul)
- Southeast Asia (Singapore/Sydney)
- UK/Northern Europe (London/Amsterdam)
- Pacific (Auckland/Fiji/Tahiti — limited PoPs, Cloudflare has coverage)

Cloudflare's 300+ PoPs cover all major cruising areas. The Go API on Fly.io can be deployed to multiple regions if latency to Supabase (EU) becomes a bottleneck, but a single-region API is sufficient initially.

---

## 3. PWA Specification

### 3.1 Web App Manifest

```json
{
  "name": "Above Deck",
  "short_name": "Above Deck",
  "description": "Open-source sailing tools and boat management",
  "start_url": "/tools/",
  "scope": "/",
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#1a1a2e",
  "background_color": "#1a1a2e",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/mfd-dashboard-wide.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "MFD dashboard with instruments and chart"
    },
    {
      "src": "/screenshots/mfd-dashboard-narrow.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "MFD dashboard on mobile"
    }
  ],
  "categories": ["navigation", "weather", "utilities"],
  "lang": "en",
  "dir": "ltr"
}
```

**Notes:**
- `display: standalone` provides the cleanest MFD-like experience across all platforms. On iOS this is the maximum available mode. On Android, `standalone` preserves the status bar (clock, battery) which is useful at the helm.
- `orientation: any` rather than locked landscape — iOS does not support orientation lock, and the MFD frame should be responsive.
- `scope: "/"` allows the PWA to navigate the entire site (knowledge base, community) while `start_url: "/tools/"` opens directly into the MFD.
- `categories` helps with app store-like install prompts on Android.
- Screenshots trigger the richer install dialog on Android (app store-like cards).

### 3.2 Service Worker Strategy

Built with `@vite-pwa/astro` and Workbox. The service worker is generated at build time with runtime caching rules.

**Precache (install-time):**

| Asset | Size Estimate | Rationale |
|-------|--------------|-----------|
| App shell HTML | ~20 KB | Instant load, offline fallback |
| Critical CSS (Tailwind + custom) | ~50 KB | Styled before JS loads |
| Core JS bundles (React, Ant Design, Zustand) | ~200 KB (gzipped) | MFD shell, instruments, core UI |
| Offline fallback page | ~5 KB | Shown when network and cache both miss |
| PWA icons and splash screens | ~50 KB | Install experience |
| **Total precache** | **~325 KB** | Installed on first visit |

**Runtime caching strategies:**

| Route / Pattern | Strategy | Config | Rationale |
|----------------|----------|--------|-----------|
| `/api/*` | NetworkFirst | Timeout: 5s, fallback to cache, max entries: 200, max age: 24h | API responses should be fresh, but stale data is better than no data |
| `/tiles/{z}/{x}/{y}.pbf` | CacheFirst | Max entries: 10,000, max age: 30 days, purge on quota pressure | Chart tiles are large and slow to change; cache aggressively |
| `/weather/*`, `/grib/*` | NetworkFirst | Timeout: 10s, fallback to cache, max age: 6h | Weather data is time-sensitive but recent stale data is acceptable offshore |
| `/fonts/*` | CacheFirst | Max age: 365 days | Fonts never change between versions |
| `/icons/*`, `/images/*` | CacheFirst | Max age: 30 days | Static assets, rarely change |
| `/knowledge/*`, `/blog/*` | StaleWhileRevalidate | Max entries: 100, max age: 7 days | Content should be fresh but stale is fine |
| `wss://*` (WebSocket) | Not cached | — | Real-time instrument data, no caching value |

**Offline fallback page:**

When a navigation request fails and no cached response exists, the service worker serves `/offline.html` — a minimal page with the blueprint aesthetic that explains the user is offline and lists what functionality is available (cached tools, cached charts, cached knowledge base articles). No generic browser error page.

**Cache size management:**

- Total cache budget: 50 MB for non-tile data (API responses, content, assets)
- Tile cache budget: managed separately, user-configurable (default 500 MB, max based on available storage)
- Workbox `ExpirationPlugin` enforces `maxEntries` and `maxAgeSeconds` per cache
- When quota pressure is detected (`navigator.storage.estimate()`), evict tiles for areas the user hasn't viewed in 30+ days

### 3.3 Push Notifications

**Technology:** Web Push API with VAPID (Voluntary Application Server Identification) keys.

**VAPID key management:**
- Generate key pair once, store in environment variables
- Public key included in frontend config
- Private key used by Go API server to sign push messages

**Notification types:**

| Type | Priority | Content | Source |
|------|----------|---------|--------|
| Anchor drag alert | Urgent | "Anchor alarm: boat has moved 50m from set position" | Spoke (via hub relay) |
| Bilge pump activation | High | "Bilge pump activated — check boat" | Spoke (via hub relay) |
| Battery critical | High | "House battery below 11.8V" | Spoke (via hub relay) |
| Sync complete | Low | "Boat data synced — 23 new logbook entries" | Hub |
| Firmware update available | Low | "Raymarine Axiom firmware 4.2.1 available" | Hub |
| Weather alert | Medium | "Gale warning for your planned route" | Hub |

**Platform support:**
- Chrome (desktop + Android): full support
- Safari (macOS): full support
- Safari (iOS): supported since iOS 16.4, but only for installed PWAs (added to home screen)
- Firefox: full support

**Permission request timing:**
- Never request notification permission on first visit
- Request after the user has completed a meaningful action (e.g., linked their boat, set an anchor alarm, subscribed to weather alerts)
- Explain what notifications will be used for before requesting
- On iOS, requesting notification permission also activates Persistent Storage — important for cache retention

### 3.4 Background Sync

**One-off Background Sync (Chromium only):**
- Register sync event when the user makes a change while offline (e.g., edits a route)
- When connectivity resumes, the service worker fires the sync handler
- Sync handler processes the offline queue (IndexedDB) and pushes changes to the hub

**Periodic Background Sync (Chromium only, installed PWA only):**
- Register for periodic sync with `minInterval: 3600000` (1 hour)
- Browser throttles based on site engagement score — actual frequency may be hours
- Used for: weather data refresh, tide predictions, position report upload
- Not relied upon for critical data — the app fetches eagerly on open as the primary mechanism

**Background Fetch (Chromium only):**
- Used for large downloads: chart tile packs (PMTiles archives), GRIB file bundles
- Shows a persistent notification with download progress
- Continues even if the user closes the tab
- Ideal for pre-passage chart downloads over marina WiFi

**iOS limitations:**
- No Background Sync, no Periodic Background Sync, no Background Fetch
- All data fetching must happen while the app is in the foreground
- Mitigation: fetch eagerly on app open; pre-cache before passages; the spoke handles continuous data collection regardless of PWA state

### 3.5 Install Experience

**Android (Chrome):**
- `beforeinstallprompt` event fires after PWA criteria are met (manifest + service worker + HTTPS)
- Defer the prompt — do not show immediately
- Show a custom install banner (blueprint aesthetic, subtle, dismissible) after the user has used the app meaningfully (e.g., viewed 3+ pages, or used a tool)
- Banner text: factual, not promotional — explains that installing adds offline support and a home screen icon
- After install: app launches in standalone mode, no browser chrome

**iOS (Safari):**
- No programmatic install prompt — Safari does not fire `beforeinstallprompt`
- Show a custom banner with instructions: "Add to Home Screen" via the Share menu
- Detect iOS via user agent; show the banner only on iOS when not already in standalone mode
- After install: app launches in standalone mode (since iOS 26, all home screen sites default to standalone)

**Desktop (Chrome/Edge):**
- Install icon appears in the address bar automatically
- `beforeinstallprompt` event available for custom install UI
- Post-install: standalone window, appears in dock/taskbar

### 3.6 PWA on Spoke vs Hub

The same frontend codebase runs in two contexts with different data sources.

| Aspect | Hub (cloud PWA) | Spoke (on-boat) |
|--------|----------------|-----------------|
| **Served by** | Cloudflare Pages (CDN) | Go binary at `localhost:3000` |
| **Data source** | Hub API (`api.abovedeck.dev`) | Local WebSocket (`ws://localhost:3000/ws`) |
| **Auth** | Supabase Auth (Google OAuth) | Local PIN or no auth |
| **Service worker** | Full PWA with offline support | Caches for resilience (survives Go restart) |
| **HTTPS** | Yes (Cloudflare TLS) | No — HTTP on local network (see note) |
| **Install** | Standard PWA install from browser | Accessed via `http://abovedeck.local:3000` in browser |
| **Offline** | Service worker cache + IndexedDB | Always "offline" by design — data is local |
| **Push notifications** | Web Push via hub API | Not needed — alerts are local (audible, on-screen) |
| **Chart tiles** | Fetched from CDN, cached by SW | Served from local filesystem by Go binary |

**HTTPS on spoke:** Service workers require a secure context. On the spoke:
- `localhost` is treated as secure by all browsers — works if the display is connected directly to the spoke hardware
- `abovedeck.local` (mDNS) is not secure by default. Options:
  1. Chrome flag: `chrome://flags/#unsafely-treat-insecure-origin-as-secure` set to `http://abovedeck.local:3000`
  2. Self-signed certificate installed on client devices (the Go binary can generate and serve one)
  3. Access via IP address with a self-signed cert
- The setup guide documents all three approaches. Option 1 is recommended for simplicity.

**Shared code, different config:** The React components use an environment variable (`VITE_DATA_SOURCE=hub|spoke`) to determine the API base URL and WebSocket endpoint. Zustand stores and TanStack Query hooks are identical — only the transport layer changes.

---

## 4. Spoke Deployment

### 4.1 Docker Image Distribution

- **Registry:** GitHub Container Registry (`ghcr.io/above-deck/spoke`)
- **Tags:**
  - `latest` — most recent stable release
  - `v1.2.3` — specific version (semver)
  - `sha-abc1234` — commit SHA for development/debugging
- **Architecture:** Multi-arch manifest (`linux/amd64` + `linux/arm64`)
- **Image size:** 25-50 MB (Alpine base) or 15-30 MB (scratch base with static Go binary)
- **Signing:** cosign (Sigstore) keyless signing via GitHub OIDC. Image digest verified on the spoke before applying updates.
- **SBOM:** Attached to each image via cosign (Software Bill of Materials)

### 4.2 First-Time Installation

**Mac Mini M4:**
```bash
# 1. Install OrbStack (lightweight Docker VM for macOS)
brew install orbstack

# 2. Pull and run Above Deck
docker run -d \
  --name above-deck \
  --restart unless-stopped \
  --network host \
  -v above-deck-data:/data \
  ghcr.io/above-deck/spoke:latest
```

**Intel N100 (Ubuntu/Debian Linux):**
```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# 2. Pull and run Above Deck
docker run -d \
  --name above-deck \
  --restart unless-stopped \
  --network host \
  -v above-deck-data:/data \
  ghcr.io/above-deck/spoke:latest
```

**HALPI2 (HaLOS):**
```bash
# Docker pre-installed on HaLOS. Same command:
docker run -d \
  --name above-deck \
  --restart unless-stopped \
  --network host \
  -v above-deck-data:/data \
  ghcr.io/above-deck/spoke:latest
```

**One-liner install script:**
```bash
curl -fsSL https://install.abovedeck.dev | sh
```

The install script:
1. Detects OS and architecture (macOS ARM64, Linux AMD64, Linux ARM64)
2. Checks for Docker (installs if missing on Linux, prompts for OrbStack on macOS)
3. Pulls the latest spoke image
4. Creates the data volume
5. Starts the container with appropriate flags
6. Prints the access URL (`http://localhost:3000` or `http://abovedeck.local:3000`)

### 4.3 Auto-Start on Boot

**Docker restart policy:** `--restart unless-stopped` handles most cases. The container starts automatically after a reboot unless it was manually stopped.

**Linux (systemd):** For additional reliability, a systemd service file ensures Docker and the container start in the correct order:

```ini
[Unit]
Description=Above Deck Spoke
After=docker.service
Requires=docker.service

[Service]
Type=simple
Restart=always
RestartSec=5
ExecStartPre=-/usr/bin/docker stop above-deck
ExecStartPre=-/usr/bin/docker rm above-deck
ExecStart=/usr/bin/docker run --rm \
  --name above-deck \
  --network host \
  -v above-deck-data:/data \
  ghcr.io/above-deck/spoke:latest
ExecStop=/usr/bin/docker stop above-deck

[Install]
WantedBy=multi-user.target
```

**macOS (OrbStack):** OrbStack starts automatically on login by default. The Docker restart policy handles container auto-start. No additional configuration needed for Mac Mini M4 deployments where the user is always logged in.

### 4.4 Update Mechanism

Updates are never automatic and never forced. The user is always in control. Updates never happen while underway.

**Update flow:**

```
1. Spoke checks hub for new version
   GET https://api.abovedeck.dev/v1/spoke/releases/latest
   Response: { "version": "1.3.0", "digest": "sha256:abc...", "changelog": "...", "min_version": "1.0.0" }

2. UI shows notification in Settings → Updates:
   "Version 1.3.0 available (you have 1.2.0)"
   Changelog displayed inline.

3. User taps "Update Now"

4. System executes:
   a. docker pull ghcr.io/above-deck/spoke:v1.3.0
   b. cosign verify ghcr.io/above-deck/spoke:v1.3.0
   c. docker stop above-deck
   d. docker rename above-deck above-deck-prev
   e. docker run [same flags] ghcr.io/above-deck/spoke:v1.3.0
   f. Go binary runs SQLite migrations on startup
   g. Health check: GET http://localhost:3000/healthz
   h. If healthy: remove above-deck-prev container (keep image for rollback)
   i. If unhealthy: stop new container, restart above-deck-prev, alert user

5. Rollback available in Settings → Updates → "Revert to 1.2.0"
   Stops current container, starts previous image.
```

**Update check frequency:** Daily by default. Configurable (daily, weekly, manual only). The check is a single HTTPS GET request — negligible bandwidth.

**Offline / air-gapped updates:**
- Download image to USB on a laptop: `docker save ghcr.io/above-deck/spoke:v1.3.0 > above-deck-v1.3.0.tar`
- Load on boat: `docker load < above-deck-v1.3.0.tar`
- Update process is the same from step 4c onwards

**Safety constraints:**
- The update UI shows a warning if GPS indicates the boat is moving (speed > 0.5 kn)
- Updates require explicit user action — no background auto-updates
- The previous image is always retained for one-click rollback

### 4.5 Persistent Data

All spoke data lives in a single Docker volume mounted at `/data`:

```
/data/
  above-deck.db          # SQLite database (settings, routes, waypoints, logs, sync queue)
  above-deck.db-wal      # SQLite WAL file
  above-deck.db-shm      # SQLite shared memory file
  cache/
    charts/              # Cached PMTiles archives and individual tiles
    grib/                # Cached GRIB weather files
    rag/                 # RAG embeddings and vector data (sqlite-vec)
  uploads/               # User-uploaded photos, documents
  logs/                  # Application logs (rotated, 7-day retention)
  backups/               # Automated daily SQLite backups (keep 7 days)
```

**Volume survives container updates.** The Docker volume is independent of the container. Pulling a new image and recreating the container does not affect `/data`.

**Backup mechanisms:**
- **Automated daily backup:** SQLite `.backup` command (consistent even during writes), stored in `/data/backups/`, 7-day rotation
- **USB backup:** Settings → Backup → "Export to USB" — creates a compressed, optionally encrypted archive of the entire `/data` directory
- **Hub cloud backup:** Litestream continuously replicates the SQLite database to S3-compatible storage (Supabase Storage or Cloudflare R2). See section 6 for details.

### 4.6 Resource Constraints

| Resource | Budget | Notes |
|----------|--------|-------|
| **RAM** | 512 MB - 1 GB | Go binary (~50 MB) + SQLite (~20 MB) + RAG queries (spikes to ~200 MB) + WebSocket clients (~5 MB per client) |
| **Disk** | 5-20 GB | SQLite database (~100 MB), cached charts (1-10 GB), GRIB files (~500 MB), RAG data (~500 MB), logs (~100 MB) |
| **CPU** | Minimal idle, spikes during RAG | Idle: <1%. Parsing NMEA: 1-3%. RAG embedding query: 30-50% for 1-2 seconds. Chart tile serving: 5-10% burst. |
| **Network (local)** | Low | WebSocket: ~10 KB/s per client. NMEA TCP: ~5 KB/s per gateway. Total: <100 KB/s typical. |
| **Network (internet)** | Opportunistic | Sync: ~1-10 MB per session. Chart download: 50-500 MB per region (one-time). GRIB: 1-50 MB per forecast. |

### 4.7 Network Configuration

```bash
docker run -d \
  --name above-deck \
  --restart unless-stopped \
  --network host \
  -v above-deck-data:/data \
  ghcr.io/above-deck/spoke:latest
```

**`--network=host` rationale:** The spoke needs direct access to the local network for:
- mDNS/Bonjour service registration (`abovedeck.local`) and discovery (SignalK servers, NMEA gateways)
- UDP broadcast reception (NMEA WiFi gateways like NavLink2)
- USB device passthrough (iKonvert, VE.Direct, RTL-SDR)
- Low-latency communication with instruments

**Exposed ports (on host network):**

| Port | Protocol | Service | Access |
|------|----------|---------|--------|
| 3000 | HTTP | Web UI + API | Local network |
| 1883 | MQTT | MQTT broker (optional, for ESP32/DIY sensors) | Local network |

**Firewall:** On Linux, the install script configures `ufw` (if present) to allow port 3000 on the local network interface only. No ports are exposed to the internet. The boat's router/gateway provides NAT isolation from the internet.

---

## 5. Monitoring and Observability

### 5.1 Hub Monitoring

**Umami (self-hosted analytics):**
- Deployed as a Docker container on the same Hetzner VPS as other monitoring tools
- Privacy-respecting: no cookies, no personal data, GDPR-compliant by design
- Tracks: page views, unique visitors, referrers, countries, devices, browsers
- No third-party analytics trackers — Umami is the only analytics tool
- Dashboard accessible at `analytics.abovedeck.dev` (password-protected)

**Uptime monitoring:**
- Uptime Kuma (self-hosted) on the same VPS
- Monitors:
  - Hub API health: `GET https://api.abovedeck.dev/healthz` (every 60s)
  - Frontend: `GET https://abovedeck.dev` (every 60s)
  - Supabase: `GET` Supabase health endpoint (every 60s)
- Alerts via email or Telegram on downtime
- Public status page (optional): `status.abovedeck.dev`

**Go API metrics:**
- Prometheus-compatible `/metrics` endpoint (internal, not public)
- Key metrics: request count, request latency (p50/p95/p99), error rate, active WebSocket connections, sync queue depth, memory/CPU usage
- If Fly.io is used: Fly.io built-in metrics and logging (Grafana dashboard available)

### 5.2 Spoke Monitoring

**Health endpoint:** `GET http://localhost:3000/healthz`

Response:
```json
{
  "status": "healthy",
  "version": "1.2.0",
  "uptime_seconds": 86400,
  "checks": {
    "database": "ok",
    "disk_free_mb": 12400,
    "memory_used_mb": 210,
    "memory_total_mb": 8192,
    "cpu_percent": 2.1,
    "gateways": {
      "navlink2": { "status": "connected", "last_message_ms": 120 },
      "ikonvert": { "status": "connected", "last_message_ms": 85 }
    },
    "sync": {
      "last_sync": "2026-03-31T14:30:00Z",
      "pending_items": 3
    }
  }
}
```

**Health reporting to hub:**
- On each sync, the spoke sends a health summary to the hub
- Hub stores: spoke version, uptime, last seen, error count, resource usage
- Hub UI (Settings → My Boats) shows each linked spoke's health status
- No continuous telemetry — only on sync. The spoke does not phone home.

**Local diagnostics:**
- Settings → Diagnostics in the spoke web UI
- Shows: adapter status, data rates, error log (last 100 entries), memory/CPU graph, disk usage breakdown
- Prometheus-compatible `/metrics` endpoint (local network only, not exposed to internet)

### 5.3 No Third-Party Trackers

The project uses no third-party analytics, tracking pixels, session replay tools, or advertising identifiers. Umami is self-hosted and collects no personal data. This is a core privacy principle, not a temporary convenience.

---

## 6. Disaster Recovery

### 6.1 Hub Recovery

**Supabase PostgreSQL:**
- Managed backups: daily automatic backups with 7-day retention (Free tier) or point-in-time recovery with 7-day retention (Pro tier)
- Recovery: restore from Supabase dashboard or CLI
- RPO (Recovery Point Objective): 24 hours (Free) or minutes (Pro with PITR)
- RTO (Recovery Time Objective): minutes (managed restore)

**Go API server:**
- Stateless — no persistent data in the container. All state is in Supabase.
- Recovery: redeploy from GitHub (Fly.io: `fly deploy`, or re-run CI pipeline)
- RTO: minutes

**Frontend:**
- Static files in Git. Recovery: push to Cloudflare Pages.
- RTO: minutes

**Complete hub failure recovery:**
1. Supabase restores from backup (automatic or manual)
2. Go API redeployed from Git
3. Frontend redeployed from Git
4. DNS already points to new deployment (if provider changed, update records)
5. Spokes resume syncing automatically when hub is reachable

### 6.2 Spoke Recovery

**Litestream continuous replication:**

Litestream runs as a sidecar process (or within the Go binary) and continuously replicates the SQLite database to S3-compatible storage.

- **Target:** Supabase Storage (S3-compatible) or Cloudflare R2 (zero egress cost)
- **Replication lag:** seconds (streams WAL changes in near-real-time)
- **Storage cost:** negligible — SQLite databases are typically <100 MB, and Litestream stores only WAL segments
- **Configuration:**
  ```yaml
  # litestream.yml
  dbs:
    - path: /data/above-deck.db
      replicas:
        - type: s3
          bucket: above-deck-backups
          path: boats/${BOAT_ID}/
          endpoint: https://xxx.supabase.co/storage/v1/s3
          access-key-id: ${S3_ACCESS_KEY}
          secret-access-key: ${S3_SECRET_KEY}
  ```

**USB backup:**
- Settings → Backup → "Export to USB"
- Creates: `above-deck-backup-2026-03-31.tar.gz` (optionally GPG-encrypted with user passphrase)
- Contains: SQLite database, user uploads, configuration. Does not include cached charts or GRIB files (these can be re-downloaded).
- Recommended before: firmware updates, long passages, seasonal haul-out

**Recovery scenarios:**

| Scenario | Recovery Steps | Data Loss | RTO |
|----------|---------------|-----------|-----|
| **Spoke hardware dies** | New hardware + Docker install + `litestream restore` from S3 | Seconds (Litestream replication lag) | 30 minutes (hardware setup + restore) |
| **SD card / NVMe failure** | Replace storage + Docker install + `litestream restore` | Seconds | 15 minutes |
| **Corrupted database** | Stop container + `litestream restore` to point-in-time | Seconds to minutes | 5 minutes |
| **Accidental data deletion** | `litestream restore` to point-in-time before deletion | None (point-in-time recovery) | 5 minutes |
| **Hub goes down** | Spokes continue operating offline. Sync queue grows. Resume when hub returns. | No spoke data loss. Hub community data depends on Supabase backups. | Minutes to hours (hub recovery) |
| **Supabase goes down** | Spokes unaffected. Hub frontend still serves cached pages. API degrades gracefully. | No data loss (Supabase restores from backup). | Minutes (managed) |
| **No internet for weeks** | Spoke operates fully offline. Sync queue stores all changes. On reconnect, queue drains. | No loss — sync is idempotent and ordered. | Automatic on reconnect |
| **USB restore (no internet)** | `docker run` + mount USB + run restore script | Depends on USB backup age | 15 minutes |

**Self-hosted Supabase fallback:**
If Supabase managed service becomes unavailable long-term, the documented self-hosting path uses the official `supabase/supabase` Docker Compose setup. This runs all Supabase components (PostgreSQL, GoTrue, Realtime, Storage, PostgREST, Kong) on a single VPS. The Go API server connects to `localhost` instead of the Supabase cloud endpoint — a single environment variable change.

---

## 7. Scaling Considerations

The project is designed for a solo builder and a small community. Build for 100 users, plan for 10,000, do not optimise for 100,000.

### 7.1 Current Design Point: 100 Users

| Component | Capacity at 100 Users | Headroom |
|-----------|-----------------------|----------|
| Supabase Free tier (500 MB DB) | ~100 boats with full profiles, routes, almanac | Comfortable |
| Supabase Free tier (200 Realtime connections) | 100 concurrent users tracking positions | Tight if all are live simultaneously |
| Fly.io free tier (3 shared VMs) | Thousands of API requests/day | Massive headroom |
| Cloudflare Pages (unlimited bandwidth) | Unlimited | Unlimited |
| Go API (single instance) | Thousands of concurrent requests | Massive headroom |

**No scaling action needed at 100 users.** Everything runs on free tiers.

### 7.2 Growth Trigger: 1,000 Users

| Trigger | Action | Cost Impact |
|---------|--------|-------------|
| Database exceeds 500 MB | Upgrade Supabase to Pro ($25/mo) | +$25/mo |
| Realtime connections exceed 200 | Supabase Pro includes 500 | Covered by Pro |
| Storage exceeds 1 GB | Supabase Pro includes 100 GB | Covered by Pro |
| API response time increases | Upgrade Fly.io VM to dedicated (1 vCPU, 256 MB) | +$5-10/mo |

### 7.3 Growth Trigger: 10,000 Users

| Trigger | Action | Cost Impact |
|---------|--------|-------------|
| Database exceeds 8 GB | Supabase compute addon | +$25-50/mo |
| Realtime connections exceed 500 | Supabase connection pooling (Supavisor), evaluate architecture | +$25/mo (estimate) |
| API needs multiple regions | Deploy Fly.io VMs in EU + US | +$10-20/mo |
| Vector search (pgvector) slows down | Add dedicated index, consider Supabase Pro compute | Covered by compute addon |
| Sync queue throughput bottleneck | Go API horizontal scaling (2-3 instances behind Fly.io load balancer) | +$10-20/mo |

### 7.4 What Does Not Need Scaling

| Component | Why It Scales Naturally |
|-----------|----------------------|
| **CDN (static assets)** | Cloudflare handles any traffic level on free tier |
| **Chart tiles (R2)** | S3-compatible, no egress fees, effectively unlimited |
| **Spoke deployment** | Each spoke is independent — 10,000 spokes do not load the hub more than 10,000 occasional sync requests |
| **Go binary performance** | A single Go instance handles thousands of concurrent requests. The API is stateless and CPU-light. |
| **SQLite on spoke** | Each spoke has its own database. No shared database bottleneck. |

### 7.5 When to Worry

| Signal | Meaning | Response |
|--------|---------|----------|
| Supabase dashboard shows consistent >80% CPU | Database queries need optimisation or compute upgrade | Add indexes, optimise queries, then upgrade compute |
| API p95 latency > 500ms | Go server is CPU-bound (likely RAG queries) | Profile, optimise, then add instances |
| Sync queue grows unboundedly | Hub cannot process sync requests fast enough | Add API instances, batch sync processing |
| Realtime disconnects / reconnect storms | Supabase connection limit hit | Upgrade tier, implement exponential backoff on clients |
| Disk usage growing faster than expected | Time-series data or user uploads | Implement retention policies, archive old data |

**Principle: no premature optimisation.** Measure first, then act. Document thresholds so future contributors know when to intervene.

---

## Appendix A: Decision Log

| Decision | Chosen | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Supabase (managed) | Yes | Self-hosted Postgres, PlanetScale, Neon | Managed reduces ops burden. Auth + Realtime + Storage included. Self-hosted documented as fallback. |
| Fly.io for Go API | Yes | Railway, Render, Hetzner VPS, Cloud Run | Free tier, ARM64, global edge, simple deploys. Hetzner as fallback for cost. |
| Cloudflare Pages for frontend | Yes | Netlify, Vercel, GitHub Pages | Unlimited bandwidth, 300+ PoPs, R2 integration for tiles. |
| Cloudflare R2 for tiles/GRIB | Yes | S3, Supabase Storage, Backblaze B2 | Zero egress fees — critical for high-bandwidth tile serving. |
| ghcr.io for spoke images | Yes | Docker Hub, Quay.io | Free for public images, integrated with GitHub Actions, cosign signing. |
| Litestream for spoke backup | Yes | Manual SQLite backup, rqlite, LiteFS | Continuous replication, minimal config, battle-tested. |
| `@vite-pwa/astro` + Workbox | Yes | Custom service worker, Astro SW plugin | Mature, well-documented, handles precaching and runtime strategies. |
| `display: standalone` | Yes | `fullscreen` | Works on all platforms including iOS. Preserves status bar for helm use. |
| HTTP on spoke (not HTTPS) | Default | Self-signed cert, local CA | Isolated boat network does not need TLS. PWA features enabled via Chrome flag or localhost. |

## Appendix B: Checklist for Launch

- [ ] Supabase project created (Free tier, EU region)
- [ ] Fly.io app deployed with Go API Docker image
- [ ] Cloudflare Pages connected to GitHub repo
- [ ] Domain registered and DNS configured
- [ ] VAPID keys generated and configured
- [ ] Umami deployed and tracking code added
- [ ] Uptime Kuma monitoring hub API and frontend
- [ ] ghcr.io repository created and CI pushing spoke images
- [ ] cosign signing configured in GitHub Actions
- [ ] Litestream S3 bucket created for spoke backups
- [ ] Install script (`install.abovedeck.dev`) hosted and tested on all three hardware targets
- [ ] Offline fallback page (`/offline.html`) designed and cached
- [ ] PWA manifest validated (Lighthouse PWA audit score 100)
- [ ] Service worker caching verified for all route patterns
- [ ] Push notification flow tested on Chrome, Safari, and iOS PWA
- [ ] Spoke update mechanism tested (pull, verify, stop, start, rollback)
- [ ] Spoke health endpoint (`/healthz`) returning correct data
- [ ] Documentation: spoke install guide for Mac Mini M4, Intel N100, HALPI2
