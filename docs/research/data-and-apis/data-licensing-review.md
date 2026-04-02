# Marine Data Sources: Licensing & Terms Review

Comprehensive review of licensing terms for marine data sources relevant to an open-source, free, non-commercial sailing platform. The platform will display data to users at no charge and will never resell data.

Last updated: 2026-03-31

---

## Summary Matrix

| Source | License Type | Free Non-Commercial Use | Display on Free App | Caching Allowed | Derivative Works | Risk Level |
|--------|-------------|------------------------|--------------------|-----------------|--------------------|------------|
| NOAA (charts, tides, weather) | US Public Domain | Yes | Yes | Yes | Yes | **LOW** |
| GFS Weather Model | US Public Domain | Yes | Yes | Yes | Yes | **LOW** |
| NASA POWER | CC0 (Public Domain) | Yes | Yes | Yes | Yes | **LOW** |
| OpenStreetMap / OpenSeaMap | ODbL 1.0 | Yes | Yes | Yes (share-alike) | Yes (share-alike) | **LOW** |
| ECMWF Open Data | CC-BY-4.0 | Yes | Yes | Yes | Yes | **LOW** |
| PVGIS (EU JRC) | CC-BY-4.0 | Yes | Yes | Yes | Yes | **LOW** |
| Marinas.com API | Proprietary (Beta) | Yes (with conditions) | Yes (with conditions) | 24hr cache only | Limited | **MEDIUM** |
| UKHO Admiralty Tidal API | Crown Copyright | Free tier only | Yes (with attribution) | No (Discovery tier) | No | **MEDIUM** |
| Garmin ActiveCaptain API | Proprietary (Garmin) | Likely yes | Likely yes (approval needed) | Unknown | Restricted | **MEDIUM-HIGH** |
| Navionics/Garmin Charts | Proprietary (Garmin) | Approval required | Approval required | No | No | **HIGH** |
| Navily | Proprietary | No | No | No | No | **HIGH** |
| Noonsite | Copyright (WCC Ltd) | No | No | No | No | **HIGH** |
| Global Fishing Watch | CC-BY-SA 4.0 | Yes (non-commercial) | Yes (non-commercial) | Yes (share-alike) | Yes (share-alike) | **LOW-MEDIUM** |
| Mapbox | Proprietary | SDK-only offline | No redistribution | No | No | **MEDIUM** |
| OpenCPN Chart Sources | Varies by country | Varies | Varies | Varies | Varies | **VARIES** |

---

## 1. NOAA Data (Charts, Tides, Weather)

### License Type
**US Public Domain.** As a US government agency, NOAA data is not copyrighted and is freely available under US law.

### Key Terms

> "Information on NWS Web pages is in the public domain, unless specifically noted otherwise, and may be used without charge for any lawful purpose so long as you do not: (1) claim it is your own (e.g., by claiming copyright for NWS information); (2) use it in a manner that implies an endorsement or affiliation with NOAA/NWS; or (3) modify its content and then present it as official government material."

Source: https://www.weather.gov/disclaimer

### Charts (ENC)

NOAA Electronic Navigational Charts are public domain:

> "Users may download, use, and redistribute them without restriction, and without payment."

However, redistributed ENCs are NOT considered "official NOAA ENCs" unless distributed by a Certified NOAA ENC Distributor. This is only relevant for regulated commercial vessels -- it does not restrict use in a free sailing app.

When incorporating ENCs into other products, the producer assumes liability and must display the NOAA ENC User Agreement and reference the original source.

- **Coverage:** US mainland, Puerto Rico, USVI, Hawaii, American Samoa, Guam, Northern Marianas
- **Formats:** S-57 ENC, MBTiles raster
- **Download:** https://distribution.charts.noaa.gov/ncds/index.html
- **Terms:** https://charts.noaa.gov/ENCs/ENC_Agreement.shtml
- **Trademarks:** "NOAA" and "NOAA ENC" are registered trademarks

### Tides & Currents API

