create table if not exists public.booking_intents (
  id uuid primary key,
  service_code text not null check (service_code in ('standard', 'pre_test', 'refresher')),
  cal_event_type_id bigint not null,
  slot_start timestamptz not null,
  slot_end timestamptz not null,
  duration_minutes integer not null check (duration_minutes > 0),
  total_cents integer not null check (total_cents > 0),
  payable_now_cents integer not null check (payable_now_cents > 0),
  outstanding_cash_cents integer not null default 0 check (outstanding_cash_cents >= 0),
  payment_choice text not null check (payment_choice in ('full', 'deposit_cash')),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  pickup_address text not null,
  eircode text,
  car_choice text not null check (car_choice in ('manual_instructor', 'automatic_student')),
  cal_reservation_uid text not null,
  reservation_expires_at timestamptz not null,
  stripe_payment_intent_id text unique,
  cal_booking_uid text unique,
  status text not null default 'pending_payment' check (
    status in ('pending_payment', 'confirming', 'confirmed', 'payment_failed', 'manual_review')
  ),
  failure_reason text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists booking_intents_slot_start_idx
  on public.booking_intents (slot_start);

create index if not exists booking_intents_status_idx
  on public.booking_intents (status);

create table if not exists public.stripe_webhook_events (
  id text primary key,
  processed_at timestamptz not null default now()
);

alter table public.booking_intents enable row level security;
alter table public.stripe_webhook_events enable row level security;

-- No browser policies are intentionally defined. These tables are accessed
-- only through server routes using the Supabase service-role key.
