# MFD Shell (6.26) — Feature Specification

**Date:** 2026-03-31
**Status:** Draft v1
**Package:** `packages/tools/`
**Depends on:** `@above-deck/shared/theme/*`
**License:** GPL

---

## 1. Overview

The MFD Shell is the composable desktop environment for all Above Deck applications. Every app — chartplotter, passage planner, instrument dashboard, energy planner, VHF simulator, anchor watch, logbook, AI agents — runs inside this shell. It is the equivalent of a window manager for a boat: it manages app layout, lifecycle, navigation, global state, and system-wide UI concerns like night mode and alarm display.

The shell is inspired by Raymarine's LightHouse 4 operating system but built as an open-source, cross-platform web application. Where LightHouse runs on proprietary ARM hardware behind a walled garden, the MFD Shell runs in any modern browser — on a dedicated helm display, a laptop at the nav station, a tablet in the cockpit, or a phone at anchor. Same codebase, same state, different form factors.

The shell is a React application rendered as an Astro island. It manages its own internal routing, layout compositing, and app lifecycle. Apps register with the shell via a declarative manifest and render as React components within the shell's layout engine.

### Design philosophy

- **Dark-first.** Sailors plan and navigate at night. The default palette is deep navy (`#1a1a2e`) with pale grey text (`#e0e0e0`). Every surface, every control, every transition is designed for a dark cockpit.
- **Blueprint aesthetic.** Fine lines, precise spacing, technical clarity. Space Mono headings, Inter body text, subtle grid lines at low opacity. No decorative elements. Every pixel serves a function.
- **Progressive disclosure.** The home screen shows live status at a glance. Split view shows two apps working together. Each app reveals depth on interaction. Information density adapts to screen size and context.
- **Touch and keyboard.** Marine touchscreens fail when wet. The shell supports full keyboard navigation, configurable shortcuts, and large touch targets (minimum 44px) simultaneously. No interaction requires touch alone.
- **Offline-first.** The shell and all registered apps work without connectivity. Layout state, preferences, and app data persist locally via IndexedDB.

---

## 2. User Stories

### Home screen

- As a sailor, I want to see a grid of my apps with live status previews so I can assess boat state without opening anything.
- As a sailor, I want to rearrange, resize, and hide app tiles so my home screen reflects the apps I actually use.
- As a sailor, I want to see key data (position, battery SOC, depth, wind) on the home screen without opening any app.

### Split view

- As a sailor, I want to run the chartplotter and instrument dashboard side by side so I can see both while underway.
- As a sailor, I want to drag the split divider to give more space to whichever app needs it.
- As a sailor, I want to swap the left and right apps without returning to the home screen.

### Night mode

- As a night watch sailor, I want a single toggle that switches the entire interface — shell, status bar, and all apps — to a deep red palette that preserves my night vision.
- As a sailor, I want night mode to meet S-52 night palette luminance targets (max 1.3 cd/m2 for area colours) across all UI chrome, not just the chart area.

### Multi-display

- As a sailor with displays at the helm and nav station, I want each display to show different apps while sharing the same underlying boat data.
- As a sailor, I want an alarm raised on any display to propagate to all connected displays immediately.

### App management

- As a sailor, I want apps to resume exactly where I left them — scroll position, zoom level, selected tab — when I switch back.
- As a developer, I want to register a new app with the shell by providing a manifest file, without modifying shell source code.

### Responsive

- As a sailor with a 7-inch helm display, I want the shell to show a simplified layout with larger touch targets.
- As a sailor with a 24-inch nav station monitor, I want to use the full layout with higher information density.

### Status bar

- As a sailor, I want to see my current position, UTC time, connectivity status, battery SOC, and active alarm count on every screen at all times.
- As a sailor, I want to tap the alarm indicator to see a list of active alarms and acknowledge them.

---

## 3. App Grid Home Screen

The home screen is the shell's default view. It displays registered apps as a grid of tiles, each showing a live thumbnail preview of the app's current state.

### Layout

- CSS Grid with configurable columns: 2 columns on 7" displays, 3 on 10-12", 4 on 16"+.
- Each tile is a card with subtle border (`#2d2d4a` at 30% opacity), rounded corners (`border-radius: md`), and the app's live preview rendered inside.
- Tiles are reorderable via drag-and-drop (touch: long-press to pick up; keyboard: arrow keys in edit mode).
- Users can hide tiles they do not use. Hidden apps remain accessible via a "More apps" overflow.
- The grid supports multiple pages. Swipe left/right or use pagination indicators to navigate between pages.

### Live thumbnail previews

Each tile renders a miniaturised, read-only snapshot of the app's current state. This is not a static icon — it is a live view updated at a configurable interval (default: 5 seconds, configurable 1-30 seconds).

Implementation:

