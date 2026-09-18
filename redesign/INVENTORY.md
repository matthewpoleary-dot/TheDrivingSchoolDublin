# Redesign baseline — route and interaction inventory

Captured 18 Sept 2026 on `feat/redesign` at the Step 0 commit. This file is the
checklist for "every interactive element still does what it did before".

## How to re-run the sweep

```bash
npm run build
npx next start -p 3100            # or preview "sweep" in .claude/launch.json
node redesign/sweep.mjs current   # → redesign/shots/current/{390,768,1440}/*.png
node redesign/diff.mjs baseline current
```

- 53 states × 3 widths = 159 full-page PNGs (modal and scrolled-nav states are viewport-only).
- Every `/api/*` call is answered from `redesign/fixtures.mjs`, so a sweep never touches
  Supabase, Stripe, Google Calendar or Resend, and the admin screens need no real password.
- Clock frozen at Mon 21 Sep 2026 09:00 Europe/Dublin, so rotating copy, carousels and
  toast timeouts stand still, and calendars always show the same week.
- Two back-to-back sweeps of the same commit diff at 159/159 identical.
- PNGs are gitignored. To recreate `baseline/`, check out the Step 0 commit and sweep it with label `baseline`.

## Routes (from `app/`, not the nav)

| Route | Rendering | In nav? | Notes |
|---|---|---|---|
| `/` | static | logo | Hero, pricing, process, reviews carousel, closing CTA, mobile sticky bar |
| `/about` | static | yes | |
| `/prices` | static | yes | Includes FAQ |
| `/reviews` | static | **no** (nav's "Reviews" goes to `/#reviews`) | Reachable by URL only |
| `/contact` | static | footer only | Contact form + direct-contact cards |
| `/book` | static, client-driven | CTA | 4-step state machine: service → slot → details → redirecting |
| `/book?service=<slug>` | | from `/prices` "Book this" | Jumps straight to slot (or details for EDT slugs) |
| `/book?cancelled=1` | | Stripe cancel URL | Amber "payment cancelled" banner |
| `/book/confirmation?session_id=` | | Stripe success URL | |
| `/book/[token]` | dynamic | emailed link only | EDT package holder books individual sessions |
| `/admin` | client | **no** | Client-side token gate; all data via `/api/admin/*` |
| any unknown path | Next default 404 | | Unstyled Next.js not-found page |

API routes (behaviour only, no UI): `/api/availability`, `/api/availability/[id]`, `/api/admin/{bookings,bookings/[id],slots,edt-packages,edt-packages/[id]/sessions}`, `/api/checkout`, `/api/checkout/session`, `/api/contact`, `/api/edt/[token]`, `/api/edt/[token]/book`, `/api/services`, `/api/test-calendar`, `/api/webhooks/stripe`.

## Captured states

| Area | State ids |
|---|---|
| Marketing | `home`, `home--scrolled`, `home--review-2`, `about`, `prices`, `prices--faq-open`, `reviews`, `not-found` |
| Contact | `contact`, `contact--validation`, `contact--success`, `contact--error` |
| Booking | `book--service`, `book--cancelled`, `book--car-hire-option`, `book--slot`, `book--slot-empty`, `book--slot-more-dates`, `book--slot-date`, `book--slot-selected`, `book--details`, `book--details-other-area`, `book--details-error`, `book--details-bundle` |
| Confirmation | `confirmation--no-session`, `confirmation--lesson`, `confirmation--edt` |
| EDT token | `edt-token`, `edt-token--selected`, `edt-token--booked`, `edt-token--book-error`, `edt-token--expired`, `edt-token--complete`, `edt-token--max-sessions`, `edt-token--invalid` |
| Admin | `admin--login`, `admin--calendar`, `admin--calendar-error`, `admin--calendar-next-week`, `admin--modal-booked`, `admin--modal-edt`, `admin--modal-orphan`, `admin--slot-removed-toast`, `admin--add-availability`, `admin--add-availability-manual`, `admin--add-availability-toast`, `admin--bookings`, `admin--bookings-filtered`, `admin--bookings-empty`, `admin--edt`, `admin--edt-expanded`, `admin--edt-expanded-empty`, `admin--edt-empty` |

**Not captured** (transient or unreachable without real services): loading text (`Loading…`,
`Loading availability…`, `Verifying your booking…`, `Loading your package…`), `book` step
`redirecting` (navigates to Stripe), button busy labels (`Sending…`, `Adding…`,
`Generating slots…`, `Booking…`, `Working…`), and hover states. Check these by hand at the end.

## Interactive inventory

### Global
- **MorphingNav** (`components/MorphingNav.tsx`): flat bar at scrollY ≤ 8, pill with shimmer animation when scrolled (rAF-throttled scroll listener). Links: Prices, Process (`/#process`), Reviews (`/#reviews`), About, "Book a lesson →". Centre links hidden < 768px; "Dublin" hidden < 640px.
- **Footer**: link columns incl. `tel:`, `mailto:`, WhatsApp.
- `html { scroll-behavior: smooth }`; anchor links scroll smoothly.

### Home (`/`)
- **RotatingWord**: cycles 4 words every 3.5s with a 280ms fade, stops after one loop.
- **ReviewCarousel**: auto-advances every 5s with a 350ms fade; 3 dot buttons jump to a review; external link to Google reviews.
- **StickyCTA** (mobile < 768 only): appears after scrollY > 300 with a slide-up animation; WhatsApp / Book now / Contact.

### Prices (`/prices`)
- 9 "Book this →" links → `/book?service=<slug>`.
- **FAQ**: 6 native `<details>` accordions; "+" rotates 45° and turns red when open.

### Contact (`/contact`)
- **ContactForm**: client validation (name required, email required + format, message ≥ 10 chars); inline field errors clear on edit; hidden honeypot `company`; POST `/api/contact`; success banner (form resets) / error banner; button disabled + "Sending…" while in flight.
- **ContactOptions**: WhatsApp (new tab), `tel:`, `mailto:` cards.

### Booking (`/book`)
- **Step indicator**: i / ii / iii with done ✓ state.
- **Service step**: 6 service buttons (EDT slugs skip the slot step); car-hire `<select>` updates the displayed price; arrow button continues with the selected car-hire variant. Hover turns the arrow circle red.
- **Slot step** (`BookingCalendar`): fetches 2 months of availability; 15 date cards (green = has slots, red/disabled = full); "Show more dates →" adds 15 days and fetches another month when needed; picking a date shows time pills; picking a time shows "Selected slot" bar + Continue. ← Back resets the slot.
- **Details step**: name / email / phone / pickup-area select / notes; focus darkens the border (inline JS handlers); area "other" shows a red warning with a contact link and disables Pay; Pay POSTs `/api/checkout` then redirects to Stripe; error message on failure. ← Back goes to slot (or service for EDT bundles).
- `?cancelled=1` banner; `?service=` preselect; Suspense fallback "Loading…".

### Confirmation (`/book/confirmation`)
- Fetches the Stripe session; different "What happens next" lists for EDT vs single lessons; error line if the fetch fails.

### EDT token (`/book/[token]`)
- States: loading, invalid/error, expired (amber), complete (green 🎉), max 2 active sessions (amber notice, calendar hidden), normal (stats + calendar), slot selected (green bar + Confirm), booking error (red), booked (green ✅ + "Book another session", which refetches the package).

### Admin (`/admin`)
- **Login**: password field (Enter or button). The token is only checked server-side, per API call.
- **Tabs**: My calendar / Add availability / Bookings list / EDT packages; each tab fetches on switch.
- **Toast** (green, 3s) and **error banner** (red, 4s).
- **Calendar**: prev/next week, "Today" link when offset ≠ 0, Refresh; 7-day grid, past days dimmed, today in red, "n booked" count; booked slots open the **Booking detail modal** (click backdrop or × or Close to dismiss); hover reveals a × delete button per slot.
- **Booking detail modal**: regular booking (tel/mailto links, amount, paid/pending colour), EDT session variant, orphan-slot amber variant; "Cancel booking" / "Free this slot" deletes the slot.
- **Add availability**: "Add one slot manually" `<details>` (date/start/end/duration + lesson-type checkboxes); "Fill my schedule automatically" `<details open>` (date range, duration + travel `<select>`s, per-day enable checkbox + times with a live "~n slots" estimate, lesson types, Generate button).
- **Bookings list**: Refresh, date filter + "Clear date", empty state, table with status badges (paid / pending / failed / cancelled / refunded).
- **EDT packages**: Refresh, empty state, rows expand/collapse (chevron rotates) and lazy-load sessions (loading / empty / list with completed / cancelled / scheduled styling).

## Found during Step 0, out of scope (noted, not acted on)
- **Dead components**: `AreasCovered`, `HowItWorks`, `PricingPreview`, `Testimonials`, `icons/Check`, `icons/Star` are imported nowhere a route renders. They were not tokenised because no sweep can see them.
- `/reviews` isn't linked from the header or footer. The nav's "Reviews" goes to `/#reviews`.
- There's no custom 404 page; the Next default renders inside the site layout.
- `/book/confirmation` `SERVICE_LABELS` has no entries for `edt-split` or the three `car-hire-*` slugs, so those show the raw slug.
- Admin, contact, confirmation and EDT-token screens use Tailwind's stock palette (slate / red-600 / `#d90429`), while the marketing pages use the `--ink` / `--red` (`#C8102E`) system. There are two brand reds in production today.
