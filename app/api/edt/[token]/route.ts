// app/api/edt/[token]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// GET /api/edt/[token] — public, token acts as auth
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const { data: pkg, error } = await supabaseServer
      .from("edt_packages")
      .select("id, customer_name, customer_email, lessons_total, lessons_used, expires_at, created_at")
      .eq("access_token", token)
      .single();

    if (error || !pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const expired = pkg.expires_at < today;
    const remaining = Math.max(0, pkg.lessons_total - pkg.lessons_used);

    // Count active (scheduled) sessions
    const { count: activeCount } = await supabaseServer
      .from("edt_sessions")
      .select("id", { count: "exact", head: true })
      .eq("package_id", pkg.id)
      .eq("status", "scheduled");

    return NextResponse.json({
      ...pkg,
      remaining,
      expired,
      active_sessions: activeCount ?? 0,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}
