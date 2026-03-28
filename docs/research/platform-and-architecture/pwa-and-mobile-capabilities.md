# PWA & Mobile Deployment Capabilities for Marine Navigation

**Date:** 2026-03-20
**Status:** Research complete
**Related:** [Hardware Connectivity Technologies](./hardware-connectivity-technologies.md), [Marine MFD Platforms](./marine-mfd-platforms-and-integrations.md)

---

## Executive Summary

Progressive Web Apps are a viable deployment strategy for Above Deck's marine tools platform, but with significant platform-specific constraints. Android/Chrome provides the richest capability set including Web Serial (NMEA 0183 direct), Web Bluetooth (Victron BLE), generous storage, and Play Store distribution via TWA. iOS/Safari is the critical challenge: no Web Serial, no Web Bluetooth, aggressive storage eviction, and no app store path without a native wrapper like Capacitor. The iPad-at-helm use case — the primary deployment target — runs on the most constrained platform.

The recommended strategy is a PWA-first approach with a Capacitor native wrapper for iOS App Store distribution and access to native APIs that Safari blocks. The Go server running on a Raspberry Pi acts as the hardware bridge, exposing NMEA/Victron/sensor data over WebSocket to the PWA on any platform — bypassing browser API limitations entirely.

---

## 1. Service Worker & Offline Caching Strategies

### Caching Strategy by Data Type

| Data Type | Strategy | Rationale |
|-----------|----------|-----------|
| App shell (HTML, CSS, JS) | Cache-first, update in background | Must work offline immediately |
| Chart tiles (vector/raster) | Cache-first with manual pre-cache | Large, rarely change, critical offline |
| Instrument data (NMEA, Victron) | Network-only (WebSocket) | Real-time, no caching value |
| Community content (articles, KB) | Network-first, cache fallback | Fresh preferred, stale acceptable |
| User data (routes, waypoints) | IndexedDB with background sync | Must persist offline, sync when connected |
| Weather/tide data | Stale-while-revalidate | Time-sensitive but short offline trips OK |
| Static assets (icons, fonts) | Cache-first, long expiry | Never change between deployments |

### Implementation Notes

- `@vite-pwa/astro` with Workbox provides the service worker generation
- Workbox `precacheAndRoute` for app shell assets
- Workbox `registerRoute` with strategy per data type
- Custom cache expiration policies: chart tiles can persist indefinitely, weather data expires after 6 hours
- Navigation preload for faster network-first responses

### Background Sync

| Feature | Chrome/Edge | Firefox | Safari |
|---------|-------------|---------|--------|
| One-off Background Sync | Yes | No | No |
| Periodic Background Sync | Yes (installed PWA only) | No | No |

Periodic Background Sync is Chromium-only and frequency is throttled by a site engagement score. For Above Deck, this means Android PWAs can periodically refresh weather and tide data, but iOS cannot — weather data must be fetched eagerly when the app is opened.

---

## 2. Storage Limits by Platform

### Per-Origin Quota

| Platform | Quota Model | Practical Limit | Notes |
|----------|-------------|-----------------|-------|
| **Chrome (desktop)** | Up to 60% of free disk space | 6-60 GB typical | Shared across IndexedDB, Cache API, OPFS |
| **Chrome (Android)** | Up to 60% of free disk space | 2-20 GB typical | Same model as desktop |
| **Firefox** | 10% of total disk or 10 GiB (whichever smaller) | Up to 10 GB | Per eTLD+1 group limit |
| **Safari (macOS)** | Up to 60% of total disk (Safari 17+) | Several GB | Improved significantly in Safari 17 |
| **Safari (iOS/iPadOS)** | Up to 60% of total disk (Safari 17+) | 500 MB - several GB | See eviction section below |

### Storage APIs Comparison

| API | Use Case | Performance | Browser Support | Best For |
|-----|----------|-------------|-----------------|----------|
| **IndexedDB** | Structured data, small-medium blobs | Good | All browsers | Waypoints, routes, user settings |
| **Cache API** | HTTP responses (tiles, assets) | Good | All browsers | Service worker caching |
| **OPFS** | Large binary files | 3-4x faster than IndexedDB | All major browsers (2024+) | Chart tile archives, large datasets |
| **LocalStorage** | Small key-value | Slow, synchronous | All browsers | Avoid for anything substantial (5 MB limit) |

