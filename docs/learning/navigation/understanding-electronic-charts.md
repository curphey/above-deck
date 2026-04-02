---
title: "Understanding Electronic Nautical Charts"
summary: "What electronic charts actually contain, the difference between raster and vector formats, where free chart data comes from, and what S-57 means."
---

## What a Nautical Chart Actually Contains

A nautical chart is a database of the marine environment. On a paper chart, this information is encoded visually through symbols, colours, and typography developed over centuries. On an electronic chart, the same information is stored as structured data that software can query, filter, and display in different ways.

The core content includes depth information (soundings, contours, depth areas), the coastline, navigation aids (buoys, beacons, lights), hazards (rocks, wrecks, obstructions), restricted areas, and port infrastructure.

What makes electronic charts different from paper is that every feature is a data object with attributes. A buoy has a type, colour, shape, light characteristic, and unique identifier. You can tap on it and see all of that information. The software can generate alarms when you approach a hazard or cross a safety contour.

## Raster vs Vector Charts

There are two fundamentally different approaches to electronic charts, and understanding the distinction matters.

### Raster Charts

A raster chart is a digital photograph of a paper chart, georeferenced so software can overlay your GPS position on it. What you see on screen is exactly what the paper chart looks like. In the US, NOAA distributed these in BSB format for years.

The advantage is familiarity. The disadvantage is that raster charts cannot be queried, cannot be dynamically scaled (zooming in just makes pixels bigger), and cannot trigger automatic alarms. NOAA has discontinued new raster chart production. The future is vector.

### Vector Charts

A vector chart stores the chart content as a database of geometric objects with attributes. Depth areas are polygons with depth values. Buoys are points with type, colour, and light characteristics. Coastlines are lines. The chart plotter renders these objects on screen using a symbology standard (S-52) that specifies how each object type should be drawn.

Vector charts can be zoomed smoothly to any scale, individual features can be queried, and the software can generate alarms based on the data. Display can be customised to show or hide categories of information. The internationally recognised standard for vector nautical charts is S-57.

## S-57: The Current Standard

S-57 is the International Hydrographic Organization's transfer standard for digital hydrographic data. It defines an object-oriented data model where each chart feature is a classified object with standardised attributes.

The standard defines roughly 100 object classes covering everything a nautical chart needs to represent. Some of the key ones:

- **DEPARE** (depth areas): Polygons representing zones of water depth, such as 0-2m, 2-5m, 5-10m. These are what give the chart its characteristic depth shading.
- **SOUNDG** (soundings): Individual depth measurements shown as numbers on the chart, always referenced to chart datum.
- **DEPCNT** (depth contours): The lines connecting points of equal depth.
- **BOYLAT, BOYCAR** (buoys): Lateral and cardinal buoys with full attribute sets describing colour, shape, topmark, light characteristics, and radar conspicuity.
- **LIGHTS**: Navigation lights with their complete characteristics, including sector arcs showing the bearings between which each colour is visible.
- **OBSTRN, WRECKS, UWTROC**: Obstructions, wrecks, and underwater rocks with depth and nature attributes.
- **RESARE**: Restricted areas such as nature reserves, military areas, and cable zones.

Charts conforming to S-57 are called ENCs (Electronic Navigational Charts) and are published by national hydrographic offices. In commercial shipping, they are displayed on type-approved ECDIS equipment. For recreational use, the same data is displayed on chart plotters and apps.

## Where Free Charts Come From

### NOAA (US Waters)

NOAA is the gold standard for freely available nautical chart data. They publish approximately 1,200 individual ENC cells covering all US coastal waters, the Great Lakes, and US territories. These are S-57 format, updated weekly, and completely free to download and use.

NOAA also provides the same data in other formats: GeoJSON exports for GIS use, and pre-rendered raster tiles in MBTiles format. All of it is public domain.

### Other National Sources

Several other countries provide free chart data, though coverage is more limited than NOAA:

- **New Zealand (LINZ):** Free S-57 ENCs covering New Zealand and some Pacific island waters.
- **Germany (BSH):** Free S-57 data for German waters in the North Sea and Baltic.
- **Brazil (DHN):** Free S-57 ENCs for Brazilian waters.
- **France (SHOM):** Some data available through the open data portal, though the most useful chart data requires a licence.

### OpenSeaMap

OpenSeaMap provides community-contributed seamark data sourced from OpenStreetMap. Coverage quality varies by region, with European waters well covered and other areas patchy. Useful as a supplement but not a primary chart source.

## Chart Datum

Every depth value on a nautical chart is measured relative to a reference level called chart datum. This is a critical concept because the actual water depth at any moment is the charted depth plus the tidal height above chart datum.

Most countries use Lowest Astronomical Tide (LAT) as chart datum, which is the lowest tide level that can be predicted to occur under normal meteorological conditions. This is a conservative choice: the actual water level is almost always higher than chart datum, so charted depths represent a near-worst-case scenario.

The US uses Mean Lower Low Water (MLLW), which is slightly less conservative than LAT.

The practical point: when a chart shows 3 metres depth and the tide table says height of tide is 2 metres, the actual water depth is approximately 5 metres. If your boat draws 1.8 metres, you have 3.2 metres under the keel. But abnormal pressure or wind can shift the actual level from prediction.

## S-100 and S-101: The Next Generation

The IHO is replacing S-57 with a new framework called S-100, and the new chart standard within that framework is S-101. The transition timeline spans roughly a decade:

- **2026:** S-100 ECDIS becomes optionally available. NOAA begins producing charts in both S-57 and S-101 formats.
- **2029:** S-100 ECDIS becomes mandatory for newly installed systems on new ships.
- **2029-2036:** Both formats coexist in a dual-production period.
- **Around 2036:** Target for S-57 withdrawal, though no firm date is set.

S-101 brings a richer data model and support for additional data products including bathymetric surfaces, water level data, surface currents, and weather overlays. For practical purposes today, S-57 is the standard that matters. It will be available for at least another decade.

## What This Means in Practice

When you load charts on a plotter or app, you are looking at data that originated from a national hydrographic office in S-57 format (or a commercial equivalent from providers like C-MAP or Navionics). The software renders it using symbology rules derived from the S-52 standard, with colour palettes for day, dusk, and night viewing.

The quality of the underlying data depends on when the area was last surveyed. A busy commercial harbour may be surveyed with full-coverage multibeam sonar. A remote anchorage may still be based on lead-line soundings from a century ago. The source survey date is one of the most important pieces of information that experienced chart readers check.
