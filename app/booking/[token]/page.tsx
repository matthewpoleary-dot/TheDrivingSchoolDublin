import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Plate, Check, ArrowRight } from "@/components/brand";
import ManageBooking from "@/components/ManageBooking";
import { loadBookingByToken, serviceName } from "@/lib/booking-service";
import { BOOKING_POLICY, CONTACT, contactLinks, formatPrice } from "@/lib/config";
import { TIMEZONE, formatDateInZone, formatTimeInZone } from "@/lib/time";

export const metadata: Metadata = {
  title: "Your booking",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The pupil's own page for a booking, reachable only with the manage token
 * from their email. Deliberately noindex, and the token is the only
 * credential, which is why it is 48 hex characters of CSPRNG output.
 */
export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { token } = await params;
  const { paid } = await searchParams;

  const booking = await loadBookingByToken(token);
  if (!booking) notFound();

  const startsAt = new Date(booking.starts_at);
  const endsAt = new Date(booking.ends_at);
  const isCancelled = booking.status === "cancelled";
  const isPast = startsAt.getTime() < Date.now();
  const balance = booking.price_cents - booking.deposit_cents;
  const hoursUntil = (startsAt.getTime() - Date.now()) / 3_600_000;
  const canCancelFree = hoursUntil >= BOOKING_POLICY.freeCancellationHours;

  return (
    <Container size="narrow" className="py-12 sm:py-16">
      {paid === "1" && !isCancelled && (
        <div className="mb-8 border-2 border-pass bg-pass-wash p-5">
          <p className="flex items-center gap-2 font-extrabold text-pass">
            <Check /> Payment received
          </p>
          <p className="mt-1 text-sm">
            Your confirmation and a calendar invite are on their way to{" "}
            {booking.customer_email}.
          </p>
        </div>
      )}

      <div className="flex items-start gap-4">
        <Plate letter={isCancelled ? "N" : "L"} size="lg" className="mt-1" />
        <div className="min-w-0">
          <p className="eyebrow">Booking {booking.reference}</p>
          <h1 className="mt-2 text-[clamp(1.75rem,5vw,2.75rem)] font-extrabold leading-[0.98] tracking-[-0.03em]">
            {isCancelled ? "This lesson was cancelled." : "You are booked in."}
          </h1>
        </div>
      </div>

      <div className="panel mt-8 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-5">
          <h2 className="text-xl font-extrabold tracking-[-0.02em]">
            {serviceName(booking)}
          </h2>
          <StatusBadge status={booking.status} />
        </div>

        <dl className="mt-6 space-y-4">
          <Detail label="When">
            <span className="font-bold">{formatDateInZone(startsAt, TIMEZONE)}</span>
            <br />
            <span className="tabular">
              {formatTimeInZone(startsAt, TIMEZONE)} to {formatTimeInZone(endsAt, TIMEZONE)}
            </span>
          </Detail>

          {booking.pickup_address && (
            <Detail label="Pick-up">{booking.pickup_address}</Detail>
          )}
          {booking.test_centre && <Detail label="Test centre">{booking.test_centre}</Detail>}
          {booking.transmission && (
            <Detail label="Car">
              {booking.transmission === "manual" ? "Manual" : "Automatic"}
            </Detail>
          )}
          {booking.notes && <Detail label="Your notes">{booking.notes}</Detail>}

          <Detail label="Instructor">
            Conor &middot;{" "}
            <a href={contactLinks.tel} className="tabular font-bold underline">
              {CONTACT.phoneDisplay}
            </a>
          </Detail>
        </dl>

        <div className="mt-6 border-t-2 border-ink pt-5">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Lesson</dt>
              <dd className="tabular font-bold">{formatPrice(booking.price_cents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Deposit paid</dt>
              <dd className="tabular font-bold text-pass">
                {formatPrice(booking.deposit_cents)}
              </dd>
            </div>
            {!isCancelled && balance > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-soft">Due on the day</dt>
                <dd className="tabular font-bold">{formatPrice(balance)}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {!isCancelled && !isPast && (
        <div className="no-print mt-8">
          <ManageBooking
            token={token}
            canCancelFree={canCancelFree}
            depositCents={booking.deposit_cents}
          />
        </div>
      )}

      {isCancelled && (
        <div className="mt-8">
          <Link href="/book" className="btn btn-primary">
            Book another lesson
            <ArrowRight />
          </Link>
        </div>
      )}

      <div className="no-print mt-10 border-t-2 border-ink pt-6">
        <p className="text-sm text-ink-soft">
          Anything at all, ring or text{" "}
          <a href={contactLinks.tel} className="tabular font-bold text-ink underline">
            {CONTACT.phoneDisplay}
          </a>{" "}
          or{" "}
          <a
            href={contactLinks.whatsapp(`Hi Conor, about booking ${booking.reference}...`)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-ink underline"
          >
            message on WhatsApp
          </a>
          . Keep this page bookmarked, it is your booking.
        </p>
      </div>
    </Container>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-ink-faint">{label}</dt>
      <dd className="mt-1 leading-relaxed">{children}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { className: string; label: string }> = {
    confirmed: { className: "badge-pass", label: "Confirmed" },
    pending: { className: "badge-caution", label: "Awaiting payment" },
    held: { className: "badge-caution", label: "Holding" },
    cancelled: { className: "badge-plate", label: "Cancelled" },
    completed: { className: "badge-quiet", label: "Completed" },
    no_show: { className: "badge-plate", label: "Missed" },
    expired: { className: "badge-quiet", label: "Expired" },
  };

  const item = map[status] ?? { className: "badge-quiet", label: status };
  return <span className={`badge ${item.className}`}>{item.label}</span>;
}
