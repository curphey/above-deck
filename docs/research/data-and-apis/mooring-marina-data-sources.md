# Mooring, Marina & Anchorage Data Sources

Research into available data sources for marina, mooring, and anchorage information.
Last updated: 2026-03-30

---

## 1. Official / Government Sources

### UKHO (UK Hydrographic Office) / ADMIRALTY

- **What they offer:** Tidal data API, bathymetry, maritime limits, wrecks/obstructions, offshore infrastructure. Available via the ADMIRALTY Developer Portal.
- **Marina/mooring data:** No dedicated marina or mooring facility API. Port data collaboration exists but is focused on navigational safety, not leisure facility listings.
- **Tidal API:** Free tier available. Covers British Isles and Ireland with tidal heights and streams.
- **Developer portal:** https://www.admiralty.co.uk/access-data/apis
- **Licensing:** Commercial licensing for chart data. Tidal API has a free tier.

### NOAA (US)

- **PORTS system:** Physical Oceanographic Real-Time System provides real-time water levels, currents, meteorological data for 175+ US seaports. Publicly accessible at tidesandcurrents.noaa.gov.
- **Marina/mooring data:** No marina facility database. NOAA focuses on navigational/oceanographic data, not leisure facilities.
- **US Harbors (usharbors.com):** Third-party site aggregating harbor guides for 1,400+ US harbors with tide charts and marine weather. Not a government source but uses NOAA data.
- **Data.gov:** Marine navigation datasets available at catalog.data.gov but focused on charts and navigation, not facility listings.

### UK Government / Port Authorities

- **data.gov.uk:** Statutory harbour limit boundary polygons for Scotland. Illustrative only, not facility data.
- **Harbour Orders Register:** GOV.UK maintains a register of harbour revision/empowerment orders (administrative, not facility data).
- **ports.org.uk:** Searchable database of UK ports by type (Trust, Municipal, Private) and usage (Leisure, Fishing, Commercial). Not an API -- web scraping would be required.

### EMSA (European Maritime Safety Agency)

- **Central Location Database (CLD):** Contains UN/LOCODE locations and IMO port facility data from GISIS. Available via web services (system-to-system interface). Focused on commercial shipping security, not leisure marina data.
- **Access:** Requires formal agreement with EMSA. Not suitable for leisure marina data.

### Summary: Government Sources

Government/hydrographic offices do **not** maintain leisure marina or anchorage facility databases. Their data covers navigational safety (depths, tides, hazards, shipping lanes). Marina facility data lives in the commercial and crowdsourced ecosystem.

---

## 2. Crowdsourced Platforms

### ActiveCaptain (Garmin)

- **Overview:** The largest crowdsourced marine POI database. Hundreds of thousands of contributors. Covers marinas, anchorages, local knowledge, and hazards worldwide.
- **Data:** Marina reviews/ratings, anchorage reviews, hazard markers, local knowledge POIs. Includes user-submitted photos, fuel prices, contact info.
- **API access:** Free developer access via the ActiveCaptain Developer Portal. Provides a bounding box API to query POIs by geographic area. Includes a filter WebView for embedding.
- **Developer portal:** https://activecaptain.garmin.com/Developer
- **Authentication:** API key based. Single company login shared across team.
- **Licensing:** Free access for developers. Terms require contacting Garmin. Likely restrictions on competing products or data redistribution.
- **Strengths:** Massive dataset, global coverage, active community, free API.
- **Weaknesses:** Garmin-owned -- could restrict access. Data quality varies (crowdsourced). No guarantee of API stability.

### Navily

- **Overview:** 1.1M+ users, 25,000+ marinas and anchorages. Focused on Mediterranean and Caribbean. Marina booking available for 700+ marinas in Europe.
- **Data:** Crowdsourced reviews, protection scores (combining weather forecasts with shelter analysis), real-time weather at anchorages, photos.
- **API access:** No public developer API. Navily consumes weather APIs (Meteomatics) but does not appear to expose its own data via API.
- **Ownership:** Independent company (not acquired by Garmin -- this is distinct from Navionics). Based in France.
- **Premium model:** Navily Premium subscription for users. B2B partnerships with weather data providers.
- **Strengths:** Strong Mediterranean coverage, innovative protection scoring, weather integration.
- **Weaknesses:** No API. Closed ecosystem. Would require partnership negotiation.

