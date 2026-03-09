# Solar Tools & Community Platform — Design Document

**Date**: 2026-03-09
**Status**: Approved
**Phase**: Phase 1 (Content Platform & Community) + Phase 2 (Standalone Tools) — built together as one launch

## Overview

A unified launch combining the flagship Energy Planner tool, a community content platform (blog, knowledge base, discussions), and community channels. Everything ships together as a complete experience.

### What We're Building

1. **Energy Planner** (`/tools/solar`) — one adaptive tool covering system sizing, generation calculation, and upgrade planning
2. **Blog** — builder's journal + sailing/educational content (MDX)
3. **Knowledge Base** — factual reference content by topic, inline in calculator and standalone for SEO
4. **Community Page** (`/community`) — discussions, WhatsApp Channel invite (auth-gated), newsletter signup
5. **In-App Discussions** — lightweight threaded topics
6. **Product & Appliance Database** — curated marine component specs and power consumers in Supabase
7. **Auth** — Google Sign-In only via Supabase

### Design Principles

- **Trusted, safe community feel** — no dark patterns, no nudges, no commercial tactics. Transparent and upfront about what auth enables.
- **Progressive disclosure** — simple by default, power users opt into depth
- **One tool, adaptive experience** — the Energy Planner adapts to the user's journey, not three separate calculators
- **Offline-capable** — calculator works without connectivity using cached data
- **Dark mode first** — sailors plan at night

---

## 1. Energy Planner (`/tools/solar`)

### Concept

One unified tool with three entry points based on what brings the user here. All three share the same calculation engine, appliance database, PVGIS location data, and output format. The difference is what's pre-filled and what's editable.

### Entry Points

**"I'm planning a new system"** — Full sizer flow. Boat model → appliances → location → complete recommendation with schematic.

**"I have solar — is it enough?"** — Starts with "What do you have?" inputs (panel wattage, batteries, location) → shows generation vs consumption → highlights gaps → recommends additions.

**"I want to add or upgrade"** — Starts with existing setup → "What are you adding?" (watermaker, bigger fridge, Starlink, washer/dryer) → shows the delta needed.

Users can switch journeys at any point — it's all one page with adaptive sections, not separate routes.

### Input Flow — Progressive Build

**Quick Start (one screen, 30 seconds):**

- Select your boat — search/select model (e.g. "Lagoon 43") or "Custom / I don't know"
  - If model selected: pre-populates factory electrical specs, default crew capacity, typical appliance set
  - If custom: asks boat length range (under 30ft / 30-40ft / 40-50ft / 50ft+) and type (monohull / catamaran)
- Crew size — pre-filled from boat model, editable (default 2-3)
- Cruising region — pick from popular areas or drop a pin
- Cruising style — Weekend / Coastal / Offshore (pre-selects an appliance profile)

Instant result. Full system recommendation appears immediately.

**Customize (opt-in):**

- Adjust individual appliances (add/remove, change hours)
- Switch between At Anchor / On Passage views
- Change battery chemistry, system voltage, days of autonomy
- Add/remove charging sources (alternator hours, shore power)

**Advanced (opt-in):**

- Override solar derating factors (shading, angle, temperature)
- Override location sunshine data
- Adjust specific wattages and duty cycles
- Multi-location comparison

### Output — Complete System Recommendation

Results update in real-time (no "Calculate" button). Three tiers shown: Minimum / Recommended / Comfortable.

**Full component chain:**

1. **Solar panels** — total wattage, suggested panel count and size
2. **MPPT charge controller** — amperage and voltage rating, with 2-3 popular product examples (e.g. "30A MPPT, 100V input — e.g. Victron SmartSolar 100/30, Renogy Rover 30A")
3. **Battery bank** — capacity in Ah, chemistry, number of batteries, with AGM vs LiFePO4 comparison side-by-side
4. **Inverter/charger** — wattage rating if AC loads exist (e.g. "2000W inverter/charger — e.g. Victron MultiPlus 12/2000")
5. **Alternator contribution** — estimated daily Ah from engine alternator based on motoring hours, note if smart regulator recommended for LiFePO4
6. **Battery monitor** — recommended spec (e.g. "shunt-based monitor — e.g. Victron SmartShunt")
7. **Wiring** — recommended wire gauge for main runs based on current and system voltage

