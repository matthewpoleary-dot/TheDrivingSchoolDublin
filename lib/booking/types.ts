export type ServiceCode = "standard" | "pre_test" | "refresher";

export type PaymentChoice = "full" | "deposit_cash";

export type CarChoice = "manual_instructor" | "automatic_student";

export type BookingStep = 1 | 2 | 3;

export interface LessonService {
  code: ServiceCode;
  name: string;
  eyebrow: string;
  description: string;
  durationMinutes: number;
  bufferAfterMinutes: number;
  priceCents: number;
  depositRateBps: number;
  highlights: readonly string[];
}

export interface BookingQuote {
  totalCents: number;
  payableNowCents: number;
  outstandingCashCents: number;
  currency: "eur";
}

export interface BookingDetails {
  name: string;
  email: string;
  phone: string;
  pickupAddress: string;
  eircode: string;
  carChoice: CarChoice;
  paymentChoice: PaymentChoice;
  consent: boolean;
}

export interface BookingDraft {
  serviceCode: ServiceCode | null;
  slotStart: string | null;
  details: BookingDetails;
}

export interface AvailableSlot {
  start: string;
  end: string;
}
