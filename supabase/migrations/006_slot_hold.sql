-- 006_slot_hold.sql
-- Add slot hold columns to prevent double-booking during checkout
ALTER TABLE availability_slots ADD COLUMN IF NOT EXISTS held_until TIMESTAMPTZ;
ALTER TABLE availability_slots ADD COLUMN IF NOT EXISTS held_by_booking UUID;

-- RPC for atomic slot hold. Returns the updated row if the hold was acquired,
-- or an empty result set if the slot was already booked or actively held.
CREATE OR REPLACE FUNCTION hold_slot(
  p_slot_id UUID,
  p_booking_id UUID,
  p_minutes INT DEFAULT 35
) RETURNS SETOF availability_slots
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE availability_slots
  SET
    held_until = now() + (p_minutes || ' minutes')::interval,
    held_by_booking = p_booking_id
  WHERE
    id = p_slot_id
    AND is_booked = false
    AND (held_until IS NULL OR held_until < now())
  RETURNING *;
END;
$$;
