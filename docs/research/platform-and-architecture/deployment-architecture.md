# Deployment Architecture for a Marine Boat Computer Platform

**Date:** 2026-03-20
**Status:** Research complete
**Related:** [Hardware & Connectivity Technologies](./hardware-connectivity-technologies.md), [D3KOS & Marine OS Deep Dive](./d3kos-and-marine-os-deep-dive.md)

---

## Executive Summary

Above Deck needs to run in three distinct environments: on a boat (offline, local network only), in the cloud (community site, sync hub), and on diverse hardware. This document covers hardware options beyond Raspberry Pi, Docker deployment patterns, cloud sync architecture, scalability strategies, and security considerations for each deployment tier.

The core architectural principle: **the boat is the source of truth for its own data.** The cloud is a convenience layer for sync, community, and backup — never a dependency.

---

## 1. Hardware Options Beyond Raspberry Pi

The Raspberry Pi (covered in [hardware-connectivity-technologies.md](./hardware-connectivity-technologies.md)) remains the default recommendation due to its ecosystem of marine HATs (PICAN-M, MacArthur HAT, HALPI2). But it is not the only option, and some deployments benefit from more capable or more ruggedised hardware.

### 1.1 Hardware Comparison

| Hardware | Idle Power | Typical Cost | CPU | RAM | Marine Suitability | Docker Support |
|----------|-----------|-------------|-----|-----|--------------------|----------------|
| **Raspberry Pi 5** | ~2.7W | $80-120 | ARM Cortex-A76 (4-core) | 4-8 GB | Good with enclosure + HAT | Native (ARM64) |
| **HALPI2 (CM5)** | ~3-4W | $300+ | CM5 ARM (4-core) | 2-16 GB | Excellent — waterproof aluminium, NMEA built-in | Native (ARM64) |
| **Intel N100 Mini PC** | ~3.5-6W | $100-200 | Intel N100 (4-core) | 8-16 GB | Good — fanless models available, needs enclosure | Native (AMD64) |
| **Intel NUC / ASUS NUC** | ~7-15W | $300-600 | Intel Core i3-i7 | 8-64 GB | Fair — requires fanless case (Akasa), enclosure | Native (AMD64) |
| **Fanless Industrial PC** | ~10-25W | $400-1500 | Intel i3/i5/N-series | 8-32 GB | Excellent — DNV certified options, -25C to 70C, 9-36V DC | Native (AMD64) |
| **Synology NAS (DS224+)** | ~15-20W | $300-400 | Intel Celeron J4125 | 2-6 GB | Fair — not marine-rated, needs dry location | Container Manager |
| **Old Laptop** | ~15-40W | Free (repurposed) | Varies | Varies | Poor — fans, fragile, high power | Native |

### 1.2 Intel N100 Mini PCs

The Intel N100 has emerged as a strong alternative to the Raspberry Pi 5. At approximately the same idle power draw (~3.5W), it offers significantly more performance, supports up to 16 GB RAM, and runs native x86_64 Linux. Fanless N100 mini PCs are widely available from vendors like Beelink, MinisForum, and GMKtec for $100-200.

**Pros:** Native AMD64, more RAM, NVMe storage, better single-thread performance, widely available.
**Cons:** No marine HAT ecosystem, no direct NMEA/CAN bus interface (requires USB adapters like Actisense NGT-1), larger form factor, 12V input but not wide-voltage tolerant without regulator.

**Best for:** Users who want more compute headroom (e.g., running InfluxDB + Grafana alongside Above Deck) and are comfortable with USB NMEA adapters.

### 1.3 Compute Module 5 Industrial Boards

The Raspberry Pi Compute Module 5 (CM5) separates the compute from the carrier board, enabling purpose-built marine hardware.

**HALPI2 (Hat Labs):** The current gold standard for marine CM5 deployments. Features a waterproof aluminium enclosure that doubles as a heatsink, integrated NMEA 2000 (CAN bus) and NMEA 0183 (RS-485), four USB 3.0 ports, NVMe SSD slot, dual HDMI, Gigabit Ethernet. Ships with HaLOS (a container-first Raspberry Pi OS distribution) pre-installed with Signal K, AvNav, and other marine software.

Other CM5 carrier boards (Geekworm X1501, Seeed CM5 Minima) exist but lack marine-specific interfaces and enclosures.

### 1.4 Fanless Industrial PCs

For commercial or bluewater deployments where reliability is paramount:

- **Axiomtek tBOX300-510-FL:** DNV and IEC 60945 certified for marine bridge equipment. Wide temperature (-25C to 70C), wide voltage (9-36V DC), fanless. Intel Core i-series. ~$800-1200.
- **Stealth LPC-800:** Wide temperature mini PC, fanless, 12V DC input. ~$500-800.
- **OnLogic Helix Series:** Industrial NUC-class systems, fanless, wide temperature, DIN rail mount. ~$400-700.

**Pros:** Built for harsh environments, wide voltage input matches boat 12V/24V systems directly, no moving parts, long product lifecycles.
**Cons:** Expensive, no marine HAT ecosystem, overkill for most recreational boats.

