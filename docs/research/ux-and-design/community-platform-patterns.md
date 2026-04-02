# Community-First Web Platform: Research & Recommendations

**Date:** 2026-03-09
**Status:** Research Complete

---

## Table of Contents

1. [GitHub & Google Authentication](#1-authentication-github--google-oauth)
2. [Blog/Vlog Platform Patterns](#2-blogvlog-platform-patterns)
3. [Forum & Discussion Platforms](#3-forumdiscussion-platforms)
4. [WhatsApp Group Integration](#4-whatsapp-group-integration)
5. [Knowledge Base Patterns](#5-knowledge-base-patterns)
6. [Build Order Recommendation](#6-what-to-build-first)

---

## 1. Authentication: GitHub & Google OAuth

### Architecture: Astro + React + Supabase

Supabase handles OAuth natively for both GitHub and Google. The implementation pattern is identical for both providers -- you just swap the provider string.

### Implementation Pattern

**1. Supabase Client Setup (PKCE flow required for SSR):**

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_ANON_KEY,
  {
    auth: {
      flowType: "pkce", // Required for server-side auth
    },
  }
);
```

**2. Multi-Provider Sign-In Endpoint:**

```typescript
// src/pages/api/auth/signin.ts
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const provider = formData.get("provider")?.toString();
  const validProviders = ["google", "github", "discord"];

  if (provider && validProviders.includes(provider)) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo: `${import.meta.env.SITE_URL}/api/auth/callback`,
      },
    });
    if (error) return new Response(error.message, { status: 500 });
    return redirect(data.url);
  }
};
```

**3. Callback Handler:**

```typescript
// src/pages/api/auth/callback.ts
export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const authCode = url.searchParams.get("code");
  if (!authCode) return new Response("No code provided", { status: 400 });

  const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);
  if (error) return new Response(error.message, { status: 500 });

  const { access_token, refresh_token } = data.session;
  cookies.set("sb-access-token", access_token, { path: "/", httpOnly: true, secure: true });
  cookies.set("sb-refresh-token", refresh_token, { path: "/", httpOnly: true, secure: true });
  return redirect("/dashboard");
};
```

### GitHub OAuth Scopes

For a community platform, you need minimal scopes:

| Scope | Purpose | Needed? |
|-------|---------|---------|
| `user:email` | Access user's email address | Yes (default) |
| `read:user` | Read user profile data | Yes (default) |
| `repo` | Access private repos | No |
| `read:org` | Read org membership | No |

Supabase requests `user:email` by default, which is sufficient for authentication. You do NOT need repo or org scopes for a community site.

### GitHub vs Google Auth Comparison

| Factor | GitHub | Google |
|--------|--------|--------|
| Audience | Developers, technical users | Everyone |
| Setup complexity | Identical via Supabase | Identical via Supabase |
| Email reliability | May need `user:email` scope | Always provides email |
| Profile data | Username, avatar, bio | Name, avatar, email |
| Trust signal | Strong for dev community | Universal |

### Recommendation

**Support both GitHub and Google.** GitHub signals "this is a developer-friendly community" while Google ensures non-technical sailors can still sign up. Supabase makes supporting multiple providers trivial -- it's the same code with a different provider string. Consider adding email/password as a third option for users who prefer not to use OAuth.

### Setup Steps in Supabase Dashboard

1. Go to Authentication > Providers
2. Enable GitHub: Create OAuth App at github.com/settings/developers, set callback to `https://<project-id>.supabase.co/auth/v1/callback`
3. Enable Google: Create OAuth credentials in Google Cloud Console, same callback pattern
4. Both providers are handled by the same callback endpoint in your Astro app

---

## 2. Blog/Vlog Platform Patterns

### MDX-Powered Blog with Astro

Astro's content collections are purpose-built for MDX blogs. The architecture:

**Content Collection Config:**

```typescript
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    youtubeId: z.string().optional(),
    tags: z.array(z.string()),
    category: z.enum(['sailing', 'tech', 'community', 'how-to']),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    author: z.string(),
  }),
});

export const collections = { blog };
```

### YouTube Embed Best Practices

Use the `astro-embed` package for performance-optimized YouTube embeds:

```bash
npm install astro-embed
```

```mdx
---
title: "How to Read a Tide Chart"
youtubeId: "xtTy5nKay_Y"
---
import { YouTube } from 'astro-embed';

<YouTube id={frontmatter.youtubeId} />
```

Key benefits of `astro-embed`:
- **Lazy loading** -- no iframe until user interacts (saves bandwidth)
- **Static thumbnail** -- renders a clickable thumbnail at build time
- **No JavaScript needed** for initial render
- Works in both `.astro` and `.mdx` files

For a vlog-heavy site, consider a dedicated "Watch" section that queries posts with `youtubeId` set, separate from text-heavy blog posts.

### RSS Feed Generation

Astro has built-in RSS support via `@astrojs/rss`:

```typescript
// src/pages/rss.xml.ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog');
  return rss({
    title: 'Above Deck',
    description: 'Sailing community and knowledge platform',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.id}/`,
    })),
  });
}
```

**Gotcha with MDX in RSS:** Astro v5 changed content rendering. For full MDX content in RSS feeds, use the Container API (introduced in Astro 4.9). For launch, description-only RSS is simpler and sufficient.

### Newsletter Integration Approaches

| Approach | Complexity | Cost |
|----------|-----------|------|
| **Buttondown** | Low -- simple API, markdown-native | Free for < 100 subs |
| **ConvertKit** | Medium -- powerful automation | Free for < 1000 subs |
| **RSS-to-Email** (RssFeedPulse, Mailchimp RSS) | Lowest -- auto-sends from RSS | Varies |
| **Resend + React Email** | High -- full control | Pay per email |

**Recommendation:** Start with **Buttondown** (markdown-native, developer-friendly, free tier). Add a simple subscription form component. If the audience grows past 1000, evaluate ConvertKit for automation sequences.

---

## 3. Forum & Discussion Platforms

### Option Comparison

| Option | Cost | Effort | Best For |
|--------|------|--------|----------|
| **GitHub Discussions** | Free | Zero | Developer-centric community |
| **Discourse** | $50-100/mo hosted, or self-host | Medium | Large, structured communities |
| **Built-in (custom)** | Dev time | High | Full brand control |
| **Project Kamp model** | Dev time | High | Research-oriented community |

### GitHub Discussions (Recommended for Launch)

**Pros:**
- Zero cost, zero infrastructure
- Members already have GitHub accounts (your target audience)
- Built-in categories, labels, Q&A format, polls
- Markdown support with code blocks
- Tight integration with your codebase
- SEO-indexed by Google

**Cons:**
- Requires GitHub account (barrier for non-technical sailors)
- Limited customization
- No real-time chat feel
- Can't embed in your site (link out only)

**Implementation:** Add a prominent "Community" nav link pointing to `github.com/org/repo/discussions`. Create categories: General, Sailing Questions, Tech Help, Feature Requests, Show & Tell.

### What Project Kamp Does

Project Kamp (community.projectkamp.com) built a custom React + Supabase platform with:
- **Research module** -- community-driven research with voting
- **Academy module** -- structured educational content
- **User profiles** with badges and roles
- **Voting/rating system** on content
- **Role-based access** (admin, research creator, member)

This is the "build it yourself" path. It gives maximum control but requires significant development effort. Their stack (React + Supabase) aligns with the proposed Above Deck stack.

### What Makes Forums Succeed vs Fail for Small Communities

**Success Factors:**
1. **Warm start** -- seed with content BEFORE inviting members. An empty forum is a dead forum.
2. **First-week engagement** -- members who participate in week one are significantly more likely to stay (up to 40% higher retention with good onboarding).
3. **Recognition systems** -- badges, milestones, leaderboards increase retention by up to 30%.
4. **Member-led contributions** -- the community is healthy when members help each other without admin intervention.
5. **Clear value proposition** -- why come HERE instead of Reddit, Facebook, or Discord?

**Failure Patterns:**
1. **Ghost town effect** -- launching too early with no content or activity.
2. **Too many channels** -- splitting a small community across too many categories kills engagement.
3. **No search/organization** -- members can't find past discussions.
4. **Admin burnout** -- one person trying to generate all the content.
5. **Platform friction** -- requiring yet another account/app.

### Recommendation

**Phase 1 (Launch):** GitHub Discussions + WhatsApp Group. Zero infrastructure, zero cost, meets users where they already are.

**Phase 2 (Growth, 100+ active members):** Evaluate building a lightweight discussion feature into the site using Supabase, inspired by the Project Kamp model. Or adopt Discourse if the community outgrows GitHub Discussions.

---

## 4. WhatsApp Group Integration

### WhatsApp Options Breakdown

#### 1. WhatsApp Click-to-Chat Links (Recommended)

The simplest approach. Embed a link on your website:

```
https://chat.whatsapp.com/INVITE_CODE
```

Or for direct messaging:
```
https://wa.me/PHONE_NUMBER?text=Hi%20I%20found%20you%20on%20Above%20Deck
```

- No API needed
- No business account needed
- Works immediately
- Can be a simple button/link on your site

#### 2. WhatsApp Business API

Requires Official Business Account (Green Tick). Supports:
- Programmatic group creation (up to 8 participants per group, 10,000 groups)
- Automated messaging and chatbots
- Community management (umbrella structure for multiple groups)

**Verdict:** Overkill for launch. Revisit when you have thousands of members.

#### 3. WhatsApp Communities (Meta's Structure)

A "Community" is an umbrella for multiple groups:
- Announcement channel (admin-only, reaches everyone)
- Thematic sub-groups (members join as needed)
- Single invite link for the community (not individual groups)

**This is the right WhatsApp structure for Above Deck** -- one Community with sub-groups like "Mediterranean Sailing," "Tech & Electronics," "Beginners," etc.

### WhatsApp Channel vs Group vs Community

| Feature | Channel | Group | Community |
|---------|---------|-------|-----------|
| Direction | One-way broadcast | Two-way chat | Both |
| Size limit | Unlimited | 1,024 | Multiple groups |
| Privacy | Followers anonymous | Members see each other | Varies by group |
| Best for | Announcements | Discussion | Organized community |
| Moderation | Admin only posts | All members post | Admin + group admins |

**Recommendation:** Use a **WhatsApp Community** (not Channel, not standalone Group). This gives you broadcast announcements PLUS organized sub-groups for discussion.

### Website Integration

```html
<!-- Simple WhatsApp Community invite button -->
<a href="https://chat.whatsapp.com/COMMUNITY_INVITE_CODE"
   class="whatsapp-btn"
   target="_blank"
   rel="noopener noreferrer">
  Join our WhatsApp Community
