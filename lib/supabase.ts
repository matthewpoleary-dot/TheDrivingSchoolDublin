/**
 * Supabase clients.
 *
 * Two deliberate differences from the previous version:
 *
 *  1. Clients are built lazily. Importing this module no longer throws, so a
 *     missing key breaks the one request that needed it rather than taking
 *     down every page and every test that happens to sit downstream.
 *
 *  2. Server code uses the service-role key, not the anon key. All the write
 *     paths (bookings, holds, availability) are server-only and go through
 *     `supabaseAdmin()`. Row-level security then denies the anon key outright,
 *     which is what stops anyone with the public key reading customer records
 *     out of the bookings table.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Set it in .env.local for development, or in the Vercel project settings for deployed environments. See docs/SETUP.md.`
    );
  }
  return value;
}

/**
 * Full-access client. Server-side only, and it enforces that: importing this
 * into a client component and calling it will throw rather than quietly
 * shipping the service-role key to the browser.
 */
export function supabaseAdmin(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("supabaseAdmin() must never be called in the browser.");
  }
  if (!adminClient) {
    adminClient = createClient(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return adminClient;
}

/** True when the database is configured. Lets pages degrade instead of crash. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
