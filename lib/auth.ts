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
/** Hard ceiling so a spoofed-IP flood cannot grow this map without bound. */
const MAX_TRACKED_IPS = 5_000;

/** Drop entries that have aged out, and hard-cap the map size. */
function pruneAttempts(now: number): void {
  for (const [ip, entry] of attempts) {
    const expired = now - entry.firstAt > WINDOW_MS;
    const unlocked = !entry.lockedUntil || entry.lockedUntil < now;
    if (expired && unlocked) attempts.delete(ip);
  }

  // Still too big means someone is minting fresh keys. Evict oldest first.
  if (attempts.size > MAX_TRACKED_IPS) {
    const oldest = [...attempts.entries()]
      .sort((a, b) => a[1].firstAt - b[1].firstAt)
      .slice(0, attempts.size - MAX_TRACKED_IPS);
    for (const [ip] of oldest) attempts.delete(ip);
  }
}

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
  pruneAttempts(now);
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

/**
 * Client IP behind Vercel's proxy.
 *
 * `x-real-ip` is set BY the platform and cannot be forged by the caller.
 * `x-forwarded-for` can: its leftmost element is whatever the client sent, so
 * keying a rate limiter on it lets an attacker mint a fresh bucket per request
 * and bypass the limit entirely, while growing the map without bound. Prefer
 * the trustworthy header and only fall back when it is absent.
 */
export function clientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // Local development and non-Vercel hosts. Take the RIGHTMOST entry, which is
  // the one appended by the nearest trusted proxy rather than the client.
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }

  return "unknown";
}

/**
 * Shared fixed-window throttle for the public routes.
 *
 * In-memory and therefore per-instance, which is honest about what it is: a
 * brake on casual abuse, not a distributed rate limiter. It is bounded, which
 * the previous per-route Maps were not.
 */
const buckets = new Map<string, number[]>();
const MAX_BUCKETS = 10_000;

export function rateLimit(
  key: string,
  options: { limit: number; windowMs?: number }
): boolean {
  const windowMs = options.windowMs ?? 60_000;
  const now = Date.now();

  if (buckets.size > MAX_BUCKETS) {
    for (const [k, hits] of buckets) {
      if (hits.length === 0 || now - hits[hits.length - 1] > windowMs) buckets.delete(k);
    }
    // Still oversized: drop arbitrary entries rather than grow for ever.
    if (buckets.size > MAX_BUCKETS) {
      let toDrop = buckets.size - MAX_BUCKETS;
      for (const k of buckets.keys()) {
        buckets.delete(k);
        if (--toDrop <= 0) break;
      }
    }
  }

  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  hits.push(now);
  buckets.set(key, hits);

  return hits.length > options.limit;
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
