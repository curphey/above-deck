# KB Phase 2: RBAC, Inline Editing & Commenting

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan.

**Goal:** Add admin RBAC, inline article editing, and inline commenting to the KB. No separate CMS — the KB pages ARE the editing interface. Admin users see edit/create buttons. All users can comment on highlighted text.

**Architecture:** Supabase handles auth (Google OAuth already set up) and stores comments + user roles. Article content stays in `/docs/` as markdown files. Editing saves via an API route that writes to the filesystem. Comments are stored in Supabase with text range anchors.

---

## Task 1: RBAC — Admin Role in Supabase (#245)

**What:** Add a `role` column to the `profiles` table. Create a helper to check if the current user is admin. Set your account as admin.

**Files:**
- Create: `supabase/migrations/004_user_roles.sql`
- Create: `packages/site/src/lib/auth.ts`

**Migration:**
```sql
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
-- Set your account as admin (update with your actual user ID after first login)
```

**Auth helper (`packages/site/src/lib/auth.ts`):**
```typescript
export async function getUser(cookies, request) { ... }
export async function isAdmin(cookies, request): Promise<boolean> { ... }
```

---

## Task 2: Auth UI — Sign In Button + Admin Detection (#246)

**What:** Add a sign-in button to the KB header. After sign-in, detect if user is admin and show admin controls.

**Files:**
- Modify: `packages/site/src/layouts/KBLayout.astro` — add auth state to header
- Create: `packages/site/src/components/knowledge/KBUserMenu.tsx` — React island showing avatar or sign-in button

---

## Task 3: Inline Edit Mode (#247)

**What:** Admin users see an "Edit" button on every article. Clicking it replaces the rendered markdown with a textarea editor. Save writes the file back via an API route.

**Files:**
- Create: `packages/site/src/components/knowledge/KBEditor.tsx` — React island with markdown textarea + toolbar + save/cancel
- Create: `packages/site/src/pages/api/kb/save.ts` — API route that writes markdown back to `/docs/`
- Modify: `packages/site/src/pages/knowledge/[...slug].astro` — pass isAdmin prop, conditionally show editor

**Editor features:**
- Markdown textarea with the article's raw content
- Simple toolbar (H1, H2, Bold, Italic, Link, Code, Table)
- Save button → POST to `/api/kb/save` with slug + content
- Cancel button → revert to reading view
- Auto-save draft to localStorage

**API route (`/api/kb/save`):**
- Verify user is admin (Supabase auth check)
- Write content to the correct file in `/docs/`
- Return success/error
- Trigger Astro content collection re-sync (or require dev server restart)

---

## Task 4: Create New Article (#248)

**What:** Admin sees a "New Article" button. Opens a form to create a new markdown file in `/docs/`.

**Files:**
- Create: `packages/site/src/pages/api/kb/create.ts` — API route to create a new file
- Modify: `packages/site/src/components/knowledge/KBSidebar.tsx` — add "New" button for admins
- Create: `packages/site/src/pages/knowledge/new.astro` — new article page with editor

---

## Task 5: Inline Commenting — Supabase Table (#249)

**What:** Create the comments table in Supabase for text-anchored threaded discussions.

**Files:**
- Create: `supabase/migrations/005_kb_comments.sql`

**Schema:**
```sql
CREATE TABLE kb_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_slug TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  parent_id UUID REFERENCES kb_comments(id),
  -- Text anchor (the highlighted text this comment refers to)
  anchor_text TEXT,           -- the quoted text
  anchor_start_offset INT,    -- character offset from start of section
  anchor_section TEXT,        -- H2 heading the anchor is under
  -- Content
  content TEXT NOT NULL,
  -- Status
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES profiles(id),
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE kb_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read comments" ON kb_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON kb_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON kb_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any comment" ON kb_comments FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

---

## Task 6: Inline Commenting — UI (#250)

**What:** Build the comment rail and text selection popup from the playground design.

**Files:**
- Create: `packages/site/src/components/knowledge/KBCommentRail.tsx` — React island showing threaded comments
- Create: `packages/site/src/components/knowledge/KBSelectionPopup.tsx` — popup on text selection
- Create: `packages/site/src/pages/api/kb/comments.ts` — API routes for CRUD
- Modify: `packages/site/src/pages/knowledge/[...slug].astro` — add comment rail + selection handling

**Comment rail features (from playground):**
- Right sidebar (280px) showing threads
- Each thread shows: quoted text (yellow), author, timestamp, comment, replies
- Reply button on each thread
- "Highlight text to start a new thread" hint
- Comment input at bottom
- Hover highlight ↔ thread linking (hover comment highlights text, hover text highlights comment)
- Admin: "Resolve" button on threads

**Selection popup:**
- Appears above selected text (10+ characters)
- "💬 Comment on this" button
- Creates new thread anchored to the selection

---

## Task 7: Delete Article (Admin) (#251)

**What:** Admin can delete articles (moves to a `.trash/` folder rather than permanent delete).

**Files:**
- Create: `packages/site/src/pages/api/kb/delete.ts`
- Modify: article page to show delete button for admin

---

## Build Order

Sequential: 1 → 2 → 3 → 4 → 5 → 6 → 7

Tasks 1-2 (auth) must come first. Tasks 3-4 (editing) and 5-6 (commenting) are independent but both need auth. Task 7 is a small addition at the end.
