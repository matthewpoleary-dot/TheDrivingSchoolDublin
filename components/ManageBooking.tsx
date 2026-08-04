"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BOOKING_POLICY, CONTACT, contactLinks, formatPrice } from "@/lib/config";

/**
 * Cancel controls on the pupil's booking page.
 *
 * Two-step on purpose. Cancelling a lesson inside the notice window costs real
 * money, so the consequence is stated in the confirmation step rather than
 * buried in terms, and the destructive button is never the one under a
 * thumb by accident.
 */
export default function ManageBooking({
  token,
  canCancelFree,
  depositCents,
}: {
  token: string;
  canCancelFree: boolean;
  depositCents: number;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/${token}/cancel`, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not cancel. Please ring us.");
        return;
      }

      router.refresh();
    } catch {
      setError(
        `Could not reach us just now. Please ring ${CONTACT.phoneDisplay} and we will cancel it for you.`
      );
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <div className="panel-quiet p-6">
        <h2 className="font-extrabold">Need to change something?</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          To move a lesson, message Conor directly and he will shift it, usually within the
          hour. Cancelling here frees the slot for someone else.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href={contactLinks.whatsapp("Hi Conor, could I move my lesson please?")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ink text-sm"
          >
            Ask to move it
          </a>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="btn btn-quiet text-sm"
          >
            Cancel this lesson
          </button>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-ink-faint">
          {canCancelFree
            ? `You are outside the ${BOOKING_POLICY.freeCancellationHours}-hour window, so cancelling refunds your ${formatPrice(depositCents)} deposit in full.`
            : `You are inside the ${BOOKING_POLICY.freeCancellationHours}-hour window, so the ${formatPrice(depositCents)} deposit is not refundable.`}
        </p>
      </div>
    );
  }

  return (
    <div className="border-2 border-plate bg-plate-wash p-6">
      <h2 className="font-extrabold">Cancel this lesson?</h2>
      <p className="mt-1.5 text-sm leading-relaxed">
        {canCancelFree ? (
          <>
            Your {formatPrice(depositCents)} deposit will be refunded to the card you paid
            with. It usually lands within five to ten days.
          </>
        ) : (
          <>
            This is inside the {BOOKING_POLICY.freeCancellationHours}-hour window, so the{" "}
            {formatPrice(depositCents)} deposit will <strong>not</strong> be refunded. If
            something has genuinely gone wrong, ring Conor instead, he is reasonable.
          </>
        )}
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm font-bold text-plate-dark">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={cancel}
          disabled={busy}
          className="btn bg-plate text-white shadow-[3px_3px_0_#141414] text-sm"
        >
          {busy ? "Cancelling..." : "Yes, cancel it"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={busy}
          className="btn btn-quiet text-sm"
        >
          Keep my lesson
        </button>
      </div>
    </div>
  );
}
