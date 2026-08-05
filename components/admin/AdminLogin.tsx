"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Plate } from "@/components/brand";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Incorrect password");
        setPassword("");
        return;
      }

      // The session lives in an httpOnly cookie, so the server decides what we
      // see next. A refresh is all the client needs to do.
      router.refresh();
    } catch {
      setError("Could not reach the server");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container size="narrow" className="py-20">
      <div className="mx-auto max-w-sm">
        <Plate letter="A" size="lg" tone="ink" />
        <h1 className="mt-6 text-2xl font-extrabold tracking-[-0.025em]">Instructor login</h1>
        <p className="mt-2 text-[0.9375rem] text-ink-soft">
          Your bookings, calendar and working hours.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={error ? "true" : undefined}
              aria-describedby={error ? "password-error" : undefined}
              className="field"
            />
            {error && (
              <p id="password-error" role="alert" className="field-error">
                <span aria-hidden="true">!</span> {error}
              </p>
            )}
          </div>

          <button type="submit" disabled={busy} className="btn btn-primary w-full">
            {busy ? "Checking..." : "Log in"}
          </button>
        </form>
      </div>
    </Container>
  );
}
