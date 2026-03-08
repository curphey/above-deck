# Savvy Navvy - Comprehensive Competitive Analysis

**Research date:** 2026-03-08
**Sources:** Savvy Navvy website, help center, App Store reviews, YBW Forum, Sailboat Owners Forums, Yachting World, Boating Magazine, Practical Sailor, Marine Industry News, JustUseApp review aggregator, Google Play Store

---

## 1. Complete Feature List by Tier

### Free Plan (US only, no credit card required)
- Basic route planning (no weather/tide factoring)
- Chart viewing (Savvy Charts)
- Basic navigation tools
- Up to 36-hour weather forecast (GFS model, 25 km resolution)

### Essential - $79.99/yr (US) / £59/yr (UK)
Everything in Free, plus:
- All Savvy Charts (UKHO, NOAA, and other hydrographic office charts)
- GPS active tracking with COG/SOG
- Over the Horizon AIS (3 nm range)
- 4-day weather forecasting
- Marina and anchorage information (seabed data, weather protection, amenities, berths, max boat length, contact info)
- Distance measurements
- Automated weather and tidal routing (Smart Routing)
- Automated Course To Steer (CTS) - factors tide, weather, chart data
- Night/Dark mode
- Track recording
- Fuel efficiency estimates
- Save favorite locations
- Cloud and rain overlay
- 500 saved routes, tracks, and points each

### Explore - $144.99/yr (US) / £95/yr (UK) — "Best Value"
Everything in Essential, plus:
- Tidal heights graph (visual highs/lows)
- Offline charts and weather (downloadable packs, 1-4 days of weather data)
- Export route to chartplotter (GPX)
- Departure schedule planner (compares departure times every 30 min, shows tide/wind impact)
- 14-day weather forecast (upgraded from 4 days)

### Elite - $149.99/yr (US) / £99/yr (UK)
Everything in Explore, plus:
- Tidal streams atlas (directional overlay)
- ECMWF Mixed weather forecasting (0.8-6 km resolution, blends 25+ models)
- Satellite mode (high-res imagery for marinas/anchorages)
- Anchor alarm (inner swing zone + outer safety zone, 5-min mute)
- NMEA Connect (live instrument data: wind, depth, RPMs, speed through water, heading)
- Unlimited Over the Horizon AIS (vs 3 nm)
- Import markers from other navigation tools
- 1,000 saved routes, tracks, and points each (vs 500)

### Key Tier Observations
- **Tides are split across tiers:** Essential gets tide-factored routing but NO tidal heights graph. Explore adds the graph. Elite adds tidal streams atlas. This is a common complaint.
- **Offline is Explore+:** Essential users have no offline capability at all.
- **GPX export is Explore+:** Can't export to chartplotter on Essential.
- **AIS is severely limited on Essential:** Only 3 nm range, which is nearly useless.

---

## 2. UX and Interface - Route Planning Flow

### Step-by-Step Process

1. **Set up boat profile:** Enter draft, fuel consumption, minimum depth, waterline length, cruising speed. The app uses these for all route calculations.

2. **Open Routes tab:** Tap "Routes" in the bottom navigation bar.

3. **Set departure point:** Four methods:
   - Drop a pin by tapping the chart
   - Search for a location (marina, anchorage, landmark)
   - Enter lat/long coordinates
   - Use current GPS position
   - This becomes Waypoint A

4. **Add destination and waypoints:** Tap chart to add destination. A dashed "skeleton" preview route appears showing basic course. This preview does NOT factor weather, tides, or boat settings - it is just a straight-line approximation.

5. **Tap "Plot Route":** Activates the Smart Routing algorithm. The system calculates optimal course factoring:
   - Departure time
   - Boat specifications
   - Chart hazards and depths
   - Wind forecast
   - Tidal streams and heights
   - Current weather conditions

6. **Review the route:** Drag up the route panel to see:
   - Step-by-step passage plan / float plan
   - Each leg with course, timing, distance
   - Icon indicators: sail icon (raise sails), steering icon (course change), wind icon (direction adjustment)
   - Fuel requirements
   - ETA

7. **Adjust departure time:** Select "depart at" dropdown - the route recalculates for different conditions.

8. **Use Departure Scheduler (Explore+):** Shows every 30-minute departure window, color-coded by wind conditions, showing portion of time against tide, total passage time. Scroll vertically through options up to 4 days ahead. Tap any bar to replot for that time.

