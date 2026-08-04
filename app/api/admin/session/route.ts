import { NextResponse } from "next/server";
import { z } from "zod";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  checkLoginAllowed,
  clearLoginAttempts,
  clientIp,
  createSessionToken,
  isAdminConfigured,
  recordFailedLogin,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loginSchema = z.object({ password: z.string().min(1).max(200) });

/** Log in. Exchanges the password for a signed, httpOnly session cookie. */
export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin access is not configured. See docs/SETUP.md." },
      { status: 503 }
    );
  }

  const ip = clientIp(request);
  const gate = checkLoginAllowed(ip);

  if (!gate.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil((gate.retryAfterSeconds ?? 0) / 60)} minutes.` },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds ?? 900) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success || !verifyPassword(parsed.data.password)) {
    recordFailedLogin(ip);
    // Deliberately vague: never reveal whether the password was close.
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  clearLoginAttempts(ip);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    SESSION_COOKIE,
    createSessionToken(),
    sessionCookieOptions(SESSION_MAX_AGE_SECONDS)
  );
  return response;
}

/** Log out. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return response;
}
