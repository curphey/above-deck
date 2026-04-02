# Community Site — Technical Specification

**Date:** 2026-03-31
**Status:** Draft v1
**Package:** `packages/site/`
**Stack:** Astro 5 (SSR via `@astrojs/node`), React 19 islands, Tailwind CSS + Ant Design 5, Supabase
**License:** GPL — 100% free and open source

> Content, layout, and UI design for individual pages will be iterated via playground before implementation. This spec covers technical infrastructure only.

---

## 1. Overview

The community site is the public-facing web presence for Above Deck. It serves two distinct roles:

**Discovery** — marketing, blog, knowledge base, project story. How people find and learn about Above Deck.

**Use** — hosted sailing tools and community features. Many tools work directly from a browser with no hardware, no install, no account. The passage planner, energy sizer, tide viewer, weather dashboard, VHF simulator, and more run as browser applications on this site.

**Account** — creating a free account (Google OAuth) unlocks persistence (save routes, configurations, boat profiles), personalisation (tools know your boat), sync to spoke, and community features (forums, almanac contributions).

**Boundary** — the site is NOT the boat OS. It consumes hub services (auth, database, sync, RAG) but does not host instrument data, protocol adapters, or monitoring services. It does not render inside the MFD shell. The site and the MFD tools package (`packages/tools/`) are separate concerns with different layouts, different audiences, and different deployment targets.

### Relationship to Other Packages

| Package | Role | Relationship to Site |
|---------|------|---------------------|
| `packages/site/` | Community web presence | This spec |
| `packages/tools/` | Sailing applications (MFD shell, chartplotter, instruments) | Separate package. Some tools are hosted on the site for browser access but are built and maintained in `packages/tools/`. |
| `packages/shared/` | Theme, colours, fonts, types | Consumed by site via `@above-deck/shared/theme/*` |
| `packages/api/` | Go API server | Site calls the Go API for dynamic data (almanac, forums, sync, RAG) |

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Astro 5 | SSR via `@astrojs/node` |
| UI components | React 19 islands | `client:load` for interactive tools |
| Styling | Tailwind CSS 4 + Ant Design 5 (antd) | Comprehensive component library with built-in dark mode and i18n |
| Icons | @ant-design/icons | Ant Design default icon set |
| State (client) | Zustand 5 | Persisted to localStorage (anon) or Supabase (auth) |
| State (server) | TanStack Query 5 | API data fetching and caching |
| Auth | Supabase Auth | Google OAuth, PKCE flow |
| Database | Supabase PostgreSQL | PostGIS, pgvector, pg_trgm |
| API | Go server (`packages/api/`) | See `api/spec.md` |
| Maps | MapLibre GL JS | Vector tiles from PMTiles on Cloudflare R2 |
| Charts | Recharts 2 | Data visualisation in tools |
| Search (static) | Pagefind | Client-side, built at compile time |
| Search (dynamic) | PostgreSQL tsvector | Full-text search via Go API |
| PWA | `@vite-pwa/astro` + Workbox | Offline support, install prompt |

Details on technology choices and configuration in `engineering/tech-stack/`.

---

## 3. Rendering Strategy

| Page Type | Rendering | Rationale |
|-----------|-----------|-----------|
| Homepage, About, Features, Hardware, Install | Static (prerendered) | Content changes infrequently, maximum CDN cacheability |
| Blog posts | Static (prerendered) | MDX content collections build at compile time |
| KB articles | Static (prerendered) | MDX content collections build at compile time |
| Blog/KB index pages | Static (prerendered) | Rebuilt on each deploy when content changes |
| Almanac pages | SSR | Database-driven, frequently updated by community |
| Forum pages | SSR | Database-driven, real-time content |
| Tool pages | SSR (shell) + client hydration (tool) | Page shell SSR for meta tags, tool is client-interactive |
| Account pages | SSR | Auth-gated, user-specific data |
| Admin pages | SSR | Auth-gated, sensitive data |
| API routes | Server | Supabase proxy, auth endpoints |

