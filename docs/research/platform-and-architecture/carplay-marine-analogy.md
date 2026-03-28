# CarPlay as an Analogy for a Marine Navigation Platform

## 1. How CarPlay Works

### Architecture: Phone Runs the Apps, Car Display Is Just a Screen

CarPlay's core architecture is a projection model. The iPhone does all computation -- running apps, rendering the UI, processing navigation, handling Siri requests. The car's head unit is a thin client: it receives a video stream, plays audio, and forwards user input back to the phone. The head unit needs no app store, no OS updates, no intelligence of its own.

The key software components on the head unit side are:

- An IP-based link to the iPhone (over USB or Wi-Fi)
- An IP client for data exchange
- An instance of Apple's CarPlay Communication Plug-in (control protocol)
- An audio framework (play/record)
- A video framework (render the incoming H.264 stream)

### Protocol: What Flows Between Phone and Head Unit

**Video:** The iPhone encodes its CarPlay display output as an H.264 video stream (the same encoding used by AirPlay) and transmits it over a TCP connection to the head unit. The head unit simply renders this stream -- it has no knowledge of what's on screen.

**Audio:** All audio (music, navigation prompts, phone calls, Siri responses) is transmitted from the iPhone to the head unit. Microphone audio flows in the reverse direction -- from the car's mic back to the iPhone for Siri and phone calls.

**Control protocol:** User input (touch coordinates, knob rotations, button presses) is forwarded from the head unit to the iPhone over the iAP2 (iPod Accessory Protocol 2) communication protocol. Vehicle sensor data (speed, GPS from the car, steering wheel button events) also flows over iAP2.

**Wired connection:** USB provides both data transport and power to the iPhone. The IP link runs over USB.

**Wireless connection:** Bluetooth handles discovery and initial pairing. The iPhone receives Wi-Fi credentials over Bluetooth, connects to the head unit's Wi-Fi network, then Bluetooth disconnects. All subsequent communication (video, audio, control) runs over Wi-Fi.

### App Grid Home Screen

CarPlay presents a grid of app icons on the head unit display, visually similar to the iPhone home screen but with larger touch targets optimized for in-car use. The grid is the universal launcher -- every CarPlay session starts here. Users can rearrange icons from their iPhone settings. This is directly analogous to an MFD app grid.

### Supported App Categories

Apple restricts CarPlay apps to categories that are safe and useful while driving:

- Navigation (Apple Maps, Google Maps, Waze)
- Audio (Music, Podcasts, Audiobooks, Spotify, etc.)
- Communication (Phone, Messages via Siri)
- EV charging
- Parking
- Quick food ordering
- Fuel/gas station finding

Notably absent: web browsers, social media, video, games -- anything that would distract the driver. This category restriction is a deliberate safety decision.

### Touch/Knob Input Forwarding

CarPlay supports multiple input methods, all forwarded to the iPhone:

- **Touchscreen:** Touch coordinates are sent to the iPhone, which processes them as if the user tapped the iPhone screen at that location
- **Rotary knob/controller:** For cars without touchscreens (e.g., BMW iDrive), the knob generates navigation events (up/down/left/right/select) that CarPlay translates into focus-based UI navigation
- **Physical buttons:** Steering wheel controls for volume, track skip, Siri activation
- **Siri:** Voice input captured by the car's microphone, processed entirely on the iPhone

### Handling Poor/No Connectivity

CarPlay itself does not require internet -- the phone-to-head-unit link is local (USB or Wi-Fi direct). However, many CarPlay apps depend on cellular data:

- **Offline maps:** Apple Maps and Google Maps support downloaded offline maps, which continue to work without cellular. This is the primary mitigation.
- **Music:** Only downloaded/cached content works offline. Streaming services show as offline with limited functionality.
- **Siri:** Degrades significantly without internet (on-device processing handles some basic commands in newer iOS versions).
- **Wireless CarPlay quirk:** Because the iPhone's Wi-Fi radio is occupied by the CarPlay Wi-Fi link, all internet traffic must go over cellular. In poor cellular areas, this means no internet even though CarPlay itself works fine.