### Noforeignland.com

- **Overview:** Free, crowd-sourced sailing community. Database of 20,000+ member contributions linked to 7,500+ locations. Popular among cruising sailors.
- **Data:** Anchorage reviews, marina info, services (dinghy docks, launderettes, engineers, fuel), photos. Also provides free yacht tracking (GPS or commercial tracker integration).
- **API access:** No documented public API. The platform integrates with tracking services (Iridium, Garmin inReach, etc.) for boat position reporting. Data appears to be web-only.
- **Strengths:** Authentic cruiser community. Good coverage of remote/cruising destinations. Free. Real sailor contributions.
- **Weaknesses:** No API. Relatively small dataset. Would need partnership or web scraping (with permission).

### OpenSeaMap

- **Overview:** Open-source project building a free nautical chart layer on top of OpenStreetMap. Founded 2009.
- **Data:** Seamarks (buoys, beacons, lights), port facilities (walls, piers, fuel stations, cranes), some marina data. All stored in the OSM database.
- **Data access:** All data under ODbL license (Open Database License). Free to use with attribution. Accessible via OSM/Overpass API.
- **GitHub:** 38 repositories at github.com/openseamap
- **Strengths:** Fully open. ODbL license. Community-maintained. No API restrictions.
- **Weaknesses:** Marina facility data is sparse compared to dedicated platforms. Volunteer-maintained quality. Focus is more on navigational marks than facility details.

### CAptain's Mate (Cruising Association, UK)

- **Overview:** App from The Cruising Association (theca.org.uk). 20,000+ member contributions across 7,500+ locations.
- **Data:** Curated cruising information from CA members. Higher quality than pure crowdsource due to editorial oversight.
- **API access:** No public API. Members-only data.
- **Strengths:** High quality curated data from experienced cruisers. Strong European coverage.
- **Weaknesses:** Closed, members-only. No API.

---

## 3. Commercial APIs & Data Providers

### Marinas.com

- **Overview:** Marina aggregator and booking platform with API access.
- **API endpoints:**
  - `GET https://api.marinas.com/v1/points/search` -- search all POI types by lat/lon
  - `GET https://api.marinas.com/v1/marinas/search` -- marina-specific search
- **POI types:** Marina, harbor, anchorage, inlet, bridge, lock, lighthouse, ferry, landmark, ramp.
- **Data fields:** Name, kind, rating, review_count, location, images (multiple sizes), web_url, api_url, icon_url.
- **Authentication:** API key via `access_token` query parameter or `Authorization: Bearer` header.
- **Supports:** Both authenticated and unauthenticated requests.
- **Documentation:** https://marinas.com/developers/api_documentation
- **Licensing/pricing:** Not publicly documented. API access appears to be free or freemium.
- **Strengths:** Real API with documentation. Multiple POI types. Image data.
- **Weaknesses:** Primarily US-focused. Data depth unclear.

### Waterway Guide

- **Overview:** Long-established cruising guide publisher (North America and Caribbean). Nine regional editions.
- **Coverage:** Great Lakes, Atlantic coast (Maine to Georgia), Gulf Coast, Bahamas, Turks & Caicos, Cuba.
- **Data:** Marinas (detailed amenity listings), anchorages (depth, holding, protection), fuel docks (pricing), service yards, bridge clearances, lock procedures, navigation alerts (updated daily).
- **API/licensing:** B2B data licensing to marine platforms. Current partners: Raymarine (included in LightHouse Chart Premium), Aqua Map, iNavX, Savvy Navvy, SEAiq.
- **Access:** No public API. Commercial licensing agreement required. Contact via waterwayguide-data.com.
- **Strengths:** Expertly curated, high-quality data. Strong US/Caribbean coverage. Established distribution network.
- **Weaknesses:** Commercial only. No public API. North America/Caribbean only.

