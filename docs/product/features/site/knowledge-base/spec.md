# Knowledge Base — Feature Specification

**Date:** 2026-03-31
**Status:** Draft v2
**Package:** `packages/site/` (web UI), `packages/api/` (Go API, RAG pipeline)
**Depends on:** Data Model (`data-model.md`), API (`api/spec.md`), AI Strategy (`ai-strategy.md`), AI Agent Runtime (`ai-agent-runtime/spec.md`)
**License:** GPL — 100% free and open source
**UI:** Tailwind CSS + Ant Design 5

---

## 1. Overview

The Knowledge Base (KB) is where the project publishes research, guides, and technical documentation. Content is written factually as published research. Readers search, filter, comment, and save articles.

The central design insight: **the KB and the RAG pipeline are the same data.** Articles written for human readers on the website are chunked, embedded, and queryable by AI agents. When an article is published or updated, the RAG pipeline re-processes it automatically. There is no separate knowledge store for agents — they read the same content that appears on the website, retrieved via vector similarity search.

This means:

- **One content system, two interfaces.** Humans read articles as rendered web pages. Agents retrieve article chunks via vector search and cite them in responses.
- **Updates propagate automatically.** Edit an article, and the next agent query reflects the change.
- **Quality directly affects AI safety.** Incorrect KB content leads to incorrect agent advice. A wrong tidal calculation could ground a boat, wrong electrical advice could cause a fire. Content quality controls are therefore safety controls.
- **Attribution is built in.** Agents cite specific articles by title and link: "According to our guide on [NMEA 2000 Explained]..."

### Safety-Critical Content

Some topics are safety-critical — incorrect information could endanger lives:
- VHF radio procedures (mayday, pan-pan, securite)
- COLREGs (collision regulations, right of way)
- Electrical wiring (fire risk, electrocution)
- Gas systems (LPG, explosion risk)
- MOB procedures
- Navigation rules
- Emergency procedures

Safety-critical articles are tagged `safety_critical: true` in the data model. When agents retrieve chunks tagged `safety_critical: true`, they include a note: "This is safety-critical information. Always verify with official sources (RYA, USCG, IMO) and qualified instructors."

### Content Characteristics

- **Author-published.** All content is written and published by the project author.
- **Document types.** Articles are typed: guide, spec, how-to, manual, reference, tutorial. Type is the primary taxonomy.
- **Version controlled.** Every published change creates a version record. Diffs viewable. Rollback possible.
- **Topically organised.** Articles belong to a hierarchical topic tree (e.g., Boat Systems > Electrical > NMEA 2000).

---

## 2. Content Authority

The KB is a **published view of the project's documentation**. The authoritative source for all content is `/docs/` in the git repository. The KB presents this content to readers with metadata for search, filter, and browse.

**Content flow:**
```
/docs/research/*.md     ──→  KB articles (full content + metadata)
/docs/features/*/spec.md ──→  KB articles (summaries + key decisions)
/docs/engineering/*.md   ──→  KB articles (summaries + key decisions)
New articles (no /docs/ source) ──→  Written directly as KB articles
```

**Current implementation (pre-CMS):** KB articles are MDX files in `packages/site/src/content/knowledge/`. Research articles include the full content from the source doc. Engineering/spec articles are summaries with references.

**Future implementation (post-CMS):** KB articles move to the database. `/docs/` remains the canonical project record. MDX files are deleted. The CMS can optionally sync from `/docs/` on deploy.

See `docs/engineering/engineering-standards.md` section 10 "Content Authority Model" for the full rules.

---

## 3. Content Model

### 3.1 Articles

Articles are the primary content unit. Content is stored as Markdown — currently as MDX files in the site package, moving to the database when the CMS ships. This enables version control, search indexing, and RAG processing.

```
kb_article:
  id              UUID PRIMARY KEY
  topic_id        UUID REFERENCES kb_topics(id)
  slug            TEXT NOT NULL UNIQUE       -- URL-friendly identifier
  title           TEXT NOT NULL
  summary         TEXT                       -- short description for cards, search results, and meta tags
  content         TEXT NOT NULL              -- Markdown
  doc_type        TEXT NOT NULL              -- guide, spec, how-to, manual, reference, tutorial
  safety_critical BOOLEAN DEFAULT false      -- true = safety-critical content
  status          TEXT DEFAULT 'draft'       -- draft, published, archived
  author_id       UUID REFERENCES users(id) -- always the project admin
  license         TEXT DEFAULT 'CC-BY-SA-4.0' -- CC-BY-SA-4.0, CC-BY-4.0, CC0, custom
  version         INTEGER DEFAULT 1          -- incremented on each publish
  tags            TEXT[]                      -- cross-cutting labels (e.g., "safety", "offshore", "diy")
  related_ids     UUID[]                     -- related article IDs (editorial choice)
  metadata        JSONB                      -- { reading_time_min, word_count, ... }
  published_at    TIMESTAMPTZ                -- when first published (null if never published)
  created_at      TIMESTAMPTZ DEFAULT now()
  updated_at      TIMESTAMPTZ DEFAULT now()
```

**Notes:**

- `content` is plain Markdown. See Open Questions (section 13) for the MDX discussion.
- `doc_type` is the primary taxonomy. Doc type describes what kind of document it is.
- `safety_critical` flags content where incorrect information could endanger lives.
- `author_id` is always the project admin.
- `metadata` is computed on publish: `{ "reading_time_min": 8, "word_count": 2140 }`.
- `slug` forms the URL: `/knowledge/{slug}`.

### 2.2 Topics

Topics organise articles into a 3-level browsable hierarchy: Category → Subcategory → Article. Articles reference their category and subcategory in frontmatter. The topic table supports this via `parent_id`.

