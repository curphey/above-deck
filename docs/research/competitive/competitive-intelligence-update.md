# Competitive Intelligence Update — Missing Research Areas

**Date:** 2026-03-27
**Researcher:** Claude (web research)
**Status:** Initial research — needs human review

---

## 1. YachtOS — AI-Powered Superyacht Operating System

### YachtOS Command (yacht-os.com)

**What it is:** An AI-powered captain's assistant for superyacht management. Claims to be "the world's first and only yacht platform built natively on Anthropic's Model Context Protocol (MCP)."

**Who makes it:** YachtOS, part of the Thrive Venture Labs portfolio (venture-backed startup).

**Target market:** Superyacht captains, crew, fleet managers, and owners. Enterprise/luxury segment — not recreational sailors.

**Key features:**
- Voice and chat-based command interface (uses ElevenLabs for voice synthesis)
- Predictive maintenance tracking
- Weather routing
- Automated task routing and crew coordination
- Real-time fleet visibility and compliance management
- Integration with 5,000+ ports worldwide
- Multi-AI: Claude, GPT-4, Grok

**Pricing:** Enterprise, custom quotes only. Claims 30% cost reductions and 10+ hours saved weekly.

**Relevance to Above Deck:** YachtOS targets the superyacht/crewed vessel market with enterprise pricing. Their MCP-native approach is notable — they are claiming first-mover status on MCP for marine. However, their market (superyachts, professional crews) is entirely different from Above Deck's target (cruising sailors, DIY boat owners). The MCP architecture concept validates Above Deck's own AI crew agent direction, but YachtOS is not a direct competitor.

### Zora by iNav4U (inav4u.com)

**What it is:** An intelligent operating system for yachts 40ft+, developed by iNav4U (based in Oxford, Nova Scotia, Canada).

**Hardware + software:** Runs on a dedicated server appliance (Zora 3.0 Server). Not pure software.

**Key features:**
- Automatic chart updates from cloud
- Real-time weather rerouting
- System monitoring and predictive alerts
- Integration with existing yacht equipment
- Centralised control across multiple vessel systems

**Pricing:** US$650 deposit for pre-order, shipping April 2026. Full system price not disclosed (configurator tool suggests variable pricing).

**Relevance to Above Deck:** Zora is closer to Above Deck's vision — a unified boat OS for mid-size yachts. The hardware requirement (dedicated server) is both a strength (reliability) and a weakness (cost, vendor lock-in). Above Deck's software-only, open-source approach is a clear differentiator. Watch this one.

### SuperyachtOS (superyachtos.com)

**What it is:** Compliance management software for superyachts. ISM, MLC compliance, crew management, safety documentation.

**Relevance:** Different market entirely (compliance/regulatory for commercial superyachts). Not a competitor.

