// lib/email.ts
import { Resend } from "resend";
import { formatZoned } from "@/lib/time";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thedrivingschooldublin.com";

const resend = new Resend(process.env.RESEND_API_KEY!);
const fromEmail = process.env.FROM_EMAIL!;   // e.g. onboarding@resend.dev (dev) or bookings@yourdomain.com (prod)
const adiEmail  = process.env.ADI_EMAIL!;    // your inbox

export type BookingEmailPayload = {
  bookingId: string;
  serviceName: string;
  durationMinutes?: number;
  priceCents?: number;
  startsAtISO: string;
  endsAtISO?: string;
  client: { name: string; email: string; phone?: string | null };
};

/** Send confirmation emails when a new booking is created */
export async function emailOnBooking(p: BookingEmailPayload) {
  const when = formatZoned(p.startsAtISO); // ✅ consistent timezone
  const priceLine =
    p.priceCents != null ? `Price: €${(p.priceCents / 100).toFixed(2)}` : "";
  const durationLine =
    p.durationMinutes != null ? `Duration: ${p.durationMinutes} min` : "";

  const details = [
    `Service: ${p.serviceName}`,
    `When:   ${when}`,
    durationLine,
    priceLine,
    ``,
    `Client: ${p.client.name} (${p.client.email}${p.client.phone ? ", " + p.client.phone : ""})`,
    `Booking ID: ${p.bookingId}`,
  ]
    .filter(Boolean)
    .join("\n");

  // To ADI
  await resend.emails.send({
    from: `TheDrivingSchoolDublin <${fromEmail}>`,
    to: adiEmail,
    replyTo: adiEmail,
    subject: `New booking — ${p.serviceName}`,
    text: `New booking received\n\n${details}`,
  });

  // To Client
  await resend.emails.send({
    from: `The Driving School Dublin <${fromEmail}>`,
    to: p.client.email,
    replyTo: adiEmail,
    subject: `Booking confirmed — ${p.serviceName}`,
    text: [
      `Hi ${p.client.name},`,
      ``,
      `Your lesson is confirmed. Here are your details:`,
      ``,
      `  ${p.serviceName}`,
      `  ${when}`,
      durationLine ? `  ${durationLine}` : "",
      priceLine ? `  ${priceLine}` : "",
      ``,
      `Your instructor will meet you at your pickup location at the agreed time.`,
      `Please be ready 5 minutes early.`,
      ``,
      `Need to reschedule or have a question?`,
      `  📞 +353 86 0235 666`,
      `  💬 WhatsApp: https://wa.me/353860235666`,
      `  ✉️  ${adiEmail}`,
      ``,
      `See you on the road!`,
      `The Driving School Dublin`,
    ].filter((l) => l !== undefined).join("\n"),
  });
}

/** Send emails when an EDT bundle/package is purchased */
export async function emailOnEdtPackageCreated(p: {
  packageId: string;
  accessToken: string;
  lessonsTotal: number;
  expiresAt: string;
  customer: { name: string; email: string };
}) {
  const bookingLink = `${BASE_URL}/book/${p.accessToken}`;

  await resend.emails.send({
    from: `TheDrivingSchoolDublin <${fromEmail}>`,
    to: adiEmail,
    replyTo: adiEmail,
    subject: `New EDT package purchase — ${p.customer.name}`,
    text: [
      `New EDT package purchased`,
      ``,
      `Customer: ${p.customer.name} (${p.customer.email})`,
      `Lessons: ${p.lessonsTotal}`,
      `Expires: ${p.expiresAt}`,
      `Package ID: ${p.packageId}`,
    ].join("\n"),
  });

  await resend.emails.send({
    from: `TheDrivingSchoolDublin <${fromEmail}>`,
    to: p.customer.email,
    replyTo: adiEmail,
    subject: `Your ${p.lessonsTotal}-lesson EDT package is ready`,
    text: [
      `Hi ${p.customer.name},`,
      ``,
      `Your ${p.lessonsTotal}-lesson EDT package has been confirmed and paid.`,
      ``,
      `Book your first session using your personal link below:`,
      bookingLink,
      ``,
      `This link is private to you — use it to book each session as you're ready.`,
      `You can book up to 2 sessions in advance. Your package expires on ${p.expiresAt}.`,
      ``,
      `If you have any questions, just reply to this email.`,
    ].join("\n"),
  });
}

