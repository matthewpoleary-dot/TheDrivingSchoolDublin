// lib/auth.ts
export async function requireAdmin(req: Request) {
    const header = req.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token || token !== process.env.ADMIN_TOKEN) {
      throw new Error("Unauthorized");
    }
  }
  