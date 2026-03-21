# Chartplotter Landing Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current landing page with a chartplotter-style MFD (multi-function display) interface featuring e-ink paper widgets in a brushed titanium device frame, with screen navigation between Home dashboard and Solar schematic views.

**Architecture:** The landing page is a standalone Astro page (`index.astro`) that renders a full-viewport device frame using pure CSS (no Mantine — the landing page has its own visual language). Interactive widgets are React islands for screen switching and future geo-location features. The page replaces the existing `index.astro` entirely. The design is PWA-ready with `safe-area-inset` and `viewport-fit=cover`.

**Tech Stack:** Astro 5 page, React 19 island (screen switcher), CSS custom properties, SVG animations, Google Fonts (Inter, Space Mono, Fira Code), Tabler Icons for nav buttons.

**Reference wireframe:** `.superpowers/brainstorm/7871-1773344405/landing-chartplotter-v2.html`

---

## File Structure

```
packages/web/src/
├── pages/
│   └── index.astro                          # MODIFY — complete rewrite
├── layouts/
│   └── LandingLayout.astro                  # CREATE — minimal layout without Mantine Shell
├── components/
│   └── landing/
│       ├── DeviceFrame.astro                # Titanium bezel + screen container
│       ├── TopBar.astro                     # Logo + instrument readings
│       ├── NavBar.tsx                       # Bottom round buttons (React — handles screen state)
│       ├── ScreenHome.astro                 # Home MFD grid with all widgets
│       ├── ScreenSolar.astro               # Solar schematic view
│       ├── widgets/
│       │   ├── WidgetSolar.astro           # Solar & energy widget
│       │   ├── WidgetChart.astro           # Center chart/hero with boat animation
│       │   ├── WidgetWeather.astro         # Weather conditions + forecast
│       │   ├── WidgetPassage.astro         # Passage planning summary
│       │   └── WidgetLog.astro             # Ship's log / news entries
│       ├── chart/
│       │   ├── BoatMarker.astro            # Animated sailing boat SVG
│       │   ├── ChartDetails.astro          # Soundings, nav marks, contours
│       │   └── Compass.astro               # Compass rose
│       └── landing.css                     # All landing page styles
├── test/
│   └── landing/
│       └── landing.test.ts                 # Smoke tests for landing page
```

**Key design decisions:**
- Landing page uses a dedicated `LandingLayout.astro` that duplicates the `<head>` from `BaseLayout` but does NOT wrap content in `AppShellWrapper`/`Shell`. This avoids the Mantine AppShell header (60px) and padding that would break the full-viewport chartplotter layout. `BaseLayout.astro` is NOT modified — no risk of regressions on other pages.
- CSS is in a single `landing.css` file (not CSS modules) to match the wireframe structure
- `NavBar.tsx` is the only React island — it exposes a global `window.showScreen()` function via `useEffect` so that Astro components (widget clicks, back button) can trigger screen switches through a single code path
- All other components are Astro (`.astro`) for zero JS overhead
- Add `text-decoration: none; color: inherit;` to `.nav-btn` CSS to handle the GitHub `<a>` element

---

## Chunk 1: Foundation — Device Frame, Styles, and Page Shell

### Task 1: Create the landing page CSS file

**Files:**
- Create: `packages/web/src/components/landing/landing.css`

- [ ] **Step 1: Write the CSS file with all styles from the wireframe**

Port the complete CSS from `landing-chartplotter-v2.html` into `landing.css`. Organise into these sections with comment headers:
- Reset/body (full viewport, dark background)
- Device frame (brushed titanium bezel, chamfered edges, shadows)
- Top bar (transparent on metal, debossed text)
- Screens (recessed with inset shadow, flex layout)
- Home grid (3-column MFD layout)
- Widget base (paper background `#f4f1eb`, dark text)
- Widget-specific styles (solar, chart, weather, passage, log)
- Chart animations (boat sail path, GPS ring, contour shift)
- Chart details (soundings, nav marks, depth contours)
- Solar schematic screen (paper background, sidebar, energy nodes)
- Nav bar (round backlit buttons, glow pulse, press states)
- Responsive breakpoints (1024px, 640px)

