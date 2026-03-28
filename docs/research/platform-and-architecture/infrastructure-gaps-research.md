# Infrastructure Gaps Research

**Date:** 2026-03-27
**Purpose:** Research on sync architectures, authentication, spoke hardware, NMEA OneNet, data licensing, and camera integration for the Above Deck hub-spoke architecture.

---

## 1. Offline-First Sync for Go (SQLite <-> PostgreSQL)

### The landscape

There is no turnkey Go library for bidirectional SQLite-PostgreSQL sync with CRDT-based conflict resolution. The space is dominated by JavaScript/TypeScript SDKs with managed cloud services. Go projects get the primitives but must build the sync engine themselves.

### PowerSync

- **What:** Managed sync service that streams PostgreSQL changes to client-side SQLite and queues client writes for upload. Open source, self-hostable.
- **Client SDKs:** JavaScript/Web (React, Vue, Svelte, Next.js), Flutter, React Native, Kotlin, Swift, .NET, Rust. **No Go SDK.**
- **Architecture:** PowerSync Service connects to PostgreSQL, tracks changes via logical replication, streams to clients in real-time. Client writes go into a local upload queue; a developer-defined upload function sends them to the backend where business logic runs before committing to PostgreSQL.
- **Conflict resolution:** Server-authoritative. Writes go through your backend, so you control the merge logic.
- **Backend databases:** PostgreSQL, MongoDB, MySQL, SQL Server.
- **Supabase integration:** Official partnership. Works with Supabase Auth and RLS.
- **Verdict:** Excellent for browser/mobile clients talking to the hub. **Not usable for the Go spoke binary.** Could serve the browser PWA frontend (React client SDK exists), but the spoke needs its own sync engine in Go.

### ElectricSQL

- **What:** Local-first sync platform, Postgres to SQLite, with CRDT-based conflict resolution.
- **Architecture:** Elixir sync service mediates between PostgreSQL and SQLite clients. Transactional causal+ consistency. Handles partial replication, referential integrity across systems, fan-out.
- **Client:** TypeScript SDK only. No Go support.
- **Status:** Pivoted in late 2024 to focus on "read-path sync" (Postgres -> clients). Write-path is less mature.
- **Verdict:** Interesting technology but TypeScript-only and the Elixir service is an operational dependency. **Not suitable for the Go spoke.**

### SQLite Sync (sqlite.ai)

- **What:** CRDT-based offline-first sync extension for SQLite. Syncs with SQLite Cloud, PostgreSQL, Supabase.
- **CRDTs:** Uses Causal-Length Set, Delete-Wins, Add-Wins, Grow-Only Set. Block-Level LWW for text columns (line-level merge).
- **License:** Elastic License 2.0 (not true open source — restricts competing services).
- **Go support:** None. Supported platforms: Linux, macOS, Windows, iOS, Android, WASM.
- **Verdict:** Promising CRDT approach but Elastic License is a concern for an open-source project, and no Go bindings.

### Litestream

- **What:** Streaming replication for SQLite. Written in Go. Continuously backs up SQLite WAL to S3, Azure, SFTP, or local files.
- **Direction:** One-way only (SQLite -> replica). Not bidirectional sync.
- **Go integration:** Can be used as a Go library (`litestream.io/guides/go-library/`).
- **Stars:** ~11k GitHub stars. Mature, production-proven.
- **Verdict:** **Excellent for spoke backup/disaster recovery** (stream SQLite to S3 or hub storage). Not a sync solution — it's a replication/backup tool. Use it alongside a custom sync engine.

### Go CRDT Libraries