```
kb_topic:
  id              UUID PRIMARY KEY
  name            TEXT NOT NULL
  slug            TEXT NOT NULL UNIQUE
  description     TEXT                       -- short description for the topic index page
  icon            TEXT                       -- Ant Design icon name
  parent_id       UUID REFERENCES kb_topics(id) -- null for top-level topics
  sort_order      INTEGER DEFAULT 0          -- display order within parent
  created_at      TIMESTAMPTZ DEFAULT now()
  updated_at      TIMESTAMPTZ DEFAULT now()
```

**Topic hierarchy:**

The folder structure IS the KB navigation. This maps to the left sidebar tree.

```
Navigation & Charts
  ├── Understanding Electronic Charts (guide)
  ├── S-57 ENC Chart Format (spec)
  ├── AIS Explained (guide)
  ├── Mapping and Chart Technology (reference)
  └── Chartplotter UI Patterns (reference)
Weather & Routing
  ├── Marine Weather Data Sources (reference)
  ├── Reading GRIB Files (how-to)
  ├── Weather Routing Explained (guide)
  ├── FastSeas and Weather Routing (reference)
  └── Radar for Sailing (guide)
Tides & Currents
  ├── Tidal Prediction Basics (guide)
  ├── Tidal Harmonics Reference (reference)
  └── Reading Tidal Diamonds (how-to)
Passage Planning
  ├── Passage Planning Step by Step (tutorial)
  ├── Passage Planning Checklist (reference)
  └── Departure Timing Guide (how-to)
Electrical & Power
  ├── Understanding 12V Systems (guide)
  ├── Solar Panel Sizing Guide (how-to)
  ├── Battery Bank Configuration (reference)
  ├── Solar Energy Research (reference)
  ├── PVGIS Solar Data API (reference)
  └── Shore Power Safety (how-to)
Protocols & Data
  ├── NMEA 2000
  │   ├── Understanding NMEA 2000 (guide)
  │   ├── NMEA 2000 PGN Navigation Specs (spec)
  │   ├── NMEA 2000 PGN Systems Specs (spec)
  │   ├── CAN Bus Technology (reference)
  │   └── NMEA 2000 Hardware Setup (how-to)
  ├── Victron
  │   ├── Victron VE.Direct Protocol (manual)
  │   ├── Victron System Integration (how-to)
  │   └── J1939 Engine Data Protocol (spec)
  └── Data & APIs
      ├── Marine Data APIs (reference)
      ├── Data Source Matrix (reference)
      ├── Mooring and Marina Data Sources (reference)
      ├── Vessel Registration Systems (reference)
      └── Data Licensing Review (reference)
Hardware & Electronics
  ├── Sailor Hardware Landscape (reference)
  ├── Marine MFD Platforms (reference)
  ├── Raymarine Axiom 2 Deep Dive (reference)
  ├── Choosing a Boat Computer (guide)
  ├── Hardware Connectivity Technologies (reference)
  ├── Matter Protocol for Boats (reference)
  ├── Smart Home Integration (reference)
  ├── Firmware Management Guide (guide)
  └── Industrial SBC and Docker (reference)
VHF & Communications
  ├── VHF Radio Procedures (guide)
  ├── DSC and MMSI Registration (how-to)
  └── Radio Regulations Summary (reference)
Safety
  ├── MOB Procedures (reference)
  ├── Safety Equipment Checklist (reference)
  └── Heavy Weather Preparation (guide)
Boat Management
  ├── Boat Systems Monitoring (reference)
  ├── Diesel Engine Maintenance (how-to)
  ├── Watermaker Basics (guide)
  └── Provisioning for Passages (guide)
Marine Software
  ├── Marine Software Landscape (reference)
  ├── Apps and GitHub Projects (reference)
  ├── OpenCPN Analysis (reference)
  ├── Savvy Navvy Deep Dive (reference)
  └── d3kOS and Marine OS (reference)
Platform & Architecture
  ├── Deployment Architecture (reference)
  ├── PWA Capabilities (reference)
  ├── Go Marine Ecosystem (reference)
  ├── Community Platform Patterns (reference)
  └── CarPlay Marine Analogy (reference)
```

### 2.3 Article Versions

Every published change creates a version record. The `kb_articles` table always holds the current published content. The `kb_article_versions` table holds the full history.

```
kb_article_version:
  id              UUID PRIMARY KEY
  article_id      UUID REFERENCES kb_articles(id)
  version         INTEGER NOT NULL
  content         TEXT NOT NULL              -- full Markdown content at this version
  summary         TEXT
  change_summary  TEXT                       -- what changed ("Updated tidal diamond examples", "Fixed VHF channel for Portland")
  edited_by       UUID REFERENCES users(id)
  created_at      TIMESTAMPTZ DEFAULT now()
  UNIQUE(article_id, version)
```

**Version workflow:**

1. Author edits article content in the admin editor.
2. Author writes a change summary describing what changed.
3. On publish: `kb_articles.version` is incremented, `kb_articles.content` is updated, and a new `kb_article_versions` record is created with the new content.
4. RAG pipeline is triggered (re-chunk, re-embed).
5. Subscribers are notified.

**Diff and rollback:**

- Any two versions can be diffed (computed server-side, returned as a unified diff).
- Rollback creates a new version with the old content — it does not delete history.

---

## 3. RAG Integration

The KB is one of several content sources feeding the RAG pipeline (alongside the almanac, forum threads, and blog posts). The integration follows the patterns defined in the AI strategy (`ai-strategy.md`) and the site RAG pipeline (`spec.md` section 6).

### 3.1 Publish/Update Pipeline

When an article is published or updated:

1. **Chunk** — article content is split at H2 (`##`) section boundaries. Each H2 section becomes one chunk. The article title and H2 heading are prepended to each chunk as hierarchical context.
2. **Embed** — each chunk is embedded using text-embedding-3-small (hub). Spoke re-embeds queries locally using nomic-embed-text.
3. **Delete old chunks** — all existing `rag_chunks` rows for this article are deleted.
4. **Insert new chunks** — new chunk rows are inserted with metadata including `safety_critical` and `doc_type`.
5. **Mark embedded** — article `metadata` is updated: `{ "embedded_at": "...", "chunk_count": N }`.

