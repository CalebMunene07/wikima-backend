CREATE TABLE IF NOT EXISTS tours (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             VARCHAR(160) UNIQUE NOT NULL,
  title            VARCHAR(200) NOT NULL,
  location         VARCHAR(120),
  duration         VARCHAR(60),
  description      TEXT,
  long_description TEXT,
  image_url        TEXT,
  standard_price   NUMERIC(10,2) NOT NULL DEFAULT 890.00,
  premium_price    NUMERIC(10,2) NOT NULL DEFAULT 1450.00,
  luxury_price     NUMERIC(10,2) NOT NULL DEFAULT 2800.00,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
