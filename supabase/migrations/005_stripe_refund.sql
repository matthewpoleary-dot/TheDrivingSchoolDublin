-- 005_stripe_refund.sql
-- Add stripe_refund_id to bookings table for refund tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT;