### 3.2 Chunk Metadata

Each KB chunk is stored in the shared `rag_chunks` table with metadata that enables filtered retrieval:

```json
{
  "source_type": "knowledge",
  "source_id": "article-uuid",
  "article_slug": "nmea-2000-explained",
  "article_title": "NMEA 2000 Explained",
  "section_heading": "PGN Message Format",
  "topic": "nmea-2000",
  "topic_path": ["boat-systems", "electrical", "nmea-2000"],
  "doc_type": "guide",
  "safety_critical": false,
  "tags": ["nmea", "networking", "can-bus"],
  "version": 3,
  "published_at": "2026-03-15T10:00:00Z",
  "chunk_index": 2,
  "total_chunks": 7
}
```

### 3.3 Archive Pipeline

When an article is archived:

1. All `rag_chunks` rows for the article are deleted.
2. The article remains in the database but is no longer served on the website or available to agents.

### 3.4 Agent Consumption

Agents query KB content via the standard RAG query pipeline:

1. Agent formulates a search query based on user's question.
2. Query is embedded.
3. Vector similarity search against `rag_chunks` where `source_type = 'knowledge'`.
4. Top-k chunks returned, ranked by similarity.
5. Agent includes chunks in its LLM context and cites the source article.

**Citation format:** "According to our guide on [NMEA 2000 Explained](/knowledge/nmea-2000-explained)..."

**Safety-critical behavior:** When an agent retrieves chunks tagged `safety_critical: true`, it includes a note: "This is safety-critical information. Always verify with official sources (RYA, USCG, IMO) and qualified instructors."

### 3.5 Stale Content Detection

- Articles not updated in 12 months are flagged as stale in the admin content health dashboard.
- Stale articles are not removed from RAG — they remain available but the flag prompts the author to review.
- Agents can note content age when citing older articles: "This guide was last updated in March 2025."

### 3.6 Spoke Sync

- Published articles are synced to spoke SQLite during hub sync as full Markdown content (for offline reading).
- Embedded chunks are synced to sqlite-vec (for offline RAG queries).
- Sync is incremental — only articles changed since last sync timestamp.
- Topic filtering — spoke can sync subsets by topic (e.g., only Navigation and Weather for an offshore passage, skipping Maintenance and Cruising to save space).
- Article version is included in synced data so the spoke knows if its local copy is current.

---

## 4. User Features

### 4.1 KB Layout — Left Sidebar Navigation

The KB uses a **left sidebar with folder tree navigation**. The folder structure IS the KB structure — it directly mirrors the topic hierarchy. This is a docs-site pattern (like GitBook, Docusaurus, Stripe docs), not a dashboard or blog pattern.

**Locked UI direction (from playground iteration):**

> KB sidebar with 3-level hierarchy: 8 top-level categories (Electrical, Protocols, Navigation, Weather, Passage, Hardware, Market, Engineering) each with 2-5 subcategories containing 3-6 articles. Subcategories keep lists short and scannable. Doc type labels on articles. Sidebar: 240px, bordered style, collapsible folders. Search field at top. Tailwind CSS + Ant Design 5.

**3-level hierarchy:**

```
Category (8 top-level)
  └── Subcategory (2-5 per category)
       └── Article (3-6 per subcategory, with doc type label)
```

**Categories and subcategories:**

```
⚡ Electrical & Power
  ├── Fundamentals (12V systems, 12V vs 24V, components)
  ├── Batteries (lithium technologies, configuration)
  ├── Solar (sizing, energy research, PVGIS)
  └── Charging (alternator, shore power)

📡 Protocols & Data
  ├── NMEA 2000 (guide, nav PGNs, system PGNs, CAN bus)
  ├── Victron (VE.Direct, J1939)
  └── Data Sources (APIs, matrix, licensing, vessel registration, marinas)

🧭 Navigation & Charts
  ├── Charts (electronic charts, S-57, mapping technology)
  ├── AIS
  └── UI Patterns (chartplotter)

🌊 Weather & Tides
  ├── Weather (deep dive, data sources, FastSeas)
  ├── Tides (prediction, research)
  └── Routing (weather routing, radar, autopilot)

⛵ Passage & Seamanship
  ├── Planning (step by step, workflows)
  ├── Safety (equipment checklist)
  └── Living Aboard (provisioning, cruising, watermaker, diesel)

🖥️ Hardware & Electronics
  ├── Choosing (boat computer, hardware landscape, connectivity)
  ├── MFDs (platforms, ecosystems, Axiom 2)
  ├── Smart Home (Matter, PWA)
  ├── Compute (SBC, Docker)
  └── Firmware (tracking)

📊 Market & Competitors
  ├── Landscape (competitive overview, intelligence, software, apps)
  └── Deep Dives (Savvy Navvy, Keeano, PredictWind, d3kOS)

⚙️ Platform Engineering
  ├── Architecture (deployment, Go, PWA, infra gaps, CarPlay)
  ├── Design (visual, community, setup UX, RAG safety)
  ├── AI (strategy, agent implementation)
  ├── Standards (eng standards, tech stack, CI/CD, testing, etc.)
  └── Specs (all feature specifications)
```

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│  ABOVE DECK    Features  Tools  Knowledge  Community  MC │
├────────────┬─────────────────────────────────────────────┤
│ [Search..] │  Knowledge Base / Electrical / Fundamentals │
│            │                                             │
│ ▼Electrical│  Fundamentals                               │
│   ▼Fundmtls│  3 articles                                 │
│     12V... │                                             │
│     12v24v │  Understanding 12V Systems         GUIDE    │
│     Compnts│  12V vs 24V: Choosing Your System  RESEARCH │
│   Batteries│  Electrical System Components      GUIDE    │
│   Solar    │                                             │
│   Charging │                                             │
│ Protocols  │                                             │
│ Navigation │                                             │
│ Weather    │                                             │
│ Passage    │                                             │
│ Hardware   │                                             │
│ Boat Mgmt  │                                             │
│ Software   │                                             │
│ Platform   │                                             │
└────────────┴─────────────────────────────────────────────┘
```

**Sidebar (250px, right border):**
- Search field at top — searches all articles across all topics
- Folder tree matching the topic hierarchy (section 2.2)
- Collapsible folders — click to expand/collapse
- Active article highlighted with accent border
- Optional: doc type icons next to article titles, article counts per folder

**Content area — two modes:**
- **Folder listing** (when a folder is selected): breadcrumb, folder title, description, filter bar (doc type pills + sort), article list
- **Article view** (when an article is selected): breadcrumb, full article with TOC on the right side (separate from sidebar nav)

**Filter bar (above folder listing):**
- Doc type pills: All, Guide, How-To, Tutorial, Spec, Reference, Manual
- Sort dropdown: Recently updated, Alphabetical, Most favorited

**Search:**
- Full-text search via PostgreSQL tsvector (server-side).
- Pagefind (client-side, for fast search without server round-trip).
- Search results include: title, summary, topic path, doc type badge, reading time.
- Search weights: title (highest) > tags > summary > content (lowest).
- Highlighted search terms in results.

**Article page (`/knowledge/{slug}`):**
- Breadcrumb showing topic path
- Title, published date, last updated date, version number.
- Doc type badge.
- Reading time estimate.
- Right-side table of contents (auto-generated from headings, sticky on desktop — separate from left sidebar nav).
- Rendered Markdown content.
- Tags displayed as clickable chips.
- Related articles sidebar (editorial picks from `related_ids`).
- Previous/next article navigation within the same topic.
- Print-friendly view (CSS `@media print` — clean typography, no navigation chrome).

**Permalinks:**
- Every article has a permanent URL: `/knowledge/{slug}`
- Slugs never change once published — if an article is renamed, the old slug redirects (301)
- Section-level anchors: `/knowledge/{slug}#section-heading` (auto-generated from H2/H3 headings)
- Version-specific permalink: `/knowledge/{slug}?v=3` (view a specific version)
- Short URL for sharing: `/kb/{slug}` (redirects to full path)

