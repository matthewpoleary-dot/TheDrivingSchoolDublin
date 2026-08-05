import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Guards the seam between the TypeScript and the SQL.
 *
 * This file exists because of a real defect caught in review: `lib/availability.ts`
 * queried a `slot_holds` table that no migration ever created. The design had
 * moved to a single-table model where holds are bookings with status 'held',
 * and the query was never updated. Every availability request would have
 * returned 503 and every booking attempt 500, in production, on day one.
 *
 * The unit tests could not see it because none of them cross the database
 * boundary, and a bug like that is invisible until something real runs. These
 * checks are static, need no database, and would have failed immediately.
 */

const ROOT = join(__dirname, "..");
const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");

function migrationSql(): string {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(join(MIGRATIONS_DIR, f), "utf8"))
    .join("\n");
}

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const SQL = migrationSql();
const SOURCES = [...sourceFiles(join(ROOT, "lib")), ...sourceFiles(join(ROOT, "app"))];

function createdTables(): Set<string> {
  const names = new Set<string>();
  const re = /create table if not exists public\.(\w+)|create table public\.(\w+)/gi;
  for (const match of SQL.matchAll(re)) {
    names.add((match[1] ?? match[2]).toLowerCase());
  }
  return names;
}

function createdFunctions(): Set<string> {
  const names = new Set<string>();
  const re = /create or replace function public\.(\w+)|create function public\.(\w+)/gi;
  for (const match of SQL.matchAll(re)) {
    names.add((match[1] ?? match[2]).toLowerCase());
  }
  return names;
}

describe("every table the application queries actually exists", () => {
  const tables = createdTables();

  it("found the expected tables in the migrations", () => {
    expect(tables).toContain("bookings");
    expect(tables).toContain("services");
    expect(tables).toContain("weekly_template");
    expect(tables).toContain("date_overrides");
  });

  it("has no .from(...) call against an undefined table", () => {
    const offenders: string[] = [];

    for (const file of SOURCES) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(/\.from\(\s*["'`](\w+)["'`]\s*\)/g)) {
        const table = match[1].toLowerCase();
        if (!tables.has(table)) {
          offenders.push(`${file.replace(ROOT, "").replace(/\\/g, "/")}: .from("${table}")`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("has no .rpc(...) call against an undefined function", () => {
    const functions = createdFunctions();
    const offenders: string[] = [];

    for (const file of SOURCES) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(/\.rpc\(\s*["'`](\w+)["'`]/g)) {
        const fn = match[1].toLowerCase();
        if (!functions.has(fn)) {
          offenders.push(`${file.replace(ROOT, "").replace(/\\/g, "/")}: .rpc("${fn}")`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});

describe("availability agrees with the exclusion constraint", () => {
  /**
   * The constraint blocks these statuses. If availability filters on a
   * narrower set, the site offers slots the database will then refuse, and the
   * customer hits a 409 at the last step of the form. That is exactly what
   * happened when 'held' was missing from the filter.
   */
  const BLOCKING_STATUSES = ["held", "pending", "confirmed"];

  it("the constraint covers held, pending and confirmed", () => {
    const constraint = /exclude using gist \(blocked_during with &&\)\s*where \(status in \(([^)]+)\)\)/i.exec(
      SQL
    );
    expect(constraint).not.toBeNull();

    const listed = constraint![1]
      .split(",")
      .map((s) => s.trim().replace(/'/g, "").toLowerCase());

    expect(listed.sort()).toEqual([...BLOCKING_STATUSES].sort());
  });

  it("the availability query filters on exactly those statuses", () => {
    const source = readFileSync(join(ROOT, "lib", "availability.ts"), "utf8");
    const filter = /\.in\("status",\s*\[([^\]]+)\]\)/.exec(source);
    expect(filter).not.toBeNull();

    const listed = filter![1]
      .split(",")
      .map((s) => s.trim().replace(/["']/g, "").toLowerCase())
      .filter(Boolean);

    expect(listed.sort()).toEqual([...BLOCKING_STATUSES].sort());
  });

  it("the hold sweeper reclaims both held and pending rows", () => {
    // A 'pending' row is a customer sitting in Stripe Checkout. If the sweep
    // only covers 'held', an abandoned checkout blocks the slot for ever.
    expect(SQL).toMatch(/where status in \('held', 'pending'\)\s*\n\s*and expires_at is not null/i);
  });

  it("stores one travel buffer after the lesson, not a buffer on both ends", () => {
    expect(SQL).not.toMatch(
      /p_starts_at\s*-\s*make_interval\(mins\s*=>\s*v_service\.buffer_minutes\)/i
    );
    expect(SQL).toMatch(
      /v_ends_at\s*\+\s*make_interval\(mins\s*=>\s*v_service\.buffer_minutes\)/i
    );
  });
});

describe("security invariants in the SQL", () => {
  it("enables row-level security on every table it creates", () => {
    // Every table the migrations create must have RLS turned on. A new table
    // added without it fails here rather than quietly exposing customer data.
    for (const table of createdTables()) {
      const pattern = new RegExp(`alter table\\s+public\\.${table}\\s+enable row level security`, "i");
      expect(SQL, `${table} should have RLS enabled`).toMatch(pattern);
    }
  });

  it("creates no policy granting anon access", () => {
    // RLS with zero policies denies anon outright. A policy appearing here is
    // a deliberate decision that needs reviewing, not a routine change.
    expect(SQL.toLowerCase()).not.toMatch(/create policy/);
  });

  it("revokes execute on every security definer function from anon", () => {
    // Split per definition so the scan cannot run past the end of one
    // function into the next and mis-attribute `security definer`.
    const blocks = SQL.split(/create or replace function public\./i).slice(1);

    for (const block of blocks) {
      const name = /^(\w+)/.exec(block)?.[1]?.toLowerCase();
      if (!name) continue;

      // Only look at the header, before the body opens.
      const header = block.split(/\bas\s*\$\$/i)[0];
      if (!/security definer/i.test(header)) continue;

      const revoked = new RegExp(`revoke all on function public\\.${name}\\(`, "i").test(SQL);
      expect(revoked, `${name} is SECURITY DEFINER and must have execute revoked`).toBe(true);
    }
  });

  it("sets an explicit search_path on every security definer function", () => {
    const blocks = SQL.split(/create or replace function public\./i).slice(1);

    for (const block of blocks) {
      const name = /^(\w+)/.exec(block)?.[1]?.toLowerCase();
      if (!name) continue;

      const header = block.split(/\bas\s*\$\$/i)[0];
      if (!/security definer/i.test(header)) continue;

      // Without this, a caller-controlled search_path can shadow the objects
      // the function resolves, which is the classic definer-rights escalation.
      const hasSearchPath =
        /set\s+search_path\s*=/i.test(header) ||
        new RegExp(`alter function public\\.${name}\\([^)]*\\)\\s*set search_path`, "i").test(SQL);

      expect(hasSearchPath, `${name} is SECURITY DEFINER and must set search_path`).toBe(true);
    }
  });
});