---

## 4. Hosted Tools (Browser-Based)

These tools live under `/tools/` on the site. They are React islands rendered within Astro pages. Each tool works without an account — anonymous use produces ephemeral results. An account enables saving, syncing, and sharing.

When a spoke is connected and the user is authenticated, tools can pull real boat data (battery capacity from equipment registry, actual solar panel specs, current position) to produce more accurate results.

### 4.1 Tool Architecture

Each tool page follows the same pattern:

```
[ToolName].astro              — Astro page wrapper (ToolLayout)
  └── [ToolName]App.tsx       — React island (client:load)
        ├── Zustand store     — tool state (persisted to localStorage)
        ├── TanStack Query    — server data (API calls)
        └── Ant Design 5      — component library (antd)
```

**State management:**
- Anonymous: Zustand persisted to localStorage (survives page refresh, lost on clear)
- Authenticated: Zustand + save to Supabase via API (persisted to cloud, syncs to spoke)

### 4.2 Passage Planner (`/tools/passage-planner`)

**Purpose:** Create multi-leg passage plans with weather, tides, and departure timing.

| Capability | Data Source |
|-----------|------------|
| Route creation (click waypoints on map) | MapLibre GL JS |
| Weather overlay (wind, waves, pressure) | Open-Meteo API |
| Tidal gate calculation | NOAA CO-OPS API |
| Departure timing (weather, tides, daylight) | Computed client-side |
| GPX import/export | Client-side parsing |

**Account:** Save routes, route history, sync to spoke, publish to route library.
**Spoke:** Uses real GPS position, boat speed polars, actual fuel range when connected.

### 4.3 Energy Sizer (`/tools/energy-sizer`)

**Purpose:** Input electrical consumers and usage patterns, output recommended battery bank size and solar wattage.

| Capability | Data Source |
|-----------|------------|
| Equipment list with wattage and usage hours | User input |
| Pre-populated templates (fridge, autopilot, etc.) | Static data |
| Daily consumption (Ah and Wh) | Computed client-side |
| Battery bank sizing (capacity, chemistry, DoD) | Computed client-side |
| Solar panel sizing (by location and season) | PVGIS API |

**Account:** Save configurations, link to boat profile, compare configurations.
**Spoke:** Pulls actual equipment from boat's equipment registry, real consumption data from Victron.

### 4.4 Solar Generation Calculator (`/tools/solar-calculator`)

**Purpose:** Calculate expected daily/monthly solar generation for specific panels at a specific location.

| Capability | Data Source |
|-----------|------------|
| Panel spec input (wattage, tilt, orientation) | User input |
| Location input (map click or coordinates) | MapLibre GL JS |
| Monthly/annual generation estimates | PVGIS API (EU JRC, free, global) |
| Degradation, temperature derating, shading losses | Computed client-side |

### 4.5 VHF Radio Simulator (`/tools/vhf-simulator`)

**Purpose:** Interactive VHF radio training with realistic scenarios and AI instructor feedback.

| Capability | Data Source |
|-----------|------------|
| Radio interface (channel selection, PTT, DSC) | Client-side |
| Training scenarios (distress, urgency, safety, routine) | Static scenario library |
| Regional variations (USCG, HMCG, Mediterranean) | Static data |
| AI instructor evaluation | Radio Operator agent (RAG) |

**Account:** Save progress and scores, track completed scenarios.

### 4.6 Tide Viewer (`/tools/tides`)

**Purpose:** Tidal predictions for harbours worldwide.

| Capability | Data Source |
|-----------|------------|
| Harbour search (name or map click) | MapLibre + NOAA station list |
| Tidal height graph (24h and multi-day) | Recharts |
| High/low water times and heights | NOAA CO-OPS API (US), client-side harmonics |
| Multi-harbour comparison | Computed client-side |
| Tidal gate calculator (draft clearance) | Computed client-side |

### 4.7 Weather Dashboard (`/tools/weather`)

