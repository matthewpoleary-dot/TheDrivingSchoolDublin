# The Driving School Dublin

Website and lesson-request system for [The Driving School Dublin](https://thedrivingschooldublin.com), an RSA-approved driving instructor (ADI) serving learners across Dublin. Built and maintained by me for the business.

**Live:** https://thedrivingschooldublin.com

## What it does

- **Marketing site:** home, about, prices, reviews, FAQ, areas covered and contact pages, with a sticky call-to-action on mobile.
- **Lesson requests:** learners submit name, contact details, area, car type (manual or automatic), lesson type and preferred availability, with explicit consent.
- **Availability engine:** slots are computed from a weekly template (working hours, slot interval, buffer between lessons), then adjusted for existing bookings, overrides and blackout dates. See `lib/availability.ts`.
- **Admin view:** a token-protected page for reviewing and managing bookings.
- **Email:** contact-form and booking notifications sent through Resend.

## Stack

Next.js (App Router), React, TypeScript, Tailwind CSS, Supabase (Postgres), Resend, Zod for validation, SWR, date-fns. Deployed on Vercel.

## Running it locally

```bash
npm install
npm run dev
```

Create `.env.local` with:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project |
| `RESEND_API_KEY`, `FROM_EMAIL`, `ADI_EMAIL` | Email sending and the instructor's inbox |
| `ADMIN_TOKEN` | Bearer token for the admin API |
| `TIMEZONE` | Timezone used for slot calculation |
| `NEXT_PUBLIC_FORMSPREE_ENDPOINT` | Optional contact fallback |

The Supabase tables the app reads are `services`, `weekly_template`, `overrides` and `bookings`.