-- 001_initial_schema.sql
-- Initial database schema for Above Deck sailing platform

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Power consumer catalog
CREATE TABLE power_consumers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'navigation', 'communication', 'refrigeration', 'lighting',
    'water-systems', 'comfort-galley', 'charging', 'sailing-safety'
  )),
  icon TEXT,
  watts_typical NUMERIC NOT NULL,
  watts_min NUMERIC,
  watts_max NUMERIC,
  amps_12v NUMERIC GENERATED ALWAYS AS (watts_typical / 12.0) STORED,
  amps_24v NUMERIC GENERATED ALWAYS AS (watts_typical / 24.0) STORED,
  hours_per_day_anchor NUMERIC NOT NULL DEFAULT 0,
  hours_per_day_passage NUMERIC NOT NULL DEFAULT 0,
  duty_cycle NUMERIC DEFAULT 1.0,
  usage_type TEXT NOT NULL DEFAULT 'intermittent' CHECK (usage_type IN ('always-on', 'scheduled', 'intermittent')),
  crew_scaling BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Product spec database
CREATE TABLE product_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_type TEXT NOT NULL CHECK (component_type IN (
    'mppt-controller', 'solar-panel', 'battery-lifepo4', 'battery-agm',
    'inverter-charger', 'battery-monitor', 'alternator-regulator'
  )),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  specs JSONB NOT NULL DEFAULT '{}',
  source_url TEXT,
  verified_at TIMESTAMPTZ,
  compatible_voltages INTEGER[] DEFAULT '{12}',
  weight_kg NUMERIC,
  price_range_low NUMERIC,
  price_range_high NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(make, model)
);

-- Product requests from users
CREATE TABLE product_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  product_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'researching', 'added', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Boat model templates
CREATE TABLE boat_model_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year_range TEXT,
  boat_type TEXT NOT NULL CHECK (boat_type IN ('monohull', 'catamaran', 'trimaran', 'power')),
  length_ft NUMERIC NOT NULL,
  default_crew INTEGER DEFAULT 2,
  factory_solar_watts NUMERIC DEFAULT 0,
  factory_battery_ah NUMERIC,
  factory_battery_chemistry TEXT DEFAULT 'agm',
  system_voltage INTEGER DEFAULT 12,
  engine_make TEXT,
  engine_model TEXT,
  engine_alternator_amps NUMERIC,
  default_appliance_ids UUID[],
  specs JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(make, model, year_range)
);

-- Saved calculator configurations
CREATE TABLE saved_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Discussion threads
CREATE TABLE discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'electrical', 'engine-mechanical', 'plumbing-water', 'safety-emergency',
    'provisioning-living', 'destinations-cruising', 'general',
    'introductions', 'feature-requests'
  )),
  reply_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Discussion replies
CREATE TABLE replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reply count trigger
CREATE OR REPLACE FUNCTION update_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE discussions SET reply_count = reply_count + 1, updated_at = now()
    WHERE id = NEW.discussion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE discussions SET reply_count = reply_count - 1, updated_at = now()
    WHERE id = OLD.discussion_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reply_count
AFTER INSERT OR DELETE ON replies
FOR EACH ROW EXECUTE FUNCTION update_reply_count();

-- Newsletter subscribers
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id),
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

-- Profile auto-creation trigger on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_consumers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE boat_model_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Public read for catalog tables
CREATE POLICY "Public read power_consumers" ON power_consumers FOR SELECT USING (true);
CREATE POLICY "Public read product_specs" ON product_specs FOR SELECT USING (true);
CREATE POLICY "Public read boat_model_templates" ON boat_model_templates FOR SELECT USING (true);

-- Authenticated users can request products
CREATE POLICY "Auth users create product_requests" ON product_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own product_requests" ON product_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Saved configurations: owner only
CREATE POLICY "Users manage own configurations" ON saved_configurations
  FOR ALL USING (auth.uid() = user_id);

-- Discussions: public read, auth write
CREATE POLICY "Public read discussions" ON discussions
  FOR SELECT USING (NOT is_hidden);
CREATE POLICY "Auth users create discussions" ON discussions
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Replies: public read, auth write
CREATE POLICY "Public read replies" ON replies
  FOR SELECT USING (NOT is_hidden);
CREATE POLICY "Auth users create replies" ON replies
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Profiles: public read, self update
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Newsletter: auth insert
CREATE POLICY "Auth users subscribe" ON newsletter_subscribers
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
