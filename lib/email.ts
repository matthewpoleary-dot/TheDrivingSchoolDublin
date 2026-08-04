/**
 * Transactional email.
 *
 * Every send is best-effort and returns a result rather than throwing. A
 * booking that is paid for and in the database is a real booking even if
 * Resend is having a bad afternoon, and the customer will still see their
 * confirmation on screen. Failures are logged and surfaced in the admin
 * screen so the instructor knows to follow up by phone.
 *
 * Confirmations carry a real .ics attachment, so the lesson lands in the
 * pupil's own calendar with a reminder, whatever phone they use.
 */

import { Resend } from "resend";
import { createEvent, type EventAttributes } from "ics";
import { SITE, CONTACT, INSTRUCTOR, BOOKING_POLICY, formatEuro } from "@/lib/config";
import { formatDateTimeInZone, utcToZonedParts } from "@/lib/time";

export type SendResult = { ok: true; id?: string } | { ok: false; error: string };

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.FROM_EMAIL);
}

let cached: Resend | null = null;

function resend(): Resend {
  if (!cached) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set. See docs/SETUP.md.");
    cached = new Resend(key);
  }
  return cached;
}

function fromAddress(): string {
  return process.env.FROM_EMAIL || `bookings@${new URL(SITE.url).hostname}`;
}

function instructorInbox(): string {
  return process.env.ADI_EMAIL || CONTACT.email;
}

// ---------------------------------------------------------------------------
// Presentation
// ---------------------------------------------------------------------------

const RED = "#E4002B";
const INK = "#141414";

function shell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#F4F1EC;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EC;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E3DED6;">
        <tr><td style="padding:28px 32px 20px;border-bottom:3px solid ${INK};">
          <span style="display:inline-block;background:${INK};color:#fff;font:700 13px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;padding:9px 11px;">THE DRIVING SCHOOL</span>
          <span style="display:inline-block;background:${RED};color:#fff;font:700 13px/1 Helvetica,Arial,sans-serif;letter-spacing:.14em;padding:9px 11px;">DUBLIN</span>
        </td></tr>
        <tr><td style="padding:32px;font:400 16px/1.6 Helvetica,Arial,sans-serif;color:${INK};">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:22px 32px 28px;border-top:1px solid #E3DED6;font:400 13px/1.6 Helvetica,Arial,sans-serif;color:#6B6560;">
          ${escapeHtml(SITE.name)} &middot;
          <a href="tel:${CONTACT.phoneE164}" style="color:#6B6560;">${CONTACT.phoneDisplay}</a> &middot;
          <a href="${SITE.url}" style="color:#6B6560;">${new URL(SITE.url).hostname}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function detailRows(rows: Array<[string, string | null | undefined]>): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;border-collapse:collapse;">
    ${rows
      .filter(([, value]) => Boolean(value))
      .map(
        ([label, value]) => `<tr>
          <td style="padding:9px 0;border-bottom:1px solid #EFEBE4;font:700 12px/1.4 Helvetica,Arial,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:#8A837C;width:38%;vertical-align:top;">${escapeHtml(
            label
          )}</td>
          <td style="padding:9px 0;border-bottom:1px solid #EFEBE4;font:400 15px/1.5 Helvetica,Arial,sans-serif;color:${INK};">${escapeHtml(
            String(value)
          )}</td>
        </tr>`
      )
      .join("")}
  </table>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${INK};color:#fff;text-decoration:none;font:700 14px/1 Helvetica,Arial,sans-serif;letter-spacing:.05em;padding:15px 24px;margin:8px 0;">${escapeHtml(
    label
  )}</a>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Calendar attachment
// ---------------------------------------------------------------------------

export type BookingEmailData = {
  reference: string;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupAddress?: string | null;
  testCentre?: string | null;
  transmission?: string | null;
  notes?: string | null;
  startsAt: Date;
  endsAt: Date;
  priceCents: number;
  depositCents: number;
  manageToken: string;
};

function manageUrl(token: string): string {
  return `${SITE.url}/booking/${token}`;
}

