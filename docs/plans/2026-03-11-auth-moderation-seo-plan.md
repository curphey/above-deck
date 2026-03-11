# Auth, User Profiles, Moderation, Blog Editor & SEO Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a complete auth-to-moderation pipeline with user profiles, admin dashboard, TipTap blog editor, and comprehensive SEO so the site can launch with real users.

**Architecture:** Google-only auth via Supabase (already partially implemented). Admin access controlled by `ADMIN_USER_IDS` env var — no role column in DB. React islands (`client:only="react"`) with Mantine v7 for all interactive UI. Blog migrates from MDX content collections to Supabase + TipTap WYSIWYG editor. SEO via JSON-LD structured data, dynamic sitemaps, and `llms.txt`.

**Tech Stack:** Astro 5 (SSR), React 19, Supabase (Auth + DB + Storage), Mantine v7, TanStack Query 5, TipTap, mantine-datatable

**Design Doc:** `docs/plans/2026-03-11-auth-users-moderation-design.md`

**GitHub Issue:** #139

---

## Task 1: Wire AuthButton into Shell Header

**Files:**
- Modify: `packages/web/src/components/Shell.tsx`
- Modify: `packages/web/src/components/AuthButton.tsx`
- Test: `packages/web/src/components/__tests__/AuthButton.test.tsx`

**Context:** `AuthButton.tsx` exists but is NOT imported by `Shell.tsx`. The Shell currently shows nav links (Tools, Knowledge, Blog, Community) and a color scheme toggle, but no auth UI. The AuthButton component already handles avatar + dropdown when signed in, "Sign In" when not. We need to wire it in and add `redirectTo` support.

**Step 1: Write failing test for AuthButton redirect**

```tsx
// packages/web/src/components/__tests__/AuthButton.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createSupabaseClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  }),
}));

// Must wrap in MantineProvider for Mantine components
import { MantineProvider as TestProvider } from '@mantine/core';

function wrap(ui: React.ReactElement) {
  return render(<TestProvider>{ui}</TestProvider>);
}

describe('AuthButton', () => {
  beforeEach(() => {
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { pathname: '/community', search: '', origin: 'http://localhost' },
      writable: true,
    });
  });

  it('renders sign in link with redirectTo when not authenticated', async () => {
    const { AuthButton } = await import('../AuthButton');
    wrap(<AuthButton />);
    // Wait for auth check to complete
    const signInLink = await screen.findByText('Sign In');
    expect(signInLink.closest('a')).toHaveAttribute(
      'href',
      expect.stringContaining('redirectTo')
    );
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/web && pnpm vitest run src/components/__tests__/AuthButton.test.tsx
```
Expected: FAIL — AuthButton may not pass `redirectTo` yet.

**Step 3: Update AuthButton to include redirectTo**

Modify `packages/web/src/components/AuthButton.tsx`:
- The sign-in link should pass current page as `redirectTo` query param: `/api/auth/signin?redirectTo=${encodeURIComponent(window.location.pathname)}`
- The auth state should be fetched with `onAuthStateChange` listener for reactivity

**Step 4: Update signin route to forward redirectTo**

Modify `packages/web/src/pages/api/auth/signin.ts`:
- Read `redirectTo` from request body or query params
- Pass it through to `supabase.auth.signInWithOAuth({ redirectTo: callbackUrl })` where `callbackUrl` includes the `redirectTo` as a query param on the callback URL

**Step 5: Update callback route to redirect properly**

Modify `packages/web/src/pages/api/auth/callback.ts`:
- After exchanging the code for a session, read `redirectTo` from the callback URL query params
- Redirect to `redirectTo` instead of always redirecting to `/`

**Step 6: Wire AuthButton into Shell**

Modify `packages/web/src/components/Shell.tsx`:
- Import `AuthButton`
- Add it to the header `Group`, after the color scheme toggle

```tsx
import { AuthButton } from './AuthButton';
// ... in the header Group:
<AuthButton />
```

**Step 7: Run tests**

```bash
cd packages/web && pnpm vitest run
```
Expected: All tests pass.

**Step 8: Commit**

```bash
git add packages/web/src/components/Shell.tsx packages/web/src/components/AuthButton.tsx packages/web/src/pages/api/auth/ packages/web/src/components/__tests__/AuthButton.test.tsx
git commit -m "feat: wire AuthButton into Shell header with redirectTo support"
```

---

## Task 2: Profile Database Migration

**Files:**
- Create: `supabase/migrations/003_profiles_extended.sql`
- Modify: `.env.example`

**Context:** The `profiles` table exists with `id`, `display_name`, `avatar_url`, `created_at`, `updated_at`. We need to add bio, boat info, and ban status. The `is_pinned` and `is_locked` columns on discussions were already added in the code review commit. We also need the `reports` table and `blog_posts` table.

**Step 1: Write the migration**

