# Solar Tools & Community Platform — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build and ship the unified Energy Planner, blog, knowledge base, community discussions, product database, and Google auth as one complete experience.

**Architecture:** Astro + React islands frontend with Mantine v7. Supabase for auth (Google), database (PostgreSQL), and real-time. No Go API for this phase — Supabase handles everything. Docker Compose for local dev. PVGIS API for solar irradiance data.

**Tech Stack:** Astro 5, React 19, Mantine v7, Tabler Icons, Zustand, React Query (TanStack Query), Recharts, Supabase JS, astro-embed, @astrojs/rss, Pagefind, Vitest, Playwright, Docker Compose, pnpm

---

## Task 1: Project Scaffold & Docker

**Files:**
- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml`
- Create: `packages/web/package.json`
- Create: `packages/web/astro.config.mjs`
- Create: `packages/web/tsconfig.json`
- Create: `packages/web/src/pages/index.astro`
- Create: `packages/web/src/layouts/BaseLayout.astro`
- Create: `docker-compose.yml`
- Create: `Dockerfile.web`
- Create: `.env.example`
- Create: `.gitignore` updates

**Step 1: Initialise pnpm workspace**

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

**Step 2: Create Astro project**

Run: `cd packages && pnpm create astro@latest web -- --template minimal --typescript strict --install`

**Step 3: Install core dependencies**

Run:
```bash
cd packages/web
pnpm add @astrojs/react @mantine/core @mantine/hooks @tabler/icons-react react react-dom
pnpm add @tanstack/react-query zustand recharts
pnpm add @supabase/supabase-js
pnpm add astro-embed @astrojs/rss @astrojs/sitemap astro-pagefind
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom playwright @playwright/test
```

**Step 4: Configure Astro**

```typescript
// packages/web/astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://abovedeck.io', // placeholder
  output: 'hybrid',
  integrations: [react(), sitemap()],
  vite: {
    ssr: {
      noExternal: ['@mantine/core', '@mantine/hooks'],
    },
  },
});
```

**Step 5: Create Docker Compose**

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile.web
    ports:
      - '4321:4321'
    volumes:
      - ./packages/web:/app
      - /app/node_modules
    environment:
      - PUBLIC_SUPABASE_URL=http://localhost:54321
      - PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    depends_on:
      - supabase-db

  supabase-db:
    image: supabase/postgres:15.1.1.78
    ports:
      - '54322:5432'
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    volumes:
      - supabase-db-data:/var/lib/postgresql/data
      - ./supabase/seed.sql:/docker-entrypoint-initdb.d/seed.sql

volumes:
  supabase-db-data:
```

**Step 6: Create Dockerfile.web**

```dockerfile
FROM node:20-slim
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY packages/web/package.json .
RUN pnpm install
COPY packages/web .
EXPOSE 4321
CMD ["pnpm", "dev", "--host", "0.0.0.0"]
```

**Step 7: Create .env.example**

```
PUBLIC_SUPABASE_URL=http://localhost:54321
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Step 8: Create BaseLayout with Mantine and Google Fonts**

```astro
---
// packages/web/src/layouts/BaseLayout.astro
interface Props {
  title: string;
  description?: string;
}
const { title, description = 'The sailing platform for modern cruisers' } = Astro.props;
---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content={description} />
  <title>{title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
</head>
<body>
  <slot />
</body>
</html>
```

**Step 9: Create landing page placeholder**

```astro
---
// packages/web/src/pages/index.astro
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Above Deck — The Sailing Platform for Modern Cruisers">
  <main>
    <h1>Above Deck</h1>
    <p>Coming soon.</p>
  </main>
</BaseLayout>
```

**Step 10: Verify it runs**

Run: `cd packages/web && pnpm dev`
Expected: Site loads at http://localhost:4321 with "Above Deck — Coming soon."

Run: `docker compose up --build`
Expected: Same result via Docker at http://localhost:4321

**Step 11: Commit**

```bash
git add .
git commit -m "feat: scaffold Astro project with Mantine, Docker Compose, and pnpm workspace"
```

---

## Task 2: Mantine Theme & Design System

**Files:**
- Create: `packages/web/src/theme/theme.ts`
- Create: `packages/web/src/theme/colors.ts`
- Create: `packages/web/src/components/MantineProvider.tsx`
- Create: `packages/web/src/components/Shell.tsx`
- Modify: `packages/web/src/layouts/BaseLayout.astro`
- Test: `packages/web/src/theme/__tests__/theme.test.ts`

**Step 1: Write test for theme**

```typescript
// packages/web/src/theme/__tests__/theme.test.ts
import { describe, it, expect } from 'vitest';
import { theme } from '../theme';
import { COLORS } from '../colors';

describe('theme', () => {
  it('has dark mode as default color scheme', () => {
    expect(theme.other?.defaultColorScheme).toBe('dark');
  });

  it('defines brand color palette', () => {
    expect(COLORS.background.dark).toBe('#1a1a2e');
    expect(COLORS.surface.dark).toBe('#16213e');
    expect(COLORS.accent.positive).toBe('#4ade80');
    expect(COLORS.accent.warning).toBe('#f87171');
    expect(COLORS.accent.neutral).toBe('#60a5fa');
  });

  it('uses Space Mono for headings', () => {
    expect(theme.headings?.fontFamily).toContain('Space Mono');
  });

  it('uses Inter for body text', () => {
    expect(theme.fontFamily).toContain('Inter');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/web && npx vitest run src/theme/__tests__/theme.test.ts`
Expected: FAIL — modules not found

**Step 3: Implement colours and theme**

```typescript
// packages/web/src/theme/colors.ts
export const COLORS = {
  background: {
    dark: '#1a1a2e',
    light: '#f5f5f0',
  },
  surface: {
    dark: '#16213e',
    light: '#ffffff',
  },
  text: {
    primary: { dark: '#e0e0e0', light: '#2d2d3a' },
    secondary: { dark: '#8b8b9e', light: '#6b6b7e' },
  },
  accent: {
    positive: '#4ade80',
    warning: '#f87171',
    neutral: '#60a5fa',
  },
  grid: '#2d2d4a',
} as const;
```

```typescript
// packages/web/src/theme/theme.ts
import { createTheme, MantineColorsTuple } from '@mantine/core';
import { COLORS } from './colors';

const ocean: MantineColorsTuple = [
  '#e7f5ff', '#d0ebff', '#a5d8ff', '#74c0fc',
  '#4dabf7', '#339af0', '#228be6', '#1c7ed6',
  '#1971c2', '#1864ab',
];

export const theme = createTheme({
  primaryColor: 'ocean',
  colors: { ocean },
  fontFamily: '"Inter", system-ui, sans-serif',
  fontFamilyMonospace: '"Fira Code", monospace',
  headings: {
    fontFamily: '"Space Mono", monospace',
    fontWeight: '700',
  },
  defaultRadius: 'md',
  other: {
    defaultColorScheme: 'dark',
  },
  components: {
    Card: {
      defaultProps: { radius: 'md', withBorder: true },
    },
    Button: {
      defaultProps: { radius: 'md' },
    },
  },
});
```

**Step 4: Create MantineProvider wrapper**

```tsx
// packages/web/src/components/MantineProvider.tsx
import { MantineProvider as BaseMantineProvider, ColorSchemeScript } from '@mantine/core';
import '@mantine/core/styles.css';
import { theme } from '../theme/theme';

export function MantineProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseMantineProvider theme={theme} defaultColorScheme="dark">
      {children}
    </BaseMantineProvider>
  );
}

export { ColorSchemeScript };
```

**Step 5: Create Shell component (nav + layout)**

```tsx
// packages/web/src/components/Shell.tsx
import { AppShell, Group, Text, ActionIcon, Anchor } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { useMantineColorScheme } from '@mantine/core';

const NAV_LINKS = [
  { label: 'Tools', href: '/tools/solar' },
  { label: 'Knowledge', href: '/knowledge' },
  { label: 'Blog', href: '/blog' },
  { label: 'Community', href: '/community' },
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Text fw={700} size="lg" ff="'Space Mono', monospace">
            Above Deck
          </Text>
          <Group gap="lg">
            {NAV_LINKS.map((link) => (
              <Anchor key={link.href} href={link.href} c="dimmed" underline="never">
                {link.label}
              </Anchor>
            ))}
            <ActionIcon
              variant="subtle"
              onClick={toggleColorScheme}
              aria-label="Toggle colour scheme"
            >
              {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
```

**Step 6: Update BaseLayout to use MantineProvider**

Integrate `ColorSchemeScript` in head and `MantineProvider` wrapping the slot.

**Step 7: Run tests**

Run: `cd packages/web && npx vitest run src/theme/__tests__/theme.test.ts`
Expected: PASS

**Step 8: Commit**

```bash
git add .
git commit -m "feat: add Mantine theme with dark mode, Space Mono headings, brand colours"
```

---

## Task 3: Supabase Schema & Seed Data

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `supabase/seed.sql`
- Test: Manual verification via psql or Supabase Studio

**Step 1: Create initial schema migration**

```sql
-- supabase/migrations/001_initial_schema.sql

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Power consumer catalog
CREATE TABLE power_consumers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'navigation', 'communication', 'refrigeration', 'lighting',
    'water-systems', 'comfort-galley', 'charging', 'sailing-safety'
  )),
  icon TEXT, -- tabler icon name
  watts_typical NUMERIC NOT NULL,
  watts_min NUMERIC,
  watts_max NUMERIC,
  amps_12v NUMERIC GENERATED ALWAYS AS (watts_typical / 12.0) STORED,
  amps_24v NUMERIC GENERATED ALWAYS AS (watts_typical / 24.0) STORED,
  hours_per_day_anchor NUMERIC NOT NULL DEFAULT 0,
  hours_per_day_passage NUMERIC NOT NULL DEFAULT 0,
  duty_cycle NUMERIC DEFAULT 1.0, -- 0.0-1.0, e.g. fridge cycles at 0.4
  usage_type TEXT NOT NULL DEFAULT 'intermittent' CHECK (usage_type IN ('always-on', 'scheduled', 'intermittent')),
  crew_scaling BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Product spec database
CREATE TABLE product_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_type TEXT NOT NULL CHECK (component_type IN (
    'mppt-controller', 'solar-panel', 'battery-lifepo4', 'battery-agm',
    'inverter-charger', 'battery-monitor', 'alternator-regulator'
  )),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  specs JSONB NOT NULL DEFAULT '{}', -- flexible key-value specs
  source_url TEXT, -- where specs came from
  verified_at TIMESTAMPTZ,
  compatible_voltages INTEGER[] DEFAULT '{12}', -- e.g. {12, 24}
  weight_kg NUMERIC,
  price_range_low NUMERIC,
  price_range_high NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(make, model)
);

-- Product requests from users
CREATE TABLE product_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  product_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'researching', 'added', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Boat model templates
CREATE TABLE boat_model_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year_range TEXT, -- e.g. "2018-2024"
  boat_type TEXT NOT NULL CHECK (boat_type IN ('monohull', 'catamaran', 'trimaran', 'power')),
  length_ft NUMERIC NOT NULL,
  default_crew INTEGER DEFAULT 2,
  factory_solar_watts NUMERIC DEFAULT 0,
  factory_battery_ah NUMERIC,
  factory_battery_chemistry TEXT DEFAULT 'agm',
  system_voltage INTEGER DEFAULT 12,
  engine_make TEXT,
  engine_model TEXT,
  engine_alternator_amps NUMERIC,
  default_appliance_ids UUID[], -- references power_consumers
  specs JSONB DEFAULT '{}', -- additional factory specs
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(make, model, year_range)
);

-- Saved calculator configurations
CREATE TABLE saved_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB NOT NULL, -- full calculator state
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Discussion threads
CREATE TABLE discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'electrical', 'engine-mechanical', 'plumbing-water', 'safety-emergency',
    'provisioning-living', 'destinations-cruising', 'general',
    'introductions', 'feature-requests'
  )),
  reply_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Discussion replies
