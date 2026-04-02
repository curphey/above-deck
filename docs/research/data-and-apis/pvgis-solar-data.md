# PVGIS (Photovoltaic Geographical Information System) API

Research into PVGIS as a solar irradiance data source for boat solar sizing.
Last updated: 2026-03-30

---

## Overview

PVGIS is a free tool from the European Commission's Joint Research Centre (JRC) that provides solar radiation and PV system performance data for any location worldwide (except poles). It is the standard reference for solar resource assessment in Europe and is widely used globally.

**Key URL:** https://re.jrc.ec.europa.eu/api/

---

## API Base URLs

| Version | Base URL | Status |
|---------|----------|--------|
| PVGIS 5.3 (current) | `https://re.jrc.ec.europa.eu/api/v5_3/` | Active |
| PVGIS 5.2 | `https://re.jrc.ec.europa.eu/api/v5_2/` | Active |
| Legacy (unversioned) | `https://re.jrc.ec.europa.eu/api/` | Serves v5.2 |

---

## API Endpoints (Tools)

### 1. PVcalc -- Grid-Connected PV System Output

Estimates energy output of a grid-connected PV system.

**URL:** `https://re.jrc.ec.europa.eu/api/v5_3/PVcalc`

**Key parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `lat` | Yes | Latitude (decimal degrees, south negative) |
| `lon` | Yes | Longitude (decimal degrees, west negative) |
| `peakpower` | Yes | Nominal PV power in kW |
| `loss` | Yes | System losses in % (cables, inverter, dirt, etc.) |
| `angle` | No | Panel tilt angle from horizontal (degrees) |
| `aspect` | No | Panel azimuth (-180 to 180, 0=south, 90=west) |
| `outputformat` | No | `json`, `csv`, or `basic` |
| `pvcalculation` | No | 1 = calculate PV output |

**Example:**
```
https://re.jrc.ec.europa.eu/api/v5_3/PVcalc?lat=45&lon=8&peakpower=1&loss=14&outputformat=json
```

**Returns:** Monthly and annual energy production (kWh), irradiation on plane, sun hours.

### 2. SHScalc -- Off-Grid PV System (Most Relevant for Boats)

Simulates an off-grid PV system with battery storage. This is the most directly applicable endpoint for boat solar sizing.

**URL:** `https://re.jrc.ec.europa.eu/api/v5_3/SHScalc`

**Key parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `lat` | Yes | Latitude |
| `lon` | Yes | Longitude |
| `peakpower` | Yes | Nominal PV power in **watts** (not kW) |
| `batterysize` | Yes | Battery capacity in **Wh** |
| `consumptionday` | Yes | Daily energy consumption in **Wh** |
| `cutoff` | Yes | Battery discharge cutoff in % |
| `hourconsumption` | No | 24 comma-separated values (hourly consumption profile, normalised to sum=1.0) |
| `outputformat` | No | `json`, `csv`, or `basic` |

**Example:**
```
https://re.jrc.ec.europa.eu/api/v5_3/SHScalc?lat=45&lon=8&peakpower=400&batterysize=2400&consumptionday=800&cutoff=40&outputformat=json
```

**Returns:** Percentage of days with full battery, percentage of days battery runs empty, average battery state of charge by month.

### 3. MRcalc -- Monthly Radiation

Monthly average solar radiation data. Useful for seasonal planning (e.g., "how much sun will I get in the Canaries in December?").

**URL:** `https://re.jrc.ec.europa.eu/api/v5_3/MRcalc`

**Key parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `lat` | Yes | Latitude |
| `lon` | Yes | Longitude |
| `horirrad` | No | 1 = include horizontal irradiance |
| `optrad` | No | 1 = include irradiance at optimum angle |
| `selectrad` | No | 1 = include irradiance at selected angle |
| `angle` | No | Tilt angle (for selectrad) |
| `mr_dni` | No | 1 = include direct normal irradiance |
| `d2g` | No | 1 = include diffuse-to-global ratio |
| `avtemp` | No | 1 = include average temperature |
| `outputformat` | No | `json`, `csv`, or `basic` |

**Example:**
```
https://re.jrc.ec.europa.eu/api/v5_3/MRcalc?lat=28.1&lon=-15.4&horirrad=1&optrad=1&avtemp=1&outputformat=json
```

**Returns:** Monthly values for global horizontal irradiance (kWh/m2), optimal angle irradiance, temperature, etc.

### 4. DRcalc -- Daily Radiation

Daily radiation profiles averaged by month. Shows how irradiance varies through the day.

**URL:** `https://re.jrc.ec.europa.eu/api/v5_3/DRcalc`

### 5. seriescalc -- Hourly Radiation Time Series

Historical hourly radiation data for a specific period. Useful for detailed modelling.

**URL:** `https://re.jrc.ec.europa.eu/api/v5_3/seriescalc`

**Key parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `lat` | Yes | Latitude |
| `lon` | Yes | Longitude |
| `startyear` | No | First year of time series |
| `endyear` | No | Last year of time series |
| `pvcalculation` | No | 1 = calculate PV output (requires peakpower, loss) |
| `peakpower` | No | kW (if pvcalculation=1) |
| `loss` | No | % (if pvcalculation=1) |
| `outputformat` | No | `json`, `csv`, or `basic` |

### 6. tmy -- Typical Meteorological Year

Generates a synthetic "typical" year from historical data. Minimum 10 years of source data required.

**URL:** `https://re.jrc.ec.europa.eu/api/v5_3/tmy`

### 7. printhorizon -- Horizon Profile

Returns the horizon elevation profile for a location (terrain shading).

---

## Radiation Databases