9. **Modify route:** Add, move, or delete waypoints. Route recalculates.

10. **Start navigation:** When physically at departure point, tap START for real-time turn-by-turn with live adjustments.

### Interface Design Philosophy
- Clean, decluttered charts - deliberately less detail than Navionics/C-MAP
- Color-coded wind overlay: blue (light) -> green (ideal) -> yellow/orange (uncomfortable) -> red (dangerous) -> purple (extreme)
- Animated wind visualization (toggleable to save battery)
- Day/night shading on weather timeline
- Weathergram: visual timeline showing forecast wind, gusts, weather icons, temperature, rainfall
- Concentric distance rings around GPS position

---

## 3. Weather Integration

### Data Sources
- **ECMWF Mixed** (Elite only): Blends ECMWF, GFS, and 25+ other models via Meteomatics
- **GFS** (Free/Essential): 25 km global resolution
- **Resolution range:** 0.8 km nearshore to 25 km globally (on Elite)

### What's Displayed
- Wind speed and direction
- Gust strength
- Temperature
- Rainfall/precipitation
- Cloud cover
- Weather condition icons
- Animated wind arrows on chart overlay
- Cloud and rain visual overlay

### Forecast Duration by Tier
| Tier | Forecast Range | Model |
|------|---------------|-------|
| Free | 36 hours | GFS (25 km) |
| Essential | 4 days | GFS |
| Explore | 14 days | GFS + enhanced |
| Elite | 14 days | ECMWF Mixed (0.8-6 km) |

### How Weather Affects Routing
- Smart Routing ingests forecast data for the departure time
- Wind direction/speed affects sail vs motor decisions
- The CTS (Course To Steer) adjusts heading to compensate for wind
- Departure Scheduler shows how different times change the wind exposure

---

## 4. Tide and Current Handling

### Tidal Heights
- Data from 8,000+ tidal stations globally
- Sources include World Tides / Copernicus (EU Earth observation programme)
- Visual graph showing highs and lows (Explore+ only)
- Used in route calculation for depth safety

### Tidal Streams
- Tidal streams atlas (Elite only) shows directional overlay
- Tap anywhere on chart to see tide strength and direction at that location
- Time-scrollable to see how currents change

### How Tides Factor Into Routing
- Smart Routing accounts for tidal stream direction and strength
- CTS automatically adjusts heading to compensate for cross-current
- Departure Scheduler shows portion of passage spent against the tide
- Route timing calculations include tidal boost/penalty

### Known Issues (from user reports)
- Tidal data accuracy questioned, especially UK East Coast and Thames (reports of being "2 hours wrong")
- The app reportedly "thinks the tide is the same whatever the depth" - does not vary by water depth
- Tidal data only available ~1 month forward
- Cannot plan routes from drying locations

---

## 5. Offline Capability

### What's Available (Explore and Elite only)
- Downloadable chart packs for specific geographic areas
- Includes charts, weather forecasts (1-4 days), and tidal data
- Full route plotting and recalculation works offline
- Waypoints, routes, and anchorage info available offline

### How to Download
1. Open Offline Charts section
2. Select "Download a new chart pack"
3. Pinch/scroll to define coverage area
4. Choose weather duration (1-4 days)
5. Download charts + forecasts + tidal data

### Management
- Last update timestamps displayed
- Can rename, update, or delete packs
- Auto-update option (requires Wi-Fi or cellular when triggered)

### Limitations
- Essential plan has NO offline capability at all
- Storage varies by coverage area
- Weather data limited to 1-4 days (not the full 14-day forecast)
- Auto-update needs connectivity
- Multiple users report offline not working reliably, particularly on iPad

---

## 6. GPX Export and Chartplotter Integration

### Export Process
1. Create route in Savvy Navvy
2. Select "More..." option on the route
3. Choose "Export"
4. File downloads as standard .gpx format
5. Transfer to chartplotter via SD card, USB, Wi-Fi, Bluetooth, or manufacturer companion app

### Supported Chartplotters
- Garmin, Raymarine, and any device supporting GPX import
- Users must consult their chartplotter manual for import steps

### Import Into Savvy Navvy
- Can import GPX files from other navigation tools

### Availability
- US: Premium Plan (any paid tier)
- Rest of world: Explore and Elite only
- NOT available on Essential (outside US)

---

## 7. What Users Love

### Consistent Praise Themes