CREATE TABLE replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reply count trigger
CREATE OR REPLACE FUNCTION update_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE discussions SET reply_count = reply_count + 1, updated_at = now()
    WHERE id = NEW.discussion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE discussions SET reply_count = reply_count - 1, updated_at = now()
    WHERE id = OLD.discussion_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reply_count
AFTER INSERT OR DELETE ON replies
FOR EACH ROW EXECUTE FUNCTION update_reply_count();

-- Newsletter subscribers
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id),
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

-- Profile auto-creation trigger on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_consumers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE boat_model_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Public read for catalog tables
CREATE POLICY "Public read power_consumers" ON power_consumers FOR SELECT USING (true);
CREATE POLICY "Public read product_specs" ON product_specs FOR SELECT USING (true);
CREATE POLICY "Public read boat_model_templates" ON boat_model_templates FOR SELECT USING (true);

-- Authenticated users can request products
CREATE POLICY "Auth users create product_requests" ON product_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own product_requests" ON product_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Saved configurations: owner only
CREATE POLICY "Users manage own configurations" ON saved_configurations
  FOR ALL USING (auth.uid() = user_id);

-- Discussions: public read, auth write
CREATE POLICY "Public read discussions" ON discussions
  FOR SELECT USING (NOT is_hidden);
CREATE POLICY "Auth users create discussions" ON discussions
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Replies: public read, auth write
CREATE POLICY "Public read replies" ON replies
  FOR SELECT USING (NOT is_hidden);
CREATE POLICY "Auth users create replies" ON replies
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Profiles: public read, self update
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Newsletter: auth insert
CREATE POLICY "Auth users subscribe" ON newsletter_subscribers
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
```

**Step 2: Create seed data**

```sql
-- supabase/seed.sql

-- Power consumers: Navigation
INSERT INTO power_consumers (name, category, icon, watts_typical, watts_min, watts_max, hours_per_day_anchor, hours_per_day_passage, duty_cycle, usage_type, crew_scaling, sort_order) VALUES
('Chartplotter (7")', 'navigation', 'IconDeviceDesktop', 20, 15, 25, 2, 16, 1.0, 'scheduled', false, 1),
('Chartplotter (9-12")', 'navigation', 'IconDeviceDesktop', 32, 25, 40, 2, 16, 1.0, 'scheduled', false, 2),
('Autopilot (tiller)', 'navigation', 'IconCompass', 17, 10, 24, 0, 20, 1.0, 'scheduled', false, 3),
('Autopilot (wheel)', 'navigation', 'IconCompass', 42, 24, 60, 0, 20, 1.0, 'scheduled', false, 4),
('Radar', 'navigation', 'IconRadar', 32, 20, 45, 0, 8, 1.0, 'intermittent', false, 5),
('AIS transponder', 'navigation', 'IconBroadcast', 3.5, 2, 5, 24, 24, 1.0, 'always-on', false, 6),
('Instruments (depth/speed/wind)', 'navigation', 'IconGauge', 3.5, 2, 5, 0, 16, 1.0, 'scheduled', false, 7),
('GPS (standalone)', 'navigation', 'IconMapPin', 2, 1, 3, 0, 24, 1.0, 'always-on', false, 8);

-- Power consumers: Communication
INSERT INTO power_consumers (name, category, icon, watts_typical, watts_min, watts_max, hours_per_day_anchor, hours_per_day_passage, duty_cycle, usage_type, crew_scaling, sort_order) VALUES
('VHF radio (receive)', 'communication', 'IconAntenna', 4.5, 3, 6, 8, 16, 1.0, 'scheduled', false, 1),
('SSB/HF radio (receive)', 'communication', 'IconAntenna', 30, 24, 36, 1, 2, 1.0, 'scheduled', false, 2),
('Starlink', 'communication', 'IconSatellite', 75, 50, 100, 12, 8, 1.0, 'scheduled', false, 3),
('Satellite phone', 'communication', 'IconPhone', 10, 5, 15, 0.25, 0.5, 1.0, 'intermittent', false, 4),
('WiFi booster', 'communication', 'IconWifi', 8.5, 5, 12, 8, 2, 1.0, 'scheduled', false, 5);

-- Power consumers: Refrigeration
INSERT INTO power_consumers (name, category, icon, watts_typical, watts_min, watts_max, hours_per_day_anchor, hours_per_day_passage, duty_cycle, usage_type, crew_scaling, sort_order) VALUES
('Small fridge (top-loading)', 'refrigeration', 'IconFridge', 37, 30, 45, 24, 24, 0.4, 'always-on', false, 1),
('Large fridge (front-opening)', 'refrigeration', 'IconFridge', 65, 50, 80, 24, 24, 0.5, 'always-on', false, 2),
('Freezer (dedicated)', 'refrigeration', 'IconSnowflake', 55, 40, 70, 24, 24, 0.4, 'always-on', false, 3),
('Fridge/freezer combo (efficient)', 'refrigeration', 'IconFridge', 45, 35, 55, 24, 24, 0.35, 'always-on', false, 4);