| Database | Coverage | Resolution | Period |
|----------|----------|------------|--------|
| PVGIS-SARAH3 | Europe, Africa, parts of Asia (65N-65S, 65W-65E) | ~5 km | 2005-2023 |
| PVGIS-ERA5 | Global | ~28 km (0.28 deg) | 2005-2023 |
| PVGIS-NSRDB | Americas (60N-20S) | ~4 km | v5.2 only |

Select database with `raddatabase=PVGIS-SARAH3` (or `PVGIS-ERA5`, etc.).

For **boat use**, `PVGIS-ERA5` is the best choice as it provides global coverage including ocean areas. SARAH3 is higher resolution but limited to the METEOSAT satellite footprint.

---

## Rate Limits & Constraints

| Constraint | Value |
|-----------|-------|
| Rate limit | 30 requests/second per IP |
| HTTP method | GET only (HEAD for existence checks) |
| Overload response | HTTP 529 (retry after 4-5 seconds) |
| Rate limit response | HTTP 429 |
| Authentication | None required |
| Cost | Free |
| CORS/AJAX | Not allowed (no browser-side AJAX calls) |

The AJAX restriction means requests must be made server-side (which suits our Go API server architecture).

---

## Geographic Coverage for Boats

- **Worldwide coverage** via ERA5 dataset (except poles)
- **Coastal waters:** PVGIS 5.3 extended data availability to cover 25 km offshore, solving previous gaps at coastlines
- **Ocean passages:** ERA5 data available on open ocean at 0.28 degree resolution
- **Higher resolution:** SARAH3 available for Europe/Africa/Middle East sailing areas

This makes PVGIS suitable for:
- Pre-passage solar energy planning ("how much solar will I generate crossing the Atlantic in November?")
- Sizing panels for a specific cruising ground
- Comparing seasonal solar availability across potential cruising routes
- Validating whether a solar setup meets consumption needs at different latitudes

---

## Application to Boat Solar Sizing

### Most Useful Endpoints

1. **MRcalc** -- Query monthly horizontal irradiance for any lat/lon. Use this to show "expected daily solar harvest" by month for a given location or route.

2. **SHScalc** -- Model an off-grid system (panels + battery + daily consumption). Returns whether the system is adequate. Directly applicable to boat electrical systems.

3. **seriescalc** -- Get hourly data for detailed simulation. Could power a "will my batteries last this passage?" calculator.

### Boat-Specific Considerations

- **Panel angle:** Boat panels are typically flat-mounted (0 degrees tilt) or on a slight arch. Use `angle=0` for horizontal mounting. Bimini-mounted panels might be 10-15 degrees.
- **Aspect:** Boats swing at anchor, so effective aspect varies. Use horizontal irradiance (`horirrad=1` in MRcalc) as the most representative metric.
- **Losses:** Boat solar systems have higher losses than rooftop: heat (panels on dark surfaces), partial shading (boom, rigging, sails), wiring runs, charge controller efficiency. Use 20-25% loss factor rather than the typical 14% for rooftop.
- **Consumption profiles:** Use `hourconsumption` in SHScalc to model realistic boat loads (fridge 24/7, instruments during day, lights at night, watermaker runs).

### Example: Query for Las Palmas, Gran Canaria

Monthly irradiance for a common Atlantic crossing departure point:
```
https://re.jrc.ec.europa.eu/api/v5_3/MRcalc?lat=28.1&lon=-15.4&horirrad=1&outputformat=json
```

Off-grid simulation for 400W panels, 200Ah 12V battery, 800Wh/day consumption:
```
https://re.jrc.ec.europa.eu/api/v5_3/SHScalc?lat=28.1&lon=-15.4&peakpower=400&batterysize=2400&consumptionday=800&cutoff=40&outputformat=json
```

### Integration Architecture

```
Browser (solar planner UI)
    |
    v
Go API server (/api/solar/irradiance?lat=X&lon=Y)
    |
    v
PVGIS API (server-side, due to CORS restriction)
    |
    v
Cache response (solar data is static -- cache aggressively, e.g. 30 days)
    |
    v
Return processed results to UI
```

Key: PVGIS blocks browser-side AJAX, so all requests must go through our Go API server. This is fine -- it lets us cache responses and add boat-specific post-processing (adjusting for flat panel mounting, higher loss factors, etc.).

---

## Comparison with Alternatives

| Source | Coverage | Cost | Resolution | API | Boat-Friendly |
|--------|----------|------|------------|-----|----------------|
| PVGIS | Global | Free | 5-28 km | Yes (REST) | Good (25km offshore) |
| NASA POWER | Global | Free | 50 km | Yes (REST) | Good (ocean coverage) |
| Solcast | Global | Paid ($) | 1-2 km | Yes (REST) | Limited (land-focused) |
| SolarGIS | Global | Paid ($$$) | 250m | Yes (REST) | No (land only) |
| Meteonorm | Global | Paid ($$) | Interpolated | Desktop only | No |

**Recommendation:** Use PVGIS as primary source (free, good API, adequate resolution). Consider NASA POWER as fallback for areas where PVGIS ERA5 has gaps. No need for commercial alternatives for boat use cases -- the precision difference is irrelevant when panels are flat-mounted on a moving vessel.

---

## NASA POWER (Alternative/Supplement)

Worth noting as a complementary source:
- **URL:** https://power.larc.nasa.gov/
- **API:** REST, free, no key required
- **Coverage:** Global including full ocean
- **Data:** Daily/monthly/annual solar radiation, temperature, wind, humidity
- **Resolution:** 0.5 x 0.5 degree grid
- **Advantage over PVGIS:** Full ocean coverage (not just 25km offshore), also includes wind data useful for passage planning
- **Disadvantage:** Lower spatial resolution than PVGIS SARAH