**Best for:** Commercial vessels, charter fleets, bluewater cruisers who need multi-year reliability without maintenance.

### 1.5 NAS Devices

Synology and QNAP NAS devices run Docker (via Container Manager or Container Station) and are already present on many boats for media and file storage.

**Pros:** Already on the boat, built-in RAID storage, web management UI, Docker support.
**Cons:** Not marine-rated, no NMEA interfaces, higher power draw, limited CPU, ARM models have weaker Docker support.

**Best for:** Users who already have a NAS and want to run Above Deck as an additional container without dedicated hardware.

### 1.6 Repurposed Laptops/Desktops

An old ThinkPad or mini desktop can run Above Deck via Docker. Zero acquisition cost.

**Pros:** Free, powerful, built-in screen (laptop), built-in UPS (laptop battery).
**Cons:** High power consumption, fans (salt air kills them), fragile, unpredictable hardware failures, large form factor.

**Best for:** Experimentation and development only. Not recommended for permanent installation.

### 1.7 Redundancy Patterns

For bluewater or safety-critical deployments:

| Pattern | Description | Complexity |
|---------|-------------|------------|
| **Cold spare** | Second SD card / NVMe with identical image. Swap on failure. | Low |
| **Warm standby** | Second Pi/device on the network, data replicated via SQLite backup. Manual switchover. | Medium |
| **Active-passive failover** | Two devices, one active. Heartbeat monitoring, automatic failover via keepalived or custom watchdog. | High |
| **Distributed** | Split services across devices (e.g., Pi for NMEA/SignalK, NUC for Above Deck + Grafana). Each can operate independently. | Medium |

**Recommendation:** For most boats, a cold spare (pre-imaged SD card in a dry bag) provides 90% of the resilience at 10% of the complexity. The Go binary + SQLite database is small enough that a full backup fits on a USB stick.

---

## 2. Docker Deployment Patterns

### 2.1 Single Container: Go Server + Static Frontend

The simplest deployment. The Go binary embeds the built Astro/React static frontend using `embed.FS`, serves it directly, and provides the API. The Docker image uses a multi-stage build:

```
Stage 1: Node — build Astro static site
Stage 2: Go — build Go binary
Stage 3: scratch/alpine — copy binary + static assets
```

**Resulting image size:** 15-30 MB (scratch) or 25-50 MB (alpine).

```dockerfile
# Example multi-stage Dockerfile (conceptual)
FROM node:22-alpine AS frontend
WORKDIR /app
COPY packages/site/ .
RUN pnpm install && pnpm build

FROM golang:1.23-alpine AS backend
WORKDIR /app
COPY packages/api/ .
COPY --from=frontend /app/dist ./static
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

FROM scratch
COPY --from=backend /app/server /server
COPY --from=backend /app/static /static
ENTRYPOINT ["/server"]
```

**Pros:** Single process, minimal resource usage, simple to deploy and update.
**Cons:** No separate scaling, restart of server restarts frontend.

**This is the recommended default for boat deployments.**

### 2.2 Docker Compose: Multi-Service Stack

For boats that want observability, time-series storage, or additional services:

```yaml
services:
  above-deck:
    image: abovedeck/server:latest
    ports: ["8080:8080"]
    volumes:
      - ./data:/data
    restart: unless-stopped

  influxdb:
    image: influxdb:2-alpine
    volumes:
      - influx-data:/var/lib/influxdb2
    restart: unless-stopped

  grafana:
    image: grafana/grafana-oss:latest
    ports: ["3001:3000"]
    volumes:
      - grafana-data:/var/lib/grafana
    restart: unless-stopped

  signalk:
    image: signalk/signalk-server:latest
    ports: ["3000:3000"]
    volumes:
      - signalk-data:/home/node/.signalk
    restart: unless-stopped
```

**Resource budget on Raspberry Pi 5 (8 GB):**

| Service | RAM (typical) | CPU (idle) |
|---------|--------------|------------|
| Above Deck (Go) | 20-50 MB | <1% |
| SignalK | 100-200 MB | 1-3% |
| InfluxDB | 200-500 MB | 1-5% |
| Grafana | 50-100 MB | <1% |
| **Total** | **370-850 MB** | **3-10%** |

A Pi 5 with 8 GB has plenty of headroom for this stack.

### 2.3 Multi-Architecture Builds

Above Deck must ship images for both `linux/arm64` (Raspberry Pi, CM5, Apple Silicon dev) and `linux/amd64` (Intel NUC, industrial PCs, cloud).

**Build strategy using GitHub Actions:**

1. Go cross-compilation handles the binary: set `CGO_ENABLED=0`, `GOOS=linux`, `GOARCH=arm64|amd64`. No QEMU needed for the Go build step.
2. Frontend build is architecture-independent (static HTML/JS/CSS).
3. Use `docker buildx` with `--platform linux/amd64,linux/arm64` to produce a multi-arch manifest.
4. Push to GitHub Container Registry (ghcr.io) as a single tag that resolves to the correct architecture.