```sql
-- 003_profiles_extended.sql
-- Extend profiles, add blog_posts table, add reports table, update RLS

-- Extend profiles with user-editable fields and ban status
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS boat_name TEXT,
  ADD COLUMN IF NOT EXISTS boat_type TEXT CHECK (boat_type IN ('mono', 'cat', 'tri')),
  ADD COLUMN IF NOT EXISTS boat_length_ft INTEGER,
  ADD COLUMN IF NOT EXISTS home_port TEXT,
  ADD COLUMN IF NOT EXISTS cruising_area TEXT,
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- Blog posts (replaces MDX content collection)
CREATE TABLE blog_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  body          TEXT NOT NULL,
  category      TEXT NOT NULL CHECK (category IN ('builder', 'sailing', 'electrical', 'destinations')),
  tags          TEXT[] DEFAULT '{}',
  author_id     UUID REFERENCES profiles(id),
  hero_image    TEXT,
  published     BOOLEAN DEFAULT false,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published posts" ON blog_posts FOR SELECT USING (published = true);

-- Content reports for moderation
CREATE TABLE reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id   UUID NOT NULL REFERENCES profiles(id),
  content_type  TEXT NOT NULL CHECK (content_type IN ('discussion', 'reply')),
  content_id    UUID NOT NULL,
  reason        TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'off-topic', 'misinformation', 'other')),
  details       TEXT,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'actioned', 'dismissed')),
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- One report per user per content item
CREATE UNIQUE INDEX reports_unique_per_user ON reports (reporter_id, content_type, content_id);

-- Banned users cannot create content
CREATE POLICY "Banned users blocked from discussions" ON discussions
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_banned = true
    )
  );
-- Drop the old insert policy first
DROP POLICY IF EXISTS "Auth users create discussions" ON discussions;

CREATE POLICY "Banned users blocked from replies" ON replies
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_banned = true
    )
  );
DROP POLICY IF EXISTS "Auth users create replies" ON replies;

-- Users can delete their own content
CREATE POLICY "Users delete own discussions" ON discussions
  FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Users delete own replies" ON replies
  FOR DELETE USING (auth.uid() = author_id);

-- Supabase Storage bucket for blog images (created via dashboard or CLI, not SQL)
-- bucket: blog-images, public: true
```

**Step 2: Add ADMIN_USER_IDS to .env.example**

```
ADMIN_USER_IDS=  # comma-separated UUIDs of admin users
```

**Step 3: Commit**

```bash
git add supabase/migrations/003_profiles_extended.sql .env.example
git commit -m "feat: add profiles extension, blog_posts, reports tables and RLS"
```

---

## Task 3: Admin Middleware

**Files:**
- Create: `packages/web/src/middleware.ts`
- Create: `packages/web/src/lib/admin.ts`

**Context:** Astro middleware runs on every server-rendered request. We need to check auth + admin allowlist for `/admin/*` routes. Non-admins get redirected to `/`. The `ADMIN_USER_IDS` env var contains comma-separated UUIDs. This middleware must NOT interfere with prerendered pages (blog, knowledge base) — those bypass middleware entirely since they're static.

**Step 1: Create the admin helper**

```typescript
// packages/web/src/lib/admin.ts
export function isAdmin(userId: string): boolean {
  const adminIds = (import.meta.env.ADMIN_USER_IDS ?? '').split(',').map((id: string) => id.trim()).filter(Boolean);
  return adminIds.includes(userId);
}
```

**Step 2: Create the middleware**

```typescript
// packages/web/src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabase-server';
import { isAdmin } from './lib/admin';

export const onRequest = defineMiddleware(async ({ url, cookies, redirect, locals }, next) => {
  // Only gate /admin routes
  if (!url.pathname.startsWith('/admin')) {
    return next();
  }

  const supabase = createSupabaseServerClient(cookies);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.id)) {
    return redirect('/');
  }

  // Make user available to admin pages
  locals.user = user;
  return next();
});
```

**Step 3: Add type for locals**

Add to `packages/web/src/env.d.ts` (create if needed):

```typescript
/// <reference types="astro/client" />
declare namespace App {
  interface Locals {
    user?: import('@supabase/supabase-js').User;
  }
}
```

**Step 4: Commit**

```bash
git add packages/web/src/middleware.ts packages/web/src/lib/admin.ts packages/web/src/env.d.ts
git commit -m "feat: add admin middleware with ADMIN_USER_IDS allowlist"
```

---

## Task 4: Profile Pages

**Files:**
- Create: `packages/web/src/pages/profile/[id].astro`
- Create: `packages/web/src/components/profile/PublicProfile.tsx`
- Create: `packages/web/src/pages/settings.astro`
- Create: `packages/web/src/components/profile/SettingsForm.tsx`
- Test: `packages/web/src/components/profile/__tests__/SettingsForm.test.tsx`

**Context:** Public profile shows display name, avatar (from Google), bio, boat info, user's discussions, and saved configs. Settings page lets users edit optional fields (bio, boat info). Display name and avatar are read-only (synced from Google). Both are React islands with `client:only="react"`.

**Step 1: Write failing test for SettingsForm**

