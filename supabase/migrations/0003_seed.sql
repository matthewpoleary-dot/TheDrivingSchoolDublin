-- =============================================================================
-- Seed data.
--
-- Idempotent: safe to re-run. Prices mirror lib/config.ts, which is the source
-- of truth for anything displayed. If you change a price, change it in both
-- places, or the pricing page and the checkout will disagree.
-- =============================================================================

insert into public.services
  (slug, name, description, duration_minutes, buffer_minutes, price_cents, deposit_cents,
   requires_pickup, requires_test_centre, is_active, sort_order)
values
  ('standard-lesson', 'Standard lesson',
   'One-to-one tuition in a fully insured dual-control car.',
   60, 30, 8000, 2000, true, false, true, 1),

  ('pre-test-lesson', 'Pre-test lesson',
   'A full mock test on the real routes, marked the way an examiner marks it.',
   120, 30, 10000, 2000, true, true, true, 2),

  ('edt-single', 'Single EDT lesson',
   'One of the twelve mandatory Essential Driver Training lessons, logged on the day.',
   60, 30, 8000, 2000, true, false, true, 3),

  ('refresher-lesson', 'Refresher lesson',
   'For licence holders returning to the road after a break.',
   60, 30, 8000, 2000, true, false, true, 4)
on conflict (slug) do update set
  name                 = excluded.name,
  description          = excluded.description,
  duration_minutes     = excluded.duration_minutes,
  buffer_minutes       = excluded.buffer_minutes,
  price_cents          = excluded.price_cents,
  deposit_cents        = excluded.deposit_cents,
  requires_pickup      = excluded.requires_pickup,
  requires_test_centre = excluded.requires_test_centre,
  sort_order           = excluded.sort_order;

-- -----------------------------------------------------------------------------
-- Default working week: Monday to Friday 08:00-18:00, Saturday 09:00-16:00.
-- The instructor changes this from the admin screen; this is only the starting
-- point so the calendar is not empty on day one.
-- -----------------------------------------------------------------------------
insert into public.weekly_template (weekday, start_time, end_time, slot_interval_minutes)
select w.weekday, w.start_time::time, w.end_time::time, 30
from (values
  (1, '08:00', '18:00'),
  (2, '08:00', '18:00'),
  (3, '08:00', '18:00'),
  (4, '08:00', '18:00'),
  (5, '08:00', '18:00'),
  (6, '09:00', '16:00')
) as w(weekday, start_time, end_time)
where not exists (
  select 1 from public.weekly_template t where t.weekday = w.weekday
);