**Purpose:** Marine weather data — wind, waves, pressure, precipitation.

| Capability | Data Source |
|-----------|------------|
| Location-based point or route forecast | Open-Meteo API (free, global) |
| Wind, waves, pressure, precipitation, visibility | Open-Meteo API |
| Multi-model comparison (GFS, ECMWF, ICON) | Open-Meteo API |
| GRIB file viewer | Client-side parsing + MapLibre overlay |

### 4.8 Circumnavigation Planner (`/tools/circumnavigation`)

**Purpose:** Multi-year route planning with seasonal timing gates.

| Capability | Data Source |
|-----------|------------|
| World map with route drawing | MapLibre GL JS |
| Seasonal timing gates (cyclones, trade winds, monsoons) | Static reference data |
| Year-by-year breakdown with layover durations | Computed client-side |
| Popular route templates | Static data + community library |

**Account:** Save plans, share with others, link to detailed passage plans per leg.

### 4.9 Anchor Watch (`/tools/anchor-watch`)

**Purpose:** Simplified anchor watch using phone GPS — no spoke hardware needed.

| Capability | Data Source |
|-----------|------------|
| Drop anchor, record position | Browser Geolocation API |
| Set swing radius (manual or depth + scope) | User input |
| Map with anchor position and swing circle | MapLibre GL JS |
| Drag alarm (notification + audio) | Browser Notification API |

**Limitations vs spoke anchor watch:** Requires phone screen on, no instrument data, phone GPS accuracy only, no SMS alerts.

---

## 5. User Accounts

### 5.1 Authentication

**Provider:** Supabase Auth. Google OAuth only at launch. Apple Sign In post-launch.

**Primary experience: Header button** — right side of header, triggers standard PKCE redirect flow:
- New visitor (no cookie): "Sign up with Google"
- Returning visitor (`ad_returning` cookie): "Log in"
- Both use the same Google OAuth flow — signup and login are identical

**Optional: Google One Tap** — native Chrome popup showing the user's Google accounts. Off by default to avoid being intrusive. Platform admins can enable via site settings. When enabled, Chrome users see a popup and can sign in with one tap, no redirect.

**Post-launch:** Apple Sign In (same PKCE flow)

See `api/spec.md` section 1.2 for Google One Tap configuration and section 1.4 for auth endpoints.

### 5.2 User Profile (MVP)

On first sign-in, the profile is auto-populated from Google:
- **Display name** — from Google account name
- **Avatar** — from Google profile photo URL
- **Email** — from Google account (read-only, used for auth)

That's it for launch. No forms, no manual entry.

**Header (logged in):** Avatar only — no name, no text. Click opens dropdown with "My Profile" and "Settings". No boats or sailing CV in dropdown at this stage.

**Profile page (`/account/profile`):** Avatar, display name, email, and "Edit Profile" button. Clean single row.

Further profile fields (bio, location, sailing experience, certifications, languages, contact details, emergency contact, boats, sailing CV) will be added iteratively — see `data-model.md` for the full planned schema.

### 5.3 Account Settings (`/account/settings`)

MVP settings:
- **Profile:** Edit display name, change avatar (upload or keep Google photo)
- **Boats:** View owned boats, access grants received
- **Data export:** Download all user data as JSON (GDPR compliance)
- **Delete account:** Hard delete all user data with confirmation (GDPR compliance)

Full settings (added later):
- Contact (phone, WhatsApp, emergency contact)
- Privacy toggles per field
- Position sharing preferences
- Notification preferences
- Connected spokes
- Units (metric/imperial)

### 5.4 Boat Access Management (`/account/boats/:id/access`)

Feature list (added after MVP profile):
- List of co-owners with roles
- Active access grants with roles, dates, permissions
- **Add co-owner:** invite by email (must accept), grants permanent co-owner access
- **Grant access:** invite by email with role (captain/crew/technician/family), optional date range, permission overrides
- **Revoke access:** remove a grant (preserves record for audit)
- **Transfer ownership:** transfer primary owner role to another user (with confirmation)

