// lib/pricing.ts
export type ServiceSlug =
  | "standard"
  | "pre-test"
  | "refresher"
  | "edt-6"
  | "edt-bundle"
  | "car-hire";

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
    description: "Completes the reduced EDT syllabus over six structured hours.",
  },
  "edt-bundle": {
    slug: "edt-bundle",
    label: "EDT Bundle (12 lessons)",
    pricePence: 90500,
    durationMinutes: 60,
    description: "Full 12-lesson EDT package. Book your sessions one at a time via your personal link.",
  },
  "car-hire": {
    slug: "car-hire",
    label: "Car Hire for Test",
    pricePence: 15000,
    durationMinutes: 120,
    description: "Car hire at the test centre (from €150). Price confirmed at booking.",
  },
};

export function formatPrice(pence: number): string {
  return `€${(pence / 100).toFixed(2).replace(".00", "")}`;
}