/** Send emails when an EDT session is booked via the package link */
export async function emailOnEdtSessionBooked(p: {
  packageId: string;
  sessionNumber: number;
  lessonsTotal: number;
  startsAtISO: string;
  customer: { name: string; email: string };
}) {
  const when = formatZoned(p.startsAtISO);

  await resend.emails.send({
    from: `TheDrivingSchoolDublin <${fromEmail}>`,
    to: adiEmail,
    replyTo: adiEmail,
    subject: `EDT session ${p.sessionNumber}/${p.lessonsTotal} booked — ${p.customer.name}`,
    text: [
      `EDT session booked`,
      ``,
      `Customer: ${p.customer.name} (${p.customer.email})`,
      `Session: ${p.sessionNumber} of ${p.lessonsTotal}`,
      `When: ${when}`,
      `Package ID: ${p.packageId}`,
    ].join("\n"),
  });

  await resend.emails.send({
    from: `TheDrivingSchoolDublin <${fromEmail}>`,
    to: p.customer.email,
    replyTo: adiEmail,
    subject: `EDT session ${p.sessionNumber} confirmed — ${when}`,
    text: [
      `Hi ${p.customer.name},`,
      ``,
      `Your EDT session ${p.sessionNumber} of ${p.lessonsTotal} is confirmed.`,
      ``,
      `When: ${when}`,
      ``,
      `If you need to reschedule, reply to this email as soon as possible.`,
    ].join("\n"),
  });
}

type Status = "cancelled" | "completed";

/** Send emails when a booking is cancelled or completed */
export async function emailOnStatusChange(p: {
  bookingId: string;
  newStatus?: Status; // tolerate both names
  status?: Status;
  serviceName: string;
  startsAtISO: string;
  client: { name: string; email: string; phone?: string | null };
}) {
  const status = p.newStatus ?? p.status;
  if (!status) throw new Error("emailOnStatusChange: status missing");

  const when = formatZoned(p.startsAtISO); // ✅ consistent timezone
  const subj =
    status === "cancelled"
      ? `Booking cancelled — ${p.serviceName}`
      : `Booking completed — ${p.serviceName}`;

  const textADI = [
    `Booking ${status.toUpperCase()}`,
    ``,
    `Service: ${p.serviceName}`,
    `When:   ${when}`,
    ``,
    `Client: ${p.client.name} (${p.client.email}${p.client.phone ? ", " + p.client.phone : ""})`,
    `Booking ID: ${p.bookingId}`,
  ].join("\n");

  const textClient =
    status === "cancelled"
      ? [
          `Hi ${p.client.name},`,
          ``,
          `Your ${p.serviceName} lesson for ${when} has been CANCELLED.`,
          `If this seems wrong, reply to this email.`,
          ``,
          `Booking ID: ${p.bookingId}`,
        ].join("\n")
      : [
          `Hi ${p.client.name},`,
          ``,
          `Thanks for your ${p.serviceName} lesson (${when}).`,
          `If you’d like to book again, reply to this email or use the booking page.`,
          ``,
          `Booking ID: ${p.bookingId}`,
        ].join("\n");

  // To ADI
  await resend.emails.send({
    from: `TheDrivingSchoolDublin <${fromEmail}>`,
    to: adiEmail,
    replyTo: adiEmail,
    subject: subj,
    text: textADI,
  });

  // To Client
  await resend.emails.send({
    from: `TheDrivingSchoolDublin <${fromEmail}>`,
    to: p.client.email,
    replyTo: adiEmail,
    subject: subj,
    text: textClient,
  });
}