---

## 6. RAG & AI Integration

### 6.1 Content Pipeline

All site content feeds the RAG pipeline for AI agents:

| Content Source | Chunking Strategy | Embedding Model | Storage |
|----------------|------------------|-----------------|---------|
| Blog posts | H2 section boundaries | text-embedding-3-small | pgvector (hub) |
| KB articles | H2 section boundaries | text-embedding-3-small | pgvector (hub) |
| Almanac entries | Per entry (structured data flattened to text) | text-embedding-3-small | pgvector (hub) |
| Forum threads | Per post | text-embedding-3-small | pgvector (hub) |
| Community reviews | Per review | text-embedding-3-small | pgvector (hub) |

### 6.2 Embedding Metadata

Each chunk is stored with metadata:

```
rag_chunks
  id              UUID PRIMARY KEY
  source_type     ENUM('blog', 'knowledge', 'almanac', 'forum', 'review')
  source_id       TEXT                               -- reference to source record
  content         TEXT                               -- chunk text
  embedding       VECTOR(1536)                       -- text-embedding-3-small
  metadata        JSONB                              -- { region, topic, date, confidence, ... }
  created_at      TIMESTAMPTZ DEFAULT now()
  updated_at      TIMESTAMPTZ DEFAULT now()
```

### 6.3 Stale Content Detection

- `updated_at` timestamp on every chunk
- Automated sweep: flag chunks where source content hasn't been verified in 12 months
- Admin dashboard shows stale content requiring review
- Stale content detected and flagged for author review based on age and reader comments

### 6.4 Spoke Sync

- Spoke pulls relevant RAG embeddings by region/topic during sync
- Stored locally in sqlite-vec for offline agent queries
- Incremental sync — only new/updated chunks since last sync
- Regional subsets — spoke downloads embeddings relevant to cruising area

---

## 7. SEO & Performance

### 7.1 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Largest Contentful Paint (LCP) | < 2.5s | Lighthouse, CrUX |
| First Input Delay (FID) | < 100ms | Lighthouse, CrUX |
| Cumulative Layout Shift (CLS) | < 0.1 | Lighthouse, CrUX |
| Lighthouse Performance | 90+ | Lighthouse CI in GitHub Actions |
| Lighthouse Accessibility | 90+ | Lighthouse CI |
| Lighthouse Best Practices | 90+ | Lighthouse CI |
| Lighthouse SEO | 90+ | Lighthouse CI |
| Time to Interactive (TTI) | < 3.5s | For tool pages with heavy React islands |

### 7.2 SEO Implementation

**Structured data (JSON-LD):**

| Page Type | Schema | Fields |
|-----------|--------|--------|
| Blog post | `Article` | headline, datePublished, author, description, image |
| KB article | `HowTo` or `Article` | name, description, step (for how-to), dateModified |
| Almanac entry | `Place` + `Review` | name, geo, aggregateRating, review |
| Forum thread | `DiscussionForumPosting` | headline, dateCreated, author, text |

**Meta tags:** `description`, Open Graph (`og:title`, `og:description`, `og:image`, `og:type`, `og:url`), Twitter card (`summary_large_image`), canonical URLs on every page.

**Sitemap:** Auto-generated via `@astrojs/sitemap`. Almanac and forum pages added dynamically via API.

**Robots.txt:** Allow all crawlers, exclude `/admin/`, `/api/`, `/account/`.

### 7.3 Image Optimization

- Astro `<Image>` component — automatic format conversion (WebP/AVIF), responsive `srcset`, lazy loading
- Avatar images via Supabase Storage with CDN

### 7.4 CDN & Caching

Served via Cloudflare Pages (unlimited bandwidth, 300+ global PoPs):

