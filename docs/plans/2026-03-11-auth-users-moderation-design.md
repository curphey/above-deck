# Authentication, User Management & Moderation Design

## Goal

Add user profiles, admin moderation, a WYSIWYG blog editor, and comprehensive SEO to the Above Deck platform. Ship a complete auth-to-moderation pipeline so the site can launch with real users.

## Decisions

- **Auth:** Google-only, permanently. No email/password, no GitHub.
- **Admin:** Single admin identified by env var allowlist (`ADMIN_USER_IDS`). No role column in DB.
- **Moderation:** Admin dashboard only. No in-context moderation controls.
- **Blog:** Migrate from MDX files to Supabase + TipTap WYSIWYG editor with image uploads.
- **SEO:** Full structured data (JSON-LD), dynamic sitemaps, `llms.txt` for AI discoverability.

---

## 1. Authentication & User Profiles

### Authentication

- Google-only via Supabase Auth (PKCE flow), existing implementation
- Integrate `AuthButton` into Shell header — avatar + dropdown when signed in, "Sign In" when not
- Post-auth redirect: return user to the page they were on (pass `redirectTo` through OAuth flow)

### Profiles Table (extended)

```sql
ALTER TABLE profiles
  ADD COLUMN bio TEXT,
  ADD COLUMN boat_name TEXT,
  ADD COLUMN boat_type TEXT CHECK (boat_type IN ('mono', 'cat', 'tri')),
  ADD COLUMN boat_length_ft INTEGER,
  ADD COLUMN home_port TEXT,
  ADD COLUMN cruising_area TEXT,
  ADD COLUMN is_banned BOOLEAN DEFAULT false;
```

Avatar always synced from Google — no user upload.

### Profile Pages

- `/profile/[id]` — public profile: display name, avatar, bio, boat info, discussions, saved configs
- `/settings` — edit optional fields (bio, boat info). Display name and avatar read-only (from Google).

---

## 2. Blog System (Supabase + TipTap)

### Migration from MDX to Supabase

Remove MDX content collection for blog. Existing 3 posts become seed data.

### Blog Posts Table

```sql
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
```

Admin write access checked via allowlist, not RLS.

### Image Storage

- Supabase Storage bucket `blog-images`, public read
- Upload path: `blog-images/{post_id}/{filename}`
- Inline upload from TipTap via drag-and-drop or toolbar

### TipTap Editor Features

Headings (H2, H3), bold, italic, links, bullet/numbered lists, images (inline upload), code blocks, blockquotes, tables.

### Public Blog Pages

- `/blog` index and `/blog/[slug]` rewritten to query `blog_posts` table
- `/rss.xml` queries `blog_posts` where `published = true`

---

## 3. Community Moderation

### Reports Table

```sql
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
CREATE POLICY "Auth users create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
```

Admin-only read/update on reports.

### Discussion Schema Changes

```sql
ALTER TABLE discussions ADD COLUMN is_pinned BOOLEAN DEFAULT false;
ALTER TABLE discussions ADD COLUMN is_locked BOOLEAN DEFAULT false;
```

Add RLS policies:
- Users can delete their own discussions/replies
- Banned users blocked from creating content

### Flag Button

Flag icon on discussions and replies. Modal with reason selection + optional details. One report per user per content item.

### Admin Actions

Hide, delete, dismiss report, pin/unpin, lock/unlock, ban user.

---

## 4. Admin Dashboard

### Access Control

- `ADMIN_USER_IDS` environment variable (comma-separated UUIDs)
- Astro middleware on `/admin/*` checks auth + allowlist
- Non-admins redirected to `/`

### Pages

| Route | Purpose |
|-------|---------|
| `/admin` | Stats overview: users, discussions, replies, pending reports |
| `/admin/reports` | Moderation queue with actions (hide, delete, dismiss) |
| `/admin/users` | User list with search, ban/unban |
| `/admin/discussions` | All discussions with pin/lock/hide/delete |
| `/admin/blog` | Blog post list + TipTap editor (new/edit/publish) |

### UI

React island with `client:only="react"`, sidebar navigation, Mantine DataTable for lists.

---

## 5. SEO & LLM Discoverability

### Meta Tags (all pages)

- `<title>`, `<meta name="description">`, canonical URL
- Open Graph: `og:title`, `og:description`, `og:image`, `og:type`, `og:url`
- Twitter Cards: `twitter:card`, `twitter:title`, `twitter:description`

### Structured Data (JSON-LD)

| Page Type | Schema |
|-----------|--------|
| Blog posts | `Article` — headline, author, datePublished, dateModified, image |
| Knowledge base | `Article` + `BreadcrumbList` |
| Community threads | `DiscussionForumPosting` — author, dateCreated, commentCount |
| Profiles | `Person` — name, image |
| Homepage | `WebSite` — search action |

### Sitemap

Dynamic sitemap including blog posts (from Supabase), knowledge base articles, active community discussions (non-hidden, updated in last 90 days). Exclude admin pages and auth routes.

### LLM Discoverability

- `/llms.txt` — plain-text site summary, content types, key URLs, licensing
- `/llms-full.txt` — expanded with all knowledge base article summaries and key topics
- `robots.txt` allowing major AI crawlers
- Semantic HTML with structured headings (already in place)

### Community Thread SEO

- Index threads with `reply_count >= 1`, `noindex` for empty threads
- Page title: `"{thread title}" — Above Deck Community`
- Meta description from first 160 chars of body

---

## 6. Not Building

- Email/password or GitHub auth
- In-context moderation controls
- Direct messaging
- Notifications (email or in-app)
- Likes/upvotes or reputation
- Rich media in discussions (text only)
- Real-time updates
- Following/followers
- Discussion search
- Nested reply threading

See GitHub issues for future feature tracking.
