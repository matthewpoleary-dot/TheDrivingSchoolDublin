import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { sendEnquiryEmail } from "@/lib/email";
import { clientIp } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Contact enquiries.
 *
 * Stored first, emailed second. An enquiry that reaches the database is never
 * lost, even if Resend is down, so nothing depends on an email being
 * delivered for the instructor to eventually see it.
 */

const schema = z.object({
  name: z.string().trim().min(2, "Please give your name").max(120),
  email: z.string().trim().toLowerCase().email("That email does not look right").max(200),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Tell us a little more").max(4000),
  company: z.string().max(0).optional().or(z.literal("")), // honeypot
});

const recent = new Map<string, number[]>();

function throttled(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 60_000);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > 5;
}

export async function POST(request: Request) {
  const ip = clientIp(request);

  if (throttled(ip)) {
    return NextResponse.json(
      { error: "Too many messages. Please wait a minute." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please check the form",
        fields: Object.fromEntries(
          parsed.error.issues.map((i) => [i.path.join("."), i.message])
        ),
      },
      { status: 400 }
    );
  }

  const enquiry = parsed.data;

  // Accept the honeypot silently so a bot cannot tell it was caught.
  if (enquiry.company) {
    return NextResponse.json({ ok: true });
  }

  let stored = false;
  if (isSupabaseConfigured()) {
    const { error } = await supabaseAdmin().from("enquiries").insert({
      name: enquiry.name,
      email: enquiry.email,
      phone: enquiry.phone || null,
      subject: enquiry.subject || null,
      message: enquiry.message,
    });

    if (error) {
      console.error("[contact] could not store enquiry:", error.message);
    } else {
      stored = true;
    }
  }

  const emailResult = await sendEnquiryEmail({
    name: enquiry.name,
    email: enquiry.email,
    phone: enquiry.phone,
    subject: enquiry.subject,
    message: enquiry.message,
  });

  // Only a total failure of both paths is worth telling the visitor about.
  if (!stored && !emailResult.ok) {
    return NextResponse.json(
      { error: "We could not send that. Please ring or WhatsApp us instead." },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true });
}
