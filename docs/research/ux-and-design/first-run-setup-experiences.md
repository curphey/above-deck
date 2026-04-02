# First-Run Setup Experiences: Research Reference

Research into consumer OS, embedded device, and vehicle onboarding flows.
Purpose: inform the design of an "Apple-like" first-run setup for a marine computer (Docker container, Go backend, React frontend, browser-based UI).

---

## 1. macOS Setup Assistant

**Platform:** macOS Sequoia / Sonoma on Mac Mini, MacBook, iMac
**Duration:** ~10-15 minutes (longer with migration/updates)

### Screen Sequence

| # | Screen | Mandatory? | Notes |
|---|--------|-----------|-------|
| 1 | Language selection | Yes | Grid of languages, large text, single tap |
| 2 | Country/Region | Yes | Drives keyboard layout, date format, currency |
| 3 | Accessibility | No | Vision, hearing, motor, cognitive options — can skip for later |
| 4 | Wi-Fi network | Yes* | Select SSID, enter password. *Ethernet bypasses this |
| 5 | Migration Assistant | No | Transfer from another Mac, Time Machine, Windows PC, or "set up as new" |
| 6 | Apple Account sign-in | Yes* | Sign in, create, or skip (with nagging) |
| 7 | Terms & Conditions | Yes | Must agree |
| 8 | Computer account creation | Yes | Username + password for local login |
| 9 | Location Services | No | Toggle on/off |
| 10 | Analytics & privacy | No | Share crash data with Apple, app developers |
| 11 | Screen Time | No | Parental controls, usage limits |
| 12 | Siri | No | Enable/disable |
| 13 | Touch ID (if hardware present) | No | Fingerprint enrollment |
| 14 | Appearance (Light/Dark/Auto) | No | Three visual options |
| 15 | "Welcome to Mac" | Informational | New in Sonoma/Sequoia — a post-setup welcome overlay before desktop |

### What Makes It Work

- **Auto-detection reduces friction.** Timezone, keyboard layout, and regional formats are inferred from country selection — one choice cascades to many defaults.
- **Progressive disclosure.** Each screen asks one question. Never more than 2-3 fields visible at once.
- **Skip paths are always available.** Apple Account, Siri, analytics — all have a "Set Up Later" or "Not Now" option. Nothing gates the setup except language and account creation.
- **Visual polish signals trust.** Smooth animations between screens, large typography, generous whitespace. The setup itself demonstrates the quality of the product.
- **Migration is a first-class citizen.** Offering data transfer early acknowledges that most users aren't starting from zero.

### What's Frustrating

- Forced software updates during setup can add 20-30 minutes on a fresh install.
- Apple Account step is aggressive — skipping it triggers multiple confirmation dialogs.
- Too many screens for a power user who just wants a terminal.

---

## 2. iOS / iPadOS Setup

**Platform:** iPhone, iPad
**Duration:** ~5-10 minutes (without data transfer); 15-60 minutes with iCloud restore

### Screen Sequence

| # | Screen | Mandatory? | Notes |
|---|--------|-----------|-------|
| 1 | "Hello" in rotating languages | Yes | Swipe to begin — iconic, emotional, zero-decision |
| 2 | Language selection | Yes | |
| 3 | Country/Region | Yes | |
| 4 | Appearance (text size: Default/Medium/Large) | No | New in recent iOS — accessibility-first |
| 5 | Quick Start (proximity transfer) | No | Hold old device nearby for automatic transfer — magical UX |
| 6 | Wi-Fi or cellular activation | Yes | Pick network, enter password, or activate eSIM |
| 7 | Device ownership (self or child) | Yes | Gates parental control flows |
| 8 | Face ID / Touch ID | No | Biometric enrollment with animated guide |
| 9 | Passcode creation | Yes | 6-digit default, option for custom alphanumeric |
| 10 | Data transfer decision | Yes | iCloud backup, direct transfer, Android migration, or start fresh |
| 11 | Apple Account sign-in | Yes* | Can skip but device is significantly limited |
| 12 | Automatic updates | No | Toggle |
| 13 | Siri | No | Enable/disable, voice training |
| 14 | Screen Time | No | |
| 15 | Apple Pay | No | Add card or skip |
| 16 | Display mode (Light/Dark/Auto) | No | |
| 17 | Emergency SOS / Crash Detection | Informational | Safety features overview |
| 18 | "Welcome to iPhone" | Informational | Swipe up to start |