**"Google Maps for boats" simplicity:**
- "Most intuitive of all apps" (Yachting World)
- "Super easy to use with a quite simple interface" (multiple reviewers)
- Deliberately decluttered vs Navionics - avoids "extraneous information"
- "Intuitive and well designed, easy to learn" (App Store)

**Smart Routing is the killer feature:**
- "The only app that has a routing algorithm with inputs for wind and current" (Yachting World)
- Automatic CTS adjusting for tides and currents is genuinely unique
- "Answers key sailing questions: what is the current doing? Can I point or will I need to tack?"

**Departure Scheduler is highly valued:**
- Compares departure windows visually
- Shows tide impact per departure time
- "Save time and fuel by selecting a departure that minimises tide against you"

**Passage planning confidence:**
- Good for building confidence before unfamiliar passages
- "Used it as emergency backup navigation and found it perfect"
- Fuel estimation helpful for powerboaters

**Responsive customer support:**
- Team actively responds to App Store reviews
- In-app chat support
- "Responsive development team that listens to feedback"
- Direct email support: ahoy@savvy-navvy.com

**Multi-device support:**
- Same account across phone, tablet, desktop
- Family members can log in on their devices as backup

### App Store Rating: 4.7/5

---

## 8. What Users Hate

### Critical Complaints

**Android performance is significantly worse than iOS:**
- "Simply does not work on Android phones" - planning function fails consistently
- Failed to boot on Android tablets despite multiple reinstalls
- "One of the most useless pieces of boatie accoutrements" (YBW Forum)
- Gets stuck calculating distances indefinitely

**Route accuracy and safety concerns:**
- "Can route you metres away from a hazard on a lee shore" (Yachting World - expert review)
- Routes into shallow water during falling tides
- "Impossibly detailed wind patterns" that are unreliable in practice
- Modeling of routes and timings "not at all accurate in the real world"
- Struggles with routes over 40 miles without manual waypoint insertion
- Cannot plot from drying locations

**Chart detail is lacking:**
- "Charts lack key info such as spot depth" (Yachting World)
- "Chart detail massively lacking compared to Navionics" (YBW Forum)
- "Charts are a little light on detail - artistic merit slightly usurping navigational utility"
- Missing bridge names, widths, survey dates
- No chart symbol legend easily findable

**Tidal data inaccuracies:**
- Thames tidal data "at least 2 hours wrong"
- UK East Coast data "clearly inaccurate"
- Predictions differ significantly from Imray and Navionics for major ports
- Tidal data limited to ~1 month forward
- "Thinks the tide is the same whatever the depth"

**GPS tracking unreliability:**
- "GPS tracking doesn't know where you are most of the time"
- Erroneous data like 100-knot average speeds
- Even with all permissions enabled

**Pricing frustration:**
- Aggressive tier gating - basic features like tidal heights, offline charts, and GPX export locked behind higher tiers
- Night mode was moved to a higher tier, enraging existing users ("screw you to customers")
- $80-150/yr is expensive for what you get vs Navionics ($15-25/yr)
- "No significant advantage over cheaper alternatives like i-Boating and iNavX"
- Credit card required for trial (in some regions)

**Missing navigation features:**
- No distance and bearing tool (mentioned in expert review)
- No NMEA data integration on lower tiers (added in Elite via NMEA Connect, Nov 2025)
- No depth/wind from nav instruments (unless Elite)
- Limited AIS on Essential (3 nm)
- Cruising speed cannot be easily adjusted
- No detailed info on onshore locations, rivers, public docks (Florida specifically)
- Cannot select specific start points in crowded marinas
- Counterintuitive workflow: must plot before selecting departure time, then replot

**Offline problems:**
- Reports of offline not working despite subscription
- "Doesn't work offline on iPad despite annual subscription" (App Store review)

---

## 9. Pricing Details

### US Market

| Tier | Annual Price | Monthly Equiv. |
|------|-------------|----------------|
| Free | $0 | $0 |
| Essential | $79.99/yr | ~$6.67/mo |
| Explore | $144.99/yr | ~$12.08/mo |
| Elite | $149.99/yr | ~$12.50/mo |

### UK Market

| Tier | Annual Price |
|------|-------------|
| Essential | £59/yr |
| Explore | £95/yr |
| Elite | £99/yr |

### Free vs Paid Summary

