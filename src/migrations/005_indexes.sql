CREATE INDEX IF NOT EXISTS idx_bookings_email    ON bookings(guest_email);
CREATE INDEX IF NOT EXISTS idx_bookings_status   ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_payments_booking  ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_tours_slug        ON tours(slug);
CREATE INDEX IF NOT EXISTS idx_tours_active      ON tours(is_active);