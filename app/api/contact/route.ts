// app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod/v4";

const resend = new Resend(process.env.RESEND_API_KEY!);
const fromEmail = process.env.FROM_EMAIL!;
const toEmail = process.env.ADI_EMAIL!;

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
  company: z.string().optional(), // honeypot
});

// Simple in-memory rate limiting (per IP, 5 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT) {
    return true;
  }

  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Validate with Zod
    const result = contactSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message || "Invalid form data";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, phone, subject, message, company } = result.data;

    // Honeypot check - if filled, silently succeed (don't alert spammer)
    if (company && company.trim().length > 0) {
      return NextResponse.json({ success: true });
    }

    // Build email content
    const timestamp = new Date().toLocaleString("en-IE", {
      timeZone: "Europe/Dublin",
      dateStyle: "full",
      timeStyle: "short",
    });

    const emailSubject = subject?.trim()
      ? `Contact Form: ${subject}`
      : "New contact form submission";

    const emailBody = [
      `New message from ${name}`,
      ``,
      `From: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : null,
      subject ? `Subject: ${subject}` : null,
      ``,
      `Message:`,
      message,
      ``,
      `---`,
      `Submitted: ${timestamp}`,
    ]
      .filter(Boolean)
      .join("\n");

    // Send email via Resend
    await resend.emails.send({
      from: `The Driving School Dublin <${fromEmail}>`,
      to: toEmail,
      replyTo: email,
      subject: emailSubject,
      text: emailBody,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
