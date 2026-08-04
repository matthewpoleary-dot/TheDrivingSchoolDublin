-- =============================================================================
-- Fixes from pre-deploy review.
-- =============================================================================
--
-- Four defects, each of which would have cost real money or real slots:
--
--   1. expire_stale_holds() only swept 'held'. A customer who opened Stripe
--      Checkout and walked away left a 'pending' row that nothing ever
--      reclaimed, and the exclusion constraint includes 'pending', so the slot
--      was blocked indefinitely. The only release was the
--      checkout.session.expired webhook, which is not a backstop.
--
--   2. confirm_booking() returned the row whether or not it had actually
--      transitioned, so the caller could not tell a real confirmation from a
--      Stripe retry, and sent the customer a duplicate confirmation email
--      every time. This repeats a logged mistake.
--
--   3. Replacing the weekly template was a DELETE and an INSERT in two
--      statements. A failed insert left the instructor with no working hours
--      at all and the site with zero availability.
--
--   4. SECURITY DEFINER functions used search_path = public rather than ''.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Sweep abandoned checkouts, not just abandoned holds.
-- -----------------------------------------------------------------------------
create or replace function public.expire_stale_holds()
returns integer
language plpgsql
volatile
set search_path = ''
as $$
declare
  swept integer;
begin
  with expired as (
    update public.bookings
       set status = 'expired',
           expires_at = null
     -- 'pending' means the customer is in Stripe Checkout. Once expires_at has
     -- passed, that session is dead and the slot must come back.
     where status in ('held', 'pending')
       and expires_at is not null
       and expires_at < now()
    returning id
  )
  select count(*) into swept from expired;

  return coalesce(swept, 0);
end $$;

-- The partial index has to cover the same statuses or the sweep seq-scans.
drop index if exists public.bookings_expiry_idx;
create index bookings_expiry_idx on public.bookings (expires_at)
  where status in ('held', 'pending');

-- -----------------------------------------------------------------------------
-- 2. Make confirmation report whether THIS call did the transition.
-- -----------------------------------------------------------------------------
-- The caller must only send emails and write the calendar when `transitioned`
-- is true. Stripe delivers at least once and retries on any non-2xx, so
-- without this the customer gets a duplicate confirmation per delivery.
create or replace function public.confirm_booking(
  p_booking_id        uuid,
  p_stripe_session_id text default null,
  p_payment_intent_id text default null,
  p_paid              boolean default true
)
returns table (booking public.bookings, transitioned boolean)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
  v_before  public.booking_status;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;

  if not found then
    raise exception 'UNKNOWN_BOOKING' using errcode = 'P0002';
  end if;

  v_before := v_booking.status;

  if v_before = 'confirmed' then
    -- Already done. Success, but explicitly NOT a transition.
    booking := v_booking;
    transitioned := false;
    return next;
    return;
  end if;

  if v_before not in ('held', 'pending') then
    raise exception 'BOOKING_NOT_CONFIRMABLE: %', v_before using errcode = 'P0001';
  end if;

  update public.bookings
     set status = 'confirmed',
         expires_at = null,
         paid_at = case when p_paid then coalesce(paid_at, now()) else paid_at end,
         stripe_session_id = coalesce(p_stripe_session_id, stripe_session_id),
         stripe_payment_intent_id = coalesce(p_payment_intent_id, stripe_payment_intent_id)
   where id = p_booking_id
     -- Belt and braces: if a concurrent call confirmed it between the SELECT
     -- FOR UPDATE and here, this matches nothing and we report no transition.
     and status in ('held', 'pending')
  returning * into v_booking;

  if not found then
    select * into v_booking from public.bookings where id = p_booking_id;
    booking := v_booking;
    transitioned := false;
    return next;
    return;
  end if;

  insert into public.booking_events (booking_id, event, detail, actor)
  values (v_booking.id, 'confirmed',
          jsonb_build_object('paid', p_paid, 'session', p_stripe_session_id),
          'system');

  booking := v_booking;
  transitioned := true;
  return next;
end $$;

-- -----------------------------------------------------------------------------
-- 3. Replace the working week atomically.
-- -----------------------------------------------------------------------------
create or replace function public.replace_weekly_template(p_windows jsonb)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  inserted integer;
begin
  -- One function body is one transaction, so a failure below rolls the delete
  -- back and the instructor keeps the hours they had.
  delete from public.weekly_template;

  insert into public.weekly_template (weekday, start_time, end_time, slot_interval_minutes)
  select (w->>'weekday')::smallint,
         (w->>'startTime')::time,
         (w->>'endTime')::time,
         (w->>'slotIntervalMinutes')::integer
    from jsonb_array_elements(coalesce(p_windows, '[]'::jsonb)) as w;

  get diagnostics inserted = row_count;
  return inserted;
end $$;

-- -----------------------------------------------------------------------------
-- 4. Harden the remaining definer functions.
-- -----------------------------------------------------------------------------
alter function public.hold_slot(text, timestamptz, text, text, text, text, text, text, text, integer)
  set search_path = '';
alter function public.cancel_booking(uuid, text, text) set search_path = '';

-- The bodies are already fully schema-qualified, so an empty search_path is
-- safe and closes the pg_temp shadowing avenue.

-- -----------------------------------------------------------------------------
-- Grants for the new and changed signatures.
-- -----------------------------------------------------------------------------
revoke all on function public.confirm_booking(uuid, text, text, boolean) from public, anon, authenticated;
revoke all on function public.replace_weekly_template(jsonb) from public, anon, authenticated;
revoke all on function public.expire_stale_holds() from public, anon, authenticated;

grant execute on function public.confirm_booking(uuid, text, text, boolean) to service_role;
grant execute on function public.replace_weekly_template(jsonb) to service_role;
grant execute on function public.expire_stale_holds() to service_role;