**Marine relevance:** Boats frequently have no cellular connectivity. A marine equivalent must be designed offline-first, with all critical navigation and instrument data available without internet.

## 2. What Makes CarPlay Successful

### Familiar UX Across Different Car Brands

Whether you're in a Honda, BMW, Hyundai, or Porsche, CarPlay looks and works the same. The phone defines the experience, not the car manufacturer. Users rated CarPlay-equipped infotainment systems 35 points higher in satisfaction surveys than built-in systems. When Toyota drivers used CarPlay instead of the built-in Entune system, satisfaction increased by 12%.

### Phone-Powered = Always Updated

This is CarPlay's killer advantage. Every iOS update improves CarPlay automatically. The car manufacturer doesn't need to ship firmware updates, negotiate with suppliers, or maintain software. The head unit hardware can be years old and still run the latest CarPlay experience because it's just rendering a video stream.

Contrast this with built-in car systems: they ship with the software they have at manufacturing time and rarely receive meaningful updates. Infotainment systems become outdated within 2-3 years.

### Siri Integration (Voice Control While Driving)

Voice control is essential when hands must stay on the wheel. Siri handles navigation requests, message dictation, music control, and phone calls without requiring the driver to look at or touch the screen. The car's microphone array captures voice; all processing happens on the iPhone.

### Widget/Dashboard View (iOS 17+, CarPlay Ultra)

Starting with iOS 17, CarPlay added a dashboard view showing widgets alongside navigation -- weather, calendar events, now-playing media, trip stats. CarPlay Ultra (launched May 2025 with Aston Martin as the first vehicle) takes this further:

- Extends across **multiple vehicle displays** (center console, instrument cluster, additional screens)
- Provides widgets for trip duration, fuel economy, distance traveled, calendar events, weather, HomeKit garage doors
- Integrates with vehicle climate controls, FM radio
- Replaces the traditional instrument cluster with a phone-rendered display

### Why Users Prefer CarPlay Over Built-In Systems

1. **Familiarity:** It mirrors the phone UI they already know
2. **Better maps:** Real-time traffic, always-current map data vs. subscription-gated/outdated built-in maps
3. **App ecosystem:** Access to preferred apps (Waze, Spotify) vs. whatever the manufacturer bundled
4. **Consistent updates:** Evolves with iOS, no dealer visit required
5. **Safety optimization:** Icons resized for driving, distracting features disabled, keyboard restricted
6. **Works across cars:** Same experience whether you're in a rental, friend's car, or your own

## 3. The Marine Parallel

### A Boat MFD Is Like a Car Head Unit

The parallels are striking:

| Car Head Unit | Marine MFD |
|---|---|
| Expensive ($500-2000 built into car price) | Expensive ($1,000-10,000+ per screen) |
| Proprietary OS, slow to update | Proprietary OS (LightHouse, Garmin OS), slow to update |
| Manufacturer-locked ecosystem | Manufacturer-locked ecosystem (Raymarine, Garmin, B&G, Simrad) |
| Clunky UI designed by hardware companies | Clunky UI designed by hardware companies |
| Software update = dealer visit or painful manual process | Software update = SD card, Wi-Fi transfer (can take 1+ hour), or dealer |
| Limited app selection | Zero third-party apps |
| Hardware lifecycle 5-7 years | Hardware lifecycle 5-10 years |
| $500-2000 for the unit | $1,000-10,000+ for the unit |

Marine MFDs are arguably worse than car head units. At least car head units now support CarPlay/Android Auto. Marine MFDs have no equivalent -- they are entirely closed systems running decade-old software paradigms.

Users report spending $1,000+ just to be able to update Raymarine software (because the update protocol is proprietary and requires specific hardware). Map updates can take a full hour over Wi-Fi. Building a networked MFD system requires proprietary "gateways," adapters, and brand-specific cabling that can push total system costs to $10,000+.

### A Phone/Tablet/Laptop Is Like the iPhone