| Library | Stars | Status | Notes |
|---------|-------|--------|-------|
| [go-ds-crdt](https://github.com/ipfs/go-ds-crdt) | ~300 | Active (Feb 2026) | Merkle-CRDTs for IPFS. Key-value only. Production use in IPFS Clusters (100M keys). |
| [go-crdt](https://github.com/cshekharsharma/go-crdt) | ~50 | Small | Basic CRDT data structures (counters, sets, registers). |
| [neurodrone/crdt](https://github.com/neurodrone/crdt) | ~100 | Dormant | Basic implementations. |

None of these provide a complete sync solution. They offer building blocks (counters, sets, registers) that could inform a custom implementation.

### Recommendation for Above Deck

**Build a custom sync engine in Go.** The architecture doc already describes the right approach:

1. **Sync queue table in SQLite** — changes timestamped, tagged, queued offline.
2. **Domain-specific conflict resolution** — LWW for simple fields, merge for additive data, hub-wins for community, spoke-wins for instruments. This is already specified in the tech architecture and is the right call.
3. **Litestream for backup** — stream spoke SQLite to S3/hub storage as disaster recovery, independent of the sync engine.
4. **PowerSync for browser clients** (optional, future) — if browser PWA users need offline support on the hub side, PowerSync's React SDK integrates with Supabase.

The sync engine should use:
- **Change tracking:** Trigger-based change capture in SQLite (INSERT/UPDATE/DELETE triggers populate sync_queue).
- **Vector clocks or hybrid logical clocks** for ordering (not wall clocks — boat clocks can be wrong).
- **Batched HTTP sync** with gzip compression, as already specified.
- **Idempotent operations** — every sync message has a unique ID, hub deduplicates.

This is ~2000-3000 lines of Go. Not trivial but well-scoped and avoids external dependencies.

---

## 2. Apple Sign In Implementation

### Requirements

- **Mandatory when:** Your app offers any third-party social login (Google, Facebook, etc.) on iOS/App Store. Since Above Deck already plans Google OAuth, Apple Sign In is **required** for any future iOS app.
- **Not required when:** You only offer your own proprietary login (email + password), or enterprise/education SSO.
- **Email relay:** Users can choose "Hide My Email" which gives you a `xxx@privaterelay.appleid.com` address. Apple relays email sent to this address to the user's real email. You must support this.
- **Server-to-server notifications:** Required endpoint must be registered by January 1, 2026 (for South Korea, likely expanding). Apple notifies your server of account events (user revokes access, changes email, deletes account).
- **Account deletion:** Apple requires that if users can create an account, they must be able to delete it. Your server must handle the revocation flow.

### Go Libraries

| Library | Stars | Last Updated | License | Notes |
|---------|-------|-------------|---------|-------|
| [Timothylock/go-signin-with-apple](https://github.com/Timothylock/go-signin-with-apple) | 247 | Sep 2025 | MIT | **Best option.** Token validation, revocation, secret generation, private relay detection. Go 1.21+. |
| [GianOrtiz/apple-auth-go](https://github.com/GianOrtiz/apple-auth-go) | ~30 | Moderate | - | Token validation, authorization code handling. Less complete. |
| [meszmate/apple-go](https://pkg.go.dev/github.com/meszmate/apple-go) | New | Aug 2025 | GPL-3.0 | **GPL license is a problem** for an open-source project that isn't GPL. |

### Recommendation for Above Deck

Use **[Timothylock/go-signin-with-apple](https://github.com/Timothylock/go-signin-with-apple)** (MIT license). It covers:
- `GenerateClientSecret()` — creates the JWT client secret Apple requires
- `VerifyAppToken()` / `VerifyWebToken()` — validates the identity token
- `GetUniqueID()` — extracts the stable user identifier
- `GetClaims()` — gets email, email verification status, private relay detection
- Token revocation for account deletion compliance

**Implementation notes:**
- Apple Sign In uses a different flow than Google OAuth. You need an Apple Developer account, a Services ID, and a private key (.p8 file).
- The client secret is a JWT you generate server-side (not a static string). It expires every 6 months.
- User info (name, email) is only sent on **first authorization**. You must store it immediately — Apple won't send it again.
- Integrate with Supabase Auth — Supabase supports Apple as a provider natively, which may be simpler than rolling your own for the hub. The Go library is for the spoke's local auth or custom flows.

---

## 3. Mac Mini as Spoke Hardware

### M4 Mac Mini Power Consumption

| State | Watts (measured at wall) |
|-------|-------------------------|
| Sleep | ~0.5W |
| Idle | 2.6-4W (varies by config) |
| Light workload | 8-12W |
| Heavy load | 40-60W |
| Peak (stress test) | 62.5W (brief, settles to ~58W) |
| Maximum rated (M4 Pro) | 155W |

For a spoke running Docker with the Go binary, expect **5-10W** typical draw. This is comparable to an Intel N100 mini PC.

### 12V DC Power

The Mac Mini requires AC power (100-240V) via IEC C7 connector. **It cannot run directly on 12V DC.** You need an inverter (12V DC -> 110/220V AC), which adds:
- 10-15% power conversion loss
- Another failure point
- More wiring complexity

This is a significant disadvantage vs the Intel N100, which can run on 12V DC directly.

### Docker on macOS

Docker on macOS runs inside a Linux VM (Docker Desktop or alternatives like Colima/OrbStack). Issues:
- **Performance overhead:** VM layer adds I/O latency, especially for file system operations.
- **Not native Linux containers:** The Go binary runs in a Linux VM, not native macOS. This is fine for the app but adds complexity.
- **Headless operation:** Docker Desktop doesn't support fully headless install. Alternatives (Colima, OrbStack) do. Requires SSH setup and possibly an HDMI dummy plug.
- **Updates:** macOS updates can break Docker setups. Need a stable update strategy.

### Heat Tolerance

The M4 Mac Mini generates minimal heat at idle/light load. Apple rates it for 0-35C (32-95F) ambient. A boat engine room can exceed this, but a nav station or saloon installation would be fine. No fan noise at low loads.

### Intel N100 Mini PC Comparison

| Factor | Mac Mini M4 | Intel N100 Mini PC |
|--------|------------|-------------------|
| Idle power | 3-4W | 6-8W |
| Typical power | 5-10W | 8-12W |
| 12V DC direct | No (needs inverter) | **Yes (12V or 19V DC input)** |
| Docker | VM layer (overhead) | **Native Linux containers** |
| Price | ~$600 | **~$150-250** |
| CPU performance | Much faster (not needed) | Adequate for Go binary |
| RAM | 16-32GB | 8-32GB |
| Ecosystem | macOS (Docker via VM) | **Linux native** |
| Fanless options | Not standard size | **Many fanless models** |
| Operating temp | 0-35C | 0-40C+ (fanless models) |
| Form factor | 5" x 5" x 2" | Similar or smaller |

### Recommendation for Above Deck

**Intel N100 mini PC is the better spoke hardware.** Reasons:

1. **12V DC native** — no inverter needed, fewer failure points, more efficient on boat power
2. **Native Linux/Docker** — no VM layer, simpler operations, better I/O
3. **1/3 to 1/4 the cost** — matters when you're recommending hardware to sailors
4. **Fanless models widely available** — important for marine environment (humidity, salt)
5. **Performance is sufficient** — a Go binary with SQLite doesn't need M-series silicon

The Mac Mini is overkill. Its advantages (performance, macOS ecosystem) are irrelevant for a headless Docker spoke. The N100's advantages (12V DC, native Linux, price, fanless) are directly relevant to marine use.

**Specific N100 recommendations to evaluate:**
- Beelink EQ12/S12 Pro (well-reviewed, 12V DC, fanless variants)
- GMKtec NucBox G3 (compact, affordable)
- Any model with dual Ethernet (one for boat LAN, one for 4G router)

---

## 4. NMEA OneNet

### What is it?

NMEA OneNet is the third-generation marine networking standard from NMEA, built on IPv6 over standard Ethernet (IEEE 802.3). It was designed to complement (not replace) NMEA 2000 by providing the bandwidth needed for modern data streams.

### Technical Details

| Aspect | NMEA 2000 | NMEA OneNet |
|--------|-----------|-------------|
| Physical layer | CAN bus | Ethernet (IEEE 802.3) |
| Speed | 250 Kbps | 10 Mbps - 10 Gbps |
| Protocol | Proprietary binary | IPv6 + standardized messaging |
| Data types | Instrument data (PGNs) | Video, radar, sonar, high-bandwidth + PGNs |
| Topology | Single backbone | Standard Ethernet (switches, routers) |

### Current Status (2026)

- **Standard released:** ~2020, after a decade of development.
- **Certified products:** Extremely few. Airmar's SmartBoat module was the **world's first** OneNet-certified product (July 2024). It acts as a bridge between NMEA 0183, NMEA 2000, and OneNet.
- **Major manufacturer adoption:** None of the big MFD manufacturers (Garmin, Raymarine, Furuno, Simrad) have shipped OneNet-native products yet as of early 2026.
- **Community sentiment:** Frustration at slow rollout. The standard exists but the hardware ecosystem hasn't followed.

### Gateway Architecture

OneNet is designed to coexist with NMEA 2000 via gateway devices. The standard specifies mechanisms for connecting OneNet, NMEA 2000, and NMEA 0183 networks using translating gateways.

### Implications for Above Deck

**Short-term (now):** OneNet is irrelevant to implementation. No hardware to connect to. Continue with the current gateway strategy (NavLink2 WiFi, iKonvert USB, TCP/UDP streams).

**Medium-term (2-3 years):** When OneNet hardware appears, it actually simplifies things for Above Deck:
- OneNet uses standard Ethernet and IPv6 — the spoke can connect directly via Ethernet, no special gateway hardware needed.
- Data is accessible via standard network protocols, not proprietary CAN bus.
- This aligns with Above Deck's architecture — the spoke is already on the boat's Ethernet network.

**Recommendation:** No action needed now. When OneNet hardware appears, add an OneNet protocol adapter alongside the existing NMEA 0183/2000 adapters. The architecture's adapter pattern already supports this cleanly. OneNet will be the **easiest** adapter to write because it's standard networking, not CAN bus reverse engineering.

---

## 5. Community Data Licensing

### How others handle it

| Platform | License | Model |
|----------|---------|-------|
| **OpenStreetMap** | ODbL (Open Database License) | All contributions licensed under ODbL. Migrated from CC-BY-SA in 2012 because CC was designed for creative works, not databases. Share-alike: derived databases must also be ODbL. |
| **iNaturalist** | CC BY-NC (default) | Users choose their own license per observation. Default is CC BY-NC (attribution + non-commercial). Users can choose CC0, CC-BY, CC-BY-SA, or all rights reserved. Data shared with GBIF for scientific use. |
| **Navily** | Proprietary | 900K+ users, 350K+ reviews. User contributions become Navily's asset. Standard "you grant us a license" terms of service. Data not openly available. |
| **OpenSeaMap** | ODbL / CC-BY-SA | Community-contributed nautical data. Follows OpenStreetMap licensing model. |

### License Options for Above Deck

| License | Pros | Cons |
|---------|------|------|
| **ODbL** | Designed for databases (not creative works). Share-alike protects community. OSM precedent. Allows commercial use with attribution. | Share-alike may discourage some integrations. Requires derived databases to be ODbL. |
| **CC-BY-SA 4.0** | Well-known. Good for content (reviews, photos, descriptions). Share-alike. | Creative Commons themselves recommend against using CC licenses for databases. Better for content than structured data. |
| **CC-BY 4.0** | Maximum reuse. Simple attribution requirement. | No share-alike — someone could take all contributions and lock them up proprietary. |
| **CC0** | Public domain. Maximum freedom. | No protection against proprietary lock-in. Community may not contribute if a company can just take everything. |

### Recommendation for Above Deck

**Dual license by data type:**

1. **Structured data** (POIs, anchorage coordinates, depths, facilities, routes, waypoints): **ODbL** — following OpenStreetMap's precedent. This is database data and ODbL was designed for exactly this. Share-alike ensures the community dataset stays open.

2. **Content** (reviews, photos, descriptions, trip reports): **CC-BY-SA 4.0** — this is creative content, not database records. CC-BY-SA is the right tool. Share-alike keeps content open.

This mirrors how OpenStreetMap (ODbL for map data) and Wikipedia (CC-BY-SA for articles) handle their respective domains.

**Implementation:**
- Terms of service must clearly state that contributions are licensed under these terms.
- Display license badges on the data export/API pages.
- Users must agree to the license on account creation and when contributing.
- Provide a data export/API so the community can actually use the data (otherwise "open" is meaningless).

---

## 6. Camera Integration (RTSP/ONVIF)

### Go Libraries

#### RTSP

| Library | Stars | Status | Notes |
|---------|-------|--------|-------|
| **[gortsplib](https://github.com/bluenviron/gortsplib)** | 898 | Active (Go 1.25+) | **Best RTSP library in Go.** Full client + server. RTSPS, SRTP, UDP/TCP/multicast. H.264, H.265, VP8/9, AV1, Opus, AAC, G.711, MJPEG. Written for MediaMTX. 1,985 commits, 100+ dependents. Production quality. |
| **[go2rtc](https://github.com/AlexxIT/go2rtc)** | 12,700 | Very active | **Not a library — a complete streaming application.** Zero-dependency binary. Supports RTSP, ONVIF, WebRTC, HLS, RTMP + dozens of proprietary cameras (Wyze, Ring, Tapo, Tuya, etc.). Two-way audio. On-the-fly transcoding via FFmpeg. REST API + WebSocket. |

#### ONVIF

| Library | Stars | Status | Notes |
|---------|-------|--------|-------|
| **[onvif-go](https://github.com/0x524A/onvif-go)** | New | Active | Modern Go library. Client + server implementation. PTZ control, streaming, imaging. Works with Hikvision, Axis, Dahua, Bosch. |
| **[use-go/onvif](https://github.com/use-go/onvif)** | ~200 | Moderate | Full ONVIF protocol stack. Device management, media, PTZ. |
| **[deepch/go-onvif](https://pkg.go.dev/github.com/deepch/go-onvif)** | - | Moderate | Stream URI fetching, basic device control. |

### Recommendation for Above Deck

**Two options, depending on scope:**

**Option A: Embed gortsplib (minimal, recommended for v1)**
- Use gortsplib directly in the Go binary as a library.
- Connect to each camera's RTSP stream, decode frames as needed.
- Forward to frontend via WebSocket (MJPEG) or WebRTC.
- Add ONVIF discovery via onvif-go to auto-detect cameras on the boat LAN.
- This keeps everything in the single Go binary.

**Option B: Run go2rtc as a sidecar (maximum compatibility)**
- Run go2rtc alongside the spoke container (or embed it).
- go2rtc handles all camera protocol negotiation, transcoding, and streaming.
- The spoke connects to go2rtc's REST API to list streams and get WebRTC/HLS URLs.
- Frontend connects directly to go2rtc for video playback.
- Advantage: go2rtc supports dozens of proprietary camera protocols beyond RTSP/ONVIF.

**Verdict:** Start with **Option A** (gortsplib + onvif-go). It keeps the architecture simple (single binary) and handles standard IP cameras. If users demand support for consumer cameras (Wyze, Ring, etc.), add go2rtc as a sidecar later.

---

## Summary of Recommendations

| Area | Recommendation | Effort | Priority |
|------|---------------|--------|----------|
| Sync engine | Build custom in Go. Use Litestream for backup. Consider PowerSync for browser PWA. | Large (2-3K LOC) | High — core architecture |
| Apple Sign In | Use Timothylock/go-signin-with-apple (MIT). Supabase handles hub-side natively. | Small | Medium — needed before App Store |
| Spoke hardware | Intel N100 mini PC over Mac Mini. 12V DC, native Linux, 1/4 cost. | N/A (hardware choice) | High — affects all spoke decisions |
| NMEA OneNet | No action now. Standard Ethernet makes future adapter easy. | None now | Low — no hardware exists |
| Data licensing | ODbL for structured data, CC-BY-SA for content. Mirror OSM/Wikipedia model. | Small (legal/ToS) | Medium — needed before community launch |
| Camera integration | gortsplib + onvif-go in Go binary. go2rtc as future sidecar option. | Medium | Low — nice-to-have feature |
