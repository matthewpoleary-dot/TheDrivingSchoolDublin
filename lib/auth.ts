/**
 * Admin authentication.
 *
 * What this replaces: a plain-text token compared with `!==`, typed into a box
 * on every visit, sent as a bearer header on every request, and kept in React
 * state. That leaked the token to anything that could read the page, compared
 * it in variable time, and had no expiry.
 *
 * What this does instead: a password is exchanged once for a signed session
 * held in an httpOnly, secure, sameSite cookie, so JavaScript can never read
 * it. Sessions expire. Comparisons are constant-time. Failed logins are rate
 * limited per IP.
 */

import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "tds_admin";
const SESSION_TTL_HOURS = 12;

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET must be set to at least 32 random characters. Generate one with: openssl rand -hex 32"
    );
  }
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Constant-time string compare that will not throw on length mismatch. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still burn a comparison so the timing does not reveal the length.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

/** Check a submitted password against the configured one, in constant time. */
export function verifyPassword(submitted: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  if (expected.length < 12) {
    console.warn("[auth] ADMIN_PASSWORD is shorter than 12 characters.");
  }
  return safeEqual(submitted, expected);
}

// ---------------------------------------------------------------------------
// Session tokens: "<expiryMs>.<nonce>.<signature>"
// ---------------------------------------------------------------------------

export function createSessionToken(ttlHours = SESSION_TTL_HOURS): string {
  const expiresAt = Date.now() + ttlHours * 60 * 60 * 1000;
  const nonce = randomBytes(12).toString("base64url");
  const payload = `${expiresAt}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [expiresAtRaw, nonce, signature] = parts;
  const payload = `${expiresAtRaw}.${nonce}`;

  if (!safeEqual(signature, sign(payload))) return false;

  const expiresAt = Number(expiresAtRaw);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export async function isAdminRequest(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_HOURS * 60 * 60;

// ---------------------------------------------------------------------------
// Login rate limiting
// ---------------------------------------------------------------------------
//
// In-memory, which is honest about its limits: on serverless each instance has
// its own counter, so this slows a brute-force attempt rather than stopping it
// outright. The real protection is a long random password. For a single-
// instructor site that is the right trade; move to Upstash if this ever needs
// to be airtight.

type Attempt = { count: number; firstAt: number; lockedUntil?: number };
const attempts = new Map<string, Attempt>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

export function checkLoginAllowed(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry) return { allowed: true };

  if (entry.lockedUntil && entry.lockedUntil > now) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000) };
  }

  if (now - entry.firstAt > WINDOW_MS) {
    attempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAt: now });
    return;
  }

  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
  }
}

export function clearLoginAttempts(ip: string): void {
  attempts.delete(ip);
}

/** Best-effort client IP behind Vercel's proxy. */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Shared secret for cron endpoints, so only Vercel Cron can trigger them.
 * Vercel sends `Authorization: Bearer $CRON_SECRET`.
 */
export function verifyCronRequest(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return safeEqual(token, expected);
}