### What Makes It Work

- **The "Hello" screen is pure emotion.** No decision required, no form fields. Just beauty and anticipation. It signals: "this is going to be different."
- **Quick Start is the killer feature.** Hold your old phone next to the new one and a particle cloud animation appears. Data transfers automatically. No cables, no codes (until 2FA), no manual steps. This is the gold standard for device-to-device migration.
- **Biometric enrollment is visual and tactile.** The Face ID setup shows a 3D mesh of your face rotating. Touch ID shows a fingerprint gradually filling in. The feedback loop is immediate and satisfying.
- **Everything defers gracefully.** Every optional screen has "Set Up Later in Settings" — and Apple remembers to re-prompt later via notification badges.

### What's Frustrating

- iCloud restore can take hours over slow Wi-Fi.
- The number of screens is high (15+). For a second device, this is tedious.
- Apple Account is practically mandatory — skipping it cripples the device.

---

## 3. Android Setup Wizard

**Platform:** Pixel, Samsung, OnePlus, etc.
**Duration:** ~5-10 minutes

### Screen Sequence

| # | Screen | Mandatory? | Notes |
|---|--------|-----------|-------|
| 1 | Welcome / Language | Yes | Language picker, "Start" button |
| 2 | Wi-Fi selection | Yes* | Can skip via mobile data |
| 3 | Terms / EULA | Yes | Google Terms of Service, must agree |
| 4 | Google Account sign-in | No | Can skip but severely limits device |
| 5 | Copy apps & data | No | Restore from Google backup, another Android, or iPhone |
| 6 | Google Services toggles | Yes | Location, diagnostics, usage data — individual toggles, not a blanket accept |
| 7 | Screen lock / Security | No | PIN, pattern, fingerprint, face |
| 8 | Google Assistant | No | Enable/disable, voice match |
| 9 | Google Pay | No | |
| 10 | Additional apps/features | Varies | OEM-specific screens (Samsung adds 3-5 extra screens) |

### What's Different From Apple

- **Google Account is truly optional.** You can use an Android device without signing in. The device remains functional (unlike iOS without an Apple Account).
- **Individual privacy toggles** instead of a blanket "agree to everything." Users choose location sharing, diagnostics, and ad personalization separately. More transparent, slightly more overwhelming.
- **OEM fragmentation** is a real problem. Samsung, OnePlus, Xiaomi all add their own setup screens on top of Google's wizard. A Samsung phone can have 15-20 screens. This breaks the consistency promise.
- **Backup restore is less magical.** Google backup restores app list and settings, but the experience is not as seamless as Apple's Quick Start proximity transfer.

### What's Frustrating

- OEM bloat adds friction and confusion.
- Google constantly pushes its services (Assistant, Pay, One subscription).
- The visual design is competent but not emotionally engaging — no "Hello" moment.

---

## 4. Raspberry Pi OS First Boot (piwiz)

**Platform:** Raspberry Pi 4/5, Pi 400, Pi 500
**Duration:** ~5-10 minutes (longer with updates)

### Screen Sequence

| # | Screen | Mandatory? | Notes |
|---|--------|-----------|-------|
| 1 | Welcome / "Click Next to get started" | Informational | Simple intro |
| 2 | Bluetooth pairing | No | Scans for keyboards/mice. Skippable if using wired peripherals |
| 3 | Locale (Country, Language, Timezone) | Yes | Single screen, three dropdowns |
| 4 | User account creation | Yes | Username + password |
| 5 | Wi-Fi network | No | Select SSID, enter password |
| 6 | Default browser (Firefox or Chromium) | No | Can also uninstall the one not chosen |
| 7 | Raspberry Pi Connect | No | Remote access service |
| 8 | Software updates | Yes* | Downloads updates if online — can take many minutes |
| 9 | Setup complete / Reboot | Yes | Must reboot to apply |