- **URL:** https://api.tidesandcurrents.noaa.gov/api/prod/
- **Authentication:** None required (app name recommended via `application` parameter)
- **Rate limits:** Per-request data volume limits (10,000 records per page). High/Low predictions limited to 10 years per request; other intervals limited to 1 year.
- **Formats:** JSON, XML, CSV
- **Cost:** Free
- **Caching:** Permitted (public domain)
- **Documentation:** https://tidesandcurrents.noaa.gov/web_services_info.html

### Weather (NWS API)

- **URL:** https://api.weather.gov/
- **Authentication:** User-Agent header required (app name + contact)
- **Cost:** Free
- **Caching:** Permitted
- **Terms:** Same public domain disclaimer as above

### Verdict for Our Project
**FULLY PERMITTED.** NOAA data is the gold standard for open-source projects. No restrictions on non-commercial display. No API key required. Can cache and store freely. Can create derivative works. Only restriction: don't claim it's your own data or imply NOAA endorsement.

---

## 2. GFS Weather Model Data (NOAA)

### License Type
**US Public Domain.** GFS is produced by NOAA's National Centers for Environmental Prediction (NCEP).

> "NOAA data, information, and products are not subject to copyright and carry no restrictions on their subsequent use by the public. Once obtained, they may be put to any lawful use."

### Access
- **NOMADS (primary):** https://nomads.ncep.noaa.gov/
- **AWS Open Data:** https://registry.opendata.aws/noaa-gfs-bdp-pds/
- **Resolution:** 0.25 degree global grid
- **Update frequency:** 4x daily (00, 06, 12, 18 UTC)
- **Forecast range:** Up to 16 days
- **Format:** GRIB2
- **Authentication:** None
- **Rate limits:** Fair-use (no formal limit documented for NOMADS)

### Verdict for Our Project
**FULLY PERMITTED.** Public domain, no restrictions. NOAA requests (but does not legally require) attribution. Can redistribute, cache, and create derivative works without restriction.

---

## 3. NASA POWER (Solar Irradiance)

### License Type
**Creative Commons Zero (CC0) -- Public Domain.**

> "Unless the data file is marked with a restrictive notice or license, data that is provided from a NASA-led mission... are licensed as Creative Commons Zero. There are no restrictions on the usage of these data."

Source: https://science.data.nasa.gov/about/license

### Attribution
Not legally required under CC0, but NASA requests acknowledgement:

> "The data was obtained from the National Aeronautics and Space Administration (NASA) Langley Research Center (LaRC) Prediction of Worldwide Energy Resource (POWER) Project funded through the NASA Earth Science/Applied Science Program."

### API Details
- **URL:** https://power.larc.nasa.gov/api/
- **Authentication:** No API key required for basic use. For intensive use, register for a NASA API key at https://api.nasa.gov/
- **Rate limits:** General NASA APIs allow 1,000 requests/hour with a registered key. DEMO_KEY has lower limits. POWER-specific limits may vary -- check https://power.larc.nasa.gov/ for current values.
- **Coverage:** Global, including full ocean coverage
- **Resolution:** 0.5 x 0.5 degree grid
- **Data:** Solar radiation, temperature, wind, humidity (daily/monthly/annual)

### Verdict for Our Project
**FULLY PERMITTED.** CC0 public domain. No legal restrictions on use, caching, redistribution, or derivative works. Include the requested acknowledgement as good practice.

---

## 4. OpenStreetMap / OpenSeaMap

### License Type
**Open Database License (ODbL) 1.0** for the database. Map tiles are CC-BY-SA 2.0.

Source: https://www.openstreetmap.org/copyright

### Key Rights (ODbL Summary)

> - **Share:** "To copy, distribute and use the database"
> - **Create:** "To produce works from the database"
> - **Adapt:** "To modify, transform and build upon the database"

Source: https://opendatacommons.org/licenses/odbl/summary/

### Obligations

**Attribution (mandatory):**
> "You must attribute any public use of the database, or works produced from the database, in the manner specified in the ODbL."

Required text: "© OpenStreetMap contributors" or equivalent, with a link to https://www.openstreetmap.org/copyright. The text "OpenStreetMap" should link to that page.

For interactive maps: attribution may be placed in a corner (typically lower-right). Can fade/collapse after 5 seconds as long as license info remains accessible elsewhere.

