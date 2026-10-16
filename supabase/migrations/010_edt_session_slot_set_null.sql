-- 010_edt_session_slot_set_null.sql
-- Let admins delete a slot that an EDT session has used.
--
-- edt_sessions.slot_id was NOT NULL ... ON DELETE RESTRICT, so deleting any slot an
-- EDT session ever pointed at failed, even after the session was cancelled. The
-- slot-delete route had already cancelled the session, returned the credit, emailed
-- the student and removed the calendar event by then, leaving the slot stuck as
-- booked. With SET NULL the slot is deleted and the session row stays as history.

ALTER TABLE edt_sessions ALTER COLUMN slot_id DROP NOT NULL;

-- Drop the existing foreign key on slot_id, whatever it was named.
DO $$
DECLARE
  fk_name text;
BEGIN
  FOR fk_name IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.conrelid = 'edt_sessions'::regclass
      AND c.contype = 'f'
      AND a.attname = 'slot_id'
  LOOP
    EXECUTE format('ALTER TABLE edt_sessions DROP CONSTRAINT %I', fk_name);
  END LOOP;
END $$;

ALTER TABLE edt_sessions
  ADD CONSTRAINT edt_sessions_slot_id_fkey
  FOREIGN KEY (slot_id) REFERENCES availability_slots(id) ON DELETE SET NULL;
