// lib/supabase-server.ts
// Server-side Supabase client using the service role key.
// This bypasses RLS — only import in API routes, never in client components.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Supabase server env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
}

export const supabaseServer = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

// ─── Shared types ────────────────────────────────────────────────────────────

export type AvailabilitySlot = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  lesson_types: string[];
  is_booked: boolean;
  booking_id: string | null;
  created_at: string;
};

export type Booking = {
  id: string;
  slot_id: string | null;
  service_type: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  payment_status: "pending" | "paid" | "refunded" | "cancelled" | "failed";
  amount_pence: number;
  edt_package_id: string | null;
  notes: string | null;
  created_at: string;
};

export type EdtPackage = {
  id: string;
  booking_id: string;
  customer_email: string;
  customer_name: string;
  lessons_total: number;
  lessons_used: number;
  access_token: string;
  expires_at: string;
  created_at: string;
};

export type EdtSession = {
  id: string;
  package_id: string;
  slot_id: string;
  session_number: number;
  status: "scheduled" | "completed" | "cancelled";
  created_at: string;
};
