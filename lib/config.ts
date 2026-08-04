/**
 * Single source of truth for everything about the business.
 *
 * Copy, phone numbers, prices and areas are edited here and nowhere else, so
 * the instructor can hand a change to anyone and have it land consistently on
 * every page, every email and every piece of structured data.
 */

export const SITE = {
  name: "The Driving School Dublin",
  shortName: "TDS Dublin",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://thedrivingschooldublin.com",
  locale: "en_IE",
  timezone: "Europe/Dublin",
  description:
    "Driving lessons in Dublin with a former RSA driving tester. EDT, pre-test lessons and car hire for your test. Book online in under a minute.",
} as const;

export const INSTRUCTOR = {
  firstName: "Conor",
  /** Shown wherever the credential matters, which is nearly everywhere. */
  credential: "RSA-approved ADI and former RSA driving tester",
  shortCredential: "Ex-RSA tester",
  bio: "Conor is an Approved Driving Instructor and a former RSA driving tester. He worked in the test centres at Tallaght, Dun Laoghaire and the old Churchtown centre, so he knows exactly how the test is marked and what loses people marks on the day.",
} as const;

export const CONTACT = {
  /** E.164, used for tel: and WhatsApp links. Never hand-write these elsewhere. */
  phoneE164: "+353860235666",
  phoneDisplay: "086 023 5666",
  email: "thedrivingschooldublin@gmail.com",
  whatsappNumber: "353860235666",
} as const;

export const contactLinks = {
  tel: `tel:${CONTACT.phoneE164}`,
  email: `mailto:${CONTACT.email}`,
  whatsapp: (message = "Hi Conor, I'd like to book a driving lesson.") =>
    `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`,
} as const;

/** Displayed opening hours. Real bookable availability comes from the database. */
export const OPENING_HOURS = {
  display: "Monday to Saturday, 8am to 6pm",
  schemaOrg: ["Mo-Sa 08:00-18:00"],
} as const;

export const AREAS = [
  "Dublin 2",
  "Dublin 4",
  "Dublin 6",
  "Dublin 6W",
  "Dublin 8",
  "Dublin 10",
  "Dublin 12",
  "Dublin 14",
  "Dublin 16",
  "Dublin 18",
] as const;

export const TEST_CENTRES = ["Tallaght", "Dun Laoghaire", "Churchtown"] as const;

/**
 * Booking policy. These are enforced in code, not just described in copy.
 * @see lib/availability.ts and app/api/bookings
 */
export const BOOKING_POLICY = {
  /** A slot must start at least this far in the future to be bookable. */
  minimumNoticeHours: 12,
  /** How far ahead the calendar opens. */
  bookingHorizonDays: 60,
  /** Free cancellation up to this many hours before the lesson. */
  freeCancellationHours: 24,
  /** How long a slot is held while the customer is in Stripe Checkout. */
  holdMinutes: 15,
  /** Deposit taken at booking, in cents. Balance is paid to the instructor. */
  depositCents: 2000,
} as const;

export type LessonCategory = "lesson" | "edt" | "pretest" | "carhire" | "refresher";

export type LessonType = {
  /** Stable slug. Must match the `services.slug` column in the database. */
  slug: string;
  name: string;
  category: LessonCategory;
  /** Chargeable lesson length in minutes, excluding the buffer after. */
  durationMinutes: number;
  /** Total price in cents. */
  priceCents: number;
  /** Shown under the price, e.g. "per hour". */
  priceUnit: string;
  summary: string;
  /** Bullet points on the pricing card. */
  includes: readonly string[];
  /** Bookable online, or enquiry-only because it needs a conversation first. */
  bookable: boolean;
  /** Reason shown when bookable is false. */
  enquiryReason?: string;
  /** Ask for a pickup address at booking. */
  needsPickup: boolean;
  /** Ask which test centre. */
  needsTestCentre: boolean;
  popular?: boolean;
};

/**
 * The lesson catalogue.
 *
 * Prices carried over from the previous site, verified against app/prices.
 * Weekend rates are deliberately not published; they are agreed in
 * conversation. Do not add them back thinking it is an oversight.
 */