| Feature | Free | Essential | Explore | Elite |
|---------|------|-----------|---------|-------|
| Chart viewing | Yes | Yes | Yes | Yes |
| Basic routing | Yes | Yes | Yes | Yes |
| Weather routing | No | Yes | Yes | Yes |
| CTS (tide-adjusted heading) | No | Yes | Yes | Yes |
| GPS tracking w/ COG/SOG | No | Yes | Yes | Yes |
| AIS range | None | 3 nm | 3 nm | Unlimited |
| Weather forecast | 36 hrs | 4 days | 14 days | 14 days |
| Weather model | GFS 25km | GFS | GFS+ | ECMWF Mixed 0.8-6km |
| Tidal heights graph | No | No | Yes | Yes |
| Tidal streams atlas | No | No | No | Yes |
| Offline charts | No | No | Yes | Yes |
| GPX export | No | No* | Yes | Yes |
| Departure scheduler | No | No | Yes | Yes |
| Satellite mode | No | No | No | Yes |
| Anchor alarm | No | No | No | Yes |
| NMEA Connect | No | No | No | Yes |
| Saved items limit | - | 500 | 500 | 1,000 |

*GPX export is available on all US paid plans but only Explore+ outside US.

### 3-day free trial available (iOS and Android)

### Competitive Pricing Context
- Navionics: ~$15-25/yr
- iNavX: ~$10/yr + chart purchases
- i-Boating: one-time purchase ~$10-20
- Savvy Navvy is 3-10x more expensive than alternatives

---

## 10. Roadmap and Recent Updates

### Recent Launches (2025-2026)

**NMEA Connect (November 2025)**
- Partnership with Actisense
- Live instrument data in app: wind, depth, RPMs, speed through water, heading
- Combines onboard AIS with over-the-horizon AIS
- Auto-fallback to phone sensors if NMEA data drops
- Elite tier only

**Boating Instructor Tool (September 2025)**
- Annotation features for teaching
- Targeted at sailing schools and RYA instructors

**Savvy Integrated - OEM Hardware Solution (August 2025)**
- First hardware product
- Embeds Savvy Navvy directly into boat helm displays
- Partnership with CPAC Systems (Marivue product line)
- Customizable, modular solutions for manufacturers
- Plan at home, navigate at helm without re-entering routes

**BoatUS Partnership**
- Collaboration to boost recreational boater confidence in the US

### Strategic Direction

**OEM / B2B Partnerships:**
- Avikus (autonomous navigation)
- RAD Propulsion (electric boats)
- CPAC Systems (helm displays)
- Actisense (NMEA)
- Aqua superPower (electric charging)
- Positioning as integrated navigation OS, not just an app

**Market Focus:**
- Heavy US market push - CEO: "We haven't really done anything in the Middle East or Asia because our focus is the US. It's such a massive market."
- Electric boat integration with "smart range" technology for range anxiety
- Positioning as "lead challenger brand to Navionics"
- Inland lakes and US East Coast expansion

**Company Stats:**
- Over 3 million app downloads
- Closed funding round December 2025
- Founded by former Google employees

**Stated Future Focus:**
- Drive feature development across app and integrated product
- "Boater-loved upgrades to boost adoption and retention"
- Accelerate B2B growth through manufacturer pipeline
- Scale OEM integrations

---

## Key Competitive Takeaways

### What Savvy Navvy Does Better Than Anyone
1. **Weather-integrated routing** - genuinely unique smart routing that factors wind + tide + boat specs into one route
2. **Departure scheduling** - visual comparison of departure windows is best-in-class
3. **Course To Steer** - automatic heading adjustment for current/tide
4. **Clean UX** - deliberately simplified vs traditional chart plotters
5. **Modern tech stack** - founded by Google alumni, mobile-first, cloud-native

### Where Savvy Navvy Falls Short
1. **Chart detail** - sacrifices navigational detail for visual clarity
2. **Routing safety** - algorithm can route dangerously close to hazards
3. **Android parity** - significantly worse experience than iOS
4. **Tidal accuracy** - questionable in some well-known areas
5. **Price/value** - 3-10x more expensive than alternatives with aggressive tier gating
6. **Offline reliability** - reports of it not working as advertised
7. **GPS reliability** - tracking issues are a recurring theme

### The Core Tension
Savvy Navvy is trying to be "Google Maps for boats" - simple, smart, just-works. But sailing navigation is fundamentally more complex than road navigation. The simplification that makes it accessible to beginners (clean charts, auto-routing) actively concerns experienced sailors who need chart detail and routing precision. The app needs to solve the "simple enough for beginners, trustworthy enough for experts" problem.
