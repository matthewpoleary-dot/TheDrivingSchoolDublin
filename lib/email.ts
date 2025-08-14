// lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const fromEmail = process.env.FROM_EMAIL!;   // e.g. onboarding@resend.dev (for dev) or bookings@yourdomain.com (prod)
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
  const when = new Date(p.startsAtISO).toLocaleString();
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
    reply_to: adiEmail, // Resend Node SDK uses snake_case
    subject: `New booking — ${p.serviceName}`,
    text: `New booking received\n\n${details}`,
  });

  // To Client
  await resend.emails.send({
    from: `TheDrivingSchoolDublin <${fromEmail}>`,
    to: p.client.email,
    reply_to: adiEmail,
    subject: `Your lesson is booked — ${p.serviceName}`,
    text: [
      `Hi ${p.client.name},`,
      ``,
      `Your lesson is confirmed.`,
      details,
      ``,
      `If you need to change your booking, just reply to this email.`,
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

  const when = new Date(p.startsAtISO).toLocaleString();
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
    reply_to: adiEmail,
    subject: subj,
    text: textADI,
  });

  // To Client
  await resend.emails.send({
    from: `TheDrivingSchoolDublin <${fromEmail}>`,
    to: p.client.email,
    reply_to: adiEmail,
    subject: subj,
    text: textClient,
  });
}