### What Works

- **Minimal.** Nine screens, most optional. The whole thing takes 3-5 minutes if you skip updates.
- **Honest about what it is.** No pretence of magic — it's a functional wizard that gets you to a desktop.
- **Pre-configuration via Raspberry Pi Imager** is the real innovation. Before you even boot, you can set hostname, Wi-Fi, locale, SSH keys, and username/password in the imaging tool. This means the first-boot wizard can be entirely skipped for headless setups.

### Where It Falls Short

- **Visually bland.** Standard GTK dialog boxes. No animation, no brand personality, no delight.
- **Software updates are a black box.** A progress bar with no ETA. Can take 10+ minutes on slow connections. No option to defer.
- **No hardware detection or guided integration.** Pi doesn't scan for connected HATs, cameras, or sensors during setup. You're on your own.
- **No guided "what do you want to do with this?" moment.** Unlike Home Assistant, there's no "what's your use case?" screen.

### Key Takeaway for Marine OS

The Pi Imager pre-configuration model is highly relevant. For headless or pre-provisioned marine devices, the setup could happen on a companion device before the hardware even boots.

---

## 5. Tesla Vehicle Setup

**Platform:** Model 3, Model Y, Model S, Model X touchscreen
**Duration:** ~15-30 minutes (owner-driven, not a wizard)

### Setup Approach

Tesla does not use a traditional step-by-step wizard. Instead, the car boots to a functional interface and the owner configures settings ad-hoc. The setup is split between the Tesla mobile app (before delivery) and the in-car touchscreen (at delivery).

### Pre-Delivery (Tesla App)

| Step | Details |
|------|---------|
| Download Tesla app | Required before pickup |
| Create Tesla account | Email, password, payment method |
| Confirm delivery location | Schedule pickup or home delivery |
| Complete financing/insurance | Payment, trade-in, registration |

### At-Delivery (Touchscreen)

| Step | Details | Mandatory? |
|------|---------|-----------|
| Accept terms | Legal / liability | Yes |
| Pair phone as key | Bluetooth pairing via app | Yes (or use key card) |
| Connect to Wi-Fi | Tap network icon, select SSID | No (uses cellular) |
| Create driver profile | Save seat, mirror, steering wheel positions | No |
| Link profile to phone key | Auto-adjust on unlock | No |
| Enable Pin to Drive | 4-digit security PIN | No |
| Configure Sentry Mode | Dashcam/security system | No |
| Tutorial videos | On-screen feature walkthroughs | No |

### What Makes It Work

- **The car is usable immediately.** No wizard gates you from driving. You can configure everything later. This is critical for a vehicle — you might be at a dealership, not at home.
- **Phone-as-key is elegant.** The car detects your phone via Bluetooth and unlocks/adjusts everything automatically. The phone becomes the primary interface for the car's identity.
- **Driver profiles are physical.** They save seat position, mirror angles, steering wheel height. When you sit down, the car knows who you are and physically adjusts to you. This is deeply personal.
- **Progressive configuration.** Settings are discoverable in context. You find Wi-Fi when you need updates, Sentry Mode when you park somewhere sketchy, etc.

### What's Frustrating

- No structured walkthrough means many owners miss important settings (Pin to Drive, emergency door releases, etc.).
- The sheer number of settings is overwhelming without guidance.
- Critical safety information (manual door release, frunk operation) is buried in an owner's manual most people never read.

### Key Takeaway for Marine OS

The "usable immediately, configure progressively" model is powerful for a boat. A sailor might be at a marina with limited connectivity. The system should boot to a functional chart/dashboard and guide configuration through contextual prompts, not a blocking wizard.

---

## 6. Sonos / HomePod / Smart Speaker Setup

### Sonos Setup 2.0

**Duration:** ~3-5 minutes per speaker

