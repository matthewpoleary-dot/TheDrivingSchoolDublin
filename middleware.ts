// middleware.ts — server-side protection for /admin routes
import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

const COOKIE_NAME = "admin_token";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only gate /admin UI — API routes check Bearer token themselves
  if (!pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  const adminToken = process.env.ADMIN_TOKEN ?? "";
  const cookieToken = request.cookies.get(COOKIE_NAME)?.value ?? "";

  if (!adminToken || !cookieToken) {
    return NextResponse.next(); // Let the page handle the token prompt
  }

  try {
    const a = Buffer.from(cookieToken);
    const b = Buffer.from(adminToken);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      const res = NextResponse.next();
      res.cookies.delete(COOKIE_NAME); // Clear invalid cookie
      return res;
    }
  } catch {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