```tsx
// packages/web/src/components/profile/__tests__/SettingsForm.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';

vi.mock('@/lib/supabase', () => ({
  createSupabaseClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1', user_metadata: { full_name: 'Test User', avatar_url: 'https://example.com/avatar.jpg' } } },
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: { bio: 'Sailor', boat_name: 'Serenity', boat_type: 'mono', boat_length_ft: 38, home_port: 'Grenada', cruising_area: 'Caribbean' },
            error: null,
          }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  }),
}));

describe('SettingsForm', () => {
  it('renders profile fields', async () => {
    const { SettingsForm } = await import('../SettingsForm');
    render(<MantineProvider><SettingsForm /></MantineProvider>);
    expect(await screen.findByLabelText('Bio')).toBeInTheDocument();
    expect(screen.getByLabelText('Boat Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Home Port')).toBeInTheDocument();
  });

  it('shows display name as read-only', async () => {
    const { SettingsForm } = await import('../SettingsForm');
    render(<MantineProvider><SettingsForm /></MantineProvider>);
    const nameField = await screen.findByLabelText('Display Name');
    expect(nameField).toHaveAttribute('readOnly');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/web && pnpm vitest run src/components/profile/__tests__/SettingsForm.test.tsx
```

**Step 3: Implement SettingsForm**

```tsx
// packages/web/src/components/profile/SettingsForm.tsx
import { useState, useEffect } from 'react';
import { Container, Title, TextInput, Textarea, Select, NumberInput, Button, Group, Stack, Avatar, Text, Paper } from '@mantine/core';
import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query';
import { MantineProvider } from '../MantineProvider';
import { createSupabaseClient } from '@/lib/supabase';

function SettingsInner() {
  const supabase = createSupabaseClient();

  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [form, setForm] = useState({
    bio: '',
    boat_name: '',
    boat_type: '' as string,
    boat_length_ft: null as number | null,
    home_port: '',
    cruising_area: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        bio: profile.bio ?? '',
        boat_name: profile.boat_name ?? '',
        boat_type: profile.boat_type ?? '',
        boat_length_ft: profile.boat_length_ft,
        home_port: profile.home_port ?? '',
        cruising_area: profile.cruising_area ?? '',
      });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('profiles')
        .update(form)
        .eq('id', user!.id);
      if (error) throw error;
    },
  });

  if (!user) {
    return (
      <Container size="sm" py="xl">
        <Text c="dimmed">Sign in to edit your profile.</Text>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={1} ff="'Space Mono', monospace">Settings</Title>

        <Paper withBorder p="md">
          <Group>
            <Avatar src={user.user_metadata?.avatar_url} size="lg" radius="xl" />
            <Stack gap={2}>
              <TextInput
                label="Display Name"
                value={user.user_metadata?.full_name ?? ''}
                readOnly
                aria-label="Display Name"
              />
              <Text size="xs" c="dimmed">Synced from Google</Text>
            </Stack>
          </Group>
        </Paper>

        <Textarea label="Bio" aria-label="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.currentTarget.value })} minRows={3} />
        <TextInput label="Boat Name" aria-label="Boat Name" value={form.boat_name} onChange={(e) => setForm({ ...form, boat_name: e.currentTarget.value })} />
        <Select label="Boat Type" aria-label="Boat Type" data={[{ value: 'mono', label: 'Monohull' }, { value: 'cat', label: 'Catamaran' }, { value: 'tri', label: 'Trimaran' }]} value={form.boat_type} onChange={(v) => setForm({ ...form, boat_type: v ?? '' })} clearable />
        <NumberInput label="Boat Length (ft)" value={form.boat_length_ft ?? undefined} onChange={(v) => setForm({ ...form, boat_length_ft: typeof v === 'number' ? v : null })} min={10} max={200} />
        <TextInput label="Home Port" aria-label="Home Port" value={form.home_port} onChange={(e) => setForm({ ...form, home_port: e.currentTarget.value })} />
        <TextInput label="Cruising Area" value={form.cruising_area} onChange={(e) => setForm({ ...form, cruising_area: e.currentTarget.value })} />

        <Group justify="flex-end">
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save Changes
          </Button>
        </Group>
        {saveMutation.isSuccess && <Text c="green" size="sm">Profile updated.</Text>}
        {saveMutation.isError && <Text c="red" size="sm">Failed to save. Try again.</Text>}
      </Stack>
    </Container>
  );
}

export function SettingsForm() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <SettingsInner />
      </QueryClientProvider>
    </MantineProvider>
  );
}
```

**Step 4: Create settings page**

```astro
---
// packages/web/src/pages/settings.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import { SettingsForm } from '../components/profile/SettingsForm';
export const prerender = false;
---
<BaseLayout title="Settings — Above Deck">
  <SettingsForm client:only="react" />
</BaseLayout>
```

**Step 5: Implement PublicProfile component**