| # | Step | Interface | Notes |
|---|------|-----------|-------|
| 1 | Download Sonos app | Phone | Required companion app |
| 2 | Plug in speaker | Physical | Wait for blinking LED |
| 3 | App detects speaker | Auto | Bluetooth/local network discovery |
| 4 | Connect speaker to Wi-Fi | Phone app | Transfers credentials from phone |
| 5 | Assign room name | Phone app | "Living Room," "Kitchen," etc. |
| 6 | Voice assistant setup (Alexa/Google) | Phone app | Optional |
| 7 | Trueplay tuning | Phone app | Uses phone mic to calibrate room acoustics |
| 8 | Ready to play | Phone app | Music services, streaming |

**Key UX innovations:**
- **Modular, not linear.** Sonos 2.0 shifted from a rigid tunnel to a flexible flow. Users can skip to playing music and configure voice/tuning later.
- **Dynamic trigger cards.** Post-setup, contextual cards appear based on what hasn't been configured yet. No nagging — just gentle, timely prompts.
- **70+ hardware variations, one experience.** The setup handles speakers from 15+ years of product generations through the same app flow.
- **"Faster to music"** was the explicit design goal. Everything secondary (Alexa, room tuning, multi-speaker grouping) defers to getting sound playing.

### Apple HomePod Setup

**Duration:** ~2-3 minutes

| # | Step | Interface | Notes |
|---|------|-----------|-------|
| 1 | Plug in HomePod | Physical | White pulsing light + startup chime |
| 2 | Hold iPhone nearby | Automatic | iOS detects HomePod via proximity |
| 3 | "Set Up" card appears | iPhone | Tap to begin |
| 4 | Select room | iPhone | Room name for HomeKit |
| 5 | Camera scan (or manual passcode) | iPhone | Point camera at HomePod light pattern for pairing |
| 6 | Transfer settings | iPhone | iCloud, Wi-Fi, Siri preferences auto-transfer |
| 7 | Personal Requests toggle | iPhone | Allow Siri to access messages/reminders |
| 8 | Done | iPhone | HomePod continues background setup |

**What makes it magical:**
- **Zero-input Wi-Fi.** The HomePod inherits Wi-Fi credentials from the iPhone. The user never types a password.
- **Proximity detection** replaces QR codes, pairing codes, and Bluetooth scanning. Just hold your phone close.
- **Settings transfer means almost no decisions.** Your Siri voice, music preferences, and HomeKit configuration flow from phone to speaker automatically.
- **The entire setup is 6 taps.** No keyboard input whatsoever.

### Key Takeaway for Marine OS

The "companion device" pattern is highly relevant. A sailor could configure their marine computer from their phone/tablet while the hardware does its thing. Wi-Fi credentials, user preferences, and boat profile could transfer from a phone app, eliminating keyboard entry on a wet, rocking helm station.

---

## 7. Home Assistant Onboarding

**Platform:** Home Assistant OS on Pi, NUC, VM
**Duration:** ~5-10 minutes (plus integration discovery)

### Screen Sequence

| # | Screen | Mandatory? | Notes |
|---|--------|-----------|-------|
| 0 | Preparation / download | Wait | System downloads HA Core (~700MB), shows progress. Can take 5-20 minutes |
| 1 | Welcome | Yes | "Create my smart home" or "Restore from backup" |
| 2 | Owner account creation | Yes | Name, username (lowercase, no spaces), password |
| 3 | Home location | Yes | Map pin for lat/lon. Sets timezone, unit system, currency, elevation. Defines "home zone" (100m radius) for presence detection |
| 4 | Data sharing | No | Anonymized analytics. Disabled by default. Clear explanation of what's shared |
| 5 | Finish | Yes | Lands on default dashboard |

### Post-Onboarding

After the 5-screen wizard, HA immediately:
- Auto-discovers devices on the local network (Hue bridges, Sonos speakers, smart plugs, etc.)
- Presents discovered integrations as dismissable notifications
- Provides a default dashboard with auto-generated cards for discovered entities

