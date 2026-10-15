-- 007_stripe_events.sql
-- Idempotency table for Stripe webhook events.
-- Storing processed event IDs prevents duplicate handling when Stripe replays webhooks.
CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