</a>
```

You can also generate QR codes for the invite link to display on the site or in printed materials.

### What Sailing Communities Actually Use

Most sailing communities use:
1. **WhatsApp Groups** -- by far the most common (e.g., Caribbean Sailing Association uses WhatsApp)
2. **Facebook Groups** -- second most common, especially for cruising rallies
3. **Discord** -- used by some sailing clubs (e.g., Alaska Sailing Club)
4. **VHF/SSB radio nets** -- still important for offshore communities

WhatsApp dominates because sailors are international, WhatsApp is global, and it works on low-bandwidth connections.

### Alternatives Comparison

| Platform | Strengths | Weaknesses | Sailing Fit |
|----------|-----------|------------|-------------|
| **WhatsApp** | Global, works on bad connections, sailors already use it | Limited organization, no threads | Excellent |
| **Discord** | Channels, threads, bots, voice chat | Requires app, less familiar to non-tech | Good for tech-savvy |
| **Telegram** | Large groups, channels, bots | Less popular than WhatsApp globally | Moderate |
| **Signal** | Privacy-focused | Small user base, limited features | Low |
| **Facebook Groups** | Huge reach, familiar | Declining with younger users, messy UX | Declining |

### Recommendation

**Primary: WhatsApp Community** -- it's where sailors already are.
**Secondary: Discord server** -- for deeper technical discussions and real-time help.
**On the website:** Prominent invite links for both, with WhatsApp featured more prominently.

---

## 5. Knowledge Base Patterns

### Content Architecture with Astro MDX Collections

```
src/content/
  knowledge/
    electrical/
      understanding-12v-systems.mdx
      battery-types-compared.mdx
      solar-panel-sizing.mdx
    navigation/
      reading-charts.mdx
      weather-routing-basics.mdx
      radar-and-ais.mdx
    seamanship/
      anchoring-techniques.mdx
      heavy-weather-sailing.mdx
      man-overboard-procedures.mdx
    maintenance/
      engine-maintenance-101.mdx
      bottom-paint-guide.mdx
      rigging-inspection.mdx
