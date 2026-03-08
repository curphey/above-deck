# Above Deck — Project Principles

**Date**: 2026-03-08
**Status**: Approved

## Core Philosophy

Above Deck is a free, open-source sailing platform built for the community. It will never charge users or monetize data. It exists because sailors deserve better tools and the current market is fragmented, expensive, and closed.

## Technical Principles

### Platform: PWA-First

- Single codebase serving web, iPad, and all mobile devices
- Fully installable PWA with home screen icon, splash screen, native feel
- No native app store dependencies (avoids Apple/Google gatekeeping and fees)

### Offline-First

- Core functionality works without connectivity: equipment registry, saved routes, logs, calculators
- Sync when connection returns — conflict resolution handled gracefully
- Weather and AIS data cached when last fetched, with clear "last updated" indicators
- Maps/charts cached for planned routes and frequently visited areas

### Authentication

- Google Sign-In only — simple, one provider, no password management
- Supabase Auth handles the integration

### Timezone & Location Awareness

- All times displayed in local timezone of the relevant location (not user's home timezone)
- Passage plans show timezone transitions
- Dates and times use formats appropriate to location context
- English only for now, but architecture should not hardcode strings (i18n-ready structure without the translation effort)

### Dockerized From Day One

- Entire stack runs in Docker — `docker compose up` for full local development
- Dockerfiles for Astro frontend and Go API
- Docker Compose includes Supabase (DB, Auth, Realtime, Storage), analytics (Umami), and all services
- Production: Docker images deployed to Fly.io (API), Netlify (web build)
- No "works on my machine" — consistent environments from development to production
- Contributors can get running with a single command

### UI Framework

- **Mantine** — React component library (clean, accessible, dark mode, responsive)
- **Tabler Icons** — Icon set (Mantine's default, consistent style)
- Mantine's built-in components (tabs, accordions, segmented controls) support progressive disclosure natively

### Open Source & Transparency

- Full codebase public on GitHub
- Changelog/update feed in-app so users can follow development
- Community contributions welcome (boat templates, equipment specs, POI data)

## Design Principles

### Beautiful & Simple

Design inspiration: Spotify (navigation, dark mode, content-forward), Google Maps (map interaction, progressive detail), Lemonade (onboarding, friendly tone, clarity), Headspace (calm UI, guided experiences, illustration style).

**Progressive disclosure everywhere:**
- Simple view by default — clean, card-based, colour-coded status indicators
- Power view available via toggle for users who want depth
- Collect and compute full detail, present only what's needed
- Never overwhelm on first encounter

### Template-Driven Onboarding

- Minimise manual data entry — boat models, equipment specs, and power consumers all have template databases
- "Select your Lagoon 43" → entire equipment list populated → confirm or adjust
- Community-growable template databases

## Social & Community

### User Profiles

**Content:**
- Basic info (name, photo, location, bio)
- Sailing experience (years, miles logged, roles — skipper/crew/navigator)
- Certifications (RYA, ICC, ASA, STCW, VHF license, first aid, etc.)
- Voyage logs (linked to routes if planned in-app)
- Boats (current and past, linked to equipment registry)

**Privacy model (granular per section):**
- **Private** — Only you (default)
- **Group** — Shared with specific groups
- **Public** — Visible to community

### Groups (First-Class Concept)

Groups serve multiple purposes:
- A boat's crew (tied to a vessel)
- A yacht club or sailing association
- A rally fleet (e.g. ARC participants)
- Friends who sail together
- Groups have their own shared routes, logs, chat, and member directory

### Communication

- **Community chat** — Group-level discussions (yacht club, rally fleet, harbour/anchorage chat)
- **Person to person** — Direct messages between sailors
- **Boat to boat** — Vessel-level comms tied to the boat profile (persists across crew changes)

### VHF / AIS Integration

- Vessel profiles store MMSI number and VHF call sign
- AIS overlay shows nearby vessels — tap to see Above Deck profile (if user) and message them
- Bridges VHF (short range, voice, public) with digital messaging (private, persistent, global)

### Crewing

- Profiles with verified experience + certifications enable trust for crewing
- Logged passages in-app serve as verifiable experience records
- Crew-wanted/crew-available matching based on qualifications and availability

## Builder's Hub (Blog / Vlog / Forum)

Built into the Above Deck site (not a separate platform):

### Blog & Vlog

- Development journal — share plans, progress, decisions, and behind-the-scenes
- MDX-powered content within Astro (rich media, embedded code, components)
- YouTube video embeds for tutorials and vlogs
- RSS feed for subscribers

### Community Forum

- Chat-style forum for users to ask questions, share tips, and discuss features
- Threaded discussions organized by topic
- Builder can respond directly — transparent, accessible development

### Changelog

- In-app update feed — users see what's new without checking GitHub
- Tied to releases — each deploy can auto-generate a changelog entry
- "What's new" badge/notification for returning users

## Help & Education

- In-app contextual help system (tooltips, guided tours for new features)
- YouTube video tutorials for key workflows
- Help content embedded, not external wiki links
- Onboarding that teaches by doing, not reading

## Integrations

### Chartplotter Export/Import

- GPX export with proper waypoint naming, notes, metadata
- Compatible with Garmin, Raymarine, B&G, Simrad, Furuno
- Import GPX from other tools

### SignalK

- Future integration point for live boat data (instrument feeds, tank levels, engine hours)
- Open protocol, aligns with open-source philosophy

### AIS

- AISStream.io for real-time vessel tracking
- Links AIS identity (MMSI) to Above Deck user profiles

## Project Realities

### Solo Developer

- Built by a very senior developer as a passion project
- No timeline pressure — ships when ready, quality over speed
- May attract open-source contributors over time
- Influencer partnerships (e.g. sailing YouTube channels like SV Delos) for awareness

### No Monetization — Ever

- No paid tiers, no premium features, no ads, no data selling
- Hosted on free/low-cost infrastructure (Supabase free tier, Netlify free tier)
- If costs grow, fund through donations/sponsorship (Open Collective model), never paywalls
- This is a gift to the sailing community

### Phasing

- **Phase 1 (MVP)**: Route planning, weather, tides, POIs, crew collaboration, AI assistant
- **Phase 2**: Vessel management, equipment registry, energy/resource planning, standalone calculators
- **Phase 3**: Full social layer — profiles, groups, chat, crewing, AIS-linked messaging
- Phases can overlap — standalone tools (calculators, equipment registry) can ship early for marketing value