**Key constraint:** If the Go server uses CGo (e.g., for SQLite via `mattn/go-sqlite3`), cross-compilation becomes significantly harder. Use `modernc.org/sqlite` (pure Go) or `glebarez/go-sqlite` instead — no CGo required, clean cross-compilation.

### 2.4 Update Mechanisms

| Method | Requires Internet | Automatic | Rollback | Best For |
|--------|------------------|-----------|----------|----------|
| **Watchtower** | Yes (polls registry) | Yes | No native rollback | Marina/Starlink boats with regular connectivity |
| **Manual `docker pull`** | Yes (at time of pull) | No | Keep previous image tag | Occasional connectivity |
| **Pre-staged image** | No | No | Swap image files | Air-gapped / offshore |
| **USB sideload** | No | No | Keep previous USB | Extended offshore passages |
| **OTA via Above Deck UI** | Yes (check + download) | No (user-initiated) | Built-in via image tagging | Recommended default |

**Recommended approach:** Above Deck's web UI shows available updates when connectivity exists. The user initiates the update. The system pulls the new image, verifies its digest, stops the old container, starts the new one. The previous image is retained for rollback.

For extended offshore passages, pre-built images can be downloaded to a USB drive before departure and loaded via `docker load`.

### 2.5 Data Persistence

```
/data/
  above-deck.db          # SQLite database (settings, routes, waypoints, logs)
  backups/               # Automated daily SQLite backups (cp + WAL checkpoint)
  uploads/               # User-uploaded files (charts, documents)
```

The `/data` directory is a Docker volume mounted from the host. SQLite WAL mode enables concurrent reads during writes. Daily backups use SQLite's `.backup` command (consistent even during writes).

**Backup strategy:**
- Automatic daily SQLite backup to `/data/backups/` (keep 7 days)
- On USB insert: offer to export backup to USB
- On connectivity: sync critical data to cloud (see Section 3)

---

## 3. Cloud Sync Architecture

### 3.1 Core Principle: Offline-First

The boat operates independently. It must never require internet connectivity to function. Cloud sync is opportunistic — it happens when connectivity is available and pauses cleanly when it is not.

### 3.2 What Syncs vs. What Stays Local

| Data Category | Syncs to Cloud | Direction | Rationale |
|---------------|---------------|-----------|-----------|
| User settings / preferences | Yes | Bidirectional | Roam between devices |
| Routes and waypoints | Yes | Bidirectional | Plan on laptop, execute on boat |
| Passage logs | Yes | Boat to cloud | Backup + community sharing |
| Maintenance records | Yes | Bidirectional | Access from anywhere |
| Community contributions | Yes | Bidirectional | KB articles, forum posts |
| Solar/energy configuration | Yes | Bidirectional | Equipment profiles |
| Real-time instrument data | **No** | Local only | Too high volume, no value in cloud |
| NMEA sentence stream | **No** | Local only | Real-time telemetry stays local |
| Time-series (InfluxDB) | **No** | Local only | Volume too large; export summaries instead |
| Cached charts/tiles | **No** | Local only | Large, copyrighted, already available in cloud |

### 3.3 Sync Strategy: Last-Write-Wins with Conflict Detection

CRDTs (Conflict-free Replicated Data Types) are mathematically elegant but add significant complexity. For Above Deck's use case, **last-write-wins (LWW) with conflict detection** is the pragmatic choice:

**Why not CRDTs:**
- Above Deck's synced data is relatively simple (settings, routes, logs) — not collaborative real-time editing.
- CRDTs require specialised data structures that complicate the Go server and frontend.
- The primary conflict scenario (editing a route on the boat and on a laptop simultaneously while offline) is rare and can be handled with simpler mechanisms.

**Why not Operational Transforms:**
- OT is designed for real-time collaborative text editing (Google Docs). Massive overkill for structured record sync.

**Recommended approach:**

1. Every synced record carries a `updated_at` timestamp (server-generated UTC) and a `device_id`.
2. On sync, compare timestamps. If the cloud version is newer, pull it. If the local version is newer, push it.
3. If both sides changed the same record while offline (detected by `device_id` + `updated_at` divergence), flag as a conflict and present both versions to the user.
4. For append-only data (passage logs, maintenance records), no conflict is possible — merge by union.

**Sync protocol:**

```
1. Boat connects to internet
2. Above Deck server sends: "last sync timestamp + list of locally changed record IDs"
3. Cloud responds with: "records changed since last sync + ack of received records"
4. Boat applies remote changes, pushes local changes
5. Conflicts (if any) queued for user resolution
6. Update last sync timestamp
```

### 3.4 PowerSync as an Alternative

PowerSync is a Postgres-to-SQLite sync layer that integrates with Supabase. It taps into Postgres logical replication (WAL) to stream changes to clients, where a local SQLite database serves as the client-side store.

**Pros:** Purpose-built for offline-first, handles partial sync (only sync relevant data per user), well-tested with Supabase.
**Cons:** Adds a dependency (PowerSync service), designed primarily for mobile/web clients rather than server-to-server sync, commercial product with a free tier.

**Verdict:** Worth evaluating when the sync layer is built. May be a better fit for the web/mobile client sync than for boat-server-to-cloud-server sync.

