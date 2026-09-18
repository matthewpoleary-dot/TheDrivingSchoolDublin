# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Learner drivers in Dublin, most often arriving on a phone from Google search or Maps.
Three jobs, in rough order of volume:

- A first-time learner who has to complete the 12-lesson EDT (Essential Driver Training)
  and wants one instructor to take them through it.
- A learner with a test date who wants pre-test lessons and often car hire for the day.
- A licensed driver returning after a break (refresher).

They arrive anxious about the test (Dublin centres pass roughly half of candidates) and
price-comparing. They need to see what a lesson costs, trust the person, and book in a
few taps.

A second audience is the instructor himself, who runs `/admin` on his phone between
lessons to add availability, check bookings and follow EDT packages.

## Product Purpose

A booking and payment site for a one-instructor Dublin driving school. Success is more
paid bookings: a visitor lands, understands cost, trusts Conor, and completes checkout
without needing to call or message.

## Positioning

Conor is a former RSA driving tester who worked at the Dún Laoghaire, Tallaght and the
old Churchtown test centres, and is now an RSA-approved ADI. He has marked the test
sheet himself. No multi-instructor school or app can truthfully claim that about the
person who will sit in your car. His prices sit above the Dublin market (single lessons
typically €40 to €70, 12 EDT typically €420 to €800 in 2026), so the site has to earn
the premium with that credential, not hide from the comparison.

## Operating Context

- Manual lessons in Conor's dual-control car; automatic lessons in the learner's own car.
- Covers Dublin, with South Dublin as the core area.
- Hours: Monday to Saturday, 8am to 6pm.
- Booking: choose service, pick a slot from the live calendar, enter details, pay with
  Stripe. EDT bundle holders book each session from a personal emailed link.
- Contact by WhatsApp, phone (+353 86 0235 666) or email.

## Capabilities and Constraints

- Prices and slugs come from `lib/pricing.ts` only. Standard €80 (60 min), Pre-Test €100,
  Refresher €80, 6 Reduced EDT €455, EDT Bundle 12 lessons €905, EDT split €475 × 2,
  car hire at test centre €150, local pickup €200, car hire plus pre-test lesson €245.
- Pre-test lesson length is unresolved: homepage says 1 hour, `lib/pricing.ts` says 120
  minutes, the owner said 1 hour 30 (2026-09-18). Do not state a length until confirmed.
- Routes, URLs and query parameters are fixed (Stripe and emailed links depend on them).
- `app/api`, `lib`, `supabase` are out of scope for the redesign.

## Brand Commitments

- Palette is fixed: red `#C8102E`, black `#0A0A0A`, white, greys as neutrals only. No new
  accent, no second brand colour, no gradient palette. Muted functional status colours
  are the only exception (calendar availability, admin payment badges).
- Logo (`public/Logo.jpg`): heavy black grotesque wordmark stacked on four lines, with the
  L of "School" in red on a grey L-plate square and the N of "Dublin" in red.
- Voice: first person from Conor on marketing pages ("my car"), plain and calm.
- No em dashes in any copy.

## Evidence on Hand

- 5.0 stars from 54 Google reviews, with real review text in `components/ReviewCarousel.tsx`
  and `app/reviews/page.tsx`.
- Former RSA tester at Dún Laoghaire, Tallaght and old Churchtown centres; RSA-approved ADI.
- No photography of Conor or the car exists yet. Do not fabricate one. Leave a slot.
- No pass-rate figure, years-of-service figure or test count is confirmed. Do not invent.

## Product Principles

1. The credential leads. Being the ex-tester is the reason to pay more; it should be the
   first thing read on every marketing surface.
2. Price is shown, never gated. Competitors hide prices behind calculators; this site
   states them.
3. One tap to book from anywhere on a phone.
4. Calm, not salesy. The visitor is nervous about a test; the site should lower the pulse.
5. The admin tool is a working tool for one person on a phone: speed over expression.