- Each app exports a `ThumbnailPreview` component — a lightweight, read-only version of its primary view.
- The shell renders each `ThumbnailPreview` in an isolated container at the tile's dimensions.
- Thumbnail components subscribe to the same Zustand stores as their full apps but render simplified views (no controls, no interactivity, reduced detail).
- Apps that do not provide a `ThumbnailPreview` fall back to a static icon + last-known-state text label.

### Tile data overlay

Each tile displays a brief data summary below the preview:

- App name (Space Mono, 12px)
- Primary status line (Inter, 11px, slate `#8b8b9e`) — e.g., "SOG 6.2kt COG 245" for chartplotter, "SOC 78% +142W" for energy planner
- Active alarm indicator (coral dot) if the app has unacknowledged alarms

### Dynamic icons

Following Raymarine's mode-based icon pattern, tile previews reflect the app's current configuration:

- Chartplotter tile shows the current chart region and vessel position
- Energy planner tile shows a simplified battery gauge with solar generation
- Anchor watch tile shows the swing circle and current distance from anchor point
- Weather tile shows current conditions for the boat's location

---

## 4. Split View Engine

The split view engine allows any two apps to run side by side in a single screen. This is the primary working mode for active navigation — chart + instruments, chart + weather, passage planner + weather.

### Layout

- Two-panel horizontal split using CSS Grid: `grid-template-columns: ${leftRatio}fr ${rightRatio}fr`.
- A draggable divider bar (8px wide, `#2d2d4a` background, 1px solid border on each side) separates the panels.
- Default ratio: 50/50. Adjustable in 5% increments from 25/75 to 75/25.
- Divider is draggable via touch (drag handle with 44px touch target centred on the 8px bar) and keyboard (left/right arrow keys when divider is focused).

### Divider interaction

| Input | Action |
|-------|--------|
| Touch drag | Continuously adjust split ratio |
| Mouse drag | Continuously adjust split ratio |
| Keyboard left/right | Adjust ratio in 5% increments |
| Double-tap divider | Reset to 50/50 |
| Keyboard `Escape` on divider | Return focus to last active panel |

### Panel behaviour

- Each panel renders an independent app instance with its own state.
- Panels operate independently — zoom, scroll, and interaction in one panel do not affect the other.
- The active panel (last touched/clicked) has a 2px accent border (ocean blue `#60a5fa`) along its top edge.
- Apps receive their panel dimensions via a React context and adapt their layout accordingly.

### App assignment

- From the home screen: tap a tile to open it full-screen, or long-press to open the split view picker, which asks "Left or right?".
- From split view: tap the app name in a panel header to open the app switcher for that panel. The app switcher is a compact version of the home grid.
- Keyboard shortcut: `Ctrl+1` through `Ctrl+9` to assign apps to panels by their position in the app registry.
- Swap panels: `Ctrl+Shift+S` or tap the swap icon on the divider.

### Exiting split view

- Tap the close button on either panel header to return the remaining app to full-screen.
- Press `Escape` in full-screen to return to the home screen.
- Press `Home` key or tap the home icon in the status bar to return to the home screen from any view.

---

## 5. Status Bar

The status bar is a persistent horizontal strip at the top of the shell, visible in all views (home screen, full-screen app, split view). It provides at-a-glance system state and is the primary surface for alarms.

### Layout

Height: 32px on displays >= 10", 40px on displays < 10" (larger touch targets).

| Position | Content | Tap action |
|----------|---------|------------|
| Left | GPS position (lat/lon, 6 decimal places) | Open satellite status panel |
| Left-centre | SOG and COG | None |
| Centre | UTC time, local time (configurable) | Toggle UTC/local display |
| Right-centre | Connectivity icons: WiFi, cellular, cloud sync status | Open connectivity panel |
| Right | Battery SOC (percentage + mini bar graph) | Open energy summary panel |
| Far right | Alarm indicator (count badge on bell icon) | Open alarm list panel |

### Alarm indicator

- No active alarms: bell icon in slate (`#8b8b9e`), no badge.
- Active alarms: bell icon pulses in coral (`#f87171`), badge shows count.
- Critical alarms (MOB, fire, flooding): bell icon flashes, status bar background pulses to coral at 1Hz.
- Tapping the alarm indicator opens an alarm list panel (slide-down from status bar, overlays current view).
- Each alarm shows: severity icon, source app, message, timestamp, and acknowledge button.

### Data sources

The status bar subscribes to the following Zustand store slices:

- `navigation.position` — lat/lon
- `navigation.sog` — speed over ground
- `navigation.cog` — course over ground
- `electrical.batteries[house].soc` — state of charge
- `system.connectivity` — WiFi, cellular, cloud sync status
- `system.alarms` — active alarm list
- `system.time` — UTC and local time

### Night mode behaviour

In night mode, the status bar background shifts from deep navy (`#1a1a2e`) to near-black (`#0a0a0f`). Text and icons shift to dim red (`#8b2020`). The alarm pulse uses a darker red (`#6b1515`). Luminance targets: text < 0.5 cd/m2, background < 0.1 cd/m2.

