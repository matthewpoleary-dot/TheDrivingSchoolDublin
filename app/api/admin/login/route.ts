// app/api/admin/login/route.ts
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

export async function POST(req: Request) {
  try {
    const { token } = (await req.json()) as { token?: string };
    const adminToken = process.env.ADMIN_TOKEN ?? "";

    if (!token || !adminToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const a = Buffer.from(token);
    const b = Buffer.from(adminToken);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });
    return response;
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}
