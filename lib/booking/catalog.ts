import type {
  BookingQuote,
  LessonService,
  PaymentChoice,
  ServiceCode,
} from "@/lib/booking/types";

export const SERVICE_CATALOG: Record<ServiceCode, LessonService> = {
  standard: {
    code: "standard",
    name: "Standard lesson",
    eyebrow: "Build strong foundations",
    description:
      "A focused one-to-one lesson shaped around your current level and test goals.",
    durationMinutes: 60,
    bufferAfterMinutes: 30,
    priceCents: 8_000,
    depositRateBps: 2_500,
    highlights: ["60 minutes tuition", "Local pickup included"],
  },
  pre_test: {
    code: "pre_test",
    name: "Pre-test session",
    eyebrow: "Arrive test-ready",
    description:
      "A longer, high-intensity session covering test routes, manoeuvres and final refinements.",
    durationMinutes: 120,
    bufferAfterMinutes: 30,
    priceCents: 10_000,
    depositRateBps: 2_500,
    highlights: ["120 minutes tuition", "Test-route preparation"],
  },
  refresher: {
    code: "refresher",
    name: "Refresher lesson",
    eyebrow: "Return with confidence",
    description:
      "Calm, practical coaching for qualified drivers returning after time away or tackling new roads.",
    durationMinutes: 60,
    bufferAfterMinutes: 30,
    priceCents: 8_000,
    depositRateBps: 2_500,
    highlights: ["60 minutes tuition", "Paced around your needs"],
  },
};

export const SERVICES = Object.values(SERVICE_CATALOG);

export function calculateQuote(
  service: LessonService,
  paymentChoice: PaymentChoice,
): BookingQuote {
  const totalCents = service.priceCents;
  const payableNowCents =
    paymentChoice === "full"
      ? totalCents
      : Math.ceil((totalCents * service.depositRateBps) / 10_000);

  return {
    totalCents,
    payableNowCents,
    outstandingCashCents: totalCents - payableNowCents,
    currency: "eur",
  };
}

export function formatEuro(cents: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