```

**Collection Schema:**

```typescript
const knowledge = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/knowledge' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['electrical', 'navigation', 'seamanship', 'maintenance', 'provisioning', 'communication']),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    tags: z.array(z.string()),
    prerequisites: z.array(z.string()).optional(), // IDs of prerequisite articles
    estimatedReadTime: z.number(), // minutes
    lastVerified: z.coerce.date(), // when content was last fact-checked
    contributors: z.array(z.string()),
    // RAG-optimized fields
    summary: z.string().max(500), // concise summary for embedding
    keyTopics: z.array(z.string()), // explicit topic tags for retrieval
  }),
});
```

### Search Implementation: Pagefind

Pagefind is the standard for Astro static sites -- client-side, zero-server, tiny bandwidth:

```bash
npm install astro-pagefind
```

```typescript
// astro.config.mjs
import pagefind from 'astro-pagefind';

export default defineConfig({
  integrations: [pagefind()],
});
```

Features:
- Full-text search across all content at build time
- Content weighting (boost certain sections in results)
- Filtering by tags, categories, difficulty
- Works entirely client-side (no server, no API keys)
- Search index is ~1-3% of site size

For tag-based navigation, build category/tag index pages using `getCollection()` with filters.

### Progressive Difficulty Levels

Model after Victron Energy's training structure:

**Level Structure:**
| Level | Audience | Content Type |
|-------|----------|-------------|
| **Beginner (Level 1)** | New to sailing/cruising | Concepts, terminology, "what is X" articles |
| **Intermediate (Level 2)** | Weekend sailors, charter sailors | How-to guides, comparisons, decision frameworks |
| **Advanced (Level 3)** | Bluewater/liveaboard sailors | Deep technical, system integration, edge cases |

**Victron's Model (What Works Well):**
- Tiered courses: Level 1 (Essentials) -> Level 2 (Configuration) -> Level 3 (System Integration)
- Each level has video + text + exam/quiz
- Certificates of completion for motivation
- Free access builds trust and community
- Specific product/topic modules (not one linear path)

**Adaptation for Above Deck:**
- **Learning Paths:** "Getting Started Cruising," "Electrical Systems," "Navigation & Weather"
- **Progress tracking:** Mark articles as read, track completion percentage
- **Prerequisites:** Article metadata links to what you should read first
- **Certificates/badges:** "Completed Electrical Fundamentals" -- ties into community recognition

### Structuring Content for Future RAG/AI Retrieval

MDX is excellent for RAG because markdown has natural semantic structure. Key principles:

**1. Use Headers as Chunk Boundaries:**
```mdx
## Understanding Battery Types    <-- natural chunk boundary
Lithium batteries have become...

### LiFePO4 vs Lead-Acid         <-- sub-chunk
The key differences are...
```

RAG systems chunk on H2 boundaries. Keep H2 sections self-contained (each should make sense in isolation).

**2. Frontmatter as Metadata:**
The `summary`, `keyTopics`, and `tags` fields in the schema serve double duty: they power site navigation AND provide metadata for vector embeddings.

**3. Keep Paragraphs Short:**
Short, focused paragraphs (3-5 sentences) chunk better than long blocks. Each paragraph should address one idea.

**4. Explicit Context in Each Section:**
Don't rely on the article title for context. Each section should include enough context to be understood in isolation:

```mdx
// BAD for RAG:
## Sizing
You need at least 200Ah.

// GOOD for RAG:
## Sizing a House Battery Bank
For a cruising sailboat's house battery bank, a minimum of 200Ah usable capacity is recommended...
```

**5. Structured Data When Possible:**
Tables, lists, and definition-style content retrieves better than prose:

```mdx
## Battery Chemistry Comparison

