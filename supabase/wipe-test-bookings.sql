-- ─────────────────────────────────────────────────────────────────────────────
-- Wipe all test bookings + free up their slots
-- Run in Supabase SQL editor. Safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Free up every slot that was booked
update availability_slots
set is_booked = false,
    booking_id = null
where booking_id is not null;

-- 2. Delete all EDT sessions (FK -> bookings via packages)
delete from edt_sessions;

-- 3. Delete all EDT packages
delete from edt_packages;

-- 4. Delete all bookings
delete from bookings;

-- ── Sanity check ─────────────────────────────────────────────────────────────
select
  (select count(*) from bookings)             as bookings_remaining,
  (select count(*) from edt_packages)         as packages_remaining,
  (select count(*) from edt_sessions)         as sessions_remaining,
  (select count(*) from availability_slots
     where is_booked = true)                  as slots_still_booked;

-- ─────────────────────────────────────────────────────────────────────────────
-- OPTIONAL: also delete all availability slots (full reset)
-- Uncomment the line below if you want a clean slate before auto-filling again.
-- ─────────────────────────────────────────────────────────────────────────────
-- delete from availability_slots;
