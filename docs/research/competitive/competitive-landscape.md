# Competitive Landscape — Consolidated Research

**Date:** 2026-03-20
**Sources:** market-research.md (2026-03-08), navigation-chartplotter-research.md (March 2026), deep-dive-competitor-analysis.md (2026-03-08)

---

## Executive Summary

The marine navigation and sailing app market is fragmented, expensive, and ripe for disruption. Commercial tools are increasingly locked down, aggressively monetised, and frustrating users. Open-source alternatives exist but are trapped in 2005-era desktop paradigms.

No single product combines community-shared itineraries, modern UX, multi-day trip planning, weather-aware scheduling, crew collaboration, and open data. The market splits cleanly: **navigation apps** have no social features, **social apps** have no navigation, and **weather tools** are expensive and complex. Users currently need 3-4 apps to cover what should be one workflow.

The clearest opportunity is a web-native, open-source platform combining community knowledge, modern design, passage planning, and Signal K integration, targeting **coastal cruisers and bluewater sailors**. The technical building blocks are all available (MapLibre, NOAA charts, Open-Meteo, Signal K); the missing piece is execution.

> **Update (2026-03-27):** Target users are coastal cruisers and bluewater sailors, NOT charter tourists. Charter sailors are a secondary audience at best.

---

## 1. Navigation Apps — Sailing-Focused

### Savvy Navvy — "Google Maps for Boats"

**Website:** https://www.savvy-navvy.com/
**Pricing:** Essential $79.99/yr, Explore $144.99/yr, Elite $149.99/yr (other source: basic ~$99/yr, Elite ~$189/yr)
**Rating:** 4.7/5 App Store
**Tech stack:** React/Preact frontend, Node.js + Python backend, AWS Lambda serverless, DynamoDB, Mapbox for mapping, Redux state management, Flutter for mobile, Cypress for e2e testing. Heavy AWS infrastructure (CloudFront, S3, EC2, Route 53, Cognito).

**Strengths:**
- Clean, intuitive interface — strips away chart clutter that intimidates non-sailors
- Smart routing that factors weather, tides, depth, and vessel specs
- Elite tier calculates tacking angles using predicted wind + boat polars
- Departure scheduler considering weather windows, tides, and daylight
- GPX export to Garmin/Raymarine chartplotters
- Built with yacht sailors at the forefront (unique positioning)
- Good marketing and brand positioning — nailed the "make it simple" message

**Weaknesses:**
- **Android is a mess.** Forum complaints about crashes, failed offline chart downloads (dies between 40-80%), and GPS tracking that shows straight lines instead of actual position
- Auto-routing can be "clunky" and struggles with complex sailing scenarios
- Route accuracy criticised by experienced sailors, particularly for tidal waters (UK East Coast specifically called out)
- Basic subscription locks out tides and currents — absurd for a sailing navigation app
- Chart detail lacking vs Navionics
- GPS tracking inconsistencies reported
- No strong social/community features
- Routing has been criticised for sending vessels into dangerous shallows in strong winds
- Users can't trial the app without providing credit card details first
- Bridge information is limited with no zoom detail

**What Above Deck can learn:** Savvy Navvy proved there's a massive market for "navigation made simple." But their execution has significant gaps, especially on Android and for serious passage planning. The "Google Maps for boats" positioning works for casual boaters but serious sailors find it lacking. Never lock tides/currents behind a paywall.

---

### PredictWind — Weather Routing Leader

**Website:** https://www.predictwind.com/
**Pricing:** Free / $29/yr (basic) / $249/yr (standard with routing) / $499/yr (professional)

**Strengths:**
- **Best weather routing in the market. Period.** Favoured by offshore sailors and racers
- Industry-leading weather data: ECMWF, AIFS, ICON, UKMO, GFS + proprietary PWAi/PWG/PWE models
- Four weather models for comparison — sailors can cross-reference forecasts
- High-resolution forecasts up to 14 days
- Comfort mode with configurable avoidance parameters (e.g., >25kt wind, >2.5m waves)
- New AI-powered 5-dimensional polars (wind, wave height, swell periods, size, boat speed)
- AI-driven GMDSS text alerts turned into visual routing warnings
- Departure Planner is genuinely excellent for choosing weather windows
- Raymarine integration

**Weaknesses:**
- Not a full chartplotter — it's weather routing with basic chart overlay
- Complex interface — steep learning curve
- Expensive for the useful tiers ($249-499/yr); basic tier ($29/yr) is fairly useless without routing
- Primarily weather-focused, not a full cruising companion
- No social features, no harbour/anchorage reviews or community content
- App stability issues reported in app store reviews

**What Above Deck can learn:** PredictWind owns the weather routing space. Any chartplotter that wants to compete on passage planning needs to either integrate with PredictWind or build something comparable. Their AI weather models are a genuine differentiator. Weather routing doesn't have to be expensive or complex (see FastSeas), but it does need to be accurate.

---

### Orca — The Modern Chartplotter

**Website:** https://getorca.com/
**Pricing:** App is FREE. Plus EUR 49/yr (offline maps). Smart Navigation EUR 99/yr (weather routing + AIS). Total: EUR 148/yr for max. First year free.

**Strengths:**
- **Modern, beautiful UI** — the best-looking chartplotter on the market
- Fast vector maps with smooth zoom/pan
- **Unique: Auto-adapts route in real-time as sailing conditions change** (no other app does this)
- Excellent NMEA 2000 integration with autopilots from B&G, Simrad, Raymarine, Garmin
- Combines chart data with wind and current forecasts for detailed passage plans
- Accounts for draught, air draught, and sailing performance on different points of sail
- Sail routing powered by weather forecasts + boat polar diagrams
- Night light display is superb for night navigation
- Direct wireless integration with Raymarine Axiom chartplotters (unique partnership)
- Whole-world charts in one subscription
- MarineTraffic AIS integration
- Also sells dedicated marine hardware (Core: EUR 550, Display: ~EUR 1,000)

**Weaknesses:**
- Radar integration (B&G Halo 20+) is problematic — distorted or missing in certain modes
- Autorouting with tidal gates not reliable — users must manually verify
- Relatively new entrant, smaller community
- Hardware dependency (Orca Display 2) locks you into their ecosystem
- No social/community features
- No harbour/anchorage reviews

**What Above Deck can learn:** Orca is the most forward-thinking commercial offering. Their UI/UX sets the standard — worth studying closely for design inspiration. But their hardware tie-in and lack of community features are weaknesses. If they succeed with Orca Display 2, the integrated hardware + software model could lock in users. They're focused on navigation/hardware, not itinerary planning or community — that's our lane.

---

### SailGrib WR

**Website:** https://www.sailgrib.com/
**Pricing:** EUR 45.99/yr

**Strengths:**
- Full offline routing calculated on-device (no server dependency)
- Largest boat database (~160 racing and cruising boats)
- Weather, tides, currents, NMEA, and AIS with alarms
- Favoured by serious offshore sailors
- Well-regarded among serious offshore sailors

**Weaknesses:**
- **Android only** — massive gap for iOS users
- UI is dated and technical
- No social/community features
- No harbour/anchorage database
- More focused on weather routing than itinerary/trip planning

**What Above Deck can learn:** Offline routing calculated on-device is the gold standard. Having a large boat database matters for routing accuracy. But platform exclusivity is a non-starter.

---

### Squid Sailing (Great Circle)

**Strengths:**
- Satellite images, synoptic charts, SCAT files (satellite wind speed observations)
- Weather observations download at a click
- Popular with offshore racers
- GRIB file provider used by competitive sailors

**Weaknesses:**
- Small boat selection (racing focus)
- Not a general cruising tool
- Niche audience, limited community

**What Above Deck can learn:** Racing sailors need different tools than cruisers. Don't try to serve both audiences with the same feature set.

---

### FastSeas — Budget Weather Routing

**Website:** https://fastseas.com/
**Pricing:** Free / donations (~$1/month suggested)
**Founded by:** Jeremy Waters, a cruising sailor — built to scratch his own itch

**Strengths:**
- **Essentially free** — runs on donations
- Clean, focused passage planning tool
- Uses NOAA GFS data for 16-day routing
- Custom vessel performance/polar input
- GPX output with weather data embedded in waypoints
- **Works with satellite communicators (Iridium GO!, Garmin inReach, Zoleo)** — huge for offshore
- Email-based routing for bandwidth-constrained situations
- Simple, elegant interface

**Weaknesses:**
- Limited to weather routing — not a full chartplotter
- GFS-only (no ECMWF or other models)
- No offline mode
- Solo developer project — sustainability risk
- No AIS, no community features

**What Above Deck can learn:** Weather routing doesn't need to be expensive or complex. The satellite communicator integration is genuinely innovative and solves a real offshore problem. Complementary tool, not a competitor — potential integration partner.

---

### TZ iBoat / TimeZero (Furuno)

**Pricing:** TZ iBoat ~$20/yr, TZ Navigator ~$500-800, TZ Professional ~$3,000

**Strengths:**
- Professional-grade charts (raster, vector, satellite, bathymetric)
- AI Routing based on charted hazards, depth contours, and navigation rules
- BathyVision enhanced bathymetric detail
- TZ Maps format integrates raster, vector, satellite, and bathymetry in one layer
- Seamless sync with Furuno TZtouchXL hardware (strongest app-to-plotter sync in market)
- Dynamic moorings and configurable anchor alarms
- Strong offline capability
- AIS included by default
- ActiveCaptain POI integration
- Weather routing module with boat polars
- Professional version used by commercial vessels

**Weaknesses:**
- iOS only (mobile app)
- PC-only for full features
- Tied to Furuno ecosystem for full value
- Expensive chart subscriptions ($3,000 for professional)
- No social features
- Professional/power-user focus — steep learning curve
- Desktop-era UX

**What Above Deck can learn:** The TZ Maps approach of blending multiple data sources into one view is worth studying. Professional heritage builds trust, but the pricing and complexity alienate casual sailors. The "Photoshop of chartplotters" — powerful but not approachable.

---

### iSailor (Wartsila/Transas)

**Pricing:** Free download, charts from ~$4-$19 per pack, features extra. SEAiq: $9.99-$249.99.

**Strengths:**
- Most professional-level features as standard
- Very clean, professional chart presentation — developed by Transas (professional maritime)
- High-quality vector charts based on official hydrographic data
- Full control over XTD (cross-track distance) and waypoint turn radius
- Strong passage planning tools
- Augmented Navigation feature (2025) overlays data on camera view
- Pay-per-chart model can be cheaper than subscriptions if you sail one area
- Export/import via GPX, KML, KMZ

**Weaknesses:**
- **Death by a thousand in-app purchases.** Weather, tides, sailing guides, NMEA integration — all extra
- Total cost quickly exceeds subscription alternatives if you want full features
- Dated interface
- iOS-focused — limited Android experience
- No social/community features
- Professional maritime heritage means UI can feel overly technical

**What Above Deck can learn:** Great chart quality proves professional heritage matters. But nickel-and-dime pricing frustrates users. The Augmented Navigation feature is worth watching. Transparent pricing builds trust.

---

### SEAiq

**Pricing:** SEAiq USA $9.99, SEAiq Open $19.99, SEAiq Pilot $249.99

**Strengths:**
- **The only app that lets you load your own charts** in S-57, S-63, BSB, KAP formats
- Auto-downloads NOAA charts for free
- One-third of professional pilots worldwide use SEAiq Pilot
- Lower battery consumption than competitors
- Easy NMEA/WiFi gateway integration
- Proper night colour modes

**Weaknesses:**
- UI is functional but dated — built for professionals, not consumer-friendly
- Feature unlocking via in-app purchases after 7-day trial
- Limited community/social features
- Small development team

**What Above Deck can learn:** The ability to load arbitrary chart formats is unique and valuable. Professional pilot usage proves reliability. Low price point for a capable tool is notable. Worth studying for chart rendering approach.

---

### Windy.app — Routes for Sailors

**Website:** https://windy.app/
**Status:** Beta feature

**Features:**
- Route time estimation based on wind forecasts
- Boat-specific polars (Hanse 400e implemented)
- Distance measurement
- Sailing route simulation

**What Above Deck can learn:** Weather apps are expanding into route planning, creating convergence in the market. Shows that weather-first companies see sailing as a growth area.

---

### Wavve Boating

