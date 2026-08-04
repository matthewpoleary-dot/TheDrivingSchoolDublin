import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

const SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef";

beforeEach(() => {
  vi.resetModules();
  process.env.ADMIN_SESSION_SECRET = SECRET;
  process.env.ADMIN_PASSWORD = "a-long-enough-password";
});

afterEach(() => {
  vi.useRealTimers();
});

async function auth() {
  return import("@/lib/auth");
}

describe("session tokens", () => {
  it("accepts a token it just issued", async () => {
    const { createSessionToken, verifySessionToken } = await auth();
    expect(verifySessionToken(createSessionToken())).toBe(true);
  });

  it("rejects a token signed with a different secret", async () => {
    const { createSessionToken } = await auth();
    const token = createSessionToken();

    vi.resetModules();
    process.env.ADMIN_SESSION_SECRET = "ffffffffffffffffffffffffffffffffffffffffffffffff";
    const { verifySessionToken } = await auth();

    expect(verifySessionToken(token)).toBe(false);
  });

  it("rejects a tampered expiry", async () => {
    const { createSessionToken, verifySessionToken } = await auth();
    const token = createSessionToken();
    const [, nonce, signature] = token.split(".");
    const farFuture = Date.now() + 10 * 365 * 24 * 60 * 60 * 1000;
    expect(verifySessionToken(`${farFuture}.${nonce}.${signature}`)).toBe(false);
  });

  it("rejects an expired token", async () => {
    const { createSessionToken, verifySessionToken } = await auth();
    const token = createSessionToken(1);

    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.now() + 2 * 60 * 60 * 1000));

    expect(verifySessionToken(token)).toBe(false);
  });

  it("rejects malformed and empty input without throwing", async () => {
    const { verifySessionToken } = await auth();
    for (const bad of ["", "abc", "a.b", "a.b.c.d", null, undefined]) {
      expect(verifySessionToken(bad as string)).toBe(false);
    }
  });

  it("issues a different token each time", async () => {
    const { createSessionToken } = await auth();
    expect(createSessionToken()).not.toBe(createSessionToken());
  });
});

describe("password verification", () => {
  it("accepts the configured password", async () => {
    const { verifyPassword } = await auth();
    expect(verifyPassword("a-long-enough-password")).toBe(true);
  });

  it("rejects a wrong password, including a prefix of the right one", async () => {
    const { verifyPassword } = await auth();
    expect(verifyPassword("wrong")).toBe(false);
    expect(verifyPassword("a-long-enough-passwor")).toBe(false);
    expect(verifyPassword("")).toBe(false);
  });

  it("rejects everything when no password is configured", async () => {
    vi.resetModules();
    delete process.env.ADMIN_PASSWORD;
    const { verifyPassword } = await auth();
    expect(verifyPassword("anything")).toBe(false);
  });
});

describe("login rate limiting", () => {
  it("locks an IP out after repeated failures", async () => {
    const { checkLoginAllowed, recordFailedLogin } = await auth();
    const ip = "203.0.113.10";

    expect(checkLoginAllowed(ip).allowed).toBe(true);
    for (let i = 0; i < 5; i++) recordFailedLogin(ip);

    const result = checkLoginAllowed(ip);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keeps IPs independent", async () => {
    const { checkLoginAllowed, recordFailedLogin } = await auth();
    for (let i = 0; i < 5; i++) recordFailedLogin("198.51.100.1");
    expect(checkLoginAllowed("198.51.100.2").allowed).toBe(true);
  });

  it("clears attempts after a success", async () => {
    const { checkLoginAllowed, recordFailedLogin, clearLoginAttempts } = await auth();
    const ip = "203.0.113.99";
    for (let i = 0; i < 5; i++) recordFailedLogin(ip);
    clearLoginAttempts(ip);
    expect(checkLoginAllowed(ip).allowed).toBe(true);
  });
});

describe("cron authentication", () => {
  it("accepts the configured secret and rejects anything else", async () => {
    process.env.CRON_SECRET = "cron-secret-value";
    const { verifyCronRequest } = await auth();

    const withHeader = (value: string) =>
      new Request("https://example.com/api/cron", { headers: { authorization: value } });

    expect(verifyCronRequest(withHeader("Bearer cron-secret-value"))).toBe(true);
    expect(verifyCronRequest(withHeader("Bearer nope"))).toBe(false);
    expect(verifyCronRequest(new Request("https://example.com/api/cron"))).toBe(false);
  });
});
