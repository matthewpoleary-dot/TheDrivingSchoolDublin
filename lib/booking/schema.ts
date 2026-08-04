import { z } from "zod";

export const serviceCodeSchema = z.enum([
  "standard",
  "pre_test",
  "refresher",
]);

export const paymentChoiceSchema = z.enum(["full", "deposit_cash"]);

export const carChoiceSchema = z.enum([
  "manual_instructor",
  "automatic_student",
]);

export const bookingIntentSchema = z.object({
  serviceCode: serviceCodeSchema,
  slotStart: z.string().datetime({ offset: true }),
  paymentChoice: paymentChoiceSchema,
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(8).max(25),
  pickupAddress: z.string().trim().min(10).max(300),
  eircode: z.string().trim().max(10).optional().default(""),
  carChoice: carChoiceSchema,
  consent: z.literal(true),
});