### 3.5 Bandwidth-Aware Sync

Boats have wildly varying connectivity:

| Connection | Typical Bandwidth | Latency | Cost | Availability |
|------------|------------------|---------|------|--------------|
| **Marina WiFi** | 1-20 Mbps | 20-100 ms | Free/cheap | In port only |
| **Starlink** | 50-400 Mbps (at anchor), degraded underway | 25-40 ms | $250-5000/mo | Most latitudes, poor in heavy seas |
| **Cellular (4G/5G)** | 5-100 Mbps | 30-80 ms | Per-GB in many countries | Coastal only |
| **Iridium GO!** | 2.4 kbps | 500+ ms | Very expensive per-KB | Global |

**Sync behaviour must adapt:**

- **High bandwidth (Starlink, marina WiFi):** Full sync — all pending changes, pull updates, sync community data.
- **Medium bandwidth (cellular):** Essential sync only — user settings, routes, critical updates. Defer community data and large payloads.
- **Low bandwidth (Iridium):** Emergency only — position reports, critical alerts. No general sync.
- **No connectivity:** Queue all changes locally. No retry loops (waste battery).

The sync client should detect connection quality (bandwidth estimate + latency) and adjust its sync scope automatically. User override always available.

### 3.6 Supabase as the Cloud Backend

The cloud deployment uses Supabase (hosted) for:

- **PostgreSQL + PostGIS:** Community data, user accounts, shared routes/waypoints with geographic queries.
- **Auth:** Google OAuth (PKCE flow) for cloud accounts.
- **Real-time:** Supabase Realtime for live updates to the community site (new KB articles, forum posts).
- **Storage:** User uploads (photos, documents) via Supabase Storage.
- **Edge Functions:** Sync endpoint, webhook processing.

The boat's Go server talks to Supabase's REST API (or direct Postgres connection) during sync windows. No Supabase client SDK needed on the Go server — standard HTTP calls to the PostgREST API.

---

## 4. Scalability

### 4.1 Single-Boat Deployment

```
┌─────────────────────────────────────────┐
│  Boat Local Network (192.168.x.x)       │
│                                         │
│  ┌─────────────┐    ┌───────────────┐   │
│  │ Above Deck  │    │ Tablet/Phone  │   │
│  │ Go Server   │◄──►│ (Browser)     │   │
│  │ + SQLite    │    └───────────────┘   │
│  │ + Static UI │                        │
│  └──────┬──────┘    ┌───────────────┐   │
│         │           │ Laptop        │   │
│         ├──────────►│ (Browser)     │   │
│         │           └───────────────┘   │
│    ┌────┴────┐                          │
│    │ NMEA    │                          │
│    │ Bus     │                          │
│    └─────────┘                          │
└─────────────────────────────────────────┘
```

- **Process count:** 1 (Go binary)
- **Database:** SQLite (single file, WAL mode)
- **RAM:** 20-50 MB
- **CPU:** <1% idle, brief spikes on page loads
- **Storage:** <100 MB for application + database (excluding charts)
- **Concurrent clients:** 5-10 browsers on local network (limited by WiFi, not server)

### 4.2 Marina Deployment

A marina or charter company runs one Above Deck server for multiple boats:

```
┌──────────────────────────────────────────────────┐
│  Marina Network                                  │
│                                                  │
│  ┌─────────────────┐                             │
│  │ Above Deck      │    ┌──────┐  ┌──────┐      │
│  │ Go Server       │◄──►│Boat 1│  │Boat 2│ ...  │
│  │ + PostgreSQL    │    └──────┘  └──────┘      │
│  │ + Reverse Proxy │                             │
│  └─────────────────┘                             │
└──────────────────────────────────────────────────┘
```

- **Database:** PostgreSQL (multi-tenant, one schema with boat_id column, RLS policies)
- **RAM:** 256 MB - 1 GB depending on boat count
- **Concurrent boats:** 10-100 per instance
- **Deployment:** Docker Compose on a small server or NUC at the marina

### 4.3 Cloud Deployment (Community Site)

```
┌──────────────────────────────────────────────────────────┐
│  Cloud (Supabase + CDN)                                  │
│                                                          │
│  ┌──────────┐  ┌────────────┐  ┌──────────────────────┐ │
│  │ Supabase │  │ Astro Site │  │ Sync API             │ │
│  │ Postgres │  │ (SSR/CDN)  │  │ (Go or Edge Function)│ │
│  │ + Auth   │  │            │  │                      │ │
│  │ + Storage│  └────────────┘  └──────────────────────┘ │
│  └──────────┘                                            │
└──────────────────────────────────────────────────────────┘
         ▲              ▲                  ▲
         │              │                  │
    Community      Web Visitors      Boat Sync
     Users                           (opportunistic)
```

- **Database:** Supabase PostgreSQL (managed, with PostGIS for geographic queries)
- **Compute:** Astro SSR on Node.js (Vercel/Fly.io/Cloudflare), Go sync API as separate service or Edge Function
- **CDN:** Static assets via CDN (Cloudflare, Vercel edge)
- **Scale:** Thousands of users, handled by Supabase's managed Postgres + connection pooling (Supavisor)

