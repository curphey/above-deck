-- 002_equipment_catalog.sql
-- Unified equipment catalog: real branded products + generic defaults

CREATE TABLE equipment_catalog (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL CHECK (type IN ('drain', 'charge', 'store')),
  category    TEXT NOT NULL,
  make        TEXT,
  model       TEXT,
  year        INTEGER,
  latest      BOOLEAN DEFAULT true,
  name        TEXT NOT NULL,
  specs       JSONB NOT NULL DEFAULT '{}',
  source_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index for the most common query pattern
CREATE INDEX idx_equipment_catalog_type_latest ON equipment_catalog (type, latest);
CREATE INDEX idx_equipment_catalog_category ON equipment_catalog (category);

-- Public read access
ALTER TABLE equipment_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read equipment_catalog" ON equipment_catalog FOR SELECT USING (true);
