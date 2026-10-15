-- 002_reconstructed.sql
-- This migration file was missing from the sequence.
-- Reconstructed from the gap between migrations 001 and 003.
-- Migration 003 only adds google_calendar_event_id to bookings, which 001 did not include.
-- This file is intentionally minimal and idempotent.
-- Header: reconstructed 2026-10-15

-- Nothing to add here: migration 003 handles its own column add with IF NOT EXISTS.
-- This file exists to close the gap in the sequence and document that 002 was not lost;
-- it was simply never created (the feature was developed directly after 001).
SELECT 1; -- no-op, keeps the sequence intact