Each component shows: spec needed, why, and 2-3 popular product examples with sourced specs. Users can request additional products to be added to the database.

### Visualizations

**24-hour energy flow chart** — solar bell curve (green) vs consumption stacked by category. Togglable between at anchor and on passage modes.

**Monthly generation bar chart** — 12 bars based on PVGIS data for the selected location, with consumption line overlaid. Highlights which months have surplus vs deficit.

**Consumption donut chart** — breakdown by category (refrigeration, navigation, comfort, etc.) with total daily Wh in the centre.

**Multi-location comparison** — side-by-side bars for 2-3 locations. "Your 400W setup produces 1,560Wh/day in the Caribbean but only 920Wh/day in the UK in December."

### System Schematic

Auto-generated SVG wiring schematic that adapts to the user's selected components:

- Solar panels → MPPT charge controller → battery bank → distribution
- Alternator → smart regulator (if LiFePO4) → battery bank
- Shore power → inverter/charger → battery bank
- Battery bank → DC distribution panel → DC loads
- Battery bank → inverter → AC distribution → AC loads
- Battery monitor (shunt) position
- Fuse/breaker locations and ratings

Adapts automatically:

- LiFePO4 selected? Shows BMS and smart alternator regulator
- No AC loads? Inverter disappears
- Multiple MPPT controllers? Shows parallel solar strings
- 24V system? Shows series battery configuration
- Watermaker? Shows dedicated breaker and wiring run

Clean, colour-coded system diagram (not photo-realistic). Components labelled with recommended specs. Exportable as PDF for sharing with marine electricians.

### "What If?" Experience

Both entry points share a "What if?" toggle panel:

- "What if I add 200W more solar?"
- "What if I switch from AGM to LiFePO4?"
- "What if I add a watermaker?"
- "What if I cruise the Med instead of Caribbean?"
- "What if I add a washer/dryer?"

Results update in real-time, showing before/after comparison. The delta is always clear.

### Saved Configurations

The tool page states upfront: "This tool works without an account. Sign in with Google to save configurations across devices and share them."

**Without auth:**

- `localStorage` auto-saves as the user works
- Returns to the same state on next visit

**With auth:**

- Saved to Supabase, named, multiple configs (e.g. "Current Lagoon 43 setup", "Proposed LiFePO4 upgrade")
- Shareable via URL (config ID in URL, anyone can view, only owner can edit)
- On first sign-in, `localStorage` config migrates to account automatically

### Location-Aware Solar Data

- PVGIS API (`MRcalc` endpoint) provides monthly horizontal irradiance by lat/lon
- Daylight hours derived from latitude + date
- Marine derating factor applied: default 75%, adjustable in advanced options
- Advanced users can override: shading %, panel angle, temperature derating
- Results cached aggressively — irradiance data is stable year to year

### Core Sizing Formula

```
Required Solar (watts) = Daily Consumption (Wh) / (Peak Sun Hours × System Efficiency)
```

Marine derating factors (combined 0.55–0.80):

| Factor | Typical Loss |
|--------|-------------|
| Temperature | 10-15% |
| Panel angle (horizontal on boats) | 5-15% |
| Shading (rigging, boom, sails) | 10-30% |
| Wiring losses | 2-5% |
| MPPT conversion | 2-5% |
| Soiling/salt spray | 2-5% |

Default composite: 75% of nameplate rating for typical marine installation.

---

## 2. Power Consumer & Product Database

### Power Consumer Database (~50+ appliances)

Stored in Supabase. Categories:

| Category | Examples |
|----------|----------|
| Navigation | Chartplotter, autopilot, radar, AIS, instruments, GPS |
| Communication | VHF, SSB, Starlink, satellite phone, WiFi booster |
| Refrigeration | Small fridge, large fridge, freezer, fridge/freezer combo |
| Lighting | Cabin LEDs, anchor light, nav lights, deck light, reading light |
| Water Systems | Freshwater pump, watermaker (small/large), bilge pump, electric toilet |
| Comfort / Galley | Fans, microwave, coffee maker, kettle, stereo, TV, washer/dryer |
| Charging | Laptop, phones/tablets, camera/drone, inverter standby |
| Sailing / Safety | Windlass, bow thruster, electric winch, smoke/CO detector |

Each appliance stores:

- Default wattage (range: typical low–high)
- Amps at 12V and 24V
- Hours/day at anchor and on passage (defaults)
- Duty cycle where applicable
- Category and icon
- Always-on / scheduled / intermittent classification
- Crew-scaling flag (water pump, device charging, galley appliances, washer/dryer scale with crew size)

### Product Spec Database (~30 seeded products)

Stored in Supabase. Component types:

| Component Type | Seeded Products |
|----------------|----------------|
| MPPT Controllers | Victron SmartSolar 75/15, 100/30, 100/50, 150/35; Renogy Rover 20A, 40A; EPEver Tracer |
| Solar Panels | Victron BlueSolar range; Renogy 100W, 200W rigid; SunPower flexible |
| Batteries (LiFePO4) | Battle Born 100Ah; Victron Smart LiFePO4; Renogy 100Ah, 200Ah |
| Batteries (AGM) | Victron AGM; Lifeline GPL; Trojan |
| Inverter/Chargers | Victron MultiPlus 12/500, 12/2000, 24/3000; Victron Phoenix |
| Battery Monitors | Victron SmartShunt; Victron BMV-712 |
| Alternator Regulators | Wakespeed WS500; Balmar MC-614; Sterling Power |

Each product stores:

- Make, model, key specs (watts, amps, voltage, capacity)
- Source URL (where specs came from)
- Date added / last verified
- Compatible system voltages
- Weight, dimensions
- Approximate price range

### Product Spec Auto-Lookup

When a user selects a specific make/model for an appliance (e.g. "Dometic CRX-50"):

1. Check database first — if we have it, use real specs
2. If not found, offer to look it up — "We don't have specs for that model yet. Want us to find them?"
3. Request goes to a queue, we research and add specs with source citation
4. User notified when available

Calculator never blocks — uses category defaults if specific product isn't in the database, with a note: "Using typical specs for this category. Request exact specs for your model →"

### Request a Product

Button on any component recommendation: "Don't see your product? Request it." Simple form: make, model, optional link to product page. Stored in `product_requests` table.

---

## 3. Blog

### Two Content Streams, One Blog

- **Builder's Journal** — development updates, architecture decisions, behind-the-scenes. Category: `builder`
- **Sailing & Education** — solar guides, gear deep dives, destination info. Categories: `sailing`, `electrical`, `destinations`, etc.

Filterable by category. All posts in one feed by default.

### Technical Implementation

Astro MDX content collections with frontmatter schema:

- title, description, pubDate, updatedDate
- category, tags, difficulty (optional)
- youtubeId (optional — renders video-first layout)
- heroImage (optional)
- author, estimatedReadTime

YouTube embeds via `astro-embed` (lazy-loaded, static thumbnail until interaction).

RSS feed via `@astrojs/rss`.

Vlog support: posts with `youtubeId` render with video prominent. A `/watch` filtered view shows video content.

---

## 4. Knowledge Base

### Topic-Based Reference Content

Factual, structured reference content — not how-tos or skills guides.