```tsx
// packages/web/src/components/profile/PublicProfile.tsx
// React island showing public profile: avatar, display name, bio, boat info, recent discussions
// Fetch profile + discussions from Supabase via TanStack Query
// Render with Mantine Card, Avatar, Badge, Stack, Text
```

*(Full implementation in the component — fetches profile by ID, shows avatar, display name, bio, boat info, lists recent discussions with links)*

**Step 6: Create profile page**

```astro
---
// packages/web/src/pages/profile/[id].astro
import BaseLayout from '../../layouts/BaseLayout.astro';
import { PublicProfile } from '../../components/profile/PublicProfile';
export const prerender = false;

const { id } = Astro.params;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!id || !uuidPattern.test(id)) {
  return Astro.redirect('/');
}
---
<BaseLayout title="Profile — Above Deck">
  <PublicProfile client:only="react" userId={id} />
</BaseLayout>
```

**Step 7: Run tests and commit**

```bash
cd packages/web && pnpm vitest run
git add packages/web/src/components/profile/ packages/web/src/pages/profile/ packages/web/src/pages/settings.astro
git commit -m "feat: add user profile pages and settings form"
```

---

## Task 5: Install Dependencies + Admin Dashboard Shell

**Files:**
- Modify: `packages/web/package.json` (install mantine-datatable, tiptap)
- Create: `packages/web/src/pages/admin/index.astro`
- Create: `packages/web/src/components/admin/AdminDashboard.tsx`
- Create: `packages/web/src/components/admin/AdminLayout.tsx`

**Context:** All admin pages share a sidebar layout. Each page is a React island (`client:only="react"`) wrapped in `AdminLayout` which provides sidebar nav. We use `mantine-datatable` for sortable/filterable tables. Install TipTap now for the blog editor task later.

**Step 1: Install dependencies**

```bash
cd packages/web
pnpm add mantine-datatable @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header @tiptap/extension-code-block-lowlight @tiptap/pm
```

**Step 2: Create AdminLayout**

```tsx
// packages/web/src/components/admin/AdminLayout.tsx
// Shared sidebar layout for all admin pages
// Sidebar links: Overview, Reports, Users, Discussions, Blog
// Uses Mantine AppShell with Navbar
// Highlights current route
// Wraps children in MantineProvider + QueryClientProvider
```

**Step 3: Create AdminDashboard (overview)**

```tsx
// packages/web/src/components/admin/AdminDashboard.tsx
// Shows stat cards: total users, total discussions, total replies, pending reports
// Each stat fetched via TanStack Query counting rows from Supabase
// Uses Mantine SimpleGrid with Paper stat cards
// Links to detail pages (reports, users, discussions)
```

**Step 4: Create admin index page**

```astro
---
// packages/web/src/pages/admin/index.astro
import BaseLayout from '../../layouts/BaseLayout.astro';
import { AdminDashboard } from '../../components/admin/AdminDashboard';
export const prerender = false;
---
<BaseLayout title="Admin — Above Deck">
  <AdminDashboard client:only="react" />
</BaseLayout>
```

**Step 5: Commit**

```bash
git add packages/web/package.json pnpm-lock.yaml packages/web/src/components/admin/ packages/web/src/pages/admin/
git commit -m "feat: add admin dashboard shell with sidebar layout and overview stats"
```

---

## Task 6: Admin Reports Page

**Files:**
- Create: `packages/web/src/pages/admin/reports.astro`
- Create: `packages/web/src/components/admin/AdminReports.tsx`

**Context:** Moderation queue showing pending reports. Each report shows the reported content (discussion title or reply snippet), reporter, reason, timestamp. Admin actions: view content, dismiss report, hide content, delete content. Uses `mantine-datatable` for the list. Reports are fetched with a join to get the content details.

**Step 1: Create AdminReports component**

```tsx
// packages/web/src/components/admin/AdminReports.tsx
// Wrapped in AdminLayout
// Fetches reports with status filter (pending / actioned / dismissed)
// DataTable columns: content type, reason, reporter, created_at, actions
// Action buttons: Dismiss (sets status='dismissed'), Hide (sets content is_hidden=true, status='actioned'), Delete (removes content, status='actioned')
// Uses useMutation for each action, invalidates queries on success
// Must use SUPABASE_SERVICE_ROLE_KEY for admin writes (bypasses RLS)
```

**Important:** Admin write operations (hide, delete, ban) cannot use the anon key because RLS doesn't have admin policies. Two approaches:
1. Create API routes (`/api/admin/...`) that use the service role key server-side
2. Add RLS policies that check the admin allowlist

**Chosen approach:** API routes with service role key. This keeps RLS simple and admin logic server-side.

**Step 2: Create admin API routes**

```typescript
// packages/web/src/pages/api/admin/reports/[id]/dismiss.ts
// POST — sets report status to 'dismissed', resolved_at to now()
// Validates admin via middleware (already checked) + double-check isAdmin()

// packages/web/src/pages/api/admin/reports/[id]/action.ts
// POST — hides or deletes the reported content, sets report status to 'actioned'
// Body: { action: 'hide' | 'delete' }
```