### OPFS (Origin Private File System)

OPFS is the most promising storage API for chart data:

- **Performance:** 3-4x faster than IndexedDB for reads/writes
- **Large files:** Supports 300+ MB files without issues
- **Synchronous access:** Available in Web Workers via `createSyncAccessHandle()`
- **Quota:** Shares the per-origin quota with IndexedDB and Cache API
- **Browser support:** Chrome 86+, Firefox 111+, Safari 15.2+
- **Limitation:** Only accessible from same origin, no user-visible file system

**Recommendation:** Use OPFS for offline chart tile storage (PMTiles archives), IndexedDB for structured navigation data, Cache API for service worker HTTP caching.

---

## 3. iOS/Safari Limitations (Critical for iPad-at-Helm)

This is the most important section. The iPad is the primary MFD display target, and Safari is the most restrictive platform.

### Storage Eviction

- Safari 17+ raised quotas to 60% of disk per origin, a major improvement from the previous ~1 GB cap
- **Persistent Storage API:** Supported since Safari 17, but requires notification permission to activate — a non-obvious coupling
- **Without persistent storage:** Safari may evict data after approximately 7 days of non-use
- **With persistent storage:** Data is protected from automatic eviction
- **Mitigation:** Request notification permission early (which also enables persistent storage), or ensure the app is used at least weekly

### APIs NOT Supported on iOS Safari

| API | Impact on Above Deck | Workaround |
|-----|---------------------|------------|
| **Web Serial** | Cannot connect directly to NMEA 0183 USB adapters | Go server on Raspberry Pi bridges NMEA to WebSocket |
| **Web Bluetooth** | Cannot read Victron BLE or BLE sensors directly | Go server or ESP32 bridges BLE to WebSocket/MQTT |
| **Web USB** | Cannot access USB instruments | Same as Web Serial — server bridge |
| **Periodic Background Sync** | Cannot refresh weather/tides in background | Fetch eagerly on app open |
| **Screen Orientation Lock** | Cannot lock to landscape for helm display | CSS media query fallback + user education |
| **Fullscreen API** | Not available, falls back to standalone mode | Standalone mode is acceptable — no Safari chrome |
| **Badging API** | Cannot show unread count on home screen icon | Not critical for marine use |

### APIs Supported on iOS Safari (with caveats)

| API | Status | Caveats |
|-----|--------|---------|
| **Web Push** | iOS 16.4+ (installed PWA only) | Must be added to home screen first; EU support restored after initial removal |
| **Service Workers** | Full support | Works reliably for offline caching |
| **Screen Wake Lock** | Safari 16.4+ (18.4 for home screen apps) | Must be in secure context |
| **DeviceOrientation** | Supported | Requires explicit `requestPermission()` call after user gesture |
| **Geolocation** | Full support | Standard permission prompt |
| **IndexedDB** | Full support | Subject to quota/eviction policies |
| **OPFS** | Safari 15.2+ | Supported but shares quota |
| **Cache API** | Full support | Subject to eviction |

### iOS 26 (2025-2026) Changes

- Every site added to the Home Screen now defaults to opening as a web app (standalone mode)
- Declarative Web Push added in Safari 18.4
- Screen Wake Lock for home screen web apps in Safari 18.4
- Storage quotas have been progressively increased

### EU Digital Markets Act Impact

- Apple initially removed standalone PWA support in the EU in iOS 17.4 beta
- After backlash from developers and the European Commission, Apple reversed the decision
- PWA standalone support is fully restored in the EU as of 2025-2026
- EU fined Apple EUR 500M in April 2025 for DMA non-compliance on browser engine restrictions
- UK CMA designated Apple with Strategic Market Status (October 2025)

---

## 4. Android/Chrome Capabilities

Android with Chrome provides the richest PWA experience for Above Deck.

### Hardware APIs Available

| API | Status | Use Case |
|-----|--------|----------|
| **Web Serial** | Chrome 89+ | Direct NMEA 0183 via USB-serial adapter (no server needed) |
| **Web Bluetooth** | Chrome 56+ | Direct Victron BLE, BLE temperature/tank sensors |
| **Web USB** | Chrome 61+ | USB instrument access |
| **Geolocation** | Full support | GPS position |
| **DeviceOrientation** | Full support (no permission prompt) | Compass heading, heel angle |
| **Screen Wake Lock** | Chrome 84+ | Keep screen on while navigating |
| **Screen Orientation Lock** | Chrome 38+ | Lock to landscape for helm display |
| **Gamepad API** | Chrome 21+ | Potential helm controller input |