### Dockwa

- **Overview:** Marina management and booking platform. 400K+ boaters. Used by marinas for slip management, reservations, fuel sales.
- **Data:** Real-time berth availability (based on LOA rules, blocked periods, occupancy), transient booking, fuel pricing.
- **API access:** No public developer API. Provides embeddable booking widgets for marina websites. Integrates with accounting systems (QuickBooks, Sage, Xero).
- **Strengths:** Real-time availability data. Large marina network.
- **Weaknesses:** B2B focused (marina operators, not consumers). No public API. Data locked in their platform.
- **Website:** https://marinas.dockwa.com

### Cruising Guide Publications (Caribbean)

- **Overview:** Publisher of Caribbean cruising guides with a mobile app (launched 2024).
- **Data:** Detailed anchorage information, navigation data for Virgin Islands, Leewards, Windwards, Trinidad & Tobago.
- **Access:** Subscription-based app. Downloadable for offline use. No API.
- **Strengths:** Deep Caribbean coverage. Offline capable.
- **Weaknesses:** Subscription/commercial. No API.

### Marinesia API

- **Overview:** Marina management API.
- **Documentation:** https://docs.marinesia.com/features/
- **Details:** Limited information found. Appears to be a marina operations platform rather than a consumer data API.

---

## 4. OpenStreetMap Marine Data

### Relevant Tags

**Primary facility tags:**
- `leisure=marina` -- Marina facility (~15,000-20,000 objects worldwide, estimated)
- `leisure=slipway` -- Boat launching ramp (~7,900 ways/areas)
- `harbour=yes` -- General harbour designation
- `waterway=boatyard` -- Boat construction/repair facility
- `waterway=fuel` -- Marine fuel station
- `waterway=sanitary_dump_station` -- Pump-out facility

**Marina detail tags:**
- `name=*` -- Facility name
- `capacity=*` -- Number of berths/boats
- `vhf=*` -- VHF radio channel
- `website=*`, `phone=*` -- Contact details
- `mooring=yes` -- Mooring available
- `depth=*` -- Water depth

**Service/amenity tags (used within marina areas):**
- `amenity=toilets`, `amenity=shower` -- Sanitary facilities
- `amenity=restaurant` -- On-site dining
- `amenity=boat_storage` -- Storage
- `amenity=boat_rental` -- Charter/rental
- `shop=boat` -- Chandlery/boat shop
- `office=harbour_master` -- Harbour master office
- `man_made=pier` with `mooring=yes/ferry` -- Mooring structures
- `man_made=crane` -- Lifting equipment

**Seamark tags (via OpenSeaMap):**
- `seamark:type=mooring` -- Mooring buoys
- `seamark:type=anchorage` -- Anchorage areas
- `seamark:type=harbour` -- Port/harbour markers

### Overpass API Queries

Example: Find all marinas within a bounding box:
```
[out:json][timeout:25];
(
  node["leisure"="marina"]({{bbox}});
  way["leisure"="marina"]({{bbox}});
  relation["leisure"="marina"]({{bbox}});
);
out body;
>;
out skel qt;
```

Example: Find all marine fuel stations in an area:
```
[out:json][timeout:25];
(
  node["waterway"="fuel"](50.0,-5.0,51.0,-3.0);
  way["waterway"="fuel"](50.0,-5.0,51.0,-3.0);
);
out body;
```

### OSM Data Quality Assessment

- **Strengths:** Global coverage. Free (ODbL). Well-structured tagging system. Active community. Overpass API for flexible queries.
- **Weaknesses:** Highly variable quality by region. European/North American marinas better mapped than Caribbean/Pacific. Facility detail tags (capacity, VHF, depth) are often missing. No reviews, ratings, or real-time availability. Relies on volunteer mappers.
- **Best use:** As a base layer / fallback. Combine with crowdsourced review data from ActiveCaptain or similar.