**Step 3: Commit**

```bash
git add packages/web/src/pages/admin/reports.astro packages/web/src/components/admin/AdminReports.tsx packages/web/src/pages/api/admin/
git commit -m "feat: add admin reports moderation queue with hide/delete/dismiss actions"
```

---

## Task 7: Admin Users Page

**Files:**
- Create: `packages/web/src/pages/admin/users.astro`
- Create: `packages/web/src/components/admin/AdminUsers.tsx`
- Create: `packages/web/src/pages/api/admin/users/[id]/ban.ts`

**Context:** User list with search, showing display name, avatar, email, join date, discussion count, ban status. Admin can ban/unban users. Uses `mantine-datatable` with search.

**Step 1: Create AdminUsers component**

```tsx
// packages/web/src/components/admin/AdminUsers.tsx
// Wrapped in AdminLayout
// Fetches profiles with search (display_name ilike)
// DataTable columns: avatar, display_name, created_at, is_banned, actions
// Ban/Unban button calls /api/admin/users/[id]/ban
```

**Step 2: Create ban API route**

```typescript
// packages/web/src/pages/api/admin/users/[id]/ban.ts
// POST — toggles is_banned on profile
// Uses service role key
// Returns updated profile
```

**Step 3: Commit**

```bash
git add packages/web/src/pages/admin/users.astro packages/web/src/components/admin/AdminUsers.tsx packages/web/src/pages/api/admin/users/
git commit -m "feat: add admin users page with search and ban/unban"
```

---

## Task 8: Admin Discussions Page

**Files:**
- Create: `packages/web/src/pages/admin/discussions.astro`
- Create: `packages/web/src/components/admin/AdminDiscussions.tsx`
- Create: `packages/web/src/pages/api/admin/discussions/[id]/moderate.ts`

**Context:** All discussions (including hidden) with admin controls: pin/unpin, lock/unlock, hide/unhide, delete. Uses `mantine-datatable`.

**Step 1: Create AdminDiscussions component**

```tsx
// packages/web/src/components/admin/AdminDiscussions.tsx
// Wrapped in AdminLayout
// Fetches ALL discussions (no is_hidden filter — admin sees everything)
// DataTable columns: title, category, author, reply_count, is_pinned, is_locked, is_hidden, actions
// Action buttons call /api/admin/discussions/[id]/moderate with { action: 'pin' | 'unpin' | 'lock' | 'unlock' | 'hide' | 'unhide' | 'delete' }
```

**Step 2: Create moderate API route**

```typescript
// packages/web/src/pages/api/admin/discussions/[id]/moderate.ts
// POST — performs the action on the discussion
// Uses service role key to bypass RLS
// Returns updated discussion
```

**Step 3: Commit**

```bash
git add packages/web/src/pages/admin/discussions.astro packages/web/src/components/admin/AdminDiscussions.tsx packages/web/src/pages/api/admin/discussions/
git commit -m "feat: add admin discussions page with pin/lock/hide/delete controls"
```

---

## Task 9: Blog Migration + TipTap Editor (Admin)

**Files:**
- Create: `packages/web/src/pages/admin/blog.astro`
- Create: `packages/web/src/components/admin/AdminBlog.tsx`
- Create: `packages/web/src/components/admin/BlogEditor.tsx`
- Create: `packages/web/src/pages/api/admin/blog/index.ts`
- Create: `packages/web/src/pages/api/admin/blog/[id].ts`
- Create: `packages/web/src/pages/api/admin/blog/upload.ts`
- Create: `supabase/seed_blog_posts.sql`
- Modify: `supabase/config.toml` (add seed file)

**Context:** Blog migrates from MDX to Supabase. Existing 3 MDX posts become seed data in `blog_posts` table. TipTap WYSIWYG editor in admin for creating/editing posts. Image upload to Supabase Storage `blog-images` bucket.

**Step 1: Create seed file from existing MDX posts**

```sql
-- supabase/seed_blog_posts.sql
-- Seed data from existing MDX blog posts

INSERT INTO blog_posts (slug, title, description, body, category, tags, published, published_at) VALUES
('sizing-your-solar-system', 'Sizing Your Solar System for Cruising', 'A practical guide...', '## Why Solar...(full HTML body)', 'electrical', ARRAY['solar', 'batteries', 'energy'], true, '2025-02-15T00:00:00Z'),
('lifepo4-vs-agm', 'LiFePO4 vs AGM: Which Battery...', 'Comparing...', '## The Battery...(full HTML body)', 'electrical', ARRAY['batteries', 'lifepo4', 'agm'], true, '2025-01-20T00:00:00Z'),
('why-we-built-above-deck', 'Why We Built Above Deck', 'The story...', '## The Problem...(full HTML body)', 'builder', ARRAY['community', 'origin-story'], true, '2025-03-01T00:00:00Z')
ON CONFLICT (slug) DO NOTHING;
```

**Step 2: Create BlogEditor component with TipTap**

