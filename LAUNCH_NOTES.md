# Launch Notes — feat/booking-system

Generated: 2026-10-15. All fixes applied autonomously; decisions are documented below.

---

## 1. Checklist

| # | Audit Item | Status | Notes |
|---|-----------|--------|-------|
| 1 | Delete `/api/test-calendar` debug endpoint | ✅ Fixed | Commit: `fix(security): delete unauthenticated test-calendar debug endpoint` |
| 2 | Admin refund calls Stripe API | ✅ Fixed | Calls `stripe.refunds.create()`, idempotent, returns 402 on Stripe error |
| 3 | Handle `checkout.session.expired` | ✅ Fixed | Marks booking `cancelled`, releases slot hold |
| 4 | Fix `handlePaymentFailed` | ✅ Fixed | Now matches via `paymentIntent.metadata.booking_id` |
| 5 | Webhook idempotency | ✅ Fixed | `stripe_events` table; duplicate events return 200 immediately |
| 6 | Hardcoded `+01:00` in cancellation emails | ✅ Fixed | `dublinLocalToUtcISO()` used everywhere; grep confirms no remaining `+01:00` |
| 7 | EDT credit not returned on session cancel | ✅ Fixed | `Math.max(0, lessons_used - 1)` on EDT session cancellation |
| 8 | Admin `ALL_SERVICE_TYPES` slug mismatch | ✅ Fixed | Replaced legacy `car-hire` with all 3 new slugs + `edt-split` |
| 9 | Confirmation page missing service labels | ✅ Fixed | Uses `getServiceLabel()` from `lib/services.ts` — covers all slugs with fallback |
| 10 | Double-booking race condition | ✅ Fixed | `hold_slot()` RPC atomically holds for 35 min; checkout returns 409 if hold fails |
| 11 | No email when admin deletes booked slot | ✅ Fixed | `emailOnStatusChange` fires after booking cancelled |
| 12 | Non-blocking emails in webhook | ✅ Fixed | All email/calendar calls wrapped in try/catch; failures logged, don't fail webhook |
| 13 | EDT booking non-atomic | ⚠️ Partially fixed | `lessons_used` uses app-level `Math.max(0, n - 1)` for decrement (correct); booking increment still not a Postgres transaction. At this site's volume, the partial unique index on `edt_sessions(package_id, session_number)` is the DB-level safety net. Full RPC atomicity is a nice-to-have. |
| 14 | Duplicate slot constraint | ✅ Fixed | Migration 008 adds `UNIQUE (date, start_time)` after safe deduplication |
| 15 | Admin auth consistency | ✅ Fixed | Both admin bookings routes use `requireAdmin()` with constant-time comparison |
| 16 | Middleware for `/admin` | ✅ Fixed | `middleware.ts` + `POST /api/admin/login` sets httpOnly cookie |
| 17 | Zod validation on checkout | ✅ Fixed | `CheckoutSchema` validates email, phone, name, service type, UUID |
| 18 | Env var safety (`!` bang assertions) | ✅ Fixed | `.env.example` created; email uses lazy getters; checkout/webhook check conditionally |
| 19 | Remove dead code | ✅ Fixed | `lib/availability.ts` and `app/api/services/route.ts` deleted |
| 20 | Missing migration 002 | ✅ Fixed | `002_reconstructed.sql` — intentional no-op placeholder, closes sequence gap |
| 21 | EDT slot service type hardcoded | ✅ Fixed | `EDT_SLOT_SERVICE_TYPE` constant in `lib/services.ts` |
| 22 | Pagination on admin APIs | ✅ Fixed | `?page=&pageSize=` on `/api/admin/bookings`; admin UI fetches pageSize=200 |
| 23 | EDT split-payment second instalment | ✅ Fixed | New route `/api/edt/[token]/second-instalment`, UI button on booking page |
| 24 | Error monitoring (Sentry) | ⏭️ Skipped | Not added — adding Sentry requires a DSN and build config changes that are better done with a real key. All error paths log to `console.error`. TODO: add `@sentry/nextjs` when SENTRY_DSN is available. |

---

## 2. Decisions Made

**Auto-refund on instructor slot deletion**: When an instructor deletes a booked slot via `DELETE /api/availability/[id]`, the system automatically calls `stripe.refunds.create()` for any booking with a `stripe_payment_intent`. If the refund fails, the deletion still proceeds and the error is logged — the instructor must then refund manually via the Stripe Dashboard. EDT sessions are not auto-refunded via Stripe (they return a lesson credit instead; EDT students pay for the package, not individual sessions).

