-- KB Comments: text-anchored threaded discussions on knowledge base articles
CREATE TABLE kb_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_slug TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  parent_id UUID REFERENCES kb_comments(id),
  -- Text anchor (the highlighted text this comment refers to)
  anchor_text TEXT,
  anchor_start_offset INT,
  anchor_section TEXT,
  -- Content
  content TEXT NOT NULL,
  -- Status
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES profiles(id),
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_kb_comments_article ON kb_comments(article_slug);
CREATE INDEX idx_kb_comments_parent ON kb_comments(parent_id);

-- RLS
ALTER TABLE kb_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments"
  ON kb_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON kb_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON kb_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comment"
  ON kb_comments FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_kb_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kb_comments_updated_at
  BEFORE UPDATE ON kb_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_kb_comment_updated_at();
