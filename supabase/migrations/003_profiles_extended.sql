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

-- Drop old insert policies before creating replacements that include ban checks
DROP POLICY IF EXISTS "Auth users create discussions" ON discussions;
DROP POLICY IF EXISTS "Auth users create replies" ON replies;

-- Banned users cannot create content
CREATE POLICY "Banned users blocked from discussions" ON discussions
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_banned = true
    )
  );

CREATE POLICY "Banned users blocked from replies" ON replies
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_banned = true
    )
  );

-- Users can delete their own content
CREATE POLICY "Users delete own discussions" ON discussions
  FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Users delete own replies" ON replies
  FOR DELETE USING (auth.uid() = author_id);

-- Supabase Storage bucket for blog images (created via dashboard or CLI, not SQL)
-- bucket: blog-images, public: true
