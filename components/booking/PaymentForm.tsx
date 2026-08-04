"use client";

import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { formatEuro } from "@/lib/booking/catalog";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export default function PaymentForm(props: {
  clientSecret: string;
  bookingIntentId: string;
  amountCents: number;
  onBack: () => void;
}) {
  if (!stripePromise) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <h2 className="text-xl font-black">Stripe setup required</h2>
        <p className="mt-2 text-sm leading-6">
          Add the Stripe publishable key before accepting a live payment.
        </p>
        <button type="button" onClick={props.onBack} className="mt-5 text-sm font-bold underline">
          Return to details
        </button>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: props.clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#d90429",
            colorText: "#111827",
            borderRadius: "12px",
            fontFamily: "Arial, Helvetica, sans-serif",
            spacingUnit: "5px",
          },
        },
      }}
    >
      <PaymentElementForm {...props} />
    </Elements>
  );
}
function PaymentElementForm({
  bookingIntentId,
  amountCents,
  onBack,
}: {
  bookingIntentId: string;
  amountCents: number;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError("");
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/book/success?booking=${bookingIntentId}`,
      },
    });

    if (result.error) {
      setError(result.error.message ?? "Payment could not be completed.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="mb-7">
        <p className="text-sm font-semibold text-red-600">Secure payment</p>
        <h2 className="mt-1 text-3xl font-black tracking-[-0.03em] text-gray-950">
          Pay {formatEuro(amountCents)}
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Your time is held for ten minutes while payment is completed.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <PaymentElement options={{ layout: "accordion" }} />
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="mt-7 flex items-center justify-between gap-4">
        <button type="button" onClick={onBack} className="px-2 py-3 text-sm font-bold text-gray-600 hover:text-gray-950">
          ← Back
        </button>
        <button type="submit" disabled={!stripe || submitting} className="rounded-xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:opacity-60">
          {submitting ? "Processing…" : `Pay ${formatEuro(amountCents)}`}
        </button>
      </div>
    </form>
  );
}