A modern phone, tablet, or laptop:

- Has more processing power than any marine MFD
- Has a better display (higher resolution, better color accuracy)
- Updates automatically and continuously
- Has access to an enormous app ecosystem
- Has cellular, Wi-Fi, Bluetooth, and GPS built in
- Costs a fraction of a marine MFD
- Is something the sailor already owns and knows how to use

### The "BoatPlay" Concept

The idea: project a phone/tablet/laptop-powered marine software experience onto any screen on the boat -- the helm MFD, a cockpit tablet, a nav station laptop, a below-deck monitor. The computing device runs the apps. The screens are thin clients.

Key differences from CarPlay that make the marine version potentially better:

- **Open protocol:** CarPlay is proprietary and requires Apple MFi certification. A marine equivalent can use open web standards.
- **Any device as the source:** Not locked to iPhone. Any device with a browser can be both the source and the display.
- **Any screen as the display:** Not locked to certified head units. Any screen with a browser works.
- **Multi-source:** Multiple devices can contribute data (phone GPS, boat instruments via NMEA, AIS receiver, weather station).

### What Would a Marine CarPlay Protocol Look Like?

CarPlay uses H.264 video streaming over iAP2/IP. A marine equivalent doesn't need to replicate this -- it can do something better.

**WebSocket/HTTP approach:**

Instead of streaming rendered video frames (bandwidth-heavy, latency-sensitive), transmit structured data and let each screen render its own UI:

- **WebSocket for real-time data:** Position, heading, speed, depth, wind, AIS targets, engine data -- all pushed to connected screens in real-time over WebSocket
- **HTTP/REST for configuration:** Route planning, waypoint management, settings, chart tile fetching
- **Shared state model:** A central state store (on the "source" device or a lightweight hub) that all screens subscribe to
- **Each screen renders independently:** Unlike CarPlay's video stream, each screen runs its own renderer. This means screens can show different views (chart on the helm, instruments in the cockpit, weather below deck) while sharing the same underlying data.

This is architecturally superior to CarPlay's video-streaming model for several reasons:

1. **Much lower bandwidth** -- sending position updates is kilobytes vs. megabytes for video frames
2. **Responsive layouts** -- each screen renders at its native resolution and aspect ratio
3. **Independent views** -- different screens show different things simultaneously
4. **Resilient** -- if one screen disconnects, others continue working
5. **Works over any network** -- Wi-Fi, Ethernet, even low-bandwidth connections

### Progressive Web App as the Delivery Mechanism

A PWA is the perfect delivery vehicle for a marine CarPlay:

- **Install once, update automatically** -- no app store gatekeeping, no manual updates
- **Works offline** -- service workers cache the entire application shell, charts, and critical data
- **Runs on any device** -- phone, tablet, laptop, dedicated marine display running a browser
- **No platform lock-in** -- works on iOS, Android, Windows, Linux
- **Push notifications** -- anchor alarm, weather alerts, AIS collision warnings
- **Hardware access** -- GPS, compass, accelerometer via Web APIs
- **Full-screen mode** -- looks and feels like a native app

## 4. Android Auto Comparison

### How Android Auto Differs from CarPlay

Both CarPlay and Android Auto use the same fundamental model: phone runs the apps, car display is a thin client. The key differences:

**Processing model:**
- CarPlay: iPhone does all rendering, streams H.264 video to the head unit
- Android Auto: Uses a "distributed processing" approach -- some functions run on the phone, others leverage the car's infotainment hardware. This reduces phone battery drain but introduces variable performance depending on the car's hardware quality.

**App ecosystem:**
- CarPlay: Tightly curated, limited categories, slow Apple review process
- Android Auto: More permissive third-party app support, faster update approval, broader app selection

**Design control:**
- CarPlay: Apple dictates the entire UI. Every CarPlay looks identical regardless of car brand.
- Android Auto: More flexibility for OEM customization, though Google still controls the core experience.

### Android Automotive OS: The Deeper Integration

