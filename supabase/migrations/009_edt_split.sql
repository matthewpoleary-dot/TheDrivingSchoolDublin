-- 009_edt_split.sql
-- Add split-payment support for EDT packages.

-- package_type: 'standard' (one payment) or 'split' (two instalments)
ALTER TABLE edt_packages ADD COLUMN IF NOT EXISTS package_type TEXT NOT NULL DEFAULT 'standard';

-- second_instalment_paid: true once the second €475 payment is confirmed
ALTER TABLE edt_packages ADD COLUMN IF NOT EXISTS second_instalment_paid BOOLEAN NOT NULL DEFAULT false;

-- second_instalment_booking_id: links back to the second Stripe booking
ALTER TABLE edt_packages ADD COLUMN IF NOT EXISTS second_instalment_booking_id UUID REFERENCES bookings(id);