Use CSS custom properties for the key values:

```css
:root {
  --paper: #f4f1eb;
  --paper-hover: #f8f5ef;
  --ink: #1a1a1a;
  --ink-light: rgba(0,0,0,0.3);
  --ink-faint: rgba(0,0,0,0.12);
  --metal-light: #d2d0cb;
  --metal-mid: #b8b5af;
  --metal-dark: #aeaba5;
  --accent-green: #2d8a4e;
  --accent-red: #b43c32;
  --accent-red-compass: #c0392b;
  --frame-bg: #1a1a1a;
  --screen-bg: #111;
}
```

Copy the exact CSS from the wireframe, converting hardcoded values to use the custom properties where it aids readability. Keep all animations (`@keyframes sail`, `glowPulse`, `gpsRing`, `contourShift`).

Add anchor resets to the `.nav-btn` rule so the GitHub `<a>` button inherits correctly:
```css
.nav-btn {
  /* ...existing styles... */
  text-decoration: none;
  color: inherit;
}
```

- [ ] **Step 2: Verify file is valid CSS**

Run: `cd packages/web && npx stylelint src/components/landing/landing.css --fix 2>/dev/null; echo "CSS created"`
Expected: File exists, no fatal parse errors

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/components/landing/landing.css
git commit -m "feat: add chartplotter landing page styles"
```

### Task 2: Create the DeviceFrame component

**Files:**
- Create: `packages/web/src/components/landing/DeviceFrame.astro`

- [ ] **Step 1: Write the DeviceFrame component**

```astro
---
// DeviceFrame.astro — Brushed titanium bezel wrapping the MFD screen
---
<div class="device">
  <slot />
</div>
```

This is intentionally minimal — all styling comes from `landing.css`. The `device` class applies the multi-layer titanium gradient, brushed grain overlays, chamfered edge highlight (`::before`), rounded corners, and outer drop shadow.

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/components/landing/DeviceFrame.astro
git commit -m "feat: add DeviceFrame bezel component"
```

### Task 3: Create the TopBar component

**Files:**
- Create: `packages/web/src/components/landing/TopBar.astro`

- [ ] **Step 1: Write the TopBar component**

```astro
---
// TopBar.astro — Logo and instrument readings on the titanium frame
---
<div class="top-bar">
  <div class="top-bar-logo">Above Deck</div>
  <div class="top-bar-readings">
    <div class="reading accent"><span class="val">12.8V</span></div>
    <div class="reading"><span class="val">342W</span></div>
    <div class="reading"><span class="val">14:23 UTC</span></div>
    <div class="reading"><span class="val">50°09'N 005°04'W</span></div>
  </div>
</div>
```

Note: These are static placeholder readings for the landing page. Once geo-location and user configs are implemented, these will become dynamic React islands.

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/components/landing/TopBar.astro
git commit -m "feat: add TopBar instrument readings component"
```

### Task 4: Create the NavBar React island

**Files:**
- Create: `packages/web/src/components/landing/NavBar.tsx`

- [ ] **Step 1: Write the failing test**

Create: `packages/web/src/test/landing/landing.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