Source: https://osmfoundation.org/wiki/Licence/Attribution_Guidelines

**Share-Alike (mandatory for adapted databases):**
> "If you publicly use any adapted version of this database, or works produced from an adapted database, you must also offer that adapted database under the ODbL."

This means: if we modify/enrich OSM data and redistribute the *database*, the adapted database must also be ODbL. However, "produced works" (e.g., rendered map tiles, search results displayed to users) do NOT trigger share-alike -- only the underlying database does.

**Keep Open:**
> "If you redistribute the database, or an adapted version of it, then you may use technological measures that restrict the work (such as DRM) as long as you also redistribute a version without such measures."

### Caching & Storage
OSM data CAN be cached and stored locally. The ODbL explicitly permits copying and redistributing the database. The share-alike obligation applies if you redistribute a *modified* version of the database.

### OpenSeaMap Specifics
OpenSeaMap data is stored within the OSM database and inherits the ODbL license. Includes: seamarks (buoys, beacons, lights), port facilities, and some marina/anchorage data.

- **GitHub:** https://github.com/openseamap
- **Data access:** Via Overpass API or direct OSM data downloads

### Verdict for Our Project
**FULLY PERMITTED with obligations.** Free to use, cache, and display. Must provide visible "© OpenStreetMap contributors" attribution with link. If we modify the underlying database and redistribute it, the modified database must also be ODbL. Displaying data to users (without redistributing the raw database) does NOT trigger share-alike. This is one of the most open-source-friendly data sources available.

---

## 5. ECMWF Open Data (Weather Models)

### License Type
**Creative Commons Attribution 4.0 International (CC-BY-4.0)** as of 1 October 2025.

> "The data may be redistributed and used commercially, subject to appropriate attribution."

Source: https://www.ecmwf.int/en/forecasts/datasets/open-data

### What Changed
ECMWF made a landmark shift in 2025, opening its entire Real-time Catalogue under CC-BY-4.0 with no data costs. Previously, most ECMWF data required expensive commercial licenses.

### Free Open Data Subset
- **Models:** IFS (deterministic + ensemble) and AIFS
- **Resolution:** 0.25 degrees (~25 km)
- **Format:** GRIB2
- **Update frequency:** 4 daily cycles (00, 06, 12, 18 UTC)
- **Forecast range:** Up to 15 days (360 hours)
- **Archive:** Rolling ~2-3 day window (most recent 12 forecast runs)
- **Connection limit:** 500 simultaneous connections
- **Also available on:** AWS, Azure, Google Cloud

### Higher Resolution Data
The full ECMWF catalogue at higher resolution is also CC-BY-4.0 with no data cost, but delivery of high-volume data may involve service charges for enhanced delivery infrastructure.

### Attribution Requirement
Must credit ECMWF. Standard CC-BY-4.0 attribution -- name the source, indicate if changes were made, link to the license.

### Verdict for Our Project
**FULLY PERMITTED.** CC-BY-4.0 is one of the most permissive licenses available. Can use, cache, redistribute, and create derivative works. Only requirement is attribution. The free 0.25-degree data is more than adequate for sailing weather forecasts. This is a major improvement over the pre-2025 situation.

---

## 6. PVGIS (EU Joint Research Centre)

### License Type
**Creative Commons Attribution 4.0 International (CC-BY-4.0)** -- inherited from the European Commission's standard reuse policy.

> "Content owned by the EU on European Commission websites is licensed under the Creative Commons Attribution 4.0 International (CC BY 4.0) licence, unless otherwise indicated."
>
> "Reuse is allowed, provided appropriate credit is given and changes are indicated."

Source: https://commission.europa.eu/legal-notice_en

PVGIS documentation further states:
> "PVGIS is completely free to use, with no restrictions on what the results can be used for, and with no registration necessary."

### API Details
- **URL:** `https://re.jrc.ec.europa.eu/api/v5_3/`
- **Authentication:** None required
- **Rate limit:** 30 requests/second per IP address
- **Overload response:** HTTP 529 (retry after 4-5 seconds)
- **Rate limit response:** HTTP 429
- **CORS/AJAX:** NOT allowed (must make server-side requests)
- **HTTP methods:** GET only

