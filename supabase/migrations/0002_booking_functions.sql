-- =============================================================================
-- Atomic write paths for bookings.
-- =============================================================================
--
-- Every booking is created by hold_slot() and only ever advances through
-- confirm_booking() / cancel_booking(). Doing it in the database rather than
-- in application code buys three things that matter:
--
--   * Expiring stale holds and inserting the new one happen in ONE transaction,
--     so an expired hold can never block a legitimate booking.
--   * The exclusion-constraint violation is caught and turned into a clean,
--     typed error the API can show the customer, instead of a raw 23P01.
--   * Concurrent requests from different serverless instances serialise on the
--     constraint, so "two people booked the same slot" is impossible rather
--     than rare.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Short, unambiguous booking references. No 0/O/1/I/L.
-- -----------------------------------------------------------------------------
create or replace function public.generate_booking_reference()
returns text
language plpgsql
volatile
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  candidate text;
  attempt   integer := 0;
begin
  loop
    candidate := 'TDS-';
    for _ in 1..5 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;

    exit when not exists (select 1 from public.bookings where reference = candidate);

    attempt := attempt + 1;
    if attempt > 25 then
      raise exception 'Could not generate a unique booking reference after % attempts', attempt;
    end if;
  end loop;

  return candidate;
end $$;

-- -----------------------------------------------------------------------------
-- Sweep holds whose window has passed.
-- -----------------------------------------------------------------------------
create or replace function public.expire_stale_holds()
returns integer
language plpgsql
volatile
as $$
declare
  swept integer;
begin
  with expired as (
    update public.bookings
       set status = 'expired',
           expires_at = null
     where status = 'held'
       and expires_at is not null
       and expires_at < now()
    returning id
  )
  select count(*) into swept from expired;

  return coalesce(swept, 0);
end $$;

comment on function public.expire_stale_holds is
  'Called at the head of hold_slot(), and by the cleanup cron. Safe to call as often as you like.';

-- -----------------------------------------------------------------------------
-- Take a slot.
-- -----------------------------------------------------------------------------
create or replace function public.hold_slot(
  p_service_slug   text,
  p_starts_at      timestamptz,
  p_customer_name  text,
  p_customer_email text,
  p_customer_phone text,
  p_pickup_address text default null,
  p_test_centre    text default null,
  p_transmission   text default null,
  p_notes          text default null,
  p_hold_minutes   integer default 15
)
returns public.bookings
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_service public.services;
  v_booking public.bookings;
  v_ends_at timestamptz;
begin
  if p_hold_minutes < 1 or p_hold_minutes > 120 then
    raise exception 'hold_minutes out of range' using errcode = '22023';
  end if;

  -- Reclaim anything abandoned, in this same transaction.
  perform public.expire_stale_holds();

  select * into v_service
    from public.services
   where slug = p_service_slug and is_active
   limit 1;

  if not found then
    raise exception 'UNKNOWN_SERVICE: %', p_service_slug using errcode = 'P0002';
  end if;

  if p_starts_at <= now() then
    raise exception 'SLOT_IN_PAST' using errcode = 'P0001';
  end if;

  v_ends_at := p_starts_at + make_interval(mins => v_service.duration_minutes);

  begin
    insert into public.bookings (
      reference, service_id, status,
      customer_name, customer_email, customer_phone,
      pickup_address, test_centre, transmission, notes,
      starts_at, ends_at,
      blocked_from, blocked_to,
      expires_at,
      price_cents, deposit_cents
    ) values (
      public.generate_booking_reference(),
      v_service.id,
      'held',
      trim(p_customer_name),
      lower(trim(p_customer_email)),
      trim(p_customer_phone),
      nullif(trim(coalesce(p_pickup_address, '')), ''),
      nullif(trim(coalesce(p_test_centre, '')), ''),
      nullif(p_transmission, '')::public.transmission_type,
      nullif(trim(coalesce(p_notes, '')), ''),
      p_starts_at,
      v_ends_at,
      p_starts_at,
      v_ends_at   + make_interval(mins => v_service.buffer_minutes),
      now() + make_interval(mins => p_hold_minutes),
      v_service.price_cents,
      v_service.deposit_cents
    )
    returning * into v_booking;
  exception
    when exclusion_violation then
      -- Somebody else got there first, between the page loading and this call.
      raise exception 'SLOT_TAKEN' using errcode = 'P0001';
  end;

  insert into public.booking_events (booking_id, event, detail, actor)
  values (v_booking.id, 'hold_created',
          jsonb_build_object('expires_at', v_booking.expires_at,
                             'service', p_service_slug),
          'customer');

  return v_booking;