-- Power consumers: Lighting
INSERT INTO power_consumers (name, category, icon, watts_typical, watts_min, watts_max, hours_per_day_anchor, hours_per_day_passage, duty_cycle, usage_type, crew_scaling, sort_order) VALUES
('LED cabin lights (all)', 'lighting', 'IconBulb', 12, 6, 18, 6, 4, 1.0, 'scheduled', false, 1),
('LED anchor light', 'lighting', 'IconLamp', 2.5, 2, 3, 11, 0, 1.0, 'always-on', false, 2),
('LED navigation lights (tricolor)', 'lighting', 'IconLamp', 10, 6, 15, 0, 11, 1.0, 'always-on', false, 3),
('Cockpit/deck light', 'lighting', 'IconLamp', 6, 3, 10, 2, 1, 1.0, 'intermittent', false, 4),
('Reading light', 'lighting', 'IconLamp', 2, 1, 3, 3, 2, 1.0, 'intermittent', false, 5);

-- Power consumers: Water Systems
INSERT INTO power_consumers (name, category, icon, watts_typical, watts_min, watts_max, hours_per_day_anchor, hours_per_day_passage, duty_cycle, usage_type, crew_scaling, sort_order) VALUES
('Freshwater pump', 'water-systems', 'IconDroplet', 48, 36, 60, 0.5, 0.25, 1.0, 'intermittent', true, 1),
('Watermaker (small, 12V)', 'water-systems', 'IconDroplet', 120, 60, 180, 3, 2, 1.0, 'scheduled', false, 2),
('Watermaker (large)', 'water-systems', 'IconDroplet', 270, 180, 360, 3, 2, 1.0, 'scheduled', false, 3),
('Bilge pump (auto)', 'water-systems', 'IconDroplet', 42, 24, 60, 0.1, 0.1, 1.0, 'intermittent', false, 4),
('Electric toilet', 'water-systems', 'IconDroplet', 22, 15, 30, 0.15, 0.1, 1.0, 'intermittent', true, 5);

-- Power consumers: Comfort / Galley
INSERT INTO power_consumers (name, category, icon, watts_typical, watts_min, watts_max, hours_per_day_anchor, hours_per_day_passage, duty_cycle, usage_type, crew_scaling, sort_order) VALUES
('Cabin fan (12V)', 'comfort-galley', 'IconWind', 12, 6, 18, 12, 8, 1.0, 'scheduled', false, 1),
('Microwave (via inverter)', 'comfort-galley', 'IconMicrowave', 1000, 800, 1200, 0.15, 0.1, 1.0, 'intermittent', true, 2),
('Coffee maker (via inverter)', 'comfort-galley', 'IconCoffee', 800, 600, 1000, 0.15, 0.15, 1.0, 'intermittent', false, 3),
('Electric kettle (via inverter)', 'comfort-galley', 'IconCoffee', 1250, 1000, 1500, 0.1, 0.1, 1.0, 'intermittent', false, 4),
('Stereo/music system', 'comfort-galley', 'IconMusic', 30, 12, 48, 4, 2, 1.0, 'intermittent', false, 5),
('TV/display (small, 12V)', 'comfort-galley', 'IconDeviceTv', 35, 20, 50, 2, 0, 1.0, 'intermittent', false, 6),
('Washer/dryer (via inverter)', 'comfort-galley', 'IconWashMachine', 1000, 500, 1500, 0.5, 0, 0.6, 'intermittent', true, 7);

-- Power consumers: Charging
INSERT INTO power_consumers (name, category, icon, watts_typical, watts_min, watts_max, hours_per_day_anchor, hours_per_day_passage, duty_cycle, usage_type, crew_scaling, sort_order) VALUES
('Laptop charging', 'charging', 'IconDeviceLaptop', 55, 45, 65, 3, 2, 1.0, 'scheduled', true, 1),
('Phone/tablet charging (x2)', 'charging', 'IconDeviceMobile', 15, 10, 20, 4, 3, 1.0, 'scheduled', true, 2),
('Camera/drone charging', 'charging', 'IconCamera', 22, 15, 30, 1, 0.5, 1.0, 'intermittent', false, 3),
('Inverter standby draw', 'charging', 'IconPlug', 20, 10, 30, 24, 24, 1.0, 'always-on', false, 4);

-- Power consumers: Sailing / Safety
INSERT INTO power_consumers (name, category, icon, watts_typical, watts_min, watts_max, hours_per_day_anchor, hours_per_day_passage, duty_cycle, usage_type, crew_scaling, sort_order) VALUES
('Electric windlass', 'sailing-safety', 'IconAnchor', 1000, 600, 1500, 0.05, 0, 1.0, 'intermittent', false, 1),
('Bow thruster', 'sailing-safety', 'IconArrowsLeftRight', 2000, 1200, 3000, 0.02, 0, 1.0, 'intermittent', false, 2),
('Smoke/CO detector', 'sailing-safety', 'IconAlarm', 0.75, 0.5, 1, 24, 24, 1.0, 'always-on', false, 3);

-- Product specs: MPPT Controllers
INSERT INTO product_specs (component_type, make, model, specs, source_url, compatible_voltages, price_range_low, price_range_high) VALUES
('mppt-controller', 'Victron', 'SmartSolar MPPT 75/15', '{"max_pv_voltage": 75, "max_charge_current": 15, "max_pv_power_12v": 200, "max_pv_power_24v": 400, "bluetooth": true, "ve_direct": true}', 'https://www.victronenergy.com/solar-charge-controllers/smartsolar-75-10-75-15-100-15-100-20', '{12,24}', 100, 140),
('mppt-controller', 'Victron', 'SmartSolar MPPT 100/30', '{"max_pv_voltage": 100, "max_charge_current": 30, "max_pv_power_12v": 440, "max_pv_power_24v": 880, "bluetooth": true, "ve_direct": true}', 'https://www.victronenergy.com/solar-charge-controllers/smartsolar-100-30', '{12,24}', 170, 220),
('mppt-controller', 'Victron', 'SmartSolar MPPT 100/50', '{"max_pv_voltage": 100, "max_charge_current": 50, "max_pv_power_12v": 700, "max_pv_power_24v": 1400, "bluetooth": true, "ve_direct": true}', 'https://www.victronenergy.com/solar-charge-controllers/smartsolar-100-30-100-50', '{12,24}', 250, 320),
('mppt-controller', 'Victron', 'SmartSolar MPPT 150/35', '{"max_pv_voltage": 150, "max_charge_current": 35, "max_pv_power_12v": 500, "max_pv_power_24v": 1000, "bluetooth": true, "ve_direct": true}', 'https://www.victronenergy.com/solar-charge-controllers/smartsolar-150-35', '{12,24,48}', 220, 280),
('mppt-controller', 'Renogy', 'Rover 20A MPPT', '{"max_pv_voltage": 100, "max_charge_current": 20, "max_pv_power_12v": 260, "max_pv_power_24v": 520, "bluetooth": false}', 'https://www.renogy.com/rover-20-amp-mppt-solar-charge-controller/', '{12,24}', 80, 110),
('mppt-controller', 'Renogy', 'Rover 40A MPPT', '{"max_pv_voltage": 100, "max_charge_current": 40, "max_pv_power_12v": 520, "max_pv_power_24v": 1040, "bluetooth": false}', 'https://www.renogy.com/rover-40-amp-mppt-solar-charge-controller/', '{12,24}', 130, 170);

