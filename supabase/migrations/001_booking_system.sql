-- 001_booking_system.sql
-- Run this in the Supabase SQL editor (or via supabase db push if using CLI)

-- ─────────────────────────────────────────────
-- 1. availability_slots
-- ─────────────────────────────────────────────
create table if not exists availability_slots (
  id               uuid primary key default gen_random_uuid(),
  date             date        not null,
  start_time       time        not null,
  end_time         time        not null,
  duration_minutes int         not null,
  lesson_types     text[]      not null default '{}',
  is_booked        boolean     not null default false,
  booking_id       uuid        null,
  created_at       timestamptz not null default now()
);

create index if not exists idx_slots_date on availability_slots (date);
create index if not exists idx_slots_is_booked on availability_slots (is_booked);

-- ─────────────────────────────────────────────
-- 2. bookings  (replaces the old bookings table)
-- ─────────────────────────────────────────────
-- If you had an old bookings table with a different schema, rename it first:
-- ALTER TABLE bookings RENAME TO bookings_legacy;

create table if not exists bookings (
  id                   uuid primary key default gen_random_uuid(),
  slot_id              uuid        null references availability_slots(id) on delete set null,
  service_type         text        not null,
  customer_name        text        not null,
  customer_email       text        not null,
  customer_phone       text        not null default '',
  stripe_session_id    text        null,
  stripe_payment_intent text       null,
  payment_status       text        not null default 'pending'
                         check (payment_status in ('pending','paid','refunded','cancelled','failed')),
  amount_pence         int         not null default 0,
  edt_package_id       uuid        null,
  notes                text        null,
  created_at           timestamptz not null default now()
);

create index if not exists idx_bookings_stripe_session on bookings (stripe_session_id);
create index if not exists idx_bookings_email on bookings (customer_email);
create index if not exists idx_bookings_status on bookings (payment_status);

-- ─────────────────────────────────────────────
-- 3. edt_packages
-- ─────────────────────────────────────────────
create table if not exists edt_packages (
  id             uuid primary key default gen_random_uuid(),
  booking_id     uuid        not null references bookings(id) on delete cascade,
  customer_email text        not null,
  customer_name  text        not null,
  lessons_total  int         not null,
  lessons_used   int         not null default 0,
  access_token   uuid        not null default gen_random_uuid(),
  expires_at     date        not null,
  created_at     timestamptz not null default now(),
  constraint uq_edt_access_token unique (access_token)
);

create index if not exists idx_edt_access_token on edt_packages (access_token);

-- ─────────────────────────────────────────────
-- 4. edt_sessions
-- ─────────────────────────────────────────────
create table if not exists edt_sessions (
  id             uuid primary key default gen_random_uuid(),
  package_id     uuid        not null references edt_packages(id) on delete cascade,
  slot_id        uuid        not null references availability_slots(id) on delete restrict,
  session_number int         not null,
  status         text        not null default 'scheduled'
                   check (status in ('scheduled','completed','cancelled')),
  created_at     timestamptz not null default now()
);

create index if not exists idx_edt_sessions_package on edt_sessions (package_id);

-- ─────────────────────────────────────────────
-- 5. Back-reference FK on bookings → edt_packages
-- ─────────────────────────────────────────────
-- (added after both tables exist)
alter table bookings
  add constraint fk_bookings_edt_package
  foreign key (edt_package_id) references edt_packages(id) on delete set null
  not valid; -- not valid so existing rows without package_id are fine

-- ─────────────────────────────────────────────
-- 6. RLS — keep it simple: service role bypasses all
-- ─────────────────────────────────────────────
alter table availability_slots enable row level security;
alter table bookings            enable row level security;
alter table edt_packages        enable row level security;
alter table edt_sessions        enable row level security;

-- Allow public reads on open slots (needed for GET /api/availability)
create policy "public_read_open_slots"
  on availability_slots for select
  using (is_booked = false);

-- Service role key (used in all API routes) bypasses RLS automatically.
-- No other policies needed — all writes go through the service role.