| Asset | Cache Strategy |
|-------|---------------|
| Static HTML | `s-maxage=3600`, stale-while-revalidate |
| Hashed JS/CSS | `immutable`, 1 year |
| Fonts (Space Mono, Inter, Fira Code) | `immutable`, 1 year |
| Images | `max-age=86400` (1 day) |
| Service worker (`sw.js`) | No CDN cache, browser checks on every navigation |
| PWA manifest | `s-maxage=86400` |

---

## 8. Data Model

See `data-model.md` for the full hub PostgreSQL schema covering users, boats, equipment, passages, almanac, forums, routes, social connections, RAG chunks, and moderation.

**PostgreSQL extensions:** PostGIS (geospatial), pgvector (RAG embeddings), pg_trgm (fuzzy text search).

**RLS:** Every table has Row Level Security enabled. Policies follow standard patterns: public read / auth write for community content, owner-only for personal data, mutual access for social connections, admin-only for moderation.

---

## 9. API

See `api/spec.md` for the full Go API specification covering endpoints, authentication, rate limiting, versioning, and WebSocket channels.

**Summary:** The Go API server (`packages/api/`) provides CRUD for all dynamic data. The site calls the API from both server-side (Astro SSR) and client-side (React islands via TanStack Query). Auth via JWT (Supabase Auth) on every request.

---

## 10. Content Pipeline

### 10.1 Static Content (Build Time)

```
MDX files (blog/, knowledge/)
  → Astro content collections (content.config.ts)
    → Type-safe frontmatter validation
      → Static HTML pages (prerendered at build time)
        → Cloudflare Pages CDN
```

- Content changes trigger a rebuild via GitHub Actions
- Build output is static HTML/CSS/JS
- CDN invalidation on deploy (Cloudflare automatic)

### 10.2 Dynamic Content (Runtime)

```
User input (almanac entry, forum post, review)
  → Go API server (validation, auth, RLS)
    → Supabase PostgreSQL
      → SSR pages query database on each request
```

### 10.3 RAG Ingestion Pipeline

```
Content source (blog, KB, almanac, forum)
  → Change detected (deploy hook for static, DB trigger for dynamic)
    → Chunking (H2 boundaries for MDX, per-entry for almanac, per-post for forum)
      → Embedding (text-embedding-3-small via OpenAI API)
        → pgvector storage with metadata
          → Available for hub RAG queries immediately
            → Spoke sync pulls new embeddings on next connection
```

Automated via Go worker in the API server:
- Static content: triggered on deploy (webhook from Cloudflare Pages)
- Dynamic content: triggered by PostgreSQL notify/listen on INSERT/UPDATE

---

## 11. Project Structure