Source: https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/getting-started-pvgis/api-non-interactive-service_en

### Caching
No restrictions on caching PVGIS results. Given that solar radiation data is historical/statistical (not real-time), aggressive caching (30+ days) is sensible.

### Attribution
Standard CC-BY-4.0: credit the European Commission Joint Research Centre as the source.

### Verdict for Our Project
**FULLY PERMITTED.** Free, no registration, generous rate limits, CC-BY-4.0 license. Can display results publicly, cache, and create derivative works. The only operational constraint is the CORS restriction (requests must be server-side), which aligns with our Go API server architecture. One of the best data sources for our use case.

---

## 7. Garmin ActiveCaptain Community API

### License Type
**Proprietary (Garmin).** Access is free but requires application and approval.

### What We Know
The ActiveCaptain developer page states:

> "Our APIs are free and will allow your users to benefit from the ActiveCaptain Community content in your products."
>
> "Simply request access, and, upon approval, you'll be able to utilize our online documentation, test environment and tool kit."

Source: https://developer.garmin.com/active-captain/

### Key Restrictions (from Garmin Connect Developer Program Agreement)
The Garmin Connect Developer Program Agreement (which likely governs or informs ActiveCaptain API access) includes these restrictions:

> You cannot "sell, lease, share, transfer, or sublicense the License Key, provide access to the API, or derive income from the use or provision of the API, whether for direct commercial or monetary gain or otherwise, without Garmin's" approval.

> Garmin maintains the right to "copy, modify, create derivative works of, publicly display, disclose, distribute, license, sublicense, incorporate, and otherwise use" your data "for any and all purposes, commercial or otherwise, with no obligation of any kind to Licensee."

Source: https://www8.garmin.com/en-US/GARMINCONNECTDEVELOPERPROGRAMAGREEMENT/GARMINCONNECTDEVELOPERPROGRAMAGREEMENT_EN.pdf

### Brand Guidelines
Garmin has "requirements for Garmin attribution on title-level displays, secondary screens, exported data, derived data, and social media."

Source: https://developer.garmin.com/brand-guidelines/api-brand-guidelines/

### What's Unclear
- Whether an open-source project qualifies for approval
- Exact rate limits (not publicly documented)
- Whether data can be mixed with other sources (e.g., OSM marina data)
- Caching/storage rules
- Whether the Garmin Connect agreement or a separate ActiveCaptain-specific agreement applies
- Whether Garmin can revoke access at will

### Verdict for Our Project
**GRAY AREA -- PROCEED WITH CAUTION.** The API is free and Garmin encourages third-party integration, but the terms are proprietary, opaque, and potentially restrictive. The "derive income" clause is ambiguous for a free open-source project that might accept donations. Garmin could revoke access at any time. Recommend applying for access to get the actual ActiveCaptain-specific terms before committing to this as a data source. Do not build the platform around ActiveCaptain data as a critical dependency.

---

## 8. Navionics/Garmin Chart Data

### License Type
**Proprietary (Garmin).** Available via SDK (mobile) and Web API.

### Developer Access
The Garmin marine charts developer page states:

> "The Navionics mobile software development kit (SDK) and web application programming interface (API) provide opportunities for the integration of detailed marine charts in recreational, commercial, educational and conservation settings."

> "The Navionics Web API developer solution is free to all users."

Developers must request access via https://www.garmin.com/en-US/forms/navionics-web-api/

Source: https://developer.garmin.com/marine-charts/overview/

### What's Available
- Chart tiles for web embedding
- HD bathymetry
- Standard nautical chart content
- Mobile SDK for iOS/Android

### What's Unclear
- Specific license terms are provided only during the application process
- Whether open-source projects are eligible
- Whether chart tiles can be cached/stored locally
- Whether the charts can be mixed with other data layers
- Offline usage rights
- Whether the free access applies to all use cases or just evaluation

### Key Concern
Navionics/Garmin chart data is the core commercial product of Garmin's marine division. While the Web API is "free," this almost certainly means free *embedding* of Garmin-hosted tiles with Garmin branding -- not free redistribution of chart data. The SDK/API is designed to drive users into the Garmin ecosystem, not to provide open chart data.