```tsx
// packages/web/src/components/admin/BlogEditor.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

// Editor toolbar with buttons for: H2, H3, Bold, Italic, Link, Bullet List, Ordered List, Image (upload), Code Block, Blockquote, Table
// Image upload: opens file picker, uploads to Supabase Storage via /api/admin/blog/upload, inserts URL into editor
// Slug auto-generated from title (slugify)
// Category select, tags multi-input
// Publish/Unpublish toggle
// Save (creates or updates blog_posts row)
```

**Step 3: Create admin blog API routes**

```typescript
// packages/web/src/pages/api/admin/blog/index.ts
// GET — list all blog posts (including unpublished)
// POST — create new blog post

// packages/web/src/pages/api/admin/blog/[id].ts
// GET — single post
// PUT — update post
// DELETE — delete post

// packages/web/src/pages/api/admin/blog/upload.ts
// POST — upload image to Supabase Storage blog-images bucket
// Returns public URL
```

**Step 4: Create AdminBlog list page**

```tsx
// packages/web/src/components/admin/AdminBlog.tsx
// Wrapped in AdminLayout
// List of all posts with DataTable: title, category, published status, published_at, actions
// "New Post" button opens BlogEditor in create mode
// Click post row opens BlogEditor in edit mode
// Delete button with confirmation
```

**Step 5: Commit**

```bash
git add packages/web/src/pages/admin/blog.astro packages/web/src/components/admin/AdminBlog.tsx packages/web/src/components/admin/BlogEditor.tsx packages/web/src/pages/api/admin/blog/ supabase/seed_blog_posts.sql supabase/config.toml
git commit -m "feat: add admin blog editor with TipTap WYSIWYG and image upload"
```

---

## Task 10: Rewrite Public Blog Pages to Query Supabase

**Files:**
- Modify: `packages/web/src/pages/blog/index.astro`
- Modify: `packages/web/src/pages/blog/[...slug].astro`
- Modify: `packages/web/src/pages/rss.xml.ts`
- Remove: `packages/web/src/content/blog/` (MDX files)
- Modify: `packages/web/src/content.config.ts` (remove blog collection)

**Context:** Blog pages currently use Astro content collections (MDX). They need to query the `blog_posts` Supabase table instead. These pages switch from `prerender = true` (static) to `prerender = false` (SSR) since content is now dynamic. RSS feed also queries Supabase.

**Step 1: Rewrite blog index**

```astro
---
// packages/web/src/pages/blog/index.astro
import BaseLayout from '../../layouts/BaseLayout.astro';
import { createSupabaseServerClient } from '../../lib/supabase-server';
export const prerender = false;

const supabase = createSupabaseServerClient(Astro.cookies);
const { data: posts } = await supabase
  .from('blog_posts')
  .select('slug, title, description, category, tags, published_at, hero_image')
  .eq('published', true)
  .order('published_at', { ascending: false });
---
<!-- Render post list (same card layout as current, but from Supabase data) -->
```

**Step 2: Rewrite blog detail**

```astro
---
// packages/web/src/pages/blog/[...slug].astro
import BaseLayout from '../../layouts/BaseLayout.astro';
import { createSupabaseServerClient } from '../../lib/supabase-server';
export const prerender = false;

const { slug } = Astro.params;
const supabase = createSupabaseServerClient(Astro.cookies);
const { data: post } = await supabase
  .from('blog_posts')
  .select('*')
  .eq('slug', slug)
  .eq('published', true)
  .single();

if (!post) return Astro.redirect('/blog');
---
<!-- Render post body as HTML (TipTap outputs HTML, use set:html) -->
<div class="content" set:html={post.body} />
```

**Step 3: Rewrite RSS feed**

```typescript
// packages/web/src/pages/rss.xml.ts
// Query blog_posts where published = true
// Map to RSS items
```

**Step 4: Remove MDX blog content**

```bash
rm -rf packages/web/src/content/blog/
```

**Step 5: Update content.config.ts to remove blog collection**

Keep only the `knowledge` collection.

**Step 6: Commit**

```bash
git add packages/web/src/pages/blog/ packages/web/src/pages/rss.xml.ts packages/web/src/content.config.ts
git rm -r packages/web/src/content/blog/
git commit -m "feat: migrate blog from MDX to Supabase, rewrite public pages as SSR"
```

---

## Task 11: Flag Button on Discussions and Replies

**Files:**
- Create: `packages/web/src/components/community/FlagModal.tsx`
- Modify: `packages/web/src/components/community/DiscussionThread.tsx`
- Modify: `packages/web/src/components/community/CommunityPage.tsx`
- Test: `packages/web/src/components/community/__tests__/FlagModal.test.tsx`

**Context:** Authenticated users can flag content (discussions or replies). Flag icon appears on each item. Clicking opens a modal with reason selection (spam, harassment, off-topic, misinformation, other) and optional details textarea. One report per user per content item — if already flagged, show "Reported" badge instead.

**Step 1: Write failing test for FlagModal**

