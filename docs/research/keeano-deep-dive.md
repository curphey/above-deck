# Keeano Deep Dive Research

**Date:** 2026-03-08
**Website:** https://keeano.com

---

## 1. Complete Feature List

### Core Features
- **Smart Destination Recommendations** — ML-powered "match scores" based on boat type, dimensions, weather conditions, time of day, traffic forecast, and user preferences
- **40,000+ Mediterranean Destinations** — Beaches, caves, wrecks, marinas, anchorages, ports
- **Coast View** — 800,000+ georeferenced aerial photos (partnership with Geotag Aeroview)
- **Real-time Weather Forecasting** — Integrated weather data for all destinations
- **AIS/MarineTraffic Live Vessel Layer** — Shows anchored or on-course boats operating with AIS
- **Automated Route Planning** — Fastest route between two points based on boat specs, size, and ETA
- **Multileg Route Calculation** — Press "Calculate" for full routing with underway stats (distance, heading, duration, fuel consumption)
- **Personal Logbook** — Mark visited places, document adventures
- **Wishlist/Favorites** — "Where to next?" saved destination lists
- **Popularity Trends** — Real-time availability and historical popularity data
- **Protection Scores** — How protected an anchorage/shelter is
- **Suitability Scores** — Per-destination scoring based on your vessel profile
- **GPX Export** — For chart plotter integration
- **Personalized Filters** — Categories: Explore, Refuel, Overnight Stay, Provision, Eat & Drink
- **Fuel Services** — Tap-based fuel arrangement with coastal station connectivity
- **Berth Booking** — Marina reservation (limited availability)
- **Community Hazard Reporting** — Jellyfish alerts, pollution, water quality, occupancy
- **16 Selectable Interests** — Sailing, pet-friendly, surf, snorkeling, camping, clubbing, scuba diving, nudist beaches, etc.
- **9 "Mood" Selections** — Customize search results by mood (including "naked" for nudist beaches)
- **Guest Mode** — Access without full account setup

### Collaborative/Crew Features (see section 5)
- Dynamic Trip Planner with crew sharing
- In-app chat
- Role allocation (captain, crew)
- Public/private trip settings

### Upcoming Features (per their website)
- Enhanced berth booking
- Enhanced notifications system

---

## 2. How the Trip Planner Works — Step-by-Step UX Flow

1. **Account Setup** — Create account, set interests, vessel size, and vessel type (motor or sail)
2. **Trip Initiation** — Go to Profile > Trips > Create New Trip
3. **Trip Parameters Wizard** — Configure foundational settings (dates, vessel, preferences)
4. **Share with Crew** — One-click share trip link with buddies; allocate roles
5. **Explore & Select Destinations** — Browse live map, review place suitability scores, add locations with one click
6. **Build Day-by-Day Itinerary** — Add stops to specific days, reorder freely, add notes to each stop
7. **Get Insights** — Automatic insights for each stop (weather, protection, popularity)
8. **Calculate Route** — Press "Calculate" to generate multileg routing with underway stats (distance, heading, duration, fuel consumption per leg)
9. **Collaborate** — Crew members can simultaneously edit, chat in private room, suggest changes
10. **Set Sail** — Use the itinerary as live navigation reference

Destination categories when building itinerary:
- Overnight stays (anchorages, moorings, marinas, ports)
- Shops & services
- Food & drinks (with dinghy access notation)

The platform claims to reduce trip planning from "15 hours to 1 minute."

---

## 3. Coast View Feature — 800K Aerial Photos

### What It Is
Coast View is a visual exploration feature that lets users swipe through 800,000+ high-definition georeferenced aerial photos of the Mediterranean coastline, shot from helicopter viewpoints.

### How It Works
- **Swipe navigation** — Users swipe left/right through sequential aerial photos along the coastline
- **Georeferenced** — Each photo is mapped to its exact GPS location on the coast
- **Discovery tool** — While browsing photos, users can discover ~1,000 beaches and ~7,000 anchorages
- **Add to trip** — Spots discovered via Coast View can be added directly to trip itineraries

### Data Source
- **Geotag Aeroview** (Greek company, also runs TRIPinVIEW)
- 40,000 km of Mediterranean coastline captured
- 300 hours of HD aerial video
- 800,000 ultra-high resolution aerial photographs

### Launch
- Introduced in version 2.3.1 (July 2020)
- Described as a "subscription" service in some references, but currently appears included in the free app

---

## 4. AIS / MarineTraffic Integration

### Partnership
- Official partnership with **MarineTraffic** (Greek ship tracking company) — contributed to Keeano v2 development
- MarineTraffic provides live AIS Class B vessel data

### What Users See
- **Live Vessels Layer** on the map showing anchored or on-course boats using AIS transponders
- Real-time vessel positions around the coastline
- Traffic density/patterns at destinations
- Vessel traffic info factors into smart recommendations (avoid crowded spots)