**Social Sharing:**
- Share button on every article (prominent, mobile-friendly)
- Uses Web Share API (`navigator.share()`) on mobile — opens the native share sheet (WhatsApp, iMessage, Telegram, email, etc.)
- Fallback on desktop: copy-link button + share icons for common platforms
- Share targets:
  - Copy permalink (one tap, "Copied!" feedback)
  - WhatsApp (pre-filled message with title + URL)
  - Email (pre-filled subject + body with title + summary + URL)
  - Twitter/X (pre-filled tweet with title + URL)
  - Facebook (URL share)
- Open Graph meta tags ensure rich previews when links are shared:
  - `og:title` — article title
  - `og:description` — article summary
  - `og:image` — topic-level hero image or project default
  - `og:type` — article
  - `og:url` — canonical permalink
  - `twitter:card` — summary_large_image
- Share from collections: share a collection URL (`/knowledge/collections/{share_token}`) — recipients see the full curated reading list

**SEO:**
- Structured data: JSON-LD `Article` or `HowTo` schema (per site spec section 7.2).
- Open Graph and Twitter card meta tags (as above).
- Canonical URL (the permalink).

### 4.2 Favorites and Collections

**Favorites:**
- Any authenticated user can favorite/bookmark an article (heart icon on article page and in search results).
- Favorites list accessible from account page.
- Quick access to saved articles.

**Collections:**
- Users can organise favorites into named collections.
- Example collections: "Pre-departure reading", "Electrical references", "Mediterranean prep".
- Collections are private by default.
- Optionally shareable via a unique URL (share token).
- Collection page shows articles in user-defined order.

```
kb_collection:
  id              UUID PRIMARY KEY
  user_id         UUID REFERENCES users(id)
  name            TEXT NOT NULL
  description     TEXT
  is_public       BOOLEAN DEFAULT false
  share_token     TEXT UNIQUE              -- for shareable URL (/knowledge/collections/{token})
  created_at      TIMESTAMPTZ DEFAULT now()
  updated_at      TIMESTAMPTZ DEFAULT now()

kb_collection_article:
  collection_id   UUID REFERENCES kb_collections(id) ON DELETE CASCADE
  article_id      UUID REFERENCES kb_articles(id) ON DELETE CASCADE
  sort_order      INTEGER DEFAULT 0
  added_at        TIMESTAMPTZ DEFAULT now()
  PRIMARY KEY (collection_id, article_id)

kb_favorite:
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE
  article_id      UUID REFERENCES kb_articles(id) ON DELETE CASCADE
  created_at      TIMESTAMPTZ DEFAULT now()
  PRIMARY KEY (user_id, article_id)
```

### 4.3 Subscriptions and Notifications

**Subscribe to articles:**
- "Subscribe" button on any article page.
- Notified when the article is updated (new version published).

**Subscribe to topics:**
- "Subscribe" button on any topic page.
- Notified when a new article is published in that topic.

**Notification channels:**
- In-app notification (notification bell in header, badge count).
- Optional email digest (configurable: immediate, daily, or weekly).

**Management:**
- Subscriptions page in account settings.
- Unsubscribe link in every notification email.
- One-click unsubscribe from the article/topic page.

```
kb_subscription:
  id              UUID PRIMARY KEY
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE
  target_type     TEXT NOT NULL             -- 'article' or 'topic'
  target_id       UUID NOT NULL             -- article_id or topic_id
  notify_email    BOOLEAN DEFAULT false
  email_frequency TEXT DEFAULT 'immediate'  -- immediate, daily, weekly
  created_at      TIMESTAMPTZ DEFAULT now()
  UNIQUE(user_id, target_type, target_id)
```