```
packages/site/
  astro.config.mjs
  package.json
  tsconfig.json
  public/
    favicon.svg
    robots.txt
    manifest.json
  src/
    pages/
      index.astro                        # Homepage
      about.astro                        # Project story
      hardware.astro                     # Hardware guide
      install.astro                      # Spoke setup instructions
      features/
        index.astro                      # Feature overview
        [...slug].astro                  # Individual feature pages
      blog/
        index.astro                      # Blog listing
        [...slug].astro                  # Blog post
      knowledge/
        index.astro                      # KB index
        [...slug].astro                  # KB article
      almanac/
        index.astro                      # Almanac search/map
        [id].astro                       # Almanac entry
        submit.astro                     # Submit entry (auth)
      community/
        forums/
          index.astro                    # Forum index
          [category]/
            index.astro                  # Forum category
            [id].astro                   # Forum thread
          new.astro                      # New thread (auth)
        chat.astro                       # Real-time chat (auth)
      tools/
        passage-planner.astro            # Passage planner
        energy-sizer.astro               # Energy sizer
        solar-calculator.astro           # Solar calculator
        vhf-simulator.astro              # VHF simulator
        tides.astro                      # Tide viewer
        weather.astro                    # Weather dashboard
        circumnavigation.astro           # Circumnavigation planner
        anchor-watch.astro               # Hosted anchor watch
      account/
        profile.astro                    # User profile (auth)
        settings.astro                   # Account settings (auth)
        boats.astro                      # Boat management (auth)
        sailing-cv.astro                 # Sailing CV (auth)
      privacy/
        index.astro                      # Privacy policy
        cookies.astro                    # Cookie policy
        request.astro                    # DSAR request form
      admin/
        index.astro                      # Admin dashboard (admin)
        moderation.astro                 # Moderation queue (admin)
        users.astro                      # User management (admin)
        analytics.astro                  # Usage analytics (admin)
        dsar.astro                       # DSAR request queue (admin)
      api/
        auth/
          signin.ts                      # Initiate OAuth
          callback.ts                    # OAuth callback
          signout.ts                     # Sign out
      rss.xml.ts                         # RSS feed
    components/
      layout/                            # Header, Footer, MobileNav, UserMenu
      privacy/                           # CookieConsentBanner, ConsentModal, DSARForm
      content/                           # BlogCard, KnowledgeCard, TOC, TagList
      almanac/                           # AlmanacMap, Search, EntryCard, ReviewForm
      community/                         # ForumThreadList, ForumPost, ChatRoom
      tools/                             # One app component per tool
      account/                           # ProfileForm, BoatForm, SettingsForm
      admin/                             # ModerationQueue, UserManagement
      shared/                            # SearchBar, Pagination, MapComponent, AuthGuard
    layouts/
      BaseLayout.astro                   # Header, footer, nav, meta tags
      ToolLayout.astro                   # Full-width, minimal chrome for tools
      ContentLayout.astro                # Sidebar + content for blog/KB
      AdminLayout.astro                  # Admin chrome, auth-gated
    content/
      blog/                              # MDX blog posts
      knowledge/                         # MDX KB articles
    lib/
      supabase.ts                        # Supabase client (PKCE flow)
      api.ts                             # Go API client wrapper
      auth.ts                            # Auth helpers (getUser, requireAuth)
      seo.ts                             # SEO helpers (meta tag generation)
      stores/
        authStore.ts                     # Auth state (Zustand)
        toolStore.ts                     # Active tool state (Zustand)
      hooks/
        useAuth.ts                       # Auth hook for React components
        useSupabase.ts                   # Supabase client hook
        useApi.ts                        # API client hook with TanStack Query
    styles/
      global.css                         # Theme variables, base styles
```

---

## 12. Dependencies

### 12.1 Runtime Services

| Service | Purpose |
|---------|---------|
| Supabase | Auth, PostgreSQL, Realtime, Storage |
| Go API server (Fly.io) | Sync, RAG, weather proxy, search |
| Cloudflare Pages | Static frontend CDN |
| Cloudflare R2 | Map tile storage, GRIB files |

### 12.2 External APIs

| API | Purpose | Rate Limits |
|-----|---------|-------------|
| Open-Meteo | Weather data (wind, waves, pressure) | 10,000 requests/day |
| NOAA CO-OPS | Tidal predictions (US waters) | Reasonable use |
| PVGIS | Solar irradiance data | Reasonable use |
| OpenAI (text-embedding-3-small) | RAG embeddings | Standard rate limits |

### 12.3 Frontend Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| Astro | Framework | 5.x |
| React | UI components (islands) | 19.x |
| @astrojs/react | React integration | Latest |
| @astrojs/node | SSR adapter | Latest |
| @astrojs/sitemap | Sitemap generation | Latest |
| @astrojs/rss | RSS feed generation | Latest |
| tailwindcss | Utility-first CSS framework | 4.x |
| antd | UI components (Ant Design 5) | 5.x |
| @ant-design/icons | Icon library | Latest |
| react-hook-form | Form management | Latest |
| zustand | Client state management | 5.x |
| @tanstack/react-query | Server state management | 5.x |
| @supabase/supabase-js | Supabase client | Latest |
| maplibre-gl | Map rendering | Latest |
| recharts | Charts and graphs | 2.x |
| @vite-pwa/astro | PWA support | Latest |
| astro-pagefind | Client-side search | Latest |
| astro-embed | YouTube embeds | Latest |