| Chemistry | Voltage | Cycles | Weight | Cost |
|-----------|---------|--------|--------|------|
| LiFePO4  | 12.8V   | 3000+  | Light  | $$$  |
| AGM       | 12.6V   | 500    | Heavy  | $$   |
| Gel       | 12.6V   | 700    | Heavy  | $$   |
```

**6. RAG Performance:**
Clean markdown improves RAG retrieval accuracy by up to 35% and reduces token usage by 20-30% compared to unstructured text. The investment in well-structured MDX pays dividends when you add AI features later.

---

## 6. What to Build First

### The Core Problem

You're building a community around a product that doesn't exist yet. The challenge: you need content and people before you have the product. The solution: **lead with value, not with product.**

### Recommended Build Order

#### Phase 0: Foundation (Week 1-2)
**Goal:** Establish presence, start collecting an audience.

- [ ] **Landing page** with clear value proposition ("The sailing platform for modern cruisers")
- [ ] **Email signup** (Buttondown or simple Supabase table) -- "Get notified when we launch"
- [ ] **WhatsApp Community** -- create it, seed with 5-10 friends/contacts who sail
- [ ] **GitHub repo** set up with Discussions enabled

**Why first:** You need somewhere to send people before you build anything else. An email list is your most valuable asset.

#### Phase 1: Content Engine (Week 3-6)
**Goal:** Create reasons for people to visit and share.

- [ ] **Blog with MDX** -- publish 2-3 high-quality articles per week
- [ ] **RSS feed** -- automatic with `@astrojs/rss`
- [ ] **YouTube embeds** for any video content
- [ ] **Basic SEO** -- meta tags, Open Graph, structured data
- [ ] **Social sharing** -- make every article easy to share

**Content strategy:** Write about problems sailors actually Google:
- "Best marine battery for liveaboards 2026"
- "How to set up Starlink on a sailboat"
- "Passage planning tools compared"

**Why second:** Content is the flywheel. Every article is a permanent SEO asset that attracts people to your community. Blog content is also the easiest to produce solo.

#### Phase 2: Community Features (Week 7-10)
**Goal:** Convert visitors into community members.

- [ ] **Authentication** (GitHub + Google via Supabase)
- [ ] **User profiles** -- basic info, boat details, cruising plans
- [ ] **WhatsApp integration** -- prominent invite links on site
- [ ] **Newsletter** -- weekly digest of new content + community updates
- [ ] **GitHub Discussions** -- link prominently from site

**Why third:** You need content to attract people before community features matter. An empty community with great auth is still empty.

#### Phase 3: Knowledge Base (Week 11-16)
**Goal:** Become a reference resource.

- [ ] **Knowledge base structure** with categories and difficulty levels
- [ ] **Pagefind search** implementation
- [ ] **Tag-based navigation** and filtering
- [ ] **Learning paths** -- curated sequences of articles
- [ ] **Contributor system** -- let community members submit content

**Why fourth:** The knowledge base requires significant content volume. By this point you'll have 20+ blog posts that can be reorganized into a structured knowledge base, plus community members who might contribute.

#### Phase 4: Advanced Community (Week 17+)
**Goal:** Deepen engagement.

- [ ] **Built-in discussions** (if GitHub Discussions is outgrown)
- [ ] **Progress tracking** -- mark articles as read, completion badges
- [ ] **Events calendar** -- sailing meetups, webinars
- [ ] **AI features** -- RAG-powered search over knowledge base
- [ ] **Boat profiles** -- detailed pages for member boats with systems/gear

### Key Principle: Content Before Community Before Product

```
Content (blog, knowledge base)
  → attracts visitors via SEO and social sharing
    → converts to email subscribers and WhatsApp members
      → builds community engagement and trust
        → creates demand for the product
