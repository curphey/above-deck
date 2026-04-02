---
title: "Understanding Marine Weather Data"
summary: "Where marine weather forecasts come from, what GRIB files are, and which forecast models to trust for different sailing situations."
---

## Where Marine Weather Data Comes From

Every weather forecast you see on a sailing app, website, or GRIB viewer originates from a numerical weather prediction model. These are massive computer simulations that divide the atmosphere into a three-dimensional grid, apply the laws of physics, and step forward in time to produce forecasts. Different agencies around the world run different models, and they do not always agree.

Understanding which model produced your forecast matters. A forecast that says "15 knots southwest" is only as good as the model behind it, and models have different strengths depending on where you are sailing and how far ahead you are looking.

## The Major Forecast Models

### GFS (Global Forecast System)

Run by NOAA in the United States, GFS is the most widely accessible global weather model. It covers the entire planet at roughly 28 km resolution, updates four times daily, and extends out to 16 days. All GFS data is public domain and free to use.

GFS is the workhorse of offshore sailing weather. It is the model behind most free GRIB downloads through services like Saildocs, and it is what you receive when you request weather data over SSB radio or satellite. Its 16-day range makes it useful for departure planning, though accuracy drops significantly after day 5. The main limitation is resolution. At 28 km grid spacing, GFS cannot capture localised coastal effects like sea breezes or wind acceleration through straits.

### ECMWF (European Centre for Medium-Range Weather Forecasts)

Widely regarded as the most accurate global model, ECMWF runs at roughly 9 km resolution and extends to 10-15 days. It is operated by an intergovernmental organisation of 35 European member states and has consistently outperformed GFS in verification tests, particularly in the 3-10 day range.

As of October 2025, ECMWF has made its full forecast catalogue openly available under a CC-BY-4.0 licence. This is a significant shift. Previously, high-resolution ECMWF data cost hundreds of thousands of pounds per year and was only available to national weather services and top racing teams.

ECMWF also runs the WAM wave model, which provides excellent separation of wind waves and swell. This matters because a 2-metre swell with a 12-second period is comfortable sailing, while 2-metre wind waves at 5 seconds is thoroughly unpleasant. ECMWF WAM distinguishes between the two.

### ICON (DWD)

Run by the German Weather Service, ICON is available in three nested resolutions: 13 km globally, 7 km over Europe, and 2.2 km over central Europe. All ICON data is freely available.

For sailing in the Mediterranean, North Sea, Baltic, or English Channel, ICON-EU at 7 km resolution often outperforms both GFS and ECMWF for short-range forecasts. The 2.2 km ICON-D2 model is the highest-resolution free operational model available for European waters.

### HRRR and NAM (NOAA Regional Models)

For US coastal waters, NOAA runs the High Resolution Rapid Refresh (HRRR) model at 3 km resolution with hourly updates, and the North American Mesoscale (NAM) model at 3-12 km. HRRR is exceptional for same-day coastal sailing decisions because it captures sea breeze development, thunderstorm cells, and coastal convergence that global models miss entirely. The trade-off is a short forecast range of 18-48 hours.

## Which Model to Trust

No single model is best in all situations. Here is a practical guide:

- **For departure planning (5-14 days out):** Compare GFS and ECMWF. If they agree on the general pattern, you can have reasonable confidence. If they disagree, wait for convergence before committing to a departure window.
- **For offshore passages:** ECMWF for the most accurate 3-10 day picture. GFS as a cross-check and for its longer 16-day range.
- **For European coastal waters:** ICON-EU often beats the global models for the first 2-3 days.
- **For US coastal day-sailing:** HRRR is unmatched in resolution and update frequency.
- **Beyond 7-8 days:** Treat all models as pattern guidance only. For slow-moving sailboats covering 100-200 nm per day, climatological data becomes more useful than extended forecasts for mid-ocean decisions.

When models disagree, do not simply pick the one you prefer. Disagreement itself is information. It tells you the atmosphere is in an uncertain state, and a conservative decision is warranted.

## What GRIB Files Are

GRIB (GRIdded Binary) is the standard file format for gridded weather data. It is what the models actually output, and it is what you download when you request forecast data for a specific area.

A GRIB file contains weather parameters (wind, pressure, waves, precipitation) on a regular latitude/longitude grid at discrete time steps. The format is highly compressed, which matters when you are downloading data over satellite or SSB radio where bandwidth is measured in kilobytes.

File size depends primarily on the area you request and the grid spacing. A 10-day wind and pressure forecast for a 7 by 14 degree area at quarter-degree resolution is roughly 345 KB. The same area at 1-degree resolution drops to about 43 KB. For satellite downloads where bandwidth costs real money, requesting coarse grids with only the parameters you need (wind and pressure) keeps files practical.

### How to Get GRIB Data

For pre-departure planning with internet access, services like Open-Meteo provide the same model data in convenient JSON format through a REST API, which is easier to work with than raw GRIB files.

For offshore use without internet, Saildocs is the critical service. You send a plain-text email to query@saildocs.com specifying the model, area, parameters, and forecast hours, and it returns a GRIB file as an attachment. This works over SailMail, Winlink, or Iridium.

Direct GRIB downloads are also available from NOAA NOMADS, DWD Open Data (for ICON), and the ECMWF open data catalogue.

## Forecast Confidence by Time Range

A useful mental model for forecast reliability:

- **0-48 hours:** High confidence. Detailed decisions about sail plan and routing are well supported.
- **2-5 days:** Moderate confidence. Good for identifying weather windows and general passage timing. Compare at least two models.
- **5-10 days:** Low confidence. Useful for departure window selection but not for operational routing decisions.
- **Beyond 10 days:** Pattern guidance only. Useful for spotting high-pressure windows or frontal timing, but do not plan specific waypoints around it.

Forecast accuracy also depends on the weather pattern itself. Stable high-pressure systems are predictable a week out. Fast-moving frontal systems in the mid-latitudes are difficult to pin down beyond 3-4 days.
