---
title: "AIS: What It Is and Why It Matters"
summary: "A practical guide to the Automatic Identification System — how it works, what data it provides, the difference between Class A and B, and how to receive AIS on your boat."
---

## What AIS Does

The Automatic Identification System is a transponder-based system that lets vessels see each other electronically. Every ship equipped with AIS continuously broadcasts its identity, position, course, and speed over dedicated VHF radio frequencies. Other AIS-equipped vessels receive these broadcasts and display nearby traffic on their chartplotter or navigation screen.

Think of it as a real-time map of every vessel around you that is transmitting. You can see their name, where they are, how fast they are going, and where they are headed — even before they appear on radar, even around headlands, and even in conditions where visibility is poor.

AIS was originally developed for commercial shipping to prevent collisions. It is now widely adopted among cruising sailors and has become one of the most valuable safety systems you can install on a recreational boat.

## How It Works

AIS operates on two dedicated VHF frequencies. Vessels take turns broadcasting short data bursts using a self-organising time-division system that handles thousands of vessels without interference.

Every AIS-equipped vessel broadcasts two types of information:

**Dynamic data** — transmitted frequently, updated in real time:
- Position (latitude, longitude from the vessel's GPS)
- Speed over ground
- Course over ground
- Heading
- Rate of turn
- Navigation status (underway, at anchor, moored, not under command)

**Static data** — transmitted less frequently:
- MMSI number (the vessel's unique identifier)
- Vessel name and call sign
- Ship type (cargo, tanker, sailing vessel, pleasure craft)
- Dimensions (length, beam)
- Draught
- Destination and ETA

## Class A vs. Class B

There are two classes of AIS transponder.

**Class A** is required on commercial vessels over 300 gross tons. Transmits at 12.5W with fast update rates. Costs $2,000-5,000 and is rarely found on recreational boats.

**Class B** is designed for recreational vessels. Transmits at 2W with slower updates. Costs $400-800. **Class B+** transmits at 5W with faster updates ($600-1,200) and is increasingly recommended for offshore sailing.

| Feature | Class A | Class B | Class B+ |
|---------|---------|---------|----------|
| Transmit power | 12.5W | 2W | 5W |
| Update rate (moving) | 2-10 seconds | 30 seconds | 5 seconds |
| Update rate (stationary) | 3 minutes | 3 minutes | 3 minutes |
| Text messaging | Yes | No | No |
| Typical cost | $2,000-5,000 | $400-800 | $600-1,200 |
| Required on | Commercial vessels | Voluntary | Voluntary |

## CPA and TCPA: The Numbers That Matter

On your chartplotter, AIS targets appear as triangular icons. The two critical numbers are:

**CPA (Closest Point of Approach)** — the minimum distance that vessel will pass from you if both maintain current course and speed.

**TCPA (Time to Closest Point of Approach)** — how long until that closest point occurs.

A cargo ship with a CPA of 0.2nm and TCPA of 45 minutes gives you time to alter course. The same CPA with a TCPA of 3 minutes means act now. Most chartplotters let you set alarms — a common configuration is CPA under 0.5nm and TCPA under 15 minutes.

## Receiving AIS on Your Boat

You have three options for getting AIS data, ranging from free to full-featured.

### Receive-Only (Cheapest)

An AIS receiver picks up broadcasts but does not transmit. You can see other vessels, but they cannot see you. Costs $100-200. Better than nothing, but you remain invisible to commercial traffic.

### Class B Transponder (Recommended)

A transponder both receives and transmits. The minimum recommended setup for cruising. Class B units from em-trak, Vesper, and Digital Yacht cost $400-800 and integrate with your NMEA network. Some modern VHF radios include built-in AIS.

### SDR (Software-Defined Radio)

For the technically inclined, a USB SDR dongle ($25-40) plugged into a boat computer can receive and decode AIS signals in software. Receive-only, but remarkably capable at a fraction of the cost.

## Why AIS Matters for Cruising Sailors

**Collision avoidance.** Large vessels move fast and may not see a small yacht on radar. AIS makes you visible electronically with your name attached. A bridge officer sees "SV Wanderer, 7 knots, bearing 045" and can make decisions.

**Night sailing.** AIS tells you what that cluster of lights actually is, how far away it is, and whether it is heading toward you. Transforms night watches from anxious guessing into informed decision-making.

**Anchoring.** AIS shows which boats nearby are swinging on anchor versus actually moving. Some chartplotters trigger anchor alarms based on AIS position drift.

**Passage planning.** AIS aggregators like MarineTraffic let you study shipping lanes, harbour traffic, and ferry schedules before you sail.

## AIS and Above Deck

Above Deck can receive AIS data from your boat's NMEA network and display vessel traffic on the chartplotter. If you have an AIS transponder connected to your NMEA 2000 backbone, the data flows through the same gateway (iKonvert or NavLink2) that carries the rest of your instrument data.

On the standalone chart page, Above Deck also displays live AIS vessel positions from online data sources, so you can see traffic patterns even without your own AIS hardware connected.

## The Practical Recommendation

If you are coastal cruising, a Class B transponder is one of the best safety investments you can make. The cost is comparable to a mid-range VHF radio, and the situational awareness it provides — especially at night, in fog, or near shipping lanes — is transformative.

Adoption among cruisers is now around 60-70%, and growing. Regulatory bodies in many regions are pushing toward mandatory AIS for all vessels. If you do not have it yet, it is worth prioritising in your next electronics upgrade.
