-- =============================================================================
-- Make the reminder job genuinely idempotent.
-- =============================================================================
--
-- The job read booking_events to see whether a reminder had been sent, then
-- sent the email, then wrote the event. Three round trips, so two overlapping
-- runs could both pass the read before either wrote, and both email the pupil.
--
-- That is the same check-then-act shape already recorded in the mistake ledger
-- from a previous project, where two callers both emailed the customer. The
-- code claimed to be idempotent; it was not.
--
-- The fix is to make the claim itself atomic and let the database decide the
-- winner, exactly as the exclusion constraint does for slots.
-- =============================================================================

-- A booking may accumulate many calendar_failed or email_failed events, so a
-- blanket unique constraint on (booking_id, event) would be wrong. Only the
-- reminder is once-per-booking, so the index is partial.
create unique index if not exists booking_events_one_reminder_per_booking
  on public.booking_events (booking_id)
  where event = 'reminder_sent';

-- -----------------------------------------------------------------------------
-- Claim the right to send, atomically. Returns true only for the caller that
-- won. Everyone else gets false and must not send.
-- -----------------------------------------------------------------------------
create or replace function public.claim_reminder(p_booking_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  insert into public.booking_events (booking_id, event, detail, actor)
  values (p_booking_id, 'reminder_sent', '{}'::jsonb, 'system')
  on conflict do nothing;

  -- INSERT ... ON CONFLICT DO NOTHING affects one row for the winner and zero
  -- for anybody who lost the race against the partial unique index.
  return found;
end $$;

-- -----------------------------------------------------------------------------
-- Release the claim when the send actually failed, so a later run retries.
-- Without this, a transient Resend outage would permanently consume the pupil's
-- one reminder.
-- -----------------------------------------------------------------------------
create or replace function public.release_reminder_claim(p_booking_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  delete from public.booking_events
   where booking_id = p_booking_id
     and event = 'reminder_sent';
end $$;

revoke all on function public.claim_reminder(uuid) from public, anon, authenticated;
revoke all on function public.release_reminder_claim(uuid) from public, anon, authenticated;

grant execute on function public.claim_reminder(uuid) to service_role;
grant execute on function public.release_reminder_claim(uuid) to service_role;