### What Makes It Work

- **Ruthlessly minimal wizard.** Five screens. Two minutes. Then you're on the dashboard looking at real data.
- **The map is genius.** Dropping a pin on a map to set your location is faster and more intuitive than typing an address or selecting from timezone dropdowns. It auto-fills timezone, units, and currency from the pin location.
- **Auto-discovery is the real onboarding.** HA scans the network and shows you what it found. This is the "aha moment" — devices you forgot about appear as integrations. The system proves its value within minutes of setup.
- **Backup restore is a first-class option** from screen 1. For experienced users reinstalling, this is a massive time saver.
- **Privacy is opt-in, not opt-out.** Sharing is disabled by default with clear explanations. Builds trust.

### Where It Falls Short

- The initial download/preparation screen can take 20 minutes with no useful feedback. Users wonder if it's broken.
- No guided "what kind of home do you have?" or "what do you want to automate?" flow. After setup, you're dropped on a blank dashboard with no guidance.
- Integration configuration can be complex — each device type has its own setup flow with varying quality.
- The default dashboard is auto-generated and usually ugly. Power users rebuild it entirely.

### Key Takeaway for Marine OS

Home Assistant is the closest analogy to our use case: an open-source system running on commodity hardware, accessed via browser, managing many subsystems. Its onboarding strength (minimal wizard + auto-discovery) and weakness (no guided purpose/use-case flow) are both directly relevant.

The auto-discovery model maps perfectly to marine use: on first boot, scan for NMEA 2000 devices, SignalK sources, chart data, Wi-Fi networks, and connected instruments. Show the user what the system found. Let the hardware prove its value immediately.

---

## 8. Raymarine Axiom / LightHouse 3 First Boot

**Platform:** Axiom, Axiom+, Axiom 2 Pro MFD
**Duration:** ~2-5 minutes (plus potential software update)

### Startup Sequence

| # | Step | Mandatory? | Notes |
|---|------|-----------|-------|
| 1 | Power on | Yes | Raymarine splash screen, quad-core processor boots fast |
| 2 | Startup wizard | Yes | Language, units of measure, date/time format |
| 3 | Data master selection | Conditional | Only on networks with multiple MFDs — select which display is the master |
| 4 | Data source auto-detection | Auto | Scans NMEA 2000 network for connected transducers, instruments, autopilot |
| 5 | Limitation on Use disclaimer | Yes | Legal: "not a substitute for proper navigation practices." Must tap OK |
| 6 | Homescreen | — | Functional immediately: chart, sonar, radar (if connected) |

### Post-Startup Configuration

- **User profiles** allow different helm operators to save display preferences
- **Transducer configuration** for sonar (frequency, power, depth offset)
- **Autopilot commissioning** wizard (separate, accessed from settings)
- **Chart card management** — insert microSD with chart data
- **Wi-Fi setup** — connect to boat's network or phone hotspot for updates

### What Makes It Work

- **Extremely fast to functional.** The startup wizard is 2-3 screens, then you're on a live chart with real data from connected instruments. Boot time is measured in seconds, not minutes.
- **Auto-detection of marine instruments.** The MFD scans the NMEA 2000 backbone and finds depth, speed, wind, engine data, autopilot. No manual configuration for most devices.
- **The default homescreen is immediately useful.** It shows a chart centered on your GPS position, with depth and speed overlays. You can navigate within seconds of powering on.
- **Marine-specific legal disclaimer** is handled cleanly — one screen, one tap, done.

### Where It Falls Short

- **No boat profile.** The MFD doesn't ask "what kind of boat is this?" — draft, beam, displacement, mast height. This data is critical for safety (bridge clearance, shallow water alarms) but must be configured manually deep in settings.
- **Software updates are painful.** Downloads can be 600MB+ and the UI during update is unstable (reports of display glitches requiring reboots).
- **Closed ecosystem.** You can't extend the MFD with custom apps, data sources, or integrations beyond what Raymarine provides.
- **No companion app setup.** Configuration must happen on the MFD touchscreen itself — difficult on a moving boat with wet hands.

