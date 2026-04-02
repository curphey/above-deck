---
title: "How Tidal Predictions Work"
summary: "What drives tides, how predictions are calculated from harmonic constituents, spring and neap cycles, and where to find free tidal data."
---

## Why Tides Matter for Sailing

Tides affect almost every decision in coastal sailing. Will there be enough water to enter the harbour when you arrive? Will you clear the fixed bridge on the way out? How much anchor chain do you need for the depth at high water? Which direction is the current running, and how fast?

Get tides wrong and the consequences range from inconvenient (sitting on the mud for six hours) to dangerous (grounding on a falling tide in an exposed location, or encountering breaking seas where wind opposes a strong tidal stream).

The good news is that tides are among the most predictable natural phenomena on earth. Unlike weather, which is inherently chaotic beyond a few days, tides are driven by the precise, predictable orbital mechanics of the Moon and Sun. A tidal prediction for next year is essentially as accurate as one for tomorrow.

## What Drives the Tides

The Moon's gravitational pull creates a bulge of water on the side of the Earth facing the Moon, and a corresponding bulge on the opposite side (caused by centrifugal force from the Earth-Moon system's rotation). As the Earth rotates through these bulges, most locations experience two high tides and two low tides per day.

The Sun exerts the same effect but at roughly half the strength. When the Sun and Moon align (at new moon and full moon), their forces combine to produce spring tides with the largest tidal range. When they are at right angles (first and third quarter moon), the forces partially cancel, producing neap tides with the smallest range.

This is the basic picture, but reality is more complex. The Moon's orbit is elliptical, declination angles change, and the shape of ocean basins modifies how the tidal wave propagates and amplifies.

## Harmonic Constituents

Tidal prediction works by decomposing the tide into dozens of individual periodic signals, each corresponding to a specific astronomical motion. These are called harmonic constituents.

The most important constituent is M2, the principal lunar semidiurnal component, with a period of 12 hours and 25 minutes. This is the Moon's basic twice-daily pull. The second most important is S2, the principal solar semidiurnal component, with a period of exactly 12 hours.

M2 and S2 together explain the spring-neap cycle. Because their periods are slightly different, they drift in and out of phase over about 14.7 days. When they are in phase, their amplitudes add up (spring tides). When they are out of phase, they partially cancel (neap tides).

Beyond these two, there are constituents for the Moon's elliptical orbit (N2), declination effects (K1, O1, P1), seasonal variations (Sa, Ssa), and shallow-water effects (M4, M6). NOAA uses 37 constituents in their standard predictions.

Each constituent has two location-specific values: an amplitude (how much it contributes to the tidal range) and a phase (when it peaks relative to a reference time). These are determined by analysing at least a year of water level measurements at a tide gauge. Once you have these harmonic constants for a station, you can predict the tide at that location for any future date by summing all the constituents.

## The Spring-Neap Cycle

The roughly 14.7-day spring-neap cycle has major practical effects:

**At spring tides** (near full and new moon), the tidal range is 30-40% greater than average. High water is higher, low water is lower, and tidal streams run 30-40% stronger. A shallow harbour bar that is safely crossable four hours either side of high water on neaps might only be passable two hours either side on springs. Tidal gates become more critical because the streams are faster and the safe windows are narrower.

**At neap tides** (near quarter moons), the range is 30-40% less than average. Streams are weaker, conditions are generally more forgiving. However, a harbour that has enough water at low water neaps may dry out at low water springs.

When planning a passage, always check where you are in the spring-neap cycle. It affects your departure time, your route through tidal gates, your under-keel clearance at the destination, and how much the current will help or hinder you along the way.

## Tidal Streams and Currents

Tidal heights tell you how deep the water is. Tidal streams tell you which way the water is moving horizontally, and how fast. For passage planning, streams often matter more than heights.

A 6-knot boat in a 2-knot foul tide makes only 4 knots over the ground. Turn that tide fair and you are making 8 knots. On a 60-mile coastal passage, timing the tidal streams correctly can save hours.

Streams are strongest near headlands, through narrow channels, and around islands. Traditional nautical charts show tidal stream data through tidal diamonds, lettered reference points linked to a table giving stream direction and rate for each hour relative to high water at a reference port.

In some locations, streams are so strong that passage is only practical during a limited window around slack water. Portland Bill sees streams exceeding 7 knots at springs. The Alderney Race can exceed 10 knots. These are tidal gates, and getting the timing wrong is dangerous.

## Where to Find Free Tidal Data

### NOAA CO-OPS (US Waters)

The best free tidal data source if you sail US waters. NOAA provides predictions for over 3,000 tide stations and 2,800 current stations, with no API key and no cost. Critically, NOAA also publishes the raw harmonic constituents for each station, which means you can compute predictions locally without needing an internet connection.

### UK Admiralty Tidal API

Covers UK and Irish waters with about 600 stations. The free tier is limited to roughly 40 ports with 7 days of predictions. The Foundation tier at 144 pounds per year opens up all stations with 13 days of predictions. Tidal stream data requires the Premium tier.

### Global Coverage

For waters outside the US and UK, TideCheck provides global coverage through a modern API using the TICON-4 international constituent database. FES2022 is a global tidal model on a 7 km grid that can compute tides anywhere in the ocean, though it is less accurate near complex coastlines than station-based predictions.

## What Predictions Cannot Tell You

Harmonic tidal predictions account for astronomical forces only. They do not include the effects of weather. A strong onshore wind or low barometric pressure can raise the actual water level well above the predicted height. A sustained offshore wind or high pressure can lower it. Storm surges can add metres to predicted heights.

The general rule: low pressure raises sea level by about 1 cm per millibar below the mean. A 980 mb low raises the water roughly 30 cm above prediction. Wind effects can be larger, especially in shallow enclosed waters. If you are cutting it fine on under-keel clearance, the prediction alone is not enough. Factor in what the weather is doing to actual water levels on the day.
