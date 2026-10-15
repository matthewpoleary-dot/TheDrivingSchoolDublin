-- 008_unique_constraints.sql
-- Add unique constraints to prevent duplicate slots and double-booking race conditions.

-- Step 1: Deduplicate availability_slots before adding the unique constraint.
-- Only remove unbooked duplicates (higher UUID = created later, keep the lower one).
DELETE FROM availability_slots a
USING availability_slots b
WHERE a.date = b.date
  AND a.start_time = b.start_time
  AND a.id > b.id
  AND a.is_booked = false; -- never delete a booked slot duplicate

-- Step 2: Unique constraint on date + start_time so recurring inserts are idempotent.
ALTER TABLE availability_slots
  ADD CONSTRAINT IF NOT EXISTS uq_slot_date_time UNIQUE (date, start_time);

-- Step 3: Unique partial index on edt_sessions: one active session per (package, session_number).
-- Cancelled sessions are excluded so the number can be reused after a cancellation.
CREATE UNIQUE INDEX IF NOT EXISTS uq_edt_active_session
  ON edt_sessions (package_id, session_number)
  WHERE status != 'cancelled';

-- Step 4: Unique partial index on bookings: only one pending/paid booking per slot.
CREATE UNIQUE INDEX IF NOT EXISTS uq_booking_slot_active
  ON bookings (slot_id)
  WHERE slot_id IS NOT NULL AND payment_status IN ('pending', 'paid');