### Verdict for Our Project
**HIGH RISK / LIKELY RESTRICTED.** While the web API is "free," Garmin controls the terms and can revoke access. Chart data is Garmin's core commercial asset. Almost certainly cannot: cache chart tiles locally, serve them from our infrastructure, create derivative works, or use them offline. Would create a critical dependency on a commercial vendor for a core feature. Recommend using free government charts (NOAA ENCs) and OpenSeaMap instead, with Navionics as an optional overlay only if the terms allow it.

---

## 9. OpenCPN Chart Sources

OpenCPN uses charts from multiple sources, each with different licenses:

### Free / Public Domain Charts

| Source | Coverage | License | Format |
|--------|----------|---------|--------|
| **NOAA** (US) | US waters, territories | US Public Domain | S-57 ENC, MBTiles |
| **LINZ** (New Zealand) | NZ, Pacific Islands, Southern Ocean | Free (NZ government) | BSB3 raster |
| **Brazilian Navy (CHM)** | Brazilian coast, inland waters | Free (Brazilian government) | RNC raster |
| **Argentine Navy (SHN)** | Argentine waters | Free | RNC raster |
| **EU Inland Waterways** | 12+ European countries | Free (government) | Inland ENC |
| **EAHC** | South China Sea (offshore) | Free (registration required) | S-57 |

### Licensed / Paid Charts

| Source | Coverage | License | Notes |
|--------|----------|---------|-------|
| **o-charts (oeSENC)** | Global (from HOs) | Paid license per device | Based on official HO data, OpenCPN proprietary format |
| **CM93** | Global | Legacy Jeppesen/C-MAP | No longer sold, widely available informally |

### Key Insight
The free charts available through OpenCPN are overwhelmingly government-produced charts that are free/public domain by law. The US (NOAA), New Zealand (LINZ), Brazil, and Argentina all provide free nautical charts. European inland waterway charts are also free.

For our project, the most relevant free sources are:
- **NOAA ENCs** -- Public domain, comprehensive US coverage
- **LINZ charts** -- Free, covers vast Pacific areas
- **OpenSeaMap** -- ODbL, community-maintained supplement

Source: https://opencpn.org/OpenCPN/info/chartsource.html

### Verdict for Our Project
**MOSTLY PERMITTED.** The free government chart sources are fully usable. NOAA ENCs are public domain. LINZ and Brazilian charts are free for use. The paid/licensed sources (o-charts, CM93) are NOT available for redistribution. Our chart strategy should build on the free government sources + OpenSeaMap.

---

## 10. UKHO (UK Hydrographic Office) Admiralty Data

### License Type
**Crown Copyright** for chart data. Some datasets available under **Open Government Licence v3.0**. Tidal API has tiered access.

### Tidal API

**Discovery Tier (FREE):**
- 1-year subscription (renewable)
- High Water and Low Water events only
- 607 tidal stations (British Isles and Ireland)
- Current + 6 days predictions
- Rate limit: 10 calls/second, 10,000 calls/month
- **Caching: NOT permitted** on the free Discovery tier

> "Caching is not permitted if using the free of charge Discovery UK Tidal API subscription. This is because storing the data in any kind is in breach of Copyright law."

- **Required attribution:** "Contains ADMIRALTY ® tidal data: © Crown copyright and database right"

**Foundation Tier (PAID):**
- Tidal height predictions at specific times
- Higher rate limits
- Caching may be permitted (check specific terms)

**Premium Tier (PAID):**
- Full tidal curves and detailed predictions
- Highest rate limits

Source: https://admiraltyapi.portal.azure-api.net/products/uk-tidal-api

### Chart Data
UKHO chart data (ADMIRALTY Vector Chart Service, raster charts) is commercially licensed. NOT available for free use. This is UKHO's primary revenue source.

### Open Data
Some UKHO datasets are available free under the Open Government Licence:
- Maritime limits and boundaries
- Fishing limits
- Marine protected areas

These are available via the ADMIRALTY API Developer Portal.

- **Developer portal:** https://admiraltyapi.portal.azure-api.net/
- **API overview:** https://www.admiralty.co.uk/access-data/apis