-- Product specs: Batteries (LiFePO4)
INSERT INTO product_specs (component_type, make, model, specs, source_url, compatible_voltages, weight_kg, price_range_low, price_range_high) VALUES
('battery-lifepo4', 'Battle Born', 'BB10012 100Ah', '{"capacity_ah": 100, "voltage": 12.8, "energy_wh": 1280, "max_continuous_discharge_a": 100, "cycles_80dod": 3000, "bms": "built-in", "weight_kg": 13}', 'https://battlebornbatteries.com/product/12v-100ah-lifepo4-deep-cycle-battery/', '{12}', 13, 800, 950),
('battery-lifepo4', 'Victron', 'Smart LiFePO4 12.8V/200Ah', '{"capacity_ah": 200, "voltage": 12.8, "energy_wh": 2560, "max_continuous_discharge_a": 200, "cycles_80dod": 2500, "bms": "built-in", "bluetooth": true, "weight_kg": 28}', 'https://www.victronenergy.com/batteries/lithium-battery-12-8v-smart', '{12}', 28, 1800, 2200),
('battery-lifepo4', 'Renogy', '12V 100Ah Smart LiFePO4', '{"capacity_ah": 100, "voltage": 12.8, "energy_wh": 1280, "max_continuous_discharge_a": 100, "cycles_80dod": 4000, "bms": "built-in", "bluetooth": true, "weight_kg": 11.8}', 'https://www.renogy.com/12v-100ah-smart-lithium-iron-phosphate-battery/', '{12}', 11.8, 500, 650);

-- Product specs: Batteries (AGM)
INSERT INTO product_specs (component_type, make, model, specs, source_url, compatible_voltages, weight_kg, price_range_low, price_range_high) VALUES
('battery-agm', 'Victron', 'AGM Deep Cycle 12V/220Ah', '{"capacity_ah": 220, "voltage": 12, "energy_wh": 2640, "cycles_50dod": 500, "weight_kg": 65}', 'https://www.victronenergy.com/batteries/agm-deep-cycle', '{12}', 65, 400, 500),
('battery-agm', 'Lifeline', 'GPL-4CT 6V/220Ah', '{"capacity_ah": 220, "voltage": 6, "energy_wh": 1320, "cycles_50dod": 750, "weight_kg": 30, "note": "Use two in series for 12V"}', 'https://www.lifelinebatteries.com/marine-batteries/', '{6}', 30, 350, 450);

-- Product specs: Inverter/Chargers
INSERT INTO product_specs (component_type, make, model, specs, source_url, compatible_voltages, weight_kg, price_range_low, price_range_high) VALUES
('inverter-charger', 'Victron', 'MultiPlus 12/500/20', '{"continuous_watts": 500, "peak_watts": 1000, "charge_current_a": 20, "ac_output": "230V", "transfer_switch": true}', 'https://www.victronenergy.com/inverters-chargers/multiplus', '{12}', 10, 500, 650),
('inverter-charger', 'Victron', 'MultiPlus 12/2000/80', '{"continuous_watts": 2000, "peak_watts": 4000, "charge_current_a": 80, "ac_output": "230V", "transfer_switch": true}', 'https://www.victronenergy.com/inverters-chargers/multiplus', '{12}', 19, 1100, 1400),
('inverter-charger', 'Victron', 'MultiPlus 24/3000/70', '{"continuous_watts": 3000, "peak_watts": 6000, "charge_current_a": 70, "ac_output": "230V", "transfer_switch": true}', 'https://www.victronenergy.com/inverters-chargers/multiplus', '{24}', 28, 1600, 2000);

-- Product specs: Battery Monitors
INSERT INTO product_specs (component_type, make, model, specs, source_url, compatible_voltages, price_range_low, price_range_high) VALUES
('battery-monitor', 'Victron', 'SmartShunt 500A', '{"max_current_a": 500, "bluetooth": true, "ve_direct": true, "midpoint_monitoring": false}', 'https://www.victronenergy.com/battery-monitors/smart-battery-shunt', '{12,24,48}', 90, 130),
('battery-monitor', 'Victron', 'BMV-712 Smart', '{"max_current_a": 500, "bluetooth": true, "ve_direct": true, "midpoint_monitoring": true, "display": true}', 'https://www.victronenergy.com/battery-monitors/bmv-712-smart', '{12,24,48}', 150, 200);

-- Product specs: Alternator Regulators
INSERT INTO product_specs (component_type, make, model, specs, source_url, compatible_voltages, price_range_low, price_range_high) VALUES
('alternator-regulator', 'Wakespeed', 'WS500', '{"max_field_current_a": 25, "bluetooth": true, "can_bus": true, "lifepo4_compatible": true, "programmable": true}', 'https://wakespeed.com/ws500/', '{12,24,48}', 450, 550),
('alternator-regulator', 'Balmar', 'MC-614', '{"max_field_current_a": 12, "lifepo4_compatible": true, "multi_stage": true}', 'https://www.balmar.net/mc-614/', '{12}', 250, 350);

-- Boat model templates
INSERT INTO boat_model_templates (make, model, year_range, boat_type, length_ft, default_crew, factory_solar_watts, factory_battery_ah, factory_battery_chemistry, system_voltage, engine_make, engine_model, engine_alternator_amps) VALUES
('Lagoon', '40', '2019-2024', 'catamaran', 40, 3, 0, 200, 'agm', 12, 'Yanmar', '3YM30', 80),
('Lagoon', '42', '2019-2024', 'catamaran', 42, 3, 0, 200, 'agm', 12, 'Yanmar', '4JH45', 80),
('Lagoon', '43', '2020-2024', 'catamaran', 43, 3, 0, 200, 'agm', 12, 'Yanmar', '4JH45', 80),
('Lagoon', '46', '2019-2024', 'catamaran', 46, 4, 0, 400, 'agm', 12, 'Yanmar', '4JH57', 80),
('Lagoon', '50', '2018-2024', 'catamaran', 50, 4, 200, 400, 'agm', 12, 'Yanmar', '4JH80', 120),
('Beneteau', 'Oceanis 40.1', '2019-2024', 'monohull', 40, 2, 0, 200, 'agm', 12, 'Yanmar', '3YM30', 80),
('Beneteau', 'Oceanis 46.1', '2019-2024', 'monohull', 46, 3, 0, 200, 'agm', 12, 'Yanmar', '4JH45', 80),
('Jeanneau', 'Sun Odyssey 440', '2019-2024', 'monohull', 44, 2, 0, 200, 'agm', 12, 'Yanmar', '4JH45', 80),
('Jeanneau', 'Sun Odyssey 490', '2019-2024', 'monohull', 49, 3, 0, 200, 'agm', 12, 'Yanmar', '4JH57', 80),
('Fountaine Pajot', 'Elba 45', '2020-2024', 'catamaran', 45, 3, 0, 300, 'agm', 12, 'Yanmar', '4JH45', 80),
('Fountaine Pajot', 'Isla 40', '2019-2024', 'catamaran', 40, 3, 0, 200, 'agm', 12, 'Yanmar', '3YM30', 80),
('Bavaria', 'C42', '2020-2024', 'monohull', 42, 2, 0, 200, 'agm', 12, 'Volvo Penta', 'D2-40', 80);
```

**Step 3: Verify schema loads**

Run: `docker compose up -d supabase-db && sleep 5 && docker exec -it $(docker ps -q -f name=supabase-db) psql -U postgres -c "\dt"`
Expected: All tables listed

**Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase schema with seed data for appliances, products, and boat templates"
```

---

## Task 4: Supabase Client & Auth

**Files:**
- Create: `packages/web/src/lib/supabase.ts`
- Create: `packages/web/src/pages/api/auth/signin.ts`
- Create: `packages/web/src/pages/api/auth/callback.ts`
- Create: `packages/web/src/pages/api/auth/signout.ts`
- Create: `packages/web/src/middleware.ts`
- Create: `packages/web/src/components/AuthButton.tsx`
- Test: `packages/web/src/lib/__tests__/supabase.test.ts`

**Step 1: Write test for Supabase client**

```typescript
// packages/web/src/lib/__tests__/supabase.test.ts
import { describe, it, expect } from 'vitest';

describe('supabase client', () => {
  it('exports createSupabaseClient function', async () => {
    const { createSupabaseClient } = await import('../supabase');
    expect(typeof createSupabaseClient).toBe('function');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/web && npx vitest run src/lib/__tests__/supabase.test.ts`
Expected: FAIL

**Step 3: Implement Supabase client**

```typescript
// packages/web/src/lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function createSupabaseClient(): SupabaseClient {
  return createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        flowType: 'pkce',
      },
    }
  );
}
```

**Step 4: Implement auth endpoints**

