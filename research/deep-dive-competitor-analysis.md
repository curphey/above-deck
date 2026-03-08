# Deep Dive Competitor Analysis

**Date:** 2026-03-08

---

## 1. SeaPeople App — Complete Analysis

### What It Is
SeaPeople is a social tracking and community app built for life on the water. It launched in **October 2024** and has rapidly grown to **58,000+ active users** who have collectively logged **3.5+ million miles**. It positions itself as a social network for boaters — think Strava meets cruiser's net.

### Founding Story
Created by **Logan Rowell** (Founder/CEO) alongside the **former CTO of Shopify**, the team behind **Sailing La Vagabonde** (the world's biggest sailing YouTube channel), and other industry veterans. The La Vagabonde connection gives it massive organic reach in the cruising community.

### Complete Feature List

**Core Tracking & Logbooks:**
- One-tap trip tracking (no extra hardware required)
- Digital logbook with distance, speed, and crew data for every voyage
- Crew tagging on trips
- Editable tracklines
- Privacy controls (private trips, visibility permissions)
- Quick "End & Save" feature

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

**Media:**
- Photo and video uploads on trips
- Free: 5-second video limit; Premium: 30-second videos, unlimited uploads

### Target Audience
Recreational boaters worldwide — from casual weekend sailors to serious cruising enthusiasts. Strong appeal to the cruising/liveaboard community given the La Vagabonde backing. The "Hails" feature targets the social aspect of anchoring and meeting other boaters.

### UX Approach
Social-first design. The app is built around the idea that boating is social — you want to know who's in the anchorage, what they're interested in, and connect with them. The UX prioritizes discovery and connection over traditional chart plotting or navigation. It's deliberately NOT a navigation app — it's a community and logging app.

### What Makes It Different
1. **Social-first for boaters** — No other app does the "who's nearby and wants to hang out" thing well
2. **La Vagabonde backing** — Instant credibility and massive audience
3. **Hails system** — Modernized VHF concept is genuinely novel
4. **Trip sharing with non-users** — Web links let family/friends follow along without downloading the app
5. **Former Shopify CTO** — Serious tech talent, not just a hobby project

### User Reviews & Reception
- Generally positive, especially from the cruising community
- Users love the interactive logbook and seeing others' adventures
- The Hails feature is a standout favorite
- **Android issues**: App described as slow and crash-prone on Android
- Some users find the social features compelling but want more navigation integration
- Updated Feb 2026 with bug fixes and revamped Trip Details screen

### Pricing
- **Free tier**: Basic tracking, travel totals, 5-second videos
- **PLUS subscription**: Detailed trip stats, web sharing of live trips, advanced analytics
- **PATRON subscription**: Highest tier with additional features
- Specific pricing amounts not publicly listed on website

### Relevance to Our Project
SeaPeople validates the demand for a boating-focused social/community layer. Their Hails and community features are things we should study. However, they deliberately avoid navigation/route planning — that's our lane. There's potential for complementary positioning or for us to incorporate social elements they've proven work.

---

## 2. Komoot — Deep Dive

### How Multi-Day Tour Planning Works (Step by Step)

1. **Create a long route**: Plan or import a route that exceeds ~7 hours of estimated travel time
2. **Multi-day planner appears**: Once the route is long enough, Komoot surfaces the multi-day planner (Premium feature)
3. **Auto-split into stages**: Komoot suggests splitting the route into daily stages based on duration/distance
4. **Adjust stage endpoints**: Users drag stage boundaries to customize where each day starts/ends
5. **Accommodation suggestions**: For each stage endpoint, Komoot suggests nearby accommodations — hotels, guesthouses, camping, RV parks
6. **Select accommodation**: Choosing an accommodation adjusts the endpoint of that day's tour and automatically adjusts the next day's start point
7. **Review each stage**: Each stage gets its own difficulty rating, elevation profile, and estimated time
8. **Edit individual stages**: Stages can be edited independently — reroute, add waypoints, etc.
9. **Navigate stage by stage**: During the trip, navigate one stage at a time with full turn-by-turn

**Key insight for sailing**: The auto-split + accommodation suggestion pattern maps directly to "split a passage into day sails + suggest anchorages/marinas at each stopping point."

### How Highlights (Community POIs) Work

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

**Key insight for sailing**: This "verified visit + community aggregation + auto-curation" model is exactly what we need for anchorages, passages, and harbors. The requirement that you must have actually been there prevents armchair reviewing.

### How the Difficulty/Rating System Works

**Three overall levels**: Easy (blue), Moderate (red), Hard (black)

**Calculated from three factors combined:**
1. **Fitness level required** — Based on duration and elevation gain
   - Easy: Up to 2 hours, 1,000 ft elevation
   - Moderate: Up to 6 hours, 1,500 ft elevation
   - Hard: 6+ hours or 3,000+ ft elevation
2. **Technical difficulty** — Surface type, trail grade
3. **Sport type** — Different scales for different activities

**Sport-specific scales:**
- Mountain biking: S0 (easy) through S5 (extreme) singletrack scale
- Hiking: SAC T1 (walking) through T6 (alpine) scale

**Route characteristics displayed:**
- Way types: path, cycleway, street, highway, trail, singletrack, road
- Surface types: sand, asphalt, cobblestones, gravel
- Shown as percentage breakdown along the route

**Key insight for sailing**: We need a multi-factor difficulty system too — combining passage distance, typical sea state, exposure level, tidal complexity, and navigation difficulty. The "show what the route is made of" concept (their way/surface types) maps to "open water vs. coastal vs. channel vs. harbor approach."

### How Offline Navigation Works

- Users pre-download region maps before going offline
- Full offline turn-by-turn navigation available
- **Critical limitation**: No offline rerouting — if you deviate from the planned route without connectivity, Komoot cannot recalculate
- Voice navigation continues to work offline
- Maps are region-based downloads (one free region on signup)

**Key insight for sailing**: Offline is non-negotiable for us too. Their limitation (no offline rerouting) is something we should aim to solve since sailors routinely lose connectivity.

### How Route Sharing and Social Features Work

- Share routes via direct links (recipients don't need Komoot accounts)
- GPX export for device-agnostic sharing
- Comment on and like other users' completed activities
- Follow other users to see their activity feed
- Completed tours auto-generate shareable activity records with stats and photos
- Integration with Strava for cross-posting
- "Collections" — curated groups of routes around a theme/area

### How GPX Export to Devices Works

- Routes and completed activities exportable as GPX from web or app
- **GPX export requires a paid subscription** (not available on free tier)
- Direct sync integrations: Garmin, Wahoo, Sigma, Suunto, Apple Watch
- For Garmin: routes sync directly via Komoot's Connect IQ integration
- Import supports GPX, KML, FIT files

### Open Source Components & API

- **No public API** — Komoot only integrates with selected device manufacturers
- **Photon Geocoder** — Open source geocoder for OpenStreetMap data (github.com/komoot/photon). Uses Elasticsearch/OpenSearch. Accessible at photon.komoot.io
- **13 public repositories** on GitHub
- **OAuth2 example** available for authentication
- Several unofficial community wrappers exist (Python: `kompy`, `komPYoot`)

**Key insight for sailing**: Photon geocoder could be useful for our own geocoding needs. The lack of public API is a deliberate strategy to control the ecosystem.

### What Makes Their UX So Good

1. **Map-centric design** — Maximum screen space for the map; minimal UI clutter
2. **Task-oriented interface** — Only shows relevant controls for your current action (planning vs. navigating vs. reviewing)
3. **Familiar patterns** — Leverages Google Maps conventions so users feel at home instantly
4. **Progressive disclosure** — Simple for beginners, powerful features available but not overwhelming
5. **Approachable, not competitive** — Unlike Strava, Komoot feels encouraging for casual users, not just athletes
6. **Consistent design system** — Predictable visual and interaction patterns reduce cognitive load
7. **Rich route preview** — Before committing, you see difficulty, surface breakdown, elevation profile, time estimate, and Highlights along the route

### Komoot Pricing (Current — controversial)

**Major change in early 2025**: Shifted from one-time purchases to subscription model.

- **Previous model**: One-time purchase per region (EUR 3.99/region, 8.99/bundle, 29.99/world)
- **New model**: Subscription required — EUR 6.99/month or EUR 59/year
- **New users**: Must subscribe to sync routes to GPS devices (Garmin, Wahoo, etc.)
- **Existing users who ever purchased anything**: Retain sync ability without subscription
- **Free tier**: One free region on signup, basic planning/navigation
- **Premium (EUR 59/yr)**: Multi-day planning, offline maps, sport-specific maps, 3D maps, live tracking, weather, personal collections

**Community backlash**: The pricing change received significant negative reaction. Articles titled "Komoot confirms we don't want any new customers" appeared. The forced subscription for device sync particularly angered users.

---

## 3. RideWithGPS — Deep Dive

### Route Builder UX Details

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

**Key insight for sailing**: The "multiple routes open" concept is excellent for comparing passage options. The heatmap concept (showing where people actually sail) would be incredibly valuable. The Trace tool maps to "convert a recorded passage to a shareable route."

### How Cue Sheets Work

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

**Cue Review Tool:**
- Dedicated tool to review and validate cue accuracy before riding

**PDF Export:**
- Printable PDF maps and cue sheets (Premium/Basic feature)
- Useful for group rides where not everyone has the app
- Pass out to riders at events

**Key insight for sailing**: The cue sheet concept maps to "passage notes" — automatically generated waypoint-by-waypoint guidance with custom annotations. "Custom cues" are like "passage notes" (e.g., "Watch for ferry traffic" or "Tide gate — check timing"). PDF export for crew briefing sheets is a great idea.

### How Route Sharing Works

- **Direct links**: Share any route via URL
- **Embed on websites**: Routes can be embedded on external sites
- **Export formats**: GPX Track, TCX Course, TCX History, FIT Course, CSV, KML
- **Club Route Library**: Central hub for club routes with tagging and visibility controls
- **Privacy controls**: Public, unlisted, or private routes

### GPX Export Workflow

1. Navigate to any route or ride page
2. Click Export/Download
3. Choose format: GPX Track, TCX Course, FIT Course, CSV, KML
4. File downloads immediately
5. **Mobile**: "Send to Device" feature pushes directly to paired GPS devices
6. **Device sync**: Direct integration with Garmin and Wahoo for wireless route push
7. **Club upload**: Bulk import GPX/TCX/KML/KMZ/FIT files to club library

### Club/Team Features (Analogous to Crew)

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

**Key insight for sailing**: The "club members get premium features on club routes" model is brilliant for crew management. A skipper could create a "crew" and share passage plans where crew members get full navigation features without individual subscriptions.

### API & Developer Tools

**Official API (v1):**
- JSON-based REST API
- Authentication: OAuth (preferred) or Basic Auth with API key
- Access via email request to info@ridewithgps.com
- **Endpoints**: Authentication Tokens, Collections, Events, Routes, Sync, Trips, Users, Club Members, Points of Interest
- Pagination: 20-200 results per page
- **Webhooks**: Configurable notifications when users create/update assets
- Developer contact: developers@ridewithgps.com
- GitHub: github.com/ridewithgps/developers

**Key insight for sailing**: Having a proper API from day one would differentiate us. Webhooks for crew notifications ("skipper updated the passage plan") would be valuable.

### RideWithGPS Pricing

| Tier | Monthly | Annual |
|------|---------|--------|
| **Starter** (Free) | $0 | $0 |
| **Basic** | $7.99/mo | $5.00/mo ($60/yr) |
| **Premium** | $9.99/mo | $6.67/mo ($80/yr) |

**Starter**: Route exploration, ride recording, basic planning, device sync
**Basic**: + Voice navigation, offline maps, live logging, heatmaps
**Premium**: + Full planning tools, all heatmaps, custom cues, ride analysis, custom map printing, privacy zones, private segments

**Club accounts**: Separate pricing (not publicly listed), includes member benefits

---

## 4. Other Sailing Apps Worth Knowing About

### Orca — The Marine CoPilot
- **Website**: getorca.com
- **What**: Modern chartplotter replacement that runs on phone, tablet, laptop, and watch. Also sells dedicated marine hardware (Core: EUR 550, Display: ~EUR 1,000)
- **Standout features**:
  - Sail routing powered by weather forecasts + boat polar diagrams
  - Automatic route recalculation when conditions change
  - MarineTraffic AIS integration
  - Real-time weather alerts
  - High-res satellite charts for harbor approaches
- **Pricing**: App is FREE. Plus subscription (EUR 49/yr) for offline maps. Smart Navigation (EUR 99/yr) for full features. Total: EUR 148/yr for max
- **Reception**: Trusted by hundreds of thousands. Works with Raymarine, Garmin, B&G equipment
- **Relevance**: Orca is trying to be the modern chartplotter. They're focused on navigation/hardware, not itinerary planning or community

### FastSeas — Weather Routing
- **Website**: fastseas.com
- **What**: Passage planning tool that calculates optimal routes using NOAA GFS weather, ocean currents, vessel polars, and comfort criteria
- **Standout features**:
  - 16-day forecast window for route calculation
  - Custom vessel performance/polar input
  - GPX output with weather data embedded in waypoints
  - Works via satellite communicator (Garmin inReach) for offshore updates
  - Email-based interface works with limited connectivity
- **Pricing**: Free Basic (5 requests/month), paid Premium (unlimited)
- **Founded by**: A cruising sailor (Jeremy Waters) — built to scratch his own itch
- **Best for**: Offshore/passage planning, not coastal day-sailing
- **Relevance**: Complementary tool, not a competitor. Their weather routing could be an integration partner

### Windy.app — Routes for Sailors
- **Website**: windy.app
- **What**: Primarily a weather app that recently added sailing route planning as a new feature
- **Status**: Beta feature
- **Features**:
  - Route time estimation based on wind forecasts
  - Boat-specific polars (Hanse 400e implemented)
  - Distance measurement
  - Sailing route simulation
- **Relevance**: Shows that weather apps are expanding into route planning, creating convergence in the market

### Wavve Boating
- **Website**: wavveboating.com
- **What**: Sailing navigation app focused on simplifying coastal sailing
- **Features**: Charts, GPS, route planning with sailing-specific features
- **Status**: Updated 2025, gaining traction

### SailGrib
- **Website**: sailgrib.com
- **What**: Marine weather and routing app. Includes weather, tides, currents, and routing
- **Reputation**: Well-regarded among serious offshore sailors
- **Relevance**: More focused on weather routing than itinerary/trip planning

### NavShip Boating
- **Website**: navship.org
- **What**: Waterway route planner with "big plans for the 2025 season"
- **Features**: Addressing shallow water routing and smart route planning
- **Relevance**: Worth watching as a potential new entrant

---

## 5. Key Patterns & Insights for Our Product

### What the Market Lacks (Our Opportunity)
1. **No one does itinerary planning well** — Navigation apps plan routes; social apps connect people; weather apps forecast; but NOBODY combines multi-day itinerary planning with community knowledge for sailing
2. **The Komoot model hasn't been applied to sailing** — Multi-day stage planning + community Highlights + difficulty ratings = exactly what sailors need
3. **Crew collaboration is unsolved** — SeaPeople has groups, RideWithGPS has clubs, but nobody lets a skipper build a passage plan that the crew can collaboratively refine
4. **Community-verified anchorage data is fragmented** — ActiveCaptain (Garmin), Noonsite, Navily, and SeaPeople all have bits of this, but none use Komoot's "you must have been there" verification model

### Features to Steal/Adapt
| Source | Feature | Sailing Adaptation |
|--------|---------|-------------------|
| Komoot | Multi-day stage planner | Multi-day passage planner with daily legs |
| Komoot | Highlights (community POIs) | Community-verified anchorages, hazards, marina reviews |
| Komoot | "Must have visited" requirement | Only users who logged a passage through an anchorage can review it |
| Komoot | Difficulty system | Passage difficulty: distance + sea state + exposure + tide + navigation complexity |
| Komoot | Route characteristics breakdown | Passage composition: open water % + coastal % + channel % + harbor approach % |
| RideWithGPS | Cue sheets | Passage notes with auto-generated waypoint guidance + custom annotations |
| RideWithGPS | Club route library | Crew passage plan library with shared access |
| RideWithGPS | Club members get premium on club routes | Crew members get full nav on skipper's shared plans |
| RideWithGPS | Heatmaps | "Where sailors actually go" overlay |
| RideWithGPS | API + Webhooks | Developer API from day one; webhooks for crew notifications |
| SeaPeople | Hails | "Who's in the anchorage" social discovery |
| SeaPeople | Live trip sharing to non-users | Share passage progress with family via web link |
| SeaPeople | Milestones/badges | Nautical mile milestones, passage achievements |
| FastSeas | Weather routing with polars | Integrate weather-optimized routing |
| FastSeas | Satellite communicator support | Passage updates via InReach for offshore |
| Orca | Polar-based sail routing | Weather-aware route suggestions |

### Pricing Observations
- Savvy Navvy: $80-150/yr (navigation-focused)
- Komoot: EUR 59/yr (controversy over paywall expansion)
- RideWithGPS: $60-80/yr (clear tier differentiation)
- Orca: Free app + EUR 49-148/yr for features
- SeaPeople: Free core + paid tiers (prices unlisted)
- **Pattern**: Free tier essential for adoption. $60-80/yr is the sweet spot. Premium at $100-150/yr for power users. Avoid Komoot's mistake of paywalling previously-free features.

---

## Sources

- [SeaPeople App](https://seapeopleapp.com/)
- [SeaPeople on App Store](https://apps.apple.com/us/app/seapeople-boat-travel-map/id6447652420)
- [SeaPeople & Sailing La Vagabonde - Catamaran Show](https://www.catamaranshow.com/post/seapeople-ultimate-sailors-social-network)
- [SeaPeople v1.1 Update - WeBoating](https://weboating.com/news/press-releases/seapeople-app-launches-major-version-1-1-update-new-tools-upgrades-and-features-for-boaters/)
- [SeaPeople Reviews - JustUseApp](https://justuseapp.com/en/app/6447652420/seapeople/reviews)
- [Komoot Multi-Day Tours](https://support.komoot.com/hc/en-us/articles/4410173116954-Plan-and-navigate-multi-day-Tours)
- [Komoot Premium Multi-Day Planner](https://www.komoot.com/premium/multiday-planner)
- [Komoot Creating Highlights](https://support.komoot.com/hc/en-us/articles/360023748132-Creating-Highlights)
- [Komoot Highlights on Map](https://support.komoot.com/hc/en-us/articles/360058904532-Highlights-displayed-on-the-map)
- [Komoot 5 Myths About Highlights](https://www.komoot.com/adventure-hub/5f1KL4GMvZpao0fw9eMofH/5-myths-about-komoot-highlight-creation-busted)
- [Komoot Difficulty Levels](https://support.komoot.com/hc/en-us/articles/360023625231-Komoot-s-difficulty-levels-surface-types)
- [Komoot Tour Characteristics](https://www.komoot.com/tour-characteristics)
- [Komoot Hiking Scale](https://www.komoot.com/help/hiking-scale)
- [Komoot GPX Export](https://support.komoot.com/hc/en-us/articles/10115477099674-Export-and-import-Routes-and-Activities)
- [Komoot API Info](https://support.komoot.com/hc/en-us/articles/7464746034458-Komoot-API)
- [Komoot Photon Geocoder (GitHub)](https://github.com/komoot/photon)
- [Komoot Pricing Changes - The5kRunner](https://the5krunner.com/2025/03/11/komoot-confirms-we-dont-want-any-new-customers-in-ridiculous-pricing-move/)
- [Komoot Pricing Changes - DCRainmaker](https://www.dcrainmaker.com/2025/03/komoots-expanded-paywalls-trying-to-make-sense-of-it.html)
- [Komoot Redesign - BikeRadar](https://www.bikeradar.com/news/komoot-redesign-2025)
- [Komoot UX Redesign Case Study - Medium](https://medium.com/design-bootcamp/redesigning-komoot-a-friendly-usability-study-d044dbc90077)
- [Complete Guide to Komoot - BikeRadar](https://www.bikeradar.com/advice/buyers-guides/guide-to-using-komoot)
- [RideWithGPS Route Planner](https://ridewithgps.com/route_planner)
- [RideWithGPS Cue Sheets](https://support.ridewithgps.com/hc/en-us/articles/4419011474843-Cuesheets)
- [RideWithGPS Cue Review Tool](https://support.ridewithgps.com/hc/en-us/articles/4419019580443-Cue-Review-Tool)
- [RideWithGPS Export Formats](https://support.ridewithgps.com/hc/en-us/articles/4419007646235-Export-File-Formats)
- [RideWithGPS Club Route Library](https://support.ridewithgps.com/hc/en-us/articles/4423179692187-Part-2-Club-Route-Library)
- [RideWithGPS Club Member Benefits](https://support.ridewithgps.com/hc/en-us/articles/4423512635931-Club-Member-Benefits)
- [RideWithGPS API Documentation](https://ridewithgps.com/api/v1/doc)
- [RideWithGPS Developers (GitHub)](https://github.com/ridewithgps/developers)
- [RideWithGPS Pricing](https://ridewithgps.com/pricing)
- [Orca Marine CoPilot](https://getorca.com/)
- [Orca App Free Announcement](https://getorca.com/blog/orca-app-free/)
- [Orca Review - Panbo](https://panbo.com/orca-offers-smart-navigation-with-your-tablet-or-theirs/)
- [FastSeas Weather Routing](https://fastseas.com/)
- [FastSeas Review - Cruising World](https://www.cruisingworld.com/app-month-fastseas-weather-routing/)
- [FastSeas Interview - Sailing Virgins](https://info.sailingvirgins.com/blog/interview-with-fastseas-creator-jeremy-waters)
- [FastSeas - Panbo](https://panbo.com/if-you-want-to-sail-away-free-fastseas-weather-routing-can-help/)
- [Windy Routes for Sailors](https://windy.app/news/routes-for-sailors-feature.html)
- [Savvy Navvy](https://www.savvy-navvy.com/)
- [Savvy Navvy Pricing](https://www.savvy-navvy.com/pricing)
- [Savvy Navvy Review - Practical Sailor](https://www.practical-sailor.com/marine-electronics/navigation-app-review-savvy-navvy/)
- [Best Marine Navigation Apps 2025 - Wavve](https://www.wavveboating.com/blog/best-marine-navigation-app/)
- [Best Navigation Apps - Yachting World](https://www.yachtingworld.com/yachts-and-gear/best-navigation-apps-5-top-options-tested-134929)
- [Best Apps for Sailing 2025 - Two Get Lost](https://twogetlost.com/best-apps-for-sailing)
