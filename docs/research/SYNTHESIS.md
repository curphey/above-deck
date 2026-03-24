# Research Synthesis — Key Findings & Next Steps

**Date:** 2026-03-24
**Research base:** 30 documents, ~10,000 lines of analysis

---

## The Opportunity

Every marine MFD vendor (Raymarine, Garmin, Simrad, Furuno) is building a walled-garden platform. They sell $2-5K displays, lock you into their chart format, their sensor ecosystem, their app store. The software is slow to update, tied to one screen, and can't do AI or social.

**We build the platform layer that makes the hardware irrelevant.** Run on any screen. Connect to any sensor. Use any chart. Add AI and social that hardware vendors can't.

---

## Key Research Findings

### 1. UX Model (from Raymarine Axiom 2 deep-dive)

The Axiom 2 sets the UX bar:
- **App grid home** with live thumbnail previews
- **Composable split views** — any two apps side by side
- **Instrument dashboard** with analog/digital/bar/tape gauges
- **Boat plan view** for systems management (power, fluids, lights, drive, climate, bilges)
- **Status bar** — position, time, connectivity, alarms

**Action:** Redesign our MFD shell as a composable app grid. Each tool = an app tile. Support split views.

### 2. Charts & Navigation (from passage planning + mapping research)

- **Free charts exist:** NOAA ENCs (US), OpenSeaMap. But no free global vector chart source.
- **The depth problem:** Our OSM tiles show no depth data. GEBCO bathymetry helps at ocean scale but not harbour scale. Real depth contours require S-57 ENC data.
- **Route planning is the killer feature:** Savvy Navvy proved this. Auto-routing considering weather + tides + hazards is what sailors will pay for.

**Action:** Integrate NOAA ENCs for US waters (free). For global, investigate Navionics/C-MAP licensing or OpenSeaMap depth contributions. Build passage planning as the premium feature.

### 3. Weather (from marine weather deep-dive)

- **Best free API:** Open-Meteo marine endpoint — global, no key, wind/waves/visibility
- **GRIB files** are the standard for offshore sailors. GFS data is free from NOAA NOMADS.
- **Weather routing** (isochrone method) needs polar diagrams — boat-specific performance data
- **PredictWind** is the gold standard but expensive ($250/yr). Their departure planning feature alone is worth competing with.

**Action:** Already using Open-Meteo. Next: add GRIB overlay on chart, then build departure timing tool (when to leave based on weather window).

### 4. Tides (from tides & currents research)

- **Best free global API:** WorldTides (limited free tier) or compute from FES2014 harmonics
- **NOAA CO-OPS** is excellent but US-only
- **Harmonic prediction** can be done client-side — 37 constituents give good accuracy
- **Tidal gates** (when you can pass through a tidal channel) are the most practical feature

**Action:** Start with NOAA CO-OPS for US waters (free, excellent). Add tidal height display on chart. Build tidal gate calculator for passage planning.

### 5. Boat Systems (from boat systems monitoring research)

- **SignalK** is the open-source data bus — connects NMEA 2000, Victron, sensors to a web API
- **Victron** is on 80%+ of cruising boats with solar. Their VRM cloud API and Venus OS MQTT are the easiest integration path.
- **Progressive approach:** Start with Victron VRM cloud data (no hardware needed), then add SignalK for onboard real-time, then direct NMEA 2000.
- **Simarine PICO** has the best battery/tank monitoring UI — study it.

**Action:** Build Victron VRM integration first (cloud API, works from anywhere). Display battery SOC, solar yield, consumption. This alone is hugely valuable.

### 6. Platform Ecosystem (from MFD ecosystems research)

- **Garmin OneHelm** is the most open (third-party apps) but still hardware-locked
- **~15M recreational boats worldwide**, ~4M with MFDs
- **Liveaboards and coastal cruisers** are the most underserved segment
- **OpenCPN** hasn't won despite being free because: ugly UX, no mobile, no cloud, no AI

**Action:** Target liveaboards/cruisers first. They need boat management + passage planning + community. Weekend sailors just need a chart.

---

## Build Priority (Next 6 Months)

### Phase 1: Foundation (Now)
- [ ] Redesign MFD shell as composable app grid (Axiom-style)
- [ ] Each tool = an app tile with live preview
- [ ] Split view support (any two apps side by side)
- [ ] Responsive: works on 7" tablet to 27" desktop

### Phase 2: Navigation (Month 1-2)
- [ ] NOAA ENC chart integration (US waters, free)
- [ ] Tidal height overlay on chart (NOAA CO-OPS)
- [ ] Weather overlay (Open-Meteo wind/waves on chart)
- [ ] Departure timing tool ("when should I leave?")

### Phase 3: Boat Management (Month 2-3)
- [ ] Victron VRM cloud integration (battery, solar, consumption)
- [ ] Instrument dashboard (gauges, graphs, Simarine-style)
- [ ] Boat plan view (interactive SVG with system zones)

### Phase 4: Passage Planning (Month 3-4)
- [ ] Route creation + editing on chart
- [ ] Tidal gate calculation
- [ ] Weather window analysis
- [ ] GRIB file overlay

### Phase 5: Social & AI (Month 4-6)
- [ ] Anchorage reviews / community POIs
- [ ] Route sharing
- [ ] AI copilot with full platform data access
- [ ] Friend tracking via AIS

---

## Design Principles (from research)

1. **Offline-first** — boats are offline. Everything must work without internet.
2. **Data over decoration** — sailors want information density, not whitespace.
3. **Progressive complexity** — simple for weekend sailors, deep for ocean cruisers.
4. **Hardware-agnostic** — any screen, any sensor, any chart source.
5. **AI-native** — the copilot knows your boat, your route, your weather.