### Background Processing

- One-off Background Sync: supported
- Periodic Background Sync: supported (installed PWA only, frequency throttled by engagement score)
- Background Fetch: supported (large downloads like chart packs)

### Storage

- Per-origin quota: up to 60% of free disk space
- No aggressive eviction like iOS
- Persistent Storage API: supported, no special permission coupling

### TWA (Trusted Web Activity) for Play Store

TWA wraps the PWA in a thin Android shell for Google Play distribution:

- Uses Chrome's rendering engine (not a WebView)
- Full access to all Chrome Web APIs (Serial, Bluetooth, etc.)
- Requires Lighthouse score of 80+
- Digital Asset Links for domain verification
- Tools: **Bubblewrap** (Google's CLI) or **PWABuilder** (Microsoft's GUI)
- No performance overhead vs. browser PWA
- Enables Play Store discoverability and install flow

---

## 5. Offline Chart Storage

### Chart Data Size Estimates

| Coverage | Format | Approximate Size |
|----------|--------|-----------------|
| US coastal ENC (all scales, 7000+ cells) | S-57 vector | ~2-4 GB |
| Regional coverage (e.g., US East Coast) | S-57 vector | ~500 MB - 1 GB |
| Single cruising area (e.g., Chesapeake Bay) | S-57 vector | ~50-200 MB |
| Equivalent raster (same coverage) | BSB/KAP raster | 3-10x larger than vector |
| OpenSeaMap vector tiles (global) | MVT/PBF | ~5-10 GB |
| Regional OpenSeaMap | MVT/PBF | ~200-500 MB |

Vector tiles are dramatically smaller than raster and should be the default for offline storage. A typical cruising season's worth of charts for a single region fits comfortably within browser storage quotas on all platforms.

### PMTiles for Offline Vector Tile Storage

PMTiles is the recommended format for offline chart storage in the browser:

- **Single-file archive:** All zoom levels and tiles in one file, addressed by Z/X/Y
- **HTTP Range Requests:** Can serve tiles from a static file on S3, CDN, or local server
- **Browser-native:** JavaScript reader works directly with MapLibre GL
- **Offline strategy:** Download entire PMTiles archive to OPFS, serve tiles locally
- **Compression:** Typically uses gzip or zstd, highly efficient for vector data
- **No server required:** Pure client-side tile serving from the archive

### Recommended Storage Architecture

```
Pre-cache flow:
1. User selects cruising area in passage planner
2. PMTiles archive for that region is downloaded
3. Archive stored in OPFS (fastest) or IndexedDB (broader compat)
4. MapLibre GL reads tiles directly from local archive
5. Storage budget UI shows used/available space

Runtime flow:
1. Service worker intercepts tile requests
2. Check OPFS/IndexedDB for cached tile
3. If found → serve from cache (cache-first)
4. If not found → fetch from network, cache for next time
```

### Storage Budget Management

| Platform | Available | Recommended Chart Budget |
|----------|-----------|------------------------|
| Chrome desktop | 6-60 GB | Up to 5 GB |
| Chrome Android | 2-20 GB | Up to 2 GB |
| Safari iOS/iPadOS | 500 MB - several GB | Up to 1 GB (with persistent storage) |
| Firefox | Up to 10 GB | Up to 2 GB |

The app should display storage usage and allow users to manage cached chart regions — download new areas before a passage, delete old areas to free space.

---

## 6. Hardware API Browser Support Matrix

### Full Support Matrix

