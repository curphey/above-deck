# Knowledge Base v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a filesystem-driven Knowledge Base where `/docs/` folder structure IS the navigation, with full article reading, search, inline commenting, edit mode, and a dashboard — all accessible from the main site at `/knowledge`.

**Architecture:** The KB reads markdown files from `/docs/` at build time using Astro content collections. The folder hierarchy under `/docs/` drives the sidebar navigation automatically. Articles render as full pages with a persistent sidebar. Comments are stored in Supabase. Edit mode provides a markdown editor for the author.

**Tech Stack:** Astro 5 (SSR), React 19 islands, Tailwind CSS, Ant Design 5, Supabase (comments + auth), MapLibre (none needed here)

**Phases:**
- Phase 1 (this plan): Filesystem-driven sidebar nav + article reading + search + standalone KB pages
- Phase 2: Inline commenting (Supabase)
- Phase 3: Edit mode + dashboard
- Phase 4: Draft/publish workflow

---

## Phase 1: Filesystem-Driven KB with Reading Experience

### Scope
- Reorganize `/docs/` into 5 purpose-based folders
- Build Astro content collection that reads from `/docs/` (not `/packages/site/src/content/knowledge/`)
- Build standalone KB pages at `/knowledge` with left sidebar navigation
- Full article rendering with TOC, breadcrumbs, prev/next
- Client-side search (Pagefind or simple JS filter)
- Learning/Building filter
- Mobile responsive
- Update ScreenKnowledge in the landing page to link to `/knowledge`

### File Structure

```
docs/                                    # SOURCE OF TRUTH — filesystem drives nav
  learning/                              # 🎓 Sailing Learning
    electrical/
      understanding-12v-systems.md
      12v-vs-24v-systems.md
      electrical-system-components.md
      lithium-battery-technologies.md
      solar-sizing-guide.md
      alternator-charging.md
    navigation/
      understanding-electronic-charts.md
      ais-explained.md
    weather-tides/
      weather-data-sources.md
      tidal-prediction-basics.md
    seamanship/
      passage-planning-guide.md
      safety-equipment-checklist.md
      provisioning-for-passages.md
      watermaker-basics.md
      diesel-engine-maintenance.md
      caribbean-cruising-guide.md
  research/                              # 🔬 Technical Research (already exists)
    hardware/
    data-and-apis/
    navigation-and-weather/
    domain/
  market/                                # 📊 Market Analysis
    competitive/                         # (move from research/competitive/)
  product/                               # 📐 Product Design
    vision/
      above-deck-product-vision-v2.md
      above-deck-technical-architecture.md
    features/                            # (move from features/)
      boat-systems/
      underway/
      platform/
      site/
  engineering/                           # ⚙️ Engineering (already exists)
    engineering-standards.md
    tech-stack/
    ci-cd/
    testing/
    ...

packages/site/src/
  content.config.ts                      # MODIFY — new collection reading from /docs/
  pages/
    knowledge/
      index.astro                        # REWRITE — dashboard landing
      [...slug].astro                    # REWRITE — article page with sidebar
  components/
    knowledge/
      KBSidebar.tsx                      # NEW — React island, filesystem tree nav
      KBSearch.tsx                       # NEW — React island, client-side search
      KBArticle.astro                    # NEW — article rendering component
      KBBreadcrumb.astro                 # NEW — breadcrumb from folder path
    landing/
      ScreenKnowledge.astro              # MODIFY — link to /knowledge instead of inline
  lib/
    kb.ts                                # NEW — KB utilities (tree building, search index)
```

---

### Task 1: Reorganize /docs/ into purpose-based folders

**Files:**
- Move: `docs/research/competitive/` → `docs/market/competitive/`
- Move: `docs/features/` → `docs/product/features/`
- Move: `docs/above-deck-product-vision-v2.md` → `docs/product/vision/product-vision.md`
- Move: `docs/above-deck-technical-architecture.md` → `docs/product/vision/technical-architecture.md`
- Create: `docs/learning/` with subdirectories
- Move: existing learning articles from `packages/site/src/content/knowledge/` → `docs/learning/`

- [ ] **Step 1: Create the learning folder structure**

```bash
mkdir -p docs/learning/{electrical,navigation,weather-tides,seamanship}
```