---

## 13. PWA Configuration

The site is installable as a PWA via `@vite-pwa/astro` with Workbox.

### 13.1 What PWA Enables

- Install prompt on supported browsers (Chrome, Edge, Safari 17+)
- Offline access to cached pages and tool data
- Background sync for tool saves when connectivity returns
- Push notifications for alerts and community activity (future)

### 13.2 Service Worker Strategy

| Resource | Caching Strategy |
|----------|-----------------|
| App shell (HTML, CSS, JS) | Cache-first with network fallback |
| Blog/KB content | Stale-while-revalidate |
| Tool data (routes, configurations) | Cache-first, background sync on save |
| Map tiles | Cache-first (tiles are immutable per version) |
| API responses | Network-first with cache fallback |
| Images | Cache-first with size limit |

### 13.3 Manifest

```json
{
  "name": "Above Deck",
  "short_name": "Above Deck",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#1a1a2e",
  "icons": [...]
}
```

---

## 14. Analytics & Monitoring

### 14.1 Analytics

- Umami (self-hosted, privacy-respecting, GDPR-compliant)
- No cookies, no personal data collection
- Page views, referrers, devices, countries
- Event tracking: tool usage, sign-ups, almanac contributions

### 14.2 Uptime Monitoring

- External uptime check on site, API, and Supabase endpoints
- Alert on downtime (email, webhook)

### 14.3 Error Tracking

- Client-side error boundary in React components
- Server-side error logging in Astro SSR
- Structured error logging in Go API
- No third-party error tracking service initially — structured logs to stdout, review in Fly.io dashboard

---

## 15. Footer

Footer appears on every page via BaseLayout. Contains:

- **Privacy Policy** (`/privacy`)
- **Cookie Policy** (`/cookies`)
- **Your Privacy Rights** (`/privacy/request`) — DSAR form
- **Cookie Settings** — reopens consent modal (JavaScript action, not a page)
- **Terms of Use** (`/terms`) — placeholder, not yet spec'd
- **Open Source** — link to GitHub repo

Cookie consent banner appears above the footer on first visit. See `privacy-legal.md` for full spec.

---

## 16. Build Order

Recommended implementation sequence. Each phase is independently useful.

### Phase 1: Foundation

- Astro project with BaseLayout, ToolLayout, ContentLayout
- Tailwind theme with brand colours, typography
- Header, footer, mobile nav
- Cookie consent banner
- Privacy policy, cookie policy, DSAR request form pages
- Homepage (structure, no copy)
- Google OAuth (Supabase Auth, PKCE)
- User profile page (MVP: avatar, name, email from Google)

### Phase 2: Content

- Blog content collection, index, post pages
- KB content collection, index, article pages
- RSS feed
- Pagefind search
- SEO: structured data, Open Graph, sitemap

### Phase 3: Tools (First Batch)

- Energy Sizer
- Solar Calculator
- Tide Viewer
- VHF Simulator (migrate existing)
- Tool save/load with account

### Phase 4: Almanac

- Almanac data model in Supabase
- MapLibre map with POI markers
- Search and filter
- Entry detail pages
- Review submission
- Moderation queue

### Phase 5: Community

- Forum data model in Supabase
- Forum pages (categories, threads, posts)
- Community chat (Supabase Realtime)

### Phase 6: Tools (Second Batch)

- Passage Planner
- Weather Dashboard
- Circumnavigation Planner
- Anchor Watch (hosted)

### Phase 7: Social

- Friend connections
- Position sharing
- Activity feed
- Live beacon
- Route library
- Fleet coordination

### Phase 8: RAG Pipeline

- Content chunking and embedding
- pgvector storage
- Spoke sync of embeddings
- Stale content detection

### Phase 9: Polish

- PWA configuration
- Lighthouse optimisation
- Feature pages
- Hardware guide
- Install page
- Admin dashboard
