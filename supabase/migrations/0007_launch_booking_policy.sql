-- =============================================================================
-- Launch booking policy alignment.
--
-- The product configuration agreed for launch is a 30-minute generic travel
-- buffer for every online lesson and a two-hour pre-test session. This
-- migration updates databases that already ran the original seed; changing
-- 0003 alone would not affect those environments.
-- =============================================================================

update public.services
   set buffer_minutes = 30;

update public.services
   set duration_minutes = 120
 where slug = 'pre-test-lesson';

-- The original function padded both ends of every booking. Because the next
-- booking also carried its own leading pad, a configured 30-minute buffer
-- required a full hour between lessons. The launch rule is simpler: the
-- lesson occupies its real duration, followed by one 30-minute travel block.
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
set search_path = ''
as $$
declare
  v_service public.services;
  v_booking public.bookings;
  v_ends_at timestamptz;
begin
  if p_hold_minutes < 1 or p_hold_minutes > 120 then
    raise exception 'hold_minutes out of range' using errcode = '22023';
  end if;

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
      v_ends_at + make_interval(mins => v_service.buffer_minutes),
      now() + make_interval(mins => p_hold_minutes),
      v_service.price_cents,
      v_service.deposit_cents
    )
    returning * into v_booking;
  exception
    when exclusion_violation then
      raise exception 'SLOT_TAKEN' using errcode = 'P0001';
  end;

  insert into public.booking_events (booking_id, event, detail, actor)
  values (
    v_booking.id,
    'hold_created',
    jsonb_build_object('expires_at', v_booking.expires_at, 'service', p_service_slug),
    'customer'
  );

  return v_booking;
end $$;

-- Bring any existing rows into the same one-sided buffer model. The ranges
-- only shrink, so this cannot introduce a new exclusion conflict.
update public.bookings as booking
   set blocked_from = booking.starts_at,
       blocked_to = booking.ends_at + make_interval(mins => service.buffer_minutes)
  from public.services as service
 where booking.service_id = service.id;