### 4.4 Discussion

Each article has a discussion thread for questions, shared experiences, and regional variations.

**Characteristics:**
- Separate from the article content — discussions are metadata, not embedded for RAG.
- Threaded replies (one level deep — a comment can have replies, but replies cannot have replies).
- Authenticated users only.
- Moderated by the admin (flagging, hide, delete).

```
kb_comment:
  id              UUID PRIMARY KEY
  article_id      UUID REFERENCES kb_articles(id)
  user_id         UUID REFERENCES users(id)
  parent_id       UUID REFERENCES kb_comments(id) -- null for top-level comments
  content         TEXT NOT NULL                    -- Markdown
  status          TEXT DEFAULT 'visible'           -- visible, hidden, deleted
  created_at      TIMESTAMPTZ DEFAULT now()
  updated_at      TIMESTAMPTZ DEFAULT now()
```

### 4.5 Export & Download

Users can pull content from the platform and save wherever they want — Google Drive, Dropbox, local disk. No third-party storage API integrations needed.

- **Single article export:** download button on every article page
  - PDF — formatted with title, license, table of contents
  - Markdown — raw source with frontmatter (title, license, tags)
- **Collection export:** download an entire collection as a ZIP
  - Contains all articles as PDF or Markdown (user's choice)
  - Includes a `README.md` with collection name, description, and article list
- **Topic export:** download all articles in a topic as a ZIP
- **Offline via PWA:** articles cached in service worker for offline reading in browser
- **Offline via spoke:** articles synced to spoke SQLite during hub sync

No write access to user's external storage. Users download files and put them wherever they want.

### 4.6 Licensing & Attribution

Every article displays its licensing information:

- **License badge** — shown below the title (e.g., "CC BY-SA 4.0" with link to license text)
- **Author** — the project author

License is included in all exports (PDF footer, Markdown frontmatter). Default license for all content is CC-BY-SA-4.0.

### 4.7 Search, Filter & Sort

- **Full-text search** — PostgreSQL `tsvector` server-side, Pagefind client-side for instant results
- **Search weights** — title (highest) > tags > summary > content (lowest)
- **Highlighted terms** — search matches highlighted in results
- **Filter by:**
  - Topic (hierarchical — select parent topic to include children)
  - Doc type (guide, spec, how-to, manual, reference, tutorial — multi-select)
  - Tags (multi-select, AND/OR toggle)
  - Status: favorites only (for authenticated users)
- **Sort by:**
  - Relevance (default for search results)
  - Recently updated
  - Recently published
  - Most favorited
  - Most discussed
  - Alphabetical (A-Z, Z-A)
  - Reading time (shortest/longest)
- **Persistent filter state** — filters preserved in URL query params for shareability and back-button support

---

## 5. Admin Features

### 5.1 Article Management

**Create:**
- New article form with rich Markdown editor.
- Set topic, slug, doc type, tags.
- Save as draft (not visible on the site, not embedded for RAG).

**Edit:**
- Edit existing article content in the Markdown editor.
- Change summary field (required for publishing edits to non-draft articles).
- Preview rendered Markdown before publishing.

**Publish:**
- Publish transitions status from `draft` to `published`.
- Sets `published_at` (first publish only).
- Increments `version`.
- Creates a new `kb_article_versions` record.
- Triggers RAG pipeline (chunk, embed, store).
- Notifies subscribers.

**Unpublish / Archive:**
- Unpublish returns an article to `draft` status. RAG chunks are deleted.
- Archive sets status to `archived`. RAG chunks are deleted. Article remains in the database for reference but is not served.

**Version history:**
- View all versions of an article with timestamps and change summaries.
- Diff any two versions (unified diff view).
- Rollback to any previous version (creates a new version with old content, does not delete history).

**Metadata:**
- Set tags, related articles.
- Assign/reassign topic.
- Reorder articles within a topic (drag-and-drop or sort order field).

### 5.2 Topic Management

- Create, edit, delete, reorder topics.
- Set topic hierarchy (parent/child).
- Set topic icon (Ant Design icon name) and description.
- Merge topics (move all articles from one topic to another, then delete the empty topic).
- Delete only allowed if topic has no articles (or merge first).

### 5.3 Comment Moderation

- List of all comments across all articles, sortable by date, article, and status.
- Flag/unflag comments.
- Hide comment (removes from public view, preserved in database).
- Delete comment (soft delete, status set to `deleted`).
- View comment in context (link to article discussion thread).
- Filter by status (visible, hidden, deleted).
- Shared moderation infrastructure with forums (same flagging, same admin tools).

### 5.4 Content Health Dashboard

A single admin page summarising the state of the KB:

| Metric | Source |
|--------|--------|
| Articles by status (draft, published, archived) | `kb_articles` grouped by status |
| Stale articles (published, not updated in 12+ months) | `kb_articles` where `updated_at < now() - interval '12 months'` and `status = 'published'` |
| Most viewed articles | Umami analytics API |
| Articles with most discussion activity | `kb_comments` grouped by `article_id` |
| RAG coverage | Articles where `metadata->>'embedded_at'` is null or differs from `updated_at` |

### 5.5 RAG Management

- **Re-embed single article:** Trigger re-chunking and re-embedding of a specific article. Useful after embedding model changes or if chunks appear incorrect.
- **Re-embed all articles:** Trigger full re-processing of all published articles. Required when the embedding model is upgraded.
- **Chunk preview:** View how an article will be / has been chunked (section boundaries, chunk count, token estimates).
- **Chunk coverage report:** List of published articles with chunk count, last embedded timestamp, and any mismatches (article updated after last embedding).

---

## 6. Data Model (SQL)

All tables use Supabase PostgreSQL with Row Level Security enabled.

```sql
-- ============================================================
-- Topics (hierarchical)
-- ============================================================
CREATE TABLE kb_topics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT,
  icon            TEXT,                                    -- Ant Design icon name
  parent_id       UUID REFERENCES kb_topics(id) ON DELETE SET NULL,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_kb_topics_parent ON kb_topics(parent_id);
CREATE INDEX idx_kb_topics_slug ON kb_topics(slug);

-- ============================================================
-- Articles
-- ============================================================
CREATE TABLE kb_articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id        UUID REFERENCES kb_topics(id) ON DELETE SET NULL,
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  summary         TEXT,
  content         TEXT NOT NULL,                           -- Markdown
  doc_type        TEXT NOT NULL DEFAULT 'guide'
                    CHECK (doc_type IN ('guide', 'spec', 'how-to', 'manual', 'reference', 'tutorial')),
  safety_critical BOOLEAN DEFAULT false,
  status          TEXT DEFAULT 'draft'
                    CHECK (status IN ('draft', 'published', 'archived')),
  author_id       UUID REFERENCES users(id),
  license         TEXT DEFAULT 'CC-BY-SA-4.0',             -- CC-BY-SA-4.0, CC-BY-4.0, CC0, custom
  version         INTEGER DEFAULT 1,
  tags            TEXT[] DEFAULT '{}',
  related_ids     UUID[] DEFAULT '{}',
  metadata        JSONB DEFAULT '{}',                      -- { reading_time_min, word_count, embedded_at, chunk_count }
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_kb_articles_slug ON kb_articles(slug);
CREATE INDEX idx_kb_articles_topic ON kb_articles(topic_id);
CREATE INDEX idx_kb_articles_status ON kb_articles(status);
CREATE INDEX idx_kb_articles_doc_type ON kb_articles(doc_type);
CREATE INDEX idx_kb_articles_tags ON kb_articles USING GIN(tags);
CREATE INDEX idx_kb_articles_search ON kb_articles USING GIN(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, ''))
);

-- ============================================================
-- Article versions (full history)
-- ============================================================
CREATE TABLE kb_article_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id      UUID NOT NULL REFERENCES kb_articles(id) ON DELETE CASCADE,
  version         INTEGER NOT NULL,
  content         TEXT NOT NULL,
  summary         TEXT,
  change_summary  TEXT,                                    -- what changed in this version
  edited_by       UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(article_id, version)
);

CREATE INDEX idx_kb_versions_article ON kb_article_versions(article_id, version);

-- ============================================================
-- User favorites
-- ============================================================
CREATE TABLE kb_favorites (
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_id      UUID NOT NULL REFERENCES kb_articles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, article_id)
);

-- ============================================================
-- User collections
-- ============================================================
CREATE TABLE kb_collections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  is_public       BOOLEAN DEFAULT false,
  share_token     TEXT UNIQUE,                             -- for shareable URL
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_kb_collections_user ON kb_collections(user_id);
CREATE INDEX idx_kb_collections_token ON kb_collections(share_token);

CREATE TABLE kb_collection_articles (
  collection_id   UUID NOT NULL REFERENCES kb_collections(id) ON DELETE CASCADE,
  article_id      UUID NOT NULL REFERENCES kb_articles(id) ON DELETE CASCADE,
  sort_order      INTEGER DEFAULT 0,
  added_at        TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (collection_id, article_id)
);

-- ============================================================
-- Subscriptions
-- ============================================================
CREATE TABLE kb_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type     TEXT NOT NULL CHECK (target_type IN ('article', 'topic')),
  target_id       UUID NOT NULL,                           -- article_id or topic_id
  notify_email    BOOLEAN DEFAULT false,
  email_frequency TEXT DEFAULT 'immediate'
                    CHECK (email_frequency IN ('immediate', 'daily', 'weekly')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

CREATE INDEX idx_kb_subscriptions_target ON kb_subscriptions(target_type, target_id);

-- ============================================================
-- Article discussions (comments)
-- ============================================================
CREATE TABLE kb_comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id      UUID NOT NULL REFERENCES kb_articles(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  parent_id       UUID REFERENCES kb_comments(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,                            -- Markdown
  status          TEXT DEFAULT 'visible'
                    CHECK (status IN ('visible', 'hidden', 'deleted')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_kb_comments_article ON kb_comments(article_id, created_at);
CREATE INDEX idx_kb_comments_parent ON kb_comments(parent_id);
```

### 6.1 Row Level Security Policies

| Table | Read | Write |
|-------|------|-------|
| `kb_topics` | Public (anyone) | Admin only |
| `kb_articles` | Published articles: public. Draft/archived: admin only | Admin only |
| `kb_article_versions` | Same as parent article | Admin only (created automatically) |
| `kb_favorites` | Own records only | Own records only |
| `kb_collections` | Own records + public collections via share_token | Own records only |
| `kb_collection_articles` | Via collection access | Own collection only |
| `kb_subscriptions` | Own records only | Own records only |
| `kb_comments` | Public (visible status only) | Authenticated users create own, admin moderates |

---

## 7. API Endpoints

All endpoints served by the Go API server (`packages/api/`). Authentication via JWT (Supabase Auth) in httpOnly cookie. Patterns follow the API spec (`api/spec.md`).

### 7.1 Public (No Auth Required)

```
GET  /api/v1/kb/articles                    -- list/search articles
     ?q=search+term                         -- full-text search
     &topic=electrical                      -- filter by topic slug
     &doc_type=guide                        -- filter by doc type
     &tags=safety,offshore                  -- filter by tags (comma-separated, AND logic)
     &sort=published_at|updated_at|title    -- sort order
     &page=1&per_page=20                    -- pagination

GET  /api/v1/kb/articles/:slug              -- get single article (published only)

GET  /api/v1/kb/articles/:slug/versions     -- version history (list)

GET  /api/v1/kb/articles/:slug/versions/:v  -- specific version content

GET  /api/v1/kb/articles/:slug/diff         -- diff between versions
     ?from=2&to=5                           -- version numbers

GET  /api/v1/kb/topics                      -- list all topics (hierarchical tree)

GET  /api/v1/kb/topics/:slug                -- topic detail with article list

GET  /api/v1/kb/articles/:slug/comments     -- list discussion comments (threaded)

# Export
GET  /api/v1/kb/articles/:slug/export?format=pdf    -- download article as PDF
GET  /api/v1/kb/articles/:slug/export?format=md      -- download article as Markdown
GET  /api/v1/kb/topics/:slug/export?format=pdf       -- download topic as ZIP of PDFs
GET  /api/v1/kb/topics/:slug/export?format=md        -- download topic as ZIP of Markdown
GET  /api/v1/kb/collections/:id/export?format=pdf    -- download collection as ZIP of PDFs (auth)
GET  /api/v1/kb/collections/:id/export?format=md     -- download collection as ZIP of Markdown (auth)
```

### 7.2 Authenticated User

```
POST   /api/v1/kb/favorites/:articleId      -- add favorite
DELETE /api/v1/kb/favorites/:articleId       -- remove favorite
GET    /api/v1/kb/favorites                 -- list my favorites

POST   /api/v1/kb/collections               -- create collection
GET    /api/v1/kb/collections               -- list my collections
GET    /api/v1/kb/collections/:id           -- get collection with articles
PATCH  /api/v1/kb/collections/:id           -- update collection (name, description, public)
DELETE /api/v1/kb/collections/:id           -- delete collection
POST   /api/v1/kb/collections/:id/articles  -- add article to collection
DELETE /api/v1/kb/collections/:id/articles/:articleId -- remove article

GET    /api/v1/kb/collections/shared/:token -- get public collection by share token (no auth required)

POST   /api/v1/kb/subscriptions             -- subscribe to article or topic
DELETE /api/v1/kb/subscriptions/:id         -- unsubscribe
GET    /api/v1/kb/subscriptions             -- list my subscriptions

POST   /api/v1/kb/articles/:slug/comments   -- add comment
PATCH  /api/v1/kb/comments/:id              -- edit own comment
DELETE /api/v1/kb/comments/:id              -- delete own comment
```

### 7.3 Admin (Admin Role Required)

```
POST   /api/v1/admin/kb/articles            -- create article
PATCH  /api/v1/admin/kb/articles/:id        -- update article
POST   /api/v1/admin/kb/articles/:id/publish   -- publish (draft -> published)
POST   /api/v1/admin/kb/articles/:id/unpublish -- unpublish (published -> draft)
POST   /api/v1/admin/kb/articles/:id/archive   -- archive
POST   /api/v1/admin/kb/articles/:id/rollback/:version -- rollback to version

POST   /api/v1/admin/kb/topics              -- create topic
PATCH  /api/v1/admin/kb/topics/:id          -- update topic
DELETE /api/v1/admin/kb/topics/:id          -- delete topic (must be empty)
POST   /api/v1/admin/kb/topics/:id/merge/:targetId -- merge topic into target

GET    /api/v1/admin/kb/comments            -- all comments (moderation view)
PATCH  /api/v1/admin/kb/comments/:id        -- moderate comment (hide, delete, restore)

POST   /api/v1/admin/kb/articles/:id/reembed    -- re-embed single article
POST   /api/v1/admin/kb/reembed-all             -- re-embed all published articles
GET    /api/v1/admin/kb/articles/:id/chunks     -- preview chunks for an article

GET    /api/v1/admin/kb/health              -- content health dashboard data
```

---

## 8. RAG Sync Pipeline (Detail)

This section provides implementation detail beyond the overview in section 3.

### 8.1 Trigger Mechanisms

| Event | Trigger | Action |
|-------|---------|--------|
| Article published (first time) | Go API publish handler | Chunk + embed + insert into `rag_chunks` |
| Article updated (new version) | Go API update handler | Delete old chunks + chunk + embed + insert |
| Article archived | Go API archive handler | Delete chunks from `rag_chunks` |
| Article unarchived / re-published | Go API publish handler | Chunk + embed + insert (same as first publish) |
| Admin triggers re-embed | Go API re-embed handler | Delete old chunks + chunk + embed + insert |
| Admin triggers re-embed-all | Go API re-embed-all handler | Queued background job: process all published articles |

### 8.2 Chunking Rules

1. Split content at H2 (`##`) boundaries. Each H2 section is one chunk.
2. If no H2 headings exist, the entire article is one chunk.
3. Prepend the article title to each chunk as context: `"# {title}\n\n## {section_heading}\n\n{section_content}"`.
4. Include the article summary as the first chunk (before any H2 sections) if it exists.
5. Target chunk size: 500-1000 tokens. If an H2 section exceeds 1500 tokens, split further at H3 boundaries. If still too large, split at paragraph boundaries.
6. Preserve tables, lists, and code blocks intact within chunks where possible.
7. No overlap between chunks (unlike general RAG guidance) — KB articles have clear section boundaries that provide sufficient context.

### 8.3 Re-embedding Queue

Full re-embedding (`/admin/kb/reembed-all`) is a background job:

1. Enqueue all published articles.
2. Process sequentially (respect OpenAI rate limits).
3. Progress tracked: `{ total: 150, completed: 42, failed: 0 }`.
4. Admin dashboard shows progress.
5. Failed articles are retried once, then flagged for manual review.
6. Estimated time: ~1 second per article (embedding API latency dominates).

---

## 9. Spoke Offline Access (Detail)

### 9.1 What Syncs

| Data | Storage on Spoke | Format |
|------|-------------------|--------|
| Published articles (content) | SQLite | Full Markdown + metadata (title, slug, topic, doc_type, tags, version) |
| Topics | SQLite | Full topic tree |
| RAG chunks | sqlite-vec | Embedded vectors + metadata |
| Favorites | SQLite | User's favorited article IDs |
| Collections | SQLite | User's collections with article references |

### 9.2 Sync Protocol

1. Spoke sends last sync timestamp to hub.
2. Hub returns articles where `updated_at > last_sync` or `status` changed.
3. For each changed article:
   - If `status = 'published'`: upsert article content and metadata in spoke SQLite. Upsert RAG chunks in sqlite-vec.
   - If `status = 'archived'` or `status = 'draft'`: delete article and its chunks from spoke.
4. Spoke updates its sync timestamp.

### 9.3 Topic Filtering

Spoke configuration includes an optional topic filter:

```json
{
  "kb_sync": {
    "topics": ["navigation", "weather", "safety"],
    "sync_all": false
  }
}
```

When `sync_all` is false, only articles belonging to the listed topics (and their children) are synced. This saves storage and bandwidth on constrained spoke hardware.

### 9.4 Offline Reading

- Articles are rendered from SQLite-stored Markdown using a local Markdown renderer.
- Table of contents generated locally from headings.
- No images that require network access (images should be inlined as base64 or served from synced local storage).
- Search uses SQLite FTS5 for full-text search over synced articles.

---

## 10. Content Workflow

### 10.1 Article Lifecycle

```
  ┌──────┐    ┌───────────┐    ┌──────────┐
  │ Draft │───>│ Published │───>│ Archived │
  └──────┘    └───────────┘    └──────────┘
     ^              │                 │
     │              │  (unpublish)    │
     └──────────────┘                 │
     ^                                │
     │            (unarchive)         │
     └────────────────────────────────┘
```

| Transition | Actor | Side Effects |
|------------|-------|-------------|
| Draft -> Published | Author | Version incremented, version record created, RAG chunks generated, subscribers notified, `published_at` set |
| Published -> Published (edit) | Author | New version, RAG re-chunked, subscribers notified |
| Published -> Draft (unpublish) | Author | RAG chunks deleted |
| Published -> Archived | Author | RAG chunks deleted |
| Archived -> Draft (unarchive) | Author | None (must be re-published to re-enter RAG) |

---

## 11. Search

### 11.1 Server-Side (PostgreSQL tsvector)

Used for dynamic queries via the Go API.

**Index:** GIN index on `to_tsvector('english', title || summary || content)`.

**Ranking:** `ts_rank_cd` with weights:
- Title: weight A (highest)
- Tags: weight B (joined as text for tsvector)
- Summary: weight C
- Content: weight D (lowest)

**Query:** `plainto_tsquery('english', user_input)` for simple queries, `websearch_to_tsquery` for advanced syntax (AND, OR, NOT, phrase).

**Results:** Title, summary, topic name, doc type badge, reading time. Search terms highlighted via `ts_headline`.

### 11.2 Client-Side (Pagefind)

Used for fast, no-server-needed search on the static site.

- Built at compile time by Astro's Pagefind integration.
- Indexes all published KB articles.
- Provides instant results as the user types.
- Falls back to server-side search for complex queries or when Pagefind index is stale.

---

## 12. Dependencies

| Dependency | Role |
|------------|------|
| Supabase PostgreSQL | Articles, versions, favorites, collections, subscriptions, comments |
| pgvector (PostgreSQL extension) | RAG chunk storage and vector similarity search |
| pg_trgm (PostgreSQL extension) | Fuzzy text matching for search suggestions |
| Go API server (`packages/api/`) | CRUD endpoints, search, RAG pipeline (chunking, embedding, storage), notification dispatch |
| OpenAI API (text-embedding-3-small) | Embedding generation for RAG chunks |
| Ollama + nomic-embed-text (spoke) | Local embedding for offline RAG queries |
| sqlite-vec (spoke) | Offline vector search |
| SQLite FTS5 (spoke) | Offline full-text search |
| Umami | Article view analytics (privacy-respecting, self-hosted) |
| Email service | Subscription notifications |
| Pagefind | Client-side search index |
| Tailwind CSS | Styling |
| Ant Design 5 | Admin UI components (editor, tables, forms, modals) |

---

## 13. Open Questions

**MDX vs plain Markdown.** Should articles support MDX (Markdown with embedded React components)? MDX enables interactive examples — a VHF channel selector, a tidal curve visualiser, a wiring diagram with clickable components. But MDX complicates RAG chunking because React components are not plain text. The current approach: store plain Markdown, which is cleanly chunkable for RAG. If MDX is needed later, the RAG pipeline would strip JSX tags before chunking, embedding only the text content.

**Admin Markdown editor.** Should the admin interface use a custom Markdown editor or integrate an existing one? Candidates: Milkdown (Markdown-native, plugin-based), Tiptap (ProseMirror-based, rich), or a simple textarea with preview pane. The editor must support: live preview, keyboard shortcuts, image upload, and table editing. It does not need to be WYSIWYG — the author is comfortable with Markdown.

**Regional content.** How to handle content that differs by region (e.g., VHF procedures differ between UK, US, and Mediterranean; anchoring regulations vary by country)? Options: (a) separate articles per region with tags, (b) a single article with clearly marked regional sections, (c) article variants (same base content with regional overrides). Option (b) is simplest for RAG — a single article with H2 sections per region chunks cleanly. Option (a) is simplest for readers. Decision deferred to first concrete case.

**Collection sharing scope.** Should shareable collections be a first-class social feature (discoverable, followable, curated reading lists) or a lightweight private tool (share a link with a friend)? Start with lightweight sharing (URL with share token). Evaluate whether to add discovery and following based on usage.

**Comment moderation integration.** The KB comment moderation system should share infrastructure with the forum moderation system (same flagging, same review queue, same admin tools). This is an implementation concern — the data model supports it via the shared `status` field pattern, but the admin UI should present a unified moderation queue across forums and KB comments.

**Notification batching.** When multiple articles are updated in quick succession (e.g., the author updates ten articles in a topic), subscribers should receive a single batched notification rather than ten individual ones. The Go API should coalesce notifications within a configurable window (e.g., 15 minutes).
