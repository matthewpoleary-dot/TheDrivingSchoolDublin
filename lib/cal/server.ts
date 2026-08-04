import "server-only";
import type { AvailableSlot, ServiceCode } from "@/lib/booking/types";

const CAL_API_URL = "https://api.cal.com/v2";

const EVENT_TYPE_ENV: Record<ServiceCode, string> = {
  standard: "CAL_STANDARD_EVENT_TYPE_ID",
  pre_test: "CAL_PRETEST_EVENT_TYPE_ID",
  refresher: "CAL_REFRESHER_EVENT_TYPE_ID",
};

function headers(version: "2024-09-04" | "2026-02-25") {
  const apiKey = process.env.CAL_API_KEY;
  if (!apiKey) throw new Error("Cal.com is not configured");

  return {
    Authorization: `Bearer ${apiKey}`,
    "cal-api-version": version,
    "Content-Type": "application/json",
  };
}

export function getEventTypeId(serviceCode: ServiceCode): number {
  const value = process.env[EVENT_TYPE_ENV[serviceCode]];
  const id = Number(value);
  if (!value || !Number.isInteger(id) || id <= 0) {
    throw new Error(`Missing ${EVENT_TYPE_ENV[serviceCode]}`);
  }
  return id;
}

export function isCalConfigured(serviceCode: ServiceCode): boolean {
  try {
    return Boolean(process.env.CAL_API_KEY && getEventTypeId(serviceCode));
  } catch {
    return false;
  }
}

export async function getCalSlots(input: {
  serviceCode: ServiceCode;
  date: string;
}): Promise<AvailableSlot[]> {
  const query = new URLSearchParams({
    eventTypeId: String(getEventTypeId(input.serviceCode)),
    start: input.date,
    end: input.date,
    timeZone: "Europe/Dublin",
    format: "range",
  });

  const response = await fetch(`${CAL_API_URL}/slots?${query}`, {
    headers: headers("2024-09-04"),
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Cal.com availability request failed");
  const payload = (await response.json()) as {
    data?: Record<string, AvailableSlot[]>;
  };
  return Object.values(payload.data ?? {}).flat();
}

export async function reserveCalSlot(input: {
  serviceCode: ServiceCode;
  slotStart: string;
  durationMinutes: number;
}) {
  const response = await fetch(`${CAL_API_URL}/slots/reservations`, {
    method: "POST",
    headers: headers("2024-09-04"),
    body: JSON.stringify({
      eventTypeId: getEventTypeId(input.serviceCode),
      slotStart: input.slotStart,
      slotDuration: input.durationMinutes,
      reservationDuration: 10,
    }),
  });

  if (!response.ok) {
    throw new Error("That time has just been taken. Please choose another.");
  }

  return response.json() as Promise<{
    data: {
      reservationUid: string;
      reservationUntil: string;
    };
  }>;
}

export async function createCalBooking(input: {
  eventTypeId: number;
  slotStart: string;
  durationMinutes: number;
  name: string;
  email: string;
  phone: string;
  pickupAddress: string;
  eircode: string | null;
  carChoice: string;
  paymentChoice: string;
  outstandingCashCents: number;
  bookingIntentId: string;
  stripePaymentIntentId: string;
}) {
  const response = await fetch(`${CAL_API_URL}/bookings`, {
    method: "POST",
    headers: headers("2026-02-25"),
    body: JSON.stringify({
      eventTypeId: input.eventTypeId,
      start: input.slotStart,
      lengthInMinutes: input.durationMinutes,
      attendee: {
        name: input.name,
        email: input.email,
        phoneNumber: input.phone,
        timeZone: "Europe/Dublin",
        language: "en",
      },
      location: { type: "address" },
      bookingFieldsResponses: {
        pickupAddress: input.pickupAddress,
        eircode: input.eircode ?? "",
        carChoice: input.carChoice,
        paymentChoice: input.paymentChoice,
        outstandingCash: String(input.outstandingCashCents),
      },
      metadata: {
        bookingIntentId: input.bookingIntentId,
        stripePaymentIntentId: input.stripePaymentIntentId,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Cal.com booking creation failed: ${detail}`);
  }

  return response.json() as Promise<{ data: { uid: string } }>;
}
