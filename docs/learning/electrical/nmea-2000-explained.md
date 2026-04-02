---
title: "NMEA 2000 Explained for Cruisers"
summary: "What NMEA 2000 is, how it connects your boat's instruments, what gateways do, and how Above Deck reads your boat data."
---

## The Problem NMEA 2000 Solves

On older boats, every instrument talks to one other instrument through a dedicated cable. Your GPS sends position data to the chartplotter on one wire. Your depth sounder sends depth to a display on another. Your wind sensor has its own cable running down the mast. If you want three instruments to share data, you need three separate cables. Add a new device and you are pulling more wire.

NMEA 2000 replaces all of that with a single backbone cable that every instrument plugs into. One cable. Every device on the network can talk to every other device. Plug in a new instrument, and it announces itself to the network and starts sharing data immediately.

## NMEA 0183 vs. NMEA 2000

Most cruising boats have a mix of both protocols, so it helps to understand the difference.

**NMEA 0183** is the older standard, dating from the 1980s. It sends plain text sentences over serial cables. Simple and human-readable, but each cable connects one talker to one or two listeners. If you want your GPS data to reach five instruments, you need additional wiring or a multiplexer.

**NMEA 2000** is built on CAN bus, the same technology used in cars and trucks. It is a true network. All devices share a single backbone cable, and any device can broadcast data that all other devices receive. Update rates are faster and the data is more compact.

| Feature | NMEA 0183 | NMEA 2000 |
|---------|-----------|-----------|
| Wiring | Point-to-point, one cable per connection | Single backbone, devices tee in |
| Data format | Plain text sentences | Structured binary |
| Speed | 4,800 baud (slow) | 250 kbit/s (fast) |
| Adding devices | New cables required | Plug into the backbone |
| Typical age | Pre-2010 gear | 2010 and newer |

## How the NMEA 2000 Backbone Works

The backbone is a single cable running through your boat with a terminator at each end. Instruments connect to it using tee connectors and drop cables. Think of it like a garden hose with spigots along its length.

The backbone needs power (12V DC from your boat's electrical system) and termination resistors at both ends to keep the electrical signals clean. Most backbone kits include the terminators. The connectors are proprietary Micro-C connectors that click together and provide a waterproof seal.

A typical installation might look like this: the backbone runs from the helm station aft, through the salon, to the nav station forward. Along the way, the GPS, depth transducer, wind sensor display, autopilot computer, AIS transponder, and chartplotter all tee into it.

## What Data Travels on NMEA 2000

NMEA 2000 organises data into Parameter Group Numbers (PGNs). Each PGN defines a specific type of data. Your instruments do not need to know about each other. They just broadcast their PGN, and any device that cares about that data type listens.

Common data on a cruising boat's NMEA 2000 network:

- **Position** — latitude, longitude, course over ground, speed over ground
- **Depth** — water depth below the transducer
- **Wind** — apparent and true wind speed and direction
- **Heading** — magnetic and true heading from your compass sensor
- **Speed** — boat speed through the water
- **AIS targets** — position and identity of nearby vessels
- **Engine data** — RPM, oil pressure, coolant temperature, fuel consumption
- **Battery status** — voltage, current, state of charge
- **Tank levels** — fuel, water, holding tank
- **Environmental** — air temperature, water temperature, barometric pressure

Priority is built into the protocol. Safety-critical data like rudder position and heading wins if two devices try to transmit simultaneously. Less urgent data like cabin temperature waits its turn. This happens automatically without any configuration.

## Gateways: Bridging Old and New

Most cruising boats have a mix of older NMEA 0183 instruments and newer NMEA 2000 gear. Gateways bridge the two worlds.

A gateway sits between your NMEA 2000 backbone and a computer or older instruments. It translates data between protocols and makes it accessible over USB or WiFi.

Two gateways are particularly relevant for getting boat data into Above Deck:

### Actisense iKonvert

The iKonvert is a USB gateway. Plug one end into your NMEA 2000 backbone and the other into a USB port on your boat computer. It handles the protocol complexity in firmware, so software receives clean, decoded data. No drivers needed on most systems.

### Digital Yacht NavLink2

The NavLink2 is a WiFi gateway. It connects to your NMEA 2000 backbone and broadcasts the data over WiFi. Any device on your boat's WiFi network (tablet, phone, laptop) can receive instrument data wirelessly. No USB cable required. This is particularly useful if your boat computer is not physically near your NMEA 2000 backbone.

Both gateways cost around $200 and are straightforward to install. You are connecting a single cable to your existing backbone and either a USB port or your WiFi network.

## The Real World: Mixed Networks

Most cruising boats have a mix of both protocols. Your VHF radio probably outputs AIS data over NMEA 0183. Your newer chartplotter speaks NMEA 2000. The practical approach is to handle both. An Actisense NGW-1 gateway converts NMEA 0183 to NMEA 2000, putting everything on one network. Or a WiFi gateway can receive both protocols and present unified data.

Above Deck's approach is gateway-first. Rather than requiring direct CAN bus wiring and Linux kernel configuration, you use a gateway that handles the electrical and protocol details. Your boat computer connects through USB or WiFi. This works on both Linux and macOS.

## SignalK: The Translator

SignalK is an open-source data standard that converts NMEA 0183, NMEA 2000, and other protocols into a single JSON format accessible over WiFi. If you already have a SignalK server running, Above Deck works with it. If you do not, the gateway approach gets your data flowing without a separate server.

## Getting Started

For a cruiser who wants to get boat data into Above Deck, the recommended path is:

1. **Identify what you have.** Check whether your instruments use NMEA 2000 (Micro-C connectors, backbone cable), NMEA 0183 (serial cables with bare wires or DB-9 connectors), or both.
2. **Pick a gateway.** If you can run a USB cable to your boat computer, the Actisense iKonvert is the simplest option. If wireless is more practical, the Digital Yacht NavLink2 works well.
3. **Connect and go.** Plug the gateway into your NMEA 2000 backbone. Connect to your computer via USB or WiFi. Above Deck reads the data stream.

No soldering. No CAN bus wiring. No Linux kernel modules. The gateway handles the hard parts, and you get live boat data on your screen.