### 4.4 Database Strategy by Tier

| Tier | Database | Rationale |
|------|----------|-----------|
| **Boat (local)** | SQLite (WAL mode) | Zero config, single file, embedded in Go binary (pure-Go driver), trivial backup, survives power loss |
| **Marina (multi-boat)** | PostgreSQL | Multi-tenant, concurrent writes from multiple boats, RLS for tenant isolation |
| **Cloud (community)** | Supabase PostgreSQL + PostGIS | Managed, scalable, geographic queries for routes/waypoints, built-in auth and real-time |

The Go server abstracts the database layer behind an interface so the same codebase runs against SQLite (boat) or PostgreSQL (marina/cloud) with a build flag or environment variable.

---

## 5. Security

### 5.1 Local Network Security

**The core challenge:** A boat's local network has no internet access, which means no Let's Encrypt certificates, no OCSP stapling, and no certificate transparency. But the Go server still needs to serve a web UI to browsers on the local network.

**Approaches:**

| Approach | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| **Plain HTTP** | Simple, works everywhere | No encryption, browser warnings on some APIs (e.g., clipboard, geolocation) | Acceptable for isolated boat network |
| **Self-signed TLS cert** | Encrypted traffic | Browser warnings, must install CA on each device | Optional, for users who want it |
| **Local CA (mkcert)** | Trusted by devices after one-time CA install | Setup complexity, CA distribution to all devices | Good for technical users |
| **Wildcard cert on owned domain** | Fully trusted by browsers | Requires owning a domain, DNS API for renewal | Best UX, moderate setup |
| **mDNS + HTTP** | Zero-config discovery (`abovedeck.local`) | No encryption, `.local` cannot get public TLS certs | Recommended default |

**Recommended default:** HTTP on the local network, discoverable via mDNS as `abovedeck.local`. The Go server registers itself via mDNS (using a library like `grandcat/zeroconf`). Any device on the boat's WiFi can open `http://abovedeck.local:8080` with no configuration.

**Why HTTP is acceptable on a boat:**
- The network is physically isolated (no internet, no untrusted devices unless the WiFi password is shared).
- The threat model is fundamentally different from the public internet. An attacker would need to be physically on the boat or within WiFi range.
- Browser APIs that require HTTPS (Service Workers for PWA, clipboard, geolocation) can be enabled by adding `abovedeck.local` to the browser's insecure-origins allowlist, or by using the self-signed cert approach.

**For PWA support (Service Workers):** Service Workers require a secure context. `localhost` is treated as secure, but `abovedeck.local` is not in most browsers. Options:
1. Access via `localhost` if on the same device (e.g., display connected directly to Pi).
2. Use a self-signed cert and install the CA on client devices.
3. Chrome: enable `chrome://flags/#unsafely-treat-insecure-origin-as-secure` for `http://abovedeck.local:8080`.

### 5.2 Authentication

| Context | Auth Method | Rationale |
|---------|-------------|-----------|
| **Boat (local, single user)** | None, or optional PIN | Single owner, trusted network. Friction-free access is more important than security. |
| **Boat (local, crew)** | Optional PIN or simple password | Prevent accidental changes by crew. Not a security boundary. |
| **Boat (local, charter)** | Per-charter code, auto-expire | Charter company needs to reset between guests. |
| **Marina (multi-boat)** | Username/password or token per boat | Tenant isolation. Each boat authenticates to the marina server. |
| **Cloud (community)** | Google OAuth (PKCE flow) via Supabase Auth | Standard web auth. No passwords to manage. |

**Boat-to-cloud sync auth:** The boat's Go server authenticates to the cloud sync API using a long-lived API key (generated when the user links their boat to their cloud account). The key is stored in the local SQLite database, encrypted at rest with a device-specific key.

### 5.3 Data Encryption at Rest

| Data | Encrypted? | Method | Rationale |
|------|-----------|--------|-----------|
| SQLite database | Optional | SQLCipher or application-level encryption of sensitive fields | Most boat data (instrument readings, routes) is not sensitive. API keys and tokens should be encrypted. |
| Backups on USB | Recommended | GPG symmetric encryption with user-chosen passphrase | USB sticks get lost. |
| Cloud data | Yes (managed) | Supabase handles encryption at rest (AES-256) | Standard cloud practice. |
| Sync traffic | Yes | HTTPS to Supabase endpoints | Standard TLS. |

**Pragmatic stance:** Full database encryption (SQLCipher) adds complexity and CPU overhead on low-power devices. Encrypt sensitive fields (API keys, tokens, passwords) at the application level. Leave instrument data and routes unencrypted — the threat model does not justify the overhead.

### 5.4 Update and Image Signing

Docker images published to ghcr.io should be signed using cosign (Sigstore). The update mechanism on the boat verifies the signature before applying an update.

```
Build pipeline:
1. Build multi-arch image
2. Push to ghcr.io/abovedeck/server:v1.2.3
3. Sign with cosign (keyless, via GitHub OIDC)
4. Attach SBOM (Software Bill of Materials)

Update on boat:
1. Pull new image
2. Verify cosign signature
3. If valid: stop old container, start new one, retain old image
4. If invalid: reject update, alert user
```