export const LESSON_TYPES: readonly LessonType[] = [
  {
    slug: "standard-lesson",
    name: "Standard lesson",
    category: "lesson",
    durationMinutes: 60,
    priceCents: 8000,
    priceUnit: "per hour",
    summary:
      "One-to-one tuition in a fully insured dual-control car, built around what you actually need to work on.",
    includes: [
      "60 minutes of driving, not admin",
      "Pick-up and drop-off in your area",
      "Written notes on what to practise",
    ],
    bookable: true,
    needsPickup: true,
    needsTestCentre: false,
  },
  {
    slug: "pre-test-lesson",
    name: "Pre-test lesson",
    category: "pretest",
    durationMinutes: 90,
    priceCents: 10000,
    priceUnit: "per session",
    summary:
      "A full mock test on the real routes, marked the way an examiner marks it, by someone who used to do the marking.",
    includes: [
      "Mock test on the actual test routes",
      "Marked to the RSA sheet, fault by fault",
      "Debrief on exactly what would have failed you",
    ],
    bookable: true,
    needsPickup: true,
    needsTestCentre: true,
    popular: true,
  },
  {
    slug: "edt-single",
    name: "Single EDT lesson",
    category: "edt",
    durationMinutes: 60,
    priceCents: 8000,
    priceUnit: "per lesson",
    summary:
      "One of the twelve mandatory Essential Driver Training lessons, logged to your RSA logbook on the day.",
    includes: [
      "Counts towards your twelve EDT lessons",
      "Logged to your RSA logbook immediately",
      "Covers the full syllabus for that lesson",
    ],
    bookable: true,
    needsPickup: true,
    needsTestCentre: false,
  },
  {
    slug: "refresher-lesson",
    name: "Refresher lesson",
    category: "refresher",
    durationMinutes: 60,
    priceCents: 8000,
    priceUnit: "per hour",
    summary:
      "For licence holders who have been off the road, or who never quite got comfortable. No judgement, no rush.",
    includes: [
      "Start wherever you actually are",
      "Motorway, night and city driving if you want it",
      "Quiet areas first if nerves are the issue",
    ],
    bookable: true,
    needsPickup: true,
    needsTestCentre: false,
  },
  {
    slug: "edt-bundle",
    name: "Full EDT programme",
    category: "edt",
    durationMinutes: 60,
    priceCents: 0,
    priceUnit: "twelve lessons",
    summary:
      "All twelve mandatory EDT lessons, scheduled as a block so you are not chasing slots every week.",
    includes: [
      "All twelve EDT lessons",
      "Scheduled in advance around you",
      "Logbook kept up to date throughout",
    ],
    bookable: false,
    enquiryReason:
      "Priced and scheduled as a block, so it is worth a two-minute conversation first.",
    needsPickup: true,
    needsTestCentre: false,
  },
  {
    slug: "car-hire-test",
    name: "Car hire for your test",
    category: "carhire",
    durationMinutes: 120,
    priceCents: 15000,
    priceUnit: "from",
    summary:
      "Use the dual-control car for your test, roadworthy and fully insured, with the paperwork checked before you go in.",
    includes: [
      "From EUR 150 at the test centre",
      "From EUR 200 with local pick-up and drop-off",
      "From EUR 245 including a pre-test lesson",
    ],
    bookable: false,
    enquiryReason:
      "Priced by test centre and pick-up, and it has to be matched to your test time.",
    needsPickup: true,
    needsTestCentre: true,
  },
] as const;

export function lessonTypeBySlug(slug: string): LessonType | undefined {
  return LESSON_TYPES.find((l) => l.slug === slug);
}

export const BOOKABLE_LESSON_TYPES = LESSON_TYPES.filter((l) => l.bookable);

/** Format cents as euro, dropping the decimals on whole amounts. */
export function formatEuro(cents: number): string {
  const euro = cents / 100;
  return Number.isInteger(euro)
    ? `EUR ${euro.toFixed(0)}`
    : `EUR ${euro.toFixed(2)}`;
}

/** Format cents with the euro symbol, for UI where the glyph renders safely. */
export function formatPrice(cents: number): string {
  const euro = cents / 100;
  return Number.isInteger(euro) ? `€${euro.toFixed(0)}` : `€${euro.toFixed(2)}`;
}
