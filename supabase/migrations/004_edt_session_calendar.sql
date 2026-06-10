-- Track Google Calendar event IDs on EDT sessions so admin cancellations can
-- clean them up the same way regular bookings do.
ALTER TABLE edt_sessions
  ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;