```typescript
// packages/web/src/pages/api/auth/signin.ts
import type { APIRoute } from 'astro';
import { createSupabaseClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, redirect }) => {
  const supabase = createSupabaseClient();
  const formData = await request.formData();
  const provider = formData.get('provider')?.toString();

  if (provider !== 'google') {
    return new Response('Only Google sign-in is supported', { status: 400 });
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${new URL(request.url).origin}/api/auth/callback`,
    },
  });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return redirect(data.url);
};
```

```typescript
// packages/web/src/pages/api/auth/callback.ts
import type { APIRoute } from 'astro';
import { createSupabaseClient } from '../../../lib/supabase';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  if (!code) {
    return new Response('No code provided', { status: 400 });
  }

  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  cookies.set('sb-access-token', data.session.access_token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
  cookies.set('sb-refresh-token', data.session.refresh_token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return redirect('/');
};
```

```typescript
// packages/web/src/pages/api/auth/signout.ts
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete('sb-access-token', { path: '/' });
  cookies.delete('sb-refresh-token', { path: '/' });
  return redirect('/');
};
```

**Step 5: Create AuthButton component**

```tsx
// packages/web/src/components/AuthButton.tsx
import { Button, Avatar, Group, Menu, Text } from '@mantine/core';
import { IconBrandGoogle, IconLogout } from '@tabler/icons-react';

interface AuthButtonProps {
  user: { name: string; avatar: string } | null;
}

