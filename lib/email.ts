// lib/email.ts
import { Resend } from "resend";

export type BookingEmailPayload = {
  bookingId: string;
  serviceName: string;
  durationMinutes: number;
  priceCents: number;
  startsAtISO: string; // UTC ISO
  endsAtISO: string;   // UTC ISO
  client: { name: string; email: string; phone?: string | null };
};

// --- helpers ---
const euros = (cents: number) => `€${(Number(cents) / 100).toFixed(2)}`;

function makeICS(p: BookingEmailPayload) {
  const start = new Date(p.startsAtISO);
  const end = new Date(p.endsAtISO);
  const pad = (n: number) => String(n).padStart(2, "0");
  const toICS = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
      d.getUTCHours()
    )}${pad(d.getUTCMinutes())}00Z`;

  const uid = `booking-${p.bookingId}@thedrivingschooldublin`;
  const summary = `Lesson: ${p.serviceName}`;
  const description = `Client: ${p.client.name} (${p.client.email}${
    p.client.phone ? ", " + p.client.phone : ""
  })
Service: ${p.serviceName}
Duration: ${p.durationMinutes} minutes
Price: ${euros(p.priceCents)}
Booking ID: ${p.bookingId}`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TheDrivingSchoolDublin//Booking//EN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toICS(new Date())}`,
    `DTSTART:${toICS(start)}`,
    `DTEND:${toICS(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

let resend: Resend | null = null;
function ensureResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resend) resend = new Resend(key);
  return resend;
}

// --- main function ---
export async function emailOnBooking(p: BookingEmailPayload) {
  const fromEmail = process.env.FROM_EMAIL;
  const adiEmail = process.env.ADI_EMAIL;
  const r = ensureResend();

  if (!r || !fromEmail || !adiEmail) {
    console.warn("emailOnBooking: skipping (missing RESEND_API_KEY / FROM_EMAIL / ADI_EMAIL)");
    return;
  }

  // ADI notification
  await r.emails.send({
    from: fromEmail,
    to: adiEmail,
    subject: `New booking: ${p.serviceName} — ${new Date(p.startsAtISO).toLocaleString()}`,
    text: [
      `New booking received`,
      ``,
      `Service: ${p.serviceName}`,
      `Duration: ${p.durationMinutes} minutes`,
      `Price: ${euros(p.priceCents)}`,
      `Starts: ${new Date(p.startsAtISO).toLocaleString()}`,
      `Ends:   ${new Date(p.endsAtISO).toLocaleString()}`,
      ``,
      `Client: ${p.client.name}`,
      `Email:  ${p.client.email}`,
      `Phone:  ${p.client.phone || "-"}`,
      ``,
      `Booking ID: ${p.bookingId}`,
    ].join("\n"),
    attachments: [{ filename: "lesson.ics", content: makeICS(p) }],
  });

  // Client confirmation
  await r.emails.send({
    from: fromEmail,
    to: p.client.email,
    subject: `Your lesson is booked — ${p.serviceName}`,
    text: [
      `Thanks ${p.client.name}, your lesson is confirmed.`,
      ``,
      `Service: ${p.serviceName}`,
      `When:   ${new Date(p.startsAtISO).toLocaleString()}`,
      `Duration: ${p.durationMinutes} minutes`,
      `Price: ${euros(p.priceCents)}`,
      ``,
      `If you need to change your booking, reply to this email.`,
      ``,
      `Booking ID: ${p.bookingId}`,
    ].join("\n"),
    attachments: [{ filename: "lesson.ics", content: makeICS(p) }],
  });
}

// also export default to avoid import mismatches
export default emailOnBooking;