Android Automotive OS (AAOS) is fundamentally different from both CarPlay and Android Auto. It's not a projection system -- it's a full operating system that runs natively on the vehicle's hardware:

- Runs directly on the head unit, no phone required
- Uses the Vehicle Hardware Abstraction Layer (VHAL) to access car systems (HVAC, seats, energy, sensors)
- Based on AOSP (Android Open Source Project)
- Apps run natively on the car's hardware
- Gartner projects AAOS will be in 80%+ of new cars by 2028

**This is the most relevant model for a marine platform.** Rather than projecting from a phone (CarPlay model), the ideal marine system would be an open-source OS that runs natively on any hardware -- but with the key difference that it uses web technology (browser-based) rather than requiring native app development.

### What We Can Learn from Both

| Approach | CarPlay Model | Android Auto Model | AAOS Model | Marine "BoatPlay" |
|---|---|---|---|---|
| Where apps run | Phone | Phone + car (distributed) | Car (native) | Any device (browser) |
| Display is | Thin client (video) | Thin client (mixed) | Native OS | Thin client (web renderer) |
| Phone required? | Yes | Yes | No | No |
| Offline capable | Partially | Partially | Fully | Fully (PWA + service workers) |
| OEM integration | Shallow (display only) | Shallow | Deep (vehicle systems) | Deep (NMEA 2000, SignalK) |
| Open/closed | Closed (MFi) | Semi-open | Open (AOSP) | Fully open (web standards) |

## 5. Existing Marine Phone Integration

### Raymarine App

**What it does:** Mirrors any Axiom, eS, or gS Series MFD to a mobile device over the Axiom's built-in Wi-Fi. Allows viewing and controlling radar, sonar, and chartplotter. Can also manage LightHouse Charts and redeem chart vouchers.

**How it connects:** Wi-Fi direct from the Axiom MFD to the mobile device.

**Limitations:**
- Only works with Raymarine displays (not a standalone navigation app)
- Element displays don't support screen mirroring
- Autopilot cannot be activated/deactivated from mobile
- Users report connectivity drops every ~15 minutes, even at close range (10-15 feet)
- Touch control frequently gets locked out with "another device is using touch control" messages
- It's screen mirroring, not a native mobile experience -- you get the MFD's clunky UI on your phone rather than a phone-optimized interface

### Garmin ActiveCaptain App

**What it does:** The most capable of the manufacturer apps. Wirelessly pairs mobile devices with Garmin chartplotters for:
- Chart/map purchasing and upload to chartplotters
- Smart notifications (calls, texts on chartplotter display)
- Route and waypoint synchronization (bidirectional, automatic)
- Remote helm control (view and control chartplotter from phone)
- Wireless software updates to the chartplotter
- Community features (download HD contour maps shared by other boaters)

**How it connects:** Wi-Fi between phone and chartplotter.

**Limitations:** Still fundamentally a companion app to a Garmin MFD. The MFD remains the primary system; the phone is a remote control and sync tool. You still need to buy Garmin hardware. The phone app is not a replacement for the MFD.

### Navionics Boating App

**What it does:** Primarily a standalone charting/navigation app for phones and tablets, with some MFD integration:
- Detailed charts with offline support
- Route planning with sync to compatible MFDs (primarily Garmin, since Garmin acquired Navionics)
- SonarChart Live (record depth data via NMEA Wi-Fi gateway)
- Community edits and depth data sharing

**Limitations:**
- Limited to 2 devices per account
- Cannot import/export GPX files (a standard format that nearly all other apps and MFDs support)
- No heading-up lock on the phone app (reverts to north-up on pan/zoom)
- MFD integration is limited to Garmin ecosystem
- Was historically independent but increasingly locked to Garmin's ecosystem

### B&G App

**What it does:** Companion app for B&G sailing electronics:
- Mirror and remotely control connected B&G chartplotters
- Synchronize waypoints, routes, and tracks
- Device registration and manual downloads
- QR code-based Wi-Fi connection to MFD

