-- Add role to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