- [ ] **Step 2: Move learning articles from content/knowledge/ to docs/learning/**

Move the original sailing articles (not research-* or eng-* or spec-*) to their topic folders under docs/learning/. These are the .mdx/.md files like `understanding-12v-systems.md`, `ais-explained.mdx`, `solar-sizing-guide.mdx`, etc. Strip the Astro content collection frontmatter and use simple markdown frontmatter (title, summary, tags).

- [ ] **Step 3: Create market folder and move competitive research**

```bash
mkdir -p docs/market
mv docs/research/competitive docs/market/competitive
```

- [ ] **Step 4: Create product folder and move vision + features**

```bash
mkdir -p docs/product/vision
mv docs/above-deck-product-vision-v2.md docs/product/vision/product-vision.md
mv docs/above-deck-technical-architecture.md docs/product/vision/technical-architecture.md
mv docs/features docs/product/features
```

- [ ] **Step 5: Verify the new structure**

```bash
find docs/ -maxdepth 3 -type d | sort
```

Expected: 5 top-level purpose folders (learning, research, market, product, engineering) each with topic subfolders.

- [ ] **Step 6: Commit**

```bash
git add -A docs/
git commit -m "docs: reorganize into purpose-based folder structure (learning, research, market, product, engineering)"
```

---

### Task 2: Build content collection that reads from /docs/

**Files:**
- Modify: `packages/site/src/content.config.ts`
- Create: `packages/site/src/lib/kb.ts`

- [ ] **Step 1: Write test for KB tree builder**

Create `packages/site/src/lib/__tests__/kb.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildTree, type KBNode } from '../kb';

describe('buildTree', () => {
  it('builds a tree from flat file paths', () => {
    const files = [
      { path: 'learning/electrical/12v-systems.md', title: '12V Systems', slug: 'learning/electrical/12v-systems' },
      { path: 'learning/electrical/24v-systems.md', title: '24V Systems', slug: 'learning/electrical/24v-systems' },
      { path: 'research/hardware/can-bus.md', title: 'CAN Bus', slug: 'research/hardware/can-bus' },
    ];
    const tree = buildTree(files);
    expect(tree).toHaveLength(2); // learning, research
    expect(tree[0].name).toBe('learning');
    expect(tree[0].children[0].name).toBe('electrical');
    expect(tree[0].children[0].articles).toHaveLength(2);
  });

  it('filters by purpose', () => {
    const files = [
      { path: 'learning/electrical/12v.md', title: '12V', slug: 'learning/electrical/12v', purpose: 'learning' },
      { path: 'research/hardware/can.md', title: 'CAN', slug: 'research/hardware/can', purpose: 'building' },
    ];
    const tree = buildTree(files, 'learning');
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('learning');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/site && pnpm vitest run src/lib/__tests__/kb.test.ts
```

- [ ] **Step 3: Implement kb.ts**

Create `packages/site/src/lib/kb.ts`:

```typescript
export interface KBArticle {
  path: string;
  slug: string;
  title: string;
  summary?: string;
  tags?: string[];
  purpose?: 'learning' | 'building' | 'both';
}

export interface KBNode {
  name: string;
  path: string;
  children: KBNode[];
  articles: KBArticle[];
}

const PURPOSE_META: Record<string, { label: string; icon: string; purpose: 'learning' | 'building' }> = {
  learning: { label: 'Sailing Learning', icon: '🎓', purpose: 'learning' },
  research: { label: 'Technical Research', icon: '🔬', purpose: 'building' },
  market: { label: 'Market Analysis', icon: '📊', purpose: 'building' },
  product: { label: 'Product Design', icon: '📐', purpose: 'building' },
  engineering: { label: 'Engineering', icon: '⚙️', purpose: 'building' },
};

export function getPurposeMeta(key: string) {
  return PURPOSE_META[key];
}

export function buildTree(files: KBArticle[], filter?: string): KBNode[] {
  const root: Record<string, KBNode> = {};

  for (const file of files) {
    // Apply filter
    if (filter === 'learning' && file.purpose !== 'learning' && file.purpose !== 'both') continue;
    if (filter === 'building' && file.purpose !== 'building' && file.purpose !== 'both') continue;

    const parts = file.path.split('/');
    const purposeKey = parts[0];
    const topicKey = parts.length > 2 ? parts[1] : null;

    if (!root[purposeKey]) {
      root[purposeKey] = { name: purposeKey, path: purposeKey, children: [], articles: [] };
    }

    if (topicKey) {
      let topic = root[purposeKey].children.find(c => c.name === topicKey);
      if (!topic) {
        topic = { name: topicKey, path: `${purposeKey}/${topicKey}`, children: [], articles: [] };
        root[purposeKey].children.push(topic);
      }
      topic.articles.push(file);
    } else {
      root[purposeKey].articles.push(file);
    }
  }

  return Object.values(root);
}

export function slugToTitle(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd packages/site && pnpm vitest run src/lib/__tests__/kb.test.ts
```

- [ ] **Step 5: Update content.config.ts to define a docs collection**

Modify `packages/site/src/content.config.ts` to add a `docs` collection that reads from the project root `/docs/` directory. Keep the existing `knowledge` collection for backward compatibility during migration.

```typescript
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../../docs' }),
  schema: z.object({
    title: z.string().optional(),
    summary: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional(),
    date: z.string().optional(),
    status: z.string().optional(),
  }),
});

// Keep knowledge collection during migration
const knowledge = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    category: z.enum(['electrical','protocols','navigation','weather','passage','hardware','market','engineering']),
    subcategory: z.string().optional(),
    keyTopics: z.array(z.string()).default([]),
    difficulty: z.enum(['beginner','intermediate','advanced']).default('beginner'),
    sortOrder: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

export const collections = { docs, knowledge };
```

- [ ] **Step 6: Commit**

```bash
git add packages/site/src/lib/kb.ts packages/site/src/lib/__tests__/kb.test.ts packages/site/src/content.config.ts
git commit -m "feat: add KB tree builder and docs content collection"
```

---

### Task 3: Build the KB sidebar component

**Files:**
- Create: `packages/site/src/components/knowledge/KBSidebar.tsx`

- [ ] **Step 1: Create the sidebar React component**

Build a React island component that renders the 3-level folder tree. It receives the tree data as a serialized prop (built at SSR time by Astro). Handles: expand/collapse, active article highlighting, search filtering, learning/building filter.

```typescript
// packages/site/src/components/knowledge/KBSidebar.tsx
import { useState, useMemo } from 'react';
import type { KBNode, KBArticle } from '../../lib/kb';

interface Props {
  tree: KBNode[];
  currentSlug?: string;
  purposeMeta: Record<string, { label: string; icon: string }>;
}

export function KBSidebar({ tree, currentSlug, purposeMeta }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'learning' | 'building'>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set([tree[0]?.path || '']));

  // Filter and search logic
  const filteredTree = useMemo(() => {
    return tree
      .map(purpose => ({
        ...purpose,
        children: purpose.children
          .map(topic => ({
            ...topic,
            articles: topic.articles.filter(a =>
              (!search || a.title.toLowerCase().includes(search.toLowerCase())) &&
              (filter === 'all' || a.purpose === filter || a.purpose === 'both')
            ),
          }))
          .filter(t => t.articles.length > 0),
      }))
      .filter(p => p.children.length > 0 || p.articles.length > 0);
  }, [tree, search, filter]);

  const toggle = (path: string) => {
    const next = new Set(expanded);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setExpanded(next);
  };

  return (
    <nav className="kb-sidebar">
      <div className="kb-sidebar-header">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="kb-search"
        />
        <div className="kb-filters">
          {(['all', 'learning', 'building'] as const).map(f => (
            <button
              key={f}
              className={`kb-filter ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'learning' ? '🎓 Learning' : '🔧 Building'}
            </button>
          ))}
        </div>
      </div>
      <div className="kb-tree">
        {filteredTree.map(purpose => {
          const meta = purposeMeta[purpose.name] || { label: purpose.name, icon: '📄' };
          const isOpen = expanded.has(purpose.path);
          return (
            <div key={purpose.path} className="kb-purpose">
              <div className="kb-purpose-hdr" onClick={() => toggle(purpose.path)}>
                <span className={`kb-arrow ${isOpen ? 'open' : ''}`}>▶</span>
                <span>{meta.icon}</span>
                <span className="kb-purpose-label">{meta.label}</span>
              </div>
              {isOpen && purpose.children.map(topic => {
                const tOpen = expanded.has(topic.path);
                return (
                  <div key={topic.path} className="kb-topic">
                    <div className="kb-topic-hdr" onClick={() => toggle(topic.path)}>
                      <span className={`kb-arrow small ${tOpen ? 'open' : ''}`}>▶</span>
                      <span className="kb-topic-label">{topic.name.replace(/-/g, ' ')}</span>
                    </div>
                    {tOpen && topic.articles.map(art => (
                      <a
                        key={art.slug}
                        href={`/knowledge/${art.slug}`}
                        className={`kb-article-link ${currentSlug === art.slug ? 'active' : ''}`}
                      >
                        {art.title}
                      </a>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/site/src/components/knowledge/KBSidebar.tsx
git commit -m "feat: add KB sidebar React component with search and filter"
```

---

### Task 4: Build the KB page layout and routes

**Files:**
- Rewrite: `packages/site/src/pages/knowledge/index.astro`
- Rewrite: `packages/site/src/pages/knowledge/[...slug].astro`
- Create: `packages/site/src/layouts/KBLayout.astro`

- [ ] **Step 1: Create KBLayout.astro**

A layout with the persistent sidebar on the left and content area on the right. The sidebar is a React island (`client:load`). The content area is server-rendered.

- [ ] **Step 2: Rewrite the knowledge index page**

The index page (`/knowledge`) shows the dashboard: drafts in progress, recent comments, recently updated articles, your activity.

- [ ] **Step 3: Rewrite the article page**

The article page (`/knowledge/[...slug]`) renders the article with the sidebar persistent, breadcrumbs, TOC, prev/next navigation, and metadata (tags, reading time, version).

- [ ] **Step 4: Test by running the dev server**

```bash
pnpm dev
```

Navigate to `http://localhost:4321/knowledge` — verify sidebar shows the folder tree from `/docs/`. Click an article — verify it renders with sidebar persistent.

- [ ] **Step 5: Commit**

```bash
git add packages/site/src/pages/knowledge/ packages/site/src/layouts/KBLayout.astro
git commit -m "feat: add KB layout and pages with filesystem-driven sidebar"
```

---

### Task 5: Style the KB with Tailwind + project brand

**Files:**
- Create or modify: `packages/site/src/styles/knowledge.css`
- Modify: KB components to use Tailwind classes matching the brand (Space Mono headings, Inter body, bordered sidebar, blueprint aesthetic on light background)

- [ ] **Step 1: Style the sidebar** — 260px, white background, right border, collapsible tree, search input, filter pills
- [ ] **Step 2: Style the article view** — max-width 780px, reading typography, heading borders, table styling, code blocks
- [ ] **Step 3: Style the dashboard** — 2-column grid of panels
- [ ] **Step 4: Test responsive** — sidebar collapses on mobile, article goes full-width
- [ ] **Step 5: Commit**

---

### Task 6: Update landing page ScreenKnowledge

**Files:**
- Modify: `packages/site/src/components/landing/ScreenKnowledge.astro`

- [ ] **Step 1: Simplify ScreenKnowledge to link to /knowledge**

Instead of rendering all articles inline in the device frame, show a preview with a "View Knowledge Base →" link that opens `/knowledge` in a new layout (outside the device frame).

- [ ] **Step 2: Commit**

---

### Task 7: Clean up old content collection

**Files:**
- Remove: `packages/site/src/content/knowledge/` (all 97 files — content now served from /docs/)
- Modify: `packages/site/src/content.config.ts` — remove old `knowledge` collection

- [ ] **Step 1: Remove old KB content files**
- [ ] **Step 2: Remove old collection from config**
- [ ] **Step 3: Verify /knowledge still works (served from /docs/ now)**
- [ ] **Step 4: Commit**

---

## Phase 2: Inline Commenting (separate plan)
- Supabase table for comments (anchored to text ranges)
- Comment rail React component
- Text selection → comment popup
- Thread UI with replies

## Phase 3: Edit Mode (separate plan)
- Markdown editor (textarea with toolbar)
- Save via API (writes back to filesystem or Supabase)
- Comment resolution workflow

## Phase 4: Dashboard & Draft Workflow (separate plan)
- Dashboard panels (drafts, recent comments, recently updated, activity)
- Draft/published status in frontmatter
- Draft articles visible to author only