describe('Landing page components', () => {
  it('NavBar exports a default function component', async () => {
    const mod = await import('@/components/landing/NavBar');
    expect(typeof mod.NavBar).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/web && npx vitest run src/test/landing/landing.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the NavBar component**

```tsx
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { id: 'home', icon: '⊞', label: 'Home' },
  { id: 'solar', icon: '☀', label: 'Solar' },
  { id: 'passage', icon: '⚓', label: 'Passage' },
  { id: 'weather', icon: '◉', label: 'Weather' },
  { id: 'log', icon: '☰', label: 'Log' },
] as const;

const GITHUB_SVG = (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

type ScreenId = (typeof NAV_ITEMS)[number]['id'];

export function NavBar() {
  const [active, setActive] = useState<ScreenId>('home');

  function switchScreen(id: ScreenId) {
    setActive(id);
    // Toggle visibility via DOM — screens are server-rendered Astro components
    document.querySelectorAll<HTMLElement>('.screen').forEach((el) => {
      el.classList.toggle('active', el.id === `screen-${id}`);
    });
  }

  // Expose global showScreen() so Astro components (widget clicks, back button)
  // can trigger navigation without needing React context
  useEffect(() => {
    (window as any).showScreen = (id: ScreenId) => switchScreen(id);

    // Wire up data-screen-link clicks (e.g. WidgetSolar → solar screen)
    const handler = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest<HTMLElement>('[data-screen-link]');
      if (link) switchScreen(link.dataset.screenLink as ScreenId);
    };
    document.addEventListener('click', handler);
    return () => {
      document.removeEventListener('click', handler);
      delete (window as any).showScreen;
    };
  });

  return (
    <div className="nav-bar">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`nav-btn ${active === item.id ? 'active' : ''}`}
          data-screen={item.id}
          onClick={() => switchScreen(item.id)}
          aria-label={item.label}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
      <a
        className="nav-btn"
        href="https://github.com/abovedeck"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
      >
        <span className="nav-icon">{GITHUB_SVG}</span>
        <span className="nav-label">GitHub</span>
      </a>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/web && npx vitest run src/test/landing/landing.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/components/landing/NavBar.tsx packages/web/src/test/landing/landing.test.ts
git commit -m "feat: add NavBar round backlit button component with tests"
```

---

## Chunk 2: Widgets

### Task 5: Create the WidgetSolar component

**Files:**
- Create: `packages/web/src/components/landing/widgets/WidgetSolar.astro`

- [ ] **Step 1: Write the component**

Port the Solar widget HTML from the wireframe. Includes:
- Big value display (`342W` current generation)
- SVG curve chart with gradient fill and "now" marker
- Stats row (Today 2.4 kWh, Battery 87%, Surplus +1.2)
- Description text
- `onclick` attribute to trigger `showScreen('solar')` (wired up by NavBar)

Use the exact HTML structure from the wireframe's `<!-- SOLAR -->` section. The widget is clickable and navigates to the Solar schematic screen.

```astro
---
// WidgetSolar.astro — Solar & energy summary widget
---
<div class="widget" data-screen-link="solar">
  <div class="widget-head">
    <span class="widget-label">Solar & Energy</span>
    <span class="widget-badge">Live</span>
  </div>
  <div class="widget-body">
    <div class="solar-value">342<span class="unit">W</span></div>
    <div class="solar-sub">Current generation</div>

    <div class="solar-curve">
      <svg viewBox="0 0 200 60" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--ink)" stop-opacity="0.1" />
            <stop offset="100%" stop-color="var(--ink)" stop-opacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 55 Q20 50, 40 42 T80 25 T120 12 T160 18 T200 35" fill="none" stroke="var(--ink)" stroke-width="1.5" opacity="0.4" />
        <path d="M0 55 Q20 50, 40 42 T80 25 T120 12 T160 18 T200 35 V60 H0 Z" fill="url(#sg)" />
        <circle cx="130" cy="14" r="3" fill="var(--ink)" opacity="0.6" />
        <line x1="130" y1="14" x2="130" y2="60" stroke="var(--ink)" stroke-width="0.5" opacity="0.15" stroke-dasharray="2,2" />
      </svg>
    </div>

    <div class="solar-row">
      <div class="solar-stat"><div class="num">2.4 kWh</div><div class="lbl">Today</div></div>
      <div class="solar-stat"><div class="num">87%</div><div class="lbl">Battery</div></div>
      <div class="solar-stat"><div class="num">+1.2</div><div class="lbl">Surplus</div></div>
    </div>

    <div class="solar-desc">Model your panel setup and track generation vs consumption.</div>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/components/landing/widgets/WidgetSolar.astro
git commit -m "feat: add solar energy widget"
```

### Task 6: Create the WidgetChart (center hero) component

**Files:**
- Create: `packages/web/src/components/landing/widgets/WidgetChart.astro`
- Create: `packages/web/src/components/landing/chart/BoatMarker.astro`
- Create: `packages/web/src/components/landing/chart/ChartDetails.astro`
- Create: `packages/web/src/components/landing/chart/Compass.astro`

- [ ] **Step 1: Create the Compass component**

```astro
---
// Compass.astro — Compass rose with north indicator
---
<div class="chart-compass">
  <div class="chart-compass-n">N</div>
  <div class="chart-compass-needle"></div>
</div>
```

- [ ] **Step 2: Create the BoatMarker component**

Animated boat SVG that traverses the chart on a 45-second curved path. Includes GPS ring pulse and heading line.

```astro
---
// BoatMarker.astro — Animated sailing boat with heading line
---
<div class="heading-line"></div>
<div class="boat">
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2 L16 14 Q14 17, 10 18 Q6 17, 4 14 Z"
      fill="rgba(0,0,0,0.5)" stroke="rgba(0,0,0,0.6)" stroke-width="0.5" />
    <line x1="10" y1="4" x2="10" y2="16" stroke="rgba(0,0,0,0.3)" stroke-width="0.5" />
  </svg>
</div>
```

- [ ] **Step 3: Create the ChartDetails component**

Depth contour lines, soundings, nav marks, and wake trail.

```astro
---
// ChartDetails.astro — Chart decorations: contours, soundings, nav marks, wake
---
<!-- Depth contour lines -->
<div class="contour-line" style="width: 280px; height: 180px; top: 8%; left: 5%;"></div>
<div class="contour-line" style="width: 200px; height: 120px; top: 12%; left: 10%; animation-delay: -5s;"></div>
<div class="contour-line" style="width: 320px; height: 160px; bottom: 15%; right: 5%; animation-delay: -10s;"></div>
<div class="contour-line" style="width: 180px; height: 100px; bottom: 20%; right: 12%; animation-delay: -8s;"></div>
<div class="contour-line" style="width: 240px; height: 140px; top: 45%; left: 60%; animation-delay: -3s;"></div>

<!-- Depth soundings -->
<span class="sounding" style="top: 15%; left: 8%;">12</span>
<span class="sounding" style="top: 22%; left: 18%;">8</span>
<span class="sounding" style="top: 10%; left: 30%;">15</span>
<span class="sounding" style="top: 35%; left: 12%;">5.2</span>
<span class="sounding" style="top: 50%; left: 6%;">18</span>
<span class="sounding" style="top: 68%; left: 15%;">3.4</span>
<span class="sounding" style="top: 75%; left: 28%;">7</span>
<span class="sounding" style="top: 18%; right: 15%;">22</span>
<span class="sounding" style="top: 30%; right: 8%;">14</span>
<span class="sounding" style="top: 55%; right: 12%;">9.1</span>
<span class="sounding" style="top: 70%; right: 22%;">6</span>
<span class="sounding" style="top: 80%; right: 8%;">11</span>
<span class="sounding" style="top: 42%; left: 75%;">16</span>
<span class="sounding" style="top: 85%; left: 45%;">4.8</span>
<span class="sounding" style="top: 20%; left: 55%;">20</span>

<!-- Nav marks -->
<div class="chart-mark" style="top: 72%; left: 20%; width: 10px; height: 14px;">
  <svg viewBox="0 0 10 14" fill="none"><polygon points="5,0 10,10 0,10" stroke="rgba(0,0,0,0.12)" stroke-width="1" fill="none"/><line x1="5" y1="10" x2="5" y2="14" stroke="rgba(0,0,0,0.08)" stroke-width="1"/></svg>
</div>
<div class="chart-mark" style="top: 25%; right: 20%; width: 10px; height: 14px;">
  <svg viewBox="0 0 10 14" fill="none"><polygon points="5,0 10,10 0,10" stroke="rgba(0,0,0,0.12)" stroke-width="1" fill="none"/><line x1="5" y1="10" x2="5" y2="14" stroke="rgba(0,0,0,0.08)" stroke-width="1"/></svg>
</div>
<div class="chart-mark" style="top: 60%; right: 30%; width: 8px; height: 8px;">
  <svg viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" stroke="rgba(180,60,50,0.15)" stroke-width="1" fill="none"/></svg>
</div>

<!-- Wake trail -->
<div class="wake" style="inset: 0;">
  <svg viewBox="0 0 100 100" preserveAspectRatio="none">
    <path d="M12 62 Q22 52, 34 44 T50 38 T66 32 T78 28 T90 22"
      fill="none" stroke="rgba(0,0,0,0.04)" stroke-width="0.3" stroke-dasharray="2,3"/>
  </svg>
</div>
```

- [ ] **Step 4: Create the WidgetChart component**

Assembles chart area with all sub-components, center content (headline, CTA buttons), and location readout.

```astro
---
import Compass from '../chart/Compass.astro';
import BoatMarker from '../chart/BoatMarker.astro';
import ChartDetails from '../chart/ChartDetails.astro';
---
<div class="widget widget-hero">
  <div class="chart-canvas">
    <div class="chart-grid-lines"></div>

    <ChartDetails />
    <BoatMarker />
    <Compass />

    <div class="chart-center-content">
      <div class="chart-headline">
        Open-source tools<br /><em>for catamaran sailors</em>
      </div>
      <div class="chart-desc">
        Solar planning, passage weather, energy management — all the instruments your cat deserves. Built by sailors, free forever.
      </div>
      <div>
        <a href="/tools/solar" class="chart-btn">Join the crew</a>
        <a href="/tools/solar" class="chart-btn chart-btn-secondary">Explore tools</a>
      </div>
    </div>

    <div class="chart-location">
      50°09.234'N &nbsp; 005°04.112'W
    </div>
  </div>
</div>
```

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/components/landing/widgets/WidgetChart.astro packages/web/src/components/landing/chart/
git commit -m "feat: add chart hero widget with boat animation and chart details"
```

### Task 7: Create WidgetWeather, WidgetPassage, and WidgetLog

**Files:**
- Create: `packages/web/src/components/landing/widgets/WidgetWeather.astro`
- Create: `packages/web/src/components/landing/widgets/WidgetPassage.astro`
- Create: `packages/web/src/components/landing/widgets/WidgetLog.astro`

- [ ] **Step 1: Create WidgetWeather**

Port the Weather widget HTML from the wireframe. Includes temperature, conditions, wind dial with arrow, 4-day forecast row, and description. All paper-on-ink styling.

- [ ] **Step 2: Create WidgetPassage**

Port the Passage widget. Includes route visual (green dot → line → red dot), place names (Falmouth → Roscoff), stats grid (distance, duration, heading, avg speed), and description.

- [ ] **Step 3: Create WidgetLog**

Port the Ship's Log widget. Three log entries with tag, title, and date. Tags are all the same muted color (no inline color overrides).

- [ ] **Step 4: Commit**

```bash
git add packages/web/src/components/landing/widgets/WidgetWeather.astro packages/web/src/components/landing/widgets/WidgetPassage.astro packages/web/src/components/landing/widgets/WidgetLog.astro
git commit -m "feat: add weather, passage, and log widgets"
```

---

## Chunk 3: Screens and Page Assembly

### Task 8: Create the ScreenHome component

**Files:**
- Create: `packages/web/src/components/landing/ScreenHome.astro`

- [ ] **Step 1: Write the component**

Assembles all widgets into the MFD grid layout.

```astro
---
import WidgetSolar from './widgets/WidgetSolar.astro';
import WidgetChart from './widgets/WidgetChart.astro';
import WidgetWeather from './widgets/WidgetWeather.astro';
import WidgetPassage from './widgets/WidgetPassage.astro';
import WidgetLog from './widgets/WidgetLog.astro';
---
<div class="screen active" id="screen-home">
  <div class="home-grid">
    <WidgetSolar />
    <WidgetChart />
    <WidgetWeather />
    <WidgetPassage />
    <WidgetLog />
  </div>
</div>
```

Grid order matters: CSS uses `grid-column: 2; grid-row: 1 / 3` on `.widget-hero` to place the chart in the center spanning both rows. Solar and Weather sit in the left column, Passage and Log in the right column.

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/components/landing/ScreenHome.astro
git commit -m "feat: add home screen MFD grid layout"
```

### Task 9: Create the ScreenSolar component

**Files:**
- Create: `packages/web/src/components/landing/ScreenSolar.astro`

- [ ] **Step 1: Write the component**

Port the Solar schematic screen from the wireframe. Includes:
- Header with title and back button
- Main area with catamaran cross-section SVG (hull outline, cabin, solar panels in green, battery bank in blue, load points in red, energy flow dashed lines)
- Energy node annotations (Solar 342W, Battery 87%, Loads 198W)
- Sidebar with three cards: Power Balance (progress bar + stats), Battery (state of charge, voltage, capacity, time to full), Today (generated, consumed, peak, sunrise/sunset)

All in the paper e-ink aesthetic (dark text on `#f4f1eb` background).

The "← Home" back button calls the global `showScreen()` function exposed by NavBar:

```html
<button class="back-btn" onclick="window.showScreen('home')">← Home</button>
```

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/components/landing/ScreenSolar.astro
git commit -m "feat: add solar schematic screen with energy system diagram"
```

### Task 10: Assemble the landing page

**Files:**
- Modify: `packages/web/src/pages/index.astro` (complete rewrite)

- [ ] **Step 1: Write the failing test**

Add to `packages/web/src/test/landing/landing.test.ts`:

```typescript
describe('Landing page structure', () => {
  it('index.astro imports landing.css', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('src/pages/index.astro', 'utf-8');
    expect(content).toContain('landing.css');
  });

  it('index.astro imports LandingLayout (not BaseLayout)', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('src/pages/index.astro', 'utf-8');
    expect(content).toContain('LandingLayout');
    expect(content).not.toContain('BaseLayout');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/web && npx vitest run src/test/landing/landing.test.ts`
Expected: FAIL — index.astro doesn't contain those imports yet

- [ ] **Step 3: Rewrite index.astro**

```astro
---
import LandingLayout from '../layouts/LandingLayout.astro';
import JsonLd from '../components/seo/JsonLd.astro';
import DeviceFrame from '../components/landing/DeviceFrame.astro';
import TopBar from '../components/landing/TopBar.astro';
import ScreenHome from '../components/landing/ScreenHome.astro';
import ScreenSolar from '../components/landing/ScreenSolar.astro';
import { NavBar } from '../components/landing/NavBar';
import '../components/landing/landing.css';

const siteUrl = 'https://abovedeck.io';
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Above Deck',
  url: siteUrl,
  description: 'Open-source tools for catamaran sailors',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/knowledge?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};
---
<LandingLayout title="Above Deck — Open-Source Tools for Catamaran Sailors">
  <JsonLd schema={websiteSchema} />
  <DeviceFrame>
    <TopBar />
    <ScreenHome />
    <ScreenSolar />
    <NavBar client:load />
  </DeviceFrame>
</LandingLayout>
```

**Important notes:**
- `NavBar` uses `client:load` — it's the only interactive island on the page
- Uses `LandingLayout` (NOT `BaseLayout`) to avoid Mantine `AppShellWrapper`/`Shell` wrapping
- CSS is imported as a side-effect import (Astro/Vite will bundle it)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/web && npx vitest run src/test/landing/landing.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/pages/index.astro
git commit -m "feat: replace landing page with chartplotter MFD interface"
```

---

## Chunk 4: BaseLayout Integration and Build Verification

### Task 11: Create LandingLayout.astro

**Files:**
- Create: `packages/web/src/layouts/LandingLayout.astro`
- Reference: `packages/web/src/layouts/BaseLayout.astro` (copy `<head>` contents from here)

- [ ] **Step 1: Create the layout**

Create a minimal layout that duplicates the `<head>` from `BaseLayout` (fonts, meta tags, PWA tags) but does NOT wrap the slot in `AppShellWrapper`/`Shell`. This avoids the Mantine AppShell header (60px) and padding that would break the full-viewport chartplotter layout.

```astro
---
interface Props {
  title: string;
}
const { title } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <title>{title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

**Key differences from BaseLayout:**
- No `AppShellWrapper` / `Shell` wrapper — slot renders directly in `<body>`
- Includes `viewport-fit=cover` for PWA safe area insets
- Same Google Fonts and PWA meta tags as BaseLayout
- Copy any additional `<head>` content from BaseLayout (favicon, manifest link, etc.)

- [ ] **Step 2: Commit**

```bash
git add packages/web/src/layouts/LandingLayout.astro
git commit -m "feat: add LandingLayout for shell-free landing page"
```

### Task 12: Build verification

- [ ] **Step 1: Run the dev server and verify visually**

Run: `cd packages/web && pnpm dev`

Open `http://localhost:4321` and verify:
1. Brushed titanium device frame visible on all edges
2. Paper widgets render with dark ink text
3. Boat animation moves across the chart
4. Chart details (soundings, contours, nav marks) visible
5. Compass rose in top-right of chart
6. Bottom nav buttons are round and backlit
7. Clicking Solar widget or Solar nav button shows the schematic screen
8. Back button on schematic returns to home
9. Home nav button has pulsing glow

- [ ] **Step 2: Check responsive breakpoints**

Resize browser to test:
- 1024px: Grid collapses to 2 columns, chart spans full width
- 640px: Single column, all widgets stack
- Nav buttons remain visible and usable at all sizes

- [ ] **Step 3: Run the build**

Run: `cd packages/web && pnpm build`
Expected: Build completes without errors

- [ ] **Step 4: Run existing tests to check for regressions**

Run: `cd packages/web && npx vitest run`
Expected: All tests pass (new landing tests + existing solar/hook tests)

- [ ] **Step 5: Commit any fixes needed**

```bash
git add -A
git commit -m "fix: landing page build and test adjustments"
```

---

## Notes for implementer

- **Reference wireframe**: The complete HTML/CSS is in `.superpowers/brainstorm/7871-1773344405/landing-chartplotter-v2.html`. When in doubt, copy directly from the wireframe.
- **No Mantine on landing page**: The landing page uses its own CSS, not Mantine components. This is intentional — the chartplotter aesthetic is unique to the landing page.
- **`client:only="react"` vs `client:load`**: NavBar uses `useEffect` for DOM manipulation (browser-only), but `useEffect` doesn't run during SSR so `client:load` is fine. If hydration issues arise, switch to `client:only="react"` (see `tasks/lessons.md`).
- **CSS import in Astro**: `import '../components/landing/landing.css'` in the frontmatter is the correct way to include CSS in Astro pages — Vite handles bundling.
- **Screen switching**: NavBar manipulates DOM classes directly (`screen.active`) rather than re-rendering. This avoids hydration issues with server-rendered Astro content.
- **Git workflow**: Create a feature branch (`feat/chartplotter-landing`) before starting. Never commit to main.
