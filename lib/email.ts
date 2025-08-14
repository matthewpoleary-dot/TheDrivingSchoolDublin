// lib/email.ts
import { Resend } from "resend";

const resendKey = process.env.RESEND_API_KEY!;
const fromEmail = process.env.FROM_EMAIL!;
const adiEmail = process.env.ADI_EMAIL!;
const tz = process.env.TIMEZONE || "Europe/Dublin";

const resend = new Resend(resendKey);

export type BookingEmailPayload = {
  bookingId: string;
  serviceName: string;
  durationMinutes: number;
  priceCents: number;
  startsAtISO: string; // UTC ISO string
  endsAtISO: string;   // UTC ISO string
  client: { name: string; email: string; phone?: string | null };
};

function euro(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}
function fmt(dtISO: string) {
  return new Date(dtISO).toLocaleString("en-IE", { timeZone: tz, hour12: false });
}

// Simple ICS generator (calendar invite)
function makeICS(p: BookingEmailPayload) {
  const start = new Date(p.startsAtISO);
  const end = new Date(p.endsAtISO);
  const pad = (n: number) => String(n).padStart(2, "0");
  const toICS = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

  const uid = `booking-${p.bookingId}@thedrivingschooldublin`;
  const summary = `Lesson: ${p.serviceName}`;
  const description = `Client: ${p.client.name} (${p.client.email}${p.client.phone ? ", " + p.client.phone : ""})
Service: ${p.serviceName}
Duration: ${p.durationMinutes} minutes
Price: ${euro(p.priceCents)}
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

export async function emailOnBooking(p: BookingEmailPayload) {
  // Email to ADI
  await resend.emails.send({
    from: fromEmail,
    to: adiEmail,
    subject: `New booking: ${p.serviceName} — ${fmt(p.startsAtISO)}`,
    text: [
      `New booking received`,
      ``,
      `Service: ${p.serviceName}`,
      `Duration: ${p.durationMinutes} minutes`,
      `Price: ${euro(p.priceCents)}`,
      `Starts: ${fmt(p.startsAtISO)}`,
      `Ends:   ${fmt(p.endsAtISO)}`,
      ``,
      `Client: ${p.client.name}`,
      `Email:  ${p.client.email}`,
      `Phone:  ${p.client.phone || "-"}`,
      ``,
      `Booking ID: ${p.bookingId}`,
    ].join("\n"),
    attachments: [{ filename: "lesson.ics", content: makeICS(p) }],
  });

  // Confirmation to client
  await resend.emails.send({
    from: fromEmail,
    to: p.client.email,
    subject: `Your lesson is booked — ${p.serviceName}`,
    text: [
      `Thanks ${p.client.name}, your lesson is confirmed.`,
      ``,
      `Service: ${p.serviceName}`,
      `When:   ${fmt(p.startsAtISO)}`,
      `Duration: ${p.durationMinutes} minutes`,
      `Price: ${euro(p.priceCents)}`,
      ``,
      `If you need to change your booking, reply to this email.`,
      ``,
      `Booking ID: ${p.bookingId}`,
    ].join("\n"),
    attachments: [{ filename: "lesson.ics", content: makeICS(p) }],
  });
}

// ---- New: status-change emails ----

export async function emailOnCancel(p: BookingEmailPayload) {
  // Notify ADI
  await resend.emails.send({
    from: fromEmail,
    to: adiEmail,
    subject: `Booking cancelled — ${p.serviceName} (${fmt(p.startsAtISO)})`,
    text: [
      `A booking was cancelled.`,
      ``,
      `Service: ${p.serviceName}`,
      `When:    ${fmt(p.startsAtISO)} - ${fmt(p.endsAtISO)}`,
      `Client:  ${p.client.name} (${p.client.email}${p.client.phone ? ", " + p.client.phone : ""})`,
      `Price:   ${euro(p.priceCents)}`,
      ``,
      `Booking ID: ${p.bookingId}`,
    ].join("\n"),
  });

  // Inform client
  await resend.emails.send({
    from: fromEmail,
    to: p.client.email,
    subject: `Your lesson has been cancelled — ${p.serviceName}`,
    text: [
      `Hi ${p.client.name},`,
      ``,
      `Your lesson scheduled for ${fmt(p.startsAtISO)} has been cancelled.`,
      ``,
      `Service: ${p.serviceName}`,
      `Duration: ${p.durationMinutes} minutes`,
      `Price: ${euro(p.priceCents)}`,
      ``,
      `If this is unexpected, reply to this email and we’ll help reschedule.`,
      ``,
      `Booking ID: ${p.bookingId}`,
    ].join("\n"),
  });
}

export async function emailOnCompleted(p: BookingEmailPayload) {
  // Notify ADI (optional)
  await resend.emails.send({
    from: fromEmail,
    to: adiEmail,
    subject: `Lesson marked completed — ${p.serviceName} (${fmt(p.startsAtISO)})`,
    text: [
      `A lesson was marked completed.`,
      ``,
      `Service: ${p.serviceName}`,
      `When:    ${fmt(p.startsAtISO)} - ${fmt(p.endsAtISO)}`,
      `Client:  ${p.client.name} (${p.client.email}${p.client.phone ? ", " + p.client.phone : ""})`,
      `Price:   ${euro(p.priceCents)}`,
      ``,
      `Booking ID: ${p.bookingId}`,
    ].join("\n"),
  });

  // Congratulate client (and invite to next step)
  await resend.emails.send({
    from: fromEmail,
    to: p.client.email,
    subject: `Thanks — your lesson is complete`,
    text: [
      `Nice work ${p.client.name}!`,
      ``,
      `Your lesson (${p.serviceName}) on ${fmt(p.startsAtISO)} is now marked complete.`,
      ``,
      `If you’d like to book your next session, just reply to this email or use the booking link.`,
      ``,
      `Booking ID: ${p.bookingId}`,
    ].join("\n"),
  });
}