### Key Takeaway for Marine OS

Raymarine gets the most important thing right: **boot to a useful chart with live data as fast as possible.** Everything else is secondary. Our marine OS should treat the chartplotter view the way Raymarine does — it's the home screen, it should show real data within seconds, and all configuration should be reachable but never blocking.

The missing boat profile is an opportunity. A 3-screen boat profile during setup (type, dimensions, draft) would enable smart defaults for shallow water alarms, bridge clearance, anchor watch radius, and chart safety contours.

---

## Synthesis: Universal Principles of Great First-Run Setup

### Principles to Steal

**1. Boot to value, not to configuration.**
Every great setup ends with something immediately useful. macOS shows your desktop. iOS shows your home screen with apps. Tesla shows a drivable car. Raymarine shows a live chart. Home Assistant shows a dashboard with discovered devices. The setup is a bridge to the product, not a gate in front of it.

**2. One question per screen.**
Apple, Google, and Home Assistant all follow this pattern. Each screen asks for one piece of information or one decision. This reduces cognitive load and makes progress feel fast even when the total screen count is high. Never put a form with 6 fields on one screen when you can ask 6 questions across 6 screens with smooth transitions.

**3. Smart defaults eliminate decisions.**
Select your country; the system infers timezone, date format, units, keyboard layout, and currency. Drop a pin on a map; the system calculates everything from latitude. The best setup screens are the ones users never see because the system already knows the answer.

**4. Auto-detection proves value.**
Home Assistant discovers devices. Raymarine discovers instruments. Sonos discovers speakers. The system should demonstrate its capabilities by finding and showing what's already connected. For a marine OS: scan the NMEA 2000 bus, find SignalK data, detect chart files, identify connected displays. Show the user what the system already knows about their boat.

**5. Companion device for input-hostile environments.**
HomePod, Sonos, and (partially) Tesla use a phone app for setup because typing on the primary device is awkward. On a boat, a touchscreen at the helm may be wet, glare-prone, or bouncing. Phone-based setup sidesteps all of this. Transfer Wi-Fi credentials, enter boat details, configure preferences — all on a dry phone below deck.

**6. Progressive disclosure after setup.**
Sonos dynamic trigger cards. iOS notification badges for unfinished setup. Home Assistant's integration discovery notifications. Don't front-load every possible configuration into the first-run wizard. Set up the minimum, then surface configuration opportunities in context when they're relevant.

**7. Backup/restore as a first-class path.**
Home Assistant, iOS, Android, and macOS all offer "restore from backup" on screen 1 or 2. For a marine OS on commodity hardware, the scenario of "my hardware died and I'm swapping to a new device" must be trivial. One-click restore from USB or cloud backup should be prominent in the first screen of setup.

**8. The emotional beat.**
iOS "Hello." The HomePod chime. Tesla's door handles presenting. These moments have no functional purpose — they exist to create an emotional connection. A marine OS should have its equivalent: perhaps a brief animation of the system coming online, instruments connecting, the chart rendering. A moment that says "your boat's brain is waking up."

### Patterns to Avoid

**1. Update-gated setup.**
Both macOS and Raspberry Pi can force long software updates during first boot. This is the worst possible time — the user is excited and impatient. Updates should be deferred or run in the background. Never block the setup flow with a 20-minute download.

**2. Account-first, value-later.**
Android and macOS push account creation early. For a marine OS, the system should be functional without any account. An account adds cloud backup, remote access, community features — but the chartplotter, instruments, and tide data should work offline with zero accounts.

**3. Too many screens for power users.**
iOS has 15+ screens. Android with Samsung can hit 20. Provide an "express setup" path: pick country, create password, done. Show everything else later.

**4. OEM bloat / partner promotions.**
Android OEMs add screens for Samsung accounts, carrier setup, promotional offers. Never pollute the first-run experience with anything that isn't directly useful to the user.