### Use Cases
- Travelers on passenger boats can discover nearby beaches based on their vessel's real-time AIS position
- Boaters can see traffic congestion at anchorages before arriving
- Historical traffic data feeds into "popularity scores" for destinations

---

## 5. Collaborative Crew Features

### Trip Sharing
- **One-click share** — Generate trip link, send to crew via any messaging platform
- **Role Allocation** — Assign roles: choose a Captain, designate crew members
- **Simultaneous Editing** — Multiple crew members can edit the itinerary at the same time
- **Private Chat Room** — In-app chat for each trip; crew discusses plans without external tools
- **Public/Private Trips** — Trips can be set to public (discoverable by community) or private (invite only)
- **Web App Access** — Crew can join via "keeano live web app" or mobile (iOS/Android)

### Community Features
- Find sea trips created by the Keeano community and local experts
- Share favorite spots with friends and fellow "coastline adventurers"

### What Crew Can Do
- View and edit the shared itinerary
- Add/remove/reorder destinations
- Add notes to stops
- Chat with other crew members
- View all routing stats and insights

---

## 6. Tech Stack

### Confirmed
- **Mobile apps**: iOS (Swift/native) and Android (native) — separate designs by Chris Ouzounis for iOS and Android
- **Web app**: "keeano live web app" for trip collaboration
- **Machine Learning**: Recommendation engine using positional AIS data + ML for dynamic itinerary generation
- **Cloud platform**: Described as a "cloud platform" for yachting
- **Data integrations**: MarineTraffic AIS API, Geotag Aeroview photo database, weather data APIs

### Design & Development
- **UI/UX Design**: Chris Ouzounis (2023 redesign) — Art Direction, Creative Direction, iOS App Design, Android App Design, UI Design, UX Design
- **Development**: Double Dot (agency credited on keeano.com footer)
- **App size**: 68.7 MB (iOS)
- **iOS minimum**: iOS 13.0+
- **Also available on**: macOS 11.0+, Apple Vision (visionOS 1.0+)

### Crunchbase Tech Details
- Crunchbase has a "Tech Details" page for Keeano but the specifics are behind a paywall

### Inferred
- The recommendation engine likely uses collaborative filtering + contextual data (weather, AIS, boat specs)
- GPX export suggests integration-ready architecture
- "Open platform" approach — empowering integrations with startups for berth booking and experiences

---

## 7. App Store Reviews

### iOS App Store
- **Rating**: 5.0 / 5 stars (3 ratings — very small sample)
- **Latest version**: 4.1.2 (March 31, 2025)

**Positive reviews:**
- "On a recent trip to Corfu, Kefalonia and Lefkada, we used Keeano to discover all kinds of local beaches with very helpful details to prepare (i.e., if there's a beach bar, if there's parking, etc.)"
- "Find hidden coves in nearby islands like Meganisi" — "Super easy to use"
- "I feel this will be my goto app for planning trips"

**No negative iOS reviews found** (only 3 ratings total)

### Google Play Store
- **Rating**: Not clearly available (JS-rendered page)

**Positive reviews:**
- "Great app" — general praise

**Negative reviews:**
- "App now looks like a Facebook app with big icons and less details"
- "Have to zoom in too much to see area details"
- "App now focuses only on boats and yachts" — users who previously used it for beach exploration on land feel abandoned by the pivot to boating-only focus

### Key Takeaway
The pivot from general beach/coastline app to boating-focused app alienated some early land-based users. Boating users seem satisfied but the review count is extremely low overall.

---

## 8. Pricing

### Current Model
- **Free to download** on iOS and Android
- **No in-app purchases** listed on the App Store
- Contains **commercial ads**

### Subscription References
- Coast View was originally described as a "subscription" service but appears to now be free
- Terms of Service reference "smart subscription-based services for bareboat travelers, skippers, charter companies and coastal travel enthusiasts"
- No visible paid tiers or pricing page on keeano.com

### Revenue Model (Inferred)
- Ads
- Future berth booking commission (marketplace model)
- Potential B2B partnerships with charter companies/brokers
- Crunchbase describes an "open platform empowering integrations with startups providing Book a Berth and Book an Experience functionalities"

---

## 9. Coverage

### Regions with Comprehensive Data
- Greece
- Turkey
- Croatia
- Italy
- France
- Spain
- Portugal
- Malta

### POI Numbers
- **40,000+** total destinations (beaches, caves, wrecks, marinas, anchorages)
- **~1,000** beaches discoverable via Coast View
- **~7,000** anchorages discoverable via Coast View
- **800,000** aerial photos covering 40,000 km of coastline
- **80+** nudist beaches mapped in Greece alone (from early feature set)

### Focus
- **Mediterranean-only** — no coverage outside the Med
- Originally started with Greek coastline, expanded to full Mediterranean

---

## 10. API and Data Sources

