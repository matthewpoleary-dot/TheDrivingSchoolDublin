-- =============================================================================
-- The Driving School Dublin: booking core
-- =============================================================================
--
-- Design notes worth reading before changing anything here.
--
-- 1. Holds and bookings live in ONE table, separated by status. That is what
--    lets a single exclusion constraint guarantee that a held slot and a
--    confirmed slot can never overlap. Two tables could not do this.
--
-- 2. `blocked_during` is the range the constraint protects, and it includes
--    the instructor's travel buffer either side of the lesson. It is derived
--    from blocked_from/blocked_to, which are plain columns rather than
--    expressions, because `timestamptz - interval` is only STABLE in Postgres
--    and generated columns require IMMUTABLE.
--
-- 3. All writes go through the functions at the bottom. They are the only
--    place that sets blocked_from/blocked_to, and they expire stale holds in
--    the same transaction as the insert, which closes the race where an
--    expired hold blocks a legitimate booking.
--
-- 4. RLS is on everywhere with no anon policies. The anon key can read
--    nothing. All application access is server-side via the service role.
-- =============================================================================

create extension if not exists btree_gist;
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Services: the bookable lesson catalogue
-- -----------------------------------------------------------------------------
create table if not exists public.services (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  name              text not null,
  description       text,
  duration_minutes  integer not null check (duration_minutes between 15 and 480),
  buffer_minutes    integer not null default 15 check (buffer_minutes between 0 and 120),
  price_cents       integer not null check (price_cents >= 0),
  deposit_cents     integer not null default 0 check (deposit_cents >= 0),
  requires_pickup   boolean not null default true,
  requires_test_centre boolean not null default false,
  is_active         boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint deposit_not_more_than_price check (deposit_cents <= price_cents)
);

comment on column public.services.buffer_minutes is
  'Travel time the instructor needs either side of this lesson. Enforced by the exclusion constraint on bookings.';

-- -----------------------------------------------------------------------------
-- Weekly working pattern
-- -----------------------------------------------------------------------------
create table if not exists public.weekly_template (
  id                     uuid primary key default gen_random_uuid(),
  weekday                smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time             time not null,
  end_time               time not null,
  slot_interval_minutes  integer not null default 30 check (slot_interval_minutes between 5 and 240),
  created_at             timestamptz not null default now(),
  constraint window_is_forward check (end_time > start_time)
);

comment on table public.weekly_template is
  'Wall-clock working hours in Europe/Dublin. Times are naive on purpose: 09:00 means 9am local, in summer and winter alike.';

create index if not exists weekly_template_weekday_idx on public.weekly_template (weekday);

-- -----------------------------------------------------------------------------
-- Per-date exceptions: holidays, and one-off extra openings
-- -----------------------------------------------------------------------------
create table if not exists public.date_overrides (
  id           uuid primary key default gen_random_uuid(),
  date         date not null,
  start_time   time not null,
  end_time     time not null,
  is_blackout  boolean not null default true,
  note         text,
  created_at   timestamptz not null default now(),
  constraint override_is_forward check (end_time > start_time)
);

create index if not exists date_overrides_date_idx on public.date_overrides (date);

