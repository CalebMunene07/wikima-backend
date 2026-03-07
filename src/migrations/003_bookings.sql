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
  package          VARCHAR(20) CHECK (package IN ('Standard', 'Premium', 'Luxury')),
  total_amount     NUMERIC(10,2) NOT NULL,
  deposit_amount   NUMERIC(10,2) NOT NULL,
  special_requests TEXT,
  status           VARCHAR(30) DEFAULT 'pending'
                   CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);