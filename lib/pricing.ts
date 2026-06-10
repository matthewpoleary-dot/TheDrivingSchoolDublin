// lib/pricing.ts
export type ServiceSlug =
  | "standard"
  | "pre-test"
  | "refresher"
  | "edt-6"
  | "edt-bundle"
  | "edt-split"           // pay 6 now, 6 later (€475 × 2 = €950)
  | "car-hire"            // legacy alias — kept for old bookings/data
  | "car-hire-centre"     // at the test centre
  | "car-hire-local"      // local pickup + drop-off
  | "car-hire-lesson";    // car hire + pre-test lesson

export type ServiceConfig = {
  slug: ServiceSlug;
  label: string;
  pricePence: number;
  durationMinutes: number;
  description: string;
};

export const SERVICES: Record<ServiceSlug, ServiceConfig> = {
  standard: {
    slug: "standard",
    label: "Standard Lesson",
    pricePence: 8000,
    durationMinutes: 60,
    description: "One-to-one tuition in a fully-equipped dual-control car.",
  },
  "pre-test": {
    slug: "pre-test",
    label: "Pre-Test Lesson",
    pricePence: 10000,
    durationMinutes: 120,
    description: "Full pre-test preparation: mock test route, manoeuvres, and examiner feedback style.",
  },
  refresher: {
    slug: "refresher",
    label: "Refresher Lesson",
    pricePence: 8000,
    durationMinutes: 60,
    description: "For licensed drivers returning to the wheel after a break.",
  },
  "edt-6": {
    slug: "edt-6",
    label: "6 Reduced EDT Lessons",
    pricePence: 45500,
    durationMinutes: 60,
    description: "The reduced EDT package: six structured hours covering the syllabus.",
  },
  "edt-bundle": {
    slug: "edt-bundle",
    label: "EDT Bundle, 12 lessons",
    pricePence: 90500,
    durationMinutes: 60,
    description: "Full 12-lesson EDT package, paid up front. Book sessions one at a time via your personal link.",
  },
  "edt-split": {
    slug: "edt-split",
    label: "EDT Bundle, split payment",
    pricePence: 47500,
    durationMinutes: 60,
    description: "Pay €475 now for lessons 1 to 6, then €475 before lessons 7 to 12. €950 total.",
  },
  "car-hire": {
    slug: "car-hire",
    label: "Car Hire for Test",
    pricePence: 15000,
    durationMinutes: 120,
    description: "Car hire for your test day.",
  },
  "car-hire-centre": {
    slug: "car-hire-centre",
    label: "Car hire at the test centre",
    pricePence: 15000,
    durationMinutes: 120,
    description: "Meet at the test centre. Roadworthy, fully insured car. Arrive early, paperwork checked.",
  },
  "car-hire-local": {
    slug: "car-hire-local",
    label: "Car hire, local pickup and drop-off",
    pricePence: 20000,
    durationMinutes: 150,
    description: "We collect you and drop you back. Roadworthy, fully insured car. Mon to Fri tests.",
  },
  "car-hire-lesson": {
    slug: "car-hire-lesson",
    label: "Car hire plus pre-test lesson",
    pricePence: 24500,
    durationMinutes: 180,
    description: "A pre-test lesson the day of, then the car for your test. Best preparation.",
  },
};

export function formatPrice(pence: number): string {
  return `€${(pence / 100).toFixed(2).replace(".00", "")}`;
}