| API | Chrome (Desktop) | Chrome (Android) | Safari (macOS) | Safari (iOS/iPadOS) | Firefox | Edge |
|-----|:-:|:-:|:-:|:-:|:-:|:-:|
| **Web Serial** | 89+ | 89+ | No | No | No | 89+ |
| **Web Bluetooth** | 56+ | 56+ | No | No | No | 79+ |
| **Web USB** | 61+ | 61+ | No | No | No | 79+ |
| **Geolocation** | Yes | Yes | Yes | Yes | Yes | Yes |
| **DeviceOrientation** | Yes | Yes | Yes | Yes (permission required) | Yes | Yes |
| **Screen Wake Lock** | 84+ | 84+ | 16.4+ | 16.4+ (18.4 for PWA) | 124+ | 84+ |
| **Screen Orientation Lock** | 38+ | 38+ | No | No | 43+ | 79+ |
| **Gamepad** | 21+ | Yes | 10.1+ | Yes | 29+ | 12+ |
| **Fullscreen** | Yes | Yes | Yes | No (standalone fallback) | Yes | Yes |
| **Background Sync** | 49+ | 49+ | No | No | No | 79+ |
| **Periodic Background Sync** | 80+ | 80+ | No | No | No | No |
| **Push Notifications** | Yes | Yes | Yes | 16.4+ (PWA only) | Yes | Yes |
| **Persistent Storage** | Yes | Yes | 17+ | 17+ (needs notification perm) | Yes | Yes |
| **OPFS** | 86+ | 86+ | 15.2+ | 15.2+ | 111+ | 86+ |

### Marine-Specific API Usage

| Use Case | Primary API | Fallback | Notes |
|----------|------------|----------|-------|
| GPS position | Geolocation API | Go server relay | Works on all platforms |
| Compass heading | DeviceOrientation (alpha/webkitCompassHeading) | NMEA HDG via server | iOS uses `webkitCompassHeading`, Android uses `alpha` |
| Heel/pitch angle | DeviceOrientation (beta/gamma) | NMEA via server | Useful for sailing performance |
| NMEA 0183 instruments | Web Serial API | Go server WebSocket bridge | Chrome/Edge only |
| Victron battery/solar | Web Bluetooth API | Go server or ESP32 BLE bridge | Chrome/Edge only |
| Keep screen on | Screen Wake Lock API | User setting "never sleep" | All major browsers now |
| Lock landscape | Screen Orientation Lock | CSS media query + user prompt | Not supported on iOS |

---

## 7. Install & Display Mode Behavior

### Install Prompt

| Platform | Mechanism | Developer Control |
|----------|-----------|-------------------|
| **Android (Chrome)** | Automatic `beforeinstallprompt` event | Full — can defer, customize, track |
| **iOS (Safari)** | Manual only: Share > Add to Home Screen | None — must educate users with in-app banner |
| **Desktop (Chrome)** | Install icon in address bar + `beforeinstallprompt` | Full |
| **Desktop (Edge)** | Install icon in address bar + sidebar prompt | Full |
| **Desktop (Firefox)** | No install support for PWAs | None |

### Display Modes

| Mode | Android | iOS | Desktop |
|------|---------|-----|---------|
| `fullscreen` | Yes — no system UI | Falls back to `standalone` | Yes |
| `standalone` | Yes — status bar only | Yes — no Safari UI | Yes |
| `minimal-ui` | Yes — thin nav bar | Falls back to browser tab | Yes |
| `browser` | Standard tab | Standard tab | Standard tab |

**Recommendation for Above Deck:** Use `display: standalone` in the manifest. This works on all platforms and provides the cleanest MFD-like experience. On iOS, this is the maximum available mode. On Android, `fullscreen` is tempting but `standalone` preserves the status bar (clock, battery) which is useful at the helm.

### Manifest Configuration

```json
{
  "display": "standalone",
  "orientation": "any",
  "background_color": "#1a1a2e",
  "theme_color": "#1a1a2e",
  "scope": "/tools/",
  "start_url": "/tools/"
}
```

---

## 8. Wake Lock & Screen Orientation

### Screen Wake Lock API

Critical for helm use — the screen must stay on during navigation.

- **Support:** Chrome 84+, Safari 16.4+ (18.4 for home screen PWAs), Firefox 124+, Edge 84+
- **All major browsers now support this API** (as of March 2025)
- **Requires HTTPS**
- **Automatically released** when the tab/app loses visibility; must re-acquire on `visibilitychange`
- **Battery impact:** significant on tablets — users should be informed

```javascript
// Acquire wake lock
const wakeLock = await navigator.wakeLock.request('screen');

// Re-acquire on visibility change
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible') {
    await navigator.wakeLock.request('screen');
  }
});
```

### Screen Orientation Lock

- **Not supported on iOS/Safari** — the most important platform
- Supported on Chrome/Android, Firefox, Edge
- Only works in fullscreen mode on some browsers
- **Workaround for iOS:** Use CSS `@media (orientation: portrait)` to show a "please rotate" overlay, or design the UI to work in both orientations
- The MFD frame should be responsive to both landscape and portrait