| Data Type | Source |
|---|---|
| AIS vessel tracking | MarineTraffic (official partnership) |
| Aerial photography | Geotag Aeroview / TRIPinVIEW (800K photos, 40K km coastline) |
| Weather forecasting | Unknown provider (real-time weather API, not specified) |
| POI/destination data | Proprietary database (built by Keeano team + community contributions) |
| User-generated content | Community reports: hazards, jellyfish, pollution, photos, reviews |
| Popularity/traffic data | Derived from AIS historical data + in-app usage patterns |
| Nautical charts | Not specified (may use open nautical chart data) |

### Open Platform Strategy
Keeano describes itself as an "open platform empowering integrations with startups" — specifically for:
- Book a Berth services
- Book an Experience services

---

## 11. Founders

### Ilias Bogordos — Co-Founder & CEO
- Background in **Applied Physics research** + significant experience as a **software engineer**
- Holds an **MBA**
- Member of **EO (Entrepreneurs' Organization) Accelerator**
- Combined passion for app design with love for the sea
- Keeano is his first startup
- LinkedIn: linkedin.com/in/eliasbogordos/
- Based in Athens, Greece (company registered in Nicosia, Cyprus)

### George Panagakis — Co-Founder & Software Architect
- Technical co-founder handling software architecture
- Less public presence than Bogordos
- Limited public background information available

### Team
- Started with **3 founding engineers/maritime enthusiasts**
- Grew to **7 team members** after seed funding
- Company registered in **Nicosia, Cyprus** (founded 2017)

---

## 12. Funding

### Confirmed
- **Pre-Seed round** — amount not publicly confirmed on Crunchbase (your figure of $326K may come from Tracxn or PitchBook)
- **Investor**: The Egg (egg - enter grow go) — Eurobank's startup accelerator/incubator in Greece
- No further funding rounds publicly disclosed

### Awards & Programs
- **2017**: Selected among Greece's top 30 startups via Eurobank's "Enter-Grow-Go" (egg) initiative
- **2018**: Won **BlueGrowth** competition for best maritime startup in Greece

### Further Rounds
- No Series A, Seed, or additional funding rounds found in public records
- Company appears to be bootstrapping/lean after the pre-seed

---

## 13. Social Media Presence & Community Size

| Platform | Handle | Followers/Size |
|---|---|---|
| Facebook | @keeanoapp | ~6,000 likes, ~6,100 followers |
| Instagram | @keeanoapp | ~2,605 followers, 382 posts |
| LinkedIn | keeano | ~501 followers |
| X (Twitter) | @keeanoapp | Present, metrics unknown (likely small) |

### Community Assessment
- **Very small community** — total social following under 10,000 across all platforms
- Instagram is the most active channel (382 posts)
- No visible community forum, Discord, or dedicated user group
- Trips can be made "public" for community discovery but unclear how active this is

---

## 14. Press Coverage, Interviews & Blog Posts

### Press Articles
- **Neos Kosmos** (Aug 2019): "Keeano, the Greek startup making a splash at beaches" — profile of the company and founder
- **The Pappas Post**: "New App Helps You Find Nudist Beaches in Greece" — early coverage focusing on the nudist beach feature

### Industry Mentions
- Listed in multiple "Best Sailing Apps" roundups for 2024/2025:
  - Yachting.com
  - TwoGetLost.com
  - CatamaranShow.com
  - Croatia-Yachting-Charter.com
  - ASailingstory (WordPress)
- **Not covered by TechCrunch, EU-Startups, or major tech press** — no results found

### Awards
- Top 30 Greek Startups (Eurobank egg, 2017)
- BlueGrowth winner (best maritime startup in Greece, 2018)

### Blog (blog.keeano.com)
- "Create, share, set sail with a new Dynamic Trip planner!" — feature announcement
- "Coast View: users' new favorite feature and how to use it" — feature guide
- "MarineTraffic x keeano" — partnership announcement
- Note: blog.keeano.com SSL certificate has expired

### Profiles
- Crunchbase: crunchbase.com/organization/keeano
- Tracxn: tracxn.com/d/companies/keeano/
- The Org: theorg.com/org/keeano
- RocketReach: profiles for both founders

---

## Summary Assessment

### Strengths
- Unique Coast View feature (800K aerial photos) — no competitor has this
- Strong Mediterranean POI database (40K+ destinations)
- MarineTraffic partnership gives real AIS data
- ML-powered recommendation engine is differentiated
- Collaborative trip planning with crew features
- Free app, low barrier to entry

### Weaknesses
- Extremely small user base and community (<10K social followers)
- Very few app reviews (3 iOS ratings)
- Mediterranean-only coverage
- No clear revenue model / monetization
- Minimal press coverage
- SSL certificate expired on blog subdomain (maintenance concern)
- Pivot from beach-goers to boating alienated early users
- Small team (7 people) with limited funding
- No evidence of further funding beyond pre-seed

### Competitive Position
Competes with Navily (40K+ anchorages, 1M+ community), Savvy Navvy (smart routing), Navionics (charts), and Dockwa (berth booking). Keeano's differentiators are Coast View aerial photos and ML-powered recommendations, but it is significantly smaller than these competitors.
