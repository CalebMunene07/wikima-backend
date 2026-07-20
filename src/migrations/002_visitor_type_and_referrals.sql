-- ═══════════════════════════════════════════════════════════════
-- WIKIMA SAFARI — Migration 002: Resident/Non-Resident + Referrals
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- Safe to re-run (all statements are idempotent).
-- ═══════════════════════════════════════════════════════════════

-- Which rate the guest booked under. Drives the 20% resident discount
-- applied in bookings.controller.ts at booking-creation time.
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS visitor_type VARCHAR(20)
  DEFAULT 'non-resident'
  CHECK (visitor_type IN ('resident', 'non-resident'));

-- Referral code of whoever sent this guest here. We reuse the referring
-- booking's own `reference` as its referral code — no separate code
-- generation table needed. NULL = booked directly (no referral).
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS referred_by VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_bookings_referred_by ON bookings(referred_by);
CREATE INDEX IF NOT EXISTS idx_bookings_visitor_type ON bookings(visitor_type);
