This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Booking checkout setup

The `/book` route contains a custom three-step booking flow. In local and Vercel
preview environments it shows labelled preview slots until Cal.com is connected.
Production does not expose preview availability.

To enable live booking:

1. Create Standard (60 min), Pre-Test (120 min), and Refresher (60 min) Cal.com
   event types. Set a 30-minute after-event buffer on each one. Add booking fields
   with the slugs `pickupAddress`, `eircode`, `carChoice`, `paymentChoice`, and
   `outstandingCash` so operational details are copied to the calendar booking.
2. Connect the instructor's Google Calendar as both a conflict calendar and the
   destination calendar in Cal.com.
3. Apply `supabase/migrations/202608040001_booking_checkout.sql` to Supabase.
4. Copy `.env.example` to `.env.local` and fill the Cal.com, Supabase, and Stripe
   values. Keep every server secret out of `NEXT_PUBLIC_` variables.
5. Register `/api/stripe/webhook` in Stripe for
   `payment_intent.succeeded` events and set `STRIPE_WEBHOOK_SECRET`.
