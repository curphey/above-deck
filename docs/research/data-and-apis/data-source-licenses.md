# Data Source Licenses & Terms of Use Research

**Date:** 2026-03-08
**Purpose:** Determine which data sources can legally pre-populate a free, open-source sailing app's POI database.

---

## 1. OpenStreetMap / OpenSeaMap

### OpenStreetMap
- **License:** Open Data Commons Open Database License (ODbL 1.0)
- **Can we store/cache?** YES
- **Can we redistribute?** YES, under the same ODbL license
- **Can we use in open-source?** YES
- **Attribution required:** Must credit "OpenStreetMap contributors" and link to the ODbL license. Display rules vary for browsable maps, printed maps, and static images.
- **Key restrictions:**
  - Share-alike: any adapted database must also be released under ODbL
  - Must not claim the data as your own
  - Documentation is separately under CC BY-SA 2.0
- **Verdict: EXCELLENT FIT.** Full permission to cache, store, and redistribute with attribution and share-alike compliance.

### OpenSeaMap
- **License:** Data under ODbL (same as OSM); chart tiles under CC-BY-SA 2.0
- **Can we store/cache?** YES, including for offline use on devices
- **Can we redistribute?** YES, under ODbL/CC-BY-SA terms
- **Attribution required:** Must credit OpenStreetMap
- **Key restrictions:** Same share-alike requirements as OSM
- **Verdict: EXCELLENT FIT.** Explicitly supports offline use on chart plotters, tablets, smartphones. Tiles can be cached for offline sailing use.

**Sources:**
- https://www.openstreetmap.org/copyright
- https://opendatacommons.org/licenses/odbl/summary/
- https://wiki.openstreetmap.org/wiki/OpenSeaMap

---

## 2. Navily

- **License:** Proprietary, all rights reserved
- **Can we store/cache?** NO
- **Can we redistribute?** NO
- **Can we scrape?** NO -- explicitly prohibited
- **API available?** No public API
- **Key restrictions:**
  - All content is protected by intellectual property rights
  - "All reproduction, use or adaptation, without obtaining prior written agreement from Navily, are strictly prohibited"
  - Scraping, reproducing, distributing, or transmitting content without express written consent is prohibited
  - Violation may result in penal, civil, or administrative penalties
- **Verdict: CANNOT USE.** Navily's data is fully proprietary. No scraping, no API, no reuse permitted. Would need a formal partnership agreement.

**Sources:**
- https://www.navily.com/cgu (General Terms of Use and Sale)

---

## 3. Noonsite.com

- **Owner:** World Cruising Club Limited (taken over from founder Jimmy Cornell)
- **License:** Proprietary copyright -- "Copyright 2006 to present, World Cruising Club Limited, its subsidiaries or agents"
- **Can we store/cache?** NO (not without permission)
- **Can we redistribute?** NO
- **Can we use their port/country data?** NO (not without a licensing agreement)
- **Key restrictions:**
  - All website content (design, text, graphics) is copyrighted
  - No open data license or Creative Commons designation found
  - Standard all-rights-reserved copyright applies
- **Verdict: CANNOT USE without a licensing agreement.** The data is copyrighted by World Cruising Club Limited. Would need to negotiate a data-sharing agreement. However, factual information (e.g., "Country X requires a visa") is generally not copyrightable -- only their specific expression/compilation of it is protected.

**Sources:**
- https://www.noonsite.com/terms-and-conditions/
- https://www.cruisingworld.com/noonsite-website-cruisers-changes-hands/
- https://worldcruising.com/supporters/noonsite

---

## 4. Global Fishing Watch Anchorages

- **License:** Creative Commons Attribution-ShareAlike 4.0 International (CC-BY-SA 4.0)
- **Can we store/cache?** YES
- **Can we redistribute?** YES, under CC-BY-SA 4.0
- **Can we use in open-source?** YES for non-commercial use; commercial use requires clarification
- **Dataset:** ~160,000 anchorage locations associated with ~32,000 ports
- **Attribution required:** Must attribute Global Fishing Watch in any published work
- **Key restrictions:**
  - APIs are explicitly "only available for non-commercial purposes"
  - Share-alike: derivative works must be released under the same CC-BY-SA license
  - A free open-source app with no revenue likely qualifies as non-commercial, but this should be confirmed with GFW
- **Verdict: GOOD FIT with caveats.** The CC-BY-SA license allows redistribution. The non-commercial API restriction needs clarification -- if the app is free and open-source, it likely qualifies, but contacting GFW to confirm is recommended. The 160K anchorage dataset is extremely valuable.

**Sources:**
- https://globalfishingwatch.org/datasets-and-code-anchorages/
- https://globalfishingwatch.org/datasets-and-code/
- https://globalfishingwatch.org/our-apis/documentation

---

## 5. NOAA Data (Charts, Tides, Weather)

- **License:** Public Domain (CC0-1.0 Universal Public Domain Dedication)
- **Can we store/cache?** YES
- **Can we redistribute?** YES, freely
- **Can we use in open-source?** YES, for any purpose
- **Attribution required:** Not legally required, but NOAA requests a citation: "Provided by NOAA Office of Coast Survey" for charts. For weather data, must identify the NWS source if creating copyrighted works predominantly from NWS material.
- **Key restrictions:**
  - Cannot claim to be NOAA or imply government endorsement
  - Cannot use NOAA/NWS trademarks without permission
  - Cannot present altered data as official NOAA products
  - No warranties -- data provided "as is"
  - U.S. public domain status may not apply in all international jurisdictions
- **What's available:**
  - ENC (Electronic Navigational Charts) -- free download
  - PDF nautical charts -- permanent free product
  - Tide and current predictions via API
  - Weather data and forecasts