---

## 5. What Data Points Matter for Cruisers

### Moorings
- Availability (number of moorings, real-time occupancy if possible)
- Cost per night (by LOA brackets)
- Who to call (VHF channel, phone number)
- Max LOA / max draft
- Depth at mooring
- Holding type (if swing moorings)
- Pick-up procedure (bow-to, stern-to, Mediterranean moor)

### Marinas
- Berth availability (real-time if possible, otherwise seasonal patterns)
- Rates (transient/visitor, long-term, by LOA bracket)
- Max LOA / max beam / max draft
- Facilities: fuel (diesel/petrol), water, shore power (amperage/voltage), WiFi, laundry, showers, toilets, pump-out
- Boatyard services: haul-out, hard standing, crane capacity
- VHF channel, phone, email, website
- Opening hours / reception hours
- Payment methods accepted
- Approach information (channel depth, hazards, leading marks)

### Anchorages
- Holding quality (mud, sand, rock, weed, coral)
- Protection profile (which wind directions are sheltered)
- Depth range (min/max, variation with tide)
- Restrictions (no anchoring zones, marine reserves, time limits)
- Dinghy landing options (beach, public dock, marina dinghy dock)
- Swell exposure
- Crowding (seasonal patterns)
- Mobile signal / WiFi availability

### Harbour Services
- Harbour master contact (VHF, phone, location)
- Customs / immigration office (location, hours, procedures)
- Chandlery
- Marine engineers / mechanics
- Sail repair / rigging
- Provisioning (supermarket proximity, fresh market days)
- LPG / propane refill locations
- Laundry services
- Medical facilities
- Transport links (bus, taxi, ferry to mainland)

---

## 6. Recommended Integration Strategy

### Tier 1: Free / Open (Build First)

| Source | Data Type | Access Method | License |
|--------|-----------|---------------|---------|
| OpenStreetMap / OpenSeaMap | Base marina/harbour locations, facility tags | Overpass API | ODbL (free, attribution required) |
| ActiveCaptain (Garmin) | Crowdsourced reviews, ratings, POIs | REST API (free developer access) | Garmin terms (apply via developer portal) |
| Marinas.com | Marina search, ratings, images | REST API | Free/freemium (API key required) |
| PVGIS | Solar irradiance for energy planning | REST API | Free (EU JRC, no key required) |

### Tier 2: Commercial Partnerships (If Budget Allows)

| Source | Data Type | Access Method | Notes |
|--------|-----------|---------------|-------|
| Waterway Guide | Curated US/Caribbean marina & anchorage data | B2B data license | High quality. Contact waterwayguide-data.com |
| Navily | Mediterranean anchorage data with protection scores | Partnership negotiation | No public API. Strong Med coverage |
| Cruising Association (CAptain's Mate) | European cruising data | Membership / partnership | High quality curated data |

### Tier 3: Community-Built (Long Term)

Build our own crowdsourced layer on top of OSM base data. Let the community contribute:
- Anchorage reviews and holding reports
- Marina facility updates and pricing
- Local knowledge (services, provisioning, customs procedures)
- Photos and approach information

This mirrors the ActiveCaptain model but with open data (ODbL or similar).

---

## 7. Key Gaps in Available Data

1. **Real-time availability:** No open source for live berth/mooring availability. Dockwa has it but no public API.
2. **Pricing data:** Fragmented. Some on ActiveCaptain reviews, some on Marinas.com. No standardised, up-to-date pricing database.
3. **Caribbean/Pacific coverage:** Significantly weaker than Europe/US across all platforms. Noforeignland and cruising guides are the best sources.
4. **Approach/pilotage information:** Lives in official charts (UKHO, NOAA) and pilot books. Not available via simple APIs.
5. **Customs/immigration procedures:** Almost entirely in cruising guides and forums. No structured data source.