**Website:** https://wavveboating.com/

**Features:**
- Charts, GPS, route planning with sailing-specific features
- Users contribute tracks/trips that others can browse and follow (Strava-like)
- Community-reported hazards, POIs, conditions
- 2,000+ nautical charts across North America
- Draft-aware trip sharing — "trips taken by vessels with similar draft"

**What Above Deck can learn:** The "Waze for boats" model and draft-aware trip sharing are clever community features. The draft-filtering concept is genuinely useful.

---

### NavShip Boating

**Website:** https://navship.org/

**Features:** Addressing shallow water routing and smart route planning. Has "big plans for the 2025 season."

**What Above Deck can learn:** Worth watching as a potential new entrant in smart routing.

---

### SeaNav (Pocket Mariner)

**Strengths:**
- **Augmented Reality view** for identifying navigation features and vessels
- Built-in AIS as standard
- Simple, customisable navigation screen

**Weaknesses:**
- Slow chart loading
- Smaller user base
- Limited route planning sophistication

---

## 2. Marine Navigation — General Boating

### Navionics (Boating by Garmin)

**Website:** https://www.navionics.com/
**Pricing:** US & Canada $49.99/yr, USA only $39.99/yr, Worldwide $99.99/yr (up from $14.99 in 2020 — 233% increase; also reported as up from $24.99 pre-acquisition — 100% increase in one year)

**Strengths:**
- Industry-leading bathymetry data — the best depth contours in the business
- SonarChart HD bathymetry (0.5m contour detail)
- ActiveCaptain community: marina reviews, hazard reports, user-contributed content
- Massive user base and community database
- Works with Garmin chartplotters (Plotter Sync)
- Strong offline capability
- Established trust — the name everyone knows

**Weaknesses:**
- **Price gouging since Garmin acquisition.** Users are furious
- Forcing account creation for existing subscribers who bought under the old model
- Removed the popular Sonar view (detailed blue bottom view), replaced with less useful relief shading
- Reports of paid downloaded maps being turned off without warning — genuinely dangerous
- No automatic draft-aware depth display — you have to manually assess safety
- Cluttered interface with lots of information
- Not sailing-specific (designed for all boaters including fishing/power)
- No weather routing
- ActiveCaptain quality varies (unmoderated)
- UI feels dated compared to newer competitors

**What Above Deck can learn:** Navionics has the best underlying chart data and the largest user base, but Garmin is actively alienating their community with price hikes and anti-user decisions. The data lock-in is their real moat. There's a clear opening. Community data has massive value, but corporate acquisition of it breeds resentment.

---

### Ditch Navigation — AI-Powered

**Website:** https://ditchnavigation.com/
**Pricing:** Freemium

**Strengths:**
- **Smart Path technology: analyses billions of AIS data points for safest routes**
- AI routing learns from real boating patterns (not just chart data)
- Smart ETA factors in no-wake zones and actual cruising speeds
- Continuously updated from AIS, NOAA charts, Corps of Engineers depth soundings
- Routing AI continuously improves

**Weaknesses:**
- Power/motor boating focus (not sailing-specific)
- No wind/sailing routing
- Newer app, still building user base
- US waterways focus

**What Above Deck can learn:** Using AIS data to learn real navigation patterns is genuinely novel. The "where boats actually go" concept is powerful. But sailing-specific needs (wind routing, tacking angles) are completely different from powerboat routing.

---

## 3. Community & Social Apps

### SeaPeople — Social Tracking & Community