end $$;

-- -----------------------------------------------------------------------------
-- Promote a hold once Stripe says the money is good.
-- -----------------------------------------------------------------------------
create or replace function public.confirm_booking(
  p_booking_id        uuid,
  p_stripe_session_id text default null,
  p_payment_intent_id text default null,
  p_paid              boolean default true
)
returns public.bookings
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;

  if not found then
    raise exception 'UNKNOWN_BOOKING' using errcode = 'P0002';
  end if;

  -- Stripe retries webhooks. Confirming an already-confirmed booking must be
  -- a no-op that returns success, not an error.
  if v_booking.status = 'confirmed' then
    return v_booking;
  end if;

  if v_booking.status not in ('held', 'pending') then
    raise exception 'BOOKING_NOT_CONFIRMABLE: %', v_booking.status using errcode = 'P0001';
  end if;

  update public.bookings
     set status = 'confirmed',
         expires_at = null,
         paid_at = case when p_paid then coalesce(paid_at, now()) else paid_at end,
         stripe_session_id = coalesce(p_stripe_session_id, stripe_session_id),
         stripe_payment_intent_id = coalesce(p_payment_intent_id, stripe_payment_intent_id)
   where id = p_booking_id
  returning * into v_booking;

  insert into public.booking_events (booking_id, event, detail, actor)
  values (v_booking.id, 'confirmed',
          jsonb_build_object('paid', p_paid, 'session', p_stripe_session_id),
          'system');

  return v_booking;
end $$;

-- -----------------------------------------------------------------------------
-- Cancel, releasing the slot back to the calendar.
-- -----------------------------------------------------------------------------
create or replace function public.cancel_booking(
  p_booking_id uuid,
  p_actor      text default 'customer',
  p_reason     text default null
)
returns public.bookings
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;

  if not found then
    raise exception 'UNKNOWN_BOOKING' using errcode = 'P0002';
  end if;

  if v_booking.status = 'cancelled' then
    return v_booking;
  end if;

  if v_booking.status in ('completed', 'expired') then
    raise exception 'BOOKING_NOT_CANCELLABLE: %', v_booking.status using errcode = 'P0001';
  end if;

  update public.bookings
     set status = 'cancelled',
         cancelled_at = now(),
         cancelled_by = p_actor,
         cancellation_reason = p_reason,
         expires_at = null
   where id = p_booking_id
  returning * into v_booking;

  insert into public.booking_events (booking_id, event, detail, actor)
  values (v_booking.id, 'cancelled', jsonb_build_object('reason', p_reason), p_actor);

  return v_booking;
end $$;

-- -----------------------------------------------------------------------------
-- Lock down execution. Only the service role may call these.
-- -----------------------------------------------------------------------------
revoke all on function public.hold_slot(text, timestamptz, text, text, text, text, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.confirm_booking(uuid, text, text, boolean) from public, anon, authenticated;
revoke all on function public.cancel_booking(uuid, text, text) from public, anon, authenticated;
revoke all on function public.expire_stale_holds() from public, anon, authenticated;
revoke all on function public.generate_booking_reference() from public, anon, authenticated;

grant execute on function public.hold_slot(text, timestamptz, text, text, text, text, text, text, text, integer) to service_role;
grant execute on function public.confirm_booking(uuid, text, text, boolean) to service_role;
grant execute on function public.cancel_booking(uuid, text, text) to service_role;
grant execute on function public.expire_stale_holds() to service_role;
