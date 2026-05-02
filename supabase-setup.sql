-- ═══════════════════════════════════════════════════════════════
-- WIKIMA SAFARI — Supabase Setup
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 001: Users ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  phone      VARCHAR(20),
  password   TEXT NOT NULL,
  role       VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 002: Tours ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tours (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             VARCHAR(160) UNIQUE NOT NULL,
  title            VARCHAR(200) NOT NULL,
  location         VARCHAR(120),
  duration         VARCHAR(60),
  description      TEXT,
  long_description TEXT,
  image_url        TEXT,
  -- category maps to dropdown groups:
  -- bush | beach | mountain | adventure | city | lodge | international
  category         VARCHAR(50) DEFAULT 'bush',
  standard_price   NUMERIC(10,2) NOT NULL DEFAULT 890.00,
  premium_price    NUMERIC(10,2) NOT NULL DEFAULT 1450.00,
  luxury_price     NUMERIC(10,2) NOT NULL DEFAULT 2800.00,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── 003: Bookings ────────────────────────────────────────────
-- NOTE: includes adults & children columns for discount pricing
CREATE TABLE IF NOT EXISTS bookings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference        VARCHAR(20) UNIQUE NOT NULL,
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  tour_id          UUID REFERENCES tours(id) ON DELETE SET NULL,
  tour_title       VARCHAR(200),
  guest_name       VARCHAR(120) NOT NULL,
  guest_email      VARCHAR(255) NOT NULL,
  guest_phone      VARCHAR(20),
  travel_date      DATE NOT NULL,
  guests           INTEGER NOT NULL DEFAULT 1,
  adults           INTEGER,
  children         INTEGER,
  package          VARCHAR(20) CHECK (package IN ('Standard', 'Premium', 'Luxury')),
  total_amount     NUMERIC(10,2) NOT NULL,
  deposit_amount   NUMERIC(10,2) NOT NULL,
  special_requests TEXT,
  status           VARCHAR(30) DEFAULT 'pending'
                   CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── 004: Payments ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id            UUID REFERENCES bookings(id) ON DELETE CASCADE,
  method                VARCHAR(20) CHECK (method IN ('mpesa', 'card')),
  amount                NUMERIC(10,2) NOT NULL,
  currency              VARCHAR(5) DEFAULT 'KES',
  status                VARCHAR(20) DEFAULT 'pending'
                        CHECK (status IN ('pending', 'success', 'failed')),
  mpesa_phone           VARCHAR(20),
  mpesa_checkout_id     VARCHAR(100),
  mpesa_receipt         VARCHAR(60),
  stripe_payment_intent VARCHAR(100),
  stripe_client_secret  TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── 005: Indexes ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_email   ON bookings(guest_email);
CREATE INDEX IF NOT EXISTS idx_bookings_status  ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_tours_slug       ON tours(slug);
CREATE INDEX IF NOT EXISTS idx_tours_active     ON tours(is_active);

-- ═══════════════════════════════════════════════════════════════
-- ADMIN SEED
-- Creates the admin user with password: Admin@Wikima2024
-- Change the password after first login!
-- ═══════════════════════════════════════════════════════════════
INSERT INTO users (name, email, phone, password, role)
VALUES (
  'Wikima Admin',
  'munenecaleb007@gmail.com',
  '+254720069550',
  -- bcrypt hash of: Admin@Wikima2024
  '$2b$12$bY7fG0SqXE9GuE8fvqa2Vur7klrzATCdec3B1WVBiVu8MRKwqwnJi',
  'admin'
)
ON CONFLICT (email) DO UPDATE
  SET role = 'admin',
      name = EXCLUDED.name;

-- ═══════════════════════════════════════════════════════════════
-- VERIFY (uncomment and run after setup to confirm)
-- ═══════════════════════════════════════════════════════════════
-- SELECT id, name, email, role, created_at FROM users;
-- SELECT COUNT(*) FROM tours;
-- SELECT COUNT(*) FROM bookings;

-- ═══════════════════════════════════════════════════════════════
-- IF TOURS TABLE ALREADY EXISTS — run this to add category column
-- (skip if running setup fresh)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE tours ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'bush';

-- ═══════════════════════════════════════════════════════════════
-- SAMPLE TOURS SEED
-- Category values: bush | beach | mountain | adventure | city | lodge | international
-- ═══════════════════════════════════════════════════════════════
INSERT INTO tours (slug, title, location, duration, description, category, standard_price, premium_price, luxury_price)
VALUES
  ('masai-mara-classic',         'Masai Mara Classic Safari',           'Masai Mara, Kenya',       '5 Days',  'Witness the Great Migration in the iconic Masai Mara ecosystem.',           'bush',          890,  1450, 2800),
  ('amboseli-elephant-safari',   'Amboseli Elephant Safari',            'Amboseli, Kenya',         '4 Days',  'Watch elephants roam freely with Kilimanjaro as your backdrop.',             'bush',          890,  1450, 2800),
  ('tsavo-east-west',            'Tsavo East & West Explorer',          'Tsavo, Kenya',            '6 Days',  'Explore the vast red-earth wilderness of Kenya's largest park.',             'bush',          890,  1450, 2800),
  ('diani-beach-retreat',        'Diani Beach Retreat',                 'Diani, Kenya',            '4 Days',  'Relax on pristine white sand beaches along the Kenyan coast.',               'beach',         890,  1450, 2800),
  ('lamu-island-escape',         'Lamu Island Escape',                  'Lamu, Kenya',             '5 Days',  'Discover ancient Swahili culture in this UNESCO World Heritage island.',     'beach',         890,  1450, 2800),
  ('mount-kenya-trek',           'Mount Kenya Trek',                    'Mount Kenya',             '7 Days',  'Summit Point Lenana on Africa's second highest mountain.',                  'mountain',      890,  1450, 2800),
  ('aberdare-highland-hike',     'Aberdare Highland Hike',              'Aberdares, Kenya',        '3 Days',  'Trek through misty moorlands and waterfalls in the Aberdare range.',        'mountain',      890,  1450, 2800),
  ('hell-gate-adventure',        'Hell Gate Adventure',                 'Naivasha, Kenya',         '2 Days',  'Cycle and hike through dramatic gorges in Hell Gate National Park.',        'adventure',     890,  1450, 2800),
  ('ol-pejeta-chimps',           'Ol Pejeta Wildlife & Chimps',         'Ol Pejeta, Kenya',        '3 Days',  'See the Big Five and Africa's only chimpanzee sanctuary.',                  'adventure',     890,  1450, 2800),
  ('nairobi-city-tour',          'Nairobi City Safari & National Park', 'Nairobi, Kenya',          '2 Days',  'City culture, Karen Blixen Museum, and lions minutes from downtown.',        'city',          890,  1450, 2800),
  ('lake-nakuru-flamingos',      'Lake Nakuru Flamingo Tour',           'Nakuru, Kenya',           '2 Days',  'Millions of flamingos turn the lake pink in a breathtaking spectacle.',     'city',          890,  1450, 2800),
  ('samburu-lodge-safari',       'Samburu Lodge Safari',                'Samburu, Kenya',          '5 Days',  'Stay in luxury lodges and spot rare northern species.',                     'lodge',         890,  1450, 2800),
  ('mara-signature-dining',      'Mara Signature Dining Safari',        'Masai Mara, Kenya',       '4 Days',  'World-class bush dining under the stars in the Mara.',                     'lodge',         890,  1450, 2800),
  ('zanzibar-explorer',          'Zanzibar Island Explorer',            'Zanzibar, Tanzania',      '6 Days',  'Spice tours, Stone Town, and turquoise waters off the Tanzanian coast.',    'international', 890,  1450, 2800),
  ('rwanda-gorilla-trek',        'Rwanda Gorilla Trekking',             'Volcanoes NP, Rwanda',    '5 Days',  'A life-changing encounter with mountain gorillas in their natural habitat.', 'international', 1200, 1800, 3200),
  ('serengeti-migration',        'Serengeti Great Migration',           'Serengeti, Tanzania',     '7 Days',  'Follow the thundering wildebeest migration across the Serengeti plains.',   'international', 1100, 1750, 3000)
ON CONFLICT (slug) DO UPDATE
  SET category = EXCLUDED.category,
      is_active = true;