function buildIcs(booking: BookingEmailData): string | null {
  const start = utcToZonedParts(booking.startsAt, SITE.timezone);
  const end = utcToZonedParts(booking.endsAt, SITE.timezone);

  const attributes: EventAttributes = {
    start: [start.year, start.month, start.day, start.hour, start.minute],
    end: [end.year, end.month, end.day, end.hour, end.minute],
    startInputType: "local",
    endInputType: "local",
    title: `${booking.serviceName} with ${INSTRUCTOR.firstName}`,
    description: [
      `Booking reference ${booking.reference}.`,
      booking.pickupAddress ? `Pick-up: ${booking.pickupAddress}` : null,
      booking.testCentre ? `Test centre: ${booking.testCentre}` : null,
      `Manage or cancel: ${manageUrl(booking.manageToken)}`,
    ]
      .filter(Boolean)
      .join("\n"),
    location: booking.pickupAddress || booking.testCentre || "Dublin",
    url: manageUrl(booking.manageToken),
    organizer: { name: SITE.name, email: instructorInbox() },
    productId: SITE.name,
    uid: `${booking.reference}@${new URL(SITE.url).hostname}`,
    alarms: [
      { action: "display", description: "Driving lesson tomorrow", trigger: { hours: 24, before: true } },
      { action: "display", description: "Driving lesson in 1 hour", trigger: { hours: 1, before: true } },
    ],
  };

  const { error, value } = createEvent(attributes);
  if (error || !value) {
    console.error("[email] failed to build .ics", error);
    return null;
  }
  return value;
}

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------

type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  icsContent?: string | null;
  icsFilename?: string;
};