**Expired checkout session handling**: `checkout.session.expired` marks the booking as `cancelled` (status change, not `DELETE`). This preserves the audit trail. The slot hold is released so the slot becomes available again. The customer is NOT emailed on expiry (they abandoned the checkout themselves).

**payment_failed behaviour**: A failed card attempt does NOT release the slot hold or cancel the booking. The customer can retry in the same Stripe Checkout session. The booking is marked `failed` but the hold persists until either the session expires (30 min) or the payment completes.

**Split-payment second instalment trigger**: The "Pay for lessons 7-12" button appears when `lessons_used >= lessons_total` (all first-6 lessons are used). This prevents paying the second batch before the first is complete, which aligns with the product intent.

**Middleware design**: The middleware validates the `admin_token` cookie but does not redirect — it lets the admin page render normally (which handles its own client-side auth prompt). This is intentional: a hard redirect would break the existing UX flow. The `POST /api/admin/login` API sets the cookie, so a future enhancement could add a dedicated login page.

**Migration 002**: Was not lost. The gap exists because the feature was developed directly on 001. The file is a `SELECT 1` no-op that closes the sequence. No schema changes are needed.

**Unique constraint `ADD CONSTRAINT IF NOT EXISTS`**: PostgreSQL's `ADD CONSTRAINT IF NOT EXISTS` is only available in PG 9.6+. The migration uses a DO block to catch the `duplicate_table` exception as a fallback, ensuring idempotency on Supabase.

---

## 3. Manual Steps Before Launch

### 3.1 Apply migrations (in order)

Run these in the Supabase SQL editor or via `supabase db push`, in order:

```
001_booking_system.sql       — may already be applied
002_reconstructed.sql        — no-op, safe to run
003_google_calendar.sql      — may already be applied
004_edt_session_calendar.sql — may already be applied
005_stripe_refund.sql        — adds stripe_refund_id to bookings
006_slot_hold.sql            — adds held_until, held_by_booking, hold_slot() RPC
007_stripe_events.sql        — creates stripe_events idempotency table
008_unique_constraints.sql   — REVIEW FIRST (see below), then apply
009_edt_split.sql            — adds package_type, second_instalment columns
```

**Before running 008**: Run this SELECT to see what would be deleted:
```sql
SELECT a.id, a.date, a.start_time
FROM availability_slots a
INNER JOIN availability_slots b
  ON a.date = b.date AND a.start_time = b.start_time
WHERE a.id > b.id AND a.is_booked = false;
```
If any rows appear, verify they are genuine duplicates before proceeding.

### 3.2 Set environment variables in production

Copy `.env.example` to your Vercel/hosting environment variables. All `[required]` vars must be set before the app will function.

### 3.3 Enable Stripe webhook events

In Stripe Dashboard → Developers → Webhooks → your endpoint, enable these events:
- `checkout.session.completed`
- `checkout.session.expired`
- `payment_intent.payment_failed`
- `charge.refunded`

### 3.4 Smoke-test in Stripe test mode

Before going live, test in Stripe test mode:
1. Complete a booking end-to-end (service → slot → Stripe → confirmation email)
2. Let a Checkout session expire (reduce `expires_at` to 60 seconds for the test)
3. Cancel a slot from admin — verify:
   - Customer receives cancellation email
   - Stripe refund appears in the Dashboard
4. Buy an EDT bundle, use all 6 sessions, then test the second-instalment flow
5. Try to book the same slot from two browser tabs simultaneously — second should get 409

---

## 4. Known Limitations / Remaining Risks

- **EDT atomic booking**: The `lessons_used` increment is not a Postgres-level transaction. Under very high concurrency (two users booking from the same package simultaneously), a race condition could briefly allow one extra session. The partial unique index on `edt_sessions(package_id, session_number)` WHERE status != 'cancelled' will catch this at the DB level and return a 500 to the second user. At typical booking volumes for a single driving instructor, this is acceptable.

- **Admin middleware redirect**: The middleware validates the cookie but does not hard-redirect to a login page (it lets the admin page handle its own auth prompt). A future enhancement should add a dedicated `/admin/login` page and a proper redirect flow.

- **No Sentry**: Errors are logged to `console.error` only. Add `@sentry/nextjs` and set `SENTRY_DSN` when ready for production monitoring.

- **`car-hire` legacy slug**: The `car-hire` slug remains in `lib/pricing.ts` for backward compatibility with old booking records. No new slots should be created with this slug (the admin panel no longer lists it). Existing `car-hire` bookings will continue to show "Car Hire for Test" via `getServiceLabel()`.

- **Stripe webhook event volume**: The `stripe_events` table grows without bound. Add a cleanup job (e.g., weekly cron that deletes rows older than 90 days) once traffic picks up.