For USB sideloaded images, the image tarball includes a detached cosign signature. The boat verifies before loading.

---

## 6. Deployment Recipes

### 6.1 Quickstart: Raspberry Pi 5

```bash
# On a fresh Raspberry Pi OS Lite (64-bit)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Run Above Deck
docker run -d \
  --name above-deck \
  --restart unless-stopped \
  -p 8080:8080 \
  -v above-deck-data:/data \
  ghcr.io/abovedeck/server:latest
```

Access at `http://<pi-ip>:8080` or `http://abovedeck.local:8080` (mDNS).

### 6.2 HALPI2 with HaLOS

HaLOS (Hat Labs Operating System) is a container-first Raspberry Pi distribution with a web-based app store. Above Deck would be published as a HaLOS app, installable from the browser-based management UI with no terminal required.

### 6.3 Intel N100 Mini PC

```bash
# On Ubuntu Server 24.04 (minimal)
sudo apt update && sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable docker

# Same Docker command as Pi — the multi-arch image handles it
docker run -d \
  --name above-deck \
  --restart unless-stopped \
  -p 8080:8080 \
  -v above-deck-data:/data \
  ghcr.io/abovedeck/server:latest
```

### 6.4 Synology NAS

Install via Container Manager UI:
1. Registry: search `ghcr.io/abovedeck/server`, download `latest`.
2. Create container: port 8080, volume `/data` mapped to a shared folder.
3. Enable auto-restart.

---

## 7. Cloud Redundancy & Social Features

### 7.1 The Cloud Twin Model

Every Above Deck boat deployment can optionally have a **cloud twin** — the same Docker image running on a VPS, home server, or NAS — that mirrors the boat's state when connected and serves as a fallback interface.

```
                    ┌─────────────────────────┐
                    │   Cloud Twin             │
                    │   (Above Deck Docker)    │
                    │   --mode=cloud           │
                    │                          │
                    │   - Last known state     │
                    │   - Historical data      │
                    │   - Alert forwarding     │
                    │   - Social features      │
                    │   - PWA accessible       │
                    └────────┬────────────────┘
                             │ Starlink / cellular
                             │ (when available)
                    ┌────────┴────────────────┐
                    │   Boat Server (primary)  │
                    │   --mode=boat            │
                    │   RPi / NUC + Go server  │
                    │                          │
                    │   - Live instrument data  │
                    │   - NMEA / Victron / IoT │
                    │   - Full functionality   │
                    └──────────────────────────┘
```

**Three operating modes:**

| Mode | When | What Works |
|------|------|-----------|
| **Local only** | At sea, no internet | Full functionality from boat server. PWA connects over boat WiFi |
| **Connected** | Starlink/cellular available | Boat server is primary. Cloud gets real-time sync — position, battery, bilge, alerts |
| **Failover** | Boat server down + internet available | Cloud serves last-known state, forwards alerts, shows position history |

**Go server modes:**
- `--mode=boat` — connects to hardware (NMEA, Victron, Matter), serves local PWA, syncs outbound when connected
- `--mode=cloud` — receives sync data, serves remote PWA, no hardware adapters, enables social features

### 7.2 What Syncs vs. What Doesn't

| Data | Sync to Cloud? | Direction | Why |
|------|---------------|-----------|-----|
| Position (GPS) | Yes, every 1-5 min | Boat → Cloud | Remote tracking, anchor alarm from shore, social |
| Battery/solar state | Yes, periodic | Boat → Cloud | Remote monitoring |
| Bilge/alert status | Yes, immediately | Boat → Cloud | Safety-critical |
| Routes/waypoints | Yes | Bidirectional | Plan from anywhere |
| Boat config | Yes | Bidirectional | Backup, restore after SD card failure |
| Community data | Yes | Bidirectional | Community sync hub |
| Logbook entries | Yes | Bidirectional | Legal record, backup |
| Raw instrument telemetry | **No** | — | Too much data, too fast. Stays local |
| Chart tiles | **No** | — | Too large. Downloaded separately |
| Camera feeds | **No** | — | Bandwidth-prohibitive offshore |

### 7.3 How This Differs from AIS

AIS is the existing "where are boats?" system. But it has significant limitations:

| Aspect | AIS (Class B) | Above Deck Cloud |
|--------|--------------|-------------------|
| **Range** | 5-7 nm (Class B), 20 nm (Class A) — VHF line of sight only | Global (anywhere with internet) |
| **Offshore** | Invisible mid-ocean unless satellite AIS (expensive, delayed) | Real-time via Starlink |
| **At anchor** | Many cruisers turn AIS off to save power | Cloud shows last-known + battery trend |
| **Data** | Position, SOG, COG, vessel name only | Position + battery + bilge + solar + temp + alerts + everything |
| **Who sees you** | Anyone with AIS receiver in range | Only people you choose to share with (privacy controls) |
| **History** | None (real-time only) | Full track history, anchor swing, passage log |
| **Cost** | Free (hardware ~$300-800 for Class B) | Free (self-hosted) or $5/month VPS |
| **Alerts** | None | Push notifications to phone when bilge triggers, anchor drags, battery low |

