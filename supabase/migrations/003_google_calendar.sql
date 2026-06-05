-- Add Google Calendar event ID to bookings so we can delete events when cancelling
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;