```tsx
// packages/web/src/components/community/__tests__/FlagModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';

vi.mock('@/lib/supabase', () => ({
  createSupabaseClient: () => ({
    from: () => ({
      insert: () => Promise.resolve({ error: null }),
    }),
  }),
}));

describe('FlagModal', () => {
  it('renders reason options', async () => {
    const { FlagModal } = await import('../FlagModal');
    render(
      <MantineProvider>
        <FlagModal opened contentType="discussion" contentId="abc-123" reporterId="user-1" onClose={vi.fn()} />
      </MantineProvider>
    );
    expect(screen.getByText('Spam')).toBeInTheDocument();
    expect(screen.getByText('Harassment')).toBeInTheDocument();
  });

  it('disables submit until reason selected', async () => {
    const { FlagModal } = await import('../FlagModal');
    render(
      <MantineProvider>
        <FlagModal opened contentType="discussion" contentId="abc-123" reporterId="user-1" onClose={vi.fn()} />
      </MantineProvider>
    );
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
  });
});
```

**Step 2: Implement FlagModal**

```tsx
// packages/web/src/components/community/FlagModal.tsx
// Modal with Radio group for reason, optional Textarea for details
// Submit inserts into reports table
// onClose callback
```

**Step 3: Add flag icon to DiscussionThread and CommunityPage**

- `IconFlag` from Tabler Icons on each discussion row and reply card
- Only visible when user is authenticated
- Shows "Reported" badge if user has already flagged that item (query reports table on load)

**Step 4: Run tests and commit**

```bash
cd packages/web && pnpm vitest run
git add packages/web/src/components/community/
git commit -m "feat: add flag button and report modal for discussions and replies"
```

---

## Task 12: SEO — Meta Tags, Open Graph, Twitter Cards

**Files:**
- Modify: `packages/web/src/layouts/BaseLayout.astro`

**Context:** BaseLayout currently has `<title>`, `<meta description>`, canonical URL. Add Open Graph and Twitter Card meta tags. Accept optional `image` prop for og:image.

**Step 1: Update BaseLayout**

```astro
---
interface Props {
  title: string;
  description?: string;
  image?: string;
  type?: string;
}
const { title, description = 'The sailing platform for modern cruisers', image, type = 'website' } = Astro.props;
const canonicalURL = new URL(Astro.url.pathname, Astro.site);
const ogImage = image ?? new URL('/og-default.png', Astro.site).toString();
---
<!-- In <head>: -->
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={ogImage} />
<meta property="og:type" content={type} />
<meta property="og:url" content={canonicalURL} />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
```

**Step 2: Commit**

```bash
git add packages/web/src/layouts/BaseLayout.astro
git commit -m "feat: add Open Graph and Twitter Card meta tags to BaseLayout"
```

---

## Task 13: SEO — JSON-LD Structured Data

**Files:**
- Create: `packages/web/src/components/seo/JsonLd.astro`
- Modify: `packages/web/src/pages/blog/[...slug].astro`
- Modify: `packages/web/src/pages/knowledge/[...slug].astro`
- Modify: `packages/web/src/pages/community/[id].astro`
- Modify: `packages/web/src/pages/index.astro`

**Context:** Add JSON-LD structured data per page type. Create a reusable `JsonLd.astro` component that accepts a schema object and renders it as a `<script type="application/ld+json">` tag.

**Step 1: Create JsonLd component**

```astro
---
// packages/web/src/components/seo/JsonLd.astro
interface Props {
  schema: Record<string, unknown>;
}
const { schema } = Astro.props;
---
<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

**Step 2: Add to each page type**

- **Blog posts:** `Article` schema with headline, author, datePublished, dateModified, image
- **Knowledge base:** `Article` + `BreadcrumbList`
- **Community threads:** `DiscussionForumPosting` with author, dateCreated, commentCount
- **Homepage:** `WebSite` with search action

**Step 3: Commit**

```bash
git add packages/web/src/components/seo/ packages/web/src/pages/
git commit -m "feat: add JSON-LD structured data for blog, knowledge, community, homepage"
```

---

## Task 14: SEO — Dynamic Sitemap, llms.txt, robots.txt

**Files:**
- Create: `packages/web/src/pages/sitemap.xml.ts`
- Create: `packages/web/src/pages/llms.txt.ts`
- Create: `packages/web/src/pages/llms-full.txt.ts`
- Create: `packages/web/public/robots.txt`
- Modify: `packages/web/astro.config.mjs` (remove sitemap integration — we're replacing it)

**Context:** Dynamic sitemap includes blog posts (from Supabase), knowledge base articles, active community discussions (non-hidden, updated in last 90 days). Excludes admin pages and auth routes. `llms.txt` and `llms-full.txt` are plain-text files for AI discoverability. `robots.txt` allows major AI crawlers.

**Step 1: Create dynamic sitemap**

```typescript
// packages/web/src/pages/sitemap.xml.ts
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { createSupabaseServerClient } from '../lib/supabase-server';

export const prerender = false;