**AIS gives position to strangers nearby. Above Deck Cloud gives everything to people you trust, anywhere.**

### 7.4 Social Features: Find My Friends for Boats

The cloud twin model naturally enables social features that AIS cannot:

**Find My Crew:**
- Share your position with selected friends/family
- See friends' boats on your chartplotter in real-time
- Privacy controls: share with specific people, time-limited sharing, accuracy degradation (marina-level vs exact position)
- "I'm heading to Falmouth" → friends see your progress

**Who's on the Mooring / In the Anchorage:**
- When boats with Above Deck arrive at an anchorage, they appear on the chart
- See who else is there, when they arrived, how long they've been there
- **Opt-in social** — only visible if you choose to be. Not broadcasting to the world like AIS
- "3 Above Deck boats in Studland Bay right now"
- Could integrate with community anchorage reviews — "I'm here now, conditions are good, room for 10 more boats"

**Rally/Flotilla Mode:**
- Rally organiser creates a group
- All participating boats sync to one cloud instance
- Real-time fleet tracker on a shared map
- Group messaging (via Meshtastic when offshore, via cloud when connected)
- Rally leader sees all boats' positions, battery states, ETAs
- Automatic daily position reports

**Buddy System Hosting:**
- Sailor A hosts a cloud instance at home (or on a $5 VPS)
- Adds friends' boats as tenants
- All boats' cloud backups run on one instance
- When both are offshore with Starlink, they see each other
- **Self-hosted fleet management** — no vendor, no subscription

**Passage Buddy:**
- Planning a channel crossing? See which friends are planning the same weather window
- Share departure times, routes, estimated positions
- "Buddy pair" — two boats agree to monitor each other during a passage
- If one boat stops sending updates, the other gets alerted

### 7.5 Privacy Model

This is critical — sailors are protective of their position data.

| Setting | What It Means |
|---------|--------------|
| **Ghost mode** | No position shared. Cloud twin stores data but doesn't share location with anyone |
| **Friends only** | Position visible to approved contacts only |
| **Anchorage social** | Visible as "a boat" in anchorages (not name/identity) unless friend |
| **Rally mode** | Visible to all rally participants |
| **Public track** | Full track visible (for bloggers, YouTube sailors who want to share journeys) |
| **Time-limited share** | Share position for next 24 hours only (useful for "I'm arriving tomorrow") |

Default is **Ghost mode**. Social features are opt-in, not opt-out.

### 7.6 Hosting Options