**Website:** https://seapeopleapp.com/
**Launched:** October 2024
**Users:** 58,000+ active users, 3.5+ million miles logged
**Founded by:** Logan Rowell (CEO), former CTO of Shopify, team behind Sailing La Vagabonde (world's biggest sailing YouTube channel)

**Pricing:**
- **Free tier**: Basic tracking, travel totals, 5-second videos
- **PLUS subscription**: Detailed trip stats, web sharing of live trips, advanced analytics
- **PATRON subscription**: Highest tier with additional features
- Specific pricing not publicly listed

**Core Features:**
- One-tap trip tracking (no extra hardware required)
- Digital logbook with distance, speed, and crew data for every voyage
- Crew tagging on trips, editable tracklines
- Privacy controls (private trips, visibility permissions)

**Live Trips:**
- Real-time voyage sharing through web links
- Tracklines, statistics, and weather overlays visible to followers
- Followers can comment and provide feedback during live trips
- Live location invites — shareable links work for non-users too

**Hails (VHF-style communication):**
- Real-time communication tool with map visibility
- Create/respond to hails from any location
- Expiration timers keep hails relevant
- Described by users as "VHF/cruisers net on STEROIDS"

**Discussion Groups:**
- Community spaces for knowledge sharing
- Verified Groups for clubs and organizations with official credentials

**Social & Gamification:**
- Milestones and badges for hours, miles, and trips tracked
- Route discovery based on other users' trips
- Discover anchorages, fishing spots, and routes from the community

**Weaknesses:**
- **Android issues**: App described as slow and crash-prone on Android
- Some users find the social features compelling but want more navigation integration
- Deliberately NOT a navigation app — it's a community and logging app

**What Above Deck can learn:** SeaPeople validates the demand for a boating-focused social/community layer. The Hails concept (modernised VHF) is genuinely novel. Trip sharing with non-users via web links is smart. The La Vagabonde backing gives instant credibility. However, they deliberately avoid navigation/route planning — that's our lane. There's potential for complementary positioning.

---

### Navily — Anchorage Community

**Website:** https://www.navily.com/
**Pricing:** Free with Navily Premium for advanced features

**Strengths:**
- **35,000+ marinas and anchorages**
- **350,000+ community photos and reviews**
- Community-driven: depth, seabed, wind protection info
- Marina booking in 700+ European marinas
- In-app chat with users and marinas
- Real-time warnings on anchorages
- Emergency SOS feature
- Best-in-class community data for anchorages

**Weaknesses:**
- Marina prices marked up vs booking direct
- Primarily European coverage
- Not a full navigation app (cruising guide, not chartplotter)
- Premium required for weather, offline, and itinerary features
- No route weather routing

**What Above Deck can learn:** Navily proves there's massive demand for community-curated anchorage data. Their European focus leaves a global gap. The community model works but needs to be combined with actual navigation.

---

### Argo — Social Boating

**Website:** https://argonav.io/
**Pricing:** Free

**Strengths:**
- Social boating app with route sharing
- Auto-saves visited places and trips
- Community reports, photos, and reviews of beaches, anchorages, marinas, restaurants
- Share routes with friends and family for following
- Recommendation engine from other boaters

**Weaknesses:**
- US-focused
- Limited navigation sophistication
- Smaller community than Navily
- No weather routing

---

### SailTies — Crew Collaboration

**Website:** https://sailties.net/

**Strengths:**
- Collaborative itinerary tool — entire crew can view planned itinerary
- Visual route builder with waypoints and notes
- Live tracking link for friends/family
- Crew coordination features

**Weaknesses:**
- Small/new app
- Limited navigation features
- Not a standalone navigation solution

**What Above Deck can learn:** SailTies is the only app attempting collaborative itinerary viewing. The concept is right but the execution is limited. Nobody lets a skipper plan a route and share it with crew members who can see ETAs, waypoint notes, provisioning lists, watch schedules.

---

### KnowWake — Waze for Boats

**Strengths:**
- Real-time community data across North America, Canada, Caribbean, Australia, NZ
- User-generated hazards, POIs, marine life sightings
- 350+ inland waterways covered
- Named "Best Boating App" by Discover Boating

---

### ActiveCaptain — Community Data (Garmin-owned)

**What it was:** Originally an independent crowdsourced database of marina reviews, anchorage info, hazard reports, fuel prices, and POIs. Over 166,000 independent reviews. Photos. Community-edited wiki-style port guides. Open and accessible.

**What it became:** Garmin acquired it, renamed it "ActiveCaptain Community" (ACC), completely rebuilt it. The transition was rocky — users struggled with the new system, data migration had issues, and the community feels Garmin is extracting value rather than adding it.

**Direct quote from forums:** "ActiveCaptain USED TO BE great. ActiveCaptain USED TO BE open source. Now it's Garmin's play-thing / cash cow. And it's crap."

**Lessons for Above Deck:**
- Community data has massive value — Garmin bought it for a reason
- Corporate acquisition of community data breeds resentment
- Review moderation is essential but heavy-handed removal destroys trust
- The data needs to stay open, or the community will eventually fork/leave
- An open-source alternative where the data belongs to the community and is freely accessible would have massive pull — IF the data quality is maintained

---

## 4. Cycling App Analogies

### Komoot — Deep Dive

**Website:** https://www.komoot.com/
**Pricing (current, controversial):**
- Previous model: One-time purchase per region (EUR 3.99/region, 8.99/bundle, 29.99/world)
- New model (early 2025): Subscription required — EUR 6.99/month or EUR 59/year
- New users must subscribe to sync routes to GPS devices
- Existing users who ever purchased anything retain sync ability without subscription
- Free tier: One free region on signup, basic planning/navigation
- Premium (EUR 59/yr): Multi-day planning, offline maps, sport-specific maps, 3D maps, live tracking, weather, personal collections
- Community backlash: articles titled "Komoot confirms we don't want any new customers." Forced subscription for device sync particularly angered users.

#### How Multi-Day Tour Planning Works (Step by Step)

1. **Create a long route**: Plan or import a route that exceeds ~7 hours of estimated travel time
2. **Multi-day planner appears**: Once the route is long enough, Komoot surfaces the multi-day planner (Premium feature)
3. **Auto-split into stages**: Komoot suggests splitting the route into daily stages based on duration/distance
4. **Adjust stage endpoints**: Users drag stage boundaries to customize where each day starts/ends
5. **Accommodation suggestions**: For each stage endpoint, Komoot suggests nearby accommodations — hotels, guesthouses, camping, RV parks
6. **Select accommodation**: Choosing an accommodation adjusts the endpoint of that day's tour and automatically adjusts the next day's start point
7. **Review each stage**: Each stage gets its own difficulty rating, elevation profile, and estimated time
8. **Edit individual stages**: Stages can be edited independently — reroute, add waypoints, etc.
9. **Navigate stage by stage**: During the trip, navigate one stage at a time with full turn-by-turn

**Sailing translation:** The auto-split + accommodation suggestion pattern maps directly to "split a passage into day sails + suggest anchorages/marinas at each stopping point."

#### How Highlights (Community POIs) Work

**Submission:**
- Users can ONLY create Highlights in places where they've actually been (must have a recorded tour through that area)
- Process: Profile > Completed Tours > Select Tour > Edit > Create Highlight
- Users set the location, name, sport type, and can upload photos and add a text tip
- Option to create "segment Highlights" (a stretch of route, not just a point)

**Curation:**
- Each Highlight is a **composite** of tips and photos from many users — not a single person's entry
- If the same Highlight is created multiple times, duplicates are **automatically merged** into the oldest one
- Highlights with a high proportion of negative ratings are **automatically hidden** from the map
- The threshold: if most people who visited it did NOT recommend it, it gets removed
- Users can suggest edits to existing Highlights

**Display:**
- Shown on the map with sport-specific icons
- Visible during route planning to help users discover interesting spots
- Different from POIs (Points of Interest) which are more utilitarian (food, water, shelter)
- Highlights are inspirational/community-driven; POIs are factual/infrastructure

**Sailing translation:** This "verified visit + community aggregation + auto-curation" model is exactly what we need for anchorages, passages, and harbors. The requirement that you must have actually been there prevents armchair reviewing.

#### How the Difficulty/Rating System Works

**Three overall levels**: Easy (blue), Moderate (red), Hard (black)

**Calculated from three factors combined:**
1. **Fitness level required** — Based on duration and elevation gain (Easy: up to 2 hours, 1,000 ft elevation; Moderate: up to 6 hours, 1,500 ft; Hard: 6+ hours or 3,000+ ft)
2. **Technical difficulty** — Surface type, trail grade
3. **Sport type** — Different scales for different activities

**Sport-specific scales:**
- Mountain biking: S0 (easy) through S5 (extreme) singletrack scale
- Hiking: SAC T1 (walking) through T6 (alpine) scale

**Route characteristics displayed:**
- Way types: path, cycleway, street, highway, trail, singletrack, road
- Surface types: sand, asphalt, cobblestones, gravel
- Shown as percentage breakdown along the route

**Sailing translation:** We need a multi-factor difficulty system too — combining passage distance, typical sea state, exposure level, tidal complexity, and navigation difficulty. The "show what the route is made of" concept maps to "open water vs. coastal vs. channel vs. harbor approach."

#### How Offline Navigation Works

- Users pre-download region maps before going offline
- Full offline turn-by-turn navigation available
- **Critical limitation**: No offline rerouting — if you deviate from the planned route without connectivity, Komoot cannot recalculate
- Voice navigation continues to work offline
- Maps are region-based downloads (one free region on signup)

**Sailing translation:** Offline is non-negotiable for us too. Their limitation (no offline rerouting) is something we should aim to solve since sailors routinely lose connectivity.

#### How Route Sharing and Social Features Work

- Share routes via direct links (recipients don't need Komoot accounts)
- GPX export for device-agnostic sharing
- Comment on and like other users' completed activities
- Follow other users to see their activity feed
- Completed tours auto-generate shareable activity records with stats and photos
- Integration with Strava for cross-posting
- "Collections" — curated groups of routes around a theme/area

#### What Makes Their UX So Good

1. **Map-centric design** — Maximum screen space for the map; minimal UI clutter
2. **Task-oriented interface** — Only shows relevant controls for your current action (planning vs. navigating vs. reviewing)
3. **Familiar patterns** — Leverages Google Maps conventions so users feel at home instantly
4. **Progressive disclosure** — Simple for beginners, powerful features available but not overwhelming
5. **Approachable, not competitive** — Unlike Strava, Komoot feels encouraging for casual users, not just athletes
6. **Consistent design system** — Predictable visual and interaction patterns reduce cognitive load
7. **Rich route preview** — Before committing, you see difficulty, surface breakdown, elevation profile, time estimate, and Highlights along the route

#### GPX Export to Devices

- Routes and completed activities exportable as GPX from web or app
- **GPX export requires a paid subscription** (not available on free tier)
- Direct sync integrations: Garmin, Wahoo, Sigma, Suunto, Apple Watch
- For Garmin: routes sync directly via Komoot's Connect IQ integration
- Import supports GPX, KML, FIT files

#### Open Source Components & API

- **No public API** — Komoot only integrates with selected device manufacturers (deliberate strategy to control the ecosystem)
- **Photon Geocoder** — Open source geocoder for OpenStreetMap data (github.com/komoot/photon). Uses Elasticsearch/OpenSearch. Accessible at photon.komoot.io
- **13 public repositories** on GitHub
- **OAuth2 example** available for authentication
- Several unofficial community wrappers exist (Python: `kompy`, `komPYoot`)

**Note:** Photon geocoder could be useful for our own geocoding needs.

---

### RideWithGPS — Deep Dive

**Website:** https://ridewithgps.com/
**Pricing:**

| Tier | Monthly | Annual |
|------|---------|--------|
| **Starter** (Free) | $0 | $0 |
| **Basic** | $7.99/mo | $5.00/mo ($60/yr) |
| **Premium** | $9.99/mo | $6.67/mo ($80/yr) |

**Starter**: Route exploration, ride recording, basic planning, device sync
**Basic**: + Voice navigation, offline maps, live logging, heatmaps
**Premium**: + Full planning tools, all heatmaps, custom cues, ride analysis, custom map printing, privacy zones, private segments

**Club accounts**: Separate pricing (not publicly listed), includes member benefits

**Philosophy:** "Fundamentally about creating and sharing GPS routes, not competing or analysing performances"

#### Route Builder UX Details

**Starting a route:**
- Click anywhere on map to place a start point, or search an address
- Choose routing mode: Cycling, Walking, or Driving (each optimizes differently)
- Cycling mode prioritizes safety, using multi-use and bike paths

**Building the route:**
- Click to add waypoints; route auto-calculates between them following roads/paths
- **Trace tool**: Import a GPS file and trace over it to create a new route (great for converting recorded rides to plannable routes)
- **Split Route tool**: Take a long route and split into smaller segments (multi-day planning)
- **Multiple routes open simultaneously**: Work with several routes at once, duplicate to make tweaks
- Drag-and-drop GPX/FIT/TCX/KML/KMZ files directly onto the map to import

**Map layers:**
- Satellite, Topo, and OSM map styles
- **Heatmaps** (7-day, 30-day, all-time): Show where cyclists actually ride — invaluable for finding good routes
- Global and personal heatmap overlays

**Editing:**
- Move waypoints by dragging
- Insert intermediate waypoints
- Undo/redo support
- Edit cues inline

**Sailing translations:**
- The "multiple routes open" concept is excellent for comparing passage options
- The heatmap concept (showing where people actually sail) would be incredibly valuable
- The Trace tool maps to "convert a recorded passage to a shareable route"

#### How Cue Sheets Work

**Auto-generation:**
- Every route planned in the Route Planner automatically generates a cue sheet
- Cues are turn-by-turn directions extracted from the route geometry and underlying road data

**Display:**
- On web: Cue sheet panel on left side of route page
- In mobile app: Slide up on metric display, tap "Cuesheet" button
- Spoken aloud during Voice Navigation in the mobile app

**Editing:**
- Click any cue in the sheet or its icon on the map to edit
- Add custom notes (spoken during voice nav)
- Change cue type or description
- Delete irrelevant cues
- **Custom Cues**: Drop custom instruction points anywhere along the route (e.g., "Water stop here" or "Dangerous intersection")

**Cue Review Tool:** Dedicated tool to review and validate cue accuracy before riding

**PDF Export:** Printable PDF maps and cue sheets (Premium/Basic feature). Useful for group rides where not everyone has the app.

**Sailing translation:** The cue sheet concept maps to "passage notes" — automatically generated waypoint-by-waypoint guidance with custom annotations. "Custom cues" are like passage notes (e.g., "Watch for ferry traffic" or "Tide gate — check timing"). PDF export for crew briefing sheets is a great idea.

#### Club/Team Features (Analogous to Crew)

**Club Account:**
- Central account managed by multiple administrators
- **Route Library**: Central location to organize and share routes to members
- Route tagging system for organization
- Route-level visibility controls (who can see what)
- **Club Upload Page**: Bulk import route files directly to library
- Members get access to premium features (offline maps, in-app navigation) on club-hosted routes — even without personal subscriptions

**Member Benefits:**
- Voice navigation and offline maps on club routes
- Advanced turn notifications on TCX files for Garmin
- PDF maps and cue sheets for club routes
- Members don't need their own paid subscription for club route features

**Sailing translation:** The "club members get premium features on club routes" model is brilliant for crew management. A skipper could create a "crew" and share passage plans where crew members get full navigation features without individual subscriptions.

#### Route Sharing

- **Direct links**: Share any route via URL
- **Embed on websites**: Routes can be embedded on external sites
- **Export formats**: GPX Track, TCX Course, TCX History, FIT Course, CSV, KML
- **Privacy controls**: Public, unlisted, or private routes

#### API & Developer Tools

**Official API (v1):**
- JSON-based REST API
- Authentication: OAuth (preferred) or Basic Auth with API key
- Access via email request to info@ridewithgps.com
- **Endpoints**: Authentication Tokens, Collections, Events, Routes, Sync, Trips, Users, Club Members, Points of Interest
- Pagination: 20-200 results per page
- **Webhooks**: Configurable notifications when users create/update assets
- Developer contact: developers@ridewithgps.com
- GitHub: github.com/ridewithgps/developers

**Sailing translation:** Having a proper API from day one would differentiate us. Webhooks for crew notifications ("skipper updated the passage plan") would be valuable.

---

### Translatable Feature Patterns — Cycling to Sailing

| Cycling Feature | Sailing Translation |
|---|---|
| Surface type intelligence | Seabed type, depth, exposure info |
| Elevation profiles | Wind/wave condition profiles along route |
| Turn-by-turn cues | Waypoint-by-waypoint passage notes |
| Difficulty grading | Passage difficulty rating (wind, seas, distance, hazards) |
| Highlights (POIs) | Anchorage highlights, scenic stops, provisioning points |
| Photo stories | Logbook entries with photos at waypoints |
| Offline navigation | Offline charts + pre-downloaded weather |
| Multi-day tours | Multi-day passage planning with overnight stops |
| Community routes | Community-shared sailing itineraries |
| GPX export to bike computer | GPX export to chartplotter |
| Activity type routing | Vessel type routing (cruiser vs racer vs catamaran) |
| Crowd-sourced trail conditions | Crowd-sourced anchorage/harbour conditions |
| Heatmaps | "Where sailors actually go" overlay |
| Cue sheets | Passage notes with auto-generated waypoint guidance + custom annotations |
| Club route library | Crew passage plan library with shared access |
| Club members get premium on club routes | Crew members get full nav on skipper's shared plans |
| Route characteristics breakdown | Passage composition: open water % + coastal % + channel % + harbor approach % |
| API + Webhooks | Developer API from day one; webhooks for crew notifications |
| Trace tool | Convert a recorded passage to a shareable route |
| Split Route tool | Split long passage into daily legs |
| Multiple routes open | Compare passage options side by side |

---

## 5. Open Source Navigation Tools

### OpenCPN — The Main Open Source Chartplotter

**GitHub:** https://github.com/OpenCPN/OpenCPN
**Stars:** 1,360 | **Forks:** 581 | **Open Issues:** 302 | **Contributors:** 30 (top)
**Language:** C/C++ with wxWidgets | **License:** GPL
**Last commit:** Active (commits within last 48 hours as of March 2026)

**Strengths:**
- Full-featured chartplotter that thousands of sailors actually use as their primary navigation tool
- Supports BSB raster and S-57 vector ENC display
- AIS decoding built in
- Waypoint autopilot navigation
- 45+ plugins including weather routing, dashboard, radar, etc.
- Cross-platform: Windows, macOS, Linux, Android
- OpenGL acceleration for responsive chart rendering
- GPX import/export
- No internet required for navigation
- Active development since 2009 — proven longevity

**Weaknesses:**
- **Monolithic architecture is the critical weakness.** A GitHub issue (#2354) explicitly calls this out — NMEA multiplexing, chart canvas, control interface, chart downloading, plugin updates, and udev rules are all one process
- wxWidgets UI looks and feels like a 2005 desktop application — drives away newcomers
- Touch interface is poor — designed for mouse/keyboard
- No web version — desktop only
- No mobile-first experience
- Plugin quality varies wildly — some are excellent, some abandoned
- Documentation is scattered across wikis, manuals, and forum posts
- Requires technical setup and configuration
- Charts still need purchasing for many regions
- Steep learning curve for new users
- Build system is complex
- No social features

**Architecture assessment:**
OpenCPN's C++ / wxWidgets choice was smart in 2009 for performance and portability. But it's now a liability for modern development. The monolithic design means you can't easily:
- Run the chart renderer in a browser
- Separate data processing from UI
- Build mobile-first interfaces
- Contribute without understanding the entire codebase

**Plugin ecosystem worth noting:**
- **Weather Routing Plugin** — implements isochrone method with GRIB data and boat polars. Uses Grib Plugin and Climatology Plugin. Genuinely useful.
- **Dashboard Plugin** — instrument displays
- **Radar Plugin** — various radar integrations
- **Satellite Plugin** — weather satellite imagery

**What Above Deck can learn:**
- The weather routing plugin's isochrone implementation is well-tested and could inform our approach
- Chart rendering of S-57 data — the parsing and display logic is valuable reference code
- Plugin architecture patterns (what works, what doesn't)
- Don't build a monolith
- Don't port OpenCPN code directly — the C++ / wxWidgets paradigm is wrong for a web app
- Don't try to replicate everything — focus on what the web can do better

---

### OpenPlotter / OpenMarine — Raspberry Pi Marine Platform

**GitHub:** https://github.com/openplotter
**Website:** https://openmarine.net/openplotter
**Creator:** Sailoog (Països Catalans)
**License:** CC BY-SA 4.0 (content), GPL (code)
**Platform:** Raspberry Pi 4/5, Debian 12 Bookworm
**Current Version:** OpenPlotter 4.x.x

OpenPlotter is a complete Linux distribution for Raspberry Pi that turns a cheap SBC into a full marine electronics hub. It's the most complete open-source marine platform — the closest direct competitor to what Above Deck aims to be. Run by the OpenMarine initiative, which also produces the MacArthur HAT hardware and runs a shop + community forum.

**The OpenMarine ecosystem has four components:**
1. **OpenPlotter** — the software platform (Debian-based OS image)
2. **MacArthur HAT** — open-source hardware gateway (~$80) with NMEA 0183, NMEA 2000, Seatalk1, I2C, 1-Wire
3. **Shop** — sells hardware via Wegmatt (worldwide distribution)
4. **Forum** — community discussion at forum.openmarine.net

**Bundled software stack:**

| Component | What It Does | Tech Stack |
|-----------|-------------|------------|
| SignalK Server | Central data hub, protocol translation, 270+ plugins, 60+ apps | Node.js / TypeScript |
| OpenCPN | Primary chartplotter at helm station | C++ / wxWidgets |
| AvNav | Web-based chart access for tablets/phones (remote cockpit) | Python + JavaScript |
| pypilot | Open-source autopilot with IMU heading/heel/trim | Python + Arduino |
| Node-RED | Visual automation/dashboard builder with SignalK nodes | Node.js |
| XyGrib | Weather GRIB file viewer | C++ / Qt |
| Maiana AIS | Open-source AIS transponder support | Hardware-dependent |
| SDR VHF | Software-defined radio VHF reception | Hardware-dependent |

**Protocol support:** NMEA 0183, NMEA 2000, Seatalk1, SignalK, MQTT, Telegram, LoRaWAN

**Sensor integration:** Temperature, pressure, humidity, voltage, current, luminance, tank level, RPM, door/entry sensors, IMU (heading/heel/trim), 1-Wire (DS18B20), I2C via STEMMA QT/Qwiic

**Installation options:**
- Pre-configured Raspberry Pi OS disk image (download and flash)
- Install on existing Debian-based Linux via "OpenPlotter À la Carte" tool
- Desktop/laptop compatible (not Pi-only)
- Headless operation with VNC/browser access

**MacArthur HAT v1.2 specifications:**

| Interface | Details |
|-----------|---------|
| NMEA 0183 | 2x opto-isolated inputs, 2x non-isolated outputs (UART3, UART5) |
| NMEA 2000 | 1x non-isolated input/output (SPI0-1), optional 120Ω termination |
| Seatalk1 | 1x non-isolated input (RPi 4 only currently) |
| 1-Wire | Connector for DS18B20 temperature sensors, 4.7KΩ pull-up included |
| I2C | STEMMA QT/Qwiic connector for multiple sensors |
| Power | 12V input, powers the Pi |

**Strengths:**
- **Most complete open-source marine platform** — genuinely replaces thousands of dollars of marine electronics with a ~$125 Raspberry Pi setup
- Community-driven with active forums, Discord, and plugin ecosystem
- Modular "À la Carte" architecture — add what you need, skip what you don't
- Node-RED integration is clever — visual automation for non-programmers (e.g., low battery → turn off non-essential loads)
- MacArthur HAT covers all three legacy marine protocols in one board
- 270+ SignalK plugins extend functionality without core changes
- pypilot is genuinely impressive — open-source autopilot from a Pi + IMU
- Headless operation means the Pi can hide in a locker, accessed via tablet browser
- "Internet of Boats" (IoB) concept for remote monitoring
- Proven in real-world use on hundreds of boats

**Weaknesses:**

| Weakness | Detail |
|----------|--------|
| **Frankenstein UX** | Stitches together OpenCPN (wxWidgets), AvNav (web), Node-RED (web), SignalK dashboard (web) — no coherent design language. Each tool looks and feels completely different |
| **Node.js everywhere** | SignalK server, all 270 plugins, Node-RED — memory-hungry on a Pi. Multiple Node processes competing for RAM |
| **No mobile-first design** | AvNav works in a browser but was designed for desktop. OpenCPN is desktop-only. Touch interfaces are poor |
| **Assembly required** | You install an OS image, then configure SignalK, add plugins, wire up Node-RED flows, set up OpenCPN charts. Significant technical expertise needed |
| **No standalone tools** | Nothing works without the full OpenPlotter stack running. Can't hand someone a URL to try a chartplotter |
| **No AI integration** | Data stays in dashboards and Node-RED flows. No cross-system reasoning or natural language queries |
| **No community platform** | Forum is about the software itself, not cruising knowledge. No anchorage reviews, equipment guides, or sailor community |
| **No Matter/Thread** | Stuck on MQTT for IoT sensors. No consumer sensor support |
| **Documentation is scattered** | Across readthedocs, forum posts, GitHub wikis, blog posts. Hard to find authoritative answers |
| **RPi hardware limitations** | Screen quality, waterproofing, reliability in marine environment are ongoing concerns. Price increases (Pi 5 8GB now $125) reduce the cost advantage |
| **Single developer risk** | Core platform maintained primarily by Sailoog. Bus factor of ~1 for the platform layer |

**What Above Deck can learn:**
- OpenPlotter proves there's a significant DIY sailing community willing to build their own systems — hundreds of boats run it
- The SignalK integration model is the right approach — decouple data from display
- Node-RED's visual automation is popular — consider whether Above Deck needs a similar "rules engine" for boat automation
- The MacArthur HAT's multi-protocol approach (0183 + N2K + Seatalk1 on one board) is the right hardware strategy
- "À la Carte" component selection is a good UX pattern — don't force all-or-nothing
- **The gap is clear:** OpenPlotter is "assemble your own boat computer from open-source parts." Above Deck should be "a designed, integrated marine platform that just works — and happens to be open source"
- A web-based chartplotter that speaks SignalK would immediately tap into this community and give OpenPlotter users a massive UX upgrade

---

### Signal K — The Open Marine Data Standard

**GitHub:** https://github.com/SignalK/signalk-server
**Stars:** 381 | **Forks:** 187 | **Open Issues:** 281 | **Contributors:** 30 (top)
**Language:** TypeScript/Node.js | **License:** Apache 2.0

**This is arguably the most important project in the open marine technology space.**

Signal K is a JSON-based data format and server for marine use. It's the "lingua franca" that connects NMEA 0183, NMEA 2000, Seatalk, and other proprietary marine protocols into a single, web-friendly data model.

**Architecture:**
- Node.js full-stack server
- Multiplexes data from NMEA 0183, NMEA 2000, and other protocols
- Provides REST API and WebSocket streams
- JSON data model — every piece of boat data has a standardised path (e.g., `environment.wind.speedApparent`)
- Plugin system for extending functionality
- Web-based admin interface
- HTTPS/WSS for secure connections

**2025/2026 developments:**
- **MCP Server integration** — Signal K now has an AI-powered data access layer via MCP (Model Context Protocol). Enables natural language queries against boat data ("What's the battery voltage?") and automatic switching between real-time and historical data sources
- Growing plugin ecosystem

**Why this matters for Above Deck:**
- Real-time instrument data (speed, heading, wind, depth, battery, temperature)
- Integration with thousands of existing OpenPlotter installations
- A standardised data model we don't have to invent
- WebSocket streams for live data display
- Build Signal K integration from day one
- Use Signal K's data model as our internal data schema where applicable

**Data model paths** (under `vessels.{mmsi-or-uuid}`):

| Branch | Example Paths | Data |
|--------|---------------|------|
| `navigation` | `position`, `courseOverGroundTrue`, `speedOverGround`, `headingTrue` | GPS, heading, SOG/COG, waypoints |
| `environment` | `wind.speedApparent`, `depth.belowTransducer`, `water.temperature` | Wind, depth, temp, pressure |
| `electrical` | `batteries.{id}.voltage`, `solar.{id}.panelPower` | Batteries, solar, chargers |
| `propulsion` | `{id}.revolutions`, `{id}.temperature`, `{id}.oilPressure` | Engine data |
| `tanks` | `fuel.{id}.currentLevel`, `freshWater.{id}.currentLevel` | Tank levels |
| `steering` | `rudderAngle`, `autopilot.state` | Rudder, autopilot |
| `notifications` | `mob`, `fire`, `flooding` | Alerts and alarms |

---

### Bareboat Necessities (BBN) OS — The Most Complete Open-Source Marine Platform

**GitHub:** https://github.com/bareboat-necessities/lysmarine_gen
**Website:** https://bareboat-necessities.github.io/my-bareboat/
**Documentation:** https://bareboat-necessities.github.io/my-bareboat/bareboat-os.html
**Creator:** mgrouch (primary), Frederic Guilbault (original creator)
**License:** GPLv3
**Platform:** Raspberry Pi 4/400/CM4/5, Debian Bookworm (64-bit)
**Latest Release:** 2025-05-18 (Stable, Bookworm arm64)
**GitHub Stats:** 311 stars, 73 forks, 4,242 commits, 101 releases, 10 open issues
**Languages:** Shell (52%), HTML (26%), CSS (12%), JavaScript (9%), Python (1%)
**Build:** CircleCI automated builds, Cloudsmith package distribution

BBN OS is the most ambitious open-source marine platform — explicitly born from "experiences of using OpenPlotter to improve user experience." It bundles 60+ applications across navigation, autopilot, weather, radio, surveillance, media, IoT, and data analytics into a single Raspberry Pi image. This is the closest existing project to Above Deck's vision.

**Core navigation stack:**

| Component | What It Does |
|-----------|-------------|
| SignalK Server + plugins | Central data hub, protocol translation |
| OpenCPN + plugins | Primary chartplotter (S-57, BSB, O-Charts) |
| AvNav | Web-based chart access for tablets/phones |
| Freeboard-SK | SignalK web dashboard |
| TukTuk | Web-based chartplotter alternative |
| pypilot | Open-source autopilot (brushed DC / hydraulic motor) |
| IMU integration | Heading, heel, trim, wave height calculation from accelerometer |

**Weather & routing:**

| Component | What It Does |
|-----------|-------------|
| XyGrib | GRIB weather file viewer |
| Weather Routing Plugin | Isochrone routing with boat polars |
| Climatology Plugin | Historical weather patterns |
| WeatherFax | SSB radio / internet weather fax reception |
| NOAA integration | Weather alerts via SignalK plugin |

**Marine radio & offshore communications (unique strength):**

| Component | What It Does |
|-----------|-------------|
| NavTex (JNX decoder) | Maritime safety information |
| WeatherFax (JWX decoder) | Weather map reception |
| NOAA satellite imagery (noaa-apt) | Satellite weather images via SDR |
| Inmarsat STD-C (stdcdec) | Safety messages |
| AIS (rtl_ais, AIS-Catcher, dAISy) | Vessel tracking — multiple decoder options |
| WinLink Pat | SSB email via amateur radio |
| SDR (GNU Radio, Gqrx, Cubic SDR) | Software-defined radio reception |
| Iridium modem | Satellite phone integration |

**Data analytics & IoT:**

| Component | What It Does |
|-----------|-------------|
| **InfluxDB** | Time-series data storage — battery trends, solar production over time |
| **Grafana** | Beautiful dashboards for historical data visualisation |
| **Mosquitto (MQTT)** | IoT message broker |
| **Node-RED** | Visual automation/rules engine |
| **Home Assistant** | Consumer IoT bridge — Zigbee, Z-Wave, WiFi devices |
| **EspHome** | ESP32/Arduino device management |
| **ModBus** | Industrial protocol support |

**Surveillance & cameras:**

| Component | What It Does |
|-----------|-------------|
| MotionEye | Multi-camera monitoring web interface (port 8765) |
| IP cameras (UPnP/RTSP) | Any network camera |
| RPi CSI cameras | Ribbon-connected Pi cameras |
| USB cameras | Webcam support |
| FLIR | Night vision / thermal imaging |

**Media & entertainment:**

| Component | What It Does |
|-----------|-------------|
| Mopidy + MusicBox/Iris | Music server with web UI |
| AirPlay (Shairport-Sync) | iPhone/Mac streaming |
| Spotify (Raspotify) | Spotify Connect |
| VLC | Media player / IP camera viewer |
| Chromium + Widevine | Netflix/Amazon Prime (arm32 only) |
| Local casting | Chromium to smart TVs |

**Protocol support:** NMEA 0183, NMEA 2000 (MCP2515 CAN), Seatalk, SignalK, MQTT, ModBus, CAN bus, AIS, DSC, I2C, 1-Wire, SPI

**Sensor integration:** GPS/GNSS, AIS (multiple decoders), IMU (ICM20948 — heading/heel/trim/wave height), barometer, temperature, humidity, wind, depth, speed, rudder feedback potentiometer, environmental I2C sensors, 1-Wire temperature chains

**Connectivity:** WiFi AP (dual-band 2.4/5GHz), WiFi client, Ethernet, USB tethering (Android/iPhone), Starlink, LTE/4G via OpenWrt, SSH, VNC (RealVNC with cloud), NoMachine remote desktop, headless browser access

**Installation:** Download SD card image (~3GB full, ~1.5GB lite) → flash via Raspberry Pi Imager → boot to GUI in ~2 minutes → change default password

**Vessel modes:** Programmable operational modes (Dock Away, Under Way, Anchor Aboard) — system-wide configuration presets

**How it differs from OpenPlotter:**

| Aspect | OpenPlotter | BBN OS |
|--------|------------|--------|
| Origin | Built from scratch by Sailoog | Forked from OpenPlotter experience, improved UX |
| Data analytics | None built-in | Grafana + InfluxDB — historical trends |
| Home automation | None | Home Assistant + EspHome |
| Radio/offshore | Basic AIS | Full SDR suite, NavTex, WeatherFax, satellite, WinLink |
| Media | None | Full media stack (Mopidy, AirPlay, Spotify, Netflix) |
| Camera/surveillance | None | MotionEye + multi-camera support |
| Touchscreen | Limited | Better touch support, cockpit GUI |
| Desktop environment | LXQt (OpenPlotter 4) | Budgie desktop |
| Power monitoring | Via SignalK plugins | Built-in Victron + Grafana integration |
| Community | Larger, active forum | Smaller, Raspberry Pi Forums thread |
| Hardware | MacArthur HAT (custom) | Bring-your-own (PICAN-M, SH-RPi, etc.) |
| Documentation | Readthedocs | Comprehensive single-page doc + Wix site |
| Maintainer risk | Sailoog (bus factor ~1) | mgrouch (bus factor ~1) |

**Strengths:**
- **Most feature-complete open-source marine OS** — genuinely covers navigation, autopilot, weather, radio, cameras, media, IoT, and analytics in one image
- **Offshore-capable** — SDR radio, WeatherFax, WinLink, NavTex, satellite comms. This is bluewater cruiser kit
- **Grafana dashboards** are the best-looking part — proves sailors want historical data visualisation
- **Home Assistant validates IoT-on-boats** — Zigbee sensors, WiFi devices alongside NMEA instruments
- **"Cockpit front-end"** concept — unified touchscreen interface with web launcher
- **Customisable launcher** — JavaScript-based desktop (`/var/www/bbn-launcher/constants.js`)
- **First-boot customisation** via `/boot/first-boot.sh` — good for fleet deployment
- Active releases through 2025, Bookworm-based, 64-bit
- **Cost comparison included** in docs — explicitly positions against $5K+ commercial marine electronics

**Weaknesses:**

| Weakness | Detail |
|----------|--------|
| **Still a Frankenstein** | 60+ bundled apps, each with its own UI paradigm. OpenCPN looks nothing like Grafana looks nothing like MotionEye looks nothing like Node-RED |
| **Maintainer-dependent** | 4,242 commits primarily from 2 people. mgrouch is the sole active maintainer. Bus factor of 1 |
| **Not mobile-first** | Designed for a connected touchscreen, not a phone PWA. No standalone mobile story |
| **No AI** | Rich data in InfluxDB/SignalK but no cross-system reasoning or natural language queries |
| **No community platform** | No anchorage reviews, equipment guides, or cruiser community features |
| **No standalone tools** | Everything requires the full BBN OS stack running on a Pi |
| **Resource-heavy** | 60+ applications on a Pi compete for RAM/CPU. Home Assistant alone is significant |
| **Desktop paradigm** | Budgie desktop + taskbar + window management. This is "Linux on a boat," not a purpose-built marine interface |
| **No Matter/Thread** | IoT via Home Assistant + MQTT, not standardised protocols |
| **Documentation quality** | Comprehensive but dense. Single massive page. Hard to find specific answers |
| **Widevine DRM** only on arm32 — streaming services limited on modern 64-bit images |

**What Above Deck can learn:**

1. **Grafana + InfluxDB is a validated pattern** — sailors want historical data trends (battery over a passage, solar production patterns, engine hours). Above Deck needs time-series storage and trend visualisation
2. **Home Assistant validates IoT-on-boats** — BBN already bridges consumer IoT to marine systems. Matter integration does this better (standardised, no HA dependency)
3. **Offshore radio features are a real need** — WeatherFax, NavTex, WinLink. These are things bluewater cruisers actually need. Consider whether Above Deck should address this layer
4. **The cockpit launcher is the right concept** — a unified entry point to all tools. Above Deck's MFD device frame is the better execution of this idea
5. **Vessel modes are smart** — "Dock Away" / "Under Way" / "Anchor Aboard" that configure the whole system. Above Deck should have similar automation profiles
6. **Camera/surveillance is expected** — sailors want to check the engine room, anchor, and cockpit remotely. Consider camera integration
7. **Media is nice-to-have** — AirPlay/Spotify integration is a quality-of-life feature. Not core but appreciated
8. **The cost comparison argument resonates** — "replace $5K of marine electronics with a $125 Pi" is compelling marketing
9. **The fundamental gap remains:** BBN OS is "Linux on a boat with 60 apps installed." Above Deck should be "a designed marine platform that replaces those 60 apps with one coherent experience"

---

### d3kOS — AI-Powered Marine Helm System

**GitHub:** https://github.com/SkipperDon/d3kOS
**Creator:** SkipperDon
**Version:** 2.0-T3 (pre-release, Feb 2026)
**GitHub Stats:** 2 stars, 403 commits
**Platform:** Raspberry Pi 4B (8GB recommended) + 10.1" 1920x1200 touchscreen (1000 nit)
**Estimated Cost:** ~$470 for core hardware

d3kOS is the most conceptually ambitious open-source marine project — an AI-powered, voice-first helm control system. It's the closest to Above Deck's AI-native vision, though with very different implementation choices.

**Core stack:**
- SignalK Server (data hub)
- Node-RED 3.x + Dashboard 2.0 (UI and automation)
- OpenCPN 5.8.x (chartplotter)
- **Vosk 0.15** (offline speech-to-text, wake word "Helm")
- **Piper TTS** (text-to-speech responses)
- GPSd (GPS processing)
- Chromium (browser interface)

**What makes it unique:**
- **Voice-first interface:** "Helm, what's the engine status?" — hands-free control via natural language, works 100% offline
- **AI anomaly detection:** >95% accuracy for real-time engine health analysis from sensor data
- **Touch-optimised for marine:** Large buttons, on-screen keyboard designed for wet hands and rough seas
- **100% offline operation** for all core features

**Pricing model:** Tiered — Free (Tier 0), App-based upgrade (Tier 2), Subscription (Tier 3). This semi-commercial approach differs from the fully open-source ethos of OpenPlotter and BBN OS.

**Strengths:**
- Voice control is genuinely innovative for marine — hands-free is important when sailing
- Offline AI/voice (Vosk + Piper) proves it's possible without cloud dependency
- AI anomaly detection on engine data is a compelling use case
- Opinionated UX — designed for one purpose (helm station), not trying to be everything

**Weaknesses:**
- Pre-release, 2 GitHub stars — extremely early. Not production-ready
- Single developer project with no community
- Node-RED Dashboard 2.0 for UI — still a "builder tool" interface, not a designed product
- Subscription tiers for an open-source project may limit adoption
- Voice accuracy in noisy marine environments (wind, engine, waves) is unproven

**What Above Deck can learn:**
- **Voice control is worth exploring** — hands-free "Hey boat, what's my battery level?" is a real UX advantage while sailing. Could be an MCP integration (AI already understands natural language queries)
- **Offline voice AI is feasible** — Vosk + Piper run on a Pi 4. This could be an optional Above Deck feature
- **AI anomaly detection validates the vision** — Above Deck's MCP/AI-native approach is the right direction. d3kOS proves one developer can build useful marine AI
- **The subscription model is a cautionary tale** — Above Deck's GPL/no-commercial commitment is a competitive advantage in a community that values openness

---

### YachtOS

> **Added (2026-03-27)**

**Website:** https://yachtos.org/ (if available)
**Platform:** Raspberry Pi / embedded Linux

YachtOS is an emerging open-source marine operating system project. Like Above Deck, it aims to provide a modern software platform for boat computers. Worth monitoring as a potential competitor or collaboration partner in the open-source marine space.

---

### BBN OS Community Insights

From the [Bareboat Necessities GitHub Discussions](https://github.com/orgs/bareboat-necessities/discussions), key themes that inform Above Deck:

**What the community is building/requesting:**
- NMEA 2000 compass with IMU sensors (heading is a perennial pain point)
- ESP32-based MFDs (community wants cheap, purpose-built displays)
- WiFi-based vessel detection alarms (security when away from boat)
- Hydrophone integration (underwater sound — creative use case)
- Waterproof enclosure recommendations (reliability is a constant concern)
- Power solutions for Raspberry Pi 5 (12V→5V conversion, clean shutdown)

**Pain points visible in discussions:**
- SignalK autopilot version compatibility issues
- Home Assistant Python deprecation breaking things
- OpenCPN freezing on touchscreen
- HAT compatibility across Pi versions (MacArthur, SH-RPi v2)

**Sentiment:** Collaborative and helpful, but many questions go unanswered — knowledge gaps in niche areas. The community is technically competent but small.

**Takeaway for Above Deck:** These are your early adopters. They're already building what you're designing, but with duct tape. A polished platform that "just works" would be enthusiastically adopted by this community.

---

### Other Open Source Marine Tools

| Project | What It Does | Notes |
|---------|-------------|-------|
| **AvNav** (open-boat-projects.org) | NMEA multiplexer and WiFi gateway, web-based chart plotter | Less polished than OpenCPN but web-native approach is interesting |
| **FreeBoard** | Web-based marine instrument display | Open source, appears less actively maintained |
| **CANBoat** (github.com/canboat/canboat) | NMEA 2000 PGN decoder | Essential tooling for understanding N2K data, not an end-user tool |
| **SensESP** (HatLabs) | ESP32 sensor framework for SignalK — turns any sensor into a marine data source over WiFi | Very active. Supports temp, pressure, flow, tank level |
| **esp32-nmea2000** (wellenvogel) | ESP32 NMEA 2000 ↔ WiFi gateway | Active, well-documented. Runs on M5 Atom CAN (~$15) |
| **open-boat-projects.org** | Hub aggregating open source marine projects | German-led community, active, good hardware guides |
| **KBox** | NMEA 2000/0183 gateway + WiFi + sensors in one device | Integrated hardware solution |
| **Sailor Hat (SH-RPi)** | ESP32-based marine HAT with CAN, opto-coupled I/O, I2C, 1-Wire, Qwiic | Alternative to MacArthur HAT |

---

### Open-Source Competitor Summary

| Platform | UX Quality | Mobile-First | AI | Standalone Tools | Community Platform | Setup Difficulty |
|----------|-----------|-------------|-----|-----------------|-------------------|-----------------|
| **OpenPlotter** | Poor (Frankenstein) | No | No | No | No (software forum only) | High |
| **BBN OS** | Fair (Grafana helps) | No | No | No | No | High |
| **OpenCPN** | Poor (wxWidgets) | No | No | N/A (desktop app) | No | Medium |
| **Above Deck** | High (designed, unified) | Yes (PWA) | Yes (MCP) | Yes (each tool standalone) | Yes (cruiser community) | Low (Docker) |

---

## 6. Other Tools & Platforms

### 45 Degrees Sailing

**Website:** https://www.45degreessailing.com/

A sailing charter company operating on the Adriatic (Croatia) that offers personalised itinerary planning as a service. Customers choose yacht size/type and cruising area, then 45 Degrees tailors the route via discovery calls. Business model: Charter service with itinerary planning as value-add, not a standalone software product.

**What Above Deck can learn:** There's demand for curated itinerary planning, currently met by expensive human services. This is exactly the kind of service that software + community knowledge could replace.

---

### Base44 Platform

**Website:** https://base44.com/

An AI-powered no-code app builder. Relevant as a rapid prototyping tool, but generated apps tend to be simple CRUD applications. Complex real-time marine data integration, offline support, and chart rendering would exceed the platform's capabilities.

---

## 7. Competitive Positioning Matrix

### Summary Table — Feature Comparison

| App | Navigation | Weather Routing | Social/Community | Itinerary Planning | Offline | Price/yr |
|---|---|---|---|---|---|---|
| Savvy Navvy | Strong | Yes (Elite) | None | No | Partial | $80-189 |
| PredictWind | Basic chart | Best-in-class | None | No | Partial | $29-499 |
| Navionics | Strong | No | ActiveCaptain | No | Yes | $40-100 |
| Orca | Strong | Good | None | No | Yes | Free-EUR 148 |
| Navily | Weak | No | Best-in-class | Basic (Premium) | Premium | Free/Premium |
| OpenCPN | Strong | Plugin | None | No | Yes | Free |
| SailGrib | Strong | Yes | None | No | Yes | EUR 46 |
| TZ iBoat | Strong | Yes (AI) | None | No | Yes | $20-3,000 |
| FastSeas | N/A | Good | None | No | No | Free |
| SEAiq | Strong (BYO charts) | No | None | No | Yes | $10-250 |
| Ditch | Strong (AI) | No | None | No | Yes | Freemium |
| Argo | Basic | No | Good | No | Partial | Free |
| SailTies | Basic | No | Moderate | Yes (collaborative) | No | ? |
| SeaPeople | None | No | Best-in-class | No | No | Free/Premium |
| Windy.app | Basic (beta) | Basic | None | No | No | ? |
| Wavve | Good | No | Moderate (Waze-like) | No | ? | ? |

### Summary Table — Commercial Tool Capabilities

| Tool | Best For | Price/yr | Chart Quality | Weather Routing | UI/UX | Offline |
|------|----------|----------|--------------|----------------|-------|---------|
| Savvy Navvy | Casual boaters | $99-189 | Good | Basic | Great | Partial |
| Navionics | Fishing/depth | $50 | Excellent | No | Dated | Yes |
| PredictWind | Offshore routing | $29-499 | Basic | Excellent | OK | Partial |
| Orca | Modern sailing | ~$125 | Good | Good | Best | Yes |
| FastSeas | Budget routing | Free | N/A | Good | Clean | No |
| iSailor | Chart accuracy | Varies | Excellent | No | Clean | Yes |
| TimeZero | Power users | $20-3000 | Excellent | Good | Complex | Yes |
| SEAiq | Professionals | $10-250 | BYO | No | Functional | Yes |

### The "Top-Right Quadrant" Analysis

The competitive landscape reveals that no single product occupies the **top-right quadrant** of the matrix where community/social features AND navigation/planning sophistication are both strong:

- **Top-left (Strong community, weak navigation):** Navily, SeaPeople, Argo
- **Bottom-right (Strong navigation, weak community):** Savvy Navvy, PredictWind, Orca, SailGrib, TimeZero, Navionics
- **Bottom-left (Weak in both):** SailTies (good concept, limited execution)
- **Top-right (Strong in both):** NOBODY

**Above Deck's target position is the top-right quadrant** — combining community-shared knowledge with capable navigation and planning tools.

---

## 8. Market Gaps

Ten market gaps identified across all research:

### Gap 1: No "Komoot for Sailing" Exists
No app combines beautiful route planning, community-shared itineraries, photo storytelling, and offline navigation in a sailing context. The closest is Navily (community) + Savvy Navvy (routing), but they are separate apps with no integration. The Komoot model — multi-day stage planning + community Highlights + difficulty ratings — hasn't been applied to sailing.

### Gap 2: Itinerary Planning (Multi-Day) is Underserved
Most apps focus on single-passage routing (A to B). Planning a week-long cruise with multiple stops, considering weather windows across days, provisioning stops, and overnight anchorage quality is done manually or via expensive human services (like 45 Degrees Sailing).

### Gap 3: Social + Navigation is Split
Navigation apps (Savvy Navvy, Navionics, Orca) have no meaningful social features. Social apps (Navily, Argo, SeaPeople) have limited or no navigation. Nobody combines both well. This is the "top-right quadrant" gap.

### Gap 4: Crew Collaboration is Almost Non-Existent
Only SailTies attempts collaborative itinerary viewing. SeaPeople has groups, RideWithGPS has clubs, but nobody lets a skipper plan a route and share it with crew members who can see ETAs, waypoint notes, provisioning lists, watch schedules, etc. The RideWithGPS club model (crew members get premium features on shared plans) hasn't been applied to sailing.

### Gap 5: ~~Charter Sailor Market is Ignored by Tech~~
> **Update (2026-03-27):** Above Deck's target users are **coastal cruisers and bluewater sailors** who own or live aboard their boats, NOT charter tourists. Charter sailors are a secondary audience. The real gap is serving boat owners who need integrated boat management, passage planning, and community — not one-week holiday planners.

Coastal cruisers and bluewater sailors need: intelligent passage planning with tidal gates, weather routing, community-shared local knowledge (hazards, best approach angles, anchoring tips), and integration with their onboard instruments via Signal K.

### Gap 6: Logbook + Route Integration
No app seamlessly captures the journey (logbook) and connects it back to the planned route for post-trip review or sharing. Cycling apps (Strava, Komoot) do this brilliantly; sailing has nothing equivalent.

### Gap 7: Cross-Plotter Universality
Every chartplotter brand has its own app ecosystem. A brand-agnostic planning tool that exports cleanly to any plotter via GPX (with proper waypoint naming, notes, and route metadata) would serve the large segment of sailors who plan on tablets/phones but navigate on hardware. **GPX remains the only truly universal bridge.**

### Gap 8: AI-Driven Passage Intelligence
PredictWind has weather AI. Ditch has AIS-pattern AI. But nobody combines: historical weather patterns for a region/season, community reports on anchorage conditions, vessel-specific performance data, and real-time weather forecasting into a single "When should I leave, which route should I take, and where should I stop?" recommendation engine.

### Gap 9: ~~Affordable Pricing~~
> **Update (2026-03-27):** Above Deck is **free and open-source, no paid tiers, ever.** This is a settled decision. The project is community-funded, not commercially monetised. Every feature is available to every user. This is the ultimate competitive advantage against every commercial product listed above.

The market has bifurcated into free (limited) and expensive ($80-150/yr). Above Deck sits outside this entirely: fully free, fully open-source, no paid tiers, no paywalls, no subscriptions.

### Gap 10: Modern UX + Open Source Web Chartplotter
Most marine apps look like they were designed in 2010. Savvy Navvy is the exception (for casual use), Orca for navigation. **No good open-source web-based chartplotter exists.** OpenCPN is desktop C++. AvNav is web-accessible but basic. Nothing has the UI quality of Orca with the openness of OpenCPN. There is a clear opportunity for a modern, mobile-first experience that feels more like Komoot than a traditional chartplotter.

### Additional Strategic Gaps (from chartplotter research)
- **ActiveCaptain-style community data is locked in Garmin's ecosystem.** The community is unhappy. An open alternative with community-owned data would have immediate appeal.
- **Weather routing is either expensive (PredictWind $249/yr) or basic (FastSeas/GFS only).** A free, multi-model weather routing tool with a decent UI would be genuinely disruptive.
- **No tool does the full loop well:** chart display + passage planning + weather routing + community data + instrument integration. Users currently need 3-4 apps.
- **AI-assisted navigation is mostly vapourware.** The tools that claim AI features are doing basic automation, not genuine intelligence. There's room to do this properly.
- **Community-verified anchorage data is fragmented** — ActiveCaptain (Garmin), Noonsite, Navily, and SeaPeople all have bits of this, but none use Komoot's "you must have been there" verification model.

---

## 9. Features to Steal/Adapt

| Source | Feature | Sailing Adaptation |
|--------|---------|-------------------|
| Komoot | Multi-day stage planner | Multi-day passage planner with daily legs |
| Komoot | Highlights (community POIs) | Community-verified anchorages, hazards, marina reviews |
| Komoot | "Must have visited" requirement | Only users who logged a passage through an anchorage can review it |
| Komoot | Difficulty system | Passage difficulty: distance + sea state + exposure + tide + navigation complexity |
| Komoot | Route characteristics breakdown | Passage composition: open water % + coastal % + channel % + harbor approach % |
| Komoot | Map-centric / progressive disclosure UX | Minimal UI clutter, task-oriented interface, rich route preview |
| Komoot | Collections | Curated groups of routes around a theme/area |
| RideWithGPS | Cue sheets | Passage notes with auto-generated waypoint guidance + custom annotations |
| RideWithGPS | Club route library | Crew passage plan library with shared access |
| RideWithGPS | Club members get premium on club routes | Crew members get full nav on skipper's shared plans |
| RideWithGPS | Heatmaps | "Where sailors actually go" overlay |
| RideWithGPS | API + Webhooks | Developer API from day one; webhooks for crew notifications |
| RideWithGPS | Trace tool | Convert a recorded passage to a shareable route |
| RideWithGPS | Split Route tool | Split long passage into daily legs |
| RideWithGPS | Multiple routes open | Compare passage options side by side |
| RideWithGPS | PDF export | Crew briefing sheets |
| SeaPeople | Hails | "Who's in the anchorage" social discovery |
| SeaPeople | Live trip sharing to non-users | Share passage progress with family via web link |
| SeaPeople | Milestones/badges | Nautical mile milestones, passage achievements |
| FastSeas | Weather routing with polars | Integrate weather-optimized routing |
| FastSeas | Satellite communicator support | Passage updates via InReach for offshore |
| Orca | Polar-based sail routing | Weather-aware route suggestions |
| Orca | Real-time route recalculation | Dynamic re-routing as conditions change |
| Orca | Night light display | Dark mode optimised for night sailing |
| Ditch | AIS pattern learning | "Where boats actually go" intelligence |
| Wavve | Draft-aware trip sharing | Filter shared routes by vessel draft |
| Navily | Marina booking integration | In-app marina reservation |
| SEAiq | Load your own charts | Support arbitrary chart formats (S-57, S-63, BSB, KAP) |

---

## 10. Pricing Comparison & Strategy

### Current Market Pricing

| Product | Free Tier | Entry | Mid | Premium |
|---------|-----------|-------|-----|---------|
| Savvy Navvy | No (credit card required) | $80/yr | $145/yr | $189/yr |
| PredictWind | Yes (useless) | $29/yr | $249/yr | $499/yr |
| Navionics | No | $40/yr (USA) | $50/yr (US+CA) | $100/yr (worldwide) |
| Orca | Yes (app free) | EUR 49/yr (offline) | EUR 99/yr (smart nav) | EUR 148/yr (both) |
| Komoot | Yes (1 region) | EUR 59/yr | — | — |
| RideWithGPS | Yes | $60/yr | $80/yr | Club (unlisted) |
| FastSeas | Yes (5 req/month) | Donations | — | — |
| SailGrib | No | EUR 46/yr | — | — |
| SeaPeople | Yes | PLUS (unlisted) | PATRON (unlisted) | — |
| Navily | Yes | Premium (unlisted) | — | — |
| SEAiq | 7-day trial | $10 (USA) | $20 (Open) | $250 (Pilot) |
| TimeZero | No | $20/yr (mobile) | $500-800 (Navigator) | $3,000 (Professional) |
| iSailor | Free download | $4-19/chart pack | Features extra | Adds up fast |
| OpenCPN | Yes (fully free) | — | — | — |

### Pricing Observations

> **Update (2026-03-27):** Above Deck is **free and open-source, no paid tiers, ever.** The observations below describe the market context, not Above Deck's pricing strategy.

- Navionics' price gouging (233% increase since Garmin acquisition) is creating an opening for free alternatives
- The market has bifurcated into free (limited) and expensive ($80-150/yr) — Above Deck is fully free with no limitations
- iSailor's nickel-and-dime model frustrates users
- Savvy Navvy requiring a credit card to trial drives away potential users
- Above Deck's model: tools usable without an account; account required only for save/sync/personalise

---

## 11. What Would Make Sailors Switch?

Based on forum analysis and user complaints across tools:

1. **"It just works" on both iOS and Android** — Savvy Navvy's Android problems and Navionics' forced migrations have burned users
2. **Free or very cheap** — price increases are the #1 complaint across all paid tools
3. **Tides and currents included at every tier** — Savvy Navvy locking these behind premium is widely criticised
4. **Community data that stays open** — ActiveCaptain's Garmin acquisition left a bad taste
5. **Offline capability** — non-negotiable for sailors
6. **Beautiful, modern UI** — Orca has shown this matters. OpenCPN's wxWidgets look drives away newcomers
7. **Signal K integration** — the DIY sailing community is significant and underserved by commercial tools
8. **Honest, no-dark-patterns approach** — sailors are a sceptical, technically literate audience who despise being manipulated

---

## 12. Chart Plotter Integration

### GPX: The Universal Standard
- **GPX (GPS Exchange Format)** is the de facto standard accepted by all major marine chartplotters: Garmin, Raymarine, B&G, Simrad, Lowrance, Furuno
- Contains waypoints, routes, and tracks
- All major sailing apps support GPX export
- Import methods: SD card, USB, or wireless transfer depending on device

### Brand-Specific Integration

**Garmin:**
- ActiveCaptain app syncs wirelessly with Garmin chartplotters
- Navionics Plotter Sync for route/waypoint transfer
- GPX import via ActiveCaptain app or SD card

**Raymarine:**
- Orca has direct wireless integration with Raymarine Axiom (unique partnership)
- Navionics available on Lighthouse 3 and 4 plotters
- GPX import via SD card or WiFi transfer
- Lighthouse Apps ecosystem for third-party integration (PredictWind included)

**Furuno:**
- TZ iBoat syncs directly with TZtouchXL plotters
- Waypoints and routes auto-synchronise between app and hardware
- Proprietary integration (strongest app-to-plotter sync in market)

**B&G / Simrad / Lowrance (Navico):**
- B&G App for waypoint/route creation and sync
- GPX import via SD card
- C-MAP charts across the range

### Key Insight
No single app provides seamless integration across ALL major chartplotter brands. This is a fragmented market where each brand has its own ecosystem. **GPX remains the only truly universal bridge.** A brand-agnostic planning tool that exports cleanly to any plotter via GPX would serve a large underserved segment.

---

## 13. Marine Data APIs & Chart Sources

### Chart Data Sources (Free/Open)

| Source | Coverage | Format | Quality | Notes |
|--------|----------|--------|---------|-------|
| **NOAA ENCs** | US waters | S-57 | Official, gold standard | Free, no restrictions. WMTS tile service available |
| **OpenSeaMap** | Worldwide | OSM/tiles | Crowdsourced | Planning only, not safe for primary nav. Excellent in Europe, patchy elsewhere |
| **Brazilian Navy** | Brazil | S-57 | Official | Free download |
| **LINZ (NZ)** | New Zealand | S-57 | Official | Free download |
| **Argentina SHN** | Argentina | S-57 | Official | Free download |
| **Peru DHN** | Peru | S-57 | Official | Free download |
| **GEBCO** | Global bathymetry | NetCDF/GeoTIFF | Survey-grade | Deep water only |
| **UKHO/Admiralty** | Global | S-57/S-63 | Official | Mostly commercial licence. Some open data under OGL (bathymetry, wrecks, routeing, maritime limits) |

### S-57 / S-63 / S-100 Format Landscape

- **S-57:** Current standard for ENC exchange. Well-established, widely supported, showing its age
- **S-63:** Data protection (encryption) layer for ENCs. Required for official chart services
- **S-100:** Next generation standard. IHO adopted first operational specs January 2025. New ECDIS from January 2026 can conform. Full implementation target: 2029. Dual-mode (S-57 + S-100) required during transition
- **Strategy:** Build S-57 support now, plan for S-100 compatibility. Focus on free NOAA data first.

### Weather APIs

| API | Cost | Coverage | Data | Notes |
|---|---|---|---|---|
| **Open-Meteo** | Free (non-commercial) | Global | Wave, wind, SST, 7-day hourly marine forecast | No API key needed, CORS enabled. **Clear winner for our use case** |
| **Stormglass.io** | Free tier (10 req/day) | Global | Full marine suite: wave, currents, swell, wind, water temp, ice, visibility | Good secondary source |
| **NOAA CO-OPS** | Free | US coastal | Water levels, currents, meteorological, oceanographic | JSON/XML/CSV |
| **Tomorrow.io** | Free tier | Global | Wave height, direction, general marine weather | |
| **Xweather** | 30-day trial | Global | Wave/swell, tidal/surge, ocean currents, SST | Commercial |
| **Tidetech** | 30-day trial | Global | Combined ocean/tidal currents, weather, wind | Commercial |
| **OpenWeatherMap** | 1,000 calls/day | Global | Basic marine | Widely used, well documented |
| **Windy API** | Map widget free | Global | Wind, waves | Best visualisation |
| **WeatherAPI.com** | 1M calls/month | Global | Marine weather | Generous free tier |

### GRIB Weather Data Sources

| Source | Resolution | Range | Cost | Notes |
|--------|-----------|-------|------|-------|
| NOAA GFS | 0.25° | 16 days | Free | Baseline model everyone uses |
| ECMWF IFS | 0.1° | 15 days | Free (limited) | Generally more accurate than GFS |
| DWD ICON | 0.125° | 7 days | Free | Good for European waters |
| OpenSkiron/OpenWRF | High-res regional | 3-7 days | Free | Great for Mediterranean |
| Saildocs | Various | Various | Free (email) | Designed for satellite email retrieval |
| OpenGribs | 9 atmos + 3 wave | Various | Free | Aggregator — choose from multiple models |

**GRIB access tools:** ecmwf-opendata (Python), GribStream (API), LuckGrib (commercial/free download), Expedition (free GRIB within app)

### Tides & Currents APIs

| API | Cost | Coverage | Notes |
|---|---|---|---|
| **NOAA Tides & Currents** | Free | US coastal | Gold standard for US. REST (JSON, CSV, XML) |
| **ADMIRALTY (UKHO) UK Tidal API** | Free Discovery (10k req/mo) | UK & Ireland | 600+ gauges. Foundation/Premium for extended forecasts |
| **Stormglass Global Tide** | Free tier | Global | Tide predictions worldwide |
| **Open-Meteo** | Free | Global | Tidal data integrated with marine weather |
| **TideCheck** | Free (web) | 6,400+ stations | Uses NOAA, TICON-4, FES2022 |
| **WorldTides API** | Freemium | Global | Good global coverage |
| **neaps/tide-database** | Free (GitHub) | Various | Public harmonic constituents database |

**Tidal harmonic analysis:** The TASK software suite provides harmonic analysis and prediction. Harmonic constituents can be used with standard calculators — this is a well-solved mathematical problem.

### Ocean Current Data

| Source | Type | Resolution | Latency | Cost |
|--------|------|-----------|---------|------|
| OSCAR (NASA) | Satellite-derived surface | 0.25° | 2 days | Free |
| HYCOM | Model-based 3D | ~0.08° | Near real-time | Free |
| Copernicus CMEMS | Global ocean | Various | Near real-time | Free |
| NOAA RTOFS | Regional forecast | 0.08° | Daily | Free |

**Note on OSCAR:** Provides 24-hour average currents, not forecasts. For routing, model-based forecasts (HYCOM, RTOFS) are more useful.

### Harbours & Marinas Databases

| API | Cost | Coverage | Data |
|---|---|---|---|
| **Marinas.com API** | Paid | Global | Marinas, harbours, anchorages, inlets, bridges, locks, lighthouses, ramps |
| **Global Fishing Watch** | Free (open) | Global | 160,000+ anchorage locations, 32,000 ports (GitHub download) |
| **Datalastic** | Paid | Global | 23,000+ ports |
| **ActiveCaptain (Garmin)** | Proprietary | Global | Community marina reviews (locked to ecosystem) |
| **Navily** | API unclear | Europe-focused | 35,000+ marinas/anchorages with community data |

### AIS Data

| API | Cost | Coverage | Notes |
|---|---|---|---|
| **AISStream.io** | Free | Global | Real-time AIS via WebSockets |
| **AISHub** | Free (data sharing) | Global | Aggregated feed, JSON/XML/CSV |
| **AISViz** | Free (open source) | Global | Extraction, processing, visualisation toolkit |
| **MarineTraffic** | Paid | Global | 550,000+ vessels. Most comprehensive |
| **VesselFinder** | Paid | Global | Real-time, NMEA/JSON/XML |
| **Datalastic** | Paid | Global | Historical + real-time, multi-language SDK |

### Environmental Data

**Sea Surface Temperature:** NOAA OISST (0.25°, daily, free), NOAA GPB (0.05°, daily, free), Copernicus OSTIA (0.05°, daily, free), NASA Earthdata

**Water Quality (UK):** Environment Agency Bathing Water Quality API — Open Government Licence, fully free. Coastal/inland monitoring May-September.

**Harmful Algal Blooms:** NOAA HABSOS (US, free), NOAA NCCOS (US, free), Copernicus Sentinel-3 OLCI (global, free)

**Marine Wildlife:** OBIS-SEAMAP (global), Whale Hotline API (Pacific NW), NARWC (North Atlantic right whales), DFO Canada

**Wave/Buoy Data:** NDBC (National Data Buoy Center) — real-time + historical from marine stations worldwide. Free access, Python libraries available.

---

## 14. Mapping Technology

### MapLibre GL JS (Recommended)

**Website:** https://maplibre.org/ | **License:** BSD-3-Clause

**Capabilities:**
- WebGL-accelerated vector tile rendering — smooth, performant
- Custom layer support — essential for overlaying nautical data
- Style specification allows complete visual customisation (dark mode, blueprint aesthetic)
- Offline tile support via service workers / caching
- Touch-friendly with pinch-zoom, rotation, bearing
- No API key required, no usage-based pricing
- Active open source project (fork of Mapbox GL JS v1)

**How to overlay marine charts:**

1. **Raster tile overlay:** Use NOAA's WMTS as a raster tile source. Straightforward but limited customisation.
2. **Vector tiles from S-57:** Convert using s57tiler (GitHub), BAUV-Maps, or VectorCharts (commercial)
3. **Commercial tile services:** MarineCharts.io (US, expanding), VectorCharts ("Add Nautical Charts to Your Web App")
4. **Hybrid approach:** MapLibre base + OpenSeaMap overlay + NOAA raster for US + custom vector layers

### Vector Tiles vs Raster Tiles

**Vector (recommended for new builds):** Infinitely zoomable, styleable (dark mode), smaller files, interactive, can be generated from S-57. More complex setup.

**Raster:** Simple to implement, NOAA provides free WMTS, fixed style, larger files, not interactive.

**Strategy:** Start with NOAA raster tiles for quick US chart display, then build a vector tile pipeline from S-57 data for long-term architecture.

---

## 15. Passage Planning — State of the Art

### Weather Routing Algorithms

**The Isochrone Method (standard):**
- Invented 1957, still the foundation
- From departure, calculate positions reachable in N hours across all headings → connect as isochrone → extend → repeat → trace back optimal path
- OpenCPN Weather Routing Plugin implements this with GRIB + boat polars
- Modern refinements: 3D modified isochrones (3DMI) for east- and west-bound routes

**Multi-Objective Optimisation (advanced):**
- Beyond "fastest route" — optimises comfort, safety, fuel efficiency simultaneously
- More computationally expensive but more useful for cruising sailors

**What Makes a Great Passage Planner:**
1. Weather routing with boat polars — based on YOUR boat's performance
2. Tidal gate awareness
3. Departure planning — "when should I leave?" is often more important than "what route?"
4. Multi-model weather comparison — never trust a single forecast
5. Comfort criteria — not just fastest, but comfortable (wave angle, height limits)
6. Dynamic re-routing as forecasts change
7. Offline capability
8. Satellite integration for offshore updates

---

## 16. AI Opportunities

### Genuinely Useful (Build These)

1. **Natural language queries against boat data** — Signal K's MCP Server demonstrates this. "What's the battery voltage?" Low-hanging fruit.
2. **Smart anchorage recommendations** — "Find me a sheltered anchorage near here in tonight's forecast wind direction, with good holding, under 5m depth, with shore access." Combines chart data, weather, community reviews, spatial queries.
3. **Weather forecast interpretation** — "Should I leave today or wait?" Translate GRIB into plain-language advice for the sailor's route, boat, and preferences.
4. **Route optimisation beyond isochrones** — Multi-objective: time, comfort, safety, fuel, equipment stress.
5. **Anomaly detection on boat systems** — "Your battery discharge pattern this week is unusual — check alternator." Using Signal K data streams.

### Probably Useful (Watch and Assess)

6. **Small Language Models on edge devices** — SLMs on battery-powered devices with no connectivity. Compelling for offshore but models are still early.
7. **Automated passage report generation** — Generate reports from logged data: route, weather encountered, speed, fuel, notable events.

### Mostly Hype (Don't Build Yet)

8. **Fully autonomous sailing** — Samsung did a trans-Pacific demo but that's commercial shipping with purpose-built hardware. Recreational is much further out.
9. **AI replacing human judgement in navigation** — The sea is too variable and consequences too high. AI should advise, never decide.

---

## 17. Marine Communications & Hardware Connectivity

### Protocol Summary

| Protocol | Type | Speed | Notes |
|----------|------|-------|-------|
| **NMEA 0183** | Serial ASCII | 4800/38400 baud | Simple to parse, widely used on older equipment. Go: `adrianmo/go-nmea` + `go.bug.st/serial` |
| **NMEA 2000** | CAN bus binary | 250 kbit/s | Modern standard. Go: `aldas/go-nmea-client` or `boatkit-io/n2k` via SocketCAN |
| **Signal K** | JSON over WebSocket | N/A | Web-native bridge protocol. REST + WebSocket API |
| **Victron VE.Direct** | Serial | 19200 baud | Text mode (key-value pairs) + HEX mode (registers). For BMV, SmartShunt, MPPT, Phoenix |
| **Victron VE.Bus** | RS-485 proprietary | N/A | Multi/Quattro inverters. Access via GX devices only |
| **Victron VE.Can** | CAN bus | 250 kbit/s | Electrically compatible with N2K. Larger MPPT, Lynx products |
| **Venus OS APIs** | D-Bus / MQTT / Modbus TCP | N/A | Cerbo GX exposes all Victron data. MQTT is most practical for remote access |
| **SeaTalk 1** | Single-wire | 4800 baud 9-bit | Proprietary but reverse-engineered. Pragmatic: convert to NMEA 0183 |
| **SeaTalkNG** | N2K physical variant | Standard N2K | Only needs adapter cables |
| **MQTT** | TCP | N/A | Glue protocol: Victron, Signal K, ESP32 sensors, Node-RED, Home Assistant |

### Key Hardware Gateways

| Project | Platform | Function |
|---------|----------|----------|
| **OpenPlotter** | Raspberry Pi | Full marine OS: Signal K + OpenCPN + Node-RED + MQTT |
| **Hat Labs SH-RPi** | Pi HAT | Isolated N2K CAN + protected 12/24V power + safe shutdown |
| **Hat Labs SH-ESP32** | ESP32 | Wireless sensor: 1-Wire, analog, I2C, CAN → WiFi → SignalK |
| **MacArthur HAT** | Pi HAT | Open-source NMEA 0183 + N2K interfaces |
| **iKommunicate** | Dedicated | Hardware Signal K gateway (Digital Yacht) |
| **Bareboat Necessities** | Pi | Complete marine OS: SignalK + OpenCPN + Grafana + InfluxDB + PyPilot |
| **ESP32 WiFi gateways** | ESP32 | Bridge N2K to WiFi. ~$5-10 hardware. Timo Lappalainen's NMEA2000 library |

### Radar Integration (Achievable, High Value)

| Brand | Connection | Open Source Reference | Priority |
|-------|-----------|----------------------|----------|
| **Navico (B&G/Simrad/Lowrance)** | Ethernet UDP | OpenCPN radar plugin, GoFree SDK | **Highest** — most documented |
| **Furuno** | Ethernet | OpenCPN Furuno plugin | Medium |
| **Raymarine Quantum** | WiFi | Partially decoded | Interesting for portable setups |
| **Garmin** | Ethernet | None known | Lowest |

### Sonar — Lower Priority

Full sonar/fishfinder imagery is tightly coupled to vendor hardware. Raw sonar data is massive and proprietary. **Practical approach:** depth data via NMEA 2000 (PGN 128267) is already in scope. Radar overlay is achievable and high value. Full sonar imagery is a future goal.

---

## Sources

All sources from the three original research documents:

**Competitor Apps:**
- [Savvy Navvy](https://www.savvy-navvy.com/) | [Pricing](https://www.savvy-navvy.com/pricing) | [Practical Sailor Review](https://www.practical-sailor.com/marine-electronics/navigation-app-review-savvy-navvy/)
- [PredictWind](https://www.predictwind.com/features/weather-routing) | [AI Enhancements](https://www.bwsailing.com/cc/2025/12/predict-wind-adds-ai-to-forecast-and-routing-software/)
- [Navionics by Garmin](https://www.navionics.com/gbr/apps/navionics-boating) | [Pricing Guide](https://www.wavveboating.com/blog/navionics-pricing/)
- [Orca](https://getorca.com/) | [App Free Announcement](https://getorca.com/blog/orca-app-free/) | [Raymarine Integration - Panbo](https://panbo.com/orca-and-raymarine-axiom-integration-easy-route-sharing-from-tablet-to-chart-plotter/) | [Review - Panbo](https://panbo.com/orca-offers-smart-navigation-with-your-tablet-or-theirs/)
- [SailGrib](https://www.sailgrib.com/)
- [TZ iBoat 2026 Review](https://www.boataround.com/blog/marine-navigation-in-2026-why-the-tz-iboat-app-stands-out)
- [iSailor - Casual Navigation Review](https://casualnavigation.com/top-8-apps-for-marine-navigation-judged-by-a-navigator/)
- [SEAiq](https://seaiq.com/)
- [FastSeas](https://fastseas.com/) | [Cruising World Review](https://www.cruisingworld.com/app-month-fastseas-weather-routing/) | [Interview - Sailing Virgins](https://info.sailingvirgins.com/blog/interview-with-fastseas-creator-jeremy-waters) | [Panbo](https://panbo.com/if-you-want-to-sail-away-free-fastseas-weather-routing-can-help/)
- [Windy Routes for Sailors](https://windy.app/news/routes-for-sailors-feature.html)
- [Wavve Boating](https://wavveboating.com/) | [Best Navigation Apps](https://www.wavveboating.com/blog/best-marine-navigation-app/)
- [NavShip](https://navship.org/)
- [SeaNav / Pocket Mariner](https://pocketmariner.com/)
- [Ditch Navigation](https://ditchnavigation.com/)
- [OpenCPN](https://opencpn.org/) | [GPX Files](https://opencpn.org/wiki/dokuwiki/doku.php?id=opencpn:manual_basic:route_manager:use_gpx_files)
- [OpenPlotter](https://openmarine.net/openplotter)
- [Signal K](https://github.com/SignalK/signalk-server)

**Social/Community Apps:**
- [SeaPeople App](https://seapeopleapp.com/) | [App Store](https://apps.apple.com/us/app/seapeople-boat-travel-map/id6447652420) | [Catamaran Show](https://www.catamaranshow.com/post/seapeople-ultimate-sailors-social-network) | [v1.1 Update](https://weboating.com/news/press-releases/seapeople-app-launches-major-version-1-1-update-new-tools-upgrades-and-features-for-boaters/) | [Reviews](https://justuseapp.com/en/app/6447652420/seapeople/reviews)
- [Navily](https://www.navily.com/)
- [Argo Navigation](https://argonav.io/)
- [SailTies](https://sailties.net/blog/how-to-plan-a-sailing-route)

**Cycling Analogies:**
- [Komoot](https://www.komoot.com/) | [Multi-Day Tours](https://support.komoot.com/hc/en-us/articles/4410173116954) | [Premium Multi-Day](https://www.komoot.com/premium/multiday-planner) | [Creating Highlights](https://support.komoot.com/hc/en-us/articles/360023748132) | [Highlights on Map](https://support.komoot.com/hc/en-us/articles/360058904532) | [5 Myths About Highlights](https://www.komoot.com/adventure-hub/5f1KL4GMvZpao0fw9eMofH) | [Difficulty Levels](https://support.komoot.com/hc/en-us/articles/360023625231) | [Tour Characteristics](https://www.komoot.com/tour-characteristics) | [Hiking Scale](https://www.komoot.com/help/hiking-scale) | [GPX Export](https://support.komoot.com/hc/en-us/articles/10115477099674) | [API Info](https://support.komoot.com/hc/en-us/articles/7464746034458) | [Photon Geocoder](https://github.com/komoot/photon) | [Pricing - The5kRunner](https://the5krunner.com/2025/03/11/komoot-confirms-we-dont-want-any-new-customers-in-ridiculous-pricing-move/) | [Pricing - DCRainmaker](https://www.dcrainmaker.com/2025/03/komoots-expanded-paywalls-trying-to-make-sense-of-it.html) | [Redesign - BikeRadar](https://www.bikeradar.com/news/komoot-redesign-2025) | [UX Case Study - Medium](https://medium.com/design-bootcamp/redesigning-komoot-a-friendly-usability-study-d044dbc90077) | [Guide - BikeRadar](https://www.bikeradar.com/advice/buyers-guides/guide-to-using-komoot)
- [RideWithGPS](https://ridewithgps.com/) | [Route Planner](https://ridewithgps.com/route_planner) | [Cue Sheets](https://support.ridewithgps.com/hc/en-us/articles/4419011474843) | [Cue Review Tool](https://support.ridewithgps.com/hc/en-us/articles/4419019580443) | [Export Formats](https://support.ridewithgps.com/hc/en-us/articles/4419007646235) | [Club Route Library](https://support.ridewithgps.com/hc/en-us/articles/4423179692187) | [Club Member Benefits](https://support.ridewithgps.com/hc/en-us/articles/4423512635931) | [API Documentation](https://ridewithgps.com/api/v1/doc) | [Developers GitHub](https://github.com/ridewithgps/developers) | [Pricing](https://ridewithgps.com/pricing) | [vs Komoot](https://www.thenxrth.com/post/ride-with-gps-vs-komoot-which-is-better-for-bike-adventures)

**Data Sources & APIs:**
- [Open-Meteo Marine API](https://open-meteo.com/en/docs/marine-weather-api)
- [Stormglass.io](https://stormglass.io/)
- [NOAA Tides & Currents API](https://tidesandcurrents.noaa.gov/web_services_info.html)
- [NOAA ENCs](https://charts.noaa.gov/ENCs/ENCs.shtml)
- [ADMIRALTY Tidal API](https://www.admiralty.co.uk/access-data/apis)
- [AISStream.io](https://aisstream.io/)
- [AISHub](https://www.aishub.net/)
- [Marinas.com API](https://marinas.com/developers/api_documentation)
- [Global Fishing Watch Anchorages](https://globalfishingwatch.org/datasets-and-code-anchorages/)
- [Datalastic Maritime API](https://datalastic.com/)
- [MapLibre GL JS](https://maplibre.org/)
- [s57tiler](https://github.com/manimaul/s57tiler)
- [VectorCharts](https://vectorcharts.com/)
- [MarineCharts.io](https://marinecharts.io/)
- [NDBC](https://www.ndbc.noaa.gov/)
- [Environment Agency BWQ](https://environment.data.gov.uk/bwq/)

**Hardware & Protocols:**
- [CANBoat](https://github.com/canboat/canboat)
- [Digital Yacht iKommunicate](https://digitalyacht.co.uk/)
- [Hat Labs SH-RPi](https://hatlabs.fi/)
- [GPX Import to Chartplotters - BoatTEST](https://boattest.com/article/downloading-importing-gpx-routes-your-favorite-boating-charts)
- [Garmin Plotter Sync](https://support.garmin.com/en-US/?faq=o88XgVHnYO2uOBZ1uG9kd8)

**General Reviews:**
- [Yachting World - Best Navigation Apps](https://www.yachtingworld.com/yachts-and-gear/best-navigation-apps-5-top-options-tested-134929)
- [YACHT Magazine - 15 Best Sailing Apps 2026](https://www.yacht.de/en/sailing-knowledge/navigation/apps-for-sailing-the-15-best-apps-for-navigation-and-safety-2026/)
- [Two Get Lost - Best Apps for Sailing 2025](https://twogetlost.com/best-apps-for-sailing)
- [45 Degrees Sailing](https://www.45degreessailing.com/)
- [Base44](https://base44.com/)
