---
title: "Sizing Your Solar System"
summary: "How to calculate the right amount of solar panel wattage and battery capacity for your boat, based on what you actually use and where you sail."
---

## The Core Question

Every cruiser installing solar asks the same question: how much do I need? The answer depends on three things — how much power you use, where you sail, and how much margin you want for cloudy days.

The good news is that the maths is straightforward. You do not need an electrical engineering degree. You need a list of your electrical devices, a rough idea of where you will be sailing, and a calculator.

## Step 1: Figure Out What You Use

List every electrical device on your boat and estimate how many hours per day each one runs. Here is a typical 40-foot coastal cruiser:

| Device | Power (watts) | Hours/day | Daily energy (Wh) |
|--------|--------------|-----------|-------------------|
| LED anchor light | 3 | 12 | 36 |
| LED cabin lights | 20 | 5 | 100 |
| Refrigerator | 50 | 12 | 600 |
| Autopilot | 40 | 8 | 320 |
| Instruments and GPS | 15 | 12 | 180 |
| VHF radio (standby) | 2 | 24 | 48 |
| Laptop charging | 60 | 3 | 180 |
| Water pump | 60 | 0.5 | 30 |
| **Total** | | | **1,494 Wh** |

That is about 125 amp-hours on a 12V system. Boats with no refrigerator might use 30-50Ah per day. Boats with a watermaker and Starlink can draw 300Ah or more. If you have a battery monitor (like a Victron SmartShunt), use its actual consumption number instead of estimates.

## Step 2: Understand Peak Sun Hours

Solar panels are rated under ideal lab conditions you will never see on a boat. Instead, we use Peak Sun Hours (PSH): equivalent hours of full-strength sunlight per day. PSH varies dramatically by location and season:

| Cruising area | Summer PSH | Winter PSH |
|---------------|------------|------------|
| Caribbean / Tropics | 5.5-6.5 | 5.0-6.0 |
| South Florida | 5.5-6.5 | 4.0-4.5 |
| Mediterranean (south) | 6.5-7.5 | 2.5-3.5 |
| Mediterranean (north) | 6.0-7.0 | 1.5-2.5 |
| Chesapeake Bay | 5.0-5.5 | 2.5-3.0 |
| Pacific NW / UK | 4.5-5.5 | 1.0-1.5 |

This is the single biggest variable in sizing. A system that works in the Caribbean might cover only half your needs during a Mediterranean winter.

PVGIS, a free tool from the European Commission, provides precise solar irradiance data for any location. Enter coordinates and it returns monthly averages. No API key needed. This is the data source Above Deck's solar planner uses.

## Step 3: Account for Real-World Losses

A 400W solar panel does not produce 400W on your boat. Several factors eat into the rated output:

| Factor | Typical loss |
|--------|-------------|
| Temperature (panels get hot) | 10-15% |
| Flat mounting angle | 5-15% |
| Shading from boom, rigging, sails | 10-30% |
| Wiring and connection losses | 2-5% |
| Charge controller conversion | 2-5% |
| Salt spray and dirt | 2-5% |
| Boat motion and heeling | 3-8% |

Combined, expect 55-80% of rated output. Use 65% as a conservative default, or 75% with arch-mounted panels and minimal shading.

Shading is the biggest wildcard. A single shroud shadow can cut a conventional panel's output by 60%, because cells in series are limited by the weakest cell. This is why many cruisers use separate MPPT charge controllers per panel.

## Step 4: Calculate Panel Wattage

The formula is simple:

**Required watts = Daily consumption (Wh) / (Peak Sun Hours x System Efficiency)**

Using our example boat (1,494Wh/day) in the Caribbean (5.5 PSH) with 65% efficiency:

> 1,494 / (5.5 x 0.65) = 1,494 / 3.575 = **418W**

Now the same boat during a winter in the northern Mediterranean (2.5 PSH):

> 1,494 / (2.5 x 0.65) = 1,494 / 1.625 = **919W**

Panel sizing is a compromise. You can fit 400-500W on a bimini or arch, which covers you in the tropics. A European winter demands nearly a kilowatt. Most cruisers size for their primary cruising ground and accept supplemental charging elsewhere.

## Step 5: Size the Battery Bank

Your battery bank needs to store enough energy to get through periods without sun — overnight, and ideally a cloudy day or two.

The sizing depends on battery chemistry:

**For lead-acid or AGM batteries** (50% usable depth of discharge):

> Battery capacity (Ah) = Daily consumption (Ah) x 2 x Days of autonomy

For 125Ah/day with 2 days of autonomy: 125 x 2 x 2 = **500Ah**

**For LiFePO4 batteries** (80% usable depth of discharge):

> Battery capacity (Ah) = Daily consumption (Ah) x 1.25 x Days of autonomy

For 125Ah/day with 2 days of autonomy: 125 x 1.25 x 2 = **312Ah**

A useful rule of thumb that works across chemistries: aim for roughly 1 watt of solar per 1 amp-hour of battery capacity. A 400Ah bank pairs well with 400-500W of solar for three-season cruising.

## Step 6: Choose a Charge Controller

An MPPT charge controller sits between your panels and batteries, continuously optimising voltage and current to extract maximum power — 30% more than a basic PWM controller. For any system over 150W, MPPT is worth the investment.

Victron's naming is straightforward: MPPT 100/30 handles up to 100V input and 30A output. For typical installations: under 150W use a 75/15, 150-400W use a 100/30, 400-800W use a 100/50 or 150/35.

## Typical Configurations

**Weekend cruiser (30-35ft):** 100-200W solar, 200Ah AGM or 100Ah LiFePO4, small MPPT. Keeps the fridge running and batteries topped off between marina visits.

**Coastal cruiser (35-45ft):** 300-600W solar, 400Ah AGM or 200-300Ah LiFePO4, MPPT 100/30 or 100/50. Comfortable self-sufficiency in good weather. Engine charging supplements in winter.

**Bluewater cruiser (40-55ft):** 800-1200W solar, 600-800Ah AGM or 400-600Ah LiFePO4 (often 24V), multiple MPPTs. Designed for extended autonomy without shore power.

## The Takeaway

Solar sizing is about understanding trade-offs between consumption, location, and physical space. Start with an honest energy audit. Check the sun hours for where you actually sail. Run the formula. Then make a pragmatic decision based on how much panel area you have and where you are willing to supplement with other charging sources.