| Option | Cost | Who It's For |
|--------|------|-------------|
| **Self-hosted VPS** (Hetzner, DigitalOcean) | $4-6/month | Technical sailors, privacy-focused |
| **Above Deck community cloud** (if project grows) | Free tier (1 boat, basic sync) | Everyone |
| **Home server / NAS** | Free (own hardware) | People with Synology/QNAP at home |
| **Buddy hosting** | Free (friend's VPS/server) | Cruising friends sharing an instance |
| **Above Deck on Supabase** | Free tier covers most | Simplest — community data + boat sync on Supabase directly |

### 7.7 Real Scenarios

**SD card failure at anchor (common):**
Boat's RPi SD card corrupts (this happens regularly). You're at a restaurant ashore. Cloud twin still shows: last known position, battery state trending down, bilge dry, all hatches closed. You know the boat is OK. You replace the SD card tomorrow, restore config from cloud backup, back to normal.

**Family peace of mind:**
Partner at home opens Above Deck PWA → sees your boat's position mid-Atlantic, battery at 78%, solar producing well, 142nm to go. No panicked satellite phone call needed.

**Marina winter storage:**
Boat in a marina for 3 months. Boat server powered down to save battery. But you left a cheap ESP32 Matter sensor on the bilge and one on battery. These report to a Meshtastic node which has cellular backup. Cloud twin gets periodic updates. You check cabin temperature and bilge status from home. No $200/year Raymarine subscription needed.

**Convergence at an anchorage:**
You arrive in Portofino. Your chartplotter shows 2 friends already there. You send a message via the app: "Arriving in 30 min, anchoring near the north wall." They send back: "Good holding in sand, 4m at low tide. Drinks at the bar at 7?"

---

## 8. Open Questions

1. **Cloud twin sync protocol** — WebSocket push from boat? Supabase real-time? MQTT? What's the most bandwidth-efficient approach for Starlink?
2. **Social feature privacy compliance** — GDPR implications of storing other boats' positions on a shared instance?
3. **Meshtastic → cloud bridge** — can a Meshtastic node forward data to the cloud twin when cellular/Starlink is available but the boat server is down?
4. **SQLite vs. embedded Postgres (embedded-postgres-go)?** SQLite is simpler but lacks PostGIS for geographic queries on the boat. If route/waypoint geographic queries are needed locally, consider embedded Postgres or spatialite.
2. **HaLOS app store integration:** Should Above Deck be a first-class HaLOS app? This would simplify deployment on HALPI2 significantly.
3. **SignalK integration model:** Does the Go server consume SignalK's WebSocket API, or does it talk directly to NMEA hardware? The former is more portable; the latter eliminates a dependency.
4. **PWA on local network:** The Service Worker requirement for HTTPS is the biggest UX friction point for offline PWA on a local network. Needs a clear recommendation and setup guide.
5. **Multi-boat sync topology:** For a family with two boats, can they sync directly (peer-to-peer) when on the same marina WiFi, without going through the cloud?

---

## Sources

### Hardware
- [HALPI2 User Guide — Hat Labs](https://docs.hatlabs.fi/halpi2/)
- [HALPI2 Prototype Update — Hat Labs](https://hatlabs.fi/posts/2025-03-31-halpi2-proto-update/)
- [HaLOS: A Modern Container-Based Raspberry Pi OS — Hat Labs](https://hatlabs.fi/posts/2025-10-27-halos/)
- [A Ruggedized Raspberry Pi for Sailors — Hackaday](https://hackaday.com/2025/09/20/a-ruggedized-raspberry-pi-for-sailors/)
- [Intel N100: Better Value Than Raspberry Pi? — Jeff Geerling](https://www.jeffgeerling.com/blog/2025/intel-n100-better-value-raspberry-pi/)
- [Raspberry Pi 5 vs Mini PC Power Consumption — Louwrentius](https://louwrentius.com/the-raspberry-pi-5-is-no-match-for-a-tini-mini-micro-pc.html)
- [Simply NUC Fanless Rugged Mini PC](https://snuc.com/news/simply-nuc-launches-fanless-rugged-mini-pc-powered-by-latest-13th-gen-intel-core-processors/)
- [OnLogic Industrial NUC Systems](https://www.onlogic.com/store/computers/nuc/)
- [Marine Approved PCs — Steatite](https://steatite-embedded.co.uk/product_categories/industry-certified-computers/marine-approved-pcs/)
- [Stealth Fanless Mini PCs](https://www.stealth.com/products/little-pcs-mini-pcs/)

### Docker & Deployment
- [Deploying Go Servers with Docker — Go Blog](https://go.dev/blog/docker)
- [Go Docker Multi-Stage Builds — OneUptime](https://oneuptime.com/blog/post/2026-01-07-go-docker-multi-stage/view)
- [Multi-Platform Docker Images — Docker Docs](https://docs.docker.com/build/ci/github-actions/multi-platform/)
- [Multi-Arch Docker with GoReleaser — 0hlov3s](https://schoenwald.aero/posts/2025-01-25_effortless-multi-arch-docker-images-with-goreleaser-and-github-actions/)
- [Watchtower — GitHub](https://github.com/containrrr/watchtower)
- [SignalK Docker Deployment — GitHub](https://github.com/SignalK/signalk-server/blob/master/docker/README.md)

### Sync & Offline-First
- [PowerSync + Supabase Offline-First](https://www.powersync.com/blog/offline-first-apps-made-simple-supabase-powersync)
- [PowerSync: Bringing Offline-First to Supabase](https://www.powersync.com/blog/bringing-offline-first-to-supabase)
- [Offline-First Frontend Apps in 2025 — LogRocket](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)
- [CRDTs for Local-First Development — DEV Community](https://dev.to/charlietap/synking-all-the-things-with-crdts-local-first-development-3241)
- [Cascading Complexity of Offline-First Sync — DEV Community](https://dev.to/biozal/the-cascading-complexity-of-offline-first-sync-why-crdts-alone-arent-enough-2gf)
- [Offline-First Design Guide — Hasura](https://hasura.io/blog/design-guide-to-offline-first-apps)
- [Supabase Self-Hosting with Docker](https://supabase.com/docs/guides/self-hosting/docker)

### Connectivity
- [Starlink for Boats 2026 — Dishy Central](https://dishycentral.com/starlink-for-boats)
- [Starlink Maritime — KRM Yacht](https://krmyacht.com/blog/starlink-maritime/)
- [Starlink at Sea 2025-26 — We On Cruise](https://weoncruise.com/starlink-at-sea-2025-26/)
- [Starlink for Developers 2026 — Abhishek Gautam](https://www.abhs.in/blog/starlink-for-developers-latency-api-use-cases-2026)

### Security
- [Approaches to HTTPS in Local Network — W3C](https://httpslocal.github.io/proposals/)
- [Certificates for localhost — Let's Encrypt](https://letsencrypt.org/docs/certificates-for-localhost/)
- [Local Network HTTPS — Let's Encrypt Community](https://community.letsencrypt.org/t/certificates-for-devices-only-reachable-via-local/22908)

### Marine Software Ecosystem
- [Signal K Installation](https://signalk.org/installation/)
- [OpenPlotter — OpenMarine](https://openmarine.net/openplotter)
- [Signal K: Open Protocol for Maritime Navigation — Velero Azul](https://veleroazul.com/en/tecnobarco/computing/signal-k)
- [Pure-Go SQLite Driver](https://github.com/glebarez/go-sqlite)
- [SQLite in Go — Dan Croak](https://dancroak.com/go/sqlite/)