async function send(args: SendArgs): Promise<SendResult> {
  if (!isEmailConfigured()) {
    console.warn(`[email] not configured, skipping "${args.subject}"`);
    return { ok: false, error: "Email is not configured" };
  }

  try {
    const { data, error } = await resend().emails.send({
      from: `${SITE.name} <${fromAddress()}>`,
      to: Array.isArray(args.to) ? args.to : [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
      replyTo: args.replyTo ?? instructorInbox(),
      attachments: args.icsContent
        ? [
            {
              filename: args.icsFilename ?? "lesson.ics",
              content: Buffer.from(args.icsContent).toString("base64"),
              contentType: "text/calendar; method=REQUEST",
            },
          ]
        : undefined,
    });

    if (error) {
      console.error("[email] Resend rejected the send", error);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[email] send threw", message);
    return { ok: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export async function sendBookingConfirmation(b: BookingEmailData): Promise<SendResult> {
  const when = formatDateTimeInZone(b.startsAt, SITE.timezone);
  const balance = b.priceCents - b.depositCents;

  const rows: Array<[string, string | null | undefined]> = [
    ["Lesson", b.serviceName],
    ["When", when],
    ["Pick-up", b.pickupAddress],
    ["Test centre", b.testCentre],
    ["Reference", b.reference],
    ["Deposit paid", formatEuro(b.depositCents)],
    ["Balance on the day", balance > 0 ? formatEuro(balance) : null],
  ];

  const html = shell(
    `Lesson confirmed: ${when}`,
    `<h1 style="margin:0 0 6px;font:700 26px/1.2 Helvetica,Arial,sans-serif;">You're booked in.</h1>
     <p style="margin:0 0 4px;color:#5C5651;">${escapeHtml(b.customerName)}, your lesson with ${escapeHtml(
       INSTRUCTOR.firstName
     )} is confirmed.</p>
     ${detailRows(rows)}
     <p style="margin:0 0 6px;">${escapeHtml(
       `Free cancellation up to ${BOOKING_POLICY.freeCancellationHours} hours before. After that the deposit is not refunded.`
     )}</p>
     ${button(manageUrl(b.manageToken), "View or cancel this lesson")}
     <p style="margin:18px 0 0;color:#5C5651;font-size:14px;">${escapeHtml(
       `Anything at all, ring or text ${CONTACT.phoneDisplay}.`
     )}</p>`
  );

  const text = [
    `You're booked in.`,
    ``,
    `${b.serviceName}`,
    `${when}`,
    b.pickupAddress ? `Pick-up: ${b.pickupAddress}` : null,
    b.testCentre ? `Test centre: ${b.testCentre}` : null,
    `Reference: ${b.reference}`,
    `Deposit paid: ${formatEuro(b.depositCents)}`,
    balance > 0 ? `Balance on the day: ${formatEuro(balance)}` : null,
    ``,
    `Free cancellation up to ${BOOKING_POLICY.freeCancellationHours} hours before.`,
    `Manage: ${manageUrl(b.manageToken)}`,
    ``,
    `Any problem, ring or text ${CONTACT.phoneDisplay}.`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  return send({
    to: b.customerEmail,
    subject: `Lesson confirmed: ${when}`,
    html,
    text,
    icsContent: buildIcs(b),
    icsFilename: `${b.reference}.ics`,
  });
}

export async function sendInstructorNotification(b: BookingEmailData): Promise<SendResult> {
  const when = formatDateTimeInZone(b.startsAt, SITE.timezone);

  const rows: Array<[string, string | null | undefined]> = [
    ["Lesson", b.serviceName],
    ["When", when],
    ["Pupil", b.customerName],
    ["Phone", b.customerPhone],
    ["Email", b.customerEmail],
    ["Pick-up", b.pickupAddress],
    ["Test centre", b.testCentre],
    ["Transmission", b.transmission],
    ["Notes", b.notes],
    ["Reference", b.reference],
  ];

  return send({
    to: instructorInbox(),
    replyTo: b.customerEmail,
    subject: `New booking: ${b.customerName}, ${when}`,
    html: shell(
      "New booking",
      `<h1 style="margin:0 0 6px;font:700 26px/1.2 Helvetica,Arial,sans-serif;">New booking</h1>
       <p style="margin:0 0 4px;color:#5C5651;">Deposit of ${formatEuro(
         b.depositCents
       )} paid. It is already on your calendar.</p>
       ${detailRows(rows)}`
    ),
    text: rows
      .filter(([, v]) => Boolean(v))
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n"),
    icsContent: buildIcs(b),
    icsFilename: `${b.reference}.ics`,
  });
}

export async function sendCancellationEmails(
  b: BookingEmailData,
  options: { cancelledBy: string; refundedCents: number | null }
): Promise<void> {
  const when = formatDateTimeInZone(b.startsAt, SITE.timezone);

  const refundLine =
    options.refundedCents && options.refundedCents > 0
      ? `Your ${formatEuro(
          options.refundedCents
        )} deposit has been refunded and will be back with you in five to ten days.`
      : `As this is inside the ${BOOKING_POLICY.freeCancellationHours}-hour window, the deposit is not refunded.`;

  await send({
    to: b.customerEmail,
    subject: `Lesson cancelled: ${when}`,
    html: shell(
      "Lesson cancelled",
      `<h1 style="margin:0 0 6px;font:700 26px/1.2 Helvetica,Arial,sans-serif;">Lesson cancelled</h1>
       <p style="margin:0 0 14px;color:#5C5651;">Your ${escapeHtml(
         b.serviceName
       )} on ${escapeHtml(when)} has been cancelled.</p>
       <p style="margin:0 0 14px;">${escapeHtml(refundLine)}</p>
       ${button(`${SITE.url}/book`, "Book another lesson")}`
    ),
    text: `Lesson cancelled: ${b.serviceName} on ${when}.\n\n${refundLine}\n\nBook again: ${SITE.url}/book`,
  });

  await send({
    to: instructorInbox(),
    subject: `Cancelled: ${b.customerName}, ${when}`,
    html: shell(
      "Booking cancelled",
      `<h1 style="margin:0 0 6px;font:700 26px/1.2 Helvetica,Arial,sans-serif;">Booking cancelled</h1>
       ${detailRows([
         ["Lesson", b.serviceName],
         ["When", when],
         ["Pupil", b.customerName],
         ["Phone", b.customerPhone],
         ["Cancelled by", options.cancelledBy],
         ["Refunded", options.refundedCents ? formatEuro(options.refundedCents) : "No"],
         ["Reference", b.reference],
       ])}
       <p style="margin:0;color:#5C5651;">The slot is back on the calendar.</p>`
    ),
    text: `Cancelled: ${b.customerName}, ${when} (${b.reference}). Slot released.`,
  });
}

export async function sendLessonReminder(b: BookingEmailData): Promise<SendResult> {
  const when = formatDateTimeInZone(b.startsAt, SITE.timezone);

  return send({
    to: b.customerEmail,
    subject: `Reminder: driving lesson ${when}`,
    html: shell(
      "Lesson reminder",
      `<h1 style="margin:0 0 6px;font:700 26px/1.2 Helvetica,Arial,sans-serif;">Lesson tomorrow</h1>
       ${detailRows([
         ["Lesson", b.serviceName],
         ["When", when],
         ["Pick-up", b.pickupAddress],
         ["Reference", b.reference],
       ])}
       <p style="margin:0 0 14px;">Bring your learner permit. Without it the lesson cannot go ahead.</p>
       ${button(manageUrl(b.manageToken), "View this lesson")}`
    ),
    text: `Reminder: ${b.serviceName} on ${when}. Bring your learner permit.\n${manageUrl(
      b.manageToken
    )}`,
  });
}

export async function sendEnquiryEmail(enquiry: {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
}): Promise<SendResult> {
  return send({
    to: instructorInbox(),
    replyTo: enquiry.email,
    subject: `Website enquiry: ${enquiry.name}`,
    html: shell(
      "Website enquiry",
      `<h1 style="margin:0 0 6px;font:700 26px/1.2 Helvetica,Arial,sans-serif;">Website enquiry</h1>
       ${detailRows([
         ["Name", enquiry.name],
         ["Email", enquiry.email],
         ["Phone", enquiry.phone],
         ["Subject", enquiry.subject],
       ])}
       <p style="margin:0;white-space:pre-wrap;">${escapeHtml(enquiry.message)}</p>`
    ),
    text: `${enquiry.name} <${enquiry.email}> ${enquiry.phone ?? ""}\n\n${enquiry.message}`,
  });
}