**Sources:**
- [YachtOS Command](https://www.yacht-os.com/)
- [iNav4U / Zora](https://www.inav4u.com/)
- [SuperyachtOS](https://superyachtos.com/)

---

## 2. Circumnavigation Planning Tools

### Current landscape

There is a striking gap in the market: **no dedicated software tool exists for multi-year circumnavigation route planning.** Bluewater sailors currently rely on:

1. **Jimmy Cornell's books** (not software) — "World Cruising Routes" (9th edition) covers ~1,000 routes with 6,000+ waypoints, seasonal timing, wind/current data, and climate change impacts. Companion volumes: "World Voyage Planner" (strategy) and "World Cruising Destinations" (country info). These are reference books (Imray publishing), not interactive tools. The 9th edition notably assesses climate change impacts on traditional routes.

2. **Weather routing tools used for individual passages** (not multi-year planning):
   - **PredictWind** — best-in-class for passage-level weather routing
   - **FastSeas** — calculates fastest route given NOAA GFS forecast, currents, vessel performance, and comfort criteria. Free tier available.
   - **Savvy Navvy** — smart routing with weather/tides/depth
   - **Bluewater Racing** — free, uses NOAA data, Windows/Mac
   - **SimSail** — free software for navigation, weather analysis, route planning
   - **SailRouting.com** — passage-level optimisation

3. **Noonsite.com** (see below) — country-by-country cruising information

### Noonsite.com — The cruiser's bible

**What it is:** "The Ultimate Cruisers' Planning Tool" — a comprehensive web resource for sailors planning passages and country visits.

**History:** Founded by Jimmy Cornell in January 2000. Originally managed by his daughter Doina. In June 2023, ownership transferred to the World Cruising Club (which Cornell founded in 1986 for the ARC rally).

**Features:**
- Country guides for 250+ destinations with formalities, anchorages, conditions
- Community reports from cruisers with firsthand experiences
- News and security updates (including orca interaction alerts)
- Clearance formalities checklists
- Navigation tips and planning resources

**Business model:** Freemium. Core info is free; enhanced features require membership (member-only discounts, interactive maps, community features).

**Relevance to Above Deck:** Noonsite is the incumbent for cruising destination/formalities data. It is text-heavy, web 1.0 in feel, and not integrated with any routing or planning tools. A circumnavigation planning tool that combined Noonsite-quality country data with interactive route planning, seasonal timing overlays, and community input would be highly differentiated. The World Cruising Club ownership means this data is unlikely to be open-sourced.

### The opportunity

Above Deck's circumnavigation agent concept fills a genuine void. No existing tool lets a sailor say "I want to sail around the world in 3-5 years starting from the Med" and get back an interactive, seasonally-optimised route with country requirements, weather windows, and community waypoints. Jimmy Cornell's books provide the knowledge; nobody has made it interactive.

**Sources:**
- [Jimmy Cornell — World Cruising Routes 9th Edition](https://cornellsailing.com/publications/world-cruising-routes/)
- [Noonsite.com](https://www.noonsite.com/)
- [Noonsite changes hands — Cruising World](https://www.cruisingworld.com/noonsite-website-cruisers-changes-hands/)
- [FastSeas](https://fastseas.com/)
- [Savvy Navvy](https://www.savvy-navvy.com/)
- [Bluewater Racing](https://www.bluewaterracing.com/)

---

## 3. Cruising Administration & Clearance Tools

### Electronic customs clearance systems

**SailClear (sailclear.com)**
- Developed by the Caribbean Customs Law Enforcement Council (CCLEC) in 2013
- Pre-arrival notification system for pleasure craft
- Users register, enter voyage/crew/passenger/stores data; data goes directly to customs/immigration/port authorities
- Currently used in 9 countries: Anguilla, BVI, Grenada, Montserrat, St Kitts & Nevis, St Lucia, Cayman Islands, Turks & Caicos, Bermuda
- Recently introduced a subscription fee (previously free)
- Weakness: Caribbean-only, limited country coverage

**eSeaClear (eseaclear.com)**
- Also developed by CCLEC
- Electronic arrival/departure notifications to participating Caribbean customs administrations
- Currently active in Antigua (and expanding)
- Overlap with SailClear is confusing — both from CCLEC

**CBP ROAM App (US Customs & Border Protection)**
- Free mobile app for pleasure boaters entering the US
- Covers Great Lakes, most of East Coast (Delaware to Florida), Texas, San Diego, US Caribbean territories
- Added cruising license features in September 2021
- US-only

**Bahamas Sea-Z Marina Online Portal**
- Online processing for yacht charter fees, cruising permits, charter licences
- Bahamas-only

### What's missing

There is **no unified global clearance tool**. Each country/region has its own system (or none at all). Sailors clearing into Pacific islands, Southeast Asia, or the Mediterranean still rely on paper forms and in-person visits. No "Clearance Bot" product was found in research.

### Insurance requirements

**Current state:** No centralised database of country-by-country insurance requirements exists for cruising yachts. Key findings:
- Bluewater cruising insurance has become significantly harder and more expensive to obtain
- Most marinas/harbours require proof of insurance; some countries require it for entry
- P&I clubs (13 globally) handle most international yacht insurance
- Insurers increasingly require documented offshore experience
- Rising deductibles are pushing some cruisers to go uninsured
- YachtSecure (yachtsecure.com) has an extensive database of yachts with premiums/conditions displayed online

**Opportunity:** A database of country-by-country insurance requirements (minimum third-party liability, coverage areas, specific insurer requirements) would be valuable to cruisers. This data is currently scattered across forums, Noonsite country pages, and insurance broker websites.

**Sources:**
- [SailClear](https://sailclear.com/)
- [CCLEC — SailClear](https://www.cclec.org/about-us/sailclear/)
- [eSeaClear](https://www.eseaclear.com/home/index.cfm)
- [CBP ROAM](https://www.cbp.gov/travel/pleasure-boats/pleasure-boat-overview/roam)
- [Noonsite — SailClear subscription fee](https://www.noonsite.com/news/caribbean-clearance-sailclear-announces-subscription-fee-for-service/)
- [Bluewater cruising insurance — Yachting World](https://www.yachtingworld.com/features/bluewater-cruising-insurance-138036)
- [Offshore insurance challenges — Morgan's Cloud](https://www.morganscloud.com/2021/06/03/insurance-for-offshore-voyaging/)

---

## 4. Marine Digital Switching Systems

### Major players

**CZone (BEP Marine / Power Products)**
- Market leader in marine digital switching
- Relationships with both Garmin and Navico (Simrad/Lowrance/B&G) brands
- NMEA 2000 native — replaces analog wiring with digital backbone
- Products: Output Interface (~$1,367), Motor Output Interface (~$997), Combination Output Interface/COI (~$2,621)
- COI: 30-channel unit (6 digital inputs, 8 analog inputs, 12 low-current outputs, 4 high-current 25A outputs) — complete system in one box
- Entry-level keypads from ~$220; basic retrofit systems under $500
- Industry standard Deutsch connectors, plug-and-play

**EmpirBus (now Garmin)**
- Originally distributed by Raymarine, acquired by Garmin
- Connect 50 model: 20 programmable DC output channels, targets smaller/simpler installations
- Sophisticated programming capabilities
- Garmin Boat Switch module: ~$950 (GBP equivalent)

**Naviop Marine Automation (now Navico/Simrad)**
- Italian brand acquired by Navico
- T-Box N2000 module claims 50+ communication protocols
- Customisable touchscreen displays
- Integrates with Simrad MFDs

**OctoPlex (Carling Technologies)**
- Specialises in AC power distribution
- Solenoid-activated AC breaker panels
- Strong reliability record (Viking yachts)

**Offshore Systems BlackGlass**
- Comprehensive bridge management
- Combines NMEA 2000, Modbus gateways, and programmable logic controllers
- More industrial/superyacht focused

### Simarine Pico

**What it is:** Battery monitor and tank level system (not a digital switching system per se, but increasingly overlapping).

**Pricing:**
- Base PICO unit: EUR 139-193
- Standard Package (300A shunt + sensors): ~EUR 399 / ~USD 500
- NMEA 2000 gateway module (SN01 SiCOM): sold separately (~USD 100-150 on Amazon)

**NMEA 2000 integration:**
- SN01 gateway transmits PICO data onto the NMEA 2000 network: batteries, tanks, temperatures, air pressure
- Can also receive and display engine/transmission data from the NMEA network
- Bidirectional: can control switch banks via NMEA 2000

**Key differentiator:** Beautiful, compact display (2.4" or 3.5"). WiFi built-in with companion app. Very popular in the cruising and campervan communities. Lower price point than CZone.

### Can Above Deck read their data?

**Yes, via NMEA 2000 / Signal K.** All major digital switching systems communicate over NMEA 2000. Signal K (which Above Deck already plans to integrate) can read NMEA 2000 data via gateway devices. This means:
- CZone switch states, load data = readable via Signal K
- EmpirBus/Garmin switch data = readable via NMEA 2000 to Signal K
- Simarine PICO battery/tank data = readable via SN01 gateway to NMEA 2000 to Signal K
- Writing/controlling switches is also theoretically possible but raises safety concerns

**Critical caveat from Panbo research:** Documentation quality, software ownership, manual overrides, and long-term manufacturer support are recurring concerns. Several experts emphasise reliability risks and the need for robust fallback systems on critical vessel functions (bilge pumps, navigation lights).

**Pricing summary:**
| System | Entry cost | Full system | Target |
|--------|-----------|-------------|--------|
| CZone COI | ~$500 (retrofit kit) | $2,600-5,000+ | Mid-range boats |
| EmpirBus/Garmin | ~$950 (single module) | $3,000-8,000+ | Garmin ecosystem |
| Simarine PICO | ~$400-500 (package) | $500-800 | Monitoring (not switching) |
| Naviop | Custom | $5,000-15,000+ | Simrad ecosystem |
| OctoPlex | Custom | $5,000-20,000+ | Large vessels |

**Sources:**
- [Panbo — Digital Switching Overview](https://panbo.com/digital-switching-raymarine-empirbus-simrad-naviops-offshore-octoplex-garmin-and-czone/)
- [Panbo — Digital Switching Gets Easier](https://panbo.com/digital-switching-gets-easier-cheaper-and-more-compelling/)
- [CZone Marine](https://czone.navico.com/marine/)
- [Simarine PICO](https://simarine.net/product/pico-battery-monitor/)
- [Simarine NMEA 2000 Gateway](https://simarine.net/product/nmea-2000/)
- [Yacht Devices — NMEA 2000 Digital Switching](https://www.yachtd.com/news/new_nmea_digital_switching.html)

---

## 5. Noforeignland — Competitive Analysis

**Website:** noforeignland.com
**What it is:** A free, crowd-sourced sailing community platform — part social network, part cruising guide, part vessel tracker.

### Features

**Destination data:**
- Sailor-contributed anchorages, marinas, dinghy docks, launderettes, engineers, fuel stops
- Photos and reviews from people who have actually visited
- Country-level sailing guides compiled from contributions (popular destinations + clearance formalities)

**Vessel tracking:**
- Built-in GPS tracking via the app
- Integrates with commercial trackers (InReach, YB, etc.) to aggregate live positions
- Combines data from all major tracking providers into one map
- Free yacht tracker (notable — most tracking services charge)

**Social features:**
- Boat Groups for interest-based communities (e.g., Kids4Sail with 1,000+ boats, Women Who Sail, pet owners, Lagoon owners, Starlink users, scuba divers)
- Community Posts for location-based group chat
- Direct messaging between boats
- "Finding Dory" organised Atlantic crossings (community-organised rallies, 40-50 boats per season)

**Journey documentation:**
- Stories with images, videos, blog links attached to locations
- Monthly photo competition

**Additional:**
- Downloadable courtesy flag packs
- Magazine/blog content

### Business model

Free to use. Funded by voluntary "supporter badge" monthly pledges and partnerships. No tiered paywalls, no data selling.

### User base

Exact total not publicly disclosed. Indicators:
- Kids4Sail group alone has 1,000+ boats
- Finding Dory Atlantic crossings attract 40-50 boats per season
- Active across Med, Caribbean, Pacific, Atlantic, Alaska
- Estimated total: likely 5,000-15,000 active boats (based on group sizes and geographic spread)

### Strengths
- Genuinely free and community-driven (no VC pressure, no dark patterns)
- Excellent crowd-sourced destination data from real cruisers
- Free vessel tracking aggregating multiple tracker providers
- Strong interest-based community groups (particularly for families)
- Clean, functional mobile app (iOS and Android)
- Trusted by the cruising community

### Weaknesses
- No navigation/chartplotter features
- No weather routing or passage planning
- No boat systems monitoring
- Limited revenue model (donation-dependent = fragile)
- Data quality depends entirely on community contributions (uneven coverage)
- No AI or intelligent features
- Website/app design is functional but not modern

### Relevance to Above Deck

Noforeignland is the closest thing to a community-driven sailing platform that exists. It validates the community-first approach. However, it deliberately stays in the "social + destination guide" lane and does not attempt navigation, boat management, or technical tools. Above Deck could complement or eventually compete with NFL by offering community features alongside technical tools. The integration of community knowledge (anchorage reviews, clearance info) into a chartplotter/planning tool is the gap.

**Sources:**
- [Noforeignland](https://www.noforeignland.com)
- [Noforeignland — Fit2Sail review](https://www.fit2sail.com/countdown-to-cruising/2025/5/18/noforeignland-an-excellent-resource-for-cruisers)
- [Noforeignland — Finding Dory IV](https://blog.noforeignland.com/announcing-finding-dory-iv-an-online-community-crossing-the-atlantic-east-west-2025-2026-season/)
- [Noforeignland — App Store](https://apps.apple.com/us/app/noforeignland/id1514021648)
- [Yachting World — Online sailing communities](https://www.yachtingworld.com/special-reports/online-sailing-communities-and-apps-speaking-to-sailing-la-vagabonde-stars-157153)

---

## 6. SeaPeople App — Update

**Website:** seapeopleapp.com
**Current version:** 3.1.0 (February 13, 2026)
**Founded:** 2024

### Founders
- **Logan Rowell** (CEO) — 18+ years in recreational marine industry, community building
- **Jean-Michel Lemieux** (CTO) — Former CTO of Shopify
- **Caroline Rowell** (CFO) — NYC boating business owner, created YCA
- **Sailing La Vagabonde** — prominent sailing YouTube channel (1.8M+ subscribers) as marketing co-founder/partner

### Growth trajectory
- Launched October 2024
- August 2025: 58,000 users, 3.5 million miles logged
- March 2026: 80,000+ users, 8.5 million miles logged
- Independent, founder-led (no disclosed VC funding, though former Shopify CTO involvement suggests access to capital)

### Current features (v3.0/3.1)

**Route Discovery:**
- 2.5M+ miles of real user tracks, heatmapped
- Search and sort routes by boat type, recency
- Collections of curated trips by region
- Bucket lists for personal trip planning

**Trip logging:**
- GPS tracking with "Mid-Track Updates" (Voyages) — post notes, photos, videos while underway
- Automatic trip logging
- Year-on-Water annual summary

**Social:**
- Challenges (miles, trips, hours) with brand partner perks and profile trophies
- Home feed of activity
- Customisable notifications
- Community of 80,000+ across boaters, paddlers, anglers, shoresiders

### Business model

Not disclosed. The app is currently free. Given the Shopify CTO co-founder and brand partnership infrastructure (challenges with partner perks), likely monetisation paths include:
- Brand partnerships and sponsored challenges
- Premium features (not yet implemented)
- Data/insights for marine industry

### Relevance to Above Deck

SeaPeople is growing fast and has strong marketing muscle (Sailing La Vagabonde partnership). However, it is fundamentally a **trip logging and social app** — a marine Strava. It has no navigation, no chartplotter, no boat systems management, no passage planning, and no community knowledge base. The heatmap route discovery feature is clever and could inform Above Deck's community route features. The 80K user base in 18 months shows there is demand for modern, well-designed marine apps.

**Watch factor: HIGH.** The Shopify CTO brings serious product/engineering capability. If SeaPeople expands into navigation or boat management, they could become a more direct competitor.

**Sources:**
- [SeaPeople](https://seapeopleapp.com/)
- [SeaPeople About Us](https://seapeopleapp.com/about-us)
- [SeaPeople v3.0 Release](https://seapeopleapp.com/blog/new-release3-0)
- [SeaPeople v2.0 Release](https://seapeopleapp.com/blog/new-release)
- [SeaPeople Year on Water 2025](https://seapeopleapp.com/blog/seapeople-year-on-the-water-2025)
- [SeaPeople Google Play](https://play.google.com/store/apps/details?id=com.seapeopleapp.seapeople)

---

## 7. Marine Regulatory & Legal for Software Navigation

### Regulatory framework summary

**Commercial vessels (SOLAS):**
- IMO mandates ECDIS (Electronic Chart Display and Information System) for vessels over 500 GT on international voyages
- ECDIS must be type-approved by authorised testing laboratories
- Type approval requires compliance with IMO Performance Standards + IHO requirements
- Must use official S-57/S-101 ENC charts from national hydrographic offices
- Vessels without type-approved ECDIS must carry paper charts as primary navigation
- Updated SOLAS regulation V/19 (effective 2025): mandatory ECDIS for all new passenger ships 500+ GT and cargo ships 3,000+ GT on international voyages
- MSC.530(106) resolution (November 2022) updated performance standards

**Recreational vessels:**
- **No type approval required.** Recreational chartplotters and navigation software are unregulated.
- No IMO/SOLAS requirements apply to pleasure craft
- No requirement for official ENC charts — providers can use their own symbology, colours, and data sources
- No chart correction requirements (commercial ECDIS must be updated with latest Notices to Mariners)
- No certification or testing standards for recreational navigation software
- Essentially: recreational marine navigation software operates in a regulatory vacuum

### Software liability

**Current approach across the industry:**
- All marine navigation software providers include liability disclaimers in EULAs
- Standard clause: liability limited to the purchase price of the software
- No software provider accepts liability for navigation errors, groundings, or incidents
- Death/personal injury from negligence cannot be excluded (standard legal principle)
- Every app includes "not a substitute for proper seamanship" disclaimers

**Key legal principle:** The skipper is always ultimately responsible for safe navigation. Software is an aid, not a replacement for judgment. This is reinforced by maritime law (COLREGS Rule 2 — responsibility of the skipper).

### What this means for Above Deck

**Good news:** There is no regulatory barrier to building a software-only chartplotter or navigation display for recreational vessels. No type approval, no certification, no government testing required.

**Risks to manage:**
1. **Liability disclaimers are essential** — standard EULA language limiting liability is industry practice and should be included from day one
2. **Chart data accuracy** — using official hydrographic data (via NOAA, UKHO, etc.) reduces risk vs. crowd-sourced data
3. **"Not for navigation" vs. "for navigation"** — many apps hedge by saying "for planning purposes only." Making explicit navigation claims raises the liability bar.
4. **Open source consideration** — open-source license + clear disclaimers provides additional protection (no warranty, as-is)
5. **Route suggestions** — if Above Deck's AI agents suggest routes that lead to incidents, the liability question is novel and untested. AI-generated navigation advice is new legal territory.
6. **COLREGS compliance** — any navigation display should not contradict or undermine COLREGS obligations

**No regulations exist specifically for AI-generated navigation advice.** This is a grey area that will likely see regulatory attention as AI marine tools proliferate. Being early, transparent, and conservative (always deferring to skipper judgment) is the right approach.

**Sources:**
- [IMO — Electronic Charts and ECDIS](https://www.imo.org/en/ourwork/safety/pages/electroniccharts.aspx)
- [ECDIS Type Approval Requirements — Amnautical](https://www.amnautical.com/blogs/the-mariners-blog/ecdis-type-approval-requirements)
- [IMO Resolution MSC.530(106)](https://wwwcdn.imo.org/localresources/en/KnowledgeCentre/IndexofIMOResolutions/MSCResolutions/MSC.530(106).pdf)
- [USCG ECDIS Requirements](https://www.dco.uscg.mil/ECDIS/)
- [Wikipedia — Chartplotter](https://en.wikipedia.org/wiki/Chartplotter)
- [Amnautical — Best Maritime Navigation Software](https://www.amnautical.com/blogs/the-mariners-blog/best-maritime-navigation-software)

---

## Summary of Key Findings

| Area | Key insight | Opportunity for Above Deck |
|------|------------|---------------------------|
| YachtOS | AI+MCP for superyachts, not recreational | Validates MCP/AI approach; different market |
| Zora/iNav4U | Hardware+software boat OS, $650+ | Above Deck's software-only approach is more accessible |
| Circumnavigation planning | No interactive tool exists; just books | Major greenfield opportunity for AI agent |
| Noonsite | Incumbent for cruising data; web 1.0 | Integrate similar data into modern planning tool |
| Clearance tools | Fragmented, region-specific, no global solution | Global clearance database would be high-value |
| Insurance | No country-requirement database exists | Community-sourced insurance requirement data |
| Digital switching | CZone dominant; all speak NMEA 2000 | Signal K integration reads all these systems |
| Simarine PICO | Popular, affordable, NMEA 2000 gateway available | Natural integration target for boat monitoring |
| Noforeignland | Best community platform; no technical tools | Above Deck can combine community + tools |
| SeaPeople | Growing fast (80K users); trip logging only | Watch closely; strong team, could expand scope |
| Regulations | No barriers for recreational software nav | Clear disclaimers needed; AI advice is grey area |
