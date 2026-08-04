# The Driving School Dublin

Website and booking system for a Dublin driving instructor. Next.js 15, React
19, Tailwind 4, Supabase, Stripe, Resend and Google Calendar.

**Setup and handover: [`docs/SETUP.md`](docs/SETUP.md).** Read that before
deploying or changing anything.

---

## What it does

- **Books lessons online** against the instructor's real Google Calendar, with
  a deposit taken through Stripe and confirmation emails carrying a calendar
  invite.
- **Cannot double-book.** A Postgres exclusion constraint makes overlapping
  bookings impossible at the database level, including the instructor's travel
  buffer between lessons.
- **Heals itself.** A scheduled job releases abandoned holds, retries failed
  calendar syncs and sends reminders.
- **Degrades instead of breaking.** With no services configured it still runs
  as a brochure site pointing at the phone. Each key you add switches on the
  next capability.

## Layout

```
app/
  api/
    availability/          Open slots for the calendar UI
    bookings/              Create a booking; cancel via manage token
    stripe/webhook/        The only thing that confirms a paid booking
    admin/                 Session, bookings, working hours
    cron/maintenance/      Scheduled self-healing job
  book/                    The booking flow
  booking/[token]/         The pupil's own booking page
  admin/                   Instructor dashboard
components/
  BookingFlow.tsx          Three-step picker, slot recovery on conflict
  NextAvailable.tsx        Live slots in the homepage hero
  brand.tsx                Plate, containers, sections, primitives
lib/
  time.ts                  Timezone conversion. Read the notes before editing.
  availability.ts          Pure slot computation, plus the database wrapper
  config.ts                Single source of truth for the business
  booking-service.ts       Calendar and email side effects
supabase/migrations/       Schema, atomic functions, seed
test/                      59 tests, no services required
```

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
npm test
```

Do not run `npm run build` while `npm run dev` is running; they share `.next/`.

## Design

The design language comes from the logo, which already encodes the Irish
learner journey: a red **L** on a white plate, then a red **N**. That plate is
the repeating device across the site. Corners are sharp, there is one typeface
(Archivo) at several weights, and red is structural rather than decorative: it
marks the plate and the single primary action on a screen, nothing else.

Component CSS lives in `@layer components` so Tailwind utilities reliably
override it. Putting it outside a layer means it wins on source order instead,
which silently breaks things like `hidden sm:grid`.

## Testing

```bash
npm test                 # 59 tests
npm run test:coverage
```

The suite concentrates on the places where a bug is expensive and invisible:
timezone conversion across both Irish clock changes, slot generation against
bookings, holds, calendar busy time and travel buffers, and admin session
signing and expiry.
