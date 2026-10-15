// lib/auth.ts
import { timingSafeEqual } from "crypto";

export async function requireAdmin(req: Request) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const adminToken = process.env.ADMIN_TOKEN ?? "";

  if (!token || !adminToken) throw new Error("Unauthorized");

  // Constant-time comparison to prevent timing attacks
  const a = Buffer.from(token);
  const b = Buffer.from(adminToken);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Unauthorized");
  }
}
