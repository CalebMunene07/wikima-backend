-- 004: Payments table
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