**How it connects:** Scans QR code on MFD, connects to MFD's Wi-Fi network.

**Limitations:** Same mirroring model as Raymarine -- you're controlling the MFD remotely, not running a native phone experience. Works only with B&G hardware.

### How These All Fall Short Compared to a CarPlay-Like Experience

Every existing marine phone app has the relationship backwards:

| CarPlay Model | Marine Apps Today |
|---|---|
| Phone is the brain, screen is the display | MFD is the brain, phone is the remote |
| Phone defines the experience | MFD defines the experience |
| Any car with CarPlay support works | Only works with one manufacturer's MFD |
| UI optimized for the phone/touch | UI mirrors the MFD's clunky interface |
| Always up to date (iOS updates) | Limited by MFD firmware |
| Rich app ecosystem | Single manufacturer's software only |

The fundamental inversion: these apps treat the phone as an accessory to the MFD. A marine CarPlay would treat the MFD as a display for the phone/tablet/laptop. The intelligence, the apps, the updates -- all come from the user's device. The MFD screen just renders.

## 6. Multi-Screen Architecture

### How CarPlay Handles Multiple Displays

CarPlay has evolved from single-screen to multi-screen:

**Original CarPlay (2014-2024):** Single display only -- the center infotainment screen. The instrument cluster could show limited metadata (currently playing track, next turn direction, active phone call) sent as data over iAP2, but rendered by the car's native system, not by CarPlay.

**CarPlay Ultra (2025+):** Full multi-display support:
- Center console display: Main CarPlay interface with app grid, navigation, media
- Instrument cluster: Phone-rendered gauges, speedometer, tachometer, navigation
- Additional dashboard screens: Climate controls, trip information, widgets
- All screens rendered by the iPhone, displayed as separate video streams
- Consistent visual design across all screens
- Manufacturer customization of gauge styles, colors, layouts to match vehicle brand

### Marine Equivalent: Multiple Screens Throughout the Boat

A typical cruising boat might have:

| Location | Screen | Use Case | Size |
|---|---|---|---|
| Helm | MFD (mounted) | Chart, instruments, radar | 9-16" |
| Helm | Tablet (mounted) | Secondary chart, instruments | 10-13" |
| Cockpit | Tablet (handheld) | Instruments, anchor watch | 8-11" |
| Nav station | Laptop/monitor | Route planning, weather, detailed charts | 13-27" |
| Saloon | Tablet/phone | Weather, communications, monitoring | 6-13" |
| Crew quarters | Phone | Anchor alarm, watch schedule | 6" |

### Keeping All Screens in Sync

Current marine MFD networking uses NMEA 2000 (CAN bus) and Ethernet for data sharing between same-brand MFDs. Cross-brand is limited.

A web-based marine platform syncs differently:

**Shared state architecture:**
- A central state server (running on any device, or on a dedicated hub like a Raspberry Pi) maintains the canonical state: position, heading, speed, depth, wind, AIS targets, active route, waypoints, alarms
- Each screen connects to this server via WebSocket
- State changes propagate to all connected screens in real-time
- Each screen can show a different view while sharing the same data
- If a screen disconnects and reconnects, it catches up from the server's current state

**Independent rendering:**
- Unlike CarPlay's video stream approach, each screen renders its own UI
- A 7" helm MFD shows a simplified chart with large instrument readouts
- A 27" nav station monitor shows a detailed chart with weather overlay, route planning tools, and AIS target list
- A phone shows an anchor alarm circle and current position
- All from the same data, rendered appropriately for each screen size

### Responsive Layouts for Different Screen Sizes

| Screen Size | Layout Strategy |
|---|---|
| 6-7" (phone/small MFD) | Single-panel: one app at a time, large touch targets, glanceable data |
| 8-11" (tablet) | Split-panel: chart + instruments, or two side-by-side views |
| 12-16" (large MFD/tablet) | Multi-panel: chart + instruments + AIS list, or quad-view |
| 17-27" (nav station monitor) | Full dashboard: chart, weather, instruments, AIS, route plan, communications |