---

## 6. Night Mode / Red Light Mode

Night vision preservation is a safety-critical feature. Human rod cells (scotopic vision) take 20-30 minutes to fully adapt to darkness. A single exposure to bright white or blue light resets this adaptation. Red light at low intensity preserves night vision because rod cells are least sensitive to long-wavelength light.

### Modes

The shell supports three display modes, selectable via a global toggle in the status bar or keyboard shortcut `Ctrl+N`:

| Mode | Background | Text | Accents | Use case |
|------|-----------|------|---------|----------|
| **Day** | Deep navy `#1a1a2e` | Pale grey `#e0e0e0` | Full palette | Daytime, well-lit cabin |
| **Dusk** | Darker navy `#0f0f1e` | Muted grey `#a0a0a0` | Desaturated palette | Twilight, dim cabin |
| **Night** | Near-black `#0a0a0f` | Dim red `#8b2020` | Red-only palette | Full darkness, cockpit at night |

### Night mode palette

| Role | Day hex | Night hex |
|------|---------|-----------|
| Background | `#1a1a2e` | `#0a0a0f` |
| Surface | `#16213e` | `#0d0d0d` |
| Primary text | `#e0e0e0` | `#8b2020` |
| Secondary text | `#8b8b9e` | `#5a1515` |
| Positive accent | `#4ade80` | `#6b2020` |
| Warning accent | `#f87171` | `#8b2020` |
| Neutral accent | `#60a5fa` | `#6b2020` |
| Grid/lines | `#2d2d4a` | `#1a0a0a` |
| Borders | `#2d2d4a` at 30% | `#1a0a0a` at 30% |

### Implementation

- The current display mode is stored in the shell's Zustand store: `shell.displayMode: 'day' | 'dusk' | 'night'`.
- The shell wraps all content in an Ant Design `ConfigProvider` (combined with a CSS custom property provider) whose theme tokens and Tailwind theme tokens are dynamically swapped based on `displayMode`.
- Apps receive the current display mode via React context (`useDisplayMode()` hook) and must respect it for any custom-rendered content (canvas, SVG, WebGL).
- Chart rendering (MapLibre) uses S-52-compliant colour tables for each mode. The shell provides the active colour table to the chartplotter via the shared theme context.
- CSS custom properties (`--ad-bg`, `--ad-surface`, `--ad-text`, `--ad-accent-*`) are set on the shell root element and cascade to all children.
- Images and icons are filtered through CSS `brightness()` and `saturate()` in night mode to prevent bright spots.

### Luminance targets

Following S-52 night palette research:

| Element | Max luminance (night) |
|---------|----------------------|
| Background areas | 0.1 cd/m2 |
| Text | 0.5 cd/m2 |
| Active controls | 0.8 cd/m2 |
| Alarm indicators | 1.3 cd/m2 (S-52 max) |

These targets assume display hardware brightness is set to minimum. The shell cannot control display backlight, but CSS colour values are chosen to meet these targets at typical minimum backlight levels for consumer displays.

### Automatic mode switching

Optional: the shell can automatically transition between day/dusk/night based on local sunrise/sunset times calculated from the boat's GPS position. Requires `navigation.position` and the current date. Uses a solar position algorithm (no external API dependency). User can override at any time.

---

## 7. Responsive Design

The shell must render usably on displays from 7 inches (dedicated helm MFD) to 27 inches (nav station monitor), in both landscape and portrait orientations, with both touch and keyboard/mouse input.

### Breakpoints