| Category | Example Articles |
|----------|-----------------|
| Electrical Systems | Watts/amps/volts explained, solar panel types, battery chemistry comparison, 12V vs 24V systems, MPPT vs PWM, wiring standards, alternator charging |
| Engine & Mechanical | Diesel engine maintenance schedules, impeller specs, oil types, winterising procedures, service intervals by engine model |
| Plumbing & Water | Watermaker operation & specs, freshwater system components, holding tank maintenance, marine toilet systems |
| Safety & Emergency | Safety equipment requirements by region, EPIRB/PLB registration, fire suppression systems, liferaft servicing schedules |
| Provisioning & Living | Power management routines, laundry systems, galley equipment specs, refrigeration efficiency |
| Destinations & Cruising | Regional guides, port/anchorage info, customs & immigration requirements, cruising permits, seasonal weather patterns, mooring types & techniques |

### Dual Purpose — Inline and Standalone

**Inline in Energy Planner:** When a user hits the battery chemistry selector, an expandable "Learn more" card shows the AGM vs LiFePO4 comparison from the KB. Same content, surfaced contextually.

**Standalone pages:** Each article lives at `/knowledge/[category]/[slug]` for SEO. Full article with related articles, difficulty badge, prerequisites.

### Structured for Future RAG

- H2 headers as chunk boundaries (each section self-contained)
- `summary` and `keyTopics` fields in frontmatter for embedding metadata
- Short focused paragraphs (3-5 sentences)
- Structured data (tables, lists) preferred over prose
- Every section includes enough context to be understood in isolation

### Search

Pagefind — client-side full-text search, zero server cost. Filterable by category, difficulty, tags. Index built at deploy time.

### Content Collection Schema

```typescript
const knowledge = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/knowledge' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum([
      'electrical', 'engine-mechanical', 'plumbing-water',
      'safety-emergency', 'provisioning-living', 'destinations-cruising'
    ]),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    tags: z.array(z.string()),
    prerequisites: z.array(z.string()).optional(),
    estimatedReadTime: z.number(),
    lastVerified: z.coerce.date(),
    contributors: z.array(z.string()),
    summary: z.string().max(500),
    keyTopics: z.array(z.string()),
  }),
});
```

---

## 5. Auth, Community & Discussions

### Authentication

Google Sign-In only via Supabase Auth. PKCE flow for server-side auth in Astro.

**Requires auth:** saving configurations, requesting product specs, posting in discussions, WhatsApp Channel invite, newsletter management.

**Works without auth:** Energy Planner (full calculation, localStorage save), all KB and blog content, browsing community page and discussions.

The tool states upfront: "This tool works without an account. Sign in with Google to save configurations across devices and share them." No banners, no timed pop-ups, no persuasion patterns. The value is self-evident.

### Community Page (`/community`)

A single hub page:

- **WhatsApp Channel invite** — prominent card with QR code and link. Auth-gated: "Sign in with Google to join our WhatsApp community." WhatsApp Channel used for one-way broadcast announcements (not a Group — avoids scaling/noise problems).
- **In-app discussions** — threaded topics
- **Latest blog posts** — feed of recent articles
- **Newsletter signup** — email capture for weekly digest
- **Member count / activity stats** — social proof as community grows

### In-App Discussions

Lightweight threaded discussions backed by Supabase:

- Topics organised by category (Electrical, Engine & Mechanical, General, Introductions, Feature Requests, etc.)
- Thread model: topic → replies. No nested threading.
- Each thread: title, body (markdown), author, timestamp, category, reply count
- Each reply: body (markdown), author, timestamp
- Authenticated users can post and reply
- Basic moderation: report button, admin can hide/delete

Not building yet: likes/upvotes, reputation, badges, real-time updates, rich media uploads, discussion search.

### Daily Digest → WhatsApp Channel

Automated daily summary of discussion activity broadcast to the WhatsApp Channel:

- "3 new threads today: 'Solar sizing for a Lagoon 42', 'Best watermaker for coastal cruising', 'Alternator regulator for LiFePO4'"
- Links back to the site for each thread
- Creates a flywheel: WhatsApp drives traffic to site, discussions generate content, digest goes back to WhatsApp

### Newsletter