---

## 9. App Store Distribution Paths

### Distribution Matrix

| Channel | Platform | Requirements | Effort | Notes |
|---------|----------|-------------|--------|-------|
| **PWA install (home screen)** | All | Manifest + service worker + HTTPS | Low | Primary distribution method |
| **Trusted Web Activity (TWA)** | Google Play | Bubblewrap/PWABuilder, Lighthouse 80+, Digital Asset Links | Medium | Full Chrome API access, Play Store listing |
| **PWABuilder** | Microsoft Store | PWABuilder packaging, Partner Center account | Low-Medium | Desktop distribution, reduced friction in 2025 |
| **Capacitor wrapper** | iOS App Store | Capacitor build, Xcode, Apple Developer account ($99/yr) | High | Only path to iOS App Store; enables native API access |
| **Capacitor wrapper** | Google Play | Capacitor build, Android Studio | Medium | Alternative to TWA with native API access |

### Recommended Strategy

1. **Primary:** PWA with home screen install — works everywhere, zero distribution friction
2. **Android:** TWA via Bubblewrap for Play Store presence — low effort, full web API access
3. **iOS:** Capacitor wrapper for App Store — higher effort but unlocks:
   - Native Bluetooth (CoreBluetooth) for Victron BLE on iPad
   - Native serial (ExternalAccessory framework) with MFi accessories
   - No storage eviction concerns
   - App Store discoverability
   - Push notifications without home screen install requirement
4. **Desktop:** PWABuilder for Microsoft Store; Chrome/Edge install prompt for others

### Capacitor as Native Bridge

Capacitor deserves special attention as the iOS escape hatch:

- Wraps the existing Astro/React web app in a native iOS/Android shell
- Single codebase serves PWA + native
- Capacitor plugins provide native API access:
  - `@capacitor/bluetooth-le` — Victron BLE on iOS
  - `@nicemmio/capacitor-serialport` — serial (with MFi)
  - `@capacitor/local-notifications` — reliable notifications
  - `@capacitor/filesystem` — unrestricted file storage
  - `@capacitor/screen-orientation` — lock orientation
- Estimated wrapping effort: 2-5 hours for basic shell, more for native plugin integration
- Can share 95%+ of codebase with PWA version

---

## 10. Recommendations for Above Deck

### Architecture Decision

The Go server running on the Raspberry Pi is the linchpin that makes cross-platform PWA viable. By bridging all hardware protocols (NMEA 0183/2000 via SocketCAN, Victron VE.Direct via USB, BLE sensors, MQTT) to WebSocket, every client — regardless of browser API support — gets the same data.

```
[NMEA 0183] ──USB──→ [Raspberry Pi]
[NMEA 2000] ──CAN──→ [  Go Server ] ──WebSocket──→ [PWA on iPad]
[Victron]   ──USB──→ [            ]                 [PWA on Android]
[BLE Sensors]──BLE──→ [            ]                 [PWA on Desktop]
[MQTT/Matter]──WiFi─→ [            ]
```

On Android with Chrome, the PWA can also connect directly to USB-serial adapters (Web Serial) and BLE devices (Web Bluetooth) for a server-free experience — useful for simpler setups without a Raspberry Pi.

### Priority Implementation Order

1. **Service worker with Workbox** — offline app shell, cache-first for static assets
2. **Wake Lock integration** — keep screen on during navigation (all browsers)
3. **WebSocket client for Go server data** — works on all platforms
4. **Chart tile pre-caching with OPFS** — offline chart viewing
5. **PWA manifest and install prompt** — Android install banner, iOS install guide
6. **Web Serial/Bluetooth for Android** — direct hardware access where available
7. **TWA packaging for Play Store** — Android distribution
8. **Capacitor wrapper for iOS App Store** — native APIs on iPad
9. **Storage budget manager UI** — let users manage cached charts
10. **Periodic background sync (Android)** — weather/tide refresh

### Key Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| iOS storage eviction deletes cached charts | High | Request persistent storage (requires notification permission); Capacitor wrapper eliminates this |
| iOS cannot lock screen orientation | Medium | Design responsive MFD frame; most iPad helm mounts are landscape |
| No background sync on iOS | Medium | Eager fetch on app open; pre-cache before passage |
| Safari OPFS performance varies | Low | Benchmark on target iPads; fall back to IndexedDB |
| Apple further restricts PWAs | Medium | Capacitor wrapper as escape hatch; monitor DMA enforcement |

