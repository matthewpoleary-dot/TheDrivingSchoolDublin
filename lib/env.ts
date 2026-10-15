// lib/env.ts — validated environment variables, lazily evaluated.
// Import getEnv() instead of accessing process.env directly in server-side code.
import { z } from "zod";

const ServerEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  FROM_EMAIL: z.string().email("FROM_EMAIL must be a valid email"),
  ADI_EMAIL: z.string().email("ADI_EMAIL must be a valid email"),
  ADMIN_TOKEN: z.string().min(16, "ADMIN_TOKEN must be at least 16 characters"),
  // Optional
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().optional(),
  GOOGLE_PRIVATE_KEY: z.string().optional(),
  GOOGLE_CALENDAR_ID: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  TIMEZONE: z.string().optional(),
  NODE_ENV: z.string().optional(),
});

type ServerEnv = z.infer<typeof ServerEnvSchema>;

let _env: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (_env) return _env;
  const result = ServerEnvSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Missing or invalid environment variables:\n${missing}`);
  }
  // Handle GOOGLE_PRIVATE_KEY newline escaping (common in Vercel env var format)
  if (result.data.GOOGLE_PRIVATE_KEY) {
    result.data.GOOGLE_PRIVATE_KEY = result.data.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
  }
  _env = result.data;
  return _env;
}