| Breakpoint | Width | Target device | Layout adaptations |
|------------|-------|---------------|-------------------|
| `xs` | < 600px | Phone (6") | Single app only, no split view, bottom navigation, status bar condensed to position + alarms |
| `sm` | 600-899px | Small tablet / 7" MFD | Single app or compact split, 2-column home grid, 40px status bar, 48px minimum touch targets |
| `md` | 900-1199px | 10" tablet / 9" MFD | Full split view, 3-column home grid, 32px status bar |
| `lg` | 1200-1599px | 12-16" MFD / laptop | Full split view, 4-column home grid, increased data density |
| `xl` | >= 1600px | 19-27" nav station | Full split view, 4-5 column home grid, optional sidebar data panels alongside split view |

### Touch adaptations

- All interactive elements have a minimum touch target of 44x44px (WCAG 2.5.5).
- On `xs` and `sm` breakpoints, touch targets increase to 48x48px.
- Long-press (300ms) activates context menus. Threshold is configurable (200-500ms) to account for rough-sea conditions where accidental long-presses are common.
- Swipe gestures: left/right to navigate home screen pages, right-edge swipe to reveal data sidebar (when supported by the active app).
- Pinch-to-zoom is passed through to apps that support it (chartplotter, weather maps).

### Keyboard navigation

| Key | Action |
|-----|--------|
| `Home` | Return to home screen |
| `Escape` | Close current panel / return to previous view |
| `Tab` / `Shift+Tab` | Navigate between focusable elements |
| `Ctrl+N` | Cycle display mode (day/dusk/night) |
| `Ctrl+1` through `Ctrl+9` | Open app by registry position |
| `Ctrl+\\` | Toggle split view |
| `Ctrl+Shift+S` | Swap split panels |
| `Ctrl+K` | Open command palette (search apps, waypoints, settings) |
| `F11` | Toggle browser fullscreen (kiosk mode) |

### Orientation

- Landscape is the primary orientation. All layouts are designed landscape-first.
- Portrait is supported but limited: split view switches to vertical stacking (top/bottom), home grid reduces to 2 columns, status bar remains horizontal.
- On spoke hardware (dedicated helm display), the shell launches in fullscreen/kiosk mode by default.

---

## 8. App Lifecycle

Apps are React components that register with the shell via a declarative manifest. The shell manages their lifecycle — discovery, registration, launch, suspension, and resumption.

### App manifest

Each app provides a manifest object (TypeScript):

```typescript
interface AppManifest {
  id: string;                          // Unique identifier, e.g. 'chartplotter'
  name: string;                        // Display name, e.g. 'Chartplotter'
  version: string;                     // Semver
  icon: React.ComponentType;           // Ant Design icon component
  category: AppCategory;               // 'navigation' | 'instruments' | 'planning' | 'systems' | 'safety' | 'social' | 'tools'
  description: string;                 // One-line description
  component: React.LazyComponentType;  // Lazy-loaded app root component
  thumbnail?: React.ComponentType;     // Optional live thumbnail for home screen
  statusLine?: () => string;           // Optional function returning current status text for tile
  minWidth?: number;                   // Minimum panel width in px (default: 300)
  supportsSplit?: boolean;             // Whether the app works in a split panel (default: true)
  supportsNightMode?: boolean;         // Whether the app handles night mode natively (default: true)
  dataSubscriptions?: string[];        // Data model paths this app reads, e.g. ['navigation.position', 'electrical.batteries']
  permissions?: AppPermission[];       // Requested permissions, e.g. ['geolocation', 'notifications', 'audio']
  shortcuts?: KeyboardShortcut[];      // App-specific keyboard shortcuts (scoped, do not conflict with shell shortcuts)
}

type AppCategory = 'navigation' | 'instruments' | 'planning' | 'systems' | 'safety' | 'social' | 'tools';

interface KeyboardShortcut {
  key: string;         // e.g. 'ctrl+shift+r'
  action: string;      // Action identifier
  description: string; // Human-readable description
}
```

### Registration

- Core apps are registered at build time via a static registry in `packages/tools/src/apps/registry.ts`.
- Plugin apps are registered at runtime via the plugin system (see section 15).
- The registry is a Zustand store slice (`shell.apps`) containing an ordered list of `AppManifest` objects.

### Launch

1. User taps a tile or uses a keyboard shortcut.
2. Shell sets `shell.activeApp` (or `shell.splitLeft` / `shell.splitRight`) to the app's `id`.
3. Shell renders the app's `component` via `React.lazy()` + `<Suspense>`. The loading fallback is a skeleton matching the app's `minWidth` with a pulsing outline.
4. The app component mounts and subscribes to its declared data paths.
5. The shell records the launch in `shell.appHistory` for back-button navigation.

### Suspension

When an app is no longer visible (user navigates away, switches to a different app in the same split panel):

1. The shell unmounts the app's React component tree.
2. Before unmounting, the shell calls the app's optional `onSuspend()` callback, which returns a serialisable state snapshot.
3. The snapshot is stored in `shell.suspendedState[appId]` (persisted to IndexedDB via Zustand persist middleware).
4. Expensive resources (WebSocket subscriptions, animation frames, canvas contexts) are released.

### Resumption

When a previously suspended app is re-launched:

1. The shell checks `shell.suspendedState[appId]`.
2. If a snapshot exists, it is passed to the app component as the `initialState` prop.
3. The app restores its scroll position, zoom level, selected tab, and other view state from the snapshot.
4. The snapshot is cleared from `shell.suspendedState` after successful restoration.

### Lifecycle hooks

Apps may implement these optional hooks via a ref-based imperative API:

```typescript
interface AppLifecycleRef {
  onSuspend?: () => SerializableState;
  onResume?: (state: SerializableState) => void;
  onDisplayModeChange?: (mode: DisplayMode) => void;
  onPanelResize?: (width: number, height: number) => void;
}
```

---

## 9. Multi-Display

A boat may have multiple displays — typically a helm display (exposed to weather, used while steering) and a nav station display (below decks, used for planning). Both should show the Above Deck shell with independent views but shared data.

### Architecture

Multi-display is handled at the server level, not within the shell itself:

- Each display runs an independent browser instance, each loading the shell.
- Both browsers connect to the same Go API server (on the spoke) via WebSocket.
- The Go server is the single source of truth for all boat data (navigation, electrical, alarms, etc.).
- Both browser instances receive the same real-time data updates via their WebSocket connections.

### Shared state (server-mediated)

| Data | Sharing | Mechanism |
|------|---------|-----------|
| Boat data (position, instruments, batteries) | Shared — all displays see the same data | Go server broadcasts via WebSocket |
| Alarms | Shared — alarm raised on one display appears on all | Go server manages alarm state |
| Routes and waypoints | Shared — route created on one display is visible on the other | Persisted in SQLite, synced via API |
| App layout | Independent — each display has its own layout | Local Zustand store per browser instance, keyed by `displayId` |
| Display mode (day/dusk/night) | Independent — helm might be in night mode while nav station is in day mode | Local Zustand store per browser instance |
| Active app / split configuration | Independent | Local Zustand store per browser instance |

### Display identity

Each browser instance generates a persistent `displayId` (UUID) stored in localStorage. This ID is sent with the WebSocket connection handshake so the server can track connected displays.

The user assigns a human-readable name to each display ("Helm", "Nav Station", "Cockpit Tablet") via the shell settings. This name appears in the status bar and is used when routing alarms or sharing display configurations.

### Alarm propagation

When the Go server raises an alarm:

1. The alarm is broadcast to all connected displays via WebSocket.
2. Each display renders the alarm in its status bar independently.
3. When a user acknowledges an alarm on any display, the acknowledgement is sent to the server, which broadcasts the updated alarm state to all displays.
4. Critical alarms (MOB, fire, flooding) require acknowledgement and cannot be auto-dismissed.

---

## 10. Navigation

Navigation refers to moving between views within the shell — not nautical navigation.

### Navigation model

The shell uses a stack-based navigation model:

```
Home Screen → Full-screen App → (optional) Split View
```

- The home screen is always the root of the stack.
- Opening an app pushes it onto the stack.
- Pressing `Home` or tapping the home icon clears the stack and returns to the home screen.
- Pressing `Escape` or the back button pops the stack (returns to previous view).

### App switching

| Method | Action |
|--------|--------|
| Home screen tile tap | Open app full-screen |
| Home screen tile long-press | Open split view picker |
| Status bar home icon | Return to home screen |
| `Ctrl+1` through `Ctrl+9` | Open app by position |
| `Ctrl+K` (command palette) | Search and open any app |
| Split panel header tap | Open app switcher for that panel |
| Back button / `Escape` | Return to previous view |
| Swipe from left edge | Back (on touch devices) |

### Gestures

| Gesture | Context | Action |
|---------|---------|--------|
| Swipe left/right | Home screen | Navigate between home screen pages |
| Swipe from left edge | Any app | Back / return to previous view |
| Swipe from right edge | Any app | Reveal data sidebar (if app supports it) |
| Long-press | Home screen tile | Enter edit mode / split view picker |
| Long-press | Within app | Delegated to app (e.g., chart context menu) |

### Command palette

`Ctrl+K` opens a full-width search bar overlaid on the current view. It searches:

- App names and descriptions
- Waypoints and routes (by name)
- Settings (by keyword)
- Shell actions (e.g., "toggle night mode", "split view")

Results are keyboard-navigable (arrow keys + Enter). The palette closes on `Escape` or when a result is selected.

---

## 11. Theming

The shell enforces a consistent visual language across all apps via a shared theme distributed through `@above-deck/shared/theme`.

### Typography

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Headings | Space Mono | 700 | App titles, section headers, tile labels. Monospace with character — draughtsman feel. |
| Body | Inter | 400/500 | Body text, descriptions, data labels. Clean, highly legible at small sizes. |
| Data / specs | Fira Code | 400 | Instrument readouts, coordinates, technical data, code. Monospace for alignment. |

All fonts loaded via Google Fonts CDN. On the spoke (offline), fonts are bundled with the app shell.

### Colour palette

| Role | Token | Hex | CSS variable |
|------|-------|-----|-------------|
| Background (dark) | `deepNavy` | `#1a1a2e` | `--ad-bg` |
| Surface | `midnightBlue` | `#16213e` | `--ad-surface` |
| Background (light) | `offWhite` | `#f5f5f0` | `--ad-bg-light` |
| Primary text (dark) | `paleGrey` | `#e0e0e0` | `--ad-text` |
| Primary text (light) | `charcoal` | `#2d2d3a` | `--ad-text-light` |
| Secondary text | `slate` | `#8b8b9e` | `--ad-text-secondary` |
| Positive | `seaGreen` | `#4ade80` | `--ad-accent-positive` |
| Warning | `coral` | `#f87171` | `--ad-accent-warning` |
| Neutral | `oceanBlue` | `#60a5fa` | `--ad-accent-neutral` |
| Grid/lines | `blueprintGrey` | `#2d2d4a` | `--ad-grid` |

### Surface hierarchy

| Level | Token | Usage | Border |
|-------|-------|-------|--------|
| 0 | `--ad-bg` | Shell background, home screen | None |
| 1 | `--ad-surface` | App panels, cards, tiles | `1px solid var(--ad-grid)` at 30% opacity |
| 2 | `--ad-surface` + 5% lighter | Elevated surfaces (modals, popovers, command palette) | `1px solid var(--ad-grid)` at 50% opacity |

### Grid lines

The blueprint aesthetic uses fine grid lines as structural elements:

- 1px solid, `--ad-grid` at 15-30% opacity.
- Used for: tile borders, split divider, status bar separator, table rules, chart gridlines.
- Never used as heavy visual separators. The grid should feel like faint pencil lines on drafting paper.

### Spacing

8px base unit. All spacing is a multiple of 8px (8, 16, 24, 32, 48, 64). This produces the precise, measured feel of technical drawings.

### Icons

Ant Design Icons (@ant-design/icons). Outlined style for consistency. Icons are always monochrome, using the current text colour. Never filled, never multicoloured.

### Shadows

No shadows. The blueprint aesthetic relies on borders and subtle background shifts, not elevation shadows. Cards are flat with fine borders.

---

## 12. Data Model

### Shell state (Zustand store)

```typescript
interface ShellState {
  // Display
  displayMode: 'day' | 'dusk' | 'night';
  displayId: string;               // UUID, persistent per browser instance
  displayName: string;             // Human-readable, e.g. "Helm"

  // Layout
  view: 'home' | 'app' | 'split';
  activeApp: string | null;        // App ID for full-screen view
  splitLeft: string | null;        // App ID for left split panel
  splitRight: string | null;       // App ID for right split panel
  splitRatio: number;              // 0.25 to 0.75, default 0.5
  homeGridOrder: string[];         // Ordered list of app IDs
  homeGridHidden: string[];        // Hidden app IDs
  homeGridPage: number;            // Current home screen page

  // Navigation
  navStack: string[];              // View history for back navigation

  // App state
  suspendedState: Record<string, SerializableState>;
  appHistory: Array<{ appId: string; timestamp: number }>;

  // Alarms
  activeAlarms: Alarm[];
  acknowledgedAlarms: string[];    // Alarm IDs

  // User preferences
  preferences: ShellPreferences;
}

interface ShellPreferences {
  thumbnailUpdateInterval: number;   // Seconds, default 5
  longPressThreshold: number;        // Milliseconds, default 300
  autoNightMode: boolean;            // Auto-switch based on sunrise/sunset
  clockFormat: '12h' | '24h';
  coordinateFormat: 'DD' | 'DMS' | 'DDM';
  statusBarFields: string[];         // Configurable status bar data fields
}

interface Alarm {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  source: string;                    // App ID or system service
  message: string;
  timestamp: number;
  acknowledged: boolean;
  acknowledgedBy?: string;           // Display ID that acknowledged
  data?: Record<string, unknown>;    // Alarm-specific payload
}
```

### App registry

```typescript
interface AppRegistry {
  apps: AppManifest[];             // Ordered list of registered apps
  plugins: PluginManifest[];       // Registered plugin apps
}
```

### Persistence

- Shell state is persisted to IndexedDB via Zustand's `persist` middleware with the `createJSONStorage` adapter.
- The persistence key includes the `displayId` so each display maintains independent layout state.
- Suspended app state is stored under `shell-suspended-{displayId}`.
- User preferences are stored under `shell-preferences-{userId}` and synced to the hub when connectivity is available.

---

## 13. Component Architecture

### Component tree

```
<MfdShell>                               // Root shell component
  <ConfigProvider>                        // Ant Design theme + Tailwind CSS custom properties, display mode
    <ShellStoreProvider>                  // Zustand store context
      <StatusBar />                       // Persistent top bar
      <ShellContent>                      // Main content area (below status bar)
        {view === 'home' && <HomeGrid />}
        {view === 'app' && <AppPanel appId={activeApp} />}
        {view === 'split' && (
          <SplitView
            left={splitLeft}
            right={splitRight}
            ratio={splitRatio}
          />
        )}
      </ShellContent>
      <CommandPalette />                  // Overlay, toggled by Ctrl+K
      <AlarmPanel />                      // Slide-down overlay from status bar
    </ShellStoreProvider>
  </ConfigProvider>
</MfdShell>
```

### Key components

| Component | Responsibility |
|-----------|---------------|
| `MfdShell` | Root layout, keyboard shortcut registration, display mode management |
| `ConfigProvider` | Wraps Ant Design theme context, swaps colour tokens (CSS custom properties) based on display mode |
| `StatusBar` | Persistent top bar, subscribes to navigation/electrical/alarm stores |
| `HomeGrid` | Renders app tiles in CSS Grid, handles reorder/pagination |
| `AppTile` | Individual tile: renders `ThumbnailPreview`, handles tap/long-press |
| `AppPanel` | Wraps a single app in `Suspense`, manages lifecycle hooks |
| `SplitView` | Two `AppPanel` instances with draggable divider |
| `SplitDivider` | Draggable divider bar, handles touch/mouse/keyboard resize |
| `CommandPalette` | Search overlay, indexes apps/waypoints/settings |
| `AlarmPanel` | Slide-down alarm list with acknowledge controls |
| `AppSwitcher` | Compact grid for changing the app in a split panel |

### State management

- **Zustand 5** for all shell state (layout, display mode, alarms, preferences, suspended app state). Persisted to IndexedDB.
- **TanStack Query 5** for server state (boat data, routes, waypoints fetched from the Go API). Background refetching at configurable intervals.
- **React Context** for passing shell services to apps:
  - `useDisplayMode()` — current display mode and colour tokens
  - `useShellNavigation()` — navigate between apps, push/pop stack
  - `usePanelDimensions()` — current panel width/height (reactive)
  - `useAlarms()` — read active alarms, raise new alarms
  - `useBoatData(path)` — subscribe to a specific data model path (thin wrapper over TanStack Query + WebSocket)

### WebSocket integration

The shell maintains a single WebSocket connection to the Go API server. Messages are:

- **Boat data updates** — pushed by the server at the configured update rate (default 1Hz for navigation data, 0.1Hz for slow-changing data like batteries). Routed to TanStack Query cache.
- **Alarm events** — pushed by the server when thresholds are breached. Update the Zustand alarm store.
- **Sync events** — layout preference sync between hub and spoke.

The WebSocket connection is managed by a singleton `DataService` class that handles reconnection (exponential backoff, max 30s), message routing, and subscription management.

---

## 14. Performance

### Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| App switch latency | < 200ms | Time from tap to first meaningful paint of new app |
| Split view resize | < 16ms per frame | Divider drag must not drop below 60fps |
| Home screen render | < 500ms | Time to render all tiles with thumbnails on initial load |
| Thumbnail update | < 50ms per tile | Time to re-render a single thumbnail |
| Status bar update | < 16ms | Status bar data changes must not cause visible jank |
| WebSocket message processing | < 5ms | Time to parse and route a single WebSocket message |
| Shell bundle size | < 150KB gzipped | Shell code only, excluding app bundles |
| Memory per suspended app | < 10KB | Serialised state snapshot size |

### Code splitting

- Each app is a separate code-split chunk loaded via `React.lazy()`.
- The shell bundle contains only: shell layout, status bar, home grid, split view engine, command palette, theme, and Zustand stores.
- App bundles are loaded on first launch and cached by the service worker for subsequent launches.
- Thumbnail components should be lightweight (< 5KB each) and bundled with the shell, not with their parent app, since they render on the home screen before any app is launched.

### Memory management

- Only the visible app(s) are mounted in the React tree. Suspended apps are unmounted and their state serialised.
- In split view, exactly two app component trees are mounted.
- Thumbnail previews use `requestIdleCallback` for non-critical updates — they must never block interaction with the active app.
- The shell monitors `performance.memory` (where available) and logs warnings if JS heap exceeds 200MB.

### Rendering optimisation

- Status bar components use `React.memo` with shallow equality checks to prevent re-renders from unrelated state changes.
- Home grid tiles use virtualisation (only render tiles visible in the viewport) on screens with more than 12 tiles.
- Split divider drag uses `requestAnimationFrame` and CSS transforms (not layout-triggering properties) for smooth resizing.
- Display mode changes apply via CSS custom property updates on the root element — a single DOM operation that cascades to all children, no React re-render required for colour changes.

---

## 15. Plugin Integration

Third-party developers can create new apps (screen plugins) that register with the shell at runtime.

### Plugin manifest

Plugins provide an `AppManifest` (identical to core apps) plus additional metadata:

```typescript
interface PluginManifest extends AppManifest {
  plugin: {
    author: string;
    license: string;
    repository?: string;           // Git repository URL
    homepage?: string;
    minShellVersion: string;       // Minimum compatible shell version (semver)
    permissions: PluginPermission[];
  };
}

type PluginPermission =
  | 'read:navigation'              // Read navigation data
  | 'read:electrical'              // Read electrical data
  | 'read:environment'             // Read environment data
  | 'read:propulsion'              // Read engine/propulsion data
  | 'write:alarms'                 // Raise alarms
  | 'write:waypoints'              // Create/modify waypoints
  | 'network:websocket'            // Open additional WebSocket connections
  | 'storage:local'                // Use local storage (scoped to plugin ID)
  | 'notifications'                // Show browser notifications
  | 'audio'                        // Play audio (alarms, alerts)
  ;
```

### Registration

1. Plugin bundles are JavaScript modules hosted at a URL (local file path on spoke, or CDN on hub).
2. The Go server maintains a plugin registry in SQLite.
3. On shell startup, the shell fetches the plugin registry from the API and dynamically imports each plugin module.
4. Each plugin module exports a `register()` function that returns a `PluginManifest`.
5. The shell validates the manifest (required fields, version compatibility, no shortcut conflicts) and adds the plugin to the app registry.

### Isolation

- Plugins run in the same JavaScript context as the shell (not in an iframe or web worker). This is a deliberate trade-off: it allows plugins to use the same React/Ant Design/Zustand infrastructure as core apps, but means a misbehaving plugin can affect the shell.
- Plugin data storage is scoped to the plugin's `id` via a namespaced IndexedDB store.
- Plugins cannot access other plugins' state or storage.
- Plugins cannot modify shell state directly — they interact with the shell via the provided React context hooks (`useShellNavigation`, `useAlarms`, `useBoatData`, etc.).

### Distribution

- Plugins are distributed as npm packages or standalone JS bundles.
- A plugin directory (hosted on the hub) allows users to browse, install, and update plugins.
- Installation on the spoke: the Go server downloads the plugin bundle and serves it locally for offline use.
- No signing requirement. This is open source — anyone can build and distribute plugins. Users install at their own discretion.

---

## 16. Dependencies

The MFD Shell is the foundational layer of the tools package. Every app depends on it.

### Shell depends on

| Dependency | Purpose |
|------------|---------|
| `@above-deck/shared/theme` | Colour tokens, typography, Tailwind theme configuration |
| React 19 | Component rendering |
| Tailwind CSS + Ant Design 5 (antd) | UI components (buttons, modals, tooltips, etc.) — comprehensive React component library with built-in dark mode and i18n. Ant Design Icons (@ant-design/icons). |
| Zustand 5 | Shell state management, persisted to IndexedDB |
| TanStack Query 5 | Server state (boat data from Go API) |
| Astro 5 | Host page (shell renders as a React island within an Astro page) |

### Apps depend on shell

Every app in `packages/tools/` depends on the shell for:

| Service | How apps consume it |
|---------|--------------------|
| Layout | Apps render inside `AppPanel`, receiving dimensions via context |
| Display mode | Apps read the current mode via `useDisplayMode()` and apply the correct palette |
| Data access | Apps subscribe to boat data via `useBoatData(path)` |
| Navigation | Apps use `useShellNavigation()` to open other apps or return home |
| Alarms | Apps use `useAlarms()` to raise and read alarms |
| Persistence | Apps use the shell's suspend/resume lifecycle to persist view state |
| Theming | Apps use Ant Design components which inherit the shell's theme context via ConfigProvider and CSS custom properties |

### Core apps

The following apps are bundled with the shell and registered at build time:

| App ID | Name | Category |
|--------|------|----------|
| `chartplotter` | Chartplotter | navigation |
| `instruments` | Instruments | instruments |
| `passage-planner` | Passage Planner | planning |
| `weather` | Weather | planning |
| `tides` | Tides | planning |
| `energy-planner` | Energy Planner | systems |
| `anchor-watch` | Anchor Watch | safety |
| `logbook` | Logbook | tools |
| `boat-management` | Boat Management | systems |
| `vhf-simulator` | VHF Simulator | tools |
| `ai-crew` | AI Crew | tools |

### Build order

The shell must be built before any app. The build order is:

1. `@above-deck/shared` (theme, types)
2. `packages/tools/src/shell/` (MFD Shell)
3. `packages/tools/src/apps/*` (individual apps, parallel)

---

## Open Questions

1. **Quad split on large displays.** Should the split view engine support 3 or 4 panels on displays >= 19"? Raymarine supports this on larger Axiom XL units. Complexity cost is significant — start with 2-panel split and evaluate demand.

2. **App-to-app communication.** Should apps be able to send messages to each other directly (e.g., chartplotter tells passage planner to open a specific route)? Or should all inter-app communication go through the shared data model? Direct messaging adds coupling; shared state is cleaner but slower for UI coordination.

3. **Sidebar data panel.** Raymarine's swipe-from-right sidebar shows configurable data fields overlaid on any app. Should this be a shell-level feature (sidebar managed by the shell, available in all apps) or an app-level feature (each app implements its own sidebar)? Shell-level is more consistent; app-level allows richer integration.

4. **Hardware input mapping.** When running on spoke hardware with a USB keypad or rotary encoder, how do physical controls map to shell actions? This requires a configurable input mapping layer in the shell.

5. **Screen mirroring.** Should one display be able to mirror another display's exact view? Useful for cockpit repeaters. This is simpler than independent multi-display but requires state synchronisation between browser instances via the Go server.