### Verdict for Our Project
**LIMITED FREE USE.** The Tidal API Discovery tier is usable but restrictive -- no caching, limited to high/low events (no continuous curves), 10k calls/month. Good enough for basic UK tidal data display with real-time API calls. Chart data is completely off-limits without commercial license. For UK tides, consider supplementing with harmonic prediction algorithms using published harmonic constants rather than depending on the API.

---

## 11. Marinas.com API

### License Type
**Proprietary (Beta).** Free access with significant conditions.

### Key Terms

> "The API may be used only if your application is non-exclusive, publicly available, does not require a fee or subscription, does not exceed daily call limits, and is not otherwise commercial in nature. If your application does not meet all of these requirements, you will need to obtain an enterprise license."

This is favorable for our use case -- an open-source, free, non-commercial app.

### Data Restrictions

> Developers cannot "directly or indirectly transfer any Marinas.com Data, including user data or Marinas.com user IDs, to any ad network, ad exchange, data broker, or other advertising or monetization related toolset."

> "You're not allowed to sell the data to anyone."

> Marinas.com "reserves the right to charge for access to the API in the future, at its sole discretion."

### Caching
24-hour caching is explicitly recommended:
> "Caching results for up to 24 hours is recommended to make the most requests within the rate limit quota."

### Data Ownership
Marinas.com claims perpetual rights to any location data submitted through API usage:
> Marinas.com has "the right to use, reproduce, transfer, sublicense and otherwise exploit perpetually any place, latitude and longitude, or other location information that developers or their users submit."

### Beta Status
> "The Marinas.com API is a Beta product, and developers should be prepared for changes to interfaces, access patterns, rate limits, etc."

- **Documentation:** https://marinas.com/developers/api_documentation
- **Terms:** https://marinas.com/developers/terms
- **Authentication:** API key (access_token parameter or Bearer header)

### Verdict for Our Project
**PERMITTED with conditions.** Our free, non-commercial, publicly available app meets the stated requirements. Main risks: Beta status means API could change/disappear; Marinas.com could start charging; 24-hour cache limit means we can't build an offline database. Good supplementary source, but don't build core functionality around it.

---

## 12. ECMWF vs GFS Comparison for Weather

| Aspect | GFS (NOAA) | ECMWF Open Data |
|--------|-----------|-----------------|
| License | US Public Domain | CC-BY-4.0 |
| Cost | Free | Free |
| Attribution required | Requested (not legally required) | Required |
| Resolution | 0.25° | 0.25° |
| Forecast range | 16 days | 15 days |
| Caching | Unrestricted | Unrestricted |
| Derivative works | Unrestricted | Permitted with attribution |
| Redistribution | Unrestricted | Permitted with attribution |
| Archive depth | Extensive historical | Rolling ~2-3 days |

**Recommendation:** Use both. GFS for maximum legal freedom and historical data. ECMWF for potentially better European forecast accuracy. Both are fully usable for our project.

---

## 13. Navily

### License Type
**Proprietary, all rights reserved.**

### Key Terms

> "All reproduction, use or adaptation, without obtaining prior written agreement from Navily, are strictly prohibited."

Scraping, reproducing, distributing, or transmitting content without express written consent is prohibited. Violation may result in penal, civil, or administrative penalties.

- **API available?** No public API
- **Can we cache/store?** No
- **Can we scrape?** Explicitly prohibited
- **Source:** https://www.navily.com/cgu

### Verdict for Our Project
**CANNOT USE.** Navily's data is fully proprietary. No API, no reuse permitted. Would need a formal partnership agreement.

---

## 14. Noonsite.com

### License Type
**Proprietary copyright.** Owned by World Cruising Club Limited (taken over from founder Jimmy Cornell).

> "Copyright 2006 to present, World Cruising Club Limited, its subsidiaries or agents."

Standard all-rights-reserved copyright applies. No open data license or Creative Commons designation.

- **Can we store/cache?** No (not without permission)
- **Can we redistribute?** No
- **Source:** https://www.noonsite.com/terms-and-conditions/

### Note on Factual Information
Factual information (e.g., "Country X requires a visa") is generally not copyrightable under most jurisdictions — only the specific expression/compilation is protected. However, systematically extracting their compilation would likely violate their terms.