- **Verdict: EXCELLENT FIT.** US government data is public domain. No license restrictions. Can freely cache, store, redistribute. Best possible legal status for data reuse.

**Sources:**
- https://nauticalcharts.noaa.gov/data/data-licensing.html
- https://www.weather.gov/disclaimer
- https://www.usa.gov/government-copyright
- https://www.noaa.gov/free-noaa-pdf-nautical-charts-now-permanent

---

## 6. ADMIRALTY (UKHO) Data

- **License:** Proprietary Crown Copyright
- **Free Discovery tier available?** Yes, but heavily restricted
- **Can we cache?** NO -- caching is explicitly prohibited on the free Discovery tier ("storing the data in any kind is in breach of Copyright law")
- **Can we redistribute?** NO -- explicitly prohibited ("copy, reproduce, republish, download, sell, store in any medium")
- **Attribution required:** "Contains ADMIRALTY data: Crown copyright and database right" (if using under a paid license)
- **Key restrictions (Discovery tier):**
  - Maximum 2,000 API calls per day, 30 calls per 30 seconds
  - No caching permitted
  - No redistribution
  - ENC data is NOT kept up-to-date
  - Cannot be used for navigation
  - Cannot create systematic databases from the data
  - Intended only for developers evaluating whether to become resellers
- **Verdict: CANNOT USE for pre-populating a database.** The free tier explicitly prohibits caching and storage. Even paid tiers only allow 24-hour temporary caching. Would need a commercial license to use ADMIRALTY data, and even then redistribution in an open-source project would likely be prohibited.

**Sources:**
- https://developer.admiralty.co.uk/TandC
- https://developer.admiralty.co.uk/faqs
- https://www.admiralty.co.uk/access-data/apis

---

## 7. Mapbox

- **License:** Proprietary (Mapbox Terms of Service)
- **Can users download/cache tiles for offline?** YES, but only through official Mapbox SDKs
- **Can we bundle/redistribute tiles?** NO -- "data may not be preloaded, bundled or otherwise redistributed"
- **Attribution required:** Yes, Mapbox attribution must be displayed on all maps
- **Key restrictions:**
  - Offline data must be retrieved from Mapbox servers by end-user devices -- cannot be pre-downloaded and bundled with the app
  - Maximum 750 unique tile packs per user (current SDK)
  - Legacy SDK: 6,000 tile ceiling per user (adjustable)
  - Only Mapbox-hosted tilesets supported for offline
  - Cannot extract or scrape tiles outside the SDK
- **Verdict: USABLE FOR ONLINE MAPS + LIMITED OFFLINE, but NOT for pre-populating a POI database.** Mapbox supports offline maps through its SDK with tile pack limits, which is adequate for a sailing app. However, you cannot pre-populate or redistribute Mapbox data. The offline capability is per-user, on-demand downloading only.

**Sources:**
- https://www.mapbox.com/legal/tos
- https://www.mapbox.com/legal/product-terms
- https://docs.mapbox.com/ios/maps/guides/offline/
- https://docs.mapbox.com/android/maps/guides/offline/concepts/
- https://docs.mapbox.com/help/dive-deeper/mobile-offline/

---

## 8. OpenSeaMap Tiles

- **License:** CC-BY-SA 2.0 (tiles); ODbL (underlying data)
- **Can we cache for offline?** YES -- explicitly designed for offline use on marine devices
- **Can we redistribute?** YES, under CC-BY-SA terms
- **Attribution required:** Credit OpenStreetMap/OpenSeaMap
- **Key restrictions:** Share-alike -- derivative works must use the same license
- **Verdict: EXCELLENT FIT.** OpenSeaMap tiles are explicitly designed for offline marine use and can be freely cached, stored, and redistributed under CC-BY-SA.

**Sources:**
- https://wiki.openstreetmap.org/wiki/OpenSeaMap

---

## Summary Matrix

| Source | License | Cache/Store | Redistribute | Pre-populate DB | Attribution |
|--------|---------|-------------|--------------|-----------------|-------------|
| OpenStreetMap | ODbL | YES | YES (share-alike) | YES | Required |
| OpenSeaMap | ODbL + CC-BY-SA | YES | YES (share-alike) | YES | Required |
| Navily | Proprietary | NO | NO | NO | N/A |
| Noonsite | Copyright (WCC Ltd) | NO | NO | NO | N/A |
| Global Fishing Watch | CC-BY-SA 4.0 | YES | YES (share-alike) | LIKELY YES* | Required |
| NOAA | Public Domain (CC0) | YES | YES | YES | Requested |
| ADMIRALTY (UKHO) | Crown Copyright | NO | NO | NO | N/A |
| Mapbox | Proprietary | SDK only | NO | NO | Required |
| OpenSeaMap Tiles | CC-BY-SA 2.0 | YES | YES (share-alike) | YES | Required |

*Global Fishing Watch: non-commercial restriction on APIs needs confirmation for free open-source apps.

## Recommended Data Stack for POI Pre-population

**Tier 1 -- Use freely:**
1. **OpenStreetMap/OpenSeaMap** -- Marinas, harbors, anchorages, navigational aids, coastline data
2. **NOAA** -- Charts, tide data, weather, US port information
3. **OpenSeaMap tiles** -- Offline nautical chart overlay

**Tier 2 -- Use with care:**
4. **Global Fishing Watch** -- 160K anchorage locations (confirm non-commercial status)

**Tier 3 -- Online/SDK only:**
5. **Mapbox** -- Base map tiles via SDK (user-initiated offline caching only)

**Tier 4 -- Cannot use without agreements:**
6. **Noonsite** -- Would need licensing deal with World Cruising Club
7. **Navily** -- Would need partnership agreement
8. **ADMIRALTY** -- Would need commercial license (expensive)