export function AuthButton({ user }: AuthButtonProps) {
  if (user) {
    return (
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <Avatar src={user.avatar} alt={user.name} radius="xl" size="sm" style={{ cursor: 'pointer' }} />
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>{user.name}</Menu.Label>
          <Menu.Item
            leftSection={<IconLogout size={14} />}
            component="form"
            action="/api/auth/signout"
            method="post"
          >
            Sign out
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
  }

  return (
    <form action="/api/auth/signin" method="post">
      <input type="hidden" name="provider" value="google" />
      <Button type="submit" variant="subtle" leftSection={<IconBrandGoogle size={16} />} size="sm">
        Sign in
      </Button>
    </form>
  );
}
```

**Step 6: Run tests, commit**

Run: `cd packages/web && npx vitest run`
Expected: PASS

```bash
git add .
git commit -m "feat: add Google auth with Supabase PKCE flow"
```

---

## Task 5: Solar Calculation Engine

**Files:**
- Create: `packages/web/src/lib/solar/engine.ts`
- Create: `packages/web/src/lib/solar/types.ts`
- Create: `packages/web/src/lib/solar/pvgis.ts`
- Create: `packages/web/src/lib/solar/sizing.ts`
- Create: `packages/web/src/lib/solar/schematic.ts`
- Test: `packages/web/src/lib/solar/__tests__/engine.test.ts`
- Test: `packages/web/src/lib/solar/__tests__/sizing.test.ts`
- Test: `packages/web/src/lib/solar/__tests__/pvgis.test.ts`

**Step 1: Write types**

```typescript
// packages/web/src/lib/solar/types.ts
export interface Appliance {
  id: string;
  name: string;
  category: string;
  wattsTypical: number;
  wattsMin: number;
  wattsMax: number;
  hoursPerDayAnchor: number;
  hoursPerDayPassage: number;
  dutyCycle: number;
  usageType: 'always-on' | 'scheduled' | 'intermittent';
  crewScaling: boolean;
  enabled: boolean;
}

export interface SystemConfig {
  appliances: Appliance[];
  crewSize: number;
  batteryChemistry: 'agm' | 'lifepo4';
  systemVoltage: 12 | 24 | 48;
  daysAutonomy: number;
  deratingFactor: number; // 0.55-0.80
  alternatorAmps: number;
  motoringHoursPerDay: number;
  hasShorepower: boolean;
  latitude: number;
  longitude: number;
  month: number; // 1-12
}

export interface ConsumptionResult {
  totalWhPerDayAnchor: number;
  totalWhPerDayPassage: number;
  totalAhPerDayAnchor: number;
  totalAhPerDayPassage: number;
  breakdownByCategory: Record<string, { anchor: number; passage: number }>;
}

export interface SolarRecommendation {
  panelWatts: { minimum: number; recommended: number; comfortable: number };
  batteryAh: { minimum: number; recommended: number; comfortable: number };
  batteryCount: number;
  mpptAmps: number;
  mpptMaxVoltage: number;
  inverterWatts: number | null; // null if no AC loads
  alternatorDailyAh: number;
  needsSmartRegulator: boolean;
  batteryMonitor: boolean;
  wireGauge: string;
  dailyGenerationWh: number;
  dailyBalance: number; // positive = surplus
}

export interface PvgisMonthlyData {
  month: number;
  horizontalIrradiance: number; // kWh/m2/day
  optimalIrradiance: number;
  temperature: number;
}

export type JourneyMode = 'new-system' | 'check-existing' | 'add-upgrade';
```

**Step 2: Write failing tests for calculation engine**

```typescript
// packages/web/src/lib/solar/__tests__/engine.test.ts
import { describe, it, expect } from 'vitest';
import { calculateConsumption } from '../engine';
import type { Appliance, SystemConfig } from '../types';

const mockFridge: Appliance = {
  id: '1', name: 'Small fridge', category: 'refrigeration',
  wattsTypical: 37, wattsMin: 30, wattsMax: 45,
  hoursPerDayAnchor: 24, hoursPerDayPassage: 24,
  dutyCycle: 0.4, usageType: 'always-on', crewScaling: false, enabled: true,
};

const mockAutopilot: Appliance = {
  id: '2', name: 'Autopilot', category: 'navigation',
  wattsTypical: 42, wattsMin: 24, wattsMax: 60,
  hoursPerDayAnchor: 0, hoursPerDayPassage: 20,
  dutyCycle: 1.0, usageType: 'scheduled', crewScaling: false, enabled: true,
};

const mockWaterPump: Appliance = {
  id: '3', name: 'Water pump', category: 'water-systems',
  wattsTypical: 48, wattsMin: 36, wattsMax: 60,
  hoursPerDayAnchor: 0.5, hoursPerDayPassage: 0.25,
  dutyCycle: 1.0, usageType: 'intermittent', crewScaling: true, enabled: true,
};

describe('calculateConsumption', () => {
  it('calculates fridge consumption with duty cycle', () => {
    const result = calculateConsumption([mockFridge], 2, 12);
    // 37W * 24h * 0.4 duty = 355.2 Wh
    expect(result.totalWhPerDayAnchor).toBeCloseTo(355.2, 0);
    expect(result.totalWhPerDayPassage).toBeCloseTo(355.2, 0);
  });

  it('calculates passage-only loads correctly', () => {
    const result = calculateConsumption([mockAutopilot], 2, 12);
    expect(result.totalWhPerDayAnchor).toBe(0);
    // 42W * 20h * 1.0 = 840 Wh
    expect(result.totalWhPerDayPassage).toBeCloseTo(840, 0);
  });

  it('scales crew-dependent loads', () => {
    const result2 = calculateConsumption([mockWaterPump], 2, 12);
    const result4 = calculateConsumption([mockWaterPump], 4, 12);
    // 4 crew should use more than 2 crew
    expect(result4.totalWhPerDayAnchor).toBeGreaterThan(result2.totalWhPerDayAnchor);
  });

  it('converts Wh to Ah correctly', () => {
    const result = calculateConsumption([mockFridge], 2, 12);
    expect(result.totalAhPerDayAnchor).toBeCloseTo(355.2 / 12, 0);
  });

  it('groups consumption by category', () => {
    const result = calculateConsumption([mockFridge, mockAutopilot], 2, 12);
    expect(result.breakdownByCategory['refrigeration']).toBeDefined();
    expect(result.breakdownByCategory['navigation']).toBeDefined();
  });

  it('ignores disabled appliances', () => {
    const disabled = { ...mockFridge, enabled: false };
    const result = calculateConsumption([disabled], 2, 12);
    expect(result.totalWhPerDayAnchor).toBe(0);
  });
});
```

**Step 3: Run test to verify it fails**

Run: `cd packages/web && npx vitest run src/lib/solar/__tests__/engine.test.ts`
Expected: FAIL

**Step 4: Implement calculation engine**

```typescript
// packages/web/src/lib/solar/engine.ts
import type { Appliance, ConsumptionResult } from './types';

export function calculateConsumption(
  appliances: Appliance[],
  crewSize: number,
  systemVoltage: number
): ConsumptionResult {
  const breakdownByCategory: Record<string, { anchor: number; passage: number }> = {};
  let totalWhAnchor = 0;
  let totalWhPassage = 0;

  for (const app of appliances) {
    if (!app.enabled) continue;

    const crewMultiplier = app.crewScaling ? crewSize / 2 : 1; // baseline is 2 crew

    const whAnchor = app.wattsTypical * app.hoursPerDayAnchor * app.dutyCycle * crewMultiplier;
    const whPassage = app.wattsTypical * app.hoursPerDayPassage * app.dutyCycle * crewMultiplier;

    totalWhAnchor += whAnchor;
    totalWhPassage += whPassage;

    if (!breakdownByCategory[app.category]) {
      breakdownByCategory[app.category] = { anchor: 0, passage: 0 };
    }
    breakdownByCategory[app.category].anchor += whAnchor;
    breakdownByCategory[app.category].passage += whPassage;
  }

  return {
    totalWhPerDayAnchor: totalWhAnchor,
    totalWhPerDayPassage: totalWhPassage,
    totalAhPerDayAnchor: totalWhAnchor / systemVoltage,
    totalAhPerDayPassage: totalWhPassage / systemVoltage,
    breakdownByCategory,
  };
}
```

**Step 5: Run test to verify it passes**

Run: `cd packages/web && npx vitest run src/lib/solar/__tests__/engine.test.ts`
Expected: PASS

**Step 6: Write failing tests for sizing**

```typescript
// packages/web/src/lib/solar/__tests__/sizing.test.ts
import { describe, it, expect } from 'vitest';
import { calculateRecommendation } from '../sizing';

describe('calculateRecommendation', () => {
  it('recommends solar panels based on consumption and sun hours', () => {
    const result = calculateRecommendation({
      dailyConsumptionWh: 1500,
      peakSunHours: 5.5,
      deratingFactor: 0.75,
      batteryChemistry: 'lifepo4',
      systemVoltage: 12,
      daysAutonomy: 2,
      alternatorAmps: 80,
      motoringHoursPerDay: 2,
      hasAcLoads: true,
      maxAcLoadWatts: 1000,
    });

    // 1500 / (5.5 * 0.75) = 364W minimum
    expect(result.panelWatts.minimum).toBeCloseTo(364, -1);
    expect(result.panelWatts.recommended).toBeGreaterThan(result.panelWatts.minimum);
    expect(result.panelWatts.comfortable).toBeGreaterThan(result.panelWatts.recommended);
  });

  it('sizes battery bank for LiFePO4 at 80% DoD', () => {
    const result = calculateRecommendation({
      dailyConsumptionWh: 1200,
      peakSunHours: 5,
      deratingFactor: 0.75,
      batteryChemistry: 'lifepo4',
      systemVoltage: 12,
      daysAutonomy: 2,
      alternatorAmps: 80,
      motoringHoursPerDay: 2,
      hasAcLoads: false,
      maxAcLoadWatts: 0,
    });

    // 1200Wh/day / 12V = 100Ah/day. 2 days at 80% DoD = 100 * 2 / 0.8 = 250Ah
    expect(result.batteryAh.minimum).toBeCloseTo(250, -1);
  });

  it('sizes battery bank for AGM at 50% DoD', () => {
    const result = calculateRecommendation({
      dailyConsumptionWh: 1200,
      peakSunHours: 5,
      deratingFactor: 0.75,
      batteryChemistry: 'agm',
      systemVoltage: 12,
      daysAutonomy: 2,
      alternatorAmps: 80,
      motoringHoursPerDay: 2,
      hasAcLoads: false,
      maxAcLoadWatts: 0,
    });

    // 100Ah/day * 2 days / 0.5 DoD = 400Ah
    expect(result.batteryAh.minimum).toBeCloseTo(400, -1);
  });

  it('recommends smart regulator for LiFePO4', () => {
    const result = calculateRecommendation({
      dailyConsumptionWh: 1200,
      peakSunHours: 5,
      deratingFactor: 0.75,
      batteryChemistry: 'lifepo4',
      systemVoltage: 12,
      daysAutonomy: 2,
      alternatorAmps: 80,
      motoringHoursPerDay: 2,
      hasAcLoads: false,
      maxAcLoadWatts: 0,
    });

    expect(result.needsSmartRegulator).toBe(true);
  });

  it('includes inverter recommendation when AC loads exist', () => {
    const result = calculateRecommendation({
      dailyConsumptionWh: 1200,
      peakSunHours: 5,
      deratingFactor: 0.75,
      batteryChemistry: 'lifepo4',
      systemVoltage: 12,
      daysAutonomy: 2,
      alternatorAmps: 80,
      motoringHoursPerDay: 2,
      hasAcLoads: true,
      maxAcLoadWatts: 1000,
    });

    expect(result.inverterWatts).toBeGreaterThanOrEqual(1000);
  });

  it('calculates alternator daily contribution', () => {
    const result = calculateRecommendation({
      dailyConsumptionWh: 1200,
      peakSunHours: 5,
      deratingFactor: 0.75,
      batteryChemistry: 'lifepo4',
      systemVoltage: 12,
      daysAutonomy: 2,
      alternatorAmps: 80,
      motoringHoursPerDay: 2,
      hasAcLoads: false,
      maxAcLoadWatts: 0,
    });

    // 80A * 2h * 0.7 efficiency = 112 Ah
    expect(result.alternatorDailyAh).toBeCloseTo(112, -1);
  });
});
```

**Step 7: Run test to verify it fails**

Run: `cd packages/web && npx vitest run src/lib/solar/__tests__/sizing.test.ts`
Expected: FAIL

**Step 8: Implement sizing engine**

```typescript
// packages/web/src/lib/solar/sizing.ts
import type { SolarRecommendation } from './types';

interface SizingInput {
  dailyConsumptionWh: number;
  peakSunHours: number;
  deratingFactor: number;
  batteryChemistry: 'agm' | 'lifepo4';
  systemVoltage: number;
  daysAutonomy: number;
  alternatorAmps: number;
  motoringHoursPerDay: number;
  hasAcLoads: boolean;
  maxAcLoadWatts: number;
}

const DOD = { agm: 0.5, lifepo4: 0.8 } as const;
const ALTERNATOR_EFFICIENCY = 0.7;

export function calculateRecommendation(input: SizingInput): SolarRecommendation {
  const {
    dailyConsumptionWh, peakSunHours, deratingFactor,
    batteryChemistry, systemVoltage, daysAutonomy,
    alternatorAmps, motoringHoursPerDay, hasAcLoads, maxAcLoadWatts,
  } = input;

  // Solar sizing
  const effectiveSunHours = peakSunHours * deratingFactor;
  const minPanelWatts = dailyConsumptionWh / effectiveSunHours;

  // Battery sizing
  const dailyAh = dailyConsumptionWh / systemVoltage;
  const dod = DOD[batteryChemistry];
  const minBatteryAh = (dailyAh * daysAutonomy) / dod;

  // MPPT sizing (assumes 100V panels, typical for marine)
  const mpptAmps = Math.ceil((minPanelWatts * 1.25) / systemVoltage);

  // Alternator contribution
  const alternatorDailyAh = alternatorAmps * motoringHoursPerDay * ALTERNATOR_EFFICIENCY;

  // Inverter sizing (round up to next standard size)
  const inverterSizes = [500, 1000, 1500, 2000, 3000];
  const inverterWatts = hasAcLoads
    ? inverterSizes.find(s => s >= maxAcLoadWatts) ?? maxAcLoadWatts
    : null;

  // Wire gauge recommendation based on max current
  const maxCurrent = (minPanelWatts * 1.25) / systemVoltage;
  const wireGauge = maxCurrent > 60 ? '2 AWG' : maxCurrent > 40 ? '4 AWG' :
    maxCurrent > 25 ? '6 AWG' : maxCurrent > 15 ? '8 AWG' : '10 AWG';

  // Daily generation estimate
  const dailyGenerationWh = minPanelWatts * effectiveSunHours;

  return {
    panelWatts: {
      minimum: Math.round(minPanelWatts),
      recommended: Math.round(minPanelWatts * 1.25),
      comfortable: Math.round(minPanelWatts * 1.5),
    },
    batteryAh: {
      minimum: Math.round(minBatteryAh),
      recommended: Math.round(minBatteryAh * 1.25),
      comfortable: Math.round(minBatteryAh * 1.5),
    },
    batteryCount: Math.ceil(minBatteryAh / 100), // assumes 100Ah units
    mpptAmps,
    mpptMaxVoltage: 100,
    inverterWatts,
    alternatorDailyAh: Math.round(alternatorDailyAh),
    needsSmartRegulator: batteryChemistry === 'lifepo4',
    batteryMonitor: true,
    wireGauge,
    dailyGenerationWh: Math.round(dailyGenerationWh),
    dailyBalance: Math.round(dailyGenerationWh - dailyConsumptionWh),
  };
}
```

**Step 9: Run tests**

Run: `cd packages/web && npx vitest run src/lib/solar/`
Expected: ALL PASS

**Step 10: Implement PVGIS client**

```typescript
// packages/web/src/lib/solar/pvgis.ts
import type { PvgisMonthlyData } from './types';

const PVGIS_BASE = 'https://re.jrc.ec.europa.eu/api/v5_3';

export async function fetchMonthlyIrradiance(
  lat: number,
  lon: number
): Promise<PvgisMonthlyData[]> {
  const url = `${PVGIS_BASE}/MRcalc?lat=${lat}&lon=${lon}&horirrad=1&optrad=1&avtemp=1&outputformat=json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`PVGIS API error: ${response.status}`);
  }

  const data = await response.json();
  const months = data.outputs.monthly;

  return months.map((m: any) => ({
    month: m.month,
    horizontalIrradiance: m.H_h / 1000, // convert Wh/m2 to kWh/m2/day
    optimalIrradiance: m.H_opt / 1000,
    temperature: m.T2m,
  }));
}

// Peak sun hours = horizontal irradiance in kWh/m2/day
export function peakSunHours(monthlyData: PvgisMonthlyData[], month: number): number {
  const data = monthlyData.find(m => m.month === month);
  return data?.horizontalIrradiance ?? 4.0; // fallback
}

export function annualAveragePeakSunHours(monthlyData: PvgisMonthlyData[]): number {
  const sum = monthlyData.reduce((acc, m) => acc + m.horizontalIrradiance, 0);
  return sum / monthlyData.length;
}
```

**Step 11: Commit**

```bash
git add .
git commit -m "feat: add solar calculation engine with sizing, consumption, and PVGIS client"
```

---

## Task 6: Energy Planner UI — Zustand Store & Core Components

**Files:**
- Create: `packages/web/src/stores/solar.ts`
- Create: `packages/web/src/components/solar/EnergyPlanner.tsx`
- Create: `packages/web/src/components/solar/JourneySelector.tsx`
- Create: `packages/web/src/components/solar/BoatSelector.tsx`
- Create: `packages/web/src/components/solar/ApplianceGrid.tsx`
- Create: `packages/web/src/components/solar/ApplianceCard.tsx`
- Create: `packages/web/src/components/solar/SystemPreferences.tsx`
- Create: `packages/web/src/components/solar/LocationPicker.tsx`
- Create: `packages/web/src/pages/tools/solar.astro`
- Test: `packages/web/src/stores/__tests__/solar.test.ts`

This task builds the input side of the Energy Planner. The store manages all calculator state, the components render the progressive build UI (Quick Start → Customize → Advanced).

**Key implementation notes:**
- `JourneySelector` renders three cards for the entry points
- `BoatSelector` searches `boat_model_templates` via React Query, pre-fills appliances on selection
- `ApplianceGrid` groups cards by category with anchor/passage toggle
- `ApplianceCard` shows name, icon, wattage, toggle to enable, editable hours slider
- `SystemPreferences` handles battery chemistry, voltage, autonomy days, alternator, shore power
- `LocationPicker` uses a simple dropdown of popular cruising regions (lat/lon pairs) with manual lat/lon option
- All inputs write to Zustand store, which triggers real-time recalculation
- `localStorage` persistence via Zustand `persist` middleware

**Step 1: Write store tests, then implement store**

**Step 2: Build each component, test with Vitest + Testing Library**

**Step 3: Wire up the page at `/tools/solar`**

**Step 4: Commit**

```bash
git commit -m "feat: add Energy Planner UI with Zustand store and input components"
```

---

## Task 7: Energy Planner UI — Output & Visualizations

**Files:**
- Create: `packages/web/src/components/solar/ResultsSummary.tsx`
- Create: `packages/web/src/components/solar/ComponentRecommendation.tsx`
- Create: `packages/web/src/components/solar/EnergyFlowChart.tsx`
- Create: `packages/web/src/components/solar/MonthlyChart.tsx`
- Create: `packages/web/src/components/solar/ConsumptionDonut.tsx`
- Create: `packages/web/src/components/solar/LocationComparison.tsx`
- Create: `packages/web/src/components/solar/SystemSchematic.tsx`
- Test: `packages/web/src/components/solar/__tests__/ResultsSummary.test.tsx`

**Key implementation notes:**
- `ResultsSummary` shows the clean summary card (consumption, generation, balance with colour indicator)
- `ComponentRecommendation` renders the 7-item component chain with product examples from `product_specs` via React Query
- `EnergyFlowChart` uses Recharts AreaChart for the 24-hour solar bell curve vs consumption
- `MonthlyChart` uses Recharts BarChart for 12-month generation with consumption line
- `ConsumptionDonut` uses Recharts PieChart grouped by category
- `LocationComparison` renders side-by-side bars for 2-3 locations
- `SystemSchematic` generates SVG programmatically based on selected components. Adapts for LiFePO4 (BMS, smart regulator), AC loads (inverter), voltage, etc.
- All charts use the brand colour palette (green for generation, coral for consumption, blue for neutral)
- Dark mode: transparent chart backgrounds, low-opacity grid lines

**Step 1: Build ResultsSummary and ComponentRecommendation**

**Step 2: Build charts (EnergyFlowChart, MonthlyChart, ConsumptionDonut)**

**Step 3: Build SystemSchematic SVG generator**

**Step 4: Build LocationComparison**

**Step 5: Wire all outputs into EnergyPlanner, test real-time updates**

**Step 6: Commit**

```bash
git commit -m "feat: add Energy Planner output with charts, recommendations, and system schematic"
```

---

## Task 8: Saved Configurations

**Files:**
- Create: `packages/web/src/components/solar/SaveConfigPanel.tsx`
- Create: `packages/web/src/components/solar/ConfigList.tsx`
- Create: `packages/web/src/lib/solar/config-persistence.ts`
- Modify: `packages/web/src/stores/solar.ts` — add save/load actions
- Test: `packages/web/src/lib/solar/__tests__/config-persistence.test.ts`

**Key implementation notes:**
- `config-persistence.ts` handles localStorage ↔ Supabase sync
- Anonymous: auto-saves to localStorage, restores on return
- Authenticated: saves to `saved_configurations` table, named configs, shareable URLs
- On first sign-in: migrates localStorage config to Supabase account
- URL state encoding: config ID or compressed state in URL params for sharing
- `SaveConfigPanel` shows save button (opens name dialog if auth'd), upfront text about auth benefits
- `ConfigList` shows saved configs with load/rename/delete

**Step 1: Write tests for persistence logic**

**Step 2: Implement localStorage and Supabase persistence**

**Step 3: Build UI components**

**Step 4: Commit**

```bash
git commit -m "feat: add saved configurations with localStorage and Supabase sync"
```

---

## Task 9: Blog with MDX

**Files:**
- Create: `packages/web/src/content.config.ts`
- Create: `packages/web/src/content/blog/welcome-to-above-deck.mdx` (sample post)
- Create: `packages/web/src/pages/blog/index.astro`
- Create: `packages/web/src/pages/blog/[...slug].astro`
- Create: `packages/web/src/pages/rss.xml.ts`
- Create: `packages/web/src/components/blog/PostCard.tsx`
- Create: `packages/web/src/components/blog/CategoryFilter.tsx`

**Key implementation notes:**
- Content collection schema with: title, description, pubDate, category (builder/sailing/electrical/destinations), tags, difficulty, youtubeId, heroImage, author, estimatedReadTime
- Blog index page with category filter tabs (All, Builder, Sailing, Electrical)
- Individual post page with MDX rendering, YouTube embed via `astro-embed` if youtubeId set
- RSS feed at `/rss.xml` with description-only items
- PostCard component for blog listing: title, description, date, category badge, read time
- `/watch` filtered view: posts with youtubeId, video-first layout

**Step 1: Define content collection schema in content.config.ts**

**Step 2: Create sample blog post (builder's journal)**

**Step 3: Build blog index and post pages**

**Step 4: Build RSS feed**

**Step 5: Commit**

```bash
git commit -m "feat: add MDX blog with category filtering, YouTube embeds, and RSS"
```

---

## Task 10: Knowledge Base

**Files:**
- Create: `packages/web/src/content/knowledge/electrical/watts-amps-volts.mdx` (sample)
- Create: `packages/web/src/content/knowledge/electrical/battery-chemistry.mdx` (sample)
- Create: `packages/web/src/pages/knowledge/index.astro`
- Create: `packages/web/src/pages/knowledge/[...slug].astro`
- Create: `packages/web/src/components/knowledge/CategoryNav.tsx`
- Create: `packages/web/src/components/knowledge/ArticleCard.tsx`
- Create: `packages/web/src/components/knowledge/DifficultyBadge.tsx`
- Create: `packages/web/src/components/knowledge/InlineKBCard.tsx`
- Modify: `packages/web/astro.config.mjs` — add Pagefind integration

**Key implementation notes:**
- Knowledge collection schema: title, description, category, difficulty, tags, prerequisites, estimatedReadTime, lastVerified, contributors, summary, keyTopics
- KB index grouped by category with count per category
- Article page with difficulty badge, prerequisites links, related articles, contributor credits
- `InlineKBCard` reusable component for embedding KB content in the Energy Planner (expandable "Learn more" cards)
- Pagefind integration for client-side full-text search
- Content structured for RAG: self-contained H2 sections, short paragraphs, structured data

**Step 1: Add knowledge collection to content.config.ts**

**Step 2: Write 2 sample KB articles (electrical category)**

**Step 3: Build KB index and article pages**

**Step 4: Build InlineKBCard and wire into Energy Planner**

**Step 5: Add Pagefind search**

**Step 6: Commit**

```bash
git commit -m "feat: add knowledge base with Pagefind search and inline calculator cards"
```

---

## Task 11: Community Page & Discussions

**Files:**
- Create: `packages/web/src/pages/community/index.astro`
- Create: `packages/web/src/pages/community/[id].astro`
- Create: `packages/web/src/components/community/CommunityHub.tsx`
- Create: `packages/web/src/components/community/DiscussionList.tsx`
- Create: `packages/web/src/components/community/ThreadView.tsx`
- Create: `packages/web/src/components/community/NewThreadForm.tsx`
- Create: `packages/web/src/components/community/ReplyForm.tsx`
- Create: `packages/web/src/components/community/WhatsAppCard.tsx`
- Create: `packages/web/src/components/community/NewsletterSignup.tsx`
- Test: `packages/web/src/components/community/__tests__/DiscussionList.test.tsx`

**Key implementation notes:**
- `CommunityHub` is the main `/community` page: WhatsApp card (auth-gated), discussion list, latest blog posts, newsletter signup, member stats
- `WhatsAppCard` shows invite QR/link only after Google auth, otherwise shows "Sign in to join"
- `DiscussionList` fetches from Supabase `discussions` table, filterable by category tabs
- `ThreadView` shows thread body + replies, `ReplyForm` for auth'd users
- `NewThreadForm` with title, category select, markdown body
- `NewsletterSignup` captures email (from Google profile if auth'd, or manual entry)
- Basic moderation: report button on threads/replies, stores in `product_requests` table (repurpose with status field or create dedicated `reports` table)
- Markdown rendering for thread bodies and replies using a simple markdown-to-html library

**Step 1: Build WhatsAppCard with auth gate**

**Step 2: Build DiscussionList and ThreadView**

**Step 3: Build NewThreadForm and ReplyForm**

**Step 4: Build NewsletterSignup**

**Step 5: Wire into CommunityHub page**

**Step 6: Commit**

```bash
git commit -m "feat: add community page with discussions, WhatsApp gate, and newsletter signup"
```

---

## Task 12: Product Request Flow

**Files:**
- Create: `packages/web/src/components/solar/ProductRequestForm.tsx`
- Modify: `packages/web/src/components/solar/ComponentRecommendation.tsx` — add "Request a product" button

**Key implementation notes:**
- "Don't see your product? Request it" button on each component recommendation
- Opens a simple form: make, model, optional product page URL
- Submits to `product_requests` table (requires auth)
- Shows confirmation: "We'll research this and add it to our database"
- No auto-lookup for MVP — manual research queue

**Step 1: Build ProductRequestForm**

**Step 2: Wire into ComponentRecommendation**

**Step 3: Commit**

```bash
git commit -m "feat: add product request flow for community-driven spec database"
```

---

## Task 13: Landing Page

**Files:**
- Modify: `packages/web/src/pages/index.astro`
- Create: `packages/web/src/components/landing/Hero.tsx`
- Create: `packages/web/src/components/landing/FeatureCards.tsx`
- Create: `packages/web/src/components/landing/CommunitySection.tsx`

**Key implementation notes:**
- Clean, blueprint-aesthetic landing page
- Hero: tagline, brief description, CTA to `/tools/solar`
- Feature cards: Energy Planner, Knowledge Base, Community
- Community section: member count, WhatsApp invite teaser, latest blog posts
- Dark navy background, Space Mono headings, Inter body text
- Mobile-first, no clutter

**Step 1: Build Hero, FeatureCards, CommunitySection components**

**Step 2: Assemble landing page**

**Step 3: Commit**

```bash
git commit -m "feat: add landing page with blueprint aesthetic"
```

---

## Task 14: PWA & Offline Support

**Files:**
- Create: `packages/web/public/manifest.json`
- Create: `packages/web/src/sw.ts` (service worker)
- Modify: `packages/web/src/layouts/BaseLayout.astro` — register SW, add manifest link

**Key implementation notes:**
- Web app manifest with name, icons, theme colour (#1a1a2e), display: standalone
- Service worker: cache app shell, appliance catalog, product specs, PVGIS responses
- Calculator works offline with cached data
- Discussions and auth require connectivity — graceful fallback messages

**Step 1: Create manifest and service worker**

**Step 2: Register in BaseLayout**

**Step 3: Test offline behaviour**

**Step 4: Commit**

```bash
git commit -m "feat: add PWA manifest and service worker for offline calculator"
```

---

## Task 15: E2E Tests & Final Polish

**Files:**
- Create: `packages/web/e2e/solar-planner.spec.ts`
- Create: `packages/web/e2e/blog.spec.ts`
- Create: `packages/web/e2e/community.spec.ts`
- Create: `packages/web/playwright.config.ts`

**Key e2e test scenarios:**

- Solar planner: select boat model → verify appliances pre-populate → change location → verify results update → export PDF schematic
- Blog: navigate to blog → filter by category → open post → verify YouTube embed renders
- Knowledge base: search → filter by category → open article → verify difficulty badge
- Community: view discussions → sign in → create thread → post reply → verify thread count updates
- Auth: sign in with Google → verify profile appears → sign out → verify signed out
- Responsive: verify mobile layout, bottom sheet, touch targets

**Step 1: Configure Playwright**

**Step 2: Write e2e tests**

**Step 3: Run and fix any failures**

**Step 4: Final commit**

```bash
git commit -m "test: add Playwright e2e tests for solar planner, blog, and community"
```

---

## Task Order & Dependencies

```
Task 1: Project Scaffold & Docker
  ↓
Task 2: Mantine Theme & Design System
  ↓
Task 3: Supabase Schema & Seed Data
  ↓
Task 4: Supabase Client & Auth
  ↓
Task 5: Solar Calculation Engine (pure logic, no UI)
  ↓
Task 6: Energy Planner UI — Inputs (depends on 2, 3, 4, 5)
  ↓
Task 7: Energy Planner UI — Outputs & Visualizations (depends on 6)
  ↓
Task 8: Saved Configurations (depends on 4, 6)
  ↓
Task 9: Blog with MDX (depends on 2)
  ↓
Task 10: Knowledge Base (depends on 9)
  ↓
Task 11: Community Page & Discussions (depends on 4)
  ↓
Task 12: Product Request Flow (depends on 4, 7)
  ↓
Task 13: Landing Page (depends on 2)
  ↓
Task 14: PWA & Offline Support (depends on 5, 6)
  ↓
Task 15: E2E Tests & Final Polish (depends on all above)
```

**Parallelisable:** Tasks 9-11 (Blog, KB, Community) can run in parallel with Tasks 6-8 (Energy Planner UI) once Tasks 1-5 are complete. Task 13 (Landing Page) can start after Task 2.