### Verdict for Our Project
**CANNOT USE without licensing agreement.** Would need to negotiate a data-sharing deal with World Cruising Club. Alternatively, build our own community-sourced country/port entry requirements.

---

## 15. Global Fishing Watch Anchorages

### License Type
**Creative Commons Attribution-ShareAlike 4.0 International (CC-BY-SA 4.0).**

### Dataset
~160,000 anchorage locations associated with ~32,000 ports worldwide. Derived from AIS vessel tracking data.

### Key Terms
- **Can we store/cache?** Yes
- **Can we redistribute?** Yes, under CC-BY-SA 4.0
- **Attribution required:** Must attribute Global Fishing Watch
- **Share-alike:** Derivative works must use the same license

### API Restriction

> APIs are explicitly "only available for non-commercial purposes."

A free open-source app with no revenue likely qualifies as non-commercial, but this should be confirmed directly with GFW.

- **Source:** https://globalfishingwatch.org/datasets-and-code-anchorages/
- **API docs:** https://globalfishingwatch.org/our-apis/documentation

### Verdict for Our Project
**LIKELY PERMITTED.** The CC-BY-SA license allows redistribution. The 160K anchorage dataset is extremely valuable. The non-commercial API restriction needs confirmation — our free open-source status should qualify, but worth reaching out to GFW. Do not build a commercial feature around this without clarification.

---

## 16. Mapbox

### License Type
**Proprietary (Mapbox Terms of Service).**

### Key Terms
- **Can users cache tiles for offline?** Yes, but only through official Mapbox SDKs
- **Can we bundle/redistribute tiles?** No — "data may not be preloaded, bundled or otherwise redistributed"
- **Attribution required:** Yes, Mapbox attribution must be displayed on all maps
- **Offline limits:** Maximum 750 unique tile packs per user (current SDK). Legacy SDK: 6,000 tile ceiling per user.
- **Can we extract/scrape tiles?** No — only SDK-initiated downloads

### Sources
- https://www.mapbox.com/legal/tos
- https://www.mapbox.com/legal/product-terms

### Verdict for Our Project
**USABLE FOR ONLINE MAPS + LIMITED OFFLINE, but NOT for pre-populating a database.** Mapbox supports offline maps through its SDK with tile pack limits, which is adequate. Cannot pre-populate or redistribute data. Offline capability is per-user, on-demand only. Consider MapLibre (open-source fork) with free tile sources as an alternative.

---

## Risk Assessment & Recommendations

### Tier 1: Use Without Concern (Green Light)

These sources have clear, permissive licenses ideal for open-source projects:

1. **NOAA (all products)** -- Public domain. The foundation of our data strategy.
2. **GFS weather data** -- Public domain. Primary weather model.
3. **NASA POWER** -- CC0 public domain. Solar irradiance data.
4. **OpenStreetMap / OpenSeaMap** -- ODbL. Gold standard for open data. Just maintain attribution and share-alike compliance.
5. **PVGIS** -- CC-BY-4.0. Free, generous rate limits, no registration.
6. **ECMWF Open Data** -- CC-BY-4.0 (since October 2025). Major win for open-source weather apps.
7. **Free government charts** (NOAA ENCs, LINZ, Brazilian Navy) -- Public domain or free government data.
8. **Global Fishing Watch** -- CC-BY-SA 4.0. 160K anchorage locations. Confirm non-commercial API status.

### Tier 2: Usable With Caution (Yellow Light)

These sources are usable but have proprietary terms that create dependencies:

9. **Marinas.com API** -- Our use case fits their free tier terms, but Beta status and potential future charges are risks.
10. **UKHO Tidal API (Discovery)** -- Usable for UK tides but restrictive (no caching, limited calls). Consider alternative approaches for UK tidal data.
11. **Mapbox** -- Usable for online maps and limited offline via SDK. Cannot redistribute tiles. Consider MapLibre + free tile sources.

### Tier 3: Approach Carefully (Red Light)

These sources have opaque or restrictive terms:

12. **Garmin ActiveCaptain** -- Free API but proprietary terms, approval required, could be revoked. Do not make it a critical dependency.
13. **Navionics/Garmin Charts** -- Almost certainly too restrictive for our use case. Use free government charts instead.
14. **UKHO Chart Data** -- Commercially licensed. Not available for free use.

### Tier 4: Cannot Use (No Go)

15. **Navily** -- Fully proprietary, no API, no reuse. Would need formal partnership.
16. **Noonsite** -- Copyright by World Cruising Club. Would need licensing agreement.

### Key Principles

1. **Build on public domain and CC-licensed data first.** NOAA + OSM + ECMWF + PVGIS + NASA POWER cover the vast majority of our data needs with zero licensing risk.

2. **Treat proprietary APIs as optional enhancements, not core dependencies.** If Garmin or Marinas.com changes terms, the platform should still function.

3. **Always provide attribution.** Even where not legally required (NOAA), attribution builds trust and goodwill with data providers.

4. **Cache aggressively where permitted.** NOAA, GFS, PVGIS, NASA POWER, and ECMWF data can all be cached freely. This improves performance and reduces API dependency.

5. **Build our own community data layer.** For marina reviews, anchorage reports, and local knowledge -- areas where commercial APIs are most restrictive -- build a community-contributed layer under an open license (ODbL or similar).

---

## License URLs / References

| Source | License/Terms URL |
|--------|-------------------|
| NOAA Weather Disclaimer | https://www.weather.gov/disclaimer |
| NOAA ENC User Agreement | https://charts.noaa.gov/ENCs/ENC_Agreement.shtml |
| NOAA Tides API Docs | https://tidesandcurrents.noaa.gov/web_services_info.html |
| NOAA GFS on AWS | https://registry.opendata.aws/noaa-gfs-bdp-pds/ |
| NASA Science Data License | https://science.data.nasa.gov/about/license |
| NASA POWER API | https://power.larc.nasa.gov/docs/services/api/ |
| OpenStreetMap Copyright | https://www.openstreetmap.org/copyright |
| ODbL 1.0 Full Text | https://opendatacommons.org/licenses/odbl/ |
| OSM Attribution Guidelines | https://osmfoundation.org/wiki/Licence/Attribution_Guidelines |
| ECMWF Open Data | https://www.ecmwf.int/en/forecasts/datasets/open-data |
| ECMWF Open Data Announcement | https://www.ecmwf.int/en/about/media-centre/news/2025/ecmwf-achieve-fully-open-data-status-2025 |
| PVGIS API | https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/getting-started-pvgis/api-non-interactive-service_en |
| EU Commission Legal Notice | https://commission.europa.eu/legal-notice_en |
| Garmin ActiveCaptain Developer | https://developer.garmin.com/active-captain/ |
| Garmin Connect Developer Agreement | https://www8.garmin.com/en-US/GARMINCONNECTDEVELOPERPROGRAMAGREEMENT/GARMINCONNECTDEVELOPERPROGRAMAGREEMENT_EN.pdf |
| Garmin Marine Charts Developer | https://developer.garmin.com/marine-charts/overview/ |
| Garmin API Brand Guidelines | https://developer.garmin.com/brand-guidelines/api-brand-guidelines/ |
| Marinas.com API Terms | https://marinas.com/developers/terms |
| Marinas.com API Docs | https://marinas.com/developers/api_documentation |
| UKHO Admiralty APIs | https://www.admiralty.co.uk/access-data/apis |
| UKHO Developer Portal | https://admiraltyapi.portal.azure-api.net/ |
| OpenCPN Chart Sources | https://opencpn.org/OpenCPN/info/chartsource.html |
| NOAA Chart Distribution | https://distribution.charts.noaa.gov/ncds/index.html |
| Navily Terms of Use | https://www.navily.com/cgu |
| Noonsite Terms | https://www.noonsite.com/terms-and-conditions/ |
| Global Fishing Watch Anchorages | https://globalfishingwatch.org/datasets-and-code-anchorages/ |
| Global Fishing Watch API Docs | https://globalfishingwatch.org/our-apis/documentation |
| Mapbox Terms of Service | https://www.mapbox.com/legal/tos |
| Mapbox Product Terms | https://www.mapbox.com/legal/product-terms |