export async function GET(context: APIContext) {
  const supabase = createSupabaseServerClient(context.cookies);

  // Blog posts from Supabase
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('published', true);

  // Knowledge articles from content collection
  const articles = await getCollection('knowledge', ({ data }) => !data.draft);

  // Active discussions (non-hidden, updated in last 90 days)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: discussions } = await supabase
    .from('discussions')
    .select('id, updated_at')
    .eq('is_hidden', false)
    .gte('updated_at', ninetyDaysAgo)
    .gte('reply_count', 1);

  const site = context.site!.toString().replace(/\/$/, '');
  // Generate XML sitemap with all URLs
  // Static pages: /, /blog, /knowledge, /community, /tools/solar
  // Dynamic: blog posts, knowledge articles, discussions
}
```

**Step 2: Create llms.txt**

```typescript
// packages/web/src/pages/llms.txt.ts
// Plain text: site name, description, content types, key URLs, licensing
export const prerender = true;
```

**Step 3: Create llms-full.txt**

```typescript
// packages/web/src/pages/llms-full.txt.ts
// Expanded with all knowledge base article summaries
export const prerender = true;
```

**Step 4: Create robots.txt**

```
# packages/web/public/robots.txt
User-agent: *
Allow: /

Sitemap: https://abovedeck.io/sitemap.xml

# AI crawlers
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: Anthropic-AI
Allow: /

# Block admin
Disallow: /admin/
Disallow: /api/
```

**Step 5: Remove sitemap integration from astro.config.mjs**

Since we're generating our own sitemap, remove `import sitemap` and `sitemap()` from the integrations array.

**Step 6: Commit**

```bash
git add packages/web/src/pages/sitemap.xml.ts packages/web/src/pages/llms.txt.ts packages/web/src/pages/llms-full.txt.ts packages/web/public/robots.txt packages/web/astro.config.mjs
git commit -m "feat: add dynamic sitemap, llms.txt, robots.txt for SEO and AI discoverability"
```

---

## Task 15: Community Thread SEO

**Files:**
- Modify: `packages/web/src/pages/community/[id].astro`

**Context:** Community thread pages need better SEO. Fetch the discussion title server-side for the page title. Add `noindex` for threads with 0 replies. Meta description from first 160 chars of body.

**Step 1: Update community thread page**

```astro
---
// Fetch discussion server-side for SEO meta
const supabase = createSupabaseServerClient(Astro.cookies);
const { data: discussion } = await supabase
  .from('discussions')
  .select('title, body, reply_count')
  .eq('id', id)
  .single();

const pageTitle = discussion ? `${discussion.title} — Above Deck Community` : 'Discussion — Above Deck';
const metaDescription = discussion ? discussion.body.slice(0, 160) : '';
const noIndex = !discussion || discussion.reply_count === 0;
---
<BaseLayout title={pageTitle} description={metaDescription}>
  {noIndex && <meta slot="head" name="robots" content="noindex" />}
  <DiscussionThread client:only="react" id={id} />
</BaseLayout>
```

**Step 2: Update BaseLayout to support head slot**

Add `<slot name="head" />` inside the `<head>` element of BaseLayout.

**Step 3: Commit**

```bash
git add packages/web/src/pages/community/[id].astro packages/web/src/layouts/BaseLayout.astro
git commit -m "feat: add community thread SEO with dynamic titles and noindex for empty threads"
```

---

## Execution Order

Tasks can be partially parallelized:

```
Task 1 (Auth Shell) ──────────────────────────────┐
Task 2 (DB Migration) ────────────────────────────┤
Task 3 (Admin Middleware) ─── depends on Task 2 ──┤
Task 4 (Profile Pages) ──── depends on Task 2 ────┤
Task 5 (Admin Shell + Deps) ─ depends on Task 3 ──┤
Task 6 (Admin Reports) ──── depends on Task 5 ────┤
Task 7 (Admin Users) ────── depends on Task 5 ────┤ (parallel with 6)
Task 8 (Admin Discussions) ─ depends on Task 5 ────┤ (parallel with 6, 7)
Task 9 (Blog Editor) ────── depends on Task 5 ────┤ (parallel with 6, 7, 8)
Task 10 (Blog Rewrite) ──── depends on Task 9 ────┤
Task 11 (Flag Button) ───── depends on Task 2 ────┤ (parallel with 5-9)
Task 12 (SEO Meta Tags) ──────────────────────────┤ (independent)
Task 13 (JSON-LD) ─────────── depends on Task 10 ─┤
Task 14 (Sitemap/llms.txt) ── depends on Task 10 ─┤ (parallel with 13)
Task 15 (Thread SEO) ──────── depends on Task 12 ─┤ (parallel with 13, 14)
```

**Parallelizable groups:**
- Group A: Tasks 1, 2, 12 (independent foundations)
- Group B: Tasks 3, 4, 11 (depend on Task 2)
- Group C: Tasks 6, 7, 8, 9 (depend on Task 5, parallel with each other)
- Group D: Tasks 10, 13, 14, 15 (final integration)