```

The most common mistake is building features before building audience. A blog post that ranks on Google will drive traffic for years. An empty forum will drive no one.

### Success Metrics by Phase

| Phase | Key Metric | Target |
|-------|-----------|--------|
| 0 | Email signups | 100 in first month |
| 1 | Monthly unique visitors | 1,000 |
| 2 | Registered users | 50 |
| 3 | Knowledge base articles | 50+ |
| 4 | Weekly active community members | 25+ |

---

## Sources

### Authentication
- [Supabase & Astro Docs](https://docs.astro.build/en/guides/backend/supabase/)
- [How to add Supabase Auth to Astro](https://mihai-andrei.com/blog/how-to-add-supabase-auth-to-astro/)
- [Astro Authentication Guide](https://docs.astro.build/en/guides/authentication/)
- [Supabase OAuth Scopes Discussion](https://github.com/orgs/supabase/discussions/30924)
- [Supabase Auth SSR (supabasic-auth)](https://github.com/jyoungblood/supabasic-auth)

### Blog/Vlog Patterns
- [Astro RSS with MDX](https://blog.damato.design/posts/astro-rss-mdx/)
- [MDX to RSS in Astro](https://codetv.dev/blog/mdx-to-rss-astro)
- [Astro Embed Components](https://astro-embed.netlify.app/getting-started/)
- [Astro RSS Docs](https://docs.astro.build/en/recipes/rss/)
- [Building MDX Blog with Astro](https://www.kozhuhds.com/blog/how-to-build-a-static-lightweight-mdx-blog-with-astro-step-by-step-guide/)
- [RssFeedPulse Newsletter Integration](https://www.rssfeedpulse.com/docs/howtos/astro)

### Forums & Community
- [GitHub Discussions vs Discourse](https://duckalignment.academy/github-discussions-versus-discourse/)
- [Discourse Alternatives 2025](https://alternativeto.net/software/discourse/)
- [Forum vs Platform: What Your Community Needs](https://bevy.com/b/blog/forum-or-platform-what-your-community-really-needs)
- [What Makes Communities Succeed](https://bevy.com/b/blog/the-future-of-forums-how-enterprises-are-reimagining-digital-communities-in-2025)
- [Community Engagement Metrics](https://bevy.com/b/blog/top-11-community-engagement-metrics-for-2025)
- [Project Kamp Community](https://community.projectkamp.com)

### WhatsApp Integration
- [WhatsApp Groups API Guide](https://sanuker.com/whatsapp-groups-api-en/)
- [WhatsApp Group Link Business Guide 2025](https://qualimero.com/en/blog/whatsapp-group-link-guide-admin-business-2025)
- [WhatsApp Communities vs Channels](https://www.bot.space/blog/whatsapp-communities-vs-channels-a-detailed-comparison)
- [WhatsApp Group vs Community vs Channel](https://www.digipixinc.com/technology/whatsapp-group-vs-community-vs-channel/)
- [Managing WhatsApp Communities](https://blog.nas.io/the-ultimate-guide-to-managing-a-whatsapp-community/)
- [Caribbean Sailing Association WhatsApp](https://shta.com/caribbean-sailing-association-launches-whatsapp-group-to-foster-collaboration/)

### Knowledge Base & Search
- [Astro Content Collections Docs](https://docs.astro.build/en/guides/content-collections/)
- [Pagefind Static Search](https://pagefind.app/)
- [Astro-Pagefind Integration](https://github.com/shishkin/astro-pagefind)
- [Pagefind for Astro Sites](https://shayy.org/posts/fts-for-astro)
- [RAG Chunking Strategies](https://latenode.com/blog/ai-frameworks-technical-infrastructure/rag-retrieval-augmented-generation/rag-chunking-strategies-complete-guide-to-document-splitting-for-better-retrieval)
- [Clean Markdown for LLMs](https://anythingmd.com/blog/why-llms-need-clean-markdown)
- [RAG Blueprint 2025/2026](https://langwatch.ai/blog/the-ultimate-rag-blueprint-everything-you-need-to-know-about-rag-in-2025-2026)

### Victron Energy Model
- [Victron Training Portal](https://www.victronenergy.com/information/training)
- [Victron Professional](https://professional.victronenergy.com/)

### Community Running Learnings
- [Running Communities on Slack, Discord, WhatsApp](https://medium.com/@adithyanarayanan/learnings-from-running-communities-on-slack-discord-and-whatsapp-48599c5f1ffe)
- [Discord vs WhatsApp for Communities](https://startadam.com/blog/discord-vs-whatsapp-which-messaging-platform-is-right-for-your-community/)
- [Alaska Sailing Club Discord](https://aksailingclub.org/discord-server/)