---

## Sources

- [MDN: Storage Quotas and Eviction Criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [MDN: Origin Private File System](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system)
- [MDN: Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- [MDN: Web Periodic Background Synchronization API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Periodic_Background_Synchronization_API)
- [MDN: DeviceOrientationEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent)
- [MDN: Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API)
- [MDN: ScreenOrientation lock()](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock)
- [Can I Use: Web Serial API](https://caniuse.com/web-serial)
- [Can I Use: Web Bluetooth](https://caniuse.com/web-bluetooth)
- [Can I Use: Wake Lock](https://caniuse.com/wake-lock)
- [Can I Use: Screen Orientation](https://caniuse.com/screen-orientation)
- [Can I Use: Background Sync](https://caniuse.com/background-sync)
- [Can I Use: Gamepad API](https://caniuse.com/gamepad)
- [web.dev: Screen Wake Lock Supported in All Browsers](https://web.dev/blog/screen-wake-lock-supported-in-all-browsers)
- [web.dev: Offline Data](https://web.dev/learn/pwa/offline-data)
- [web.dev: PWA Installation](https://web.dev/learn/pwa/installation)
- [web.dev: Periodic Background Sync](https://developer.chrome.com/docs/capabilities/periodic-background-sync)
- [Chrome Developers: Serial over Bluetooth](https://developer.chrome.com/blog/serial-over-bluetooth)
- [Chrome Developers: Wake Lock API](https://developer.chrome.com/docs/capabilities/web-apis/wake-lock)
- [RxDB: IndexedDB Max Storage Limit](https://rxdb.info/articles/indexeddb-max-storage-limit.html)
- [RxDB: OPFS Storage](https://rxdb.info/rx-storage-opfs.html)
- [PWA iOS Limitations and Safari Support 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [PWAs on iOS 2025: Real Capabilities vs Hard Limitations](https://ravi6997.medium.com/pwas-on-ios-in-2025-why-your-web-app-might-beat-native-0b1c35acf845)
- [Do Progressive Web Apps Work on iOS? Complete Guide 2026](https://www.mobiloud.com/blog/progressive-web-apps-ios)
- [PWA on iOS: Current Status and Limitations 2025](https://brainhub.eu/library/pwa-on-ios)
- [Safari PWA Limitations on iOS (March 2026)](https://docs.bswen.com/blog/2026-03-12-safari-pwa-limitations-ios/)
- [Publishing PWA to App Store and Google Play 2026](https://www.mobiloud.com/blog/publishing-pwa-app-store)
- [Android Developers: Trusted Web Activities](https://developer.android.com/develop/ui/views/layout/webapps/trusted-web-activities)
- [Capacitor: Progressive Web Apps](https://capacitorjs.com/docs/web/progressive-web-apps)
- [Capacitor: Cross-platform Apps](https://capacitorjs.com/)
- [PMTiles: Concepts](https://docs.protomaps.com/pmtiles/)
- [PMTiles GitHub](https://github.com/protomaps/PMTiles)
- [PMTiles for MapLibre GL](https://docs.protomaps.com/pmtiles/maplibre)
- [Protomaps](https://protomaps.com/)
- [NOAA Electronic Navigational Charts](https://nauticalcharts.noaa.gov/charts/noaa-enc.html)
- [NOAA NCDS MBTiles Download](https://distribution.charts.noaa.gov/ncds/index.html)
- [Microsoft: Publish PWA to Microsoft Store](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/microsoft-store)
- [PWABuilder Blog: Next Steps for Microsoft Store](https://blog.pwabuilder.com/docs/next-steps-for-getting-your-pwa-into-the-microsoft-store/)
- [Apple Developer: DMA and Apps in the EU](https://developer.apple.com/support/dma-and-apps-in-the-eu/)
- [Open Web Advocacy: Apple's Browser Engine Ban](https://open-web-advocacy.org/blog/apples-browser-engine-ban-persists-even-under-the-dma/)
- [Victron BLE — Home Assistant Integration](https://www.home-assistant.io/integrations/victron_ble/)
- [Victron BLE ESPHome Component](https://github.com/Fabian-Schmidt/esphome-victron_ble)