Weekly email via Buttondown (free tier). Curated: new blog posts, popular discussion threads, new KB articles, product database additions. Simple signup form on community page, blog sidebar, and post-auth welcome.

---

## 6. UX & Visual Design

### Design Language

Mantine v7 + Tabler Icons. Trusted, community feel — clean, accessible, no commercial patterns.

**Dark mode first** (sailors plan at night):

- Background: `#1a1a2e` (deep navy)
- Surfaces/cards: `#16213e`
- Primary text: `#e0e0e0`
- Secondary text: `#8b8b9e`
- Solar/generation: `#4ade80` (green)
- Consumption: `#f87171` (coral)
- Neutral: `#60a5fa` (blue)
- Light mode also supported via user toggle

**Mobile-first, responsive:**

- Card-based layouts throughout
- Touch targets minimum 44x44px
- Bottom sheet pattern for results on mobile
- Thumb-zone awareness — primary actions in lower 40% of screen

**Calculator UX:**

- Real-time updates, no "Calculate" button (debounced 100ms)
- Sliders for continuous values with tap-to-type exact number
- Toggle switches for on/off appliances
- Subtle animation on value changes
- Colour transitions: green → amber → red as system approaches limits

---

## 7. Technical Architecture

### Frontend: Astro + React Islands

| Page | Type | Notes |
|------|------|-------|
| Landing page | Astro static | Marketing, value prop |
| `/tools/solar` | React island | Energy Planner — full interactive calculator |
| `/blog`, `/blog/[slug]` | Astro MDX | Static content, YouTube embeds |
| `/knowledge`, `/knowledge/[slug]` | Astro MDX | KB articles with inline calculator components |
| `/community` | React island | Discussions, WhatsApp gate, newsletter |
| `/community/[thread]` | React island | Thread view with replies |

### State Management

- **React Query** — server state (appliance catalog, product specs, PVGIS data, discussions, saved configs)
- **Zustand** — calculator UI state (selected appliances, slider values, journey mode)
- **URL-encoded state** — shareable calculator configurations

### Database: Supabase (PostgreSQL)

| Table | Purpose |
|-------|---------|
| `profiles` | Google auth users, preferences |
| `power_consumers` | Appliance catalog with defaults, categories, crew-scaling flags |
| `product_specs` | Component database with sourced specs, verification dates |
| `product_requests` | User-submitted product lookups |
| `boat_model_templates` | Factory specs by boat model |
| `saved_configurations` | Named calculator configs per user |
| `discussions` | Thread topics with category, author |
| `replies` | Thread replies |
| `newsletter_subscribers` | Email list |

### External APIs

- **PVGIS** (`MRcalc` endpoint) — solar irradiance by location/month. Free, global, no API key. Cached aggressively.

### Docker Compose

Full local dev stack from day one:

- `web` — Astro dev server
- `supabase-db` — PostgreSQL with seed data (appliances, products, boat templates)
- `supabase-auth` — Google OAuth
- `supabase-storage` — future file uploads
- `analytics` — Umami self-hosted

### Offline Support (PWA)

- Service worker caches app shell and calculator
- Appliance catalog and product specs cached locally
- PVGIS responses cached for visited locations
- Calculator works offline with cached data
- Discussions and auth require connectivity

### URL Structure

- `/tools/solar` — Energy Planner (future: `/tools/fuel`, `/tools/passage`, `/tools/route`)
- `/blog` — all posts, filterable
- `/blog/[slug]` — individual post
- `/knowledge` — KB index by category
- `/knowledge/[category]/[slug]` — individual article
- `/community` — hub page
- `/community/[thread]` — discussion thread

---

## 8. What We're NOT Building Yet

- Go API server (Supabase handles everything for this phase)
- AIS integration
- Route planning / maps
- User profiles beyond basic auth
- Product scraping automation
- Discussion search, upvotes, badges, real-time updates
- Rich media uploads in discussions
- Fuel / water / passage resource calculators
- Equipment registry with service tracking
- Social features (groups, messaging, crewing)