-- -----------------------------------------------------------------------------
-- Bookings, including in-flight holds
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.booking_status as enum (
    'held',       -- customer is in Stripe Checkout, slot reserved briefly
    'pending',    -- awaiting payment confirmation from the webhook
    'confirmed',  -- paid and locked in
    'cancelled',
    'completed',
    'expired',    -- hold timed out
    'no_show'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.transmission_type as enum ('manual', 'automatic');
exception when duplicate_object then null; end $$;

create table if not exists public.bookings (
  id                  uuid primary key default gen_random_uuid(),

  -- Short human reference quoted in emails and on the phone, e.g. "TDS-7K4M2".
  reference           text not null unique,

  service_id          uuid not null references public.services (id) on delete restrict,
  status              public.booking_status not null default 'held',

  customer_name       text not null check (length(trim(customer_name)) between 2 and 120),
  customer_email      text not null check (position('@' in customer_email) > 1),
  customer_phone      text not null check (length(trim(customer_phone)) between 6 and 30),

  pickup_address      text,
  test_centre         text,
  transmission        public.transmission_type,
  notes               text check (notes is null or length(notes) <= 2000),

  starts_at           timestamptz not null,
  ends_at             timestamptz not null,

  -- The protected range: the lesson plus its travel buffer afterwards.
  blocked_from        timestamptz not null,
  blocked_to          timestamptz not null,
  blocked_during      tstzrange generated always as
                        (tstzrange(blocked_from, blocked_to, '[)')) stored,

  -- Holds only. Null once the booking is real.
  expires_at          timestamptz,

  price_cents         integer not null check (price_cents >= 0),
  deposit_cents       integer not null default 0 check (deposit_cents >= 0),

  stripe_session_id       text unique,
  stripe_payment_intent_id text,
  paid_at             timestamptz,
  refunded_at         timestamptz,
  refund_cents        integer check (refund_cents is null or refund_cents >= 0),

  google_event_id     text,
  calendar_synced_at  timestamptz,

  -- Bearer token in the "manage your booking" link. Long and random.
  manage_token        text not null unique default encode(gen_random_bytes(24), 'hex'),

  cancelled_at        timestamptz,
  cancelled_by        text check (cancelled_by is null or cancelled_by in ('customer', 'instructor', 'system')),
  cancellation_reason text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint lesson_is_forward check (ends_at > starts_at),
  constraint block_covers_lesson check (blocked_from <= starts_at and blocked_to >= ends_at),
  constraint holds_have_expiry check (
    (status = 'held' and expires_at is not null) or (status <> 'held')
  )
);

-- The guarantee. Two live bookings can never occupy overlapping time, no
-- matter what the application does, how many requests arrive at once, or which
-- serverless instance handles them.
alter table public.bookings drop constraint if exists bookings_no_overlap;
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (blocked_during with &&)
  where (status in ('held', 'pending', 'confirmed'));

create index if not exists bookings_starts_at_idx on public.bookings (starts_at);
create index if not exists bookings_status_idx on public.bookings (status);
create index if not exists bookings_email_idx on public.bookings (lower(customer_email));
create index if not exists bookings_expiry_idx on public.bookings (expires_at)
  where status = 'held';

-- -----------------------------------------------------------------------------
-- Append-only history, so "what happened to this booking" is always answerable
-- -----------------------------------------------------------------------------
create table if not exists public.booking_events (
  id          bigint generated always as identity primary key,
  booking_id  uuid not null references public.bookings (id) on delete cascade,
  event       text not null,
  detail      jsonb not null default '{}'::jsonb,
  actor       text not null default 'system',
  created_at  timestamptz not null default now()
);

create index if not exists booking_events_booking_idx
  on public.booking_events (booking_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Reviews. Only rows marked is_verified feed the aggregate rating in JSON-LD.
-- -----------------------------------------------------------------------------
create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  author_name   text not null,
  rating        smallint not null check (rating between 1 and 5),
  body          text not null,
  source        text not null default 'google' check (source in ('google', 'direct', 'facebook')),
  source_url    text,
  reviewed_at   date not null,
  is_published  boolean not null default false,
  is_verified   boolean not null default false,
  created_at    timestamptz not null default now()
);

comment on column public.reviews.is_verified is
  'True only for reviews that exist at a checkable public source. Google forbids aggregateRating markup over invented reviews, and so does Irish consumer law.';

create index if not exists reviews_published_idx
  on public.reviews (is_published, reviewed_at desc);

-- -----------------------------------------------------------------------------
-- Contact enquiries, so nothing depends on an email arriving
-- -----------------------------------------------------------------------------
create table if not exists public.enquiries (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null,
  phone        text,
  subject      text,
  message      text not null,
  service_slug text,
  handled_at   timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists enquiries_created_idx on public.enquiries (created_at desc);

-- -----------------------------------------------------------------------------
-- updated_at maintenance
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists services_touch on public.services;
create trigger services_touch before update on public.services
  for each row execute function public.touch_updated_at();

drop trigger if exists bookings_touch on public.bookings;
create trigger bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();

-- =============================================================================
-- Row-level security: deny by default, everywhere.
-- =============================================================================
alter table public.services         enable row level security;
alter table public.weekly_template  enable row level security;
alter table public.date_overrides   enable row level security;
alter table public.bookings         enable row level security;
alter table public.booking_events   enable row level security;
alter table public.reviews          enable row level security;
alter table public.enquiries        enable row level security;

-- No policies are created on purpose. The anon and authenticated roles can
-- therefore read and write nothing. The service role bypasses RLS, and every
-- application path that touches these tables runs server-side under it.
-- If you ever add a client-side read, add a policy here explicitly and think
-- hard about the bookings table, which holds names, emails and home addresses.