The app grid launcher scales the same way: fewer, larger icons on small screens; more icons in a denser grid on larger screens.

## 7. Design Implications

### The App Grid as Universal Launcher

CarPlay's app grid is the unifying element -- it works identically on every car's screen. A marine equivalent:

- Grid of tool icons: Chart, Instruments, Radar, AIS, Weather, Anchor Watch, Engine, Solar, VHF, Tides, Logbook
- Works on any screen size (responsive grid)
- Same layout and muscle memory across all screens on the boat
- Drag to rearrange, long-press to configure
- The grid is the "home" -- every interaction starts and ends here
- Consistent across all connected screens (but each screen can have different apps open)

### Voice Control at the Helm

On a boat, hands are often occupied (tiller, wheel, sheets, winch handles). Voice is even more important than in a car:

- "Show me the chart zoomed to 1 nautical mile"
- "What's the depth under the keel?"
- "Set anchor alarm for 50 meters"
- "Hail channel 16"
- "What's the weather forecast for tomorrow?"
- "AIS -- identify that vessel to starboard"

Implementation: Web Speech API for browser-based voice recognition, with offline fallback to limited command vocabulary. A wake word ("Hey Skipper" or similar) activates listening.

### Glanceable Instrument Widgets

CarPlay Ultra's widgets are directly applicable. Marine instrument widgets:

- Speed over ground / Speed through water
- Depth under keel (with alarm threshold indicator)
- Wind speed and direction (apparent and true)
- Course over ground / heading
- Time to next waypoint / distance
- Battery voltage / solar input
- Engine RPM / temperature
- Tide state

These should be:
- High contrast, readable at arm's length
- Configurable (choose which instruments, set alarm thresholds)
- Color-coded (green = normal, coral = warning)
- Available as overlays on the chart or as a dedicated instrument panel

### Day/Night Mode Switching

CarPlay switches between day and night themes based on the car's headlight state or ambient light sensor. Marine equivalent:

- **Night mode is the default** (per brand guidelines -- sailors plan at night)
- **Day mode** for bright cockpit conditions: higher contrast, lighter backgrounds, bolder colors
- **Red night mode**: Pure red-on-black for preserving night vision (critical for offshore sailing -- standard in marine electronics, not found in CarPlay)
- **Automatic switching** based on time of day, ambient light, or manual toggle
- **Per-screen override**: Below-deck screens might be in night mode while the cockpit tablet is in day mode

### Waterproof Touch vs Mouse/Keyboard Input

Marine input methods differ significantly from car input:

- **Wet fingers on touchscreens:** Capacitive touch is unreliable with wet hands. Design for large touch targets (minimum 48px, preferably 64px+). Consider resistive touch panels for dedicated marine screens.
- **Gloved hands:** Sailing gloves block capacitive touch. Support touch-through glove mode or physical button alternatives.
- **Mouse/trackpad at nav station:** Below-deck use is more like desktop computing. Support mouse hover states, right-click context menus, keyboard shortcuts.
- **Physical buttons:** Dedicated hardware buttons for critical functions (MOB, zoom in/out, mark waypoint) that work regardless of screen state.
- **Voice:** The universal fallback when hands are occupied or wet.

Input method should be detected automatically: touchscreen interactions trigger touch-optimized UI, mouse movement triggers desktop-optimized UI, voice activates command mode.

---

## Summary: The Opportunity

CarPlay succeeded because it recognized that the car's head unit is an inferior computer and the driver's phone is a superior one. It made the head unit a display for the phone's intelligence.

Marine MFDs are in an even worse position than car head units were pre-CarPlay: more expensive, more proprietary, slower to update, with zero third-party app ecosystem. Meanwhile, sailors carry phones, tablets, and laptops that are orders of magnitude more capable.

The key architectural insight: **don't stream video like CarPlay -- stream data over WebSockets and let each screen render its own UI.** This is better than CarPlay because:

1. Any device can be both source and display (no iPhone requirement)
2. Multiple screens show different views simultaneously (not just mirrored)
3. Works over any network including low-bandwidth connections
4. Fully offline-capable via PWA/service workers
5. Open standards (WebSocket, HTTP, PWA) instead of proprietary protocols
6. Integrates with existing marine data (NMEA 2000, SignalK) via a lightweight bridge

The delivery mechanism is a Progressive Web App: install-free, always updated, works offline, runs on anything with a browser. The "protocol" is WebSocket for real-time data and HTTP for everything else. The "app grid" is a responsive launcher that works on a 6" phone or a 27" nav station monitor.

This is CarPlay's model, evolved for the marine context and built on open web standards instead of proprietary protocols.

---

Sources:
- [Developing CarPlay Systems, Part 1 - WWDC16](https://developer.apple.com/videos/play/wwdc2016/722/)
- [Developing CarPlay Systems, Part 2 - WWDC16](https://developer.apple.com/videos/play/wwdc2016/723/)
- [CarPlay - Wikipedia](https://en.wikipedia.org/wiki/CarPlay)
- [A Developer's Intro to CarPlay](https://medium.com/macoclock/a-developers-intro-to-carplay-286f2633c421)
- [CarPlay | Apple Developer Documentation](https://developer.apple.com/design/human-interface-guidelines/carplay)
- [Inside the tech behind CarPlay - AppleInsider](https://appleinsider.com/articles/14/03/03/inside-the-tech-behind-carplay-apples-new-in-vehicle-infotainment-system)
- [CarPlay: Everything We Know - MacRumors](https://www.macrumors.com/roundup/carplay/)
- [How Do Infotainment Systems Compare - Consumer Reports](https://www.consumerreports.org/infotainment-systems/in-car-infotainment-systems-vs-apple-carplay-android-auto/)
- [CarPlay remains the top infotainment choice - CBT News](https://www.cbtnews.com/carplay-remains-the-top-infotainment-choice/)
- [4 reasons I always choose CarPlay - Pocket-lint](https://www.pocket-lint.com/carplay-over-built-in-software/)
- [CarPlay or Your Car's Built-In System - CarpodGo](https://www.carpodgo.com/blogs/carplay-industry-blogs/carplay-or-your-car-s-built-in-system-here-s-what-more-drivers-prefer)
- [Android Auto vs Apple CarPlay 2026 - Car Tech Studio](https://cartechstudio.com/blogs/apple-carplay/android-auto-vs-apple-carplay-complete-guide)
- [Android Automotive OS vs Android Auto - eInfochips](https://www.einfochips.com/blog/android-automotive-os-vs-android-auto-understanding-the-worlds-first-native-os/)
- [Android Automotive OS vs Android Auto vs Apple CarPlay - Aximote](https://aximote.com/en/blog/android-automotive-android-auto-apple-car-play)
- [Raymarine App - Raymarine](https://www.raymarine.com/en-us/our-products/apps-integrations/raymarine)
- [Garmin ActiveCaptain App](https://www.garmin.com/en-US/p/573254/)
- [B&G App](https://www.bandg.com/bandg-app/)
- [Navionics Boating App Features - Garmin Support](https://support.garmin.com/en-US/?faq=0R0SeVAcWW8mwCVovSxG7A)
- [Understanding Multifunction Displays - Simrad](https://www.simrad-yachting.com/learning-and-news-hub/technology/understanding-multifunction-displays/)
- [Raymarine MFD Necessary? Software Headache - Trawler Forum](https://www.trawlerforum.com/threads/raymarine-mdf-necessary-software-headache.63146/)
- [Laptop v MFD - Sailing Anarchy](https://forums.sailinganarchy.com/threads/laptop-v-mfd.251269/)
- [How to Customize Apple CarPlay - Car Tech Studio](https://cartechstudio.com/blogs/apple-carplay/how-to-customize-apple-carplay-dashboard-apps)
- [CarPlay vs CarPlay Ultra - SlashGear](https://www.slashgear.com/2090716/carplay-vs-ultra-little-known-differences/)
