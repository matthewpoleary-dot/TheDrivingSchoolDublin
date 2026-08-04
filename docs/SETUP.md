# Setup and handover

Everything needed to take this from a repository to a live booking system the
instructor runs himself. Work top to bottom; each step is independent enough
that you can stop after any of them and still have a working site.

The site is built to degrade rather than break. With no configuration at all
it still runs as a brochure site that pushes people to phone and WhatsApp.
Each service you connect switches on the next capability.

| Not configured | What happens instead |
| --- | --- |
| Supabase | Booking pages show "ring or WhatsApp us" |
| Stripe | Bookings confirm immediately, no deposit taken |
| Resend | Bookings still save, no confirmation email |
| Google Calendar | Bookings still save, nothing appears on the calendar |

---

## 1. Database (Supabase)

Online booking does not work without this. Do it first.

1. Create a project at [supabase.com](https://supabase.com). Pick the **EU
   (Ireland)** region so customer data stays in the EU, which matters for GDPR.
2. Open **SQL Editor** and run these five files, in order:
   - `supabase/migrations/0001_booking_core.sql`
   - `supabase/migrations/0002_booking_functions.sql`
   - `supabase/migrations/0003_seed.sql`
   - `supabase/migrations/0004_reviews_seed.sql`
   - `supabase/migrations/0005_review_fixes.sql`
3. Go to **Project Settings → API** and copy into your environment:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

> The `service_role` key bypasses row-level security. It must only ever exist
> in server-side environment variables. It is never sent to the browser, and
> `lib/supabase.ts` throws if anything tries.

**Check it worked.** In the SQL editor:

```sql
select slug, duration_minutes, price_cents from services order by sort_order;
select weekday, start_time, end_time from weekly_template order by weekday;
```

You should get four services and six working days.

### What the schema guarantees

The `bookings` table carries an exclusion constraint:

```sql
exclude using gist (blocked_during with &&)
  where (status in ('held', 'pending', 'confirmed'))
```

Two live bookings can never overlap in time. Not "unlikely to" — the database
rejects the second write. This holds under any number of simultaneous requests
across any number of serverless instances, and it would hold even if the
application code were wrong. `blocked_during` includes the instructor's travel
buffer either side, so back-to-back lessons in different parts of Dublin are
also impossible.

---

## 2. Payments (Stripe)

1. Create an account at [stripe.com](https://stripe.com) and stay in **test
   mode** for now.
2. **Developers → API keys**: copy the secret key → `STRIPE_SECRET_KEY`.
3. **Developers → Webhooks → Add endpoint**:
   - URL: `https://YOUR-DOMAIN/api/stripe/webhook`
   - Events: `checkout.session.completed`, `checkout.session.expired`,
     `charge.refunded`, `charge.dispute.created`,
     `checkout.session.async_payment_succeeded`,
     `checkout.session.async_payment_failed`
   - Copy the signing secret → `STRIPE_WEBHOOK_SECRET`

**Test locally** with the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Card `4242 4242 4242 4242`, any future expiry, any CVC.

**Before going live**, run one complete real booking in test mode and confirm
all four of these happened:

- [ ] The booking row moved to `confirmed` in Supabase
- [ ] The pupil received a confirmation email with a working `.ics` attachment
- [ ] The lesson appeared on the instructor's Google Calendar
- [ ] Cancelling from the pupil's own page refunded the deposit in Stripe

Only then swap the test keys for live ones.

### How the money works

A fixed €20 deposit is taken at booking; the balance is paid to the instructor
on the day. Change the amount in **one** place, `BOOKING_POLICY.depositCents`
in `lib/config.ts`, and in the `deposit_cents` column of the `services` table.

---

## 3. Email (Resend)

1. Create an account at [resend.com](https://resend.com).
2. Add and verify the sending domain. **This step is not optional**: an
   unverified domain means email silently lands in spam or is rejected.
3. Copy the API key → `RESEND_API_KEY`.
4. Set `FROM_EMAIL` to an address on the verified domain, and `ADI_EMAIL` to
   wherever the instructor wants notifications.

---

## 4. Google Calendar

This uses a **service account with the calendar shared to it**, rather than
OAuth. That is a deliberate choice: OAuth refresh tokens on a personal Google
account expire, need a consent screen, and break silently months later. A
shared calendar never expires and takes two clicks.

1. Go to the [Google Cloud Console](https://console.cloud.google.com), create
   a project.
2. **APIs & Services → Library**, enable **Google Calendar API**.
3. **APIs & Services → Credentials → Create credentials → Service account**.
   Name it something like `tds-calendar`. No roles needed.
4. Open the service account → **Keys → Add key → Create new key → JSON**.
   Download it.
5. From that JSON file:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY` (keep the quotes; `\n` may stay
     literal)
6. **The step people miss.** In the instructor's own Google Calendar:
   **Settings → the calendar → Share with specific people → Add people**, paste
   the service account email, and set permission to **Make changes to events**.
7. Set `GOOGLE_CALENDAR_ID` to the instructor's calendar address, usually just
   their Google account email.

**Check it worked.** Log in at `/admin`. The Calendar tile reads "Synced". If
it reads "Off", step 6 was missed.

### What syncs, and in which direction

- **Out**: every confirmed booking becomes a calendar event with the pupil's
  name, phone and pick-up address in the description. Cancelling deletes it.
- **In**: anything already in the instructor's calendar blocks those times on
  the website. He can block time off by putting "Dentist" in his own calendar
  and the site will stop offering that slot.

If Google is unreachable, **bookings still succeed**. The failure is recorded
and the maintenance cron retries it. The admin dashboard warns about anything still
unsynced.

---

## 5. Admin access

```bash
openssl rand -hex 32   # run twice
```

- `ADMIN_PASSWORD` — long and random. This guards every customer's name, phone
  number and home address, so it is the weakest link if you make it "conor123".
- `ADMIN_SESSION_SECRET` — the first `openssl` output. Changing it later logs
  everyone out immediately, which is how you revoke access.
- `CRON_SECRET` — the second output. Protects the maintenance job.

---

## 6. Deploy

Push the branch and let Vercel build it. Set every variable from
`.env.example` in **Project Settings → Environment Variables**.

`vercel.json` already configures:

- A daily cron on `/api/cron/maintenance`
- Security headers, and `noindex` on `/admin` and `/booking/*`

> **Plan limits.** The cron is scheduled daily and no `regions` are pinned,
> because Vercel's Hobby plan permits only one cron run per day and rejects a
> deployment that pins a function region. Both restrictions are lifted on Pro.
> On Pro you can change the schedule to `"0 * * * *"` and add
> `"regions": ["dub1"]` for shorter database round trips from Dublin. Neither
> is required for correctness, see below.

### The maintenance job

The reason the system heals itself:

1. Sweeps expired holds and abandoned checkouts, releasing those slots
2. Retries calendar syncs that failed earlier
3. Sends reminder emails for upcoming lessons

**It is deliberately frequency-independent**, so it is correct whether it runs
once a day or once an hour. Reminders cover a 48-hour window and are
deduplicated by a `reminder_sent` event, rather than matching a narrow slice
that a daily run would miss. Hold expiry does not depend on the cron at all:
`hold_slot()` sweeps stale holds at the head of every booking attempt, so a
slot is always reclaimed on demand. The cron is the backstop, not the
mechanism.

Every step is idempotent, so running it twice is harmless.

---

## 7. Reviews, and a warning worth reading

The previous site displayed six reviews with invented-looking names and
emitted this in its structured data:

```js
aggregateRating: { ratingValue: "5.0", reviewCount: 36 }
```

The count was hardcoded, with six reviews on the page. That is a problem twice
over. Google's structured data policy prohibits marking up ratings that are
not genuinely collected, and penalties range from losing rich results to a
manual action. Separately, under the EU Omnibus Directive as implemented in
Ireland by S.I. 335/2022, presenting consumer reviews without taking
reasonable steps to ensure they come from real customers is a prohibited
commercial practice, enforceable by the CCPC.

So this rebuild makes it structurally impossible to repeat by accident:

- Reviews come from the `reviews` table, never from hardcoded arrays.
- `aggregateRating` is emitted **only** from rows where `is_verified = true`.
- With no verified rows, no rating schema is emitted at all, and the page says
  so honestly rather than inventing numbers.

### Adding real reviews

```sql
insert into reviews (author_name, rating, body, source, source_url, reviewed_at,
                     is_published, is_verified)
values ('Aisling M.', 5,
        'Passed first time in Tallaght. Conor was calm the whole way through.',
        'google', 'https://g.page/r/.../review', '2026-07-18',
        true,   -- show it on the site
        true);  -- ONLY if it exists at a real, checkable public source
```

Set `is_verified = true` only when you could show someone the review on Google
if asked. If in doubt, publish it as a testimonial with `is_verified = false`:
it still appears on the page, it just carries no rating markup.

---

## 8. Day-to-day, for the instructor

Everything lives at `/admin`.

**Bookings.** Today by default. Each card shows the pupil's name, a
tap-to-call number, the pick-up address and what is still owed. Past lessons
can be marked done or as a no-show. Cancelling refunds the deposit and removes
the calendar entry in one action.

**Time off.** Put it in your own Google Calendar. The website reads it and
stops offering those slots. No second system to keep up to date.

**Changing working hours.** `weekly_template` in Supabase, or the admin
availability endpoint. Times are wall-clock Dublin time and stay correct
across the clock changes in March and October.

**Prices.** `lib/config.ts` for what is displayed, and the `services` table for
what is charged. Change both together.

---

## Local development

```bash
npm install
cp .env.example .env.local   # fill in what you have
npm run dev
npm test                     # 59 tests, no services required
```

The tests cover the parts where a bug is expensive and invisible: timezone
conversion across daylight saving, slot generation against bookings, holds,
calendar busy time and buffers, and admin session signing. They need no
database and no network.

```bash
npm run test:coverage        # coverage for lib/
npm run build                # production build
```

> Do not run `npm run build` while `npm run dev` is running. They share
> `.next/` and the production build will corrupt the dev server's state, which
> shows up as a confusing `Cannot find module './586.js'`. Stop dev first, or
> delete `.next` afterwards.

---

## Things worth knowing before you change anything

**Never build a Date from a naive string.** `new Date("2026-08-10T09:00:00")`
is parsed in the *host's* timezone, so it means one thing on a laptop in
Dublin and another on a Vercel function in UTC. The previous booking code did
exactly this and every Irish summer slot was an hour out. Use
`zonedTimeToUtc()` from `lib/time.ts`. There are tests pinned to both clock
changes.

**Availability is advisory; the database is authoritative.** `/api/availability`
can be stale by the time somebody finishes typing their phone number. The real
decision is made by the exclusion constraint inside `hold_slot()`, and the UI
recovers gracefully from losing that race.

**Side effects must never break a booking.** Calendar and email failures are
logged to `booking_events` and retried by cron. A paid booking in the database
is a real booking regardless of what Google or Resend are doing.

**The Stripe webhook must read the raw body.** Signature verification is over
the exact bytes Stripe sent. Use `request.text()`, never `request.json()`.
