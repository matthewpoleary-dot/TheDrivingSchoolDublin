# The Driving School Dublin

Next.js 15 (App Router) + React 19 + TypeScript + Tailwind v4. Booking and payment site
for a Dublin driving instructor: Supabase (data), Stripe (payments), Google Calendar
(instructor's diary), Resend (email).

```bash
npm run dev      # localhost:3000
npm run build    # production build
npm run lint
```

Env lives in `.env.local` (Supabase, Stripe, Google, Resend keys). Never print, copy or
commit its contents. The keys are live.

## Current work: a visual redesign

A full visual and interaction redesign of a site that already works. **The design
changes; the behaviour does not.** Every existing feature stays, every route keeps
working, nothing about data, payments or scheduling moves.

### Hard limits

- **Do not touch `app/api/**`, `lib/`, or `supabase/`.** Payments, availability, EDT
  packages, calendar sync and email are out of scope. If a redesign seems to need a
  change there, stop and ask.
- **Do not change routes, URLs or query parameters.** `/book?service=<slug>` and
  `?cancelled=1` come from Stripe and from emailed links.
- **Do not change prices or service slugs.** `lib/pricing.ts` is the single source of
  truth. Displayed prices must match it exactly.
- **Never run the booking, checkout or admin flows against the real services.** Use the
  fixtures in `redesign/fixtures.mjs` when a screen needs data.
- **Work on a branch off `feat/booking-system`, never `main`.** Commit after each
  meaningful step so any step can be rolled back on its own.

### Design direction

- **Mobile first.** Design at 390px, then 768px, then 1440px. Most visitors are on a
  phone, and the sticky booking bar is mobile-only.
- **Brand red is `#C8102E`.** Unify on it. The Tailwind-styled screens currently use
  `#d90429` and Tailwind's `red-600`; those are accidents, not brand colours.
- **Motion is welcome.** Scroll-driven effects, richer transitions and considered hover
  states are in scope, as long as they stay smooth on a mid-range phone and respect
  `prefers-reduced-motion`.
- Existing motion to keep or improve: rotating hero word, review carousel, the nav that
  morphs from a flat bar into a floating pill, the mobile action bar slide-up.

### Copy rules

Copy may be rewritten, but only with real research into what the page is claiming, and
only when the new wording is clearly better. Ask before changing anything factual:
prices, lesson lengths, EDT rules, coverage areas, test-centre claims, response times.

**No em dashes, ever.** Use a comma, a full stop or a colon. This applies to every word
written for the site.

## Routes

Walk the router, not the nav. Three routes are not linked from the header or footer.

| Route | Notes |
|---|---|
| `/` | Hero, pricing rows, process, review carousel, closing CTA, mobile sticky bar |
| `/about` | |
| `/prices` | Includes the FAQ accordion |
| `/reviews` | **Not linked anywhere.** The nav's "Reviews" points at `/#reviews` |
| `/contact` | Contact form with validation, plus WhatsApp / call / email cards |
| `/book` | Four-step client flow: service, slot, details, redirecting to Stripe |
| `/book/confirmation` | Stripe success page, different content for EDT vs single lessons |
| `/book/[token]` | **Not linked anywhere.** EDT package holders book sessions from an emailed link. Has expired, complete, max-sessions, error and booked states |
| `/admin` | **Not linked anywhere.** Password-gated dashboard: calendar, add availability, bookings, EDT packages. In scope for redesign |

There is no custom 404. Unknown paths render the Next.js default inside the site layout.

## Two styling systems

The site is half one thing and half another. A redesign that only looks at the homepage
will leave the second half behind.

1. **Inline styles** (`style={{ ... }}`) with CSS variables from `app/globals.css`
   (`--ink`, `--red`, `--rule`, `--tint`). Used by the marketing pages, the booking flow
   and their components.
2. **Tailwind utility classes** with the stock palette (`slate`, `gray`, `emerald`,
   `green`, `amber`) and hardcoded `#d90429`. Used by `/admin`, `/book/[token]`,
   `/book/confirmation`, the contact page and `ContactForm` / `ContactOptions`.

The same roles have different values in each: two "primary text" greys, two success
greens, three reds. Consolidating them is welcome, as long as it is deliberate and the
result is checked on every screen listed above.

## Dead code, leave it alone

`components/AreasCovered.tsx`, `HowItWorks.tsx`, `PricingPreview.tsx`,
`Testimonials.tsx`, `icons/Check.tsx` and `icons/Star.tsx` render on no route. Do not
restyle them, do not delete them, do not wire them up. Also unused in `globals.css`:
`.badge`, `.icon-bubble`, `.section-soft`, `.no-scrollbar`.

Known gap, not in scope: `/book/confirmation` has no label for the `edt-split` or
`car-hire-*` slugs, so those show the raw slug.

## Checking the work

`redesign/` holds a Playwright sweep of 53 UI states at 390 / 768 / 1440, with API
fixtures so it never touches Supabase, Stripe, Google Calendar or Resend, and a frozen
clock so two runs match exactly. Optional, but it is the fastest way to prove nothing
broke.

```bash
npm run build && npx next start -p 3100
node redesign/sweep.mjs current          # screenshots every state
node redesign/diff.mjs baseline current  # pixel diff against the pre-redesign baseline
```

`redesign/INVENTORY.md` lists every route, every interactive element (forms, modals,
tabs, accordions, toasts, loading and error states) and what each one does today. It is
the checklist for "every feature still works". If the baseline images are missing,
recreate them by checking out the Step 0 commit on `feat/redesign` and sweeping with the
label `baseline`.