**5. No hardware awareness.**
Raspberry Pi doesn't scan for connected HATs or sensors. This is a missed opportunity. The marine OS should scan for NMEA devices, USB instruments, network adapters, display outputs, and GPS on first boot — and show the user what it found.

**6. Ugly defaults.**
Home Assistant's auto-generated dashboard is functional but unattractive. First impressions matter. The default view should be polished and demonstrate the design quality of the entire system. It should look like someone designed it, not like a CMS generated it.

---

## Recommended Setup Sequence for Marine OS

Based on this research, here is a proposed screen flow:

| # | Screen | Type | Duration | Notes |
|---|--------|------|----------|-------|
| 1 | Welcome / brand moment | Emotional | 3s | Brief animation. System "waking up." Not blocking |
| 2 | Language + Country | Mandatory | 10s | Single screen, two pickers. Infers timezone, units, date format |
| 3 | Create account or restore from backup | Mandatory | 30s | Username + password, or USB/cloud restore |
| 4 | Network | Mandatory | 30s | Auto-detect ethernet; show Wi-Fi picker if no cable. Transfer from phone option |
| 5 | Boat profile | Mandatory | 60s | Boat type (sail/motor/cat), name, LOA, beam, draft, mast height. 6 fields, smart defaults by type |
| 6 | Hardware discovery | Automatic | 15s | Scan NMEA 2000, USB, network. Show what was found. "We found: depth sounder, wind instrument, AIS receiver, GPS" |
| 7 | Chart data | Conditional | 15s | Detect chart files on SD/USB. Or offer download region picker |
| 8 | Done — boot to chartplotter | — | — | Live chart centered on GPS position, instrument data overlays, everything working |

**Total: ~3 minutes for a new setup. 30 seconds for a restore.**

Post-setup progressive disclosure via contextual cards:
- "Set up anchor watch alarm" (when GPS detects you're stationary)
- "Configure shallow water alert" (using your draft from boat profile)
- "Connect to marina Wi-Fi" (when new networks detected)
- "Enable remote access" (after creating account)
- "Add crew members" (when second device connects)

---

## Sources

- [Apple: Set up your MacBook Pro](https://support.apple.com/guide/macbook-pro/set-up-your-mac-apd831707cb3/mac)
- [Apple: Set up your iPhone or iPad](https://support.apple.com/en-us/105132)
- [Apple: Set up HomePod](https://support.apple.com/en-us/111110)
- [Home Assistant: Onboarding](https://www.home-assistant.io/getting-started/onboarding/)
- [Raspberry Pi: Getting Started](https://www.raspberrypi.com/documentation/computers/getting-started.html)
- [Tesla: Getting Started With Your Vehicle](https://www.tesla.com/support/getting-started-with-your-vehicle)
- [Tesla: Driver Profiles](https://www.tesla.com/ownersmanual/model3/en_gb/GUID-A2D0403E-3DAC-4695-A4E6-DC875F4DEDC3.html)
- [Sonos Setup Experience (James Babu case study)](https://www.jamesbabu.com/work/sonos-setup)
- [Sonos Setup Guide](https://www.sonos.com/en-us/guides/setup)
- [Raymarine Axiom LightHouse 3 first impressions (Seabits)](https://seabits.com/raymarine-axiom-lighthouse-3-first-impressions/)
- [Raymarine LightHouse 3 Operation Manual](https://s3.us-west-2.amazonaws.com/manuals.raymarine.com/Manuals/81370/en-US/html/index.html)
- [Intune: Skipping Setup Assistant screens](https://intuneirl.com/skipping-the-new-welcome-to-mac-screen-during-setup-assistant/)
- [macOS Setup Assistant documentation](https://mac.install.guide/mac-setup/)
- [NN/g: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- [LogRocket: Creating a Setup Wizard](https://blog.logrocket.com/ux-design/creating-setup-wizard-when-you-shouldnt/)
- [Frontend.com: Out-of-Box Experience](https://www.frontend.com/thinking/out-of-box-experience-getting-it-right-first-time/)
- [Chameleon: First-Time User Experience](https://www.chameleon.io/blog/first-time-user-experience)
